import { Color, Float32BufferAttribute } from "three"
import TerrainModifier from "./TerrainModifier";

class HeightModifier extends TerrainModifier {
  options = {
    seed: null,
    maxAltitude: 0,
  };

  constructor(options) {
    super(options)
    if (options) {
        this.options = {...this.options, ...options}
    }
  }

  process(chunk) {
    for (
      let i = 0;
      i < chunk.geometry.attributes.position.array.length / 3;
      i++
    ) {
      chunk.geometry.attributes.position.setY(
        i,
        chunk.vertices[i].altitude * this.options.maxAltitude
      );
    }

    // Recompute normals and indicate to Three to update the mesh
    chunk.geometry.computeVertexNormals();
    chunk.geometry.attributes.position.needsUpdate = true;
  }
}

export default HeightModifier;
