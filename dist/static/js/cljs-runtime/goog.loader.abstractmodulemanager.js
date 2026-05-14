goog.provide("goog.loader.AbstractModuleManager");
goog.provide("goog.loader.AbstractModuleManager.CallbackType");
goog.require("goog.module.AbstractModuleLoader");
goog.require("goog.module.ModuleInfo");
goog.require("goog.module.ModuleLoadCallback");
goog.requireType("goog.html.TrustedResourceUrl");
goog.requireType("goog.module.BaseModule");
goog.loader.AbstractModuleManager = function() {
  this.moduleContext_ = null;
  this.loader_ = null;
};
goog.loader.AbstractModuleManager.CallbackType = {ERROR:"error", IDLE:"idle", ACTIVE:"active", USER_IDLE:"userIdle", USER_ACTIVE:"userActive"};
goog.loader.AbstractModuleManager.CORRUPT_RESPONSE_STATUS_CODE = 8001;
goog.loader.AbstractModuleManager.prototype.setBatchModeEnabled = function(enabled) {
};
goog.loader.AbstractModuleManager.prototype.setConcurrentLoadingEnabled = function(enabled) {
};
goog.loader.AbstractModuleManager.prototype.setAllModuleInfo = function(infoMap) {
};
goog.loader.AbstractModuleManager.prototype.setAllModuleInfoString = function(opt_info, opt_loadingModuleIds) {
};
goog.loader.AbstractModuleManager.prototype.getModuleInfo = function(id) {
};
goog.loader.AbstractModuleManager.prototype.addExtraEdge = function(fromModule, toModule) {
  throw new Error("addExtraEdge is not implemented.");
};
goog.loader.AbstractModuleManager.prototype.removeExtraEdge = function(fromModule, toModule) {
  throw new Error("removeExtraEdge is not implemented.");
};
goog.loader.AbstractModuleManager.prototype.setModuleTrustedUris = function(moduleUriMap) {
};
goog.loader.AbstractModuleManager.prototype.getLoader = function() {
  return this.loader_;
};
goog.loader.AbstractModuleManager.prototype.setLoader = function(loader) {
  this.loader_ = loader;
};
goog.loader.AbstractModuleManager.prototype.getModuleContext = function() {
  return this.moduleContext_;
};
goog.loader.AbstractModuleManager.prototype.setModuleContext = function(context) {
  this.moduleContext_ = context;
};
goog.loader.AbstractModuleManager.prototype.isActive = function() {
  return false;
};
goog.loader.AbstractModuleManager.prototype.isUserActive = function() {
  return false;
};
goog.loader.AbstractModuleManager.prototype.preloadModule = function(id, opt_timeout) {
};
goog.loader.AbstractModuleManager.prototype.prefetchModule = function(id) {
  throw new Error("prefetchModule is not implemented.");
};
goog.loader.AbstractModuleManager.prototype.setLoaded = function() {
};
goog.loader.AbstractModuleManager.prototype.isModuleLoading = function(id) {
};
goog.loader.AbstractModuleManager.prototype.execOnLoad = function(moduleId, fn, opt_handler, opt_noLoad, opt_userInitiated, opt_preferSynchronous) {
};
goog.loader.AbstractModuleManager.prototype.load = function(moduleId, opt_userInitiated) {
};
goog.loader.AbstractModuleManager.prototype.loadMultiple = function(moduleIds, opt_userInitiated) {
};
goog.loader.AbstractModuleManager.prototype.beforeLoadModuleCode = function(id) {
};
goog.loader.AbstractModuleManager.prototype.registerInitializationCallback = function(fn, opt_handler) {
};
goog.loader.AbstractModuleManager.prototype.registerLateInitializationCallback = function(fn, opt_handler) {
};
goog.loader.AbstractModuleManager.prototype.setModuleConstructor = function(fn) {
};
goog.loader.AbstractModuleManager.prototype.registerCallback = function(types, fn) {
};

//# sourceMappingURL=goog.loader.abstractmodulemanager.js.map
