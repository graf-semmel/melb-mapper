// Utility for loading city features and suburbs from GeoJSON/JSON via fetch()

import { publishLoadingCityEnd, publishLoadingCityProgress, publishLoadingCitySart } from "./eventbus";

const cityFiles = {
  melbourne: {
    suburbs: "/melbourne.suburbs.json",
    bounds: "/melbourne.bounds.json",
  },
  sydney: {
    suburbs: "/sydney.suburbs.json",
    bounds: "/sydney.bounds.json",
  },
};

export async function loadCity(cityKey) {
  console.debug(`[cityData.js] Loading city: ${cityKey}`);
  publishLoadingCitySart();

  const { suburbs: suburbsFilePath, bounds: boundsFilePath } =
    cityFiles[cityKey] || cityFiles.melbourne;

  // fetch suburbs GeoJSON
  const suburbsGeoJson = await fetchWithProgress(suburbsFilePath, (progress) => {
    publishLoadingCityProgress(progress);
  });

  const features = suburbsGeoJson.features.filter(
    (f) => f.properties.name !== undefined,
  );
  const suburbs = features.map((f) => ({ name: f.properties.name }));

  // fetch bounds JSON
  const boundsResp = await fetch(boundsFilePath);
  if (!boundsResp.ok) {
    throw new Error(`Failed to load ${boundsFilePath}`);
  }
  const bounds = await boundsResp.json();

  publishLoadingCityEnd();
  console.debug(
    `[cityData.js] Loaded ${features.length} features, bounds:`,
    bounds,
  );
  return { features, suburbs, bounds };
}

export async function loadAustraliaBounds() {
  const boundsFilePath = "/australia.bounds.json";
  const boundsResp = await fetch(boundsFilePath);
  if (!boundsResp.ok) {
    throw new Error(`Failed to load ${boundsFilePath}`);
  }
  const bounds = await boundsResp.json();
  console.debug("[cityData.js] Loaded Australia bounds:", bounds);
  return bounds;
}

async function fetchWithProgress(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }

  const contentLength = response.headers.get("Content-Length");
  if (!contentLength) {
    console.warn(`Content-Length not available for ${url}`);
    return await response.json(); // Fallback to normal fetch
  }

  const total = Number.parseInt(contentLength, 10);
  let loaded = 0;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    loaded += value.length;
    if (onProgress) {
      onProgress((loaded / total) * 100); // Report progress as a percentage
    }

    result += decoder.decode(value, { stream: true });
  }

  return JSON.parse(result);
}