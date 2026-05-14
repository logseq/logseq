goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.dispose");
  goog.module.declareLegacyNamespace();
  function dispose(obj) {
    if (obj && typeof obj.dispose == "function") {
      obj.dispose();
    }
  }
  exports = dispose;
  return exports;
});

//# sourceMappingURL=goog.disposable.dispose.js.map
