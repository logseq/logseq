goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  const args = Array.prototype.slice.call(arguments);
  const template = args.shift();
  if (typeof template == "undefined") {
    throw new Error("[goog.string.format] Template required");
  }
  const formatRe = /%([0\- \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if (type == "%") {
      return "%";
    }
    const value = args.shift();
    if (typeof value == "undefined") {
      throw new Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments);
  }
  return template.replace(formatRe, replacerDemuxer);
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  let replacement = value;
  if (isNaN(width) || width == "" || replacement.length >= Number(width)) {
    return replacement;
  }
  if (flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", Number(width) - replacement.length);
  } else {
    replacement = goog.string.repeat(" ", Number(width) - replacement.length) + replacement;
  }
  return replacement;
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  let replacement = value.toString();
  if (!(isNaN(precision) || precision == "")) {
    replacement = parseFloat(value).toFixed(precision);
  }
  let sign;
  if (Number(value) < 0) {
    sign = "-";
  } else if (flags.indexOf("+") >= 0) {
    sign = "+";
  } else if (flags.indexOf(" ") >= 0) {
    sign = " ";
  } else {
    sign = "";
  }
  if (Number(value) >= 0) {
    replacement = sign + replacement;
  }
  if (isNaN(width) || replacement.length >= Number(width)) {
    return replacement;
  }
  replacement = isNaN(precision) ? Math.abs(Number(value)).toString() : Math.abs(Number(value)).toFixed(precision);
  const padCount = Number(width) - replacement.length - sign.length;
  if (flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount);
  } else {
    const paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement;
  }
  return replacement;
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString);
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];

//# sourceMappingURL=goog.string.stringformat.js.map
