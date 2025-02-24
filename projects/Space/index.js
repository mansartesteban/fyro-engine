import Project from "@core/Project";
import World from "../Scenes/World";

class Space extends Project {
  constructor() {
    super({
      // isDev: true
      isDev: false
    });
  }

  setup() {
    let scene = new World();
    this.addScene(scene);
  }

  loop(tick) {}
}

export default Space;
