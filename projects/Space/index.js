import Project from "@core/Project";
import World from "../Scenes/World";

class Space extends Project {
  constructor() {
    super();
  }

  setup() {
    let scene = new World();
    this.addScene(scene, { viewer: { axisHelper: true }});
  }

  loop(tick) {}
}

export default Space;
