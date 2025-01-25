class NumericUtils {
  static num(number = 0, precision = 4) {
    let factor = Math.pow(10, precision);
    let n = precision < 0 ? number : 0.01 / factor + number;
    return Math.round(n * factor) / factor;
  }
  static isBetween(number = 0, min = 0, max = 0, strict = false) {
    return strict
      ? number > min && number < max
      : number >= min && number <= max;
  }
  static random(min = 0, max = 1) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  static mapRange(x = 0, fromMin = 0, fromMax = 0, toMin = 0, toMax = 0) {
    return toMin + ((toMax - toMin) / (fromMax - fromMin)) * (x - fromMin);
  }
  static minMax(x = 0, min = 0, max = 0) {
    return x < min ? min : x > max ? max : x;
  }
  static clamp(num = 0, min = 0, max = 0) {
    return Math.min(Math.max(num, min), max);
  }
  static randomHexadecimal() {
    return Math.floor(Math.random() * 16777215).toString(16);
  }
  static degreesToRadians(degrees = 0) {
    return (degrees * Math.PI) / 180;
  }
  static radiansToDegrees(radians = 0) {
    return radians * (180 / Math.PI);
  }
}

export default NumericUtils;
