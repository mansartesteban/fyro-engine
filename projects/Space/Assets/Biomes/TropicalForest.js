import { Color } from "three"
import Biome from "../Biome";

class TropicalForest extends Biome {
  constructor() {
    super("Forêt tropicale", new Color(0x006400));
    this.conditions.temperature.min = .6;
    this.conditions.temperature.max = .85;
    this.conditions.humidity.min = .5;
    this.conditions.humidity.max = 1;
    this.computeAverageConditions();
  }
}

export default TropicalForest;
