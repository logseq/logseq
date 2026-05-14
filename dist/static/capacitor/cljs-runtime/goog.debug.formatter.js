goog.provide("goog.debug.Formatter");
goog.provide("goog.debug.HtmlFormatter");
goog.provide("goog.debug.TextFormatter");
goog.provide("goog.debug.formatter");
goog.require("goog.debug");
goog.require("goog.debug.RelativeTimeProvider");
goog.require("goog.html.SafeHtml");
goog.require("goog.html.SafeUrl");
goog.require("goog.html.uncheckedconversions");
goog.require("goog.log");
goog.require("goog.string.Const");
goog.requireType("goog.log.LogRecord");
goog.debug.formatter.Formatter = function(opt_prefix) {
  this.prefix_ = opt_prefix || "";
  this.startTimeProvider_ = goog.debug.RelativeTimeProvider.getDefaultInstance();
};
goog.debug.formatter.Formatter.prototype.appendNewline = true;
goog.debug.formatter.Formatter.prototype.showAbsoluteTime = true;
goog.debug.formatter.Formatter.prototype.showRelativeTime = true;
goog.debug.formatter.Formatter.prototype.showLoggerName = true;
goog.debug.formatter.Formatter.prototype.showExceptionText = false;
goog.debug.formatter.Formatter.prototype.showSeverityLevel = false;
goog.debug.formatter.Formatter.prototype.formatRecord = goog.abstractMethod;
goog.debug.formatter.Formatter.prototype.formatRecordAsHtml = goog.abstractMethod;
goog.debug.formatter.Formatter.prototype.setStartTimeProvider = function(provider) {
  this.startTimeProvider_ = provider;
};
goog.debug.formatter.Formatter.prototype.getStartTimeProvider = function() {
  return this.startTimeProvider_;
};
goog.debug.formatter.Formatter.prototype.resetRelativeTimeStart = function() {
  this.startTimeProvider_.reset();
};
goog.debug.formatter.Formatter.getDateTimeStamp_ = function(logRecord) {
  var time = new Date(logRecord.getMillis());
  return goog.debug.formatter.Formatter.getTwoDigitString_(time.getFullYear() - 2000) + goog.debug.formatter.Formatter.getTwoDigitString_(time.getMonth() + 1) + goog.debug.formatter.Formatter.getTwoDigitString_(time.getDate()) + " " + goog.debug.formatter.Formatter.getTwoDigitString_(time.getHours()) + ":" + goog.debug.formatter.Formatter.getTwoDigitString_(time.getMinutes()) + ":" + goog.debug.formatter.Formatter.getTwoDigitString_(time.getSeconds()) + "." + goog.debug.formatter.Formatter.getTwoDigitString_(Math.floor(time.getMilliseconds() / 
  10));
};
goog.debug.formatter.Formatter.getTwoDigitString_ = function(n) {
  if (n < 10) {
    return "0" + n;
  }
  return String(n);
};
goog.debug.formatter.Formatter.getRelativeTime_ = function(logRecord, relativeTimeStart) {
  var ms = logRecord.getMillis() - relativeTimeStart;
  var sec = ms / 1000;
  var str = sec.toFixed(3);
  var spacesToPrepend = 0;
  if (sec < 1) {
    spacesToPrepend = 2;
  } else {
    while (sec < 100) {
      spacesToPrepend++;
      sec *= 10;
    }
  }
  while (spacesToPrepend-- > 0) {
    str = " " + str;
  }
  return str;
};
goog.debug.formatter.HtmlFormatter = function(opt_prefix) {
  goog.debug.formatter.Formatter.call(this, opt_prefix);
};
goog.inherits(goog.debug.formatter.HtmlFormatter, goog.debug.formatter.Formatter);
goog.debug.formatter.HtmlFormatter.exposeException = function(err, fn) {
  var html = goog.debug.formatter.HtmlFormatter.exposeExceptionAsHtml(err, fn);
  return goog.html.SafeHtml.unwrap(html);
};
goog.debug.formatter.HtmlFormatter.exposeExceptionAsHtml = function(err, fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var viewSourceUrl = goog.debug.formatter.HtmlFormatter.createViewSourceUrl_(e.fileName);
    var error = goog.html.SafeHtml.concat(goog.html.SafeHtml.htmlEscapePreservingNewlinesAndSpaces("Message: " + e.message + "\nUrl: "), goog.html.SafeHtml.create("a", {href:viewSourceUrl, target:"_new"}, e.fileName), goog.html.SafeHtml.htmlEscapePreservingNewlinesAndSpaces("\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + e.stack + "-\x3e " + "[end]\n\nJS stack traversal:\n" + goog.debug.getStacktrace(fn) + "-\x3e "));
    return error;
  } catch (e2) {
    return goog.html.SafeHtml.htmlEscapePreservingNewlinesAndSpaces("Exception trying to expose exception! You win, we lose. " + e2);
  }
};
goog.debug.formatter.HtmlFormatter.createViewSourceUrl_ = function(fileName) {
  if (fileName == null) {
    fileName = "";
  }
  if (!/^https?:\/\//i.test(fileName)) {
    return goog.html.SafeUrl.fromConstant(goog.string.Const.from("sanitizedviewsrc"));
  }
  var sanitizedFileName = goog.html.SafeUrl.sanitize(fileName);
  return goog.html.uncheckedconversions.safeUrlFromStringKnownToSatisfyTypeContract(goog.string.Const.from("view-source scheme plus HTTP/HTTPS URL"), "view-source:" + goog.html.SafeUrl.unwrap(sanitizedFileName));
};
goog.debug.formatter.HtmlFormatter.prototype.showExceptionText = true;
goog.debug.formatter.HtmlFormatter.prototype.formatRecord = function(logRecord) {
  if (!logRecord) {
    return "";
  }
  return this.formatRecordAsHtml(logRecord).getTypedStringValue();
};
goog.debug.formatter.HtmlFormatter.prototype.formatRecordAsHtml = function(logRecord) {
  if (!logRecord) {
    return goog.html.SafeHtml.EMPTY;
  }
  var className;
  switch(logRecord.getLevel().value) {
    case goog.log.Level.SHOUT.value:
      className = "dbg-sh";
      break;
    case goog.log.Level.SEVERE.value:
      className = "dbg-sev";
      break;
    case goog.log.Level.WARNING.value:
      className = "dbg-w";
      break;
    case goog.log.Level.INFO.value:
      className = "dbg-i";
      break;
    case goog.log.Level.FINE.value:
    default:
      className = "dbg-f";
      break;
  }
  var sb = [];
  sb.push(this.prefix_, " ");
  if (this.showAbsoluteTime) {
    sb.push("[", goog.debug.formatter.Formatter.getDateTimeStamp_(logRecord), "] ");
  }
  if (this.showRelativeTime) {
    sb.push("[", goog.debug.formatter.Formatter.getRelativeTime_(logRecord, this.startTimeProvider_.get()), "s] ");
  }
  if (this.showLoggerName) {
    sb.push("[", logRecord.getLoggerName(), "] ");
  }
  if (this.showSeverityLevel) {
    sb.push("[", logRecord.getLevel().name, "] ");
  }
  var fullPrefixHtml = goog.html.SafeHtml.htmlEscapePreservingNewlinesAndSpaces(sb.join(""));
  var exceptionHtml = goog.html.SafeHtml.EMPTY;
  if (this.showExceptionText && logRecord.getException()) {
    exceptionHtml = goog.html.SafeHtml.concat(goog.html.SafeHtml.BR, goog.debug.formatter.HtmlFormatter.exposeExceptionAsHtml(logRecord.getException()));
  }
  var logRecordHtml = goog.html.SafeHtml.htmlEscapePreservingNewlinesAndSpaces(logRecord.getMessage());
  var recordAndExceptionHtml = goog.html.SafeHtml.create("span", {"class":className}, goog.html.SafeHtml.concat(logRecordHtml, exceptionHtml));
  var html;
  if (this.appendNewline) {
    html = goog.html.SafeHtml.concat(fullPrefixHtml, recordAndExceptionHtml, goog.html.SafeHtml.BR);
  } else {
    html = goog.html.SafeHtml.concat(fullPrefixHtml, recordAndExceptionHtml);
  }
  return html;
};
goog.debug.formatter.TextFormatter = function(opt_prefix) {
  goog.debug.formatter.Formatter.call(this, opt_prefix);
};
goog.inherits(goog.debug.formatter.TextFormatter, goog.debug.formatter.Formatter);
goog.debug.formatter.TextFormatter.prototype.formatRecord = function(logRecord) {
  var sb = [];
  sb.push(this.prefix_, " ");
  if (this.showAbsoluteTime) {
    sb.push("[", goog.debug.formatter.Formatter.getDateTimeStamp_(logRecord), "] ");
  }
  if (this.showRelativeTime) {
    sb.push("[", goog.debug.formatter.Formatter.getRelativeTime_(logRecord, this.startTimeProvider_.get()), "s] ");
  }
  if (this.showLoggerName) {
    sb.push("[", logRecord.getLoggerName(), "] ");
  }
  if (this.showSeverityLevel) {
    sb.push("[", logRecord.getLevel().name, "] ");
  }
  sb.push(logRecord.getMessage());
  if (this.showExceptionText) {
    var exception = logRecord.getException();
    if (exception !== undefined) {
      var exceptionText = exception instanceof Error ? exception.message : String(exception);
      sb.push("\n", exceptionText);
    }
  }
  if (this.appendNewline) {
    sb.push("\n");
  }
  return sb.join("");
};
goog.debug.formatter.TextFormatter.prototype.formatRecordAsHtml = function(logRecord) {
  return goog.html.SafeHtml.htmlEscapePreservingNewlinesAndSpaces(goog.debug.formatter.TextFormatter.prototype.formatRecord(logRecord));
};
goog.debug.Formatter = goog.debug.formatter.Formatter;
goog.debug.TextFormatter = goog.debug.formatter.TextFormatter;
goog.debug.HtmlFormatter = goog.debug.formatter.HtmlFormatter;

//# sourceMappingURL=goog.debug.formatter.js.map
