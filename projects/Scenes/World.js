import Scene from "@core/Scene";
import Map from "../Space/Assets/Map3";
import { AmbientLight, PerspectiveCamera, Vector3 } from "three"
import { LottieLoader, OrbitControls } from "three/examples/jsm/Addons.js"
import Controls from "../../src/Engine/Core/Controls/Controls"
import MoveForward from "./Commands/MoveForward"
import MoveBackward from "./Commands/MoveBackward"
import MoveLeft from "./Commands/MoveLeft"
import MoveRight from "./Commands/MoveRight"
import Character from "./Character"
import CameraComponent from "./Components/CameraComponent"
import PointLight from "@/Engine/Assets/Lights/PointLight/Entity"
import Rotate from "./Commands/Rotate"
import Run from "./Commands/Run"
import MoveUp from "./Commands/MoveUp"
import MoveDown from "./Commands/MoveDown"
import WorldManager from "./WorldManager"
import PhysicsComponent from "@/Engine/Core/Components/PhysicsComponent"
import Jump from "./Commands/Jump"

class World extends Scene {
  sunlight;
  ambientLight;
  controls;

  map
  wm;

  player

  setup() {

    let map = new Map();
    this.map = map
    this.map.scene = this
    this.map.generateMap()
    // this.add(map);
    
    this.wm = new WorldManager(this.map)
    

    // this.sunlight = new PointLight(0xffffff, 500000000, 50000000);
    // this.sunlight.transform.position.z = 20000;
    // this.add(this.sunlight);

    let light = new AmbientLight(0xffffff, .2)
    this.threeScene.add(light)

    this.player = new Character(new PhysicsComponent("physic", this.wm));
    this.add(this.player)

    this.player.addComponent(new CameraComponent("fps-camera"))
    
    let altitude = this.wm.getHeight((this.wm.terrain.generator.subdivisions + 1) / 2, (this.wm.terrain.generator.subdivisions + 1) / 2)
    
    this.player.transform.position.copy(new Vector3(0, altitude, 0))
      

    if (false) {

      this.controls = new OrbitControls(this.viewer.cameraManager.activeCamera, this.viewer.node);
      
    } else {
      this.controls = new Controls()
      
      this.controls.registerCommand("KeyW", new MoveForward(this.player), Controls.COMMAND_TYPE.HOLD)
      this.controls.registerCommand("KeyS", new MoveBackward(this.player), Controls.COMMAND_TYPE.HOLD)
      this.controls.registerCommand("KeyA", new MoveLeft(this.player), Controls.COMMAND_TYPE.HOLD)
      this.controls.registerCommand("KeyD", new MoveRight(this.player), Controls.COMMAND_TYPE.HOLD)
      this.controls.registerCommand("KeyE", new MoveUp(this.player), Controls.COMMAND_TYPE.HOLD)
      this.controls.registerCommand("KeyQ", new MoveDown(this.player), Controls.COMMAND_TYPE.HOLD)
      this.controls.registerCommand("Space", new Jump(this.player), Controls.COMMAND_TYPE.HOLD)
      this.controls.registerCommand(Controls.COMMAND_TYPE.MOUSEMOVE, new Rotate(this.player))
      this.controls.registerCommand("ShiftLeft", new Run(this.player), Controls.COMMAND_TYPE.TOGGLE)
      
      queueMicrotask(() => {
        this.viewer.cameraManager.addCamera("player", this.player.getComponent("fps-camera").camera)
        this.viewer.cameraManager.activateCamera("player")
      })
      
    }


    // let world = MapCreator.createMap();
    // this.add(world);
  }

  loop(deltaTime) {
    this.controls.update(deltaTime)
    this.wm.update(this.player.transform.position)
    // this.map.update(tick)
  }
}

export default World;
