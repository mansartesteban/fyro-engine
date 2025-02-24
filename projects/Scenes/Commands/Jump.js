import ControlCommand from "@core/Controls/ControlCommand"
import { Vector3 } from "three"

class Jump extends ControlCommand {

    execute() {
        let physicComponent = this.entity.getComponent("physic")
        if (physicComponent && physicComponent.isOnGround) {
            physicComponent.velocity.y = 2
        }
    }
 
}

export default Jump