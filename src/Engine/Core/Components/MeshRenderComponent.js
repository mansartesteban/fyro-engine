import { Mesh } from "three";
import AssetsHandler from "@core/AssetsHandler";
import Component from "@core/Component";

class MeshRenderComponent extends Component {
  material;
  geometry;
  object;

  // type: Wireframe, shades

  constructor(name, options) {
    super(name, options);

    this.material = options?.material || this.createMaterial();
    this.geometry = options?.geometry || this.createGeometry();
    this.object = this.createMesh();
  }

  refresh() {
    this.entity.object = this.object;
  }

  createGeometry() {
    return;
  }

  createMaterial() {
    return AssetsHandler.materials.basic;
  }
  createMesh() {
    return new Mesh(this.geometry, this.material);
  }

  update() {
    if (this.object) {
      this.object.position.copy(this.entity.transform.position);
      this.object.rotation.setFromVector3(this.entity.transform.rotation);
      this.object.scale.copy(this.entity.transform.scale);
    }
  }
}

export default MeshRenderComponent;
