import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import suburbsRaw from "./suburbs-name.json" assert { type: "json" };
import { Game } from "./game";
import { setupSearch } from "./search";
import { createMap } from "./map";

const features = suburbsRaw.features.filter(
	(feature) => feature.properties.name !== undefined,
);

function getCSSVarColor(key) {
	const rootStyles = getComputedStyle(document.documentElement);
	return rootStyles.getPropertyValue(key).trim();
}

const colors = [
	getCSSVarColor("--color-map-1"),
	getCSSVarColor("--color-map-2"),
	getCSSVarColor("--color-map-3"),
	getCSSVarColor("--color-map-4"),
];

function showSuburbs() {
	const { map, geoJson } = createMap(features, {
		colors,
		onSelectLayer: (layer) => {
			if (game.isGameFinished()) {
				return;
			}

			const suburb = game.getCurrentRound().suburb;
			const guessedCorrect = game.guessSuburb(layer.feature.properties.name);

			highlightFeature(
				layer.getElement(),
				guessedCorrect ? "flicker-correct" : "flicker-wrong",
			);

			if (!guessedCorrect) {
				geoJson.eachLayer((layer) => {
					if (layer.feature.properties.name === suburb) {
						highlightFeature(layer.getElement(), "flicker-target");
					}
				});
			}
		},
	});

	function highlightFeature(
		element,
		className = "flicker-target",
		duration = 1000,
	) {
		if (element) {
			element.classList.add(className);
			setTimeout(() => {
				element.classList.remove(className);
			}, duration);
		}
	}
}

const suburbs = features.map((feature) => ({
	name: feature.properties.name,
}));

const game = Game(suburbs);

// setupSearch(features, geojson, map, bounds, game);
showSuburbs();

export { game };
