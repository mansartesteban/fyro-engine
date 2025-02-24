import ColdDesert from "./Biomes/ColdDesert";
import Grassland from "./Biomes/Grassland";
import HotDesert from "./Biomes/HotDesert";
import Iceland from "./Biomes/Iceland";
import Plain from "./Biomes/Plain";
import RockyDesert from "./Biomes/RockyDesert";
import Savana from "./Biomes/Savana";
import Swamp from "./Biomes/Swamp";
import Taiga from "./Biomes/Taiga";
import TemperedForest from "./Biomes/TemperedForest";
import TropicalForest from "./Biomes/TropicalForest";
import Tundra from "./Biomes/Tundra";

const iceland = new Iceland();
const tundra = new Tundra();
const taiga = new Taiga();
const coldDesert = new ColdDesert();
const grassland = new Grassland();
const temperedForest = new TemperedForest();
const rockyDesert = new RockyDesert();
const hotDesert = new HotDesert();
const savana = new Savana();
const tropicalForest = new TropicalForest();
const plain = new Plain();
const swamp = new Swamp();

class BiomeMapper {
  static biomes = {
    iceland,
    tundra,
    taiga,
    coldDesert,
    grassland,
    temperedForest,
    rockyDesert,
    hotDesert,
    savana,
    tropicalForest,
    plain,
    swamp,
  };

  /*
  x : valeur d'entrée.
  k : contrôle la pente de la courbe (plus k est grand, plus la transition est abrupte).
  x0: point d'inflexion (là où la courbe passe par 0.5).
  */
  static sigmoid(x, k = 1, x0 = 0.5) {
    return 1 / (1 + Math.exp(-k * (x - x0)));
  }

  static proximityCoefficient(value, min, max, delta, strength) {
    // S'assurer que min est inférieur à max
    if (min > max) [min, max] = [max, min];

    // À l'intérieur de la borne
    if (value >= min && value <= max) {
      return 1;
    }

    // En dessous de la borne, dans la zone de transition (delta)
    if (value < min && value >= min - delta) {
      // return this.sigmoid((value - (min - delta)) / delta, strength);
      return (value - (min - delta)) / delta;
    }

    // Au-dessus de la borne, dans la zone de transition (delta)
    if (value > max && value <= max + delta) {
      return (max + delta - value) / delta;
    }

    // En dehors du delta : retour à 0
    return 0;
  }

  static getBiome(index) {
    return this.biomes[index];
  }

  static findBiome(
    temperature,
    humidity,
    biomeBlendingSize,
    biomeBlendingStrength
  ) {
    if (humidity < 0 || humidity > 1) {
      throw new Error("Humidity must be contains between 0 and 1.");
    }
    if (temperature < 0 || temperature > 1) {
      throw new Error("Humidity must be contains between 0 and 1.");
    }

    return Object.keys(this.biomes)
      .map((biomeKey, index) => {
        let biome  = this.biomes[biomeKey]
        let temperatureInfluence = this.proximityCoefficient(
          temperature,
          biome.conditions.temperature.min,
          biome.conditions.temperature.max,
          biomeBlendingSize,
          biomeBlendingStrength
        );
        let humidityInfluence = this.proximityCoefficient(
          humidity,
          biome.conditions.humidity.min,
          biome.conditions.humidity.max,
          biomeBlendingSize,
          biomeBlendingStrength
        );
        return {
          biome: biomeKey,
          influence: [humidityInfluence, temperatureInfluence].includes(0)
            ? 0
            : Math.min(temperatureInfluence, humidityInfluence),
        };
      })
      .filter((biome) => biome.influence);
  }
}

export default BiomeMapper;
