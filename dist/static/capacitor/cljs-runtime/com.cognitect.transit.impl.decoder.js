goog.provide("com.cognitect.transit.impl.decoder");
goog.require("com.cognitect.transit.util");
goog.require("com.cognitect.transit.delimiters");
goog.require("com.cognitect.transit.caching");
goog.require("com.cognitect.transit.types");
goog.scope(function() {
  var decoder = com.cognitect.transit.impl.decoder, util = com.cognitect.transit.util, d = com.cognitect.transit.delimiters, caching = com.cognitect.transit.caching, types = com.cognitect.transit.types;
  decoder.Tag = function Transit$Tag(s) {
    this.str = s;
  };
  decoder.tag = function(s) {
    return new decoder.Tag(s);
  };
  decoder.isTag = function(x) {
    return x && x instanceof decoder.Tag;
  };
  decoder.isGroundHandler = function(handler) {
    switch(handler) {
      case "_":
      case "s":
      case "?":
      case "i":
      case "d":
      case "b":
      case "'":
      case "array":
      case "map":
        return true;
    }
    return false;
  };
  decoder.Decoder = function Transit$Decoder(options) {
    this.options = options || {};
    this.handlers = {};
    for (var h in this.defaults.handlers) {
      this.handlers[h] = this.defaults.handlers[h];
    }
    for (var h in this.options["handlers"]) {
      if (decoder.isGroundHandler(h)) {
        throw new Error('Cannot override handler for ground type "' + h + '"');
      }
      this.handlers[h] = this.options["handlers"][h];
    }
    this.preferStrings = this.options["preferStrings"] != null ? this.options["preferStrings"] : this.defaults.preferStrings;
    this.preferBuffers = this.options["preferBuffers"] != null ? this.options["preferBuffers"] : this.defaults.preferBuffers;
    this.defaultHandler = this.options["defaultHandler"] || this.defaults.defaultHandler;
    this.mapBuilder = this.options["mapBuilder"];
    this.arrayBuilder = this.options["arrayBuilder"];
  };
  decoder.Decoder.prototype.defaults = {handlers:{"_":function(v, d) {
    return types.nullValue();
  }, "?":function(v, d) {
    return types.boolValue(v);
  }, "b":function(v, d) {
    return types.binary(v, d);
  }, "i":function(v, d) {
    return types.intValue(v);
  }, "n":function(v, d) {
    return types.bigInteger(v);
  }, "d":function(v, d) {
    return types.floatValue(v);
  }, "f":function(v, d) {
    return types.bigDecimalValue(v);
  }, "c":function(v, d) {
    return types.charValue(v);
  }, ":":function(v, d) {
    return types.keyword(v);
  }, "$":function(v, d) {
    return types.symbol(v);
  }, "r":function(v, d) {
    return types.uri(v);
  }, "z":function(v, d) {
    return types.specialDouble(v);
  }, "'":function(v, d) {
    return v;
  }, "m":function(v, d) {
    return types.date(v);
  }, "t":function(v, d) {
    return types.verboseDate(v);
  }, "u":function(v, d) {
    return types.uuid(v);
  }, "set":function(v, d) {
    return types.set(v);
  }, "list":function(v, d) {
    return types.list(v);
  }, "link":function(v, d) {
    return types.link(v);
  }, "cmap":function(v, d) {
    return types.map(v, false);
  }}, defaultHandler:function(c, val) {
    return types.taggedValue(c, val);
  }, preferStrings:true, preferBuffers:true};
  decoder.Decoder.prototype.decode = function(node, cache, asMapKey, tagValue) {
    if (node == null) {
      return null;
    }
    var t = typeof node;
    switch(t) {
      case "string":
        return this.decodeString(node, cache, asMapKey, tagValue);
        break;
      case "object":
        if (util.isArray(node)) {
          if (node[0] === "^ ") {
            return this.decodeArrayHash(node, cache, asMapKey, tagValue);
          } else {
            return this.decodeArray(node, cache, asMapKey, tagValue);
          }
        } else {
          return this.decodeHash(node, cache, asMapKey, tagValue);
        }
        break;
    }
    return node;
  };
  decoder.Decoder.prototype["decode"] = decoder.Decoder.prototype.decode;
  decoder.Decoder.prototype.decodeString = function(string, cache, asMapKey, tagValue) {
    if (caching.isCacheable(string, asMapKey)) {
      var val = this.parseString(string, cache, false);
      if (cache) {
        cache.write(val, asMapKey);
      }
      return val;
    } else if (caching.isCacheCode(string)) {
      return cache.read(string, asMapKey);
    } else {
      return this.parseString(string, cache, asMapKey);
    }
  };
  decoder.Decoder.prototype.decodeHash = function(hash, cache, asMapKey, tagValue) {
    var ks = util.objectKeys(hash), key = ks[0], tag = ks.length == 1 ? this.decode(key, cache, false, false) : null;
    if (decoder.isTag(tag)) {
      var val = hash[key], handler = this.handlers[tag.str];
      if (handler != null) {
        return handler(this.decode(val, cache, false, true), this);
      } else {
        return types.taggedValue(tag.str, this.decode(val, cache, false, false));
      }
    } else if (this.mapBuilder) {
      if (ks.length < types.SMALL_ARRAY_MAP_THRESHOLD * 2 && this.mapBuilder.fromArray) {
        var nodep = [];
        for (var i = 0; i < ks.length; i++) {
          var strKey = ks[i];
          nodep.push(this.decode(strKey, cache, true, false));
          nodep.push(this.decode(hash[strKey], cache, false, false));
        }
        return this.mapBuilder.fromArray(nodep, hash);
      } else {
        var ret = this.mapBuilder.init(hash);
        for (var i = 0; i < ks.length; i++) {
          var strKey = ks[i];
          ret = this.mapBuilder.add(ret, this.decode(strKey, cache, true, false), this.decode(hash[strKey], cache, false, false), hash);
        }
        return this.mapBuilder.finalize(ret, hash);
      }
    } else {
      var nodep = [];
      for (var i = 0; i < ks.length; i++) {
        var strKey = ks[i];
        nodep.push(this.decode(strKey, cache, true, false));
        nodep.push(this.decode(hash[strKey], cache, false, false));
      }
      return types.map(nodep, false);
    }
  };
  decoder.Decoder.prototype.decodeArrayHash = function(node, cache, asMapKey, tagValue) {
    if (this.mapBuilder) {
      if (node.length < types.SMALL_ARRAY_MAP_THRESHOLD * 2 + 1 && this.mapBuilder.fromArray) {
        var nodep = [];
        for (var i = 1; i < node.length; i += 2) {
          nodep.push(this.decode(node[i], cache, true, false));
          nodep.push(this.decode(node[i + 1], cache, false, false));
        }
        return this.mapBuilder.fromArray(nodep, node);
      } else {
        var ret = this.mapBuilder.init(node);
        for (var i = 1; i < node.length; i += 2) {
          ret = this.mapBuilder.add(ret, this.decode(node[i], cache, true, false), this.decode(node[i + 1], cache, false, false), node);
        }
        return this.mapBuilder.finalize(ret, node);
      }
    } else {
      var nodep = [];
      for (var i = 1; i < node.length; i += 2) {
        nodep.push(this.decode(node[i], cache, true, false));
        nodep.push(this.decode(node[i + 1], cache, false, false));
      }
      return types.map(nodep, false);
    }
  };
  decoder.Decoder.prototype.decodeArray = function(node, cache, asMapKey, tagValue) {
    if (tagValue) {
      var ret = [];
      for (var i = 0; i < node.length; i++) {
        ret.push(this.decode(node[i], cache, asMapKey, false));
      }
      return ret;
    } else {
      var cacheIdx = cache && cache.idx;
      if (node.length === 2 && typeof node[0] === "string") {
        var tag = this.decode(node[0], cache, false, false);
        if (decoder.isTag(tag)) {
          var val = node[1], handler = this.handlers[tag.str];
          if (handler != null) {
            var ret = handler(this.decode(val, cache, asMapKey, true), this);
            return ret;
          } else {
            return types.taggedValue(tag.str, this.decode(val, cache, asMapKey, false));
          }
        }
      }
      if (cache && cacheIdx != cache.idx) {
        cache.idx = cacheIdx;
      }
      if (this.arrayBuilder) {
        if (node.length <= 32 && this.arrayBuilder.fromArray) {
          var arr = [];
          for (var i = 0; i < node.length; i++) {
            arr.push(this.decode(node[i], cache, asMapKey, false));
          }
          return this.arrayBuilder.fromArray(arr, node);
        } else {
          var ret = this.arrayBuilder.init(node);
          for (var i = 0; i < node.length; i++) {
            ret = this.arrayBuilder.add(ret, this.decode(node[i], cache, asMapKey, false), node);
          }
          return this.arrayBuilder.finalize(ret, node);
        }
      } else {
        var ret = [];
        for (var i = 0; i < node.length; i++) {
          ret.push(this.decode(node[i], cache, asMapKey, false));
        }
        return ret;
      }
    }
  };
  decoder.Decoder.prototype.parseString = function(string, cache, asMapKey) {
    if (string.charAt(0) === d.ESC) {
      var c = string.charAt(1);
      if (c === d.ESC || c === d.SUB || c === d.RES) {
        return string.substring(1);
      } else if (c === d.TAG) {
        return decoder.tag(string.substring(2));
      } else {
        var handler = this.handlers[c];
        if (handler == null) {
          return this.defaultHandler(c, string.substring(2));
        } else {
          return handler(string.substring(2), this);
        }
      }
    } else {
      return string;
    }
  };
  decoder.decoder = function(options) {
    return new decoder.Decoder(options);
  };
});

//# sourceMappingURL=com.cognitect.transit.impl.decoder.js.map
