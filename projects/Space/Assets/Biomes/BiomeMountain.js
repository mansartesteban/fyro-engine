import { Color } from "three";
import Biome from "../Biome";

class BiomeMountain extends Biome {
  static frequency = 50;

  influence = 5
  amplitudeModifier = 1
  frequencyModifier = 1
  altitude = 100

  constructor(...args) {
    super(...args);

    this.name = "mountain";
    this.color = new Color(0x8b8b83);
  }
}

export default BiomeMountain;
