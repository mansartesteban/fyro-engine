class CameraManager {
    #activeCamera = null
    cameras = {}

    constructor(scene, renderer) {
        this.renderer = renderer;
        this.scene = scene;
    }

    get activeCamera() {
        return this.cameras[this.#activeCamera]
    }

    activateCamera(name) {
        this.#activeCamera = name
    }

    addCamera(name, camera) {
        this.cameras[name] = camera
    }
}

export default CameraManager