goog.provide("com.cognitect.transit.impl.reader");
goog.require("com.cognitect.transit.impl.decoder");
goog.require("com.cognitect.transit.caching");
goog.scope(function() {
  var reader = com.cognitect.transit.impl.reader, decoder = com.cognitect.transit.impl.decoder, caching = com.cognitect.transit.caching;
  reader.JSONUnmarshaller = function Transit$JSONUnmarshaller(opts) {
    this.decoder = new decoder.Decoder(opts);
  };
  reader.JSONUnmarshaller.prototype.unmarshal = function(str, cache) {
    return this.decoder.decode(JSON.parse(str), cache);
  };
  reader.Reader = function Transit$Reader(unmarshaller, options) {
    this.unmarshaller = unmarshaller;
    this.options = options || {};
    this.cache = this.options["cache"] ? this.options["cache"] : new caching.ReadCache();
  };
  reader.Reader.prototype.read = function(str) {
    var ret = this.unmarshaller.unmarshal(str, this.cache);
    this.cache.clear();
    return ret;
  };
  reader.Reader.prototype["read"] = reader.Reader.prototype.read;
});

//# sourceMappingURL=com.cognitect.transit.impl.reader.js.map
