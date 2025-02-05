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
  subdivisions = 3000;

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
  disturbAmplitude = 1.66
  biomeBlendingSize = .16
  biomeBlendingStrength = 1


  showAltitude = false;
  showTemperature = false;
  showHumidity = false;
  showErosion = false;
  showTester = false;

  updateTerrainHeight = true;

  maxAltitude = 5000;

  altitudeMapNoise = createNoise2D(alea("altitude-noise"));
  temperatureMapNoise = createNoise2D(alea("temperature-noise"));
  humidityMapNoise = createNoise2D(alea("humidity-noise"));
  erosionMapNoise = createNoise2D(alea("erosion-noise"));
  testerMapNoise = createNoise2D(alea("tester-noise"));
  reliefMapNoise = createNoise2D(alea("relief-noise"));

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
    this.modifyHeightMap();

    this.colorize();

    // Console.execute("maps toggle --humidity");

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
      this.showTester = false;
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
      this.showTester = !!type["--tester"] ? !this.showTester : this.showTester;
    }
    this.colorize();
  }

  getVerticeIndex = (u, v, widthSegments)=> (v * (widthSegments + 1) + u)

  determinateBiome(i) {
    // let params = this.#verticesDatas[i];
    let resolution = this.terrainSize / this.subdivisions
    const x = this.#geometry.attributes.position.getX(i) / resolution;
    const y = this.#geometry.attributes.position.getY(i) / resolution * -1;

    let xDisturbed = (this.disturbXFrontier(x * this.subdivisions / 100, y * this.subdivisions / 100)) * this.disturbAmplitude * this.subdivisions / 200
    let yDisturbed = (this.disturbYFrontier(x * this.subdivisions / 100, y * this.subdivisions / 100)) * this.disturbAmplitude * this.subdivisions / 200
    
    // let disturbedIndex = this.getVerticeIndex(x + this.subdivisions / 2, y + this.subdivisions / 2, this.subdivisions)
    let disturbedIndex = this.getVerticeIndex(clamp(Math.round((x + xDisturbed) + this.subdivisions / 2), 0, this.subdivisions), clamp(Math.round((y + yDisturbed) + this.subdivisions / 2), 0, this.subdivisions), this.subdivisions)
    let params = this.#verticesDatas[disturbedIndex];
    
    // console.log("biome to found", params,{ x, y, mappedX: x + this.subdivisions / 2, mappedY : y + this.subdivisions / 2, i, disturbedIndex})
    let biomeFound = BiomeMapper.getBiome(params.temperature, params.humidity, this.biomeBlendingSize, this.biomeBlendingStrength)
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

  generateRelief() {
    // let octaves = 4;
    // for (
    //   let i = 0;
    //   i < this.#geometry.attributes.position.array.length / 3;
    //   i++
    // ) {
    //   const x = this.#geometry.attributes.position.getX(i);
    //   const y = this.#geometry.attributes.position.getY(i);
    //   let amplitude = 1;
    //   let frequency = 1;
    //   let noiseHeight = 0;
    //   // Génération multi-octaves
    //   for (let octave = 0; octave < octaves; octave++) {
    //     const nx = (x / this.terrainSize) * this.scale * frequency; //+ seed;
    //     const ny = (y / this.terrainSize) * this.scale * frequency; //+ seed;
    //     const noiseValue = Math.abs(this.reliefMapNoise(nx, ny));
    //     noiseHeight += noiseValue * amplitude;
    //     amplitude *= this.persistence; // Réduit l'amplitude à chaque octave
    //     frequency *= this.lacunarity; // Augmente la fréquence à chaque octave
    //   }
    //   this.#verticesDatas[i].height = noiseHeight ** 2;
    // }
  }

  createTesterMap(tick = 0) {
    let octaves = 6;
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      // i < 5 ;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);
      const nx = x / this.terrainSize;
      const ny = y / this.terrainSize;

      // let noiseHeight = this.fractalNoise(nx, ny, {
      //   octaves: octaves,
      //   persistence: this.persistence,
      //   lacunarity: this.lacunarity,
      //   scale: this.scale
      // })

      let amplitude = 1;
      let frequency = 1;
      let noiseHeight = 0;

      let noises = [];
      let amplitudes = [];

      // Génération multi-octaves
      for (let octave = 0; octave < octaves; octave++) {
        let ox = nx * this.scale * frequency; //+ seed;
        let oy = ny * this.scale * frequency; //+ seed;

        const noiseValue = this.domainWarp(ox, oy, this.testerMapNoise);

        noises.push(noiseValue);
        amplitudes.push(amplitude);

        amplitude *= this.persistence; // Réduit l'amplitude à chaque octave
        frequency *= this.lacunarity; // Augmente la fréquence à chaque octave
      }
      noiseHeight = this.weightedAverage(noises, amplitudes);
      this.#verticesDatas[i].tester = 1 - Math.abs(noiseHeight); // Calculated base noise
      this.#verticesDatas[i].tester =
        this.#verticesDatas[i].tester ** this.sharpness; // Apply a sharpness

      this.#verticesDatas[i].tester =
        this.#verticesDatas[i].tester *
        (1 - this.#verticesDatas[i].erosion * this.erosionWeight);

        this.#geometry.attributes.position.setZ(
          i,
          this.#verticesDatas[i].tester * this.maxAltitude
        );
    }

    // Recompute normals and indicate to Three to update the mesh
    this.#geometry.computeVertexNormals();
    this.#geometry.attributes.position.needsUpdate = true;
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

      let noiseHeight = this.fractalNoise(nx, ny, this.testerMapNoise, {
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

      // const noiseValue = 1 - Math.abs(this.testerMapNoise(nx, ny))
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
        ) *.5 + .5
      n = lerp(n, 0, altitudeInfluence**0.5)
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
        ) * .5 + .5
      
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
        color.multiplyScalar(
          this.#verticesDatas[i].temperature
        );
      } else if (this.showHumidity) {
        color = baseColor.clone();
        color.multiplyScalar(this.#verticesDatas[i].humidity);
      } else if (this.showErosion) {
        color = baseColor.clone();
        color.multiplyScalar(this.#verticesDatas[i].erosion);
      } else if (this.showTester) {
        color = baseColor.clone();
        color.multiplyScalar(this.#verticesDatas[i].tester);
      } else {
        color = this.mixMultipleColors(this.#verticesDatas[i].biomes.map(v => v.biome.color), this.#verticesDatas[i].biomes.map(v => v.influence))
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

    this.#material = new MeshLambertMaterial({vertexColors: true});
    // this.#material = new MeshBasicMaterial({ vertexColors: true });

    // this.#material = new ShaderMaterial({
    //   vertexShader: `
    //       flat varying vec3 vColor;
    //       void main() {
    //           vColor = color; // Passe la couleur brute sans interpolation
    //           gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    //       }
    //   `,
    //   fragmentShader: `
    //       flat varying vec3 vColor;
    //       void main() {
    //           gl_FragColor = vec4(vColor, 1.0); // Affiche la couleur brute
    //       }
    //   `,
    //   vertexColors: true, // Active les couleurs par sommet
    // });

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
