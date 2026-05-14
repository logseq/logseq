goog.provide("goog.debug.Console");
goog.require("goog.debug.TextFormatter");
goog.require("goog.log");
goog.requireType("goog.log.LogRecord");
goog.debug.Console = function() {
  this.publishHandler_ = goog.bind(this.addLogRecord, this);
  this.formatter_ = new goog.debug.TextFormatter();
  this.formatter_.showAbsoluteTime = false;
  this.formatter_.showExceptionText = false;
  this.formatter_.appendNewline = false;
  this.isCapturing_ = false;
  this.logBuffer_ = "";
  this.filteredLoggers_ = {};
};
goog.debug.Console.prototype.getFormatter = function() {
  return this.formatter_;
};
goog.debug.Console.prototype.setCapturing = function(capturing) {
  if (capturing == this.isCapturing_) {
    return;
  }
  var rootLogger = goog.log.getRootLogger();
  if (capturing) {
    goog.log.addHandler(rootLogger, this.publishHandler_);
  } else {
    goog.log.removeHandler(rootLogger, this.publishHandler_);
  }
  this.isCapturing_ = capturing;
};
goog.debug.Console.prototype.addLogRecord = function(logRecord) {
  if (this.filteredLoggers_[logRecord.getLoggerName()]) {
    return;
  }
  function getConsoleMethodName_(level) {
    if (level) {
      if (level.value >= goog.log.Level.SEVERE.value) {
        return "error";
      }
      if (level.value >= goog.log.Level.WARNING.value) {
        return "warn";
      }
      if (level.value >= goog.log.Level.CONFIG.value) {
        return "log";
      }
    }
    return "debug";
  }
  var record = this.formatter_.formatRecord(logRecord);
  var console = goog.debug.Console.console_;
  if (console) {
    var logMethod = getConsoleMethodName_(logRecord.getLevel());
    goog.debug.Console.logToConsole_(console, logMethod, record, logRecord.getException());
  } else {
    this.logBuffer_ += record;
  }
};
goog.debug.Console.prototype.addFilter = function(loggerName) {
  this.filteredLoggers_[loggerName] = true;
};
goog.debug.Console.prototype.removeFilter = function(loggerName) {
  delete this.filteredLoggers_[loggerName];
};
goog.debug.Console.instance = null;
goog.debug.Console.console_ = goog.global["console"];
goog.debug.Console.setConsole = function(console) {
  goog.debug.Console.console_ = console;
};
goog.debug.Console.autoInstall = function() {
  if (!goog.debug.Console.instance) {
    goog.debug.Console.instance = new goog.debug.Console();
  }
  if (goog.global.location && goog.global.location.href.indexOf("Debug\x3dtrue") != -1) {
    goog.debug.Console.instance.setCapturing(true);
  }
};
goog.debug.Console.show = function() {
  alert(goog.debug.Console.instance.logBuffer_);
};
goog.debug.Console.logToConsole_ = function(console, fnName, record, exception) {
  if (console[fnName]) {
    console[fnName](record, exception === undefined ? "" : exception);
  } else {
    console.log(record, exception === undefined ? "" : exception);
  }
};

//# sourceMappingURL=goog.debug.console.js.map
