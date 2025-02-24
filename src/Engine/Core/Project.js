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
    isDev: false
  };
  loopCallback;
  observer;

  constructor(options) {
    this.options = { ...this.options, ...options };
    this.observer = new Observer(Object.keys(Events));
    setTimeout(this.setup.bind(this), 0);
  }

  addScene(scene, options) {
    scene.createViewer(this.options.mountOn);
    scene.setup();
    this.scenes.push(scene);
  }

  getScene(sceneName) {
    return this.scenes.find((scene) => scene.name === sceneName);
  }

  setup() {
    throw new ImplementError("setup", "Project");
  }

  update(deltaTime) {
    this.scenes.forEach((scene) => scene.update(deltaTime));
    this.loop(deltaTime);
  }
  loop(deltaTime) {}
}

export default Project;
