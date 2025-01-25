import Entity from "@core/Entity";
import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
} from "three";
import MeshRenderComponent from "@core/Components/MeshRenderComponent";

class MapCreator {
  static createMap() {
    let geometry = new BufferGeometry();
    let vertices = new Float32Array([
      -1.0,
      -1.0,
      1.0, // v0
      1.0,
      -1.0,
      1.0, // v1
      1.0,
      1.0,
      1.0, // v2

      1.0,
      1.0,
      1.0, // v3
      -1.0,
      1.0,
      1.0, // v4
      -1.0,
      -1.0,
      1.0, // v5
    ]);

    geometry.setAttribute("position", new BufferAttribute(vertices, 3));
    const material = new MeshBasicMaterial({ color: 0xff0000 });

    return new Entity(new MeshRenderComponent({ geometry, material }));
  }
}

export default MapCreator;
