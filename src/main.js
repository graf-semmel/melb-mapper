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

// Declare map and game variables here, they will be initialized later
let map;
let game;

// Define an async function to handle initialization
async function initializeApp() {
  const boundsAustralia = await geo.loadAustraliaBounds();

  console.debug("[main.js] Loading map");
  // Assign the created map to the module-level variable
  map = createMap({
    colors,
    enableHover: true,
    bounds: boundsAustralia,
    onSelectLayer: (layer) => {
      // Ensure game is initialized before accessing it
      if (!game || game.isGameFinished()) {
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
}

async function loadCity(cityKey) {
  // Ensure map is initialized before loading city data
  if (!map) {
    console.error("[main.js] Map not initialized before loading city.");
    return;
  }
  console.debug(`[main.js] Loading city: ${cityKey}`);
  const cityData = await geo.loadCity(cityKey);
  const suburbs = cityData.suburbs;
  console.debug(`[main.js] Map and game initialized for city: ${cityKey}`);

  map.setCity(cityData);
  // Assign the created game to the module-level variable
  game = Game(suburbs);
  return {
    game, // Return the game instance
    suburbs,
  };
}

function zoomToSuburb(suburbName) {
  // Ensure map is initialized
  if (!map) return;
  console.debug(`[main.js] Zooming to suburb: ${suburbName}`);
  map.zoomToFeature(suburbName);
  map.highlightFeature(suburbName, "flicker-target");
}

// Ensure map is initialized before accessing its methods
const resetZoom = () => map?.resetZoom();
const setInteractive = (interactive) => map?.setInteractive(interactive);

// Call the async initialization function
initializeApp().catch((error) => {
  console.error("Failed to initialize the application:", error);
  // Handle initialization error appropriately, maybe show a message to the user
});

// Export the functions and potentially the game instance if needed elsewhere directly
// Note: `game` might be null initially until loadCity is called.
export { game, zoomToSuburb, resetZoom, setInteractive, loadCity };
