goog.provide("goog.functions");
goog.functions.constant = function(retValue) {
  return function() {
    return retValue;
  };
};
goog.functions.FALSE = function() {
  return false;
};
goog.functions.TRUE = function() {
  return true;
};
goog.functions.NULL = function() {
  return null;
};
goog.functions.UNDEFINED = function() {
  return undefined;
};
goog.functions.EMPTY = goog.functions.UNDEFINED;
goog.functions.identity = function(opt_returnValue, var_args) {
  return opt_returnValue;
};
goog.functions.error = function(message) {
  return function() {
    throw new Error(message);
  };
};
goog.functions.fail = function(err) {
  return function() {
    throw err;
  };
};
goog.functions.lock = function(f, opt_numArgs) {
  opt_numArgs = opt_numArgs || 0;
  return function() {
    const self = this;
    return f.apply(self, Array.prototype.slice.call(arguments, 0, opt_numArgs));
  };
};
goog.functions.nth = function(n) {
  return function() {
    return arguments[n];
  };
};
goog.functions.partialRight = function(fn, var_args) {
  const rightArgs = Array.prototype.slice.call(arguments, 1);
  return function() {
    let self = this;
    if (self === goog.global) {
      self = undefined;
    }
    const newArgs = Array.prototype.slice.call(arguments);
    newArgs.push.apply(newArgs, rightArgs);
    return fn.apply(self, newArgs);
  };
};
goog.functions.withReturnValue = function(f, retValue) {
  return goog.functions.sequence(f, goog.functions.constant(retValue));
};
goog.functions.equalTo = function(value, opt_useLooseComparison) {
  return function(other) {
    return opt_useLooseComparison ? value == other : value === other;
  };
};
goog.functions.compose = function(fn, var_args) {
  const functions = arguments;
  const length = functions.length;
  return function() {
    const self = this;
    let result;
    if (length) {
      result = functions[length - 1].apply(self, arguments);
    }
    for (let i = length - 2; i >= 0; i--) {
      result = functions[i].call(self, result);
    }
    return result;
  };
};
goog.functions.sequence = function(var_args) {
  const functions = arguments;
  const length = functions.length;
  return function() {
    const self = this;
    let result;
    for (let i = 0; i < length; i++) {
      result = functions[i].apply(self, arguments);
    }
    return result;
  };
};
goog.functions.and = function(var_args) {
  const functions = arguments;
  const length = functions.length;
  return function() {
    const self = this;
    for (let i = 0; i < length; i++) {
      if (!functions[i].apply(self, arguments)) {
        return false;
      }
    }
    return true;
  };
};
goog.functions.or = function(var_args) {
  const functions = arguments;
  const length = functions.length;
  return function() {
    const self = this;
    for (let i = 0; i < length; i++) {
      if (functions[i].apply(self, arguments)) {
        return true;
      }
    }
    return false;
  };
};
goog.functions.not = function(f) {
  return function() {
    const self = this;
    return !f.apply(self, arguments);
  };
};
goog.functions.create = function(constructor, var_args) {
  const temp = function() {
  };
  temp.prototype = constructor.prototype;
  const obj = new temp();
  constructor.apply(obj, Array.prototype.slice.call(arguments, 1));
  return obj;
};
goog.functions.CACHE_RETURN_VALUE = goog.define("goog.functions.CACHE_RETURN_VALUE", true);
goog.functions.cacheReturnValue = function(fn) {
  let called = false;
  let value;
  return function() {
    if (!goog.functions.CACHE_RETURN_VALUE) {
      return fn();
    }
    if (!called) {
      value = fn();
      called = true;
    }
    return value;
  };
};
goog.functions.once = function(f) {
  let inner = f;
  return function() {
    if (inner) {
      const tmp = inner;
      inner = null;
      tmp();
    }
  };
};
goog.functions.debounce = function(f, interval, opt_scope) {
  let timeout = 0;
  return function(var_args) {
    goog.global.clearTimeout(timeout);
    const args = arguments;
    timeout = goog.global.setTimeout(function() {
      f.apply(opt_scope, args);
    }, interval);
  };
};
goog.functions.throttle = function(f, interval, opt_scope) {
  let timeout = 0;
  let shouldFire = false;
  let storedArgs = [];
  const handleTimeout = function() {
    timeout = 0;
    if (shouldFire) {
      shouldFire = false;
      fire();
    }
  };
  const fire = function() {
    timeout = goog.global.setTimeout(handleTimeout, interval);
    let args = storedArgs;
    storedArgs = [];
    f.apply(opt_scope, args);
  };
  return function(var_args) {
    storedArgs = arguments;
    if (!timeout) {
      fire();
    } else {
      shouldFire = true;
    }
  };
};
goog.functions.rateLimit = function(f, interval, opt_scope) {
  let timeout = 0;
  const handleTimeout = function() {
    timeout = 0;
  };
  return function(var_args) {
    if (!timeout) {
      timeout = goog.global.setTimeout(handleTimeout, interval);
      f.apply(opt_scope, arguments);
    }
  };
};
goog.functions.isFunction = val => {
  return typeof val === "function";
};

//# sourceMappingURL=goog.functions.functions.js.map
