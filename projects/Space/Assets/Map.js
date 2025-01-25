import Entity from "@core/Entity";
import MapRender from "./MapRender";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Line,
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
import Delaunator from "delaunator";

class Map extends Entity {

  biomes = [
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

  constructor() {
    super();
    this.addComponent(new MapRender());
    this.createMap();
  }

  createMap() {
    const mapWidth = 500;
    const mapHeight = 500;
    const subdivisions = 128;

    setTimeout(() => {
      const debugMaterial = new MeshBasicMaterial({ color: 0xff0000 }); // Rouge
  
      // Géométrie simple (une sphère)
      const debugGeometry = new SphereGeometry(5, 16, 16); // Rayon 0.5, segments 16
      const debugObject = new Mesh(debugGeometry, debugMaterial);
  
      // Placer l'objet à l'origine
      debugObject.position.set(0, 0, 0);
  
      // Ajouter à la scène
      this.scene.threeScene.add(debugObject);

    }, 100)


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

    const noise = new SimplexNoise();
    this.updateTerrain(geometry, noise, params);
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
          Math.random() * geometry.parameters.width - geometry.parameters.width / 2,
          Math.random() * geometry.parameters.height  - geometry.parameters.height / 2
        ),
        ...this.getRandomBiome()
      });
    }

    console.log("created biomes",instanciatedBiomes, instanciatedBiomes.map((b) => [b.position.x, b.position.y]))

    const biomeCenters = instanciatedBiomes.map((b) => [b.position.x, b.position.y])
    const delaunayTriangles = Delaunator.from(biomeCenters)
    
    // setTimeout(() => {

    //   const edges = delaunayTriangles.triangles; // Liste des indices des sommets des triangles
    //   console.log("tirangles", edges)
      
    //   for (let i = 0; i < edges.length; i += 3) {
    //     // Récupère les coordonnées des trois sommets du triangle
    //     const a = biomeCenters[edges[i]];
    //     const b = biomeCenters[edges[i + 1]];
    //     const c = biomeCenters[edges[i + 2]];
        
    //     // Création des lignes pour chaque triangle
    //     const geometry = new BufferGeometry().setFromPoints([
    //       new Vector3(a[0], a[1], 0), // Point A
    //       new Vector3(b[0], b[1], 0), // Point B
    //       new Vector3(c[0], c[1], 0), // Point C
    //       new Vector3(a[0], a[1], 0)  // Retour au Point A
    //     ]);
        
    //     // Matériau des lignes (pour debug, couleur blanche)
    //     const material = new LineBasicMaterial({ color: 0xffffff });
        
    //     // Création d'une ligne à partir de la géométrie
    //     const line = new Line(geometry, material);
    //     line.position.z = 100
    //     this.scene.threeScene.add(line); // Ajout à la scène
    //   }
    // }, 100)

    function circumcenter(a, b, c) {
      const ad = a[0] * a[0] + a[1] * a[1];
      const bd = b[0] * b[0] + b[1] * b[1];
      const cd = c[0] * c[0] + c[1] * c[1];
      const D = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
      return [
          1 / D * (ad * (b[1] - c[1]) + bd * (c[1] - a[1]) + cd * (a[1] - b[1])),
          1 / D * (ad * (c[0] - b[0]) + bd * (a[0] - c[0]) + cd * (b[0] - a[0])),
      ];
  }

  function edgesOfTriangle(t) { return [3 * t, 3 * t + 1, 3 * t + 2]; }

  function pointsOfTriangle(delaunay, t) {
    return edgesOfTriangle(t)
        .map(e => delaunay.triangles[e]);
}


  function triangleOfEdge(e)  { return Math.floor(e / 3); }

  function triangleCenter(points, delaunay, t) {
    const vertices = pointsOfTriangle(delaunay, t).map(p => points[p]);
    return circumcenter(vertices[0], vertices[1], vertices[2]);
}

function forEachVoronoiEdge(points, delaunay, callback) {
  for (let e = 0; e < delaunay.triangles.length; e++) {
      if (e < delaunay.halfedges[e]) {
          const p = triangleCenter(points, delaunay, triangleOfEdge(e));
          const q = triangleCenter(points, delaunay, triangleOfEdge(delaunay.halfedges[e]));
          callback(e, p, q);
      }
  }
}

setTimeout(() => {

  let polygons = []
  let currentPolygon = []
  let startPoint = []

  forEachVoronoiEdge(biomeCenters, delaunayTriangles, (index, a, b) => {
    console.log("a, b", a, b)
    if (startPoint.length === 0) {
      console.log("start point null")
      startPoint = a
      currentPolygon.push(a)
    }
    
    if (b[0] === startPoint[0] && b[1] === startPoint[1]) {
      console.log("b == start point")
      currentPolygon.push(b)
      startPoint = []
      polygons.push(currentPolygon)
      currentPolygon = []
    } else {      
      console.log("just push")
      currentPolygon.push(b)
    }

    const geometry = new BufferGeometry().setFromPoints([
      new Vector3(a[0], a[1], 0), // Point A
      new Vector3(b[0], b[1], 0), // Point B
    ]);
    
    // Matériau des lignes (pour debug, couleur blanche)
    const material = new LineBasicMaterial({ color: 0x111111 + index * 20, transparent: true, opacity: 1 });
    
    // Création d'une ligne à partir de la géométrie
    const line = new Line(geometry, material);
    line.position.z = 100
    this.scene.threeScene.add(line); // Ajout à la scène
  })

  console.log("polygons", polygons)
}, 100)
    // console.log("voronoi", voronoiCenters)
    


      
    setTimeout(() => {
      this.debug({biomes:instanciatedBiomes})
    }, 100)

    // let colors = geometry.attributes.color.array;

    // geometry.attributes.position.array.forEach((_, i) => {
    //   const x = geometry.attributes.position.getX(i);
    //   const y = geometry.attributes.position.getY(i);

    //   for (let biome of instanciatedBiomes) {
    //     if (biome.polygon && this.isPointInPolygon([x, y], biome.polygon)) {
    //       let arr = biome.color.toArray()
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

  debug({biomes}) {

      // Dessiner les cellules de Voronoï
      for (let i = 0; i < biomes.length; i++) {
        if (biomes[i].polygon) {
          //   const points3D = biomes[i].polygon.map(([x, y]) => new Vector3(x, y, 0)); // Z=0 pour un polygone plat
          //   points3D.push(points3D[0]); // Fermer le polygone

          //   const cell = new Shape(points3D.map(p => new Vector2(p.x, p.y)))
          //   const cellGeometry = new ShapeGeometry(cell)

          //   const cellMaterial = new MeshBasicMaterial({
          //     color: biomes[i].color,
          //     side: DoubleSide,
          //     opacity: .1,
          //     transparent: true
          //   })
            
          //   const mesh = new Mesh(cellGeometry, cellMaterial)
    
          //   // Géométrie pour les lignes
          //   const geometry = new BufferGeometry().setFromPoints(points3D);
          //   const material = new LineBasicMaterial({ color: 0xffffff,opacity: .1,
          //     transparent: true }); // Couleur blanche
    
          //   // mesh.position.y = 80
          //   const line = new LineLoop(geometry, material);
          //   line.position.z = 60
          //   mesh.position.z = 50
          //   this.scene.threeScene.add(line); // Ajouter à la scène
          //   this.scene.threeScene.add(mesh); // Ajouter à la scène

          }

          for (let j in biomes[i].polygon) {
            console.log("in for?", biomes[i].polygon, +j + 1, biomes[i].polygon[+j + 1])
            if (biomes[i].polygon[+j+1]) {
            let a = biomes[i].polygon[j]
            let b = biomes[i].polygon[+j+1]

            console.log("a, b", a, b)

            const geometry = new BufferGeometry().setFromPoints([
              new Vector3(a[0], a[1], 0), // Point A
              new Vector3(b[0], b[1], 0), // Point B
            ]);
            
            // Matériau des lignes (pour debug, couleur blanche)
            const material = new LineBasicMaterial({ color: 0xff0000, transparent: false, opacity: .3 });
            
            // Création d'une ligne à partir de la géométrie
            const line = new Line(geometry, material);
            line.position.z = 100
            this.scene.threeScene.add(line); // Ajout à la scène
            }
          }

          let centerGeometry = new SphereGeometry(3)
          let centerMaterial = new MeshBasicMaterial({ color: 0xff00ff})
          let centerMesh = new Mesh(centerGeometry, centerMaterial)
          centerMesh.position.set(biomes[i].position.x, biomes[i].position.y, 40)
          this.scene.threeScene.add(centerMesh)
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
    return ArrayUtils.pickRandom(this.biomes);
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
