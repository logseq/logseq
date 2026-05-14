goog.provide("goog.events.EventHandler");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.require("goog.object");
goog.requireType("goog.events.Event");
goog.requireType("goog.events.EventId");
goog.requireType("goog.events.EventTarget");
goog.requireType("goog.events.EventWrapper");
goog.events.EventHandler = function(opt_scope) {
  goog.Disposable.call(this);
  this.handler_ = opt_scope;
  this.keys_ = {};
};
goog.inherits(goog.events.EventHandler, goog.Disposable);
goog.events.EventHandler.typeArray_ = [];
goog.events.EventHandler.prototype.listen = function(src, type, opt_fn, opt_options) {
  var self = this;
  return self.listen_(src, type, opt_fn, opt_options);
};
goog.events.EventHandler.prototype.listenWithScope = function(src, type, fn, options, scope) {
  var self = this;
  return self.listen_(src, type, fn, options, scope);
};
goog.events.EventHandler.prototype.listen_ = function(src, type, opt_fn, opt_options, opt_scope) {
  var self = this;
  if (!Array.isArray(type)) {
    if (type) {
      goog.events.EventHandler.typeArray_[0] = type.toString();
    }
    type = goog.events.EventHandler.typeArray_;
  }
  for (var i = 0; i < type.length; i++) {
    var listenerObj = goog.events.listen(src, type[i], opt_fn || self.handleEvent, opt_options || false, opt_scope || self.handler_ || self);
    if (!listenerObj) {
      return self;
    }
    var key = listenerObj.key;
    self.keys_[key] = listenerObj;
  }
  return self;
};
goog.events.EventHandler.prototype.listenOnce = function(src, type, opt_fn, opt_options) {
  var self = this;
  return self.listenOnce_(src, type, opt_fn, opt_options);
};
goog.events.EventHandler.prototype.listenOnceWithScope = function(src, type, fn, capture, scope) {
  var self = this;
  return self.listenOnce_(src, type, fn, capture, scope);
};
goog.events.EventHandler.prototype.listenOnce_ = function(src, type, opt_fn, opt_options, opt_scope) {
  var self = this;
  if (Array.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      self.listenOnce_(src, type[i], opt_fn, opt_options, opt_scope);
    }
  } else {
    var listenerObj = goog.events.listenOnce(src, type, opt_fn || self.handleEvent, opt_options, opt_scope || self.handler_ || self);
    if (!listenerObj) {
      return self;
    }
    var key = listenerObj.key;
    self.keys_[key] = listenerObj;
  }
  return self;
};
goog.events.EventHandler.prototype.listenWithWrapper = function(src, wrapper, listener, opt_capt) {
  var self = this;
  return self.listenWithWrapper_(src, wrapper, listener, opt_capt);
};
goog.events.EventHandler.prototype.listenWithWrapperAndScope = function(src, wrapper, listener, capture, scope) {
  var self = this;
  return self.listenWithWrapper_(src, wrapper, listener, capture, scope);
};
goog.events.EventHandler.prototype.listenWithWrapper_ = function(src, wrapper, listener, opt_capt, opt_scope) {
  var self = this;
  wrapper.listen(src, listener, opt_capt, opt_scope || self.handler_ || self, self);
  return self;
};
goog.events.EventHandler.prototype.getListenerCount = function() {
  var count = 0;
  for (var key in this.keys_) {
    if (Object.prototype.hasOwnProperty.call(this.keys_, key)) {
      count++;
    }
  }
  return count;
};
goog.events.EventHandler.prototype.unlisten = function(src, type, opt_fn, opt_options, opt_scope) {
  var self = this;
  if (Array.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      self.unlisten(src, type[i], opt_fn, opt_options, opt_scope);
    }
  } else {
    var capture = goog.isObject(opt_options) ? !!opt_options.capture : !!opt_options;
    var listener = goog.events.getListener(src, type, opt_fn || self.handleEvent, capture, opt_scope || self.handler_ || self);
    if (listener) {
      goog.events.unlistenByKey(listener);
      delete self.keys_[listener.key];
    }
  }
  return self;
};
goog.events.EventHandler.prototype.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_scope) {
  var self = this;
  wrapper.unlisten(src, listener, opt_capt, opt_scope || self.handler_ || self, self);
  return self;
};
goog.events.EventHandler.prototype.removeAll = function() {
  goog.object.forEach(this.keys_, function(listenerObj, key) {
    if (this.keys_.hasOwnProperty(key)) {
      goog.events.unlistenByKey(listenerObj);
    }
  }, this);
  this.keys_ = {};
};
goog.events.EventHandler.prototype.disposeInternal = function() {
  goog.events.EventHandler.superClass_.disposeInternal.call(this);
  this.removeAll();
};
goog.events.EventHandler.prototype.handleEvent = function(e) {
  throw new Error("EventHandler.handleEvent not implemented");
};

//# sourceMappingURL=goog.events.eventhandler.js.map
