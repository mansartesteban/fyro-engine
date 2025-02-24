import Viewer from "./Viewer";
import UndefinedError from "@/Application/Errors/UndefinedError";
import RGB from "@/Engine/Lib/RGB";
import { PerspectiveCamera, Vector3, WebGLRenderer } from "three";
import { ViewHelper } from "three/addons/helpers/ViewHelper.js";
import CameraManager from "../CameraManager";

class Viewer3d extends Viewer {
  renderer;
  node;
  scene;
  cameraManager;
  axisHelper;
  width = 0;
  height = 0;

  constructor(node, scene) {
    super();

    if (!scene) {
      throw new UndefinedError("scene");
    }
    this.scene = scene;

    this.node = node;
    this.width = node.clientWidth;
    this.height = node.clientHeight;
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.autoClear = false;
    this.render();

    this.cameraManager = new CameraManager(this.scene, this.renderer);
  }

  recalculateRatio() {
    if (this.renderer !== null) {
      this.renderer.setSize(this.node.clientWidth, this.node.clientHeight);
    }

    // if (this.cameraManager.activeCamera) {
    //   this.cameraManager.activeCamera.aspect =
    //     this.node.clientWidth / this.renderer.domElement.height;
    //   this.cameraManager.activeCamera.updateProjectionMatrix();
    // }
  }

  render() {
    this.node.append(this.renderer.domElement);
    this.recalculateRatio();
  }

  refresh() {
    this.renderer.clear();
    this.renderer.render(this.scene, this.cameraManager.activeCamera);
  }
}

export default Viewer3d;
