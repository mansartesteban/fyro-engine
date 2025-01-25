import MeshRenderComponent from "@core/Components/MeshRenderComponent";
import AssetsHandler from "@core/AssetsHandler";

class MapRender extends MeshRenderComponent {
  createGeometry() {
    return AssetsHandler.geometries.sphere;
  }

  createMaterial() {
    return AssetsHandler.materials.phong;
  }
}

export default MapRender;
