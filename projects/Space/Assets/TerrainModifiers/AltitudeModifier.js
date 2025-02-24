import TerrainModifier from "./TerrainModifier";

class AltitudeModifier extends TerrainModifier {
  options = {
    seed: null,
    persistence: 0,
    lacunarity: 0,
    scale: 0,
    octaves: 0,
    sharpness: 0,
    erosionWeight: 0
  };

  constructor(options) {
    super(options);
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  processEach(chunk, index) {
    const x = chunk.geometry.attributes.position.getX(index);
    const z = chunk.geometry.attributes.position.getZ(index);
    const nx = (x + chunk.position.x) / chunk.size;
    const nz = (z + chunk.position.z) / chunk.size;

    let noiseHeight = this.fractalNoise(nx, nz, this.options.seed, {
      octaves: this.options.octaves,
      persistence: this.options.persistence,
      lacunarity: this.options.lacunarity,
      scale: this.options.scale,
    });

    let n = 1 - Math.abs(noiseHeight)
    n = n ** this.options.sharpness
    n = n * (1 - chunk.vertices[index].erosion * this.options.erosionWeight)

    chunk.vertices[index].altitude = n;
  }

  fractalNoise(x, y, mapNoise, options = {}) {
    const octaves = options.octaves; // Nombre d'octaves
    const persistence = options.persistence; // Influence des détails (amplitude)
    const lacunarity = options.lacunarity; // Fréquence des détails
    const scale = options.scale; // Échelle globale

    let amplitude = 1;
    let frequency = 1;
    let noiseHeight = 0;

    let noises = [];
    let amplitudes = [];

    // Génération multi-octaves
    for (let octave = 0; octave < octaves; octave++) {
      let ox = x * scale * frequency; //+ seed;
      let oy = y * scale * frequency; //+ seed;

      const noiseValue = this.domainWarp(ox, oy, mapNoise);

      noises.push(noiseValue);
      amplitudes.push(amplitude);

      amplitude *= persistence; // Réduit l'amplitude à chaque octave
      frequency *= lacunarity; // Augmente la fréquence à chaque octave
    }
    noiseHeight = this.weightedAverage(noises, amplitudes);

    return noiseHeight;
  }

  domainWarp(x, y, noiseFunc) {
    let warp = noiseFunc(x * 0.05, y * 0.05);
    return noiseFunc(x + warp, y + warp);
  }

  weightedAverage(values, weights) {
    if (values.length !== weights.length) {
      throw new Error(
        "Les tableaux des valeurs et des poids doivent avoir la même longueur."
      );
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) {
      throw new Error("La somme des poids ne peut pas être nulle.");
    }

    const weightedSum = values.reduce(
      (sum, value, i) => sum + value * weights[i],
      0
    );
    return weightedSum / totalWeight;
  }

}

export default AltitudeModifier;
