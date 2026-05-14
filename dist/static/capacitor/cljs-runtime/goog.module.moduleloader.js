goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.module.ModuleLoader");
  const AbstractModuleLoader = goog.require("goog.module.AbstractModuleLoader");
  const BulkLoader = goog.require("goog.net.BulkLoader");
  const EventHandler = goog.require("goog.events.EventHandler");
  const EventId = goog.require("goog.events.EventId");
  const EventTarget = goog.require("goog.events.EventTarget");
  const EventType = goog.require("goog.net.EventType");
  const GoogEvent = goog.require("goog.events.Event");
  const ModuleInfo = goog.requireType("goog.module.ModuleInfo");
  const SafeScript = goog.require("goog.html.SafeScript");
  const TagName = goog.require("goog.dom.TagName");
  const Timer = goog.require("goog.Timer");
  const TrustedResourceUrl = goog.require("goog.html.TrustedResourceUrl");
  const asserts = goog.require("goog.asserts");
  const browser = goog.require("goog.labs.userAgent.browser");
  const dom = goog.require("goog.dom");
  const events = goog.require("goog.events");
  const functions = goog.require("goog.functions");
  const googArray = goog.require("goog.array");
  const jsloader = goog.require("goog.net.jsloader");
  const legacyconversions = goog.require("goog.html.legacyconversions");
  const log = goog.require("goog.log");
  const product = goog.require("goog.userAgent.product");
  const safe = goog.require("goog.dom.safe");
  const userAgent = goog.require("goog.userAgent");
  function ModuleLoader() {
    ModuleLoader.base(this, "constructor");
    this.eventHandler_ = new EventHandler(this);
    this.registerDisposable(this.eventHandler_);
    this.loadingModulesStatus_ = {};
  }
  goog.inherits(ModuleLoader, EventTarget);
  ModuleLoader.prototype.logger = log.getLogger("goog.module.ModuleLoader");
  ModuleLoader.prototype.debugMode_ = false;
  ModuleLoader.prototype.sourceUrlInjection_ = false;
  ModuleLoader.prototype.useScriptTags_ = false;
  ModuleLoader.supportsSourceUrlStackTraces = function() {
    return product.CHROME || browser.isFirefox() && browser.isVersionOrHigher("36");
  };
  ModuleLoader.supportsSourceUrlDebugger = function() {
    return product.CHROME || userAgent.GECKO;
  };
  ModuleLoader.URL_MAX_LENGTH_ = 4043;
  ModuleLoader.SYNTAX_OR_NETWORK_ERROR_CODE_ = -1;
  ModuleLoader.createScriptElement_ = function(url) {
    const script = dom.createElement(TagName.SCRIPT);
    safe.setScriptSrc(script, url);
    script.async = false;
    return script;
  };
  ModuleLoader.createPreloadScriptElement_ = function(url) {
    const link = dom.createElement(TagName.LINK);
    safe.setLinkHrefAndRel(link, url, "preload");
    link.as = "script";
    const nonce = safe.getScriptNonce();
    if (nonce) {
      link.setAttribute("nonce", nonce);
    }
    return link;
  };
  ModuleLoader.prototype.getDebugMode = function() {
    return this.debugMode_;
  };
  ModuleLoader.prototype.setUseScriptTags = function(useScriptTags) {
    this.useScriptTags_ = useScriptTags;
  };
  ModuleLoader.prototype.getUseScriptTags = function() {
    return this.useScriptTags_;
  };
  ModuleLoader.prototype.setDebugMode = function(debugMode) {
    this.debugMode_ = debugMode;
  };
  ModuleLoader.prototype.setSourceUrlInjection = function(enabled) {
    this.sourceUrlInjection_ = enabled;
  };
  ModuleLoader.prototype.usingSourceUrlInjection_ = function() {
    return this.sourceUrlInjection_ || this.getDebugMode() && ModuleLoader.supportsSourceUrlStackTraces();
  };
  ModuleLoader.prototype.loadModules = function(ids, moduleInfoMap, {forceReload, onError, onSuccess, onTimeout} = {}) {
    const loadStatus = this.loadingModulesStatus_[ids] || ModuleLoader.LoadStatus.createForIds_(ids, moduleInfoMap);
    loadStatus.loadRequested = true;
    if (loadStatus.successFn && onSuccess) {
      loadStatus.successFn = functions.sequence(loadStatus.successFn, onSuccess);
    } else {
      loadStatus.successFn = onSuccess || loadStatus.successFn;
    }
    loadStatus.errorFn = onError || null;
    if (!this.loadingModulesStatus_[ids]) {
      this.loadingModulesStatus_[ids] = loadStatus;
      this.downloadModules_(ids);
    } else if (this.getUseScriptTags()) {
      this.downloadModules_(ids);
    } else if (loadStatus.responseTexts != null) {
      this.evaluateCode_(ids);
    }
  };
  ModuleLoader.prototype.evaluateCode_ = function(moduleIds) {
    this.dispatchEvent(new ModuleLoader.RequestSuccessEvent(moduleIds));
    log.info(this.logger, "evaluateCode ids:" + moduleIds);
    const loadStatus = this.loadingModulesStatus_[moduleIds];
    const uris = loadStatus.requestUris;
    const texts = loadStatus.responseTexts;
    let error = null;
    try {
      if (this.usingSourceUrlInjection_()) {
        for (let i = 0; i < uris.length; i++) {
          const script = legacyconversions.safeScriptFromString(texts[i] + " //# sourceURL\x3d" + uris[i]);
          goog.globalEval(SafeScript.unwrapTrustedScript(script));
        }
      } else {
        const script = legacyconversions.safeScriptFromString(texts.join("\n"));
        goog.globalEval(SafeScript.unwrapTrustedScript(script));
      }
    } catch (e) {
      error = e;
      log.warning(this.logger, "Loaded incomplete code for module(s): " + moduleIds, e);
    }
    this.dispatchEvent(new ModuleLoader.EvaluateCodeEvent(moduleIds));
    if (error) {
      this.handleErrorHelper_(moduleIds, loadStatus.errorFn, null, error);
    } else if (loadStatus.successFn) {
      loadStatus.successFn();
    }
    delete this.loadingModulesStatus_[moduleIds];
  };
  ModuleLoader.prototype.handleSuccess_ = function(bulkLoader, moduleIds) {
    log.info(this.logger, "Code loaded for module(s): " + moduleIds);
    const loadStatus = this.loadingModulesStatus_[moduleIds];
    loadStatus.responseTexts = bulkLoader.getResponseTexts();
    if (loadStatus.loadRequested) {
      this.evaluateCode_(moduleIds);
    }
    Timer.callOnce(bulkLoader.dispose, 5, bulkLoader);
  };
  ModuleLoader.prototype.prefetchModule = function(id, moduleInfo) {
    if (this.getDebugMode()) {
      return;
    }
    log.info(this.logger, `Prefetching module: ${id}`);
    let loadStatus = this.loadingModulesStatus_[[id]];
    if (loadStatus) {
      return;
    }
    const moduleInfoMap = {};
    moduleInfoMap[id] = moduleInfo;
    loadStatus = ModuleLoader.LoadStatus.createForIds_([id], moduleInfoMap);
    this.loadingModulesStatus_[[id]] = loadStatus;
    if (this.getUseScriptTags()) {
      const links = [];
      const insertPos = document.head || document.documentElement;
      for (let i = 0; i < loadStatus.trustedRequestUris.length; i++) {
        const link = ModuleLoader.createPreloadScriptElement_(loadStatus.trustedRequestUris[i]);
        links.push(link);
        insertPos.insertBefore(link, insertPos.firstChild);
      }
      loadStatus.successFn = () => {
        for (let i = 0; i < links.length; i++) {
          const link = links[i];
          dom.removeNode(link);
        }
      };
    } else {
      this.downloadModules_([id]);
    }
  };
  ModuleLoader.prototype.downloadModules_ = function(ids) {
    const debugMode = this.getDebugMode();
    const sourceUrlInjection = this.usingSourceUrlInjection_();
    const useScriptTags = this.getUseScriptTags();
    if (debugMode + sourceUrlInjection + useScriptTags > 1) {
      const effectiveFlag = useScriptTags ? "useScriptTags" : debugMode && !sourceUrlInjection ? "debug" : "sourceUrlInjection";
      log.warning(this.logger, `More than one of debugMode (set to ${debugMode}), ` + `useScriptTags (set to ${useScriptTags}), ` + `and sourceUrlInjection (set to ${sourceUrlInjection}) ` + `is enabled. Proceeding with download as if ` + `${effectiveFlag} is set to true and the rest to false.`);
    }
    const loadStatus = asserts.assert(this.loadingModulesStatus_[ids]);
    if (useScriptTags) {
      this.loadWithNonAsyncScriptTag_(loadStatus, ids);
    } else if (debugMode && !sourceUrlInjection) {
      jsloader.safeLoadMany(loadStatus.trustedRequestUris);
    } else {
      log.info(this.logger, "downloadModules ids:" + ids + " uris:" + loadStatus.requestUris);
      const bulkLoader = new BulkLoader(loadStatus.requestUris);
      const eventHandler = this.eventHandler_;
      eventHandler.listen(bulkLoader, EventType.SUCCESS, goog.bind(this.handleSuccess_, this, bulkLoader, ids));
      eventHandler.listen(bulkLoader, EventType.ERROR, goog.bind(this.handleError_, this, bulkLoader, ids));
      bulkLoader.load();
    }
  };
  ModuleLoader.prototype.loadWithNonAsyncScriptTag_ = function(loadStatus, ids) {
    log.info(this.logger, `Loading initiated for: ${ids}`);
    if (loadStatus.trustedRequestUris.length == 0) {
      if (loadStatus.successFn) {
        loadStatus.successFn();
        return;
      }
    }
    let lastScript = null;
    const insertPos = document.head || document.documentElement;
    for (let i = 0; i < loadStatus.trustedRequestUris.length; i++) {
      const url = loadStatus.trustedRequestUris[i];
      const urlLength = loadStatus.requestUris[i].length;
      asserts.assert(urlLength <= ModuleLoader.URL_MAX_LENGTH_, `Module url length is ${urlLength}, which is greater than limit of ` + `${ModuleLoader.URL_MAX_LENGTH_}. This should never ` + `happen.`);
      const scriptElement = ModuleLoader.createScriptElement_(url);
      scriptElement.onload = () => {
        scriptElement.onload = null;
        scriptElement.onerror = null;
        dom.removeNode(scriptElement);
        if (scriptElement == lastScript) {
          log.info(this.logger, `Loading complete for: ${ids}`);
          lastScript = null;
          if (loadStatus.successFn) {
            loadStatus.successFn();
          }
        }
      };
      scriptElement.onerror = () => {
        log.error(this.logger, `Network error when loading module(s): ${ids}`);
        scriptElement.onload = null;
        scriptElement.onerror = null;
        dom.removeNode(scriptElement);
        this.handleErrorHelper_(ids, loadStatus.errorFn, ModuleLoader.SYNTAX_OR_NETWORK_ERROR_CODE_);
        if (lastScript == scriptElement) {
          lastScript = null;
        } else {
          log.error(this.logger, `Dependent requests were made in parallel with failed request ` + `for module(s) "${ids}". Non-recoverable out-of-order ` + `execution may occur.`);
        }
      };
      lastScript = scriptElement;
      insertPos.insertBefore(scriptElement, insertPos.firstChild);
    }
  };
  ModuleLoader.prototype.handleError_ = function(bulkLoader, moduleIds, event) {
    const loadStatus = this.loadingModulesStatus_[moduleIds];
    if (loadStatus) {
      delete this.loadingModulesStatus_[moduleIds];
      this.handleErrorHelper_(moduleIds, loadStatus.errorFn, event.status);
    }
    Timer.callOnce(bulkLoader.dispose, 5, bulkLoader);
  };
  ModuleLoader.prototype.handleErrorHelper_ = function(moduleIds, errorFn, status, opt_error) {
    this.dispatchEvent(new ModuleLoader.RequestErrorEvent(moduleIds, status, opt_error));
    log.warning(this.logger, "Request failed for module(s): " + moduleIds);
    if (errorFn) {
      errorFn(status);
    }
  };
  ModuleLoader.EventType = {EVALUATE_CODE:new EventId(events.getUniqueId("evaluateCode")), REQUEST_SUCCESS:new EventId(events.getUniqueId("requestSuccess")), REQUEST_ERROR:new EventId(events.getUniqueId("requestError"))};
  ModuleLoader.EvaluateCodeEvent = function(moduleIds) {
    ModuleLoader.EvaluateCodeEvent.base(this, "constructor", ModuleLoader.EventType.EVALUATE_CODE);
    this.moduleIds = moduleIds;
  };
  goog.inherits(ModuleLoader.EvaluateCodeEvent, GoogEvent);
  ModuleLoader.RequestSuccessEvent = function(moduleIds) {
    ModuleLoader.RequestSuccessEvent.base(this, "constructor", ModuleLoader.EventType.REQUEST_SUCCESS);
    this.moduleIds = moduleIds;
  };
  goog.inherits(ModuleLoader.RequestSuccessEvent, GoogEvent);
  ModuleLoader.RequestErrorEvent = function(moduleIds, status, opt_error) {
    ModuleLoader.RequestErrorEvent.base(this, "constructor", ModuleLoader.EventType.REQUEST_ERROR);
    this.moduleIds = moduleIds;
    this.status = status;
    this.error = opt_error || null;
  };
  goog.inherits(ModuleLoader.RequestErrorEvent, GoogEvent);
  ModuleLoader.LoadStatus = function(trustedRequestUris) {
    this.requestUris = trustedRequestUris.map(TrustedResourceUrl.unwrap);
    this.trustedRequestUris = trustedRequestUris;
    this.responseTexts = null;
    this.loadRequested = false;
    this.successFn = null;
    this.errorFn = null;
  };
  ModuleLoader.LoadStatus.createForIds_ = function(ids, moduleInfoMap) {
    if (!ids) {
      return new ModuleLoader.LoadStatus([]);
    }
    const trustedRequestUris = [];
    for (let i = 0; i < ids.length; i++) {
      googArray.extend(trustedRequestUris, moduleInfoMap[ids[i]].getUris());
    }
    return new ModuleLoader.LoadStatus(trustedRequestUris);
  };
  exports = ModuleLoader;
  return exports;
});

//# sourceMappingURL=goog.module.moduleloader.js.map
