import { Color } from "three"
import Biome from "../Biome";

class Plain extends Biome {
  constructor() {
    super("Plaine", new Color(0xD2B48C));
    this.conditions.temperature.min = .85;
    this.conditions.temperature.max = 1;
    this.conditions.humidity.min = 0;
    this.conditions.humidity.max = .7;
    this.computeAverageConditions()
  }
}

export default Plain;
