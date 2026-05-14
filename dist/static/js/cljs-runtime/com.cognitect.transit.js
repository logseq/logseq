goog.provide("com.cognitect.transit");
goog.require("com.cognitect.transit.util");
goog.require("com.cognitect.transit.impl.reader");
goog.require("com.cognitect.transit.impl.writer");
goog.require("com.cognitect.transit.types");
goog.require("com.cognitect.transit.eq");
goog.require("com.cognitect.transit.impl.decoder");
goog.require("com.cognitect.transit.caching");
var TRANSIT_DEV = true;
var TRANSIT_NODE_TARGET = false;
var TRANSIT_BROWSER_TARGET = false;
var TRANSIT_BROWSER_AMD_TARGET = false;
goog.scope(function() {
  var transit = com.cognitect.transit;
  var util = com.cognitect.transit.util, reader = com.cognitect.transit.impl.reader, writer = com.cognitect.transit.impl.writer, decoder = com.cognitect.transit.impl.decoder, types = com.cognitect.transit.types, eq = com.cognitect.transit.eq, caching = com.cognitect.transit.caching;
  transit.MapLike;
  transit.SetLike;
  transit.reader = function(type, opts) {
    if (type === "json" || type === "json-verbose" || type == null) {
      type = "json";
      var unmarshaller = new reader.JSONUnmarshaller(opts);
      return new reader.Reader(unmarshaller, opts);
    } else {
      throw new Error("Cannot create reader of type " + type);
    }
  };
  transit.writer = function(type, opts) {
    if (type === "json" || type === "json-verbose" || type == null) {
      if (type === "json-verbose") {
        if (opts == null) {
          opts = {};
        }
        opts["verbose"] = true;
      }
      var marshaller = new writer.JSONMarshaller(opts);
      return new writer.Writer(marshaller, opts);
    } else {
      var err = new Error('Type must be "json"');
      err.data = {type:type};
      throw err;
    }
  };
  transit.makeWriteHandler = function(obj) {
    var Handler = function() {
    };
    Handler.prototype.tag = obj["tag"];
    Handler.prototype.rep = obj["rep"];
    Handler.prototype.stringRep = obj["stringRep"];
    Handler.prototype.getVerboseHandler = obj["getVerboseHandler"];
    return new Handler();
  };
  transit.makeBuilder = function(obj) {
    var Builder = function() {
    };
    Builder.prototype.init = obj["init"];
    Builder.prototype.add = obj["add"];
    Builder.prototype.finalize = obj["finalize"];
    Builder.prototype.fromArray = obj["fromArray"];
    return new Builder();
  };
  transit.date = types.date;
  transit.integer = types.intValue;
  transit.isInteger = types.isInteger;
  transit.uuid = types.uuid;
  transit.isUUID = types.isUUID;
  transit.bigInt = types.bigInteger;
  transit.isBigInt = types.isBigInteger;
  transit.bigDec = types.bigDecimalValue;
  transit.isBigDec = types.isBigDecimal;
  transit.keyword = types.keyword;
  transit.isKeyword = types.isKeyword;
  transit.symbol = types.symbol;
  transit.isSymbol = types.isSymbol;
  transit.binary = types.binary;
  transit.isBinary = types.isBinary;
  transit.uri = types.uri;
  transit.isURI = types.isURI;
  transit.map = types.map;
  transit.isMap = types.isMap;
  transit.set = types.set;
  transit.isSet = types.isSet;
  transit.list = types.list;
  transit.isList = types.isList;
  transit.quoted = types.quoted;
  transit.isQuoted = types.isQuoted;
  transit.tagged = types.taggedValue;
  transit.isTaggedValue = types.isTaggedValue;
  transit.link = types.link;
  transit.isLink = types.isLink;
  transit.hash = eq.hashCode;
  transit.hashMapLike = eq.hashMapLike;
  transit.hashArrayLike = eq.hashArrayLike;
  transit.equals = eq.equals;
  transit.extendToEQ = eq.extendToEQ;
  transit.mapToObject = function(m) {
    var ret = {};
    m.forEach(function(v, k) {
      if (typeof k !== "string") {
        throw Error("Cannot convert map with non-string keys");
      } else {
        ret[k] = v;
      }
    });
    return ret;
  };
  transit.objectToMap = function(obj) {
    var ret = transit.map();
    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        ret.set(p, obj[p]);
      }
    }
    return ret;
  };
  transit.decoder = decoder.decoder;
  transit.readCache = caching.readCache;
  transit.writeCache = caching.writeCache;
  transit.UUIDfromString = types.UUIDfromString;
  transit.randomUUID = util.randomUUID;
  transit.stringableKeys = writer.stringableKeys;
  if (TRANSIT_BROWSER_TARGET) {
    goog.exportSymbol("transit.reader", transit.reader);
    goog.exportSymbol("transit.writer", transit.writer);
    goog.exportSymbol("transit.makeBuilder", transit.makeBuilder);
    goog.exportSymbol("transit.makeWriteHandler", transit.makeWriteHandler);
    goog.exportSymbol("transit.date", types.date);
    goog.exportSymbol("transit.integer", types.intValue);
    goog.exportSymbol("transit.isInteger", types.isInteger);
    goog.exportSymbol("transit.uuid", types.uuid);
    goog.exportSymbol("transit.isUUID", types.isUUID);
    goog.exportSymbol("transit.bigInt", types.bigInteger);
    goog.exportSymbol("transit.isBigInt", types.isBigInteger);
    goog.exportSymbol("transit.bigDec", types.bigDecimalValue);
    goog.exportSymbol("transit.isBigDec", types.isBigDecimal);
    goog.exportSymbol("transit.keyword", types.keyword);
    goog.exportSymbol("transit.isKeyword", types.isKeyword);
    goog.exportSymbol("transit.symbol", types.symbol);
    goog.exportSymbol("transit.isSymbol", types.isSymbol);
    goog.exportSymbol("transit.binary", types.binary);
    goog.exportSymbol("transit.isBinary", types.isBinary);
    goog.exportSymbol("transit.uri", types.uri);
    goog.exportSymbol("transit.isURI", types.isURI);
    goog.exportSymbol("transit.map", types.map);
    goog.exportSymbol("transit.isMap", types.isMap);
    goog.exportSymbol("transit.set", types.set);
    goog.exportSymbol("transit.isSet", types.isSet);
    goog.exportSymbol("transit.list", types.list);
    goog.exportSymbol("transit.isList", types.isList);
    goog.exportSymbol("transit.quoted", types.quoted);
    goog.exportSymbol("transit.isQuoted", types.isQuoted);
    goog.exportSymbol("transit.tagged", types.taggedValue);
    goog.exportSymbol("transit.isTaggedValue", types.isTaggedValue);
    goog.exportSymbol("transit.link", types.link);
    goog.exportSymbol("transit.isLink", types.isLink);
    goog.exportSymbol("transit.hash", eq.hashCode);
    goog.exportSymbol("transit.hashMapLike", eq.hashMapLike);
    goog.exportSymbol("transit.hashArrayLike", eq.hashArrayLike);
    goog.exportSymbol("transit.equals", eq.equals);
    goog.exportSymbol("transit.extendToEQ", eq.extendToEQ);
    goog.exportSymbol("transit.mapToObject", transit.mapToObject);
    goog.exportSymbol("transit.objectToMap", transit.objectToMap);
    goog.exportSymbol("transit.decoder", decoder.decoder);
    goog.exportSymbol("transit.UUIDfromString", types.UUIDfromString);
    goog.exportSymbol("transit.randomUUID", util.randomUUID);
    goog.exportSymbol("transit.stringableKeys", writer.stringableKeys);
    goog.exportSymbol("transit.readCache", caching.readCache);
    goog.exportSymbol("transit.writeCache", caching.writeCache);
  }
  if (TRANSIT_NODE_TARGET) {
    module.exports = {reader:transit.reader, writer:transit.writer, makeBuilder:transit.makeBuilder, makeWriteHandler:transit.makeWriteHandler, date:types.date, integer:types.intValue, isInteger:types.isInteger, uuid:types.uuid, isUUID:types.isUUID, bigInt:types.bigInteger, isBigInt:types.isBigInteger, bigDec:types.bigDecimalValue, isBigDec:types.isBigDecimal, keyword:types.keyword, isKeyword:types.isKeyword, symbol:types.symbol, isSymbol:types.isSymbol, binary:types.binary, isBinary:types.isBinary, 
    uri:types.uri, isURI:types.isURI, map:types.map, isMap:types.isMap, set:types.set, isSet:types.isSet, list:types.list, isList:types.isList, quoted:types.quoted, isQuoted:types.isQuoted, tagged:types.taggedValue, isTaggedValue:types.isTaggedValue, link:types.link, isLink:types.isLink, hash:eq.hashCode, hashArrayLike:eq.hashArrayLike, hashMapLike:eq.hashMapLike, equals:eq.equals, extendToEQ:eq.extendToEQ, mapToObject:transit.mapToObject, objectToMap:transit.objectToMap, decoder:decoder.decoder, 
    UUIDfromString:types.UUIDfromString, randomUUID:util.randomUUID, stringableKeys:writer.stringableKeys, readCache:caching.readCache, writeCache:caching.writeCache};
  }
});

//# sourceMappingURL=com.cognitect.transit.js.map
