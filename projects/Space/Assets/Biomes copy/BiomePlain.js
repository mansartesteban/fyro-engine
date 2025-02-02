import { Color } from "three";
import Biome from "../Biome";

class BiomePlain extends Biome {
  static frequency = 10;

  amplitudeModifier = .5
  frequencyModifier = .5

  constructor(...args) {
    super(...args);
    this.name = "plain";
    this.color = new Color(0xf4a460);
  }
}

export default BiomePlain;
