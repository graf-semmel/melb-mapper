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

const boundsAustralia = await geo.loadAustraliaBounds();
let game;

console.debug("[main.js] Loading map");
const map = createMap({
  colors,
  enableHover: true,
  bounds: boundsAustralia,
  onSelectLayer: (layer) => {
    if (game.isGameFinished()) {
      return;
    }

    const suburb = game.getCurrentRound().suburb;
    const guessedCorrect = game.guessSuburb(layer.feature.properties.name);

    map.highlightFeature(
      layer.feature.properties.name,
      guessedCorrect ? "flicker-correct" : "flicker-wrong",
    );
    if (!guessedCorrect) {
      map.highlightFeature(suburb, "flicker-target");
    }
  },
});
console.debug("[main.js] Map initialized");

async function loadCity(cityKey) {
  console.debug(`[main.js] Loading city: ${cityKey}`);
  const cityData = await geo.loadCity(cityKey);
  const suburbs = cityData.suburbs;
  console.debug(`[main.js] Map and game initialized for city: ${cityKey}`);

  map.setCity(cityData);
  game = Game(suburbs);
  return {
    game,
    suburbs,
  };
}

function zoomToSuburb(suburbName) {
  console.debug(`[main.js] Zooming to suburb: ${suburbName}`);
  map.zoomToFeature(suburbName);
  map.highlightFeature(suburbName, "flicker-target");
}

const resetZoom = map.resetZoom;
const setInteractive = map.setInteractive;

export { game, zoomToSuburb, resetZoom, setInteractive, loadCity };
