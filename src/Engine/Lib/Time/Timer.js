import Time from "@lib/Time/Time";

class Timer {
  #startTime;
  #time;

  executionStack = [];

  constructor() {
    this.#startTime = performance.now();
    this.#time = this.#startTime;
  }

  get delta() {
    return Time.delta(this.#startTime, performance.now());
  }

  reset() {
    this.#startTime = performance.now();
    this.#time = this.#startTime;
  }

  executeAfter(callback, delay) {
    this.executionStack.push({
      delay,
      repeat: false,
      callback,
      lastCall: this.#time,
    });
  }

  executeEach(delay, callback) {
    this.executionStack.push({
      delay,
      repeat: true,
      callback,
      lastCall: this.#time,
    });
  }

  watchCallbacks() {
    let itemsToDelete = [];
    this.executionStack.forEach((item, index) => {
      if (!item.repeat) {
        if (this.delta >= item.delay) {
          item.callback();
        }
        itemsToDelete.push(index);
      } else {
        if (Time.delta(this.#time, item.lastCall) >= item.delay) {
          item.callback();
          item.lastCall = this.#time;
        }
      }
    });

    itemsToDelete.forEach((_, index) => this.executionStack.splice(index, 1));
  }

  update() {
    this.#time = performance.now();
    this.watchCallbacks();
  }
}

export default Timer;
