goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.debug.errorcontext");
goog.debug.LOGGING_ENABLED = goog.define("goog.debug.LOGGING_ENABLED", goog.DEBUG);
goog.debug.FORCE_SLOPPY_STACKS = goog.define("goog.debug.FORCE_SLOPPY_STACKS", false);
goog.debug.CHECK_FOR_THROWN_EVENT = goog.define("goog.debug.CHECK_FOR_THROWN_EVENT", false);
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  var retVal = !!opt_cancel;
  target.onerror = function(message, url, line, opt_col, opt_error) {
    if (oldErrorHandler) {
      oldErrorHandler(message, url, line, opt_col, opt_error);
    }
    logFunc({message:message, fileName:url, line:line, lineNumber:line, col:opt_col, error:opt_error});
    return retVal;
  };
};
goog.debug.expose = function(obj, opt_showFn) {
  if (typeof obj == "undefined") {
    return "undefined";
  }
  if (obj == null) {
    return "NULL";
  }
  var str = [];
  for (var x in obj) {
    if (!opt_showFn && typeof obj[x] === "function") {
      continue;
    }
    var s = x + " \x3d ";
    try {
      s += obj[x];
    } catch (e) {
      s += "*** " + e + " ***";
    }
    str.push(s);
  }
  return str.join("\n");
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var str = [];
  var uidsToCleanup = [];
  var ancestorUids = {};
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space);
    };
    try {
      if (obj === undefined) {
        str.push("undefined");
      } else if (obj === null) {
        str.push("NULL");
      } else if (typeof obj === "string") {
        str.push('"' + indentMultiline(obj) + '"');
      } else if (typeof obj === "function") {
        str.push(indentMultiline(String(obj)));
      } else if (goog.isObject(obj)) {
        if (!goog.hasUid(obj)) {
          uidsToCleanup.push(obj);
        }
        var uid = goog.getUid(obj);
        if (ancestorUids[uid]) {
          str.push("*** reference loop detected (id\x3d" + uid + ") ***");
        } else {
          ancestorUids[uid] = true;
          str.push("{");
          for (var x in obj) {
            if (!opt_showFn && typeof obj[x] === "function") {
              continue;
            }
            str.push("\n");
            str.push(nestspace);
            str.push(x + " \x3d ");
            helper(obj[x], nestspace);
          }
          str.push("\n" + space + "}");
          delete ancestorUids[uid];
        }
      } else {
        str.push(obj);
      }
    } catch (e) {
      str.push("*** " + e + " ***");
    }
  };
  helper(obj, "");
  for (var i = 0; i < uidsToCleanup.length; i++) {
    goog.removeUid(uidsToCleanup[i]);
  }
  return str.join("");
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for (var i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]));
    } else {
      str.push(arr[i]);
    }
  }
  return "[ " + str.join(", ") + " ]";
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if (err == null) {
    err = 'Unknown Error of type "null/undefined"';
  }
  if (typeof err === "string") {
    return {"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"};
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || err.line || "Not available";
  } catch (e) {
    lineNumber = "Not available";
    threwError = true;
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || goog.global["$googDebugFname"] || href;
  } catch (e) {
    fileName = "Not available";
    threwError = true;
  }
  var stack = goog.debug.serializeErrorStack_(err);
  if (threwError || !err.lineNumber || !err.fileName || !err.stack || !err.message || !err.name) {
    var message = err.message;
    if (message == null) {
      if (err.constructor && err.constructor instanceof Function) {
        var ctorName = err.constructor.name ? err.constructor.name : goog.debug.getFunctionName(err.constructor);
        message = 'Unknown Error of type "' + ctorName + '"';
        if (goog.debug.CHECK_FOR_THROWN_EVENT && ctorName == "Event") {
          try {
            message = message + ' with Event.type "' + (err.type || "") + '"';
          } catch (e) {
          }
        }
      } else {
        message = "Unknown Error of unknown type";
      }
      if (typeof err.toString === "function" && Object.prototype.toString !== err.toString) {
        message += ": " + err.toString();
      }
    }
    return {"message":message, "name":err.name || "UnknownError", "lineNumber":lineNumber, "fileName":fileName, "stack":stack || "Not available"};
  }
  err.stack = stack;
  return {"message":err.message, "name":err.name, "lineNumber":err.lineNumber, "fileName":err.fileName, "stack":err.stack};
};
goog.debug.serializeErrorStack_ = function(e, seen) {
  if (!seen) {
    seen = {};
  }
  seen[goog.debug.serializeErrorAsKey_(e)] = true;
  var stack = e["stack"] || "";
  var cause = e.cause;
  if (cause && !seen[goog.debug.serializeErrorAsKey_(cause)]) {
    stack += "\nCaused by: ";
    if (!cause.stack || cause.stack.indexOf(cause.toString()) != 0) {
      stack += typeof cause === "string" ? cause : cause.message + "\n";
    }
    stack += goog.debug.serializeErrorStack_(cause, seen);
  }
  return stack;
};
goog.debug.serializeErrorAsKey_ = function(e) {
  var keyPrefix = "";
  if (typeof e.toString === "function") {
    keyPrefix = "" + e;
  }
  return keyPrefix + e["stack"];
};
goog.debug.enhanceError = function(err, opt_message) {
  var error;
  if (!(err instanceof Error)) {
    error = Error(err);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, goog.debug.enhanceError);
    }
  } else {
    error = err;
  }
  if (!error.stack) {
    error.stack = goog.debug.getStacktrace(goog.debug.enhanceError);
  }
  if (opt_message) {
    var x = 0;
    while (error["message" + x]) {
      ++x;
    }
    error["message" + x] = String(opt_message);
  }
  return error;
};
goog.debug.enhanceErrorWithContext = function(err, opt_context) {
  var error = goog.debug.enhanceError(err);
  if (opt_context) {
    for (var key in opt_context) {
      goog.debug.errorcontext.addErrorContext(error, key, opt_context[key]);
    }
  }
  return error;
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  if (!goog.debug.FORCE_SLOPPY_STACKS) {
    var stack = goog.debug.getNativeStackTrace_(goog.debug.getStacktraceSimple);
    if (stack) {
      return stack;
    }
  }
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while (fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller;
    } catch (e) {
      sb.push("[exception trying to get caller]\n");
      break;
    }
    depth++;
    if (depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break;
    }
  }
  if (opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]");
  } else {
    sb.push("[end]");
  }
  return sb.join("");
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getNativeStackTrace_ = function(fn) {
  var tempErr = new Error();
  if (Error.captureStackTrace) {
    Error.captureStackTrace(tempErr, fn);
    return String(tempErr.stack);
  } else {
    try {
      throw tempErr;
    } catch (e) {
      tempErr = e;
    }
    var stack = tempErr.stack;
    if (stack) {
      return String(stack);
    }
  }
  return null;
};
goog.debug.getStacktrace = function(fn) {
  var stack;
  if (!goog.debug.FORCE_SLOPPY_STACKS) {
    var contextFn = fn || goog.debug.getStacktrace;
    stack = goog.debug.getNativeStackTrace_(contextFn);
  }
  if (!stack) {
    stack = goog.debug.getStacktraceHelper_(fn || arguments.callee.caller, []);
  }
  return stack;
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if (goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]");
  } else if (fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
    sb.push(goog.debug.getFunctionName(fn) + "(");
    var args = fn.arguments;
    for (var i = 0; args && i < args.length; i++) {
      if (i > 0) {
        sb.push(", ");
      }
      var argDesc;
      var arg = args[i];
      switch(typeof arg) {
        case "object":
          argDesc = arg ? "object" : "null";
          break;
        case "string":
          argDesc = arg;
          break;
        case "number":
          argDesc = String(arg);
          break;
        case "boolean":
          argDesc = arg ? "true" : "false";
          break;
        case "function":
          argDesc = goog.debug.getFunctionName(arg);
          argDesc = argDesc ? argDesc : "[fn]";
          break;
        case "undefined":
        default:
          argDesc = typeof arg;
          break;
      }
      if (argDesc.length > 40) {
        argDesc = argDesc.slice(0, 40) + "...";
      }
      sb.push(argDesc);
    }
    visited.push(fn);
    sb.push(")\n");
    try {
      sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited));
    } catch (e) {
      sb.push("[exception trying to get caller]\n");
    }
  } else if (fn) {
    sb.push("[...long stack...]");
  } else {
    sb.push("[end]");
  }
  return sb.join("");
};
goog.debug.getFunctionName = function(fn) {
  if (goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn];
  }
  var functionSource = String(fn);
  if (!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function\s+([^\(]+)/m.exec(functionSource);
    if (matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method;
    } else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]";
    }
  }
  return goog.debug.fnNameCache_[functionSource];
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]");
};
goog.debug.runtimeType = function(value) {
  if (value instanceof Function) {
    return value.displayName || value.name || "unknown type name";
  } else if (value instanceof Object) {
    return value.constructor.displayName || value.constructor.name || Object.prototype.toString.call(value);
  } else {
    return value === null ? "null" : typeof value;
  }
};
goog.debug.fnNameCache_ = {};
goog.debug.freezeInternal_ = goog.DEBUG && Object.freeze || function(arg) {
  return arg;
};
goog.debug.freeze = function(arg) {
  return {valueOf:function() {
    return goog.debug.freezeInternal_(arg);
  }}.valueOf();
};

//# sourceMappingURL=goog.debug.debug.js.map
