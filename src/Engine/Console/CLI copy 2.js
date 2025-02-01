/**
 * @version 0.0.1
 * @author Esteban MANSART <esteban.mansart@gmail.com>
 * @description A CLI helper which parse command line options and reorganize the to a readable object with correct values
 */

import Command from "./Command";

class CLI {
  stream;

  #commands = [];

  #options = {
    caseSensitive: false,
  };

  constructor(options) {
    this.#options = { ...this.options, ...options };
  }

  register(command) {
    if (!(command instanceof Command)) {
      throw new Error("Registering command is not an instance of Command");
    }

    this.#commands.push(command);
  }

  process(argv, commands, currentCommand, start = true) {
    if (typeof argv === "string") {
      argv = argv.split(" ");
    }

    if (start) {
      commands = this.#commands;
    }

    if (argv && argv.length) {
      let matchingCommand = commands.find(
        (command) =>
          (this.#options.caseSensitive
            ? command.name
            : command.name.toLowerCase()) ===
          (this.#options.caseSensitive ? argv[0] : argv[0].toLowerCase())
      );

      if (matchingCommand) {
        if (matchingCommand.callback) {
          matchingCommand.callback("test", this.stream);
        }

        if (matchingCommand.node && matchingCommand.node.length) {
          this.process(
            argv.slice(1),
            matchingCommand.node,
            matchingCommand,
            false
          );
        }
      } else {
        this.stream.error("No command found");
      }
    } else {
      if (!start) {
        if (currentCommand.callback) {
          currentCommand.callback("test", this.stream);
        } else {
          currentCommand.incorrectUsage("", this.stream);
        }
      } else {
        this.stream.log("No prompt given");
      }
    }
  }
}

export default CLI;

/*
TODO:
- Les options commençant par un tiret simple ne devraient pas être intereprétées comme des mots mais comme des ensemble de lettre
- Prendre en compte le majuscules/minuscules
- ConsoleStream : si une des fonctions n'existe pas, utiliser log par défaut
- Ajouter l'aide de toutes les commandes enregistrées
- Possibility d'avoir un prompt pour renseigner une valeur en moileu de script
 */
