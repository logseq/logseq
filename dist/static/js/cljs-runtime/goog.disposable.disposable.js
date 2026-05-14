goog.provide("goog.Disposable");
goog.require("goog.disposable.IDisposable");
goog.require("goog.dispose");
goog.require("goog.disposeAll");
goog.Disposable = function() {
  this.creationStack;
  if (goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF) {
    if (goog.Disposable.INCLUDE_STACK_ON_CREATION) {
      this.creationStack = (new Error()).stack;
    }
    goog.Disposable.instances_[goog.getUid(this)] = this;
  }
  this.disposed_ = this.disposed_;
  this.onDisposeCallbacks_ = this.onDisposeCallbacks_;
};
goog.Disposable.MonitoringMode = {OFF:0, PERMANENT:1, INTERACTIVE:2};
goog.Disposable.MONITORING_MODE = goog.define("goog.Disposable.MONITORING_MODE", 0);
goog.Disposable.INCLUDE_STACK_ON_CREATION = goog.define("goog.Disposable.INCLUDE_STACK_ON_CREATION", true);
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for (var id in goog.Disposable.instances_) {
    if (goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)]);
    }
  }
  return ret;
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {};
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.onDisposeCallbacks_;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_;
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if (!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if (goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF) {
      var uid = goog.getUid(this);
      if (goog.Disposable.MONITORING_MODE == goog.Disposable.MonitoringMode.PERMANENT && !goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw new Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      if (goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF && this.onDisposeCallbacks_ && this.onDisposeCallbacks_.length > 0) {
        throw new Error(this + " did not empty its onDisposeCallbacks queue. This " + "probably means it overrode dispose() or disposeInternal() " + "without calling the superclass' method.");
      }
      delete goog.Disposable.instances_[uid];
    }
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  this.addOnDisposeCallback(goog.partial(goog.dispose, disposable));
};
goog.Disposable.prototype.addOnDisposeCallback = function(callback, opt_scope) {
  if (this.disposed_) {
    opt_scope !== undefined ? callback.call(opt_scope) : callback();
    return;
  }
  if (!this.onDisposeCallbacks_) {
    this.onDisposeCallbacks_ = [];
  }
  this.onDisposeCallbacks_.push(opt_scope !== undefined ? goog.bind(callback, opt_scope) : callback);
};
goog.Disposable.prototype.disposeInternal = function() {
  if (this.onDisposeCallbacks_) {
    while (this.onDisposeCallbacks_.length) {
      this.onDisposeCallbacks_.shift()();
    }
  }
};
goog.Disposable.isDisposed = function(obj) {
  if (obj && typeof obj.isDisposed == "function") {
    return obj.isDisposed();
  }
  return false;
};

//# sourceMappingURL=goog.disposable.disposable.js.map
