import { Object3D } from "three";
import TransformComponent from "@core/Components/TransformComponent";
import ArrayUtils from "@lib/Arrays";
import { generateUUID } from "three/src/math/MathUtils";

class Entity {
  uuid = generateUUID();
  name = "";
  components = [];
  
  object = new Object3D();
  transform = new TransformComponent();
  scene;

  constructor(...components) {
    this.selectable = true;
    components.forEach((component) => this.addComponent(component));
    this.initialize();
  }

  addComponent(component) {
    component.entity = this;
    component.refresh();
    this.components.push(component);
  }

  removeComponent(component) {
    let foundComponent = this.components.findIndex(
      (entityComponent) => entityComponent == component
    );
    if (foundComponent !== -1) {
      this.components.splice(foundComponent, 1);
    }
  }

  removeComponents(componentType) {
    let foundIndexes = ArrayUtils.findIndexMultiple(
      this.components,
      (component) => component instanceof componentType
    );
    if (foundIndexes) {
      ArrayUtils.removeMultiple(this.components, foundIndexes);
    }
  }

  getComponent(componentType) {
    return this.components.find((component) => {
      return component instanceof componentType;
    });
  }

  update(tick) {
    this.object.position.set(
      this.transform.position.x,
      this.transform.position.y,
      this.transform.position.z
    );
    this.object.scale.set(
      this.transform.scale.x,
      this.transform.scale.y,
      this.transform.scale.z
    );
    this.object.rotation.set(
      this.transform.rotation.x,
      this.transform.rotation.y,
      this.transform.rotation.z
    );
    this.components.forEach((component) => component.needsUpdate && component.updateComponent(tick));
  }

  initialize() {}
}

export default Entity;
