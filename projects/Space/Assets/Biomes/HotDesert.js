import { Color } from "three"
import Biome from "../Biome";

class HotDesert extends Biome {
  constructor() {
    super("Désert chaud", new Color(0xedc9af));
    this.conditions.temperature.min = .6;
    this.conditions.temperature.max = .85;
    this.conditions.humidity.min = 0;
    this.conditions.humidity.max = .2;
    this.computeAverageConditions();
  }
}

export default HotDesert;
