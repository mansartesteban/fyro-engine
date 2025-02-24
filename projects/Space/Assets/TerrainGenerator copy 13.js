import {
  Color,
  Float32BufferAttribute,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import { createNoise2D } from "simplex-noise";
import MeshRenderComponent from "@core/Components/MeshRenderComponent";
import alea from "alea";

import Console from "@core/../Console/Console";
import Command from "../../../src/Engine/Console/Command";
import { lerp } from "three/src/math/MathUtils.js";
import BiomeMapper from "./BiomeMapping"

class TerrainGenerator {
  terrainWidth = 50000;
  terrainHeight = 50000;
  subdivisions = 128;

  altitudeFrequency = 5;
  temperatureFrequency = 2;
  humidityFrequency = 4;
  erosionFrequency = 4;

  altitudeWeight = 25;
  erosionWeight = 25

  lacunarity = 2.5
  persistence = .45
  scale = 5

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
  reliefMapNoise = createNoise2D(alea("relief-noise"))

  scene;

  #verticesDatas = [];

  #geometry;
  #material;
  #meshRenderer;

  create() {
    this.createTerrain();
    this.createBiomes();
    this.generateRelief()
    this.modifyHeightMap();


    this.colorize();

    // Console.execute("maps toggle --erosion");

    return this.#meshRenderer;
  }

  /**
   * Create biomes by positioning random biome centers and applying delaunay triangulation and voronoi diagram
   */
  createBiomes() {
    this.createErosionMap();
    this.createAltitudeMap();
    this.createTemperatureMap();
    this.createHumidityMap();

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
    return BiomeMapper.findBiome(params.temperature, params.humidity)
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

  generateRelief() {
    let octaves = 4
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);

      let amplitude = 1;
      let frequency = 1;
      let noiseHeight = 0;

      // Génération multi-octaves
      for (let octave = 0; octave < octaves; octave++) {
        const nx = (x / this.terrainWidth * this.scale) * frequency //+ seed;
        const ny = (y / this.terrainHeight * this.scale) * frequency //+ seed;

        const noiseValue = (this.reliefMapNoise(nx, ny) + 1)/2; 
        noiseHeight += noiseValue * amplitude;

        amplitude *= this.persistence;   // Réduit l'amplitude à chaque octave
        frequency *= this.lacunarity;    // Augmente la fréquence à chaque octave
      }

      this.#verticesDatas[i].height = noiseHeight ** 2;
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
        n = ((2 * n - 1) ** 3)/ 2 + .5
      // this.#verticesDatas[i].altitude = (n ** 5 + this.#verticesDatas[i].erosion * this.erosionWeight)/(this.erosionWeight+1);
      this.#verticesDatas[i].altitude = (n + this.#verticesDatas[i].erosion * this.erosionWeight) / (this.erosionWeight + 1)
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

      const nx = x / this.terrainWidth 
      const ny = y / this.terrainHeight

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
      this.#verticesDatas[i].erosion =  1 - n ** 2
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
        color.multiplyScalar(this.#verticesDatas[i].altitude > .8 ? 1 : this.#verticesDatas[i].altitude);
      } else if (this.showTemperature) {
        color = baseColor.clone();
        color.multiplyScalar(this.#verticesDatas[i].temperature < .2 ? 1 : this.#verticesDatas[i].temperature);
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

  // Create the basis of geometry, material and mesh for the terrain. All modifiers applied to are in other function of this class
  createTerrain() {

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
        height: 0,
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
          this.#geometry.attributes.position.setZ(
            i,
            (this.#verticesDatas[i].height * this.#verticesDatas[i].altitude) * this.maxAltitude
          );
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
