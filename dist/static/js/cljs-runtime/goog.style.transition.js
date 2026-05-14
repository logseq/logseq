goog.provide("goog.style.transition");
goog.provide("goog.style.transition.Css3Property");
goog.require("goog.asserts");
goog.require("goog.dom");
goog.require("goog.dom.TagName");
goog.require("goog.dom.safe");
goog.require("goog.dom.vendor");
goog.require("goog.functions");
goog.require("goog.html.SafeHtml");
goog.require("goog.style");
goog.require("goog.userAgent");
goog.style.transition.Css3Property;
goog.style.transition.set = function(element, properties) {
  if (!Array.isArray(properties)) {
    properties = [properties];
  }
  goog.asserts.assert(properties.length > 0, "At least one Css3Property should be specified.");
  var values = properties.map(function(p) {
    if (typeof p === "string") {
      return p;
    } else {
      goog.asserts.assertObject(p, "Expected css3 property to be an object.");
      var propString = p.property + " " + p.duration + "s " + p.timing + " " + p.delay + "s";
      goog.asserts.assert(p.property && typeof p.duration === "number" && p.timing && typeof p.delay === "number", "Unexpected css3 property value: %s", propString);
      return propString;
    }
  });
  goog.style.transition.setPropertyValue_(element, values.join(","));
};
goog.style.transition.removeAll = function(element) {
  goog.style.transition.setPropertyValue_(element, "");
};
goog.style.transition.isSupported = goog.functions.cacheReturnValue(function() {
  if (goog.userAgent.IE) {
    return true;
  }
  var el = goog.dom.createElement(goog.dom.TagName.DIV);
  var transition = "opacity 1s linear";
  var vendorPrefix = goog.dom.vendor.getVendorPrefix();
  var style = {"transition":transition};
  if (vendorPrefix) {
    style[vendorPrefix + "-transition"] = transition;
  }
  goog.dom.safe.setInnerHtml(el, goog.html.SafeHtml.create("div", {"style":style}));
  var testElement = el.firstChild;
  goog.asserts.assert(testElement.nodeType == Node.ELEMENT_NODE);
  return goog.style.getStyle(testElement, "transition") != "";
});
goog.style.transition.setPropertyValue_ = function(element, transitionValue) {
  goog.style.setStyle(element, "transition", transitionValue);
};

//# sourceMappingURL=goog.style.transition.js.map
