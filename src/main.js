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

function getCSSVarColor(key) {
	const rootStyles = getComputedStyle(document.documentElement);
	return rootStyles.getPropertyValue(key).trim().replace("#", "");
}
const colors = [
	getCSSVarColor("--color-map-1"),
	getCSSVarColor("--color-map-2"),
	getCSSVarColor("--color-map-3"),
	getCSSVarColor("--color-map-4"),
];

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
	if (game.isGameFinished()) {
		return;
	}

	const layer = e.target;
	const guessedSuburb = layer.feature.properties.name;
	const correctSuburb = game.getCurrentRound().suburb;

	game.guessSuburb(guessedSuburb);

	// Zoom to the selected suburb
	// map.fitBounds(layer.getBounds());

	// Color the guessed suburb
	const element = layer.getElement();
	if (element) {
		const clazz =
			guessedSuburb === correctSuburb ? "flicker-correct" : "flicker-wrong";
		element.classList.add(clazz);
		setTimeout(() => {
			element.classList.remove(clazz);
		}, 1000);
	}

	// Color the correct suburb
	if (guessedSuburb !== correctSuburb) {
		highlightTargetSuburb(correctSuburb);
	}
}

function highlightTargetSuburb(suburb) {
	geojson.eachLayer((layer) => {
		if (layer.feature.properties.name === suburb) {
			const element = layer.getElement();
			if (element) {
				element.classList.add("flicker-target");
				setTimeout(() => {
					element.classList.remove("flicker-target");
				}, 1000);
			}
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
