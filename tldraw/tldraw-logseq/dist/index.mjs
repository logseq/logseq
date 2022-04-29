var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// ../../node_modules/mousetrap/mousetrap.js
var require_mousetrap = __commonJS({
  "../../node_modules/mousetrap/mousetrap.js"(exports, module) {
    (function(window2, document2, undefined2) {
      if (!window2) {
        return;
      }
      var _MAP = {
        8: "backspace",
        9: "tab",
        13: "enter",
        16: "shift",
        17: "ctrl",
        18: "alt",
        20: "capslock",
        27: "esc",
        32: "space",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        45: "ins",
        46: "del",
        91: "meta",
        93: "meta",
        224: "meta"
      };
      var _KEYCODE_MAP = {
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        186: ";",
        187: "=",
        188: ",",
        189: "-",
        190: ".",
        191: "/",
        192: "`",
        219: "[",
        220: "\\",
        221: "]",
        222: "'"
      };
      var _SHIFT_MAP = {
        "~": "`",
        "!": "1",
        "@": "2",
        "#": "3",
        "$": "4",
        "%": "5",
        "^": "6",
        "&": "7",
        "*": "8",
        "(": "9",
        ")": "0",
        "_": "-",
        "+": "=",
        ":": ";",
        '"': "'",
        "<": ",",
        ">": ".",
        "?": "/",
        "|": "\\"
      };
      var _SPECIAL_ALIASES = {
        "option": "alt",
        "command": "meta",
        "return": "enter",
        "escape": "esc",
        "plus": "+",
        "mod": /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "meta" : "ctrl"
      };
      var _REVERSE_MAP;
      for (var i = 1; i < 20; ++i) {
        _MAP[111 + i] = "f" + i;
      }
      for (i = 0; i <= 9; ++i) {
        _MAP[i + 96] = i.toString();
      }
      function _addEvent(object2, type, callback) {
        if (object2.addEventListener) {
          object2.addEventListener(type, callback, false);
          return;
        }
        object2.attachEvent("on" + type, callback);
      }
      function _characterFromEvent(e) {
        if (e.type == "keypress") {
          var character = String.fromCharCode(e.which);
          if (!e.shiftKey) {
            character = character.toLowerCase();
          }
          return character;
        }
        if (_MAP[e.which]) {
          return _MAP[e.which];
        }
        if (_KEYCODE_MAP[e.which]) {
          return _KEYCODE_MAP[e.which];
        }
        return String.fromCharCode(e.which).toLowerCase();
      }
      function _modifiersMatch(modifiers1, modifiers2) {
        return modifiers1.sort().join(",") === modifiers2.sort().join(",");
      }
      function _eventModifiers(e) {
        var modifiers = [];
        if (e.shiftKey) {
          modifiers.push("shift");
        }
        if (e.altKey) {
          modifiers.push("alt");
        }
        if (e.ctrlKey) {
          modifiers.push("ctrl");
        }
        if (e.metaKey) {
          modifiers.push("meta");
        }
        return modifiers;
      }
      function _preventDefault(e) {
        if (e.preventDefault) {
          e.preventDefault();
          return;
        }
        e.returnValue = false;
      }
      function _stopPropagation(e) {
        if (e.stopPropagation) {
          e.stopPropagation();
          return;
        }
        e.cancelBubble = true;
      }
      function _isModifier(key) {
        return key == "shift" || key == "ctrl" || key == "alt" || key == "meta";
      }
      function _getReverseMap() {
        if (!_REVERSE_MAP) {
          _REVERSE_MAP = {};
          for (var key in _MAP) {
            if (key > 95 && key < 112) {
              continue;
            }
            if (_MAP.hasOwnProperty(key)) {
              _REVERSE_MAP[_MAP[key]] = key;
            }
          }
        }
        return _REVERSE_MAP;
      }
      function _pickBestAction(key, modifiers, action2) {
        if (!action2) {
          action2 = _getReverseMap()[key] ? "keydown" : "keypress";
        }
        if (action2 == "keypress" && modifiers.length) {
          action2 = "keydown";
        }
        return action2;
      }
      function _keysFromString(combination) {
        if (combination === "+") {
          return ["+"];
        }
        combination = combination.replace(/\+{2}/g, "+plus");
        return combination.split("+");
      }
      function _getKeyInfo(combination, action2) {
        var keys;
        var key;
        var i2;
        var modifiers = [];
        keys = _keysFromString(combination);
        for (i2 = 0; i2 < keys.length; ++i2) {
          key = keys[i2];
          if (_SPECIAL_ALIASES[key]) {
            key = _SPECIAL_ALIASES[key];
          }
          if (action2 && action2 != "keypress" && _SHIFT_MAP[key]) {
            key = _SHIFT_MAP[key];
            modifiers.push("shift");
          }
          if (_isModifier(key)) {
            modifiers.push(key);
          }
        }
        action2 = _pickBestAction(key, modifiers, action2);
        return {
          key,
          modifiers,
          action: action2
        };
      }
      function _belongsTo(element, ancestor) {
        if (element === null || element === document2) {
          return false;
        }
        if (element === ancestor) {
          return true;
        }
        return _belongsTo(element.parentNode, ancestor);
      }
      function Mousetrap2(targetElement) {
        var self2 = this;
        targetElement = targetElement || document2;
        if (!(self2 instanceof Mousetrap2)) {
          return new Mousetrap2(targetElement);
        }
        self2.target = targetElement;
        self2._callbacks = {};
        self2._directMap = {};
        var _sequenceLevels = {};
        var _resetTimer;
        var _ignoreNextKeyup = false;
        var _ignoreNextKeypress = false;
        var _nextExpectedAction = false;
        function _resetSequences(doNotReset) {
          doNotReset = doNotReset || {};
          var activeSequences = false, key;
          for (key in _sequenceLevels) {
            if (doNotReset[key]) {
              activeSequences = true;
              continue;
            }
            _sequenceLevels[key] = 0;
          }
          if (!activeSequences) {
            _nextExpectedAction = false;
          }
        }
        function _getMatches(character, modifiers, e, sequenceName, combination, level) {
          var i2;
          var callback;
          var matches = [];
          var action2 = e.type;
          if (!self2._callbacks[character]) {
            return [];
          }
          if (action2 == "keyup" && _isModifier(character)) {
            modifiers = [character];
          }
          for (i2 = 0; i2 < self2._callbacks[character].length; ++i2) {
            callback = self2._callbacks[character][i2];
            if (!sequenceName && callback.seq && _sequenceLevels[callback.seq] != callback.level) {
              continue;
            }
            if (action2 != callback.action) {
              continue;
            }
            if (action2 == "keypress" && !e.metaKey && !e.ctrlKey || _modifiersMatch(modifiers, callback.modifiers)) {
              var deleteCombo = !sequenceName && callback.combo == combination;
              var deleteSequence = sequenceName && callback.seq == sequenceName && callback.level == level;
              if (deleteCombo || deleteSequence) {
                self2._callbacks[character].splice(i2, 1);
              }
              matches.push(callback);
            }
          }
          return matches;
        }
        function _fireCallback(callback, e, combo, sequence) {
          if (self2.stopCallback(e, e.target || e.srcElement, combo, sequence)) {
            return;
          }
          if (callback(e, combo) === false) {
            _preventDefault(e);
            _stopPropagation(e);
          }
        }
        self2._handleKey = function(character, modifiers, e) {
          var callbacks = _getMatches(character, modifiers, e);
          var i2;
          var doNotReset = {};
          var maxLevel = 0;
          var processedSequenceCallback = false;
          for (i2 = 0; i2 < callbacks.length; ++i2) {
            if (callbacks[i2].seq) {
              maxLevel = Math.max(maxLevel, callbacks[i2].level);
            }
          }
          for (i2 = 0; i2 < callbacks.length; ++i2) {
            if (callbacks[i2].seq) {
              if (callbacks[i2].level != maxLevel) {
                continue;
              }
              processedSequenceCallback = true;
              doNotReset[callbacks[i2].seq] = 1;
              _fireCallback(callbacks[i2].callback, e, callbacks[i2].combo, callbacks[i2].seq);
              continue;
            }
            if (!processedSequenceCallback) {
              _fireCallback(callbacks[i2].callback, e, callbacks[i2].combo);
            }
          }
          var ignoreThisKeypress = e.type == "keypress" && _ignoreNextKeypress;
          if (e.type == _nextExpectedAction && !_isModifier(character) && !ignoreThisKeypress) {
            _resetSequences(doNotReset);
          }
          _ignoreNextKeypress = processedSequenceCallback && e.type == "keydown";
        };
        function _handleKeyEvent(e) {
          if (typeof e.which !== "number") {
            e.which = e.keyCode;
          }
          var character = _characterFromEvent(e);
          if (!character) {
            return;
          }
          if (e.type == "keyup" && _ignoreNextKeyup === character) {
            _ignoreNextKeyup = false;
            return;
          }
          self2.handleKey(character, _eventModifiers(e), e);
        }
        function _resetSequenceTimer() {
          clearTimeout(_resetTimer);
          _resetTimer = setTimeout(_resetSequences, 1e3);
        }
        function _bindSequence(combo, keys, callback, action2) {
          _sequenceLevels[combo] = 0;
          function _increaseSequence(nextAction) {
            return function() {
              _nextExpectedAction = nextAction;
              ++_sequenceLevels[combo];
              _resetSequenceTimer();
            };
          }
          function _callbackAndReset(e) {
            _fireCallback(callback, e, combo);
            if (action2 !== "keyup") {
              _ignoreNextKeyup = _characterFromEvent(e);
            }
            setTimeout(_resetSequences, 10);
          }
          for (var i2 = 0; i2 < keys.length; ++i2) {
            var isFinal = i2 + 1 === keys.length;
            var wrappedCallback = isFinal ? _callbackAndReset : _increaseSequence(action2 || _getKeyInfo(keys[i2 + 1]).action);
            _bindSingle(keys[i2], wrappedCallback, action2, combo, i2);
          }
        }
        function _bindSingle(combination, callback, action2, sequenceName, level) {
          self2._directMap[combination + ":" + action2] = callback;
          combination = combination.replace(/\s+/g, " ");
          var sequence = combination.split(" ");
          var info;
          if (sequence.length > 1) {
            _bindSequence(combination, sequence, callback, action2);
            return;
          }
          info = _getKeyInfo(combination, action2);
          self2._callbacks[info.key] = self2._callbacks[info.key] || [];
          _getMatches(info.key, info.modifiers, { type: info.action }, sequenceName, combination, level);
          self2._callbacks[info.key][sequenceName ? "unshift" : "push"]({
            callback,
            modifiers: info.modifiers,
            action: info.action,
            seq: sequenceName,
            level,
            combo: combination
          });
        }
        self2._bindMultiple = function(combinations, callback, action2) {
          for (var i2 = 0; i2 < combinations.length; ++i2) {
            _bindSingle(combinations[i2], callback, action2);
          }
        };
        _addEvent(targetElement, "keypress", _handleKeyEvent);
        _addEvent(targetElement, "keydown", _handleKeyEvent);
        _addEvent(targetElement, "keyup", _handleKeyEvent);
      }
      Mousetrap2.prototype.bind = function(keys, callback, action2) {
        var self2 = this;
        keys = keys instanceof Array ? keys : [keys];
        self2._bindMultiple.call(self2, keys, callback, action2);
        return self2;
      };
      Mousetrap2.prototype.unbind = function(keys, action2) {
        var self2 = this;
        return self2.bind.call(self2, keys, function() {
        }, action2);
      };
      Mousetrap2.prototype.trigger = function(keys, action2) {
        var self2 = this;
        if (self2._directMap[keys + ":" + action2]) {
          self2._directMap[keys + ":" + action2]({}, keys);
        }
        return self2;
      };
      Mousetrap2.prototype.reset = function() {
        var self2 = this;
        self2._callbacks = {};
        self2._directMap = {};
        return self2;
      };
      Mousetrap2.prototype.stopCallback = function(e, element) {
        var self2 = this;
        if ((" " + element.className + " ").indexOf(" mousetrap ") > -1) {
          return false;
        }
        if (_belongsTo(element, self2.target)) {
          return false;
        }
        if ("composedPath" in e && typeof e.composedPath === "function") {
          var initialEventTarget = e.composedPath()[0];
          if (initialEventTarget !== e.target) {
            element = initialEventTarget;
          }
        }
        return element.tagName == "INPUT" || element.tagName == "SELECT" || element.tagName == "TEXTAREA" || element.isContentEditable;
      };
      Mousetrap2.prototype.handleKey = function() {
        var self2 = this;
        return self2._handleKey.apply(self2, arguments);
      };
      Mousetrap2.addKeycodes = function(object2) {
        for (var key in object2) {
          if (object2.hasOwnProperty(key)) {
            _MAP[key] = object2[key];
          }
        }
        _REVERSE_MAP = null;
      };
      Mousetrap2.init = function() {
        var documentMousetrap = Mousetrap2(document2);
        for (var method in documentMousetrap) {
          if (method.charAt(0) !== "_") {
            Mousetrap2[method] = function(method2) {
              return function() {
                return documentMousetrap[method2].apply(documentMousetrap, arguments);
              };
            }(method);
          }
        }
      };
      Mousetrap2.init();
      window2.Mousetrap = Mousetrap2;
      if (typeof module !== "undefined" && module.exports) {
        module.exports = Mousetrap2;
      }
      if (typeof define === "function" && define.amd) {
        define(function() {
          return Mousetrap2;
        });
      }
    })(typeof window !== "undefined" ? window : null, typeof window !== "undefined" ? document : null);
  }
});

// ../../node_modules/rbush/rbush.min.js
var require_rbush_min = __commonJS({
  "../../node_modules/rbush/rbush.min.js"(exports, module) {
    !function(t, i) {
      typeof exports == "object" && typeof module != "undefined" ? module.exports = i() : typeof define == "function" && define.amd ? define(i) : (t = t || self).RBush = i();
    }(exports, function() {
      "use strict";
      function t(t2, r2, e2, a3, h2) {
        !function t3(n2, r3, e3, a4, h3) {
          for (; a4 > e3; ) {
            if (a4 - e3 > 600) {
              var o2 = a4 - e3 + 1, s2 = r3 - e3 + 1, l3 = Math.log(o2), f3 = 0.5 * Math.exp(2 * l3 / 3), u2 = 0.5 * Math.sqrt(l3 * f3 * (o2 - f3) / o2) * (s2 - o2 / 2 < 0 ? -1 : 1), m2 = Math.max(e3, Math.floor(r3 - s2 * f3 / o2 + u2)), c2 = Math.min(a4, Math.floor(r3 + (o2 - s2) * f3 / o2 + u2));
              t3(n2, r3, m2, c2, h3);
            }
            var p2 = n2[r3], d2 = e3, x = a4;
            for (i(n2, e3, r3), h3(n2[a4], p2) > 0 && i(n2, e3, a4); d2 < x; ) {
              for (i(n2, d2, x), d2++, x--; h3(n2[d2], p2) < 0; )
                d2++;
              for (; h3(n2[x], p2) > 0; )
                x--;
            }
            h3(n2[e3], p2) === 0 ? i(n2, e3, x) : i(n2, ++x, a4), x <= r3 && (e3 = x + 1), r3 <= x && (a4 = x - 1);
          }
        }(t2, r2, e2 || 0, a3 || t2.length - 1, h2 || n);
      }
      function i(t2, i2, n2) {
        var r2 = t2[i2];
        t2[i2] = t2[n2], t2[n2] = r2;
      }
      function n(t2, i2) {
        return t2 < i2 ? -1 : t2 > i2 ? 1 : 0;
      }
      var r = function(t2) {
        t2 === void 0 && (t2 = 9), this._maxEntries = Math.max(4, t2), this._minEntries = Math.max(2, Math.ceil(0.4 * this._maxEntries)), this.clear();
      };
      function e(t2, i2, n2) {
        if (!n2)
          return i2.indexOf(t2);
        for (var r2 = 0; r2 < i2.length; r2++)
          if (n2(t2, i2[r2]))
            return r2;
        return -1;
      }
      function a2(t2, i2) {
        h(t2, 0, t2.children.length, i2, t2);
      }
      function h(t2, i2, n2, r2, e2) {
        e2 || (e2 = p(null)), e2.minX = 1 / 0, e2.minY = 1 / 0, e2.maxX = -1 / 0, e2.maxY = -1 / 0;
        for (var a3 = i2; a3 < n2; a3++) {
          var h2 = t2.children[a3];
          o(e2, t2.leaf ? r2(h2) : h2);
        }
        return e2;
      }
      function o(t2, i2) {
        return t2.minX = Math.min(t2.minX, i2.minX), t2.minY = Math.min(t2.minY, i2.minY), t2.maxX = Math.max(t2.maxX, i2.maxX), t2.maxY = Math.max(t2.maxY, i2.maxY), t2;
      }
      function s(t2, i2) {
        return t2.minX - i2.minX;
      }
      function l2(t2, i2) {
        return t2.minY - i2.minY;
      }
      function f2(t2) {
        return (t2.maxX - t2.minX) * (t2.maxY - t2.minY);
      }
      function u(t2) {
        return t2.maxX - t2.minX + (t2.maxY - t2.minY);
      }
      function m(t2, i2) {
        return t2.minX <= i2.minX && t2.minY <= i2.minY && i2.maxX <= t2.maxX && i2.maxY <= t2.maxY;
      }
      function c(t2, i2) {
        return i2.minX <= t2.maxX && i2.minY <= t2.maxY && i2.maxX >= t2.minX && i2.maxY >= t2.minY;
      }
      function p(t2) {
        return { children: t2, height: 1, leaf: true, minX: 1 / 0, minY: 1 / 0, maxX: -1 / 0, maxY: -1 / 0 };
      }
      function d(i2, n2, r2, e2, a3) {
        for (var h2 = [n2, r2]; h2.length; )
          if (!((r2 = h2.pop()) - (n2 = h2.pop()) <= e2)) {
            var o2 = n2 + Math.ceil((r2 - n2) / e2 / 2) * e2;
            t(i2, o2, n2, r2, a3), h2.push(n2, o2, o2, r2);
          }
      }
      return r.prototype.all = function() {
        return this._all(this.data, []);
      }, r.prototype.search = function(t2) {
        var i2 = this.data, n2 = [];
        if (!c(t2, i2))
          return n2;
        for (var r2 = this.toBBox, e2 = []; i2; ) {
          for (var a3 = 0; a3 < i2.children.length; a3++) {
            var h2 = i2.children[a3], o2 = i2.leaf ? r2(h2) : h2;
            c(t2, o2) && (i2.leaf ? n2.push(h2) : m(t2, o2) ? this._all(h2, n2) : e2.push(h2));
          }
          i2 = e2.pop();
        }
        return n2;
      }, r.prototype.collides = function(t2) {
        var i2 = this.data;
        if (!c(t2, i2))
          return false;
        for (var n2 = []; i2; ) {
          for (var r2 = 0; r2 < i2.children.length; r2++) {
            var e2 = i2.children[r2], a3 = i2.leaf ? this.toBBox(e2) : e2;
            if (c(t2, a3)) {
              if (i2.leaf || m(t2, a3))
                return true;
              n2.push(e2);
            }
          }
          i2 = n2.pop();
        }
        return false;
      }, r.prototype.load = function(t2) {
        if (!t2 || !t2.length)
          return this;
        if (t2.length < this._minEntries) {
          for (var i2 = 0; i2 < t2.length; i2++)
            this.insert(t2[i2]);
          return this;
        }
        var n2 = this._build(t2.slice(), 0, t2.length - 1, 0);
        if (this.data.children.length)
          if (this.data.height === n2.height)
            this._splitRoot(this.data, n2);
          else {
            if (this.data.height < n2.height) {
              var r2 = this.data;
              this.data = n2, n2 = r2;
            }
            this._insert(n2, this.data.height - n2.height - 1, true);
          }
        else
          this.data = n2;
        return this;
      }, r.prototype.insert = function(t2) {
        return t2 && this._insert(t2, this.data.height - 1), this;
      }, r.prototype.clear = function() {
        return this.data = p([]), this;
      }, r.prototype.remove = function(t2, i2) {
        if (!t2)
          return this;
        for (var n2, r2, a3, h2 = this.data, o2 = this.toBBox(t2), s2 = [], l3 = []; h2 || s2.length; ) {
          if (h2 || (h2 = s2.pop(), r2 = s2[s2.length - 1], n2 = l3.pop(), a3 = true), h2.leaf) {
            var f3 = e(t2, h2.children, i2);
            if (f3 !== -1)
              return h2.children.splice(f3, 1), s2.push(h2), this._condense(s2), this;
          }
          a3 || h2.leaf || !m(h2, o2) ? r2 ? (n2++, h2 = r2.children[n2], a3 = false) : h2 = null : (s2.push(h2), l3.push(n2), n2 = 0, r2 = h2, h2 = h2.children[0]);
        }
        return this;
      }, r.prototype.toBBox = function(t2) {
        return t2;
      }, r.prototype.compareMinX = function(t2, i2) {
        return t2.minX - i2.minX;
      }, r.prototype.compareMinY = function(t2, i2) {
        return t2.minY - i2.minY;
      }, r.prototype.toJSON = function() {
        return this.data;
      }, r.prototype.fromJSON = function(t2) {
        return this.data = t2, this;
      }, r.prototype._all = function(t2, i2) {
        for (var n2 = []; t2; )
          t2.leaf ? i2.push.apply(i2, t2.children) : n2.push.apply(n2, t2.children), t2 = n2.pop();
        return i2;
      }, r.prototype._build = function(t2, i2, n2, r2) {
        var e2, h2 = n2 - i2 + 1, o2 = this._maxEntries;
        if (h2 <= o2)
          return a2(e2 = p(t2.slice(i2, n2 + 1)), this.toBBox), e2;
        r2 || (r2 = Math.ceil(Math.log(h2) / Math.log(o2)), o2 = Math.ceil(h2 / Math.pow(o2, r2 - 1))), (e2 = p([])).leaf = false, e2.height = r2;
        var s2 = Math.ceil(h2 / o2), l3 = s2 * Math.ceil(Math.sqrt(o2));
        d(t2, i2, n2, l3, this.compareMinX);
        for (var f3 = i2; f3 <= n2; f3 += l3) {
          var u2 = Math.min(f3 + l3 - 1, n2);
          d(t2, f3, u2, s2, this.compareMinY);
          for (var m2 = f3; m2 <= u2; m2 += s2) {
            var c2 = Math.min(m2 + s2 - 1, u2);
            e2.children.push(this._build(t2, m2, c2, r2 - 1));
          }
        }
        return a2(e2, this.toBBox), e2;
      }, r.prototype._chooseSubtree = function(t2, i2, n2, r2) {
        for (; r2.push(i2), !i2.leaf && r2.length - 1 !== n2; ) {
          for (var e2 = 1 / 0, a3 = 1 / 0, h2 = void 0, o2 = 0; o2 < i2.children.length; o2++) {
            var s2 = i2.children[o2], l3 = f2(s2), u2 = (m2 = t2, c2 = s2, (Math.max(c2.maxX, m2.maxX) - Math.min(c2.minX, m2.minX)) * (Math.max(c2.maxY, m2.maxY) - Math.min(c2.minY, m2.minY)) - l3);
            u2 < a3 ? (a3 = u2, e2 = l3 < e2 ? l3 : e2, h2 = s2) : u2 === a3 && l3 < e2 && (e2 = l3, h2 = s2);
          }
          i2 = h2 || i2.children[0];
        }
        var m2, c2;
        return i2;
      }, r.prototype._insert = function(t2, i2, n2) {
        var r2 = n2 ? t2 : this.toBBox(t2), e2 = [], a3 = this._chooseSubtree(r2, this.data, i2, e2);
        for (a3.children.push(t2), o(a3, r2); i2 >= 0 && e2[i2].children.length > this._maxEntries; )
          this._split(e2, i2), i2--;
        this._adjustParentBBoxes(r2, e2, i2);
      }, r.prototype._split = function(t2, i2) {
        var n2 = t2[i2], r2 = n2.children.length, e2 = this._minEntries;
        this._chooseSplitAxis(n2, e2, r2);
        var h2 = this._chooseSplitIndex(n2, e2, r2), o2 = p(n2.children.splice(h2, n2.children.length - h2));
        o2.height = n2.height, o2.leaf = n2.leaf, a2(n2, this.toBBox), a2(o2, this.toBBox), i2 ? t2[i2 - 1].children.push(o2) : this._splitRoot(n2, o2);
      }, r.prototype._splitRoot = function(t2, i2) {
        this.data = p([t2, i2]), this.data.height = t2.height + 1, this.data.leaf = false, a2(this.data, this.toBBox);
      }, r.prototype._chooseSplitIndex = function(t2, i2, n2) {
        for (var r2, e2, a3, o2, s2, l3, u2, m2 = 1 / 0, c2 = 1 / 0, p2 = i2; p2 <= n2 - i2; p2++) {
          var d2 = h(t2, 0, p2, this.toBBox), x = h(t2, p2, n2, this.toBBox), v = (e2 = d2, a3 = x, o2 = void 0, s2 = void 0, l3 = void 0, u2 = void 0, o2 = Math.max(e2.minX, a3.minX), s2 = Math.max(e2.minY, a3.minY), l3 = Math.min(e2.maxX, a3.maxX), u2 = Math.min(e2.maxY, a3.maxY), Math.max(0, l3 - o2) * Math.max(0, u2 - s2)), M = f2(d2) + f2(x);
          v < m2 ? (m2 = v, r2 = p2, c2 = M < c2 ? M : c2) : v === m2 && M < c2 && (c2 = M, r2 = p2);
        }
        return r2 || n2 - i2;
      }, r.prototype._chooseSplitAxis = function(t2, i2, n2) {
        var r2 = t2.leaf ? this.compareMinX : s, e2 = t2.leaf ? this.compareMinY : l2;
        this._allDistMargin(t2, i2, n2, r2) < this._allDistMargin(t2, i2, n2, e2) && t2.children.sort(r2);
      }, r.prototype._allDistMargin = function(t2, i2, n2, r2) {
        t2.children.sort(r2);
        for (var e2 = this.toBBox, a3 = h(t2, 0, i2, e2), s2 = h(t2, n2 - i2, n2, e2), l3 = u(a3) + u(s2), f3 = i2; f3 < n2 - i2; f3++) {
          var m2 = t2.children[f3];
          o(a3, t2.leaf ? e2(m2) : m2), l3 += u(a3);
        }
        for (var c2 = n2 - i2 - 1; c2 >= i2; c2--) {
          var p2 = t2.children[c2];
          o(s2, t2.leaf ? e2(p2) : p2), l3 += u(s2);
        }
        return l3;
      }, r.prototype._adjustParentBBoxes = function(t2, i2, n2) {
        for (var r2 = n2; r2 >= 0; r2--)
          o(i2[r2], t2);
      }, r.prototype._condense = function(t2) {
        for (var i2 = t2.length - 1, n2 = void 0; i2 >= 0; i2--)
          t2[i2].children.length === 0 ? i2 > 0 ? (n2 = t2[i2 - 1].children).splice(n2.indexOf(t2[i2]), 1) : this.clear() : a2(t2[i2], this.toBBox);
      }, r;
    });
  }
});

// ../../node_modules/nanoid/index.prod.js
if (false) {
  if (typeof navigator !== "undefined" && navigator.product === "ReactNative" && typeof crypto === "undefined") {
    throw new Error("React Native does not have a built-in secure random generator. If you don\u2019t need unpredictable IDs use `nanoid/non-secure`. For secure IDs, import `react-native-get-random-values` before Nano ID.");
  }
  if (typeof msCrypto !== "undefined" && typeof crypto === "undefined") {
    throw new Error("Import file with `if (!window.crypto) window.crypto = window.msCrypto` before importing Nano ID to fix IE 11 support");
  }
  if (typeof crypto === "undefined") {
    throw new Error("Your browser does not have secure random generator. If you don\u2019t need unpredictable IDs, you can use nanoid/non-secure.");
  }
}
var nanoid = (size = 21) => {
  let id = "";
  let bytes = crypto.getRandomValues(new Uint8Array(size));
  while (size--) {
    let byte = bytes[size] & 63;
    if (byte < 36) {
      id += byte.toString(36);
    } else if (byte < 62) {
      id += (byte - 26).toString(36).toUpperCase();
    } else if (byte < 63) {
      id += "_";
    } else {
      id += "-";
    }
  }
  return id;
};

// ../../packages/utils/vec/dist/esm/index.js
var __defProp2 = Object.defineProperty;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField2 = (obj, key, value) => {
  __defNormalProp2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var _Vec = class {
  static clamp(n, min, max) {
    return Math.max(min, typeof max !== "undefined" ? Math.min(n, max) : n);
  }
  static clampV(A, min, max) {
    return A.map((n) => max ? _Vec.clamp(n, min, max) : _Vec.clamp(n, min));
  }
  static cross(x, y, z) {
    return (y[0] - x[0]) * (z[1] - x[1]) - (z[0] - x[0]) * (y[1] - x[1]);
  }
  static snap(a2, step = 1) {
    return [Math.round(a2[0] / step) * step, Math.round(a2[1] / step) * step];
  }
};
var Vec = _Vec;
__publicField2(Vec, "neg", (A) => {
  return [-A[0], -A[1]];
});
__publicField2(Vec, "add", (A, B) => {
  return [A[0] + B[0], A[1] + B[1]];
});
__publicField2(Vec, "addScalar", (A, n) => {
  return [A[0] + n, A[1] + n];
});
__publicField2(Vec, "sub", (A, B) => {
  return [A[0] - B[0], A[1] - B[1]];
});
__publicField2(Vec, "subScalar", (A, n) => {
  return [A[0] - n, A[1] - n];
});
__publicField2(Vec, "vec", (A, B) => {
  return [B[0] - A[0], B[1] - A[1]];
});
__publicField2(Vec, "mul", (A, n) => {
  return [A[0] * n, A[1] * n];
});
__publicField2(Vec, "mulV", (A, B) => {
  return [A[0] * B[0], A[1] * B[1]];
});
__publicField2(Vec, "div", (A, n) => {
  return [A[0] / n, A[1] / n];
});
__publicField2(Vec, "divV", (A, B) => {
  return [A[0] / B[0], A[1] / B[1]];
});
__publicField2(Vec, "per", (A) => {
  return [A[1], -A[0]];
});
__publicField2(Vec, "dpr", (A, B) => {
  return A[0] * B[0] + A[1] * B[1];
});
__publicField2(Vec, "cpr", (A, B) => {
  return A[0] * B[1] - B[0] * A[1];
});
__publicField2(Vec, "len2", (A) => {
  return A[0] * A[0] + A[1] * A[1];
});
__publicField2(Vec, "len", (A) => {
  return Math.hypot(A[0], A[1]);
});
__publicField2(Vec, "pry", (A, B) => {
  return _Vec.dpr(A, B) / _Vec.len(B);
});
__publicField2(Vec, "uni", (A) => {
  return _Vec.div(A, _Vec.len(A));
});
__publicField2(Vec, "normalize", (A) => {
  return _Vec.uni(A);
});
__publicField2(Vec, "tangent", (A, B) => {
  return _Vec.uni(_Vec.sub(A, B));
});
__publicField2(Vec, "dist2", (A, B) => {
  return _Vec.len2(_Vec.sub(A, B));
});
__publicField2(Vec, "dist", (A, B) => {
  return Math.hypot(A[1] - B[1], A[0] - B[0]);
});
__publicField2(Vec, "fastDist", (A, B) => {
  const V3 = [B[0] - A[0], B[1] - A[1]];
  const aV = [Math.abs(V3[0]), Math.abs(V3[1])];
  let r = 1 / Math.max(aV[0], aV[1]);
  r = r * (1.29289 - (aV[0] + aV[1]) * r * 0.29289);
  return [V3[0] * r, V3[1] * r];
});
__publicField2(Vec, "ang", (A, B) => {
  return Math.atan2(_Vec.cpr(A, B), _Vec.dpr(A, B));
});
__publicField2(Vec, "angle", (A, B) => {
  return Math.atan2(B[1] - A[1], B[0] - A[0]);
});
__publicField2(Vec, "med", (A, B) => {
  return _Vec.mul(_Vec.add(A, B), 0.5);
});
__publicField2(Vec, "rot", (A, r = 0) => {
  return [A[0] * Math.cos(r) - A[1] * Math.sin(r), A[0] * Math.sin(r) + A[1] * Math.cos(r)];
});
__publicField2(Vec, "rotWith", (A, C, r = 0) => {
  if (r === 0)
    return A;
  const s = Math.sin(r);
  const c = Math.cos(r);
  const px = A[0] - C[0];
  const py = A[1] - C[1];
  const nx = px * c - py * s;
  const ny = px * s + py * c;
  return [nx + C[0], ny + C[1]];
});
__publicField2(Vec, "isEqual", (A, B) => {
  return A[0] === B[0] && A[1] === B[1];
});
__publicField2(Vec, "lrp", (A, B, t) => {
  return _Vec.add(A, _Vec.mul(_Vec.sub(B, A), t));
});
__publicField2(Vec, "int", (A, B, from, to, s = 1) => {
  const t = (_Vec.clamp(from, to) - from) / (to - from);
  return _Vec.add(_Vec.mul(A, 1 - t), _Vec.mul(B, s));
});
__publicField2(Vec, "ang3", (p1, pc, p2) => {
  const v1 = _Vec.vec(pc, p1);
  const v2 = _Vec.vec(pc, p2);
  return _Vec.ang(v1, v2);
});
__publicField2(Vec, "abs", (A) => {
  return [Math.abs(A[0]), Math.abs(A[1])];
});
__publicField2(Vec, "rescale", (a2, n) => {
  const l2 = _Vec.len(a2);
  return [n * a2[0] / l2, n * a2[1] / l2];
});
__publicField2(Vec, "isLeft", (p1, pc, p2) => {
  return (pc[0] - p1[0]) * (p2[1] - p1[1]) - (p2[0] - p1[0]) * (pc[1] - p1[1]);
});
__publicField2(Vec, "clockwise", (p1, pc, p2) => {
  return _Vec.isLeft(p1, pc, p2) > 0;
});
__publicField2(Vec, "toFixed", (a2, d = 2) => {
  return a2.map((v) => +v.toFixed(d));
});
__publicField2(Vec, "nearestPointOnLineThroughPoint", (A, u, P) => {
  return _Vec.add(A, _Vec.mul(u, _Vec.pry(_Vec.sub(P, A), u)));
});
__publicField2(Vec, "distanceToLineThroughPoint", (A, u, P) => {
  return _Vec.dist(P, _Vec.nearestPointOnLineThroughPoint(A, u, P));
});
__publicField2(Vec, "nearestPointOnLineSegment", (A, B, P, clamp2 = true) => {
  const u = _Vec.uni(_Vec.sub(B, A));
  const C = _Vec.add(A, _Vec.mul(u, _Vec.pry(_Vec.sub(P, A), u)));
  if (clamp2) {
    if (C[0] < Math.min(A[0], B[0]))
      return A[0] < B[0] ? A : B;
    if (C[0] > Math.max(A[0], B[0]))
      return A[0] > B[0] ? A : B;
    if (C[1] < Math.min(A[1], B[1]))
      return A[1] < B[1] ? A : B;
    if (C[1] > Math.max(A[1], B[1]))
      return A[1] > B[1] ? A : B;
  }
  return C;
});
__publicField2(Vec, "distanceToLineSegment", (A, B, P, clamp2 = true) => {
  return _Vec.dist(P, _Vec.nearestPointOnLineSegment(A, B, P, clamp2));
});
__publicField2(Vec, "nudge", (A, B, d) => {
  return _Vec.add(A, _Vec.mul(_Vec.uni(_Vec.sub(B, A)), d));
});
__publicField2(Vec, "nudgeAtAngle", (A, a2, d) => {
  return [Math.cos(a2) * d + A[0], Math.sin(a2) * d + A[1]];
});
__publicField2(Vec, "toPrecision", (a2, n = 4) => {
  return [+a2[0].toPrecision(n), +a2[1].toPrecision(n)];
});
__publicField2(Vec, "pointsBetween", (A, B, steps = 6) => {
  return Array.from(Array(steps)).map((_15, i) => {
    const t = i / (steps - 1);
    const k = Math.min(1, 0.5 + Math.abs(0.5 - t));
    return [..._Vec.lrp(A, B, t), k];
  });
});
__publicField2(Vec, "slope", (A, B) => {
  if (A[0] === B[0])
    return NaN;
  return (A[1] - B[1]) / (A[0] - B[0]);
});
__publicField2(Vec, "toAngle", (A) => {
  const angle = Math.atan2(A[1], A[0]);
  if (angle < 0)
    return angle + Math.PI * 2;
  return angle;
});
__publicField2(Vec, "max", (...v) => {
  return [Math.max(...v.map((a2) => a2[0])), Math.max(...v.map((a2) => a2[1]))];
});
__publicField2(Vec, "min", (...v) => {
  return [Math.min(...v.map((a2) => a2[0])), Math.min(...v.map((a2) => a2[1]))];
});
var src_default = Vec;

// ../../packages/core/dist/esm/index.js
var import_mousetrap = __toESM(require_mousetrap());

// ../../packages/utils/intersect/dist/esm/index.js
var __defProp3 = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp3 = (obj, key, value) => key in obj ? __defProp3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a2, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp2.call(b, prop))
      __defNormalProp3(a2, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp3(a2, prop, b[prop]);
    }
  return a2;
};
var __spreadProps = (a2, b) => __defProps(a2, __getOwnPropDescs(b));
function createIntersection(message, ...points) {
  const didIntersect = points.length > 0;
  return { didIntersect, message, points };
}
function getRectangleSides(point, size, rotation = 0) {
  const center = [point[0] + size[0] / 2, point[1] + size[1] / 2];
  const tl = Vec.rotWith(point, center, rotation);
  const tr = Vec.rotWith(Vec.add(point, [size[0], 0]), center, rotation);
  const br = Vec.rotWith(Vec.add(point, size), center, rotation);
  const bl = Vec.rotWith(Vec.add(point, [0, size[1]]), center, rotation);
  return [
    [tl, tr],
    [tr, br],
    [br, bl],
    [bl, tl]
  ];
}
function intersectLineLine(AB, PQ) {
  const slopeAB = Vec.slope(AB[0], AB[1]);
  const slopePQ = Vec.slope(PQ[0], PQ[1]);
  if (slopeAB === slopePQ)
    return createIntersection("no intersection");
  if (Number.isNaN(slopeAB) && !Number.isNaN(slopePQ)) {
    return createIntersection("intersection", [
      AB[0][0],
      (AB[0][0] - PQ[0][0]) * slopePQ + PQ[0][1]
    ]);
  }
  if (Number.isNaN(slopePQ) && !Number.isNaN(slopeAB)) {
    return createIntersection("intersection", [
      PQ[0][0],
      (PQ[0][0] - AB[0][0]) * slopeAB + AB[0][1]
    ]);
  }
  const x = (slopeAB * AB[0][0] - slopePQ * PQ[0][0] + PQ[0][1] - AB[0][1]) / (slopeAB - slopePQ);
  const y = slopePQ * (x - PQ[0][0]) + PQ[0][1];
  return createIntersection("intersection", [x, y]);
}
function intersectRayLineSegment(origin, direction, a1, a2) {
  const [x, y] = origin;
  const [dx, dy] = direction;
  const [x1, y1] = a1;
  const [x2, y2] = a2;
  if (dy / dx !== (y2 - y1) / (x2 - x1)) {
    const d = dx * (y2 - y1) - dy * (x2 - x1);
    if (d !== 0) {
      const r = ((y - y1) * (x2 - x1) - (x - x1) * (y2 - y1)) / d;
      const s = ((y - y1) * dx - (x - x1) * dy) / d;
      if (r >= 0 && s >= 0 && s <= 1) {
        return createIntersection("intersection", [x + r * dx, y + r * dy]);
      }
    }
  }
  return createIntersection("no intersection");
}
function intersectLineSegmentLineSegment(a1, a2, b1, b2) {
  const AB = Vec.sub(a1, b1);
  const BV = Vec.sub(b2, b1);
  const AV = Vec.sub(a2, a1);
  const ua_t = BV[0] * AB[1] - BV[1] * AB[0];
  const ub_t = AV[0] * AB[1] - AV[1] * AB[0];
  const u_b = BV[1] * AV[0] - BV[0] * AV[1];
  if (ua_t === 0 || ub_t === 0)
    return createIntersection("coincident");
  if (u_b === 0)
    return createIntersection("parallel");
  if (u_b !== 0) {
    const ua = ua_t / u_b;
    const ub = ub_t / u_b;
    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
      return createIntersection("intersection", Vec.add(a1, Vec.mul(AV, ua)));
    }
  }
  return createIntersection("no intersection");
}
function intersectLineSegmentRectangle(a1, a2, point, size) {
  return intersectRectangleLineSegment(point, size, a1, a2);
}
function intersectLineSegmentCircle(a1, a2, c, r) {
  const a3 = (a2[0] - a1[0]) * (a2[0] - a1[0]) + (a2[1] - a1[1]) * (a2[1] - a1[1]);
  const b = 2 * ((a2[0] - a1[0]) * (a1[0] - c[0]) + (a2[1] - a1[1]) * (a1[1] - c[1]));
  const cc = c[0] * c[0] + c[1] * c[1] + a1[0] * a1[0] + a1[1] * a1[1] - 2 * (c[0] * a1[0] + c[1] * a1[1]) - r * r;
  const deter = b * b - 4 * a3 * cc;
  if (deter < 0)
    return createIntersection("outside");
  if (deter === 0)
    return createIntersection("tangent");
  const e = Math.sqrt(deter);
  const u1 = (-b + e) / (2 * a3);
  const u2 = (-b - e) / (2 * a3);
  if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
    if (u1 < 0 && u2 < 0 || u1 > 1 && u2 > 1) {
      return createIntersection("outside");
    } else
      return createIntersection("inside");
  }
  const results = [];
  if (0 <= u1 && u1 <= 1)
    results.push(Vec.lrp(a1, a2, u1));
  if (0 <= u2 && u2 <= 1)
    results.push(Vec.lrp(a1, a2, u2));
  return createIntersection("intersection", ...results);
}
function intersectLineSegmentEllipse(a1, a2, center, rx, ry, rotation = 0) {
  if (rx === 0 || ry === 0 || Vec.isEqual(a1, a2))
    return createIntersection("no intersection");
  rx = rx < 0 ? rx : -rx;
  ry = ry < 0 ? ry : -ry;
  a1 = Vec.sub(Vec.rotWith(a1, center, -rotation), center);
  a2 = Vec.sub(Vec.rotWith(a2, center, -rotation), center);
  const diff = Vec.sub(a2, a1);
  const A = diff[0] * diff[0] / rx / rx + diff[1] * diff[1] / ry / ry;
  const B = 2 * a1[0] * diff[0] / rx / rx + 2 * a1[1] * diff[1] / ry / ry;
  const C = a1[0] * a1[0] / rx / rx + a1[1] * a1[1] / ry / ry - 1;
  const tValues = [];
  const discriminant = B * B - 4 * A * C;
  if (discriminant === 0) {
    tValues.push(-B / 2 / A);
  } else if (discriminant > 0) {
    const root = Math.sqrt(discriminant);
    tValues.push((-B + root) / 2 / A);
    tValues.push((-B - root) / 2 / A);
  }
  return createIntersection("intersection", ...tValues.filter((t) => t >= 0 && t <= 1).map((t) => Vec.add(center, Vec.add(a1, Vec.mul(Vec.sub(a2, a1), t)))).map((p) => Vec.rotWith(p, center, rotation)));
}
function intersectLineSegmentBounds(a1, a2, bounds) {
  return intersectBoundsLineSegment(bounds, a1, a2);
}
function intersectLineSegmentPolyline(a1, a2, points) {
  const pts = [];
  for (let i = 1; i < points.length; i++) {
    const int = intersectLineSegmentLineSegment(a1, a2, points[i - 1], points[i]);
    if (int)
      pts.push(...int.points);
  }
  if (pts.length === 0)
    return createIntersection("no intersection");
  return createIntersection("intersection", ...points);
}
function intersectLineSegmentPolygon(a1, a2, points) {
  const pts = [];
  for (let i = 1; i < points.length + 1; i++) {
    const int = intersectLineSegmentLineSegment(a1, a2, points[i - 1], points[i % points.length]);
    if (int)
      pts.push(...int.points);
  }
  if (!pts.length)
    return createIntersection("no intersection");
  return createIntersection("intersection", ...points);
}
function intersectRectangleLineSegment(point, size, a1, a2) {
  return getRectangleSides(point, size).reduce((acc, [b1, b2], i) => {
    const intersection = intersectLineSegmentLineSegment(a1, a2, b1, b2);
    if (intersection)
      acc.push(createIntersection(SIDES[i], ...intersection.points));
    return acc;
  }, []).filter((int) => int.didIntersect);
}
function intersectRectangleCircle(point, size, c, r) {
  return getRectangleSides(point, size).reduce((acc, [a1, a2], i) => {
    const intersection = intersectLineSegmentCircle(a1, a2, c, r);
    if (intersection)
      acc.push(__spreadProps(__spreadValues({}, intersection), { message: SIDES[i] }));
    return acc;
  }, []).filter((int) => int.didIntersect);
}
function intersectRectangleEllipse(point, size, c, rx, ry, rotation = 0) {
  return getRectangleSides(point, size).reduce((acc, [a1, a2], i) => {
    const intersection = intersectLineSegmentEllipse(a1, a2, c, rx, ry, rotation);
    if (intersection)
      acc.push(__spreadProps(__spreadValues({}, intersection), { message: SIDES[i] }));
    return acc;
  }, []).filter((int) => int.didIntersect);
}
function intersectRectanglePolyline(point, size, points) {
  return getRectangleSides(point, size).reduce((acc, [a1, a2], i) => {
    const intersection = intersectLineSegmentPolyline(a1, a2, points);
    if (intersection.didIntersect)
      acc.push(createIntersection(SIDES[i], ...intersection.points));
    return acc;
  }, []).filter((int) => int.didIntersect);
}
function intersectRectanglePolygon(point, size, points) {
  return getRectangleSides(point, size).reduce((acc, [a1, a2], i) => {
    const intersection = intersectLineSegmentPolygon(a1, a2, points);
    if (intersection.didIntersect)
      acc.push(createIntersection(SIDES[i], ...intersection.points));
    return acc;
  }, []).filter((int) => int.didIntersect);
}
function intersectEllipseRectangle(center, rx, ry, rotation = 0, point, size) {
  if (rx === ry)
    return intersectRectangleCircle(point, size, center, rx);
  return intersectRectangleEllipse(point, size, center, rx, ry, rotation);
}
function intersectEllipseBounds(c, rx, ry, rotation, bounds) {
  const { minX, minY, width, height } = bounds;
  return intersectEllipseRectangle(c, rx, ry, rotation, [minX, minY], [width, height]);
}
function intersectBoundsLineSegment(bounds, a1, a2) {
  const { minX, minY, width, height } = bounds;
  return intersectLineSegmentRectangle(a1, a2, [minX, minY], [width, height]);
}
function intersectPolylineBounds(points, bounds) {
  return intersectRectanglePolyline([bounds.minX, bounds.minY], [bounds.width, bounds.height], points);
}
function intersectPolygonBounds(points, bounds) {
  return intersectRectanglePolygon([bounds.minX, bounds.minY], [bounds.width, bounds.height], points);
}
var SIDES = ["top", "right", "bottom", "left"];

// ../../node_modules/mobx/dist/mobx.esm.js
var niceErrors = {
  0: "Invalid value for configuration 'enforceActions', expected 'never', 'always' or 'observed'",
  1: function _(annotationType, key) {
    return "Cannot apply '" + annotationType + "' to '" + key.toString() + "': Field not found.";
  },
  5: "'keys()' can only be used on observable objects, arrays, sets and maps",
  6: "'values()' can only be used on observable objects, arrays, sets and maps",
  7: "'entries()' can only be used on observable objects, arrays and maps",
  8: "'set()' can only be used on observable objects, arrays and maps",
  9: "'remove()' can only be used on observable objects, arrays and maps",
  10: "'has()' can only be used on observable objects, arrays and maps",
  11: "'get()' can only be used on observable objects, arrays and maps",
  12: "Invalid annotation",
  13: "Dynamic observable objects cannot be frozen",
  14: "Intercept handlers should return nothing or a change object",
  15: "Observable arrays cannot be frozen",
  16: "Modification exception: the internal structure of an observable array was changed.",
  17: function _2(index, length) {
    return "[mobx.array] Index out of bounds, " + index + " is larger than " + length;
  },
  18: "mobx.map requires Map polyfill for the current browser. Check babel-polyfill or core-js/es6/map.js",
  19: function _3(other) {
    return "Cannot initialize from classes that inherit from Map: " + other.constructor.name;
  },
  20: function _4(other) {
    return "Cannot initialize map from " + other;
  },
  21: function _5(dataStructure) {
    return "Cannot convert to map from '" + dataStructure + "'";
  },
  22: "mobx.set requires Set polyfill for the current browser. Check babel-polyfill or core-js/es6/set.js",
  23: "It is not possible to get index atoms from arrays",
  24: function _6(thing) {
    return "Cannot obtain administration from " + thing;
  },
  25: function _7(property, name) {
    return "the entry '" + property + "' does not exist in the observable map '" + name + "'";
  },
  26: "please specify a property",
  27: function _8(property, name) {
    return "no observable property '" + property.toString() + "' found on the observable object '" + name + "'";
  },
  28: function _9(thing) {
    return "Cannot obtain atom from " + thing;
  },
  29: "Expecting some object",
  30: "invalid action stack. did you forget to finish an action?",
  31: "missing option for computed: get",
  32: function _10(name, derivation) {
    return "Cycle detected in computation " + name + ": " + derivation;
  },
  33: function _11(name) {
    return "The setter of computed value '" + name + "' is trying to update itself. Did you intend to update an _observable_ value, instead of the computed property?";
  },
  34: function _12(name) {
    return "[ComputedValue '" + name + "'] It is not possible to assign a new value to a computed value.";
  },
  35: "There are multiple, different versions of MobX active. Make sure MobX is loaded only once or use `configure({ isolateGlobalState: true })`",
  36: "isolateGlobalState should be called before MobX is running any reactions",
  37: function _13(method) {
    return "[mobx] `observableArray." + method + "()` mutates the array in-place, which is not allowed inside a derivation. Use `array.slice()." + method + "()` instead";
  },
  38: "'ownKeys()' can only be used on observable objects",
  39: "'defineProperty()' can only be used on observable objects"
};
var errors = true ? niceErrors : {};
function die(error) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  if (true) {
    var e = typeof error === "string" ? error : errors[error];
    if (typeof e === "function")
      e = e.apply(null, args);
    throw new Error("[MobX] " + e);
  }
  throw new Error(typeof error === "number" ? "[MobX] minified error nr: " + error + (args.length ? " " + args.map(String).join(",") : "") + ". Find the full error at: https://github.com/mobxjs/mobx/blob/main/packages/mobx/src/errors.ts" : "[MobX] " + error);
}
var mockGlobal = {};
function getGlobal() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  return mockGlobal;
}
var assign = Object.assign;
var getDescriptor = Object.getOwnPropertyDescriptor;
var defineProperty = Object.defineProperty;
var objectPrototype = Object.prototype;
var EMPTY_ARRAY = [];
Object.freeze(EMPTY_ARRAY);
var EMPTY_OBJECT = {};
Object.freeze(EMPTY_OBJECT);
var hasProxy = typeof Proxy !== "undefined";
var plainObjectString = /* @__PURE__ */ Object.toString();
function assertProxies() {
  if (!hasProxy) {
    die(true ? "`Proxy` objects are not available in the current environment. Please configure MobX to enable a fallback implementation.`" : "Proxy not available");
  }
}
function warnAboutProxyRequirement(msg) {
  if (globalState.verifyProxies) {
    die("MobX is currently configured to be able to run in ES5 mode, but in ES5 MobX won't be able to " + msg);
  }
}
function getNextId() {
  return ++globalState.mobxGuid;
}
function once(func) {
  var invoked = false;
  return function() {
    if (invoked)
      return;
    invoked = true;
    return func.apply(this, arguments);
  };
}
var noop = function noop2() {
};
function isFunction(fn) {
  return typeof fn === "function";
}
function isStringish(value) {
  var t = typeof value;
  switch (t) {
    case "string":
    case "symbol":
    case "number":
      return true;
  }
  return false;
}
function isObject(value) {
  return value !== null && typeof value === "object";
}
function isPlainObject(value) {
  var _proto$constructor;
  if (!isObject(value))
    return false;
  var proto = Object.getPrototypeOf(value);
  if (proto == null)
    return true;
  return ((_proto$constructor = proto.constructor) == null ? void 0 : _proto$constructor.toString()) === plainObjectString;
}
function isGenerator(obj) {
  var constructor = obj == null ? void 0 : obj.constructor;
  if (!constructor)
    return false;
  if (constructor.name === "GeneratorFunction" || constructor.displayName === "GeneratorFunction")
    return true;
  return false;
}
function addHiddenProp(object2, propName, value) {
  defineProperty(object2, propName, {
    enumerable: false,
    writable: true,
    configurable: true,
    value
  });
}
function addHiddenFinalProp(object2, propName, value) {
  defineProperty(object2, propName, {
    enumerable: false,
    writable: false,
    configurable: true,
    value
  });
}
function createInstanceofPredicate(name, theClass) {
  var propName = "isMobX" + name;
  theClass.prototype[propName] = true;
  return function(x) {
    return isObject(x) && x[propName] === true;
  };
}
function isES6Map(thing) {
  return thing instanceof Map;
}
function isES6Set(thing) {
  return thing instanceof Set;
}
var hasGetOwnPropertySymbols = typeof Object.getOwnPropertySymbols !== "undefined";
function getPlainObjectKeys(object2) {
  var keys = Object.keys(object2);
  if (!hasGetOwnPropertySymbols)
    return keys;
  var symbols = Object.getOwnPropertySymbols(object2);
  if (!symbols.length)
    return keys;
  return [].concat(keys, symbols.filter(function(s) {
    return objectPrototype.propertyIsEnumerable.call(object2, s);
  }));
}
var ownKeys = typeof Reflect !== "undefined" && Reflect.ownKeys ? Reflect.ownKeys : hasGetOwnPropertySymbols ? function(obj) {
  return Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj));
} : Object.getOwnPropertyNames;
function stringifyKey(key) {
  if (typeof key === "string")
    return key;
  if (typeof key === "symbol")
    return key.toString();
  return new String(key).toString();
}
function toPrimitive(value) {
  return value === null ? null : typeof value === "object" ? "" + value : value;
}
function hasProp(target, prop) {
  return objectPrototype.hasOwnProperty.call(target, prop);
}
var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function getOwnPropertyDescriptors2(target) {
  var res = {};
  ownKeys(target).forEach(function(key) {
    res[key] = getDescriptor(target, key);
  });
  return res;
};
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties(Constructor, staticProps);
  return Constructor;
}
function _extends() {
  _extends = Object.assign || function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}
function _assertThisInitialized(self2) {
  if (self2 === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self2;
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o)
    return;
  if (typeof o === "string")
    return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor)
    n = o.constructor.name;
  if (n === "Map" || n === "Set")
    return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++)
    arr2[i] = arr[i];
  return arr2;
}
function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var it;
  if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it)
        o = it;
      var i = 0;
      return function() {
        if (i >= o.length)
          return {
            done: true
          };
        return {
          done: false,
          value: o[i++]
        };
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  it = o[Symbol.iterator]();
  return it.next.bind(it);
}
var storedAnnotationsSymbol = /* @__PURE__ */ Symbol("mobx-stored-annotations");
function createDecoratorAnnotation(annotation) {
  function decorator(target, property) {
    storeAnnotation(target, property, annotation);
  }
  return Object.assign(decorator, annotation);
}
function storeAnnotation(prototype, key, annotation) {
  if (!hasProp(prototype, storedAnnotationsSymbol)) {
    addHiddenProp(prototype, storedAnnotationsSymbol, _extends({}, prototype[storedAnnotationsSymbol]));
  }
  if (isOverride(annotation) && !hasProp(prototype[storedAnnotationsSymbol], key)) {
    var fieldName = prototype.constructor.name + ".prototype." + key.toString();
    die("'" + fieldName + "' is decorated with 'override', but no such decorated member was found on prototype.");
  }
  assertNotDecorated(prototype, annotation, key);
  if (!isOverride(annotation)) {
    prototype[storedAnnotationsSymbol][key] = annotation;
  }
}
function assertNotDecorated(prototype, annotation, key) {
  if (!isOverride(annotation) && hasProp(prototype[storedAnnotationsSymbol], key)) {
    var fieldName = prototype.constructor.name + ".prototype." + key.toString();
    var currentAnnotationType = prototype[storedAnnotationsSymbol][key].annotationType_;
    var requestedAnnotationType = annotation.annotationType_;
    die("Cannot apply '@" + requestedAnnotationType + "' to '" + fieldName + "':" + ("\nThe field is already decorated with '@" + currentAnnotationType + "'.") + "\nRe-decorating fields is not allowed.\nUse '@override' decorator for methods overriden by subclass.");
  }
}
function collectStoredAnnotations(target) {
  if (!hasProp(target, storedAnnotationsSymbol)) {
    if (!target[storedAnnotationsSymbol]) {
      die("No annotations were passed to makeObservable, but no decorated members have been found either");
    }
    addHiddenProp(target, storedAnnotationsSymbol, _extends({}, target[storedAnnotationsSymbol]));
  }
  return target[storedAnnotationsSymbol];
}
var $mobx = /* @__PURE__ */ Symbol("mobx administration");
var Atom = /* @__PURE__ */ function() {
  function Atom2(name_) {
    if (name_ === void 0) {
      name_ = true ? "Atom@" + getNextId() : "Atom";
    }
    this.name_ = void 0;
    this.isPendingUnobservation_ = false;
    this.isBeingObserved_ = false;
    this.observers_ = /* @__PURE__ */ new Set();
    this.diffValue_ = 0;
    this.lastAccessedBy_ = 0;
    this.lowestObserverState_ = IDerivationState_.NOT_TRACKING_;
    this.onBOL = void 0;
    this.onBUOL = void 0;
    this.name_ = name_;
  }
  var _proto = Atom2.prototype;
  _proto.onBO = function onBO() {
    if (this.onBOL) {
      this.onBOL.forEach(function(listener) {
        return listener();
      });
    }
  };
  _proto.onBUO = function onBUO() {
    if (this.onBUOL) {
      this.onBUOL.forEach(function(listener) {
        return listener();
      });
    }
  };
  _proto.reportObserved = function reportObserved$1() {
    return reportObserved(this);
  };
  _proto.reportChanged = function reportChanged() {
    startBatch();
    propagateChanged(this);
    endBatch();
  };
  _proto.toString = function toString2() {
    return this.name_;
  };
  return Atom2;
}();
var isAtom = /* @__PURE__ */ createInstanceofPredicate("Atom", Atom);
function createAtom(name, onBecomeObservedHandler, onBecomeUnobservedHandler) {
  if (onBecomeObservedHandler === void 0) {
    onBecomeObservedHandler = noop;
  }
  if (onBecomeUnobservedHandler === void 0) {
    onBecomeUnobservedHandler = noop;
  }
  var atom = new Atom(name);
  if (onBecomeObservedHandler !== noop) {
    onBecomeObserved(atom, onBecomeObservedHandler);
  }
  if (onBecomeUnobservedHandler !== noop) {
    onBecomeUnobserved(atom, onBecomeUnobservedHandler);
  }
  return atom;
}
function identityComparer(a2, b) {
  return a2 === b;
}
function structuralComparer(a2, b) {
  return deepEqual(a2, b);
}
function shallowComparer(a2, b) {
  return deepEqual(a2, b, 1);
}
function defaultComparer(a2, b) {
  if (Object.is)
    return Object.is(a2, b);
  return a2 === b ? a2 !== 0 || 1 / a2 === 1 / b : a2 !== a2 && b !== b;
}
var comparer = {
  identity: identityComparer,
  structural: structuralComparer,
  "default": defaultComparer,
  shallow: shallowComparer
};
function deepEnhancer(v, _15, name) {
  if (isObservable(v))
    return v;
  if (Array.isArray(v))
    return observable.array(v, {
      name
    });
  if (isPlainObject(v))
    return observable.object(v, void 0, {
      name
    });
  if (isES6Map(v))
    return observable.map(v, {
      name
    });
  if (isES6Set(v))
    return observable.set(v, {
      name
    });
  if (typeof v === "function" && !isAction(v) && !isFlow(v)) {
    if (isGenerator(v)) {
      return flow(v);
    } else {
      return autoAction(name, v);
    }
  }
  return v;
}
function shallowEnhancer(v, _15, name) {
  if (v === void 0 || v === null)
    return v;
  if (isObservableObject(v) || isObservableArray(v) || isObservableMap(v) || isObservableSet(v))
    return v;
  if (Array.isArray(v))
    return observable.array(v, {
      name,
      deep: false
    });
  if (isPlainObject(v))
    return observable.object(v, void 0, {
      name,
      deep: false
    });
  if (isES6Map(v))
    return observable.map(v, {
      name,
      deep: false
    });
  if (isES6Set(v))
    return observable.set(v, {
      name,
      deep: false
    });
  if (true)
    die("The shallow modifier / decorator can only used in combination with arrays, objects, maps and sets");
}
function referenceEnhancer(newValue) {
  return newValue;
}
function refStructEnhancer(v, oldValue) {
  if (isObservable(v))
    die("observable.struct should not be used with observable values");
  if (deepEqual(v, oldValue))
    return oldValue;
  return v;
}
var OVERRIDE = "override";
function isOverride(annotation) {
  return annotation.annotationType_ === OVERRIDE;
}
function createActionAnnotation(name, options) {
  return {
    annotationType_: name,
    options_: options,
    make_: make_$1,
    extend_: extend_$1
  };
}
function make_$1(adm, key, descriptor, source) {
  var _this$options_;
  if ((_this$options_ = this.options_) == null ? void 0 : _this$options_.bound) {
    return this.extend_(adm, key, descriptor, false) === null ? 0 : 1;
  }
  if (source === adm.target_) {
    return this.extend_(adm, key, descriptor, false) === null ? 0 : 2;
  }
  if (isAction(descriptor.value)) {
    return 1;
  }
  var actionDescriptor = createActionDescriptor(adm, this, key, descriptor, false);
  defineProperty(source, key, actionDescriptor);
  return 2;
}
function extend_$1(adm, key, descriptor, proxyTrap) {
  var actionDescriptor = createActionDescriptor(adm, this, key, descriptor);
  return adm.defineProperty_(key, actionDescriptor, proxyTrap);
}
function assertActionDescriptor(adm, _ref, key, _ref2) {
  var annotationType_ = _ref.annotationType_;
  var value = _ref2.value;
  if (!isFunction(value)) {
    die("Cannot apply '" + annotationType_ + "' to '" + adm.name_ + "." + key.toString() + "':" + ("\n'" + annotationType_ + "' can only be used on properties with a function value."));
  }
}
function createActionDescriptor(adm, annotation, key, descriptor, safeDescriptors) {
  var _annotation$options_, _annotation$options_$, _annotation$options_2, _annotation$options_$2, _annotation$options_3, _annotation$options_4, _adm$proxy_2;
  if (safeDescriptors === void 0) {
    safeDescriptors = globalState.safeDescriptors;
  }
  assertActionDescriptor(adm, annotation, key, descriptor);
  var value = descriptor.value;
  if ((_annotation$options_ = annotation.options_) == null ? void 0 : _annotation$options_.bound) {
    var _adm$proxy_;
    value = value.bind((_adm$proxy_ = adm.proxy_) != null ? _adm$proxy_ : adm.target_);
  }
  return {
    value: createAction((_annotation$options_$ = (_annotation$options_2 = annotation.options_) == null ? void 0 : _annotation$options_2.name) != null ? _annotation$options_$ : key.toString(), value, (_annotation$options_$2 = (_annotation$options_3 = annotation.options_) == null ? void 0 : _annotation$options_3.autoAction) != null ? _annotation$options_$2 : false, ((_annotation$options_4 = annotation.options_) == null ? void 0 : _annotation$options_4.bound) ? (_adm$proxy_2 = adm.proxy_) != null ? _adm$proxy_2 : adm.target_ : void 0),
    configurable: safeDescriptors ? adm.isPlainObject_ : true,
    enumerable: false,
    writable: safeDescriptors ? false : true
  };
}
function createFlowAnnotation(name, options) {
  return {
    annotationType_: name,
    options_: options,
    make_: make_$2,
    extend_: extend_$2
  };
}
function make_$2(adm, key, descriptor, source) {
  var _this$options_;
  if (source === adm.target_) {
    return this.extend_(adm, key, descriptor, false) === null ? 0 : 2;
  }
  if (((_this$options_ = this.options_) == null ? void 0 : _this$options_.bound) && !isFlow(adm.target_[key])) {
    if (this.extend_(adm, key, descriptor, false) === null)
      return 0;
  }
  if (isFlow(descriptor.value)) {
    return 1;
  }
  var flowDescriptor = createFlowDescriptor(adm, this, key, descriptor, false, false);
  defineProperty(source, key, flowDescriptor);
  return 2;
}
function extend_$2(adm, key, descriptor, proxyTrap) {
  var _this$options_2;
  var flowDescriptor = createFlowDescriptor(adm, this, key, descriptor, (_this$options_2 = this.options_) == null ? void 0 : _this$options_2.bound);
  return adm.defineProperty_(key, flowDescriptor, proxyTrap);
}
function assertFlowDescriptor(adm, _ref, key, _ref2) {
  var annotationType_ = _ref.annotationType_;
  var value = _ref2.value;
  if (!isFunction(value)) {
    die("Cannot apply '" + annotationType_ + "' to '" + adm.name_ + "." + key.toString() + "':" + ("\n'" + annotationType_ + "' can only be used on properties with a generator function value."));
  }
}
function createFlowDescriptor(adm, annotation, key, descriptor, bound, safeDescriptors) {
  if (safeDescriptors === void 0) {
    safeDescriptors = globalState.safeDescriptors;
  }
  assertFlowDescriptor(adm, annotation, key, descriptor);
  var value = descriptor.value;
  if (bound) {
    var _adm$proxy_;
    value = value.bind((_adm$proxy_ = adm.proxy_) != null ? _adm$proxy_ : adm.target_);
  }
  return {
    value: flow(value),
    configurable: safeDescriptors ? adm.isPlainObject_ : true,
    enumerable: false,
    writable: safeDescriptors ? false : true
  };
}
function createComputedAnnotation(name, options) {
  return {
    annotationType_: name,
    options_: options,
    make_: make_$3,
    extend_: extend_$3
  };
}
function make_$3(adm, key, descriptor) {
  return this.extend_(adm, key, descriptor, false) === null ? 0 : 1;
}
function extend_$3(adm, key, descriptor, proxyTrap) {
  assertComputedDescriptor(adm, this, key, descriptor);
  return adm.defineComputedProperty_(key, _extends({}, this.options_, {
    get: descriptor.get,
    set: descriptor.set
  }), proxyTrap);
}
function assertComputedDescriptor(adm, _ref, key, _ref2) {
  var annotationType_ = _ref.annotationType_;
  var get3 = _ref2.get;
  if (!get3) {
    die("Cannot apply '" + annotationType_ + "' to '" + adm.name_ + "." + key.toString() + "':" + ("\n'" + annotationType_ + "' can only be used on getter(+setter) properties."));
  }
}
function createObservableAnnotation(name, options) {
  return {
    annotationType_: name,
    options_: options,
    make_: make_$4,
    extend_: extend_$4
  };
}
function make_$4(adm, key, descriptor) {
  return this.extend_(adm, key, descriptor, false) === null ? 0 : 1;
}
function extend_$4(adm, key, descriptor, proxyTrap) {
  var _this$options_$enhanc, _this$options_;
  assertObservableDescriptor(adm, this, key, descriptor);
  return adm.defineObservableProperty_(key, descriptor.value, (_this$options_$enhanc = (_this$options_ = this.options_) == null ? void 0 : _this$options_.enhancer) != null ? _this$options_$enhanc : deepEnhancer, proxyTrap);
}
function assertObservableDescriptor(adm, _ref, key, descriptor) {
  var annotationType_ = _ref.annotationType_;
  if (!("value" in descriptor)) {
    die("Cannot apply '" + annotationType_ + "' to '" + adm.name_ + "." + key.toString() + "':" + ("\n'" + annotationType_ + "' cannot be used on getter/setter properties"));
  }
}
var AUTO = "true";
var autoAnnotation = /* @__PURE__ */ createAutoAnnotation();
function createAutoAnnotation(options) {
  return {
    annotationType_: AUTO,
    options_: options,
    make_: make_$5,
    extend_: extend_$5
  };
}
function make_$5(adm, key, descriptor, source) {
  var _this$options_3, _this$options_4;
  if (descriptor.get) {
    return computed.make_(adm, key, descriptor, source);
  }
  if (descriptor.set) {
    var set4 = createAction(key.toString(), descriptor.set);
    if (source === adm.target_) {
      return adm.defineProperty_(key, {
        configurable: globalState.safeDescriptors ? adm.isPlainObject_ : true,
        set: set4
      }) === null ? 0 : 2;
    }
    defineProperty(source, key, {
      configurable: true,
      set: set4
    });
    return 2;
  }
  if (source !== adm.target_ && typeof descriptor.value === "function") {
    var _this$options_2;
    if (isGenerator(descriptor.value)) {
      var _this$options_;
      var flowAnnotation2 = ((_this$options_ = this.options_) == null ? void 0 : _this$options_.autoBind) ? flow.bound : flow;
      return flowAnnotation2.make_(adm, key, descriptor, source);
    }
    var actionAnnotation2 = ((_this$options_2 = this.options_) == null ? void 0 : _this$options_2.autoBind) ? autoAction.bound : autoAction;
    return actionAnnotation2.make_(adm, key, descriptor, source);
  }
  var observableAnnotation2 = ((_this$options_3 = this.options_) == null ? void 0 : _this$options_3.deep) === false ? observable.ref : observable;
  if (typeof descriptor.value === "function" && ((_this$options_4 = this.options_) == null ? void 0 : _this$options_4.autoBind)) {
    var _adm$proxy_;
    descriptor.value = descriptor.value.bind((_adm$proxy_ = adm.proxy_) != null ? _adm$proxy_ : adm.target_);
  }
  return observableAnnotation2.make_(adm, key, descriptor, source);
}
function extend_$5(adm, key, descriptor, proxyTrap) {
  var _this$options_5, _this$options_6;
  if (descriptor.get) {
    return computed.extend_(adm, key, descriptor, proxyTrap);
  }
  if (descriptor.set) {
    return adm.defineProperty_(key, {
      configurable: globalState.safeDescriptors ? adm.isPlainObject_ : true,
      set: createAction(key.toString(), descriptor.set)
    }, proxyTrap);
  }
  if (typeof descriptor.value === "function" && ((_this$options_5 = this.options_) == null ? void 0 : _this$options_5.autoBind)) {
    var _adm$proxy_2;
    descriptor.value = descriptor.value.bind((_adm$proxy_2 = adm.proxy_) != null ? _adm$proxy_2 : adm.target_);
  }
  var observableAnnotation2 = ((_this$options_6 = this.options_) == null ? void 0 : _this$options_6.deep) === false ? observable.ref : observable;
  return observableAnnotation2.extend_(adm, key, descriptor, proxyTrap);
}
var OBSERVABLE = "observable";
var OBSERVABLE_REF = "observable.ref";
var OBSERVABLE_SHALLOW = "observable.shallow";
var OBSERVABLE_STRUCT = "observable.struct";
var defaultCreateObservableOptions = {
  deep: true,
  name: void 0,
  defaultDecorator: void 0,
  proxy: true
};
Object.freeze(defaultCreateObservableOptions);
function asCreateObservableOptions(thing) {
  return thing || defaultCreateObservableOptions;
}
var observableAnnotation = /* @__PURE__ */ createObservableAnnotation(OBSERVABLE);
var observableRefAnnotation = /* @__PURE__ */ createObservableAnnotation(OBSERVABLE_REF, {
  enhancer: referenceEnhancer
});
var observableShallowAnnotation = /* @__PURE__ */ createObservableAnnotation(OBSERVABLE_SHALLOW, {
  enhancer: shallowEnhancer
});
var observableStructAnnotation = /* @__PURE__ */ createObservableAnnotation(OBSERVABLE_STRUCT, {
  enhancer: refStructEnhancer
});
var observableDecoratorAnnotation = /* @__PURE__ */ createDecoratorAnnotation(observableAnnotation);
function getEnhancerFromOptions(options) {
  return options.deep === true ? deepEnhancer : options.deep === false ? referenceEnhancer : getEnhancerFromAnnotation(options.defaultDecorator);
}
function getAnnotationFromOptions(options) {
  var _options$defaultDecor;
  return options ? (_options$defaultDecor = options.defaultDecorator) != null ? _options$defaultDecor : createAutoAnnotation(options) : void 0;
}
function getEnhancerFromAnnotation(annotation) {
  var _annotation$options_$, _annotation$options_;
  return !annotation ? deepEnhancer : (_annotation$options_$ = (_annotation$options_ = annotation.options_) == null ? void 0 : _annotation$options_.enhancer) != null ? _annotation$options_$ : deepEnhancer;
}
function createObservable(v, arg2, arg3) {
  if (isStringish(arg2)) {
    storeAnnotation(v, arg2, observableAnnotation);
    return;
  }
  if (isObservable(v))
    return v;
  if (isPlainObject(v))
    return observable.object(v, arg2, arg3);
  if (Array.isArray(v))
    return observable.array(v, arg2);
  if (isES6Map(v))
    return observable.map(v, arg2);
  if (isES6Set(v))
    return observable.set(v, arg2);
  if (typeof v === "object" && v !== null)
    return v;
  return observable.box(v, arg2);
}
Object.assign(createObservable, observableDecoratorAnnotation);
var observableFactories = {
  box: function box(value, options) {
    var o = asCreateObservableOptions(options);
    return new ObservableValue(value, getEnhancerFromOptions(o), o.name, true, o.equals);
  },
  array: function array(initialValues, options) {
    var o = asCreateObservableOptions(options);
    return (globalState.useProxies === false || o.proxy === false ? createLegacyArray : createObservableArray)(initialValues, getEnhancerFromOptions(o), o.name);
  },
  map: function map(initialValues, options) {
    var o = asCreateObservableOptions(options);
    return new ObservableMap(initialValues, getEnhancerFromOptions(o), o.name);
  },
  set: function set(initialValues, options) {
    var o = asCreateObservableOptions(options);
    return new ObservableSet(initialValues, getEnhancerFromOptions(o), o.name);
  },
  object: function object(props, decorators, options) {
    return extendObservable(globalState.useProxies === false || (options == null ? void 0 : options.proxy) === false ? asObservableObject({}, options) : asDynamicObservableObject({}, options), props, decorators);
  },
  ref: /* @__PURE__ */ createDecoratorAnnotation(observableRefAnnotation),
  shallow: /* @__PURE__ */ createDecoratorAnnotation(observableShallowAnnotation),
  deep: observableDecoratorAnnotation,
  struct: /* @__PURE__ */ createDecoratorAnnotation(observableStructAnnotation)
};
var observable = /* @__PURE__ */ assign(createObservable, observableFactories);
var COMPUTED = "computed";
var COMPUTED_STRUCT = "computed.struct";
var computedAnnotation = /* @__PURE__ */ createComputedAnnotation(COMPUTED);
var computedStructAnnotation = /* @__PURE__ */ createComputedAnnotation(COMPUTED_STRUCT, {
  equals: comparer.structural
});
var computed = function computed2(arg1, arg2) {
  if (isStringish(arg2)) {
    return storeAnnotation(arg1, arg2, computedAnnotation);
  }
  if (isPlainObject(arg1)) {
    return createDecoratorAnnotation(createComputedAnnotation(COMPUTED, arg1));
  }
  if (true) {
    if (!isFunction(arg1))
      die("First argument to `computed` should be an expression.");
    if (isFunction(arg2))
      die("A setter as second argument is no longer supported, use `{ set: fn }` option instead");
  }
  var opts = isPlainObject(arg2) ? arg2 : {};
  opts.get = arg1;
  opts.name || (opts.name = arg1.name || "");
  return new ComputedValue(opts);
};
Object.assign(computed, computedAnnotation);
computed.struct = /* @__PURE__ */ createDecoratorAnnotation(computedStructAnnotation);
var _getDescriptor$config;
var _getDescriptor;
var currentActionId = 0;
var nextActionId = 1;
var isFunctionNameConfigurable = (_getDescriptor$config = (_getDescriptor = /* @__PURE__ */ getDescriptor(function() {
}, "name")) == null ? void 0 : _getDescriptor.configurable) != null ? _getDescriptor$config : false;
var tmpNameDescriptor = {
  value: "action",
  configurable: true,
  writable: false,
  enumerable: false
};
function createAction(actionName, fn, autoAction2, ref) {
  if (autoAction2 === void 0) {
    autoAction2 = false;
  }
  if (true) {
    if (!isFunction(fn))
      die("`action` can only be invoked on functions");
    if (typeof actionName !== "string" || !actionName)
      die("actions should have valid names, got: '" + actionName + "'");
  }
  function res() {
    return executeAction(actionName, autoAction2, fn, ref || this, arguments);
  }
  res.isMobxAction = true;
  if (isFunctionNameConfigurable) {
    tmpNameDescriptor.value = actionName;
    Object.defineProperty(res, "name", tmpNameDescriptor);
  }
  return res;
}
function executeAction(actionName, canRunAsDerivation, fn, scope, args) {
  var runInfo = _startAction(actionName, canRunAsDerivation, scope, args);
  try {
    return fn.apply(scope, args);
  } catch (err) {
    runInfo.error_ = err;
    throw err;
  } finally {
    _endAction(runInfo);
  }
}
function _startAction(actionName, canRunAsDerivation, scope, args) {
  var notifySpy_ = isSpyEnabled() && !!actionName;
  var startTime_ = 0;
  if (notifySpy_) {
    startTime_ = Date.now();
    var flattenedArgs = args ? Array.from(args) : EMPTY_ARRAY;
    spyReportStart({
      type: ACTION,
      name: actionName,
      object: scope,
      arguments: flattenedArgs
    });
  }
  var prevDerivation_ = globalState.trackingDerivation;
  var runAsAction = !canRunAsDerivation || !prevDerivation_;
  startBatch();
  var prevAllowStateChanges_ = globalState.allowStateChanges;
  if (runAsAction) {
    untrackedStart();
    prevAllowStateChanges_ = allowStateChangesStart(true);
  }
  var prevAllowStateReads_ = allowStateReadsStart(true);
  var runInfo = {
    runAsAction_: runAsAction,
    prevDerivation_,
    prevAllowStateChanges_,
    prevAllowStateReads_,
    notifySpy_,
    startTime_,
    actionId_: nextActionId++,
    parentActionId_: currentActionId
  };
  currentActionId = runInfo.actionId_;
  return runInfo;
}
function _endAction(runInfo) {
  if (currentActionId !== runInfo.actionId_) {
    die(30);
  }
  currentActionId = runInfo.parentActionId_;
  if (runInfo.error_ !== void 0) {
    globalState.suppressReactionErrors = true;
  }
  allowStateChangesEnd(runInfo.prevAllowStateChanges_);
  allowStateReadsEnd(runInfo.prevAllowStateReads_);
  endBatch();
  if (runInfo.runAsAction_)
    untrackedEnd(runInfo.prevDerivation_);
  if (runInfo.notifySpy_) {
    spyReportEnd({
      time: Date.now() - runInfo.startTime_
    });
  }
  globalState.suppressReactionErrors = false;
}
function allowStateChangesStart(allowStateChanges) {
  var prev = globalState.allowStateChanges;
  globalState.allowStateChanges = allowStateChanges;
  return prev;
}
function allowStateChangesEnd(prev) {
  globalState.allowStateChanges = prev;
}
var _Symbol$toPrimitive;
var CREATE = "create";
_Symbol$toPrimitive = Symbol.toPrimitive;
var ObservableValue = /* @__PURE__ */ function(_Atom) {
  _inheritsLoose(ObservableValue2, _Atom);
  function ObservableValue2(value, enhancer, name_, notifySpy, equals) {
    var _this;
    if (name_ === void 0) {
      name_ = true ? "ObservableValue@" + getNextId() : "ObservableValue";
    }
    if (notifySpy === void 0) {
      notifySpy = true;
    }
    if (equals === void 0) {
      equals = comparer["default"];
    }
    _this = _Atom.call(this, name_) || this;
    _this.enhancer = void 0;
    _this.name_ = void 0;
    _this.equals = void 0;
    _this.hasUnreportedChange_ = false;
    _this.interceptors_ = void 0;
    _this.changeListeners_ = void 0;
    _this.value_ = void 0;
    _this.dehancer = void 0;
    _this.enhancer = enhancer;
    _this.name_ = name_;
    _this.equals = equals;
    _this.value_ = enhancer(value, void 0, name_);
    if (notifySpy && isSpyEnabled()) {
      spyReport({
        type: CREATE,
        object: _assertThisInitialized(_this),
        observableKind: "value",
        debugObjectName: _this.name_,
        newValue: "" + _this.value_
      });
    }
    return _this;
  }
  var _proto = ObservableValue2.prototype;
  _proto.dehanceValue = function dehanceValue(value) {
    if (this.dehancer !== void 0)
      return this.dehancer(value);
    return value;
  };
  _proto.set = function set4(newValue) {
    var oldValue = this.value_;
    newValue = this.prepareNewValue_(newValue);
    if (newValue !== globalState.UNCHANGED) {
      var notifySpy = isSpyEnabled();
      if (notifySpy) {
        spyReportStart({
          type: UPDATE,
          object: this,
          observableKind: "value",
          debugObjectName: this.name_,
          newValue,
          oldValue
        });
      }
      this.setNewValue_(newValue);
      if (notifySpy)
        spyReportEnd();
    }
  };
  _proto.prepareNewValue_ = function prepareNewValue_(newValue) {
    checkIfStateModificationsAreAllowed(this);
    if (hasInterceptors(this)) {
      var change = interceptChange(this, {
        object: this,
        type: UPDATE,
        newValue
      });
      if (!change)
        return globalState.UNCHANGED;
      newValue = change.newValue;
    }
    newValue = this.enhancer(newValue, this.value_, this.name_);
    return this.equals(this.value_, newValue) ? globalState.UNCHANGED : newValue;
  };
  _proto.setNewValue_ = function setNewValue_(newValue) {
    var oldValue = this.value_;
    this.value_ = newValue;
    this.reportChanged();
    if (hasListeners(this)) {
      notifyListeners(this, {
        type: UPDATE,
        object: this,
        newValue,
        oldValue
      });
    }
  };
  _proto.get = function get3() {
    this.reportObserved();
    return this.dehanceValue(this.value_);
  };
  _proto.intercept_ = function intercept_(handler) {
    return registerInterceptor(this, handler);
  };
  _proto.observe_ = function observe_(listener, fireImmediately) {
    if (fireImmediately)
      listener({
        observableKind: "value",
        debugObjectName: this.name_,
        object: this,
        type: UPDATE,
        newValue: this.value_,
        oldValue: void 0
      });
    return registerListener(this, listener);
  };
  _proto.raw = function raw() {
    return this.value_;
  };
  _proto.toJSON = function toJSON2() {
    return this.get();
  };
  _proto.toString = function toString2() {
    return this.name_ + "[" + this.value_ + "]";
  };
  _proto.valueOf = function valueOf() {
    return toPrimitive(this.get());
  };
  _proto[_Symbol$toPrimitive] = function() {
    return this.valueOf();
  };
  return ObservableValue2;
}(Atom);
var isObservableValue = /* @__PURE__ */ createInstanceofPredicate("ObservableValue", ObservableValue);
var _Symbol$toPrimitive$1;
_Symbol$toPrimitive$1 = Symbol.toPrimitive;
var ComputedValue = /* @__PURE__ */ function() {
  function ComputedValue2(options) {
    this.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
    this.observing_ = [];
    this.newObserving_ = null;
    this.isBeingObserved_ = false;
    this.isPendingUnobservation_ = false;
    this.observers_ = /* @__PURE__ */ new Set();
    this.diffValue_ = 0;
    this.runId_ = 0;
    this.lastAccessedBy_ = 0;
    this.lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
    this.unboundDepsCount_ = 0;
    this.value_ = new CaughtException(null);
    this.name_ = void 0;
    this.triggeredBy_ = void 0;
    this.isComputing_ = false;
    this.isRunningSetter_ = false;
    this.derivation = void 0;
    this.setter_ = void 0;
    this.isTracing_ = TraceMode.NONE;
    this.scope_ = void 0;
    this.equals_ = void 0;
    this.requiresReaction_ = void 0;
    this.keepAlive_ = void 0;
    this.onBOL = void 0;
    this.onBUOL = void 0;
    if (!options.get)
      die(31);
    this.derivation = options.get;
    this.name_ = options.name || (true ? "ComputedValue@" + getNextId() : "ComputedValue");
    if (options.set) {
      this.setter_ = createAction(true ? this.name_ + "-setter" : "ComputedValue-setter", options.set);
    }
    this.equals_ = options.equals || (options.compareStructural || options.struct ? comparer.structural : comparer["default"]);
    this.scope_ = options.context;
    this.requiresReaction_ = !!options.requiresReaction;
    this.keepAlive_ = !!options.keepAlive;
  }
  var _proto = ComputedValue2.prototype;
  _proto.onBecomeStale_ = function onBecomeStale_() {
    propagateMaybeChanged(this);
  };
  _proto.onBO = function onBO() {
    if (this.onBOL) {
      this.onBOL.forEach(function(listener) {
        return listener();
      });
    }
  };
  _proto.onBUO = function onBUO() {
    if (this.onBUOL) {
      this.onBUOL.forEach(function(listener) {
        return listener();
      });
    }
  };
  _proto.get = function get3() {
    if (this.isComputing_)
      die(32, this.name_, this.derivation);
    if (globalState.inBatch === 0 && this.observers_.size === 0 && !this.keepAlive_) {
      if (shouldCompute(this)) {
        this.warnAboutUntrackedRead_();
        startBatch();
        this.value_ = this.computeValue_(false);
        endBatch();
      }
    } else {
      reportObserved(this);
      if (shouldCompute(this)) {
        var prevTrackingContext = globalState.trackingContext;
        if (this.keepAlive_ && !prevTrackingContext)
          globalState.trackingContext = this;
        if (this.trackAndCompute())
          propagateChangeConfirmed(this);
        globalState.trackingContext = prevTrackingContext;
      }
    }
    var result = this.value_;
    if (isCaughtException(result))
      throw result.cause;
    return result;
  };
  _proto.set = function set4(value) {
    if (this.setter_) {
      if (this.isRunningSetter_)
        die(33, this.name_);
      this.isRunningSetter_ = true;
      try {
        this.setter_.call(this.scope_, value);
      } finally {
        this.isRunningSetter_ = false;
      }
    } else
      die(34, this.name_);
  };
  _proto.trackAndCompute = function trackAndCompute() {
    var oldValue = this.value_;
    var wasSuspended = this.dependenciesState_ === IDerivationState_.NOT_TRACKING_;
    var newValue = this.computeValue_(true);
    var changed = wasSuspended || isCaughtException(oldValue) || isCaughtException(newValue) || !this.equals_(oldValue, newValue);
    if (changed) {
      this.value_ = newValue;
      if (isSpyEnabled()) {
        spyReport({
          observableKind: "computed",
          debugObjectName: this.name_,
          object: this.scope_,
          type: "update",
          oldValue,
          newValue
        });
      }
    }
    return changed;
  };
  _proto.computeValue_ = function computeValue_(track) {
    this.isComputing_ = true;
    var prev = allowStateChangesStart(false);
    var res;
    if (track) {
      res = trackDerivedFunction(this, this.derivation, this.scope_);
    } else {
      if (globalState.disableErrorBoundaries === true) {
        res = this.derivation.call(this.scope_);
      } else {
        try {
          res = this.derivation.call(this.scope_);
        } catch (e) {
          res = new CaughtException(e);
        }
      }
    }
    allowStateChangesEnd(prev);
    this.isComputing_ = false;
    return res;
  };
  _proto.suspend_ = function suspend_() {
    if (!this.keepAlive_) {
      clearObserving(this);
      this.value_ = void 0;
      if (this.isTracing_ !== TraceMode.NONE) {
        console.log("[mobx.trace] Computed value '" + this.name_ + "' was suspended and it will recompute on the next access.");
      }
    }
  };
  _proto.observe_ = function observe_(listener, fireImmediately) {
    var _this = this;
    var firstTime = true;
    var prevValue = void 0;
    return autorun(function() {
      var newValue = _this.get();
      if (!firstTime || fireImmediately) {
        var prevU = untrackedStart();
        listener({
          observableKind: "computed",
          debugObjectName: _this.name_,
          type: UPDATE,
          object: _this,
          newValue,
          oldValue: prevValue
        });
        untrackedEnd(prevU);
      }
      firstTime = false;
      prevValue = newValue;
    });
  };
  _proto.warnAboutUntrackedRead_ = function warnAboutUntrackedRead_() {
    if (false)
      return;
    if (this.isTracing_ !== TraceMode.NONE) {
      console.log("[mobx.trace] Computed value '" + this.name_ + "' is being read outside a reactive context. Doing a full recompute.");
    }
    if (globalState.computedRequiresReaction || this.requiresReaction_) {
      console.warn("[mobx] Computed value '" + this.name_ + "' is being read outside a reactive context. Doing a full recompute.");
    }
  };
  _proto.toString = function toString2() {
    return this.name_ + "[" + this.derivation.toString() + "]";
  };
  _proto.valueOf = function valueOf() {
    return toPrimitive(this.get());
  };
  _proto[_Symbol$toPrimitive$1] = function() {
    return this.valueOf();
  };
  return ComputedValue2;
}();
var isComputedValue = /* @__PURE__ */ createInstanceofPredicate("ComputedValue", ComputedValue);
var IDerivationState_;
(function(IDerivationState_2) {
  IDerivationState_2[IDerivationState_2["NOT_TRACKING_"] = -1] = "NOT_TRACKING_";
  IDerivationState_2[IDerivationState_2["UP_TO_DATE_"] = 0] = "UP_TO_DATE_";
  IDerivationState_2[IDerivationState_2["POSSIBLY_STALE_"] = 1] = "POSSIBLY_STALE_";
  IDerivationState_2[IDerivationState_2["STALE_"] = 2] = "STALE_";
})(IDerivationState_ || (IDerivationState_ = {}));
var TraceMode;
(function(TraceMode2) {
  TraceMode2[TraceMode2["NONE"] = 0] = "NONE";
  TraceMode2[TraceMode2["LOG"] = 1] = "LOG";
  TraceMode2[TraceMode2["BREAK"] = 2] = "BREAK";
})(TraceMode || (TraceMode = {}));
var CaughtException = function CaughtException2(cause) {
  this.cause = void 0;
  this.cause = cause;
};
function isCaughtException(e) {
  return e instanceof CaughtException;
}
function shouldCompute(derivation) {
  switch (derivation.dependenciesState_) {
    case IDerivationState_.UP_TO_DATE_:
      return false;
    case IDerivationState_.NOT_TRACKING_:
    case IDerivationState_.STALE_:
      return true;
    case IDerivationState_.POSSIBLY_STALE_: {
      var prevAllowStateReads = allowStateReadsStart(true);
      var prevUntracked = untrackedStart();
      var obs = derivation.observing_, l2 = obs.length;
      for (var i = 0; i < l2; i++) {
        var obj = obs[i];
        if (isComputedValue(obj)) {
          if (globalState.disableErrorBoundaries) {
            obj.get();
          } else {
            try {
              obj.get();
            } catch (e) {
              untrackedEnd(prevUntracked);
              allowStateReadsEnd(prevAllowStateReads);
              return true;
            }
          }
          if (derivation.dependenciesState_ === IDerivationState_.STALE_) {
            untrackedEnd(prevUntracked);
            allowStateReadsEnd(prevAllowStateReads);
            return true;
          }
        }
      }
      changeDependenciesStateTo0(derivation);
      untrackedEnd(prevUntracked);
      allowStateReadsEnd(prevAllowStateReads);
      return false;
    }
  }
}
function checkIfStateModificationsAreAllowed(atom) {
  if (false) {
    return;
  }
  var hasObservers = atom.observers_.size > 0;
  if (!globalState.allowStateChanges && (hasObservers || globalState.enforceActions === "always"))
    console.warn("[MobX] " + (globalState.enforceActions ? "Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed. Tried to modify: " : "Side effects like changing state are not allowed at this point. Are you trying to modify state from, for example, a computed value or the render function of a React component? You can wrap side effects in 'runInAction' (or decorate functions with 'action') if needed. Tried to modify: ") + atom.name_);
}
function checkIfStateReadsAreAllowed(observable2) {
  if (!globalState.allowStateReads && globalState.observableRequiresReaction) {
    console.warn("[mobx] Observable '" + observable2.name_ + "' being read outside a reactive context.");
  }
}
function trackDerivedFunction(derivation, f2, context) {
  var prevAllowStateReads = allowStateReadsStart(true);
  changeDependenciesStateTo0(derivation);
  derivation.newObserving_ = new Array(derivation.observing_.length + 100);
  derivation.unboundDepsCount_ = 0;
  derivation.runId_ = ++globalState.runId;
  var prevTracking = globalState.trackingDerivation;
  globalState.trackingDerivation = derivation;
  globalState.inBatch++;
  var result;
  if (globalState.disableErrorBoundaries === true) {
    result = f2.call(context);
  } else {
    try {
      result = f2.call(context);
    } catch (e) {
      result = new CaughtException(e);
    }
  }
  globalState.inBatch--;
  globalState.trackingDerivation = prevTracking;
  bindDependencies(derivation);
  warnAboutDerivationWithoutDependencies(derivation);
  allowStateReadsEnd(prevAllowStateReads);
  return result;
}
function warnAboutDerivationWithoutDependencies(derivation) {
  if (false)
    return;
  if (derivation.observing_.length !== 0)
    return;
  if (globalState.reactionRequiresObservable || derivation.requiresObservable_) {
    console.warn("[mobx] Derivation '" + derivation.name_ + "' is created/updated without reading any observable value.");
  }
}
function bindDependencies(derivation) {
  var prevObserving = derivation.observing_;
  var observing = derivation.observing_ = derivation.newObserving_;
  var lowestNewObservingDerivationState = IDerivationState_.UP_TO_DATE_;
  var i0 = 0, l2 = derivation.unboundDepsCount_;
  for (var i = 0; i < l2; i++) {
    var dep = observing[i];
    if (dep.diffValue_ === 0) {
      dep.diffValue_ = 1;
      if (i0 !== i)
        observing[i0] = dep;
      i0++;
    }
    if (dep.dependenciesState_ > lowestNewObservingDerivationState) {
      lowestNewObservingDerivationState = dep.dependenciesState_;
    }
  }
  observing.length = i0;
  derivation.newObserving_ = null;
  l2 = prevObserving.length;
  while (l2--) {
    var _dep = prevObserving[l2];
    if (_dep.diffValue_ === 0) {
      removeObserver(_dep, derivation);
    }
    _dep.diffValue_ = 0;
  }
  while (i0--) {
    var _dep2 = observing[i0];
    if (_dep2.diffValue_ === 1) {
      _dep2.diffValue_ = 0;
      addObserver(_dep2, derivation);
    }
  }
  if (lowestNewObservingDerivationState !== IDerivationState_.UP_TO_DATE_) {
    derivation.dependenciesState_ = lowestNewObservingDerivationState;
    derivation.onBecomeStale_();
  }
}
function clearObserving(derivation) {
  var obs = derivation.observing_;
  derivation.observing_ = [];
  var i = obs.length;
  while (i--) {
    removeObserver(obs[i], derivation);
  }
  derivation.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
}
function untracked(action2) {
  var prev = untrackedStart();
  try {
    return action2();
  } finally {
    untrackedEnd(prev);
  }
}
function untrackedStart() {
  var prev = globalState.trackingDerivation;
  globalState.trackingDerivation = null;
  return prev;
}
function untrackedEnd(prev) {
  globalState.trackingDerivation = prev;
}
function allowStateReadsStart(allowStateReads) {
  var prev = globalState.allowStateReads;
  globalState.allowStateReads = allowStateReads;
  return prev;
}
function allowStateReadsEnd(prev) {
  globalState.allowStateReads = prev;
}
function changeDependenciesStateTo0(derivation) {
  if (derivation.dependenciesState_ === IDerivationState_.UP_TO_DATE_)
    return;
  derivation.dependenciesState_ = IDerivationState_.UP_TO_DATE_;
  var obs = derivation.observing_;
  var i = obs.length;
  while (i--) {
    obs[i].lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
  }
}
var MobXGlobals = function MobXGlobals2() {
  this.version = 6;
  this.UNCHANGED = {};
  this.trackingDerivation = null;
  this.trackingContext = null;
  this.runId = 0;
  this.mobxGuid = 0;
  this.inBatch = 0;
  this.pendingUnobservations = [];
  this.pendingReactions = [];
  this.isRunningReactions = false;
  this.allowStateChanges = false;
  this.allowStateReads = true;
  this.enforceActions = true;
  this.spyListeners = [];
  this.globalReactionErrorHandlers = [];
  this.computedRequiresReaction = false;
  this.reactionRequiresObservable = false;
  this.observableRequiresReaction = false;
  this.disableErrorBoundaries = false;
  this.suppressReactionErrors = false;
  this.useProxies = true;
  this.verifyProxies = false;
  this.safeDescriptors = true;
};
var canMergeGlobalState = true;
var isolateCalled = false;
var globalState = /* @__PURE__ */ function() {
  var global2 = /* @__PURE__ */ getGlobal();
  if (global2.__mobxInstanceCount > 0 && !global2.__mobxGlobals)
    canMergeGlobalState = false;
  if (global2.__mobxGlobals && global2.__mobxGlobals.version !== new MobXGlobals().version)
    canMergeGlobalState = false;
  if (!canMergeGlobalState) {
    setTimeout(function() {
      if (!isolateCalled) {
        die(35);
      }
    }, 1);
    return new MobXGlobals();
  } else if (global2.__mobxGlobals) {
    global2.__mobxInstanceCount += 1;
    if (!global2.__mobxGlobals.UNCHANGED)
      global2.__mobxGlobals.UNCHANGED = {};
    return global2.__mobxGlobals;
  } else {
    global2.__mobxInstanceCount = 1;
    return global2.__mobxGlobals = /* @__PURE__ */ new MobXGlobals();
  }
}();
function isolateGlobalState() {
  if (globalState.pendingReactions.length || globalState.inBatch || globalState.isRunningReactions)
    die(36);
  isolateCalled = true;
  if (canMergeGlobalState) {
    var global2 = getGlobal();
    if (--global2.__mobxInstanceCount === 0)
      global2.__mobxGlobals = void 0;
    globalState = new MobXGlobals();
  }
}
function addObserver(observable2, node) {
  observable2.observers_.add(node);
  if (observable2.lowestObserverState_ > node.dependenciesState_)
    observable2.lowestObserverState_ = node.dependenciesState_;
}
function removeObserver(observable2, node) {
  observable2.observers_["delete"](node);
  if (observable2.observers_.size === 0) {
    queueForUnobservation(observable2);
  }
}
function queueForUnobservation(observable2) {
  if (observable2.isPendingUnobservation_ === false) {
    observable2.isPendingUnobservation_ = true;
    globalState.pendingUnobservations.push(observable2);
  }
}
function startBatch() {
  globalState.inBatch++;
}
function endBatch() {
  if (--globalState.inBatch === 0) {
    runReactions();
    var list = globalState.pendingUnobservations;
    for (var i = 0; i < list.length; i++) {
      var observable2 = list[i];
      observable2.isPendingUnobservation_ = false;
      if (observable2.observers_.size === 0) {
        if (observable2.isBeingObserved_) {
          observable2.isBeingObserved_ = false;
          observable2.onBUO();
        }
        if (observable2 instanceof ComputedValue) {
          observable2.suspend_();
        }
      }
    }
    globalState.pendingUnobservations = [];
  }
}
function reportObserved(observable2) {
  checkIfStateReadsAreAllowed(observable2);
  var derivation = globalState.trackingDerivation;
  if (derivation !== null) {
    if (derivation.runId_ !== observable2.lastAccessedBy_) {
      observable2.lastAccessedBy_ = derivation.runId_;
      derivation.newObserving_[derivation.unboundDepsCount_++] = observable2;
      if (!observable2.isBeingObserved_ && globalState.trackingContext) {
        observable2.isBeingObserved_ = true;
        observable2.onBO();
      }
    }
    return true;
  } else if (observable2.observers_.size === 0 && globalState.inBatch > 0) {
    queueForUnobservation(observable2);
  }
  return false;
}
function propagateChanged(observable2) {
  if (observable2.lowestObserverState_ === IDerivationState_.STALE_)
    return;
  observable2.lowestObserverState_ = IDerivationState_.STALE_;
  observable2.observers_.forEach(function(d) {
    if (d.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
      if (d.isTracing_ !== TraceMode.NONE) {
        logTraceInfo(d, observable2);
      }
      d.onBecomeStale_();
    }
    d.dependenciesState_ = IDerivationState_.STALE_;
  });
}
function propagateChangeConfirmed(observable2) {
  if (observable2.lowestObserverState_ === IDerivationState_.STALE_)
    return;
  observable2.lowestObserverState_ = IDerivationState_.STALE_;
  observable2.observers_.forEach(function(d) {
    if (d.dependenciesState_ === IDerivationState_.POSSIBLY_STALE_) {
      d.dependenciesState_ = IDerivationState_.STALE_;
      if (d.isTracing_ !== TraceMode.NONE) {
        logTraceInfo(d, observable2);
      }
    } else if (d.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
      observable2.lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
    }
  });
}
function propagateMaybeChanged(observable2) {
  if (observable2.lowestObserverState_ !== IDerivationState_.UP_TO_DATE_)
    return;
  observable2.lowestObserverState_ = IDerivationState_.POSSIBLY_STALE_;
  observable2.observers_.forEach(function(d) {
    if (d.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
      d.dependenciesState_ = IDerivationState_.POSSIBLY_STALE_;
      d.onBecomeStale_();
    }
  });
}
function logTraceInfo(derivation, observable2) {
  console.log("[mobx.trace] '" + derivation.name_ + "' is invalidated due to a change in: '" + observable2.name_ + "'");
  if (derivation.isTracing_ === TraceMode.BREAK) {
    var lines = [];
    printDepTree(getDependencyTree(derivation), lines, 1);
    new Function("debugger;\n/*\nTracing '" + derivation.name_ + "'\n\nYou are entering this break point because derivation '" + derivation.name_ + "' is being traced and '" + observable2.name_ + "' is now forcing it to update.\nJust follow the stacktrace you should now see in the devtools to see precisely what piece of your code is causing this update\nThe stackframe you are looking for is at least ~6-8 stack-frames up.\n\n" + (derivation instanceof ComputedValue ? derivation.derivation.toString().replace(/[*]\//g, "/") : "") + "\n\nThe dependencies for this derivation are:\n\n" + lines.join("\n") + "\n*/\n    ")();
  }
}
function printDepTree(tree, lines, depth) {
  if (lines.length >= 1e3) {
    lines.push("(and many more)");
    return;
  }
  lines.push("" + "	".repeat(depth - 1) + tree.name);
  if (tree.dependencies)
    tree.dependencies.forEach(function(child) {
      return printDepTree(child, lines, depth + 1);
    });
}
var Reaction = /* @__PURE__ */ function() {
  function Reaction2(name_, onInvalidate_, errorHandler_, requiresObservable_) {
    if (name_ === void 0) {
      name_ = true ? "Reaction@" + getNextId() : "Reaction";
    }
    if (requiresObservable_ === void 0) {
      requiresObservable_ = false;
    }
    this.name_ = void 0;
    this.onInvalidate_ = void 0;
    this.errorHandler_ = void 0;
    this.requiresObservable_ = void 0;
    this.observing_ = [];
    this.newObserving_ = [];
    this.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
    this.diffValue_ = 0;
    this.runId_ = 0;
    this.unboundDepsCount_ = 0;
    this.isDisposed_ = false;
    this.isScheduled_ = false;
    this.isTrackPending_ = false;
    this.isRunning_ = false;
    this.isTracing_ = TraceMode.NONE;
    this.name_ = name_;
    this.onInvalidate_ = onInvalidate_;
    this.errorHandler_ = errorHandler_;
    this.requiresObservable_ = requiresObservable_;
  }
  var _proto = Reaction2.prototype;
  _proto.onBecomeStale_ = function onBecomeStale_() {
    this.schedule_();
  };
  _proto.schedule_ = function schedule_() {
    if (!this.isScheduled_) {
      this.isScheduled_ = true;
      globalState.pendingReactions.push(this);
      runReactions();
    }
  };
  _proto.isScheduled = function isScheduled() {
    return this.isScheduled_;
  };
  _proto.runReaction_ = function runReaction_() {
    if (!this.isDisposed_) {
      startBatch();
      this.isScheduled_ = false;
      var prev = globalState.trackingContext;
      globalState.trackingContext = this;
      if (shouldCompute(this)) {
        this.isTrackPending_ = true;
        try {
          this.onInvalidate_();
          if (this.isTrackPending_ && isSpyEnabled()) {
            spyReport({
              name: this.name_,
              type: "scheduled-reaction"
            });
          }
        } catch (e) {
          this.reportExceptionInDerivation_(e);
        }
      }
      globalState.trackingContext = prev;
      endBatch();
    }
  };
  _proto.track = function track(fn) {
    if (this.isDisposed_) {
      return;
    }
    startBatch();
    var notify = isSpyEnabled();
    var startTime;
    if (notify) {
      startTime = Date.now();
      spyReportStart({
        name: this.name_,
        type: "reaction"
      });
    }
    this.isRunning_ = true;
    var prevReaction = globalState.trackingContext;
    globalState.trackingContext = this;
    var result = trackDerivedFunction(this, fn, void 0);
    globalState.trackingContext = prevReaction;
    this.isRunning_ = false;
    this.isTrackPending_ = false;
    if (this.isDisposed_) {
      clearObserving(this);
    }
    if (isCaughtException(result))
      this.reportExceptionInDerivation_(result.cause);
    if (notify) {
      spyReportEnd({
        time: Date.now() - startTime
      });
    }
    endBatch();
  };
  _proto.reportExceptionInDerivation_ = function reportExceptionInDerivation_(error) {
    var _this = this;
    if (this.errorHandler_) {
      this.errorHandler_(error, this);
      return;
    }
    if (globalState.disableErrorBoundaries)
      throw error;
    var message = true ? "[mobx] Encountered an uncaught exception that was thrown by a reaction or observer component, in: '" + this + "'" : "[mobx] uncaught error in '" + this + "'";
    if (!globalState.suppressReactionErrors) {
      console.error(message, error);
    } else if (true)
      console.warn("[mobx] (error in reaction '" + this.name_ + "' suppressed, fix error of causing action below)");
    if (isSpyEnabled()) {
      spyReport({
        type: "error",
        name: this.name_,
        message,
        error: "" + error
      });
    }
    globalState.globalReactionErrorHandlers.forEach(function(f2) {
      return f2(error, _this);
    });
  };
  _proto.dispose = function dispose() {
    if (!this.isDisposed_) {
      this.isDisposed_ = true;
      if (!this.isRunning_) {
        startBatch();
        clearObserving(this);
        endBatch();
      }
    }
  };
  _proto.getDisposer_ = function getDisposer_() {
    var r = this.dispose.bind(this);
    r[$mobx] = this;
    return r;
  };
  _proto.toString = function toString2() {
    return "Reaction[" + this.name_ + "]";
  };
  _proto.trace = function trace$1(enterBreakPoint) {
    if (enterBreakPoint === void 0) {
      enterBreakPoint = false;
    }
    trace(this, enterBreakPoint);
  };
  return Reaction2;
}();
var MAX_REACTION_ITERATIONS = 100;
var reactionScheduler = function reactionScheduler2(f2) {
  return f2();
};
function runReactions() {
  if (globalState.inBatch > 0 || globalState.isRunningReactions)
    return;
  reactionScheduler(runReactionsHelper);
}
function runReactionsHelper() {
  globalState.isRunningReactions = true;
  var allReactions = globalState.pendingReactions;
  var iterations = 0;
  while (allReactions.length > 0) {
    if (++iterations === MAX_REACTION_ITERATIONS) {
      console.error(true ? "Reaction doesn't converge to a stable state after " + MAX_REACTION_ITERATIONS + " iterations." + (" Probably there is a cycle in the reactive function: " + allReactions[0]) : "[mobx] cycle in reaction: " + allReactions[0]);
      allReactions.splice(0);
    }
    var remainingReactions = allReactions.splice(0);
    for (var i = 0, l2 = remainingReactions.length; i < l2; i++) {
      remainingReactions[i].runReaction_();
    }
  }
  globalState.isRunningReactions = false;
}
var isReaction = /* @__PURE__ */ createInstanceofPredicate("Reaction", Reaction);
function setReactionScheduler(fn) {
  var baseScheduler = reactionScheduler;
  reactionScheduler = function reactionScheduler3(f2) {
    return fn(function() {
      return baseScheduler(f2);
    });
  };
}
function isSpyEnabled() {
  return !!globalState.spyListeners.length;
}
function spyReport(event) {
  if (false)
    return;
  if (!globalState.spyListeners.length)
    return;
  var listeners = globalState.spyListeners;
  for (var i = 0, l2 = listeners.length; i < l2; i++) {
    listeners[i](event);
  }
}
function spyReportStart(event) {
  if (false)
    return;
  var change = _extends({}, event, {
    spyReportStart: true
  });
  spyReport(change);
}
var END_EVENT = {
  type: "report-end",
  spyReportEnd: true
};
function spyReportEnd(change) {
  if (false)
    return;
  if (change)
    spyReport(_extends({}, change, {
      type: "report-end",
      spyReportEnd: true
    }));
  else
    spyReport(END_EVENT);
}
function spy(listener) {
  if (false) {
    console.warn("[mobx.spy] Is a no-op in production builds");
    return function() {
    };
  } else {
    globalState.spyListeners.push(listener);
    return once(function() {
      globalState.spyListeners = globalState.spyListeners.filter(function(l2) {
        return l2 !== listener;
      });
    });
  }
}
var ACTION = "action";
var ACTION_BOUND = "action.bound";
var AUTOACTION = "autoAction";
var AUTOACTION_BOUND = "autoAction.bound";
var DEFAULT_ACTION_NAME = "<unnamed action>";
var actionAnnotation = /* @__PURE__ */ createActionAnnotation(ACTION);
var actionBoundAnnotation = /* @__PURE__ */ createActionAnnotation(ACTION_BOUND, {
  bound: true
});
var autoActionAnnotation = /* @__PURE__ */ createActionAnnotation(AUTOACTION, {
  autoAction: true
});
var autoActionBoundAnnotation = /* @__PURE__ */ createActionAnnotation(AUTOACTION_BOUND, {
  autoAction: true,
  bound: true
});
function createActionFactory(autoAction2) {
  var res = function action2(arg1, arg2) {
    if (isFunction(arg1))
      return createAction(arg1.name || DEFAULT_ACTION_NAME, arg1, autoAction2);
    if (isFunction(arg2))
      return createAction(arg1, arg2, autoAction2);
    if (isStringish(arg2)) {
      return storeAnnotation(arg1, arg2, autoAction2 ? autoActionAnnotation : actionAnnotation);
    }
    if (isStringish(arg1)) {
      return createDecoratorAnnotation(createActionAnnotation(autoAction2 ? AUTOACTION : ACTION, {
        name: arg1,
        autoAction: autoAction2
      }));
    }
    if (true)
      die("Invalid arguments for `action`");
  };
  return res;
}
var action = /* @__PURE__ */ createActionFactory(false);
Object.assign(action, actionAnnotation);
var autoAction = /* @__PURE__ */ createActionFactory(true);
Object.assign(autoAction, autoActionAnnotation);
action.bound = /* @__PURE__ */ createDecoratorAnnotation(actionBoundAnnotation);
autoAction.bound = /* @__PURE__ */ createDecoratorAnnotation(autoActionBoundAnnotation);
function isAction(thing) {
  return isFunction(thing) && thing.isMobxAction === true;
}
function autorun(view, opts) {
  var _opts$name, _opts;
  if (opts === void 0) {
    opts = EMPTY_OBJECT;
  }
  if (true) {
    if (!isFunction(view))
      die("Autorun expects a function as first argument");
    if (isAction(view))
      die("Autorun does not accept actions since actions are untrackable");
  }
  var name = (_opts$name = (_opts = opts) == null ? void 0 : _opts.name) != null ? _opts$name : true ? view.name || "Autorun@" + getNextId() : "Autorun";
  var runSync = !opts.scheduler && !opts.delay;
  var reaction;
  if (runSync) {
    reaction = new Reaction(name, function() {
      this.track(reactionRunner);
    }, opts.onError, opts.requiresObservable);
  } else {
    var scheduler = createSchedulerFromOptions(opts);
    var isScheduled = false;
    reaction = new Reaction(name, function() {
      if (!isScheduled) {
        isScheduled = true;
        scheduler(function() {
          isScheduled = false;
          if (!reaction.isDisposed_)
            reaction.track(reactionRunner);
        });
      }
    }, opts.onError, opts.requiresObservable);
  }
  function reactionRunner() {
    view(reaction);
  }
  reaction.schedule_();
  return reaction.getDisposer_();
}
var run = function run2(f2) {
  return f2();
};
function createSchedulerFromOptions(opts) {
  return opts.scheduler ? opts.scheduler : opts.delay ? function(f2) {
    return setTimeout(f2, opts.delay);
  } : run;
}
var ON_BECOME_OBSERVED = "onBO";
var ON_BECOME_UNOBSERVED = "onBUO";
function onBecomeObserved(thing, arg2, arg3) {
  return interceptHook(ON_BECOME_OBSERVED, thing, arg2, arg3);
}
function onBecomeUnobserved(thing, arg2, arg3) {
  return interceptHook(ON_BECOME_UNOBSERVED, thing, arg2, arg3);
}
function interceptHook(hook, thing, arg2, arg3) {
  var atom = typeof arg3 === "function" ? getAtom(thing, arg2) : getAtom(thing);
  var cb = isFunction(arg3) ? arg3 : arg2;
  var listenersKey = hook + "L";
  if (atom[listenersKey]) {
    atom[listenersKey].add(cb);
  } else {
    atom[listenersKey] = /* @__PURE__ */ new Set([cb]);
  }
  return function() {
    var hookListeners = atom[listenersKey];
    if (hookListeners) {
      hookListeners["delete"](cb);
      if (hookListeners.size === 0) {
        delete atom[listenersKey];
      }
    }
  };
}
var NEVER = "never";
var ALWAYS = "always";
var OBSERVED = "observed";
function configure(options) {
  if (options.isolateGlobalState === true) {
    isolateGlobalState();
  }
  var useProxies = options.useProxies, enforceActions = options.enforceActions;
  if (useProxies !== void 0) {
    globalState.useProxies = useProxies === ALWAYS ? true : useProxies === NEVER ? false : typeof Proxy !== "undefined";
  }
  if (useProxies === "ifavailable")
    globalState.verifyProxies = true;
  if (enforceActions !== void 0) {
    var ea = enforceActions === ALWAYS ? ALWAYS : enforceActions === OBSERVED;
    globalState.enforceActions = ea;
    globalState.allowStateChanges = ea === true || ea === ALWAYS ? false : true;
  }
  ["computedRequiresReaction", "reactionRequiresObservable", "observableRequiresReaction", "disableErrorBoundaries", "safeDescriptors"].forEach(function(key) {
    if (key in options)
      globalState[key] = !!options[key];
  });
  globalState.allowStateReads = !globalState.observableRequiresReaction;
  if (globalState.disableErrorBoundaries === true) {
    console.warn("WARNING: Debug feature only. MobX will NOT recover from errors when `disableErrorBoundaries` is enabled.");
  }
  if (options.reactionScheduler) {
    setReactionScheduler(options.reactionScheduler);
  }
}
function extendObservable(target, properties, annotations, options) {
  if (true) {
    if (arguments.length > 4)
      die("'extendObservable' expected 2-4 arguments");
    if (typeof target !== "object")
      die("'extendObservable' expects an object as first argument");
    if (isObservableMap(target))
      die("'extendObservable' should not be used on maps, use map.merge instead");
    if (!isPlainObject(properties))
      die("'extendObservable' only accepts plain objects as second argument");
    if (isObservable(properties) || isObservable(annotations))
      die("Extending an object with another observable (object) is not supported");
  }
  var descriptors = getOwnPropertyDescriptors(properties);
  var adm = asObservableObject(target, options)[$mobx];
  startBatch();
  try {
    ownKeys(descriptors).forEach(function(key) {
      adm.extend_(key, descriptors[key], !annotations ? true : key in annotations ? annotations[key] : true);
    });
  } finally {
    endBatch();
  }
  return target;
}
function getDependencyTree(thing, property) {
  return nodeToDependencyTree(getAtom(thing, property));
}
function nodeToDependencyTree(node) {
  var result = {
    name: node.name_
  };
  if (node.observing_ && node.observing_.length > 0)
    result.dependencies = unique(node.observing_).map(nodeToDependencyTree);
  return result;
}
function unique(list) {
  return Array.from(new Set(list));
}
var generatorId = 0;
function FlowCancellationError() {
  this.message = "FLOW_CANCELLED";
}
FlowCancellationError.prototype = /* @__PURE__ */ Object.create(Error.prototype);
var flowAnnotation = /* @__PURE__ */ createFlowAnnotation("flow");
var flowBoundAnnotation = /* @__PURE__ */ createFlowAnnotation("flow.bound", {
  bound: true
});
var flow = /* @__PURE__ */ Object.assign(function flow2(arg1, arg2) {
  if (isStringish(arg2)) {
    return storeAnnotation(arg1, arg2, flowAnnotation);
  }
  if (arguments.length !== 1)
    die("Flow expects single argument with generator function");
  var generator = arg1;
  var name = generator.name || "<unnamed flow>";
  var res = function res2() {
    var ctx = this;
    var args = arguments;
    var runId = ++generatorId;
    var gen = action(name + " - runid: " + runId + " - init", generator).apply(ctx, args);
    var rejector;
    var pendingPromise = void 0;
    var promise = new Promise(function(resolve, reject) {
      var stepId = 0;
      rejector = reject;
      function onFulfilled(res3) {
        pendingPromise = void 0;
        var ret;
        try {
          ret = action(name + " - runid: " + runId + " - yield " + stepId++, gen.next).call(gen, res3);
        } catch (e) {
          return reject(e);
        }
        next(ret);
      }
      function onRejected(err) {
        pendingPromise = void 0;
        var ret;
        try {
          ret = action(name + " - runid: " + runId + " - yield " + stepId++, gen["throw"]).call(gen, err);
        } catch (e) {
          return reject(e);
        }
        next(ret);
      }
      function next(ret) {
        if (isFunction(ret == null ? void 0 : ret.then)) {
          ret.then(next, reject);
          return;
        }
        if (ret.done)
          return resolve(ret.value);
        pendingPromise = Promise.resolve(ret.value);
        return pendingPromise.then(onFulfilled, onRejected);
      }
      onFulfilled(void 0);
    });
    promise.cancel = action(name + " - runid: " + runId + " - cancel", function() {
      try {
        if (pendingPromise)
          cancelPromise(pendingPromise);
        var _res = gen["return"](void 0);
        var yieldedPromise = Promise.resolve(_res.value);
        yieldedPromise.then(noop, noop);
        cancelPromise(yieldedPromise);
        rejector(new FlowCancellationError());
      } catch (e) {
        rejector(e);
      }
    });
    return promise;
  };
  res.isMobXFlow = true;
  return res;
}, flowAnnotation);
flow.bound = /* @__PURE__ */ createDecoratorAnnotation(flowBoundAnnotation);
function cancelPromise(promise) {
  if (isFunction(promise.cancel))
    promise.cancel();
}
function isFlow(fn) {
  return (fn == null ? void 0 : fn.isMobXFlow) === true;
}
function _isObservable(value, property) {
  if (!value)
    return false;
  if (property !== void 0) {
    if (isObservableMap(value) || isObservableArray(value))
      return die("isObservable(object, propertyName) is not supported for arrays and maps. Use map.has or array.length instead.");
    if (isObservableObject(value)) {
      return value[$mobx].values_.has(property);
    }
    return false;
  }
  return isObservableObject(value) || !!value[$mobx] || isAtom(value) || isReaction(value) || isComputedValue(value);
}
function isObservable(value) {
  if (arguments.length !== 1)
    die("isObservable expects only 1 argument. Use isObservableProp to inspect the observability of a property");
  return _isObservable(value);
}
function apiOwnKeys(obj) {
  if (isObservableObject(obj)) {
    return obj[$mobx].ownKeys_();
  }
  die(38);
}
function observe(thing, propOrCb, cbOrFire, fireImmediately) {
  if (isFunction(cbOrFire))
    return observeObservableProperty(thing, propOrCb, cbOrFire, fireImmediately);
  else
    return observeObservable(thing, propOrCb, cbOrFire);
}
function observeObservable(thing, listener, fireImmediately) {
  return getAdministration(thing).observe_(listener, fireImmediately);
}
function observeObservableProperty(thing, property, listener, fireImmediately) {
  return getAdministration(thing, property).observe_(listener, fireImmediately);
}
function cache(map2, key, value) {
  map2.set(key, value);
  return value;
}
function toJSHelper(source, __alreadySeen) {
  if (source == null || typeof source !== "object" || source instanceof Date || !isObservable(source))
    return source;
  if (isObservableValue(source) || isComputedValue(source))
    return toJSHelper(source.get(), __alreadySeen);
  if (__alreadySeen.has(source)) {
    return __alreadySeen.get(source);
  }
  if (isObservableArray(source)) {
    var res = cache(__alreadySeen, source, new Array(source.length));
    source.forEach(function(value, idx) {
      res[idx] = toJSHelper(value, __alreadySeen);
    });
    return res;
  }
  if (isObservableSet(source)) {
    var _res = cache(__alreadySeen, source, /* @__PURE__ */ new Set());
    source.forEach(function(value) {
      _res.add(toJSHelper(value, __alreadySeen));
    });
    return _res;
  }
  if (isObservableMap(source)) {
    var _res2 = cache(__alreadySeen, source, /* @__PURE__ */ new Map());
    source.forEach(function(value, key) {
      _res2.set(key, toJSHelper(value, __alreadySeen));
    });
    return _res2;
  } else {
    var _res3 = cache(__alreadySeen, source, {});
    apiOwnKeys(source).forEach(function(key) {
      if (objectPrototype.propertyIsEnumerable.call(source, key)) {
        _res3[key] = toJSHelper(source[key], __alreadySeen);
      }
    });
    return _res3;
  }
}
function toJS(source, options) {
  if (options)
    die("toJS no longer supports options");
  return toJSHelper(source, /* @__PURE__ */ new Map());
}
function trace() {
  if (false)
    die("trace() is not available in production builds");
  var enterBreakPoint = false;
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  if (typeof args[args.length - 1] === "boolean")
    enterBreakPoint = args.pop();
  var derivation = getAtomFromArgs(args);
  if (!derivation) {
    return die("'trace(break?)' can only be used inside a tracked computed value or a Reaction. Consider passing in the computed value or reaction explicitly");
  }
  if (derivation.isTracing_ === TraceMode.NONE) {
    console.log("[mobx.trace] '" + derivation.name_ + "' tracing enabled");
  }
  derivation.isTracing_ = enterBreakPoint ? TraceMode.BREAK : TraceMode.LOG;
}
function getAtomFromArgs(args) {
  switch (args.length) {
    case 0:
      return globalState.trackingDerivation;
    case 1:
      return getAtom(args[0]);
    case 2:
      return getAtom(args[0], args[1]);
  }
}
function transaction(action2, thisArg) {
  if (thisArg === void 0) {
    thisArg = void 0;
  }
  startBatch();
  try {
    return action2.apply(thisArg);
  } finally {
    endBatch();
  }
}
function getAdm(target) {
  return target[$mobx];
}
var objectProxyTraps = {
  has: function has(target, name) {
    if (globalState.trackingDerivation)
      warnAboutProxyRequirement("detect new properties using the 'in' operator. Use 'has' from 'mobx' instead.");
    return getAdm(target).has_(name);
  },
  get: function get(target, name) {
    return getAdm(target).get_(name);
  },
  set: function set2(target, name, value) {
    var _getAdm$set_;
    if (!isStringish(name))
      return false;
    if (!getAdm(target).values_.has(name)) {
      warnAboutProxyRequirement("add a new observable property through direct assignment. Use 'set' from 'mobx' instead.");
    }
    return (_getAdm$set_ = getAdm(target).set_(name, value, true)) != null ? _getAdm$set_ : true;
  },
  deleteProperty: function deleteProperty(target, name) {
    var _getAdm$delete_;
    if (true) {
      warnAboutProxyRequirement("delete properties from an observable object. Use 'remove' from 'mobx' instead.");
    }
    if (!isStringish(name))
      return false;
    return (_getAdm$delete_ = getAdm(target).delete_(name, true)) != null ? _getAdm$delete_ : true;
  },
  defineProperty: function defineProperty2(target, name, descriptor) {
    var _getAdm$definePropert;
    if (true) {
      warnAboutProxyRequirement("define property on an observable object. Use 'defineProperty' from 'mobx' instead.");
    }
    return (_getAdm$definePropert = getAdm(target).defineProperty_(name, descriptor)) != null ? _getAdm$definePropert : true;
  },
  ownKeys: function ownKeys2(target) {
    if (globalState.trackingDerivation)
      warnAboutProxyRequirement("iterate keys to detect added / removed properties. Use 'keys' from 'mobx' instead.");
    return getAdm(target).ownKeys_();
  },
  preventExtensions: function preventExtensions(target) {
    die(13);
  }
};
function asDynamicObservableObject(target, options) {
  var _target$$mobx, _target$$mobx$proxy_;
  assertProxies();
  target = asObservableObject(target, options);
  return (_target$$mobx$proxy_ = (_target$$mobx = target[$mobx]).proxy_) != null ? _target$$mobx$proxy_ : _target$$mobx.proxy_ = new Proxy(target, objectProxyTraps);
}
function hasInterceptors(interceptable) {
  return interceptable.interceptors_ !== void 0 && interceptable.interceptors_.length > 0;
}
function registerInterceptor(interceptable, handler) {
  var interceptors = interceptable.interceptors_ || (interceptable.interceptors_ = []);
  interceptors.push(handler);
  return once(function() {
    var idx = interceptors.indexOf(handler);
    if (idx !== -1)
      interceptors.splice(idx, 1);
  });
}
function interceptChange(interceptable, change) {
  var prevU = untrackedStart();
  try {
    var interceptors = [].concat(interceptable.interceptors_ || []);
    for (var i = 0, l2 = interceptors.length; i < l2; i++) {
      change = interceptors[i](change);
      if (change && !change.type)
        die(14);
      if (!change)
        break;
    }
    return change;
  } finally {
    untrackedEnd(prevU);
  }
}
function hasListeners(listenable) {
  return listenable.changeListeners_ !== void 0 && listenable.changeListeners_.length > 0;
}
function registerListener(listenable, handler) {
  var listeners = listenable.changeListeners_ || (listenable.changeListeners_ = []);
  listeners.push(handler);
  return once(function() {
    var idx = listeners.indexOf(handler);
    if (idx !== -1)
      listeners.splice(idx, 1);
  });
}
function notifyListeners(listenable, change) {
  var prevU = untrackedStart();
  var listeners = listenable.changeListeners_;
  if (!listeners)
    return;
  listeners = listeners.slice();
  for (var i = 0, l2 = listeners.length; i < l2; i++) {
    listeners[i](change);
  }
  untrackedEnd(prevU);
}
function makeObservable(target, annotations, options) {
  var adm = asObservableObject(target, options)[$mobx];
  startBatch();
  try {
    var _annotations;
    if (annotations && target[storedAnnotationsSymbol]) {
      die("makeObservable second arg must be nullish when using decorators. Mixing @decorator syntax with annotations is not supported.");
    }
    (_annotations = annotations) != null ? _annotations : annotations = collectStoredAnnotations(target);
    ownKeys(annotations).forEach(function(key) {
      return adm.make_(key, annotations[key]);
    });
  } finally {
    endBatch();
  }
  return target;
}
var SPLICE = "splice";
var UPDATE = "update";
var MAX_SPLICE_SIZE = 1e4;
var arrayTraps = {
  get: function get2(target, name) {
    var adm = target[$mobx];
    if (name === $mobx)
      return adm;
    if (name === "length")
      return adm.getArrayLength_();
    if (typeof name === "string" && !isNaN(name)) {
      return adm.get_(parseInt(name));
    }
    if (hasProp(arrayExtensions, name)) {
      return arrayExtensions[name];
    }
    return target[name];
  },
  set: function set3(target, name, value) {
    var adm = target[$mobx];
    if (name === "length") {
      adm.setArrayLength_(value);
    }
    if (typeof name === "symbol" || isNaN(name)) {
      target[name] = value;
    } else {
      adm.set_(parseInt(name), value);
    }
    return true;
  },
  preventExtensions: function preventExtensions2() {
    die(15);
  }
};
var ObservableArrayAdministration = /* @__PURE__ */ function() {
  function ObservableArrayAdministration2(name, enhancer, owned_, legacyMode_) {
    if (name === void 0) {
      name = true ? "ObservableArray@" + getNextId() : "ObservableArray";
    }
    this.owned_ = void 0;
    this.legacyMode_ = void 0;
    this.atom_ = void 0;
    this.values_ = [];
    this.interceptors_ = void 0;
    this.changeListeners_ = void 0;
    this.enhancer_ = void 0;
    this.dehancer = void 0;
    this.proxy_ = void 0;
    this.lastKnownLength_ = 0;
    this.owned_ = owned_;
    this.legacyMode_ = legacyMode_;
    this.atom_ = new Atom(name);
    this.enhancer_ = function(newV, oldV) {
      return enhancer(newV, oldV, true ? name + "[..]" : "ObservableArray[..]");
    };
  }
  var _proto = ObservableArrayAdministration2.prototype;
  _proto.dehanceValue_ = function dehanceValue_(value) {
    if (this.dehancer !== void 0)
      return this.dehancer(value);
    return value;
  };
  _proto.dehanceValues_ = function dehanceValues_(values) {
    if (this.dehancer !== void 0 && values.length > 0)
      return values.map(this.dehancer);
    return values;
  };
  _proto.intercept_ = function intercept_(handler) {
    return registerInterceptor(this, handler);
  };
  _proto.observe_ = function observe_(listener, fireImmediately) {
    if (fireImmediately === void 0) {
      fireImmediately = false;
    }
    if (fireImmediately) {
      listener({
        observableKind: "array",
        object: this.proxy_,
        debugObjectName: this.atom_.name_,
        type: "splice",
        index: 0,
        added: this.values_.slice(),
        addedCount: this.values_.length,
        removed: [],
        removedCount: 0
      });
    }
    return registerListener(this, listener);
  };
  _proto.getArrayLength_ = function getArrayLength_() {
    this.atom_.reportObserved();
    return this.values_.length;
  };
  _proto.setArrayLength_ = function setArrayLength_(newLength) {
    if (typeof newLength !== "number" || isNaN(newLength) || newLength < 0)
      die("Out of range: " + newLength);
    var currentLength = this.values_.length;
    if (newLength === currentLength)
      return;
    else if (newLength > currentLength) {
      var newItems = new Array(newLength - currentLength);
      for (var i = 0; i < newLength - currentLength; i++) {
        newItems[i] = void 0;
      }
      this.spliceWithArray_(currentLength, 0, newItems);
    } else
      this.spliceWithArray_(newLength, currentLength - newLength);
  };
  _proto.updateArrayLength_ = function updateArrayLength_(oldLength, delta) {
    if (oldLength !== this.lastKnownLength_)
      die(16);
    this.lastKnownLength_ += delta;
    if (this.legacyMode_ && delta > 0)
      reserveArrayBuffer(oldLength + delta + 1);
  };
  _proto.spliceWithArray_ = function spliceWithArray_(index, deleteCount, newItems) {
    var _this = this;
    checkIfStateModificationsAreAllowed(this.atom_);
    var length = this.values_.length;
    if (index === void 0)
      index = 0;
    else if (index > length)
      index = length;
    else if (index < 0)
      index = Math.max(0, length + index);
    if (arguments.length === 1)
      deleteCount = length - index;
    else if (deleteCount === void 0 || deleteCount === null)
      deleteCount = 0;
    else
      deleteCount = Math.max(0, Math.min(deleteCount, length - index));
    if (newItems === void 0)
      newItems = EMPTY_ARRAY;
    if (hasInterceptors(this)) {
      var change = interceptChange(this, {
        object: this.proxy_,
        type: SPLICE,
        index,
        removedCount: deleteCount,
        added: newItems
      });
      if (!change)
        return EMPTY_ARRAY;
      deleteCount = change.removedCount;
      newItems = change.added;
    }
    newItems = newItems.length === 0 ? newItems : newItems.map(function(v) {
      return _this.enhancer_(v, void 0);
    });
    if (this.legacyMode_ || true) {
      var lengthDelta = newItems.length - deleteCount;
      this.updateArrayLength_(length, lengthDelta);
    }
    var res = this.spliceItemsIntoValues_(index, deleteCount, newItems);
    if (deleteCount !== 0 || newItems.length !== 0)
      this.notifyArraySplice_(index, newItems, res);
    return this.dehanceValues_(res);
  };
  _proto.spliceItemsIntoValues_ = function spliceItemsIntoValues_(index, deleteCount, newItems) {
    if (newItems.length < MAX_SPLICE_SIZE) {
      var _this$values_;
      return (_this$values_ = this.values_).splice.apply(_this$values_, [index, deleteCount].concat(newItems));
    } else {
      var res = this.values_.slice(index, index + deleteCount);
      var oldItems = this.values_.slice(index + deleteCount);
      this.values_.length += newItems.length - deleteCount;
      for (var i = 0; i < newItems.length; i++) {
        this.values_[index + i] = newItems[i];
      }
      for (var _i = 0; _i < oldItems.length; _i++) {
        this.values_[index + newItems.length + _i] = oldItems[_i];
      }
      return res;
    }
  };
  _proto.notifyArrayChildUpdate_ = function notifyArrayChildUpdate_(index, newValue, oldValue) {
    var notifySpy = !this.owned_ && isSpyEnabled();
    var notify = hasListeners(this);
    var change = notify || notifySpy ? {
      observableKind: "array",
      object: this.proxy_,
      type: UPDATE,
      debugObjectName: this.atom_.name_,
      index,
      newValue,
      oldValue
    } : null;
    if (notifySpy)
      spyReportStart(change);
    this.atom_.reportChanged();
    if (notify)
      notifyListeners(this, change);
    if (notifySpy)
      spyReportEnd();
  };
  _proto.notifyArraySplice_ = function notifyArraySplice_(index, added, removed) {
    var notifySpy = !this.owned_ && isSpyEnabled();
    var notify = hasListeners(this);
    var change = notify || notifySpy ? {
      observableKind: "array",
      object: this.proxy_,
      debugObjectName: this.atom_.name_,
      type: SPLICE,
      index,
      removed,
      added,
      removedCount: removed.length,
      addedCount: added.length
    } : null;
    if (notifySpy)
      spyReportStart(change);
    this.atom_.reportChanged();
    if (notify)
      notifyListeners(this, change);
    if (notifySpy)
      spyReportEnd();
  };
  _proto.get_ = function get_(index) {
    if (index < this.values_.length) {
      this.atom_.reportObserved();
      return this.dehanceValue_(this.values_[index]);
    }
    console.warn(true ? "[mobx] Out of bounds read: " + index : "[mobx.array] Attempt to read an array index (" + index + ") that is out of bounds (" + this.values_.length + "). Please check length first. Out of bound indices will not be tracked by MobX");
  };
  _proto.set_ = function set_(index, newValue) {
    var values = this.values_;
    if (index < values.length) {
      checkIfStateModificationsAreAllowed(this.atom_);
      var oldValue = values[index];
      if (hasInterceptors(this)) {
        var change = interceptChange(this, {
          type: UPDATE,
          object: this.proxy_,
          index,
          newValue
        });
        if (!change)
          return;
        newValue = change.newValue;
      }
      newValue = this.enhancer_(newValue, oldValue);
      var changed = newValue !== oldValue;
      if (changed) {
        values[index] = newValue;
        this.notifyArrayChildUpdate_(index, newValue, oldValue);
      }
    } else if (index === values.length) {
      this.spliceWithArray_(index, 0, [newValue]);
    } else {
      die(17, index, values.length);
    }
  };
  return ObservableArrayAdministration2;
}();
function createObservableArray(initialValues, enhancer, name, owned) {
  if (name === void 0) {
    name = true ? "ObservableArray@" + getNextId() : "ObservableArray";
  }
  if (owned === void 0) {
    owned = false;
  }
  assertProxies();
  var adm = new ObservableArrayAdministration(name, enhancer, owned, false);
  addHiddenFinalProp(adm.values_, $mobx, adm);
  var proxy = new Proxy(adm.values_, arrayTraps);
  adm.proxy_ = proxy;
  if (initialValues && initialValues.length) {
    var prev = allowStateChangesStart(true);
    adm.spliceWithArray_(0, 0, initialValues);
    allowStateChangesEnd(prev);
  }
  return proxy;
}
var arrayExtensions = {
  clear: function clear() {
    return this.splice(0);
  },
  replace: function replace(newItems) {
    var adm = this[$mobx];
    return adm.spliceWithArray_(0, adm.values_.length, newItems);
  },
  toJSON: function toJSON() {
    return this.slice();
  },
  splice: function splice(index, deleteCount) {
    for (var _len = arguments.length, newItems = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      newItems[_key - 2] = arguments[_key];
    }
    var adm = this[$mobx];
    switch (arguments.length) {
      case 0:
        return [];
      case 1:
        return adm.spliceWithArray_(index);
      case 2:
        return adm.spliceWithArray_(index, deleteCount);
    }
    return adm.spliceWithArray_(index, deleteCount, newItems);
  },
  spliceWithArray: function spliceWithArray(index, deleteCount, newItems) {
    return this[$mobx].spliceWithArray_(index, deleteCount, newItems);
  },
  push: function push() {
    var adm = this[$mobx];
    for (var _len2 = arguments.length, items = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      items[_key2] = arguments[_key2];
    }
    adm.spliceWithArray_(adm.values_.length, 0, items);
    return adm.values_.length;
  },
  pop: function pop() {
    return this.splice(Math.max(this[$mobx].values_.length - 1, 0), 1)[0];
  },
  shift: function shift() {
    return this.splice(0, 1)[0];
  },
  unshift: function unshift() {
    var adm = this[$mobx];
    for (var _len3 = arguments.length, items = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      items[_key3] = arguments[_key3];
    }
    adm.spliceWithArray_(0, 0, items);
    return adm.values_.length;
  },
  reverse: function reverse() {
    if (globalState.trackingDerivation) {
      die(37, "reverse");
    }
    this.replace(this.slice().reverse());
    return this;
  },
  sort: function sort() {
    if (globalState.trackingDerivation) {
      die(37, "sort");
    }
    var copy = this.slice();
    copy.sort.apply(copy, arguments);
    this.replace(copy);
    return this;
  },
  remove: function remove(value) {
    var adm = this[$mobx];
    var idx = adm.dehanceValues_(adm.values_).indexOf(value);
    if (idx > -1) {
      this.splice(idx, 1);
      return true;
    }
    return false;
  }
};
addArrayExtension("concat", simpleFunc);
addArrayExtension("flat", simpleFunc);
addArrayExtension("includes", simpleFunc);
addArrayExtension("indexOf", simpleFunc);
addArrayExtension("join", simpleFunc);
addArrayExtension("lastIndexOf", simpleFunc);
addArrayExtension("slice", simpleFunc);
addArrayExtension("toString", simpleFunc);
addArrayExtension("toLocaleString", simpleFunc);
addArrayExtension("every", mapLikeFunc);
addArrayExtension("filter", mapLikeFunc);
addArrayExtension("find", mapLikeFunc);
addArrayExtension("findIndex", mapLikeFunc);
addArrayExtension("flatMap", mapLikeFunc);
addArrayExtension("forEach", mapLikeFunc);
addArrayExtension("map", mapLikeFunc);
addArrayExtension("some", mapLikeFunc);
addArrayExtension("reduce", reduceLikeFunc);
addArrayExtension("reduceRight", reduceLikeFunc);
function addArrayExtension(funcName, funcFactory) {
  if (typeof Array.prototype[funcName] === "function") {
    arrayExtensions[funcName] = funcFactory(funcName);
  }
}
function simpleFunc(funcName) {
  return function() {
    var adm = this[$mobx];
    adm.atom_.reportObserved();
    var dehancedValues = adm.dehanceValues_(adm.values_);
    return dehancedValues[funcName].apply(dehancedValues, arguments);
  };
}
function mapLikeFunc(funcName) {
  return function(callback, thisArg) {
    var _this2 = this;
    var adm = this[$mobx];
    adm.atom_.reportObserved();
    var dehancedValues = adm.dehanceValues_(adm.values_);
    return dehancedValues[funcName](function(element, index) {
      return callback.call(thisArg, element, index, _this2);
    });
  };
}
function reduceLikeFunc(funcName) {
  return function() {
    var _this3 = this;
    var adm = this[$mobx];
    adm.atom_.reportObserved();
    var dehancedValues = adm.dehanceValues_(adm.values_);
    var callback = arguments[0];
    arguments[0] = function(accumulator, currentValue, index) {
      return callback(accumulator, currentValue, index, _this3);
    };
    return dehancedValues[funcName].apply(dehancedValues, arguments);
  };
}
var isObservableArrayAdministration = /* @__PURE__ */ createInstanceofPredicate("ObservableArrayAdministration", ObservableArrayAdministration);
function isObservableArray(thing) {
  return isObject(thing) && isObservableArrayAdministration(thing[$mobx]);
}
var _Symbol$iterator;
var _Symbol$toStringTag;
var ObservableMapMarker = {};
var ADD = "add";
var DELETE = "delete";
_Symbol$iterator = Symbol.iterator;
_Symbol$toStringTag = Symbol.toStringTag;
var ObservableMap = /* @__PURE__ */ function() {
  function ObservableMap2(initialData, enhancer_, name_) {
    if (enhancer_ === void 0) {
      enhancer_ = deepEnhancer;
    }
    if (name_ === void 0) {
      name_ = true ? "ObservableMap@" + getNextId() : "ObservableMap";
    }
    this.enhancer_ = void 0;
    this.name_ = void 0;
    this[$mobx] = ObservableMapMarker;
    this.data_ = void 0;
    this.hasMap_ = void 0;
    this.keysAtom_ = void 0;
    this.interceptors_ = void 0;
    this.changeListeners_ = void 0;
    this.dehancer = void 0;
    this.enhancer_ = enhancer_;
    this.name_ = name_;
    if (!isFunction(Map)) {
      die(18);
    }
    this.keysAtom_ = createAtom(true ? this.name_ + ".keys()" : "ObservableMap.keys()");
    this.data_ = /* @__PURE__ */ new Map();
    this.hasMap_ = /* @__PURE__ */ new Map();
    this.merge(initialData);
  }
  var _proto = ObservableMap2.prototype;
  _proto.has_ = function has_(key) {
    return this.data_.has(key);
  };
  _proto.has = function has2(key) {
    var _this = this;
    if (!globalState.trackingDerivation)
      return this.has_(key);
    var entry = this.hasMap_.get(key);
    if (!entry) {
      var newEntry = entry = new ObservableValue(this.has_(key), referenceEnhancer, true ? this.name_ + "." + stringifyKey(key) + "?" : "ObservableMap.key?", false);
      this.hasMap_.set(key, newEntry);
      onBecomeUnobserved(newEntry, function() {
        return _this.hasMap_["delete"](key);
      });
    }
    return entry.get();
  };
  _proto.set = function set4(key, value) {
    var hasKey = this.has_(key);
    if (hasInterceptors(this)) {
      var change = interceptChange(this, {
        type: hasKey ? UPDATE : ADD,
        object: this,
        newValue: value,
        name: key
      });
      if (!change)
        return this;
      value = change.newValue;
    }
    if (hasKey) {
      this.updateValue_(key, value);
    } else {
      this.addValue_(key, value);
    }
    return this;
  };
  _proto["delete"] = function _delete(key) {
    var _this2 = this;
    checkIfStateModificationsAreAllowed(this.keysAtom_);
    if (hasInterceptors(this)) {
      var change = interceptChange(this, {
        type: DELETE,
        object: this,
        name: key
      });
      if (!change)
        return false;
    }
    if (this.has_(key)) {
      var notifySpy = isSpyEnabled();
      var notify = hasListeners(this);
      var _change = notify || notifySpy ? {
        observableKind: "map",
        debugObjectName: this.name_,
        type: DELETE,
        object: this,
        oldValue: this.data_.get(key).value_,
        name: key
      } : null;
      if (notifySpy)
        spyReportStart(_change);
      transaction(function() {
        var _this2$hasMap_$get;
        _this2.keysAtom_.reportChanged();
        (_this2$hasMap_$get = _this2.hasMap_.get(key)) == null ? void 0 : _this2$hasMap_$get.setNewValue_(false);
        var observable2 = _this2.data_.get(key);
        observable2.setNewValue_(void 0);
        _this2.data_["delete"](key);
      });
      if (notify)
        notifyListeners(this, _change);
      if (notifySpy)
        spyReportEnd();
      return true;
    }
    return false;
  };
  _proto.updateValue_ = function updateValue_(key, newValue) {
    var observable2 = this.data_.get(key);
    newValue = observable2.prepareNewValue_(newValue);
    if (newValue !== globalState.UNCHANGED) {
      var notifySpy = isSpyEnabled();
      var notify = hasListeners(this);
      var change = notify || notifySpy ? {
        observableKind: "map",
        debugObjectName: this.name_,
        type: UPDATE,
        object: this,
        oldValue: observable2.value_,
        name: key,
        newValue
      } : null;
      if (notifySpy)
        spyReportStart(change);
      observable2.setNewValue_(newValue);
      if (notify)
        notifyListeners(this, change);
      if (notifySpy)
        spyReportEnd();
    }
  };
  _proto.addValue_ = function addValue_(key, newValue) {
    var _this3 = this;
    checkIfStateModificationsAreAllowed(this.keysAtom_);
    transaction(function() {
      var _this3$hasMap_$get;
      var observable2 = new ObservableValue(newValue, _this3.enhancer_, true ? _this3.name_ + "." + stringifyKey(key) : "ObservableMap.key", false);
      _this3.data_.set(key, observable2);
      newValue = observable2.value_;
      (_this3$hasMap_$get = _this3.hasMap_.get(key)) == null ? void 0 : _this3$hasMap_$get.setNewValue_(true);
      _this3.keysAtom_.reportChanged();
    });
    var notifySpy = isSpyEnabled();
    var notify = hasListeners(this);
    var change = notify || notifySpy ? {
      observableKind: "map",
      debugObjectName: this.name_,
      type: ADD,
      object: this,
      name: key,
      newValue
    } : null;
    if (notifySpy)
      spyReportStart(change);
    if (notify)
      notifyListeners(this, change);
    if (notifySpy)
      spyReportEnd();
  };
  _proto.get = function get3(key) {
    if (this.has(key))
      return this.dehanceValue_(this.data_.get(key).get());
    return this.dehanceValue_(void 0);
  };
  _proto.dehanceValue_ = function dehanceValue_(value) {
    if (this.dehancer !== void 0) {
      return this.dehancer(value);
    }
    return value;
  };
  _proto.keys = function keys() {
    this.keysAtom_.reportObserved();
    return this.data_.keys();
  };
  _proto.values = function values() {
    var self2 = this;
    var keys = this.keys();
    return makeIterable({
      next: function next() {
        var _keys$next = keys.next(), done = _keys$next.done, value = _keys$next.value;
        return {
          done,
          value: done ? void 0 : self2.get(value)
        };
      }
    });
  };
  _proto.entries = function entries() {
    var self2 = this;
    var keys = this.keys();
    return makeIterable({
      next: function next() {
        var _keys$next2 = keys.next(), done = _keys$next2.done, value = _keys$next2.value;
        return {
          done,
          value: done ? void 0 : [value, self2.get(value)]
        };
      }
    });
  };
  _proto[_Symbol$iterator] = function() {
    return this.entries();
  };
  _proto.forEach = function forEach(callback, thisArg) {
    for (var _iterator = _createForOfIteratorHelperLoose(this), _step; !(_step = _iterator()).done; ) {
      var _step$value = _step.value, key = _step$value[0], value = _step$value[1];
      callback.call(thisArg, value, key, this);
    }
  };
  _proto.merge = function merge(other) {
    var _this4 = this;
    if (isObservableMap(other)) {
      other = new Map(other);
    }
    transaction(function() {
      if (isPlainObject(other))
        getPlainObjectKeys(other).forEach(function(key) {
          return _this4.set(key, other[key]);
        });
      else if (Array.isArray(other))
        other.forEach(function(_ref) {
          var key = _ref[0], value = _ref[1];
          return _this4.set(key, value);
        });
      else if (isES6Map(other)) {
        if (other.constructor !== Map)
          die(19, other);
        other.forEach(function(value, key) {
          return _this4.set(key, value);
        });
      } else if (other !== null && other !== void 0)
        die(20, other);
    });
    return this;
  };
  _proto.clear = function clear2() {
    var _this5 = this;
    transaction(function() {
      untracked(function() {
        for (var _iterator2 = _createForOfIteratorHelperLoose(_this5.keys()), _step2; !(_step2 = _iterator2()).done; ) {
          var key = _step2.value;
          _this5["delete"](key);
        }
      });
    });
  };
  _proto.replace = function replace2(values) {
    var _this6 = this;
    transaction(function() {
      var replacementMap = convertToMap(values);
      var orderedData = /* @__PURE__ */ new Map();
      var keysReportChangedCalled = false;
      for (var _iterator3 = _createForOfIteratorHelperLoose(_this6.data_.keys()), _step3; !(_step3 = _iterator3()).done; ) {
        var key = _step3.value;
        if (!replacementMap.has(key)) {
          var deleted = _this6["delete"](key);
          if (deleted) {
            keysReportChangedCalled = true;
          } else {
            var value = _this6.data_.get(key);
            orderedData.set(key, value);
          }
        }
      }
      for (var _iterator4 = _createForOfIteratorHelperLoose(replacementMap.entries()), _step4; !(_step4 = _iterator4()).done; ) {
        var _step4$value = _step4.value, _key = _step4$value[0], _value = _step4$value[1];
        var keyExisted = _this6.data_.has(_key);
        _this6.set(_key, _value);
        if (_this6.data_.has(_key)) {
          var _value2 = _this6.data_.get(_key);
          orderedData.set(_key, _value2);
          if (!keyExisted) {
            keysReportChangedCalled = true;
          }
        }
      }
      if (!keysReportChangedCalled) {
        if (_this6.data_.size !== orderedData.size) {
          _this6.keysAtom_.reportChanged();
        } else {
          var iter1 = _this6.data_.keys();
          var iter2 = orderedData.keys();
          var next1 = iter1.next();
          var next2 = iter2.next();
          while (!next1.done) {
            if (next1.value !== next2.value) {
              _this6.keysAtom_.reportChanged();
              break;
            }
            next1 = iter1.next();
            next2 = iter2.next();
          }
        }
      }
      _this6.data_ = orderedData;
    });
    return this;
  };
  _proto.toString = function toString2() {
    return "[object ObservableMap]";
  };
  _proto.toJSON = function toJSON2() {
    return Array.from(this);
  };
  _proto.observe_ = function observe_(listener, fireImmediately) {
    if (fireImmediately === true)
      die("`observe` doesn't support fireImmediately=true in combination with maps.");
    return registerListener(this, listener);
  };
  _proto.intercept_ = function intercept_(handler) {
    return registerInterceptor(this, handler);
  };
  _createClass(ObservableMap2, [{
    key: "size",
    get: function get3() {
      this.keysAtom_.reportObserved();
      return this.data_.size;
    }
  }, {
    key: _Symbol$toStringTag,
    get: function get3() {
      return "Map";
    }
  }]);
  return ObservableMap2;
}();
var isObservableMap = /* @__PURE__ */ createInstanceofPredicate("ObservableMap", ObservableMap);
function convertToMap(dataStructure) {
  if (isES6Map(dataStructure) || isObservableMap(dataStructure)) {
    return dataStructure;
  } else if (Array.isArray(dataStructure)) {
    return new Map(dataStructure);
  } else if (isPlainObject(dataStructure)) {
    var map2 = /* @__PURE__ */ new Map();
    for (var key in dataStructure) {
      map2.set(key, dataStructure[key]);
    }
    return map2;
  } else {
    return die(21, dataStructure);
  }
}
var _Symbol$iterator$1;
var _Symbol$toStringTag$1;
var ObservableSetMarker = {};
_Symbol$iterator$1 = Symbol.iterator;
_Symbol$toStringTag$1 = Symbol.toStringTag;
var ObservableSet = /* @__PURE__ */ function() {
  function ObservableSet2(initialData, enhancer, name_) {
    if (enhancer === void 0) {
      enhancer = deepEnhancer;
    }
    if (name_ === void 0) {
      name_ = true ? "ObservableSet@" + getNextId() : "ObservableSet";
    }
    this.name_ = void 0;
    this[$mobx] = ObservableSetMarker;
    this.data_ = /* @__PURE__ */ new Set();
    this.atom_ = void 0;
    this.changeListeners_ = void 0;
    this.interceptors_ = void 0;
    this.dehancer = void 0;
    this.enhancer_ = void 0;
    this.name_ = name_;
    if (!isFunction(Set)) {
      die(22);
    }
    this.atom_ = createAtom(this.name_);
    this.enhancer_ = function(newV, oldV) {
      return enhancer(newV, oldV, name_);
    };
    if (initialData) {
      this.replace(initialData);
    }
  }
  var _proto = ObservableSet2.prototype;
  _proto.dehanceValue_ = function dehanceValue_(value) {
    if (this.dehancer !== void 0) {
      return this.dehancer(value);
    }
    return value;
  };
  _proto.clear = function clear2() {
    var _this = this;
    transaction(function() {
      untracked(function() {
        for (var _iterator = _createForOfIteratorHelperLoose(_this.data_.values()), _step; !(_step = _iterator()).done; ) {
          var value = _step.value;
          _this["delete"](value);
        }
      });
    });
  };
  _proto.forEach = function forEach(callbackFn, thisArg) {
    for (var _iterator2 = _createForOfIteratorHelperLoose(this), _step2; !(_step2 = _iterator2()).done; ) {
      var value = _step2.value;
      callbackFn.call(thisArg, value, value, this);
    }
  };
  _proto.add = function add(value) {
    var _this2 = this;
    checkIfStateModificationsAreAllowed(this.atom_);
    if (hasInterceptors(this)) {
      var change = interceptChange(this, {
        type: ADD,
        object: this,
        newValue: value
      });
      if (!change)
        return this;
    }
    if (!this.has(value)) {
      transaction(function() {
        _this2.data_.add(_this2.enhancer_(value, void 0));
        _this2.atom_.reportChanged();
      });
      var notifySpy = isSpyEnabled();
      var notify = hasListeners(this);
      var _change = notify || notifySpy ? {
        observableKind: "set",
        debugObjectName: this.name_,
        type: ADD,
        object: this,
        newValue: value
      } : null;
      if (notifySpy && true)
        spyReportStart(_change);
      if (notify)
        notifyListeners(this, _change);
      if (notifySpy && true)
        spyReportEnd();
    }
    return this;
  };
  _proto["delete"] = function _delete(value) {
    var _this3 = this;
    if (hasInterceptors(this)) {
      var change = interceptChange(this, {
        type: DELETE,
        object: this,
        oldValue: value
      });
      if (!change)
        return false;
    }
    if (this.has(value)) {
      var notifySpy = isSpyEnabled();
      var notify = hasListeners(this);
      var _change2 = notify || notifySpy ? {
        observableKind: "set",
        debugObjectName: this.name_,
        type: DELETE,
        object: this,
        oldValue: value
      } : null;
      if (notifySpy && true)
        spyReportStart(_change2);
      transaction(function() {
        _this3.atom_.reportChanged();
        _this3.data_["delete"](value);
      });
      if (notify)
        notifyListeners(this, _change2);
      if (notifySpy && true)
        spyReportEnd();
      return true;
    }
    return false;
  };
  _proto.has = function has2(value) {
    this.atom_.reportObserved();
    return this.data_.has(this.dehanceValue_(value));
  };
  _proto.entries = function entries() {
    var nextIndex = 0;
    var keys = Array.from(this.keys());
    var values = Array.from(this.values());
    return makeIterable({
      next: function next() {
        var index = nextIndex;
        nextIndex += 1;
        return index < values.length ? {
          value: [keys[index], values[index]],
          done: false
        } : {
          done: true
        };
      }
    });
  };
  _proto.keys = function keys() {
    return this.values();
  };
  _proto.values = function values() {
    this.atom_.reportObserved();
    var self2 = this;
    var nextIndex = 0;
    var observableValues = Array.from(this.data_.values());
    return makeIterable({
      next: function next() {
        return nextIndex < observableValues.length ? {
          value: self2.dehanceValue_(observableValues[nextIndex++]),
          done: false
        } : {
          done: true
        };
      }
    });
  };
  _proto.replace = function replace2(other) {
    var _this4 = this;
    if (isObservableSet(other)) {
      other = new Set(other);
    }
    transaction(function() {
      if (Array.isArray(other)) {
        _this4.clear();
        other.forEach(function(value) {
          return _this4.add(value);
        });
      } else if (isES6Set(other)) {
        _this4.clear();
        other.forEach(function(value) {
          return _this4.add(value);
        });
      } else if (other !== null && other !== void 0) {
        die("Cannot initialize set from " + other);
      }
    });
    return this;
  };
  _proto.observe_ = function observe_(listener, fireImmediately) {
    if (fireImmediately === true)
      die("`observe` doesn't support fireImmediately=true in combination with sets.");
    return registerListener(this, listener);
  };
  _proto.intercept_ = function intercept_(handler) {
    return registerInterceptor(this, handler);
  };
  _proto.toJSON = function toJSON2() {
    return Array.from(this);
  };
  _proto.toString = function toString2() {
    return "[object ObservableSet]";
  };
  _proto[_Symbol$iterator$1] = function() {
    return this.values();
  };
  _createClass(ObservableSet2, [{
    key: "size",
    get: function get3() {
      this.atom_.reportObserved();
      return this.data_.size;
    }
  }, {
    key: _Symbol$toStringTag$1,
    get: function get3() {
      return "Set";
    }
  }]);
  return ObservableSet2;
}();
var isObservableSet = /* @__PURE__ */ createInstanceofPredicate("ObservableSet", ObservableSet);
var descriptorCache = /* @__PURE__ */ Object.create(null);
var REMOVE = "remove";
var ObservableObjectAdministration = /* @__PURE__ */ function() {
  function ObservableObjectAdministration2(target_, values_, name_, defaultAnnotation_) {
    if (values_ === void 0) {
      values_ = /* @__PURE__ */ new Map();
    }
    if (defaultAnnotation_ === void 0) {
      defaultAnnotation_ = autoAnnotation;
    }
    this.target_ = void 0;
    this.values_ = void 0;
    this.name_ = void 0;
    this.defaultAnnotation_ = void 0;
    this.keysAtom_ = void 0;
    this.changeListeners_ = void 0;
    this.interceptors_ = void 0;
    this.proxy_ = void 0;
    this.isPlainObject_ = void 0;
    this.appliedAnnotations_ = void 0;
    this.pendingKeys_ = void 0;
    this.target_ = target_;
    this.values_ = values_;
    this.name_ = name_;
    this.defaultAnnotation_ = defaultAnnotation_;
    this.keysAtom_ = new Atom(true ? this.name_ + ".keys" : "ObservableObject.keys");
    this.isPlainObject_ = isPlainObject(this.target_);
    if (!isAnnotation(this.defaultAnnotation_)) {
      die("defaultAnnotation must be valid annotation");
    }
    if (true) {
      this.appliedAnnotations_ = {};
    }
  }
  var _proto = ObservableObjectAdministration2.prototype;
  _proto.getObservablePropValue_ = function getObservablePropValue_(key) {
    return this.values_.get(key).get();
  };
  _proto.setObservablePropValue_ = function setObservablePropValue_(key, newValue) {
    var observable2 = this.values_.get(key);
    if (observable2 instanceof ComputedValue) {
      observable2.set(newValue);
      return true;
    }
    if (hasInterceptors(this)) {
      var change = interceptChange(this, {
        type: UPDATE,
        object: this.proxy_ || this.target_,
        name: key,
        newValue
      });
      if (!change)
        return null;
      newValue = change.newValue;
    }
    newValue = observable2.prepareNewValue_(newValue);
    if (newValue !== globalState.UNCHANGED) {
      var notify = hasListeners(this);
      var notifySpy = isSpyEnabled();
      var _change = notify || notifySpy ? {
        type: UPDATE,
        observableKind: "object",
        debugObjectName: this.name_,
        object: this.proxy_ || this.target_,
        oldValue: observable2.value_,
        name: key,
        newValue
      } : null;
      if (notifySpy)
        spyReportStart(_change);
      observable2.setNewValue_(newValue);
      if (notify)
        notifyListeners(this, _change);
      if (notifySpy)
        spyReportEnd();
    }
    return true;
  };
  _proto.get_ = function get_(key) {
    if (globalState.trackingDerivation && !hasProp(this.target_, key)) {
      this.has_(key);
    }
    return this.target_[key];
  };
  _proto.set_ = function set_(key, value, proxyTrap) {
    if (proxyTrap === void 0) {
      proxyTrap = false;
    }
    if (hasProp(this.target_, key)) {
      if (this.values_.has(key)) {
        return this.setObservablePropValue_(key, value);
      } else if (proxyTrap) {
        return Reflect.set(this.target_, key, value);
      } else {
        this.target_[key] = value;
        return true;
      }
    } else {
      return this.extend_(key, {
        value,
        enumerable: true,
        writable: true,
        configurable: true
      }, this.defaultAnnotation_, proxyTrap);
    }
  };
  _proto.has_ = function has_(key) {
    if (!globalState.trackingDerivation) {
      return key in this.target_;
    }
    this.pendingKeys_ || (this.pendingKeys_ = /* @__PURE__ */ new Map());
    var entry = this.pendingKeys_.get(key);
    if (!entry) {
      entry = new ObservableValue(key in this.target_, referenceEnhancer, true ? this.name_ + "." + stringifyKey(key) + "?" : "ObservableObject.key?", false);
      this.pendingKeys_.set(key, entry);
    }
    return entry.get();
  };
  _proto.make_ = function make_(key, annotation) {
    if (annotation === true) {
      annotation = this.defaultAnnotation_;
    }
    if (annotation === false) {
      return;
    }
    assertAnnotable(this, annotation, key);
    if (!(key in this.target_)) {
      var _this$target_$storedA;
      if ((_this$target_$storedA = this.target_[storedAnnotationsSymbol]) == null ? void 0 : _this$target_$storedA[key]) {
        return;
      } else {
        die(1, annotation.annotationType_, this.name_ + "." + key.toString());
      }
    }
    var source = this.target_;
    while (source && source !== objectPrototype) {
      var descriptor = getDescriptor(source, key);
      if (descriptor) {
        var outcome = annotation.make_(this, key, descriptor, source);
        if (outcome === 0)
          return;
        if (outcome === 1)
          break;
      }
      source = Object.getPrototypeOf(source);
    }
    recordAnnotationApplied(this, annotation, key);
  };
  _proto.extend_ = function extend_(key, descriptor, annotation, proxyTrap) {
    if (proxyTrap === void 0) {
      proxyTrap = false;
    }
    if (annotation === true) {
      annotation = this.defaultAnnotation_;
    }
    if (annotation === false) {
      return this.defineProperty_(key, descriptor, proxyTrap);
    }
    assertAnnotable(this, annotation, key);
    var outcome = annotation.extend_(this, key, descriptor, proxyTrap);
    if (outcome) {
      recordAnnotationApplied(this, annotation, key);
    }
    return outcome;
  };
  _proto.defineProperty_ = function defineProperty_(key, descriptor, proxyTrap) {
    if (proxyTrap === void 0) {
      proxyTrap = false;
    }
    try {
      startBatch();
      var deleteOutcome = this.delete_(key);
      if (!deleteOutcome) {
        return deleteOutcome;
      }
      if (hasInterceptors(this)) {
        var change = interceptChange(this, {
          object: this.proxy_ || this.target_,
          name: key,
          type: ADD,
          newValue: descriptor.value
        });
        if (!change)
          return null;
        var newValue = change.newValue;
        if (descriptor.value !== newValue) {
          descriptor = _extends({}, descriptor, {
            value: newValue
          });
        }
      }
      if (proxyTrap) {
        if (!Reflect.defineProperty(this.target_, key, descriptor)) {
          return false;
        }
      } else {
        defineProperty(this.target_, key, descriptor);
      }
      this.notifyPropertyAddition_(key, descriptor.value);
    } finally {
      endBatch();
    }
    return true;
  };
  _proto.defineObservableProperty_ = function defineObservableProperty_(key, value, enhancer, proxyTrap) {
    if (proxyTrap === void 0) {
      proxyTrap = false;
    }
    try {
      startBatch();
      var deleteOutcome = this.delete_(key);
      if (!deleteOutcome) {
        return deleteOutcome;
      }
      if (hasInterceptors(this)) {
        var change = interceptChange(this, {
          object: this.proxy_ || this.target_,
          name: key,
          type: ADD,
          newValue: value
        });
        if (!change)
          return null;
        value = change.newValue;
      }
      var cachedDescriptor = getCachedObservablePropDescriptor(key);
      var descriptor = {
        configurable: globalState.safeDescriptors ? this.isPlainObject_ : true,
        enumerable: true,
        get: cachedDescriptor.get,
        set: cachedDescriptor.set
      };
      if (proxyTrap) {
        if (!Reflect.defineProperty(this.target_, key, descriptor)) {
          return false;
        }
      } else {
        defineProperty(this.target_, key, descriptor);
      }
      var observable2 = new ObservableValue(value, enhancer, true ? this.name_ + "." + key.toString() : "ObservableObject.key", false);
      this.values_.set(key, observable2);
      this.notifyPropertyAddition_(key, observable2.value_);
    } finally {
      endBatch();
    }
    return true;
  };
  _proto.defineComputedProperty_ = function defineComputedProperty_(key, options, proxyTrap) {
    if (proxyTrap === void 0) {
      proxyTrap = false;
    }
    try {
      startBatch();
      var deleteOutcome = this.delete_(key);
      if (!deleteOutcome) {
        return deleteOutcome;
      }
      if (hasInterceptors(this)) {
        var change = interceptChange(this, {
          object: this.proxy_ || this.target_,
          name: key,
          type: ADD,
          newValue: void 0
        });
        if (!change)
          return null;
      }
      options.name || (options.name = true ? this.name_ + "." + key.toString() : "ObservableObject.key");
      options.context = this.proxy_ || this.target_;
      var cachedDescriptor = getCachedObservablePropDescriptor(key);
      var descriptor = {
        configurable: globalState.safeDescriptors ? this.isPlainObject_ : true,
        enumerable: false,
        get: cachedDescriptor.get,
        set: cachedDescriptor.set
      };
      if (proxyTrap) {
        if (!Reflect.defineProperty(this.target_, key, descriptor)) {
          return false;
        }
      } else {
        defineProperty(this.target_, key, descriptor);
      }
      this.values_.set(key, new ComputedValue(options));
      this.notifyPropertyAddition_(key, void 0);
    } finally {
      endBatch();
    }
    return true;
  };
  _proto.delete_ = function delete_(key, proxyTrap) {
    if (proxyTrap === void 0) {
      proxyTrap = false;
    }
    if (!hasProp(this.target_, key)) {
      return true;
    }
    if (hasInterceptors(this)) {
      var change = interceptChange(this, {
        object: this.proxy_ || this.target_,
        name: key,
        type: REMOVE
      });
      if (!change)
        return null;
    }
    try {
      var _this$pendingKeys_, _this$pendingKeys_$ge;
      startBatch();
      var notify = hasListeners(this);
      var notifySpy = isSpyEnabled();
      var observable2 = this.values_.get(key);
      var value = void 0;
      if (!observable2 && (notify || notifySpy)) {
        var _getDescriptor2;
        value = (_getDescriptor2 = getDescriptor(this.target_, key)) == null ? void 0 : _getDescriptor2.value;
      }
      if (proxyTrap) {
        if (!Reflect.deleteProperty(this.target_, key)) {
          return false;
        }
      } else {
        delete this.target_[key];
      }
      if (true) {
        delete this.appliedAnnotations_[key];
      }
      if (observable2) {
        this.values_["delete"](key);
        if (observable2 instanceof ObservableValue) {
          value = observable2.value_;
        }
        propagateChanged(observable2);
      }
      this.keysAtom_.reportChanged();
      (_this$pendingKeys_ = this.pendingKeys_) == null ? void 0 : (_this$pendingKeys_$ge = _this$pendingKeys_.get(key)) == null ? void 0 : _this$pendingKeys_$ge.set(key in this.target_);
      if (notify || notifySpy) {
        var _change2 = {
          type: REMOVE,
          observableKind: "object",
          object: this.proxy_ || this.target_,
          debugObjectName: this.name_,
          oldValue: value,
          name: key
        };
        if (notifySpy)
          spyReportStart(_change2);
        if (notify)
          notifyListeners(this, _change2);
        if (notifySpy)
          spyReportEnd();
      }
    } finally {
      endBatch();
    }
    return true;
  };
  _proto.observe_ = function observe_(callback, fireImmediately) {
    if (fireImmediately === true)
      die("`observe` doesn't support the fire immediately property for observable objects.");
    return registerListener(this, callback);
  };
  _proto.intercept_ = function intercept_(handler) {
    return registerInterceptor(this, handler);
  };
  _proto.notifyPropertyAddition_ = function notifyPropertyAddition_(key, value) {
    var _this$pendingKeys_2, _this$pendingKeys_2$g;
    var notify = hasListeners(this);
    var notifySpy = isSpyEnabled();
    if (notify || notifySpy) {
      var change = notify || notifySpy ? {
        type: ADD,
        observableKind: "object",
        debugObjectName: this.name_,
        object: this.proxy_ || this.target_,
        name: key,
        newValue: value
      } : null;
      if (notifySpy)
        spyReportStart(change);
      if (notify)
        notifyListeners(this, change);
      if (notifySpy)
        spyReportEnd();
    }
    (_this$pendingKeys_2 = this.pendingKeys_) == null ? void 0 : (_this$pendingKeys_2$g = _this$pendingKeys_2.get(key)) == null ? void 0 : _this$pendingKeys_2$g.set(true);
    this.keysAtom_.reportChanged();
  };
  _proto.ownKeys_ = function ownKeys_() {
    this.keysAtom_.reportObserved();
    return ownKeys(this.target_);
  };
  _proto.keys_ = function keys_() {
    this.keysAtom_.reportObserved();
    return Object.keys(this.target_);
  };
  return ObservableObjectAdministration2;
}();
function asObservableObject(target, options) {
  var _options$name;
  if (options && isObservableObject(target)) {
    die("Options can't be provided for already observable objects.");
  }
  if (hasProp(target, $mobx)) {
    if (!(getAdministration(target) instanceof ObservableObjectAdministration)) {
      die("Cannot convert '" + getDebugName(target) + "' into observable object:\nThe target is already observable of different type.\nExtending builtins is not supported.");
    }
    return target;
  }
  if (!Object.isExtensible(target))
    die("Cannot make the designated object observable; it is not extensible");
  var name = (_options$name = options == null ? void 0 : options.name) != null ? _options$name : true ? (isPlainObject(target) ? "ObservableObject" : target.constructor.name) + "@" + getNextId() : "ObservableObject";
  var adm = new ObservableObjectAdministration(target, /* @__PURE__ */ new Map(), String(name), getAnnotationFromOptions(options));
  addHiddenProp(target, $mobx, adm);
  return target;
}
var isObservableObjectAdministration = /* @__PURE__ */ createInstanceofPredicate("ObservableObjectAdministration", ObservableObjectAdministration);
function getCachedObservablePropDescriptor(key) {
  return descriptorCache[key] || (descriptorCache[key] = {
    get: function get3() {
      return this[$mobx].getObservablePropValue_(key);
    },
    set: function set4(value) {
      return this[$mobx].setObservablePropValue_(key, value);
    }
  });
}
function isObservableObject(thing) {
  if (isObject(thing)) {
    return isObservableObjectAdministration(thing[$mobx]);
  }
  return false;
}
function recordAnnotationApplied(adm, annotation, key) {
  var _adm$target_$storedAn;
  if (true) {
    adm.appliedAnnotations_[key] = annotation;
  }
  (_adm$target_$storedAn = adm.target_[storedAnnotationsSymbol]) == null ? true : delete _adm$target_$storedAn[key];
}
function assertAnnotable(adm, annotation, key) {
  if (!isAnnotation(annotation)) {
    die("Cannot annotate '" + adm.name_ + "." + key.toString() + "': Invalid annotation.");
  }
  if (!isOverride(annotation) && hasProp(adm.appliedAnnotations_, key)) {
    var fieldName = adm.name_ + "." + key.toString();
    var currentAnnotationType = adm.appliedAnnotations_[key].annotationType_;
    var requestedAnnotationType = annotation.annotationType_;
    die("Cannot apply '" + requestedAnnotationType + "' to '" + fieldName + "':" + ("\nThe field is already annotated with '" + currentAnnotationType + "'.") + "\nRe-annotating fields is not allowed.\nUse 'override' annotation for methods overriden by subclass.");
  }
}
var OBSERVABLE_ARRAY_BUFFER_SIZE = 0;
var StubArray = function StubArray2() {
};
function inherit(ctor, proto) {
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(ctor.prototype, proto);
  } else if (ctor.prototype.__proto__ !== void 0) {
    ctor.prototype.__proto__ = proto;
  } else {
    ctor.prototype = proto;
  }
}
inherit(StubArray, Array.prototype);
var LegacyObservableArray = /* @__PURE__ */ function(_StubArray) {
  _inheritsLoose(LegacyObservableArray2, _StubArray);
  function LegacyObservableArray2(initialValues, enhancer, name, owned) {
    var _this;
    if (name === void 0) {
      name = true ? "ObservableArray@" + getNextId() : "ObservableArray";
    }
    if (owned === void 0) {
      owned = false;
    }
    _this = _StubArray.call(this) || this;
    var adm = new ObservableArrayAdministration(name, enhancer, owned, true);
    adm.proxy_ = _assertThisInitialized(_this);
    addHiddenFinalProp(_assertThisInitialized(_this), $mobx, adm);
    if (initialValues && initialValues.length) {
      var prev = allowStateChangesStart(true);
      _this.spliceWithArray(0, 0, initialValues);
      allowStateChangesEnd(prev);
    }
    return _this;
  }
  var _proto = LegacyObservableArray2.prototype;
  _proto.concat = function concat() {
    this[$mobx].atom_.reportObserved();
    for (var _len = arguments.length, arrays = new Array(_len), _key = 0; _key < _len; _key++) {
      arrays[_key] = arguments[_key];
    }
    return Array.prototype.concat.apply(this.slice(), arrays.map(function(a2) {
      return isObservableArray(a2) ? a2.slice() : a2;
    }));
  };
  _proto[Symbol.iterator] = function() {
    var self2 = this;
    var nextIndex = 0;
    return makeIterable({
      next: function next() {
        return nextIndex < self2.length ? {
          value: self2[nextIndex++],
          done: false
        } : {
          done: true,
          value: void 0
        };
      }
    });
  };
  _createClass(LegacyObservableArray2, [{
    key: "length",
    get: function get3() {
      return this[$mobx].getArrayLength_();
    },
    set: function set4(newLength) {
      this[$mobx].setArrayLength_(newLength);
    }
  }, {
    key: Symbol.toStringTag,
    get: function get3() {
      return "Array";
    }
  }]);
  return LegacyObservableArray2;
}(StubArray);
Object.entries(arrayExtensions).forEach(function(_ref) {
  var prop = _ref[0], fn = _ref[1];
  if (prop !== "concat")
    addHiddenProp(LegacyObservableArray.prototype, prop, fn);
});
function createArrayEntryDescriptor(index) {
  return {
    enumerable: false,
    configurable: true,
    get: function get3() {
      return this[$mobx].get_(index);
    },
    set: function set4(value) {
      this[$mobx].set_(index, value);
    }
  };
}
function createArrayBufferItem(index) {
  defineProperty(LegacyObservableArray.prototype, "" + index, createArrayEntryDescriptor(index));
}
function reserveArrayBuffer(max) {
  if (max > OBSERVABLE_ARRAY_BUFFER_SIZE) {
    for (var index = OBSERVABLE_ARRAY_BUFFER_SIZE; index < max + 100; index++) {
      createArrayBufferItem(index);
    }
    OBSERVABLE_ARRAY_BUFFER_SIZE = max;
  }
}
reserveArrayBuffer(1e3);
function createLegacyArray(initialValues, enhancer, name) {
  return new LegacyObservableArray(initialValues, enhancer, name);
}
function getAtom(thing, property) {
  if (typeof thing === "object" && thing !== null) {
    if (isObservableArray(thing)) {
      if (property !== void 0)
        die(23);
      return thing[$mobx].atom_;
    }
    if (isObservableSet(thing)) {
      return thing[$mobx];
    }
    if (isObservableMap(thing)) {
      if (property === void 0)
        return thing.keysAtom_;
      var observable2 = thing.data_.get(property) || thing.hasMap_.get(property);
      if (!observable2)
        die(25, property, getDebugName(thing));
      return observable2;
    }
    if (isObservableObject(thing)) {
      if (!property)
        return die(26);
      var _observable = thing[$mobx].values_.get(property);
      if (!_observable)
        die(27, property, getDebugName(thing));
      return _observable;
    }
    if (isAtom(thing) || isComputedValue(thing) || isReaction(thing)) {
      return thing;
    }
  } else if (isFunction(thing)) {
    if (isReaction(thing[$mobx])) {
      return thing[$mobx];
    }
  }
  die(28);
}
function getAdministration(thing, property) {
  if (!thing)
    die(29);
  if (property !== void 0)
    return getAdministration(getAtom(thing, property));
  if (isAtom(thing) || isComputedValue(thing) || isReaction(thing))
    return thing;
  if (isObservableMap(thing) || isObservableSet(thing))
    return thing;
  if (thing[$mobx])
    return thing[$mobx];
  die(24, thing);
}
function getDebugName(thing, property) {
  var named;
  if (property !== void 0) {
    named = getAtom(thing, property);
  } else if (isAction(thing)) {
    return thing.name;
  } else if (isObservableObject(thing) || isObservableMap(thing) || isObservableSet(thing)) {
    named = getAdministration(thing);
  } else {
    named = getAtom(thing);
  }
  return named.name_;
}
var toString = objectPrototype.toString;
function deepEqual(a2, b, depth) {
  if (depth === void 0) {
    depth = -1;
  }
  return eq(a2, b, depth);
}
function eq(a2, b, depth, aStack, bStack) {
  if (a2 === b)
    return a2 !== 0 || 1 / a2 === 1 / b;
  if (a2 == null || b == null)
    return false;
  if (a2 !== a2)
    return b !== b;
  var type = typeof a2;
  if (!isFunction(type) && type !== "object" && typeof b != "object")
    return false;
  var className = toString.call(a2);
  if (className !== toString.call(b))
    return false;
  switch (className) {
    case "[object RegExp]":
    case "[object String]":
      return "" + a2 === "" + b;
    case "[object Number]":
      if (+a2 !== +a2)
        return +b !== +b;
      return +a2 === 0 ? 1 / +a2 === 1 / b : +a2 === +b;
    case "[object Date]":
    case "[object Boolean]":
      return +a2 === +b;
    case "[object Symbol]":
      return typeof Symbol !== "undefined" && Symbol.valueOf.call(a2) === Symbol.valueOf.call(b);
    case "[object Map]":
    case "[object Set]":
      if (depth >= 0) {
        depth++;
      }
      break;
  }
  a2 = unwrap(a2);
  b = unwrap(b);
  var areArrays = className === "[object Array]";
  if (!areArrays) {
    if (typeof a2 != "object" || typeof b != "object")
      return false;
    var aCtor = a2.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor && isFunction(bCtor) && bCtor instanceof bCtor) && "constructor" in a2 && "constructor" in b) {
      return false;
    }
  }
  if (depth === 0) {
    return false;
  } else if (depth < 0) {
    depth = -1;
  }
  aStack = aStack || [];
  bStack = bStack || [];
  var length = aStack.length;
  while (length--) {
    if (aStack[length] === a2)
      return bStack[length] === b;
  }
  aStack.push(a2);
  bStack.push(b);
  if (areArrays) {
    length = a2.length;
    if (length !== b.length)
      return false;
    while (length--) {
      if (!eq(a2[length], b[length], depth - 1, aStack, bStack))
        return false;
    }
  } else {
    var keys = Object.keys(a2);
    var key;
    length = keys.length;
    if (Object.keys(b).length !== length)
      return false;
    while (length--) {
      key = keys[length];
      if (!(hasProp(b, key) && eq(a2[key], b[key], depth - 1, aStack, bStack)))
        return false;
    }
  }
  aStack.pop();
  bStack.pop();
  return true;
}
function unwrap(a2) {
  if (isObservableArray(a2))
    return a2.slice();
  if (isES6Map(a2) || isObservableMap(a2))
    return Array.from(a2.entries());
  if (isES6Set(a2) || isObservableSet(a2))
    return Array.from(a2.entries());
  return a2;
}
function makeIterable(iterator) {
  iterator[Symbol.iterator] = getSelf;
  return iterator;
}
function getSelf() {
  return this;
}
function isAnnotation(thing) {
  return thing instanceof Object && typeof thing.annotationType_ === "string" && isFunction(thing.make_) && isFunction(thing.extend_);
}
["Symbol", "Map", "Set"].forEach(function(m) {
  var g = getGlobal();
  if (typeof g[m] === "undefined") {
    die("MobX requires global '" + m + "' to be available or polyfilled");
  }
});
if (typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ === "object") {
  __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobx({
    spy,
    extras: {
      getDebugName
    },
    $mobx
  });
}

// ../../packages/core/dist/esm/index.js
var import_rbush = __toESM(require_rbush_min());
var __defProp4 = Object.defineProperty;
var __defProps2 = Object.defineProperties;
var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs2 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols2 = Object.getOwnPropertySymbols;
var __hasOwnProp3 = Object.prototype.hasOwnProperty;
var __propIsEnum2 = Object.prototype.propertyIsEnumerable;
var __defNormalProp4 = (obj, key, value) => key in obj ? __defProp4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues2 = (a2, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp3.call(b, prop))
      __defNormalProp4(a2, prop, b[prop]);
  if (__getOwnPropSymbols2)
    for (var prop of __getOwnPropSymbols2(b)) {
      if (__propIsEnum2.call(b, prop))
        __defNormalProp4(a2, prop, b[prop]);
    }
  return a2;
};
var __spreadProps2 = (a2, b) => __defProps2(a2, __getOwnPropDescs2(b));
var __decorateClass2 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc2(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp4(target, key, result);
  return result;
};
var __publicField3 = (obj, key, value) => {
  __defNormalProp4(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var TLResizeEdge = /* @__PURE__ */ ((TLResizeEdge2) => {
  TLResizeEdge2["Top"] = "top_edge";
  TLResizeEdge2["Right"] = "right_edge";
  TLResizeEdge2["Bottom"] = "bottom_edge";
  TLResizeEdge2["Left"] = "left_edge";
  return TLResizeEdge2;
})(TLResizeEdge || {});
var TLResizeCorner = /* @__PURE__ */ ((TLResizeCorner2) => {
  TLResizeCorner2["TopLeft"] = "top_left_corner";
  TLResizeCorner2["TopRight"] = "top_right_corner";
  TLResizeCorner2["BottomRight"] = "bottom_right_corner";
  TLResizeCorner2["BottomLeft"] = "bottom_left_corner";
  return TLResizeCorner2;
})(TLResizeCorner || {});
var TLRotateCorner = /* @__PURE__ */ ((TLRotateCorner2) => {
  TLRotateCorner2["TopLeft"] = "top_left_resize_corner";
  TLRotateCorner2["TopRight"] = "top_right_resize_corner";
  TLRotateCorner2["BottomRight"] = "bottom_right_resize_corner";
  TLRotateCorner2["BottomLeft"] = "bottom_left_resize_corner";
  return TLRotateCorner2;
})(TLRotateCorner || {});
var TLTargetType = /* @__PURE__ */ ((TLTargetType2) => {
  TLTargetType2["Canvas"] = "canvas";
  TLTargetType2["Shape"] = "shape";
  TLTargetType2["Selection"] = "selection";
  TLTargetType2["Handle"] = "handle";
  return TLTargetType2;
})(TLTargetType || {});
var TLCursor = /* @__PURE__ */ ((TLCursor2) => {
  TLCursor2["None"] = "none";
  TLCursor2["Default"] = "default";
  TLCursor2["Pointer"] = "pointer";
  TLCursor2["Cross"] = "crosshair";
  TLCursor2["Grab"] = "grab";
  TLCursor2["Rotate"] = "rotate";
  TLCursor2["Grabbing"] = "grabbing";
  TLCursor2["ResizeEdge"] = "resize-edge";
  TLCursor2["ResizeCorner"] = "resize-corner";
  TLCursor2["Text"] = "text";
  TLCursor2["Move"] = "move";
  TLCursor2["EwResize"] = "ew-resize";
  TLCursor2["NsResize"] = "ns-resize";
  TLCursor2["NeswResize"] = "nesw-resize";
  TLCursor2["NwseResize"] = "nwse-resize";
  TLCursor2["NeswRotate"] = "nesw-rotate";
  TLCursor2["NwseRotate"] = "nwse-rotate";
  TLCursor2["SwneRotate"] = "swne-rotate";
  TLCursor2["SenwRotate"] = "senw-rotate";
  return TLCursor2;
})(TLCursor || {});
var BoundsUtils = class {
  static getRectangleSides(point, size, rotation = 0) {
    const center = [point[0] + size[0] / 2, point[1] + size[1] / 2];
    const tl = Vec.rotWith(point, center, rotation);
    const tr = Vec.rotWith(Vec.add(point, [size[0], 0]), center, rotation);
    const br = Vec.rotWith(Vec.add(point, size), center, rotation);
    const bl = Vec.rotWith(Vec.add(point, [0, size[1]]), center, rotation);
    return [
      [tl, tr],
      [tr, br],
      [br, bl],
      [bl, tl]
    ];
  }
  static getBoundsSides(bounds) {
    return BoundsUtils.getRectangleSides([bounds.minX, bounds.minY], [bounds.width, bounds.height]);
  }
  static expandBounds(bounds, delta) {
    return {
      minX: bounds.minX - delta,
      minY: bounds.minY - delta,
      maxX: bounds.maxX + delta,
      maxY: bounds.maxY + delta,
      width: bounds.width + delta * 2,
      height: bounds.height + delta * 2
    };
  }
  static boundsCollide(a2, b) {
    return !(a2.maxX < b.minX || a2.minX > b.maxX || a2.maxY < b.minY || a2.minY > b.maxY);
  }
  static boundsContain(a2, b) {
    return a2.minX < b.minX && a2.minY < b.minY && a2.maxY > b.maxY && a2.maxX > b.maxX;
  }
  static boundsContained(a2, b) {
    return BoundsUtils.boundsContain(b, a2);
  }
  static boundsAreEqual(a2, b) {
    return !(b.maxX !== a2.maxX || b.minX !== a2.minX || b.maxY !== a2.maxY || b.minY !== a2.minY);
  }
  static getBoundsFromPoints(points, rotation = 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    if (points.length < 2) {
      minX = 0;
      minY = 0;
      maxX = 1;
      maxY = 1;
    } else {
      for (const point of points) {
        minX = Math.min(point[0], minX);
        minY = Math.min(point[1], minY);
        maxX = Math.max(point[0], maxX);
        maxY = Math.max(point[1], maxY);
      }
    }
    if (rotation !== 0) {
      return BoundsUtils.getBoundsFromPoints(points.map((pt) => Vec.rotWith(pt, [(minX + maxX) / 2, (minY + maxY) / 2], rotation)));
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY)
    };
  }
  static centerBounds(bounds, point) {
    const boundsCenter = BoundsUtils.getBoundsCenter(bounds);
    const dx = point[0] - boundsCenter[0];
    const dy = point[1] - boundsCenter[1];
    return BoundsUtils.translateBounds(bounds, [dx, dy]);
  }
  static snapBoundsToGrid(bounds, gridSize) {
    const minX = Math.round(bounds.minX / gridSize) * gridSize;
    const minY = Math.round(bounds.minY / gridSize) * gridSize;
    const maxX = Math.round(bounds.maxX / gridSize) * gridSize;
    const maxY = Math.round(bounds.maxY / gridSize) * gridSize;
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY)
    };
  }
  static translateBounds(bounds, delta) {
    return {
      minX: bounds.minX + delta[0],
      minY: bounds.minY + delta[1],
      maxX: bounds.maxX + delta[0],
      maxY: bounds.maxY + delta[1],
      width: bounds.width,
      height: bounds.height
    };
  }
  static multiplyBounds(bounds, n) {
    const center = BoundsUtils.getBoundsCenter(bounds);
    return BoundsUtils.centerBounds({
      minX: bounds.minX * n,
      minY: bounds.minY * n,
      maxX: bounds.maxX * n,
      maxY: bounds.maxY * n,
      width: bounds.width * n,
      height: bounds.height * n
    }, center);
  }
  static divideBounds(bounds, n) {
    const center = BoundsUtils.getBoundsCenter(bounds);
    return BoundsUtils.centerBounds({
      minX: bounds.minX / n,
      minY: bounds.minY / n,
      maxX: bounds.maxX / n,
      maxY: bounds.maxY / n,
      width: bounds.width / n,
      height: bounds.height / n
    }, center);
  }
  static getRotatedBounds(bounds, rotation = 0) {
    const corners = BoundsUtils.getRotatedCorners(bounds, rotation);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const point of corners) {
      minX = Math.min(point[0], minX);
      minY = Math.min(point[1], minY);
      maxX = Math.max(point[0], maxX);
      maxY = Math.max(point[1], maxY);
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      rotation: 0
    };
  }
  static getRotatedEllipseBounds(x, y, rx, ry, rotation = 0) {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    const w = Math.hypot(rx * c, ry * s);
    const h = Math.hypot(rx * s, ry * c);
    return {
      minX: x + rx - w,
      minY: y + ry - h,
      maxX: x + rx + w,
      maxY: y + ry + h,
      width: w * 2,
      height: h * 2
    };
  }
  static getExpandedBounds(a2, b) {
    const minX = Math.min(a2.minX, b.minX);
    const minY = Math.min(a2.minY, b.minY);
    const maxX = Math.max(a2.maxX, b.maxX);
    const maxY = Math.max(a2.maxY, b.maxY);
    const width = Math.abs(maxX - minX);
    const height = Math.abs(maxY - minY);
    return { minX, minY, maxX, maxY, width, height };
  }
  static getCommonBounds(bounds) {
    if (bounds.length < 2)
      return bounds[0];
    let result = bounds[0];
    for (let i = 1; i < bounds.length; i++) {
      result = BoundsUtils.getExpandedBounds(result, bounds[i]);
    }
    return result;
  }
  static getRotatedCorners(b, rotation = 0) {
    const center = [b.minX + b.width / 2, b.minY + b.height / 2];
    const corners = [
      [b.minX, b.minY],
      [b.maxX, b.minY],
      [b.maxX, b.maxY],
      [b.minX, b.maxY]
    ];
    if (rotation)
      return corners.map((point) => Vec.rotWith(point, center, rotation));
    return corners;
  }
  static getTransformedBoundingBox(bounds, handle, delta, rotation = 0, isAspectRatioLocked = false) {
    const [ax0, ay0] = [bounds.minX, bounds.minY];
    const [ax1, ay1] = [bounds.maxX, bounds.maxY];
    let [bx0, by0] = [bounds.minX, bounds.minY];
    let [bx1, by1] = [bounds.maxX, bounds.maxY];
    if (handle === "center") {
      return {
        minX: bx0 + delta[0],
        minY: by0 + delta[1],
        maxX: bx1 + delta[0],
        maxY: by1 + delta[1],
        width: bx1 - bx0,
        height: by1 - by0,
        scaleX: 1,
        scaleY: 1
      };
    }
    const [dx, dy] = Vec.rot(delta, -rotation);
    switch (handle) {
      case "top_edge":
      case "top_left_corner":
      case "top_right_corner": {
        by0 += dy;
        break;
      }
      case "bottom_edge":
      case "bottom_left_corner":
      case "bottom_right_corner": {
        by1 += dy;
        break;
      }
    }
    switch (handle) {
      case "left_edge":
      case "top_left_corner":
      case "bottom_left_corner": {
        bx0 += dx;
        break;
      }
      case "right_edge":
      case "top_right_corner":
      case "bottom_right_corner": {
        bx1 += dx;
        break;
      }
    }
    const aw = ax1 - ax0;
    const ah = ay1 - ay0;
    const scaleX = (bx1 - bx0) / aw;
    const scaleY = (by1 - by0) / ah;
    const flipX = scaleX < 0;
    const flipY = scaleY < 0;
    const bw = Math.abs(bx1 - bx0);
    const bh = Math.abs(by1 - by0);
    if (isAspectRatioLocked) {
      const ar = aw / ah;
      const isTall = ar < bw / bh;
      const tw = bw * (scaleY < 0 ? 1 : -1) * (1 / ar);
      const th = bh * (scaleX < 0 ? 1 : -1) * ar;
      switch (handle) {
        case "top_left_corner": {
          if (isTall)
            by0 = by1 + tw;
          else
            bx0 = bx1 + th;
          break;
        }
        case "top_right_corner": {
          if (isTall)
            by0 = by1 + tw;
          else
            bx1 = bx0 - th;
          break;
        }
        case "bottom_right_corner": {
          if (isTall)
            by1 = by0 - tw;
          else
            bx1 = bx0 - th;
          break;
        }
        case "bottom_left_corner": {
          if (isTall)
            by1 = by0 - tw;
          else
            bx0 = bx1 + th;
          break;
        }
        case "bottom_edge":
        case "top_edge": {
          const m = (bx0 + bx1) / 2;
          const w = bh * ar;
          bx0 = m - w / 2;
          bx1 = m + w / 2;
          break;
        }
        case "left_edge":
        case "right_edge": {
          const m = (by0 + by1) / 2;
          const h = bw / ar;
          by0 = m - h / 2;
          by1 = m + h / 2;
          break;
        }
      }
    }
    if (rotation % (Math.PI * 2) !== 0) {
      let cv = [0, 0];
      const c0 = Vec.med([ax0, ay0], [ax1, ay1]);
      const c1 = Vec.med([bx0, by0], [bx1, by1]);
      switch (handle) {
        case "top_left_corner": {
          cv = Vec.sub(Vec.rotWith([bx1, by1], c1, rotation), Vec.rotWith([ax1, ay1], c0, rotation));
          break;
        }
        case "top_right_corner": {
          cv = Vec.sub(Vec.rotWith([bx0, by1], c1, rotation), Vec.rotWith([ax0, ay1], c0, rotation));
          break;
        }
        case "bottom_right_corner": {
          cv = Vec.sub(Vec.rotWith([bx0, by0], c1, rotation), Vec.rotWith([ax0, ay0], c0, rotation));
          break;
        }
        case "bottom_left_corner": {
          cv = Vec.sub(Vec.rotWith([bx1, by0], c1, rotation), Vec.rotWith([ax1, ay0], c0, rotation));
          break;
        }
        case "top_edge": {
          cv = Vec.sub(Vec.rotWith(Vec.med([bx0, by1], [bx1, by1]), c1, rotation), Vec.rotWith(Vec.med([ax0, ay1], [ax1, ay1]), c0, rotation));
          break;
        }
        case "left_edge": {
          cv = Vec.sub(Vec.rotWith(Vec.med([bx1, by0], [bx1, by1]), c1, rotation), Vec.rotWith(Vec.med([ax1, ay0], [ax1, ay1]), c0, rotation));
          break;
        }
        case "bottom_edge": {
          cv = Vec.sub(Vec.rotWith(Vec.med([bx0, by0], [bx1, by0]), c1, rotation), Vec.rotWith(Vec.med([ax0, ay0], [ax1, ay0]), c0, rotation));
          break;
        }
        case "right_edge": {
          cv = Vec.sub(Vec.rotWith(Vec.med([bx0, by0], [bx0, by1]), c1, rotation), Vec.rotWith(Vec.med([ax0, ay0], [ax0, ay1]), c0, rotation));
          break;
        }
      }
      ;
      [bx0, by0] = Vec.sub([bx0, by0], cv);
      [bx1, by1] = Vec.sub([bx1, by1], cv);
    }
    if (bx1 < bx0)
      [bx1, bx0] = [bx0, bx1];
    if (by1 < by0)
      [by1, by0] = [by0, by1];
    return {
      minX: bx0,
      minY: by0,
      maxX: bx1,
      maxY: by1,
      width: bx1 - bx0,
      height: by1 - by0,
      scaleX: (bx1 - bx0) / (ax1 - ax0 || 1) * (flipX ? -1 : 1),
      scaleY: (by1 - by0) / (ay1 - ay0 || 1) * (flipY ? -1 : 1)
    };
  }
  static getTransformAnchor(type, isFlippedX, isFlippedY) {
    let anchor = type;
    switch (type) {
      case "top_left_corner": {
        if (isFlippedX && isFlippedY) {
          anchor = "bottom_right_corner";
        } else if (isFlippedX) {
          anchor = "top_right_corner";
        } else if (isFlippedY) {
          anchor = "bottom_left_corner";
        } else {
          anchor = "bottom_right_corner";
        }
        break;
      }
      case "top_right_corner": {
        if (isFlippedX && isFlippedY) {
          anchor = "bottom_left_corner";
        } else if (isFlippedX) {
          anchor = "top_left_corner";
        } else if (isFlippedY) {
          anchor = "bottom_right_corner";
        } else {
          anchor = "bottom_left_corner";
        }
        break;
      }
      case "bottom_right_corner": {
        if (isFlippedX && isFlippedY) {
          anchor = "top_left_corner";
        } else if (isFlippedX) {
          anchor = "bottom_left_corner";
        } else if (isFlippedY) {
          anchor = "top_right_corner";
        } else {
          anchor = "top_left_corner";
        }
        break;
      }
      case "bottom_left_corner": {
        if (isFlippedX && isFlippedY) {
          anchor = "top_right_corner";
        } else if (isFlippedX) {
          anchor = "bottom_right_corner";
        } else if (isFlippedY) {
          anchor = "top_left_corner";
        } else {
          anchor = "top_right_corner";
        }
        break;
      }
    }
    return anchor;
  }
  static getRelativeTransformedBoundingBox(bounds, initialBounds, initialShapeBounds, isFlippedX, isFlippedY) {
    const nx = (isFlippedX ? initialBounds.maxX - initialShapeBounds.maxX : initialShapeBounds.minX - initialBounds.minX) / initialBounds.width;
    const ny = (isFlippedY ? initialBounds.maxY - initialShapeBounds.maxY : initialShapeBounds.minY - initialBounds.minY) / initialBounds.height;
    const nw = initialShapeBounds.width / initialBounds.width;
    const nh = initialShapeBounds.height / initialBounds.height;
    const minX = bounds.minX + bounds.width * nx;
    const minY = bounds.minY + bounds.height * ny;
    const width = bounds.width * nw;
    const height = bounds.height * nh;
    return {
      minX,
      minY,
      maxX: minX + width,
      maxY: minY + height,
      width,
      height
    };
  }
  static getRotatedSize(size, rotation) {
    const center = Vec.div(size, 2);
    const points = [[0, 0], [size[0], 0], size, [0, size[1]]].map((point) => Vec.rotWith(point, center, rotation));
    const bounds = BoundsUtils.getBoundsFromPoints(points);
    return [bounds.width, bounds.height];
  }
  static getBoundsCenter(bounds) {
    return [bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2];
  }
  static getBoundsWithCenter(bounds) {
    const center = BoundsUtils.getBoundsCenter(bounds);
    return __spreadProps2(__spreadValues2({}, bounds), {
      midX: center[0],
      midY: center[1]
    });
  }
  static getCommonTopLeft(points) {
    const min = [Infinity, Infinity];
    points.forEach((point) => {
      min[0] = Math.min(min[0], point[0]);
      min[1] = Math.min(min[1], point[1]);
    });
    return min;
  }
  static getTLSnapPoints(bounds, others, snapDistance) {
    const A = __spreadValues2({}, bounds);
    const offset = [0, 0];
    const snapLines = [];
    const snaps = {
      ["minX"]: { id: "minX", isSnapped: false },
      ["midX"]: { id: "midX", isSnapped: false },
      ["maxX"]: { id: "maxX", isSnapped: false },
      ["minY"]: { id: "minY", isSnapped: false },
      ["midY"]: { id: "midY", isSnapped: false },
      ["maxY"]: { id: "maxY", isSnapped: false }
    };
    const xs = ["midX", "minX", "maxX"];
    const ys = ["midY", "minY", "maxY"];
    const snapResults = others.map((B) => {
      const rx = xs.flatMap((f2, i) => xs.map((t, k) => {
        const gap = A[f2] - B[t];
        const distance = Math.abs(gap);
        return {
          f: f2,
          t,
          gap,
          distance,
          isCareful: i === 0 || i + k === 3
        };
      }));
      const ry = ys.flatMap((f2, i) => ys.map((t, k) => {
        const gap = A[f2] - B[t];
        const distance = Math.abs(gap);
        return {
          f: f2,
          t,
          gap,
          distance,
          isCareful: i === 0 || i + k === 3
        };
      }));
      return [B, rx, ry];
    });
    let gapX = Infinity;
    let gapY = Infinity;
    let minX = Infinity;
    let minY = Infinity;
    snapResults.forEach(([_15, rx, ry]) => {
      rx.forEach((r) => {
        if (r.distance < snapDistance && r.distance < minX) {
          minX = r.distance;
          gapX = r.gap;
        }
      });
      ry.forEach((r) => {
        if (r.distance < snapDistance && r.distance < minY) {
          minY = r.distance;
          gapY = r.gap;
        }
      });
    });
    snapResults.forEach(([B, rx, ry]) => {
      if (gapX !== Infinity) {
        rx.forEach((r) => {
          if (Math.abs(r.gap - gapX) < 2) {
            snaps[r.f] = __spreadProps2(__spreadValues2({}, snaps[r.f]), {
              isSnapped: true,
              to: B[r.t],
              B,
              distance: r.distance
            });
          }
        });
      }
      if (gapY !== Infinity) {
        ry.forEach((r) => {
          if (Math.abs(r.gap - gapY) < 2) {
            snaps[r.f] = __spreadProps2(__spreadValues2({}, snaps[r.f]), {
              isSnapped: true,
              to: B[r.t],
              B,
              distance: r.distance
            });
          }
        });
      }
    });
    offset[0] = gapX === Infinity ? 0 : gapX;
    offset[1] = gapY === Infinity ? 0 : gapY;
    A.minX -= offset[0];
    A.midX -= offset[0];
    A.maxX -= offset[0];
    A.minY -= offset[1];
    A.midY -= offset[1];
    A.maxY -= offset[1];
    xs.forEach((from) => {
      const snap = snaps[from];
      if (!snap.isSnapped)
        return;
      const { id, B } = snap;
      const x = A[id];
      snapLines.push(id === "minX" ? [
        [x, A.midY],
        [x, B.minY],
        [x, B.maxY]
      ] : [
        [x, A.minY],
        [x, A.maxY],
        [x, B.minY],
        [x, B.maxY]
      ]);
    });
    ys.forEach((from) => {
      const snap = snaps[from];
      if (!snap.isSnapped)
        return;
      const { id, B } = snap;
      const y = A[id];
      snapLines.push(id === "midY" ? [
        [A.midX, y],
        [B.minX, y],
        [B.maxX, y]
      ] : [
        [A.minX, y],
        [A.maxX, y],
        [B.minX, y],
        [B.maxX, y]
      ]);
    });
    return { offset, snapLines };
  }
};
var _PointUtils = class {
  static pointInCircle(A, C, r) {
    return Vec.dist(A, C) <= r;
  }
  static pointInEllipse(A, C, rx, ry, rotation = 0) {
    rotation = rotation || 0;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const delta = Vec.sub(A, C);
    const tdx = cos * delta[0] + sin * delta[1];
    const tdy = sin * delta[0] - cos * delta[1];
    return tdx * tdx / (rx * rx) + tdy * tdy / (ry * ry) <= 1;
  }
  static pointInRect(point, size) {
    return !(point[0] < size[0] || point[0] > point[0] + size[0] || point[1] < size[1] || point[1] > point[1] + size[1]);
  }
  static pointInPolygon(p, points) {
    let wn = 0;
    points.forEach((a2, i) => {
      const b = points[(i + 1) % points.length];
      if (a2[1] <= p[1]) {
        if (b[1] > p[1] && Vec.cross(a2, b, p) > 0) {
          wn += 1;
        }
      } else if (b[1] <= p[1] && Vec.cross(a2, b, p) < 0) {
        wn -= 1;
      }
    });
    return wn !== 0;
  }
  static pointInBounds(A, b) {
    return !(A[0] < b.minX || A[0] > b.maxX || A[1] < b.minY || A[1] > b.maxY);
  }
  static pointInPolyline(A, points, distance = 3) {
    for (let i = 1; i < points.length; i++) {
      if (Vec.distanceToLineSegment(points[i - 1], points[i], A) < distance) {
        return true;
      }
    }
    return false;
  }
  static _getSqSegDist(p, p1, p2) {
    let x = p1[0];
    let y = p1[1];
    let dx = p2[0] - x;
    let dy = p2[1] - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = p2[0];
        y = p2[1];
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }
    dx = p[0] - x;
    dy = p[1] - y;
    return dx * dx + dy * dy;
  }
  static _simplifyStep(points, first, last, sqTolerance, result) {
    let maxSqDist = sqTolerance;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const sqDist = _PointUtils._getSqSegDist(points[i], points[first], points[last]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }
    if (index > -1 && maxSqDist > sqTolerance) {
      if (index - first > 1)
        _PointUtils._simplifyStep(points, first, index, sqTolerance, result);
      result.push(points[index]);
      if (last - index > 1)
        _PointUtils._simplifyStep(points, index, last, sqTolerance, result);
    }
  }
  static simplify2(points, tolerance = 1) {
    if (points.length <= 2)
      return points;
    const sqTolerance = tolerance * tolerance;
    let A = points[0];
    let B = points[1];
    const newPoints = [A];
    for (let i = 1, len = points.length; i < len; i++) {
      B = points[i];
      if ((B[0] - A[0]) * (B[0] - A[0]) + (B[1] - A[1]) * (B[1] - A[1]) > sqTolerance) {
        newPoints.push(B);
        A = B;
      }
    }
    if (A !== B)
      newPoints.push(B);
    const last = newPoints.length - 1;
    const result = [newPoints[0]];
    _PointUtils._simplifyStep(newPoints, 0, last, sqTolerance, result);
    result.push(newPoints[last], points[points.length - 1]);
    return result;
  }
  static pointNearToPolyline(point, points, distance = 8) {
    const len = points.length;
    for (let i = 1; i < len; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const d = Vec.distanceToLineSegment(p1, p2, point);
      if (d < distance)
        return true;
    }
    return false;
  }
};
var PointUtils = _PointUtils;
__publicField3(PointUtils, "simplify", (points, tolerance = 1) => {
  const len = points.length;
  const a2 = points[0];
  const b = points[len - 1];
  const [x1, y1] = a2;
  const [x2, y2] = b;
  if (len > 2) {
    let distance = 0;
    let index = 0;
    const max = Vec.len2([y2 - y1, x2 - x1]);
    for (let i = 1; i < len - 1; i++) {
      const [x0, y0] = points[i];
      const d = Math.pow(x0 * (y2 - y1) + x1 * (y0 - y2) + x2 * (y1 - y0), 2) / max;
      if (distance > d)
        continue;
      distance = d;
      index = i;
    }
    if (distance > tolerance) {
      const l0 = _PointUtils.simplify(points.slice(0, index + 1), tolerance);
      const l1 = _PointUtils.simplify(points.slice(index + 1), tolerance);
      return l0.concat(l1.slice(1));
    }
  }
  return [a2, b];
});
var tagFilter = ({ target }, enableOnTags) => {
  const targetTagName = target && target.tagName;
  return Boolean(targetTagName && enableOnTags && enableOnTags.includes(targetTagName));
};
var KeyUtils = class {
  static registerShortcut(keys, callback) {
    const fn = (keyboardEvent, combo) => {
      var _a2;
      keyboardEvent.preventDefault();
      if (tagFilter(keyboardEvent, ["INPUT", "TEXTAREA", "SELECT"]) || ((_a2 = keyboardEvent.target) == null ? void 0 : _a2.isContentEditable)) {
        return;
      }
      callback(keyboardEvent, combo);
    };
    import_mousetrap.default.bind(keys, fn);
    return () => import_mousetrap.default.unbind(keys);
  }
};
var PI = Math.PI;
var TAU = PI / 2;
var PI2 = PI * 2;
var EPSILON = Math.PI / 180;
var FIT_TO_SCREEN_PADDING = 100;
var CURSORS = {
  ["bottom_edge"]: "ns-resize",
  ["top_edge"]: "ns-resize",
  ["left_edge"]: "ew-resize",
  ["right_edge"]: "ew-resize",
  ["bottom_left_corner"]: "nesw-resize",
  ["bottom_right_corner"]: "nwse-resize",
  ["top_left_corner"]: "nwse-resize",
  ["top_right_corner"]: "nesw-resize",
  ["bottom_left_resize_corner"]: "swne-rotate",
  ["bottom_right_resize_corner"]: "senw-rotate",
  ["top_left_resize_corner"]: "nwse-rotate",
  ["top_right_resize_corner"]: "nesw-rotate",
  rotate: "rotate",
  center: "grab",
  background: "grab"
};
var GeomUtils = class {
  static circleFromThreePoints(A, B, C) {
    const [x1, y1] = A;
    const [x2, y2] = B;
    const [x3, y3] = C;
    const a2 = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
    const b = (x1 * x1 + y1 * y1) * (y3 - y2) + (x2 * x2 + y2 * y2) * (y1 - y3) + (x3 * x3 + y3 * y3) * (y2 - y1);
    const c = (x1 * x1 + y1 * y1) * (x2 - x3) + (x2 * x2 + y2 * y2) * (x3 - x1) + (x3 * x3 + y3 * y3) * (x1 - x2);
    const x = -b / (2 * a2);
    const y = -c / (2 * a2);
    return [x, y, Math.hypot(x - x1, y - y1)];
  }
  static perimeterOfEllipse(rx, ry) {
    const h = Math.pow(rx - ry, 2) / Math.pow(rx + ry, 2);
    const p = PI * (rx + ry) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));
    return p;
  }
  static shortAngleDist(a0, a1) {
    const da = (a1 - a0) % PI2;
    return 2 * da % PI2 - da;
  }
  static longAngleDist(a0, a1) {
    return PI2 - GeomUtils.shortAngleDist(a0, a1);
  }
  static lerpAngles(a0, a1, t) {
    return a0 + GeomUtils.shortAngleDist(a0, a1) * t;
  }
  static angleDelta(a0, a1) {
    return GeomUtils.shortAngleDist(a0, a1);
  }
  static getSweep(C, A, B) {
    return GeomUtils.angleDelta(src_default.angle(C, A), src_default.angle(C, B));
  }
  static clampRadians(r) {
    return (PI2 + r) % PI2;
  }
  static snapAngleToSegments(r, segments) {
    const seg = PI2 / segments;
    let ang = Math.floor((GeomUtils.clampRadians(r) + seg / 2) / seg) * seg % PI2;
    if (ang < PI)
      ang += PI2;
    if (ang > PI)
      ang -= PI2;
    return ang;
  }
  static isAngleBetween(a2, b, c) {
    if (c === a2 || c === b)
      return true;
    const AB = (b - a2 + TAU) % TAU;
    const AC = (c - a2 + TAU) % TAU;
    return AB <= PI !== AC > AB;
  }
  static degreesToRadians(d) {
    return d * PI / 180;
  }
  static radiansToDegrees(r) {
    return r * 180 / PI;
  }
  static getArcLength(C, r, A, B) {
    const sweep = GeomUtils.getSweep(C, A, B);
    return r * PI2 * (sweep / PI2);
  }
  static getSweepFlag(A, B, C) {
    const angleAC = src_default.angle(A, C);
    const angleAB = src_default.angle(A, B);
    const angleCAB = (angleAB - angleAC + 3 * PI) % PI2 - PI;
    return angleCAB > 0 ? 0 : 1;
  }
  static getLargeArcFlag(A, C, P) {
    const anglePA = src_default.angle(P, A);
    const anglePC = src_default.angle(P, C);
    const angleAPC = (anglePC - anglePA + 3 * PI) % PI2 - PI;
    return Math.abs(angleAPC) > TAU ? 0 : 1;
  }
  static getArcDashOffset(C, r, A, B, step) {
    const del0 = GeomUtils.getSweepFlag(C, A, B);
    const len0 = GeomUtils.getArcLength(C, r, A, B);
    const off0 = del0 < 0 ? len0 : PI2 * C[2] - len0;
    return -off0 / 2 + step;
  }
  static getEllipseDashOffset(A, step) {
    const c = PI2 * A[2];
    return -c / 2 + -step;
  }
  static radiansToCardinalDirection(radians) {
    if (radians < Math.PI * 0.25) {
      return "north";
    } else if (radians < Math.PI * 0.75) {
      return "east";
    } else if (radians < Math.PI * 1.25) {
      return "south";
    } else if (radians < Math.PI * 1.75) {
      return "west";
    } else {
      return "north";
    }
  }
};
var _PolygonUtils = class {
  static getPolygonCentroid(points) {
    const x = points.map((point) => point[0]);
    const y = points.map((point) => point[1]);
    const cx = Math.min(...x) + Math.max(...x);
    const cy = Math.min(...y) + Math.max(...y);
    return [cx ? cx / 2 : 0, cy ? cy / 2 : 0];
  }
};
var PolygonUtils = _PolygonUtils;
__publicField3(PolygonUtils, "getEdges", (points) => {
  const len = points.length;
  return points.map((point, i) => [point, points[(i + 1) % len]]);
});
__publicField3(PolygonUtils, "getEdgeOutwardNormal", (A, B) => {
  return src_default.per(src_default.uni(src_default.sub(B, A)));
});
__publicField3(PolygonUtils, "getEdgeInwardNormal", (A, B) => {
  return src_default.neg(_PolygonUtils.getEdgeOutwardNormal(A, B));
});
__publicField3(PolygonUtils, "getOffsetEdge", (A, B, offset) => {
  const offsetVector = src_default.mul(src_default.per(src_default.uni(src_default.sub(B, A))), offset);
  return [src_default.add(A, offsetVector), src_default.add(B, offsetVector)];
});
__publicField3(PolygonUtils, "getOffsetEdges", (edges, offset) => {
  return edges.map(([A, B]) => _PolygonUtils.getOffsetEdge(A, B, offset));
});
__publicField3(PolygonUtils, "getOffsetPolygon", (points, offset) => {
  if (points.length < 1) {
    throw Error("Expected at least one point.");
  } else if (points.length === 1) {
    const A = points[0];
    return [
      src_default.add(A, [-offset, -offset]),
      src_default.add(A, [offset, -offset]),
      src_default.add(A, [offset, offset]),
      src_default.add(A, [-offset, offset])
    ];
  } else if (points.length === 2) {
    const [A, B] = points;
    return [
      ..._PolygonUtils.getOffsetEdge(A, B, offset),
      ..._PolygonUtils.getOffsetEdge(B, A, offset)
    ];
  }
  return _PolygonUtils.getOffsetEdges(_PolygonUtils.getEdges(points), offset).flatMap((edge, i, edges) => {
    const intersection = intersectLineLine(edge, edges[(i + 1) % edges.length]);
    if (intersection === void 0)
      throw Error("Expected an intersection");
    return intersection.points;
  });
});
__publicField3(PolygonUtils, "getPolygonVertices", (size, sides, padding = 0, ratio = 1) => {
  const center = src_default.div(size, 2);
  const [rx, ry] = [Math.max(1, center[0] - padding), Math.max(1, center[1] - padding)];
  const pointsOnPerimeter = [];
  for (let i = 0, step = PI2 / sides; i < sides; i++) {
    const t1 = (-TAU + i * step) % PI2;
    const t2 = (-TAU + (i + 1) * step) % PI2;
    const p1 = src_default.add(center, [rx * Math.cos(t1), ry * Math.sin(t1)]);
    const p3 = src_default.add(center, [rx * Math.cos(t2), ry * Math.sin(t2)]);
    const mid = src_default.med(p1, p3);
    const p2 = src_default.nudge(mid, center, src_default.dist(center, mid) * (1 - ratio));
    pointsOnPerimeter.push(p1, p2, p3);
  }
  return pointsOnPerimeter;
});
__publicField3(PolygonUtils, "getTriangleVertices", (size, padding = 0, ratio = 1) => {
  const [w, h] = size;
  const r = 1 - ratio;
  const A = [w / 2, padding / 2];
  const B = [w - padding, h - padding];
  const C = [padding / 2, h - padding];
  const centroid = _PolygonUtils.getPolygonCentroid([A, B, C]);
  const AB = src_default.med(A, B);
  const BC = src_default.med(B, C);
  const CA = src_default.med(C, A);
  const dAB = src_default.dist(AB, centroid) * r;
  const dBC = src_default.dist(BC, centroid) * r;
  const dCA = src_default.dist(CA, centroid) * r;
  return [
    A,
    dAB ? src_default.nudge(AB, centroid, dAB) : AB,
    B,
    dBC ? src_default.nudge(BC, centroid, dBC) : BC,
    C,
    dCA ? src_default.nudge(CA, centroid, dCA) : CA
  ];
});
__publicField3(PolygonUtils, "getStarVertices", (center, size, sides, ratio = 1) => {
  const outer = src_default.div(size, 2);
  const inner = src_default.mul(outer, ratio / 2);
  const step = PI2 / sides / 2;
  return Array.from(Array(sides * 2)).map((_15, i) => {
    const theta = -TAU + i * step;
    const [rx, ry] = i % 2 ? inner : outer;
    return src_default.add(center, [rx * Math.cos(theta), ry * Math.sin(theta)]);
  });
});
var SvgPathUtils = class {
  static getCurvedPathForPolygon(points) {
    if (points.length < 3) {
      return `M -4, 0
      a 4,4 0 1,0 8,0
      a 4,4 0 1,0 -8,0`;
    }
    const d = ["M", ...points[0].slice(0, 2), "Q"];
    const len = points.length;
    for (let i = 1; i < len; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[(i + 1) % len];
      d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    d.push("Z");
    return d.join(" ");
  }
  static getCurvedPathForPoints(points) {
    if (points.length < 3) {
      return `M -4, 0
      a 4,4 0 1,0 8,0
      a 4,4 0 1,0 -8,0`;
    }
    const d = ["M", ...points[0].slice(0, 2), "Q"];
    const len = points.length;
    for (let i = 1; i < len - 1; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    return d.join(" ");
  }
};
function deepCopy(target) {
  if (target === null) {
    return target;
  }
  if (target instanceof Date) {
    return new Date(target.getTime());
  }
  if (typeof target === "object") {
    if (typeof target[Symbol.iterator] === "function") {
      const cp = [];
      if (target.length > 0) {
        for (const arrayMember of target) {
          cp.push(deepCopy(arrayMember));
        }
      }
      return cp;
    } else {
      const targetKeys = Object.keys(target);
      const cp = {};
      if (targetKeys.length > 0) {
        for (const key of targetKeys) {
          cp[key] = deepCopy(target[key]);
        }
      }
      return cp;
    }
  }
  return target;
}
function modulate(value, rangeA, rangeB, clamp2 = false) {
  const [fromLow, fromHigh] = rangeA;
  const [v0, v1] = rangeB;
  const result = v0 + (value - fromLow) / (fromHigh - fromLow) * (v1 - v0);
  return clamp2 ? v0 < v1 ? Math.max(Math.min(result, v1), v0) : Math.max(Math.min(result, v0), v1) : result;
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.onabort = (error) => reject(error);
    }
  });
}
function getSizeFromSrc(dataURL) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve([img.width, img.height]);
    img.src = dataURL;
  });
}
function getFirstFromSet(set4) {
  return set4.values().next().value;
}
var _TextUtils = class {
  static insertTextFirefox(field, text) {
    field.setRangeText(text, field.selectionStart || 0, field.selectionEnd || 0, "end");
    field.dispatchEvent(new InputEvent("input", {
      data: text,
      inputType: "insertText",
      isComposing: false
    }));
  }
  static insert(field, text) {
    const document2 = field.ownerDocument;
    const initialFocus = document2.activeElement;
    if (initialFocus !== field) {
      field.focus();
    }
    if (!document2.execCommand("insertText", false, text)) {
      _TextUtils.insertTextFirefox(field, text);
    }
    if (initialFocus === document2.body) {
      field.blur();
    } else if (initialFocus instanceof HTMLElement && initialFocus !== field) {
      initialFocus.focus();
    }
  }
  static set(field, text) {
    field.select();
    _TextUtils.insert(field, text);
  }
  static getSelection(field) {
    const { selectionStart, selectionEnd } = field;
    return field.value.slice(selectionStart ? selectionStart : void 0, selectionEnd ? selectionEnd : void 0);
  }
  static wrapSelection(field, wrap, wrapEnd) {
    const { selectionStart, selectionEnd } = field;
    const selection = _TextUtils.getSelection(field);
    _TextUtils.insert(field, wrap + selection + (wrapEnd != null ? wrapEnd : wrap));
    field.selectionStart = (selectionStart || 0) + wrap.length;
    field.selectionEnd = (selectionEnd || 0) + wrap.length;
  }
  static replace(field, searchValue, replacer) {
    let drift = 0;
    field.value.replace(searchValue, (...args) => {
      const matchStart = drift + args[args.length - 2];
      const matchLength = args[0].length;
      field.selectionStart = matchStart;
      field.selectionEnd = matchStart + matchLength;
      const replacement = typeof replacer === "string" ? replacer : replacer(...args);
      _TextUtils.insert(field, replacement);
      field.selectionStart = matchStart;
      drift += replacement.length - matchLength;
      return replacement;
    });
  }
  static findLineEnd(value, currentEnd) {
    const lastLineStart = value.lastIndexOf("\n", currentEnd - 1) + 1;
    if (value.charAt(lastLineStart) !== "	") {
      return currentEnd;
    }
    return lastLineStart + 1;
  }
  static indent(element) {
    var _a2;
    const { selectionStart, selectionEnd, value } = element;
    const selectedContrast = value.slice(selectionStart, selectionEnd);
    const lineBreakCount = (_a2 = /\n/g.exec(selectedContrast)) == null ? void 0 : _a2.length;
    if (lineBreakCount && lineBreakCount > 0) {
      const firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const newSelection = element.value.slice(firstLineStart, selectionEnd - 1);
      const indentedText = newSelection.replace(/^|\n/g, `$&${_TextUtils.INDENT}`);
      const replacementsCount = indentedText.length - newSelection.length;
      element.setSelectionRange(firstLineStart, selectionEnd - 1);
      _TextUtils.insert(element, indentedText);
      element.setSelectionRange(selectionStart + 1, selectionEnd + replacementsCount);
    } else {
      _TextUtils.insert(element, _TextUtils.INDENT);
    }
  }
  static unindent(element) {
    const { selectionStart, selectionEnd, value } = element;
    const firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const minimumSelectionEnd = _TextUtils.findLineEnd(value, selectionEnd);
    const newSelection = element.value.slice(firstLineStart, minimumSelectionEnd);
    const indentedText = newSelection.replace(/(^|\n)(\t| {1,2})/g, "$1");
    const replacementsCount = newSelection.length - indentedText.length;
    element.setSelectionRange(firstLineStart, minimumSelectionEnd);
    _TextUtils.insert(element, indentedText);
    const firstLineIndentation = /\t| {1,2}/.exec(value.slice(firstLineStart, selectionStart));
    const difference = firstLineIndentation ? firstLineIndentation[0].length : 0;
    const newSelectionStart = selectionStart - difference;
    element.setSelectionRange(selectionStart - difference, Math.max(newSelectionStart, selectionEnd - replacementsCount));
  }
  static normalizeText(text) {
    return text.replace(_TextUtils.fixNewLines, "\n");
  }
};
var TextUtils = _TextUtils;
__publicField3(TextUtils, "fixNewLines", /\r?\n|\r/g);
__publicField3(TextUtils, "INDENT", "  ");
function uniqueId() {
  return nanoid();
}
function lerp(a2, b, t) {
  return a2 + (b - a2) * t;
}
var TLShape = class {
  constructor(props) {
    __publicField3(this, "props");
    __publicField3(this, "aspectRatio");
    __publicField3(this, "type");
    __publicField3(this, "hideCloneHandles", false);
    __publicField3(this, "hideResizeHandles", false);
    __publicField3(this, "hideRotateHandle", false);
    __publicField3(this, "hideContextBar", false);
    __publicField3(this, "hideSelectionDetail", false);
    __publicField3(this, "hideSelection", false);
    __publicField3(this, "canChangeAspectRatio", true);
    __publicField3(this, "canUnmount", true);
    __publicField3(this, "canResize", true);
    __publicField3(this, "canScale", true);
    __publicField3(this, "canFlip", true);
    __publicField3(this, "canEdit", false);
    __publicField3(this, "nonce", 0);
    __publicField3(this, "isDirty", false);
    __publicField3(this, "lastSerialized", {});
    __publicField3(this, "getCenter", () => {
      return BoundsUtils.getBoundsCenter(this.bounds);
    });
    __publicField3(this, "getRotatedBounds", () => {
      const {
        bounds,
        props: { rotation }
      } = this;
      if (!rotation)
        return bounds;
      return BoundsUtils.getBoundsFromPoints(BoundsUtils.getRotatedCorners(bounds, rotation));
    });
    __publicField3(this, "hitTestPoint", (point) => {
      const ownBounds = this.rotatedBounds;
      if (!this.props.rotation) {
        return PointUtils.pointInBounds(point, ownBounds);
      }
      const corners = BoundsUtils.getRotatedCorners(ownBounds, this.props.rotation);
      return PointUtils.pointInPolygon(point, corners);
    });
    __publicField3(this, "hitTestLineSegment", (A, B) => {
      const box2 = BoundsUtils.getBoundsFromPoints([A, B]);
      const {
        rotatedBounds,
        props: { rotation = 0 }
      } = this;
      return BoundsUtils.boundsContain(rotatedBounds, box2) || rotation ? intersectLineSegmentPolyline(A, B, BoundsUtils.getRotatedCorners(this.bounds)).didIntersect : intersectLineSegmentBounds(A, B, rotatedBounds).length > 0;
    });
    __publicField3(this, "hitTestBounds", (bounds) => {
      const {
        rotatedBounds,
        props: { rotation = 0 }
      } = this;
      const corners = BoundsUtils.getRotatedCorners(this.bounds, rotation);
      return BoundsUtils.boundsContain(bounds, rotatedBounds) || intersectPolygonBounds(corners, bounds).length > 0;
    });
    __publicField3(this, "getSerialized", () => {
      return toJS(__spreadProps2(__spreadValues2({}, this.props), { type: this.type, nonce: this.nonce }));
    });
    __publicField3(this, "getCachedSerialized", () => {
      if (this.isDirty || Object.keys(this.lastSerialized).length === 0) {
        this.nonce++;
        this.isDirty = false;
        this.lastSerialized = this.getSerialized();
      }
      return this.lastSerialized;
    });
    __publicField3(this, "validateProps", (props2) => {
      return props2;
    });
    __publicField3(this, "update", (props2, isDeserializing = false) => {
      if (!(isDeserializing || this.isDirty))
        this.isDirty = true;
      Object.assign(this.props, this.validateProps(props2));
      return this;
    });
    __publicField3(this, "clone", () => {
      return new this.constructor(this.serialized);
    });
    __publicField3(this, "onResetBounds", (info) => {
      return this;
    });
    __publicField3(this, "scale", [1, 1]);
    __publicField3(this, "onResizeStart", (info) => {
      var _a3;
      this.scale = [...(_a3 = this.props.scale) != null ? _a3 : [1, 1]];
      return this;
    });
    __publicField3(this, "onResize", (initialProps, info) => {
      const {
        bounds,
        rotation,
        scale: [scaleX, scaleY]
      } = info;
      const nextScale = [...this.scale];
      if (scaleX < 0)
        nextScale[0] *= -1;
      if (scaleY < 0)
        nextScale[1] *= -1;
      this.update({ point: [bounds.minX, bounds.minY], scale: nextScale, rotation });
      return this;
    });
    __publicField3(this, "onHandleChange", (initialShape, { index, delta }) => {
      if (initialShape.handles === void 0)
        return;
      const nextHandles = [...initialShape.handles];
      nextHandles[index] = __spreadProps2(__spreadValues2({}, nextHandles[index]), {
        point: src_default.add(delta, initialShape.handles[index].point)
      });
      const topLeft = BoundsUtils.getCommonTopLeft(nextHandles.map((h) => h.point));
      this.update({
        point: src_default.add(initialShape.point, topLeft),
        handles: nextHandles.map((h) => __spreadProps2(__spreadValues2({}, h), { point: src_default.sub(h.point, topLeft) }))
      });
    });
    var _a2;
    const type = this.constructor["id"];
    const defaultProps = (_a2 = this.constructor["defaultProps"]) != null ? _a2 : {};
    this.type = type;
    this.props = __spreadValues2(__spreadValues2({ scale: [1, 1] }, defaultProps), props);
    makeObservable(this);
  }
  get id() {
    return this.props.id;
  }
  get center() {
    return this.getCenter();
  }
  get bounds() {
    return this.getBounds();
  }
  get rotatedBounds() {
    return this.getRotatedBounds();
  }
  get serialized() {
    return this.getCachedSerialized();
  }
};
__publicField3(TLShape, "type");
__decorateClass2([
  observable
], TLShape.prototype, "props", 2);
__decorateClass2([
  computed
], TLShape.prototype, "id", 1);
__decorateClass2([
  computed
], TLShape.prototype, "center", 1);
__decorateClass2([
  computed
], TLShape.prototype, "bounds", 1);
__decorateClass2([
  computed
], TLShape.prototype, "rotatedBounds", 1);
__decorateClass2([
  action
], TLShape.prototype, "update", 2);
var TLBoxShape = class extends TLShape {
  constructor(props = {}) {
    super(props);
    __publicField3(this, "getBounds", () => {
      const [x, y] = this.props.point;
      const [width, height] = this.props.size;
      return {
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height,
        width,
        height
      };
    });
    __publicField3(this, "getRotatedBounds", () => {
      return BoundsUtils.getBoundsFromPoints(BoundsUtils.getRotatedCorners(this.bounds, this.props.rotation));
    });
    __publicField3(this, "onResize", (initialProps, info) => {
      const {
        bounds,
        rotation,
        scale: [scaleX, scaleY]
      } = info;
      const nextScale = [...this.scale];
      if (scaleX < 0)
        nextScale[0] *= -1;
      if (scaleY < 0)
        nextScale[1] *= -1;
      this.update({ point: [bounds.minX, bounds.minY], scale: nextScale, rotation });
      return this.update({
        point: [bounds.minX, bounds.minY],
        size: [Math.max(1, bounds.width), Math.max(1, bounds.height)],
        scale: nextScale
      });
    });
    __publicField3(this, "validateProps", (props2) => {
      if (props2.size !== void 0) {
        props2.size[0] = Math.max(props2.size[0], 1);
        props2.size[1] = Math.max(props2.size[1], 1);
      }
      return props2;
    });
    makeObservable(this);
  }
};
__publicField3(TLBoxShape, "id", "box");
__publicField3(TLBoxShape, "defaultProps", {
  id: "box",
  type: "box",
  parentId: "page",
  point: [0, 0],
  size: [100, 100]
});
var TLDrawShape = class extends TLShape {
  constructor(props = {}) {
    super(props);
    __publicField3(this, "getBounds", () => {
      const {
        pointBounds,
        props: { point }
      } = this;
      return BoundsUtils.translateBounds(pointBounds, point);
    });
    __publicField3(this, "getRotatedBounds", () => {
      const {
        props: { rotation, point },
        bounds,
        rotatedPoints
      } = this;
      if (!rotation)
        return bounds;
      return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedPoints), point);
    });
    __publicField3(this, "normalizedPoints", []);
    __publicField3(this, "isResizeFlippedX", false);
    __publicField3(this, "isResizeFlippedY", false);
    __publicField3(this, "onResizeStart", () => {
      var _a2;
      const {
        bounds,
        props: { points }
      } = this;
      this.scale = [...(_a2 = this.props.scale) != null ? _a2 : [1, 1]];
      const size = [bounds.width, bounds.height];
      this.normalizedPoints = points.map((point) => Vec.divV(point, size));
      return this;
    });
    __publicField3(this, "onResize", (initialProps, info) => {
      const {
        bounds,
        scale: [scaleX, scaleY]
      } = info;
      const size = [bounds.width, bounds.height];
      const nextScale = [...this.scale];
      if (scaleX < 0)
        nextScale[0] *= -1;
      if (scaleY < 0)
        nextScale[1] *= -1;
      return this.update(scaleX || scaleY ? {
        point: [bounds.minX, bounds.minY],
        points: this.normalizedPoints.map((point) => Vec.mulV(point, size).concat(point[2])),
        scale: nextScale
      } : {
        point: [bounds.minX, bounds.minY],
        points: this.normalizedPoints.map((point) => Vec.mulV(point, size).concat(point[2]))
      });
    });
    __publicField3(this, "hitTestPoint", (point) => {
      const {
        props: { points, point: ownPoint }
      } = this;
      return PointUtils.pointNearToPolyline(Vec.sub(point, ownPoint), points);
    });
    __publicField3(this, "hitTestLineSegment", (A, B) => {
      const {
        bounds,
        props: { points, point }
      } = this;
      if (PointUtils.pointInBounds(A, bounds) || PointUtils.pointInBounds(B, bounds) || intersectBoundsLineSegment(bounds, A, B).length > 0) {
        const rA = Vec.sub(A, point);
        const rB = Vec.sub(B, point);
        return intersectLineSegmentPolyline(rA, rB, points).didIntersect || !!points.find((point2) => Vec.dist(rA, point2) < 5 || Vec.dist(rB, point2) < 5);
      }
      return false;
    });
    __publicField3(this, "hitTestBounds", (bounds) => {
      const {
        rotatedBounds,
        props: { points, point }
      } = this;
      const oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(point));
      return BoundsUtils.boundsContain(bounds, rotatedBounds) || points.every((vert) => PointUtils.pointInBounds(vert, oBounds)) || BoundsUtils.boundsCollide(bounds, rotatedBounds) && intersectPolylineBounds(points, oBounds).length > 0;
    });
    makeObservable(this);
  }
  get pointBounds() {
    const {
      props: { points }
    } = this;
    return BoundsUtils.getBoundsFromPoints(points);
  }
  get rotatedPoints() {
    const {
      props: { point, points, rotation },
      center
    } = this;
    if (!rotation)
      return points;
    const relativeCenter = Vec.sub(center, point);
    return points.map((point2) => Vec.rotWith(point2, relativeCenter, rotation));
  }
};
__publicField3(TLDrawShape, "id", "draw");
__publicField3(TLDrawShape, "defaultProps", {
  id: "draw",
  type: "draw",
  parentId: "page",
  point: [0, 0],
  points: [],
  isComplete: false
});
__decorateClass2([
  computed
], TLDrawShape.prototype, "pointBounds", 1);
__decorateClass2([
  computed
], TLDrawShape.prototype, "rotatedPoints", 1);
var TLDotShape = class extends TLShape {
  constructor(props = {}) {
    super(props);
    __publicField3(this, "hideSelection", true);
    __publicField3(this, "hideResizeHandles", true);
    __publicField3(this, "hideRotateHandle", true);
    __publicField3(this, "hideSelectionDetail", true);
    __publicField3(this, "getBounds", () => {
      const {
        props: {
          point: [x, y],
          radius
        }
      } = this;
      return {
        minX: x,
        minY: y,
        maxX: x + radius * 2,
        maxY: y + radius * 2,
        width: radius * 2,
        height: radius * 2
      };
    });
    __publicField3(this, "getRotatedBounds", () => {
      return BoundsUtils.getBoundsFromPoints(BoundsUtils.getRotatedCorners(this.bounds, this.props.rotation));
    });
    __publicField3(this, "onResize", (initialProps, info) => {
      const {
        props: { radius }
      } = this;
      return this.update({
        point: [
          info.bounds.minX + info.bounds.width / 2 - radius,
          info.bounds.minY + info.bounds.height / 2 - radius
        ]
      });
    });
    makeObservable(this);
  }
};
__publicField3(TLDotShape, "id", "dot");
__publicField3(TLDotShape, "defaultProps", {
  id: "dot",
  type: "dot",
  parentId: "page",
  point: [0, 0],
  radius: 6
});
var TLEllipseShape = class extends TLBoxShape {
  constructor(props = {}) {
    super(props);
    __publicField3(this, "getBounds", () => {
      const {
        props: {
          point: [x, y],
          size: [w, h]
        }
      } = this;
      return BoundsUtils.getRotatedEllipseBounds(x, y, w / 2, h / 2, 0);
    });
    __publicField3(this, "getRotatedBounds", () => {
      const {
        props: {
          point: [x, y],
          size: [w, h],
          rotation
        }
      } = this;
      return BoundsUtils.getRotatedEllipseBounds(x, y, w / 2, h / 2, rotation);
    });
    __publicField3(this, "hitTestPoint", (point) => {
      const {
        props: { size, rotation },
        center
      } = this;
      return PointUtils.pointInEllipse(point, center, size[0], size[1], rotation || 0);
    });
    __publicField3(this, "hitTestLineSegment", (A, B) => {
      const {
        props: {
          size: [w, h],
          rotation = 0
        },
        center
      } = this;
      return intersectLineSegmentEllipse(A, B, center, w, h, rotation).didIntersect;
    });
    __publicField3(this, "hitTestBounds", (bounds) => {
      const {
        props: {
          size: [w, h],
          rotation = 0
        },
        rotatedBounds
      } = this;
      return BoundsUtils.boundsContain(bounds, rotatedBounds) || intersectEllipseBounds(this.center, w / 2, h / 2, rotation, bounds).length > 0;
    });
    makeObservable(this);
  }
};
__publicField3(TLEllipseShape, "id", "ellipse");
__publicField3(TLEllipseShape, "defaultProps", {
  id: "ellipse",
  type: "ellipse",
  parentId: "page",
  point: [0, 0],
  size: [100, 100]
});
var TLImageShape = class extends TLBoxShape {
  constructor(props = {}) {
    super(props);
    __publicField3(this, "onResetBounds", (info) => {
      const { clipping, size, point } = this.props;
      if (clipping) {
        const [t, r, b, l2] = Array.isArray(clipping) ? clipping : [clipping, clipping, clipping, clipping];
        return this.update({
          clipping: 0,
          point: [point[0] - l2, point[1] - t],
          size: [size[0] + (l2 - r), size[1] + (t - b)]
        });
      } else if (info.asset) {
        const {
          size: [w, h]
        } = info.asset;
        this.update({
          clipping: 0,
          point: [point[0] + size[0] / 2 - w / 2, point[1] + size[1] / 2 - h / 2],
          size: [w, h]
        });
      }
      return this;
    });
    __publicField3(this, "onResize", (initialProps, info) => {
      const { bounds, clip, scale } = info;
      let { clipping } = this.props;
      const { clipping: iClipping } = initialProps;
      if (clip) {
        const {
          point: [x, y],
          size: [w, h]
        } = initialProps;
        const [t, r, b, l2] = iClipping ? Array.isArray(iClipping) ? iClipping : [iClipping, iClipping, iClipping, iClipping] : [0, 0, 0, 0];
        clipping = [
          t + (bounds.minY - y),
          r + (bounds.maxX - (x + w)),
          b + (bounds.maxY - (y + h)),
          l2 + (bounds.minX - x)
        ];
      } else {
        if (iClipping !== void 0) {
          clipping = Array.isArray(iClipping) ? iClipping : [iClipping, iClipping, iClipping, iClipping];
          clipping = [
            clipping[0] * scale[1],
            clipping[1] * scale[0],
            clipping[2] * scale[1],
            clipping[3] * scale[0]
          ];
        }
      }
      if (clipping && Array.isArray(clipping)) {
        const c = clipping;
        if (c.every((v, i) => i === 0 || v === c[i - 1])) {
          clipping = c[0];
        }
      }
      return this.update({
        point: [bounds.minX, bounds.minY],
        size: [Math.max(1, bounds.width), Math.max(1, bounds.height)],
        clipping
      });
    });
    makeObservable(this);
  }
};
__publicField3(TLImageShape, "id", "ellipse");
__publicField3(TLImageShape, "defaultProps", {
  id: "ellipse",
  type: "ellipse",
  parentId: "page",
  point: [0, 0],
  size: [100, 100],
  clipping: 0,
  objectFit: "none",
  assetId: ""
});
var TLPolylineShape = class extends TLShape {
  constructor(props = {}) {
    super(props);
    __publicField3(this, "getBounds", () => {
      const {
        points,
        props: { point }
      } = this;
      return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(points), point);
    });
    __publicField3(this, "getRotatedBounds", () => {
      const {
        rotatedPoints,
        props: { point }
      } = this;
      return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedPoints), point);
    });
    __publicField3(this, "normalizedHandles", []);
    __publicField3(this, "onResizeStart", () => {
      var _a2;
      const {
        props: { handles },
        bounds
      } = this;
      this.scale = [...(_a2 = this.props.scale) != null ? _a2 : [1, 1]];
      const size = [bounds.width, bounds.height];
      this.normalizedHandles = handles.map((h) => Vec.divV(h.point, size));
      return this;
    });
    __publicField3(this, "onResize", (initialProps, info) => {
      const {
        bounds,
        scale: [scaleX, scaleY]
      } = info;
      const {
        props: { handles },
        normalizedHandles
      } = this;
      const size = [bounds.width, bounds.height];
      const nextScale = [...this.scale];
      if (scaleX < 0)
        nextScale[0] *= -1;
      if (scaleY < 0)
        nextScale[1] *= -1;
      return this.update({
        point: [bounds.minX, bounds.minY],
        handles: handles.map((handle, i) => __spreadProps2(__spreadValues2({}, handle), {
          point: Vec.mulV(normalizedHandles[i], size)
        })),
        scale: nextScale
      });
    });
    __publicField3(this, "hitTestPoint", (point) => {
      const { points } = this;
      return PointUtils.pointNearToPolyline(Vec.sub(point, this.props.point), points);
    });
    __publicField3(this, "hitTestLineSegment", (A, B) => {
      const {
        bounds,
        points,
        props: { point }
      } = this;
      if (PointUtils.pointInBounds(A, bounds) || PointUtils.pointInBounds(B, bounds) || intersectBoundsLineSegment(bounds, A, B).length > 0) {
        const rA = Vec.sub(A, point);
        const rB = Vec.sub(B, point);
        return intersectLineSegmentPolyline(rA, rB, points).didIntersect || !!points.find((point2) => Vec.dist(rA, point2) < 5 || Vec.dist(rB, point2) < 5);
      }
      return false;
    });
    __publicField3(this, "hitTestBounds", (bounds) => {
      const {
        rotatedBounds,
        points,
        props: { point }
      } = this;
      const oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(point));
      return BoundsUtils.boundsContain(bounds, rotatedBounds) || points.every((vert) => PointUtils.pointInBounds(vert, oBounds)) || BoundsUtils.boundsCollide(bounds, rotatedBounds) && intersectPolylineBounds(points, oBounds).length > 0;
    });
    __publicField3(this, "validateProps", (props2) => {
      if (props2.point)
        props2.point = [0, 0];
      if (props2.handles !== void 0 && props2.handles.length < 1)
        props2.handles = [{ point: [0, 0] }];
      return props2;
    });
    makeObservable(this);
  }
  get points() {
    return this.props.handles.map((h) => h.point);
  }
  get centroid() {
    const { points } = this;
    return PolygonUtils.getPolygonCentroid(points);
  }
  get rotatedPoints() {
    const {
      centroid,
      props: { handles, rotation }
    } = this;
    if (!rotation)
      return this.points;
    return handles.map((h) => Vec.rotWith(h.point, centroid, rotation));
  }
};
__publicField3(TLPolylineShape, "id", "polyline");
__publicField3(TLPolylineShape, "defaultProps", {
  id: "polyline",
  type: "polyline",
  parentId: "page",
  point: [0, 0],
  handles: [{ id: "0", point: [0, 0] }]
});
__decorateClass2([
  computed
], TLPolylineShape.prototype, "points", 1);
__decorateClass2([
  computed
], TLPolylineShape.prototype, "centroid", 1);
__decorateClass2([
  computed
], TLPolylineShape.prototype, "rotatedPoints", 1);
var TLLineShape = class extends TLPolylineShape {
  constructor(props = {}) {
    super(props);
    __publicField3(this, "validateProps", (props2) => {
      if (props2.point)
        props2.point = [0, 0];
      if (props2.handles !== void 0 && props2.handles.length < 1)
        props2.handles = [{ point: [0, 0] }];
      return props2;
    });
    makeObservable(this);
  }
};
__publicField3(TLLineShape, "id", "line");
__publicField3(TLLineShape, "defaultProps", {
  id: "line",
  type: "line",
  parentId: "page",
  point: [0, 0],
  handles: [
    { id: "start", point: [0, 0] },
    { id: "end", point: [1, 1] }
  ]
});
var TLPolygonShape = class extends TLBoxShape {
  constructor(props = {}) {
    super(props);
    __publicField3(this, "getRotatedBounds", () => {
      const {
        rotatedVertices,
        props: { point },
        offset
      } = this;
      return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedVertices), Vec.add(point, offset));
    });
    __publicField3(this, "hitTestPoint", (point) => {
      const { vertices } = this;
      return PointUtils.pointInPolygon(Vec.add(point, this.props.point), vertices);
    });
    __publicField3(this, "hitTestLineSegment", (A, B) => {
      const {
        vertices,
        props: { point }
      } = this;
      return intersectLineSegmentPolyline(Vec.sub(A, point), Vec.sub(B, point), vertices).didIntersect;
    });
    __publicField3(this, "hitTestBounds", (bounds) => {
      const {
        rotatedBounds,
        offset,
        rotatedVertices,
        props: { point }
      } = this;
      const oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(Vec.add(point, offset)));
      return BoundsUtils.boundsContain(bounds, rotatedBounds) || rotatedVertices.every((vert) => PointUtils.pointInBounds(vert, oBounds)) || intersectPolygonBounds(rotatedVertices, oBounds).length > 0;
    });
    __publicField3(this, "validateProps", (props2) => {
      if (props2.point)
        props2.point = [0, 0];
      if (props2.sides !== void 0 && props2.sides < 3)
        props2.sides = 3;
      return props2;
    });
    makeObservable(this);
  }
  get vertices() {
    return this.getVertices();
  }
  get pageVertices() {
    const {
      props: { point },
      vertices
    } = this;
    return vertices.map((vert) => Vec.add(vert, point));
  }
  get centroid() {
    const { vertices } = this;
    return PolygonUtils.getPolygonCentroid(vertices);
  }
  get rotatedVertices() {
    const {
      vertices,
      centroid,
      props: { rotation }
    } = this;
    if (!rotation)
      return vertices;
    return vertices.map((v) => Vec.rotWith(v, centroid, rotation));
  }
  get offset() {
    const {
      props: {
        size: [w, h]
      }
    } = this;
    const center = BoundsUtils.getBoundsCenter(BoundsUtils.getBoundsFromPoints(this.vertices));
    return Vec.sub(Vec.div([w, h], 2), center);
  }
  getVertices(padding = 0) {
    const { ratio, sides, size, scale } = this.props;
    const vertices = sides === 3 ? PolygonUtils.getTriangleVertices(size, padding, ratio) : PolygonUtils.getPolygonVertices(size, sides, padding, ratio);
    return vertices;
  }
};
__publicField3(TLPolygonShape, "id", "polygon");
__publicField3(TLPolygonShape, "defaultProps", {
  id: "polygon",
  type: "polygon",
  parentId: "page",
  point: [0, 0],
  size: [100, 100],
  sides: 5,
  ratio: 1,
  isFlippedY: false
});
__decorateClass2([
  computed
], TLPolygonShape.prototype, "vertices", 1);
__decorateClass2([
  computed
], TLPolygonShape.prototype, "pageVertices", 1);
__decorateClass2([
  computed
], TLPolygonShape.prototype, "centroid", 1);
__decorateClass2([
  computed
], TLPolygonShape.prototype, "rotatedVertices", 1);
__decorateClass2([
  computed
], TLPolygonShape.prototype, "offset", 1);
var TLStarShape = class extends TLPolygonShape {
  constructor(props = {}) {
    super(props);
    makeObservable(this);
  }
  getVertices(padding = 0) {
    const { ratio, sides, size, isFlippedY } = this.props;
    const [w, h] = size;
    const vertices = PolygonUtils.getStarVertices(Vec.div([w, h], 2), [Math.max(1, w - padding), Math.max(1, h - padding)], Math.round(sides), ratio);
    if (isFlippedY) {
      return vertices.map((point) => [point[0], h - point[1]]);
    }
    return vertices;
  }
};
__publicField3(TLStarShape, "id", "star");
__publicField3(TLStarShape, "defaultProps", {
  id: "star",
  parentId: "page",
  type: "star",
  point: [0, 0],
  size: [100, 100],
  sides: 3,
  ratio: 1,
  isFlippedY: false
});
var TLTextShape = class extends TLBoxShape {
  constructor(props = {}) {
    super(props);
    __publicField3(this, "canEdit", true);
    __publicField3(this, "canFlip", false);
    makeObservable(this);
  }
};
__publicField3(TLTextShape, "id", "text");
__publicField3(TLTextShape, "defaultProps", {
  id: "text",
  type: "text",
  parentId: "page",
  isSizeLocked: true,
  point: [0, 0],
  size: [16, 32],
  text: ""
});
var TLRootState = class {
  constructor() {
    __publicField3(this, "_id");
    __publicField3(this, "_initial");
    __publicField3(this, "_states");
    __publicField3(this, "_isActive", false);
    __publicField3(this, "cursor");
    __publicField3(this, "_disposables", []);
    __publicField3(this, "children", /* @__PURE__ */ new Map([]));
    __publicField3(this, "registerStates", (stateClasses) => {
      stateClasses.forEach((StateClass) => this.children.set(StateClass.id, new StateClass(this, this)));
      return this;
    });
    __publicField3(this, "deregisterStates", (states2) => {
      states2.forEach((StateClass) => {
        var _a2;
        (_a2 = this.children.get(StateClass.id)) == null ? void 0 : _a2.dispose();
        this.children.delete(StateClass.id);
      });
      return this;
    });
    __publicField3(this, "currentState", {});
    __publicField3(this, "transition", (id2, data = {}) => {
      if (this.children.size === 0)
        throw Error(`Tool ${this.id} has no states, cannot transition to ${id2}.`);
      const nextState = this.children.get(id2);
      const prevState = this.currentState;
      if (!nextState)
        throw Error(`Could not find a state named ${id2}.`);
      transaction(() => {
        if (this.currentState) {
          prevState._events.onExit(__spreadProps2(__spreadValues2({}, data), { toId: id2 }));
          prevState.dispose();
          nextState.registerKeyboardShortcuts();
          this.setCurrentState(nextState);
          this._events.onTransition(__spreadProps2(__spreadValues2({}, data), { fromId: prevState.id, toId: id2 }));
          nextState._events.onEnter(__spreadProps2(__spreadValues2({}, data), { fromId: prevState.id }));
        } else {
          this.currentState = nextState;
          nextState._events.onEnter(__spreadProps2(__spreadValues2({}, data), { fromId: "" }));
        }
      });
      return this;
    });
    __publicField3(this, "isIn", (path) => {
      const ids = path.split(".").reverse();
      let state = this;
      while (ids.length > 0) {
        const id2 = ids.pop();
        if (!id2) {
          return true;
        }
        if (state.currentState.id === id2) {
          if (ids.length === 0) {
            return true;
          }
          state = state.currentState;
          continue;
        } else {
          return false;
        }
      }
      return false;
    });
    __publicField3(this, "isInAny", (...paths) => {
      return paths.some(this.isIn);
    });
    __publicField3(this, "forwardEvent", (eventName, ...args) => {
      var _a2, _b;
      if ((_b = (_a2 = this.currentState) == null ? void 0 : _a2._events) == null ? void 0 : _b[eventName]) {
        transaction(() => {
          var _a22;
          return (_a22 = this.currentState._events) == null ? void 0 : _a22[eventName](...args);
        });
      }
    });
    __publicField3(this, "_events", {
      onTransition: (info) => {
        var _a2;
        (_a2 = this.onTransition) == null ? void 0 : _a2.call(this, info);
      },
      onEnter: (info) => {
        var _a2;
        this._isActive = true;
        if (this.initial)
          this.transition(this.initial, info);
        (_a2 = this.onEnter) == null ? void 0 : _a2.call(this, info);
      },
      onExit: (info) => {
        var _a2, _b, _c;
        this._isActive = false;
        (_b = (_a2 = this.currentState) == null ? void 0 : _a2.onExit) == null ? void 0 : _b.call(_a2, { toId: "parent" });
        (_c = this.onExit) == null ? void 0 : _c.call(this, info);
      },
      onWheel: (info, event) => {
        var _a2;
        (_a2 = this.onWheel) == null ? void 0 : _a2.call(this, info, event);
        this.forwardEvent("onWheel", info, event);
      },
      onPointerDown: (info, event) => {
        var _a2;
        (_a2 = this.onPointerDown) == null ? void 0 : _a2.call(this, info, event);
        this.forwardEvent("onPointerDown", info, event);
      },
      onPointerUp: (info, event) => {
        var _a2;
        (_a2 = this.onPointerUp) == null ? void 0 : _a2.call(this, info, event);
        this.forwardEvent("onPointerUp", info, event);
      },
      onPointerMove: (info, event) => {
        var _a2;
        (_a2 = this.onPointerMove) == null ? void 0 : _a2.call(this, info, event);
        this.forwardEvent("onPointerMove", info, event);
      },
      onPointerEnter: (info, event) => {
        var _a2;
        (_a2 = this.onPointerEnter) == null ? void 0 : _a2.call(this, info, event);
        this.forwardEvent("onPointerEnter", info, event);
      },
      onPointerLeave: (info, event) => {
        var _a2;
        (_a2 = this.onPointerLeave) == null ? void 0 : _a2.call(this, info, event);
        this.forwardEvent("onPointerLeave", info, event);
      },
      onDoubleClick: (info, event) => {
        var _a2;
        (_a2 = this.onDoubleClick) == null ? void 0 : _a2.call(this, info, event);
        this.forwardEvent("onDoubleClick", info, event);
      },
      onKeyDown: (info, event) => {
        var _a2;
        this._events.onModifierKey(info, event);
        (_a2 = this.onKeyDown) == null ? void 0 : _a2.call(this, info, event);
        this.forwardEvent("onKeyDown", info, event);
      },
      onKeyUp: (info, event) => {
        var _a2;
        this._events.onModifierKey(info, event);
        (_a2 = this.onKeyUp) == null ? void 0 : _a2.call(this, info, event);
        this.forwardEvent("onKeyUp", info, event);
      },
      onPinchStart: (info, event) => {
        var _a2;
        (_a2 = this.onPinchStart) == null ? void 0 : _a2.call(this, info, event);
        this.forwardEvent("onPinchStart", info, event);
      },
      onPinch: (info, event) => {
        var _a2;
        (_a2 = this.onPinch) == null ? void 0 : _a2.call(this, info, event);
        this.forwardEvent("onPinch", info, event);
      },
      onPinchEnd: (info, event) => {
        var _a2;
        (_a2 = this.onPinchEnd) == null ? void 0 : _a2.call(this, info, event);
        this.forwardEvent("onPinchEnd", info, event);
      },
      onModifierKey: (info, event) => {
        switch (event.key) {
          case "Shift":
          case "Alt":
          case "Ctrl":
          case "Meta": {
            this._events.onPointerMove(info, event);
            break;
          }
        }
      }
    });
    __publicField3(this, "onEnter");
    __publicField3(this, "onExit");
    __publicField3(this, "onTransition");
    __publicField3(this, "onWheel");
    __publicField3(this, "onPointerDown");
    __publicField3(this, "onPointerUp");
    __publicField3(this, "onPointerMove");
    __publicField3(this, "onPointerEnter");
    __publicField3(this, "onPointerLeave");
    __publicField3(this, "onDoubleClick");
    __publicField3(this, "onKeyDown");
    __publicField3(this, "onKeyUp");
    __publicField3(this, "onPinchStart");
    __publicField3(this, "onPinch");
    __publicField3(this, "onPinchEnd");
    const id = this.constructor["id"];
    const initial = this.constructor["initial"];
    const states = this.constructor["states"];
    this._id = id;
    this._initial = initial;
    this._states = states;
  }
  dispose() {
    this._disposables.forEach((disposable) => disposable());
    return this;
  }
  get initial() {
    return this._initial;
  }
  get states() {
    return this._states;
  }
  get id() {
    return this._id;
  }
  get isActive() {
    return this._isActive;
  }
  get ascendants() {
    return [this];
  }
  get descendants() {
    return Array.from(this.children.values()).flatMap((state) => [state, ...state.descendants]);
  }
  setCurrentState(state) {
    this.currentState = state;
  }
};
__publicField3(TLRootState, "id");
__publicField3(TLRootState, "shortcuts");
__decorateClass2([
  observable
], TLRootState.prototype, "currentState", 2);
__decorateClass2([
  action
], TLRootState.prototype, "setCurrentState", 1);
var TLState = class extends TLRootState {
  constructor(parent, root) {
    var _a2, _b;
    super();
    __publicField3(this, "registerKeyboardShortcuts", () => {
      var _a3;
      if (!((_a3 = this._shortcuts) == null ? void 0 : _a3.length))
        return;
      this._disposables.push(...this._shortcuts.map(({ keys, fn }) => {
        return KeyUtils.registerShortcut(keys, (event) => {
          if (!this.isActive)
            return;
          fn(this.root, this, event);
        });
      }));
    });
    __publicField3(this, "_root");
    __publicField3(this, "_parent");
    __publicField3(this, "_shortcuts", []);
    __publicField3(this, "children", /* @__PURE__ */ new Map([]));
    __publicField3(this, "registerStates", (stateClasses) => {
      stateClasses.forEach((StateClass) => this.children.set(StateClass.id, new StateClass(this, this._root)));
      return this;
    });
    __publicField3(this, "deregisterStates", (states) => {
      states.forEach((StateClass) => {
        var _a3;
        (_a3 = this.children.get(StateClass.id)) == null ? void 0 : _a3.dispose();
        this.children.delete(StateClass.id);
      });
      return this;
    });
    this._parent = parent;
    this._root = root;
    if (this.states && this.states.length > 0) {
      this.registerStates(this.states);
      const initialId = (_a2 = this.initial) != null ? _a2 : this.states[0].id;
      const state = this.children.get(initialId);
      if (state) {
        this.setCurrentState(state);
        (_b = this.currentState) == null ? void 0 : _b._events.onEnter({ fromId: "initial" });
      }
    }
    const shortcut = this.constructor["shortcut"];
    if (shortcut) {
      KeyUtils.registerShortcut(shortcut, () => {
        this.parent.transition(this.id);
      });
    }
    const shortcuts = this.constructor["shortcuts"];
    this._shortcuts = shortcuts;
    makeObservable(this);
  }
  get root() {
    return this._root;
  }
  get parent() {
    return this._parent;
  }
  get ascendants() {
    if (!this.parent)
      return [this];
    if (!("ascendants" in this.parent))
      return [this.parent, this];
    return [...this.parent.ascendants, this];
  }
};
__publicField3(TLState, "cursor");
var TLTool = class extends TLState {
  constructor() {
    super(...arguments);
    __publicField3(this, "isLocked", false);
    __publicField3(this, "previous");
    __publicField3(this, "onEnter", ({ fromId }) => {
      this.previous = fromId;
      if (this.cursor)
        this.app.cursors.setCursor(this.cursor);
    });
    __publicField3(this, "onTransition", (info) => {
      const { toId } = info;
      const toState = this.children.get(toId);
      this.app.cursors.reset();
      if (toState.cursor) {
        this.app.cursors.setCursor(toState.cursor);
      } else if (this.cursor) {
        this.app.cursors.setCursor(this.cursor);
      }
    });
  }
  get app() {
    return this.root;
  }
};
var TLToolState = class extends TLState {
  get app() {
    return this.root;
  }
  get tool() {
    return this.parent;
  }
};
var CreatingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "crosshair");
    __publicField3(this, "creatingShape");
    __publicField3(this, "aspectRatio");
    __publicField3(this, "initialBounds", {});
    __publicField3(this, "onEnter", () => {
      const {
        currentPage,
        inputs: { originPoint, currentPoint }
      } = this.app;
      const { Shape: Shape17 } = this.tool;
      const shape = new Shape17({
        id: uniqueId(),
        type: Shape17.id,
        parentId: currentPage.id,
        point: [...originPoint],
        size: src_default.abs(src_default.sub(currentPoint, originPoint))
      });
      this.initialBounds = {
        minX: originPoint[0],
        minY: originPoint[1],
        maxX: originPoint[0] + 1,
        maxY: originPoint[1] + 1,
        width: 1,
        height: 1
      };
      if (!shape.canChangeAspectRatio) {
        if (shape.aspectRatio) {
          this.aspectRatio = shape.aspectRatio;
          this.initialBounds.height = this.aspectRatio;
          this.initialBounds.width = 1;
        } else {
          this.aspectRatio = 1;
          this.initialBounds.height = 1;
          this.initialBounds.width = 1;
        }
        this.initialBounds.maxY = this.initialBounds.minY + this.initialBounds.height;
      }
      this.creatingShape = shape;
      this.app.currentPage.addShapes(shape);
      this.app.setSelectedShapes([shape]);
    });
    __publicField3(this, "onPointerMove", (info) => {
      if (info.order)
        return;
      if (!this.creatingShape)
        throw Error("Expected a creating shape.");
      const { initialBounds } = this;
      const { currentPoint, originPoint, shiftKey } = this.app.inputs;
      const bounds = BoundsUtils.getTransformedBoundingBox(initialBounds, "bottom_right_corner", src_default.sub(currentPoint, originPoint), 0, shiftKey || this.creatingShape.props.isAspectRatioLocked || !this.creatingShape.canChangeAspectRatio);
      this.creatingShape.update({
        point: [bounds.minX, bounds.minY],
        size: [bounds.width, bounds.height]
      });
    });
    __publicField3(this, "onPointerUp", () => {
      this.tool.transition("idle");
      if (this.creatingShape) {
        this.app.setSelectedShapes([this.creatingShape]);
      }
      if (!this.app.settings.isToolLocked) {
        this.app.transition("select");
      }
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          if (!this.creatingShape)
            throw Error("Expected a creating shape.");
          this.app.deleteShapes([this.creatingShape]);
          this.tool.transition("idle");
          break;
        }
      }
    });
  }
};
__publicField3(CreatingState, "id", "creating");
var IdleState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "onPointerDown", (info, e) => {
      if (info.order)
        return;
      this.tool.transition("pointing");
    });
    __publicField3(this, "onPinchStart", (...args) => {
      var _a2, _b;
      this.app.transition("select", { returnTo: "box" });
      (_b = (_a2 = this.app).onPinchStart) == null ? void 0 : _b.call(_a2, ...args);
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.transition("select");
          break;
        }
      }
    });
  }
};
__publicField3(IdleState, "id", "idle");
var PointingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("creating");
        this.app.setSelectedShapes(this.app.currentPage.shapes);
      }
    });
    __publicField3(this, "onPointerUp", () => {
      this.tool.transition("idle");
    });
  }
};
__publicField3(PointingState, "id", "pointing");
var TLBoxTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "crosshair");
  }
};
__publicField3(TLBoxTool, "id", "box");
__publicField3(TLBoxTool, "states", [IdleState, PointingState, CreatingState]);
__publicField3(TLBoxTool, "initial", "idle");
var CreatingState2 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "creatingShape");
    __publicField3(this, "offset", [0, 0]);
    __publicField3(this, "onEnter", () => {
      const { Shape: Shape17 } = this.tool;
      this.offset = [Shape17.defaultProps.radius, Shape17.defaultProps.radius];
      const shape = new Shape17({
        id: uniqueId(),
        parentId: this.app.currentPage.id,
        point: src_default.sub(this.app.inputs.originPoint, this.offset)
      });
      this.creatingShape = shape;
      this.app.currentPage.addShapes(shape);
      this.app.setSelectedShapes([shape]);
    });
    __publicField3(this, "onPointerMove", () => {
      if (!this.creatingShape)
        throw Error("Expected a creating shape.");
      const { currentPoint } = this.app.inputs;
      this.creatingShape.update({
        point: src_default.sub(currentPoint, this.offset)
      });
    });
    __publicField3(this, "onPointerUp", () => {
      this.tool.transition("idle");
      if (this.creatingShape) {
        this.app.setSelectedShapes([this.creatingShape]);
      }
      if (!this.app.settings.isToolLocked) {
        this.app.transition("select");
      }
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          if (!this.creatingShape)
            throw Error("Expected a creating shape.");
          this.app.deleteShapes([this.creatingShape]);
          this.tool.transition("idle");
          break;
        }
      }
    });
  }
};
__publicField3(CreatingState2, "id", "creating");
var IdleState2 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "onPointerDown", (info, e) => {
      if (info.order)
        return;
      this.tool.transition("creating");
    });
    __publicField3(this, "onPinchStart", (...args) => {
      var _a2, _b;
      this.app.transition("select", { returnTo: "box" });
      (_b = (_a2 = this.app).onPinchStart) == null ? void 0 : _b.call(_a2, ...args);
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.transition("select");
          break;
        }
      }
    });
  }
};
__publicField3(IdleState2, "id", "idle");
var TLDotTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "crosshair");
  }
};
__publicField3(TLDotTool, "id", "box");
__publicField3(TLDotTool, "states", [IdleState2, CreatingState2]);
__publicField3(TLDotTool, "initial", "idle");
var CreatingState3 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "shape", {});
    __publicField3(this, "points", [[0, 0, 0.5]]);
    __publicField3(this, "onEnter", () => {
      var _a2, _b;
      const { Shape: Shape17, previousShape } = this.tool;
      const { originPoint } = this.app.inputs;
      this.app.history.pause();
      if (this.app.inputs.shiftKey && previousShape) {
        this.shape = previousShape;
        const { shape } = this;
        const prevPoint = shape.props.points[shape.props.points.length - 1];
        const nextPoint = Vec.sub(originPoint, shape.props.point).concat((_a2 = originPoint[2]) != null ? _a2 : 0.5);
        this.points = [...shape.props.points, prevPoint, prevPoint];
        const len = Math.ceil(Vec.dist(prevPoint, originPoint) / 16);
        for (let i = 0, t = i / (len - 1); i < len; i++) {
          this.points.push(Vec.lrp(prevPoint, nextPoint, t).concat(lerp(prevPoint[2], nextPoint[2], t)));
        }
        this.addNextPoint(nextPoint);
      } else {
        this.tool.previousShape = void 0;
        this.points = [[0, 0, (_b = originPoint[2]) != null ? _b : 0.5]];
        this.shape = new Shape17({
          id: uniqueId(),
          type: Shape17.id,
          parentId: this.app.currentPage.id,
          point: originPoint.slice(0, 2),
          points: this.points,
          isComplete: false
        });
        this.app.currentPage.addShapes(this.shape);
      }
    });
    __publicField3(this, "onPointerMove", () => {
      const { shape } = this;
      const { currentPoint, previousPoint } = this.app.inputs;
      if (Vec.isEqual(previousPoint, currentPoint))
        return;
      this.addNextPoint(Vec.sub(currentPoint, shape.props.point).concat(currentPoint[2]));
    });
    __publicField3(this, "onPointerUp", () => {
      if (!this.shape)
        throw Error("Expected a creating shape.");
      this.app.history.resume();
      this.shape.update({
        isComplete: true,
        points: this.tool.simplify ? PointUtils.simplify2(this.points, this.tool.simplifyTolerance) : this.shape.props.points
      });
      this.tool.previousShape = this.shape;
      this.tool.transition("idle");
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          if (!this.shape)
            throw Error("Expected a creating shape.");
          this.app.deleteShapes([this.shape]);
          this.tool.transition("idle");
          break;
        }
      }
    });
  }
  addNextPoint(point) {
    const { shape } = this;
    const offset = Vec.min(point, [0, 0]);
    this.points.push(point);
    if (offset[0] < 0 || offset[1] < 0) {
      this.points = this.points.map((pt) => Vec.sub(pt, offset).concat(pt[2]));
      shape.update({
        point: Vec.add(shape.props.point, offset),
        points: this.points
      });
    } else {
      shape.update({
        points: this.points
      });
    }
  }
};
__publicField3(CreatingState3, "id", "creating");
var IdleState3 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "onPointerDown", (info, e) => {
      if (info.order)
        return;
      this.tool.transition("creating");
    });
    __publicField3(this, "onPinchStart", (...args) => {
      var _a2, _b;
      this.app.transition("select", { returnTo: "draw" });
      (_b = (_a2 = this.app._events).onPinchStart) == null ? void 0 : _b.call(_a2, ...args);
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.transition("select");
          break;
        }
      }
    });
  }
};
__publicField3(IdleState3, "id", "idle");
var TLDrawTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "crosshair");
    __publicField3(this, "simplify", true);
    __publicField3(this, "simplifyTolerance", 1);
    __publicField3(this, "previousShape");
  }
};
__publicField3(TLDrawTool, "id", "draw");
__publicField3(TLDrawTool, "states", [IdleState3, CreatingState3]);
__publicField3(TLDrawTool, "initial", "idle");
var ErasingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "points", [[0, 0, 0.5]]);
    __publicField3(this, "hitShapes", /* @__PURE__ */ new Set());
    __publicField3(this, "onEnter", () => {
      const { originPoint } = this.app.inputs;
      this.points = [originPoint];
      this.hitShapes.clear();
    });
    __publicField3(this, "onPointerMove", () => {
      const { currentPoint, previousPoint } = this.app.inputs;
      if (Vec.isEqual(previousPoint, currentPoint))
        return;
      this.points.push(currentPoint);
      this.app.shapesInViewport.filter((shape) => shape.hitTestLineSegment(previousPoint, currentPoint)).forEach((shape) => this.hitShapes.add(shape));
      this.app.setErasingShapes(Array.from(this.hitShapes.values()));
    });
    __publicField3(this, "onPointerUp", () => {
      this.app.deleteShapes(Array.from(this.hitShapes.values()));
      this.tool.transition("idle");
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.setErasingShapes([]);
          this.tool.transition("idle");
          break;
        }
      }
    });
  }
};
__publicField3(ErasingState, "id", "erasing");
var IdleState4 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "onPointerDown", (info, e) => {
      if (info.order)
        return;
      this.tool.transition("pointing");
    });
    __publicField3(this, "onPinchStart", (...args) => {
      var _a2, _b;
      this.app.transition("select", { returnTo: "draw" });
      (_b = (_a2 = this.app).onPinchStart) == null ? void 0 : _b.call(_a2, ...args);
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.transition("select");
          break;
        }
      }
    });
  }
};
__publicField3(IdleState4, "id", "idle");
var PointingState2 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "onEnter", () => {
      const { currentPoint } = this.app.inputs;
      this.app.setErasingShapes(this.app.shapesInViewport.filter((shape) => shape.hitTestPoint(currentPoint)));
    });
    __publicField3(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("erasing");
        this.app.setSelectedShapes([]);
      }
    });
    __publicField3(this, "onPointerUp", () => {
      const shapesToDelete = [...this.app.erasingShapes];
      this.app.setErasingShapes([]);
      this.app.deleteShapes(shapesToDelete);
      this.tool.transition("idle");
    });
  }
};
__publicField3(PointingState2, "id", "pointing");
var TLEraseTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "crosshair");
  }
};
__publicField3(TLEraseTool, "id", "erase");
__publicField3(TLEraseTool, "states", [IdleState4, PointingState2, ErasingState]);
__publicField3(TLEraseTool, "initial", "idle");
var CreatingState4 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "creatingShape", {});
    __publicField3(this, "initialShape", {});
    __publicField3(this, "onEnter", () => {
      const { Shape: Shape17 } = this.tool;
      const shape = new Shape17({
        id: uniqueId(),
        type: Shape17.id,
        parentId: this.app.currentPage.id,
        point: this.app.inputs.originPoint,
        handles: [{ point: [0, 0] }, { point: [1, 1] }]
      });
      this.initialShape = toJS(shape.props);
      this.creatingShape = shape;
      this.app.currentPage.addShapes(shape);
      this.app.setSelectedShapes([shape]);
    });
    __publicField3(this, "onPointerMove", () => {
      const {
        inputs: { shiftKey, previousPoint, originPoint, currentPoint }
      } = this.app;
      if (src_default.isEqual(previousPoint, currentPoint))
        return;
      const delta = src_default.sub(currentPoint, originPoint);
      if (shiftKey) {
        if (Math.abs(delta[0]) < Math.abs(delta[1])) {
          delta[0] = 0;
        } else {
          delta[1] = 0;
        }
      }
      const { initialShape } = this;
      this.creatingShape.onHandleChange(initialShape, { index: 1, delta });
    });
    __publicField3(this, "onPointerUp", () => {
      this.tool.transition("idle");
      if (this.creatingShape) {
        this.app.setSelectedShapes([this.creatingShape]);
      }
      if (!this.app.settings.isToolLocked) {
        this.app.transition("select");
      }
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.deleteShapes([this.creatingShape]);
          this.tool.transition("idle");
          break;
        }
      }
    });
  }
};
__publicField3(CreatingState4, "id", "creating");
var IdleState5 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "onPointerDown", (info, e) => {
      if (info.order)
        return;
      this.tool.transition("pointing");
    });
    __publicField3(this, "onPinchStart", (...args) => {
      var _a2, _b;
      this.app.transition("select", { returnTo: "Line" });
      (_b = (_a2 = this.app).onPinchStart) == null ? void 0 : _b.call(_a2, ...args);
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.transition("select");
          break;
        }
      }
    });
  }
};
__publicField3(IdleState5, "id", "idle");
var PointingState3 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("creating");
        this.app.setSelectedShapes(this.app.currentPage.shapes);
      }
    });
  }
};
__publicField3(PointingState3, "id", "pointing");
var TLLineTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "crosshair");
  }
};
__publicField3(TLLineTool, "id", "line");
__publicField3(TLLineTool, "states", [IdleState5, PointingState3, CreatingState4]);
__publicField3(TLLineTool, "initial", "idle");
var CreatingState5 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "crosshair");
    __publicField3(this, "creatingShape");
    __publicField3(this, "aspectRatio");
    __publicField3(this, "initialBounds", {});
    __publicField3(this, "onEnter", () => {
      const {
        currentPage,
        inputs: { originPoint }
      } = this.app;
      const { Shape: Shape17 } = this.tool;
      const shape = new Shape17({
        id: uniqueId(),
        type: Shape17.id,
        parentId: currentPage.id,
        point: [...originPoint],
        text: "",
        size: [16, 32],
        isSizeLocked: true
      });
      this.creatingShape = shape;
      transaction(() => {
        this.app.currentPage.addShapes(shape);
        const { bounds } = shape;
        shape.update({ point: src_default.sub(originPoint, [bounds.width / 2, bounds.height / 2]) });
        this.app.transition("select");
        this.app.setSelectedShapes([shape]);
        this.app.currentState.transition("editingShape", {
          type: "shape",
          shape: this.creatingShape,
          order: 0
        });
      });
    });
  }
};
__publicField3(CreatingState5, "id", "creating");
var IdleState6 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "onPointerDown", (info, e) => {
      if (info.order)
        return;
      this.tool.transition("creating");
    });
    __publicField3(this, "onPinchStart", (...args) => {
      var _a2, _b;
      this.app.transition("select", { returnTo: "box" });
      (_b = (_a2 = this.app).onPinchStart) == null ? void 0 : _b.call(_a2, ...args);
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.transition("select");
          break;
        }
      }
    });
  }
};
__publicField3(IdleState6, "id", "idle");
var TLTextTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "crosshair");
  }
};
__publicField3(TLTextTool, "id", "box");
__publicField3(TLTextTool, "states", [IdleState6, CreatingState5]);
__publicField3(TLTextTool, "initial", "idle");
var BrushingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "initialSelectedIds", []);
    __publicField3(this, "initialSelectedShapes", []);
    __publicField3(this, "tree", new TLBush());
    __publicField3(this, "onEnter", () => {
      const { selectedShapes, currentPage, selectedIds } = this.app;
      this.initialSelectedIds = Array.from(selectedIds.values());
      this.initialSelectedShapes = Array.from(selectedShapes.values());
      this.tree.load(currentPage.shapes);
    });
    __publicField3(this, "onExit", () => {
      this.initialSelectedIds = [];
      this.tree.clear();
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      const {
        inputs: { shiftKey, ctrlKey, originPoint, currentPoint }
      } = this.app;
      const brushBounds = BoundsUtils.getBoundsFromPoints([currentPoint, originPoint], 0);
      this.app.setBrush(brushBounds);
      const hits = this.tree.search(brushBounds).filter((shape) => ctrlKey ? BoundsUtils.boundsContain(brushBounds, shape.rotatedBounds) : shape.hitTestBounds(brushBounds));
      if (shiftKey) {
        if (hits.every((hit) => this.initialSelectedShapes.includes(hit))) {
          this.app.setSelectedShapes(this.initialSelectedShapes.filter((hit) => !hits.includes(hit)));
        } else {
          this.app.setSelectedShapes(Array.from((/* @__PURE__ */ new Set([...this.initialSelectedShapes, ...hits])).values()));
        }
      } else {
        this.app.setSelectedShapes(hits);
      }
    });
    __publicField3(this, "onPointerUp", () => {
      this.app.setBrush(void 0);
      this.tool.transition("idle");
    });
    __publicField3(this, "handleModifierKey", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.setBrush(void 0);
          this.app.setSelectedShapes(this.initialSelectedIds);
          this.tool.transition("idle");
          break;
        }
      }
    });
  }
};
__publicField3(BrushingState, "id", "brushing");
var IdleState7 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "onEnter", (info) => {
    });
    __publicField3(this, "onExit", () => {
      this.app.setHoveredShape(void 0);
    });
    __publicField3(this, "onPointerEnter", (info) => {
      if (info.order)
        return;
      switch (info.type) {
        case "shape": {
          this.app.setHoveredShape(info.shape.id);
          break;
        }
        case "selection": {
          if (!(info.handle === "background" || info.handle === "center")) {
            this.tool.transition("hoveringSelectionHandle", info);
          }
          break;
        }
      }
    });
    __publicField3(this, "onPointerDown", (info, event) => {
      const {
        selectedShapes,
        inputs: { ctrlKey }
      } = this.app;
      if (ctrlKey) {
        this.tool.transition("pointingCanvas");
        return;
      }
      switch (info.type) {
        case "selection": {
          switch (info.handle) {
            case "center": {
              break;
            }
            case "background": {
              this.tool.transition("pointingBoundsBackground");
              break;
            }
            case "rotate": {
              this.tool.transition("pointingRotateHandle");
              break;
            }
            default: {
              this.tool.transition("pointingResizeHandle", info);
            }
          }
          break;
        }
        case "shape": {
          if (selectedShapes.has(info.shape)) {
            this.tool.transition("pointingSelectedShape", info);
          } else {
            const { selectionBounds, inputs } = this.app;
            if (selectionBounds && PointUtils.pointInBounds(inputs.currentPoint, selectionBounds)) {
              this.tool.transition("pointingShapeBehindBounds", info);
            } else {
              this.tool.transition("pointingShape", info);
            }
          }
          break;
        }
        case "handle": {
          this.tool.transition("pointingHandle", info);
          break;
        }
        case "canvas": {
          this.tool.transition("pointingCanvas");
          break;
        }
      }
    });
    __publicField3(this, "onPointerLeave", (info) => {
      if (info.order)
        return;
      if (info.type === "shape") {
        if (this.app.hoveredId) {
          this.app.setHoveredShape(void 0);
        }
      }
    });
    __publicField3(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
    __publicField3(this, "onDoubleClick", (info) => {
      if (info.order)
        return;
      if (this.app.selectedShapesArray.length !== 1)
        return;
      const selectedShape = this.app.selectedShapesArray[0];
      if (!selectedShape.canEdit)
        return;
      switch (info.type) {
        case "shape": {
          this.tool.transition("editingShape", info);
          break;
        }
        case "selection": {
          if (this.app.selectedShapesArray.length === 1) {
            this.tool.transition("editingShape", {
              type: "shape",
              target: selectedShape
            });
          }
          break;
        }
      }
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      const { selectedShapesArray } = this.app;
      switch (e.key) {
        case "Enter": {
          if (selectedShapesArray.length === 1 && selectedShapesArray[0].canEdit) {
            this.tool.transition("editingShape", {
              type: "shape",
              shape: selectedShapesArray[0],
              order: 0
            });
          }
          break;
        }
        case "Escape": {
          if (selectedShapesArray.length) {
            this.app.setSelectedShapes([]);
          }
          break;
        }
      }
    });
  }
};
__publicField3(IdleState7, "id", "idle");
__publicField3(IdleState7, "shortcuts", [
  {
    keys: ["delete", "backspace"],
    fn: (app) => app.api.deleteShapes()
  }
]);
var PointingShapeState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "onEnter", (info) => {
      const {
        selectedIds,
        inputs: { shiftKey }
      } = this.app;
      if (shiftKey) {
        this.app.setSelectedShapes([...Array.from(selectedIds.values()), info.shape.id]);
      } else {
        this.app.setSelectedShapes([info.shape]);
      }
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("translating");
      }
    });
    __publicField3(this, "onPointerUp", () => {
      this.tool.transition("idle");
    });
    __publicField3(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
};
__publicField3(PointingShapeState, "id", "pointingShape");
var PointingBoundsBackgroundState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "move");
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("translating");
      }
    });
    __publicField3(this, "onPointerUp", () => {
      this.app.setSelectedShapes([]);
      this.tool.transition("idle");
    });
    __publicField3(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
};
__publicField3(PointingBoundsBackgroundState, "id", "pointingBoundsBackground");
var PointingCanvasState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "onEnter", () => {
      const { shiftKey } = this.app.inputs;
      if (!shiftKey)
        this.app.setSelectedShapes([]);
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("brushing");
      }
    });
    __publicField3(this, "onPointerUp", () => {
      if (!this.app.inputs.shiftKey) {
        this.app.setSelectedShapes([]);
      }
      this.tool.transition("idle");
    });
    __publicField3(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
};
__publicField3(PointingCanvasState, "id", "pointingCanvas");
var TranslatingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "move");
    __publicField3(this, "isCloning", false);
    __publicField3(this, "didClone", false);
    __publicField3(this, "initialPoints", {});
    __publicField3(this, "initialShapePoints", {});
    __publicField3(this, "initialClonePoints", {});
    __publicField3(this, "clones", []);
    __publicField3(this, "onEnter", () => {
      this.app.history.pause();
      const { selectedShapesArray, inputs } = this.app;
      this.initialShapePoints = Object.fromEntries(selectedShapesArray.map(({ id, props: { point } }) => [id, point.slice()]));
      this.initialPoints = this.initialShapePoints;
      if (inputs.altKey) {
        this.startCloning();
      } else {
        this.moveSelectedShapesToPointer();
      }
    });
    __publicField3(this, "onExit", () => {
      this.app.history.resume();
      this.didClone = false;
      this.isCloning = false;
      this.clones = [];
      this.initialPoints = {};
      this.initialShapePoints = {};
      this.initialClonePoints = {};
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      this.moveSelectedShapesToPointer();
    });
    __publicField3(this, "onPointerUp", () => {
      this.app.history.resume();
      this.app.persist();
      this.tool.transition("idle");
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Alt": {
          this.startCloning();
          break;
        }
        case "Escape": {
          this.app.selectedShapes.forEach((shape) => {
            shape.update({ point: this.initialPoints[shape.id] });
          });
          this.tool.transition("idle");
          break;
        }
      }
    });
    __publicField3(this, "onKeyUp", (info, e) => {
      switch (e.key) {
        case "Alt": {
          if (!this.isCloning)
            throw Error("Expected to be cloning.");
          const { currentPage, selectedShapes } = this.app;
          currentPage.removeShapes(...selectedShapes);
          this.initialPoints = this.initialShapePoints;
          this.app.setSelectedShapes(Object.keys(this.initialPoints));
          this.moveSelectedShapesToPointer();
          this.isCloning = false;
          break;
        }
      }
    });
  }
  moveSelectedShapesToPointer() {
    const {
      selectedShapes,
      inputs: { shiftKey, originPoint, currentPoint }
    } = this.app;
    const { initialPoints } = this;
    const delta = Vec.sub(currentPoint, originPoint);
    if (shiftKey) {
      if (Math.abs(delta[0]) < Math.abs(delta[1])) {
        delta[0] = 0;
      } else {
        delta[1] = 0;
      }
    }
    selectedShapes.forEach((shape) => shape.update({ point: Vec.add(initialPoints[shape.id], delta) }));
  }
  startCloning() {
    if (!this.didClone) {
      this.clones = this.app.selectedShapesArray.map((shape) => {
        const ShapeClass = this.app.getShapeClass(shape.type);
        if (!ShapeClass)
          throw Error("Could not find that shape class.");
        const clone = new ShapeClass(__spreadProps2(__spreadValues2({}, shape.serialized), {
          id: uniqueId(),
          type: shape.type,
          point: this.initialPoints[shape.id],
          rotation: shape.props.rotation
        }));
        return clone;
      });
      this.initialClonePoints = Object.fromEntries(this.clones.map(({ id, props: { point } }) => [id, point.slice()]));
      this.didClone = true;
    }
    this.app.selectedShapes.forEach((shape) => {
      shape.update({ point: this.initialPoints[shape.id] });
    });
    this.initialPoints = this.initialClonePoints;
    this.app.currentPage.addShapes(...this.clones);
    this.app.setSelectedShapes(Object.keys(this.initialClonePoints));
    this.moveSelectedShapesToPointer();
    this.isCloning = true;
    this.moveSelectedShapesToPointer();
  }
};
__publicField3(TranslatingState, "id", "translating");
var PointingSelectedShapeState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "pointedSelectedShape");
    __publicField3(this, "onEnter", (info) => {
      this.pointedSelectedShape = info.shape;
    });
    __publicField3(this, "onExit", () => {
      this.pointedSelectedShape = void 0;
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("translating");
      }
    });
    __publicField3(this, "onPointerUp", () => {
      const { shiftKey } = this.app.inputs;
      if (!this.pointedSelectedShape)
        throw Error("Expected a pointed selected shape");
      if (shiftKey) {
        const { selectedIds } = this.app;
        const next = Array.from(selectedIds.values());
        next.splice(next.indexOf(this.pointedSelectedShape.id), 1);
        this.app.setSelectedShapes(next);
      } else {
        this.app.setSelectedShapes([this.pointedSelectedShape.id]);
      }
      this.tool.transition("idle");
    });
    __publicField3(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
};
__publicField3(PointingSelectedShapeState, "id", "pointingSelectedShape");
var PointingResizeHandleState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "info", {});
    __publicField3(this, "onEnter", (info) => {
      this.info = info;
      this.updateCursor();
    });
    __publicField3(this, "onExit", () => {
      this.app.cursors.reset();
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("resizing", this.info);
      }
    });
    __publicField3(this, "onPointerUp", () => {
      this.tool.transition("hoveringSelectionHandle", this.info);
    });
    __publicField3(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
  updateCursor() {
    const rotation = this.app.selectionBounds.rotation;
    const cursor = CURSORS[this.info.handle];
    this.app.cursors.setCursor(cursor, rotation);
  }
};
__publicField3(PointingResizeHandleState, "id", "pointingResizeHandle");
var _ResizingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "isSingle", false);
    __publicField3(this, "handle", "bottom_right_corner");
    __publicField3(this, "snapshots", {});
    __publicField3(this, "initialCommonBounds", {});
    __publicField3(this, "selectionRotation", 0);
    __publicField3(this, "resizeType", "corner");
    __publicField3(this, "onEnter", (info) => {
      var _a2, _b;
      const { history, selectedShapesArray, selectionBounds } = this.app;
      if (!selectionBounds)
        throw Error("Expected a selected bounds.");
      this.handle = info.handle;
      this.resizeType = info.handle === "left_edge" || info.handle === "right_edge" ? "horizontal-edge" : info.handle === "top_edge" || info.handle === "bottom_edge" ? "vertical-edge" : "corner";
      this.app.cursors.setCursor(_ResizingState.CURSORS[info.handle], (_a2 = this.app.selectionBounds) == null ? void 0 : _a2.rotation);
      history.pause();
      const initialInnerBounds = BoundsUtils.getBoundsFromPoints(selectedShapesArray.map((shape) => BoundsUtils.getBoundsCenter(shape.bounds)));
      this.isSingle = selectedShapesArray.length === 1;
      this.selectionRotation = this.isSingle ? (_b = selectedShapesArray[0].props.rotation) != null ? _b : 0 : 0;
      this.initialCommonBounds = __spreadValues2({}, selectionBounds);
      this.snapshots = Object.fromEntries(selectedShapesArray.map((shape) => {
        const bounds = __spreadValues2({}, shape.bounds);
        const [cx, cy] = BoundsUtils.getBoundsCenter(bounds);
        return [
          shape.id,
          {
            props: shape.serialized,
            bounds,
            transformOrigin: [
              (cx - this.initialCommonBounds.minX) / this.initialCommonBounds.width,
              (cy - this.initialCommonBounds.minY) / this.initialCommonBounds.height
            ],
            innerTransformOrigin: [
              (cx - initialInnerBounds.minX) / initialInnerBounds.width,
              (cy - initialInnerBounds.minY) / initialInnerBounds.height
            ],
            isAspectRatioLocked: shape.props.isAspectRatioLocked || Boolean(!shape.canChangeAspectRatio || shape.props.rotation)
          }
        ];
      }));
      selectedShapesArray.forEach((shape) => {
        var _a22;
        return (_a22 = shape.onResizeStart) == null ? void 0 : _a22.call(shape, { isSingle: this.isSingle });
      });
    });
    __publicField3(this, "onExit", () => {
      this.app.cursors.reset();
      this.snapshots = {};
      this.initialCommonBounds = {};
      this.selectionRotation = 0;
      this.app.history.resume();
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      const {
        inputs: { altKey, shiftKey, ctrlKey, originPoint, currentPoint }
      } = this.app;
      const { handle, snapshots, initialCommonBounds } = this;
      let delta = Vec.sub(currentPoint, originPoint);
      if (altKey) {
        delta = Vec.mul(delta, 2);
      }
      const firstShape = getFirstFromSet(this.app.selectedShapes);
      const useAspectRatioLock = shiftKey || this.isSingle && (ctrlKey ? !("clipping" in firstShape.props) : !firstShape.canChangeAspectRatio || firstShape.props.isAspectRatioLocked);
      let nextBounds = BoundsUtils.getTransformedBoundingBox(initialCommonBounds, handle, delta, this.selectionRotation, useAspectRatioLock);
      if (altKey) {
        nextBounds = __spreadValues2(__spreadValues2({}, nextBounds), BoundsUtils.centerBounds(nextBounds, BoundsUtils.getBoundsCenter(initialCommonBounds)));
      }
      const { scaleX, scaleY } = nextBounds;
      let resizeDimension;
      switch (this.resizeType) {
        case "horizontal-edge": {
          resizeDimension = Math.abs(scaleX);
          break;
        }
        case "vertical-edge": {
          resizeDimension = Math.abs(scaleY);
          break;
        }
        case "corner": {
          resizeDimension = Math.min(Math.abs(scaleX), Math.abs(scaleY));
        }
      }
      this.app.selectedShapes.forEach((shape) => {
        var _a2, _b;
        const {
          isAspectRatioLocked,
          props: initialShapeProps,
          bounds: initialShapeBounds,
          transformOrigin,
          innerTransformOrigin
        } = snapshots[shape.id];
        let relativeBounds = BoundsUtils.getRelativeTransformedBoundingBox(nextBounds, initialCommonBounds, initialShapeBounds, scaleX < 0, scaleY < 0);
        if (!(shape.canResize || shape.props.isSizeLocked) && this.isSingle) {
          return;
        }
        let scale = [scaleX, scaleY];
        let rotation = (_a2 = initialShapeProps.rotation) != null ? _a2 : 0;
        let center = BoundsUtils.getBoundsCenter(relativeBounds);
        if (!shape.canFlip) {
          scale = Vec.abs(scale);
        }
        if (!shape.canScale) {
          scale = (_b = initialShapeProps.scale) != null ? _b : [1, 1];
        }
        if (rotation && scaleX < 0 && scaleY >= 0 || scaleY < 0 && scaleX >= 0) {
          rotation *= -1;
        }
        if (isAspectRatioLocked || !shape.canResize || shape.props.isSizeLocked) {
          relativeBounds.width = initialShapeBounds.width;
          relativeBounds.height = initialShapeBounds.height;
          if (isAspectRatioLocked) {
            relativeBounds.width *= resizeDimension;
            relativeBounds.height *= resizeDimension;
          }
          center = [
            nextBounds.minX + (scaleX < 0 ? 1 - innerTransformOrigin[0] : innerTransformOrigin[0]) * (nextBounds.width - relativeBounds.width) + relativeBounds.width / 2,
            nextBounds.minY + (scaleY < 0 ? 1 - innerTransformOrigin[1] : innerTransformOrigin[1]) * (nextBounds.height - relativeBounds.height) + relativeBounds.height / 2
          ];
          relativeBounds = BoundsUtils.centerBounds(relativeBounds, center);
        }
        shape.onResize(initialShapeProps, {
          center,
          rotation,
          scale,
          bounds: relativeBounds,
          type: handle,
          clip: ctrlKey,
          transformOrigin
        });
      });
      this.updateCursor(scaleX, scaleY);
    });
    __publicField3(this, "onPointerUp", () => {
      this.app.history.resume();
      this.app.persist();
      this.tool.transition("idle");
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.selectedShapes.forEach((shape) => {
            shape.update(__spreadValues2({}, this.snapshots[shape.id].props));
          });
          this.tool.transition("idle");
          break;
        }
      }
    });
  }
  updateCursor(scaleX, scaleY) {
    var _a2, _b, _c, _d;
    const isFlippedX = scaleX < 0 && scaleY >= 0;
    const isFlippedY = scaleY < 0 && scaleX >= 0;
    switch (this.handle) {
      case "top_left_corner":
      case "bottom_right_corner": {
        if (isFlippedX || isFlippedY) {
          if (this.app.cursors.cursor === "nwse-resize") {
            this.app.cursors.setCursor("nesw-resize", (_a2 = this.app.selectionBounds) == null ? void 0 : _a2.rotation);
          }
        } else {
          if (this.app.cursors.cursor === "nesw-resize") {
            this.app.cursors.setCursor("nwse-resize", (_b = this.app.selectionBounds) == null ? void 0 : _b.rotation);
          }
        }
        break;
      }
      case "top_right_corner":
      case "bottom_left_corner": {
        if (isFlippedX || isFlippedY) {
          if (this.app.cursors.cursor === "nesw-resize") {
            this.app.cursors.setCursor("nwse-resize", (_c = this.app.selectionBounds) == null ? void 0 : _c.rotation);
          }
        } else {
          if (this.app.cursors.cursor === "nwse-resize") {
            this.app.cursors.setCursor("nesw-resize", (_d = this.app.selectionBounds) == null ? void 0 : _d.rotation);
          }
        }
        break;
      }
    }
  }
};
var ResizingState = _ResizingState;
__publicField3(ResizingState, "id", "resizing");
__publicField3(ResizingState, "CURSORS", {
  ["bottom_edge"]: "ns-resize",
  ["top_edge"]: "ns-resize",
  ["left_edge"]: "ew-resize",
  ["right_edge"]: "ew-resize",
  ["bottom_left_corner"]: "nesw-resize",
  ["bottom_right_corner"]: "nwse-resize",
  ["top_left_corner"]: "nwse-resize",
  ["top_right_corner"]: "nesw-resize"
});
var PointingRotateHandleState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "rotate");
    __publicField3(this, "handle", "");
    __publicField3(this, "onEnter", (info) => {
      this.handle = info.handle;
      this.updateCursor();
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("rotating", { handle: this.handle });
      }
    });
    __publicField3(this, "onPointerUp", () => {
      this.tool.transition("idle");
    });
    __publicField3(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
  updateCursor() {
    this.app.cursors.setCursor(CURSORS[this.handle], this.app.selectionRotation);
  }
};
__publicField3(PointingRotateHandleState, "id", "pointingRotateHandle");
var PointingShapeBehindBoundsState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "info", {});
    __publicField3(this, "onEnter", (info) => {
      this.info = info;
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("translating");
      }
    });
    __publicField3(this, "onPointerUp", () => {
      const {
        selectedIds,
        inputs: { shiftKey }
      } = this.app;
      if (shiftKey) {
        this.app.setSelectedShapes([...Array.from(selectedIds.values()), this.info.shape.id]);
      } else {
        this.app.setSelectedShapes([this.info.shape.id]);
      }
      this.tool.transition("idle");
    });
    __publicField3(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
};
__publicField3(PointingShapeBehindBoundsState, "id", "pointingShapeBehindBounds");
var RotatingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "rotate");
    __publicField3(this, "snapshot", {});
    __publicField3(this, "initialCommonCenter", [0, 0]);
    __publicField3(this, "initialCommonBounds", {});
    __publicField3(this, "initialAngle", 0);
    __publicField3(this, "initialSelectionRotation", 0);
    __publicField3(this, "handle", "");
    __publicField3(this, "onEnter", (info) => {
      const { history, selectedShapesArray, selectionBounds } = this.app;
      if (!selectionBounds)
        throw Error("Expected selected bounds.");
      history.pause();
      this.handle = info.handle;
      this.initialSelectionRotation = this.app.selectionRotation;
      this.initialCommonBounds = __spreadValues2({}, selectionBounds);
      this.initialCommonCenter = BoundsUtils.getBoundsCenter(selectionBounds);
      this.initialAngle = Vec.angle(this.initialCommonCenter, this.app.inputs.currentPoint);
      this.snapshot = Object.fromEntries(selectedShapesArray.map((shape) => [
        shape.id,
        {
          point: [...shape.props.point],
          center: [...shape.center],
          rotation: shape.props.rotation,
          handles: "handles" in shape ? deepCopy(shape.handles) : void 0
        }
      ]));
      this.updateCursor();
    });
    __publicField3(this, "onExit", () => {
      this.app.history.resume();
      this.snapshot = {};
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      const {
        selectedShapes,
        inputs: { shiftKey, currentPoint }
      } = this.app;
      const { snapshot, initialCommonCenter, initialAngle, initialSelectionRotation } = this;
      const currentAngle = Vec.angle(initialCommonCenter, currentPoint);
      let angleDelta = currentAngle - initialAngle;
      if (shiftKey) {
        angleDelta = GeomUtils.snapAngleToSegments(angleDelta, 24);
      }
      selectedShapes.forEach((shape) => {
        const initialShape = snapshot[shape.id];
        let initialAngle2 = 0;
        if (shiftKey) {
          const { rotation = 0 } = initialShape;
          initialAngle2 = GeomUtils.snapAngleToSegments(rotation, 24) - rotation;
        }
        const relativeCenter = Vec.sub(initialShape.center, initialShape.point);
        const rotatedCenter = Vec.rotWith(initialShape.center, initialCommonCenter, angleDelta);
        if ("handles" in shape) {
          const initialHandles = initialShape.handles;
          const handlePoints = initialHandles.map((handle) => Vec.rotWith(handle.point, relativeCenter, angleDelta));
          const topLeft = BoundsUtils.getCommonTopLeft(handlePoints);
          shape.update({
            point: Vec.add(topLeft, Vec.sub(rotatedCenter, relativeCenter)),
            handles: initialHandles.map((h, i) => __spreadProps2(__spreadValues2({}, h), {
              point: Vec.sub(handlePoints[i], topLeft)
            }))
          });
        } else {
          shape.update({
            point: Vec.sub(rotatedCenter, relativeCenter),
            rotation: GeomUtils.clampRadians((initialShape.rotation || 0) + angleDelta + initialAngle2)
          });
        }
      });
      const selectionRotation = GeomUtils.clampRadians(initialSelectionRotation + angleDelta);
      this.app.setSelectionRotation(shiftKey ? GeomUtils.snapAngleToSegments(selectionRotation, 24) : selectionRotation);
      this.updateCursor();
    });
    __publicField3(this, "onPointerUp", () => {
      this.app.history.resume();
      this.app.persist();
      this.tool.transition("idle");
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.selectedShapes.forEach((shape) => {
            shape.update(this.snapshot[shape.id]);
          });
          this.tool.transition("idle");
          break;
        }
      }
    });
  }
  updateCursor() {
    this.app.cursors.setCursor(CURSORS[this.handle], this.app.selectionRotation);
  }
};
__publicField3(RotatingState, "id", "rotating");
var PinchingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "origin", [0, 0]);
    __publicField3(this, "prevDelta", [0, 0]);
    __publicField3(this, "onEnter", (info) => {
      this.prevDelta = info.info.delta;
      this.origin = info.info.point;
    });
    __publicField3(this, "onPinch", (info) => {
      this.pinchCamera(info.point, [0, 0], info.offset[0]);
    });
    __publicField3(this, "onPinchEnd", () => {
      this.tool.transition("idle");
    });
  }
  pinchCamera(point, delta, zoom) {
    const { camera } = this.app.viewport;
    const nextPoint = Vec.sub(camera.point, Vec.div(delta, camera.zoom));
    const p0 = Vec.sub(Vec.div(point, camera.zoom), nextPoint);
    const p1 = Vec.sub(Vec.div(point, zoom), nextPoint);
    this.app.setCamera(Vec.toFixed(Vec.add(nextPoint, Vec.sub(p1, p0))), zoom);
  }
};
__publicField3(PinchingState, "id", "pinching");
var TranslatingHandleState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "grabbing");
    __publicField3(this, "offset", [0, 0]);
    __publicField3(this, "initialTopLeft", [0, 0]);
    __publicField3(this, "index", 0);
    __publicField3(this, "shape", {});
    __publicField3(this, "initialShape", {});
    __publicField3(this, "handles", []);
    __publicField3(this, "initialHandles", []);
    __publicField3(this, "onEnter", (info) => {
      this.app.history.pause();
      this.offset = [0, 0];
      this.index = info.index;
      this.shape = info.shape;
      this.initialShape = __spreadValues2({}, this.shape.props);
      this.handles = deepCopy(info.shape.props.handles);
      this.initialHandles = deepCopy(info.shape.props.handles);
      this.initialTopLeft = [...info.shape.props.point];
    });
    __publicField3(this, "onExit", () => {
      this.app.history.resume();
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      const {
        inputs: { shiftKey, previousPoint, originPoint, currentPoint }
      } = this.app;
      if (Vec.isEqual(previousPoint, currentPoint))
        return;
      const delta = Vec.sub(currentPoint, originPoint);
      if (shiftKey) {
        if (Math.abs(delta[0]) < Math.abs(delta[1])) {
          delta[0] = 0;
        } else {
          delta[1] = 0;
        }
      }
      const { shape, initialShape, index } = this;
      shape.onHandleChange(initialShape, { index, delta });
    });
    __publicField3(this, "onPointerUp", () => {
      this.app.history.resume();
      this.app.persist();
      this.tool.transition("idle");
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.shape.update({
            handles: this.initialHandles
          });
          this.tool.transition("idle");
          break;
        }
      }
    });
  }
};
__publicField3(TranslatingHandleState, "id", "translatingHandle");
var PointingHandleState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "cursor", "grabbing");
    __publicField3(this, "info", {});
    __publicField3(this, "onEnter", (info) => {
      this.info = info;
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.onPointerMove(info, e);
    });
    __publicField3(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("translatingHandle", this.info);
      }
    });
    __publicField3(this, "onPointerUp", () => {
      this.tool.transition("idle");
    });
    __publicField3(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
};
__publicField3(PointingHandleState, "id", "pointingHandle");
var HoveringSelectionHandleState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "handle");
    __publicField3(this, "onEnter", (info) => {
      var _a2;
      this.app.cursors.setCursor(CURSORS[info.handle], (_a2 = this.app.selectionBounds.rotation) != null ? _a2 : 0);
      this.handle = info.handle;
    });
    __publicField3(this, "onExit", () => {
      this.app.cursors.reset();
    });
    __publicField3(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
    __publicField3(this, "onPointerDown", (info) => {
      switch (info.type) {
        case "selection": {
          switch (info.handle) {
            case "center": {
              break;
            }
            case "background": {
              break;
            }
            case "top_left_resize_corner":
            case "top_right_resize_corner":
            case "bottom_right_resize_corner":
            case "bottom_left_resize_corner": {
              this.tool.transition("pointingRotateHandle", info);
              break;
            }
            default: {
              this.tool.transition("pointingResizeHandle", info);
            }
          }
          break;
        }
      }
    });
    __publicField3(this, "onPointerLeave", () => {
      this.tool.transition("idle");
    });
    __publicField3(this, "onDoubleClick", (info) => {
      var _a2;
      if (info.order)
        return;
      const isSingle = this.app.selectedShapes.size === 1;
      if (!isSingle)
        return;
      const selectedShape = getFirstFromSet(this.app.selectedShapes);
      if (selectedShape.canEdit) {
        switch (info.type) {
          case "shape": {
            this.tool.transition("editingShape", info);
            break;
          }
          case "selection": {
            (_a2 = selectedShape.onResetBounds) == null ? void 0 : _a2.call(selectedShape, {});
            if (this.app.selectedShapesArray.length === 1) {
              this.tool.transition("editingShape", {
                type: "shape",
                target: selectedShape
              });
            }
            break;
          }
        }
      } else {
        const asset = selectedShape.props.assetId ? this.app.assets[selectedShape.props.assetId] : void 0;
        selectedShape.onResetBounds({ asset });
        this.tool.transition("idle");
      }
    });
  }
};
__publicField3(HoveringSelectionHandleState, "id", "hoveringSelectionHandle");
var EditingShapeState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField3(this, "editingShape", {});
    __publicField3(this, "onEnter", (info) => {
      this.editingShape = info.shape;
      this.app.setEditingShape(info.shape);
    });
    __publicField3(this, "onExit", () => {
      this.app.clearEditingShape();
    });
    __publicField3(this, "onPointerDown", (info) => {
      switch (info.type) {
        case "shape": {
          if (info.shape === this.editingShape)
            return;
          this.tool.transition("idle", info);
          break;
        }
        case "selection": {
          break;
        }
        case "handle": {
          break;
        }
        case "canvas": {
          if (!info.order) {
            this.tool.transition("idle", info);
          }
          break;
        }
      }
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          transaction(() => {
            e.stopPropagation();
            this.app.setSelectedShapes([this.editingShape]);
            this.tool.transition("idle");
          });
          break;
        }
      }
    });
  }
};
__publicField3(EditingShapeState, "id", "editingShape");
var TLSelectTool18 = class extends TLTool {
};
__publicField3(TLSelectTool18, "id", "select");
__publicField3(TLSelectTool18, "initial", "idle");
__publicField3(TLSelectTool18, "shortcut", ["v"]);
__publicField3(TLSelectTool18, "states", [
  IdleState7,
  BrushingState,
  PointingCanvasState,
  PointingShapeState,
  PointingShapeBehindBoundsState,
  PointingSelectedShapeState,
  PointingBoundsBackgroundState,
  HoveringSelectionHandleState,
  PointingResizeHandleState,
  PointingRotateHandleState,
  PointingHandleState,
  TranslatingHandleState,
  TranslatingState,
  ResizingState,
  RotatingState,
  RotatingState,
  PinchingState,
  EditingShapeState
]);
var TLPage = class {
  constructor(app, props = {}) {
    __publicField3(this, "app");
    __publicField3(this, "id");
    __publicField3(this, "name");
    __publicField3(this, "shapes", []);
    __publicField3(this, "bindings");
    __publicField3(this, "nonce", 0);
    __publicField3(this, "bump", () => {
      this.nonce++;
    });
    __publicField3(this, "bringForward", (shapes3) => {
      const shapesToMove = this.parseShapesArg(shapes3);
      shapesToMove.sort((a2, b) => this.shapes.indexOf(b) - this.shapes.indexOf(a2)).map((shape) => this.shapes.indexOf(shape)).forEach((index) => {
        if (index === this.shapes.length - 1)
          return;
        const next = this.shapes[index + 1];
        if (shapesToMove.includes(next))
          return;
        const t = this.shapes[index];
        this.shapes[index] = this.shapes[index + 1];
        this.shapes[index + 1] = t;
      });
      return this;
    });
    __publicField3(this, "sendBackward", (shapes3) => {
      const shapesToMove = this.parseShapesArg(shapes3);
      shapesToMove.sort((a2, b) => this.shapes.indexOf(a2) - this.shapes.indexOf(b)).map((shape) => this.shapes.indexOf(shape)).forEach((index) => {
        if (index === 0)
          return;
        const next = this.shapes[index - 1];
        if (shapesToMove.includes(next))
          return;
        const t = this.shapes[index];
        this.shapes[index] = this.shapes[index - 1];
        this.shapes[index - 1] = t;
      });
      return this;
    });
    __publicField3(this, "bringToFront", (shapes3) => {
      const shapesToMove = this.parseShapesArg(shapes3);
      this.shapes = this.shapes.filter((shape) => !shapesToMove.includes(shape)).concat(shapesToMove);
      return this;
    });
    __publicField3(this, "sendToBack", (shapes3) => {
      const shapesToMove = this.parseShapesArg(shapes3);
      this.shapes = shapesToMove.concat(this.shapes.filter((shape) => !shapesToMove.includes(shape)));
      return this;
    });
    __publicField3(this, "flip", (shapes3, direction) => {
      const shapesToMove = this.parseShapesArg(shapes3);
      const commonBounds = BoundsUtils.getCommonBounds(shapesToMove.map((shape) => shape.bounds));
      shapesToMove.forEach((shape) => {
        var _a2;
        const relativeBounds = BoundsUtils.getRelativeTransformedBoundingBox(commonBounds, commonBounds, shape.bounds, direction === "horizontal", direction === "vertical");
        shape.onResize(shape.serialized, {
          bounds: relativeBounds,
          center: BoundsUtils.getBoundsCenter(relativeBounds),
          rotation: (_a2 = shape.props.rotation) != null ? _a2 : 0 * -1,
          type: "top_left_corner",
          scale: shape.canFlip && shape.props.scale ? direction === "horizontal" ? [-shape.props.scale[0], 1] : [1, -shape.props.scale[1]] : [1, 1],
          clip: false,
          transformOrigin: [0.5, 0.5]
        });
      });
      return this;
    });
    const { id, name, shapes: shapes2 = [], bindings = [] } = props;
    this.id = id;
    this.name = name;
    this.bindings = bindings;
    this.app = app;
    this.addShapes(...shapes2);
    makeObservable(this);
  }
  get serialized() {
    return {
      id: this.id,
      name: this.name,
      shapes: this.shapes.map((shape) => shape.serialized),
      bindings: this.bindings.map((binding) => __spreadValues2({}, binding)),
      nonce: this.nonce
    };
  }
  update(props) {
    Object.assign(this, props);
    return this;
  }
  addShapes(...shapes2) {
    if (shapes2.length === 0)
      return;
    const shapeInstances = "getBounds" in shapes2[0] ? shapes2 : shapes2.map((shape) => {
      const ShapeClass = this.app.getShapeClass(shape.type);
      return new ShapeClass(shape);
    });
    shapeInstances.forEach((instance) => observe(instance, this.app.saveState));
    this.shapes.push(...shapeInstances);
    this.bump();
    this.app.saveState();
    return shapeInstances;
  }
  parseShapesArg(shapes2) {
    if (typeof shapes2[0] === "string") {
      return this.shapes.filter((shape) => shapes2.includes(shape.id));
    } else {
      return shapes2;
    }
  }
  removeShapes(...shapes2) {
    const shapeInstances = this.parseShapesArg(shapes2);
    this.shapes = this.shapes.filter((shape) => !shapeInstances.includes(shape));
    return shapeInstances;
  }
};
__decorateClass2([
  observable
], TLPage.prototype, "id", 2);
__decorateClass2([
  observable
], TLPage.prototype, "name", 2);
__decorateClass2([
  observable
], TLPage.prototype, "shapes", 2);
__decorateClass2([
  observable
], TLPage.prototype, "bindings", 2);
__decorateClass2([
  computed
], TLPage.prototype, "serialized", 1);
__decorateClass2([
  action
], TLPage.prototype, "update", 1);
__decorateClass2([
  action
], TLPage.prototype, "addShapes", 1);
__decorateClass2([
  action
], TLPage.prototype, "removeShapes", 1);
__decorateClass2([
  action
], TLPage.prototype, "bringForward", 2);
__decorateClass2([
  action
], TLPage.prototype, "sendBackward", 2);
__decorateClass2([
  action
], TLPage.prototype, "bringToFront", 2);
__decorateClass2([
  action
], TLPage.prototype, "sendToBack", 2);
var TLBush = class extends import_rbush.default {
  constructor() {
    super(...arguments);
    __publicField3(this, "toBBox", (shape) => shape.rotatedBounds);
  }
};
var TLInputs = class {
  constructor() {
    __publicField3(this, "shiftKey", false);
    __publicField3(this, "ctrlKey", false);
    __publicField3(this, "altKey", false);
    __publicField3(this, "spaceKey", false);
    __publicField3(this, "isPinching", false);
    __publicField3(this, "currentScreenPoint", [0, 0]);
    __publicField3(this, "currentPoint", [0, 0]);
    __publicField3(this, "previousScreenPoint", [0, 0]);
    __publicField3(this, "previousPoint", [0, 0]);
    __publicField3(this, "originScreenPoint", [0, 0]);
    __publicField3(this, "originPoint", [0, 0]);
    __publicField3(this, "pointerIds", /* @__PURE__ */ new Set());
    __publicField3(this, "state", "idle");
    __publicField3(this, "onWheel", (pagePoint, event) => {
      this.updateModifiers(event);
      this.previousPoint = this.currentPoint;
      this.currentPoint = pagePoint;
    });
    __publicField3(this, "onPointerDown", (pagePoint, event) => {
      this.pointerIds.add(event.pointerId);
      this.updateModifiers(event);
      this.originScreenPoint = this.currentScreenPoint;
      this.originPoint = pagePoint;
      this.state = "pointing";
    });
    __publicField3(this, "onPointerMove", (pagePoint, event) => {
      if (this.state === "pinching")
        return;
      this.updateModifiers(event);
      this.previousPoint = this.currentPoint;
      this.currentPoint = pagePoint;
    });
    __publicField3(this, "onPointerUp", (pagePoint, event) => {
      this.pointerIds.clear();
      this.updateModifiers(event);
      this.state = "idle";
    });
    __publicField3(this, "onKeyDown", (event) => {
      this.updateModifiers(event);
      switch (event.key) {
        case " ": {
          this.spaceKey = true;
          break;
        }
      }
    });
    __publicField3(this, "onKeyUp", (event) => {
      this.updateModifiers(event);
      switch (event.key) {
        case " ": {
          this.spaceKey = false;
          break;
        }
      }
    });
    __publicField3(this, "onPinchStart", (pagePoint, event) => {
      this.updateModifiers(event);
      this.state = "pinching";
    });
    __publicField3(this, "onPinch", (pagePoint, event) => {
      if (this.state !== "pinching")
        return;
      this.updateModifiers(event);
    });
    __publicField3(this, "onPinchEnd", (pagePoint, event) => {
      if (this.state !== "pinching")
        return;
      this.updateModifiers(event);
      this.state = "idle";
    });
    makeObservable(this);
  }
  updateModifiers(event) {
    if ("clientX" in event) {
      this.previousScreenPoint = this.currentScreenPoint;
      this.currentScreenPoint = [event.clientX, event.clientY];
    }
    if ("shiftKey" in event) {
      this.shiftKey = event.shiftKey;
      this.ctrlKey = event.metaKey || event.ctrlKey;
      this.altKey = event.altKey;
    }
  }
};
__decorateClass2([
  observable
], TLInputs.prototype, "shiftKey", 2);
__decorateClass2([
  observable
], TLInputs.prototype, "ctrlKey", 2);
__decorateClass2([
  observable
], TLInputs.prototype, "altKey", 2);
__decorateClass2([
  observable
], TLInputs.prototype, "spaceKey", 2);
__decorateClass2([
  observable
], TLInputs.prototype, "isPinching", 2);
__decorateClass2([
  observable
], TLInputs.prototype, "currentScreenPoint", 2);
__decorateClass2([
  observable
], TLInputs.prototype, "currentPoint", 2);
__decorateClass2([
  observable
], TLInputs.prototype, "previousScreenPoint", 2);
__decorateClass2([
  observable
], TLInputs.prototype, "previousPoint", 2);
__decorateClass2([
  observable
], TLInputs.prototype, "originScreenPoint", 2);
__decorateClass2([
  observable
], TLInputs.prototype, "originPoint", 2);
__decorateClass2([
  observable
], TLInputs.prototype, "state", 2);
__decorateClass2([
  action
], TLInputs.prototype, "updateModifiers", 1);
__decorateClass2([
  action
], TLInputs.prototype, "onWheel", 2);
__decorateClass2([
  action
], TLInputs.prototype, "onPointerDown", 2);
__decorateClass2([
  action
], TLInputs.prototype, "onPointerMove", 2);
__decorateClass2([
  action
], TLInputs.prototype, "onPointerUp", 2);
__decorateClass2([
  action
], TLInputs.prototype, "onKeyDown", 2);
__decorateClass2([
  action
], TLInputs.prototype, "onKeyUp", 2);
__decorateClass2([
  action
], TLInputs.prototype, "onPinchStart", 2);
__decorateClass2([
  action
], TLInputs.prototype, "onPinch", 2);
__decorateClass2([
  action
], TLInputs.prototype, "onPinchEnd", 2);
var TLViewport = class {
  constructor() {
    __publicField3(this, "minZoom", 0.1);
    __publicField3(this, "maxZoom", 8);
    __publicField3(this, "zooms", [0.1, 0.25, 0.5, 1, 2, 4, 8]);
    __publicField3(this, "bounds", {
      minX: 0,
      minY: 0,
      maxX: 1080,
      maxY: 720,
      width: 1080,
      height: 720
    });
    __publicField3(this, "camera", {
      point: [0, 0],
      zoom: 1
    });
    __publicField3(this, "updateBounds", (bounds) => {
      this.bounds = bounds;
      return this;
    });
    __publicField3(this, "panCamera", (delta) => {
      return this.update({
        point: Vec.sub(this.camera.point, Vec.div(delta, this.camera.zoom))
      });
    });
    __publicField3(this, "update", ({ point, zoom }) => {
      if (point !== void 0)
        this.camera.point = point;
      if (zoom !== void 0)
        this.camera.zoom = zoom;
      return this;
    });
    __publicField3(this, "_currentView", {
      minX: 0,
      minY: 0,
      maxX: 1,
      maxY: 1,
      width: 1,
      height: 1
    });
    __publicField3(this, "getPagePoint", (point) => {
      const { camera, bounds } = this;
      return Vec.sub(Vec.div(Vec.sub(point, [bounds.minX, bounds.minY]), camera.zoom), camera.point);
    });
    __publicField3(this, "getScreenPoint", (point) => {
      const { camera } = this;
      return Vec.mul(Vec.add(point, camera.point), camera.zoom);
    });
    __publicField3(this, "zoomIn", () => {
      const { camera, bounds, zooms } = this;
      let zoom;
      for (let i = 1; i < zooms.length; i++) {
        const z1 = zooms[i - 1];
        const z2 = zooms[i];
        if (z2 - camera.zoom <= (z2 - z1) / 2)
          continue;
        zoom = z2;
        break;
      }
      if (zoom === void 0)
        zoom = zooms[zooms.length - 1];
      const center = [bounds.width / 2, bounds.height / 2];
      const p0 = Vec.sub(Vec.div(center, camera.zoom), center);
      const p1 = Vec.sub(Vec.div(center, zoom), center);
      return this.update({ point: Vec.toFixed(Vec.add(camera.point, Vec.sub(p1, p0))), zoom });
    });
    __publicField3(this, "zoomOut", () => {
      const { camera, bounds, zooms } = this;
      let zoom;
      for (let i = zooms.length - 1; i > 0; i--) {
        const z1 = zooms[i - 1];
        const z2 = zooms[i];
        if (z2 - camera.zoom >= (z2 - z1) / 2)
          continue;
        zoom = z1;
        break;
      }
      if (zoom === void 0)
        zoom = zooms[0];
      const center = [bounds.width / 2, bounds.height / 2];
      const p0 = Vec.sub(Vec.div(center, camera.zoom), center);
      const p1 = Vec.sub(Vec.div(center, zoom), center);
      return this.update({ point: Vec.toFixed(Vec.add(camera.point, Vec.sub(p1, p0))), zoom });
    });
    __publicField3(this, "resetZoom", () => {
      const {
        bounds,
        camera: { zoom, point }
      } = this;
      const center = [bounds.width / 2, bounds.height / 2];
      const p0 = Vec.sub(Vec.div(center, zoom), point);
      const p1 = Vec.sub(Vec.div(center, 1), point);
      return this.update({ point: Vec.toFixed(Vec.add(point, Vec.sub(p1, p0))), zoom: 1 });
    });
    __publicField3(this, "zoomToBounds", ({ width, height, minX, minY }) => {
      const { bounds, camera } = this;
      let zoom = Math.min((bounds.width - FIT_TO_SCREEN_PADDING) / width, (bounds.height - FIT_TO_SCREEN_PADDING) / height);
      zoom = Math.min(this.maxZoom, Math.max(this.minZoom, camera.zoom === zoom || camera.zoom < 1 ? Math.min(1, zoom) : zoom));
      const delta = [
        (bounds.width - width * zoom) / 2 / zoom,
        (bounds.height - height * zoom) / 2 / zoom
      ];
      return this.update({ point: Vec.add([-minX, -minY], delta), zoom });
    });
    makeObservable(this);
  }
  get currentView() {
    const {
      bounds,
      camera: { point, zoom }
    } = this;
    const w = bounds.width / zoom;
    const h = bounds.height / zoom;
    return {
      minX: -point[0],
      minY: -point[1],
      maxX: w - point[0],
      maxY: h - point[1],
      width: w,
      height: h
    };
  }
};
__decorateClass2([
  observable
], TLViewport.prototype, "bounds", 2);
__decorateClass2([
  observable
], TLViewport.prototype, "camera", 2);
__decorateClass2([
  action
], TLViewport.prototype, "updateBounds", 2);
__decorateClass2([
  action
], TLViewport.prototype, "update", 2);
__decorateClass2([
  computed
], TLViewport.prototype, "currentView", 1);
var TLHistory = class {
  constructor(app) {
    __publicField3(this, "app");
    __publicField3(this, "stack", []);
    __publicField3(this, "pointer", 0);
    __publicField3(this, "isPaused", true);
    __publicField3(this, "pause", () => {
      if (this.isPaused)
        return;
      this.isPaused = true;
    });
    __publicField3(this, "resume", () => {
      if (!this.isPaused)
        return;
      this.isPaused = false;
    });
    __publicField3(this, "reset", () => {
      this.stack = [this.app.serialized];
      this.pointer = 0;
      this.resume();
      this.app.notify("persist", null);
    });
    __publicField3(this, "persist", () => {
      if (this.isPaused)
        return;
      const { serialized } = this.app;
      if (this.pointer < this.stack.length) {
        this.stack = this.stack.slice(0, this.pointer + 1);
      }
      this.stack.push(serialized);
      this.pointer = this.stack.length - 1;
      this.app.notify("persist", null);
    });
    __publicField3(this, "undo", () => {
      if (this.isPaused)
        return;
      if (this.app.selectedTool.currentState.id !== "idle")
        return;
      if (this.pointer > 0) {
        this.pointer--;
        const snapshot = this.stack[this.pointer];
        this.deserialize(snapshot);
      }
      this.app.notify("persist", null);
    });
    __publicField3(this, "redo", () => {
      if (this.isPaused)
        return;
      if (this.app.selectedTool.currentState.id !== "idle")
        return;
      if (this.pointer < this.stack.length - 1) {
        this.pointer++;
        const snapshot = this.stack[this.pointer];
        this.deserialize(snapshot);
      }
      this.app.notify("persist", null);
    });
    __publicField3(this, "deserialize", (snapshot) => {
      const { currentPageId, selectedIds, pages } = snapshot;
      const wasPaused = this.isPaused;
      this.pause();
      try {
        const pagesMap = new Map(this.app.pages);
        const pagesToAdd = [];
        for (const serializedPage of pages) {
          const page = pagesMap.get(serializedPage.id);
          if (page !== void 0) {
            const shapesMap = new Map(page.shapes.map((shape) => [shape.props.id, shape]));
            const shapesToAdd = [];
            for (const serializedShape of serializedPage.shapes) {
              const shape = shapesMap.get(serializedShape.id);
              if (shape !== void 0) {
                if (shape.nonce !== serializedShape.nonce) {
                  shape.update(serializedShape, true);
                }
                shapesMap.delete(serializedShape.id);
              } else {
                const ShapeClass = this.app.getShapeClass(serializedShape.type);
                shapesToAdd.push(new ShapeClass(serializedShape));
              }
            }
            if (shapesMap.size > 0)
              page.removeShapes(...shapesMap.values());
            if (shapesToAdd.length > 0)
              page.addShapes(...shapesToAdd);
            pagesMap.delete(serializedPage.id);
          } else {
            const { id, name, shapes: shapes2, bindings } = serializedPage;
            pagesToAdd.push(new TLPage(this.app, {
              id,
              name,
              bindings,
              shapes: shapes2.map((serializedShape) => {
                const ShapeClass = this.app.getShapeClass(serializedShape.type);
                return new ShapeClass(serializedShape);
              })
            }));
          }
        }
        if (pagesMap.size > 0)
          this.app.removePages(Array.from(pagesMap.values()));
        if (pagesToAdd.length > 0)
          this.app.addPages(pagesToAdd);
        this.app.setCurrentPage(currentPageId).setSelectedShapes(selectedIds).setErasingShapes([]);
      } catch (e) {
        console.warn(e);
      }
      if (!wasPaused)
        this.resume();
    });
    this.app = app;
  }
};
var TLSettings = class {
  constructor() {
    __publicField3(this, "mode", "light");
    __publicField3(this, "showGrid", false);
    __publicField3(this, "isToolLocked", false);
    makeObservable(this);
  }
  update(props) {
    Object.assign(this, props);
  }
};
__decorateClass2([
  observable
], TLSettings.prototype, "mode", 2);
__decorateClass2([
  observable
], TLSettings.prototype, "showGrid", 2);
__decorateClass2([
  observable
], TLSettings.prototype, "isToolLocked", 2);
__decorateClass2([
  action
], TLSettings.prototype, "update", 1);
var TLApi = class {
  constructor(app) {
    __publicField3(this, "app");
    __publicField3(this, "changePage", (page) => {
      this.app.setCurrentPage(page);
      return this;
    });
    __publicField3(this, "hoverShape", (shape) => {
      this.app.setHoveredShape(shape);
      return this;
    });
    __publicField3(this, "createShapes", (...shapes2) => {
      this.app.createShapes(shapes2);
      return this;
    });
    __publicField3(this, "updateShapes", (...shapes2) => {
      this.app.updateShapes(shapes2);
      return this;
    });
    __publicField3(this, "deleteShapes", (...shapes2) => {
      this.app.deleteShapes(shapes2.length ? shapes2 : this.app.selectedShapesArray);
      return this;
    });
    __publicField3(this, "selectShapes", (...shapes2) => {
      this.app.setSelectedShapes(shapes2);
      return this;
    });
    __publicField3(this, "deselectShapes", (...shapes2) => {
      const ids = typeof shapes2[0] === "string" ? shapes2 : shapes2.map((shape) => shape.id);
      this.app.setSelectedShapes(this.app.selectedShapesArray.filter((shape) => !ids.includes(shape.id)));
      return this;
    });
    __publicField3(this, "flipHorizontal", (...shapes2) => {
      this.app.flipHorizontal(shapes2);
      return this;
    });
    __publicField3(this, "flipVertical", (...shapes2) => {
      this.app.flipVertical(shapes2);
      return this;
    });
    __publicField3(this, "selectAll", () => {
      this.app.setSelectedShapes(this.app.currentPage.shapes);
      return this;
    });
    __publicField3(this, "deselectAll", () => {
      this.app.setSelectedShapes([]);
      return this;
    });
    __publicField3(this, "zoomIn", () => {
      this.app.viewport.zoomIn();
      return this;
    });
    __publicField3(this, "zoomOut", () => {
      this.app.viewport.zoomOut();
      return this;
    });
    __publicField3(this, "resetZoom", () => {
      this.app.viewport.resetZoom();
      return this;
    });
    __publicField3(this, "zoomToFit", () => {
      const { shapes: shapes2 } = this.app.currentPage;
      if (shapes2.length === 0)
        return this;
      const commonBounds = BoundsUtils.getCommonBounds(shapes2.map((shape) => shape.bounds));
      this.app.viewport.zoomToBounds(commonBounds);
      return this;
    });
    __publicField3(this, "zoomToSelection", () => {
      const { selectionBounds } = this.app;
      if (!selectionBounds)
        return this;
      this.app.viewport.zoomToBounds(selectionBounds);
      return this;
    });
    __publicField3(this, "toggleGrid", () => {
      const { settings } = this.app;
      settings.update({ showGrid: !settings.showGrid });
      return this;
    });
    __publicField3(this, "toggleToolLock", () => {
      const { settings } = this.app;
      settings.update({ showGrid: !settings.isToolLocked });
      return this;
    });
    __publicField3(this, "save", () => {
      this.app.save();
      return this;
    });
    __publicField3(this, "saveAs", () => {
      this.app.save();
      return this;
    });
    this.app = app;
  }
};
var TLCursors = class {
  constructor() {
    __publicField3(this, "cursor", "default");
    __publicField3(this, "rotation", 0);
    __publicField3(this, "reset", () => {
      this.cursor = "default";
    });
    __publicField3(this, "setCursor", (cursor, rotation = 0) => {
      if (cursor === this.cursor && rotation === this.rotation)
        return;
      this.cursor = cursor;
      this.rotation = rotation;
    });
    __publicField3(this, "setRotation", (rotation) => {
      if (rotation === this.rotation)
        return;
      this.rotation = rotation;
    });
    makeObservable(this);
  }
};
__decorateClass2([
  observable
], TLCursors.prototype, "cursor", 2);
__decorateClass2([
  observable
], TLCursors.prototype, "rotation", 2);
__decorateClass2([
  action
], TLCursors.prototype, "reset", 2);
__decorateClass2([
  action
], TLCursors.prototype, "setCursor", 2);
__decorateClass2([
  action
], TLCursors.prototype, "setRotation", 2);
var TLApp41 = class extends TLRootState {
  constructor(serializedApp, Shapes, Tools) {
    var _a2, _b;
    super();
    __publicField3(this, "api");
    __publicField3(this, "inputs", new TLInputs());
    __publicField3(this, "cursors", new TLCursors());
    __publicField3(this, "viewport", new TLViewport());
    __publicField3(this, "settings", new TLSettings());
    __publicField3(this, "history", new TLHistory(this));
    __publicField3(this, "persist", this.history.persist);
    __publicField3(this, "undo", this.history.undo);
    __publicField3(this, "redo", this.history.redo);
    __publicField3(this, "saving", false);
    __publicField3(this, "saveState", () => {
      if (this.history.isPaused)
        return;
      this.saving = true;
      requestAnimationFrame(() => {
        if (this.saving) {
          this.persist();
          this.saving = false;
        }
      });
    });
    __publicField3(this, "load", () => {
      this.notify("load", null);
      return this;
    });
    __publicField3(this, "save", () => {
      this.notify("save", null);
      return this;
    });
    __publicField3(this, "saveAs", () => {
      this.notify("saveAs", null);
      return this;
    });
    __publicField3(this, "pages", /* @__PURE__ */ new Map([
      ["page", new TLPage(this, { id: "page", name: "page", shapes: [], bindings: [] })]
    ]));
    __publicField3(this, "currentPageId", "page");
    __publicField3(this, "getPageById", (pageId) => {
      const page = this.pages.get(pageId);
      if (!page)
        throw Error(`Could not find a page named ${pageId}.`);
      return page;
    });
    __publicField3(this, "getShapeById", (id, pageId = this.currentPage.id) => {
      var _a3;
      const shape = (_a3 = this.getPageById(pageId)) == null ? void 0 : _a3.shapes.find((shape2) => shape2.id === id);
      if (!shape)
        throw Error(`Could not find that shape: ${id} on page ${pageId}`);
      return shape;
    });
    __publicField3(this, "createShapes", (shapes2) => {
      const newShapes = this.currentPage.addShapes(...shapes2);
      if (newShapes)
        this.notify("create-shapes", newShapes);
      this.persist();
      return this;
    });
    __publicField3(this, "updateShapes", (shapes2) => {
      shapes2.forEach((shape) => {
        var _a3;
        return (_a3 = this.getShapeById(shape.id)) == null ? void 0 : _a3.update(shape);
      });
      this.persist();
      return this;
    });
    __publicField3(this, "deleteShapes", (shapes2) => {
      if (shapes2.length === 0)
        return this;
      let ids;
      if (typeof shapes2[0] === "string") {
        ids = new Set(shapes2);
      } else {
        ids = new Set(shapes2.map((shape) => shape.id));
      }
      this.setSelectedShapes(this.selectedShapesArray.filter((shape) => !ids.has(shape.id)));
      const removedShapes = this.currentPage.removeShapes(...shapes2);
      if (removedShapes)
        this.notify("delete-shapes", removedShapes);
      this.persist();
      return this;
    });
    __publicField3(this, "bringForward", (shapes2 = this.selectedShapesArray) => {
      if (shapes2.length > 0)
        this.currentPage.bringForward(shapes2);
      return this;
    });
    __publicField3(this, "sendBackward", (shapes2 = this.selectedShapesArray) => {
      if (shapes2.length > 0)
        this.currentPage.sendBackward(shapes2);
      return this;
    });
    __publicField3(this, "sendToBack", (shapes2 = this.selectedShapesArray) => {
      if (shapes2.length > 0)
        this.currentPage.sendToBack(shapes2);
      return this;
    });
    __publicField3(this, "bringToFront", (shapes2 = this.selectedShapesArray) => {
      if (shapes2.length > 0)
        this.currentPage.bringToFront(shapes2);
      return this;
    });
    __publicField3(this, "flipHorizontal", (shapes2 = this.selectedShapesArray) => {
      this.currentPage.flip(shapes2, "horizontal");
      return this;
    });
    __publicField3(this, "flipVertical", (shapes2 = this.selectedShapesArray) => {
      this.currentPage.flip(shapes2, "vertical");
      return this;
    });
    __publicField3(this, "assets", {});
    __publicField3(this, "dropFiles", (files, point) => {
      this.notify("drop-files", {
        files: Array.from(files),
        point: point ? this.viewport.getPagePoint(point) : BoundsUtils.getBoundsCenter(this.viewport.currentView)
      });
      return void 0;
    });
    __publicField3(this, "selectTool", this.transition);
    __publicField3(this, "registerTools", this.registerStates);
    __publicField3(this, "editingId");
    __publicField3(this, "setEditingShape", (shape) => {
      this.editingId = typeof shape === "string" ? shape : shape == null ? void 0 : shape.id;
      return this;
    });
    __publicField3(this, "clearEditingShape", () => {
      return this.setEditingShape();
    });
    __publicField3(this, "hoveredId");
    __publicField3(this, "setHoveredShape", (shape) => {
      this.hoveredId = typeof shape === "string" ? shape : shape == null ? void 0 : shape.id;
      return this;
    });
    __publicField3(this, "selectedIds", /* @__PURE__ */ new Set());
    __publicField3(this, "selectedShapes", /* @__PURE__ */ new Set());
    __publicField3(this, "selectionRotation", 0);
    __publicField3(this, "setSelectedShapes", (shapes2) => {
      var _a3;
      const { selectedIds, selectedShapes } = this;
      selectedIds.clear();
      selectedShapes.clear();
      if (shapes2[0] && typeof shapes2[0] === "string") {
        ;
        shapes2.forEach((s) => selectedIds.add(s));
      } else {
        ;
        shapes2.forEach((s) => selectedIds.add(s.id));
      }
      const newSelectedShapes = this.currentPage.shapes.filter((shape) => selectedIds.has(shape.id));
      newSelectedShapes.forEach((s) => selectedShapes.add(s));
      if (newSelectedShapes.length === 1) {
        this.selectionRotation = (_a3 = newSelectedShapes[0].props.rotation) != null ? _a3 : 0;
      } else {
        this.selectionRotation = 0;
      }
      return this;
    });
    __publicField3(this, "erasingIds", /* @__PURE__ */ new Set());
    __publicField3(this, "erasingShapes", /* @__PURE__ */ new Set());
    __publicField3(this, "setErasingShapes", (shapes2) => {
      const { erasingIds, erasingShapes } = this;
      erasingIds.clear();
      erasingShapes.clear();
      if (shapes2[0] && typeof shapes2[0] === "string") {
        ;
        shapes2.forEach((s) => erasingIds.add(s));
      } else {
        ;
        shapes2.forEach((s) => erasingIds.add(s.id));
      }
      const newErasingShapes = this.currentPage.shapes.filter((shape) => erasingIds.has(shape.id));
      newErasingShapes.forEach((s) => erasingShapes.add(s));
      return this;
    });
    __publicField3(this, "brush");
    __publicField3(this, "setBrush", (brush) => {
      this.brush = brush;
      return this;
    });
    __publicField3(this, "setCamera", (point, zoom) => {
      this.viewport.update({ point, zoom });
      return this;
    });
    __publicField3(this, "getPagePoint", (point) => {
      const { camera } = this.viewport;
      return Vec.sub(Vec.div(point, camera.zoom), camera.point);
    });
    __publicField3(this, "getScreenPoint", (point) => {
      const { camera } = this.viewport;
      return Vec.mul(Vec.add(point, camera.point), camera.zoom);
    });
    __publicField3(this, "Shapes", /* @__PURE__ */ new Map());
    __publicField3(this, "registerShapes", (Shapes2) => {
      Shapes2.forEach((Shape17) => this.Shapes.set(Shape17.id, Shape17));
    });
    __publicField3(this, "deregisterShapes", (Shapes2) => {
      Shapes2.forEach((Shape17) => this.Shapes.delete(Shape17.id));
    });
    __publicField3(this, "getShapeClass", (type) => {
      if (!type)
        throw Error("No shape type provided.");
      const Shape17 = this.Shapes.get(type);
      if (!Shape17)
        throw Error(`Could not find shape class for ${type}`);
      return Shape17;
    });
    __publicField3(this, "subscriptions", /* @__PURE__ */ new Set([]));
    __publicField3(this, "subscribe", (event, callback) => {
      if (callback === void 0)
        throw Error("Callback is required.");
      const subscription = { event, callback };
      this.subscriptions.add(subscription);
      return () => this.unsubscribe(subscription);
    });
    __publicField3(this, "unsubscribe", (subscription) => {
      this.subscriptions.delete(subscription);
      return this;
    });
    __publicField3(this, "notify", (event, info) => {
      this.subscriptions.forEach((subscription) => {
        if (subscription.event === event) {
          subscription.callback(this, info);
        }
      });
      return this;
    });
    __publicField3(this, "onTransition", () => {
      this.settings.update({ isToolLocked: false });
    });
    __publicField3(this, "onWheel", (info, e) => {
      this.viewport.panCamera(info.delta);
      this.inputs.onWheel([...this.viewport.getPagePoint([e.clientX, e.clientY]), 0.5], e);
    });
    __publicField3(this, "onPointerDown", (info, e) => {
      if ("clientX" in e) {
        this.inputs.onPointerDown([...this.viewport.getPagePoint([e.clientX, e.clientY]), 0.5], e);
      }
    });
    __publicField3(this, "onPointerUp", (info, e) => {
      if ("clientX" in e) {
        this.inputs.onPointerUp([...this.viewport.getPagePoint([e.clientX, e.clientY]), 0.5], e);
      }
    });
    __publicField3(this, "onPointerMove", (info, e) => {
      if ("clientX" in e) {
        this.inputs.onPointerMove([...this.viewport.getPagePoint([e.clientX, e.clientY]), 0.5], e);
      }
    });
    __publicField3(this, "onKeyDown", (info, e) => {
      this.inputs.onKeyDown(e);
    });
    __publicField3(this, "onKeyUp", (info, e) => {
      this.inputs.onKeyUp(e);
    });
    __publicField3(this, "onPinchStart", (info, e) => {
      this.inputs.onPinchStart([...this.viewport.getPagePoint(info.point), 0.5], e);
    });
    __publicField3(this, "onPinch", (info, e) => {
      this.inputs.onPinch([...this.viewport.getPagePoint(info.point), 0.5], e);
    });
    __publicField3(this, "onPinchEnd", (info, e) => {
      this.inputs.onPinchEnd([...this.viewport.getPagePoint(info.point), 0.5], e);
    });
    this.history.pause();
    if (this.states && this.states.length > 0) {
      this.registerStates(this.states);
      const initialId = (_a2 = this.initial) != null ? _a2 : this.states[0].id;
      const state = this.children.get(initialId);
      if (state) {
        this.currentState = state;
        (_b = this.currentState) == null ? void 0 : _b._events.onEnter({ fromId: "initial" });
      }
    }
    if (Shapes)
      this.registerShapes(Shapes);
    if (Tools)
      this.registerTools(Tools);
    this.history.resume();
    if (serializedApp)
      this.history.deserialize(serializedApp);
    const ownShortcuts = [
      {
        keys: "mod+shift+g",
        fn: () => this.api.toggleGrid()
      },
      {
        keys: "shift+0",
        fn: () => this.api.resetZoom()
      },
      {
        keys: "mod+-",
        fn: () => this.api.zoomToSelection()
      },
      {
        keys: "mod+-",
        fn: () => this.api.zoomOut()
      },
      {
        keys: "mod+=",
        fn: () => this.api.zoomIn()
      },
      {
        keys: "mod+z",
        fn: () => this.undo()
      },
      {
        keys: "mod+shift+z",
        fn: () => this.redo()
      },
      {
        keys: "[",
        fn: () => this.sendBackward()
      },
      {
        keys: "shift+[",
        fn: () => this.sendToBack()
      },
      {
        keys: "]",
        fn: () => this.bringForward()
      },
      {
        keys: "shift+]",
        fn: () => this.bringToFront()
      },
      {
        keys: "mod+a",
        fn: () => {
          const { selectedTool } = this;
          if (selectedTool.currentState.id !== "idle")
            return;
          if (selectedTool.id !== "select") {
            this.selectTool("select");
          }
          this.api.selectAll();
        }
      },
      {
        keys: "mod+s",
        fn: () => {
          this.save();
          this.notify("save", null);
        }
      },
      {
        keys: "mod+shift+s",
        fn: () => {
          this.saveAs();
          this.notify("saveAs", null);
        }
      }
    ];
    const shortcuts = this.constructor["shortcuts"] || [];
    this._disposables.push(...[...ownShortcuts, ...shortcuts].map(({ keys, fn }) => {
      return KeyUtils.registerShortcut(keys, (e) => {
        fn(this, this, e);
      });
    }));
    this.api = new TLApi(this);
    makeObservable(this);
    this.notify("mount", null);
  }
  loadDocumentModel(model) {
    this.history.deserialize(model);
    if (model.assets)
      this.addAssets(model.assets);
    return this;
  }
  get serialized() {
    return {
      currentPageId: this.currentPageId,
      selectedIds: Array.from(this.selectedIds.values()),
      pages: Array.from(this.pages.values()).map((page) => page.serialized)
    };
  }
  get currentPage() {
    return this.getPageById(this.currentPageId);
  }
  setCurrentPage(page) {
    this.currentPageId = typeof page === "string" ? page : page.id;
    return this;
  }
  addPages(pages) {
    pages.forEach((page) => this.pages.set(page.id, page));
    this.persist();
    return this;
  }
  removePages(pages) {
    pages.forEach((page) => this.pages.delete(page.id));
    this.persist();
    return this;
  }
  addAssets(assets) {
    assets.forEach((asset) => this.assets[asset.id] = asset);
    this.persist();
    return this;
  }
  removeAssets(assets) {
    if (typeof assets[0] === "string")
      assets.forEach((asset) => delete this.assets[asset]);
    else
      assets.forEach((asset) => delete this.assets[asset.id]);
    this.persist();
    return this;
  }
  createAssets(assets) {
    this.addAssets(assets);
    this.notify("create-assets", { assets });
    this.persist();
    return this;
  }
  get selectedTool() {
    return this.currentState;
  }
  get editingShape() {
    const { editingId, currentPage } = this;
    return editingId ? currentPage.shapes.find((shape) => shape.id === editingId) : void 0;
  }
  get hoveredShape() {
    const { hoveredId, currentPage } = this;
    return hoveredId ? currentPage.shapes.find((shape) => shape.id === hoveredId) : void 0;
  }
  get selectedShapesArray() {
    const { selectedShapes, selectedTool } = this;
    const stateId = selectedTool.id;
    if (stateId !== "select")
      return [];
    return Array.from(selectedShapes.values());
  }
  setSelectionRotation(radians) {
    this.selectionRotation = radians;
  }
  get erasingShapesArray() {
    return Array.from(this.erasingShapes.values());
  }
  get shapes() {
    const {
      currentPage: { shapes: shapes2 }
    } = this;
    return Array.from(shapes2.values());
  }
  get shapesInViewport() {
    const {
      selectedShapes,
      currentPage,
      viewport: { currentView }
    } = this;
    return currentPage.shapes.filter((shape) => {
      return shape.props.parentId === currentPage.id && (!shape.canUnmount || selectedShapes.has(shape) || BoundsUtils.boundsContain(currentView, shape.rotatedBounds) || BoundsUtils.boundsCollide(currentView, shape.rotatedBounds));
    });
  }
  get selectionDirectionHint() {
    const {
      selectionBounds,
      viewport: { currentView }
    } = this;
    if (!selectionBounds || BoundsUtils.boundsContain(currentView, selectionBounds) || BoundsUtils.boundsCollide(currentView, selectionBounds)) {
      return;
    }
    const center = BoundsUtils.getBoundsCenter(selectionBounds);
    return Vec.clampV([
      (center[0] - currentView.minX - currentView.width / 2) / currentView.width,
      (center[1] - currentView.minY - currentView.height / 2) / currentView.height
    ], -1, 1);
  }
  get selectionBounds() {
    const { selectedShapesArray } = this;
    if (selectedShapesArray.length === 0)
      return void 0;
    if (selectedShapesArray.length === 1) {
      return __spreadProps2(__spreadValues2({}, selectedShapesArray[0].bounds), { rotation: selectedShapesArray[0].props.rotation });
    }
    return BoundsUtils.getCommonBounds(this.selectedShapesArray.map((shape) => shape.rotatedBounds));
  }
  get showSelection() {
    var _a2;
    const { selectedShapesArray } = this;
    return this.isIn("select") && (selectedShapesArray.length === 1 && !((_a2 = selectedShapesArray[0]) == null ? void 0 : _a2.hideSelection) || selectedShapesArray.length > 1);
  }
  get showSelectionDetail() {
    return this.isIn("select") && this.selectedShapes.size > 0 && !this.selectedShapesArray.every((shape) => shape.hideSelectionDetail);
  }
  get showSelectionRotation() {
    return this.showSelectionDetail && this.isInAny("select.rotating", "select.pointingRotateHandle");
  }
  get showContextBar() {
    const {
      selectedShapesArray,
      inputs: { ctrlKey }
    } = this;
    return !ctrlKey && this.isInAny("select.idle", "select.hoveringSelectionHandle") && selectedShapesArray.length > 0 && !selectedShapesArray.every((shape) => shape.hideContextBar);
  }
  get showRotateHandles() {
    const { selectedShapesArray } = this;
    return this.isInAny("select.idle", "select.hoveringSelectionHandle", "select.pointingRotateHandle", "select.pointingResizeHandle") && selectedShapesArray.length > 0 && !selectedShapesArray.every((shape) => shape.hideRotateHandle);
  }
  get showResizeHandles() {
    const { selectedShapesArray } = this;
    return this.isInAny("select.idle", "select.hoveringSelectionHandle", "select.pointingShape", "select.pointingSelectedShape", "select.pointingRotateHandle", "select.pointingResizeHandle") && selectedShapesArray.length > 0 && !selectedShapesArray.every((shape) => shape.hideResizeHandles);
  }
};
__publicField3(TLApp41, "id", "app");
__publicField3(TLApp41, "states", [TLSelectTool18]);
__publicField3(TLApp41, "initial", "select");
__decorateClass2([
  computed
], TLApp41.prototype, "serialized", 1);
__decorateClass2([
  observable
], TLApp41.prototype, "pages", 2);
__decorateClass2([
  observable
], TLApp41.prototype, "currentPageId", 2);
__decorateClass2([
  computed
], TLApp41.prototype, "currentPage", 1);
__decorateClass2([
  action
], TLApp41.prototype, "setCurrentPage", 1);
__decorateClass2([
  action
], TLApp41.prototype, "addPages", 1);
__decorateClass2([
  action
], TLApp41.prototype, "removePages", 1);
__decorateClass2([
  action
], TLApp41.prototype, "createShapes", 2);
__decorateClass2([
  action
], TLApp41.prototype, "updateShapes", 2);
__decorateClass2([
  action
], TLApp41.prototype, "deleteShapes", 2);
__decorateClass2([
  observable
], TLApp41.prototype, "assets", 2);
__decorateClass2([
  action
], TLApp41.prototype, "addAssets", 1);
__decorateClass2([
  action
], TLApp41.prototype, "removeAssets", 1);
__decorateClass2([
  computed
], TLApp41.prototype, "selectedTool", 1);
__decorateClass2([
  observable
], TLApp41.prototype, "editingId", 2);
__decorateClass2([
  computed
], TLApp41.prototype, "editingShape", 1);
__decorateClass2([
  action
], TLApp41.prototype, "setEditingShape", 2);
__decorateClass2([
  observable
], TLApp41.prototype, "hoveredId", 2);
__decorateClass2([
  computed
], TLApp41.prototype, "hoveredShape", 1);
__decorateClass2([
  action
], TLApp41.prototype, "setHoveredShape", 2);
__decorateClass2([
  observable
], TLApp41.prototype, "selectedIds", 2);
__decorateClass2([
  observable
], TLApp41.prototype, "selectedShapes", 2);
__decorateClass2([
  observable
], TLApp41.prototype, "selectionRotation", 2);
__decorateClass2([
  computed
], TLApp41.prototype, "selectedShapesArray", 1);
__decorateClass2([
  action
], TLApp41.prototype, "setSelectedShapes", 2);
__decorateClass2([
  action
], TLApp41.prototype, "setSelectionRotation", 1);
__decorateClass2([
  observable
], TLApp41.prototype, "erasingIds", 2);
__decorateClass2([
  observable
], TLApp41.prototype, "erasingShapes", 2);
__decorateClass2([
  computed
], TLApp41.prototype, "erasingShapesArray", 1);
__decorateClass2([
  action
], TLApp41.prototype, "setErasingShapes", 2);
__decorateClass2([
  observable
], TLApp41.prototype, "brush", 2);
__decorateClass2([
  action
], TLApp41.prototype, "setBrush", 2);
__decorateClass2([
  action
], TLApp41.prototype, "setCamera", 2);
__decorateClass2([
  computed
], TLApp41.prototype, "shapes", 1);
__decorateClass2([
  computed
], TLApp41.prototype, "shapesInViewport", 1);
__decorateClass2([
  computed
], TLApp41.prototype, "selectionDirectionHint", 1);
__decorateClass2([
  computed
], TLApp41.prototype, "selectionBounds", 1);
__decorateClass2([
  computed
], TLApp41.prototype, "showSelection", 1);
__decorateClass2([
  computed
], TLApp41.prototype, "showSelectionDetail", 1);
__decorateClass2([
  computed
], TLApp41.prototype, "showSelectionRotation", 1);
__decorateClass2([
  computed
], TLApp41.prototype, "showContextBar", 1);
__decorateClass2([
  computed
], TLApp41.prototype, "showRotateHandles", 1);
__decorateClass2([
  computed
], TLApp41.prototype, "showResizeHandles", 1);

// ../../packages/react/dist/esm/index.js
import * as React3 from "react";
import * as React22 from "react";

// ../../node_modules/mobx-react-lite/es/utils/assertEnvironment.js
import { useState } from "react";
if (!useState) {
  throw new Error("mobx-react-lite requires React with Hooks support");
}
if (!makeObservable) {
  throw new Error("mobx-react-lite@3 requires mobx at least version 6 to be available");
}

// ../../node_modules/mobx-react-lite/es/utils/reactBatchedUpdates.js
import { unstable_batchedUpdates } from "react-dom";

// ../../node_modules/mobx-react-lite/es/utils/observerBatching.js
function defaultNoopBatch(callback) {
  callback();
}
function observerBatching(reactionScheduler3) {
  if (!reactionScheduler3) {
    reactionScheduler3 = defaultNoopBatch;
    if (true) {
      console.warn("[MobX] Failed to get unstable_batched updates from react-dom / react-native");
    }
  }
  configure({ reactionScheduler: reactionScheduler3 });
}

// ../../node_modules/mobx-react-lite/es/useObserver.js
import React from "react";

// ../../node_modules/mobx-react-lite/es/utils/printDebugValue.js
function printDebugValue(v) {
  return getDependencyTree(v);
}

// ../../node_modules/mobx-react-lite/es/utils/FinalizationRegistryWrapper.js
var FinalizationRegistryLocal = typeof FinalizationRegistry === "undefined" ? void 0 : FinalizationRegistry;

// ../../node_modules/mobx-react-lite/es/utils/reactionCleanupTrackingCommon.js
function createTrackingData(reaction) {
  var trackingData = {
    reaction,
    mounted: false,
    changedBeforeMount: false,
    cleanAt: Date.now() + CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS
  };
  return trackingData;
}
var CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS = 1e4;
var CLEANUP_TIMER_LOOP_MILLIS = 1e4;

// ../../node_modules/mobx-react-lite/es/utils/createReactionCleanupTrackingUsingFinalizationRegister.js
function createReactionCleanupTrackingUsingFinalizationRegister(FinalizationRegistry2) {
  var cleanupTokenToReactionTrackingMap = /* @__PURE__ */ new Map();
  var globalCleanupTokensCounter = 1;
  var registry = new FinalizationRegistry2(function cleanupFunction(token) {
    var trackedReaction = cleanupTokenToReactionTrackingMap.get(token);
    if (trackedReaction) {
      trackedReaction.reaction.dispose();
      cleanupTokenToReactionTrackingMap.delete(token);
    }
  });
  return {
    addReactionToTrack: function(reactionTrackingRef, reaction, objectRetainedByReact) {
      var token = globalCleanupTokensCounter++;
      registry.register(objectRetainedByReact, token, reactionTrackingRef);
      reactionTrackingRef.current = createTrackingData(reaction);
      reactionTrackingRef.current.finalizationRegistryCleanupToken = token;
      cleanupTokenToReactionTrackingMap.set(token, reactionTrackingRef.current);
      return reactionTrackingRef.current;
    },
    recordReactionAsCommitted: function(reactionRef) {
      registry.unregister(reactionRef);
      if (reactionRef.current && reactionRef.current.finalizationRegistryCleanupToken) {
        cleanupTokenToReactionTrackingMap.delete(reactionRef.current.finalizationRegistryCleanupToken);
      }
    },
    forceCleanupTimerToRunNowForTests: function() {
    },
    resetCleanupScheduleForTests: function() {
    }
  };
}

// ../../node_modules/mobx-react-lite/es/utils/createTimerBasedReactionCleanupTracking.js
var __values = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
function createTimerBasedReactionCleanupTracking() {
  var uncommittedReactionRefs = /* @__PURE__ */ new Set();
  var reactionCleanupHandle;
  function forceCleanupTimerToRunNowForTests2() {
    if (reactionCleanupHandle) {
      clearTimeout(reactionCleanupHandle);
      cleanUncommittedReactions();
    }
  }
  function resetCleanupScheduleForTests2() {
    var e_1, _a2;
    if (uncommittedReactionRefs.size > 0) {
      try {
        for (var uncommittedReactionRefs_1 = __values(uncommittedReactionRefs), uncommittedReactionRefs_1_1 = uncommittedReactionRefs_1.next(); !uncommittedReactionRefs_1_1.done; uncommittedReactionRefs_1_1 = uncommittedReactionRefs_1.next()) {
          var ref = uncommittedReactionRefs_1_1.value;
          var tracking = ref.current;
          if (tracking) {
            tracking.reaction.dispose();
            ref.current = null;
          }
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (uncommittedReactionRefs_1_1 && !uncommittedReactionRefs_1_1.done && (_a2 = uncommittedReactionRefs_1.return))
            _a2.call(uncommittedReactionRefs_1);
        } finally {
          if (e_1)
            throw e_1.error;
        }
      }
      uncommittedReactionRefs.clear();
    }
    if (reactionCleanupHandle) {
      clearTimeout(reactionCleanupHandle);
      reactionCleanupHandle = void 0;
    }
  }
  function ensureCleanupTimerRunning() {
    if (reactionCleanupHandle === void 0) {
      reactionCleanupHandle = setTimeout(cleanUncommittedReactions, CLEANUP_TIMER_LOOP_MILLIS);
    }
  }
  function scheduleCleanupOfReactionIfLeaked(ref) {
    uncommittedReactionRefs.add(ref);
    ensureCleanupTimerRunning();
  }
  function recordReactionAsCommitted2(reactionRef) {
    uncommittedReactionRefs.delete(reactionRef);
  }
  function cleanUncommittedReactions() {
    reactionCleanupHandle = void 0;
    var now = Date.now();
    uncommittedReactionRefs.forEach(function(ref) {
      var tracking = ref.current;
      if (tracking) {
        if (now >= tracking.cleanAt) {
          tracking.reaction.dispose();
          ref.current = null;
          uncommittedReactionRefs.delete(ref);
        }
      }
    });
    if (uncommittedReactionRefs.size > 0) {
      ensureCleanupTimerRunning();
    }
  }
  return {
    addReactionToTrack: function(reactionTrackingRef, reaction, objectRetainedByReact) {
      reactionTrackingRef.current = createTrackingData(reaction);
      scheduleCleanupOfReactionIfLeaked(reactionTrackingRef);
      return reactionTrackingRef.current;
    },
    recordReactionAsCommitted: recordReactionAsCommitted2,
    forceCleanupTimerToRunNowForTests: forceCleanupTimerToRunNowForTests2,
    resetCleanupScheduleForTests: resetCleanupScheduleForTests2
  };
}

// ../../node_modules/mobx-react-lite/es/utils/reactionCleanupTracking.js
var _a = FinalizationRegistryLocal ? createReactionCleanupTrackingUsingFinalizationRegister(FinalizationRegistryLocal) : createTimerBasedReactionCleanupTracking();
var addReactionToTrack = _a.addReactionToTrack;
var recordReactionAsCommitted = _a.recordReactionAsCommitted;
var resetCleanupScheduleForTests = _a.resetCleanupScheduleForTests;
var forceCleanupTimerToRunNowForTests = _a.forceCleanupTimerToRunNowForTests;

// ../../node_modules/mobx-react-lite/es/staticRendering.js
var globalIsUsingStaticRendering = false;
function isUsingStaticRendering() {
  return globalIsUsingStaticRendering;
}

// ../../node_modules/mobx-react-lite/es/useObserver.js
var __read = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
function observerComponentNameFor(baseComponentName) {
  return "observer" + baseComponentName;
}
var ObjectToBeRetainedByReact = function() {
  function ObjectToBeRetainedByReact2() {
  }
  return ObjectToBeRetainedByReact2;
}();
function objectToBeRetainedByReactFactory() {
  return new ObjectToBeRetainedByReact();
}
function useObserver(fn, baseComponentName) {
  if (baseComponentName === void 0) {
    baseComponentName = "observed";
  }
  if (isUsingStaticRendering()) {
    return fn();
  }
  var _a2 = __read(React.useState(objectToBeRetainedByReactFactory), 1), objectRetainedByReact = _a2[0];
  var _b = __read(React.useState(), 2), setState = _b[1];
  var forceUpdate = function() {
    return setState([]);
  };
  var reactionTrackingRef = React.useRef(null);
  if (!reactionTrackingRef.current) {
    var newReaction = new Reaction(observerComponentNameFor(baseComponentName), function() {
      if (trackingData_1.mounted) {
        forceUpdate();
      } else {
        trackingData_1.changedBeforeMount = true;
      }
    });
    var trackingData_1 = addReactionToTrack(reactionTrackingRef, newReaction, objectRetainedByReact);
  }
  var reaction = reactionTrackingRef.current.reaction;
  React.useDebugValue(reaction, printDebugValue);
  React.useEffect(function() {
    recordReactionAsCommitted(reactionTrackingRef);
    if (reactionTrackingRef.current) {
      reactionTrackingRef.current.mounted = true;
      if (reactionTrackingRef.current.changedBeforeMount) {
        reactionTrackingRef.current.changedBeforeMount = false;
        forceUpdate();
      }
    } else {
      reactionTrackingRef.current = {
        reaction: new Reaction(observerComponentNameFor(baseComponentName), function() {
          forceUpdate();
        }),
        mounted: true,
        changedBeforeMount: false,
        cleanAt: Infinity
      };
      forceUpdate();
    }
    return function() {
      reactionTrackingRef.current.reaction.dispose();
      reactionTrackingRef.current = null;
    };
  }, []);
  var rendering;
  var exception;
  reaction.track(function() {
    try {
      rendering = fn();
    } catch (e) {
      exception = e;
    }
  });
  if (exception) {
    throw exception;
  }
  return rendering;
}

// ../../node_modules/mobx-react-lite/es/observer.js
import { forwardRef, memo } from "react";
var __assign = function() {
  __assign = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
function observer(baseComponent, options) {
  if (isUsingStaticRendering()) {
    return baseComponent;
  }
  var realOptions = __assign({ forwardRef: false }, options);
  var baseComponentName = baseComponent.displayName || baseComponent.name;
  var wrappedComponent = function(props, ref) {
    return useObserver(function() {
      return baseComponent(props, ref);
    }, baseComponentName);
  };
  wrappedComponent.displayName = baseComponentName;
  if (baseComponent.contextTypes) {
    wrappedComponent.contextTypes = baseComponent.contextTypes;
  }
  var memoComponent;
  if (realOptions.forwardRef) {
    memoComponent = memo(forwardRef(wrappedComponent));
  } else {
    memoComponent = memo(wrappedComponent);
  }
  copyStaticProperties(baseComponent, memoComponent);
  memoComponent.displayName = baseComponentName;
  if (true) {
    Object.defineProperty(memoComponent, "contextTypes", {
      set: function() {
        throw new Error("[mobx-react-lite] `" + (this.displayName || "Component") + ".contextTypes` must be set before applying `observer`.");
      }
    });
  }
  return memoComponent;
}
var hoistBlackList = {
  $$typeof: true,
  render: true,
  compare: true,
  type: true
};
function copyStaticProperties(base, target) {
  Object.keys(base).forEach(function(key) {
    if (!hoistBlackList[key]) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(base, key));
    }
  });
}

// ../../node_modules/mobx-react-lite/es/ObserverComponent.js
function ObserverComponent(_a2) {
  var children = _a2.children, render = _a2.render;
  var component = children || render;
  if (typeof component !== "function") {
    return null;
  }
  return useObserver(component);
}
if (true) {
  ObserverComponent.propTypes = {
    children: ObserverPropsCheck,
    render: ObserverPropsCheck
  };
}
ObserverComponent.displayName = "Observer";
function ObserverPropsCheck(props, key, componentName, location, propFullName) {
  var extraKey = key === "children" ? "render" : "children";
  var hasProp2 = typeof props[key] === "function";
  var hasExtraProp = typeof props[extraKey] === "function";
  if (hasProp2 && hasExtraProp) {
    return new Error("MobX Observer: Do not use children and render in the same time in`" + componentName);
  }
  if (hasProp2 || hasExtraProp) {
    return null;
  }
  return new Error("Invalid prop `" + propFullName + "` of type `" + typeof props[key] + "` supplied to `" + componentName + "`, expected `function`.");
}

// ../../node_modules/mobx-react-lite/es/useLocalObservable.js
import { useState as useState2 } from "react";

// ../../node_modules/mobx-react-lite/es/useLocalStore.js
import { useState as useState4 } from "react";

// ../../node_modules/mobx-react-lite/es/useAsObservableSource.js
import { useState as useState3 } from "react";

// ../../node_modules/mobx-react-lite/es/index.js
observerBatching(unstable_batchedUpdates);

// ../../packages/react/dist/esm/index.js
import * as React32 from "react";
import * as React4 from "react";
import * as React44 from "react";
import * as React5 from "react";
import * as React19 from "react";
import * as React6 from "react";
import * as React7 from "react";
import * as React8 from "react";
import * as React9 from "react";

// ../../node_modules/@use-gesture/core/dist/maths-b2a210f4.esm.js
function clamp(v, min, max) {
  return Math.max(min, Math.min(v, max));
}
var V = {
  toVector(v, fallback) {
    if (v === void 0)
      v = fallback;
    return Array.isArray(v) ? v : [v, v];
  },
  add(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1]];
  },
  sub(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1]];
  },
  addTo(v1, v2) {
    v1[0] += v2[0];
    v1[1] += v2[1];
  },
  subTo(v1, v2) {
    v1[0] -= v2[0];
    v1[1] -= v2[1];
  }
};
function rubberband(distance, dimension, constant) {
  if (dimension === 0 || Math.abs(dimension) === Infinity)
    return Math.pow(distance, constant * 5);
  return distance * dimension * constant / (dimension + constant * distance);
}
function rubberbandIfOutOfBounds(position, min, max, constant = 0.15) {
  if (constant === 0)
    return clamp(position, min, max);
  if (position < min)
    return -rubberband(min - position, max - min, constant) + min;
  if (position > max)
    return +rubberband(position - max, max - min, constant) + max;
  return position;
}
function computeRubberband(bounds, [Vx, Vy], [Rx, Ry]) {
  const [[X0, X1], [Y0, Y1]] = bounds;
  return [rubberbandIfOutOfBounds(Vx, X0, X1, Rx), rubberbandIfOutOfBounds(Vy, Y0, Y1, Ry)];
}

// ../../node_modules/@use-gesture/core/dist/actions-d9485484.esm.js
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function ownKeys3(object2, enumerableOnly) {
  var keys = Object.keys(object2);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object2);
    if (enumerableOnly) {
      symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object2, sym).enumerable;
      });
    }
    keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys3(Object(source), true).forEach(function(key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys3(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}
var EVENT_TYPE_MAP = {
  pointer: {
    start: "down",
    change: "move",
    end: "up"
  },
  mouse: {
    start: "down",
    change: "move",
    end: "up"
  },
  touch: {
    start: "start",
    change: "move",
    end: "end"
  },
  gesture: {
    start: "start",
    change: "change",
    end: "end"
  }
};
function capitalize(string) {
  if (!string)
    return "";
  return string[0].toUpperCase() + string.slice(1);
}
function toHandlerProp(device, action2 = "", capture = false) {
  const deviceProps = EVENT_TYPE_MAP[device];
  const actionKey = deviceProps ? deviceProps[action2] || action2 : action2;
  return "on" + capitalize(device) + capitalize(actionKey) + (capture ? "Capture" : "");
}
function toDomEventType(device, action2 = "") {
  const deviceProps = EVENT_TYPE_MAP[device];
  const actionKey = deviceProps ? deviceProps[action2] || action2 : action2;
  return device + actionKey;
}
function isTouch(event) {
  return "touches" in event;
}
function getCurrentTargetTouchList(event) {
  return Array.from(event.touches).filter((e) => {
    var _event$currentTarget, _event$currentTarget$;
    return e.target === event.currentTarget || ((_event$currentTarget = event.currentTarget) === null || _event$currentTarget === void 0 ? void 0 : (_event$currentTarget$ = _event$currentTarget.contains) === null || _event$currentTarget$ === void 0 ? void 0 : _event$currentTarget$.call(_event$currentTarget, e.target));
  });
}
function getTouchList(event) {
  return event.type === "touchend" ? event.changedTouches : event.targetTouches;
}
function getValueEvent(event) {
  return isTouch(event) ? getTouchList(event)[0] : event;
}
function distanceAngle(P1, P2) {
  const dx = P2.clientX - P1.clientX;
  const dy = P2.clientY - P1.clientY;
  const cx = (P2.clientX + P1.clientX) / 2;
  const cy = (P2.clientY + P1.clientY) / 2;
  const distance = Math.hypot(dx, dy);
  const angle = -(Math.atan2(dx, dy) * 180) / Math.PI;
  const origin = [cx, cy];
  return {
    angle,
    distance,
    origin
  };
}
function touchIds(event) {
  return getCurrentTargetTouchList(event).map((touch) => touch.identifier);
}
function touchDistanceAngle(event, ids) {
  const [P1, P2] = Array.from(event.touches).filter((touch) => ids.includes(touch.identifier));
  return distanceAngle(P1, P2);
}
function pointerId(event) {
  const valueEvent = getValueEvent(event);
  return isTouch(event) ? valueEvent.identifier : valueEvent.pointerId;
}
function pointerValues(event) {
  const valueEvent = getValueEvent(event);
  return [valueEvent.clientX, valueEvent.clientY];
}
var LINE_HEIGHT = 40;
var PAGE_HEIGHT = 800;
function wheelValues(event) {
  let {
    deltaX,
    deltaY,
    deltaMode
  } = event;
  if (deltaMode === 1) {
    deltaX *= LINE_HEIGHT;
    deltaY *= LINE_HEIGHT;
  } else if (deltaMode === 2) {
    deltaX *= PAGE_HEIGHT;
    deltaY *= PAGE_HEIGHT;
  }
  return [deltaX, deltaY];
}
function scrollValues(event) {
  var _ref, _ref2;
  const {
    scrollX,
    scrollY,
    scrollLeft,
    scrollTop
  } = event.currentTarget;
  return [(_ref = scrollX !== null && scrollX !== void 0 ? scrollX : scrollLeft) !== null && _ref !== void 0 ? _ref : 0, (_ref2 = scrollY !== null && scrollY !== void 0 ? scrollY : scrollTop) !== null && _ref2 !== void 0 ? _ref2 : 0];
}
function getEventDetails(event) {
  const payload = {};
  if ("buttons" in event)
    payload.buttons = event.buttons;
  if ("shiftKey" in event) {
    const {
      shiftKey,
      altKey,
      metaKey,
      ctrlKey
    } = event;
    Object.assign(payload, {
      shiftKey,
      altKey,
      metaKey,
      ctrlKey
    });
  }
  return payload;
}
function call(v, ...args) {
  if (typeof v === "function") {
    return v(...args);
  } else {
    return v;
  }
}
function noop3() {
}
function chain(...fns) {
  if (fns.length === 0)
    return noop3;
  if (fns.length === 1)
    return fns[0];
  return function() {
    let result;
    for (const fn of fns) {
      result = fn.apply(this, arguments) || result;
    }
    return result;
  };
}
function assignDefault(value, fallback) {
  return Object.assign({}, fallback, value || {});
}
var BEFORE_LAST_KINEMATICS_DELAY = 32;
var Engine = class {
  constructor(ctrl, args, key) {
    this.ctrl = ctrl;
    this.args = args;
    this.key = key;
    if (!this.state) {
      this.state = {
        values: [0, 0],
        initial: [0, 0]
      };
      if (this.init)
        this.init();
      this.reset();
    }
  }
  get state() {
    return this.ctrl.state[this.key];
  }
  set state(state) {
    this.ctrl.state[this.key] = state;
  }
  get shared() {
    return this.ctrl.state.shared;
  }
  get eventStore() {
    return this.ctrl.gestureEventStores[this.key];
  }
  get timeoutStore() {
    return this.ctrl.gestureTimeoutStores[this.key];
  }
  get config() {
    return this.ctrl.config[this.key];
  }
  get sharedConfig() {
    return this.ctrl.config.shared;
  }
  get handler() {
    return this.ctrl.handlers[this.key];
  }
  reset() {
    const {
      state,
      shared,
      config,
      ingKey,
      args
    } = this;
    const {
      transform,
      threshold
    } = config;
    shared[ingKey] = state._active = state.active = state._blocked = state._force = false;
    state._step = [false, false];
    state.intentional = false;
    state._movement = [0, 0];
    state._distance = [0, 0];
    state._delta = [0, 0];
    state._threshold = V.sub(transform(threshold), transform([0, 0])).map(Math.abs);
    state._bounds = [[-Infinity, Infinity], [-Infinity, Infinity]];
    state.args = args;
    state.axis = void 0;
    state.memo = void 0;
    state.elapsedTime = 0;
    state.direction = [0, 0];
    state.distance = [0, 0];
    state.velocity = [0, 0];
    state.movement = [0, 0];
    state.delta = [0, 0];
    state.timeStamp = 0;
  }
  start(event) {
    const state = this.state;
    const config = this.config;
    if (!state._active) {
      this.reset();
      state._active = true;
      state.target = event.target;
      state.currentTarget = event.currentTarget;
      state.initial = state.values;
      state.lastOffset = config.from ? call(config.from, state) : state.offset;
      state.offset = state.lastOffset;
    }
    state.startTime = state.timeStamp = event.timeStamp;
  }
  compute(event) {
    const {
      state,
      config,
      shared
    } = this;
    state.args = this.args;
    let dt = 0;
    if (event) {
      state.event = event;
      if (config.preventDefault && event.cancelable)
        state.event.preventDefault();
      state.type = event.type;
      shared.touches = this.ctrl.pointerIds.size || this.ctrl.touchIds.size;
      shared.locked = !!document.pointerLockElement;
      Object.assign(shared, getEventDetails(event));
      shared.down = shared.pressed = shared.buttons % 2 === 1 || shared.touches > 0;
      dt = event.timeStamp - state.timeStamp;
      state.timeStamp = event.timeStamp;
      state.elapsedTime = state.timeStamp - state.startTime;
    }
    if (state._active) {
      const _absoluteDelta = state._delta.map(Math.abs);
      V.addTo(state._distance, _absoluteDelta);
    }
    const [_m0, _m1] = config.transform(state._movement);
    if (true) {
      const isNumberAndNotNaN = (v) => typeof v === "number" && !Number.isNaN(v);
      if (!isNumberAndNotNaN(_m0) || !isNumberAndNotNaN(_m1)) {
        console.warn(`[@use-gesture]: config.transform() must produce a valid result, but it was: [${_m0},${_m1}]`);
      }
    }
    const [_t0, _t1] = state._threshold;
    let [_s0, _s1] = state._step;
    if (_s0 === false)
      _s0 = Math.abs(_m0) >= _t0 && Math.sign(_m0) * _t0;
    if (_s1 === false)
      _s1 = Math.abs(_m1) >= _t1 && Math.sign(_m1) * _t1;
    state.intentional = _s0 !== false || _s1 !== false;
    if (!state.intentional)
      return;
    state._step = [_s0, _s1];
    const movement = [0, 0];
    movement[0] = _s0 !== false ? _m0 - _s0 : 0;
    movement[1] = _s1 !== false ? _m1 - _s1 : 0;
    if (this.intent)
      this.intent(movement);
    if (state._active && !state._blocked || state.active) {
      state.first = state._active && !state.active;
      state.last = !state._active && state.active;
      state.active = shared[this.ingKey] = state._active;
      if (event) {
        if (state.first) {
          if ("bounds" in config)
            state._bounds = call(config.bounds, state);
          if (this.setup)
            this.setup();
        }
        state.movement = movement;
        const previousOffset = state.offset;
        this.computeOffset();
        if (!state.last || dt > BEFORE_LAST_KINEMATICS_DELAY) {
          state.delta = V.sub(state.offset, previousOffset);
          const absoluteDelta = state.delta.map(Math.abs);
          V.addTo(state.distance, absoluteDelta);
          state.direction = state.delta.map(Math.sign);
          if (!state.first && dt > 0) {
            state.velocity = [absoluteDelta[0] / dt, absoluteDelta[1] / dt];
          }
        }
      }
    }
    const rubberband2 = state._active ? config.rubberband || [0, 0] : [0, 0];
    state.offset = computeRubberband(state._bounds, state.offset, rubberband2);
    this.computeMovement();
  }
  emit() {
    const state = this.state;
    const shared = this.shared;
    const config = this.config;
    if (!state._active)
      this.clean();
    if ((state._blocked || !state.intentional) && !state._force && !config.triggerAllEvents)
      return;
    const memo3 = this.handler(_objectSpread2(_objectSpread2(_objectSpread2({}, shared), state), {}, {
      [this.aliasKey]: state.values
    }));
    if (memo3 !== void 0)
      state.memo = memo3;
  }
  clean() {
    this.eventStore.clean();
    this.timeoutStore.clean();
  }
};
function selectAxis([dx, dy]) {
  const d = Math.abs(dx) - Math.abs(dy);
  if (d > 0)
    return "x";
  if (d < 0)
    return "y";
  return void 0;
}
function restrictVectorToAxis(v, axis) {
  switch (axis) {
    case "x":
      v[1] = 0;
      break;
    case "y":
      v[0] = 0;
      break;
  }
}
var CoordinatesEngine = class extends Engine {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "aliasKey", "xy");
  }
  reset() {
    super.reset();
    this.state.axis = void 0;
  }
  init() {
    this.state.offset = [0, 0];
    this.state.lastOffset = [0, 0];
  }
  computeOffset() {
    this.state.offset = V.add(this.state.lastOffset, this.state.movement);
  }
  computeMovement() {
    this.state.movement = V.sub(this.state.offset, this.state.lastOffset);
  }
  intent(v) {
    this.state.axis = this.state.axis || selectAxis(v);
    this.state._blocked = (this.config.lockDirection || !!this.config.axis) && !this.state.axis || !!this.config.axis && this.config.axis !== this.state.axis;
    if (this.state._blocked)
      return;
    if (this.config.axis || this.config.lockDirection) {
      restrictVectorToAxis(v, this.state.axis);
    }
  }
};
var DEFAULT_RUBBERBAND = 0.15;
var commonConfigResolver = {
  enabled(value = true) {
    return value;
  },
  preventDefault(value = false) {
    return value;
  },
  triggerAllEvents(value = false) {
    return value;
  },
  rubberband(value = 0) {
    switch (value) {
      case true:
        return [DEFAULT_RUBBERBAND, DEFAULT_RUBBERBAND];
      case false:
        return [0, 0];
      default:
        return V.toVector(value);
    }
  },
  from(value) {
    if (typeof value === "function")
      return value;
    if (value != null)
      return V.toVector(value);
  },
  transform(value, _k, config) {
    return value || config.shared.transform;
  },
  threshold(value) {
    return V.toVector(value, 0);
  }
};
if (true) {
  Object.assign(commonConfigResolver, {
    domTarget(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`domTarget\` option has been renamed to \`target\`.`);
      }
    },
    lockDirection(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`lockDirection\` option has been merged with \`axis\`. Use it as in \`{ axis: 'lock' }\``);
      }
    },
    initial(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`initial\` option has been renamed to \`from\`.`);
      }
    }
  });
}
var coordinatesConfigResolver = _objectSpread2(_objectSpread2({}, commonConfigResolver), {}, {
  axis(_v, _k, {
    axis
  }) {
    this.lockDirection = axis === "lock";
    if (!this.lockDirection)
      return axis;
  },
  bounds(value = {}) {
    if (typeof value === "function") {
      return (state) => coordinatesConfigResolver.bounds(value(state));
    }
    if ("current" in value) {
      return () => value.current;
    }
    if (typeof HTMLElement === "function" && value instanceof HTMLElement) {
      return value;
    }
    const {
      left = -Infinity,
      right = Infinity,
      top = -Infinity,
      bottom = Infinity
    } = value;
    return [[left, right], [top, bottom]];
  }
});
var DISPLACEMENT = 10;
var KEYS_DELTA_MAP = {
  ArrowRight: (factor = 1) => [DISPLACEMENT * factor, 0],
  ArrowLeft: (factor = 1) => [-DISPLACEMENT * factor, 0],
  ArrowUp: (factor = 1) => [0, -DISPLACEMENT * factor],
  ArrowDown: (factor = 1) => [0, DISPLACEMENT * factor]
};
var DragEngine = class extends CoordinatesEngine {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "ingKey", "dragging");
  }
  reset() {
    super.reset();
    const state = this.state;
    state._pointerId = void 0;
    state._pointerActive = false;
    state._keyboardActive = false;
    state._preventScroll = false;
    state._delayed = false;
    state.swipe = [0, 0];
    state.tap = false;
    state.canceled = false;
    state.cancel = this.cancel.bind(this);
  }
  setup() {
    const state = this.state;
    if (state._bounds instanceof HTMLElement) {
      const boundRect = state._bounds.getBoundingClientRect();
      const targetRect = state.currentTarget.getBoundingClientRect();
      const _bounds = {
        left: boundRect.left - targetRect.left + state.offset[0],
        right: boundRect.right - targetRect.right + state.offset[0],
        top: boundRect.top - targetRect.top + state.offset[1],
        bottom: boundRect.bottom - targetRect.bottom + state.offset[1]
      };
      state._bounds = coordinatesConfigResolver.bounds(_bounds);
    }
  }
  cancel() {
    const state = this.state;
    if (state.canceled)
      return;
    state.canceled = true;
    state._active = false;
    setTimeout(() => {
      this.compute();
      this.emit();
    }, 0);
  }
  setActive() {
    this.state._active = this.state._pointerActive || this.state._keyboardActive;
  }
  clean() {
    this.pointerClean();
    this.state._pointerActive = false;
    this.state._keyboardActive = false;
    super.clean();
  }
  pointerDown(event) {
    const config = this.config;
    const state = this.state;
    if (event.buttons != null && (Array.isArray(config.pointerButtons) ? !config.pointerButtons.includes(event.buttons) : config.pointerButtons !== -1 && config.pointerButtons !== event.buttons))
      return;
    this.ctrl.setEventIds(event);
    if (config.pointerCapture) {
      event.target.setPointerCapture(event.pointerId);
    }
    if (state._pointerActive)
      return;
    this.start(event);
    this.setupPointer(event);
    state._pointerId = pointerId(event);
    state._pointerActive = true;
    state.values = pointerValues(event);
    state.initial = state.values;
    if (config.preventScroll) {
      this.setupScrollPrevention(event);
    } else if (config.delay > 0) {
      this.setupDelayTrigger(event);
    } else {
      this.startPointerDrag(event);
    }
  }
  startPointerDrag(event) {
    const state = this.state;
    state._active = true;
    state._preventScroll = true;
    state._delayed = false;
    this.compute(event);
    this.emit();
  }
  pointerMove(event) {
    const state = this.state;
    const config = this.config;
    if (!state._pointerActive)
      return;
    if (state.type === event.type && event.timeStamp === state.timeStamp)
      return;
    const id = pointerId(event);
    if (state._pointerId && id !== state._pointerId)
      return;
    const values = pointerValues(event);
    if (document.pointerLockElement === event.target) {
      state._delta = [event.movementX, event.movementY];
    } else {
      state._delta = V.sub(values, state.values);
      state.values = values;
    }
    V.addTo(state._movement, state._delta);
    this.compute(event);
    if (state._delayed) {
      this.timeoutStore.remove("dragDelay");
      state.active = false;
      this.startPointerDrag(event);
      return;
    }
    if (config.preventScroll && !state._preventScroll) {
      if (state.axis) {
        if (state.axis === config.preventScrollAxis || config.preventScrollAxis === "xy") {
          state._active = false;
          this.clean();
          return;
        } else {
          this.timeoutStore.remove("startPointerDrag");
          this.startPointerDrag(event);
          return;
        }
      } else {
        return;
      }
    }
    this.emit();
  }
  pointerUp(event) {
    this.ctrl.setEventIds(event);
    try {
      if (this.config.pointerCapture && event.target.hasPointerCapture(event.pointerId)) {
        ;
        event.target.releasePointerCapture(event.pointerId);
      }
    } catch (_unused) {
      if (true) {
        console.warn(`[@use-gesture]: If you see this message, it's likely that you're using an outdated version of \`@react-three/fiber\`. 

Please upgrade to the latest version.`);
      }
    }
    const state = this.state;
    const config = this.config;
    if (!state._pointerActive)
      return;
    const id = pointerId(event);
    if (state._pointerId && id !== state._pointerId)
      return;
    this.state._pointerActive = false;
    this.setActive();
    this.compute(event);
    const [dx, dy] = state._distance;
    state.tap = dx <= 3 && dy <= 3;
    if (state.tap && config.filterTaps) {
      state._force = true;
    } else {
      const [dirx, diry] = state.direction;
      const [vx, vy] = state.velocity;
      const [mx, my] = state.movement;
      const [svx, svy] = config.swipe.velocity;
      const [sx, sy] = config.swipe.distance;
      const sdt = config.swipe.duration;
      if (state.elapsedTime < sdt) {
        if (Math.abs(vx) > svx && Math.abs(mx) > sx)
          state.swipe[0] = dirx;
        if (Math.abs(vy) > svy && Math.abs(my) > sy)
          state.swipe[1] = diry;
      }
    }
    this.emit();
  }
  pointerClick(event) {
    if (!this.state.tap) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  setupPointer(event) {
    const config = this.config;
    let device = config.device;
    if (true) {
      try {
        if (device === "pointer") {
          const currentTarget = "uv" in event ? event.sourceEvent.currentTarget : event.currentTarget;
          const style = window.getComputedStyle(currentTarget);
          if (style.touchAction === "auto") {
            console.warn(`[@use-gesture]: The drag target has its \`touch-action\` style property set to \`auto\`. It is recommended to add \`touch-action: 'none'\` so that the drag gesture behaves correctly on touch-enabled devices. For more information read this: https://use-gesture.netlify.app/docs/extras/#touch-action.

This message will only show in development mode. It won't appear in production. If this is intended, you can ignore it.`, currentTarget);
          }
        }
      } catch (_unused2) {
      }
    }
    if (config.pointerLock) {
      event.currentTarget.requestPointerLock();
    }
    if (!config.pointerCapture) {
      this.eventStore.add(this.sharedConfig.window, device, "change", this.pointerMove.bind(this));
      this.eventStore.add(this.sharedConfig.window, device, "end", this.pointerUp.bind(this));
    }
  }
  pointerClean() {
    if (this.config.pointerLock && document.pointerLockElement === this.state.currentTarget) {
      document.exitPointerLock();
    }
  }
  preventScroll(event) {
    if (this.state._preventScroll && event.cancelable) {
      event.preventDefault();
    }
  }
  setupScrollPrevention(event) {
    persistEvent(event);
    this.eventStore.add(this.sharedConfig.window, "touch", "change", this.preventScroll.bind(this), {
      passive: false
    });
    this.eventStore.add(this.sharedConfig.window, "touch", "end", this.clean.bind(this), {
      passive: false
    });
    this.eventStore.add(this.sharedConfig.window, "touch", "cancel", this.clean.bind(this), {
      passive: false
    });
    this.timeoutStore.add("startPointerDrag", this.startPointerDrag.bind(this), this.config.preventScroll, event);
  }
  setupDelayTrigger(event) {
    this.state._delayed = true;
    this.timeoutStore.add("dragDelay", this.startPointerDrag.bind(this), this.config.delay, event);
  }
  keyDown(event) {
    const deltaFn = KEYS_DELTA_MAP[event.key];
    const state = this.state;
    if (deltaFn) {
      const factor = event.shiftKey ? 10 : event.altKey ? 0.1 : 1;
      state._delta = deltaFn(factor);
      this.start(event);
      state._keyboardActive = true;
      V.addTo(state._movement, state._delta);
      this.compute(event);
      this.emit();
    }
  }
  keyUp(event) {
    if (!(event.key in KEYS_DELTA_MAP))
      return;
    this.state._keyboardActive = false;
    this.setActive();
    this.compute(event);
    this.emit();
  }
  bind(bindFunction) {
    const device = this.config.device;
    bindFunction(device, "start", this.pointerDown.bind(this));
    if (this.config.pointerCapture) {
      bindFunction(device, "change", this.pointerMove.bind(this));
      bindFunction(device, "end", this.pointerUp.bind(this));
      bindFunction(device, "cancel", this.pointerUp.bind(this));
    }
    bindFunction("key", "down", this.keyDown.bind(this));
    bindFunction("key", "up", this.keyUp.bind(this));
    if (this.config.filterTaps) {
      bindFunction("click", "", this.pointerClick.bind(this), {
        capture: true
      });
    }
  }
};
function persistEvent(event) {
  "persist" in event && typeof event.persist === "function" && event.persist();
}
var isBrowser = typeof window !== "undefined" && window.document && window.document.createElement;
function supportsTouchEvents() {
  return isBrowser && "ontouchstart" in window;
}
function isTouchScreen() {
  return supportsTouchEvents() || isBrowser && window.navigator.maxTouchPoints > 1;
}
function supportsPointerEvents() {
  return isBrowser && "onpointerdown" in window;
}
function supportsPointerLock() {
  return isBrowser && "exitPointerLock" in window.document;
}
function supportsGestureEvents() {
  try {
    return "constructor" in GestureEvent;
  } catch (e) {
    return false;
  }
}
var SUPPORT = {
  isBrowser,
  gesture: supportsGestureEvents(),
  touch: supportsTouchEvents(),
  touchscreen: isTouchScreen(),
  pointer: supportsPointerEvents(),
  pointerLock: supportsPointerLock()
};
var DEFAULT_PREVENT_SCROLL_DELAY = 250;
var DEFAULT_DRAG_DELAY = 180;
var DEFAULT_SWIPE_VELOCITY = 0.5;
var DEFAULT_SWIPE_DISTANCE = 50;
var DEFAULT_SWIPE_DURATION = 250;
var dragConfigResolver = _objectSpread2(_objectSpread2({}, coordinatesConfigResolver), {}, {
  pointerLock(_v, _k, {
    pointer: {
      lock = false,
      touch = false
    } = {}
  }) {
    this.useTouch = SUPPORT.touch && touch;
    return SUPPORT.pointerLock && lock;
  },
  device(_v, _k) {
    if (this.useTouch)
      return "touch";
    if (this.pointerLock)
      return "mouse";
    if (SUPPORT.pointer)
      return "pointer";
    if (SUPPORT.touch)
      return "touch";
    return "mouse";
  },
  preventScroll(value = false, _k, {
    preventScrollAxis = "y"
  }) {
    if (preventScrollAxis)
      this.preventScrollAxis = preventScrollAxis;
    if (!SUPPORT.touchscreen)
      return false;
    if (typeof value === "number")
      return value;
    return value ? DEFAULT_PREVENT_SCROLL_DELAY : false;
  },
  pointerCapture(_v, _k, {
    pointer: {
      capture = true,
      buttons = 1
    } = {}
  }) {
    this.pointerButtons = buttons;
    return !this.pointerLock && this.device === "pointer" && capture;
  },
  threshold(value, _k, {
    filterTaps = false,
    axis = void 0
  }) {
    const threshold = V.toVector(value, filterTaps ? 3 : axis ? 1 : 0);
    this.filterTaps = filterTaps;
    return threshold;
  },
  swipe({
    velocity = DEFAULT_SWIPE_VELOCITY,
    distance = DEFAULT_SWIPE_DISTANCE,
    duration = DEFAULT_SWIPE_DURATION
  } = {}) {
    return {
      velocity: this.transform(V.toVector(velocity)),
      distance: this.transform(V.toVector(distance)),
      duration
    };
  },
  delay(value = 0) {
    switch (value) {
      case true:
        return DEFAULT_DRAG_DELAY;
      case false:
        return 0;
      default:
        return value;
    }
  }
});
if (true) {
  Object.assign(dragConfigResolver, {
    useTouch(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`useTouch\` option has been renamed to \`pointer.touch\`. Use it as in \`{ pointer: { touch: true } }\`.`);
      }
    },
    experimental_preventWindowScrollY(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`experimental_preventWindowScrollY\` option has been renamed to \`preventScroll\`.`);
      }
    },
    swipeVelocity(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`swipeVelocity\` option has been renamed to \`swipe.velocity\`. Use it as in \`{ swipe: { velocity: 0.5 } }\`.`);
      }
    },
    swipeDistance(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`swipeDistance\` option has been renamed to \`swipe.distance\`. Use it as in \`{ swipe: { distance: 50 } }\`.`);
      }
    },
    swipeDuration(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`swipeDuration\` option has been renamed to \`swipe.duration\`. Use it as in \`{ swipe: { duration: 250 } }\`.`);
      }
    }
  });
}
var SCALE_ANGLE_RATIO_INTENT_DEG = 30;
var PINCH_WHEEL_RATIO = 36;
var PinchEngine = class extends Engine {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "ingKey", "pinching");
    _defineProperty(this, "aliasKey", "da");
  }
  init() {
    this.state.offset = [1, 0];
    this.state.lastOffset = [1, 0];
    this.state._pointerEvents = /* @__PURE__ */ new Map();
  }
  reset() {
    super.reset();
    const state = this.state;
    state._touchIds = [];
    state.canceled = false;
    state.cancel = this.cancel.bind(this);
    state.turns = 0;
  }
  computeOffset() {
    const {
      type,
      movement,
      lastOffset
    } = this.state;
    if (type === "wheel") {
      this.state.offset = V.add(movement, lastOffset);
    } else {
      this.state.offset = [(1 + movement[0]) * lastOffset[0], movement[1] + lastOffset[1]];
    }
  }
  computeMovement() {
    const {
      offset,
      lastOffset
    } = this.state;
    this.state.movement = [offset[0] / lastOffset[0], offset[1] - lastOffset[1]];
  }
  intent(v) {
    const state = this.state;
    if (!state.axis) {
      const axisMovementDifference = Math.abs(v[0]) * SCALE_ANGLE_RATIO_INTENT_DEG - Math.abs(v[1]);
      if (axisMovementDifference < 0)
        state.axis = "angle";
      else if (axisMovementDifference > 0)
        state.axis = "scale";
    }
    if (this.config.lockDirection) {
      if (state.axis === "scale")
        v[1] = 0;
      else if (state.axis === "angle")
        v[0] = 0;
    }
  }
  cancel() {
    const state = this.state;
    if (state.canceled)
      return;
    setTimeout(() => {
      state.canceled = true;
      state._active = false;
      this.compute();
      this.emit();
    }, 0);
  }
  touchStart(event) {
    this.ctrl.setEventIds(event);
    const state = this.state;
    const ctrlTouchIds = this.ctrl.touchIds;
    if (state._active) {
      if (state._touchIds.every((id) => ctrlTouchIds.has(id)))
        return;
    }
    if (ctrlTouchIds.size < 2)
      return;
    this.start(event);
    state._touchIds = Array.from(ctrlTouchIds).slice(0, 2);
    const payload = touchDistanceAngle(event, state._touchIds);
    this.pinchStart(event, payload);
  }
  pointerStart(event) {
    if (event.buttons != null && event.buttons % 2 !== 1)
      return;
    this.ctrl.setEventIds(event);
    event.target.setPointerCapture(event.pointerId);
    const state = this.state;
    const _pointerEvents = state._pointerEvents;
    const ctrlPointerIds = this.ctrl.pointerIds;
    if (state._active) {
      if (Array.from(_pointerEvents.keys()).every((id) => ctrlPointerIds.has(id)))
        return;
    }
    if (_pointerEvents.size < 2) {
      _pointerEvents.set(event.pointerId, event);
    }
    if (state._pointerEvents.size < 2)
      return;
    this.start(event);
    const payload = distanceAngle(...Array.from(_pointerEvents.values()));
    this.pinchStart(event, payload);
  }
  pinchStart(event, payload) {
    const state = this.state;
    state.origin = payload.origin;
    state.values = [payload.distance, payload.angle];
    state.initial = state.values;
    this.compute(event);
    this.emit();
  }
  touchMove(event) {
    if (!this.state._active)
      return;
    const payload = touchDistanceAngle(event, this.state._touchIds);
    this.pinchMove(event, payload);
  }
  pointerMove(event) {
    const _pointerEvents = this.state._pointerEvents;
    if (_pointerEvents.has(event.pointerId)) {
      _pointerEvents.set(event.pointerId, event);
    }
    if (!this.state._active)
      return;
    const payload = distanceAngle(...Array.from(_pointerEvents.values()));
    this.pinchMove(event, payload);
  }
  pinchMove(event, payload) {
    const state = this.state;
    const prev_a = state.values[1];
    const delta_a = payload.angle - prev_a;
    let delta_turns = 0;
    if (Math.abs(delta_a) > 270)
      delta_turns += Math.sign(delta_a);
    state.values = [payload.distance, payload.angle - 360 * delta_turns];
    state.origin = payload.origin;
    state.turns = delta_turns;
    state._movement = [state.values[0] / state.initial[0] - 1, state.values[1] - state.initial[1]];
    this.compute(event);
    this.emit();
  }
  touchEnd(event) {
    this.ctrl.setEventIds(event);
    if (!this.state._active)
      return;
    if (this.state._touchIds.some((id) => !this.ctrl.touchIds.has(id))) {
      this.state._active = false;
      this.compute(event);
      this.emit();
    }
  }
  pointerEnd(event) {
    const state = this.state;
    this.ctrl.setEventIds(event);
    try {
      event.target.releasePointerCapture(event.pointerId);
    } catch (_unused) {
    }
    if (state._pointerEvents.has(event.pointerId)) {
      state._pointerEvents.delete(event.pointerId);
    }
    if (!state._active)
      return;
    if (state._pointerEvents.size < 2) {
      state._active = false;
      this.compute(event);
      this.emit();
    }
  }
  gestureStart(event) {
    if (event.cancelable)
      event.preventDefault();
    const state = this.state;
    if (state._active)
      return;
    this.start(event);
    state.values = [event.scale, event.rotation];
    state.origin = [event.clientX, event.clientY];
    this.compute(event);
    this.emit();
  }
  gestureMove(event) {
    if (event.cancelable)
      event.preventDefault();
    if (!this.state._active)
      return;
    const state = this.state;
    state.values = [event.scale, event.rotation];
    state.origin = [event.clientX, event.clientY];
    const _previousMovement = state._movement;
    state._movement = [event.scale - 1, event.rotation];
    state._delta = V.sub(state._movement, _previousMovement);
    this.compute(event);
    this.emit();
  }
  gestureEnd(event) {
    if (!this.state._active)
      return;
    this.state._active = false;
    this.compute(event);
    this.emit();
  }
  wheel(event) {
    if (!event.ctrlKey)
      return;
    if (!this.state._active)
      this.wheelStart(event);
    else
      this.wheelChange(event);
    this.timeoutStore.add("wheelEnd", this.wheelEnd.bind(this));
  }
  wheelStart(event) {
    this.start(event);
    this.wheelChange(event);
  }
  wheelChange(event) {
    const isR3f = "uv" in event;
    if (!isR3f) {
      if (event.cancelable) {
        event.preventDefault();
      }
      if (!event.defaultPrevented) {
        console.warn(`[@use-gesture]: To properly support zoom on trackpads, try using the \`target\` option.

This message will only appear in development mode.`);
      }
    }
    const state = this.state;
    state._delta = [-wheelValues(event)[1] / PINCH_WHEEL_RATIO * state.offset[0], 0];
    V.addTo(state._movement, state._delta);
    this.state.origin = [event.clientX, event.clientY];
    this.compute(event);
    this.emit();
  }
  wheelEnd() {
    if (!this.state._active)
      return;
    this.state._active = false;
    this.compute();
    this.emit();
  }
  bind(bindFunction) {
    const device = this.config.device;
    if (!!device) {
      bindFunction(device, "start", this[device + "Start"].bind(this));
      bindFunction(device, "change", this[device + "Move"].bind(this));
      bindFunction(device, "end", this[device + "End"].bind(this));
      bindFunction(device, "cancel", this[device + "End"].bind(this));
    } else {
      bindFunction("wheel", "", this.wheel.bind(this), {
        passive: false
      });
    }
  }
};
var pinchConfigResolver = _objectSpread2(_objectSpread2({}, commonConfigResolver), {}, {
  useTouch(_v, _k, {
    pointer: {
      touch = false
    } = {}
  }) {
    return SUPPORT.touch && touch;
  },
  device(_v, _k, config) {
    const sharedConfig = config.shared;
    if (sharedConfig.target && !SUPPORT.touch && SUPPORT.gesture)
      return "gesture";
    if (this.useTouch)
      return "touch";
    if (SUPPORT.touchscreen) {
      if (SUPPORT.pointer)
        return "pointer";
      if (SUPPORT.touch)
        return "touch";
    }
  },
  bounds(_v, _k, {
    scaleBounds = {},
    angleBounds = {}
  }) {
    const _scaleBounds = (state) => {
      const D = assignDefault(call(scaleBounds, state), {
        min: -Infinity,
        max: Infinity
      });
      return [D.min, D.max];
    };
    const _angleBounds = (state) => {
      const A = assignDefault(call(angleBounds, state), {
        min: -Infinity,
        max: Infinity
      });
      return [A.min, A.max];
    };
    if (typeof scaleBounds !== "function" && typeof angleBounds !== "function")
      return [_scaleBounds(), _angleBounds()];
    return (state) => [_scaleBounds(state), _angleBounds(state)];
  },
  threshold(value, _k, config) {
    this.lockDirection = config.axis === "lock";
    const threshold = V.toVector(value, this.lockDirection ? [0.1, 3] : 0);
    return threshold;
  }
});
var MoveEngine = class extends CoordinatesEngine {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "ingKey", "moving");
  }
  move(event) {
    if (this.config.mouseOnly && event.pointerType !== "mouse")
      return;
    if (!this.state._active)
      this.moveStart(event);
    else
      this.moveChange(event);
    this.timeoutStore.add("moveEnd", this.moveEnd.bind(this));
  }
  moveStart(event) {
    this.start(event);
    const state = this.state;
    state.values = pointerValues(event);
    this.compute(event);
    state.initial = state.values;
    this.emit();
  }
  moveChange(event) {
    if (!this.state._active)
      return;
    const values = pointerValues(event);
    const state = this.state;
    state._delta = V.sub(values, state.values);
    V.addTo(state._movement, state._delta);
    state.values = values;
    this.compute(event);
    this.emit();
  }
  moveEnd(event) {
    if (!this.state._active)
      return;
    this.state._active = false;
    this.compute(event);
    this.emit();
  }
  bind(bindFunction) {
    bindFunction("pointer", "change", this.move.bind(this));
    bindFunction("pointer", "leave", this.moveEnd.bind(this));
  }
};
var moveConfigResolver = _objectSpread2(_objectSpread2({}, coordinatesConfigResolver), {}, {
  mouseOnly: (value = true) => value
});
var ScrollEngine = class extends CoordinatesEngine {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "ingKey", "scrolling");
  }
  scroll(event) {
    if (!this.state._active)
      this.start(event);
    this.scrollChange(event);
    this.timeoutStore.add("scrollEnd", this.scrollEnd.bind(this));
  }
  scrollChange(event) {
    if (event.cancelable)
      event.preventDefault();
    const state = this.state;
    const values = scrollValues(event);
    state._delta = V.sub(values, state.values);
    V.addTo(state._movement, state._delta);
    state.values = values;
    this.compute(event);
    this.emit();
  }
  scrollEnd() {
    if (!this.state._active)
      return;
    this.state._active = false;
    this.compute();
    this.emit();
  }
  bind(bindFunction) {
    bindFunction("scroll", "", this.scroll.bind(this));
  }
};
var scrollConfigResolver = coordinatesConfigResolver;
var WheelEngine = class extends CoordinatesEngine {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "ingKey", "wheeling");
  }
  wheel(event) {
    if (!this.state._active)
      this.start(event);
    this.wheelChange(event);
    this.timeoutStore.add("wheelEnd", this.wheelEnd.bind(this));
  }
  wheelChange(event) {
    const state = this.state;
    state._delta = wheelValues(event);
    V.addTo(this.state._movement, state._delta);
    this.compute(event);
    this.emit();
  }
  wheelEnd() {
    if (!this.state._active)
      return;
    this.state._active = false;
    this.compute();
    this.emit();
  }
  bind(bindFunction) {
    bindFunction("wheel", "", this.wheel.bind(this));
  }
};
var wheelConfigResolver = coordinatesConfigResolver;
var HoverEngine = class extends CoordinatesEngine {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "ingKey", "hovering");
  }
  enter(event) {
    if (this.config.mouseOnly && event.pointerType !== "mouse")
      return;
    this.start(event);
    this.state.values = pointerValues(event);
    this.compute(event);
    this.emit();
  }
  leave(event) {
    if (this.config.mouseOnly && event.pointerType !== "mouse")
      return;
    const state = this.state;
    if (!state._active)
      return;
    state._active = false;
    const values = pointerValues(event);
    state._movement = state._delta = V.sub(values, state.values);
    state.values = values;
    this.compute(event);
    state.delta = state.movement;
    this.emit();
  }
  bind(bindFunction) {
    bindFunction("pointer", "enter", this.enter.bind(this));
    bindFunction("pointer", "leave", this.leave.bind(this));
  }
};
var hoverConfigResolver = _objectSpread2(_objectSpread2({}, coordinatesConfigResolver), {}, {
  mouseOnly: (value = true) => value
});
var EngineMap = /* @__PURE__ */ new Map();
var ConfigResolverMap = /* @__PURE__ */ new Map();
function registerAction(action2) {
  EngineMap.set(action2.key, action2.engine);
  ConfigResolverMap.set(action2.key, action2.resolver);
}
var dragAction = {
  key: "drag",
  engine: DragEngine,
  resolver: dragConfigResolver
};
var hoverAction = {
  key: "hover",
  engine: HoverEngine,
  resolver: hoverConfigResolver
};
var moveAction = {
  key: "move",
  engine: MoveEngine,
  resolver: moveConfigResolver
};
var pinchAction = {
  key: "pinch",
  engine: PinchEngine,
  resolver: pinchConfigResolver
};
var scrollAction = {
  key: "scroll",
  engine: ScrollEngine,
  resolver: scrollConfigResolver
};
var wheelAction = {
  key: "wheel",
  engine: WheelEngine,
  resolver: wheelConfigResolver
};

// ../../node_modules/@use-gesture/react/dist/use-gesture-react.esm.js
import React2 from "react";

// ../../node_modules/@use-gesture/core/dist/use-gesture-core.esm.js
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null)
    return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0)
      continue;
    target[key] = source[key];
  }
  return target;
}
function _objectWithoutProperties(source, excluded) {
  if (source == null)
    return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0)
        continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key))
        continue;
      target[key] = source[key];
    }
  }
  return target;
}
var identity = (v) => v;
var sharedConfigResolver = {
  target(value) {
    if (value) {
      return () => "current" in value ? value.current : value;
    }
    return void 0;
  },
  enabled(value = true) {
    return value;
  },
  window(value = SUPPORT.isBrowser ? window : void 0) {
    return value;
  },
  eventOptions({
    passive = true,
    capture = false
  } = {}) {
    return {
      passive,
      capture
    };
  },
  transform(value = identity) {
    return value;
  }
};
var _excluded = ["target", "eventOptions", "window", "enabled", "transform"];
function resolveWith(config = {}, resolvers) {
  const result = {};
  for (const [key, resolver] of Object.entries(resolvers))
    switch (typeof resolver) {
      case "function":
        result[key] = resolver.call(result, config[key], key, config);
        break;
      case "object":
        result[key] = resolveWith(config[key], resolver);
        break;
      case "boolean":
        if (resolver)
          result[key] = config[key];
        break;
    }
  return result;
}
function parse(config, gestureKey) {
  const _ref = config, {
    target,
    eventOptions,
    window: window2,
    enabled,
    transform
  } = _ref, rest = _objectWithoutProperties(_ref, _excluded);
  const _config = {
    shared: resolveWith({
      target,
      eventOptions,
      window: window2,
      enabled,
      transform
    }, sharedConfigResolver)
  };
  if (gestureKey) {
    const resolver = ConfigResolverMap.get(gestureKey);
    _config[gestureKey] = resolveWith(_objectSpread2({
      shared: _config.shared
    }, rest), resolver);
  } else {
    for (const key in rest) {
      const resolver = ConfigResolverMap.get(key);
      if (resolver) {
        _config[key] = resolveWith(_objectSpread2({
          shared: _config.shared
        }, rest[key]), resolver);
      } else if (true) {
        if (!["drag", "pinch", "scroll", "wheel", "move", "hover"].includes(key)) {
          if (key === "domTarget") {
            throw Error(`[@use-gesture]: \`domTarget\` option has been renamed to \`target\`.`);
          }
          console.warn(`[@use-gesture]: Unknown config key \`${key}\` was used. Please read the documentation for further information.`);
        }
      }
    }
  }
  return _config;
}
var EventStore = class {
  constructor(ctrl) {
    _defineProperty(this, "_listeners", []);
    this._ctrl = ctrl;
  }
  add(element, device, action2, handler, options) {
    const type = toDomEventType(device, action2);
    const eventOptions = _objectSpread2(_objectSpread2({}, this._ctrl.config.shared.eventOptions), options);
    element.addEventListener(type, handler, eventOptions);
    this._listeners.push(() => element.removeEventListener(type, handler, eventOptions));
  }
  clean() {
    this._listeners.forEach((remove2) => remove2());
    this._listeners = [];
  }
};
var TimeoutStore = class {
  constructor() {
    _defineProperty(this, "_timeouts", /* @__PURE__ */ new Map());
  }
  add(key, callback, ms = 140, ...args) {
    this.remove(key);
    this._timeouts.set(key, window.setTimeout(callback, ms, ...args));
  }
  remove(key) {
    const timeout = this._timeouts.get(key);
    if (timeout)
      window.clearTimeout(timeout);
  }
  clean() {
    this._timeouts.forEach((timeout) => void window.clearTimeout(timeout));
    this._timeouts.clear();
  }
};
var Controller = class {
  constructor(handlers) {
    _defineProperty(this, "gestures", /* @__PURE__ */ new Set());
    _defineProperty(this, "_targetEventStore", new EventStore(this));
    _defineProperty(this, "gestureEventStores", {});
    _defineProperty(this, "gestureTimeoutStores", {});
    _defineProperty(this, "handlers", {});
    _defineProperty(this, "config", {});
    _defineProperty(this, "pointerIds", /* @__PURE__ */ new Set());
    _defineProperty(this, "touchIds", /* @__PURE__ */ new Set());
    _defineProperty(this, "state", {
      shared: {
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
        altKey: false
      }
    });
    resolveGestures(this, handlers);
  }
  setEventIds(event) {
    if (isTouch(event)) {
      this.touchIds = new Set(touchIds(event));
    } else if ("pointerId" in event) {
      if (event.type === "pointerup")
        this.pointerIds.delete(event.pointerId);
      else
        this.pointerIds.add(event.pointerId);
    }
  }
  applyHandlers(handlers, nativeHandlers) {
    this.handlers = handlers;
    this.nativeHandlers = nativeHandlers;
  }
  applyConfig(config, gestureKey) {
    this.config = parse(config, gestureKey);
  }
  clean() {
    this._targetEventStore.clean();
    for (const key of this.gestures) {
      this.gestureEventStores[key].clean();
      this.gestureTimeoutStores[key].clean();
    }
  }
  effect() {
    if (this.config.shared.target)
      this.bind();
    return () => this._targetEventStore.clean();
  }
  bind(...args) {
    const sharedConfig = this.config.shared;
    const eventOptions = sharedConfig.eventOptions;
    const props = {};
    let target;
    if (sharedConfig.target) {
      target = sharedConfig.target();
      if (!target)
        return;
    }
    const bindFunction = bindToProps(props, eventOptions, !!target);
    if (sharedConfig.enabled) {
      for (const gestureKey of this.gestures) {
        if (this.config[gestureKey].enabled) {
          const Engine2 = EngineMap.get(gestureKey);
          new Engine2(this, args, gestureKey).bind(bindFunction);
        }
      }
      for (const eventKey in this.nativeHandlers) {
        bindFunction(eventKey, "", (event) => this.nativeHandlers[eventKey](_objectSpread2(_objectSpread2({}, this.state.shared), {}, {
          event,
          args
        })), void 0, true);
      }
    }
    for (const handlerProp in props) {
      props[handlerProp] = chain(...props[handlerProp]);
    }
    if (!target)
      return props;
    for (const handlerProp in props) {
      let eventKey = handlerProp.substr(2).toLowerCase();
      const capture = !!~eventKey.indexOf("capture");
      const passive = !!~eventKey.indexOf("passive");
      if (capture || passive)
        eventKey = eventKey.replace(/capture|passive/g, "");
      this._targetEventStore.add(target, eventKey, "", props[handlerProp], {
        capture,
        passive
      });
    }
  }
};
function setupGesture(ctrl, gestureKey) {
  ctrl.gestures.add(gestureKey);
  ctrl.gestureEventStores[gestureKey] = new EventStore(ctrl);
  ctrl.gestureTimeoutStores[gestureKey] = new TimeoutStore();
}
function resolveGestures(ctrl, internalHandlers) {
  if (internalHandlers.drag)
    setupGesture(ctrl, "drag");
  if (internalHandlers.wheel)
    setupGesture(ctrl, "wheel");
  if (internalHandlers.scroll)
    setupGesture(ctrl, "scroll");
  if (internalHandlers.move)
    setupGesture(ctrl, "move");
  if (internalHandlers.pinch)
    setupGesture(ctrl, "pinch");
  if (internalHandlers.hover)
    setupGesture(ctrl, "hover");
}
var bindToProps = (props, eventOptions, withPassiveOption) => (device, action2, handler, options = {}, isNative = false) => {
  var _options$capture, _options$passive;
  const capture = (_options$capture = options.capture) !== null && _options$capture !== void 0 ? _options$capture : eventOptions.capture;
  const passive = (_options$passive = options.passive) !== null && _options$passive !== void 0 ? _options$passive : eventOptions.passive;
  let handlerProp = isNative ? device : toHandlerProp(device, action2, capture);
  if (withPassiveOption && passive)
    handlerProp += "Passive";
  props[handlerProp] = props[handlerProp] || [];
  props[handlerProp].push(handler);
};
var RE_NOT_NATIVE = /^on(Drag|Wheel|Scroll|Move|Pinch|Hover)/;
function sortHandlers(_handlers) {
  const native = {};
  const handlers = {};
  const actions = /* @__PURE__ */ new Set();
  for (let key in _handlers) {
    if (RE_NOT_NATIVE.test(key)) {
      actions.add(RegExp.lastMatch);
      handlers[key] = _handlers[key];
    } else {
      native[key] = _handlers[key];
    }
  }
  return [handlers, native, actions];
}
function registerGesture(actions, handlers, handlerKey, key, internalHandlers, config) {
  if (!actions.has(handlerKey))
    return;
  if (!EngineMap.has(key)) {
    if (true) {
      console.warn(`[@use-gesture]: You've created a custom handler that that uses the \`${key}\` gesture but isn't properly configured.

Please add \`${key}Action\` when creating your handler.`);
    }
    return;
  }
  const startKey = handlerKey + "Start";
  const endKey = handlerKey + "End";
  const fn = (state) => {
    let memo3 = void 0;
    if (state.first && startKey in handlers)
      handlers[startKey](state);
    if (handlerKey in handlers)
      memo3 = handlers[handlerKey](state);
    if (state.last && endKey in handlers)
      handlers[endKey](state);
    return memo3;
  };
  internalHandlers[key] = fn;
  config[key] = config[key] || {};
}
function parseMergedHandlers(mergedHandlers, mergedConfig) {
  const [handlers, nativeHandlers, actions] = sortHandlers(mergedHandlers);
  const internalHandlers = {};
  registerGesture(actions, handlers, "onDrag", "drag", internalHandlers, mergedConfig);
  registerGesture(actions, handlers, "onWheel", "wheel", internalHandlers, mergedConfig);
  registerGesture(actions, handlers, "onScroll", "scroll", internalHandlers, mergedConfig);
  registerGesture(actions, handlers, "onPinch", "pinch", internalHandlers, mergedConfig);
  registerGesture(actions, handlers, "onMove", "move", internalHandlers, mergedConfig);
  registerGesture(actions, handlers, "onHover", "hover", internalHandlers, mergedConfig);
  return {
    handlers: internalHandlers,
    config: mergedConfig,
    nativeHandlers
  };
}

// ../../node_modules/@use-gesture/react/dist/use-gesture-react.esm.js
function useRecognizers(handlers, config = {}, gestureKey, nativeHandlers) {
  const ctrl = React2.useMemo(() => new Controller(handlers), []);
  ctrl.applyHandlers(handlers, nativeHandlers);
  ctrl.applyConfig(config, gestureKey);
  React2.useEffect(ctrl.effect.bind(ctrl));
  React2.useEffect(() => {
    return ctrl.clean.bind(ctrl);
  }, []);
  if (config.target === void 0) {
    return ctrl.bind.bind(ctrl);
  }
  return void 0;
}
function createUseGesture(actions) {
  actions.forEach(registerAction);
  return function useGesture2(_handlers, _config = {}) {
    const {
      handlers,
      nativeHandlers,
      config
    } = parseMergedHandlers(_handlers, _config);
    return useRecognizers(handlers, config, void 0, nativeHandlers);
  };
}
function useGesture(handlers, config = {}) {
  const hook = createUseGesture([dragAction, pinchAction, scrollAction, wheelAction, moveAction, hoverAction]);
  return hook(handlers, config);
}

// ../../packages/react/dist/esm/index.js
import * as React10 from "react";
import * as React11 from "react";
import * as React12 from "react";
import * as React13 from "react";
import * as React14 from "react";
import * as React15 from "react";
import * as React16 from "react";
import * as React17 from "react";
import * as React18 from "react";
import * as React20 from "react";
import * as React21 from "react";
import * as React23 from "react";
import * as React222 from "react";
import * as React24 from "react";
import * as React25 from "react";
import * as React26 from "react";
import * as React29 from "react";
import * as React27 from "react";
import * as React28 from "react";
import * as React30 from "react";
import * as React31 from "react";
import * as React322 from "react";
import * as React33 from "react";
import * as React38 from "react";
import * as React34 from "react";
import * as React35 from "react";
import * as React36 from "react";
import * as React37 from "react";
import * as React39 from "react";
import * as React40 from "react";
import * as React41 from "react";
import * as React42 from "react";
import * as React43 from "react";
var __defProp5 = Object.defineProperty;
var __defProps3 = Object.defineProperties;
var __getOwnPropDescs3 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols3 = Object.getOwnPropertySymbols;
var __hasOwnProp4 = Object.prototype.hasOwnProperty;
var __propIsEnum3 = Object.prototype.propertyIsEnumerable;
var __defNormalProp5 = (obj, key, value) => key in obj ? __defProp5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues3 = (a2, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp4.call(b, prop))
      __defNormalProp5(a2, prop, b[prop]);
  if (__getOwnPropSymbols3)
    for (var prop of __getOwnPropSymbols3(b)) {
      if (__propIsEnum3.call(b, prop))
        __defNormalProp5(a2, prop, b[prop]);
    }
  return a2;
};
var __spreadProps3 = (a2, b) => __defProps3(a2, __getOwnPropDescs3(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp4.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols3)
    for (var prop of __getOwnPropSymbols3(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum3.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __publicField4 = (obj, key, value) => {
  __defNormalProp5(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var TLReactBoxShape = class extends TLBoxShape {
};
var TLReactApp = class extends TLApp41 {
};
var TLTextMeasure = class {
  constructor() {
    __publicField4(this, "elm");
    __publicField4(this, "measureText", (text, styles2, padding = 0) => {
      var _a2, _b, _c, _d, _e;
      const { elm } = this;
      elm.style.setProperty("font", `${(_a2 = styles2.fontStyle) != null ? _a2 : "normal"} ${(_b = styles2.fontVariant) != null ? _b : "normal"} ${(_c = styles2.fontWeight) != null ? _c : "normal"} ${styles2.fontSize}px/${styles2.fontSize * styles2.lineHeight}px ${styles2.fontFamily}`);
      elm.style.padding = padding + "px";
      elm.innerHTML = `${text}&#8203;`;
      const width = (_d = elm.offsetWidth) != null ? _d : 1;
      const height = (_e = elm.offsetHeight) != null ? _e : 1;
      return {
        width,
        height
      };
    });
    const pre = document.createElement("pre");
    const id = uniqueId();
    pre.id = `__textMeasure_${id}`;
    Object.assign(pre.style, {
      whiteSpace: "pre",
      width: "auto",
      borderLeft: "2px solid transparent",
      borderRight: "1px solid transparent",
      borderBottom: "2px solid transparent",
      padding: "0px",
      margin: "0px",
      opacity: "0",
      position: "absolute",
      top: "-500px",
      left: "0px",
      zIndex: "9999",
      userSelect: "none",
      pointerEvents: "none"
    });
    pre.tabIndex = -1;
    document.body.appendChild(pre);
    this.elm = pre;
  }
};
var contextMap = {};
function getAppContext(id = "noid") {
  if (!contextMap[id]) {
    contextMap[id] = React3.createContext({});
  }
  return contextMap[id];
}
function useApp(id = "noid") {
  return React3.useContext(getAppContext(id));
}
var contextMap2 = {};
function getRendererContext(id = "noid") {
  if (!contextMap2[id]) {
    contextMap2[id] = React22.createContext({});
  }
  return contextMap2[id];
}
function useRendererContext(id = "noid") {
  return React22.useContext(getRendererContext(id));
}
var HTMLContainer = React32.forwardRef(function HTMLContainer2(_a2, ref) {
  var _b = _a2, { children, opacity, centered, className = "" } = _b, rest = __objRest(_b, ["children", "opacity", "centered", "className"]);
  return /* @__PURE__ */ React32.createElement(ObserverComponent, null, () => /* @__PURE__ */ React32.createElement("div", {
    ref,
    className: `tl-positioned-div ${className}`,
    style: opacity ? { opacity } : void 0,
    draggable: false
  }, /* @__PURE__ */ React32.createElement("div", __spreadValues3({
    className: `tl-positioned-inner ${centered ? "tl-centered" : ""}`
  }, rest), children)));
});
var SVGContainer = React4.forwardRef(function SVGContainer2(_a2, ref) {
  var _b = _a2, { id, className = "", children } = _b, rest = __objRest(_b, ["id", "className", "children"]);
  return /* @__PURE__ */ React4.createElement(ObserverComponent, null, () => /* @__PURE__ */ React4.createElement("svg", {
    ref,
    className: `tl-positioned-svg ${className}`
  }, /* @__PURE__ */ React4.createElement("g", __spreadValues3({
    id,
    className: "tl-centered-g"
  }, rest), children)));
});
var Container = observer(function Container2(_a2) {
  var _b = _a2, {
    id,
    bounds,
    scale,
    zIndex,
    rotation = 0,
    className = "",
    children
  } = _b, props = __objRest(_b, [
    "id",
    "bounds",
    "scale",
    "zIndex",
    "rotation",
    "className",
    "children"
  ]);
  const rBounds = React5.useRef(null);
  React5.useLayoutEffect(() => {
    const elm = rBounds.current;
    elm.style.transform = `translate(
        calc(${bounds.minX}px - var(--tl-padding)),
        calc(${bounds.minY}px - var(--tl-padding)))
        rotate(${rotation + (bounds.rotation || 0)}rad)
      ${scale ? `scale(${scale[0]}, ${scale[1]})` : ""}`;
  }, [bounds.minX, bounds.minY, rotation, bounds.rotation, scale]);
  React5.useLayoutEffect(() => {
    const elm = rBounds.current;
    elm.style.width = `calc(${Math.floor(bounds.width)}px + (var(--tl-padding) * 2))`;
    elm.style.height = `calc(${Math.floor(bounds.height)}px + (var(--tl-padding) * 2))`;
  }, [bounds.width, bounds.height]);
  React5.useLayoutEffect(() => {
    const elm = rBounds.current;
    if (zIndex !== void 0)
      elm.style.zIndex = zIndex.toString();
  }, [zIndex]);
  return /* @__PURE__ */ React5.createElement("div", __spreadValues3({
    id,
    ref: rBounds,
    className: `tl-positioned ${className}`,
    "aria-label": "container"
  }, props), children);
});
var PI3 = Math.PI;
var TAU2 = PI3 / 2;
var PI22 = PI3 * 2;
var EPSILON2 = Math.PI / 180;
var DOUBLE_CLICK_DURATION = 450;
var NOOP = () => void 0;
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var EMPTY_OBJECT2 = {};
var CURSORS2 = {
  canvas: "default",
  grab: "grab",
  grabbing: "grabbing",
  [TLResizeCorner.TopLeft]: "resize-nwse",
  [TLResizeCorner.TopRight]: "resize-nesw",
  [TLResizeCorner.BottomRight]: "resize-nwse",
  [TLResizeCorner.BottomLeft]: "resize-nesw",
  [TLResizeEdge.Top]: "resize-ns",
  [TLResizeEdge.Right]: "resize-ew",
  [TLResizeEdge.Bottom]: "resize-ns",
  [TLResizeEdge.Left]: "resize-ew"
};
function useBoundsEvents(handle) {
  const { callbacks } = useRendererContext();
  const rDoubleClickTimer = React6.useRef(-1);
  const events = React6.useMemo(() => {
    const onPointerMove = (e) => {
      var _a2;
      const { order = 0 } = e;
      if (order)
        return;
      (_a2 = callbacks.onPointerMove) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Selection, handle, order }, e);
      e.order = order + 1;
    };
    const onPointerDown = (e) => {
      var _a2;
      const { order = 0 } = e;
      if (order)
        return;
      const elm = loopToHtmlElement(e.currentTarget);
      elm.setPointerCapture(e.pointerId);
      elm.addEventListener("pointerup", onPointerUp);
      (_a2 = callbacks.onPointerDown) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Selection, handle, order }, e);
      e.order = order + 1;
    };
    const onPointerUp = (e) => {
      var _a2, _b;
      const { order = 0 } = e;
      if (order)
        return;
      const elm = e.target;
      elm.removeEventListener("pointerup", onPointerUp);
      elm.releasePointerCapture(e.pointerId);
      (_a2 = callbacks.onPointerUp) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Selection, handle, order }, e);
      const now = Date.now();
      const elapsed = now - rDoubleClickTimer.current;
      if (elapsed > DOUBLE_CLICK_DURATION) {
        rDoubleClickTimer.current = now;
      } else {
        if (elapsed <= DOUBLE_CLICK_DURATION) {
          (_b = callbacks.onDoubleClick) == null ? void 0 : _b.call(callbacks, { type: TLTargetType.Selection, handle, order }, e);
          rDoubleClickTimer.current = -1;
        }
      }
      e.order = order + 1;
    };
    const onPointerEnter = (e) => {
      var _a2;
      const { order = 0 } = e;
      if (order)
        return;
      (_a2 = callbacks.onPointerEnter) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Selection, handle, order }, e);
      e.order = order + 1;
    };
    const onPointerLeave = (e) => {
      var _a2;
      const { order = 0 } = e;
      if (order)
        return;
      (_a2 = callbacks.onPointerLeave) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Selection, handle, order }, e);
      e.order = order + 1;
    };
    const onKeyDown = (e) => {
      var _a2;
      (_a2 = callbacks.onKeyDown) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Selection, handle, order: -1 }, e);
    };
    const onKeyUp = (e) => {
      var _a2;
      (_a2 = callbacks.onKeyUp) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Selection, handle, order: -1 }, e);
    };
    return {
      onPointerDown,
      onPointerMove,
      onPointerEnter,
      onPointerLeave,
      onKeyDown,
      onKeyUp
    };
  }, [callbacks]);
  return events;
}
function loopToHtmlElement(elm) {
  var _a2;
  if ((_a2 = elm.namespaceURI) == null ? void 0 : _a2.endsWith("svg")) {
    if (elm.parentElement)
      return loopToHtmlElement(elm.parentElement);
    else
      throw Error("Could not find a parent element of an HTML type!");
  }
  return elm;
}
function useResizeObserver(ref, viewport, onBoundsChange) {
  const rIsMounted = React7.useRef(false);
  const updateBounds = React7.useCallback(() => {
    var _a2;
    if (rIsMounted.current) {
      const rect = (_a2 = ref.current) == null ? void 0 : _a2.getBoundingClientRect();
      if (rect) {
        const bounds = {
          minX: rect.left,
          maxX: rect.left + rect.width,
          minY: rect.top,
          maxY: rect.top + rect.height,
          width: rect.width,
          height: rect.height
        };
        viewport.updateBounds(bounds);
        onBoundsChange == null ? void 0 : onBoundsChange(bounds);
      }
    } else {
      rIsMounted.current = true;
    }
  }, [ref, onBoundsChange]);
  React7.useEffect(() => {
    window.addEventListener("scroll", updateBounds);
    window.addEventListener("resize", updateBounds);
    return () => {
      window.removeEventListener("scroll", updateBounds);
      window.removeEventListener("resize", updateBounds);
    };
  }, []);
  React7.useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0].contentRect) {
        updateBounds();
      }
    });
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);
  React7.useLayoutEffect(() => {
    updateBounds();
  }, [ref]);
}
var styles = /* @__PURE__ */ new Map();
function makeCssTheme(prefix, theme) {
  return Object.keys(theme).reduce((acc, key) => {
    const value = theme[key];
    if (value) {
      return acc + `${`--${prefix}-${key}`}: ${value};
`;
    }
    return acc;
  }, "");
}
function useTheme(prefix, theme, selector = ":root") {
  React8.useLayoutEffect(() => {
    const style = document.createElement("style");
    const cssTheme = makeCssTheme(prefix, theme);
    style.setAttribute("id", `${prefix}-theme`);
    style.setAttribute("data-selector", selector);
    style.innerHTML = `
        ${selector} {
          ${cssTheme}
        }
      `;
    document.head.appendChild(style);
    return () => {
      if (style && document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [prefix, theme, selector]);
}
function useStyle(uid, rules) {
  React8.useLayoutEffect(() => {
    if (styles.get(uid)) {
      return () => void 0;
    }
    const style = document.createElement("style");
    style.innerHTML = rules;
    style.setAttribute("id", uid);
    document.head.appendChild(style);
    styles.set(uid, style);
    return () => {
      if (style && document.head.contains(style)) {
        document.head.removeChild(style);
        styles.delete(uid);
      }
    };
  }, [uid, rules]);
}
var css = (strings, ...args) => strings.reduce((acc, string, index) => acc + string + (index < args.length ? args[index] : ""), "");
var defaultTheme = {
  accent: "rgb(255, 0, 0)",
  brushFill: "rgba(0,0,0,.05)",
  brushStroke: "rgba(0,0,0,.25)",
  selectStroke: "rgb(66, 133, 244)",
  selectFill: "rgba(65, 132, 244, 0.05)",
  background: "rgb(248, 249, 250)",
  foreground: "rgb(51, 51, 51)",
  grid: "rgba(144, 144, 144, .9)"
};
var tlcss = css`
  @font-face {
    font-family: 'Recursive';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url(https://fonts.gstatic.com/s/recursive/v23/8vI-7wMr0mhh-RQChyHEH06TlXhq_gukbYrFMk1QuAIcyEwG_X-dpEfaE5YaERmK-CImKsvxvU-MXGX2fSqasNfUlTGZnI14ZeY.woff2)
      format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
      U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  @font-face {
    font-family: 'Recursive';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url(https://fonts.gstatic.com/s/recursive/v23/8vI-7wMr0mhh-RQChyHEH06TlXhq_gukbYrFMk1QuAIcyEwG_X-dpEfaE5YaERmK-CImKsvxvU-MXGX2fSqasNfUlTGZnI14ZeY.woff2)
      format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
      U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  @font-face {
    font-family: 'Recursive Mono';
    font-style: normal;
    font-weight: 420;
    font-display: swap;
    src: url(https://fonts.gstatic.com/s/recursive/v23/8vI-7wMr0mhh-RQChyHEH06TlXhq_gukbYrFMk1QuAIcyEwG_X-dpEfaE5YaERmK-CImqvTxvU-MXGX2fSqasNfUlTGZnI14ZeY.woff2)
      format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
      U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  .tl-container {
    --tl-cursor: inherit;
    --tl-zoom: 1;
    --tl-scale: calc(1 / var(--tl-zoom));
    --tl-padding: calc(64px * var(--tl-scale));
    --tl-shadow-color: 0deg 0% 0%;
    --tl-shadow-elevation-low: 0px 0.4px 0.5px hsl(var(--tl-shadow-color) / 0.04),
      0px 0.6px 0.8px -0.7px hsl(var(--tl-shadow-color) / 0.06),
      0.1px 1.2px 1.5px -1.4px hsl(var(--tl-shadow-color) / 0.08);
    --tl-shadow-elevation-medium: 0px 0.4px 0.5px hsl(var(--tl-shadow-color) / 0.04),
      0.1px 1.3px 1.7px -0.5px hsl(var(--tl-shadow-color) / 0.06),
      0.1px 2.8px 3.6px -1px hsl(var(--tl-shadow-color) / 0.07),
      0.3px 6.1px 7.8px -1.4px hsl(var(--tl-shadow-color) / 0.09);
    --tl-shadow-elevation-high: 0px 0.4px 0.5px hsl(var(--tl-shadow-color) / 0.04),
      0.1px 2.3px 3px -0.2px hsl(var(--tl-shadow-color) / 0.05),
      0.2px 4.1px 5.3px -0.5px hsl(var(--tl-shadow-color) / 0.06),
      0.4px 6.6px 8.5px -0.7px hsl(var(--tl-shadow-color) / 0.07),
      0.6px 10.3px 13.2px -1px hsl(var(--tl-shadow-color) / 0.08),
      0.9px 16px 20.6px -1.2px hsl(var(--tl-shadow-color) / 0.09),
      1.3px 24.3px 31.2px -1.4px hsl(var(--tl-shadow-color) / 0.1);
    box-sizing: border-box;
    position: relative;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    box-sizing: border-box;
    padding: 0px;
    margin: 0px;
    outline: none;
    z-index: 100;
    user-select: none;
    touch-action: none;
    overscroll-behavior: none;
    background-color: var(--tl-background);
    cursor: var(--tl-cursor) !important;
    box-sizing: border-box;
  }

  .tl-overlay {
    background: none;
    fill: transparent;
    position: absolute;
    width: 100%;
    height: 100%;
    touch-action: none;
    pointer-events: none;
  }

  .tl-grid {
    position: absolute;
    width: 100%;
    height: 100%;
    touch-action: none;
    pointer-events: none;
    user-select: none;
  }

  .tl-snap-line {
    stroke: var(--tl-accent);
    stroke-width: calc(1px * var(--tl-scale));
  }

  .tl-snap-point {
    stroke: var(--tl-accent);
    stroke-width: calc(1px * var(--tl-scale));
  }

  .tl-canvas {
    position: absolute;
    width: 100%;
    height: 100%;
    touch-action: none;
    pointer-events: all;
    overflow: clip;
    outline: none;
  }

  .tl-layer {
    position: absolute;
    top: 0px;
    left: 0px;
    height: 0px;
    width: 0px;
    contain: layout style size;
  }

  .tl-absolute {
    position: absolute;
    top: 0px;
    left: 0px;
    transform-origin: center center;
    contain: layout style size;
  }

  .tl-positioned {
    position: absolute;
    transform-origin: center center;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    contain: layout style size;
  }

  .tl-positioned-svg {
    width: 100%;
    height: 100%;
    overflow: hidden;
    contain: layout style size;
    pointer-events: none;
  }

  .tl-positioned-div {
    position: relative;
    width: 100%;
    height: 100%;
    padding: var(--tl-padding);
    contain: layout style size;
  }

  .tl-positioned-inner {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .tl-counter-scaled {
    transform: scale(var(--tl-scale));
  }

  .tl-dashed {
    stroke-dasharray: calc(2px * var(--tl-scale)), calc(2px * var(--tl-scale));
  }

  .tl-transparent {
    fill: transparent;
    stroke: transparent;
  }

  .tl-corner-handle {
    stroke: var(--tl-selectStroke);
    fill: var(--tl-background);
    stroke-width: calc(1.5px * var(--tl-scale));
  }

  .tl-rotate-handle {
    stroke: var(--tl-selectStroke);
    fill: var(--tl-background);
    stroke-width: calc(1.5px * var(--tl-scale));
  }

  .tl-binding {
    fill: var(--tl-selectFill);
    stroke: var(--tl-selectStroke);
    stroke-width: calc(1px * var(--tl-scale));
    pointer-events: none;
  }

  .tl-user {
    left: -4px;
    top: -4px;
    height: 8px;
    width: 8px;
    border-radius: 100%;
    pointer-events: none;
  }

  .tl-indicator {
    fill: transparent;
    stroke-width: calc(1.5px * var(--tl-scale));
    pointer-events: none;
  }

  .tl-indicator-container {
    transform-origin: 0 0;
    fill: transparent;
    stroke-width: calc(1.5px * var(--tl-scale));
    pointer-events: none;
  }

  .tl-user-indicator-bounds {
    border-style: solid;
    border-width: calc(1px * var(--tl-scale));
  }

  .tl-selected {
    stroke: var(--tl-selectStroke);
  }

  .tl-hovered {
    stroke: var(--tl-selectStroke);
  }

  .tl-clone-target {
    pointer-events: all;
  }

  .tl-clone-target:hover .tl-clone-button {
    opacity: 1;
  }

  .tl-clone-button-target {
    cursor: pointer;
    pointer-events: all;
  }

  .tl-clone-button-target:hover .tl-clone-button {
    fill: var(--tl-selectStroke);
  }

  .tl-clone-button {
    opacity: 0;
    r: calc(8px * var(--tl-scale));
    stroke-width: calc(1.5px * var(--tl-scale));
    stroke: var(--tl-selectStroke);
    fill: var(--tl-background);
  }

  .tl-bounds {
    pointer-events: none;
    contain: layout style size;
  }

  .tl-bounds-bg {
    stroke: none;
    fill: var(--tl-selectFill);
    pointer-events: all;
    contain: layout style size;
  }

  .tl-bounds-fg {
    fill: transparent;
    stroke: var(--tl-selectStroke);
    stroke-width: calc(1.5px * var(--tl-scale));
  }

  .tl-brush {
    fill: var(--tl-brushFill);
    stroke: var(--tl-brushStroke);
    stroke-width: calc(1px * var(--tl-scale));
    pointer-events: none;
  }

  .tl-dot {
    fill: var(--tl-background);
    stroke: var(--tl-foreground);
    stroke-width: 2px;
  }

  .tl-handle {
    fill: var(--tl-background);
    stroke: var(--tl-selectStroke);
    stroke-width: 1.5px;
    pointer-events: none;
  }

  .tl-handle-bg {
    fill: transparent;
    stroke: none;
    r: calc(16px / max(1, var(--tl-zoom)));
    pointer-events: all;
    cursor: grab;
  }

  .tl-handle-bg:active {
    pointer-events: all;
    fill: none;
  }

  .tl-handle-bg:hover {
    cursor: grab;
    fill: var(--tl-selectFill);
  }

  .tl-binding-indicator {
    stroke-width: calc(3px * var(--tl-scale));
    fill: var(--tl-selectFill);
    stroke: var(--tl-selectStroke);
  }

  .tl-centered {
    display: grid;
    place-content: center;
    place-items: center;
  }

  .tl-centered > * {
    grid-column: 1;
    grid-row: 1;
  }

  .tl-centered-g {
    transform: translate(var(--tl-padding), var(--tl-padding));
  }

  .tl-current-parent > *[data-shy='true'] {
    opacity: 1;
  }

  .tl-binding {
    fill: none;
    stroke: var(--tl-selectStroke);
    stroke-width: calc(2px * var(--tl-scale));
  }

  .tl-grid-dot {
    fill: var(--tl-grid);
  }

  .tl-counter-scaled-positioned {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    padding: 0;
    contain: layout style size;
  }

  .tl-fade-in {
    opacity: 1;
    transition-timing-function: ease-in-out;
    transition-property: opacity;
    transition-duration: 0.12s;
    transition-delay: 0;
  }

  .tl-fade-out {
    opacity: 0;
    transition-timing-function: ease-out;
    transition-property: opacity;
    transition-duration: 0.12s;
    transition-delay: 0;
  }

  .tl-counter-scaled-positioned > .tl-positioned-div {
    user-select: none;
    padding: 64px;
  }

  .tl-context-bar > * {
    grid-column: 1;
    grid-row: 1;
  }

  .tl-bounds-detail {
    padding: 2px 3px;
    border-radius: 1px;
    white-space: nowrap;
    width: fit-content;
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    background-color: var(--tl-selectStroke);
    color: var(--tl-background);
  }

  .tl-hitarea-stroke {
    fill: none;
    stroke: transparent;
    pointer-events: stroke;
    stroke-width: min(100px, calc(24px * var(--tl-scale)));
  }

  .tl-hitarea-fill {
    fill: transparent;
    stroke: transparent;
    pointer-events: all;
    stroke-width: min(100px, calc(24px * var(--tl-scale)));
  }

  .tl-grid {
    position: absolute;
    width: 100%;
    height: 100%;
    touch-action: none;
    pointer-events: none;
    user-select: none;
  }

  .tl-grid-dot {
    fill: var(--tl-grid);
  }

  .tl-html-canvas {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    zindex: 20000;
    pointer-events: none;
    border: 2px solid red;
  }

  .tl-direction-indicator {
    z-index: 100000;
    position: absolute;
    top: 0px;
    left: 0px;
    fill: var(--tl-selectStroke);
  }
`;
function useStylesheet(theme, selector) {
  const tltheme = React8.useMemo(() => __spreadValues3(__spreadValues3({}, defaultTheme), theme), [theme]);
  useTheme("tl", tltheme, selector);
  useStyle("tl-canvas", tlcss);
}
function useCanvasEvents() {
  const app = useApp();
  const { callbacks } = useRendererContext();
  const events = React9.useMemo(() => {
    const onPointerMove = (e) => {
      var _a2;
      const { order = 0 } = e;
      (_a2 = callbacks.onPointerMove) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Canvas, order }, e);
    };
    const onPointerDown = (e) => {
      var _a2, _b;
      const { order = 0 } = e;
      if (!order)
        (_a2 = e.currentTarget) == null ? void 0 : _a2.setPointerCapture(e.pointerId);
      (_b = callbacks.onPointerDown) == null ? void 0 : _b.call(callbacks, { type: TLTargetType.Canvas, order }, e);
    };
    const onPointerUp = (e) => {
      var _a2, _b;
      const { order = 0 } = e;
      if (!order)
        (_a2 = e.currentTarget) == null ? void 0 : _a2.releasePointerCapture(e.pointerId);
      (_b = callbacks.onPointerUp) == null ? void 0 : _b.call(callbacks, { type: TLTargetType.Canvas, order }, e);
    };
    const onPointerEnter = (e) => {
      var _a2;
      const { order = 0 } = e;
      (_a2 = callbacks.onPointerEnter) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Canvas, order }, e);
    };
    const onPointerLeave = (e) => {
      var _a2;
      const { order = 0 } = e;
      (_a2 = callbacks.onPointerLeave) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Canvas, order }, e);
    };
    const onDrop = (e) => __async(this, null, function* () {
      var _a2;
      e.preventDefault();
      if (!((_a2 = e.dataTransfer.files) == null ? void 0 : _a2.length))
        return;
      const point = [e.clientX, e.clientY];
      app.dropFiles(e.dataTransfer.files, point);
    });
    const onDragOver = (e) => {
      e.preventDefault();
    };
    return {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerEnter,
      onPointerLeave,
      onDrop,
      onDragOver
    };
  }, [callbacks]);
  return events;
}
function useGestureEvents(ref) {
  const { viewport, inputs, callbacks } = useRendererContext();
  const events = React10.useMemo(() => {
    const onWheel = (gesture) => {
      var _a2;
      const { event, delta } = gesture;
      event.preventDefault();
      if (inputs.state === "pinching")
        return;
      if (src_default.isEqual(delta, [0, 0]))
        return;
      (_a2 = callbacks.onWheel) == null ? void 0 : _a2.call(callbacks, {
        type: TLTargetType.Canvas,
        order: 0,
        delta: gesture.delta,
        point: inputs.currentPoint
      }, event);
    };
    const onPinchStart = (gesture) => {
      var _a2;
      const elm = ref.current;
      const { event } = gesture;
      if (!(event.target === elm || (elm == null ? void 0 : elm.contains(event.target))))
        return;
      if (inputs.state !== "idle")
        return;
      (_a2 = callbacks.onPinchStart) == null ? void 0 : _a2.call(callbacks, {
        type: TLTargetType.Canvas,
        order: 0,
        delta: gesture.delta,
        offset: gesture.offset,
        point: gesture.origin
      }, event);
    };
    const onPinch = (gesture) => {
      var _a2;
      const elm = ref.current;
      const { event } = gesture;
      if (!(event.target === elm || (elm == null ? void 0 : elm.contains(event.target))))
        return;
      if (inputs.state !== "pinching")
        return;
      (_a2 = callbacks.onPinch) == null ? void 0 : _a2.call(callbacks, {
        type: TLTargetType.Canvas,
        order: 0,
        delta: gesture.delta,
        offset: gesture.offset,
        point: gesture.origin
      }, event);
    };
    const onPinchEnd = (gesture) => {
      var _a2;
      const elm = ref.current;
      const { event } = gesture;
      if (!(event.target === elm || (elm == null ? void 0 : elm.contains(event.target))))
        return;
      if (inputs.state !== "pinching")
        return;
      (_a2 = callbacks.onPinchEnd) == null ? void 0 : _a2.call(callbacks, {
        type: TLTargetType.Canvas,
        order: 0,
        delta: gesture.delta,
        offset: gesture.offset,
        point: gesture.origin
      }, event);
    };
    return {
      onWheel,
      onPinchStart,
      onPinchEnd,
      onPinch
    };
  }, [callbacks]);
  useGesture(events, {
    target: ref,
    eventOptions: { passive: false },
    pinch: {
      from: viewport.camera.zoom,
      scaleBounds: () => ({ from: viewport.camera.zoom, max: 8, min: 0.1 })
    }
  });
}
function useCounterScaledPosition(ref, bounds, zoom, zIndex) {
  React11.useLayoutEffect(() => {
    const elm = ref.current;
    if (!elm)
      return;
    elm.style.setProperty("transform", `translate(
          calc(${bounds.minX - 64}px),
          calc(${bounds.minY - 64}px)
        )
        scale(var(--tl-scale))`);
  }, [bounds.minX, bounds.minY]);
  React11.useLayoutEffect(() => {
    const elm = ref.current;
    if (!elm)
      return;
    elm.style.setProperty("width", `calc(${Math.floor(bounds.width)}px + 64px * 2)`);
    elm.style.setProperty("height", `calc(${Math.floor(bounds.height)}px + 64px * 2)`);
    elm.style.setProperty("z-index", "10003");
  }, [bounds.width, bounds.height, zoom]);
  React11.useLayoutEffect(() => {
    const elm = ref.current;
    if (!elm)
      return;
    elm.style.setProperty("z-index", zIndex.toString());
  }, [zIndex]);
}
function useSetup(app, props) {
  const {
    onPersist,
    onSave,
    onSaveAs,
    onError,
    onMount,
    onCreateAssets,
    onCreateShapes,
    onDeleteAssets,
    onDeleteShapes,
    onFileDrop
  } = props;
  React12.useLayoutEffect(() => {
    const unsubs = [];
    if (!app)
      return;
    app.history.reset();
    if (typeof window !== void 0)
      window["tln"] = app;
    if (onMount)
      onMount(app, null);
    return () => {
      unsubs.forEach((unsub) => unsub());
      app.dispose();
    };
  }, [app]);
  React12.useLayoutEffect(() => {
    const unsubs = [];
    if (onPersist)
      unsubs.push(app.subscribe("persist", onPersist));
    if (onSave)
      unsubs.push(app.subscribe("save", onSave));
    if (onSaveAs)
      unsubs.push(app.subscribe("saveAs", onSaveAs));
    if (onError)
      unsubs.push(app.subscribe("error", onError));
    if (onCreateShapes)
      unsubs.push(app.subscribe("create-shapes", onCreateShapes));
    if (onCreateAssets)
      unsubs.push(app.subscribe("create-assets", onCreateAssets));
    if (onDeleteShapes)
      unsubs.push(app.subscribe("delete-shapes", onDeleteShapes));
    if (onDeleteAssets)
      unsubs.push(app.subscribe("delete-assets", onDeleteAssets));
    if (onFileDrop)
      unsubs.push(app.subscribe("drop-files", onFileDrop));
    return () => unsubs.forEach((unsub) => unsub());
  }, [app, onPersist, onSave, onSaveAs, onError]);
}
function useAppSetup(props) {
  if ("app" in props)
    return props.app;
  const [app] = React13.useState(() => new TLReactApp(props.model, props.Shapes, props.Tools));
  return app;
}
function usePropControl(app, props) {
  React14.useEffect(() => {
    if (!("model" in props))
      return;
    if (props.model)
      app.loadDocumentModel(props.model);
  }, [props.model]);
}
function usePreventNavigation(rCanvas) {
  const context = useRendererContext();
  const {
    viewport: { bounds }
  } = context;
  React15.useEffect(() => {
    const preventGestureNavigation = (event) => {
      event.preventDefault();
    };
    const preventNavigation = (event) => {
      const touchXPosition = event.touches[0].pageX;
      const touchXRadius = event.touches[0].radiusX || 0;
      if (touchXPosition - touchXRadius < 10 || touchXPosition + touchXRadius > bounds.width - 10) {
        event.preventDefault();
      }
    };
    const elm = rCanvas.current;
    if (!elm)
      return () => void 0;
    elm.addEventListener("touchstart", preventGestureNavigation);
    elm.addEventListener("gestureend", preventGestureNavigation);
    elm.addEventListener("gesturechange", preventGestureNavigation);
    elm.addEventListener("gesturestart", preventGestureNavigation);
    elm.addEventListener("touchstart", preventNavigation);
    return () => {
      if (elm) {
        elm.removeEventListener("touchstart", preventGestureNavigation);
        elm.removeEventListener("gestureend", preventGestureNavigation);
        elm.removeEventListener("gesturechange", preventGestureNavigation);
        elm.removeEventListener("gesturestart", preventGestureNavigation);
        elm.removeEventListener("touchstart", preventNavigation);
      }
    };
  }, [rCanvas, bounds.width]);
}
function useHandleEvents(shape, index) {
  const { inputs, callbacks } = useRendererContext();
  const events = React16.useMemo(() => {
    const onPointerMove = (e) => {
      var _a2;
      const { order = 0 } = e;
      const handle = shape.props.handles[index];
      (_a2 = callbacks.onPointerMove) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Handle, shape, handle, index, order }, e);
      e.order = order + 1;
    };
    const onPointerDown = (e) => {
      var _a2, _b;
      const { order = 0 } = e;
      if (!order)
        (_a2 = e.currentTarget) == null ? void 0 : _a2.setPointerCapture(e.pointerId);
      const handle = shape.props.handles[index];
      (_b = callbacks.onPointerDown) == null ? void 0 : _b.call(callbacks, { type: TLTargetType.Handle, shape, handle, index, order }, e);
      e.order = order + 1;
    };
    const onPointerUp = (e) => {
      var _a2, _b;
      const { order = 0 } = e;
      if (!order)
        (_a2 = e.currentTarget) == null ? void 0 : _a2.releasePointerCapture(e.pointerId);
      const handle = shape.props.handles[index];
      (_b = callbacks.onPointerUp) == null ? void 0 : _b.call(callbacks, { type: TLTargetType.Handle, shape, handle, index, order }, e);
      e.order = order + 1;
    };
    const onPointerEnter = (e) => {
      var _a2;
      const { order = 0 } = e;
      const handle = shape.props.handles[index];
      (_a2 = callbacks.onPointerEnter) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Handle, shape, handle, index, order }, e);
      e.order = order + 1;
    };
    const onPointerLeave = (e) => {
      var _a2;
      const { order = 0 } = e;
      const handle = shape.props.handles[index];
      (_a2 = callbacks.onPointerLeave) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Handle, shape, handle, index, order }, e);
      e.order = order + 1;
    };
    const onKeyDown = (e) => {
      var _a2;
      const handle = shape.props.handles[index];
      (_a2 = callbacks.onKeyDown) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Handle, shape, handle, index, order: -1 }, e);
    };
    const onKeyUp = (e) => {
      var _a2;
      const handle = shape.props.handles[index];
      (_a2 = callbacks.onKeyUp) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Handle, shape, handle, index, order: -1 }, e);
    };
    return {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerEnter,
      onPointerLeave,
      onKeyUp,
      onKeyDown
    };
  }, [shape.id, inputs, callbacks]);
  return events;
}
function getCursorCss(svg, r, f2 = false) {
  return `url("data:image/svg+xml,<svg height='32' width='32' viewBox='0 0 35 35' xmlns='http://www.w3.org/2000/svg'><g fill='none' style='transform-origin:center center' transform='rotate(${r})${f2 ? ` scale(-1,-1) translate(0, -32)` : ""}'>` + svg.replaceAll(`"`, `'`) + '</g></svg>") 16 16, pointer';
}
var CORNER_SVG = `<path d='m19.7432 17.0869-4.072 4.068 2.829 2.828-8.473-.013-.013-8.47 2.841 2.842 4.075-4.068 1.414-1.415-2.844-2.842h8.486v8.484l-2.83-2.827z' fill='%23fff'/><path d='m18.6826 16.7334-4.427 4.424 1.828 1.828-5.056-.016-.014-5.054 1.842 1.841 4.428-4.422 2.474-2.475-1.844-1.843h5.073v5.071l-1.83-1.828z' fill='%23000'/>`;
var EDGE_SVG = `<path d='m9 17.9907v.005l5.997 5.996.001-3.999h1.999 2.02v4l5.98-6.001-5.98-5.999.001 4.019-2.021.002h-2l.001-4.022zm1.411.003 3.587-3.588-.001 2.587h3.5 2.521v-2.585l3.565 3.586-3.564 3.585-.001-2.585h-2.521l-3.499-.001-.001 2.586z' fill='%23fff'/><path d='m17.4971 18.9932h2.521v2.586l3.565-3.586-3.565-3.585v2.605h-2.521-3.5v-2.607l-3.586 3.587 3.586 3.586v-2.587z' fill='%23000'/>`;
var ROTATE_CORNER_SVG = `<g><path d="M22.4789 9.45728L25.9935 12.9942L22.4789 16.5283V14.1032C18.126 14.1502 14.6071 17.6737 14.5675 22.0283H17.05L13.513 25.543L9.97889 22.0283H12.5674C12.6071 16.5691 17.0214 12.1503 22.4789 12.1031L22.4789 9.45728Z" fill="black"/><path fill-rule="evenodd" clip-rule="evenodd" d="M21.4789 7.03223L27.4035 12.9945L21.4789 18.9521V15.1868C18.4798 15.6549 16.1113 18.0273 15.649 21.0284H19.475L13.5128 26.953L7.55519 21.0284H11.6189C12.1243 15.8155 16.2679 11.6677 21.4789 11.1559L21.4789 7.03223ZM22.4789 12.1031C17.0214 12.1503 12.6071 16.5691 12.5674 22.0284H9.97889L13.513 25.543L17.05 22.0284H14.5675C14.5705 21.6896 14.5947 21.3558 14.6386 21.0284C15.1157 17.4741 17.9266 14.6592 21.4789 14.1761C21.8063 14.1316 22.1401 14.1069 22.4789 14.1032V16.5284L25.9935 12.9942L22.4789 9.45729L22.4789 12.1031Z" fill="white"/></g>`;
var TEXT_SVG = `<path d='m6.94 2v-1c-1.35866267-.08246172-2.66601117.53165299-3.47 1.63-.80398883-1.09834701-2.11133733-1.71246172-3.47-1.63v1c1.30781678-.16635468 2.55544738.59885876 3 1.84v5.1h-1v1h1v4.16c-.4476345 1.2386337-1.69302129 2.002471-3 1.84v1c1.35687108.0731933 2.6600216-.5389494 3.47-1.63.8099784 1.0910506 2.11312892 1.7031933 3.47 1.63v-1c-1.28590589.133063-2.49760499-.6252793-2.94-1.84v-4.18h1v-1h-1v-5.08c.43943906-1.21710975 1.65323743-1.97676587 2.94-1.84z' transform='translate(14 9)'/>`;
var GRABBING_SVG = `<path d='m13.5732 12.0361c.48-.178 1.427-.069 1.677.473.213.462.396 1.241.406 1.075.024-.369-.024-1.167.137-1.584.117-.304.347-.59.686-.691.285-.086.62-.116.916-.055.313.064.642.287.765.499.362.623.368 1.899.385 1.831.064-.272.07-1.229.283-1.584.141-.235.497-.445.687-.479.294-.052.656-.068.964-.008.249.049.586.344.677.487.219.344.342 1.316.379 1.658.016.141.074-.393.293-.736.406-.639 1.844-.763 1.898.639.026.654.02.624.02 1.064 0 .516-.012.828-.04 1.202-.03.399-.116 1.304-.241 1.742-.086.301-.371.978-.653 1.384 0 0-1.074 1.25-1.191 1.812-.117.563-.078.567-.102.965-.023.399.121.923.121.923s-.801.104-1.234.034c-.391-.062-.875-.84-1-1.078-.172-.328-.539-.265-.682-.023-.224.383-.709 1.07-1.05 1.113-.669.084-2.055.03-3.14.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.283-.36-1.002-.929-1.243-1.985-.213-.936-.192-1.395.037-1.77.232-.381.67-.589.854-.625.208-.042.692-.039.875.062.223.123.313.159.488.391.23.307.312.456.213.121-.076-.262-.322-.595-.434-.97-.109-.361-.401-.943-.38-1.526.008-.221.103-.771.832-1.042' fill='%23fff'/><g stroke='%23000' stroke-width='.75'><path d='m13.5732 12.0361c.48-.178 1.427-.069 1.677.473.213.462.396 1.241.406 1.075.024-.369-.024-1.167.137-1.584.117-.304.347-.59.686-.691.285-.086.62-.116.916-.055.313.064.642.287.765.499.362.623.368 1.899.385 1.831.064-.272.07-1.229.283-1.584.141-.235.497-.445.687-.479.294-.052.656-.068.964-.008.249.049.586.344.677.487.219.344.342 1.316.379 1.658.016.141.074-.393.293-.736.406-.639 1.844-.763 1.898.639.026.654.02.624.02 1.064 0 .516-.012.828-.04 1.202-.03.399-.116 1.304-.241 1.742-.086.301-.371.978-.653 1.384 0 0-1.074 1.25-1.191 1.812-.117.563-.078.567-.102.965-.023.399.121.923.121.923s-.801.104-1.234.034c-.391-.062-.875-.84-1-1.078-.172-.328-.539-.265-.682-.023-.224.383-.709 1.07-1.05 1.113-.669.084-2.055.03-3.14.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.283-.36-1.002-.929-1.243-1.985-.213-.936-.192-1.395.037-1.77.232-.381.67-.589.854-.625.208-.042.692-.039.875.062.223.123.313.159.488.391.23.307.312.456.213.121-.076-.262-.322-.595-.434-.97-.109-.361-.401-.943-.38-1.526.008-.221.103-.771.832-1.042z' stroke-linejoin='round'/><path d='m20.5664 19.7344v-3.459' stroke-linecap='round'/><path d='m18.5508 19.7461-.016-3.473' stroke-linecap='round'/><path d='m16.5547 16.3047.021 3.426' stroke-linecap='round'/></g>`;
var GRAB_SVG = `<path d="m13.5557 17.5742c-.098-.375-.196-.847-.406-1.552-.167-.557-.342-.859-.47-1.233-.155-.455-.303-.721-.496-1.181-.139-.329-.364-1.048-.457-1.44-.119-.509.033-.924.244-1.206.253-.339.962-.49 1.357-.351.371.13.744.512.916.788.288.46.357.632.717 1.542.393.992.564 1.918.611 2.231l.085.452c-.001-.04-.043-1.122-.044-1.162-.035-1.029-.06-1.823-.038-2.939.002-.126.064-.587.084-.715.078-.5.305-.8.673-.979.412-.201.926-.215 1.401-.017.423.173.626.55.687 1.022.014.109.094.987.093 1.107-.013 1.025.006 1.641.015 2.174.004.231.003 1.625.017 1.469.061-.656.094-3.189.344-3.942.144-.433.405-.746.794-.929.431-.203 1.113-.07 1.404.243.285.305.446.692.482 1.153.032.405-.019.897-.02 1.245 0 .867-.021 1.324-.037 2.121-.001.038-.015.298.023.182.094-.28.188-.542.266-.745.049-.125.241-.614.359-.859.114-.234.211-.369.415-.688.2-.313.415-.448.668-.561.54-.235 1.109.112 1.301.591.086.215.009.713-.028 1.105-.061.647-.254 1.306-.352 1.648-.128.447-.274 1.235-.34 1.601-.072.394-.234 1.382-.359 1.82-.086.301-.371.978-.652 1.384 0 0-1.074 1.25-1.192 1.812-.117.563-.078.567-.101.965-.024.399.121.923.121.923s-.802.104-1.234.034c-.391-.062-.875-.841-1-1.078-.172-.328-.539-.265-.682-.023-.225.383-.709 1.07-1.051 1.113-.668.084-2.054.03-3.139.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.284-.36-.629-1.093-1.243-1.985-.348-.504-1.027-1.085-1.284-1.579-.223-.425-.331-.954-.19-1.325.225-.594.675-.897 1.362-.832.519.05.848.206 1.238.537.225.19.573.534.75.748.163.195.203.276.377.509.23.307.302.459.214.121" fill="%23fff"/><g stroke="%23000" stroke-linecap="round" stroke-width=".75"><path d="m13.5557 17.5742c-.098-.375-.196-.847-.406-1.552-.167-.557-.342-.859-.47-1.233-.155-.455-.303-.721-.496-1.181-.139-.329-.364-1.048-.457-1.44-.119-.509.033-.924.244-1.206.253-.339.962-.49 1.357-.351.371.13.744.512.916.788.288.46.357.632.717 1.542.393.992.564 1.918.611 2.231l.085.452c-.001-.04-.043-1.122-.044-1.162-.035-1.029-.06-1.823-.038-2.939.002-.126.064-.587.084-.715.078-.5.305-.8.673-.979.412-.201.926-.215 1.401-.017.423.173.626.55.687 1.022.014.109.094.987.093 1.107-.013 1.025.006 1.641.015 2.174.004.231.003 1.625.017 1.469.061-.656.094-3.189.344-3.942.144-.433.405-.746.794-.929.431-.203 1.113-.07 1.404.243.285.305.446.692.482 1.153.032.405-.019.897-.02 1.245 0 .867-.021 1.324-.037 2.121-.001.038-.015.298.023.182.094-.28.188-.542.266-.745.049-.125.241-.614.359-.859.114-.234.211-.369.415-.688.2-.313.415-.448.668-.561.54-.235 1.109.112 1.301.591.086.215.009.713-.028 1.105-.061.647-.254 1.306-.352 1.648-.128.447-.274 1.235-.34 1.601-.072.394-.234 1.382-.359 1.82-.086.301-.371.978-.652 1.384 0 0-1.074 1.25-1.192 1.812-.117.563-.078.567-.101.965-.024.399.121.923.121.923s-.802.104-1.234.034c-.391-.062-.875-.841-1-1.078-.172-.328-.539-.265-.682-.023-.225.383-.709 1.07-1.051 1.113-.668.084-2.054.03-3.139.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.284-.36-.629-1.093-1.243-1.985-.348-.504-1.027-1.085-1.284-1.579-.223-.425-.331-.954-.19-1.325.225-.594.675-.897 1.362-.832.519.05.848.206 1.238.537.225.19.573.534.75.748.163.195.203.276.377.509.23.307.302.459.214.121" stroke-linejoin="round"/><path d="m20.5664 21.7344v-3.459"/><path d="m18.5508 21.7461-.016-3.473"/><path d="m16.5547 18.3047.021 3.426"/></g>`;
var CURSORS22 = {
  [TLCursor.None]: (r, f2) => "none",
  [TLCursor.Default]: (r, f2) => "default",
  [TLCursor.Pointer]: (r, f2) => "pointer",
  [TLCursor.Cross]: (r, f2) => "crosshair",
  [TLCursor.Move]: (r, f2) => "move",
  [TLCursor.Grab]: (r, f2) => getCursorCss(GRAB_SVG, r, f2),
  [TLCursor.Grabbing]: (r, f2) => getCursorCss(GRABBING_SVG, r, f2),
  [TLCursor.Text]: (r, f2) => getCursorCss(TEXT_SVG, r, f2),
  [TLCursor.ResizeEdge]: (r, f2) => getCursorCss(EDGE_SVG, r, f2),
  [TLCursor.ResizeCorner]: (r, f2) => getCursorCss(CORNER_SVG, r, f2),
  [TLCursor.EwResize]: (r, f2) => getCursorCss(EDGE_SVG, r, f2),
  [TLCursor.NsResize]: (r, f2) => getCursorCss(EDGE_SVG, r + 90, f2),
  [TLCursor.NeswResize]: (r, f2) => getCursorCss(CORNER_SVG, r, f2),
  [TLCursor.NwseResize]: (r, f2) => getCursorCss(CORNER_SVG, r + 90, f2),
  [TLCursor.Rotate]: (r, f2) => getCursorCss(ROTATE_CORNER_SVG, r + 45, f2),
  [TLCursor.NwseRotate]: (r, f2) => getCursorCss(ROTATE_CORNER_SVG, r, f2),
  [TLCursor.NeswRotate]: (r, f2) => getCursorCss(ROTATE_CORNER_SVG, r + 90, f2),
  [TLCursor.SenwRotate]: (r, f2) => getCursorCss(ROTATE_CORNER_SVG, r + 180, f2),
  [TLCursor.SwneRotate]: (r, f2) => getCursorCss(ROTATE_CORNER_SVG, r + 270, f2)
};
function useCursor(ref, cursor, rotation = 0) {
  React17.useEffect(() => {
    const elm = ref.current;
    if (!elm)
      return;
    elm.style.setProperty("--tl-cursor", CURSORS22[cursor](GeomUtils.radiansToDegrees(rotation)));
  }, [cursor, rotation]);
}
function useZoom(ref) {
  const { viewport } = useRendererContext();
  React18.useLayoutEffect(() => {
    return autorun(() => {
      const { zoom } = viewport.camera;
      const container = ref.current;
      if (!container)
        return;
      container.style.setProperty("--tl-zoom", zoom.toString());
    });
  }, []);
}
var stopEventPropagation = (e) => e.stopPropagation();
var ContextBarContainer = observer(function ContextBar({
  shapes: shapes2,
  hidden,
  bounds,
  rotation = 0
}) {
  const {
    components: { ContextBar: ContextBar22 },
    viewport: {
      bounds: vpBounds,
      camera: {
        point: [x, y],
        zoom
      }
    }
  } = useRendererContext();
  const rBounds = React19.useRef(null);
  const rotatedBounds = BoundsUtils.getRotatedBounds(bounds, rotation);
  const scaledBounds = BoundsUtils.multiplyBounds(rotatedBounds, zoom);
  useCounterScaledPosition(rBounds, scaledBounds, zoom, 10003);
  if (!ContextBar22)
    throw Error("Expected a ContextBar component.");
  const screenBounds = BoundsUtils.translateBounds(scaledBounds, [x, y]);
  const offsets = {
    left: screenBounds.minX,
    right: vpBounds.width - screenBounds.maxX,
    top: screenBounds.minY,
    bottom: vpBounds.height - screenBounds.maxY,
    width: screenBounds.width,
    height: screenBounds.height
  };
  const inView = BoundsUtils.boundsContain(vpBounds, screenBounds) || BoundsUtils.boundsCollide(vpBounds, screenBounds);
  React19.useLayoutEffect(() => {
    const elm = rBounds.current;
    if (!elm)
      return;
    if (hidden || !inView) {
      elm.classList.add("tl-fade-out");
      elm.classList.remove("tl-fade-in");
    } else {
      elm.classList.add("tl-fade-in");
      elm.classList.remove("tl-fade-out");
    }
  }, [hidden, inView]);
  return /* @__PURE__ */ React19.createElement("div", {
    ref: rBounds,
    className: "tl-counter-scaled-positioned tl-fade-out",
    "aria-label": "context-bar-container",
    onPointerMove: stopEventPropagation,
    onPointerUp: stopEventPropagation,
    onPointerDown: stopEventPropagation
  }, /* @__PURE__ */ React19.createElement(ContextBar22, {
    shapes: shapes2,
    bounds,
    offset: offsets,
    scaledBounds,
    rotation
  }));
});
var HTMLLayer = observer(function HTMLLayer2({ children }) {
  const rLayer = React20.useRef(null);
  const { viewport } = useRendererContext();
  React20.useEffect(() => autorun(() => {
    const layer = rLayer.current;
    if (!layer)
      return;
    const { zoom, point } = viewport.camera;
    layer.style.setProperty("transform", `scale(${zoom}) translate(${point[0]}px, ${point[1]}px)`);
  }), []);
  return /* @__PURE__ */ React20.createElement("div", {
    ref: rLayer,
    className: "tl-absolute tl-layer"
  }, children);
});
var Indicator = observer(function Shape({
  shape,
  isHovered = false,
  isSelected = false,
  isBinding = false,
  isEditing = false,
  meta
}) {
  const {
    bounds,
    props: { scale, rotation = 0 },
    ReactIndicator
  } = shape;
  return /* @__PURE__ */ React21.createElement(Container, {
    bounds,
    rotation,
    scale,
    zIndex: 1e4
  }, /* @__PURE__ */ React21.createElement(SVGContainer, null, /* @__PURE__ */ React21.createElement("g", {
    className: `tl-indicator-container ${isSelected ? "tl-selected" : "tl-hovered"}`
  }, /* @__PURE__ */ React21.createElement(ReactIndicator, {
    isEditing,
    isBinding,
    isHovered,
    isSelected,
    isErasing: false,
    meta
  }))));
});
function useShapeEvents(shape) {
  const { inputs, callbacks } = useRendererContext();
  const rDoubleClickTimer = React222.useRef(-1);
  const events = React222.useMemo(() => {
    const onPointerMove = (e) => {
      var _a2;
      const { order = 0 } = e;
      (_a2 = callbacks.onPointerMove) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Shape, shape, order }, e);
      e.order = order + 1;
    };
    const onPointerDown = (e) => {
      var _a2, _b;
      const { order = 0 } = e;
      if (!order)
        (_a2 = e.currentTarget) == null ? void 0 : _a2.setPointerCapture(e.pointerId);
      (_b = callbacks.onPointerDown) == null ? void 0 : _b.call(callbacks, { type: TLTargetType.Shape, shape, order }, e);
      e.order = order + 1;
    };
    const onPointerUp = (e) => {
      var _a2, _b, _c;
      const { order = 0 } = e;
      if (!order)
        (_a2 = e.currentTarget) == null ? void 0 : _a2.releasePointerCapture(e.pointerId);
      (_b = callbacks.onPointerUp) == null ? void 0 : _b.call(callbacks, { type: TLTargetType.Shape, shape, order }, e);
      const now = Date.now();
      const elapsed = now - rDoubleClickTimer.current;
      if (elapsed > DOUBLE_CLICK_DURATION) {
        rDoubleClickTimer.current = now;
      } else {
        if (elapsed <= DOUBLE_CLICK_DURATION) {
          (_c = callbacks.onDoubleClick) == null ? void 0 : _c.call(callbacks, { type: TLTargetType.Shape, shape, order }, e);
          rDoubleClickTimer.current = -1;
        }
      }
      e.order = order + 1;
    };
    const onPointerEnter = (e) => {
      var _a2;
      const { order = 0 } = e;
      (_a2 = callbacks.onPointerEnter) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Shape, shape, order }, e);
      e.order = order + 1;
    };
    const onPointerLeave = (e) => {
      var _a2;
      const { order = 0 } = e;
      (_a2 = callbacks.onPointerLeave) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Shape, shape, order }, e);
      e.order = order + 1;
    };
    const onKeyDown = (e) => {
      var _a2;
      (_a2 = callbacks.onKeyDown) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Shape, shape, order: -1 }, e);
      e.stopPropagation();
    };
    const onKeyUp = (e) => {
      var _a2;
      (_a2 = callbacks.onKeyUp) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Shape, shape, order: -1 }, e);
      e.stopPropagation();
    };
    return {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerEnter,
      onPointerLeave,
      onKeyUp,
      onKeyDown
    };
  }, [shape.id, inputs, callbacks]);
  return events;
}
var Shape2 = observer(function Shape3({
  shape,
  isHovered = false,
  isSelected = false,
  isBinding = false,
  isErasing = false,
  isEditing = false,
  onEditingEnd,
  asset,
  meta
}) {
  const {
    bounds,
    props: { rotation, scale },
    ReactComponent
  } = shape;
  const events = useShapeEvents(shape);
  return /* @__PURE__ */ React23.createElement(Container, {
    bounds,
    rotation,
    scale
  }, /* @__PURE__ */ React23.createElement(ReactComponent, {
    meta,
    isEditing,
    isBinding,
    isHovered,
    isSelected,
    isErasing,
    events,
    asset,
    onEditingEnd
  }));
});
var SVGLayer = observer(function SVGLayer2({ children }) {
  const rGroup = React24.useRef(null);
  const { viewport } = useRendererContext();
  React24.useEffect(() => autorun(() => {
    const group = rGroup.current;
    if (!group)
      return;
    const { zoom, point } = viewport.camera;
    group.style.setProperty("transform", `scale(${zoom}) translateX(${point[0]}px) translateY(${point[1]}px)`);
  }), []);
  return /* @__PURE__ */ React24.createElement("svg", {
    className: "tl-absolute tl-overlay",
    pointerEvents: "none"
  }, /* @__PURE__ */ React24.createElement("g", {
    ref: rGroup,
    pointerEvents: "none"
  }, children));
});
var AppProvider = observer(function App(props) {
  const app = useAppSetup(props);
  const context = getAppContext(props.id);
  usePropControl(app, props);
  useSetup(app, props);
  return /* @__PURE__ */ React25.createElement(context.Provider, {
    value: app
  }, props.children);
});
function Renderer(_a2) {
  var _b = _a2, {
    viewport,
    inputs,
    callbacks,
    components: components2
  } = _b, rest = __objRest(_b, [
    "viewport",
    "inputs",
    "callbacks",
    "components"
  ]);
  return /* @__PURE__ */ React26.createElement(RendererContext, {
    id: rest.id,
    viewport,
    inputs,
    callbacks,
    components: components2,
    meta: rest.meta
  }, /* @__PURE__ */ React26.createElement(Canvas, __spreadValues3({}, rest)));
}
var DirectionIndicator = observer(function DirectionIndicator2({ direction }) {
  const {
    viewport: { bounds }
  } = useRendererContext();
  const rIndicator = React27.useRef(null);
  React27.useLayoutEffect(() => {
    const elm = rIndicator.current;
    if (!elm)
      return;
    const center = [bounds.width / 2, bounds.height / 2];
    const insetBoundSides = BoundsUtils.getRectangleSides([12, 12], [bounds.width - 24, bounds.height - 24]);
    for (const [A, B] of insetBoundSides) {
      const int = intersectRayLineSegment(center, direction, A, B);
      if (!int.didIntersect)
        continue;
      const point = int.points[0];
      elm.style.setProperty("transform", `translate(${point[0] - 6}px,${point[1] - 6}px) rotate(${src_default.toAngle(direction)}rad)`);
    }
  }, [direction, bounds]);
  return /* @__PURE__ */ React27.createElement("div", {
    ref: rIndicator,
    className: "tl-direction-indicator"
  }, /* @__PURE__ */ React27.createElement("svg", {
    height: 12,
    width: 12
  }, /* @__PURE__ */ React27.createElement("polygon", {
    points: "0,0 12,6 0,12"
  })));
});
function useKeyboardEvents() {
  const { callbacks } = useRendererContext();
  React28.useEffect(() => {
    const onKeyDown = (e) => {
      var _a2;
      (_a2 = callbacks.onKeyDown) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Canvas, order: -1 }, e);
    };
    const onKeyUp = (e) => {
      var _a2;
      (_a2 = callbacks.onKeyUp) == null ? void 0 : _a2.call(callbacks, { type: TLTargetType.Canvas, order: -1 }, e);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}
var Canvas = observer(function Renderer2({
  id,
  className,
  brush,
  shapes: shapes2,
  assets,
  bindingShape,
  editingShape,
  hoveredShape,
  selectionBounds,
  selectedShapes,
  erasingShapes,
  selectionDirectionHint,
  cursor = TLCursor.Default,
  cursorRotation = 0,
  selectionRotation = 0,
  showSelection = true,
  showHandles = true,
  showSelectionRotation = false,
  showResizeHandles = true,
  showRotateHandles = true,
  showSelectionDetail = true,
  showContextBar = true,
  showGrid = true,
  gridSize = 8,
  onEditingEnd = NOOP,
  theme = EMPTY_OBJECT2,
  children
}) {
  const rContainer = React29.useRef(null);
  const { viewport, components: components2, meta } = useRendererContext();
  const { zoom } = viewport.camera;
  useStylesheet(theme, id);
  usePreventNavigation(rContainer);
  useResizeObserver(rContainer, viewport);
  useGestureEvents(rContainer);
  useCursor(rContainer, cursor, cursorRotation);
  useZoom(rContainer);
  useKeyboardEvents();
  const events = useCanvasEvents();
  const onlySelectedShape = (selectedShapes == null ? void 0 : selectedShapes.length) === 1 && selectedShapes[0];
  const onlySelectedShapeWithHandles = onlySelectedShape && "handles" in onlySelectedShape.props ? selectedShapes == null ? void 0 : selectedShapes[0] : void 0;
  const selectedShapesSet = React29.useMemo(() => new Set(selectedShapes || []), [selectedShapes]);
  const erasingShapesSet = React29.useMemo(() => new Set(erasingShapes || []), [erasingShapes]);
  return /* @__PURE__ */ React29.createElement("div", {
    ref: rContainer,
    className: `tl-container ${className != null ? className : ""}`
  }, /* @__PURE__ */ React29.createElement("div", __spreadValues3({
    tabIndex: -1,
    className: "tl-absolute tl-canvas"
  }, events), showGrid && components2.Grid && /* @__PURE__ */ React29.createElement(components2.Grid, {
    size: gridSize
  }), /* @__PURE__ */ React29.createElement(HTMLLayer, null, components2.SelectionBackground && selectedShapes && selectionBounds && showSelection && /* @__PURE__ */ React29.createElement(Container, {
    bounds: selectionBounds,
    zIndex: 2
  }, /* @__PURE__ */ React29.createElement(components2.SelectionBackground, {
    zoom,
    shapes: selectedShapes,
    bounds: selectionBounds,
    showResizeHandles,
    showRotateHandles
  })), shapes2 && shapes2.map((shape, i) => /* @__PURE__ */ React29.createElement(Shape2, {
    key: "shape_" + shape.id,
    shape,
    asset: assets && shape.props.assetId ? assets[shape.props.assetId] : void 0,
    isEditing: shape === editingShape,
    isHovered: shape === hoveredShape,
    isBinding: shape === bindingShape,
    isSelected: selectedShapesSet.has(shape),
    isErasing: erasingShapesSet.has(shape),
    meta,
    zIndex: 1e3 + i,
    onEditingEnd
  })), selectedShapes == null ? void 0 : selectedShapes.map((shape) => /* @__PURE__ */ React29.createElement(Indicator, {
    key: "selected_indicator_" + shape.id,
    shape,
    isEditing: shape === editingShape,
    isHovered: false,
    isBinding: false,
    isSelected: true
  })), hoveredShape && /* @__PURE__ */ React29.createElement(Indicator, {
    key: "hovered_indicator_" + hoveredShape.id,
    shape: hoveredShape
  }), brush && components2.Brush && /* @__PURE__ */ React29.createElement(components2.Brush, {
    bounds: brush
  }), selectedShapes && selectionBounds && /* @__PURE__ */ React29.createElement(React29.Fragment, null, showSelection && components2.SelectionForeground && /* @__PURE__ */ React29.createElement(Container, {
    bounds: selectionBounds,
    zIndex: 10002
  }, /* @__PURE__ */ React29.createElement(components2.SelectionForeground, {
    zoom,
    shapes: selectedShapes,
    bounds: selectionBounds,
    showResizeHandles,
    showRotateHandles
  })), showHandles && onlySelectedShapeWithHandles && components2.Handle && /* @__PURE__ */ React29.createElement(Container, {
    bounds: selectionBounds,
    zIndex: 10003
  }, /* @__PURE__ */ React29.createElement(SVGContainer, null, onlySelectedShapeWithHandles.props.handles.map((handle, i) => React29.createElement(components2.Handle, {
    key: `${handle.id}_handle_${i}`,
    shape: onlySelectedShapeWithHandles,
    handle,
    index: i
  })))), selectedShapes && components2.SelectionDetail && /* @__PURE__ */ React29.createElement(SelectionDetailContainer, {
    key: "detail" + selectedShapes.map((shape) => shape.id).join(""),
    shapes: selectedShapes,
    bounds: selectionBounds,
    detail: showSelectionRotation ? "rotation" : "size",
    hidden: !showSelectionDetail,
    rotation: selectionRotation
  }), selectedShapes && components2.ContextBar && /* @__PURE__ */ React29.createElement(ContextBarContainer, {
    key: "context" + selectedShapes.map((shape) => shape.id).join(""),
    shapes: selectedShapes,
    hidden: !showContextBar,
    bounds: selectedShapes.length === 1 ? selectedShapes[0].bounds : selectionBounds,
    rotation: selectedShapes.length === 1 ? selectedShapes[0].props.rotation : 0
  }))), selectionDirectionHint && selectionBounds && selectedShapes && /* @__PURE__ */ React29.createElement(DirectionIndicator, {
    direction: selectionDirectionHint,
    bounds: selectionBounds,
    shapes: selectedShapes
  })), children);
});
var RendererContext = observer(function App2({
  id = "noid",
  viewport,
  inputs,
  callbacks = EMPTY_OBJECT2,
  meta = EMPTY_OBJECT2,
  components: components2 = EMPTY_OBJECT2,
  children
}) {
  const [currentContext, setCurrentContext] = React30.useState(() => {
    const {
      Brush: Brush3,
      ContextBar: ContextBar22,
      DirectionIndicator: DirectionIndicator3,
      Grid: Grid3,
      Handle: Handle3,
      SelectionBackground: SelectionBackground3,
      SelectionDetail: SelectionDetail4,
      SelectionForeground: SelectionForeground3
    } = components2;
    return {
      id,
      viewport,
      inputs,
      callbacks,
      meta,
      components: {
        Brush: Brush3 === null ? void 0 : Brush,
        ContextBar: ContextBar22,
        DirectionIndicator: DirectionIndicator3 === null ? void 0 : DirectionIndicator,
        Grid: Grid3 === null ? void 0 : Grid,
        Handle: Handle3 === null ? void 0 : Handle,
        SelectionBackground: SelectionBackground3 === null ? void 0 : SelectionBackground,
        SelectionDetail: SelectionDetail4 === null ? void 0 : SelectionDetail,
        SelectionForeground: SelectionForeground3 === null ? void 0 : SelectionForeground
      }
    };
  });
  React30.useLayoutEffect(() => {
    const {
      Brush: Brush3,
      ContextBar: ContextBar22,
      DirectionIndicator: DirectionIndicator3,
      Grid: Grid3,
      Handle: Handle3,
      SelectionBackground: SelectionBackground3,
      SelectionDetail: SelectionDetail4,
      SelectionForeground: SelectionForeground3
    } = components2;
    return autorun(() => {
      setCurrentContext({
        id,
        viewport,
        inputs,
        callbacks,
        meta,
        components: {
          Brush: Brush3 === null ? void 0 : Brush,
          ContextBar: ContextBar22,
          DirectionIndicator: DirectionIndicator3 === null ? void 0 : DirectionIndicator,
          Grid: Grid3 === null ? void 0 : Grid,
          Handle: Handle3 === null ? void 0 : Handle,
          SelectionBackground: SelectionBackground3 === null ? void 0 : SelectionBackground,
          SelectionDetail: SelectionDetail4 === null ? void 0 : SelectionDetail,
          SelectionForeground: SelectionForeground3 === null ? void 0 : SelectionForeground
        }
      });
    });
  }, []);
  const context = getRendererContext(id);
  return /* @__PURE__ */ React30.createElement(context.Provider, {
    value: currentContext
  }, children);
});
var STEPS = [
  [-1, 0.15, 64],
  [0.05, 0.375, 16],
  [0.15, 1, 4],
  [0.7, 2.5, 1]
];
var Grid = observer(function Grid2({ size }) {
  const {
    viewport: {
      camera: { point, zoom }
    }
  } = useRendererContext();
  return /* @__PURE__ */ React31.createElement("svg", {
    className: "tl-grid",
    version: "1.1",
    xmlns: "http://www.w3.org/2000/svg"
  }, /* @__PURE__ */ React31.createElement("defs", null, STEPS.map(([min, mid, _size], i) => {
    const s = _size * size * zoom;
    const xo = point[0] * zoom;
    const yo = point[1] * zoom;
    const gxo = xo > 0 ? xo % s : s + xo % s;
    const gyo = yo > 0 ? yo % s : s + yo % s;
    const opacity = zoom < mid ? modulate(zoom, [min, mid], [0, 1]) : 1;
    return /* @__PURE__ */ React31.createElement("pattern", {
      key: `grid-pattern-${i}`,
      id: `grid-${i}`,
      width: s,
      height: s,
      patternUnits: "userSpaceOnUse"
    }, /* @__PURE__ */ React31.createElement("circle", {
      className: `tl-grid-dot`,
      cx: gxo,
      cy: gyo,
      r: 1,
      opacity
    }));
  })), STEPS.map((_15, i) => /* @__PURE__ */ React31.createElement("rect", {
    key: `grid-rect-${i}`,
    width: "100%",
    height: "100%",
    fill: `url(#grid-${i})`
  })));
});
var SelectionBackground = observer(function SelectionBackground2({
  bounds
}) {
  const events = useBoundsEvents("background");
  return /* @__PURE__ */ React322.createElement(SVGContainer, __spreadValues3({}, events), /* @__PURE__ */ React322.createElement("rect", {
    className: "tl-bounds-bg",
    width: Math.max(1, bounds.width),
    height: Math.max(1, bounds.height),
    pointerEvents: "all"
  }));
});
var SelectionDetail = observer(function SelectionDetail2({
  bounds,
  shapes: shapes2,
  scaledBounds,
  detail = "size",
  rotation = 0
}) {
  var _a2;
  const selectionRotation = shapes2.length === 1 ? rotation : (_a2 = bounds.rotation) != null ? _a2 : 0;
  const isFlipped = !(selectionRotation < TAU2 || selectionRotation > TAU2 * 3);
  const isLine = shapes2.length === 1 && shapes2[0].type === "line";
  return /* @__PURE__ */ React33.createElement(HTMLContainer, {
    centered: true
  }, /* @__PURE__ */ React33.createElement("div", {
    className: "tl-bounds-detail",
    style: {
      transform: isFlipped ? `rotate(${Math.PI + selectionRotation}rad) translateY(${scaledBounds.height / 2 + 32}px)` : `rotate(${selectionRotation}rad) translateY(${scaledBounds.height / 2 + 24}px)`,
      padding: "2px 3px",
      borderRadius: "1px"
    }
  }, isLine ? `${src_default.dist(shapes2[0].props.handles[0].point, shapes2[0].props.handles[1].point).toFixed()}` : detail === "size" ? `${bounds.width.toFixed()} \xD7 ${bounds.height.toFixed()}` : `\u2220${GeomUtils.radiansToDegrees(GeomUtils.clampRadians(rotation)).toFixed()}\xB0`));
});
var cornerBgClassnames = {
  [TLResizeCorner.TopLeft]: "tl-cursor-nwse",
  [TLResizeCorner.TopRight]: "tl-cursor-nesw",
  [TLResizeCorner.BottomRight]: "tl-cursor-nwse",
  [TLResizeCorner.BottomLeft]: "tl-cursor-nesw"
};
var CornerHandle = observer(function CornerHandle2({
  cx,
  cy,
  size,
  targetSize,
  corner,
  isHidden
}) {
  const events = useBoundsEvents(corner);
  return /* @__PURE__ */ React34.createElement("g", __spreadValues3({
    opacity: isHidden ? 0 : 1
  }, events), /* @__PURE__ */ React34.createElement("rect", {
    className: "tl-transparent " + (isHidden ? "" : cornerBgClassnames[corner]),
    "aria-label": `${corner} target`,
    x: cx - targetSize * 1.25,
    y: cy - targetSize * 1.25,
    width: targetSize * 2.5,
    height: targetSize * 2.5,
    pointerEvents: isHidden ? "none" : "all"
  }), /* @__PURE__ */ React34.createElement("rect", {
    className: "tl-corner-handle",
    "aria-label": `${corner} handle`,
    x: cx - size / 2,
    y: cy - size / 2,
    width: size,
    height: size,
    pointerEvents: "none"
  }));
});
var edgeClassnames = {
  [TLResizeEdge.Top]: "tl-cursor-ns",
  [TLResizeEdge.Right]: "tl-cursor-ew",
  [TLResizeEdge.Bottom]: "tl-cursor-ns",
  [TLResizeEdge.Left]: "tl-cursor-ew"
};
var EdgeHandle = observer(function EdgeHandle2({
  x,
  y,
  width,
  height,
  targetSize,
  edge,
  isHidden
}) {
  const events = useBoundsEvents(edge);
  return /* @__PURE__ */ React35.createElement("rect", __spreadValues3({
    pointerEvents: isHidden ? "none" : "all",
    className: "tl-transparent tl-edge-handle " + (isHidden ? "" : edgeClassnames[edge]),
    "aria-label": `${edge} target`,
    opacity: isHidden ? 0 : 1,
    x: x - targetSize,
    y: y - targetSize,
    width: Math.max(1, width + targetSize * 2),
    height: Math.max(1, height + targetSize * 2)
  }, events));
});
var RotateHandle = observer(function RotateHandle2({
  cx,
  cy,
  size,
  targetSize,
  isHidden
}) {
  const events = useBoundsEvents("rotate");
  return /* @__PURE__ */ React36.createElement("g", __spreadValues3({
    opacity: isHidden ? 0 : 1
  }, events), /* @__PURE__ */ React36.createElement("circle", {
    className: "tl-transparent ",
    "aria-label": "rotate target",
    cx,
    cy,
    r: targetSize,
    pointerEvents: isHidden ? "none" : "all"
  }), /* @__PURE__ */ React36.createElement("circle", {
    className: "tl-rotate-handle",
    "aria-label": "rotate handle",
    cx,
    cy,
    r: size / 2,
    pointerEvents: "none"
  }));
});
var RotateCornerHandle = observer(function RotateCornerHandle2({
  cx,
  cy,
  targetSize,
  corner,
  isHidden
}) {
  const events = useBoundsEvents(corner);
  return /* @__PURE__ */ React37.createElement("g", __spreadValues3({
    opacity: isHidden ? 0 : 1
  }, events), /* @__PURE__ */ React37.createElement("rect", {
    className: "tl-transparent",
    "aria-label": `${corner} target`,
    x: cx - targetSize * 2.5,
    y: cy - targetSize * 2.5,
    width: targetSize * 3,
    height: targetSize * 3,
    pointerEvents: isHidden ? "none" : "all"
  }));
});
var SelectionForeground = observer(function SelectionForeground2({
  bounds,
  zoom,
  showResizeHandles,
  showRotateHandles
}) {
  const { width, height } = bounds;
  const size = 8 / zoom;
  const targetSize = 6 / zoom;
  return /* @__PURE__ */ React38.createElement(SVGContainer, null, /* @__PURE__ */ React38.createElement("rect", {
    className: "tl-bounds-fg",
    width: Math.max(width, 1),
    height: Math.max(height, 1),
    pointerEvents: "none"
  }), /* @__PURE__ */ React38.createElement(EdgeHandle, {
    x: targetSize * 2,
    y: 0,
    width: width - targetSize * 4,
    height: 0,
    targetSize,
    edge: TLResizeEdge.Top,
    isHidden: !showResizeHandles
  }), /* @__PURE__ */ React38.createElement(EdgeHandle, {
    x: width,
    y: targetSize * 2,
    width: 0,
    height: height - targetSize * 4,
    targetSize,
    edge: TLResizeEdge.Right,
    isHidden: !showResizeHandles
  }), /* @__PURE__ */ React38.createElement(EdgeHandle, {
    x: targetSize * 2,
    y: height,
    width: width - targetSize * 4,
    height: 0,
    targetSize,
    edge: TLResizeEdge.Bottom,
    isHidden: !showResizeHandles
  }), /* @__PURE__ */ React38.createElement(EdgeHandle, {
    x: 0,
    y: targetSize * 2,
    width: 0,
    height: height - targetSize * 4,
    targetSize,
    edge: TLResizeEdge.Left,
    isHidden: !showResizeHandles
  }), /* @__PURE__ */ React38.createElement(RotateCornerHandle, {
    cx: 0,
    cy: 0,
    targetSize,
    corner: TLRotateCorner.TopLeft,
    isHidden: !showRotateHandles
  }), /* @__PURE__ */ React38.createElement(RotateCornerHandle, {
    cx: width + targetSize * 2,
    cy: 0,
    targetSize,
    corner: TLRotateCorner.TopRight,
    isHidden: !showRotateHandles
  }), /* @__PURE__ */ React38.createElement(RotateCornerHandle, {
    cx: width + targetSize * 2,
    cy: height + targetSize * 2,
    targetSize,
    corner: TLRotateCorner.BottomRight,
    isHidden: !showRotateHandles
  }), /* @__PURE__ */ React38.createElement(RotateCornerHandle, {
    cx: 0,
    cy: height + targetSize * 2,
    targetSize,
    corner: TLRotateCorner.BottomLeft,
    isHidden: !showRotateHandles
  }), /* @__PURE__ */ React38.createElement(CornerHandle, {
    cx: 0,
    cy: 0,
    size,
    targetSize,
    corner: TLResizeCorner.TopLeft,
    isHidden: !showResizeHandles
  }), /* @__PURE__ */ React38.createElement(CornerHandle, {
    cx: width,
    cy: 0,
    size,
    targetSize,
    corner: TLResizeCorner.TopRight,
    isHidden: !showResizeHandles
  }), /* @__PURE__ */ React38.createElement(CornerHandle, {
    cx: width,
    cy: height,
    size,
    targetSize,
    corner: TLResizeCorner.BottomRight,
    isHidden: !showResizeHandles
  }), /* @__PURE__ */ React38.createElement(CornerHandle, {
    cx: 0,
    cy: height,
    size,
    targetSize,
    corner: TLResizeCorner.BottomLeft,
    isHidden: !showResizeHandles
  }));
});
var Brush = observer(function Brush2({ bounds }) {
  return /* @__PURE__ */ React39.createElement(Container, {
    bounds,
    zIndex: 10001
  }, /* @__PURE__ */ React39.createElement(SVGContainer, null, /* @__PURE__ */ React39.createElement("rect", {
    className: "tl-brush",
    x: 0,
    y: 0,
    width: bounds.width,
    height: bounds.height
  })));
});
var Cursor = observer(function Cursor2() {
  return /* @__PURE__ */ React40.createElement(React40.Fragment, null);
});
var Handle = observer(function Handle2({
  shape,
  handle,
  index
}) {
  const events = useHandleEvents(shape, index);
  const [x, y] = handle.point;
  return /* @__PURE__ */ React41.createElement("g", __spreadProps3(__spreadValues3({
    className: "tl-handle",
    "aria-label": "handle"
  }, events), {
    transform: `translate(${x}, ${y})`
  }), /* @__PURE__ */ React41.createElement("circle", {
    className: "tl-handle-bg",
    pointerEvents: "all"
  }), /* @__PURE__ */ React41.createElement("circle", {
    className: "tl-counter-scaled tl-handle",
    pointerEvents: "none",
    r: 4
  }));
});
var SelectionDetailContainer = observer(function SelectionDetail3({
  bounds,
  hidden,
  shapes: shapes2,
  rotation = 0,
  detail = "size"
}) {
  const {
    components: { SelectionDetail: SelectionDetail4 },
    viewport: {
      camera: { zoom }
    }
  } = useRendererContext();
  const rBounds = React42.useRef(null);
  const scaledBounds = BoundsUtils.multiplyBounds(bounds, zoom);
  useCounterScaledPosition(rBounds, scaledBounds, zoom, 10003);
  if (!SelectionDetail4)
    throw Error("Expected a SelectionDetail component.");
  return /* @__PURE__ */ React42.createElement("div", {
    ref: rBounds,
    className: `tl-counter-scaled-positioned ${hidden ? `tl-fade-out` : ""}`,
    "aria-label": "bounds-detail-container"
  }, /* @__PURE__ */ React42.createElement(SelectionDetail4, {
    shapes: shapes2,
    bounds,
    scaledBounds,
    zoom,
    rotation,
    detail
  }));
});
var AppCanvas = observer(function InnerApp(props) {
  const app = useApp();
  return /* @__PURE__ */ React43.createElement(Renderer, __spreadValues3({
    viewport: app.viewport,
    inputs: app.inputs,
    callbacks: app._events,
    brush: app.brush,
    editingShape: app.editingShape,
    hoveredShape: app.hoveredShape,
    selectionDirectionHint: app.selectionDirectionHint,
    selectionBounds: app.selectionBounds,
    selectedShapes: app.selectedShapesArray,
    erasingShapes: app.erasingShapesArray,
    shapes: app.shapesInViewport,
    assets: app.assets,
    showGrid: app.settings.showGrid,
    showSelection: app.showSelection,
    showSelectionRotation: app.showSelectionRotation,
    showResizeHandles: app.showResizeHandles,
    showRotateHandles: app.showRotateHandles,
    showSelectionDetail: app.showSelectionDetail,
    showContextBar: app.showContextBar,
    cursor: app.cursors.cursor,
    cursorRotation: app.cursors.rotation,
    selectionRotation: app.selectionRotation,
    onEditingEnd: app.clearEditingShape
  }, props));
});
function getContextBarTranslation(barSize, offset) {
  let x = 0;
  let y = 0;
  if (offset.top < 116) {
    y = offset.height / 2 + 72;
    if (offset.bottom < 140) {
      y += offset.bottom - 140;
    }
  } else {
    y = -(offset.height / 2 + 40);
  }
  if (offset.left + offset.width / 2 - barSize[0] / 2 < 16) {
    x += -(offset.left + offset.width / 2 - barSize[0] / 2 - 16);
  } else if (offset.right + offset.width / 2 - barSize[0] / 2 < 16) {
    x += offset.right + offset.width / 2 - barSize[0] / 2 - 16;
  }
  return [x, y];
}

// src/app.tsx
import * as React87 from "react";

// src/components/AppUI.tsx
import * as React66 from "react";

// src/components/Toolbar/ToolBar.tsx
import * as React45 from "react";
var ToolBar = observer(function ToolBar2() {
  const app = useApp();
  const zoomIn = React45.useCallback(() => {
    app.api.zoomIn();
  }, [app]);
  const zoomOut = React45.useCallback(() => {
    app.api.zoomOut();
  }, [app]);
  const resetZoom = React45.useCallback(() => {
    app.api.resetZoom();
  }, [app]);
  const zoomToFit = React45.useCallback(() => {
    app.api.zoomToFit();
  }, [app]);
  const zoomToSelection = React45.useCallback(() => {
    app.api.zoomToSelection();
  }, [app]);
  const sendToBack = React45.useCallback(() => {
    app.sendToBack();
  }, [app]);
  const sendBackward = React45.useCallback(() => {
    app.sendBackward();
  }, [app]);
  const bringToFront = React45.useCallback(() => {
    app.bringToFront();
  }, [app]);
  const bringForward = React45.useCallback(() => {
    app.bringForward();
  }, [app]);
  const flipHorizontal = React45.useCallback(() => {
    app.flipHorizontal();
  }, [app]);
  const flipVertical = React45.useCallback(() => {
    app.flipVertical();
  }, [app]);
  return /* @__PURE__ */ React45.createElement("div", {
    className: "toolbar"
  }, /* @__PURE__ */ React45.createElement("button", {
    onClick: sendToBack
  }, "Send to Back"), /* @__PURE__ */ React45.createElement("button", {
    onClick: sendBackward
  }, "Send Backward"), /* @__PURE__ */ React45.createElement("button", {
    onClick: bringForward
  }, "Bring Forward"), /* @__PURE__ */ React45.createElement("button", {
    onClick: bringToFront
  }, "Bring To Front"), "|", /* @__PURE__ */ React45.createElement("button", {
    onClick: zoomOut
  }, "-"), /* @__PURE__ */ React45.createElement("button", {
    onClick: zoomIn
  }, "+"), /* @__PURE__ */ React45.createElement("button", {
    onClick: resetZoom
  }, "reset"), /* @__PURE__ */ React45.createElement("button", {
    onClick: zoomToFit
  }, "zoom to fit"), /* @__PURE__ */ React45.createElement("button", {
    onClick: zoomToSelection
  }, "zoom to selection"));
});

// src/components/StatusBar/StatusBar.tsx
import * as React46 from "react";
var StatusBar = observer(function StatusBar2() {
  const app = useApp();
  return /* @__PURE__ */ React46.createElement("div", {
    className: "statusbar"
  }, app.selectedTool.id, " | ", app.selectedTool.currentState.id);
});

// src/components/PrimaryTools/PrimaryTools.tsx
import * as React65 from "react";

// ../../node_modules/@radix-ui/react-icons/dist/react-icons.esm.js
import { forwardRef as forwardRef4, createElement as createElement30 } from "react";
function _objectWithoutPropertiesLoose2(source, excluded) {
  if (source == null)
    return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0)
      continue;
    target[key] = source[key];
  }
  return target;
}
var BoxIcon = /* @__PURE__ */ forwardRef4(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, ["color"]);
  return createElement30("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), createElement30("path", {
    d: "M12.5 2H2.5C2.22386 2 2 2.22386 2 2.5V12.5C2 12.7761 2.22386 13 2.5 13H12.5C12.7761 13 13 12.7761 13 12.5V2.5C13 2.22386 12.7761 2 12.5 2ZM2.5 1C1.67157 1 1 1.67157 1 2.5V12.5C1 13.3284 1.67157 14 2.5 14H12.5C13.3284 14 14 13.3284 14 12.5V2.5C14 1.67157 13.3284 1 12.5 1H2.5Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var CircleIcon = /* @__PURE__ */ forwardRef4(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, ["color"]);
  return createElement30("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), createElement30("path", {
    d: "M0.877075 7.49991C0.877075 3.84222 3.84222 0.877075 7.49991 0.877075C11.1576 0.877075 14.1227 3.84222 14.1227 7.49991C14.1227 11.1576 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1576 0.877075 7.49991ZM7.49991 1.82708C4.36689 1.82708 1.82708 4.36689 1.82708 7.49991C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49991C13.1727 4.36689 10.6329 1.82708 7.49991 1.82708Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var CodeIcon = /* @__PURE__ */ forwardRef4(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, ["color"]);
  return createElement30("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), createElement30("path", {
    d: "M9.96424 2.68571C10.0668 2.42931 9.94209 2.13833 9.6857 2.03577C9.4293 1.93322 9.13832 2.05792 9.03576 2.31432L5.03576 12.3143C4.9332 12.5707 5.05791 12.8617 5.3143 12.9642C5.5707 13.0668 5.86168 12.9421 5.96424 12.6857L9.96424 2.68571ZM3.85355 5.14646C4.04882 5.34172 4.04882 5.6583 3.85355 5.85356L2.20711 7.50001L3.85355 9.14646C4.04882 9.34172 4.04882 9.6583 3.85355 9.85356C3.65829 10.0488 3.34171 10.0488 3.14645 9.85356L1.14645 7.85356C0.951184 7.6583 0.951184 7.34172 1.14645 7.14646L3.14645 5.14646C3.34171 4.9512 3.65829 4.9512 3.85355 5.14646ZM11.1464 5.14646C11.3417 4.9512 11.6583 4.9512 11.8536 5.14646L13.8536 7.14646C14.0488 7.34172 14.0488 7.6583 13.8536 7.85356L11.8536 9.85356C11.6583 10.0488 11.3417 10.0488 11.1464 9.85356C10.9512 9.6583 10.9512 9.34172 11.1464 9.14646L12.7929 7.50001L11.1464 5.85356C10.9512 5.6583 10.9512 5.34172 11.1464 5.14646Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var CursorArrowIcon = /* @__PURE__ */ forwardRef4(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, ["color"]);
  return createElement30("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), createElement30("path", {
    d: "M3.29227 0.048984C3.47033 -0.032338 3.67946 -0.00228214 3.8274 0.125891L12.8587 7.95026C13.0134 8.08432 13.0708 8.29916 13.0035 8.49251C12.9362 8.68586 12.7578 8.81866 12.5533 8.82768L9.21887 8.97474L11.1504 13.2187C11.2648 13.47 11.1538 13.7664 10.9026 13.8808L8.75024 14.8613C8.499 14.9758 8.20255 14.8649 8.08802 14.6137L6.15339 10.3703L3.86279 12.7855C3.72196 12.934 3.50487 12.9817 3.31479 12.9059C3.1247 12.8301 3 12.6461 3 12.4414V0.503792C3 0.308048 3.11422 0.130306 3.29227 0.048984ZM4 1.59852V11.1877L5.93799 9.14425C6.05238 9.02363 6.21924 8.96776 6.38319 8.99516C6.54715 9.02256 6.68677 9.12965 6.75573 9.2809L8.79056 13.7441L10.0332 13.178L8.00195 8.71497C7.93313 8.56376 7.94391 8.38824 8.03072 8.24659C8.11753 8.10494 8.26903 8.01566 8.435 8.00834L11.2549 7.88397L4 1.59852Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var Pencil1Icon = /* @__PURE__ */ forwardRef4(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, ["color"]);
  return createElement30("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), createElement30("path", {
    d: "M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var ShadowIcon = /* @__PURE__ */ forwardRef4(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, ["color"]);
  return createElement30("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), createElement30("path", {
    d: "M0.877075 7.49988C0.877075 3.84219 3.84222 0.877045 7.49991 0.877045C11.1576 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1575 0.877075 7.49988ZM7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49991 1.82704Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }), createElement30("path", {
    opacity: ".05",
    d: "M6.78296 13.376C8.73904 9.95284 8.73904 5.04719 6.78296 1.62405L7.21708 1.37598C9.261 4.95283 9.261 10.0472 7.21708 13.624L6.78296 13.376Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }), createElement30("path", {
    opacity: ".1",
    d: "M7.28204 13.4775C9.23929 9.99523 9.23929 5.00475 7.28204 1.52248L7.71791 1.2775C9.76067 4.9119 9.76067 10.0881 7.71791 13.7225L7.28204 13.4775Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }), createElement30("path", {
    opacity: ".15",
    d: "M7.82098 13.5064C9.72502 9.99523 9.72636 5.01411 7.82492 1.50084L8.26465 1.26285C10.2465 4.92466 10.2451 10.085 8.26052 13.7448L7.82098 13.5064Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }), createElement30("path", {
    opacity: ".2",
    d: "M8.41284 13.429C10.1952 9.92842 10.1957 5.07537 8.41435 1.57402L8.85999 1.34729C10.7139 4.99113 10.7133 10.0128 8.85841 13.6559L8.41284 13.429Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }), createElement30("path", {
    opacity: ".25",
    d: "M9.02441 13.2956C10.6567 9.8379 10.6586 5.17715 9.03005 1.71656L9.48245 1.50366C11.1745 5.09919 11.1726 9.91629 9.47657 13.5091L9.02441 13.2956Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }), createElement30("path", {
    opacity: ".3",
    d: "M9.66809 13.0655C11.1097 9.69572 11.1107 5.3121 9.67088 1.94095L10.1307 1.74457C11.6241 5.24121 11.6231 9.76683 10.1278 13.2622L9.66809 13.0655Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }), createElement30("path", {
    opacity: ".35",
    d: "M10.331 12.7456C11.5551 9.52073 11.5564 5.49103 10.3347 2.26444L10.8024 2.0874C12.0672 5.42815 12.0659 9.58394 10.7985 12.9231L10.331 12.7456Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }), createElement30("path", {
    opacity: ".4",
    d: "M11.0155 12.2986C11.9938 9.29744 11.9948 5.71296 11.0184 2.71067L11.4939 2.55603C12.503 5.6589 12.502 9.35178 11.4909 12.4535L11.0155 12.2986Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }), createElement30("path", {
    opacity: ".45",
    d: "M11.7214 11.668C12.4254 9.01303 12.4262 5.99691 11.7237 3.34116L12.2071 3.21329C12.9318 5.95292 12.931 9.05728 12.2047 11.7961L11.7214 11.668Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }), createElement30("path", {
    opacity: ".5",
    d: "M12.4432 10.752C12.8524 8.63762 12.8523 6.36089 12.4429 4.2466L12.9338 4.15155C13.3553 6.32861 13.3554 8.66985 12.9341 10.847L12.4432 10.752Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var StarIcon = /* @__PURE__ */ forwardRef4(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, ["color"]);
  return createElement30("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), createElement30("path", {
    d: "M6.97942 1.25171L6.9585 1.30199L5.58662 4.60039C5.54342 4.70426 5.44573 4.77523 5.3336 4.78422L1.7727 5.0697L1.71841 5.07405L1.38687 5.10063L1.08608 5.12475C0.820085 5.14607 0.712228 5.47802 0.914889 5.65162L1.14406 5.84793L1.39666 6.06431L1.43802 6.09974L4.15105 8.42374C4.23648 8.49692 4.2738 8.61176 4.24769 8.72118L3.41882 12.196L3.40618 12.249L3.32901 12.5725L3.25899 12.866C3.19708 13.1256 3.47945 13.3308 3.70718 13.1917L3.9647 13.0344L4.24854 12.861L4.29502 12.8326L7.34365 10.9705C7.43965 10.9119 7.5604 10.9119 7.6564 10.9705L10.705 12.8326L10.7515 12.861L11.0354 13.0344L11.2929 13.1917C11.5206 13.3308 11.803 13.1256 11.7411 12.866L11.671 12.5725L11.5939 12.249L11.5812 12.196L10.7524 8.72118C10.7263 8.61176 10.7636 8.49692 10.849 8.42374L13.562 6.09974L13.6034 6.06431L13.856 5.84793L14.0852 5.65162C14.2878 5.47802 14.18 5.14607 13.914 5.12475L13.6132 5.10063L13.2816 5.07405L13.2274 5.0697L9.66645 4.78422C9.55432 4.77523 9.45663 4.70426 9.41343 4.60039L8.04155 1.30199L8.02064 1.25171L7.89291 0.944609L7.77702 0.665992C7.67454 0.419604 7.32551 0.419604 7.22303 0.665992L7.10715 0.944609L6.97942 1.25171ZM7.50003 2.60397L6.50994 4.98442C6.32273 5.43453 5.89944 5.74207 5.41351 5.78103L2.84361 5.98705L4.8016 7.66428C5.17183 7.98142 5.33351 8.47903 5.2204 8.95321L4.62221 11.461L6.8224 10.1171C7.23842 9.86302 7.76164 9.86302 8.17766 10.1171L10.3778 11.461L9.77965 8.95321C9.66654 8.47903 9.82822 7.98142 10.1984 7.66428L12.1564 5.98705L9.58654 5.78103C9.10061 5.74207 8.67732 5.43453 8.49011 4.98442L7.50003 2.60397Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var TextIcon = /* @__PURE__ */ forwardRef4(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, ["color"]);
  return createElement30("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), createElement30("path", {
    d: "M3.94993 2.95002L3.94993 4.49998C3.94993 4.74851 3.74845 4.94998 3.49993 4.94998C3.2514 4.94998 3.04993 4.74851 3.04993 4.49998V2.50004C3.04993 2.45246 3.05731 2.40661 3.07099 2.36357C3.12878 2.18175 3.29897 2.05002 3.49993 2.05002H11.4999C11.6553 2.05002 11.7922 2.12872 11.8731 2.24842C11.9216 2.32024 11.9499 2.40682 11.9499 2.50002L11.9499 2.50004V4.49998C11.9499 4.74851 11.7485 4.94998 11.4999 4.94998C11.2514 4.94998 11.0499 4.74851 11.0499 4.49998V2.95002H8.04993V12.05H9.25428C9.50281 12.05 9.70428 12.2515 9.70428 12.5C9.70428 12.7486 9.50281 12.95 9.25428 12.95H5.75428C5.50575 12.95 5.30428 12.7486 5.30428 12.5C5.30428 12.2515 5.50575 12.05 5.75428 12.05H6.94993V2.95002H3.94993Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var VercelLogoIcon = /* @__PURE__ */ forwardRef4(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, ["color"]);
  return createElement30("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), createElement30("path", {
    d: "M7.49998 1L6.92321 2.00307L1.17498 12L0.599976 13H1.7535H13.2464H14.4L13.825 12L8.07674 2.00307L7.49998 1ZM7.49998 3.00613L2.3285 12H12.6714L7.49998 3.00613Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var VideoIcon = /* @__PURE__ */ forwardRef4(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, ["color"]);
  return createElement30("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), createElement30("path", {
    d: "M4.76447 3.12199C5.63151 3.04859 6.56082 3 7.5 3C8.43918 3 9.36849 3.04859 10.2355 3.12199C11.2796 3.21037 11.9553 3.27008 12.472 3.39203C12.9425 3.50304 13.2048 3.64976 13.4306 3.88086C13.4553 3.90618 13.4902 3.94414 13.5133 3.97092C13.7126 4.20149 13.8435 4.4887 13.918 5.03283C13.9978 5.6156 14 6.37644 14 7.52493C14 8.66026 13.9978 9.41019 13.9181 9.98538C13.8439 10.5206 13.7137 10.8061 13.5125 11.0387C13.4896 11.0651 13.4541 11.1038 13.4296 11.1287C13.2009 11.3625 12.9406 11.5076 12.4818 11.6164C11.9752 11.7365 11.3143 11.7942 10.2878 11.8797C9.41948 11.9521 8.47566 12 7.5 12C6.52434 12 5.58052 11.9521 4.7122 11.8797C3.68572 11.7942 3.02477 11.7365 2.51816 11.6164C2.05936 11.5076 1.7991 11.3625 1.57037 11.1287C1.54593 11.1038 1.51035 11.0651 1.48748 11.0387C1.28628 10.8061 1.15612 10.5206 1.08193 9.98538C1.00221 9.41019 1 8.66026 1 7.52493C1 6.37644 1.00216 5.6156 1.082 5.03283C1.15654 4.4887 1.28744 4.20149 1.48666 3.97092C1.5098 3.94414 1.54468 3.90618 1.56942 3.88086C1.7952 3.64976 2.05752 3.50304 2.52796 3.39203C3.04473 3.27008 3.7204 3.21037 4.76447 3.12199ZM0 7.52493C0 5.28296 0 4.16198 0.729985 3.31713C0.766457 3.27491 0.815139 3.22194 0.854123 3.18204C1.63439 2.38339 2.64963 2.29744 4.68012 2.12555C5.56923 2.05028 6.52724 2 7.5 2C8.47276 2 9.43077 2.05028 10.3199 2.12555C12.3504 2.29744 13.3656 2.38339 14.1459 3.18204C14.1849 3.22194 14.2335 3.27491 14.27 3.31713C15 4.16198 15 5.28296 15 7.52493C15 9.74012 15 10.8477 14.2688 11.6929C14.2326 11.7348 14.1832 11.7885 14.1444 11.8281C13.3629 12.6269 12.3655 12.71 10.3709 12.8763C9.47971 12.9505 8.50782 13 7.5 13C6.49218 13 5.52028 12.9505 4.62915 12.8763C2.63446 12.71 1.63712 12.6269 0.855558 11.8281C0.816844 11.7885 0.767442 11.7348 0.731221 11.6929C0 10.8477 0 9.74012 0 7.52493ZM5.25 5.38264C5.25 5.20225 5.43522 5.08124 5.60041 5.15369L10.428 7.27105C10.6274 7.35853 10.6274 7.64147 10.428 7.72895L5.60041 9.84631C5.43522 9.91876 5.25 9.79775 5.25 9.61736V5.38264Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});

// src/components/Button/Button.tsx
import * as React47 from "react";
function Button(props) {
  return /* @__PURE__ */ React47.createElement("button", {
    className: "button",
    ...props
  });
}

// src/components/icons/BoxIcon.tsx
import * as React48 from "react";

// src/components/icons/CircleIcon.tsx
import * as React49 from "react";

// src/components/icons/DashDashedIcon.tsx
import * as React50 from "react";

// src/components/icons/DashDottedIcon.tsx
import * as React51 from "react";
var dottedDasharray = `${50.26548 * 0.025} ${50.26548 * 0.1}`;

// src/components/icons/DashDrawIcon.tsx
import * as React52 from "react";

// src/components/icons/DashSolidIcon.tsx
import * as React53 from "react";

// src/components/icons/IsFilledIcon.tsx
import * as React54 from "react";

// src/components/icons/RedoIcon.tsx
import * as React55 from "react";

// src/components/icons/TrashIcon.tsx
import * as React56 from "react";

// src/components/icons/UndoIcon.tsx
import * as React57 from "react";

// src/components/icons/SizeSmallIcon.tsx
import * as React58 from "react";

// src/components/icons/SizeMediumIcon.tsx
import * as React59 from "react";

// src/components/icons/SizeLargeIcon.tsx
import * as React60 from "react";

// src/components/icons/EraserIcon.tsx
import * as React61 from "react";
function EraserIcon() {
  return /* @__PURE__ */ React61.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, /* @__PURE__ */ React61.createElement("path", {
    d: "M1.72838 9.33987L8.84935 2.34732C9.23874 1.96494 9.86279 1.96539 10.2516 2.34831L13.5636 5.60975C13.9655 6.00555 13.9607 6.65526 13.553 7.04507L8.13212 12.2278C7.94604 12.4057 7.69851 12.505 7.44107 12.505L6.06722 12.505L3.83772 12.505C3.5673 12.505 3.30842 12.3954 3.12009 12.2014L1.7114 10.7498C1.32837 10.3551 1.33596 9.72521 1.72838 9.33987Z",
    stroke: "currentColor"
  }), /* @__PURE__ */ React61.createElement("line", {
    x1: "6.01807",
    y1: "12.5",
    x2: "10.7959",
    y2: "12.5",
    stroke: "currentColor",
    strokeLinecap: "round"
  }), /* @__PURE__ */ React61.createElement("line", {
    x1: "5.50834",
    y1: "5.74606",
    x2: "10.1984",
    y2: "10.4361",
    stroke: "currentColor"
  }));
}

// src/components/icons/MultiplayerIcon.tsx
import * as React62 from "react";

// src/components/icons/DiscordIcon.tsx
import * as React63 from "react";

// src/components/icons/LineIcon.tsx
import * as React64 from "react";
function LineIcon() {
  return /* @__PURE__ */ React64.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "currentColor",
    xmlns: "http://www.w3.org/2000/svg"
  }, /* @__PURE__ */ React64.createElement("path", {
    d: "M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L11.1464 3.14645C11.3417 2.95118 11.6583 2.95118 11.8536 3.14645C12.0488 3.34171 12.0488 3.65829 11.8536 3.85355L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z"
  }));
}

// src/components/PrimaryTools/PrimaryTools.tsx
var PrimaryTools = observer(function PrimaryTools2() {
  const app = useApp();
  const handleToolClick = React65.useCallback((e) => {
    const tool = e.currentTarget.dataset.tool;
    if (tool)
      app.selectTool(tool);
  }, [app]);
  const handleToolDoubleClick = React65.useCallback((e) => {
    const tool = e.currentTarget.dataset.tool;
    if (tool)
      app.selectTool(tool);
    app.settings.update({ isToolLocked: true });
  }, [app]);
  const selectedToolId = app.selectedTool.id;
  return /* @__PURE__ */ React65.createElement("div", {
    className: "primary-tools"
  }, /* @__PURE__ */ React65.createElement("button", {
    className: "floating-button"
  }), /* @__PURE__ */ React65.createElement("div", {
    className: "panel floating-panel",
    "data-tool-locked": app.settings.isToolLocked
  }, /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "select",
    "data-selected": selectedToolId === "select",
    onClick: handleToolClick
  }, /* @__PURE__ */ React65.createElement(CursorArrowIcon, null)), /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "pen",
    "data-selected": selectedToolId === "pen",
    onClick: handleToolClick
  }, /* @__PURE__ */ React65.createElement(Pencil1Icon, null)), /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "highlighter",
    "data-selected": selectedToolId === "highlighter",
    onClick: handleToolClick
  }, /* @__PURE__ */ React65.createElement(ShadowIcon, null)), /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "erase",
    "data-selected": selectedToolId === "erase",
    onClick: handleToolClick
  }, /* @__PURE__ */ React65.createElement(EraserIcon, null)), /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "box",
    "data-selected": selectedToolId === "box",
    onClick: handleToolClick,
    onDoubleClick: handleToolDoubleClick
  }, /* @__PURE__ */ React65.createElement(BoxIcon, null)), /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "ellipse",
    "data-selected": selectedToolId === "ellipse",
    onClick: handleToolClick,
    onDoubleClick: handleToolDoubleClick
  }, /* @__PURE__ */ React65.createElement(CircleIcon, null)), /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "polygon",
    "data-selected": selectedToolId === "polygon",
    onClick: handleToolClick,
    onDoubleClick: handleToolDoubleClick
  }, /* @__PURE__ */ React65.createElement(VercelLogoIcon, null)), /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "star",
    "data-selected": selectedToolId === "star",
    onClick: handleToolClick,
    onDoubleClick: handleToolDoubleClick
  }, /* @__PURE__ */ React65.createElement(StarIcon, null)), /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "line",
    "data-selected": selectedToolId === "line",
    onClick: handleToolClick,
    onDoubleClick: handleToolDoubleClick
  }, /* @__PURE__ */ React65.createElement(LineIcon, null)), /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "text",
    "data-selected": selectedToolId === "text",
    onClick: handleToolClick,
    onDoubleClick: handleToolDoubleClick
  }, /* @__PURE__ */ React65.createElement(TextIcon, null)), /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "code",
    "data-selected": selectedToolId === "code",
    onClick: handleToolClick,
    onDoubleClick: handleToolDoubleClick
  }, /* @__PURE__ */ React65.createElement(CodeIcon, null)), /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "youtube",
    "data-selected": selectedToolId === "youtube",
    onClick: handleToolClick,
    onDoubleClick: handleToolDoubleClick
  }, /* @__PURE__ */ React65.createElement(VideoIcon, null)), /* @__PURE__ */ React65.createElement(Button, {
    "data-tool": "logseq-portal",
    "data-selected": selectedToolId === "logseq-portal",
    onClick: handleToolClick,
    onDoubleClick: handleToolDoubleClick
  }, "\u{1F979}")), /* @__PURE__ */ React65.createElement("button", {
    className: "floating-button"
  }));
});

// src/components/AppUI.tsx
var AppUI = observer(function AppUI2() {
  return /* @__PURE__ */ React66.createElement(React66.Fragment, null, /* @__PURE__ */ React66.createElement(PrimaryTools, null));
});

// src/components/ContextBar/ContextBar.tsx
import * as React69 from "react";

// src/components/inputs/NumberInput.tsx
import * as React67 from "react";
function NumberInput({ label, ...rest }) {
  return /* @__PURE__ */ React67.createElement("div", {
    className: "input"
  }, /* @__PURE__ */ React67.createElement("label", {
    htmlFor: `number-${label}`
  }, label), /* @__PURE__ */ React67.createElement("input", {
    className: "number-input",
    name: `number-${label}`,
    type: "number",
    ...rest
  }));
}

// src/components/inputs/ColorInput.tsx
import * as React68 from "react";
function ColorInput({ label, ...rest }) {
  return /* @__PURE__ */ React68.createElement("div", {
    className: "input"
  }, /* @__PURE__ */ React68.createElement("label", {
    htmlFor: `color-${label}`
  }, label), /* @__PURE__ */ React68.createElement("input", {
    className: "color-input",
    name: `color-${label}`,
    type: "color",
    ...rest
  }));
}

// src/components/ContextBar/ContextBar.tsx
var _ContextBar = ({
  shapes: shapes2,
  offset,
  scaledBounds
}) => {
  const app = useApp();
  const rSize = React69.useRef([0, 0]);
  const rContextBar = React69.useRef(null);
  const updateStroke = React69.useCallback((e) => {
    shapes2.forEach((shape) => shape.update({ stroke: e.currentTarget.value }));
  }, []);
  const updateFill = React69.useCallback((e) => {
    shapes2.forEach((shape) => shape.update({ fill: e.currentTarget.value }));
  }, []);
  const updateStrokeWidth = React69.useCallback((e) => {
    shapes2.forEach((shape) => shape.update({ strokeWidth: +e.currentTarget.value }));
  }, []);
  const updateOpacity = React69.useCallback((e) => {
    shapes2.forEach((shape) => shape.update({ opacity: +e.currentTarget.value }));
  }, []);
  const updateSides = React69.useCallback((e) => {
    shapes2.forEach((shape) => shape.update({ sides: +e.currentTarget.value }));
  }, []);
  const updateRatio = React69.useCallback((e) => {
    shapes2.forEach((shape) => shape.update({ ratio: +e.currentTarget.value }));
  }, []);
  const updateFontSize = React69.useCallback((e) => {
    textShapes.forEach((shape) => shape.update({ fontSize: +e.currentTarget.value }));
  }, []);
  const updateFontWeight = React69.useCallback((e) => {
    textShapes.forEach((shape) => shape.update({ fontWeight: +e.currentTarget.value }));
  }, []);
  React69.useLayoutEffect(() => {
    const elm = rContextBar.current;
    if (!elm)
      return;
    const { offsetWidth, offsetHeight } = elm;
    rSize.current = [offsetWidth, offsetHeight];
  }, []);
  React69.useLayoutEffect(() => {
    const elm = rContextBar.current;
    if (!elm)
      return;
    const size = rSize.current;
    const [x, y] = getContextBarTranslation(size, { ...offset, bottom: offset.bottom - 32 });
    elm.style.setProperty("transform", `translateX(${x}px) translateY(${y}px)`);
  }, [scaledBounds, offset]);
  if (!app)
    return null;
  const textShapes = shapes2.filter((shape) => shape.type === "text");
  const sidesShapes = shapes2.filter((shape) => "sides" in shape.props);
  const ShapeContent = shapes2.length === 1 && "ReactContextBar" in shapes2[0] ? shapes2[0]["ReactContextBar"] : null;
  return /* @__PURE__ */ React69.createElement(HTMLContainer, {
    centered: true
  }, /* @__PURE__ */ React69.createElement("div", {
    ref: rContextBar,
    className: "contextbar"
  }, ShapeContent ? /* @__PURE__ */ React69.createElement(ShapeContent, null) : /* @__PURE__ */ React69.createElement(React69.Fragment, null, /* @__PURE__ */ React69.createElement(ColorInput, {
    label: "Stroke",
    value: shapes2[0].props.stroke,
    onChange: updateStroke
  }), /* @__PURE__ */ React69.createElement(ColorInput, {
    label: "Fill",
    value: shapes2[0].props.fill,
    onChange: updateFill
  }), /* @__PURE__ */ React69.createElement(NumberInput, {
    label: "Width",
    value: Math.max(...shapes2.map((shape) => shape.props.strokeWidth)),
    onChange: updateStrokeWidth,
    style: { width: 48 }
  }), sidesShapes.length > 0 && /* @__PURE__ */ React69.createElement(NumberInput, {
    label: "Sides",
    value: Math.max(...sidesShapes.map((shape) => shape.props.sides)),
    onChange: updateSides,
    style: { width: 40 }
  }), sidesShapes.length > 0 && /* @__PURE__ */ React69.createElement(NumberInput, {
    label: "Ratio",
    value: Math.max(...sidesShapes.map((shape) => shape.props.ratio)),
    onChange: updateRatio,
    step: 0.1,
    min: 0,
    max: 2,
    style: { width: 40 }
  }), /* @__PURE__ */ React69.createElement(NumberInput, {
    label: "Opacity",
    value: Math.max(...shapes2.map((shape) => shape.props.opacity)),
    onChange: updateOpacity,
    step: 0.1,
    style: { width: 48 }
  }), textShapes.length > 0 ? /* @__PURE__ */ React69.createElement(React69.Fragment, null, /* @__PURE__ */ React69.createElement(NumberInput, {
    label: "Size",
    value: Math.max(...textShapes.map((shape) => shape.props.fontSize)),
    onChange: updateFontSize,
    style: { width: 48 }
  }), /* @__PURE__ */ React69.createElement(NumberInput, {
    label: " Weight",
    value: Math.max(...textShapes.map((shape) => shape.props.fontWeight)),
    onChange: updateFontWeight,
    style: { width: 48 }
  })) : null)));
};
var ContextBar2 = observer(_ContextBar);

// src/hooks/useFileDrop.ts
import * as React70 from "react";
function useFileDrop() {
  return React70.useCallback(async (app, { files, point }) => {
    const IMAGE_EXTENSIONS = [".png", ".svg", ".jpg", ".jpeg", ".gif"];
    const assetId = uniqueId();
    const assetsToCreate = [];
    for (const file of files) {
      try {
        const extensionMatch = file.name.match(/\.[0-9a-z]+$/i);
        if (!extensionMatch)
          throw Error("No extension.");
        const extension = extensionMatch[0].toLowerCase();
        if (!IMAGE_EXTENSIONS.includes(extension))
          continue;
        const dataurl = await fileToBase64(file);
        if (typeof dataurl !== "string")
          continue;
        const existingAsset = Object.values(app.assets).find((asset2) => asset2.src === dataurl);
        if (existingAsset) {
          assetsToCreate.push(existingAsset);
          continue;
        }
        const asset = {
          id: assetId,
          type: "image",
          src: dataurl,
          size: await getSizeFromSrc(dataurl)
        };
        assetsToCreate.push(asset);
      } catch (error) {
        console.error(error);
      }
    }
    app.createAssets(assetsToCreate);
    app.createShapes(assetsToCreate.map((asset, i) => ({
      id: uniqueId(),
      type: "image",
      parentId: app.currentPageId,
      point: [point[0] - asset.size[0] / 2 + i * 16, point[1] - asset.size[1] / 2 + i * 16],
      size: asset.size,
      assetId: asset.id,
      opacity: 1
    })));
  }, []);
}

// src/lib/logseq-context.ts
import React71 from "react";
var LogseqContext = React71.createContext({});

// src/lib/shapes/BoxShape.tsx
import * as React72 from "react";

// src/lib/shapes/style-props.tsx
function withClampedStyles(props) {
  if (props.strokeWidth !== void 0)
    props.strokeWidth = Math.max(props.strokeWidth, 1);
  if (props.opacity !== void 0)
    props.opacity = Math.min(1, Math.max(props.opacity, 0));
  return props;
}

// src/lib/shapes/BoxShape.tsx
var BoxShape = class extends TLBoxShape {
  constructor() {
    super(...arguments);
    __publicField(this, "ReactComponent", observer(({ events, isErasing, isSelected }) => {
      const {
        props: {
          size: [w, h],
          stroke,
          fill,
          strokeWidth,
          borderRadius,
          opacity
        }
      } = this;
      return /* @__PURE__ */ React72.createElement(SVGContainer, {
        ...events,
        opacity: isErasing ? 0.2 : opacity
      }, /* @__PURE__ */ React72.createElement("rect", {
        className: isSelected ? "tl-hitarea-fill" : "tl-hitarea-stroke",
        x: strokeWidth / 2,
        y: strokeWidth / 2,
        rx: borderRadius,
        ry: borderRadius,
        width: Math.max(0.01, w - strokeWidth),
        height: Math.max(0.01, h - strokeWidth),
        pointerEvents: "all"
      }), /* @__PURE__ */ React72.createElement("rect", {
        x: strokeWidth / 2,
        y: strokeWidth / 2,
        rx: borderRadius,
        ry: borderRadius,
        width: Math.max(0.01, w - strokeWidth),
        height: Math.max(0.01, h - strokeWidth),
        strokeWidth,
        stroke,
        fill
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: {
          size: [w, h],
          borderRadius
        }
      } = this;
      return /* @__PURE__ */ React72.createElement("rect", {
        width: w,
        height: h,
        rx: borderRadius,
        ry: borderRadius,
        fill: "transparent"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.size !== void 0) {
        props.size[0] = Math.max(props.size[0], 1);
        props.size[1] = Math.max(props.size[1], 1);
      }
      if (props.borderRadius !== void 0)
        props.borderRadius = Math.max(0, props.borderRadius);
      return withClampedStyles(props);
    });
  }
};
__publicField(BoxShape, "id", "box");
__publicField(BoxShape, "defaultProps", {
  id: "box",
  parentId: "page",
  type: "box",
  point: [0, 0],
  size: [100, 100],
  borderRadius: 0,
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1
});

// src/lib/shapes/CodeSandboxShape.tsx
import * as React74 from "react";

// src/components/inputs/TextInput.tsx
import * as React73 from "react";
var TextInput = React73.forwardRef(({ label, ...rest }, ref) => {
  return /* @__PURE__ */ React73.createElement("div", {
    className: "input"
  }, /* @__PURE__ */ React73.createElement("label", {
    htmlFor: `text-${label}`
  }, label), /* @__PURE__ */ React73.createElement("input", {
    ref,
    className: "text-input",
    name: `text-${label}`,
    type: "text",
    ...rest
  }));
});

// src/lib/shapes/CodeSandboxShape.tsx
var CodeSandboxShape = class extends TLReactBoxShape {
  constructor() {
    super(...arguments);
    __publicField(this, "canEdit", true);
    __publicField(this, "canFlip", false);
    __publicField(this, "ReactContextBar", observer(() => {
      const { embedId } = this.props;
      const rInput = React74.useRef(null);
      const handleChange = React74.useCallback((e) => {
        const url = e.currentTarget.value;
        const match = url.match(/\/s\/([^?]+)/);
        const embedId2 = match?.[1] ?? url ?? "";
        this.update({ embedId: embedId2 });
      }, []);
      return /* @__PURE__ */ React74.createElement(React74.Fragment, null, /* @__PURE__ */ React74.createElement(TextInput, {
        ref: rInput,
        label: "CodeSandbox Embed ID",
        type: "text",
        value: embedId,
        onChange: handleChange
      }));
    }));
    __publicField(this, "ReactComponent", observer(({ events, isEditing, isErasing }) => {
      const { opacity, embedId } = this.props;
      return /* @__PURE__ */ React74.createElement(HTMLContainer, {
        style: {
          overflow: "hidden",
          pointerEvents: "all",
          opacity: isErasing ? 0.2 : opacity
        },
        ...events
      }, /* @__PURE__ */ React74.createElement("div", {
        style: {
          width: "100%",
          height: "100%",
          pointerEvents: isEditing ? "all" : "none",
          userSelect: "none"
        }
      }, embedId ? /* @__PURE__ */ React74.createElement("iframe", {
        src: `https://codesandbox.io/embed/${embedId}?&fontsize=14&hidenavigation=1&theme=dark`,
        style: { width: "100%", height: "100%", overflow: "hidden" },
        title: "CodeSandbox",
        allow: "accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking",
        sandbox: "allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      }) : /* @__PURE__ */ React74.createElement("div", {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
          border: "1px solid rgb(52, 52, 52)",
          padding: 16
        }
      }, /* @__PURE__ */ React74.createElement("svg", {
        role: "img",
        viewBox: "0 0 24 24",
        xmlns: "http://www.w3.org/2000/svg",
        width: "128"
      }, /* @__PURE__ */ React74.createElement("title", null), /* @__PURE__ */ React74.createElement("path", {
        d: "M2 6l10.455-6L22.91 6 23 17.95 12.455 24 2 18V6zm2.088 2.481v4.757l3.345 1.86v3.516l3.972 2.296v-8.272L4.088 8.481zm16.739 0l-7.317 4.157v8.272l3.972-2.296V15.1l3.345-1.861V8.48zM5.134 6.601l7.303 4.144 7.32-4.18-3.871-2.197-3.41 1.945-3.43-1.968L5.133 6.6z"
      })))));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        size: [w, h]
      } = this.props;
      return /* @__PURE__ */ React74.createElement("rect", {
        width: w,
        height: h,
        fill: "transparent"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.size !== void 0) {
        props.size[0] = Math.max(props.size[0], 1);
        props.size[1] = Math.max(props.size[1], 1);
      }
      return withClampedStyles(props);
    });
  }
};
__publicField(CodeSandboxShape, "id", "code");
__publicField(CodeSandboxShape, "defaultProps", {
  id: "code",
  type: "code",
  parentId: "page",
  point: [0, 0],
  size: [600, 320],
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1,
  embedId: ""
});

// src/lib/shapes/DotShape.tsx
import * as React75 from "react";
var DotShape = class extends TLDotShape {
  constructor() {
    super(...arguments);
    __publicField(this, "ReactComponent", observer(({ events, isErasing }) => {
      const { radius, stroke, fill, strokeWidth, opacity } = this.props;
      return /* @__PURE__ */ React75.createElement(SVGContainer, {
        ...events,
        opacity: isErasing ? 0.2 : opacity
      }, /* @__PURE__ */ React75.createElement("circle", {
        className: "tl-hitarea-fill",
        cx: radius,
        cy: radius,
        r: radius
      }), /* @__PURE__ */ React75.createElement("circle", {
        cx: radius,
        cy: radius,
        r: radius,
        stroke,
        fill,
        strokeWidth,
        pointerEvents: "none"
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const { radius } = this.props;
      return /* @__PURE__ */ React75.createElement("circle", {
        cx: radius,
        cy: radius,
        r: radius,
        pointerEvents: "all"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.radius !== void 0)
        props.radius = Math.max(props.radius, 1);
      return withClampedStyles(props);
    });
  }
};
__publicField(DotShape, "id", "dot");
__publicField(DotShape, "defaultProps", {
  id: "dot",
  parentId: "page",
  type: "dot",
  point: [0, 0],
  radius: 4,
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1
});

// src/lib/shapes/EllipseShape.tsx
import * as React76 from "react";
var EllipseShape = class extends TLEllipseShape {
  constructor() {
    super(...arguments);
    __publicField(this, "ReactComponent", observer(({ isSelected, isErasing, events }) => {
      const {
        size: [w, h],
        stroke,
        fill,
        strokeWidth,
        opacity
      } = this.props;
      return /* @__PURE__ */ React76.createElement(SVGContainer, {
        ...events,
        opacity: isErasing ? 0.2 : opacity
      }, /* @__PURE__ */ React76.createElement("ellipse", {
        className: isSelected ? "tl-hitarea-fill" : "tl-hitarea-stroke",
        cx: w / 2,
        cy: h / 2,
        rx: Math.max(0.01, (w - strokeWidth) / 2),
        ry: Math.max(0.01, (h - strokeWidth) / 2)
      }), /* @__PURE__ */ React76.createElement("ellipse", {
        cx: w / 2,
        cy: h / 2,
        rx: Math.max(0.01, (w - strokeWidth) / 2),
        ry: Math.max(0.01, (h - strokeWidth) / 2),
        strokeWidth,
        stroke,
        fill
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        size: [w, h]
      } = this.props;
      return /* @__PURE__ */ React76.createElement("ellipse", {
        cx: w / 2,
        cy: h / 2,
        rx: w / 2,
        ry: h / 2,
        strokeWidth: 2,
        fill: "transparent"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.size !== void 0) {
        props.size[0] = Math.max(props.size[0], 1);
        props.size[1] = Math.max(props.size[1], 1);
      }
      return withClampedStyles(props);
    });
  }
};
__publicField(EllipseShape, "id", "ellipse");
__publicField(EllipseShape, "defaultProps", {
  id: "ellipse",
  parentId: "page",
  type: "ellipse",
  point: [0, 0],
  size: [100, 100],
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1
});

// src/lib/shapes/HighlighterShape.tsx
import * as React77 from "react";
var HighlighterShape = class extends TLDrawShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "ReactComponent", observer(({ events, isErasing }) => {
      const {
        pointsPath,
        props: { stroke, strokeWidth, opacity }
      } = this;
      return /* @__PURE__ */ React77.createElement(SVGContainer, {
        ...events,
        opacity: isErasing ? 0.2 : opacity
      }, /* @__PURE__ */ React77.createElement("path", {
        d: pointsPath,
        strokeWidth: strokeWidth * 16,
        stroke,
        fill: "none",
        pointerEvents: "all",
        strokeLinejoin: "round",
        strokeLinecap: "round",
        opacity: 0.5
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const { pointsPath } = this;
      return /* @__PURE__ */ React77.createElement("path", {
        d: pointsPath,
        fill: "none"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      props = withClampedStyles(props);
      if (props.strokeWidth !== void 0)
        props.strokeWidth = Math.max(props.strokeWidth, 1);
      return props;
    });
    makeObservable(this);
  }
  get pointsPath() {
    const { points } = this.props;
    return SvgPathUtils.getCurvedPathForPoints(points);
  }
};
__publicField(HighlighterShape, "id", "highlighter");
__publicField(HighlighterShape, "defaultProps", {
  id: "highlighter",
  parentId: "page",
  type: "highlighter",
  point: [0, 0],
  points: [],
  isComplete: false,
  stroke: "#ffcc00",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1
});
__decorateClass([
  computed
], HighlighterShape.prototype, "pointsPath", 1);

// src/lib/shapes/ImageShape.tsx
import * as React78 from "react";
var ImageShape = class extends TLImageShape {
  constructor() {
    super(...arguments);
    __publicField(this, "ReactComponent", observer(({ events, isErasing, asset }) => {
      const {
        props: {
          opacity,
          objectFit,
          clipping,
          size: [w, h]
        }
      } = this;
      const [t, r, b, l2] = Array.isArray(clipping) ? clipping : [clipping, clipping, clipping, clipping];
      return /* @__PURE__ */ React78.createElement(HTMLContainer, {
        ...events,
        opacity: isErasing ? 0.2 : opacity
      }, /* @__PURE__ */ React78.createElement("div", {
        style: { width: "100%", height: "100%", overflow: "hidden" }
      }, asset && /* @__PURE__ */ React78.createElement("img", {
        src: asset.src,
        draggable: false,
        style: {
          position: "relative",
          top: -t,
          left: -l2,
          width: w + (l2 - r),
          height: h + (t - b),
          objectFit,
          pointerEvents: "all"
        }
      })));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: {
          size: [w, h]
        }
      } = this;
      return /* @__PURE__ */ React78.createElement("rect", {
        width: w,
        height: h,
        fill: "transparent"
      });
    }));
  }
};
__publicField(ImageShape, "id", "image");
__publicField(ImageShape, "defaultProps", {
  id: "image1",
  parentId: "page",
  type: "image",
  point: [0, 0],
  size: [100, 100],
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1,
  assetId: "",
  clipping: 0,
  objectFit: "fill",
  isAspectRatioLocked: true
});

// src/lib/shapes/LineShape.tsx
import * as React79 from "react";
var LineShape = class extends TLLineShape {
  constructor() {
    super(...arguments);
    __publicField(this, "hideSelection", true);
    __publicField(this, "ReactComponent", observer(({ events, isErasing, isSelected }) => {
      const {
        points,
        props: { stroke, fill, strokeWidth, opacity }
      } = this;
      const path = points.join();
      return /* @__PURE__ */ React79.createElement(SVGContainer, {
        ...events,
        opacity: isErasing ? 0.2 : opacity
      }, /* @__PURE__ */ React79.createElement("g", null, /* @__PURE__ */ React79.createElement("polygon", {
        className: isSelected ? "tl-hitarea-fill" : "tl-hitarea-stroke",
        points: path
      }), /* @__PURE__ */ React79.createElement("polygon", {
        points: path,
        stroke,
        fill,
        strokeWidth,
        strokeLinejoin: "round"
      })));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const { points } = this;
      const path = points.join();
      return /* @__PURE__ */ React79.createElement("polygon", {
        points: path
      });
    }));
    __publicField(this, "validateProps", (props) => {
      return withClampedStyles(props);
    });
  }
};
__publicField(LineShape, "id", "line");
__publicField(LineShape, "defaultProps", {
  id: "line",
  parentId: "page",
  type: "line",
  point: [0, 0],
  handles: [
    { id: "start", point: [0, 0] },
    { id: "end", point: [1, 1] }
  ],
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1
});

// src/lib/shapes/PenShape.tsx
import * as React80 from "react";

// ../../node_modules/perfect-freehand/dist/esm/index.js
function W(e, t, s, h = (b) => b) {
  return e * h(0.5 - t * (0.5 - s));
}
function re(e) {
  return [-e[0], -e[1]];
}
function l(e, t) {
  return [e[0] + t[0], e[1] + t[1]];
}
function a(e, t) {
  return [e[0] - t[0], e[1] - t[1]];
}
function f(e, t) {
  return [e[0] * t, e[1] * t];
}
function le(e, t) {
  return [e[0] / t, e[1] / t];
}
function L(e) {
  return [e[1], -e[0]];
}
function ne(e, t) {
  return e[0] * t[0] + e[1] * t[1];
}
function oe(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}
function fe(e) {
  return Math.hypot(e[0], e[1]);
}
function be(e) {
  return e[0] * e[0] + e[1] * e[1];
}
function Y(e, t) {
  return be(a(e, t));
}
function G(e) {
  return le(e, fe(e));
}
function ue(e, t) {
  return Math.hypot(e[1] - t[1], e[0] - t[0]);
}
function T(e, t, s) {
  let h = Math.sin(s), b = Math.cos(s), v = e[0] - t[0], n = e[1] - t[1], g = v * b - n * h, E = v * h + n * b;
  return [g + t[0], E + t[1]];
}
function V2(e, t, s) {
  return l(e, f(a(t, e), s));
}
function Z(e, t, s) {
  return l(e, f(t, s));
}
var { min: _14, PI: ge } = Math;
var se = 0.275;
var j = ge + 1e-4;
function ie(e, t = {}) {
  let { size: s = 16, smoothing: h = 0.5, thinning: b = 0.5, simulatePressure: v = true, easing: n = (r) => r, start: g = {}, end: E = {}, last: z = false } = t, { cap: d = true, taper: x = 0, easing: q = (r) => r * (2 - r) } = g, { cap: m = true, taper: c = 0, easing: M = (r) => --r * r * r + 1 } = E;
  if (e.length === 0 || s <= 0)
    return [];
  let H = e[e.length - 1].runningLength, $ = Math.pow(s * h, 2), D = [], R = [], N = e.slice(0, 10).reduce((r, i) => {
    let o = i.pressure;
    if (v) {
      let u = _14(1, i.distance / s), J = _14(1, 1 - u);
      o = _14(1, r + (J - r) * (u * se));
    }
    return (r + o) / 2;
  }, e[0].pressure), p = W(s, b, e[e.length - 1].pressure, n), U, B = e[0].vector, I = e[0].point, C = I, y = I, O = C;
  for (let r = 0; r < e.length; r++) {
    let { pressure: i } = e[r], { point: o, vector: u, distance: J, runningLength: K } = e[r];
    if (r < e.length - 1 && H - K < 3)
      continue;
    if (b) {
      if (v) {
        let P = _14(1, J / s), Q = _14(1, 1 - P);
        i = _14(1, N + (Q - N) * (P * se));
      }
      p = W(s, b, i, n);
    } else
      p = s / 2;
    U === void 0 && (U = p);
    let pe = K < x ? q(K / x) : 1, ae = H - K < c ? M((H - K) / c) : 1;
    if (p = Math.max(0.01, p * Math.min(pe, ae)), r === e.length - 1) {
      let P = f(L(u), p);
      D.push(a(o, P)), R.push(l(o, P));
      continue;
    }
    let A = e[r + 1].vector, ee = ne(u, A);
    if (ee < 0) {
      let P = f(L(B), p);
      for (let Q = 1 / 13, w = 0; w <= 1; w += Q)
        y = T(a(o, P), o, j * w), D.push(y), O = T(l(o, P), o, j * -w), R.push(O);
      I = y, C = O;
      continue;
    }
    let te = f(L(V2(A, u, ee)), p);
    y = a(o, te), (r <= 1 || Y(I, y) > $) && (D.push(y), I = y), O = l(o, te), (r <= 1 || Y(C, O) > $) && (R.push(O), C = O), N = i, B = u;
  }
  let S = e[0].point.slice(0, 2), k = e.length > 1 ? e[e.length - 1].point.slice(0, 2) : l(e[0].point, [1, 1]), X = [], F = [];
  if (e.length === 1) {
    if (!(x || c) || z) {
      let r = Z(S, G(L(a(S, k))), -(U || p)), i = [];
      for (let o = 1 / 13, u = o; u <= 1; u += o)
        i.push(T(r, S, j * 2 * u));
      return i;
    }
  } else {
    if (!(x || c && e.length === 1))
      if (d)
        for (let i = 1 / 13, o = i; o <= 1; o += i) {
          let u = T(R[0], S, j * o);
          X.push(u);
        }
      else {
        let i = a(D[0], R[0]), o = f(i, 0.5), u = f(i, 0.51);
        X.push(a(S, o), a(S, u), l(S, u), l(S, o));
      }
    let r = L(re(e[e.length - 1].vector));
    if (c || x && e.length === 1)
      F.push(k);
    else if (m) {
      let i = Z(k, r, p);
      for (let o = 1 / 29, u = o; u < 1; u += o)
        F.push(T(i, k, j * 3 * u));
    } else
      F.push(l(k, f(r, p)), l(k, f(r, p * 0.99)), a(k, f(r, p * 0.99)), a(k, f(r, p)));
  }
  return D.concat(F, R.reverse(), X);
}
function ce(e, t = {}) {
  var q;
  let { streamline: s = 0.5, size: h = 16, last: b = false } = t;
  if (e.length === 0)
    return [];
  let v = 0.15 + (1 - s) * 0.85, n = Array.isArray(e[0]) ? e : e.map(({ x: m, y: c, pressure: M = 0.5 }) => [m, c, M]);
  if (n.length === 2) {
    let m = n[1];
    n = n.slice(0, -1);
    for (let c = 1; c < 5; c++)
      n.push(V2(n[0], m, c / 4));
  }
  n.length === 1 && (n = [...n, [...l(n[0], [1, 1]), ...n[0].slice(2)]]);
  let g = [{ point: [n[0][0], n[0][1]], pressure: n[0][2] >= 0 ? n[0][2] : 0.25, vector: [1, 1], distance: 0, runningLength: 0 }], E = false, z = 0, d = g[0], x = n.length - 1;
  for (let m = 1; m < n.length; m++) {
    let c = b && m === x ? n[m].slice(0, 2) : V2(d.point, n[m], v);
    if (oe(d.point, c))
      continue;
    let M = ue(c, d.point);
    if (z += M, m < x && !E) {
      if (z < h)
        continue;
      E = true;
    }
    d = { point: c, pressure: n[m][2] >= 0 ? n[m][2] : 0.5, vector: G(a(d.point, c)), distance: M, runningLength: z }, g.push(d);
  }
  return g[0].vector = ((q = g[1]) == null ? void 0 : q.vector) || [0, 0], g;
}
function me(e, t = {}) {
  return ie(ce(e, t), t);
}

// src/lib/shapes/PenShape.tsx
var PenShape = class extends TLDrawShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "ReactComponent", observer(({ events, isErasing }) => {
      const {
        pointsPath,
        props: { stroke, strokeWidth, opacity }
      } = this;
      return /* @__PURE__ */ React80.createElement(SVGContainer, {
        ...events,
        opacity: isErasing ? 0.2 : opacity
      }, /* @__PURE__ */ React80.createElement("path", {
        d: pointsPath,
        strokeWidth,
        stroke,
        fill: stroke,
        pointerEvents: "all"
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const { pointsPath } = this;
      return /* @__PURE__ */ React80.createElement("path", {
        d: pointsPath
      });
    }));
    __publicField(this, "validateProps", (props) => {
      props = withClampedStyles(props);
      if (props.strokeWidth !== void 0)
        props.strokeWidth = Math.max(props.strokeWidth, 1);
      return props;
    });
    makeObservable(this);
  }
  get pointsPath() {
    const {
      props: { points, isComplete, strokeWidth }
    } = this;
    if (points.length < 2) {
      return `M -4, 0
      a 4,4 0 1,0 8,0
      a 4,4 0 1,0 -8,0`;
    }
    const stroke = me(points, { size: 4 + strokeWidth * 2, last: isComplete });
    return SvgPathUtils.getCurvedPathForPolygon(stroke);
  }
};
__publicField(PenShape, "id", "draw");
__publicField(PenShape, "defaultProps", {
  id: "draw",
  parentId: "page",
  type: "draw",
  point: [0, 0],
  points: [],
  isComplete: false,
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1
});
__decorateClass([
  computed
], PenShape.prototype, "pointsPath", 1);

// src/lib/shapes/PolygonShape.tsx
import * as React81 from "react";
var PolygonShape = class extends TLPolygonShape {
  constructor() {
    super(...arguments);
    __publicField(this, "ReactComponent", observer(({ events, isErasing, isSelected }) => {
      const {
        offset: [x, y],
        props: { stroke, fill, strokeWidth, opacity }
      } = this;
      const path = this.getVertices(strokeWidth / 2).join();
      return /* @__PURE__ */ React81.createElement(SVGContainer, {
        ...events,
        opacity: isErasing ? 0.2 : opacity
      }, /* @__PURE__ */ React81.createElement("g", {
        transform: `translate(${x}, ${y})`
      }, /* @__PURE__ */ React81.createElement("polygon", {
        className: isSelected ? "tl-hitarea-fill" : "tl-hitarea-stroke",
        points: path
      }), /* @__PURE__ */ React81.createElement("polygon", {
        points: path,
        stroke,
        fill,
        strokeWidth,
        strokeLinejoin: "round"
      })));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        offset: [x, y],
        props: { strokeWidth }
      } = this;
      return /* @__PURE__ */ React81.createElement("polygon", {
        transform: `translate(${x}, ${y})`,
        points: this.getVertices(strokeWidth / 2).join()
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.sides !== void 0)
        props.sides = Math.max(props.sides, 3);
      return withClampedStyles(props);
    });
  }
};
__publicField(PolygonShape, "id", "polygon");
__publicField(PolygonShape, "defaultProps", {
  id: "polygon",
  parentId: "page",
  type: "polygon",
  point: [0, 0],
  size: [100, 100],
  sides: 5,
  ratio: 1,
  isFlippedY: false,
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1
});

// src/lib/shapes/PolylineShape.tsx
import * as React82 from "react";
var PolylineShape = class extends TLPolylineShape {
  constructor() {
    super(...arguments);
    __publicField(this, "hideSelection", true);
    __publicField(this, "ReactComponent", observer(({ events, isErasing }) => {
      const {
        points,
        props: { stroke, strokeWidth, opacity }
      } = this;
      const path = points.join();
      return /* @__PURE__ */ React82.createElement(SVGContainer, {
        ...events,
        opacity: isErasing ? 0.2 : opacity
      }, /* @__PURE__ */ React82.createElement("g", null, /* @__PURE__ */ React82.createElement("polyline", {
        className: "tl-hitarea-stroke",
        points: path
      }), /* @__PURE__ */ React82.createElement("polyline", {
        points: path,
        stroke,
        fill: "none",
        strokeWidth,
        strokeLinejoin: "round"
      })));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const { points } = this;
      const path = points.join();
      return /* @__PURE__ */ React82.createElement("polyline", {
        points: path
      });
    }));
    __publicField(this, "validateProps", (props) => {
      return withClampedStyles(props);
    });
  }
};
__publicField(PolylineShape, "id", "polyline");
__publicField(PolylineShape, "defaultProps", {
  id: "box",
  parentId: "page",
  type: "polyline",
  point: [0, 0],
  handles: [],
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1
});

// src/lib/shapes/StarShape.tsx
import * as React83 from "react";
var StarShape = class extends TLStarShape {
  constructor() {
    super(...arguments);
    __publicField(this, "ReactComponent", observer(({ events, isErasing, isSelected }) => {
      const {
        offset: [x, y],
        props: { stroke, fill, strokeWidth, opacity }
      } = this;
      const path = this.getVertices(strokeWidth / 2).join();
      return /* @__PURE__ */ React83.createElement(SVGContainer, {
        ...events,
        opacity: isErasing ? 0.2 : opacity
      }, /* @__PURE__ */ React83.createElement("polygon", {
        className: isSelected ? "tl-hitarea-fill" : "tl-hitarea-stroke",
        transform: `translate(${x}, ${y})`,
        points: path
      }), /* @__PURE__ */ React83.createElement("polygon", {
        transform: `translate(${x}, ${y})`,
        points: path,
        stroke,
        fill,
        strokeWidth,
        strokeLinejoin: "round",
        strokeLinecap: "round"
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        offset: [x, y],
        props: { strokeWidth }
      } = this;
      return /* @__PURE__ */ React83.createElement("polygon", {
        transform: `translate(${x}, ${y})`,
        points: this.getVertices(strokeWidth / 2).join()
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.sides !== void 0)
        props.sides = Math.max(props.sides, 3);
      return withClampedStyles(props);
    });
  }
};
__publicField(StarShape, "id", "star");
__publicField(StarShape, "defaultProps", {
  id: "star",
  parentId: "page",
  type: "star",
  point: [0, 0],
  size: [100, 100],
  sides: 5,
  ratio: 1,
  isFlippedY: false,
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1
});

// src/lib/shapes/TextShape.tsx
import * as React84 from "react";
var TextShape = class extends TLTextShape {
  constructor() {
    super(...arguments);
    __publicField(this, "ReactComponent", observer(({ events, isErasing, isEditing, onEditingEnd }) => {
      const {
        props: { opacity, fontFamily, fontSize, fontWeight, lineHeight, text, stroke, padding }
      } = this;
      const rInput = React84.useRef(null);
      const rIsMounted = React84.useRef(false);
      const rInnerWrapper = React84.useRef(null);
      const handleChange = React84.useCallback((e) => {
        const { isSizeLocked } = this.props;
        const text2 = TextUtils.normalizeText(e.currentTarget.value);
        if (isSizeLocked) {
          this.update({ text: text2, size: this.getAutoSizedBoundingBox({ text: text2 }) });
          return;
        }
        this.update({ text: text2 });
      }, []);
      const handleKeyDown = React84.useCallback((e) => {
        if (e.metaKey)
          e.stopPropagation();
        switch (e.key) {
          case "Meta": {
            e.stopPropagation();
            break;
          }
          case "z": {
            if (e.metaKey) {
              if (e.shiftKey) {
                document.execCommand("redo", false);
              } else {
                document.execCommand("undo", false);
              }
              e.preventDefault();
            }
            break;
          }
          case "Enter": {
            if (e.ctrlKey || e.metaKey) {
              e.currentTarget.blur();
            }
            break;
          }
          case "Tab": {
            e.preventDefault();
            if (e.shiftKey) {
              TextUtils.unindent(e.currentTarget);
            } else {
              TextUtils.indent(e.currentTarget);
            }
            this.update({ text: TextUtils.normalizeText(e.currentTarget.value) });
            break;
          }
        }
      }, []);
      const handleBlur = React84.useCallback((e) => {
        e.currentTarget.setSelectionRange(0, 0);
        onEditingEnd?.();
      }, [onEditingEnd]);
      const handleFocus = React84.useCallback((e) => {
        if (!isEditing)
          return;
        if (!rIsMounted.current)
          return;
        if (document.activeElement === e.currentTarget) {
          e.currentTarget.select();
        }
      }, [isEditing]);
      const handlePointerDown = React84.useCallback((e) => {
        if (isEditing)
          e.stopPropagation();
      }, [isEditing]);
      React84.useEffect(() => {
        if (isEditing) {
          requestAnimationFrame(() => {
            rIsMounted.current = true;
            const elm = rInput.current;
            if (elm) {
              elm.focus();
              elm.select();
            }
          });
        } else {
          onEditingEnd?.();
        }
      }, [isEditing, onEditingEnd]);
      React84.useLayoutEffect(() => {
        const { fontFamily: fontFamily2, fontSize: fontSize2, fontWeight: fontWeight2, lineHeight: lineHeight2, padding: padding2 } = this.props;
        const { width, height } = this.measure.measureText(text, { fontFamily: fontFamily2, fontSize: fontSize2, fontWeight: fontWeight2, lineHeight: lineHeight2 }, padding2);
        this.update({ size: [width, height] });
      }, []);
      return /* @__PURE__ */ React84.createElement(HTMLContainer, {
        ...events,
        opacity: isErasing ? 0.2 : opacity
      }, /* @__PURE__ */ React84.createElement("div", {
        ref: rInnerWrapper,
        className: "text-shape-wrapper",
        "data-hastext": !!text,
        "data-isediting": isEditing,
        style: {
          fontFamily,
          fontSize,
          fontWeight,
          padding,
          lineHeight,
          color: stroke
        }
      }, isEditing ? /* @__PURE__ */ React84.createElement("textarea", {
        ref: rInput,
        className: "text-shape-input",
        name: "text",
        tabIndex: -1,
        autoComplete: "false",
        autoCapitalize: "false",
        autoCorrect: "false",
        autoSave: "false",
        placeholder: "",
        spellCheck: "true",
        wrap: "off",
        dir: "auto",
        datatype: "wysiwyg",
        defaultValue: text,
        onFocus: handleFocus,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        onBlur: handleBlur,
        onPointerDown: handlePointerDown
      }) : /* @__PURE__ */ React84.createElement(React84.Fragment, null, text, "\u200B")));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: { borderRadius },
        bounds
      } = this;
      return /* @__PURE__ */ React84.createElement("rect", {
        width: bounds.width,
        height: bounds.height,
        rx: borderRadius,
        ry: borderRadius,
        fill: "transparent"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.isSizeLocked || this.props.isSizeLocked) {
        props.size = this.getAutoSizedBoundingBox(props);
      }
      return withClampedStyles(props);
    });
    __publicField(this, "measure", new TLTextMeasure());
    __publicField(this, "getBounds", () => {
      const [x, y] = this.props.point;
      const [width, height] = this.props.size;
      return {
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height,
        width,
        height
      };
    });
    __publicField(this, "onResizeStart", ({ isSingle }) => {
      if (!isSingle)
        return this;
      this.scale = [...this.props.scale ?? [1, 1]];
      return this.update({
        isSizeLocked: false
      });
    });
    __publicField(this, "onResetBounds", () => {
      this.update({
        size: this.getAutoSizedBoundingBox(),
        isSizeLocked: true
      });
      return this;
    });
  }
  getAutoSizedBoundingBox(props = {}) {
    const {
      text = this.props.text,
      fontFamily = this.props.fontFamily,
      fontSize = this.props.fontSize,
      fontWeight = this.props.fontWeight,
      lineHeight = this.props.lineHeight,
      padding = this.props.padding
    } = props;
    const { width, height } = this.measure.measureText(text, { fontFamily, fontSize, lineHeight, fontWeight }, padding);
    return [width, height];
  }
};
__publicField(TextShape, "id", "text");
__publicField(TextShape, "defaultProps", {
  id: "box",
  parentId: "page",
  type: "text",
  point: [0, 0],
  size: [100, 100],
  isSizeLocked: true,
  text: "",
  lineHeight: 1.2,
  fontSize: 20,
  fontWeight: 400,
  padding: 4,
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  borderRadius: 0,
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1
});

// src/lib/shapes/YouTubeShape.tsx
import * as React85 from "react";
var _YouTubeShape = class extends TLBoxShape {
  constructor() {
    super(...arguments);
    __publicField(this, "aspectRatio", 480 / 853);
    __publicField(this, "canChangeAspectRatio", false);
    __publicField(this, "canFlip", false);
    __publicField(this, "canEdit", true);
    __publicField(this, "ReactContextBar", observer(() => {
      const { embedId } = this.props;
      const rInput = React85.useRef(null);
      const app = useApp();
      const handleChange = React85.useCallback((e) => {
        const url = e.currentTarget.value;
        const match = url.match(/^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/);
        const embedId2 = match?.[1] ?? url ?? "";
        this.update({ embedId: embedId2, size: _YouTubeShape.defaultProps.size });
        app.persist();
      }, []);
      return /* @__PURE__ */ React85.createElement(React85.Fragment, null, /* @__PURE__ */ React85.createElement(TextInput, {
        ref: rInput,
        label: "Youtube Video ID",
        type: "text",
        value: embedId,
        onChange: handleChange
      }));
    }));
    __publicField(this, "ReactComponent", observer(({ events, isEditing, isErasing }) => {
      const {
        props: { opacity, embedId }
      } = this;
      const app = useApp();
      const isSelected = app.selectedIds.has(this.id);
      return /* @__PURE__ */ React85.createElement(HTMLContainer, {
        style: {
          overflow: "hidden",
          pointerEvents: "all",
          opacity: isErasing ? 0.2 : opacity
        },
        ...events
      }, embedId && /* @__PURE__ */ React85.createElement("div", {
        style: {
          height: "32px",
          width: "100%",
          background: "#bbb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }
      }, embedId), /* @__PURE__ */ React85.createElement("div", {
        style: {
          width: "100%",
          height: embedId ? "calc(100% - 32px)" : "100%",
          pointerEvents: isEditing ? "none" : "all",
          userSelect: "none",
          position: "relative"
        }
      }, embedId ? /* @__PURE__ */ React85.createElement("div", {
        style: {
          overflow: "hidden",
          paddingBottom: "56.25%",
          position: "relative",
          height: 0,
          opacity: isSelected ? 0.5 : 1
        }
      }, /* @__PURE__ */ React85.createElement("iframe", {
        style: {
          left: 0,
          top: 0,
          height: "100%",
          width: "100%",
          position: "absolute"
        },
        width: "853",
        height: "480",
        src: `https://www.youtube.com/embed/${embedId}`,
        frameBorder: "0",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        allowFullScreen: true,
        title: "Embedded youtube"
      })) : /* @__PURE__ */ React85.createElement("div", {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          border: "1px solid rgb(52, 52, 52)",
          padding: 16
        }
      }, /* @__PURE__ */ React85.createElement("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 502 210.649",
        height: "210.65",
        width: "128"
      }, /* @__PURE__ */ React85.createElement("g", null, /* @__PURE__ */ React85.createElement("path", {
        d: "M498.333 45.7s-2.91-20.443-11.846-29.447C475.157 4.44 462.452 4.38 456.627 3.687c-41.7-3-104.25-3-104.25-3h-.13s-62.555 0-104.255 3c-5.826.693-18.523.753-29.86 12.566-8.933 9.004-11.84 29.447-11.84 29.447s-2.983 24.003-2.983 48.009v22.507c0 24.006 2.983 48.013 2.983 48.013s2.907 20.44 11.84 29.446c11.337 11.817 26.23 11.44 32.86 12.677 23.84 2.28 101.315 2.983 101.315 2.983s62.62-.094 104.32-3.093c5.824-.694 18.527-.75 29.857-12.567 8.936-9.006 11.846-29.446 11.846-29.446s2.98-24.007 2.98-48.013V93.709c0-24.006-2.98-48.01-2.98-48.01",
        fill: "#cd201f"
      }), /* @__PURE__ */ React85.createElement("g", null, /* @__PURE__ */ React85.createElement("path", {
        d: "M187.934 169.537h-18.96V158.56c-7.19 8.24-13.284 12.4-19.927 12.4-5.826 0-9.876-2.747-11.9-7.717-1.23-3.02-2.103-7.736-2.103-14.663V68.744h18.957v81.833c.443 2.796 1.636 3.823 4.043 3.823 3.63 0 6.913-3.153 10.93-8.817V68.744h18.96v100.793zM102.109 139.597c.996 9.98-2.1 14.93-7.987 14.93s-8.98-4.95-7.98-14.93v-39.92c-1-9.98 2.093-14.657 7.98-14.657 5.89 0 8.993 4.677 7.996 14.657l-.01 39.92zm18.96-37.923c0-10.77-2.164-18.86-5.987-23.95-5.054-6.897-12.973-9.72-20.96-9.72-9.033 0-15.913 2.823-20.957 9.72-3.886 5.09-5.97 13.266-5.97 24.036l-.016 35.84c0 10.71 1.853 18.11 5.736 23.153 5.047 6.873 13.227 10.513 21.207 10.513 7.986 0 16.306-3.64 21.36-10.513 3.823-5.043 5.586-12.443 5.586-23.153v-35.926zM46.223 114.647v54.889h-19.96v-54.89S5.582 47.358 1.314 34.815H22.27L36.277 87.38l13.936-52.566H71.17l-24.947 79.833z"
      })), /* @__PURE__ */ React85.createElement("g", {
        fill: "#fff"
      }, /* @__PURE__ */ React85.createElement("path", {
        d: "M440.413 96.647c0-9.33 2.557-11.874 8.59-11.874 5.99 0 8.374 2.777 8.374 11.997v10.893l-16.964.02V96.647zm35.96 25.986l-.003-20.4c0-10.656-2.1-18.456-5.88-23.5-5.06-6.823-12.253-10.436-21.317-10.436-9.226 0-16.42 3.613-21.643 10.436-3.84 5.044-6.076 13.28-6.076 23.943v34.927c0 10.596 2.46 18.013 6.296 23.003 5.227 6.813 12.42 10.216 21.87 10.216 9.44 0 16.853-3.566 21.85-10.81 2.2-3.196 3.616-6.82 4.226-10.823.164-1.81.64-5.933.64-11.753v-2.827h-18.96c0 7.247.037 11.557-.133 12.54-1.033 4.834-3.623 7.25-8.07 7.25-6.203 0-8.826-4.636-8.76-13.843v-17.923h35.96zM390.513 140.597c0 9.98-2.353 13.806-7.563 13.806-2.973 0-6.4-1.53-9.423-4.553l.02-60.523c3.02-2.98 6.43-4.55 9.403-4.55 5.21 0 7.563 2.93 7.563 12.91v42.91zm2.104-72.453c-6.647 0-13.253 4.087-19.09 11.27l.02-43.603h-17.963V169.54h17.963l.027-10.05c6.036 7.47 12.62 11.333 19.043 11.333 7.193 0 12.45-3.85 14.863-11.267 1.203-4.226 1.993-10.733 1.993-19.956V99.684c0-9.447-1.21-15.907-2.416-19.917-2.41-7.466-7.247-11.623-14.44-11.623M340.618 169.537h-18.956V158.56c-7.193 8.24-13.283 12.4-19.926 12.4-5.827 0-9.877-2.747-11.9-7.717-1.234-3.02-2.107-7.736-2.107-14.663V69.744h18.96v80.833c.443 2.796 1.633 3.823 4.043 3.823 3.63 0 6.913-3.153 10.93-8.817V69.744h18.957v99.793z"
      }), /* @__PURE__ */ React85.createElement("path", {
        d: "M268.763 169.537h-19.956V54.77h-20.956V35.835l62.869-.024v18.96h-21.957v114.766z"
      })))))));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: {
          size: [w, h]
        }
      } = this;
      return /* @__PURE__ */ React85.createElement("rect", {
        width: w,
        height: h,
        fill: "transparent"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.size !== void 0) {
        props.size[0] = Math.max(props.size[0], 1);
        props.size[1] = Math.max(props.size[0] * this.aspectRatio, 1);
      }
      return withClampedStyles(props);
    });
  }
};
var YouTubeShape = _YouTubeShape;
__publicField(YouTubeShape, "id", "youtube");
__publicField(YouTubeShape, "defaultProps", {
  id: "youtube",
  type: "youtube",
  parentId: "page",
  point: [0, 0],
  size: [600, 320],
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1,
  embedId: ""
});

// src/lib/shapes/LogseqPortalShape.tsx
import * as React86 from "react";
var _LogseqPortalShape = class extends TLBoxShape {
  constructor() {
    super(...arguments);
    __publicField(this, "canChangeAspectRatio", true);
    __publicField(this, "canFlip", false);
    __publicField(this, "canEdit", false);
    __publicField(this, "ReactContextBar", observer(() => {
      const { pageId } = this.props;
      const [q, setQ] = React86.useState(pageId);
      const rInput = React86.useRef(null);
      const { search } = React86.useContext(LogseqContext);
      const app = useApp();
      const secretPrefix = "\u0153::";
      const commitChange = React86.useCallback((id) => {
        setQ(id);
        this.update({ pageId: id, size: _LogseqPortalShape.defaultProps.size });
        app.persist();
        rInput.current?.blur();
      }, []);
      const handleChange = React86.useCallback((e) => {
        const _q = e.currentTarget.value;
        if (_q.startsWith(secretPrefix)) {
          const id = _q.substring(secretPrefix.length);
          commitChange(id);
        } else {
          setQ(_q);
        }
      }, []);
      const options = React86.useMemo(() => {
        if (search && q) {
          return search(q);
        }
        return null;
      }, [search, q]);
      return /* @__PURE__ */ React86.createElement(React86.Fragment, null, /* @__PURE__ */ React86.createElement(TextInput, {
        ref: rInput,
        label: "Page name or block UUID",
        type: "text",
        value: q,
        onChange: handleChange,
        list: "logseq-portal-search-results"
      }), /* @__PURE__ */ React86.createElement("datalist", {
        id: "logseq-portal-search-results"
      }, options?.map((option) => /* @__PURE__ */ React86.createElement("option", {
        key: option,
        value: secretPrefix + option
      }, option))));
    }));
    __publicField(this, "ReactComponent", observer(({ events, isEditing, isErasing }) => {
      const {
        props: { opacity, pageId }
      } = this;
      const app = useApp();
      const { Page } = React86.useContext(LogseqContext);
      const isSelected = app.selectedIds.has(this.id);
      if (!Page) {
        return null;
      }
      return /* @__PURE__ */ React86.createElement(HTMLContainer, {
        style: {
          overflow: "hidden",
          pointerEvents: "all",
          opacity: isErasing ? 0.2 : opacity,
          border: "1px solid rgb(52, 52, 52)",
          backgroundColor: "#ffffff"
        },
        ...events
      }, pageId && /* @__PURE__ */ React86.createElement("div", {
        style: {
          height: "32px",
          width: "100%",
          background: "#bbb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }
      }, pageId), /* @__PURE__ */ React86.createElement("div", {
        style: {
          width: "100%",
          height: pageId ? "calc(100% - 32px)" : "100%",
          pointerEvents: isSelected ? "none" : "all",
          userSelect: "none"
        }
      }, pageId ? /* @__PURE__ */ React86.createElement("div", {
        onPointerDown: (e) => !isEditing && e.stopPropagation(),
        onPointerUp: (e) => !isEditing && e.stopPropagation(),
        style: { padding: "0 24px" }
      }, /* @__PURE__ */ React86.createElement(Page, {
        pageId
      })) : /* @__PURE__ */ React86.createElement("div", {
        style: {
          opacity: isSelected ? 0.5 : 1,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          justifyContent: "center",
          padding: 16
        }
      }, "LOGSEQ PORTAL PLACEHOLDER")));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: {
          size: [w, h]
        }
      } = this;
      return /* @__PURE__ */ React86.createElement("rect", {
        width: w,
        height: h,
        fill: "transparent"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.size !== void 0) {
        props.size[0] = Math.max(props.size[0], 50);
        props.size[1] = Math.max(props.size[1], 50);
      }
      return withClampedStyles(props);
    });
  }
};
var LogseqPortalShape = _LogseqPortalShape;
__publicField(LogseqPortalShape, "id", "logseq-portal");
__publicField(LogseqPortalShape, "defaultProps", {
  id: "logseq-portal",
  type: "logseq-portal",
  parentId: "page",
  point: [0, 0],
  size: [600, 320],
  stroke: "#000000",
  fill: "#ffffff",
  strokeWidth: 2,
  opacity: 1,
  pageId: ""
});

// src/lib/tools/BoxTool.tsx
var BoxTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", BoxShape);
  }
};
__publicField(BoxTool, "id", "box");
__publicField(BoxTool, "shortcut", ["r"]);

// src/lib/tools/CodeSandboxTool.tsx
var CodeSandboxTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", CodeSandboxShape);
  }
};
__publicField(CodeSandboxTool, "id", "code");
__publicField(CodeSandboxTool, "shortcut", ["x"]);

// src/lib/tools/DotTool.tsx
var DotTool = class extends TLDotTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", DotShape);
  }
};
__publicField(DotTool, "id", "dot");
__publicField(DotTool, "shortcut", ["t"]);

// src/lib/tools/EllipseTool.tsx
var EllipseTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", EllipseShape);
  }
};
__publicField(EllipseTool, "id", "ellipse");
__publicField(EllipseTool, "shortcut", ["o"]);

// src/lib/tools/EraseTool.tsx
var NuEraseTool = class extends TLEraseTool {
};
__publicField(NuEraseTool, "id", "erase");
__publicField(NuEraseTool, "shortcut", ["e"]);

// src/lib/tools/HighlighterTool.tsx
var HighlighterTool = class extends TLDrawTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", HighlighterShape);
    __publicField(this, "simplify", true);
    __publicField(this, "simplifyTolerance", 0.618);
  }
};
__publicField(HighlighterTool, "id", "highlighter");
__publicField(HighlighterTool, "shortcut", ["h"]);

// src/lib/tools/LineTool.tsx
var LineTool = class extends TLLineTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", LineShape);
  }
};
__publicField(LineTool, "id", "line");
__publicField(LineTool, "shortcut", ["l"]);

// src/lib/tools/PenTool.tsx
var PenTool = class extends TLDrawTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", PenShape);
    __publicField(this, "simplify", false);
  }
};
__publicField(PenTool, "id", "pen");
__publicField(PenTool, "shortcut", ["d", "p"]);

// src/lib/tools/PolygonTool.tsx
var PolygonTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", PolygonShape);
  }
};
__publicField(PolygonTool, "id", "polygon");
__publicField(PolygonTool, "shortcut", ["g"]);

// src/lib/tools/StarTool.tsx
var StarTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", StarShape);
  }
};
__publicField(StarTool, "id", "star");
__publicField(StarTool, "shortcut", ["s"]);

// src/lib/tools/TextTool.tsx
var TextTool = class extends TLTextTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", TextShape);
  }
};
__publicField(TextTool, "id", "text");
__publicField(TextTool, "shortcut", ["t"]);

// src/lib/tools/YouTubeTool.tsx
var YouTubeTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", YouTubeShape);
  }
};
__publicField(YouTubeTool, "id", "youtube");
__publicField(YouTubeTool, "shortcut", ["y"]);

// src/lib/tools/LogseqPortalTool.tsx
var LogseqPortalTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", LogseqPortalShape);
  }
};
__publicField(LogseqPortalTool, "id", "logseq-portal");
__publicField(LogseqPortalTool, "shortcut", ["i"]);

// src/app.tsx
var components = {
  ContextBar: ContextBar2
};
var shapes = [
  BoxShape,
  CodeSandboxShape,
  DotShape,
  EllipseShape,
  HighlighterShape,
  ImageShape,
  LineShape,
  PenShape,
  PolygonShape,
  PolylineShape,
  StarShape,
  TextShape,
  YouTubeShape,
  LogseqPortalShape
];
var tools = [
  BoxTool,
  CodeSandboxTool,
  DotTool,
  EllipseTool,
  NuEraseTool,
  HighlighterTool,
  LineTool,
  PenTool,
  PolygonTool,
  StarTool,
  TextTool,
  YouTubeTool,
  LogseqPortalTool
];
var App3 = function App4(props) {
  const onFileDrop = useFileDrop();
  const Page = React87.useMemo(() => React87.memo(props.PageComponent), []);
  return /* @__PURE__ */ React87.createElement(LogseqContext.Provider, {
    value: { Page, search: props.searchHandler }
  }, /* @__PURE__ */ React87.createElement(AppProvider, {
    Shapes: shapes,
    Tools: tools,
    onFileDrop,
    ...props
  }, /* @__PURE__ */ React87.createElement("div", {
    className: "logseq-tldraw logseq-tldraw-wrapper"
  }, /* @__PURE__ */ React87.createElement(AppCanvas, {
    components
  }), /* @__PURE__ */ React87.createElement(AppUI, null))));
};
export {
  App3 as App
};
/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
