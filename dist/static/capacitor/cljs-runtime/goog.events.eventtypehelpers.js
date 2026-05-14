goog.provide("goog.events.eventTypeHelpers");
goog.require("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.eventTypeHelpers.getVendorPrefixedName = function(eventName) {
  return goog.userAgent.WEBKIT ? "webkit" + eventName : eventName.toLowerCase();
};
goog.events.eventTypeHelpers.getPointerFallbackEventName = function(pointerEventName, msPointerEventName, fallbackEventName) {
  if (goog.events.BrowserFeature.POINTER_EVENTS) {
    return pointerEventName;
  }
  if (goog.events.BrowserFeature.MSPOINTER_EVENTS) {
    return msPointerEventName;
  }
  return fallbackEventName;
};

//# sourceMappingURL=goog.events.eventtypehelpers.js.map
