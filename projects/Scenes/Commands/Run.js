import ControlCommand from "@core/Controls/ControlCommand"
import { Vector3 } from "three"

class Run extends ControlCommand {

    executed = false;

    execute() {
        this.entity.speed = 200
        this.executed = true
    }
    
    release() {
        this.entity.speed = 30
        this.executed = false
    }

}

export default Run