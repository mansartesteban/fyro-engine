import ConsoleStream from "./ConsoleStream";
import CLI from "./CLI"

class Console {
  #opened = false;

  #dom;
  #historyDom;
  #inputDom;

  #history = [];
  #historyIndex = -1;

  #commands = [];
  #stream = new ConsoleStream();
  #cli = new CLI()

  constructor() {
    this.#cli.stream = this.#stream
    this.make();
  }

  get opened() {
    return this.#opened;
  }

  get focused() {
    return document.activeElement === this.#inputDom;
  }

  set opened(state) {
    if (state !== undefined && state !== null) {
      this.toggle(state);
    }
  }

  register(command) {
    this.#cli.register(command)
    return this
  }

  unregister(command) {
    let foundIndex = this.#commands.findIndex(
      (cmd) => cmd.callback === command
    );
    if (foundIndex > -1) {
      this.#commands.splice(foundIndex, 1);
    }
  }

  toggle(state) {
    if (state === undefined) {
      state = !state;
    }

    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.#opened = true;
    this.#inputDom.value = "";
    this.#dom.classList.toggle("opened", true);
    this.#inputDom.focus();
  }

  close() {
    this.#opened = false;
    this.#dom.classList.toggle("opened", false);
    this.#inputDom.value = "";
  }

  execute(args) {
    if (args !== "") {

      this.#stream.log("> _ " + args);
      this.#stream.checkpoint();


      let promise = Promise.all([this.#cli.process(args)])

      promise.then(() => {
        this.#history.unshift(args);
        this.#historyIndex = -1;
        this.#inputDom.focus();
      });
    }
  }

  refreshLogs() {
    let that = this;
    that.#historyDom.innerHTML = "";
    this.#stream.logs
      .slice(0, 15)
      .reverse()
      .forEach((log) => {
        let div = document.createElement("div");
        div.classList.toggle(log.type, true);
        div.classList.toggle("log-line", true);
        div.innerText = log.content;
        that.#historyDom.appendChild(div);
      });
  }

  make(mountOn = document.getElementById("app")) {
    let div = document.createElement("div");
    div.setAttribute("id", "debug-console");

    div.classList.toggle("opened", this.opened);

    this.#historyDom = document.createElement("div");
    this.#historyDom.classList.add("history");
    div.appendChild(this.#historyDom);

    this.refreshLogs();
    this.#stream.observer.$on("log", () => this.refreshLogs());

    this.#inputDom = document.createElement("input");
    this.#inputDom.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.execute(e.target.value);
        this.#inputDom.value = "";
      } else if (e.code === "ArrowUp") {
        this.#historyIndex++;
        if (this.#historyIndex > this.#history.length - 1) {
          this.#historyIndex = this.#history.length - 1;
        }
        let lineExists = this.#history[this.#historyIndex];
        this.#inputDom.value = lineExists || "";
        this.#inputDom.blur();
        this.#inputDom.focus();
        e.preventDefault();
      } else if (e.code === "ArrowDown") {
        this.#historyIndex--;
        if (this.#historyIndex < -1) {
          this.#historyIndex = -1;
        }
        let lineExists = this.#history[this.#historyIndex];
        this.#inputDom.value = lineExists || "";
        this.#inputDom.blur();
        this.#inputDom.focus();
        e.preventDefault();
      } else if (e.key === "l" && e.ctrlKey === true) {
        e.preventDefault();
        this.#stream.clear(true);
      }
    });

    let inputContainer = document.createElement("div");
    inputContainer.classList.add("input-container");
    inputContainer.appendChild(this.#inputDom);
    div.appendChild(inputContainer);

    this.#dom = div;
    mountOn.appendChild(div);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.toggle();
      }
    });
  }
}

export default new Console();

/*
TODO
- Les options commençant par un tiret simple ne devraient pas être intereprétées comme des mots mais comme des ensemble de lettre
- Prendre en compte le majuscules/minuscules
- this.stream : si une des fonctions n'existe pas, utiliser log par défaut
- Possibility d'avoir un prompt pour renseigner une valeur en moileu de script
- Ajouter en paramètre le niveau de verbosité. Lorsque l'on executera la fonction, un paramètre sera envoye pour indiquer le niveau de verbosité
*/