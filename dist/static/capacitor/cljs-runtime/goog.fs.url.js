goog.provide("goog.fs.url");
goog.fs.url.createObjectUrl = function(obj) {
  return goog.fs.url.getUrlObject_().createObjectURL(obj);
};
goog.fs.url.revokeObjectUrl = function(url) {
  goog.fs.url.getUrlObject_().revokeObjectURL(url);
};
goog.fs.url.UrlObject_ = function() {
};
goog.fs.url.UrlObject_.prototype.createObjectURL = function(arg) {
};
goog.fs.url.UrlObject_.prototype.revokeObjectURL = function(s) {
};
goog.fs.url.getUrlObject_ = function() {
  const urlObject = goog.fs.url.findUrlObject_();
  if (urlObject != null) {
    return urlObject;
  } else {
    throw new Error("This browser doesn't seem to support blob URLs");
  }
};
goog.fs.url.findUrlObject_ = function() {
  if (goog.global.URL !== undefined && goog.global.URL.createObjectURL !== undefined) {
    return goog.global.URL;
  } else if (goog.global.createObjectURL !== undefined) {
    return goog.global;
  } else {
    return null;
  }
};
goog.fs.url.browserSupportsObjectUrls = function() {
  return goog.fs.url.findUrlObject_() != null;
};

//# sourceMappingURL=goog.fs.url.js.map
