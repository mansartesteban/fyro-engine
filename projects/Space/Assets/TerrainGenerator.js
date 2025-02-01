import {
  Color,
  Float32BufferAttribute,
  GridHelper,
  MeshPhongMaterial,
  PlaneGeometry,
} from "three";
import { SimplexNoise } from "three/examples/jsm/Addons.js";
import MeshRenderComponent from "@core/Components/MeshRenderComponent";
import BiomeForest from "./Biomes/BiomeForest";
import BiomeGrassland from "./Biomes/BiomeGrassland";
import BiomeLake from "./Biomes/BiomeLake";
import BiomePlain from "./Biomes/BiomePlain";
import BiomeMountain from "./Biomes/BiomeMountain";
import Alea from "alea";

import Console from "@core/../Console/Console";
import Command from "../../../src/Engine/Console/Command";

const biomes = [
  BiomeLake,
  BiomePlain,
  BiomeMountain,
  BiomeForest,
  BiomeGrassland,
];

class TerrainGenerator {
  terrainWidth = 50000;
  terrainHeight = 50000;
  subdivisions = 50;
  blendThreshold = 300;

  altitudeFrequencyX = 0.01;
  altitudeFrequencyY = 0.01;
  altitudeAmplitude = 1000;

  octaves = 4;
  scale = 60;
  persistance = -4.0;
  lacunarity = 0.31;
  // seeder = new Alea('seed222');
  // seeder = new Alea('aseeed2222'); lacunary .44 pers -40
  // seeder = new Alea('azfzeaseeed2222');
  seeder = new Alea("skame");
  scene;

  #biomes = [];
  #verticesDatas = [];

  #voronoi;
  #geometry;
  #material;
  #meshRenderer;
  #noise = new SimplexNoise({ random: Alea("noise") });
  #heightMap = true;

  /*
   *
   * TODO
   * - Faire la documentation de Console et ConsoleStream
   * - Voir si CLI fonctionne et l'implémenter
   * - Avoir un arrêt de la fonction avec ctrl + C
   */
  create() {
    
    this.createTerrain();
    this.createBiomes();
    this.modifyHeightMap();
    // // this.colorize();
    // this.#geometry.computeVertexNormals();

    // let heightMap = true;
    // let toggleHeightmap = async (args, stream) => {
    //   return new Promise((r) => {
    //     stream.info("Recalculating ...");
    //     console.log("info");
    //     setTimeout(() => {
    //       stream.log("Still waiting");
    //       stream.log("Still waiting2");
    //       stream.log("Still waiting3");
    //       stream.log("Still waiting4");
    //     }, 1500);
    //     console.log("log");
    //     setTimeout(() => {
    //       this.modifyHeightMap(!heightMap);
    //       heightMap = !heightMap;
    //       stream.clear(-1);
    //       stream.success("Heightmap updated !");
    //       console.log("infal");
    //       r(true);
    //     }, 2000);
    //   });
    // };

    return this.#meshRenderer;
  }

  /**
   * Create biomes by positioning random biome centers and applying delaunay triangulation and voronoi diagram
   */
  createBiomes() {
    this.makeBiomeBoundaries();
  }

  makeBiomeBoundaries() {
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);

      // Retrieve the biome in which the vertice is
      this.#verticesDatas[i] = {
        altitude:
          this.#noise.noise(
            (x * this.altitudeFrequencyX) / 100,
            (y * this.altitudeFrequencyY) / 100
          ) * this.altitudeAmplitude,
      };
    }
  }

  getCoordinateByIndex(x, y) {
    return x * (this.subdivisions + 1) + y;
  }

  getIndexByCoordinate(i) {
    return Math.floor(i / (this.subdivisions + 1));
  }

  distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  getRandomBiome() {
    const totalFrequency = biomes.reduce(
      (sum, item) => sum + item.frequency,
      0
    );
    const random = this.seeder() * totalFrequency;

    let cumulativeFrequency = 0;
    for (const biome of biomes) {
      cumulativeFrequency += biome.frequency;
      if (random < cumulativeFrequency) {
        return biome;
      }
    }
  }

  // Apply color for each biome. If a vertice is near to an edge (depending on influenceThreshold), mix color for each near biome for smooth transitions
  colorize() {
    let colors = [];
    // Loop through each vertice
    let color = new Color(0x888888);
    let arr = color.toArray();
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
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

    this.#material = new MeshPhongMaterial();
    this.#meshRenderer = new MeshRenderComponent({
      geometry: this.#geometry,
      material: this.#material,
    });
  }

  // Modify the altitude of the vertices to create on organic terrain. Based on SimplexNoise
  modifyHeightMap(height = true) {
    // Loop through each vertice
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      this.#geometry.attributes.position.setZ(
        i,
        height ? this.#verticesDatas[i].altitude : 0
      );
    }

    // Recompute normals and indicate to Three to update the mesh
    this.#geometry.computeVertexNormals();
    this.#geometry.attributes.position.needsUpdate = true;
  }

  update(func) {
    this.makeBiomeBoundaries();
    this.modifyHeightMap();
    this.colorize();
  }
}

export default TerrainGenerator;

/* 
TODO - Next steps
- Add pRNG (seeded generation)
- Add a basic terrain heightsmap (like fundamental basic surface leveling)
- Add LOD (maybe a kind of LOD as for previewing the generation)
*/
