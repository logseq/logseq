goog.provide("goog.crypt.Hash");
goog.crypt.Hash = function() {
  this.blockSize = -1;
};
goog.crypt.Hash.prototype.reset = goog.abstractMethod;
goog.crypt.Hash.prototype.update = goog.abstractMethod;
goog.crypt.Hash.prototype.digest = goog.abstractMethod;

//# sourceMappingURL=goog.crypt.hash.js.map
