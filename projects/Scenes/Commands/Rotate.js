import ControlCommand from "@core/Controls/ControlCommand"

class Rotate extends ControlCommand {

    execute(e) {
        let sensitivity = .1
        this.entity.rotate(e, sensitivity);
    }

}

export default Rotate