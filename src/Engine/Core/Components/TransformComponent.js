import { Vector3 } from "three";
import Component from "@core/Component";

class TransformComponent extends Component {
  position = new Vector3(0, 0, 0);
  rotation = new Vector3(0, 0, 0);
  scale = new Vector3(1, 1, 1);

  update() {}
}

export default TransformComponent;
