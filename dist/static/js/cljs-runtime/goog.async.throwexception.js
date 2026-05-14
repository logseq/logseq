goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.async.throwException");
  goog.module.declareLegacyNamespace();
  function throwException(exception) {
    goog.global.setTimeout(() => {
      throw exception;
    }, 0);
  }
  exports = throwException;
  return exports;
});

//# sourceMappingURL=goog.async.throwexception.js.map
