import "./style.css";
import "leaflet/dist/leaflet.css";
import { Game } from "./game";
import { createMap } from "./map";
import { loadCityData } from "./cityData";

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

let geoJson;
let zoomToFeature;
let resetZoom;
let features = [];
let suburbs = [];
let game;

async function loadCity(cityKey) {
  console.debug(`[main.js] Loading city: ${cityKey}`);
  const { features: loadedFeatures, suburbs: loadedSuburbs } = await loadCityData(cityKey);
  features = loadedFeatures;
  suburbs = loadedSuburbs;

  // Re-create map and game
  const mapResult = createMap(features, {
    colors,
    enableHover: true,
    onSelectLayer: (layer) => {
      if (game.isGameFinished()) return;
      const suburb = game.getCurrentRound().suburb;
      const guessedCorrect = game.guessSuburb(layer.feature.properties.name);
      highlightFeature(
        layer.getElement(),
        guessedCorrect ? "flicker-correct" : "flicker-wrong",
      );
      if (!guessedCorrect) {
        mapResult.geoJson.eachLayer((layer) => {
          if (layer.feature.properties.name === suburb) {
            highlightFeature(layer.getElement(), "flicker-target");
          }
        });
      }
    },
  });
  geoJson = mapResult.geoJson;
  zoomToFeature = mapResult.zoomToFeature;
  resetZoom = mapResult.resetZoom;
  game = Game(suburbs);
  console.debug(`[main.js] Map and game initialized for city: ${cityKey}`);
}

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
    console.debug(`[main.js] Highlighted feature with class: ${className}`);
  }
}

function zoomToSuburb(suburbName) {
  console.debug(`[main.js] Zooming to suburb: ${suburbName}`);
  zoomToFeature(suburbName);
  geoJson.eachLayer((layer) => {
    if (layer.feature.properties.name === suburbName) {
      highlightFeature(layer.getElement(), "flicker-target");
    }
  });
}

function setInteractive(interactive) {
  console.debug(`[main.js] Setting map interactivity: ${interactive}`);
  geoJson.eachLayer((layer) => {
    layer.setInteractive(interactive);
  });
}

// Load Melbourne by default on module initialization
if(!game) {
  console.debug("[main.js] Initializing default city: melbourne");
  await loadCity("melbourne"); 
}

export { game, suburbs, zoomToSuburb, resetZoom, setInteractive, loadCity };
