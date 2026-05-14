goog.provide("goog.structs.Map");
goog.require("goog.collections.iters");
goog.require("goog.iter");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.es6");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  this.size = 0;
  this.version_ = 0;
  var argLength = arguments.length;
  if (argLength > 1) {
    if (argLength % 2) {
      throw new Error("Uneven number of arguments");
    }
    for (var i = 0; i < argLength; i += 2) {
      this.set(arguments[i], arguments[i + 1]);
    }
  } else if (opt_map) {
    this.addAll(opt_map);
  }
};
goog.structs.Map.prototype.getCount = function() {
  return this.size;
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key]);
  }
  return rv;
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat();
};
goog.structs.Map.prototype.containsKey = function(key) {
  return this.has(key);
};
goog.structs.Map.prototype.has = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key);
};
goog.structs.Map.prototype.containsValue = function(val) {
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    if (goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true;
    }
  }
  return false;
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if (this === otherMap) {
    return true;
  }
  if (this.size != otherMap.getCount()) {
    return false;
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for (var key, i = 0; key = this.keys_[i]; i++) {
    if (!equalityFn(this.get(key), otherMap.get(key))) {
      return false;
    }
  }
  return true;
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b;
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.size == 0;
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.setSizeInternal_(0);
  this.version_ = 0;
};
goog.structs.Map.prototype.remove = function(key) {
  return this.delete(key);
};
goog.structs.Map.prototype.delete = function(key) {
  if (goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.setSizeInternal_(this.size - 1);
    this.version_++;
    if (this.keys_.length > 2 * this.size) {
      this.cleanupKeysArray_();
    }
    return true;
  }
  return false;
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if (this.size != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while (srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if (goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key;
      }
      srcIndex++;
    }
    this.keys_.length = destIndex;
  }
  if (this.size != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while (srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if (!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1;
      }
      srcIndex++;
    }
    this.keys_.length = destIndex;
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if (goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key];
  }
  return opt_val;
};
goog.structs.Map.prototype.set = function(key, value) {
  if (!goog.structs.Map.hasKey_(this.map_, key)) {
    this.setSizeInternal_(this.size + 1);
    this.keys_.push(key);
    this.version_++;
  }
  this.map_[key] = value;
};
goog.structs.Map.prototype.addAll = function(map) {
  if (map instanceof goog.structs.Map) {
    var keys = map.getKeys();
    for (var i = 0; i < keys.length; i++) {
      this.set(keys[i], map.get(keys[i]));
    }
  } else {
    for (var key in map) {
      this.set(key, map[key]);
    }
  }
};
goog.structs.Map.prototype.forEach = function(f, opt_obj) {
  var keys = this.getKeys();
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = this.get(key);
    f.call(opt_obj, value, key, this);
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this);
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map();
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key);
  }
  return transposed;
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key];
  }
  return obj;
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true);
};
goog.structs.Map.prototype.keys = function() {
  return goog.iter.es6.ShimIterable.of(this.getKeyIterator()).toEs6();
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false);
};
goog.structs.Map.prototype.values = function() {
  return goog.iter.es6.ShimIterable.of(this.getValueIterator()).toEs6();
};
goog.structs.Map.prototype.entries = function() {
  const self = this;
  return goog.collections.iters.map(this.keys(), function(key) {
    return [key, self.get(key)];
  });
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator();
  newIter.next = function() {
    if (version != selfObj.version_) {
      throw new Error("The map has changed since the iterator was created");
    }
    if (i >= selfObj.keys_.length) {
      return goog.iter.ES6_ITERATOR_DONE;
    }
    var key = selfObj.keys_[i++];
    return goog.iter.createEs6IteratorYield(opt_keys ? key : selfObj.map_[key]);
  };
  return newIter;
};
goog.structs.Map.prototype.setSizeInternal_ = function(newSize) {
  this.size = newSize;
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

//# sourceMappingURL=goog.structs.map.js.map
