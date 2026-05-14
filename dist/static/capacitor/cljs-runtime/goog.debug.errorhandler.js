goog.provide("goog.debug.ErrorHandler");
goog.provide("goog.debug.ErrorHandler.ProtectedFunctionError");
goog.require("goog.Disposable");
goog.require("goog.asserts");
goog.require("goog.debug.EntryPointMonitor");
goog.require("goog.debug.Error");
goog.debug.ErrorHandler = function(handler) {
  goog.debug.ErrorHandler.base(this, "constructor");
  this.errorHandlerFn_ = handler;
  this.wrapErrors_ = true;
  this.prefixErrorMessages_ = false;
};
goog.inherits(goog.debug.ErrorHandler, goog.Disposable);
goog.debug.ErrorHandler.prototype.wrap = function(fn) {
  return this.protectEntryPoint(goog.asserts.assertFunction(fn));
};
goog.debug.ErrorHandler.prototype.unwrap = function(fn) {
  goog.asserts.assertFunction(fn);
  return fn[this.getFunctionIndex_(false)] || fn;
};
goog.debug.ErrorHandler.prototype.getFunctionIndex_ = function(wrapper) {
  return (wrapper ? "__wrapper_" : "__protected_") + goog.getUid(this) + "__";
};
goog.debug.ErrorHandler.prototype.protectEntryPoint = function(fn) {
  var protectedFnName = this.getFunctionIndex_(true);
  if (!fn[protectedFnName]) {
    var wrapper = fn[protectedFnName] = this.getProtectedFunction(fn);
    wrapper[this.getFunctionIndex_(false)] = fn;
  }
  return fn[protectedFnName];
};
goog.debug.ErrorHandler.prototype.getProtectedFunction = function(fn) {
  var that = this;
  var googDebugErrorHandlerProtectedFunction = function() {
    var self = this;
    if (that.isDisposed()) {
      return fn.apply(self, arguments);
    }
    try {
      return fn.apply(self, arguments);
    } catch (e) {
      that.handleError_(e);
    }
  };
  googDebugErrorHandlerProtectedFunction[this.getFunctionIndex_(false)] = fn;
  return googDebugErrorHandlerProtectedFunction;
};
goog.debug.ErrorHandler.prototype.handleError_ = function(e) {
  var MESSAGE_PREFIX = goog.debug.ErrorHandler.ProtectedFunctionError.MESSAGE_PREFIX;
  if (e && typeof e === "object" && typeof e.message === "string" && e.message.indexOf(MESSAGE_PREFIX) == 0 || typeof e === "string" && e.indexOf(MESSAGE_PREFIX) == 0) {
    return;
  }
  this.errorHandlerFn_(e);
  if (!this.wrapErrors_) {
    if (this.prefixErrorMessages_) {
      if (typeof e === "object" && e && typeof e.message === "string") {
        e.message = MESSAGE_PREFIX + e.message;
      } else {
        e = MESSAGE_PREFIX + e;
      }
    }
    if (goog.DEBUG) {
      if (e && typeof e.stack === "string" && Error.captureStackTrace && goog.global["console"]) {
        goog.global["console"]["error"](e.message, e.stack);
      }
    }
    throw e;
  }
  throw new goog.debug.ErrorHandler.ProtectedFunctionError(e);
};
goog.debug.ErrorHandler.prototype.protectWindowSetTimeout = function() {
  this.protectWindowFunctionsHelper_("setTimeout");
};
goog.debug.ErrorHandler.prototype.protectWindowSetInterval = function() {
  this.protectWindowFunctionsHelper_("setInterval");
};
goog.debug.ErrorHandler.prototype.catchUnhandledRejections = function(win) {
  win = win || goog.global["window"] || goog.global["globalThis"];
  if ("onunhandledrejection" in win) {
    win.onunhandledrejection = event => {
      const e = event && event.reason ? event.reason : new Error("uncaught error");
      this.handleError_(e);
    };
  }
};
goog.debug.ErrorHandler.prototype.protectWindowRequestAnimationFrame = function() {
  const win = goog.global["window"] || goog.global["globalThis"];
  var fnNames = ["requestAnimationFrame", "mozRequestAnimationFrame", "webkitAnimationFrame", "msRequestAnimationFrame"];
  for (var i = 0; i < fnNames.length; i++) {
    var fnName = fnNames[i];
    if (fnNames[i] in win) {
      this.protectWindowFunctionsHelper_(fnName);
    }
  }
};
goog.debug.ErrorHandler.prototype.protectWindowFunctionsHelper_ = function(fnName) {
  const win = goog.global["window"] || goog.global["globalThis"];
  var originalFn = win[fnName];
  if (!originalFn) {
    throw new Error(fnName + " not on global?");
  }
  var that = this;
  win[fnName] = function(fn, time) {
    if (typeof fn === "string") {
      fn = goog.partial(goog.globalEval, fn);
    }
    if (fn) {
      arguments[0] = fn = that.protectEntryPoint(fn);
    }
    if (originalFn.apply) {
      return originalFn.apply(this, arguments);
    } else {
      var callback = fn;
      if (arguments.length > 2) {
        var args = Array.prototype.slice.call(arguments, 2);
        callback = function() {
          fn.apply(this, args);
        };
      }
      return originalFn(callback, time);
    }
  };
  win[fnName][this.getFunctionIndex_(false)] = originalFn;
};
goog.debug.ErrorHandler.prototype.setWrapErrors = function(wrapErrors) {
  this.wrapErrors_ = wrapErrors;
};
goog.debug.ErrorHandler.prototype.setPrefixErrorMessages = function(prefixErrorMessages) {
  this.prefixErrorMessages_ = prefixErrorMessages;
};
goog.debug.ErrorHandler.prototype.disposeInternal = function() {
  const win = goog.global["window"] || goog.global["globalThis"];
  win.setTimeout = this.unwrap(win.setTimeout);
  win.setInterval = this.unwrap(win.setInterval);
  goog.debug.ErrorHandler.base(this, "disposeInternal");
};
goog.debug.ErrorHandler.ProtectedFunctionError = function(cause) {
  var message = goog.debug.ErrorHandler.ProtectedFunctionError.MESSAGE_PREFIX + (cause && cause.message ? String(cause.message) : String(cause));
  goog.debug.ErrorHandler.ProtectedFunctionError.base(this, "constructor", message, cause);
  var stack = cause && cause.stack;
  if (stack && typeof stack === "string") {
    this.stack = stack;
  }
};
goog.inherits(goog.debug.ErrorHandler.ProtectedFunctionError, goog.debug.Error);
goog.debug.ErrorHandler.ProtectedFunctionError.MESSAGE_PREFIX = "Error in protected function: ";

//# sourceMappingURL=goog.debug.errorhandler.js.map
