import Observer from "../Core/Observer";

class ConsoleStream {
  #logs = [];
  #checkpoints = [];

  observer = new Observer({ log: "log" });

  get logs() {
    return this.#logs;
  }

  info(...str) {
    this.#logs.unshift({
      type: "info",
      content: str.join(" "),
    });
    this.observer.$emit("log");
  }

  success(...str) {
    this.#logs.unshift({
      type: "success",
      content: str.join(" "),
    });
    this.observer.$emit("log");
  }

  log(...str) {
    this.#logs.unshift({
      content: str.join(" "),
    });
    this.observer.$emit("log");
  }

  error(...str) {
    this.#logs.unshift({
      type: "error",
      content: str.join(" "),
    });
    this.observer.$emit("log");
  }

  warn(...args) {
    warning(...args);
  }

  warning(...str) {
    this.#logs.unshift({
      type: "warning",
      content: str.join(" "),
    });
    this.observer.$emit("log");
  }

  checkpoint() {
    this.#checkpoints.push(this.#logs.length);
  }

  clear(count = 1) {
    if (count === true) {
      this.#logs = [];
    } else {
      if (count === -1) {
        let lastCheckpoint = this.#checkpoints[this.#checkpoints.length - 1];
        count = this.#logs.length - lastCheckpoint;
      }
      for (let i = 0; i < count; i++) {
        if (!this.#checkpoints.includes(this.#logs.length)) {
          this.#logs.shift();
        } else break;
      }
    }
    this.observer.$emit("log");
  }
}

export default ConsoleStream;
