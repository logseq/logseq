goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.module.AbstractModuleLoader");
  goog.module.declareLegacyNamespace();
  const ModuleInfo = goog.requireType("goog.module.ModuleInfo");
  class AbstractModuleLoader {
    constructor() {
      this.supportsExtraEdges;
    }
    loadModules(ids, moduleInfoMap, loadOptions) {
    }
    prefetchModule(id, moduleInfo) {
    }
  }
  AbstractModuleLoader.ExtraEdgesMap;
  AbstractModuleLoader.LoadOptions = class {
    constructor() {
      this.extraEdges;
      this.forceReload;
      this.onError;
      this.onSuccess;
      this.onTimeout;
    }
  };
  exports = AbstractModuleLoader;
  return exports;
});

//# sourceMappingURL=goog.module.abstractmoduleloader.js.map
