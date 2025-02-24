

class Controls {

    static COMMAND_TYPE = {
        HOLD: "HOLD",
        TOGGLE: "TOGGLE",
        ONCE: "ONCE",
        MOUSEMOVE: "MOUSEMOVE"
    }

    stack = []
    commands = []

    pointerLock = null

    constructor() {
        window.addEventListener("keyup", this.onKeyUp.bind(this))
        window.addEventListener("keydown", this.onKeyDown.bind(this))
        window.addEventListener("mousemove", this.onMouseMove.bind(this))
        
        document.onpointerlockchange = (event) => {
            this.pointerLock = document.pointerLockElement
        };

        document.body.addEventListener("click", async (e) => {
            e.stopPropagation()
            if (e.which !== 3) {
                await document.body.requestPointerLock({
                    unadjustedMovement: true,
                });
            
            }
        })
    }

    onMouseMove(e) {
        if (this.pointerLock) {
            let mouseMoveCommands = this.commands.filter(command => command.key === Controls.COMMAND_TYPE.MOUSEMOVE)

            mouseMoveCommands.forEach(command => {
                command.handler.execute(e)
            })
        }
    }

    onKeyUp(e) {
        if (this.stack.includes(e.code)) {
            let foundIndex = this.stack.findIndex(s => s === e.code);
            if (foundIndex > -1) {
                this.stack.splice(foundIndex, 1)
            }
        }

        let toggleCommands = this.commands.filter(command => command.type === Controls.COMMAND_TYPE.TOGGLE && e.code === command.key)
        toggleCommands.forEach(command => {
            if (command.handler.executed) {
                command.handler.release()
            }
        })
    }

    onKeyDown(e) {
        if (!this.stack.includes(e.code)) {
            this.stack.push(e.code)
        }

        let toggleCommands = this.commands.filter(command => command.type === Controls.COMMAND_TYPE.TOGGLE && e.code === command.key)
        toggleCommands.forEach(command => {
            if (!command.handler.executed) {
                command.handler.execute()
            }
        })
    }

    registerCommand(key, handler, type = Controls.COMMAND_TYPE.ONCE) {
        let command = {
            key,
            handler,
            type
        }
        if (this.commands.some(command => command.key === key)) {
            console.warn(`Command conflict detected on key : ${key}`)
        }
        this.commands.push(command)
    }

    update(deltaTime) {
        let holdCommands = this.commands.filter(command => command.type === Controls.COMMAND_TYPE.HOLD)

        holdCommands.forEach(command => {
            if (this.stack.includes(command.key)) {
                command.handler.execute(deltaTime)
            }
        })
    }
}

export default Controls;