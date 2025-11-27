"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a3, b3) => {
  for (var prop in b3 || (b3 = {}))
    if (__hasOwnProp.call(b3, prop))
      __defNormalProp(a3, prop, b3[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b3)) {
      if (__propIsEnum.call(b3, prop))
        __defNormalProp(a3, prop, b3[prop]);
    }
  return a3;
};
var __spreadProps = (a3, b3) => __defProps(a3, __getOwnPropDescs(b3));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i2 = decorators.length - 1, decorator; i2 >= 0; i2--)
    if (decorator = decorators[i2])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
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
    var step = (x2) => x2.done ? resolve(x2.value) : Promise.resolve(x2.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// ../../node_modules/rbush/rbush.min.js
var require_rbush_min = __commonJS({
  "../../node_modules/rbush/rbush.min.js"(exports, module2) {
    !function(t, i2) {
      "object" == typeof exports && "undefined" != typeof module2 ? module2.exports = i2() : "function" == typeof define && define.amd ? define(i2) : (t = t || self).RBush = i2();
    }(exports, function() {
      "use strict";
      function t(t2, r3, e2, a4, h3) {
        !function t3(n3, r4, e3, a5, h4) {
          for (; a5 > e3; ) {
            if (a5 - e3 > 600) {
              var o3 = a5 - e3 + 1, s3 = r4 - e3 + 1, l4 = Math.log(o3), f3 = 0.5 * Math.exp(2 * l4 / 3), u3 = 0.5 * Math.sqrt(l4 * f3 * (o3 - f3) / o3) * (s3 - o3 / 2 < 0 ? -1 : 1), m3 = Math.max(e3, Math.floor(r4 - s3 * f3 / o3 + u3)), c3 = Math.min(a5, Math.floor(r4 + (o3 - s3) * f3 / o3 + u3));
              t3(n3, r4, m3, c3, h4);
            }
            var p3 = n3[r4], d3 = e3, x2 = a5;
            for (i2(n3, e3, r4), h4(n3[a5], p3) > 0 && i2(n3, e3, a5); d3 < x2; ) {
              for (i2(n3, d3, x2), d3++, x2--; h4(n3[d3], p3) < 0; )
                d3++;
              for (; h4(n3[x2], p3) > 0; )
                x2--;
            }
            0 === h4(n3[e3], p3) ? i2(n3, e3, x2) : i2(n3, ++x2, a5), x2 <= r4 && (e3 = x2 + 1), r4 <= x2 && (a5 = x2 - 1);
          }
        }(t2, r3, e2 || 0, a4 || t2.length - 1, h3 || n2);
      }
      function i2(t2, i3, n3) {
        var r3 = t2[i3];
        t2[i3] = t2[n3], t2[n3] = r3;
      }
      function n2(t2, i3) {
        return t2 < i3 ? -1 : t2 > i3 ? 1 : 0;
      }
      var r2 = function(t2) {
        void 0 === t2 && (t2 = 9), this._maxEntries = Math.max(4, t2), this._minEntries = Math.max(2, Math.ceil(0.4 * this._maxEntries)), this.clear();
      };
      function e(t2, i3, n3) {
        if (!n3)
          return i3.indexOf(t2);
        for (var r3 = 0; r3 < i3.length; r3++)
          if (n3(t2, i3[r3]))
            return r3;
        return -1;
      }
      function a3(t2, i3) {
        h2(t2, 0, t2.children.length, i3, t2);
      }
      function h2(t2, i3, n3, r3, e2) {
        e2 || (e2 = p2(null)), e2.minX = 1 / 0, e2.minY = 1 / 0, e2.maxX = -1 / 0, e2.maxY = -1 / 0;
        for (var a4 = i3; a4 < n3; a4++) {
          var h3 = t2.children[a4];
          o2(e2, t2.leaf ? r3(h3) : h3);
        }
        return e2;
      }
      function o2(t2, i3) {
        return t2.minX = Math.min(t2.minX, i3.minX), t2.minY = Math.min(t2.minY, i3.minY), t2.maxX = Math.max(t2.maxX, i3.maxX), t2.maxY = Math.max(t2.maxY, i3.maxY), t2;
      }
      function s2(t2, i3) {
        return t2.minX - i3.minX;
      }
      function l3(t2, i3) {
        return t2.minY - i3.minY;
      }
      function f2(t2) {
        return (t2.maxX - t2.minX) * (t2.maxY - t2.minY);
      }
      function u2(t2) {
        return t2.maxX - t2.minX + (t2.maxY - t2.minY);
      }
      function m2(t2, i3) {
        return t2.minX <= i3.minX && t2.minY <= i3.minY && i3.maxX <= t2.maxX && i3.maxY <= t2.maxY;
      }
      function c2(t2, i3) {
        return i3.minX <= t2.maxX && i3.minY <= t2.maxY && i3.maxX >= t2.minX && i3.maxY >= t2.minY;
      }
      function p2(t2) {
        return { children: t2, height: 1, leaf: true, minX: 1 / 0, minY: 1 / 0, maxX: -1 / 0, maxY: -1 / 0 };
      }
      function d2(i3, n3, r3, e2, a4) {
        for (var h3 = [n3, r3]; h3.length; )
          if (!((r3 = h3.pop()) - (n3 = h3.pop()) <= e2)) {
            var o3 = n3 + Math.ceil((r3 - n3) / e2 / 2) * e2;
            t(i3, o3, n3, r3, a4), h3.push(n3, o3, o3, r3);
          }
      }
      return r2.prototype.all = function() {
        return this._all(this.data, []);
      }, r2.prototype.search = function(t2) {
        var i3 = this.data, n3 = [];
        if (!c2(t2, i3))
          return n3;
        for (var r3 = this.toBBox, e2 = []; i3; ) {
          for (var a4 = 0; a4 < i3.children.length; a4++) {
            var h3 = i3.children[a4], o3 = i3.leaf ? r3(h3) : h3;
            c2(t2, o3) && (i3.leaf ? n3.push(h3) : m2(t2, o3) ? this._all(h3, n3) : e2.push(h3));
          }
          i3 = e2.pop();
        }
        return n3;
      }, r2.prototype.collides = function(t2) {
        var i3 = this.data;
        if (!c2(t2, i3))
          return false;
        for (var n3 = []; i3; ) {
          for (var r3 = 0; r3 < i3.children.length; r3++) {
            var e2 = i3.children[r3], a4 = i3.leaf ? this.toBBox(e2) : e2;
            if (c2(t2, a4)) {
              if (i3.leaf || m2(t2, a4))
                return true;
              n3.push(e2);
            }
          }
          i3 = n3.pop();
        }
        return false;
      }, r2.prototype.load = function(t2) {
        if (!t2 || !t2.length)
          return this;
        if (t2.length < this._minEntries) {
          for (var i3 = 0; i3 < t2.length; i3++)
            this.insert(t2[i3]);
          return this;
        }
        var n3 = this._build(t2.slice(), 0, t2.length - 1, 0);
        if (this.data.children.length)
          if (this.data.height === n3.height)
            this._splitRoot(this.data, n3);
          else {
            if (this.data.height < n3.height) {
              var r3 = this.data;
              this.data = n3, n3 = r3;
            }
            this._insert(n3, this.data.height - n3.height - 1, true);
          }
        else
          this.data = n3;
        return this;
      }, r2.prototype.insert = function(t2) {
        return t2 && this._insert(t2, this.data.height - 1), this;
      }, r2.prototype.clear = function() {
        return this.data = p2([]), this;
      }, r2.prototype.remove = function(t2, i3) {
        if (!t2)
          return this;
        for (var n3, r3, a4, h3 = this.data, o3 = this.toBBox(t2), s3 = [], l4 = []; h3 || s3.length; ) {
          if (h3 || (h3 = s3.pop(), r3 = s3[s3.length - 1], n3 = l4.pop(), a4 = true), h3.leaf) {
            var f3 = e(t2, h3.children, i3);
            if (-1 !== f3)
              return h3.children.splice(f3, 1), s3.push(h3), this._condense(s3), this;
          }
          a4 || h3.leaf || !m2(h3, o3) ? r3 ? (n3++, h3 = r3.children[n3], a4 = false) : h3 = null : (s3.push(h3), l4.push(n3), n3 = 0, r3 = h3, h3 = h3.children[0]);
        }
        return this;
      }, r2.prototype.toBBox = function(t2) {
        return t2;
      }, r2.prototype.compareMinX = function(t2, i3) {
        return t2.minX - i3.minX;
      }, r2.prototype.compareMinY = function(t2, i3) {
        return t2.minY - i3.minY;
      }, r2.prototype.toJSON = function() {
        return this.data;
      }, r2.prototype.fromJSON = function(t2) {
        return this.data = t2, this;
      }, r2.prototype._all = function(t2, i3) {
        for (var n3 = []; t2; )
          t2.leaf ? i3.push.apply(i3, t2.children) : n3.push.apply(n3, t2.children), t2 = n3.pop();
        return i3;
      }, r2.prototype._build = function(t2, i3, n3, r3) {
        var e2, h3 = n3 - i3 + 1, o3 = this._maxEntries;
        if (h3 <= o3)
          return a3(e2 = p2(t2.slice(i3, n3 + 1)), this.toBBox), e2;
        r3 || (r3 = Math.ceil(Math.log(h3) / Math.log(o3)), o3 = Math.ceil(h3 / Math.pow(o3, r3 - 1))), (e2 = p2([])).leaf = false, e2.height = r3;
        var s3 = Math.ceil(h3 / o3), l4 = s3 * Math.ceil(Math.sqrt(o3));
        d2(t2, i3, n3, l4, this.compareMinX);
        for (var f3 = i3; f3 <= n3; f3 += l4) {
          var u3 = Math.min(f3 + l4 - 1, n3);
          d2(t2, f3, u3, s3, this.compareMinY);
          for (var m3 = f3; m3 <= u3; m3 += s3) {
            var c3 = Math.min(m3 + s3 - 1, u3);
            e2.children.push(this._build(t2, m3, c3, r3 - 1));
          }
        }
        return a3(e2, this.toBBox), e2;
      }, r2.prototype._chooseSubtree = function(t2, i3, n3, r3) {
        for (; r3.push(i3), !i3.leaf && r3.length - 1 !== n3; ) {
          for (var e2 = 1 / 0, a4 = 1 / 0, h3 = void 0, o3 = 0; o3 < i3.children.length; o3++) {
            var s3 = i3.children[o3], l4 = f2(s3), u3 = (m3 = t2, c3 = s3, (Math.max(c3.maxX, m3.maxX) - Math.min(c3.minX, m3.minX)) * (Math.max(c3.maxY, m3.maxY) - Math.min(c3.minY, m3.minY)) - l4);
            u3 < a4 ? (a4 = u3, e2 = l4 < e2 ? l4 : e2, h3 = s3) : u3 === a4 && l4 < e2 && (e2 = l4, h3 = s3);
          }
          i3 = h3 || i3.children[0];
        }
        var m3, c3;
        return i3;
      }, r2.prototype._insert = function(t2, i3, n3) {
        var r3 = n3 ? t2 : this.toBBox(t2), e2 = [], a4 = this._chooseSubtree(r3, this.data, i3, e2);
        for (a4.children.push(t2), o2(a4, r3); i3 >= 0 && e2[i3].children.length > this._maxEntries; )
          this._split(e2, i3), i3--;
        this._adjustParentBBoxes(r3, e2, i3);
      }, r2.prototype._split = function(t2, i3) {
        var n3 = t2[i3], r3 = n3.children.length, e2 = this._minEntries;
        this._chooseSplitAxis(n3, e2, r3);
        var h3 = this._chooseSplitIndex(n3, e2, r3), o3 = p2(n3.children.splice(h3, n3.children.length - h3));
        o3.height = n3.height, o3.leaf = n3.leaf, a3(n3, this.toBBox), a3(o3, this.toBBox), i3 ? t2[i3 - 1].children.push(o3) : this._splitRoot(n3, o3);
      }, r2.prototype._splitRoot = function(t2, i3) {
        this.data = p2([t2, i3]), this.data.height = t2.height + 1, this.data.leaf = false, a3(this.data, this.toBBox);
      }, r2.prototype._chooseSplitIndex = function(t2, i3, n3) {
        for (var r3, e2, a4, o3, s3, l4, u3, m3 = 1 / 0, c3 = 1 / 0, p3 = i3; p3 <= n3 - i3; p3++) {
          var d3 = h2(t2, 0, p3, this.toBBox), x2 = h2(t2, p3, n3, this.toBBox), v2 = (e2 = d3, a4 = x2, o3 = void 0, s3 = void 0, l4 = void 0, u3 = void 0, o3 = Math.max(e2.minX, a4.minX), s3 = Math.max(e2.minY, a4.minY), l4 = Math.min(e2.maxX, a4.maxX), u3 = Math.min(e2.maxY, a4.maxY), Math.max(0, l4 - o3) * Math.max(0, u3 - s3)), M2 = f2(d3) + f2(x2);
          v2 < m3 ? (m3 = v2, r3 = p3, c3 = M2 < c3 ? M2 : c3) : v2 === m3 && M2 < c3 && (c3 = M2, r3 = p3);
        }
        return r3 || n3 - i3;
      }, r2.prototype._chooseSplitAxis = function(t2, i3, n3) {
        var r3 = t2.leaf ? this.compareMinX : s2, e2 = t2.leaf ? this.compareMinY : l3;
        this._allDistMargin(t2, i3, n3, r3) < this._allDistMargin(t2, i3, n3, e2) && t2.children.sort(r3);
      }, r2.prototype._allDistMargin = function(t2, i3, n3, r3) {
        t2.children.sort(r3);
        for (var e2 = this.toBBox, a4 = h2(t2, 0, i3, e2), s3 = h2(t2, n3 - i3, n3, e2), l4 = u2(a4) + u2(s3), f3 = i3; f3 < n3 - i3; f3++) {
          var m3 = t2.children[f3];
          o2(a4, t2.leaf ? e2(m3) : m3), l4 += u2(a4);
        }
        for (var c3 = n3 - i3 - 1; c3 >= i3; c3--) {
          var p3 = t2.children[c3];
          o2(s3, t2.leaf ? e2(p3) : p3), l4 += u2(s3);
        }
        return l4;
      }, r2.prototype._adjustParentBBoxes = function(t2, i3, n3) {
        for (var r3 = n3; r3 >= 0; r3--)
          o2(i3[r3], t2);
      }, r2.prototype._condense = function(t2) {
        for (var i3 = t2.length - 1, n3 = void 0; i3 >= 0; i3--)
          0 === t2[i3].children.length ? i3 > 0 ? (n3 = t2[i3 - 1].children).splice(n3.indexOf(t2[i3]), 1) : this.clear() : a3(t2[i3], this.toBBox);
      }, r2;
    });
  }
});

// ../../node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS({
  "../../node_modules/fast-deep-equal/index.js"(exports, module2) {
    "use strict";
    module2.exports = function equal(a3, b3) {
      if (a3 === b3)
        return true;
      if (a3 && b3 && typeof a3 == "object" && typeof b3 == "object") {
        if (a3.constructor !== b3.constructor)
          return false;
        var length, i2, keys;
        if (Array.isArray(a3)) {
          length = a3.length;
          if (length != b3.length)
            return false;
          for (i2 = length; i2-- !== 0; )
            if (!equal(a3[i2], b3[i2]))
              return false;
          return true;
        }
        if (a3.constructor === RegExp)
          return a3.source === b3.source && a3.flags === b3.flags;
        if (a3.valueOf !== Object.prototype.valueOf)
          return a3.valueOf() === b3.valueOf();
        if (a3.toString !== Object.prototype.toString)
          return a3.toString() === b3.toString();
        keys = Object.keys(a3);
        length = keys.length;
        if (length !== Object.keys(b3).length)
          return false;
        for (i2 = length; i2-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b3, keys[i2]))
            return false;
        for (i2 = length; i2-- !== 0; ) {
          var key = keys[i2];
          if (!equal(a3[key], b3[key]))
            return false;
        }
        return true;
      }
      return a3 !== a3 && b3 !== b3;
    };
  }
});

// ../../../../node_modules/deepmerge/dist/cjs.js
var require_cjs = __commonJS({
  "../../../../node_modules/deepmerge/dist/cjs.js"(exports, module2) {
    "use strict";
    var isMergeableObject = function isMergeableObject2(value) {
      return isNonNullObject(value) && !isSpecial(value);
    };
    function isNonNullObject(value) {
      return !!value && typeof value === "object";
    }
    function isSpecial(value) {
      var stringValue = Object.prototype.toString.call(value);
      return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
    }
    var canUseSymbol = typeof Symbol === "function" && Symbol.for;
    var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for("react.element") : 60103;
    function isReactElement(value) {
      return value.$$typeof === REACT_ELEMENT_TYPE;
    }
    function emptyTarget(val) {
      return Array.isArray(val) ? [] : {};
    }
    function cloneUnlessOtherwiseSpecified(value, options) {
      return options.clone !== false && options.isMergeableObject(value) ? deepmerge2(emptyTarget(value), value, options) : value;
    }
    function defaultArrayMerge(target, source, options) {
      return target.concat(source).map(function(element) {
        return cloneUnlessOtherwiseSpecified(element, options);
      });
    }
    function getMergeFunction(key, options) {
      if (!options.customMerge) {
        return deepmerge2;
      }
      var customMerge = options.customMerge(key);
      return typeof customMerge === "function" ? customMerge : deepmerge2;
    }
    function getEnumerableOwnPropertySymbols(target) {
      return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
        return Object.propertyIsEnumerable.call(target, symbol);
      }) : [];
    }
    function getKeys(target) {
      return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
    }
    function propertyIsOnObject(object2, property) {
      try {
        return property in object2;
      } catch (_2) {
        return false;
      }
    }
    function propertyIsUnsafe(target, key) {
      return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
    }
    function mergeObject(target, source, options) {
      var destination = {};
      if (options.isMergeableObject(target)) {
        getKeys(target).forEach(function(key) {
          destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
        });
      }
      getKeys(source).forEach(function(key) {
        if (propertyIsUnsafe(target, key)) {
          return;
        }
        if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
          destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
        } else {
          destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
        }
      });
      return destination;
    }
    function deepmerge2(target, source, options) {
      options = options || {};
      options.arrayMerge = options.arrayMerge || defaultArrayMerge;
      options.isMergeableObject = options.isMergeableObject || isMergeableObject;
      options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
      var sourceIsArray = Array.isArray(source);
      var targetIsArray = Array.isArray(target);
      var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;
      if (!sourceAndTargetTypesMatch) {
        return cloneUnlessOtherwiseSpecified(source, options);
      } else if (sourceIsArray) {
        return options.arrayMerge(target, source, options);
      } else {
        return mergeObject(target, source, options);
      }
    }
    deepmerge2.all = function deepmergeAll(array2, options) {
      if (!Array.isArray(array2)) {
        throw new Error("first argument should be an array");
      }
      return array2.reduce(function(prev, next) {
        return deepmerge2(prev, next, options);
      }, {});
    };
    var deepmerge_1 = deepmerge2;
    module2.exports = deepmerge_1;
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  App: () => App3,
  PreviewManager: () => PreviewManager,
  generateJSXFromModel: () => generateJSXFromModel,
  generateSVGFromModel: () => generateSVGFromModel
});
module.exports = __toCommonJS(src_exports);

// ../../packages/core/src/types/types.ts
var Color = /* @__PURE__ */ ((Color2) => {
  Color2["Yellow"] = "yellow";
  Color2["Red"] = "red";
  Color2["Pink"] = "pink";
  Color2["Green"] = "green";
  Color2["Blue"] = "blue";
  Color2["Purple"] = "purple";
  Color2["Gray"] = "gray";
  Color2["Default"] = "";
  return Color2;
})(Color || {});
var Geometry = /* @__PURE__ */ ((Geometry2) => {
  Geometry2["Box"] = "box";
  Geometry2["Ellipse"] = "ellipse";
  Geometry2["Polygon"] = "polygon";
  return Geometry2;
})(Geometry || {});

// ../../node_modules/uuid/dist/esm-browser/rng.js
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    getRandomValues = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
    if (!getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
  }
  return getRandomValues(rnds8);
}

// ../../node_modules/uuid/dist/esm-browser/regex.js
var regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

// ../../node_modules/uuid/dist/esm-browser/validate.js
function validate(uuid) {
  return typeof uuid === "string" && regex_default.test(uuid);
}
var validate_default = validate;

// ../../node_modules/uuid/dist/esm-browser/stringify.js
var byteToHex = [];
for (let i2 = 0; i2 < 256; ++i2) {
  byteToHex.push((i2 + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// ../../node_modules/uuid/dist/esm-browser/v1.js
var _nodeId;
var _clockseq;
var _lastMSecs = 0;
var _lastNSecs = 0;
function v1(options, buf, offset) {
  let i2 = buf && offset || 0;
  const b3 = buf || new Array(16);
  options = options || {};
  let node = options.node || _nodeId;
  let clockseq = options.clockseq !== void 0 ? options.clockseq : _clockseq;
  if (node == null || clockseq == null) {
    const seedBytes = options.random || (options.rng || rng)();
    if (node == null) {
      node = _nodeId = [seedBytes[0] | 1, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }
    if (clockseq == null) {
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
    }
  }
  let msecs = options.msecs !== void 0 ? options.msecs : Date.now();
  let nsecs = options.nsecs !== void 0 ? options.nsecs : _lastNSecs + 1;
  const dt2 = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
  if (dt2 < 0 && options.clockseq === void 0) {
    clockseq = clockseq + 1 & 16383;
  }
  if ((dt2 < 0 || msecs > _lastMSecs) && options.nsecs === void 0) {
    nsecs = 0;
  }
  if (nsecs >= 1e4) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }
  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;
  msecs += 122192928e5;
  const tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
  b3[i2++] = tl >>> 24 & 255;
  b3[i2++] = tl >>> 16 & 255;
  b3[i2++] = tl >>> 8 & 255;
  b3[i2++] = tl & 255;
  const tmh = msecs / 4294967296 * 1e4 & 268435455;
  b3[i2++] = tmh >>> 8 & 255;
  b3[i2++] = tmh & 255;
  b3[i2++] = tmh >>> 24 & 15 | 16;
  b3[i2++] = tmh >>> 16 & 255;
  b3[i2++] = clockseq >>> 8 | 128;
  b3[i2++] = clockseq & 255;
  for (let n2 = 0; n2 < 6; ++n2) {
    b3[i2 + n2] = node[n2];
  }
  return buf || unsafeStringify(b3);
}
var v1_default = v1;

// ../../node_modules/uuid/dist/esm-browser/parse.js
function parse(uuid) {
  if (!validate_default(uuid)) {
    throw TypeError("Invalid UUID");
  }
  let v2;
  const arr = new Uint8Array(16);
  arr[0] = (v2 = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v2 >>> 16 & 255;
  arr[2] = v2 >>> 8 & 255;
  arr[3] = v2 & 255;
  arr[4] = (v2 = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v2 & 255;
  arr[6] = (v2 = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v2 & 255;
  arr[8] = (v2 = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v2 & 255;
  arr[10] = (v2 = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
  arr[11] = v2 / 4294967296 & 255;
  arr[12] = v2 >>> 24 & 255;
  arr[13] = v2 >>> 16 & 255;
  arr[14] = v2 >>> 8 & 255;
  arr[15] = v2 & 255;
  return arr;
}
var parse_default = parse;

// ../../node_modules/uuid/dist/esm-browser/nil.js
var nil_default = "00000000-0000-0000-0000-000000000000";

// ../../packages/utils/vec/src/index.ts
var _Vec = class {
  static clamp(n2, min, max) {
    return Math.max(min, typeof max !== "undefined" ? Math.min(n2, max) : n2);
  }
  static clampV(A3, min, max) {
    return A3.map((n2) => max ? _Vec.clamp(n2, min, max) : _Vec.clamp(n2, min));
  }
  static cross(x2, y2, z2) {
    return (y2[0] - x2[0]) * (z2[1] - x2[1]) - (z2[0] - x2[0]) * (y2[1] - x2[1]);
  }
  static snap(a3, step = 1) {
    return [Math.round(a3[0] / step) * step, Math.round(a3[1] / step) * step];
  }
};
var Vec = _Vec;
Vec.neg = (A3) => {
  return [-A3[0], -A3[1]];
};
Vec.add = (A3, B3) => {
  return [A3[0] + B3[0], A3[1] + B3[1]];
};
Vec.addScalar = (A3, n2) => {
  return [A3[0] + n2, A3[1] + n2];
};
Vec.sub = (A3, B3) => {
  return [A3[0] - B3[0], A3[1] - B3[1]];
};
Vec.subScalar = (A3, n2) => {
  return [A3[0] - n2, A3[1] - n2];
};
Vec.vec = (A3, B3) => {
  return [B3[0] - A3[0], B3[1] - A3[1]];
};
Vec.mul = (A3, n2) => {
  return [A3[0] * n2, A3[1] * n2];
};
Vec.mulV = (A3, B3) => {
  return [A3[0] * B3[0], A3[1] * B3[1]];
};
Vec.div = (A3, n2) => {
  return [A3[0] / n2, A3[1] / n2];
};
Vec.divV = (A3, B3) => {
  return [A3[0] / B3[0], A3[1] / B3[1]];
};
Vec.per = (A3) => {
  return [A3[1], -A3[0]];
};
Vec.dpr = (A3, B3) => {
  return A3[0] * B3[0] + A3[1] * B3[1];
};
Vec.cpr = (A3, B3) => {
  return A3[0] * B3[1] - B3[0] * A3[1];
};
Vec.len2 = (A3) => {
  return A3[0] * A3[0] + A3[1] * A3[1];
};
Vec.len = (A3) => {
  return Math.hypot(A3[0], A3[1]);
};
Vec.pry = (A3, B3) => {
  return _Vec.dpr(A3, B3) / _Vec.len(B3);
};
Vec.uni = (A3) => {
  return _Vec.div(A3, _Vec.len(A3));
};
Vec.normalize = (A3) => {
  return _Vec.uni(A3);
};
Vec.tangent = (A3, B3) => {
  return _Vec.uni(_Vec.sub(A3, B3));
};
Vec.dist2 = (A3, B3) => {
  return _Vec.len2(_Vec.sub(A3, B3));
};
Vec.dist = (A3, B3) => {
  return Math.hypot(A3[1] - B3[1], A3[0] - B3[0]);
};
Vec.fastDist = (A3, B3) => {
  const V4 = [B3[0] - A3[0], B3[1] - A3[1]];
  const aV = [Math.abs(V4[0]), Math.abs(V4[1])];
  let r2 = 1 / Math.max(aV[0], aV[1]);
  r2 = r2 * (1.29289 - (aV[0] + aV[1]) * r2 * 0.29289);
  return [V4[0] * r2, V4[1] * r2];
};
Vec.ang = (A3, B3) => {
  return Math.atan2(_Vec.cpr(A3, B3), _Vec.dpr(A3, B3));
};
Vec.angle = (A3, B3) => {
  return Math.atan2(B3[1] - A3[1], B3[0] - A3[0]);
};
Vec.med = (A3, B3) => {
  return _Vec.mul(_Vec.add(A3, B3), 0.5);
};
Vec.rot = (A3, r2 = 0) => {
  return [A3[0] * Math.cos(r2) - A3[1] * Math.sin(r2), A3[0] * Math.sin(r2) + A3[1] * Math.cos(r2)];
};
Vec.rotWith = (A3, C3, r2 = 0) => {
  if (r2 === 0)
    return A3;
  const s2 = Math.sin(r2);
  const c2 = Math.cos(r2);
  const px = A3[0] - C3[0];
  const py = A3[1] - C3[1];
  const nx = px * c2 - py * s2;
  const ny = px * s2 + py * c2;
  return [nx + C3[0], ny + C3[1]];
};
Vec.isEqual = (A3, B3) => {
  return A3[0] === B3[0] && A3[1] === B3[1];
};
Vec.lrp = (A3, B3, t) => {
  return _Vec.add(A3, _Vec.mul(_Vec.sub(B3, A3), t));
};
Vec.int = (A3, B3, from, to, s2 = 1) => {
  const t = (_Vec.clamp(from, to) - from) / (to - from);
  return _Vec.add(_Vec.mul(A3, 1 - t), _Vec.mul(B3, s2));
};
Vec.ang3 = (p1, pc, p2) => {
  const v12 = _Vec.vec(pc, p1);
  const v2 = _Vec.vec(pc, p2);
  return _Vec.ang(v12, v2);
};
Vec.abs = (A3) => {
  return [Math.abs(A3[0]), Math.abs(A3[1])];
};
Vec.rescale = (a3, n2) => {
  const l3 = _Vec.len(a3);
  return [n2 * a3[0] / l3, n2 * a3[1] / l3];
};
Vec.isLeft = (p1, pc, p2) => {
  return (pc[0] - p1[0]) * (p2[1] - p1[1]) - (p2[0] - p1[0]) * (pc[1] - p1[1]);
};
Vec.clockwise = (p1, pc, p2) => {
  return _Vec.isLeft(p1, pc, p2) > 0;
};
Vec.toFixed = (a3) => {
  return a3.map((v2) => Math.round(v2 * 100) / 100);
};
Vec.nearestPointOnLineThroughPoint = (A3, u2, P2) => {
  return _Vec.add(A3, _Vec.mul(u2, _Vec.pry(_Vec.sub(P2, A3), u2)));
};
Vec.distanceToLineThroughPoint = (A3, u2, P2) => {
  return _Vec.dist(P2, _Vec.nearestPointOnLineThroughPoint(A3, u2, P2));
};
Vec.nearestPointOnLineSegment = (A3, B3, P2, clamp3 = true) => {
  const u2 = _Vec.uni(_Vec.sub(B3, A3));
  const C3 = _Vec.add(A3, _Vec.mul(u2, _Vec.pry(_Vec.sub(P2, A3), u2)));
  if (clamp3) {
    if (C3[0] < Math.min(A3[0], B3[0]))
      return A3[0] < B3[0] ? A3 : B3;
    if (C3[0] > Math.max(A3[0], B3[0]))
      return A3[0] > B3[0] ? A3 : B3;
    if (C3[1] < Math.min(A3[1], B3[1]))
      return A3[1] < B3[1] ? A3 : B3;
    if (C3[1] > Math.max(A3[1], B3[1]))
      return A3[1] > B3[1] ? A3 : B3;
  }
  return C3;
};
Vec.distanceToLineSegment = (A3, B3, P2, clamp3 = true) => {
  return _Vec.dist(P2, _Vec.nearestPointOnLineSegment(A3, B3, P2, clamp3));
};
Vec.nudge = (A3, B3, d2) => {
  if (_Vec.isEqual(A3, B3))
    return A3;
  return _Vec.add(A3, _Vec.mul(_Vec.uni(_Vec.sub(B3, A3)), d2));
};
Vec.nudgeAtAngle = (A3, a3, d2) => {
  return [Math.cos(a3) * d2 + A3[0], Math.sin(a3) * d2 + A3[1]];
};
Vec.toPrecision = (a3, n2 = 4) => {
  return [+a3[0].toPrecision(n2), +a3[1].toPrecision(n2)];
};
Vec.pointsBetween = (A3, B3, steps = 6) => {
  return Array.from(Array(steps)).map((_2, i2) => {
    const t = i2 / (steps - 1);
    const k2 = Math.min(1, 0.5 + Math.abs(0.5 - t));
    return [..._Vec.lrp(A3, B3, t), k2];
  });
};
Vec.slope = (A3, B3) => {
  if (A3[0] === B3[0])
    return NaN;
  return (A3[1] - B3[1]) / (A3[0] - B3[0]);
};
Vec.toAngle = (A3) => {
  const angle = Math.atan2(A3[1], A3[0]);
  if (angle < 0)
    return angle + Math.PI * 2;
  return angle;
};
Vec.max = (...v2) => {
  return [Math.max(...v2.map((a3) => a3[0])), Math.max(...v2.map((a3) => a3[1]))];
};
Vec.min = (...v2) => {
  return [Math.min(...v2.map((a3) => a3[0])), Math.min(...v2.map((a3) => a3[1]))];
};
var src_default = Vec;

// ../../node_modules/potpack/index.js
function potpack(boxes) {
  let area = 0;
  let maxWidth = 0;
  for (const box2 of boxes) {
    area += box2.w * box2.h;
    maxWidth = Math.max(maxWidth, box2.w);
  }
  boxes.sort((a3, b3) => b3.h - a3.h);
  const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);
  const spaces = [{ x: 0, y: 0, w: startWidth, h: Infinity }];
  let width = 0;
  let height = 0;
  for (const box2 of boxes) {
    for (let i2 = spaces.length - 1; i2 >= 0; i2--) {
      const space = spaces[i2];
      if (box2.w > space.w || box2.h > space.h)
        continue;
      box2.x = space.x;
      box2.y = space.y;
      height = Math.max(height, box2.y + box2.h);
      width = Math.max(width, box2.x + box2.w);
      if (box2.w === space.w && box2.h === space.h) {
        const last = spaces.pop();
        if (i2 < spaces.length)
          spaces[i2] = last;
      } else if (box2.h === space.h) {
        space.x += box2.w;
        space.w -= box2.w;
      } else if (box2.w === space.w) {
        space.y += box2.h;
        space.h -= box2.h;
      } else {
        spaces.push({
          x: space.x + box2.w,
          y: space.y,
          w: space.w - box2.w,
          h: box2.h
        });
        space.y += box2.h;
        space.h -= box2.h;
      }
      break;
    }
  }
  return {
    w: width,
    h: height,
    fill: area / (width * height) || 0
  };
}

// ../../packages/core/src/utils/BoundsUtils.ts
var BoundsUtils = class {
  static getRectangleSides(point, size, rotation = 0) {
    const center = [point[0] + size[0] / 2, point[1] + size[1] / 2];
    const tl = Vec.rotWith(point, center, rotation);
    const tr = Vec.rotWith(Vec.add(point, [size[0], 0]), center, rotation);
    const br = Vec.rotWith(Vec.add(point, size), center, rotation);
    const bl = Vec.rotWith(Vec.add(point, [0, size[1]]), center, rotation);
    return [
      ["top", [tl, tr]],
      ["right", [tr, br]],
      ["bottom", [br, bl]],
      ["left", [bl, tl]]
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
  static boundsCollide(a3, b3) {
    return !(a3.maxX < b3.minX || a3.minX > b3.maxX || a3.maxY < b3.minY || a3.minY > b3.maxY);
  }
  static boundsContain(a3, b3) {
    if (Array.isArray(b3)) {
      return a3.minX < b3[0] && a3.minY < b3[1] && a3.maxY > b3[1] && a3.maxX > b3[0];
    }
    return a3.minX < b3.minX && a3.minY < b3.minY && a3.maxY > b3.maxY && a3.maxX > b3.maxX;
  }
  static boundsContained(a3, b3) {
    return BoundsUtils.boundsContain(b3, a3);
  }
  static boundsAreEqual(a3, b3) {
    return !(b3.maxX !== a3.maxX || b3.minX !== a3.minX || b3.maxY !== a3.maxY || b3.minY !== a3.minY);
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
      return BoundsUtils.getBoundsFromPoints(
        points.map((pt2) => Vec.rotWith(pt2, [(minX + maxX) / 2, (minY + maxY) / 2], rotation))
      );
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
  static multiplyBounds(bounds, n2) {
    const center = BoundsUtils.getBoundsCenter(bounds);
    return BoundsUtils.centerBounds(
      {
        minX: bounds.minX * n2,
        minY: bounds.minY * n2,
        maxX: bounds.maxX * n2,
        maxY: bounds.maxY * n2,
        width: bounds.width * n2,
        height: bounds.height * n2
      },
      [center[0] * n2, center[1] * n2]
    );
  }
  static divideBounds(bounds, n2) {
    const center = BoundsUtils.getBoundsCenter(bounds);
    return BoundsUtils.centerBounds(
      {
        minX: bounds.minX / n2,
        minY: bounds.minY / n2,
        maxX: bounds.maxX / n2,
        maxY: bounds.maxY / n2,
        width: bounds.width / n2,
        height: bounds.height / n2
      },
      [center[0] / n2, center[1] / n2]
    );
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
  static getRotatedEllipseBounds(x2, y2, rx, ry, rotation = 0) {
    const c2 = Math.cos(rotation);
    const s2 = Math.sin(rotation);
    const w2 = Math.hypot(rx * c2, ry * s2);
    const h2 = Math.hypot(rx * s2, ry * c2);
    return {
      minX: x2 + rx - w2,
      minY: y2 + ry - h2,
      maxX: x2 + rx + w2,
      maxY: y2 + ry + h2,
      width: w2 * 2,
      height: h2 * 2
    };
  }
  static getExpandedBounds(a3, b3) {
    const minX = Math.min(a3.minX, b3.minX);
    const minY = Math.min(a3.minY, b3.minY);
    const maxX = Math.max(a3.maxX, b3.maxX);
    const maxY = Math.max(a3.maxY, b3.maxY);
    const width = Math.abs(maxX - minX);
    const height = Math.abs(maxY - minY);
    return { minX, minY, maxX, maxY, width, height };
  }
  static getCommonBounds(bounds) {
    if (bounds.length < 2)
      return bounds[0];
    let result = bounds[0];
    for (let i2 = 1; i2 < bounds.length; i2++) {
      result = BoundsUtils.getExpandedBounds(result, bounds[i2]);
    }
    return result;
  }
  static getRotatedCorners(b3, rotation = 0) {
    const center = [b3.minX + b3.width / 2, b3.minY + b3.height / 2];
    const corners = [
      [b3.minX, b3.minY],
      [b3.maxX, b3.minY],
      [b3.maxX, b3.maxY],
      [b3.minX, b3.maxY]
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
      case "top_edge" /* Top */:
      case "top_left_corner" /* TopLeft */:
      case "top_right_corner" /* TopRight */: {
        by0 += dy;
        break;
      }
      case "bottom_edge" /* Bottom */:
      case "bottom_left_corner" /* BottomLeft */:
      case "bottom_right_corner" /* BottomRight */: {
        by1 += dy;
        break;
      }
    }
    switch (handle) {
      case "left_edge" /* Left */:
      case "top_left_corner" /* TopLeft */:
      case "bottom_left_corner" /* BottomLeft */: {
        bx0 += dx;
        break;
      }
      case "right_edge" /* Right */:
      case "top_right_corner" /* TopRight */:
      case "bottom_right_corner" /* BottomRight */: {
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
        case "top_left_corner" /* TopLeft */: {
          if (isTall)
            by0 = by1 + tw;
          else
            bx0 = bx1 + th;
          break;
        }
        case "top_right_corner" /* TopRight */: {
          if (isTall)
            by0 = by1 + tw;
          else
            bx1 = bx0 - th;
          break;
        }
        case "bottom_right_corner" /* BottomRight */: {
          if (isTall)
            by1 = by0 - tw;
          else
            bx1 = bx0 - th;
          break;
        }
        case "bottom_left_corner" /* BottomLeft */: {
          if (isTall)
            by1 = by0 - tw;
          else
            bx0 = bx1 + th;
          break;
        }
        case "bottom_edge" /* Bottom */:
        case "top_edge" /* Top */: {
          const m2 = (bx0 + bx1) / 2;
          const w2 = bh * ar;
          bx0 = m2 - w2 / 2;
          bx1 = m2 + w2 / 2;
          break;
        }
        case "left_edge" /* Left */:
        case "right_edge" /* Right */: {
          const m2 = (by0 + by1) / 2;
          const h2 = bw / ar;
          by0 = m2 - h2 / 2;
          by1 = m2 + h2 / 2;
          break;
        }
      }
    }
    if (rotation % (Math.PI * 2) !== 0) {
      let cv = [0, 0];
      const c0 = Vec.med([ax0, ay0], [ax1, ay1]);
      const c1 = Vec.med([bx0, by0], [bx1, by1]);
      switch (handle) {
        case "top_left_corner" /* TopLeft */: {
          cv = Vec.sub(Vec.rotWith([bx1, by1], c1, rotation), Vec.rotWith([ax1, ay1], c0, rotation));
          break;
        }
        case "top_right_corner" /* TopRight */: {
          cv = Vec.sub(Vec.rotWith([bx0, by1], c1, rotation), Vec.rotWith([ax0, ay1], c0, rotation));
          break;
        }
        case "bottom_right_corner" /* BottomRight */: {
          cv = Vec.sub(Vec.rotWith([bx0, by0], c1, rotation), Vec.rotWith([ax0, ay0], c0, rotation));
          break;
        }
        case "bottom_left_corner" /* BottomLeft */: {
          cv = Vec.sub(Vec.rotWith([bx1, by0], c1, rotation), Vec.rotWith([ax1, ay0], c0, rotation));
          break;
        }
        case "top_edge" /* Top */: {
          cv = Vec.sub(
            Vec.rotWith(Vec.med([bx0, by1], [bx1, by1]), c1, rotation),
            Vec.rotWith(Vec.med([ax0, ay1], [ax1, ay1]), c0, rotation)
          );
          break;
        }
        case "left_edge" /* Left */: {
          cv = Vec.sub(
            Vec.rotWith(Vec.med([bx1, by0], [bx1, by1]), c1, rotation),
            Vec.rotWith(Vec.med([ax1, ay0], [ax1, ay1]), c0, rotation)
          );
          break;
        }
        case "bottom_edge" /* Bottom */: {
          cv = Vec.sub(
            Vec.rotWith(Vec.med([bx0, by0], [bx1, by0]), c1, rotation),
            Vec.rotWith(Vec.med([ax0, ay0], [ax1, ay0]), c0, rotation)
          );
          break;
        }
        case "right_edge" /* Right */: {
          cv = Vec.sub(
            Vec.rotWith(Vec.med([bx0, by0], [bx0, by1]), c1, rotation),
            Vec.rotWith(Vec.med([ax0, ay0], [ax0, ay1]), c0, rotation)
          );
          break;
        }
      }
      ;
      [bx0, by0] = Vec.sub([bx0, by0], cv);
      [bx1, by1] = Vec.sub([bx1, by1], cv);
    }
    if (bx1 < bx0) {
      ;
      [bx1, bx0] = [bx0, bx1];
    }
    if (by1 < by0) {
      ;
      [by1, by0] = [by0, by1];
    }
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
      case "top_left_corner" /* TopLeft */: {
        if (isFlippedX && isFlippedY) {
          anchor = "bottom_right_corner" /* BottomRight */;
        } else if (isFlippedX) {
          anchor = "top_right_corner" /* TopRight */;
        } else if (isFlippedY) {
          anchor = "bottom_left_corner" /* BottomLeft */;
        } else {
          anchor = "bottom_right_corner" /* BottomRight */;
        }
        break;
      }
      case "top_right_corner" /* TopRight */: {
        if (isFlippedX && isFlippedY) {
          anchor = "bottom_left_corner" /* BottomLeft */;
        } else if (isFlippedX) {
          anchor = "top_left_corner" /* TopLeft */;
        } else if (isFlippedY) {
          anchor = "bottom_right_corner" /* BottomRight */;
        } else {
          anchor = "bottom_left_corner" /* BottomLeft */;
        }
        break;
      }
      case "bottom_right_corner" /* BottomRight */: {
        if (isFlippedX && isFlippedY) {
          anchor = "top_left_corner" /* TopLeft */;
        } else if (isFlippedX) {
          anchor = "bottom_left_corner" /* BottomLeft */;
        } else if (isFlippedY) {
          anchor = "top_right_corner" /* TopRight */;
        } else {
          anchor = "top_left_corner" /* TopLeft */;
        }
        break;
      }
      case "bottom_left_corner" /* BottomLeft */: {
        if (isFlippedX && isFlippedY) {
          anchor = "top_right_corner" /* TopRight */;
        } else if (isFlippedX) {
          anchor = "bottom_right_corner" /* BottomRight */;
        } else if (isFlippedY) {
          anchor = "top_left_corner" /* TopLeft */;
        } else {
          anchor = "top_right_corner" /* TopRight */;
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
    const points = [[0, 0], [size[0], 0], size, [0, size[1]]].map(
      (point) => Vec.rotWith(point, center, rotation)
    );
    const bounds = BoundsUtils.getBoundsFromPoints(points);
    return [bounds.width, bounds.height];
  }
  static getBoundsCenter(bounds) {
    return [bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2];
  }
  static getBoundsWithCenter(bounds) {
    const center = BoundsUtils.getBoundsCenter(bounds);
    return __spreadProps(__spreadValues({}, bounds), {
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
    const A3 = __spreadValues({}, bounds);
    const offset = [0, 0];
    const snapLines = [];
    const snaps = {
      ["minX" /* minX */]: { id: "minX" /* minX */, isSnapped: false },
      ["midX" /* midX */]: { id: "midX" /* midX */, isSnapped: false },
      ["maxX" /* maxX */]: { id: "maxX" /* maxX */, isSnapped: false },
      ["minY" /* minY */]: { id: "minY" /* minY */, isSnapped: false },
      ["midY" /* midY */]: { id: "midY" /* midY */, isSnapped: false },
      ["maxY" /* maxY */]: { id: "maxY" /* maxY */, isSnapped: false }
    };
    const xs = ["midX" /* midX */, "minX" /* minX */, "maxX" /* maxX */];
    const ys = ["midY" /* midY */, "minY" /* minY */, "maxY" /* maxY */];
    const snapResults = others.map((B3) => {
      const rx = xs.flatMap(
        (f2, i2) => xs.map((t, k2) => {
          const gap = A3[f2] - B3[t];
          const distance = Math.abs(gap);
          return {
            f: f2,
            t,
            gap,
            distance,
            isCareful: i2 === 0 || i2 + k2 === 3
          };
        })
      );
      const ry = ys.flatMap(
        (f2, i2) => ys.map((t, k2) => {
          const gap = A3[f2] - B3[t];
          const distance = Math.abs(gap);
          return {
            f: f2,
            t,
            gap,
            distance,
            isCareful: i2 === 0 || i2 + k2 === 3
          };
        })
      );
      return [B3, rx, ry];
    });
    let gapX = Infinity;
    let gapY = Infinity;
    let minX = Infinity;
    let minY = Infinity;
    snapResults.forEach(([_2, rx, ry]) => {
      rx.forEach((r2) => {
        if (r2.distance < snapDistance && r2.distance < minX) {
          minX = r2.distance;
          gapX = r2.gap;
        }
      });
      ry.forEach((r2) => {
        if (r2.distance < snapDistance && r2.distance < minY) {
          minY = r2.distance;
          gapY = r2.gap;
        }
      });
    });
    snapResults.forEach(([B3, rx, ry]) => {
      if (gapX !== Infinity) {
        rx.forEach((r2) => {
          if (Math.abs(r2.gap - gapX) < 2) {
            snaps[r2.f] = __spreadProps(__spreadValues({}, snaps[r2.f]), {
              isSnapped: true,
              to: B3[r2.t],
              B: B3,
              distance: r2.distance
            });
          }
        });
      }
      if (gapY !== Infinity) {
        ry.forEach((r2) => {
          if (Math.abs(r2.gap - gapY) < 2) {
            snaps[r2.f] = __spreadProps(__spreadValues({}, snaps[r2.f]), {
              isSnapped: true,
              to: B3[r2.t],
              B: B3,
              distance: r2.distance
            });
          }
        });
      }
    });
    offset[0] = gapX === Infinity ? 0 : gapX;
    offset[1] = gapY === Infinity ? 0 : gapY;
    A3.minX -= offset[0];
    A3.midX -= offset[0];
    A3.maxX -= offset[0];
    A3.minY -= offset[1];
    A3.midY -= offset[1];
    A3.maxY -= offset[1];
    xs.forEach((from) => {
      const snap = snaps[from];
      if (!snap.isSnapped)
        return;
      const { id: id3, B: B3 } = snap;
      const x2 = A3[id3];
      snapLines.push(
        id3 === "minX" /* minX */ ? [
          [x2, A3.midY],
          [x2, B3.minY],
          [x2, B3.maxY]
        ] : [
          [x2, A3.minY],
          [x2, A3.maxY],
          [x2, B3.minY],
          [x2, B3.maxY]
        ]
      );
    });
    ys.forEach((from) => {
      const snap = snaps[from];
      if (!snap.isSnapped)
        return;
      const { id: id3, B: B3 } = snap;
      const y2 = A3[id3];
      snapLines.push(
        id3 === "midY" /* midY */ ? [
          [A3.midX, y2],
          [B3.minX, y2],
          [B3.maxX, y2]
        ] : [
          [A3.minX, y2],
          [A3.maxX, y2],
          [B3.minX, y2],
          [B3.maxX, y2]
        ]
      );
    });
    return { offset, snapLines };
  }
  static ensureRatio(bounds, ratio) {
    const { width, height } = bounds;
    const newBounds = __spreadValues({}, bounds);
    if (width / height < ratio) {
      newBounds.width = height * ratio;
      newBounds.maxX += width - bounds.width;
    } else {
      newBounds.height = width / ratio;
      newBounds.maxY += height - bounds.height;
    }
    return newBounds;
  }
  static getDistributions(shapes2, type) {
    const entries = shapes2.map((shape) => {
      const bounds = shape.getBounds();
      return {
        id: shape.id,
        point: [bounds.minX, bounds.minY],
        bounds,
        center: shape.getCenter()
      };
    });
    const len = entries.length;
    const commonBounds = BoundsUtils.getCommonBounds(entries.map(({ bounds }) => bounds));
    const results = [];
    switch (type) {
      case "horizontal" /* Horizontal */: {
        const span = entries.reduce((a3, c2) => a3 + c2.bounds.width, 0);
        if (span > commonBounds.width) {
          const left = entries.sort((a3, b3) => a3.bounds.minX - b3.bounds.minX)[0];
          const right = entries.sort((a3, b3) => b3.bounds.maxX - a3.bounds.maxX)[0];
          const entriesToMove = entries.filter((a3) => a3 !== left && a3 !== right).sort((a3, b3) => a3.center[0] - b3.center[0]);
          const step = (right.center[0] - left.center[0]) / (len - 1);
          const x2 = left.center[0] + step;
          entriesToMove.forEach(({ id: id3, point, bounds }, i2) => {
            results.push({
              id: id3,
              prev: point,
              next: [x2 + step * i2 - bounds.width / 2, bounds.minY]
            });
          });
        } else {
          const entriesToMove = entries.sort((a3, b3) => a3.center[0] - b3.center[0]);
          let x2 = commonBounds.minX;
          const step = (commonBounds.width - span) / (len - 1);
          entriesToMove.forEach(({ id: id3, point, bounds }) => {
            results.push({ id: id3, prev: point, next: [x2, bounds.minY] });
            x2 += bounds.width + step;
          });
        }
        break;
      }
      case "vertical" /* Vertical */: {
        const span = entries.reduce((a3, c2) => a3 + c2.bounds.height, 0);
        if (span > commonBounds.height) {
          const top = entries.sort((a3, b3) => a3.bounds.minY - b3.bounds.minY)[0];
          const bottom = entries.sort((a3, b3) => b3.bounds.maxY - a3.bounds.maxY)[0];
          const entriesToMove = entries.filter((a3) => a3 !== top && a3 !== bottom).sort((a3, b3) => a3.center[1] - b3.center[1]);
          const step = (bottom.center[1] - top.center[1]) / (len - 1);
          const y2 = top.center[1] + step;
          entriesToMove.forEach(({ id: id3, point, bounds }, i2) => {
            results.push({
              id: id3,
              prev: point,
              next: [bounds.minX, y2 + step * i2 - bounds.height / 2]
            });
          });
        } else {
          const entriesToMove = entries.sort((a3, b3) => a3.center[1] - b3.center[1]);
          let y2 = commonBounds.minY;
          const step = (commonBounds.height - span) / (len - 1);
          entriesToMove.forEach(({ id: id3, point, bounds }) => {
            results.push({ id: id3, prev: point, next: [bounds.minX, y2] });
            y2 += bounds.height + step;
          });
        }
        break;
      }
    }
    return results;
  }
  static getPackedDistributions(shapes2) {
    const commonBounds = BoundsUtils.getCommonBounds(shapes2.map(({ bounds }) => bounds));
    const origin = [commonBounds.minX, commonBounds.minY];
    const shapesPosOriginal = Object.fromEntries(
      shapes2.map((s2) => [s2.id, [s2.bounds.minX, s2.bounds.minY]])
    );
    const entries = shapes2.filter((s2) => {
      var _a3, _b, _c, _d;
      return !(((_b = (_a3 = s2.props.handles) == null ? void 0 : _a3.start) == null ? void 0 : _b.bindingId) || ((_d = (_c = s2.props.handles) == null ? void 0 : _c.end) == null ? void 0 : _d.bindingId));
    }).map((shape) => {
      const bounds = shape.getBounds();
      return {
        id: shape.id,
        w: bounds.width + 16,
        h: bounds.height + 16,
        x: bounds.minX,
        y: bounds.minY
      };
    });
    potpack(entries);
    const entriesToMove = entries.map(({ id: id3, x: x2, y: y2 }) => {
      return {
        id: id3,
        prev: shapesPosOriginal[id3],
        next: [x2 + origin[0], y2 + origin[1]]
      };
    });
    return entriesToMove;
  }
};

// ../../packages/core/src/utils/PointUtils.ts
var _PointUtils = class {
  static pointInCircle(A3, C3, r2) {
    return Vec.dist(A3, C3) <= r2;
  }
  static pointInEllipse(A3, C3, rx, ry, rotation = 0) {
    rotation = rotation || 0;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const delta = Vec.sub(A3, C3);
    const tdx = cos * delta[0] + sin * delta[1];
    const tdy = sin * delta[0] - cos * delta[1];
    return tdx * tdx / (rx * rx) + tdy * tdy / (ry * ry) <= 1;
  }
  static pointInRect(point, size) {
    return !(point[0] < size[0] || point[0] > point[0] + size[0] || point[1] < size[1] || point[1] > point[1] + size[1]);
  }
  static pointInPolygon(p2, points) {
    let wn = 0;
    points.forEach((a3, i2) => {
      const b3 = points[(i2 + 1) % points.length];
      if (a3[1] <= p2[1]) {
        if (b3[1] > p2[1] && Vec.cross(a3, b3, p2) > 0) {
          wn += 1;
        }
      } else if (b3[1] <= p2[1] && Vec.cross(a3, b3, p2) < 0) {
        wn -= 1;
      }
    });
    return wn !== 0;
  }
  static pointInBounds(A3, b3) {
    return !(A3[0] < b3.minX || A3[0] > b3.maxX || A3[1] < b3.minY || A3[1] > b3.maxY);
  }
  static pointInPolyline(A3, points, distance = 3) {
    for (let i2 = 1; i2 < points.length; i2++) {
      if (Vec.distanceToLineSegment(points[i2 - 1], points[i2], A3) < distance) {
        return true;
      }
    }
    return false;
  }
  static _getSqSegDist(p2, p1, p22) {
    let x2 = p1[0];
    let y2 = p1[1];
    let dx = p22[0] - x2;
    let dy = p22[1] - y2;
    if (dx !== 0 || dy !== 0) {
      const t = ((p2[0] - x2) * dx + (p2[1] - y2) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x2 = p22[0];
        y2 = p22[1];
      } else if (t > 0) {
        x2 += dx * t;
        y2 += dy * t;
      }
    }
    dx = p2[0] - x2;
    dy = p2[1] - y2;
    return dx * dx + dy * dy;
  }
  static _simplifyStep(points, first, last, sqTolerance, result) {
    let maxSqDist = sqTolerance;
    let index2 = -1;
    for (let i2 = first + 1; i2 < last; i2++) {
      const sqDist = _PointUtils._getSqSegDist(points[i2], points[first], points[last]);
      if (sqDist > maxSqDist) {
        index2 = i2;
        maxSqDist = sqDist;
      }
    }
    if (index2 > -1 && maxSqDist > sqTolerance) {
      if (index2 - first > 1)
        _PointUtils._simplifyStep(points, first, index2, sqTolerance, result);
      result.push(points[index2]);
      if (last - index2 > 1)
        _PointUtils._simplifyStep(points, index2, last, sqTolerance, result);
    }
  }
  static simplify2(points, tolerance = 1) {
    if (points.length <= 2)
      return points;
    const sqTolerance = tolerance * tolerance;
    let A3 = points[0];
    let B3 = points[1];
    const newPoints = [A3];
    for (let i2 = 1, len = points.length; i2 < len; i2++) {
      B3 = points[i2];
      if ((B3[0] - A3[0]) * (B3[0] - A3[0]) + (B3[1] - A3[1]) * (B3[1] - A3[1]) > sqTolerance) {
        newPoints.push(B3);
        A3 = B3;
      }
    }
    if (A3 !== B3)
      newPoints.push(B3);
    const last = newPoints.length - 1;
    const result = [newPoints[0]];
    _PointUtils._simplifyStep(newPoints, 0, last, sqTolerance, result);
    result.push(newPoints[last], points[points.length - 1]);
    return result;
  }
  static pointNearToPolyline(point, points, distance = 8) {
    const len = points.length;
    for (let i2 = 1; i2 < len; i2++) {
      const p1 = points[i2 - 1];
      const p2 = points[i2];
      const d2 = Vec.distanceToLineSegment(p1, p2, point);
      if (d2 < distance)
        return true;
    }
    return false;
  }
};
var PointUtils = _PointUtils;
__publicField(PointUtils, "simplify", (points, tolerance = 1) => {
  const len = points.length;
  const a3 = points[0];
  const b3 = points[len - 1];
  const [x1, y1] = a3;
  const [x2, y2] = b3;
  if (len > 2) {
    let distance = 0;
    let index2 = 0;
    const max = Vec.len2([y2 - y1, x2 - x1]);
    for (let i2 = 1; i2 < len - 1; i2++) {
      const [x0, y0] = points[i2];
      const d2 = Math.pow(x0 * (y2 - y1) + x1 * (y0 - y2) + x2 * (y1 - y0), 2) / max;
      if (distance > d2)
        continue;
      distance = d2;
      index2 = i2;
    }
    if (distance > tolerance) {
      const l0 = _PointUtils.simplify(points.slice(0, index2 + 1), tolerance);
      const l1 = _PointUtils.simplify(points.slice(index2 + 1), tolerance);
      return l0.concat(l1.slice(1));
    }
  }
  return [a3, b3];
});

// ../../packages/core/src/constants.ts
var PI = Math.PI;
var TAU = PI / 2;
var PI2 = PI * 2;
var EPSILON = Math.PI / 180;
var FIT_TO_SCREEN_PADDING = 100;
var BINDING_DISTANCE = 4;
var ZOOM_UPDATE_FACTOR = 0.8;
var GRID_SIZE = 8;
var EXPORT_PADDING = 8;
var EMPTY_OBJECT = {};
var GROUP_PADDING = 8;
var CURSORS = {
  ["bottom_edge" /* Bottom */]: "ns-resize" /* NsResize */,
  ["top_edge" /* Top */]: "ns-resize" /* NsResize */,
  ["left_edge" /* Left */]: "ew-resize" /* EwResize */,
  ["right_edge" /* Right */]: "ew-resize" /* EwResize */,
  ["bottom_left_corner" /* BottomLeft */]: "nesw-resize" /* NeswResize */,
  ["bottom_right_corner" /* BottomRight */]: "nwse-resize" /* NwseResize */,
  ["top_left_corner" /* TopLeft */]: "nwse-resize" /* NwseResize */,
  ["top_right_corner" /* TopRight */]: "nesw-resize" /* NeswResize */,
  ["bottom_left_resize_corner" /* BottomLeft */]: "swne-rotate" /* SwneRotate */,
  ["bottom_right_resize_corner" /* BottomRight */]: "senw-rotate" /* SenwRotate */,
  ["top_left_resize_corner" /* TopLeft */]: "nwse-rotate" /* NwseRotate */,
  ["top_right_resize_corner" /* TopRight */]: "nesw-rotate" /* NeswRotate */,
  rotate: "rotate" /* Rotate */,
  center: "grab" /* Grab */,
  background: "grab" /* Grab */
};

// ../../packages/core/src/utils/GeomUtils.ts
var GeomUtils = class {
  static circleFromThreePoints(A3, B3, C3) {
    const [x1, y1] = A3;
    const [x2, y2] = B3;
    const [x3, y3] = C3;
    const a3 = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
    const b3 = (x1 * x1 + y1 * y1) * (y3 - y2) + (x2 * x2 + y2 * y2) * (y1 - y3) + (x3 * x3 + y3 * y3) * (y2 - y1);
    const c2 = (x1 * x1 + y1 * y1) * (x2 - x3) + (x2 * x2 + y2 * y2) * (x3 - x1) + (x3 * x3 + y3 * y3) * (x1 - x2);
    const x4 = -b3 / (2 * a3);
    const y4 = -c2 / (2 * a3);
    return [x4, y4, Math.hypot(x4 - x1, y4 - y1)];
  }
  static perimeterOfEllipse(rx, ry) {
    const h2 = Math.pow(rx - ry, 2) / Math.pow(rx + ry, 2);
    const p2 = PI * (rx + ry) * (1 + 3 * h2 / (10 + Math.sqrt(4 - 3 * h2)));
    return p2;
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
  static getSweep(C3, A3, B3) {
    return GeomUtils.angleDelta(src_default.angle(C3, A3), src_default.angle(C3, B3));
  }
  static clampRadians(r2) {
    return (PI2 + r2) % PI2;
  }
  static snapAngleToSegments(r2, segments) {
    const seg = PI2 / segments;
    let ang = Math.floor((GeomUtils.clampRadians(r2) + seg / 2) / seg) * seg % PI2;
    if (ang < PI)
      ang += PI2;
    if (ang > PI)
      ang -= PI2;
    return ang;
  }
  static isAngleBetween(a3, b3, c2) {
    if (c2 === a3 || c2 === b3)
      return true;
    const AB = (b3 - a3 + TAU) % TAU;
    const AC = (c2 - a3 + TAU) % TAU;
    return AB <= PI !== AC > AB;
  }
  static degreesToRadians(d2) {
    return d2 * PI / 180;
  }
  static radiansToDegrees(r2) {
    return r2 * 180 / PI;
  }
  static getArcLength(C3, r2, A3, B3) {
    const sweep = GeomUtils.getSweep(C3, A3, B3);
    return r2 * PI2 * (sweep / PI2);
  }
  static getSweepFlag(A3, B3, C3) {
    const angleAC = src_default.angle(A3, C3);
    const angleAB = src_default.angle(A3, B3);
    const angleCAB = (angleAB - angleAC + 3 * PI) % PI2 - PI;
    return angleCAB > 0 ? 0 : 1;
  }
  static getLargeArcFlag(A3, C3, P2) {
    const anglePA = src_default.angle(P2, A3);
    const anglePC = src_default.angle(P2, C3);
    const angleAPC = (anglePC - anglePA + 3 * PI) % PI2 - PI;
    return Math.abs(angleAPC) > TAU ? 0 : 1;
  }
  static getArcDashOffset(C3, r2, A3, B3, step) {
    const del0 = GeomUtils.getSweepFlag(C3, A3, B3);
    const len0 = GeomUtils.getArcLength(C3, r2, A3, B3);
    const off0 = del0 < 0 ? len0 : PI2 * C3[2] - len0;
    return -off0 / 2 + step;
  }
  static getEllipseDashOffset(A3, step) {
    const c2 = PI2 * A3[2];
    return -c2 / 2 + -step;
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

// ../../packages/utils/intersect/src/index.ts
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
    ["top", [tl, tr]],
    ["right", [tr, br]],
    ["bottom", [br, bl]],
    ["left", [bl, tl]]
  ];
}
function intersectLineLine(AB, PQ) {
  const slopeAB = Vec.slope(AB[0], AB[1]);
  const slopePQ = Vec.slope(PQ[0], PQ[1]);
  if (slopeAB === slopePQ)
    return void 0;
  if (Number.isNaN(slopeAB) && !Number.isNaN(slopePQ)) {
    return [AB[0][0], (AB[0][0] - PQ[0][0]) * slopePQ + PQ[0][1]];
  }
  if (Number.isNaN(slopePQ) && !Number.isNaN(slopeAB)) {
    return [PQ[0][0], (PQ[0][0] - AB[0][0]) * slopeAB + AB[0][1]];
  }
  const x2 = (slopeAB * AB[0][0] - slopePQ * PQ[0][0] + PQ[0][1] - AB[0][1]) / (slopeAB - slopePQ);
  const y2 = slopePQ * (x2 - PQ[0][0]) + PQ[0][1];
  return [x2, y2];
}
function intersectRayLineSegment(origin, direction, a1, a22) {
  const [x2, y2] = origin;
  const [dx, dy] = direction;
  const [x1, y1] = a1;
  const [x22, y22] = a22;
  if (dy / dx !== (y22 - y1) / (x22 - x1)) {
    const d2 = dx * (y22 - y1) - dy * (x22 - x1);
    if (d2 !== 0) {
      const r2 = ((y2 - y1) * (x22 - x1) - (x2 - x1) * (y22 - y1)) / d2;
      const s2 = ((y2 - y1) * dx - (x2 - x1) * dy) / d2;
      if (r2 >= 0 && s2 >= 0 && s2 <= 1) {
        return createIntersection("intersection", [x2 + r2 * dx, y2 + r2 * dy]);
      }
    }
  }
  return createIntersection("no intersection");
}
function intersectRayRectangle(origin, direction, point, size, rotation = 0) {
  return intersectRectangleRay(point, size, rotation, origin, direction);
}
function intersectRayBounds(origin, direction, bounds, rotation = 0) {
  const { minX, minY, width, height } = bounds;
  return intersectRayRectangle(origin, direction, [minX, minY], [width, height], rotation);
}
function intersectLineSegmentLineSegment(a1, a22, b1, b22) {
  const AB = Vec.sub(a1, b1);
  const BV = Vec.sub(b22, b1);
  const AV = Vec.sub(a22, a1);
  const ua_t = BV[0] * AB[1] - BV[1] * AB[0];
  const ub_t = AV[0] * AB[1] - AV[1] * AB[0];
  const u_b = BV[1] * AV[0] - BV[0] * AV[1];
  if (ua_t === 0 || ub_t === 0) {
    return createIntersection("coincident");
  }
  if (u_b === 0) {
    return createIntersection("parallel");
  }
  if (u_b !== 0) {
    const ua = ua_t / u_b;
    const ub = ub_t / u_b;
    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
      return createIntersection("intersection", Vec.add(a1, Vec.mul(AV, ua)));
    }
  }
  return createIntersection("no intersection");
}
function intersectLineSegmentRectangle(a1, a22, point, size) {
  return intersectRectangleLineSegment(point, size, a1, a22);
}
function intersectLineSegmentCircle(a1, a22, c2, r2) {
  const a3 = (a22[0] - a1[0]) * (a22[0] - a1[0]) + (a22[1] - a1[1]) * (a22[1] - a1[1]);
  const b3 = 2 * ((a22[0] - a1[0]) * (a1[0] - c2[0]) + (a22[1] - a1[1]) * (a1[1] - c2[1]));
  const cc = c2[0] * c2[0] + c2[1] * c2[1] + a1[0] * a1[0] + a1[1] * a1[1] - 2 * (c2[0] * a1[0] + c2[1] * a1[1]) - r2 * r2;
  const deter = b3 * b3 - 4 * a3 * cc;
  if (deter < 0) {
    return createIntersection("outside");
  }
  if (deter === 0) {
    return createIntersection("tangent");
  }
  const e = Math.sqrt(deter);
  const u1 = (-b3 + e) / (2 * a3);
  const u2 = (-b3 - e) / (2 * a3);
  if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
    if (u1 < 0 && u2 < 0 || u1 > 1 && u2 > 1) {
      return createIntersection("outside");
    } else {
      return createIntersection("inside");
    }
  }
  const results = [];
  if (0 <= u1 && u1 <= 1)
    results.push(Vec.lrp(a1, a22, u1));
  if (0 <= u2 && u2 <= 1)
    results.push(Vec.lrp(a1, a22, u2));
  return createIntersection("intersection", ...results);
}
function intersectLineSegmentEllipse(a1, a22, center, rx, ry, rotation = 0) {
  if (rx === 0 || ry === 0 || Vec.isEqual(a1, a22)) {
    return createIntersection("no intersection");
  }
  rx = rx < 0 ? rx : -rx;
  ry = ry < 0 ? ry : -ry;
  a1 = Vec.sub(Vec.rotWith(a1, center, -rotation), center);
  a22 = Vec.sub(Vec.rotWith(a22, center, -rotation), center);
  const diff = Vec.sub(a22, a1);
  const A3 = diff[0] * diff[0] / rx / rx + diff[1] * diff[1] / ry / ry;
  const B3 = 2 * a1[0] * diff[0] / rx / rx + 2 * a1[1] * diff[1] / ry / ry;
  const C3 = a1[0] * a1[0] / rx / rx + a1[1] * a1[1] / ry / ry - 1;
  const tValues = [];
  const discriminant = B3 * B3 - 4 * A3 * C3;
  if (discriminant === 0) {
    tValues.push(-B3 / 2 / A3);
  } else if (discriminant > 0) {
    const root = Math.sqrt(discriminant);
    tValues.push((-B3 + root) / 2 / A3);
    tValues.push((-B3 - root) / 2 / A3);
  }
  const points = tValues.filter((t) => t >= 0 && t <= 1).map((t) => Vec.add(center, Vec.add(a1, Vec.mul(Vec.sub(a22, a1), t)))).map((p2) => Vec.rotWith(p2, center, rotation));
  return createIntersection("intersection", ...points);
}
function intersectLineSegmentBounds(a1, a22, bounds) {
  return intersectBoundsLineSegment(bounds, a1, a22);
}
function intersectLineSegmentPolyline(a1, a22, points) {
  const pts = [];
  for (let i2 = 1; i2 < points.length; i2++) {
    const int = intersectLineSegmentLineSegment(a1, a22, points[i2 - 1], points[i2]);
    if (int) {
      pts.push(...int.points);
    }
  }
  if (pts.length === 0) {
    return createIntersection("no intersection");
  }
  return createIntersection("intersection", ...points);
}
function intersectLineSegmentPolygon(a1, a22, points) {
  const pts = [];
  for (let i2 = 1; i2 < points.length + 1; i2++) {
    const int = intersectLineSegmentLineSegment(a1, a22, points[i2 - 1], points[i2 % points.length]);
    if (int) {
      pts.push(...int.points);
    }
  }
  if (pts.length === 0) {
    return createIntersection("no intersection");
  }
  return createIntersection("intersection", ...points);
}
function intersectRectangleRay(point, size, rotation, origin, direction) {
  const sideIntersections = getRectangleSides(point, size, rotation).reduce(
    (acc, [message, [a1, a22]]) => {
      const intersection = intersectRayLineSegment(origin, direction, a1, a22);
      if (intersection) {
        acc.push(createIntersection(message, ...intersection.points));
      }
      return acc;
    },
    []
  );
  return sideIntersections.filter((int) => int.didIntersect);
}
function intersectRectangleLineSegment(point, size, a1, a22) {
  const sideIntersections = getRectangleSides(point, size).reduce(
    (acc, [message, [b1, b22]]) => {
      const intersection = intersectLineSegmentLineSegment(a1, a22, b1, b22);
      if (intersection) {
        acc.push(createIntersection(message, ...intersection.points));
      }
      return acc;
    },
    []
  );
  return sideIntersections.filter((int) => int.didIntersect);
}
function intersectRectangleCircle(point, size, c2, r2) {
  const sideIntersections = getRectangleSides(point, size).reduce(
    (acc, [message, [a1, a22]]) => {
      const intersection = intersectLineSegmentCircle(a1, a22, c2, r2);
      if (intersection) {
        acc.push(__spreadProps(__spreadValues({}, intersection), { message }));
      }
      return acc;
    },
    []
  );
  return sideIntersections.filter((int) => int.didIntersect);
}
function intersectRectangleEllipse(point, size, c2, rx, ry, rotation = 0) {
  const sideIntersections = getRectangleSides(point, size).reduce(
    (acc, [message, [a1, a22]]) => {
      const intersection = intersectLineSegmentEllipse(a1, a22, c2, rx, ry, rotation);
      if (intersection) {
        acc.push(__spreadProps(__spreadValues({}, intersection), { message }));
      }
      return acc;
    },
    []
  );
  return sideIntersections.filter((int) => int.didIntersect);
}
function intersectRectanglePolyline(point, size, points) {
  const sideIntersections = getRectangleSides(point, size).reduce(
    (acc, [message, [a1, a22]]) => {
      const intersection = intersectLineSegmentPolyline(a1, a22, points);
      if (intersection.didIntersect) {
        acc.push(createIntersection(message, ...intersection.points));
      }
      return acc;
    },
    []
  );
  return sideIntersections.filter((int) => int.didIntersect);
}
function intersectRectanglePolygon(point, size, points) {
  const sideIntersections = getRectangleSides(point, size).reduce(
    (acc, [message, [a1, a22]]) => {
      const intersection = intersectLineSegmentPolygon(a1, a22, points);
      if (intersection.didIntersect) {
        acc.push(createIntersection(message, ...intersection.points));
      }
      return acc;
    },
    []
  );
  return sideIntersections.filter((int) => int.didIntersect);
}
function intersectCircleLineSegment(c2, r2, a1, a22) {
  return intersectLineSegmentCircle(a1, a22, c2, r2);
}
function intersectEllipseRectangle(center, rx, ry, rotation = 0, point, size) {
  if (rx === ry) {
    return intersectRectangleCircle(point, size, center, rx);
  }
  return intersectRectangleEllipse(point, size, center, rx, ry, rotation);
}
function intersectEllipseBounds(c2, rx, ry, rotation, bounds) {
  const { minX, minY, width, height } = bounds;
  return intersectEllipseRectangle(c2, rx, ry, rotation, [minX, minY], [width, height]);
}
function intersectBoundsLineSegment(bounds, a1, a22) {
  const { minX, minY, width, height } = bounds;
  return intersectLineSegmentRectangle(a1, a22, [minX, minY], [width, height]);
}
function intersectPolylineBounds(points, bounds) {
  return intersectRectanglePolyline(
    [bounds.minX, bounds.minY],
    [bounds.width, bounds.height],
    points
  );
}
function intersectPolygonBounds(points, bounds) {
  return intersectRectanglePolygon(
    [bounds.minX, bounds.minY],
    [bounds.width, bounds.height],
    points
  );
}

// ../../packages/core/src/utils/PolygonUtils.ts
var _PolygonUtils = class {
  static getPolygonCentroid(points) {
    const x2 = points.map((point) => point[0]);
    const y2 = points.map((point) => point[1]);
    const cx2 = Math.min(...x2) + Math.max(...x2);
    const cy = Math.min(...y2) + Math.max(...y2);
    return [cx2 ? cx2 / 2 : 0, cy ? cy / 2 : 0];
  }
};
var PolygonUtils = _PolygonUtils;
__publicField(PolygonUtils, "getEdges", (points) => {
  const len = points.length;
  return points.map((point, i2) => [point, points[(i2 + 1) % len]]);
});
__publicField(PolygonUtils, "getEdgeOutwardNormal", (A3, B3) => {
  return src_default.per(src_default.uni(src_default.sub(B3, A3)));
});
__publicField(PolygonUtils, "getEdgeInwardNormal", (A3, B3) => {
  return src_default.neg(_PolygonUtils.getEdgeOutwardNormal(A3, B3));
});
__publicField(PolygonUtils, "getOffsetEdge", (A3, B3, offset) => {
  const offsetVector = src_default.mul(src_default.per(src_default.uni(src_default.sub(B3, A3))), offset);
  return [src_default.add(A3, offsetVector), src_default.add(B3, offsetVector)];
});
__publicField(PolygonUtils, "getOffsetEdges", (edges, offset) => {
  return edges.map(([A3, B3]) => _PolygonUtils.getOffsetEdge(A3, B3, offset));
});
__publicField(PolygonUtils, "getOffsetPolygon", (points, offset) => {
  if (points.length < 1) {
    throw Error("Expected at least one point.");
  } else if (points.length === 1) {
    const A3 = points[0];
    return [
      src_default.add(A3, [-offset, -offset]),
      src_default.add(A3, [offset, -offset]),
      src_default.add(A3, [offset, offset]),
      src_default.add(A3, [-offset, offset])
    ];
  } else if (points.length === 2) {
    const [A3, B3] = points;
    return [
      ..._PolygonUtils.getOffsetEdge(A3, B3, offset),
      ..._PolygonUtils.getOffsetEdge(B3, A3, offset)
    ];
  }
  return _PolygonUtils.getOffsetEdges(_PolygonUtils.getEdges(points), offset).flatMap(
    (edge, i2, edges) => {
      const intersection = intersectLineLine(edge, edges[(i2 + 1) % edges.length]);
      if (intersection === void 0)
        throw Error("Expected an intersection");
      return intersection;
    }
  );
});
__publicField(PolygonUtils, "getPolygonVertices", (size, sides, padding = 0, ratio = 1) => {
  const center = src_default.div(size, 2);
  const [rx, ry] = [Math.max(1, center[0] - padding), Math.max(1, center[1] - padding)];
  const pointsOnPerimeter = [];
  for (let i2 = 0, step = PI2 / sides; i2 < sides; i2++) {
    const t1 = (-TAU + i2 * step) % PI2;
    const t2 = (-TAU + (i2 + 1) * step) % PI2;
    const p1 = src_default.add(center, [rx * Math.cos(t1), ry * Math.sin(t1)]);
    const p3 = src_default.add(center, [rx * Math.cos(t2), ry * Math.sin(t2)]);
    const mid = src_default.med(p1, p3);
    const p2 = src_default.nudge(mid, center, src_default.dist(center, mid) * (1 - ratio));
    pointsOnPerimeter.push(p1, p2, p3);
  }
  return pointsOnPerimeter;
});
__publicField(PolygonUtils, "getTriangleVertices", (size, padding = 0, ratio = 1) => {
  const [w2, h2] = size;
  const r2 = 1 - ratio;
  const A3 = [w2 / 2, padding / 2];
  const B3 = [w2 - padding, h2 - padding];
  const C3 = [padding / 2, h2 - padding];
  const centroid = _PolygonUtils.getPolygonCentroid([A3, B3, C3]);
  const AB = src_default.med(A3, B3);
  const BC = src_default.med(B3, C3);
  const CA = src_default.med(C3, A3);
  const dAB = src_default.dist(AB, centroid) * r2;
  const dBC = src_default.dist(BC, centroid) * r2;
  const dCA = src_default.dist(CA, centroid) * r2;
  return [
    A3,
    dAB ? src_default.nudge(AB, centroid, dAB) : AB,
    B3,
    dBC ? src_default.nudge(BC, centroid, dBC) : BC,
    C3,
    dCA ? src_default.nudge(CA, centroid, dCA) : CA
  ];
});
__publicField(PolygonUtils, "getStarVertices", (center, size, sides, ratio = 1) => {
  const outer = src_default.div(size, 2);
  const inner = src_default.mul(outer, ratio / 2);
  const step = PI2 / sides / 2;
  return Array.from(Array(sides * 2)).map((_2, i2) => {
    const theta = -TAU + i2 * step;
    const [rx, ry] = i2 % 2 ? inner : outer;
    return src_default.add(center, [rx * Math.cos(theta), ry * Math.sin(theta)]);
  });
});

// ../../packages/core/src/utils/SvgPathUtils.ts
var SvgPathUtils = class {
  static getCurvedPathForPolygon(points) {
    if (points.length < 3) {
      return `M -4, 0
      a 4,4 0 1,0 8,0
      a 4,4 0 1,0 -8,0`;
    }
    const d2 = ["M", ...points[0].slice(0, 2), "Q"];
    const len = points.length;
    for (let i2 = 1; i2 < len; i2++) {
      const [x0, y0] = points[i2];
      const [x1, y1] = points[(i2 + 1) % len];
      d2.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    d2.push("Z");
    return d2.join(" ");
  }
  static getCurvedPathForPoints(points) {
    if (points.length < 3) {
      return `M -4, 0
      a 4,4 0 1,0 8,0
      a 4,4 0 1,0 -8,0`;
    }
    const d2 = ["M", ...points[0].slice(0, 2), "Q"];
    const len = points.length;
    for (let i2 = 1; i2 < len - 1; i2++) {
      const [x0, y0] = points[i2];
      const [x1, y1] = points[i2 + 1];
      d2.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    return d2.join(" ");
  }
  static getSvgPathFromStroke(points, closed = true) {
    const len = points.length;
    if (len < 4) {
      return ``;
    }
    let a3 = points[0];
    let b3 = points[1];
    const c2 = points[2];
    let result = `M${a3[0].toFixed(2)},${a3[1].toFixed(2)} Q${b3[0].toFixed(2)},${b3[1].toFixed(
      2
    )} ${average(b3[0], c2[0]).toFixed(2)},${average(b3[1], c2[1]).toFixed(2)} T`;
    for (let i2 = 2, max = len - 1; i2 < max; i2++) {
      a3 = points[i2];
      b3 = points[i2 + 1];
      result += `${average(a3[0], b3[0]).toFixed(2)},${average(a3[1], b3[1]).toFixed(2)} `;
    }
    if (closed) {
      result += "Z";
    }
    return result;
  }
  static getSvgPathFromStrokePoints(points, closed = false) {
    const len = points.length;
    if (len < 4) {
      return ``;
    }
    let a3 = points[0].point;
    let b3 = points[1].point;
    const c2 = points[2].point;
    let result = `M${a3[0].toFixed(2)},${a3[1].toFixed(2)} Q${b3[0].toFixed(2)},${b3[1].toFixed(
      2
    )} ${average(b3[0], c2[0]).toFixed(2)},${average(b3[1], c2[1]).toFixed(2)} T`;
    for (let i2 = 2, max = len - 1; i2 < max; i2++) {
      a3 = points[i2].point;
      b3 = points[i2 + 1].point;
      result += `${average(a3[0], b3[0]).toFixed(2)},${average(a3[1], b3[1]).toFixed(2)} `;
    }
    if (closed) {
      result += "Z";
    }
    return result;
  }
};
__publicField(SvgPathUtils, "TRIM_NUMBERS", /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g);
function average(a3, b3) {
  return (a3 + b3) / 2;
}

// ../../node_modules/mobx/dist/mobx.esm.js
function die(error) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  if (false) {
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
var EMPTY_OBJECT2 = {};
Object.freeze(EMPTY_OBJECT2);
var hasProxy = typeof Proxy !== "undefined";
var plainObjectString = /* @__PURE__ */ Object.toString();
function assertProxies() {
  if (!hasProxy) {
    die(false ? "`Proxy` objects are not available in the current environment. Please configure MobX to enable a fallback implementation.`" : "Proxy not available");
  }
}
function once(func) {
  var invoked = false;
  return function() {
    if (invoked) {
      return;
    }
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
  if (!isObject(value)) {
    return false;
  }
  var proto = Object.getPrototypeOf(value);
  if (proto == null) {
    return true;
  }
  var protoConstructor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return typeof protoConstructor === "function" && protoConstructor.toString() === plainObjectString;
}
function isGenerator(obj) {
  var constructor = obj == null ? void 0 : obj.constructor;
  if (!constructor) {
    return false;
  }
  if ("GeneratorFunction" === constructor.name || "GeneratorFunction" === constructor.displayName) {
    return true;
  }
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
  return function(x2) {
    return isObject(x2) && x2[propName] === true;
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
  if (!hasGetOwnPropertySymbols) {
    return keys;
  }
  var symbols = Object.getOwnPropertySymbols(object2);
  if (!symbols.length) {
    return keys;
  }
  return [].concat(keys, symbols.filter(function(s2) {
    return objectPrototype.propertyIsEnumerable.call(object2, s2);
  }));
}
var ownKeys = typeof Reflect !== "undefined" && Reflect.ownKeys ? Reflect.ownKeys : hasGetOwnPropertySymbols ? function(obj) {
  return Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj));
} : Object.getOwnPropertyNames;
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
  for (var i2 = 0; i2 < props.length; i2++) {
    var descriptor = props[i2];
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
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _extends() {
  _extends = Object.assign || function(target) {
    for (var i2 = 1; i2 < arguments.length; i2++) {
      var source = arguments[i2];
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
  _setPrototypeOf(subClass, superClass);
}
function _setPrototypeOf(o2, p2) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf3(o3, p3) {
    o3.__proto__ = p3;
    return o3;
  };
  return _setPrototypeOf(o2, p2);
}
function _assertThisInitialized(self2) {
  if (self2 === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self2;
}
function _unsupportedIterableToArray(o2, minLen) {
  if (!o2)
    return;
  if (typeof o2 === "string")
    return _arrayLikeToArray(o2, minLen);
  var n2 = Object.prototype.toString.call(o2).slice(8, -1);
  if (n2 === "Object" && o2.constructor)
    n2 = o2.constructor.name;
  if (n2 === "Map" || n2 === "Set")
    return Array.from(o2);
  if (n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2))
    return _arrayLikeToArray(o2, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i2 = 0, arr2 = new Array(len); i2 < len; i2++)
    arr2[i2] = arr[i2];
  return arr2;
}
function _createForOfIteratorHelperLoose(o2, allowArrayLike) {
  var it2 = typeof Symbol !== "undefined" && o2[Symbol.iterator] || o2["@@iterator"];
  if (it2)
    return (it2 = it2.call(o2)).next.bind(it2);
  if (Array.isArray(o2) || (it2 = _unsupportedIterableToArray(o2)) || allowArrayLike && o2 && typeof o2.length === "number") {
    if (it2)
      o2 = it2;
    var i2 = 0;
    return function() {
      if (i2 >= o2.length)
        return {
          done: true
        };
      return {
        done: false,
        value: o2[i2++]
      };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
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
  if (false) {
    var fieldName = prototype.constructor.name + ".prototype." + key.toString();
    die("'" + fieldName + "' is decorated with 'override', but no such decorated member was found on prototype.");
  }
  assertNotDecorated(prototype, annotation, key);
  if (!isOverride(annotation)) {
    prototype[storedAnnotationsSymbol][key] = annotation;
  }
}
function assertNotDecorated(prototype, annotation, key) {
  if (false) {
    var fieldName = prototype.constructor.name + ".prototype." + key.toString();
    var currentAnnotationType = prototype[storedAnnotationsSymbol][key].annotationType_;
    var requestedAnnotationType = annotation.annotationType_;
    die("Cannot apply '@" + requestedAnnotationType + "' to '" + fieldName + "':" + ("\nThe field is already decorated with '@" + currentAnnotationType + "'.") + "\nRe-decorating fields is not allowed.\nUse '@override' decorator for methods overridden by subclass.");
  }
}
function collectStoredAnnotations(target) {
  if (!hasProp(target, storedAnnotationsSymbol)) {
    if (false) {
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
      name_ = false ? "Atom@" + getNextId() : "Atom";
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
function identityComparer(a3, b3) {
  return a3 === b3;
}
function structuralComparer(a3, b3) {
  return deepEqual(a3, b3);
}
function shallowComparer(a3, b3) {
  return deepEqual(a3, b3, 1);
}
function defaultComparer(a3, b3) {
  if (Object.is) {
    return Object.is(a3, b3);
  }
  return a3 === b3 ? a3 !== 0 || 1 / a3 === 1 / b3 : a3 !== a3 && b3 !== b3;
}
var comparer = {
  identity: identityComparer,
  structural: structuralComparer,
  "default": defaultComparer,
  shallow: shallowComparer
};
function deepEnhancer(v2, _2, name) {
  if (isObservable(v2)) {
    return v2;
  }
  if (Array.isArray(v2)) {
    return observable.array(v2, {
      name
    });
  }
  if (isPlainObject(v2)) {
    return observable.object(v2, void 0, {
      name
    });
  }
  if (isES6Map(v2)) {
    return observable.map(v2, {
      name
    });
  }
  if (isES6Set(v2)) {
    return observable.set(v2, {
      name
    });
  }
  if (typeof v2 === "function" && !isAction(v2) && !isFlow(v2)) {
    if (isGenerator(v2)) {
      return flow(v2);
    } else {
      return autoAction(name, v2);
    }
  }
  return v2;
}
function shallowEnhancer(v2, _2, name) {
  if (v2 === void 0 || v2 === null) {
    return v2;
  }
  if (isObservableObject(v2) || isObservableArray(v2) || isObservableMap(v2) || isObservableSet(v2)) {
    return v2;
  }
  if (Array.isArray(v2)) {
    return observable.array(v2, {
      name,
      deep: false
    });
  }
  if (isPlainObject(v2)) {
    return observable.object(v2, void 0, {
      name,
      deep: false
    });
  }
  if (isES6Map(v2)) {
    return observable.map(v2, {
      name,
      deep: false
    });
  }
  if (isES6Set(v2)) {
    return observable.set(v2, {
      name,
      deep: false
    });
  }
  if (false) {
    die("The shallow modifier / decorator can only used in combination with arrays, objects, maps and sets");
  }
}
function referenceEnhancer(newValue) {
  return newValue;
}
function refStructEnhancer(v2, oldValue) {
  if (false) {
    die("observable.struct should not be used with observable values");
  }
  if (deepEqual(v2, oldValue)) {
    return oldValue;
  }
  return v2;
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
  if ((_this$options_ = this.options_) != null && _this$options_.bound) {
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
  if (false) {
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
  if ((_annotation$options_ = annotation.options_) != null && _annotation$options_.bound) {
    var _adm$proxy_;
    value = value.bind((_adm$proxy_ = adm.proxy_) != null ? _adm$proxy_ : adm.target_);
  }
  return {
    value: createAction(
      (_annotation$options_$ = (_annotation$options_2 = annotation.options_) == null ? void 0 : _annotation$options_2.name) != null ? _annotation$options_$ : key.toString(),
      value,
      (_annotation$options_$2 = (_annotation$options_3 = annotation.options_) == null ? void 0 : _annotation$options_3.autoAction) != null ? _annotation$options_$2 : false,
      (_annotation$options_4 = annotation.options_) != null && _annotation$options_4.bound ? (_adm$proxy_2 = adm.proxy_) != null ? _adm$proxy_2 : adm.target_ : void 0
    ),
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
  if ((_this$options_ = this.options_) != null && _this$options_.bound && (!hasProp(adm.target_, key) || !isFlow(adm.target_[key]))) {
    if (this.extend_(adm, key, descriptor, false) === null) {
      return 0;
    }
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
  if (false) {
    die("Cannot apply '" + annotationType_ + "' to '" + adm.name_ + "." + key.toString() + "':" + ("\n'" + annotationType_ + "' can only be used on properties with a generator function value."));
  }
}
function createFlowDescriptor(adm, annotation, key, descriptor, bound, safeDescriptors) {
  if (safeDescriptors === void 0) {
    safeDescriptors = globalState.safeDescriptors;
  }
  assertFlowDescriptor(adm, annotation, key, descriptor);
  var value = descriptor.value;
  if (!isFlow(value)) {
    value = flow(value);
  }
  if (bound) {
    var _adm$proxy_;
    value = value.bind((_adm$proxy_ = adm.proxy_) != null ? _adm$proxy_ : adm.target_);
    value.isMobXFlow = true;
  }
  return {
    value,
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
  if (false) {
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
  if (false) {
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
      var flowAnnotation2 = (_this$options_ = this.options_) != null && _this$options_.autoBind ? flow.bound : flow;
      return flowAnnotation2.make_(adm, key, descriptor, source);
    }
    var actionAnnotation2 = (_this$options_2 = this.options_) != null && _this$options_2.autoBind ? autoAction.bound : autoAction;
    return actionAnnotation2.make_(adm, key, descriptor, source);
  }
  var observableAnnotation2 = ((_this$options_3 = this.options_) == null ? void 0 : _this$options_3.deep) === false ? observable.ref : observable;
  if (typeof descriptor.value === "function" && (_this$options_4 = this.options_) != null && _this$options_4.autoBind) {
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
  if (typeof descriptor.value === "function" && (_this$options_5 = this.options_) != null && _this$options_5.autoBind) {
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
function createObservable(v2, arg2, arg3) {
  if (isStringish(arg2)) {
    storeAnnotation(v2, arg2, observableAnnotation);
    return;
  }
  if (isObservable(v2)) {
    return v2;
  }
  if (isPlainObject(v2)) {
    return observable.object(v2, arg2, arg3);
  }
  if (Array.isArray(v2)) {
    return observable.array(v2, arg2);
  }
  if (isES6Map(v2)) {
    return observable.map(v2, arg2);
  }
  if (isES6Set(v2)) {
    return observable.set(v2, arg2);
  }
  if (typeof v2 === "object" && v2 !== null) {
    return v2;
  }
  return observable.box(v2, arg2);
}
Object.assign(createObservable, observableDecoratorAnnotation);
var observableFactories = {
  box: function box(value, options) {
    var o2 = asCreateObservableOptions(options);
    return new ObservableValue(value, getEnhancerFromOptions(o2), o2.name, true, o2.equals);
  },
  array: function array(initialValues, options) {
    var o2 = asCreateObservableOptions(options);
    return (globalState.useProxies === false || o2.proxy === false ? createLegacyArray : createObservableArray)(initialValues, getEnhancerFromOptions(o2), o2.name);
  },
  map: function map(initialValues, options) {
    var o2 = asCreateObservableOptions(options);
    return new ObservableMap(initialValues, getEnhancerFromOptions(o2), o2.name);
  },
  set: function set(initialValues, options) {
    var o2 = asCreateObservableOptions(options);
    return new ObservableSet(initialValues, getEnhancerFromOptions(o2), o2.name);
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
  if (false) {
    if (!isFunction(arg1)) {
      die("First argument to `computed` should be an expression.");
    }
    if (isFunction(arg2)) {
      die("A setter as second argument is no longer supported, use `{ set: fn }` option instead");
    }
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
  if (false) {
    if (!isFunction(fn)) {
      die("`action` can only be invoked on functions");
    }
    if (typeof actionName !== "string" || !actionName) {
      die("actions should have valid names, got: '" + actionName + "'");
    }
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
  var notifySpy_ = false;
  var startTime_ = 0;
  if (false) {
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
  if (runInfo.runAsAction_) {
    untrackedEnd(runInfo.prevDerivation_);
  }
  if (false) {
    spyReportEnd({
      time: Date.now() - runInfo.startTime_
    });
  }
  globalState.suppressReactionErrors = false;
}
function allowStateChanges(allowStateChanges2, func) {
  var prev = allowStateChangesStart(allowStateChanges2);
  try {
    return func();
  } finally {
    allowStateChangesEnd(prev);
  }
}
function allowStateChangesStart(allowStateChanges2) {
  var prev = globalState.allowStateChanges;
  globalState.allowStateChanges = allowStateChanges2;
  return prev;
}
function allowStateChangesEnd(prev) {
  globalState.allowStateChanges = prev;
}
var _Symbol$toPrimitive;
_Symbol$toPrimitive = Symbol.toPrimitive;
var ObservableValue = /* @__PURE__ */ function(_Atom) {
  _inheritsLoose(ObservableValue2, _Atom);
  function ObservableValue2(value, enhancer, name_, notifySpy, equals) {
    var _this;
    if (name_ === void 0) {
      name_ = false ? "ObservableValue@" + getNextId() : "ObservableValue";
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
    if (false) {
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
    if (this.dehancer !== void 0) {
      return this.dehancer(value);
    }
    return value;
  };
  _proto.set = function set4(newValue) {
    var oldValue = this.value_;
    newValue = this.prepareNewValue_(newValue);
    if (newValue !== globalState.UNCHANGED) {
      var notifySpy = isSpyEnabled();
      if (false) {
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
      if (false) {
        spyReportEnd();
      }
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
      if (!change) {
        return globalState.UNCHANGED;
      }
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
    if (fireImmediately) {
      listener({
        observableKind: "value",
        debugObjectName: this.name_,
        object: this,
        type: UPDATE,
        newValue: this.value_,
        oldValue: void 0
      });
    }
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
    if (!options.get) {
      die(31);
    }
    this.derivation = options.get;
    this.name_ = options.name || (false ? "ComputedValue@" + getNextId() : "ComputedValue");
    if (options.set) {
      this.setter_ = createAction(false ? this.name_ + "-setter" : "ComputedValue-setter", options.set);
    }
    this.equals_ = options.equals || (options.compareStructural || options.struct ? comparer.structural : comparer["default"]);
    this.scope_ = options.context;
    this.requiresReaction_ = options.requiresReaction;
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
    if (this.isComputing_) {
      die(32, this.name_, this.derivation);
    }
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
        if (this.keepAlive_ && !prevTrackingContext) {
          globalState.trackingContext = this;
        }
        if (this.trackAndCompute()) {
          propagateChangeConfirmed(this);
        }
        globalState.trackingContext = prevTrackingContext;
      }
    }
    var result = this.value_;
    if (isCaughtException(result)) {
      throw result.cause;
    }
    return result;
  };
  _proto.set = function set4(value) {
    if (this.setter_) {
      if (this.isRunningSetter_) {
        die(33, this.name_);
      }
      this.isRunningSetter_ = true;
      try {
        this.setter_.call(this.scope_, value);
      } finally {
        this.isRunningSetter_ = false;
      }
    } else {
      die(34, this.name_);
    }
  };
  _proto.trackAndCompute = function trackAndCompute() {
    var oldValue = this.value_;
    var wasSuspended = this.dependenciesState_ === IDerivationState_.NOT_TRACKING_;
    var newValue = this.computeValue_(true);
    var changed = wasSuspended || isCaughtException(oldValue) || isCaughtException(newValue) || !this.equals_(oldValue, newValue);
    if (changed) {
      this.value_ = newValue;
      if (false) {
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
      if (false) {
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
    if (true) {
      return;
    }
    if (this.isTracing_ !== TraceMode.NONE) {
      console.log("[mobx.trace] Computed value '" + this.name_ + "' is being read outside a reactive context. Doing a full recompute.");
    }
    if (typeof this.requiresReaction_ === "boolean" ? this.requiresReaction_ : globalState.computedRequiresReaction) {
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
      var obs = derivation.observing_, l3 = obs.length;
      for (var i2 = 0; i2 < l3; i2++) {
        var obj = obs[i2];
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
  if (true) {
    return;
  }
  var hasObservers = atom.observers_.size > 0;
  if (!globalState.allowStateChanges && (hasObservers || globalState.enforceActions === "always")) {
    console.warn("[MobX] " + (globalState.enforceActions ? "Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed. Tried to modify: " : "Side effects like changing state are not allowed at this point. Are you trying to modify state from, for example, a computed value or the render function of a React component? You can wrap side effects in 'runInAction' (or decorate functions with 'action') if needed. Tried to modify: ") + atom.name_);
  }
}
function checkIfStateReadsAreAllowed(observable2) {
  if (false) {
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
  if (true) {
    return;
  }
  if (derivation.observing_.length !== 0) {
    return;
  }
  if (typeof derivation.requiresObservable_ === "boolean" ? derivation.requiresObservable_ : globalState.reactionRequiresObservable) {
    console.warn("[mobx] Derivation '" + derivation.name_ + "' is created/updated without reading any observable value.");
  }
}
function bindDependencies(derivation) {
  var prevObserving = derivation.observing_;
  var observing = derivation.observing_ = derivation.newObserving_;
  var lowestNewObservingDerivationState = IDerivationState_.UP_TO_DATE_;
  var i0 = 0, l3 = derivation.unboundDepsCount_;
  for (var i2 = 0; i2 < l3; i2++) {
    var dep = observing[i2];
    if (dep.diffValue_ === 0) {
      dep.diffValue_ = 1;
      if (i0 !== i2) {
        observing[i0] = dep;
      }
      i0++;
    }
    if (dep.dependenciesState_ > lowestNewObservingDerivationState) {
      lowestNewObservingDerivationState = dep.dependenciesState_;
    }
  }
  observing.length = i0;
  derivation.newObserving_ = null;
  l3 = prevObserving.length;
  while (l3--) {
    var _dep = prevObserving[l3];
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
  var i2 = obs.length;
  while (i2--) {
    removeObserver(obs[i2], derivation);
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
  if (derivation.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
    return;
  }
  derivation.dependenciesState_ = IDerivationState_.UP_TO_DATE_;
  var obs = derivation.observing_;
  var i2 = obs.length;
  while (i2--) {
    obs[i2].lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
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
  if (global2.__mobxInstanceCount > 0 && !global2.__mobxGlobals) {
    canMergeGlobalState = false;
  }
  if (global2.__mobxGlobals && global2.__mobxGlobals.version !== new MobXGlobals().version) {
    canMergeGlobalState = false;
  }
  if (!canMergeGlobalState) {
    setTimeout(function() {
      if (!isolateCalled) {
        die(35);
      }
    }, 1);
    return new MobXGlobals();
  } else if (global2.__mobxGlobals) {
    global2.__mobxInstanceCount += 1;
    if (!global2.__mobxGlobals.UNCHANGED) {
      global2.__mobxGlobals.UNCHANGED = {};
    }
    return global2.__mobxGlobals;
  } else {
    global2.__mobxInstanceCount = 1;
    return global2.__mobxGlobals = /* @__PURE__ */ new MobXGlobals();
  }
}();
function isolateGlobalState() {
  if (globalState.pendingReactions.length || globalState.inBatch || globalState.isRunningReactions) {
    die(36);
  }
  isolateCalled = true;
  if (canMergeGlobalState) {
    var global2 = getGlobal();
    if (--global2.__mobxInstanceCount === 0) {
      global2.__mobxGlobals = void 0;
    }
    globalState = new MobXGlobals();
  }
}
function addObserver(observable2, node) {
  observable2.observers_.add(node);
  if (observable2.lowestObserverState_ > node.dependenciesState_) {
    observable2.lowestObserverState_ = node.dependenciesState_;
  }
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
    for (var i2 = 0; i2 < list.length; i2++) {
      var observable2 = list[i2];
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
    return observable2.isBeingObserved_;
  } else if (observable2.observers_.size === 0 && globalState.inBatch > 0) {
    queueForUnobservation(observable2);
  }
  return false;
}
function propagateChanged(observable2) {
  if (observable2.lowestObserverState_ === IDerivationState_.STALE_) {
    return;
  }
  observable2.lowestObserverState_ = IDerivationState_.STALE_;
  observable2.observers_.forEach(function(d2) {
    if (d2.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
      if (false) {
        logTraceInfo(d2, observable2);
      }
      d2.onBecomeStale_();
    }
    d2.dependenciesState_ = IDerivationState_.STALE_;
  });
}
function propagateChangeConfirmed(observable2) {
  if (observable2.lowestObserverState_ === IDerivationState_.STALE_) {
    return;
  }
  observable2.lowestObserverState_ = IDerivationState_.STALE_;
  observable2.observers_.forEach(function(d2) {
    if (d2.dependenciesState_ === IDerivationState_.POSSIBLY_STALE_) {
      d2.dependenciesState_ = IDerivationState_.STALE_;
      if (false) {
        logTraceInfo(d2, observable2);
      }
    } else if (d2.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
      observable2.lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
    }
  });
}
function propagateMaybeChanged(observable2) {
  if (observable2.lowestObserverState_ !== IDerivationState_.UP_TO_DATE_) {
    return;
  }
  observable2.lowestObserverState_ = IDerivationState_.POSSIBLY_STALE_;
  observable2.observers_.forEach(function(d2) {
    if (d2.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
      d2.dependenciesState_ = IDerivationState_.POSSIBLY_STALE_;
      d2.onBecomeStale_();
    }
  });
}
var Reaction = /* @__PURE__ */ function() {
  function Reaction2(name_, onInvalidate_, errorHandler_, requiresObservable_) {
    if (name_ === void 0) {
      name_ = false ? "Reaction@" + getNextId() : "Reaction";
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
          if (false) {
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
    if (false) {
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
    if (isCaughtException(result)) {
      this.reportExceptionInDerivation_(result.cause);
    }
    if (false) {
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
    if (globalState.disableErrorBoundaries) {
      throw error;
    }
    var message = false ? "[mobx] Encountered an uncaught exception that was thrown by a reaction or observer component, in: '" + this + "'" : "[mobx] uncaught error in '" + this + "'";
    if (!globalState.suppressReactionErrors) {
      console.error(message, error);
    } else if (false) {
      console.warn("[mobx] (error in reaction '" + this.name_ + "' suppressed, fix error of causing action below)");
    }
    if (false) {
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
    var r2 = this.dispose.bind(this);
    r2[$mobx] = this;
    return r2;
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
  if (globalState.inBatch > 0 || globalState.isRunningReactions) {
    return;
  }
  reactionScheduler(runReactionsHelper);
}
function runReactionsHelper() {
  globalState.isRunningReactions = true;
  var allReactions = globalState.pendingReactions;
  var iterations = 0;
  while (allReactions.length > 0) {
    if (++iterations === MAX_REACTION_ITERATIONS) {
      console.error(false ? "Reaction doesn't converge to a stable state after " + MAX_REACTION_ITERATIONS + " iterations." + (" Probably there is a cycle in the reactive function: " + allReactions[0]) : "[mobx] cycle in reaction: " + allReactions[0]);
      allReactions.splice(0);
    }
    var remainingReactions = allReactions.splice(0);
    for (var i2 = 0, l3 = remainingReactions.length; i2 < l3; i2++) {
      remainingReactions[i2].runReaction_();
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
  return false;
}
function spy(listener) {
  if (true) {
    console.warn("[mobx.spy] Is a no-op in production builds");
    return function() {
    };
  } else {
    globalState.spyListeners.push(listener);
    return once(function() {
      globalState.spyListeners = globalState.spyListeners.filter(function(l3) {
        return l3 !== listener;
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
    if (isFunction(arg1)) {
      return createAction(arg1.name || DEFAULT_ACTION_NAME, arg1, autoAction2);
    }
    if (isFunction(arg2)) {
      return createAction(arg1, arg2, autoAction2);
    }
    if (isStringish(arg2)) {
      return storeAnnotation(arg1, arg2, autoAction2 ? autoActionAnnotation : actionAnnotation);
    }
    if (isStringish(arg1)) {
      return createDecoratorAnnotation(createActionAnnotation(autoAction2 ? AUTOACTION : ACTION, {
        name: arg1,
        autoAction: autoAction2
      }));
    }
    if (false) {
      die("Invalid arguments for `action`");
    }
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
    opts = EMPTY_OBJECT2;
  }
  if (false) {
    if (!isFunction(view)) {
      die("Autorun expects a function as first argument");
    }
    if (isAction(view)) {
      die("Autorun does not accept actions since actions are untrackable");
    }
  }
  var name = (_opts$name = (_opts = opts) == null ? void 0 : _opts.name) != null ? _opts$name : false ? view.name || "Autorun@" + getNextId() : "Autorun";
  var runSync = !opts.scheduler && !opts.delay;
  var reaction2;
  if (runSync) {
    reaction2 = new Reaction(name, function() {
      this.track(reactionRunner);
    }, opts.onError, opts.requiresObservable);
  } else {
    var scheduler = createSchedulerFromOptions(opts);
    var isScheduled = false;
    reaction2 = new Reaction(name, function() {
      if (!isScheduled) {
        isScheduled = true;
        scheduler(function() {
          isScheduled = false;
          if (!reaction2.isDisposed_) {
            reaction2.track(reactionRunner);
          }
        });
      }
    }, opts.onError, opts.requiresObservable);
  }
  function reactionRunner() {
    view(reaction2);
  }
  reaction2.schedule_();
  return reaction2.getDisposer_();
}
var run = function run2(f2) {
  return f2();
};
function createSchedulerFromOptions(opts) {
  return opts.scheduler ? opts.scheduler : opts.delay ? function(f2) {
    return setTimeout(f2, opts.delay);
  } : run;
}
function reaction(expression, effect, opts) {
  var _opts$name2;
  if (opts === void 0) {
    opts = EMPTY_OBJECT2;
  }
  if (false) {
    if (!isFunction(expression) || !isFunction(effect)) {
      die("First and second argument to reaction should be functions");
    }
    if (!isPlainObject(opts)) {
      die("Third argument of reactions should be an object");
    }
  }
  var name = (_opts$name2 = opts.name) != null ? _opts$name2 : false ? "Reaction@" + getNextId() : "Reaction";
  var effectAction = action(name, opts.onError ? wrapErrorHandler(opts.onError, effect) : effect);
  var runSync = !opts.scheduler && !opts.delay;
  var scheduler = createSchedulerFromOptions(opts);
  var firstTime = true;
  var isScheduled = false;
  var value;
  var oldValue;
  var equals = opts.compareStructural ? comparer.structural : opts.equals || comparer["default"];
  var r2 = new Reaction(name, function() {
    if (firstTime || runSync) {
      reactionRunner();
    } else if (!isScheduled) {
      isScheduled = true;
      scheduler(reactionRunner);
    }
  }, opts.onError, opts.requiresObservable);
  function reactionRunner() {
    isScheduled = false;
    if (r2.isDisposed_) {
      return;
    }
    var changed = false;
    r2.track(function() {
      var nextValue = allowStateChanges(false, function() {
        return expression(r2);
      });
      changed = firstTime || !equals(value, nextValue);
      oldValue = value;
      value = nextValue;
    });
    if (firstTime && opts.fireImmediately) {
      effectAction(value, oldValue, r2);
    } else if (!firstTime && changed) {
      effectAction(value, oldValue, r2);
    }
    firstTime = false;
  }
  r2.schedule_();
  return r2.getDisposer_();
}
function wrapErrorHandler(errorHandler, baseFn) {
  return function() {
    try {
      return baseFn.apply(this, arguments);
    } catch (e) {
      errorHandler.call(this, e);
    }
  };
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
  if (useProxies === "ifavailable") {
    globalState.verifyProxies = true;
  }
  if (enforceActions !== void 0) {
    var ea = enforceActions === ALWAYS ? ALWAYS : enforceActions === OBSERVED;
    globalState.enforceActions = ea;
    globalState.allowStateChanges = ea === true || ea === ALWAYS ? false : true;
  }
  ["computedRequiresReaction", "reactionRequiresObservable", "observableRequiresReaction", "disableErrorBoundaries", "safeDescriptors"].forEach(function(key) {
    if (key in options) {
      globalState[key] = !!options[key];
    }
  });
  globalState.allowStateReads = !globalState.observableRequiresReaction;
  if (false) {
    console.warn("WARNING: Debug feature only. MobX will NOT recover from errors when `disableErrorBoundaries` is enabled.");
  }
  if (options.reactionScheduler) {
    setReactionScheduler(options.reactionScheduler);
  }
}
function extendObservable(target, properties, annotations, options) {
  if (false) {
    if (arguments.length > 4) {
      die("'extendObservable' expected 2-4 arguments");
    }
    if (typeof target !== "object") {
      die("'extendObservable' expects an object as first argument");
    }
    if (isObservableMap(target)) {
      die("'extendObservable' should not be used on maps, use map.merge instead");
    }
    if (!isPlainObject(properties)) {
      die("'extendObservable' only accepts plain objects as second argument");
    }
    if (isObservable(properties) || isObservable(annotations)) {
      die("Extending an object with another observable (object) is not supported");
    }
  }
  var descriptors = getOwnPropertyDescriptors(properties);
  var adm = asObservableObject(target, options)[$mobx];
  startBatch();
  try {
    ownKeys(descriptors).forEach(function(key) {
      adm.extend_(
        key,
        descriptors[key],
        !annotations ? true : key in annotations ? annotations[key] : true
      );
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
  if (node.observing_ && node.observing_.length > 0) {
    result.dependencies = unique(node.observing_).map(nodeToDependencyTree);
  }
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
  if (false) {
    die("Flow expects single argument with generator function");
  }
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
        if (ret.done) {
          return resolve(ret.value);
        }
        pendingPromise = Promise.resolve(ret.value);
        return pendingPromise.then(onFulfilled, onRejected);
      }
      onFulfilled(void 0);
    });
    promise.cancel = action(name + " - runid: " + runId + " - cancel", function() {
      try {
        if (pendingPromise) {
          cancelPromise(pendingPromise);
        }
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
  if (isFunction(promise.cancel)) {
    promise.cancel();
  }
}
function isFlow(fn) {
  return (fn == null ? void 0 : fn.isMobXFlow) === true;
}
function _isObservable(value, property) {
  if (!value) {
    return false;
  }
  if (property !== void 0) {
    if (false) {
      return die("isObservable(object, propertyName) is not supported for arrays and maps. Use map.has or array.length instead.");
    }
    if (isObservableObject(value)) {
      return value[$mobx].values_.has(property);
    }
    return false;
  }
  return isObservableObject(value) || !!value[$mobx] || isAtom(value) || isReaction(value) || isComputedValue(value);
}
function isObservable(value) {
  if (false) {
    die("isObservable expects only 1 argument. Use isObservableProp to inspect the observability of a property");
  }
  return _isObservable(value);
}
function apiOwnKeys(obj) {
  if (isObservableObject(obj)) {
    return obj[$mobx].ownKeys_();
  }
  die(38);
}
function cache(map3, key, value) {
  map3.set(key, value);
  return value;
}
function toJSHelper(source, __alreadySeen) {
  if (source == null || typeof source !== "object" || source instanceof Date || !isObservable(source)) {
    return source;
  }
  if (isObservableValue(source) || isComputedValue(source)) {
    return toJSHelper(source.get(), __alreadySeen);
  }
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
  if (false) {
    die("toJS no longer supports options");
  }
  return toJSHelper(source, /* @__PURE__ */ new Map());
}
function trace() {
  if (true) {
    die("trace() is not available in production builds");
  }
  var enterBreakPoint = false;
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  if (typeof args[args.length - 1] === "boolean") {
    enterBreakPoint = args.pop();
  }
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
    if (false) {
      warnAboutProxyRequirement("detect new properties using the 'in' operator. Use 'has' from 'mobx' instead.");
    }
    return getAdm(target).has_(name);
  },
  get: function get(target, name) {
    return getAdm(target).get_(name);
  },
  set: function set2(target, name, value) {
    var _getAdm$set_;
    if (!isStringish(name)) {
      return false;
    }
    if (false) {
      warnAboutProxyRequirement("add a new observable property through direct assignment. Use 'set' from 'mobx' instead.");
    }
    return (_getAdm$set_ = getAdm(target).set_(name, value, true)) != null ? _getAdm$set_ : true;
  },
  deleteProperty: function deleteProperty(target, name) {
    var _getAdm$delete_;
    if (false) {
      warnAboutProxyRequirement("delete properties from an observable object. Use 'remove' from 'mobx' instead.");
    }
    if (!isStringish(name)) {
      return false;
    }
    return (_getAdm$delete_ = getAdm(target).delete_(name, true)) != null ? _getAdm$delete_ : true;
  },
  defineProperty: function defineProperty2(target, name, descriptor) {
    var _getAdm$definePropert;
    if (false) {
      warnAboutProxyRequirement("define property on an observable object. Use 'defineProperty' from 'mobx' instead.");
    }
    return (_getAdm$definePropert = getAdm(target).defineProperty_(name, descriptor)) != null ? _getAdm$definePropert : true;
  },
  ownKeys: function ownKeys2(target) {
    if (false) {
      warnAboutProxyRequirement("iterate keys to detect added / removed properties. Use 'keys' from 'mobx' instead.");
    }
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
    if (idx !== -1) {
      interceptors.splice(idx, 1);
    }
  });
}
function interceptChange(interceptable, change) {
  var prevU = untrackedStart();
  try {
    var interceptors = [].concat(interceptable.interceptors_ || []);
    for (var i2 = 0, l3 = interceptors.length; i2 < l3; i2++) {
      change = interceptors[i2](change);
      if (change && !change.type) {
        die(14);
      }
      if (!change) {
        break;
      }
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
    if (idx !== -1) {
      listeners.splice(idx, 1);
    }
  });
}
function notifyListeners(listenable, change) {
  var prevU = untrackedStart();
  var listeners = listenable.changeListeners_;
  if (!listeners) {
    return;
  }
  listeners = listeners.slice();
  for (var i2 = 0, l3 = listeners.length; i2 < l3; i2++) {
    listeners[i2](change);
  }
  untrackedEnd(prevU);
}
function makeObservable(target, annotations, options) {
  var adm = asObservableObject(target, options)[$mobx];
  startBatch();
  try {
    var _annotations;
    if (false) {
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
    if (name === $mobx) {
      return adm;
    }
    if (name === "length") {
      return adm.getArrayLength_();
    }
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
      name = false ? "ObservableArray@" + getNextId() : "ObservableArray";
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
      return enhancer(newV, oldV, false ? name + "[..]" : "ObservableArray[..]");
    };
  }
  var _proto = ObservableArrayAdministration2.prototype;
  _proto.dehanceValue_ = function dehanceValue_(value) {
    if (this.dehancer !== void 0) {
      return this.dehancer(value);
    }
    return value;
  };
  _proto.dehanceValues_ = function dehanceValues_(values) {
    if (this.dehancer !== void 0 && values.length > 0) {
      return values.map(this.dehancer);
    }
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
    if (typeof newLength !== "number" || isNaN(newLength) || newLength < 0) {
      die("Out of range: " + newLength);
    }
    var currentLength = this.values_.length;
    if (newLength === currentLength) {
      return;
    } else if (newLength > currentLength) {
      var newItems = new Array(newLength - currentLength);
      for (var i2 = 0; i2 < newLength - currentLength; i2++) {
        newItems[i2] = void 0;
      }
      this.spliceWithArray_(currentLength, 0, newItems);
    } else {
      this.spliceWithArray_(newLength, currentLength - newLength);
    }
  };
  _proto.updateArrayLength_ = function updateArrayLength_(oldLength, delta) {
    if (oldLength !== this.lastKnownLength_) {
      die(16);
    }
    this.lastKnownLength_ += delta;
    if (this.legacyMode_ && delta > 0) {
      reserveArrayBuffer(oldLength + delta + 1);
    }
  };
  _proto.spliceWithArray_ = function spliceWithArray_(index2, deleteCount, newItems) {
    var _this = this;
    checkIfStateModificationsAreAllowed(this.atom_);
    var length = this.values_.length;
    if (index2 === void 0) {
      index2 = 0;
    } else if (index2 > length) {
      index2 = length;
    } else if (index2 < 0) {
      index2 = Math.max(0, length + index2);
    }
    if (arguments.length === 1) {
      deleteCount = length - index2;
    } else if (deleteCount === void 0 || deleteCount === null) {
      deleteCount = 0;
    } else {
      deleteCount = Math.max(0, Math.min(deleteCount, length - index2));
    }
    if (newItems === void 0) {
      newItems = EMPTY_ARRAY;
    }
    if (hasInterceptors(this)) {
      var change = interceptChange(this, {
        object: this.proxy_,
        type: SPLICE,
        index: index2,
        removedCount: deleteCount,
        added: newItems
      });
      if (!change) {
        return EMPTY_ARRAY;
      }
      deleteCount = change.removedCount;
      newItems = change.added;
    }
    newItems = newItems.length === 0 ? newItems : newItems.map(function(v2) {
      return _this.enhancer_(v2, void 0);
    });
    if (this.legacyMode_ || false) {
      var lengthDelta = newItems.length - deleteCount;
      this.updateArrayLength_(length, lengthDelta);
    }
    var res = this.spliceItemsIntoValues_(index2, deleteCount, newItems);
    if (deleteCount !== 0 || newItems.length !== 0) {
      this.notifyArraySplice_(index2, newItems, res);
    }
    return this.dehanceValues_(res);
  };
  _proto.spliceItemsIntoValues_ = function spliceItemsIntoValues_(index2, deleteCount, newItems) {
    if (newItems.length < MAX_SPLICE_SIZE) {
      var _this$values_;
      return (_this$values_ = this.values_).splice.apply(_this$values_, [index2, deleteCount].concat(newItems));
    } else {
      var res = this.values_.slice(index2, index2 + deleteCount);
      var oldItems = this.values_.slice(index2 + deleteCount);
      this.values_.length += newItems.length - deleteCount;
      for (var i2 = 0; i2 < newItems.length; i2++) {
        this.values_[index2 + i2] = newItems[i2];
      }
      for (var _i = 0; _i < oldItems.length; _i++) {
        this.values_[index2 + newItems.length + _i] = oldItems[_i];
      }
      return res;
    }
  };
  _proto.notifyArrayChildUpdate_ = function notifyArrayChildUpdate_(index2, newValue, oldValue) {
    var notifySpy = !this.owned_ && isSpyEnabled();
    var notify = hasListeners(this);
    var change = notify || notifySpy ? {
      observableKind: "array",
      object: this.proxy_,
      type: UPDATE,
      debugObjectName: this.atom_.name_,
      index: index2,
      newValue,
      oldValue
    } : null;
    if (false) {
      spyReportStart(change);
    }
    this.atom_.reportChanged();
    if (notify) {
      notifyListeners(this, change);
    }
    if (false) {
      spyReportEnd();
    }
  };
  _proto.notifyArraySplice_ = function notifyArraySplice_(index2, added, removed) {
    var notifySpy = !this.owned_ && isSpyEnabled();
    var notify = hasListeners(this);
    var change = notify || notifySpy ? {
      observableKind: "array",
      object: this.proxy_,
      debugObjectName: this.atom_.name_,
      type: SPLICE,
      index: index2,
      removed,
      added,
      removedCount: removed.length,
      addedCount: added.length
    } : null;
    if (false) {
      spyReportStart(change);
    }
    this.atom_.reportChanged();
    if (notify) {
      notifyListeners(this, change);
    }
    if (false) {
      spyReportEnd();
    }
  };
  _proto.get_ = function get_(index2) {
    if (this.legacyMode_ && index2 >= this.values_.length) {
      console.warn(false ? "[mobx.array] Attempt to read an array index (" + index2 + ") that is out of bounds (" + this.values_.length + "). Please check length first. Out of bound indices will not be tracked by MobX" : "[mobx] Out of bounds read: " + index2);
      return void 0;
    }
    this.atom_.reportObserved();
    return this.dehanceValue_(this.values_[index2]);
  };
  _proto.set_ = function set_(index2, newValue) {
    var values = this.values_;
    if (this.legacyMode_ && index2 > values.length) {
      die(17, index2, values.length);
    }
    if (index2 < values.length) {
      checkIfStateModificationsAreAllowed(this.atom_);
      var oldValue = values[index2];
      if (hasInterceptors(this)) {
        var change = interceptChange(this, {
          type: UPDATE,
          object: this.proxy_,
          index: index2,
          newValue
        });
        if (!change) {
          return;
        }
        newValue = change.newValue;
      }
      newValue = this.enhancer_(newValue, oldValue);
      var changed = newValue !== oldValue;
      if (changed) {
        values[index2] = newValue;
        this.notifyArrayChildUpdate_(index2, newValue, oldValue);
      }
    } else {
      var newItems = new Array(index2 + 1 - values.length);
      for (var i2 = 0; i2 < newItems.length - 1; i2++) {
        newItems[i2] = void 0;
      }
      newItems[newItems.length - 1] = newValue;
      this.spliceWithArray_(values.length, 0, newItems);
    }
  };
  return ObservableArrayAdministration2;
}();
function createObservableArray(initialValues, enhancer, name, owned) {
  if (name === void 0) {
    name = false ? "ObservableArray@" + getNextId() : "ObservableArray";
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
  splice: function splice(index2, deleteCount) {
    for (var _len = arguments.length, newItems = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      newItems[_key - 2] = arguments[_key];
    }
    var adm = this[$mobx];
    switch (arguments.length) {
      case 0:
        return [];
      case 1:
        return adm.spliceWithArray_(index2);
      case 2:
        return adm.spliceWithArray_(index2, deleteCount);
    }
    return adm.spliceWithArray_(index2, deleteCount, newItems);
  },
  spliceWithArray: function spliceWithArray(index2, deleteCount, newItems) {
    return this[$mobx].spliceWithArray_(index2, deleteCount, newItems);
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
    return dehancedValues[funcName](function(element, index2) {
      return callback.call(thisArg, element, index2, _this2);
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
    arguments[0] = function(accumulator, currentValue, index2) {
      return callback(accumulator, currentValue, index2, _this3);
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
    var _this = this;
    if (enhancer_ === void 0) {
      enhancer_ = deepEnhancer;
    }
    if (name_ === void 0) {
      name_ = false ? "ObservableMap@" + getNextId() : "ObservableMap";
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
    this.keysAtom_ = createAtom(false ? this.name_ + ".keys()" : "ObservableMap.keys()");
    this.data_ = /* @__PURE__ */ new Map();
    this.hasMap_ = /* @__PURE__ */ new Map();
    allowStateChanges(true, function() {
      _this.merge(initialData);
    });
  }
  var _proto = ObservableMap2.prototype;
  _proto.has_ = function has_(key) {
    return this.data_.has(key);
  };
  _proto.has = function has2(key) {
    var _this2 = this;
    if (!globalState.trackingDerivation) {
      return this.has_(key);
    }
    var entry = this.hasMap_.get(key);
    if (!entry) {
      var newEntry = entry = new ObservableValue(this.has_(key), referenceEnhancer, false ? this.name_ + "." + stringifyKey(key) + "?" : "ObservableMap.key?", false);
      this.hasMap_.set(key, newEntry);
      onBecomeUnobserved(newEntry, function() {
        return _this2.hasMap_["delete"](key);
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
      if (!change) {
        return this;
      }
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
    var _this3 = this;
    checkIfStateModificationsAreAllowed(this.keysAtom_);
    if (hasInterceptors(this)) {
      var change = interceptChange(this, {
        type: DELETE,
        object: this,
        name: key
      });
      if (!change) {
        return false;
      }
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
      if (false) {
        spyReportStart(_change);
      }
      transaction(function() {
        var _this3$hasMap_$get;
        _this3.keysAtom_.reportChanged();
        (_this3$hasMap_$get = _this3.hasMap_.get(key)) == null ? void 0 : _this3$hasMap_$get.setNewValue_(false);
        var observable2 = _this3.data_.get(key);
        observable2.setNewValue_(void 0);
        _this3.data_["delete"](key);
      });
      if (notify) {
        notifyListeners(this, _change);
      }
      if (false) {
        spyReportEnd();
      }
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
      if (false) {
        spyReportStart(change);
      }
      observable2.setNewValue_(newValue);
      if (notify) {
        notifyListeners(this, change);
      }
      if (false) {
        spyReportEnd();
      }
    }
  };
  _proto.addValue_ = function addValue_(key, newValue) {
    var _this4 = this;
    checkIfStateModificationsAreAllowed(this.keysAtom_);
    transaction(function() {
      var _this4$hasMap_$get;
      var observable2 = new ObservableValue(newValue, _this4.enhancer_, false ? _this4.name_ + "." + stringifyKey(key) : "ObservableMap.key", false);
      _this4.data_.set(key, observable2);
      newValue = observable2.value_;
      (_this4$hasMap_$get = _this4.hasMap_.get(key)) == null ? void 0 : _this4$hasMap_$get.setNewValue_(true);
      _this4.keysAtom_.reportChanged();
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
    if (false) {
      spyReportStart(change);
    }
    if (notify) {
      notifyListeners(this, change);
    }
    if (false) {
      spyReportEnd();
    }
  };
  _proto.get = function get3(key) {
    if (this.has(key)) {
      return this.dehanceValue_(this.data_.get(key).get());
    }
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
  _proto.merge = function merge2(other) {
    var _this5 = this;
    if (isObservableMap(other)) {
      other = new Map(other);
    }
    transaction(function() {
      if (isPlainObject(other)) {
        getPlainObjectKeys(other).forEach(function(key) {
          return _this5.set(key, other[key]);
        });
      } else if (Array.isArray(other)) {
        other.forEach(function(_ref) {
          var key = _ref[0], value = _ref[1];
          return _this5.set(key, value);
        });
      } else if (isES6Map(other)) {
        if (other.constructor !== Map) {
          die(19, other);
        }
        other.forEach(function(value, key) {
          return _this5.set(key, value);
        });
      } else if (other !== null && other !== void 0) {
        die(20, other);
      }
    });
    return this;
  };
  _proto.clear = function clear2() {
    var _this6 = this;
    transaction(function() {
      untracked(function() {
        for (var _iterator2 = _createForOfIteratorHelperLoose(_this6.keys()), _step2; !(_step2 = _iterator2()).done; ) {
          var key = _step2.value;
          _this6["delete"](key);
        }
      });
    });
  };
  _proto.replace = function replace2(values) {
    var _this7 = this;
    transaction(function() {
      var replacementMap = convertToMap(values);
      var orderedData = /* @__PURE__ */ new Map();
      var keysReportChangedCalled = false;
      for (var _iterator3 = _createForOfIteratorHelperLoose(_this7.data_.keys()), _step3; !(_step3 = _iterator3()).done; ) {
        var key = _step3.value;
        if (!replacementMap.has(key)) {
          var deleted = _this7["delete"](key);
          if (deleted) {
            keysReportChangedCalled = true;
          } else {
            var value = _this7.data_.get(key);
            orderedData.set(key, value);
          }
        }
      }
      for (var _iterator4 = _createForOfIteratorHelperLoose(replacementMap.entries()), _step4; !(_step4 = _iterator4()).done; ) {
        var _step4$value = _step4.value, _key = _step4$value[0], _value = _step4$value[1];
        var keyExisted = _this7.data_.has(_key);
        _this7.set(_key, _value);
        if (_this7.data_.has(_key)) {
          var _value2 = _this7.data_.get(_key);
          orderedData.set(_key, _value2);
          if (!keyExisted) {
            keysReportChangedCalled = true;
          }
        }
      }
      if (!keysReportChangedCalled) {
        if (_this7.data_.size !== orderedData.size) {
          _this7.keysAtom_.reportChanged();
        } else {
          var iter1 = _this7.data_.keys();
          var iter2 = orderedData.keys();
          var next1 = iter1.next();
          var next2 = iter2.next();
          while (!next1.done) {
            if (next1.value !== next2.value) {
              _this7.keysAtom_.reportChanged();
              break;
            }
            next1 = iter1.next();
            next2 = iter2.next();
          }
        }
      }
      _this7.data_ = orderedData;
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
    if (false) {
      die("`observe` doesn't support fireImmediately=true in combination with maps.");
    }
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
    var map3 = /* @__PURE__ */ new Map();
    for (var key in dataStructure) {
      map3.set(key, dataStructure[key]);
    }
    return map3;
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
      name_ = false ? "ObservableSet@" + getNextId() : "ObservableSet";
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
      if (!change) {
        return this;
      }
    }
    if (!this.has(value)) {
      transaction(function() {
        _this2.data_.add(_this2.enhancer_(value, void 0));
        _this2.atom_.reportChanged();
      });
      var notifySpy = false;
      var notify = hasListeners(this);
      var _change = notify || notifySpy ? {
        observableKind: "set",
        debugObjectName: this.name_,
        type: ADD,
        object: this,
        newValue: value
      } : null;
      if (notifySpy && false) {
        spyReportStart(_change);
      }
      if (notify) {
        notifyListeners(this, _change);
      }
      if (notifySpy && false) {
        spyReportEnd();
      }
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
      if (!change) {
        return false;
      }
    }
    if (this.has(value)) {
      var notifySpy = false;
      var notify = hasListeners(this);
      var _change2 = notify || notifySpy ? {
        observableKind: "set",
        debugObjectName: this.name_,
        type: DELETE,
        object: this,
        oldValue: value
      } : null;
      if (notifySpy && false) {
        spyReportStart(_change2);
      }
      transaction(function() {
        _this3.atom_.reportChanged();
        _this3.data_["delete"](value);
      });
      if (notify) {
        notifyListeners(this, _change2);
      }
      if (notifySpy && false) {
        spyReportEnd();
      }
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
        var index2 = nextIndex;
        nextIndex += 1;
        return index2 < values.length ? {
          value: [keys[index2], values[index2]],
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
    if (false) {
      die("`observe` doesn't support fireImmediately=true in combination with sets.");
    }
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
    this.keysAtom_ = new Atom(false ? this.name_ + ".keys" : "ObservableObject.keys");
    this.isPlainObject_ = isPlainObject(this.target_);
    if (false) {
      die("defaultAnnotation must be valid annotation");
    }
    if (false) {
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
      if (!change) {
        return null;
      }
      newValue = change.newValue;
    }
    newValue = observable2.prepareNewValue_(newValue);
    if (newValue !== globalState.UNCHANGED) {
      var notify = hasListeners(this);
      var notifySpy = false;
      var _change = notify || notifySpy ? {
        type: UPDATE,
        observableKind: "object",
        debugObjectName: this.name_,
        object: this.proxy_ || this.target_,
        oldValue: observable2.value_,
        name: key,
        newValue
      } : null;
      if (false) {
        spyReportStart(_change);
      }
      observable2.setNewValue_(newValue);
      if (notify) {
        notifyListeners(this, _change);
      }
      if (false) {
        spyReportEnd();
      }
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
      entry = new ObservableValue(key in this.target_, referenceEnhancer, false ? this.name_ + "." + stringifyKey(key) + "?" : "ObservableObject.key?", false);
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
      if ((_this$target_$storedA = this.target_[storedAnnotationsSymbol]) != null && _this$target_$storedA[key]) {
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
        if (outcome === 0) {
          return;
        }
        if (outcome === 1) {
          break;
        }
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
        if (!change) {
          return null;
        }
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
        if (!change) {
          return null;
        }
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
      var observable2 = new ObservableValue(value, enhancer, false ? this.name_ + "." + key.toString() : "ObservableObject.key", false);
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
        if (!change) {
          return null;
        }
      }
      options.name || (options.name = false ? this.name_ + "." + key.toString() : "ObservableObject.key");
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
      if (!change) {
        return null;
      }
    }
    try {
      var _this$pendingKeys_, _this$pendingKeys_$ge;
      startBatch();
      var notify = hasListeners(this);
      var notifySpy = false;
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
      if (false) {
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
        if (false) {
          spyReportStart(_change2);
        }
        if (notify) {
          notifyListeners(this, _change2);
        }
        if (false) {
          spyReportEnd();
        }
      }
    } finally {
      endBatch();
    }
    return true;
  };
  _proto.observe_ = function observe_(callback, fireImmediately) {
    if (false) {
      die("`observe` doesn't support the fire immediately property for observable objects.");
    }
    return registerListener(this, callback);
  };
  _proto.intercept_ = function intercept_(handler) {
    return registerInterceptor(this, handler);
  };
  _proto.notifyPropertyAddition_ = function notifyPropertyAddition_(key, value) {
    var _this$pendingKeys_2, _this$pendingKeys_2$g;
    var notify = hasListeners(this);
    var notifySpy = false;
    if (notify || notifySpy) {
      var change = notify || notifySpy ? {
        type: ADD,
        observableKind: "object",
        debugObjectName: this.name_,
        object: this.proxy_ || this.target_,
        name: key,
        newValue: value
      } : null;
      if (false) {
        spyReportStart(change);
      }
      if (notify) {
        notifyListeners(this, change);
      }
      if (false) {
        spyReportEnd();
      }
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
  if (false) {
    die("Options can't be provided for already observable objects.");
  }
  if (hasProp(target, $mobx)) {
    if (false) {
      die("Cannot convert '" + getDebugName(target) + "' into observable object:\nThe target is already observable of different type.\nExtending builtins is not supported.");
    }
    return target;
  }
  if (false) {
    die("Cannot make the designated object observable; it is not extensible");
  }
  var name = (_options$name = options == null ? void 0 : options.name) != null ? _options$name : false ? (isPlainObject(target) ? "ObservableObject" : target.constructor.name) + "@" + getNextId() : "ObservableObject";
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
  if (false) {
    adm.appliedAnnotations_[key] = annotation;
  }
  (_adm$target_$storedAn = adm.target_[storedAnnotationsSymbol]) == null ? true : delete _adm$target_$storedAn[key];
}
function assertAnnotable(adm, annotation, key) {
  if (false) {
    die("Cannot annotate '" + adm.name_ + "." + key.toString() + "': Invalid annotation.");
  }
  if (false) {
    var fieldName = adm.name_ + "." + key.toString();
    var currentAnnotationType = adm.appliedAnnotations_[key].annotationType_;
    var requestedAnnotationType = annotation.annotationType_;
    die("Cannot apply '" + requestedAnnotationType + "' to '" + fieldName + "':" + ("\nThe field is already annotated with '" + currentAnnotationType + "'.") + "\nRe-annotating fields is not allowed.\nUse 'override' annotation for methods overridden by subclass.");
  }
}
var ENTRY_0 = /* @__PURE__ */ createArrayEntryDescriptor(0);
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
var LegacyObservableArray = /* @__PURE__ */ function(_StubArray, _Symbol$toStringTag2, _Symbol$iterator2) {
  _inheritsLoose(LegacyObservableArray2, _StubArray);
  function LegacyObservableArray2(initialValues, enhancer, name, owned) {
    var _this;
    if (name === void 0) {
      name = false ? "ObservableArray@" + getNextId() : "ObservableArray";
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
    {
      Object.defineProperty(_assertThisInitialized(_this), "0", ENTRY_0);
    }
    return _this;
  }
  var _proto = LegacyObservableArray2.prototype;
  _proto.concat = function concat() {
    this[$mobx].atom_.reportObserved();
    for (var _len = arguments.length, arrays = new Array(_len), _key = 0; _key < _len; _key++) {
      arrays[_key] = arguments[_key];
    }
    return Array.prototype.concat.apply(
      this.slice(),
      arrays.map(function(a3) {
        return isObservableArray(a3) ? a3.slice() : a3;
      })
    );
  };
  _proto[_Symbol$iterator2] = function() {
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
    key: _Symbol$toStringTag2,
    get: function get3() {
      return "Array";
    }
  }]);
  return LegacyObservableArray2;
}(StubArray, Symbol.toStringTag, Symbol.iterator);
Object.entries(arrayExtensions).forEach(function(_ref) {
  var prop = _ref[0], fn = _ref[1];
  if (prop !== "concat") {
    addHiddenProp(LegacyObservableArray.prototype, prop, fn);
  }
});
function createArrayEntryDescriptor(index2) {
  return {
    enumerable: false,
    configurable: true,
    get: function get3() {
      return this[$mobx].get_(index2);
    },
    set: function set4(value) {
      this[$mobx].set_(index2, value);
    }
  };
}
function createArrayBufferItem(index2) {
  defineProperty(LegacyObservableArray.prototype, "" + index2, createArrayEntryDescriptor(index2));
}
function reserveArrayBuffer(max) {
  if (max > OBSERVABLE_ARRAY_BUFFER_SIZE) {
    for (var index2 = OBSERVABLE_ARRAY_BUFFER_SIZE; index2 < max + 100; index2++) {
      createArrayBufferItem(index2);
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
      if (property !== void 0) {
        die(23);
      }
      return thing[$mobx].atom_;
    }
    if (isObservableSet(thing)) {
      return thing[$mobx];
    }
    if (isObservableMap(thing)) {
      if (property === void 0) {
        return thing.keysAtom_;
      }
      var observable2 = thing.data_.get(property) || thing.hasMap_.get(property);
      if (!observable2) {
        die(25, property, getDebugName(thing));
      }
      return observable2;
    }
    if (isObservableObject(thing)) {
      if (!property) {
        return die(26);
      }
      var _observable = thing[$mobx].values_.get(property);
      if (!_observable) {
        die(27, property, getDebugName(thing));
      }
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
  if (!thing) {
    die(29);
  }
  if (property !== void 0) {
    return getAdministration(getAtom(thing, property));
  }
  if (isAtom(thing) || isComputedValue(thing) || isReaction(thing)) {
    return thing;
  }
  if (isObservableMap(thing) || isObservableSet(thing)) {
    return thing;
  }
  if (thing[$mobx]) {
    return thing[$mobx];
  }
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
function deepEqual(a3, b3, depth) {
  if (depth === void 0) {
    depth = -1;
  }
  return eq(a3, b3, depth);
}
function eq(a3, b3, depth, aStack, bStack) {
  if (a3 === b3) {
    return a3 !== 0 || 1 / a3 === 1 / b3;
  }
  if (a3 == null || b3 == null) {
    return false;
  }
  if (a3 !== a3) {
    return b3 !== b3;
  }
  var type = typeof a3;
  if (type !== "function" && type !== "object" && typeof b3 != "object") {
    return false;
  }
  var className = toString.call(a3);
  if (className !== toString.call(b3)) {
    return false;
  }
  switch (className) {
    case "[object RegExp]":
    case "[object String]":
      return "" + a3 === "" + b3;
    case "[object Number]":
      if (+a3 !== +a3) {
        return +b3 !== +b3;
      }
      return +a3 === 0 ? 1 / +a3 === 1 / b3 : +a3 === +b3;
    case "[object Date]":
    case "[object Boolean]":
      return +a3 === +b3;
    case "[object Symbol]":
      return typeof Symbol !== "undefined" && Symbol.valueOf.call(a3) === Symbol.valueOf.call(b3);
    case "[object Map]":
    case "[object Set]":
      if (depth >= 0) {
        depth++;
      }
      break;
  }
  a3 = unwrap(a3);
  b3 = unwrap(b3);
  var areArrays = className === "[object Array]";
  if (!areArrays) {
    if (typeof a3 != "object" || typeof b3 != "object") {
      return false;
    }
    var aCtor = a3.constructor, bCtor = b3.constructor;
    if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor && isFunction(bCtor) && bCtor instanceof bCtor) && "constructor" in a3 && "constructor" in b3) {
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
    if (aStack[length] === a3) {
      return bStack[length] === b3;
    }
  }
  aStack.push(a3);
  bStack.push(b3);
  if (areArrays) {
    length = a3.length;
    if (length !== b3.length) {
      return false;
    }
    while (length--) {
      if (!eq(a3[length], b3[length], depth - 1, aStack, bStack)) {
        return false;
      }
    }
  } else {
    var keys = Object.keys(a3);
    var key;
    length = keys.length;
    if (Object.keys(b3).length !== length) {
      return false;
    }
    while (length--) {
      key = keys[length];
      if (!(hasProp(b3, key) && eq(a3[key], b3[key], depth - 1, aStack, bStack))) {
        return false;
      }
    }
  }
  aStack.pop();
  bStack.pop();
  return true;
}
function unwrap(a3) {
  if (isObservableArray(a3)) {
    return a3.slice();
  }
  if (isES6Map(a3) || isObservableMap(a3)) {
    return Array.from(a3.entries());
  }
  if (isES6Set(a3) || isObservableSet(a3)) {
    return Array.from(a3.entries());
  }
  return a3;
}
function makeIterable(iterator) {
  iterator[Symbol.iterator] = getSelf;
  return iterator;
}
function getSelf() {
  return this;
}
["Symbol", "Map", "Set"].forEach(function(m2) {
  var g2 = getGlobal();
  if (typeof g2[m2] === "undefined") {
    die("MobX requires global '" + m2 + "' to be available or polyfilled");
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

// ../../packages/core/src/lib/shapes/TLShape/TLShape.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var TLShape = class {
  constructor(props) {
    __publicField(this, "props");
    __publicField(this, "aspectRatio");
    __publicField(this, "type");
    __publicField(this, "hideCloneHandles", false);
    __publicField(this, "hideResizeHandles", false);
    __publicField(this, "hideRotateHandle", false);
    __publicField(this, "hideContextBar", false);
    __publicField(this, "hideSelectionDetail", false);
    __publicField(this, "hideSelection", false);
    __publicField(this, "canChangeAspectRatio", true);
    __publicField(this, "canUnmount", true);
    __publicField(this, "canResize", [true, true]);
    __publicField(this, "canScale", true);
    __publicField(this, "canFlip", true);
    __publicField(this, "canEdit", false);
    __publicField(this, "canBind", false);
    __publicField(this, "nonce");
    __publicField(this, "bindingDistance", BINDING_DISTANCE);
    __publicField(this, "isDirty", false);
    __publicField(this, "lastSerialized");
    __publicField(this, "getCenter", () => {
      return BoundsUtils.getBoundsCenter(this.bounds);
    });
    __publicField(this, "getRotatedBounds", () => {
      const {
        bounds,
        props: { rotation }
      } = this;
      if (!rotation)
        return bounds;
      return BoundsUtils.getBoundsFromPoints(BoundsUtils.getRotatedCorners(bounds, rotation));
    });
    __publicField(this, "hitTestPoint", (point) => {
      const ownBounds = this.rotatedBounds;
      if (!this.props.rotation) {
        return PointUtils.pointInBounds(point, ownBounds);
      }
      const corners = BoundsUtils.getRotatedCorners(ownBounds, this.props.rotation);
      return PointUtils.pointInPolygon(point, corners);
    });
    __publicField(this, "hitTestLineSegment", (A3, B3) => {
      const box2 = BoundsUtils.getBoundsFromPoints([A3, B3]);
      const {
        rotatedBounds,
        props: { rotation = 0 }
      } = this;
      return BoundsUtils.boundsContain(rotatedBounds, box2) || rotation ? intersectLineSegmentPolyline(A3, B3, BoundsUtils.getRotatedCorners(this.bounds)).didIntersect : intersectLineSegmentBounds(A3, B3, rotatedBounds).length > 0;
    });
    __publicField(this, "hitTestBounds", (bounds) => {
      const {
        rotatedBounds,
        props: { rotation = 0 }
      } = this;
      const corners = BoundsUtils.getRotatedCorners(this.bounds, rotation);
      return BoundsUtils.boundsContain(bounds, rotatedBounds) || intersectPolygonBounds(corners, bounds).length > 0;
    });
    __publicField(this, "getExpandedBounds", () => {
      return BoundsUtils.expandBounds(this.getBounds(), this.bindingDistance);
    });
    __publicField(this, "getBindingPoint", (point, origin, direction, bindAnywhere) => {
      const bounds = this.getBounds();
      const expandedBounds = this.getExpandedBounds();
      if (!PointUtils.pointInBounds(point, expandedBounds))
        return;
      const intersections = intersectRayBounds(origin, direction, expandedBounds).filter((int) => int.didIntersect).map((int) => int.points[0]);
      if (!intersections.length)
        return;
      const center = this.getCenter();
      const intersection = intersections.sort((a3, b3) => src_default.dist(b3, origin) - src_default.dist(a3, origin))[0];
      const middlePoint = src_default.med(point, intersection);
      let anchor;
      let distance;
      if (bindAnywhere) {
        anchor = src_default.dist(point, center) < BINDING_DISTANCE / 2 ? center : point;
        distance = 0;
      } else {
        if (src_default.distanceToLineSegment(point, middlePoint, center) < BINDING_DISTANCE / 2) {
          anchor = center;
        } else {
          anchor = middlePoint;
        }
        if (PointUtils.pointInBounds(point, bounds)) {
          distance = this.bindingDistance;
        } else {
          distance = Math.max(
            this.bindingDistance,
            BoundsUtils.getBoundsSides(bounds).map((side) => src_default.distanceToLineSegment(side[1][0], side[1][1], point)).sort((a3, b3) => a3 - b3)[0]
          );
        }
      }
      const bindingPoint = src_default.divV(src_default.sub(anchor, [expandedBounds.minX, expandedBounds.minY]), [
        expandedBounds.width,
        expandedBounds.height
      ]);
      return {
        point: src_default.clampV(bindingPoint, 0, 1),
        distance
      };
    });
    __publicField(this, "getSerialized", () => {
      return toJS(__spreadProps(__spreadValues({}, this.props), { type: this.type, nonce: this.nonce }));
    });
    __publicField(this, "getCachedSerialized", () => {
      if (this.isDirty || !this.lastSerialized) {
        transaction(() => {
          this.setIsDirty(false);
          this.setLastSerialized(this.getSerialized());
        });
      }
      if (this.lastSerialized) {
        return this.lastSerialized;
      }
      throw new Error("Should not get here for getCachedSerialized");
    });
    __publicField(this, "validateProps", (props) => {
      return props;
    });
    __publicField(this, "update", (props, isDeserializing = false, skipNounce = false) => {
      if (!(isDeserializing || this.isDirty))
        this.setIsDirty(true);
      if (!isDeserializing && !skipNounce)
        this.incNonce();
      Object.assign(this.props, this.validateProps(props));
      return this;
    });
    __publicField(this, "clone", () => {
      return new this.constructor(this.serialized);
    });
    __publicField(this, "onResetBounds", (info) => {
      return this;
    });
    __publicField(this, "scale", [1, 1]);
    __publicField(this, "onResizeStart", (info) => {
      var _a3;
      this.scale = [...(_a3 = this.props.scale) != null ? _a3 : [1, 1]];
      return this;
    });
    __publicField(this, "onResize", (initialProps, info) => {
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
    __publicField(this, "onHandleChange", (initialShape, { id: id3, delta }) => {
      if (initialShape.handles === void 0)
        return;
      const nextHandles = deepCopy(initialShape.handles);
      nextHandles[id3] = __spreadProps(__spreadValues({}, nextHandles[id3]), {
        point: src_default.add(delta, initialShape.handles[id3].point)
      });
      const topLeft = BoundsUtils.getCommonTopLeft(Object.values(nextHandles).map((h2) => h2.point));
      Object.values(nextHandles).forEach((h2) => {
        h2.point = src_default.sub(h2.point, topLeft);
      });
      this.update({
        point: src_default.add(initialShape.point, topLeft),
        handles: nextHandles
      });
    });
    var _a3, _b;
    const type = this.constructor["id"];
    const defaultProps = (_a3 = this.constructor["defaultProps"]) != null ? _a3 : {};
    this.type = type;
    this.props = __spreadValues(__spreadValues({ scale: [1, 1] }, defaultProps), props);
    this.nonce = (_b = props.nonce) != null ? _b : Date.now();
    makeObservable(this);
  }
  get id() {
    return this.props.id;
  }
  setNonce(nonce) {
    this.nonce = nonce;
  }
  incNonce() {
    this.nonce++;
  }
  setIsDirty(isDirty) {
    this.isDirty = isDirty;
  }
  setLastSerialized(serialized) {
    this.lastSerialized = serialized;
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
  getShapeSVGJsx(_2) {
    const bounds = this.getBounds();
    const { stroke, strokeWidth, strokeType, opacity, fill, noFill, borderRadius } = this.props;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
      fill: noFill ? "none" : getComputedColor(fill, "background"),
      stroke: getComputedColor(stroke, "stroke"),
      strokeWidth: strokeWidth != null ? strokeWidth : 2,
      strokeDasharray: strokeType === "dashed" ? "8 2" : void 0,
      fillOpacity: opacity != null ? opacity : 0.2,
      width: bounds.width,
      height: bounds.height,
      rx: borderRadius,
      ry: borderRadius
    });
  }
};
__publicField(TLShape, "type");
__decorateClass([
  observable
], TLShape.prototype, "props", 2);
__decorateClass([
  observable
], TLShape.prototype, "canResize", 2);
__decorateClass([
  observable
], TLShape.prototype, "nonce", 2);
__decorateClass([
  observable
], TLShape.prototype, "isDirty", 2);
__decorateClass([
  observable
], TLShape.prototype, "lastSerialized", 2);
__decorateClass([
  computed
], TLShape.prototype, "id", 1);
__decorateClass([
  action
], TLShape.prototype, "setNonce", 1);
__decorateClass([
  action
], TLShape.prototype, "incNonce", 1);
__decorateClass([
  action
], TLShape.prototype, "setIsDirty", 1);
__decorateClass([
  action
], TLShape.prototype, "setLastSerialized", 1);
__decorateClass([
  computed
], TLShape.prototype, "center", 1);
__decorateClass([
  computed
], TLShape.prototype, "bounds", 1);
__decorateClass([
  computed
], TLShape.prototype, "rotatedBounds", 1);
__decorateClass([
  computed
], TLShape.prototype, "serialized", 1);
__decorateClass([
  action
], TLShape.prototype, "update", 2);

// ../../packages/core/src/lib/shapes/TLBoxShape/TLBoxShape.tsx
var TLBoxShape = class extends TLShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "canBind", true);
    __publicField(this, "getBounds", () => {
      const [x2, y2] = this.props.point;
      const [width, height] = this.props.size;
      return {
        minX: x2,
        minY: y2,
        maxX: x2 + width,
        maxY: y2 + height,
        width,
        height
      };
    });
    __publicField(this, "getRotatedBounds", () => {
      return BoundsUtils.getBoundsFromPoints(
        BoundsUtils.getRotatedCorners(this.bounds, this.props.rotation)
      );
    });
    __publicField(this, "onResize", (initialProps, info) => {
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
        rotation,
        point: [bounds.minX, bounds.minY],
        size: [Math.max(1, bounds.width), Math.max(1, bounds.height)],
        scale: nextScale
      });
    });
    __publicField(this, "validateProps", (props) => {
      if (props.size !== void 0) {
        props.size[0] = Math.max(props.size[0], 1);
        props.size[1] = Math.max(props.size[1], 1);
      }
      return props;
    });
    makeObservable(this);
  }
};
__publicField(TLBoxShape, "id", "box");
__publicField(TLBoxShape, "defaultProps", {
  id: "box",
  type: "box",
  parentId: "page",
  point: [0, 0],
  size: [100, 100]
});

// ../../packages/core/src/lib/shapes/TLDrawShape/TLDrawShape.tsx
var TLDrawShape = class extends TLShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "getBounds", () => {
      const {
        pointBounds,
        props: { point }
      } = this;
      return BoundsUtils.translateBounds(pointBounds, point);
    });
    __publicField(this, "getRotatedBounds", () => {
      const {
        props: { rotation, point },
        bounds,
        rotatedPoints
      } = this;
      if (!rotation)
        return bounds;
      return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedPoints), point);
    });
    __publicField(this, "normalizedPoints", []);
    __publicField(this, "isResizeFlippedX", false);
    __publicField(this, "isResizeFlippedY", false);
    __publicField(this, "onResizeStart", () => {
      var _a3;
      const {
        bounds,
        props: { points }
      } = this;
      this.scale = [...(_a3 = this.props.scale) != null ? _a3 : [1, 1]];
      const size = [bounds.width, bounds.height];
      this.normalizedPoints = points.map((point) => Vec.divV(point, size));
      return this;
    });
    __publicField(this, "onResize", (initialProps, info) => {
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
      return this.update(
        scaleX || scaleY ? {
          point: [bounds.minX, bounds.minY],
          points: this.normalizedPoints.map((point) => Vec.mulV(point, size).concat(point[2])),
          scale: nextScale
        } : {
          point: [bounds.minX, bounds.minY],
          points: this.normalizedPoints.map((point) => Vec.mulV(point, size).concat(point[2]))
        }
      );
    });
    __publicField(this, "hitTestPoint", (point) => {
      const {
        props: { points, point: ownPoint }
      } = this;
      return PointUtils.pointNearToPolyline(Vec.sub(point, ownPoint), points);
    });
    __publicField(this, "hitTestLineSegment", (A3, B3) => {
      const {
        bounds,
        props: { points, point }
      } = this;
      if (PointUtils.pointInBounds(A3, bounds) || PointUtils.pointInBounds(B3, bounds) || intersectBoundsLineSegment(bounds, A3, B3).length > 0) {
        const rA = Vec.sub(A3, point);
        const rB = Vec.sub(B3, point);
        return intersectLineSegmentPolyline(rA, rB, points).didIntersect || !!points.find((point2) => Vec.dist(rA, point2) < 5 || Vec.dist(rB, point2) < 5);
      }
      return false;
    });
    __publicField(this, "hitTestBounds", (bounds) => {
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
__publicField(TLDrawShape, "id", "draw");
__publicField(TLDrawShape, "defaultProps", {
  id: "draw",
  type: "draw",
  parentId: "page",
  point: [0, 0],
  points: [],
  isComplete: false
});
__decorateClass([
  computed
], TLDrawShape.prototype, "pointBounds", 1);
__decorateClass([
  computed
], TLDrawShape.prototype, "rotatedPoints", 1);

// ../../packages/core/src/lib/shapes/TLEllipseShape/TLEllipseShape.ts
var TLEllipseShape = class extends TLBoxShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "getBounds", () => {
      const {
        props: {
          point: [x2, y2],
          size: [w2, h2]
        }
      } = this;
      return BoundsUtils.getRotatedEllipseBounds(x2, y2, w2 / 2, h2 / 2, 0);
    });
    __publicField(this, "getRotatedBounds", () => {
      const {
        props: {
          point: [x2, y2],
          size: [w2, h2],
          rotation
        }
      } = this;
      return BoundsUtils.getRotatedEllipseBounds(x2, y2, w2 / 2, h2 / 2, rotation);
    });
    __publicField(this, "hitTestPoint", (point) => {
      const {
        props: { size, rotation },
        center
      } = this;
      return PointUtils.pointInEllipse(point, center, size[0], size[1], rotation || 0);
    });
    __publicField(this, "hitTestLineSegment", (A3, B3) => {
      const {
        props: {
          size: [w2, h2],
          rotation = 0
        },
        center
      } = this;
      return intersectLineSegmentEllipse(A3, B3, center, w2, h2, rotation).didIntersect;
    });
    __publicField(this, "hitTestBounds", (bounds) => {
      const {
        props: {
          size: [w2, h2],
          rotation = 0
        },
        rotatedBounds
      } = this;
      return BoundsUtils.boundsContain(bounds, rotatedBounds) || intersectEllipseBounds(this.center, w2 / 2, h2 / 2, rotation, bounds).length > 0;
    });
    makeObservable(this);
  }
};
__publicField(TLEllipseShape, "id", "ellipse");
__publicField(TLEllipseShape, "defaultProps", {
  id: "ellipse",
  type: "ellipse",
  parentId: "page",
  point: [0, 0],
  size: [100, 100]
});

// ../../packages/core/src/lib/shapes/TLImageShape/TLImageShape.ts
var TLImageShape = class extends TLBoxShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "onResetBounds", (info) => {
      const { clipping, size, point } = this.props;
      if (clipping) {
        const [t, r2, b3, l3] = Array.isArray(clipping) ? clipping : [clipping, clipping, clipping, clipping];
        return this.update({
          clipping: 0,
          point: [point[0] - l3, point[1] - t],
          size: [size[0] + (l3 - r2), size[1] + (t - b3)]
        });
      } else if (info.asset) {
        const {
          size: [w2, h2]
        } = info.asset;
        this.update({
          clipping: 0,
          point: [point[0] + size[0] / 2 - w2 / 2, point[1] + size[1] / 2 - h2 / 2],
          size: [w2, h2]
        });
      }
      return this;
    });
    __publicField(this, "onResize", (initialProps, info) => {
      const { bounds, clip, scale } = info;
      let { clipping } = this.props;
      const { clipping: iClipping } = initialProps;
      if (clip) {
        const {
          point: [x2, y2],
          size: [w2, h2]
        } = initialProps;
        const [t, r2, b3, l3] = iClipping ? Array.isArray(iClipping) ? iClipping : [iClipping, iClipping, iClipping, iClipping] : [0, 0, 0, 0];
        clipping = [
          t + (bounds.minY - y2),
          r2 + (bounds.maxX - (x2 + w2)),
          b3 + (bounds.maxY - (y2 + h2)),
          l3 + (bounds.minX - x2)
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
        const c2 = clipping;
        if (c2.every((v2, i2) => i2 === 0 || v2 === c2[i2 - 1])) {
          clipping = c2[0];
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
__publicField(TLImageShape, "id", "ellipse");
__publicField(TLImageShape, "defaultProps", {
  id: "ellipse",
  type: "ellipse",
  parentId: "page",
  point: [0, 0],
  size: [100, 100],
  clipping: 0,
  objectFit: "none",
  assetId: ""
});

// ../../packages/core/src/lib/shapes/TLPolylineShape/TLPolylineShape.tsx
var _TLPolylineShape = class extends TLShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "getBounds", () => {
      const {
        points,
        props: { point }
      } = this;
      return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(points), point);
    });
    __publicField(this, "getRotatedBounds", () => {
      const {
        rotatedPoints,
        props: { point }
      } = this;
      return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedPoints), point);
    });
    __publicField(this, "normalizedHandles", []);
    __publicField(this, "onResizeStart", () => {
      var _a3;
      const {
        props: { handles },
        bounds
      } = this;
      this.scale = [...(_a3 = this.props.scale) != null ? _a3 : [1, 1]];
      const size = [bounds.width, bounds.height];
      this.normalizedHandles = Object.values(handles).map((h2) => Vec.divV(h2.point, size));
      return this;
    });
    __publicField(this, "onResize", (initialProps, info) => {
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
        handles: Object.values(handles).map((handle, i2) => __spreadProps(__spreadValues({}, handle), {
          point: Vec.mulV(normalizedHandles[i2], size)
        })),
        scale: nextScale
      });
    });
    __publicField(this, "hitTestPoint", (point) => {
      const { points } = this;
      return PointUtils.pointNearToPolyline(Vec.sub(point, this.props.point), points);
    });
    __publicField(this, "hitTestLineSegment", (A3, B3) => {
      const {
        bounds,
        points,
        props: { point }
      } = this;
      if (PointUtils.pointInBounds(A3, bounds) || PointUtils.pointInBounds(B3, bounds) || intersectBoundsLineSegment(bounds, A3, B3).length > 0) {
        const rA = Vec.sub(A3, point);
        const rB = Vec.sub(B3, point);
        return intersectLineSegmentPolyline(rA, rB, points).didIntersect || !!points.find((point2) => Vec.dist(rA, point2) < 5 || Vec.dist(rB, point2) < 5);
      }
      return false;
    });
    __publicField(this, "hitTestBounds", (bounds) => {
      const {
        rotatedBounds,
        points,
        props: { point }
      } = this;
      const oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(point));
      return BoundsUtils.boundsContain(bounds, rotatedBounds) || points.every((vert) => PointUtils.pointInBounds(vert, oBounds)) || BoundsUtils.boundsCollide(bounds, rotatedBounds) && intersectPolylineBounds(points, oBounds).length > 0;
    });
    __publicField(this, "validateProps", (props) => {
      if (props.point)
        props.point = [0, 0];
      if (props.handles !== void 0 && Object.values(props.handles).length < 1)
        props.handles = _TLPolylineShape.defaultProps["handles"];
      return props;
    });
    makeObservable(this);
  }
  get points() {
    return Object.values(this.props.handles).map((h2) => h2.point);
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
    return Object.values(handles).map((h2) => Vec.rotWith(h2.point, centroid, rotation));
  }
};
var TLPolylineShape = _TLPolylineShape;
__publicField(TLPolylineShape, "id", "polyline");
__publicField(TLPolylineShape, "defaultProps", {
  id: "polyline",
  type: "polyline",
  parentId: "page",
  point: [0, 0],
  handles: {}
});
__decorateClass([
  computed
], TLPolylineShape.prototype, "points", 1);
__decorateClass([
  computed
], TLPolylineShape.prototype, "centroid", 1);
__decorateClass([
  computed
], TLPolylineShape.prototype, "rotatedPoints", 1);

// ../../packages/core/src/lib/shapes/TLLineShape/TLLineShape.tsx
var _TLLineShape = class extends TLPolylineShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "hideResizeHandles", true);
    __publicField(this, "hideRotateHandle", true);
    __publicField(this, "validateProps", (props) => {
      if (props.point)
        props.point = [0, 0];
      if (props.handles !== void 0 && Object.values(props.handles).length < 1)
        props.handles = _TLLineShape.defaultProps["handles"];
      return props;
    });
    __publicField(this, "getHandlesChange", (shape, handles) => {
      let nextHandles = deepMerge(shape.handles, handles);
      nextHandles = deepMerge(nextHandles, {
        start: {
          point: src_default.toFixed(nextHandles.start.point)
        },
        end: {
          point: src_default.toFixed(nextHandles.end.point)
        }
      });
      if (src_default.isEqual(nextHandles.start.point, nextHandles.end.point))
        return;
      const nextShape = {
        point: shape.point,
        handles: deepCopy(nextHandles)
      };
      const topLeft = shape.point;
      const nextBounds = BoundsUtils.translateBounds(
        BoundsUtils.getBoundsFromPoints(Object.values(nextHandles).map((h2) => h2.point)),
        nextShape.point
      );
      const offset = src_default.sub([nextBounds.minX, nextBounds.minY], topLeft);
      if (!src_default.isEqual(offset, [0, 0])) {
        Object.values(nextShape.handles).forEach((handle) => {
          handle.point = src_default.toFixed(src_default.sub(handle.point, offset));
        });
        nextShape.point = src_default.toFixed(src_default.add(nextShape.point, offset));
      }
      return nextShape;
    });
    makeObservable(this);
  }
};
var TLLineShape = _TLLineShape;
__publicField(TLLineShape, "id", "line");
__publicField(TLLineShape, "defaultProps", {
  id: "line",
  type: "line",
  parentId: "page",
  point: [0, 0],
  handles: {
    start: { id: "start", canBind: true, point: [0, 0] },
    end: { id: "end", canBind: true, point: [1, 1] }
  }
});

// ../../packages/core/src/lib/shapes/TLPolygonShape/TLPolygonShape.tsx
var TLPolygonShape = class extends TLBoxShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "getRotatedBounds", () => {
      const {
        rotatedVertices,
        props: { point },
        offset
      } = this;
      return BoundsUtils.translateBounds(
        BoundsUtils.getBoundsFromPoints(rotatedVertices),
        Vec.add(point, offset)
      );
    });
    __publicField(this, "hitTestPoint", (point) => {
      const { vertices } = this;
      return PointUtils.pointInPolygon(Vec.add(point, this.props.point), vertices);
    });
    __publicField(this, "hitTestLineSegment", (A3, B3) => {
      const {
        vertices,
        props: { point }
      } = this;
      return intersectLineSegmentPolyline(Vec.sub(A3, point), Vec.sub(B3, point), vertices).didIntersect;
    });
    __publicField(this, "hitTestBounds", (bounds) => {
      const {
        rotatedBounds,
        offset,
        rotatedVertices,
        props: { point }
      } = this;
      const oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(Vec.add(point, offset)));
      return BoundsUtils.boundsContain(bounds, rotatedBounds) || rotatedVertices.every((vert) => PointUtils.pointInBounds(vert, oBounds)) || intersectPolygonBounds(rotatedVertices, oBounds).length > 0;
    });
    __publicField(this, "validateProps", (props) => {
      if (props.point)
        props.point = [0, 0];
      if (props.sides !== void 0 && props.sides < 3)
        props.sides = 3;
      return props;
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
    return vertices.map((v2) => Vec.rotWith(v2, centroid, rotation));
  }
  get offset() {
    const {
      props: {
        size: [w2, h2]
      }
    } = this;
    const center = BoundsUtils.getBoundsCenter(BoundsUtils.getBoundsFromPoints(this.vertices));
    return Vec.sub(Vec.div([w2, h2], 2), center);
  }
  getVertices(padding = 0) {
    const { ratio, sides, size, scale } = this.props;
    const vertices = sides === 3 ? PolygonUtils.getTriangleVertices(size, padding, ratio) : PolygonUtils.getPolygonVertices(size, sides, padding, ratio);
    return vertices;
  }
};
__publicField(TLPolygonShape, "id", "polygon");
__publicField(TLPolygonShape, "defaultProps", {
  id: "polygon",
  type: "polygon",
  parentId: "page",
  point: [0, 0],
  size: [100, 100],
  sides: 5,
  ratio: 1,
  isFlippedY: false
});
__decorateClass([
  computed
], TLPolygonShape.prototype, "vertices", 1);
__decorateClass([
  computed
], TLPolygonShape.prototype, "pageVertices", 1);
__decorateClass([
  computed
], TLPolygonShape.prototype, "centroid", 1);
__decorateClass([
  computed
], TLPolygonShape.prototype, "rotatedVertices", 1);
__decorateClass([
  computed
], TLPolygonShape.prototype, "offset", 1);

// ../../packages/core/src/lib/shapes/TLTextShape/TLTextShape.tsx
var TLTextShape = class extends TLBoxShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "canEdit", true);
    __publicField(this, "canFlip", false);
    makeObservable(this);
  }
};
__publicField(TLTextShape, "id", "text");
__publicField(TLTextShape, "defaultProps", {
  id: "text",
  type: "text",
  parentId: "page",
  isSizeLocked: true,
  point: [0, 0],
  size: [16, 32],
  text: ""
});

// ../../packages/core/src/lib/shapes/TLGroupShape/TLGroupShape.tsx
var TLGroupShape = class extends TLBoxShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "canEdit", false);
    __publicField(this, "canFlip", false);
    __publicField(this, "getBounds", () => {
      if (this.shapes.length === 0) {
        const app = useApp();
        app.deleteShapes([this.id]);
        return {
          minX: 0,
          minY: 0,
          maxX: 0,
          maxY: 0,
          width: 0,
          height: 0
        };
      }
      return BoundsUtils.getCommonBounds(this.shapes.map((s2) => s2.getBounds()));
    });
    makeObservable(this);
    this.canResize = [false, false];
  }
  getShapes() {
    throw new Error("will be implemented other places");
  }
  get shapes() {
    return this.getShapes();
  }
};
__publicField(TLGroupShape, "id", "group");
__publicField(TLGroupShape, "defaultProps", {
  id: "group",
  type: "group",
  parentId: "page",
  point: [0, 0],
  size: [0, 0],
  children: []
});
__decorateClass([
  computed
], TLGroupShape.prototype, "shapes", 1);

// ../../packages/core/src/lib/TLState.ts
var TLRootState = class {
  constructor() {
    __publicField(this, "_id");
    __publicField(this, "_initial");
    __publicField(this, "_states");
    __publicField(this, "_isActive", false);
    __publicField(this, "cursor");
    __publicField(this, "_disposables", []);
    __publicField(this, "children", /* @__PURE__ */ new Map([]));
    __publicField(this, "registerStates", (stateClasses) => {
      stateClasses.forEach((StateClass) => this.children.set(StateClass.id, new StateClass(this, this)));
      return this;
    });
    __publicField(this, "deregisterStates", (states) => {
      states.forEach((StateClass) => {
        var _a3;
        (_a3 = this.children.get(StateClass.id)) == null ? void 0 : _a3.dispose();
        this.children.delete(StateClass.id);
      });
      return this;
    });
    __publicField(this, "currentState", {});
    __publicField(this, "transition", (id3, data = {}) => {
      if (this.children.size === 0)
        throw Error(`Tool ${this.id} has no states, cannot transition to ${id3}.`);
      const nextState = this.children.get(id3);
      const prevState = this.currentState;
      if (!nextState)
        throw Error(`Could not find a state named ${id3}.`);
      transaction(() => {
        if (this.currentState) {
          prevState._events.onExit(__spreadProps(__spreadValues({}, data), { toId: id3 }));
          prevState.dispose();
          this.setCurrentState(nextState);
          this._events.onTransition(__spreadProps(__spreadValues({}, data), { fromId: prevState.id, toId: id3 }));
          nextState._events.onEnter(__spreadProps(__spreadValues({}, data), { fromId: prevState.id }));
        } else {
          this.currentState = nextState;
          nextState._events.onEnter(__spreadProps(__spreadValues({}, data), { fromId: "" }));
        }
      });
      return this;
    });
    __publicField(this, "isIn", (path) => {
      const ids = path.split(".").reverse();
      let state = this;
      while (ids.length > 0) {
        const id3 = ids.pop();
        if (!id3) {
          return true;
        }
        if (state.currentState.id === id3) {
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
    __publicField(this, "isInAny", (...paths) => {
      return paths.some(this.isIn);
    });
    __publicField(this, "forwardEvent", (eventName, ...args) => {
      var _a3, _b;
      if ((_b = (_a3 = this.currentState) == null ? void 0 : _a3._events) == null ? void 0 : _b[eventName]) {
        transaction(() => {
          var _a4;
          return (_a4 = this.currentState._events) == null ? void 0 : _a4[eventName](...args);
        });
      }
    });
    __publicField(this, "_events", {
      onTransition: (info) => {
        var _a3;
        (_a3 = this.onTransition) == null ? void 0 : _a3.call(this, info);
      },
      onEnter: (info) => {
        var _a3;
        this._isActive = true;
        if (this.initial)
          this.transition(this.initial, info);
        (_a3 = this.onEnter) == null ? void 0 : _a3.call(this, info);
      },
      onExit: (info) => {
        var _a3, _b, _c;
        this._isActive = false;
        (_b = (_a3 = this.currentState) == null ? void 0 : _a3.onExit) == null ? void 0 : _b.call(_a3, { toId: "parent" });
        (_c = this.onExit) == null ? void 0 : _c.call(this, info);
      },
      onPointerDown: (info, event) => {
        var _a3;
        (_a3 = this.onPointerDown) == null ? void 0 : _a3.call(this, info, event);
        this.forwardEvent("onPointerDown", info, event);
      },
      onPointerUp: (info, event) => {
        var _a3;
        (_a3 = this.onPointerUp) == null ? void 0 : _a3.call(this, info, event);
        this.forwardEvent("onPointerUp", info, event);
      },
      onPointerMove: (info, event) => {
        var _a3;
        (_a3 = this.onPointerMove) == null ? void 0 : _a3.call(this, info, event);
        this.forwardEvent("onPointerMove", info, event);
      },
      onPointerEnter: (info, event) => {
        var _a3;
        (_a3 = this.onPointerEnter) == null ? void 0 : _a3.call(this, info, event);
        this.forwardEvent("onPointerEnter", info, event);
      },
      onPointerLeave: (info, event) => {
        var _a3;
        (_a3 = this.onPointerLeave) == null ? void 0 : _a3.call(this, info, event);
        this.forwardEvent("onPointerLeave", info, event);
      },
      onDoubleClick: (info, event) => {
        var _a3;
        (_a3 = this.onDoubleClick) == null ? void 0 : _a3.call(this, info, event);
        this.forwardEvent("onDoubleClick", info, event);
      },
      onKeyDown: (info, event) => {
        var _a3;
        this._events.onModifierKey(info, event);
        (_a3 = this.onKeyDown) == null ? void 0 : _a3.call(this, info, event);
        this.forwardEvent("onKeyDown", info, event);
      },
      onKeyUp: (info, event) => {
        var _a3;
        this._events.onModifierKey(info, event);
        (_a3 = this.onKeyUp) == null ? void 0 : _a3.call(this, info, event);
        this.forwardEvent("onKeyUp", info, event);
      },
      onPinchStart: (info, event) => {
        var _a3;
        (_a3 = this.onPinchStart) == null ? void 0 : _a3.call(this, info, event);
        this.forwardEvent("onPinchStart", info, event);
      },
      onPinch: (info, event) => {
        var _a3;
        (_a3 = this.onPinch) == null ? void 0 : _a3.call(this, info, event);
        this.forwardEvent("onPinch", info, event);
      },
      onPinchEnd: (info, event) => {
        var _a3;
        (_a3 = this.onPinchEnd) == null ? void 0 : _a3.call(this, info, event);
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
    __publicField(this, "onEnter");
    __publicField(this, "onExit");
    __publicField(this, "onTransition");
    __publicField(this, "onPointerDown");
    __publicField(this, "onPointerUp");
    __publicField(this, "onPointerMove");
    __publicField(this, "onPointerEnter");
    __publicField(this, "onPointerLeave");
    __publicField(this, "onDoubleClick");
    __publicField(this, "onKeyDown");
    __publicField(this, "onKeyUp");
    __publicField(this, "onPinchStart");
    __publicField(this, "onPinch");
    __publicField(this, "onPinchEnd");
    const id3 = this.constructor["id"];
    const initial = this.constructor["initial"];
    const states = this.constructor["states"];
    this._id = id3;
    this._initial = initial;
    this._states = states;
  }
  dispose() {
    this._disposables.forEach((disposable) => disposable());
    this._disposables = [];
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
__publicField(TLRootState, "id");
__publicField(TLRootState, "shortcuts");
__decorateClass([
  observable
], TLRootState.prototype, "currentState", 2);
__decorateClass([
  action
], TLRootState.prototype, "setCurrentState", 1);
var TLState = class extends TLRootState {
  constructor(parent, root) {
    var _a3, _b;
    super();
    __publicField(this, "_root");
    __publicField(this, "_parent");
    __publicField(this, "children", /* @__PURE__ */ new Map([]));
    __publicField(this, "registerStates", (stateClasses) => {
      stateClasses.forEach(
        (StateClass) => this.children.set(StateClass.id, new StateClass(this, this._root))
      );
      return this;
    });
    __publicField(this, "deregisterStates", (states) => {
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
      const initialId = (_a3 = this.initial) != null ? _a3 : this.states[0].id;
      const state = this.children.get(initialId);
      if (state) {
        this.setCurrentState(state);
        (_b = this.currentState) == null ? void 0 : _b._events.onEnter({ fromId: "initial" });
      }
    }
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
__publicField(TLState, "cursor");

// ../../packages/core/src/lib/TLTool.tsx
var TLTool = class extends TLState {
  constructor() {
    super(...arguments);
    __publicField(this, "isLocked", false);
    __publicField(this, "previous");
    __publicField(this, "onEnter", ({ fromId }) => {
      this.previous = fromId;
      if (this.cursor)
        this.app.cursors.setCursor(this.cursor);
    });
    __publicField(this, "onTransition", (info) => {
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

// ../../packages/core/src/lib/TLToolState.ts
var TLToolState = class extends TLState {
  get app() {
    return this.root;
  }
  get tool() {
    return this.parent;
  }
};

// ../../packages/core/src/lib/tools/TLBoxTool/states/CreatingState.tsx
var CreatingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "crosshair" /* Cross */);
    __publicField(this, "creatingShape");
    __publicField(this, "aspectRatio");
    __publicField(this, "initialBounds", {});
    __publicField(this, "onEnter", () => {
      const {
        currentPage,
        inputs: { originPoint, currentPoint }
      } = this.app;
      const { Shape: Shape5 } = this.tool;
      const shape = new Shape5({
        id: uniqueId(),
        type: Shape5.id,
        parentId: currentPage.id,
        point: [...originPoint],
        fill: this.app.settings.color,
        stroke: this.app.settings.color,
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
      this.creatingShape.setScaleLevel(this.app.settings.scaleLevel);
      this.app.currentPage.addShapes(shape);
      this.app.setSelectedShapes([shape]);
    });
    __publicField(this, "onPointerMove", (info) => {
      if (info.order)
        return;
      if (!this.creatingShape)
        throw Error("Expected a creating shape.");
      const { initialBounds } = this;
      const { currentPoint, originPoint, shiftKey } = this.app.inputs;
      const isAspectRatioLocked = shiftKey || this.creatingShape.props.isAspectRatioLocked || !this.creatingShape.canChangeAspectRatio;
      let bounds = BoundsUtils.getTransformedBoundingBox(
        initialBounds,
        "bottom_right_corner" /* BottomRight */,
        src_default.sub(currentPoint, originPoint),
        0,
        isAspectRatioLocked
      );
      if (this.app.settings.snapToGrid && !isAspectRatioLocked) {
        bounds = BoundsUtils.snapBoundsToGrid(bounds, GRID_SIZE);
      }
      this.creatingShape.update({
        point: [bounds.minX, bounds.minY],
        size: [bounds.width, bounds.height]
      });
    });
    __publicField(this, "onPointerUp", () => {
      this.tool.transition("idle");
      if (this.creatingShape) {
        this.app.setSelectedShapes([this.creatingShape]);
        this.app.api.editShape(this.creatingShape);
      } else {
        this.app.transition("select");
      }
      this.app.persist();
    });
    __publicField(this, "onKeyDown", (info, e) => {
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
__publicField(CreatingState, "id", "creating");

// ../../packages/core/src/lib/tools/TLBoxTool/states/IdleState.tsx
var IdleState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onPointerDown", (info, e) => {
      if (info.order)
        return;
      this.tool.transition("pointing");
    });
    __publicField(this, "onPinchStart", (...args) => {
      var _a3, _b;
      this.app.transition("select", { returnTo: this.app.currentState.id });
      (_b = (_a3 = this.app._events).onPinchStart) == null ? void 0 : _b.call(_a3, ...args);
    });
    __publicField(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.transition("select");
          break;
        }
      }
    });
  }
};
__publicField(IdleState, "id", "idle");

// ../../packages/core/src/lib/tools/TLBoxTool/states/PointingState.tsx
var PointingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5 && !this.app.readOnly) {
        this.tool.transition("creating");
        this.app.setSelectedShapes(this.app.currentPage.shapes);
      }
    });
    __publicField(this, "onPointerUp", () => {
      this.tool.transition("idle");
    });
  }
};
__publicField(PointingState, "id", "pointing");

// ../../packages/core/src/lib/tools/TLBoxTool/TLBoxTool.ts
var TLBoxTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "crosshair" /* Cross */);
  }
};
__publicField(TLBoxTool, "id", "box");
__publicField(TLBoxTool, "states", [IdleState, PointingState, CreatingState]);
__publicField(TLBoxTool, "initial", "idle");

// ../../packages/core/src/lib/tools/TLDrawTool/states/CreatingState.tsx
var CreatingState3 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "shape", {});
    __publicField(this, "points", [[0, 0, 0.5]]);
    __publicField(this, "persistDebounced", debounce(this.app.persist, 200));
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
    __publicField(this, "onEnter", () => {
      var _a3, _b;
      const { Shape: Shape5, previousShape } = this.tool;
      const { originPoint } = this.app.inputs;
      this.app.history.pause();
      if (this.app.inputs.shiftKey && previousShape) {
        this.shape = previousShape;
        const { shape } = this;
        const prevPoint = shape.props.points[shape.props.points.length - 1];
        const nextPoint = Vec.sub(originPoint, shape.props.point).concat((_a3 = originPoint[2]) != null ? _a3 : 0.5);
        this.points = [...shape.props.points, prevPoint, prevPoint];
        const len = Math.ceil(Vec.dist(prevPoint, originPoint) / 16);
        for (let i2 = 0, t = i2 / (len - 1); i2 < len; i2++) {
          this.points.push(
            Vec.lrp(prevPoint, nextPoint, t).concat(lerp(prevPoint[2], nextPoint[2], t))
          );
        }
        this.addNextPoint(nextPoint);
      } else {
        this.tool.previousShape = void 0;
        this.points = [[0, 0, (_b = originPoint[2]) != null ? _b : 0.5]];
        this.shape = new Shape5({
          id: uniqueId(),
          type: Shape5.id,
          parentId: this.app.currentPage.id,
          point: originPoint.slice(0, 2),
          points: this.points,
          isComplete: false,
          fill: this.app.settings.color,
          stroke: this.app.settings.color
        });
        this.shape.setScaleLevel(this.app.settings.scaleLevel);
        this.app.currentPage.addShapes(this.shape);
      }
    });
    __publicField(this, "onPointerMove", () => {
      const { shape } = this;
      const { currentPoint, previousPoint } = this.app.inputs;
      if (Vec.isEqual(previousPoint, currentPoint))
        return;
      this.addNextPoint(Vec.sub(currentPoint, shape.props.point).concat(currentPoint[2]));
    });
    __publicField(this, "onPointerUp", () => {
      if (!this.shape)
        throw Error("Expected a creating shape.");
      this.app.history.resume();
      this.shape.update({
        isComplete: true,
        points: this.tool.simplify ? PointUtils.simplify2(this.points, this.tool.simplifyTolerance) : this.shape.props.points
      });
      this.tool.previousShape = this.shape;
      this.tool.transition("idle");
      let tool = this.app.selectedTool.id;
      if (tool === "pencil" || tool === "highlighter") {
        this.persistDebounced();
      } else {
        this.app.persist();
      }
    });
    __publicField(this, "onKeyDown", (info, e) => {
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
      this.points = this.points.map((pt2) => Vec.sub(pt2, offset).concat(pt2[2]));
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
__publicField(CreatingState3, "id", "creating");

// ../../packages/core/src/lib/tools/TLDrawTool/states/IdleState.tsx
var IdleState3 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onPointerDown", (info, e) => {
      if (info.order || this.app.readOnly)
        return;
      this.tool.transition("creating");
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
    __publicField(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.transition("select");
          break;
        }
      }
    });
  }
};
__publicField(IdleState3, "id", "idle");

// ../../packages/core/src/lib/tools/TLDrawTool/states/PinchingState.ts
var PinchingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "origin", [0, 0]);
    __publicField(this, "prevDelta", [0, 0]);
    __publicField(this, "onEnter", (info) => {
      this.prevDelta = info.info.delta;
      this.origin = info.info.point;
    });
    __publicField(this, "onPinch", (info) => {
      this.app.viewport.pinchZoom(info.point, info.delta, info.delta[2]);
    });
    __publicField(this, "onPinchEnd", () => {
      this.tool.transition("idle");
    });
  }
};
__publicField(PinchingState, "id", "pinching");

// ../../packages/core/src/lib/tools/TLDrawTool/TLDrawTool.tsx
var TLDrawTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "crosshair" /* Cross */);
    __publicField(this, "simplify", true);
    __publicField(this, "simplifyTolerance", 1);
    __publicField(this, "previousShape");
    __publicField(this, "onPinchStart", (info, event) => {
      this.transition("pinching", { info, event });
    });
  }
};
__publicField(TLDrawTool, "id", "draw");
__publicField(TLDrawTool, "states", [IdleState3, CreatingState3, PinchingState]);
__publicField(TLDrawTool, "initial", "idle");

// ../../packages/core/src/lib/tools/TLEraseTool/states/ErasingState.tsx
var ErasingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "points", [[0, 0, 0.5]]);
    __publicField(this, "hitShapes", /* @__PURE__ */ new Set());
    __publicField(this, "onEnter", () => {
      const { originPoint } = this.app.inputs;
      this.points = [originPoint];
      this.hitShapes.clear();
    });
    __publicField(this, "onPointerMove", () => {
      const { currentPoint, previousPoint } = this.app.inputs;
      if (Vec.isEqual(previousPoint, currentPoint))
        return;
      this.points.push(currentPoint);
      this.app.shapesInViewport.filter((shape) => shape.hitTestLineSegment(previousPoint, currentPoint)).forEach((shape) => this.hitShapes.add(shape));
      this.app.setErasingShapes(Array.from(this.hitShapes.values()));
    });
    __publicField(this, "onPointerUp", () => {
      this.app.deleteShapes(Array.from(this.hitShapes.values()));
      this.tool.transition("idle");
    });
    __publicField(this, "onKeyDown", (info, e) => {
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
__publicField(ErasingState, "id", "erasing");

// ../../packages/core/src/lib/tools/TLEraseTool/states/IdleState.tsx
var IdleState4 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onPointerDown", (info, e) => {
      if (info.order)
        return;
      this.tool.transition("pointing");
    });
    __publicField(this, "onPinchStart", (...args) => {
      var _a3, _b;
      this.app.transition("select", { returnTo: this.app.currentState.id });
      (_b = (_a3 = this.app._events).onPinchStart) == null ? void 0 : _b.call(_a3, ...args);
    });
    __publicField(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.transition("select");
          break;
        }
      }
    });
  }
};
__publicField(IdleState4, "id", "idle");

// ../../packages/core/src/lib/tools/TLEraseTool/states/PointingState.tsx
var PointingState2 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onEnter", () => {
      const { currentPoint } = this.app.inputs;
      this.app.setErasingShapes(
        this.app.shapesInViewport.filter((shape) => shape.hitTestPoint(currentPoint))
      );
    });
    __publicField(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("erasing");
        this.app.setSelectedShapes([]);
      }
    });
    __publicField(this, "onPointerUp", () => {
      const shapesToDelete = [...this.app.erasingShapes];
      this.app.setErasingShapes([]);
      this.app.deleteShapes(shapesToDelete);
      this.tool.transition("idle");
    });
  }
};
__publicField(PointingState2, "id", "pointing");

// ../../packages/core/src/lib/tools/TLEraseTool/TLEraseTool.tsx
var TLEraseTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "crosshair" /* Cross */);
  }
};
__publicField(TLEraseTool, "id", "erase");
__publicField(TLEraseTool, "states", [IdleState4, PointingState2, ErasingState]);
__publicField(TLEraseTool, "initial", "idle");

// ../../packages/core/src/lib/TLBaseLineBindingState.ts
var TLBaseLineBindingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "handle", {});
    __publicField(this, "handleId", "end");
    __publicField(this, "currentShape", {});
    __publicField(this, "initialShape", {});
    __publicField(this, "bindableShapeIds", []);
    __publicField(this, "startBindingShapeId");
    __publicField(this, "newStartBindingId", "");
    __publicField(this, "draggedBindingId", "");
    __publicField(this, "onPointerMove", () => {
      const {
        inputs: { shiftKey, previousPoint, originPoint, currentPoint, modKey: modKey2, altKey },
        settings: { snapToGrid }
      } = this.app;
      const shape = this.app.getShapeById(this.initialShape.id);
      const { handles } = this.initialShape;
      const handleId = this.handleId;
      const otherHandleId = this.handleId === "start" ? "end" : "start";
      if (src_default.isEqual(previousPoint, currentPoint))
        return;
      let delta = src_default.sub(currentPoint, originPoint);
      if (shiftKey) {
        const A3 = handles[otherHandleId].point;
        const B3 = handles[handleId].point;
        const C3 = src_default.add(B3, delta);
        const angle = src_default.angle(A3, C3);
        const adjusted = src_default.rotWith(C3, A3, GeomUtils.snapAngleToSegments(angle, 24) - angle);
        delta = src_default.add(delta, src_default.sub(adjusted, C3));
      }
      const nextPoint = src_default.add(handles[handleId].point, delta);
      const handleChanges = {
        [handleId]: __spreadProps(__spreadValues({}, handles[handleId]), {
          point: snapToGrid ? src_default.snap(nextPoint, GRID_SIZE) : src_default.toFixed(nextPoint),
          bindingId: void 0
        })
      };
      let updated = this.currentShape.getHandlesChange(this.initialShape, handleChanges);
      if (!updated)
        return;
      const next = {
        shape: deepMerge(shape.props, updated),
        bindings: {}
      };
      let draggedBinding;
      const draggingHandle = next.shape.handles[handleId];
      const oppositeHandle = next.shape.handles[otherHandleId];
      if (this.startBindingShapeId) {
        let nextStartBinding;
        const startTarget = this.app.getShapeById(this.startBindingShapeId);
        if (startTarget) {
          const center = startTarget.getCenter();
          const startHandle = next.shape.handles.start;
          const endHandle = next.shape.handles.end;
          const rayPoint = src_default.add(startHandle.point, next.shape.point);
          if (src_default.isEqual(rayPoint, center))
            rayPoint[1]++;
          const rayOrigin = center;
          const isInsideShape = startTarget.hitTestPoint(currentPoint);
          const rayDirection = src_default.uni(src_default.sub(rayPoint, rayOrigin));
          const hasStartBinding = this.app.currentPage.bindings[this.newStartBindingId] !== void 0;
          if (!modKey2 && !startTarget.hitTestPoint(src_default.add(next.shape.point, endHandle.point))) {
            nextStartBinding = findBindingPoint(
              shape.props,
              startTarget,
              "start",
              this.newStartBindingId,
              center,
              rayOrigin,
              rayDirection,
              isInsideShape
            );
          }
          if (nextStartBinding && !hasStartBinding) {
            next.bindings[this.newStartBindingId] = nextStartBinding;
            next.shape.handles.start.bindingId = nextStartBinding.id;
          } else if (!nextStartBinding && hasStartBinding) {
            console.log("removing start binding");
            delete next.bindings[this.newStartBindingId];
            next.shape.handles.start.bindingId = void 0;
          }
        }
      }
      if (!modKey2) {
        const rayOrigin = src_default.add(oppositeHandle.point, next.shape.point);
        const rayPoint = src_default.add(draggingHandle.point, next.shape.point);
        const rayDirection = src_default.uni(src_default.sub(rayPoint, rayOrigin));
        const startPoint = src_default.add(next.shape.point, next.shape.handles.start.point);
        const endPoint = src_default.add(next.shape.point, next.shape.handles.end.point);
        const targets = this.bindableShapeIds.map((id3) => this.app.getShapeById(id3)).sort((a3, b3) => b3.nonce - a3.nonce).filter((shape2) => {
          return ![startPoint, endPoint].every((point) => shape2.hitTestPoint(point));
        });
        for (const target of targets) {
          draggedBinding = findBindingPoint(
            shape.props,
            target,
            this.handleId,
            this.draggedBindingId,
            rayPoint,
            rayOrigin,
            rayDirection,
            altKey
          );
          if (draggedBinding)
            break;
        }
      }
      if (draggedBinding) {
        next.bindings[this.draggedBindingId] = draggedBinding;
        next.shape = deepMerge(next.shape, {
          handles: {
            [this.handleId]: {
              bindingId: this.draggedBindingId
            }
          }
        });
      } else {
        const currentBindingId = shape.props.handles[this.handleId].bindingId;
        if (currentBindingId !== void 0) {
          delete next.bindings[currentBindingId];
          next.shape = deepMerge(next.shape, {
            handles: {
              [this.handleId]: {
                bindingId: void 0
              }
            }
          });
        }
      }
      updated = this.currentShape.getHandlesChange(next.shape, next.shape.handles);
      transaction(() => {
        var _a3;
        if (updated) {
          this.currentShape.update(updated);
          this.app.currentPage.updateBindings(next.bindings);
          const bindingShapes = Object.values((_a3 = updated.handles) != null ? _a3 : {}).map((handle) => handle.bindingId).map((id3) => this.app.currentPage.bindings[id3]).filter(Boolean).flatMap((binding) => [binding.toId, binding.fromId].filter(Boolean));
          this.app.setBindingShapes(bindingShapes);
        }
      });
    });
    __publicField(this, "onPointerUp", () => {
      this.tool.transition("idle");
      if (this.currentShape) {
        this.app.setSelectedShapes([this.currentShape]);
      }
      this.app.transition("select");
      this.app.persist();
    });
    __publicField(this, "onExit", () => {
      this.app.clearBindingShape();
      this.app.history.resume();
      this.app.persist();
    });
    __publicField(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.deleteShapes([this.currentShape]);
          this.tool.transition("idle");
          break;
        }
      }
    });
  }
};
__publicField(TLBaseLineBindingState, "id", "creating");

// ../../packages/core/src/lib/tools/TLLineTool/states/CreatingState.tsx
var CreatingState4 = class extends TLBaseLineBindingState {
  constructor() {
    super(...arguments);
    __publicField(this, "onEnter", () => {
      var _a3;
      this.app.history.pause();
      this.newStartBindingId = uniqueId();
      this.draggedBindingId = uniqueId();
      const page = this.app.currentPage;
      this.bindableShapeIds = page.getBindableShapes();
      const { Shape: Shape5 } = this.tool;
      const { originPoint } = this.app.inputs;
      const shape = new Shape5(__spreadProps(__spreadValues({}, Shape5.defaultProps), {
        id: uniqueId(),
        type: Shape5.id,
        parentId: this.app.currentPage.id,
        point: this.app.settings.snapToGrid ? src_default.snap(originPoint, GRID_SIZE) : originPoint,
        fill: this.app.settings.color,
        stroke: this.app.settings.color,
        scaleLevel: this.app.settings.scaleLevel
      }));
      this.initialShape = toJS(shape.props);
      this.currentShape = shape;
      this.app.currentPage.addShapes(shape);
      this.app.setSelectedShapes([shape]);
      this.startBindingShapeId = (_a3 = this.bindableShapeIds.map((id3) => this.app.getShapeById(id3)).filter((s2) => PointUtils.pointInBounds(originPoint, s2.bounds))[0]) == null ? void 0 : _a3.id;
      if (this.startBindingShapeId) {
        this.bindableShapeIds.splice(this.bindableShapeIds.indexOf(this.startBindingShapeId), 1);
        this.app.setBindingShapes([this.startBindingShapeId]);
      }
    });
  }
};
__publicField(CreatingState4, "id", "creating");

// ../../packages/core/src/lib/tools/TLLineTool/states/IdleState.tsx
var IdleState5 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onPointerDown", (info, e) => {
      if (info.order)
        return;
      this.tool.transition("pointing");
    });
    __publicField(this, "onPinchStart", (...args) => {
      var _a3, _b;
      this.app.transition("select", { returnTo: this.app.currentState.id });
      (_b = (_a3 = this.app._events).onPinchStart) == null ? void 0 : _b.call(_a3, ...args);
    });
    __publicField(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.transition("select");
          break;
        }
      }
    });
    __publicField(this, "onPointerEnter", (info) => {
      if (info.order)
        return;
      switch (info.type) {
        case "shape" /* Shape */: {
          this.app.setHoveredShape(info.shape.id);
          break;
        }
        case "selection" /* Selection */: {
          if (!(info.handle === "background" || info.handle === "center")) {
            this.tool.transition("hoveringSelectionHandle", info);
          }
          break;
        }
      }
    });
    __publicField(this, "onPointerLeave", (info) => {
      if (info.order)
        return;
      if (info.type === "shape" /* Shape */) {
        if (this.app.hoveredId) {
          this.app.setHoveredShape(void 0);
        }
      }
    });
  }
};
__publicField(IdleState5, "id", "idle");

// ../../packages/core/src/lib/tools/TLLineTool/states/PointingState.tsx
var PointingState3 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5 && !this.app.readOnly) {
        this.tool.transition("creating");
        this.app.setSelectedShapes(this.app.currentPage.shapes);
      }
    });
  }
};
__publicField(PointingState3, "id", "pointing");

// ../../packages/core/src/lib/tools/TLLineTool/TLLineTool.ts
var TLLineTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "crosshair" /* Cross */);
  }
};
__publicField(TLLineTool, "id", "line");
__publicField(TLLineTool, "states", [IdleState5, PointingState3, CreatingState4]);
__publicField(TLLineTool, "initial", "idle");

// ../../packages/core/src/lib/tools/TLTextTool/states/CreatingState.tsx
var CreatingState5 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "crosshair" /* Cross */);
    __publicField(this, "creatingShape");
    __publicField(this, "aspectRatio");
    __publicField(this, "initialBounds", {});
    __publicField(this, "onEnter", () => {
      const {
        currentPage,
        inputs: { originPoint }
      } = this.app;
      const { Shape: Shape5 } = this.tool;
      const shape = new Shape5({
        id: uniqueId(),
        type: Shape5.id,
        parentId: currentPage.id,
        point: [...originPoint],
        text: "",
        size: [16, 32],
        isSizeLocked: true,
        fill: this.app.settings.color,
        stroke: this.app.settings.color
      });
      this.creatingShape = shape;
      this.creatingShape.setScaleLevel(this.app.settings.scaleLevel);
      transaction(() => {
        this.app.currentPage.addShapes(shape);
        const point = this.app.settings.snapToGrid ? src_default.snap([...originPoint], GRID_SIZE) : originPoint;
        const { bounds } = shape;
        shape.update({
          point: src_default.sub(point, [bounds.width / 2, bounds.height / 2])
        });
        this.app.transition("select");
        this.app.setSelectedShapes([shape]);
        this.app.currentState.transition("editingShape", {
          type: "shape" /* Shape */,
          shape: this.creatingShape,
          order: 0
        });
      });
    });
  }
};
__publicField(CreatingState5, "id", "creating");

// ../../packages/core/src/lib/tools/TLTextTool/states/IdleState.tsx
var IdleState6 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onPointerDown", (info, e) => {
      if (info.order || this.app.readOnly)
        return;
      this.tool.transition("creating");
    });
    __publicField(this, "onPinchStart", (...args) => {
      var _a3, _b;
      this.app.transition("select", { returnTo: this.app.currentState.id });
      (_b = (_a3 = this.app._events).onPinchStart) == null ? void 0 : _b.call(_a3, ...args);
    });
    __publicField(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.transition("select");
          break;
        }
      }
    });
  }
};
__publicField(IdleState6, "id", "idle");

// ../../packages/core/src/lib/tools/TLTextTool/TLTextTool.ts
var TLTextTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "crosshair" /* Cross */);
  }
};
__publicField(TLTextTool, "id", "box");
__publicField(TLTextTool, "states", [IdleState6, CreatingState5]);
__publicField(TLTextTool, "initial", "idle");

// ../../packages/core/src/lib/TLBush.ts
var import_rbush = __toESM(require_rbush_min());
var TLBush = class extends import_rbush.default {
  constructor() {
    super(...arguments);
    __publicField(this, "toBBox", (shape) => shape.rotatedBounds);
  }
};

// ../../packages/core/src/lib/tools/TLSelectTool/states/BrushingState.ts
var BrushingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "initialSelectedIds", []);
    __publicField(this, "initialSelectedShapes", []);
    __publicField(this, "tree", new TLBush());
    __publicField(this, "onEnter", () => {
      const { selectedShapes, currentPage, selectedIds } = this.app;
      this.initialSelectedIds = Array.from(selectedIds.values());
      this.initialSelectedShapes = Array.from(selectedShapes.values());
      this.tree.load(currentPage.shapes);
    });
    __publicField(this, "onExit", () => {
      this.initialSelectedIds = [];
      this.tree.clear();
      this.app.setBrush(void 0);
    });
    __publicField(this, "onPointerMove", () => {
      const {
        inputs: { shiftKey, ctrlKey, originPoint, currentPoint }
      } = this.app;
      const brushBounds = BoundsUtils.getBoundsFromPoints([currentPoint, originPoint], 0);
      this.app.setBrush(brushBounds);
      const hits = dedupe(
        this.tree.search(brushBounds).filter(
          (shape) => ctrlKey ? BoundsUtils.boundsContain(brushBounds, shape.rotatedBounds) : shape.hitTestBounds(brushBounds)
        ).filter((shape) => shape.type !== "group").map((shape) => {
          var _a3;
          return (_a3 = this.app.getParentGroup(shape)) != null ? _a3 : shape;
        })
      );
      if (shiftKey) {
        if (hits.every((hit) => this.initialSelectedShapes.includes(hit))) {
          this.app.setSelectedShapes(this.initialSelectedShapes.filter((hit) => !hits.includes(hit)));
        } else {
          this.app.setSelectedShapes(dedupe([...this.initialSelectedShapes, ...hits]));
        }
      } else {
        this.app.setSelectedShapes(hits);
      }
      this.app.viewport.panToPointWhenNearBounds(currentPoint);
    });
    __publicField(this, "onPointerUp", () => {
      this.app.setBrush(void 0);
      this.tool.transition("idle");
    });
    __publicField(this, "handleModifierKey", (info, e) => {
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
__publicField(BrushingState, "id", "brushing");

// ../../packages/core/src/lib/tools/TLSelectTool/states/ContextMenuState.ts
var ContextMenuState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onEnter", (info) => {
      var _a3;
      const {
        selectedIds,
        inputs: { shiftKey }
      } = this.app;
      if (info.type === "shape" /* Shape */ && !selectedIds.has(info.shape.id)) {
        const shape = (_a3 = this.app.getParentGroup(info.shape)) != null ? _a3 : info.shape;
        if (shiftKey) {
          this.app.setSelectedShapes([...Array.from(selectedIds.values()), shape.id]);
          return;
        }
        this.app.setSelectedShapes([shape]);
      }
    });
    __publicField(this, "onPointerDown", () => {
      this.tool.transition("idle");
    });
  }
};
__publicField(ContextMenuState, "id", "contextMenu");

// ../../packages/core/src/lib/tools/TLSelectTool/states/IdleState.ts
var IdleState7 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onEnter", (info) => {
      if (info.fromId === "pinching" && this.parent.returnTo) {
        this.app.transition(this.parent.returnTo);
      }
    });
    __publicField(this, "onExit", () => {
    });
    __publicField(this, "onPointerEnter", (info) => {
      if (info.order)
        return;
      switch (info.type) {
        case "shape" /* Shape */: {
          this.app.setHoveredShape(info.shape.id);
          break;
        }
        case "selection" /* Selection */: {
          if (!(info.handle === "background" || info.handle === "center")) {
            this.tool.transition("hoveringSelectionHandle", info);
          }
          break;
        }
        case "canvas" /* Canvas */: {
          this.app.setHoveredShape(void 0);
          break;
        }
      }
    });
    __publicField(this, "onPointerDown", (info, event) => {
      const {
        selectedShapes,
        inputs: { ctrlKey }
      } = this.app;
      if (event.button === 2) {
        this.tool.transition("contextMenu", info);
        return;
      }
      if (ctrlKey) {
        this.tool.transition("pointingCanvas");
        return;
      }
      switch (info.type) {
        case "selection" /* Selection */: {
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
        case "shape" /* Shape */: {
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
        case "handle" /* Handle */: {
          this.tool.transition("pointingHandle", info);
          break;
        }
        case "canvas" /* Canvas */: {
          this.tool.transition("pointingCanvas");
          break;
        }
        case "minimap" /* Minimap */: {
          this.tool.transition("pointingMinimap", __spreadValues(__spreadValues({}, event), info));
          break;
        }
      }
    });
    __publicField(this, "onPointerLeave", (info) => {
      if (info.order)
        return;
      if (info.type === "shape" /* Shape */) {
        if (this.app.hoveredId) {
          this.app.setHoveredShape(void 0);
        }
      }
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
    __publicField(this, "onDoubleClick", (info) => {
      if (info.order || this.app.selectedShapesArray.length !== 1 || this.app.readOnly)
        return;
      const selectedShape = this.app.selectedShapesArray[0];
      if (!selectedShape.canEdit || selectedShape.props.isLocked)
        return;
      switch (info.type) {
        case "shape" /* Shape */: {
          this.tool.transition("editingShape", info);
          break;
        }
        case "selection" /* Selection */: {
          if (this.app.selectedShapesArray.length === 1) {
            this.tool.transition("editingShape", {
              type: "shape" /* Shape */,
              target: selectedShape
            });
          }
          break;
        }
      }
    });
    __publicField(this, "onKeyDown", (info, e) => {
      const { selectedShapesArray } = this.app;
      switch (e.key) {
        case "Enter": {
          if (selectedShapesArray.length === 1 && selectedShapesArray[0].canEdit && !this.app.readOnly) {
            this.tool.transition("editingShape", {
              type: "shape" /* Shape */,
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
__publicField(IdleState7, "id", "idle");

// ../../packages/core/src/lib/tools/TLSelectTool/states/PointingShapeState.ts
var PointingShapeState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onEnter", (info) => {
      var _a3;
      const {
        selectedIds,
        inputs: { shiftKey }
      } = this.app;
      const shape = (_a3 = this.app.getParentGroup(info.shape)) != null ? _a3 : info.shape;
      if (shiftKey) {
        this.app.setSelectedShapes([...Array.from(selectedIds.values()), shape.id]);
      } else {
        this.app.setSelectedShapes([shape]);
      }
    });
    __publicField(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5 && !this.app.readOnly) {
        this.tool.transition("translating");
      }
    });
    __publicField(this, "onPointerUp", () => {
      this.tool.transition("idle");
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
};
__publicField(PointingShapeState, "id", "pointingShape");

// ../../packages/core/src/lib/tools/TLSelectTool/states/PointingBoundsBackgroundState.ts
var PointingBoundsBackgroundState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "move" /* Move */);
    __publicField(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5 && !this.app.readOnly) {
        this.tool.transition("translating");
      }
    });
    __publicField(this, "onPointerUp", () => {
      this.app.setSelectedShapes([]);
      this.tool.transition("idle");
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
};
__publicField(PointingBoundsBackgroundState, "id", "pointingBoundsBackground");

// ../../packages/core/src/lib/tools/TLSelectTool/states/PointingCanvasState.ts
var PointingCanvasState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onEnter", () => {
      var _a3;
      const { shiftKey } = this.app.inputs;
      if (!shiftKey) {
        this.app.setSelectedShapes([]);
        this.app.setEditingShape();
        (_a3 = window.getSelection()) == null ? void 0 : _a3.removeAllRanges();
      }
    });
    __publicField(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("brushing");
      }
    });
    __publicField(this, "onPointerUp", () => {
      if (!this.app.inputs.shiftKey) {
        this.app.setSelectedShapes([]);
      }
      this.tool.transition("idle");
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
    __publicField(this, "onDoubleClick", () => {
      this.app.notify("canvas-dbclick", { point: this.app.inputs.originPoint });
    });
  }
};
__publicField(PointingCanvasState, "id", "pointingCanvas");

// ../../packages/core/src/lib/tools/TLSelectTool/states/TranslatingState.ts
var TranslatingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "move" /* Move */);
    __publicField(this, "isCloning", false);
    __publicField(this, "didClone", false);
    __publicField(this, "initialPoints", {});
    __publicField(this, "initialShapePoints", {});
    __publicField(this, "initialClonePoints", {});
    __publicField(this, "clones", []);
    __publicField(this, "onEnter", () => {
      var _a3;
      this.app.history.pause();
      const { allSelectedShapesArray, inputs } = this.app;
      this.initialShapePoints = Object.fromEntries(
        allSelectedShapesArray.map(({ id: id3, props: { point } }) => [id3, point.slice()])
      );
      this.initialPoints = this.initialShapePoints;
      document.querySelectorAll("input,textarea").forEach((el) => el.blur());
      (_a3 = document.getSelection()) == null ? void 0 : _a3.empty();
      if (inputs.altKey) {
        this.startCloning();
      } else {
        this.moveSelectedShapesToPointer();
      }
    });
    __publicField(this, "onExit", () => {
      this.app.history.resume();
      this.didClone = false;
      this.isCloning = false;
      this.clones = [];
      this.initialPoints = {};
      this.initialShapePoints = {};
      this.initialClonePoints = {};
    });
    __publicField(this, "onPointerMove", () => {
      const {
        inputs: { currentPoint }
      } = this.app;
      this.moveSelectedShapesToPointer();
      this.app.viewport.panToPointWhenNearBounds(currentPoint);
    });
    __publicField(this, "onPointerDown", () => {
      this.app.history.resume();
      this.app.persist();
      this.tool.transition("idle");
    });
    __publicField(this, "onPointerUp", () => {
      this.app.history.resume();
      this.app.persist();
      this.tool.transition("idle");
    });
    __publicField(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Alt": {
          this.startCloning();
          break;
        }
        case "Escape": {
          this.app.allSelectedShapes.forEach((shape) => {
            shape.update({ point: this.initialPoints[shape.id] });
          });
          this.tool.transition("idle");
          break;
        }
      }
    });
    __publicField(this, "onKeyUp", (info, e) => {
      switch (e.key) {
        case "Alt": {
          if (!this.isCloning)
            throw Error("Expected to be cloning.");
          const { currentPage, allSelectedShapes } = this.app;
          currentPage.removeShapes(...allSelectedShapes);
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
    transaction(() => {
      this.app.allSelectedShapesArray.filter((s2) => !s2.props.isLocked).forEach((shape) => {
        let position = Vec.add(initialPoints[shape.id], delta);
        if (this.app.settings.snapToGrid) {
          position = Vec.snap(position, GRID_SIZE);
        }
        shape.update({ point: position });
      });
    });
  }
  startCloning() {
    if (!this.didClone) {
      this.clones = this.app.allSelectedShapesArray.map((shape) => {
        const ShapeClass = this.app.getShapeClass(shape.type);
        if (!ShapeClass)
          throw Error("Could not find that shape class.");
        const clone = new ShapeClass(__spreadProps(__spreadValues({}, shape.serialized), {
          id: uniqueId(),
          type: shape.type,
          point: this.initialPoints[shape.id],
          rotation: shape.props.rotation,
          isLocked: false
        }));
        return clone;
      });
      this.initialClonePoints = Object.fromEntries(
        this.clones.map(({ id: id3, props: { point } }) => [id3, point.slice()])
      );
      this.didClone = true;
    }
    this.app.allSelectedShapes.forEach((shape) => {
      shape.update({ point: this.initialPoints[shape.id] });
    });
    this.initialPoints = this.initialClonePoints;
    this.app.currentPage.addShapes(...this.clones);
    this.app.setSelectedShapes(Object.keys(this.initialClonePoints));
    this.moveSelectedShapesToPointer();
    this.isCloning = true;
  }
};
__publicField(TranslatingState, "id", "translating");

// ../../packages/core/src/lib/tools/TLSelectTool/states/PointingSelectedShapeState.ts
var PointingSelectedShapeState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "pointedSelectedShape");
    __publicField(this, "onEnter", (info) => {
      this.pointedSelectedShape = info.shape;
    });
    __publicField(this, "onExit", () => {
      this.pointedSelectedShape = void 0;
    });
    __publicField(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5 && !this.app.readOnly) {
        this.tool.transition("translating");
      }
    });
    __publicField(this, "onPointerUp", () => {
      const { shiftKey, currentPoint } = this.app.inputs;
      const { selectedShapesArray } = this.app;
      if (!this.pointedSelectedShape)
        throw Error("Expected a pointed selected shape");
      if (shiftKey) {
        const { selectedIds } = this.app;
        const next = Array.from(selectedIds.values());
        next.splice(next.indexOf(this.pointedSelectedShape.id), 1);
        this.app.setSelectedShapes(next);
      } else if (selectedShapesArray.length === 1 && this.pointedSelectedShape.canEdit && !this.app.readOnly && !this.pointedSelectedShape.props.isLocked && this.pointedSelectedShape instanceof TLBoxShape && PointUtils.pointInBounds(currentPoint, this.pointedSelectedShape.bounds)) {
        this.tool.transition("editingShape", {
          shape: this.pointedSelectedShape,
          order: 0,
          type: "shape" /* Shape */
        });
        return;
      } else {
        this.app.setSelectedShapes([this.pointedSelectedShape.id]);
      }
      this.tool.transition("idle");
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
};
__publicField(PointingSelectedShapeState, "id", "pointingSelectedShape");

// ../../packages/core/src/lib/tools/TLSelectTool/states/PointingResizeHandleState.ts
var PointingResizeHandleState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "info", {});
    __publicField(this, "onEnter", (info) => {
      this.info = info;
      this.updateCursor();
    });
    __publicField(this, "onExit", () => {
      this.app.cursors.reset();
    });
    __publicField(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("resizing", this.info);
      }
    });
    __publicField(this, "onPointerUp", () => {
      this.tool.transition("hoveringSelectionHandle", this.info);
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
  updateCursor() {
    const rotation = this.app.selectionBounds.rotation;
    const cursor = CURSORS[this.info.handle];
    this.app.cursors.setCursor(cursor, rotation);
  }
};
__publicField(PointingResizeHandleState, "id", "pointingResizeHandle");

// ../../packages/core/src/lib/tools/TLSelectTool/states/ResizingState.ts
var _ResizingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "isSingle", false);
    __publicField(this, "handle", "bottom_right_corner" /* BottomRight */);
    __publicField(this, "snapshots", {});
    __publicField(this, "initialCommonBounds", {});
    __publicField(this, "selectionRotation", 0);
    __publicField(this, "resizeType", "corner");
    __publicField(this, "onEnter", (info) => {
      var _a3, _b;
      const { history, selectedShapesArray, selectionBounds } = this.app;
      if (!selectionBounds)
        throw Error("Expected a selected bounds.");
      this.handle = info.handle;
      this.resizeType = info.handle === "left_edge" /* Left */ || info.handle === "right_edge" /* Right */ ? "horizontal-edge" : info.handle === "top_edge" /* Top */ || info.handle === "bottom_edge" /* Bottom */ ? "vertical-edge" : "corner";
      this.app.cursors.setCursor(
        _ResizingState.CURSORS[info.handle],
        (_a3 = this.app.selectionBounds) == null ? void 0 : _a3.rotation
      );
      history.pause();
      const initialInnerBounds = BoundsUtils.getBoundsFromPoints(
        selectedShapesArray.map((shape) => BoundsUtils.getBoundsCenter(shape.bounds))
      );
      this.isSingle = selectedShapesArray.length === 1;
      this.selectionRotation = this.isSingle ? (_b = selectedShapesArray[0].props.rotation) != null ? _b : 0 : 0;
      this.initialCommonBounds = __spreadValues({}, selectionBounds);
      this.snapshots = Object.fromEntries(
        selectedShapesArray.map((shape) => {
          const bounds = __spreadValues({}, shape.bounds);
          const [cx2, cy] = BoundsUtils.getBoundsCenter(bounds);
          return [
            shape.id,
            {
              props: shape.serialized,
              bounds,
              transformOrigin: [
                (cx2 - this.initialCommonBounds.minX) / this.initialCommonBounds.width,
                (cy - this.initialCommonBounds.minY) / this.initialCommonBounds.height
              ],
              innerTransformOrigin: [
                (cx2 - initialInnerBounds.minX) / initialInnerBounds.width,
                (cy - initialInnerBounds.minY) / initialInnerBounds.height
              ],
              isAspectRatioLocked: shape.props.isAspectRatioLocked || Boolean(!shape.canChangeAspectRatio || shape.props.rotation)
            }
          ];
        })
      );
      selectedShapesArray.forEach((shape) => {
        var _a4;
        (_a4 = shape.onResizeStart) == null ? void 0 : _a4.call(shape, { isSingle: this.isSingle });
      });
    });
    __publicField(this, "onExit", () => {
      this.app.cursors.reset();
      this.snapshots = {};
      this.initialCommonBounds = {};
      this.selectionRotation = 0;
      this.app.history.resume();
    });
    __publicField(this, "onPointerMove", () => {
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
      let nextBounds = BoundsUtils.getTransformedBoundingBox(
        initialCommonBounds,
        handle,
        delta,
        this.selectionRotation,
        useAspectRatioLock
      );
      if (altKey) {
        nextBounds = __spreadValues(__spreadValues({}, nextBounds), BoundsUtils.centerBounds(nextBounds, BoundsUtils.getBoundsCenter(initialCommonBounds)));
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
        var _a3, _b;
        const {
          isAspectRatioLocked,
          props: initialShapeProps,
          bounds: initialShapeBounds,
          transformOrigin,
          innerTransformOrigin
        } = snapshots[shape.id];
        let relativeBounds = BoundsUtils.getRelativeTransformedBoundingBox(
          nextBounds,
          initialCommonBounds,
          initialShapeBounds,
          scaleX < 0,
          scaleY < 0
        );
        const canResizeAny = shape.canResize.some((r2) => r2);
        if (!(canResizeAny || shape.props.isSizeLocked) && this.isSingle) {
          return;
        }
        let scale = [scaleX, scaleY];
        let rotation = (_a3 = initialShapeProps.rotation) != null ? _a3 : 0;
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
        if (this.app.settings.snapToGrid && !isAspectRatioLocked) {
          relativeBounds = BoundsUtils.snapBoundsToGrid(relativeBounds, GRID_SIZE);
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
      this.app.viewport.panToPointWhenNearBounds(currentPoint);
    });
    __publicField(this, "onPointerUp", () => {
      this.app.history.resume();
      this.app.persist();
      this.tool.transition("idle");
    });
    __publicField(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.selectedShapes.forEach((shape) => {
            shape.update(__spreadValues({}, this.snapshots[shape.id].props));
          });
          this.tool.transition("idle");
          break;
        }
      }
    });
  }
  updateCursor(scaleX, scaleY) {
    var _a3, _b, _c, _d;
    const isFlippedX = scaleX < 0 && scaleY >= 0;
    const isFlippedY = scaleY < 0 && scaleX >= 0;
    switch (this.handle) {
      case "top_left_corner" /* TopLeft */:
      case "bottom_right_corner" /* BottomRight */: {
        if (isFlippedX || isFlippedY) {
          if (this.app.cursors.cursor === "nwse-resize" /* NwseResize */) {
            this.app.cursors.setCursor("nesw-resize" /* NeswResize */, (_a3 = this.app.selectionBounds) == null ? void 0 : _a3.rotation);
          }
        } else {
          if (this.app.cursors.cursor === "nesw-resize" /* NeswResize */) {
            this.app.cursors.setCursor("nwse-resize" /* NwseResize */, (_b = this.app.selectionBounds) == null ? void 0 : _b.rotation);
          }
        }
        break;
      }
      case "top_right_corner" /* TopRight */:
      case "bottom_left_corner" /* BottomLeft */: {
        if (isFlippedX || isFlippedY) {
          if (this.app.cursors.cursor === "nesw-resize" /* NeswResize */) {
            this.app.cursors.setCursor("nwse-resize" /* NwseResize */, (_c = this.app.selectionBounds) == null ? void 0 : _c.rotation);
          }
        } else {
          if (this.app.cursors.cursor === "nwse-resize" /* NwseResize */) {
            this.app.cursors.setCursor("nesw-resize" /* NeswResize */, (_d = this.app.selectionBounds) == null ? void 0 : _d.rotation);
          }
        }
        break;
      }
    }
  }
};
var ResizingState = _ResizingState;
__publicField(ResizingState, "id", "resizing");
__publicField(ResizingState, "CURSORS", {
  ["bottom_edge" /* Bottom */]: "ns-resize" /* NsResize */,
  ["top_edge" /* Top */]: "ns-resize" /* NsResize */,
  ["left_edge" /* Left */]: "ew-resize" /* EwResize */,
  ["right_edge" /* Right */]: "ew-resize" /* EwResize */,
  ["bottom_left_corner" /* BottomLeft */]: "nesw-resize" /* NeswResize */,
  ["bottom_right_corner" /* BottomRight */]: "nwse-resize" /* NwseResize */,
  ["top_left_corner" /* TopLeft */]: "nwse-resize" /* NwseResize */,
  ["top_right_corner" /* TopRight */]: "nesw-resize" /* NeswResize */
});

// ../../packages/core/src/lib/tools/TLSelectTool/states/PointingRotateHandleState.ts
var PointingRotateHandleState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "rotate" /* Rotate */);
    __publicField(this, "handle", "");
    __publicField(this, "onEnter", (info) => {
      this.app.history.pause();
      this.handle = info.handle;
      this.updateCursor();
    });
    __publicField(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("rotating", { handle: this.handle });
      }
    });
    __publicField(this, "onPointerUp", () => {
      this.app.history.resume();
      this.app.persist();
      this.tool.transition("idle");
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
  updateCursor() {
    this.app.cursors.setCursor(CURSORS[this.handle], this.app.selectionRotation);
  }
};
__publicField(PointingRotateHandleState, "id", "pointingRotateHandle");

// ../../packages/core/src/lib/tools/TLSelectTool/states/PointingShapeBehindBoundsState.ts
var PointingShapeBehindBoundsState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "info", {});
    __publicField(this, "onEnter", (info) => {
      this.info = info;
    });
    __publicField(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5 && !this.app.readOnly) {
        this.tool.transition("translating");
      }
    });
    __publicField(this, "onPointerUp", () => {
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
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
};
__publicField(PointingShapeBehindBoundsState, "id", "pointingShapeBehindBounds");

// ../../packages/core/src/lib/tools/TLSelectTool/states/RotatingState.ts
var RotatingState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "rotate" /* Rotate */);
    __publicField(this, "snapshot", {});
    __publicField(this, "initialCommonCenter", [0, 0]);
    __publicField(this, "initialCommonBounds", {});
    __publicField(this, "initialAngle", 0);
    __publicField(this, "initialSelectionRotation", 0);
    __publicField(this, "handle", "");
    __publicField(this, "onEnter", (info) => {
      const { history, selectedShapesArray, selectionBounds } = this.app;
      if (!selectionBounds)
        throw Error("Expected selected bounds.");
      history.pause();
      this.handle = info.handle;
      this.initialSelectionRotation = this.app.selectionRotation;
      this.initialCommonBounds = __spreadValues({}, selectionBounds);
      this.initialCommonCenter = BoundsUtils.getBoundsCenter(selectionBounds);
      this.initialAngle = Vec.angle(this.initialCommonCenter, this.app.inputs.currentPoint);
      this.snapshot = Object.fromEntries(
        selectedShapesArray.map((shape) => [
          shape.id,
          {
            point: [...shape.props.point],
            center: [...shape.center],
            rotation: shape.props.rotation,
            handles: "handles" in shape ? deepCopy(shape.handles) : void 0
          }
        ])
      );
      this.updateCursor();
    });
    __publicField(this, "onExit", () => {
      this.app.history.resume();
      this.snapshot = {};
    });
    __publicField(this, "onPointerMove", () => {
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
          const handlePoints = initialHandles.map(
            (handle) => Vec.rotWith(handle.point, relativeCenter, angleDelta)
          );
          const topLeft = BoundsUtils.getCommonTopLeft(handlePoints);
          shape.update({
            point: Vec.add(topLeft, Vec.sub(rotatedCenter, relativeCenter)),
            handles: initialHandles.map((h2, i2) => __spreadProps(__spreadValues({}, h2), {
              point: Vec.sub(handlePoints[i2], topLeft)
            }))
          });
        } else {
          shape.update({
            point: Vec.sub(rotatedCenter, relativeCenter),
            rotation: GeomUtils.clampRadians(
              (initialShape.rotation || 0) + angleDelta + initialAngle2
            )
          });
        }
      });
      const selectionRotation = GeomUtils.clampRadians(initialSelectionRotation + angleDelta);
      this.app.setSelectionRotation(
        shiftKey ? GeomUtils.snapAngleToSegments(selectionRotation, 24) : selectionRotation
      );
      this.updateCursor();
    });
    __publicField(this, "onPointerUp", () => {
      this.app.history.resume();
      this.app.persist();
      this.tool.transition("idle");
    });
    __publicField(this, "onKeyDown", (info, e) => {
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
__publicField(RotatingState, "id", "rotating");

// ../../packages/core/src/lib/tools/TLSelectTool/states/PinchingState.ts
var PinchingState2 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onPinch", (info, event) => {
      this.app.viewport.pinchZoom(info.point, info.delta, info.delta[2]);
    });
    __publicField(this, "onPinchEnd", () => {
      this.tool.transition("idle");
    });
    __publicField(this, "onPointerDown", () => {
      this.tool.transition("idle");
    });
  }
};
__publicField(PinchingState2, "id", "pinching");

// ../../packages/core/src/lib/tools/TLSelectTool/states/TranslatingHandleState.ts
var TranslatingHandleState = class extends TLBaseLineBindingState {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "grabbing" /* Grabbing */);
    __publicField(this, "onEnter", (info) => {
      this.app.history.pause();
      this.newStartBindingId = uniqueId();
      this.draggedBindingId = uniqueId();
      const page = this.app.currentPage;
      this.bindableShapeIds = page.getBindableShapes();
      this.handleId = info.id;
      this.currentShape = info.shape;
      this.initialShape = toJS(this.currentShape.props);
      this.app.setSelectedShapes([this.currentShape]);
    });
  }
};
__publicField(TranslatingHandleState, "id", "translatingHandle");

// ../../packages/core/src/lib/tools/TLSelectTool/states/PointingHandleState.ts
var PointingHandleState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "grabbing" /* Grabbing */);
    __publicField(this, "info", {});
    __publicField(this, "onEnter", (info) => {
      this.info = info;
    });
    __publicField(this, "onPointerMove", () => {
      const { currentPoint, originPoint } = this.app.inputs;
      if (Vec.dist(currentPoint, originPoint) > 5) {
        this.tool.transition("translatingHandle", this.info);
      }
    });
    __publicField(this, "onPointerUp", () => {
      this.tool.transition("idle");
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
};
__publicField(PointingHandleState, "id", "pointingHandle");

// ../../packages/core/src/lib/tools/TLSelectTool/states/HoveringSelectionHandleState.ts
var HoveringSelectionHandleState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "handle");
    __publicField(this, "onEnter", (info) => {
      var _a3;
      this.app.cursors.setCursor(CURSORS[info.handle], (_a3 = this.app.selectionBounds.rotation) != null ? _a3 : 0);
      this.handle = info.handle;
    });
    __publicField(this, "onExit", () => {
      this.app.cursors.reset();
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
    __publicField(this, "onPointerDown", (info) => {
      switch (info.type) {
        case "selection" /* Selection */: {
          switch (info.handle) {
            case "center": {
              break;
            }
            case "background": {
              break;
            }
            case "top_left_resize_corner" /* TopLeft */:
            case "top_right_resize_corner" /* TopRight */:
            case "bottom_right_resize_corner" /* BottomRight */:
            case "bottom_left_resize_corner" /* BottomLeft */: {
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
    __publicField(this, "onPointerLeave", () => {
      this.tool.transition("idle");
    });
    __publicField(this, "onDoubleClick", (info) => {
      var _a3;
      if (info.order)
        return;
      const isSingle = this.app.selectedShapes.size === 1;
      if (!isSingle)
        return;
      const selectedShape = getFirstFromSet(this.app.selectedShapes);
      if (selectedShape.canEdit && !this.app.readOnly && !selectedShape.props.isLocked) {
        switch (info.type) {
          case "shape" /* Shape */: {
            this.tool.transition("editingShape", info);
            break;
          }
          case "selection" /* Selection */: {
            (_a3 = selectedShape.onResetBounds) == null ? void 0 : _a3.call(selectedShape, {
              zoom: this.app.viewport.camera.zoom
            });
            if (this.app.selectedShapesArray.length === 1) {
              this.tool.transition("editingShape", {
                type: "shape" /* Shape */,
                target: selectedShape
              });
            }
            break;
          }
        }
      } else {
        const asset = selectedShape.props.assetId ? this.app.assets[selectedShape.props.assetId] : void 0;
        selectedShape.onResetBounds({ asset, zoom: this.app.viewport.camera.zoom });
        this.tool.transition("idle");
      }
    });
  }
};
__publicField(HoveringSelectionHandleState, "id", "hoveringSelectionHandle");

// ../../packages/core/src/lib/tools/TLSelectTool/states/EditingShapeState.ts
var EditingShapeState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "editingShape", {});
    __publicField(this, "onEnter", (info) => {
      this.editingShape = info.shape;
      this.app.setEditingShape(info.shape);
    });
    __publicField(this, "onExit", () => {
      var _a3;
      if (this.editingShape && "text" in this.editingShape.props) {
        const newText = this.editingShape.props["text"].trim();
        if (newText === "" && this.editingShape.props.type === "text") {
          this.app.deleteShapes([this.editingShape]);
        } else {
          this.editingShape.onResetBounds();
          this.editingShape.update({
            text: newText
          });
        }
      }
      this.app.persist();
      this.app.setEditingShape();
      (_a3 = document.querySelector(".tl-canvas")) == null ? void 0 : _a3.focus();
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
    __publicField(this, "onPointerDown", (info) => {
      switch (info.type) {
        case "shape" /* Shape */: {
          if (info.shape === this.editingShape)
            return;
          this.tool.transition("idle", info);
          break;
        }
        case "selection" /* Selection */: {
          break;
        }
        case "handle" /* Handle */: {
          break;
        }
        case "canvas" /* Canvas */: {
          if (!info.order) {
            this.tool.transition("idle", info);
          }
          break;
        }
      }
    });
    __publicField(this, "onKeyDown", (info, e) => {
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
__publicField(EditingShapeState, "id", "editingShape");

// ../../packages/core/src/lib/tools/TLSelectTool/states/PointingMinimapState.ts
var PointingMinimapState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "minimapZoom", 1);
    __publicField(this, "minimapRect", {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0
    });
    __publicField(this, "getCameraPoint", (clientPoint) => {
      const minimapContainer = document.querySelector(".tl-preview-minimap svg");
      const minimapCamera = document.querySelector(
        ".tl-preview-minimap #minimap-camera-rect"
      );
      if (minimapContainer && minimapCamera) {
        const rect = minimapContainer.getBoundingClientRect();
        this.minimapRect.height = rect.height;
        this.minimapRect.width = rect.width;
        this.minimapRect.minX = rect.left;
        this.minimapRect.minY = rect.top;
        this.minimapRect.maxX = rect.right;
        this.minimapRect.maxY = rect.bottom;
        this.minimapZoom = +minimapContainer.dataset.commonBoundWidth / this.minimapRect.width;
        const cursorInSvg = Vec.sub(clientPoint, [this.minimapRect.minX, this.minimapRect.minY]);
        const minimapCameraRect = minimapCamera.getBoundingClientRect();
        const minimapCameraCenter = [
          minimapCameraRect.left + minimapCameraRect.width / 2,
          minimapCameraRect.top + minimapCameraRect.height / 2
        ];
        const delta = Vec.mul(Vec.sub(cursorInSvg, minimapCameraCenter), this.minimapZoom);
        return Vec.sub(this.app.viewport.camera.point, delta);
      }
      return;
    });
    __publicField(this, "onEnter", (info) => {
      const newCameraPoint = this.getCameraPoint([info.clientX, info.clientY]);
      if (newCameraPoint) {
        this.app.viewport.update({
          point: newCameraPoint
        });
      } else {
        this.tool.transition("idle");
      }
    });
    __publicField(this, "onPointerMove", (info, e) => {
      if ("clientX" in e) {
        const newCameraPoint = this.getCameraPoint([e.clientX, e.clientY]);
        if (newCameraPoint) {
          this.app.viewport.update({
            point: newCameraPoint
          });
        }
      }
    });
    __publicField(this, "onPointerUp", () => {
      this.tool.transition("idle");
    });
  }
};
__publicField(PointingMinimapState, "id", "pointingMinimap");

// ../../packages/core/src/lib/tools/TLSelectTool/TLSelectTool.tsx
var TLSelectTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField(this, "returnTo", "");
    __publicField(this, "onEnter", (info) => {
      this.returnTo = info == null ? void 0 : info.returnTo;
    });
  }
};
__publicField(TLSelectTool, "id", "select");
__publicField(TLSelectTool, "initial", "idle");
__publicField(TLSelectTool, "shortcut", "whiteboard/select");
__publicField(TLSelectTool, "states", [
  IdleState7,
  BrushingState,
  ContextMenuState,
  PointingCanvasState,
  PointingShapeState,
  PointingShapeBehindBoundsState,
  PointingSelectedShapeState,
  PointingBoundsBackgroundState,
  HoveringSelectionHandleState,
  PointingResizeHandleState,
  PointingRotateHandleState,
  PointingMinimapState,
  PointingHandleState,
  TranslatingHandleState,
  TranslatingState,
  ResizingState,
  RotatingState,
  RotatingState,
  PinchingState2,
  EditingShapeState
]);

// ../../packages/core/src/lib/tools/TLMoveTool/states/PanningState.tsx
var PanningState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "grabbing" /* Grabbing */);
    __publicField(this, "originalScreenPoint", []);
    __publicField(this, "originalCameraPoint", []);
    __publicField(this, "prevState", "idle");
    __publicField(this, "onEnter", (info) => {
      this.prevState = info == null ? void 0 : info.prevState;
      this.originalScreenPoint = this.app.inputs.currentScreenPoint;
      this.originalCameraPoint = this.app.viewport.camera.point;
    });
    __publicField(this, "onPointerMove", (_2, e) => {
      const delta = src_default.sub(this.originalScreenPoint, this.app.inputs.currentScreenPoint);
      this.app.viewport.update({
        point: src_default.sub(this.originalCameraPoint, src_default.div(delta, this.app.viewport.camera.zoom))
      });
    });
    __publicField(this, "onPointerUp", () => {
      var _a3;
      this.tool.transition((_a3 = this.prevState) != null ? _a3 : "idle");
    });
  }
};
__publicField(PanningState, "id", "panning");

// ../../packages/core/src/lib/tools/TLMoveTool/states/IdleState.tsx
var IdleState8 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onEnter", (info) => {
      if (this.parent.prevTool && info.exit) {
        this.app.setCurrentState(this.parent.prevTool);
        setTimeout(() => {
          this.app.cursors.reset();
          this.app.cursors.setCursor(this.parent.prevTool.cursor);
        });
      }
    });
    __publicField(this, "onPointerDown", (info, e) => {
      if (info.order)
        return;
      this.tool.transition("panning");
    });
  }
};
__publicField(IdleState8, "id", "idle");

// ../../packages/core/src/lib/tools/TLMoveTool/states/IdleHoldState.tsx
var IdleHoldState = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "onPointerDown", (info, e) => {
      if (info.order)
        return;
      this.tool.transition("panning", { prevState: "idleHold" });
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.tool.transition("pinching", { info, event });
    });
  }
};
__publicField(IdleHoldState, "id", "idleHold");

// ../../packages/core/src/lib/tools/TLMoveTool/states/PinchingState.ts
var PinchingState3 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "origin", [0, 0]);
    __publicField(this, "prevDelta", [0, 0]);
    __publicField(this, "onEnter", (info) => {
      this.prevDelta = info.info.delta;
      this.origin = info.info.point;
    });
    __publicField(this, "onPinch", (info) => {
      this.app.viewport.pinchZoom(info.point, info.delta, info.delta[2]);
    });
    __publicField(this, "onPinchEnd", () => {
      this.tool.transition("idle");
    });
  }
};
__publicField(PinchingState3, "id", "pinching");

// ../../packages/core/src/lib/tools/TLMoveTool/TLMoveTool.ts
var TLMoveTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "grab" /* Grab */);
    __publicField(this, "prevTool", null);
    __publicField(this, "onEnter", (info) => {
      this.prevTool = info == null ? void 0 : info.prevTool;
    });
    __publicField(this, "onKeyDown", (info, e) => {
      switch (e.key) {
        case "Escape": {
          this.app.transition("select");
          break;
        }
      }
    });
    __publicField(this, "onPinchStart", (info, event) => {
      this.transition("pinching", { info, event });
    });
  }
};
__publicField(TLMoveTool, "id", "move");
__publicField(TLMoveTool, "shortcut", "whiteboard/pan");
__publicField(TLMoveTool, "states", [IdleState8, IdleHoldState, PanningState, PinchingState3]);
__publicField(TLMoveTool, "initial", "idle");

// ../../packages/core/src/lib/TLPage/TLPage.ts
var TLPage = class {
  constructor(app, props = {}) {
    __publicField(this, "lastShapesNounces", null);
    __publicField(this, "app");
    __publicField(this, "id");
    __publicField(this, "name");
    __publicField(this, "shapes", []);
    __publicField(this, "bindings", {});
    __publicField(this, "nonce", 0);
    __publicField(this, "bringForward", (shapes2) => {
      this.bringToFront(shapes2);
      return this;
    });
    __publicField(this, "sendBackward", (shapes2) => {
      this.sendToBack(shapes2);
      return this;
    });
    __publicField(this, "bringToFront", (shapes2) => {
      const shapesToMove = this.parseShapesArg(shapes2);
      let others = this.shapes.filter((shape) => !shapesToMove.includes(shape));
      this.shapes = others.concat(shapesToMove);
      const info = { op: "bringToFront", shapes: shapesToMove, before: others[others.length - 1] };
      this.app.persist(info);
      this.persistInfo = info;
      return this;
    });
    __publicField(this, "sendToBack", (shapes2) => {
      const shapesToMove = this.parseShapesArg(shapes2);
      let others = this.shapes.filter((shape) => !shapesToMove.includes(shape));
      this.shapes = shapesToMove.concat(others);
      this.app.persist({ op: "sendToBack", shapes: shapesToMove, next: others[0] });
      return this;
    });
    __publicField(this, "flip", (shapes2, direction) => {
      const shapesToMove = this.parseShapesArg(shapes2);
      const commonBounds = BoundsUtils.getCommonBounds(shapesToMove.map((shape) => shape.bounds));
      shapesToMove.forEach((shape) => {
        var _a3;
        const relativeBounds = BoundsUtils.getRelativeTransformedBoundingBox(
          commonBounds,
          commonBounds,
          shape.bounds,
          direction === "horizontal",
          direction === "vertical"
        );
        if (shape.serialized) {
          shape.onResize(shape.serialized, {
            bounds: relativeBounds,
            center: BoundsUtils.getBoundsCenter(relativeBounds),
            rotation: (_a3 = shape.props.rotation) != null ? _a3 : 0 * -1,
            type: "top_left_corner" /* TopLeft */,
            scale: shape.canFlip && shape.props.scale ? direction === "horizontal" ? [-shape.props.scale[0], 1] : [1, -shape.props.scale[1]] : [1, 1],
            clip: false,
            transformOrigin: [0.5, 0.5]
          });
        }
      });
      this.app.persist();
      return this;
    });
    __publicField(this, "getShapeById", (id3) => {
      const shape = this.shapes.find((shape2) => shape2.id === id3);
      return shape;
    });
    __publicField(this, "cleanup", (changedShapeIds) => {
      const bindingsToUpdate = getRelatedBindings(this.bindings, changedShapeIds);
      const visitedShapes = /* @__PURE__ */ new Set();
      let shapeChanged = false;
      let bindingChanged = false;
      const newBindings = deepCopy(this.bindings);
      bindingsToUpdate.forEach((binding) => {
        var _a3;
        if (!this.bindings[binding.id]) {
          return;
        }
        const toShape = this.getShapeById(binding.toId);
        const fromShape = this.getShapeById(binding.fromId);
        if (!(toShape && fromShape)) {
          delete newBindings[binding.id];
          bindingChanged = true;
          return;
        }
        if (visitedShapes.has(fromShape.id)) {
          return;
        }
        const fromDelta = this.updateArrowBindings(fromShape);
        visitedShapes.add(fromShape.id);
        if (fromDelta) {
          const nextShape = __spreadValues(__spreadValues({}, fromShape.props), fromDelta);
          shapeChanged = true;
          (_a3 = this.getShapeById(nextShape.id)) == null ? void 0 : _a3.update(nextShape, false, (0, import_fast_deep_equal.default)(fromDelta == null ? void 0 : fromDelta.handles, fromShape == null ? void 0 : fromShape.props.handles));
        }
      });
      Object.keys(newBindings).forEach((id3) => {
        const binding = this.bindings[id3];
        const relatedShapes = this.shapes.filter(
          (shape) => shape.id === binding.fromId || shape.id === binding.toId
        );
        if (relatedShapes.length === 0) {
          delete newBindings[id3];
          bindingChanged = true;
        }
      });
      if (bindingChanged) {
        this.update({
          bindings: newBindings
        });
      }
    });
    __publicField(this, "updateArrowBindings", (lineShape) => {
      var _a3, _b, _c;
      const result = {
        start: deepCopy(lineShape.props.handles.start),
        end: deepCopy(lineShape.props.handles.end)
      };
      let start = {
        isBound: false,
        handle: lineShape.props.handles.start,
        point: src_default.add(lineShape.props.handles.start.point, lineShape.props.point)
      };
      let end = {
        isBound: false,
        handle: lineShape.props.handles.end,
        point: src_default.add(lineShape.props.handles.end.point, lineShape.props.point)
      };
      if (lineShape.props.handles.start.bindingId) {
        const hasDecoration = ((_a3 = lineShape.props.decorations) == null ? void 0 : _a3.start) !== void 0;
        const handle = lineShape.props.handles.start;
        const binding = this.bindings[lineShape.props.handles.start.bindingId];
        const target = this.getShapeById(binding == null ? void 0 : binding.toId);
        if (target) {
          const bounds = target.getBounds();
          const expandedBounds = target.getExpandedBounds();
          const intersectBounds = BoundsUtils.expandBounds(
            bounds,
            hasDecoration ? binding.distance : 1
          );
          const { minX, minY, width, height } = expandedBounds;
          const anchorPoint = src_default.add(
            [minX, minY],
            src_default.mulV(
              [width, height],
              src_default.rotWith(binding.point, [0.5, 0.5], target.props.rotation || 0)
            )
          );
          start = {
            isBound: true,
            hasDecoration,
            binding,
            handle,
            point: anchorPoint,
            target,
            bounds,
            expandedBounds,
            intersectBounds,
            center: target.getCenter()
          };
        }
      }
      if (lineShape.props.handles.end.bindingId) {
        const hasDecoration = ((_b = lineShape.props.decorations) == null ? void 0 : _b.end) !== void 0;
        const handle = lineShape.props.handles.end;
        const binding = this.bindings[lineShape.props.handles.end.bindingId];
        const target = this.getShapeById(binding == null ? void 0 : binding.toId);
        if (target) {
          const bounds = target.getBounds();
          const expandedBounds = target.getExpandedBounds();
          const intersectBounds = hasDecoration ? BoundsUtils.expandBounds(bounds, binding.distance) : bounds;
          const { minX, minY, width, height } = expandedBounds;
          const anchorPoint = src_default.add(
            [minX, minY],
            src_default.mulV(
              [width, height],
              src_default.rotWith(binding.point, [0.5, 0.5], target.props.rotation || 0)
            )
          );
          end = {
            isBound: true,
            hasDecoration,
            binding,
            handle,
            point: anchorPoint,
            target,
            bounds,
            expandedBounds,
            intersectBounds,
            center: target.getCenter()
          };
        }
      }
      for (const ID of ["end", "start"]) {
        const A3 = ID === "start" ? start : end;
        const B3 = ID === "start" ? end : start;
        if (A3.isBound) {
          if (!A3.binding.distance) {
            result[ID].point = src_default.sub(A3.point, lineShape.props.point);
          } else {
            const direction = src_default.uni(src_default.sub(A3.point, B3.point));
            switch (A3.target.type) {
              default: {
                const hits = intersectRayBounds(
                  B3.point,
                  direction,
                  A3.intersectBounds,
                  A3.target.props.rotation
                ).filter((int) => int.didIntersect).map((int) => int.points[0]).sort((a3, b3) => src_default.dist(a3, B3.point) - src_default.dist(b3, B3.point));
                if (!hits[0])
                  continue;
                let bHit = void 0;
                if (B3.isBound) {
                  const bHits = intersectRayBounds(
                    B3.point,
                    direction,
                    B3.intersectBounds,
                    B3.target.props.rotation
                  ).filter((int) => int.didIntersect).map((int) => int.points[0]).sort((a3, b3) => src_default.dist(a3, B3.point) - src_default.dist(b3, B3.point));
                  bHit = bHits[0];
                }
                if (B3.isBound && (hits.length < 2 || bHit && hits[0] && Math.ceil(src_default.dist(hits[0], bHit)) < BINDING_DISTANCE * 2.5 || BoundsUtils.boundsContain(A3.expandedBounds, B3.expandedBounds) || BoundsUtils.boundsCollide(A3.expandedBounds, B3.expandedBounds))) {
                  const shortArrowDirection = src_default.uni(src_default.sub(B3.point, A3.point));
                  const shortArrowHits = intersectRayBounds(
                    A3.point,
                    shortArrowDirection,
                    A3.bounds,
                    A3.target.props.rotation
                  ).filter((int) => int.didIntersect).map((int) => int.points[0]);
                  if (!shortArrowHits[0])
                    continue;
                  result[ID].point = src_default.toFixed(src_default.sub(shortArrowHits[0], lineShape.props.point));
                  result[ID === "start" ? "end" : "start"].point = src_default.toFixed(
                    src_default.add(
                      src_default.sub(shortArrowHits[0], lineShape.props.point),
                      src_default.mul(
                        shortArrowDirection,
                        Math.min(
                          src_default.dist(shortArrowHits[0], B3.point),
                          BINDING_DISTANCE * 2.5 * (BoundsUtils.boundsContain(B3.bounds, A3.intersectBounds) ? -1 : 1)
                        )
                      )
                    )
                  );
                } else if (!B3.isBound && (hits[0] && src_default.dist(hits[0], B3.point) < BINDING_DISTANCE * 2.5 || PointUtils.pointInBounds(B3.point, A3.intersectBounds))) {
                  const shortArrowDirection = src_default.uni(src_default.sub(A3.center, B3.point));
                  return (_c = lineShape.getHandlesChange) == null ? void 0 : _c.call(lineShape, lineShape.props, {
                    [ID]: __spreadProps(__spreadValues({}, lineShape.props.handles[ID]), {
                      point: src_default.toFixed(
                        src_default.add(
                          src_default.sub(B3.point, lineShape.props.point),
                          src_default.mul(shortArrowDirection, BINDING_DISTANCE * 2.5)
                        )
                      )
                    })
                  });
                } else if (hits[0]) {
                  result[ID].point = src_default.toFixed(src_default.sub(hits[0], lineShape.props.point));
                }
              }
            }
          }
        }
      }
      return lineShape.getHandlesChange(lineShape.props, result);
    });
    const { id: id3, name, shapes: shapes2 = [], bindings = {}, nonce } = props;
    this.id = id3;
    this.name = name;
    this.bindings = Object.assign({}, bindings);
    this.app = app;
    this.nonce = nonce || 0;
    this.persistInfo = null;
    this.addShapes(...shapes2);
    makeObservable(this);
    autorun(() => {
      const newShapesNouncesMap = this.shapes.length > 0 ? Object.fromEntries(this.shapes.map((shape) => [shape.id, shape.nonce])) : null;
      if (this.lastShapesNounces && newShapesNouncesMap) {
        const lastShapesNounces = this.lastShapesNounces;
        const allIds = /* @__PURE__ */ new Set([
          ...Object.keys(newShapesNouncesMap),
          ...Object.keys(lastShapesNounces)
        ]);
        const changedShapeIds = [...allIds].filter((s2) => {
          return lastShapesNounces[s2] !== newShapesNouncesMap[s2];
        });
        requestAnimationFrame(() => {
          this.cleanup(changedShapeIds);
        });
      }
      if (newShapesNouncesMap) {
        this.lastShapesNounces = newShapesNouncesMap;
      }
    });
  }
  get serialized() {
    return {
      id: this.id,
      name: this.name,
      shapes: this.shapes.map((shape) => shape.serialized).filter((s2) => !!s2).map((s2) => toJS(s2)),
      bindings: deepCopy(this.bindings),
      nonce: this.nonce
    };
  }
  get shapesById() {
    return Object.fromEntries(this.shapes.map((shape) => [shape.id, shape]));
  }
  update(props) {
    Object.assign(this, props);
    return this;
  }
  updateBindings(bindings) {
    Object.assign(this.bindings, bindings);
    return this;
  }
  updateShapesIndex(shapesIndex) {
    this.shapes.sort((a3, b3) => shapesIndex.indexOf(a3.id) - shapesIndex.indexOf(b3.id));
    return this;
  }
  addShapes(...shapes2) {
    if (shapes2.length === 0)
      return;
    const shapeInstances = "getBounds" in shapes2[0] ? shapes2 : shapes2.map((shape) => {
      const ShapeClass = this.app.getShapeClass(shape.type);
      return new ShapeClass(shape);
    });
    this.shapes.push(...shapeInstances);
    return shapeInstances;
  }
  parseShapesArg(shapes2) {
    if (typeof shapes2[0] === "string") {
      return this.shapes.filter((shape) => shapes2.includes(shape.id));
    }
    return shapes2;
  }
  removeShapes(...shapes2) {
    const shapeInstances = this.parseShapesArg(shapes2);
    this.shapes = this.shapes.filter((shape) => !shapeInstances.includes(shape));
    return shapeInstances;
  }
  getBindableShapes() {
    return this.shapes.filter((shape) => shape.canBind).sort((a3, b3) => b3.nonce - a3.nonce).map((s2) => s2.id);
  }
};
__decorateClass([
  observable
], TLPage.prototype, "id", 2);
__decorateClass([
  observable
], TLPage.prototype, "name", 2);
__decorateClass([
  observable
], TLPage.prototype, "shapes", 2);
__decorateClass([
  observable
], TLPage.prototype, "bindings", 2);
__decorateClass([
  computed
], TLPage.prototype, "serialized", 1);
__decorateClass([
  computed
], TLPage.prototype, "shapesById", 1);
__decorateClass([
  observable
], TLPage.prototype, "nonce", 2);
__decorateClass([
  action
], TLPage.prototype, "update", 1);
__decorateClass([
  action
], TLPage.prototype, "updateBindings", 1);
__decorateClass([
  action
], TLPage.prototype, "updateShapesIndex", 1);
__decorateClass([
  action
], TLPage.prototype, "addShapes", 1);
__decorateClass([
  action
], TLPage.prototype, "removeShapes", 1);
__decorateClass([
  action
], TLPage.prototype, "bringForward", 2);
__decorateClass([
  action
], TLPage.prototype, "sendBackward", 2);
__decorateClass([
  action
], TLPage.prototype, "bringToFront", 2);
__decorateClass([
  action
], TLPage.prototype, "sendToBack", 2);
__decorateClass([
  action
], TLPage.prototype, "cleanup", 2);
function getRelatedBindings(bindings, ids) {
  const changedShapeIds = new Set(ids);
  const bindingsArr = Object.values(bindings);
  const bindingsToUpdate = new Set(
    bindingsArr.filter(
      (binding) => changedShapeIds.has(binding.toId) || changedShapeIds.has(binding.fromId)
    )
  );
  let prevSize = bindingsToUpdate.size;
  let delta = -1;
  while (delta !== 0) {
    bindingsToUpdate.forEach((binding) => {
      const fromId = binding.fromId;
      for (const otherBinding of bindingsArr) {
        if (otherBinding.fromId === fromId) {
          bindingsToUpdate.add(otherBinding);
        }
        if (otherBinding.toId === fromId) {
          bindingsToUpdate.add(otherBinding);
        }
      }
    });
    delta = bindingsToUpdate.size - prevSize;
    prevSize = bindingsToUpdate.size;
  }
  return Array.from(bindingsToUpdate.values());
}

// ../../packages/core/src/lib/TLInputs.ts
var TLInputs = class {
  constructor() {
    __publicField(this, "shiftKey", false);
    __publicField(this, "ctrlKey", false);
    __publicField(this, "modKey", false);
    __publicField(this, "altKey", false);
    __publicField(this, "spaceKey", false);
    __publicField(this, "isPinching", false);
    __publicField(this, "currentScreenPoint", [0, 0]);
    __publicField(this, "currentPoint", [0, 0]);
    __publicField(this, "previousScreenPoint", [0, 0]);
    __publicField(this, "previousPoint", [0, 0]);
    __publicField(this, "originScreenPoint", [0, 0]);
    __publicField(this, "originPoint", [0, 0]);
    __publicField(this, "pointerIds", /* @__PURE__ */ new Set());
    __publicField(this, "state", "idle");
    __publicField(this, "containerOffset", [0, 0]);
    __publicField(this, "onPointerDown", (pagePoint, event) => {
      this.pointerIds.add(event.pointerId);
      this.updateModifiers(event);
      this.originScreenPoint = this.currentScreenPoint;
      this.originPoint = pagePoint;
      this.state = "pointing";
    });
    __publicField(this, "onPointerMove", (pagePoint, event) => {
      if (this.state === "pinching")
        return;
      if (this.state === "panning") {
        this.state = "idle";
      }
      this.updateModifiers(event);
      this.previousPoint = this.currentPoint;
      this.currentPoint = pagePoint;
    });
    __publicField(this, "onPointerUp", (pagePoint, event) => {
      this.pointerIds.clear();
      this.updateModifiers(event);
      this.state = "idle";
    });
    __publicField(this, "onKeyDown", (event) => {
      this.updateModifiers(event);
      switch (event.key) {
        case " ": {
          this.spaceKey = true;
          break;
        }
      }
    });
    __publicField(this, "onKeyUp", (event) => {
      this.updateModifiers(event);
      switch (event.key) {
        case " ": {
          this.spaceKey = false;
          break;
        }
      }
    });
    __publicField(this, "onPinchStart", (pagePoint, event) => {
      this.updateModifiers(event);
      this.state = "pinching";
    });
    __publicField(this, "onPinch", (pagePoint, event) => {
      if (this.state !== "pinching")
        return;
      this.updateModifiers(event);
    });
    __publicField(this, "onPinchEnd", (pagePoint, event) => {
      if (this.state !== "pinching")
        return;
      this.updateModifiers(event);
      this.state = "idle";
    });
    makeObservable(this);
  }
  updateContainerOffset(containerOffset) {
    Object.assign(this.containerOffset, containerOffset);
  }
  updateModifiers(event) {
    if (!event.isPrimary) {
      return;
    }
    if ("clientX" in event) {
      this.previousScreenPoint = this.currentScreenPoint;
      this.currentScreenPoint = src_default.sub([event.clientX, event.clientY], this.containerOffset);
    }
    if ("shiftKey" in event) {
      this.shiftKey = event.shiftKey;
      this.ctrlKey = event.ctrlKey;
      this.altKey = event.altKey;
      this.modKey = modKey(event);
    }
  }
};
__decorateClass([
  observable
], TLInputs.prototype, "shiftKey", 2);
__decorateClass([
  observable
], TLInputs.prototype, "ctrlKey", 2);
__decorateClass([
  observable
], TLInputs.prototype, "modKey", 2);
__decorateClass([
  observable
], TLInputs.prototype, "altKey", 2);
__decorateClass([
  observable
], TLInputs.prototype, "spaceKey", 2);
__decorateClass([
  observable
], TLInputs.prototype, "isPinching", 2);
__decorateClass([
  observable
], TLInputs.prototype, "currentScreenPoint", 2);
__decorateClass([
  observable
], TLInputs.prototype, "currentPoint", 2);
__decorateClass([
  observable
], TLInputs.prototype, "previousScreenPoint", 2);
__decorateClass([
  observable
], TLInputs.prototype, "previousPoint", 2);
__decorateClass([
  observable
], TLInputs.prototype, "originScreenPoint", 2);
__decorateClass([
  observable
], TLInputs.prototype, "originPoint", 2);
__decorateClass([
  observable
], TLInputs.prototype, "state", 2);
__decorateClass([
  observable
], TLInputs.prototype, "containerOffset", 2);
__decorateClass([
  action
], TLInputs.prototype, "updateContainerOffset", 1);
__decorateClass([
  action
], TLInputs.prototype, "updateModifiers", 1);
__decorateClass([
  action
], TLInputs.prototype, "onPointerDown", 2);
__decorateClass([
  action
], TLInputs.prototype, "onPointerMove", 2);
__decorateClass([
  action
], TLInputs.prototype, "onPointerUp", 2);
__decorateClass([
  action
], TLInputs.prototype, "onKeyDown", 2);
__decorateClass([
  action
], TLInputs.prototype, "onKeyUp", 2);
__decorateClass([
  action
], TLInputs.prototype, "onPinchStart", 2);
__decorateClass([
  action
], TLInputs.prototype, "onPinch", 2);
__decorateClass([
  action
], TLInputs.prototype, "onPinchEnd", 2);

// ../../packages/core/src/lib/TLViewport.ts
var ease = (x2) => {
  return -(Math.cos(Math.PI * x2) - 1) / 2;
};
var elapsedProgress = (t, duration = 100) => {
  return ease(Vec.clamp(t / duration, 0, 1));
};
var _TLViewport = class {
  constructor() {
    __publicField(this, "bounds", {
      minX: 0,
      minY: 0,
      maxX: 1080,
      maxY: 720,
      width: 1080,
      height: 720
    });
    __publicField(this, "camera", {
      point: [0, 0],
      zoom: 1
    });
    __publicField(this, "updateBounds", (bounds) => {
      this.bounds = bounds;
      return this;
    });
    __publicField(this, "panCamera", (delta) => {
      return this.update({
        point: Vec.sub(this.camera.point, Vec.div(delta, this.camera.zoom))
      });
    });
    __publicField(this, "panToPointWhenNearBounds", (point) => {
      const threshold = Vec.div([_TLViewport.panThreshold, _TLViewport.panThreshold], this.camera.zoom);
      const deltaMax = Vec.sub([this.currentView.maxX, this.currentView.maxY], Vec.add(point, threshold));
      const deltaMin = Vec.sub([this.currentView.minX, this.currentView.minY], Vec.sub(point, threshold));
      const deltaX = deltaMax[0] < 0 ? deltaMax[0] : deltaMin[0] > 0 ? deltaMin[0] : 0;
      const deltaY = deltaMax[1] < 0 ? deltaMax[1] : deltaMin[1] > 0 ? deltaMin[1] : 0;
      this.panCamera(Vec.mul([deltaX, deltaY], -_TLViewport.panMultiplier * this.camera.zoom));
    });
    __publicField(this, "update", ({ point, zoom }) => {
      if (point !== void 0 && !isNaN(point[0]) && !isNaN(point[1]))
        this.camera.point = point;
      if (zoom !== void 0 && !isNaN(zoom))
        this.camera.zoom = Math.min(4, Math.max(0.1, zoom));
      return this;
    });
    __publicField(this, "getPagePoint", (point) => {
      const { camera, bounds } = this;
      return Vec.sub(Vec.div(Vec.sub(point, [bounds.minX, bounds.minY]), camera.zoom), camera.point);
    });
    __publicField(this, "getScreenPoint", (point) => {
      const { camera } = this;
      return Vec.mul(Vec.add(point, camera.point), camera.zoom);
    });
    __publicField(this, "onZoom", (point, zoom, animate = false) => {
      return this.pinchZoom(point, [0, 0], zoom, animate);
    });
    __publicField(this, "pinchZoom", (point, delta, zoom, animate = false) => {
      const { camera } = this;
      const nextPoint = Vec.sub(camera.point, Vec.div(delta, camera.zoom));
      zoom = Vec.clamp(zoom, _TLViewport.minZoom, _TLViewport.maxZoom);
      const p0 = Vec.div(point, camera.zoom);
      const p1 = Vec.div(point, zoom);
      const newPoint = Vec.toFixed(Vec.add(nextPoint, Vec.sub(p1, p0)));
      if (animate) {
        this.animateCamera({ point: newPoint, zoom });
      } else {
        this.update({ point: newPoint, zoom });
      }
      return this;
    });
    __publicField(this, "setZoom", (zoom, animate = false) => {
      const { bounds } = this;
      const center = [bounds.width / 2, bounds.height / 2];
      this.onZoom(center, zoom, animate);
    });
    __publicField(this, "zoomIn", () => {
      const { camera } = this;
      this.setZoom(camera.zoom / ZOOM_UPDATE_FACTOR, true);
    });
    __publicField(this, "zoomOut", () => {
      const { camera } = this;
      this.setZoom(camera.zoom * ZOOM_UPDATE_FACTOR, true);
    });
    __publicField(this, "resetZoom", () => {
      this.setZoom(1, true);
      return this;
    });
    __publicField(this, "animateCamera", ({ point, zoom }) => {
      return this.animateToViewport({
        minX: -point[0],
        minY: -point[1],
        maxX: this.bounds.width / zoom - point[0],
        maxY: this.bounds.height / zoom - point[1],
        width: this.bounds.width / zoom,
        height: this.bounds.height / zoom
      });
    });
    __publicField(this, "animateToViewport", (view) => {
      const startTime = performance.now();
      const oldView = __spreadValues({}, this.currentView);
      const step = () => {
        const elapsed = performance.now() - startTime;
        const progress = elapsedProgress(elapsed);
        const next = {
          minX: oldView.minX + (view.minX - oldView.minX) * progress,
          minY: oldView.minY + (view.minY - oldView.minY) * progress,
          maxX: oldView.maxX + (view.maxX - oldView.maxX) * progress,
          maxY: oldView.maxY + (view.maxY - oldView.maxY) * progress
        };
        const point = [-next.minX, -next.minY];
        const zoom = this.bounds.width / (next.maxX - next.minX);
        this.update({ point, zoom });
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      step();
    });
    __publicField(this, "zoomToBounds", ({ width, height, minX, minY }) => {
      const { bounds, camera } = this;
      let zoom = Math.min(
        (bounds.width - FIT_TO_SCREEN_PADDING) / width,
        (bounds.height - FIT_TO_SCREEN_PADDING) / height
      );
      zoom = Math.min(
        1,
        Math.max(
          _TLViewport.minZoom,
          camera.zoom === zoom || camera.zoom < 1 ? Math.min(1, zoom) : zoom
        )
      );
      const delta = [
        (bounds.width - width * zoom) / 2 / zoom,
        (bounds.height - height * zoom) / 2 / zoom
      ];
      const point = Vec.add([-minX, -minY], delta);
      this.animateCamera({ point, zoom });
    });
    makeObservable(this);
  }
  get currentView() {
    const {
      bounds,
      camera: { point, zoom }
    } = this;
    const w2 = bounds.width / zoom;
    const h2 = bounds.height / zoom;
    return {
      minX: -point[0],
      minY: -point[1],
      maxX: w2 - point[0],
      maxY: h2 - point[1],
      width: w2,
      height: h2
    };
  }
};
var TLViewport = _TLViewport;
__publicField(TLViewport, "minZoom", 0.1);
__publicField(TLViewport, "maxZoom", 4);
__publicField(TLViewport, "panMultiplier", 0.05);
__publicField(TLViewport, "panThreshold", 100);
__decorateClass([
  observable
], TLViewport.prototype, "bounds", 2);
__decorateClass([
  observable
], TLViewport.prototype, "camera", 2);
__decorateClass([
  action
], TLViewport.prototype, "updateBounds", 2);
__decorateClass([
  action
], TLViewport.prototype, "update", 2);
__decorateClass([
  computed
], TLViewport.prototype, "currentView", 1);

// ../../packages/core/src/lib/TLApi/TLApi.ts
var TLApi = class {
  constructor(app) {
    __publicField(this, "app");
    __publicField(this, "editShape", (shape) => {
      if (!(shape == null ? void 0 : shape.props.isLocked))
        this.app.transition("select").selectedTool.transition("editingShape", { shape });
      return this;
    });
    __publicField(this, "hoverShape", (shape) => {
      this.app.setHoveredShape(shape);
      return this;
    });
    __publicField(this, "createShapes", (...shapes2) => {
      this.app.createShapes(shapes2);
      return this;
    });
    __publicField(this, "updateShapes", (...shapes2) => {
      this.app.updateShapes(shapes2);
      return this;
    });
    __publicField(this, "deleteShapes", (...shapes2) => {
      this.app.deleteShapes(shapes2.length ? shapes2 : this.app.selectedShapesArray);
      return this;
    });
    __publicField(this, "selectShapes", (...shapes2) => {
      this.app.setSelectedShapes(shapes2);
      return this;
    });
    __publicField(this, "deselectShapes", (...shapes2) => {
      const ids = typeof shapes2[0] === "string" ? shapes2 : shapes2.map((shape) => shape.id);
      this.app.setSelectedShapes(
        this.app.selectedShapesArray.filter((shape) => !ids.includes(shape.id))
      );
      return this;
    });
    __publicField(this, "flipHorizontal", (...shapes2) => {
      this.app.flipHorizontal(shapes2);
      return this;
    });
    __publicField(this, "flipVertical", (...shapes2) => {
      this.app.flipVertical(shapes2);
      return this;
    });
    __publicField(this, "selectAll", () => {
      this.app.setSelectedShapes(
        this.app.currentPage.shapes.filter((s2) => !this.app.shapesInGroups().includes(s2))
      );
      return this;
    });
    __publicField(this, "deselectAll", () => {
      this.app.setSelectedShapes([]);
      return this;
    });
    __publicField(this, "zoomIn", () => {
      this.app.viewport.zoomIn();
      return this;
    });
    __publicField(this, "zoomOut", () => {
      this.app.viewport.zoomOut();
      return this;
    });
    __publicField(this, "resetZoom", () => {
      this.app.viewport.resetZoom();
      return this;
    });
    __publicField(this, "zoomToFit", () => {
      const { shapes: shapes2 } = this.app.currentPage;
      if (shapes2.length === 0)
        return this;
      const commonBounds = BoundsUtils.getCommonBounds(shapes2.map((shape) => shape.bounds));
      this.app.viewport.zoomToBounds(commonBounds);
      return this;
    });
    __publicField(this, "cameraToCenter", () => {
      const { shapes: shapes2 } = this.app.currentPage;
      if (shapes2.length === 0)
        return this;
      const commonBounds = BoundsUtils.getCommonBounds(shapes2.map((shape) => shape.bounds));
      this.app.viewport.update({
        point: src_default.add(src_default.neg(BoundsUtils.getBoundsCenter(commonBounds)), [
          this.app.viewport.currentView.width / 2,
          this.app.viewport.currentView.height / 2
        ])
      });
      return this;
    });
    __publicField(this, "zoomToSelection", () => {
      const { selectionBounds } = this.app;
      if (!selectionBounds)
        return this;
      this.app.viewport.zoomToBounds(selectionBounds);
      return this;
    });
    __publicField(this, "resetZoomToCursor", () => {
      const viewport = this.app.viewport;
      viewport.animateCamera({
        zoom: 1,
        point: src_default.sub(this.app.inputs.originScreenPoint, this.app.inputs.originPoint)
      });
      return this;
    });
    __publicField(this, "toggleGrid", () => {
      const { settings } = this.app;
      settings.update({ showGrid: !settings.showGrid });
      return this;
    });
    __publicField(this, "toggleSnapToGrid", () => {
      const { settings } = this.app;
      settings.update({ snapToGrid: !settings.snapToGrid });
      return this;
    });
    __publicField(this, "togglePenMode", () => {
      const { settings } = this.app;
      settings.update({ penMode: !settings.penMode });
      return this;
    });
    __publicField(this, "setColor", (color) => {
      const { settings } = this.app;
      settings.update({ color });
      this.app.selectedShapesArray.forEach((s2) => {
        if (!s2.props.isLocked)
          s2.update({ fill: color, stroke: color });
      });
      this.app.persist();
      return this;
    });
    __publicField(this, "setScaleLevel", (scaleLevel) => {
      const { settings } = this.app;
      settings.update({ scaleLevel });
      this.app.selectedShapes.forEach((shape) => {
        if (!shape.props.isLocked)
          shape.setScaleLevel(scaleLevel);
      });
      this.app.persist();
      return this;
    });
    __publicField(this, "undo", () => {
      this.app.undo();
      return this;
    });
    __publicField(this, "redo", () => {
      this.app.redo();
      return this;
    });
    __publicField(this, "persist", () => {
      this.app.persist();
      return this;
    });
    __publicField(this, "createNewLineBinding", (source, target) => {
      return this.app.createNewLineBinding(source, target);
    });
    __publicField(this, "clone", (direction) => {
      if (this.app.readOnly || this.app.selectedShapesArray.length !== 1 || !Object.values(Geometry).some((geometry) => geometry === this.app.selectedShapesArray[0].type))
        return;
      const shape = this.app.allSelectedShapesArray[0];
      const ShapeClass = this.app.getShapeClass(shape.type);
      const { minX, minY, maxX, maxY, width, height } = shape.bounds;
      const spacing = 100;
      let point = [0, 0];
      switch (direction) {
        case "down" /* Down */: {
          point = [minX, maxY + spacing];
          break;
        }
        case "up" /* Up */: {
          point = [minX, minY - spacing - height];
          break;
        }
        case "left" /* Left */: {
          point = [minX - spacing - width, minY];
          break;
        }
        case "right" /* Right */: {
          point = [maxX + spacing, minY];
          break;
        }
      }
      const clone = new ShapeClass(__spreadProps(__spreadValues({}, shape.serialized), {
        id: uniqueId(),
        nonce: Date.now(),
        refs: [],
        label: "",
        point
      }));
      this.app.history.pause();
      this.app.currentPage.addShapes(clone);
      this.app.createNewLineBinding(shape, clone);
      this.app.history.resume();
      this.app.persist();
      setTimeout(() => this.editShape(clone));
    });
    __publicField(this, "cloneShapes", ({
      shapes: shapes2,
      assets,
      bindings,
      point = [0, 0]
    }) => {
      const commonBounds = BoundsUtils.getCommonBounds(
        shapes2.filter((s2) => s2.type !== "group").map((shape) => {
          var _a3, _b, _c, _d, _e2, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
          return {
            minX: (_b = (_a3 = shape.point) == null ? void 0 : _a3[0]) != null ? _b : point[0],
            minY: (_d = (_c = shape.point) == null ? void 0 : _c[1]) != null ? _d : point[1],
            width: (_f = (_e2 = shape.size) == null ? void 0 : _e2[0]) != null ? _f : 4,
            height: (_h = (_g = shape.size) == null ? void 0 : _g[1]) != null ? _h : 4,
            maxX: ((_j = (_i = shape.point) == null ? void 0 : _i[0]) != null ? _j : point[0]) + ((_l = (_k = shape.size) == null ? void 0 : _k[0]) != null ? _l : 4),
            maxY: ((_n = (_m = shape.point) == null ? void 0 : _m[1]) != null ? _n : point[1]) + ((_p = (_o = shape.size) == null ? void 0 : _o[1]) != null ? _p : 4)
          };
        })
      );
      const clonedShapes = shapes2.map((shape) => {
        return __spreadProps(__spreadValues({}, shape), {
          id: uniqueId(),
          point: [
            point[0] + shape.point[0] - commonBounds.minX,
            point[1] + shape.point[1] - commonBounds.minY
          ]
        });
      });
      clonedShapes.forEach((s2) => {
        var _a3;
        if (s2.children && ((_a3 = s2.children) == null ? void 0 : _a3.length) > 0) {
          s2.children = s2.children.map((oldId) => {
            var _a4;
            return (_a4 = clonedShapes[shapes2.findIndex((s3) => s3.id === oldId)]) == null ? void 0 : _a4.id;
          }).filter(isNonNullable);
        }
      });
      const clonedBindings = [];
      clonedShapes.flatMap((s2) => {
        var _a3;
        return Object.values((_a3 = s2.handles) != null ? _a3 : {});
      }).forEach((handle) => {
        if (!handle.bindingId) {
          return;
        }
        const binding = bindings[handle.bindingId];
        if (binding) {
          const oldFromIdx = shapes2.findIndex((s2) => s2.id === binding.fromId);
          const oldToIdx = shapes2.findIndex((s2) => s2.id === binding.toId);
          if (binding && oldFromIdx !== -1 && oldToIdx !== -1) {
            const newBinding = __spreadProps(__spreadValues({}, binding), {
              id: uniqueId(),
              fromId: clonedShapes[oldFromIdx].id,
              toId: clonedShapes[oldToIdx].id
            });
            clonedBindings.push(newBinding);
            handle.bindingId = newBinding.id;
          } else {
            handle.bindingId = void 0;
          }
        } else {
          console.warn("binding not found", handle.bindingId);
        }
      });
      const clonedAssets = assets.filter((asset) => {
        return clonedShapes.some((shape) => shape.assetId === asset.id);
      });
      return {
        shapes: clonedShapes,
        assets: clonedAssets,
        bindings: clonedBindings
      };
    });
    __publicField(this, "getClonedShapesFromTldrString", (text, point) => {
      const safeParseJson = (json) => {
        try {
          return JSON.parse(json);
        } catch (e) {
          return null;
        }
      };
      const getWhiteboardsTldrFromText = (text2) => {
        var _a3;
        const innerText = (_a3 = text2.match(/<whiteboard-tldr>(.*)<\/whiteboard-tldr>/)) == null ? void 0 : _a3[1];
        if (innerText) {
          return safeParseJson(innerText);
        }
      };
      try {
        const data = getWhiteboardsTldrFromText(text);
        if (!data)
          return null;
        const { shapes: shapes2, bindings, assets } = data;
        return this.cloneShapes({
          shapes: shapes2,
          bindings,
          assets,
          point
        });
      } catch (err) {
        console.log(err);
      }
      return null;
    });
    __publicField(this, "cloneShapesIntoCurrentPage", (opts) => {
      const data = this.cloneShapes(opts);
      if (data) {
        this.addClonedShapes(data);
      }
      return this;
    });
    __publicField(this, "addClonedShapes", (opts) => {
      const { shapes: shapes2, assets, bindings } = opts;
      if (assets.length > 0) {
        this.app.createAssets(assets);
      }
      if (shapes2.length > 0) {
        this.app.createShapes(shapes2);
      }
      this.app.currentPage.updateBindings(Object.fromEntries(bindings.map((b3) => [b3.id, b3])));
      this.app.selectedTool.transition("idle");
      return this;
    });
    __publicField(this, "addClonedShapesFromTldrString", (text, point) => {
      const data = this.getClonedShapesFromTldrString(text, point);
      if (data) {
        this.addClonedShapes(data);
      }
      return this;
    });
    __publicField(this, "doGroup", (shapes2 = this.app.allSelectedShapesArray) => {
      if (this.app.readOnly)
        return;
      this.app.history.pause();
      const selectedGroups = [
        ...shapes2.filter((s2) => s2.type === "group"),
        ...shapes2.map((s2) => this.app.getParentGroup(s2))
      ].filter(isNonNullable);
      this.app.currentPage.removeShapes(...selectedGroups);
      let selectedShapes = shapes2.filter((s2) => s2.type !== "group");
      if (selectedShapes.length > 1) {
        const ShapeGroup = this.app.getShapeClass("group");
        const group = new ShapeGroup({
          id: uniqueId(),
          type: ShapeGroup.id,
          parentId: this.app.currentPage.id,
          children: selectedShapes.map((s2) => s2.id)
        });
        this.app.currentPage.addShapes(group);
        this.app.setSelectedShapes([group]);
        selectedShapes.push(group);
        this.app.bringForward(selectedShapes);
      }
      this.app.history.resume();
      this.app.persist(this.app.currentPage.persistInfo);
    });
    __publicField(this, "unGroup", (shapes2 = this.app.allSelectedShapesArray) => {
      if (this.app.readOnly)
        return;
      const selectedGroups = [
        ...shapes2.filter((s2) => s2.type === "group"),
        ...shapes2.map((s2) => this.app.getParentGroup(s2))
      ].filter(isNonNullable);
      const shapesInGroups = this.app.shapesInGroups(selectedGroups);
      if (selectedGroups.length > 0) {
        this.app.currentPage.removeShapes(...selectedGroups);
        this.app.persist();
        this.app.setSelectedShapes(shapesInGroups);
      }
    });
    __publicField(this, "convertShapes", (type, shapes2 = this.app.allSelectedShapesArray) => {
      const ShapeClass = this.app.getShapeClass(type);
      this.app.currentPage.removeShapes(...shapes2);
      const clones = shapes2.map((s2) => {
        return new ShapeClass(__spreadProps(__spreadValues({}, s2.serialized), {
          type,
          nonce: Date.now()
        }));
      });
      this.app.currentPage.addShapes(...clones);
      this.app.persist();
      this.app.setSelectedShapes(clones);
    });
    __publicField(this, "setCollapsed", (collapsed, shapes2 = this.app.allSelectedShapesArray) => {
      shapes2.forEach((shape) => {
        if (shape.props.type === "logseq-portal")
          shape.setCollapsed(collapsed);
      });
      this.app.persist();
    });
    this.app = app;
  }
};

// ../../packages/core/src/lib/TLCursors.ts
var TLCursors = class {
  constructor() {
    __publicField(this, "cursor", "default" /* Default */);
    __publicField(this, "rotation", 0);
    __publicField(this, "reset", () => {
      this.cursor = "default" /* Default */;
    });
    __publicField(this, "setCursor", (cursor, rotation = 0) => {
      if (cursor === this.cursor && rotation === this.rotation)
        return;
      this.cursor = cursor;
      this.rotation = rotation;
    });
    __publicField(this, "setRotation", (rotation) => {
      if (rotation === this.rotation)
        return;
      this.rotation = rotation;
    });
    makeObservable(this);
  }
};
__decorateClass([
  observable
], TLCursors.prototype, "cursor", 2);
__decorateClass([
  observable
], TLCursors.prototype, "rotation", 2);
__decorateClass([
  action
], TLCursors.prototype, "reset", 2);
__decorateClass([
  action
], TLCursors.prototype, "setCursor", 2);
__decorateClass([
  action
], TLCursors.prototype, "setRotation", 2);

// ../../packages/core/src/lib/TLHistory.ts
var TLHistory = class {
  constructor(app) {
    __publicField(this, "app");
    __publicField(this, "stack", []);
    __publicField(this, "isPaused", true);
    __publicField(this, "pause", () => {
      if (this.isPaused)
        return;
      this.isPaused = true;
    });
    __publicField(this, "resume", () => {
      if (!this.isPaused)
        return;
      this.isPaused = false;
    });
    __publicField(this, "persist", (info) => {
      if (this.isPaused || this.creating)
        return;
      this.app.notify("persist", info);
    });
    __publicField(this, "undo", () => {
      if (this.isPaused)
        return;
      if (this.app.selectedTool.currentState.id !== "idle")
        return;
      if (this.app.appUndo) {
        this.app.appUndo();
      }
    });
    __publicField(this, "redo", () => {
      if (this.isPaused)
        return;
      if (this.app.selectedTool.currentState.id !== "idle")
        return;
      if (this.app.appRedo) {
        this.app.appRedo();
      }
    });
    __publicField(this, "instantiateShape", (serializedShape) => {
      const ShapeClass = this.app.getShapeClass(serializedShape.type);
      return new ShapeClass(serializedShape);
    });
    __publicField(this, "deserialize", (snapshot) => {
      transaction(() => {
        var _a3;
        const { pages } = snapshot;
        const wasPaused = this.isPaused;
        this.pause();
        const newSelectedIds = [...this.app.selectedIds];
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
                    shape.nonce = serializedShape.nonce;
                    shape.setLastSerialized(serializedShape);
                  }
                  shapesMap.delete(serializedShape.id);
                } else {
                  shapesToAdd.push(this.instantiateShape(serializedShape));
                }
              }
              if (shapesMap.size > 0 && !this.app.selectedTool.isInAny("creating", "editingShape")) {
                page.removeShapes(...shapesMap.values());
              }
              if (shapesToAdd.length > 0)
                page.addShapes(...shapesToAdd);
              pagesMap.delete(serializedPage.id);
              page.updateBindings(serializedPage.bindings);
              page.nonce = (_a3 = serializedPage.nonce) != null ? _a3 : 0;
            } else {
              const { id: id3, name, shapes: shapes2, bindings, nonce } = serializedPage;
              pagesToAdd.push(
                new TLPage(this.app, {
                  id: id3,
                  name,
                  nonce,
                  bindings,
                  shapes: shapes2.map((serializedShape) => {
                    return this.instantiateShape(serializedShape);
                  })
                })
              );
            }
          }
          if (pagesToAdd.length > 0)
            this.app.addPages(pagesToAdd);
          if (pagesMap.size > 0)
            this.app.removePages(Array.from(pagesMap.values()));
          this.app.setSelectedShapes(newSelectedIds).setErasingShapes([]);
        } catch (e) {
          console.warn(e);
        }
        if (!wasPaused)
          this.resume();
      });
    });
    this.app = app;
    makeObservable(this);
  }
  get creating() {
    return this.app.selectedTool.currentState.id === "creating";
  }
};
__decorateClass([
  observable
], TLHistory.prototype, "stack", 2);
__decorateClass([
  action
], TLHistory.prototype, "persist", 2);
__decorateClass([
  action
], TLHistory.prototype, "undo", 2);
__decorateClass([
  action
], TLHistory.prototype, "redo", 2);
__decorateClass([
  action
], TLHistory.prototype, "deserialize", 2);

// ../../packages/core/src/lib/TLSettings.ts
var TLSettings = class {
  constructor() {
    __publicField(this, "mode", "light");
    __publicField(this, "showGrid", true);
    __publicField(this, "snapToGrid", false);
    __publicField(this, "penMode", false);
    __publicField(this, "scaleLevel", "md");
    __publicField(this, "color", "");
    makeObservable(this);
  }
  update(props) {
    Object.assign(this, props);
  }
};
__decorateClass([
  observable
], TLSettings.prototype, "mode", 2);
__decorateClass([
  observable
], TLSettings.prototype, "showGrid", 2);
__decorateClass([
  observable
], TLSettings.prototype, "snapToGrid", 2);
__decorateClass([
  observable
], TLSettings.prototype, "penMode", 2);
__decorateClass([
  observable
], TLSettings.prototype, "scaleLevel", 2);
__decorateClass([
  observable
], TLSettings.prototype, "color", 2);
__decorateClass([
  action
], TLSettings.prototype, "update", 1);

// ../../packages/core/src/lib/TLApp/TLApp.ts
var TLApp = class extends TLRootState {
  constructor(serializedApp, Shapes, Tools, readOnly) {
    var _a3, _b;
    super();
    __publicField(this, "uuid", uniqueId());
    __publicField(this, "readOnly");
    __publicField(this, "api");
    __publicField(this, "inputs", new TLInputs());
    __publicField(this, "cursors", new TLCursors());
    __publicField(this, "viewport", new TLViewport());
    __publicField(this, "settings", new TLSettings());
    __publicField(this, "Tools", []);
    __publicField(this, "history", new TLHistory(this));
    __publicField(this, "persist", this.history.persist);
    __publicField(this, "undo", this.history.undo);
    __publicField(this, "redo", this.history.redo);
    __publicField(this, "saving", false);
    __publicField(this, "saveState", () => {
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
    __publicField(this, "load", () => {
      this.notify("load", null);
      return this;
    });
    __publicField(this, "save", () => {
      this.notify("save", null);
      return this;
    });
    __publicField(this, "pages", /* @__PURE__ */ new Map([
      ["page", new TLPage(this, { id: "page", name: "page", shapes: [], bindings: {} })]
    ]));
    __publicField(this, "getPageById", (pageId) => {
      const page = this.pages.get(pageId);
      if (!page)
        throw Error(`Could not find a page named ${pageId}.`);
      return page;
    });
    __publicField(this, "getShapeById", (id3, pageId = this.currentPage.id) => {
      var _a3;
      const shape = (_a3 = this.getPageById(pageId)) == null ? void 0 : _a3.shapesById[id3];
      return shape;
    });
    __publicField(this, "createShapes", (shapes2) => {
      if (this.readOnly)
        return this;
      const newShapes = this.currentPage.addShapes(...shapes2);
      if (newShapes)
        this.notify("create-shapes", newShapes);
      this.persist();
      return this;
    });
    __publicField(this, "updateShapes", (shapes2) => {
      if (this.readOnly)
        return this;
      shapes2.forEach((shape) => {
        const oldShape = this.getShapeById(shape.id);
        oldShape == null ? void 0 : oldShape.update(shape);
        if (shape.type !== (oldShape == null ? void 0 : oldShape.type)) {
          this.api.convertShapes(shape.type, [oldShape]);
        }
      });
      this.persist();
      return this;
    });
    __publicField(this, "deleteShapes", (shapes2) => {
      if (shapes2.length === 0 || this.readOnly)
        return this;
      const normalizedShapes = shapes2.map((shape) => typeof shape === "string" ? this.getShapeById(shape) : shape).filter(isNonNullable).filter((s2) => !s2.props.isLocked);
      const shapesInGroups = this.shapesInGroups(normalizedShapes);
      normalizedShapes.forEach((shape) => {
        if (this.getParentGroup(shape)) {
          shapesInGroups.push(shape);
        }
      });
      let ids = new Set([...normalizedShapes, ...shapesInGroups].map((s2) => s2.id));
      shapesInGroups.forEach((shape) => {
        var _a3;
        const parentGroup = this.getParentGroup(shape);
        if (parentGroup) {
          const newChildren = (_a3 = parentGroup.props.children) == null ? void 0 : _a3.filter(
            (id3) => id3 !== shape.id
          );
          if (!newChildren || (newChildren == null ? void 0 : newChildren.length) <= 1) {
            ids.add(parentGroup.id);
          } else {
            parentGroup.update({ children: newChildren });
          }
        }
      });
      const deleteBinding = (shapeA, shapeB) => {
        var _a3;
        if ([...ids].includes(shapeA) && ((_a3 = this.getShapeById(shapeB)) == null ? void 0 : _a3.type) === "line")
          ids.add(shapeB);
      };
      this.currentPage.shapes.filter((s2) => !s2.props.isLocked).flatMap((s2) => {
        var _a3;
        return Object.values((_a3 = s2.props.handles) != null ? _a3 : {});
      }).flatMap((h2) => h2.bindingId).filter(isNonNullable).map((binding) => {
        var _a3, _b;
        const toId = (_a3 = this.currentPage.bindings[binding]) == null ? void 0 : _a3.toId;
        const fromId = (_b = this.currentPage.bindings[binding]) == null ? void 0 : _b.fromId;
        if (toId && fromId) {
          deleteBinding(toId, fromId);
          deleteBinding(fromId, toId);
        }
      });
      const allShapesToDelete = [...ids].map((id3) => this.getShapeById(id3));
      this.setSelectedShapes(this.selectedShapesArray.filter((shape) => !ids.has(shape.id)));
      const removedShapes = this.currentPage.removeShapes(...allShapesToDelete);
      if (removedShapes)
        this.notify("delete-shapes", removedShapes);
      this.persist();
      return this;
    });
    __publicField(this, "bringForward", (shapes2 = this.selectedShapesArray) => {
      if (shapes2.length > 0 && !this.readOnly)
        this.currentPage.bringForward(shapes2);
      return this;
    });
    __publicField(this, "sendBackward", (shapes2 = this.selectedShapesArray) => {
      if (shapes2.length > 0 && !this.readOnly)
        this.currentPage.sendBackward(shapes2);
      return this;
    });
    __publicField(this, "sendToBack", (shapes2 = this.selectedShapesArray) => {
      if (shapes2.length > 0 && !this.readOnly)
        this.currentPage.sendToBack(shapes2);
      return this;
    });
    __publicField(this, "bringToFront", (shapes2 = this.selectedShapesArray) => {
      if (shapes2.length > 0 && !this.readOnly)
        this.currentPage.bringToFront(shapes2);
      return this;
    });
    __publicField(this, "flipHorizontal", (shapes2 = this.selectedShapesArray) => {
      this.currentPage.flip(shapes2, "horizontal");
      return this;
    });
    __publicField(this, "flipVertical", (shapes2 = this.selectedShapesArray) => {
      this.currentPage.flip(shapes2, "vertical");
      return this;
    });
    __publicField(this, "align", (type, shapes2 = this.selectedShapesArray) => {
      if (shapes2.length < 2 || this.readOnly)
        return this;
      const boundsForShapes = shapes2.map((shape) => {
        const bounds = shape.getBounds();
        return {
          id: shape.id,
          point: [bounds.minX, bounds.minY],
          bounds
        };
      });
      const commonBounds = BoundsUtils.getCommonBounds(boundsForShapes.map(({ bounds }) => bounds));
      const midX = commonBounds.minX + commonBounds.width / 2;
      const midY = commonBounds.minY + commonBounds.height / 2;
      const deltaMap = Object.fromEntries(
        boundsForShapes.map(({ id: id3, point, bounds }) => {
          return [
            id3,
            {
              prev: point,
              next: {
                ["top" /* Top */]: [point[0], commonBounds.minY],
                ["centerVertical" /* CenterVertical */]: [point[0], midY - bounds.height / 2],
                ["bottom" /* Bottom */]: [point[0], commonBounds.maxY - bounds.height],
                ["left" /* Left */]: [commonBounds.minX, point[1]],
                ["centerHorizontal" /* CenterHorizontal */]: [midX - bounds.width / 2, point[1]],
                ["right" /* Right */]: [commonBounds.maxX - bounds.width, point[1]]
              }[type]
            }
          ];
        })
      );
      shapes2.forEach((shape) => {
        if (deltaMap[shape.id])
          shape.update({ point: deltaMap[shape.id].next });
      });
      this.persist();
      return this;
    });
    __publicField(this, "distribute", (type, shapes2 = this.selectedShapesArray) => {
      if (shapes2.length < 2 || this.readOnly)
        return this;
      const deltaMap = Object.fromEntries(
        BoundsUtils.getDistributions(shapes2, type).map((d2) => [d2.id, d2])
      );
      shapes2.forEach((shape) => {
        if (deltaMap[shape.id])
          shape.update({ point: deltaMap[shape.id].next });
      });
      this.persist();
      return this;
    });
    __publicField(this, "packIntoRectangle", (shapes2 = this.selectedShapesArray) => {
      if (shapes2.length < 2 || this.readOnly)
        return this;
      const deltaMap = Object.fromEntries(
        BoundsUtils.getPackedDistributions(shapes2).map((d2) => [d2.id, d2])
      );
      shapes2.forEach((shape) => {
        if (deltaMap[shape.id])
          shape.update({ point: deltaMap[shape.id].next });
      });
      this.persist();
      return this;
    });
    __publicField(this, "setLocked", (locked) => {
      if (this.selectedShapesArray.length === 0 || this.readOnly)
        return this;
      this.selectedShapesArray.forEach((shape) => {
        shape.update({ isLocked: locked });
      });
      this.persist();
      return this;
    });
    __publicField(this, "assets", {});
    __publicField(this, "removeUnusedAssets", () => {
      const usedAssets = this.getCleanUpAssets();
      Object.keys(this.assets).forEach((assetId) => {
        if (!usedAssets.some((asset) => asset.id === assetId)) {
          delete this.assets[assetId];
        }
      });
      this.persist();
      return this;
    });
    __publicField(this, "copy", () => {
      if (this.selectedShapesArray.length > 0 && !this.editingShape) {
        const selectedShapes = this.allSelectedShapesArray;
        const jsonString = JSON.stringify({
          shapes: selectedShapes.map((shape) => shape.serialized),
          assets: this.getCleanUpAssets().filter((asset) => {
            return selectedShapes.some((shape) => shape.props.assetId === asset.id);
          }),
          bindings: toJS(this.currentPage.bindings)
        });
        const tldrawString = encodeURIComponent(`<whiteboard-tldr>${jsonString}</whiteboard-tldr>`);
        const shapeBlockRefs = this.selectedShapesArray.map((s2) => `((${s2.props.id}))`).join(" ");
        this.notify("copy", {
          text: shapeBlockRefs,
          html: tldrawString
        });
      }
    });
    __publicField(this, "paste", (e, shiftKey) => {
      var _a3;
      if (!this.editingShape && !this.readOnly) {
        this.notify("paste", {
          point: this.inputs.currentPoint,
          shiftKey: !!shiftKey,
          dataTransfer: (_a3 = e == null ? void 0 : e.clipboardData) != null ? _a3 : void 0
        });
      }
    });
    __publicField(this, "cut", () => {
      this.copy();
      this.api.deleteShapes();
    });
    __publicField(this, "drop", (dataTransfer, point) => {
      this.notify("drop", {
        dataTransfer,
        point: point ? this.viewport.getPagePoint(point) : BoundsUtils.getBoundsCenter(this.viewport.currentView)
      });
      return void 0;
    });
    __publicField(this, "selectTool", (id3, data = {}) => {
      if (!this.readOnly || ["select", "move"].includes(id3))
        this.transition(id3, data);
    });
    __publicField(this, "editingId");
    __publicField(this, "setEditingShape", (shape) => {
      this.editingId = typeof shape === "string" ? shape : shape == null ? void 0 : shape.id;
      return this;
    });
    __publicField(this, "clearEditingState", () => {
      this.selectedTool.transition("idle");
      return this.setEditingShape();
    });
    __publicField(this, "hoveredId");
    __publicField(this, "setHoveredShape", (shape) => {
      this.hoveredId = typeof shape === "string" ? shape : shape == null ? void 0 : shape.id;
      return this;
    });
    __publicField(this, "selectedIds", /* @__PURE__ */ new Set());
    __publicField(this, "selectedShapes", /* @__PURE__ */ new Set());
    __publicField(this, "selectionRotation", 0);
    __publicField(this, "setSelectedShapes", (shapes2) => {
      var _a3;
      const { selectedIds, selectedShapes } = this;
      selectedIds.clear();
      selectedShapes.clear();
      if (shapes2[0] && typeof shapes2[0] === "string") {
        ;
        shapes2.forEach((s2) => selectedIds.add(s2));
      } else {
        ;
        shapes2.forEach((s2) => selectedIds.add(s2.id));
      }
      const newSelectedShapes = this.currentPage.shapes.filter((shape) => selectedIds.has(shape.id));
      newSelectedShapes.forEach((s2) => selectedShapes.add(s2));
      if (newSelectedShapes.length === 1) {
        this.selectionRotation = (_a3 = newSelectedShapes[0].props.rotation) != null ? _a3 : 0;
      } else {
        this.selectionRotation = 0;
      }
      if (shapes2.length === 0) {
        this.setEditingShape();
      }
      return this;
    });
    __publicField(this, "erasingIds", /* @__PURE__ */ new Set());
    __publicField(this, "erasingShapes", /* @__PURE__ */ new Set());
    __publicField(this, "setErasingShapes", (shapes2) => {
      const { erasingIds, erasingShapes } = this;
      erasingIds.clear();
      erasingShapes.clear();
      if (shapes2[0] && typeof shapes2[0] === "string") {
        ;
        shapes2.forEach((s2) => erasingIds.add(s2));
      } else {
        ;
        shapes2.forEach((s2) => erasingIds.add(s2.id));
      }
      const newErasingShapes = this.currentPage.shapes.filter((shape) => erasingIds.has(shape.id));
      newErasingShapes.forEach((s2) => erasingShapes.add(s2));
      return this;
    });
    __publicField(this, "bindingIds");
    __publicField(this, "setBindingShapes", (ids) => {
      this.bindingIds = ids;
      return this;
    });
    __publicField(this, "clearBindingShape", () => {
      return this.setBindingShapes();
    });
    __publicField(this, "createNewLineBinding", (source, target) => {
      const src = typeof source === "string" ? this.getShapeById(source) : source;
      const tgt = typeof target === "string" ? this.getShapeById(target) : target;
      if ((src == null ? void 0 : src.canBind) && (tgt == null ? void 0 : tgt.canBind)) {
        const result = createNewLineBinding(src, tgt);
        if (result) {
          const [newLine, newBindings] = result;
          this.createShapes([newLine]);
          this.currentPage.updateBindings(Object.fromEntries(newBindings.map((b3) => [b3.id, b3])));
          this.persist();
          return true;
        }
      }
      return false;
    });
    __publicField(this, "brush");
    __publicField(this, "setBrush", (brush) => {
      this.brush = brush;
      return this;
    });
    __publicField(this, "setCamera", (point, zoom) => {
      this.viewport.update({ point, zoom });
      return this;
    });
    __publicField(this, "getPagePoint", (point) => {
      const { camera } = this.viewport;
      return Vec.sub(Vec.div(point, camera.zoom), camera.point);
    });
    __publicField(this, "getScreenPoint", (point) => {
      const { camera } = this.viewport;
      return Vec.mul(Vec.add(point, camera.point), camera.zoom);
    });
    __publicField(this, "Shapes", /* @__PURE__ */ new Map());
    __publicField(this, "registerShapes", (Shapes) => {
      Shapes.forEach((Shape5) => {
        if (Shape5.id === "group") {
          const app = this;
          Shape5.prototype.getShapes = function() {
            var _a3, _b;
            return (_b = (_a3 = this.props.children) == null ? void 0 : _a3.map((id3) => app.getShapeById(id3)).filter(Boolean)) != null ? _b : [];
          };
        }
        return this.Shapes.set(Shape5.id, Shape5);
      });
    });
    __publicField(this, "deregisterShapes", (Shapes) => {
      Shapes.forEach((Shape5) => this.Shapes.delete(Shape5.id));
    });
    __publicField(this, "getShapeClass", (type) => {
      if (!type)
        throw Error("No shape type provided.");
      const Shape5 = this.Shapes.get(type);
      if (!Shape5)
        throw Error(`Could not find shape class for ${type}`);
      return Shape5;
    });
    __publicField(this, "wrapUpdate", (fn) => {
      transaction(() => {
        const shouldSave = !this.history.isPaused;
        if (shouldSave) {
          this.history.pause();
        }
        fn();
        if (shouldSave) {
          this.history.resume();
          this.persist();
        }
      });
    });
    __publicField(this, "subscriptions", /* @__PURE__ */ new Set([]));
    __publicField(this, "subscribe", (event, callback) => {
      if (callback === void 0)
        throw Error("Callback is required.");
      const subscription = { event, callback };
      this.subscriptions.add(subscription);
      return () => this.unsubscribe(subscription);
    });
    __publicField(this, "unsubscribe", (subscription) => {
      this.subscriptions.delete(subscription);
      return this;
    });
    __publicField(this, "notify", (event, info) => {
      this.subscriptions.forEach((subscription) => {
        if (subscription.event === event) {
          subscription.callback(this, info);
        }
      });
      return this;
    });
    __publicField(this, "onTransition", () => {
    });
    __publicField(this, "onPointerDown", (info, e) => {
      if (!this.editingShape && e.button === 1 && !this.isIn("move")) {
        this.temporaryTransitionToMove(e);
        return;
      }
      if (e.button === 2 && !this.editingShape) {
        e.preventDefault();
        this.transition("select");
        return;
      }
      if ("clientX" in e) {
        this.inputs.onPointerDown(
          [...this.viewport.getPagePoint([e.clientX, e.clientY]), e.pressure],
          e
        );
      }
    });
    __publicField(this, "onPointerUp", (info, e) => {
      if (!this.editingShape && e.button === 1 && this.isIn("move")) {
        this.selectedTool.transition("idle", { exit: true });
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      if ("clientX" in e) {
        this.inputs.onPointerUp(
          [...this.viewport.getPagePoint([e.clientX, e.clientY]), e.pressure],
          e
        );
      }
    });
    __publicField(this, "onPointerMove", (info, e) => {
      if ("clientX" in e) {
        this.inputs.onPointerMove([...this.viewport.getPagePoint([e.clientX, e.clientY]), e.pressure], e);
      }
    });
    __publicField(this, "onKeyDown", (info, e) => {
      if (!this.editingShape && e["key"] === " " && !this.isIn("move")) {
        this.temporaryTransitionToMove(e);
        return;
      }
      this.inputs.onKeyDown(e);
    });
    __publicField(this, "onKeyUp", (info, e) => {
      if (!this.editingShape && e["key"] === " " && this.isIn("move")) {
        this.selectedTool.transition("idle", { exit: true });
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      this.inputs.onKeyUp(e);
    });
    __publicField(this, "onPinchStart", (info, e) => {
      this.inputs.onPinchStart([...this.viewport.getPagePoint(info.point), 0.5], e);
    });
    __publicField(this, "onPinch", (info, e) => {
      this.inputs.onPinch([...this.viewport.getPagePoint(info.point), 0.5], e);
    });
    __publicField(this, "onPinchEnd", (info, e) => {
      this.inputs.onPinchEnd([...this.viewport.getPagePoint(info.point), 0.5], e);
    });
    this._states = [TLSelectTool, TLMoveTool];
    this.readOnly = readOnly;
    this.history.pause();
    if (this.states && this.states.length > 0) {
      this.registerStates(this.states);
      const initialId = (_a3 = this.initial) != null ? _a3 : this.states[0].id;
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
    this.api = new TLApi(this);
    makeObservable(this);
    this.notify("mount", null);
  }
  loadDocumentModel(model) {
    this.history.deserialize(model);
    if (model.assets && model.assets.length > 0)
      this.addAssets(model.assets);
    return this;
  }
  get serialized() {
    return {};
  }
  get currentPageId() {
    return this.pages.keys().next().value;
  }
  get currentPage() {
    return this.getPageById(this.currentPageId);
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
  shapesInGroups(groups = this.shapes) {
    return groups.flatMap((shape) => shape.props.children).filter(isNonNullable).map((id3) => this.getShapeById(id3)).filter(isNonNullable);
  }
  getParentGroup(shape) {
    return this.shapes.find((group) => {
      var _a3;
      return (_a3 = group.props.children) == null ? void 0 : _a3.includes(shape.id);
    });
  }
  addAssets(assets) {
    assets.forEach((asset) => this.assets[asset.id] = asset);
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
  getCleanUpAssets() {
    const usedAssets = /* @__PURE__ */ new Set();
    this.pages.forEach(
      (p2) => p2.shapes.forEach((s2) => {
        if (s2.props.assetId && this.assets[s2.props.assetId]) {
          usedAssets.add(this.assets[s2.props.assetId]);
        }
      })
    );
    return Array.from(usedAssets);
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
  registerTools(tools2) {
    this.Tools = tools2;
    return this.registerStates(tools2);
  }
  get editingShape() {
    const { editingId, currentPage } = this;
    return editingId ? currentPage.shapes.find((shape) => shape.id === editingId) : void 0;
  }
  get hoveredShape() {
    const { hoveredId, currentPage } = this;
    return hoveredId ? currentPage.shapes.find((shape) => shape.id === hoveredId) : void 0;
  }
  get hoveredGroup() {
    const { hoveredShape } = this;
    const hoveredGroup = hoveredShape ? this.shapes.find((s2) => {
      var _a3;
      return s2.type === "group" && ((_a3 = s2.props.children) == null ? void 0 : _a3.includes(hoveredShape.id));
    }) : void 0;
    return hoveredGroup;
  }
  get selectedShapesArray() {
    const { selectedShapes, selectedTool } = this;
    const stateId = selectedTool.id;
    if (stateId !== "select")
      return [];
    return Array.from(selectedShapes.values());
  }
  get allSelectedShapes() {
    return new Set(this.allSelectedShapesArray);
  }
  get allSelectedShapesArray() {
    const { selectedShapesArray } = this;
    return dedupe([...selectedShapesArray, ...this.shapesInGroups(selectedShapesArray)]);
  }
  setSelectionRotation(radians) {
    this.selectionRotation = radians;
  }
  get erasingShapesArray() {
    return Array.from(this.erasingShapes.values());
  }
  get bindingShapes() {
    var _a3;
    const activeBindings = this.selectedShapesArray.length === 1 ? this.selectedShapesArray.flatMap((s2) => {
      var _a4;
      return Object.values((_a4 = s2.props.handles) != null ? _a4 : {});
    }).flatMap((h2) => h2.bindingId).filter(isNonNullable).flatMap((binding) => {
      var _a4, _b;
      return [
        (_a4 = this.currentPage.bindings[binding]) == null ? void 0 : _a4.fromId,
        (_b = this.currentPage.bindings[binding]) == null ? void 0 : _b.toId
      ];
    }).filter(isNonNullable) : [];
    const bindingIds = [...(_a3 = this.bindingIds) != null ? _a3 : [], ...activeBindings];
    return bindingIds ? this.currentPage.shapes.filter((shape) => bindingIds == null ? void 0 : bindingIds.includes(shape.id)) : void 0;
  }
  get currentGrid() {
    const { zoom } = this.viewport.camera;
    if (zoom < 0.15) {
      return GRID_SIZE * 16;
    } else if (zoom < 1) {
      return GRID_SIZE * 4;
    } else {
      return GRID_SIZE * 1;
    }
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
      return !shape.canUnmount || selectedShapes.has(shape) || BoundsUtils.boundsContain(currentView, shape.rotatedBounds) || BoundsUtils.boundsCollide(currentView, shape.rotatedBounds);
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
    return Vec.clampV(
      [
        (center[0] - currentView.minX - currentView.width / 2) / currentView.width,
        (center[1] - currentView.minY - currentView.height / 2) / currentView.height
      ],
      -1,
      1
    );
  }
  get selectionBounds() {
    const { selectedShapesArray } = this;
    if (selectedShapesArray.length === 0)
      return void 0;
    if (selectedShapesArray.length === 1) {
      return __spreadProps(__spreadValues({}, selectedShapesArray[0].bounds), { rotation: selectedShapesArray[0].props.rotation });
    }
    return BoundsUtils.getCommonBounds(this.selectedShapesArray.map((shape) => shape.rotatedBounds));
  }
  get showSelection() {
    var _a3;
    const { selectedShapesArray } = this;
    return this.isIn("select") && !this.isInAny("select.translating", "select.pinching", "select.rotating") && (selectedShapesArray.length === 1 && !((_a3 = selectedShapesArray[0]) == null ? void 0 : _a3.hideSelection) || selectedShapesArray.length > 1);
  }
  get showSelectionDetail() {
    return this.isIn("select") && !this.isInAny("select.translating", "select.pinching") && this.selectedShapes.size > 0 && !this.selectedShapesArray.every((shape) => shape.hideSelectionDetail) && false;
  }
  get showSelectionRotation() {
    return this.showSelectionDetail && this.isInAny("select.rotating", "select.pointingRotateHandle");
  }
  get showContextBar() {
    const {
      selectedShapesArray,
      inputs: { ctrlKey }
    } = this;
    return this.isInAny("select.idle", "select.hoveringSelectionHandle") && !this.isIn("select.contextMenu") && selectedShapesArray.length > 0 && !this.readOnly && !selectedShapesArray.every((shape) => shape.hideContextBar);
  }
  get showRotateHandles() {
    const { selectedShapesArray } = this;
    return this.isInAny(
      "select.idle",
      "select.hoveringSelectionHandle",
      "select.pointingRotateHandle",
      "select.pointingResizeHandle"
    ) && selectedShapesArray.length > 0 && !this.readOnly && !selectedShapesArray.some((shape) => shape.hideRotateHandle);
  }
  get showResizeHandles() {
    const { selectedShapesArray } = this;
    return this.isInAny(
      "select.idle",
      "select.hoveringSelectionHandle",
      "select.pointingShape",
      "select.pointingSelectedShape",
      "select.pointingRotateHandle",
      "select.pointingResizeHandle"
    ) && selectedShapesArray.length === 1 && !this.readOnly && !selectedShapesArray.every((shape) => shape.hideResizeHandles);
  }
  get showCloneHandles() {
    const { selectedShapesArray } = this;
    return this.isInAny(
      "select.idle",
      "select.hoveringSelectionHandle",
      "select.pointingShape",
      "select.pointingSelectedShape"
    ) && selectedShapesArray.length === 1 && Object.values(Geometry).some((geometry) => geometry === this.selectedShapesArray[0].type) && !this.readOnly;
  }
  temporaryTransitionToMove(event) {
    event.stopPropagation();
    event.preventDefault();
    const prevTool = this.selectedTool;
    this.transition("move", { prevTool });
    this.selectedTool.transition("idleHold");
  }
};
__publicField(TLApp, "id", "app");
__publicField(TLApp, "initial", "select");
__decorateClass([
  computed
], TLApp.prototype, "serialized", 1);
__decorateClass([
  observable
], TLApp.prototype, "pages", 2);
__decorateClass([
  computed
], TLApp.prototype, "currentPageId", 1);
__decorateClass([
  computed
], TLApp.prototype, "currentPage", 1);
__decorateClass([
  action
], TLApp.prototype, "addPages", 1);
__decorateClass([
  action
], TLApp.prototype, "removePages", 1);
__decorateClass([
  action
], TLApp.prototype, "createShapes", 2);
__decorateClass([
  action
], TLApp.prototype, "updateShapes", 2);
__decorateClass([
  action
], TLApp.prototype, "deleteShapes", 2);
__decorateClass([
  observable
], TLApp.prototype, "assets", 2);
__decorateClass([
  action
], TLApp.prototype, "addAssets", 1);
__decorateClass([
  action
], TLApp.prototype, "removeAssets", 1);
__decorateClass([
  action
], TLApp.prototype, "removeUnusedAssets", 2);
__decorateClass([
  computed
], TLApp.prototype, "selectedTool", 1);
__decorateClass([
  observable
], TLApp.prototype, "editingId", 2);
__decorateClass([
  computed
], TLApp.prototype, "editingShape", 1);
__decorateClass([
  action
], TLApp.prototype, "setEditingShape", 2);
__decorateClass([
  observable
], TLApp.prototype, "hoveredId", 2);
__decorateClass([
  computed
], TLApp.prototype, "hoveredShape", 1);
__decorateClass([
  computed
], TLApp.prototype, "hoveredGroup", 1);
__decorateClass([
  action
], TLApp.prototype, "setHoveredShape", 2);
__decorateClass([
  observable
], TLApp.prototype, "selectedIds", 2);
__decorateClass([
  observable
], TLApp.prototype, "selectedShapes", 2);
__decorateClass([
  observable
], TLApp.prototype, "selectionRotation", 2);
__decorateClass([
  computed
], TLApp.prototype, "selectedShapesArray", 1);
__decorateClass([
  computed
], TLApp.prototype, "allSelectedShapes", 1);
__decorateClass([
  computed
], TLApp.prototype, "allSelectedShapesArray", 1);
__decorateClass([
  action
], TLApp.prototype, "setSelectedShapes", 2);
__decorateClass([
  action
], TLApp.prototype, "setSelectionRotation", 1);
__decorateClass([
  observable
], TLApp.prototype, "erasingIds", 2);
__decorateClass([
  observable
], TLApp.prototype, "erasingShapes", 2);
__decorateClass([
  computed
], TLApp.prototype, "erasingShapesArray", 1);
__decorateClass([
  action
], TLApp.prototype, "setErasingShapes", 2);
__decorateClass([
  observable
], TLApp.prototype, "bindingIds", 2);
__decorateClass([
  computed
], TLApp.prototype, "bindingShapes", 1);
__decorateClass([
  action
], TLApp.prototype, "setBindingShapes", 2);
__decorateClass([
  action
], TLApp.prototype, "createNewLineBinding", 2);
__decorateClass([
  observable
], TLApp.prototype, "brush", 2);
__decorateClass([
  action
], TLApp.prototype, "setBrush", 2);
__decorateClass([
  action
], TLApp.prototype, "setCamera", 2);
__decorateClass([
  computed
], TLApp.prototype, "currentGrid", 1);
__decorateClass([
  computed
], TLApp.prototype, "shapes", 1);
__decorateClass([
  computed
], TLApp.prototype, "shapesInViewport", 1);
__decorateClass([
  computed
], TLApp.prototype, "selectionDirectionHint", 1);
__decorateClass([
  computed
], TLApp.prototype, "selectionBounds", 1);
__decorateClass([
  computed
], TLApp.prototype, "showSelection", 1);
__decorateClass([
  computed
], TLApp.prototype, "showSelectionDetail", 1);
__decorateClass([
  computed
], TLApp.prototype, "showSelectionRotation", 1);
__decorateClass([
  computed
], TLApp.prototype, "showContextBar", 1);
__decorateClass([
  computed
], TLApp.prototype, "showRotateHandles", 1);
__decorateClass([
  computed
], TLApp.prototype, "showResizeHandles", 1);
__decorateClass([
  computed
], TLApp.prototype, "showCloneHandles", 1);

// ../../packages/core/src/utils/BindingUtils.ts
function findBindingPoint(shape, target, handleId, bindingId, point, origin, direction, bindAnywhere) {
  const bindingPoint = target.getBindingPoint(
    point,
    origin,
    direction,
    bindAnywhere
  );
  if (!bindingPoint)
    return;
  return {
    id: bindingId,
    type: "line",
    fromId: shape.id,
    toId: target.id,
    handleId,
    point: src_default.toFixed(bindingPoint.point),
    distance: bindingPoint.distance
  };
}
function createNewLineBinding(source, target) {
  const cs = source.getCenter();
  const ct2 = target.getCenter();
  const lineId = uniqueId();
  const lineShape = __spreadProps(__spreadValues({}, TLLineShape.defaultProps), {
    id: lineId,
    type: TLLineShape.id,
    parentId: source.props.parentId,
    point: cs
  });
  const startBinding = findBindingPoint(
    lineShape,
    source,
    "start",
    uniqueId(),
    cs,
    cs,
    src_default.uni(src_default.sub(ct2, cs)),
    false
  );
  const endBinding = findBindingPoint(
    lineShape,
    target,
    "end",
    uniqueId(),
    ct2,
    ct2,
    src_default.uni(src_default.sub(cs, ct2)),
    false
  );
  if (startBinding && endBinding) {
    lineShape.handles.start.point = [0, 0];
    lineShape.handles.end.point = src_default.sub(ct2, cs);
    lineShape.handles.start.bindingId = startBinding.id;
    lineShape.handles.end.bindingId = endBinding.id;
    return [lineShape, [startBinding, endBinding]];
  }
  return null;
}

// ../../node_modules/fast-copy/dist/esm/index.mjs
var toStringFunction = Function.prototype.toString;
var create = Object.create;
var toStringObject = Object.prototype.toString;
var LegacyCache = function() {
  function LegacyCache2() {
    this._keys = [];
    this._values = [];
  }
  LegacyCache2.prototype.has = function(key) {
    return !!~this._keys.indexOf(key);
  };
  LegacyCache2.prototype.get = function(key) {
    return this._values[this._keys.indexOf(key)];
  };
  LegacyCache2.prototype.set = function(key, value) {
    this._keys.push(key);
    this._values.push(value);
  };
  return LegacyCache2;
}();
function createCacheLegacy() {
  return new LegacyCache();
}
function createCacheModern() {
  return /* @__PURE__ */ new WeakMap();
}
var createCache = typeof WeakMap !== "undefined" ? createCacheModern : createCacheLegacy;
function getCleanClone(prototype) {
  if (!prototype) {
    return create(null);
  }
  var Constructor = prototype.constructor;
  if (Constructor === Object) {
    return prototype === Object.prototype ? {} : create(prototype);
  }
  if (~toStringFunction.call(Constructor).indexOf("[native code]")) {
    try {
      return new Constructor();
    } catch (_a3) {
    }
  }
  return create(prototype);
}
function getRegExpFlagsLegacy(regExp) {
  var flags = "";
  if (regExp.global) {
    flags += "g";
  }
  if (regExp.ignoreCase) {
    flags += "i";
  }
  if (regExp.multiline) {
    flags += "m";
  }
  if (regExp.unicode) {
    flags += "u";
  }
  if (regExp.sticky) {
    flags += "y";
  }
  return flags;
}
function getRegExpFlagsModern(regExp) {
  return regExp.flags;
}
var getRegExpFlags = /test/g.flags === "g" ? getRegExpFlagsModern : getRegExpFlagsLegacy;
function getTagLegacy(value) {
  var type = toStringObject.call(value);
  return type.substring(8, type.length - 1);
}
function getTagModern(value) {
  return value[Symbol.toStringTag] || getTagLegacy(value);
}
var getTag = typeof Symbol !== "undefined" ? getTagModern : getTagLegacy;
var defineProperty3 = Object.defineProperty;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var getOwnPropertyNames = Object.getOwnPropertyNames;
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var _a = Object.prototype;
var hasOwnProperty = _a.hasOwnProperty;
var propertyIsEnumerable = _a.propertyIsEnumerable;
var SUPPORTS_SYMBOL = typeof getOwnPropertySymbols === "function";
function getStrictPropertiesModern(object2) {
  return getOwnPropertyNames(object2).concat(getOwnPropertySymbols(object2));
}
var getStrictProperties = SUPPORTS_SYMBOL ? getStrictPropertiesModern : getOwnPropertyNames;
function copyOwnPropertiesStrict(value, clone, state) {
  var properties = getStrictProperties(value);
  for (var index2 = 0, length_1 = properties.length, property = void 0, descriptor = void 0; index2 < length_1; ++index2) {
    property = properties[index2];
    if (property === "callee" || property === "caller") {
      continue;
    }
    descriptor = getOwnPropertyDescriptor(value, property);
    if (!descriptor) {
      clone[property] = state.copier(value[property], state);
      continue;
    }
    if (!descriptor.get && !descriptor.set) {
      descriptor.value = state.copier(descriptor.value, state);
    }
    try {
      defineProperty3(clone, property, descriptor);
    } catch (error) {
      clone[property] = descriptor.value;
    }
  }
  return clone;
}
function copyArrayLoose(array2, state) {
  var clone = new state.Constructor();
  state.cache.set(array2, clone);
  for (var index2 = 0, length_2 = array2.length; index2 < length_2; ++index2) {
    clone[index2] = state.copier(array2[index2], state);
  }
  return clone;
}
function copyArrayStrict(array2, state) {
  var clone = new state.Constructor();
  state.cache.set(array2, clone);
  return copyOwnPropertiesStrict(array2, clone, state);
}
function copyArrayBuffer(arrayBuffer, _state) {
  return arrayBuffer.slice(0);
}
function copyBlob(blob, _state) {
  return blob.slice(0, blob.size, blob.type);
}
function copyDataView(dataView, state) {
  return new state.Constructor(copyArrayBuffer(dataView.buffer));
}
function copyDate(date, state) {
  return new state.Constructor(date.getTime());
}
function copyMapLoose(map3, state) {
  var clone = new state.Constructor();
  state.cache.set(map3, clone);
  map3.forEach(function(value, key) {
    clone.set(key, state.copier(value, state));
  });
  return clone;
}
function copyMapStrict(map3, state) {
  return copyOwnPropertiesStrict(map3, copyMapLoose(map3, state), state);
}
function copyObjectLooseLegacy(object2, state) {
  var clone = getCleanClone(state.prototype);
  state.cache.set(object2, clone);
  for (var key in object2) {
    if (hasOwnProperty.call(object2, key)) {
      clone[key] = state.copier(object2[key], state);
    }
  }
  return clone;
}
function copyObjectLooseModern(object2, state) {
  var clone = getCleanClone(state.prototype);
  state.cache.set(object2, clone);
  for (var key in object2) {
    if (hasOwnProperty.call(object2, key)) {
      clone[key] = state.copier(object2[key], state);
    }
  }
  var symbols = getOwnPropertySymbols(object2);
  for (var index2 = 0, length_3 = symbols.length, symbol = void 0; index2 < length_3; ++index2) {
    symbol = symbols[index2];
    if (propertyIsEnumerable.call(object2, symbol)) {
      clone[symbol] = state.copier(object2[symbol], state);
    }
  }
  return clone;
}
var copyObjectLoose = SUPPORTS_SYMBOL ? copyObjectLooseModern : copyObjectLooseLegacy;
function copyObjectStrict(object2, state) {
  var clone = getCleanClone(state.prototype);
  state.cache.set(object2, clone);
  return copyOwnPropertiesStrict(object2, clone, state);
}
function copyPrimitiveWrapper(primitiveObject, state) {
  return new state.Constructor(primitiveObject.valueOf());
}
function copyRegExp(regExp, state) {
  var clone = new state.Constructor(regExp.source, getRegExpFlags(regExp));
  clone.lastIndex = regExp.lastIndex;
  return clone;
}
function copySelf(value, _state) {
  return value;
}
function copySetLoose(set4, state) {
  var clone = new state.Constructor();
  state.cache.set(set4, clone);
  set4.forEach(function(value) {
    clone.add(state.copier(value, state));
  });
  return clone;
}
function copySetStrict(set4, state) {
  return copyOwnPropertiesStrict(set4, copySetLoose(set4, state), state);
}
var isArray = Array.isArray;
var assign2 = Object.assign;
var getPrototypeOf = Object.getPrototypeOf;
var DEFAULT_LOOSE_OPTIONS = {
  array: copyArrayLoose,
  arrayBuffer: copyArrayBuffer,
  blob: copyBlob,
  dataView: copyDataView,
  date: copyDate,
  error: copySelf,
  map: copyMapLoose,
  object: copyObjectLoose,
  regExp: copyRegExp,
  set: copySetLoose
};
var DEFAULT_STRICT_OPTIONS = assign2({}, DEFAULT_LOOSE_OPTIONS, {
  array: copyArrayStrict,
  map: copyMapStrict,
  object: copyObjectStrict,
  set: copySetStrict
});
function getTagSpecificCopiers(options) {
  return {
    Arguments: options.object,
    Array: options.array,
    ArrayBuffer: options.arrayBuffer,
    Blob: options.blob,
    Boolean: copyPrimitiveWrapper,
    DataView: options.dataView,
    Date: options.date,
    Error: options.error,
    Float32Array: options.arrayBuffer,
    Float64Array: options.arrayBuffer,
    Int8Array: options.arrayBuffer,
    Int16Array: options.arrayBuffer,
    Int32Array: options.arrayBuffer,
    Map: options.map,
    Number: copyPrimitiveWrapper,
    Object: options.object,
    Promise: copySelf,
    RegExp: options.regExp,
    Set: options.set,
    String: copyPrimitiveWrapper,
    WeakMap: copySelf,
    WeakSet: copySelf,
    Uint8Array: options.arrayBuffer,
    Uint8ClampedArray: options.arrayBuffer,
    Uint16Array: options.arrayBuffer,
    Uint32Array: options.arrayBuffer,
    Uint64Array: options.arrayBuffer
  };
}
function createCopier(options) {
  var normalizedOptions = assign2({}, DEFAULT_LOOSE_OPTIONS, options);
  var tagSpecificCopiers = getTagSpecificCopiers(normalizedOptions);
  var array2 = tagSpecificCopiers.Array, object2 = tagSpecificCopiers.Object;
  function copier(value, state) {
    state.prototype = state.Constructor = void 0;
    if (!value || typeof value !== "object") {
      return value;
    }
    if (state.cache.has(value)) {
      return state.cache.get(value);
    }
    state.prototype = value.__proto__ || getPrototypeOf(value);
    state.Constructor = state.prototype && state.prototype.constructor;
    if (!state.Constructor || state.Constructor === Object) {
      return object2(value, state);
    }
    if (isArray(value)) {
      return array2(value, state);
    }
    var tagSpecificCopier = tagSpecificCopiers[getTag(value)];
    if (tagSpecificCopier) {
      return tagSpecificCopier(value, state);
    }
    return typeof value.then === "function" ? value : object2(value, state);
  }
  return function copy(value) {
    return copier(value, {
      Constructor: void 0,
      cache: createCache(),
      copier,
      prototype: void 0
    });
  };
}
function createStrictCopier(options) {
  return createCopier(assign2({}, DEFAULT_STRICT_OPTIONS, options));
}
var copyStrict = createStrictCopier({});
var index = createCopier({});

// ../../packages/core/src/utils/DataUtils.ts
var import_fast_deep_equal = __toESM(require_fast_deep_equal());
var import_deepmerge = __toESM(require_cjs());
var deepCopy = index;
function deepMerge(a3, b3) {
  return (0, import_deepmerge.default)(a3, b3, {
    arrayMerge: (destinationArray, sourceArray, options) => sourceArray
  });
}
function modulate(value, rangeA, rangeB, clamp3 = false) {
  const [fromLow, fromHigh] = rangeA;
  const [v0, v12] = rangeB;
  const result = v0 + (value - fromLow) / (fromHigh - fromLow) * (v12 - v0);
  return clamp3 ? v0 < v12 ? Math.max(Math.min(result, v12), v0) : Math.max(Math.min(result, v0), v12) : result;
}
function clamp(n2, min, max) {
  return Math.max(min, typeof max !== "undefined" ? Math.min(n2, max) : n2);
}
function getSizeFromSrc(dataURL, type) {
  return new Promise((resolve, reject) => {
    if (type === "video") {
      const video = document.createElement("video");
      video.addEventListener(
        "loadedmetadata",
        function() {
          const height = this.videoHeight;
          const width = this.videoWidth;
          resolve([width, height]);
        },
        false
      );
      video.src = dataURL;
    } else if (type === "image") {
      const img = new Image();
      img.onload = () => resolve([img.width, img.height]);
      img.src = dataURL;
      img.onerror = (err) => reject(err);
    } else if (type === "pdf") {
      resolve([595, 842]);
    }
  });
}
function getFirstFromSet(set4) {
  return set4.values().next().value;
}

// ../../packages/core/src/utils/TextUtils.ts
var _TextUtils = class {
  static insertTextFirefox(field, text) {
    field.setRangeText(
      text,
      field.selectionStart || 0,
      field.selectionEnd || 0,
      "end"
    );
    field.dispatchEvent(
      new InputEvent("input", {
        data: text,
        inputType: "insertText",
        isComposing: false
      })
    );
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
    return field.value.slice(
      selectionStart ? selectionStart : void 0,
      selectionEnd ? selectionEnd : void 0
    );
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
    var _a3;
    const { selectionStart, selectionEnd, value } = element;
    const selectedContrast = value.slice(selectionStart, selectionEnd);
    const lineBreakCount = (_a3 = /\n/g.exec(selectedContrast)) == null ? void 0 : _a3.length;
    if (lineBreakCount && lineBreakCount > 0) {
      const firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const newSelection = element.value.slice(firstLineStart, selectionEnd - 1);
      const indentedText = newSelection.replace(
        /^|\n/g,
        `$&${_TextUtils.INDENT}`
      );
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
    element.setSelectionRange(
      selectionStart - difference,
      Math.max(newSelectionStart, selectionEnd - replacementsCount)
    );
  }
  static normalizeText(text) {
    return text.replace(_TextUtils.fixNewLines, "\n");
  }
};
var TextUtils = _TextUtils;
__publicField(TextUtils, "fixNewLines", /\r?\n|\r/g);
__publicField(TextUtils, "INDENT", "  ");

// ../../packages/core/src/utils/ColorUtils.ts
function isBuiltInColor(color) {
  return Object.values(Color).includes(color);
}
function getComputedColor(color, type) {
  if (isBuiltInColor(color) || color == null) {
    return `var(--ls-wb-${type}-color-${color ? color : "default"})`;
  }
  return color;
}

// ../../packages/core/src/utils/getTextSize.ts
var melm;
function getMeasurementDiv() {
  var _a3;
  (_a3 = document.getElementById("__textLabelMeasure")) == null ? void 0 : _a3.remove();
  const pre = document.createElement("pre");
  pre.id = "__textLabelMeasure";
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
    pointerEvents: "none",
    font: "var(--ls-font-family)"
  });
  pre.tabIndex = -1;
  document.body.appendChild(pre);
  return pre;
}
if (typeof window !== "undefined") {
  melm = getMeasurementDiv();
}
var cache2 = /* @__PURE__ */ new Map();
var getKey = (text, font5, padding) => {
  return `${text}-${font5}-${padding}`;
};
var hasCached = (text, font5, padding) => {
  const key = getKey(text, font5, padding);
  return cache2.has(key);
};
var getCached = (text, font5, padding) => {
  const key = getKey(text, font5, padding);
  return cache2.get(key);
};
var saveCached = (text, font5, padding, size) => {
  const key = getKey(text, font5, padding);
  cache2.set(key, size);
};
function getTextLabelSize(text, fontOrStyles, padding = 0) {
  var _a3, _b, _c;
  if (!text) {
    return [16, 32];
  }
  let font5;
  if (typeof fontOrStyles === "string") {
    font5 = fontOrStyles;
  } else {
    font5 = `${(_a3 = fontOrStyles.fontStyle) != null ? _a3 : "normal"} ${(_b = fontOrStyles.fontVariant) != null ? _b : "normal"} ${(_c = fontOrStyles.fontWeight) != null ? _c : "normal"} ${fontOrStyles.fontSize}px/${fontOrStyles.fontSize * fontOrStyles.lineHeight}px ${fontOrStyles.fontFamily}`;
  }
  if (!hasCached(text, font5, padding)) {
    if (!melm) {
      return [10, 10];
    }
    if (!melm.parentNode)
      document.body.appendChild(melm);
    melm.innerHTML = `${text}&#8203;`;
    melm.style.font = font5;
    melm.style.padding = padding + "px";
    const rect = melm.getBoundingClientRect();
    const width = Math.ceil(rect.width || 1);
    const height = Math.ceil(rect.height || 1);
    saveCached(text, font5, padding, [width, height]);
  }
  return getCached(text, font5, padding);
}

// ../../packages/core/src/utils/index.ts
function uniqueId() {
  return v1_default();
}
function validUUID(input) {
  try {
    parse_default(input);
    return true;
  } catch (e) {
    return false;
  }
}
function debounce(fn, ms = 0, immediateFn = void 0) {
  let timeoutId;
  return function(...args) {
    immediateFn == null ? void 0 : immediateFn(...args);
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(args), ms);
  };
}
function dedupe(arr) {
  return [...new Set(arr)];
}
function lerp(a3, b3, t) {
  return a3 + (b3 - a3) * t;
}
function isDarwin() {
  return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
}
function isDev() {
  var _a3, _b, _c;
  return ((_c = (_b = (_a3 = window == null ? void 0 : window.logseq) == null ? void 0 : _a3.api) == null ? void 0 : _b.get_state_from_store) == null ? void 0 : _c.call(_b, "ui/developer-mode?")) || false;
}
function isSafari() {
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes("webkit") && !ua.includes("chrome");
}
function modKey(e) {
  return isDarwin() ? e.metaKey : e.ctrlKey;
}
var MOD_KEY = isDarwin() ? "\u2318" : "ctrl";
function isNonNullable(value) {
  return Boolean(value);
}
function delay(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ../../packages/react/src/lib/TLReactApp.ts
var TLReactApp = class extends TLApp {
};

// ../../packages/react/src/hooks/useBoundsEvents.ts
var React2 = __toESM(require("react"));

// ../../packages/react/src/constants.ts
var PI3 = Math.PI;
var TAU2 = PI3 / 2;
var PI22 = PI3 * 2;
var EPSILON2 = Math.PI / 180;
var DOUBLE_CLICK_DURATION = 300;
var NOOP = () => void 0;
var isSafari2 = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var CURSORS2 = {
  canvas: "default",
  grab: "grab",
  grabbing: "grabbing",
  ["top_left_corner" /* TopLeft */]: "resize-nwse",
  ["top_right_corner" /* TopRight */]: "resize-nesw",
  ["bottom_right_corner" /* BottomRight */]: "resize-nwse",
  ["bottom_left_corner" /* BottomLeft */]: "resize-nesw",
  ["top_edge" /* Top */]: "resize-ns",
  ["right_edge" /* Right */]: "resize-ew",
  ["bottom_edge" /* Bottom */]: "resize-ns",
  ["left_edge" /* Left */]: "resize-ew"
};

// ../../packages/react/src/hooks/useRendererContext.ts
var React = __toESM(require("react"));
var contextMap = {};
function getRendererContext(id3 = "noid") {
  if (!contextMap[id3]) {
    contextMap[id3] = React.createContext({});
  }
  return contextMap[id3];
}
function useRendererContext(id3 = "noid") {
  return React.useContext(getRendererContext(id3));
}

// ../../packages/react/src/hooks/useBoundsEvents.ts
function useBoundsEvents(handle) {
  const { callbacks } = useRendererContext();
  const rDoubleClickTimer = React2.useRef(-1);
  const events = React2.useMemo(() => {
    const onPointerMove = (e) => {
      var _a3;
      const { order = 0 } = e;
      if (order)
        return;
      (_a3 = callbacks.onPointerMove) == null ? void 0 : _a3.call(callbacks, { type: "selection" /* Selection */, handle, order }, e);
      e.order = order + 1;
    };
    const onPointerDown = (e) => {
      var _a3;
      const { order = 0 } = e;
      if (order)
        return;
      const elm = loopToHtmlElement(e.currentTarget);
      elm.setPointerCapture(e.pointerId);
      elm.addEventListener("pointerup", onPointerUp);
      (_a3 = callbacks.onPointerDown) == null ? void 0 : _a3.call(callbacks, { type: "selection" /* Selection */, handle, order }, e);
      e.order = order + 1;
    };
    const onPointerUp = (e) => {
      var _a3, _b;
      const { order = 0 } = e;
      if (order)
        return;
      const elm = e.target;
      elm.removeEventListener("pointerup", onPointerUp);
      elm.releasePointerCapture(e.pointerId);
      (_a3 = callbacks.onPointerUp) == null ? void 0 : _a3.call(callbacks, { type: "selection" /* Selection */, handle, order }, e);
      const now = Date.now();
      const elapsed = now - rDoubleClickTimer.current;
      if (elapsed > DOUBLE_CLICK_DURATION) {
        rDoubleClickTimer.current = now;
      } else {
        if (elapsed <= DOUBLE_CLICK_DURATION) {
          (_b = callbacks.onDoubleClick) == null ? void 0 : _b.call(callbacks, { type: "selection" /* Selection */, handle, order }, e);
          rDoubleClickTimer.current = -1;
        }
      }
      e.order = order + 1;
    };
    const onPointerEnter = (e) => {
      var _a3;
      const { order = 0 } = e;
      if (order)
        return;
      (_a3 = callbacks.onPointerEnter) == null ? void 0 : _a3.call(callbacks, { type: "selection" /* Selection */, handle, order }, e);
      e.order = order + 1;
    };
    const onPointerLeave = (e) => {
      var _a3;
      const { order = 0 } = e;
      if (order)
        return;
      (_a3 = callbacks.onPointerLeave) == null ? void 0 : _a3.call(callbacks, { type: "selection" /* Selection */, handle, order }, e);
      e.order = order + 1;
    };
    const onKeyDown = (e) => {
      var _a3;
      (_a3 = callbacks.onKeyDown) == null ? void 0 : _a3.call(callbacks, { type: "selection" /* Selection */, handle, order: -1 }, e);
    };
    const onKeyUp = (e) => {
      var _a3;
      (_a3 = callbacks.onKeyUp) == null ? void 0 : _a3.call(callbacks, { type: "selection" /* Selection */, handle, order: -1 }, e);
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
  var _a3;
  if ((_a3 = elm.namespaceURI) == null ? void 0 : _a3.endsWith("svg")) {
    if (elm.parentElement)
      return loopToHtmlElement(elm.parentElement);
    else
      throw Error("Could not find a parent element of an HTML type!");
  }
  return elm;
}

// ../../packages/react/src/hooks/useResizeObserver.ts
var React3 = __toESM(require("react"));
var getNearestScrollableContainer = (element) => {
  let parent = element.parentElement;
  while (parent) {
    if (parent === document.body) {
      return document;
    }
    const { overflowY } = window.getComputedStyle(parent);
    const hasScrollableContent = parent.scrollHeight > parent.clientHeight;
    if (hasScrollableContent && (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay")) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return document;
};
function useResizeObserver(ref, viewport, onBoundsChange) {
  const rIsMounted = React3.useRef(false);
  const updateBounds = React3.useCallback(() => {
    var _a3;
    if (rIsMounted.current) {
      const rect = (_a3 = ref.current) == null ? void 0 : _a3.getBoundingClientRect();
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
  React3.useEffect(() => {
    const scrollingAnchor = ref.current ? getNearestScrollableContainer(ref.current) : document;
    const debouncedupdateBounds = debounce(updateBounds, 100);
    scrollingAnchor.addEventListener("scroll", debouncedupdateBounds);
    window.addEventListener("resize", debouncedupdateBounds);
    return () => {
      scrollingAnchor.removeEventListener("scroll", debouncedupdateBounds);
      window.removeEventListener("resize", debouncedupdateBounds);
    };
  }, []);
  React3.useLayoutEffect(() => {
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
  React3.useEffect(() => {
    updateBounds();
    setTimeout(() => {
      var _a3, _b;
      (_b = (_a3 = ref.current) == null ? void 0 : _a3.querySelector(".tl-canvas")) == null ? void 0 : _b.focus();
    });
  }, [ref]);
}

// ../../packages/react/src/hooks/useStylesheet.ts
var React4 = __toESM(require("react"));
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
function useTheme(prefix, theme, selector = ".logseq-tldraw") {
  React4.useLayoutEffect(() => {
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
  React4.useLayoutEffect(() => {
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
var css = (strings, ...args) => strings.reduce(
  (acc, string, index2) => acc + string + (index2 < args.length ? args[index2] : ""),
  ""
);
var defaultTheme = {
  accent: "var(--lx-accent-09, hsl(var(--primary)))",
  brushFill: "var(--ls-scrollbar-background-color, rgba(0, 0, 0, .05))",
  brushStroke: "var(--ls-scrollbar-thumb-hover-color, rgba(0, 0, 0, .05))",
  selectStroke: "var(--color-selectedStroke)",
  selectFill: "var(--color-selectedFill)",
  binding: "var(--color-binding, rgba(65, 132, 244, 0.5))",
  background: "var(--ls-primary-background-color, hsl(var(--background)))",
  foreground: "var(--ls-primary-text-color, hsl(var(--foreground)))",
  grid: "var(--ls-quaternary-background-color, hsl(var(--secondary)))"
};
var tlcss = css`
  .tl-container {
    --tl-zoom: 1;
    --tl-scale: calc(1 / var(--tl-zoom));
    --tl-padding: calc(64px / var(--tl-zoom));;
    --tl-shadow-color: 0deg 0% 0%;
    --tl-binding-distance: ${BINDING_DISTANCE}px;
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
    cursor: inherit;
    box-sizing: border-box;
    color: var(--tl-foreground);
    -webkit-user-select: none;
    -webkit-user-drag: none;
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

  .tl-clone-handle {
    stroke: var(--tl-selectStroke);
    fill: var(--tl-background);
    stroke-width: calc(1.5px * var(--tl-scale));
  }

  .tl-clone-handle:hover {
    fill: var(--tl-selectStroke);
    cursor: pointer;
  }

  .tl-clone-handle:hover line {
    stroke: var(--tl-background);
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
    fill: transparent;
    stroke: var(--tl-binding);
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

  .tl-grid-canvas {
    position: absolute;
    touch-action: none;
    pointer-events: none;
    user-select: none;
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
  const tltheme = React4.useMemo(
    () => __spreadValues(__spreadValues({}, defaultTheme), theme),
    [theme]
  );
  useTheme("tl", tltheme, selector);
  useStyle("tl-canvas", tlcss);
}

// ../../packages/react/src/hooks/useCanvasEvents.ts
var React6 = __toESM(require("react"));

// ../../packages/react/src/hooks/useApp.ts
var React5 = __toESM(require("react"));
var contextMap2 = {};
function getAppContext(id3 = "noid") {
  if (!contextMap2[id3]) {
    contextMap2[id3] = React5.createContext({});
  }
  return contextMap2[id3];
}
function useApp(id3 = "noid") {
  return React5.useContext(getAppContext(id3));
}

// ../../packages/react/src/hooks/useCanvasEvents.ts
function useCanvasEvents() {
  const app = useApp();
  const { callbacks } = useRendererContext();
  const rDoubleClickTimer = React6.useRef(-1);
  const events = React6.useMemo(() => {
    const onPointerMove = (e) => {
      var _a3;
      if (app.settings.penMode && (e.pointerType !== "pen" || !e.isPrimary)) {
        return;
      }
      const { order = 0 } = e;
      (_a3 = callbacks.onPointerMove) == null ? void 0 : _a3.call(callbacks, { type: "canvas" /* Canvas */, order }, e);
    };
    const onPointerDown = (e) => {
      var _a3, _b, _c;
      if (app.settings.penMode && (e.pointerType !== "pen" || !e.isPrimary)) {
        return;
      }
      const { order = 0 } = e;
      if (!order)
        (_a3 = e.currentTarget) == null ? void 0 : _a3.setPointerCapture(e.pointerId);
      if (!e.isPrimary) {
        return;
      }
      (_b = callbacks.onPointerDown) == null ? void 0 : _b.call(callbacks, { type: "canvas" /* Canvas */, order }, e);
      const now = Date.now();
      const elapsed = now - rDoubleClickTimer.current;
      if (elapsed > DOUBLE_CLICK_DURATION) {
        rDoubleClickTimer.current = now;
      } else {
        if (elapsed <= DOUBLE_CLICK_DURATION) {
          (_c = callbacks.onDoubleClick) == null ? void 0 : _c.call(callbacks, { type: "canvas" /* Canvas */, order }, e);
          rDoubleClickTimer.current = -1;
        }
      }
    };
    const onPointerUp = (e) => {
      var _a3, _b;
      if (app.settings.penMode && (e.pointerType !== "pen" || !e.isPrimary)) {
        return;
      }
      const { order = 0 } = e;
      if (!order)
        (_a3 = e.currentTarget) == null ? void 0 : _a3.releasePointerCapture(e.pointerId);
      (_b = callbacks.onPointerUp) == null ? void 0 : _b.call(callbacks, { type: "canvas" /* Canvas */, order }, e);
    };
    const onPointerEnter = (e) => {
      var _a3;
      if (app.settings.penMode && (e.pointerType !== "pen" || !e.isPrimary)) {
        return;
      }
      const { order = 0 } = e;
      (_a3 = callbacks.onPointerEnter) == null ? void 0 : _a3.call(callbacks, { type: "canvas" /* Canvas */, order }, e);
    };
    const onPointerLeave = (e) => {
      var _a3;
      if (app.settings.penMode && (e.pointerType !== "pen" || !e.isPrimary)) {
        return;
      }
      const { order = 0 } = e;
      (_a3 = callbacks.onPointerLeave) == null ? void 0 : _a3.call(callbacks, { type: "canvas" /* Canvas */, order }, e);
    };
    const onDrop = (e) => __async(this, null, function* () {
      e.preventDefault();
      if ("clientX" in e) {
        const point = [e.clientX, e.clientY];
        app.drop(e.dataTransfer, point);
      }
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
      onDragOver,
      onTouchEnd: (e) => {
        let tool = app.selectedTool.id;
        if (tool === "pencil" || tool === "highlighter") {
          e.preventDefault();
        }
      }
    };
  }, [callbacks]);
  return events;
}

// ../../node_modules/@use-gesture/core/dist/maths-b28d9b98.esm.js
function clamp2(v2, min, max) {
  return Math.max(min, Math.min(v2, max));
}
var V = {
  toVector(v2, fallback) {
    if (v2 === void 0)
      v2 = fallback;
    return Array.isArray(v2) ? v2 : [v2, v2];
  },
  add(v12, v2) {
    return [v12[0] + v2[0], v12[1] + v2[1]];
  },
  sub(v12, v2) {
    return [v12[0] - v2[0], v12[1] - v2[1]];
  },
  addTo(v12, v2) {
    v12[0] += v2[0];
    v12[1] += v2[1];
  },
  subTo(v12, v2) {
    v12[0] -= v2[0];
    v12[1] -= v2[1];
  }
};
function rubberband(distance, dimension, constant) {
  if (dimension === 0 || Math.abs(dimension) === Infinity)
    return Math.pow(distance, constant * 5);
  return distance * dimension * constant / (dimension + constant * distance);
}
function rubberbandIfOutOfBounds(position, min, max, constant = 0.15) {
  if (constant === 0)
    return clamp2(position, min, max);
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

// ../../node_modules/@use-gesture/core/dist/actions-e3d93fde.esm.js
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
    enumerableOnly && (symbols = symbols.filter(function(sym) {
      return Object.getOwnPropertyDescriptor(object2, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i2 = 1; i2 < arguments.length; i2++) {
    var source = null != arguments[i2] ? arguments[i2] : {};
    i2 % 2 ? ownKeys3(Object(source), true).forEach(function(key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys3(Object(source)).forEach(function(key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
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
var actionsWithoutCaptureSupported = ["enter", "leave"];
function hasCapture(capture = false, actionKey) {
  return capture && !actionsWithoutCaptureSupported.includes(actionKey);
}
function toHandlerProp(device, action2 = "", capture = false) {
  const deviceProps = EVENT_TYPE_MAP[device];
  const actionKey = deviceProps ? deviceProps[action2] || action2 : action2;
  return "on" + capitalize(device) + capitalize(actionKey) + (hasCapture(capture, actionKey) ? "Capture" : "");
}
var pointerCaptureEvents = ["gotpointercapture", "lostpointercapture"];
function parseProp(prop) {
  let eventKey = prop.substring(2).toLowerCase();
  const passive = !!~eventKey.indexOf("passive");
  if (passive)
    eventKey = eventKey.replace("passive", "");
  const captureKey = pointerCaptureEvents.includes(eventKey) ? "capturecapture" : "capture";
  const capture = !!~eventKey.indexOf(captureKey);
  if (capture)
    eventKey = eventKey.replace("capture", "");
  return {
    device: eventKey,
    capture,
    passive
  };
}
function toDomEventType(device, action2 = "") {
  const deviceProps = EVENT_TYPE_MAP[device];
  const actionKey = deviceProps ? deviceProps[action2] || action2 : action2;
  return device + actionKey;
}
function isTouch(event) {
  return "touches" in event;
}
function getPointerType(event) {
  if (isTouch(event))
    return "touch";
  if ("pointerType" in event)
    return event.pointerType;
  return "mouse";
}
function getCurrentTargetTouchList(event) {
  return Array.from(event.touches).filter((e) => {
    var _event$currentTarget, _event$currentTarget$;
    return e.target === event.currentTarget || ((_event$currentTarget = event.currentTarget) === null || _event$currentTarget === void 0 ? void 0 : (_event$currentTarget$ = _event$currentTarget.contains) === null || _event$currentTarget$ === void 0 ? void 0 : _event$currentTarget$.call(_event$currentTarget, e.target));
  });
}
function getTouchList(event) {
  return event.type === "touchend" || event.type === "touchcancel" ? event.changedTouches : event.targetTouches;
}
function getValueEvent(event) {
  return isTouch(event) ? getTouchList(event)[0] : event;
}
function distanceAngle(P1, P2) {
  const dx = P2.clientX - P1.clientX;
  const dy = P2.clientY - P1.clientY;
  const cx2 = (P2.clientX + P1.clientX) / 2;
  const cy = (P2.clientY + P1.clientY) / 2;
  const distance = Math.hypot(dx, dy);
  const angle = -(Math.atan2(dx, dy) * 180) / Math.PI;
  const origin = [cx2, cy];
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
function call(v2, ...args) {
  if (typeof v2 === "function") {
    return v2(...args);
  } else {
    return v2;
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
      this.state = {};
      this.computeValues([0, 0]);
      this.computeInitial();
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
      ingKey,
      args
    } = this;
    shared[ingKey] = state._active = state.active = state._blocked = state._force = false;
    state._step = [false, false];
    state.intentional = false;
    state._movement = [0, 0];
    state._distance = [0, 0];
    state._direction = [0, 0];
    state._delta = [0, 0];
    state._bounds = [[-Infinity, Infinity], [-Infinity, Infinity]];
    state.args = args;
    state.axis = void 0;
    state.memo = void 0;
    state.elapsedTime = 0;
    state.direction = [0, 0];
    state.distance = [0, 0];
    state.overflow = [0, 0];
    state._movementBound = [false, false];
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
      this.computeInitial();
      state._active = true;
      state.target = event.target;
      state.currentTarget = event.currentTarget;
      state.lastOffset = config.from ? call(config.from, state) : state.offset;
      state.offset = state.lastOffset;
    }
    state.startTime = state.timeStamp = event.timeStamp;
  }
  computeValues(values) {
    const state = this.state;
    state._values = values;
    state.values = this.config.transform(values);
  }
  computeInitial() {
    const state = this.state;
    state._initial = state._values;
    state.initial = state.values;
  }
  compute(event) {
    const {
      state,
      config,
      shared
    } = this;
    state.args = this.args;
    let dt2 = 0;
    if (event) {
      state.event = event;
      if (config.preventDefault && event.cancelable)
        state.event.preventDefault();
      state.type = event.type;
      shared.touches = this.ctrl.pointerIds.size || this.ctrl.touchIds.size;
      shared.locked = !!document.pointerLockElement;
      Object.assign(shared, getEventDetails(event));
      shared.down = shared.pressed = shared.buttons % 2 === 1 || shared.touches > 0;
      dt2 = event.timeStamp - state.timeStamp;
      state.timeStamp = event.timeStamp;
      state.elapsedTime = state.timeStamp - state.startTime;
    }
    if (state._active) {
      const _absoluteDelta = state._delta.map(Math.abs);
      V.addTo(state._distance, _absoluteDelta);
    }
    if (this.axisIntent)
      this.axisIntent(event);
    const [_m0, _m1] = state._movement;
    const [t0, t1] = config.threshold;
    const {
      _step,
      values
    } = state;
    if (config.hasCustomTransform) {
      if (_step[0] === false)
        _step[0] = Math.abs(_m0) >= t0 && values[0];
      if (_step[1] === false)
        _step[1] = Math.abs(_m1) >= t1 && values[1];
    } else {
      if (_step[0] === false)
        _step[0] = Math.abs(_m0) >= t0 && Math.sign(_m0) * t0;
      if (_step[1] === false)
        _step[1] = Math.abs(_m1) >= t1 && Math.sign(_m1) * t1;
    }
    state.intentional = _step[0] !== false || _step[1] !== false;
    if (!state.intentional)
      return;
    const movement = [0, 0];
    if (config.hasCustomTransform) {
      const [v0, v12] = values;
      movement[0] = _step[0] !== false ? v0 - _step[0] : 0;
      movement[1] = _step[1] !== false ? v12 - _step[1] : 0;
    } else {
      movement[0] = _step[0] !== false ? _m0 - _step[0] : 0;
      movement[1] = _step[1] !== false ? _m1 - _step[1] : 0;
    }
    if (this.restrictToAxis && !state._blocked)
      this.restrictToAxis(movement);
    const previousOffset = state.offset;
    const gestureIsActive = state._active && !state._blocked || state.active;
    if (gestureIsActive) {
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
        this.computeOffset();
      }
    }
    const [ox, oy] = state.offset;
    const [[x0, x1], [y0, y1]] = state._bounds;
    state.overflow = [ox < x0 ? -1 : ox > x1 ? 1 : 0, oy < y0 ? -1 : oy > y1 ? 1 : 0];
    state._movementBound[0] = state.overflow[0] ? state._movementBound[0] === false ? state._movement[0] : state._movementBound[0] : false;
    state._movementBound[1] = state.overflow[1] ? state._movementBound[1] === false ? state._movement[1] : state._movementBound[1] : false;
    const rubberband2 = state._active ? config.rubberband || [0, 0] : [0, 0];
    state.offset = computeRubberband(state._bounds, state.offset, rubberband2);
    state.delta = V.sub(state.offset, previousOffset);
    this.computeMovement();
    if (gestureIsActive && (!state.last || dt2 > BEFORE_LAST_KINEMATICS_DELAY)) {
      state.delta = V.sub(state.offset, previousOffset);
      const absoluteDelta = state.delta.map(Math.abs);
      V.addTo(state.distance, absoluteDelta);
      state.direction = state.delta.map(Math.sign);
      state._direction = state._delta.map(Math.sign);
      if (!state.first && dt2 > 0) {
        state.velocity = [absoluteDelta[0] / dt2, absoluteDelta[1] / dt2];
      }
    }
  }
  emit() {
    const state = this.state;
    const shared = this.shared;
    const config = this.config;
    if (!state._active)
      this.clean();
    if ((state._blocked || !state.intentional) && !state._force && !config.triggerAllEvents)
      return;
    const memo6 = this.handler(_objectSpread2(_objectSpread2(_objectSpread2({}, shared), state), {}, {
      [this.aliasKey]: state.values
    }));
    if (memo6 !== void 0)
      state.memo = memo6;
  }
  clean() {
    this.eventStore.clean();
    this.timeoutStore.clean();
  }
};
function selectAxis([dx, dy], threshold) {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx > absDy && absDx > threshold) {
    return "x";
  }
  if (absDy > absDx && absDy > threshold) {
    return "y";
  }
  return void 0;
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
  axisIntent(event) {
    const state = this.state;
    const config = this.config;
    if (!state.axis && event) {
      const threshold = typeof config.axisThreshold === "object" ? config.axisThreshold[getPointerType(event)] : config.axisThreshold;
      state.axis = selectAxis(state._movement, threshold);
    }
    state._blocked = (config.lockDirection || !!config.axis) && !state.axis || !!config.axis && config.axis !== state.axis;
  }
  restrictToAxis(v2) {
    if (this.config.axis || this.config.lockDirection) {
      switch (this.state.axis) {
        case "x":
          v2[1] = 0;
          break;
        case "y":
          v2[0] = 0;
          break;
      }
    }
  }
};
var identity = (v2) => v2;
var DEFAULT_RUBBERBAND = 0.15;
var commonConfigResolver = {
  enabled(value = true) {
    return value;
  },
  eventOptions(value, _k, config) {
    return _objectSpread2(_objectSpread2({}, config.shared.eventOptions), value);
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
    const transform = value || config.shared.transform;
    this.hasCustomTransform = !!transform;
    if (false) {
      const originalTransform = transform || identity;
      return (v2) => {
        const r2 = originalTransform(v2);
        if (!isFinite(r2[0]) || !isFinite(r2[1])) {
          console.warn(`[@use-gesture]: config.transform() must produce a valid result, but it was: [${r2[0]},${[1]}]`);
        }
        return r2;
      };
    }
    return transform || identity;
  },
  threshold(value) {
    return V.toVector(value, 0);
  }
};
if (false) {
  Object.assign(commonConfigResolver, {
    domTarget(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`domTarget\` option has been renamed to \`target\`.`);
      }
      return NaN;
    },
    lockDirection(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`lockDirection\` option has been merged with \`axis\`. Use it as in \`{ axis: 'lock' }\``);
      }
      return NaN;
    },
    initial(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`initial\` option has been renamed to \`from\`.`);
      }
      return NaN;
    }
  });
}
var DEFAULT_AXIS_THRESHOLD = 0;
var coordinatesConfigResolver = _objectSpread2(_objectSpread2({}, commonConfigResolver), {}, {
  axis(_v, _k, {
    axis
  }) {
    this.lockDirection = axis === "lock";
    if (!this.lockDirection)
      return axis;
  },
  axisThreshold(value = DEFAULT_AXIS_THRESHOLD) {
    return value;
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
    const ctrlIds = this.ctrl.setEventIds(event);
    if (config.pointerCapture) {
      event.target.setPointerCapture(event.pointerId);
    }
    if (ctrlIds && ctrlIds.size > 1 && state._pointerActive)
      return;
    this.start(event);
    this.setupPointer(event);
    state._pointerId = pointerId(event);
    state._pointerActive = true;
    this.computeValues(pointerValues(event));
    this.computeInitial();
    if (config.preventScrollAxis && getPointerType(event) !== "mouse") {
      state._active = false;
      this.setupScrollPrevention(event);
    } else if (config.delay > 0) {
      this.setupDelayTrigger(event);
      if (config.triggerAllEvents) {
        this.compute(event);
        this.emit();
      }
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
    const id3 = pointerId(event);
    if (state._pointerId !== void 0 && id3 !== state._pointerId)
      return;
    const _values = pointerValues(event);
    if (document.pointerLockElement === event.target) {
      state._delta = [event.movementX, event.movementY];
    } else {
      state._delta = V.sub(_values, state._values);
      this.computeValues(_values);
    }
    V.addTo(state._movement, state._delta);
    this.compute(event);
    if (state._delayed && state.intentional) {
      this.timeoutStore.remove("dragDelay");
      state.active = false;
      this.startPointerDrag(event);
      return;
    }
    if (config.preventScrollAxis && !state._preventScroll) {
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
      if (false) {
        console.warn(`[@use-gesture]: If you see this message, it's likely that you're using an outdated version of \`@react-three/fiber\`. 

Please upgrade to the latest version.`);
      }
    }
    const state = this.state;
    const config = this.config;
    if (!state._active || !state._pointerActive)
      return;
    const id3 = pointerId(event);
    if (state._pointerId !== void 0 && id3 !== state._pointerId)
      return;
    this.state._pointerActive = false;
    this.setActive();
    this.compute(event);
    const [dx, dy] = state._distance;
    state.tap = dx <= config.tapsThreshold && dy <= config.tapsThreshold;
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
    if (!this.state.tap && event.detail > 0) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  setupPointer(event) {
    const config = this.config;
    const device = config.device;
    if (false) {
      try {
        if (device === "pointer" && config.preventScrollDelay === void 0) {
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
      this.eventStore.add(this.sharedConfig.window, device, "cancel", this.pointerUp.bind(this));
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
    this.state._preventScroll = false;
    persistEvent(event);
    const remove2 = this.eventStore.add(this.sharedConfig.window, "touch", "change", this.preventScroll.bind(this), {
      passive: false
    });
    this.eventStore.add(this.sharedConfig.window, "touch", "end", remove2);
    this.eventStore.add(this.sharedConfig.window, "touch", "cancel", remove2);
    this.timeoutStore.add("startPointerDrag", this.startPointerDrag.bind(this), this.config.preventScrollDelay, event);
  }
  setupDelayTrigger(event) {
    this.state._delayed = true;
    this.timeoutStore.add("dragDelay", () => {
      this.state._step = [0, 0];
      this.startPointerDrag(event);
    }, this.config.delay);
  }
  keyDown(event) {
    const deltaFn = KEYS_DELTA_MAP[event.key];
    if (deltaFn) {
      const state = this.state;
      const factor = event.shiftKey ? 10 : event.altKey ? 0.1 : 1;
      this.start(event);
      state._delta = deltaFn(factor);
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
      bindFunction("lostPointerCapture", "", this.pointerUp.bind(this));
    }
    if (this.config.keys) {
      bindFunction("key", "down", this.keyDown.bind(this));
      bindFunction("key", "up", this.keyUp.bind(this));
    }
    if (this.config.filterTaps) {
      bindFunction("click", "", this.pointerClick.bind(this), {
        capture: true,
        passive: false
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
  touch: isTouchScreen(),
  touchscreen: isTouchScreen(),
  pointer: supportsPointerEvents(),
  pointerLock: supportsPointerLock()
};
var DEFAULT_PREVENT_SCROLL_DELAY = 250;
var DEFAULT_DRAG_DELAY = 180;
var DEFAULT_SWIPE_VELOCITY = 0.5;
var DEFAULT_SWIPE_DISTANCE = 50;
var DEFAULT_SWIPE_DURATION = 250;
var DEFAULT_DRAG_AXIS_THRESHOLD = {
  mouse: 0,
  touch: 0,
  pen: 8
};
var dragConfigResolver = _objectSpread2(_objectSpread2({}, coordinatesConfigResolver), {}, {
  device(_v, _k, {
    pointer: {
      touch = false,
      lock = false,
      mouse = false
    } = {}
  }) {
    this.pointerLock = lock && SUPPORT.pointerLock;
    if (SUPPORT.touch && touch)
      return "touch";
    if (this.pointerLock)
      return "mouse";
    if (SUPPORT.pointer && !mouse)
      return "pointer";
    if (SUPPORT.touch)
      return "touch";
    return "mouse";
  },
  preventScrollAxis(value, _k, {
    preventScroll
  }) {
    this.preventScrollDelay = typeof preventScroll === "number" ? preventScroll : preventScroll || preventScroll === void 0 && value ? DEFAULT_PREVENT_SCROLL_DELAY : void 0;
    if (!SUPPORT.touchscreen || preventScroll === false)
      return void 0;
    return value ? value : preventScroll !== void 0 ? "y" : void 0;
  },
  pointerCapture(_v, _k, {
    pointer: {
      capture = true,
      buttons = 1,
      keys = true
    } = {}
  }) {
    this.pointerButtons = buttons;
    this.keys = keys;
    return !this.pointerLock && this.device === "pointer" && capture;
  },
  threshold(value, _k, {
    filterTaps = false,
    tapsThreshold = 3,
    axis = void 0
  }) {
    const threshold = V.toVector(value, filterTaps ? tapsThreshold : axis ? 1 : 0);
    this.filterTaps = filterTaps;
    this.tapsThreshold = tapsThreshold;
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
  },
  axisThreshold(value) {
    if (!value)
      return DEFAULT_DRAG_AXIS_THRESHOLD;
    return _objectSpread2(_objectSpread2({}, DEFAULT_DRAG_AXIS_THRESHOLD), value);
  }
});
if (false) {
  Object.assign(dragConfigResolver, {
    useTouch(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`useTouch\` option has been renamed to \`pointer.touch\`. Use it as in \`{ pointer: { touch: true } }\`.`);
      }
      return NaN;
    },
    experimental_preventWindowScrollY(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`experimental_preventWindowScrollY\` option has been renamed to \`preventScroll\`.`);
      }
      return NaN;
    },
    swipeVelocity(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`swipeVelocity\` option has been renamed to \`swipe.velocity\`. Use it as in \`{ swipe: { velocity: 0.5 } }\`.`);
      }
      return NaN;
    },
    swipeDistance(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`swipeDistance\` option has been renamed to \`swipe.distance\`. Use it as in \`{ swipe: { distance: 50 } }\`.`);
      }
      return NaN;
    },
    swipeDuration(value) {
      if (value !== void 0) {
        throw Error(`[@use-gesture]: \`swipeDuration\` option has been renamed to \`swipe.duration\`. Use it as in \`{ swipe: { duration: 250 } }\`.`);
      }
      return NaN;
    }
  });
}
function clampStateInternalMovementToBounds(state) {
  const [ox, oy] = state.overflow;
  const [dx, dy] = state._delta;
  const [dirx, diry] = state._direction;
  if (ox < 0 && dx > 0 && dirx < 0 || ox > 0 && dx < 0 && dirx > 0) {
    state._movement[0] = state._movementBound[0];
  }
  if (oy < 0 && dy > 0 && diry < 0 || oy > 0 && dy < 0 && diry > 0) {
    state._movement[1] = state._movementBound[1];
  }
}
var SCALE_ANGLE_RATIO_INTENT_DEG = 30;
var PINCH_WHEEL_RATIO = 100;
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
  axisIntent() {
    const state = this.state;
    const [_m0, _m1] = state._movement;
    if (!state.axis) {
      const axisMovementDifference = Math.abs(_m0) * SCALE_ANGLE_RATIO_INTENT_DEG - Math.abs(_m1);
      if (axisMovementDifference < 0)
        state.axis = "angle";
      else if (axisMovementDifference > 0)
        state.axis = "scale";
    }
  }
  restrictToAxis(v2) {
    if (this.config.lockDirection) {
      if (this.state.axis === "scale")
        v2[1] = 0;
      else if (this.state.axis === "angle")
        v2[0] = 0;
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
      if (state._touchIds.every((id3) => ctrlTouchIds.has(id3)))
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
      if (Array.from(_pointerEvents.keys()).every((id3) => ctrlPointerIds.has(id3)))
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
    this.computeValues([payload.distance, payload.angle]);
    this.computeInitial();
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
    const prev_a = state._values[1];
    const delta_a = payload.angle - prev_a;
    let delta_turns = 0;
    if (Math.abs(delta_a) > 270)
      delta_turns += Math.sign(delta_a);
    this.computeValues([payload.distance, payload.angle - 360 * delta_turns]);
    state.origin = payload.origin;
    state.turns = delta_turns;
    state._movement = [state._values[0] / state._initial[0] - 1, state._values[1] - state._initial[1]];
    this.compute(event);
    this.emit();
  }
  touchEnd(event) {
    this.ctrl.setEventIds(event);
    if (!this.state._active)
      return;
    if (this.state._touchIds.some((id3) => !this.ctrl.touchIds.has(id3))) {
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
    this.computeValues([event.scale, event.rotation]);
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
    this.computeValues([event.scale, event.rotation]);
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
    const modifierKey = this.config.modifierKey;
    if (modifierKey && !event[modifierKey])
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
      if (false) {
        console.warn(`[@use-gesture]: To properly support zoom on trackpads, try using the \`target\` option.

This message will only appear in development mode.`);
      }
    }
    const state = this.state;
    state._delta = [-wheelValues(event)[1] / PINCH_WHEEL_RATIO * state.offset[0], 0];
    V.addTo(state._movement, state._delta);
    clampStateInternalMovementToBounds(state);
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
    }
    if (this.config.pinchOnWheel) {
      bindFunction("wheel", "", this.wheel.bind(this), {
        passive: false
      });
    }
  }
};
var pinchConfigResolver = _objectSpread2(_objectSpread2({}, commonConfigResolver), {}, {
  device(_v, _k, {
    shared,
    pointer: {
      touch = false
    } = {}
  }) {
    const sharedConfig = shared;
    if (sharedConfig.target && !SUPPORT.touch && SUPPORT.gesture)
      return "gesture";
    if (SUPPORT.touch && touch)
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
      const D2 = assignDefault(call(scaleBounds, state), {
        min: -Infinity,
        max: Infinity
      });
      return [D2.min, D2.max];
    };
    const _angleBounds = (state) => {
      const A3 = assignDefault(call(angleBounds, state), {
        min: -Infinity,
        max: Infinity
      });
      return [A3.min, A3.max];
    };
    if (typeof scaleBounds !== "function" && typeof angleBounds !== "function")
      return [_scaleBounds(), _angleBounds()];
    return (state) => [_scaleBounds(state), _angleBounds(state)];
  },
  threshold(value, _k, config) {
    this.lockDirection = config.axis === "lock";
    const threshold = V.toVector(value, this.lockDirection ? [0.1, 3] : 0);
    return threshold;
  },
  modifierKey(value) {
    if (value === void 0)
      return "ctrlKey";
    return value;
  },
  pinchOnWheel(value = true) {
    return value;
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
    this.computeValues(pointerValues(event));
    this.compute(event);
    this.computeInitial();
    this.emit();
  }
  moveChange(event) {
    if (!this.state._active)
      return;
    const values = pointerValues(event);
    const state = this.state;
    state._delta = V.sub(values, state._values);
    V.addTo(state._movement, state._delta);
    this.computeValues(values);
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
    state._delta = V.sub(values, state._values);
    V.addTo(state._movement, state._delta);
    this.computeValues(values);
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
    V.addTo(state._movement, state._delta);
    clampStateInternalMovementToBounds(state);
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
    this.computeValues(pointerValues(event));
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
    state._movement = state._delta = V.sub(values, state._values);
    this.computeValues(values);
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
var import_react2 = __toESM(require("react"));

// ../../node_modules/@use-gesture/core/dist/use-gesture-core.esm.js
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null)
    return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i2;
  for (i2 = 0; i2 < sourceKeys.length; i2++) {
    key = sourceKeys[i2];
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
  var key, i2;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i2 = 0; i2 < sourceSymbolKeys.length; i2++) {
      key = sourceSymbolKeys[i2];
      if (excluded.indexOf(key) >= 0)
        continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key))
        continue;
      target[key] = source[key];
    }
  }
  return target;
}
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
  transform(value) {
    return value;
  }
};
var _excluded = ["target", "eventOptions", "window", "enabled", "transform"];
function resolveWith(config = {}, resolvers) {
  const result = {};
  for (const [key, resolver] of Object.entries(resolvers)) {
    switch (typeof resolver) {
      case "function":
        if (false) {
          const r2 = resolver.call(result, config[key], key, config);
          if (!Number.isNaN(r2))
            result[key] = r2;
        } else {
          result[key] = resolver.call(result, config[key], key, config);
        }
        break;
      case "object":
        result[key] = resolveWith(config[key], resolver);
        break;
      case "boolean":
        if (resolver)
          result[key] = config[key];
        break;
    }
  }
  return result;
}
function parse2(newConfig, gestureKey, _config = {}) {
  const _ref = newConfig, {
    target,
    eventOptions,
    window: window2,
    enabled,
    transform
  } = _ref, rest = _objectWithoutProperties(_ref, _excluded);
  _config.shared = resolveWith({
    target,
    eventOptions,
    window: window2,
    enabled,
    transform
  }, sharedConfigResolver);
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
      } else if (false) {
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
  constructor(ctrl, gestureKey) {
    _defineProperty(this, "_listeners", /* @__PURE__ */ new Set());
    this._ctrl = ctrl;
    this._gestureKey = gestureKey;
  }
  add(element, device, action2, handler, options) {
    const listeners = this._listeners;
    const type = toDomEventType(device, action2);
    const _options = this._gestureKey ? this._ctrl.config[this._gestureKey].eventOptions : {};
    const eventOptions = _objectSpread2(_objectSpread2({}, _options), options);
    element.addEventListener(type, handler, eventOptions);
    const remove2 = () => {
      element.removeEventListener(type, handler, eventOptions);
      listeners.delete(remove2);
    };
    listeners.add(remove2);
    return remove2;
  }
  clean() {
    this._listeners.forEach((remove2) => remove2());
    this._listeners.clear();
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
      return this.touchIds;
    } else if ("pointerId" in event) {
      if (event.type === "pointerup" || event.type === "pointercancel")
        this.pointerIds.delete(event.pointerId);
      else if (event.type === "pointerdown")
        this.pointerIds.add(event.pointerId);
      return this.pointerIds;
    }
  }
  applyHandlers(handlers, nativeHandlers) {
    this.handlers = handlers;
    this.nativeHandlers = nativeHandlers;
  }
  applyConfig(config, gestureKey) {
    this.config = parse2(config, gestureKey, this.config);
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
    const props = {};
    let target;
    if (sharedConfig.target) {
      target = sharedConfig.target();
      if (!target)
        return;
    }
    if (sharedConfig.enabled) {
      for (const gestureKey of this.gestures) {
        const gestureConfig = this.config[gestureKey];
        const bindFunction = bindToProps(props, gestureConfig.eventOptions, !!target);
        if (gestureConfig.enabled) {
          const Engine2 = EngineMap.get(gestureKey);
          new Engine2(this, args, gestureKey).bind(bindFunction);
        }
      }
      const nativeBindFunction = bindToProps(props, sharedConfig.eventOptions, !!target);
      for (const eventKey in this.nativeHandlers) {
        nativeBindFunction(
          eventKey,
          "",
          (event) => this.nativeHandlers[eventKey](_objectSpread2(_objectSpread2({}, this.state.shared), {}, {
            event,
            args
          })),
          void 0,
          true
        );
      }
    }
    for (const handlerProp in props) {
      props[handlerProp] = chain(...props[handlerProp]);
    }
    if (!target)
      return props;
    for (const handlerProp in props) {
      const {
        device,
        capture,
        passive
      } = parseProp(handlerProp);
      this._targetEventStore.add(target, device, "", props[handlerProp], {
        capture,
        passive
      });
    }
  }
};
function setupGesture(ctrl, gestureKey) {
  ctrl.gestures.add(gestureKey);
  ctrl.gestureEventStores[gestureKey] = new EventStore(ctrl, gestureKey);
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
    if (false) {
      console.warn(`[@use-gesture]: You've created a custom handler that that uses the \`${key}\` gesture but isn't properly configured.

Please add \`${key}Action\` when creating your handler.`);
    }
    return;
  }
  const startKey = handlerKey + "Start";
  const endKey = handlerKey + "End";
  const fn = (state) => {
    let memo6 = void 0;
    if (state.first && startKey in handlers)
      handlers[startKey](state);
    if (handlerKey in handlers)
      memo6 = handlers[handlerKey](state);
    if (state.last && endKey in handlers)
      handlers[endKey](state);
    return memo6;
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
  const ctrl = import_react2.default.useMemo(() => new Controller(handlers), []);
  ctrl.applyHandlers(handlers, nativeHandlers);
  ctrl.applyConfig(config, gestureKey);
  import_react2.default.useEffect(ctrl.effect.bind(ctrl));
  import_react2.default.useEffect(() => {
    return ctrl.clean.bind(ctrl);
  }, []);
  if (config.target === void 0) {
    return ctrl.bind.bind(ctrl);
  }
  return void 0;
}
function createUseGesture(actions) {
  actions.forEach(registerAction);
  return function useGesture2(_handlers, _config) {
    const {
      handlers,
      nativeHandlers,
      config
    } = parseMergedHandlers(_handlers, _config || {});
    return useRecognizers(handlers, config, void 0, nativeHandlers);
  };
}
function useGesture(handlers, config) {
  const hook = createUseGesture([dragAction, pinchAction, scrollAction, wheelAction, moveAction, hoverAction]);
  return hook(handlers, config || {});
}

// ../../packages/react/src/hooks/useGestureEvents.ts
var React8 = __toESM(require("react"));
function useGestureEvents(ref) {
  const { viewport, inputs, callbacks } = useRendererContext();
  const rOriginPoint = React8.useRef(void 0);
  const rDelta = React8.useRef([0, 0]);
  const rWheelTs = React8.useRef(0);
  const events = React8.useMemo(() => {
    const onWheel = (gesture) => {
      var _a3;
      const { event } = gesture;
      event.preventDefault();
      const [x2, y2, z2] = normalizeWheel(event);
      if (inputs.state === "pinching" || rWheelTs.current >= event.timeStamp) {
        return;
      }
      rWheelTs.current = event.timeStamp;
      if ((event.altKey || event.ctrlKey || event.metaKey) && event.buttons === 0) {
        const bounds = viewport.bounds;
        const point = (_a3 = inputs.currentScreenPoint) != null ? _a3 : [bounds.width / 2, bounds.height / 2];
        const delta = z2 / 100;
        const zoom = viewport.camera.zoom;
        viewport.onZoom(point, zoom - delta * zoom);
        return;
      } else {
        const delta = src_default.mul(
          event.shiftKey && !isDarwin() ? [y2, 0] : [x2, y2],
          0.8
        );
        if (src_default.isEqual(delta, [0, 0])) {
          return;
        }
        viewport.panCamera(delta);
      }
    };
    const onPinchStart = ({ event, delta, offset, origin }) => {
      var _a3;
      const elm = ref.current;
      if (event instanceof WheelEvent)
        return;
      if (!(event.target === elm || (elm == null ? void 0 : elm.contains(event.target))))
        return;
      (_a3 = callbacks.onPinchStart) == null ? void 0 : _a3.call(
        callbacks,
        {
          type: "canvas" /* Canvas */,
          order: 0,
          delta: [...delta, offset[0]],
          offset,
          point: src_default.sub(origin, inputs.containerOffset)
        },
        event
      );
      rOriginPoint.current = origin;
      rDelta.current = [0, 0];
    };
    const onPinch = ({ event, offset, origin }) => {
      var _a3;
      const elm = ref.current;
      if (event instanceof WheelEvent)
        return;
      if (!(event.target === elm || (elm == null ? void 0 : elm.contains(event.target))))
        return;
      if (!rOriginPoint.current) {
        rOriginPoint.current = origin;
      }
      const delta = src_default.sub(rOriginPoint.current, origin);
      const trueDelta = src_default.sub(delta, rDelta.current);
      (_a3 = callbacks.onPinch) == null ? void 0 : _a3.call(
        callbacks,
        {
          type: "canvas" /* Canvas */,
          order: 0,
          delta: [...trueDelta, offset[0]],
          offset,
          point: src_default.sub(origin, inputs.containerOffset)
        },
        event
      );
      rDelta.current = delta;
    };
    const onPinchEnd = ({ event, delta, offset, origin }) => {
      var _a3;
      const elm = ref.current;
      if (event instanceof WheelEvent)
        return;
      if (!(event.target === elm || (elm == null ? void 0 : elm.contains(event.target))))
        return;
      if (inputs.state !== "pinching")
        return;
      (_a3 = callbacks.onPinchEnd) == null ? void 0 : _a3.call(
        callbacks,
        {
          type: "canvas" /* Canvas */,
          order: 0,
          delta: [0, 0, offset[0]],
          offset,
          point: src_default.sub(origin, inputs.containerOffset)
        },
        event
      );
      rDelta.current = [0, 0];
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
      from: [viewport.camera.zoom, viewport.camera.zoom],
      scaleBounds: () => ({
        from: viewport.camera.zoom,
        max: TLViewport.maxZoom,
        min: TLViewport.minZoom
      })
    }
  });
}
function normalizeWheel(event) {
  const MAX_ZOOM_STEP = 10;
  const { deltaY, deltaX } = event;
  let deltaZ = 0;
  if (event.ctrlKey || event.metaKey) {
    const signY = Math.sign(event.deltaY);
    const absDeltaY = Math.abs(event.deltaY);
    let dy = deltaY;
    if (absDeltaY > MAX_ZOOM_STEP) {
      dy = MAX_ZOOM_STEP * signY;
    }
    deltaZ = dy;
  }
  return [deltaX, deltaY, deltaZ];
}

// ../../packages/react/src/hooks/useCounterScaledPosition.tsx
var React9 = __toESM(require("react"));
function useCounterScaledPosition(ref, bounds, rotation, zIndex) {
  React9.useLayoutEffect(() => {
    const elm = ref.current;
    elm.style.transform = `translate(
        calc(${bounds.minX}px - var(--tl-padding)),
        calc(${bounds.minY}px - var(--tl-padding)))
        scale(var(--tl-scale))`;
  }, [bounds.minX, bounds.minY, rotation, bounds.rotation]);
  React9.useLayoutEffect(() => {
    const elm = ref.current;
    elm.style.width = `calc(${Math.floor(bounds.width)}px + (var(--tl-padding) * 2))`;
    elm.style.height = `calc(${Math.floor(bounds.height)}px + (var(--tl-padding) * 2))`;
  }, [bounds.width, bounds.height]);
  React9.useLayoutEffect(() => {
    const elm = ref.current;
    if (zIndex !== void 0)
      elm.style.zIndex = zIndex.toString();
  }, [zIndex]);
}

// ../../packages/react/src/hooks/useSetup.ts
var React10 = __toESM(require("react"));
function useSetup(app, props) {
  const {
    onPersist,
    onError,
    onMount,
    onCreateAssets,
    onCreateShapes,
    onDeleteAssets,
    onDeleteShapes,
    onDrop,
    onPaste,
    onCopy,
    onCanvasDBClick
  } = props;
  React10.useLayoutEffect(() => {
    const unsubs = [];
    if (!app)
      return;
    if (typeof window !== void 0) {
      window["tlapps"] = window["tlapps"] || {};
      window["tlapps"][app.uuid] = app;
    }
    if (onMount)
      onMount(app, null);
    return () => {
      unsubs.forEach((unsub) => unsub());
      if (typeof window !== void 0 && window["tlapps"]) {
        delete window["tlapps"][app.uuid];
      }
    };
  }, [app]);
  React10.useLayoutEffect(() => {
    const unsubs = [];
    if (onPersist)
      unsubs.push(app.subscribe("persist", onPersist));
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
    if (onDrop)
      unsubs.push(app.subscribe("drop", onDrop));
    if (onPaste)
      unsubs.push(app.subscribe("paste", onPaste));
    if (onCopy)
      unsubs.push(app.subscribe("copy", onCopy));
    if (onCanvasDBClick)
      unsubs.push(app.subscribe("canvas-dbclick", onCanvasDBClick));
    return () => unsubs.forEach((unsub) => unsub());
  }, [app, onPersist, onError]);
}

// ../../packages/react/src/hooks/useAppSetup.ts
var React11 = __toESM(require("react"));
function useAppSetup(props) {
  if ("app" in props)
    return props.app;
  const [app] = React11.useState(
    () => new TLReactApp(props.model, props.Shapes, props.Tools, props.readOnly)
  );
  React11.useLayoutEffect(() => {
    return () => {
      app.dispose();
    };
  }, [app]);
  return app;
}

// ../../packages/react/src/hooks/usePropControl.ts
var React12 = __toESM(require("react"));
function usePropControl(app, props) {
  React12.useEffect(() => {
    if (!("model" in props))
      return;
    if (props.model)
      app.loadDocumentModel(props.model);
  }, [props.model]);
}

// ../../packages/react/src/hooks/usePreventNavigation.ts
var React13 = __toESM(require("react"));
function usePreventNavigation(rCanvas) {
  const context = useRendererContext();
  const {
    viewport: { bounds }
  } = context;
  React13.useEffect(() => {
    const preventGestureNavigation = (event) => {
      event.preventDefault();
    };
    const preventNavigation = (event) => {
      if (event.touches.length === 0) {
        return;
      }
      const touchXPosition = event.touches[0].pageX;
      const touchXRadius = event.touches[0].radiusX || 0;
      if (touchXPosition - touchXRadius < 10 || touchXPosition + touchXRadius > bounds.width - 10) {
        event.preventDefault();
      }
    };
    const elm = rCanvas.current;
    if (!elm)
      return () => void 0;
    elm.addEventListener("touchstart", preventGestureNavigation, {
      passive: true
    });
    elm.addEventListener("gestureend", preventGestureNavigation, {
      passive: true
    });
    elm.addEventListener("gesturechange", preventGestureNavigation, {
      passive: true
    });
    elm.addEventListener("gesturestart", preventGestureNavigation, {
      passive: true
    });
    elm.addEventListener("touchstart", preventNavigation, {
      passive: true
    });
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

// ../../packages/react/src/hooks/useHandleEvents.ts
var React14 = __toESM(require("react"));
function useHandleEvents(shape, id3) {
  const { inputs, callbacks } = useRendererContext();
  const events = React14.useMemo(() => {
    const onPointerMove = (e) => {
      var _a3;
      const { order = 0 } = e;
      const handle = shape.props.handles[id3];
      (_a3 = callbacks.onPointerMove) == null ? void 0 : _a3.call(callbacks, { type: "handle" /* Handle */, shape, handle, id: id3, order }, e);
      e.order = order + 1;
    };
    const onPointerDown = (e) => {
      var _a3, _b;
      const { order = 0 } = e;
      if (!order)
        (_a3 = e.currentTarget) == null ? void 0 : _a3.setPointerCapture(e.pointerId);
      const handle = shape.props.handles[id3];
      (_b = callbacks.onPointerDown) == null ? void 0 : _b.call(callbacks, { type: "handle" /* Handle */, shape, handle, id: id3, order }, e);
      e.order = order + 1;
    };
    const onPointerUp = (e) => {
      var _a3, _b;
      const { order = 0 } = e;
      if (!order)
        (_a3 = e.currentTarget) == null ? void 0 : _a3.releasePointerCapture(e.pointerId);
      const handle = shape.props.handles[id3];
      (_b = callbacks.onPointerUp) == null ? void 0 : _b.call(callbacks, { type: "handle" /* Handle */, shape, handle, id: id3, order }, e);
      e.order = order + 1;
    };
    const onPointerEnter = (e) => {
      var _a3;
      const { order = 0 } = e;
      const handle = shape.props.handles[id3];
      (_a3 = callbacks.onPointerEnter) == null ? void 0 : _a3.call(callbacks, { type: "handle" /* Handle */, shape, handle, id: id3, order }, e);
      e.order = order + 1;
    };
    const onPointerLeave = (e) => {
      var _a3;
      const { order = 0 } = e;
      const handle = shape.props.handles[id3];
      (_a3 = callbacks.onPointerLeave) == null ? void 0 : _a3.call(callbacks, { type: "handle" /* Handle */, shape, handle, id: id3, order }, e);
      e.order = order + 1;
    };
    const onKeyDown = (e) => {
      var _a3;
      const handle = shape.props.handles[id3];
      (_a3 = callbacks.onKeyDown) == null ? void 0 : _a3.call(callbacks, { type: "handle" /* Handle */, shape, handle, id: id3, order: -1 }, e);
    };
    const onKeyUp = (e) => {
      var _a3;
      const handle = shape.props.handles[id3];
      (_a3 = callbacks.onKeyUp) == null ? void 0 : _a3.call(callbacks, { type: "handle" /* Handle */, shape, handle, id: id3, order: -1 }, e);
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

// ../../packages/react/src/hooks/useCursor.ts
var React15 = __toESM(require("react"));
function getCursorCss(svg, r2, f2 = false) {
  return `url("data:image/svg+xml,<svg height='32' width='32' viewBox='0 0 35 35' xmlns='http://www.w3.org/2000/svg'><g fill='none' style='transform-origin:center center' transform='rotate(${r2})${f2 ? ` scale(-1,-1) translate(0, -32)` : ""}'>` + svg.replaceAll(`"`, `'`) + '</g></svg>") 16 16, pointer';
}
var CORNER_SVG = `<path d='m19.7432 17.0869-4.072 4.068 2.829 2.828-8.473-.013-.013-8.47 2.841 2.842 4.075-4.068 1.414-1.415-2.844-2.842h8.486v8.484l-2.83-2.827z' fill='%23fff'/><path d='m18.6826 16.7334-4.427 4.424 1.828 1.828-5.056-.016-.014-5.054 1.842 1.841 4.428-4.422 2.474-2.475-1.844-1.843h5.073v5.071l-1.83-1.828z' fill='%23000'/>`;
var EDGE_SVG = `<path d='m9 17.9907v.005l5.997 5.996.001-3.999h1.999 2.02v4l5.98-6.001-5.98-5.999.001 4.019-2.021.002h-2l.001-4.022zm1.411.003 3.587-3.588-.001 2.587h3.5 2.521v-2.585l3.565 3.586-3.564 3.585-.001-2.585h-2.521l-3.499-.001-.001 2.586z' fill='%23fff'/><path d='m17.4971 18.9932h2.521v2.586l3.565-3.586-3.565-3.585v2.605h-2.521-3.5v-2.607l-3.586 3.587 3.586 3.586v-2.587z' fill='%23000'/>`;
var ROTATE_CORNER_SVG = `<g><path d="M22.4789 9.45728L25.9935 12.9942L22.4789 16.5283V14.1032C18.126 14.1502 14.6071 17.6737 14.5675 22.0283H17.05L13.513 25.543L9.97889 22.0283H12.5674C12.6071 16.5691 17.0214 12.1503 22.4789 12.1031L22.4789 9.45728Z" fill="black"/><path fill-rule="evenodd" clip-rule="evenodd" d="M21.4789 7.03223L27.4035 12.9945L21.4789 18.9521V15.1868C18.4798 15.6549 16.1113 18.0273 15.649 21.0284H19.475L13.5128 26.953L7.55519 21.0284H11.6189C12.1243 15.8155 16.2679 11.6677 21.4789 11.1559L21.4789 7.03223ZM22.4789 12.1031C17.0214 12.1503 12.6071 16.5691 12.5674 22.0284H9.97889L13.513 25.543L17.05 22.0284H14.5675C14.5705 21.6896 14.5947 21.3558 14.6386 21.0284C15.1157 17.4741 17.9266 14.6592 21.4789 14.1761C21.8063 14.1316 22.1401 14.1069 22.4789 14.1032V16.5284L25.9935 12.9942L22.4789 9.45729L22.4789 12.1031Z" fill="white"/></g>`;
var TEXT_SVG = `<path d='m6.94 2v-1c-1.35866267-.08246172-2.66601117.53165299-3.47 1.63-.80398883-1.09834701-2.11133733-1.71246172-3.47-1.63v1c1.30781678-.16635468 2.55544738.59885876 3 1.84v5.1h-1v1h1v4.16c-.4476345 1.2386337-1.69302129 2.002471-3 1.84v1c1.35687108.0731933 2.6600216-.5389494 3.47-1.63.8099784 1.0910506 2.11312892 1.7031933 3.47 1.63v-1c-1.28590589.133063-2.49760499-.6252793-2.94-1.84v-4.18h1v-1h-1v-5.08c.43943906-1.21710975 1.65323743-1.97676587 2.94-1.84z' transform='translate(14 9)'/>`;
var GRABBING_SVG = `<path d='m13.5732 12.0361c.48-.178 1.427-.069 1.677.473.213.462.396 1.241.406 1.075.024-.369-.024-1.167.137-1.584.117-.304.347-.59.686-.691.285-.086.62-.116.916-.055.313.064.642.287.765.499.362.623.368 1.899.385 1.831.064-.272.07-1.229.283-1.584.141-.235.497-.445.687-.479.294-.052.656-.068.964-.008.249.049.586.344.677.487.219.344.342 1.316.379 1.658.016.141.074-.393.293-.736.406-.639 1.844-.763 1.898.639.026.654.02.624.02 1.064 0 .516-.012.828-.04 1.202-.03.399-.116 1.304-.241 1.742-.086.301-.371.978-.653 1.384 0 0-1.074 1.25-1.191 1.812-.117.563-.078.567-.102.965-.023.399.121.923.121.923s-.801.104-1.234.034c-.391-.062-.875-.84-1-1.078-.172-.328-.539-.265-.682-.023-.224.383-.709 1.07-1.05 1.113-.669.084-2.055.03-3.14.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.283-.36-1.002-.929-1.243-1.985-.213-.936-.192-1.395.037-1.77.232-.381.67-.589.854-.625.208-.042.692-.039.875.062.223.123.313.159.488.391.23.307.312.456.213.121-.076-.262-.322-.595-.434-.97-.109-.361-.401-.943-.38-1.526.008-.221.103-.771.832-1.042' fill='%23fff'/><g stroke='%23000' stroke-width='.75'><path d='m13.5732 12.0361c.48-.178 1.427-.069 1.677.473.213.462.396 1.241.406 1.075.024-.369-.024-1.167.137-1.584.117-.304.347-.59.686-.691.285-.086.62-.116.916-.055.313.064.642.287.765.499.362.623.368 1.899.385 1.831.064-.272.07-1.229.283-1.584.141-.235.497-.445.687-.479.294-.052.656-.068.964-.008.249.049.586.344.677.487.219.344.342 1.316.379 1.658.016.141.074-.393.293-.736.406-.639 1.844-.763 1.898.639.026.654.02.624.02 1.064 0 .516-.012.828-.04 1.202-.03.399-.116 1.304-.241 1.742-.086.301-.371.978-.653 1.384 0 0-1.074 1.25-1.191 1.812-.117.563-.078.567-.102.965-.023.399.121.923.121.923s-.801.104-1.234.034c-.391-.062-.875-.84-1-1.078-.172-.328-.539-.265-.682-.023-.224.383-.709 1.07-1.05 1.113-.669.084-2.055.03-3.14.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.283-.36-1.002-.929-1.243-1.985-.213-.936-.192-1.395.037-1.77.232-.381.67-.589.854-.625.208-.042.692-.039.875.062.223.123.313.159.488.391.23.307.312.456.213.121-.076-.262-.322-.595-.434-.97-.109-.361-.401-.943-.38-1.526.008-.221.103-.771.832-1.042z' stroke-linejoin='round'/><path d='m20.5664 19.7344v-3.459' stroke-linecap='round'/><path d='m18.5508 19.7461-.016-3.473' stroke-linecap='round'/><path d='m16.5547 16.3047.021 3.426' stroke-linecap='round'/></g>`;
var GRAB_SVG = `<path d="m13.5557 17.5742c-.098-.375-.196-.847-.406-1.552-.167-.557-.342-.859-.47-1.233-.155-.455-.303-.721-.496-1.181-.139-.329-.364-1.048-.457-1.44-.119-.509.033-.924.244-1.206.253-.339.962-.49 1.357-.351.371.13.744.512.916.788.288.46.357.632.717 1.542.393.992.564 1.918.611 2.231l.085.452c-.001-.04-.043-1.122-.044-1.162-.035-1.029-.06-1.823-.038-2.939.002-.126.064-.587.084-.715.078-.5.305-.8.673-.979.412-.201.926-.215 1.401-.017.423.173.626.55.687 1.022.014.109.094.987.093 1.107-.013 1.025.006 1.641.015 2.174.004.231.003 1.625.017 1.469.061-.656.094-3.189.344-3.942.144-.433.405-.746.794-.929.431-.203 1.113-.07 1.404.243.285.305.446.692.482 1.153.032.405-.019.897-.02 1.245 0 .867-.021 1.324-.037 2.121-.001.038-.015.298.023.182.094-.28.188-.542.266-.745.049-.125.241-.614.359-.859.114-.234.211-.369.415-.688.2-.313.415-.448.668-.561.54-.235 1.109.112 1.301.591.086.215.009.713-.028 1.105-.061.647-.254 1.306-.352 1.648-.128.447-.274 1.235-.34 1.601-.072.394-.234 1.382-.359 1.82-.086.301-.371.978-.652 1.384 0 0-1.074 1.25-1.192 1.812-.117.563-.078.567-.101.965-.024.399.121.923.121.923s-.802.104-1.234.034c-.391-.062-.875-.841-1-1.078-.172-.328-.539-.265-.682-.023-.225.383-.709 1.07-1.051 1.113-.668.084-2.054.03-3.139.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.284-.36-.629-1.093-1.243-1.985-.348-.504-1.027-1.085-1.284-1.579-.223-.425-.331-.954-.19-1.325.225-.594.675-.897 1.362-.832.519.05.848.206 1.238.537.225.19.573.534.75.748.163.195.203.276.377.509.23.307.302.459.214.121" fill="%23fff"/><g stroke="%23000" stroke-linecap="round" stroke-width=".75"><path d="m13.5557 17.5742c-.098-.375-.196-.847-.406-1.552-.167-.557-.342-.859-.47-1.233-.155-.455-.303-.721-.496-1.181-.139-.329-.364-1.048-.457-1.44-.119-.509.033-.924.244-1.206.253-.339.962-.49 1.357-.351.371.13.744.512.916.788.288.46.357.632.717 1.542.393.992.564 1.918.611 2.231l.085.452c-.001-.04-.043-1.122-.044-1.162-.035-1.029-.06-1.823-.038-2.939.002-.126.064-.587.084-.715.078-.5.305-.8.673-.979.412-.201.926-.215 1.401-.017.423.173.626.55.687 1.022.014.109.094.987.093 1.107-.013 1.025.006 1.641.015 2.174.004.231.003 1.625.017 1.469.061-.656.094-3.189.344-3.942.144-.433.405-.746.794-.929.431-.203 1.113-.07 1.404.243.285.305.446.692.482 1.153.032.405-.019.897-.02 1.245 0 .867-.021 1.324-.037 2.121-.001.038-.015.298.023.182.094-.28.188-.542.266-.745.049-.125.241-.614.359-.859.114-.234.211-.369.415-.688.2-.313.415-.448.668-.561.54-.235 1.109.112 1.301.591.086.215.009.713-.028 1.105-.061.647-.254 1.306-.352 1.648-.128.447-.274 1.235-.34 1.601-.072.394-.234 1.382-.359 1.82-.086.301-.371.978-.652 1.384 0 0-1.074 1.25-1.192 1.812-.117.563-.078.567-.101.965-.024.399.121.923.121.923s-.802.104-1.234.034c-.391-.062-.875-.841-1-1.078-.172-.328-.539-.265-.682-.023-.225.383-.709 1.07-1.051 1.113-.668.084-2.054.03-3.139.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.284-.36-.629-1.093-1.243-1.985-.348-.504-1.027-1.085-1.284-1.579-.223-.425-.331-.954-.19-1.325.225-.594.675-.897 1.362-.832.519.05.848.206 1.238.537.225.19.573.534.75.748.163.195.203.276.377.509.23.307.302.459.214.121" stroke-linejoin="round"/><path d="m20.5664 21.7344v-3.459"/><path d="m18.5508 21.7461-.016-3.473"/><path d="m16.5547 18.3047.021 3.426"/></g>`;
var CURSORS3 = {
  ["none" /* None */]: (r2, f2) => "none",
  ["default" /* Default */]: (r2, f2) => "default",
  ["pointer" /* Pointer */]: (r2, f2) => "pointer",
  ["crosshair" /* Cross */]: (r2, f2) => "crosshair",
  ["move" /* Move */]: (r2, f2) => "move",
  ["wait" /* Wait */]: (r2, f2) => "wait",
  ["progress" /* Progress */]: (r2, f2) => "progress",
  ["grab" /* Grab */]: (r2, f2) => getCursorCss(GRAB_SVG, r2, f2),
  ["grabbing" /* Grabbing */]: (r2, f2) => getCursorCss(GRABBING_SVG, r2, f2),
  ["text" /* Text */]: (r2, f2) => getCursorCss(TEXT_SVG, r2, f2),
  ["resize-edge" /* ResizeEdge */]: (r2, f2) => getCursorCss(EDGE_SVG, r2, f2),
  ["resize-corner" /* ResizeCorner */]: (r2, f2) => getCursorCss(CORNER_SVG, r2, f2),
  ["ew-resize" /* EwResize */]: (r2, f2) => getCursorCss(EDGE_SVG, r2, f2),
  ["ns-resize" /* NsResize */]: (r2, f2) => getCursorCss(EDGE_SVG, r2 + 90, f2),
  ["nesw-resize" /* NeswResize */]: (r2, f2) => getCursorCss(CORNER_SVG, r2, f2),
  ["nwse-resize" /* NwseResize */]: (r2, f2) => getCursorCss(CORNER_SVG, r2 + 90, f2),
  ["rotate" /* Rotate */]: (r2, f2) => getCursorCss(ROTATE_CORNER_SVG, r2 + 45, f2),
  ["nwse-rotate" /* NwseRotate */]: (r2, f2) => getCursorCss(ROTATE_CORNER_SVG, r2, f2),
  ["nesw-rotate" /* NeswRotate */]: (r2, f2) => getCursorCss(ROTATE_CORNER_SVG, r2 + 90, f2),
  ["senw-rotate" /* SenwRotate */]: (r2, f2) => getCursorCss(ROTATE_CORNER_SVG, r2 + 180, f2),
  ["swne-rotate" /* SwneRotate */]: (r2, f2) => getCursorCss(ROTATE_CORNER_SVG, r2 + 270, f2)
};
function useCursor(ref, cursor, rotation = 0) {
  React15.useEffect(() => {
    const elm = ref.current;
    if (!elm)
      return;
    elm.style.cursor = CURSORS3[cursor](GeomUtils.radiansToDegrees(rotation));
  }, [cursor, rotation]);
}

// ../../packages/react/src/hooks/useZoom.ts
var React16 = __toESM(require("react"));
function useZoom(ref) {
  const { viewport } = useRendererContext();
  const app = useApp();
  React16.useLayoutEffect(() => {
    return autorun(() => {
      const debouncedZoom = debounce(() => {
        var _a3;
        (_a3 = ref.current) == null ? void 0 : _a3.style.setProperty("--tl-zoom", viewport.camera.zoom.toString());
      }, 200);
      if (app.inputs.state !== "pinching" && viewport.camera.zoom != null) {
        debouncedZoom();
      }
    });
  }, []);
}

// ../../packages/react/src/hooks/useMinimapEvents.ts
var React17 = __toESM(require("react"));

// ../../packages/react/src/hooks/useDebounced.ts
var import_react4 = require("react");
function useDebouncedValue(value, ms = 0) {
  const [debouncedValue, setDebouncedValue] = (0, import_react4.useState)(value);
  (0, import_react4.useEffect)(() => {
    let canceled = false;
    const handler = setTimeout(() => {
      if (!canceled) {
        setDebouncedValue(value);
      }
    }, ms);
    return () => {
      canceled = true;
      clearTimeout(handler);
    };
  }, [value, ms]);
  return debouncedValue;
}

// ../../packages/react/src/hooks/useRestoreCamera.ts
var React18 = __toESM(require("react"));
var storingKey = "logseq.tldraw.camera";
var cacheCamera = (app) => {
  window.sessionStorage.setItem(
    storingKey + ":" + app.currentPageId,
    JSON.stringify(app.viewport.camera)
  );
};
var loadCamera = (app) => {
  var _a3;
  const camera = JSON.parse(
    (_a3 = window.sessionStorage.getItem(storingKey + ":" + app.currentPageId)) != null ? _a3 : "null"
  );
  if (camera) {
    app.viewport.update(camera);
  } else if (app.selectedIds.size) {
    app.api.zoomToSelection();
  } else {
    app.api.zoomToFit();
  }
};
function useRestoreCamera() {
  const app = useApp();
  React18.useEffect(() => {
    reaction(
      () => __spreadValues({}, app.viewport.camera),
      () => cacheCamera(app)
    );
  }, [app.viewport.camera]);
  React18.useEffect(() => {
    loadCamera(app);
  }, [app]);
}

// ../../node_modules/mobx-react-lite/es/utils/assertEnvironment.js
var import_react5 = require("react");
if (!import_react5.useState) {
  throw new Error("mobx-react-lite requires React with Hooks support");
}
if (!makeObservable) {
  throw new Error("mobx-react-lite@3 requires mobx at least version 6 to be available");
}

// ../../node_modules/mobx-react-lite/es/utils/reactBatchedUpdates.js
var import_react_dom = require("react-dom");

// ../../node_modules/mobx-react-lite/es/utils/observerBatching.js
function defaultNoopBatch(callback) {
  callback();
}
function observerBatching(reactionScheduler3) {
  if (!reactionScheduler3) {
    reactionScheduler3 = defaultNoopBatch;
    if (false) {
      console.warn("[MobX] Failed to get unstable_batched updates from react-dom / react-native");
    }
  }
  configure({ reactionScheduler: reactionScheduler3 });
}

// ../../node_modules/mobx-react-lite/es/useObserver.js
var import_react6 = __toESM(require("react"));

// ../../node_modules/mobx-react-lite/es/utils/printDebugValue.js
function printDebugValue(v2) {
  return getDependencyTree(v2);
}

// ../../node_modules/mobx-react-lite/es/utils/FinalizationRegistryWrapper.js
var FinalizationRegistryLocal = typeof FinalizationRegistry === "undefined" ? void 0 : FinalizationRegistry;

// ../../node_modules/mobx-react-lite/es/utils/reactionCleanupTrackingCommon.js
function createTrackingData(reaction2) {
  var trackingData = {
    reaction: reaction2,
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
    addReactionToTrack: function(reactionTrackingRef, reaction2, objectRetainedByReact) {
      var token = globalCleanupTokensCounter++;
      registry.register(objectRetainedByReact, token, reactionTrackingRef);
      reactionTrackingRef.current = createTrackingData(reaction2);
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
var __values = function(o2) {
  var s2 = typeof Symbol === "function" && Symbol.iterator, m2 = s2 && o2[s2], i2 = 0;
  if (m2)
    return m2.call(o2);
  if (o2 && typeof o2.length === "number")
    return {
      next: function() {
        if (o2 && i2 >= o2.length)
          o2 = void 0;
        return { value: o2 && o2[i2++], done: !o2 };
      }
    };
  throw new TypeError(s2 ? "Object is not iterable." : "Symbol.iterator is not defined.");
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
    var e_1, _a3;
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
          if (uncommittedReactionRefs_1_1 && !uncommittedReactionRefs_1_1.done && (_a3 = uncommittedReactionRefs_1.return))
            _a3.call(uncommittedReactionRefs_1);
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
    addReactionToTrack: function(reactionTrackingRef, reaction2, objectRetainedByReact) {
      reactionTrackingRef.current = createTrackingData(reaction2);
      scheduleCleanupOfReactionIfLeaked(reactionTrackingRef);
      return reactionTrackingRef.current;
    },
    recordReactionAsCommitted: recordReactionAsCommitted2,
    forceCleanupTimerToRunNowForTests: forceCleanupTimerToRunNowForTests2,
    resetCleanupScheduleForTests: resetCleanupScheduleForTests2
  };
}

// ../../node_modules/mobx-react-lite/es/utils/reactionCleanupTracking.js
var _a2 = FinalizationRegistryLocal ? createReactionCleanupTrackingUsingFinalizationRegister(FinalizationRegistryLocal) : createTimerBasedReactionCleanupTracking();
var addReactionToTrack = _a2.addReactionToTrack;
var recordReactionAsCommitted = _a2.recordReactionAsCommitted;
var resetCleanupScheduleForTests = _a2.resetCleanupScheduleForTests;
var forceCleanupTimerToRunNowForTests = _a2.forceCleanupTimerToRunNowForTests;

// ../../node_modules/mobx-react-lite/es/staticRendering.js
var globalIsUsingStaticRendering = false;
function isUsingStaticRendering() {
  return globalIsUsingStaticRendering;
}

// ../../node_modules/mobx-react-lite/es/useObserver.js
var __read = function(o2, n2) {
  var m2 = typeof Symbol === "function" && o2[Symbol.iterator];
  if (!m2)
    return o2;
  var i2 = m2.call(o2), r2, ar = [], e;
  try {
    while ((n2 === void 0 || n2-- > 0) && !(r2 = i2.next()).done)
      ar.push(r2.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r2 && !r2.done && (m2 = i2["return"]))
        m2.call(i2);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
function observerComponentNameFor(baseComponentName) {
  return "observer".concat(baseComponentName);
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
  var _a3 = __read(import_react6.default.useState(objectToBeRetainedByReactFactory), 1), objectRetainedByReact = _a3[0];
  var _b = __read(import_react6.default.useState(), 2), setState = _b[1];
  var forceUpdate = function() {
    return setState([]);
  };
  var reactionTrackingRef = import_react6.default.useRef(null);
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
  var reaction2 = reactionTrackingRef.current.reaction;
  import_react6.default.useDebugValue(reaction2, printDebugValue);
  import_react6.default.useEffect(function() {
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
  reaction2.track(function() {
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
var import_react7 = require("react");
var hasSymbol = typeof Symbol === "function" && Symbol.for;
var ReactForwardRefSymbol = hasSymbol ? Symbol.for("react.forward_ref") : typeof import_react7.forwardRef === "function" && (0, import_react7.forwardRef)(function(props) {
  return null;
})["$$typeof"];
var ReactMemoSymbol = hasSymbol ? Symbol.for("react.memo") : typeof import_react7.memo === "function" && (0, import_react7.memo)(function(props) {
  return null;
})["$$typeof"];
function observer(baseComponent, options) {
  var _a3;
  if (false) {
    warnObserverOptionsDeprecated = false;
    console.warn("[mobx-react-lite] `observer(fn, { forwardRef: true })` is deprecated, use `observer(React.forwardRef(fn))`");
  }
  if (ReactMemoSymbol && baseComponent["$$typeof"] === ReactMemoSymbol) {
    throw new Error("[mobx-react-lite] You are trying to use `observer` on a function component wrapped in either another `observer` or `React.memo`. The observer already applies 'React.memo' for you.");
  }
  if (isUsingStaticRendering()) {
    return baseComponent;
  }
  var useForwardRef = (_a3 = options === null || options === void 0 ? void 0 : options.forwardRef) !== null && _a3 !== void 0 ? _a3 : false;
  var render = baseComponent;
  var baseComponentName = baseComponent.displayName || baseComponent.name;
  if (ReactForwardRefSymbol && baseComponent["$$typeof"] === ReactForwardRefSymbol) {
    useForwardRef = true;
    render = baseComponent["render"];
    if (typeof render !== "function") {
      throw new Error("[mobx-react-lite] `render` property of ForwardRef was not a function");
    }
  }
  var observerComponent = function(props, ref) {
    return useObserver(function() {
      return render(props, ref);
    }, baseComponentName);
  };
  if (baseComponentName !== "") {
    ;
    observerComponent.displayName = baseComponentName;
  }
  if (baseComponent.contextTypes) {
    ;
    observerComponent.contextTypes = baseComponent.contextTypes;
  }
  if (useForwardRef) {
    observerComponent = (0, import_react7.forwardRef)(observerComponent);
  }
  observerComponent = (0, import_react7.memo)(observerComponent);
  copyStaticProperties(baseComponent, observerComponent);
  if (false) {
    Object.defineProperty(observerComponent, "contextTypes", {
      set: function() {
        var _a4;
        throw new Error("[mobx-react-lite] `".concat(this.displayName || ((_a4 = this.type) === null || _a4 === void 0 ? void 0 : _a4.displayName) || "Component", ".contextTypes` must be set before applying `observer`."));
      }
    });
  }
  return observerComponent;
}
var hoistBlackList = {
  $$typeof: true,
  render: true,
  compare: true,
  type: true,
  displayName: true
};
function copyStaticProperties(base, target) {
  Object.keys(base).forEach(function(key) {
    if (!hoistBlackList[key]) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(base, key));
    }
  });
}

// ../../node_modules/mobx-react-lite/es/ObserverComponent.js
function ObserverComponent(_a3) {
  var children = _a3.children, render = _a3.render;
  var component = children || render;
  if (typeof component !== "function") {
    return null;
  }
  return useObserver(component);
}
if (false) {
  ObserverComponent.propTypes = {
    children: ObserverPropsCheck,
    render: ObserverPropsCheck
  };
}
ObserverComponent.displayName = "Observer";

// ../../node_modules/mobx-react-lite/es/useLocalObservable.js
var import_react8 = require("react");

// ../../node_modules/mobx-react-lite/es/useLocalStore.js
var import_react10 = require("react");

// ../../node_modules/mobx-react-lite/es/useAsObservableSource.js
var import_react9 = require("react");

// ../../node_modules/mobx-react-lite/es/index.js
observerBatching(import_react_dom.unstable_batchedUpdates);

// ../../packages/react/src/components/HTMLContainer/HTMLContainer.tsx
var React20 = __toESM(require("react"));
var import_jsx_runtime2 = require("react/jsx-runtime");
var HTMLContainer = React20.forwardRef(
  function HTMLContainer2(_a3, ref) {
    var _b = _a3, { children, opacity, centered, className = "" } = _b, rest = __objRest(_b, ["children", "opacity", "centered", "className"]);
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ObserverComponent, {
      children: () => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", {
        ref,
        className: `tl-positioned-div ${className}`,
        style: opacity ? { opacity } : void 0,
        draggable: false,
        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", __spreadProps(__spreadValues({
          className: `tl-positioned-inner ${centered ? "tl-centered" : ""}`
        }, rest), {
          children
        }))
      })
    });
  }
);

// ../../packages/react/src/components/SVGContainer/SVGContainer.tsx
var React21 = __toESM(require("react"));
var import_jsx_runtime3 = require("react/jsx-runtime");
var SVGContainer = React21.forwardRef(
  function SVGContainer2(_a3, ref) {
    var _b = _a3, { id: id3, className = "", style, children } = _b, rest = __objRest(_b, ["id", "className", "style", "children"]);
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ObserverComponent, {
      children: () => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", {
        ref,
        style,
        className: `tl-positioned-svg ${className}`,
        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("g", __spreadProps(__spreadValues({
          id: id3,
          className: "tl-centered-g"
        }, rest), {
          children
        }))
      })
    });
  }
);

// ../../packages/react/src/components/Canvas/Canvas.tsx
var React31 = __toESM(require("react"));

// ../../packages/react/src/hooks/useKeyboardEvents.ts
var React22 = __toESM(require("react"));
function useKeyboardEvents(ref) {
  const app = useApp();
  const { callbacks } = useRendererContext();
  const shiftKeyDownRef = React22.useRef(false);
  React22.useEffect(() => {
    const onKeyDown = (e) => {
      var _a3, _b;
      if ((_a3 = ref.current) == null ? void 0 : _a3.contains(document.activeElement)) {
        (_b = callbacks.onKeyDown) == null ? void 0 : _b.call(callbacks, { type: "canvas" /* Canvas */, order: -1 }, e);
        shiftKeyDownRef.current = e.shiftKey;
      }
    };
    const onKeyUp = (e) => {
      var _a3, _b;
      if ((_a3 = ref.current) == null ? void 0 : _a3.contains(document.activeElement)) {
        (_b = callbacks.onKeyUp) == null ? void 0 : _b.call(callbacks, { type: "canvas" /* Canvas */, order: -1 }, e);
        shiftKeyDownRef.current = e.shiftKey;
      }
    };
    const onPaste = (e) => {
      var _a3, _b, _c;
      if (!app.editingShape && ((_a3 = ref.current) == null ? void 0 : _a3.contains(document.activeElement)) && !["INPUT", "TEXTAREA"].includes((_c = (_b = document.activeElement) == null ? void 0 : _b.tagName) != null ? _c : "")) {
        e.preventDefault();
        app.paste(e, shiftKeyDownRef.current);
      }
    };
    const onCopy = (e) => {
      var _a3, _b, _c;
      if (!app.editingShape && app.selectedShapes.size > 0 && ((_a3 = ref.current) == null ? void 0 : _a3.contains(document.activeElement)) && !["INPUT", "TEXTAREA"].includes((_c = (_b = document.activeElement) == null ? void 0 : _b.tagName) != null ? _c : "")) {
        e.preventDefault();
        app.copy();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("paste", onPaste);
    document.addEventListener("copy", onCopy);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("copy", onCopy);
    };
  }, []);
}

// ../../packages/react/src/components/Container/Container.tsx
var React23 = __toESM(require("react"));
var import_jsx_runtime4 = require("react/jsx-runtime");
var Container = observer(function Container2(_a3) {
  var _b = _a3, {
    id: id3,
    bounds,
    zIndex,
    rotation = 0,
    className = "",
    children
  } = _b, props = __objRest(_b, [
    "id",
    "bounds",
    "zIndex",
    "rotation",
    "className",
    "children"
  ]);
  const rBounds = React23.useRef(null);
  React23.useLayoutEffect(() => {
    const elm = rBounds.current;
    elm.style.transform = `translate(
        calc(${bounds.minX}px - var(--tl-padding)),
        calc(${bounds.minY}px - var(--tl-padding)))
        rotate(${rotation + (bounds.rotation || 0)}rad)`;
  }, [bounds.minX, bounds.minY, rotation, bounds.rotation]);
  React23.useLayoutEffect(() => {
    const elm = rBounds.current;
    elm.style.width = `calc(${Math.floor(bounds.width)}px + (var(--tl-padding) * 2))`;
    elm.style.height = `calc(${Math.floor(bounds.height)}px + (var(--tl-padding) * 2))`;
  }, [bounds.width, bounds.height]);
  React23.useLayoutEffect(() => {
    const elm = rBounds.current;
    if (zIndex !== void 0)
      elm.style.zIndex = zIndex.toString();
  }, [zIndex]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", __spreadProps(__spreadValues({
    id: id3,
    ref: rBounds,
    className: `tl-positioned ${className}`,
    "aria-label": "container"
  }, props), {
    children
  }));
});

// ../../packages/react/src/components/ContextBarContainer/ContextBarContainer.tsx
var React24 = __toESM(require("react"));
var import_jsx_runtime5 = require("react/jsx-runtime");
var ContextBarContainer = observer(function ContextBarContainer2({
  shapes: shapes2,
  hidden,
  bounds,
  rotation = 0
}) {
  const {
    components: { ContextBar: ContextBar2 },
    viewport: {
      bounds: vpBounds,
      camera: {
        point: [x2, y2],
        zoom
      }
    }
  } = useRendererContext();
  const rBounds = React24.useRef(null);
  const rotatedBounds = BoundsUtils.getRotatedBounds(bounds, rotation);
  const scaledBounds = BoundsUtils.multiplyBounds(rotatedBounds, zoom);
  useCounterScaledPosition(rBounds, bounds, rotation, 10005);
  if (!ContextBar2)
    throw Error("Expected a ContextBar component.");
  const screenBounds = BoundsUtils.translateBounds(scaledBounds, [x2 * zoom, y2 * zoom]);
  const offsets = {
    left: screenBounds.minX,
    right: vpBounds.width - screenBounds.maxX,
    top: screenBounds.minY,
    bottom: vpBounds.height - screenBounds.maxY,
    width: screenBounds.width,
    height: screenBounds.height
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", {
    ref: rBounds,
    className: "tl-counter-scaled-positioned",
    "aria-label": "context-bar-container",
    "data-html2canvas-ignore": "true",
    children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ContextBar2, {
      hidden,
      shapes: shapes2,
      bounds,
      offsets,
      scaledBounds,
      rotation
    })
  });
});

// ../../packages/react/src/components/HTMLLayer/HTMLLayer.tsx
var React25 = __toESM(require("react"));
var import_jsx_runtime6 = require("react/jsx-runtime");
var HTMLLayer = observer(function HTMLLayer2({ children }) {
  const rLayer = React25.useRef(null);
  const { viewport } = useRendererContext();
  const layer = rLayer.current;
  const { zoom, point } = viewport.camera;
  React25.useEffect(() => {
    if (!layer)
      return;
    layer.style.transform = `scale(${zoom}) translate3d(${point[0]}px, ${point[1]}px, 0)`;
  }, [zoom, point, layer]);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", {
    ref: rLayer,
    className: "tl-absolute tl-layer",
    children
  });
});

// ../../packages/react/src/components/Indicator/Indicator.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var Indicator = observer(function Shape({
  shape,
  isHovered = false,
  isSelected = false,
  isBinding = false,
  isEditing = false,
  isLocked = false,
  meta
}) {
  const {
    bounds,
    props: { scale, rotation = 0 },
    ReactIndicator
  } = shape;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Container, {
    "data-type": "Indicator",
    "data-html2canvas-ignore": "true",
    bounds,
    rotation,
    scale,
    zIndex: isEditing ? 1e3 : 1e4,
    children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(SVGContainer, {
      children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("g", {
        className: `tl-indicator-container ${isSelected ? "tl-selected" : "tl-hovered"} ${isLocked ? "tl-locked" : ""}`,
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ReactIndicator, {
          isEditing,
          isBinding,
          isHovered,
          isLocked,
          isSelected,
          isErasing: false,
          meta
        })
      })
    })
  });
});

// ../../packages/react/src/hooks/useShapeEvents.ts
var React26 = __toESM(require("react"));
function useShapeEvents(shape) {
  const app = useApp();
  const { inputs, callbacks } = useRendererContext();
  const rDoubleClickTimer = React26.useRef(-1);
  const events = React26.useMemo(() => {
    const onPointerMove = (e) => {
      var _a3;
      if (app.settings.penMode && (e.pointerType !== "pen" || !e.isPrimary)) {
        return;
      }
      const { order = 0 } = e;
      (_a3 = callbacks.onPointerMove) == null ? void 0 : _a3.call(callbacks, { type: "shape" /* Shape */, shape, order }, e);
      e.order = order + 1;
    };
    const onPointerDown = (e) => {
      var _a3, _b;
      if (app.settings.penMode && (e.pointerType !== "pen" || !e.isPrimary)) {
        return;
      }
      const { order = 0 } = e;
      if (!order)
        (_a3 = e.currentTarget) == null ? void 0 : _a3.setPointerCapture(e.pointerId);
      (_b = callbacks.onPointerDown) == null ? void 0 : _b.call(callbacks, { type: "shape" /* Shape */, shape, order }, e);
      e.order = order + 1;
    };
    const onPointerUp = (e) => {
      var _a3, _b, _c;
      if (app.settings.penMode && (e.pointerType !== "pen" || !e.isPrimary)) {
        return;
      }
      const { order = 0 } = e;
      if (!order)
        (_a3 = e.currentTarget) == null ? void 0 : _a3.releasePointerCapture(e.pointerId);
      (_b = callbacks.onPointerUp) == null ? void 0 : _b.call(callbacks, { type: "shape" /* Shape */, shape, order }, e);
      const now = Date.now();
      const elapsed = now - rDoubleClickTimer.current;
      if (elapsed > DOUBLE_CLICK_DURATION) {
        rDoubleClickTimer.current = now;
      } else {
        if (elapsed <= DOUBLE_CLICK_DURATION) {
          (_c = callbacks.onDoubleClick) == null ? void 0 : _c.call(callbacks, { type: "shape" /* Shape */, shape, order }, e);
          rDoubleClickTimer.current = -1;
        }
      }
      e.order = order + 1;
    };
    const onPointerEnter = (e) => {
      var _a3;
      if (app.settings.penMode && (e.pointerType !== "pen" || !e.isPrimary)) {
        return;
      }
      const { order = 0 } = e;
      (_a3 = callbacks.onPointerEnter) == null ? void 0 : _a3.call(callbacks, { type: "shape" /* Shape */, shape, order }, e);
      e.order = order + 1;
    };
    const onPointerLeave = (e) => {
      var _a3;
      if (app.settings.penMode && (e.pointerType !== "pen" || !e.isPrimary)) {
        return;
      }
      const { order = 0 } = e;
      (_a3 = callbacks.onPointerLeave) == null ? void 0 : _a3.call(callbacks, { type: "shape" /* Shape */, shape, order }, e);
      e.order = order + 1;
    };
    const onKeyDown = (e) => {
      var _a3;
      (_a3 = callbacks.onKeyDown) == null ? void 0 : _a3.call(callbacks, { type: "shape" /* Shape */, shape, order: -1 }, e);
    };
    const onKeyUp = (e) => {
      var _a3;
      (_a3 = callbacks.onKeyUp) == null ? void 0 : _a3.call(callbacks, { type: "shape" /* Shape */, shape, order: -1 }, e);
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

// ../../packages/react/src/components/QuickLinksContainer/QuickLinksContainer.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var QuickLinksContainer = observer(function QuickLinksContainer2({
  bounds,
  shape
}) {
  const {
    viewport: {
      camera: { zoom }
    },
    components: { QuickLinks: QuickLinks2 }
  } = useRendererContext();
  const app = useApp();
  const events = useShapeEvents(shape);
  if (!QuickLinks2)
    throw Error("Expected a QuickLinks component.");
  const stop2 = (e) => e.stopPropagation();
  const rounded = bounds.height * zoom < 50 || !app.selectedShapesArray.includes(shape);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Container, {
    bounds,
    className: "tl-quick-links-container",
    "data-html2canvas-ignore": "true",
    children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(HTMLContainer, {
      children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", __spreadProps(__spreadValues({
        style: {
          position: "absolute",
          top: "100%",
          pointerEvents: "all",
          transformOrigin: "left top",
          paddingTop: "8px",
          transform: "scale(var(--tl-scale))",
          minWidth: "320px"
        }
      }, events), {
        onPointerDown: stop2,
        children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(QuickLinks2, {
          className: "tl-backlinks-count " + (rounded ? "tl-backlinks-count-rounded" : ""),
          id: shape.id,
          shape
        })
      }))
    })
  });
});

// ../../packages/react/src/components/BacklinksCountContainer/BacklinksCountContainer.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
var BacklinksCountContainer = observer(function BacklinksCountContainer2({ bounds, shape }) {
  const {
    viewport: {
      camera: { zoom }
    },
    components: { BacklinksCount: BacklinksCount2 }
  } = useRendererContext();
  const app = useApp();
  if (!BacklinksCount2)
    throw Error("Expected a BacklinksCount component.");
  const stop2 = (e) => e.stopPropagation();
  const rounded = bounds.height * zoom < 50 || !app.selectedShapesArray.includes(shape) || shape.hideSelection;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Container, {
    bounds,
    className: "tl-backlinks-count-container",
    children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(HTMLContainer, {
      children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", {
        style: {
          position: "absolute",
          left: "100%",
          pointerEvents: "all",
          transformOrigin: "left top",
          transform: "translateY(6px) scale(var(--tl-scale))"
        },
        onPointerDown: stop2,
        onWheelCapture: stop2,
        onKeyDown: stop2,
        title: "Shape Backlinks",
        children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(BacklinksCount2, {
          className: "tl-backlinks-count " + (rounded ? "tl-backlinks-count-rounded" : ""),
          id: shape.id,
          shape
        })
      })
    })
  });
});

// ../../packages/react/src/components/SelectionDetailContainer/SelectionDetailContainer.tsx
var React27 = __toESM(require("react"));
var import_jsx_runtime10 = require("react/jsx-runtime");
var SelectionDetailContainer = observer(function SelectionDetail({
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
  const rBounds = React27.useRef(null);
  const scaledBounds = BoundsUtils.multiplyBounds(bounds, zoom);
  useCounterScaledPosition(rBounds, bounds, rotation, 10003);
  if (!SelectionDetail4)
    throw Error("Expected a SelectionDetail component.");
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", {
    ref: rBounds,
    className: `tl-counter-scaled-positioned ${hidden ? `tl-fade-out` : ""}`,
    "aria-label": "bounds-detail-container",
    "data-html2canvas-ignore": "true",
    children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(SelectionDetail4, {
      shapes: shapes2,
      bounds,
      scaledBounds,
      zoom,
      rotation,
      detail
    })
  });
});

// ../../packages/react/src/components/Shape/Shape.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
var Shape2 = observer(function Shape3({
  shape,
  isHovered = false,
  isSelected = false,
  isBinding = false,
  isErasing = false,
  isEditing = false,
  onEditingEnd,
  asset,
  meta,
  zIndex
}) {
  const {
    bounds,
    props: { rotation, scale },
    ReactComponent
  } = shape;
  const app = useApp();
  const events = useShapeEvents(shape);
  const parentGroup = app.getParentGroup(shape);
  const isParentGrpupSelected = app.selectedIds.has(parentGroup == null ? void 0 : parentGroup.id);
  const ignoreExport = !isSelected && !isParentGrpupSelected && app.selectedShapes.size !== 0 || null;
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Container, {
    "data-shape-id": shape.id,
    "data-html2canvas-ignore": ignoreExport,
    zIndex,
    "data-type": "Shape",
    bounds,
    rotation,
    scale,
    children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ReactComponent, {
      meta,
      isEditing,
      isBinding,
      isHovered,
      isSelected,
      isErasing,
      events,
      asset,
      onEditingEnd
    })
  });
});

// ../../packages/react/src/components/ui/Grid/Grid.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
var STEPS = [
  [-1, 0.15, 64],
  [0.05, 0.375, 16],
  [0.15, 1, 4],
  [0.7, 2.5, 1]
];
var SVGGrid = observer(function CanvasGrid({ size }) {
  const {
    viewport: {
      camera: { point, zoom }
    }
  } = useRendererContext();
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("svg", {
    className: "tl-grid",
    version: "1.1",
    xmlns: "http://www.w3.org/2000/svg",
    "data-html2canvas-ignore": "true",
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("defs", {
        children: STEPS.map(([min, mid, _size], i2) => {
          const s2 = _size * size * zoom;
          const xo = point[0] * zoom;
          const yo = point[1] * zoom;
          const gxo = xo > 0 ? xo % s2 : s2 + xo % s2;
          const gyo = yo > 0 ? yo % s2 : s2 + yo % s2;
          const opacity = modulate(zoom, [min, mid], [0, 1]);
          const hide = opacity > 2 || opacity < 0.1;
          return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("pattern", {
            id: `grid-${i2}`,
            width: s2,
            height: s2,
            patternUnits: "userSpaceOnUse",
            children: !hide && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", {
              className: `tl-grid-dot`,
              cx: gxo,
              cy: gyo,
              r: 1.5,
              opacity: clamp(opacity, 0, 1)
            })
          }, `grid-pattern-${i2}`);
        })
      }),
      STEPS.map((_2, i2) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", {
        width: "100%",
        height: "100%",
        fill: `url(#grid-${i2})`
      }, `grid-rect-${i2}`))
    ]
  });
});
var Grid = observer(function Grid2({ size }) {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(SVGGrid, {
    size
  });
});

// ../../packages/react/src/components/ui/SelectionBackground/SelectionBackground.tsx
var import_jsx_runtime13 = require("react/jsx-runtime");
var SelectionBackground = observer(function SelectionBackground2({
  bounds
}) {
  const events = useBoundsEvents("background");
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(SVGContainer, __spreadProps(__spreadValues({
    "data-html2canvas-ignore": "true"
  }, events), {
    children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("rect", {
      className: "tl-bounds-bg",
      width: Math.max(1, bounds.width),
      height: Math.max(1, bounds.height),
      pointerEvents: "all",
      rx: 8,
      ry: 8
    })
  }));
});

// ../../packages/react/src/components/ui/SelectionDetail/SelectionDetail.tsx
var React28 = require("react");
var import_jsx_runtime14 = require("react/jsx-runtime");
var SelectionDetail2 = observer(function SelectionDetail3({
  scaledBounds,
  shapes: shapes2,
  detail = "size",
  rotation = 0
}) {
  var _a3;
  const selectionRotation = shapes2.length === 1 ? rotation : (_a3 = scaledBounds.rotation) != null ? _a3 : 0;
  const isFlipped = !(selectionRotation < TAU || selectionRotation > TAU * 3);
  const isLine = shapes2.length === 1 && shapes2[0].type === "line";
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(HTMLContainer, {
    centered: true,
    children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", {
      className: "tl-bounds-detail",
      style: {
        transform: isFlipped ? `rotate(${Math.PI + selectionRotation}rad) translateY(${scaledBounds.height / 2 + 32}px)` : `rotate(${selectionRotation}rad) translateY(${scaledBounds.height / 2 + 24}px)`,
        padding: "2px 3px",
        borderRadius: "1px"
      },
      children: isLine ? `${src_default.dist(
        shapes2[0].props.handles.start.point,
        shapes2[0].props.handles.end.point
      ).toFixed()}` : detail === "size" ? `${scaledBounds.width.toFixed()} \xD7 ${scaledBounds.height.toFixed()}` : `\u2220${GeomUtils.radiansToDegrees(GeomUtils.clampRadians(rotation)).toFixed()}\xB0`
    })
  });
});

// ../../packages/react/src/components/ui/SelectionForeground/handles/CornerHandle.tsx
var import_jsx_runtime15 = require("react/jsx-runtime");
var cornerBgClassnames = {
  ["top_left_corner" /* TopLeft */]: "tl-cursor-nwse",
  ["top_right_corner" /* TopRight */]: "tl-cursor-nesw",
  ["bottom_right_corner" /* BottomRight */]: "tl-cursor-nwse",
  ["bottom_left_corner" /* BottomLeft */]: "tl-cursor-nesw"
};
var CornerHandle = observer(function CornerHandle2({
  cx: cx2,
  cy,
  size,
  targetSize,
  corner,
  isHidden
}) {
  const events = useBoundsEvents(corner);
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("g", __spreadProps(__spreadValues({
    opacity: isHidden ? 0 : 1
  }, events), {
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("rect", {
        className: "tl-transparent " + (isHidden ? "" : cornerBgClassnames[corner]),
        "aria-label": `${corner} target`,
        x: cx2 - targetSize * 1.25,
        y: cy - targetSize * 1.25,
        width: targetSize * 2.5,
        height: targetSize * 2.5,
        pointerEvents: isHidden ? "none" : "all"
      }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("rect", {
        className: "tl-corner-handle",
        "aria-label": `${corner} handle`,
        x: cx2 - size / 2,
        y: cy - size / 2,
        width: size,
        height: size,
        pointerEvents: "none"
      })
    ]
  }));
});

// ../../packages/react/src/components/ui/SelectionForeground/handles/CloneHandle.tsx
var import_jsx_runtime16 = require("react/jsx-runtime");
var CloneHandle = observer(function CloneHandle2({
  cx: cx2,
  cy,
  size,
  direction,
  isHidden
}) {
  const app = useApp();
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("g", {
    className: "tl-clone-handle",
    opacity: isHidden ? 0 : 1,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("circle", {
        "aria-label": `${direction} handle`,
        pointerEvents: "all",
        onPointerDown: (e) => app.api.clone(direction),
        cx: cx2,
        cy,
        r: size
      }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", {
        x1: cx2 - size / 2,
        y1: cy,
        x2: cx2 + size / 2,
        y2: cy
      }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("line", {
        x1: cx2,
        y1: cy - size / 2,
        x2: cx2,
        y2: cy + size / 2
      })
    ]
  });
});

// ../../packages/react/src/components/ui/SelectionForeground/handles/EdgeHandle.tsx
var import_jsx_runtime17 = require("react/jsx-runtime");
var edgeClassnames = {
  ["top_edge" /* Top */]: "tl-cursor-ns",
  ["right_edge" /* Right */]: "tl-cursor-ew",
  ["bottom_edge" /* Bottom */]: "tl-cursor-ns",
  ["left_edge" /* Left */]: "tl-cursor-ew"
};
var EdgeHandle = observer(function EdgeHandle2({
  x: x2,
  y: y2,
  width,
  height,
  targetSize,
  edge,
  disabled,
  isHidden
}) {
  const events = useBoundsEvents(edge);
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("rect", __spreadValues({
    pointerEvents: isHidden || disabled ? "none" : "all",
    className: "tl-transparent tl-edge-handle " + (isHidden ? "" : edgeClassnames[edge]),
    "aria-label": `${edge} target`,
    opacity: isHidden ? 0 : 1,
    x: x2 - targetSize,
    y: y2 - targetSize,
    width: Math.max(1, width + targetSize * 2),
    height: Math.max(1, height + targetSize * 2)
  }, events));
});

// ../../packages/react/src/components/ui/SelectionForeground/handles/RotateHandle.tsx
var import_jsx_runtime18 = require("react/jsx-runtime");
var RotateHandle = observer(function RotateHandle2({
  cx: cx2,
  cy,
  size,
  targetSize,
  isHidden
}) {
  const events = useBoundsEvents("rotate");
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("g", __spreadProps(__spreadValues({
    opacity: isHidden ? 0 : 1
  }, events), {
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("circle", {
        className: "tl-transparent ",
        "aria-label": "rotate target",
        cx: cx2,
        cy,
        r: targetSize,
        pointerEvents: isHidden ? "none" : "all"
      }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("circle", {
        className: "tl-rotate-handle",
        "aria-label": "rotate handle",
        cx: cx2,
        cy,
        r: size / 2,
        pointerEvents: "none"
      })
    ]
  }));
});

// ../../packages/react/src/components/ui/SelectionForeground/handles/RotateCornerHandle.tsx
var React29 = require("react");
var import_jsx_runtime19 = require("react/jsx-runtime");
var RotateCornerHandle = observer(function RotateCornerHandle2({
  cx: cx2,
  cy,
  targetSize,
  corner,
  isHidden
}) {
  const events = useBoundsEvents(corner);
  return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("g", __spreadProps(__spreadValues({
    opacity: isHidden ? 0 : 1
  }, events), {
    children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("rect", {
      className: "tl-transparent",
      "aria-label": `${corner} target`,
      x: cx2 - targetSize * 2.5,
      y: cy - targetSize * 2.5,
      width: targetSize * 3,
      height: targetSize * 3,
      pointerEvents: isHidden ? "none" : "all"
    })
  }));
});

// ../../packages/react/src/components/ui/SelectionForeground/SelectionForeground.tsx
var import_jsx_runtime20 = require("react/jsx-runtime");
var SelectionForeground = observer(function SelectionForeground2({
  bounds,
  showResizeHandles,
  showRotateHandles,
  showCloneHandles,
  shapes: shapes2
}) {
  var _a3, _b;
  const app = useApp();
  let { width, height } = bounds;
  const zoom = app.viewport.camera.zoom;
  const size = 8 / zoom;
  const targetSize = 6 / zoom;
  const clonePadding = 30 / zoom;
  const cloneHandleSize = size * 2;
  const canResize = shapes2.length === 1 ? shapes2[0].canResize : [true, true];
  const borderRadius = (_b = (_a3 = app.editingShape) == null ? void 0 : _a3.props["borderRadius"]) != null ? _b : 0;
  return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_jsx_runtime20.Fragment, {
    children: shapes2.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(SVGContainer, {
      children: [
        !app.editingShape && /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("rect", {
          className: "tl-bounds-fg",
          width: Math.max(width, 1),
          height: Math.max(height, 1),
          rx: borderRadius,
          ry: borderRadius,
          pointerEvents: "none"
        }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(EdgeHandle, {
          x: targetSize * 2,
          y: 0,
          width: width - targetSize * 4,
          height: 0,
          targetSize,
          edge: "top_edge" /* Top */,
          disabled: !canResize[1],
          isHidden: !showResizeHandles
        }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(EdgeHandle, {
          x: width,
          y: targetSize * 2,
          width: 0,
          height: height - targetSize * 4,
          targetSize,
          edge: "right_edge" /* Right */,
          disabled: !canResize[0],
          isHidden: !showResizeHandles
        }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(EdgeHandle, {
          x: targetSize * 2,
          y: height,
          width: width - targetSize * 4,
          height: 0,
          targetSize,
          edge: "bottom_edge" /* Bottom */,
          disabled: !canResize[1],
          isHidden: !showResizeHandles
        }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(EdgeHandle, {
          x: 0,
          y: targetSize * 2,
          width: 0,
          height: height - targetSize * 4,
          targetSize,
          edge: "left_edge" /* Left */,
          disabled: !canResize[0],
          isHidden: !showResizeHandles
        }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(RotateCornerHandle, {
          cx: 0,
          cy: 0,
          targetSize,
          corner: "top_left_resize_corner" /* TopLeft */,
          isHidden: !showRotateHandles
        }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(RotateCornerHandle, {
          cx: width + targetSize * 2,
          cy: 0,
          targetSize,
          corner: "top_right_resize_corner" /* TopRight */,
          isHidden: !showRotateHandles
        }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(RotateCornerHandle, {
          cx: width + targetSize * 2,
          cy: height + targetSize * 2,
          targetSize,
          corner: "bottom_right_resize_corner" /* BottomRight */,
          isHidden: !showRotateHandles
        }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(RotateCornerHandle, {
          cx: 0,
          cy: height + targetSize * 2,
          targetSize,
          corner: "bottom_left_resize_corner" /* BottomLeft */,
          isHidden: !showRotateHandles
        }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(CloneHandle, {
          cx: -clonePadding,
          cy: height / 2,
          size: cloneHandleSize,
          direction: "left" /* Left */,
          isHidden: !showCloneHandles
        }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(CloneHandle, {
          cx: width + clonePadding,
          cy: height / 2,
          size: cloneHandleSize,
          direction: "right" /* Right */,
          isHidden: !showCloneHandles
        }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(CloneHandle, {
          cx: width / 2,
          cy: height + clonePadding,
          size: cloneHandleSize,
          direction: "down" /* Down */,
          isHidden: !showCloneHandles
        }),
        (canResize == null ? void 0 : canResize.every((r2) => r2)) && /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(import_jsx_runtime20.Fragment, {
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(CornerHandle, {
              cx: 0,
              cy: 0,
              size,
              targetSize,
              corner: "top_left_corner" /* TopLeft */,
              isHidden: !showResizeHandles
            }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(CornerHandle, {
              cx: width,
              cy: 0,
              size,
              targetSize,
              corner: "top_right_corner" /* TopRight */,
              isHidden: !showResizeHandles
            }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(CornerHandle, {
              cx: width,
              cy: height,
              size,
              targetSize,
              corner: "bottom_right_corner" /* BottomRight */,
              isHidden: !showResizeHandles
            }),
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(CornerHandle, {
              cx: 0,
              cy: height,
              size,
              targetSize,
              corner: "bottom_left_corner" /* BottomLeft */,
              isHidden: !showResizeHandles
            })
          ]
        })
      ]
    })
  });
});

// ../../packages/react/src/components/ui/Brush/Brush.tsx
var import_jsx_runtime21 = require("react/jsx-runtime");
var Brush = observer(function Brush2({ bounds }) {
  return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Container, {
    bounds,
    zIndex: 10001,
    children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(SVGContainer, {
      children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("rect", {
        className: "tl-brush",
        x: 0,
        y: 0,
        width: bounds.width,
        height: bounds.height
      })
    })
  });
});

// ../../packages/react/src/components/ui/Cursor/Cursor.tsx
var import_jsx_runtime22 = require("react/jsx-runtime");
var Cursor = observer(function Cursor2() {
  return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_jsx_runtime22.Fragment, {});
});

// ../../packages/react/src/components/ui/Handle/Handle.tsx
var import_jsx_runtime23 = require("react/jsx-runtime");
var Handle = observer(function Handle2({
  shape,
  handle,
  id: id3
}) {
  const events = useHandleEvents(shape, id3);
  const [x2, y2] = handle.point;
  return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("g", __spreadProps(__spreadValues({
    className: "tl-handle",
    "aria-label": "handle"
  }, events), {
    transform: `translate(${x2}, ${y2})`,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("circle", {
        className: "tl-handle-bg",
        pointerEvents: "all"
      }),
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("circle", {
        className: "tl-counter-scaled tl-handle",
        pointerEvents: "none",
        r: 4
      })
    ]
  }));
});

// ../../packages/react/src/components/ui/DirectionIndicator/DirectionIndicator.tsx
var React30 = __toESM(require("react"));
var import_jsx_runtime24 = require("react/jsx-runtime");
var DirectionIndicator = observer(function DirectionIndicator2({ direction }) {
  const {
    viewport: { bounds }
  } = useRendererContext();
  const rIndicator = React30.useRef(null);
  React30.useLayoutEffect(() => {
    const elm = rIndicator.current;
    if (!elm)
      return;
    const center = [bounds.width / 2, bounds.height / 2];
    const insetBoundSides = BoundsUtils.getRectangleSides(
      [12, 12],
      [bounds.width - 24, bounds.height - 24]
    );
    for (const [_2, [A3, B3]] of insetBoundSides) {
      const int = intersectRayLineSegment(center, direction, A3, B3);
      if (!int.didIntersect)
        continue;
      const point = int.points[0];
      elm.style.transform = `translate(${point[0] - 6}px,${point[1] - 6}px) rotate(${src_default.toAngle(
        direction
      )}rad)`;
    }
  }, [direction, bounds]);
  return /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", {
    ref: rIndicator,
    className: "tl-direction-indicator",
    "data-html2canvas-ignore": "true",
    children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("svg", {
      height: 12,
      width: 12,
      children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("polygon", {
        points: "0,0 12,6 0,12"
      })
    })
  });
});

// ../../packages/react/src/components/Canvas/Canvas.tsx
var import_jsx_runtime25 = require("react/jsx-runtime");
var Canvas = observer(function Renderer({
  id: id3,
  className,
  brush,
  shapes: shapes2,
  assets,
  bindingShapes,
  editingShape,
  hoveredShape,
  hoveredGroup,
  selectionBounds,
  selectedShapes,
  erasingShapes,
  selectionDirectionHint,
  cursor = "default" /* Default */,
  cursorRotation = 0,
  selectionRotation = 0,
  showSelection = true,
  showHandles = true,
  showSelectionRotation = false,
  showResizeHandles = true,
  showRotateHandles = true,
  showCloneHandles = true,
  showSelectionDetail = true,
  showContextBar = true,
  showGrid = true,
  gridSize = 8,
  onEditingEnd = NOOP,
  theme = EMPTY_OBJECT,
  children
}) {
  var _a3;
  const rContainer = React31.useRef(null);
  const { viewport, components, meta } = useRendererContext();
  const app = useApp();
  const onBoundsChange = React31.useCallback((bounds) => {
    app.inputs.updateContainerOffset([bounds.minX, bounds.minY]);
  }, []);
  useStylesheet(theme, id3);
  usePreventNavigation(rContainer);
  useResizeObserver(rContainer, viewport, onBoundsChange);
  useGestureEvents(rContainer);
  useRestoreCamera();
  useCursor(rContainer, cursor, cursorRotation);
  useZoom(rContainer);
  useKeyboardEvents(rContainer);
  const events = useCanvasEvents();
  const onlySelectedShape = (selectedShapes == null ? void 0 : selectedShapes.length) === 1 && selectedShapes[0];
  const onlySelectedShapeWithHandles = onlySelectedShape && "handles" in onlySelectedShape.props ? selectedShapes == null ? void 0 : selectedShapes[0] : void 0;
  const selectedShapesSet = React31.useMemo(() => new Set(selectedShapes || []), [selectedShapes]);
  const erasingShapesSet = React31.useMemo(() => new Set(erasingShapes || []), [erasingShapes]);
  const singleSelectedShape = (selectedShapes == null ? void 0 : selectedShapes.length) === 1 ? selectedShapes[0] : void 0;
  const hoveredShapes = [.../* @__PURE__ */ new Set([hoveredGroup, hoveredShape])].filter(isNonNullable);
  return /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", {
    ref: rContainer,
    className: `tl-container ${className != null ? className : ""}`,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)("div", __spreadProps(__spreadValues({
        tabIndex: -1,
        className: "tl-absolute tl-canvas"
      }, events), {
        children: [
          showGrid && components.Grid && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(components.Grid, {
            size: gridSize
          }),
          /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(HTMLLayer, {
            children: [
              components.SelectionBackground && selectedShapes && selectionBounds && showSelection && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(Container, {
                "data-type": "SelectionBackground",
                bounds: selectionBounds,
                zIndex: 2,
                "data-html2canvas-ignore": "true",
                children: /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(components.SelectionBackground, {
                  shapes: selectedShapes,
                  bounds: selectionBounds,
                  showResizeHandles,
                  showRotateHandles
                })
              }),
              shapes2 && shapes2.map((shape, i2) => /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(Shape2, {
                shape,
                asset: assets && shape.props.assetId ? assets[shape.props.assetId] : void 0,
                isEditing: shape === editingShape,
                isHovered: shape === hoveredShape,
                isBinding: bindingShapes == null ? void 0 : bindingShapes.includes(shape),
                isSelected: selectedShapesSet.has(shape),
                isErasing: erasingShapesSet.has(shape),
                meta,
                zIndex: 1e3 + i2,
                onEditingEnd
              }, "shape_" + shape.id)),
              !app.isIn("select.pinching") && (selectedShapes == null ? void 0 : selectedShapes.map((shape) => /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(Indicator, {
                shape,
                isEditing: shape === editingShape,
                isHovered: false,
                isBinding: false,
                isSelected: true,
                isLocked: shape.props.isLocked
              }, "selected_indicator_" + shape.id))),
              hoveredShapes.map(
                (s2) => s2 !== editingShape && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(Indicator, {
                  shape: s2
                }, "hovered_indicator_" + s2.id)
              ),
              singleSelectedShape && components.BacklinksCount && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(BacklinksCountContainer, {
                hidden: false,
                bounds: singleSelectedShape.bounds,
                shape: singleSelectedShape
              }),
              hoveredShape && hoveredShape !== singleSelectedShape && components.QuickLinks && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(QuickLinksContainer, {
                hidden: false,
                bounds: hoveredShape.bounds,
                shape: hoveredShape
              }),
              brush && components.Brush && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(components.Brush, {
                bounds: brush
              }),
              selectedShapes && selectionBounds && /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(import_jsx_runtime25.Fragment, {
                children: [
                  showSelection && components.SelectionForeground && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(Container, {
                    "data-type": "SelectionForeground",
                    "data-html2canvas-ignore": "true",
                    bounds: selectionBounds,
                    zIndex: editingShape && selectedShapes.includes(editingShape) ? 1002 : 10002,
                    children: /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(components.SelectionForeground, {
                      shapes: selectedShapes.filter((shape) => !shape.props.isLocked),
                      bounds: selectionBounds,
                      showResizeHandles,
                      showRotateHandles,
                      showCloneHandles
                    })
                  }),
                  showHandles && onlySelectedShapeWithHandles && components.Handle && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(Container, {
                    "data-type": "onlySelectedShapeWithHandles",
                    "data-html2canvas-ignore": "true",
                    bounds: selectionBounds,
                    zIndex: 10003,
                    children: /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(SVGContainer, {
                      children: Object.entries((_a3 = onlySelectedShapeWithHandles.props.handles) != null ? _a3 : {}).map(
                        ([id4, handle]) => React31.createElement(components.Handle, {
                          key: `${handle.id}_handle_${handle.id}`,
                          shape: onlySelectedShapeWithHandles,
                          handle,
                          id: id4
                        })
                      )
                    })
                  }),
                  selectedShapes && components.SelectionDetail && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(SelectionDetailContainer, {
                    "data-html2canvas-ignore": "true",
                    shapes: selectedShapes,
                    bounds: selectionBounds,
                    detail: showSelectionRotation ? "rotation" : "size",
                    hidden: !showSelectionDetail,
                    rotation: selectionRotation
                  }, "detail" + selectedShapes.map((shape) => shape.id).join(""))
                ]
              })
            ]
          }),
          selectionDirectionHint && selectionBounds && selectedShapes && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(DirectionIndicator, {
            direction: selectionDirectionHint,
            bounds: selectionBounds,
            shapes: selectedShapes
          }),
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("div", {
            id: "tl-dev-tools-canvas-anchor",
            "data-html2canvas-ignore": "true"
          })
        ]
      })),
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(HTMLLayer, {
        children: selectedShapes && selectionBounds && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(import_jsx_runtime25.Fragment, {
          children: selectedShapes && components.ContextBar && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(ContextBarContainer, {
            shapes: selectedShapes.filter((s2) => !s2.props.isLocked),
            hidden: !showContextBar,
            bounds: singleSelectedShape ? singleSelectedShape.bounds : selectionBounds,
            rotation: singleSelectedShape ? singleSelectedShape.props.rotation : 0
          }, "context" + selectedShapes.map((shape) => shape.id).join(""))
        })
      }),
      children
    ]
  });
});

// ../../packages/react/src/components/Renderer/RendererContext.tsx
var React33 = __toESM(require("react"));

// ../../packages/react/src/components/SVGLayer/SVGLayer.tsx
var React32 = __toESM(require("react"));
var import_jsx_runtime26 = require("react/jsx-runtime");
var SVGLayer = observer(function SVGLayer2({ children }) {
  const rGroup = React32.useRef(null);
  const { viewport } = useRendererContext();
  React32.useEffect(
    () => autorun(() => {
      const group = rGroup.current;
      if (!group)
        return;
      const { zoom, point } = viewport.camera;
      group.style.transform = `scale(${zoom}) translateX(${point[0]}px) translateY(${point[1]}px)`;
    }),
    []
  );
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("svg", {
    className: "tl-absolute tl-overlay",
    pointerEvents: "none",
    children: /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("g", {
      ref: rGroup,
      pointerEvents: "none",
      children
    })
  });
});

// ../../packages/react/src/components/AppProvider.tsx
var import_jsx_runtime27 = require("react/jsx-runtime");
var AppProvider = observer(function App(props) {
  const app = useAppSetup(props);
  const context = getAppContext(props.id);
  usePropControl(app, props);
  useSetup(app, props);
  return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(context.Provider, {
    value: app,
    children: props.children
  });
});

// ../../packages/react/src/components/Renderer/RendererContext.tsx
var import_jsx_runtime28 = require("react/jsx-runtime");
var RendererContext = observer(function App2({
  id: id3 = "noid",
  viewport,
  inputs,
  callbacks = EMPTY_OBJECT,
  meta = EMPTY_OBJECT,
  components = EMPTY_OBJECT,
  children
}) {
  const [currentContext, setCurrentContext] = React33.useState(() => {
    const _a3 = components, {
      Brush: Brush3,
      ContextBar: ContextBar2,
      DirectionIndicator: DirectionIndicator3,
      Grid: Grid3,
      Handle: Handle3,
      SelectionBackground: SelectionBackground3,
      SelectionDetail: SelectionDetail4,
      SelectionForeground: SelectionForeground3
    } = _a3, rest = __objRest(_a3, [
      "Brush",
      "ContextBar",
      "DirectionIndicator",
      "Grid",
      "Handle",
      "SelectionBackground",
      "SelectionDetail",
      "SelectionForeground"
    ]);
    return {
      id: id3,
      viewport,
      inputs,
      callbacks,
      meta,
      components: __spreadProps(__spreadValues({}, rest), {
        Brush: Brush3 === null ? void 0 : Brush,
        ContextBar: ContextBar2,
        DirectionIndicator: DirectionIndicator3 === null ? void 0 : DirectionIndicator,
        Grid: Grid3 === null ? void 0 : Grid,
        Handle: Handle3 === null ? void 0 : Handle,
        SelectionBackground: SelectionBackground3 === null ? void 0 : SelectionBackground,
        SelectionDetail: SelectionDetail4 === null ? void 0 : SelectionDetail2,
        SelectionForeground: SelectionForeground3 === null ? void 0 : SelectionForeground
      })
    };
  });
  React33.useLayoutEffect(() => {
    const _a3 = components, {
      Brush: Brush3,
      ContextBar: ContextBar2,
      DirectionIndicator: DirectionIndicator3,
      Grid: Grid3,
      Handle: Handle3,
      SelectionBackground: SelectionBackground3,
      SelectionDetail: SelectionDetail4,
      SelectionForeground: SelectionForeground3
    } = _a3, rest = __objRest(_a3, [
      "Brush",
      "ContextBar",
      "DirectionIndicator",
      "Grid",
      "Handle",
      "SelectionBackground",
      "SelectionDetail",
      "SelectionForeground"
    ]);
    return autorun(() => {
      setCurrentContext({
        id: id3,
        viewport,
        inputs,
        callbacks,
        meta,
        components: __spreadProps(__spreadValues({}, rest), {
          Brush: Brush3 === null ? void 0 : Brush,
          ContextBar: ContextBar2,
          DirectionIndicator: DirectionIndicator3 === null ? void 0 : DirectionIndicator,
          Grid: Grid3 === null ? void 0 : Grid,
          Handle: Handle3 === null ? void 0 : Handle,
          SelectionBackground: SelectionBackground3 === null ? void 0 : SelectionBackground,
          SelectionDetail: SelectionDetail4 === null ? void 0 : SelectionDetail2,
          SelectionForeground: SelectionForeground3 === null ? void 0 : SelectionForeground
        })
      });
    });
  }, []);
  const context = getRendererContext(id3);
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(context.Provider, {
    value: currentContext,
    children
  });
});

// ../../packages/react/src/components/Renderer/Renderer.tsx
var import_jsx_runtime29 = require("react/jsx-runtime");
function Renderer2(_a3) {
  var _b = _a3, {
    viewport,
    inputs,
    callbacks,
    components
  } = _b, rest = __objRest(_b, [
    "viewport",
    "inputs",
    "callbacks",
    "components"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(RendererContext, {
    id: rest.id,
    viewport,
    inputs,
    callbacks,
    components,
    meta: rest.meta,
    children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Canvas, __spreadValues({}, rest))
  });
}

// ../../packages/react/src/components/AppCanvas.tsx
var import_jsx_runtime30 = require("react/jsx-runtime");
var AppCanvas = observer(function InnerApp(props) {
  const app = useApp();
  return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(Renderer2, __spreadValues({
    viewport: app.viewport,
    inputs: app.inputs,
    callbacks: app._events,
    brush: app.brush,
    editingShape: app.editingShape,
    hoveredShape: app.hoveredShape,
    hoveredGroup: app.hoveredGroup,
    bindingShapes: app.bindingShapes,
    selectionDirectionHint: app.selectionDirectionHint,
    selectionBounds: app.selectionBounds,
    selectedShapes: app.selectedShapesArray,
    erasingShapes: app.erasingShapesArray,
    shapes: app.shapes,
    assets: app.assets,
    showGrid: app.settings.showGrid,
    penMode: app.settings.penMode,
    showSelection: app.showSelection,
    showSelectionRotation: app.showSelectionRotation,
    showResizeHandles: app.showResizeHandles,
    showRotateHandles: app.showRotateHandles,
    showCloneHandles: app.showCloneHandles,
    showSelectionDetail: app.showSelectionDetail,
    showContextBar: app.showContextBar,
    cursor: app.cursors.cursor,
    cursorRotation: app.cursors.rotation,
    selectionRotation: app.selectionRotation,
    onEditingEnd: app.clearEditingState
  }, props));
});

// ../../packages/react/src/components/App.tsx
var import_jsx_runtime31 = require("react/jsx-runtime");

// ../../packages/react/src/index.ts
function getContextBarTranslation(barSize, offset) {
  let x2 = 0;
  let y2 = 0;
  if (offset.top < 116) {
    y2 = offset.height / 2 + 40;
    if (offset.bottom < 140) {
      y2 += offset.bottom - 140;
    }
  } else {
    y2 = -(offset.height / 2 + 40);
  }
  if (offset.left + offset.width / 2 - barSize[0] / 2 < 16) {
    x2 += -(offset.left + offset.width / 2 - barSize[0] / 2 - 16);
  } else if (offset.right + offset.width / 2 - barSize[0] / 2 < 16) {
    x2 += offset.right + offset.width / 2 - barSize[0] / 2 - 16;
  }
  return [x2, y2];
}

// src/app.tsx
var React69 = __toESM(require("react"));

// src/components/ActionBar/ActionBar.tsx
var React36 = __toESM(require("react"));

// src/components/icons/TablerIcon.tsx
var import_jsx_runtime32 = require("react/jsx-runtime");
var extendedIcons = [
  "add-link",
  "block-search",
  "block",
  "connector",
  "group",
  "internal-link",
  "link-to-block",
  "link-to-page",
  "link-to-whiteboard",
  "move-to-sidebar-right",
  "object-compact",
  "object-expanded",
  "open-as-page",
  "page-search",
  "page",
  "references-hide",
  "references-show",
  "select-cursor",
  "text",
  "ungroup",
  "whiteboard-element",
  "whiteboard"
];
var cx = (...args) => args.join(" ");
var TablerIcon = (_a3) => {
  var _b = _a3, {
    name,
    className
  } = _b, props = __objRest(_b, [
    "name",
    "className"
  ]);
  const classNamePrefix = extendedIcons.includes(name) ? `tie tie-` : `ti ti-`;
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("i", __spreadValues({
    className: cx(classNamePrefix + name, className)
  }, props));
};

// src/components/Tooltip/Tooltip.tsx
var import_jsx_runtime33 = require("react/jsx-runtime");
var LSUI = window.LSUI;
function Tooltip(_a3) {
  var _b = _a3, { side, content, sideOffset = 10 } = _b, rest = __objRest(_b, ["side", "content", "sideOffset"]);
  return content ? /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(LSUI.TooltipProvider, {
    delayDuration: 300,
    children: /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(LSUI.Tooltip, {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(LSUI.TooltipTrigger, {
          asChild: true,
          children: rest.children
        }),
        /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(LSUI.TooltipContent, __spreadProps(__spreadValues({
          sideOffset,
          side
        }, rest), {
          children: [
            content,
            /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(LSUI.TooltipArrow, {
              className: "popper-arrow"
            })
          ]
        }))
      ]
    })
  }) : /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(import_jsx_runtime33.Fragment, {
    children: rest.children
  });
}

// src/components/Button/Button.tsx
var import_jsx_runtime34 = require("react/jsx-runtime");
function Button(_a3) {
  var _b = _a3, { className, tooltip, tooltipSide } = _b, rest = __objRest(_b, ["className", "tooltip", "tooltipSide"]);
  return /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(Tooltip, {
    content: tooltip,
    side: tooltipSide,
    children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("button", __spreadValues({
      className: "tl-button " + (className != null ? className : "")
    }, rest))
  });
}

// src/components/Button/CircleButton.tsx
var import_jsx_runtime35 = require("react/jsx-runtime");
var CircleButton = ({
  style,
  icon,
  onClick
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("button", {
    "data-html2canvas-ignore": "true",
    style,
    className: "tl-circle-button",
    onPointerDown: onClick,
    children: /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("div", {
      className: "tl-circle-button-icons-wrapper",
      children: /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(TablerIcon, {
        name: icon
      })
    })
  });
};

// src/components/inputs/ToggleInput.tsx
var import_jsx_runtime36 = require("react/jsx-runtime");
var LSUI2 = window.LSUI;
function ToggleInput(_a3) {
  var _b = _a3, {
    toggle = true,
    pressed,
    onPressedChange,
    className,
    tooltip
  } = _b, rest = __objRest(_b, [
    "toggle",
    "pressed",
    "onPressedChange",
    "className",
    "tooltip"
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(Tooltip, {
    content: tooltip,
    children: /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("div", {
      className: "inline-flex",
      children: /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(LSUI2.Toggle, __spreadProps(__spreadValues({}, rest), {
        "data-toggle": toggle,
        className: "tl-button" + (className ? " " + className : ""),
        pressed,
        onPressedChange
      }))
    })
  });
}

// src/lib/logseq-context.ts
var import_react12 = __toESM(require("react"));
var LogseqContext = import_react12.default.createContext({});

// src/components/KeyboardShortcut/KeyboardShortcut.tsx
var React35 = __toESM(require("react"));
var import_jsx_runtime37 = require("react/jsx-runtime");
var KeyboardShortcut = (_a3) => {
  var _b = _a3, {
    action: action2,
    shortcut,
    opts
  } = _b, props = __objRest(_b, [
    "action",
    "shortcut",
    "opts"
  ]);
  const { renderers } = React35.useContext(LogseqContext);
  const Shortcut = renderers == null ? void 0 : renderers.KeyboardShortcut;
  return /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("div", __spreadProps(__spreadValues({
    className: "tl-menu-right-slot"
  }, props), {
    children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(Shortcut, {
      action: action2,
      shortcut,
      opts
    })
  }));
};

// src/components/ZoomMenu/ZoomMenu.tsx
var import_jsx_runtime38 = require("react/jsx-runtime");
var LSUI3 = window.LSUI;
var ZoomMenu = observer(function ZoomMenu2() {
  const app = useApp();
  const preventEvent = (e) => {
    e.preventDefault();
  };
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(LSUI3.DropdownMenu, {
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(LSUI3.DropdownMenuTrigger, {
        className: "tl-button text-sm px-2 important",
        id: "tl-zoom",
        children: (app.viewport.camera.zoom * 100).toFixed(0) + "%"
      }),
      /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(LSUI3.DropdownMenuContent, {
        onCloseAutoFocus: (e) => e.preventDefault(),
        id: "zoomPopup",
        sideOffset: 12,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(LSUI3.DropdownMenuItem, {
            onSelect: preventEvent,
            onClick: app.api.zoomToFit,
            children: [
              "Zoom to drawing",
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(KeyboardShortcut, {
                action: "whiteboard/zoom-to-fit"
              })
            ]
          }),
          /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(LSUI3.DropdownMenuItem, {
            onSelect: preventEvent,
            onClick: app.api.zoomToSelection,
            disabled: app.selectedShapesArray.length === 0,
            children: [
              "Zoom to fit selection",
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(KeyboardShortcut, {
                action: "whiteboard/zoom-to-selection"
              })
            ]
          }),
          /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(LSUI3.DropdownMenuItem, {
            onSelect: preventEvent,
            onClick: app.api.zoomIn,
            children: [
              "Zoom in",
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(KeyboardShortcut, {
                action: "whiteboard/zoom-in"
              })
            ]
          }),
          /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(LSUI3.DropdownMenuItem, {
            onSelect: preventEvent,
            onClick: app.api.zoomOut,
            children: [
              "Zoom out",
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(KeyboardShortcut, {
                action: "whiteboard/zoom-out"
              })
            ]
          }),
          /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(LSUI3.DropdownMenuItem, {
            onSelect: preventEvent,
            onClick: app.api.resetZoom,
            children: [
              "Reset zoom",
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(KeyboardShortcut, {
                action: "whiteboard/reset-zoom"
              })
            ]
          })
        ]
      })
    ]
  });
});

// src/components/ActionBar/ActionBar.tsx
var import_jsx_runtime39 = require("react/jsx-runtime");
var LSUI4 = window.LSUI;
var ActionBar = observer(function ActionBar2() {
  const app = useApp();
  const {
    handlers: { t }
  } = React36.useContext(LogseqContext);
  const undo = React36.useCallback(() => {
    app.api.undo();
  }, [app]);
  const redo = React36.useCallback(() => {
    app.api.redo();
  }, [app]);
  const zoomIn = React36.useCallback(() => {
    app.api.zoomIn();
  }, [app]);
  const zoomOut = React36.useCallback(() => {
    app.api.zoomOut();
  }, [app]);
  const toggleGrid = React36.useCallback(() => {
    app.api.toggleGrid();
  }, [app]);
  const toggleSnapToGrid = React36.useCallback(() => {
    app.api.toggleSnapToGrid();
  }, [app]);
  const togglePenMode = React36.useCallback(() => {
    app.api.togglePenMode();
  }, [app]);
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", {
    className: "tl-action-bar",
    "data-html2canvas-ignore": "true",
    children: [
      !app.readOnly && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", {
        className: "tl-toolbar tl-history-bar mr-2 mb-2",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(Button, {
            tooltip: t("whiteboard/undo"),
            onClick: undo,
            children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(TablerIcon, {
              name: "arrow-back-up"
            })
          }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(Button, {
            tooltip: t("whiteboard/redo"),
            onClick: redo,
            children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(TablerIcon, {
              name: "arrow-forward-up"
            })
          })
        ]
      }),
      /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", {
        className: "tl-toolbar tl-zoom-bar mr-2 mb-2",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(Button, {
            tooltip: t("whiteboard/zoom-in"),
            onClick: zoomIn,
            id: "tl-zoom-in",
            children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(TablerIcon, {
              name: "plus"
            })
          }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(Button, {
            tooltip: t("whiteboard/zoom-out"),
            onClick: zoomOut,
            id: "tl-zoom-out",
            children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(TablerIcon, {
              name: "minus"
            })
          }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(LSUI4.Separator, {
            orientation: "vertical"
          }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(ZoomMenu, {})
        ]
      }),
      /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", {
        className: "tl-toolbar tl-grid-bar mr-2 mb-2",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(ToggleInput, {
            tooltip: t("whiteboard/toggle-grid"),
            className: "tl-button",
            pressed: app.settings.showGrid,
            id: "tl-show-grid",
            onPressedChange: toggleGrid,
            children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(TablerIcon, {
              name: "grid-dots"
            })
          }),
          !app.readOnly && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(ToggleInput, {
            tooltip: t("whiteboard/snap-to-grid"),
            className: "tl-button",
            pressed: app.settings.snapToGrid,
            id: "tl-snap-to-grid",
            onPressedChange: toggleSnapToGrid,
            children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(TablerIcon, {
              name: app.settings.snapToGrid ? "magnet" : "magnet-off"
            })
          })
        ]
      }),
      !app.readOnly && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", {
        className: "tl-toolbar tl-pen-mode-bar mb-2",
        children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(ToggleInput, {
          tooltip: t("whiteboard/toggle-pen-mode"),
          className: "tl-button",
          pressed: app.settings.penMode,
          id: "tl-toggle-pen-mode",
          onPressedChange: togglePenMode,
          children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(TablerIcon, {
            name: app.settings.penMode ? "pencil" : "pencil-off"
          })
        })
      })
    ]
  });
});

// src/components/Devtools/Devtools.tsx
var import_react16 = __toESM(require("react"));
var import_react_dom2 = __toESM(require("react-dom"));
var import_jsx_runtime40 = require("react/jsx-runtime");
var printPoint = (point) => {
  return `[${point.map((d2) => {
    var _a3;
    return (_a3 = d2 == null ? void 0 : d2.toFixed(2)) != null ? _a3 : "-";
  }).join(", ")}]`;
};
var DevTools = observer(() => {
  var _a3;
  const {
    viewport: {
      bounds,
      camera: { point, zoom }
    },
    inputs
  } = useRendererContext();
  const statusbarAnchorRef = import_react16.default.useRef();
  import_react16.default.useEffect(() => {
    const statusbarAnchor = document.getElementById("tl-statusbar-anchor");
    statusbarAnchorRef.current = statusbarAnchor;
  }, []);
  const rendererStatusText = [
    ["Z", (_a3 = zoom == null ? void 0 : zoom.toFixed(2)) != null ? _a3 : "null"],
    ["MP", printPoint(inputs.currentPoint)],
    ["MS", printPoint(inputs.currentScreenPoint)],
    ["VP", printPoint(point)],
    ["VBR", printPoint([bounds.maxX, bounds.maxY])]
  ].map((p2) => p2.join("")).join("|");
  const rendererStatus = statusbarAnchorRef.current ? import_react_dom2.default.createPortal(
    /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("div", {
      style: {
        flex: 1,
        display: "flex",
        alignItems: "center"
      },
      children: rendererStatusText
    }),
    statusbarAnchorRef.current
  ) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(import_jsx_runtime40.Fragment, {
    children: rendererStatus
  });
});

// src/components/PrimaryTools/PrimaryTools.tsx
var React42 = __toESM(require("react"));

// src/components/ToolButton/ToolButton.tsx
var import_jsx_runtime41 = require("react/jsx-runtime");
var ToolButton = observer(
  (_a3) => {
    var _b = _a3, { id: id3, icon, tooltip, tooltipSide = "left", handleClick } = _b, props = __objRest(_b, ["id", "icon", "tooltip", "tooltipSide", "handleClick"]);
    var _a4;
    const app = useApp();
    const Tool = (_a4 = [...app.Tools, TLSelectTool, TLMoveTool]) == null ? void 0 : _a4.find((T2) => T2.id === id3);
    const shortcut = Tool == null ? void 0 : Tool["shortcut"];
    const tooltipContent = shortcut && tooltip ? /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("div", {
      className: "flex",
      children: [
        tooltip,
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(KeyboardShortcut, {
          action: shortcut
        })
      ]
    }) : tooltip;
    return /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(Button, __spreadProps(__spreadValues({}, props), {
      tooltipSide,
      tooltip: tooltipContent,
      "data-tool": id3,
      "data-selected": id3 === app.selectedTool.id,
      onClick: handleClick,
      children: typeof icon === "string" ? /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(TablerIcon, {
        name: icon
      }) : icon
    }));
  }
);

// src/components/GeometryTools/GeometryTools.tsx
var import_react18 = __toESM(require("react"));
var import_jsx_runtime42 = require("react/jsx-runtime");
var LSUI5 = window.LSUI;
var GeometryTools = observer(function GeometryTools2(_a3) {
  var _b = _a3, {
    popoverSide = "left",
    setGeometry,
    activeGeometry,
    chevron = true
  } = _b, rest = __objRest(_b, [
    "popoverSide",
    "setGeometry",
    "activeGeometry",
    "chevron"
  ]);
  const {
    handlers: { t }
  } = import_react18.default.useContext(LogseqContext);
  const geometries = [
    {
      id: "box",
      icon: "square",
      tooltip: t("whiteboard/rectangle")
    },
    {
      id: "ellipse",
      icon: "circle",
      tooltip: t("whiteboard/circle")
    },
    {
      id: "polygon",
      icon: "triangle",
      tooltip: t("whiteboard/triangle")
    }
  ];
  const shapes2 = {
    id: "shapes",
    icon: "triangle-square-circle",
    tooltip: t("whiteboard/shape")
  };
  const activeTool = activeGeometry ? geometries.find((geo) => geo.id === activeGeometry) : shapes2;
  return /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)(LSUI5.Popover, {
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(LSUI5.PopoverTrigger, {
        asChild: true,
        children: /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("div", __spreadProps(__spreadValues({}, rest), {
          className: "tl-geometry-tools-pane-anchor",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(ToolButton, __spreadProps(__spreadValues({}, activeTool), {
              tooltipSide: popoverSide
            })),
            chevron && /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(TablerIcon, {
              "data-selected": activeGeometry,
              className: "tl-popover-indicator",
              name: "chevron-down-left"
            })
          ]
        }))
      }),
      /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(LSUI5.PopoverContent, {
        className: "p-0 w-auto",
        side: popoverSide,
        sideOffset: 15,
        collisionBoundary: document.querySelector(".logseq-tldraw"),
        children: /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("div", {
          className: `tl-toolbar tl-geometry-toolbar ${["left", "right"].includes(popoverSide) ? "flex-col" : "flex-row"}`,
          children: geometries.map((props) => /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(ToolButton, {
            id: props.id,
            icon: props.icon,
            handleClick: setGeometry,
            tooltipSide: popoverSide
          }, props.id))
        })
      })
    ]
  });
});

// src/components/PopoverButton/PopoverButton.tsx
var import_jsx_runtime43 = require("react/jsx-runtime");
var LSUI6 = window.LSUI;
function PopoverButton(_a3) {
  var _b = _a3, { side, align, alignOffset, label, children, border } = _b, rest = __objRest(_b, ["side", "align", "alignOffset", "label", "children", "border"]);
  return /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(LSUI6.Popover, {
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(LSUI6.PopoverTrigger, __spreadProps(__spreadValues({}, rest), {
        "data-border": border,
        className: "tl-button tl-popover-trigger-button",
        children: label
      })),
      /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(LSUI6.PopoverContent, {
        className: "w-auto p-1",
        align,
        alignOffset,
        side,
        sideOffset: 15,
        collisionBoundary: document.querySelector(".logseq-tldraw"),
        children: [
          children,
          /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(LSUI6.PopoverArrow, {
            className: "popper-arrow"
          })
        ]
      })
    ]
  });
}

// src/components/inputs/ColorInput.tsx
var import_react19 = __toESM(require("react"));
var import_jsx_runtime44 = require("react/jsx-runtime");
var LSUI7 = window.LSUI;
function ColorInput(_a3) {
  var _b = _a3, {
    color,
    opacity,
    popoverSide,
    setColor,
    setOpacity
  } = _b, rest = __objRest(_b, [
    "color",
    "opacity",
    "popoverSide",
    "setColor",
    "setOpacity"
  ]);
  const {
    handlers: { t }
  } = import_react19.default.useContext(LogseqContext);
  function renderColor(color2) {
    return color2 ? /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", {
      className: "tl-color-bg",
      style: { backgroundColor: color2 },
      children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", {
        className: `w-full h-full bg-${color2}-500`
      })
    }) : /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", {
      className: "tl-color-bg",
      children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(TablerIcon, {
        name: "color-swatch"
      })
    });
  }
  function isHexColor(color2) {
    return /^#(?:[0-9a-f]{3}){1,2}$/i.test(color2);
  }
  const handleChangeDebounced = import_react19.default.useMemo(() => {
    let latestValue = "";
    const handler = (e) => {
      setColor(latestValue);
    };
    return debounce(handler, 100, (e) => {
      latestValue = e.target.value;
    });
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(PopoverButton, __spreadProps(__spreadValues({}, rest), {
    border: true,
    side: popoverSide,
    label: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(Tooltip, {
      content: t("whiteboard/color"),
      side: popoverSide,
      sideOffset: 14,
      children: renderColor(color)
    }),
    children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", {
      className: "p-1",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", {
          className: "tl-color-palette",
          children: Object.values(Color).map((value) => /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("button", {
            className: `tl-color-drip m-1${value === color ? " active" : ""}`,
            onClick: () => setColor(value),
            children: renderColor(value)
          }, value))
        }),
        /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", {
          className: "flex items-center tl-custom-color",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", {
              className: `tl-color-drip m-1 mr-3 ${!isBuiltInColor(color) ? "active" : ""}`,
              children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", {
                className: "color-input-wrapper tl-color-bg",
                children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("input", __spreadValues({
                  className: "color-input cursor-pointer",
                  id: "tl-custom-color-input",
                  type: "color",
                  value: isHexColor(color) ? color : "#000000",
                  onChange: handleChangeDebounced,
                  style: { opacity: isBuiltInColor(color) ? 0 : 1 }
                }, rest))
              })
            }),
            /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("label", {
              htmlFor: "tl-custom-color-input",
              className: "text-xs cursor-pointer",
              children: t("whiteboard/select-custom-color")
            })
          ]
        }),
        setOpacity && /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", {
          className: "mx-1 my-2",
          children: /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(LSUI7.Slider, {
            defaultValue: [opacity != null ? opacity : 0],
            onValueCommit: (value) => setOpacity(value[0]),
            max: 1,
            step: 0.1,
            "aria-label": t("whiteboard/opacity"),
            className: "tl-slider-root",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(LSUI7.SliderTrack, {
                className: "tl-slider-track",
                children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(LSUI7.SliderRange, {
                  className: "tl-slider-range"
                })
              }),
              /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(LSUI7.SliderThumb, {
                className: "tl-slider-thumb"
              })
            ]
          })
        })
      ]
    })
  }));
}

// src/components/inputs/SelectInput.tsx
var React40 = __toESM(require("react"));

// ../../node_modules/lucide-react/dist/esm/createLucideIcon.js
var import_react20 = require("react");

// ../../node_modules/lucide-react/dist/esm/defaultAttributes.js
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

// ../../node_modules/lucide-react/dist/esm/createLucideIcon.js
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var createLucideIcon = (iconName, iconNode) => {
  const Component = (0, import_react20.forwardRef)(
    (_a3, ref) => {
      var _b = _a3, { color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, children } = _b, rest = __objRest(_b, ["color", "size", "strokeWidth", "absoluteStrokeWidth", "children"]);
      return (0, import_react20.createElement)(
        "svg",
        __spreadValues(__spreadProps(__spreadValues({
          ref
        }, defaultAttributes), {
          width: size,
          height: size,
          stroke: color,
          strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
          className: `lucide lucide-${toKebabCase(iconName)}`
        }), rest),
        [
          ...iconNode.map(([tag, attrs]) => (0, import_react20.createElement)(tag, attrs)),
          ...(Array.isArray(children) ? children : [children]) || []
        ]
      );
    }
  );
  Component.displayName = `${iconName}`;
  return Component;
};

// ../../node_modules/lucide-react/dist/esm/icons/chevron-down.js
var ChevronDown = createLucideIcon("ChevronDown", [
  ["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]
]);

// src/components/inputs/SelectInput.tsx
var import_jsx_runtime45 = require("react/jsx-runtime");
var LSUI8 = window.LSUI;
function SelectInput(_a3) {
  var _b = _a3, {
    options,
    tooltip,
    popoverSide,
    compact = false,
    value,
    onValueChange
  } = _b, rest = __objRest(_b, [
    "options",
    "tooltip",
    "popoverSide",
    "compact",
    "value",
    "onValueChange"
  ]);
  const [isOpen, setIsOpen] = React40.useState(false);
  return /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("div", __spreadProps(__spreadValues({}, rest), {
    children: /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(LSUI8.Select, {
      open: isOpen,
      onOpenChange: setIsOpen,
      value,
      onValueChange,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(Tooltip, {
          content: tooltip,
          side: popoverSide,
          children: /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(LSUI8.SelectTrigger, {
            className: `tl-select-trigger ${compact ? "compact" : ""}`,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(LSUI8.SelectValue, {}),
              !compact && /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(LSUI8.SelectIcon, {
                asChild: true,
                children: /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(ChevronDown, {
                  className: "h-4 w-4 opacity-50"
                })
              })
            ]
          })
        }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(LSUI8.SelectContent, {
          className: "min-w-min",
          side: popoverSide,
          position: "popper",
          sideOffset: 14,
          align: "center",
          onKeyDown: (e) => e.stopPropagation(),
          children: options.map((option) => {
            return /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(LSUI8.SelectItem, {
              value: option.value,
              children: option.label
            }, option.value);
          })
        })
      ]
    })
  }));
}

// src/components/inputs/ScaleInput.tsx
var import_react22 = __toESM(require("react"));
var import_jsx_runtime46 = require("react/jsx-runtime");
function ScaleInput(_a3) {
  var _b = _a3, { scaleLevel, compact, popoverSide } = _b, rest = __objRest(_b, ["scaleLevel", "compact", "popoverSide"]);
  const app = useApp();
  const {
    handlers: { t }
  } = import_react22.default.useContext(LogseqContext);
  const sizeOptions = [
    {
      label: compact ? "XS" : t("whiteboard/extra-small"),
      value: "xs"
    },
    {
      label: compact ? "SM" : t("whiteboard/small"),
      value: "sm"
    },
    {
      label: compact ? "MD" : t("whiteboard/medium"),
      value: "md"
    },
    {
      label: compact ? "LG" : t("whiteboard/large"),
      value: "lg"
    },
    {
      label: compact ? "XL" : t("whiteboard/extra-large"),
      value: "xl"
    },
    {
      label: compact ? "XXL" : t("whiteboard/huge"),
      value: "xxl"
    }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(SelectInput, {
    tooltip: t("whiteboard/scale-level"),
    options: sizeOptions,
    value: scaleLevel,
    popoverSide,
    compact,
    onValueChange: (v2) => {
      app.api.setScaleLevel(v2);
    }
  });
}

// src/components/PrimaryTools/PrimaryTools.tsx
var import_jsx_runtime47 = require("react/jsx-runtime");
var LSUI9 = window.LSUI;
var PrimaryTools = observer(function PrimaryTools2() {
  const app = useApp();
  const {
    handlers: { t }
  } = React42.useContext(LogseqContext);
  const handleSetColor = React42.useCallback((color) => {
    app.api.setColor(color);
  }, []);
  const handleToolClick = React42.useCallback((e) => {
    const tool = e.currentTarget.dataset.tool;
    if (tool)
      app.selectTool(tool);
  }, []);
  const [activeGeomId, setActiveGeomId] = React42.useState(
    () => {
      var _a3;
      return (_a3 = Object.values(Geometry).find((geo) => geo === app.selectedTool.id)) != null ? _a3 : Object.values(Geometry)[0];
    }
  );
  React42.useEffect(() => {
    setActiveGeomId((prevId) => {
      var _a3;
      return (_a3 = Object.values(Geometry).find((geo) => geo === app.selectedTool.id)) != null ? _a3 : prevId;
    });
  }, [app.selectedTool.id]);
  return /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", {
    className: "tl-primary-tools",
    "data-html2canvas-ignore": "true",
    children: /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", {
      className: "tl-toolbar tl-tools-floating-panel",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ToolButton, {
          handleClick: () => app.selectTool("select"),
          tooltip: t("whiteboard/select"),
          id: "select",
          icon: "select-cursor"
        }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ToolButton, {
          handleClick: () => app.selectTool("move"),
          tooltip: t("whiteboard/pan"),
          id: "move",
          icon: app.isIn("move.panning") ? "hand-grab" : "hand-stop"
        }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(LSUI9.Separator, {
          orientation: "horizontal"
        }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ToolButton, {
          handleClick: () => app.selectTool("logseq-portal"),
          tooltip: t("whiteboard/add-block-or-page"),
          id: "logseq-portal",
          icon: "circle-plus"
        }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ToolButton, {
          handleClick: () => app.selectTool("pencil"),
          tooltip: t("whiteboard/draw"),
          id: "pencil",
          icon: "ballpen"
        }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ToolButton, {
          handleClick: () => app.selectTool("highlighter"),
          tooltip: t("whiteboard/highlight"),
          id: "highlighter",
          icon: "highlight"
        }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ToolButton, {
          handleClick: () => app.selectTool("erase"),
          tooltip: t("whiteboard/eraser"),
          id: "erase",
          icon: "eraser"
        }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ToolButton, {
          handleClick: () => app.selectTool("line"),
          tooltip: t("whiteboard/connector"),
          id: "line",
          icon: "connector"
        }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ToolButton, {
          handleClick: () => app.selectTool("text"),
          tooltip: t("whiteboard/text"),
          id: "text",
          icon: "text"
        }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(GeometryTools, {
          activeGeometry: activeGeomId,
          setGeometry: handleToolClick
        }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(LSUI9.Separator, {
          orientation: "horizontal",
          style: { margin: "0 -4px" }
        }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ColorInput, {
          popoverSide: "left",
          color: app.settings.color,
          setColor: handleSetColor
        }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ScaleInput, {
          scaleLevel: app.settings.scaleLevel,
          popoverSide: "left",
          compact: true
        })
      ]
    })
  });
});

// src/components/StatusBar/StatusBar.tsx
var import_jsx_runtime48 = require("react/jsx-runtime");
var StatusBar = observer(function StatusBar2() {
  const app = useApp();
  return /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", {
    className: "tl-statusbar",
    "data-html2canvas-ignore": "true",
    children: [
      app.selectedTool.id,
      " | ",
      app.selectedTool.currentState.id,
      /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", {
        style: { flex: 1 }
      }),
      /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", {
        id: "tl-statusbar-anchor",
        className: "flex gap-1"
      })
    ]
  });
});

// src/components/AppUI.tsx
var import_jsx_runtime49 = require("react/jsx-runtime");
var AppUI = observer(function AppUI2() {
  const app = useApp();
  return /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(import_jsx_runtime49.Fragment, {
    children: [
      isDev() && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(StatusBar, {}),
      isDev() && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(DevTools, {}),
      !app.readOnly && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(PrimaryTools, {}),
      /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(ActionBar, {})
    ]
  });
});

// src/components/ContextBar/ContextBar.tsx
var React62 = __toESM(require("react"));

// src/components/ContextBar/contextBarActionFactory.tsx
var import_react52 = __toESM(require("react"));

// src/components/inputs/ShapeLinksInput.tsx
var import_react50 = __toESM(require("react"));

// src/components/BlockLink/BlockLink.tsx
var import_react26 = __toESM(require("react"));
var import_jsx_runtime50 = require("react/jsx-runtime");
var BlockLink = ({
  id: id3,
  showReferenceContent = false
}) => {
  var _a3;
  const {
    handlers: { isWhiteboardPage, redirectToPage, sidebarAddBlock, queryBlockByUUID },
    renderers: { Breadcrumb, PageName }
  } = import_react26.default.useContext(LogseqContext);
  let iconName = "";
  let linkType = validUUID(id3) ? "B" : "P";
  let blockContent = "";
  if (validUUID(id3)) {
    const block = queryBlockByUUID(id3);
    if (!block) {
      return /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("span", {
        className: "p-2",
        children: "Invalid reference. Did you remove it?"
      });
    }
    blockContent = block.title;
    if (((_a3 = block.properties) == null ? void 0 : _a3["ls-type"]) === "whiteboard-shape") {
      iconName = "link-to-whiteboard";
    } else {
      iconName = "link-to-block";
    }
  } else {
    if (isWhiteboardPage(id3)) {
      iconName = "link-to-whiteboard";
    } else {
      iconName = "link-to-page";
    }
  }
  const slicedContent = blockContent && blockContent.length > 23 ? blockContent.slice(0, 20) + "..." : blockContent;
  return /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("button", {
    className: "inline-flex gap-1 items-center w-full",
    onPointerDown: (e) => {
      e.stopPropagation();
      if (e.shiftKey) {
        sidebarAddBlock(id3, linkType === "B" ? "block" : "page");
      } else {
        redirectToPage(id3);
      }
    },
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(TablerIcon, {
        name: iconName
      }),
      /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("span", {
        className: "pointer-events-none block-link-reference-row",
        children: linkType === "P" ? /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(PageName, {
          pageName: id3
        }) : /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)(import_jsx_runtime50.Fragment, {
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(Breadcrumb, {
              levelLimit: 1,
              blockId: id3,
              endSeparator: showReferenceContent
            }),
            showReferenceContent && slicedContent
          ]
        })
      })
    ]
  });
};

// src/components/QuickSearch/QuickSearch.tsx
var import_react48 = __toESM(require("react"));

// ../../node_modules/@virtuoso.dev/react-urx/dist/react-urx.esm.js
var import_react27 = require("react");

// ../../node_modules/@virtuoso.dev/urx/dist/urx.esm.js
var PUBLISH = 0;
var SUBSCRIBE = 1;
var RESET = 2;
var VALUE = 4;
function compose(a3, b3) {
  return function(arg) {
    return a3(b3(arg));
  };
}
function thrush(arg, proc) {
  return proc(arg);
}
function curry2to1(proc, arg1) {
  return function(arg2) {
    return proc(arg1, arg2);
  };
}
function curry1to0(proc, arg) {
  return function() {
    return proc(arg);
  };
}
function tap(arg, proc) {
  proc(arg);
  return arg;
}
function tup() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  return args;
}
function call2(proc) {
  proc();
}
function always(value) {
  return function() {
    return value;
  };
}
function joinProc() {
  for (var _len2 = arguments.length, procs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    procs[_key2] = arguments[_key2];
  }
  return function() {
    procs.map(call2);
  };
}
function noop4() {
}
function subscribe(emitter, subscription) {
  return emitter(SUBSCRIBE, subscription);
}
function publish(publisher, value) {
  publisher(PUBLISH, value);
}
function reset(emitter) {
  emitter(RESET);
}
function getValue(depot) {
  return depot(VALUE);
}
function connect(emitter, publisher) {
  return subscribe(emitter, curry2to1(publisher, PUBLISH));
}
function handleNext(emitter, subscription) {
  var unsub = emitter(SUBSCRIBE, function(value) {
    unsub();
    subscription(value);
  });
  return unsub;
}
function stream() {
  var subscriptions = [];
  return function(action2, arg) {
    switch (action2) {
      case RESET:
        subscriptions.splice(0, subscriptions.length);
        return;
      case SUBSCRIBE:
        subscriptions.push(arg);
        return function() {
          var indexOf = subscriptions.indexOf(arg);
          if (indexOf > -1) {
            subscriptions.splice(indexOf, 1);
          }
        };
      case PUBLISH:
        subscriptions.slice().forEach(function(subscription) {
          subscription(arg);
        });
        return;
      default:
        throw new Error("unrecognized action " + action2);
    }
  };
}
function statefulStream(initial) {
  var value = initial;
  var innerSubject = stream();
  return function(action2, arg) {
    switch (action2) {
      case SUBSCRIBE:
        var subscription = arg;
        subscription(value);
        break;
      case PUBLISH:
        value = arg;
        break;
      case VALUE:
        return value;
    }
    return innerSubject(action2, arg);
  };
}
function eventHandler(emitter) {
  var unsub;
  var currentSubscription;
  var cleanup = function cleanup2() {
    return unsub && unsub();
  };
  return function(action2, subscription) {
    switch (action2) {
      case SUBSCRIBE:
        if (subscription) {
          if (currentSubscription === subscription) {
            return;
          }
          cleanup();
          currentSubscription = subscription;
          unsub = subscribe(emitter, subscription);
          return unsub;
        } else {
          cleanup();
          return noop4;
        }
      case RESET:
        cleanup();
        currentSubscription = null;
        return;
      default:
        throw new Error("unrecognized action " + action2);
    }
  };
}
function streamFromEmitter(emitter) {
  return tap(stream(), function(stream2) {
    return connect(emitter, stream2);
  });
}
function statefulStreamFromEmitter(emitter, initial) {
  return tap(statefulStream(initial), function(stream2) {
    return connect(emitter, stream2);
  });
}
function combineOperators() {
  for (var _len = arguments.length, operators = new Array(_len), _key = 0; _key < _len; _key++) {
    operators[_key] = arguments[_key];
  }
  return function(subscriber) {
    return operators.reduceRight(thrush, subscriber);
  };
}
function pipe(source) {
  for (var _len2 = arguments.length, operators = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    operators[_key2 - 1] = arguments[_key2];
  }
  var project = combineOperators.apply(void 0, operators);
  return function(action2, subscription) {
    switch (action2) {
      case SUBSCRIBE:
        return subscribe(source, project(subscription));
      case RESET:
        reset(source);
        return;
      default:
        throw new Error("unrecognized action " + action2);
    }
  };
}
function defaultComparator(previous, next) {
  return previous === next;
}
function distinctUntilChanged(comparator) {
  if (comparator === void 0) {
    comparator = defaultComparator;
  }
  var current;
  return function(done) {
    return function(next) {
      if (!comparator(current, next)) {
        current = next;
        done(next);
      }
    };
  };
}
function filter(predicate) {
  return function(done) {
    return function(value) {
      predicate(value) && done(value);
    };
  };
}
function map2(project) {
  return function(done) {
    return compose(done, project);
  };
}
function mapTo(value) {
  return function(done) {
    return function() {
      return done(value);
    };
  };
}
function scan(scanner, initial) {
  return function(done) {
    return function(value) {
      return done(initial = scanner(initial, value));
    };
  };
}
function skip(times) {
  return function(done) {
    return function(value) {
      times > 0 ? times-- : done(value);
    };
  };
}
function throttleTime(interval) {
  var currentValue;
  var timeout;
  return function(done) {
    return function(value) {
      currentValue = value;
      if (timeout) {
        return;
      }
      timeout = setTimeout(function() {
        timeout = void 0;
        done(currentValue);
      }, interval);
    };
  };
}
function debounceTime(interval) {
  var currentValue;
  var timeout;
  return function(done) {
    return function(value) {
      currentValue = value;
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(function() {
        done(currentValue);
      }, interval);
    };
  };
}
function withLatestFrom() {
  for (var _len3 = arguments.length, sources = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    sources[_key3] = arguments[_key3];
  }
  var values = new Array(sources.length);
  var called = 0;
  var pendingCall = null;
  var allCalled = Math.pow(2, sources.length) - 1;
  sources.forEach(function(source, index2) {
    var bit = Math.pow(2, index2);
    subscribe(source, function(value) {
      var prevCalled = called;
      called = called | bit;
      values[index2] = value;
      if (prevCalled !== allCalled && called === allCalled && pendingCall) {
        pendingCall();
        pendingCall = null;
      }
    });
  });
  return function(done) {
    return function(value) {
      var call3 = function call4() {
        return done([value].concat(values));
      };
      if (called === allCalled) {
        call3();
      } else {
        pendingCall = call3;
      }
    };
  };
}
function merge() {
  for (var _len = arguments.length, sources = new Array(_len), _key = 0; _key < _len; _key++) {
    sources[_key] = arguments[_key];
  }
  return function(action2, subscription) {
    switch (action2) {
      case SUBSCRIBE:
        return joinProc.apply(void 0, sources.map(function(source) {
          return subscribe(source, subscription);
        }));
      case RESET:
        return;
      default:
        throw new Error("unrecognized action " + action2);
    }
  };
}
function duc(source, comparator) {
  if (comparator === void 0) {
    comparator = defaultComparator;
  }
  return pipe(source, distinctUntilChanged(comparator));
}
function combineLatest() {
  var innerSubject = stream();
  for (var _len2 = arguments.length, emitters = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    emitters[_key2] = arguments[_key2];
  }
  var values = new Array(emitters.length);
  var called = 0;
  var allCalled = Math.pow(2, emitters.length) - 1;
  emitters.forEach(function(source, index2) {
    var bit = Math.pow(2, index2);
    subscribe(source, function(value) {
      values[index2] = value;
      called = called | bit;
      if (called === allCalled) {
        publish(innerSubject, values);
      }
    });
  });
  return function(action2, subscription) {
    switch (action2) {
      case SUBSCRIBE:
        if (called === allCalled) {
          subscription(values);
        }
        return subscribe(innerSubject, subscription);
      case RESET:
        return reset(innerSubject);
      default:
        throw new Error("unrecognized action " + action2);
    }
  };
}
function system(constructor, dependencies, _temp) {
  if (dependencies === void 0) {
    dependencies = [];
  }
  var _ref = _temp === void 0 ? {
    singleton: true
  } : _temp, singleton = _ref.singleton;
  return {
    id: id(),
    constructor,
    dependencies,
    singleton
  };
}
var id = function id2() {
  return Symbol();
};
function init(systemSpec) {
  var singletons = /* @__PURE__ */ new Map();
  var _init = function _init2(_ref2) {
    var id3 = _ref2.id, constructor = _ref2.constructor, dependencies = _ref2.dependencies, singleton = _ref2.singleton;
    if (singleton && singletons.has(id3)) {
      return singletons.get(id3);
    }
    var system2 = constructor(dependencies.map(function(e) {
      return _init2(e);
    }));
    if (singleton) {
      singletons.set(id3, system2);
    }
    return system2;
  };
  return _init(systemSpec);
}

// ../../node_modules/@virtuoso.dev/react-urx/dist/react-urx.esm.js
function _objectWithoutPropertiesLoose2(source, excluded) {
  if (source == null)
    return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i2;
  for (i2 = 0; i2 < sourceKeys.length; i2++) {
    key = sourceKeys[i2];
    if (excluded.indexOf(key) >= 0)
      continue;
    target[key] = source[key];
  }
  return target;
}
function _unsupportedIterableToArray2(o2, minLen) {
  if (!o2)
    return;
  if (typeof o2 === "string")
    return _arrayLikeToArray2(o2, minLen);
  var n2 = Object.prototype.toString.call(o2).slice(8, -1);
  if (n2 === "Object" && o2.constructor)
    n2 = o2.constructor.name;
  if (n2 === "Map" || n2 === "Set")
    return Array.from(o2);
  if (n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2))
    return _arrayLikeToArray2(o2, minLen);
}
function _arrayLikeToArray2(arr, len) {
  if (len == null || len > arr.length)
    len = arr.length;
  for (var i2 = 0, arr2 = new Array(len); i2 < len; i2++)
    arr2[i2] = arr[i2];
  return arr2;
}
function _createForOfIteratorHelperLoose2(o2, allowArrayLike) {
  var it2 = typeof Symbol !== "undefined" && o2[Symbol.iterator] || o2["@@iterator"];
  if (it2)
    return (it2 = it2.call(o2)).next.bind(it2);
  if (Array.isArray(o2) || (it2 = _unsupportedIterableToArray2(o2)) || allowArrayLike && o2 && typeof o2.length === "number") {
    if (it2)
      o2 = it2;
    var i2 = 0;
    return function() {
      if (i2 >= o2.length)
        return {
          done: true
        };
      return {
        done: false,
        value: o2[i2++]
      };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
var _excluded2 = ["children"];
function omit(keys, obj) {
  var result = {};
  var index2 = {};
  var idx = 0;
  var len = keys.length;
  while (idx < len) {
    index2[keys[idx]] = 1;
    idx += 1;
  }
  for (var prop in obj) {
    if (!index2.hasOwnProperty(prop)) {
      result[prop] = obj[prop];
    }
  }
  return result;
}
var useIsomorphicLayoutEffect = typeof document !== "undefined" ? import_react27.useLayoutEffect : import_react27.useEffect;
function systemToComponent(systemSpec, map3, Root) {
  var requiredPropNames = Object.keys(map3.required || {});
  var optionalPropNames = Object.keys(map3.optional || {});
  var methodNames = Object.keys(map3.methods || {});
  var eventNames = Object.keys(map3.events || {});
  var Context = (0, import_react27.createContext)({});
  function applyPropsToSystem(system2, props) {
    if (system2["propsReady"]) {
      publish(system2["propsReady"], false);
    }
    for (var _iterator = _createForOfIteratorHelperLoose2(requiredPropNames), _step; !(_step = _iterator()).done; ) {
      var requiredPropName = _step.value;
      var stream2 = system2[map3.required[requiredPropName]];
      publish(stream2, props[requiredPropName]);
    }
    for (var _iterator2 = _createForOfIteratorHelperLoose2(optionalPropNames), _step2; !(_step2 = _iterator2()).done; ) {
      var optionalPropName = _step2.value;
      if (optionalPropName in props) {
        var _stream = system2[map3.optional[optionalPropName]];
        publish(_stream, props[optionalPropName]);
      }
    }
    if (system2["propsReady"]) {
      publish(system2["propsReady"], true);
    }
  }
  function buildMethods(system2) {
    return methodNames.reduce(function(acc, methodName) {
      acc[methodName] = function(value) {
        var stream2 = system2[map3.methods[methodName]];
        publish(stream2, value);
      };
      return acc;
    }, {});
  }
  function buildEventHandlers(system2) {
    return eventNames.reduce(function(handlers, eventName) {
      handlers[eventName] = eventHandler(system2[map3.events[eventName]]);
      return handlers;
    }, {});
  }
  var Component = (0, import_react27.forwardRef)(function(propsWithChildren, ref) {
    var children = propsWithChildren.children, props = _objectWithoutPropertiesLoose2(propsWithChildren, _excluded2);
    var _useState = (0, import_react27.useState)(function() {
      return tap(init(systemSpec), function(system3) {
        return applyPropsToSystem(system3, props);
      });
    }), system2 = _useState[0];
    var _useState2 = (0, import_react27.useState)(curry1to0(buildEventHandlers, system2)), handlers = _useState2[0];
    useIsomorphicLayoutEffect(function() {
      for (var _iterator3 = _createForOfIteratorHelperLoose2(eventNames), _step3; !(_step3 = _iterator3()).done; ) {
        var eventName = _step3.value;
        if (eventName in props) {
          subscribe(handlers[eventName], props[eventName]);
        }
      }
      return function() {
        Object.values(handlers).map(reset);
      };
    }, [props, handlers, system2]);
    useIsomorphicLayoutEffect(function() {
      applyPropsToSystem(system2, props);
    });
    (0, import_react27.useImperativeHandle)(ref, always(buildMethods(system2)));
    return (0, import_react27.createElement)(Context.Provider, {
      value: system2
    }, Root ? (0, import_react27.createElement)(Root, omit([].concat(requiredPropNames, optionalPropNames, eventNames), props), children) : children);
  });
  var usePublisher = function usePublisher2(key) {
    return (0, import_react27.useCallback)(curry2to1(publish, (0, import_react27.useContext)(Context)[key]), [key]);
  };
  var useEmitterValue = function useEmitterValue2(key) {
    var context = (0, import_react27.useContext)(Context);
    var source = context[key];
    var _useState3 = (0, import_react27.useState)(curry1to0(getValue, source)), value = _useState3[0], setValue = _useState3[1];
    useIsomorphicLayoutEffect(function() {
      return subscribe(source, function(next) {
        if (next !== value) {
          setValue(always(next));
        }
      });
    }, [source, value]);
    return value;
  };
  var useEmitter = function useEmitter2(key, callback) {
    var context = (0, import_react27.useContext)(Context);
    var source = context[key];
    useIsomorphicLayoutEffect(function() {
      return subscribe(source, callback);
    }, [callback, source]);
  };
  return {
    Component,
    usePublisher,
    useEmitterValue,
    useEmitter
  };
}

// ../../node_modules/react-virtuoso/dist/index.m.js
var n = __toESM(require("react"));
var import_react28 = require("react");
var import_react_dom3 = require("react-dom");
function c() {
  return c = Object.assign || function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n2 = arguments[t];
      for (var o2 in n2)
        Object.prototype.hasOwnProperty.call(n2, o2) && (e[o2] = n2[o2]);
    }
    return e;
  }, c.apply(this, arguments);
}
function m(e, t) {
  if (null == e)
    return {};
  var n2, o2, r2 = {}, i2 = Object.keys(e);
  for (o2 = 0; o2 < i2.length; o2++)
    t.indexOf(n2 = i2[o2]) >= 0 || (r2[n2] = e[n2]);
  return r2;
}
function d(e, t) {
  (null == t || t > e.length) && (t = e.length);
  for (var n2 = 0, o2 = new Array(t); n2 < t; n2++)
    o2[n2] = e[n2];
  return o2;
}
function f(e, t) {
  var n2 = "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
  if (n2)
    return (n2 = n2.call(e)).next.bind(n2);
  if (Array.isArray(e) || (n2 = function(e2, t2) {
    if (e2) {
      if ("string" == typeof e2)
        return d(e2, t2);
      var n3 = Object.prototype.toString.call(e2).slice(8, -1);
      return "Object" === n3 && e2.constructor && (n3 = e2.constructor.name), "Map" === n3 || "Set" === n3 ? Array.from(e2) : "Arguments" === n3 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n3) ? d(e2, t2) : void 0;
    }
  }(e)) || t && e && "number" == typeof e.length) {
    n2 && (e = n2);
    var o2 = 0;
    return function() {
      return o2 >= e.length ? { done: true } : { done: false, value: e[o2++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
var p;
var h;
var g = "undefined" != typeof document ? import_react28.useLayoutEffect : import_react28.useEffect;
!function(e) {
  e[e.DEBUG = 0] = "DEBUG", e[e.INFO = 1] = "INFO", e[e.WARN = 2] = "WARN", e[e.ERROR = 3] = "ERROR";
}(h || (h = {}));
var v = ((p = {})[h.DEBUG] = "debug", p[h.INFO] = "log", p[h.WARN] = "warn", p[h.ERROR] = "error", p);
var S = system(function() {
  var e = statefulStream(h.ERROR);
  return { log: statefulStream(function(n2, o2, r2) {
    var i2;
    void 0 === r2 && (r2 = h.INFO), r2 >= (null != (i2 = ("undefined" == typeof globalThis ? window : globalThis).VIRTUOSO_LOG_LEVEL) ? i2 : getValue(e)) && console[v[r2]]("%creact-virtuoso: %c%s %o", "color: #0253b3; font-weight: bold", "color: initial", n2, o2);
  }), logLevel: e };
}, [], { singleton: true });
function C(e, t) {
  void 0 === t && (t = true);
  var n2 = (0, import_react28.useRef)(null), o2 = function(e2) {
  };
  if ("undefined" != typeof ResizeObserver) {
    var r2 = new ResizeObserver(function(t2) {
      var n3 = t2[0].target;
      null !== n3.offsetParent && e(n3);
    });
    o2 = function(e2) {
      e2 && t ? (r2.observe(e2), n2.current = e2) : (n2.current && r2.unobserve(n2.current), n2.current = null);
    };
  }
  return { ref: n2, callbackRef: o2 };
}
function I(e, t) {
  return void 0 === t && (t = true), C(e, t).callbackRef;
}
function T(e, t, n2, o2, r2, i2, a3) {
  return C(function(n3) {
    for (var l3 = function(e2, t2, n4, o3) {
      var r3 = e2.length;
      if (0 === r3)
        return null;
      for (var i3 = [], a4 = 0; a4 < r3; a4++) {
        var l4 = e2.item(a4);
        if (l4 && void 0 !== l4.dataset.index) {
          var s3 = parseInt(l4.dataset.index), u3 = parseFloat(l4.dataset.knownSize), c3 = t2(l4, "offsetHeight");
          if (0 === c3 && o3("Zero-sized element, this should not happen", { child: l4 }, h.ERROR), c3 !== u3) {
            var m3 = i3[i3.length - 1];
            0 === i3.length || m3.size !== c3 || m3.endIndex !== s3 - 1 ? i3.push({ startIndex: s3, endIndex: s3, size: c3 }) : i3[i3.length - 1].endIndex++;
          }
        }
      }
      return i3;
    }(n3.children, t, 0, r2), s2 = n3.parentElement; !s2.dataset.virtuosoScroller; )
      s2 = s2.parentElement;
    var u2 = "window" === s2.firstElementChild.dataset.viewportType, c2 = a3 ? a3.scrollTop : u2 ? window.pageYOffset || document.documentElement.scrollTop : s2.scrollTop, m2 = a3 ? a3.scrollHeight : u2 ? document.documentElement.scrollHeight : s2.scrollHeight, d2 = a3 ? a3.offsetHeight : u2 ? window.innerHeight : s2.offsetHeight;
    o2({ scrollTop: Math.max(c2, 0), scrollHeight: m2, viewportHeight: d2 }), null == i2 || i2(function(e2, t2, n4) {
      return "normal" === t2 || null != t2 && t2.endsWith("px") || n4("row-gap was not resolved to pixel value correctly", t2, h.WARN), "normal" === t2 ? 0 : parseInt(null != t2 ? t2 : "0", 10);
    }(0, getComputedStyle(n3).rowGap, r2)), null !== l3 && e(l3);
  }, n2);
}
function w(e, t) {
  return Math.round(e.getBoundingClientRect()[t]);
}
function x(e, t) {
  return Math.abs(e - t) < 1.01;
}
function b(e, n2, o2, l3, s2) {
  void 0 === l3 && (l3 = noop4);
  var c2 = (0, import_react28.useRef)(null), m2 = (0, import_react28.useRef)(null), d2 = (0, import_react28.useRef)(null), f2 = (0, import_react28.useRef)(false), p2 = (0, import_react28.useCallback)(function(t) {
    var o3 = t.target, r2 = o3 === window || o3 === document, i2 = r2 ? window.pageYOffset || document.documentElement.scrollTop : o3.scrollTop, a3 = r2 ? document.documentElement.scrollHeight : o3.scrollHeight, l4 = r2 ? window.innerHeight : o3.offsetHeight, s3 = function() {
      e({ scrollTop: Math.max(i2, 0), scrollHeight: a3, viewportHeight: l4 });
    };
    f2.current ? (0, import_react_dom3.flushSync)(s3) : s3(), f2.current = false, null !== m2.current && (i2 === m2.current || i2 <= 0 || i2 === a3 - l4) && (m2.current = null, n2(true), d2.current && (clearTimeout(d2.current), d2.current = null));
  }, [e, n2]);
  return (0, import_react28.useEffect)(function() {
    var e2 = s2 || c2.current;
    return l3(s2 || c2.current), p2({ target: e2 }), e2.addEventListener("scroll", p2, { passive: true }), function() {
      l3(null), e2.removeEventListener("scroll", p2);
    };
  }, [c2, p2, o2, l3, s2]), { scrollerRef: c2, scrollByCallback: function(e2) {
    f2.current = true, c2.current.scrollBy(e2);
  }, scrollToCallback: function(t) {
    var o3 = c2.current;
    if (o3 && (!("offsetHeight" in o3) || 0 !== o3.offsetHeight)) {
      var r2, i2, a3, l4 = "smooth" === t.behavior;
      if (o3 === window ? (i2 = Math.max(w(document.documentElement, "height"), document.documentElement.scrollHeight), r2 = window.innerHeight, a3 = document.documentElement.scrollTop) : (i2 = o3.scrollHeight, r2 = w(o3, "height"), a3 = o3.scrollTop), t.top = Math.ceil(Math.max(Math.min(i2 - r2, t.top), 0)), x(r2, i2) || t.top === a3)
        return e({ scrollTop: a3, scrollHeight: i2, viewportHeight: r2 }), void (l4 && n2(true));
      l4 ? (m2.current = t.top, d2.current && clearTimeout(d2.current), d2.current = setTimeout(function() {
        d2.current = null, m2.current = null, n2(true);
      }, 1e3)) : m2.current = null, o3.scrollTo(t);
    }
  } };
}
var y = system(function() {
  var e = stream(), n2 = stream(), o2 = statefulStream(0), r2 = stream(), i2 = statefulStream(0), a3 = stream(), l3 = stream(), s2 = statefulStream(0), u2 = statefulStream(0), c2 = statefulStream(0), m2 = statefulStream(0), d2 = stream(), f2 = stream(), p2 = statefulStream(false), h2 = statefulStream(false);
  return connect(pipe(e, map2(function(e2) {
    return e2.scrollTop;
  })), n2), connect(pipe(e, map2(function(e2) {
    return e2.scrollHeight;
  })), l3), connect(n2, i2), { scrollContainerState: e, scrollTop: n2, viewportHeight: a3, headerHeight: s2, fixedHeaderHeight: u2, fixedFooterHeight: c2, footerHeight: m2, scrollHeight: l3, smoothScrollTargetReached: r2, react18ConcurrentRendering: h2, scrollTo: d2, scrollBy: f2, statefulScrollTop: i2, deviation: o2, scrollingInProgress: p2 };
}, [], { singleton: true });
var H = { lvl: 0 };
function E(e, t, n2, o2, r2) {
  return void 0 === o2 && (o2 = H), void 0 === r2 && (r2 = H), { k: e, v: t, lvl: n2, l: o2, r: r2 };
}
function R(e) {
  return e === H;
}
function L() {
  return H;
}
function F(e, t) {
  if (R(e))
    return H;
  var n2 = e.k, o2 = e.l, r2 = e.r;
  if (t === n2) {
    if (R(o2))
      return r2;
    if (R(r2))
      return o2;
    var i2 = O(o2);
    return U(W(e, { k: i2[0], v: i2[1], l: M(o2) }));
  }
  return U(W(e, t < n2 ? { l: F(o2, t) } : { r: F(r2, t) }));
}
function k(e, t, n2) {
  if (void 0 === n2 && (n2 = "k"), R(e))
    return [-Infinity, void 0];
  if (e[n2] === t)
    return [e.k, e.v];
  if (e[n2] < t) {
    var o2 = k(e.r, t, n2);
    return -Infinity === o2[0] ? [e.k, e.v] : o2;
  }
  return k(e.l, t, n2);
}
function z(e, t, n2) {
  return R(e) ? E(t, n2, 1) : t === e.k ? W(e, { k: t, v: n2 }) : function(e2) {
    return D(G(e2));
  }(W(e, t < e.k ? { l: z(e.l, t, n2) } : { r: z(e.r, t, n2) }));
}
function B(e, t, n2) {
  if (R(e))
    return [];
  var o2 = e.k, r2 = e.v, i2 = e.r, a3 = [];
  return o2 > t && (a3 = a3.concat(B(e.l, t, n2))), o2 >= t && o2 <= n2 && a3.push({ k: o2, v: r2 }), o2 <= n2 && (a3 = a3.concat(B(i2, t, n2))), a3;
}
function P(e) {
  return R(e) ? [] : [].concat(P(e.l), [{ k: e.k, v: e.v }], P(e.r));
}
function O(e) {
  return R(e.r) ? [e.k, e.v] : O(e.r);
}
function M(e) {
  return R(e.r) ? e.l : U(W(e, { r: M(e.r) }));
}
function W(e, t) {
  return E(void 0 !== t.k ? t.k : e.k, void 0 !== t.v ? t.v : e.v, void 0 !== t.lvl ? t.lvl : e.lvl, void 0 !== t.l ? t.l : e.l, void 0 !== t.r ? t.r : e.r);
}
function V2(e) {
  return R(e) || e.lvl > e.r.lvl;
}
function U(e) {
  var t = e.l, n2 = e.r, o2 = e.lvl;
  if (n2.lvl >= o2 - 1 && t.lvl >= o2 - 1)
    return e;
  if (o2 > n2.lvl + 1) {
    if (V2(t))
      return G(W(e, { lvl: o2 - 1 }));
    if (R(t) || R(t.r))
      throw new Error("Unexpected empty nodes");
    return W(t.r, { l: W(t, { r: t.r.l }), r: W(e, { l: t.r.r, lvl: o2 - 1 }), lvl: o2 });
  }
  if (V2(e))
    return D(W(e, { lvl: o2 - 1 }));
  if (R(n2) || R(n2.l))
    throw new Error("Unexpected empty nodes");
  var r2 = n2.l, i2 = V2(r2) ? n2.lvl - 1 : n2.lvl;
  return W(r2, { l: W(e, { r: r2.l, lvl: o2 - 1 }), r: D(W(n2, { l: r2.r, lvl: i2 })), lvl: r2.lvl + 1 });
}
function A(e, t, n2) {
  return R(e) ? [] : N(B(e, k(e, t)[0], n2), function(e2) {
    return { index: e2.k, value: e2.v };
  });
}
function N(e, t) {
  var n2 = e.length;
  if (0 === n2)
    return [];
  for (var o2 = t(e[0]), r2 = o2.index, i2 = o2.value, a3 = [], l3 = 1; l3 < n2; l3++) {
    var s2 = t(e[l3]), u2 = s2.index, c2 = s2.value;
    a3.push({ start: r2, end: u2 - 1, value: i2 }), r2 = u2, i2 = c2;
  }
  return a3.push({ start: r2, end: Infinity, value: i2 }), a3;
}
function D(e) {
  var t = e.r, n2 = e.lvl;
  return R(t) || R(t.r) || t.lvl !== n2 || t.r.lvl !== n2 ? e : W(t, { l: W(e, { r: t.l }), lvl: n2 + 1 });
}
function G(e) {
  var t = e.l;
  return R(t) || t.lvl !== e.lvl ? e : W(t, { r: W(e, { l: t.r }) });
}
function _(e, t, n2, o2) {
  void 0 === o2 && (o2 = 0);
  for (var r2 = e.length - 1; o2 <= r2; ) {
    var i2 = Math.floor((o2 + r2) / 2), a3 = n2(e[i2], t);
    if (0 === a3)
      return i2;
    if (-1 === a3) {
      if (r2 - o2 < 2)
        return i2 - 1;
      r2 = i2 - 1;
    } else {
      if (r2 === o2)
        return i2;
      o2 = i2 + 1;
    }
  }
  throw new Error("Failed binary finding record in array - " + e.join(",") + ", searched for " + t);
}
function j(e, t, n2) {
  return e[_(e, t, n2)];
}
var K = system(function() {
  return { recalcInProgress: statefulStream(false) };
}, [], { singleton: true });
function Y(e) {
  var t = e.size, n2 = e.startIndex, o2 = e.endIndex;
  return function(e2) {
    return e2.start === n2 && (e2.end === o2 || Infinity === e2.end) && e2.value === t;
  };
}
function q(e, t) {
  var n2 = e.index;
  return t === n2 ? 0 : t < n2 ? -1 : 1;
}
function Z(e, t) {
  var n2 = e.offset;
  return t === n2 ? 0 : t < n2 ? -1 : 1;
}
function J(e) {
  return { index: e.index, value: e };
}
function $(e, t, n2, o2) {
  var r2 = e, i2 = 0, a3 = 0, l3 = 0, s2 = 0;
  if (0 !== t) {
    l3 = r2[s2 = _(r2, t - 1, q)].offset;
    var u2 = k(n2, t - 1);
    i2 = u2[0], a3 = u2[1], r2.length && r2[s2].size === k(n2, t)[1] && (s2 -= 1), r2 = r2.slice(0, s2 + 1);
  } else
    r2 = [];
  for (var c2, m2 = f(A(n2, t, Infinity)); !(c2 = m2()).done; ) {
    var d2 = c2.value, p2 = d2.start, h2 = d2.value, g2 = p2 - i2, v2 = g2 * a3 + l3 + g2 * o2;
    r2.push({ offset: v2, size: h2, index: p2 }), i2 = p2, l3 = v2, a3 = h2;
  }
  return { offsetTree: r2, lastIndex: i2, lastOffset: l3, lastSize: a3 };
}
function Q(e, t) {
  var n2 = t[0], o2 = t[1], r2 = t[3];
  n2.length > 0 && (0, t[2])("received item sizes", n2, h.DEBUG);
  var i2 = e.sizeTree, a3 = i2, l3 = 0;
  if (o2.length > 0 && R(i2) && 2 === n2.length) {
    var s2 = n2[0].size, u2 = n2[1].size;
    a3 = o2.reduce(function(e2, t2) {
      return z(z(e2, t2, s2), t2 + 1, u2);
    }, a3);
  } else {
    var c2 = function(e2, t2) {
      for (var n3, o3 = R(e2) ? 0 : Infinity, r3 = f(t2); !(n3 = r3()).done; ) {
        var i3 = n3.value, a4 = i3.size, l4 = i3.startIndex, s3 = i3.endIndex;
        if (o3 = Math.min(o3, l4), R(e2))
          e2 = z(e2, 0, a4);
        else {
          var u3 = A(e2, l4 - 1, s3 + 1);
          if (!u3.some(Y(i3))) {
            for (var c3, m3 = false, d3 = false, p2 = f(u3); !(c3 = p2()).done; ) {
              var h2 = c3.value, g2 = h2.start, v2 = h2.end, S2 = h2.value;
              m3 ? (s3 >= g2 || a4 === S2) && (e2 = F(e2, g2)) : (d3 = S2 !== a4, m3 = true), v2 > s3 && s3 >= g2 && S2 !== a4 && (e2 = z(e2, s3 + 1, S2));
            }
            d3 && (e2 = z(e2, l4, a4));
          }
        }
      }
      return [e2, o3];
    }(a3, n2);
    a3 = c2[0], l3 = c2[1];
  }
  if (a3 === i2)
    return e;
  var m2 = $(e.offsetTree, l3, a3, r2), d2 = m2.offsetTree;
  return { sizeTree: a3, offsetTree: d2, lastIndex: m2.lastIndex, lastOffset: m2.lastOffset, lastSize: m2.lastSize, groupOffsetTree: o2.reduce(function(e2, t2) {
    return z(e2, t2, X(t2, d2, r2));
  }, L()), groupIndices: o2 };
}
function X(e, t, n2) {
  if (0 === t.length)
    return 0;
  var o2 = j(t, e, q), r2 = e - o2.index, i2 = o2.size * r2 + (r2 - 1) * n2 + o2.offset;
  return i2 > 0 ? i2 + n2 : i2;
}
function ee(e, t, n2) {
  if (function(e2) {
    return void 0 !== e2.groupIndex;
  }(e))
    return t.groupIndices[e.groupIndex] + 1;
  var o2 = te("LAST" === e.index ? n2 : e.index, t);
  return Math.max(0, o2, Math.min(n2, o2));
}
function te(e, t) {
  if (!ne(t))
    return e;
  for (var n2 = 0; t.groupIndices[n2] <= e + n2; )
    n2++;
  return e + n2;
}
function ne(e) {
  return !R(e.groupOffsetTree);
}
var oe = { offsetHeight: "height", offsetWidth: "width" };
var re = system(function(e) {
  var n2 = e[0].log, o2 = e[1].recalcInProgress, r2 = stream(), i2 = stream(), a3 = statefulStreamFromEmitter(i2, 0), l3 = stream(), s2 = stream(), u2 = statefulStream(0), m2 = statefulStream([]), d2 = statefulStream(void 0), f2 = statefulStream(void 0), p2 = statefulStream(function(e2, t) {
    return w(e2, oe[t]);
  }), g2 = statefulStream(void 0), v2 = statefulStream(0), S2 = { offsetTree: [], sizeTree: L(), groupOffsetTree: L(), lastIndex: 0, lastOffset: 0, lastSize: 0, groupIndices: [] }, C3 = statefulStreamFromEmitter(pipe(r2, withLatestFrom(m2, n2, v2), scan(Q, S2), distinctUntilChanged()), S2);
  connect(pipe(m2, filter(function(e2) {
    return e2.length > 0;
  }), withLatestFrom(C3, v2), map2(function(e2) {
    var t = e2[0], n3 = e2[1], o3 = e2[2], r3 = t.reduce(function(e3, t2, r4) {
      return z(e3, t2, X(t2, n3.offsetTree, o3) || r4);
    }, L());
    return c({}, n3, { groupIndices: t, groupOffsetTree: r3 });
  })), C3), connect(pipe(i2, withLatestFrom(C3), filter(function(e2) {
    return e2[0] < e2[1].lastIndex;
  }), map2(function(e2) {
    var t = e2[1];
    return [{ startIndex: e2[0], endIndex: t.lastIndex, size: t.lastSize }];
  })), r2), connect(d2, f2);
  var I2 = statefulStreamFromEmitter(pipe(d2, map2(function(e2) {
    return void 0 === e2;
  })), true);
  connect(pipe(f2, filter(function(e2) {
    return void 0 !== e2 && R(getValue(C3).sizeTree);
  }), map2(function(e2) {
    return [{ startIndex: 0, endIndex: 0, size: e2 }];
  })), r2);
  var T2 = streamFromEmitter(pipe(r2, withLatestFrom(C3), scan(function(e2, t) {
    var n3 = t[1];
    return { changed: n3 !== e2.sizes, sizes: n3 };
  }, { changed: false, sizes: S2 }), map2(function(e2) {
    return e2.changed;
  })));
  subscribe(pipe(u2, scan(function(e2, t) {
    return { diff: e2.prev - t, prev: t };
  }, { diff: 0, prev: 0 }), map2(function(e2) {
    return e2.diff;
  })), function(e2) {
    e2 > 0 ? (publish(o2, true), publish(l3, e2)) : e2 < 0 && publish(s2, e2);
  }), subscribe(pipe(u2, withLatestFrom(n2)), function(e2) {
    e2[0] < 0 && (0, e2[1])("`firstItemIndex` prop should not be set to less than zero. If you don't know the total count, just use a very high value", { firstItemIndex: u2 }, h.ERROR);
  });
  var x2 = streamFromEmitter(l3);
  connect(pipe(l3, withLatestFrom(C3), map2(function(e2) {
    var t = e2[0], n3 = e2[1];
    if (n3.groupIndices.length > 0)
      throw new Error("Virtuoso: prepending items does not work with groups");
    return P(n3.sizeTree).reduce(function(e3, n4) {
      var o3 = n4.k, r3 = n4.v;
      return { ranges: [].concat(e3.ranges, [{ startIndex: e3.prevIndex, endIndex: o3 + t - 1, size: e3.prevSize }]), prevIndex: o3 + t, prevSize: r3 };
    }, { ranges: [], prevIndex: 0, prevSize: n3.lastSize }).ranges;
  })), r2);
  var b3 = streamFromEmitter(pipe(s2, withLatestFrom(C3, v2), map2(function(e2) {
    return X(-e2[0], e2[1].offsetTree, e2[2]);
  })));
  return connect(pipe(s2, withLatestFrom(C3, v2), map2(function(e2) {
    var t = e2[0], n3 = e2[1], o3 = e2[2];
    if (n3.groupIndices.length > 0)
      throw new Error("Virtuoso: shifting items does not work with groups");
    var r3 = P(n3.sizeTree).reduce(function(e3, n4) {
      var o4 = n4.v;
      return z(e3, Math.max(0, n4.k + t), o4);
    }, L());
    return c({}, n3, { sizeTree: r3 }, $(n3.offsetTree, 0, r3, o3));
  })), C3), { data: g2, totalCount: i2, sizeRanges: r2, groupIndices: m2, defaultItemSize: f2, fixedItemSize: d2, unshiftWith: l3, shiftWith: s2, shiftWithOffset: b3, beforeUnshiftWith: x2, firstItemIndex: u2, gap: v2, sizes: C3, listRefresh: T2, statefulTotalCount: a3, trackItemSizes: I2, itemSize: p2 };
}, tup(S, K), { singleton: true });
var ie = "undefined" != typeof document && "scrollBehavior" in document.documentElement.style;
function ae(e) {
  var t = "number" == typeof e ? { index: e } : e;
  return t.align || (t.align = "start"), t.behavior && ie || (t.behavior = "auto"), t.offset || (t.offset = 0), t;
}
var le = system(function(e) {
  var n2 = e[0], o2 = n2.sizes, r2 = n2.totalCount, i2 = n2.listRefresh, a3 = n2.gap, l3 = e[1], s2 = l3.scrollingInProgress, u2 = l3.viewportHeight, c2 = l3.scrollTo, m2 = l3.smoothScrollTargetReached, d2 = l3.headerHeight, f2 = l3.footerHeight, p2 = l3.fixedHeaderHeight, g2 = l3.fixedFooterHeight, v2 = e[2].log, S2 = stream(), C3 = statefulStream(0), I2 = null, T2 = null, w2 = null;
  function x2() {
    I2 && (I2(), I2 = null), w2 && (w2(), w2 = null), T2 && (clearTimeout(T2), T2 = null), publish(s2, false);
  }
  return connect(pipe(S2, withLatestFrom(o2, u2, r2, C3, d2, f2, v2), withLatestFrom(a3, p2, g2), map2(function(e2) {
    var n3 = e2[0], o3 = n3[0], r3 = n3[1], a4 = n3[2], l4 = n3[3], u3 = n3[4], c3 = n3[5], d3 = n3[6], f3 = n3[7], p3 = e2[1], g3 = e2[2], v3 = e2[3], C4 = ae(o3), b3 = C4.align, y2 = C4.behavior, H2 = C4.offset, E2 = l4 - 1, R3 = ee(C4, r3, E2), L3 = X(R3, r3.offsetTree, p3) + c3;
    "end" === b3 ? (L3 += g3 + k(r3.sizeTree, R3)[1] - a4 + v3, R3 === E2 && (L3 += d3)) : "center" === b3 ? L3 += (g3 + k(r3.sizeTree, R3)[1] - a4 + v3) / 2 : L3 -= u3, H2 && (L3 += H2);
    var F2 = function(e3) {
      x2(), e3 ? (f3("retrying to scroll to", { location: o3 }, h.DEBUG), publish(S2, o3)) : f3("list did not change, scroll successful", {}, h.DEBUG);
    };
    if (x2(), "smooth" === y2) {
      var z2 = false;
      w2 = subscribe(i2, function(e3) {
        z2 = z2 || e3;
      }), I2 = handleNext(m2, function() {
        F2(z2);
      });
    } else
      I2 = handleNext(pipe(i2, function(e3) {
        var t = setTimeout(function() {
          e3(false);
        }, 150);
        return function(n4) {
          n4 && (e3(true), clearTimeout(t));
        };
      }), F2);
    return T2 = setTimeout(function() {
      x2();
    }, 1200), publish(s2, true), f3("scrolling from index to", { index: R3, top: L3, behavior: y2 }, h.DEBUG), { top: L3, behavior: y2 };
  })), c2), { scrollToIndex: S2, topListHeight: C3 };
}, tup(re, y, S), { singleton: true });
var se = "up";
var ue = { atBottom: false, notAtBottomBecause: "NOT_SHOWING_LAST_ITEM", state: { offsetBottom: 0, scrollTop: 0, viewportHeight: 0, scrollHeight: 0 } };
var ce = system(function(e) {
  var n2 = e[0], o2 = n2.scrollContainerState, r2 = n2.scrollTop, i2 = n2.viewportHeight, a3 = n2.headerHeight, l3 = n2.footerHeight, s2 = n2.scrollBy, u2 = statefulStream(false), c2 = statefulStream(true), m2 = stream(), d2 = stream(), f2 = statefulStream(4), p2 = statefulStream(0), h2 = statefulStreamFromEmitter(pipe(merge(pipe(duc(r2), skip(1), mapTo(true)), pipe(duc(r2), skip(1), mapTo(false), debounceTime(100))), distinctUntilChanged()), false), g2 = statefulStreamFromEmitter(pipe(merge(pipe(s2, mapTo(true)), pipe(s2, mapTo(false), debounceTime(200))), distinctUntilChanged()), false);
  connect(pipe(combineLatest(duc(r2), duc(p2)), map2(function(e2) {
    return e2[0] <= e2[1];
  }), distinctUntilChanged()), c2), connect(pipe(c2, throttleTime(50)), d2);
  var v2 = streamFromEmitter(pipe(combineLatest(o2, duc(i2), duc(a3), duc(l3), duc(f2)), scan(function(e2, t) {
    var n3, o3, r3 = t[0], i3 = r3.scrollTop, a4 = r3.scrollHeight, l4 = t[1], s3 = { viewportHeight: l4, scrollTop: i3, scrollHeight: a4 };
    return i3 + l4 - a4 > -t[4] ? (i3 > e2.state.scrollTop ? (n3 = "SCROLLED_DOWN", o3 = e2.state.scrollTop - i3) : (n3 = "SIZE_DECREASED", o3 = e2.state.scrollTop - i3 || e2.scrollTopDelta), { atBottom: true, state: s3, atBottomBecause: n3, scrollTopDelta: o3 }) : { atBottom: false, notAtBottomBecause: s3.scrollHeight > e2.state.scrollHeight ? "SIZE_INCREASED" : l4 < e2.state.viewportHeight ? "VIEWPORT_HEIGHT_DECREASING" : i3 < e2.state.scrollTop ? "SCROLLING_UPWARDS" : "NOT_FULLY_SCROLLED_TO_LAST_ITEM_BOTTOM", state: s3 };
  }, ue), distinctUntilChanged(function(e2, t) {
    return e2 && e2.atBottom === t.atBottom;
  }))), S2 = statefulStreamFromEmitter(pipe(o2, scan(function(e2, t) {
    var n3 = t.scrollTop, o3 = t.scrollHeight, r3 = t.viewportHeight;
    return x(e2.scrollHeight, o3) ? { scrollTop: n3, scrollHeight: o3, jump: 0, changed: false } : e2.scrollTop !== n3 && o3 - (n3 + r3) < 1 ? { scrollHeight: o3, scrollTop: n3, jump: e2.scrollTop - n3, changed: true } : { scrollHeight: o3, scrollTop: n3, jump: 0, changed: true };
  }, { scrollHeight: 0, jump: 0, scrollTop: 0, changed: false }), filter(function(e2) {
    return e2.changed;
  }), map2(function(e2) {
    return e2.jump;
  })), 0);
  connect(pipe(v2, map2(function(e2) {
    return e2.atBottom;
  })), u2), connect(pipe(u2, throttleTime(50)), m2);
  var C3 = statefulStream("down");
  connect(pipe(o2, map2(function(e2) {
    return e2.scrollTop;
  }), distinctUntilChanged(), scan(function(e2, n3) {
    return getValue(g2) ? { direction: e2.direction, prevScrollTop: n3 } : { direction: n3 < e2.prevScrollTop ? se : "down", prevScrollTop: n3 };
  }, { direction: "down", prevScrollTop: 0 }), map2(function(e2) {
    return e2.direction;
  })), C3), connect(pipe(o2, throttleTime(50), mapTo("none")), C3);
  var I2 = statefulStream(0);
  return connect(pipe(h2, filter(function(e2) {
    return !e2;
  }), mapTo(0)), I2), connect(pipe(r2, throttleTime(100), withLatestFrom(h2), filter(function(e2) {
    return !!e2[1];
  }), scan(function(e2, t) {
    return [e2[1], t[0]];
  }, [0, 0]), map2(function(e2) {
    return e2[1] - e2[0];
  })), I2), { isScrolling: h2, isAtTop: c2, isAtBottom: u2, atBottomState: v2, atTopStateChange: d2, atBottomStateChange: m2, scrollDirection: C3, atBottomThreshold: f2, atTopThreshold: p2, scrollVelocity: I2, lastJumpDueToItemResize: S2 };
}, tup(y));
var me = system(function(e) {
  var n2 = e[0].log, o2 = statefulStream(false), r2 = streamFromEmitter(pipe(o2, filter(function(e2) {
    return e2;
  }), distinctUntilChanged()));
  return subscribe(o2, function(e2) {
    e2 && getValue(n2)("props updated", {}, h.DEBUG);
  }), { propsReady: o2, didMount: r2 };
}, tup(S), { singleton: true });
var de = system(function(e) {
  var n2 = e[0], o2 = n2.sizes, r2 = n2.listRefresh, i2 = n2.defaultItemSize, a3 = e[1].scrollTop, l3 = e[2].scrollToIndex, s2 = e[3].didMount, u2 = statefulStream(true), c2 = statefulStream(0);
  return connect(pipe(s2, withLatestFrom(c2), filter(function(e2) {
    return !!e2[1];
  }), mapTo(false)), u2), subscribe(pipe(combineLatest(r2, s2), withLatestFrom(u2, o2, i2), filter(function(e2) {
    var t = e2[1], n3 = e2[3];
    return e2[0][1] && (!R(e2[2].sizeTree) || void 0 !== n3) && !t;
  }), withLatestFrom(c2)), function(e2) {
    var n3 = e2[1];
    setTimeout(function() {
      handleNext(a3, function() {
        publish(u2, true);
      }), publish(l3, n3);
    });
  }), { scrolledToInitialItem: u2, initialTopMostItemIndex: c2 };
}, tup(re, y, le, me), { singleton: true });
function fe(e) {
  return !!e && ("smooth" === e ? "smooth" : "auto");
}
var pe = system(function(e) {
  var n2 = e[0], o2 = n2.totalCount, r2 = n2.listRefresh, i2 = e[1], a3 = i2.isAtBottom, l3 = i2.atBottomState, s2 = e[2].scrollToIndex, u2 = e[3].scrolledToInitialItem, c2 = e[4], m2 = c2.propsReady, d2 = c2.didMount, f2 = e[5].log, p2 = e[6].scrollingInProgress, g2 = statefulStream(false), v2 = stream(), S2 = null;
  function C3(e2) {
    publish(s2, { index: "LAST", align: "end", behavior: e2 });
  }
  function I2(e2) {
    var n3 = handleNext(l3, function(n4) {
      !e2 || n4.atBottom || "SIZE_INCREASED" !== n4.notAtBottomBecause || S2 || (getValue(f2)("scrolling to bottom due to increased size", {}, h.DEBUG), C3("auto"));
    });
    setTimeout(n3, 100);
  }
  return subscribe(pipe(combineLatest(pipe(duc(o2), skip(1)), d2), withLatestFrom(duc(g2), a3, u2, p2), map2(function(e2) {
    var t = e2[0], n3 = t[0], o3 = t[1] && e2[3], r3 = "auto";
    return o3 && (r3 = function(e3, t2) {
      return "function" == typeof e3 ? fe(e3(t2)) : t2 && fe(e3);
    }(e2[1], e2[2] || e2[4]), o3 = o3 && !!r3), { totalCount: n3, shouldFollow: o3, followOutputBehavior: r3 };
  }), filter(function(e2) {
    return e2.shouldFollow;
  })), function(e2) {
    var n3 = e2.totalCount, o3 = e2.followOutputBehavior;
    S2 && (S2(), S2 = null), S2 = handleNext(r2, function() {
      getValue(f2)("following output to ", { totalCount: n3 }, h.DEBUG), C3(o3), S2 = null;
    });
  }), subscribe(pipe(combineLatest(duc(g2), o2, m2), filter(function(e2) {
    return e2[0] && e2[2];
  }), scan(function(e2, t) {
    var n3 = t[1];
    return { refreshed: e2.value === n3, value: n3 };
  }, { refreshed: false, value: 0 }), filter(function(e2) {
    return e2.refreshed;
  }), withLatestFrom(g2, o2)), function(e2) {
    I2(false !== e2[1]);
  }), subscribe(v2, function() {
    I2(false !== getValue(g2));
  }), subscribe(combineLatest(duc(g2), l3), function(e2) {
    var t = e2[1];
    e2[0] && !t.atBottom && "VIEWPORT_HEIGHT_DECREASING" === t.notAtBottomBecause && C3("auto");
  }), { followOutput: g2, autoscrollToBottom: v2 };
}, tup(re, ce, le, de, me, S, y));
function he(e) {
  return e.reduce(function(e2, t) {
    return e2.groupIndices.push(e2.totalCount), e2.totalCount += t + 1, e2;
  }, { totalCount: 0, groupIndices: [] });
}
var ge = system(function(e) {
  var n2 = e[0], o2 = n2.totalCount, r2 = n2.groupIndices, i2 = n2.sizes, a3 = e[1], l3 = a3.scrollTop, s2 = a3.headerHeight, u2 = stream(), c2 = stream(), m2 = streamFromEmitter(pipe(u2, map2(he)));
  return connect(pipe(m2, map2(function(e2) {
    return e2.totalCount;
  })), o2), connect(pipe(m2, map2(function(e2) {
    return e2.groupIndices;
  })), r2), connect(pipe(combineLatest(l3, i2, s2), filter(function(e2) {
    return ne(e2[1]);
  }), map2(function(e2) {
    return k(e2[1].groupOffsetTree, Math.max(e2[0] - e2[2], 0), "v")[0];
  }), distinctUntilChanged(), map2(function(e2) {
    return [e2];
  })), c2), { groupCounts: u2, topItemsIndexes: c2 };
}, tup(re, y));
function ve(e, t) {
  return !(!e || e[0] !== t[0] || e[1] !== t[1]);
}
function Se(e, t) {
  return !(!e || e.startIndex !== t.startIndex || e.endIndex !== t.endIndex);
}
function Ce(e, t, n2) {
  return "number" == typeof e ? n2 === se && "top" === t || "down" === n2 && "bottom" === t ? e : 0 : n2 === se ? "top" === t ? e.main : e.reverse : "bottom" === t ? e.main : e.reverse;
}
function Ie(e, t) {
  return "number" == typeof e ? e : e[t] || 0;
}
var Te = system(function(e) {
  var n2 = e[0], o2 = n2.scrollTop, r2 = n2.viewportHeight, i2 = n2.deviation, a3 = n2.headerHeight, l3 = n2.fixedHeaderHeight, s2 = stream(), u2 = statefulStream(0), c2 = statefulStream(0), m2 = statefulStream(0), d2 = statefulStreamFromEmitter(pipe(combineLatest(duc(o2), duc(r2), duc(a3), duc(s2, ve), duc(m2), duc(u2), duc(l3), duc(i2), duc(c2)), map2(function(e2) {
    var t = e2[0], n3 = e2[1], o3 = e2[2], r3 = e2[3], i3 = r3[0], a4 = r3[1], l4 = e2[4], s3 = e2[6], u3 = e2[7], c3 = e2[8], m3 = t - u3, d3 = e2[5] + s3, f2 = Math.max(o3 - m3, 0), p2 = "none", h2 = Ie(c3, "top"), g2 = Ie(c3, "bottom");
    return i3 -= u3, a4 += o3 + s3, (i3 += o3 + s3) > t + d3 - h2 && (p2 = se), (a4 -= u3) < t - f2 + n3 + g2 && (p2 = "down"), "none" !== p2 ? [Math.max(m3 - o3 - Ce(l4, "top", p2) - h2, 0), m3 - f2 - s3 + n3 + Ce(l4, "bottom", p2) + g2] : null;
  }), filter(function(e2) {
    return null != e2;
  }), distinctUntilChanged(ve)), [0, 0]);
  return { listBoundary: s2, overscan: m2, topListHeight: u2, increaseViewportBy: c2, visibleRange: d2 };
}, tup(y), { singleton: true });
var we = { items: [], topItems: [], offsetTop: 0, offsetBottom: 0, top: 0, bottom: 0, topListHeight: 0, totalCount: 0, firstItemIndex: 0 };
function xe(e, t, n2) {
  if (0 === e.length)
    return [];
  if (!ne(t))
    return e.map(function(e2) {
      return c({}, e2, { index: e2.index + n2, originalIndex: e2.index });
    });
  for (var o2, r2 = [], i2 = A(t.groupOffsetTree, e[0].index, e[e.length - 1].index), a3 = void 0, l3 = 0, s2 = f(e); !(o2 = s2()).done; ) {
    var u2 = o2.value;
    (!a3 || a3.end < u2.index) && (a3 = i2.shift(), l3 = t.groupIndices.indexOf(a3.start)), r2.push(c({}, u2.index === a3.start ? { type: "group", index: l3 } : { index: u2.index - (l3 + 1) + n2, groupIndex: l3 }, { size: u2.size, offset: u2.offset, originalIndex: u2.index, data: u2.data }));
  }
  return r2;
}
function be(e, t, n2, o2, r2, i2) {
  var a3 = 0, l3 = 0;
  if (e.length > 0) {
    a3 = e[0].offset;
    var s2 = e[e.length - 1];
    l3 = s2.offset + s2.size;
  }
  var u2 = n2 - r2.lastIndex, c2 = a3, m2 = r2.lastOffset + u2 * r2.lastSize + (u2 - 1) * o2 - l3;
  return { items: xe(e, r2, i2), topItems: xe(t, r2, i2), topListHeight: t.reduce(function(e2, t2) {
    return t2.size + e2;
  }, 0), offsetTop: a3, offsetBottom: m2, top: c2, bottom: l3, totalCount: n2, firstItemIndex: i2 };
}
var ye = system(function(e) {
  var n2 = e[0], o2 = n2.sizes, r2 = n2.totalCount, i2 = n2.data, a3 = n2.firstItemIndex, l3 = n2.gap, s2 = e[1], u2 = e[2], m2 = u2.visibleRange, d2 = u2.listBoundary, p2 = u2.topListHeight, h2 = e[3], g2 = h2.scrolledToInitialItem, v2 = h2.initialTopMostItemIndex, S2 = e[4].topListHeight, C3 = e[5], I2 = e[6].didMount, T2 = e[7].recalcInProgress, w2 = statefulStream([]), x2 = stream();
  connect(s2.topItemsIndexes, w2);
  var b3 = statefulStreamFromEmitter(pipe(combineLatest(I2, T2, duc(m2, ve), duc(r2), duc(o2), duc(v2), g2, duc(w2), duc(a3), duc(l3), i2), filter(function(e2) {
    return e2[0] && !e2[1];
  }), map2(function(e2) {
    var n3 = e2[2], o3 = n3[0], r3 = n3[1], i3 = e2[3], a4 = e2[5], l4 = e2[6], s3 = e2[7], u3 = e2[8], m3 = e2[9], d3 = e2[10], p3 = e2[4], h3 = p3.sizeTree, g3 = p3.offsetTree;
    if (0 === i3 || 0 === o3 && 0 === r3)
      return c({}, we, { totalCount: i3 });
    if (R(h3))
      return be(function(e3, t, n4) {
        if (ne(t)) {
          var o4 = te(e3, t);
          return [{ index: k(t.groupOffsetTree, o4)[0], size: 0, offset: 0 }, { index: o4, size: 0, offset: 0, data: n4 && n4[0] }];
        }
        return [{ index: e3, size: 0, offset: 0, data: n4 && n4[0] }];
      }(function(e3, t) {
        return "number" == typeof e3 ? e3 : "LAST" === e3.index ? t - 1 : e3.index;
      }(a4, i3), p3, d3), [], i3, m3, p3, u3);
    var v3 = [];
    if (s3.length > 0)
      for (var S3, C4 = s3[0], I3 = s3[s3.length - 1], T3 = 0, w3 = f(A(h3, C4, I3)); !(S3 = w3()).done; )
        for (var x3 = S3.value, b4 = x3.value, y2 = Math.max(x3.start, C4), H2 = Math.min(x3.end, I3), E2 = y2; E2 <= H2; E2++)
          v3.push({ index: E2, size: b4, offset: T3, data: d3 && d3[E2] }), T3 += b4;
    if (!l4)
      return be([], v3, i3, m3, p3, u3);
    var L3 = s3.length > 0 ? s3[s3.length - 1] + 1 : 0, F2 = function(e3, t, n4, o4) {
      return void 0 === o4 && (o4 = 0), o4 > 0 && (t = Math.max(t, j(e3, o4, q).offset)), N((i4 = n4, l5 = _(r4 = e3, t, a5 = Z), s4 = _(r4, i4, a5, l5), r4.slice(l5, s4 + 1)), J);
      var r4, i4, a5, l5, s4;
    }(g3, o3, r3, L3);
    if (0 === F2.length)
      return null;
    var z2 = i3 - 1;
    return be(tap([], function(e3) {
      for (var t, n4 = f(F2); !(t = n4()).done; ) {
        var i4 = t.value, a5 = i4.value, l5 = a5.offset, s4 = i4.start, u4 = a5.size;
        if (a5.offset < o3) {
          var c2 = (s4 += Math.floor((o3 - a5.offset + m3) / (u4 + m3))) - i4.start;
          l5 += c2 * u4 + c2 * m3;
        }
        s4 < L3 && (l5 += (L3 - s4) * u4, s4 = L3);
        for (var p4 = Math.min(i4.end, z2), h4 = s4; h4 <= p4 && !(l5 >= r3); h4++)
          e3.push({ index: h4, size: u4, offset: l5, data: d3 && d3[h4] }), l5 += u4 + m3;
      }
    }), v3, i3, m3, p3, u3);
  }), filter(function(e2) {
    return null !== e2;
  }), distinctUntilChanged()), we);
  return connect(pipe(i2, filter(function(e2) {
    return void 0 !== e2;
  }), map2(function(e2) {
    return e2.length;
  })), r2), connect(pipe(b3, map2(function(e2) {
    return e2.topListHeight;
  })), S2), connect(S2, p2), connect(pipe(b3, map2(function(e2) {
    return [e2.top, e2.bottom];
  })), d2), connect(pipe(b3, map2(function(e2) {
    return e2.items;
  })), x2), c({ listState: b3, topItemsIndexes: w2, endReached: streamFromEmitter(pipe(b3, filter(function(e2) {
    return e2.items.length > 0;
  }), withLatestFrom(r2, i2), filter(function(e2) {
    var t = e2[0].items;
    return t[t.length - 1].originalIndex === e2[1] - 1;
  }), map2(function(e2) {
    return [e2[1] - 1, e2[2]];
  }), distinctUntilChanged(ve), map2(function(e2) {
    return e2[0];
  }))), startReached: streamFromEmitter(pipe(b3, throttleTime(200), filter(function(e2) {
    var t = e2.items;
    return t.length > 0 && t[0].originalIndex === e2.topItems.length;
  }), map2(function(e2) {
    return e2.items[0].index;
  }), distinctUntilChanged())), rangeChanged: streamFromEmitter(pipe(b3, filter(function(e2) {
    return e2.items.length > 0;
  }), map2(function(e2) {
    for (var t = e2.items, n3 = 0, o3 = t.length - 1; "group" === t[n3].type && n3 < o3; )
      n3++;
    for (; "group" === t[o3].type && o3 > n3; )
      o3--;
    return { startIndex: t[n3].index, endIndex: t[o3].index };
  }), distinctUntilChanged(Se))), itemsRendered: x2 }, C3);
}, tup(re, ge, Te, de, le, ce, me, K), { singleton: true });
var He = system(function(e) {
  var n2 = e[0], o2 = n2.sizes, r2 = n2.firstItemIndex, i2 = n2.data, a3 = n2.gap, l3 = e[1].listState, s2 = e[2].didMount, u2 = statefulStream(0);
  return connect(pipe(s2, withLatestFrom(u2), filter(function(e2) {
    return 0 !== e2[1];
  }), withLatestFrom(o2, r2, a3, i2), map2(function(e2) {
    var t = e2[0][1], n3 = e2[1], o3 = e2[2], r3 = e2[3], i3 = e2[4], a4 = void 0 === i3 ? [] : i3, l4 = 0;
    if (n3.groupIndices.length > 0)
      for (var s3, u3 = f(n3.groupIndices); !((s3 = u3()).done || s3.value - l4 >= t); )
        l4++;
    var c2 = t + l4;
    return be(Array.from({ length: c2 }).map(function(e3, t2) {
      return { index: t2, size: 0, offset: 0, data: a4[t2] };
    }), [], c2, r3, n3, o3);
  })), l3), { initialItemCount: u2 };
}, tup(re, ye, me), { singleton: true });
var Ee = system(function(e) {
  var n2 = e[0].scrollVelocity, o2 = statefulStream(false), r2 = stream(), i2 = statefulStream(false);
  return connect(pipe(n2, withLatestFrom(i2, o2, r2), filter(function(e2) {
    return !!e2[1];
  }), map2(function(e2) {
    var t = e2[0], n3 = e2[1], o3 = e2[2], r3 = e2[3], i3 = n3.enter;
    if (o3) {
      if ((0, n3.exit)(t, r3))
        return false;
    } else if (i3(t, r3))
      return true;
    return o3;
  }), distinctUntilChanged()), o2), subscribe(pipe(combineLatest(o2, n2, r2), withLatestFrom(i2)), function(e2) {
    var t = e2[0], n3 = e2[1];
    return t[0] && n3 && n3.change && n3.change(t[1], t[2]);
  }), { isSeeking: o2, scrollSeekConfiguration: i2, scrollVelocity: n2, scrollSeekRangeChanged: r2 };
}, tup(ce), { singleton: true });
var Re = system(function(e) {
  var n2 = e[0].topItemsIndexes, o2 = statefulStream(0);
  return connect(pipe(o2, filter(function(e2) {
    return e2 > 0;
  }), map2(function(e2) {
    return Array.from({ length: e2 }).map(function(e3, t) {
      return t;
    });
  })), n2), { topItemCount: o2 };
}, tup(ye));
var Le = system(function(e) {
  var n2 = e[0], o2 = n2.footerHeight, r2 = n2.headerHeight, i2 = n2.fixedHeaderHeight, a3 = n2.fixedFooterHeight, l3 = e[1].listState, s2 = stream(), u2 = statefulStreamFromEmitter(pipe(combineLatest(o2, a3, r2, i2, l3), map2(function(e2) {
    var t = e2[4];
    return e2[0] + e2[1] + e2[2] + e2[3] + t.offsetBottom + t.bottom;
  })), 0);
  return connect(duc(u2), s2), { totalListHeight: u2, totalListHeightChanged: s2 };
}, tup(y, ye), { singleton: true });
function Fe(e) {
  var t, n2 = false;
  return function() {
    return n2 || (n2 = true, t = e()), t;
  };
}
var ke = Fe(function() {
  return /iP(ad|hone|od).+Version\/[\d.]+.*Safari/i.test(navigator.userAgent);
});
var ze = system(function(e) {
  var n2 = e[0], o2 = n2.scrollBy, r2 = n2.scrollTop, i2 = n2.deviation, a3 = n2.scrollingInProgress, l3 = e[1], s2 = l3.isScrolling, u2 = l3.isAtBottom, c2 = l3.scrollDirection, m2 = e[3], d2 = m2.beforeUnshiftWith, f2 = m2.shiftWithOffset, p2 = m2.sizes, g2 = m2.gap, v2 = e[4].log, S2 = e[5].recalcInProgress, C3 = streamFromEmitter(pipe(e[2].listState, withLatestFrom(l3.lastJumpDueToItemResize), scan(function(e2, t) {
    var n3 = e2[1], o3 = t[0], r3 = o3.items, i3 = o3.totalCount, a4 = o3.bottom + o3.offsetBottom, l4 = 0;
    return e2[2] === i3 && n3.length > 0 && r3.length > 0 && (0 === r3[0].originalIndex && 0 === n3[0].originalIndex || 0 != (l4 = a4 - e2[3]) && (l4 += t[1])), [l4, r3, i3, a4];
  }, [0, [], 0, 0]), filter(function(e2) {
    return 0 !== e2[0];
  }), withLatestFrom(r2, c2, a3, u2, v2), filter(function(e2) {
    return !e2[3] && 0 !== e2[1] && e2[2] === se;
  }), map2(function(e2) {
    var t = e2[0][0];
    return (0, e2[5])("Upward scrolling compensation", { amount: t }, h.DEBUG), t;
  })));
  function I2(e2) {
    e2 > 0 ? (publish(o2, { top: -e2, behavior: "auto" }), publish(i2, 0)) : (publish(i2, 0), publish(o2, { top: -e2, behavior: "auto" }));
  }
  return subscribe(pipe(C3, withLatestFrom(i2, s2)), function(e2) {
    var n3 = e2[0], o3 = e2[1];
    e2[2] && ke() ? publish(i2, o3 - n3) : I2(-n3);
  }), subscribe(pipe(combineLatest(statefulStreamFromEmitter(s2, false), i2, S2), filter(function(e2) {
    return !e2[0] && !e2[2] && 0 !== e2[1];
  }), map2(function(e2) {
    return e2[1];
  }), throttleTime(1)), I2), connect(pipe(f2, map2(function(e2) {
    return { top: -e2 };
  })), o2), subscribe(pipe(d2, withLatestFrom(p2, g2), map2(function(e2) {
    var t = e2[0];
    return t * e2[1].lastSize + t * e2[2];
  })), function(e2) {
    publish(i2, e2), requestAnimationFrame(function() {
      publish(o2, { top: e2 }), requestAnimationFrame(function() {
        publish(i2, 0), publish(S2, false);
      });
    });
  }), { deviation: i2 };
}, tup(y, ce, ye, re, S, K));
var Be = system(function(e) {
  var n2 = e[0].totalListHeight, o2 = e[1].didMount, r2 = e[2].scrollTo, i2 = statefulStream(0);
  return subscribe(pipe(o2, withLatestFrom(i2), filter(function(e2) {
    return 0 !== e2[1];
  }), map2(function(e2) {
    return { top: e2[1] };
  })), function(e2) {
    handleNext(pipe(n2, filter(function(e3) {
      return 0 !== e3;
    })), function() {
      setTimeout(function() {
        publish(r2, e2);
      });
    });
  }), { initialScrollTop: i2 };
}, tup(Le, me, y), { singleton: true });
var Pe = system(function(e) {
  var n2 = e[0].viewportHeight, o2 = e[1].totalListHeight, r2 = statefulStream(false);
  return { alignToBottom: r2, paddingTopAddition: statefulStreamFromEmitter(pipe(combineLatest(r2, n2, o2), filter(function(e2) {
    return e2[0];
  }), map2(function(e2) {
    return Math.max(0, e2[1] - e2[2]);
  }), distinctUntilChanged()), 0) };
}, tup(y, Le), { singleton: true });
var Oe = system(function(e) {
  var n2 = e[0], o2 = n2.scrollTo, r2 = n2.scrollContainerState, i2 = stream(), a3 = stream(), l3 = stream(), s2 = statefulStream(false), u2 = statefulStream(void 0);
  return connect(pipe(combineLatest(i2, a3), map2(function(e2) {
    var t = e2[0], n3 = t.viewportHeight, o3 = t.scrollHeight;
    return { scrollTop: Math.max(0, t.scrollTop - e2[1].offsetTop), scrollHeight: o3, viewportHeight: n3 };
  })), r2), connect(pipe(o2, withLatestFrom(a3), map2(function(e2) {
    var t = e2[0];
    return c({}, t, { top: t.top + e2[1].offsetTop });
  })), l3), { useWindowScroll: s2, customScrollParent: u2, windowScrollContainerState: i2, windowViewportRect: a3, windowScrollTo: l3 };
}, tup(y));
var Me = ["done", "behavior", "align"];
var We = system(function(e) {
  var n2 = e[0], o2 = n2.sizes, r2 = n2.totalCount, i2 = n2.gap, a3 = e[1], l3 = a3.scrollTop, s2 = a3.viewportHeight, u2 = a3.headerHeight, d2 = a3.fixedHeaderHeight, f2 = a3.fixedFooterHeight, p2 = a3.scrollingInProgress, h2 = e[2].scrollToIndex, g2 = stream();
  return connect(pipe(g2, withLatestFrom(o2, s2, r2, u2, d2, f2, l3), withLatestFrom(i2), map2(function(e2) {
    var n3 = e2[0], o3 = n3[0], r3 = n3[1], i3 = n3[2], a4 = n3[3], l4 = n3[4], s3 = n3[5], u3 = n3[6], d3 = n3[7], f3 = e2[1], h3 = o3.done, g3 = o3.behavior, v2 = o3.align, S2 = m(o3, Me), C3 = null, I2 = ee(o3, r3, a4 - 1), T2 = X(I2, r3.offsetTree, f3) + l4 + s3;
    return T2 < d3 + s3 ? C3 = c({}, S2, { behavior: g3, align: null != v2 ? v2 : "start" }) : T2 + k(r3.sizeTree, I2)[1] > d3 + i3 - u3 && (C3 = c({}, S2, { behavior: g3, align: null != v2 ? v2 : "end" })), C3 ? h3 && handleNext(pipe(p2, skip(1), filter(function(e3) {
      return false === e3;
    })), h3) : h3 && h3(), C3;
  }), filter(function(e2) {
    return null !== e2;
  })), h2), { scrollIntoView: g2 };
}, tup(re, y, le, ye, S), { singleton: true });
var Ve = ["listState", "topItemsIndexes"];
var Ue = system(function(e) {
  return c({}, e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]);
}, tup(Te, He, me, Ee, Le, Be, Pe, Oe, We));
var Ae = system(function(e) {
  var n2 = e[0], o2 = n2.totalCount, r2 = n2.sizeRanges, i2 = n2.fixedItemSize, a3 = n2.defaultItemSize, l3 = n2.trackItemSizes, s2 = n2.itemSize, u2 = n2.data, d2 = n2.firstItemIndex, f2 = n2.groupIndices, p2 = n2.statefulTotalCount, h2 = n2.gap, g2 = e[1], v2 = g2.initialTopMostItemIndex, S2 = g2.scrolledToInitialItem, C3 = e[2], I2 = e[3], T2 = e[4], w2 = T2.listState, x2 = T2.topItemsIndexes, b3 = m(T2, Ve), y2 = e[5].scrollToIndex, H2 = e[7].topItemCount, E2 = e[8].groupCounts, R3 = e[9], L3 = e[10];
  return connect(b3.rangeChanged, R3.scrollSeekRangeChanged), connect(pipe(R3.windowViewportRect, map2(function(e2) {
    return e2.visibleHeight;
  })), C3.viewportHeight), c({ totalCount: o2, data: u2, firstItemIndex: d2, sizeRanges: r2, initialTopMostItemIndex: v2, scrolledToInitialItem: S2, topItemsIndexes: x2, topItemCount: H2, groupCounts: E2, fixedItemHeight: i2, defaultItemHeight: a3, gap: h2 }, I2, { statefulTotalCount: p2, listState: w2, scrollToIndex: y2, trackItemSizes: l3, itemSize: s2, groupIndices: f2 }, b3, R3, C3, L3);
}, tup(re, de, y, pe, ye, le, ze, Re, ge, Ue, S));
var Ne = Fe(function() {
  if ("undefined" == typeof document)
    return "sticky";
  var e = document.createElement("div");
  return e.style.position = "-webkit-sticky", "-webkit-sticky" === e.style.position ? "-webkit-sticky" : "sticky";
});
function De(e, t) {
  var n2 = (0, import_react28.useRef)(null), o2 = (0, import_react28.useCallback)(function(o3) {
    if (null !== o3 && o3.offsetParent) {
      var r2, i2, a3 = o3.getBoundingClientRect(), l4 = a3.width;
      if (t) {
        var s3 = t.getBoundingClientRect(), u3 = a3.top - s3.top;
        r2 = s3.height - Math.max(0, u3), i2 = u3 + t.scrollTop;
      } else
        r2 = window.innerHeight - Math.max(0, a3.top), i2 = a3.top + window.pageYOffset;
      n2.current = { offsetTop: i2, visibleHeight: r2, visibleWidth: l4 }, e(n2.current);
    }
  }, [e, t]), l3 = C(o2), s2 = l3.callbackRef, u2 = l3.ref, c2 = (0, import_react28.useCallback)(function() {
    o2(u2.current);
  }, [o2, u2]);
  return (0, import_react28.useEffect)(function() {
    if (t) {
      t.addEventListener("scroll", c2);
      var e2 = new ResizeObserver(c2);
      return e2.observe(t), function() {
        t.removeEventListener("scroll", c2), e2.unobserve(t);
      };
    }
    return window.addEventListener("scroll", c2), window.addEventListener("resize", c2), function() {
      window.removeEventListener("scroll", c2), window.removeEventListener("resize", c2);
    };
  }, [c2, t]), s2;
}
var Ge = n.createContext(void 0);
var _e = n.createContext(void 0);
var je = ["placeholder"];
var Ke = ["style", "children"];
var Ye = ["style", "children"];
function qe(e) {
  return e;
}
var Ze = system(function() {
  var e = statefulStream(function(e2) {
    return "Item " + e2;
  }), n2 = statefulStream(null), o2 = statefulStream(function(e2) {
    return "Group " + e2;
  }), r2 = statefulStream({}), i2 = statefulStream(qe), a3 = statefulStream("div"), l3 = statefulStream(noop4), s2 = function(e2, n3) {
    return void 0 === n3 && (n3 = null), statefulStreamFromEmitter(pipe(r2, map2(function(t) {
      return t[e2];
    }), distinctUntilChanged()), n3);
  };
  return { context: n2, itemContent: e, groupContent: o2, components: r2, computeItemKey: i2, headerFooterTag: a3, scrollerRef: l3, FooterComponent: s2("Footer"), HeaderComponent: s2("Header"), TopItemListComponent: s2("TopItemList"), ListComponent: s2("List", "div"), ItemComponent: s2("Item", "div"), GroupComponent: s2("Group", "div"), ScrollerComponent: s2("Scroller", "div"), EmptyPlaceholder: s2("EmptyPlaceholder"), ScrollSeekPlaceholder: s2("ScrollSeekPlaceholder") };
});
function Je(e, n2) {
  var o2 = stream();
  return subscribe(o2, function() {
    return console.warn("react-virtuoso: You are using a deprecated property. " + n2, "color: red;", "color: inherit;", "color: blue;");
  }), connect(o2, e), o2;
}
var $e = system(function(e) {
  var n2 = e[0], o2 = e[1], r2 = { item: Je(o2.itemContent, "Rename the %citem%c prop to %citemContent."), group: Je(o2.groupContent, "Rename the %cgroup%c prop to %cgroupContent."), topItems: Je(n2.topItemCount, "Rename the %ctopItems%c prop to %ctopItemCount."), itemHeight: Je(n2.fixedItemHeight, "Rename the %citemHeight%c prop to %cfixedItemHeight."), scrollingStateChange: Je(n2.isScrolling, "Rename the %cscrollingStateChange%c prop to %cisScrolling."), adjustForPrependedItems: stream(), maxHeightCacheSize: stream(), footer: stream(), header: stream(), HeaderContainer: stream(), FooterContainer: stream(), ItemContainer: stream(), ScrollContainer: stream(), GroupContainer: stream(), ListContainer: stream(), emptyComponent: stream(), scrollSeek: stream() };
  function i2(e2, n3, r3) {
    connect(pipe(e2, withLatestFrom(o2.components), map2(function(e3) {
      var t, o3 = e3[0], i3 = e3[1];
      return console.warn("react-virtuoso: " + r3 + " property is deprecated. Pass components." + n3 + " instead."), c({}, i3, ((t = {})[n3] = o3, t));
    })), o2.components);
  }
  return subscribe(r2.adjustForPrependedItems, function() {
    console.warn("react-virtuoso: adjustForPrependedItems is no longer supported. Use the firstItemIndex property instead - https://virtuoso.dev/prepend-items.", "color: red;", "color: inherit;", "color: blue;");
  }), subscribe(r2.maxHeightCacheSize, function() {
    console.warn("react-virtuoso: maxHeightCacheSize is no longer necessary. Setting it has no effect - remove it from your code.");
  }), subscribe(r2.HeaderContainer, function() {
    console.warn("react-virtuoso: HeaderContainer is deprecated. Use headerFooterTag if you want to change the wrapper of the header component and pass components.Header to change its contents.");
  }), subscribe(r2.FooterContainer, function() {
    console.warn("react-virtuoso: FooterContainer is deprecated. Use headerFooterTag if you want to change the wrapper of the footer component and pass components.Footer to change its contents.");
  }), subscribe(r2.scrollSeek, function(e2) {
    var r3 = e2.placeholder, i3 = m(e2, je);
    console.warn("react-virtuoso: scrollSeek property is deprecated. Pass scrollSeekConfiguration and specify the placeholder in components.ScrollSeekPlaceholder instead."), publish(o2.components, c({}, getValue(o2.components), { ScrollSeekPlaceholder: r3 })), publish(n2.scrollSeekConfiguration, i3);
  }), i2(r2.footer, "Footer", "footer"), i2(r2.header, "Header", "header"), i2(r2.ItemContainer, "Item", "ItemContainer"), i2(r2.ListContainer, "List", "ListContainer"), i2(r2.ScrollContainer, "Scroller", "ScrollContainer"), i2(r2.emptyComponent, "EmptyPlaceholder", "emptyComponent"), i2(r2.GroupContainer, "Group", "GroupContainer"), c({}, n2, o2, r2);
}, tup(Ae, Ze));
var Qe = function(e) {
  return n.createElement("div", { style: { height: e.height } });
};
var Xe = { position: Ne(), zIndex: 1, overflowAnchor: "none" };
var et = { overflowAnchor: "none" };
var tt = n.memo(function(e) {
  var o2 = e.showTopList, r2 = void 0 !== o2 && o2, i2 = gt("listState"), a3 = ht("sizeRanges"), s2 = gt("useWindowScroll"), u2 = gt("customScrollParent"), m2 = ht("windowScrollContainerState"), d2 = ht("scrollContainerState"), f2 = u2 || s2 ? m2 : d2, p2 = gt("itemContent"), h2 = gt("context"), g2 = gt("groupContent"), v2 = gt("trackItemSizes"), S2 = gt("itemSize"), C3 = gt("log"), I2 = ht("gap"), w2 = T(a3, S2, v2, r2 ? noop4 : f2, C3, I2, u2).callbackRef, x2 = n.useState(0), b3 = x2[0], y2 = x2[1];
  vt("deviation", function(e2) {
    b3 !== e2 && y2(e2);
  });
  var H2 = gt("EmptyPlaceholder"), E2 = gt("ScrollSeekPlaceholder") || Qe, R3 = gt("ListComponent"), L3 = gt("ItemComponent"), F2 = gt("GroupComponent"), k2 = gt("computeItemKey"), z2 = gt("isSeeking"), B3 = gt("groupIndices").length > 0, P2 = gt("paddingTopAddition"), O2 = r2 ? {} : { boxSizing: "border-box", paddingTop: i2.offsetTop + P2, paddingBottom: i2.offsetBottom, marginTop: b3 };
  return !r2 && 0 === i2.totalCount && H2 ? (0, import_react28.createElement)(H2, it(H2, h2)) : (0, import_react28.createElement)(R3, c({}, it(R3, h2), { ref: w2, style: O2, "data-test-id": r2 ? "virtuoso-top-item-list" : "virtuoso-item-list" }), (r2 ? i2.topItems : i2.items).map(function(e2) {
    var t = e2.originalIndex, n2 = k2(t + i2.firstItemIndex, e2.data, h2);
    return z2 ? (0, import_react28.createElement)(E2, c({}, it(E2, h2), { key: n2, index: e2.index, height: e2.size, type: e2.type || "item" }, "group" === e2.type ? {} : { groupIndex: e2.groupIndex })) : "group" === e2.type ? (0, import_react28.createElement)(F2, c({}, it(F2, h2), { key: n2, "data-index": t, "data-known-size": e2.size, "data-item-index": e2.index, style: Xe }), g2(e2.index)) : (0, import_react28.createElement)(L3, c({}, it(L3, h2), { key: n2, "data-index": t, "data-known-size": e2.size, "data-item-index": e2.index, "data-item-group-index": e2.groupIndex, style: et }), B3 ? p2(e2.index, e2.groupIndex, e2.data, h2) : p2(e2.index, e2.data, h2));
  }));
});
var nt = { height: "100%", outline: "none", overflowY: "auto", position: "relative", WebkitOverflowScrolling: "touch" };
var ot = { width: "100%", height: "100%", position: "absolute", top: 0 };
var rt = { width: "100%", position: Ne(), top: 0 };
function it(e, t) {
  if ("string" != typeof e)
    return { context: t };
}
var at = n.memo(function() {
  var e = gt("HeaderComponent"), t = ht("headerHeight"), n2 = gt("headerFooterTag"), o2 = I(function(e2) {
    return t(w(e2, "height"));
  }), r2 = gt("context");
  return e ? (0, import_react28.createElement)(n2, { ref: o2 }, (0, import_react28.createElement)(e, it(e, r2))) : null;
});
var lt = n.memo(function() {
  var e = gt("FooterComponent"), t = ht("footerHeight"), n2 = gt("headerFooterTag"), o2 = I(function(e2) {
    return t(w(e2, "height"));
  }), r2 = gt("context");
  return e ? (0, import_react28.createElement)(n2, { ref: o2 }, (0, import_react28.createElement)(e, it(e, r2))) : null;
});
function st(e) {
  var t = e.usePublisher, o2 = e.useEmitter, r2 = e.useEmitterValue;
  return n.memo(function(e2) {
    var n2 = e2.style, i2 = e2.children, a3 = m(e2, Ke), s2 = t("scrollContainerState"), u2 = r2("ScrollerComponent"), d2 = t("smoothScrollTargetReached"), f2 = r2("scrollerRef"), p2 = r2("context"), h2 = b(s2, d2, u2, f2), g2 = h2.scrollerRef, v2 = h2.scrollByCallback;
    return o2("scrollTo", h2.scrollToCallback), o2("scrollBy", v2), (0, import_react28.createElement)(u2, c({ ref: g2, style: c({}, nt, n2), "data-test-id": "virtuoso-scroller", "data-virtuoso-scroller": true, tabIndex: 0 }, a3, it(u2, p2)), i2);
  });
}
function ut(e) {
  var o2 = e.usePublisher, r2 = e.useEmitter, i2 = e.useEmitterValue;
  return n.memo(function(e2) {
    var n2 = e2.style, a3 = e2.children, s2 = m(e2, Ye), u2 = o2("windowScrollContainerState"), d2 = i2("ScrollerComponent"), f2 = o2("smoothScrollTargetReached"), p2 = i2("totalListHeight"), h2 = i2("deviation"), v2 = i2("customScrollParent"), S2 = i2("context"), C3 = b(u2, f2, d2, noop4, v2), I2 = C3.scrollerRef, T2 = C3.scrollByCallback, w2 = C3.scrollToCallback;
    return g(function() {
      return I2.current = v2 || window, function() {
        I2.current = null;
      };
    }, [I2, v2]), r2("windowScrollTo", w2), r2("scrollBy", T2), (0, import_react28.createElement)(d2, c({ style: c({ position: "relative" }, n2, 0 !== p2 ? { height: p2 + h2 } : {}), "data-virtuoso-scroller": true }, s2, it(d2, S2)), a3);
  });
}
var ct = function(e) {
  var o2 = e.children, r2 = (0, import_react28.useContext)(Ge), i2 = ht("viewportHeight"), a3 = ht("fixedItemHeight"), l3 = I(compose(i2, function(e2) {
    return w(e2, "height");
  }));
  return n.useEffect(function() {
    r2 && (i2(r2.viewportHeight), a3(r2.itemHeight));
  }, [r2, i2, a3]), n.createElement("div", { style: ot, ref: l3, "data-viewport-type": "element" }, o2);
};
var mt = function(e) {
  var t = e.children, o2 = (0, import_react28.useContext)(Ge), r2 = ht("windowViewportRect"), i2 = ht("fixedItemHeight"), a3 = gt("customScrollParent"), l3 = De(r2, a3);
  return n.useEffect(function() {
    o2 && (i2(o2.itemHeight), r2({ offsetTop: 0, visibleHeight: o2.viewportHeight, visibleWidth: 100 }));
  }, [o2, r2, i2]), n.createElement("div", { ref: l3, style: ot, "data-viewport-type": "window" }, t);
};
var dt = function(e) {
  var t = e.children, n2 = gt("TopItemListComponent"), o2 = gt("headerHeight"), r2 = c({}, rt, { marginTop: o2 + "px" }), i2 = gt("context");
  return (0, import_react28.createElement)(n2 || "div", { style: r2, context: i2 }, t);
};
var ft = systemToComponent($e, { required: {}, optional: { context: "context", followOutput: "followOutput", firstItemIndex: "firstItemIndex", itemContent: "itemContent", groupContent: "groupContent", overscan: "overscan", increaseViewportBy: "increaseViewportBy", totalCount: "totalCount", topItemCount: "topItemCount", initialTopMostItemIndex: "initialTopMostItemIndex", components: "components", groupCounts: "groupCounts", atBottomThreshold: "atBottomThreshold", atTopThreshold: "atTopThreshold", computeItemKey: "computeItemKey", defaultItemHeight: "defaultItemHeight", fixedItemHeight: "fixedItemHeight", itemSize: "itemSize", scrollSeekConfiguration: "scrollSeekConfiguration", headerFooterTag: "headerFooterTag", data: "data", initialItemCount: "initialItemCount", initialScrollTop: "initialScrollTop", alignToBottom: "alignToBottom", useWindowScroll: "useWindowScroll", customScrollParent: "customScrollParent", scrollerRef: "scrollerRef", logLevel: "logLevel", react18ConcurrentRendering: "react18ConcurrentRendering", item: "item", group: "group", topItems: "topItems", itemHeight: "itemHeight", scrollingStateChange: "scrollingStateChange", maxHeightCacheSize: "maxHeightCacheSize", footer: "footer", header: "header", ItemContainer: "ItemContainer", ScrollContainer: "ScrollContainer", ListContainer: "ListContainer", GroupContainer: "GroupContainer", emptyComponent: "emptyComponent", HeaderContainer: "HeaderContainer", FooterContainer: "FooterContainer", scrollSeek: "scrollSeek" }, methods: { scrollToIndex: "scrollToIndex", scrollIntoView: "scrollIntoView", scrollTo: "scrollTo", scrollBy: "scrollBy", adjustForPrependedItems: "adjustForPrependedItems", autoscrollToBottom: "autoscrollToBottom" }, events: { isScrolling: "isScrolling", endReached: "endReached", startReached: "startReached", rangeChanged: "rangeChanged", atBottomStateChange: "atBottomStateChange", atTopStateChange: "atTopStateChange", totalListHeightChanged: "totalListHeightChanged", itemsRendered: "itemsRendered", groupIndices: "groupIndices" } }, n.memo(function(e) {
  var t = gt("useWindowScroll"), o2 = gt("topItemsIndexes").length > 0, r2 = gt("customScrollParent"), i2 = r2 || t ? mt : ct;
  return n.createElement(r2 || t ? Ct : St, c({}, e), n.createElement(i2, null, n.createElement(at, null), n.createElement(tt, null), n.createElement(lt, null)), o2 && n.createElement(dt, null, n.createElement(tt, { showTopList: true })));
}));
var pt = ft.Component;
var ht = ft.usePublisher;
var gt = ft.useEmitterValue;
var vt = ft.useEmitter;
var St = st({ usePublisher: ht, useEmitterValue: gt, useEmitter: vt });
var Ct = ut({ usePublisher: ht, useEmitterValue: gt, useEmitter: vt });
var It = { items: [], offsetBottom: 0, offsetTop: 0, top: 0, bottom: 0, itemHeight: 0, itemWidth: 0 };
var Tt = { items: [{ index: 0 }], offsetBottom: 0, offsetTop: 0, top: 0, bottom: 0, itemHeight: 0, itemWidth: 0 };
var wt = Math.round;
var xt = Math.ceil;
var bt = Math.floor;
var yt = Math.min;
var Ht = Math.max;
function Et(e, t, n2) {
  return Array.from({ length: t - e + 1 }).map(function(t2, o2) {
    return { index: o2 + e, data: null == n2 ? void 0 : n2[o2 + e] };
  });
}
function Rt(e, t) {
  return e && e.column === t.column && e.row === t.row;
}
var Lt = system(function(e) {
  var n2 = e[0], o2 = n2.overscan, r2 = n2.visibleRange, i2 = n2.listBoundary, a3 = e[1], l3 = a3.scrollTop, s2 = a3.viewportHeight, u2 = a3.scrollBy, m2 = a3.scrollTo, d2 = a3.smoothScrollTargetReached, f2 = a3.scrollContainerState, p2 = a3.footerHeight, h2 = a3.headerHeight, g2 = e[2], v2 = e[3], S2 = e[4], C3 = S2.propsReady, I2 = S2.didMount, T2 = e[5], w2 = T2.windowViewportRect, x2 = T2.windowScrollTo, b3 = T2.useWindowScroll, y2 = T2.customScrollParent, H2 = T2.windowScrollContainerState, E2 = e[6], R3 = statefulStream(0), L3 = statefulStream(0), F2 = statefulStream(It), k2 = statefulStream({ height: 0, width: 0 }), z2 = statefulStream({ height: 0, width: 0 }), B3 = stream(), P2 = stream(), O2 = statefulStream(0), M2 = statefulStream(void 0), W2 = statefulStream({ row: 0, column: 0 });
  connect(pipe(combineLatest(I2, L3, M2), filter(function(e2) {
    return 0 !== e2[1];
  }), map2(function(e2) {
    return { items: Et(0, e2[1] - 1, e2[2]), top: 0, bottom: 0, offsetBottom: 0, offsetTop: 0, itemHeight: 0, itemWidth: 0 };
  })), F2), connect(pipe(combineLatest(duc(R3), r2, duc(W2, Rt), duc(z2, function(e2, t) {
    return e2 && e2.width === t.width && e2.height === t.height;
  }), M2), withLatestFrom(k2), map2(function(e2) {
    var t = e2[0], n3 = t[0], o3 = t[1], r3 = o3[0], i3 = o3[1], a4 = t[2], l4 = t[3], s3 = t[4], u3 = e2[1], m3 = a4.row, d3 = a4.column, f3 = l4.height, p3 = l4.width, h3 = u3.width;
    if (0 === n3 || 0 === h3)
      return It;
    if (0 === p3)
      return function(e3) {
        return c({}, Tt, { items: e3 });
      }(Et(0, 0, s3));
    var g3 = zt(h3, p3, d3), v3 = g3 * bt((r3 + m3) / (f3 + m3)), S3 = g3 * xt((i3 + m3) / (f3 + m3)) - 1;
    S3 = yt(n3 - 1, Ht(S3, g3 - 1));
    var C4 = Et(v3 = yt(S3, Ht(0, v3)), S3, s3), I3 = Ft(u3, a4, l4, C4), T3 = I3.top, w3 = I3.bottom, x3 = xt(n3 / g3);
    return { items: C4, offsetTop: T3, offsetBottom: x3 * f3 + (x3 - 1) * m3 - w3, top: T3, bottom: w3, itemHeight: f3, itemWidth: p3 };
  })), F2), connect(pipe(M2, filter(function(e2) {
    return void 0 !== e2;
  }), map2(function(e2) {
    return e2.length;
  })), R3), connect(pipe(k2, map2(function(e2) {
    return e2.height;
  })), s2), connect(pipe(combineLatest(k2, z2, F2, W2), map2(function(e2) {
    var t = Ft(e2[0], e2[3], e2[1], e2[2].items);
    return [t.top, t.bottom];
  }), distinctUntilChanged(ve)), i2);
  var V4 = streamFromEmitter(pipe(duc(F2), filter(function(e2) {
    return e2.items.length > 0;
  }), withLatestFrom(R3), filter(function(e2) {
    var t = e2[0].items;
    return t[t.length - 1].index === e2[1] - 1;
  }), map2(function(e2) {
    return e2[1] - 1;
  }), distinctUntilChanged())), U2 = streamFromEmitter(pipe(duc(F2), filter(function(e2) {
    var t = e2.items;
    return t.length > 0 && 0 === t[0].index;
  }), mapTo(0), distinctUntilChanged())), A3 = streamFromEmitter(pipe(duc(F2), filter(function(e2) {
    return e2.items.length > 0;
  }), map2(function(e2) {
    var t = e2.items;
    return { startIndex: t[0].index, endIndex: t[t.length - 1].index };
  }), distinctUntilChanged(Se)));
  connect(A3, v2.scrollSeekRangeChanged), connect(pipe(B3, withLatestFrom(k2, z2, R3, W2), map2(function(e2) {
    var t = e2[1], n3 = e2[2], o3 = e2[3], r3 = e2[4], i3 = ae(e2[0]), a4 = i3.align, l4 = i3.behavior, s3 = i3.offset, u3 = i3.index;
    "LAST" === u3 && (u3 = o3 - 1);
    var c2 = kt(t, r3, n3, u3 = Ht(0, u3, yt(o3 - 1, u3)));
    return "end" === a4 ? c2 = wt(c2 - t.height + n3.height) : "center" === a4 && (c2 = wt(c2 - t.height / 2 + n3.height / 2)), s3 && (c2 += s3), { top: c2, behavior: l4 };
  })), m2);
  var N2 = statefulStreamFromEmitter(pipe(F2, map2(function(e2) {
    return e2.offsetBottom + e2.bottom;
  })), 0);
  return connect(pipe(w2, map2(function(e2) {
    return { width: e2.visibleWidth, height: e2.visibleHeight };
  })), k2), c({ data: M2, totalCount: R3, viewportDimensions: k2, itemDimensions: z2, scrollTop: l3, scrollHeight: P2, overscan: o2, scrollBy: u2, scrollTo: m2, scrollToIndex: B3, smoothScrollTargetReached: d2, windowViewportRect: w2, windowScrollTo: x2, useWindowScroll: b3, customScrollParent: y2, windowScrollContainerState: H2, deviation: O2, scrollContainerState: f2, footerHeight: p2, headerHeight: h2, initialItemCount: L3, gap: W2 }, v2, { gridState: F2, totalListHeight: N2 }, g2, { startReached: U2, endReached: V4, rangeChanged: A3, propsReady: C3 }, E2);
}, tup(Te, y, ce, Ee, me, Oe, S));
function Ft(e, t, n2, o2) {
  var r2 = n2.height;
  return void 0 === r2 || 0 === o2.length ? { top: 0, bottom: 0 } : { top: kt(e, t, n2, o2[0].index), bottom: kt(e, t, n2, o2[o2.length - 1].index) + r2 };
}
function kt(e, t, n2, o2) {
  var r2 = zt(e.width, n2.width, t.column), i2 = bt(o2 / r2), a3 = i2 * n2.height + Ht(0, i2 - 1) * t.row;
  return a3 > 0 ? a3 + t.row : a3;
}
function zt(e, t, n2) {
  return Ht(1, bt((e + n2) / (t + n2)));
}
var Bt = ["placeholder"];
var Pt = system(function() {
  var e = statefulStream(function(e2) {
    return "Item " + e2;
  }), n2 = statefulStream({}), o2 = statefulStream(null), r2 = statefulStream("virtuoso-grid-item"), i2 = statefulStream("virtuoso-grid-list"), a3 = statefulStream(qe), l3 = statefulStream("div"), s2 = statefulStream(noop4), u2 = function(e2, o3) {
    return void 0 === o3 && (o3 = null), statefulStreamFromEmitter(pipe(n2, map2(function(t) {
      return t[e2];
    }), distinctUntilChanged()), o3);
  };
  return { context: o2, itemContent: e, components: n2, computeItemKey: a3, itemClassName: r2, listClassName: i2, headerFooterTag: l3, scrollerRef: s2, FooterComponent: u2("Footer"), HeaderComponent: u2("Header"), ListComponent: u2("List", "div"), ItemComponent: u2("Item", "div"), ScrollerComponent: u2("Scroller", "div"), ScrollSeekPlaceholder: u2("ScrollSeekPlaceholder", "div") };
});
var Ot = system(function(e) {
  var n2 = e[0], o2 = e[1], r2 = { item: Je(o2.itemContent, "Rename the %citem%c prop to %citemContent."), ItemContainer: stream(), ScrollContainer: stream(), ListContainer: stream(), emptyComponent: stream(), scrollSeek: stream() };
  function i2(e2, n3, r3) {
    connect(pipe(e2, withLatestFrom(o2.components), map2(function(e3) {
      var t, o3 = e3[0], i3 = e3[1];
      return console.warn("react-virtuoso: " + r3 + " property is deprecated. Pass components." + n3 + " instead."), c({}, i3, ((t = {})[n3] = o3, t));
    })), o2.components);
  }
  return subscribe(r2.scrollSeek, function(e2) {
    var r3 = e2.placeholder, i3 = m(e2, Bt);
    console.warn("react-virtuoso: scrollSeek property is deprecated. Pass scrollSeekConfiguration and specify the placeholder in components.ScrollSeekPlaceholder instead."), publish(o2.components, c({}, getValue(o2.components), { ScrollSeekPlaceholder: r3 })), publish(n2.scrollSeekConfiguration, i3);
  }), i2(r2.ItemContainer, "Item", "ItemContainer"), i2(r2.ListContainer, "List", "ListContainer"), i2(r2.ScrollContainer, "Scroller", "ScrollContainer"), c({}, n2, o2, r2);
}, tup(Lt, Pt));
var Mt = n.memo(function() {
  var e = _t("gridState"), t = _t("listClassName"), n2 = _t("itemClassName"), o2 = _t("itemContent"), r2 = _t("computeItemKey"), i2 = _t("isSeeking"), a3 = Gt("scrollHeight"), s2 = _t("ItemComponent"), u2 = _t("ListComponent"), m2 = _t("ScrollSeekPlaceholder"), d2 = _t("context"), f2 = Gt("itemDimensions"), p2 = Gt("gap"), h2 = _t("log"), g2 = I(function(e2) {
    a3(e2.parentElement.parentElement.scrollHeight);
    var t2 = e2.firstChild;
    t2 && f2(t2.getBoundingClientRect()), p2({ row: qt("row-gap", getComputedStyle(e2).rowGap, h2), column: qt("column-gap", getComputedStyle(e2).columnGap, h2) });
  });
  return (0, import_react28.createElement)(u2, c({ ref: g2, className: t }, it(u2, d2), { style: { paddingTop: e.offsetTop, paddingBottom: e.offsetBottom } }), e.items.map(function(t2) {
    var a4 = r2(t2.index, t2.data, d2);
    return i2 ? (0, import_react28.createElement)(m2, c({ key: a4 }, it(m2, d2), { index: t2.index, height: e.itemHeight, width: e.itemWidth })) : (0, import_react28.createElement)(s2, c({}, it(s2, d2), { className: n2, "data-index": t2.index, key: a4 }), o2(t2.index, t2.data, d2));
  }));
});
var Wt = n.memo(function() {
  var e = _t("HeaderComponent"), t = Gt("headerHeight"), n2 = _t("headerFooterTag"), o2 = I(function(e2) {
    return t(w(e2, "height"));
  }), r2 = _t("context");
  return e ? (0, import_react28.createElement)(n2, { ref: o2 }, (0, import_react28.createElement)(e, it(e, r2))) : null;
});
var Vt = n.memo(function() {
  var e = _t("FooterComponent"), t = Gt("footerHeight"), n2 = _t("headerFooterTag"), o2 = I(function(e2) {
    return t(w(e2, "height"));
  }), r2 = _t("context");
  return e ? (0, import_react28.createElement)(n2, { ref: o2 }, (0, import_react28.createElement)(e, it(e, r2))) : null;
});
var Ut = function(e) {
  var t = e.children, o2 = (0, import_react28.useContext)(_e), r2 = Gt("itemDimensions"), i2 = Gt("viewportDimensions"), a3 = I(function(e2) {
    i2(e2.getBoundingClientRect());
  });
  return n.useEffect(function() {
    o2 && (i2({ height: o2.viewportHeight, width: o2.viewportWidth }), r2({ height: o2.itemHeight, width: o2.itemWidth }));
  }, [o2, i2, r2]), n.createElement("div", { style: ot, ref: a3 }, t);
};
var At = function(e) {
  var t = e.children, o2 = (0, import_react28.useContext)(_e), r2 = Gt("windowViewportRect"), i2 = Gt("itemDimensions"), a3 = _t("customScrollParent"), l3 = De(r2, a3);
  return n.useEffect(function() {
    o2 && (i2({ height: o2.itemHeight, width: o2.itemWidth }), r2({ offsetTop: 0, visibleHeight: o2.viewportHeight, visibleWidth: o2.viewportWidth }));
  }, [o2, r2, i2]), n.createElement("div", { ref: l3, style: ot }, t);
};
var Nt = systemToComponent(Ot, { optional: { context: "context", totalCount: "totalCount", overscan: "overscan", itemContent: "itemContent", components: "components", computeItemKey: "computeItemKey", data: "data", initialItemCount: "initialItemCount", scrollSeekConfiguration: "scrollSeekConfiguration", headerFooterTag: "headerFooterTag", listClassName: "listClassName", itemClassName: "itemClassName", useWindowScroll: "useWindowScroll", customScrollParent: "customScrollParent", scrollerRef: "scrollerRef", item: "item", ItemContainer: "ItemContainer", ScrollContainer: "ScrollContainer", ListContainer: "ListContainer", scrollSeek: "scrollSeek" }, methods: { scrollTo: "scrollTo", scrollBy: "scrollBy", scrollToIndex: "scrollToIndex" }, events: { isScrolling: "isScrolling", endReached: "endReached", startReached: "startReached", rangeChanged: "rangeChanged", atBottomStateChange: "atBottomStateChange", atTopStateChange: "atTopStateChange" } }, n.memo(function(e) {
  var t = c({}, e), o2 = _t("useWindowScroll"), r2 = _t("customScrollParent"), i2 = r2 || o2 ? At : Ut;
  return n.createElement(r2 || o2 ? Yt : Kt, c({}, t), n.createElement(i2, null, n.createElement(Wt, null), n.createElement(Mt, null), n.createElement(Vt, null)));
}));
var Dt = Nt.Component;
var Gt = Nt.usePublisher;
var _t = Nt.useEmitterValue;
var jt = Nt.useEmitter;
var Kt = st({ usePublisher: Gt, useEmitterValue: _t, useEmitter: jt });
var Yt = ut({ usePublisher: Gt, useEmitterValue: _t, useEmitter: jt });
function qt(e, t, n2) {
  return "normal" === t || null != t && t.endsWith("px") || n2(e + " was not resolved to pixel value correctly", t, h.WARN), "normal" === t ? 0 : parseInt(null != t ? t : "0", 10);
}
var Zt = system(function() {
  var e = statefulStream(function(e2) {
    return n.createElement("td", null, "Item $", e2);
  }), o2 = statefulStream(null), r2 = statefulStream(null), i2 = statefulStream(null), a3 = statefulStream({}), l3 = statefulStream(qe), s2 = statefulStream(noop4), u2 = function(e2, n2) {
    return void 0 === n2 && (n2 = null), statefulStreamFromEmitter(pipe(a3, map2(function(t) {
      return t[e2];
    }), distinctUntilChanged()), n2);
  };
  return { context: o2, itemContent: e, fixedHeaderContent: r2, fixedFooterContent: i2, components: a3, computeItemKey: l3, scrollerRef: s2, TableComponent: u2("Table", "table"), TableHeadComponent: u2("TableHead", "thead"), TableFooterComponent: u2("TableFoot", "tfoot"), TableBodyComponent: u2("TableBody", "tbody"), TableRowComponent: u2("TableRow", "tr"), ScrollerComponent: u2("Scroller", "div"), EmptyPlaceholder: u2("EmptyPlaceholder"), ScrollSeekPlaceholder: u2("ScrollSeekPlaceholder"), FillerRow: u2("FillerRow") };
});
var Jt = system(function(e) {
  return c({}, e[0], e[1]);
}, tup(Ae, Zt));
var $t = function(e) {
  return n.createElement("tr", null, n.createElement("td", { style: { height: e.height } }));
};
var Qt = function(e) {
  return n.createElement("tr", null, n.createElement("td", { style: { height: e.height, padding: 0, border: 0 } }));
};
var Xt = n.memo(function() {
  var e = an("listState"), t = rn("sizeRanges"), o2 = an("useWindowScroll"), r2 = an("customScrollParent"), i2 = rn("windowScrollContainerState"), a3 = rn("scrollContainerState"), s2 = r2 || o2 ? i2 : a3, u2 = an("itemContent"), m2 = an("trackItemSizes"), d2 = T(t, an("itemSize"), m2, s2, an("log"), void 0, r2), f2 = d2.callbackRef, p2 = d2.ref, h2 = n.useState(0), g2 = h2[0], v2 = h2[1];
  ln("deviation", function(e2) {
    g2 !== e2 && (p2.current.style.marginTop = e2 + "px", v2(e2));
  });
  var S2 = an("EmptyPlaceholder"), C3 = an("ScrollSeekPlaceholder") || $t, I2 = an("FillerRow") || Qt, w2 = an("TableBodyComponent"), x2 = an("TableRowComponent"), b3 = an("computeItemKey"), y2 = an("isSeeking"), H2 = an("paddingTopAddition"), E2 = an("firstItemIndex"), R3 = an("statefulTotalCount"), L3 = an("context");
  if (0 === R3 && S2)
    return (0, import_react28.createElement)(S2, it(S2, L3));
  var F2 = e.offsetTop + H2 + g2, k2 = e.offsetBottom, z2 = F2 > 0 ? n.createElement(I2, { height: F2, key: "padding-top" }) : null, B3 = k2 > 0 ? n.createElement(I2, { height: k2, key: "padding-bottom" }) : null, P2 = e.items.map(function(e2) {
    var t2 = e2.originalIndex, n2 = b3(t2 + E2, e2.data, L3);
    return y2 ? (0, import_react28.createElement)(C3, c({}, it(C3, L3), { key: n2, index: e2.index, height: e2.size, type: e2.type || "item" })) : (0, import_react28.createElement)(x2, c({}, it(x2, L3), { key: n2, "data-index": t2, "data-known-size": e2.size, "data-item-index": e2.index, style: { overflowAnchor: "none" } }), u2(e2.index, e2.data, L3));
  });
  return (0, import_react28.createElement)(w2, c({ ref: f2, "data-test-id": "virtuoso-item-list" }, it(w2, L3)), [z2].concat(P2, [B3]));
});
var en = function(e) {
  var o2 = e.children, r2 = (0, import_react28.useContext)(Ge), i2 = rn("viewportHeight"), a3 = rn("fixedItemHeight"), l3 = I(compose(i2, function(e2) {
    return w(e2, "height");
  }));
  return n.useEffect(function() {
    r2 && (i2(r2.viewportHeight), a3(r2.itemHeight));
  }, [r2, i2, a3]), n.createElement("div", { style: ot, ref: l3, "data-viewport-type": "element" }, o2);
};
var tn = function(e) {
  var t = e.children, o2 = (0, import_react28.useContext)(Ge), r2 = rn("windowViewportRect"), i2 = rn("fixedItemHeight"), a3 = an("customScrollParent"), l3 = De(r2, a3);
  return n.useEffect(function() {
    o2 && (i2(o2.itemHeight), r2({ offsetTop: 0, visibleHeight: o2.viewportHeight, visibleWidth: 100 }));
  }, [o2, r2, i2]), n.createElement("div", { ref: l3, style: ot, "data-viewport-type": "window" }, t);
};
var nn = systemToComponent(Jt, { required: {}, optional: { context: "context", followOutput: "followOutput", firstItemIndex: "firstItemIndex", itemContent: "itemContent", fixedHeaderContent: "fixedHeaderContent", fixedFooterContent: "fixedFooterContent", overscan: "overscan", increaseViewportBy: "increaseViewportBy", totalCount: "totalCount", topItemCount: "topItemCount", initialTopMostItemIndex: "initialTopMostItemIndex", components: "components", groupCounts: "groupCounts", atBottomThreshold: "atBottomThreshold", atTopThreshold: "atTopThreshold", computeItemKey: "computeItemKey", defaultItemHeight: "defaultItemHeight", fixedItemHeight: "fixedItemHeight", itemSize: "itemSize", scrollSeekConfiguration: "scrollSeekConfiguration", data: "data", initialItemCount: "initialItemCount", initialScrollTop: "initialScrollTop", alignToBottom: "alignToBottom", useWindowScroll: "useWindowScroll", customScrollParent: "customScrollParent", scrollerRef: "scrollerRef", logLevel: "logLevel", react18ConcurrentRendering: "react18ConcurrentRendering" }, methods: { scrollToIndex: "scrollToIndex", scrollIntoView: "scrollIntoView", scrollTo: "scrollTo", scrollBy: "scrollBy" }, events: { isScrolling: "isScrolling", endReached: "endReached", startReached: "startReached", rangeChanged: "rangeChanged", atBottomStateChange: "atBottomStateChange", atTopStateChange: "atTopStateChange", totalListHeightChanged: "totalListHeightChanged", itemsRendered: "itemsRendered", groupIndices: "groupIndices" } }, n.memo(function(e) {
  var o2 = an("useWindowScroll"), r2 = an("customScrollParent"), i2 = rn("fixedHeaderHeight"), a3 = rn("fixedFooterHeight"), l3 = an("fixedHeaderContent"), s2 = an("fixedFooterContent"), u2 = an("context"), m2 = I(compose(i2, function(e2) {
    return w(e2, "height");
  })), d2 = I(compose(a3, function(e2) {
    return w(e2, "height");
  })), f2 = r2 || o2 ? un : sn, p2 = r2 || o2 ? tn : en, h2 = an("TableComponent"), g2 = an("TableHeadComponent"), v2 = an("TableFooterComponent"), S2 = l3 ? n.createElement(g2, c({ key: "TableHead", style: { zIndex: 1, position: "sticky", top: 0 }, ref: m2 }, it(g2, u2)), l3()) : null, C3 = s2 ? n.createElement(v2, c({ key: "TableFoot", style: { zIndex: 1, position: "sticky", bottom: 0 }, ref: d2 }, it(v2, u2)), s2()) : null;
  return n.createElement(f2, c({}, e), n.createElement(p2, null, n.createElement(h2, c({ style: { borderSpacing: 0 } }, it(h2, u2)), [S2, n.createElement(Xt, { key: "TableBody" }), C3])));
}));
var on = nn.Component;
var rn = nn.usePublisher;
var an = nn.useEmitterValue;
var ln = nn.useEmitter;
var sn = st({ usePublisher: rn, useEmitterValue: an, useEmitter: ln });
var un = ut({ usePublisher: rn, useEmitterValue: an, useEmitter: ln });
var cn = pt;

// src/lib/shapes/BoxShape.tsx
var React45 = __toESM(require("react"));

// ../../node_modules/@babel/runtime/helpers/esm/extends.js
function _extends2() {
  _extends2 = Object.assign ? Object.assign.bind() : function(target) {
    for (var i2 = 1; i2 < arguments.length; i2++) {
      var source = arguments[i2];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends2.apply(this, arguments);
}

// ../../node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js
function _assertThisInitialized2(self2) {
  if (self2 === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self2;
}

// ../../node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js
function _setPrototypeOf2(o2, p2) {
  _setPrototypeOf2 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf3(o3, p3) {
    o3.__proto__ = p3;
    return o3;
  };
  return _setPrototypeOf2(o2, p2);
}

// ../../node_modules/@babel/runtime/helpers/esm/inheritsLoose.js
function _inheritsLoose2(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  _setPrototypeOf2(subClass, superClass);
}

// ../../node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js
function _getPrototypeOf(o2) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf2(o3) {
    return o3.__proto__ || Object.getPrototypeOf(o3);
  };
  return _getPrototypeOf(o2);
}

// ../../node_modules/@babel/runtime/helpers/esm/isNativeFunction.js
function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

// ../../node_modules/@babel/runtime/helpers/esm/isNativeReflectConstruct.js
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct)
    return false;
  if (Reflect.construct.sham)
    return false;
  if (typeof Proxy === "function")
    return true;
  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
    return true;
  } catch (e) {
    return false;
  }
}

// ../../node_modules/@babel/runtime/helpers/esm/construct.js
function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct.bind();
  } else {
    _construct = function _construct2(Parent2, args2, Class2) {
      var a3 = [null];
      a3.push.apply(a3, args2);
      var Constructor = Function.bind.apply(Parent2, a3);
      var instance = new Constructor();
      if (Class2)
        _setPrototypeOf2(instance, Class2.prototype);
      return instance;
    };
  }
  return _construct.apply(null, arguments);
}

// ../../node_modules/@babel/runtime/helpers/esm/wrapNativeSuper.js
function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? /* @__PURE__ */ new Map() : void 0;
  _wrapNativeSuper = function _wrapNativeSuper2(Class2) {
    if (Class2 === null || !_isNativeFunction(Class2))
      return Class2;
    if (typeof Class2 !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }
    if (typeof _cache !== "undefined") {
      if (_cache.has(Class2))
        return _cache.get(Class2);
      _cache.set(Class2, Wrapper);
    }
    function Wrapper() {
      return _construct(Class2, arguments, _getPrototypeOf(this).constructor);
    }
    Wrapper.prototype = Object.create(Class2.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf2(Wrapper, Class2);
  };
  return _wrapNativeSuper(Class);
}

// ../../node_modules/polished/dist/polished.esm.js
var PolishedError = /* @__PURE__ */ function(_Error) {
  _inheritsLoose2(PolishedError2, _Error);
  function PolishedError2(code) {
    var _this;
    if (true) {
      _this = _Error.call(this, "An error occurred. See https://github.com/styled-components/polished/blob/main/src/internalHelpers/errors.md#" + code + " for more information.") || this;
    } else {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }
      _this = _Error.call(this, format.apply(void 0, [ERRORS[code]].concat(args))) || this;
    }
    return _assertThisInitialized2(_this);
  }
  return PolishedError2;
}(/* @__PURE__ */ _wrapNativeSuper(Error));
function colorToInt(color) {
  return Math.round(color * 255);
}
function convertToInt(red, green, blue) {
  return colorToInt(red) + "," + colorToInt(green) + "," + colorToInt(blue);
}
function hslToRgb(hue, saturation, lightness, convert) {
  if (convert === void 0) {
    convert = convertToInt;
  }
  if (saturation === 0) {
    return convert(lightness, lightness, lightness);
  }
  var huePrime = (hue % 360 + 360) % 360 / 60;
  var chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  var secondComponent = chroma * (1 - Math.abs(huePrime % 2 - 1));
  var red = 0;
  var green = 0;
  var blue = 0;
  if (huePrime >= 0 && huePrime < 1) {
    red = chroma;
    green = secondComponent;
  } else if (huePrime >= 1 && huePrime < 2) {
    red = secondComponent;
    green = chroma;
  } else if (huePrime >= 2 && huePrime < 3) {
    green = chroma;
    blue = secondComponent;
  } else if (huePrime >= 3 && huePrime < 4) {
    green = secondComponent;
    blue = chroma;
  } else if (huePrime >= 4 && huePrime < 5) {
    red = secondComponent;
    blue = chroma;
  } else if (huePrime >= 5 && huePrime < 6) {
    red = chroma;
    blue = secondComponent;
  }
  var lightnessModification = lightness - chroma / 2;
  var finalRed = red + lightnessModification;
  var finalGreen = green + lightnessModification;
  var finalBlue = blue + lightnessModification;
  return convert(finalRed, finalGreen, finalBlue);
}
var namedColorMap = {
  aliceblue: "f0f8ff",
  antiquewhite: "faebd7",
  aqua: "00ffff",
  aquamarine: "7fffd4",
  azure: "f0ffff",
  beige: "f5f5dc",
  bisque: "ffe4c4",
  black: "000",
  blanchedalmond: "ffebcd",
  blue: "0000ff",
  blueviolet: "8a2be2",
  brown: "a52a2a",
  burlywood: "deb887",
  cadetblue: "5f9ea0",
  chartreuse: "7fff00",
  chocolate: "d2691e",
  coral: "ff7f50",
  cornflowerblue: "6495ed",
  cornsilk: "fff8dc",
  crimson: "dc143c",
  cyan: "00ffff",
  darkblue: "00008b",
  darkcyan: "008b8b",
  darkgoldenrod: "b8860b",
  darkgray: "a9a9a9",
  darkgreen: "006400",
  darkgrey: "a9a9a9",
  darkkhaki: "bdb76b",
  darkmagenta: "8b008b",
  darkolivegreen: "556b2f",
  darkorange: "ff8c00",
  darkorchid: "9932cc",
  darkred: "8b0000",
  darksalmon: "e9967a",
  darkseagreen: "8fbc8f",
  darkslateblue: "483d8b",
  darkslategray: "2f4f4f",
  darkslategrey: "2f4f4f",
  darkturquoise: "00ced1",
  darkviolet: "9400d3",
  deeppink: "ff1493",
  deepskyblue: "00bfff",
  dimgray: "696969",
  dimgrey: "696969",
  dodgerblue: "1e90ff",
  firebrick: "b22222",
  floralwhite: "fffaf0",
  forestgreen: "228b22",
  fuchsia: "ff00ff",
  gainsboro: "dcdcdc",
  ghostwhite: "f8f8ff",
  gold: "ffd700",
  goldenrod: "daa520",
  gray: "808080",
  green: "008000",
  greenyellow: "adff2f",
  grey: "808080",
  honeydew: "f0fff0",
  hotpink: "ff69b4",
  indianred: "cd5c5c",
  indigo: "4b0082",
  ivory: "fffff0",
  khaki: "f0e68c",
  lavender: "e6e6fa",
  lavenderblush: "fff0f5",
  lawngreen: "7cfc00",
  lemonchiffon: "fffacd",
  lightblue: "add8e6",
  lightcoral: "f08080",
  lightcyan: "e0ffff",
  lightgoldenrodyellow: "fafad2",
  lightgray: "d3d3d3",
  lightgreen: "90ee90",
  lightgrey: "d3d3d3",
  lightpink: "ffb6c1",
  lightsalmon: "ffa07a",
  lightseagreen: "20b2aa",
  lightskyblue: "87cefa",
  lightslategray: "789",
  lightslategrey: "789",
  lightsteelblue: "b0c4de",
  lightyellow: "ffffe0",
  lime: "0f0",
  limegreen: "32cd32",
  linen: "faf0e6",
  magenta: "f0f",
  maroon: "800000",
  mediumaquamarine: "66cdaa",
  mediumblue: "0000cd",
  mediumorchid: "ba55d3",
  mediumpurple: "9370db",
  mediumseagreen: "3cb371",
  mediumslateblue: "7b68ee",
  mediumspringgreen: "00fa9a",
  mediumturquoise: "48d1cc",
  mediumvioletred: "c71585",
  midnightblue: "191970",
  mintcream: "f5fffa",
  mistyrose: "ffe4e1",
  moccasin: "ffe4b5",
  navajowhite: "ffdead",
  navy: "000080",
  oldlace: "fdf5e6",
  olive: "808000",
  olivedrab: "6b8e23",
  orange: "ffa500",
  orangered: "ff4500",
  orchid: "da70d6",
  palegoldenrod: "eee8aa",
  palegreen: "98fb98",
  paleturquoise: "afeeee",
  palevioletred: "db7093",
  papayawhip: "ffefd5",
  peachpuff: "ffdab9",
  peru: "cd853f",
  pink: "ffc0cb",
  plum: "dda0dd",
  powderblue: "b0e0e6",
  purple: "800080",
  rebeccapurple: "639",
  red: "f00",
  rosybrown: "bc8f8f",
  royalblue: "4169e1",
  saddlebrown: "8b4513",
  salmon: "fa8072",
  sandybrown: "f4a460",
  seagreen: "2e8b57",
  seashell: "fff5ee",
  sienna: "a0522d",
  silver: "c0c0c0",
  skyblue: "87ceeb",
  slateblue: "6a5acd",
  slategray: "708090",
  slategrey: "708090",
  snow: "fffafa",
  springgreen: "00ff7f",
  steelblue: "4682b4",
  tan: "d2b48c",
  teal: "008080",
  thistle: "d8bfd8",
  tomato: "ff6347",
  turquoise: "40e0d0",
  violet: "ee82ee",
  wheat: "f5deb3",
  white: "fff",
  whitesmoke: "f5f5f5",
  yellow: "ff0",
  yellowgreen: "9acd32"
};
function nameToHex(color) {
  if (typeof color !== "string")
    return color;
  var normalizedColorName = color.toLowerCase();
  return namedColorMap[normalizedColorName] ? "#" + namedColorMap[normalizedColorName] : color;
}
var hexRegex = /^#[a-fA-F0-9]{6}$/;
var hexRgbaRegex = /^#[a-fA-F0-9]{8}$/;
var reducedHexRegex = /^#[a-fA-F0-9]{3}$/;
var reducedRgbaHexRegex = /^#[a-fA-F0-9]{4}$/;
var rgbRegex = /^rgb\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*\)$/i;
var rgbaRegex = /^rgb(?:a)?\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i;
var hslRegex = /^hsl\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*\)$/i;
var hslaRegex = /^hsl(?:a)?\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i;
function parseToRgb(color) {
  if (typeof color !== "string") {
    throw new PolishedError(3);
  }
  var normalizedColor = nameToHex(color);
  if (normalizedColor.match(hexRegex)) {
    return {
      red: parseInt("" + normalizedColor[1] + normalizedColor[2], 16),
      green: parseInt("" + normalizedColor[3] + normalizedColor[4], 16),
      blue: parseInt("" + normalizedColor[5] + normalizedColor[6], 16)
    };
  }
  if (normalizedColor.match(hexRgbaRegex)) {
    var alpha = parseFloat((parseInt("" + normalizedColor[7] + normalizedColor[8], 16) / 255).toFixed(2));
    return {
      red: parseInt("" + normalizedColor[1] + normalizedColor[2], 16),
      green: parseInt("" + normalizedColor[3] + normalizedColor[4], 16),
      blue: parseInt("" + normalizedColor[5] + normalizedColor[6], 16),
      alpha
    };
  }
  if (normalizedColor.match(reducedHexRegex)) {
    return {
      red: parseInt("" + normalizedColor[1] + normalizedColor[1], 16),
      green: parseInt("" + normalizedColor[2] + normalizedColor[2], 16),
      blue: parseInt("" + normalizedColor[3] + normalizedColor[3], 16)
    };
  }
  if (normalizedColor.match(reducedRgbaHexRegex)) {
    var _alpha = parseFloat((parseInt("" + normalizedColor[4] + normalizedColor[4], 16) / 255).toFixed(2));
    return {
      red: parseInt("" + normalizedColor[1] + normalizedColor[1], 16),
      green: parseInt("" + normalizedColor[2] + normalizedColor[2], 16),
      blue: parseInt("" + normalizedColor[3] + normalizedColor[3], 16),
      alpha: _alpha
    };
  }
  var rgbMatched = rgbRegex.exec(normalizedColor);
  if (rgbMatched) {
    return {
      red: parseInt("" + rgbMatched[1], 10),
      green: parseInt("" + rgbMatched[2], 10),
      blue: parseInt("" + rgbMatched[3], 10)
    };
  }
  var rgbaMatched = rgbaRegex.exec(normalizedColor.substring(0, 50));
  if (rgbaMatched) {
    return {
      red: parseInt("" + rgbaMatched[1], 10),
      green: parseInt("" + rgbaMatched[2], 10),
      blue: parseInt("" + rgbaMatched[3], 10),
      alpha: parseFloat("" + rgbaMatched[4]) > 1 ? parseFloat("" + rgbaMatched[4]) / 100 : parseFloat("" + rgbaMatched[4])
    };
  }
  var hslMatched = hslRegex.exec(normalizedColor);
  if (hslMatched) {
    var hue = parseInt("" + hslMatched[1], 10);
    var saturation = parseInt("" + hslMatched[2], 10) / 100;
    var lightness = parseInt("" + hslMatched[3], 10) / 100;
    var rgbColorString = "rgb(" + hslToRgb(hue, saturation, lightness) + ")";
    var hslRgbMatched = rgbRegex.exec(rgbColorString);
    if (!hslRgbMatched) {
      throw new PolishedError(4, normalizedColor, rgbColorString);
    }
    return {
      red: parseInt("" + hslRgbMatched[1], 10),
      green: parseInt("" + hslRgbMatched[2], 10),
      blue: parseInt("" + hslRgbMatched[3], 10)
    };
  }
  var hslaMatched = hslaRegex.exec(normalizedColor.substring(0, 50));
  if (hslaMatched) {
    var _hue = parseInt("" + hslaMatched[1], 10);
    var _saturation = parseInt("" + hslaMatched[2], 10) / 100;
    var _lightness = parseInt("" + hslaMatched[3], 10) / 100;
    var _rgbColorString = "rgb(" + hslToRgb(_hue, _saturation, _lightness) + ")";
    var _hslRgbMatched = rgbRegex.exec(_rgbColorString);
    if (!_hslRgbMatched) {
      throw new PolishedError(4, normalizedColor, _rgbColorString);
    }
    return {
      red: parseInt("" + _hslRgbMatched[1], 10),
      green: parseInt("" + _hslRgbMatched[2], 10),
      blue: parseInt("" + _hslRgbMatched[3], 10),
      alpha: parseFloat("" + hslaMatched[4]) > 1 ? parseFloat("" + hslaMatched[4]) / 100 : parseFloat("" + hslaMatched[4])
    };
  }
  throw new PolishedError(5);
}
function rgbToHsl(color) {
  var red = color.red / 255;
  var green = color.green / 255;
  var blue = color.blue / 255;
  var max = Math.max(red, green, blue);
  var min = Math.min(red, green, blue);
  var lightness = (max + min) / 2;
  if (max === min) {
    if (color.alpha !== void 0) {
      return {
        hue: 0,
        saturation: 0,
        lightness,
        alpha: color.alpha
      };
    } else {
      return {
        hue: 0,
        saturation: 0,
        lightness
      };
    }
  }
  var hue;
  var delta = max - min;
  var saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  switch (max) {
    case red:
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
      break;
    case green:
      hue = (blue - red) / delta + 2;
      break;
    default:
      hue = (red - green) / delta + 4;
      break;
  }
  hue *= 60;
  if (color.alpha !== void 0) {
    return {
      hue,
      saturation,
      lightness,
      alpha: color.alpha
    };
  }
  return {
    hue,
    saturation,
    lightness
  };
}
function parseToHsl(color) {
  return rgbToHsl(parseToRgb(color));
}
var reduceHexValue = function reduceHexValue2(value) {
  if (value.length === 7 && value[1] === value[2] && value[3] === value[4] && value[5] === value[6]) {
    return "#" + value[1] + value[3] + value[5];
  }
  return value;
};
var reduceHexValue$1 = reduceHexValue;
function numberToHex(value) {
  var hex = value.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}
function colorToHex(color) {
  return numberToHex(Math.round(color * 255));
}
function convertToHex(red, green, blue) {
  return reduceHexValue$1("#" + colorToHex(red) + colorToHex(green) + colorToHex(blue));
}
function hslToHex(hue, saturation, lightness) {
  return hslToRgb(hue, saturation, lightness, convertToHex);
}
function hsl(value, saturation, lightness) {
  if (typeof value === "number" && typeof saturation === "number" && typeof lightness === "number") {
    return hslToHex(value, saturation, lightness);
  } else if (typeof value === "object" && saturation === void 0 && lightness === void 0) {
    return hslToHex(value.hue, value.saturation, value.lightness);
  }
  throw new PolishedError(1);
}
function hsla(value, saturation, lightness, alpha) {
  if (typeof value === "number" && typeof saturation === "number" && typeof lightness === "number" && typeof alpha === "number") {
    return alpha >= 1 ? hslToHex(value, saturation, lightness) : "rgba(" + hslToRgb(value, saturation, lightness) + "," + alpha + ")";
  } else if (typeof value === "object" && saturation === void 0 && lightness === void 0 && alpha === void 0) {
    return value.alpha >= 1 ? hslToHex(value.hue, value.saturation, value.lightness) : "rgba(" + hslToRgb(value.hue, value.saturation, value.lightness) + "," + value.alpha + ")";
  }
  throw new PolishedError(2);
}
function rgb(value, green, blue) {
  if (typeof value === "number" && typeof green === "number" && typeof blue === "number") {
    return reduceHexValue$1("#" + numberToHex(value) + numberToHex(green) + numberToHex(blue));
  } else if (typeof value === "object" && green === void 0 && blue === void 0) {
    return reduceHexValue$1("#" + numberToHex(value.red) + numberToHex(value.green) + numberToHex(value.blue));
  }
  throw new PolishedError(6);
}
function rgba(firstValue, secondValue, thirdValue, fourthValue) {
  if (typeof firstValue === "string" && typeof secondValue === "number") {
    var rgbValue = parseToRgb(firstValue);
    return "rgba(" + rgbValue.red + "," + rgbValue.green + "," + rgbValue.blue + "," + secondValue + ")";
  } else if (typeof firstValue === "number" && typeof secondValue === "number" && typeof thirdValue === "number" && typeof fourthValue === "number") {
    return fourthValue >= 1 ? rgb(firstValue, secondValue, thirdValue) : "rgba(" + firstValue + "," + secondValue + "," + thirdValue + "," + fourthValue + ")";
  } else if (typeof firstValue === "object" && secondValue === void 0 && thirdValue === void 0 && fourthValue === void 0) {
    return firstValue.alpha >= 1 ? rgb(firstValue.red, firstValue.green, firstValue.blue) : "rgba(" + firstValue.red + "," + firstValue.green + "," + firstValue.blue + "," + firstValue.alpha + ")";
  }
  throw new PolishedError(7);
}
var isRgb = function isRgb2(color) {
  return typeof color.red === "number" && typeof color.green === "number" && typeof color.blue === "number" && (typeof color.alpha !== "number" || typeof color.alpha === "undefined");
};
var isRgba = function isRgba2(color) {
  return typeof color.red === "number" && typeof color.green === "number" && typeof color.blue === "number" && typeof color.alpha === "number";
};
var isHsl = function isHsl2(color) {
  return typeof color.hue === "number" && typeof color.saturation === "number" && typeof color.lightness === "number" && (typeof color.alpha !== "number" || typeof color.alpha === "undefined");
};
var isHsla = function isHsla2(color) {
  return typeof color.hue === "number" && typeof color.saturation === "number" && typeof color.lightness === "number" && typeof color.alpha === "number";
};
function toColorString(color) {
  if (typeof color !== "object")
    throw new PolishedError(8);
  if (isRgba(color))
    return rgba(color);
  if (isRgb(color))
    return rgb(color);
  if (isHsla(color))
    return hsla(color);
  if (isHsl(color))
    return hsl(color);
  throw new PolishedError(8);
}
function curried(f2, length, acc) {
  return function fn() {
    var combined = acc.concat(Array.prototype.slice.call(arguments));
    return combined.length >= length ? f2.apply(this, combined) : curried(f2, length, combined);
  };
}
function curry(f2) {
  return curried(f2, f2.length, []);
}
function guard(lowerBoundary, upperBoundary, value) {
  return Math.max(lowerBoundary, Math.min(upperBoundary, value));
}
function darken(amount, color) {
  if (color === "transparent")
    return color;
  var hslColor = parseToHsl(color);
  return toColorString(_extends2({}, hslColor, {
    lightness: guard(0, 1, hslColor.lightness - parseFloat(amount))
  }));
}
var curriedDarken = /* @__PURE__ */ curry(darken);
var curriedDarken$1 = curriedDarken;

// src/lib/shapes/style-props.tsx
function withClampedStyles(self2, props) {
  var _a3;
  if (props.strokeWidth !== void 0)
    props.strokeWidth = Math.max(props.strokeWidth, 1);
  if (props.opacity !== void 0)
    props.opacity = Math.min(1, Math.max(props.opacity, 0));
  let fill = (_a3 = props.fill) != null ? _a3 : self2.props.fill;
  if (fill !== void 0 && !isBuiltInColor(fill) && fill !== "var(--ls-secondary-background-color)" && !props.noFill && withFillShapes.includes(self2.props.type)) {
    const strokeColor = curriedDarken$1(0.3, fill);
    props.stroke = strokeColor;
  }
  return props;
}

// src/lib/shapes/BindingIndicator.tsx
var import_jsx_runtime51 = require("react/jsx-runtime");
function BindingIndicator({ strokeWidth, size, mode }) {
  return mode === "svg" ? /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("rect", {
    className: "tl-binding-indicator",
    x: strokeWidth,
    y: strokeWidth,
    rx: 2,
    ry: 2,
    width: Math.max(0, size[0] - strokeWidth * 2),
    height: Math.max(0, size[1] - strokeWidth * 2),
    strokeWidth: strokeWidth * 4
  }) : /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("div", {
    className: "tl-binding-indicator",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      boxShadow: "0 0 0 4px var(--tl-binding)",
      borderRadius: 4
    }
  });
}

// src/lib/shapes/text/TextLabel.tsx
var React44 = __toESM(require("react"));

// src/lib/shapes/text/TextAreaUtils.ts
var INDENT = "  ";
var TextAreaUtils = class {
  static insertTextFirefox(field, text) {
    field.setRangeText(
      text,
      field.selectionStart || 0,
      field.selectionEnd || 0,
      "end"
    );
    field.dispatchEvent(
      new InputEvent("input", {
        data: text,
        inputType: "insertText",
        isComposing: false
      })
    );
  }
  static insert(field, text) {
    const document2 = field.ownerDocument;
    const initialFocus = document2.activeElement;
    if (initialFocus !== field) {
      field.focus();
    }
    if (!document2.execCommand("insertText", false, text)) {
      TextAreaUtils.insertTextFirefox(field, text);
    }
    if (initialFocus === document2.body) {
      field.blur();
    } else if (initialFocus instanceof HTMLElement && initialFocus !== field) {
      initialFocus.focus();
    }
  }
  static set(field, text) {
    field.select();
    TextAreaUtils.insert(field, text);
  }
  static getSelection(field) {
    const { selectionStart, selectionEnd } = field;
    return field.value.slice(
      selectionStart ? selectionStart : void 0,
      selectionEnd ? selectionEnd : void 0
    );
  }
  static wrapSelection(field, wrap, wrapEnd) {
    const { selectionStart, selectionEnd } = field;
    const selection = TextAreaUtils.getSelection(field);
    TextAreaUtils.insert(field, wrap + selection + (wrapEnd != null ? wrapEnd : wrap));
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
      TextAreaUtils.insert(field, replacement);
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
    var _a3;
    const { selectionStart, selectionEnd, value } = element;
    const selectedContrast = value.slice(selectionStart, selectionEnd);
    const lineBreakCount = (_a3 = /\n/g.exec(selectedContrast)) == null ? void 0 : _a3.length;
    if (lineBreakCount && lineBreakCount > 0) {
      const firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const newSelection = element.value.slice(firstLineStart, selectionEnd - 1);
      const indentedText = newSelection.replace(
        /^|\n/g,
        `$&${INDENT}`
      );
      const replacementsCount = indentedText.length - newSelection.length;
      element.setSelectionRange(firstLineStart, selectionEnd - 1);
      TextAreaUtils.insert(element, indentedText);
      element.setSelectionRange(selectionStart + 1, selectionEnd + replacementsCount);
    } else {
      TextAreaUtils.insert(element, INDENT);
    }
  }
  static unindent(element) {
    const { selectionStart, selectionEnd, value } = element;
    const firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const minimumSelectionEnd = TextAreaUtils.findLineEnd(value, selectionEnd);
    const newSelection = element.value.slice(firstLineStart, minimumSelectionEnd);
    const indentedText = newSelection.replace(/(^|\n)(\t| {1,2})/g, "$1");
    const replacementsCount = newSelection.length - indentedText.length;
    element.setSelectionRange(firstLineStart, minimumSelectionEnd);
    TextAreaUtils.insert(element, indentedText);
    const firstLineIndentation = /\t| {1,2}/.exec(value.slice(firstLineStart, selectionStart));
    const difference = firstLineIndentation ? firstLineIndentation[0].length : 0;
    const newSelectionStart = selectionStart - difference;
    element.setSelectionRange(
      selectionStart - difference,
      Math.max(newSelectionStart, selectionEnd - replacementsCount)
    );
  }
};

// src/lib/shapes/text/TextLabel.tsx
var import_jsx_runtime52 = require("react/jsx-runtime");
var stopPropagation = (e) => e.stopPropagation();
var placeholder = "Enter text";
var TextLabel = React44.memo(function TextLabel2({
  font: font5,
  text,
  color,
  fontStyle,
  fontSize,
  fontWeight,
  offsetX = 0,
  offsetY = 0,
  scale = 1,
  isEditing = false,
  pointerEvents = false,
  onBlur,
  onChange
}) {
  const rInput = React44.useRef(null);
  const rIsMounted = React44.useRef(false);
  const handleChange = React44.useCallback(
    (e) => {
      onChange(TextUtils.normalizeText(e.currentTarget.value));
    },
    [onChange]
  );
  const handleKeyDown = React44.useCallback(
    (e) => {
      if (e.key === "Escape")
        return;
      if (e.key === "Tab" && text.length === 0) {
        e.preventDefault();
        return;
      }
      if (!(e.key === "Meta" || e.metaKey)) {
        e.stopPropagation();
      } else if (e.key === "z" && e.metaKey) {
        document.execCommand(e.shiftKey ? "redo" : "undo", false);
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          TextAreaUtils.unindent(e.currentTarget);
        } else {
          TextAreaUtils.indent(e.currentTarget);
        }
        onChange == null ? void 0 : onChange(TextUtils.normalizeText(e.currentTarget.value));
      }
    },
    [onChange]
  );
  const handleBlur = React44.useCallback(
    (e) => {
      if (!isEditing)
        return;
      e.currentTarget.setSelectionRange(0, 0);
      onBlur == null ? void 0 : onBlur();
    },
    [onBlur]
  );
  const handleFocus = React44.useCallback(
    (e) => {
      if (!isEditing || !rIsMounted.current)
        return;
      if (document.activeElement === e.currentTarget) {
        e.currentTarget.select();
      }
    },
    [isEditing]
  );
  const handlePointerDown = React44.useCallback(
    (e) => {
      if (isEditing) {
        e.stopPropagation();
      }
    },
    [isEditing]
  );
  React44.useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        rIsMounted.current = true;
        const elm = rInput.current;
        if (elm) {
          elm.focus();
          elm.select();
        }
      });
    }
  }, [isEditing, onBlur]);
  const rInnerWrapper = React44.useRef(null);
  React44.useLayoutEffect(() => {
    const elm = rInnerWrapper.current;
    if (!elm)
      return;
    const size = getTextLabelSize(
      text || placeholder,
      { fontFamily: "var(--ls-font-family)", fontSize, lineHeight: 1, fontWeight },
      4
    );
    elm.style.transform = `scale(${scale}, ${scale}) translate(${offsetX}px, ${offsetY}px)`;
    elm.style.width = size[0] + 1 + "px";
    elm.style.height = size[1] + 1 + "px";
  }, [text, fontWeight, fontSize, offsetY, offsetX, scale]);
  return /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("div", {
    className: "tl-text-label-wrapper",
    children: /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", {
      className: "tl-text-label-inner-wrapper",
      ref: rInnerWrapper,
      style: {
        font: font5,
        fontStyle,
        fontSize,
        fontWeight,
        color,
        pointerEvents: pointerEvents ? "all" : "none",
        userSelect: isEditing ? "text" : "none"
      },
      children: [
        isEditing ? /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("textarea", {
          ref: rInput,
          style: {
            font: font5,
            color,
            fontStyle,
            fontSize,
            fontWeight
          },
          className: "tl-text-label-textarea",
          name: "text",
          tabIndex: -1,
          autoComplete: "false",
          autoCapitalize: "false",
          autoCorrect: "false",
          autoSave: "false",
          autoFocus: true,
          placeholder,
          spellCheck: "true",
          wrap: "off",
          dir: "auto",
          datatype: "wysiwyg",
          defaultValue: text,
          color,
          onFocus: handleFocus,
          onChange: handleChange,
          onKeyDown: handleKeyDown,
          onBlur: handleBlur,
          onPointerDown: handlePointerDown,
          onContextMenu: stopPropagation,
          onCopy: stopPropagation,
          onPaste: stopPropagation,
          onCut: stopPropagation
        }) : text,
        "\u200B"
      ]
    })
  });
});

// src/lib/shapes/BoxShape.tsx
var import_jsx_runtime53 = require("react/jsx-runtime");
var font = "20px / 1 var(--ls-font-family)";
var levelToScale = {
  xs: 10,
  sm: 16,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 60
};
var BoxShape = class extends TLBoxShape {
  constructor() {
    super(...arguments);
    __publicField(this, "canEdit", true);
    __publicField(this, "ReactComponent", observer(
      ({ events, isErasing, isBinding, isSelected, isEditing, onEditingEnd }) => {
        const {
          props: {
            size: [w2, h2],
            stroke,
            fill,
            noFill,
            strokeWidth,
            strokeType,
            borderRadius,
            opacity,
            label,
            italic,
            fontWeight,
            fontSize
          }
        } = this;
        const labelSize = label || isEditing ? getTextLabelSize(
          label,
          { fontFamily: "var(--ls-font-family)", fontSize, lineHeight: 1, fontWeight },
          4
        ) : [0, 0];
        const midPoint = src_default.mul(this.props.size, 0.5);
        const scale = Math.max(0.5, Math.min(1, w2 / labelSize[0], h2 / labelSize[1]));
        const bounds = this.getBounds();
        const offset = React45.useMemo(() => {
          return src_default.sub(midPoint, src_default.toFixed([bounds.width / 2, bounds.height / 2]));
        }, [bounds, scale, midPoint]);
        const handleLabelChange = React45.useCallback(
          (label2) => {
            var _a3;
            (_a3 = this.update) == null ? void 0 : _a3.call(this, { label: label2 });
          },
          [label]
        );
        return /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("div", __spreadProps(__spreadValues({}, events), {
          style: { width: "100%", height: "100%", overflow: "hidden" },
          className: "tl-box-container",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(TextLabel, {
              font,
              text: label,
              color: getComputedColor(stroke, "text"),
              offsetX: offset[0],
              offsetY: offset[1],
              fontSize,
              scale,
              isEditing,
              onChange: handleLabelChange,
              onBlur: onEditingEnd,
              fontStyle: italic ? "italic" : "normal",
              fontWeight,
              pointerEvents: !!label
            }),
            /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)(SVGContainer, {
              opacity: isErasing ? 0.2 : opacity,
              children: [
                isBinding && /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(BindingIndicator, {
                  mode: "svg",
                  strokeWidth,
                  size: [w2, h2]
                }),
                /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("rect", {
                  className: isSelected || !noFill ? "tl-hitarea-fill" : "tl-hitarea-stroke",
                  x: strokeWidth / 2,
                  y: strokeWidth / 2,
                  rx: borderRadius,
                  ry: borderRadius,
                  width: Math.max(0.01, w2 - strokeWidth),
                  height: Math.max(0.01, h2 - strokeWidth),
                  pointerEvents: "all"
                }),
                /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("rect", {
                  x: strokeWidth / 2,
                  y: strokeWidth / 2,
                  rx: borderRadius,
                  ry: borderRadius,
                  width: Math.max(0.01, w2 - strokeWidth),
                  height: Math.max(0.01, h2 - strokeWidth),
                  strokeWidth,
                  stroke: getComputedColor(stroke, "stroke"),
                  strokeDasharray: strokeType === "dashed" ? "8 2" : void 0,
                  fill: noFill ? "none" : getComputedColor(fill, "background")
                })
              ]
            })
          ]
        }));
      }
    ));
    __publicField(this, "setScaleLevel", (v2) => __async(this, null, function* () {
      this.update({
        scaleLevel: v2,
        fontSize: levelToScale[v2 != null ? v2 : "md"],
        strokeWidth: levelToScale[v2 != null ? v2 : "md"] / 10
      });
      this.onResetBounds();
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: {
          size: [w2, h2],
          borderRadius,
          isLocked
        }
      } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("g", {
        children: /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("rect", {
          width: w2,
          height: h2,
          rx: borderRadius,
          ry: borderRadius,
          fill: "transparent",
          strokeDasharray: isLocked ? "8 2" : void 0
        })
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.size !== void 0) {
        props.size[0] = Math.max(props.size[0], 1);
        props.size[1] = Math.max(props.size[1], 1);
      }
      if (props.borderRadius !== void 0)
        props.borderRadius = Math.max(0, props.borderRadius);
      return withClampedStyles(this, props);
    });
  }
  get scaleLevel() {
    var _a3;
    return (_a3 = this.props.scaleLevel) != null ? _a3 : "md";
  }
};
__publicField(BoxShape, "id", "box");
__publicField(BoxShape, "defaultProps", {
  id: "box",
  parentId: "page",
  type: "box",
  point: [0, 0],
  size: [100, 100],
  borderRadius: 2,
  stroke: "",
  fill: "",
  noFill: false,
  fontWeight: 400,
  fontSize: 20,
  italic: false,
  strokeType: "line",
  strokeWidth: 2,
  opacity: 1,
  label: ""
});
__decorateClass([
  computed
], BoxShape.prototype, "scaleLevel", 1);
__decorateClass([
  action
], BoxShape.prototype, "setScaleLevel", 2);

// src/lib/shapes/EllipseShape.tsx
var React46 = __toESM(require("react"));
var import_jsx_runtime54 = require("react/jsx-runtime");
var font2 = "18px / 1 var(--ls-font-family)";
var levelToScale2 = {
  xs: 10,
  sm: 16,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 60
};
var EllipseShape = class extends TLEllipseShape {
  constructor() {
    super(...arguments);
    __publicField(this, "canEdit", true);
    __publicField(this, "ReactComponent", observer(
      ({ isSelected, isErasing, events, isEditing, onEditingEnd }) => {
        const {
          size: [w2, h2],
          stroke,
          fill,
          noFill,
          strokeWidth,
          strokeType,
          opacity,
          label,
          italic,
          fontWeight,
          fontSize
        } = this.props;
        const labelSize = label || isEditing ? getTextLabelSize(
          label,
          { fontFamily: "var(--ls-font-family)", fontSize, lineHeight: 1, fontWeight },
          4
        ) : [0, 0];
        const midPoint = src_default.mul(this.props.size, 0.5);
        const scale = Math.max(0.5, Math.min(1, w2 / labelSize[0], h2 / labelSize[1]));
        const bounds = this.getBounds();
        const offset = React46.useMemo(() => {
          return src_default.sub(midPoint, src_default.toFixed([bounds.width / 2, bounds.height / 2]));
        }, [bounds, scale, midPoint]);
        const handleLabelChange = React46.useCallback(
          (label2) => {
            var _a3;
            (_a3 = this.update) == null ? void 0 : _a3.call(this, { label: label2 });
          },
          [label]
        );
        return /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("div", __spreadProps(__spreadValues({}, events), {
          style: { width: "100%", height: "100%", overflow: "hidden" },
          className: "tl-ellipse-container",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(TextLabel, {
              font: font2,
              text: label,
              color: getComputedColor(stroke, "text"),
              offsetX: offset[0],
              offsetY: offset[1],
              scale,
              isEditing,
              onChange: handleLabelChange,
              onBlur: onEditingEnd,
              fontStyle: italic ? "italic" : "normal",
              fontSize,
              fontWeight,
              pointerEvents: !!label
            }),
            /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)(SVGContainer, __spreadProps(__spreadValues({}, events), {
              opacity: isErasing ? 0.2 : opacity,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("ellipse", {
                  className: isSelected || !noFill ? "tl-hitarea-fill" : "tl-hitarea-stroke",
                  cx: w2 / 2,
                  cy: h2 / 2,
                  rx: Math.max(0.01, (w2 - strokeWidth) / 2),
                  ry: Math.max(0.01, (h2 - strokeWidth) / 2)
                }),
                /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("ellipse", {
                  cx: w2 / 2,
                  cy: h2 / 2,
                  rx: Math.max(0.01, (w2 - strokeWidth) / 2),
                  ry: Math.max(0.01, (h2 - strokeWidth) / 2),
                  strokeWidth,
                  stroke: getComputedColor(stroke, "stroke"),
                  strokeDasharray: strokeType === "dashed" ? "8 2" : void 0,
                  fill: noFill ? "none" : getComputedColor(fill, "background")
                })
              ]
            }))
          ]
        }));
      }
    ));
    __publicField(this, "setScaleLevel", (v2) => __async(this, null, function* () {
      this.update({
        scaleLevel: v2,
        fontSize: levelToScale2[v2 != null ? v2 : "md"],
        strokeWidth: levelToScale2[v2 != null ? v2 : "md"] / 10
      });
      this.onResetBounds();
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        size: [w2, h2],
        isLocked
      } = this.props;
      return /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("g", {
        children: /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("ellipse", {
          cx: w2 / 2,
          cy: h2 / 2,
          rx: w2 / 2,
          ry: h2 / 2,
          strokeWidth: 2,
          fill: "transparent",
          strokeDasharray: isLocked ? "8 2" : "undefined"
        })
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.size !== void 0) {
        props.size[0] = Math.max(props.size[0], 1);
        props.size[1] = Math.max(props.size[1], 1);
      }
      return withClampedStyles(this, props);
    });
  }
  get scaleLevel() {
    var _a3;
    return (_a3 = this.props.scaleLevel) != null ? _a3 : "md";
  }
  getShapeSVGJsx(opts) {
    const {
      size: [w2, h2],
      stroke,
      fill,
      noFill,
      strokeWidth,
      strokeType,
      opacity
    } = this.props;
    return /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("g", {
      opacity,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("ellipse", {
          className: !noFill ? "tl-hitarea-fill" : "tl-hitarea-stroke",
          cx: w2 / 2,
          cy: h2 / 2,
          rx: Math.max(0.01, (w2 - strokeWidth) / 2),
          ry: Math.max(0.01, (h2 - strokeWidth) / 2)
        }),
        /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("ellipse", {
          cx: w2 / 2,
          cy: h2 / 2,
          rx: Math.max(0.01, (w2 - strokeWidth) / 2),
          ry: Math.max(0.01, (h2 - strokeWidth) / 2),
          strokeWidth,
          stroke: getComputedColor(stroke, "stroke"),
          strokeDasharray: strokeType === "dashed" ? "8 2" : void 0,
          fill: noFill ? "none" : getComputedColor(fill, "background")
        })
      ]
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
  stroke: "",
  fill: "",
  noFill: false,
  fontWeight: 400,
  fontSize: 20,
  italic: false,
  strokeType: "line",
  strokeWidth: 2,
  opacity: 1,
  label: ""
});
__decorateClass([
  computed
], EllipseShape.prototype, "scaleLevel", 1);
__decorateClass([
  action
], EllipseShape.prototype, "setScaleLevel", 2);

// src/lib/shapes/GroupShape.tsx
var import_jsx_runtime55 = require("react/jsx-runtime");
var GroupShape = class extends TLGroupShape {
  constructor() {
    super(...arguments);
    __publicField(this, "ReactComponent", observer(({ events }) => {
      const strokeWidth = 2;
      const bounds = this.getBounds();
      const app = useApp();
      const childSelected = app.selectedShapesArray.some((s2) => {
        return app.shapesInGroups([this]).includes(s2);
      });
      const Indicator2 = this.ReactIndicator;
      return /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)(SVGContainer, __spreadProps(__spreadValues({}, events), {
        className: "tl-group-container",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("rect", {
            className: "tl-hitarea-fill",
            x: strokeWidth / 2,
            y: strokeWidth / 2,
            width: Math.max(0.01, bounds.width - strokeWidth),
            height: Math.max(0.01, bounds.height - strokeWidth),
            pointerEvents: "all"
          }),
          childSelected && /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("g", {
            stroke: "var(--color-selectedFill)",
            children: /* @__PURE__ */ (0, import_jsx_runtime55.jsx)(Indicator2, {})
          })
        ]
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const bounds = this.getBounds();
      return /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("rect", {
        strokeDasharray: "8 2",
        x: -GROUP_PADDING,
        y: -GROUP_PADDING,
        rx: GROUP_PADDING / 2,
        ry: GROUP_PADDING / 2,
        width: bounds.width + GROUP_PADDING * 2,
        height: bounds.height + GROUP_PADDING * 2,
        fill: "transparent"
      });
    }));
  }
};
__publicField(GroupShape, "id", "group");
__publicField(GroupShape, "defaultProps", {
  id: "group",
  type: "group",
  parentId: "page",
  point: [0, 0],
  size: [0, 0],
  children: []
});

// src/lib/shapes/HighlighterShape.tsx
var import_jsx_runtime56 = require("react/jsx-runtime");
var levelToScale3 = {
  xs: 1,
  sm: 1.6,
  md: 2,
  lg: 3.2,
  xl: 4.8,
  xxl: 6
};
var HighlighterShape = class extends TLDrawShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "ReactComponent", observer(({ events, isErasing }) => {
      const {
        pointsPath,
        props: { stroke, strokeWidth, opacity }
      } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(SVGContainer, __spreadProps(__spreadValues({}, events), {
        opacity: isErasing ? 0.2 : 1,
        children: /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("path", {
          d: pointsPath,
          strokeWidth: strokeWidth * 16,
          stroke: getComputedColor(stroke, "stroke"),
          fill: "none",
          pointerEvents: "all",
          strokeLinejoin: "round",
          strokeLinecap: "round",
          opacity
        })
      }));
    }));
    __publicField(this, "setScaleLevel", (v2) => __async(this, null, function* () {
      this.update({
        scaleLevel: v2,
        strokeWidth: levelToScale3[v2 != null ? v2 : "md"]
      });
      this.onResetBounds();
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const { pointsPath, props } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("path", {
        d: pointsPath,
        fill: "none",
        strokeDasharray: props.isLocked ? "8 2" : "undefined"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      props = withClampedStyles(this, props);
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
  get scaleLevel() {
    var _a3;
    return (_a3 = this.props.scaleLevel) != null ? _a3 : "md";
  }
  getShapeSVGJsx() {
    const {
      pointsPath,
      props: { stroke, strokeWidth, opacity }
    } = this;
    return /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("path", {
      d: pointsPath,
      strokeWidth: strokeWidth * 16,
      stroke: getComputedColor(stroke, "stroke"),
      fill: "none",
      pointerEvents: "all",
      strokeLinejoin: "round",
      strokeLinecap: "round",
      opacity
    });
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
  stroke: "",
  fill: "",
  noFill: true,
  strokeType: "line",
  strokeWidth: 2,
  opacity: 0.5
});
__decorateClass([
  computed
], HighlighterShape.prototype, "pointsPath", 1);
__decorateClass([
  computed
], HighlighterShape.prototype, "scaleLevel", 1);
__decorateClass([
  action
], HighlighterShape.prototype, "setScaleLevel", 2);

// src/lib/shapes/HTMLShape.tsx
var React47 = __toESM(require("react"));

// src/hooks/useCameraMoving.ts
function useCameraMovingRef() {
  const app = useApp();
  return app.inputs.state === "panning" || app.inputs.state === "pinching";
}

// src/lib/shapes/HTMLShape.tsx
var import_jsx_runtime57 = require("react/jsx-runtime");
var levelToScale4 = {
  xs: 0.5,
  sm: 0.8,
  md: 1,
  lg: 1.5,
  xl: 2,
  xxl: 3
};
var HTMLShape = class extends TLBoxShape {
  constructor() {
    super(...arguments);
    __publicField(this, "canChangeAspectRatio", true);
    __publicField(this, "canFlip", false);
    __publicField(this, "canEdit", true);
    __publicField(this, "htmlAnchorRef", React47.createRef());
    __publicField(this, "setScaleLevel", (v2) => __async(this, null, function* () {
      var _a3;
      const newSize = src_default.mul(
        this.props.size,
        levelToScale4[v2 != null ? v2 : "md"] / levelToScale4[(_a3 = this.props.scaleLevel) != null ? _a3 : "md"]
      );
      this.update({
        scaleLevel: v2
      });
      yield delay();
      this.update({
        size: newSize
      });
    }));
    __publicField(this, "onResetBounds", (info) => {
      var _a3;
      if (this.htmlAnchorRef.current) {
        const rect = this.htmlAnchorRef.current.getBoundingClientRect();
        const [w2, h2] = src_default.div([rect.width, rect.height], (_a3 = info == null ? void 0 : info.zoom) != null ? _a3 : 1);
        const clamp3 = (v2) => Math.max(Math.min(v2 || 400, 1400), 10);
        this.update({
          size: [clamp3(w2), clamp3(h2)]
        });
      }
      return this;
    });
    __publicField(this, "ReactComponent", observer(({ events, isErasing, isEditing }) => {
      const {
        props: { html, scaleLevel }
      } = this;
      const isMoving = useCameraMovingRef();
      const app = useApp();
      const isSelected = app.selectedIds.has(this.id);
      const tlEventsEnabled = isMoving || isSelected && !isEditing || app.selectedTool.id !== "select";
      const stop2 = React47.useCallback(
        (e) => {
          if (!tlEventsEnabled) {
            e.stopPropagation();
          }
        },
        [tlEventsEnabled]
      );
      const scaleRatio = levelToScale4[scaleLevel != null ? scaleLevel : "md"];
      React47.useEffect(() => {
        if (this.props.size[1] === 0) {
          this.onResetBounds({ zoom: app.viewport.camera.zoom });
          app.persist();
        }
      }, []);
      return /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(HTMLContainer, __spreadProps(__spreadValues({
        style: {
          overflow: "hidden",
          pointerEvents: "all",
          opacity: isErasing ? 0.2 : 1
        }
      }, events), {
        children: /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("div", {
          onWheelCapture: stop2,
          onPointerDown: stop2,
          onPointerUp: stop2,
          className: "tl-html-container",
          style: {
            pointerEvents: !isMoving && (isEditing || isSelected) ? "all" : "none",
            overflow: isEditing ? "auto" : "hidden",
            width: `calc(100% / ${scaleRatio})`,
            height: `calc(100% / ${scaleRatio})`,
            transform: `scale(${scaleRatio})`
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("div", {
            ref: this.htmlAnchorRef,
            className: "tl-html-anchor",
            dangerouslySetInnerHTML: { __html: html.trim() }
          })
        })
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: {
          size: [w2, h2],
          isLocked
        }
      } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("rect", {
        width: w2,
        height: h2,
        fill: "transparent",
        strokeDasharray: isLocked ? "8 2" : "undefined"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.size !== void 0) {
        props.size[0] = Math.max(props.size[0], 1);
        props.size[1] = Math.max(props.size[1], 1);
      }
      return withClampedStyles(this, props);
    });
  }
  get scaleLevel() {
    var _a3;
    return (_a3 = this.props.scaleLevel) != null ? _a3 : "md";
  }
};
__publicField(HTMLShape, "id", "html");
__publicField(HTMLShape, "defaultProps", {
  id: "html",
  type: "html",
  parentId: "page",
  point: [0, 0],
  size: [600, 0],
  html: ""
});
__decorateClass([
  computed
], HTMLShape.prototype, "scaleLevel", 1);
__decorateClass([
  action
], HTMLShape.prototype, "setScaleLevel", 2);

// src/lib/shapes/IFrameShape.tsx
var React48 = __toESM(require("react"));
var import_jsx_runtime58 = require("react/jsx-runtime");
var IFrameShape = class extends TLBoxShape {
  constructor() {
    super(...arguments);
    __publicField(this, "frameRef", React48.createRef());
    __publicField(this, "canEdit", true);
    __publicField(this, "onIFrameSourceChange", (url) => {
      this.update({ url });
    });
    __publicField(this, "reload", () => {
      var _a3, _b;
      if (this.frameRef.current) {
        this.frameRef.current.src = (_b = (_a3 = this.frameRef) == null ? void 0 : _a3.current) == null ? void 0 : _b.src;
      }
    });
    __publicField(this, "ReactComponent", observer(({ events, isErasing, isEditing }) => {
      const ref = React48.useRef(null);
      const app = useApp();
      return /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(HTMLContainer, __spreadProps(__spreadValues({
        style: {
          overflow: "hidden",
          pointerEvents: "all",
          opacity: isErasing ? 0.2 : 1
        }
      }, events), {
        children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("div", {
          className: "tl-iframe-container",
          style: {
            pointerEvents: isEditing || app.readOnly ? "all" : "none",
            userSelect: "none"
          },
          children: this.props.url && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("div", {
            style: {
              overflow: "hidden",
              position: "relative",
              height: "100%"
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("iframe", {
              ref: this.frameRef,
              className: "absolute inset-0 w-full h-full m-0",
              width: "100%",
              height: "100%",
              src: `${this.props.url}`,
              frameBorder: "0",
              sandbox: "allow-scripts allow-same-origin allow-presentation"
            })
          })
        })
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: {
          size: [w2, h2],
          isLocked
        }
      } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("rect", {
        width: w2,
        height: h2,
        fill: "transparent",
        rx: 8,
        ry: 8,
        strokeDasharray: isLocked ? "8 2" : "undefined"
      });
    }));
  }
};
__publicField(IFrameShape, "id", "iframe");
__publicField(IFrameShape, "defaultProps", {
  id: "iframe",
  type: "iframe",
  parentId: "page",
  point: [0, 0],
  size: [853, 480],
  url: ""
});
__decorateClass([
  action
], IFrameShape.prototype, "onIFrameSourceChange", 2);
__decorateClass([
  action
], IFrameShape.prototype, "reload", 2);

// src/lib/shapes/ImageShape.tsx
var React49 = __toESM(require("react"));
var import_jsx_runtime59 = require("react/jsx-runtime");
var ImageShape = class extends TLImageShape {
  constructor() {
    super(...arguments);
    __publicField(this, "ReactComponent", observer(({ events, isErasing, isBinding, asset }) => {
      const {
        props: {
          opacity,
          objectFit,
          clipping,
          size: [w2, h2]
        }
      } = this;
      const [t, r2, b3, l3] = Array.isArray(clipping) ? clipping : [clipping, clipping, clipping, clipping];
      const { handlers } = React49.useContext(LogseqContext);
      return /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)(HTMLContainer, __spreadProps(__spreadValues({}, events), {
        opacity: isErasing ? 0.2 : opacity,
        children: [
          isBinding && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(BindingIndicator, {
            mode: "html",
            strokeWidth: 4,
            size: [w2, h2]
          }),
          /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("div", {
            "data-asset-loaded": !!asset,
            className: "tl-image-shape-container",
            children: asset ? /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("img", {
              src: handlers ? handlers.makeAssetUrl(asset.src) : asset.src,
              draggable: false,
              style: {
                position: "relative",
                top: -t,
                left: -l3,
                width: w2 + (l3 - r2),
                height: h2 + (t - b3),
                objectFit
              }
            }) : "Asset is missing"
          })
        ]
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: {
          size: [w2, h2],
          isLocked
        }
      } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("rect", {
        width: w2,
        height: h2,
        fill: "transparent",
        strokeDasharray: isLocked ? "8 2" : "undefined"
      });
    }));
  }
  getShapeSVGJsx({ assets }) {
    var _a3, _b;
    const bounds = this.getBounds();
    const {
      assetId,
      clipping,
      size: [w2, h2]
    } = this.props;
    const asset = assets.find((ass) => ass.id === assetId);
    if (asset) {
      const [t, r2, b3, l3] = Array.isArray(clipping) ? clipping : [clipping, clipping, clipping, clipping];
      const make_asset_url = (_b = (_a3 = window.logseq) == null ? void 0 : _a3.api) == null ? void 0 : _b.make_asset_url;
      return /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("image", {
        width: bounds.width,
        height: bounds.height,
        href: make_asset_url ? make_asset_url(asset.src) : asset.src
      });
    } else {
      return super.getShapeSVGJsx({});
    }
  }
};
__publicField(ImageShape, "id", "image");
__publicField(ImageShape, "defaultProps", {
  id: "image1",
  parentId: "page",
  type: "image",
  point: [0, 0],
  size: [100, 100],
  opacity: 1,
  assetId: "",
  clipping: 0,
  objectFit: "fill",
  isAspectRatioLocked: true
});

// src/lib/shapes/LineShape.tsx
var React51 = __toESM(require("react"));

// src/lib/shapes/arrow/Arrow.tsx
var React50 = __toESM(require("react"));

// src/lib/shapes/arrow/ArrowHead.tsx
var import_jsx_runtime60 = require("react/jsx-runtime");
function Arrowhead({ left, middle, right, stroke, strokeWidth }) {
  return /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("g", {
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("path", {
        className: "tl-stroke-hitarea",
        d: `M ${left} L ${middle} ${right}`
      }),
      /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("path", {
        d: `M ${left} L ${middle} ${right}`,
        fill: "none",
        stroke,
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        pointerEvents: "none"
      })
    ]
  });
}

// src/lib/shapes/arrow/arrowHelpers.ts
function getStraightArrowHeadPoints(A3, B3, r2) {
  const ints = intersectCircleLineSegment(A3, r2, A3, B3).points;
  if (!ints) {
    console.warn("Could not find an intersection for the arrow head.");
    return { left: A3, right: A3 };
  }
  const int = ints[0];
  const left = int ? src_default.rotWith(int, A3, Math.PI / 6) : A3;
  const right = int ? src_default.rotWith(int, A3, -Math.PI / 6) : A3;
  return { left, right };
}
function getStraightArrowHeadPath(A3, B3, r2) {
  const { left, right } = getStraightArrowHeadPoints(A3, B3, r2);
  return `M ${left} L ${A3} ${right}`;
}
function getArrowPath(style, start, end, decorationStart, decorationEnd) {
  const strokeWidth = style.strokeWidth;
  const arrowDist = src_default.dist(start, end);
  const arrowHeadLength = Math.min(arrowDist / 3, strokeWidth * 16);
  const path = [];
  path.push(`M ${start} L ${end}`);
  if (decorationStart) {
    path.push(getStraightArrowHeadPath(start, end, arrowHeadLength));
  }
  if (decorationEnd) {
    path.push(getStraightArrowHeadPath(end, start, arrowHeadLength));
  }
  return path.join(" ");
}

// src/lib/shapes/arrow/Arrow.tsx
var import_jsx_runtime61 = require("react/jsx-runtime");
var levelToScale5 = {
  xs: 10,
  sm: 16,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 60
};
var Arrow = React50.memo(function StraightArrow({
  style,
  start,
  end,
  decorationStart,
  decorationEnd,
  scaleLevel
}) {
  const arrowDist = src_default.dist(start, end);
  if (arrowDist < 2)
    return null;
  const { strokeWidth } = style;
  const sw = 1 + strokeWidth * levelToScale5[scaleLevel != null ? scaleLevel : "md"] / 10;
  const path = "M" + src_default.toFixed(start) + "L" + src_default.toFixed(end);
  const arrowHeadLength = Math.min(arrowDist / 3, strokeWidth * levelToScale5[scaleLevel != null ? scaleLevel : "md"]);
  const startArrowHead = decorationStart ? getStraightArrowHeadPoints(start, end, arrowHeadLength) : null;
  const endArrowHead = decorationEnd ? getStraightArrowHeadPoints(end, start, arrowHeadLength) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)(import_jsx_runtime61.Fragment, {
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("path", {
        className: "tl-stroke-hitarea",
        d: path
      }),
      /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("path", {
        d: path,
        strokeWidth: sw,
        stroke: style.stroke,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeDasharray: style.strokeType === "dashed" ? "8 4" : void 0,
        pointerEvents: "stroke"
      }),
      startArrowHead && /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(Arrowhead, {
        left: startArrowHead.left,
        middle: start,
        right: startArrowHead.right,
        stroke: style.stroke,
        strokeWidth: sw
      }),
      endArrowHead && /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(Arrowhead, {
        left: endArrowHead.left,
        middle: end,
        right: endArrowHead.right,
        stroke: style.stroke,
        strokeWidth: sw
      })
    ]
  });
});

// src/lib/shapes/text/LabelMask.tsx
var import_jsx_runtime62 = require("react/jsx-runtime");
function LabelMask({ id: id3, bounds, labelSize, offset, scale = 1 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("defs", {
    children: /* @__PURE__ */ (0, import_jsx_runtime62.jsxs)("mask", {
      id: id3 + "_clip",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("rect", {
          x: -100,
          y: -100,
          width: bounds.width + 200,
          height: bounds.height + 200,
          fill: "white"
        }),
        /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("rect", {
          x: bounds.width / 2 - labelSize[0] / 2 * scale + ((offset == null ? void 0 : offset[0]) || 0),
          y: bounds.height / 2 - labelSize[1] / 2 * scale + ((offset == null ? void 0 : offset[1]) || 0),
          width: labelSize[0] * scale,
          height: labelSize[1] * scale,
          rx: 4 * scale,
          ry: 4 * scale,
          fill: "black"
        })
      ]
    })
  });
}

// src/lib/shapes/LineShape.tsx
var import_jsx_runtime63 = require("react/jsx-runtime");
var font3 = "20px / 1 var(--ls-font-family)";
var levelToScale6 = {
  xs: 10,
  sm: 16,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 60
};
var LineShape = class extends TLLineShape {
  constructor() {
    super(...arguments);
    __publicField(this, "hideSelection", true);
    __publicField(this, "canEdit", true);
    __publicField(this, "ReactComponent", observer(({ events, isErasing, isEditing, onEditingEnd }) => {
      const {
        stroke,
        handles: { start, end },
        opacity,
        label,
        italic,
        fontWeight,
        fontSize,
        id: id3
      } = this.props;
      const labelSize = label || isEditing ? getTextLabelSize(
        label || "Enter text",
        { fontFamily: "var(--ls-font-family)", fontSize, lineHeight: 1, fontWeight },
        6
      ) : [0, 0];
      const midPoint = src_default.med(start.point, end.point);
      const dist = src_default.dist(start.point, end.point);
      const scale = Math.max(
        0.5,
        Math.min(1, Math.max(dist / (labelSize[1] + 128), dist / (labelSize[0] + 128)))
      );
      const bounds = this.getBounds();
      const offset = React51.useMemo(() => {
        return src_default.sub(midPoint, src_default.toFixed([bounds.width / 2, bounds.height / 2]));
      }, [bounds, scale, midPoint]);
      const handleLabelChange = React51.useCallback(
        (label2) => {
          var _a3;
          (_a3 = this.update) == null ? void 0 : _a3.call(this, { label: label2 });
        },
        [label]
      );
      return /* @__PURE__ */ (0, import_jsx_runtime63.jsxs)("div", __spreadProps(__spreadValues({}, events), {
        style: { width: "100%", height: "100%", overflow: "hidden" },
        className: "tl-line-container",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime63.jsx)(TextLabel, {
            font: font3,
            text: label,
            fontSize,
            color: getComputedColor(stroke, "text"),
            offsetX: offset[0],
            offsetY: offset[1],
            scale,
            isEditing,
            onChange: handleLabelChange,
            onBlur: onEditingEnd,
            fontStyle: italic ? "italic" : "normal",
            fontWeight,
            pointerEvents: !!label
          }),
          /* @__PURE__ */ (0, import_jsx_runtime63.jsxs)(SVGContainer, {
            opacity: isErasing ? 0.2 : opacity,
            id: id3 + "_svg",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime63.jsx)(LabelMask, {
                id: id3,
                bounds,
                labelSize,
                offset,
                scale
              }),
              /* @__PURE__ */ (0, import_jsx_runtime63.jsx)("g", {
                pointerEvents: "none",
                mask: label || isEditing ? `url(#${id3}_clip)` : ``,
                children: this.getShapeSVGJsx({ preview: false })
              })
            ]
          })
        ]
      }));
    }));
    __publicField(this, "setScaleLevel", (v2) => __async(this, null, function* () {
      this.update({
        scaleLevel: v2,
        fontSize: levelToScale6[v2 != null ? v2 : "md"]
      });
      this.onResetBounds();
    }));
    __publicField(this, "ReactIndicator", observer(({ isEditing }) => {
      const {
        id: id3,
        decorations,
        label,
        strokeWidth,
        fontSize,
        fontWeight,
        handles: { start, end },
        isLocked
      } = this.props;
      const bounds = this.getBounds();
      const labelSize = label || isEditing ? getTextLabelSize(
        label,
        { fontFamily: "var(--ls-font-family)", fontSize, lineHeight: 1, fontWeight },
        6
      ) : [0, 0];
      const midPoint = src_default.med(start.point, end.point);
      const dist = src_default.dist(start.point, end.point);
      const scale = Math.max(
        0.5,
        Math.min(1, Math.max(dist / (labelSize[1] + 128), dist / (labelSize[0] + 128)))
      );
      const offset = React51.useMemo(() => {
        return src_default.sub(midPoint, src_default.toFixed([bounds.width / 2, bounds.height / 2]));
      }, [bounds, scale, midPoint]);
      return /* @__PURE__ */ (0, import_jsx_runtime63.jsxs)("g", {
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime63.jsx)("path", {
            mask: label ? `url(#${id3}_clip)` : ``,
            d: getArrowPath(
              { strokeWidth },
              start.point,
              end.point,
              decorations == null ? void 0 : decorations.start,
              decorations == null ? void 0 : decorations.end
            ),
            strokeDasharray: isLocked ? "8 2" : "undefined"
          }),
          label && !isEditing && /* @__PURE__ */ (0, import_jsx_runtime63.jsx)("rect", {
            x: bounds.width / 2 - labelSize[0] / 2 * scale + offset[0],
            y: bounds.height / 2 - labelSize[1] / 2 * scale + offset[1],
            width: labelSize[0] * scale,
            height: labelSize[1] * scale,
            rx: 4 * scale,
            ry: 4 * scale,
            fill: "transparent"
          })
        ]
      });
    }));
    __publicField(this, "validateProps", (props) => {
      return withClampedStyles(this, props);
    });
  }
  get scaleLevel() {
    var _a3;
    return (_a3 = this.props.scaleLevel) != null ? _a3 : "md";
  }
  getShapeSVGJsx({ preview }) {
    const {
      stroke,
      fill,
      strokeWidth,
      strokeType,
      decorations,
      label,
      scaleLevel,
      handles: { start, end }
    } = this.props;
    const midPoint = src_default.med(start.point, end.point);
    return /* @__PURE__ */ (0, import_jsx_runtime63.jsxs)(import_jsx_runtime63.Fragment, {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime63.jsx)(Arrow, {
          style: {
            stroke: getComputedColor(stroke, "text"),
            fill,
            strokeWidth,
            strokeType
          },
          scaleLevel,
          start: start.point,
          end: end.point,
          decorationStart: decorations == null ? void 0 : decorations.start,
          decorationEnd: decorations == null ? void 0 : decorations.end
        }),
        preview && /* @__PURE__ */ (0, import_jsx_runtime63.jsx)(import_jsx_runtime63.Fragment, {
          children: /* @__PURE__ */ (0, import_jsx_runtime63.jsx)("text", {
            style: {
              transformOrigin: "top left"
            },
            fontFamily: "Inter",
            fontSize: 20,
            transform: `translate(${midPoint[0]}, ${midPoint[1]})`,
            textAnchor: "middle",
            fill: getComputedColor(stroke, "text"),
            stroke: getComputedColor(stroke, "text"),
            children: label
          })
        })
      ]
    });
  }
};
__publicField(LineShape, "id", "line");
__publicField(LineShape, "defaultProps", {
  id: "line",
  parentId: "page",
  type: "line",
  point: [0, 0],
  handles: {
    start: { id: "start", canBind: true, point: [0, 0] },
    end: { id: "end", canBind: true, point: [1, 1] }
  },
  stroke: "",
  fill: "",
  noFill: true,
  fontWeight: 400,
  fontSize: 20,
  italic: false,
  strokeType: "line",
  strokeWidth: 1,
  opacity: 1,
  decorations: {
    end: "arrow" /* Arrow */
  },
  label: ""
});
__decorateClass([
  computed
], LineShape.prototype, "scaleLevel", 1);
__decorateClass([
  action
], LineShape.prototype, "setScaleLevel", 2);

// src/lib/shapes/LogseqPortalShape.tsx
var React52 = __toESM(require("react"));
var import_jsx_runtime64 = require("react/jsx-runtime");
var HEADER_HEIGHT = 40;
var AUTO_RESIZE_THRESHOLD = 1;
var levelToScale7 = {
  xs: 0.5,
  sm: 0.8,
  md: 1,
  lg: 1.5,
  xl: 2,
  xxl: 3
};
var LogseqPortalShapeHeader = observer(
  ({
    type,
    fill,
    opacity,
    children
  }) => {
    const bgColor = fill !== "var(--ls-secondary-background-color)" ? getComputedColor(fill, "background") : "var(--ls-tertiary-background-color)";
    const fillGradient = fill && fill !== "var(--ls-secondary-background-color)" ? isBuiltInColor(fill) ? `var(--ls-highlight-color-${fill})` : fill : "var(--ls-secondary-background-color)";
    return /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("div", {
      className: `tl-logseq-portal-header tl-logseq-portal-header-${type === "P" ? "page" : "block"}`,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("div", {
          className: "absolute inset-0 tl-logseq-portal-header-bg",
          style: {
            opacity,
            background: type === "P" ? bgColor : `linear-gradient(0deg, ${fillGradient}, ${bgColor})`
          }
        }),
        /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("div", {
          className: "relative",
          children
        })
      ]
    });
  }
);
var LogseqPortalShape = class extends TLBoxShape {
  constructor(props = {}) {
    var _a3;
    super(props);
    __publicField(this, "hideRotateHandle", true);
    __publicField(this, "canChangeAspectRatio", true);
    __publicField(this, "canFlip", true);
    __publicField(this, "canEdit", true);
    __publicField(this, "persist", null);
    __publicField(this, "initialHeightCalculated", true);
    __publicField(this, "getInnerHeight", null);
    __publicField(this, "setCollapsed", (collapsed) => __async(this, null, function* () {
      var _a3;
      if (this.props.blockType === "B") {
        this.update({ compact: collapsed });
        this.canResize[1] = !collapsed;
        if (!collapsed) {
          this.onResetBounds();
        }
      } else {
        const originalHeight = this.props.size[1];
        this.canResize[1] = !collapsed;
        this.update({
          isAutoResizing: !collapsed,
          collapsed,
          size: [this.props.size[0], collapsed ? this.getHeaderHeight() : this.props.collapsedHeight],
          collapsedHeight: collapsed ? originalHeight : this.props.collapsedHeight
        });
      }
      (_a3 = this.persist) == null ? void 0 : _a3.call(this);
    }));
    __publicField(this, "setScaleLevel", (v2) => __async(this, null, function* () {
      var _a3;
      const newSize = src_default.mul(
        this.props.size,
        levelToScale7[v2 != null ? v2 : "md"] / levelToScale7[(_a3 = this.props.scaleLevel) != null ? _a3 : "md"]
      );
      this.update({
        scaleLevel: v2
      });
      yield delay();
      this.update({
        size: newSize
      });
    }));
    __publicField(this, "onResetBounds", (info) => {
      const height = this.getAutoResizeHeight();
      if (height !== null && Math.abs(height - this.props.size[1]) > AUTO_RESIZE_THRESHOLD) {
        this.update({
          size: [this.props.size[0], height]
        });
        this.initialHeightCalculated = true;
      }
      return this;
    });
    __publicField(this, "onResize", (initialProps, info) => {
      var _a3;
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
      let height = bounds.height;
      if (this.props.isAutoResizing) {
        height = (_a3 = this.getAutoResizeHeight()) != null ? _a3 : height;
      }
      return this.update({
        point: [bounds.minX, bounds.minY],
        size: [Math.max(1, bounds.width), Math.max(1, height)],
        scale: nextScale,
        rotation
      });
    });
    __publicField(this, "PortalComponent", observer(({}) => {
      const {
        props: { pageId, fill, opacity }
      } = this;
      const { renderers } = React52.useContext(LogseqContext);
      const app = useApp();
      const cpRefContainer = React52.useRef(null);
      const [, innerHeight] = this.useComponentSize(
        cpRefContainer,
        this.props.compact ? ".tl-logseq-cp-container > .single-block" : ".tl-logseq-cp-container > .page"
      );
      if (!(renderers == null ? void 0 : renderers.Page)) {
        return null;
      }
      const { Page, Block } = renderers;
      const [loaded, setLoaded] = React52.useState(false);
      React52.useEffect(() => {
        var _a3, _b;
        if (this.props.isAutoResizing) {
          const latestInnerHeight = (_b = (_a3 = this.getInnerHeight) == null ? void 0 : _a3.call(this)) != null ? _b : innerHeight;
          const newHeight = latestInnerHeight + this.getHeaderHeight();
          if (innerHeight && Math.abs(newHeight - this.props.size[1]) > AUTO_RESIZE_THRESHOLD) {
            this.update({
              size: [this.props.size[0], newHeight]
            });
            if (loaded)
              app.persist({});
          }
        }
      }, [innerHeight, this.props.isAutoResizing]);
      React52.useEffect(() => {
        if (!this.initialHeightCalculated) {
          setTimeout(() => {
            this.onResetBounds();
            app.persist({});
          });
        }
      }, [this.initialHeightCalculated]);
      React52.useEffect(() => {
        setTimeout(function() {
          setLoaded(true);
        });
      }, []);
      return /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)(import_jsx_runtime64.Fragment, {
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("div", {
            className: "absolute inset-0 tl-logseq-cp-container-bg",
            style: {
              textRendering: app.viewport.camera.zoom < 0.5 ? "optimizeSpeed" : "auto",
              background: fill && fill !== "var(--ls-secondary-background-color)" ? isBuiltInColor(fill) ? `var(--ls-highlight-color-${fill})` : fill : "var(--ls-secondary-background-color)",
              opacity
            }
          }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("div", {
            ref: cpRefContainer,
            className: "relative tl-logseq-cp-container",
            style: { overflow: this.props.isAutoResizing ? "visible" : "auto" },
            children: (loaded || !this.initialHeightCalculated) && (this.props.blockType === "B" && this.props.compact ? /* @__PURE__ */ (0, import_jsx_runtime64.jsx)(Block, {
              blockId: pageId
            }) : /* @__PURE__ */ (0, import_jsx_runtime64.jsx)(Page, {
              pageName: pageId
            }))
          })
        ]
      });
    }));
    __publicField(this, "ReactComponent", observer((componentProps) => {
      var _a3;
      const { events, isErasing, isEditing, isBinding } = componentProps;
      const {
        props: { opacity, pageId, fill, scaleLevel, strokeWidth, size, isLocked }
      } = this;
      const app = useApp();
      const { renderers, handlers } = React52.useContext(LogseqContext);
      this.persist = () => app.persist();
      const isMoving = useCameraMovingRef();
      const isSelected = app.selectedIds.has(this.id) && app.selectedIds.size === 1;
      const isCreating = app.isIn("logseq-portal.creating") && !pageId;
      const tlEventsEnabled = (isMoving || isSelected && !isEditing || app.selectedTool.id !== "select") && !isCreating;
      const stop2 = React52.useCallback(
        (e) => {
          if (!tlEventsEnabled) {
            e.stopPropagation();
          }
        },
        [tlEventsEnabled]
      );
      const portalSelected = app.selectedShapesArray.length === 1 && app.selectedShapesArray.some(
        (shape) => shape.type === "logseq-portal" && shape.props.id !== this.props.id && pageId && shape.props["pageId"] === pageId
      );
      const scaleRatio = levelToScale7[scaleLevel != null ? scaleLevel : "md"];
      React52.useEffect(() => {
        if (this.props.collapsed && isEditing) {
          this.update({
            size: [this.props.size[0], this.props.collapsedHeight]
          });
          return () => {
            this.update({
              size: [this.props.size[0], this.getHeaderHeight()]
            });
          };
        }
        return () => {
        };
      }, [isEditing, this.props.collapsed]);
      React52.useEffect(() => {
        if (isCreating) {
          const screenSize = [app.viewport.bounds.width, app.viewport.bounds.height];
          const boundScreenCenter = app.viewport.getScreenPoint([this.bounds.minX, this.bounds.minY]);
          if (boundScreenCenter[0] > screenSize[0] - 400 || boundScreenCenter[1] > screenSize[1] - 240 || app.viewport.camera.zoom > 1.5 || app.viewport.camera.zoom < 0.5) {
            app.viewport.zoomToBounds(__spreadProps(__spreadValues({}, this.bounds), { minY: this.bounds.maxY + 25 }));
          }
        }
      }, [app.viewport.bounds.height.toFixed(2)]);
      const onPageNameChanged = React52.useCallback((id3, isPage) => {
        this.initialHeightCalculated = false;
        const blockType = isPage ? "P" : "B";
        const height = isPage ? 320 : 40;
        this.update({
          pageId: id3,
          size: [400, height],
          blockType,
          compact: blockType === "B"
        });
        app.selectTool("select");
        app.history.resume();
        app.history.persist();
      }, []);
      const PortalComponent = this.PortalComponent;
      const blockContent = React52.useMemo(() => {
        var _a4;
        if (pageId && this.props.blockType === "B") {
          return (_a4 = handlers == null ? void 0 : handlers.queryBlockByUUID(pageId)) == null ? void 0 : _a4.title;
        }
      }, [handlers == null ? void 0 : handlers.queryBlockByUUID, pageId]);
      const targetNotFound = this.props.blockType === "B" && typeof blockContent !== "string";
      const showingPortal = (!this.props.collapsed || isEditing) && !targetNotFound;
      if (!(renderers == null ? void 0 : renderers.Page)) {
        return null;
      }
      const { Breadcrumb, PageName } = renderers;
      const portalStyle = {
        width: `calc(100% / ${scaleRatio})`,
        height: `calc(100% / ${scaleRatio})`,
        opacity: isErasing ? 0.2 : 1
      };
      if (scaleRatio !== 1) {
        portalStyle.transform = `scale(${scaleRatio})`;
      }
      return /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)(HTMLContainer, __spreadProps(__spreadValues({
        style: {
          pointerEvents: "all"
        }
      }, events), {
        children: [
          isBinding && /* @__PURE__ */ (0, import_jsx_runtime64.jsx)(BindingIndicator, {
            mode: "html",
            strokeWidth,
            size
          }),
          /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("div", {
            "data-inner-events": !tlEventsEnabled,
            onWheelCapture: stop2,
            onPointerDown: stop2,
            onPointerUp: stop2,
            style: {
              width: "100%",
              height: "100%",
              pointerEvents: !isMoving && (isEditing || isSelected) ? "all" : "none"
            },
            children: isCreating ? /* @__PURE__ */ (0, import_jsx_runtime64.jsx)(LogseqQuickSearch, {
              onChange: onPageNameChanged,
              onAddBlock: (uuid) => {
                setTimeout(() => {
                  var _a4, _b, _c;
                  app.api.editShape(this);
                  (_c = (_b = (_a4 = window.logseq) == null ? void 0 : _a4.api) == null ? void 0 : _b.edit_block) == null ? void 0 : _c.call(_b, uuid);
                }, 128);
              },
              placeholder: "Create or search your graph..."
            }) : /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("div", {
              className: "tl-logseq-portal-container",
              "data-collapsed": this.collapsed,
              "data-page-id": pageId,
              "data-portal-selected": portalSelected,
              "data-editing": isEditing,
              style: portalStyle,
              children: [
                !this.props.compact && !targetNotFound && /* @__PURE__ */ (0, import_jsx_runtime64.jsx)(LogseqPortalShapeHeader, {
                  type: (_a3 = this.props.blockType) != null ? _a3 : "P",
                  fill,
                  opacity,
                  children: this.props.blockType === "P" ? /* @__PURE__ */ (0, import_jsx_runtime64.jsx)(PageName, {
                    pageName: pageId
                  }) : /* @__PURE__ */ (0, import_jsx_runtime64.jsx)(Breadcrumb, {
                    blockId: pageId
                  })
                }),
                targetNotFound && /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("div", {
                  className: "tl-target-not-found",
                  children: "Target not found"
                }),
                showingPortal && /* @__PURE__ */ (0, import_jsx_runtime64.jsx)(PortalComponent, __spreadValues({}, componentProps))
              ]
            })
          })
        ]
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const bounds = this.getBounds();
      return /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("rect", {
        width: bounds.width,
        height: bounds.height,
        fill: "transparent",
        rx: 8,
        ry: 8,
        strokeDasharray: this.props.isLocked ? "8 2" : "undefined"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      var _a3;
      if (props.size !== void 0) {
        const scale = levelToScale7[(_a3 = this.props.scaleLevel) != null ? _a3 : "md"];
        props.size[0] = Math.max(props.size[0], 60 * scale);
        props.size[1] = Math.max(props.size[1], HEADER_HEIGHT * scale);
      }
      return withClampedStyles(this, props);
    });
    makeObservable(this);
    if (props.collapsed) {
      Object.assign(this.canResize, [true, false]);
    }
    if (((_a3 = props.size) == null ? void 0 : _a3[1]) === 0) {
      this.initialHeightCalculated = false;
    }
  }
  static isPageOrBlock(id3) {
    const blockRefEg = "((62af02d0-0443-42e8-a284-946c162b0f89))";
    if (id3) {
      return /^\(\(.*\)\)$/.test(id3) && id3.length === blockRefEg.length ? "B" : "P";
    }
    return false;
  }
  get collapsed() {
    return this.props.blockType === "B" ? this.props.compact : this.props.collapsed;
  }
  get scaleLevel() {
    var _a3;
    return (_a3 = this.props.scaleLevel) != null ? _a3 : "md";
  }
  useComponentSize(ref, selector = "") {
    const [size, setSize] = React52.useState([0, 0]);
    const app = useApp();
    React52.useEffect(() => {
      setTimeout(() => {
        if (ref == null ? void 0 : ref.current) {
          const el = selector ? ref.current.querySelector(selector) : ref.current;
          if (el) {
            const updateSize = () => {
              const { width, height } = el.getBoundingClientRect();
              const bound = src_default.div([width, height], app.viewport.camera.zoom);
              setSize(bound);
              return bound;
            };
            updateSize();
            this.getInnerHeight = () => updateSize()[1];
            const resizeObserver = new ResizeObserver(() => {
              updateSize();
            });
            resizeObserver.observe(el);
            return () => {
              resizeObserver.disconnect();
            };
          }
        }
        return () => {
        };
      }, 10);
    }, [ref, selector]);
    return size;
  }
  getHeaderHeight() {
    var _a3;
    const scale = levelToScale7[(_a3 = this.props.scaleLevel) != null ? _a3 : "md"];
    return this.props.compact ? 0 : HEADER_HEIGHT * scale;
  }
  getAutoResizeHeight() {
    if (this.getInnerHeight) {
      return this.getHeaderHeight() + this.getInnerHeight();
    }
    return null;
  }
  getShapeSVGJsx({ preview }) {
    var _a3, _b, _c;
    const bounds = this.getBounds();
    return /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)(import_jsx_runtime64.Fragment, {
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("rect", {
          fill: this.props.fill && this.props.fill !== "var(--ls-secondary-background-color)" ? isBuiltInColor(this.props.fill) ? `var(--ls-highlight-color-${this.props.fill})` : this.props.fill : "var(--ls-secondary-background-color)",
          stroke: getComputedColor(this.props.fill, "background"),
          strokeWidth: (_a3 = this.props.strokeWidth) != null ? _a3 : 2,
          fillOpacity: (_b = this.props.opacity) != null ? _b : 0.2,
          width: bounds.width,
          rx: 8,
          ry: 8,
          height: bounds.height
        }),
        !this.props.compact && /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("rect", {
          fill: this.props.fill && this.props.fill !== "var(--ls-secondary-background-color)" ? getComputedColor(this.props.fill, "background") : "var(--ls-tertiary-background-color)",
          fillOpacity: (_c = this.props.opacity) != null ? _c : 0.2,
          x: 1,
          y: 1,
          width: bounds.width - 2,
          height: HEADER_HEIGHT - 2,
          rx: 8,
          ry: 8
        }),
        /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("text", {
          style: {
            transformOrigin: "top left"
          },
          transform: `translate(${bounds.width / 2}, ${10 + bounds.height / 2})`,
          textAnchor: "middle",
          fontFamily: "var(--ls-font-family)",
          fontSize: "32",
          fill: "var(--ls-secondary-text-color)",
          stroke: "var(--ls-secondary-text-color)",
          children: this.props.blockType === "P" ? this.props.pageName : ""
        })
      ]
    });
  }
};
__publicField(LogseqPortalShape, "id", "logseq-portal");
__publicField(LogseqPortalShape, "defaultSearchQuery", "");
__publicField(LogseqPortalShape, "defaultSearchFilter", null);
__publicField(LogseqPortalShape, "defaultProps", {
  id: "logseq-portal",
  type: "logseq-portal",
  parentId: "page",
  point: [0, 0],
  size: [400, 50],
  collapsedHeight: 0,
  stroke: "",
  fill: "",
  noFill: false,
  borderRadius: 8,
  strokeWidth: 2,
  strokeType: "line",
  opacity: 1,
  pageId: "",
  collapsed: false,
  compact: false,
  scaleLevel: "md",
  isAutoResizing: true
});
__decorateClass([
  computed
], LogseqPortalShape.prototype, "collapsed", 1);
__decorateClass([
  action
], LogseqPortalShape.prototype, "setCollapsed", 2);
__decorateClass([
  computed
], LogseqPortalShape.prototype, "scaleLevel", 1);
__decorateClass([
  action
], LogseqPortalShape.prototype, "setScaleLevel", 2);

// ../../node_modules/perfect-freehand/dist/esm/index.js
function $2(e, t, u2, x2 = (h2) => h2) {
  return e * x2(0.5 - t * (0.5 - u2));
}
function se2(e) {
  return [-e[0], -e[1]];
}
function l2(e, t) {
  return [e[0] + t[0], e[1] + t[1]];
}
function a2(e, t) {
  return [e[0] - t[0], e[1] - t[1]];
}
function b2(e, t) {
  return [e[0] * t, e[1] * t];
}
function he2(e, t) {
  return [e[0] / t, e[1] / t];
}
function R2(e) {
  return [e[1], -e[0]];
}
function B2(e, t) {
  return e[0] * t[0] + e[1] * t[1];
}
function ue2(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}
function ge2(e) {
  return Math.hypot(e[0], e[1]);
}
function de2(e) {
  return e[0] * e[0] + e[1] * e[1];
}
function A2(e, t) {
  return de2(a2(e, t));
}
function G2(e) {
  return he2(e, ge2(e));
}
function ie2(e, t) {
  return Math.hypot(e[1] - t[1], e[0] - t[0]);
}
function L2(e, t, u2) {
  let x2 = Math.sin(u2), h2 = Math.cos(u2), y2 = e[0] - t[0], n2 = e[1] - t[1], f2 = y2 * h2 - n2 * x2, d2 = y2 * x2 + n2 * h2;
  return [f2 + t[0], d2 + t[1]];
}
function K2(e, t, u2) {
  return l2(e, b2(a2(t, e), u2));
}
function ee2(e, t, u2) {
  return l2(e, b2(t, u2));
}
var { min: C2, PI: xe2 } = Math;
var pe2 = 0.275;
var V3 = xe2 + 1e-4;
function ce2(e, t = {}) {
  let { size: u2 = 16, smoothing: x2 = 0.5, thinning: h2 = 0.5, simulatePressure: y2 = true, easing: n2 = (r2) => r2, start: f2 = {}, end: d2 = {}, last: D2 = false } = t, { cap: S2 = true, easing: j2 = (r2) => r2 * (2 - r2) } = f2, { cap: q2 = true, easing: c2 = (r2) => --r2 * r2 * r2 + 1 } = d2;
  if (e.length === 0 || u2 <= 0)
    return [];
  let p2 = e[e.length - 1].runningLength, g2 = f2.taper === false ? 0 : f2.taper === true ? Math.max(u2, p2) : f2.taper, T2 = d2.taper === false ? 0 : d2.taper === true ? Math.max(u2, p2) : d2.taper, te2 = Math.pow(u2 * x2, 2), _2 = [], M2 = [], H2 = e.slice(0, 10).reduce((r2, i2) => {
    let o2 = i2.pressure;
    if (y2) {
      let s2 = C2(1, i2.distance / u2), W2 = C2(1, 1 - s2);
      o2 = C2(1, r2 + (W2 - r2) * (s2 * pe2));
    }
    return (r2 + o2) / 2;
  }, e[0].pressure), m2 = $2(u2, h2, e[e.length - 1].pressure, n2), U2, X2 = e[0].vector, z2 = e[0].point, F2 = z2, O2 = z2, E2 = F2, J2 = false;
  for (let r2 = 0; r2 < e.length; r2++) {
    let { pressure: i2 } = e[r2], { point: o2, vector: s2, distance: W2, runningLength: I2 } = e[r2];
    if (r2 < e.length - 1 && p2 - I2 < 3)
      continue;
    if (h2) {
      if (y2) {
        let v2 = C2(1, W2 / u2), Z2 = C2(1, 1 - v2);
        i2 = C2(1, H2 + (Z2 - H2) * (v2 * pe2));
      }
      m2 = $2(u2, h2, i2, n2);
    } else
      m2 = u2 / 2;
    U2 === void 0 && (U2 = m2);
    let le2 = I2 < g2 ? j2(I2 / g2) : 1, fe2 = p2 - I2 < T2 ? c2((p2 - I2) / T2) : 1;
    m2 = Math.max(0.01, m2 * Math.min(le2, fe2));
    let re2 = (r2 < e.length - 1 ? e[r2 + 1] : e[r2]).vector, Y2 = r2 < e.length - 1 ? B2(s2, re2) : 1, be2 = B2(s2, X2) < 0 && !J2, ne2 = Y2 !== null && Y2 < 0;
    if (be2 || ne2) {
      let v2 = b2(R2(X2), m2);
      for (let Z2 = 1 / 13, w2 = 0; w2 <= 1; w2 += Z2)
        O2 = L2(a2(o2, v2), o2, V3 * w2), _2.push(O2), E2 = L2(l2(o2, v2), o2, V3 * -w2), M2.push(E2);
      z2 = O2, F2 = E2, ne2 && (J2 = true);
      continue;
    }
    if (J2 = false, r2 === e.length - 1) {
      let v2 = b2(R2(s2), m2);
      _2.push(a2(o2, v2)), M2.push(l2(o2, v2));
      continue;
    }
    let oe2 = b2(R2(K2(re2, s2, Y2)), m2);
    O2 = a2(o2, oe2), (r2 <= 1 || A2(z2, O2) > te2) && (_2.push(O2), z2 = O2), E2 = l2(o2, oe2), (r2 <= 1 || A2(F2, E2) > te2) && (M2.push(E2), F2 = E2), H2 = i2, X2 = s2;
  }
  let P2 = e[0].point.slice(0, 2), k2 = e.length > 1 ? e[e.length - 1].point.slice(0, 2) : l2(e[0].point, [1, 1]), Q2 = [], N2 = [];
  if (e.length === 1) {
    if (!(g2 || T2) || D2) {
      let r2 = ee2(P2, G2(R2(a2(P2, k2))), -(U2 || m2)), i2 = [];
      for (let o2 = 1 / 13, s2 = o2; s2 <= 1; s2 += o2)
        i2.push(L2(r2, P2, V3 * 2 * s2));
      return i2;
    }
  } else {
    if (!(g2 || T2 && e.length === 1))
      if (S2)
        for (let i2 = 1 / 13, o2 = i2; o2 <= 1; o2 += i2) {
          let s2 = L2(M2[0], P2, V3 * o2);
          Q2.push(s2);
        }
      else {
        let i2 = a2(_2[0], M2[0]), o2 = b2(i2, 0.5), s2 = b2(i2, 0.51);
        Q2.push(a2(P2, o2), a2(P2, s2), l2(P2, s2), l2(P2, o2));
      }
    let r2 = R2(se2(e[e.length - 1].vector));
    if (T2 || g2 && e.length === 1)
      N2.push(k2);
    else if (q2) {
      let i2 = ee2(k2, r2, m2);
      for (let o2 = 1 / 29, s2 = o2; s2 < 1; s2 += o2)
        N2.push(L2(i2, k2, V3 * 3 * s2));
    } else
      N2.push(l2(k2, b2(r2, m2)), l2(k2, b2(r2, m2 * 0.99)), a2(k2, b2(r2, m2 * 0.99)), a2(k2, b2(r2, m2)));
  }
  return _2.concat(N2, M2.reverse(), Q2);
}
function me2(e, t = {}) {
  var q2;
  let { streamline: u2 = 0.5, size: x2 = 16, last: h2 = false } = t;
  if (e.length === 0)
    return [];
  let y2 = 0.15 + (1 - u2) * 0.85, n2 = Array.isArray(e[0]) ? e : e.map(({ x: c2, y: p2, pressure: g2 = 0.5 }) => [c2, p2, g2]);
  if (n2.length === 2) {
    let c2 = n2[1];
    n2 = n2.slice(0, -1);
    for (let p2 = 1; p2 < 5; p2++)
      n2.push(K2(n2[0], c2, p2 / 4));
  }
  n2.length === 1 && (n2 = [...n2, [...l2(n2[0], [1, 1]), ...n2[0].slice(2)]]);
  let f2 = [{ point: [n2[0][0], n2[0][1]], pressure: n2[0][2] >= 0 ? n2[0][2] : 0.25, vector: [1, 1], distance: 0, runningLength: 0 }], d2 = false, D2 = 0, S2 = f2[0], j2 = n2.length - 1;
  for (let c2 = 1; c2 < n2.length; c2++) {
    let p2 = h2 && c2 === j2 ? n2[c2].slice(0, 2) : K2(S2.point, n2[c2], y2);
    if (ue2(S2.point, p2))
      continue;
    let g2 = ie2(p2, S2.point);
    if (D2 += g2, c2 < j2 && !d2) {
      if (D2 < x2)
        continue;
      d2 = true;
    }
    S2 = { point: p2, pressure: n2[c2][2] >= 0 ? n2[c2][2] : 0.5, vector: G2(a2(S2.point, p2)), distance: g2, runningLength: D2 }, f2.push(S2);
  }
  return f2[0].vector = ((q2 = f2[1]) == null ? void 0 : q2.vector) || [0, 0], f2;
}

// src/lib/shapes/PencilShape.tsx
var import_jsx_runtime65 = require("react/jsx-runtime");
var levelToScale8 = {
  xs: 1,
  sm: 1.6,
  md: 2,
  lg: 3.2,
  xl: 4.8,
  xxl: 6
};
var simulatePressureSettings = {
  easing: (t) => Math.sin(t * Math.PI / 2),
  simulatePressure: true
};
var realPressureSettings = {
  easing: (t) => t * t,
  simulatePressure: false
};
function getFreehandOptions(shape) {
  const options = __spreadProps(__spreadValues({
    size: 1 + shape.strokeWidth * 1.5,
    thinning: 0.65,
    streamline: 0.65,
    smoothing: 0.65
  }, shape.points[1][2] === 0.5 ? simulatePressureSettings : realPressureSettings), {
    last: shape.isComplete
  });
  return options;
}
function getDrawStrokePoints(shape, options) {
  return me2(shape.points, options);
}
function getDrawStrokePathTDSnapshot(shape) {
  if (shape.points.length < 2)
    return "";
  const options = getFreehandOptions(shape);
  const strokePoints = getDrawStrokePoints(shape, options);
  const path = SvgPathUtils.getSvgPathFromStroke(ce2(strokePoints, options));
  return path;
}
var PencilShape = class extends TLDrawShape {
  constructor(props = {}) {
    super(props);
    __publicField(this, "ReactComponent", observer(({ events, isErasing }) => {
      const {
        props: { opacity }
      } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime65.jsx)(SVGContainer, __spreadProps(__spreadValues({}, events), {
        opacity: isErasing ? 0.2 : opacity,
        children: this.getShapeSVGJsx()
      }));
    }));
    __publicField(this, "setScaleLevel", (v2) => __async(this, null, function* () {
      this.update({
        scaleLevel: v2,
        strokeWidth: levelToScale8[v2 != null ? v2 : "md"]
      });
      this.onResetBounds();
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const { pointsPath } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime65.jsx)("path", {
        d: pointsPath,
        strokeDasharray: this.props.isLocked ? "8 2" : "undefined"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      props = withClampedStyles(this, props);
      if (props.strokeWidth !== void 0)
        props.strokeWidth = Math.max(props.strokeWidth, 1);
      return props;
    });
    makeObservable(this);
  }
  get pointsPath() {
    return getDrawStrokePathTDSnapshot(this.props);
  }
  get scaleLevel() {
    var _a3;
    return (_a3 = this.props.scaleLevel) != null ? _a3 : "md";
  }
  getShapeSVGJsx() {
    const {
      pointsPath,
      props: { stroke, strokeWidth, strokeType }
    } = this;
    return /* @__PURE__ */ (0, import_jsx_runtime65.jsx)("path", {
      pointerEvents: "all",
      d: pointsPath,
      strokeWidth: strokeWidth / 2,
      strokeLinejoin: "round",
      strokeLinecap: "round",
      stroke: getComputedColor(stroke, "text"),
      fill: getComputedColor(stroke, "text"),
      strokeDasharray: strokeType === "dashed" ? "12 4" : void 0
    });
  }
};
__publicField(PencilShape, "id", "pencil");
__publicField(PencilShape, "defaultProps", {
  id: "pencil",
  parentId: "page",
  type: "pencil",
  point: [0, 0],
  points: [],
  isComplete: false,
  stroke: "",
  fill: "",
  noFill: true,
  strokeType: "line",
  strokeWidth: 2,
  opacity: 1
});
__decorateClass([
  computed
], PencilShape.prototype, "pointsPath", 1);
__decorateClass([
  computed
], PencilShape.prototype, "scaleLevel", 1);
__decorateClass([
  action
], PencilShape.prototype, "setScaleLevel", 2);

// src/lib/shapes/PolygonShape.tsx
var React53 = __toESM(require("react"));
var import_jsx_runtime66 = require("react/jsx-runtime");
var font4 = "20px / 1 var(--ls-font-family)";
var levelToScale9 = {
  xs: 10,
  sm: 16,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 60
};
var PolygonShape = class extends TLPolygonShape {
  constructor() {
    super(...arguments);
    __publicField(this, "canEdit", true);
    __publicField(this, "ReactComponent", observer(
      ({ events, isErasing, isSelected, isEditing, onEditingEnd }) => {
        const {
          offset: [x2, y2],
          props: {
            stroke,
            fill,
            noFill,
            strokeWidth,
            opacity,
            strokeType,
            label,
            italic,
            fontWeight,
            fontSize
          }
        } = this;
        const path = this.getVertices(strokeWidth / 2).join();
        const labelSize = label || isEditing ? getTextLabelSize(
          label,
          { fontFamily: "var(--ls-font-family)", fontSize, lineHeight: 1, fontWeight },
          4
        ) : [0, 0];
        const midPoint = [this.props.size[0] / 2, this.props.size[1] * 2 / 3];
        const scale = Math.max(
          0.5,
          Math.min(
            1,
            this.props.size[0] / (labelSize[0] * 2),
            this.props.size[1] / (labelSize[1] * 2)
          )
        );
        const bounds = this.getBounds();
        const offset = React53.useMemo(() => {
          return src_default.sub(midPoint, src_default.toFixed([bounds.width / 2, bounds.height / 2]));
        }, [bounds, scale, midPoint]);
        const handleLabelChange = React53.useCallback(
          (label2) => {
            var _a3;
            (_a3 = this.update) == null ? void 0 : _a3.call(this, { label: label2 });
          },
          [label]
        );
        return /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("div", __spreadProps(__spreadValues({}, events), {
          style: { width: "100%", height: "100%", overflow: "hidden" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(TextLabel, {
              font: font4,
              text: label,
              fontSize,
              color: getComputedColor(stroke, "text"),
              offsetX: offset[0],
              offsetY: offset[1] / scale,
              scale,
              isEditing,
              onChange: handleLabelChange,
              onBlur: onEditingEnd,
              fontStyle: italic ? "italic" : "normal",
              fontWeight,
              pointerEvents: !!label
            }),
            /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(SVGContainer, {
              opacity: isErasing ? 0.2 : opacity,
              children: /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("g", {
                transform: `translate(${x2}, ${y2})`,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("polygon", {
                    className: isSelected || !noFill ? "tl-hitarea-fill" : "tl-hitarea-stroke",
                    points: path
                  }),
                  /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("polygon", {
                    points: path,
                    stroke: getComputedColor(stroke, "stroke"),
                    fill: noFill ? "none" : getComputedColor(fill, "background"),
                    strokeWidth,
                    rx: 2,
                    ry: 2,
                    strokeLinejoin: "round",
                    strokeDasharray: strokeType === "dashed" ? "8 2" : void 0
                  })
                ]
              })
            })
          ]
        }));
      }
    ));
    __publicField(this, "setScaleLevel", (v2) => __async(this, null, function* () {
      this.update({
        scaleLevel: v2,
        fontSize: levelToScale9[v2 != null ? v2 : "md"],
        strokeWidth: levelToScale9[v2 != null ? v2 : "md"] / 10
      });
      this.onResetBounds();
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        offset: [x2, y2],
        props: { strokeWidth, isLocked }
      } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("g", {
        children: /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("polygon", {
          transform: `translate(${x2}, ${y2})`,
          points: this.getVertices(strokeWidth / 2).join(),
          strokeDasharray: isLocked ? "8 2" : "undefined"
        })
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.sides !== void 0)
        props.sides = Math.max(props.sides, 3);
      return withClampedStyles(this, props);
    });
  }
  get scaleLevel() {
    var _a3;
    return (_a3 = this.props.scaleLevel) != null ? _a3 : "md";
  }
  getShapeSVGJsx(opts) {
    const {
      offset: [x2, y2],
      props: { stroke, fill, noFill, strokeWidth, opacity, strokeType }
    } = this;
    const path = this.getVertices(strokeWidth / 2).join();
    return /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("g", {
      transform: `translate(${x2}, ${y2})`,
      opacity,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("polygon", {
          className: !noFill ? "tl-hitarea-fill" : "tl-hitarea-stroke",
          points: path
        }),
        /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("polygon", {
          points: path,
          stroke: getComputedColor(stroke, "stroke"),
          fill: noFill ? "none" : getComputedColor(fill, "background"),
          strokeWidth,
          rx: 2,
          ry: 2,
          strokeLinejoin: "round",
          strokeDasharray: strokeType === "dashed" ? "8 2" : void 0
        })
      ]
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
  sides: 3,
  ratio: 1,
  isFlippedY: false,
  stroke: "",
  fill: "",
  fontWeight: 400,
  fontSize: 20,
  italic: false,
  noFill: false,
  strokeType: "line",
  strokeWidth: 2,
  opacity: 1,
  label: ""
});
__decorateClass([
  computed
], PolygonShape.prototype, "scaleLevel", 1);
__decorateClass([
  action
], PolygonShape.prototype, "setScaleLevel", 2);

// src/lib/shapes/TextShape.tsx
var React54 = __toESM(require("react"));
var import_jsx_runtime67 = require("react/jsx-runtime");
var levelToScale10 = {
  xs: 10,
  sm: 16,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 60
};
var TextShape = class extends TLTextShape {
  constructor() {
    super(...arguments);
    __publicField(this, "ReactComponent", observer(({ events, isErasing, isEditing, onEditingEnd }) => {
      const {
        props: {
          opacity,
          fontFamily,
          fontSize,
          fontWeight,
          italic,
          lineHeight,
          text,
          stroke,
          padding
        }
      } = this;
      const rInput = React54.useRef(null);
      const rIsMounted = React54.useRef(false);
      const rInnerWrapper = React54.useRef(null);
      const handleChange = React54.useCallback((e) => {
        const { isSizeLocked } = this.props;
        const text2 = TextUtils.normalizeText(e.currentTarget.value);
        if (isSizeLocked) {
          this.update({ text: text2, size: this.getAutoSizedBoundingBox({ text: text2 }) });
          return;
        }
        this.update({ text: text2 });
      }, []);
      const handleKeyDown = React54.useCallback((e) => {
        if (e.key === "Escape")
          return;
        if (e.key === "Tab" && text.length === 0) {
          e.preventDefault();
          return;
        }
        if (!(e.key === "Meta" || e.metaKey)) {
          e.stopPropagation();
        } else if (e.key === "z" && e.metaKey) {
          if (e.shiftKey) {
            document.execCommand("redo", false);
          } else {
            document.execCommand("undo", false);
          }
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        if (e.key === "Tab") {
          e.preventDefault();
          if (e.shiftKey) {
            TextAreaUtils.unindent(e.currentTarget);
          } else {
            TextAreaUtils.indent(e.currentTarget);
          }
          this.update({ text: TextUtils.normalizeText(e.currentTarget.value) });
        }
      }, []);
      const handleBlur = React54.useCallback(
        (e) => {
          if (!isEditing)
            return;
          onEditingEnd == null ? void 0 : onEditingEnd();
        },
        [onEditingEnd]
      );
      const handleFocus = React54.useCallback(
        (e) => {
          if (!isEditing)
            return;
          if (!rIsMounted.current)
            return;
          if (document.activeElement === e.currentTarget) {
            e.currentTarget.select();
          }
        },
        [isEditing]
      );
      const handlePointerDown = React54.useCallback(
        (e) => {
          if (isEditing)
            e.stopPropagation();
        },
        [isEditing]
      );
      React54.useEffect(() => {
        if (isEditing) {
          requestAnimationFrame(() => {
            rIsMounted.current = true;
            const elm = rInput.current;
            if (elm) {
              elm.focus();
              elm.select();
            }
          });
        }
      }, [isEditing, onEditingEnd]);
      React54.useLayoutEffect(() => {
        if (this.props.size[0] === 0 || this.props.size[1] === 0) {
          this.onResetBounds();
        }
      }, []);
      return /* @__PURE__ */ (0, import_jsx_runtime67.jsx)(HTMLContainer, __spreadProps(__spreadValues({}, events), {
        opacity: isErasing ? 0.2 : opacity,
        children: /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("div", {
          ref: rInnerWrapper,
          className: "tl-text-shape-wrapper",
          "data-hastext": !!text,
          "data-isediting": isEditing,
          style: {
            fontFamily,
            fontStyle: italic ? "italic" : "normal",
            fontSize,
            fontWeight,
            padding,
            lineHeight,
            color: getComputedColor(stroke, "text")
          },
          children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("textarea", {
            ref: rInput,
            className: "tl-text-shape-input",
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
          }) : /* @__PURE__ */ (0, import_jsx_runtime67.jsxs)(import_jsx_runtime67.Fragment, {
            children: [
              text,
              "\u200B"
            ]
          })
        })
      }));
    }));
    __publicField(this, "setScaleLevel", (v2) => __async(this, null, function* () {
      this.update({
        scaleLevel: v2,
        fontSize: levelToScale10[v2 != null ? v2 : "md"]
      });
      this.onResetBounds();
    }));
    __publicField(this, "ReactIndicator", observer(({ isEditing }) => {
      const {
        props: { borderRadius, isLocked },
        bounds
      } = this;
      return isEditing ? null : /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("rect", {
        width: bounds.width,
        height: bounds.height,
        rx: borderRadius,
        ry: borderRadius,
        fill: "transparent",
        strokeDasharray: isLocked ? "8 2" : "undefined"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.isSizeLocked || this.props.isSizeLocked) {
      }
      return withClampedStyles(this, props);
    });
    __publicField(this, "getBounds", () => {
      const [x2, y2] = this.props.point;
      const [width, height] = this.props.size;
      return {
        minX: x2,
        minY: y2,
        maxX: x2 + width,
        maxY: y2 + height,
        width,
        height
      };
    });
    __publicField(this, "onResizeStart", ({ isSingle }) => {
      var _a3;
      if (!isSingle)
        return this;
      this.scale = [...(_a3 = this.props.scale) != null ? _a3 : [1, 1]];
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
  get scaleLevel() {
    var _a3;
    return (_a3 = this.props.scaleLevel) != null ? _a3 : "md";
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
    const [width, height] = getTextLabelSize(
      text,
      { fontFamily, fontSize, lineHeight, fontWeight },
      padding
    );
    return [width, height];
  }
  getShapeSVGJsx() {
    if (isSafari()) {
      return super.getShapeSVGJsx(null);
    }
    const {
      props: { text, stroke, fontSize, fontFamily }
    } = this;
    const bounds = this.getBounds();
    return /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("foreignObject", {
      width: bounds.width,
      height: bounds.height,
      children: /* @__PURE__ */ (0, import_jsx_runtime67.jsx)("div", {
        style: {
          color: getComputedColor(stroke, "text"),
          fontSize,
          fontFamily,
          display: "contents"
        },
        children: text
      })
    });
  }
};
__publicField(TextShape, "id", "text");
__publicField(TextShape, "defaultProps", {
  id: "box",
  parentId: "page",
  type: "text",
  point: [0, 0],
  size: [0, 0],
  isSizeLocked: true,
  text: "",
  lineHeight: 1.2,
  fontSize: 20,
  fontWeight: 400,
  italic: false,
  padding: 4,
  fontFamily: "var(--ls-font-family)",
  borderRadius: 0,
  stroke: "",
  fill: "",
  noFill: true,
  strokeType: "line",
  strokeWidth: 2,
  opacity: 1
});
__decorateClass([
  computed
], TextShape.prototype, "scaleLevel", 1);
__decorateClass([
  action
], TextShape.prototype, "setScaleLevel", 2);

// src/lib/shapes/VideoShape.tsx
var React55 = __toESM(require("react"));
var import_jsx_runtime68 = require("react/jsx-runtime");
var VideoShape = class extends TLBoxShape {
  constructor() {
    super(...arguments);
    __publicField(this, "canFlip", false);
    __publicField(this, "canEdit", true);
    __publicField(this, "canChangeAspectRatio", false);
    __publicField(this, "ReactComponent", observer(({ events, isErasing, asset, isEditing }) => {
      const {
        props: {
          opacity,
          size: [w2, h2]
        }
      } = this;
      const isMoving = useCameraMovingRef();
      const app = useApp();
      const isSelected = app.selectedIds.has(this.id);
      const tlEventsEnabled = isMoving || isSelected && !isEditing || app.selectedTool.id !== "select";
      const stop2 = React55.useCallback(
        (e) => {
          if (!tlEventsEnabled) {
            e.stopPropagation();
          }
        },
        [tlEventsEnabled]
      );
      const { handlers } = React55.useContext(LogseqContext);
      return /* @__PURE__ */ (0, import_jsx_runtime68.jsx)(HTMLContainer, __spreadProps(__spreadValues({
        style: {
          overflow: "hidden",
          pointerEvents: "all",
          opacity: isErasing ? 0.2 : opacity
        }
      }, events), {
        children: /* @__PURE__ */ (0, import_jsx_runtime68.jsx)("div", {
          onWheelCapture: stop2,
          onPointerDown: stop2,
          onPointerUp: stop2,
          className: "tl-video-container",
          style: {
            pointerEvents: !isMoving && (isEditing || isSelected) ? "all" : "none",
            overflow: isEditing ? "auto" : "hidden"
          },
          children: asset && /* @__PURE__ */ (0, import_jsx_runtime68.jsx)("video", {
            controls: true,
            src: handlers ? handlers.makeAssetUrl(asset.src) : asset.src
          })
        })
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: {
          size: [w2, h2],
          isLocked
        }
      } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime68.jsx)("rect", {
        width: w2,
        height: h2,
        fill: "transparent",
        strokeDasharray: isLocked ? "8 2" : "undefined"
      });
    }));
  }
};
__publicField(VideoShape, "id", "video");
__publicField(VideoShape, "defaultProps", {
  id: "video1",
  parentId: "page",
  type: "video",
  point: [0, 0],
  size: [100, 100],
  opacity: 1,
  assetId: "",
  clipping: 0,
  isAspectRatioLocked: true
});

// src/lib/shapes/YouTubeShape.tsx
var import_jsx_runtime69 = require("react/jsx-runtime");
var YOUTUBE_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
var _YouTubeShape = class extends TLBoxShape {
  constructor() {
    super(...arguments);
    __publicField(this, "aspectRatio", 480 / 853);
    __publicField(this, "canChangeAspectRatio", false);
    __publicField(this, "canFlip", false);
    __publicField(this, "canEdit", true);
    __publicField(this, "onYoutubeLinkChange", (url) => {
      this.update({ url, size: _YouTubeShape.defaultProps.size });
    });
    __publicField(this, "ReactComponent", observer(({ events, isErasing, isEditing, isSelected }) => {
      const app = useApp();
      return /* @__PURE__ */ (0, import_jsx_runtime69.jsx)(HTMLContainer, __spreadProps(__spreadValues({
        style: {
          overflow: "hidden",
          pointerEvents: "all",
          opacity: isErasing ? 0.2 : 1
        }
      }, events), {
        children: /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("div", {
          className: "rounded-lg w-full h-full relative overflow-hidden shadow-xl tl-youtube-container",
          style: {
            pointerEvents: isEditing || app.readOnly ? "all" : "none",
            userSelect: "none",
            background: `url('https://img.youtube.com/vi/${this.embedId}/mqdefault.jpg') no-repeat center/cover`
          },
          children: this.embedId ? /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("div", {
            style: {
              overflow: "hidden",
              position: "relative",
              height: "100%"
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("iframe", {
              className: "absolute inset-0 w-full h-full m-0",
              width: "853",
              height: "480",
              src: `https://www.youtube.com/embed/${this.embedId}`,
              frameBorder: "0",
              allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
              allowFullScreen: true,
              title: "Embedded youtube"
            })
          }) : /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("div", {
            className: "w-full h-full flex items-center justify-center p-4",
            style: {
              backgroundColor: "var(--ls-primary-background-color)"
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("svg", {
              xmlns: "http://www.w3.org/2000/svg",
              viewBox: "0 0 502 210.649",
              height: "210.65",
              width: "128",
              children: /* @__PURE__ */ (0, import_jsx_runtime69.jsxs)("g", {
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("path", {
                    d: "M498.333 45.7s-2.91-20.443-11.846-29.447C475.157 4.44 462.452 4.38 456.627 3.687c-41.7-3-104.25-3-104.25-3h-.13s-62.555 0-104.255 3c-5.826.693-18.523.753-29.86 12.566-8.933 9.004-11.84 29.447-11.84 29.447s-2.983 24.003-2.983 48.009v22.507c0 24.006 2.983 48.013 2.983 48.013s2.907 20.44 11.84 29.446c11.337 11.817 26.23 11.44 32.86 12.677 23.84 2.28 101.315 2.983 101.315 2.983s62.62-.094 104.32-3.093c5.824-.694 18.527-.75 29.857-12.567 8.936-9.006 11.846-29.446 11.846-29.446s2.98-24.007 2.98-48.013V93.709c0-24.006-2.98-48.01-2.98-48.01",
                    fill: "#cd201f"
                  }),
                  /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("g", {
                    children: /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("path", {
                      d: "M187.934 169.537h-18.96V158.56c-7.19 8.24-13.284 12.4-19.927 12.4-5.826 0-9.876-2.747-11.9-7.717-1.23-3.02-2.103-7.736-2.103-14.663V68.744h18.957v81.833c.443 2.796 1.636 3.823 4.043 3.823 3.63 0 6.913-3.153 10.93-8.817V68.744h18.96v100.793zM102.109 139.597c.996 9.98-2.1 14.93-7.987 14.93s-8.98-4.95-7.98-14.93v-39.92c-1-9.98 2.093-14.657 7.98-14.657 5.89 0 8.993 4.677 7.996 14.657l-.01 39.92zm18.96-37.923c0-10.77-2.164-18.86-5.987-23.95-5.054-6.897-12.973-9.72-20.96-9.72-9.033 0-15.913 2.823-20.957 9.72-3.886 5.09-5.97 13.266-5.97 24.036l-.016 35.84c0 10.71 1.853 18.11 5.736 23.153 5.047 6.873 13.227 10.513 21.207 10.513 7.986 0 16.306-3.64 21.36-10.513 3.823-5.043 5.586-12.443 5.586-23.153v-35.926zM46.223 114.647v54.889h-19.96v-54.89S5.582 47.358 1.314 34.815H22.27L36.277 87.38l13.936-52.566H71.17l-24.947 79.833z"
                    })
                  }),
                  /* @__PURE__ */ (0, import_jsx_runtime69.jsxs)("g", {
                    fill: "#fff",
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("path", {
                        d: "M440.413 96.647c0-9.33 2.557-11.874 8.59-11.874 5.99 0 8.374 2.777 8.374 11.997v10.893l-16.964.02V96.647zm35.96 25.986l-.003-20.4c0-10.656-2.1-18.456-5.88-23.5-5.06-6.823-12.253-10.436-21.317-10.436-9.226 0-16.42 3.613-21.643 10.436-3.84 5.044-6.076 13.28-6.076 23.943v34.927c0 10.596 2.46 18.013 6.296 23.003 5.227 6.813 12.42 10.216 21.87 10.216 9.44 0 16.853-3.566 21.85-10.81 2.2-3.196 3.616-6.82 4.226-10.823.164-1.81.64-5.933.64-11.753v-2.827h-18.96c0 7.247.037 11.557-.133 12.54-1.033 4.834-3.623 7.25-8.07 7.25-6.203 0-8.826-4.636-8.76-13.843v-17.923h35.96zM390.513 140.597c0 9.98-2.353 13.806-7.563 13.806-2.973 0-6.4-1.53-9.423-4.553l.02-60.523c3.02-2.98 6.43-4.55 9.403-4.55 5.21 0 7.563 2.93 7.563 12.91v42.91zm2.104-72.453c-6.647 0-13.253 4.087-19.09 11.27l.02-43.603h-17.963V169.54h17.963l.027-10.05c6.036 7.47 12.62 11.333 19.043 11.333 7.193 0 12.45-3.85 14.863-11.267 1.203-4.226 1.993-10.733 1.993-19.956V99.684c0-9.447-1.21-15.907-2.416-19.917-2.41-7.466-7.247-11.623-14.44-11.623M340.618 169.537h-18.956V158.56c-7.193 8.24-13.283 12.4-19.926 12.4-5.827 0-9.877-2.747-11.9-7.717-1.234-3.02-2.107-7.736-2.107-14.663V69.744h18.96v80.833c.443 2.796 1.633 3.823 4.043 3.823 3.63 0 6.913-3.153 10.93-8.817V69.744h18.957v99.793z"
                      }),
                      /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("path", {
                        d: "M268.763 169.537h-19.956V54.77h-20.956V35.835l62.869-.024v18.96h-21.957v114.766z"
                      })
                    ]
                  })
                ]
              })
            })
          })
        })
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: {
          size: [w2, h2],
          isLocked
        }
      } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("rect", {
        width: w2,
        height: h2,
        fill: "transparent",
        rx: 8,
        ry: 8,
        strokeDasharray: isLocked ? "8 2" : "undefined"
      });
    }));
    __publicField(this, "validateProps", (props) => {
      if (props.size !== void 0) {
        props.size[0] = Math.max(props.size[0], 1);
        props.size[1] = Math.max(props.size[0] * this.aspectRatio, 1);
      }
      return withClampedStyles(this, props);
    });
  }
  get embedId() {
    var _a3, _b;
    const url = this.props.url;
    const match = url.match(YOUTUBE_REGEX);
    const embedId = (_b = (_a3 = match == null ? void 0 : match[1]) != null ? _a3 : url) != null ? _b : "";
    return embedId;
  }
  getShapeSVGJsx() {
    const bounds = this.getBounds();
    const embedId = this.embedId;
    if (embedId) {
      return /* @__PURE__ */ (0, import_jsx_runtime69.jsxs)("g", {
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("image", {
            width: bounds.width,
            height: bounds.height,
            href: `https://img.youtube.com/vi/${embedId}/mqdefault.jpg`,
            className: "grayscale-[50%]"
          }),
          /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("svg", {
            x: bounds.width / 4,
            y: bounds.height / 4,
            width: bounds.width / 2,
            height: bounds.height / 2,
            viewBox: "0 0 15 15",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
            children: /* @__PURE__ */ (0, import_jsx_runtime69.jsx)("path", {
              d: "M4.76447 3.12199C5.63151 3.04859 6.56082 3 7.5 3C8.43918 3 9.36849 3.04859 10.2355 3.12199C11.2796 3.21037 11.9553 3.27008 12.472 3.39203C12.9425 3.50304 13.2048 3.64976 13.4306 3.88086C13.4553 3.90618 13.4902 3.94414 13.5133 3.97092C13.7126 4.20149 13.8435 4.4887 13.918 5.03283C13.9978 5.6156 14 6.37644 14 7.52493C14 8.66026 13.9978 9.41019 13.9181 9.98538C13.8439 10.5206 13.7137 10.8061 13.5125 11.0387C13.4896 11.0651 13.4541 11.1038 13.4296 11.1287C13.2009 11.3625 12.9406 11.5076 12.4818 11.6164C11.9752 11.7365 11.3143 11.7942 10.2878 11.8797C9.41948 11.9521 8.47566 12 7.5 12C6.52434 12 5.58052 11.9521 4.7122 11.8797C3.68572 11.7942 3.02477 11.7365 2.51816 11.6164C2.05936 11.5076 1.7991 11.3625 1.57037 11.1287C1.54593 11.1038 1.51035 11.0651 1.48748 11.0387C1.28628 10.8061 1.15612 10.5206 1.08193 9.98538C1.00221 9.41019 1 8.66026 1 7.52493C1 6.37644 1.00216 5.6156 1.082 5.03283C1.15654 4.4887 1.28744 4.20149 1.48666 3.97092C1.5098 3.94414 1.54468 3.90618 1.56942 3.88086C1.7952 3.64976 2.05752 3.50304 2.52796 3.39203C3.04473 3.27008 3.7204 3.21037 4.76447 3.12199ZM0 7.52493C0 5.28296 0 4.16198 0.729985 3.31713C0.766457 3.27491 0.815139 3.22194 0.854123 3.18204C1.63439 2.38339 2.64963 2.29744 4.68012 2.12555C5.56923 2.05028 6.52724 2 7.5 2C8.47276 2 9.43077 2.05028 10.3199 2.12555C12.3504 2.29744 13.3656 2.38339 14.1459 3.18204C14.1849 3.22194 14.2335 3.27491 14.27 3.31713C15 4.16198 15 5.28296 15 7.52493C15 9.74012 15 10.8477 14.2688 11.6929C14.2326 11.7348 14.1832 11.7885 14.1444 11.8281C13.3629 12.6269 12.3655 12.71 10.3709 12.8763C9.47971 12.9505 8.50782 13 7.5 13C6.49218 13 5.52028 12.9505 4.62915 12.8763C2.63446 12.71 1.63712 12.6269 0.855558 11.8281C0.816844 11.7885 0.767442 11.7348 0.731221 11.6929C0 10.8477 0 9.74012 0 7.52493ZM5.25 5.38264C5.25 5.20225 5.43522 5.08124 5.60041 5.15369L10.428 7.27105C10.6274 7.35853 10.6274 7.64147 10.428 7.72895L5.60041 9.84631C5.43522 9.91876 5.25 9.79775 5.25 9.61736V5.38264Z",
              fill: "#D10014",
              fillRule: "evenodd",
              clipRule: "evenodd"
            })
          })
        ]
      });
    }
    return super.getShapeSVGJsx({});
  }
};
var YouTubeShape = _YouTubeShape;
__publicField(YouTubeShape, "id", "youtube");
__publicField(YouTubeShape, "defaultProps", {
  id: "youtube",
  type: "youtube",
  parentId: "page",
  point: [0, 0],
  size: [853, 480],
  url: ""
});
__decorateClass([
  computed
], YouTubeShape.prototype, "embedId", 1);
__decorateClass([
  action
], YouTubeShape.prototype, "onYoutubeLinkChange", 2);

// src/lib/shapes/TweetShape.tsx
var React56 = __toESM(require("react"));
var import_jsx_runtime70 = require("react/jsx-runtime");
var X_OR_TWITTER_REGEX = /https?:\/\/(x|twitter).com\/[0-9a-zA-Z_]{1,20}\/status\/([0-9]*)/;
var _TweetShape = class extends TLBoxShape {
  constructor() {
    super(...arguments);
    __publicField(this, "canFlip", false);
    __publicField(this, "canEdit", true);
    __publicField(this, "initialHeightCalculated", true);
    __publicField(this, "getInnerHeight", null);
    __publicField(this, "onTwitterLinkChange", (url) => {
      this.update({ url, size: _TweetShape.defaultProps.size });
    });
    __publicField(this, "ReactComponent", observer(({ events, isErasing, isEditing, isSelected }) => {
      const {
        renderers: { Tweet }
      } = React56.useContext(LogseqContext);
      const app = useApp();
      const cpRefContainer = React56.useRef(null);
      const [, innerHeight] = this.useComponentSize(cpRefContainer);
      React56.useEffect(() => {
        var _a3, _b;
        const latestInnerHeight = (_b = (_a3 = this.getInnerHeight) == null ? void 0 : _a3.call(this)) != null ? _b : innerHeight;
        const newHeight = latestInnerHeight;
        if (innerHeight && Math.abs(newHeight - this.props.size[1]) > 1) {
          this.update({
            size: [this.props.size[0], newHeight]
          });
          app.persist();
        }
      }, [innerHeight]);
      React56.useEffect(() => {
        if (!this.initialHeightCalculated) {
          setTimeout(() => {
            this.onResetBounds();
            app.persist();
          });
        }
      }, [this.initialHeightCalculated]);
      return /* @__PURE__ */ (0, import_jsx_runtime70.jsx)(HTMLContainer, __spreadProps(__spreadValues({
        style: {
          overflow: "hidden",
          pointerEvents: "all",
          opacity: isErasing ? 0.2 : 1
        }
      }, events), {
        children: /* @__PURE__ */ (0, import_jsx_runtime70.jsx)("div", {
          className: "rounded-xl w-full h-full relative shadow-xl tl-tweet-container",
          style: {
            pointerEvents: isEditing || app.readOnly ? "all" : "none",
            userSelect: "none"
          },
          children: this.embedId ? /* @__PURE__ */ (0, import_jsx_runtime70.jsx)("div", {
            ref: cpRefContainer,
            children: /* @__PURE__ */ (0, import_jsx_runtime70.jsx)(Tweet, {
              tweetId: this.embedId
            })
          }) : null
        })
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: {
          size: [w2, h2],
          isLocked
        }
      } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime70.jsx)("rect", {
        width: w2,
        height: h2,
        fill: "transparent",
        rx: 8,
        ry: 8,
        strokeDasharray: isLocked ? "8 2" : "undefined"
      });
    }));
    __publicField(this, "onResetBounds", (info) => {
      const height = this.getAutoResizeHeight();
      if (height !== null && Math.abs(height - this.props.size[1]) > 1) {
        this.update({
          size: [this.props.size[0], height]
        });
        this.initialHeightCalculated = true;
      }
      return this;
    });
    __publicField(this, "onResize", (initialProps, info) => {
      var _a3;
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
      const height = (_a3 = this.getAutoResizeHeight()) != null ? _a3 : bounds.height;
      return this.update({
        point: [bounds.minX, bounds.minY],
        size: [Math.max(1, bounds.width), Math.max(1, height)],
        scale: nextScale,
        rotation
      });
    });
    __publicField(this, "validateProps", (props) => {
      if (props.size !== void 0) {
        props.size[0] = Math.min(Math.max(props.size[0], 300), 550);
        props.size[1] = Math.max(props.size[1], 1);
      }
      return withClampedStyles(this, props);
    });
  }
  get embedId() {
    var _a3, _b;
    const url = this.props.url;
    const match = url.match(X_OR_TWITTER_REGEX);
    const embedId = (_b = (_a3 = match == null ? void 0 : match[1]) != null ? _a3 : url) != null ? _b : "";
    return embedId;
  }
  useComponentSize(ref, selector = "") {
    const [size, setSize] = React56.useState([0, 0]);
    const app = useApp();
    React56.useEffect(() => {
      if (ref == null ? void 0 : ref.current) {
        const el = selector ? ref.current.querySelector(selector) : ref.current;
        if (el) {
          const updateSize = () => {
            const { width, height } = el.getBoundingClientRect();
            const bound = src_default.div([width, height], app.viewport.camera.zoom);
            setSize(bound);
            return bound;
          };
          updateSize();
          this.getInnerHeight = () => updateSize()[1];
          const resizeObserver = new ResizeObserver(() => {
            updateSize();
          });
          resizeObserver.observe(el);
          return () => {
            resizeObserver.disconnect();
          };
        }
      }
      return () => {
      };
    }, [ref, selector]);
    return size;
  }
  getAutoResizeHeight() {
    if (this.getInnerHeight) {
      return this.getInnerHeight();
    }
    return null;
  }
  getShapeSVGJsx() {
    const bounds = this.getBounds();
    const embedId = this.embedId;
    if (embedId) {
      return /* @__PURE__ */ (0, import_jsx_runtime70.jsxs)("g", {
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime70.jsx)("rect", {
            width: bounds.width,
            height: bounds.height,
            fill: "#15202b",
            rx: 8,
            ry: 8
          }),
          /* @__PURE__ */ (0, import_jsx_runtime70.jsx)("svg", {
            x: bounds.width / 4,
            y: bounds.height / 4,
            width: bounds.width / 2,
            height: bounds.height / 2,
            viewBox: "0 0 15 15",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
            children: /* @__PURE__ */ (0, import_jsx_runtime70.jsx)("path", {
              d: "m13.464 4.4401c0.0091 0.13224 0.0091 0.26447 0.0091 0.39793 0 4.0664-3.0957 8.7562-8.7562 8.7562v-0.0024c-1.6721 0.0024-3.3095-0.47658-4.7172-1.3797 0.24314 0.02925 0.48751 0.04387 0.73248 0.04448 1.3857 0.0013 2.7319-0.46374 3.8221-1.3199-1.3169-0.024981-2.4717-0.8836-2.8751-2.1371 0.4613 0.08897 0.93662 0.070688 1.3894-0.053016-1.4357-0.29007-2.4686-1.5515-2.4686-3.0165v-0.039001c0.42779 0.23827 0.90676 0.37051 1.3967 0.38513-1.3522-0.90372-1.769-2.7026-0.95247-4.1091 1.5625 1.9226 3.8678 3.0914 6.3425 3.2151-0.24802-1.0689 0.090798-2.1889 0.89031-2.9403 1.2395-1.1651 3.1889-1.1054 4.3541 0.13346 0.68921-0.13589 1.3498-0.38879 1.9543-0.74711-0.22974 0.71237-0.71054 1.3175-1.3528 1.702 0.60999-0.071907 1.206-0.23522 1.7672-0.48446-0.41316 0.61913-0.93358 1.1584-1.5356 1.5942z",
              fill: "#1d9bf0",
              fillRule: "evenodd",
              clipRule: "evenodd"
            })
          })
        ]
      });
    }
    return super.getShapeSVGJsx({});
  }
};
var TweetShape = _TweetShape;
__publicField(TweetShape, "id", "tweet");
__publicField(TweetShape, "defaultProps", {
  id: "tweet",
  type: "tweet",
  parentId: "page",
  point: [0, 0],
  size: [331, 290],
  url: ""
});
__decorateClass([
  computed
], TweetShape.prototype, "embedId", 1);
__decorateClass([
  action
], TweetShape.prototype, "onTwitterLinkChange", 2);

// src/lib/shapes/PdfShape.tsx
var React57 = __toESM(require("react"));
var import_jsx_runtime71 = require("react/jsx-runtime");
var PdfShape = class extends TLBoxShape {
  constructor() {
    super(...arguments);
    __publicField(this, "frameRef", React57.createRef());
    __publicField(this, "canChangeAspectRatio", true);
    __publicField(this, "canFlip", true);
    __publicField(this, "canEdit", true);
    __publicField(this, "ReactComponent", observer(({ events, asset, isErasing, isEditing }) => {
      const ref = React57.useRef(null);
      const { handlers } = React57.useContext(LogseqContext);
      const app = useApp();
      const isMoving = useCameraMovingRef();
      return /* @__PURE__ */ (0, import_jsx_runtime71.jsx)(HTMLContainer, __spreadProps(__spreadValues({
        style: {
          overflow: "hidden",
          pointerEvents: "all",
          opacity: isErasing ? 0.2 : 1
        }
      }, events), {
        children: asset ? /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("embed", {
          src: handlers ? handlers.inflateAsset(asset.src).url : asset.src,
          className: "relative tl-pdf-container",
          onWheelCapture: stop,
          onPointerDown: stop,
          onPointerUp: stop,
          style: {
            width: "100%",
            height: "100%",
            pointerEvents: !isMoving && isEditing ? "all" : "none"
          }
        }) : null
      }));
    }));
    __publicField(this, "ReactIndicator", observer(() => {
      const {
        props: {
          size: [w2, h2],
          isLocked
        }
      } = this;
      return /* @__PURE__ */ (0, import_jsx_runtime71.jsx)("rect", {
        width: w2,
        height: h2,
        fill: "transparent",
        rx: 8,
        ry: 8,
        strokeDasharray: isLocked ? "8 2" : "undefined"
      });
    }));
  }
};
__publicField(PdfShape, "id", "pdf");
__publicField(PdfShape, "defaultProps", {
  id: "pdf",
  type: "pdf",
  parentId: "page",
  point: [0, 0],
  size: [595, 842],
  assetId: ""
});

// src/lib/shapes/DotShape.tsx
var import_jsx_runtime72 = require("react/jsx-runtime");

// src/lib/shapes/index.ts
var shapes = [
  BoxShape,
  EllipseShape,
  HighlighterShape,
  ImageShape,
  VideoShape,
  LineShape,
  PencilShape,
  PolygonShape,
  TextShape,
  YouTubeShape,
  TweetShape,
  IFrameShape,
  HTMLShape,
  PdfShape,
  LogseqPortalShape,
  GroupShape
];

// src/lib/tools/BoxTool.tsx
var BoxTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", BoxShape);
  }
};
__publicField(BoxTool, "id", "box");
__publicField(BoxTool, "shortcut", "whiteboard/rectangle");

// src/lib/tools/EllipseTool.tsx
var EllipseTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", EllipseShape);
  }
};
__publicField(EllipseTool, "id", "ellipse");
__publicField(EllipseTool, "shortcut", "whiteboard/ellipse");

// src/lib/tools/EraseTool.tsx
var NuEraseTool = class extends TLEraseTool {
};
__publicField(NuEraseTool, "id", "erase");
__publicField(NuEraseTool, "shortcut", "whiteboard/eraser");

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
__publicField(HighlighterTool, "shortcut", "whiteboard/highlighter");

// src/lib/tools/LineTool.tsx
var LineTool = class extends TLLineTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", LineShape);
  }
};
__publicField(LineTool, "id", "line");
__publicField(LineTool, "shortcut", "whiteboard/connector");

// src/lib/tools/PencilTool.tsx
var PencilTool = class extends TLDrawTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", PencilShape);
    __publicField(this, "simplify", false);
  }
};
__publicField(PencilTool, "id", "pencil");
__publicField(PencilTool, "shortcut", "whiteboard/pencil");

// src/lib/tools/PolygonTool.tsx
var PolygonTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", PolygonShape);
  }
};
__publicField(PolygonTool, "id", "polygon");

// src/lib/tools/TextTool.tsx
var TextTool = class extends TLTextTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", TextShape);
  }
};
__publicField(TextTool, "id", "text");
__publicField(TextTool, "shortcut", "whiteboard/text");

// src/lib/tools/YouTubeTool.tsx
var YouTubeTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", YouTubeShape);
  }
};
__publicField(YouTubeTool, "id", "youtube");

// src/lib/tools/LogseqPortalTool/states/CreatingState.tsx
var CreatingState6 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "creatingShape");
    __publicField(this, "offset", [0, 0]);
    __publicField(this, "onEnter", () => {
      this.app.history.pause();
      transaction(() => {
        let point = src_default.sub(this.app.inputs.originPoint, this.offset);
        if (this.app.settings.snapToGrid) {
          point = src_default.snap(point, GRID_SIZE);
        }
        const shape = new LogseqPortalShape({
          id: uniqueId(),
          parentId: this.app.currentPage.id,
          point,
          size: LogseqPortalShape.defaultProps.size,
          fill: this.app.settings.color,
          stroke: this.app.settings.color
        });
        this.creatingShape = shape;
        this.app.currentPage.addShapes(shape);
        this.app.setEditingShape(shape);
        this.app.setSelectedShapes([shape]);
      });
    });
    __publicField(this, "onPointerDown", (info) => {
      switch (info.type) {
        case "shape" /* Shape */: {
          if (info.shape === this.creatingShape)
            return;
          this.app.selectTool("select");
          break;
        }
        case "selection" /* Selection */: {
          break;
        }
        case "handle" /* Handle */: {
          break;
        }
        case "canvas" /* Canvas */: {
          if (!info.order) {
            this.app.selectTool("select");
          }
          break;
        }
      }
    });
    __publicField(this, "onExit", () => {
      var _a3;
      if (!this.creatingShape)
        return;
      this.app.history.resume();
      if ((_a3 = this.creatingShape) == null ? void 0 : _a3.props.pageId) {
        this.app.setSelectedShapes([this.creatingShape.id]);
      } else {
        this.app.deleteShapes([this.creatingShape.id]);
        this.app.setEditingShape();
      }
      this.creatingShape = void 0;
    });
  }
};
__publicField(CreatingState6, "id", "creating");

// src/lib/tools/LogseqPortalTool/states/IdleState.tsx
var IdleState9 = class extends TLToolState {
  constructor() {
    super(...arguments);
    __publicField(this, "cursor", "crosshair" /* Cross */);
    __publicField(this, "onPointerDown", (e) => {
      this.tool.transition("creating");
    });
  }
};
__publicField(IdleState9, "id", "idle");

// src/lib/tools/LogseqPortalTool/LogseqPortalTool.tsx
var LogseqPortalTool = class extends TLTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", LogseqPortalShape);
    __publicField(this, "onPinch", (info) => {
      this.app.viewport.pinchZoom(info.point, info.delta, info.delta[2]);
    });
  }
};
__publicField(LogseqPortalTool, "id", "logseq-portal");
__publicField(LogseqPortalTool, "shortcut", "whiteboard/portal");
__publicField(LogseqPortalTool, "states", [IdleState9, CreatingState6]);
__publicField(LogseqPortalTool, "initial", "idle");

// src/lib/tools/HTMLTool.tsx
var HTMLTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", HTMLShape);
  }
};
__publicField(HTMLTool, "id", "youtube");

// src/lib/tools/IFrameTool.tsx
var IFrameTool = class extends TLBoxTool {
  constructor() {
    super(...arguments);
    __publicField(this, "Shape", IFrameShape);
  }
};
__publicField(IFrameTool, "id", "iframe");

// src/lib/preview-manager.tsx
var import_server = __toESM(require("react-dom/server"));
var import_jsx_runtime73 = require("react/jsx-runtime");
var SVG_EXPORT_PADDING = 16;
var ShapesMap = new Map(shapes.map((shape) => [shape.id, shape]));
var getShapeClass = (type) => {
  if (!type)
    throw Error("No shape type provided.");
  const Shape5 = ShapesMap.get(type);
  if (!Shape5)
    throw Error(`Could not find shape class for ${type}`);
  return Shape5;
};
var PreviewManager = class {
  constructor(serializedApp) {
    __publicField(this, "shapes");
    __publicField(this, "pageId");
    __publicField(this, "assets");
    if (serializedApp) {
      this.load(serializedApp);
    }
  }
  load(snapshot) {
    var _a3;
    const page = (_a3 = snapshot == null ? void 0 : snapshot.pages) == null ? void 0 : _a3[0];
    this.pageId = page == null ? void 0 : page.id;
    this.assets = snapshot.assets;
    this.shapes = page == null ? void 0 : page.shapes.map((s2) => {
      const ShapeClass = getShapeClass(s2.type);
      return new ShapeClass(s2);
    }).filter((s2) => s2.type !== "group");
  }
  generatePreviewJsx(viewport, ratio) {
    var _a3, _b;
    const allBounds = [...((_a3 = this.shapes) != null ? _a3 : []).map((s2) => s2.getRotatedBounds())];
    const vBounds = viewport == null ? void 0 : viewport.currentView;
    if (vBounds) {
      allBounds.push(vBounds);
    }
    let commonBounds = BoundsUtils.getCommonBounds(allBounds);
    if (!commonBounds) {
      return null;
    }
    commonBounds = BoundsUtils.expandBounds(commonBounds, SVG_EXPORT_PADDING);
    commonBounds = ratio ? BoundsUtils.ensureRatio(commonBounds, ratio) : commonBounds;
    const translatePoint = (p2) => {
      return [(p2[0] - commonBounds.minX).toFixed(2), (p2[1] - commonBounds.minY).toFixed(2)];
    };
    const [vx, vy] = vBounds ? translatePoint([vBounds.minX, vBounds.minY]) : [0, 0];
    const svgElement = commonBounds && /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      "data-common-bound-x": commonBounds.minX.toFixed(2),
      "data-common-bound-y": commonBounds.minY.toFixed(2),
      "data-common-bound-width": commonBounds.width.toFixed(2),
      "data-common-bound-height": commonBounds.height.toFixed(2),
      viewBox: [0, 0, commonBounds.width, commonBounds.height].join(" "),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("defs", {
          children: vBounds && /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)(import_jsx_runtime73.Fragment, {
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("rect", {
                id: this.pageId + "-camera-rect",
                transform: `translate(${vx}, ${vy})`,
                width: vBounds.width,
                height: vBounds.height
              }),
              /* @__PURE__ */ (0, import_jsx_runtime73.jsxs)("mask", {
                id: this.pageId + "-camera-mask",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("rect", {
                    width: commonBounds.width,
                    height: commonBounds.height,
                    fill: "white"
                  }),
                  /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("use", {
                    href: `#${this.pageId}-camera-rect`,
                    fill: "black"
                  })
                ]
              })
            ]
          })
        }),
        /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("g", {
          id: this.pageId + "-preview-shapes",
          children: (_b = this.shapes) == null ? void 0 : _b.map((s2) => {
            var _a4, _b2;
            const {
              bounds,
              props: { rotation }
            } = s2;
            const [tx, ty] = translatePoint([bounds.minX, bounds.minY]);
            const r2 = +(((rotation != null ? rotation : 0) + ((_a4 = bounds.rotation) != null ? _a4 : 0)) * 180 / Math.PI).toFixed(2);
            const [rdx, rdy] = [(bounds.width / 2).toFixed(2), (bounds.height / 2).toFixed(2)];
            const transformArr = [`translate(${tx}, ${ty})`, `rotate(${r2}, ${rdx}, ${rdy})`];
            return /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("g", {
              transform: transformArr.join(" "),
              children: s2.getShapeSVGJsx({
                assets: (_b2 = this.assets) != null ? _b2 : []
              })
            }, s2.id);
          })
        }),
        /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("rect", {
          mask: vBounds ? `url(#${this.pageId}-camera-mask)` : "",
          width: commonBounds.width,
          height: commonBounds.height,
          fill: "transparent"
        }),
        vBounds && /* @__PURE__ */ (0, import_jsx_runtime73.jsx)("use", {
          id: "minimap-camera-rect",
          "data-x": vx,
          "data-y": vy,
          "data-width": vBounds.width,
          "data-height": vBounds.height,
          href: `#${this.pageId}-camera-rect`,
          fill: "transparent",
          stroke: "red",
          strokeWidth: 4 / viewport.camera.zoom
        })
      ]
    });
    return svgElement;
  }
  exportAsSVG(ratio) {
    const svgElement = this.generatePreviewJsx(void 0, ratio);
    return svgElement ? import_server.default.renderToString(svgElement) : "";
  }
};
function generateSVGFromModel(serializedApp, ratio = 4 / 3) {
  const preview = new PreviewManager(serializedApp);
  return preview.exportAsSVG(ratio);
}
function generateJSXFromModel(serializedApp, ratio = 4 / 3) {
  const preview = new PreviewManager(serializedApp);
  return preview.generatePreviewJsx(void 0, ratio);
}

// src/components/inputs/TextInput.tsx
var React58 = __toESM(require("react"));
var import_jsx_runtime74 = require("react/jsx-runtime");
var TextInput = React58.forwardRef(
  (_a3, ref) => {
    var _b = _a3, { autoResize = true, value, className } = _b, rest = __objRest(_b, ["autoResize", "value", "className"]);
    return /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("div", {
      className: "tl-input" + (className ? " " + className : ""),
      children: /* @__PURE__ */ (0, import_jsx_runtime74.jsxs)("div", {
        className: "tl-input-sizer",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("div", {
            className: "tl-input-hidden",
            children: value
          }),
          /* @__PURE__ */ (0, import_jsx_runtime74.jsx)("input", __spreadValues({
            ref,
            value,
            className: "tl-text-input",
            type: "text"
          }, rest))
        ]
      })
    });
  }
);

// src/components/QuickSearch/QuickSearch.tsx
var import_jsx_runtime75 = require("react/jsx-runtime");
var LogseqTypeTag = ({
  type,
  active
}) => {
  const nameMapping = {
    B: "block",
    P: "page",
    WP: "whiteboard",
    BA: "new-block",
    PA: "new-page",
    WA: "new-whiteboard",
    BS: "block-search",
    PS: "page-search"
  };
  return /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("span", {
    className: "tl-type-tag",
    "data-active": active,
    children: /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("i", {
      className: `tie tie-${nameMapping[type]}`
    })
  });
};
function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
var highlightedJSX = (input, keyword) => {
  return /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("span", {
    children: input.split(new RegExp(`(${escapeRegExp(keyword)})`, "gi")).map((part, index2) => {
      if (index2 % 2 === 1) {
        return /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("mark", {
          className: "tl-highlighted",
          children: part
        });
      }
      return part;
    }).map((frag, idx) => /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(import_react48.default.Fragment, {
      children: frag
    }, idx))
  });
};
var useSearch = (q2, searchFilter) => {
  const { handlers } = import_react48.default.useContext(LogseqContext);
  const [results, setResults] = import_react48.default.useState(null);
  const dq = useDebouncedValue(q2, 200);
  import_react48.default.useEffect(() => {
    let canceled = false;
    if (dq.length > 0) {
      const filter2 = { "pages?": true, "blocks?": true, "files?": false };
      if (searchFilter === "B") {
        filter2["pages?"] = false;
      } else if (searchFilter === "P") {
        filter2["blocks?"] = false;
      }
      handlers.search(dq, filter2).then((_results) => {
        if (!canceled) {
          setResults(_results);
        }
      });
    } else {
      setResults(null);
    }
    return () => {
      canceled = true;
    };
  }, [dq, handlers == null ? void 0 : handlers.search]);
  return results;
};
var LogseqQuickSearch = observer(
  ({ className, style, placeholder: placeholder2, onChange, onBlur, onAddBlock }) => {
    const [q2, setQ] = import_react48.default.useState(LogseqPortalShape.defaultSearchQuery);
    const [searchFilter, setSearchFilter] = import_react48.default.useState(
      LogseqPortalShape.defaultSearchFilter
    );
    const rInput = import_react48.default.useRef(null);
    const { handlers, renderers } = import_react48.default.useContext(LogseqContext);
    const t = handlers.t;
    const finishSearching = import_react48.default.useCallback((id3, isPage) => {
      var _a3;
      console.log({ id: id3, isPage });
      setTimeout(() => onChange(id3, isPage));
      (_a3 = rInput.current) == null ? void 0 : _a3.blur();
      if (id3) {
        LogseqPortalShape.defaultSearchQuery = "";
        LogseqPortalShape.defaultSearchFilter = null;
      }
    }, []);
    const handleAddBlock = import_react48.default.useCallback(
      (content) => __async(void 0, null, function* () {
        const uuid = yield handlers == null ? void 0 : handlers.addNewBlock(content);
        if (uuid) {
          finishSearching(uuid);
          onAddBlock == null ? void 0 : onAddBlock(uuid);
        }
        return uuid;
      }),
      [onAddBlock]
    );
    const optionsWrapperRef = import_react48.default.useRef(null);
    const [focusedOptionIdx, setFocusedOptionIdx] = import_react48.default.useState(0);
    const searchResult = useSearch(q2, searchFilter);
    const [prefixIcon, setPrefixIcon] = import_react48.default.useState("circle-plus");
    const [showPanel, setShowPanel] = import_react48.default.useState(false);
    import_react48.default.useEffect(() => {
      setTimeout(() => {
        var _a3;
        (_a3 = rInput.current) == null ? void 0 : _a3.focus();
      });
    }, [searchFilter]);
    import_react48.default.useEffect(() => {
      LogseqPortalShape.defaultSearchQuery = q2;
      LogseqPortalShape.defaultSearchFilter = searchFilter;
    }, [q2, searchFilter]);
    const options = import_react48.default.useMemo(() => {
      var _a3;
      const options2 = [];
      const Breadcrumb = renderers == null ? void 0 : renderers.Breadcrumb;
      if (!Breadcrumb || !handlers) {
        return [];
      }
      if (onAddBlock) {
        options2.push({
          actionIcon: "circle-plus",
          onChosen: () => {
            return !!handleAddBlock(q2);
          },
          element: /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("div", {
            className: "tl-quick-search-option-row",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(LogseqTypeTag, {
                active: true,
                type: "BA"
              }),
              q2.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)(import_jsx_runtime75.Fragment, {
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("strong", {
                    children: t("whiteboard/new-block")
                  }),
                  q2
                ]
              }) : /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("strong", {
                children: t("whiteboard/new-block-no-colon")
              })
            ]
          })
        });
      }
      if (!((_a3 = searchResult == null ? void 0 : searchResult.pages) == null ? void 0 : _a3.some((p2) => p2.title.toLowerCase() === q2.toLowerCase())) && q2) {
        options2.push(
          {
            actionIcon: "circle-plus",
            onChosen: () => __async(void 0, null, function* () {
              let result = yield handlers == null ? void 0 : handlers.addNewPage(q2);
              finishSearching(result, true);
              return true;
            }),
            element: /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("div", {
              className: "tl-quick-search-option-row",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(LogseqTypeTag, {
                  active: true,
                  type: "PA"
                }),
                /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("strong", {
                  children: t("whiteboard/new-page")
                }),
                q2
              ]
            })
          },
          {
            actionIcon: "circle-plus",
            onChosen: () => __async(void 0, null, function* () {
              let result = yield handlers == null ? void 0 : handlers.addNewWhiteboard(q2);
              finishSearching(result, true);
              return true;
            }),
            element: /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("div", {
              className: "tl-quick-search-option-row",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(LogseqTypeTag, {
                  active: true,
                  type: "WA"
                }),
                /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("strong", {
                  children: t("whiteboard/new-whiteboard")
                }),
                q2
              ]
            })
          }
        );
      }
      if (q2.length === 0 && searchFilter === null) {
        options2.push(
          {
            actionIcon: "search",
            onChosen: () => {
              setSearchFilter("B");
              return true;
            },
            element: /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("div", {
              className: "tl-quick-search-option-row",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(LogseqTypeTag, {
                  type: "BS"
                }),
                t("whiteboard/search-only-blocks")
              ]
            })
          },
          {
            actionIcon: "search",
            onChosen: () => {
              setSearchFilter("P");
              return true;
            },
            element: /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("div", {
              className: "tl-quick-search-option-row",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(LogseqTypeTag, {
                  type: "PS"
                }),
                t("whiteboard/search-only-pages")
              ]
            })
          }
        );
      }
      if ((!searchFilter || searchFilter === "P") && searchResult && searchResult.pages) {
        options2.push(
          ...searchResult.pages.map((page) => {
            return {
              actionIcon: "search",
              onChosen: () => {
                finishSearching(page.id, true);
                return true;
              },
              element: /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("div", {
                className: "tl-quick-search-option-row",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(LogseqTypeTag, {
                    type: handlers.isWhiteboardPage(page.id) ? "WP" : "P"
                  }),
                  highlightedJSX(page.title, q2)
                ]
              })
            };
          })
        );
      }
      if ((!searchFilter || searchFilter === "B") && searchResult && searchResult.blocks) {
        options2.push(
          ...searchResult.blocks.filter((block) => block.title && block.uuid).map(({ title, uuid }) => {
            const block = handlers.queryBlockByUUID(uuid);
            return {
              actionIcon: "search",
              onChosen: () => {
                var _a4, _b, _c;
                if (block) {
                  finishSearching(uuid);
                  (_c = (_b = (_a4 = window.logseq) == null ? void 0 : _a4.api) == null ? void 0 : _b.set_blocks_id) == null ? void 0 : _c.call(_b, [uuid]);
                  return true;
                }
                return false;
              },
              element: /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(import_jsx_runtime75.Fragment, {
                children: /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("div", {
                  className: "tl-quick-search-option-row",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(LogseqTypeTag, {
                      type: "B"
                    }),
                    highlightedJSX(title, q2)
                  ]
                })
              })
            };
          })
        );
      }
      return options2;
    }, [q2, searchFilter, searchResult, renderers == null ? void 0 : renderers.Breadcrumb, handlers]);
    import_react48.default.useEffect(() => {
      const keydownListener = (e) => {
        var _a3, _b;
        let newIndex = focusedOptionIdx;
        if (e.key === "ArrowDown") {
          newIndex = Math.min(options.length - 1, focusedOptionIdx + 1);
        } else if (e.key === "ArrowUp") {
          newIndex = Math.max(0, focusedOptionIdx - 1);
        } else if (e.key === "Enter") {
          (_a3 = options[focusedOptionIdx]) == null ? void 0 : _a3.onChosen();
          e.stopPropagation();
          e.preventDefault();
        } else if (e.key === "Backspace" && q2.length === 0) {
          setSearchFilter(null);
        } else if (e.key === "Escape") {
          finishSearching("");
        }
        if (newIndex !== focusedOptionIdx) {
          const option = options[newIndex];
          setFocusedOptionIdx(newIndex);
          setPrefixIcon(option.actionIcon);
          e.stopPropagation();
          e.preventDefault();
          const optionElement = (_b = optionsWrapperRef.current) == null ? void 0 : _b.querySelector(
            ".tl-quick-search-option:nth-child(" + (newIndex + 1) + ")"
          );
          if (optionElement) {
            optionElement == null ? void 0 : optionElement.scrollIntoViewIfNeeded(false);
          }
        }
      };
      document.addEventListener("keydown", keydownListener, true);
      return () => {
        document.removeEventListener("keydown", keydownListener, true);
      };
    }, [options, focusedOptionIdx, q2]);
    return /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("div", {
      className: "tl-quick-search " + (className != null ? className : ""),
      style,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(CircleButton, {
          icon: prefixIcon,
          onClick: () => {
            var _a3;
            (_a3 = options[focusedOptionIdx]) == null ? void 0 : _a3.onChosen();
          }
        }),
        /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("div", {
          className: "tl-quick-search-input-container",
          children: [
            searchFilter && /* @__PURE__ */ (0, import_jsx_runtime75.jsxs)("div", {
              className: "tl-quick-search-input-filter",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(LogseqTypeTag, {
                  type: searchFilter
                }),
                searchFilter === "B" ? "Search blocks" : "Search pages",
                /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("div", {
                  className: "tl-quick-search-input-filter-remove",
                  onClick: () => setSearchFilter(null),
                  children: /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(TablerIcon, {
                    name: "x"
                  })
                })
              ]
            }),
            /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(TextInput, {
              ref: rInput,
              type: "text",
              value: q2,
              className: "tl-quick-search-input",
              placeholder: placeholder2 != null ? placeholder2 : "Create or search your graph...",
              onChange: (q3) => setQ(q3.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  finishSearching(q2);
                }
                e.stopPropagation();
              },
              onFocus: () => {
                setShowPanel(true);
              },
              onBlur: () => {
                setShowPanel(false);
                onBlur == null ? void 0 : onBlur();
              }
            })
          ]
        }),
        options.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("div", {
          onWheelCapture: (e) => e.stopPropagation(),
          className: "tl-quick-search-options",
          ref: optionsWrapperRef,
          style: {
            visibility: showPanel ? "visible" : "hidden",
            pointerEvents: showPanel ? "all" : "none"
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(cn, {
            style: { height: Math.min(Math.max(1, options.length), 12) * 40 },
            totalCount: options.length,
            itemContent: (index2) => {
              const { actionIcon, onChosen, element } = options[index2];
              return /* @__PURE__ */ (0, import_jsx_runtime75.jsx)("div", {
                "data-focused": index2 === focusedOptionIdx,
                className: "tl-quick-search-option",
                tabIndex: 0,
                onMouseEnter: () => {
                  setPrefixIcon(actionIcon);
                  setFocusedOptionIdx(index2);
                },
                onPointerDownCapture: (e) => {
                  if (onChosen()) {
                    e.stopPropagation();
                    e.preventDefault();
                  }
                },
                children: element
              }, index2);
            }
          })
        })
      ]
    });
  }
);

// src/components/inputs/ShapeLinksInput.tsx
var import_jsx_runtime76 = require("react/jsx-runtime");
function ShapeLinkItem({
  id: id3,
  type,
  onRemove,
  showContent
}) {
  const app = useApp();
  const { handlers } = import_react50.default.useContext(LogseqContext);
  const t = handlers.t;
  return /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", {
    className: "tl-shape-links-panel-item color-level relative",
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("div", {
        className: "whitespace-pre break-all overflow-hidden text-ellipsis inline-flex",
        children: /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(BlockLink, {
          id: id3,
          showReferenceContent: showContent
        })
      }),
      /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("div", {
        className: "flex-1"
      }),
      handlers.getBlockPageName(id3) !== app.currentPage.name && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(Button, {
        tooltip: t("whiteboard/open-page"),
        type: "button",
        onClick: () => handlers == null ? void 0 : handlers.redirectToPage(id3),
        children: /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(TablerIcon, {
          name: "open-as-page"
        })
      }),
      /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(Button, {
        tooltip: t("whiteboard/open-page-in-sidebar"),
        type: "button",
        onClick: () => handlers == null ? void 0 : handlers.sidebarAddBlock(id3, type === "B" ? "block" : "page"),
        children: /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(TablerIcon, {
          name: "move-to-sidebar-right"
        })
      }),
      onRemove && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(Button, {
        className: "tl-shape-links-panel-item-remove-button",
        tooltip: t("whiteboard/remove-link"),
        type: "button",
        onClick: onRemove,
        children: /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(TablerIcon, {
          name: "x",
          className: "!translate-y-0"
        })
      })
    ]
  });
}
var ShapeLinksInput = observer(function ShapeLinksInput2(_a3) {
  var _b = _a3, {
    pageId,
    portalType,
    shapeType,
    refs,
    side,
    onRefsChange
  } = _b, rest = __objRest(_b, [
    "pageId",
    "portalType",
    "shapeType",
    "refs",
    "side",
    "onRefsChange"
  ]);
  const {
    handlers: { t }
  } = import_react50.default.useContext(LogseqContext);
  const noOfLinks = refs.length + (pageId ? 1 : 0);
  const canAddLink = refs.length === 0;
  const addNewRef = (value) => {
    if (value && !refs.includes(value) && canAddLink) {
      onRefsChange([...refs, value]);
    }
  };
  const showReferencePanel = !!(pageId && portalType);
  return /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(PopoverButton, __spreadProps(__spreadValues({}, rest), {
    side,
    align: "start",
    alignOffset: -6,
    label: /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(Tooltip, {
      content: t("whiteboard/link"),
      sideOffset: 14,
      children: /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", {
        className: "flex gap-1 relative items-center justify-center px-1",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(TablerIcon, {
            name: noOfLinks > 0 ? "link" : "add-link"
          }),
          noOfLinks > 0 && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("div", {
            className: "tl-shape-links-count",
            children: noOfLinks
          })
        ]
      })
    }),
    children: /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", {
      className: "color-level rounded-lg",
      "data-show-reference-panel": showReferencePanel,
      children: [
        showReferencePanel && /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", {
          className: "tl-shape-links-reference-panel",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", {
              className: "text-base inline-flex gap-1 items-center",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(TablerIcon, {
                  className: "opacity-50",
                  name: "internal-link"
                }),
                t("whiteboard/references")
              ]
            }),
            /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(ShapeLinkItem, {
              type: portalType,
              id: pageId
            })
          ]
        }),
        /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", {
          className: "tl-shape-links-panel color-level",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)("div", {
              className: "text-base inline-flex gap-1 items-center",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(TablerIcon, {
                  className: "opacity-50",
                  name: "add-link"
                }),
                t("whiteboard/link-to-any-page-or-block")
              ]
            }),
            canAddLink && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(LogseqQuickSearch, {
              style: {
                width: "calc(100% - 46px)",
                marginLeft: "46px"
              },
              placeholder: t("whiteboard/start-typing-to-search"),
              onChange: addNewRef
            }),
            refs.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("div", {
              className: "flex flex-col items-stretch gap-2",
              children: refs.map((ref, i2) => {
                return /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(ShapeLinkItem, {
                  id: ref,
                  type: validUUID(ref) ? "B" : "P",
                  onRemove: () => {
                    onRefsChange(refs.filter((_2, j2) => i2 !== j2));
                  },
                  showContent: true
                }, ref);
              })
            })
          ]
        })
      ]
    })
  }));
});

// src/components/inputs/ToggleGroupInput.tsx
var import_jsx_runtime77 = require("react/jsx-runtime");
var LSUI10 = window.LSUI;
function ToggleGroupInput({ options, value, onValueChange }) {
  return /* @__PURE__ */ (0, import_jsx_runtime77.jsx)(LSUI10.ToggleGroup, {
    type: "single",
    value,
    onValueChange,
    children: options.map((option) => {
      return /* @__PURE__ */ (0, import_jsx_runtime77.jsx)(Tooltip, {
        content: option.tooltip,
        children: /* @__PURE__ */ (0, import_jsx_runtime77.jsx)("div", {
          className: "inline-flex",
          children: /* @__PURE__ */ (0, import_jsx_runtime77.jsx)(LSUI10.ToggleGroupItem, {
            className: "tl-button",
            value: option.value,
            disabled: option.value === value,
            children: /* @__PURE__ */ (0, import_jsx_runtime77.jsx)(TablerIcon, {
              name: option.icon
            })
          })
        })
      }, option.value);
    })
  });
}
function ToggleGroupMultipleInput({
  options,
  value,
  onValueChange
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime77.jsx)(LSUI10.ToggleGroup, {
    className: "inline-flex",
    type: "multiple",
    value,
    onValueChange,
    children: options.map((option) => {
      return /* @__PURE__ */ (0, import_jsx_runtime77.jsx)(LSUI10.ToggleGroupItem, {
        className: "tl-button",
        value: option.value,
        children: /* @__PURE__ */ (0, import_jsx_runtime77.jsx)(TablerIcon, {
          name: option.icon
        })
      }, option.value);
    })
  });
}

// src/components/ContextBar/contextBarActionFactory.tsx
var import_jsx_runtime78 = require("react/jsx-runtime");
var contextBarActionTypes = [
  "EditPdf",
  "LogseqPortalViewMode",
  "Geometry",
  "AutoResizing",
  "Swatch",
  "NoFill",
  "StrokeType",
  "ScaleLevel",
  "TextStyle",
  "YoutubeLink",
  "TwitterLink",
  "IFrameSource",
  "ArrowMode",
  "Links"
];
var singleShapeActions = [
  "YoutubeLink",
  "TwitterLink",
  "IFrameSource",
  "Links",
  "EditPdf"
];
var contextBarActionMapping = /* @__PURE__ */ new Map();
var shapeMapping = {
  "logseq-portal": ["Swatch", "LogseqPortalViewMode", "ScaleLevel", "AutoResizing", "Links"],
  youtube: ["YoutubeLink", "Links"],
  tweet: ["TwitterLink", "Links"],
  iframe: ["IFrameSource", "Links"],
  box: ["Geometry", "TextStyle", "Swatch", "ScaleLevel", "NoFill", "StrokeType", "Links"],
  ellipse: ["Geometry", "TextStyle", "Swatch", "ScaleLevel", "NoFill", "StrokeType", "Links"],
  polygon: ["Geometry", "TextStyle", "Swatch", "ScaleLevel", "NoFill", "StrokeType", "Links"],
  line: ["TextStyle", "Swatch", "ScaleLevel", "ArrowMode", "Links"],
  pencil: ["Swatch", "Links", "ScaleLevel"],
  highlighter: ["Swatch", "Links", "ScaleLevel"],
  text: ["TextStyle", "Swatch", "ScaleLevel", "AutoResizing", "Links"],
  html: ["ScaleLevel", "AutoResizing", "Links"],
  image: ["Links"],
  video: ["Links"],
  pdf: ["EditPdf", "Links"]
};
var withFillShapes = Object.entries(shapeMapping).filter(([key, types]) => {
  return types.includes("NoFill") && types.includes("Swatch");
}).map(([key]) => key);
function filterShapeByAction(type) {
  const app = useApp();
  const unlockedSelectedShapes = app.selectedShapesArray.filter((s2) => !s2.props.isLocked);
  return unlockedSelectedShapes.filter((shape) => {
    var _a3;
    return (_a3 = shapeMapping[shape.props.type]) == null ? void 0 : _a3.includes(type);
  });
}
var AutoResizingAction = observer(() => {
  const app = useApp();
  const {
    handlers: { t }
  } = import_react52.default.useContext(LogseqContext);
  const shapes2 = filterShapeByAction("AutoResizing");
  const pressed = shapes2.every((s2) => s2.props.isAutoResizing);
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(ToggleInput, {
    tooltip: t("whiteboard/auto-resize"),
    toggle: shapes2.every((s2) => s2.props.type === "logseq-portal"),
    className: "tl-button",
    pressed,
    onPressedChange: (v2) => {
      shapes2.forEach((s2) => {
        if (s2.props.type === "logseq-portal") {
          s2.update({
            isAutoResizing: v2
          });
        } else {
          s2.onResetBounds({ zoom: app.viewport.camera.zoom });
        }
      });
      app.persist();
    },
    children: /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TablerIcon, {
      name: "dimensions"
    })
  });
});
var LogseqPortalViewModeAction = observer(() => {
  const app = useApp();
  const {
    handlers: { t }
  } = import_react52.default.useContext(LogseqContext);
  const shapes2 = filterShapeByAction("LogseqPortalViewMode");
  const collapsed = shapes2.every((s2) => s2.collapsed);
  if (!collapsed && !shapes2.every((s2) => !s2.collapsed)) {
    return null;
  }
  const tooltip = /* @__PURE__ */ (0, import_jsx_runtime78.jsxs)("div", {
    className: "flex",
    children: [
      collapsed ? t("whiteboard/expand") : t("whiteboard/collapse"),
      /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(KeyboardShortcut, {
        action: collapsed ? "editor/expand-block-children" : "editor/collapse-block-children"
      })
    ]
  });
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(ToggleInput, {
    tooltip,
    toggle: shapes2.every((s2) => s2.props.type === "logseq-portal"),
    className: "tl-button",
    pressed: collapsed,
    onPressedChange: () => app.api.setCollapsed(!collapsed),
    children: /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TablerIcon, {
      name: collapsed ? "object-expanded" : "object-compact"
    })
  });
});
var ScaleLevelAction = observer(() => {
  const {
    handlers: { isMobile }
  } = import_react52.default.useContext(LogseqContext);
  const shapes2 = filterShapeByAction("ScaleLevel");
  const scaleLevel = new Set(shapes2.map((s2) => s2.scaleLevel)).size > 1 ? "" : shapes2[0].scaleLevel;
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(ScaleInput, {
    scaleLevel,
    compact: isMobile()
  });
});
var IFrameSourceAction = observer(() => {
  const app = useApp();
  const {
    handlers: { t }
  } = import_react52.default.useContext(LogseqContext);
  const shape = filterShapeByAction("IFrameSource")[0];
  const handleChange = import_react52.default.useCallback((e) => {
    shape.onIFrameSourceChange(e.target.value.trim().toLowerCase());
    app.persist();
  }, []);
  const handleReload = import_react52.default.useCallback(() => {
    shape.reload();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsxs)("span", {
    className: "flex gap-3",
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(Button, {
        tooltip: t("whiteboard/reload"),
        type: "button",
        onClick: handleReload,
        children: /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TablerIcon, {
          name: "refresh"
        })
      }),
      /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TextInput, {
        title: t("whiteboard/website-url"),
        className: "tl-iframe-src",
        value: `${shape.props.url}`,
        onChange: handleChange
      }),
      /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(Button, {
        tooltip: t("whiteboard/open-website-url"),
        type: "button",
        onClick: () => window.open(shape.props.url),
        children: /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TablerIcon, {
          name: "external-link"
        })
      })
    ]
  });
});
var YoutubeLinkAction = observer(() => {
  const app = useApp();
  const {
    handlers: { t }
  } = import_react52.default.useContext(LogseqContext);
  const shape = filterShapeByAction("YoutubeLink")[0];
  const handleChange = import_react52.default.useCallback((e) => {
    shape.onYoutubeLinkChange(e.target.value);
    app.persist();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsxs)("span", {
    className: "flex gap-3",
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TextInput, {
        title: t("whiteboard/youtube-url"),
        className: "tl-youtube-link",
        value: `${shape.props.url}`,
        onChange: handleChange
      }),
      /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(Button, {
        tooltip: t("whiteboard/open-youtube-url"),
        type: "button",
        onClick: () => {
          var _a3, _b, _c;
          return (_c = (_b = (_a3 = window.logseq) == null ? void 0 : _a3.api) == null ? void 0 : _b.open_external_link) == null ? void 0 : _c.call(_b, shape.props.url);
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TablerIcon, {
          name: "external-link"
        })
      })
    ]
  });
});
var TwitterLinkAction = observer(() => {
  const app = useApp();
  const {
    handlers: { t }
  } = import_react52.default.useContext(LogseqContext);
  const shape = filterShapeByAction("TwitterLink")[0];
  const handleChange = import_react52.default.useCallback((e) => {
    shape.onTwitterLinkChange(e.target.value);
    app.persist();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsxs)("span", {
    className: "flex gap-3",
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TextInput, {
        title: t("whiteboard/twitter-url"),
        className: "tl-twitter-link",
        value: `${shape.props.url}`,
        onChange: handleChange
      }),
      /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(Button, {
        tooltip: t("whiteboard/open-twitter-url"),
        type: "button",
        onClick: () => {
          var _a3, _b, _c;
          return (_c = (_b = (_a3 = window.logseq) == null ? void 0 : _a3.api) == null ? void 0 : _b.open_external_link) == null ? void 0 : _c.call(_b, shape.props.url);
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TablerIcon, {
          name: "external-link"
        })
      })
    ]
  });
});
var EditPdfAction = observer(() => {
  const app = useApp();
  const {
    handlers: { t, setCurrentPdf }
  } = import_react52.default.useContext(LogseqContext);
  const shape = app.selectedShapesArray[0];
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(Button, {
    tooltip: t("whiteboard/edit-pdf"),
    type: "button",
    onClick: () => setCurrentPdf(app.assets[shape.props.assetId].src),
    children: /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TablerIcon, {
      name: "edit"
    })
  });
});
var NoFillAction = observer(() => {
  const app = useApp();
  const {
    handlers: { t }
  } = import_react52.default.useContext(LogseqContext);
  const shapes2 = filterShapeByAction("NoFill");
  const handleChange = import_react52.default.useCallback((v2) => {
    app.selectedShapesArray.forEach((s2) => s2.update({ noFill: v2 }));
    app.persist();
  }, []);
  const noFill = shapes2.every((s2) => s2.props.noFill);
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(ToggleInput, {
    tooltip: t("whiteboard/fill"),
    className: "tl-button",
    pressed: noFill,
    onPressedChange: handleChange,
    children: /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TablerIcon, {
      name: noFill ? "droplet-off" : "droplet"
    })
  });
});
var SwatchAction = observer(() => {
  const app = useApp();
  const shapes2 = filterShapeByAction("Swatch");
  const handleSetColor = import_react52.default.useCallback((color2) => {
    app.selectedShapesArray.forEach((s2) => {
      s2.update({ fill: color2, stroke: color2 });
    });
    app.persist();
  }, []);
  const handleSetOpacity = import_react52.default.useCallback((opacity) => {
    app.selectedShapesArray.forEach((s2) => {
      s2.update({ opacity });
    });
    app.persist();
  }, []);
  const color = shapes2[0].props.noFill ? shapes2[0].props.stroke : shapes2[0].props.fill;
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(ColorInput, {
    popoverSide: "top",
    color,
    opacity: shapes2[0].props.opacity,
    setOpacity: handleSetOpacity,
    setColor: handleSetColor
  });
});
var GeometryAction = observer(() => {
  const app = useApp();
  const handleSetGeometry = import_react52.default.useCallback((e) => {
    const type = e.currentTarget.dataset.tool;
    app.api.convertShapes(type);
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(GeometryTools, {
    popoverSide: "top",
    chevron: false,
    setGeometry: handleSetGeometry
  });
});
var StrokeTypeAction = observer(() => {
  const app = useApp();
  const {
    handlers: { t }
  } = import_react52.default.useContext(LogseqContext);
  const shapes2 = filterShapeByAction("StrokeType");
  const StrokeTypeOptions = [
    {
      value: "line",
      icon: "circle",
      tooltip: "Solid"
    },
    {
      value: "dashed",
      icon: "circle-dashed",
      tooltip: "Dashed"
    }
  ];
  const value = shapes2.every((s2) => s2.props.strokeType === "dashed") ? "dashed" : shapes2.every((s2) => s2.props.strokeType === "line") ? "line" : "mixed";
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(ToggleGroupInput, {
    title: t("whiteboard/stroke-type"),
    options: StrokeTypeOptions,
    value,
    onValueChange: (v2) => {
      shapes2.forEach((shape) => {
        shape.update({
          strokeType: v2
        });
      });
      app.persist();
    }
  });
});
var ArrowModeAction = observer(() => {
  const app = useApp();
  const {
    handlers: { t }
  } = import_react52.default.useContext(LogseqContext);
  const shapes2 = filterShapeByAction("ArrowMode");
  const StrokeTypeOptions = [
    {
      value: "start",
      icon: "arrow-narrow-left"
    },
    {
      value: "end",
      icon: "arrow-narrow-right"
    }
  ];
  const startValue = shapes2.every((s2) => {
    var _a3;
    return ((_a3 = s2.props.decorations) == null ? void 0 : _a3.start) === "arrow" /* Arrow */;
  });
  const endValue = shapes2.every((s2) => {
    var _a3;
    return ((_a3 = s2.props.decorations) == null ? void 0 : _a3.end) === "arrow" /* Arrow */;
  });
  const value = [startValue ? "start" : null, endValue ? "end" : null].filter(isNonNullable);
  const valueToDecorations = (value2) => {
    return {
      start: value2.includes("start") ? "arrow" /* Arrow */ : null,
      end: value2.includes("end") ? "arrow" /* Arrow */ : null
    };
  };
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(ToggleGroupMultipleInput, {
    title: t("whiteboard/arrow-head"),
    options: StrokeTypeOptions,
    value,
    onValueChange: (v2) => {
      shapes2.forEach((shape) => {
        shape.update({
          decorations: valueToDecorations(v2)
        });
      });
      app.persist();
    }
  });
});
var TextStyleAction = observer(() => {
  const app = useApp();
  const {
    handlers: { t }
  } = import_react52.default.useContext(LogseqContext);
  const shapes2 = filterShapeByAction("TextStyle");
  const bold = shapes2.every((s2) => s2.props.fontWeight > 500);
  const italic = shapes2.every((s2) => s2.props.italic);
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsxs)("span", {
    className: "flex gap-1",
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(ToggleInput, {
        tooltip: t("whiteboard/bold"),
        className: "tl-button",
        pressed: bold,
        onPressedChange: (v2) => {
          shapes2.forEach((shape) => {
            shape.update({
              fontWeight: v2 ? 700 : 400
            });
            shape.onResetBounds();
          });
          app.persist();
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TablerIcon, {
          name: "bold"
        })
      }),
      /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(ToggleInput, {
        tooltip: t("whiteboard/italic"),
        className: "tl-button",
        pressed: italic,
        onPressedChange: (v2) => {
          shapes2.forEach((shape) => {
            shape.update({
              italic: v2
            });
            shape.onResetBounds();
          });
          app.persist();
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(TablerIcon, {
          name: "italic"
        })
      })
    ]
  });
});
var LinksAction = observer(() => {
  var _a3;
  const app = useApp();
  const shape = app.selectedShapesArray[0];
  const handleChange = (refs) => {
    shape.update({ refs });
    app.persist();
  };
  return /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(ShapeLinksInput, {
    onRefsChange: handleChange,
    refs: (_a3 = shape.props.refs) != null ? _a3 : [],
    shapeType: shape.props.type,
    side: "right",
    pageId: shape.props.type === "logseq-portal" ? shape.props.pageId : void 0,
    portalType: shape.props.type === "logseq-portal" ? shape.props.blockType : void 0
  });
});
contextBarActionMapping.set("Geometry", GeometryAction);
contextBarActionMapping.set("AutoResizing", AutoResizingAction);
contextBarActionMapping.set("LogseqPortalViewMode", LogseqPortalViewModeAction);
contextBarActionMapping.set("ScaleLevel", ScaleLevelAction);
contextBarActionMapping.set("YoutubeLink", YoutubeLinkAction);
contextBarActionMapping.set("TwitterLink", TwitterLinkAction);
contextBarActionMapping.set("IFrameSource", IFrameSourceAction);
contextBarActionMapping.set("NoFill", NoFillAction);
contextBarActionMapping.set("Swatch", SwatchAction);
contextBarActionMapping.set("StrokeType", StrokeTypeAction);
contextBarActionMapping.set("ArrowMode", ArrowModeAction);
contextBarActionMapping.set("TextStyle", TextStyleAction);
contextBarActionMapping.set("Links", LinksAction);
contextBarActionMapping.set("EditPdf", EditPdfAction);
var getContextBarActionTypes = (type) => {
  var _a3;
  return ((_a3 = shapeMapping[type]) != null ? _a3 : []).filter(isNonNullable);
};
var getContextBarActionsForShapes = (shapes2) => {
  const types = shapes2.map((s2) => s2.props.type);
  const actionTypes = new Set(shapes2.length > 0 ? getContextBarActionTypes(types[0]) : []);
  for (let i2 = 1; i2 < types.length && actionTypes.size > 0; i2++) {
    const otherActionTypes = getContextBarActionTypes(types[i2]);
    actionTypes.forEach((action2) => {
      if (!otherActionTypes.includes(action2)) {
        actionTypes.delete(action2);
      }
    });
  }
  if (shapes2.length > 1) {
    singleShapeActions.forEach((action2) => {
      if (actionTypes.has(action2)) {
        actionTypes.delete(action2);
      }
    });
  }
  return Array.from(actionTypes).sort((a3, b3) => contextBarActionTypes.indexOf(a3) - contextBarActionTypes.indexOf(b3)).map((action2) => contextBarActionMapping.get(action2));
};

// src/components/ContextBar/ContextBar.tsx
var import_jsx_runtime79 = require("react/jsx-runtime");
var LSUI11 = window.LSUI;
var _ContextBar = ({ shapes: shapes2, offsets, hidden }) => {
  const app = useApp();
  const rSize = React62.useRef(null);
  const rContextBar = React62.useRef(null);
  React62.useLayoutEffect(() => {
    setTimeout(() => {
      const elm = rContextBar.current;
      if (!elm)
        return;
      const { offsetWidth, offsetHeight } = elm;
      rSize.current = [offsetWidth, offsetHeight];
    });
  });
  React62.useLayoutEffect(() => {
    var _a3;
    const elm = rContextBar.current;
    if (!elm)
      return;
    const size = (_a3 = rSize.current) != null ? _a3 : [0, 0];
    const [x2, y2] = getContextBarTranslation(size, offsets);
    elm.style.transform = `translateX(${x2}px) translateY(${y2}px)`;
  }, [offsets]);
  if (!app)
    return null;
  const Actions = getContextBarActionsForShapes(shapes2);
  return /* @__PURE__ */ (0, import_jsx_runtime79.jsx)(HTMLContainer, {
    centered: true,
    children: Actions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime79.jsx)("div", {
      ref: rContextBar,
      className: "tl-toolbar tl-context-bar",
      style: {
        visibility: hidden ? "hidden" : "visible",
        pointerEvents: hidden ? "none" : "all"
      },
      children: Actions.map((Action, idx) => /* @__PURE__ */ (0, import_jsx_runtime79.jsxs)(React62.Fragment, {
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime79.jsx)(Action, {}),
          idx < Actions.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime79.jsx)(LSUI11.Separator, {
            className: "tl-toolbar-separator",
            orientation: "vertical"
          })
        ]
      }, idx))
    })
  });
};
var ContextBar = observer(_ContextBar);

// src/components/ContextMenu/ContextMenu.tsx
var React63 = __toESM(require("react"));
var import_jsx_runtime80 = require("react/jsx-runtime");
var LSUI12 = window.LSUI;
var ContextMenu = observer(function ContextMenu2({
  children,
  collisionRef
}) {
  var _a3, _b, _c, _d, _e2, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  const app = useApp();
  const { handlers } = React63.useContext(LogseqContext);
  const t = handlers.t;
  const rContent = React63.useRef(null);
  const runAndTransition = (f2) => {
    f2();
    app.transition("select");
  };
  const developerMode = React63.useMemo(() => {
    return isDev();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenu, {
    onOpenChange: (open) => {
      if (open && !app.isIn("select.contextMenu")) {
        app.transition("select").selectedTool.transition("contextMenu");
      } else if (!open && app.isIn("select.contextMenu")) {
        app.selectedTool.transition("idle");
      }
    },
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.ContextMenuTrigger, {
        disabled: app.editingShape && Object.keys(app.editingShape).length !== 0,
        children
      }),
      /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.ContextMenuContent, {
        className: "tl-menu tl-context-menu",
        ref: rContent,
        onEscapeKeyDown: () => app.transition("select"),
        collisionBoundary: collisionRef.current,
        asChild: true,
        tabIndex: -1,
        children: /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)("div", {
          children: [
            ((_a3 = app.selectedShapes) == null ? void 0 : _a3.size) > 1 && !app.readOnly && ((_b = app.selectedShapesArray) == null ? void 0 : _b.some((s2) => !s2.props.isLocked)) && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                  className: "tl-menu-button-row-wrap",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)("div", {
                      className: "tl-menu-button-row pb-0",
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(Button, {
                          tooltip: t("whiteboard/align-left"),
                          onClick: () => runAndTransition(() => app.align("left" /* Left */)),
                          children: /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                            name: "layout-align-left"
                          })
                        }),
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(Button, {
                          tooltip: t("whiteboard/align-center-horizontally"),
                          onClick: () => runAndTransition(() => app.align("centerHorizontal" /* CenterHorizontal */)),
                          children: /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                            name: "layout-align-center"
                          })
                        }),
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(Button, {
                          tooltip: t("whiteboard/align-right"),
                          onClick: () => runAndTransition(() => app.align("right" /* Right */)),
                          children: /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                            name: "layout-align-right"
                          })
                        }),
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.Separator, {
                          className: "tl-toolbar-separator",
                          orientation: "vertical"
                        }),
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(Button, {
                          tooltip: t("whiteboard/distribute-horizontally"),
                          onClick: () => runAndTransition(() => app.distribute("horizontal" /* Horizontal */)),
                          children: /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                            name: "layout-distribute-vertical"
                          })
                        })
                      ]
                    }),
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)("div", {
                      className: "tl-menu-button-row pt-0",
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(Button, {
                          tooltip: t("whiteboard/align-top"),
                          onClick: () => runAndTransition(() => app.align("top" /* Top */)),
                          children: /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                            name: "layout-align-top"
                          })
                        }),
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(Button, {
                          tooltip: t("whiteboard/align-center-vertically"),
                          onClick: () => runAndTransition(() => app.align("centerVertical" /* CenterVertical */)),
                          children: /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                            name: "layout-align-middle"
                          })
                        }),
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(Button, {
                          tooltip: t("whiteboard/align-bottom"),
                          onClick: () => runAndTransition(() => app.align("bottom" /* Bottom */)),
                          children: /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                            name: "layout-align-bottom"
                          })
                        }),
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.Separator, {
                          className: "tl-toolbar-separator",
                          orientation: "vertical"
                        }),
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(Button, {
                          tooltip: t("whiteboard/distribute-vertically"),
                          onClick: () => runAndTransition(() => app.distribute("vertical" /* Vertical */)),
                          children: /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                            name: "layout-distribute-horizontal"
                          })
                        })
                      ]
                    })
                  ]
                }),
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {
                  className: "menu-separator"
                }),
                /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                  className: "tl-menu-item",
                  onClick: () => runAndTransition(app.packIntoRectangle),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                      className: "tl-menu-icon",
                      name: "layout-grid"
                    }),
                    t("whiteboard/pack-into-rectangle")
                  ]
                }),
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {
                  className: "menu-separator"
                })
              ]
            }),
            ((_c = app.selectedShapes) == null ? void 0 : _c.size) > 0 && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                  className: "tl-menu-item",
                  onClick: () => runAndTransition(app.api.zoomToSelection),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                      className: "tl-menu-icon",
                      name: "circle-dotted"
                    }),
                    t("whiteboard/zoom-to-fit"),
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(KeyboardShortcut, {
                      action: "whiteboard/zoom-to-fit"
                    })
                  ]
                }),
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {
                  className: "menu-separator"
                })
              ]
            }),
            (app.selectedShapesArray.some((s2) => s2.type === "group" || app.getParentGroup(s2)) || app.selectedShapesArray.length > 1) && ((_d = app.selectedShapesArray) == null ? void 0 : _d.some((s2) => !s2.props.isLocked)) && !app.readOnly && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {
              children: [
                app.selectedShapesArray.some((s2) => s2.type === "group" || app.getParentGroup(s2)) && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                  className: "tl-menu-item",
                  onClick: () => runAndTransition(app.api.unGroup),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                      className: "tl-menu-icon",
                      name: "ungroup"
                    }),
                    t("whiteboard/ungroup"),
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(KeyboardShortcut, {
                      action: "whiteboard/ungroup"
                    })
                  ]
                }),
                app.selectedShapesArray.length > 1 && ((_e2 = app.selectedShapesArray) == null ? void 0 : _e2.some((s2) => !s2.props.isLocked)) && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                  className: "tl-menu-item",
                  onClick: () => runAndTransition(app.api.doGroup),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                      className: "tl-menu-icon",
                      name: "group"
                    }),
                    t("whiteboard/group"),
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(KeyboardShortcut, {
                      action: "whiteboard/group"
                    })
                  ]
                }),
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {
                  className: "menu-separator"
                })
              ]
            }),
            ((_f = app.selectedShapes) == null ? void 0 : _f.size) > 0 && ((_g = app.selectedShapesArray) == null ? void 0 : _g.some((s2) => !s2.props.isLocked)) && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {
              children: [
                !app.readOnly && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                  className: "tl-menu-item",
                  onClick: () => runAndTransition(app.cut),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                      className: "tl-menu-icon",
                      name: "cut"
                    }),
                    t("whiteboard/cut")
                  ]
                }),
                /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                  className: "tl-menu-item",
                  onClick: () => runAndTransition(app.copy),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                      className: "tl-menu-icon",
                      name: "copy"
                    }),
                    t("whiteboard/copy"),
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(KeyboardShortcut, {
                      action: "editor/copy"
                    })
                  ]
                })
              ]
            }),
            !app.readOnly && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
              className: "tl-menu-item",
              onClick: () => runAndTransition(app.paste),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                  className: "tl-menu-icon",
                  name: "clipboard"
                }),
                t("whiteboard/paste"),
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(KeyboardShortcut, {
                  shortcut: `${MOD_KEY}+v`
                })
              ]
            }),
            ((_h = app.selectedShapes) == null ? void 0 : _h.size) === 1 && !app.readOnly && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
              className: "tl-menu-item",
              onClick: () => runAndTransition(() => app.paste(void 0, true)),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                  className: "tl-menu-icon",
                  name: "circle-dotted"
                }),
                t("whiteboard/paste-as-link"),
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(KeyboardShortcut, {
                  shortcut: `${MOD_KEY}+\u21E7+v`
                })
              ]
            }),
            ((_i = app.selectedShapes) == null ? void 0 : _i.size) > 0 && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {
                  className: "menu-separator"
                }),
                /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                  className: "tl-menu-item",
                  onClick: () => runAndTransition(
                    () => {
                      var _a4, _b2;
                      return handlers.exportToImage(app.currentPageId, {
                        x: app.selectionBounds.minX + app.viewport.camera.point[0] - EXPORT_PADDING,
                        y: app.selectionBounds.minY + app.viewport.camera.point[1] - EXPORT_PADDING,
                        width: ((_a4 = app.selectionBounds) == null ? void 0 : _a4.width) + EXPORT_PADDING * 2,
                        height: ((_b2 = app.selectionBounds) == null ? void 0 : _b2.height) + EXPORT_PADDING * 2,
                        zoom: app.viewport.camera.zoom
                      });
                    }
                  ),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                      className: "tl-menu-icon",
                      name: "file-export"
                    }),
                    t("whiteboard/export"),
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)("div", {
                      className: "tl-menu-right-slot",
                      children: /* @__PURE__ */ (0, import_jsx_runtime80.jsx)("span", {
                        className: "keyboard-shortcut"
                      })
                    })
                  ]
                })
              ]
            }),
            /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {
              className: "menu-separator"
            }),
            /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
              className: "tl-menu-item",
              onClick: () => runAndTransition(app.api.selectAll),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                  className: "tl-menu-icon",
                  name: "circle-dotted"
                }),
                t("whiteboard/select-all"),
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(KeyboardShortcut, {
                  action: "editor/select-parent"
                })
              ]
            }),
            ((_j = app.selectedShapes) == null ? void 0 : _j.size) > 1 && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
              className: "tl-menu-item",
              onClick: () => runAndTransition(app.api.deselectAll),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                  className: "tl-menu-icon",
                  name: "circle-dotted"
                }),
                t("whiteboard/deselect-all")
              ]
            }),
            !app.readOnly && ((_k = app.selectedShapes) == null ? void 0 : _k.size) > 0 && ((_l = app.selectedShapesArray) == null ? void 0 : _l.some((s2) => !s2.props.isLocked)) && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
              className: "tl-menu-item",
              onClick: () => runAndTransition(() => app.setLocked(true)),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                  className: "tl-menu-icon",
                  name: "lock"
                }),
                t("whiteboard/lock"),
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(KeyboardShortcut, {
                  action: "whiteboard/lock"
                })
              ]
            }),
            !app.readOnly && ((_m = app.selectedShapes) == null ? void 0 : _m.size) > 0 && ((_n = app.selectedShapesArray) == null ? void 0 : _n.some((s2) => s2.props.isLocked)) && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
              className: "tl-menu-item",
              onClick: () => runAndTransition(() => app.setLocked(false)),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                  className: "tl-menu-icon",
                  name: "lock-open"
                }),
                t("whiteboard/unlock"),
                /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(KeyboardShortcut, {
                  action: "whiteboard/unlock"
                })
              ]
            }),
            ((_o = app.selectedShapes) == null ? void 0 : _o.size) > 0 && !app.readOnly && ((_p = app.selectedShapesArray) == null ? void 0 : _p.some((s2) => !s2.props.isLocked)) && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                  className: "tl-menu-item",
                  onClick: () => runAndTransition(app.api.deleteShapes),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                      className: "tl-menu-icon",
                      name: "backspace"
                    }),
                    t("whiteboard/delete"),
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(KeyboardShortcut, {
                      action: "editor/delete"
                    })
                  ]
                }),
                ((_q = app.selectedShapes) == null ? void 0 : _q.size) > 1 && !app.readOnly && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {
                      className: "menu-separator"
                    }),
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                      className: "tl-menu-item",
                      onClick: () => runAndTransition(app.flipHorizontal),
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                          className: "tl-menu-icon",
                          name: "flip-horizontal"
                        }),
                        t("whiteboard/flip-horizontally")
                      ]
                    }),
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                      className: "tl-menu-item",
                      onClick: () => runAndTransition(app.flipVertical),
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                          className: "tl-menu-icon",
                          name: "flip-vertical"
                        }),
                        t("whiteboard/flip-vertically")
                      ]
                    })
                  ]
                }),
                !app.readOnly && /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {
                      className: "menu-separator"
                    }),
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                      className: "tl-menu-item",
                      onClick: () => runAndTransition(app.bringToFront),
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                          className: "tl-menu-icon",
                          name: "circle-dotted"
                        }),
                        t("whiteboard/move-to-front"),
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(KeyboardShortcut, {
                          action: "whiteboard/bring-to-front"
                        })
                      ]
                    }),
                    /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {
                      className: "tl-menu-item",
                      onClick: () => runAndTransition(app.sendToBack),
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(TablerIcon, {
                          className: "tl-menu-icon",
                          name: "circle-dotted"
                        }),
                        t("whiteboard/move-to-back"),
                        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(KeyboardShortcut, {
                          action: "whiteboard/send-to-back"
                        })
                      ]
                    })
                  ]
                }),
                developerMode && /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(LSUI12.ContextMenuItem, {
                  className: "tl-menu-item",
                  onClick: () => {
                    if (app.selectedShapesArray.length === 1) {
                      console.log(toJS(app.selectedShapesArray[0].serialized));
                    } else {
                      console.log(app.selectedShapesArray.map((s2) => toJS(s2.serialized)));
                    }
                  },
                  children: t("whiteboard/dev-print-shape-props")
                })
              ]
            })
          ]
        })
      })
    ]
  });
});

// src/components/QuickLinks/QuickLinks.tsx
var import_react56 = __toESM(require("react"));
var import_jsx_runtime81 = require("react/jsx-runtime");
var QuickLinks = observer(({ shape }) => {
  const app = useApp();
  const { handlers } = import_react56.default.useContext(LogseqContext);
  const t = handlers.t;
  const links = import_react56.default.useMemo(() => {
    var _a3;
    const links2 = [...(_a3 = shape.props.refs) != null ? _a3 : []].map(
      (l3) => [l3, true]
    );
    if (shape.props.type === "logseq-portal" && shape.props.pageId) {
      links2.unshift([shape.props.pageId, false]);
    }
    return links2.filter(
      (link) => link[0].toLowerCase() !== app.currentPage.id && link[0] !== shape.props.pageId
    );
  }, [shape.props.id, shape.props.type, shape.props.parentId, shape.props.refs]);
  if (links.length === 0)
    return null;
  return /* @__PURE__ */ (0, import_jsx_runtime81.jsx)("div", {
    className: "tl-quick-links",
    title: t("whiteboard/shape-quick-links"),
    children: links.map(([ref, showReferenceContent]) => {
      return /* @__PURE__ */ (0, import_jsx_runtime81.jsx)("div", {
        className: "tl-quick-links-row",
        children: /* @__PURE__ */ (0, import_jsx_runtime81.jsx)(BlockLink, {
          id: ref,
          showReferenceContent
        })
      }, ref);
    })
  });
});

// src/hooks/useDrop.ts
var React66 = __toESM(require("react"));

// src/hooks/usePaste.ts
var React65 = __toESM(require("react"));
var isValidURL = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.host && ["http:", "https:"].includes(parsedUrl.protocol);
  } catch (e) {
    return false;
  }
};
var assetExtensions = {
  image: [".png", ".svg", ".jpg", ".jpeg", ".gif"],
  video: [".mp4", ".webm", ".ogg"],
  pdf: [".pdf"]
};
function getFileType(filename) {
  var _a3;
  const extensionMatch = filename.match(/\.[0-9a-z]+$/i);
  if (!extensionMatch)
    return "unknown";
  const extension = extensionMatch[0].toLowerCase();
  const [type, _extensions] = (_a3 = Object.entries(assetExtensions).find(
    ([_type, extensions]) => extensions.includes(extension)
  )) != null ? _a3 : ["unknown", null];
  return type;
}
function tryCreateShapeHelper(...fns) {
  return (...args) => __async(this, null, function* () {
    for (const fn of fns) {
      const result = yield fn(...args);
      if (result && result.length > 0) {
        return result;
      }
    }
    return null;
  });
}
function getDataFromType(item, type) {
  return __async(this, null, function* () {
    if (!item.types.includes(type)) {
      return null;
    }
    if (item instanceof DataTransfer) {
      return item.getData(type);
    }
    const blob = yield item.getType(type);
    return yield blob.text();
  });
}
var handleCreatingShapes = (_0, _1, _2) => __async(void 0, [_0, _1, _2], function* (app, { point, shiftKey, dataTransfer, fromDrop }, handlers) {
  var _a3, _b;
  let imageAssetsToCreate = [];
  let assetsToClone = [];
  const bindingsToCreate = [];
  function createAssetsFromURL(url, type) {
    return __async(this, null, function* () {
      const existingAsset = Object.values(app.assets).find((asset2) => asset2.src === url);
      if (existingAsset) {
        return existingAsset;
      }
      const asset = {
        id: uniqueId(),
        type,
        src: url,
        size: yield getSizeFromSrc(handlers.makeAssetUrl(url), type)
      };
      return asset;
    });
  }
  function createAssetsFromFiles(files) {
    return __async(this, null, function* () {
      const tasks = files.filter((file) => getFileType(file.name) !== "unknown").map((file) => __async(this, null, function* () {
        try {
          const dataurl = yield handlers.saveAsset(file);
          return yield createAssetsFromURL(dataurl, getFileType(file.name));
        } catch (err) {
          console.error(err);
        }
        return null;
      }));
      return (yield Promise.all(tasks)).filter(isNonNullable);
    });
  }
  function createHTMLShape(text) {
    return [
      __spreadProps(__spreadValues({}, HTMLShape.defaultProps), {
        html: text,
        point: [point[0], point[1]]
      })
    ];
  }
  function tryCreateShapesFromDataTransfer(dataTransfer2) {
    return __async(this, null, function* () {
      return tryCreateShapeHelper(
        tryCreateShapeFromFilePath,
        tryCreateShapeFromFiles,
        tryCreateShapeFromPageName,
        tryCreateShapeFromBlockUUID,
        tryCreateShapeFromTextPlain,
        tryCreateShapeFromTextHTML,
        tryCreateLogseqPortalShapesFromString
      )(dataTransfer2);
    });
  }
  function tryCreateShapesFromClipboard() {
    return __async(this, null, function* () {
      const items = yield navigator.clipboard.read();
      const createShapesFn = tryCreateShapeHelper(
        tryCreateShapeFromTextPlain,
        tryCreateShapeFromTextHTML,
        tryCreateLogseqPortalShapesFromString
      );
      const allShapes = (yield Promise.all(items.map((item) => createShapesFn(item)))).flat().filter(isNonNullable);
      return allShapes;
    });
  }
  function tryCreateShapeFromFilePath(item) {
    return __async(this, null, function* () {
      const file = item.getData("file");
      if (!file)
        return null;
      const asset = yield createAssetsFromURL(file, "pdf");
      app.addAssets([asset]);
      const newShape = __spreadProps(__spreadValues({}, PdfShape.defaultProps), {
        id: uniqueId(),
        assetId: asset.id,
        url: file,
        opacity: 1
      });
      if (asset.size) {
        Object.assign(newShape, {
          point: [point[0] - asset.size[0] / 4 + 16, point[1] - asset.size[1] / 4 + 16],
          size: src_default.div(asset.size, 2)
        });
      }
      return [newShape];
    });
  }
  function tryCreateShapeFromFiles(item) {
    return __async(this, null, function* () {
      const files = Array.from(item.files);
      if (files.length > 0) {
        const assets = yield createAssetsFromFiles(files);
        imageAssetsToCreate = assets;
        return assets.map((asset, i2) => {
          let defaultProps = null;
          switch (asset.type) {
            case "video":
              defaultProps = VideoShape.defaultProps;
              break;
            case "image":
              defaultProps = ImageShape.defaultProps;
              break;
            case "pdf":
              defaultProps = PdfShape.defaultProps;
              break;
            default:
              return null;
          }
          const newShape = __spreadProps(__spreadValues({}, defaultProps), {
            id: uniqueId(),
            assetId: asset.id,
            opacity: 1
          });
          if (asset.size) {
            Object.assign(newShape, {
              point: [point[0] - asset.size[0] / 4 + i2 * 16, point[1] - asset.size[1] / 4 + i2 * 16],
              size: src_default.div(asset.size, 2)
            });
          }
          return newShape;
        });
      }
      return null;
    });
  }
  function tryCreateShapeFromTextHTML(item) {
    return __async(this, null, function* () {
      if (item.types.includes("text/plain") && (shiftKey || fromDrop)) {
        return null;
      }
      const rawText = yield getDataFromType(item, "text/html");
      if (rawText) {
        return tryCreateShapeHelper(tryCreateClonedShapesFromJSON, createHTMLShape)(rawText);
      }
      return null;
    });
  }
  function tryCreateShapeFromBlockUUID(dataTransfer2) {
    return __async(this, null, function* () {
      var _a4, _b2, _c, _d, _e2, _f;
      const rawText = dataTransfer2.getData("block-uuid");
      if (rawText) {
        const text = rawText.trim();
        const allSelectedBlocks = (_c = (_b2 = (_a4 = window.logseq) == null ? void 0 : _a4.api) == null ? void 0 : _b2.get_selected_blocks) == null ? void 0 : _c.call(_b2);
        const blockUUIDs = allSelectedBlocks && (allSelectedBlocks == null ? void 0 : allSelectedBlocks.length) > 1 ? allSelectedBlocks.map((b3) => b3.uuid) : [text];
        (_f = (_e2 = (_d = window.logseq) == null ? void 0 : _d.api) == null ? void 0 : _e2.set_blocks_id) == null ? void 0 : _f.call(_e2, blockUUIDs);
        const tasks = blockUUIDs.map((uuid) => tryCreateLogseqPortalShapesFromUUID(`((${uuid}))`));
        const newShapes2 = (yield Promise.all(tasks)).flat().filter(isNonNullable);
        return newShapes2.map((s2, idx) => {
          return __spreadProps(__spreadValues({}, s2), {
            point: [point[0] + (LogseqPortalShape.defaultProps.size[0] + 16) * idx, point[1]]
          });
        });
      }
      return null;
    });
  }
  function tryCreateShapeFromPageName(dataTransfer2) {
    return __async(this, null, function* () {
      const rawText = dataTransfer2.getData("page-name");
      if (rawText) {
        const text = rawText.trim();
        return tryCreateLogseqPortalShapesFromUUID(`[[${text}]]`);
      }
      return null;
    });
  }
  function tryCreateShapeFromTextPlain(item) {
    return __async(this, null, function* () {
      const rawText = yield getDataFromType(item, "text/plain");
      if (rawText) {
        const text = rawText.trim();
        return tryCreateShapeHelper(tryCreateShapeFromURL, tryCreateShapeFromIframeString)(text);
      }
      return null;
    });
  }
  function tryCreateClonedShapesFromJSON(rawText) {
    const result = app.api.getClonedShapesFromTldrString(decodeURIComponent(rawText), point);
    if (result) {
      const { shapes: shapes2, assets, bindings } = result;
      assetsToClone.push(...assets);
      bindingsToCreate.push(...bindings);
      return shapes2;
    }
    return null;
  }
  function tryCreateShapeFromURL(rawText) {
    return __async(this, null, function* () {
      if (isValidURL(rawText) && !shiftKey) {
        if (YOUTUBE_REGEX.test(rawText)) {
          return [
            __spreadProps(__spreadValues({}, YouTubeShape.defaultProps), {
              url: rawText,
              point: [point[0], point[1]]
            })
          ];
        }
        if (X_OR_TWITTER_REGEX.test(rawText)) {
          return [
            __spreadProps(__spreadValues({}, TweetShape.defaultProps), {
              url: rawText,
              point: [point[0], point[1]]
            })
          ];
        }
        return [
          __spreadProps(__spreadValues({}, IFrameShape.defaultProps), {
            url: rawText,
            point: [point[0], point[1]]
          })
        ];
      }
      return null;
    });
  }
  function tryCreateShapeFromIframeString(rawText) {
    if (rawText.startsWith("<iframe")) {
      return [
        __spreadProps(__spreadValues({}, HTMLShape.defaultProps), {
          html: rawText,
          point: [point[0], point[1]]
        })
      ];
    }
    return null;
  }
  function tryCreateLogseqPortalShapesFromUUID(rawText) {
    return __async(this, null, function* () {
      if (/^\(\(.*\)\)$/.test(rawText) && rawText.length === nil_default.length + 4) {
        const blockRef = rawText.slice(2, -2);
        if (validUUID(blockRef)) {
          return [
            __spreadProps(__spreadValues({}, LogseqPortalShape.defaultProps), {
              point: [point[0], point[1]],
              size: [400, 0],
              pageId: blockRef,
              fill: app.settings.color,
              stroke: app.settings.color,
              scaleLevel: app.settings.scaleLevel,
              blockType: "B"
            })
          ];
        }
      } else if (/^\[\[.*\]\]$/.test(rawText)) {
        const pageName = rawText.slice(2, -2);
        return [
          __spreadProps(__spreadValues({}, LogseqPortalShape.defaultProps), {
            point: [point[0], point[1]],
            size: [400, 0],
            pageId: pageName,
            fill: app.settings.color,
            stroke: app.settings.color,
            scaleLevel: app.settings.scaleLevel,
            blockType: "P"
          })
        ];
      }
      return null;
    });
  }
  function tryCreateLogseqPortalShapesFromString(item) {
    return __async(this, null, function* () {
      const rawText = yield getDataFromType(item, "text/plain");
      if (rawText) {
        const text = rawText.trim();
        const uuid = yield handlers == null ? void 0 : handlers.addNewBlock(text);
        if (uuid) {
          return [
            __spreadProps(__spreadValues({}, LogseqPortalShape.defaultProps), {
              size: [400, 0],
              point: [point[0], point[1]],
              pageId: uuid,
              fill: app.settings.color,
              stroke: app.settings.color,
              scaleLevel: app.settings.scaleLevel,
              blockType: "B",
              compact: true
            })
          ];
        }
      }
      return null;
    });
  }
  app.cursors.setCursor("progress" /* Progress */);
  let newShapes = [];
  try {
    if (dataTransfer) {
      newShapes.push(...(_a3 = yield tryCreateShapesFromDataTransfer(dataTransfer)) != null ? _a3 : []);
    } else {
      newShapes.push(...(_b = yield tryCreateShapesFromClipboard()) != null ? _b : []);
    }
  } catch (error) {
    console.error(error);
  }
  const allShapesToAdd = newShapes.map((shape) => {
    return __spreadProps(__spreadValues({}, shape), {
      parentId: app.currentPageId,
      isLocked: false,
      id: validUUID(shape.id) ? shape.id : uniqueId()
    });
  });
  const filesOnly = dataTransfer == null ? void 0 : dataTransfer.types.every((t) => t === "Files");
  app.wrapUpdate(() => {
    const allAssets = [...imageAssetsToCreate, ...assetsToClone];
    if (allAssets.length > 0) {
      app.createAssets(allAssets);
    }
    if (allShapesToAdd.length > 0) {
      app.createShapes(allShapesToAdd);
    }
    app.currentPage.updateBindings(Object.fromEntries(bindingsToCreate.map((b3) => [b3.id, b3])));
    if (app.selectedShapesArray.length === 1 && allShapesToAdd.length === 1 && fromDrop) {
      const source = app.selectedShapesArray[0];
      const target = app.getShapeById(allShapesToAdd[0].id);
      app.createNewLineBinding(source, target);
    }
    app.setSelectedShapes(allShapesToAdd.map((s2) => s2.id));
    app.selectedTool.transition("idle");
    app.cursors.setCursor("default" /* Default */);
    if (fromDrop || filesOnly) {
      app.packIntoRectangle();
    }
  });
});
function usePaste() {
  const { handlers } = React65.useContext(LogseqContext);
  return React65.useCallback((app, info) => __async(this, null, function* () {
    if (info.shiftKey && app.selectedShapesArray.length === 1) {
      const items = yield navigator.clipboard.read();
      let newRef;
      if (items.length > 0) {
        const blob = yield items[0].getType("text/plain");
        const rawText = (yield blob.text()).trim();
        if (rawText) {
          if (/^\(\(.*\)\)$/.test(rawText) && rawText.length === nil_default.length + 4) {
            const blockRef = rawText.slice(2, -2);
            if (validUUID(blockRef)) {
              newRef = blockRef;
            }
          } else if (/^\[\[.*\]\]$/.test(rawText)) {
            newRef = rawText.slice(2, -2);
          }
        }
      }
      if (newRef) {
        app.selectedShapesArray[0].update({
          refs: [newRef]
        });
        app.persist();
        return;
      }
    }
    handleCreatingShapes(app, info, handlers);
  }), []);
}

// src/hooks/useDrop.ts
function useDrop() {
  const handlePaste = usePaste();
  return React66.useCallback(
    (_0, _1) => __async(this, [_0, _1], function* (app, { dataTransfer, point }) {
      handlePaste(app, { point, shiftKey: false, dataTransfer, fromDrop: true });
    }),
    []
  );
}

// src/hooks/useCopy.ts
var React67 = __toESM(require("react"));
function useCopy() {
  const { handlers } = React67.useContext(LogseqContext);
  return React67.useCallback((app, { text, html }) => {
    handlers.copyToClipboard(text, html);
  }, []);
}

// src/hooks/useQuickAdd.ts
var import_react57 = __toESM(require("react"));
function useQuickAdd() {
  return import_react57.default.useCallback((app) => __async(this, null, function* () {
    setTimeout(() => {
      app.transition("logseq-portal").selectedTool.transition("creating");
    }, 100);
  }), []);
}

// src/app.tsx
var import_jsx_runtime82 = require("react/jsx-runtime");
var tools = [
  BoxTool,
  EllipseTool,
  PolygonTool,
  NuEraseTool,
  HighlighterTool,
  LineTool,
  PencilTool,
  TextTool,
  YouTubeTool,
  IFrameTool,
  HTMLTool,
  LogseqPortalTool
];
var BacklinksCount = (props) => {
  const { renderers } = React69.useContext(LogseqContext);
  const options = { "portal?": false };
  return /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(renderers.BacklinksCount, __spreadProps(__spreadValues({}, props), {
    options
  }));
};
var AppImpl = () => {
  const ref = React69.useRef(null);
  const app = useApp();
  const components = React69.useMemo(
    () => ({
      ContextBar,
      BacklinksCount,
      QuickLinks
    }),
    []
  );
  return /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(ContextMenu, {
    collisionRef: ref,
    children: /* @__PURE__ */ (0, import_jsx_runtime82.jsx)("div", {
      ref,
      className: "logseq-tldraw logseq-tldraw-wrapper",
      "data-tlapp": app.uuid,
      children: /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(AppCanvas, {
        components,
        children: /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(AppUI, {})
      })
    })
  });
};
var AppInner = (_a3) => {
  var _b = _a3, {
    onPersist,
    readOnly,
    model
  } = _b, rest = __objRest(_b, [
    "onPersist",
    "readOnly",
    "model"
  ]);
  const onDrop = useDrop();
  const onPaste = usePaste();
  const onCopy = useCopy();
  const onQuickAdd = readOnly ? null : useQuickAdd();
  const onPersistOnDiff = React69.useCallback(
    (app, info) => {
      onPersist == null ? void 0 : onPersist(app, info);
    },
    [model]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(AppProvider, __spreadProps(__spreadValues({
    Shapes: shapes,
    Tools: tools,
    onDrop,
    onPaste,
    onCopy,
    readOnly,
    onCanvasDBClick: onQuickAdd,
    onPersist: onPersistOnDiff,
    model
  }, rest), {
    children: /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(AppImpl, {})
  }));
};
var App3 = function App4(_a3) {
  var _b = _a3, { renderers, handlers } = _b, rest = __objRest(_b, ["renderers", "handlers"]);
  const memoRenders = React69.useMemo(() => {
    return Object.fromEntries(
      Object.entries(renderers).map(([key, comp]) => {
        return [key, React69.memo(comp)];
      })
    );
  }, []);
  const contextValue = {
    renderers: memoRenders,
    handlers
  };
  return /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(LogseqContext.Provider, {
    value: contextValue,
    children: /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(AppInner, __spreadValues({}, rest))
  });
};
/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
