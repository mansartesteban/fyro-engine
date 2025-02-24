import Entity from "@core/Entity";
import { Quaternion, Vector3 } from "three";
import { clamp } from "three/src/math/MathUtils"

class Character extends Entity {
  theta = 0;
  phi = 0;
  speed = 3;

  rotate(e, sensitivity = 1) {
    const movementX = (e.movementX || 0) * 0.0005 * sensitivity;
    const movementY = (e.movementY || 0) * 0.0005 * sensitivity;

    this.phi += -movementX * 5;
    this.theta = clamp(this.theta + -movementY * 5, -Math.PI / 2, Math.PI / 2);

    const qx = new Quaternion();
    qx.setFromAxisAngle(new Vector3(0, 1, 0), this.phi);
    const qz = new Quaternion();
    qz.setFromAxisAngle(new Vector3(1, 0, 0), this.theta);

    const q = new Quaternion();
    q.multiply(qx).multiply(qz);

    this.object.quaternion.copy(q);
  }

  move(direction) {
    const q = new Quaternion();
    q.setFromAxisAngle(new Vector3(0, 1, 0), this.phi);
    direction.applyQuaternion(q);
    direction.multiplyScalar(this.speed);

    this.transform.position.add(direction);
  }
}

export default Character;
