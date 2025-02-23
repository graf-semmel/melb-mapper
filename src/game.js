window.eventBus = new EventTarget();

function Round(index, suburb) {
	let guessedSuburb = undefined;
	let score = 0;

	return {
		index,
		suburb,
		guess: (guess) => {
			if (guess === suburb) {
				score++;
			}
			guessedSuburb = guess;
		},
		isGuessedCorrectly: () => suburb === guessedSuburb,
		getScore: () => score,
		getGuessedSuburb: () => guessedSuburb,
	};
}

export function Game(suburbs) {
	let currentRound = undefined;
	let rounds = [];

	function nextRound() {
		const nextIndex = currentRound.index + 1;
		if (nextIndex > rounds.length) {
			currentRound = undefined;
		} else {
			currentRound = rounds[nextIndex - 1];
		}

		updateState({
			currentRound,
			rounds,
			gameFinished: isGameFinished(),
		});
	}

	function guessSuburb(guess) {
		if (isGameFinished()) {
			console.log("game is finished!");
			return;
		}

		console.log("guessed suburb:", guess);
		currentRound.guess(guess);
		if (currentRound.isGuessedCorrectly()) {
			console.log("correct!");
		} else {
			console.log("wrong!");
		}
		nextRound();
	}

	function isGameFinished() {
		return currentRound === undefined;
	}

	function subscribe(observer) {
		window.eventBus.addEventListener("game:state", (event) => {
			observer(event.detail);
		});
	}

	function updateState(state) {
		console.log("state updated:");
		console.table({
			round: state.currentRound?.index,
			suburb: state.currentRound?.suburb,
			guess: state.currentRound?.getGuessedSuburb(),
			score: state.currentRound?.getScore(),
		});

		window.eventBus.dispatchEvent(
			new CustomEvent("game:state", { detail: state }),
		);
	}

	function start() {
		rounds = Array.from({ length: 5 }, (_, i) =>
			Round(i + 1, suburbs[Math.floor(Math.random() * suburbs.length)].name),
		);
		currentRound = rounds[0];

		updateState({
			currentRound,
			rounds,
			gameFinished: isGameFinished(),
		});
	}

	function getCurrentRound() {
		return currentRound;
	}

	return {
		guessSuburb,
		subscribe,
		start,
		getCurrentRound,
		isGameFinished,
	};
}
