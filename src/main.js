import "./style.css";
import "leaflet/dist/leaflet.css";
import { Game } from "./game";
import { createMap } from "./map";
import * as geo from "./geo";

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

let zoomToFeature;
let highlightFeature;
let setInteractive;
let resetZoom;
let features = [];
let suburbs = [];
let bounds = {};
let game;

async function loadCity(cityKey) {
  console.debug(`[main.js] Loading city: ${cityKey}`);
  const cityData = await geo.loadCity(cityKey);
  features = cityData.features;
  suburbs = cityData.suburbs;
  bounds = cityData.bounds;

  // Re-create map and game
  const {
    setFeatures,
    zoomToFeature: zoomToFeatureFn,
    resetZoom: resetZoomFn,
    highlightFeature: highlightFeatureFn,
    setInteractive: setInteractiveFn,
    setBounds,
  } = createMap({
    colors,
    enableHover: true,
    onSelectLayer: (layer) => {
      if (game.isGameFinished()) {
        return;
      }

      const suburb = game.getCurrentRound().suburb;
      const guessedCorrect = game.guessSuburb(layer.feature.properties.name);

      highlightFeature(
        layer.feature.properties.name,
        guessedCorrect ? "flicker-correct" : "flicker-wrong",
      );
      if (!guessedCorrect) {
        highlightFeature(suburb, "flicker-target");
      }
    },
  });
  setFeatures(features);
  setBounds(bounds);

  zoomToFeature = zoomToFeatureFn;
  highlightFeature = highlightFeatureFn;
  resetZoom = resetZoomFn;
  setInteractive = setInteractiveFn;
  game = Game(suburbs);
  console.debug(`[main.js] Map and game initialized for city: ${cityKey}`);
}

function zoomToSuburb(suburbName) {
  console.debug(`[main.js] Zooming to suburb: ${suburbName}`);
  zoomToFeature(suburbName);
  highlightFeature(suburbName, "flicker-target");
}

// Load Melbourne by default on module initialization
if (!game) {
  console.debug("[main.js] Initializing default city: melbourne");
  await loadCity("melbourne");
}

export { game, suburbs, zoomToSuburb, resetZoom, setInteractive, loadCity };
