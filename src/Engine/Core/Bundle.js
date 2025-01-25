import Observer from "./Observer";

class Bundle {
  static BUNDLES = Object.freeze({
    DATABASE: "DATABASE",
  });

  static EVENTS = {
    BUNDLE_STARTED: "BUNDLE_STARTED",
  };

  name = "";
  isStarted = false;

  observer = new Observer();

  constructor(name) {
    this.name = name;

    this.observer;
  }

  onStarted(callback) {
    this.observer.$on(Bundle.EVENTS.BUNDLE_STARTED, () => {
      this.isStarted = true;
      callback(this);
    });
  }

  start() {}
}

export default Bundle;
