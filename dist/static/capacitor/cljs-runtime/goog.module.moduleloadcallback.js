goog.provide("goog.module.ModuleLoadCallback");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.module");
goog.module.ModuleLoadCallback = function(fn, opt_handler) {
  this.fn_ = fn;
  this.handler_ = opt_handler;
};
goog.module.ModuleLoadCallback.prototype.execute = function(context) {
  if (this.fn_) {
    this.fn_.call(this.handler_ || null, context);
    this.handler_ = null;
    this.fn_ = null;
  }
};
goog.module.ModuleLoadCallback.prototype.abort = function() {
  this.fn_ = null;
  this.handler_ = null;
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.module.ModuleLoadCallback.prototype.execute = transformer(goog.module.ModuleLoadCallback.prototype.execute);
});

//# sourceMappingURL=goog.module.moduleloadcallback.js.map
