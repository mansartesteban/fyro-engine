import Entity from "@core/Entity";
import MapRender from "./MapRender";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import MeshRenderComponent from "@core/Components/MeshRenderComponent";
import ArrayUtils from "@lib/Arrays";

import { SimplexNoise } from "three/examples/jsm/Addons.js";
import { GUI } from "dat.gui";
import { Delaunay } from "d3-delaunay";

const biomes = [
  {
    name: "plain",
    color: new Color(0x7cfc00),
    // color: new Color(0x00FF00),
    frequency: 30,
  },
  {
    name: "forest",
    color: new Color(0x228b22),
    // color: new Color(0xFF0000),
    frequency: 20,
  },
  {
    name: "lake",
    color: new Color(0x1e90ff),
    // color: new Color(0x0000FF),
    frequency: 5,
  },
];

class Map extends Entity {
  constructor() {
    super();
    this.addComponent(new MapRender());
    this.createMap();
  }

  addGui(params, geometry, noise) {
    const gui = new GUI();
    gui.add(params, "mountainFrequency", 0.001, 0.01).onChange((value) =>
      this.updateHeightmap(geometry, noise, {
        ...params,
        mountainFrequency: value,
      })
    );
    gui.add(params, "mountainAmplitude", 10, 100).onChange((value) =>
      this.updateHeightmap(geometry, noise, {
        ...params,
        mountainAmplitude: value,
      })
    );
    gui.add(params, "hillFrequency", 0.01, 0.05).onChange((value) =>
      this.updateHeightmap(geometry, noise, {
        ...params,
        hillFrequency: value,
      })
    );
    gui.add(params, "hillAmplitude", 5, 50).onChange((value) =>
      this.updateHeightmap(geometry, noise, {
        ...params,
        hillAmplitude: value,
      })
    );
    gui.add(params, "detailFrequency", 0.05, 0.2).onChange((value) =>
      this.updateHeightmap(geometry, noise, {
        ...params,
        detailFrequency: value,
      })
    );
    gui.add(params, "detailAmplitude", 1, 10).onChange((value) =>
      this.updateHeightmap(geometry, noise, {
        ...params,
        detailAmplitude: value,
      })
    );
  }

  createMap() {
    const mapWidth = 500;
    const mapHeight = 500;
    const subdivisions = 128;

    const geometry = new PlaneGeometry(
      mapWidth,
      mapHeight,
      subdivisions,
      subdivisions
    );

    const params = {
      mountainFrequency: 0.0066,
      mountainAmplitude: 33,
      hillFrequency: 0.026,
      hillAmplitude: 10,
      detailFrequency: 0.1,
      detailAmplitude: 2,
    };

    const noise = new SimplexNoise();

    this.updateHeightmap(geometry, noise, params);
    this.addGui(params, geometry, noise);
    this.createBiomes(geometry);

    const material = new MeshStandardMaterial({ vertexColors: true });

    this.addComponent(new MeshRenderComponent({ geometry, material }));
  }

  createBiomes(geometry) {
    if (!geometry) {
      return;
    }

    const biomeCount = 30;
    const instanciatedBiomes = [];

    for (let i = 0; i < biomeCount; i++) {
      instanciatedBiomes.push({
        position: new Vector2(
          Math.random() * geometry.parameters.width -
            geometry.parameters.width / 2,
          Math.random() * geometry.parameters.height -
            geometry.parameters.height / 2
        ),
        polygon: null,
        ...this.getRandomBiome(),
      });
    }

    const delaunay = Delaunay.from(instanciatedBiomes.map((b) => [b.position.x, b.position.y]));
    const voronoi = delaunay.voronoi([
      -geometry.parameters.width / 2,
      -geometry.parameters.height / 2,
      geometry.parameters.width / 2,
      geometry.parameters.height / 2,
    ]);

    for (let i = 0; i < instanciatedBiomes.length; i++) {
      instanciatedBiomes[i].polygon = voronoi.cellPolygon(i);
    }
    // setTimeout(() => {
    //   this.debug({ biomes: instanciatedBiomes, voronoi });
    // }, 100);

      let colors = geometry.attributes.color?.array || [];

      geometry.attributes.position.array.forEach((_, i) => {
        const x = geometry.attributes.position.getX(i);
        const y = geometry.attributes.position.getY(i);

        for (let [index, biome] of instanciatedBiomes.entries()) {
          if (this.isPointInPolygon([x, y], biome.polygon)) {
            // let neighborsBiomes = this.findVoronoiNeighbors(
            //   index,
            //   voronoi
            // ).map((neighbourIndex) => instanciatedBiomes[neighbourIndex]);

            // let color = new Color(
            //   this.calculateMixedColor(x, y, biome, neighborsBiomes, i)
            // );

            let color = biome.color;

            let arr = color.toArray();
            colors[i * 3] = arr[0];
            colors[i * 3 + 1] = arr[1];
            colors[i * 3 + 2] = arr[2];
            break;
          }
        }

        const z = geometry.attributes.position.getZ(i);

        if (geometry.attributes.position.getZ(i) > 0) {
          colors[i * 3] = 1;
          colors[i * 3 + 1] = 1;
          colors[i * 3 + 2] = 1;
        }
      });
      geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
      geometry.computeVertexNormals();
      geometry.attributes.position.needsUpdate = true;
  }

   findVoronoiNeighbors(pointIndex, voronoi) {
    const currentCell = voronoi.cellPolygon(pointIndex); // Cellule de l'index donné
    if (!currentCell) return []; // Pas de voisins si la cellule est invalide

    const neighbors = new Set();

    // Parcourir toutes les autres cellules
    for (let i = 0; i < voronoi.delaunay.points.length / 2; i++) {
        if (i === pointIndex) continue; // Ignore le point lui-même

        const neighborCell = voronoi.cellPolygon(i);
        if (!neighborCell) continue;

        // Vérifie si les deux cellules partagent une arête
        if (this.cellsShareEdge(currentCell, neighborCell)) {
            neighbors.add(i);
        }
    }

    return Array.from(neighbors); // Retourne les indices des voisins
}

// Vérifie si deux cellules partagent une arête
 cellsShareEdge(cell1, cell2) {
    for (let i = 0; i < cell1.length; i++) {
        const edge1 = [cell1[i], cell1[(i + 1) % cell1.length]]; // Arête de cell1

        for (let j = 0; j < cell2.length; j++) {
            const edge2 = [cell2[j], cell2[(j + 1) % cell2.length]]; // Arête de cell2

            // Vérifie si les arêtes sont les mêmes (dans les deux sens)
            if (
                (edge1[0][0] === edge2[1][0] && edge1[0][1] === edge2[1][1] &&
                 edge1[1][0] === edge2[0][0] && edge1[1][1] === edge2[0][1]) ||
                (edge1[0][0] === edge2[0][0] && edge1[0][1] === edge2[0][1] &&
                 edge1[1][0] === edge2[1][0] && edge1[1][1] === edge2[1][1])
            ) {
                return true;
            }
        }
    }
    return false;
}

  findVoronoiNeighborsBackup(pointIndex, delaunay) {
    const neighbors = new Set();

    for (let edge = 0; edge < delaunay.halfedges.length; edge++) {
      const twinEdge = delaunay.halfedges[edge];
      // console.log("other", delaunay.halfedges)
      // console.log("edge", twinEdge, edge, delaunay.triangles, delaunay.triangles[edge], pointIndex)

        // Vérifie si cette arête appartient au point donné
        if (delaunay.triangles[edge] === pointIndex) {
            const neighborIndex = delaunay.triangles[twinEdge]; // Voisin via l'arête jumelle
            // console.log("delaunay.triangles[edge] === pointIndex", neighborIndex, twinEdge)
            if (neighborIndex !== undefined && neighborIndex !== -1) {
                neighbors.add(neighborIndex);
            }
        }
    }

    return Array.from(neighbors); // Convertir en tableau
}

calculateMixedColor(x, y, currentBiome, biomes) {
  let totalWeight = 0;
  const mixedColor = { r: 0, g: 0, b: 0 };

  biomes = [currentBiome, ...biomes]
  // Calcule les poids normalisés pour chaque biome
  const weights = biomes.map(biome => {
      const distance = Math.sqrt((x - biome.position.x) ** 2 + (y - biome.position.y) ** 2);
      const weight = (biome == currentBiome ? 1 : .3) / (distance + 0.1); // Pondération inverse de la distance
      totalWeight += weight;
      return { biome, weight };
  });

  // Normalise les poids et mélange les couleurs
  weights.forEach(({ biome, weight }) => {
      const normalizedWeight = weight / totalWeight; // Normalisation

      const color = biome.color.getHex();
      mixedColor.r += ((color >> 16) & 255) * normalizedWeight;
      mixedColor.g += ((color >> 8) & 255) * normalizedWeight;
      mixedColor.b += (color & 255) * normalizedWeight;
  });

  return (
      (Math.round(mixedColor.r) << 16) |
      (Math.round(mixedColor.g) << 8) |
      Math.round(mixedColor.b)
  ); // Retourne un entier 0xRRGGBB
}

//   mixColors(color1, color2, t) {
//     const r = (1 - t) * ((color1 >> 16) & 255) + t * ((color2 >> 16) & 255);
//     const g = (1 - t) * ((color1 >> 8) & 255) + t * ((color2 >> 8) & 255);
//     const b = (1 - t) * (color1 & 255) + t * (color2 & 255);
//     return (r << 16) | (g << 8) | b;
//   }

  debug({ biomes, voronoi }) {
    // Dessiner les cellules de Voronoï
    for (let i = 0; i < biomes.length; i++) {
      const polygon = biomes[i].polygon; // Obtenir les sommets du polygone

      if (polygon) {
        // const points3D = polygon.map(([x, z]) => new Vector3(x, z, 150)); // Z=0 pour un polygone plat
        // points3D.push(points3D[0]); // Fermer le polygone

        // const cell = new Shape(points3D.map((p) => new Vector2(p.x, p.y)));
        // const cellGeometry = new ShapeGeometry(cell);

        // const cellMaterial = new MeshBasicMaterial({
        //   color: biomes[i].color,
        //   side: DoubleSide,
        //   opacity: 0.2,
        //   transparent: true,
        // });

        // const mesh = new Mesh(cellGeometry, cellMaterial);

        // // Géométrie pour les lignes
        // const geometry = new BufferGeometry().setFromPoints(points3D);
        // const material = new LineBasicMaterial({
        //   color: 0xffffff,
        //   opacity: 0.2,
        //   transparent: true,
        // }); // Couleur blanche

        // mesh.position.z = 150;
        // const line = new LineLoop(geometry, material);
        // this.scene.threeScene.add(line);
        // this.scene.threeScene.add(mesh);

        let centerGeometry = new SphereGeometry(10);
        let centerMaterial = new MeshBasicMaterial({
          color: 0xff00ff,
          transparent: true,
          opacity: 0.2,
        });
        let centerMesh = new Mesh(centerGeometry, centerMaterial);

        centerMesh.position.set(
          biomes[i].position.x,
          biomes[i].position.y,
          0
        );
        this.scene.threeScene.add(centerMesh);
      }
    }
  }

  isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0],
        yi = polygon[i][1];
      const xj = polygon[j][0],
        yj = polygon[j][1];

      const intersect =
        yi > point[1] !== yj > point[1] &&
        point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

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

  updateHeightmap(geometry, noise, params) {
    geometry.attributes.position.array.forEach((_, i) => {
      const x = geometry.attributes.position.getX(i);
      const y = geometry.attributes.position.getY(i);

      const mountainNoise =
        noise.noise(
          x * params.mountainFrequency,
          y * params.mountainFrequency
        ) * params.mountainAmplitude;
      const hillNoise =
        noise.noise(x * params.hillFrequency, y * params.hillFrequency) *
        params.hillAmplitude;
      const detailNoise =
        noise.noise(x * params.detailFrequency, y * params.detailFrequency) *
        params.detailAmplitude;

      const terrainHeight = mountainNoise + hillNoise + detailNoise;
      geometry.attributes.position.setZ(i, terrainHeight);

    });

    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
  }
}

export default Map;
