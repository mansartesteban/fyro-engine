import Entity from "@core/Entity";
import MapRender from "./MapRender";

import { GUI } from "dat.gui";
import TerrainGenerator from "./TerrainGenerator";

class Map extends Entity {
  generator;
  constructor() {
    super();
    this.addComponent(new MapRender("map-render"));
  }

  generateMap() {
    this.generator = new TerrainGenerator();
    this.generator.scene = this.scene;

    this.addGui(this.generator);
    this.generator.create()
    // let meshRenderer = this.generator.create();
    // let meshRenderer = this.generator.load();
    
    // this.addComponent(meshRenderer);
  }

  update(tick) {
    // this.generator.update(tick)
    // this.generator.tick = tick
    // this.generator.createBiomes();
    // this.generator.modifyHeightMap();
    // this.generator.colorize();
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
      erosionMin: instance.erosionMin,
      erosionMax: instance.erosionMax,
      updateTerrainHeight: instance.updateTerrainHeight,
      lacunarity: instance.lacunarity,
      persistence: instance.persistence,
      verticality: instance.verticality,
      sharpness: instance.sharpness,
      scale: instance.scale,
      riverFrequency: instance.riverFrequency,
      riverAmplitude: instance.riverAmplitude,
      disturbAmplitude: instance.disturbAmplitude,
      disturbFrequency: instance.disturbFrequency,
      biomeBlendingSize: instance.biomeBlendingSize,
      biomeBlendingStrength: instance.biomeBlendingStrength,
      // topographicSteps: instance.topographicSteps
    };

    Object.keys(datas).forEach((key) => {
      gui.add(datas, key).onChange((value) => {
        instance[key] = value;
        // if (
        //   [
        //     "lacunarity",
        //     "scale",
        //     "persistence",
        //     "verticality",
        //     "erosionFrequency",
        //     "erosionWeight",
        //     "sharpness",
        //     "testerFrequency",
        //   ].includes(key)
        // ) {
        //   instance.createTesterMap();
        // } else {
        instance.createBiomes();

        instance.modifyHeightMap();

        // instance.createWater()
        instance.colorize();

        // }
      });
    });
  }
}

export default Map;
