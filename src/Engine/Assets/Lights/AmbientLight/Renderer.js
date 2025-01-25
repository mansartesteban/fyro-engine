import { AmbientLight } from "three";
import Component from "@core/Component";

class AmbientLightRenderer extends Component {
  constructor(...options) {
    super();
    this.object = new AmbientLight(...options);
  }

  refresh() {
    this.entity.object = this.object;
  }

  update() {}
}

export default AmbientLightRenderer;
