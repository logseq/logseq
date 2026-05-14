goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.events.BrowserFeature");
  goog.module.declareLegacyNamespace();
  const purify = fn => {
    return {valueOf:fn}.valueOf();
  };
  exports = {TOUCH_ENABLED:"ontouchstart" in goog.global || !!(goog.global["document"] && document.documentElement && "ontouchstart" in document.documentElement) || !!(goog.global["navigator"] && (goog.global["navigator"]["maxTouchPoints"] || goog.global["navigator"]["msMaxTouchPoints"])), POINTER_EVENTS:"PointerEvent" in goog.global, MSPOINTER_EVENTS:false, PASSIVE_EVENTS:purify(function() {
    if (!goog.global.addEventListener || !Object.defineProperty) {
      return false;
    }
    var passive = false;
    var options = Object.defineProperty({}, "passive", {get:function() {
      passive = true;
    }});
    try {
      goog.global.addEventListener("test", () => {
      }, options);
      goog.global.removeEventListener("test", () => {
      }, options);
    } catch (e) {
    }
    return passive;
  })};
  return exports;
});

//# sourceMappingURL=goog.events.browserfeature.js.map
