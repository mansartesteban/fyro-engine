import ImplementError from "@/Application/Errors/ImplementError";

class TerrainModifier {
  options = {};
  
  constructor(options) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  processEach() {}
  process() {}
  
}

export default TerrainModifier;
