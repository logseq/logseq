goog.provide("goog.module.ModuleInfo");
goog.require("goog.Disposable");
goog.require("goog.async.throwException");
goog.require("goog.dispose");
goog.require("goog.functions");
goog.require("goog.html.TrustedResourceUrl");
goog.require("goog.module");
goog.require("goog.module.BaseModule");
goog.require("goog.module.ModuleLoadCallback");
goog.requireType("goog.module.ModuleLoadFailure");
goog.module.ModuleInfo = function(deps, id) {
  goog.Disposable.call(this);
  this.deps_ = deps;
  this.id_ = id;
  this.onloadCallbacks_ = [];
  this.onErrorCallbacks_ = [];
  this.earlyOnloadCallbacks_ = [];
};
goog.inherits(goog.module.ModuleInfo, goog.Disposable);
goog.module.ModuleInfo.prototype.uris_ = null;
goog.module.ModuleInfo.prototype.moduleConstructor_ = goog.module.BaseModule;
goog.module.ModuleInfo.prototype.module_ = null;
goog.module.ModuleInfo.prototype.getDependencies = function() {
  return this.deps_;
};
goog.module.ModuleInfo.prototype.getId = function() {
  return this.id_;
};
goog.module.ModuleInfo.prototype.setTrustedUris = function(uris) {
  this.uris_ = uris;
};
goog.module.ModuleInfo.prototype.getUris = function() {
  if (!this.uris_) {
    this.uris_ = [];
  }
  return this.uris_;
};
goog.module.ModuleInfo.prototype.setModuleConstructor = function(constructor) {
  if (this.moduleConstructor_ === goog.module.BaseModule) {
    this.moduleConstructor_ = constructor;
  } else {
    throw new Error("Cannot set module constructor more than once.");
  }
};
goog.module.ModuleInfo.prototype.registerEarlyCallback = function(fn, opt_handler) {
  return this.registerCallback_(this.earlyOnloadCallbacks_, fn, opt_handler);
};
goog.module.ModuleInfo.prototype.registerCallback = function(fn, opt_handler) {
  return this.registerCallback_(this.onloadCallbacks_, fn, opt_handler);
};
goog.module.ModuleInfo.prototype.registerErrback = function(fn, opt_handler) {
  return this.registerCallback_(this.onErrorCallbacks_, fn, opt_handler);
};
goog.module.ModuleInfo.prototype.registerCallback_ = function(callbacks, fn, opt_handler) {
  var callback = new goog.module.ModuleLoadCallback(fn, opt_handler);
  callbacks.push(callback);
  return callback;
};
goog.module.ModuleInfo.prototype.isLoaded = function() {
  return !!this.module_;
};
goog.module.ModuleInfo.prototype.setLoaded = function() {
  this.module_ = new goog.module.BaseModule();
};
goog.module.ModuleInfo.prototype.getModule = function() {
  return this.module_;
};
goog.module.ModuleInfo.prototype.onLoad = function(contextProvider) {
  var module = new this.moduleConstructor_();
  module.initialize(contextProvider());
  this.module_ = module;
  var errors = !!this.callCallbacks_(this.earlyOnloadCallbacks_, contextProvider());
  errors = errors || !!this.callCallbacks_(this.onloadCallbacks_, contextProvider());
  if (!errors) {
    this.onErrorCallbacks_.length = 0;
  }
  return errors;
};
goog.module.ModuleInfo.prototype.onError = function(cause) {
  var result = this.callCallbacks_(this.onErrorCallbacks_, cause);
  if (result) {
    goog.global.setTimeout(goog.functions.error("Module errback failures: " + result), 0);
  }
  this.earlyOnloadCallbacks_.length = 0;
  this.onloadCallbacks_.length = 0;
};
goog.module.ModuleInfo.prototype.callCallbacks_ = function(callbacks, context) {
  var errors = [];
  for (var i = 0; i < callbacks.length; i++) {
    try {
      callbacks[i].execute(context);
    } catch (e) {
      goog.async.throwException(e);
      errors.push(e);
    }
  }
  callbacks.length = 0;
  return errors.length ? errors : null;
};
goog.module.ModuleInfo.prototype.disposeInternal = function() {
  goog.module.ModuleInfo.superClass_.disposeInternal.call(this);
  goog.dispose(this.module_);
};

//# sourceMappingURL=goog.module.moduleinfo.js.map
