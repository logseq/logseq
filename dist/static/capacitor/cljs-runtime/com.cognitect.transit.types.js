goog.provide("com.cognitect.transit.types");
goog.require("com.cognitect.transit.util");
goog.require("com.cognitect.transit.eq");
goog.require("goog.math.Long");
goog.scope(function() {
  var types = com.cognitect.transit.types, util = com.cognitect.transit.util, eq = com.cognitect.transit.eq, Long = goog.math.Long;
  if (typeof Symbol != "undefined") {
    types.ITERATOR = Symbol.iterator;
  } else {
    types.ITERATOR = "@@iterator";
  }
  types.TaggedValue = function Transit$TaggedValue(tag, rep) {
    this.tag = tag;
    this.rep = rep;
    this.hashCode = -1;
  };
  types.TaggedValue.prototype.toString = function() {
    return "[TaggedValue: " + this.tag + ", " + this.rep + "]";
  };
  types.TaggedValue.prototype.equiv = function(other) {
    return eq.equals(this, other);
  };
  types.TaggedValue.prototype["equiv"] = types.TaggedValue.prototype.equiv;
  types.TaggedValue.prototype.com$cognitect$transit$equals = function(other) {
    if (other instanceof types.TaggedValue) {
      return this.tag === other.tag && eq.equals(this.rep, other.rep);
    } else {
      return false;
    }
  };
  types.TaggedValue.prototype.com$cognitect$transit$hashCode = function() {
    if (this.hashCode === -1) {
      this.hashCode = eq.hashCombine(eq.hashCode(this.tag), eq.hashCode(this.rep));
    }
    return this.hashCode;
  };
  types.taggedValue = function(tag, rep) {
    return new types.TaggedValue(tag, rep);
  };
  types.isTaggedValue = function(x) {
    return x instanceof types.TaggedValue;
  };
  types.nullValue = function() {
    return null;
  };
  types.boolValue = function(s) {
    return s === "t";
  };
  types.MAX_INT = Long.fromString("9007199254740991");
  types.MIN_INT = Long.fromString("-9007199254740991");
  types.intValue = function(s) {
    if (typeof s === "number") {
      return s;
    } else if (s instanceof Long) {
      return s;
    } else {
      var n = Long.fromString(s, 10);
      if (n.greaterThan(types.MAX_INT) || n.lessThan(types.MIN_INT)) {
        return n;
      } else {
        return n.toNumber();
      }
    }
  };
  Long.prototype.equiv = function(other) {
    return eq.equals(this, other);
  };
  Long.prototype["equiv"] = Long.prototype.equiv;
  Long.prototype.com$cognitect$transit$equals = function(other) {
    return other instanceof Long && this.equals(other);
  };
  Long.prototype.com$cognitect$transit$hashCode = function() {
    return this.toInt();
  };
  types.isInteger = function(x) {
    if (x instanceof Long) {
      return true;
    } else {
      return typeof x === "number" && !isNaN(x) && !(x === Infinity) && parseFloat(x) === parseInt(x, 10);
    }
  };
  types.floatValue = function(s) {
    return parseFloat(s);
  };
  types.bigInteger = function(s) {
    return types.taggedValue("n", s);
  };
  types.isBigInteger = function(x) {
    return x instanceof types.TaggedValue && x.tag === "n";
  };
  types.bigDecimalValue = function(s) {
    return types.taggedValue("f", s);
  };
  types.isBigDecimal = function(x) {
    return x instanceof types.TaggedValue && x.tag === "f";
  };
  types.charValue = function(s) {
    return s;
  };
  types.Keyword = function Transit$Keyword(name) {
    this._name = name;
    this.hashCode = -1;
  };
  types.Keyword.prototype.toString = function() {
    return ":" + this._name;
  };
  types.Keyword.prototype["namespace"] = function() {
    var idx = this._name.indexOf("/");
    if (idx != -1) {
      return this._name.substring(0, idx);
    } else {
      return null;
    }
  };
  types.Keyword.prototype["name"] = function() {
    var idx = this._name.indexOf("/");
    if (idx != -1) {
      return this._name.substring(idx + 1, this._name.length);
    } else {
      return this._name;
    }
  };
  types.Keyword.prototype.equiv = function(other) {
    return eq.equals(this, other);
  };
  types.Keyword.prototype["equiv"] = types.Keyword.prototype.equiv;
  types.Keyword.prototype.com$cognitect$transit$equals = function(other) {
    return other instanceof types.Keyword && this._name == other._name;
  };
  types.Keyword.prototype.com$cognitect$transit$hashCode = function() {
    if (this.hashCode === -1) {
      this.hashCode = eq.hashCode(this._name);
    }
    return this.hashCode;
  };
  types.keyword = function(s) {
    return new types.Keyword(s);
  };
  types.isKeyword = function(x) {
    return x instanceof types.Keyword;
  };
  types.Symbol = function Transit$Symbol(name) {
    this._name = name;
    this.hashCode = -1;
  };
  types.Symbol.prototype["namespace"] = function() {
    var idx = this._name.indexOf("/");
    if (idx != -1) {
      return this._name.substring(0, idx);
    } else {
      return null;
    }
  };
  types.Symbol.prototype["name"] = function() {
    var idx = this._name.indexOf("/");
    if (idx != -1) {
      return this._name.substring(idx + 1, this._name.length);
    } else {
      return this._name;
    }
  };
  types.Symbol.prototype.toString = function() {
    return this._name;
  };
  types.Symbol.prototype.equiv = function(other) {
    return eq.equals(this, other);
  };
  types.Symbol.prototype["equiv"] = types.Symbol.prototype.equiv;
  types.Symbol.prototype.com$cognitect$transit$equals = function(other) {
    return other instanceof types.Symbol && this._name == other._name;
  };
  types.Symbol.prototype.com$cognitect$transit$hashCode = function() {
    if (this.hashCode === -1) {
      this.hashCode = eq.hashCode(this._name);
    }
    return this.hashCode;
  };
  types.symbol = function(s) {
    return new types.Symbol(s);
  };
  types.isSymbol = function(x) {
    return x instanceof types.Symbol;
  };
  types.hexFor = function(aLong, sidx, eidx) {
    var ret = "";
    eidx = eidx || sidx + 1;
    for (var i = sidx, shift = (7 - i) * 8, mask = Long.fromInt(255).shiftLeft(shift); i < eidx; i++, shift -= 8, mask = mask.shiftRightUnsigned(8)) {
      var s = aLong.and(mask).shiftRightUnsigned(shift).toString(16);
      if (s.length == 1) {
        s = "0" + s;
      }
      ret += s;
    }
    return ret;
  };
  types.UUID = function Transit$UUID(high, low) {
    this.high = high;
    this.low = low;
    this.hashCode = -1;
  };
  types.UUID.prototype.getLeastSignificantBits = function() {
    return this.low;
  };
  types.UUID.prototype.getMostSignificantBits = function() {
    return this.high;
  };
  types.UUID.prototype.toString = function() {
    var s = "", hi64 = this.high, lo64 = this.low;
    s += types.hexFor(hi64, 0, 4) + "-";
    s += types.hexFor(hi64, 4, 6) + "-";
    s += types.hexFor(hi64, 6, 8) + "-";
    s += types.hexFor(lo64, 0, 2) + "-";
    s += types.hexFor(lo64, 2, 8);
    return s;
  };
  types.UUID.prototype.equiv = function(other) {
    return eq.equals(this, other);
  };
  types.UUID.prototype["equiv"] = types.UUID.prototype.equiv;
  types.UUID.prototype.com$cognitect$transit$equals = function(other) {
    return other instanceof types.UUID && this.high.equals(other.high) && this.low.equals(other.low);
  };
  types.UUID.prototype.com$cognitect$transit$hashCode = function() {
    if (this.hashCode === -1) {
      this.hashCode = eq.hashCode(this.toString());
    }
    return this.hashCode;
  };
  types.UUIDfromString = function uuidFromString(s) {
    s = s.replace(/-/g, "");
    var hi64 = null, lo64 = null, hi32 = 0, lo32 = 0, off = 24, i = 0;
    for (hi32 = 0, i = 0, off = 24; i < 8; i += 2, off -= 8) {
      hi32 |= parseInt(s.substring(i, i + 2), 16) << off;
    }
    for (lo32 = 0, i = 8, off = 24; i < 16; i += 2, off -= 8) {
      lo32 |= parseInt(s.substring(i, i + 2), 16) << off;
    }
    hi64 = Long.fromBits(lo32, hi32);
    for (hi32 = 0, i = 16, off = 24; i < 24; i += 2, off -= 8) {
      hi32 |= parseInt(s.substring(i, i + 2), 16) << off;
    }
    for (lo32 = 0, i = 24, off = 24; i < 32; i += 2, off -= 8) {
      lo32 |= parseInt(s.substring(i, i + 2), 16) << off;
    }
    lo64 = Long.fromBits(lo32, hi32);
    return new types.UUID(hi64, lo64);
  };
  types.uuid = function(s) {
    return types.UUIDfromString(s);
  };
  types.isUUID = function(x) {
    return x instanceof types.UUID;
  };
  types.date = function(s) {
    s = typeof s === "number" ? s : parseInt(s, 10);
    return new Date(s);
  };
  types.verboseDate = function(s) {
    return new Date(s);
  };
  Date.prototype.com$cognitect$transit$equals = function(other) {
    if (other instanceof Date) {
      return this.valueOf() === other.valueOf();
    } else {
      return false;
    }
  };
  Date.prototype.com$cognitect$transit$hashCode = function() {
    return this.valueOf();
  };
  types.binary = function(str, decoder) {
    if ((!decoder || decoder.preferBuffers !== false) && typeof goog.global.Buffer != "undefined") {
      return new goog.global.Buffer(str, "base64");
    } else if (typeof Uint8Array != "undefined") {
      return util.Base64ToUint8(str);
    } else {
      return types.taggedValue("b", str);
    }
  };
  types.isBinary = function(x) {
    if (typeof goog.global.Buffer != "undefined" && x instanceof goog.global.Buffer) {
      return true;
    } else if (typeof Uint8Array != "undefined" && x instanceof Uint8Array) {
      return true;
    } else {
      return x instanceof types.TaggedValue && x.tag === "b";
    }
  };
  types.uri = function(s) {
    return types.taggedValue("r", s);
  };
  types.isURI = function(x) {
    return x instanceof types.TaggedValue && x.tag === "r";
  };
  types.KEYS = 0;
  types.VALUES = 1;
  types.ENTRIES = 2;
  types.TransitArrayMapIterator = function Transit$ArrayMapIterator(entries, type) {
    this.entries = entries;
    this.type = type || types.KEYS;
    this.idx = 0;
  };
  types.TransitArrayMapIterator.prototype.next = function() {
    if (this.idx < this.entries.length) {
      var value = null;
      if (this.type === types.KEYS) {
        value = this.entries[this.idx];
      } else if (this.type === types.VALUES) {
        value = this.entries[this.idx + 1];
      } else {
        value = [this.entries[this.idx], this.entries[this.idx + 1]];
      }
      var ret = {"value":value, "done":false};
      this.idx += 2;
      return ret;
    } else {
      return {"value":null, "done":true};
    }
  };
  types.TransitArrayMapIterator.prototype["next"] = types.TransitArrayMapIterator.prototype.next;
  types.TransitArrayMapIterator.prototype[types.ITERATOR] = function() {
    return this;
  };
  types.TransitMapIterator = function Transit$MapIterator(map, type) {
    this.map = map;
    this.type = type || types.KEYS;
    this.keys = this.map.getKeys();
    this.idx = 0;
    this.bucket = null;
    this.bucketIdx = 0;
  };
  types.TransitMapIterator.prototype.next = function() {
    if (this.idx < this.map.size) {
      if (this.bucket == null || !(this.bucketIdx < this.bucket.length)) {
        this.bucket = this.map.map[this.keys[this.idx]];
        this.bucketIdx = 0;
      }
      var value = null;
      if (this.type === types.KEYS) {
        value = this.bucket[this.bucketIdx];
      } else if (this.type === types.VALUES) {
        value = this.bucket[this.bucketIdx + 1];
      } else {
        value = [this.bucket[this.bucketIdx], this.bucket[this.bucketIdx + 1]];
      }
      var ret = {"value":value, "done":false};
      this.idx++;
      this.bucketIdx += 2;
      return ret;
    } else {
      return {"value":null, "done":true};
    }
  };
  types.TransitMapIterator.prototype["next"] = types.TransitMapIterator.prototype.next;
  types.TransitMapIterator.prototype[types.ITERATOR] = function() {
    return this;
  };
  types.mapEquals = function(me, you) {
    if (me instanceof types.TransitMap && types.isMap(you)) {
      if (me.size !== you.size) {
        return false;
      }
      for (var code in me.map) {
        var bucket = me.map[code];
        for (var j = 0; j < bucket.length; j += 2) {
          if (!eq.equals(bucket[j + 1], you.get(bucket[j]))) {
            return false;
          }
        }
      }
      return true;
    } else if (me instanceof types.TransitArrayMap && types.isMap(you)) {
      if (me.size !== you.size) {
        return false;
      }
      var entries = me._entries;
      for (var j = 0; j < entries.length; j += 2) {
        if (!eq.equals(entries[j + 1], you.get(entries[j]))) {
          return false;
        }
      }
      return true;
    } else if (you != null && typeof you === "object") {
      var ks = util.objectKeys(you), kslen = ks.length;
      if (me.size === kslen) {
        for (var i = 0; i < kslen; i++) {
          var k = ks[i];
          if (!me.has(k) || !eq.equals(you[k], me.get(k))) {
            return false;
          }
        }
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };
  types.SMALL_ARRAY_MAP_THRESHOLD = 8;
  types.ARRAY_MAP_THRESHOLD = 32;
  types.ARRAY_MAP_ACCESS_THRESHOLD = 32;
  types.print = function(x) {
    if (x == null) {
      return "null";
    }
    if (goog.typeOf(x) === "array") {
      return "[" + x.toString() + "]";
    } else if (goog.typeOf(x) === "string") {
      return '"' + x + '"';
    } else {
      return x.toString();
    }
  };
  types.printMap = function(map) {
    var idx = 0, str = "TransitMap {";
    map.forEach(function(v, k) {
      str += types.print(k) + " \x3d\x3e " + types.print(v);
      if (idx < map.size - 1) {
        str += ", ";
      }
      idx++;
    });
    return str + "}";
  };
  types.printSet = function(set) {
    var idx = 0, str = "TransitSet {";
    set.forEach(function(v) {
      str += types.print(v);
      if (idx < set.size - 1) {
        str += ", ";
      }
      idx++;
    });
    return str + "}";
  };
  types.TransitArrayMap = function Transit$ArrayMap(entries) {
    this._entries = entries;
    this.backingMap = null;
    this.hashCode = -1;
    this.size = entries.length / 2;
    this.accesses = 0;
  };
  types.TransitArrayMap.prototype.toString = function() {
    return types.printMap(this);
  };
  types.TransitArrayMap.prototype["inspect"] = function() {
    return this.toString();
  };
  types.TransitArrayMap.prototype.convert = function() {
    if (this.backingMap) {
      throw Error("Invalid operation, already converted");
    }
    if (this.size < types.SMALL_ARRAY_MAP_THRESHOLD) {
      return false;
    }
    this.accesses++;
    if (this.accesses > types.ARRAY_MAP_ACCESS_THRESHOLD) {
      this.backingMap = types.map(this._entries, false, true);
      this._entries = [];
      return true;
    } else {
      return false;
    }
  };
  types.TransitArrayMap.prototype.clear = function() {
    this.hashCode = -1;
    if (this.backingMap) {
      this.backingMap.clear();
      this.size = 0;
    } else {
      this._entries = [];
      this.size = 0;
    }
  };
  types.TransitArrayMap.prototype["clear"] = types.TransitArrayMap.prototype.clear;
  types.TransitArrayMap.prototype.keys = function() {
    if (this.backingMap) {
      return this.backingMap.keys();
    } else {
      return new types.TransitArrayMapIterator(this._entries, types.KEYS);
    }
  };
  types.TransitArrayMap.prototype["keys"] = types.TransitArrayMap.prototype.keys;
  types.TransitArrayMap.prototype.keySet = function() {
    if (this.backingMap) {
      return this.backingMap.keySet();
    } else {
      var ret = [];
      for (var i = 0, j = 0; j < this._entries.length; i++, j += 2) {
        ret[i] = this._entries[j];
      }
      return ret;
    }
  };
  types.TransitArrayMap.prototype["keySet"] = types.TransitArrayMap.prototype.keySet;
  types.TransitArrayMap.prototype.entries = function() {
    if (this.backingMap) {
      return this.backingMap.entries();
    } else {
      return new types.TransitArrayMapIterator(this._entries, types.ENTRIES);
    }
  };
  types.TransitArrayMap.prototype["entries"] = types.TransitArrayMap.prototype.entries;
  types.TransitArrayMap.prototype.values = function() {
    if (this.backingMap) {
      return this.backingMap.values();
    } else {
      return new types.TransitArrayMapIterator(this._entries, types.VALUES);
    }
  };
  types.TransitArrayMap.prototype["values"] = types.TransitArrayMap.prototype.values;
  types.TransitArrayMap.prototype.forEach = function(f) {
    if (this.backingMap) {
      this.backingMap.forEach(f);
    } else {
      for (var i = 0; i < this._entries.length; i += 2) {
        f(this._entries[i + 1], this._entries[i]);
      }
    }
  };
  types.TransitArrayMap.prototype["forEach"] = types.TransitArrayMap.prototype.forEach;
  types.TransitArrayMap.prototype.get = function(k, notFound) {
    if (this.backingMap) {
      return this.backingMap.get(k);
    } else {
      if (this.convert()) {
        return this.get(k);
      } else {
        for (var i = 0; i < this._entries.length; i += 2) {
          if (eq.equals(this._entries[i], k)) {
            return this._entries[i + 1];
          }
        }
        return notFound;
      }
    }
  };
  types.TransitArrayMap.prototype["get"] = types.TransitArrayMap.prototype.get;
  types.TransitArrayMap.prototype.has = function(k) {
    if (this.backingMap) {
      return this.backingMap.has(k);
    } else {
      if (this.convert()) {
        return this.has(k);
      } else {
        for (var i = 0; i < this._entries.length; i += 2) {
          if (eq.equals(this._entries[i], k)) {
            return true;
          }
        }
        return false;
      }
    }
  };
  types.TransitArrayMap.prototype["has"] = types.TransitArrayMap.prototype.has;
  types.TransitArrayMap.prototype.set = function(k, v) {
    this.hashCode = -1;
    if (this.backingMap) {
      this.backingMap.set(k, v);
      this.size = this.backingMap.size;
    } else {
      for (var i = 0; i < this._entries.length; i += 2) {
        if (eq.equals(this._entries[i], k)) {
          this._entries[i + 1] = v;
          return;
        }
      }
      this._entries.push(k);
      this._entries.push(v);
      this.size++;
      if (this.size > types.ARRAY_MAP_THRESHOLD) {
        this.backingMap = types.map(this._entries, false, true);
        this._entries = null;
      }
    }
  };
  types.TransitArrayMap.prototype["set"] = types.TransitArrayMap.prototype.set;
  types.TransitArrayMap.prototype["delete"] = function(k) {
    this.hashCode = -1;
    if (this.backingMap) {
      var ret = this.backingMap.delete(k);
      this.size = this.backingMap.size;
      return ret;
    } else {
      for (var i = 0; i < this._entries.length; i += 2) {
        if (eq.equals(this._entries[i], k)) {
          var ret = this._entries[i + 1];
          this._entries.splice(i, 2);
          this.size--;
          return ret;
        }
      }
    }
  };
  types.TransitArrayMap.prototype.clone = function() {
    var clone = types.map();
    this.forEach(function(v, k) {
      clone.set(k, v);
    });
    return clone;
  };
  types.TransitArrayMap.prototype["clone"] = types.TransitArrayMap.prototype.clone;
  types.TransitArrayMap.prototype[types.ITERATOR] = function() {
    return this.entries();
  };
  types.TransitArrayMap.prototype.com$cognitect$transit$hashCode = function() {
    if (this.backingMap) {
      return this.backingMap.com$cognitect$transit$hashCode();
    } else {
      if (this.hashCode === -1) {
        this.hashCode = eq.hashMapLike(this);
      }
      return this.hashCode;
    }
  };
  types.TransitArrayMap.prototype.com$cognitect$transit$equals = function(other) {
    if (this.backingMap) {
      return types.mapEquals(this.backingMap, other);
    } else {
      return types.mapEquals(this, other);
    }
  };
  types.TransitMap = function Transit$Map(keys, map, size) {
    this.map = map || {};
    this._keys = keys || [];
    this.size = size || 0;
    this.hashCode = -1;
  };
  types.TransitMap.prototype.toString = function() {
    return types.printMap(this);
  };
  types.TransitMap.prototype["inspect"] = function() {
    return this.toString();
  };
  types.TransitMap.prototype.clear = function() {
    this.hashCode = -1;
    this.map = {};
    this._keys = [];
    this.size = 0;
  };
  types.TransitMap.prototype["clear"] = types.TransitMap.prototype.clear;
  types.TransitMap.prototype.getKeys = function() {
    if (this._keys != null) {
      return this._keys;
    } else {
      return util.objectKeys(this.map);
    }
  };
  types.TransitMap.prototype["delete"] = function(k) {
    this.hashCode = -1;
    this._keys = null;
    var code = eq.hashCode(k), bucket = this.map[code];
    for (var i = 0; i < bucket.length; i += 2) {
      if (eq.equals(k, bucket[i])) {
        var ret = bucket[i + 1];
        bucket.splice(i, 2);
        if (bucket.length === 0) {
          delete this.map[code];
        }
        this.size--;
        return ret;
      }
    }
  };
  types.TransitMap.prototype.entries = function() {
    return new types.TransitMapIterator(this, types.ENTRIES);
  };
  types.TransitMap.prototype["entries"] = types.TransitMap.prototype.entries;
  types.TransitMap.prototype.forEach = function(callback) {
    var ks = this.getKeys();
    for (var i = 0; i < ks.length; i++) {
      var bucket = this.map[ks[i]];
      for (var j = 0; j < bucket.length; j += 2) {
        callback(bucket[j + 1], bucket[j], this);
      }
    }
  };
  types.TransitMap.prototype["forEach"] = types.TransitMap.prototype.forEach;
  types.TransitMap.prototype.get = function(k, notFound) {
    var code = eq.hashCode(k), bucket = this.map[code];
    if (bucket != null) {
      for (var i = 0; i < bucket.length; i += 2) {
        if (eq.equals(k, bucket[i])) {
          return bucket[i + 1];
        }
      }
    } else {
      return notFound;
    }
  };
  types.TransitMap.prototype["get"] = types.TransitMap.prototype.get;
  types.TransitMap.prototype.has = function(k) {
    var code = eq.hashCode(k), bucket = this.map[code];
    if (bucket != null) {
      for (var i = 0; i < bucket.length; i += 2) {
        if (eq.equals(k, bucket[i])) {
          return true;
        }
      }
      return false;
    } else {
      return false;
    }
  };
  types.TransitMap.prototype["has"] = types.TransitMap.prototype.has;
  types.TransitMap.prototype.keys = function() {
    return new types.TransitMapIterator(this, types.KEYS);
  };
  types.TransitMap.prototype["keys"] = types.TransitMap.prototype.keys;
  types.TransitMap.prototype.keySet = function() {
    var keys = this.getKeys(), ret = [];
    for (var i = 0; i < keys.length; i++) {
      var bucket = this.map[keys[i]];
      for (var j = 0; j < bucket.length; j += 2) {
        ret.push(bucket[j]);
      }
    }
    return ret;
  };
  types.TransitMap.prototype["keySet"] = types.TransitMap.prototype.keySet;
  types.TransitMap.prototype.set = function(k, v) {
    this.hashCode = -1;
    var code = eq.hashCode(k), bucket = this.map[code];
    if (bucket == null) {
      if (this._keys) {
        this._keys.push(code);
      }
      this.map[code] = [k, v];
      this.size++;
    } else {
      var newEntry = true;
      for (var i = 0; i < bucket.length; i += 2) {
        if (eq.equals(v, bucket[i])) {
          newEntry = false;
          bucket[i] = v;
          break;
        }
      }
      if (newEntry) {
        bucket.push(k);
        bucket.push(v);
        this.size++;
      }
    }
  };
  types.TransitMap.prototype["set"] = types.TransitMap.prototype.set;
  types.TransitMap.prototype.values = function() {
    return new types.TransitMapIterator(this, types.VALUES);
  };
  types.TransitMap.prototype["values"] = types.TransitMap.prototype.values;
  types.TransitMap.prototype.clone = function() {
    var clone = types.map();
    this.forEach(function(v, k) {
      clone.set(k, v);
    });
    return clone;
  };
  types.TransitMap.prototype["clone"] = types.TransitMap.prototype.clone;
  types.TransitMap.prototype[types.ITERATOR] = function() {
    return this.entries();
  };
  types.TransitMap.prototype.com$cognitect$transit$hashCode = function() {
    if (this.hashCode === -1) {
      this.hashCode = eq.hashMapLike(this);
    }
    return this.hashCode;
  };
  types.TransitMap.prototype.com$cognitect$transit$equals = function(other) {
    return types.mapEquals(this, other);
  };
  types.map = function(arr, checkDups, hashMap) {
    arr = arr || [];
    checkDups = checkDups === false ? checkDups : true;
    hashMap = hashMap === true ? hashMap : false;
    if (!hashMap && arr.length <= types.ARRAY_MAP_THRESHOLD * 2) {
      if (checkDups) {
        var t = arr;
        arr = [];
        for (var i = 0; i < t.length; i += 2) {
          var seen = false;
          for (var j = 0; j < arr.length; j += 2) {
            if (eq.equals(arr[j], t[i])) {
              arr[j + 1] = t[i + 1];
              seen = true;
              break;
            }
          }
          if (!seen) {
            arr.push(t[i]);
            arr.push(t[i + 1]);
          }
        }
      }
      return new types.TransitArrayMap(arr);
    } else {
      var map = {}, keys = [], size = 0;
      for (var i = 0; i < arr.length; i += 2) {
        var code = eq.hashCode(arr[i]), bucket = map[code];
        if (bucket == null) {
          keys.push(code);
          map[code] = [arr[i], arr[i + 1]];
          size++;
        } else {
          var newEntry = true;
          for (var j = 0; j < bucket.length; j += 2) {
            if (eq.equals(bucket[j], arr[i])) {
              bucket[j + 1] = arr[i + 1];
              newEntry = false;
              break;
            }
          }
          if (newEntry) {
            bucket.push(arr[i]);
            bucket.push(arr[i + 1]);
            size++;
          }
        }
      }
      return new types.TransitMap(keys, map, size);
    }
  };
  types.isArrayMap = function(x) {
    return x instanceof types.TransitArrayMap;
  };
  types.isMap = function(x) {
    return x instanceof types.TransitArrayMap || x instanceof types.TransitMap;
  };
  types.TransitSet = function Transit$Set(map) {
    this.map = map;
    this.size = map.size;
  };
  types.TransitSet.prototype.toString = function() {
    return types.printSet(this);
  };
  types.TransitSet.prototype["inspect"] = function() {
    return this.toString();
  };
  types.TransitSet.prototype.add = function(value) {
    this.map.set(value, value);
    this.size = this.map.size;
  };
  types.TransitSet.prototype["add"] = types.TransitSet.prototype.add;
  types.TransitSet.prototype.clear = function() {
    this.map = new types.TransitMap();
    this.size = 0;
  };
  types.TransitSet.prototype["clear"] = types.TransitSet.prototype.clear;
  types.TransitSet.prototype["delete"] = function(value) {
    var ret = this.map.delete(value);
    this.size = this.map.size;
    return ret;
  };
  types.TransitSet.prototype.entries = function() {
    return this.map.entries();
  };
  types.TransitSet.prototype["entries"] = types.TransitSet.prototype.entries;
  types.TransitSet.prototype.forEach = function(iterator, thisArg) {
    var self = this;
    this.map.forEach(function(v, k, m) {
      iterator(k, self);
    });
  };
  types.TransitSet.prototype["forEach"] = types.TransitSet.prototype.forEach;
  types.TransitSet.prototype.has = function(value) {
    return this.map.has(value);
  };
  types.TransitSet.prototype["has"] = types.TransitSet.prototype.has;
  types.TransitSet.prototype.keys = function() {
    return this.map.keys();
  };
  types.TransitSet.prototype["keys"] = types.TransitSet.prototype.keys;
  types.TransitSet.prototype.keySet = function() {
    return this.map.keySet();
  };
  types.TransitSet.prototype["keySet"] = types.TransitSet.prototype.keySet;
  types.TransitSet.prototype.values = function() {
    return this.map.values();
  };
  types.TransitSet.prototype["values"] = types.TransitSet.prototype.values;
  types.TransitSet.prototype.clone = function() {
    var clone = types.set();
    this.forEach(function(k) {
      clone.add(k);
    });
    return clone;
  };
  types.TransitSet.prototype["clone"] = types.TransitSet.prototype.clone;
  types.TransitSet.prototype[types.ITERATOR] = function() {
    return this.values();
  };
  types.TransitSet.prototype.com$cognitect$transit$equals = function(other) {
    if (other instanceof types.TransitSet) {
      if (this.size === other.size) {
        return eq.equals(this.map, other.map);
      }
    } else {
      return false;
    }
  };
  types.TransitSet.prototype.com$cognitect$transit$hashCode = function(other) {
    return eq.hashCode(this.map);
  };
  types.set = function(arr) {
    arr = arr || [];
    var map = {}, keys = [], size = 0;
    for (var i = 0; i < arr.length; i++) {
      var code = eq.hashCode(arr[i]), vals = map[code];
      if (vals == null) {
        keys.push(code);
        map[code] = [arr[i], arr[i]];
        size++;
      } else {
        var newEntry = true;
        for (var j = 0; j < vals.length; j += 2) {
          if (eq.equals(vals[j], arr[i])) {
            newEntry = false;
            break;
          }
        }
        if (newEntry) {
          vals.push(arr[i]);
          vals.push(arr[i]);
          size++;
        }
      }
    }
    return new types.TransitSet(new types.TransitMap(keys, map, size));
  };
  types.isSet = function(x) {
    return x instanceof types.TransitSet;
  };
  types.quoted = function(obj) {
    return types.taggedValue("'", obj);
  };
  types.isQuoted = function(x) {
    return x instanceof types.TaggedValue && x.tag === "'";
  };
  types.list = function(xs) {
    return types.taggedValue("list", xs);
  };
  types.isList = function(x) {
    return x instanceof types.TaggedValue && x.tag === "list";
  };
  types.link = function(rep) {
    return types.taggedValue("link", rep);
  };
  types.isLink = function(x) {
    return x instanceof types.TaggedValue && x.tag === "link";
  };
  types.specialDouble = function(v) {
    switch(v) {
      case "-INF":
        return -Infinity;
      case "INF":
        return Infinity;
      case "NaN":
        return NaN;
      default:
        throw new Error("Invalid special double value " + v);
        break;
    }
  };
});

//# sourceMappingURL=com.cognitect.transit.types.js.map
