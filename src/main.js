import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import suburbsRaw from "./suburbs-name.json" assert { type: "json" };

const suburbs = suburbsRaw.features.filter(
	(feature) => feature.properties.name !== undefined,
);

const bounds = L.latLngBounds(
	L.latLng(-38.8, 144.0), // Southwest corner
	L.latLng(-37.0, 146.8), // Northeast corner
);

const map = L.map("map", {
	center: bounds.getCenter(),
	zoom: 10,
	maxZoom: 13,
	minZoom: 10,
	maxBounds: bounds, // Restrict the map's view to these bounds
	maxBoundsViscosity: 1.0, // Ensure the user cannot drag outside the bounds
	dragging: true, // Allow dragging inside the bounds
});

// const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   maxZoom: 19,
//   attribution:
//     '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
// }).addTo(map);

const colors = ["FFB200", "EB5B00", "D91656", "640D5F"];
// const colors = ["BE3144", "219B9D", "4C1F7A", "FF8000"];

function style(feature) {
	return {
		weight: 1,
		opacity: 1,
		color: "white",
		dashArray: "3",
		fillOpacity: 0.7,
		fillColor: `#${colors[feature.properties.name.length % 4]}`,
	};
}

function highlightFeature(e) {
	const layer = e.target;

	layer.setStyle({
		weight: 3,
		dashArray: "",
		fillOpacity: 1,
	});

	if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
		layer.bringToFront();
	}
}

function resetHighlight(e) {
	geojson.resetStyle(e.target);
}

function zoomToFeature(e) {
	map.fitBounds(e.target.getBounds());
	game.guessSuburb(e.target.feature.properties.name);
}

function onEachFeature(feature, layer) {
	layer.on({
		mouseover: highlightFeature,
		mouseout: resetHighlight,
		click: zoomToFeature,
	});
}

const geojson = L.geoJson(suburbs, {
	style: style,
	onEachFeature: onEachFeature,
}).addTo(map);

// Remove any existing markers
map.eachLayer((layer) => {
	if (layer instanceof L.Marker) {
		map.removeLayer(layer);
	}
});

const suburbsDataList = document.getElementById("list_suburbs");
for (const suburb of suburbs) {
	const option = document.createElement("option");
	option.value = suburb.properties.name;
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

function Game(features) {
	const suburbs = features.map((feature) => ({
		name: feature.properties.name,
	}));
	const rounds = Array.from({ length: 5 }, (_, i) => ({
		index: i + 1,
		suburb: suburbs[Math.floor(Math.random() * suburbs.length)].name,
		score: 0,
	}));
	let currentRound = rounds[0];

	const render = Renderer();

	function nextRound() {
		const nextIndex = currentRound.index + 1;
		if (nextIndex <= rounds.length) {
			currentRound = rounds[nextIndex - 1];
		}

		render({
			currentRound,
			gameFinished: isGameFinished(),
		});
	}

	function guessSuburb(guess) {
		if (isGameFinished()) {
			console.log("game is finished!");
			return;
		}

		console.log("guessed suburb:", guess);
		if (guess === currentRound.suburb) {
			currentRound.score++;
			console.log("correct!");
		} else {
			console.log("wrong!");
		}
		nextRound();
	}

	function isGameFinished() {
		return currentRound.index > rounds;
	}

	render({
		currentRound: rounds[0],
		rounds,
		gameFinished: false,
	});

	return {
		guessSuburb,
	};
}

const game = Game(suburbs);

function Renderer() {
	const roundEl = document.getElementById("text_round");
	const suburbEl = document.getElementById("text_suburb");
	let state = {};

	return (newState) => {
		state = {
			...state,
			...newState,
		};

		console.log("state", state);

		const { currentRound, rounds, gameFinished } = state;
		if (gameFinished) {
			console.log("game finished!");
			return;
		}
		roundEl.textContent = `Round ${currentRound.index} of ${rounds.length}`;
		suburbEl.textContent = currentRound.suburb;
		const score = rounds.reduce((acc, round) => acc + round.score, 0);
		console.log("total score:", score);
	};
}
