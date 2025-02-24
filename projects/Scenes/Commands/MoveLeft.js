import ControlCommand from "@core/Controls/ControlCommand"
import { Vector3 } from "three"

class MoveLeft extends ControlCommand {

    execute(deltaTime) {
        this.entity.move(new Vector3(-this.entity.speed * deltaTime, 0, 0));
    }

}

export default MoveLeft