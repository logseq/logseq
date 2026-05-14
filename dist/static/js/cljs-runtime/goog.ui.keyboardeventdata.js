goog.provide("goog.ui.KeyboardEventData");
goog.require("goog.asserts");
goog.require("goog.events.BrowserEvent");
goog.ui.KeyboardEventData = function(keyCode, key, shiftKey, altKey, ctrlKey, metaKey, target, rootTarget, preventDefaultFn, stopPropagationFn) {
  this.keyCode_ = keyCode;
  this.key_ = key;
  this.shiftKey_ = shiftKey;
  this.altKey_ = altKey;
  this.ctrlKey_ = ctrlKey;
  this.metaKey_ = metaKey;
  this.target_ = target;
  this.rootTarget_ = rootTarget;
  this.preventDefaultFn_ = preventDefaultFn;
  this.stopPropagationFn_ = stopPropagationFn;
};
goog.ui.KeyboardEventData.prototype.getKeyCode = function() {
  return this.keyCode_;
};
goog.ui.KeyboardEventData.prototype.getKey = function() {
  return this.key_;
};
goog.ui.KeyboardEventData.prototype.getShiftKey = function() {
  return this.shiftKey_;
};
goog.ui.KeyboardEventData.prototype.getAltKey = function() {
  return this.altKey_;
};
goog.ui.KeyboardEventData.prototype.getCtrlKey = function() {
  return this.ctrlKey_;
};
goog.ui.KeyboardEventData.prototype.getMetaKey = function() {
  return this.metaKey_;
};
goog.ui.KeyboardEventData.prototype.getTarget = function() {
  return this.target_;
};
goog.ui.KeyboardEventData.prototype.getRootTarget = function() {
  return this.rootTarget_;
};
goog.ui.KeyboardEventData.prototype.getPreventDefaultFn = function() {
  return this.preventDefaultFn_;
};
goog.ui.KeyboardEventData.prototype.getStopPropagationFn = function() {
  return this.stopPropagationFn_;
};
goog.ui.KeyboardEventData.fromBrowserEvent = function(event) {
  var e = event.getBrowserEvent();
  var hasComposed = e && "composed" in e;
  var hasComposedPath = e && "composedPath" in e;
  var path = hasComposed && hasComposedPath && e.composed && e.composedPath();
  var rootTarget = path && path.length > 0 ? path[0] : event.target;
  return (new goog.ui.KeyboardEventData.Builder()).keyCode(event.keyCode || 0).key(event.key || "").shiftKey(!!event.shiftKey).altKey(!!event.altKey).ctrlKey(!!event.ctrlKey).metaKey(!!event.metaKey).target(event.target).rootTarget(rootTarget).preventDefaultFn(() => event.preventDefault()).stopPropagationFn(() => event.stopPropagation()).build();
};
goog.ui.KeyboardEventData.Builder = function() {
  this.keyCode_ = null;
  this.key_ = "";
  this.shiftKey_ = null;
  this.altKey_ = null;
  this.ctrlKey_ = null;
  this.metaKey_ = null;
  this.target_ = null;
  this.rootTarget_ = null;
  this.preventDefaultFn_ = null;
  this.stopPropagationFn_ = null;
};
goog.ui.KeyboardEventData.Builder.prototype.keyCode = function(keyCode) {
  this.keyCode_ = keyCode;
  return this;
};
goog.ui.KeyboardEventData.Builder.prototype.key = function(key) {
  this.key_ = key;
  return this;
};
goog.ui.KeyboardEventData.Builder.prototype.shiftKey = function(shiftKey) {
  this.shiftKey_ = shiftKey;
  return this;
};
goog.ui.KeyboardEventData.Builder.prototype.altKey = function(altKey) {
  this.altKey_ = altKey;
  return this;
};
goog.ui.KeyboardEventData.Builder.prototype.ctrlKey = function(ctrlKey) {
  this.ctrlKey_ = ctrlKey;
  return this;
};
goog.ui.KeyboardEventData.Builder.prototype.metaKey = function(metaKey) {
  this.metaKey_ = metaKey;
  return this;
};
goog.ui.KeyboardEventData.Builder.prototype.target = function(target) {
  this.target_ = target;
  return this;
};
goog.ui.KeyboardEventData.Builder.prototype.rootTarget = function(rootTarget) {
  this.rootTarget_ = rootTarget;
  return this;
};
goog.ui.KeyboardEventData.Builder.prototype.preventDefaultFn = function(preventDefaultFn) {
  this.preventDefaultFn_ = preventDefaultFn;
  return this;
};
goog.ui.KeyboardEventData.Builder.prototype.stopPropagationFn = function(stopPropagationFn) {
  this.stopPropagationFn_ = stopPropagationFn;
  return this;
};
goog.ui.KeyboardEventData.Builder.prototype.build = function() {
  return new goog.ui.KeyboardEventData(goog.asserts.assertNumber(this.keyCode_), this.key_, goog.asserts.assertBoolean(this.shiftKey_), goog.asserts.assertBoolean(this.altKey_), goog.asserts.assertBoolean(this.ctrlKey_), goog.asserts.assertBoolean(this.metaKey_), goog.asserts.assert(this.target_), goog.asserts.assert(this.rootTarget_), goog.asserts.assertFunction(this.preventDefaultFn_), goog.asserts.assertFunction(this.stopPropagationFn_));
};

//# sourceMappingURL=goog.ui.keyboardeventdata.js.map
