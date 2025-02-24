import ControlCommand from "@core/Controls/ControlCommand"
import { Vector3 } from "three"

class MoveDown extends ControlCommand {

    execute(deltaTime) {
        this.entity.move(new Vector3(0, -this.entity.speed * deltaTime, 0));
    }

}

export default MoveDown