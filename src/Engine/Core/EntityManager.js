import Observer from "@core/Observer";
import MeshRenderComponent from "@core/Components/MeshRenderComponent";
import Entity from "@core/Entity.js";
import UndefinedError from "@errors/UndefinedError";

class EntityManager {
  static EVENTS = Object.freeze({
    ENTITY_ADDED: "ENTITY_ADDED",
    ENTITY_DELETED: "ENTITY_DELETED",
  });

  observer = new Observer(EntityManager.EVENTS);

  entities = [];
  scene = null;

  constructor(scene) {
    if (!scene) {
      throw new UndefinedError("scene");
    }
    this.scene = scene;
  }

  delete(entityToDelete) {
    let foundIndex = this.entities.findIndex((entity) => {
      if (typeof entityToDelete === "string") {
        return entity.uuid === entityToDelete;
      } else if (entityToDelete instanceof Entity) {
        return entity === entityToDelete;
      }
      return false;
    });

    if (foundIndex !== -1) {
      let entityFound = this.entities[foundIndex];

      this.observer.$emit(SceneManager.EVENTS.ENTITY_DELETED, entityFound);
      this.scene.threeScene.remove(entityFound.object);
      entityFound.object.remove();
      entityFound.object.clear();

      for (let i = entityFound.components.length - 1; i >= 0; i--) {
        entityFound.components.splice(i, 1);
      }

      delete this.entities[foundIndex];
      this.entities.splice(foundIndex, 1);
    }
  }

  add(entity) {
    let $this = this;

    if (entity.children) {
      entity.children.forEach((child) => $this.add(child));
    }
    this.entities.push(entity);
    this.scene.threeScene.add(entity.object);

    this.observer.$emit(EntityManager.EVENTS.ENTITY_ADDED, entity);
  }

  update(tick) {
    this.entities.forEach((entity) => entity.update(tick));
  }
}

export default EntityManager;
