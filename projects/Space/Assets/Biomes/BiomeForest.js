import { Color } from "three";
import Biome from "../Biome";

class BiomeForest extends Biome {
  static frequency = 30;

  constructor(...args) {
    super(...args);
    this.name = "forest";
    this.color = new Color(0x228b22);
  }
}

export default BiomeForest;

