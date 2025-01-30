import { Color } from "three";
import Biome from "../Biome";

class BiomeLake extends Biome {
  static frequency = 10;

  influence = 5
  amplitudeModifier = .001
  frequencyModifier = 1
  altitude = 1

  constructor(...args) {
    super(...args);

    this.name = "lake";
    this.color = new Color(0x1e90ff);
  }
}

export default BiomeLake;
