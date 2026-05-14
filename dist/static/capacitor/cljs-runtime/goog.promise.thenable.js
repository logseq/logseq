goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.Thenable");
  goog.module.declareLegacyNamespace();
  const GoogPromise = goog.requireType("goog.Promise");
  function Thenable() {
  }
  Thenable.prototype.then = function(opt_onFulfilled, opt_onRejected, opt_context) {
  };
  Thenable.IMPLEMENTED_BY_PROP = "$goog_Thenable";
  Thenable.addImplementation = function(ctor) {
    if (COMPILED) {
      ctor.prototype[Thenable.IMPLEMENTED_BY_PROP] = true;
    } else {
      ctor.prototype.$goog_Thenable = true;
    }
  };
  Thenable.isImplementedBy = function(object) {
    if (!object) {
      return false;
    }
    try {
      if (COMPILED) {
        return !!object[Thenable.IMPLEMENTED_BY_PROP];
      }
      return !!object.$goog_Thenable;
    } catch (e) {
      return false;
    }
  };
  exports = Thenable;
  return exports;
});

//# sourceMappingURL=goog.promise.thenable.js.map
