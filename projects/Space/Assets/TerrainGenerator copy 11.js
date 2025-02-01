import {
  Color,
  Float32BufferAttribute,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
} from "three";
import { SimplexNoise } from "three/examples/jsm/Addons.js";
import MeshRenderComponent from "@core/Components/MeshRenderComponent";
import { Delaunay } from "d3-delaunay";
import BiomeForest from "./Biomes/BiomeForest";
import BiomeGrassland from "./Biomes/BiomeGrassland";
import BiomeLake from "./Biomes/BiomeLake";
import BiomePlain from "./Biomes/BiomePlain";
import BiomeCalculator from "./BiomeCalculator";
import BiomeMountain from "./Biomes/BiomeMountain";
import FFT from "fft.js";
import Alea from "alea"

const biomes = [
  BiomeLake,
  BiomePlain,
  BiomeMountain,
  BiomeForest,
  BiomeGrassland,
];

class TerrainGenerator {
  terrainWidth = 5000;
  terrainHeight = 5000;
  subdivisions = 150;
  biomeCount = 25;
  blendThreshold = 300;

  noiseFrequency = 0.001;
  noiseAmplitude = 800;

  octaves = 4;
  scale = 60;
  persistance = -4.0;
  lacunarity = 0.31;
  // seeder = new Alea('seed222');
  // seeder = new Alea('aseeed2222'); lacunary .44 pers -40
  // seeder = new Alea('azfzeaseeed2222');
  seeder = new Alea('skame');
  scene;

  #biomes = [];
  #verticesDatas = [];

  #voronoi;
  #geometry;
  #material;
  #meshRenderer;
  #noise;
  #heightMap = true;

  create() {

    let s = this.seeder()

    this.instanciateNoise();
    this.createTerrain();
    this.createBiomes();
    this.modifyHeightMap();
    this.colorize();
    // this.#geometry.computeVertexNormals();

    return this.#meshRenderer;
  }

  /**
   * Create biomes by positioning random biome centers and applying delaunay triangulation and voronoi diagram
   */
  createBiomes() {
    //   // Instanciante each biome depending on 'biomeCount'
    for (let i = 0; i < this.biomeCount; i++) {
      // Get a random biome
      let randomBiome = this.getRandomBiome();

      // Add biome to instance list
      this.#biomes.push(
        // Randomly position the center of the biome
        new randomBiome(
          new Vector2(
            this.seeder() * this.#geometry.parameters.width -
              this.#geometry.parameters.width / 2,
            this.seeder() * this.#geometry.parameters.height -
              this.#geometry.parameters.height / 2
          ),
          i
        )
      );
    }

    // Apply Delaunay triangulation
    const delaunay = Delaunay.from(
      this.#biomes.map((b) => [b.position.x, b.position.y])
    );

    // Apply Voronoi diagram with a little extra space to avoid error in edge calculations
    this.#voronoi = delaunay.voronoi([
      -this.#geometry.parameters.width / 2 - 50,
      -this.#geometry.parameters.height / 2 - 50,
      this.#geometry.parameters.width / 2 + 50,
      this.#geometry.parameters.height / 2 + 50,
    ]);

    // Calculate Voronoi polygon for each biome
    for (let i = 0; i < this.#biomes.length; i++) {
      this.#biomes[i].polygon = this.#voronoi.cellPolygon(i);
    }

    // Calculate all neighbor biomes and store it to each biome
    for (let i = 0; i < this.#biomes.length; i++) {
      this.#biomes[i].neighbors = BiomeCalculator.findNeighbors(
        i,
        this.#biomes,
        this.#voronoi
      );
    }
    this.makeBiomeBoundaries();
  }

  makeBiomeBoundaries() {
    console.log(
      "this.#geometry.attributes.position.array.length",
      this.#geometry.attributes.position.array.length
    );
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);

      // Retrieve the biome in which the vertice is
      let thisBiome = this.#biomes[this.#voronoi.delaunay.find(x, y)];

      this.#verticesDatas[i] = {
        x,
        y,
        index: i,
        biome: thisBiome,
        influences: [],
      };
    }

    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#verticesDatas[i].x;
      const y = this.#verticesDatas[i].y;

      let pointsToBlend = [];
      let threshold = this.blendThreshold;

      for (
        let j = 0;
        j < this.#geometry.attributes.position.array.length / 3;
        j++
      ) {
        const xj = this.#verticesDatas[j].x;
        const yj = this.#verticesDatas[j].y;

        let n =
          this.#noise.noise(
            xj * this.noiseFrequency,
            yj * this.noiseFrequency
          ) * this.noiseAmplitude;

        let d = Math.sqrt((x - xj) ** 2 + (y - yj) ** 2) + n;

        if (d < threshold) {
          let influence = d * this.#verticesDatas[j].biome.influence;
          if (influence > 0) {
            pointsToBlend.push({
              biome: this.#verticesDatas[j].biome,
              influence,
            });
          }
        }
      }

      if (pointsToBlend.length === 0) {
        pointsToBlend.push({
          biome: this.#verticesDatas[i].biome,
          influence: 1,
        });
      }

      let totalWeight = pointsToBlend.reduce(
        (sum, vertice) => sum + vertice.influence,
        0
      );
      for (let j = 0; j < pointsToBlend.length; j++) {
        pointsToBlend[j].influence /= totalWeight;
      }

      this.#verticesDatas[i].influences = pointsToBlend;
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

  /**
   * Instanciate noise \o/
   */
  instanciateNoise() {
    this.#noise = new SimplexNoise({random: Alea("noise")});
  }

  // Apply color for each biome. If a vertice is near to an edge (depending on influenceThreshold), mix color for each near biome for smooth transitions
  colorize() {
    let colors = [];
    // Loop through each vertice
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);
      const z = this.#geometry.attributes.position.getZ(i);

      // Base color will be the color of the current biome

      // If some neightborgs exists, apply a color mix
      let weightsToMix = this.#verticesDatas[i].influences.map(
        (influence) => influence.influence
      );
      let colorsToMix = this.#verticesDatas[i].influences.map(
        (influence) => influence.biome.color
      );

      if (z > 50) {
        weightsToMix.push((z - 50) / 50);
        colorsToMix.push(new Color(0xffffff));
        4;
      }

      // Compute the mix
      let color = this.mixMultipleColors(colorsToMix, weightsToMix);

      // If altitude is greater than 20, color became white no matter the previous calculations
      if (z > 150 + this.#noise.noise(x * 0.02, y * 0.02) * 10) {
        color = new Color(0xffffff);
      }

      // Finally replace the color in the bufferArray provide by Three by decomposing r, g, b chanels
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
    this.#geometry = new PlaneGeometry(
      this.terrainWidth,
      this.terrainHeight,
      this.subdivisions,
      this.subdivisions
    );

    // this.#material = new MeshLambertMaterial({vertexColors: true});
    this.#material = new MeshBasicMaterial({ vertexColors: true });

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
      let amplitude;
      let frequency;
      let altitude;

      let weights = [];

      let amplitudes = [];
      let frequencies = [];
      let altitudes = [];

      if (this.#verticesDatas[i].influences) {
        for (let verticeInfluence of this.#verticesDatas[i].influences) {
          weights.push(verticeInfluence.influence);
          amplitudes.push(
            verticeInfluence.biome?.amplitudeModifier || amplitude
          );
          frequencies.push(
            verticeInfluence.biome?.frequencyModifier || frequency
          );
          altitudes.push(verticeInfluence.biome?.altitude || altitude);
        }

        amplitude = this.weightedAverage(amplitudes, weights);
        frequency = this.weightedAverage(frequencies, weights);
        altitude = this.weightedAverage(altitudes, weights);
      }

      let noiseHeight = altitude;

      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);

      // Loop through each "octaves" and then apply a specific amplitude and frequency depending on the level
      for (let i = 0; i < this.octaves; i++) {
        let sampleX = (x / this.scale) * frequency;
        let sampleY = (y / this.scale) * frequency;

        let noiseValue = this.#noise.noise(sampleX, sampleY) * 2 - 1; // Here is the magic !
        noiseHeight += noiseValue * amplitude;

        amplitude *= this.persistance;
        frequency *= this.lacunarity;
      }

      // Set the Z position of the vertice with the previous calculation
      this.#geometry.attributes.position.setZ(
        i,
        this.#heightMap ? noiseHeight : 0
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
