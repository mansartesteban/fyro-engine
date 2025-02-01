import UndefinedError from "../../Application/Errors/UndefinedError";

class Command {
  #name = "";

  #node = [];
  #options = [];

  help = "";

  constructor(name, node, options) {
    if (!name) {
      throw new UndefinedError("name");
    }

    if (!node) {
      throw new UndefinedError("node");
    }

    if (options?.help) {
        this.help = options.help
    }

    this.#node = node;

    this.#name = name;
  }

  get name() {
    return this.#name;
  }

  get node() {
    return this.#node;
  }

  get options() {
    return this.#options;
  }

  addOption(name, shortcut, help) {
    this.#options.push({name, shortcut, help});
    return this
  }

  incorrectUsage(args, stream) {
    stream.error(
      "Incorrect usage. Enter ‑‑help or ‑h flags to get help for this command"
    );
  }

  execute(...args) {
    this.#node(...args);
  }
}

export default Command;
