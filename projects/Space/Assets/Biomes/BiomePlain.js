import { Color } from "three";
import Biome from "../Biome";

class BiomePlain extends Biome {
  static frequency = 10;

  amplitudeModifier = .33
  frequencyModifier = .8

  constructor(...args) {
    super(...args);
    this.name = "plain";
    this.color = new Color(0xd2b48c);
  }
}

export default BiomePlain;
