goog.provide("goog.ui.SyntheticKeyboardEvent");
goog.require("goog.events.Event");
goog.require("goog.ui.KeyboardEventData");
goog.ui.SyntheticKeyboardEvent = function(type, keyCode, shiftKey, altKey, ctrlKey, metaKey, target, preventDefaultFn, stopPropagationFn) {
  goog.ui.SyntheticKeyboardEvent.base(this, "constructor", type);
  this.data_ = (new goog.ui.KeyboardEventData.Builder()).keyCode(keyCode).shiftKey(shiftKey).altKey(altKey).ctrlKey(ctrlKey).metaKey(metaKey).target(target).rootTarget(target).preventDefaultFn(preventDefaultFn).stopPropagationFn(stopPropagationFn).build();
};
goog.inherits(goog.ui.SyntheticKeyboardEvent, goog.events.Event);
goog.ui.SyntheticKeyboardEvent.prototype.getData = function() {
  return this.data_;
};
goog.ui.SyntheticKeyboardEvent.createKeyDown = function(keyCode, shiftKey, altKey, ctrlKey, metaKey, target, preventDefaultFn, stopPropagationFn) {
  return new goog.ui.SyntheticKeyboardEvent(goog.ui.SyntheticKeyboardEvent.Type.KEYDOWN, keyCode, shiftKey, altKey, ctrlKey, metaKey, target, preventDefaultFn, stopPropagationFn);
};
goog.ui.SyntheticKeyboardEvent.createKeyUp = function(keyCode, shiftKey, altKey, ctrlKey, metaKey, target, preventDefaultFn, stopPropagationFn) {
  return new goog.ui.SyntheticKeyboardEvent(goog.ui.SyntheticKeyboardEvent.Type.KEYUP, keyCode, shiftKey, altKey, ctrlKey, metaKey, target, preventDefaultFn, stopPropagationFn);
};
goog.ui.SyntheticKeyboardEvent.createKeyPress = function(keyCode, shiftKey, altKey, ctrlKey, metaKey, target, preventDefaultFn, stopPropagationFn) {
  return new goog.ui.SyntheticKeyboardEvent(goog.ui.SyntheticKeyboardEvent.Type.KEYPRESS, keyCode, shiftKey, altKey, ctrlKey, metaKey, target, preventDefaultFn, stopPropagationFn);
};
goog.ui.SyntheticKeyboardEvent.Type = {KEYDOWN:"synthetic-keydown", KEYUP:"synthetic-keyup", KEYPRESS:"synthetic-keypress"};

//# sourceMappingURL=goog.ui.synthetickeyboardevent.js.map
