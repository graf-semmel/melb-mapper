#!/bin/bash

# fetch-capital-cities.sh
#
# Downloads capital city data from OpenStreetMap using the Overpass API.
# Outputs results as JSON and GeoJSON files for mapping/data analysis.
#
# Usage:
#   sh fetch-capital-cities.sh [OPTIONS] COUNTRY_NAME
#
# Options:
#   -v        Enable verbose debug output
#
# Example:
#   sh fetch-capital-cities.sh -v "Australia"
#   sh fetch-capital-cities.sh "Germany"
#
# Output files are named using the country name in lowercase with spaces replaced by hyphens.

# Source common functions
source "$(dirname "$0")/common.sh"

# Parse options
verbose=false
country_name=""

# Print usage/help message
usage() {
    echo "Usage: $0 [-v] COUNTRY_NAME"
    echo "  -v: Enable verbose debug messages"
    echo "  COUNTRY_NAME: Name of the country (required)"
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

# Check if country name is provided
if [ $# -ne 1 ]; then
    echo "Error: Country name not provided"
    usage
fi

# Main script execution
check_dependencies

# Convert country name to lowercase and replace spaces with hyphens for filenames
country_name="$1"
file_name=$(echo "$country_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

debug "Country name processing complete:"
debug "  Original: $country_name"
debug "  File name: $file_name"

get_capital_cities_query() {
    local area_id="$1"
    local capital_level="4"
    cat <<EOF
[out:json][timeout:25];
area($area_id)->.searchArea;
(
    node["place"="city"]["capital"="$capital_level"](area.searchArea);
);
out body;
EOF
}

fetch_and_save_capital_cities() {
    local country="$1"
    local filename="$2"

    debug "Geocoding country: $country"
    local area_id
    area_id=$(geocode_to_area_id "$country")
    
    debug "Preparing capital cities query for $country (area ID: $area_id)"
    local query
    query=$(get_capital_cities_query "$area_id")
    debug "Query: $query"

    make_overpass_request "$query" "geo/${filename}.capital-cities.osm.json"
    check_file_output "geo/${filename}.capital-cities.osm.json" "Capital cities of $country (OSM format)"

    debug "Converting OSM to GeoJSON..."
    cat "geo/${filename}.capital-cities.osm.json" |
        jq -c '{ 
        country: "'$country'",
        capital_cities: [.elements[].tags.name]
        }' > "geo/${filename}.capital-cities.json"
    check_file_output "geo/${filename}.capital-cities.json" "Capital cities of $country (GeoJSON format)"
}

# Execute the appropriate function based on the selected option
fetch_and_save_capital_cities "$country_name" "$file_name"
