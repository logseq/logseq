goog.provide("goog.string.Const");
goog.require("goog.asserts");
goog.require("goog.string.TypedString");
goog.string.Const = function(opt_token, opt_content) {
  this.stringConstValueWithSecurityContract__googStringSecurityPrivate_ = opt_token === goog.string.Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_ && opt_content || "";
  this.STRING_CONST_TYPE_MARKER__GOOG_STRING_SECURITY_PRIVATE_ = goog.string.Const.TYPE_MARKER_;
};
goog.string.Const.prototype.implementsGoogStringTypedString = true;
goog.string.Const.prototype.getTypedStringValue = function() {
  return this.stringConstValueWithSecurityContract__googStringSecurityPrivate_;
};
if (goog.DEBUG) {
  goog.string.Const.prototype.toString = function() {
    return "Const{" + this.stringConstValueWithSecurityContract__googStringSecurityPrivate_ + "}";
  };
}
goog.string.Const.unwrap = function(stringConst) {
  if (stringConst instanceof goog.string.Const && stringConst.constructor === goog.string.Const && stringConst.STRING_CONST_TYPE_MARKER__GOOG_STRING_SECURITY_PRIVATE_ === goog.string.Const.TYPE_MARKER_) {
    return stringConst.stringConstValueWithSecurityContract__googStringSecurityPrivate_;
  } else {
    goog.asserts.fail("expected object of type Const, got '" + stringConst + "'");
    return "type_error:Const";
  }
};
goog.string.Const.from = function(s) {
  return new goog.string.Const(goog.string.Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_, s);
};
goog.string.Const.TYPE_MARKER_ = {};
goog.string.Const.GOOG_STRING_CONSTRUCTOR_TOKEN_PRIVATE_ = {};
goog.string.Const.EMPTY = goog.string.Const.from("");

//# sourceMappingURL=goog.string.const.js.map
