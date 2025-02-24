import { PointLight } from "three";
import Component from "@core/Component";

class PointLightRenderer extends Component {
  constructor(name, ...options) {
    super(name, options);
    this.object = new PointLight(...options);
  }

  refresh() {
    this.entity.object = this.object;
  }

  update() {}
}

export default PointLightRenderer;
