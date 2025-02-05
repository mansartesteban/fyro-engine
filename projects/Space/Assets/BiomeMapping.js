import { clamp } from "three/src/math/MathUtils.js"
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

const map = [
  // Temperature [0.00, 0.05]
  [
    iceland, // Humidity [0.00, 0.05]
    iceland, // Humidity [0.05, 0.10]
    iceland, // Humidity [0.10, 0.15]
    iceland, // Humidity [0.15, 0.20]
    iceland, // Humidity [0.20, 0.25]
    iceland, // Humidity [0.25, 0.30]
    iceland, // Humidity [0.30, 0.35]
    iceland, // Humidity [0.35, 0.40]
    iceland, // Humidity [0.40, 0.45]
    iceland, // Humidity [0.45, 0.50]
    iceland, // Humidity [0.50, 0.55]
    iceland, // Humidity [0.55, 0.60]
    iceland, // Humidity [0.60, 0.65]
    iceland, // Humidity [0.65, 0.70]
    iceland, // Humidity [0.70, 0.75]
    iceland, // Humidity [0.75, 0.80]
    iceland, // Humidity [0.80, 0.85]
    iceland, // Humidity [0.85, 0.90]
    iceland, // Humidity [0.90, 0.95]
    iceland, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.05, 0.10]
  [
    iceland, // Humidity [0.00, 0.05]
    iceland, // Humidity [0.05, 0.10]
    iceland, // Humidity [0.10, 0.15]
    iceland, // Humidity [0.15, 0.20]
    iceland, // Humidity [0.20, 0.25]
    iceland, // Humidity [0.25, 0.30]
    iceland, // Humidity [0.30, 0.35]
    iceland, // Humidity [0.35, 0.40]
    iceland, // Humidity [0.40, 0.45]
    iceland, // Humidity [0.45, 0.50]
    iceland, // Humidity [0.50, 0.55]
    iceland, // Humidity [0.55, 0.60]
    iceland, // Humidity [0.60, 0.65]
    iceland, // Humidity [0.65, 0.70]
    iceland, // Humidity [0.70, 0.75]
    iceland, // Humidity [0.75, 0.80]
    iceland, // Humidity [0.80, 0.85]
    iceland, // Humidity [0.85, 0.90]
    iceland, // Humidity [0.90, 0.95]
    iceland, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.10, 0.15]
  [
    iceland, // Humidity [0.00, 0.05]
    iceland, // Humidity [0.05, 0.10]
    iceland, // Humidity [0.10, 0.15]
    iceland, // Humidity [0.15, 0.20]
    iceland, // Humidity [0.20, 0.25]
    iceland, // Humidity [0.25, 0.30]
    iceland, // Humidity [0.30, 0.35]
    iceland, // Humidity [0.35, 0.40]
    iceland, // Humidity [0.40, 0.45]
    iceland, // Humidity [0.45, 0.50]
    iceland, // Humidity [0.50, 0.55]
    iceland, // Humidity [0.55, 0.60]
    iceland, // Humidity [0.60, 0.65]
    iceland, // Humidity [0.65, 0.70]
    iceland, // Humidity [0.70, 0.75]
    iceland, // Humidity [0.75, 0.80]
    iceland, // Humidity [0.80, 0.85]
    iceland, // Humidity [0.85, 0.90]
    iceland, // Humidity [0.90, 0.95]
    iceland, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.15, 0.20]
  [
    tundra, // Humidity [0.00, 0.05]
    tundra, // Humidity [0.05, 0.10]
    tundra, // Humidity [0.10, 0.15]
    tundra, // Humidity [0.15, 0.20]
    tundra, // Humidity [0.20, 0.25]
    tundra, // Humidity [0.25, 0.30]
    tundra, // Humidity [0.30, 0.35]
    tundra, // Humidity [0.35, 0.40]
    taiga, // Humidity [0.40, 0.45]
    taiga, // Humidity [0.45, 0.50]
    taiga, // Humidity [0.50, 0.55]
    taiga, // Humidity [0.55, 0.60]
    taiga, // Humidity [0.60, 0.65]
    taiga, // Humidity [0.65, 0.70]
    taiga, // Humidity [0.70, 0.75]
    taiga, // Humidity [0.75, 0.80]
    taiga, // Humidity [0.80, 0.85]
    taiga, // Humidity [0.85, 0.90]
    taiga, // Humidity [0.90, 0.95]
    taiga, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.20, 0.25]
  [
    tundra, // Humidity [0.00, 0.05]
    tundra, // Humidity [0.05, 0.10]
    tundra, // Humidity [0.10, 0.15]
    tundra, // Humidity [0.15, 0.20]
    tundra, // Humidity [0.20, 0.25]
    tundra, // Humidity [0.25, 0.30]
    tundra, // Humidity [0.30, 0.35]
    tundra, // Humidity [0.35, 0.40]
    taiga, // Humidity [0.40, 0.45]
    taiga, // Humidity [0.45, 0.50]
    taiga, // Humidity [0.50, 0.55]
    taiga, // Humidity [0.55, 0.60]
    taiga, // Humidity [0.60, 0.65]
    taiga, // Humidity [0.65, 0.70]
    taiga, // Humidity [0.70, 0.75]
    taiga, // Humidity [0.75, 0.80]
    taiga, // Humidity [0.80, 0.85]
    taiga, // Humidity [0.85, 0.90]
    taiga, // Humidity [0.90, 0.95]
    taiga, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.25, 0.30]
  [
    tundra, // Humidity [0.00, 0.05]
    tundra, // Humidity [0.05, 0.10]
    tundra, // Humidity [0.10, 0.15]
    tundra, // Humidity [0.15, 0.20]
    tundra, // Humidity [0.20, 0.25]
    tundra, // Humidity [0.25, 0.30]
    tundra, // Humidity [0.30, 0.35]
    tundra, // Humidity [0.35, 0.40]
    taiga, // Humidity [0.40, 0.45]
    taiga, // Humidity [0.45, 0.50]
    taiga, // Humidity [0.50, 0.55]
    taiga, // Humidity [0.55, 0.60]
    taiga, // Humidity [0.60, 0.65]
    taiga, // Humidity [0.65, 0.70]
    taiga, // Humidity [0.70, 0.75]
    taiga, // Humidity [0.75, 0.80]
    taiga, // Humidity [0.80, 0.85]
    taiga, // Humidity [0.85, 0.90]
    taiga, // Humidity [0.90, 0.95]
    taiga, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.30, 0.35]
  [
    coldDesert, // Humidity [0.00, 0.05]
    coldDesert, // Humidity [0.05, 0.10]
    coldDesert, // Humidity [0.10, 0.15]
    coldDesert, // Humidity [0.15, 0.20]
    grassland, // Humidity [0.20, 0.25]
    grassland, // Humidity [0.25, 0.30]
    grassland, // Humidity [0.30, 0.35]
    grassland, // Humidity [0.35, 0.40]
    grassland, // Humidity [0.40, 0.45]
    grassland, // Humidity [0.45, 0.50]
    temperedForest, // Humidity [0.50, 0.55]
    temperedForest, // Humidity [0.55, 0.60]
    temperedForest, // Humidity [0.60, 0.65]
    temperedForest, // Humidity [0.65, 0.70]
    temperedForest, // Humidity [0.70, 0.75]
    temperedForest, // Humidity [0.75, 0.80]
    temperedForest, // Humidity [0.80, 0.85]
    temperedForest, // Humidity [0.85, 0.90]
    temperedForest, // Humidity [0.90, 0.95]
    temperedForest, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.35, 0.40]
  [
    coldDesert, // Humidity [0.00, 0.05]
    coldDesert, // Humidity [0.05, 0.10]
    coldDesert, // Humidity [0.10, 0.15]
    coldDesert, // Humidity [0.15, 0.20]
    grassland, // Humidity [0.20, 0.25]
    grassland, // Humidity [0.25, 0.30]
    grassland, // Humidity [0.30, 0.35]
    grassland, // Humidity [0.35, 0.40]
    grassland, // Humidity [0.40, 0.45]
    grassland, // Humidity [0.45, 0.50]
    temperedForest, // Humidity [0.50, 0.55]
    temperedForest, // Humidity [0.55, 0.60]
    temperedForest, // Humidity [0.60, 0.65]
    temperedForest, // Humidity [0.65, 0.70]
    temperedForest, // Humidity [0.70, 0.75]
    temperedForest, // Humidity [0.75, 0.80]
    temperedForest, // Humidity [0.80, 0.85]
    temperedForest, // Humidity [0.85, 0.90]
    temperedForest, // Humidity [0.90, 0.95]
    temperedForest, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.40, 0.45]
  [
    coldDesert, // Humidity [0.00, 0.05]
    coldDesert, // Humidity [0.05, 0.10]
    coldDesert, // Humidity [0.10, 0.15]
    coldDesert, // Humidity [0.15, 0.20]
    grassland, // Humidity [0.20, 0.25]
    grassland, // Humidity [0.25, 0.30]
    grassland, // Humidity [0.30, 0.35]
    grassland, // Humidity [0.35, 0.40]
    grassland, // Humidity [0.40, 0.45]
    grassland, // Humidity [0.45, 0.50]
    temperedForest, // Humidity [0.50, 0.55]
    temperedForest, // Humidity [0.55, 0.60]
    temperedForest, // Humidity [0.60, 0.65]
    temperedForest, // Humidity [0.65, 0.70]
    temperedForest, // Humidity [0.70, 0.75]
    temperedForest, // Humidity [0.75, 0.80]
    temperedForest, // Humidity [0.80, 0.85]
    temperedForest, // Humidity [0.85, 0.90]
    temperedForest, // Humidity [0.90, 0.95]
    temperedForest, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.45 0.50]
  [
    rockyDesert, // Humidity [0.00, 0.05]
    rockyDesert, // Humidity [0.05, 0.10]
    rockyDesert, // Humidity [0.10, 0.15]
    rockyDesert, // Humidity [0.15, 0.20]
    grassland, // Humidity [0.20, 0.25]
    grassland, // Humidity [0.25, 0.30]
    grassland, // Humidity [0.30, 0.35]
    grassland, // Humidity [0.35, 0.40]
    grassland, // Humidity [0.40, 0.45]
    grassland, // Humidity [0.45, 0.50]
    temperedForest, // Humidity [0.50, 0.55]
    temperedForest, // Humidity [0.55, 0.60]
    temperedForest, // Humidity [0.60, 0.65]
    temperedForest, // Humidity [0.65, 0.70]
    temperedForest, // Humidity [0.70, 0.75]
    temperedForest, // Humidity [0.75, 0.80]
    temperedForest, // Humidity [0.80, 0.85]
    temperedForest, // Humidity [0.85, 0.90]
    temperedForest, // Humidity [0.90, 0.95]
    temperedForest, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.50, 0.55]
  [
    rockyDesert, // Humidity [0.00, 0.05]
    rockyDesert, // Humidity [0.05, 0.10]
    rockyDesert, // Humidity [0.10, 0.15]
    rockyDesert, // Humidity [0.15, 0.20]
    grassland, // Humidity [0.20, 0.25]
    grassland, // Humidity [0.25, 0.30]
    grassland, // Humidity [0.30, 0.35]
    grassland, // Humidity [0.35, 0.40]
    grassland, // Humidity [0.40, 0.45]
    grassland, // Humidity [0.45, 0.50]
    temperedForest, // Humidity [0.50, 0.55]
    temperedForest, // Humidity [0.55, 0.60]
    temperedForest, // Humidity [0.60, 0.65]
    temperedForest, // Humidity [0.65, 0.70]
    temperedForest, // Humidity [0.70, 0.75]
    temperedForest, // Humidity [0.75, 0.80]
    temperedForest, // Humidity [0.80, 0.85]
    temperedForest, // Humidity [0.85, 0.90]
    temperedForest, // Humidity [0.90, 0.95]
    temperedForest, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.55, 0.60]
  [
    rockyDesert, // Humidity [0.00, 0.05]
    rockyDesert, // Humidity [0.05, 0.10]
    rockyDesert, // Humidity [0.10, 0.15]
    rockyDesert, // Humidity [0.15, 0.20]
    grassland, // Humidity [0.20, 0.25]
    grassland, // Humidity [0.25, 0.30]
    grassland, // Humidity [0.30, 0.35]
    grassland, // Humidity [0.35, 0.40]
    grassland, // Humidity [0.40, 0.45]
    grassland, // Humidity [0.45, 0.50]
    temperedForest, // Humidity [0.50, 0.55]
    temperedForest, // Humidity [0.55, 0.60]
    temperedForest, // Humidity [0.60, 0.65]
    temperedForest, // Humidity [0.65, 0.70]
    temperedForest, // Humidity [0.70, 0.75]
    temperedForest, // Humidity [0.75, 0.80]
    temperedForest, // Humidity [0.80, 0.85]
    temperedForest, // Humidity [0.85, 0.90]
    temperedForest, // Humidity [0.90, 0.95]
    temperedForest, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.60, 0.65]
  [
    hotDesert, // Humidity [0.00, 0.05]
    hotDesert, // Humidity [0.05, 0.10]
    hotDesert, // Humidity [0.10, 0.15]
    hotDesert, // Humidity [0.15, 0.20]
    savana, // Humidity [0.20, 0.25]
    savana, // Humidity [0.25, 0.30]
    savana, // Humidity [0.30, 0.35]
    savana, // Humidity [0.35, 0.40]
    savana, // Humidity [0.40, 0.45]
    savana, // Humidity [0.45, 0.50]
    tropicalForest, // Humidity [0.50, 0.55]
    tropicalForest, // Humidity [0.55, 0.60]
    tropicalForest, // Humidity [0.60, 0.65]
    tropicalForest, // Humidity [0.65, 0.70]
    tropicalForest, // Humidity [0.70, 0.75]
    tropicalForest, // Humidity [0.75, 0.80]
    tropicalForest, // Humidity [0.80, 0.85]
    tropicalForest, // Humidity [0.85, 0.90]
    tropicalForest, // Humidity [0.90, 0.95]
    tropicalForest, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.65, 0.70]
  [
    hotDesert, // Humidity [0.00, 0.05]
    hotDesert, // Humidity [0.05, 0.10]
    hotDesert, // Humidity [0.10, 0.15]
    hotDesert, // Humidity [0.15, 0.20]
    savana, // Humidity [0.20, 0.25]
    savana, // Humidity [0.25, 0.30]
    savana, // Humidity [0.30, 0.35]
    savana, // Humidity [0.35, 0.40]
    savana, // Humidity [0.40, 0.45]
    savana, // Humidity [0.45, 0.50]
    tropicalForest, // Humidity [0.50, 0.55]
    tropicalForest, // Humidity [0.55, 0.60]
    tropicalForest, // Humidity [0.60, 0.65]
    tropicalForest, // Humidity [0.65, 0.70]
    tropicalForest, // Humidity [0.70, 0.75]
    tropicalForest, // Humidity [0.75, 0.80]
    tropicalForest, // Humidity [0.80, 0.85]
    tropicalForest, // Humidity [0.85, 0.90]
    tropicalForest, // Humidity [0.90, 0.95]
    tropicalForest, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.70, 0.75]
  [
    hotDesert, // Humidity [0.00, 0.05]
    hotDesert, // Humidity [0.05, 0.10]
    hotDesert, // Humidity [0.10, 0.15]
    hotDesert, // Humidity [0.15, 0.20]
    savana, // Humidity [0.20, 0.25]
    savana, // Humidity [0.25, 0.30]
    savana, // Humidity [0.30, 0.35]
    savana, // Humidity [0.35, 0.40]
    savana, // Humidity [0.40, 0.45]
    savana, // Humidity [0.45, 0.50]
    tropicalForest, // Humidity [0.50, 0.55]
    tropicalForest, // Humidity [0.55, 0.60]
    tropicalForest, // Humidity [0.60, 0.65]
    tropicalForest, // Humidity [0.65, 0.70]
    tropicalForest, // Humidity [0.70, 0.75]
    tropicalForest, // Humidity [0.75, 0.80]
    tropicalForest, // Humidity [0.80, 0.85]
    tropicalForest, // Humidity [0.85, 0.90]
    tropicalForest, // Humidity [0.90, 0.95]
    tropicalForest, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.75, 0.80]
  [
    hotDesert, // Humidity [0.00, 0.05]
    hotDesert, // Humidity [0.05, 0.10]
    hotDesert, // Humidity [0.10, 0.15]
    hotDesert, // Humidity [0.15, 0.20]
    savana, // Humidity [0.20, 0.25]
    savana, // Humidity [0.25, 0.30]
    savana, // Humidity [0.30, 0.35]
    savana, // Humidity [0.35, 0.40]
    savana, // Humidity [0.40, 0.45]
    savana, // Humidity [0.45, 0.50]
    tropicalForest, // Humidity [0.50, 0.55]
    tropicalForest, // Humidity [0.55, 0.60]
    tropicalForest, // Humidity [0.60, 0.65]
    tropicalForest, // Humidity [0.65, 0.70]
    tropicalForest, // Humidity [0.70, 0.75]
    tropicalForest, // Humidity [0.75, 0.80]
    tropicalForest, // Humidity [0.80, 0.85]
    tropicalForest, // Humidity [0.85, 0.90]
    tropicalForest, // Humidity [0.90, 0.95]
    tropicalForest, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.80, 0.85]
  [
    hotDesert, // Humidity [0.00, 0.05]
    hotDesert, // Humidity [0.05, 0.10]
    hotDesert, // Humidity [0.10, 0.15]
    hotDesert, // Humidity [0.15, 0.20]
    savana, // Humidity [0.20, 0.25]
    savana, // Humidity [0.25, 0.30]
    savana, // Humidity [0.30, 0.35]
    savana, // Humidity [0.35, 0.40]
    savana, // Humidity [0.40, 0.45]
    savana, // Humidity [0.45, 0.50]
    tropicalForest, // Humidity [0.50, 0.55]
    tropicalForest, // Humidity [0.55, 0.60]
    tropicalForest, // Humidity [0.60, 0.65]
    tropicalForest, // Humidity [0.65, 0.70]
    tropicalForest, // Humidity [0.70, 0.75]
    tropicalForest, // Humidity [0.75, 0.80]
    tropicalForest, // Humidity [0.80, 0.85]
    tropicalForest, // Humidity [0.85, 0.90]
    tropicalForest, // Humidity [0.90, 0.95]
    tropicalForest, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.85, 0.90]
  [
    plain, // Humidity [0.00, 0.05]
    plain, // Humidity [0.05, 0.10]
    plain, // Humidity [0.10, 0.15]
    plain, // Humidity [0.15, 0.20]
    plain, // Humidity [0.20, 0.25]
    plain, // Humidity [0.25, 0.30]
    plain, // Humidity [0.30, 0.35]
    plain, // Humidity [0.35, 0.40]
    plain, // Humidity [0.40, 0.45]
    plain, // Humidity [0.45, 0.50]
    plain, // Humidity [0.50, 0.55]
    plain, // Humidity [0.55, 0.60]
    plain, // Humidity [0.60, 0.65]
    plain, // Humidity [0.65, 0.70]
    swamp, // Humidity [0.70, 0.75]
    swamp, // Humidity [0.75, 0.80]
    swamp, // Humidity [0.80, 0.85]
    swamp, // Humidity [0.85, 0.90]
    swamp, // Humidity [0.90, 0.95]
    swamp, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.90, 0.95]
  [
    plain, // Humidity [0.00, 0.05]
    plain, // Humidity [0.05, 0.10]
    plain, // Humidity [0.10, 0.15]
    plain, // Humidity [0.15, 0.20]
    plain, // Humidity [0.20, 0.25]
    plain, // Humidity [0.25, 0.30]
    plain, // Humidity [0.30, 0.35]
    plain, // Humidity [0.35, 0.40]
    plain, // Humidity [0.40, 0.45]
    plain, // Humidity [0.45, 0.50]
    plain, // Humidity [0.50, 0.55]
    plain, // Humidity [0.55, 0.60]
    plain, // Humidity [0.60, 0.65]
    plain, // Humidity [0.65, 0.70]
    swamp, // Humidity [0.70, 0.75]
    swamp, // Humidity [0.75, 0.80]
    swamp, // Humidity [0.80, 0.85]
    swamp, // Humidity [0.85, 0.90]
    swamp, // Humidity [0.90, 0.95]
    swamp, // Humidity [0.95, 1.00]
  ],
  // Temperature [0.95, 1.00]
  [
    plain, // Humidity [0.00, 0.05]
    plain, // Humidity [0.05, 0.10]
    plain, // Humidity [0.10, 0.15]
    plain, // Humidity [0.15, 0.20]
    plain, // Humidity [0.20, 0.25]
    plain, // Humidity [0.25, 0.30]
    plain, // Humidity [0.30, 0.35]
    plain, // Humidity [0.35, 0.40]
    plain, // Humidity [0.40, 0.45]
    plain, // Humidity [0.45, 0.50]
    plain, // Humidity [0.50, 0.55]
    plain, // Humidity [0.55, 0.60]
    plain, // Humidity [0.60, 0.65]
    plain, // Humidity [0.65, 0.70]
    swamp, // Humidity [0.70, 0.75]
    swamp, // Humidity [0.75, 0.80]
    swamp, // Humidity [0.80, 0.85]
    swamp, // Humidity [0.85, 0.90]
    swamp, // Humidity [0.90, 0.95]
    swamp, // Humidity [0.95, 1.00]
  ],
];

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
      return (value - (min - delta)) / delta
    }

    // Au-dessus de la borne, dans la zone de transition (delta)
    if (value > max && value <= max + delta) {
      return (max + delta - value) / delta;
    }

    // En dehors du delta : retour à 0
    return 0;
  }

  static getBiome(temperature, humidity, biomeBlendingSize, biomeBlendingStrength) {
    if (humidity < 0 || humidity > 1) {
      throw new Error("Humidity must be contains between 0 and 1.");
    }
    if (temperature < 0 || temperature > 1) {
      throw new Error("Humidity must be contains between 0 and 1.");
    }

    return Object.values(this.biomes)
      .map((biome) => {
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
          biome,
          influence: [humidityInfluence, temperatureInfluence].includes(0) ? 0 : Math.min(temperatureInfluence, humidityInfluence),
        };
      })
      .filter((biome) => biome.influence);
  }

  // Biomes as a matrix
  // static getBiome(temperature, humidity) {
  //   if (humidity < 0 || humidity > 1) {
  //     throw new Error("Humidity must be contains between 0 and 1.");
  //   }
  //   if (temperature < 0 || temperature > 1) {
  //     throw new Error("Humidity must be contains between 0 and 1.");
  //   }

  //   let humidityIndex = Math.floor(humidity / 0.05);
  //   humidityIndex = humidityIndex === 20 ? 19 : humidityIndex;
  //   let temperatureIndex = Math.floor(temperature / 0.05);
  //   temperatureIndex = temperatureIndex === 20 ? 19 : temperatureIndex;

  //   return map[temperatureIndex][humidityIndex];
  // }
}

export default BiomeMapper;
