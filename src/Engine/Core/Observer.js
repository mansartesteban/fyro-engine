class Observer {
  observers;
  events = {};

  constructor(events = {}) {
    this.observers = [];
    this.events = events;
  }

  $on(events, callback) {
    if (typeof events == "string") {
      events = [events];
    }

    events.forEach((event) => {
      this.isValidEvent(event);

      this.observers.push({
        event,
        callback,
      });
    });

    return this;
  }

  unset(observer) {
    this.observers = this.observers.filter(function (item) {
      if (item !== observer) {
        return item;
      }
    });
    return this;
  }

  $emit(event, ...args) {
    let promises = [];

    this.observers
      .filter((observer) => observer.event === event)
      .forEach((observer) => {
        promises.push(Promise.resolve(observer.callback(...args)));
      });

    return Promise.all(promises);
  }

  isValidEvent(event) {
    if (this.events) {
      if (!Object.keys(this.events).includes(event)) {
        throw new Error(`Event '${event}' is not a valid event`);
      }
    }
  }
}

export default Observer;
