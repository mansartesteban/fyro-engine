import {
  ArrowHelper,
  BufferAttribute,
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
  subdivisions = 128;
  biomeCount = 20;
  influenceThreshold = 40;

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

  #verticeBiome = [];
  #verticeInfluence = [];

  #voronoi;

  create() {
    this.instanciateNoise();
    this.createTerrain();
    this.createBiomes();
    // this.modifyHeightMap();
    this.colorize();
    // window.addEventListener("contextmenu", () => {
    // this.#heightMap = !this.#heightMap;
    // this.modifyHeightMap()
    // this.colorize()
    // })
    let intersectObjects = [];
    let intersectionPoint;
    let mouse = new Vector2();
    let raycaster = new Raycaster();

    // const points3D2 = [neighborsCenters[j].position, new Vector2(x, y)]
    const geometry2 = new BufferGeometry().setFromPoints([]);
    const material2 = new LineBasicMaterial({
      color: 0xff0000,
      opacity: 1,
    });
    const line2 = new LineLoop(geometry2, material2);
    const geometry3 = new BufferGeometry().setFromPoints([]);
    const material3 = new LineBasicMaterial({
      color: 0xffff00,
      opacity: 1,
    });

    const line3 = new LineLoop(geometry3, material3);

    let vertices = [];
    let vertices2 = [];

    let material = new MeshBasicMaterial({ color: 0xff0000 });
    let geometry = new SphereGeometry(3, 3);
    let pointMesh = new Mesh(geometry, material);

    pointMesh.position.z = 1;

    setTimeout(() => {
      line2.position.z = 1;
      line3.position.z = 1;
      this.scene.threeScene.add(line2);
      this.scene.threeScene.add(line3);
      this.scene.threeScene.add(pointMesh);
    }, 70);

    // window.addEventListener("mousemove", (e) => {
    //   mouse.x = (e.layerX / e.target.clientWidth) * 2 - 1;
    //   mouse.y = -(e.layerY / e.target.clientHeight) * 2 + 1;

    //   raycaster.setFromCamera(mouse, this.scene.viewer.camera);
    //   intersectObjects = raycaster.intersectObject(this.#meshRenderer.object);
    //   intersectionPoint = intersectionPoint = intersectObjects?.[0]?.point;

    //   if (intersectionPoint) {
    //     pointMesh.position.x = intersectionPoint.x;
    //     pointMesh.position.y = -intersectionPoint.z;
    //     pointMesh.position.z = 1;
    //     pointMesh.position.needsUpdate = true;

    //     let index = this.#voronoi.delaunay.find(
    //       intersectionPoint.x,
    //       -intersectionPoint.z
    //     );
    //     let neighborsCenters = this.#voronoi.delaunay
    //       .trianglePolygon(index)
    //       .map((t) => ({ x: t[0], y: t[1] }));
    //     vertices = [];
    //     vertices2 = [];

    //     // let neighborsCenters = [...this.#voronoi.neighbors(index).map(i => this.#biomes[i].position), this.#biomes[index].position]
    //     let neighborsCenters2 = this.shrinkPolygon(neighborsCenters, 0.4);
    //     // console.log("found neighbors", neighborsCenters)
    //     for (let i = 0; i < neighborsCenters.length; i++) {
    //       vertices.push(neighborsCenters[i].x);
    //       vertices.push(neighborsCenters[i].y);
    //       vertices.push(1);
    //       vertices2.push(neighborsCenters2[i].x);
    //       vertices2.push(neighborsCenters2[i].y);
    //       vertices2.push(1);
    //     }

    //     console.log("intersection point", vertices);
    //     geometry2.setAttribute(
    //       "position",
    //       new BufferAttribute(new Float32Array(vertices), 3)
    //     );
    //     geometry2.attributes.position.needsUpdate = true;
    //     geometry3.setAttribute(
    //       "position",
    //       new BufferAttribute(new Float32Array(vertices2), 3)
    //     );
    //     geometry3.attributes.position.needsUpdate = true;
    //   }
    // });

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

    console.log("this.#voronoi", this.#voronoi);

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
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      const x = this.#geometry.attributes.position.getX(i);
      const y = this.#geometry.attributes.position.getY(i);
      const z = this.#geometry.attributes.position.getZ(i);

      // Retrieve the biome in which the vertice is
      let thisBiomeIndex = this.#voronoi.delaunay.find(x, y);

      let thisBiome = this.#biomes[thisBiomeIndex];
      let neighbors = [
        ...this.#voronoi.delaunay
          .neighbors(thisBiomeIndex)
          .map((index) => this.#biomes[index]),
      ];

      const points3D = [thisBiome.position, new Vector2(x, y)];
      const geometry = new BufferGeometry().setFromPoints(points3D);
      const material = new LineBasicMaterial({
        color: 0xffffff,
        opacity: 0.05,
        transparent: true,
      }); // Couleur blanche

      const line = new LineLoop(geometry, material);

      setTimeout(() => {
        line.position.z = 30;
        // this.scene.threeScene.add(line); 
      }, 80);

      this.#verticeInfluence[i] = [];

      const influences = [];

      // Parcours des voisins pour calculer l'influence
      for (let j = 0; j < neighbors.length; j++) {
        const neighborPolygon = neighbors[j].polygon;

        // Trouver la distance minimale entre le point et le polygone voisin
        const distance = this.pointToPolygonDistance({ x, y }, neighborPolygon)

        if (distance <= this.influenceThreshold) {
          const influence = this.influenceThreshold-distance
          influences.push({
            biome: neighbors[j],
            influence,
          });
        }
      }

      // if (influences.length === 0) {
      let mainBiomeInfluence = 0;
        for (let j = 0; j < influences.length; j++) {
          mainBiomeInfluence += influences[j].influence
        }
        influences.push({biome: thisBiome, influence: this.influenceThreshold })
        // }

      // Normalisation
      const totalInfluence = Object.values(influences).reduce(
        (sum, inf) => sum + inf.influence,
        0
      );
      for (let j = 0; j < influences.length; j++) {
        influences[j].influence /= totalInfluence;
      }

      this.#verticeInfluence[i] = influences;

      // let neighborsCenters = neighbors.map(biome => biome.position)
      // .filter((biome) => {
      //   console.log("bio", thisBiome, biome)
      //   let d = this.getNormalizedProjection(thisBiome.position, biome, {x, y})
      //   return true;//(d < .4)
      // })

      // let shrinked = this.shrinkPolygon(neighborsCenters, .2)
      // let weights = this.calculateBarycentricWeights({x,y}, shrinked)

      // for (let j = 0 ; j < neighborsCenters.length ; j++ ) {
      //   this.#verticeInfluence[i].push({
      //     biome: neighbors[j],
      //     influence: weights[j]
      //   })
      // }

      //   let distanceBetweenCenters = Math.sqrt((thisBiome.position.x - neighborsCenters[j].position.x) ** 2 + (thisBiome.position.y - neighborsCenters[j].position.y) ** 2)

      //   let d = this.getNormalizedProjection(thisBiome.position, neighborsCenters[j].position, {x, y})
      //   console.log("d", d, this.influenceThreshold)
      //   if (d > .3) {

      //     this.#verticeInfluence[i].push({
      //       biome: neighborsCenters[j],
      //       distance: d,
      //       influence: 0
      //     })
      //   }
      // }

      // let totalDistance = this.#verticeInfluence[i].reduce((sum, influence) => +sum + +influence.distance, 0) + 1
      // for (let j = 0 ; j < this.#verticeInfluence[i].length ; j++) {
      //   this.#verticeInfluence[i][j].influence = (1-this.#verticeInfluence[i][j].distance) / totalDistance
      // }

      // console.log("before this.#verticeInfluence[i]", this.#verticeInfluence[i])
      // this.#verticeInfluence[i].unshift({
      //   biome: thisBiome,
      //   distance: 1,//Math.sqrt((thisBiome.position.x - x) ** 2 + (thisBiome.position.y - y) ** 2),
      //   influence: 1 / this.#verticeInfluence[i].length
      // })

      // console.log("after this.#verticeInfluence[i]", this.#verticeInfluence[i])
    }

    // TODO:https://youtu.be/XpG3YqUkCTY?si=-WpNOdQoZPUzv-hd&t=92

    this.#biomes.forEach((biome, index) => {
      console.log("biome", biome.polygon);
      const points3D = biome.polygon.map(([x, z]) => new Vector3(x, z, 1));
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
      polygon.position.setZ(1);
      setTimeout(() => {
        this.scene.threeScene.add(line);
        // this.scene.threeScene.add(polygon);
      }, 80);
    });
  }

  pointToPolygonDistance(point, polygon) {
    let minDistance = Infinity;

    for (let i = 0; i < polygon.length - 1; i++) {
      const [x1, y1] = polygon[i];
      const [x2, y2] = polygon[i + 1];

      const distance = this.distancePointToSegment(
        point,
        { x: x1, y: y1 },
        { x: x2, y: y2 }
      );
      if (distance <= minDistance) {
        minDistance = distance;
      }
    }

    return minDistance;
  }

  distancePointToSegment(P, A, B) {
    // Calculer les vecteurs AB et AP
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const AP = { x: P.x - A.x, y: P.y - A.y };

    // Calculer le produit scalaire AB.AP
    const ABdotAP = AB.x * AP.x + AB.y * AP.y;

    // Calculer la norme au carré de AB
    const ABnorm2 = AB.x * AB.x + AB.y * AB.y;

    // Calculer le paramètre de projection t
    const t = ABdotAP / ABnorm2;

    // Vérifier si le projeté est en dehors du segment
    if (t < 0) {
        // Le projeté est avant A, retourner la distance entre P et A
        return Math.sqrt((P.x - A.x) ** 2 + (P.y - A.y) ** 2);
    } else if (t > 1) {
        // Le projeté est après B, retourner la distance entre P et B
        return Math.sqrt((P.x - B.x) ** 2 + (P.y - B.y) ** 2);
    } else {
        // Le projeté est sur le segment, calculer les coordonnées du projeté
        const proj = { x: A.x + t * AB.x, y: A.y + t * AB.y };

        // Retourner la distance entre P et le projeté
        return Math.sqrt((P.x - proj.x) ** 2 + (P.y - proj.y) ** 2);
    }
}

  pointToEdgeDistance(point, v1, v2) {
    const dx = v2.x - v1.x;
    const dy = v2.y - v1.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      // v1 et v2 sont le même point
      return 0;
    }

    let t = ((point.x - v1.x) * dx + (point.y - v1.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    const closestPoint = { x: v1.x + t * dx, y: v1.y + t * dy };
    return Math.sqrt(
      (point.x - closestPoint.x) ** 2 + (point.y - closestPoint.y) ** 2
    );
  }

  shrinkPolygon(points, scaleFactor) {
    // Calculer le barycentre
    const barycenter = points.reduce(
      (acc, point) => {
        acc.x += point.x;
        acc.y += point.y;
        return acc;
      },
      { x: 0, y: 0 }
    );

    barycenter.x /= points.length;
    barycenter.y /= points.length;

    // Réduire chaque point vers le barycentre
    return points.map((point) => ({
      x: barycenter.x + scaleFactor * (point.x - barycenter.x),
      y: barycenter.y + scaleFactor * (point.y - barycenter.y),
    }));
  }

  calculateBarycentricWeights(P, points) {
    const n = points.length;
    const areas = [];
    let totalArea = 0;

    // Calcul des aires des triangles
    for (let i = 0; i < n; i++) {
      const A = points[i];
      const B = points[(i + 1) % n]; // Boucle vers le premier point

      const area =
        Math.abs(P.x * (A.y - B.y) + A.x * (B.y - P.y) + B.x * (P.y - A.y)) / 2;

      areas.push(area);
      totalArea += area;
    }

    // Calcul des poids barycentriques normalisés
    return areas.map((area) => area / totalArea);
  }

  getProjection(A, B, P) {
    // Vecteurs
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const AP = { x: P.x - A.x, y: P.y - A.y };

    // Produit scalaire et norme au carré
    return AP.x * AB.x + AP.y * AB.y;
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
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  quad(x) {
    return Math.pow(x, 2);
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
    let verticeColors = [];

    // Loop through each vertice
    for (
      let i = 0;
      i < this.#geometry.attributes.position.array.length / 3;
      i++
    ) {
      // const x = this.#geometry.attributes.position.getX(i);
      // const y = this.#geometry.attributes.position.getY(i);
      // const z = this.#geometry.attributes.position.getZ(i);

      // If some neightborgs exists, apply a color mix
      let color = new Color(0, 0, 0);

      // console.log("infl", this.#influences[i]);$

      this.#verticeInfluence[i].forEach((influence) => {
        color.r += influence.biome.color.r * influence.influence;
        color.g += influence.biome.color.g * influence.influence;
        color.b += influence.biome.color.b * influence.influence;
      });

      // If altitude is greater than 0, add "white" to the color mix for snow
      // if (z > 5) {
      //   weights.push(z / 10);
      //   colors.push(new Color(0xffffff));
      //   4;
      // }

      // Compute the mix
      // let color = this.mixMultipleColors(colors, weights);
      // console.log("color", color)

      // If altitude is greater than 20, color became white no matter the previous calculations
      // if (z >  (this.#noise.noise(x * 0.02, y * 0.02)) * 20) {
      //   color = new Color(0xffffff);
      // }

      // Finally replace the color in the bufferArray provide by Three by decomposing r, g, b chanels
      let arr = color.toArray();
      verticeColors[i * 3] = arr[0];
      verticeColors[i * 3 + 1] = arr[1];
      verticeColors[i * 3 + 2] = arr[2];
    }

    // Reset the buffer array in the geometry and recompute normals
    this.#geometry.setAttribute(
      "color",
      new Float32BufferAttribute(verticeColors, 3)
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
      let amplitude;
      let frequency;
      let altitude;

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
