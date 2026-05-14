goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.loader.activeModuleManager");
  goog.module.declareLegacyNamespace();
  const AbstractModuleManager = goog.require("goog.loader.AbstractModuleManager");
  const asserts = goog.require("goog.asserts");
  let moduleManager = null;
  let getDefault = null;
  let configureFunctions = [];
  function configure(configureFn) {
    if (moduleManager) {
      configureFn(moduleManager);
    } else {
      configureFunctions.push(configureFn);
    }
  }
  function get() {
    if (!moduleManager && getDefault) {
      set(getDefault());
    }
    asserts.assert(moduleManager != null, "The module manager has not yet been set.");
    return moduleManager;
  }
  function set(newModuleManager) {
    asserts.assert(moduleManager == null, "The module manager cannot be redefined.");
    moduleManager = newModuleManager;
    configureFunctions.forEach(configureFn => {
      configureFn(moduleManager);
    });
    configureFunctions = [];
  }
  function setDefault(fn) {
    getDefault = fn;
  }
  function beforeLoadModuleCode(id) {
    if (moduleManager) {
      moduleManager.beforeLoadModuleCode(id);
    }
  }
  function setLoaded() {
    if (moduleManager) {
      moduleManager.setLoaded();
    }
  }
  function maybeInitialize(info, loadingModuleIds) {
    if (!moduleManager) {
      if (!getDefault) {
        return;
      }
      set(getDefault());
    }
    moduleManager.setAllModuleInfoString(info, loadingModuleIds);
  }
  const reset = function() {
    moduleManager = null;
    configureFunctions = [];
  };
  exports = {get, set, setDefault, beforeLoadModuleCode, setLoaded, maybeInitialize, reset, configure,};
  return exports;
});

//# sourceMappingURL=goog.loader.activemodulemanager.js.map
