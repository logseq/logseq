goog.provide("goog.events.Listenable");
goog.requireType("goog.events.EventId");
goog.requireType("goog.events.EventLike");
goog.requireType("goog.events.ListenableKey");
goog.events.Listenable = function() {
};
goog.events.Listenable.IMPLEMENTED_BY_PROP = "closure_listenable_" + (Math.random() * 1e6 | 0);
goog.events.Listenable.addImplementation = function(cls) {
  cls.prototype[goog.events.Listenable.IMPLEMENTED_BY_PROP] = true;
};
goog.events.Listenable.isImplementedBy = function(obj) {
  return !!(obj && obj[goog.events.Listenable.IMPLEMENTED_BY_PROP]);
};
goog.events.Listenable.prototype.listen = function(type, listener, opt_useCapture, opt_listenerScope) {
};
goog.events.Listenable.prototype.listenOnce = function(type, listener, opt_useCapture, opt_listenerScope) {
};
goog.events.Listenable.prototype.unlisten = function(type, listener, opt_useCapture, opt_listenerScope) {
};
goog.events.Listenable.prototype.unlistenByKey = function(key) {
};
goog.events.Listenable.prototype.dispatchEvent = function(e) {
};
goog.events.Listenable.prototype.removeAllListeners = function(opt_type) {
};
goog.events.Listenable.prototype.getParentEventTarget = function() {
};
goog.events.Listenable.prototype.fireListeners = function(type, capture, eventObject) {
};
goog.events.Listenable.prototype.getListeners = function(type, capture) {
};
goog.events.Listenable.prototype.getListener = function(type, listener, capture, opt_listenerScope) {
};
goog.events.Listenable.prototype.hasListener = function(opt_type, opt_capture) {
};

//# sourceMappingURL=goog.events.listenable.js.map
