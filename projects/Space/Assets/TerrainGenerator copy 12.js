import {
  Color,
  Float32BufferAttribute,
  GridHelper,
  MeshPhongMaterial,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import { createNoise2D } from "simplex-noise";
import MeshRenderComponent from "@core/Components/MeshRenderComponent";
import alea from "alea";

import Console from "@core/../Console/Console";
import Command from "../../../src/Engine/Console/Command";
import { lerp } from "three/src/math/MathUtils.js";
import ColdDesert from "./Biomes/ColdDesert";
import Grassland from "./Biomes/Grassland";
import HotDesert from "./Biomes/HotDesert";
import Iceland from "./Biomes/Iceland";
import Savana from "./Biomes/Savana";
import Swamp from "./Biomes/Swamp";
import Taiga from "./Biomes/Taiga";
import TemperedForest from "./Biomes/TemperedForest";
import TropicalForest from "./Biomes/TropicalForest";
import Tundra from "./Biomes/Tundra";
import Plain from "./Biomes/Plain";
import RockyDesert from "./Biomes/RockyDesert"

class TerrainGenerator {
  terrainWidth = 50000;
  terrainHeight = 50000;
  subdivisions = 128;

  altitudeFrequency = 2.5;
  temperatureFrequency = 5;
  humidityFrequency = 3;
  erosionFrequency = 1.5;

  altitudeWeight = 5;

  showAltitude = false;
  showTemperature = false;
  showHumidity = false;
  showErosion = false;

  updateTerrainHeight = true;

  maxAltitude = 5000;

  altitudeMapNoise = createNoise2D(alea("altitude-noise"));
  temperatureMapNoise = createNoise2D(alea("temperature-noise"));
  humidityMapNoise = createNoise2D(alea("humidity-noise"));
  erosionMapNoise = createNoise2D(alea("erosion-noise"));

  scene;

  #verticesDatas = [];

  #geometry;
  #material;
  #meshRenderer;

  biomes = [
    new Iceland(),
    new Tundra(),
    new Taiga(),
    new ColdDesert(),
    new Grassland(),
    new TemperedForest(),
    new RockyDesert(),
    new HotDesert(),
    new Savana(),
    new TropicalForest(),
    new Swamp(),
    new Plain(),
  ];

  create() {
    this.createTerrain();
    this.createBiomes();
    this.modifyHeightMap();
    this.colorize();

    // Console.execute("maps toggle --temperature");

    return this.#meshRenderer;
  }

  /**
   * Create biomes by positioning random biome centers and applying delaunay triangulation and voronoi diagram
   */
  createBiomes() {
    this.createAltitudeMap();
    this.createTemperatureMap();
    this.createHumidityMap();
    this.createErosionMap();

    this.computeBiomes();

    Console.register(
      new Command("maps", [
        new Command("toggle", (arg) => this.showMap(arg), {
          help: "Show the different noise maps",
        })
          .addOption("altitude", null, "Show the altitude map")
          .addOption("temperature", null, "Show the temperature map")
          .addOption("humidity", null, "Show the humidity map")
          .addOption("erosion", null, "Show the erosion map"),
        new Command("reset", () => this.showMap(), {
          help: "Reset the map to the default one",
        }),
      ])
    );
  }

  showMap(type) {
    if (type["--reset"]) {
      this.showAltitude = false;
      this.showTemperature = false;
      this.showHumidity = false;
      this.showErosion = false;
    } else {
      this.showAltitude = !!type["--altitude"]
        ? !this.showAltitude
        : this.showAltitude;
      this.showTemperature = !!type["--temperature"]
        ? !this.showTemperature
        : this.showTemperature;
      this.showHumidity = !!type["--humidity"]
        ? !this.showHumidity
        : this.showHumidity;
      this.showErosion = !!type["--erosion"]
        ? !this.showErosion
        : this.showErosion;
    }
    this.colorize();
  }

  // determinateBiome(i) {
  //   let params = this.#verticesDatas[i];

  //   const desertFactor = 1 - params.humidity;
  //   const coldFactor = 1 - params.temperature;

  //   const desertChance = lerp(0.7, 0.9, desertFactor);
  //   const forestChance = lerp(0.4, 0.8, params.humidity);
  //   const tundraChance = lerp(0.6, 0.9, coldFactor);

  //   if (params.temperature > 0.8 && params.humidity < desertChance)
  //     return { name: "Désert chaud", color: new Color(0xff0000) };
  //   if (params.temperature > 0.5 && params.humidity > forestChance)
  //     return { name: "Forêt tempérée", color: new Color(0x22aa33) };
  //   if (params.temperature < 0.3 && params.humidity < tundraChance)
  //     return { name: "Toundra", color: new Color(0x00ffff) };
  //   if (params.temperature < 0.2)
  //     return { name: "Glacier", color: new Color(0xffffff) };
  //   if (params.humidity > 0.8)
  //     return { name: "Marais", color: new Color(0x995522) };

  //   return { name: "Plaine", color: new Color(0x00ff00) };
  // }

  lerp(a, b, t) {
    return a * (1 - t) + b * t;
  }

  lerpColor(colorA, colorB, t) {
    const r = lerp(colorA.r * 255, colorB.r * 255, t);
    const g = lerp(colorA.g * 255, colorB.g * 255, t);
    const b = lerp(colorA.b * 255, colorB.b * 255, t);
    return new Color(r / 255, g / 255, b / 255); // Normalisation des valeurs
  }

  determinateBiome(i) {
    let params = this.#verticesDatas[i];

    // const humidityFactor = 1 - params.humidity;
    // const temperatureFactor = 1 - params.temperature;

    return this.biomes.find((biome) => {
      let cond =
        biome.conditions.temperature.min <= params.temperature &&
        biome.conditions.temperature.max >= params.temperature &&
        biome.conditions.humidity.min <= params.humidity &&
        biome.conditions.humidity.max >= params.humidity;
      // console.log(
      //   "params",
      //   cond,
      //   params,
      //   biome,
      //   biome.conditions.temperature.min <= params.temperature,
      //   biome.conditions.temperature.max >= params.temperature,
      //   biome.conditions.humidity.min <= params.humidity,
      //   biome.conditions.humidity.max >= params.humidity
      // );
      return cond;
    });
  }

  calculateScore(biome, temperature, humidity) {
    // Calcul de la distance par rapport aux valeurs optimales
    const tempDiff = Math.abs(temperature - biome.averageConditions.temperature);
    const humidityDiff = Math.abs(humidity - biome.averageConditions.humidity);

    let temperatureRange =
      biome.conditions.temperature.max - biome.conditions.temperature.min;
    let humidityRange =
      biome.conditions.humidity.max - biome.conditions.humidity.min;

    // Plus la distance est faible, plus le score est élevé
    return 1 - (tempDiff / temperatureRange + humidityDiff / humidityRange) / 2;
  }

  computeBiomes() {
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      this.#verticesDatas[i].biome = this.determinateBiome(i);
    }
  }

  createAltitudeMap() {
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);

      const nx = x / this.terrainWidth;
      const ny = y / this.terrainHeight;

      let n =
        (this.altitudeMapNoise(
          nx * this.altitudeFrequency,
          ny * this.altitudeFrequency
        ) +
          1) /
        2;
      this.#verticesDatas[i].altitude = n;
    }
  }

  createTemperatureMap() {
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);

      const nx = x / this.terrainWidth;
      const ny = y / this.terrainHeight;

      let altitudeInfluence = this.#verticesDatas[i].altitude;
      let n =
        (this.temperatureMapNoise(
          nx * this.temperatureFrequency,
          ny * this.temperatureFrequency
        ) +
          1) /
        2;

      n =
        (n + this.altitudeWeight * altitudeInfluence) /
        (this.altitudeWeight + 1);
      this.#verticesDatas[i].temperature = 1 - n;
    }
  }

  createHumidityMap() {
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);

      const nx = x / this.terrainWidth;
      const ny = y / this.terrainHeight;

      let n =
        (this.humidityMapNoise(
          nx * this.humidityFrequency,
          ny * this.humidityFrequency
        ) +
          1) /
        2;
      this.#verticesDatas[i].humidity = n;
    }
  }

  createErosionMap() {
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);

      const nx = x / this.terrainWidth;
      const ny = y / this.terrainHeight;

      let n =
        (this.erosionMapNoise(
          nx * this.erosionFrequency,
          ny * this.erosionFrequency
        ) +
          1) /
        2;
      this.#verticesDatas[i].erosion = n;
    }
  }

  // Apply color for each biome. If a vertice is near to an edge (depending on influenceThreshold), mix color for each near biome for smooth transitions
  colorize() {
    let colors = [];
    let baseColor = new Color(0xffffff);
    // Loop through each vertice
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      let color;
      if (this.showAltitude) {
        color = baseColor.clone();
        color.multiplyScalar(this.#verticesDatas[i].altitude);
      } else if (this.showTemperature) {
        color = baseColor.clone();
        color.multiplyScalar(this.#verticesDatas[i].temperature);
      } else if (this.showHumidity) {
        color = baseColor.clone();
        color.multiplyScalar(this.#verticesDatas[i].humidity);
      } else if (this.showErosion) {
        color = baseColor.clone();
        color.multiplyScalar(this.#verticesDatas[i].erosion);
      } else {
        color = this.#verticesDatas[i].biome.color || baseColor;
      }
      let arr = color.toArray();
      colors[i * 3] = arr[0];
      colors[i * 3 + 1] = arr[1];
      colors[i * 3 + 2] = arr[2];
    }
    // Reset the buffer array in the geometry and recompute normals
    this.#geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    this.#geometry.computeVertexNormals();
  }

  // Apply a weighted color mix depending
  mixMultipleColors(colors, weights) {
    if (colors.length !== weights.length) {
      throw new Error("Arrays 'colors' and 'weights' have not the same length");
    }

    // Normalize weights
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = weights.map((weight) => weight / totalWeight);

    // Base color to increment
    const mixedColor = new Color(0, 0, 0);

    // Add colors based on their weight
    colors.forEach((color, i) => {
      const tempColor = new Color(color);
      mixedColor.add(tempColor.multiplyScalar(normalizedWeights[i]));
    });

    return mixedColor;
  }

  weightedAverage(values, weights) {
    if (values.length !== weights.length) {
      throw new Error(
        "Les tableaux des valeurs et des poids doivent avoir la même longueur."
      );
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) {
      throw new Error("La somme des poids ne peut pas être nulle.");
    }

    const weightedSum = values.reduce(
      (sum, value, i) => sum + value * weights[i],
      0
    );
    return weightedSum / totalWeight;
  }

  // Create the basis of geometry, material and mesh for the terrain. All modifiers applied to are in other function of this class
  createTerrain() {
    const gridHelper = new GridHelper(this.terrainWidth, this.subdivisions);
    gridHelper.rotation.x = -Math.PI / 2;
    setTimeout(() => {
      // this.scene.threeScene.add(gridHelper)
    }, 50);

    this.#geometry = new PlaneGeometry(
      this.terrainWidth,
      this.terrainHeight,
      this.subdivisions,
      this.subdivisions
    );

    // this.#material = new MeshLambertMaterial({vertexColors: true});
    // this.#material = new MeshBasicMaterial({ vertexColors: true });

    this.#material = new ShaderMaterial({
      vertexShader: `
          flat varying vec3 vColor;
          void main() {
              vColor = color; // Passe la couleur brute sans interpolation
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
      `,
      fragmentShader: `
          flat varying vec3 vColor;
          void main() {
              gl_FragColor = vec4(vColor, 1.0); // Affiche la couleur brute
          }
      `,
      vertexColors: true, // Active les couleurs par sommet
    });

    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      this.#verticesDatas[i] = {
        altitude: 0,
        temperature: 0,
        humidity: 0,
        erosion: 0,
        biome: null,
      };
    }

    // this.#material = new MeshPhongMaterial();
    this.#meshRenderer = new MeshRenderComponent({
      geometry: this.#geometry,
      material: this.#material,
    });
  }

  // Modify the altitude of the vertices to create on organic terrain. Based on SimplexNoise
  modifyHeightMap() {
    // Loop through each vertice
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      if (this.updateTerrainHeight) {
        if (this.#verticesDatas[i].altitude) {
          this.#geometry.attributes.position.setZ(
            i,
            this.#verticesDatas[i].altitude * this.maxAltitude
          );
        }
      }
    }

    // Recompute normals and indicate to Three to update the mesh
    this.#geometry.computeVertexNormals();
    this.#geometry.attributes.position.needsUpdate = true;
  }
}

export default TerrainGenerator;

/* 
TODO - Next steps
- Add pRNG (seeded generation)
- Add a basic terrain heightsmap (like fundamental basic surface leveling)
- Add LOD (maybe a kind of LOD as for previewing the generation)
*/
