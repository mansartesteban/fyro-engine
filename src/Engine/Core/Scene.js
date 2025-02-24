import Viewer3d from "@core/Viewers/Viewer3d";
import { Vector2, Scene as ThreeScene, GridHelper, Vector3, PerspectiveCamera } from "three";
import EntityManager from "@core/EntityManager";
import ViewerManager from "./CameraManager"
import { ViewHelper } from "three/examples/jsm/Addons"

class Scene {
  initialized = false;
  threeScene;
  name = "";
  entityManager = null;
  viewer;
  #loopHasBeenWarned = false;

  constructor(name) {
    this.name = name;
    this.initialized = true;
    this.entityManager = new EntityManager(this);
    this.threeScene = new ThreeScene();
    // this.threeScene.rotateX(-Math.PI/2)
  }

  createViewer(mountOn, options) {
    let app = document.querySelector(mountOn);
    this.viewer = new Viewer3d(app, this.threeScene, {
      size: new Vector2(window.innerWidth, window.innerHeight),
      ...options
    });

    this.viewer.cameraManager.addCamera("dev", this.createDefaultCamera());
    this.viewer.cameraManager.activateCamera("dev")
  }
  
  createDefaultCamera() {
    let camera = new PerspectiveCamera(
      80,
      this.viewer.width / this.viewer.height,
      0.1,
      100000
    );

    camera.position.x = 0;
    camera.position.y = 100000;
    camera.position.z = 0;
    camera.lookAt(new Vector3());

    
    this.axisHelper?.render(this.viewer.renderer)
    this.axisHelper = new ViewHelper( camera, this.viewer.renderer.domElement );
    
    // this.options = { ...defaultOptions, ...options };
    // this.size = this.options.size;
    // this.color = this.options.color;
    // this.color.opacity = 0.01;
    
    
    // if (this.options.axisHelper) {
      // }
      return camera
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

  update(deltaTime) {
    this.isInitilized();
    this.loop(deltaTime);
    this.entityManager.update(deltaTime);
    this.viewer?.refresh(deltaTime);
  }

  setup() {
    console.warn(
      `"setup()" method is not implemented on the scene ${this.constructor.name}`
    );
  }
  loop(deltaTime) {
    if (!this.#loopHasBeenWarned) {
      this.#loopHasBeenWarned = true;
      console.warn(
        `"loop()" method is not implemented on the scene ${this.constructor.name}`
      );
    }
  }
}

export default Scene;
