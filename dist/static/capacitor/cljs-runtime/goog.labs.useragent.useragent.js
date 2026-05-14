goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.labs.userAgent");
  goog.module.declareLegacyNamespace();
  const flags = goog.require("goog.flags");
  const USE_CLIENT_HINTS_OVERRIDE = goog.define("goog.labs.userAgent.USE_CLIENT_HINTS_OVERRIDE", "");
  const USE_CLIENT_HINTS = goog.define("goog.labs.userAgent.USE_CLIENT_HINTS", false);
  let forceClientHintsInTests = false;
  exports.setUseClientHintsForTesting = use => {
    forceClientHintsInTests = use;
  };
  const useClientHintsRuntimeOverride = USE_CLIENT_HINTS_OVERRIDE ? !!goog.getObjectByName(USE_CLIENT_HINTS_OVERRIDE) : false;
  exports.useClientHints = () => {
    return flags.USE_USER_AGENT_CLIENT_HINTS || USE_CLIENT_HINTS || useClientHintsRuntimeOverride || forceClientHintsInTests;
  };
  return exports;
});

//# sourceMappingURL=goog.labs.useragent.useragent.js.map
