import Entity from "@core/Entity";
import PointLightRenderer from "./Renderer";

class PointLight extends Entity {
  constructor(...options) {
    super();
    this.addComponent(new PointLightRenderer(...options));
  }
}

export default PointLight;
