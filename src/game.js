import { publishGameState } from "./eventbus";

function createRound(index, suburb) {
  let guessedSuburb = undefined;
  let score = 0;
  let timeLeft = 15;

  function updateTime() {
    timeLeft = Math.max(0, timeLeft - 1);
    return timeLeft;
  }

  function guess(guess) {
    if (guess === suburb) {
      score++;
    }
    guessedSuburb = guess;
    return score > 0;
  }

  function isGuessedCorrectly() {
    return score > 0;
  }

  return {
    index,
    suburb,
    guess,
    isGuessedCorrectly,
    getScore: () => score,
    getGuessedSuburb: () => guessedSuburb,
    updateTime,
    getTimeLeft: () => timeLeft,
  };
}

export function Game(suburbs) {
  let currentRound = undefined;
  let rounds = [];
  let timerInterval = null;

  function createState() {
    return {
      currentRound,
      rounds,
      gameFinished: isGameFinished(),
    };
  }

  function updateState() {
    const state = createState();
    console.debug("state update:", {
      round: state.currentRound?.index,
      suburb: state.currentRound?.suburb,
      timeLeft: state.currentRound?.getTimeLeft(),
    });

    publishGameState(state);
  }

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
      } else {
        updateState();
      }
    }, 1000);
  }

  function nextRound() {
    const nextIndex = currentRound !== undefined ? currentRound.index : 0;
    if (nextIndex >= rounds.length) {
      stop();
    } else {
      currentRound = rounds[nextIndex];
      startTimer();
    }

    updateState();
  }

  function guessSuburb(guess) {
    if (isGameFinished()) {
      console.debug("game is finished!");
      return;
    }

    const correctGuess = currentRound.guess(guess);
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

  function start() {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    currentRound = undefined;
    rounds = Array.from({ length: 5 }, (_, i) =>
      createRound(
        i + 1,
        suburbs[Math.floor(Math.random() * suburbs.length)].name,
      ),
    );

    nextRound();
  }

  function stop() {
    console.debug("[game.js] Stopping game");
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    currentRound = undefined;
  }

  return {
    guessSuburb,
    start,
    stop,
    getCurrentRound: () => currentRound,
    isGameFinished,
  };
}
