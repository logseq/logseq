goog.provide("goog.async.Deferred");
goog.provide("goog.async.Deferred.AlreadyCalledError");
goog.provide("goog.async.Deferred.CanceledError");
goog.require("goog.Promise");
goog.require("goog.Thenable");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug.Error");
goog.async.Deferred = function(opt_onCancelFunction, opt_defaultScope) {
  this.sequence_ = [];
  this.onCancelFunction_ = opt_onCancelFunction;
  this.defaultScope_ = opt_defaultScope || null;
  this.fired_ = false;
  this.hadError_ = false;
  this.result_ = undefined;
  this.blocked_ = false;
  this.blocking_ = false;
  this.silentlyCanceled_ = false;
  this.unhandledErrorId_ = 0;
  this.parent_ = null;
  this.branches_ = 0;
  if (goog.async.Deferred.LONG_STACK_TRACES) {
    this.constructorStack_ = null;
    if (Error.captureStackTrace) {
      const target = {stack:""};
      Error.captureStackTrace(target, goog.async.Deferred);
      if (typeof target.stack == "string") {
        this.constructorStack_ = target.stack.replace(/^[^\n]*\n/, "");
      }
    }
  }
};
goog.async.Deferred.STRICT_ERRORS = goog.define("goog.async.Deferred.STRICT_ERRORS", false);
goog.async.Deferred.LONG_STACK_TRACES = goog.define("goog.async.Deferred.LONG_STACK_TRACES", false);
goog.async.Deferred.prototype.cancel = function(opt_deepCancel) {
  if (!this.hasFired()) {
    if (this.parent_) {
      const parent = this.parent_;
      delete this.parent_;
      if (opt_deepCancel) {
        parent.cancel(opt_deepCancel);
      } else {
        parent.branchCancel_();
      }
    }
    if (this.onCancelFunction_) {
      this.onCancelFunction_.call(this.defaultScope_, this);
    } else {
      this.silentlyCanceled_ = true;
    }
    if (!this.hasFired()) {
      this.errback(new goog.async.Deferred.CanceledError(this));
    }
  } else if (this.result_ instanceof goog.async.Deferred) {
    this.result_.cancel();
  }
};
goog.async.Deferred.prototype.branchCancel_ = function() {
  this.branches_--;
  if (this.branches_ <= 0) {
    this.cancel();
  }
};
goog.async.Deferred.prototype.continue_ = function(isSuccess, res) {
  this.blocked_ = false;
  this.updateResult_(isSuccess, res);
};
goog.async.Deferred.prototype.updateResult_ = function(isSuccess, res) {
  this.fired_ = true;
  this.result_ = res;
  this.hadError_ = !isSuccess;
  this.fire_();
};
goog.async.Deferred.prototype.check_ = function() {
  if (this.hasFired()) {
    if (!this.silentlyCanceled_) {
      throw new goog.async.Deferred.AlreadyCalledError(this);
    }
    this.silentlyCanceled_ = false;
  }
};
goog.async.Deferred.prototype.callback = function(opt_result) {
  this.check_();
  this.assertNotDeferred_(opt_result);
  this.updateResult_(true, opt_result);
};
goog.async.Deferred.prototype.errback = function(opt_result) {
  this.check_();
  this.assertNotDeferred_(opt_result);
  this.makeStackTraceLong_(opt_result);
  this.updateResult_(false, opt_result);
};
goog.async.Deferred.unhandledErrorHandler_ = e => {
  throw e;
};
goog.async.Deferred.setUnhandledErrorHandler = function(handler) {
  goog.async.Deferred.unhandledErrorHandler_ = handler;
};
goog.async.Deferred.prototype.makeStackTraceLong_ = function(error) {
  if (!goog.async.Deferred.LONG_STACK_TRACES) {
    return;
  }
  if (this.constructorStack_ && goog.isObject(error) && error.stack && /^[^\n]+(\n   [^\n]+)+/.test(error.stack)) {
    error.stack = error.stack + "\nDEFERRED OPERATION:\n" + this.constructorStack_;
  }
};
goog.async.Deferred.prototype.assertNotDeferred_ = function(obj) {
  goog.asserts.assert(!(obj instanceof goog.async.Deferred), "An execution sequence may not be initiated with a blocking Deferred.");
};
goog.async.Deferred.prototype.addCallback = function(cb, opt_scope) {
  return this.addCallbacks(cb, null, opt_scope);
};
goog.async.Deferred.prototype.addErrback = function(eb, opt_scope) {
  return this.addCallbacks(null, eb, opt_scope);
};
goog.async.Deferred.prototype.addBoth = function(f, opt_scope) {
  return this.addCallbacks(f, f, opt_scope);
};
goog.async.Deferred.prototype.addFinally = function(f, opt_scope) {
  return this.addCallbacks(f, function(err) {
    const result = f.call(this, err);
    if (result === undefined) {
      throw err;
    }
    return result;
  }, opt_scope);
};
goog.async.Deferred.prototype.addCallbacks = function(cb, eb, opt_scope) {
  goog.asserts.assert(!this.blocking_, "Blocking Deferreds can not be re-used");
  this.sequence_.push([cb, eb, opt_scope]);
  if (this.hasFired()) {
    this.fire_();
  }
  return this;
};
goog.async.Deferred.prototype.then = function(opt_onFulfilled, opt_onRejected, opt_context) {
  let reject;
  let resolve;
  const promise = new goog.Promise(function(res, rej) {
    resolve = res;
    reject = rej;
  });
  this.addCallbacks(resolve, function(reason) {
    if (reason instanceof goog.async.Deferred.CanceledError) {
      promise.cancel();
    } else {
      reject(reason);
    }
    return goog.async.Deferred.CONVERTED_TO_PROMISE_;
  }, this);
  return promise.then(opt_onFulfilled, opt_onRejected, opt_context);
};
goog.Thenable.addImplementation(goog.async.Deferred);
goog.async.Deferred.prototype.chainDeferred = function(otherDeferred) {
  this.addCallbacks(otherDeferred.callback, otherDeferred.errback, otherDeferred);
  return this;
};
goog.async.Deferred.prototype.awaitDeferred = function(otherDeferred) {
  if (!(otherDeferred instanceof goog.async.Deferred)) {
    return this.addCallback(function() {
      return otherDeferred;
    });
  }
  return this.addCallback(goog.bind(otherDeferred.branch, otherDeferred));
};
goog.async.Deferred.prototype.branch = function(opt_propagateCancel) {
  const d = new goog.async.Deferred();
  this.chainDeferred(d);
  if (opt_propagateCancel) {
    d.parent_ = this;
    this.branches_++;
  }
  return d;
};
goog.async.Deferred.prototype.hasFired = function() {
  return this.fired_;
};
goog.async.Deferred.prototype.isError = function(res) {
  return res instanceof Error;
};
goog.async.Deferred.prototype.hasErrback_ = function() {
  return goog.array.some(this.sequence_, function(sequenceRow) {
    return typeof sequenceRow[1] === "function";
  });
};
goog.async.Deferred.prototype.getLastValueForMigration = function() {
  return this.hasFired() && !this.hadError_ ? this.result_ : undefined;
};
goog.async.Deferred.CONVERTED_TO_PROMISE_ = {};
goog.async.Deferred.prototype.fire_ = function() {
  if (this.unhandledErrorId_ && this.hasFired() && this.hasErrback_()) {
    goog.async.Deferred.unscheduleError_(this.unhandledErrorId_);
    this.unhandledErrorId_ = 0;
  }
  if (this.parent_) {
    this.parent_.branches_--;
    delete this.parent_;
  }
  let res = this.result_;
  let unhandledException = false;
  let isNewlyBlocked = false;
  let wasConvertedToPromise = false;
  while (this.sequence_.length && !this.blocked_) {
    wasConvertedToPromise = false;
    const sequenceEntry = this.sequence_.shift();
    const callback = sequenceEntry[0];
    const errback = sequenceEntry[1];
    const scope = sequenceEntry[2];
    const f = this.hadError_ ? errback : callback;
    if (f) {
      try {
        let ret = f.call(scope || this.defaultScope_, res);
        if (ret === goog.async.Deferred.CONVERTED_TO_PROMISE_) {
          wasConvertedToPromise = true;
          ret = undefined;
        }
        if (ret !== undefined) {
          this.hadError_ = this.hadError_ && (ret == res || this.isError(ret));
          this.result_ = res = ret;
        }
        if (goog.Thenable.isImplementedBy(res) || typeof goog.global["Promise"] === "function" && res instanceof goog.global["Promise"]) {
          isNewlyBlocked = true;
          this.blocked_ = true;
        }
      } catch (ex) {
        res = ex;
        this.hadError_ = true;
        this.makeStackTraceLong_(res);
        if (!this.hasErrback_()) {
          unhandledException = true;
        }
      }
    }
  }
  this.result_ = res;
  if (isNewlyBlocked) {
    const onCallback = goog.bind(this.continue_, this, true);
    const onErrback = goog.bind(this.continue_, this, false);
    if (res instanceof goog.async.Deferred) {
      res.addCallbacks(onCallback, onErrback);
      res.blocking_ = true;
    } else {
      res.then(onCallback, onErrback);
    }
  } else if (goog.async.Deferred.STRICT_ERRORS && !wasConvertedToPromise && this.isError(res) && !(res instanceof goog.async.Deferred.CanceledError)) {
    this.hadError_ = true;
    unhandledException = true;
  }
  if (unhandledException) {
    this.unhandledErrorId_ = goog.async.Deferred.scheduleError_(res);
  }
};
goog.async.Deferred.succeed = function(opt_result) {
  const d = new goog.async.Deferred();
  d.callback(opt_result);
  return d;
};
goog.async.Deferred.fromPromise = function(promise) {
  const d = new goog.async.Deferred();
  promise.then(function(value) {
    d.callback(value);
  }, function(error) {
    d.errback(error);
  });
  return d;
};
goog.async.Deferred.fail = function(res) {
  const d = new goog.async.Deferred();
  d.errback(res);
  return d;
};
goog.async.Deferred.canceled = function() {
  const d = new goog.async.Deferred();
  d.cancel();
  return d;
};
goog.async.Deferred.when = function(value, callback, opt_scope) {
  if (value instanceof goog.async.Deferred) {
    return value.branch(true).addCallback(callback, opt_scope);
  } else {
    return goog.async.Deferred.succeed(value).addCallback(callback, opt_scope);
  }
};
goog.async.Deferred.AlreadyCalledError = function(deferred) {
  goog.debug.Error.call(this);
  this.deferred = deferred;
};
goog.inherits(goog.async.Deferred.AlreadyCalledError, goog.debug.Error);
goog.async.Deferred.AlreadyCalledError.prototype.message = "Deferred has already fired";
goog.async.Deferred.AlreadyCalledError.prototype.name = "AlreadyCalledError";
goog.async.Deferred.CanceledError = function(deferred) {
  goog.debug.Error.call(this);
  this.deferred = deferred;
};
goog.inherits(goog.async.Deferred.CanceledError, goog.debug.Error);
goog.async.Deferred.CanceledError.prototype.message = "Deferred was canceled";
goog.async.Deferred.CanceledError.prototype.name = "CanceledError";
goog.async.Deferred.Error_ = function(error) {
  this.id_ = goog.global.setTimeout(goog.bind(this.throwError, this), 0);
  this.error_ = error;
};
goog.async.Deferred.Error_.prototype.throwError = function() {
  goog.asserts.assert(goog.async.Deferred.errorMap_[this.id_], "Cannot throw an error that is not scheduled.");
  delete goog.async.Deferred.errorMap_[this.id_];
  goog.async.Deferred.unhandledErrorHandler_(this.error_);
};
goog.async.Deferred.Error_.prototype.resetTimer = function() {
  goog.global.clearTimeout(this.id_);
};
goog.async.Deferred.errorMap_ = {};
goog.async.Deferred.scheduleError_ = function(error) {
  const deferredError = new goog.async.Deferred.Error_(error);
  goog.async.Deferred.errorMap_[deferredError.id_] = deferredError;
  return deferredError.id_;
};
goog.async.Deferred.unscheduleError_ = function(id) {
  const error = goog.async.Deferred.errorMap_[id];
  if (error) {
    error.resetTimer();
    delete goog.async.Deferred.errorMap_[id];
  }
};
goog.async.Deferred.assertNoErrors = function() {
  const map = goog.async.Deferred.errorMap_;
  for (let key in map) {
    const error = map[key];
    error.resetTimer();
    error.throwError();
  }
};

//# sourceMappingURL=goog.mochikit.async.deferred.js.map
