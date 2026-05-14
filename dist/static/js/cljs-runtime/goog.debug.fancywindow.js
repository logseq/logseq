goog.provide("goog.debug.FancyWindow");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug.DebugWindow");
goog.require("goog.dom.DomHelper");
goog.require("goog.dom.TagName");
goog.require("goog.dom.safe");
goog.require("goog.html.SafeHtml");
goog.require("goog.html.SafeStyleSheet");
goog.require("goog.log");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.string.Const");
goog.require("goog.userAgent");
goog.debug.FancyWindow = function(opt_identifier, opt_prefix) {
  this.readOptionsFromLocalStorage_();
  goog.debug.FancyWindow.base(this, "constructor", opt_identifier, opt_prefix);
  this.dh_ = null;
};
goog.inherits(goog.debug.FancyWindow, goog.debug.DebugWindow);
goog.debug.FancyWindow.HAS_LOCAL_STORE = function() {
  try {
    return !!window["localStorage"].getItem;
  } catch (e) {
  }
  return false;
}();
goog.debug.FancyWindow.LOCAL_STORE_PREFIX = "fancywindow.sel.";
goog.debug.FancyWindow.prototype.writeBufferToLog = function() {
  this.lastCall = goog.now();
  if (this.hasActiveWindow()) {
    var logel = this.dh_.getElement("log");
    var scroll = logel.scrollHeight - (logel.scrollTop + logel.offsetHeight) <= 100;
    for (var i = 0; i < this.outputBuffer.length; i++) {
      var div = this.dh_.createDom(goog.dom.TagName.DIV, "logmsg");
      goog.dom.safe.setInnerHtml(div, this.outputBuffer[i]);
      logel.appendChild(div);
    }
    this.outputBuffer.length = 0;
    this.resizeStuff_();
    if (scroll) {
      logel.scrollTop = logel.scrollHeight;
    }
  }
};
goog.debug.FancyWindow.prototype.writeInitialDocument = function() {
  if (!this.hasActiveWindow()) {
    return;
  }
  var doc = this.win.document;
  doc.open();
  goog.dom.safe.documentWrite(doc, this.getHtml_());
  doc.close();
  (goog.userAgent.IE ? doc.body : this.win).onresize = goog.bind(this.resizeStuff_, this);
  this.dh_ = new goog.dom.DomHelper(doc);
  this.dh_.getElement("openbutton").onclick = goog.bind(this.openOptions_, this);
  this.dh_.getElement("closebutton").onclick = goog.bind(this.closeOptions_, this);
  this.dh_.getElement("clearbutton").onclick = goog.bind(this.clear, this);
  this.dh_.getElement("exitbutton").onclick = goog.bind(this.exit_, this);
  this.writeSavedMessages();
};
goog.debug.FancyWindow.prototype.openOptions_ = function() {
  var el = goog.asserts.assert(this.dh_.getElement("optionsarea"));
  goog.dom.safe.setInnerHtml(el, goog.html.SafeHtml.EMPTY);
  var loggers = goog.debug.FancyWindow.getLoggers_();
  var dh = this.dh_;
  for (var i = 0; i < loggers.length; i++) {
    var logger = loggers[i];
    var curlevel = goog.log.getLevel(logger) ? goog.log.getLevel(logger).name : "INHERIT";
    var div = dh.createDom(goog.dom.TagName.DIV, {}, this.getDropDown_("sel" + logger.getName(), curlevel), dh.createDom(goog.dom.TagName.SPAN, {}, logger.getName() || "(root)"));
    el.appendChild(div);
  }
  this.dh_.getElement("options").style.display = "block";
  return false;
};
goog.debug.FancyWindow.prototype.getDropDown_ = function(id, selected) {
  var dh = this.dh_;
  var sel = dh.createDom(goog.dom.TagName.SELECT, {"id":id});
  var levels = goog.log.Level.PREDEFINED_LEVELS;
  for (var i = 0; i < levels.length; i++) {
    var level = levels[i];
    var option = dh.createDom(goog.dom.TagName.OPTION, {}, level.name);
    if (selected == level.name) {
      option.selected = true;
    }
    sel.appendChild(option);
  }
  sel.appendChild(dh.createDom(goog.dom.TagName.OPTION, {"selected":selected == "INHERIT"}, "INHERIT"));
  return sel;
};
goog.debug.FancyWindow.prototype.closeOptions_ = function() {
  this.dh_.getElement("options").style.display = "none";
  const loggers = goog.debug.FancyWindow.getLoggers_();
  const dh = this.dh_;
  for (let i = 0; i < loggers.length; i++) {
    const logger = loggers[i];
    const sel = dh.getElement("sel" + logger.getName());
    if (!sel) {
      continue;
    }
    const level = sel.options[sel.selectedIndex].text;
    if (level == "INHERIT") {
      goog.log.setLevel(logger, null);
    } else {
      goog.log.setLevel(logger, goog.log.Level.getPredefinedLevel(level));
    }
  }
  this.writeOptionsToLocalStorage_();
  return false;
};
goog.debug.FancyWindow.prototype.resizeStuff_ = function() {
  var dh = this.dh_;
  var logel = dh.getElement("log");
  var headel = dh.getElement("head");
  logel.style.top = headel.offsetHeight + "px";
  logel.style.height = dh.getDocument().body.offsetHeight - headel.offsetHeight - (goog.userAgent.IE ? 4 : 0) + "px";
};
goog.debug.FancyWindow.prototype.exit_ = function(e) {
  this.setEnabled(false);
  if (this.win) {
    this.win.close();
  }
};
goog.debug.FancyWindow.prototype.getStyleRules = function() {
  var baseRules = goog.debug.FancyWindow.base(this, "getStyleRules");
  var extraRules = goog.html.SafeStyleSheet.fromConstant(goog.string.Const.from("html,body{height:100%;width:100%;margin:0px;padding:0px;" + "background-color:#FFF;overflow:hidden}" + "*{}" + ".logmsg{border-bottom:1px solid #CCC;padding:2px;font:90% monospace}" + "#head{position:absolute;width:100%;font:x-small arial;" + "border-bottom:2px solid #999;background-color:#EEE;}" + "#head p{margin:0px 5px;}" + "#log{position:absolute;width:100%;background-color:#FFF;}" + "#options{position:absolute;right:0px;width:50%;height:100%;" + 
  "border-left:1px solid #999;background-color:#DDD;display:none;" + "padding-left: 5px;font:normal small arial;overflow:auto;}" + "#openbutton,#closebutton{text-decoration:underline;color:#00F;cursor:" + "pointer;position:absolute;top:0px;right:5px;font:x-small arial;}" + "#clearbutton{text-decoration:underline;color:#00F;cursor:" + "pointer;position:absolute;top:0px;right:80px;font:x-small arial;}" + "#exitbutton{text-decoration:underline;color:#00F;cursor:" + "pointer;position:absolute;top:0px;right:50px;font:x-small arial;}" + 
  "select{font:x-small arial;margin-right:10px;}" + "hr{border:0;height:5px;background-color:#8c8;color:#8c8;}"));
  return goog.html.SafeStyleSheet.concat(baseRules, extraRules);
};
goog.debug.FancyWindow.prototype.getHtml_ = function() {
  var SafeHtml = goog.html.SafeHtml;
  var head = SafeHtml.create("head", {}, SafeHtml.concat(SafeHtml.create("title", {}, "Logging: " + this.identifier), SafeHtml.createStyle(this.getStyleRules())));
  var body = SafeHtml.create("body", {}, SafeHtml.concat(SafeHtml.create("div", {"id":"log", "style":goog.string.Const.from("overflow:auto")}), SafeHtml.create("div", {"id":"head"}, SafeHtml.concat(SafeHtml.create("p", {}, SafeHtml.create("b", {}, "Logging: " + this.identifier)), SafeHtml.create("p", {}, this.welcomeMessage), SafeHtml.create("span", {"id":"clearbutton"}, "clear"), SafeHtml.create("span", {"id":"exitbutton"}, "exit"), SafeHtml.create("span", {"id":"openbutton"}, "options"))), SafeHtml.create("div", 
  {"id":"options"}, SafeHtml.concat(SafeHtml.create("big", {}, SafeHtml.create("b", {}, "Options:")), SafeHtml.create("div", {"id":"optionsarea"}), SafeHtml.create("span", {"id":"closebutton"}, "save and close")))));
  return SafeHtml.create("html", {}, SafeHtml.concat(head, body));
};
goog.debug.FancyWindow.prototype.writeOptionsToLocalStorage_ = function() {
  if (!goog.debug.FancyWindow.HAS_LOCAL_STORE) {
    return;
  }
  var loggers = goog.debug.FancyWindow.getLoggers_();
  var storedKeys = goog.debug.FancyWindow.getStoredKeys_();
  for (var i = 0; i < loggers.length; i++) {
    var key = goog.debug.FancyWindow.LOCAL_STORE_PREFIX + loggers[i].getName();
    var level = goog.log.getLevel(loggers[i]);
    if (key in storedKeys) {
      if (!level) {
        window.localStorage.removeItem(key);
      } else if (window.localStorage.getItem(key) != level.name) {
        window.localStorage.setItem(key, level.name);
      }
    } else if (level) {
      window.localStorage.setItem(key, level.name);
    }
  }
};
goog.debug.FancyWindow.prototype.readOptionsFromLocalStorage_ = function() {
  if (!goog.debug.FancyWindow.HAS_LOCAL_STORE) {
    return;
  }
  var storedKeys = goog.debug.FancyWindow.getStoredKeys_();
  for (var key in storedKeys) {
    var loggerName = key.replace(goog.debug.FancyWindow.LOCAL_STORE_PREFIX, "");
    var logger = goog.log.getLogger(loggerName);
    var curLevel = goog.log.getLevel(logger);
    var storedLevel = window.localStorage.getItem(key).toString();
    if (!curLevel || curLevel.toString() != storedLevel) {
      goog.log.setLevel(logger, goog.log.Level.getPredefinedLevel(storedLevel));
    }
  }
};
goog.debug.FancyWindow.getStoredKeys_ = function() {
  var storedKeys = {};
  for (var i = 0, len = window.localStorage.length; i < len; i++) {
    var key = window.localStorage.key(i);
    if (key != null && goog.string.startsWith(key, goog.debug.FancyWindow.LOCAL_STORE_PREFIX)) {
      storedKeys[key] = true;
    }
  }
  return storedKeys;
};
goog.debug.FancyWindow.getLoggers_ = function() {
  const loggers = goog.log.getAllLoggers();
  const loggerSort = (a, b) => {
    return goog.array.defaultCompare(a.getName(), b.getName());
  };
  loggers.sort(loggerSort);
  return loggers;
};

//# sourceMappingURL=goog.debug.fancywindow.js.map
