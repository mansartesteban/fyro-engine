import { Vector3 } from "three"
import Component from "../Component.js";

class PhysicsComponent extends Component {

  worldManager = null
  needsUpdate = true;

  gravity = new Vector3(0, -9.81, 0);
  velocity = new Vector3(0, 0, 0);

  isOnGround = true;

  constructor(name, worldManager, options) {
    super(name, options)

    this.worldManager = worldManager
  }

  update(deltaTime)  {

    this.velocity.add(this.gravity.clone().multiplyScalar(deltaTime));
    this.entity.transform.position.add(this.velocity.clone().multiplyScalar(deltaTime))

    let height = this.worldManager.getHeight(this.entity.transform.position.x, this.entity.transform.position.z)

    if (this.entity.transform.position.y < height + 2) {
      this.entity.transform.position.y = height + 2
      this.velocity.y = 0
      this.isOnGround = true
    } else {
      this.isOnGround = false
    }
  }
}

export default PhysicsComponent;
