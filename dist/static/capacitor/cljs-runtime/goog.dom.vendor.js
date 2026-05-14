goog.provide("goog.dom.vendor");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.vendor.getVendorJsPrefix = function() {
  if (goog.userAgent.WEBKIT) {
    return "Webkit";
  } else if (goog.userAgent.GECKO) {
    return "Moz";
  } else if (goog.userAgent.IE) {
    return "ms";
  }
  return null;
};
goog.dom.vendor.getVendorPrefix = function() {
  if (goog.userAgent.WEBKIT) {
    return "-webkit";
  } else if (goog.userAgent.GECKO) {
    return "-moz";
  } else if (goog.userAgent.IE) {
    return "-ms";
  }
  return null;
};
goog.dom.vendor.getPrefixedPropertyName = function(propertyName, opt_object) {
  if (opt_object && propertyName in opt_object) {
    return propertyName;
  }
  var prefix = goog.dom.vendor.getVendorJsPrefix();
  if (prefix) {
    prefix = prefix.toLowerCase();
    var prefixedPropertyName = prefix + goog.string.toTitleCase(propertyName);
    return opt_object === undefined || prefixedPropertyName in opt_object ? prefixedPropertyName : null;
  }
  return null;
};
goog.dom.vendor.getPrefixedEventType = function(eventType) {
  var prefix = goog.dom.vendor.getVendorJsPrefix() || "";
  return (prefix + eventType).toLowerCase();
};

//# sourceMappingURL=goog.dom.vendor.js.map
