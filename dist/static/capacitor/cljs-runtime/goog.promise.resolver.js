goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.promise.Resolver");
  goog.module.declareLegacyNamespace();
  const GoogPromise = goog.requireType("goog.Promise");
  const Thenable = goog.requireType("goog.Thenable");
  class Resolver {
    constructor() {
      this.promise;
      this.resolve;
      this.reject;
    }
  }
  exports = Resolver;
  return exports;
});

//# sourceMappingURL=goog.promise.resolver.js.map
