import Viewer3d from "@core/Viewers/Viewer3d";
import { Vector2, Scene as ThreeScene, GridHelper } from "three";
import EntityManager from "@core/EntityManager";

class Scene {
  viewer;
  initialized = false;
  threeScene;
  name = "";
  entityManager = null;

  #loopHasBeenWarned = false;

  constructor(name) {
    this.name = name;
    this.initialized = true;
    this.entityManager = new EntityManager(this);
    this.threeScene = new ThreeScene();
    this.threeScene.rotateX(-Math.PI/2)
  }

  createViewer(mountOn, options) {
    let app = document.querySelector(mountOn);
    this.viewer = new Viewer3d(app, this.threeScene, {
      size: new Vector2(window.innerWidth, window.innerHeight),
      ...options
    });
    this.viewer.render();
    return this.viewer;
  }

  isInitilized() {
    if (!this.initialized) {
      throw "Scene class has not been initialized";
    }
  }

  add(entity) {
    this.isInitilized();
    this.entityManager.add(entity);
    entity.scene = this
  }

  remove(entityToDelete) {
    this.isInitilized();
    const foundIndex = this.entities.findIndex(
      (entity) => entity === entityToDelete
    );
    if (foundIndex) {
      this.entities.splice(foundIndex, 1);
    }
  }

  update(tick) {
    this.isInitilized();
    this.loop(tick);
    this.entityManager.update(tick);
    this.viewer.refresh(tick);
  }

  setup() {
    console.warn(
      `"setup()" method is not implemented on the scene ${this.constructor.name}`
    );
  }
  loop() {
    if (!this.#loopHasBeenWarned) {
      this.#loopHasBeenWarned = true;
      console.warn(
        `"loop()" method is not implemented on the scene ${this.constructor.name}`
      );
    }
  }
}

export default Scene;
