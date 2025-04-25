import { game, suburbs, zoomToSuburb, resetZoom, setInteractive, loadCity } from "./main.js";

// --- HERO SECTION ---
const startGameBtn = document.getElementById("start_game");
const searchSuburbsBtn = document.getElementById("search_suburbs");
const heroSection = document.getElementById("hero");
const citySelectRow = document.getElementById("city-select-row");

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
if (citySelectRow) {
  citySelectRow.addEventListener("click", async (e) => {
    if (e.target.classList.contains("city-btn")) {
      for (const btn of document.querySelectorAll(".city-btn")) {
        btn.classList.remove("selected");
      }
      e.target.classList.add("selected");
      const city = e.target.getAttribute("data-city");
      await loadCity(city);
    }
  });
}

// --- SEARCH SECTION ---
const backToMenuBtn = document.querySelector('#search button[data-action="back-to-menu"]');
const suburbsDataList = document.getElementById("list_suburbs");
const suburbInput = document.getElementById("input_suburbs");

if (backToMenuBtn) {
  backToMenuBtn.addEventListener("click", () => {
    suburbInput.value = "";
    resetZoom();
    document.getElementById("search").classList.add("hidden");
    document.getElementById("hero").classList.remove("hidden");
  });
}

if (suburbsDataList && suburbs) {
  suburbsDataList.innerHTML = "";
  for (const suburb of suburbs) {
    const option = document.createElement("option");
    option.value = suburb.name;
    suburbsDataList.appendChild(option);
  }
}

if (suburbInput) {
  suburbInput.addEventListener("change", (e) => {
    const suburbName = e.target.value;
    zoomToSuburb(suburbName);
  });
  suburbInput.addEventListener("input", (e) => {
    if (e.target.value === "") {
      resetZoom();
    }
  });
}

// --- GAME SECTION ---
const roundEl = document.getElementById("text_round");
const suburbEl = document.getElementById("text_suburb");
const scoreEl = document.getElementById("final_score");
const summaryDialog = document.getElementById("summary");
const table = document.querySelector("#table_summary tbody");
const playAgainBtn = document.getElementById("play_again");
const backToMenuBtn2 = document.querySelector('#game button[data-action="back-to-menu"]');

if (playAgainBtn) {
  playAgainBtn.addEventListener("click", () => {
    game.start();
    summaryDialog.close();
  });
}

if (backToMenuBtn2) {
  backToMenuBtn2.addEventListener("click", () => {
    game.start();
    summaryDialog.close();
    document.getElementById("game").classList.add("hidden");
    document.getElementById("hero").classList.remove("hidden");
  });
}

function updateUI(state) {
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
        <td>${round.isGuessedCorrectly() ? '<span class="secondary">✔︎<span>' : "❌"}</td>
      `;
      table.appendChild(row);
    }
    scoreEl.innerHTML = `Your final score is <strong>${score}</strong>`;
  }

  if (gameFinished) {
    setTimeout(() => {
      summaryDialog.showModal();
      renderSummary();
    }, 600);
    return;
  }

  suburbEl.innerHTML = `Find <strong><mark>${currentRound.suburb}</mark></strong>`;
  const roundString = `Round <strong class="secondary">${currentRound.index}</strong> of ${rounds.length}`;
  const timeLeftClass = currentRound.getTimeLeft() <= 3 ? "danger" : "secondary";
  const timeLeftString = `Time left <strong class="${timeLeftClass}">${currentRound.getTimeLeft()}</strong>s`;
  roundEl.innerHTML = `${roundString} | ${timeLeftString}`;
}

// game.subscribe((state) => {
//   updateUI(state);
// });
