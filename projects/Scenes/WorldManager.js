import { Vector3 } from "three"

class WorldManager {
    terrain;

    constructor(terrain) {
        this.terrain = terrain;
    }

     getInterpolatedHeight(x, z, gridSize, worldSize, heightMap) {
        return 0
        const halfWorldSize = worldSize / 2;
        const cellSize = worldSize / (gridSize - 1); // Taille d'une cellule entre deux sommets
    
        // Trouver les indices des sommets entourant le point (x, z)
        let col = (x + halfWorldSize) / cellSize;
        let row = (z + halfWorldSize) / cellSize;
    
        const x0 = Math.floor(col);
        const x1 = Math.min(x0 + 1, gridSize - 1);
        const z0 = Math.floor(row);
        const z1 = Math.min(z0 + 1, gridSize - 1);

        // Vérification pour éviter les erreurs hors limites
        if (x0 < 0 || x1 >= gridSize || z0 < 0 || z1 >= gridSize) {
            return 0; // Valeur par défaut si en dehors du terrain
        }
    
        // Calcul des poids pour l'interpolation bilinéaire
        const sx = col - x0;
        const sz = row - z0;

        // Récupération des hauteurs des 4 sommets de la cellule dans le buffer 1D
        const index00 = (z0 * gridSize + x0) * 3 + 2; // Z
        const index10 = (z0 * gridSize + x1) * 3 + 2; // Z
        const index01 = (z1 * gridSize + x0) * 3 + 2; // Z
        const index11 = (z1 * gridSize + x1) * 3 + 2; // Z

        const h00 = heightMap[index00] || 0;
        const h10 = heightMap[index10] || 0;
        const h01 = heightMap[index01] || 0;
        const h11 = heightMap[index11] || 0;

        // Interpolation bilinéaire
        const h0 = h00 * (1 - sx) + h10 * sx;
        const h1 = h01 * (1 - sx) + h11 * sx;
        return h0 * (1 - sz) + h1 * sz;
    }
    

    getHeight(x, y) {
        // let altitude = this.getInterpolatedHeight(
        //     x,
        //     y,
        //     this.terrain.generator.subdivisions + 1,
        //     this.terrain.generator.terrainSize,
        //     this.terrain.getComponent("terrain").geometry.attributes.position.array
        //   );
        // return altitude
        return 0
    }

    getIndex(x, y, gridSize = this.terrain.generator.subdivisions + 1, worldSize = this.terrain.generator.terrainSize) {
        const halfWorldSize = worldSize / 2;
        const cellSize = worldSize / (gridSize - 1); // Distance entre deux points de la grille
    
        // Convertit la position du monde en index de grille
        const col = Math.round((x + halfWorldSize) / cellSize);
        const row = Math.round((y + halfWorldSize) / cellSize);
    
        // Vérifie si les coordonnées sont hors de la grille
        if (col < 0 || col >= gridSize || row < 0 || row >= gridSize) {
            return -1; // Retourne -1 si en dehors des limites
        }
    
        // Calcul de l'index 1D pour un tableau stockant [x, y, z, x, y, z, ...]
        return (row * gridSize + col) ; // Multiplie par 3 pour accéder au X dans le buffer 1D
    }

    update(position) {
        this.terrain.generator.update(position)
    }
    
}

export default WorldManager