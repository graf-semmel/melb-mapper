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
      return score > 0;
    },
    isGuessedCorrectly: () => score > 0,
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
      console.debug("game is finished!");
      return;
    }

    currentRound.guess(guess);
    const correctGuess = currentRound.isGuessedCorrectly();
    console.debug(
      "guessed suburb:",
      guess,
      correctGuess ? "[correct]" : "[wrong]",
    );
    nextRound();
    return correctGuess;
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
    console.debug("state update:", {
      round: state.currentRound?.index,
      suburb: state.currentRound?.suburb,
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
