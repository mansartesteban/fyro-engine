import Observer from "./Observer";
import Database from "@/engine/storage/Database";

class App {

  static EVENTS = Object.freeze({
    BEFORE_START: "BEFORE_START",
    STARTED: "STARTED",
  });

  bundles = [];
  observer = new Observer();

  start() {
    this.observer.$emit(App.EVENTS.BEFORE_START).then(() => {

      this.bundles.forEach(bundle => {
        bundle.start();
        bundle.onStarted(() => {
          if (this.bundles.every(bundle => bundle.isStarted)) {
            this.observer.$emit(App.EVENTS.STARTED);
          }
        });
      });

    });
  }

  beforeStart(callback) {
    this.observer.$on(App.EVENTS.BEFORE_START, () => {

      let db = new Database();
      this.registerBundle(db);

      return new Promise((res) => {
        Promise.resolve(res(callback()));
      });
    });
  }

  afterStart(callback) {
    this.observer.$on(App.EVENTS.STARTED, () => {
      callback();
    });
  }

  registerBundle(bundle) {
    if (!this.getBundle(bundle.name)) {
      this.bundles.push(bundle);
    }
  }

  getBundle(name) {
    return this.bundles.find(bundle => bundle.name === name);
  }

}

export default new App();