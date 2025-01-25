import {
  BoxGeometry,
  Color,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  SphereGeometry,
  TetrahedronGeometry,
} from "three";
import RGB from "@lib/RGB";

class AssetHandler {
  geometries = {
    cube: new BoxGeometry(1, 1, 1),
    sphere: new SphereGeometry(1, 20, 20),
    tetrahedron: new TetrahedronGeometry(1, 1),
  };
  materials = {
    basic: new MeshBasicMaterial({ color: RGB.Green }),
    lambert: new MeshLambertMaterial({ color: 0xffffff }),
    phong: new MeshPhongMaterial({ color: 0xffffff }),
  };
}

export default new AssetHandler();
