import { generateUUID } from "three/src/math/MathUtils"

class Component {
  name = "";
  options = {};
  active = true;
  entity = null;
  needsUpdate = false;

  constructor(name, options) {
    this.name = name || generateUUID()
    if (options) {
      this.options = { ...this.options, ...options };
    }

    queueMicrotask(() => this.setup())
  }

  updateComponent(deltaTime = 0) {
    if (this.active) {
      this.update(deltaTime);
    }
  }

  update(deltaTime = 0) {}

  refresh() {}
  setup() {}
}

export default Component; 
