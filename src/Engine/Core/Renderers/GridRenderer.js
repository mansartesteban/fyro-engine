import { GridHelper } from "three";
import MeshRenderComponent from "../Components/MeshRenderComponent";

class GridRender extends MeshRenderComponent {

    options = {
        size: 12,
        divisions: 100000,
        color1: 0xffffff,
        color2: 0xffffff
    };

    createMesh() {
        return new GridHelper(
            this.options.size,
            this.options.divisions,
            this.options.color1,
            this.options.color2
        );
    }

}

export default GridRender;