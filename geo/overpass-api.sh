#!/bin/bash

# Helper functions for common operations
check_dependencies() {
    for cmd in jq curl; do
        if ! command -v "$cmd" &>/dev/null; then
            echo "Error: Required dependency '$cmd' is not installed"
            exit 1
        fi
    done
}

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

debug() {
    if [ "$verbose" = true ]; then
        echo "[DEBUG] $1"
    fi
}

# Parse options
bounds_only=false
suburbs_only=false
verbose=false
city_name=""
city_admin_level=7

usage() {
    echo "Usage: $0 [-v] [-a city_admin_level] (-b|-s) city_name"
    echo "  -b: Extract only bounds for the specified city"
    echo "  -s: Extract only suburbs for the specified city"
    echo "  -v: Enable verbose debug messages"
    echo "  -a: Specify city_admin_level (default: 7)"
    exit 1
}

# Parse command line options
while getopts "bsva:" opt; do
    case $opt in
    b)
        bounds_only=true
        ;;
    s)
        suburbs_only=true
        ;;
    v)
        verbose=true
        ;;
    a)
        city_admin_level="$OPTARG"
        ;;
    *)
        usage
        ;;
    esac
done

shift $((OPTIND - 1))

debug "Command line options processed"
debug "bounds_only=$bounds_only"
debug "suburbs_only=$suburbs_only"
debug "verbose=$verbose"
debug "city_admin_level=$city_admin_level"

# Validate options - ensure exactly one option is selected
if { [ "$bounds_only" = false ] && [ "$suburbs_only" = false ]; } ||
    { [ "$bounds_only" = true ] && [ "$suburbs_only" = true ]; }; then
    echo "Error: Exactly one option (-b or -s) must be specified"
    usage
fi

# Check if city name is provided
if [ $# -ne 1 ]; then
    echo "Error: City name not provided"
    usage
fi

# Main script execution
check_dependencies

city_name="$1"
file_name=$(echo "$city_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

debug "City name processing complete:"
debug "  Original: $city_name"
debug "  File name: $file_name"

get_bounds_query() {
    local city="$1"
    local admin_level="$2"
    cat <<EOF
[out:json][timeout:25];
relation["name"="$city"]["boundary"="administrative"]["admin_level"="$admin_level"];
out bb qt;
EOF
}

get_suburbs_query() {
    local city="$1"
    local admin_level="$2"
    cat <<EOF
[out:json][timeout:25];
area["name"="$city"]["boundary"="administrative"]["admin_level"="$admin_level"]->.searchArea;
(
    relation["boundary"="administrative"]["admin_level"="9"](area.searchArea);
);
out geom;
EOF
}

fetch_and_save_bounds() {
    local city="$1"
    local admin_level="$2"
    local filename="$3"
    debug "Preparing bounds query for $city"
    local query
    query=$(get_bounds_query "$city" "$admin_level")
    debug "Query: $query"

    make_overpass_request "$query" "temp_bounds.json"
    jq -c -r '.elements[0].bounds' "temp_bounds.json" >"${filename}.bounds.json"
    rm "temp_bounds.json"

    check_file_output "${filename}.bounds.json" "Bounds of $city"
}

fetch_and_save_suburbs() {
    local city="$1"
    local admin_level="$2"
    local filename="$3"
    debug "Preparing suburbs query for $city"
    local query
    query=$(get_suburbs_query "$city" "$admin_level")
    debug "Query: $query"

    make_overpass_request "$query" "${filename}.suburbs.osm.json"
    check_file_output "${filename}.suburbs.osm.json" "Suburbs of $city (OSM format)"

    debug "Converting OSM to GeoJSON..."
    ../node_modules/osmtogeojson/osmtogeojson "${filename}.suburbs.osm.json" |
        jq -c '{
        type,
        features: [.features[] | select(.geometry.type == "Polygon") | {
            type: "Feature",
            properties: {name: .properties.name},
            geometry: {
                type: "Polygon",
                coordinates: .geometry.coordinates
            }
        }]
    }' >"${filename}.suburbs.json"

    check_file_output "${filename}.suburbs.json" "Suburbs of $city (GeoJSON format)"
}

if [ "$bounds_only" = true ]; then
    fetch_and_save_bounds "$city_name" "$city_admin_level" "$file_name"
elif [ "$suburbs_only" = true ]; then
    fetch_and_save_suburbs "$city_name" "$city_admin_level" "$file_name"
fi
