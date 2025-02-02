class Biome {
    name = ""
    color = ""
    conditions = {
        temperature: {
            min: 0,
            max: 0
        },
        humidity: {
            min: 0,
            max: 0
        }
    }

    averageConditions = {
        temperature: null,
        humidity: null
    }

    constructor(name, color) {
        this.name = name
        this.color = color
    }

    computeAverageConditions() {
        if (this.averageConditions.temperature === null) {
            this.averageConditions.temperature = (this.conditions.temperature.min + this.conditions.temperature.max) / 2
        }
        if (this.averageConditions.humidity === null) {
            this.averageConditions.humidity = (this.conditions.humidity.min + this.conditions.humidity.max) / 2
        }
    }
}

export default Biome;