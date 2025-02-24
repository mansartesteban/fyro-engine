import { Object3D } from "three";
import TransformComponent from "@core/Components/TransformComponent";
import { generateUUID } from "three/src/math/MathUtils";
import Component from "./Component"

class Entity {
  uuid = generateUUID();
  name = "";
  components = new Map();
  
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
    this.components.set(component.name, component);
  }

  removeComponent(component) {
    this.components.delete(component.name)
  }

  getComponent(component) {
    let componentName = component instanceof Component ? component.name : component
    return this.components.get(componentName)
  }

  update(deltaTime) {
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
    // this.object.rotation.set(
    //   this.transform.rotation.x,
    //   this.transform.rotation.y,
    //   this.transform.rotation.z
    // );
    this.components.forEach((component) => component.needsUpdate && component.updateComponent(deltaTime));
  }

  initialize() {}
}

export default Entity;
