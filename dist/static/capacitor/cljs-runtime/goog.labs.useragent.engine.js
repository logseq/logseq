goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.labs.userAgent.engine");
  goog.module.declareLegacyNamespace();
  const googArray = goog.require("goog.array");
  const googString = goog.require("goog.string.internal");
  const util = goog.require("goog.labs.userAgent.util");
  function isPresto() {
    return util.matchUserAgent("Presto");
  }
  function isTrident() {
    return util.matchUserAgent("Trident") || util.matchUserAgent("MSIE");
  }
  function isEdge() {
    return util.matchUserAgent("Edge");
  }
  function isWebKit() {
    return util.matchUserAgentIgnoreCase("WebKit") && !isEdge();
  }
  function isGecko() {
    return util.matchUserAgent("Gecko") && !isWebKit() && !isTrident() && !isEdge();
  }
  function getVersion() {
    const userAgentString = util.getUserAgent();
    if (userAgentString) {
      const tuples = util.extractVersionTuples(userAgentString);
      const engineTuple = getEngineTuple(tuples);
      if (engineTuple) {
        if (engineTuple[0] == "Gecko") {
          return getVersionForKey(tuples, "Firefox");
        }
        return engineTuple[1];
      }
      const browserTuple = tuples[0];
      let info;
      if (browserTuple && (info = browserTuple[2])) {
        const match = /Trident\/([^\s;]+)/.exec(info);
        if (match) {
          return match[1];
        }
      }
    }
    return "";
  }
  function getEngineTuple(tuples) {
    if (!isEdge()) {
      return tuples[1];
    }
    for (let i = 0; i < tuples.length; i++) {
      const tuple = tuples[i];
      if (tuple[0] == "Edge") {
        return tuple;
      }
    }
  }
  function isVersionOrHigher(version) {
    return googString.compareVersions(getVersion(), version) >= 0;
  }
  function getVersionForKey(tuples, key) {
    const pair = googArray.find(tuples, function(pair) {
      return key == pair[0];
    });
    return pair && pair[1] || "";
  }
  exports = {getVersion, isEdge, isGecko, isPresto, isTrident, isVersionOrHigher, isWebKit,};
  return exports;
});

//# sourceMappingURL=goog.labs.useragent.engine.js.map
