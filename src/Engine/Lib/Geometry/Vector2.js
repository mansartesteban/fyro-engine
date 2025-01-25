import NumericUtils from "@lib/Numeric";
import Rotation from "@lib/Geometry/Rotation";

class Vector2 {
  static X = new Vector2(1, 0);
  static Y = new Vector2(0, 1);
  static O = new Vector2(0, 0);
  static ONE = new Vector2(1, 1);

  #x = 0;
  #y = 0;

  constructor(x = 0, y = 0) {
    this.#x = x;
    this.#y = y;
  }

  /* ========== Getters ========== */

  /**
   * Returns the x coordinate of this vector
   */
  get x() {
    return this.#x;
  }

  /**
   * Returns the y coordinate of this vector
   */
  get y() {
    return this.#y;
  }

  /**
   * Returns the length (or magnitude) of this vector
   */
  get length() {
    return Math.sqrt(this.squid);
  }

  /**
   * Returns the squared Euclidian distance of this vector
   */
  get squid() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Returns a normalized copy of this vector (a vector with the same direction with a magnitude/length of 1 unit)
   */
  get normalized() {
    if (this.length === 0) {
      return Vector2.O;
    }
    return this.copy().divide(this.length);
  }

  /**
   * Returns the rotation of this vector (i.e. from origin to this vector, which value is the angle (in radian) between by X axis and this vector)
   * Refer to Rotation doc for more information
   */
  get rotation() {
    return new Rotation(Math.atan2(this.y, this.x), true);
  }

  /* ========== Setters ========== */

  /**
   * Defines the x coordinate of this vector
   */
  set x(x) {
    this.#x = x;
  }

  /**
   * Defines the y coordinate of this vector
   */
  set y(y) {
    this.#y = y;
  }

  /* ========== Modifiers ========== */

  /* ===== Basic operations ===== */

  /**
   * Computes an addition between coordinates of this vector and a number or another vector.
   * If value is a number, adds value to x and y coordinates
   * If value is a vector, adds value.x to x coordinates and value.y to y coordinates
   * @param v Can be a vector or a number
   * @returns this Returns this for methods chaining
   */
  add(value) {
    if (value instanceof Vector2) {
      this.x += value.x;
      this.y += value.y;
    } else if (typeof value === "number") {
      this.x += value;
      this.y += value;
    } else {
      throw (
        "Unable to compute a addition on the type '" +
        typeof value +
        "'. It should be a number or a Vector2"
      );
    }
    return this;
  }

  /**
   * Computes a substraction between coordinates of this vector and a number or another vector.
   * If value is a number, substracts value to x and y coordinates
   * If value is a vector, substracts value.x to x coordinates and value.y to y coordinates
   * @param v Can be a vector or a number
   * @returns this Returns this for methods chaining
   */
  sub(value) {
    if (value instanceof Vector2) {
      this.x -= value.x;
      this.y -= value.y;
    } else if (typeof value === "number") {
      this.x -= value;
      this.y -= value;
    } else {
      throw (
        "Unable to compute a subsraction on the type '" +
        typeof value +
        "'. It should be a number or a Vector2"
      );
    }
    return this;
  }

  /**
   * Computes a division between coordinates of this vector and a number or another vector.
   * If value is a number, divides value to x and y coordinates
   * If value is a vector, divides value.x to x coordinates and value.y to y coordinates
   * @param v Can be a vector or a number
   * @returns this Returns this for methods chaining
   */
  divide(value) {
    if (value instanceof Vector2) {
      this.x /= value.x;
      this.y /= value.y;
    } else if (typeof value === "number") {
      this.x /= value;
      this.y /= value;
    } else {
      throw (
        "Unable to compute a division on the type '" +
        typeof value +
        "'. It should be a number or a Vector2"
      );
    }
    return this;
  }

  /**
   * Computes a multiplication between coordinates of this vector and a number or another vector.
   * If value is a number, multiplies value to x and y coordinates
   * If value is a vector, multiplies value.x to x coordinates and value.y to y coordinates
   * @param v Can be a vector or a number
   * @returns this Returns this for methods chaining
   */
  multiply(value) {
    if (value instanceof Vector2) {
      this.x *= value.x;
      this.y *= value.y;
    } else if (typeof value === "number") {
      this.x *= value;
      this.y *= value;
    } else {
      throw (
        "Unable to compute a multiplication on the type '" +
        typeof value +
        "'. It should be a number or a Vector2"
      );
    }
    return this;
  }

  /* ===== Complex operations ===== */

  /**
   * Clamps the magnitude/length of this vector to a maximum.
   * If current length of this vector is smaller than length parameter, the vector remains the same
   * If current length of this vector is greater than length paramter, the vector is limited to this value
   * @param length A maximum magnitude/length that this vector can overtake
   * @returns this Returns this for methods chaining
   */
  clampLength(length) {
    if (length === 0) {
      this.set(Vector2.O);
    }

    this.set(this.normalized.multiply(Math.min(this.length, length)));

    return this;
  }

  /**
   * Normalizes the vector. It means that the vector will have the same direction but with a magnitude/length of 1 unit
   * @returns this Returns this for methods chaining
   */
  normalize() {
    let normalized = this.normalized;
    this.x = normalized.x;
    this.y = normalized.y;
    return this;
  }

  /**
   * Interpolates (linearly) this vector to an other vector. Calculates a point between those two vectors at weight position
   * @param target The other vector to interpolate with
   * @param weight The weight of the second vector in the computation. For exemple :
   * 0 => returns the current vector,
   * 1 => returns the target vector,
   * 0.33 => returns the position of a new vector at 33% between this vector and the target
   * @returns this Returns this for methods chaining
   */
  lerp(target, weight) {
    weight = NumericUtils.clamp(weight, 0, 1);
    this.x = (1 - weight) * this.x + weight * target.x;
    this.y = (1 - weight) * this.y + weight * target.y;
    return this;
  }

  /**
   * Inverts the current vector into the opposite direction
   * @returns this Returns this for methods chaining
   */
  invert() {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }

  /**
   * Rotates the current vector by an angle (given as Rotation object).
   * Refer to Rotation doc for more information
   * @param angle A Rotation object to simplify angle handling
   * @returns this Returns this for methods chaining
   */
  rotate(angle) {
    let x =
      Math.cos(angle.toRadians) * this.x - Math.sin(angle.toRadians) * this.y;
    let y =
      Math.sin(angle.toRadians) * this.x + Math.cos(angle.toRadians) * this.y;
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Returns the dot product of this vector and another
   * @param v The other vector to compute with
   * @returns number The result of the dot product between those two vectors
   */
  dot(v) {
    if (!(v instanceof Vector2))
      throw "Unable to compute a dot product on non Vector2 object";
    return this.x * v.x + this.y * v.y;
  }

  /* ========== Miscellaneous ========== */

  /* ===== Assigning ===== */

  /**
   * Returns a copy of this vector
   * @returns Vector2
   */
  copy() {
    return new Vector2(this.x, this.y);
  }

  /**
   * Copies the coordinates of a given vector to this vector
   * @param v The vector to be copied
   * @returns this Returns this for methods chaining
   */
  set(v) {
    if (v) {
      this.x = v.x;
      this.y = v.y;
    }
    return this;
  }

  /* ========== Static methods ========== */

  /**
   * Returns an object with "to" property which is a function that takes as parameters a vector and returns a vector.
   * The usefulness of these function is to return a directional vector between two vectors as so :
   * Vector2.from(origin).to(target);
   * @param origin
   * @returns { to: (target: Vector2) => Vector2; }
   */
  static from(origin) {
    return {
      to: (targe) => target.copy().sub(origin),
    };
  }
}

export default Vector2;
