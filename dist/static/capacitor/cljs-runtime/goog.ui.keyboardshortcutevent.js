goog.provide("goog.ui.KeyboardShortcutEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventTarget");
goog.ui.KeyboardShortcutEvent = function(type, identifier, target) {
  goog.events.Event.call(this, type, target);
  this.identifier = identifier;
};
goog.inherits(goog.ui.KeyboardShortcutEvent, goog.events.Event);

//# sourceMappingURL=goog.ui.keyboardshortcutevent.js.map
