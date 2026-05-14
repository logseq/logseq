goog.provide("goog.html.TrustedResourceUrl");
goog.require("goog.asserts");
goog.require("goog.fs.blob");
goog.require("goog.fs.url");
goog.require("goog.html.SafeScript");
goog.require("goog.html.trustedtypes");
goog.require("goog.string.Const");
goog.require("goog.string.TypedString");
goog.html.TrustedResourceUrl = class {
  constructor(value, token) {
    this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ = token === goog.html.TrustedResourceUrl.CONSTRUCTOR_TOKEN_PRIVATE_ ? value : "";
  }
  toString() {
    return this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ + "";
  }
};
goog.html.TrustedResourceUrl.prototype.implementsGoogStringTypedString = true;
goog.html.TrustedResourceUrl.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_.toString();
};
goog.html.TrustedResourceUrl.prototype.cloneWithParams = function(searchParams, opt_hashParams) {
  var url = goog.html.TrustedResourceUrl.unwrap(this);
  var parts = goog.html.TrustedResourceUrl.URL_PARAM_PARSER_.exec(url);
  var urlBase = parts[1];
  var urlSearch = parts[2] || "";
  var urlHash = parts[3] || "";
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(urlBase + goog.html.TrustedResourceUrl.stringifyParams_("?", urlSearch, searchParams) + goog.html.TrustedResourceUrl.stringifyParams_("#", urlHash, opt_hashParams));
};
goog.html.TrustedResourceUrl.unwrap = function(trustedResourceUrl) {
  return goog.html.TrustedResourceUrl.unwrapTrustedScriptURL(trustedResourceUrl).toString();
};
goog.html.TrustedResourceUrl.unwrapTrustedScriptURL = function(trustedResourceUrl) {
  if (trustedResourceUrl instanceof goog.html.TrustedResourceUrl && trustedResourceUrl.constructor === goog.html.TrustedResourceUrl) {
    return trustedResourceUrl.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_;
  } else {
    goog.asserts.fail("expected object of type TrustedResourceUrl, got '" + trustedResourceUrl + "' of type " + goog.typeOf(trustedResourceUrl));
    return "type_error:TrustedResourceUrl";
  }
};
goog.html.TrustedResourceUrl.format = function(format, args) {
  var formatStr = goog.string.Const.unwrap(format);
  if (!goog.html.TrustedResourceUrl.BASE_URL_.test(formatStr)) {
    throw new Error("Invalid TrustedResourceUrl format: " + formatStr);
  }
  var result = formatStr.replace(goog.html.TrustedResourceUrl.FORMAT_MARKER_, function(match, id) {
    if (!Object.prototype.hasOwnProperty.call(args, id)) {
      throw new Error('Found marker, "' + id + '", in format string, "' + formatStr + '", but no valid label mapping found ' + "in args: " + JSON.stringify(args));
    }
    var arg = args[id];
    if (arg instanceof goog.string.Const) {
      return goog.string.Const.unwrap(arg);
    } else {
      return encodeURIComponent(String(arg));
    }
  });
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(result);
};
goog.html.TrustedResourceUrl.FORMAT_MARKER_ = /%{(\w+)}/g;
goog.html.TrustedResourceUrl.BASE_URL_ = new RegExp("^((https:)?//[0-9a-z.:[\\]-]+/" + "|/[^/\\\\]" + "|[^:/\\\\%]+/" + "|[^:/\\\\%]*[?#]" + "|about:blank#" + ")", "i");
goog.html.TrustedResourceUrl.URL_PARAM_PARSER_ = /^([^?#]*)(\?[^#]*)?(#[\s\S]*)?/;
goog.html.TrustedResourceUrl.formatWithParams = function(format, args, searchParams, opt_hashParams) {
  var url = goog.html.TrustedResourceUrl.format(format, args);
  return url.cloneWithParams(searchParams, opt_hashParams);
};
goog.html.TrustedResourceUrl.fromConstant = function(url) {
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(goog.string.Const.unwrap(url));
};
goog.html.TrustedResourceUrl.fromConstants = function(parts) {
  var unwrapped = "";
  for (var i = 0; i < parts.length; i++) {
    unwrapped += goog.string.Const.unwrap(parts[i]);
  }
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(unwrapped);
};
goog.html.TrustedResourceUrl.fromSafeScript = function(safeScript) {
  var blob = goog.fs.blob.getBlobWithProperties([goog.html.SafeScript.unwrap(safeScript)], "text/javascript");
  var url = goog.fs.url.createObjectUrl(blob);
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(url);
};
goog.html.TrustedResourceUrl.CONSTRUCTOR_TOKEN_PRIVATE_ = {};
goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse = function(url) {
  const noinlineUrl = url;
  const policy = goog.html.trustedtypes.getPolicyPrivateDoNotAccessOrElse();
  const value = policy ? policy.createScriptURL(noinlineUrl) : noinlineUrl;
  return new goog.html.TrustedResourceUrl(value, goog.html.TrustedResourceUrl.CONSTRUCTOR_TOKEN_PRIVATE_);
};
goog.html.TrustedResourceUrl.stringifyParams_ = function(prefix, currentString, params) {
  if (params == null) {
    return currentString;
  }
  if (typeof params === "string") {
    return params ? prefix + encodeURIComponent(params) : "";
  }
  for (var key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      var value = params[key];
      var outputValues = Array.isArray(value) ? value : [value];
      for (var i = 0; i < outputValues.length; i++) {
        var outputValue = outputValues[i];
        if (outputValue != null) {
          if (!currentString) {
            currentString = prefix;
          }
          currentString += (currentString.length > prefix.length ? "\x26" : "") + encodeURIComponent(key) + "\x3d" + encodeURIComponent(String(outputValue));
        }
      }
    }
  }
  return currentString;
};

//# sourceMappingURL=goog.html.trustedresourceurl.js.map
