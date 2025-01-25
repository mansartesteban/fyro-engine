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
    color: new Color(0xff0000),
  },
  {
    name: "forest",
    color: new Color(0x00ff00),
  },
  {
    name: "lake",
    color: new Color(0x0000ff),
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
      this.updateTerrain(geometry, noise, {
        ...params,
        mountainFrequency: value,
      })
    );
    gui.add(params, "mountainAmplitude", 10, 100).onChange((value) =>
      this.updateTerrain(geometry, noise, {
        ...params,
        mountainAmplitude: value,
      })
    );
    gui
      .add(params, "hillFrequency", 0.01, 0.05)
      .onChange((value) =>
        this.updateTerrain(geometry, noise, { ...params, hillFrequency: value })
      );
    gui
      .add(params, "hillAmplitude", 5, 50)
      .onChange((value) =>
        this.updateTerrain(geometry, noise, { ...params, hillAmplitude: value })
      );
    gui.add(params, "detailFrequency", 0.05, 0.2).onChange((value) =>
      this.updateTerrain(geometry, noise, {
        ...params,
        detailFrequency: value,
      })
    );
    gui.add(params, "detailAmplitude", 1, 10).onChange((value) =>
      this.updateTerrain(geometry, noise, {
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
      mountainFrequency: 0.0062,
      mountainAmplitude: 31,
      hillFrequency: 0.024,
      hillAmplitude: 12,
      detailFrequency: 0.15,
      detailAmplitude: 3,
    };

    const noise = new SimplexNoise();

    this.updateTerrain(geometry, noise, params);
    this.addGui(params, geometry, noise);
    this.createBiomes(geometry);

    const material = new MeshStandardMaterial({ vertexColors: true });

    this.addComponent(new MeshRenderComponent({ geometry, material }));
  }

  createBiomes(geometry) {
    if (!geometry) {
      return;
    }

    const biomeCount = 10;
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
    setTimeout(() => {
      this.debug({ biomes: instanciatedBiomes, voronoi });
    }, 100);

    let colors = geometry.attributes.color.array;

    // geometry.attributes.position.array.forEach((_, i) => {
    //   const x = geometry.attributes.position.getX(i);
    //   const y = geometry.attributes.position.getY(i);

    //   // let minDistance = Infinity;
    //   // let closestBiome = {
    //   //   name: "plain",
    //   //   color: 0xff0000,
    //   // };
    //   // instanciatedBiomes.forEach((biomePosition) => {
    //   //   const distance = Math.sqrt(
    //   //     (x - biomePosition.x) ** 2 + (z - biomePosition.z) ** 2
    //   //   );
    //   //   if (distance < minDistance) {
    //   //     minDistance = distance;
    //   //     closestBiome = biomePosition;
    //   //   }
    //   // });
    //   let currentBiome = {
    //     name: "plain",
    //     color: new Color(0xff0000),
    //   };
    //   for (let biomePolygon of biomePolygons) {
    //     if (this.isPointInPolygon([x, y], biomePolygon.polygon)) {
    //       currentBiome = biomePolygon;
    //       let arr = currentBiome.color.toArray()
    //       colors[i*3] = arr[0]
    //       colors[i*3+1] = arr[1]
    //       colors[i*3+2] = arr[2]
    //       break
    //     }
    //   }
    // });
    // geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    // geometry.computeVertexNormals();
    // geometry.attributes.position.needsUpdate = true;
  }

  debug({ biomes, voronoi }) {
    
    // Dessiner les cellules de Voronoï
    for (let i = 0; i < biomes.length; i++) {

      const polygon = biomes[i].polygon; // Obtenir les sommets du polygone

      if (polygon) {
        const points3D = polygon.map(([x, z]) => new Vector3(x, z, 150)); // Z=0 pour un polygone plat
        points3D.push(points3D[0]); // Fermer le polygone

        const cell = new Shape(points3D.map((p) => new Vector2(p.x, p.y)));
        const cellGeometry = new ShapeGeometry(cell);

        const cellMaterial = new MeshBasicMaterial({
          color: biomes[i].color,
          side: DoubleSide,
          opacity: 0.2,
          transparent: true,
        });

        const mesh = new Mesh(cellGeometry, cellMaterial);

        // Géométrie pour les lignes
        const geometry = new BufferGeometry().setFromPoints(points3D);
        const material = new LineBasicMaterial({
          color: 0xffffff,
          opacity: 0.2,
          transparent: true,
        }); // Couleur blanche

        mesh.position.z = 150;
        const line = new LineLoop(geometry, material);
        this.scene.threeScene.add(line);
        this.scene.threeScene.add(mesh);

        let centerGeometry = new SphereGeometry(10);
        let centerMaterial = new MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: .2 });
        let centerMesh = new Mesh(centerGeometry, centerMaterial);

        centerMesh.position.set(biomes[i].position.x, biomes[i].position.y, 150);
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
    return ArrayUtils.pickRandom(biomes);
  }

  updateTerrain(geometry, noise, params) {
    const colors = [];
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

      const z = geometry.attributes.position.getZ(i);

      if (z < -10) {
        colors.push(0, 0.5, 0);
      } else if (z < 10) {
        colors.push(0.5, 0.4, 0.1);
      } else {
        colors.push(0.7, 0.7, 0.7);
      }
    });

    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
  }
}

export default Map;
