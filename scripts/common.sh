#!/bin/bash

# Check for required dependencies: jq, curl, osmtogeojson
check_dependencies() {
    for cmd in jq curl; do
        if ! command -v "$cmd" &>/dev/null; then
            echo "Error: Required dependency '$cmd' is not installed"
            exit 1
        fi
    done
}

# Check if output file was created and print its size
check_file_output() {
    local file="$1"
    local description="$2"
    if [ -f "$file" ]; then
        debug "Output file size: $(wc -c <"$file") bytes"
        echo "$description saved to $file"
    else
        echo "Error: Failed to create output file $file"
        exit 1
    fi
}

# Make a POST request to the Overpass API with the given query
make_overpass_request() {
    local query="$1"
    local output_file="$2"
    debug "Sending request to Overpass API..."

    local response
    response=$(curl -s -X POST -H "Content-Type: application/x-www-form-urlencoded" \
        --data-urlencode "data=$query" \
        "http://overpass-api.de/api/interpreter")

    if [ $? -ne 0 ] || [ -z "$response" ]; then
        echo "Error: Failed to fetch data from Overpass API"
        exit 1
    fi

    echo "$response" >"$output_file"
}

# Print debug messages if verbose mode is enabled
debug() {
    if [ "$verbose" = true ]; then
        echo "[DEBUG] $1" >&2
    fi
}

# Geocode a location to get its OSM area ID using Nominatim
# Returns the area ID (osm_id + 3600000000 for relations)
geocode_to_area_id() {
    local location="$1"
    debug "Geocoding location: $location"
    
    local nominatim_url="https://nominatim.openstreetmap.org/search"
    local response
    response=$(curl -s -G "$nominatim_url" \
        --data-urlencode "q=$location" \
        --data-urlencode "format=json" \
        --data-urlencode "limit=1" \
        -H "User-Agent: melbmaps-fetch-script/1.0")
    
    if [ $? -ne 0 ] || [ -z "$response" ] || [ "$response" = "[]" ]; then
        echo "Error: Failed to geocode location: $location"
        exit 1
    fi
    
    local osm_type osm_id area_id
    osm_type=$(echo "$response" | jq -r '.[0].osm_type')
    osm_id=$(echo "$response" | jq -r '.[0].osm_id')
    
    # Convert OSM ID to Overpass area ID
    # relation -> osm_id + 3600000000
    # way -> osm_id + 2400000000
    # node -> osm_id (rare for areas)
    case "$osm_type" in
        "relation")
            area_id=$((osm_id + 3600000000))
            ;;
        "way")
            area_id=$((osm_id + 2400000000))
            ;;
        "node")
            area_id=$osm_id
            ;;
        *)
            echo "Error: Unknown OSM type: $osm_type"
            exit 1
            ;;
    esac
    
    debug "Geocoded to OSM $osm_type $osm_id (area ID: $area_id)"
    echo "$area_id"
}

# Build Overpass API query for city suburbs
get_suburbs_query() {
    local area_id="$1"
    
    cat <<EOF
[out:json][timeout:25];
area($area_id)->.searchArea;
(
    relation["boundary"="administrative"]["admin_level"="9"](area.searchArea);
);
out geom;
EOF
}

# Fetch and save city suburbs as OSM JSON and GeoJSON
fetch_and_save_suburbs() {
    local city="$1"
    local country="$2"
    local filename="$3"
    local output_dir="$4"

    debug "Creating output directory if it doesn't exist: $output_dir"
    mkdir -p "$output_dir"

    debug "Geocoding location: $city, $country"
    local area_id
    area_id=$(geocode_to_area_id "$city, $country")
    
    debug "Preparing suburbs query for $city, $country (area ID: $area_id)"
    local query
    query=$(get_suburbs_query "$area_id")
    debug "Query: $query"

    make_overpass_request "$query" "${output_dir}/${filename}.suburbs.osm.json"
    check_file_output "${output_dir}/${filename}.suburbs.osm.json" "Suburbs of $city (OSM format)"

    debug "Converting OSM to GeoJSON..."
    ../node_modules/osmtogeojson/osmtogeojson "${output_dir}/${filename}.suburbs.osm.json" |
        jq -c '{
        type,
        features: [ .features[] | select(.geometry.type == "Polygon") | {
            type: "Feature",
            properties: {name: .properties.name},
            geometry: {
                type: "Polygon",
                coordinates: .geometry.coordinates
            }
        }]}' >"${output_dir}/${filename}.suburbs.json"
    check_file_output "${output_dir}/${filename}.suburbs.json" "Suburbs of $city (GeoJSON format)"

    debug "Converting OSM to bounds..."
    jq -c '[ .elements[] | select(.type=="relation") | .members[] |
        select(.type=="way" and .role=="outer") | .geometry[]
        ] | {
            minlat: min_by(.lat).lat,
            maxlat: max_by(.lat).lat,
            minlon: min_by(.lon).lon,
            maxlon: max_by(.lon).lon
        }' "${output_dir}/${filename}.suburbs.osm.json" >"${output_dir}/${filename}.bounds.json"
    check_file_output "${output_dir}/${filename}.bounds.json" "Bounds of $city"
}
