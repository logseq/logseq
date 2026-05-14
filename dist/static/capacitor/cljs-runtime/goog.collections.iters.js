goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.collections.iters");
  goog.module.declareLegacyNamespace();
  function getIterator(iterable) {
    return iterable[goog.global.Symbol.iterator]();
  }
  exports.getIterator = getIterator;
  function forEach(iterator, f) {
    let result;
    while (!(result = iterator.next()).done) {
      f(result.value);
    }
  }
  exports.forEach = forEach;
  class MapIterator {
    constructor(childIter, mapFn) {
      this.childIterator_ = getIterator(childIter);
      this.mapFn_ = mapFn;
    }
    [Symbol.iterator]() {
      return this;
    }
    next() {
      const childResult = this.childIterator_.next();
      return {value:childResult.done ? undefined : this.mapFn_.call(undefined, childResult.value), done:childResult.done,};
    }
  }
  exports.map = function(iterable, f) {
    return new MapIterator(iterable, f);
  };
  class FilterIterator {
    constructor(childIter, filterFn) {
      this.childIter_ = getIterator(childIter);
      this.filterFn_ = filterFn;
    }
    [Symbol.iterator]() {
      return this;
    }
    next() {
      while (true) {
        const childResult = this.childIter_.next();
        if (childResult.done) {
          return {done:true, value:undefined};
        }
        const passesFilter = this.filterFn_.call(undefined, childResult.value);
        if (passesFilter) {
          return childResult;
        }
      }
    }
  }
  exports.filter = function(iterable, f) {
    return new FilterIterator(iterable, f);
  };
  class ConcatIterator {
    constructor(iterators) {
      this.iterators_ = iterators;
      this.iterIndex_ = 0;
    }
    [Symbol.iterator]() {
      return this;
    }
    next() {
      while (this.iterIndex_ < this.iterators_.length) {
        const result = this.iterators_[this.iterIndex_].next();
        if (!result.done) {
          return result;
        }
        this.iterIndex_++;
      }
      return {done:true};
    }
  }
  exports.concat = function(...iterables) {
    return new ConcatIterator(iterables.map(getIterator));
  };
  exports.toArray = function(iterator) {
    const arr = [];
    forEach(iterator, e => arr.push(e));
    return arr;
  };
  return exports;
});

//# sourceMappingURL=goog.collections.iters.js.map
