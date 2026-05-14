#!/usr/bin/env node
(function(){
var shadow$provide = {};

var SHADOW_IMPORT_PATH = __dirname + '/../.shadow-cljs/builds/test/dev/out/cljs-runtime';
if (__dirname == '.') { SHADOW_IMPORT_PATH = "/Users/rcmerci/gh-repos/logseq/.shadow-cljs/builds/test/dev/out/cljs-runtime"; }
global.$CLJS = global;
global.shadow$provide = {};
try {require('source-map-support').install();} catch (e) {console.warn('no "source-map-support" (run "npm install source-map-support --save-dev" to get it)');}

global.CLOSURE_NO_DEPS = true;

global.CLOSURE_DEFINES = {"goog.DEBUG":true,"goog.LOCALE":"en","goog.TRANSPILE":"never","goog.ENABLE_DEBUG_LOADER":false,"frontend.util.NODETEST":true,"logseq.shui.util.NODETEST":true,"cljs.core._STAR_target_STAR_":"nodejs"};

var goog = global.goog = {};

var SHADOW_IMPORTED = global.SHADOW_IMPORTED = {};
var PATH = require("path");
var VM = require("vm");
var FS = require("fs");

var SHADOW_PROVIDE = function(name) {
  return goog.exportPath_(name, undefined);
};

var SHADOW_REQUIRE = function(name) {
  if (goog.isInModuleLoader_()) {
    return goog.module.getInternal_(name);
  }
  return true;
};

var SHADOW_WRAP = function(js) {
  var code = "(function (require, module, __filename, __dirname) {\n";
  // this is part of goog/base.js and for some reason the only global var not on goog or goog.global
  code += "var COMPILED = false;\n"
  code += js;
  code += "\n});";
  return code;
};

var SHADOW_IMPORT = global.SHADOW_IMPORT = function(src) {
  if (CLOSURE_DEFINES["shadow.debug"]) {
    console.info("SHADOW load:", src);
  }

  SHADOW_IMPORTED[src] = true;

  // SHADOW_IMPORT_PATH is an absolute path
  var filePath = PATH.resolve(SHADOW_IMPORT_PATH, src);

  var js = FS.readFileSync(filePath);

  var code = SHADOW_WRAP(js);

  var fn = VM.runInThisContext(code,
    {filename: filePath,
     lineOffset: -2, // see SHADOW_WRAP, adds 2 lines
     displayErrors: true
     });

  // the comment is for source-map-support which unfortunately shows the wrong piece of code but the stack is correct
  try {
  /* ignore this, look at stacktrace */ fn.call(global, require, module, __filename, __dirname);
  } catch (e) {
    console.error("SHADOW import error", filePath);
    throw e;
  }

  return true;
};

// strip a leading comment as generated for (defn x "foo" [a] a)
// /**
//  * foo
//  */
// (function (){

function SHADOW_STRIP_COMMENT(js) {
  if (!js.startsWith("/*")) {
    return js;
  } else {
    return js.substring(js.indexOf("*/") + 2).trimLeft();
  }
};

global.SHADOW_NODE_EVAL = function(js, smJson) {
  // special case handling for require since it may otherwise not be available
  // FIXME: source maps get destroyed by the strip
  js = "(function cljsEval(require) {\n return " + SHADOW_STRIP_COMMENT(js) + "\n});";

  if (smJson) {
    js += "\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,";
    js += Buffer.from(smJson).toString('base64');
  }

  // console.log(js);

  var fn = VM.runInThisContext.call(global, js,
    {filename: "<eval>",
     lineOffset: -1, // wrapper adds one line on top
     displayErrors: true});

  // console.log("result", fn);

  return fn(require);
};

var COMPILED = false;
var goog = goog || {};
goog.global = global;
goog.global.CLOSURE_UNCOMPILED_DEFINES;
goog.global.CLOSURE_DEFINES;
goog.exportPath_ = function(name, object, overwriteImplicit, objectToExportTo) {
  var parts = name.split(".");
  var cur = objectToExportTo || goog.global;
  if (!(parts[0] in cur) && typeof cur.execScript != "undefined") {
    cur.execScript("var " + parts[0]);
  }
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && object !== undefined) {
      if (!overwriteImplicit && goog.isObject(object) && goog.isObject(cur[part])) {
        for (var prop in object) {
          if (object.hasOwnProperty(prop)) {
            cur[part][prop] = object[prop];
          }
        }
      } else {
        cur[part] = object;
      }
    } else if (cur[part] && cur[part] !== Object.prototype[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};
goog.define = function(name, defaultValue) {
  var value = defaultValue;
  if (!COMPILED) {
    var uncompiledDefines = goog.global.CLOSURE_UNCOMPILED_DEFINES;
    var defines = goog.global.CLOSURE_DEFINES;
    if (uncompiledDefines && uncompiledDefines.nodeType === undefined && Object.prototype.hasOwnProperty.call(uncompiledDefines, name)) {
      value = uncompiledDefines[name];
    } else if (defines && defines.nodeType === undefined && Object.prototype.hasOwnProperty.call(defines, name)) {
      value = defines[name];
    }
  }
  return value;
};
goog.FEATURESET_YEAR = goog.define("goog.FEATURESET_YEAR", 2012);
goog.DEBUG = goog.define("goog.DEBUG", true);
goog.LOCALE = goog.define("goog.LOCALE", "en");
goog.TRUSTED_SITE = goog.define("goog.TRUSTED_SITE", true);
goog.DISALLOW_TEST_ONLY_CODE = goog.define("goog.DISALLOW_TEST_ONLY_CODE", COMPILED && !goog.DEBUG);
goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING = goog.define("goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING", false);
goog.provide = function(name) {
  if (goog.isInModuleLoader_()) {
    throw new Error("goog.provide cannot be used within a module.");
  }
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      throw new Error('Namespace "' + name + '" already declared.');
    }
  }
  goog.constructNamespace_(name);
};
goog.constructNamespace_ = function(name, object, overwriteImplicit) {
  if (!COMPILED) {
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while (namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }
  goog.exportPath_(name, object, overwriteImplicit);
};
goog.NONCE_PATTERN_ = /^[\w+/_-]+[=]{0,2}$/;
goog.getScriptNonce_ = function(opt_window) {
  var doc = (opt_window || goog.global).document;
  var script = doc.querySelector && doc.querySelector("script[nonce]");
  if (script) {
    var nonce = script["nonce"] || script.getAttribute("nonce");
    if (nonce && goog.NONCE_PATTERN_.test(nonce)) {
      return nonce;
    }
  }
  return "";
};
goog.VALID_MODULE_RE_ = /^[a-zA-Z_$][a-zA-Z0-9._$]*$/;
goog.module = function(name) {
  if (typeof name !== "string" || !name || name.search(goog.VALID_MODULE_RE_) == -1) {
    throw new Error("Invalid module identifier");
  }
  if (!goog.isInGoogModuleLoader_()) {
    throw new Error("Module " + name + " has been loaded incorrectly. Note, " + "modules cannot be loaded as normal scripts. They require some kind of " + "pre-processing step. You're likely trying to load a module via a " + "script tag or as a part of a concatenated bundle without rewriting the " + "module. For more info see: " + "https://github.com/google/closure-library/wiki/goog.module:-an-ES6-module-like-alternative-to-goog.provide.");
  }
  if (goog.moduleLoaderState_.moduleName) {
    throw new Error("goog.module may only be called once per module.");
  }
  goog.moduleLoaderState_.moduleName = name;
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      throw new Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
  }
};
goog.module.get = function(name) {
  return goog.module.getInternal_(name);
};
goog.module.getInternal_ = function(name) {
  if (!COMPILED) {
    if (name in goog.loadedModules_) {
      return goog.loadedModules_[name].exports;
    } else if (!goog.implicitNamespaces_[name]) {
      var ns = goog.getObjectByName(name);
      return ns != null ? ns : null;
    }
  }
  return null;
};
goog.ModuleType = {ES6:"es6", GOOG:"goog"};
goog.moduleLoaderState_ = null;
goog.isInModuleLoader_ = function() {
  return goog.isInGoogModuleLoader_() || goog.isInEs6ModuleLoader_();
};
goog.isInGoogModuleLoader_ = function() {
  return !!goog.moduleLoaderState_ && goog.moduleLoaderState_.type == goog.ModuleType.GOOG;
};
goog.isInEs6ModuleLoader_ = function() {
  var inLoader = !!goog.moduleLoaderState_ && goog.moduleLoaderState_.type == goog.ModuleType.ES6;
  if (inLoader) {
    return true;
  }
  var jscomp = goog.global["$jscomp"];
  if (jscomp) {
    if (typeof jscomp.getCurrentModulePath != "function") {
      return false;
    }
    return !!jscomp.getCurrentModulePath();
  }
  return false;
};
goog.module.declareLegacyNamespace = function() {
  if (!COMPILED && !goog.isInGoogModuleLoader_()) {
    throw new Error("goog.module.declareLegacyNamespace must be called from " + "within a goog.module");
  }
  if (!COMPILED && !goog.moduleLoaderState_.moduleName) {
    throw new Error("goog.module must be called prior to " + "goog.module.declareLegacyNamespace.");
  }
  goog.moduleLoaderState_.declareLegacyNamespace = true;
};
goog.declareModuleId = function(namespace) {
  if (!COMPILED) {
    if (!goog.isInEs6ModuleLoader_()) {
      throw new Error("goog.declareModuleId may only be called from " + "within an ES6 module");
    }
    if (goog.moduleLoaderState_ && goog.moduleLoaderState_.moduleName) {
      throw new Error("goog.declareModuleId may only be called once per module.");
    }
    if (namespace in goog.loadedModules_) {
      throw new Error('Module with namespace "' + namespace + '" already exists.');
    }
  }
  if (goog.moduleLoaderState_) {
    goog.moduleLoaderState_.moduleName = namespace;
  } else {
    var jscomp = goog.global["$jscomp"];
    if (!jscomp || typeof jscomp.getCurrentModulePath != "function") {
      throw new Error('Module with namespace "' + namespace + '" has been loaded incorrectly.');
    }
    var exports = jscomp.require(jscomp.getCurrentModulePath());
    goog.loadedModules_[namespace] = {exports:exports, type:goog.ModuleType.ES6, moduleId:namespace};
  }
};
goog.setTestOnly = function(opt_message) {
  if (goog.DISALLOW_TEST_ONLY_CODE) {
    opt_message = opt_message || "";
    throw new Error("Importing test-only code into non-debug environment" + (opt_message ? ": " + opt_message : "."));
  }
};
goog.forwardDeclare = function(name) {
};
goog.forwardDeclare("Document");
goog.forwardDeclare("HTMLScriptElement");
goog.forwardDeclare("XMLHttpRequest");
if (!COMPILED) {
  goog.isProvided_ = function(name) {
    return name in goog.loadedModules_ || !goog.implicitNamespaces_[name] && goog.getObjectByName(name) != null;
  };
  goog.implicitNamespaces_ = {"goog.module":true};
}
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for (var i = 0; i < parts.length; i++) {
    cur = cur[parts[i]];
    if (cur == null) {
      return null;
    }
  }
  return cur;
};
goog.addDependency = function(relPath, provides, requires, opt_loadFlags) {
  if (!COMPILED && goog.DEPENDENCIES_ENABLED) {
    goog.debugLoader_.addDependency(relPath, provides, requires, opt_loadFlags);
  }
};
goog.ENABLE_DEBUG_LOADER = goog.define("goog.ENABLE_DEBUG_LOADER", true);
goog.logToConsole_ = function(msg) {
  if (goog.global.console) {
    goog.global.console["error"](msg);
  }
};
goog.require = function(namespace) {
  if (!COMPILED) {
    if (goog.ENABLE_DEBUG_LOADER) {
      goog.debugLoader_.requested(namespace);
    }
    if (goog.isProvided_(namespace)) {
      if (goog.isInModuleLoader_()) {
        return goog.module.getInternal_(namespace);
      }
    } else if (goog.ENABLE_DEBUG_LOADER) {
      var moduleLoaderState = goog.moduleLoaderState_;
      goog.moduleLoaderState_ = null;
      try {
        goog.debugLoader_.load_(namespace);
      } finally {
        goog.moduleLoaderState_ = moduleLoaderState;
      }
    }
    return null;
  }
};
goog.requireType = function(namespace) {
  return {};
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.abstractMethod = function() {
  throw new Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.instance_ = undefined;
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    if (goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
    }
    return ctor.instance_ = new ctor();
  };
};
goog.instantiatedSingletons_ = [];
goog.LOAD_MODULE_USING_EVAL = goog.define("goog.LOAD_MODULE_USING_EVAL", true);
goog.SEAL_MODULE_EXPORTS = goog.define("goog.SEAL_MODULE_EXPORTS", goog.DEBUG);
goog.loadedModules_ = {};
goog.DEPENDENCIES_ENABLED = !COMPILED && goog.ENABLE_DEBUG_LOADER;
goog.TRANSPILE = goog.define("goog.TRANSPILE", "detect");
goog.ASSUME_ES_MODULES_TRANSPILED = goog.define("goog.ASSUME_ES_MODULES_TRANSPILED", false);
goog.TRUSTED_TYPES_POLICY_NAME = goog.define("goog.TRUSTED_TYPES_POLICY_NAME", "goog");
goog.hasBadLetScoping = null;
goog.loadModule = function(moduleDef) {
  var previousState = goog.moduleLoaderState_;
  try {
    goog.moduleLoaderState_ = {moduleName:"", declareLegacyNamespace:false, type:goog.ModuleType.GOOG};
    var origExports = {};
    var exports = origExports;
    if (typeof moduleDef === "function") {
      exports = moduleDef.call(undefined, exports);
    } else if (typeof moduleDef === "string") {
      exports = goog.loadModuleFromSource_.call(undefined, exports, moduleDef);
    } else {
      throw new Error("Invalid module definition");
    }
    var moduleName = goog.moduleLoaderState_.moduleName;
    if (typeof moduleName === "string" && moduleName) {
      if (goog.moduleLoaderState_.declareLegacyNamespace) {
        var isDefaultExport = origExports !== exports;
        goog.constructNamespace_(moduleName, exports, isDefaultExport);
      } else if (goog.SEAL_MODULE_EXPORTS && Object.seal && typeof exports == "object" && exports != null) {
        Object.seal(exports);
      }
      var data = {exports:exports, type:goog.ModuleType.GOOG, moduleId:goog.moduleLoaderState_.moduleName};
      goog.loadedModules_[moduleName] = data;
    } else {
      throw new Error('Invalid module name "' + moduleName + '"');
    }
  } finally {
    goog.moduleLoaderState_ = previousState;
  }
};
goog.loadModuleFromSource_ = function(exports) {
  eval(goog.CLOSURE_EVAL_PREFILTER_.createScript(arguments[1]));
  return exports;
};
goog.normalizePath_ = function(path) {
  var components = path.split("/");
  var i = 0;
  while (i < components.length) {
    if (components[i] == ".") {
      components.splice(i, 1);
    } else if (i && components[i] == ".." && components[i - 1] && components[i - 1] != "..") {
      components.splice(--i, 2);
    } else {
      i++;
    }
  }
  return components.join("/");
};
goog.global.CLOSURE_LOAD_FILE_SYNC;
goog.loadFileSync_ = function(src) {
  if (goog.global.CLOSURE_LOAD_FILE_SYNC) {
    return goog.global.CLOSURE_LOAD_FILE_SYNC(src);
  } else {
    try {
      var xhr = new goog.global["XMLHttpRequest"]();
      xhr.open("get", src, false);
      xhr.send();
      return xhr.status == 0 || xhr.status == 200 ? xhr.responseText : null;
    } catch (err) {
      return null;
    }
  }
};
goog.typeOf = function(value) {
  var s = typeof value;
  if (s != "object") {
    return s;
  }
  if (!value) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  return s;
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number";
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function";
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function";
};
goog.getUid = function(obj) {
  return Object.prototype.hasOwnProperty.call(obj, goog.UID_PROPERTY_) && obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};
goog.hasUid = function(obj) {
  return !!obj[goog.UID_PROPERTY_];
};
goog.removeUid = function(obj) {
  if (obj !== null && "removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (Math.random() * 1e9 >>> 0);
goog.uidCounter_ = 0;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == "object" || type == "array") {
    if (typeof obj.clone === "function") {
      return obj.clone();
    }
    if (typeof Map !== "undefined" && obj instanceof Map) {
      return new Map(obj);
    } else if (typeof Set !== "undefined" && obj instanceof Set) {
      return new Set(obj);
    }
    var clone = type == "array" ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }
  return obj;
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments);
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error();
  }
  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };
  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if (Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = args.slice();
    newArgs.push.apply(newArgs, arguments);
    return fn.apply(this, newArgs);
  };
};
goog.now = function() {
  return Date.now();
};
goog.globalEval = function(script) {
  (0,eval)(script);
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.global.CLOSURE_CSS_NAME_MAP_FN;
goog.getCssName = function(className, opt_modifier) {
  if (String(className).charAt(0) == ".") {
    throw new Error('className passed in goog.getCssName must not start with ".".' + " You passed: " + className);
  }
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join("-");
  };
  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }
  var result = opt_modifier ? className + "-" + rename(opt_modifier) : rename(className);
  if (goog.global.CLOSURE_CSS_NAME_MAP_FN) {
    return goog.global.CLOSURE_CSS_NAME_MAP_FN(result);
  }
  return result;
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}
goog.GetMsgOptions = function() {
};
goog.GetMsgOptions.prototype.html;
goog.GetMsgOptions.prototype.unescapeHtmlEntities;
goog.GetMsgOptions.prototype.original_code;
goog.GetMsgOptions.prototype.example;
goog.getMsg = function(str, opt_values, opt_options) {
  if (opt_options && opt_options.html) {
    str = str.replace(/</g, "\x26lt;");
  }
  if (opt_options && opt_options.unescapeHtmlEntities) {
    str = str.replace(/&lt;/g, "\x3c").replace(/&gt;/g, "\x3e").replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "\x26");
  }
  if (opt_values) {
    str = str.replace(/\{\$([^}]+)}/g, function(match, key) {
      return opt_values != null && key in opt_values ? opt_values[key] : match;
    });
  }
  return str;
};
goog.getMsgWithFallback = function(a, b) {
  return a;
};
goog.exportSymbol = function(publicPath, object, objectToExportTo) {
  goog.exportPath_(publicPath, object, true, objectToExportTo);
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
  childCtor.base = function(me, methodName, var_args) {
    var args = new Array(arguments.length - 2);
    for (var i = 2; i < arguments.length; i++) {
      args[i - 2] = arguments[i];
    }
    return parentCtor.prototype[methodName].apply(me, args);
  };
};
goog.scope = function(fn) {
  if (goog.isInModuleLoader_()) {
    throw new Error("goog.scope is not supported within a module.");
  }
  fn.call(goog.global);
};
if (!COMPILED) {
  goog.global["COMPILED"] = COMPILED;
}
goog.defineClass = function(superClass, def) {
  var constructor = def.constructor;
  var statics = def.statics;
  if (!constructor || constructor == Object.prototype.constructor) {
    constructor = function() {
      throw new Error("cannot instantiate an interface (no constructor defined).");
    };
  }
  var cls = goog.defineClass.createSealingConstructor_(constructor, superClass);
  if (superClass) {
    goog.inherits(cls, superClass);
  }
  delete def.constructor;
  delete def.statics;
  goog.defineClass.applyProperties_(cls.prototype, def);
  if (statics != null) {
    if (statics instanceof Function) {
      statics(cls);
    } else {
      goog.defineClass.applyProperties_(cls, statics);
    }
  }
  return cls;
};
goog.defineClass.ClassDescriptor;
goog.defineClass.SEAL_CLASS_INSTANCES = goog.define("goog.defineClass.SEAL_CLASS_INSTANCES", goog.DEBUG);
goog.defineClass.createSealingConstructor_ = function(ctr, superClass) {
  if (!goog.defineClass.SEAL_CLASS_INSTANCES) {
    return ctr;
  }
  var wrappedCtr = function() {
    var instance = ctr.apply(this, arguments) || this;
    instance[goog.UID_PROPERTY_] = instance[goog.UID_PROPERTY_];
    return instance;
  };
  return wrappedCtr;
};
goog.defineClass.OBJECT_PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.defineClass.applyProperties_ = function(target, source) {
  var key;
  for (key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
  for (var i = 0; i < goog.defineClass.OBJECT_PROTOTYPE_FIELDS_.length; i++) {
    key = goog.defineClass.OBJECT_PROTOTYPE_FIELDS_[i];
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
};
goog.identity_ = function(s) {
  return s;
};
goog.createTrustedTypesPolicy = function(name) {
  var policy = null;
  var policyFactory = goog.global.trustedTypes;
  if (!policyFactory || !policyFactory.createPolicy) {
    return policy;
  }
  try {
    policy = policyFactory.createPolicy(name, {createHTML:goog.identity_, createScript:goog.identity_, createScriptURL:goog.identity_});
  } catch (e) {
    goog.logToConsole_(e.message);
  }
  return policy;
};
if (!COMPILED && goog.DEPENDENCIES_ENABLED) {
  goog.isEdge_ = function() {
    var userAgent = goog.global.navigator && goog.global.navigator.userAgent ? goog.global.navigator.userAgent : "";
    var edgeRe = /Edge\/(\d+)(\.\d)*/i;
    return !!userAgent.match(edgeRe);
  };
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return doc != null && "write" in doc;
  };
  goog.isDocumentLoading_ = function() {
    var doc = goog.global.document;
    return doc.attachEvent ? doc.readyState != "complete" : doc.readyState == "loading";
  };
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH != undefined && typeof goog.global.CLOSURE_BASE_PATH === "string") {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    var currentScript = doc.currentScript;
    if (currentScript) {
      var scripts = [currentScript];
    } else {
      var scripts = doc.getElementsByTagName("SCRIPT");
    }
    for (var i = scripts.length - 1; i >= 0; --i) {
      var script = scripts[i];
      var src = script.src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if (src.slice(l - 7, l) == "base.js") {
        goog.basePath = src.slice(0, l - 7);
        return;
      }
    }
  };
  goog.findBasePath_();
  goog.protectScriptTag_ = function(str) {
    return str.replace(/<\/(SCRIPT)/ig, "\\x3c/$1");
  };
  goog.DebugLoader_ = function() {
    this.dependencies_ = {};
    this.idToPath_ = {};
    this.written_ = {};
    this.loadingDeps_ = [];
    this.depsToLoad_ = [];
    this.paused_ = false;
    this.factory_ = new goog.DependencyFactory();
    this.deferredCallbacks_ = {};
    this.deferredQueue_ = [];
  };
  goog.DebugLoader_.prototype.bootstrap = function(namespaces, callback) {
    var cb = callback;
    function resolve() {
      if (cb) {
        goog.global.setTimeout(cb, 0);
        cb = null;
      }
    }
    if (!namespaces.length) {
      resolve();
      return;
    }
    var deps = [];
    for (var i = 0; i < namespaces.length; i++) {
      var path = this.getPathFromDeps_(namespaces[i]);
      if (!path) {
        throw new Error("Unregonized namespace: " + namespaces[i]);
      }
      deps.push(this.dependencies_[path]);
    }
    var require = goog.require;
    var loaded = 0;
    for (var i = 0; i < namespaces.length; i++) {
      require(namespaces[i]);
      deps[i].onLoad(function() {
        if (++loaded == namespaces.length) {
          resolve();
        }
      });
    }
  };
  goog.DebugLoader_.prototype.loadClosureDeps = function() {
    var relPath = "deps.js";
    this.depsToLoad_.push(this.factory_.createDependency(goog.normalizePath_(goog.basePath + relPath), relPath, [], [], {}));
    this.loadDeps_();
  };
  goog.DebugLoader_.prototype.requested = function(absPathOrId, opt_force) {
    var path = this.getPathFromDeps_(absPathOrId);
    if (path && (opt_force || this.areDepsLoaded_(this.dependencies_[path].requires))) {
      var callback = this.deferredCallbacks_[path];
      if (callback) {
        delete this.deferredCallbacks_[path];
        callback();
      }
    }
  };
  goog.DebugLoader_.prototype.setDependencyFactory = function(factory) {
    this.factory_ = factory;
  };
  goog.DebugLoader_.prototype.load_ = function(namespace) {
    if (!this.getPathFromDeps_(namespace)) {
      var errorMessage = "goog.require could not find: " + namespace;
      goog.logToConsole_(errorMessage);
    } else {
      var loader = this;
      var deps = [];
      var visit = function(namespace) {
        var path = loader.getPathFromDeps_(namespace);
        if (!path) {
          throw new Error("Bad dependency path or symbol: " + namespace);
        }
        if (loader.written_[path]) {
          return;
        }
        loader.written_[path] = true;
        var dep = loader.dependencies_[path];
        for (var i = 0; i < dep.requires.length; i++) {
          if (!goog.isProvided_(dep.requires[i])) {
            visit(dep.requires[i]);
          }
        }
        deps.push(dep);
      };
      visit(namespace);
      var wasLoading = !!this.depsToLoad_.length;
      this.depsToLoad_ = this.depsToLoad_.concat(deps);
      if (!this.paused_ && !wasLoading) {
        this.loadDeps_();
      }
    }
  };
  goog.DebugLoader_.prototype.loadDeps_ = function() {
    var loader = this;
    var paused = this.paused_;
    while (this.depsToLoad_.length && !paused) {
      (function() {
        var loadCallDone = false;
        var dep = loader.depsToLoad_.shift();
        var loaded = false;
        loader.loading_(dep);
        var controller = {pause:function() {
          if (loadCallDone) {
            throw new Error("Cannot call pause after the call to load.");
          } else {
            paused = true;
          }
        }, resume:function() {
          if (loadCallDone) {
            loader.resume_();
          } else {
            paused = false;
          }
        }, loaded:function() {
          if (loaded) {
            throw new Error("Double call to loaded.");
          }
          loaded = true;
          loader.loaded_(dep);
        }, pending:function() {
          var pending = [];
          for (var i = 0; i < loader.loadingDeps_.length; i++) {
            pending.push(loader.loadingDeps_[i]);
          }
          return pending;
        }, setModuleState:function(type) {
          goog.moduleLoaderState_ = {type:type, moduleName:"", declareLegacyNamespace:false};
        }, registerEs6ModuleExports:function(path, exports, opt_closureNamespace) {
          if (opt_closureNamespace) {
            goog.loadedModules_[opt_closureNamespace] = {exports:exports, type:goog.ModuleType.ES6, moduleId:opt_closureNamespace || ""};
          }
        }, registerGoogModuleExports:function(moduleId, exports) {
          goog.loadedModules_[moduleId] = {exports:exports, type:goog.ModuleType.GOOG, moduleId:moduleId};
        }, clearModuleState:function() {
          goog.moduleLoaderState_ = null;
        }, defer:function(callback) {
          if (loadCallDone) {
            throw new Error("Cannot register with defer after the call to load.");
          }
          loader.defer_(dep, callback);
        }, areDepsLoaded:function() {
          return loader.areDepsLoaded_(dep.requires);
        }};
        try {
          dep.load(controller);
        } finally {
          loadCallDone = true;
        }
      })();
    }
    if (paused) {
      this.pause_();
    }
  };
  goog.DebugLoader_.prototype.pause_ = function() {
    this.paused_ = true;
  };
  goog.DebugLoader_.prototype.resume_ = function() {
    if (this.paused_) {
      this.paused_ = false;
      this.loadDeps_();
    }
  };
  goog.DebugLoader_.prototype.loading_ = function(dep) {
    this.loadingDeps_.push(dep);
  };
  goog.DebugLoader_.prototype.loaded_ = function(dep) {
    for (var i = 0; i < this.loadingDeps_.length; i++) {
      if (this.loadingDeps_[i] == dep) {
        this.loadingDeps_.splice(i, 1);
        break;
      }
    }
    for (var i = 0; i < this.deferredQueue_.length; i++) {
      if (this.deferredQueue_[i] == dep.path) {
        this.deferredQueue_.splice(i, 1);
        break;
      }
    }
    if (this.loadingDeps_.length == this.deferredQueue_.length && !this.depsToLoad_.length) {
      while (this.deferredQueue_.length) {
        this.requested(this.deferredQueue_.shift(), true);
      }
    }
    dep.loaded();
  };
  goog.DebugLoader_.prototype.areDepsLoaded_ = function(pathsOrIds) {
    for (var i = 0; i < pathsOrIds.length; i++) {
      var path = this.getPathFromDeps_(pathsOrIds[i]);
      if (!path || !(path in this.deferredCallbacks_) && !goog.isProvided_(pathsOrIds[i])) {
        return false;
      }
    }
    return true;
  };
  goog.DebugLoader_.prototype.getPathFromDeps_ = function(absPathOrId) {
    if (absPathOrId in this.idToPath_) {
      return this.idToPath_[absPathOrId];
    } else if (absPathOrId in this.dependencies_) {
      return absPathOrId;
    } else {
      return null;
    }
  };
  goog.DebugLoader_.prototype.defer_ = function(dependency, callback) {
    this.deferredCallbacks_[dependency.path] = callback;
    this.deferredQueue_.push(dependency.path);
  };
  goog.LoadController = function() {
  };
  goog.LoadController.prototype.pause = function() {
  };
  goog.LoadController.prototype.resume = function() {
  };
  goog.LoadController.prototype.loaded = function() {
  };
  goog.LoadController.prototype.pending = function() {
  };
  goog.LoadController.prototype.registerEs6ModuleExports = function(path, exports, opt_closureNamespace) {
  };
  goog.LoadController.prototype.setModuleState = function(type) {
  };
  goog.LoadController.prototype.clearModuleState = function() {
  };
  goog.LoadController.prototype.defer = function(callback) {
  };
  goog.LoadController.prototype.areDepsLoaded = function() {
  };
  goog.Dependency = function(path, relativePath, provides, requires, loadFlags) {
    this.path = path;
    this.relativePath = relativePath;
    this.provides = provides;
    this.requires = requires;
    this.loadFlags = loadFlags;
    this.loaded_ = false;
    this.loadCallbacks_ = [];
  };
  goog.Dependency.prototype.getPathName = function() {
    var pathName = this.path;
    var protocolIndex = pathName.indexOf("://");
    if (protocolIndex >= 0) {
      pathName = pathName.substring(protocolIndex + 3);
      var slashIndex = pathName.indexOf("/");
      if (slashIndex >= 0) {
        pathName = pathName.substring(slashIndex + 1);
      }
    }
    return pathName;
  };
  goog.Dependency.prototype.onLoad = function(callback) {
    if (this.loaded_) {
      callback();
    } else {
      this.loadCallbacks_.push(callback);
    }
  };
  goog.Dependency.prototype.loaded = function() {
    this.loaded_ = true;
    var callbacks = this.loadCallbacks_;
    this.loadCallbacks_ = [];
    for (var i = 0; i < callbacks.length; i++) {
      callbacks[i]();
    }
  };
  goog.Dependency.defer_ = false;
  goog.Dependency.callbackMap_ = {};
  goog.Dependency.registerCallback_ = function(callback) {
    var key = Math.random().toString(32);
    goog.Dependency.callbackMap_[key] = callback;
    return key;
  };
  goog.Dependency.unregisterCallback_ = function(key) {
    delete goog.Dependency.callbackMap_[key];
  };
  goog.Dependency.callback_ = function(key, var_args) {
    if (key in goog.Dependency.callbackMap_) {
      var callback = goog.Dependency.callbackMap_[key];
      var args = [];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      callback.apply(undefined, args);
    } else {
      var errorMessage = "Callback key " + key + " does not exist (was base.js loaded more than once?).";
      throw Error(errorMessage);
    }
  };
  goog.Dependency.prototype.load = function(controller) {
    if (goog.global.CLOSURE_IMPORT_SCRIPT) {
      if (goog.global.CLOSURE_IMPORT_SCRIPT(this.path)) {
        controller.loaded();
      } else {
        controller.pause();
      }
      return;
    }
    if (!goog.inHtmlDocument_()) {
      goog.logToConsole_("Cannot use default debug loader outside of HTML documents.");
      if (this.relativePath == "deps.js") {
        goog.logToConsole_("Consider setting CLOSURE_IMPORT_SCRIPT before loading base.js, " + "or setting CLOSURE_NO_DEPS to true.");
        controller.loaded();
      } else {
        controller.pause();
      }
      return;
    }
    var doc = goog.global.document;
    if (doc.readyState == "complete" && !goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING) {
      var isDeps = /\bdeps.js$/.test(this.path);
      if (isDeps) {
        controller.loaded();
        return;
      } else {
        throw Error('Cannot write "' + this.path + '" after document load');
      }
    }
    var nonce = goog.getScriptNonce_();
    if (!goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING && goog.isDocumentLoading_()) {
      var key;
      var callback = function(script) {
        if (script.readyState && script.readyState != "complete") {
          script.onload = callback;
          return;
        }
        goog.Dependency.unregisterCallback_(key);
        controller.loaded();
      };
      key = goog.Dependency.registerCallback_(callback);
      var defer = goog.Dependency.defer_ ? " defer" : "";
      var nonceAttr = nonce ? ' nonce\x3d"' + nonce + '"' : "";
      var script = '\x3cscript src\x3d"' + this.path + '"' + nonceAttr + defer + ' id\x3d"script-' + key + '"\x3e\x3c/script\x3e';
      script += "\x3cscript" + nonceAttr + "\x3e";
      if (goog.Dependency.defer_) {
        script += "document.getElementById('script-" + key + "').onload \x3d function() {\n" + "  goog.Dependency.callback_('" + key + "', this);\n" + "};\n";
      } else {
        script += "goog.Dependency.callback_('" + key + "', document.getElementById('script-" + key + "'));";
      }
      script += "\x3c/script\x3e";
      doc.write(goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createHTML(script) : script);
    } else {
      var scriptEl = doc.createElement("script");
      scriptEl.defer = goog.Dependency.defer_;
      scriptEl.async = false;
      if (nonce) {
        scriptEl.nonce = nonce;
      }
      scriptEl.onload = function() {
        scriptEl.onload = null;
        controller.loaded();
      };
      scriptEl.src = goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createScriptURL(this.path) : this.path;
      doc.head.appendChild(scriptEl);
    }
  };
  goog.Es6ModuleDependency = function(path, relativePath, provides, requires, loadFlags) {
    goog.Es6ModuleDependency.base(this, "constructor", path, relativePath, provides, requires, loadFlags);
  };
  goog.inherits(goog.Es6ModuleDependency, goog.Dependency);
  goog.Es6ModuleDependency.prototype.load = function(controller) {
    if (goog.global.CLOSURE_IMPORT_SCRIPT) {
      if (goog.global.CLOSURE_IMPORT_SCRIPT(this.path)) {
        controller.loaded();
      } else {
        controller.pause();
      }
      return;
    }
    if (!goog.inHtmlDocument_()) {
      goog.logToConsole_("Cannot use default debug loader outside of HTML documents.");
      controller.pause();
      return;
    }
    var doc = goog.global.document;
    var dep = this;
    function write(src, contents) {
      var nonceAttr = "";
      var nonce = goog.getScriptNonce_();
      if (nonce) {
        nonceAttr = ' nonce\x3d"' + nonce + '"';
      }
      if (contents) {
        var script = '\x3cscript type\x3d"module" crossorigin' + nonceAttr + "\x3e" + contents + "\x3c/" + "script\x3e";
        doc.write(goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createHTML(script) : script);
      } else {
        var script = '\x3cscript type\x3d"module" crossorigin src\x3d"' + src + '"' + nonceAttr + "\x3e\x3c/" + "script\x3e";
        doc.write(goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createHTML(script) : script);
      }
    }
    function append(src, contents) {
      var scriptEl = doc.createElement("script");
      scriptEl.defer = true;
      scriptEl.async = false;
      scriptEl.type = "module";
      scriptEl.setAttribute("crossorigin", true);
      var nonce = goog.getScriptNonce_();
      if (nonce) {
        scriptEl.nonce = nonce;
      }
      if (contents) {
        scriptEl.text = goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createScript(contents) : contents;
      } else {
        scriptEl.src = goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createScriptURL(src) : src;
      }
      doc.head.appendChild(scriptEl);
    }
    var create;
    if (goog.isDocumentLoading_()) {
      create = write;
      goog.Dependency.defer_ = true;
    } else {
      create = append;
    }
    var beforeKey = goog.Dependency.registerCallback_(function() {
      goog.Dependency.unregisterCallback_(beforeKey);
      controller.setModuleState(goog.ModuleType.ES6);
    });
    create(undefined, 'goog.Dependency.callback_("' + beforeKey + '")');
    create(this.path, undefined);
    var registerKey = goog.Dependency.registerCallback_(function(exports) {
      goog.Dependency.unregisterCallback_(registerKey);
      controller.registerEs6ModuleExports(dep.path, exports, goog.moduleLoaderState_.moduleName);
    });
    create(undefined, 'import * as m from "' + this.path + '"; goog.Dependency.callback_("' + registerKey + '", m)');
    var afterKey = goog.Dependency.registerCallback_(function() {
      goog.Dependency.unregisterCallback_(afterKey);
      controller.clearModuleState();
      controller.loaded();
    });
    create(undefined, 'goog.Dependency.callback_("' + afterKey + '")');
  };
  goog.TransformedDependency = function(path, relativePath, provides, requires, loadFlags) {
    goog.TransformedDependency.base(this, "constructor", path, relativePath, provides, requires, loadFlags);
    this.contents_ = null;
    this.lazyFetch_ = !goog.inHtmlDocument_() || !("noModule" in goog.global.document.createElement("script"));
  };
  goog.inherits(goog.TransformedDependency, goog.Dependency);
  goog.TransformedDependency.prototype.load = function(controller) {
    var dep = this;
    function fetch() {
      dep.contents_ = goog.loadFileSync_(dep.path);
      if (dep.contents_) {
        dep.contents_ = dep.transform(dep.contents_);
        if (dep.contents_) {
          dep.contents_ += "\n//# sourceURL\x3d" + dep.path;
        }
      }
    }
    if (goog.global.CLOSURE_IMPORT_SCRIPT) {
      fetch();
      if (this.contents_ && goog.global.CLOSURE_IMPORT_SCRIPT("", this.contents_)) {
        this.contents_ = null;
        controller.loaded();
      } else {
        controller.pause();
      }
      return;
    }
    var isEs6 = this.loadFlags["module"] == goog.ModuleType.ES6;
    if (!this.lazyFetch_) {
      fetch();
    }
    function load() {
      if (dep.lazyFetch_) {
        fetch();
      }
      if (!dep.contents_) {
        return;
      }
      if (isEs6) {
        controller.setModuleState(goog.ModuleType.ES6);
      }
      var namespace;
      try {
        var contents = dep.contents_;
        dep.contents_ = null;
        goog.globalEval(goog.CLOSURE_EVAL_PREFILTER_.createScript(contents));
        if (isEs6) {
          namespace = goog.moduleLoaderState_.moduleName;
        }
      } finally {
        if (isEs6) {
          controller.clearModuleState();
        }
      }
      if (isEs6) {
        goog.global["$jscomp"]["require"]["ensure"]([dep.getPathName()], function() {
          controller.registerEs6ModuleExports(dep.path, goog.global["$jscomp"]["require"](dep.getPathName()), namespace);
        });
      }
      controller.loaded();
    }
    function fetchInOwnScriptThenLoad() {
      var doc = goog.global.document;
      var key = goog.Dependency.registerCallback_(function() {
        goog.Dependency.unregisterCallback_(key);
        load();
      });
      var nonce = goog.getScriptNonce_();
      var nonceAttr = nonce ? ' nonce\x3d"' + nonce + '"' : "";
      var script = "\x3cscript" + nonceAttr + "\x3e" + goog.protectScriptTag_('goog.Dependency.callback_("' + key + '");') + "\x3c/" + "script\x3e";
      doc.write(goog.TRUSTED_TYPES_POLICY_ ? goog.TRUSTED_TYPES_POLICY_.createHTML(script) : script);
    }
    var anythingElsePending = controller.pending().length > 1;
    var needsAsyncLoading = goog.Dependency.defer_ && (anythingElsePending || goog.isDocumentLoading_());
    if (needsAsyncLoading) {
      controller.defer(function() {
        load();
      });
      return;
    }
    var doc = goog.global.document;
    var isInternetExplorerOrEdge = goog.inHtmlDocument_() && ("ActiveXObject" in goog.global || goog.isEdge_());
    if (isEs6 && goog.inHtmlDocument_() && goog.isDocumentLoading_() && !isInternetExplorerOrEdge) {
      goog.Dependency.defer_ = true;
      controller.pause();
      var oldCallback = doc.onreadystatechange;
      doc.onreadystatechange = function() {
        if (doc.readyState == "interactive") {
          doc.onreadystatechange = oldCallback;
          load();
          controller.resume();
        }
        if (typeof oldCallback === "function") {
          oldCallback.apply(undefined, arguments);
        }
      };
    } else {
      if (!goog.inHtmlDocument_() || !goog.isDocumentLoading_()) {
        load();
      } else {
        fetchInOwnScriptThenLoad();
      }
    }
  };
  goog.TransformedDependency.prototype.transform = function(contents) {
  };
  goog.PreTranspiledEs6ModuleDependency = function(path, relativePath, provides, requires, loadFlags) {
    goog.PreTranspiledEs6ModuleDependency.base(this, "constructor", path, relativePath, provides, requires, loadFlags);
  };
  goog.inherits(goog.PreTranspiledEs6ModuleDependency, goog.TransformedDependency);
  goog.PreTranspiledEs6ModuleDependency.prototype.transform = function(contents) {
    return contents;
  };
  goog.GoogModuleDependency = function(path, relativePath, provides, requires, loadFlags) {
    goog.GoogModuleDependency.base(this, "constructor", path, relativePath, provides, requires, loadFlags);
  };
  goog.inherits(goog.GoogModuleDependency, goog.TransformedDependency);
  goog.GoogModuleDependency.prototype.transform = function(contents) {
    if (!goog.LOAD_MODULE_USING_EVAL || goog.global.JSON === undefined) {
      return "" + "goog.loadModule(function(exports) {" + '"use strict";' + contents + "\n" + ";return exports" + "});" + "\n//# sourceURL\x3d" + this.path + "\n";
    } else {
      return "" + "goog.loadModule(" + goog.global.JSON.stringify(contents + "\n//# sourceURL\x3d" + this.path + "\n") + ");";
    }
  };
  goog.DebugLoader_.prototype.addDependency = function(relPath, provides, requires, opt_loadFlags) {
    provides = provides || [];
    relPath = relPath.replace(/\\/g, "/");
    var path = goog.normalizePath_(goog.basePath + relPath);
    if (!opt_loadFlags || typeof opt_loadFlags === "boolean") {
      opt_loadFlags = opt_loadFlags ? {"module":goog.ModuleType.GOOG} : {};
    }
    var dep = this.factory_.createDependency(path, relPath, provides, requires, opt_loadFlags);
    this.dependencies_[path] = dep;
    for (var i = 0; i < provides.length; i++) {
      this.idToPath_[provides[i]] = path;
    }
    this.idToPath_[relPath] = path;
  };
  goog.DependencyFactory = function() {
  };
  goog.DependencyFactory.prototype.createDependency = function(path, relativePath, provides, requires, loadFlags) {
    if (loadFlags["module"] == goog.ModuleType.GOOG) {
      return new goog.GoogModuleDependency(path, relativePath, provides, requires, loadFlags);
    } else {
      if (loadFlags["module"] == goog.ModuleType.ES6) {
        if (goog.ASSUME_ES_MODULES_TRANSPILED) {
          return new goog.PreTranspiledEs6ModuleDependency(path, relativePath, provides, requires, loadFlags);
        } else {
          return new goog.Es6ModuleDependency(path, relativePath, provides, requires, loadFlags);
        }
      } else {
        return new goog.Dependency(path, relativePath, provides, requires, loadFlags);
      }
    }
  };
  goog.debugLoader_ = new goog.DebugLoader_();
  goog.loadClosureDeps = function() {
    goog.debugLoader_.loadClosureDeps();
  };
  goog.setDependencyFactory = function(factory) {
    goog.debugLoader_.setDependencyFactory(factory);
  };
  goog.TRUSTED_TYPES_POLICY_ = goog.TRUSTED_TYPES_POLICY_NAME ? goog.createTrustedTypesPolicy(goog.TRUSTED_TYPES_POLICY_NAME + "#base") : null;
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.debugLoader_.loadClosureDeps();
  }
  goog.bootstrap = function(namespaces, callback) {
    goog.debugLoader_.bootstrap(namespaces, callback);
  };
}
if (!COMPILED) {
  var isChrome87 = false;
  try {
    isChrome87 = eval(goog.global.trustedTypes.emptyScript) !== goog.global.trustedTypes.emptyScript;
  } catch (err) {
  }
  goog.CLOSURE_EVAL_PREFILTER_ = goog.global.trustedTypes && isChrome87 && goog.createTrustedTypesPolicy("goog#base#devonly#eval") || {createScript:goog.identity_};
}

goog.provide = SHADOW_PROVIDE;
goog.require = SHADOW_REQUIRE;
SHADOW_IMPORT("goog.debug.error.js");
SHADOW_IMPORT("goog.dom.nodetype.js");
SHADOW_IMPORT("goog.asserts.asserts.js");
SHADOW_IMPORT("goog.reflect.reflect.js");
SHADOW_IMPORT("goog.math.long.js");
SHADOW_IMPORT("goog.math.integer.js");
SHADOW_IMPORT("goog.dom.htmlelement.js");
SHADOW_IMPORT("goog.dom.tagname.js");
SHADOW_IMPORT("goog.dom.element.js");
SHADOW_IMPORT("goog.asserts.dom.js");
SHADOW_IMPORT("goog.dom.asserts.js");
SHADOW_IMPORT("goog.functions.functions.js");
SHADOW_IMPORT("goog.string.typedstring.js");
SHADOW_IMPORT("goog.string.const.js");
SHADOW_IMPORT("goog.html.trustedtypes.js");
SHADOW_IMPORT("goog.html.safescript.js");
SHADOW_IMPORT("goog.fs.url.js");
SHADOW_IMPORT("goog.fs.blob.js");
SHADOW_IMPORT("goog.html.trustedresourceurl.js");
SHADOW_IMPORT("goog.string.internal.js");
SHADOW_IMPORT("goog.html.safeurl.js");
SHADOW_IMPORT("goog.html.safestyle.js");
SHADOW_IMPORT("goog.object.object.js");
SHADOW_IMPORT("goog.html.safestylesheet.js");
SHADOW_IMPORT("goog.flags.flags.js");
SHADOW_IMPORT("goog.labs.useragent.useragent.js");
SHADOW_IMPORT("goog.labs.useragent.util.js");
SHADOW_IMPORT("goog.labs.useragent.highentropy.highentropyvalue.js");
SHADOW_IMPORT("goog.labs.useragent.highentropy.highentropydata.js");
SHADOW_IMPORT("goog.labs.useragent.browser.js");
SHADOW_IMPORT("goog.array.array.js");
SHADOW_IMPORT("goog.dom.tags.js");
SHADOW_IMPORT("goog.html.safehtml.js");
SHADOW_IMPORT("goog.html.uncheckedconversions.js");
SHADOW_IMPORT("goog.dom.safe.js");
SHADOW_IMPORT("goog.string.string.js");
SHADOW_IMPORT("goog.collections.maps.js");
SHADOW_IMPORT("goog.structs.structs.js");
SHADOW_IMPORT("goog.uri.utils.js");
SHADOW_IMPORT("goog.uri.uri.js");
SHADOW_IMPORT("goog.string.stringbuffer.js");
SHADOW_IMPORT("cljs.core.js");
SHADOW_IMPORT("shadow.test.env.js");
SHADOW_IMPORT("clojure.walk.js");
SHADOW_IMPORT("clojure.string.js");
SHADOW_IMPORT("sci.impl.macros.js");
SHADOW_IMPORT("sci.impl.types.js");
SHADOW_IMPORT("sci.impl.unrestrict.js");
SHADOW_IMPORT("sci.lang.js");
SHADOW_IMPORT("sci.impl.vars.js");
SHADOW_IMPORT("sci.impl.callstack.js");
SHADOW_IMPORT("cljs.tools.reader.impl.utils.js");
SHADOW_IMPORT("cljs.tools.reader.reader_types.js");
SHADOW_IMPORT("sci.impl.destructure.js");
SHADOW_IMPORT("sci.impl.interop.js");
SHADOW_IMPORT("sci.impl.utils.js");
SHADOW_IMPORT("sci.impl.records.js");
SHADOW_IMPORT("sci.impl.evaluator.js");
SHADOW_IMPORT("sci.impl.faster.js");
SHADOW_IMPORT("sci.impl.fns.js");
SHADOW_IMPORT("sci.impl.load.js");
SHADOW_IMPORT("sci.impl.resolve.js");
SHADOW_IMPORT("cljs.tools.reader.impl.inspect.js");
SHADOW_IMPORT("cljs.tools.reader.impl.errors.js");
SHADOW_IMPORT("cljs.tools.reader.impl.commons.js");
SHADOW_IMPORT("cljs.tools.reader.js");
SHADOW_IMPORT("cljs.tools.reader.edn.js");
SHADOW_IMPORT("cljs.reader.js");
SHADOW_IMPORT("cljs.tagged_literals.js");
SHADOW_IMPORT("sci.impl.analyzer.js");
SHADOW_IMPORT("clojure.set.js");
SHADOW_IMPORT("sci.impl.core_protocols.js");
SHADOW_IMPORT("sci.impl.doseq_macro.js");
SHADOW_IMPORT("sci.impl.for_macro.js");
SHADOW_IMPORT("sci.impl.hierarchies.js");
SHADOW_IMPORT("sci.impl.io.js");
SHADOW_IMPORT("sci.impl.multimethods.js");
SHADOW_IMPORT("edamame.impl.macros.js");
SHADOW_IMPORT("edamame.impl.read_fn.js");
SHADOW_IMPORT("edamame.impl.syntax_quote.js");
SHADOW_IMPORT("edamame.impl.ns_parser.js");
SHADOW_IMPORT("edamame.impl.parser.js");
SHADOW_IMPORT("edamame.core.js");
SHADOW_IMPORT("sci.impl.parser.js");
SHADOW_IMPORT("sci.impl.protocols.js");
SHADOW_IMPORT("sci.impl.read.js");
SHADOW_IMPORT("sci.impl.reify.js");
SHADOW_IMPORT("sci.impl.namespaces.js");
SHADOW_IMPORT("sci.impl.opts.js");
SHADOW_IMPORT("sci.impl.interpreter.js");
SHADOW_IMPORT("sci.core.js");
SHADOW_IMPORT("module$frontend$selection.js");
SHADOW_IMPORT("shadow.js.shim.module$path$path.js");
SHADOW_IMPORT("shadow.js.shim.module$$capacitor$core.js");
SHADOW_IMPORT("shadow.js.shim.module$$capacitor$clipboard.js");
SHADOW_IMPORT("module$frontend$utils.js");
SHADOW_IMPORT("shadow.js.shim.module$$capacitor$status_bar.js");
SHADOW_IMPORT("shadow.js.shim.module$$capgo$capacitor_navigation_bar.js");
SHADOW_IMPORT("shadow.js.shim.module$grapheme_splitter.js");
SHADOW_IMPORT("shadow.js.shim.module$sanitize_filename.js");
SHADOW_IMPORT("shadow.js.shim.module$check_password_strength.js");
SHADOW_IMPORT("shadow.js.shim.module$path_complete_extname.js");
SHADOW_IMPORT("shadow.js.shim.module$semver.js");
SHADOW_IMPORT("goog.promise.thenable.js");
SHADOW_IMPORT("goog.async.freelist.js");
SHADOW_IMPORT("goog.async.workqueue.js");
SHADOW_IMPORT("goog.debug.asyncstacktag.js");
SHADOW_IMPORT("goog.debug.entrypointregistry.js");
SHADOW_IMPORT("goog.labs.useragent.engine.js");
SHADOW_IMPORT("goog.labs.useragent.platform.js");
SHADOW_IMPORT("goog.useragent.useragent.js");
SHADOW_IMPORT("goog.dom.browserfeature.js");
SHADOW_IMPORT("goog.math.math.js");
SHADOW_IMPORT("goog.math.coordinate.js");
SHADOW_IMPORT("goog.math.size.js");
SHADOW_IMPORT("goog.dom.dom.js");
SHADOW_IMPORT("goog.async.nexttick.js");
SHADOW_IMPORT("goog.async.throwexception.js");
SHADOW_IMPORT("goog.async.run.js");
SHADOW_IMPORT("goog.promise.resolver.js");
SHADOW_IMPORT("goog.promise.promise.js");
SHADOW_IMPORT("goog.mochikit.async.deferred.js");
SHADOW_IMPORT("goog.net.jsloader.js");
SHADOW_IMPORT("goog.html.legacyconversions.js");
SHADOW_IMPORT("cljs_bean.from.cljs.core.js");
SHADOW_IMPORT("cljs_bean.core.js");
SHADOW_IMPORT("frontend.loader.js");
SHADOW_IMPORT("goog.string.stringformat.js");
SHADOW_IMPORT("goog.i18n.cldrversion.js");
SHADOW_IMPORT("goog.i18n.datetimesymbols.js");
SHADOW_IMPORT("goog.date.date.js");
SHADOW_IMPORT("cljs_time.internal.core.js");
SHADOW_IMPORT("goog.date.utcdatetime.js");
SHADOW_IMPORT("cljs_time.core.js");
SHADOW_IMPORT("cljs_time.internal.parse.js");
SHADOW_IMPORT("cljs_time.internal.unparse.js");
SHADOW_IMPORT("goog.i18n.dayperiodsymbols.js");
SHADOW_IMPORT("goog.i18n.localefeature.js");
SHADOW_IMPORT("goog.i18n.nativelocaledigits.js");
SHADOW_IMPORT("goog.i18n.timezone.js");
SHADOW_IMPORT("goog.i18n.datetimeformat.js");
SHADOW_IMPORT("goog.i18n.compactnumberformatsymbols.js");
SHADOW_IMPORT("goog.i18n.numberformatsymbolstype.js");
SHADOW_IMPORT("goog.i18n.numberformatsymbols.js");
SHADOW_IMPORT("goog.i18n.currency.js");
SHADOW_IMPORT("goog.i18n.numberformat.js");
SHADOW_IMPORT("goog.i18n.ordinalrules.js");
SHADOW_IMPORT("goog.i18n.pluralrules.js");
SHADOW_IMPORT("goog.i18n.messageformat.js");
SHADOW_IMPORT("goog.date.duration.js");
SHADOW_IMPORT("cljs_time.format.js");
SHADOW_IMPORT("cljs_time.coerce.js");
SHADOW_IMPORT("cljs.pprint.js");
SHADOW_IMPORT("dommy.utils.js");
SHADOW_IMPORT("dommy.core.js");
SHADOW_IMPORT("shadow.js.shim.module$$capacitor$splash_screen.js");
SHADOW_IMPORT("promesa.protocols.js");
SHADOW_IMPORT("promesa.util.js");
SHADOW_IMPORT("promesa.impl.promise.js");
SHADOW_IMPORT("promesa.exec.js");
SHADOW_IMPORT("promesa.impl.js");
SHADOW_IMPORT("promesa.core.js");
SHADOW_IMPORT("frontend.mobile.util.js");
SHADOW_IMPORT("clojure.edn.js");
SHADOW_IMPORT("logseq.common.log.js");
SHADOW_IMPORT("logseq.common.util.js");
SHADOW_IMPORT("shadow.js.shim.module$react.js");
SHADOW_IMPORT("cljsjs.react.js");
SHADOW_IMPORT("shadow.js.shim.module$react_dom.js");
SHADOW_IMPORT("cljsjs.react.dom.js");
SHADOW_IMPORT("shadow.js.shim.module$react_dom$client.js");
SHADOW_IMPORT("rum.specs.js");
SHADOW_IMPORT("daiquiri.util.js");
SHADOW_IMPORT("daiquiri.normalize.js");
SHADOW_IMPORT("daiquiri.interpreter.js");
SHADOW_IMPORT("daiquiri.core.js");
SHADOW_IMPORT("rum.cursor.js");
SHADOW_IMPORT("rum.util.js");
SHADOW_IMPORT("rum.derived_atom.js");
SHADOW_IMPORT("rum.core.js");
SHADOW_IMPORT("cljs.core.async.impl.protocols.js");
SHADOW_IMPORT("cljs.core.async.impl.buffers.js");
SHADOW_IMPORT("cljs.core.async.impl.dispatch.js");
SHADOW_IMPORT("cljs.core.async.impl.channels.js");
SHADOW_IMPORT("cljs.core.async.impl.timers.js");
SHADOW_IMPORT("cljs.core.async.impl.ioc_helpers.js");
SHADOW_IMPORT("cljs.core.async.js");
SHADOW_IMPORT("malli.impl.util.js");
SHADOW_IMPORT("malli.impl.regex.js");
SHADOW_IMPORT("malli.registry.js");
SHADOW_IMPORT("borkdude.dynaload.js");
SHADOW_IMPORT("malli.sci.js");
SHADOW_IMPORT("malli.core.js");
SHADOW_IMPORT("arrangement.core.js");
SHADOW_IMPORT("fipp.util.js");
SHADOW_IMPORT("fipp.ednize.js");
SHADOW_IMPORT("fipp.visit.js");
SHADOW_IMPORT("clojure.core.rrb_vector.protocols.js");
SHADOW_IMPORT("clojure.core.rrb_vector.nodes.js");
SHADOW_IMPORT("clojure.core.rrb_vector.trees.js");
SHADOW_IMPORT("clojure.core.rrb_vector.transients.js");
SHADOW_IMPORT("clojure.core.rrb_vector.rrbt.js");
SHADOW_IMPORT("clojure.core.rrb_vector.interop.js");
SHADOW_IMPORT("clojure.core.rrb_vector.js");
SHADOW_IMPORT("fipp.deque.js");
SHADOW_IMPORT("fipp.engine.js");
SHADOW_IMPORT("fipp.edn.js");
SHADOW_IMPORT("malli.dev.virhe.js");
SHADOW_IMPORT("malli.util.js");
SHADOW_IMPORT("malli.error.js");
SHADOW_IMPORT("malli.edn.js");
SHADOW_IMPORT("malli.dev.pretty.js");
SHADOW_IMPORT("frontend.pubsub.js");
SHADOW_IMPORT("clojure.data.js");
SHADOW_IMPORT("datascript.schema.js");
SHADOW_IMPORT("datascript.lru.js");
SHADOW_IMPORT("datascript.util.js");
SHADOW_IMPORT("me.tonsky.persistent_sorted_set.arrays.js");
SHADOW_IMPORT("me.tonsky.persistent_sorted_set.protocol.js");
SHADOW_IMPORT("me.tonsky.persistent_sorted_set.js");
SHADOW_IMPORT("datascript.db.js");
SHADOW_IMPORT("datascript.impl.entity.js");
SHADOW_IMPORT("logseq.common.config.js");
SHADOW_IMPORT("goog.disposable.idisposable.js");
SHADOW_IMPORT("goog.disposable.dispose.js");
SHADOW_IMPORT("goog.disposable.disposeall.js");
SHADOW_IMPORT("goog.disposable.disposable.js");
SHADOW_IMPORT("goog.debug.errorcontext.js");
SHADOW_IMPORT("goog.debug.debug.js");
SHADOW_IMPORT("goog.events.eventid.js");
SHADOW_IMPORT("goog.events.event.js");
SHADOW_IMPORT("goog.events.browserfeature.js");
SHADOW_IMPORT("goog.events.eventtypehelpers.js");
SHADOW_IMPORT("goog.events.eventtype.js");
SHADOW_IMPORT("goog.events.browserevent.js");
SHADOW_IMPORT("goog.events.eventlike.js");
SHADOW_IMPORT("goog.events.listenablekey.js");
SHADOW_IMPORT("goog.events.listenable.js");
SHADOW_IMPORT("goog.events.listener.js");
SHADOW_IMPORT("goog.events.listenermap.js");
SHADOW_IMPORT("goog.debug.errorhandler.js");
SHADOW_IMPORT("goog.events.eventhandler.js");
SHADOW_IMPORT("goog.events.eventwrapper.js");
SHADOW_IMPORT("goog.events.events.js");
SHADOW_IMPORT("goog.events.eventtarget.js");
SHADOW_IMPORT("goog.timer.timer.js");
SHADOW_IMPORT("goog.async.debouncer.js");
SHADOW_IMPORT("frontend.util.js");
SHADOW_IMPORT("frontend.extensions.sci.js");
SHADOW_IMPORT("shadow.js.shim.module$ignore.js");
SHADOW_IMPORT("cljs.spec.gen.alpha.js");
SHADOW_IMPORT("cljs.spec.alpha.js");
SHADOW_IMPORT("datascript.storage.js");
SHADOW_IMPORT("extend_clj.core.js");
SHADOW_IMPORT("datascript.conn.js");
SHADOW_IMPORT("datascript.built_ins.js");
SHADOW_IMPORT("datascript.pull_parser.js");
SHADOW_IMPORT("datascript.pull_api.js");
SHADOW_IMPORT("datascript.serialize.js");
SHADOW_IMPORT("datascript.parser.js");
SHADOW_IMPORT("datascript.query.js");
SHADOW_IMPORT("datascript.core.js");
SHADOW_IMPORT("electron.ipc.js");
SHADOW_IMPORT("frontend.db.conn_state.js");
SHADOW_IMPORT("cljs.core.async.interop.js");
SHADOW_IMPORT("frontend.common.async_util.js");
SHADOW_IMPORT("frontend.db.transact.js");
SHADOW_IMPORT("cljs.analyzer.impl.js");
SHADOW_IMPORT("cljs.analyzer.impl.namespaces.js");
SHADOW_IMPORT("cljs.analyzer.passes.js");
SHADOW_IMPORT("cljs.analyzer.passes.and_or.js");
SHADOW_IMPORT("cljs.env.js");
SHADOW_IMPORT("cljs.analyzer.js");
SHADOW_IMPORT("cloroutine.impl.analyze_cljs.js");
SHADOW_IMPORT("cloroutine.impl.js");
SHADOW_IMPORT("cloroutine.core.js");
SHADOW_IMPORT("missionary.impl.Reduce.js");
SHADOW_IMPORT("missionary.impl.Reductions.js");
SHADOW_IMPORT("missionary.Cancelled.js");
SHADOW_IMPORT("missionary.impl.GroupBy.js");
SHADOW_IMPORT("missionary.impl.Relieve.js");
SHADOW_IMPORT("missionary.impl.Heap.js");
SHADOW_IMPORT("missionary.impl.Latest.js");
SHADOW_IMPORT("missionary.impl.Sample.js");
SHADOW_IMPORT("missionary.impl.Reactor.js");
SHADOW_IMPORT("missionary.impl.Fiber.js");
SHADOW_IMPORT("missionary.impl.Sequential.js");
SHADOW_IMPORT("missionary.impl.Ambiguous.js");
SHADOW_IMPORT("missionary.impl.Continuous.js");
SHADOW_IMPORT("missionary.impl.Watch.js");
SHADOW_IMPORT("missionary.impl.Observe.js");
SHADOW_IMPORT("missionary.impl.Buffer.js");
SHADOW_IMPORT("missionary.impl.Rendezvous.js");
SHADOW_IMPORT("missionary.impl.Dataflow.js");
SHADOW_IMPORT("missionary.impl.Mailbox.js");
SHADOW_IMPORT("missionary.impl.Semaphore.js");
SHADOW_IMPORT("missionary.impl.RaceJoin.js");
SHADOW_IMPORT("missionary.impl.Sleep.js");
SHADOW_IMPORT("missionary.impl.Never.js");
SHADOW_IMPORT("missionary.impl.Seed.js");
SHADOW_IMPORT("missionary.impl.Eduction.js");
SHADOW_IMPORT("missionary.impl.Zip.js");
SHADOW_IMPORT("missionary.impl.Propagator.js");
SHADOW_IMPORT("missionary.core.js");
SHADOW_IMPORT("frontend.flows.js");
SHADOW_IMPORT("frontend.spec.storage.js");
SHADOW_IMPORT("frontend.storage.js");
SHADOW_IMPORT("frontend.util.cursor.js");
SHADOW_IMPORT("logseq.common.uuid.js");
SHADOW_IMPORT("logseq.common.util.block_ref.js");
SHADOW_IMPORT("shadow.js.shim.module$path.js");
SHADOW_IMPORT("logseq.common.util.page_ref.js");
SHADOW_IMPORT("logseq.db.file_based.entity_util.js");
SHADOW_IMPORT("logseq.db.frontend.entity_util.js");
SHADOW_IMPORT("logseq.db.common.entity_util.js");
SHADOW_IMPORT("logseq.common.util.date_time.js");
SHADOW_IMPORT("logseq.db.frontend.content.js");
SHADOW_IMPORT("flatland.ordered.map.js");
SHADOW_IMPORT("logseq.common.defkeywords.js");
SHADOW_IMPORT("logseq.common.util.macro.js");
SHADOW_IMPORT("logseq.db.frontend.property.type.js");
SHADOW_IMPORT("logseq.db.frontend.db_ident.js");
SHADOW_IMPORT("logseq.db.frontend.property.js");
SHADOW_IMPORT("logseq.db.common.entity_plus.js");
SHADOW_IMPORT("logseq.db.common.delete_blocks.js");
SHADOW_IMPORT("logseq.clj_fractional_indexing.js");
SHADOW_IMPORT("logseq.db.common.order.js");
SHADOW_IMPORT("logseq.db.common.initial_data.js");
SHADOW_IMPORT("logseq.db.file_based.schema.js");
SHADOW_IMPORT("logseq.db.file_based.rules.js");
SHADOW_IMPORT("logseq.db.frontend.rules.js");
SHADOW_IMPORT("cljs_bean.transit.js");
SHADOW_IMPORT("com.cognitect.transit.util.js");
SHADOW_IMPORT("com.cognitect.transit.delimiters.js");
SHADOW_IMPORT("com.cognitect.transit.caching.js");
SHADOW_IMPORT("com.cognitect.transit.eq.js");
SHADOW_IMPORT("com.cognitect.transit.types.js");
SHADOW_IMPORT("com.cognitect.transit.impl.decoder.js");
SHADOW_IMPORT("com.cognitect.transit.impl.reader.js");
SHADOW_IMPORT("com.cognitect.transit.handlers.js");
SHADOW_IMPORT("com.cognitect.transit.impl.writer.js");
SHADOW_IMPORT("com.cognitect.transit.js");
SHADOW_IMPORT("cognitect.transit.js");
SHADOW_IMPORT("datascript.transit.js");
SHADOW_IMPORT("logseq.db.sqlite.util.js");
SHADOW_IMPORT("logseq.db.frontend.class.js");
SHADOW_IMPORT("logseq.common.util.namespace.js");
SHADOW_IMPORT("logseq.db.frontend.db.js");
SHADOW_IMPORT("logseq.db.frontend.schema.js");
SHADOW_IMPORT("logseq.db.js");
SHADOW_IMPORT("camel_snake_kebab.internals.string_separator.js");
SHADOW_IMPORT("camel_snake_kebab.internals.misc.js");
SHADOW_IMPORT("camel_snake_kebab.internals.alter_name.js");
SHADOW_IMPORT("camel_snake_kebab.core.js");
SHADOW_IMPORT("logseq.shui.rum.js");
SHADOW_IMPORT("logseq.shui.util.js");
SHADOW_IMPORT("logseq.shui.icon.v2.js");
SHADOW_IMPORT("logseq.shui.base.core.js");
SHADOW_IMPORT("logseq.shui.form.core.js");
SHADOW_IMPORT("goog.log.log.js");
SHADOW_IMPORT("goog.debug.relativetimeprovider.js");
SHADOW_IMPORT("goog.debug.formatter.js");
SHADOW_IMPORT("goog.debug.console.js");
SHADOW_IMPORT("goog.structs.circularbuffer.js");
SHADOW_IMPORT("goog.debug.debugwindow.js");
SHADOW_IMPORT("goog.debug.fancywindow.js");
SHADOW_IMPORT("goog.dom.vendor.js");
SHADOW_IMPORT("goog.math.box.js");
SHADOW_IMPORT("goog.math.irect.js");
SHADOW_IMPORT("goog.math.rect.js");
SHADOW_IMPORT("goog.style.style.js");
SHADOW_IMPORT("goog.debug.divconsole.js");
SHADOW_IMPORT("lambdaisland.glogi.js");
SHADOW_IMPORT("frontend.common.missionary.js");
SHADOW_IMPORT("logseq.shui.hooks.js");
SHADOW_IMPORT("medley.core.js");
SHADOW_IMPORT("logseq.shui.dialog.core.js");
SHADOW_IMPORT("logseq.shui.popup.core.js");
SHADOW_IMPORT("logseq.shui.select.core.js");
SHADOW_IMPORT("logseq.shui.select.multi.js");
SHADOW_IMPORT("logseq.shui.shortcut.v1.js");
SHADOW_IMPORT("logseq.shui.table.impl.js");
SHADOW_IMPORT("logseq.shui.table.core.js");
SHADOW_IMPORT("logseq.shui.toaster.core.js");
SHADOW_IMPORT("logseq.shui.ui.js");
SHADOW_IMPORT("frontend.state.js");
SHADOW_IMPORT("goog.crypt.crypt.js");
SHADOW_IMPORT("goog.crypt.hash.js");
SHADOW_IMPORT("goog.crypt.md5.js");
SHADOW_IMPORT("logseq.common.path.js");
SHADOW_IMPORT("shadow.resource.js");
SHADOW_IMPORT("frontend.config.js");
SHADOW_IMPORT("frontend.util.text.js");
SHADOW_IMPORT("logseq.graph_parser.db.js");
SHADOW_IMPORT("shadow.js.shim.module$mldoc.js");
SHADOW_IMPORT("logseq.graph_parser.utf8.js");
SHADOW_IMPORT("logseq.graph_parser.schema.mldoc.js");
SHADOW_IMPORT("logseq.graph_parser.mldoc.js");
SHADOW_IMPORT("logseq.graph_parser.property.js");
SHADOW_IMPORT("logseq.graph_parser.text.js");
SHADOW_IMPORT("frontend.db.conn.js");
SHADOW_IMPORT("logseq.db.frontend.malli_schema.js");
SHADOW_IMPORT("logseq.db.frontend.property.build.js");
SHADOW_IMPORT("logseq.db.sqlite.create_graph.js");
SHADOW_IMPORT("frontend.common.graph_view.js");
SHADOW_IMPORT("shadow.js.shim.module$chrono_node.js");
SHADOW_IMPORT("cljs_time.local.js");
SHADOW_IMPORT("logseq.common.date.js");
SHADOW_IMPORT("frontend.date.js");
SHADOW_IMPORT("frontend.common.file_based.db.js");
SHADOW_IMPORT("frontend.db.utils.js");
SHADOW_IMPORT("frontend.db.file_based.model.js");
SHADOW_IMPORT("frontend.db.async.util.js");
SHADOW_IMPORT("frontend.db.react.js");
SHADOW_IMPORT("frontend.db.model.js");
SHADOW_IMPORT("frontend.modules.outliner.op.js");
SHADOW_IMPORT("logseq.graph_parser.block.js");
SHADOW_IMPORT("logseq.outliner.batch_tx.js");
SHADOW_IMPORT("logseq.outliner.datascript.js");
SHADOW_IMPORT("logseq.outliner.datascript_report.js");
SHADOW_IMPORT("logseq.outliner.pipeline.js");
SHADOW_IMPORT("logseq.db.common.property_util.js");
SHADOW_IMPORT("logseq.outliner.tree.js");
SHADOW_IMPORT("logseq.outliner.validate.js");
SHADOW_IMPORT("logseq.outliner.core.js");
SHADOW_IMPORT("logseq.outliner.property.js");
SHADOW_IMPORT("logseq.outliner.transaction.js");
SHADOW_IMPORT("logseq.outliner.op.js");
SHADOW_IMPORT("frontend.modules.outliner.ui.js");
SHADOW_IMPORT("frontend.namespaces.js");
SHADOW_IMPORT("frontend.db.js");
SHADOW_IMPORT("frontend.handler.db_based.property.js");
SHADOW_IMPORT("frontend.handler.file_based.page_property.js");
SHADOW_IMPORT("frontend.db.file_based.async.js");
SHADOW_IMPORT("frontend.format.protocol.js");
SHADOW_IMPORT("frontend.format.mldoc.js");
SHADOW_IMPORT("frontend.handler.file_based.property.util.js");
SHADOW_IMPORT("frontend.db.async.js");
SHADOW_IMPORT("frontend.handler.property.util.js");
SHADOW_IMPORT("shadow.js.shim.module$$capacitor$haptics.js");
SHADOW_IMPORT("frontend.mobile.haptics.js");
SHADOW_IMPORT("frontend.util.file_based.drawer.js");
SHADOW_IMPORT("frontend.handler.block.js");
SHADOW_IMPORT("frontend.handler.file_based.property.js");
SHADOW_IMPORT("frontend.handler.property.js");
SHADOW_IMPORT("frontend.handler.common.js");
SHADOW_IMPORT("frontend.components.block.macros.js");
SHADOW_IMPORT("cljs.test.js");
SHADOW_IMPORT("frontend.components.block.macros_test.js");
SHADOW_IMPORT("frontend.background_tasks.js");
SHADOW_IMPORT("frontend.fs.protocol.js");
SHADOW_IMPORT("frontend.fs.memory_fs.js");
SHADOW_IMPORT("frontend.fs.node.js");
SHADOW_IMPORT("frontend.fs.js");
SHADOW_IMPORT("rewrite_clj.interop.js");
SHADOW_IMPORT("rewrite_clj.node.protocols.js");
SHADOW_IMPORT("rewrite_clj.node.comment.js");
SHADOW_IMPORT("rewrite_clj.node.fn.js");
SHADOW_IMPORT("rewrite_clj.node.forms.js");
SHADOW_IMPORT("rewrite_clj.node.integer.js");
SHADOW_IMPORT("rewrite_clj.node.keyword.js");
SHADOW_IMPORT("rewrite_clj.reader.js");
SHADOW_IMPORT("rewrite_clj.node.whitespace.js");
SHADOW_IMPORT("rewrite_clj.node.meta.js");
SHADOW_IMPORT("rewrite_clj.node.namespaced_map.js");
SHADOW_IMPORT("rewrite_clj.node.quote.js");
SHADOW_IMPORT("rewrite_clj.node.reader_macro.js");
SHADOW_IMPORT("rewrite_clj.node.regex.js");
SHADOW_IMPORT("rewrite_clj.node.seq.js");
SHADOW_IMPORT("rewrite_clj.node.stringz.js");
SHADOW_IMPORT("rewrite_clj.node.token.js");
SHADOW_IMPORT("rewrite_clj.node.uneval.js");
SHADOW_IMPORT("rewrite_clj.parser.impl.js");
SHADOW_IMPORT("rewrite_clj.node.coercer.js");
SHADOW_IMPORT("rewrite_clj.node.extras.js");
SHADOW_IMPORT("rewrite_clj.node.js");
SHADOW_IMPORT("rewrite_clj.parser.keyword.js");
SHADOW_IMPORT("rewrite_clj.parser.namespaced_map.js");
SHADOW_IMPORT("rewrite_clj.parser.string.js");
SHADOW_IMPORT("rewrite_clj.parser.token.js");
SHADOW_IMPORT("rewrite_clj.parser.whitespace.js");
SHADOW_IMPORT("rewrite_clj.parser.core.js");
SHADOW_IMPORT("rewrite_clj.parser.js");
SHADOW_IMPORT("clojure.zip.js");
SHADOW_IMPORT("rewrite_clj.custom_zipper.switchable.js");
SHADOW_IMPORT("rewrite_clj.custom_zipper.core.js");
SHADOW_IMPORT("rewrite_clj.zip.options.js");
SHADOW_IMPORT("rewrite_clj.zip.whitespace.js");
SHADOW_IMPORT("rewrite_clj.zip.base.js");
SHADOW_IMPORT("rewrite_clj.custom_zipper.utils.js");
SHADOW_IMPORT("rewrite_clj.zip.move.js");
SHADOW_IMPORT("rewrite_clj.zip.removez.js");
SHADOW_IMPORT("rewrite_clj.zip.editz.js");
SHADOW_IMPORT("rewrite_clj.zip.findz.js");
SHADOW_IMPORT("rewrite_clj.zip.insert.js");
SHADOW_IMPORT("rewrite_clj.zip.seqz.js");
SHADOW_IMPORT("rewrite_clj.zip.subedit.js");
SHADOW_IMPORT("rewrite_clj.zip.walk.js");
SHADOW_IMPORT("rewrite_clj.zip.context.js");
SHADOW_IMPORT("rewrite_clj.zip.js");
SHADOW_IMPORT("borkdude.rewrite_edn.impl.js");
SHADOW_IMPORT("borkdude.rewrite_edn.js");
SHADOW_IMPORT("frontend.components.svg.js");
SHADOW_IMPORT("frontend.handler.notification.js");
SHADOW_IMPORT("frontend.extensions.video.youtube.js");
SHADOW_IMPORT("frontend.handler.db_based.property.util.js");
SHADOW_IMPORT("meta_merge.core.js");
SHADOW_IMPORT("reitit.exception.js");
SHADOW_IMPORT("reitit.trie.js");
SHADOW_IMPORT("reitit.impl.js");
SHADOW_IMPORT("reitit.core.js");
SHADOW_IMPORT("reitit.coercion.js");
SHADOW_IMPORT("reitit.frontend.js");
SHADOW_IMPORT("reitit.frontend.history.js");
SHADOW_IMPORT("reitit.frontend.easy.js");
SHADOW_IMPORT("frontend.handler.common.config_edn.js");
SHADOW_IMPORT("frontend.handler.global_config.js");
SHADOW_IMPORT("frontend.handler.repo_config.js");
SHADOW_IMPORT("goog.net.eventtype.js");
SHADOW_IMPORT("goog.json.json.js");
SHADOW_IMPORT("goog.json.hybrid.js");
SHADOW_IMPORT("goog.net.errorcode.js");
SHADOW_IMPORT("goog.net.httpstatus.js");
SHADOW_IMPORT("goog.net.xhrlike.js");
SHADOW_IMPORT("goog.net.xmlhttpfactory.js");
SHADOW_IMPORT("goog.net.wrapperxmlhttpfactory.js");
SHADOW_IMPORT("goog.net.xmlhttp.js");
SHADOW_IMPORT("goog.net.xhrio.js");
SHADOW_IMPORT("goog.net.jsonp.js");
SHADOW_IMPORT("goog.useragent.product.js");
SHADOW_IMPORT("goog.crypt.base64.js");
SHADOW_IMPORT("cljs_http_missionary.util.js");
SHADOW_IMPORT("cljs_http_missionary.core.js");
SHADOW_IMPORT("cljs_http_missionary.client.js");
SHADOW_IMPORT("frontend.common.thread_api.js");
SHADOW_IMPORT("frontend.handler.assets.js");
SHADOW_IMPORT("frontend.handler.ui.js");
SHADOW_IMPORT("frontend.schema.handler.common_config.js");
SHADOW_IMPORT("frontend.schema.handler.global_config.js");
SHADOW_IMPORT("frontend.schema.handler.repo_config.js");
SHADOW_IMPORT("frontend.worker.state.js");
SHADOW_IMPORT("goog.crypt.hmac.js");
SHADOW_IMPORT("goog.crypt.sha2.js");
SHADOW_IMPORT("goog.crypt.sha256.js");
SHADOW_IMPORT("logseq.db.common.sqlite.js");
SHADOW_IMPORT("frontend.common.file.util.js");
SHADOW_IMPORT("frontend.worker.util.js");
SHADOW_IMPORT("logseq.graph_parser.whiteboard.js");
SHADOW_IMPORT("logseq.graph_parser.extract.js");
SHADOW_IMPORT("logseq.graph_parser.js");
SHADOW_IMPORT("frontend.worker.file.reset.js");
SHADOW_IMPORT("frontend.handler.file_based.file.js");
SHADOW_IMPORT("frontend.handler.draw.js");
SHADOW_IMPORT("logseq.common.marker.js");
SHADOW_IMPORT("frontend.handler.file_based.status.js");
SHADOW_IMPORT("frontend.dicts.js");
SHADOW_IMPORT("tongue.macro.js");
SHADOW_IMPORT("tongue.inst.js");
SHADOW_IMPORT("tongue.number.js");
SHADOW_IMPORT("tongue.core.js");
SHADOW_IMPORT("frontend.context.i18n.js");
SHADOW_IMPORT("frontend.format.js");
SHADOW_IMPORT("frontend.handler.common.plugin.js");
SHADOW_IMPORT("shadow.js.js");
SHADOW_IMPORT("module$frontend$idbkv.js");
SHADOW_IMPORT("frontend.idb.js");
SHADOW_IMPORT("goog.events.keycodes.js");
SHADOW_IMPORT("goog.events.keynames.js");
SHADOW_IMPORT("goog.events.keys.js");
SHADOW_IMPORT("goog.ui.keyboardeventdata.js");
SHADOW_IMPORT("goog.ui.keyboardshortcutevent.js");
SHADOW_IMPORT("goog.ui.synthetickeyboardevent.js");
SHADOW_IMPORT("goog.ui.keyboardshortcuthandler.js");
SHADOW_IMPORT("frontend.modules.shortcut.utils.js");
SHADOW_IMPORT("frontend.handler.plugin.js");
SHADOW_IMPORT("frontend.handler.property.file.js");
SHADOW_IMPORT("shadow.js.shim.module$remove_accents.js");
SHADOW_IMPORT("frontend.common.search_fuzzy.js");
SHADOW_IMPORT("frontend.search.protocol.js");
SHADOW_IMPORT("frontend.search.browser.js");
SHADOW_IMPORT("frontend.search.plugin.js");
SHADOW_IMPORT("frontend.search.agency.js");
SHADOW_IMPORT("frontend.search.js");
SHADOW_IMPORT("frontend.util.file_based.priority.js");
SHADOW_IMPORT("frontend.util.ref.js");
SHADOW_IMPORT("frontend.commands.js");
SHADOW_IMPORT("tailrecursion.priority_map.js");
SHADOW_IMPORT("cljs.cache.js");
SHADOW_IMPORT("frontend.common.cache.js");
SHADOW_IMPORT("frontend.format.block.js");
SHADOW_IMPORT("frontend.handler.db_based.editor.js");
SHADOW_IMPORT("frontend.handler.config.js");
SHADOW_IMPORT("module$frontend$extensions$pdf$utils.js");
SHADOW_IMPORT("frontend.extensions.pdf.utils.js");
SHADOW_IMPORT("frontend.handler.db_based.recent.js");
SHADOW_IMPORT("frontend.handler.recent.js");
SHADOW_IMPORT("frontend.handler.search.js");
SHADOW_IMPORT("frontend.handler.route.js");
SHADOW_IMPORT("frontend.handler.common.page.js");
SHADOW_IMPORT("shadow.js.shim.module$diff.js");
SHADOW_IMPORT("frontend.diff.js");
SHADOW_IMPORT("frontend.handler.common.editor.js");
SHADOW_IMPORT("cljs.core.match.js");
SHADOW_IMPORT("frontend.common.file.core.js");
SHADOW_IMPORT("frontend.modules.file.core.js");
SHADOW_IMPORT("frontend.modules.outliner.tree.js");
SHADOW_IMPORT("frontend.handler.export.common.js");
SHADOW_IMPORT("frontend.handler.export.zip_helper.js");
SHADOW_IMPORT("hiccups.runtime.js");
SHADOW_IMPORT("frontend.handler.export.html.js");
SHADOW_IMPORT("shadow.js.shim.module$jszip.js");
SHADOW_IMPORT("frontend.extensions.zip.js");
SHADOW_IMPORT("frontend.handler.export.text.js");
SHADOW_IMPORT("logseq.db.frontend.inputs.js");
SHADOW_IMPORT("frontend.db.query_react.js");
SHADOW_IMPORT("frontend.template.js");
SHADOW_IMPORT("frontend.db.query_dsl.js");
SHADOW_IMPORT("frontend.handler.file_based.repeated.js");
SHADOW_IMPORT("frontend.util.file_based.clock.js");
SHADOW_IMPORT("frontend.handler.file_based.editor.js");
SHADOW_IMPORT("frontend.util.keycode.js");
SHADOW_IMPORT("frontend.util.list.js");
SHADOW_IMPORT("frontend.util.thingatpt.js");
SHADOW_IMPORT("goog.dom.classes.js");
SHADOW_IMPORT("frontend.handler.editor.js");
SHADOW_IMPORT("frontend.handler.db_based.page.js");
SHADOW_IMPORT("expound.util.js");
SHADOW_IMPORT("expound.paths.js");
SHADOW_IMPORT("expound.problems.js");
SHADOW_IMPORT("expound.ansi.js");
SHADOW_IMPORT("expound.printer.js");
SHADOW_IMPORT("expound.alpha.js");
SHADOW_IMPORT("frontend.spec.js");
SHADOW_IMPORT("frontend.handler.file_based.repo.js");
SHADOW_IMPORT("frontend.worker.handler.page.db_based.page.js");
SHADOW_IMPORT("frontend.worker.handler.page.file_based.page.js");
SHADOW_IMPORT("frontend.worker.handler.page.js");
SHADOW_IMPORT("frontend.worker.commands.js");
SHADOW_IMPORT("frontend.worker.file.js");
SHADOW_IMPORT("frontend.worker.react.js");
SHADOW_IMPORT("frontend.worker.shared_service.js");
SHADOW_IMPORT("logseq.db.frontend.validate.js");
SHADOW_IMPORT("logseq.db.sqlite.build.js");
SHADOW_IMPORT("logseq.db.sqlite.export.js");
SHADOW_IMPORT("logseq.graph_parser.exporter.js");
SHADOW_IMPORT("frontend.worker.pipeline.js");
SHADOW_IMPORT("logseq.outliner.db_pipeline.js");
SHADOW_IMPORT("frontend.test.helper.js");
SHADOW_IMPORT("frontend.components.file_based.query_table.js");
SHADOW_IMPORT("frontend.components.file_based.query_table_test.js");
SHADOW_IMPORT("frontend.util.datalog.js");
SHADOW_IMPORT("frontend.db.query_custom.js");
SHADOW_IMPORT("frontend.components.query.result.js");
SHADOW_IMPORT("frontend.components.query.result_test.js");
SHADOW_IMPORT("frontend.context.i18n_test.js");
SHADOW_IMPORT("frontend.db.db_based_model_test.js");
SHADOW_IMPORT("frontend.db.file_based.model_test.js");
SHADOW_IMPORT("frontend.db.model_test.js");
SHADOW_IMPORT("frontend.worker.handler.page.file_based.rename.js");
SHADOW_IMPORT("frontend.util.fs.js");
SHADOW_IMPORT("frontend.db.name_sanity_test.js");
SHADOW_IMPORT("frontend.db.query_custom_test.js");
SHADOW_IMPORT("frontend.db.query_dsl_test.js");
SHADOW_IMPORT("frontend.db.query_react_test.js");
SHADOW_IMPORT("instaparse.auto_flatten_seq.js");
SHADOW_IMPORT("instaparse.print.js");
SHADOW_IMPORT("instaparse.failure.js");
SHADOW_IMPORT("instaparse.util.js");
SHADOW_IMPORT("instaparse.reduction.js");
SHADOW_IMPORT("instaparse.combinators_source.js");
SHADOW_IMPORT("goog.i18n.uchar.js");
SHADOW_IMPORT("instaparse.gll.js");
SHADOW_IMPORT("instaparse.cfg.js");
SHADOW_IMPORT("instaparse.transform.js");
SHADOW_IMPORT("instaparse.abnf.js");
SHADOW_IMPORT("instaparse.viz.js");
SHADOW_IMPORT("instaparse.repeat.js");
SHADOW_IMPORT("instaparse.line_col.js");
SHADOW_IMPORT("instaparse.core.js");
SHADOW_IMPORT("shadow.js.shim.module$bignumber.js");
SHADOW_IMPORT("frontend.extensions.calc.js");
SHADOW_IMPORT("frontend.extensions.calc_test.js");
SHADOW_IMPORT("frontend.extensions.html_parser_test.js");
SHADOW_IMPORT("frontend.extensions.pdf.assets_test.js");
SHADOW_IMPORT("hickory.utils.js");
SHADOW_IMPORT("hickory.core.js");
SHADOW_IMPORT("frontend.extensions.html_parser.js");
SHADOW_IMPORT("frontend.extensions.zotero.schema.js");
SHADOW_IMPORT("frontend.extensions.zotero.setting.js");
SHADOW_IMPORT("frontend.extensions.zotero.extractor.js");
SHADOW_IMPORT("frontend.extensions.zotero.extractor_test.js");
SHADOW_IMPORT("frontend.external.protocol.js");
SHADOW_IMPORT("frontend.external.roam.js");
SHADOW_IMPORT("frontend.external.js");
SHADOW_IMPORT("frontend.external.roam_test.js");
SHADOW_IMPORT("frontend.format.block_test.js");
SHADOW_IMPORT("frontend.format.mldoc_test.js");
SHADOW_IMPORT("shadow.js.shim.module$fs$promises.js");
SHADOW_IMPORT("frontend.fs.test_node.js");
SHADOW_IMPORT("frontend.test.node_fixtures.js");
SHADOW_IMPORT("shadow.js.shim.module$fs.js");
SHADOW_IMPORT("frontend.test.node_helper.js");
SHADOW_IMPORT("frontend.fs_test.js");
SHADOW_IMPORT("shadow.js.shim.module$$logseq$diff_merge.js");
SHADOW_IMPORT("frontend.fs.diff_merge.js");
SHADOW_IMPORT("frontend.fs.diff_merge_test.js");
SHADOW_IMPORT("no.en.core.js");
SHADOW_IMPORT("cljs_http.util.js");
SHADOW_IMPORT("cljs_http.core.js");
SHADOW_IMPORT("cljs_http.client.js");
SHADOW_IMPORT("frontend.debug.js");
SHADOW_IMPORT("frontend.encrypt.js");
SHADOW_IMPORT("frontend.handler.user.js");
SHADOW_IMPORT("frontend.util.persist_var.js");
SHADOW_IMPORT("frontend.fs.sync.js");
SHADOW_IMPORT("frontend.fs.sync_test.js");
SHADOW_IMPORT("frontend.handler.common.config_edn_test.js");
SHADOW_IMPORT("frontend.handler.db_based.recent_test.js");
SHADOW_IMPORT("frontend.handler.editor_async_test.js");
SHADOW_IMPORT("frontend.handler.editor_test.js");
SHADOW_IMPORT("frontend.handler.export_test.js");
SHADOW_IMPORT("frontend.handler.file_based.page_property_test.js");
SHADOW_IMPORT("frontend.handler.paste.js");
SHADOW_IMPORT("frontend.handler.paste_test.js");
SHADOW_IMPORT("frontend.schema.handler.plugin_config.js");
SHADOW_IMPORT("frontend.handler.plugin_config.js");
SHADOW_IMPORT("clojure.test.check.random.longs.bit_count_impl.js");
SHADOW_IMPORT("clojure.test.check.random.longs.js");
SHADOW_IMPORT("clojure.test.check.random.doubles.js");
SHADOW_IMPORT("clojure.test.check.random.js");
SHADOW_IMPORT("clojure.test.check.rose_tree.js");
SHADOW_IMPORT("clojure.test.check.generators.js");
SHADOW_IMPORT("clojure.test.check.results.js");
SHADOW_IMPORT("clojure.test.check.impl.js");
SHADOW_IMPORT("clojure.test.check.js");
SHADOW_IMPORT("clojure.test.check.properties.js");
SHADOW_IMPORT("malli.generator.js");
SHADOW_IMPORT("frontend.handler.plugin_config_test.js");
SHADOW_IMPORT("frontend.handler.query.builder.js");
SHADOW_IMPORT("frontend.handler.query.builder_test.js");
SHADOW_IMPORT("logseq.common.graph.js");
SHADOW_IMPORT("logseq.graph_parser.cli.js");
SHADOW_IMPORT("shadow.js.shim.module$child_process.js");
SHADOW_IMPORT("logseq.graph_parser.test.docs_graph_helper.js");
SHADOW_IMPORT("frontend.handler.repo_test.js");
SHADOW_IMPORT("frontend.handler.route_test.js");
SHADOW_IMPORT("frontend.test.fixtures.js");
SHADOW_IMPORT("shadow.js.shim.module$fuse.js");
SHADOW_IMPORT("frontend.worker.search.js");
SHADOW_IMPORT("frontend.worker.db_listener.js");
SHADOW_IMPORT("frontend.modules.outliner.core_test.js");
SHADOW_IMPORT("frontend.mixins.js");
SHADOW_IMPORT("shadow.js.shim.module$comlink.js");
SHADOW_IMPORT("frontend.handler.worker.js");
SHADOW_IMPORT("frontend.persist_db.protocol.js");
SHADOW_IMPORT("frontend.undo_redo.js");
SHADOW_IMPORT("frontend.persist_db.browser.js");
SHADOW_IMPORT("frontend.persist_db.js");
SHADOW_IMPORT("frontend.components.commit.js");
SHADOW_IMPORT("frontend.extensions.srs.handler.js");
SHADOW_IMPORT("shadow.js.shim.module$$capacitor$filesystem.js");
SHADOW_IMPORT("frontend.external.roam_export.js");
SHADOW_IMPORT("logseq.publishing.db.js");
SHADOW_IMPORT("logseq.publishing.html.js");
SHADOW_IMPORT("frontend.handler.export.js");
SHADOW_IMPORT("frontend.handler.history.js");
SHADOW_IMPORT("frontend.db.persist.js");
SHADOW_IMPORT("frontend.db.restore.js");
SHADOW_IMPORT("frontend.handler.graph.js");
SHADOW_IMPORT("frontend.handler.repo.js");
SHADOW_IMPORT("frontend.handler.file_based.native_fs.js");
SHADOW_IMPORT("frontend.handler.file_based.page.js");
SHADOW_IMPORT("frontend.util.page.js");
SHADOW_IMPORT("frontend.util.url.js");
SHADOW_IMPORT("frontend.handler.page.js");
SHADOW_IMPORT("frontend.handler.journal.js");
SHADOW_IMPORT("frontend.handler.jump.js");
SHADOW_IMPORT("frontend.handler.whiteboard.js");
SHADOW_IMPORT("frontend.handler.window.js");
SHADOW_IMPORT("frontend.modules.shortcut.before.js");
SHADOW_IMPORT("frontend.modules.shortcut.config.js");
SHADOW_IMPORT("frontend.modules.shortcut.data_helper.js");
SHADOW_IMPORT("frontend.modules.shortcut.core_test.js");
SHADOW_IMPORT("frontend.state_test.js");
SHADOW_IMPORT("frontend.undo_redo_test.js");
SHADOW_IMPORT("frontend.util_test.js");
SHADOW_IMPORT("frontend.util.datalog_test.js");
SHADOW_IMPORT("frontend.util.file_based.clock_test.js");
SHADOW_IMPORT("frontend.util.file_based.priority_test.js");
SHADOW_IMPORT("frontend.util.list_test.js");
SHADOW_IMPORT("frontend.util.marker_test.js");
SHADOW_IMPORT("frontend.util.property_test.js");
SHADOW_IMPORT("frontend.util.text_test.js");
SHADOW_IMPORT("logseq.db.test.helper.js");
SHADOW_IMPORT("frontend.worker.handler.page.db_based.page_test.js");
SHADOW_IMPORT("frontend.worker.handler.page.file_based.rename_test.js");
SHADOW_IMPORT("frontend.worker.flows.js");
SHADOW_IMPORT("frontend.worker.rtc.branch_graph.js");
SHADOW_IMPORT("malli.transform.js");
SHADOW_IMPORT("frontend.worker.rtc.malli_schema.js");
SHADOW_IMPORT("frontend.worker.rtc.client_op.js");
SHADOW_IMPORT("frontend.worker.rtc.exception.js");
SHADOW_IMPORT("frontend.worker.rtc.log_and_state.js");
SHADOW_IMPORT("frontend.worker.rtc.ws.js");
SHADOW_IMPORT("frontend.worker.rtc.ws_util.js");
SHADOW_IMPORT("frontend.worker.rtc.asset.js");
SHADOW_IMPORT("frontend.worker.rtc.const.js");
SHADOW_IMPORT("frontend.worker.rtc.remote_update.js");
SHADOW_IMPORT("frontend.worker.rtc.skeleton.js");
SHADOW_IMPORT("frontend.worker.rtc.client.js");
SHADOW_IMPORT("frontend.worker.rtc.client_test.js");
SHADOW_IMPORT("frontend.worker.rtc.gen_client_op.js");
SHADOW_IMPORT("frontend.worker.rtc.db_listener.js");
SHADOW_IMPORT("frontend.worker.rtc.fixture.js");
SHADOW_IMPORT("meander.util.epsilon.js");
SHADOW_IMPORT("meander.match.runtime.epsilon.js");
SHADOW_IMPORT("meander.substitute.runtime.epsilon.js");
SHADOW_IMPORT("meander.epsilon.js");
SHADOW_IMPORT("frontend.worker.rtc.gen_client_op_test.js");
SHADOW_IMPORT("frontend.worker.rtc.remote_update_test.js");
SHADOW_IMPORT("frontend.worker.fixtures.js");
SHADOW_IMPORT("frontend.worker.rtc.rtc_fns_test.js");
SHADOW_IMPORT("logseq.sdk.utils.js");
SHADOW_IMPORT("logseq.api.block.js");
SHADOW_IMPORT("logseq.api_test.js");
SHADOW_IMPORT("logseq.db.misc_test.js");
SHADOW_IMPORT("clojure.tools.cli.js");
SHADOW_IMPORT("shadow.test.js");
SHADOW_IMPORT("frontend.test.node_test_runner.js");
SHADOW_IMPORT("lambdaisland.glogi.print.js");
SHADOW_IMPORT("lambdaisland.glogi.console.js");
SHADOW_IMPORT("pjstadig.macro.js");
SHADOW_IMPORT("pjstadig.print.js");
SHADOW_IMPORT("pjstadig.util.js");
SHADOW_IMPORT("pjstadig.humane_test_output.js");
SHADOW_IMPORT("frontend.test.frontend_node_test_runner.js");
SHADOW_IMPORT("shadow.module.main.append.js");

})();
