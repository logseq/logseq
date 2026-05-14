goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.collections.maps");
  goog.module.declareLegacyNamespace();
  class MapLike {
    constructor() {
      this.size;
    }
    set(key, val) {
    }
    get(key) {
    }
    keys() {
    }
    values() {
    }
    has(key) {
    }
  }
  exports.MapLike = MapLike;
  function setAll(map, entries) {
    if (!entries) {
      return;
    }
    for (const [k, v] of entries) {
      map.set(k, v);
    }
  }
  exports.setAll = setAll;
  function hasValue(map, val, valueEqualityFn = defaultEqualityFn) {
    for (const v of map.values()) {
      if (valueEqualityFn(v, val)) {
        return true;
      }
    }
    return false;
  }
  exports.hasValue = hasValue;
  const defaultEqualityFn = (a, b) => a === b;
  function equals(map, otherMap, valueEqualityFn = defaultEqualityFn) {
    if (map === otherMap) {
      return true;
    }
    if (map.size !== otherMap.size) {
      return false;
    }
    for (const key of map.keys()) {
      if (!otherMap.has(key)) {
        return false;
      }
      if (!valueEqualityFn(map.get(key), otherMap.get(key))) {
        return false;
      }
    }
    return true;
  }
  exports.equals = equals;
  function transpose(map) {
    const transposed = new Map();
    for (const key of map.keys()) {
      const val = map.get(key);
      transposed.set(val, key);
    }
    return transposed;
  }
  exports.transpose = transpose;
  function toObject(map) {
    const obj = {};
    for (const key of map.keys()) {
      obj[key] = map.get(key);
    }
    return obj;
  }
  exports.toObject = toObject;
  return exports;
});

//# sourceMappingURL=goog.collections.maps.js.map
