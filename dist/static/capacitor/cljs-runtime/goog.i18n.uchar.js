goog.provide("goog.i18n.uChar");
goog.i18n.uChar.SUPPLEMENTARY_CODE_POINT_MIN_VALUE_ = 65536;
goog.i18n.uChar.CODE_POINT_MAX_VALUE_ = 1114111;
goog.i18n.uChar.LEAD_SURROGATE_MIN_VALUE_ = 55296;
goog.i18n.uChar.LEAD_SURROGATE_MAX_VALUE_ = 56319;
goog.i18n.uChar.TRAIL_SURROGATE_MIN_VALUE_ = 56320;
goog.i18n.uChar.TRAIL_SURROGATE_MAX_VALUE_ = 57343;
goog.i18n.uChar.TRAIL_SURROGATE_BIT_COUNT_ = 10;
goog.i18n.uChar.toHexString = function(ch) {
  const chCode = goog.i18n.uChar.toCharCode(ch);
  const chCodeStr = "U+" + goog.i18n.uChar.padString_(chCode.toString(16).toUpperCase(), 4, "0");
  return chCodeStr;
};
goog.i18n.uChar.padString_ = function(str, length, ch) {
  while (str.length < length) {
    str = ch + str;
  }
  return str;
};
goog.i18n.uChar.toCharCode = function(ch) {
  return goog.i18n.uChar.getCodePointAround(ch, 0);
};
goog.i18n.uChar.fromCharCode = function(code) {
  if (code == null || !(code >= 0 && code <= goog.i18n.uChar.CODE_POINT_MAX_VALUE_)) {
    return null;
  }
  if (goog.i18n.uChar.isSupplementaryCodePoint(code)) {
    const leadBits = code >> goog.i18n.uChar.TRAIL_SURROGATE_BIT_COUNT_;
    const trailBits = code & (1 << goog.i18n.uChar.TRAIL_SURROGATE_BIT_COUNT_) - 1;
    const leadCodePoint = leadBits + (goog.i18n.uChar.LEAD_SURROGATE_MIN_VALUE_ - (goog.i18n.uChar.SUPPLEMENTARY_CODE_POINT_MIN_VALUE_ >> goog.i18n.uChar.TRAIL_SURROGATE_BIT_COUNT_));
    const trailCodePoint = trailBits + goog.i18n.uChar.TRAIL_SURROGATE_MIN_VALUE_;
    return String.fromCharCode(leadCodePoint) + String.fromCharCode(trailCodePoint);
  }
  return String.fromCharCode(code);
};
goog.i18n.uChar.getCodePointAround = function(string, index) {
  const charCode = string.charCodeAt(index);
  if (goog.i18n.uChar.isLeadSurrogateCodePoint(charCode) && index + 1 < string.length) {
    const trail = string.charCodeAt(index + 1);
    if (goog.i18n.uChar.isTrailSurrogateCodePoint(trail)) {
      return goog.i18n.uChar.buildSupplementaryCodePoint(charCode, trail);
    }
  } else if (goog.i18n.uChar.isTrailSurrogateCodePoint(charCode) && index > 0) {
    const lead = string.charCodeAt(index - 1);
    if (goog.i18n.uChar.isLeadSurrogateCodePoint(lead)) {
      const codepoint = goog.i18n.uChar.buildSupplementaryCodePoint(lead, charCode);
      return -codepoint;
    }
  }
  return charCode;
};
goog.i18n.uChar.charCount = function(codePoint) {
  return goog.i18n.uChar.isSupplementaryCodePoint(codePoint) ? 2 : 1;
};
goog.i18n.uChar.isSupplementaryCodePoint = function(codePoint) {
  return codePoint >= goog.i18n.uChar.SUPPLEMENTARY_CODE_POINT_MIN_VALUE_ && codePoint <= goog.i18n.uChar.CODE_POINT_MAX_VALUE_;
};
goog.i18n.uChar.isLeadSurrogateCodePoint = function(codePoint) {
  return codePoint >= goog.i18n.uChar.LEAD_SURROGATE_MIN_VALUE_ && codePoint <= goog.i18n.uChar.LEAD_SURROGATE_MAX_VALUE_;
};
goog.i18n.uChar.isTrailSurrogateCodePoint = function(codePoint) {
  return codePoint >= goog.i18n.uChar.TRAIL_SURROGATE_MIN_VALUE_ && codePoint <= goog.i18n.uChar.TRAIL_SURROGATE_MAX_VALUE_;
};
goog.i18n.uChar.buildSupplementaryCodePoint = function(lead, trail) {
  if (goog.i18n.uChar.isLeadSurrogateCodePoint(lead) && goog.i18n.uChar.isTrailSurrogateCodePoint(trail)) {
    const shiftedLeadOffset = (lead << goog.i18n.uChar.TRAIL_SURROGATE_BIT_COUNT_) - (goog.i18n.uChar.LEAD_SURROGATE_MIN_VALUE_ << goog.i18n.uChar.TRAIL_SURROGATE_BIT_COUNT_);
    const trailOffset = trail - goog.i18n.uChar.TRAIL_SURROGATE_MIN_VALUE_ + goog.i18n.uChar.SUPPLEMENTARY_CODE_POINT_MIN_VALUE_;
    return shiftedLeadOffset + trailOffset;
  }
  return null;
};

//# sourceMappingURL=goog.i18n.uchar.js.map
