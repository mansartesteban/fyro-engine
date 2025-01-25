import Observer from "@core/Observer";
import Scene from "./Scene";
import ImplementError from "@errors/ImplementError";

const Events = {
  INITIALIZED: "INITIALIZED",
};

class Project {
  scenes = [];
  options = {
    name: "New project",
    mountOn: "#app",
  };
  loopCallback;
  observer;

  constructor(options) {
    this.options = { ...this.options, ...options };
    this.observer = new Observer(Object.keys(Events));
    setTimeout(this.setup.bind(this), 0);
  }

  addScene(scene, options) {
    scene.createViewer(this.options.mountOn, options.viewer);
    scene.setup();
    this.scenes.push(scene);
  }

  getScene(sceneName) {
    return this.scenes.find((scene) => scene.name === sceneName);
  }

  setup() {
    throw new ImplementError("setup", "Project");
  }

  update(tick) {
    this.scenes.forEach((scene) => scene.update(tick));
    this.loop(tick);
  }
  loop() {}
}

export default Project;
