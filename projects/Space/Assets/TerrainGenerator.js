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

const biomes = [BiomeForest, BiomeGrassland, BiomeLake, BiomePlain];

class TerrainGenerator {
  terrainWidth = 500;
  terrainHeight = 500;
  subdivisions = 256;
  biomeCount = 30;
  distanceThreshold = 10

  octaves = 4;
  scale = 12;
  persistance = -2.5;
  lacunarity = .4;
  seed = null;
  scene;

  #geometry;
  #material;
  #meshRenderer;
  #noise;
  #biomes = [];

  #voronoi;

  create() {
    this.instanciateNoise();
    this.createTerrain();
    this.modifyHeightMap();
    this.createBiomes();
    this.colorize();
    return this.#meshRenderer;
  }

  /**
   * Create biomes by positioning random biome centers and applying delaunay triangulation and voronoi diagram
   */
  createBiomes() {

    // Instanciante each biome depending on 'biomeCount'
    for (let i = 0; i < this.biomeCount; i++) {

      // Get a random biome
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

  // Apply color for each biome. If a vertice is near to an edge (depending on distanceThreshold), mix color for each near biome for smooth transitions
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

      // Retrieve the biome in which the vertice is
      let biome = BiomeCalculator.findBiome([x, y], this.#biomes);

      // Retrieve the edges of the Voronoi polygon of the biome
      let edges = BiomeCalculator.getEdges(biome.polygon);
      let distances = [];

      // Loop through all edges and calculate the distance from the current vertice
      for (let j = 0; j < edges.length; j++) {
        let d = BiomeCalculator.edgeDistance(
          [x, y],
          edges[j][0],
          edges[j][1]
        )

        distances.push({
          index: j,
          distance:  d + d * (this.#noise.noise(x * .008, y * .008) - .5) * .6
        });
      }

      // Remove all distances calculated which are greater than the 'distanceThreshold'
      distances = distances.filter((d) => d.distance <= this.distanceThreshold);

      // Search for biomes matching the edges
      let nearNeighbors = distances.map(d => ({
        ...d,
        biome: BiomeCalculator.getNeighborBiomeByEdge(edges[d.index], biome.neighbors)
      }))

      if (biome) {

        // Base color will be the color of the current biome
        let color = biome.color

        // If some neightborgs exists, apply a color mix
        if (nearNeighbors) {
          let weights = []
          let colors = []
          for (let nearNeighbor of nearNeighbors) {
            weights.push(1 - (nearNeighbor.distance / this.distanceThreshold))
            colors.push(nearNeighbor.biome?.color || color)
          }

          weights.push(1)
          colors.push(color)

          // If altitude is greater than 0, add "white" to the color mix for snow
          if (z > 0) {
            weights.push(z/10)
            colors.push(new Color(0xffffff))
          4}
    
          // Compute the mix
          color = this.mixMultipleColors(colors, weights)
        }

        // If altitude is greater than 20, color became white no matter the previous calculations
        if (z > 20 + (this.#noise.noise(x * .08, y * .08) - .5) * 10) {
          color=new Color(0xffffff)
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
        throw new Error("Arrays 'colors' and 'weights' have not the same length")
    }

    // Normalize weights
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = weights.map(weight => weight / totalWeight);

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

      let amplitude = 1;
      let frequency = 1;
      let noiseHeight = 0;

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
      this.#geometry.attributes.position.setZ(i, noiseHeight);
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
