#!/bin/bash

# Parse options
city_name=""

usage() {
    echo "Usage: $0 sydney"
    echo "  Extracts the geographical data of \"Sydney\" from Overpass API."
    exit 1
}

# Check if output file is provided
if [ $# -ne 1 ]; then
    echo "Error: City not provided."
    usage
fi

city_name="$1"
lowercase_city_name=$(echo "$city_name" | awk '{print tolower($0)}')
capitalised_city_name=$(echo "$lowercase_city_name" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')

# Extract bounds
query='
[out:json][timeout:25];
relation["name"="'$capitalised_city_name'"]["boundary"="administrative"]["admin_level"="7"];
out bb qt;
'
curl -X POST -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "data=$query" \
    "http://overpass-api.de/api/interpreter" |
    jq -c -r '.elements[0].bounds' >"$lowercase_city_name-bounds.json"

echo "Bounds of $capitalised_city_name saved to $lowercase_city_name-bounds.json"

# Extract suburbs
query='
[out:json][timeout:25];
relation["name"="'$capitalised_city_name'"]["boundary"="administrative"]["admin_level"="9"];
out geom qt;
'

curl -X POST -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "data=$query" \
    "http://overpass-api.de/api/interpreter" |
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
}' >"$lowercase_city_name-suburbs.json"
