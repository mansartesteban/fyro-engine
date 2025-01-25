import { PointLight } from "three";
import Component from "@core/Component";

class PointLightRenderer extends Component {
  constructor(...options) {
    super();
    this.object = new PointLight(...options);
  }

  refresh() {
    this.entity.object = this.object;
  }

  update() {}
}

export default PointLightRenderer;
