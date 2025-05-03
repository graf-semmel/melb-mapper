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
