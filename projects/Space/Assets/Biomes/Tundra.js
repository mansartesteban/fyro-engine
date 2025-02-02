import { Color } from "three"
import Biome from "../Biome";

class Tundra extends Biome {
  constructor() {
    super("Toundra", new Color(0xc0c0c0));
    this.conditions.temperature.min = .15;
    this.conditions.temperature.max = .3;
    this.conditions.humidity.min = 0;
    this.conditions.humidity.max = .4;
    this.computeAverageConditions();
  }
}

export default Tundra;
