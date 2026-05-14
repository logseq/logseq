goog.provide("goog.module.ModuleManager");
goog.provide("goog.module.ModuleManager.CallbackType");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.async.Deferred");
goog.require("goog.debug.Error");
goog.require("goog.disposable.IDisposable");
goog.require("goog.disposeAll");
goog.require("goog.loader.AbstractModuleManager");
goog.require("goog.loader.activeModuleManager");
goog.require("goog.log");
goog.require("goog.module");
goog.require("goog.module.ModuleInfo");
goog.require("goog.module.ModuleLoadCallback");
goog.require("goog.module.ModuleLoadFailure");
goog.require("goog.object");
goog.requireType("goog.module.AbstractModuleLoader");
goog.scope(() => {
  const SYNTHETIC_MODULE_OVERHEAD_ID = "synthetic_module_overhead";
  goog.module.ModuleManager = function() {
    goog.module.ModuleManager.base(this, "constructor");
    this.moduleInfoMap = {};
    this.loadingModuleIds_ = [];
    this.requestedLoadingModuleIds_ = [];
    this.requestedModuleIds_ = [];
    this.requestedModuleIdsQueue_ = [];
    this.userInitiatedLoadingModuleIds_ = [];
    this.extraEdges_ = {};
    this.callbackMap_ = {};
    this.baseModuleInfo_ = new goog.module.ModuleInfo([], "");
    this.currentlyLoadingModule_ = this.baseModuleInfo_;
    this.lastInitialModuleId_ = null;
    this.initialModulesLoaded_ = new goog.async.Deferred();
    this.logger_ = goog.log.getLogger("goog.module.ModuleManager");
    this.batchModeEnabled_ = false;
    this.concurrentLoadingEnabled_ = false;
    this.consecutiveFailures_ = 0;
    this.lastActive_ = false;
    this.userLastActive_ = false;
    this.isDisposed_ = false;
  };
  goog.inherits(goog.module.ModuleManager, goog.loader.AbstractModuleManager);
  goog.module.ModuleManager.ModuleFailureError = function(moduleID, failureType) {
    const msg = `Error loading ${moduleID}: ${failureType}`;
    goog.module.ModuleManager.ModuleFailureError.base(this, "constructor", msg);
    this.failureType = failureType;
  };
  goog.inherits(goog.module.ModuleManager.ModuleFailureError, goog.debug.Error);
  goog.module.ModuleManager.CallbackType = goog.loader.AbstractModuleManager.CallbackType;
  goog.module.ModuleManager.CORRUPT_RESPONSE_STATUS_CODE = goog.loader.AbstractModuleManager.CORRUPT_RESPONSE_STATUS_CODE;
  goog.module.ModuleManager.getInstance = function() {
    return goog.loader.activeModuleManager.get();
  };
  goog.module.ModuleManager.prototype.setBatchModeEnabled = function(enabled) {
    this.batchModeEnabled_ = enabled;
  };
  goog.module.ModuleManager.prototype.setConcurrentLoadingEnabled = function(enabled) {
    this.concurrentLoadingEnabled_ = enabled;
  };
  goog.module.ModuleManager.prototype.setAllModuleInfo = function(infoMap) {
    for (var id in infoMap) {
      this.addOrUpdateModuleInfo_(id, infoMap[id]);
    }
    if (!this.initialModulesLoaded_.hasFired()) {
      this.initialModulesLoaded_.callback();
    }
    this.maybeFinishBaseLoad_();
  };
  goog.module.ModuleManager.prototype.setAllModuleInfoString = function(opt_info, opt_loadingModuleIds) {
    if (!(this instanceof goog.module.ModuleManager)) {
      this.setAllModuleInfoString(opt_info, opt_loadingModuleIds);
      return;
    }
    if (typeof opt_info !== "string") {
      return;
    }
    var modules = opt_info.split("/");
    var moduleIds = [];
    for (var i = 0; i < modules.length; i++) {
      var parts = modules[i].split(":");
      var id = parts[0];
      var deps;
      if (parts[1]) {
        deps = parts[1].split(",");
        for (var j = 0; j < deps.length; j++) {
          var index = parseInt(deps[j], 36);
          goog.asserts.assert(moduleIds[index], "No module @ %s, dep of %s @ %s", index, id, i);
          deps[j] = moduleIds[index];
        }
      } else {
        deps = [];
      }
      moduleIds.push(id);
      this.addOrUpdateModuleInfo_(id, deps);
    }
    if (opt_loadingModuleIds && opt_loadingModuleIds.length) {
      goog.array.extend(this.loadingModuleIds_, opt_loadingModuleIds);
      this.lastInitialModuleId_ = goog.array.peek(opt_loadingModuleIds);
    } else {
      if (!this.initialModulesLoaded_.hasFired()) {
        this.initialModulesLoaded_.callback();
      }
    }
    this.maybeFinishBaseLoad_();
  };
  goog.module.ModuleManager.SUBTRACTIVE_MODULE_LOADING = goog.define("goog.module.ModuleManager.SUBTRACTIVE_MODULE_LOADING", false);
  goog.module.ModuleManager.prototype.getModuleInfo = function(id) {
    if (goog.module.ModuleManager.SUBTRACTIVE_MODULE_LOADING && !(id in this.moduleInfoMap)) {
      this.moduleInfoMap[id] = new goog.module.ModuleInfo([], id);
    }
    return this.moduleInfoMap[id];
  };
  goog.module.ModuleManager.prototype.addExtraEdge = function(fromModule, toModule) {
    const moduleInfo = this.getModuleInfo(fromModule);
    if (moduleInfo && moduleInfo.isLoaded()) {
      this.load(toModule);
      return;
    }
    if (!this.extraEdges_[fromModule]) {
      this.extraEdges_[fromModule] = {};
    }
    this.extraEdges_[fromModule][toModule] = true;
  };
  goog.module.ModuleManager.prototype.removeExtraEdge = function(fromModule, toModule) {
    if (!this.extraEdges_[fromModule]) {
      return;
    }
    delete this.extraEdges_[fromModule][toModule];
    for (const nonEmptyEdge in this.extraEdges_[fromModule]) {
      return;
    }
    delete this.extraEdges_[fromModule];
  };
  goog.module.ModuleManager.prototype.setModuleTrustedUris = function(moduleUriMap) {
    for (var id in moduleUriMap) {
      this.moduleInfoMap[id].setTrustedUris(moduleUriMap[id]);
    }
  };
  goog.module.ModuleManager.prototype.setModuleContext = function(context) {
    goog.module.ModuleManager.base(this, "setModuleContext", context);
    this.maybeFinishBaseLoad_();
  };
  goog.module.ModuleManager.prototype.isActive = function() {
    return this.loadingModuleIds_.length > 0;
  };
  goog.module.ModuleManager.prototype.isUserActive = function() {
    return this.userInitiatedLoadingModuleIds_.length > 0;
  };
  goog.module.ModuleManager.prototype.dispatchActiveIdleChangeIfNeeded_ = function() {
    var lastActive = this.lastActive_;
    var active = this.isActive();
    if (active != lastActive) {
      this.executeCallbacks_(active ? goog.loader.AbstractModuleManager.CallbackType.ACTIVE : goog.loader.AbstractModuleManager.CallbackType.IDLE);
      this.lastActive_ = active;
    }
    var userLastActive = this.userLastActive_;
    var userActive = this.isUserActive();
    if (userActive != userLastActive) {
      this.executeCallbacks_(userActive ? goog.loader.AbstractModuleManager.CallbackType.USER_ACTIVE : goog.loader.AbstractModuleManager.CallbackType.USER_IDLE);
      this.userLastActive_ = userActive;
    }
  };
  goog.module.ModuleManager.prototype.preloadModule = function(id, opt_timeout) {
    var d = new goog.async.Deferred();
    goog.global.setTimeout(goog.bind(this.addLoadModule_, this, id, d), opt_timeout || 0);
    return d;
  };
  goog.module.ModuleManager.prototype.prefetchModule = function(id) {
    if (this.batchModeEnabled_) {
      throw new Error("Modules prefetching is not supported in batch mode");
    } else {
      var idWithDeps = this.getNotYetLoadedTransitiveDepIds_(id);
      for (var i = 0; i < idWithDeps.length; i++) {
        const moduleInfoOfDep = this.getModuleInfo(idWithDeps[i]);
        this.getLoader().prefetchModule(idWithDeps[i], moduleInfoOfDep);
      }
    }
  };
  goog.module.ModuleManager.prototype.addLoadModule_ = function(id, d) {
    var moduleInfo = this.getModuleInfo(id);
    if (moduleInfo.isLoaded()) {
      d.callback(this.getModuleContext());
      return;
    }
    this.registerModuleLoadCallbacks_(id, moduleInfo, false, d);
    if (!this.isModuleLoading(id)) {
      this.loadModulesOrEnqueue_([id]);
    }
  };
  goog.module.ModuleManager.prototype.addOrUpdateModuleInfo_ = function(id, deps) {
    if (this.moduleInfoMap[id]) {
      const moduleDeps = this.moduleInfoMap[id].getDependencies();
      if (moduleDeps != deps) {
        moduleDeps.splice(0, moduleDeps.length, ...deps);
      }
    } else {
      this.moduleInfoMap[id] = new goog.module.ModuleInfo(deps, id);
    }
  };
  goog.module.ModuleManager.prototype.loadModulesOrEnqueueIfNotLoadedOrLoading_ = function(ids, opt_userInitiated) {
    var uniqueIds = [];
    goog.array.removeDuplicates(ids, uniqueIds);
    var idsToLoad = [];
    var deferredMap = {};
    for (var i = 0; i < uniqueIds.length; i++) {
      var id = uniqueIds[i];
      var moduleInfo = this.getModuleInfo(id);
      if (!moduleInfo) {
        throw new Error("Unknown module: " + id);
      }
      var d = new goog.async.Deferred();
      deferredMap[id] = d;
      if (moduleInfo.isLoaded()) {
        d.callback(this.getModuleContext());
      } else {
        this.registerModuleLoadCallbacks_(id, moduleInfo, !!opt_userInitiated, d);
        if (!this.isModuleLoading(id)) {
          idsToLoad.push(id);
        }
      }
    }
    if (idsToLoad.length > 0) {
      this.loadModulesOrEnqueue_(idsToLoad);
    }
    return deferredMap;
  };
  goog.module.ModuleManager.prototype.registerModuleLoadCallbacks_ = function(id, moduleInfo, userInitiated, d) {
    moduleInfo.registerCallback(d.callback, d);
    moduleInfo.registerErrback(function(err) {
      d.errback(new goog.module.ModuleManager.ModuleFailureError(id, err));
    });
    if (this.isModuleLoading(id)) {
      if (userInitiated) {
        goog.log.fine(this.logger_, "User initiated module already loading: " + id);
        this.addUserInitiatedLoadingModule_(id);
        this.dispatchActiveIdleChangeIfNeeded_();
      }
    } else {
      if (userInitiated) {
        goog.log.fine(this.logger_, "User initiated module load: " + id);
        this.addUserInitiatedLoadingModule_(id);
      } else {
        goog.log.fine(this.logger_, "Initiating module load: " + id);
      }
    }
  };
  goog.module.ModuleManager.prototype.loadModulesOrEnqueue_ = function(ids) {
    if (this.concurrentLoadingEnabled_) {
      this.initialModulesLoaded_.addCallback(goog.bind(this.loadModules_, this, ids));
    } else {
      if (this.loadingModuleIds_.length === 0) {
        this.loadModules_(ids);
      } else {
        this.requestedModuleIdsQueue_.push(ids);
        this.dispatchActiveIdleChangeIfNeeded_();
      }
    }
  };
  goog.module.ModuleManager.prototype.getBackOff_ = function() {
    return Math.pow(this.consecutiveFailures_, 2) * 5000;
  };
  goog.module.ModuleManager.prototype.loadModules_ = function(ids, opt_isRetry, opt_forceReload) {
    if (!opt_isRetry) {
      this.consecutiveFailures_ = 0;
    }
    var idsToLoadImmediately = this.processModulesForLoad_(ids);
    goog.log.fine(this.logger_, "Loading module(s): " + idsToLoadImmediately);
    if (this.concurrentLoadingEnabled_) {
      goog.array.extend(this.loadingModuleIds_, idsToLoadImmediately);
    } else {
      this.loadingModuleIds_ = idsToLoadImmediately;
    }
    if (this.batchModeEnabled_) {
      this.requestedLoadingModuleIds_ = ids;
    } else {
      this.requestedLoadingModuleIds_ = goog.array.clone(idsToLoadImmediately);
    }
    this.dispatchActiveIdleChangeIfNeeded_();
    if (idsToLoadImmediately.length === 0) {
      return;
    }
    this.requestedModuleIds_.push.apply(this.requestedModuleIds_, idsToLoadImmediately);
    if (Object.keys(this.extraEdges_).length > 0 && !this.getLoader().supportsExtraEdges) {
      throw new Error("Extra edges are not supported by the module loader.");
    }
    var loadFn = goog.bind(this.getLoader().loadModules, goog.asserts.assert(this.getLoader()), goog.array.clone(idsToLoadImmediately), goog.asserts.assert(this.moduleInfoMap), {extraEdges:this.extraEdges_, forceReload:!!opt_forceReload, onError:status => this.handleLoadError_(this.requestedLoadingModuleIds_, idsToLoadImmediately, status != null ? status : undefined), onTimeout:goog.bind(this.handleLoadTimeout_, this),});
    var delay = this.getBackOff_();
    if (delay) {
      goog.global.setTimeout(loadFn, delay);
    } else {
      loadFn();
    }
  };
  goog.module.ModuleManager.prototype.processModulesForLoad_ = function(ids) {
    ids = ids.filter(id => {
      let moduleInfo = this.moduleInfoMap[id];
      if (moduleInfo.isLoaded()) {
        goog.global.setTimeout(() => new Error("Module already loaded: " + id), 0);
        return false;
      }
      return true;
    });
    var idsWithDeps = [];
    for (var i = 0; i < ids.length; i++) {
      idsWithDeps = idsWithDeps.concat(this.getNotYetLoadedTransitiveDepIds_(ids[i]));
    }
    goog.array.removeDuplicates(idsWithDeps);
    if (!this.batchModeEnabled_ && idsWithDeps.length > 1) {
      var idToLoad = idsWithDeps.shift();
      goog.log.fine(this.logger_, "Must load " + idToLoad + " module before " + ids);
      var queuedModules = idsWithDeps.map(function(id) {
        return [id];
      });
      this.requestedModuleIdsQueue_ = queuedModules.concat(this.requestedModuleIdsQueue_);
      return [idToLoad];
    } else {
      return idsWithDeps;
    }
  };
  goog.module.ModuleManager.prototype.getNotYetLoadedTransitiveDepIds_ = function(id) {
    var requestedModuleSet = goog.object.createSet(this.requestedModuleIds_);
    var ids = [];
    if (!requestedModuleSet[id]) {
      ids.push(id);
    }
    var depIdLookupList = [id];
    for (var i = 0; i < depIdLookupList.length; i++) {
      var depIds = this.getModuleInfo(depIdLookupList[i]).getDependencies();
      for (var j = depIds.length - 1; j >= 0; j--) {
        var depId = depIds[j];
        if (!this.getModuleInfo(depId).isLoaded() && !requestedModuleSet[depId]) {
          ids.push(depId);
          depIdLookupList.push(depId);
        }
      }
    }
    ids.reverse();
    goog.array.removeDuplicates(ids);
    return ids;
  };
  goog.module.ModuleManager.prototype.maybeFinishBaseLoad_ = function() {
    if (this.currentlyLoadingModule_ == this.baseModuleInfo_) {
      this.currentlyLoadingModule_ = null;
      const error = this.baseModuleInfo_.onLoad(goog.bind(this.getModuleContext, this));
      if (error) {
        this.dispatchModuleLoadFailed_(new goog.module.ModuleLoadFailure(goog.module.ModuleLoadFailure.Type.INIT_ERROR));
      }
      this.dispatchActiveIdleChangeIfNeeded_();
    }
  };
  goog.module.ModuleManager.prototype.setLoaded = function() {
    if (!this.currentlyLoadingModule_) {
      goog.log.error(this.logger_, "setLoaded called while no module is actively loading");
      return;
    }
    const id = this.currentlyLoadingModule_.getId();
    const modulesToLoad = [];
    if (this.extraEdges_[id]) {
      for (const dest of Object.keys(this.extraEdges_[id])) {
        const moduleInfo = this.getModuleInfo(dest);
        if (moduleInfo && !moduleInfo.isLoaded()) {
          this.removeExtraEdge(id, dest);
          modulesToLoad.push(dest);
        }
      }
      this.loadMultiple(modulesToLoad);
    }
    if (this.isDisposed()) {
      goog.log.warning(this.logger_, "Module loaded after module manager was disposed: " + id);
      return;
    }
    goog.log.fine(this.logger_, "Module loaded: " + id);
    const error = this.moduleInfoMap[id].onLoad(goog.bind(this.getModuleContext, this));
    if (error) {
      this.dispatchModuleLoadFailed_(new goog.module.ModuleLoadFailure(goog.module.ModuleLoadFailure.Type.INIT_ERROR));
    }
    goog.array.remove(this.userInitiatedLoadingModuleIds_, id);
    goog.array.remove(this.loadingModuleIds_, id);
    if (this.loadingModuleIds_.length === 0) {
      this.loadNextModules_();
    }
    if (this.lastInitialModuleId_ && id == this.lastInitialModuleId_) {
      if (!this.initialModulesLoaded_.hasFired()) {
        this.initialModulesLoaded_.callback();
      }
    }
    this.dispatchActiveIdleChangeIfNeeded_();
    this.currentlyLoadingModule_ = null;
  };
  goog.module.ModuleManager.prototype.isModuleLoading = function(id) {
    if (goog.array.contains(this.loadingModuleIds_, id)) {
      return true;
    }
    for (var i = 0; i < this.requestedModuleIdsQueue_.length; i++) {
      if (goog.array.contains(this.requestedModuleIdsQueue_[i], id)) {
        return true;
      }
    }
    return false;
  };
  goog.module.ModuleManager.prototype.execOnLoad = function(moduleId, fn, opt_handler, opt_noLoad, opt_userInitiated, opt_preferSynchronous) {
    var moduleInfo = this.moduleInfoMap[moduleId];
    var callbackWrapper;
    if (moduleInfo.isLoaded()) {
      goog.log.fine(this.logger_, moduleId + " module already loaded");
      callbackWrapper = new goog.module.ModuleLoadCallback(fn, opt_handler);
      if (opt_preferSynchronous) {
        callbackWrapper.execute(this.getModuleContext());
      } else {
        goog.global.setTimeout(goog.bind(callbackWrapper.execute, callbackWrapper), 0);
      }
    } else if (this.isModuleLoading(moduleId)) {
      goog.log.fine(this.logger_, moduleId + " module already loading");
      callbackWrapper = moduleInfo.registerCallback(fn, opt_handler);
      if (opt_userInitiated) {
        goog.log.fine(this.logger_, "User initiated module already loading: " + moduleId);
        this.addUserInitiatedLoadingModule_(moduleId);
        this.dispatchActiveIdleChangeIfNeeded_();
      }
    } else {
      goog.log.fine(this.logger_, "Registering callback for module: " + moduleId);
      callbackWrapper = moduleInfo.registerCallback(fn, opt_handler);
      if (!opt_noLoad) {
        if (opt_userInitiated) {
          goog.log.fine(this.logger_, "User initiated module load: " + moduleId);
          this.addUserInitiatedLoadingModule_(moduleId);
        }
        goog.log.fine(this.logger_, "Initiating module load: " + moduleId);
        this.loadModulesOrEnqueue_([moduleId]);
      }
    }
    return callbackWrapper;
  };
  goog.module.ModuleManager.prototype.load = function(moduleId, opt_userInitiated) {
    return this.loadModulesOrEnqueueIfNotLoadedOrLoading_([moduleId], opt_userInitiated)[moduleId];
  };
  goog.module.ModuleManager.prototype.loadMultiple = function(moduleIds, opt_userInitiated) {
    return this.loadModulesOrEnqueueIfNotLoadedOrLoading_(moduleIds, opt_userInitiated);
  };
  goog.module.ModuleManager.prototype.addUserInitiatedLoadingModule_ = function(id) {
    if (!goog.array.contains(this.userInitiatedLoadingModuleIds_, id)) {
      this.userInitiatedLoadingModuleIds_.push(id);
    }
  };
  goog.module.ModuleManager.prototype.beforeLoadModuleCode = function(id) {
    if (this.currentlyLoadingModule_ && this.currentlyLoadingModule_.getId() === SYNTHETIC_MODULE_OVERHEAD_ID) {
      this.setLoaded();
      delete this.moduleInfoMap[SYNTHETIC_MODULE_OVERHEAD_ID];
    } else if (this.currentlyLoadingModule_) {
      goog.log.error(this.logger_, 'beforeLoadModuleCode called with module "' + id + '" while module "' + this.currentlyLoadingModule_.getId() + '" is loading');
    }
    if (this.moduleInfoMap[id]) {
      this.visitDependencies_(this.moduleInfoMap[id].getDependencies() || [], moduleInfo => {
        moduleInfo.setLoaded();
        goog.array.remove(this.loadingModuleIds_, moduleInfo.getId());
      }, moduleInfo => !moduleInfo.isLoaded());
    }
    this.currentlyLoadingModule_ = this.getModuleInfo(id);
  };
  goog.module.ModuleManager.prototype.registerInitializationCallback = function(fn, opt_handler) {
    if (!this.currentlyLoadingModule_) {
      this.moduleInfoMap[SYNTHETIC_MODULE_OVERHEAD_ID] = new goog.module.ModuleInfo([], SYNTHETIC_MODULE_OVERHEAD_ID);
      this.currentlyLoadingModule_ = this.moduleInfoMap[SYNTHETIC_MODULE_OVERHEAD_ID];
      goog.log.fine(this.logger_, "registerInitializationCallback called in synthetic module");
    }
    this.currentlyLoadingModule_.registerEarlyCallback(fn, opt_handler);
  };
  goog.module.ModuleManager.prototype.registerLateInitializationCallback = function(fn, opt_handler) {
    if (!this.currentlyLoadingModule_) {
      this.moduleInfoMap[SYNTHETIC_MODULE_OVERHEAD_ID] = new goog.module.ModuleInfo([], SYNTHETIC_MODULE_OVERHEAD_ID);
      this.currentlyLoadingModule_ = this.moduleInfoMap[SYNTHETIC_MODULE_OVERHEAD_ID];
      goog.log.fine(this.logger_, "registerInitializationCallback called in synthetic module");
    }
    this.currentlyLoadingModule_.registerCallback(fn, opt_handler);
  };
  goog.module.ModuleManager.prototype.setModuleConstructor = function(fn) {
    if (!this.currentlyLoadingModule_) {
      goog.log.error(this.logger_, "No module is currently loading");
      return;
    } else if (this.currentlyLoadingModule_.getId() === SYNTHETIC_MODULE_OVERHEAD_ID) {
      goog.log.error(this.logger_, "Cannot set module constructor for synthetic module");
      return;
    }
    this.currentlyLoadingModule_.setModuleConstructor(fn);
  };
  goog.module.ModuleManager.prototype.handleLoadError_ = function(requestedLoadingModuleIds, requestedModuleIdsWithDeps, status = undefined) {
    this.consecutiveFailures_++;
    this.requestedLoadingModuleIds_ = requestedLoadingModuleIds;
    requestedModuleIdsWithDeps.forEach(goog.partial(goog.array.remove, this.requestedModuleIds_), this);
    if (status == 401) {
      goog.log.info(this.logger_, "Module loading unauthorized");
      this.dispatchModuleLoadFailed_(new goog.module.ModuleLoadFailure(goog.module.ModuleLoadFailure.Type.UNAUTHORIZED, status));
      this.requestedModuleIdsQueue_.length = 0;
    } else if (status == 410) {
      this.requeueBatchOrDispatchFailure_(new goog.module.ModuleLoadFailure(goog.module.ModuleLoadFailure.Type.OLD_CODE_GONE, status));
      this.loadNextModules_();
    } else if (this.consecutiveFailures_ >= 3) {
      goog.log.info(this.logger_, "Aborting after failure to load: " + this.loadingModuleIds_);
      this.requeueBatchOrDispatchFailure_(new goog.module.ModuleLoadFailure(goog.module.ModuleLoadFailure.Type.CONSECUTIVE_FAILURES, status));
      this.loadNextModules_();
    } else {
      goog.log.info(this.logger_, "Retrying after failure to load: " + this.loadingModuleIds_);
      var forceReload = status == goog.loader.AbstractModuleManager.CORRUPT_RESPONSE_STATUS_CODE;
      this.loadModules_(this.requestedLoadingModuleIds_, true, forceReload);
    }
  };
  goog.module.ModuleManager.prototype.handleLoadTimeout_ = function() {
    goog.log.info(this.logger_, "Aborting after timeout: " + this.loadingModuleIds_);
    this.requeueBatchOrDispatchFailure_(new goog.module.ModuleLoadFailure(goog.module.ModuleLoadFailure.Type.TIMEOUT));
    this.loadNextModules_();
  };
  goog.module.ModuleManager.prototype.requeueBatchOrDispatchFailure_ = function(cause) {
    if (this.requestedLoadingModuleIds_.length > 1) {
      var queuedModules = this.requestedLoadingModuleIds_.map(function(id) {
        return [id];
      });
      this.requestedModuleIdsQueue_ = queuedModules.concat(this.requestedModuleIdsQueue_);
    } else {
      this.dispatchModuleLoadFailed_(cause);
    }
  };
  goog.module.ModuleManager.prototype.dispatchModuleLoadFailed_ = function(cause) {
    var failedIds = this.requestedLoadingModuleIds_;
    this.loadingModuleIds_.length = 0;
    var idsToCancel = [];
    for (var i = 0; i < this.requestedModuleIdsQueue_.length; i++) {
      var dependentModules = this.requestedModuleIdsQueue_[i].filter(function(requestedId) {
        var requestedDeps = this.getNotYetLoadedTransitiveDepIds_(requestedId);
        return goog.array.some(failedIds, function(id) {
          return goog.array.contains(requestedDeps, id);
        });
      }, this);
      goog.array.extend(idsToCancel, dependentModules);
    }
    for (var i = 0; i < failedIds.length; i++) {
      goog.array.insert(idsToCancel, failedIds[i]);
    }
    for (var i = 0; i < idsToCancel.length; i++) {
      for (var j = 0; j < this.requestedModuleIdsQueue_.length; j++) {
        goog.array.remove(this.requestedModuleIdsQueue_[j], idsToCancel[i]);
      }
      goog.array.remove(this.userInitiatedLoadingModuleIds_, idsToCancel[i]);
    }
    var errorCallbacks = this.callbackMap_[goog.loader.AbstractModuleManager.CallbackType.ERROR];
    if (errorCallbacks) {
      for (var i = 0; i < errorCallbacks.length; i++) {
        var callback = errorCallbacks[i];
        for (var j = 0; j < idsToCancel.length; j++) {
          callback(goog.loader.AbstractModuleManager.CallbackType.ERROR, idsToCancel[j], cause);
        }
      }
    }
    for (var i = 0; i < failedIds.length; i++) {
      if (this.moduleInfoMap[failedIds[i]]) {
        this.moduleInfoMap[failedIds[i]].onError(cause);
      }
    }
    this.requestedLoadingModuleIds_.length = 0;
    this.dispatchActiveIdleChangeIfNeeded_();
  };
  goog.module.ModuleManager.prototype.loadNextModules_ = function() {
    while (this.requestedModuleIdsQueue_.length) {
      var nextIds = this.requestedModuleIdsQueue_.shift().filter(function(id) {
        return !this.getModuleInfo(id).isLoaded();
      }, this);
      if (nextIds.length > 0) {
        this.loadModules_(nextIds);
        return;
      }
    }
    this.dispatchActiveIdleChangeIfNeeded_();
  };
  goog.module.ModuleManager.prototype.registerCallback = function(types, fn) {
    if (!Array.isArray(types)) {
      types = [types];
    }
    for (var i = 0; i < types.length; i++) {
      this.registerCallback_(types[i], fn);
    }
  };
  goog.module.ModuleManager.prototype.registerCallback_ = function(type, fn) {
    var callbackMap = this.callbackMap_;
    if (!callbackMap[type]) {
      callbackMap[type] = [];
    }
    callbackMap[type].push(fn);
  };
  goog.module.ModuleManager.prototype.executeCallbacks_ = function(type) {
    var callbacks = this.callbackMap_[type];
    for (var i = 0; callbacks && i < callbacks.length; i++) {
      callbacks[i](type);
    }
  };
  goog.module.ModuleManager.prototype.visitDependencies_ = function(ids, visitorFn, visitConditionFn = () => true, visited = {}) {
    for (const id of ids) {
      const moduleInfo = this.getModuleInfo(id);
      if (visited[id] || !visitConditionFn(moduleInfo)) {
        continue;
      }
      visited[id] = true;
      this.visitDependencies_(moduleInfo.getDependencies() || [], visitorFn, visitConditionFn, visited);
      visitorFn(moduleInfo);
    }
  };
  goog.module.ModuleManager.prototype.dispose = function() {
    goog.disposeAll(goog.object.getValues(this.moduleInfoMap), this.baseModuleInfo_);
    this.moduleInfoMap = {};
    this.loadingModuleIds_ = [];
    this.requestedLoadingModuleIds_ = [];
    this.userInitiatedLoadingModuleIds_ = [];
    this.requestedModuleIdsQueue_ = [];
    this.callbackMap_ = {};
    this.isDisposed_ = true;
  };
  goog.module.ModuleManager.prototype.isDisposed = function() {
    return this.isDisposed_;
  };
  goog.loader.activeModuleManager.setDefault(function() {
    return new goog.module.ModuleManager();
  });
});

//# sourceMappingURL=goog.module.modulemanager.js.map
