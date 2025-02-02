import { Color } from "three"
import Biome from "../Biome";

class Swamp extends Biome {
  constructor() {
    super("Marais", new Color(0x654321));
    this.conditions.temperature.min = .85;
    this.conditions.temperature.max = 1;
    this.conditions.humidity.min = .7;
    this.conditions.humidity.max = 1;
    this.computeAverageConditions()
  }
}

export default Swamp;
