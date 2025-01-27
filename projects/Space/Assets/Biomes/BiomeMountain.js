import { Color } from "three";
import Biome from "../Biome";

class BiomeMountain extends Biome {
  static frequency = 50;

  influence = 2
  amplitudeModifier = 1.2
  frequencyModifier = .75
  altitude = 20

  constructor(...args) {
    super(...args);

    this.name = "mountain";
    this.color = new Color(0x777777);
  }
}

export default BiomeMountain;
