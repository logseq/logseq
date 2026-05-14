goog.provide("goog.events");
goog.provide("goog.events.CaptureSimulationMode");
goog.provide("goog.events.Key");
goog.provide("goog.events.ListenableType");
goog.require("goog.asserts");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Listenable");
goog.require("goog.events.ListenerMap");
goog.requireType("goog.debug.ErrorHandler");
goog.requireType("goog.events.EventId");
goog.requireType("goog.events.EventLike");
goog.requireType("goog.events.EventWrapper");
goog.requireType("goog.events.ListenableKey");
goog.requireType("goog.events.Listener");
goog.events.Key;
goog.events.ListenableType;
goog.events.LISTENER_MAP_PROP_ = "closure_lm_" + (Math.random() * 1e6 | 0);
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.CaptureSimulationMode = {OFF_AND_FAIL:0, OFF_AND_SILENT:1, ON:2};
goog.events.CAPTURE_SIMULATION_MODE = goog.define("goog.events.CAPTURE_SIMULATION_MODE", 2);
goog.events.listenerCountEstimate_ = 0;
goog.events.listen = function(src, type, listener, opt_options, opt_handler) {
  if (opt_options && opt_options.once) {
    return goog.events.listenOnce(src, type, listener, opt_options, opt_handler);
  }
  if (Array.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.listen(src, type[i], listener, opt_options, opt_handler);
    }
    return null;
  }
  listener = goog.events.wrapListener(listener);
  if (goog.events.Listenable.isImplementedBy(src)) {
    var capture = goog.isObject(opt_options) ? !!opt_options.capture : !!opt_options;
    return src.listen(type, listener, capture, opt_handler);
  } else {
    return goog.events.listen_(src, type, listener, false, opt_options, opt_handler);
  }
};
goog.events.listen_ = function(src, type, listener, callOnce, opt_options, opt_handler) {
  if (!type) {
    throw new Error("Invalid event type");
  }
  var capture = goog.isObject(opt_options) ? !!opt_options.capture : !!opt_options;
  var listenerMap = goog.events.getListenerMap_(src);
  if (!listenerMap) {
    src[goog.events.LISTENER_MAP_PROP_] = listenerMap = new goog.events.ListenerMap(src);
  }
  var listenerObj = listenerMap.add(type, listener, callOnce, capture, opt_handler);
  if (listenerObj.proxy) {
    return listenerObj;
  }
  var proxy = goog.events.getProxy();
  listenerObj.proxy = proxy;
  proxy.src = src;
  proxy.listener = listenerObj;
  if (src.addEventListener) {
    if (!goog.events.BrowserFeature.PASSIVE_EVENTS) {
      opt_options = capture;
    }
    if (opt_options === undefined) {
      opt_options = false;
    }
    src.addEventListener(type.toString(), proxy, opt_options);
  } else if (src.attachEvent) {
    src.attachEvent(goog.events.getOnString_(type.toString()), proxy);
  } else if (src.addListener && src.removeListener) {
    goog.asserts.assert(type === "change", "MediaQueryList only has a change event");
    src.addListener(proxy);
  } else {
    throw new Error("addEventListener and attachEvent are unavailable.");
  }
  goog.events.listenerCountEstimate_++;
  return listenerObj;
};
goog.events.getProxy = function() {
  const proxyCallbackFunction = goog.events.handleBrowserEvent_;
  const f = function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.listener, eventObject);
  };
  return f;
};
goog.events.listenOnce = function(src, type, listener, opt_options, opt_handler) {
  if (Array.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.listenOnce(src, type[i], listener, opt_options, opt_handler);
    }
    return null;
  }
  listener = goog.events.wrapListener(listener);
  if (goog.events.Listenable.isImplementedBy(src)) {
    var capture = goog.isObject(opt_options) ? !!opt_options.capture : !!opt_options;
    return src.listenOnce(type, listener, capture, opt_handler);
  } else {
    return goog.events.listen_(src, type, listener, true, opt_options, opt_handler);
  }
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler);
};
goog.events.unlisten = function(src, type, listener, opt_options, opt_handler) {
  if (Array.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.unlisten(src, type[i], listener, opt_options, opt_handler);
    }
    return null;
  }
  var capture = goog.isObject(opt_options) ? !!opt_options.capture : !!opt_options;
  listener = goog.events.wrapListener(listener);
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.unlisten(type, listener, capture, opt_handler);
  }
  if (!src) {
    return false;
  }
  var listenerMap = goog.events.getListenerMap_(src);
  if (listenerMap) {
    var listenerObj = listenerMap.getListener(type, listener, capture, opt_handler);
    if (listenerObj) {
      return goog.events.unlistenByKey(listenerObj);
    }
  }
  return false;
};
goog.events.unlistenByKey = function(key) {
  if (typeof key === "number") {
    return false;
  }
  var listener = key;
  if (!listener || listener.removed) {
    return false;
  }
  var src = listener.src;
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.unlistenByKey(listener);
  }
  var type = listener.type;
  var proxy = listener.proxy;
  if (src.removeEventListener) {
    src.removeEventListener(type, proxy, listener.capture);
  } else if (src.detachEvent) {
    src.detachEvent(goog.events.getOnString_(type), proxy);
  } else if (src.addListener && src.removeListener) {
    src.removeListener(proxy);
  }
  goog.events.listenerCountEstimate_--;
  var listenerMap = goog.events.getListenerMap_(src);
  if (listenerMap) {
    listenerMap.removeByKey(listener);
    if (listenerMap.getTypeCount() == 0) {
      listenerMap.src = null;
      src[goog.events.LISTENER_MAP_PROP_] = null;
    }
  } else {
    listener.markAsRemoved();
  }
  return true;
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler);
};
goog.events.removeAll = function(obj, opt_type) {
  if (!obj) {
    return 0;
  }
  if (goog.events.Listenable.isImplementedBy(obj)) {
    return obj.removeAllListeners(opt_type);
  }
  var listenerMap = goog.events.getListenerMap_(obj);
  if (!listenerMap) {
    return 0;
  }
  var count = 0;
  var typeStr = opt_type && opt_type.toString();
  for (var type in listenerMap.listeners) {
    if (!typeStr || type == typeStr) {
      var listeners = listenerMap.listeners[type].concat();
      for (var i = 0; i < listeners.length; ++i) {
        if (goog.events.unlistenByKey(listeners[i])) {
          ++count;
        }
      }
    }
  }
  return count;
};
goog.events.getListeners = function(obj, type, capture) {
  if (goog.events.Listenable.isImplementedBy(obj)) {
    return obj.getListeners(type, capture);
  } else {
    if (!obj) {
      return [];
    }
    var listenerMap = goog.events.getListenerMap_(obj);
    return listenerMap ? listenerMap.getListeners(type, capture) : [];
  }
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  type = type;
  listener = goog.events.wrapListener(listener);
  var capture = !!opt_capt;
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.getListener(type, listener, capture, opt_handler);
  }
  if (!src) {
    return null;
  }
  var listenerMap = goog.events.getListenerMap_(src);
  if (listenerMap) {
    return listenerMap.getListener(type, listener, capture, opt_handler);
  }
  return null;
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  if (goog.events.Listenable.isImplementedBy(obj)) {
    return obj.hasListener(opt_type, opt_capture);
  }
  var listenerMap = goog.events.getListenerMap_(obj);
  return !!listenerMap && listenerMap.hasListener(opt_type, opt_capture);
};
goog.events.expose = function(e) {
  var str = [];
  for (var key in e) {
    if (e[key] && e[key].id) {
      str.push(key + " \x3d " + e[key] + " (" + e[key].id + ")");
    } else {
      str.push(key + " \x3d " + e[key]);
    }
  }
  return str.join("\n");
};
goog.events.getOnString_ = function(type) {
  if (type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type];
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type;
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  if (goog.events.Listenable.isImplementedBy(obj)) {
    return obj.fireListeners(type, capture, eventObject);
  }
  return goog.events.fireListeners_(obj, type, capture, eventObject);
};
goog.events.fireListeners_ = function(obj, type, capture, eventObject) {
  var retval = true;
  var listenerMap = goog.events.getListenerMap_(obj);
  if (listenerMap) {
    var listenerArray = listenerMap.listeners[type.toString()];
    if (listenerArray) {
      listenerArray = listenerArray.concat();
      for (var i = 0; i < listenerArray.length; i++) {
        var listener = listenerArray[i];
        if (listener && listener.capture == capture && !listener.removed) {
          var result = goog.events.fireListener(listener, eventObject);
          retval = retval && result !== false;
        }
      }
    }
  }
  return retval;
};
goog.events.fireListener = function(listener, eventObject) {
  var listenerFn = listener.listener;
  var listenerHandler = listener.handler || listener.src;
  if (listener.callOnce) {
    goog.events.unlistenByKey(listener);
  }
  return listenerFn.call(listenerHandler, eventObject);
};
goog.events.getTotalListenerCount = function() {
  return goog.events.listenerCountEstimate_;
};
goog.events.dispatchEvent = function(src, e) {
  goog.asserts.assert(goog.events.Listenable.isImplementedBy(src), "Can not use goog.events.dispatchEvent with " + "non-goog.events.Listenable instance.");
  return src.dispatchEvent(e);
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
};
goog.events.handleBrowserEvent_ = function(listener, opt_evt) {
  if (listener.removed) {
    return true;
  }
  return goog.events.fireListener(listener, new goog.events.BrowserEvent(opt_evt, this));
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if (e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return;
    } catch (ex) {
      useReturnValue = true;
    }
  }
  if (useReturnValue || e.returnValue == undefined) {
    e.returnValue = true;
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined;
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++;
};
goog.events.getListenerMap_ = function(src) {
  var listenerMap = src[goog.events.LISTENER_MAP_PROP_];
  return listenerMap instanceof goog.events.ListenerMap ? listenerMap : null;
};
goog.events.LISTENER_WRAPPER_PROP_ = "__closure_events_fn_" + (Math.random() * 1e9 >>> 0);
goog.events.wrapListener = function(listener) {
  goog.asserts.assert(listener, "Listener can not be null.");
  if (typeof listener === "function") {
    return listener;
  }
  goog.asserts.assert(listener.handleEvent, "An object listener must have handleEvent method.");
  if (!listener[goog.events.LISTENER_WRAPPER_PROP_]) {
    listener[goog.events.LISTENER_WRAPPER_PROP_] = function(e) {
      return listener.handleEvent(e);
    };
  }
  return listener[goog.events.LISTENER_WRAPPER_PROP_];
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
});

//# sourceMappingURL=goog.events.events.js.map
