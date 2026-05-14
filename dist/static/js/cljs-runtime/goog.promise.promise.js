goog.provide("goog.Promise");
goog.require("goog.Thenable");
goog.require("goog.asserts");
goog.require("goog.async.FreeList");
goog.require("goog.async.run");
goog.require("goog.async.throwException");
goog.require("goog.debug.Error");
goog.require("goog.debug.asyncStackTag");
goog.require("goog.functions");
goog.require("goog.promise.Resolver");
goog.Promise = function(resolver, opt_context) {
  this.state_ = goog.Promise.State_.PENDING;
  this.result_ = undefined;
  this.parent_ = null;
  this.callbackEntries_ = null;
  this.callbackEntriesTail_ = null;
  this.executing_ = false;
  if (goog.Promise.UNHANDLED_REJECTION_DELAY > 0) {
    this.unhandledRejectionId_ = 0;
  } else if (goog.Promise.UNHANDLED_REJECTION_DELAY == 0) {
    this.hadUnhandledRejection_ = false;
  }
  if (goog.Promise.LONG_STACK_TRACES) {
    this.stack_ = [];
    this.addStackTrace_(new Error("created"));
    this.currentStep_ = 0;
  }
  if (resolver != goog.functions.UNDEFINED) {
    try {
      var self = this;
      resolver.call(opt_context, function(value) {
        self.resolve_(goog.Promise.State_.FULFILLED, value);
      }, function(reason) {
        if (goog.DEBUG && !(reason instanceof goog.Promise.CancellationError)) {
          try {
            if (reason instanceof Error) {
              throw reason;
            } else {
              throw new Error("Promise rejected.");
            }
          } catch (e) {
          }
        }
        self.resolve_(goog.Promise.State_.REJECTED, reason);
      });
    } catch (e) {
      this.resolve_(goog.Promise.State_.REJECTED, e);
    }
  }
};
goog.Promise.LONG_STACK_TRACES = goog.define("goog.Promise.LONG_STACK_TRACES", false);
goog.Promise.UNHANDLED_REJECTION_DELAY = goog.define("goog.Promise.UNHANDLED_REJECTION_DELAY", 0);
goog.Promise.State_ = {PENDING:0, BLOCKED:1, FULFILLED:2, REJECTED:3};
goog.Promise.CallbackEntry_ = function() {
  this.child = null;
  this.onFulfilled = null;
  this.onRejected = null;
  this.context = null;
  this.next = null;
  this.always = false;
};
goog.Promise.CallbackEntry_.prototype.reset = function() {
  this.child = null;
  this.onFulfilled = null;
  this.onRejected = null;
  this.context = null;
  this.always = false;
};
goog.Promise.DEFAULT_MAX_UNUSED = goog.define("goog.Promise.DEFAULT_MAX_UNUSED", 100);
goog.Promise.freelist_ = new goog.async.FreeList(function() {
  return new goog.Promise.CallbackEntry_();
}, function(item) {
  item.reset();
}, goog.Promise.DEFAULT_MAX_UNUSED);
goog.Promise.getCallbackEntry_ = function(onFulfilled, onRejected, context) {
  var entry = goog.Promise.freelist_.get();
  entry.onFulfilled = onFulfilled;
  entry.onRejected = onRejected;
  entry.context = context;
  return entry;
};
goog.Promise.returnEntry_ = function(entry) {
  goog.Promise.freelist_.put(entry);
};
goog.Promise.resolve = function(opt_value) {
  if (opt_value instanceof goog.Promise) {
    return opt_value;
  }
  var promise = new goog.Promise(goog.functions.UNDEFINED);
  promise.resolve_(goog.Promise.State_.FULFILLED, opt_value);
  return promise;
};
goog.Promise.reject = function(opt_reason) {
  return new goog.Promise(function(resolve, reject) {
    reject(opt_reason);
  });
};
goog.Promise.resolveThen_ = function(value, onFulfilled, onRejected) {
  var isThenable = goog.Promise.maybeThen_(value, onFulfilled, onRejected, null);
  if (!isThenable) {
    goog.async.run(goog.partial(onFulfilled, value));
  }
};
goog.Promise.race = function(promises) {
  return new goog.Promise(function(resolve, reject) {
    if (!promises.length) {
      resolve(undefined);
    }
    for (var i = 0, promise; i < promises.length; i++) {
      promise = promises[i];
      goog.Promise.resolveThen_(promise, resolve, reject);
    }
  });
};
goog.Promise.all = function(promises) {
  return new goog.Promise(function(resolve, reject) {
    var toFulfill = promises.length;
    var values = [];
    if (!toFulfill) {
      resolve(values);
      return;
    }
    var onFulfill = function(index, value) {
      toFulfill--;
      values[index] = value;
      if (toFulfill == 0) {
        resolve(values);
      }
    };
    var onReject = function(reason) {
      reject(reason);
    };
    for (var i = 0, promise; i < promises.length; i++) {
      promise = promises[i];
      goog.Promise.resolveThen_(promise, goog.partial(onFulfill, i), onReject);
    }
  });
};
goog.Promise.allSettled = function(promises) {
  return new goog.Promise(function(resolve, reject) {
    var toSettle = promises.length;
    var results = [];
    if (!toSettle) {
      resolve(results);
      return;
    }
    var onSettled = function(index, fulfilled, result) {
      toSettle--;
      results[index] = fulfilled ? {fulfilled:true, value:result} : {fulfilled:false, reason:result};
      if (toSettle == 0) {
        resolve(results);
      }
    };
    for (var i = 0, promise; i < promises.length; i++) {
      promise = promises[i];
      goog.Promise.resolveThen_(promise, goog.partial(onSettled, i, true), goog.partial(onSettled, i, false));
    }
  });
};
goog.Promise.firstFulfilled = function(promises) {
  return new goog.Promise(function(resolve, reject) {
    var toReject = promises.length;
    var reasons = [];
    if (!toReject) {
      resolve(undefined);
      return;
    }
    var onFulfill = function(value) {
      resolve(value);
    };
    var onReject = function(index, reason) {
      toReject--;
      reasons[index] = reason;
      if (toReject == 0) {
        reject(reasons);
      }
    };
    for (var i = 0, promise; i < promises.length; i++) {
      promise = promises[i];
      goog.Promise.resolveThen_(promise, onFulfill, goog.partial(onReject, i));
    }
  });
};
goog.Promise.withResolver = function() {
  var resolve, reject;
  var promise = new goog.Promise(function(rs, rj) {
    resolve = rs;
    reject = rj;
  });
  return new goog.Promise.Resolver_(promise, resolve, reject);
};
goog.Promise.prototype.then = function(opt_onFulfilled, opt_onRejected, opt_context) {
  if (opt_onFulfilled != null) {
    goog.asserts.assertFunction(opt_onFulfilled, "opt_onFulfilled should be a function.");
  }
  if (opt_onRejected != null) {
    goog.asserts.assertFunction(opt_onRejected, "opt_onRejected should be a function. Did you pass opt_context " + "as the second argument instead of the third?");
  }
  if (goog.Promise.LONG_STACK_TRACES) {
    this.addStackTrace_(new Error("then"));
  }
  return this.addChildPromise_(typeof opt_onFulfilled === "function" ? opt_onFulfilled : null, typeof opt_onRejected === "function" ? opt_onRejected : null, opt_context);
};
goog.Thenable.addImplementation(goog.Promise);
goog.Promise.prototype.thenVoid = function(opt_onFulfilled, opt_onRejected, opt_context) {
  if (opt_onFulfilled != null) {
    goog.asserts.assertFunction(opt_onFulfilled, "opt_onFulfilled should be a function.");
  }
  if (opt_onRejected != null) {
    goog.asserts.assertFunction(opt_onRejected, "opt_onRejected should be a function. Did you pass opt_context " + "as the second argument instead of the third?");
  }
  if (goog.Promise.LONG_STACK_TRACES) {
    this.addStackTrace_(new Error("then"));
  }
  this.addCallbackEntry_(goog.Promise.getCallbackEntry_(opt_onFulfilled || goog.functions.UNDEFINED, opt_onRejected || null, opt_context));
};
goog.Promise.prototype.thenAlways = function(onSettled, opt_context) {
  if (goog.Promise.LONG_STACK_TRACES) {
    this.addStackTrace_(new Error("thenAlways"));
  }
  var entry = goog.Promise.getCallbackEntry_(onSettled, onSettled, opt_context);
  entry.always = true;
  this.addCallbackEntry_(entry);
  return this;
};
goog.Promise.prototype.thenCatch = function(onRejected, opt_context) {
  if (goog.Promise.LONG_STACK_TRACES) {
    this.addStackTrace_(new Error("thenCatch"));
  }
  return this.addChildPromise_(null, onRejected, opt_context);
};
goog.Promise.prototype.catch = goog.Promise.prototype.thenCatch;
goog.Promise.prototype.cancel = function(opt_message) {
  if (this.state_ == goog.Promise.State_.PENDING) {
    var err = new goog.Promise.CancellationError(opt_message);
    goog.async.run(function() {
      this.cancelInternal_(err);
    }, this);
  }
};
goog.Promise.prototype.cancelInternal_ = function(err) {
  if (this.state_ == goog.Promise.State_.PENDING) {
    if (this.parent_) {
      this.parent_.cancelChild_(this, err);
      this.parent_ = null;
    } else {
      this.resolve_(goog.Promise.State_.REJECTED, err);
    }
  }
};
goog.Promise.prototype.cancelChild_ = function(childPromise, err) {
  if (!this.callbackEntries_) {
    return;
  }
  var childCount = 0;
  var childEntry = null;
  var beforeChildEntry = null;
  for (var entry = this.callbackEntries_; entry; entry = entry.next) {
    if (!entry.always) {
      childCount++;
      if (entry.child == childPromise) {
        childEntry = entry;
      }
      if (childEntry && childCount > 1) {
        break;
      }
    }
    if (!childEntry) {
      beforeChildEntry = entry;
    }
  }
  if (childEntry) {
    if (this.state_ == goog.Promise.State_.PENDING && childCount == 1) {
      this.cancelInternal_(err);
    } else {
      if (beforeChildEntry) {
        this.removeEntryAfter_(beforeChildEntry);
      } else {
        this.popEntry_();
      }
      this.executeCallback_(childEntry, goog.Promise.State_.REJECTED, err);
    }
  }
};
goog.Promise.prototype.addCallbackEntry_ = function(callbackEntry) {
  if (!this.hasEntry_() && (this.state_ == goog.Promise.State_.FULFILLED || this.state_ == goog.Promise.State_.REJECTED)) {
    this.scheduleCallbacks_();
  }
  this.queueEntry_(callbackEntry);
};
goog.Promise.prototype.addChildPromise_ = function(onFulfilled, onRejected, opt_context) {
  if (onFulfilled) {
    onFulfilled = goog.debug.asyncStackTag.wrap(onFulfilled, "goog.Promise.then");
  }
  if (onRejected) {
    onRejected = goog.debug.asyncStackTag.wrap(onRejected, "goog.Promise.then");
  }
  var callbackEntry = goog.Promise.getCallbackEntry_(null, null, null);
  callbackEntry.child = new goog.Promise(function(resolve, reject) {
    callbackEntry.onFulfilled = onFulfilled ? function(value) {
      try {
        var result = onFulfilled.call(opt_context, value);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    } : resolve;
    callbackEntry.onRejected = onRejected ? function(reason) {
      try {
        var result = onRejected.call(opt_context, reason);
        if (result === undefined && reason instanceof goog.Promise.CancellationError) {
          reject(reason);
        } else {
          resolve(result);
        }
      } catch (err) {
        reject(err);
      }
    } : reject;
  });
  callbackEntry.child.parent_ = this;
  this.addCallbackEntry_(callbackEntry);
  return callbackEntry.child;
};
goog.Promise.prototype.unblockAndFulfill_ = function(value) {
  goog.asserts.assert(this.state_ == goog.Promise.State_.BLOCKED);
  this.state_ = goog.Promise.State_.PENDING;
  this.resolve_(goog.Promise.State_.FULFILLED, value);
};
goog.Promise.prototype.unblockAndReject_ = function(reason) {
  goog.asserts.assert(this.state_ == goog.Promise.State_.BLOCKED);
  this.state_ = goog.Promise.State_.PENDING;
  this.resolve_(goog.Promise.State_.REJECTED, reason);
};
goog.Promise.prototype.resolve_ = function(state, x) {
  if (this.state_ != goog.Promise.State_.PENDING) {
    return;
  }
  if (this === x) {
    state = goog.Promise.State_.REJECTED;
    x = new TypeError("Promise cannot resolve to itself");
  }
  this.state_ = goog.Promise.State_.BLOCKED;
  var isThenable = goog.Promise.maybeThen_(x, this.unblockAndFulfill_, this.unblockAndReject_, this);
  if (isThenable) {
    return;
  }
  this.result_ = x;
  this.state_ = state;
  this.parent_ = null;
  this.scheduleCallbacks_();
  if (state == goog.Promise.State_.REJECTED && !(x instanceof goog.Promise.CancellationError)) {
    goog.Promise.addUnhandledRejection_(this, x);
  }
};
goog.Promise.maybeThen_ = function(value, onFulfilled, onRejected, context) {
  if (value instanceof goog.Promise) {
    value.thenVoid(onFulfilled, onRejected, context);
    return true;
  } else if (goog.Thenable.isImplementedBy(value)) {
    value = value;
    value.then(onFulfilled, onRejected, context);
    return true;
  } else if (goog.isObject(value)) {
    const thenable = value;
    try {
      var then = thenable.then;
      if (typeof then === "function") {
        goog.Promise.tryThen_(thenable, then, onFulfilled, onRejected, context);
        return true;
      }
    } catch (e) {
      onRejected.call(context, e);
      return true;
    }
  }
  return false;
};
goog.Promise.tryThen_ = function(thenable, then, onFulfilled, onRejected, context) {
  var called = false;
  var resolve = function(value) {
    if (!called) {
      called = true;
      onFulfilled.call(context, value);
    }
  };
  var reject = function(reason) {
    if (!called) {
      called = true;
      onRejected.call(context, reason);
    }
  };
  try {
    then.call(thenable, resolve, reject);
  } catch (e) {
    reject(e);
  }
};
goog.Promise.prototype.scheduleCallbacks_ = function() {
  if (!this.executing_) {
    this.executing_ = true;
    goog.async.run(this.executeCallbacks_, this);
  }
};
goog.Promise.prototype.hasEntry_ = function() {
  return !!this.callbackEntries_;
};
goog.Promise.prototype.queueEntry_ = function(entry) {
  goog.asserts.assert(entry.onFulfilled != null);
  if (this.callbackEntriesTail_) {
    this.callbackEntriesTail_.next = entry;
    this.callbackEntriesTail_ = entry;
  } else {
    this.callbackEntries_ = entry;
    this.callbackEntriesTail_ = entry;
  }
};
goog.Promise.prototype.popEntry_ = function() {
  var entry = null;
  if (this.callbackEntries_) {
    entry = this.callbackEntries_;
    this.callbackEntries_ = entry.next;
    entry.next = null;
  }
  if (!this.callbackEntries_) {
    this.callbackEntriesTail_ = null;
  }
  if (entry != null) {
    goog.asserts.assert(entry.onFulfilled != null);
  }
  return entry;
};
goog.Promise.prototype.removeEntryAfter_ = function(previous) {
  goog.asserts.assert(this.callbackEntries_);
  goog.asserts.assert(previous != null);
  if (previous.next == this.callbackEntriesTail_) {
    this.callbackEntriesTail_ = previous;
  }
  previous.next = previous.next.next;
};
goog.Promise.prototype.executeCallbacks_ = function() {
  var entry = null;
  while (entry = this.popEntry_()) {
    if (goog.Promise.LONG_STACK_TRACES) {
      this.currentStep_++;
    }
    this.executeCallback_(entry, this.state_, this.result_);
  }
  this.executing_ = false;
};
goog.Promise.prototype.executeCallback_ = function(callbackEntry, state, result) {
  if (state == goog.Promise.State_.REJECTED && callbackEntry.onRejected && !callbackEntry.always) {
    this.removeUnhandledRejection_();
  }
  if (callbackEntry.child) {
    callbackEntry.child.parent_ = null;
    goog.Promise.invokeCallback_(callbackEntry, state, result);
  } else {
    try {
      callbackEntry.always ? callbackEntry.onFulfilled.call(callbackEntry.context) : goog.Promise.invokeCallback_(callbackEntry, state, result);
    } catch (err) {
      goog.Promise.handleRejection_.call(null, err);
    }
  }
  goog.Promise.returnEntry_(callbackEntry);
};
goog.Promise.invokeCallback_ = function(callbackEntry, state, result) {
  if (state == goog.Promise.State_.FULFILLED) {
    callbackEntry.onFulfilled.call(callbackEntry.context, result);
  } else if (callbackEntry.onRejected) {
    callbackEntry.onRejected.call(callbackEntry.context, result);
  }
};
goog.Promise.prototype.addStackTrace_ = function(err) {
  if (goog.Promise.LONG_STACK_TRACES && typeof err.stack === "string") {
    var trace = err.stack.split("\n", 4)[3];
    var message = err.message;
    message += Array(11 - message.length).join(" ");
    this.stack_.push(message + trace);
  }
};
goog.Promise.prototype.appendLongStack_ = function(err) {
  if (goog.Promise.LONG_STACK_TRACES && err && typeof err.stack === "string" && this.stack_.length) {
    var longTrace = ["Promise trace:"];
    for (var promise = this; promise; promise = promise.parent_) {
      for (var i = this.currentStep_; i >= 0; i--) {
        longTrace.push(promise.stack_[i]);
      }
      longTrace.push("Value: " + "[" + (promise.state_ == goog.Promise.State_.REJECTED ? "REJECTED" : "FULFILLED") + "] " + "\x3c" + String(promise.result_) + "\x3e");
    }
    err.stack += "\n\n" + longTrace.join("\n");
  }
};
goog.Promise.prototype.removeUnhandledRejection_ = function() {
  if (goog.Promise.UNHANDLED_REJECTION_DELAY > 0) {
    for (var p = this; p && p.unhandledRejectionId_; p = p.parent_) {
      goog.global.clearTimeout(p.unhandledRejectionId_);
      p.unhandledRejectionId_ = 0;
    }
  } else if (goog.Promise.UNHANDLED_REJECTION_DELAY == 0) {
    for (var p = this; p && p.hadUnhandledRejection_; p = p.parent_) {
      p.hadUnhandledRejection_ = false;
    }
  }
};
goog.Promise.addUnhandledRejection_ = function(promise, reason) {
  if (goog.Promise.UNHANDLED_REJECTION_DELAY > 0) {
    promise.unhandledRejectionId_ = goog.global.setTimeout(function() {
      promise.appendLongStack_(reason);
      goog.Promise.handleRejection_.call(null, reason);
    }, goog.Promise.UNHANDLED_REJECTION_DELAY);
  } else if (goog.Promise.UNHANDLED_REJECTION_DELAY == 0) {
    promise.hadUnhandledRejection_ = true;
    goog.async.run(function() {
      if (promise.hadUnhandledRejection_) {
        promise.appendLongStack_(reason);
        goog.Promise.handleRejection_.call(null, reason);
      }
    });
  }
};
goog.Promise.handleRejection_ = goog.async.throwException;
goog.Promise.setUnhandledRejectionHandler = function(handler) {
  goog.Promise.handleRejection_ = handler;
};
goog.Promise.CancellationError = function(opt_message) {
  goog.Promise.CancellationError.base(this, "constructor", opt_message);
  this.reportErrorToServer = false;
};
goog.inherits(goog.Promise.CancellationError, goog.debug.Error);
goog.Promise.CancellationError.prototype.name = "cancel";
goog.Promise.Resolver_ = function(promise, resolve, reject) {
  this.promise = promise;
  this.resolve = resolve;
  this.reject = reject;
};

//# sourceMappingURL=goog.promise.promise.js.map
