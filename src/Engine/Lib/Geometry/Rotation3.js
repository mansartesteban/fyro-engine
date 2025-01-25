import NumericUtils from "../Numeric";
/**
 * A helper class which angle rotation (i.e. angle) and simplify conversion to radians or degrees
 */
class Rotation3 {
  static 30 = new Rotation3(Math.PI / 6);
  static 45 = new Rotation3(Math.PI / 4);
  static 90 = new Rotation3(Math.PI / 2);
  static 180 = new Rotation3(Math.PI);
  static 360 = new Rotation3(Math.PI * 2);

  #angle;

  /**
   * @param angle The angle of the rotation, can be in radians or degrees depending on the second parameter
   * @param asRadian Indicates if the give 'angle' is in radians or in degrees
   */
  constructor(angle, asRadian) {
    this.#angle = asRadian ? angle : NumericUtils.degreesToRadians(angle);
  }

  /**
   * Returns the current angle in radians
   */
  get angle() {
    return this.#angle;
  }

  /**
   * Sets the current angle to 'angle' value, have to be in radians
   * @param angle The angle of the rotation, can be in radians or degrees depending on the second parameter
   * @param asRadian Indicates if the give 'angle' is in radians or in degrees
   */
  setAngle(angle, asRadian) {
    this.#angle = asRadian ? angle : NumericUtils.degreesToRadians(angle);
  }

  /**
   * Returns the current angle in radians
   */
  get toRadians() {
    return this.angle;
  }

  /**
   * Returns the current angle in degrees
   */
  get toDegrees() {
    return NumericUtils.radiansToDegrees(this.angle);
  }

  /**
   * Adds a rotation to current angle
   * @param rotation The Rotation to add
   * @returns The addition of these two angles
   */
  add(rotation) {
    return new Rotation3(this.angle + rotation.angle, true);
  }

  /**
   * Substracts a rotation to current angle
   * @param rotation The Rotation to substract
   * @returns The substraction of these two angles
   */
  sub(rotation) {
    return new Rotation3(this.angle - rotation.angle, true);
  }

  /**
   * Inverts the angle (multiply by * -1)
   * @returns this Returns this for methods chaining
   */
  invert() {
    this.#angle = -this.angle;
    return this;
  }
}

export default Rotation3;
