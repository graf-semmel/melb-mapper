// Utility for loading city features and suburbs from GeoJSON/JSON via fetch()

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
  const { suburbs: suburbsFilePath, bounds: boundsFilePath } =
    cityFiles[cityKey] || cityFiles.melbourne;

  // fetch suburbs GeoJSON
  const suburbsResp = await fetch(suburbsFilePath);
  if (!suburbsResp.ok) {
    throw new Error(`Failed to load ${suburbsFilePath}`);
  }
  const suburbsGeoJson = await suburbsResp.json();
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

  console.debug(
    `[cityData.js] Loaded ${features.length} features, bounds:`,
    bounds,
    "suburbs:",
    suburbs.map((s) => s.name),
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
