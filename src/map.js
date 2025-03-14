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
    L.latLng(-37.0, 146.8) // Northeast corner
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
  const mergedOptions = { ...defaultOptions, ...options };

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
    maxBounds: options.bounds, // Restrict the map's view to these bounds
    maxBoundsViscosity: 1.0, // Ensure the user cannot drag outside the bounds
    dragging: true, // Allow dragging inside the bounds
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
    options.onSelectLayer(layer);
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: onMouseOver,
      mouseout: onMouseOut,
      click: onClick,
    });
  }

  const geoJson = L.geoJson(features, {
    style: defaultStyle,
    onEachFeature: onEachFeature,
  }).addTo(map);

  // Remove any existing markers
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  return { map, geoJson };
}

export { createMap, tileLayers, defaultOptions };
