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
  biomeCount = 20;
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
  
  #alt = false
  #mouse = new Vector2()
  #raycaster = new Raycaster();
  #debugMesh;
  #debugMeshes = []
  #intersectionPoint = new Vector3();

  create() {
    this.instanciateNoise();
    this.createTerrain();
    this.createBiomes();
    this.modifyHeightMap();
    this.colorize();

    window.addEventListener("keydown", e => {
      if (e.code === "ControlLeft") this.#debugMesh.visible = true
      
      this.applyDebug()
    })
    window.addEventListener("keyup", e => {
      if (e.code === "ControlLeft" && !e.altKey) this.#debugMesh.visible = false
      if (e.code === "AltLeft") this.#alt = true
      this.applyDebug()
    })
    window.addEventListener("contextmenu", () => {
      this.#heightMap = !this.#heightMap;
      // this.modifyHeightMap();
      this.colorize();
    });
    window.addEventListener("click", (e) => {
      if (this.#debugMesh.visible) {
        this.#debugMeshes.forEach(m => this.scene.remove(m))
        this.#debugMeshes = []
        this.debugDisplayBiomes()
      }
    })

    window.addEventListener("mousemove", (e) => {
      if (!this.#alt) {
      this.#mouse.x = ((e.layerX / e.target.clientWidth) * 2 - 1) 
			this.#mouse.y = (-(e.layerY / e.target.clientHeight) * 2 + 1)

      if (this.scene) {
        this.#raycaster.setFromCamera(this.#mouse, this.scene.viewer.camera);
        let intersectObjects =  []
        // this.#raycaster.ray.intersectPlane(this.#geometry, intersectionPoint);
        intersectObjects = this.#raycaster.intersectObject(this.#meshRenderer.object)
        this.#intersectionPoint = intersectObjects?.[0]?.point
        
        // console.log("this.intersect", this.#intersectedObjects[0].point)
        
      }
      this.applyDebug()
    }
    })
    this.createDebug()
    return this.#meshRenderer;
  }

  createDebug() {
    let material = new MeshBasicMaterial({ color: 0xff0000 })
    let geometry = new SphereGeometry(5, 5)
    this.#debugMesh = new Mesh(geometry, material)
    this.#debugMesh.position.z = 5
    this.#debugMesh.visible = false
    setTimeout(() => {
      this.scene.threeScene.add(this.#debugMesh)
    }, 70)
  }

  applyDebug() {
    this.#debugMesh.position.x  = Math.round(this.#intersectionPoint?.x / (this.terrainHeight / this.subdivisions)) *  (this.terrainHeight / this.subdivisions) 
    this.#debugMesh.position.y  = Math.round(-this.#intersectionPoint?.z / (this.terrainWidth / this.subdivisions)) * (this.terrainWidth / this.subdivisions) 
    
  }

  debugDisplayBiomes() {
    let index = -1;
    for (let i = 0 ; i < this.#geometry.attributes.position.array.length / 3 ; i++) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);
      if (this.#debugMesh.position.x === x && this.#debugMesh.position.y === y) {
        index = i

        let closestPoint =
        this.#biomes[this.#voronoi.delaunay.find(x, y)].position;
        let distanceToClosestPoint = Math.sqrt(
          (x + closestPoint.x) ** 2,
          (y + closestPoint.y) ** 2
        );
        let blendDistance = 10 * this.influenceThreshold;
    
    
        let centerGeometry = new SphereGeometry(blendDistance);
        let centerMaterial = new MeshBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 0.2,
        });
        let centerMesh = new Mesh(centerGeometry, centerMaterial);
  
        centerMesh.position.set(
          x,
          y,
          50
        );
        setTimeout(() => {
  
          this.scene.threeScene.add(centerMesh);
        }, 100)

        break;
      }
    }

    console.log("this.#influences[index]", this.#influences[index])

    

    this.#influences[index].forEach(influence => {
      const points3D = influence.biome.polygon.map(([x, z]) => new Vector3(x, z, 15));
      const geometry = new BufferGeometry().setFromPoints(points3D);
      const material = new LineBasicMaterial({
        color: 0x00ffff,
        opacity: 0.33,
        transparent: true,
      }); 
      
      const line = new LineLoop(geometry, material);
      this.scene.threeScene.add(line);
      this.#debugMeshes.push(line)
    })
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

      let centerGeometry = new SphereGeometry(10);
      let centerMaterial = new MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.2,
      });
      let centerMesh = new Mesh(centerGeometry, centerMaterial);

      centerMesh.position.set(
        this.#biomes[i].position.x,
        this.#biomes[i].position.y,
        50
      );
      setTimeout(() => {

        this.scene.threeScene.add(centerMesh);
      }, 100)
    }


    
    this.makeBiomeBoundaries();
  }

  fade(t) {
    return t * t * (3 - 2 * t);
  }

  makeBiomeBoundaries() {
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);

      let closestPoint =
        this.#biomes[this.#voronoi.delaunay.find(x, y)].position;
      let distanceToClosestPoint = Math.sqrt(
        (x + closestPoint.x) ** 2,
        (y + closestPoint.y) ** 2
      );
      let blendDistance = this.influenceThreshold + distanceToClosestPoint;

      let pointsToBlend = [];
      for (let j = 0; j < this.#biomes.length; j++) {
        let biome = this.#biomes[j];
        let d = Math.sqrt(
          (biome.position.x + x) ** 2,
          (biome.position.y + y) ** 2
        );
        if (d <= blendDistance) {
          pointsToBlend.push({
            biome,
          });
        }
      }

      let weights = Array(pointsToBlend.length).fill(1); // Initialiser tous les poids à 1

      for (let i = 0; i < pointsToBlend.length; i++) {
        // for (let j = i+1; j < pointsToBlend.length; j++) {
        for (let j = i; j < pointsToBlend.length; j++) {
          if (i === j) continue;

          const A = pointsToBlend[i].biome.position;
          const B = pointsToBlend[j].biome.position;

          // Milieu entre A et B
          const mid = {
            x: (A.x + B.x) / 2,
            y: (A.y + B.y) / 2,
          };

          // Direction de B vers A
          const direction = {
            x: B.x - A.x,
            y: B.y - A.y,
          };

          // Distance signée F
          const inputVector = {
            x: x - mid.x,
            y: y - mid.y,
          };

          
          const length = Math.sqrt(direction.x ** 2 + direction.y ** 2);
          const F = this.dot(inputVector, direction) / length;

          // Normaliser et lisser
          const F_clamped = Math.min(Math.max(F / this.influenceThreshold, -1), 1);
          const H = this.fade(F_clamped * 0.5 + 0.5);

          // Modifier les poids
          weights[j] *= H; // Influence de B
          weights[i] *= 1 - H; // Influence de A
        }
      }

      // Normaliser les poids
      const totalWeight = weights.reduce((sum, w) => +sum + +w, 0);
      weights = weights.map((w) => w / totalWeight);

      this.#influences[i] = pointsToBlend.map((p, index) => ({
        ...p,
        influence: weights[index],
      }));

    }

    // TODO:https://youtu.be/XpG3YqUkCTY?si=-WpNOdQoZPUzv-hd&t=92

    this.#biomes.forEach((biome, index) => {
      const points3D = biome.polygon.map(([x, z]) => new Vector3(x, z, 50));
      // Géométrie pour les lignes
      const geometryLine = new BufferGeometry().setFromPoints(points3D);
      const materialLine = new LineBasicMaterial({
        color: 0xffffff,
        opacity: 0.2,
        transparent: true,
      }); // Couleur blanche
      const geometryFill = new ShapeGeometry(new Shape(points3D));

      const materialFill = new MeshBasicMaterial({
        color: biome.color,
        opacity: 0.2,
        transparent: true,
        side: DoubleSide,
      });

      const line = new LineLoop(geometryLine, materialLine);
      const polygon = new Mesh(geometryFill, materialFill);
      polygon.position.setZ(-50);
      setTimeout(() => {
        this.scene.threeScene.add(line);
        this.scene.threeScene.add(polygon);
      }, 80);
    });
  }

  dot(vec1, vec2) {
    return vec1.x * vec2.x + vec1.y * vec2.y;
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
      let weights = [];
      let colors = [];

      for (let influence of this.#influences[i]) {
        weights.push(influence.influence);
        colors.push(influence.biome?.color || 0xff0000);
      }

      // Compute the mix
      let color = this.mixMultipleColors(colors, weights);
      
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
    this.#geometry.setAttribute("color", new Float32BufferAttribute(meshColors, 3));
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
