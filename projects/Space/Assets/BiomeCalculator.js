class BiomeCalculator {
  static findNeighbors(index, biomes, voronoi) {
    let polygon = biomes[index]?.polygon;
    if (!polygon) return []; // Pas de voisins si la cellule est invalide

    const neighbors = new Set();

    // Parcourir toutes les autres cellules
    for (let i = 0; i < voronoi.delaunay.points.length / 2; i++) {
      if (i === index) continue; // Ignore le point lui-même

      const neighborCell = voronoi.cellPolygon(i);
      if (!neighborCell) continue;

      // Vérifie si les deux cellules partagent une arête
      if (this.cellsShareEdge(polygon, neighborCell)) {
        neighbors.add(i);
      }
    }

    return Array.from(neighbors).map(
      (neighbourgIndex) => biomes[neighbourgIndex]
    ); // Retourne les indices des voisins
  }

  static cellsShareEdge(cell1, cell2) {
    for (let i = 0; i < cell1.length; i++) {
      const edge1 = [cell1[i], cell1[(i + 1) % cell1.length]]; // Arête de cell1

      for (let j = 0; j < cell2.length; j++) {
        const edge2 = [cell2[j], cell2[(j + 1) % cell2.length]]; // Arête de cell2

        // Vérifie si les arêtes sont les mêmes (dans les deux sens)
        if (
          (edge1[0][0] === edge2[1][0] &&
            edge1[0][1] === edge2[1][1] &&
            edge1[1][0] === edge2[0][0] &&
            edge1[1][1] === edge2[0][1]) ||
          (edge1[0][0] === edge2[0][0] &&
            edge1[0][1] === edge2[0][1] &&
            edge1[1][0] === edge2[1][0] &&
            edge1[1][1] === edge2[1][1])
        ) {
          return true;
        }
      }
    }
    return false;
  }

  static edgeDistance([x, y], [fromX, fromY], [toX, toY]) {
    // Vecteurs
    const edgeLengthSquared = (toX - fromX) ** 2 + (toY - fromY) ** 2;
    if (edgeLengthSquared === 0)
      return Math.sqrt((x - fromX) ** 2 + (y - fromY) ** 2); // Cas dégénéré

    // Projection du point sur la ligne (clamp entre 0 et 1 pour rester sur le segment)
    const t = Math.max(
      0,
      Math.min(
        1,
        ((x - fromX) * (toX - fromX) + (y - fromY) * (toY - fromY)) /
          edgeLengthSquared
      )
    );

    // Coordonnées du point projeté
    const projX = fromX + t * (toX - fromX);
    const projY = fromY + t * (toY - fromY);

    // Distance entre le point et le point projeté
    return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
  }

  static getEdges(polygon) {
    let edges = [];
    for (let i = 0; i < polygon.length - 1; i++) {
      edges.push([polygon[i], polygon[i + 1]]);
    }
    return edges;
  }

  static areEdgesEqual(edge1, edge2) {
    const [[x1, y1], [x2, y2]] = edge1;
    const [[u1, v1], [u2, v2]] = edge2;

    return (
      (x1 === u1 && y1 === v1 && x2 === u2 && y2 === v2) ||
      (x1 === u2 && y1 === v2 && x2 === u1 && y2 === v1)
    );
  }

  static biomeTransition(values, weights) {
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

  static getNeighborBiomeByEdge(edge, biomes) {
    for (let i = 0; i < biomes.length; i++) {
      if (biomes[i].polygon) {
        let biomeEdges = this.getEdges(biomes[i].polygon);
        for (let j = 0; j < biomeEdges.length; j++) {
          let comparingEdge = biomeEdges[j];

          if (this.areEdgesEqual(comparingEdge, edge)) {
            return biomes[i];
          }
        }
      }
    }
  }

  static findBiome([x, y], biomes) {
    for (let biome of biomes) {
      if (biome.isInBiome([x, y])) {
        return biome;
      }
    }
  }
}

export default BiomeCalculator;
