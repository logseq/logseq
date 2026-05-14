goog.provide("goog.events.Listener");
goog.require("goog.events.ListenableKey");
goog.requireType("goog.events.Listenable");
goog.events.Listener = function(listener, proxy, src, type, capture, opt_handler) {
  if (goog.events.Listener.ENABLE_MONITORING) {
    this.creationStack = (new Error()).stack;
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.key = goog.events.ListenableKey.reserveKey();
  this.callOnce = false;
  this.removed = false;
};
goog.events.Listener.ENABLE_MONITORING = goog.define("goog.events.Listener.ENABLE_MONITORING", false);
goog.events.Listener.prototype.creationStack;
goog.events.Listener.prototype.markAsRemoved = function() {
  this.removed = true;
  this.listener = null;
  this.proxy = null;
  this.src = null;
  this.handler = null;
};

//# sourceMappingURL=goog.events.listener.js.map
