import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import { createNoise2D } from "simplex-noise";
import MeshRenderComponent from "@core/Components/MeshRenderComponent";
import alea from "alea";

import Console from "@core/../Console/Console";
import Command from "../../../src/Engine/Console/Command";
import { clamp, lerp } from "three/src/math/MathUtils.js";
import BiomeMapper from "./BiomeMapping";
import { OBJLoader } from "three/examples/jsm/Addons";
import Chunk from "./Chunk";
import HumidityModifier from "./TerrainModifiers/HumidityModifier";
import BiomeModifier from "./TerrainModifiers/BiomeModifier";
import ErosionModifier from "./TerrainModifiers/ErosionModifier";
import TemperatureModifier from "./TerrainModifiers/TemperatureModifier";
import AltitudeModifier from "./TerrainModifiers/AltitudeModifier"; 
import HeightModifier from "./TerrainModifiers/HeightModifier"
// import Map from "./Map1.json"

class TerrainGenerator {
  terrainSize = 64000;
  subdivisions = 4;
  renderDistance = 16;
  chunkSize = this.terrainSize / this.renderDistance;

  altitudeFrequency = .5;
  temperatureFrequency = .5;
  humidityFrequency = .5;
  erosionFrequency = 1;

  altitudeWeight = 25;
  erosionWeight = 0.2;
  erosionMin = 2;
  erosionMax = 6;

  verticality = 11.75;
  lacunarity = .185;
  persistence = 2.99;
  scale = 400;
  sharpness = 1.95;
  disturbAmplitude = 0//2.2;
  disturbFrequency = 0//7;
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

  maxAltitude = 10000;

  

  scene;
  meshes = [];

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
    // console.log(JSON.parse(Map));
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
    // this.createBiomes();
    // this.modifyHeightMap();

    // this.colorize();

    // this.addFlore();

    return this.#meshRenderer;
  }

  // generateTrees(treeDensity = 0.1) {
  //   let trees = [];

  //   for (
  //     let i = 0;
  //     i < this.#geometry.attributes.position.array.length / 3;
  //     i++
  //   ) {
  //     const x = this.#geometry.attributes.position.getX(i);
  //     const y = this.#geometry.attributes.position.getY(i);

  //     if (Math.random() < treeDensity) {
  //       // Probabilité de placer un arbre
  //       let z = this.getHeight(x, y);

  //       // Vérifier si la pente est adaptée
  //       // let slope = Math.abs(this.getHeight(x + 1, z) - z);
  //       // if (slope < 0.3) {
  //       // Filtrer les pentes trop fortes
  //       trees.push({ x, y: -y, z });
  //       // }
  //     }
  //   }

  //   return trees;
  // }

  // addFlore() {
  //   let trees = this.generateTrees();
  //   let treeInstances = new Group();

  //   const loader = new OBJLoader();
  //   loader.load("LowPolyTree.obj", function (treeModel) {
  //     treeModel.traverse((child) => {
  //       if (child.isMesh) {
  //         child.material = new MeshStandardMaterial({ color: 0x228b22 });
  //       }
  //     });

  //     trees.forEach((treePosition) => {
  //       let tree = treeModel.clone();
  //       tree.position.copy(treePosition);
  //       tree.rotation.x = Math.PI / 2;
  //       tree.scale.set(10, 10, 10);
  //       treeInstances.add(tree);
  //       // this.scene.threeScene.add(tree);
  //     });
  //   });

  //   this.scene.threeScene.add(treeInstances);
  // }

  /**
   * Create biomes by positioning random biome centers and applying delaunay triangulation and voronoi diagram
   */
  createBiomes() {
    // this.computeBiomes();
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

  

  // determinateBiome(i) {
  //   let resolution = this.terrainSize / this.subdivisions;
  //   const x = this.#geometry.attributes.position.getX(i) / resolution;
  //   const y = (this.#geometry.attributes.position.getY(i) / resolution) * -1;

  //   let xDisturbed =
  //     (this.disturbXFrontier(
  //       ((x * this.subdivisions) / this.terrainSize) * this.disturbFrequency,
  //       ((y * this.subdivisions) / this.terrainSize) * this.disturbFrequency
  //     ) *
  //       this.disturbAmplitude *
  //       this.subdivisions) /
  //     200;
  //   let yDisturbed =
  //     (this.disturbYFrontier(
  //       ((x * this.subdivisions) / this.terrainSize) * this.disturbFrequency,
  //       ((y * this.subdivisions) / this.terrainSize) * this.disturbFrequency
  //     ) *
  //       this.disturbAmplitude *
  //       this.subdivisions) /
  //     200;

  //   let disturbedIndex = this.getVerticeIndex(
  //     clamp(
  //       Math.round(x + xDisturbed + this.subdivisions / 2),
  //       0,
  //       this.subdivisions
  //     ),
  //     clamp(
  //       Math.round(y + yDisturbed + this.subdivisions / 2),
  //       0,
  //       this.subdivisions
  //     ),
  //     this.subdivisions
  //   );
  //   let params = this.#verticesDatas[disturbedIndex];

  //   let biomeFound = BiomeMapper.findBiome(
  //     params.temperature,
  //     params.humidity,
  //     this.biomeBlendingSize,
  //     this.biomeBlendingStrength
  //   );
  //   return biomeFound;
  // }

  // computeBiomes() {
  //   for (
  //     let i = 0;
  //     i < this.#geometry.attributes.position.array.length / 3;
  //     i++
  //   ) {
  //     this.#verticesDatas[i].biomes = this.determinateBiome(i);
  //   }
  // }


  // Ray marching ??
  // smoothShape(a, b, t) {
  //   let h = clamp((b - a + t) / (2 * t), 0, 1);
  //   return a * h + b * (1 - h) - t * h * (1 - h);
  // }

  // Apply color for each biome. If a vertice is near to an edge (depending on influenceThreshold), mix color for each near biome for smooth transitions
  colorize(geometry) {
    let colors = [];
    let baseColor = new Color(0xffffff);
    let maxWater = this.#verticesDatas.reduce(
      (max, v) => (v.water > max ? v.water : max),
      0
    );
    // Loop through each vertice
    for (let i = 0; i < geometry.attributes.position.array.length / 3; i++) {
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
      } else {
        color = baseColor;
      }

      let arr = color.toArray();
      colors[i * 3] = arr[0];
      colors[i * 3 + 1] = arr[1];
      colors[i * 3 + 2] = arr[2];
    }
    // Reset the buffer array in the geometry and recompute normals
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
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
    // this.#geometry = this.createChunkGeometry(this.terrainSize, this.subdivisions)

    // this.#material = new MeshLambertMaterial({ vertexColors: true });
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

    this.update(new Vector3());

    // for (
    //   let i = 0;
    //   i < this.#geometry.attributes.position.array.length / 3;
    //   i++
    // ) {
    //   this.#verticesDatas[i] = {
    //     altitude: 0,
    //     temperature: 0,
    //     humidity: 0,
    //     erosion: 0,
    //     biomes: [],
    //     index: i,
    //   };
    // }

    // // this.#material = new MeshPhongMaterial();
    // this.#meshRenderer = new MeshRenderComponent("terrain", {
    //   geometry: this.#geometry,
    //   material: this.#material,
    // });
  }

  update(position) {
    for (let i = -this.renderDistance; i <= this.renderDistance; i++) {
      for (let j = -this.renderDistance; j <= this.renderDistance; j++) {
        if (j ** 2 + i ** 2 < this.renderDistance ** 2) {
          let x = i + Math.floor(position.x / this.chunkSize);
          let z = j + Math.floor(position.z / this.chunkSize);

          let foundChunk = this.chunks.find(
            (chunk) => chunk.x === x && chunk.z === z
          );
          if (!foundChunk) {
            this.meshes.push(this.createChunk(x, z).mesh);
          }
        }
      }
    }

    this.meshes.forEach((mesh) => {
      this.scene.threeScene.add(mesh);
    });
  }

  chunks = [];
  // chunkManager() {// Retrieve existing chunk at (x,y)}

  createChunk(x, z) {
    let chunk = new Chunk(
      new Vector3(x * this.chunkSize, 0, z * this.chunkSize),
      this.chunkSize,
      this.subdivisions
    );
    chunk.createChunkGeometry();

    chunk
      .addModifier(
        new ErosionModifier({
          seed: createNoise2D(alea("erosion-noise")),
          frequency: this.erosionFrequency,
        })
      )
      .addModifier(
        new AltitudeModifier({
          seed: createNoise2D(alea("altitude-noise")),
          persistence: this.persistence,
          lacunarity: this.lacunarity,
          scale: this.scale,
          octaves: 6,
          sharpness: this.sharpness,
          erosionWeight: this.erosionWeight,
        })
      )
      .addModifier(
        new TemperatureModifier({
          seed: createNoise2D(alea("temperature-noise")),
          frequency: this.temperatureFrequency,
        })
      )
      .addModifier(
        new HumidityModifier({
          seed: createNoise2D(alea("humidity-noise")),
          frequency: this.humidityFrequency,
        })
      )
      .addModifier(new HeightModifier({
        maxAltitude: this.maxAltitude
      }))
      .addModifier(new BiomeModifier({
        biomeBlendingSize: this.biomeBlendingSize,
        biomeBlendingStrength: this.biomeBlendingStrength,
        disturbFrequency: this.disturbFrequency,
        disturbAmplitude: this.disturbAmplitude
      }));

    chunk.process();

    let mesh = new Mesh(chunk.geometry, this.#material);
    mesh.position.set(x * chunk.size * 1, mesh.position.y, z * chunk.size * 1);
    let chunkToAdd = { x, z, chunk, mesh };
    this.chunks.push(chunkToAdd);
    return chunkToAdd;
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
- Add LOD (maybe a kind of LOD as for previewing the generation)
*/
