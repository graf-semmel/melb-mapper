#!/bin/bash

# fetch-perth.sh
#
# Fetches suburbs for all cities in Perth's Inner Metro Area

# Source common functions
source "$(dirname "$0")/common.sh"

# Parse options
verbose=false

# Parse command line options
while getopts "vd:" opt; do
    case $opt in
    v)
        verbose=true
        ;;
    *)
        echo "Usage: $0 [-v] [-d DIR]"
        echo "  -v: Enable verbose debug messages"
        exit 1
        ;;
    esac
done

check_dependencies

# Perth - Inner Metro Area cities
# Uncomment cities to update individually
cities=(
    # "City of Bayswater"
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
    
    fetch_and_save_suburbs "$city" "Australia" "$file_name" "geo/perth"
    
    echo "✓ Completed: $city"
done

echo ""
echo "All done! Processed ${#cities[@]} cities."

echo ""
echo "Combining all suburbs into perth.suburbs.json..."

# Combine all individual suburb JSON files into one
jq -s '{
    type: "FeatureCollection",
    features: [.[] | .features[]] | unique_by(.properties.name)
}' "geo/perth"/*.suburbs.json > "geo/perth.suburbs.json" 2>/dev/null

if [ -f "geo/perth.suburbs.json" ]; then
    suburb_count=$(jq '.features | length' "geo/perth.suburbs.json")
    echo "✓ Combined suburbs file created: geo/perth.suburbs.json"
    echo "  Total suburbs: $suburb_count"
else
    echo "⚠ Warning: Failed to create combined suburbs file"
fi

echo ""
echo "Creating combined bounds file for Perth..."

# Combine all bounds files to get the overall bounding box
jq -s '{
    minlat: [.[] | .minlat] | min,
    maxlat: [.[] | .maxlat] | max,
    minlon: [.[] | .minlon] | min,
    maxlon: [.[] | .maxlon] | max
}' "geo/perth"/*.bounds.json > "geo/perth.bounds.json" 2>/dev/null

if [ -f "geo/perth.bounds.json" ]; then
    echo "✓ Combined bounds file created: geo/perth.bounds.json"
    cat "geo/perth.bounds.json"
else
    echo "⚠ Warning: Failed to create combined bounds file"
fi
