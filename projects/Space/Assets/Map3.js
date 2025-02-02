import Entity from "@core/Entity";
import MapRender from "./MapRender";

import { GUI } from "dat.gui";
import TerrainGenerator from "./TerrainGenerator";

class Map extends Entity {
  constructor() {
    super();
    this.addComponent(new MapRender());
    this.generateMap();
  }

  generateMap() {
    let terrainGenerator = new TerrainGenerator();

    setTimeout(() => {
      terrainGenerator.scene = this.scene;
    }, 50);

    this.addGui(terrainGenerator);
    let meshRenderer = terrainGenerator.create();
    this.addComponent(meshRenderer);
  }

  addGui(instance) {
    const gui = new GUI();

    let datas = {
      altitudeFrequency: instance.altitudeFrequency,
      altitudeWeight: instance.altitudeWeight,
      temperatureFrequency: instance.temperatureFrequency,
      humidityFrequency: instance.humidityFrequency,
      erosionFrequency: instance.erosionFrequency,
      erosionWeight: instance.erosionWeight,
      updateTerrainHeight: instance.updateTerrainHeight,
    };

    Object.keys(datas).forEach((key) => {
      gui.add(datas, key).onChange((value) => {
        instance[key] = value
        instance.createBiomes();
        if (["altitudeFrequency", "erosionFrequency", "erosionWeight"].includes(key)) {
          instance.modifyHeightMap()
        }
        instance.colorize()
      });
    })
  }
}

export default Map;
