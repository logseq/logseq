goog.provide("goog.net.XhrIo");
goog.provide("goog.net.XhrIo.ResponseType");
goog.require("goog.Timer");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.collections.maps");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.events.EventTarget");
goog.require("goog.json.hybrid");
goog.require("goog.log");
goog.require("goog.net.ErrorCode");
goog.require("goog.net.EventType");
goog.require("goog.net.HttpStatus");
goog.require("goog.net.XmlHttp");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.uri.utils");
goog.require("goog.userAgent");
goog.requireType("goog.Uri");
goog.requireType("goog.debug.ErrorHandler");
goog.requireType("goog.net.XhrLike");
goog.requireType("goog.net.XmlHttpFactory");
goog.scope(function() {
  goog.net.XhrIo = function(opt_xmlHttpFactory) {
    XhrIo.base(this, "constructor");
    this.headers = new Map();
    this.xmlHttpFactory_ = opt_xmlHttpFactory || null;
    this.active_ = false;
    this.xhr_ = null;
    this.xhrOptions_ = null;
    this.lastUri_ = "";
    this.lastMethod_ = "";
    this.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
    this.lastError_ = "";
    this.errorDispatched_ = false;
    this.inSend_ = false;
    this.inOpen_ = false;
    this.inAbort_ = false;
    this.timeoutInterval_ = 0;
    this.timeoutId_ = null;
    this.responseType_ = ResponseType.DEFAULT;
    this.withCredentials_ = false;
    this.progressEventsEnabled_ = false;
    this.useXhr2Timeout_ = false;
    this.trustToken_ = null;
  };
  goog.inherits(goog.net.XhrIo, goog.events.EventTarget);
  const XhrIo = goog.net.XhrIo;
  goog.net.XhrIo.ResponseType = {DEFAULT:"", TEXT:"text", DOCUMENT:"document", BLOB:"blob", ARRAY_BUFFER:"arraybuffer",};
  const ResponseType = goog.net.XhrIo.ResponseType;
  goog.net.XhrIo.prototype.logger_ = goog.log.getLogger("goog.net.XhrIo");
  goog.net.XhrIo.CONTENT_TYPE_HEADER = "Content-Type";
  goog.net.XhrIo.CONTENT_TRANSFER_ENCODING = "Content-Transfer-Encoding";
  goog.net.XhrIo.HTTP_SCHEME_PATTERN = /^https?$/i;
  const HTTP_SCHEME_PATTERN = goog.net.XhrIo.HTTP_SCHEME_PATTERN;
  goog.net.XhrIo.METHODS_WITH_FORM_DATA = ["POST", "PUT"];
  goog.net.XhrIo.FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset\x3dutf-8";
  goog.net.XhrIo.XHR2_TIMEOUT_ = "timeout";
  goog.net.XhrIo.XHR2_ON_TIMEOUT_ = "ontimeout";
  goog.net.XhrIo.sendInstances_ = [];
  goog.net.XhrIo.send = function(url, opt_callback, opt_method, opt_content, opt_headers, opt_timeoutInterval, opt_withCredentials) {
    const x = new goog.net.XhrIo();
    goog.net.XhrIo.sendInstances_.push(x);
    if (opt_callback) {
      x.listen(goog.net.EventType.COMPLETE, opt_callback);
    }
    x.listenOnce(goog.net.EventType.READY, x.cleanupSend_);
    if (opt_timeoutInterval) {
      x.setTimeoutInterval(opt_timeoutInterval);
    }
    if (opt_withCredentials) {
      x.setWithCredentials(opt_withCredentials);
    }
    x.send(url, opt_method, opt_content, opt_headers);
    return x;
  };
  goog.net.XhrIo.cleanup = function() {
    const instances = goog.net.XhrIo.sendInstances_;
    while (instances.length) {
      instances.pop().dispose();
    }
  };
  goog.net.XhrIo.protectEntryPoints = function(errorHandler) {
    goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = errorHandler.protectEntryPoint(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_);
  };
  goog.net.XhrIo.prototype.cleanupSend_ = function() {
    this.dispose();
    goog.array.remove(goog.net.XhrIo.sendInstances_, this);
  };
  goog.net.XhrIo.prototype.getTimeoutInterval = function() {
    return this.timeoutInterval_;
  };
  goog.net.XhrIo.prototype.setTimeoutInterval = function(ms) {
    this.timeoutInterval_ = Math.max(0, ms);
  };
  goog.net.XhrIo.prototype.setResponseType = function(type) {
    this.responseType_ = type;
  };
  goog.net.XhrIo.prototype.getResponseType = function() {
    return this.responseType_;
  };
  goog.net.XhrIo.prototype.setWithCredentials = function(withCredentials) {
    this.withCredentials_ = withCredentials;
  };
  goog.net.XhrIo.prototype.getWithCredentials = function() {
    return this.withCredentials_;
  };
  goog.net.XhrIo.prototype.setProgressEventsEnabled = function(enabled) {
    this.progressEventsEnabled_ = enabled;
  };
  goog.net.XhrIo.prototype.getProgressEventsEnabled = function() {
    return this.progressEventsEnabled_;
  };
  goog.net.XhrIo.prototype.setTrustToken = function(trustToken) {
    this.trustToken_ = trustToken;
  };
  goog.net.XhrIo.prototype.send = function(url, opt_method, opt_content, opt_headers) {
    if (this.xhr_) {
      throw new Error("[goog.net.XhrIo] Object is active with another request\x3d" + this.lastUri_ + "; newUri\x3d" + url);
    }
    const method = opt_method ? opt_method.toUpperCase() : "GET";
    this.lastUri_ = url;
    this.lastError_ = "";
    this.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
    this.lastMethod_ = method;
    this.errorDispatched_ = false;
    this.active_ = true;
    this.xhr_ = this.createXhr();
    this.xhrOptions_ = this.xmlHttpFactory_ ? this.xmlHttpFactory_.getOptions() : goog.net.XmlHttp.getOptions();
    this.xhr_.onreadystatechange = goog.bind(this.onReadyStateChange_, this);
    if (this.getProgressEventsEnabled() && "onprogress" in this.xhr_) {
      this.xhr_.onprogress = goog.bind(function(e) {
        this.onProgressHandler_(e, true);
      }, this);
      if (this.xhr_.upload) {
        this.xhr_.upload.onprogress = goog.bind(this.onProgressHandler_, this);
      }
    }
    try {
      goog.log.fine(this.logger_, this.formatMsg_("Opening Xhr"));
      this.inOpen_ = true;
      this.xhr_.open(method, String(url), true);
      this.inOpen_ = false;
    } catch (err) {
      goog.log.fine(this.logger_, this.formatMsg_("Error opening Xhr: " + err.message));
      this.error_(goog.net.ErrorCode.EXCEPTION, err);
      return;
    }
    const content = opt_content || "";
    const headers = new Map(this.headers);
    if (opt_headers) {
      if (Object.getPrototypeOf(opt_headers) === Object.prototype) {
        for (let key in opt_headers) {
          headers.set(key, opt_headers[key]);
        }
      } else if (typeof opt_headers.keys === "function" && typeof opt_headers.get === "function") {
        for (const key of opt_headers.keys()) {
          headers.set(key, opt_headers.get(key));
        }
      } else {
        throw new Error("Unknown input type for opt_headers: " + String(opt_headers));
      }
    }
    const contentTypeKey = Array.from(headers.keys()).find(header => goog.string.caseInsensitiveEquals(goog.net.XhrIo.CONTENT_TYPE_HEADER, header));
    const contentIsFormData = goog.global["FormData"] && content instanceof goog.global["FormData"];
    if (goog.array.contains(goog.net.XhrIo.METHODS_WITH_FORM_DATA, method) && !contentTypeKey && !contentIsFormData) {
      headers.set(goog.net.XhrIo.CONTENT_TYPE_HEADER, goog.net.XhrIo.FORM_CONTENT_TYPE);
    }
    for (const [key, value] of headers) {
      this.xhr_.setRequestHeader(key, value);
    }
    if (this.responseType_) {
      this.xhr_.responseType = this.responseType_;
    }
    if ("withCredentials" in this.xhr_ && this.xhr_.withCredentials !== this.withCredentials_) {
      this.xhr_.withCredentials = this.withCredentials_;
    }
    if ("setTrustToken" in this.xhr_ && this.trustToken_) {
      try {
        this.xhr_.setTrustToken(this.trustToken_);
      } catch (err) {
        goog.log.fine(this.logger_, this.formatMsg_("Error SetTrustToken: " + err.message));
      }
    }
    try {
      this.cleanUpTimeoutTimer_();
      if (this.timeoutInterval_ > 0) {
        this.useXhr2Timeout_ = goog.net.XhrIo.shouldUseXhr2Timeout_(this.xhr_);
        goog.log.fine(this.logger_, this.formatMsg_("Will abort after " + this.timeoutInterval_ + "ms if incomplete, xhr2 " + this.useXhr2Timeout_));
        if (this.useXhr2Timeout_) {
          this.xhr_[goog.net.XhrIo.XHR2_TIMEOUT_] = this.timeoutInterval_;
          this.xhr_[goog.net.XhrIo.XHR2_ON_TIMEOUT_] = goog.bind(this.timeout_, this);
        } else {
          this.timeoutId_ = goog.Timer.callOnce(this.timeout_, this.timeoutInterval_, this);
        }
      }
      goog.log.fine(this.logger_, this.formatMsg_("Sending request"));
      this.inSend_ = true;
      this.xhr_.send(content);
      this.inSend_ = false;
    } catch (err) {
      goog.log.fine(this.logger_, this.formatMsg_("Send error: " + err.message));
      this.error_(goog.net.ErrorCode.EXCEPTION, err);
    }
  };
  goog.net.XhrIo.shouldUseXhr2Timeout_ = function(xhr) {
    return goog.userAgent.IE && typeof xhr[goog.net.XhrIo.XHR2_TIMEOUT_] === "number" && xhr[goog.net.XhrIo.XHR2_ON_TIMEOUT_] !== undefined;
  };
  goog.net.XhrIo.prototype.createXhr = function() {
    return this.xmlHttpFactory_ ? this.xmlHttpFactory_.createInstance() : goog.net.XmlHttp();
  };
  goog.net.XhrIo.prototype.timeout_ = function() {
    if (typeof goog == "undefined") {
    } else if (this.xhr_) {
      this.lastError_ = "Timed out after " + this.timeoutInterval_ + "ms, aborting";
      this.lastErrorCode_ = goog.net.ErrorCode.TIMEOUT;
      goog.log.fine(this.logger_, this.formatMsg_(this.lastError_));
      this.dispatchEvent(goog.net.EventType.TIMEOUT);
      this.abort(goog.net.ErrorCode.TIMEOUT);
    }
  };
  goog.net.XhrIo.prototype.error_ = function(errorCode, err) {
    this.active_ = false;
    if (this.xhr_) {
      this.inAbort_ = true;
      this.xhr_.abort();
      this.inAbort_ = false;
    }
    this.lastError_ = err;
    this.lastErrorCode_ = errorCode;
    this.dispatchErrors_();
    this.cleanUpXhr_();
  };
  goog.net.XhrIo.prototype.dispatchErrors_ = function() {
    if (!this.errorDispatched_) {
      this.errorDispatched_ = true;
      this.dispatchEvent(goog.net.EventType.COMPLETE);
      this.dispatchEvent(goog.net.EventType.ERROR);
    }
  };
  goog.net.XhrIo.prototype.abort = function(opt_failureCode) {
    if (this.xhr_ && this.active_) {
      goog.log.fine(this.logger_, this.formatMsg_("Aborting"));
      this.active_ = false;
      this.inAbort_ = true;
      this.xhr_.abort();
      this.inAbort_ = false;
      this.lastErrorCode_ = opt_failureCode || goog.net.ErrorCode.ABORT;
      this.dispatchEvent(goog.net.EventType.COMPLETE);
      this.dispatchEvent(goog.net.EventType.ABORT);
      this.cleanUpXhr_();
    }
  };
  goog.net.XhrIo.prototype.disposeInternal = function() {
    if (this.xhr_) {
      if (this.active_) {
        this.active_ = false;
        this.inAbort_ = true;
        this.xhr_.abort();
        this.inAbort_ = false;
      }
      this.cleanUpXhr_(true);
    }
    XhrIo.base(this, "disposeInternal");
  };
  goog.net.XhrIo.prototype.onReadyStateChange_ = function() {
    if (this.isDisposed()) {
      return;
    }
    if (!this.inOpen_ && !this.inSend_ && !this.inAbort_) {
      this.onReadyStateChangeEntryPoint_();
    } else {
      this.onReadyStateChangeHelper_();
    }
  };
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = function() {
    this.onReadyStateChangeHelper_();
  };
  goog.net.XhrIo.prototype.onReadyStateChangeHelper_ = function() {
    if (!this.active_) {
      return;
    }
    if (typeof goog == "undefined") {
    } else if (this.xhrOptions_[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE && this.getStatus() == 2) {
      goog.log.fine(this.logger_, this.formatMsg_("Local request error detected and ignored"));
    } else {
      if (this.inSend_ && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE) {
        goog.Timer.callOnce(this.onReadyStateChange_, 0, this);
        return;
      }
      this.dispatchEvent(goog.net.EventType.READY_STATE_CHANGE);
      if (this.isComplete()) {
        goog.log.fine(this.logger_, this.formatMsg_("Request complete"));
        this.active_ = false;
        try {
          if (this.isSuccess()) {
            this.dispatchEvent(goog.net.EventType.COMPLETE);
            this.dispatchEvent(goog.net.EventType.SUCCESS);
          } else {
            this.lastErrorCode_ = goog.net.ErrorCode.HTTP_ERROR;
            this.lastError_ = this.getStatusText() + " [" + this.getStatus() + "]";
            this.dispatchErrors_();
          }
        } finally {
          this.cleanUpXhr_();
        }
      }
    }
  };
  goog.net.XhrIo.prototype.onProgressHandler_ = function(e, opt_isDownload) {
    goog.asserts.assert(e.type === goog.net.EventType.PROGRESS, "goog.net.EventType.PROGRESS is of the same type as raw XHR progress.");
    this.dispatchEvent(goog.net.XhrIo.buildProgressEvent_(e, goog.net.EventType.PROGRESS));
    this.dispatchEvent(goog.net.XhrIo.buildProgressEvent_(e, opt_isDownload ? goog.net.EventType.DOWNLOAD_PROGRESS : goog.net.EventType.UPLOAD_PROGRESS));
  };
  goog.net.XhrIo.buildProgressEvent_ = function(e, eventType) {
    return {type:eventType, lengthComputable:e.lengthComputable, loaded:e.loaded, total:e.total,};
  };
  goog.net.XhrIo.prototype.cleanUpXhr_ = function(opt_fromDispose) {
    if (this.xhr_) {
      this.cleanUpTimeoutTimer_();
      const xhr = this.xhr_;
      const clearedOnReadyStateChange = this.xhrOptions_[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] ? () => {
      } : null;
      this.xhr_ = null;
      this.xhrOptions_ = null;
      if (!opt_fromDispose) {
        this.dispatchEvent(goog.net.EventType.READY);
      }
      try {
        xhr.onreadystatechange = clearedOnReadyStateChange;
      } catch (e) {
        goog.log.error(this.logger_, "Problem encountered resetting onreadystatechange: " + e.message);
      }
    }
  };
  goog.net.XhrIo.prototype.cleanUpTimeoutTimer_ = function() {
    if (this.xhr_ && this.useXhr2Timeout_) {
      this.xhr_[goog.net.XhrIo.XHR2_ON_TIMEOUT_] = null;
    }
    if (this.timeoutId_) {
      goog.Timer.clear(this.timeoutId_);
      this.timeoutId_ = null;
    }
  };
  goog.net.XhrIo.prototype.isActive = function() {
    return !!this.xhr_;
  };
  goog.net.XhrIo.prototype.isComplete = function() {
    return this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE;
  };
  goog.net.XhrIo.prototype.isSuccess = function() {
    const status = this.getStatus();
    return goog.net.HttpStatus.isSuccess(status) || status === 0 && !this.isLastUriEffectiveSchemeHttp_();
  };
  goog.net.XhrIo.prototype.isLastUriEffectiveSchemeHttp_ = function() {
    const scheme = goog.uri.utils.getEffectiveScheme(String(this.lastUri_));
    return HTTP_SCHEME_PATTERN.test(scheme);
  };
  goog.net.XhrIo.prototype.getReadyState = function() {
    return this.xhr_ ? this.xhr_.readyState : goog.net.XmlHttp.ReadyState.UNINITIALIZED;
  };
  goog.net.XhrIo.prototype.getStatus = function() {
    try {
      return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.status : -1;
    } catch (e) {
      return -1;
    }
  };
  goog.net.XhrIo.prototype.getStatusText = function() {
    try {
      return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.statusText : "";
    } catch (e) {
      goog.log.fine(this.logger_, "Can not get status: " + e.message);
      return "";
    }
  };
  goog.net.XhrIo.prototype.getLastUri = function() {
    return String(this.lastUri_);
  };
  goog.net.XhrIo.prototype.getResponseText = function() {
    try {
      return this.xhr_ ? this.xhr_.responseText : "";
    } catch (e) {
      goog.log.fine(this.logger_, "Can not get responseText: " + e.message);
      return "";
    }
  };
  goog.net.XhrIo.prototype.getResponseBody = function() {
    try {
      if (this.xhr_ && "responseBody" in this.xhr_) {
        return this.xhr_["responseBody"];
      }
    } catch (e) {
      goog.log.fine(this.logger_, "Can not get responseBody: " + e.message);
    }
    return null;
  };
  goog.net.XhrIo.prototype.getResponseXml = function() {
    try {
      return this.xhr_ ? this.xhr_.responseXML : null;
    } catch (e) {
      goog.log.fine(this.logger_, "Can not get responseXML: " + e.message);
      return null;
    }
  };
  goog.net.XhrIo.prototype.getResponseJson = function(opt_xssiPrefix) {
    if (!this.xhr_) {
      return undefined;
    }
    let responseText = this.xhr_.responseText;
    if (opt_xssiPrefix && responseText.indexOf(opt_xssiPrefix) == 0) {
      responseText = responseText.substring(opt_xssiPrefix.length);
    }
    return goog.json.hybrid.parse(responseText);
  };
  goog.net.XhrIo.prototype.getResponse = function() {
    try {
      if (!this.xhr_) {
        return null;
      }
      if ("response" in this.xhr_) {
        return this.xhr_.response;
      }
      switch(this.responseType_) {
        case ResponseType.DEFAULT:
        case ResponseType.TEXT:
          return this.xhr_.responseText;
        case ResponseType.ARRAY_BUFFER:
          if ("mozResponseArrayBuffer" in this.xhr_) {
            return this.xhr_.mozResponseArrayBuffer;
          }
      }
      goog.log.error(this.logger_, "Response type " + this.responseType_ + " is not " + "supported on this browser");
      return null;
    } catch (e) {
      goog.log.fine(this.logger_, "Can not get response: " + e.message);
      return null;
    }
  };
  goog.net.XhrIo.prototype.getResponseHeader = function(key) {
    if (!this.xhr_ || !this.isComplete()) {
      return undefined;
    }
    const value = this.xhr_.getResponseHeader(key);
    return value === null ? undefined : value;
  };
  goog.net.XhrIo.prototype.getAllResponseHeaders = function() {
    return this.xhr_ && this.getReadyState() >= goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.getAllResponseHeaders() || "" : "";
  };
  goog.net.XhrIo.prototype.getResponseHeaders = function() {
    const headersObject = {};
    const headersArray = this.getAllResponseHeaders().split("\r\n");
    for (let i = 0; i < headersArray.length; i++) {
      if (goog.string.isEmptyOrWhitespace(headersArray[i])) {
        continue;
      }
      const keyValue = goog.string.splitLimit(headersArray[i], ":", 1);
      const key = keyValue[0];
      let value = keyValue[1];
      if (typeof value !== "string") {
        continue;
      }
      value = value.trim();
      const values = headersObject[key] || [];
      headersObject[key] = values;
      values.push(value);
    }
    return goog.object.map(headersObject, function(values) {
      return values.join(", ");
    });
  };
  goog.net.XhrIo.prototype.getStreamingResponseHeader = function(key) {
    return this.xhr_ ? this.xhr_.getResponseHeader(key) : null;
  };
  goog.net.XhrIo.prototype.getAllStreamingResponseHeaders = function() {
    return this.xhr_ ? this.xhr_.getAllResponseHeaders() : "";
  };
  goog.net.XhrIo.prototype.getLastErrorCode = function() {
    return this.lastErrorCode_;
  };
  goog.net.XhrIo.prototype.getLastError = function() {
    return typeof this.lastError_ === "string" ? this.lastError_ : String(this.lastError_);
  };
  goog.net.XhrIo.prototype.formatMsg_ = function(msg) {
    return msg + " [" + this.lastMethod_ + " " + this.lastUri_ + " " + this.getStatus() + "]";
  };
  goog.debug.entryPointRegistry.register(function(transformer) {
    goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = transformer(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_);
  });
});

//# sourceMappingURL=goog.net.xhrio.js.map
