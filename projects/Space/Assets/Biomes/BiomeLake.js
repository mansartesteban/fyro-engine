import { Color } from "three";
import Biome from "../Biome";

class BiomeLake extends Biome {
  static frequency = 10;

  influence = 20
  amplitudeModifier = .001
  frequencyModifier = 0.01
  altitude = -10

  constructor(...args) {
    super(...args);

    this.name = "lake";
    this.color = new Color(0x1e90ff);
  }
}

export default BiomeLake;
