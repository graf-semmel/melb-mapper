#!/bin/bash

# fetch-perth.sh
#
# Fetches suburbs for all cities in Perth's Inner Metro Area

# Source common functions
source "$(dirname "$0")/common.sh"

# Parse options
verbose=false
output_dir="geo"

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
        echo "Usage: $0 [-v] [-d DIR]"
        echo "  -v: Enable verbose debug messages"
        echo "  -d: Output directory (default: geo)"
        exit 1
        ;;
    esac
done

check_dependencies

# Source the fetch-suburbs functions (without executing)

# Perth - Inner Metro Area cities
cities=(
    "City of Bayswater"
    # "City of Belmont"
    # "City of Canning"
    # "City of Fremantle"
    # "City of Melville"
    # "City of Nedlands"
    # "City of Perth"
    # "City of South Perth"
    # "City of Stirling"
    # "City of Subiaco"
    # "City of Vincent"
    # "Shire of Peppermint Grove"
    # "Town of Bassendean"
    # "Town of Cambridge"
    # "Town of Claremont"
    # "Town of Cottesloe"
    # "Town of East Fremantle"
    # "Town of Mosman Park"
    # "Town of Victoria Park"
)

echo "Fetching suburbs for ${#cities[@]} cities in Perth's Inner Metro Area..."

for city in "${cities[@]}"; do
    echo ""
    echo "Processing: $city"
    
    file_name=$(echo "$city" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
    
    debug "City name processing:"
    debug "  City: $city"
    debug "  File name: $file_name"
    debug "  Output directory: $output_dir"
    
    fetch_and_save_suburbs "$city" "Australia" "$file_name" "$output_dir"
    
    echo "✓ Completed: $city"
done

echo ""
echo "All done! Processed ${#cities[@]} cities."
