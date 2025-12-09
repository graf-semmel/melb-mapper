// Map rendering and interaction logic for OzMapper.
// Provides functions to create and configure the Leaflet map, tile layers, and suburb feature layers.
// Handles map initialization, feature highlighting, zooming, and interactivity for game and search modes.

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { initTheme } from "./utils";

const tileLayers = {
  openstreetmap: {
    url: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  carto_dark: {
    url: `https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}${
      L.Browser.retina ? "@2x.png" : ".png"
    }`,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    theme: {
      isDarkMode: true,
    },
  },
  carto_light: {
    url: `https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}${
      L.Browser.retina ? "@2x.png" : ".png"
    }`,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    theme: {
      isDarkMode: false,
    },
  },
  carto_voyager: {
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}${
      L.Browser.retina ? "@2x.png" : ".png"
    }`,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    theme: {
      isDarkMode: false,
    },
  },
};

const selectedTileLayer = tileLayers.carto_light

const colors = initTheme(selectedTileLayer.theme);

function createMap(options = {}) {
  let featureLayer = null;

  const mergedOptions = {
    enableHover: true,
    ...options,
  };
  console.debug("[map.js] Create map options:", mergedOptions);

  let bounds = overpassBoundsToLatLngBounds(mergedOptions.bounds);
  const mapOptions = {
    zoomControl: false,
    maxZoom: 13,
    minZoom: 5,
    zoom: 5,
    maxBoundsViscosity: 0.8,
    dragging: true,
    zoomSnap: 0.5,
    bounds: bounds,
    center: bounds.getCenter(),
  };
  console.debug("[map.js] Leaflet map options:", mapOptions);

  const map = L.map("map", mapOptions);

  function defaultStyle(feature) {
    const index = feature.properties.name.length % colors.length;
    const fillColor = colors[index];

    return {
      weight: 2,
      opacity: 0.3,
      color: "#000",
      fillOpacity: 0.3,
      fillColor: fillColor,
    };
  }

  function highlighStyle(feature) {
    return {
      fillOpacity: 1,
    };
  }

  const { url, attribution, subdomains } = selectedTileLayer;
  L.tileLayer(url, {
    attribution: attribution,
    // subdomains: subdomains,
  }).addTo(map);

  function onMouseOver(e) {
    const layer = e.target;
    layer.setStyle(highlighStyle(layer.feature));
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  }

  function onMouseOut(e) {
    featureLayer.resetStyle(e.target);
  }

  function onClick(e) {
    const layer = e.target;
    mergedOptions.onSelectLayer(layer);
  }

  function onEachFeature(feature, layer) {
    if (mergedOptions.enableHover) {
      layer.on({
        mouseover: onMouseOver,
        mouseout: onMouseOut,
        mouseup: onMouseOut,
      });
    }
    if (mergedOptions.onSelectLayer) {
      layer.on({
        click: onClick,
      });
    }
  }

  function setCity({ features, bounds }) {
    console.debug(`[map.js] Setting features: ${features.length} features`);
    if (featureLayer) {
      map.removeLayer(featureLayer);
    }

    featureLayer = L.geoJson(features, {
      style: defaultStyle,
      onEachFeature: onEachFeature,
    }).addTo(map);

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    setBounds(bounds);
    setTimeout(() => {
      map.setMinZoom(9);
    }, 500);
  }

  function zoomToFeature(featureName) {
    console.debug(`[map.js] Zooming to feature: ${featureName}`);
    if (!featureName || !featureLayer) {
      return;
    }
    featureLayer.eachLayer((layer) => {
      if (layer.feature.properties.name === featureName) {
        map.fitBounds(layer.getBounds());
      }
    });
  }

  function highlightFeature(
    featureName,
    className = "flicker-target",
    duration = 1000
  ) {
    console.debug(`[map.js] Highlighting feature: ${featureName}`);
    featureLayer.eachLayer((layer) => {
      if (layer.feature.properties.name === featureName) {
        layer.getElement().classList.add(className);
        setTimeout(() => {
          layer.getElement().classList.remove(className);
        }, duration);
      }
    });
  }

  function resetZoom() {
    console.debug("[map.js] Resetting zoom");
    map.fitBounds(bounds);
  }

  function setInteractive(interactive) {
    console.debug(`[main.js] Setting map interactivity: ${interactive}`);
    featureLayer.eachLayer((layer) => {
      layer.setInteractive(interactive);
    });
  }

  function setBounds(overpassBounds) {
    console.debug("[map.js] Setting map bounds:", overpassBounds);
    bounds = overpassBoundsToLatLngBounds(overpassBounds);

    // Display the bounds on the map - will fail if features are loaded ¯\_(ツ)_/¯
    // const rectangle = L.rectangle(bounds, { color: "#ff7800", weight: 1 });
    // rectangle.addTo(map);
    // console.log("[map.js] Rectangle bounds:", rectangle.getBounds());

    map.flyToBounds(bounds, {
      duration: 0.5,
      padding: [0, 0],
    });
    setTimeout(() => {
      map.setMaxBounds(bounds.pad(0.2));
    }, 500);
  }

  function overpassBoundsToLatLngBounds(overpassBounds) {
    const sw = L.latLng(overpassBounds.minlat, overpassBounds.minlon);
    const ne = L.latLng(overpassBounds.maxlat, overpassBounds.maxlon);
    return L.latLngBounds(sw, ne);
  }

  return {
    map,
    setCity,
    zoomToFeature,
    resetZoom,
    highlightFeature,
    setInteractive,
    setBounds,
  };
}

L.Layer.prototype.setInteractive = function (interactive) {
  if (this.getLayers) {
    for (const layer of this.getLayers()) {
      layer.setInteractive(interactive);
    }
    return;
  }
  if (!this._path) {
    return;
  }

  this.options.interactive = interactive;

  if (interactive) {
    L.DomUtil.addClass(this._path, "leaflet-interactive");
  } else {
    L.DomUtil.removeClass(this._path, "leaflet-interactive");
  }
};

export { createMap };
