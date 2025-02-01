import Scene from "@core/Scene";
// import Map from "../Space/Assets/Map";
// import Map from "../Space/Assets/Map2";
import Map from "../Space/Assets/Map3";
import PointLight from "@assets/Lights/PointLight/Entity";
// import AmbientLight from "@assets/Lights/AmbientLight/Entity";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import MapCreator from "../Space/MapCreator";
import { AmbientLight } from "three"

class World extends Scene {
  sunlight;
  ambientLight;
  controls;

  setup() {
    let map = new Map();
    this.sunlight = new PointLight(0xffffff, 50000000, 5000000);
    this.sunlight.transform.position.z = 10000;

    let light = new AmbientLight(0xffffff, .2)
    this.threeScene.add(light)

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
  }
}

export default World;
