goog.provide("goog.ui.KeyboardShortcutHandler");
goog.provide("goog.ui.KeyboardShortcutHandler.EventType");
goog.provide("goog.ui.KeyboardShortcutHandler.Modifiers");
goog.require("goog.asserts");
goog.require("goog.dom.TagName");
goog.require("goog.events");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyCodes");
goog.require("goog.events.KeyNames");
goog.require("goog.events.Keys");
goog.require("goog.object");
goog.require("goog.ui.KeyboardEventData");
goog.require("goog.ui.KeyboardShortcutEvent");
goog.require("goog.ui.SyntheticKeyboardEvent");
goog.require("goog.userAgent");
goog.requireType("goog.events.BrowserEvent");
goog.ui.KeyboardShortcutHandler = function(keyTarget) {
  goog.events.EventTarget.call(this);
  this.shortcuts_ = {};
  this.currentTree_ = this.shortcuts_;
  this.lastStrokeTime_ = 0;
  this.globalKeys_ = goog.object.createSet(goog.ui.KeyboardShortcutHandler.DEFAULT_GLOBAL_KEYS_);
  this.textInputs_ = goog.object.createSet(goog.ui.KeyboardShortcutHandler.DEFAULT_TEXT_INPUTS_);
  this.alwaysPreventDefault_ = true;
  this.alwaysStopPropagation_ = false;
  this.allShortcutsAreGlobal_ = false;
  this.modifierShortcutsAreGlobal_ = true;
  this.allowSpaceKeyOnButtons_ = false;
  this.activeShortcutKeyForGecko_ = null;
  this.initializeKeyListener(keyTarget);
};
goog.inherits(goog.ui.KeyboardShortcutHandler, goog.events.EventTarget);
goog.ui.KeyboardShortcutHandler.SequenceNode_ = function(opt_shortcut) {
  this.shortcut = opt_shortcut || null;
  this.next = opt_shortcut ? null : {};
};
goog.ui.KeyboardShortcutHandler.createTerminalNode_ = function(shortcut) {
  return new goog.ui.KeyboardShortcutHandler.SequenceNode_(shortcut);
};
goog.ui.KeyboardShortcutHandler.createInternalNode_ = function() {
  return new goog.ui.KeyboardShortcutHandler.SequenceNode_();
};
goog.ui.KeyboardShortcutHandler.SequenceTree_;
goog.ui.KeyboardShortcutHandler.MAX_KEY_SEQUENCE_DELAY = 1500;
goog.ui.KeyboardShortcutHandler.Modifiers = {NONE:0, SHIFT:1, CTRL:2, ALT:4, META:8};
goog.ui.KeyboardShortcutHandler.DEFAULT_GLOBAL_KEYS_ = [goog.events.KeyCodes.ESC, goog.events.KeyCodes.F1, goog.events.KeyCodes.F2, goog.events.KeyCodes.F3, goog.events.KeyCodes.F4, goog.events.KeyCodes.F5, goog.events.KeyCodes.F6, goog.events.KeyCodes.F7, goog.events.KeyCodes.F8, goog.events.KeyCodes.F9, goog.events.KeyCodes.F10, goog.events.KeyCodes.F11, goog.events.KeyCodes.F12, goog.events.KeyCodes.PAUSE];
goog.ui.KeyboardShortcutHandler.DEFAULT_TEXT_INPUTS_ = ["color", "date", "datetime", "datetime-local", "email", "month", "number", "password", "search", "tel", "text", "time", "url", "week"];
goog.ui.KeyboardShortcutHandler.EventType = {SHORTCUT_TRIGGERED:"shortcut", SHORTCUT_PREFIX:"shortcut_"};
goog.ui.KeyboardShortcutHandler.nameToKeyCodeCache_;
goog.ui.KeyboardShortcutHandler.prototype.keyTarget_;
goog.ui.KeyboardShortcutHandler.prototype.isPrintableKey_;
goog.ui.KeyboardShortcutHandler.getKeyCode = function(name) {
  if (!goog.ui.KeyboardShortcutHandler.nameToKeyCodeCache_) {
    var map = {};
    for (var key in goog.events.KeyNames) {
      map[goog.events.KeyNames[key]] = goog.events.KeyCodes.normalizeKeyCode(parseInt(key, 10));
    }
    goog.ui.KeyboardShortcutHandler.nameToKeyCodeCache_ = map;
  }
  return goog.ui.KeyboardShortcutHandler.nameToKeyCodeCache_[name];
};
goog.ui.KeyboardShortcutHandler.prototype.setAlwaysPreventDefault = function(alwaysPreventDefault) {
  this.alwaysPreventDefault_ = alwaysPreventDefault;
};
goog.ui.KeyboardShortcutHandler.prototype.getAlwaysPreventDefault = function() {
  return this.alwaysPreventDefault_;
};
goog.ui.KeyboardShortcutHandler.prototype.setAlwaysStopPropagation = function(alwaysStopPropagation) {
  this.alwaysStopPropagation_ = alwaysStopPropagation;
};
goog.ui.KeyboardShortcutHandler.prototype.getAlwaysStopPropagation = function() {
  return this.alwaysStopPropagation_;
};
goog.ui.KeyboardShortcutHandler.prototype.setAllShortcutsAreGlobal = function(allShortcutsGlobal) {
  this.allShortcutsAreGlobal_ = allShortcutsGlobal;
};
goog.ui.KeyboardShortcutHandler.prototype.getAllShortcutsAreGlobal = function() {
  return this.allShortcutsAreGlobal_;
};
goog.ui.KeyboardShortcutHandler.prototype.setModifierShortcutsAreGlobal = function(modifierShortcutsGlobal) {
  this.modifierShortcutsAreGlobal_ = modifierShortcutsGlobal;
};
goog.ui.KeyboardShortcutHandler.prototype.getModifierShortcutsAreGlobal = function() {
  return this.modifierShortcutsAreGlobal_;
};
goog.ui.KeyboardShortcutHandler.prototype.setAllowSpaceKeyOnButtons = function(allowSpaceKeyOnButtons) {
  this.allowSpaceKeyOnButtons_ = allowSpaceKeyOnButtons;
};
goog.ui.KeyboardShortcutHandler.prototype.registerShortcut = function(identifier, var_args) {
  goog.ui.KeyboardShortcutHandler.setShortcut_(this.shortcuts_, this.interpretStrokes_(1, arguments), identifier);
};
goog.ui.KeyboardShortcutHandler.prototype.unregisterShortcut = function(var_args) {
  goog.ui.KeyboardShortcutHandler.unsetShortcut_(this.shortcuts_, this.interpretStrokes_(0, arguments));
};
goog.ui.KeyboardShortcutHandler.prototype.isShortcutRegistered = function(var_args) {
  return this.checkShortcut_(this.shortcuts_, this.interpretStrokes_(0, arguments));
};
goog.ui.KeyboardShortcutHandler.prototype.interpretStrokes_ = function(initialIndex, args) {
  var strokes;
  if (typeof args[initialIndex] === "string") {
    strokes = goog.ui.KeyboardShortcutHandler.parseStringShortcut(args[initialIndex]).map(function(stroke) {
      goog.asserts.assertNumber(stroke.keyCode, "A non-modifier key is needed in each stroke.");
      return goog.ui.KeyboardShortcutHandler.makeStroke_(stroke.key || "", stroke.keyCode, stroke.modifiers);
    });
  } else {
    var strokesArgs = args, i = initialIndex;
    if (Array.isArray(args[initialIndex])) {
      strokesArgs = args[initialIndex];
      i = 0;
    }
    strokes = [];
    for (; i < strokesArgs.length; i += 2) {
      strokes.push(goog.ui.KeyboardShortcutHandler.makeStroke_("", strokesArgs[i], strokesArgs[i + 1]));
    }
  }
  return strokes;
};
goog.ui.KeyboardShortcutHandler.prototype.unregisterAll = function() {
  this.shortcuts_ = {};
};
goog.ui.KeyboardShortcutHandler.prototype.setGlobalKeys = function(keys) {
  this.globalKeys_ = goog.object.createSet(keys);
};
goog.ui.KeyboardShortcutHandler.prototype.getGlobalKeys = function() {
  return goog.object.getKeys(this.globalKeys_);
};
goog.ui.KeyboardShortcutHandler.prototype.disposeInternal = function() {
  goog.ui.KeyboardShortcutHandler.superClass_.disposeInternal.call(this);
  this.unregisterAll();
  this.clearKeyListener();
};
goog.ui.KeyboardShortcutHandler.prototype.getEventType = function(identifier) {
  return goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_PREFIX + identifier;
};
goog.ui.KeyboardShortcutHandler.parseStringShortcut = function(s) {
  s = s.replace(/[ +]*\+[ +]*/g, "+").replace(/[ ]+/g, " ").toLowerCase();
  var groups = s.split(" ");
  var strokes = [];
  for (var group, i = 0; group = groups[i]; i++) {
    var keys = group.split("+");
    var keyName = null;
    var keyCode = null;
    var modifiers = goog.ui.KeyboardShortcutHandler.Modifiers.NONE;
    for (var key, j = 0; key = keys[j]; j++) {
      switch(key) {
        case "shift":
          modifiers |= goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT;
          continue;
        case "ctrl":
          modifiers |= goog.ui.KeyboardShortcutHandler.Modifiers.CTRL;
          continue;
        case "alt":
          modifiers |= goog.ui.KeyboardShortcutHandler.Modifiers.ALT;
          continue;
        case "meta":
          modifiers |= goog.ui.KeyboardShortcutHandler.Modifiers.META;
          continue;
      }
      if (keyCode !== null) {
        goog.asserts.fail("At most one non-modifier key can be in a stroke.");
      }
      keyCode = goog.ui.KeyboardShortcutHandler.getKeyCode(key);
      goog.asserts.assertNumber(keyCode, "Key name not found in goog.events.KeyNames: " + key);
      keyName = key;
      break;
    }
    strokes.push({key:keyName, keyCode:keyCode, modifiers:modifiers});
  }
  return strokes;
};
goog.ui.KeyboardShortcutHandler.prototype.initializeKeyListener = function(keyTarget) {
  this.keyTarget_ = keyTarget;
  goog.events.listen(this.keyTarget_, goog.events.EventType.KEYDOWN, this.handleBrowserKeyDown_, undefined, this);
  goog.events.listen(this.keyTarget_, goog.ui.SyntheticKeyboardEvent.Type.KEYDOWN, this.handleSyntheticKeyDown_, undefined, this);
  if (goog.userAgent.WINDOWS) {
    goog.events.listen(this.keyTarget_, goog.events.EventType.KEYPRESS, this.handleWindowsBrowserKeyPress_, undefined, this);
    goog.events.listen(this.keyTarget_, goog.ui.SyntheticKeyboardEvent.Type.KEYPRESS, this.handleWindowsSyntheticKeyPress_, undefined, this);
  }
  goog.events.listen(this.keyTarget_, goog.events.EventType.KEYUP, this.handleBrowserKeyUp_, undefined, this);
  goog.events.listen(this.keyTarget_, goog.ui.SyntheticKeyboardEvent.Type.KEYUP, this.handleSyntheticKeyUp_, undefined, this);
};
goog.ui.KeyboardShortcutHandler.prototype.handleBrowserKeyUp_ = function(e) {
  this.handleKeyUp_(goog.ui.KeyboardEventData.fromBrowserEvent(e));
};
goog.ui.KeyboardShortcutHandler.prototype.handleSyntheticKeyUp_ = function(e) {
  this.handleKeyUp_(e.getData());
};
goog.ui.KeyboardShortcutHandler.prototype.handleKeyUp_ = function(data) {
  if (goog.userAgent.GECKO) {
    this.handleGeckoKeyUp_(data);
  }
  if (goog.userAgent.WINDOWS) {
    this.handleWindowsKeyUp_(data);
  }
};
goog.ui.KeyboardShortcutHandler.prototype.handleGeckoKeyUp_ = function(data) {
  if (goog.events.KeyCodes.SPACE == this.activeShortcutKeyForGecko_ && goog.events.KeyCodes.SPACE == data.getKeyCode()) {
    data.getPreventDefaultFn()();
  }
  this.activeShortcutKeyForGecko_ = null;
};
goog.ui.KeyboardShortcutHandler.prototype.isPossiblePrintableKey_ = function(data) {
  return goog.userAgent.WINDOWS && data.getCtrlKey() && data.getAltKey();
};
goog.ui.KeyboardShortcutHandler.prototype.handleWindowsBrowserKeyPress_ = function(e) {
  this.handleWindowsKeyPress_(goog.ui.KeyboardEventData.fromBrowserEvent(e));
};
goog.ui.KeyboardShortcutHandler.prototype.handleWindowsSyntheticKeyPress_ = function(e) {
  this.handleWindowsKeyPress_(e.getData());
};
goog.ui.KeyboardShortcutHandler.prototype.handleWindowsKeyPress_ = function(data) {
  if (data.getKeyCode() > 32 && this.isPossiblePrintableKey_(data)) {
    this.isPrintableKey_ = true;
  }
};
goog.ui.KeyboardShortcutHandler.prototype.handleWindowsKeyUp_ = function(data) {
  if (!this.isPrintableKey_ && this.isPossiblePrintableKey_(data)) {
    this.handleKeyDown_(data, true);
  }
};
goog.ui.KeyboardShortcutHandler.prototype.clearKeyListener = function() {
  goog.events.unlisten(this.keyTarget_, goog.events.EventType.KEYDOWN, this.handleBrowserKeyDown_, false, this);
  goog.events.unlisten(this.keyTarget_, goog.ui.SyntheticKeyboardEvent.Type.KEYDOWN, this.handleSyntheticKeyDown_, false, this);
  if (goog.userAgent.WINDOWS) {
    goog.events.unlisten(this.keyTarget_, goog.events.EventType.KEYPRESS, this.handleWindowsBrowserKeyPress_, false, this);
    goog.events.unlisten(this.keyTarget_, goog.ui.SyntheticKeyboardEvent.Type.KEYPRESS, this.handleWindowsSyntheticKeyPress_, false, this);
  }
  goog.events.unlisten(this.keyTarget_, goog.events.EventType.KEYUP, this.handleBrowserKeyUp_, false, this);
  goog.events.unlisten(this.keyTarget_, goog.ui.SyntheticKeyboardEvent.Type.KEYUP, this.handleSyntheticKeyUp_, false, this);
  this.keyTarget_ = null;
};
goog.ui.KeyboardShortcutHandler.setShortcut_ = function(tree, strokes, identifier) {
  var stroke = strokes.shift();
  stroke.forEach(function(s) {
    var node = tree[s];
    if (node && (strokes.length == 0 || node.shortcut)) {
      throw new Error("Keyboard shortcut conflicts with existing shortcut: " + node.shortcut);
    }
  });
  if (strokes.length) {
    stroke.forEach(function(s) {
      var node = goog.object.setIfUndefined(tree, s.toString(), goog.ui.KeyboardShortcutHandler.createInternalNode_());
      var strokesCopy = strokes.slice(0);
      goog.ui.KeyboardShortcutHandler.setShortcut_(goog.asserts.assert(node.next, "An internal node must have a next map"), strokesCopy, identifier);
    });
  } else {
    stroke.forEach(function(s) {
      tree[s] = goog.ui.KeyboardShortcutHandler.createTerminalNode_(identifier);
    });
  }
};
goog.ui.KeyboardShortcutHandler.unsetShortcut_ = function(tree, strokes) {
  var stroke = strokes.shift();
  stroke.forEach(function(s) {
    var node = tree[s];
    if (!node) {
      return;
    }
    if (strokes.length == 0) {
      if (!node.shortcut) {
        return;
      }
      delete tree[s];
    } else {
      if (!node.next) {
        return;
      }
      var strokesCopy = strokes.slice(0);
      goog.ui.KeyboardShortcutHandler.unsetShortcut_(node.next, strokesCopy);
      if (goog.object.isEmpty(node.next)) {
        delete tree[s];
      }
    }
  });
};
goog.ui.KeyboardShortcutHandler.prototype.getNode_ = function(tree, stroke) {
  for (var i = 0; i < stroke.length; i++) {
    var node = tree[stroke[i]];
    if (!node) {
      continue;
    }
    return node;
  }
  return undefined;
};
goog.ui.KeyboardShortcutHandler.prototype.checkShortcut_ = function(tree, strokes) {
  while (strokes.length > 0 && tree) {
    var stroke = strokes.shift();
    var node = this.getNode_(tree, stroke);
    if (!node) {
      continue;
    }
    if (strokes.length == 0 && node.shortcut) {
      return true;
    }
    var strokesCopy = strokes.slice(0);
    if (this.checkShortcut_(node.next, strokesCopy)) {
      return true;
    }
  }
  return false;
};
goog.ui.KeyboardShortcutHandler.makeStroke_ = function(keyName, keyCode, modifiers) {
  var mods = modifiers || 0;
  var strokes = ["c_" + keyCode + "_" + mods];
  if (keyName != "") {
    strokes.push("n_" + keyName + "_" + mods);
  }
  return strokes;
};
goog.ui.KeyboardShortcutHandler.prototype.handleBrowserKeyDown_ = function(event) {
  this.handleKeyDown_(goog.ui.KeyboardEventData.fromBrowserEvent(event));
};
goog.ui.KeyboardShortcutHandler.prototype.handleSyntheticKeyDown_ = function(event) {
  this.handleKeyDown_(event.getData());
};
goog.ui.KeyboardShortcutHandler.prototype.handleKeyDown_ = function(data, opt_handlePossiblePrintableKeys) {
  if (!this.isValidShortcut_(data)) {
    return;
  }
  if (!opt_handlePossiblePrintableKeys && this.isPossiblePrintableKey_(data)) {
    this.isPrintableKey_ = false;
    return;
  }
  var keyCode = goog.events.KeyCodes.normalizeKeyCode(data.getKeyCode());
  var keyName = data.getKey();
  var modifiers = (data.getShiftKey() ? goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT : 0) | (data.getCtrlKey() ? goog.ui.KeyboardShortcutHandler.Modifiers.CTRL : 0) | (data.getAltKey() ? goog.ui.KeyboardShortcutHandler.Modifiers.ALT : 0) | (data.getMetaKey() ? goog.ui.KeyboardShortcutHandler.Modifiers.META : 0);
  var stroke = goog.ui.KeyboardShortcutHandler.makeStroke_(keyName, keyCode, modifiers);
  var node = this.getNode_(this.currentTree_, stroke);
  if (!node || this.hasSequenceTimedOut_()) {
    this.setCurrentTree_(this.shortcuts_);
  }
  node = this.getNode_(this.currentTree_, stroke);
  if (node && node.next) {
    this.setCurrentTree_(node.next);
  }
  if (!node) {
    return;
  } else if (node.next) {
    data.getPreventDefaultFn()();
    return;
  }
  this.setCurrentTree_(this.shortcuts_);
  if (this.alwaysPreventDefault_) {
    data.getPreventDefaultFn()();
  }
  if (this.alwaysStopPropagation_) {
    data.getStopPropagationFn()();
  }
  var shortcut = goog.asserts.assertString(node.shortcut, "A terminal node must have a string shortcut identifier.");
  var triggerEvent = new goog.ui.KeyboardShortcutEvent(goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED, shortcut, data.getTarget());
  var retVal = this.dispatchEvent(triggerEvent);
  var prefixEvent = new goog.ui.KeyboardShortcutEvent(goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_PREFIX + shortcut, shortcut, data.getTarget());
  retVal &= this.dispatchEvent(prefixEvent);
  if (!retVal) {
    data.getPreventDefaultFn()();
  }
  if (goog.userAgent.GECKO) {
    this.activeShortcutKeyForGecko_ = keyCode;
  }
};
goog.ui.KeyboardShortcutHandler.prototype.isValidShortcut_ = function(data) {
  var keyCode = data.getKeyCode();
  if (data.getKey() != "") {
    var keyName = data.getKey();
    if (keyName == goog.events.Keys.CTRL || keyName == goog.events.Keys.SHIFT || keyName == goog.events.Keys.ALT || keyName == goog.events.Keys.ALTGRAPH) {
      return false;
    }
  } else {
    if (keyCode == goog.events.KeyCodes.SHIFT || keyCode == goog.events.KeyCodes.CTRL || keyCode == goog.events.KeyCodes.ALT) {
      return false;
    }
  }
  var el = data.getRootTarget();
  var isFormElement = el.tagName == goog.dom.TagName.TEXTAREA || el.tagName == goog.dom.TagName.INPUT || el.tagName == goog.dom.TagName.BUTTON || el.tagName == goog.dom.TagName.SELECT;
  var isContentEditable = !isFormElement && (el.isContentEditable || el.ownerDocument && el.ownerDocument.designMode == "on");
  if (!isFormElement && !isContentEditable) {
    return true;
  }
  if (this.globalKeys_[keyCode] || this.allShortcutsAreGlobal_) {
    return true;
  }
  if (isContentEditable) {
    return false;
  }
  if (this.modifierShortcutsAreGlobal_ && (data.getAltKey() || data.getCtrlKey() || data.getMetaKey())) {
    return true;
  }
  if (el.tagName == goog.dom.TagName.INPUT && this.textInputs_[el.type]) {
    return keyCode == goog.events.KeyCodes.ENTER;
  }
  if (el.tagName == goog.dom.TagName.INPUT || el.tagName == goog.dom.TagName.BUTTON) {
    if (this.allowSpaceKeyOnButtons_) {
      return true;
    } else {
      return keyCode != goog.events.KeyCodes.SPACE;
    }
  }
  return false;
};
goog.ui.KeyboardShortcutHandler.prototype.hasSequenceTimedOut_ = function() {
  return Date.now() - this.lastStrokeTime_ >= goog.ui.KeyboardShortcutHandler.MAX_KEY_SEQUENCE_DELAY;
};
goog.ui.KeyboardShortcutHandler.prototype.setCurrentTree_ = function(tree) {
  this.currentTree_ = tree;
  this.lastStrokeTime_ = Date.now();
};

//# sourceMappingURL=goog.ui.keyboardshortcuthandler.js.map
