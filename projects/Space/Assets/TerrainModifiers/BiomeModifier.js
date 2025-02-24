import { Color, Float32BufferAttribute } from "three"
import TerrainModifier from "./TerrainModifier";
import { createNoise2D } from "simplex-noise"
import Alea from "alea"
import BiomeMapper from "../BiomeMapping"
import { clamp } from "three/src/math/MathUtils"

class BiomeModifier extends TerrainModifier {
  options = {
    seed: null,
    biomeBlendingSize: 0,
    biomeBlendingStrength: 0,
    disturbFrequency: 0,
    disturbAmplitude: 0
  };

  constructor(options) {
    super(options)
    if (options) {
        this.options = {...this.options, ...options}
    }
  }

  process(chunk) {
    this.determinateBiome(chunk)
    this.computeColors(chunk)
  }

  determinateBiome(chunk) {
    let resolution = 1//chunk.resolution;
    
    let disturbZFrontier = createNoise2D(Alea("disturb-temperature-map"));
    let disturbXFrontier = createNoise2D(Alea("disturb-humidity-map"));

    for (
      let i = 0;
      i < chunk.vertices.length;
      i++
    ) {
    // const x = chunk.geometry.attributes.position.getX(i) / resolution;
    // const z = (chunk.geometry.attributes.position.getZ(i) / resolution);
  
    // let xDisturbed =
    //   (disturbXFrontier(
    //     ((x * resolution) / chunk.size) * this.options.disturbFrequency,
    //     ((z * resolution) / chunk.size) * this.options.disturbFrequency
    //   ) *
    //     this.options.disturbAmplitude *
    //     resolution);
    // let zDisturbed =
    //   (disturbZFrontier(
    //     ((x * resolution) / chunk.size) * this.options.disturbFrequency,
    //     ((z * resolution) / chunk.size) * this.options.disturbFrequency
    //   ) *
    //     this.options.disturbAmplitude *
    //     resolution);

    // let disturbedIndex = this.getVerticeIndex(
    //   clamp(
    //     // Math.round(x + xDisturbed + resolution / 2),
    //     Math.round(x),
    //     0,
    //     resolution
    //   ),
    //   clamp(
    //     // Math.round(z + zDisturbed + resolution / 2),
    //     Math.round(z),
    //     0,
    //     resolution
    //   ),
    //   resolution
    // );
    let params = chunk.vertices[i];

    chunk.vertices[i].biomes = BiomeMapper.findBiome(
      params.temperature,
      params.humidity,
      this.options.biomeBlendingSize,
      this.options.biomeBlendingStrength
    );
  }
  }

  getVerticeIndex = (u, v, widthSegments) => v * (widthSegments + 1) + u;

  computeColors(chunk) {
    let color = new Color(0xffffff)
    let colors = []

    for (
      let i = 0;
      i < chunk.vertices.length;
      i++
    ) {

      color = this.mixMultipleColors(
        chunk.vertices[i].biomes.map(
          (v) => BiomeMapper.getBiome(v.biome).color
        ),
        chunk.vertices[i].biomes.map((v) => v.influence)
      );

      let arr = color.clone().multiplyScalar(chunk.vertices[i].humidity).toArray();
      colors[i * 3] = arr[0];
      colors[i * 3 + 1] = arr[1];
      colors[i * 3 + 2] = arr[2];

    }
    chunk.geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    chunk.geometry.computeVertexNormals();
  }

  mixMultipleColors(colors, weights) {
    if (colors.length !== weights.length) {
      throw new Error("Arrays 'colors' and 'weights' have not the same length");
    }

    // Normalize weights
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = weights.map((weight) => weight / totalWeight);

    // Base color to increment
    const mixedColor = new Color(0, 0, 0);

    // Add colors based on their weight
    colors.forEach((color, i) => {
      const tempColor = new Color(color);
      mixedColor.add(tempColor.multiplyScalar(normalizedWeights[i]));
    });

    return mixedColor;
  }

}

export default BiomeModifier;
