/**
 * @version 0.0.1
 * @author Esteban MANSART <esteban.mansart@gmail.com>
 * @description A CLI helper which parse command line options and reorganize the to a readable object with correct values
 */

import Command from "./Command";

class CLI {
  stream;
  commands = [];

  #options = {
    caseSensitive: false,
  };

  constructor(options) {
    this.#options = { ...this.#options, ...options };
    this.commands.push(
      new Command(
        "help",
        () => {
          this.help(this.commands);
        },
        {
          help: "Display the help of all registered commands",
        }
      )
    );
  }

  register(command) {
    command = Array.isArray(command) ? command : [command];
    command.forEach((c) => this.commands.push(c));
    return this;
  }

  help(commands, lvl = 0) {
    let str = "";

    let maxSize = Math.max(...commands.map((command) => command.name.length));
    commands.forEach((command, index) => {
      if (lvl !== 0) {
        let symbol = index === commands.length - 1 ? "└" : "├";
        str += symbol.padStart(lvl * 2, " ");
      }
      str +=
        command.name +
        "".padStart(maxSize - command.name.length + 2, " ") +
        " | " +
        command.help;

      if (
        command.node &&
        Array.isArray(command.node) &&
        command.node.length > 0
      ) {
        str += "\n" + this.help(command.node, lvl + 1);
      } else {
        command.options?.forEach((option) => {
          str += "\n" + "".padStart((lvl + 1) * 2, " ");
          if (option.name) {
            str += " --" + option.name;
          }
          if (option.shortcut) {
            str += ", -" + option.shortcut;
          }
          if (option.help) {
            str += " " + option.help;
          }
        });
      }

      str += "\n";
    });
    if (lvl === 0) {
      str = str.split("\n");
      str.forEach((s) => {
        this.stream.info(s);
      });
    } else {
      return str;
    }
  }

  process(input) {
    const tokens = input.trim().split(/\s+/);
    let currentCommand = null;
    let args = {};
    let commandChain = this.commands;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.startsWith("--") || token.startsWith("-")) {
        // Gestion des options longues (--option) et courtes (-o)
        const optionName = token;
        const value =
          tokens[i + 1] && !tokens[i + 1].startsWith("-") ? tokens[++i] : true;
        args[optionName] = value;
      } else {
        const foundCommand = commandChain.find((cmd) => cmd.name === token);
        if (foundCommand) {
          currentCommand = foundCommand;
          if (
            Array.isArray(currentCommand.node) &&
            currentCommand.node.length > 0
          ) {
            commandChain = currentCommand.node;
          }
        } else {
          this.stream.error(`Unknown command : ${token}`);
          return;
        }
      }
    }

    if (
      currentCommand &&
      currentCommand.node &&
      typeof currentCommand.node === "function"
    ) {
      let r = currentCommand.node(args, this.stream);
      return Promise.all([r]);
    } else if (currentCommand) {
      this.stream.error(`Invalid usage : ${currentCommand.name}`);
    } else {
      this.stream.error("No command found.");
    }
  }
}

export default CLI;
