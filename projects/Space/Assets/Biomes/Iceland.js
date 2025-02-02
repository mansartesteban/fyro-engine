import { Color } from "three"
import Biome from "../Biome";

class Iceland extends Biome {
  constructor() {
    super("Glacier", new Color(0xffffff));
    this.conditions.temperature.min = 0;
    this.conditions.temperature.max = .15;
    this.conditions.humidity.min = 0;
    this.conditions.humidity.max = 1;
    this.computeAverageConditions();
  }
}

export default Iceland;
