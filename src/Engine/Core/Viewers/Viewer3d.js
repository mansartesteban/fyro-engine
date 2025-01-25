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

  // const geometry = new THREE.BoxGeometry(1, 1, 1);
  // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  // const cube = new THREE.Mesh(geometry, material);
  // scene.add(cube);

  // const renderer = new THREE.WebGLRenderer();
  // renderer.setSize(window.innerWidth, window.innerHeight);
  // document.body.appendChild(renderer.domElement);

  // function animate() {
  //   renderer.render(scene, camera);
  // }
  // renderer.setAnimationLoop(animate);

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
      10000
    );

    // this.camera.position.x = 200;
    // this.camera.position.y = 200;
    // this.camera.position.z = 200;
    this.camera.position.x = 0;
    this.camera.position.y = 500;
    this.camera.position.z = 0;
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
