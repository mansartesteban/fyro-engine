import { Color } from "three"
import Biome from "../Biome";

class TemperedForest extends Biome {
  constructor() {
    super("Forêt tempérée", new Color(0x228b22));
    this.conditions.temperature.min = .3;
    this.conditions.temperature.max = .6;
    this.conditions.humidity.min = .5;
    this.conditions.humidity.max = 1;
    this.computeAverageConditions();
  }
}

export default TemperedForest;
