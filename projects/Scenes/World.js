import Scene from "@core/Scene";
// import Map from "../Space/Assets/Map";
import Map from "../Space/Assets/Map2";
import PointLight from "@assets/Lights/PointLight/Entity";
import AmbientLight from "@assets/Lights/AmbientLight/Entity";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import MapCreator from "../Space/MapCreator";

class World extends Scene {
  sunlight;
  ambientLight;
  controls;

  setup() {
    let map = new Map();
    this.sunlight = new PointLight(0xffffff, 100000, 10000);
    this.sunlight.transform.position.y = 300;

    // this.ambientLight = new AmbientLight(0xff0000, 1);

    this.add(map);
    this.add(this.sunlight);
    // this.add(this.ambientLight);

    this.controls = new OrbitControls(this.viewer.camera, this.viewer.node);

    // let world = MapCreator.createMap();
    // this.add(world);
  }

  loop(tick) {
    this.controls.update();
    // this.sunlight.transform.position.x =
    //   Math.sin((tick + (Math.PI / 3) * 100) / 100) * 3;
    // this.sunlight.transform.position.z =
    //   Math.cos((tick + (Math.PI / 3) * 100) / 100) * 3;
  }
}

export default World;
