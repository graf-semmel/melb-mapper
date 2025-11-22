#!/bin/bash

# fetch-suburbs.sh
#
# Downloads city boundary and suburb data from OpenStreetMap using the Overpass API.
# Outputs results as JSON and GeoJSON files for mapping/data analysis.
#
# Usage:
#   sh fetch-suburbs.sh [OPTIONS] CITY_NAME COUNTRY
#
# Options:
#   -v        Enable verbose debug output
#
# Example:
#   sh fetch-suburbs.sh -v "Melbourne" "Australia"
#   sh fetch-suburbs.sh "Brisbane" "Australia"
#
# Output files are named using the city name in lowercase with spaces replaced by hyphens.

# Source common functions
source "$(dirname "$0")/common.sh"

# Parse options
verbose=false
city_name=""
country_name=""

# Print usage/help message
usage() {
    echo "Usage: $0 [-v] CITY_NAME COUNTRY"
    echo "  -v: Enable verbose debug messages"
    echo "  CITY_NAME: Name of the city (required)"
    echo "  COUNTRY: Country name (required)"
    exit 1
}

# Parse command line options
while getopts "v" opt; do
    case $opt in
    v)
        verbose=true
        ;;
    *)
        usage
        ;;
    esac
done

shift $((OPTIND - 1))

debug "Command line options processed"
debug "verbose=$verbose"

# Check if city name and country are provided
if [ $# -lt 2 ]; then
    echo "Error: City name and country are required"
    usage
fi

city_name="$1"
country_name="$2"

# Main script execution
check_dependencies

# Convert city name to lowercase and replace spaces with hyphens for filenames
file_name=$(echo "$city_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

debug "City name processing complete:"
debug "  City: $city_name"
debug "  Country: $country_name"
debug "  File name: $file_name"

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

    debug "Geocoding location: $city, $country"
    local area_id
    area_id=$(geocode_to_area_id "$city, $country")
    
    debug "Preparing suburbs query for $city, $country (area ID: $area_id)"
    local query
    query=$(get_suburbs_query "$area_id")
    debug "Query: $query"

    make_overpass_request "$query" "geo/${filename}.suburbs.osm.json"
    check_file_output "geo/${filename}.suburbs.osm.json" "Suburbs of $city (OSM format)"

    debug "Converting OSM to GeoJSON..."
    ../node_modules/osmtogeojson/osmtogeojson "geo/${filename}.suburbs.osm.json" |
        jq -c '{
        type,
        features: [ .features[] | select(.geometry.type == "Polygon") | {
            type: "Feature",
            properties: {name: .properties.name},
            geometry: {
                type: "Polygon",
                coordinates: .geometry.coordinates
            }
        }]}' >"geo/${filename}.suburbs.json"
    check_file_output "geo/${filename}.suburbs.json" "Suburbs of $city (GeoJSON format)"

    debug "Converting OSM to bounds..."
    jq -c '[ .elements[] | select(.type=="relation") | .members[] |
        select(.type=="way" and .role=="outer") | .geometry[]
        ] | {
            minlat: min_by(.lat).lat,
            maxlat: max_by(.lat).lat,
            minlon: min_by(.lon).lon,
            maxlon: max_by(.lon).lon
        }' "geo/${filename}.suburbs.osm.json" >"geo/${filename}.bounds.json"
    check_file_output "geo/${filename}.bounds.json" "Bounds of $city"
}

# Execute the appropriate function based on the selected option
fetch_and_save_suburbs "$city_name" "$country_name" "$file_name"
