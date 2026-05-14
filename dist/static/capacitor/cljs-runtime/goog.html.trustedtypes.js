goog.provide("goog.html.trustedtypes");
goog.html.trustedtypes.POLICY_NAME = goog.define("goog.html.trustedtypes.POLICY_NAME", goog.TRUSTED_TYPES_POLICY_NAME ? goog.TRUSTED_TYPES_POLICY_NAME + "#html" : "");
goog.html.trustedtypes.cachedPolicy_;
goog.html.trustedtypes.getPolicyPrivateDoNotAccessOrElse = function() {
  if (!goog.html.trustedtypes.POLICY_NAME) {
    return null;
  }
  if (goog.html.trustedtypes.cachedPolicy_ === undefined) {
    goog.html.trustedtypes.cachedPolicy_ = goog.createTrustedTypesPolicy(goog.html.trustedtypes.POLICY_NAME);
  }
  return goog.html.trustedtypes.cachedPolicy_;
};

//# sourceMappingURL=goog.html.trustedtypes.js.map
