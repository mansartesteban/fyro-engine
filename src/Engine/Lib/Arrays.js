import NumericUtils from "@lib/Numeric";

class ArrayUtils {
  static findIndexMultiple(array, callbackCondition) {
    let indexes = [];
    array.forEach((v, k) => {
      if (callbackCondition(v)) {
        indexes.push(k);
      }
    });
    return indexes;
  }

  static removeMultiple(array = [], indexes = []) {
    for (let i = indexes.length - 1; i >= 0; i--) {
      array.splice(indexes[i], 1);
    }
  }

  static pickRandom(array = [], count = 1) {
    let ret = [];
    for (let i = 0; i < count; i++) {
      ret.push(array[NumericUtils.random(0, array.length - 1)]);
    }

    return count === 1 ? ret[0] : ret;
  }
}

export default ArrayUtils;
