goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.labs.userAgent.highEntropy.highEntropyData");
  const {HighEntropyValue} = goog.require("goog.labs.userAgent.highEntropy.highEntropyValue");
  const fullVersionList = new HighEntropyValue("fullVersionList");
  exports.fullVersionList = fullVersionList;
  const platformVersion = new HighEntropyValue("platformVersion");
  exports.platformVersion = platformVersion;
  return exports;
});

//# sourceMappingURL=goog.labs.useragent.highentropy.highentropydata.js.map
