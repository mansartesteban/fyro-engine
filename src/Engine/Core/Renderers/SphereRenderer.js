import MeshRenderComponent from "@core/Components/MeshRenderComponent";
import AssetsHandler from "@core/AssetsHandler";

class SphereRender extends MeshRenderComponent {
  createGeometry() {
    return AssetsHandler.geometries.sphere;
  }
}

export default SphereRender;
