import "leaflet/dist/leaflet.css";
import L from "leaflet";

const tileLayers = {
  openstreetmap: {
    url: `https://tile.openstreetmap.org/{z}/{x}/{y}${
      L.Browser.retina ? "@2x.png" : ".png"
    }`,
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
  },
  carto_light: {
    url: `https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}${
      L.Browser.retina ? "@2x.png" : ".png"
    }`,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
  },
};

const defaultOptions = {
  tileLayer: tileLayers.carto_dark,
  colors: ["#111111", "#222222", "#333333", "#444444"],
  bounds: L.latLngBounds(
    L.latLng(-38.8, 144.0), // Southwest corner
    L.latLng(-37.0, 146.8), // Northeast corner
  ),
  onSelectLayer: (layer) => {},
};

function getColor(feature, colors) {
  const index = feature.properties.name.length % colors.length;
  return colors[index];
}

function getCSSVarColor(key) {
  const rootStyles = getComputedStyle(document.documentElement);
  return rootStyles.getPropertyValue(key).trim().replace("#", "");
}

function createMap(features, options = {}) {
  const mergedOptions = {
    ...defaultOptions,
    enableHover: true, // Add default for hover effects
    ...options,
  };

  function defaultStyle(feature) {
    return {
      weight: 2,
      opacity: 0.3,
      color: "#000",
      fillOpacity: 0.3,
      fillColor: getColor(feature, mergedOptions.colors),
    };
  }

  function highlighStyle(feature) {
    return {
      color: "#fff",
      fillOpacity: 0.8,
    };
  }

  const map = L.map("map", {
    zoomControl: false,
    center: mergedOptions.bounds.getCenter(),
    zoom: 10,
    maxZoom: 13,
    minZoom: 9,
    maxBounds: mergedOptions.bounds,
    maxBoundsViscosity: 1.0,
    dragging: true,
  });

  L.tileLayer(mergedOptions.tileLayer.url, {
    attribution: mergedOptions.tileLayer.attribution,
    subdomains: mergedOptions.tileLayer.subdomains,
  }).addTo(map);

  function onMouseOver(e) {
    const layer = e.target;
    layer.setStyle(highlighStyle(layer.feature));
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  }

  function onMouseOut(e) {
    geoJson.resetStyle(e.target);
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

  const geoJson = L.geoJson(features, {
    style: defaultStyle,
    onEachFeature: onEachFeature,
  }).addTo(map);

  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  function zoomToFeature(featureName) {
    if (!featureName) {
      return;
    }
    geoJson.eachLayer((layer) => {
      if (layer.feature.properties.name === featureName) {
        map.fitBounds(layer.getBounds());
      }
    });
  }

  function resetZoom() {
    map.setView(mergedOptions.bounds.getCenter(), 10);
  }

  return { map, geoJson, zoomToFeature, resetZoom };
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

export { createMap, tileLayers, defaultOptions };
