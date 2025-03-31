window.eventBus = new EventTarget();

function Round(index, suburb) {
  let guessedSuburb = undefined;
  let score = 0;
  let timeLeft = 10; // 10 seconds per round

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
    updateTime: () => {
      timeLeft = Math.max(0, timeLeft - 1);
      return timeLeft;
    },
    getTimeLeft: () => timeLeft,
  };
}

export function Game(suburbs) {
  let currentRound = undefined;
  let rounds = [];
  let timerInterval = null;

  function startTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
      if (!currentRound) return;

      const timeLeft = currentRound.updateTime();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        nextRound();
      }

      console.debug("currentRound", currentRound);

      updateState({
        currentRound,
        rounds,
        gameFinished: isGameFinished(),
      });
    }, 1000);
  }

  function nextRound() {
    const nextIndex = currentRound.index + 1;
    if (nextIndex > rounds.length) {
      currentRound = undefined;
    } else {
      currentRound = rounds[nextIndex - 1];
      startTimer();
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
      timeLeft: state.currentRound?.getTimeLeft(),
    });

    window.eventBus.dispatchEvent(
      new CustomEvent("game:state", { detail: state }),
    );
  }

  function start() {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    rounds = Array.from({ length: 5 }, (_, i) =>
      Round(i + 1, suburbs[Math.floor(Math.random() * suburbs.length)].name),
    );
    currentRound = rounds[0];
    startTimer();

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
