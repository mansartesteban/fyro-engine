import { Color } from "three";
import Biome from "../Biome";

class BiomeGrassland extends Biome {
  static frequency = 30;

  amplitudeModifier = .5

  constructor(...args) {
    super(...args);
    this.name = "grassland";
    this.color = new Color(0x7cfc00);
  }
}

export default BiomeGrassland;
