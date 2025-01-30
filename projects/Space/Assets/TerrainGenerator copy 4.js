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
  ShaderMaterial,
  Shape,
  ShapeGeometry,
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
  subdivisions = 128;
  biomeCount = 20;
  influenceThreshold = 20;

  noiseFrequency = 0
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
    window.addEventListener("contextmenu", () => {
      this.#heightMap = !this.#heightMap;
      this.modifyHeightMap()
      this.colorize()
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
    this.makeBiomeBoundaries()
  }

  makeBiomeBoundaries() {
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);
      const z = this.#geometry.attributes.position.getZ(i);

      // Retrieve the biome in which the vertice is
      let thisBiome = this.#biomes[BiomeCalculator.findBiomeIndex(
        [x, y],
        this.#biomes
      )];

      
      // Retrieve the edges of the Voronoi polygon of the biome
      let edges = BiomeCalculator.getEdges(
        thisBiome.polygon
      );
      console.log("this biome", thisBiome, edges)

      // Init influence array with current biome
      let influences = [
        {
          biome: thisBiome,
          influence: 1 * thisBiome.influence
        }
      ];

      // Loop through all edges and calculate the distance from the current vertice
      for (let j = 0; j < edges.length; j++) {
        let distanceToEdge = BiomeCalculator.edgeDistance([x, y], edges[j][0], edges[j][1]);

        console.log("distanceToEdge", distanceToEdge)

        // Search for biomes matching the edges
        let neighborBiome = BiomeCalculator.getNeighborBiomeByEdge(
          edges[j],
          thisBiome.neighbors
        )

        console.log("neightbor", neighborBiome)

        // Autre idée, plutôt que de calculer jusqu'à la bordure, calculer plutôt la distance proportionnelle inverse de centre à centre

        // let symmetricReferencePoint = this.symmetricPoint([x, y], edges[j])

        // let noiseX
        // let noiseY
        // let inverted = false

        // if (symmetricReferencePoint[0] === x) {
        //   if (symmetricReferencePoint[1] > y) {
        //     noiseX = symmetricReferencePoint[0]
        //     noiseY = symmetricReferencePoint[1]
        //     inverted = true
        //   } else {
        //     noiseX = x
        //     noiseY = y
        //   }
        // } else {
        //   if (symmetricReferencePoint[0] > x) {
        //     noiseX = symmetricReferencePoint[0]
        //     noiseY = symmetricReferencePoint[1]
        //     inverted = true
        //   } else {
        //     noiseX = x
        //     noiseY = y
        //   }
        // }

        let distanceBetweenCenters = this.distance(thisBiome.position, neighborBiome.position)
        let distanceToCenter = this.distance({x, y}, thisBiome.position)

        let proportion = distanceToCenter/distanceBetweenCenters

        // let n = (this.#noise.noise(noiseX * this.noiseFrequency, noiseY * this.noiseFrequency)) * this.noiseAmplitude
        // console.log([x, y], symmetricReferencePoint, midPoint)
        // let midPoint = [x, y]
        // d = d + n
        let threshold = this.influenceThreshold //+ n
        
        // Remove all neighbors with a distance greater than the 'influenceThreshold'
        if (distanceToEdge <= threshold) {

          // let distanceToCenter = Math.sqrt((biome.position.x - x) ** 2 + (biome.position.y - y) ** 2)
          influences.push({
            influence: (1 - proportion / threshold), //* this.#biomes[this.#verticeBiome[i]].influence,
            thisBiome,
          });
        }
      }

      let differentBiomes = {}
      for (let i = 0 ; i < influences.length ; i++) {
        if (!differentBiomes[influences[i].biome.name]) {
          differentBiomes[influences[i].biome.name] = {
            weight: influences[i].biome.influence,
            totalWeight: influences[i].biome.influence,
            count: 1
          }
        } else {
          differentBiomes[influences[i].biome.name].totalWeight += influences[i].biome.influence
          differentBiomes[influences[i].biome.name].count++ 
        }
      }

      for (let i = 0 ; i < influences.length ; i++) {
        influences[i].influence = influences[i].influence / differentBiomes[influences[i].biome.name].count * differentBiomes[influences[i].biome.name].totalWeight
      }

      this.#verticeInfluence[i] = influences;
    }

    // TODO:https://youtu.be/XpG3YqUkCTY?si=-WpNOdQoZPUzv-hd&t=92

    this.#biomes.forEach((biome, index) => {

      console.log("biome", biome.polygon)
      const points3D = biome.polygon.map(([x, z]) => new Vector3(x, z, 50));
      // Géométrie pour les lignes
      const geometryLine = new BufferGeometry().setFromPoints(points3D);
      const materialLine = new LineBasicMaterial({
        color: 0xffffff,
        opacity: 0.2,
        transparent: true,
      }); // Couleur blanche
      const geometryFill = new ShapeGeometry(new Shape(points3D))

      const materialFill = new MeshBasicMaterial({
        color: biome.color,
        opacity: 0.7,
        transparent: true,
        side: DoubleSide, 
      });
      
      const line = new LineLoop(geometryLine, materialLine);
      const polygon = new Mesh(geometryFill, materialFill);
      polygon.position.setZ(50)
      setTimeout(() => {

        // this.scene.threeScene.add(line);
        // this.scene.threeScene.add(polygon);
      }, 80)
    })
  }

  getNormalizedProjection(A, B, P) {
    // Vecteurs
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const AP = { x: P.x - A.x, y: P.y - A.y };
    
    // Produit scalaire et norme au carré
    const dotProduct = AP.x * AB.x + AP.y * AB.y;
    const magnitudeAB2 = AB.x * AB.x + AB.y * AB.y;
    
    // Distance proportionnelle non clampée
    let t = dotProduct / magnitudeAB2;
    
    // Clamp entre 0 et 1
    t = Math.max(0, Math.min(1, t));
    
    return t;
}

  distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  }

  quad(x) {
    return  Math.pow(x, 2)
  }

  symmetricPoint([x, y], [[x1, y1], [x2, y2]]) {
    // Calcul des composantes du vecteur AB
    const dx = x2 - x1;
    const dy = y2 - y1;

    // Longueur au carré du segment
    const lengthSquared = dx ** 2 + dy ** 2;

    // Projection de P sur la droite AB
    const t = ((x - x1) * dx + (y - y1) * dy) / lengthSquared;

    // Coordonnées du point de projection P'
    const px = x1 + t * dx;
    const py = y1 + t * dy;

    // Coordonnées du point symétrique
    const sx = 2 * px - x;
    const sy = 2 * py - y;

    return [sx, sy];
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
        // if (z >  (this.#noise.noise(x * 0.02, y * 0.02)) * 20) {
        //   color = new Color(0xffffff);
        // }

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
      vertexColors: true // Active les couleurs par sommet
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
    console.log("update???")
    this.modifyHeightMap();
    this.makeBiomeBoundaries()
    this.colorize()
  }
}

export default TerrainGenerator;
