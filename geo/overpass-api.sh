#!/bin/bash

# Parse options
bounds_only=false
suburbs_only=false
verbose=false
city_name=""

debug() {
    if [ "$verbose" = true ]; then
        echo "[DEBUG] $1"
    fi
}

usage() {
    echo "Usage: $0 [-v] (-b|-s) city_name"
    echo "  -b: Extract only bounds for the specified city"
    echo "  -s: Extract only suburbs for the specified city"
    echo "  -v: Enable verbose debug messages"
    exit 1
}

# Parse command line options
while getopts "bsv" opt; do
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

city_name="$1"
lowercase_city_name=$(echo "$city_name" | awk '{print tolower($0)}')
capitalised_city_name=$(echo "$lowercase_city_name" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')

debug "City name processing complete:"
debug "  Original: $city_name"
debug "  Lowercase: $lowercase_city_name"
debug "  Capitalised: $capitalised_city_name"

if [ "$bounds_only" = true ]; then
    # Extract bounds
    debug "Preparing bounds query for $capitalised_city_name"
    
    query='[out:json][timeout:25];
relation["name"="'$capitalised_city_name'"]["boundary"="administrative"]["admin_level"="7"];
out bb qt;'
    
    debug "Query: $query"
    debug "Sending request to Overpass API..."

    curl -X POST -H "Content-Type: application/x-www-form-urlencoded" \
        --data-urlencode "data=$query" \
        "http://overpass-api.de/api/interpreter" |
        jq -c -r '.elements[0].bounds' >"$lowercase_city_name-bounds.json"

    debug "Processing complete, checking output file"

    if [ -f "$lowercase_city_name-bounds.json" ]; then
        debug "Output file size: $(wc -c <"$lowercase_city_name-bounds.json") bytes"
    fi

    echo "Bounds of $capitalised_city_name saved to $lowercase_city_name-bounds.json"

elif [ "$suburbs_only" = true ]; then
    # Extract suburbs
    debug "Preparing suburbs query for $capitalised_city_name"

    query='[out:json][timeout:25];
area["name"="'$capitalised_city_name'"]["boundary"="administrative"]["admin_level"="7"]->.searchArea;
(
    relation["boundary"="administrative"]["admin_level"="9"](area.searchArea);
);
out geom;'
    
    debug "Query: $query"
    debug "Sending request to Overpass API..."

    curl -X POST -H "Content-Type: application/x-www-form-urlencoded" \
        --data-urlencode "data=$query" \
        "http://overpass-api.de/api/interpreter" -o "$lowercase_city_name-suburbs.osm.json"

    debug "Processing complete, checking output file"
    
    if [ -f "$lowercase_city_name-suburbs.osm.json" ]; then
        debug "Output file size: $(wc -c <"$lowercase_city_name-suburbs.osm.json") bytes"
    fi
    
    echo "Suburbs of $capitalised_city_name saved to $lowercase_city_name-suburbs.osm.json"

    # Convert OSM to GeoJSON
    debug "Converting OSM to GeoJSON..."
    
    ../node_modules/osmtogeojson/osmtogeojson "$lowercase_city_name-suburbs.osm.json" | jq -c '{
      type,
      features: [.features[] | select(.geometry.type == "Polygon") | {
        type: "Feature",
        properties: {name: .properties.name},
        geometry: {
          type: "Polygon",
          coordinates: .geometry.coordinates
        }
      }]
    }' >"$lowercase_city_name-suburbs.json"
    
    debug "Processing complete, checking output file"
    
    if [ -f "$lowercase_city_name-suburbs.json" ]; then
        debug "Output file size: $(wc -c <"$lowercase_city_name-suburbs.json") bytes"
    fi
    
    echo "Suburbs of $capitalised_city_name saved to $lowercase_city_name-suburbs.json"

fi
