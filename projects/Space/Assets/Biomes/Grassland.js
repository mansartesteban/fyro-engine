import { Color } from "three"
import Biome from "../Biome";

class Grassland extends Biome {
  constructor() {
    super("Forêt tempérée", new Color(0x7cfc00));
    this.conditions.temperature.min = .3;
    this.conditions.temperature.max = .6;
    this.conditions.humidity.min = .2;
    this.conditions.humidity.max = .5;
    this.computeAverageConditions();
  }
}

export default Grassland;
