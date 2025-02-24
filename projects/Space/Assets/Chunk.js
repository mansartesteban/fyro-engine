import { BufferGeometry, Float32BufferAttribute } from "three";

class Chunk {
  vertices = [];
  size;
  resolution;
  geometry;
  position;
  indices = [];

  modifiers = [];

  constructor(position, size, resolution) {
    this.position = position;
    this.size = size
    this.resolution = resolution
  }

  addModifier(instance) {
    this.modifiers.push(instance);
    return this
  }

  process() {
    for (
      let i = 0;
      i < this.vertices.length;
      i++
    ) {
      this.modifiers.forEach((modifier) => {
        modifier.processEach(this, i);
      });
    }
    this.modifiers.forEach((modifier) => {
      modifier.process(this);
    });
  }

  createChunkGeometry() {
    this.geometry = new BufferGeometry();
    const vertices = [];
    this.indices = [];
    const uvs = [];

    for (let x = 0; x <= this.resolution; x++) {
        for (let z = 0; z <= this.resolution; z++) {
        let xPos = (x / this.resolution - 0.5) * this.size;
        let yPos = 0; // Altitude sera ajustée plus tard
        let zPos = (z / this.resolution - 0.5) * this.size;
        let i = z * (this.resolution + 1) + x;

        vertices.push(xPos, yPos, zPos);
        uvs.push(x / this.resolution, z / this.resolution);
        this.vertices[i] = {};
      }
    }

    for (let x = 0; x < this.resolution; x++) {
        for (let z = 0; z < this.resolution ; z++) {
        let i = z * (this.resolution + 1) + x;

        this.indices.push(i, i + 1, i + this.resolution + 1);
        this.indices.push(i + this.resolution + 1, i + 1, i + this.resolution + 2);
      }
    }

    this.geometry.setAttribute(
      "position",
      new Float32BufferAttribute(vertices, 3)
    );
    this.geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    this.geometry.setIndex(this.indices);
    this.geometry.computeVertexNormals();
  }

  create() {}
}

export default Chunk;
