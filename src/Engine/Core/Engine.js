import Observer from "@core/Observer";
import Timer from "@lib/Time/Timer";
import { Clock } from "three"

const Events = {
  INITIALIZED: "INITIALIZED",
};

class Engine {
  project;
  observer;
  lastUpdate = 0

  constructor() {
    this.observer = new Observer(Events);
    this.observer.$on(Events.INITIALIZED, this.loop.bind(this));
    this.timer = new Timer();
  }

  setProject(project) {
    this.project = project;
    this.observer.$emit(Events.INITIALIZED);
  }

  loop(currentTime = 0) {
    if (this.project) {
      this.project.update((currentTime - this.lastUpdate)/1000);
    }
    this.lastUpdate = currentTime
    window.requestAnimationFrame(this.loop.bind(this));
  }
}

export default Engine;
