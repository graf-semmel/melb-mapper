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
  zoom: 9,
  maxZoom: 13,
  minZoom: 9,
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
