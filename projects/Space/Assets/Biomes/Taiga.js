import { Color } from "three"
import Biome from "../Biome";

class Taiga extends Biome {
  constructor() {
    super("Taïga", new Color(0x556b2f));
    this.conditions.temperature.min = .15;
    this.conditions.temperature.max = .30;
    this.conditions.humidity.min = .4;
    this.conditions.humidity.max = 1;
    this.computeAverageConditions();
  }
}

export default Taiga;
