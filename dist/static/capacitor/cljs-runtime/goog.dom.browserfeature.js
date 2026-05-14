goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature.ASSUME_NO_OFFSCREEN_CANVAS = goog.define("goog.dom.ASSUME_NO_OFFSCREEN_CANVAS", false);
goog.dom.BrowserFeature.ASSUME_OFFSCREEN_CANVAS = goog.define("goog.dom.ASSUME_OFFSCREEN_CANVAS", false);
goog.dom.BrowserFeature.detectOffscreenCanvas_ = function(contextName) {
  try {
    return Boolean((new self.OffscreenCanvas(0, 0)).getContext(contextName));
  } catch (ex) {
  }
  return false;
};
goog.dom.BrowserFeature.OFFSCREEN_CANVAS_2D = !goog.dom.BrowserFeature.ASSUME_NO_OFFSCREEN_CANVAS && (goog.dom.BrowserFeature.ASSUME_OFFSCREEN_CANVAS || goog.dom.BrowserFeature.detectOffscreenCanvas_("2d"));
goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES = true;
goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE = true;
goog.dom.BrowserFeature.CAN_USE_INNER_TEXT = false;
goog.dom.BrowserFeature.CAN_USE_PARENT_ELEMENT_PROPERTY = goog.userAgent.IE || goog.userAgent.WEBKIT;
goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT = goog.userAgent.IE;

//# sourceMappingURL=goog.dom.browserfeature.js.map
