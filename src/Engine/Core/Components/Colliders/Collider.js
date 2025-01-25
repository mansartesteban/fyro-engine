import MeshRenderComponent from "../MeshRenderComponent";
import { Box3 } from "three";
import SceneManager from "@core/SceneManager";
import Component from "@core/Component";

class Collider extends Component {
  // CollisionResponse => if RigidBody ?
  // Mass
  // ShouldResponds

  init = false;
  preCollideWith = [];

  meshRenderer = null;
  otherMeshRenderer = null;

  b1 = new Box3();
  b2 = new Box3();

  options = {
    applyResponse: true,
  };

  constructor() {
    super();
    setTimeout(() => (this.init = true), 0);
  }

  accept(entity, otherEntity) {
    if (this.meshRenderer === null) {
      this.meshRenderer = entity.getComponent(MeshRenderComponent);
    }
    if (this.otherMeshRenderer === null) {
      this.otherMeshRenderer = otherEntity.getComponent(MeshRenderComponent);
    }
    if (this.meshRenderer && this.otherMeshRenderer) {
      // console.log(this.meshRenderer.object.boundingBox);
      this.b1.setFromObject(this.meshRenderer.object);
      this.b2.setFromObject(this.otherMeshRenderer.object);

      if (this.b1.intersectsBox(this.b2)) {
        // console.log("collingding", entity.velocity);
        if (this.applyResponse) {
          entity.velocity.add(otherEntity.velocity.clone().divideScalar(10));
        }
        // otherEntity.velocity.add(entity.velocity.clone().normalize());
      }
      // this.meshRenderer.object.boundingBox;
    }
    // collider.getCom.collide(this);
  }

  applyResponse() {}

  // collideBox(collider) {
  // 1) Get the bounding box of incoming collider
  // 2) Check if there is a Collision with the bounding box of this
  // 3) Create a collision response
  // 4) Return the collision response
  // }

  update(entity) {
    if (this.init) {
      SceneManager.entities.forEach((otherEntity) => {
        if (otherEntity !== entity && otherEntity.getComponent(Collider)) {
          this.accept(entity, otherEntity);
        }
      });
    }
  }
}

export default Collider;

/*
    Be careful at what I am doing here.
    The Visitor Design Pattern I am trying to implement is useful for collision responses NOT collision detection
*/
