import Entity from "@core/Entity";
import MapRender from "./MapRender";

import { GUI } from "dat.gui";
import BiomeForest from "./Biomes/BiomeForest";
import BiomePlain from "./Biomes/BiomeGrassland";
import BiomeLake from "./Biomes/BiomeLake";
import TerrainGenerator from "./TerrainGenerator";

const biomes = [BiomeForest, BiomePlain, BiomeLake];

class Map extends Entity {
  constructor() {
    super();
    this.addComponent(new MapRender());
    this.generateMap();
  }

  generateMap() {
    let terrainGenerator = new TerrainGenerator();

    setTimeout(() => {
      terrainGenerator.scene = this.scene
    }, 50)

    this.addGui(terrainGenerator);
    let meshRenderer = terrainGenerator.create();
    this.addComponent(meshRenderer);
  }

  addGui(instance) {
    const gui = new GUI();

    let payload = {};
    Object.getOwnPropertyNames(instance).forEach((attribute) => {
      payload[attribute] = instance[attribute] ?? 0;

      gui.add(payload, attribute).onChange((value) => {
        instance[attribute] = value;
        instance.update();
      });
    });
  }
}

export default Map;
