goog.provide("goog.iter");
goog.provide("goog.iter.Iterable");
goog.provide("goog.iter.Iterator");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.functions");
goog.require("goog.math");
goog.iter.Iterable;
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  return goog.iter.ES6_ITERATOR_DONE;
};
goog.iter.ES6_ITERATOR_DONE = goog.debug.freeze({done:true, value:undefined});
goog.iter.createEs6IteratorYield = function(value) {
  return {value, done:false};
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this;
};
goog.iter.toIterator = function(iterable) {
  if (iterable instanceof goog.iter.Iterator) {
    return iterable;
  }
  if (typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false);
  }
  if (goog.isArrayLike(iterable)) {
    const like = iterable;
    let i = 0;
    const newIter = new goog.iter.Iterator();
    newIter.next = function() {
      while (true) {
        if (i >= like.length) {
          return goog.iter.ES6_ITERATOR_DONE;
        }
        if (!(i in like)) {
          i++;
          continue;
        }
        return goog.iter.createEs6IteratorYield(like[i++]);
      }
    };
    return newIter;
  }
  throw new Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if (goog.isArrayLike(iterable)) {
    goog.array.forEach(iterable, f, opt_obj);
  } else {
    const iterator = goog.iter.toIterator(iterable);
    while (true) {
      const {done, value} = iterator.next();
      if (done) {
        return;
      }
      f.call(opt_obj, value, undefined, iterator);
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  const iterator = goog.iter.toIterator(iterable);
  const newIter = new goog.iter.Iterator();
  newIter.next = function() {
    while (true) {
      const {done, value} = iterator.next();
      if (done) {
        return goog.iter.ES6_ITERATOR_DONE;
      }
      if (f.call(opt_obj, value, undefined, iterator)) {
        return goog.iter.createEs6IteratorYield(value);
      }
    }
  };
  return newIter;
};
goog.iter.filterFalse = function(iterable, f, opt_obj) {
  return goog.iter.filter(iterable, goog.functions.not(f), opt_obj);
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  let start = 0;
  let stop = startOrStop;
  let step = opt_step || 1;
  if (arguments.length > 1) {
    start = startOrStop;
    stop = +opt_stop;
  }
  if (step == 0) {
    throw new Error("Range step argument must not be zero");
  }
  const newIter = new goog.iter.Iterator();
  newIter.next = function() {
    if (step > 0 && start >= stop || step < 0 && start <= stop) {
      return goog.iter.ES6_ITERATOR_DONE;
    }
    const rv = start;
    start += step;
    return goog.iter.createEs6IteratorYield(rv);
  };
  return newIter;
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator);
};
goog.iter.map = function(iterable, f, opt_obj) {
  const iterator = goog.iter.toIterator(iterable);
  const newIter = new goog.iter.Iterator();
  newIter.next = function() {
    const {done, value} = iterator.next();
    if (done) {
      return goog.iter.ES6_ITERATOR_DONE;
    }
    const mappedVal = f.call(opt_obj, value, undefined, iterator);
    return goog.iter.createEs6IteratorYield(mappedVal);
  };
  return newIter;
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  let rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val);
  });
  return rval;
};
goog.iter.some = function(iterable, f, opt_obj) {
  const iterator = goog.iter.toIterator(iterable);
  while (true) {
    const {done, value} = iterator.next();
    if (done) {
      return false;
    }
    if (f.call(opt_obj, value, undefined, iterator)) {
      return true;
    }
  }
};
goog.iter.every = function(iterable, f, opt_obj) {
  const iterator = goog.iter.toIterator(iterable);
  while (true) {
    const {done, value} = iterator.next();
    if (done) {
      return true;
    }
    if (!f.call(opt_obj, value, undefined, iterator)) {
      return false;
    }
  }
};
goog.iter.chain = function(var_args) {
  return goog.iter.chainFromIterable(arguments);
};
goog.iter.chainFromIterable = function(iterable) {
  const iteratorOfIterators = goog.iter.toIterator(iterable);
  const iter = new goog.iter.Iterator();
  let current = null;
  iter.next = function() {
    while (true) {
      if (current == null) {
        const it = iteratorOfIterators.next();
        if (it.done) {
          return goog.iter.ES6_ITERATOR_DONE;
        }
        const value = it.value;
        current = goog.iter.toIterator(value);
      }
      const it = current.next();
      if (it.done) {
        current = null;
        continue;
      }
      const value = it.value;
      return goog.iter.createEs6IteratorYield(value);
    }
  };
  return iter;
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  const iterator = goog.iter.toIterator(iterable);
  const newIter = new goog.iter.Iterator();
  let dropping = true;
  newIter.next = function() {
    while (true) {
      const {done, value} = iterator.next();
      if (done) {
        return goog.iter.ES6_ITERATOR_DONE;
      }
      if (dropping && f.call(opt_obj, value, undefined, iterator)) {
        continue;
      } else {
        dropping = false;
      }
      return goog.iter.createEs6IteratorYield(value);
    }
  };
  return newIter;
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  const iterator = goog.iter.toIterator(iterable);
  const iter = new goog.iter.Iterator();
  iter.next = function() {
    const {done, value} = iterator.next();
    if (done) {
      return goog.iter.ES6_ITERATOR_DONE;
    }
    if (f.call(opt_obj, value, undefined, iterator)) {
      return goog.iter.createEs6IteratorYield(value);
    }
    return goog.iter.ES6_ITERATOR_DONE;
  };
  return iter;
};
goog.iter.toArray = function(iterable) {
  if (goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable);
  }
  iterable = goog.iter.toIterator(iterable);
  const array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val);
  });
  return array;
};
goog.iter.equals = function(iterable1, iterable2, opt_equalsFn) {
  const fillValue = {};
  const pairs = goog.iter.zipLongest(fillValue, iterable1, iterable2);
  const equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  return goog.iter.every(pairs, function(pair) {
    return equalsFn(pair[0], pair[1]);
  });
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  const iterator = goog.iter.toIterator(iterable);
  const {done, value} = iterator.next();
  if (done) {
    return defaultValue;
  }
  return value;
};
goog.iter.product = function(var_args) {
  const someArrayEmpty = Array.prototype.some.call(arguments, function(arr) {
    return !arr.length;
  });
  if (someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator();
  }
  const iter = new goog.iter.Iterator();
  const arrays = arguments;
  let indices = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if (indices) {
      const retVal = goog.array.map(indices, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex];
      });
      for (let i = indices.length - 1; i >= 0; i--) {
        goog.asserts.assert(indices);
        if (indices[i] < arrays[i].length - 1) {
          indices[i]++;
          break;
        }
        if (i == 0) {
          indices = null;
          break;
        }
        indices[i] = 0;
      }
      return goog.iter.createEs6IteratorYield(retVal);
    }
    return goog.iter.ES6_ITERATOR_DONE;
  };
  return iter;
};
goog.iter.cycle = function(iterable) {
  const baseIterator = goog.iter.toIterator(iterable);
  const cache = [];
  let cacheIndex = 0;
  const iter = new goog.iter.Iterator();
  let useCache = false;
  iter.next = function() {
    let returnElement = null;
    if (!useCache) {
      const it = baseIterator.next();
      if (it.done) {
        if (goog.array.isEmpty(cache)) {
          return goog.iter.ES6_ITERATOR_DONE;
        }
        useCache = true;
      } else {
        cache.push(it.value);
        return it;
      }
    }
    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;
    return goog.iter.createEs6IteratorYield(returnElement);
  };
  return iter;
};
goog.iter.count = function(opt_start, opt_step) {
  let counter = opt_start || 0;
  const step = opt_step !== undefined ? opt_step : 1;
  const iter = new goog.iter.Iterator();
  iter.next = function() {
    const returnValue = counter;
    counter += step;
    return goog.iter.createEs6IteratorYield(returnValue);
  };
  return iter;
};
goog.iter.repeat = function(value) {
  const iter = new goog.iter.Iterator();
  iter.next = function() {
    return goog.iter.createEs6IteratorYield(value);
  };
  return iter;
};
goog.iter.accumulate = function(iterable) {
  const iterator = goog.iter.toIterator(iterable);
  let total = 0;
  const iter = new goog.iter.Iterator();
  iter.next = function() {
    const {done, value} = iterator.next();
    if (done) {
      return goog.iter.ES6_ITERATOR_DONE;
    }
    total += value;
    return goog.iter.createEs6IteratorYield(total);
  };
  return iter;
};
goog.iter.zip = function(var_args) {
  const args = arguments;
  const iter = new goog.iter.Iterator();
  if (args.length > 0) {
    const iterators = goog.array.map(args, goog.iter.toIterator);
    let allDone = false;
    iter.next = function() {
      if (allDone) {
        return goog.iter.ES6_ITERATOR_DONE;
      }
      const arr = [];
      for (let i = 0, iterator; iterator = iterators[i++];) {
        const it = iterator.next();
        if (it.done) {
          allDone = true;
          return goog.iter.ES6_ITERATOR_DONE;
        }
        arr.push(it.value);
      }
      return goog.iter.createEs6IteratorYield(arr);
    };
  }
  return iter;
};
goog.iter.zipLongest = function(fillValue, var_args) {
  const args = Array.prototype.slice.call(arguments, 1);
  const iter = new goog.iter.Iterator();
  if (args.length > 0) {
    const iterators = goog.array.map(args, goog.iter.toIterator);
    let allDone = false;
    iter.next = function() {
      if (allDone) {
        return goog.iter.ES6_ITERATOR_DONE;
      }
      let iteratorsHaveValues = false;
      const arr = [];
      for (let i = 0, iterator; iterator = iterators[i++];) {
        const it = iterator.next();
        if (it.done) {
          arr.push(fillValue);
          continue;
        }
        arr.push(it.value);
        iteratorsHaveValues = true;
      }
      if (!iteratorsHaveValues) {
        allDone = true;
        return goog.iter.ES6_ITERATOR_DONE;
      }
      return goog.iter.createEs6IteratorYield(arr);
    };
  }
  return iter;
};
goog.iter.compress = function(iterable, selectors) {
  const valueIterator = goog.iter.toIterator(iterable);
  const selectorIterator = goog.iter.toIterator(selectors);
  const iter = new goog.iter.Iterator();
  let allDone = false;
  iter.next = function() {
    if (allDone) {
      return goog.iter.ES6_ITERATOR_DONE;
    }
    while (true) {
      const valIt = valueIterator.next();
      if (valIt.done) {
        allDone = true;
        return goog.iter.ES6_ITERATOR_DONE;
      }
      const selectorIt = selectorIterator.next();
      if (selectorIt.done) {
        allDone = true;
        return goog.iter.ES6_ITERATOR_DONE;
      }
      const val = valIt.value;
      const selectorVal = selectorIt.value;
      if (selectorVal) {
        return goog.iter.createEs6IteratorYield(val);
      }
    }
  };
  return iter;
};
goog.iter.GroupByIterator_ = function(iterable, opt_keyFunc) {
  this.iterator = goog.iter.toIterator(iterable);
  this.keyFunc = opt_keyFunc || goog.functions.identity;
  this.targetKey;
  this.currentKey;
  this.currentValue;
};
goog.inherits(goog.iter.GroupByIterator_, goog.iter.Iterator);
goog.iter.GroupByIterator_.prototype.next = function() {
  while (this.currentKey == this.targetKey) {
    const it = this.iterator.next();
    if (it.done) {
      return goog.iter.ES6_ITERATOR_DONE;
    }
    this.currentValue = it.value;
    this.currentKey = this.keyFunc(this.currentValue);
  }
  this.targetKey = this.currentKey;
  return goog.iter.createEs6IteratorYield([this.currentKey, this.groupItems_(this.targetKey)]);
};
goog.iter.GroupByIterator_.prototype.groupItems_ = function(targetKey) {
  const arr = [];
  while (this.currentKey == targetKey) {
    arr.push(this.currentValue);
    const it = this.iterator.next();
    if (it.done) {
      break;
    }
    this.currentValue = it.value;
    this.currentKey = this.keyFunc(this.currentValue);
  }
  return arr;
};
goog.iter.groupBy = function(iterable, opt_keyFunc) {
  return new goog.iter.GroupByIterator_(iterable, opt_keyFunc);
};
goog.iter.starMap = function(iterable, f, opt_obj) {
  const iterator = goog.iter.toIterator(iterable);
  const iter = new goog.iter.Iterator();
  iter.next = function() {
    const it = iterator.next();
    if (it.done) {
      return goog.iter.ES6_ITERATOR_DONE;
    }
    const args = goog.iter.toArray(it.value);
    const value = f.apply(opt_obj, [].concat(args, undefined, iterator));
    return goog.iter.createEs6IteratorYield(value);
  };
  return iter;
};
goog.iter.tee = function(iterable, opt_num) {
  const iterator = goog.iter.toIterator(iterable);
  const num = typeof opt_num === "number" ? opt_num : 2;
  const buffers = goog.array.map(goog.array.range(num), function() {
    return [];
  });
  function addNextIteratorValueToBuffers() {
    const {done, value} = iterator.next();
    if (done) {
      return false;
    }
    for (let i = 0, buffer; buffer = buffers[i++];) {
      buffer.push(value);
    }
    return true;
  }
  function createIterator(buffer) {
    const iter = new goog.iter.Iterator();
    iter.next = function() {
      if (goog.array.isEmpty(buffer)) {
        const added = addNextIteratorValueToBuffers();
        if (!added) {
          return goog.iter.ES6_ITERATOR_DONE;
        }
      }
      goog.asserts.assert(!goog.array.isEmpty(buffer));
      return goog.iter.createEs6IteratorYield(buffer.shift());
    };
    return iter;
  }
  return goog.array.map(buffers, createIterator);
};
goog.iter.enumerate = function(iterable, opt_start) {
  return goog.iter.zip(goog.iter.count(opt_start), iterable);
};
goog.iter.limit = function(iterable, limitSize) {
  goog.asserts.assert(goog.math.isInt(limitSize) && limitSize >= 0);
  const iterator = goog.iter.toIterator(iterable);
  const iter = new goog.iter.Iterator();
  let remaining = limitSize;
  iter.next = function() {
    if (remaining-- > 0) {
      return iterator.next();
    }
    return goog.iter.ES6_ITERATOR_DONE;
  };
  return iter;
};
goog.iter.consume = function(iterable, count) {
  goog.asserts.assert(goog.math.isInt(count) && count >= 0);
  const iterator = goog.iter.toIterator(iterable);
  while (count-- > 0) {
    goog.iter.nextOrValue(iterator, null);
  }
  return iterator;
};
goog.iter.slice = function(iterable, start, opt_end) {
  goog.asserts.assert(goog.math.isInt(start) && start >= 0);
  let iterator = goog.iter.consume(iterable, start);
  if (typeof opt_end === "number") {
    goog.asserts.assert(goog.math.isInt(opt_end) && opt_end >= start);
    iterator = goog.iter.limit(iterator, opt_end - start);
  }
  return iterator;
};
goog.iter.hasDuplicates_ = function(arr) {
  const deduped = [];
  goog.array.removeDuplicates(arr, deduped);
  return arr.length != deduped.length;
};
goog.iter.permutations = function(iterable, opt_length) {
  const elements = goog.iter.toArray(iterable);
  const length = typeof opt_length === "number" ? opt_length : elements.length;
  const sets = goog.array.repeat(elements, length);
  const product = goog.iter.product.apply(undefined, sets);
  return goog.iter.filter(product, function(arr) {
    return !goog.iter.hasDuplicates_(arr);
  });
};
goog.iter.combinations = function(iterable, length) {
  const elements = goog.iter.toArray(iterable);
  const indexes = goog.iter.range(elements.length);
  const indexIterator = goog.iter.permutations(indexes, length);
  const sortedIndexIterator = goog.iter.filter(indexIterator, function(arr) {
    return goog.array.isSorted(arr);
  });
  const iter = new goog.iter.Iterator();
  function getIndexFromElements(index) {
    return elements[index];
  }
  iter.next = function() {
    const {done, value} = sortedIndexIterator.next();
    if (done) {
      return goog.iter.ES6_ITERATOR_DONE;
    }
    return goog.iter.createEs6IteratorYield(goog.array.map(value, getIndexFromElements));
  };
  return iter;
};
goog.iter.combinationsWithReplacement = function(iterable, length) {
  const elements = goog.iter.toArray(iterable);
  const indexes = goog.array.range(elements.length);
  const sets = goog.array.repeat(indexes, length);
  const indexIterator = goog.iter.product.apply(undefined, sets);
  const sortedIndexIterator = goog.iter.filter(indexIterator, function(arr) {
    return goog.array.isSorted(arr);
  });
  const iter = new goog.iter.Iterator();
  function getIndexFromElements(index) {
    return elements[index];
  }
  iter.next = function() {
    const {done, value} = sortedIndexIterator.next();
    if (done) {
      return goog.iter.ES6_ITERATOR_DONE;
    }
    return goog.iter.createEs6IteratorYield(goog.array.map(value, getIndexFromElements));
  };
  return iter;
};

//# sourceMappingURL=goog.iter.iter.js.map
