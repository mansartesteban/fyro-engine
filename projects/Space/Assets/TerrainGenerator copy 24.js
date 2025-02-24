import {
  Color,
  Float32BufferAttribute,
  Group,
  MeshLambertMaterial,
  MeshStandardMaterial,
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
import { OBJLoader } from "three/examples/jsm/Addons";
// import Map from "./Map1.json"

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

  riverFrequency = 0.05;
  riverAmplitude = 0.002;
  topographicSteps = 10;

  showAltitude = false;
  showTemperature = false;
  showHumidity = false;
  showErosion = false;
  showWater = false;

  updateTerrainHeight = true;

  maxAltitude = this.terrainSize / 10;

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

  constructor() {
    Console.register(
      new Command("maps", [
        new Command("toggle", this.showMap.bind(this, ...arguments), {
          help: "Show the different noise maps",
        })
          .addOption("altitude", null, "Show the altitude map")
          .addOption("temperature", null, "Show the temperature map")
          .addOption("humidity", null, "Show the humidity map")
          .addOption("erosion", null, "Show the erosion map")
          .addOption("water", null, "Show the water map"),
        new Command("reset", this.showMap.bind(this, ...arguments), {
          help: "Reset the map to the default one",
        }),
        new Command("save", this.saveMap.bind(this, ...arguments), {
          help: "Save the map with the given name",
        }),
      ])
    );
  }

  load() {
    // this.#verticesDatas = JSON.parse(Map)
    console.log(JSON.parse(Map));
    return this.#meshRenderer;
  }

  saveMap(arg) {
    if (arg["--name"]) {
      let name = arg["--name"];

      console.log(
        "name",
        JSON.stringify(
          this.#verticesDatas.map(
            ({ humidity, erosion, temperature, ...all }) => ({ ...all })
          )
        )
      );
    }
  }

  create() {
    this.createTerrain();
    this.createBiomes();
    this.modifyHeightMap();
    this.colorize();

    this.addFlore();

    return this.#meshRenderer;
  }

  getInterpolatedHeight(x, z, gridSize, worldSize, heightMap) {
    const halfWorldSize = worldSize / 2;
    const cellSize = worldSize / (gridSize - 1); // Taille d'une cellule entre deux sommets

    // Trouver les indices des sommets entourant le point (x, z)
    let col = (x + halfWorldSize) / cellSize;
    let row = (z + halfWorldSize) / cellSize;

    const x0 = Math.floor(col);
    const x1 = Math.min(x0 + 1, gridSize - 1);
    const z0 = Math.floor(row);
    const z1 = Math.min(z0 + 1, gridSize - 1);

    // Vérification pour éviter les erreurs hors limites
    if (x0 < 0 || x1 >= gridSize || z0 < 0 || z1 >= gridSize) {
      return 0; // Valeur par défaut si en dehors du terrain
    }

    // Calcul des poids pour l'interpolation bilinéaire
    const sx = col - x0;
    const sz = row - z0;

    // Récupération des hauteurs des 4 sommets de la cellule dans le buffer 1D
    const index00 = (z0 * gridSize + x0) * 3 + 2; // Z
    const index10 = (z0 * gridSize + x1) * 3 + 2; // Z
    const index01 = (z1 * gridSize + x0) * 3 + 2; // Z
    const index11 = (z1 * gridSize + x1) * 3 + 2; // Z

    const h00 = heightMap[index00] || 0;
    const h10 = heightMap[index10] || 0;
    const h01 = heightMap[index01] || 0;
    const h11 = heightMap[index11] || 0;

    // Interpolation bilinéaire
    const h0 = h00 * (1 - sx) + h10 * sx;
    const h1 = h01 * (1 - sx) + h11 * sx;
    return h0 * (1 - sz) + h1 * sz;
  }

  getHeight(x, y) {
    let altitude = this.getInterpolatedHeight(
      x,
      y,
      this.subdivisions + 1,
      this.terrainSize,
      this.#geometry.attributes.position.array
    );
    return altitude;
  }

  generateTrees(treeDensity = .1) {
    let trees = [];

    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);

      if (Math.random() < treeDensity) {
        // Probabilité de placer un arbre
        let z = this.getHeight(x, y);

        // Vérifier si la pente est adaptée
        // let slope = Math.abs(this.getHeight(x + 1, z) - z);
        // if (slope < 0.3) {
        // Filtrer les pentes trop fortes
        trees.push({ x, y: -y, z });
        // }
      }
    }

    return trees;
  }

  addFlore() {
    let trees = this.generateTrees();
    let treeInstances = new Group();

    const loader = new OBJLoader();
    loader.load("LowPolyTree.obj", function (treeModel) {
      treeModel.traverse((child) => {
        if (child.isMesh) {
          child.material = new MeshStandardMaterial({ color: 0x228b22 });
        }
      });

      trees.forEach((treePosition) => {
        let tree = treeModel.clone();
        tree.position.copy(treePosition);
        tree.rotation.x = Math.PI / 2
        tree.scale.set(10, 10, 10);
        treeInstances.add(tree);
        // this.scene.threeScene.add(tree);
      });
    });

    this.scene.threeScene.add(treeInstances);
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
    }
  }

  // getNeighbors(index, width, height) {
  //   const neighbors = [];

  //   const x = index % width; // Coordonnée X dans la grille
  //   const y = Math.floor(index / width); // Coordonnée Y dans la grille

  //   // Déplacements possibles : [dx, dy]
  //   const directions = [
  //     [-1, -1],
  //     [0, -1],
  //     [1, -1],
  //     [-1, 0],
  //     [1, 0],
  //     [-1, 1],
  //     [0, 1],
  //     [1, 1],
  //   ];

  //   for (const [dx, dy] of directions) {
  //     const nx = x + dx;
  //     const ny = y + dy;

  //     // Vérifier que le voisin est dans les limites de la carte
  //     if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
  //       neighbors.push(ny * width + nx);
  //     }
  //   }

  //   return neighbors;
  // }

  // fillBassin(bassin, amount) {
  //   if (bassin !== null) {
  //     if (
  //       this.#bassinsMap[bassin].below &&
  //       this.#bassinsMap[this.#bassinsMap[bassin].below].filling <
  //         this.#bassinsMap[this.#bassinsMap[bassin].below].capacity
  //     ) {
  //       this.fillBassin(this.#bassinsMap[bassin].below, amount);
  //     } else {
  //       let remainingCapacity = Math.max(
  //         0,
  //         this.#bassinsMap[bassin].capacity - this.#bassinsMap[bassin].filling
  //       );
  //       let toFill = Math.min(amount, remainingCapacity);
  //       amount -= toFill;
  //       this.#bassinsMap[bassin].filling += toFill;
  //       if (amount > 0) {
  //         this.fillBassin(this.#bassinsMap[bassin].above, amount);
  //       }
  //     }
  //   }
  // }

  // createBassins(sortedVertices) {
  //   let colors = [
  //     new Color(0xff0000),
  //     new Color(0x00ff00),
  //     new Color(0x0000ff),
  //     new Color(0xffff00),
  //     new Color(0x00ffff),
  //     new Color(0xff00ff),
  //     new Color(0x880000),
  //     new Color(0x008800),
  //     new Color(0x000088),
  //     new Color(0x888800),
  //     new Color(0x008888),
  //     new Color(0x880088),
  //   ];
  //   for (let sortedVertice of sortedVertices) {
  //     let i = sortedVertice.index;

  //     let neighbors = this.getNeighbors(
  //       i,
  //       this.subdivisions + 1,
  //       this.subdivisions + 1
  //     );

  //     let hThis =
  //       Math.floor(this.#verticesDatas[i].altitude * this.topographicSteps) /
  //       this.topographicSteps;

  //     if (this.#verticesDatas[i].bassin === null) {
  //       for (let neighbor of neighbors) {
  //         let hNeighbor =
  //         Math.floor(
  //           this.#verticesDatas[neighbor].altitude * this.topographicSteps
  //         ) / this.topographicSteps;

  //         if (this.#verticesDatas[neighbor].bassin === null) {
  //           continue;
  //         } else {
  //           if (hNeighbor === hThis) {
  //             this.#verticesDatas[i].bassin  = this.#verticesDatas[neighbor].bassin
  //             this.createBassins([sortedVertice])
  //           }
  //         }
  //       }

  //       if (this.#verticesDatas[i].bassin === null) {
  //         let bassin = {
  //           above: null,
  //           below: null,
  //           linked: [],
  //           capacity: 1,
  //           filling: 0,
  //           color: colors[i % colors.length],
  //           height:
  //             Math.floor(
  //               (this.#verticesDatas[i].altitude * 50) / this.topographicSteps
  //             ) / 50,
  //         };
  //         this.#verticesDatas[i].bassin = this.#bassinsMap.length;
  //         this.#bassinsMap.push(bassin);
  //       }
  //     }
  //   }
  // }

  // createWater() {
  //   let sortedVertices = this.#verticesDatas
  //     .map((vertice, index) => ({
  //       vertice,
  //       index,
  //     }))
  //     .sort((a, b) => b.vertice.altitude - a.vertice.altitude);

  //   this.createBassins(sortedVertices);

  //   let newWaterMap = this.#verticesDatas.map((v) => v.water);

  //   for (let sortedVertice of sortedVertices) {
  //     let i = sortedVertice.index;

  //     let neighbors = this.getNeighbors(
  //       i,
  //       this.subdivisions + 1,
  //       this.subdivisions + 1
  //     );

  //     let flows = [];
  //     let totalFlow = 0;

  //     for (let j = 0; j < neighbors.length; j++) {
  //       if (
  //         this.#verticesDatas[i].altitude >
  //           this.#verticesDatas[neighbors[j]].altitude ||
  //         this.#verticesDatas[neighbors[j]].altitude -
  //           this.#verticesDatas[i].altitude >=
  //           this.#verticesDatas[i].water
  //       ) {
  //         let deltaHeight =
  //           this.#verticesDatas[i].altitude +
  //           this.#verticesDatas[i].water +
  //           this.#verticesDatas[i].humidity -
  //           (this.#verticesDatas[neighbors[j]].altitude +
  //             this.#verticesDatas[neighbors[j]].water +
  //             this.#verticesDatas[neighbors[j]].humidity);

  //         if (deltaHeight > 0) {
  //           let flow = deltaHeight;
  //           flows.push({ index: neighbors[j], amount: flow });
  //           totalFlow += flow;
  //         }
  //       }
  //     }

  //     for (let { index, amount } of flows) {
  //       let ratio = amount / totalFlow;
  //       newWaterMap[i] -= this.#verticesDatas[i].water * ratio;
  //       newWaterMap[index] += this.#verticesDatas[i].water * ratio;
  //       this.fillBassin(
  //         this.#verticesDatas[i].bassin,
  //         this.#verticesDatas[i].water * ratio
  //       );
  //     }
  //   }

  //   for (let i = 0; i < newWaterMap.length; i++) {
  //     this.#verticesDatas[i].water = newWaterMap[i];
  //   }

  //   console.log("onefiaz", this.#bassinsMap);
  // }

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
        // if (this.#verticesDatas[i].water) {
        //   color = new Color(0x0022ff)
        // } else {
        //   color = new Color(0x231424)
        // }
        // else {
        // if (this.#verticesDatas[i].water / (maxWater < .1) {
        // color.multiplyScalar(this.#verticesDatas[i].water / maxWater);
        // }
        // }

        // }
      } else {
        color = this.mixMultipleColors(
          this.#verticesDatas[i].biomes.map(
            (v) => BiomeMapper.getBiome(v.biome).color
          ),
          this.#verticesDatas[i].biomes.map((v) => v.influence)
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
        biomes: [],
        index: i,
      };
    }

    // this.#material = new MeshPhongMaterial();
    this.#meshRenderer = new MeshRenderComponent("terrain", {
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
      this.#geometry.attributes.position.setZ(
        i,
        this.#verticesDatas[i].altitude * this.maxAltitude
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
