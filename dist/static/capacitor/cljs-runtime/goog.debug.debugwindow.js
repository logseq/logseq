goog.provide("goog.debug.DebugWindow");
goog.require("goog.debug.HtmlFormatter");
goog.require("goog.dom.safe");
goog.require("goog.html.SafeHtml");
goog.require("goog.html.SafeStyleSheet");
goog.require("goog.log");
goog.require("goog.string.Const");
goog.require("goog.structs.CircularBuffer");
goog.require("goog.userAgent");
goog.requireType("goog.debug.Formatter");
goog.debug.DebugWindow = function(opt_identifier, opt_prefix) {
  this.identifier = opt_identifier || "";
  this.outputBuffer = [];
  this.prefix_ = opt_prefix || "";
  this.savedMessages_ = new goog.structs.CircularBuffer(goog.debug.DebugWindow.MAX_SAVED);
  this.publishHandler_ = goog.bind(this.addLogRecord, this);
  this.formatter_ = new goog.debug.HtmlFormatter(this.prefix_);
  this.filteredLoggers_ = {};
  this.setCapturing(true);
  this.enabled_ = goog.debug.DebugWindow.isEnabled(this.identifier);
  goog.global.setInterval(goog.bind(this.saveWindowPositionSize_, this), 7500);
};
goog.debug.DebugWindow.MAX_SAVED = 500;
goog.debug.DebugWindow.COOKIE_TIME = 30 * 24 * 60 * 60 * 1000;
goog.debug.DebugWindow.prototype.welcomeMessage = "LOGGING";
goog.debug.DebugWindow.prototype.enableOnSevere_ = false;
goog.debug.DebugWindow.prototype.win = null;
goog.debug.DebugWindow.prototype.winOpening_ = false;
goog.debug.DebugWindow.prototype.isCapturing_ = false;
goog.debug.DebugWindow.showedBlockedAlert_ = false;
goog.debug.DebugWindow.prototype.bufferTimeout_ = null;
goog.debug.DebugWindow.prototype.lastCall = goog.now();
goog.debug.DebugWindow.prototype.setWelcomeMessage = function(msg) {
  this.welcomeMessage = msg;
};
goog.debug.DebugWindow.prototype.init = function() {
  if (this.enabled_) {
    this.openWindow_();
  }
};
goog.debug.DebugWindow.prototype.isEnabled = function() {
  return this.enabled_;
};
goog.debug.DebugWindow.prototype.setEnabled = function(enable) {
  this.enabled_ = enable;
  if (this.enabled_) {
    this.openWindow_();
  }
  this.setCookie_("enabled", enable ? "1" : "0");
};
goog.debug.DebugWindow.prototype.setForceEnableOnSevere = function(enableOnSevere) {
  this.enableOnSevere_ = enableOnSevere;
};
goog.debug.DebugWindow.prototype.isCapturing = function() {
  return this.isCapturing_;
};
goog.debug.DebugWindow.prototype.setCapturing = function(capturing) {
  if (capturing == this.isCapturing_) {
    return;
  }
  this.isCapturing_ = capturing;
  var rootLogger = goog.log.getRootLogger();
  if (capturing) {
    goog.log.addHandler(rootLogger, this.publishHandler_);
  } else {
    goog.log.removeHandler(rootLogger, this.publishHandler_);
  }
};
goog.debug.DebugWindow.prototype.getFormatter = function() {
  return this.formatter_;
};
goog.debug.DebugWindow.prototype.setFormatter = function(formatter) {
  this.formatter_ = formatter;
};
goog.debug.DebugWindow.prototype.addSeparator = function() {
  this.write_(goog.html.SafeHtml.create("hr"));
};
goog.debug.DebugWindow.prototype.hasActiveWindow = function() {
  return !!this.win && !this.win.closed;
};
goog.debug.DebugWindow.prototype.clear = function() {
  this.savedMessages_.clear();
  if (this.hasActiveWindow()) {
    this.writeInitialDocument();
  }
};
goog.debug.DebugWindow.prototype.addLogRecord = function(logRecord) {
  if (this.filteredLoggers_[logRecord.getLoggerName()]) {
    return;
  }
  var html = this.formatter_.formatRecordAsHtml(logRecord);
  this.write_(html);
  if (this.enableOnSevere_ && logRecord.getLevel().value >= goog.log.Level.SEVERE.value) {
    this.setEnabled(true);
  }
};
goog.debug.DebugWindow.prototype.write_ = function(html) {
  if (this.enabled_) {
    this.openWindow_();
    this.savedMessages_.add(html);
    this.writeToLog_(html);
  } else {
    this.savedMessages_.add(html);
  }
};
goog.debug.DebugWindow.prototype.writeToLog_ = function(html) {
  this.outputBuffer.push(html);
  goog.global.clearTimeout(this.bufferTimeout_);
  if (goog.now() - this.lastCall > 750) {
    this.writeBufferToLog();
  } else {
    this.bufferTimeout_ = goog.global.setTimeout(goog.bind(this.writeBufferToLog, this), 250);
  }
};
goog.debug.DebugWindow.prototype.writeBufferToLog = function() {
  this.lastCall = goog.now();
  if (this.hasActiveWindow()) {
    var body = this.win.document.body;
    var scroll = body && body.scrollHeight - (body.scrollTop + body.clientHeight) <= 100;
    goog.dom.safe.documentWrite(this.win.document, goog.html.SafeHtml.concat(this.outputBuffer));
    this.outputBuffer.length = 0;
    if (scroll) {
      this.win.scrollTo(0, 1000000);
    }
  }
};
goog.debug.DebugWindow.prototype.writeSavedMessages = function() {
  var messages = this.savedMessages_.getValues();
  for (var i = 0; i < messages.length; i++) {
    this.writeToLog_(messages[i]);
  }
};
goog.debug.DebugWindow.prototype.openWindow_ = function() {
  if (this.hasActiveWindow() || this.winOpening_) {
    return;
  }
  var winpos = this.getCookie_("dbg", "0,0,800,500").split(",");
  var x = Number(winpos[0]);
  var y = Number(winpos[1]);
  var w = Number(winpos[2]);
  var h = Number(winpos[3]);
  this.winOpening_ = true;
  this.win = goog.dom.safe.openInWindow("", window, this.getWindowName_(), "width\x3d" + w + ",height\x3d" + h + ",toolbar\x3dno,resizable\x3dyes," + "scrollbars\x3dyes,left\x3d" + x + ",top\x3d" + y + ",status\x3dno,screenx\x3d" + x + ",screeny\x3d" + y);
  if (!this.win) {
    if (!goog.debug.DebugWindow.showedBlockedAlert_) {
      alert("Logger popup was blocked");
      goog.debug.DebugWindow.showedBlockedAlert_ = true;
    }
  }
  this.winOpening_ = false;
  if (this.win) {
    this.writeInitialDocument();
  }
};
goog.debug.DebugWindow.prototype.getWindowName_ = function() {
  return goog.userAgent.IE ? this.identifier.replace(/[\s\-\.,]/g, "_") : this.identifier;
};
goog.debug.DebugWindow.prototype.getStyleRules = function() {
  return goog.html.SafeStyleSheet.fromConstant(goog.string.Const.from("*{font:normal 14px monospace;}" + ".dbg-sev{color:#F00}" + ".dbg-w{color:#E92}" + ".dbg-sh{background-color:#fd4;font-weight:bold;color:#000}" + ".dbg-i{color:#666}" + ".dbg-f{color:#999}" + ".dbg-ev{color:#0A0}" + ".dbg-m{color:#990}"));
};
goog.debug.DebugWindow.prototype.writeInitialDocument = function() {
  if (!this.hasActiveWindow()) {
    return;
  }
  this.win.document.open();
  var div = goog.html.SafeHtml.create("div", {"class":"dbg-ev", "style":goog.string.Const.from("text-align:center;")}, goog.html.SafeHtml.concat(this.welcomeMessage, goog.html.SafeHtml.BR, goog.html.SafeHtml.create("small", {}, "Logger: " + this.identifier)));
  var html = goog.html.SafeHtml.concat(goog.html.SafeHtml.createStyle(this.getStyleRules()), goog.html.SafeHtml.create("hr"), div, goog.html.SafeHtml.create("hr"));
  this.writeToLog_(html);
  this.writeSavedMessages();
};
goog.debug.DebugWindow.prototype.setCookie_ = function(key, value) {
  var fullKey = goog.debug.DebugWindow.getCookieKey_(this.identifier, key);
  document.cookie = fullKey + "\x3d" + encodeURIComponent(value) + ";path\x3d/;expires\x3d" + (new Date(goog.now() + goog.debug.DebugWindow.COOKIE_TIME)).toUTCString();
};
goog.debug.DebugWindow.prototype.getCookie_ = function(key, opt_default) {
  return goog.debug.DebugWindow.getCookieValue_(this.identifier, key, opt_default);
};
goog.debug.DebugWindow.getCookieKey_ = function(identifier, key) {
  var fullKey = key + identifier;
  return fullKey.replace(/[;=\s]/g, "_");
};
goog.debug.DebugWindow.getCookieValue_ = function(identifier, key, opt_default) {
  var fullKey = goog.debug.DebugWindow.getCookieKey_(identifier, key);
  var cookie = String(document.cookie);
  var start = cookie.indexOf(fullKey + "\x3d");
  if (start != -1) {
    var end = cookie.indexOf(";", start);
    return decodeURIComponent(cookie.substring(start + fullKey.length + 1, end == -1 ? cookie.length : end));
  } else {
    return opt_default || "";
  }
};
goog.debug.DebugWindow.isEnabled = function(identifier) {
  return goog.debug.DebugWindow.getCookieValue_(identifier, "enabled") == "1";
};
goog.debug.DebugWindow.prototype.saveWindowPositionSize_ = function() {
  if (!this.hasActiveWindow()) {
    return;
  }
  var x = this.win.screenX || this.win.screenLeft || 0;
  var y = this.win.screenY || this.win.screenTop || 0;
  var w = this.win.outerWidth || 800;
  var h = this.win.outerHeight || 500;
  this.setCookie_("dbg", x + "," + y + "," + w + "," + h);
};
goog.debug.DebugWindow.prototype.addFilter = function(loggerName) {
  this.filteredLoggers_[loggerName] = 1;
};
goog.debug.DebugWindow.prototype.removeFilter = function(loggerName) {
  delete this.filteredLoggers_[loggerName];
};
goog.debug.DebugWindow.prototype.resetBufferWithNewSize = function(size) {
  if (size > 0 && size < 50000) {
    this.clear();
    this.savedMessages_ = new goog.structs.CircularBuffer(size);
  }
};

//# sourceMappingURL=goog.debug.debugwindow.js.map
