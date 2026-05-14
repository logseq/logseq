goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.asserts");
goog.require("goog.events");
goog.require("goog.events.Event");
goog.require("goog.events.Listenable");
goog.require("goog.events.ListenerMap");
goog.require("goog.object");
goog.requireType("goog.events.EventId");
goog.requireType("goog.events.EventLike");
goog.requireType("goog.events.ListenableKey");
goog.events.EventTarget = function() {
  goog.Disposable.call(this);
  this.eventTargetListeners_ = new goog.events.ListenerMap(this);
  this.actualEventTarget_ = this;
  this.parentEventTarget_ = null;
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.Listenable.addImplementation(goog.events.EventTarget);
goog.events.EventTarget.MAX_ANCESTORS_ = 1000;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_;
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent;
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope);
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope);
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  this.assertInitialized_();
  var ancestorsTree, ancestor = this.getParentEventTarget();
  if (ancestor) {
    ancestorsTree = [];
    var ancestorCount = 1;
    for (; ancestor; ancestor = ancestor.getParentEventTarget()) {
      ancestorsTree.push(ancestor);
      goog.asserts.assert(++ancestorCount < goog.events.EventTarget.MAX_ANCESTORS_, "infinite loop");
    }
  }
  return goog.events.EventTarget.dispatchEventInternal_(this.actualEventTarget_, e, ancestorsTree);
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  this.removeAllListeners();
  this.parentEventTarget_ = null;
};
goog.events.EventTarget.prototype.listen = function(type, listener, opt_useCapture, opt_listenerScope) {
  this.assertInitialized_();
  return this.eventTargetListeners_.add(String(type), listener, false, opt_useCapture, opt_listenerScope);
};
goog.events.EventTarget.prototype.listenOnce = function(type, listener, opt_useCapture, opt_listenerScope) {
  return this.eventTargetListeners_.add(String(type), listener, true, opt_useCapture, opt_listenerScope);
};
goog.events.EventTarget.prototype.unlisten = function(type, listener, opt_useCapture, opt_listenerScope) {
  return this.eventTargetListeners_.remove(String(type), listener, opt_useCapture, opt_listenerScope);
};
goog.events.EventTarget.prototype.unlistenByKey = function(key) {
  return this.eventTargetListeners_.removeByKey(key);
};
goog.events.EventTarget.prototype.removeAllListeners = function(opt_type) {
  if (!this.eventTargetListeners_) {
    return 0;
  }
  return this.eventTargetListeners_.removeAll(opt_type);
};
goog.events.EventTarget.prototype.fireListeners = function(type, capture, eventObject) {
  var listenerArray = this.eventTargetListeners_.listeners[String(type)];
  if (!listenerArray) {
    return true;
  }
  listenerArray = listenerArray.concat();
  var rv = true;
  for (var i = 0; i < listenerArray.length; ++i) {
    var listener = listenerArray[i];
    if (listener && !listener.removed && listener.capture == capture) {
      var listenerFn = listener.listener;
      var listenerHandler = listener.handler || listener.src;
      if (listener.callOnce) {
        this.unlistenByKey(listener);
      }
      rv = listenerFn.call(listenerHandler, eventObject) !== false && rv;
    }
  }
  return rv && !eventObject.defaultPrevented;
};
goog.events.EventTarget.prototype.getListeners = function(type, capture) {
  return this.eventTargetListeners_.getListeners(String(type), capture);
};
goog.events.EventTarget.prototype.getListener = function(type, listener, capture, opt_listenerScope) {
  return this.eventTargetListeners_.getListener(String(type), listener, capture, opt_listenerScope);
};
goog.events.EventTarget.prototype.hasListener = function(opt_type, opt_capture) {
  var id = opt_type !== undefined ? String(opt_type) : undefined;
  return this.eventTargetListeners_.hasListener(id, opt_capture);
};
goog.events.EventTarget.prototype.setTargetForTesting = function(target) {
  this.actualEventTarget_ = target;
};
goog.events.EventTarget.prototype.assertInitialized_ = function() {
  goog.asserts.assert(this.eventTargetListeners_, "Event target is not initialized. Did you call the superclass " + "(goog.events.EventTarget) constructor?");
};
goog.events.EventTarget.dispatchEventInternal_ = function(target, e, opt_ancestorsTree) {
  var type = e.type || e;
  if (typeof e === "string") {
    e = new goog.events.Event(e, target);
  } else if (!(e instanceof goog.events.Event)) {
    var oldEvent = e;
    e = new goog.events.Event(type, target);
    goog.object.extend(e, oldEvent);
  } else {
    e.target = e.target || target;
  }
  var rv = true, currentTarget;
  if (opt_ancestorsTree) {
    for (var i = opt_ancestorsTree.length - 1; !e.hasPropagationStopped() && i >= 0; i--) {
      currentTarget = e.currentTarget = opt_ancestorsTree[i];
      rv = currentTarget.fireListeners(type, true, e) && rv;
    }
  }
  if (!e.hasPropagationStopped()) {
    currentTarget = e.currentTarget = target;
    rv = currentTarget.fireListeners(type, true, e) && rv;
    if (!e.hasPropagationStopped()) {
      rv = currentTarget.fireListeners(type, false, e) && rv;
    }
  }
  if (opt_ancestorsTree) {
    for (i = 0; !e.hasPropagationStopped() && i < opt_ancestorsTree.length; i++) {
      currentTarget = e.currentTarget = opt_ancestorsTree[i];
      rv = currentTarget.fireListeners(type, false, e) && rv;
    }
  }
  return rv;
};

//# sourceMappingURL=goog.events.eventtarget.js.map
