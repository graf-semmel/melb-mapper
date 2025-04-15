// Utility for loading city features and suburbs from GeoJSON/JSON
export async function loadCityData(cityKey) {
  const cityFiles = {
    melbourne: "./melb.json",
    sydney: "./sydney.json",
  };
  const file = cityFiles[cityKey] || cityFiles.melbourne;
  console.debug(`[cityData.js] Loading file: ${file}`);

  const suburbsRaw = await import(/* @vite-ignore */ file, {
    assert: { type: "json" },
  });
  const features = suburbsRaw.default.features.filter(
    (feature) => feature.properties.name !== undefined,
  );
  const suburbs = features.map((feature) => ({
    name: feature.properties.name,
  }));
  console.debug(
    `[cityData.js] Loaded ${features.length} features, ${suburbs.length} suburbs`,
  );

  return { features, suburbs };
}
