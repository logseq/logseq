goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.require("goog.events.EventId");
goog.events.Event = function(type, opt_target) {
  this.type = type instanceof goog.events.EventId ? String(type) : type;
  this.target = opt_target;
  this.currentTarget = this.target;
  this.propagationStopped_ = false;
  this.defaultPrevented = false;
};
goog.events.Event.prototype.hasPropagationStopped = function() {
  return this.propagationStopped_;
};
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true;
};
goog.events.Event.prototype.preventDefault = function() {
  this.defaultPrevented = true;
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation();
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault();
};

//# sourceMappingURL=goog.events.event.js.map
