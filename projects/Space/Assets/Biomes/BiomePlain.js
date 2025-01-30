import { Color } from "three";
import Biome from "../Biome";

class BiomePlain extends Biome {
  static frequency = 10;

  amplitudeModifier = .5
  frequencyModifier = 1

  constructor(...args) {
    super(...args);
    this.name = "plain";
    this.color = new Color(0x228b22);
  }
}

export default BiomePlain;
