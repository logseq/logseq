goog.provide("goog.net.BulkLoaderHelper");
goog.require("goog.Disposable");
goog.requireType("goog.Uri");
goog.net.BulkLoaderHelper = function(uris) {
  goog.Disposable.call(this);
  this.uris_ = uris;
  this.responseTexts_ = [];
};
goog.inherits(goog.net.BulkLoaderHelper, goog.Disposable);
goog.net.BulkLoaderHelper.prototype.getUri = function(id) {
  return this.uris_[id];
};
goog.net.BulkLoaderHelper.prototype.getUris = function() {
  return this.uris_;
};
goog.net.BulkLoaderHelper.prototype.getResponseTexts = function() {
  return this.responseTexts_;
};
goog.net.BulkLoaderHelper.prototype.setResponseText = function(id, responseText) {
  this.responseTexts_[id] = responseText;
};
goog.net.BulkLoaderHelper.prototype.isLoadComplete = function() {
  const responseTexts = this.responseTexts_;
  if (responseTexts.length == this.uris_.length) {
    for (let i = 0; i < responseTexts.length; i++) {
      if (responseTexts[i] == null) {
        return false;
      }
    }
    return true;
  }
  return false;
};
goog.net.BulkLoaderHelper.prototype.disposeInternal = function() {
  goog.net.BulkLoaderHelper.superClass_.disposeInternal.call(this);
  this.uris_ = null;
  this.responseTexts_ = null;
};

//# sourceMappingURL=goog.net.bulkloaderhelper.js.map
