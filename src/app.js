import {
  subscribeToGameState,
  subscribeToLoadingCityState,
} from "./eventbus.js";
import {
  game,
  zoomToSuburb,
  resetZoom,
  setInteractive,
  loadCity,
} from "./main.js";

// --- HERO SECTION ---
const startGameBtn = document.getElementById("start_game");
const searchSuburbsBtn = document.getElementById("search_suburbs");
const heroSection = document.getElementById("hero");
const selectCitySection = document.getElementById("select-city-section");

function transitionFromHero(nextSectionId) {
  heroSection.addEventListener(
    "animationend",
    () => {
      heroSection.classList.add("hidden");
      heroSection.classList.remove("animate-out");
      document.getElementById(nextSectionId).classList.remove("hidden");
    },
    { once: true }
  );
  heroSection.classList.add("animate-out");
}

startGameBtn.addEventListener("click", () => {
  transitionFromHero("game");
  setInteractive(true);
  game.start();
});

searchSuburbsBtn.addEventListener("click", () => {
  transitionFromHero("search");
  setInteractive(false);
});

// --- CITY SELECTION ---
let selectedCity;
selectCitySection.querySelectorAll("button");
const citySelectBtns = selectCitySection.querySelectorAll("button");
for (const btn of citySelectBtns) {
  btn.addEventListener("click", async (e) => {
    console.debug("[main.js] City selection button clicked");
    const city = btn.getAttribute("data-city");
    if (selectedCity === city) {
      console.debug(`[main.js] City already selected: ${city}`);
      return;
    }
    selectedCity = city;
    for (const otherBtn of citySelectBtns) {
      otherBtn.classList.remove("selected");
    }
    btn.classList.add("selected");
    const { suburbs } = await loadCity(selectedCity);
    updateSearch(suburbs);
  });
}

// --- SEARCH SECTION ---
const backToMenuBtn = document.querySelector(
  '#search button[data-action="back-to-menu"]'
);
const suburbsDataList = document.getElementById("list_suburbs");
const suburbInput = document.getElementById("input_suburbs");

backToMenuBtn.addEventListener("click", () => {
  suburbInput.value = "";
  resetZoom();
  document.getElementById("search").classList.add("hidden");
  document.getElementById("hero").classList.remove("hidden");
});

function updateSearch(suburbs) {
  suburbsDataList.innerHTML = "";
  for (const suburb of suburbs) {
    const option = document.createElement("option");
    option.value = suburb.name;
    suburbsDataList.appendChild(option);
  }
}

suburbInput.addEventListener("change", (e) => {
  const suburbName = e.target.value;
  zoomToSuburb(suburbName);
});
suburbInput.addEventListener("input", (e) => {
  if (e.target.value === "") {
    resetZoom();
  }
});

// --- GAME SECTION ---
const roundEl = document.getElementById("text_round");
const suburbEl = document.getElementById("text_suburb");
const scoreEl = document.getElementById("final_score");
const summaryDialog = document.getElementById("summary");
const table = document.querySelector("#table_summary tbody");
const playAgainBtn = document.getElementById("play_again");
const backToMenuBtn2 = document.querySelector(
  '#game button[data-action="back-to-menu"]'
);

playAgainBtn.addEventListener("click", () => {
  summaryDialog.close();
  resetZoom();
  game.start();
});

backToMenuBtn2.addEventListener("click", () => {
  game.stop();
  summaryDialog.close();
  resetZoom();
  document.getElementById("game").classList.add("hidden");
  document.getElementById("hero").classList.remove("hidden");
});

// add ESC event to close summary dialog and go back to menu
summaryDialog.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    game.stop();
    summaryDialog.close();
    resetZoom();
    document.getElementById("game").classList.add("hidden");
    document.getElementById("hero").classList.remove("hidden");
  }
});

function updateGame(state) {
  const { currentRound, rounds, gameFinished } = state;
  const score = rounds.reduce((acc, round) => acc + round.getScore(), 0);

  function renderSummary() {
    table.innerHTML = "";
    for (const round of rounds) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${round.index}</td>
        <td>${round.suburb}</td>
        <td>${round.getGuessedSuburb()}</td>
        <td>${
          round.isGuessedCorrectly() ? '<span class="secondary">✔︎<span>' : "❌"
        }</td>
      `;
      table.appendChild(row);
    }
    scoreEl.innerHTML = `Your final score is <strong><mark>${score}</mark></strong>`;
  }

  if (gameFinished) {
    setTimeout(() => {
      summaryDialog.showModal();
      renderSummary();
    }, 600);
    return;
  }

  suburbEl.innerHTML = `Find <strong><mark>${currentRound.suburb}</mark></strong>`;
  const roundString = `Round <strong>${currentRound.index}</strong> of ${rounds.length}`;
  const timeLeftClass = currentRound.getTimeLeft() <= 3 ? "danger" : "";
  const timeLeftString = `Time left <strong class="${timeLeftClass}">${currentRound.getTimeLeft()}</strong>s`;
  roundEl.innerHTML = `${roundString} | ${timeLeftString}`;
}

subscribeToGameState((state) => {
  updateGame(state);
});

const progressDialog = document.getElementById("progress-dialog");
// progress bar doesn't work correctly with CloudFlare
// const progressBar = progressDialog.querySelector("progress");
subscribeToLoadingCityState((state) => {
  if (state.state === "start") {
    // progressBar.setAttribute("value", 0);
    progressDialog.showModal();
  } else if (state.state === "end") {
    progressDialog.close();
  } else if (state.state === "progress") {
    // progressBar.value = state.progress;
  } else if (state.state === "indeterminate") {
    // progressBar.removeAttribute("value");
  }
});
