import { Color } from "three";
import Biome from "../Biome";

class BiomeLake extends Biome {
  static frequency = 5;

  constructor(...args) {
    super(...args);

    this.name = "lake";
    this.color = new Color(0x1e90ff);
  }
}

export default BiomeLake;
