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
}' $1 > $2