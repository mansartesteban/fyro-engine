class Component {
  options = {};
  active = true;
  entity = null;
  needsUpdate = false;

  constructor(options) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  updateComponent(tick) {
    if (this.active) {
      this.update(tick);
    }
  }

  update() {}

  refresh() {}
}

export default Component;
