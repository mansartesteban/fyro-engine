import TerrainModifier from "./TerrainModifier";

class ErosionModifier extends TerrainModifier {
  options = {
    seed: null,
    frequency: 0,
  };

  constructor(options) {
    super(options);
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  processEach(chunk, index) {
    const x = chunk.geometry.attributes.position.getX(index);
    const z = chunk.geometry.attributes.position.getZ(index);
    const nx = (x + chunk.position.x) / chunk.size;
    const nz = (z + chunk.position.z) / chunk.size;
    let n =
      this.options.seed(
        nx * this.options.frequency,
        nz * this.options.frequency
      ) *
        0.5 +
      0.5;

    chunk.vertices[index].erosion = n;
  }
}

export default ErosionModifier;
