import ImplementError from "@errors/ImplementError"

class ControlCommand {
    entity = null;

    constructor(entity) {
        this.entity = entity
    }

    execute() {
        throw new ImplementError("execute", "ControlCommand")
    }
}

export default ControlCommand;