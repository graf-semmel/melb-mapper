if (!window.eventBus) {
  console.debug("[eventbus.js] Initializing event bus.");
  window.eventBus = new EventTarget();
}

export function publishGameState(state) {
  if (!state) {
    console.error("[eventbus.js] No state provided to publish.");
    return;
  }
  console.debug("[eventbus.js] Publishing game state:", state);
  window.eventBus.dispatchEvent(
    new CustomEvent("game:state", { detail: state }),
  );
}

export function subscribeToGameState(callback) {
  if (typeof callback !== "function") {
    console.error("[eventbus.js] Callback is not a function.");
    return;
  }
  console.debug("[eventbus.js] Subscribing to game state updates.");
  window.eventBus.addEventListener("game:state", (event) => {
    const state = event.detail;
    callback(state);
  });
}

export function publishLoadingCitySart() {
  console.debug("[eventbus.js] Publishing loading city start.");
  window.eventBus.dispatchEvent(
    new CustomEvent("loading:city:state", {
      detail: {
        state: "start",
        progress: 0,
      },
    }),
  );
}

export function publishLoadingCityEnd() {
  console.debug("[eventbus.js] Publishing loading city end.");
  window.eventBus.dispatchEvent(
    new CustomEvent("loading:city:state", {
      detail: {
        state: "end",
        progress: 100,
      },
    }),
  );
}

export function publishLoadingCityProgress(progress) {
  if (progress < 0 || progress > 100) {
    console.error("[eventbus.js] Progress must be between 0 and 100.");
    return;
  }
  console.debug("[eventbus.js] Publishing loading city progress:", progress);
  window.eventBus.dispatchEvent(
    new CustomEvent("loading:city:state", {
      detail: {
        state: "progress",
        progress,
      },
    }),
  );
}

export function subscribeToLoadingCityState(callback) {
  if (typeof callback !== "function") {
    console.error("[eventbus.js] Callback is not a function.");
    return;
  }
  console.debug("[eventbus.js] Subscribing to city loading updates.");
  window.eventBus.addEventListener("loading:city:state", (event) => {
    const state = event.detail;
    callback(state);
  });
}
