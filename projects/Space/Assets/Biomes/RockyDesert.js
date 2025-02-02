import { Color } from "three"
import Biome from "../Biome";

class RockyDesert extends Biome {
  constructor() {
    super("Désert rocheux", new Color(0xA9A9A9));
    this.conditions.temperature.min = .45;
    this.conditions.temperature.max = .6;
    this.conditions.humidity.min = 0;
    this.conditions.humidity.max = .2;
    this.computeAverageConditions();
  }
}

export default RockyDesert;
