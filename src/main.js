import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import suburbsRaw from "./suburbs-name.json" assert { type: "json" };
import { Game } from "./game";
import { setupSearch } from "./search";

const features = suburbsRaw.features.filter(
	(feature) => feature.properties.name !== undefined,
);

const bounds = L.latLngBounds(
	L.latLng(-38.8, 144.0), // Southwest corner
	L.latLng(-37.0, 146.8), // Northeast corner
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

const colors = ["FFB200", "EB5B00", "D91656", "640D5F"];
// const colors = ["BE3144", "219B9D", "4C1F7A", "FF8000"];

function style(feature) {
	return {
		weight: 1,
		opacity: 1,
		color: "white",
		dashArray: "3",
		fillOpacity: 0.7,
		fillColor: `#${colors[feature.properties.name.length % 4]}`,
	};
}

function highlightFeature(e) {
	const layer = e.target;

	layer.setStyle({
		weight: 3,
		dashArray: "",
		fillOpacity: 1,
	});

	if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
		layer.bringToFront();
	}
}

function resetFeature(e) {
	geojson.resetStyle(e.target);
}

function selectFeature(e) {
	const layer = e.target;
	const guessedSuburb = layer.feature.properties.name;
	const correctSuburb = game.getCurrentRound().suburb;

	// Zoom to the selected suburb
	// map.fitBounds(layer.getBounds());

	game.guessSuburb(guessedSuburb);

	// Color the guessed suburb
	layer.setStyle({
		fillColor: guessedSuburb === correctSuburb ? "green" : "red",
	});

	// Reset the style in 1 second
	setTimeout(() => {
		geojson.resetStyle(layer);
	}, 1000);

	// Color the correct suburb
	if (guessedSuburb !== correctSuburb) {
		highlightCorrectSuburb(correctSuburb);
	}
}

function highlightCorrectSuburb(suburb) {
	geojson.eachLayer((layer) => {
		if (layer.feature.properties.name === suburb) {
			layer.setStyle({
				weight: 3,
				dashArray: "",
				fillOpacity: 1,
				fillColor: "white",
			});
			setTimeout(() => {
				geojson.resetStyle(layer);
			}, 1000);
		}
	});
}

function onEachFeature(feature, layer) {
	layer.on({
		mouseover: highlightFeature,
		mouseout: resetFeature,
		click: selectFeature,
	});
}

const geojson = L.geoJson(features, {
	style: style,
	onEachFeature: onEachFeature,
}).addTo(map);

// Remove any existing markers
map.eachLayer((layer) => {
	if (layer instanceof L.Marker) {
		map.removeLayer(layer);
	}
});

const suburbs = features.map((feature) => ({
	name: feature.properties.name,
}));
const game = Game(suburbs);

setupSearch(features, geojson, map, bounds, game);

export { game };
