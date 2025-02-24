import ControlCommand from "@core/Controls/ControlCommand"
import { Vector3 } from "three"

class MoveRight extends ControlCommand {

    execute(deltaTime) {
        this.entity.move(new Vector3(this.entity.speed * deltaTime, 0, 0));
    }

}

export default MoveRight