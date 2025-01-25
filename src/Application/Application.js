import Engine from "@core/Engine";

class Application {
  static activeProject;
  static engine;

  static start() {
    this.engine = new Engine();

    return new Promise((resolve) => {
      resolve(true);
    });
  }

  static loadProject(project) {
    this.activeProject = new project();
    this.engine.setProject(this.activeProject);
  }
}

export default Application;
