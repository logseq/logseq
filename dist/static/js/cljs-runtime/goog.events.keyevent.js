goog.provide("goog.events.KeyEvent");
goog.require("goog.events.BrowserEvent");
goog.events.KeyEvent = function(keyCode, charCode, repeat, browserEvent) {
  goog.events.BrowserEvent.call(this, browserEvent);
  this.type = goog.events.KeyEvent.EventType.KEY;
  this.keyCode = keyCode;
  this.charCode = charCode;
  this.repeat = repeat;
};
goog.inherits(goog.events.KeyEvent, goog.events.BrowserEvent);
goog.events.KeyEvent.EventType = {KEY:"key"};

//# sourceMappingURL=goog.events.keyevent.js.map
