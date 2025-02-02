import { Color } from "three"
import Biome from "../Biome";

class ColdDesert extends Biome {
  constructor() {
    super("Désert froid", new Color(0xf0e68c));
    this.conditions.temperature.min = .3;
    this.conditions.temperature.max = .45;
    this.conditions.humidity.min = 0;
    this.conditions.humidity.max = .2;
    this.computeAverageConditions();
  }
}

export default ColdDesert;
