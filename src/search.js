export function setupSearch(features, geojson, map, bounds) {
	const suburbsDataList = document.getElementById("list_suburbs");
	for (const feature of features) {
		const option = document.createElement("option");
		option.value = feature.properties.name;
		suburbsDataList.appendChild(option);
	}

	const suburbInput = document.getElementById("input_suburbs");
	suburbInput.addEventListener("change", (e) => {
		const suburbName = e.target.value;
		console.log("suburbName", suburbName);

		// Reset styles for all features first
		geojson.eachLayer((layer) => {
			geojson.resetStyle(layer);
		});

		// Loop through each feature to highlight the matching suburb
		geojson.eachLayer((layer) => {
			if (layer.feature.properties.name === suburbName) {
				layer.setStyle({
					weight: 3,
					dashArray: "",
					fillOpacity: 1,
					fillColor: "white",
				});

				if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
					layer.bringToFront();
				}

				map.fitBounds(layer.getBounds());
			}
		});
	});

	// if empty input, reset styles and map
	suburbInput.addEventListener("input", (e) => {
		if (e.target.value === "") {
			geojson.eachLayer((layer) => {
				geojson.resetStyle(layer);
			});

			map.setView(bounds.getCenter(), 10);
		}
	});
}
