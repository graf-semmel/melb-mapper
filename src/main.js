import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import suburbs from "./suburbs-name.json" assert { type: "json" };

const bounds = L.latLngBounds(
  L.latLng(-38.8, 144.0), // Southwest corner
  L.latLng(-37.0, 146.8) // Northeast corner
);

const map = L.map("map", {
  center: bounds.getCenter(),
  zoom: 10,
  maxZoom: 13,
  minZoom: 10,
  maxBounds: bounds, // Restrict the map's view to these bounds
  maxBoundsViscosity: 1.0, // Ensure the user cannot drag outside the bounds
  dragging: true, // Allow dragging inside the bounds
});

// const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   maxZoom: 19,
//   attribution:
//     '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
// }).addTo(map);

const colors = ["FFB200", "EB5B00", "D91656", "640D5F"];
// const colors = ["BE3144", "219B9D", "4C1F7A", "FF8000"];

function style(feature) {
  return {
    weight: 1,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.7,
    fillColor: "#" + colors[feature.properties.name.length % 4],
  };
}

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 3,
    dashArray: "",
    fillOpacity: 1,
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function resetHighlight(e) {
  geojson.resetStyle(e.target);
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature,
  });
}

const geojson = L.geoJson(suburbs, {
  style: style,
  onEachFeature: onEachFeature,
}).addTo(map);

// Remove any existing markers
map.eachLayer(function (layer) {
  if (layer instanceof L.Marker) {
    map.removeLayer(layer);
  }
});

const suburbsDataList = document.getElementById("list_suburbs");
suburbs.features.forEach((suburb) => {
  const option = document.createElement("option");
  option.value = suburb.properties.name;
  suburbsDataList.appendChild(option);
});

const suburbInput = document.getElementById("input_suburbs");
suburbInput.addEventListener("change", (e) => {
  const suburbName = e.target.value;
  console.log("suburbName", suburbName);

  // Reset styles for all features first
  geojson.eachLayer(function (layer) {
    geojson.resetStyle(layer);
  });

  // Loop through each feature to highlight the matching suburb
  geojson.eachLayer(function (layer) {
    if (layer.feature.properties.name === suburbName) {
      layer.setStyle({
        weight: 3,
        dashArray: "",
        fillOpacity: 1,
        fillColor: "white",
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }

      map.fitBounds(layer.getBounds());
    }
  });
});
