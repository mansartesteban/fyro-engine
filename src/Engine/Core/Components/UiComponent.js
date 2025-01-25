import Component from "../Component.js";

class UiComponent extends Component {
  constructor(callback) {
    super();
    this.callback = callback;
  }

  update(entity) {
    this.callback(entity);
  }
}

export default UiComponent;
