import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Raycaster,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
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

import NumericUtils from "@lib/Numeric";

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
  subdivisions = 100;
  biomeCount = 8;
  influenceThreshold = 20;

  noiseFrequency = 0;
  noiseAmplitude = 0;

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
  #heightMap = false;

  #influences = [];

  #voronoi;

  create() {
    this.instanciateNoise();
    this.createTerrain();
    this.createBiomes();
    this.modifyHeightMap();
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

    console.log(this.#voronoi.delaunay)

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

      // let centerGeometry = new SphereGeometry(10);
      // let centerMaterial = new MeshBasicMaterial({
      //   color: 0xff00ff,
      //   transparent: true,
      //   opacity: 0.2,
      // });
      // let centerMesh = new Mesh(centerGeometry, centerMaterial);

      // centerMesh.position.set(
      //   this.#biomes[i].position.x,
      //   this.#biomes[i].position.y,
      //   50
      // );
      // setTimeout(() => {

      //   this.scene.threeScene.add(centerMesh);
      // }, 100)
    }

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

      let triangle = this.findTriangle({x, y});
      if (!triangle) continue
      let biomes = triangle.map((tri) => this.#biomes[tri]);
      // console.log(triangle, biomes)
      let weightedCoordinates = this.calculateBarycentricWeights(
        { x, y },
        biomes[0].position,
        biomes[1].position,
        biomes[2].position
      );
      console.log("weigthed", weightedCoordinates);

      if (i === 5000) {
        let geometry = new SphereGeometry(5);
        let material = new MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 1,
        });
        let mesh = new Mesh(geometry, material);

        mesh.position.set(x, y, 50);

        let centerGeometry = new SphereGeometry(3);
        let centerMaterial = new MeshBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 1,
        });
        
        let meshes = []
        let centerMesh = new Mesh(centerGeometry, centerMaterial)

        centerMesh.position.x = trianglePoints[0][0]
        centerMesh.position.y = trianglePoints[0][1]
        centerMesh.position.z = 50
        meshes.push(centerMesh)
        centerMesh = new Mesh(centerGeometry, centerMaterial)
        centerMesh.position.x = trianglePoints[1][0]
        centerMesh.position.y = trianglePoints[1][1]
        centerMesh.position.z = 50
        meshes.push(centerMesh)
        centerMesh = new Mesh(centerGeometry, centerMaterial)
        centerMesh.position.x = trianglePoints[2][0]
        centerMesh.position.y = trianglePoints[2][1]
        centerMesh.position.z = 50
        meshes.push(centerMesh)

        setTimeout(() => {
          this.scene.threeScene.add(mesh);
          meshes.forEach(m => this.scene.threeScene.add(m))
        }, 100);
      }

      this.#influences[i] = biomes.map((biome, index) => ({
        biome,
        influence: weightedCoordinates[index],
      }));
    }
  }

  isPointInTriangle(P, A, B, C) {
    const cross = (p1, p2) => p1.x * p2.y - p1.y * p2.x;

    const v0 = { x: C.x - A.x, y: C.y - A.y };
    const v1 = { x: B.x - A.x, y: B.y - A.y };
    const v2 = { x: P.x - A.x, y: P.y - A.y };

    const dot00 = cross(v0, v0);
    const dot01 = cross(v0, v1);
    const dot02 = cross(v0, v2);
    const dot11 = cross(v1, v1);
    const dot12 = cross(v1, v2);

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return u >= 0 && v >= 0 && u + v <= 1;
}

  findTriangle(point) {
    const closestPointIndex = this.#voronoi.delaunay.find(point.x, point.y)

    let indexesFoundInTriangles = []
    for (let i = 0 ; i < this.#voronoi.delaunay.triangles.length ; i++) {
      if (this.#voronoi.delaunay.triangles[i] === closestPointIndex) {
        indexesFoundInTriangles.push(i)
      }
    }

    console.log("all potential tirangles", indexesFoundInTriangles)

    for (let i = 0 ; i < indexesFoundInTriangles.length ; i++) {
      let realStartIndex = Math.round(indexesFoundInTriangles[i] / 3) * 3
      const triangle = [
        this.#voronoi.delaunay.triangles[realStartIndex],
        this.#voronoi.delaunay.triangles[realStartIndex + 1],
        this.#voronoi.delaunay.triangles[realStartIndex + 2],
      ];

      console.log("real tri", triangle, point, ...triangle.map(t => this.#biomes[t].position), this.isPointInTriangle(point, ...triangle.map(t => this.#biomes[t].position)))

      if (this.isPointInTriangle(point, ...triangle.map(t => this.#biomes[t].position))) {
        return triangle
      }

    }

    console.log("no triangle")
    return [];
  }

  calculateBarycentricWeights(P, A, B, C) {
    const areaABC =
      Math.abs(A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2;

    const areaPBC =
      Math.abs(P.x * (B.y - C.y) + B.x * (C.y - P.y) + C.x * (P.y - B.y)) / 2;

    const areaPCA =
      Math.abs(P.x * (C.y - A.y) + C.x * (A.y - P.y) + A.x * (P.y - C.y)) / 2;

    const areaPAB =
      Math.abs(P.x * (A.y - B.y) + A.x * (B.y - P.y) + B.x * (P.y - A.y)) / 2;

    const totalArea = areaPBC + areaPCA + areaPAB;

    // Poids barycentriques normalisés
    const lambda1 = areaPBC / totalArea;
    const lambda2 = areaPCA / totalArea;
    const lambda3 = areaPAB / totalArea;

    return [lambda1, lambda2, lambda3];
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
    let meshColors = [];

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
      let color = new Color(0, 0, 0);

      // console.log("infl", this.#influences[i]);

      this.#influences[i].forEach((influence) => {
        color.r += influence.biome.color.r * influence.influence;
        color.g += influence.biome.color.g * influence.influence;
        color.b += influence.biome.color.b * influence.influence;
      });

      // console.log("color", weights, colors, color)
      // If altitude is greater than 20, color became white no matter the previous calculations
      // if (z >  (this.#noise.noise(x * 0.02, y * 0.02)) * 20) {
      //   color = new Color(0xffffff);
      // }

      // Finally replace the color in the bufferArray provide by Three by decomposing r, g, b chanels
      let arr = color.toArray();
      meshColors[i * 3] = arr[0];
      meshColors[i * 3 + 1] = arr[1];
      meshColors[i * 3 + 2] = arr[2];
    }

    // Reset the buffer array in the geometry and recompute normals
    this.#geometry.setAttribute(
      "color",
      new Float32BufferAttribute(meshColors, 3)
    );
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

    // this.#material = new MeshStandardMaterial({ vertexColors: true });

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
      let weights = [];
      let amplitudes = [];
      let frequencies = [];
      let altitudes = [];

      for (let influence of this.#influences[i]) {
        weights.push(influence.influence);
        amplitudes.push(influence.biome?.amplitudeModifier);
        frequencies.push(influence.biome?.frequencyModifier);
        altitudes.push(influence.biome?.altitude);
      }

      // console.log("this.#influences[i]", this.#influences, this.#geometry.attributes.position.array, i, weights, amplitudes, frequencies, altitudes)

      let amplitude = this.weightedAverage(amplitudes, weights);
      let frequency = this.weightedAverage(frequencies, weights);
      let altitude = this.weightedAverage(altitudes, weights);

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
    // if (
    //   this.#geometry.parameters.width !== this.terrainWidth ||
    //   this.#geometry.parameters.height !== this.terrainHeight ||
    //   this.#geometry.parameters.heightSegments !== this.subdivisions ||
    //   this.#geometry.parameters.widthSegments !== this.subdivisions
    // ) {
    //   this.#geometry = new PlaneGeometry(
    //     this.terrainWidth,
    //     this.terrainHeight,
    //     this.subdivisions,
    //     this.subdivisions
    //   );
    // }
    console.log("update???");
    this.modifyHeightMap();
    this.makeBiomeBoundaries();
    this.colorize();
  }
}

export default TerrainGenerator;
