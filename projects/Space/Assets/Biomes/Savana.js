import { Color } from "three"
import Biome from "../Biome";

class Savana extends Biome {
  constructor() {
    super("Savane", new Color(0xbdb76b));
    this.conditions.temperature.min = .6;
    this.conditions.temperature.max = .85;
    this.conditions.humidity.min = .2;
    this.conditions.humidity.max = .5;
    this.computeAverageConditions();
  }
}

export default Savana;
