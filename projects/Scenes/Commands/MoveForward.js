import ControlCommand from "@core/Controls/ControlCommand"
import { Vector3 } from "three"

class MoveForward extends ControlCommand {

    execute(deltaTime) {
        this.entity.move(new Vector3(0, 0, -this.entity.speed * deltaTime));
    }

}

export default MoveForward