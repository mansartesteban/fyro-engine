import Entity from "@core/Entity";
import MapRender from "./MapRender";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import MeshRenderComponent from "@core/Components/MeshRenderComponent";
import ArrayUtils from "@lib/Arrays";

import { SimplexNoise } from "three/examples/jsm/Addons.js";
import { GUI } from "dat.gui";
import { Delaunay } from "d3-delaunay";
import BiomeForest from "./Biomes/BiomeForest";
import BiomePlain from "./Biomes/BiomeGrassland";
import BiomeLake from "./Biomes/BiomeLake";
import TerrainGenerator from "./TerrainGenerator";

const biomes = [BiomeForest, BiomePlain, BiomeLake];

class Map extends Entity {
  constructor() {
    super();
    this.addComponent(new MapRender());
    // this.createMap();
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
