import { Vector2 } from "three";

class Biome {
  static frequency = 1;

  name;
  color;
  amplitudeModifier = 1;
  frequencyModifier = 1;
  influence = 1;
  altitude = 1;

  #position;
  polygon = null;
  neighbors = [];
  indexInVoronoi;

  constructor(position = new Vector2(), indexInVoronoi = 0) {
    this.#position = position;
    this.indexInVoronoi = indexInVoronoi;
  }

  get position() {
    return this.#position;
  }

  set position(position) {
    if (position instanceof Vector2) {
      this.#position = position;
    }
  }

  isInBiome([px, py]) {
    let inside = false;
    for (
      let i = 0, j = this.polygon.length - 1;
      i < this.polygon.length;
      j = i++
    ) {
      const xi = this.polygon[i][0],
        yi = this.polygon[i][1];
      const xj = this.polygon[j][0],
        yj = this.polygon[j][1];

      const intersect =
        yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}

export default Biome;
