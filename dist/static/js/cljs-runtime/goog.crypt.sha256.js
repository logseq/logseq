goog.provide("goog.crypt.Sha256");
goog.require("goog.crypt.Sha2");
goog.crypt.Sha256 = function() {
  goog.crypt.Sha256.base(this, "constructor", 8, goog.crypt.Sha256.INIT_HASH_BLOCK_);
};
goog.inherits(goog.crypt.Sha256, goog.crypt.Sha2);
goog.crypt.Sha256.INIT_HASH_BLOCK_ = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225];

//# sourceMappingURL=goog.crypt.sha256.js.map
