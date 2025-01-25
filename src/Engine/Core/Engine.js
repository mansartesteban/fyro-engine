import Observer from "@core/Observer";
import Timer from "@lib/Time/Timer";

const Events = {
  INITIALIZED: "INITIALIZED",
};

class Engine {
  project;
  observer;
  timer;

  constructor() {
    this.observer = new Observer(Events);
    this.observer.$on(Events.INITIALIZED, this.loop.bind(this));
    this.timer = new Timer();
  }

  setProject(project) {
    this.project = project;
    this.observer.$emit(Events.INITIALIZED);
  }

  loop(tick = 0) {
    if (this.project) {
      this.project.update(tick);
      this.timer.reset();
    }

    window.requestAnimationFrame(this.loop.bind(this, tick + 1));
  }
}

export default Engine;
