// Utility for loading city features and suburbs from GeoJSON/JSON via fetch()

const allCityFiles = {
  melbourne: {
    suburbs: "/melbourne.suburbs.json",
    bounds: "/melbourne.bounds.json",
  },
  // …other cities…
};

export async function loadCityData(cityKey) {
  const { suburbs: suburbsUrl, bounds: boundsUrl } =
    allCityFiles[cityKey] || allCityFiles.melbourne;

  // fetch suburbs GeoJSON
  const suburbsResp = await fetch(suburbsUrl);
  if (!suburbsResp.ok) {
    throw new Error(`Failed to load ${suburbsUrl}`);
  }
  const suburbsGeoJson = await suburbsResp.json();
  const features = suburbsGeoJson.features.filter(
    (f) => f.properties.name !== undefined,
  );
  const suburbs = features.map((f) => ({ name: f.properties.name }));

  // fetch bounds JSON
  const boundsResp = await fetch(boundsUrl);
  if (!boundsResp.ok) {
    throw new Error(`Failed to load ${boundsUrl}`);
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
