import {
  Color,
  Float32BufferAttribute,
  MeshLambertMaterial,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import { createNoise2D } from "simplex-noise";
import MeshRenderComponent from "@core/Components/MeshRenderComponent";
import alea from "alea";

import Console from "@core/../Console/Console";
import Command from "../../../src/Engine/Console/Command";
import { clamp, lerp } from "three/src/math/MathUtils.js";
import BiomeMapper from "./BiomeMapping";

class TerrainGenerator {
  terrainSize = 50000;
  subdivisions = 1024;

  altitudeFrequency = 5;
  temperatureFrequency = 2;
  humidityFrequency = 3.5;
  erosionFrequency = 3;
  testerFrequency = 5;

  altitudeWeight = 25;
  erosionWeight = 1;
  erosionMin = 2;
  erosionMax = 6;

  verticality = 0.75;
  lacunarity = 2.75;
  persistence = 0.36;
  scale = 2;
  sharpness = 1.5;
  disturbAmplitude = 2.2;
  disturbFrequency = 7;
  biomeBlendingSize = 0.08;
  biomeBlendingStrength = 1;
  waterThreshold = 1;

  riverFrequency = 0.05;
  riverAmplitude = 0.002;

  showAltitude = false;
  showTemperature = false;
  showHumidity = false;
  showErosion = false;
  showWater = false;

  updateTerrainHeight = true;

  maxAltitude = 5000;

  altitudeMapNoise = createNoise2D(alea("altitude-noise"));
  temperatureMapNoise = createNoise2D(alea("temperature-noise"));
  humidityMapNoise = createNoise2D(alea("humidity-noise"));
  erosionMapNoise = createNoise2D(alea("erosion-noise"));
  testerMapNoise = createNoise2D(alea("tester-noise"));
  reliefMapNoise = createNoise2D(alea("relief-noise"));
  riverMapNoise = createNoise2D(alea("river-noise"));

  disturbYFrontier = createNoise2D(alea("disturb-temperature-map"));
  disturbXFrontier = createNoise2D(alea("disturb-humidity-map"));

  scene;

  #verticesDatas = [];

  #geometry;
  #material;
  #meshRenderer;

  create() {
    this.createTerrain();
    this.createBiomes();
    this.createWater();
    this.modifyHeightMap();
    this.colorize();

    Console.execute("maps toggle --water");

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
    // this.createTesterMap();

    this.computeBiomes();

    Console.register(
      new Command("maps", [
        new Command("toggle", (arg) => this.showMap(arg), {
          help: "Show the different noise maps",
        })
          .addOption("altitude", null, "Show the altitude map")
          .addOption("temperature", null, "Show the temperature map")
          .addOption("humidity", null, "Show the humidity map")
          .addOption("erosion", null, "Show the erosion map")
          .addOption("water", null, "Show the water map"),
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
      this.showWater = false;
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
      this.showWater = !!type["--water"] ? !this.showWater : this.showWater;
    }
    this.colorize();
  }

  getVerticeIndex = (u, v, widthSegments) => v * (widthSegments + 1) + u;

  determinateBiome(i) {
    // let params = this.#verticesDatas[i];
    let resolution = this.terrainSize / this.subdivisions;
    const x = this.#geometry.attributes.position.getX(i) / resolution;
    const y = (this.#geometry.attributes.position.getY(i) / resolution) * -1;

    let xDisturbed =
      (this.disturbXFrontier(
        ((x * this.subdivisions) / this.terrainSize) * this.disturbFrequency,
        ((y * this.subdivisions) / this.terrainSize) * this.disturbFrequency
      ) *
        this.disturbAmplitude *
        this.subdivisions) /
      200;
    let yDisturbed =
      (this.disturbYFrontier(
        ((x * this.subdivisions) / this.terrainSize) * this.disturbFrequency,
        ((y * this.subdivisions) / this.terrainSize) * this.disturbFrequency
      ) *
        this.disturbAmplitude *
        this.subdivisions) /
      200;

    // let disturbedIndex = this.getVerticeIndex(x + this.subdivisions / 2, y + this.subdivisions / 2, this.subdivisions)
    let disturbedIndex = this.getVerticeIndex(
      clamp(
        Math.round(x + xDisturbed + this.subdivisions / 2),
        0,
        this.subdivisions
      ),
      clamp(
        Math.round(y + yDisturbed + this.subdivisions / 2),
        0,
        this.subdivisions
      ),
      this.subdivisions
    );
    let params = this.#verticesDatas[disturbedIndex];

    // console.log("biome to found", params,{ x, y, mappedX: x + this.subdivisions / 2, mappedY : y + this.subdivisions / 2, i, disturbedIndex})
    let biomeFound = BiomeMapper.findBiome(
      params.temperature,
      params.humidity,
      this.biomeBlendingSize,
      this.biomeBlendingStrength
    );
    return biomeFound;
  }

  computeBiomes() {
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      this.#verticesDatas[i].biomes = this.determinateBiome(i);
      // console.log("this.#verticesDatas[i].biomes", this.#verticesDatas[i].biomes)
    }
  }

  getNeighbors(index, width, height) {
    const neighbors = [];

    const x = index % width; // Coordonnée X dans la grille
    const y = Math.floor(index / width); // Coordonnée Y dans la grille

    // Déplacements possibles : [dx, dy]
    const directions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      // Vérifier que le voisin est dans les limites de la carte
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        neighbors.push(ny * width + nx);
      }
    }

    return neighbors;
  }

  createWater() {
    let sortedVertices = this.#verticesDatas
      .map((vertice, index) => ({ vertice, index }))
      .sort((a, b) => b.vertice.altitude - a.vertice.altitude);

    let newWaterMap = this.#verticesDatas.map((v) => v.water);

    for (let sortedVertice of sortedVertices) {

      let i = sortedVertice.index;

      let neighbors = this.getNeighbors(
        i,
        this.subdivisions + 1,
        this.subdivisions + 1
      );


      let flows = [];
      let totalFlow = 0;

      neighbors.sort((a,b) => this.#verticesDatas[a].altitude - this.#verticesDatas[b].altitude)
      // let lowest = neighbors[0]
      // for (let j = 1; j < neighbors.length; j++) {
      //   lowest = this.#verticesDatas[neighbors[j]].altitude < this.#verticesDatas[lowest].altitude ? neighbors[j] : lowest
      // }
      neighbors = neighbors.slice(0, 2)
      // neighbors = [lowest]
      for (let j = 0; j < neighbors.length; j++) {
        if (
          this.#verticesDatas[i].altitude > this.#verticesDatas[neighbors[j]].altitude
          ||
          this.#verticesDatas[neighbors[j]].altitude - this.#verticesDatas[i].altitude >= this.#verticesDatas[i].water
        ) {
          let deltaHeight =
            this.#verticesDatas[i].altitude +
            (this.#verticesDatas[i].water + this.#verticesDatas[i].humidity) -
            (
              this.#verticesDatas[neighbors[j]].altitude +
              (this.#verticesDatas[neighbors[j]].water + this.#verticesDatas[neighbors[j]].humidity)
            );

          if (deltaHeight > 0) {
            let flow = deltaHeight ** ( j);
            flows.push({ index: neighbors[j], amount: flow });
            totalFlow += flow;
          }
        }
      }

      if (totalFlow === 0) {
        this.#verticesDatas[i].isLake = true
      }

      for (let { index, amount } of flows) {
        let ratio = amount / totalFlow;
        newWaterMap[i] -= this.#verticesDatas[i].water * (1-ratio);
        newWaterMap[index] += this.#verticesDatas[i].water * ratio;
      }
    }

    for(let i = 0 ; i < newWaterMap.length ; i++) {
      this.#verticesDatas[i].water = newWaterMap[i]
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

      const nx = x / this.terrainSize;
      const ny = y / this.terrainSize;

      let n =
        this.erosionMapNoise(
          nx * this.erosionFrequency,
          ny * this.erosionFrequency
        ) *
          0.5 +
        0.5;
      this.#verticesDatas[i].erosion = n;
    }
  }

  createAltitudeMap() {
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      // i < 5;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);

      const nx = x / this.terrainSize;
      const ny = y / this.terrainSize;

      let noiseHeight = this.fractalNoise(nx, ny, this.altitudeMapNoise, {
        octaves: 6,
        persistence: this.persistence,
        lacunarity: this.lacunarity,
        scale: this.scale,
      });

      // console.log("altitude noiseHeight", noiseHeight)

      this.#verticesDatas[i].altitude = 1 - Math.abs(noiseHeight); // Calculated base noise
      this.#verticesDatas[i].altitude =
        // this.#verticesDatas[i].altitude = 1 + (this.#verticesDatas[i].altitude - 1) ** 3
        this.#verticesDatas[i].altitude ** this.sharpness; // Apply a sharpness

      this.#verticesDatas[i].altitude =
        this.#verticesDatas[i].altitude *
        (1 - this.#verticesDatas[i].erosion * this.erosionWeight); // Apply erosion weight
    }
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

  fractalNoise(x, y, mapNoise, options = {}) {
    const octaves = options.octaves; // Nombre d'octaves
    const persistence = options.persistence; // Influence des détails (amplitude)
    const lacunarity = options.lacunarity; // Fréquence des détails
    const scale = options.scale; // Échelle globale

    let amplitude = 1;
    let frequency = 1;
    let noiseHeight = 0;

    let noises = [];
    let amplitudes = [];

    // Génération multi-octaves
    for (let octave = 0; octave < octaves; octave++) {
      let ox = x * scale * frequency; //+ seed;
      let oy = y * scale * frequency; //+ seed;

      const noiseValue = this.domainWarp(ox, oy, mapNoise);

      noises.push(noiseValue);
      amplitudes.push(amplitude);

      amplitude *= persistence; // Réduit l'amplitude à chaque octave
      frequency *= lacunarity; // Augmente la fréquence à chaque octave
    }
    noiseHeight = this.weightedAverage(noises, amplitudes);

    return noiseHeight;
  }

  domainWarp(x, y, noiseFunc) {
    let warp = noiseFunc(x * 0.05, y * 0.05);
    return noiseFunc(x + warp, y + warp);
  }

  createTemperatureMap() {
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);

      const nx = x / this.terrainSize;
      const ny = y / this.terrainSize;

      let altitudeInfluence = this.#verticesDatas[i].altitude;
      let n =
        this.temperatureMapNoise(
          nx * this.temperatureFrequency,
          ny * this.temperatureFrequency
        ) *
          0.5 +
        0.5;
      n = lerp(n, 0, altitudeInfluence ** 0.5);
      this.#verticesDatas[i].temperature = n;
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

      const nx = x / this.terrainSize;
      const ny = y / this.terrainSize;

      let n =
        this.humidityMapNoise(
          nx * this.humidityFrequency,
          ny * this.humidityFrequency
        ) *
          0.5 +
        0.5;

      this.#verticesDatas[i].humidity = n;
    }
  }

  smoothShape(a, b, t) {
    let h = clamp((b - a + t) / (2 * t), 0, 1);
    return a * h + b * (1 - h) - t * h * (1 - h);
  }
  // Apply color for each biome. If a vertice is near to an edge (depending on influenceThreshold), mix color for each near biome for smooth transitions
  colorize() {
    let colors = [];
    let baseColor = new Color(0xffffff);
    let maxWater = this.#verticesDatas.reduce(
      (max, v) => (v.water > max ? v.water : max),
      0
    );
    console.log("max Water", maxWater);
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
      } else if (this.showWater) {
        color = baseColor.clone();
        // if (this.#verticesDatas[i].water < 1000) {
        // let waterAmount = this.#verticesDatas[i].water; // Intensité d'eau à ce point
        // let neighbors = this.getNeighbors(i, this.subdivisions + 1, this.subdivisions + 1);

        // let maxNeighborWater = 0;
        // for (let neighbor of neighbors) {
        //     waterAmount += this.#verticesDatas[neighbor].water;
        // }

        // let intensity = ((waterAmount / 8) / (maxWater / 100)) ** 2; // Adoucir les bords
        // let blueFactor = Math.min(intensity / 100, 1); // Normaliser
        //   color.multiplyScalar(blueFactor);
        // color.multiplyScalar(intensity);
        // if (this.#verticesDatas[i].isLake) {
        // color = new Color(0x0022ff)
        // } else {
        // if (this.#verticesDatas[i].isLake) {
        //   color = new Color(0x2288ff)
        // } else {
        //   if (this.#verticesDatas[i].water > this.waterThreshold)
          color = new Color(0x2288ff)
          color.multiplyScalar(
            this.#verticesDatas[i].water / maxWater
          );
        // }

        // }
        // }

        // }
      } else {
        let colors = this.#verticesDatas[i].biomes.map((v) => v.biome.color)
        let influences = this.#verticesDatas[i].biomes.map((v) => v.influence)
        // if (this.#verticesDatas[i].water > 1) {
        //   colors.push(new Color(0x0066FF))
        //   influences.push(this.#verticesDatas[i].water / maxWater);
        // }
        color = this.mixMultipleColors(
          colors,
          influences
        );
        // color = this.#verticesDatas[i].biome.color || baseColor;
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

  // Create the basis of geometry, material and mesh for the terrain. All modifiers applied to are in other function of this class
  createTerrain() {
    this.#geometry = new PlaneGeometry(
      this.terrainSize,
      this.terrainSize,
      this.subdivisions,
      this.subdivisions
    );

    this.#material = new MeshLambertMaterial({ vertexColors: true });
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
        tester: 0,
        biome: null,
        biomes: [],
        water: 1,
        isLake: false,
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

    let maxWater = this.#verticesDatas.reduce(
      (max, v) => (v.water > max ? v.water : max),
      0
    );

    // Loop through each vertice
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      this.#geometry.attributes.position.setZ(
        i,
        // (this.#verticesDatas[i].water / maxWater) * this.maxAltitude
        this.#verticesDatas[i].altitude * this.maxAltitude - this.#verticesDatas[i].water ** 2 * 2
      );
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
