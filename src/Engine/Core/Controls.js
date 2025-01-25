import { Quaternion, Vector2, Vector3 } from "three";
import { clamp } from "three/src/math/MathUtils";

class Controls {
  camera;
  renderer;

  keys = [];
  actions;

  isPaused = false;

  mouseSensitivity = 0.1;
  cameraSpeed = 0.1;
  theta = 0;
  phi = 0;

  constructor(camera, renderer) {
    this.camera = camera;
    this.renderer = renderer;

    this.actions = {};
    this.mouse = new Vector2();

    this.addListeners();
    this.bindActions();
    this.bindMouseMovments();
  }

  update() {
    if (this.keys.includes("shift")) {
      this.cameraSpeed = 0.5;
    } else {
      this.cameraSpeed = 0.1;
    }

    this.keys.forEach((k) => {
      if (this.actions[k]) {
        this.actions[k].bind(this)();
      }
    });
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  bindActions() {
    this.actions = {
      z: this.moveForward,
      s: this.moveBackward,
      q: this.moveLeft,
      d: this.moveRight,
      a: this.moveDown,
      e: this.moveUp,
    };
  }

  bindMouseMovments() {
    const onMouseMove = (e) => {
      if (this.renderer.domElement === document.pointerLockElement) {
        if (!this.isPaused) {
          this.rotateCamera(e);
        }
      }
    };
    const onWheel = (e) => {
      // this.modifyCameraSpeed(e);
    };

    this.renderer.domElement.addEventListener("mousedown", async (e) => {
      if (e.which !== 3) {
        if (this.renderer.domElement !== document.pointerLockElement) {
          await this.renderer.domElement.requestPointerLock({
            unadjustedMovement: true,
          });

          this.renderer.domElement.addEventListener("mousemove", onMouseMove);
          this.renderer.domElement.addEventListener("wheel", onWheel, {
            passive: true,
          });
        }
      }
    });

    this.renderer.domElement.addEventListener("mouseup", async () => {
      if (this.renderer.domElement === document.pointerLockElement) {
        document.exitPointerLock();
        this.renderer.domElement.removeEventListener("mousemove", onMouseMove);
        this.renderer.domElement.removeEventListener("wheel", onWheel);
      }
    });
  }

  addListeners() {
    window.addEventListener("keydown", (e) => {
      if (this.keys.indexOf(e.key.toLowerCase()) === -1) {
        this.keys.push(e.key.toLowerCase());
      }
    });
    window.addEventListener("keyup", (e) => {
      if (this.keys.indexOf(e.key.toLowerCase()) !== -1) {
        this.keys = this.keys.filter((k) => k !== e.key.toLowerCase());
      }
    });
  }

  rotateCamera(e) {
    const movementX = (e.movementX || 0) * 0.0005;
    const movementY = (e.movementY || 0) * 0.0005;

    this.phi += -movementX * 5;
    this.theta = clamp(this.theta + -movementY * 5, -Math.PI / 2, Math.PI / 2);

    const qx = new Quaternion();
    qx.setFromAxisAngle(new Vector3(0, 1, 0), this.phi);
    const qz = new Quaternion();
    qz.setFromAxisAngle(new Vector3(1, 0, 0), this.theta);

    const q = new Quaternion();
    q.multiply(qx).multiply(qz);

    this.camera.quaternion.copy(q);
  }

  modifyCameraSpeed(e) {
    this.cameraSpeed *= Math.pow(1.05, -e.deltaY / Math.abs(e.deltaY));
    if (this.cameraSpeed <= 0) this.cameraSpeed = 0.1;
  }

  moveCamera(direction) {
    const q = new Quaternion();
    q.setFromAxisAngle(new Vector3(0, 1, 0), this.phi);
    direction.applyQuaternion(q);
    direction.multiplyScalar(this.cameraSpeed);

    this.camera.position.add(direction);
  }

  moveForward() {
    this.moveCamera(new Vector3(0, 0, -1));
  }

  moveLeft() {
    this.moveCamera(new Vector3(-1, 0, 0));
  }

  moveRight() {
    this.moveCamera(new Vector3(1, 0, 0));
  }

  moveBackward() {
    this.moveCamera(new Vector3(0, 0, 1));
  }

  moveDown() {
    this.moveCamera(new Vector3(0, -1, 0));
  }

  moveUp() {
    this.moveCamera(new Vector3(0, 1, 0));
  }
}

export default Controls;
