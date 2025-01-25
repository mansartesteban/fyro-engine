import { BackSide, BoxGeometry, MeshBasicMaterial, TextureLoader } from "three";
import MeshRenderComponent from "@core/Components/MeshRenderComponent";

class SkyBoxRender extends MeshRenderComponent {
  createGeometry() {
    return new BoxGeometry(10000, 10000, 10000);
  }

  createMaterial() {
    function createMaterialArray(urls) {
      return urls.map((image) => {
        let texture = new TextureLoader().load(image);
        return new MeshBasicMaterial({ map: texture, side: BackSide });
      });
    }

    if (this.options) {
      return createMaterialArray(this.options.urls);
    } else {
      return null;
    }
  }
}

export default SkyBoxRender;
