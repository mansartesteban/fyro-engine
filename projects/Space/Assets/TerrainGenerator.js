import {
  Color,
  Float32BufferAttribute,
  MeshStandardMaterial,
  PlaneGeometry,
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

const biomes = [
  BiomeLake,
  BiomePlain,
  BiomeMountain,
  BiomeForest,
  BiomeGrassland,
];

class TerrainGenerator {
  terrainWidth = 500;
  terrainHeight = 500;
  subdivisions = 512;
  biomeCount = 20;
  influenceThreshold = 20;

  noiseFrequency = .005
  noiseAmplitude = 20;

  octaves = 4;
  scale = 12;
  persistance = -2.5;
  lacunarity = 0.4;
  seed = null;
  scene;

  #geometry;
  #material;
  #meshRenderer;
  #noise;
  #biomes = [];
  #heightMap = false

  #verticeBiome = [];
  #verticeInfluence = [];

  #voronoi;

  create() {
    this.instanciateNoise();
    this.createTerrain();
    this.createBiomes();
    this.modifyHeightMap();
    this.colorize();
    window.addEventListener("click", () => {
      this.#heightMap = !this.#heightMap;
      this.modifyHeightMap()
    })
    return this.#meshRenderer;
  }

  /**
   * Create biomes by positioning random biome centers and applying delaunay triangulation and voronoi diagram
   */
  createBiomes() {
    // Instanciante each biome depending on 'biomeCount'
    for (let i = 0; i < this.biomeCount; i++) {
      // Get a random biome
      // let randomBiome = biomes[i];
      let randomBiome = this.getRandomBiome();

      // Add biome to instance list
      this.#biomes.push(
        // Randomly position the center of the biome
        new randomBiome(
          new Vector2(
            Math.random() * this.#geometry.parameters.width -
              this.#geometry.parameters.width / 2,
            Math.random() * this.#geometry.parameters.height -
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

    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);
      const z = this.#geometry.attributes.position.getZ(i);

      // Retrieve the biome in which the vertice is
      this.#verticeBiome[i] = BiomeCalculator.findBiomeIndex(
        [x, y],
        this.#biomes
      );

      // Retrieve the edges of the Voronoi polygon of the biome
      let edges = BiomeCalculator.getEdges(
        this.#biomes[this.#verticeBiome[i]].polygon
      );

      // Init influence array with current biome
      let influences = [
        {
          biome: this.#biomes[this.#verticeBiome[i]],
          influence: 1
        }
      ];

      // Loop through all edges and calculate the distance from the current vertice
      for (let j = 0; j < edges.length; j++) {
        let d = BiomeCalculator.edgeDistance([x, y], edges[j][0], edges[j][1]);
        d = d + (this.#noise.noise(x * this.noiseFrequency, y * this.noiseFrequency) - .5) * this.noiseAmplitude
        
        // Remove all neighbors with a distance greater than the 'influenceThreshold'
        if (d <= this.influenceThreshold) {
          
          // Search for biomes matching the edges
          let biome = BiomeCalculator.getNeighborBiomeByEdge(
            edges[j],
            this.#biomes[this.#verticeBiome[i]].neighbors
          )

          influences.push({
            influence: (1 - d / this.influenceThreshold),
            biome,
          });
        }
      }

      let totalBiomeWeight = influences.reduce((sum, influence) => +sum + +influence.biome.influence, 0)
      let absoluteInfluencesSum = influences.reduce((sum, influence) => +sum + +influence.influence, 0)
      for (let i = 0 ; i < influences.length ; i++) {
        influences[i].influence = influences[i].influence / absoluteInfluencesSum * (influences[i].biome.influence / totalBiomeWeight)
      }

      this.#verticeInfluence[i] = influences;
    }
  }

  // Returns a random class biome based on the spawn frequency
  getRandomBiome() {
    const totalFrequency = biomes.reduce(
      (sum, item) => sum + item.frequency,
      0
    );
    const random = Math.random() * totalFrequency;

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
    this.#noise = new SimplexNoise();
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

      if (this.#biomes[this.#verticeBiome[i]]) {
        // Base color will be the color of the current biome
        let color = this.#biomes[this.#verticeBiome[i]].color;

        // If some neightborgs exists, apply a color mix
        if (this.#verticeInfluence[i]) {
          let weights = [];
          let colors = [];

          for (let nearNeighbor of this.#verticeInfluence[i]) {
            weights.push(nearNeighbor.influence || 0);
            colors.push(nearNeighbor.biome?.color || color);
          }

          // If altitude is greater than 0, add "white" to the color mix for snow
          // if (z > 5) {
          //   weights.push(z / 10);
          //   colors.push(new Color(0xffffff));
          //   4;
          // }

          // Compute the mix
          color = this.mixMultipleColors(colors, weights);
        }

        // If altitude is greater than 20, color became white no matter the previous calculations
        if (z > 20 + (this.#noise.noise(x * 0.08, y * 0.08) - 0.5) * 10) {
          color = new Color(0xffffff);
        }

        // Finally replace the color in the bufferArray provide by Three by decomposing r, g, b chanels
        let arr = color.toArray();
        colors[i * 3] = arr[0];
        colors[i * 3 + 1] = arr[1];
        colors[i * 3 + 2] = arr[2];
      }
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

    this.#material = new MeshStandardMaterial({ vertexColors: true });
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
      let amplitude
      let frequency
      let altitude

      let weights = [];

      let amplitudes = [];
      let frequencies = [];
      let altitudes = [];

      if (this.#verticeInfluence[i]) {
        for (let verticeInfluence of this.#verticeInfluence[i]) {
          weights.push(verticeInfluence.influence);
          amplitudes.push(
            verticeInfluence.biome?.amplitudeModifier || amplitude
          );
          frequencies.push(verticeInfluence.biome?.frequencyModifier || frequency);
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
      this.#geometry.attributes.position.setZ(i, this.#heightMap ? noiseHeight : 0);

      //   if (Math.floor(x) % 2 && Math.floor(y) % 2) {
      //     let centerMesh = new Mesh(centerGeometry, centerMaterial);
      //     centerMesh.position.set(
      //       x,
      //       y,
      //       noiseHeight + 50
      //     );
      //     setTimeout(() => {

      //       this.scene.threeScene.add(centerMesh);
      //     }, 100)
      //   }
    }

    // Recompute normals and indicate to Three to update the mesh
    this.#geometry.computeVertexNormals();
    this.#geometry.attributes.position.needsUpdate = true;
  }

  update() {
    if (
      this.#geometry.parameters.width !== this.terrainWidth ||
      this.#geometry.parameters.height !== this.terrainHeight ||
      this.#geometry.parameters.heightSegments !== this.subdivisions ||
      this.#geometry.parameters.widthSegments !== this.subdivisions
    ) {
      this.#geometry = new PlaneGeometry(
        this.terrainWidth,
        this.terrainHeight,
        this.subdivisions,
        this.subdivisions
      );
    }
    this.modifyHeightMap();
  }
}

export default TerrainGenerator;
