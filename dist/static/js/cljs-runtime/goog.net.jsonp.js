goog.provide("goog.net.Jsonp");
goog.require("goog.functions");
goog.require("goog.html.TrustedResourceUrl");
goog.require("goog.net.jsloader");
goog.require("goog.object");
goog.net.Jsonp = function(uri, opt_callbackParamName) {
  this.uri_ = uri;
  this.callbackParamName_ = opt_callbackParamName ? opt_callbackParamName : "callback";
  this.timeout_ = 5000;
  this.nonce_ = "";
};
goog.net.Jsonp.CALLBACKS = "_callbacks_";
goog.net.Jsonp.scriptCounter_ = 0;
goog.net.Jsonp.getCallbackId_ = function(id) {
  return goog.net.Jsonp.CALLBACKS + "__" + id;
};
goog.net.Jsonp.prototype.setRequestTimeout = function(timeout) {
  this.timeout_ = timeout;
};
goog.net.Jsonp.prototype.getRequestTimeout = function() {
  return this.timeout_;
};
goog.net.Jsonp.prototype.setNonce = function(nonce) {
  this.nonce_ = nonce;
};
goog.net.Jsonp.prototype.send = function(opt_payload, opt_replyCallback, opt_errorCallback, opt_callbackParamValue) {
  const payload = opt_payload ? goog.object.clone(opt_payload) : {};
  const id = opt_callbackParamValue || "_" + (goog.net.Jsonp.scriptCounter_++).toString(36) + Date.now().toString(36);
  const callbackId = goog.net.Jsonp.getCallbackId_(id);
  if (opt_replyCallback) {
    const reply = goog.net.Jsonp.newReplyHandler_(id, opt_replyCallback);
    goog.global[callbackId] = reply;
    payload[this.callbackParamName_] = callbackId;
  }
  const options = {timeout:this.timeout_, cleanupWhenDone:true};
  if (this.nonce_) {
    options.attributes = {"nonce":this.nonce_};
  }
  const uri = this.uri_.cloneWithParams(payload);
  const deferred = goog.net.jsloader.safeLoad(uri, options);
  const error = goog.net.Jsonp.newErrorHandler_(id, payload, opt_errorCallback);
  deferred.addErrback(error);
  return {id_:id, deferred_:deferred};
};
goog.net.Jsonp.prototype.cancel = function(request) {
  if (request) {
    if (request.deferred_) {
      request.deferred_.cancel();
    }
    if (request.id_) {
      goog.net.Jsonp.cleanup_(request.id_, false);
    }
  }
};
goog.net.Jsonp.newErrorHandler_ = function(id, payload, opt_errorCallback) {
  return function() {
    goog.net.Jsonp.cleanup_(id, false);
    if (opt_errorCallback) {
      opt_errorCallback(payload);
    }
  };
};
goog.net.Jsonp.newReplyHandler_ = function(id, replyCallback) {
  const handler = function(var_args) {
    goog.net.Jsonp.cleanup_(id, true);
    replyCallback.apply(undefined, arguments);
  };
  return handler;
};
goog.net.Jsonp.cleanup_ = function(id, deleteReplyHandler) {
  const callbackId = goog.net.Jsonp.getCallbackId_(id);
  if (goog.global[callbackId]) {
    if (deleteReplyHandler) {
      try {
        delete goog.global[callbackId];
      } catch (e) {
        goog.global[callbackId] = undefined;
      }
    } else {
      goog.global[callbackId] = goog.functions.UNDEFINED;
    }
  }
};

//# sourceMappingURL=goog.net.jsonp.js.map
