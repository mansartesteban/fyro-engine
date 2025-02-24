import Entity from "@core/Entity";
import AmbientLightRenderer from "./Renderer";

class AmbientLight extends Entity {
  constructor(...options) {
    super();
    this.addComponent(new AmbientLightRenderer("renderer", ...options));
  }
}

export default AmbientLight;
