goog.provide("com.cognitect.transit.impl.writer");
goog.require("com.cognitect.transit.util");
goog.require("com.cognitect.transit.caching");
goog.require("com.cognitect.transit.handlers");
goog.require("com.cognitect.transit.types");
goog.require("com.cognitect.transit.delimiters");
goog.require("goog.math.Long");
goog.scope(function() {
  var writer = com.cognitect.transit.impl.writer, util = com.cognitect.transit.util, caching = com.cognitect.transit.caching, handlers = com.cognitect.transit.handlers, types = com.cognitect.transit.types, d = com.cognitect.transit.delimiters, Long = goog.math.Long;
  writer.escape = function(string) {
    if (string.length > 0) {
      var c = string.charAt(0);
      if (c === d.ESC || c === d.SUB || c === d.RES) {
        return d.ESC + string;
      } else {
        return string;
      }
    } else {
      return string;
    }
  };
  writer.JSONMarshaller = function Transit$JSONMarshaller(opts) {
    this.opts = opts || {};
    this.preferStrings = this.opts["preferStrings"] != null ? this.opts["preferStrings"] : true;
    this.objectBuilder = this.opts["objectBuilder"] || null;
    this.transform = this.opts["transform"] || null;
    this.handlers = new handlers.Handlers();
    var optsHandlers = this.opts["handlers"];
    if (optsHandlers) {
      if (util.isArray(optsHandlers) || !optsHandlers.forEach) {
        throw new Error('transit writer "handlers" option must be a map');
      }
      var self = this;
      optsHandlers.forEach(function(v, k) {
        if (k !== undefined) {
          self.handlers.set(k, v);
        } else {
          throw new Error("Cannot create handler for JavaScript undefined");
        }
      });
    }
    this.handlerForForeign = this.opts["handlerForForeign"];
    this.unpack = this.opts["unpack"] || function(x) {
      if (types.isArrayMap(x) && x.backingMap === null) {
        return x._entries;
      } else {
        return false;
      }
    };
    this.verbose = this.opts && this.opts["verbose"] || false;
  };
  writer.JSONMarshaller.prototype.handler = function(obj) {
    var h = this.handlers.get(handlers.constructor(obj));
    if (h != null) {
      return h;
    } else {
      var tag = obj && obj["transitTag"];
      if (tag) {
        return this.handlers.get(tag);
      } else {
        return null;
      }
    }
  };
  writer.JSONMarshaller.prototype.registerHandler = function(ctor, handler) {
    this.handlers.set(ctor, handler);
  };
  writer.JSONMarshaller.prototype.emitNil = function(asMapKey, cache) {
    if (asMapKey) {
      return this.emitString(d.ESC, "_", "", asMapKey, cache);
    } else {
      return null;
    }
  };
  writer.JSONMarshaller.prototype.emitString = function(prefix, tag, s, asMapKey, cache) {
    var string = prefix + tag + s;
    if (cache) {
      return cache.write(string, asMapKey);
    } else {
      return string;
    }
  };
  writer.JSONMarshaller.prototype.emitBoolean = function(b, asMapKey, cache) {
    if (asMapKey) {
      var s = b.toString();
      return this.emitString(d.ESC, "?", s[0], asMapKey, cache);
    } else {
      return b;
    }
  };
  writer.JSONMarshaller.prototype.emitInteger = function(i, asMapKey, cache) {
    if (i === Infinity) {
      return this.emitString(d.ESC, "z", "INF", asMapKey, cache);
    } else if (i === -Infinity) {
      return this.emitString(d.ESC, "z", "-INF", asMapKey, cache);
    } else if (isNaN(i)) {
      return this.emitString(d.ESC, "z", "NaN", asMapKey, cache);
    } else if (asMapKey || typeof i === "string" || i instanceof Long) {
      return this.emitString(d.ESC, "i", i.toString(), asMapKey, cache);
    } else {
      return i;
    }
  };
  writer.JSONMarshaller.prototype.emitDouble = function(d, asMapKey, cache) {
    if (asMapKey) {
      return this.emitString(d.ESC, "d", d, asMapKey, cache);
    } else {
      return d;
    }
  };
  writer.JSONMarshaller.prototype.emitBinary = function(b, asMapKey, cache) {
    return this.emitString(d.ESC, "b", b, asMapKey, cache);
  };
  writer.JSONMarshaller.prototype.emitQuoted = function(em, obj, cache) {
    if (em.verbose) {
      var ret = {}, k = this.emitString(d.ESC_TAG, "'", "", true, cache);
      ret[k] = writer.marshal(this, obj, false, cache);
      return ret;
    } else {
      return [this.emitString(d.ESC_TAG, "'", "", true, cache), writer.marshal(this, obj, false, cache)];
    }
  };
  writer.emitObjects = function(em, iterable, cache) {
    var ret = [];
    if (util.isArray(iterable)) {
      for (var i = 0; i < iterable.length; i++) {
        ret.push(writer.marshal(em, iterable[i], false, cache));
      }
    } else {
      iterable.forEach(function(v, i) {
        ret.push(writer.marshal(em, v, false, cache));
      });
    }
    return ret;
  };
  writer.emitArray = function(em, iterable, skip, cache) {
    return writer.emitObjects(em, iterable, cache);
  };
  writer.isStringableKey = function(em, k) {
    if (typeof k !== "string") {
      var h = em.handler(k);
      return h && h.tag(k).length === 1;
    } else {
      return true;
    }
  };
  writer.stringableKeys = function(em, obj) {
    var arr = em.unpack(obj), stringableKeys = true;
    if (arr) {
      for (var i = 0; i < arr.length; i += 2) {
        stringableKeys = writer.isStringableKey(em, arr[i]);
        if (!stringableKeys) {
          break;
        }
      }
      return stringableKeys;
    } else if (obj.keys) {
      var iter = obj.keys(), step = null;
      if (iter.next) {
        step = iter.next();
        while (!step.done) {
          stringableKeys = writer.isStringableKey(em, step.value);
          if (!stringableKeys) {
            break;
          }
          step = iter.next();
        }
        return stringableKeys;
      }
    }
    if (obj.forEach) {
      obj.forEach(function(v, k) {
        stringableKeys = stringableKeys && writer.isStringableKey(em, k);
      });
      return stringableKeys;
    } else {
      throw new Error("Cannot walk keys of object type " + handlers.constructor(obj).name);
    }
  };
  writer.isForeignObject = function(x) {
    if (x.constructor["transit$isObject"]) {
      return true;
    }
    var ret = x.constructor.toString();
    ret = ret.substr("function ".length);
    ret = ret.substr(0, ret.indexOf("("));
    var isObject = ret == "Object";
    if (typeof Object.defineProperty != "undefined") {
      Object.defineProperty(x.constructor, "transit$isObject", {value:isObject, enumerable:false});
    } else {
      x.constructor["transit$isObject"] = isObject;
    }
    return isObject;
  };
  writer.emitMap = function(em, obj, skip, cache) {
    var arr = null, rep = null, tag = null, ks = null, i = 0;
    if (obj.constructor === Object || obj.forEach != null || em.handlerForForeign && writer.isForeignObject(obj)) {
      if (em.verbose) {
        if (obj.forEach != null) {
          if (writer.stringableKeys(em, obj)) {
            var ret = {};
            obj.forEach(function(v, k) {
              ret[writer.marshal(em, k, true, false)] = writer.marshal(em, v, false, cache);
            });
            return ret;
          } else {
            arr = em.unpack(obj);
            rep = [];
            tag = em.emitString(d.ESC_TAG, "cmap", "", true, cache);
            if (arr) {
              for (; i < arr.length; i += 2) {
                rep.push(writer.marshal(em, arr[i], false, false));
                rep.push(writer.marshal(em, arr[i + 1], false, cache));
              }
            } else {
              obj.forEach(function(v, k) {
                rep.push(writer.marshal(em, k, false, false));
                rep.push(writer.marshal(em, v, false, cache));
              });
            }
            ret = {};
            ret[tag] = rep;
            return ret;
          }
        } else {
          ks = util.objectKeys(obj);
          ret = {};
          for (; i < ks.length; i++) {
            ret[writer.marshal(em, ks[i], true, false)] = writer.marshal(em, obj[ks[i]], false, cache);
          }
          return ret;
        }
      } else {
        if (obj.forEach != null) {
          if (writer.stringableKeys(em, obj)) {
            arr = em.unpack(obj);
            ret = ["^ "];
            if (arr) {
              for (; i < arr.length; i += 2) {
                ret.push(writer.marshal(em, arr[i], true, cache));
                ret.push(writer.marshal(em, arr[i + 1], false, cache));
              }
            } else {
              obj.forEach(function(v, k) {
                ret.push(writer.marshal(em, k, true, cache));
                ret.push(writer.marshal(em, v, false, cache));
              });
            }
            return ret;
          } else {
            arr = em.unpack(obj);
            rep = [];
            tag = em.emitString(d.ESC_TAG, "cmap", "", true, cache);
            if (arr) {
              for (; i < arr.length; i += 2) {
                rep.push(writer.marshal(em, arr[i], false, cache));
                rep.push(writer.marshal(em, arr[i + 1], false, cache));
              }
            } else {
              obj.forEach(function(v, k) {
                rep.push(writer.marshal(em, k, false, cache));
                rep.push(writer.marshal(em, v, false, cache));
              });
            }
            return [tag, rep];
          }
        } else {
          ret = ["^ "];
          ks = util.objectKeys(obj);
          for (; i < ks.length; i++) {
            ret.push(writer.marshal(em, ks[i], true, cache));
            ret.push(writer.marshal(em, obj[ks[i]], false, cache));
          }
          return ret;
        }
      }
    } else if (em.objectBuilder != null) {
      return em.objectBuilder(obj, function(k) {
        return writer.marshal(em, k, true, cache);
      }, function(v) {
        return writer.marshal(em, v, false, cache);
      });
    } else {
      var name = handlers.constructor(obj).name, err = new Error("Cannot write " + name);
      err.data = {obj:obj, type:name};
      throw err;
    }
  };
  writer.emitTaggedMap = function(em, tag, rep, skip, cache) {
    if (em.verbose) {
      var ret = {};
      ret[em.emitString(d.ESC_TAG, tag, "", true, cache)] = writer.marshal(em, rep, false, cache);
      return ret;
    } else {
      return [em.emitString(d.ESC_TAG, tag, "", true, cache), writer.marshal(em, rep, false, cache)];
    }
  };
  writer.emitEncoded = function(em, h, tag, rep, obj, asMapKey, cache) {
    if (tag.length === 1) {
      if (typeof rep === "string") {
        return em.emitString(d.ESC, tag, rep, asMapKey, cache);
      } else if (asMapKey || em.preferStrings) {
        var vh = em.verbose && h.getVerboseHandler();
        if (vh) {
          tag = vh.tag(obj);
          rep = vh.stringRep(obj, vh);
        } else {
          rep = h.stringRep(obj, h);
        }
        if (rep !== null) {
          return em.emitString(d.ESC, tag, rep, asMapKey, cache);
        } else {
          var err = new Error('Tag "' + tag + '" cannot be encoded as string');
          err.data = {tag:tag, rep:rep, obj:obj};
          throw err;
        }
      } else {
        return writer.emitTaggedMap(em, tag, rep, asMapKey, cache);
      }
    } else {
      return writer.emitTaggedMap(em, tag, rep, asMapKey, cache);
    }
  };
  writer.marshal = function(em, obj, asMapKey, cache) {
    if (em.transform !== null) {
      obj = em.transform(obj);
    }
    var h = em.handler(obj) || (em.handlerForForeign ? em.handlerForForeign(obj, em.handlers) : null), tag = h ? h.tag(obj) : null, rep = h ? h.rep(obj) : null;
    if (h != null && tag != null) {
      switch(tag) {
        case "_":
          return em.emitNil(asMapKey, cache);
          break;
        case "s":
          return em.emitString("", "", writer.escape(rep), asMapKey, cache);
          break;
        case "?":
          return em.emitBoolean(rep, asMapKey, cache);
          break;
        case "i":
          return em.emitInteger(rep, asMapKey, cache);
          break;
        case "d":
          return em.emitDouble(rep, asMapKey, cache);
          break;
        case "b":
          return em.emitBinary(rep, asMapKey, cache);
          break;
        case "'":
          return em.emitQuoted(em, rep, cache);
          break;
        case "array":
          return writer.emitArray(em, rep, asMapKey, cache);
          break;
        case "map":
          return writer.emitMap(em, rep, asMapKey, cache);
          break;
        default:
          return writer.emitEncoded(em, h, tag, rep, obj, asMapKey, cache);
          break;
      }
    } else {
      var name = handlers.constructor(obj).name, err = new Error("Cannot write " + name);
      err.data = {obj:obj, type:name};
      throw err;
    }
  };
  writer.maybeQuoted = function(em, obj) {
    var h = em.handler(obj) || (em.handlerForForeign ? em.handlerForForeign(obj, em.handlers) : null);
    if (h != null) {
      if (h.tag(obj).length === 1) {
        return types.quoted(obj);
      } else {
        return obj;
      }
    } else {
      var name = handlers.constructor(obj).name, err = new Error("Cannot write " + name);
      err.data = {obj:obj, type:name};
      throw err;
    }
  };
  writer.marshalTop = function(em, obj, asMapKey, cache) {
    return JSON.stringify(writer.marshal(em, writer.maybeQuoted(em, obj), asMapKey, cache));
  };
  writer.Writer = function Transit$Writer(marshaller, options) {
    this._marshaller = marshaller;
    this.options = options || {};
    if (this.options["cache"] === false) {
      this.cache = null;
    } else {
      this.cache = this.options["cache"] ? this.options["cache"] : new caching.WriteCache();
    }
  };
  writer.Writer.prototype.marshaller = function() {
    return this._marshaller;
  };
  writer.Writer.prototype["marshaller"] = writer.Writer.prototype.marshaller;
  writer.Writer.prototype.write = function(obj, opts) {
    var ret = null, ropts = opts || {}, asMapKey = ropts["asMapKey"] || false, cache = this._marshaller.verbose ? false : this.cache;
    if (ropts["marshalTop"] === false) {
      ret = writer.marshal(this._marshaller, obj, asMapKey, cache);
    } else {
      ret = writer.marshalTop(this._marshaller, obj, asMapKey, cache);
    }
    if (this.cache != null) {
      this.cache.clear();
    }
    return ret;
  };
  writer.Writer.prototype["write"] = writer.Writer.prototype.write;
  writer.Writer.prototype.register = function(type, handler) {
    this._marshaller.registerHandler(type, handler);
  };
  writer.Writer.prototype["register"] = writer.Writer.prototype.register;
});

//# sourceMappingURL=com.cognitect.transit.impl.writer.js.map
