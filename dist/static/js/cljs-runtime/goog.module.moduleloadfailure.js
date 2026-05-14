goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.module.ModuleLoadFailure");
  goog.module.declareLegacyNamespace();
  class ModuleLoadFailure {
    constructor(type, status = undefined) {
      this.type = type;
      this.status = status;
    }
    toString() {
      return `${this.getReadableError_()} (${this.status != undefined ? this.status : "?"})`;
    }
    getReadableError_() {
      switch(this.type) {
        case ModuleLoadFailure.Type.UNAUTHORIZED:
          return "Unauthorized";
        case ModuleLoadFailure.Type.CONSECUTIVE_FAILURES:
          return "Consecutive load failures";
        case ModuleLoadFailure.Type.TIMEOUT:
          return "Timed out";
        case ModuleLoadFailure.Type.OLD_CODE_GONE:
          return "Out of date module id";
        case ModuleLoadFailure.Type.INIT_ERROR:
          return "Init error";
        default:
          return `Unknown failure type ${this.type}`;
      }
    }
  }
  const Type = {UNAUTHORIZED:0, CONSECUTIVE_FAILURES:1, TIMEOUT:2, OLD_CODE_GONE:3, INIT_ERROR:4};
  exports = ModuleLoadFailure;
  exports.Type = Type;
  return exports;
});

//# sourceMappingURL=goog.module.moduleloadfailure.js.map
