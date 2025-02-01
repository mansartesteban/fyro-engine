import { Color } from "three";
import Biome from "../Biome";
import { SimplexNoise } from "three/examples/jsm/Addons.js"

class BiomeMountain extends Biome {
  static frequency = 100;

  influence = 5
  amplitudeModifier = 3
  frequencyModifier = 1
  altitude = 100

  constructor(...args) {
    super(...args);

    this.name = "mountain";
    this.color = new Color(0xaaaaaa);
  }

  compute(x, y, z) {
    if (z > (new SimplexNoise().noise(x * 0.02, y * 0.02)) * 20) {
      this.influence = 1
      this.color.setHex(0xffffff);
    } else if (z > 5) {
      this.influence = .2
      this.color.setHex(0xffffff);
    } else {
      this.influence = 1
      this.color.setHex(0x8b8b83)
    }
  }
}

export default BiomeMountain;
