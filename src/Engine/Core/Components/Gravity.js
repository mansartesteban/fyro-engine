import { Vector3 } from "three";
import PhysicsComponent from "./PhysicsComponent";

class Gravity extends PhysicsComponent {
  options = {
    acceleration: new Vector3(0, -0.0981, 0),
  };
  apply = true;

  constructor(options) {
    super(options);
  }

  update(entity) {
    if (this.apply) {
      entity.velocity.add(
        this.options.acceleration.clone().multiplyScalar(0.016).divideScalar(2)
      );
    }
  }
}

export default Gravity;
