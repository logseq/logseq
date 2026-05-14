goog.provide("goog.debug.RelativeTimeProvider");
goog.debug.RelativeTimeProvider = function() {
  this.relativeTimeStart_ = goog.now();
};
goog.debug.RelativeTimeProvider.defaultInstance_ = null;
goog.debug.RelativeTimeProvider.prototype.set = function(timeStamp) {
  this.relativeTimeStart_ = timeStamp;
};
goog.debug.RelativeTimeProvider.prototype.reset = function() {
  this.set(goog.now());
};
goog.debug.RelativeTimeProvider.prototype.get = function() {
  return this.relativeTimeStart_;
};
goog.debug.RelativeTimeProvider.getDefaultInstance = function() {
  if (!goog.debug.RelativeTimeProvider.defaultInstance_) {
    goog.debug.RelativeTimeProvider.defaultInstance_ = new goog.debug.RelativeTimeProvider();
  }
  return goog.debug.RelativeTimeProvider.defaultInstance_;
};

//# sourceMappingURL=goog.debug.relativetimeprovider.js.map
