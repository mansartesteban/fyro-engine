import Viewer from "./Viewer";
import UndefinedError from "@/Application/Errors/UndefinedError";
import RGB from "@/Engine/Lib/RGB";
import { PerspectiveCamera, Vector3, WebGLRenderer } from "three";
import { ViewHelper } from 'three/addons/helpers/ViewHelper.js';

const defaultOptions = {
  size: new Vector3(),
  color: RGB.Black,
  axisHelper: false
};

class Viewer3d extends Viewer {
  size;
  color;
  renderer;
  node;
  scene;
  camera;
  axisHelper;

  constructor(node, scene, options) {
    super();

    if (!scene) {
      throw new UndefinedError("scene");
    }
    this.scene = scene;

    this.camera = new PerspectiveCamera(
      80,
      this.node?.clientWidth / this.node?.clientHeight,
      0.1,
      100000
    );

    this.camera.position.x = 20000;
    this.camera.position.y = 20000;
    this.camera.position.z = 20000;
    // this.camera.position.x = 0;
    // this.camera.position.y = 500;
    // this.camera.position.z = 0;
    this.camera.lookAt(new Vector3());

    this.options = { ...defaultOptions, ...options };
    this.size = this.options.size;
    this.color = this.options.color;
    this.color.opacity = 0.01;
    
    this.node = node;
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.autoClear = false;
    this.render();

    if (this.options.axisHelper) {
      this.axisHelper = new ViewHelper( this.camera, this.renderer.domElement );
    }
  }

  recalculateRatio() {
    if (this.renderer !== null) {
      this.renderer.setSize(this.node.clientWidth, this.node.clientHeight);
    }

    if (this.camera) {
      this.camera.aspect =
        this.node.clientWidth / this.renderer.domElement.height;
      this.camera.updateProjectionMatrix();
    }
  }

  render() {
    this.node.append(this.renderer.domElement);
    this.recalculateRatio();
  }

  refresh() {
    this.renderer.clear()
    this.renderer.render(this.scene, this.camera);
    if (this.options.axisHelper) {
      this.axisHelper?.render(this.renderer)
    }
  }
}

export default Viewer3d;
