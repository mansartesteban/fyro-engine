import Entity from "@core/Entity";
import MapRender from "./MapRender";

import { GUI } from "dat.gui";
import TerrainGenerator from "./TerrainGenerator";

class Map extends Entity {
  generator;
  constructor() {
    super();
    this.addComponent(new MapRender());
    this.generateMap();
  }

  generateMap() {
    this.generator = new TerrainGenerator();

    setTimeout(() => {
      this.generator.scene = this.scene;
    }, 50);

    this.addGui(this.generator);
    let meshRenderer = this.generator.create();
    this.addComponent(meshRenderer);
  }

  update(tick) {
    // this.generator.createTesterMap(tick)
  }

  addGui(instance) {
    const gui = new GUI();

    let datas = {
      altitudeFrequency: instance.altitudeFrequency,
      altitudeWeight: instance.altitudeWeight,
      temperatureFrequency: instance.temperatureFrequency,
      humidityFrequency: instance.humidityFrequency,
      testerFrequency: instance.testerFrequency,
      erosionFrequency: instance.erosionFrequency,
      erosionWeight: instance.erosionWeight,
      erosionMin: instance.erosionMin,
      erosionMax: instance.erosionMax,
      updateTerrainHeight: instance.updateTerrainHeight,
      lacunarity: instance.lacunarity,
      persistence: instance.persistence,
      verticality: instance.verticality,
      sharpness: instance.sharpness,
      scale: instance.scale,
      disturbAmplitude: instance.disturbAmplitude,
      biomeBlendingSize: instance.biomeBlendingSize,
      biomeBlendingStrength: instance.biomeBlendingStrength,
    };

    Object.keys(datas).forEach((key) => {
      gui.add(datas, key).onChange((value) => {
        instance[key] = value;
        if (
          [
            "lacunarity",
            "scale",
            "persistence",
            "verticality",
            "erosionFrequency",
            "erosionWeight",
            "sharpness",
            "testerFrequency",
          ].includes(key)
        ) {
          instance.createTesterMap();
        } else {
          instance.createBiomes();
          if (
            [
              "altitudeFrequency",
              "erosionFrequency",
              "erosionWeight",
              "lacunarity",
              "persistence",
              "scale",
            ].includes(key)
          ) {
            // instance.generateRelief();
            instance.modifyHeightMap();
          }
        }
        instance.colorize();
      });
    });
  }
}

export default Map;
