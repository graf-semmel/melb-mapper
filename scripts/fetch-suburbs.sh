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
#   -d DIR    Specify output directory (default: geo)
#   -v        Enable verbose debug output
#
# Example:
#   sh fetch-suburbs.sh -v "Melbourne" "Australia"
#   sh fetch-suburbs.sh -d "data" "Brisbane" "Australia"
#
# Output files are named using the city name in lowercase with spaces replaced by hyphens.

# Source common functions
source "$(dirname "$0")/common.sh"

# Parse options
verbose=false
output_dir="geo"
city_name=""
country_name=""

# Print usage/help message
usage() {
    echo "Usage: $0 [-v] [-d DIR] CITY_NAME COUNTRY"
    echo "  -v: Enable verbose debug messages"
    echo "  -d: Output directory (default: geo)"
    echo "  CITY_NAME: Name of the city (required)"
    echo "  COUNTRY: Country name (required)"
    exit 1
}

# Parse command line options
while getopts "vd:" opt; do
    case $opt in
    v)
        verbose=true
        ;;
    d)
        output_dir="$OPTARG"
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
debug "  Output directory: $output_dir"

fetch_and_save_suburbs "$city_name" "$country_name" "$file_name" "$output_dir"
