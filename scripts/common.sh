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