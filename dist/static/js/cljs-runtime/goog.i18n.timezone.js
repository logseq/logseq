goog.provide("goog.i18n.TimeZone");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string");
goog.requireType("goog.date.DateLike");
goog.i18n.TimeZone = function() {
  this.timeZoneId_;
  this.standardOffset_;
  this.tzNames_;
  this.tzNamesExt_;
  this.transitions_;
};
goog.i18n.TimeZone.MILLISECONDS_PER_HOUR_ = 3600 * 1000;
goog.i18n.TimeZone.NameType = {STD_SHORT_NAME:0, STD_LONG_NAME:1, DLT_SHORT_NAME:2, DLT_LONG_NAME:3};
goog.i18n.TimeZone.createTimeZone = function(timeZoneData) {
  if (typeof timeZoneData == "number") {
    return goog.i18n.TimeZone.createSimpleTimeZone_(timeZoneData);
  }
  var tz = new goog.i18n.TimeZone();
  tz.timeZoneId_ = timeZoneData["id"];
  tz.standardOffset_ = -timeZoneData["std_offset"];
  tz.tzNames_ = timeZoneData["names"];
  tz.tzNamesExt_ = timeZoneData["names_ext"];
  tz.transitions_ = timeZoneData["transitions"];
  return tz;
};
goog.i18n.TimeZone.createSimpleTimeZone_ = function(timeZoneOffsetInMinutes) {
  var tz = new goog.i18n.TimeZone();
  tz.standardOffset_ = timeZoneOffsetInMinutes;
  tz.timeZoneId_ = goog.i18n.TimeZone.composePosixTimeZoneID_(timeZoneOffsetInMinutes);
  var str = goog.i18n.TimeZone.composeUTCString_(timeZoneOffsetInMinutes);
  var strGMT = goog.i18n.TimeZone.composeGMTString_(timeZoneOffsetInMinutes);
  tz.tzNames_ = [str, str];
  tz.tzNamesExt_ = {STD_LONG_NAME_GMT:strGMT, STD_GENERIC_LOCATION:strGMT};
  tz.transitions_ = [];
  return tz;
};
goog.i18n.TimeZone.composeGMTString_ = function(offset) {
  var parts = ["GMT"];
  parts.push(offset <= 0 ? "+" : "-");
  offset = Math.abs(offset);
  parts.push(goog.string.padNumber(Math.floor(offset / 60) % 100, 2), ":", goog.string.padNumber(offset % 60, 2));
  return parts.join("");
};
goog.i18n.TimeZone.composePosixTimeZoneID_ = function(offset) {
  if (offset == 0) {
    return "Etc/GMT";
  }
  var parts = ["Etc/GMT", offset < 0 ? "-" : "+"];
  offset = Math.abs(offset);
  parts.push(Math.floor(offset / 60) % 100);
  offset = offset % 60;
  if (offset != 0) {
    parts.push(":", goog.string.padNumber(offset, 2));
  }
  return parts.join("");
};
goog.i18n.TimeZone.composeUTCString_ = function(offset) {
  if (offset == 0) {
    return "UTC";
  }
  var parts = ["UTC", offset < 0 ? "+" : "-"];
  offset = Math.abs(offset);
  parts.push(Math.floor(offset / 60) % 100);
  offset = offset % 60;
  if (offset != 0) {
    parts.push(":", offset);
  }
  return parts.join("");
};
goog.i18n.TimeZone.prototype.getTimeZoneData = function() {
  return {"id":this.timeZoneId_, "std_offset":-this.standardOffset_, "names":goog.array.clone(this.tzNames_), "names_ext":goog.object.clone(this.tzNamesExt_), "transitions":goog.array.clone(this.transitions_)};
};
goog.i18n.TimeZone.prototype.getDaylightAdjustment = function(date) {
  var timeInMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes());
  var timeInHours = timeInMs / goog.i18n.TimeZone.MILLISECONDS_PER_HOUR_;
  var index = 0;
  while (index < this.transitions_.length && timeInHours >= this.transitions_[index]) {
    index += 2;
  }
  return index == 0 ? 0 : this.transitions_[index - 1];
};
goog.i18n.TimeZone.prototype.getGMTString = function(date) {
  return goog.i18n.TimeZone.composeGMTString_(this.getOffset(date));
};
goog.i18n.TimeZone.prototype.getUTCString = function(date) {
  return goog.i18n.TimeZone.composeUTCString_(this.getOffset(date));
};
goog.i18n.TimeZone.prototype.getLongName = function(date) {
  return this.tzNames_[this.isDaylightTime(date) ? goog.i18n.TimeZone.NameType.DLT_LONG_NAME : goog.i18n.TimeZone.NameType.STD_LONG_NAME];
};
goog.i18n.TimeZone.prototype.getOffset = function(date) {
  const offset = this.standardOffset_ - this.getDaylightAdjustment(date);
  if (offset === -1440) {
    return 0;
  }
  return offset;
};
goog.i18n.TimeZone.prototype.getRFCTimeZoneString = function(date) {
  var offset = -this.getOffset(date);
  var parts = [offset < 0 ? "-" : "+"];
  offset = Math.abs(offset);
  parts.push(goog.string.padNumber(Math.floor(offset / 60) % 100, 2), goog.string.padNumber(offset % 60, 2));
  return parts.join("");
};
goog.i18n.TimeZone.prototype.getShortName = function(date) {
  return this.tzNames_[this.isDaylightTime(date) ? goog.i18n.TimeZone.NameType.DLT_SHORT_NAME : goog.i18n.TimeZone.NameType.STD_SHORT_NAME];
};
goog.i18n.TimeZone.prototype.getTimeZoneId = function() {
  return this.timeZoneId_;
};
goog.i18n.TimeZone.prototype.isDaylightTime = function(date) {
  return this.getDaylightAdjustment(date) > 0;
};
goog.i18n.TimeZone.prototype.getLongNameGMT = function(date) {
  if (this.isDaylightTime(date)) {
    return this.tzNamesExt_.DST_LONG_NAME_GMT !== undefined ? this.tzNamesExt_.DST_LONG_NAME_GMT : this.tzNamesExt_["DST_LONG_NAME_GMT"];
  } else {
    return this.tzNamesExt_.STD_LONG_NAME_GMT !== undefined ? this.tzNamesExt_.STD_LONG_NAME_GMT : this.tzNamesExt_["STD_LONG_NAME_GMT"];
  }
};
goog.i18n.TimeZone.prototype.getGenericLocation = function(date) {
  if (this.isDaylightTime(date)) {
    return this.tzNamesExt_.DST_GENERIC_LOCATION !== undefined ? this.tzNamesExt_.DST_GENERIC_LOCATION : this.tzNamesExt_["DST_GENERIC_LOCATION"];
  } else {
    return this.tzNamesExt_.STD_GENERIC_LOCATION !== undefined ? this.tzNamesExt_.STD_GENERIC_LOCATION : this.tzNamesExt_["STD_GENERIC_LOCATION"];
  }
};

//# sourceMappingURL=goog.i18n.timezone.js.map
