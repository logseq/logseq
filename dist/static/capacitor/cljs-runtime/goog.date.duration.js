goog.provide("goog.date.duration");
goog.require("goog.i18n.DateTimeFormat");
goog.require("goog.i18n.MessageFormat");
goog.date.duration.MINUTE_MS_ = 60000;
goog.date.duration.HOUR_MS_ = 3600000;
goog.date.duration.DAY_MS_ = 86400000;
goog.date.duration.format = function(durationMs) {
  var ms = Math.abs(durationMs);
  if (ms < goog.date.duration.MINUTE_MS_) {
    var MSG_ZERO_MINUTES = goog.getMsg("0 minutes");
    return MSG_ZERO_MINUTES;
  }
  var days = Math.floor(ms / goog.date.duration.DAY_MS_);
  ms %= goog.date.duration.DAY_MS_;
  var hours = Math.floor(ms / goog.date.duration.HOUR_MS_);
  ms %= goog.date.duration.HOUR_MS_;
  var minutes = Math.floor(ms / goog.date.duration.MINUTE_MS_);
  var daysText = goog.i18n.DateTimeFormat.localizeNumbers(days);
  var hoursText = goog.i18n.DateTimeFormat.localizeNumbers(hours);
  var minutesText = goog.i18n.DateTimeFormat.localizeNumbers(minutes);
  var daysSeparator = days * (hours + minutes) ? " " : "";
  var hoursSeparator = hours * minutes ? " " : "";
  var MSG_DURATION_DAYS = goog.getMsg("{COUNT, plural, " + "\x3d0 {}" + "\x3d1 {{TEXT} day}" + "other {{TEXT} days}}");
  var MSG_DURATION_HOURS = goog.getMsg("{COUNT, plural, " + "\x3d0 {}" + "\x3d1 {{TEXT} hour}" + "other {{TEXT} hours}}");
  var MSG_DURATION_MINUTES = goog.getMsg("{COUNT, plural, " + "\x3d0 {}" + "\x3d1 {{TEXT} minute}" + "other {{TEXT} minutes}}");
  var daysPart = goog.date.duration.getDurationMessagePart_(MSG_DURATION_DAYS, days, daysText);
  var hoursPart = goog.date.duration.getDurationMessagePart_(MSG_DURATION_HOURS, hours, hoursText);
  var minutesPart = goog.date.duration.getDurationMessagePart_(MSG_DURATION_MINUTES, minutes, minutesText);
  var MSG_CONCATENATED_DURATION_TEXT = goog.getMsg("{$daysPart}{$daysSeparator}{$hoursPart}{$hoursSeparator}{$minutesPart}", {"daysPart":daysPart, "daysSeparator":daysSeparator, "hoursPart":hoursPart, "hoursSeparator":hoursSeparator, "minutesPart":minutesPart});
  return MSG_CONCATENATED_DURATION_TEXT;
};
goog.date.duration.getDurationMessagePart_ = function(pattern, count, text) {
  var formatter = new goog.i18n.MessageFormat(pattern);
  return formatter.format({"COUNT":count, "TEXT":text});
};

//# sourceMappingURL=goog.date.duration.js.map
