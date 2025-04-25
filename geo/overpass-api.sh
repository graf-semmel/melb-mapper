#!/bin/bash

# overpass-api.sh
#
# Downloads city boundary and suburb data from OpenStreetMap using the Overpass API.
# Outputs results as JSON and GeoJSON files for mapping/data analysis.
#
# Usage:
#   sh overpass-api.sh [OPTIONS] CITY_NAME
#
# Options:
#   -a LEVEL  Specify the city admin_level (default: 7)
#   -v        Enable verbose debug output
#
# Example:
#   sh overpass-api.sh -v -a 6 "City of Brisbane"
#
# Output files are named using the city name in lowercase with spaces replaced by hyphens.

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
        echo "[DEBUG] $1"
    fi
}

# Parse options
verbose=false
city_name=""
city_admin_level=7

# Print usage/help message
usage() {
    echo "Usage: $0 [-v] [-a city_admin_level] (-b|-s) city_name"
    echo "  -v: Enable verbose debug messages"
    echo "  -a: Specify city_admin_level (default: 7)"
    exit 1
}

# Parse command line options
while getopts "va:" opt; do
    case $opt in
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
debug "verbose=$verbose"
debug "city_admin_level=$city_admin_level"

# Check if city name is provided
if [ $# -ne 1 ]; then
    echo "Error: City name not provided"
    usage
fi

# Main script execution
check_dependencies

# Convert city name to lowercase and replace spaces with hyphens for filenames
city_name="$1"
file_name=$(echo "$city_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

debug "City name processing complete:"
debug "  Original: $city_name"
debug "  File name: $file_name"

# Build Overpass API query for city suburbs
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

# Fetch and save city suburbs as OSM JSON and GeoJSON
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
        features: [ .features[] | select(.geometry.type == "Polygon") | {
            type: "Feature",
            properties: {name: .properties.name},
            geometry: {
                type: "Polygon",
                coordinates: .geometry.coordinates
            }
        }]}' >"${filename}.suburbs.json"
    check_file_output "${filename}.suburbs.json" "Suburbs of $city (GeoJSON format)"

    debug "Converting OSM to bounds..."
    jq -c '[ .elements[] | select(.type=="relation") | .members[] |
        select(.type=="way" and .role=="outer") | .geometry[]
        ] | {
            minlat: min_by(.lat).lat,
            maxlat: max_by(.lat).lat,
            minlon: min_by(.lon).lon,
            maxlon: max_by(.lon).lon
        }' "${filename}.suburbs.osm.json" >"${filename}.bounds.json"
    check_file_output "${filename}.bounds.json" "Bounds of $city"
}

# Execute the appropriate function based on the selected option
fetch_and_save_suburbs "$city_name" "$city_admin_level" "$file_name"
