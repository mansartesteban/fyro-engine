import Component from "@/Engine/Core/Component";
import { PerspectiveCamera, Vector3 } from "three";

class CameraComponent extends Component {
  camera = null;

  constructor(name, options) {
    super(name, options)
  }

  setup() {
    let playerCamera = new PerspectiveCamera(
      50,
      this.entity?.scene?.viewer.width / this.entity?.scene?.viewer.height,
      0.1,
      100000000
    );
    
    playerCamera.lookAt(new Vector3());
    this.camera = playerCamera;
    this.needsUpdate = true

  }

  update() {
    this.camera.position.x = this.entity.transform.position.x;
    this.camera.position.y = this.entity.transform.position.y;
    this.camera.position.z = this.entity.transform.position.z;

    this.camera.quaternion.copy(this.entity.object.quaternion)
  }
}

export default CameraComponent;
