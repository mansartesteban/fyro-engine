class Time {
  static OneMilisecond = 1;
  static OneSecond = Time.OneMilisecond * 1000;
  static OneMinute = Time.OneSecond * 60;
  static OneHour = Time.OneMinute * 60;

  static deltaTime = 0;
  static lastUpdate = performance.now();

  static update() {
    let now = performance.now();
    Time.deltaTime = now - Time.lastUpdate;
    this.lastUpdate = now;
  }

  static now() {
    return performance.now();
  }

  static delta(time, lastTime) {
    lastTime = lastTime ?? Time.lastUpdate;
    return Math.abs(lastTime - time);
  }
}

export default Time;
