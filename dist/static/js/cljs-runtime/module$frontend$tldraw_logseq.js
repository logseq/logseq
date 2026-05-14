shadow$provide.module$frontend$tldraw_logseq = function(global, require, module, exports) {
  function rng() {
    if (!getRandomValues && (getRandomValues = "undefined" !== typeof crypto && crypto.getRandomValues && crypto.getRandomValues.bind(crypto), !getRandomValues)) {
      throw Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
    return getRandomValues(rnds8);
  }
  function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
  }
  function potpack(boxes) {
    let area = 0;
    var maxWidth = 0;
    for (var box2 of boxes) {
      area += box2.w * box2.h, maxWidth = Math.max(maxWidth, box2.w);
    }
    boxes.sort((a3, b3) => b3.h - a3.h);
    maxWidth = [{x:0, y:0, w:Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth), h:Infinity}];
    let height = box2 = 0;
    for (const box2$jscomp$0 of boxes) {
      for (boxes = maxWidth.length - 1; 0 <= boxes; boxes--) {
        var space = maxWidth[boxes];
        if (!(box2$jscomp$0.w > space.w || box2$jscomp$0.h > space.h)) {
          box2$jscomp$0.x = space.x;
          box2$jscomp$0.y = space.y;
          height = Math.max(height, box2$jscomp$0.y + box2$jscomp$0.h);
          box2 = Math.max(box2, box2$jscomp$0.x + box2$jscomp$0.w);
          box2$jscomp$0.w === space.w && box2$jscomp$0.h === space.h ? (space = maxWidth.pop(), boxes < maxWidth.length && (maxWidth[boxes] = space)) : box2$jscomp$0.h === space.h ? (space.x += box2$jscomp$0.w, space.w -= box2$jscomp$0.w) : (box2$jscomp$0.w !== space.w && maxWidth.push({x:space.x + box2$jscomp$0.w, y:space.y, w:space.w - box2$jscomp$0.w, h:box2$jscomp$0.h}), space.y += box2$jscomp$0.h, space.h -= box2$jscomp$0.h);
          break;
        }
      }
    }
    return {w:box2, h:height, fill:area / (box2 * height) || 0};
  }
  function createIntersection(message, ...points) {
    return {didIntersect:0 < points.length, message, points};
  }
  function getRectangleSides(point, size, rotation = 0) {
    const center = [point[0] + size[0] / 2, point[1] + size[1] / 2], tl = Vec.rotWith(point, center, rotation), tr = Vec.rotWith(Vec.add(point, [size[0], 0]), center, rotation), br = Vec.rotWith(Vec.add(point, size), center, rotation);
    point = Vec.rotWith(Vec.add(point, [0, size[1]]), center, rotation);
    return [["top", [tl, tr]], ["right", [tr, br]], ["bottom", [br, point]], ["left", [point, tl]]];
  }
  function intersectRayLineSegment(origin, direction, a1, a22) {
    const [x2, y2] = origin, [dx, dy] = direction, [x1, y1] = a1, [x22, y22] = a22;
    return dy / dx !== (y22 - y1) / (x22 - x1) && (direction = dx * (y22 - y1) - dy * (x22 - x1), 0 !== direction && (origin = ((y2 - y1) * (x22 - x1) - (x2 - x1) * (y22 - y1)) / direction, direction = ((y2 - y1) * dx - (x2 - x1) * dy) / direction, 0 <= origin && 0 <= direction && 1 >= direction)) ? createIntersection("intersection", [x2 + origin * dx, y2 + origin * dy]) : createIntersection("no intersection");
  }
  function intersectRayRectangle(origin, direction, point, size, rotation = 0) {
    return intersectRectangleRay(point, size, rotation, origin, direction);
  }
  function intersectRayBounds(origin, direction, bounds, rotation = 0) {
    const {minX, minY, width, height} = bounds;
    return intersectRayRectangle(origin, direction, [minX, minY], [width, height], rotation);
  }
  function intersectLineSegmentLineSegment(a1, a22, b1, b22) {
    var AB = Vec.sub(a1, b1);
    b1 = Vec.sub(b22, b1);
    a22 = Vec.sub(a22, a1);
    b22 = b1[0] * AB[1] - b1[1] * AB[0];
    AB = a22[0] * AB[1] - a22[1] * AB[0];
    b1 = b1[1] * a22[0] - b1[0] * a22[1];
    return 0 === b22 || 0 === AB ? createIntersection("coincident") : 0 === b1 ? createIntersection("parallel") : 0 !== b1 && (b22 /= b1, AB /= b1, 0 <= b22 && 1 >= b22 && 0 <= AB && 1 >= AB) ? createIntersection("intersection", Vec.add(a1, Vec.mul(a22, b22))) : createIntersection("no intersection");
  }
  function intersectLineSegmentCircle(a1, a22, c2, r2) {
    var a3 = (a22[0] - a1[0]) * (a22[0] - a1[0]) + (a22[1] - a1[1]) * (a22[1] - a1[1]), b3 = 2 * ((a22[0] - a1[0]) * (a1[0] - c2[0]) + (a22[1] - a1[1]) * (a1[1] - c2[1]));
    c2 = b3 * b3 - 4 * a3 * (c2[0] * c2[0] + c2[1] * c2[1] + a1[0] * a1[0] + a1[1] * a1[1] - 2 * (c2[0] * a1[0] + c2[1] * a1[1]) - r2 * r2);
    if (0 > c2) {
      return createIntersection("outside");
    }
    if (0 === c2) {
      return createIntersection("tangent");
    }
    r2 = Math.sqrt(c2);
    c2 = (-b3 + r2) / (2 * a3);
    a3 = (-b3 - r2) / (2 * a3);
    if ((0 > c2 || 1 < c2) && (0 > a3 || 1 < a3)) {
      return 0 > c2 && 0 > a3 || 1 < c2 && 1 < a3 ? createIntersection("outside") : createIntersection("inside");
    }
    b3 = [];
    0 <= c2 && 1 >= c2 && b3.push(Vec.lrp(a1, a22, c2));
    0 <= a3 && 1 >= a3 && b3.push(Vec.lrp(a1, a22, a3));
    return createIntersection("intersection", ...b3);
  }
  function intersectLineSegmentEllipse(a1, a22, center, rx, ry, rotation = 0) {
    if (0 === rx || 0 === ry || Vec.isEqual(a1, a22)) {
      return createIntersection("no intersection");
    }
    rx = 0 > rx ? rx : -rx;
    ry = 0 > ry ? ry : -ry;
    a1 = Vec.sub(Vec.rotWith(a1, center, -rotation), center);
    a22 = Vec.sub(Vec.rotWith(a22, center, -rotation), center);
    var diff = Vec.sub(a22, a1), A3 = diff[0] * diff[0] / rx / rx + diff[1] * diff[1] / ry / ry;
    diff = 2 * a1[0] * diff[0] / rx / rx + 2 * a1[1] * diff[1] / ry / ry;
    const tValues = [];
    rx = diff * diff - 4 * A3 * (a1[0] * a1[0] / rx / rx + a1[1] * a1[1] / ry / ry - 1);
    0 === rx ? tValues.push(-diff / 2 / A3) : 0 < rx && (rx = Math.sqrt(rx), tValues.push((-diff + rx) / 2 / A3), tValues.push((-diff - rx) / 2 / A3));
    A3 = tValues.filter(t => 0 <= t && 1 >= t).map(t => Vec.add(center, Vec.add(a1, Vec.mul(Vec.sub(a22, a1), t)))).map(p2 => Vec.rotWith(p2, center, rotation));
    return createIntersection("intersection", ...A3);
  }
  function intersectLineSegmentPolyline(a1, a22, points) {
    const pts = [];
    for (let i2 = 1; i2 < points.length; i2++) {
      const int = intersectLineSegmentLineSegment(a1, a22, points[i2 - 1], points[i2]);
      int && pts.push(...int.points);
    }
    return 0 === pts.length ? createIntersection("no intersection") : createIntersection("intersection", ...points);
  }
  function intersectRectangleRay(point, size, rotation, origin, direction) {
    return getRectangleSides(point, size, rotation).reduce((acc, [message, [a1, a22]]) => {
      (a1 = intersectRayLineSegment(origin, direction, a1, a22)) && acc.push(createIntersection(message, ...a1.points));
      return acc;
    }, []).filter(int => int.didIntersect);
  }
  function intersectRectangleLineSegment(point, size, a1, a22) {
    return getRectangleSides(point, size).reduce((acc, [message, [b1, b22]]) => {
      (b1 = intersectLineSegmentLineSegment(a1, a22, b1, b22)) && acc.push(createIntersection(message, ...b1.points));
      return acc;
    }, []).filter(int => int.didIntersect);
  }
  function intersectRectangleCircle(point, size, c2, r2) {
    return getRectangleSides(point, size).reduce((acc, [message, [a1, a22]]) => {
      (a1 = intersectLineSegmentCircle(a1, a22, c2, r2)) && acc.push(__spreadProps(__spreadValues({}, a1), {message}));
      return acc;
    }, []).filter(int => int.didIntersect);
  }
  function intersectRectangleEllipse(point, size, c2, rx, ry, rotation = 0) {
    return getRectangleSides(point, size).reduce((acc, [message, [a1, a22]]) => {
      (a1 = intersectLineSegmentEllipse(a1, a22, c2, rx, ry, rotation)) && acc.push(__spreadProps(__spreadValues({}, a1), {message}));
      return acc;
    }, []).filter(int => int.didIntersect);
  }
  function intersectRectanglePolyline(point, size, points) {
    return getRectangleSides(point, size).reduce((acc, [message, [a1, a22]]) => {
      a1 = intersectLineSegmentPolyline(a1, a22, points);
      a1.didIntersect && acc.push(createIntersection(message, ...a1.points));
      return acc;
    }, []).filter(int => int.didIntersect);
  }
  function intersectRectanglePolygon(point, size, points) {
    return getRectangleSides(point, size).reduce((acc, [message, [a1, a22]]) => {
      {
        const pts = [];
        for (let i2 = 1; i2 < points.length + 1; i2++) {
          const int = intersectLineSegmentLineSegment(a1, a22, points[i2 - 1], points[i2 % points.length]);
          int && pts.push(...int.points);
        }
        a1 = 0 === pts.length ? createIntersection("no intersection") : createIntersection("intersection", ...points);
      }
      a1.didIntersect && acc.push(createIntersection(message, ...a1.points));
      return acc;
    }, []).filter(int => int.didIntersect);
  }
  function intersectEllipseRectangle(center, rx, ry, rotation = 0, point, size) {
    return rx === ry ? intersectRectangleCircle(point, size, center, rx) : intersectRectangleEllipse(point, size, center, rx, ry, rotation);
  }
  function intersectBoundsLineSegment(bounds, a1, a22) {
    const {minX, minY, width, height} = bounds;
    return intersectRectangleLineSegment([minX, minY], [width, height], a1, a22);
  }
  function die(error) {
    for (var _len = arguments.length, args = Array(1 < _len ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    throw Error("number" === typeof error ? "[MobX] minified error nr: " + error + (args.length ? " " + args.map(String).join(",") : "") + ". Find the full error at: https://github.com/mobxjs/mobx/blob/main/packages/mobx/src/errors.ts" : "[MobX] " + error);
  }
  function getGlobal() {
    return "undefined" !== typeof globalThis ? globalThis : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : "undefined" !== typeof self ? self : mockGlobal;
  }
  function assertProxies() {
    hasProxy || die("Proxy not available");
  }
  function once(func) {
    var invoked = !1;
    return function() {
      if (!invoked) {
        return invoked = !0, func.apply(this, arguments);
      }
    };
  }
  function isFunction(fn) {
    return "function" === typeof fn;
  }
  function isStringish(value) {
    switch(typeof value) {
      case "string":
      case "symbol":
      case "number":
        return !0;
    }
    return !1;
  }
  function isObject(value) {
    return null !== value && "object" === typeof value;
  }
  function isPlainObject(value) {
    if (!isObject(value)) {
      return !1;
    }
    value = Object.getPrototypeOf(value);
    if (null == value) {
      return !0;
    }
    value = Object.hasOwnProperty.call(value, "constructor") && value.constructor;
    return "function" === typeof value && value.toString() === plainObjectString;
  }
  function isGenerator(obj) {
    return (obj = null == obj ? void 0 : obj.constructor) ? "GeneratorFunction" === obj.name || "GeneratorFunction" === obj.displayName ? !0 : !1 : !1;
  }
  function addHiddenProp(object2, propName, value) {
    defineProperty(object2, propName, {enumerable:!1, writable:!0, configurable:!0, value});
  }
  function addHiddenFinalProp(object2, propName, value) {
    defineProperty(object2, propName, {enumerable:!1, writable:!1, configurable:!0, value});
  }
  function createInstanceofPredicate(name, theClass) {
    var propName = "isMobX" + name;
    theClass.prototype[propName] = !0;
    return function(x2) {
      return isObject(x2) && !0 === x2[propName];
    };
  }
  function isES6Map(thing) {
    return thing instanceof Map;
  }
  function isES6Set(thing) {
    return thing instanceof Set;
  }
  function getPlainObjectKeys(object2) {
    var keys = Object.keys(object2);
    if (!hasGetOwnPropertySymbols) {
      return keys;
    }
    var symbols = Object.getOwnPropertySymbols(object2);
    return symbols.length ? [].concat(keys, symbols.filter(function(s2) {
      return objectPrototype.propertyIsEnumerable.call(object2, s2);
    })) : keys;
  }
  function toPrimitive(value) {
    return null === value ? null : "object" === typeof value ? "" + value : value;
  }
  function hasProp(target, prop) {
    return objectPrototype.hasOwnProperty.call(target, prop);
  }
  function _defineProperties(target, props) {
    for (var i2 = 0; i2 < props.length; i2++) {
      var descriptor = props[i2];
      descriptor.enumerable = descriptor.enumerable || !1;
      descriptor.configurable = !0;
      "value" in descriptor && (descriptor.writable = !0);
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    protoProps && _defineProperties(Constructor.prototype, protoProps);
    staticProps && _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {writable:!1});
    return Constructor;
  }
  function _extends() {
    _extends = Object.assign || function(target) {
      for (var i2 = 1; i2 < arguments.length; i2++) {
        var source = arguments[i2], key;
        for (key in source) {
          Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
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
    _setPrototypeOf = Object.setPrototypeOf || function(o3, p3) {
      o3.__proto__ = p3;
      return o3;
    };
    return _setPrototypeOf(o2, p2);
  }
  function _assertThisInitialized(self2) {
    if (void 0 === self2) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self2;
  }
  function _unsupportedIterableToArray(o2, minLen) {
    if (o2) {
      if ("string" === typeof o2) {
        return _arrayLikeToArray(o2, minLen);
      }
      var n2 = Object.prototype.toString.call(o2).slice(8, -1);
      "Object" === n2 && o2.constructor && (n2 = o2.constructor.name);
      if ("Map" === n2 || "Set" === n2) {
        return Array.from(o2);
      }
      if ("Arguments" === n2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2)) {
        return _arrayLikeToArray(o2, minLen);
      }
    }
  }
  function _arrayLikeToArray(arr, len) {
    if (null == len || len > arr.length) {
      len = arr.length;
    }
    for (var i2 = 0, arr2 = Array(len); i2 < len; i2++) {
      arr2[i2] = arr[i2];
    }
    return arr2;
  }
  function _createForOfIteratorHelperLoose(o2, allowArrayLike) {
    var it2 = "undefined" !== typeof Symbol && o2[Symbol.iterator] || o2["@@iterator"];
    if (it2) {
      return (it2 = it2.call(o2)).next.bind(it2);
    }
    if (Array.isArray(o2) || (it2 = _unsupportedIterableToArray(o2)) || allowArrayLike && o2 && "number" === typeof o2.length) {
      it2 && (o2 = it2);
      var i2 = 0;
      return function() {
        return i2 >= o2.length ? {done:!0} : {done:!1, value:o2[i2++]};
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function createDecoratorAnnotation(annotation) {
    return Object.assign(function(target, property) {
      storeAnnotation(target, property, annotation);
    }, annotation);
  }
  function storeAnnotation(prototype, key, annotation) {
    hasProp(prototype, storedAnnotationsSymbol) || addHiddenProp(prototype, storedAnnotationsSymbol, _extends({}, prototype[storedAnnotationsSymbol]));
    annotation.annotationType_ !== OVERRIDE && (prototype[storedAnnotationsSymbol][key] = annotation);
  }
  function collectStoredAnnotations(target) {
    hasProp(target, storedAnnotationsSymbol) || addHiddenProp(target, storedAnnotationsSymbol, _extends({}, target[storedAnnotationsSymbol]));
    return target[storedAnnotationsSymbol];
  }
  function createAtom(name, onBecomeObservedHandler, onBecomeUnobservedHandler) {
    void 0 === onBecomeObservedHandler && (onBecomeObservedHandler = noop);
    void 0 === onBecomeUnobservedHandler && (onBecomeUnobservedHandler = noop);
    name = new Atom(name);
    onBecomeObservedHandler !== noop && interceptHook(ON_BECOME_OBSERVED, name, onBecomeObservedHandler, void 0);
    onBecomeUnobservedHandler !== noop && onBecomeUnobserved(name, onBecomeUnobservedHandler);
    return name;
  }
  function deepEnhancer(v2, _2, name) {
    return _isObservable(v2) ? v2 : Array.isArray(v2) ? observable.array(v2, {name}) : isPlainObject(v2) ? observable.object(v2, void 0, {name}) : isES6Map(v2) ? observable.map(v2, {name}) : isES6Set(v2) ? observable.set(v2, {name}) : "function" !== typeof v2 || isAction(v2) || isFlow(v2) ? v2 : isGenerator(v2) ? flow(v2) : autoAction(name, v2);
  }
  function referenceEnhancer(newValue) {
    return newValue;
  }
  function createActionAnnotation(name, options) {
    return {annotationType_:name, options_:options, make_:make_$1, extend_:extend_$1};
  }
  function make_$1(adm, key, descriptor, source) {
    var _this$options_;
    if (null != (_this$options_ = this.options_) && _this$options_.bound) {
      return null === this.extend_(adm, key, descriptor, !1) ? 0 : 1;
    }
    if (source === adm.target_) {
      return null === this.extend_(adm, key, descriptor, !1) ? 0 : 2;
    }
    if (isAction(descriptor.value)) {
      return 1;
    }
    adm = createActionDescriptor(adm, this, key, descriptor, !1);
    defineProperty(source, key, adm);
    return 2;
  }
  function extend_$1(adm, key, descriptor, proxyTrap) {
    descriptor = createActionDescriptor(adm, this, key, descriptor);
    return adm.defineProperty_(key, descriptor, proxyTrap);
  }
  function createActionDescriptor(adm, annotation, key, descriptor, safeDescriptors) {
    var _annotation$options_, _annotation$options_$, _annotation$options_2, _annotation$options_$2, _annotation$options_3, _annotation$options_4, _adm$proxy_2;
    void 0 === safeDescriptors && (safeDescriptors = globalState.safeDescriptors);
    descriptor = descriptor.value;
    if (null != (_annotation$options_ = annotation.options_) && _annotation$options_.bound) {
      var _adm$proxy_;
      descriptor = descriptor.bind(null != (_adm$proxy_ = adm.proxy_) ? _adm$proxy_ : adm.target_);
    }
    return {value:createAction(null != (_annotation$options_$ = null == (_annotation$options_2 = annotation.options_) ? void 0 : _annotation$options_2.name) ? _annotation$options_$ : key.toString(), descriptor, null != (_annotation$options_$2 = null == (_annotation$options_3 = annotation.options_) ? void 0 : _annotation$options_3.autoAction) ? _annotation$options_$2 : !1, null != (_annotation$options_4 = annotation.options_) && _annotation$options_4.bound ? null != (_adm$proxy_2 = adm.proxy_) ? _adm$proxy_2 : 
    adm.target_ : void 0), configurable:safeDescriptors ? adm.isPlainObject_ : !0, enumerable:!1, writable:safeDescriptors ? !1 : !0};
  }
  function createFlowAnnotation(name, options) {
    return {annotationType_:name, options_:options, make_:make_$2, extend_:extend_$2};
  }
  function make_$2(adm, key, descriptor, source) {
    var _this$options_;
    if (source === adm.target_) {
      return null === this.extend_(adm, key, descriptor, !1) ? 0 : 2;
    }
    if (null != (_this$options_ = this.options_) && _this$options_.bound && (!hasProp(adm.target_, key) || !isFlow(adm.target_[key])) && null === this.extend_(adm, key, descriptor, !1)) {
      return 0;
    }
    if (isFlow(descriptor.value)) {
      return 1;
    }
    adm = createFlowDescriptor(adm, this, key, descriptor, !1, !1);
    defineProperty(source, key, adm);
    return 2;
  }
  function extend_$2(adm, key, descriptor, proxyTrap) {
    var _this$options_2;
    descriptor = createFlowDescriptor(adm, this, key, descriptor, null == (_this$options_2 = this.options_) ? void 0 : _this$options_2.bound);
    return adm.defineProperty_(key, descriptor, proxyTrap);
  }
  function createFlowDescriptor(adm, annotation, key, descriptor, bound, safeDescriptors) {
    void 0 === safeDescriptors && (safeDescriptors = globalState.safeDescriptors);
    annotation = descriptor.value;
    isFlow(annotation) || (annotation = flow(annotation));
    if (bound) {
      var _adm$proxy_;
      annotation = annotation.bind(null != (_adm$proxy_ = adm.proxy_) ? _adm$proxy_ : adm.target_);
      annotation.isMobXFlow = !0;
    }
    return {value:annotation, configurable:safeDescriptors ? adm.isPlainObject_ : !0, enumerable:!1, writable:safeDescriptors ? !1 : !0};
  }
  function createComputedAnnotation(name, options) {
    return {annotationType_:name, options_:options, make_:make_$3, extend_:extend_$3};
  }
  function make_$3(adm, key, descriptor) {
    return null === this.extend_(adm, key, descriptor, !1) ? 0 : 1;
  }
  function extend_$3(adm, key, descriptor, proxyTrap) {
    return adm.defineComputedProperty_(key, _extends({}, this.options_, {get:descriptor.get, set:descriptor.set}), proxyTrap);
  }
  function createObservableAnnotation(name, options) {
    return {annotationType_:name, options_:options, make_:make_$4, extend_:extend_$4};
  }
  function make_$4(adm, key, descriptor) {
    return null === this.extend_(adm, key, descriptor, !1) ? 0 : 1;
  }
  function extend_$4(adm, key, descriptor, proxyTrap) {
    var _this$options_$enhanc, _this$options_;
    return adm.defineObservableProperty_(key, descriptor.value, null != (_this$options_$enhanc = null == (_this$options_ = this.options_) ? void 0 : _this$options_.enhancer) ? _this$options_$enhanc : deepEnhancer, proxyTrap);
  }
  function createAutoAnnotation(options) {
    return {annotationType_:"true", options_:options, make_:make_$5, extend_:extend_$5};
  }
  function make_$5(adm, key, descriptor, source) {
    var _this$options_3, _this$options_4;
    if (descriptor.get) {
      return computed.make_(adm, key, descriptor, source);
    }
    if (descriptor.set) {
      descriptor = createAction(key.toString(), descriptor.set);
      if (source === adm.target_) {
        return null === adm.defineProperty_(key, {configurable:globalState.safeDescriptors ? adm.isPlainObject_ : !0, set:descriptor}) ? 0 : 2;
      }
      defineProperty(source, key, {configurable:!0, set:descriptor});
      return 2;
    }
    if (source !== adm.target_ && "function" === typeof descriptor.value) {
      var _this$options_2;
      if (isGenerator(descriptor.value)) {
        var _this$options_;
        return (null != (_this$options_ = this.options_) && _this$options_.autoBind ? flow.bound : flow).make_(adm, key, descriptor, source);
      }
      return (null != (_this$options_2 = this.options_) && _this$options_2.autoBind ? autoAction.bound : autoAction).make_(adm, key, descriptor, source);
    }
    _this$options_2 = !1 === (null == (_this$options_3 = this.options_) ? void 0 : _this$options_3.deep) ? observable.ref : observable;
    if ("function" === typeof descriptor.value && null != (_this$options_4 = this.options_) && _this$options_4.autoBind) {
      var _adm$proxy_;
      descriptor.value = descriptor.value.bind(null != (_adm$proxy_ = adm.proxy_) ? _adm$proxy_ : adm.target_);
    }
    return _this$options_2.make_(adm, key, descriptor, source);
  }
  function extend_$5(adm, key, descriptor, proxyTrap) {
    var _this$options_5, _this$options_6;
    if (descriptor.get) {
      return computed.extend_(adm, key, descriptor, proxyTrap);
    }
    if (descriptor.set) {
      return adm.defineProperty_(key, {configurable:globalState.safeDescriptors ? adm.isPlainObject_ : !0, set:createAction(key.toString(), descriptor.set)}, proxyTrap);
    }
    if ("function" === typeof descriptor.value && null != (_this$options_5 = this.options_) && _this$options_5.autoBind) {
      var _adm$proxy_2;
      descriptor.value = descriptor.value.bind(null != (_adm$proxy_2 = adm.proxy_) ? _adm$proxy_2 : adm.target_);
    }
    return (!1 === (null == (_this$options_6 = this.options_) ? void 0 : _this$options_6.deep) ? observable.ref : observable).extend_(adm, key, descriptor, proxyTrap);
  }
  function getEnhancerFromOptions(options) {
    if (!0 === options.deep) {
      var JSCompiler_temp = deepEnhancer;
    } else {
      if (!1 === options.deep) {
        options = referenceEnhancer;
      } else {
        options = options.defaultDecorator;
        var _annotation$options_;
        options = options ? null != (JSCompiler_temp = null == (_annotation$options_ = options.options_) ? void 0 : _annotation$options_.enhancer) ? JSCompiler_temp : deepEnhancer : deepEnhancer;
      }
      JSCompiler_temp = options;
    }
    return JSCompiler_temp;
  }
  function createObservable(v2, arg2, arg3) {
    if (isStringish(arg2)) {
      storeAnnotation(v2, arg2, observableAnnotation);
    } else {
      return _isObservable(v2) ? v2 : isPlainObject(v2) ? observable.object(v2, arg2, arg3) : Array.isArray(v2) ? observable.array(v2, arg2) : isES6Map(v2) ? observable.map(v2, arg2) : isES6Set(v2) ? observable.set(v2, arg2) : "object" === typeof v2 && null !== v2 ? v2 : observable.box(v2, arg2);
    }
  }
  function createAction(actionName, fn, autoAction2, ref) {
    function res() {
      a: {
        var scope = ref || this, args = arguments, prevDerivation_ = globalState.trackingDerivation, runAsAction = !autoAction2 || !prevDerivation_;
        startBatch();
        var prevAllowStateChanges_ = globalState.allowStateChanges;
        runAsAction && (untrackedStart(), prevAllowStateChanges_ = allowStateChangesStart(!0));
        var prevAllowStateReads_ = allowStateReadsStart(!0), JSCompiler_object_inline_actionId__6606 = nextActionId++, JSCompiler_object_inline_parentActionId__6607 = currentActionId;
        currentActionId = JSCompiler_object_inline_actionId__6606;
        try {
          var JSCompiler_inline_result = fn.apply(scope, args);
          break a;
        } catch (err) {
          var JSCompiler_object_inline_error__6608 = err;
          throw err;
        } finally {
          currentActionId !== JSCompiler_object_inline_actionId__6606 && die(30), currentActionId = JSCompiler_object_inline_parentActionId__6607, void 0 !== JSCompiler_object_inline_error__6608 && (globalState.suppressReactionErrors = !0), globalState.allowStateChanges = prevAllowStateChanges_, globalState.allowStateReads = prevAllowStateReads_, endBatch(), runAsAction && (globalState.trackingDerivation = prevDerivation_), globalState.suppressReactionErrors = !1;
        }
        JSCompiler_inline_result = void 0;
      }
      return JSCompiler_inline_result;
    }
    void 0 === autoAction2 && (autoAction2 = !1);
    res.isMobxAction = !0;
    isFunctionNameConfigurable && (tmpNameDescriptor.value = actionName, Object.defineProperty(res, "name", tmpNameDescriptor));
    return res;
  }
  function allowStateChanges(allowStateChanges2, func) {
    allowStateChanges2 = allowStateChangesStart(allowStateChanges2);
    try {
      return func();
    } finally {
      globalState.allowStateChanges = allowStateChanges2;
    }
  }
  function allowStateChangesStart(allowStateChanges2) {
    var prev = globalState.allowStateChanges;
    globalState.allowStateChanges = allowStateChanges2;
    return prev;
  }
  function shouldCompute(derivation) {
    switch(derivation.dependenciesState_) {
      case IDerivationState_.UP_TO_DATE_:
        return !1;
      case IDerivationState_.NOT_TRACKING_:
      case IDerivationState_.STALE_:
        return !0;
      case IDerivationState_.POSSIBLY_STALE_:
        for (var prevAllowStateReads = allowStateReadsStart(!0), prevUntracked = untrackedStart(), obs = derivation.observing_, l3 = obs.length, i2 = 0; i2 < l3; i2++) {
          var obj = obs[i2];
          if (isComputedValue(obj)) {
            if (globalState.disableErrorBoundaries) {
              obj.get();
            } else {
              try {
                obj.get();
              } catch (e) {
                return globalState.trackingDerivation = prevUntracked, globalState.allowStateReads = prevAllowStateReads, !0;
              }
            }
            if (derivation.dependenciesState_ === IDerivationState_.STALE_) {
              return globalState.trackingDerivation = prevUntracked, globalState.allowStateReads = prevAllowStateReads, !0;
            }
          }
        }
        changeDependenciesStateTo0(derivation);
        globalState.trackingDerivation = prevUntracked;
        globalState.allowStateReads = prevAllowStateReads;
        return !1;
    }
  }
  function trackDerivedFunction(derivation, f2, context) {
    var prevAllowStateReads = allowStateReadsStart(!0);
    changeDependenciesStateTo0(derivation);
    derivation.newObserving_ = Array(derivation.observing_.length + 100);
    derivation.unboundDepsCount_ = 0;
    derivation.runId_ = ++globalState.runId;
    var prevTracking = globalState.trackingDerivation;
    globalState.trackingDerivation = derivation;
    globalState.inBatch++;
    if (!0 === globalState.disableErrorBoundaries) {
      var result = f2.call(context);
    } else {
      try {
        result = f2.call(context);
      } catch (e) {
        result = new CaughtException(e);
      }
    }
    globalState.inBatch--;
    globalState.trackingDerivation = prevTracking;
    var prevObserving = derivation.observing_;
    f2 = derivation.observing_ = derivation.newObserving_;
    context = IDerivationState_.UP_TO_DATE_;
    prevTracking = 0;
    for (var l3 = derivation.unboundDepsCount_, i2 = 0; i2 < l3; i2++) {
      var dep = f2[i2];
      0 === dep.diffValue_ && (dep.diffValue_ = 1, prevTracking !== i2 && (f2[prevTracking] = dep), prevTracking++);
      dep.dependenciesState_ > context && (context = dep.dependenciesState_);
    }
    f2.length = prevTracking;
    derivation.newObserving_ = null;
    for (l3 = prevObserving.length; l3--;) {
      i2 = prevObserving[l3], 0 === i2.diffValue_ && removeObserver(i2, derivation), i2.diffValue_ = 0;
    }
    for (; prevTracking--;) {
      prevObserving = f2[prevTracking], 1 === prevObserving.diffValue_ && (prevObserving.diffValue_ = 0, l3 = derivation, prevObserving.observers_.add(l3), prevObserving.lowestObserverState_ > l3.dependenciesState_ && (prevObserving.lowestObserverState_ = l3.dependenciesState_));
    }
    context !== IDerivationState_.UP_TO_DATE_ && (derivation.dependenciesState_ = context, derivation.onBecomeStale_());
    globalState.allowStateReads = prevAllowStateReads;
    return result;
  }
  function clearObserving(derivation) {
    var obs = derivation.observing_;
    derivation.observing_ = [];
    for (var i2 = obs.length; i2--;) {
      removeObserver(obs[i2], derivation);
    }
    derivation.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
  }
  function untracked(action2) {
    var prev = untrackedStart();
    try {
      return action2();
    } finally {
      globalState.trackingDerivation = prev;
    }
  }
  function untrackedStart() {
    var prev = globalState.trackingDerivation;
    globalState.trackingDerivation = null;
    return prev;
  }
  function allowStateReadsStart(allowStateReads) {
    var prev = globalState.allowStateReads;
    globalState.allowStateReads = allowStateReads;
    return prev;
  }
  function changeDependenciesStateTo0(derivation) {
    if (derivation.dependenciesState_ !== IDerivationState_.UP_TO_DATE_) {
      derivation.dependenciesState_ = IDerivationState_.UP_TO_DATE_;
      derivation = derivation.observing_;
      for (var i2 = derivation.length; i2--;) {
        derivation[i2].lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
      }
    }
  }
  function isolateGlobalState() {
    (globalState.pendingReactions.length || globalState.inBatch || globalState.isRunningReactions) && die(36);
    isolateCalled = !0;
    if (canMergeGlobalState) {
      var global2 = getGlobal();
      0 === --global2.__mobxInstanceCount && (global2.__mobxGlobals = void 0);
      globalState = new MobXGlobals();
    }
  }
  function removeObserver(observable2, node) {
    observable2.observers_["delete"](node);
    0 === observable2.observers_.size && queueForUnobservation(observable2);
  }
  function queueForUnobservation(observable2) {
    !1 === observable2.isPendingUnobservation_ && (observable2.isPendingUnobservation_ = !0, globalState.pendingUnobservations.push(observable2));
  }
  function startBatch() {
    globalState.inBatch++;
  }
  function endBatch() {
    if (0 === --globalState.inBatch) {
      0 < globalState.inBatch || globalState.isRunningReactions || reactionScheduler(runReactionsHelper);
      for (var list = globalState.pendingUnobservations, i2 = 0; i2 < list.length; i2++) {
        var observable2 = list[i2];
        observable2.isPendingUnobservation_ = !1;
        0 === observable2.observers_.size && (observable2.isBeingObserved_ && (observable2.isBeingObserved_ = !1, observable2.onBUO()), observable2 instanceof ComputedValue && observable2.suspend_());
      }
      globalState.pendingUnobservations = [];
    }
  }
  function reportObserved(observable2) {
    var derivation = globalState.trackingDerivation;
    if (null !== derivation) {
      return derivation.runId_ !== observable2.lastAccessedBy_ && (observable2.lastAccessedBy_ = derivation.runId_, derivation.newObserving_[derivation.unboundDepsCount_++] = observable2, !observable2.isBeingObserved_ && globalState.trackingContext && (observable2.isBeingObserved_ = !0, observable2.onBO())), observable2.isBeingObserved_;
    }
    0 === observable2.observers_.size && 0 < globalState.inBatch && queueForUnobservation(observable2);
    return !1;
  }
  function propagateChanged(observable2) {
    observable2.lowestObserverState_ !== IDerivationState_.STALE_ && (observable2.lowestObserverState_ = IDerivationState_.STALE_, observable2.observers_.forEach(function(d2) {
      if (d2.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
        d2.onBecomeStale_();
      }
      d2.dependenciesState_ = IDerivationState_.STALE_;
    }));
  }
  function propagateChangeConfirmed(observable2) {
    observable2.lowestObserverState_ !== IDerivationState_.STALE_ && (observable2.lowestObserverState_ = IDerivationState_.STALE_, observable2.observers_.forEach(function(d2) {
      d2.dependenciesState_ === IDerivationState_.POSSIBLY_STALE_ ? d2.dependenciesState_ = IDerivationState_.STALE_ : d2.dependenciesState_ === IDerivationState_.UP_TO_DATE_ && (observable2.lowestObserverState_ = IDerivationState_.UP_TO_DATE_);
    }));
  }
  function propagateMaybeChanged(observable2) {
    observable2.lowestObserverState_ === IDerivationState_.UP_TO_DATE_ && (observable2.lowestObserverState_ = IDerivationState_.POSSIBLY_STALE_, observable2.observers_.forEach(function(d2) {
      d2.dependenciesState_ === IDerivationState_.UP_TO_DATE_ && (d2.dependenciesState_ = IDerivationState_.POSSIBLY_STALE_, d2.onBecomeStale_());
    }));
  }
  function runReactionsHelper() {
    globalState.isRunningReactions = !0;
    for (var allReactions = globalState.pendingReactions, iterations = 0; 0 < allReactions.length;) {
      ++iterations === MAX_REACTION_ITERATIONS && (console.error("[mobx] cycle in reaction: " + allReactions[0]), allReactions.splice(0));
      for (var remainingReactions = allReactions.splice(0), i2 = 0, l3 = remainingReactions.length; i2 < l3; i2++) {
        remainingReactions[i2].runReaction_();
      }
    }
    globalState.isRunningReactions = !1;
  }
  function setReactionScheduler(fn) {
    var baseScheduler = reactionScheduler;
    reactionScheduler = function(f2) {
      return fn(function() {
        return baseScheduler(f2);
      });
    };
  }
  function spy(listener) {
    console.warn("[mobx.spy] Is a no-op in production builds");
    return function() {
    };
  }
  function createActionFactory(autoAction2) {
    return function(arg1, arg2) {
      if (isFunction(arg1)) {
        return createAction(arg1.name || "\x3cunnamed action\x3e", arg1, autoAction2);
      }
      if (isFunction(arg2)) {
        return createAction(arg1, arg2, autoAction2);
      }
      if (isStringish(arg2)) {
        return storeAnnotation(arg1, arg2, autoAction2 ? autoActionAnnotation : actionAnnotation);
      }
      if (isStringish(arg1)) {
        return createDecoratorAnnotation(createActionAnnotation(autoAction2 ? "autoAction" : ACTION, {name:arg1, autoAction:autoAction2}));
      }
    };
  }
  function isAction(thing) {
    return isFunction(thing) && !0 === thing.isMobxAction;
  }
  function autorun(view, opts) {
    function reactionRunner() {
      view(reaction2);
    }
    var _opts$name, _opts;
    void 0 === opts && (opts = EMPTY_OBJECT2);
    var name = null != (_opts$name = null == (_opts = opts) ? void 0 : _opts.name) ? _opts$name : "Autorun";
    if (opts.scheduler || opts.delay) {
      var scheduler = createSchedulerFromOptions(opts), isScheduled = !1;
      var reaction2 = new Reaction(name, function() {
        isScheduled || (isScheduled = !0, scheduler(function() {
          isScheduled = !1;
          reaction2.isDisposed_ || reaction2.track(reactionRunner);
        }));
      }, opts.onError, opts.requiresObservable);
    } else {
      reaction2 = new Reaction(name, function() {
        this.track(reactionRunner);
      }, opts.onError, opts.requiresObservable);
    }
    reaction2.schedule_();
    return reaction2.getDisposer_();
  }
  function createSchedulerFromOptions(opts) {
    return opts.scheduler ? opts.scheduler : opts.delay ? function(f2) {
      return setTimeout(f2, opts.delay);
    } : run;
  }
  function reaction(expression, effect, opts) {
    function reactionRunner() {
      isScheduled = !1;
      if (!r2.isDisposed_) {
        var changed = !1;
        r2.track(function() {
          var nextValue = allowStateChanges(!1, function() {
            return expression(r2);
          });
          changed = firstTime || !equals(value, nextValue);
          oldValue = value;
          value = nextValue;
        });
        firstTime && opts.fireImmediately ? effectAction(value, oldValue, r2) : !firstTime && changed && effectAction(value, oldValue, r2);
        firstTime = !1;
      }
    }
    var _opts$name2;
    void 0 === opts && (opts = EMPTY_OBJECT2);
    var name = null != (_opts$name2 = opts.name) ? _opts$name2 : "Reaction", effectAction = action(name, opts.onError ? wrapErrorHandler(opts.onError, effect) : effect), runSync = !opts.scheduler && !opts.delay, scheduler = createSchedulerFromOptions(opts), firstTime = !0, isScheduled = !1, value, oldValue, equals = opts.compareStructural ? comparer.structural : opts.equals || comparer["default"], r2 = new Reaction(name, function() {
      firstTime || runSync ? reactionRunner() : isScheduled || (isScheduled = !0, scheduler(reactionRunner));
    }, opts.onError, opts.requiresObservable);
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
  function onBecomeUnobserved(thing, arg2, arg3) {
    return interceptHook(ON_BECOME_UNOBSERVED, thing, arg2, arg3);
  }
  function interceptHook(hook, thing, arg2, arg3) {
    var atom = "function" === typeof arg3 ? getAtom(thing, arg2) : getAtom(thing), cb = isFunction(arg3) ? arg3 : arg2, listenersKey = hook + "L";
    atom[listenersKey] ? atom[listenersKey].add(cb) : atom[listenersKey] = new Set([cb]);
    return function() {
      var hookListeners = atom[listenersKey];
      hookListeners && (hookListeners["delete"](cb), 0 === hookListeners.size && delete atom[listenersKey]);
    };
  }
  function configure(options) {
    !0 === options.isolateGlobalState && isolateGlobalState();
    var useProxies = options.useProxies, enforceActions = options.enforceActions;
    void 0 !== useProxies && (globalState.useProxies = "always" === useProxies ? !0 : "never" === useProxies ? !1 : "undefined" !== typeof Proxy);
    "ifavailable" === useProxies && (globalState.verifyProxies = !0);
    void 0 !== enforceActions && (useProxies = "always" === enforceActions ? "always" : "observed" === enforceActions, globalState.enforceActions = useProxies, globalState.allowStateChanges = !0 === useProxies || "always" === useProxies ? !1 : !0);
    ["computedRequiresReaction", "reactionRequiresObservable", "observableRequiresReaction", "disableErrorBoundaries", "safeDescriptors"].forEach(function(key) {
      key in options && (globalState[key] = !!options[key]);
    });
    globalState.allowStateReads = !globalState.observableRequiresReaction;
    options.reactionScheduler && setReactionScheduler(options.reactionScheduler);
  }
  function extendObservable(target, properties, annotations, options) {
    var descriptors = getOwnPropertyDescriptors(properties), adm = asObservableObject(target, options)[$mobx];
    startBatch();
    try {
      ownKeys(descriptors).forEach(function(key) {
        adm.extend_(key, descriptors[key], annotations ? key in annotations ? annotations[key] : !0 : !0);
      });
    } finally {
      endBatch();
    }
    return target;
  }
  function nodeToDependencyTree(node) {
    var result = {name:node.name_};
    node.observing_ && 0 < node.observing_.length && (result.dependencies = Array.from(new Set(node.observing_)).map(nodeToDependencyTree));
    return result;
  }
  function FlowCancellationError() {
    this.message = "FLOW_CANCELLED";
  }
  function isFlow(fn) {
    return !0 === (null == fn ? void 0 : fn.isMobXFlow);
  }
  function _isObservable(value, property) {
    return value ? void 0 !== property ? isObservableObject(value) ? value[$mobx].values_.has(property) : !1 : isObservableObject(value) || !!value[$mobx] || isAtom(value) || isReaction(value) || isComputedValue(value) : !1;
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
    if (null == source || "object" !== typeof source || source instanceof Date || !_isObservable(source)) {
      return source;
    }
    if (isObservableValue(source) || isComputedValue(source)) {
      return toJSHelper(source.get(), __alreadySeen);
    }
    if (__alreadySeen.has(source)) {
      return __alreadySeen.get(source);
    }
    if (isObservableArray(source)) {
      var res = cache(__alreadySeen, source, Array(source.length));
      source.forEach(function(value, idx) {
        res[idx] = toJSHelper(value, __alreadySeen);
      });
      return res;
    }
    if (isObservableSet(source)) {
      var _res = cache(__alreadySeen, source, new Set());
      source.forEach(function(value) {
        _res.add(toJSHelper(value, __alreadySeen));
      });
      return _res;
    }
    if (isObservableMap(source)) {
      var _res2 = cache(__alreadySeen, source, new Map());
      source.forEach(function(value, key) {
        _res2.set(key, toJSHelper(value, __alreadySeen));
      });
      return _res2;
    }
    var _res3 = cache(__alreadySeen, source, {});
    apiOwnKeys(source).forEach(function(key) {
      objectPrototype.propertyIsEnumerable.call(source, key) && (_res3[key] = toJSHelper(source[key], __alreadySeen));
    });
    return _res3;
  }
  function toJS(source, options) {
    return toJSHelper(source, new Map());
  }
  function trace() {
    die("trace() is not available in production builds");
    for (var enterBreakPoint = !1, _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    "boolean" === typeof args[args.length - 1] && (enterBreakPoint = args.pop());
    a: {
      switch(args.length) {
        case 0:
          _len = globalState.trackingDerivation;
          break a;
        case 1:
          _len = getAtom(args[0]);
          break a;
        case 2:
          _len = getAtom(args[0], args[1]);
          break a;
      }
      _len = void 0;
    }
    if (!_len) {
      return die("'trace(break?)' can only be used inside a tracked computed value or a Reaction. Consider passing in the computed value or reaction explicitly");
    }
    _len.isTracing_ === TraceMode.NONE && console.log("[mobx.trace] '" + _len.name_ + "' tracing enabled");
    _len.isTracing_ = enterBreakPoint ? TraceMode.BREAK : TraceMode.LOG;
  }
  function transaction(action2, thisArg) {
    void 0 === thisArg && (thisArg = void 0);
    startBatch();
    try {
      return action2.apply(thisArg);
    } finally {
      endBatch();
    }
  }
  function hasInterceptors(interceptable) {
    return void 0 !== interceptable.interceptors_ && 0 < interceptable.interceptors_.length;
  }
  function registerInterceptor(interceptable, handler) {
    var interceptors = interceptable.interceptors_ || (interceptable.interceptors_ = []);
    interceptors.push(handler);
    return once(function() {
      var idx = interceptors.indexOf(handler);
      -1 !== idx && interceptors.splice(idx, 1);
    });
  }
  function interceptChange(interceptable, change) {
    var prevU = untrackedStart();
    try {
      var interceptors = [].concat(interceptable.interceptors_ || []);
      interceptable = 0;
      for (var l3 = interceptors.length; interceptable < l3 && ((change = interceptors[interceptable](change)) && !change.type && die(14), change); interceptable++) {
      }
      return change;
    } finally {
      globalState.trackingDerivation = prevU;
    }
  }
  function hasListeners(listenable) {
    return void 0 !== listenable.changeListeners_ && 0 < listenable.changeListeners_.length;
  }
  function registerListener(listenable, handler) {
    var listeners = listenable.changeListeners_ || (listenable.changeListeners_ = []);
    listeners.push(handler);
    return once(function() {
      var idx = listeners.indexOf(handler);
      -1 !== idx && listeners.splice(idx, 1);
    });
  }
  function notifyListeners(listenable, change) {
    var prevU = untrackedStart();
    if (listenable = listenable.changeListeners_) {
      listenable = listenable.slice();
      for (var i2 = 0, l3 = listenable.length; i2 < l3; i2++) {
        listenable[i2](change);
      }
      globalState.trackingDerivation = prevU;
    }
  }
  function makeObservable(target, annotations, options) {
    var adm = asObservableObject(target, options)[$mobx];
    startBatch();
    try {
      var _annotations;
      null != (_annotations = annotations) ? _annotations : annotations = collectStoredAnnotations(target);
      ownKeys(annotations).forEach(function(key) {
        return adm.make_(key, annotations[key]);
      });
    } finally {
      endBatch();
    }
    return target;
  }
  function createObservableArray(initialValues, enhancer, name, owned) {
    void 0 === name && (name = "ObservableArray");
    void 0 === owned && (owned = !1);
    assertProxies();
    enhancer = new ObservableArrayAdministration(name, enhancer, owned, !1);
    addHiddenFinalProp(enhancer.values_, $mobx, enhancer);
    name = new Proxy(enhancer.values_, arrayTraps);
    enhancer.proxy_ = name;
    initialValues && initialValues.length && (owned = allowStateChangesStart(!0), enhancer.spliceWithArray_(0, 0, initialValues), globalState.allowStateChanges = owned);
    return name;
  }
  function addArrayExtension(funcName, funcFactory) {
    "function" === typeof Array.prototype[funcName] && (arrayExtensions[funcName] = funcFactory(funcName));
  }
  function simpleFunc(funcName) {
    return function() {
      var adm = this[$mobx];
      adm.atom_.reportObserved();
      adm = adm.dehanceValues_(adm.values_);
      return adm[funcName].apply(adm, arguments);
    };
  }
  function mapLikeFunc(funcName) {
    return function(callback, thisArg) {
      var _this2 = this, adm = this[$mobx];
      adm.atom_.reportObserved();
      return adm.dehanceValues_(adm.values_)[funcName](function(element, index2) {
        return callback.call(thisArg, element, index2, _this2);
      });
    };
  }
  function reduceLikeFunc(funcName) {
    return function() {
      var _this3 = this, adm = this[$mobx];
      adm.atom_.reportObserved();
      adm = adm.dehanceValues_(adm.values_);
      var callback = arguments[0];
      arguments[0] = function(accumulator, currentValue, index2) {
        return callback(accumulator, currentValue, index2, _this3);
      };
      return adm[funcName].apply(adm, arguments);
    };
  }
  function isObservableArray(thing) {
    return isObject(thing) && isObservableArrayAdministration(thing[$mobx]);
  }
  function convertToMap(dataStructure) {
    if (isES6Map(dataStructure) || isObservableMap(dataStructure)) {
      return dataStructure;
    }
    if (Array.isArray(dataStructure)) {
      return new Map(dataStructure);
    }
    if (isPlainObject(dataStructure)) {
      var map3 = new Map(), key;
      for (key in dataStructure) {
        map3.set(key, dataStructure[key]);
      }
      return map3;
    }
    return die(21, dataStructure);
  }
  function asObservableObject(target, options) {
    var _options$name;
    if (hasProp(target, $mobx)) {
      return target;
    }
    var name = null != (_options$name = null == options ? void 0 : options.name) ? _options$name : "ObservableObject";
    _options$name = ObservableObjectAdministration;
    var JSCompiler_temp_const = new Map();
    name = String(name);
    var _options$defaultDecor;
    var JSCompiler_inline_result = options ? null != (_options$defaultDecor = options.defaultDecorator) ? _options$defaultDecor : createAutoAnnotation(options) : void 0;
    options = new _options$name(target, JSCompiler_temp_const, name, JSCompiler_inline_result);
    addHiddenProp(target, $mobx, options);
    return target;
  }
  function getCachedObservablePropDescriptor(key) {
    return descriptorCache[key] || (descriptorCache[key] = {get:function() {
      return this[$mobx].getObservablePropValue_(key);
    }, set:function(value) {
      return this[$mobx].setObservablePropValue_(key, value);
    }});
  }
  function isObservableObject(thing) {
    return isObject(thing) ? isObservableObjectAdministration(thing[$mobx]) : !1;
  }
  function createArrayEntryDescriptor(index2) {
    return {enumerable:!1, configurable:!0, get:function() {
      return this[$mobx].get_(index2);
    }, set:function(value) {
      this[$mobx].set_(index2, value);
    }};
  }
  function reserveArrayBuffer(max) {
    if (max > OBSERVABLE_ARRAY_BUFFER_SIZE) {
      for (var index2 = OBSERVABLE_ARRAY_BUFFER_SIZE; index2 < max + 100; index2++) {
        defineProperty(LegacyObservableArray.prototype, "" + index2, createArrayEntryDescriptor(index2));
      }
      OBSERVABLE_ARRAY_BUFFER_SIZE = max;
    }
  }
  function createLegacyArray(initialValues, enhancer, name) {
    return new LegacyObservableArray(initialValues, enhancer, name);
  }
  function getAtom(thing, property) {
    if ("object" === typeof thing && null !== thing) {
      if (isObservableArray(thing)) {
        return void 0 !== property && die(23), thing[$mobx].atom_;
      }
      if (isObservableSet(thing)) {
        return thing[$mobx];
      }
      if (isObservableMap(thing)) {
        if (void 0 === property) {
          return thing.keysAtom_;
        }
        var observable2 = thing.data_.get(property) || thing.hasMap_.get(property);
        observable2 || die(25, property, getDebugName(thing));
        return observable2;
      }
      if (isObservableObject(thing)) {
        if (!property) {
          return die(26);
        }
        (observable2 = thing[$mobx].values_.get(property)) || die(27, property, getDebugName(thing));
        return observable2;
      }
      if (isAtom(thing) || isComputedValue(thing) || isReaction(thing)) {
        return thing;
      }
    } else if (isFunction(thing) && isReaction(thing[$mobx])) {
      return thing[$mobx];
    }
    die(28);
  }
  function getAdministration(thing, property) {
    thing || die(29);
    if (void 0 !== property) {
      return getAdministration(getAtom(thing, property));
    }
    if (isAtom(thing) || isComputedValue(thing) || isReaction(thing) || isObservableMap(thing) || isObservableSet(thing)) {
      return thing;
    }
    if (thing[$mobx]) {
      return thing[$mobx];
    }
    die(24, thing);
  }
  function getDebugName(thing, property) {
    if (void 0 !== property) {
      thing = getAtom(thing, property);
    } else {
      if (isAction(thing)) {
        return thing.name;
      }
      thing = isObservableObject(thing) || isObservableMap(thing) || isObservableSet(thing) ? getAdministration(thing) : getAtom(thing);
    }
    return thing.name_;
  }
  function deepEqual(a3, b3, depth) {
    void 0 === depth && (depth = -1);
    return eq(a3, b3, depth);
  }
  function eq(a3, b3, depth, aStack, bStack) {
    if (a3 === b3) {
      return 0 !== a3 || 1 / a3 === 1 / b3;
    }
    if (null == a3 || null == b3) {
      return !1;
    }
    if (a3 !== a3) {
      return b3 !== b3;
    }
    var type = typeof a3;
    if ("function" !== type && "object" !== type && "object" != typeof b3) {
      return !1;
    }
    type = toString.call(a3);
    if (type !== toString.call(b3)) {
      return !1;
    }
    switch(type) {
      case "[object RegExp]":
      case "[object String]":
        return "" + a3 === "" + b3;
      case "[object Number]":
        return +a3 !== +a3 ? +b3 !== +b3 : 0 === +a3 ? 1 / +a3 === 1 / b3 : +a3 === +b3;
      case "[object Date]":
      case "[object Boolean]":
        return +a3 === +b3;
      case "[object Symbol]":
        return "undefined" !== typeof Symbol && Symbol.valueOf.call(a3) === Symbol.valueOf.call(b3);
      case "[object Map]":
      case "[object Set]":
        0 <= depth && depth++;
    }
    a3 = unwrap(a3);
    b3 = unwrap(b3);
    type = "[object Array]" === type;
    if (!type) {
      if ("object" != typeof a3 || "object" != typeof b3) {
        return !1;
      }
      var aCtor = a3.constructor, bCtor = b3.constructor;
      if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor && isFunction(bCtor) && bCtor instanceof bCtor) && "constructor" in a3 && "constructor" in b3) {
        return !1;
      }
    }
    if (0 === depth) {
      return !1;
    }
    0 > depth && (depth = -1);
    aStack = aStack || [];
    bStack = bStack || [];
    for (aCtor = aStack.length; aCtor--;) {
      if (aStack[aCtor] === a3) {
        return bStack[aCtor] === b3;
      }
    }
    aStack.push(a3);
    bStack.push(b3);
    if (type) {
      aCtor = a3.length;
      if (aCtor !== b3.length) {
        return !1;
      }
      for (; aCtor--;) {
        if (!eq(a3[aCtor], b3[aCtor], depth - 1, aStack, bStack)) {
          return !1;
        }
      }
    } else {
      type = Object.keys(a3);
      aCtor = type.length;
      if (Object.keys(b3).length !== aCtor) {
        return !1;
      }
      for (; aCtor--;) {
        if (bCtor = type[aCtor], !hasProp(b3, bCtor) || !eq(a3[bCtor], b3[bCtor], depth - 1, aStack, bStack)) {
          return !1;
        }
      }
    }
    aStack.pop();
    bStack.pop();
    return !0;
  }
  function unwrap(a3) {
    return isObservableArray(a3) ? a3.slice() : isES6Map(a3) || isObservableMap(a3) || isES6Set(a3) || isObservableSet(a3) ? Array.from(a3.entries()) : a3;
  }
  function makeIterable(iterator) {
    iterator[Symbol.iterator] = getSelf;
    return iterator;
  }
  function getSelf() {
    return this;
  }
  function getRelatedBindings(bindings, ids) {
    const changedShapeIds = new Set(ids), bindingsArr = Object.values(bindings), bindingsToUpdate = new Set(bindingsArr.filter(binding => changedShapeIds.has(binding.toId) || changedShapeIds.has(binding.fromId)));
    bindings = bindingsToUpdate.size;
    for (ids = -1; 0 !== ids;) {
      bindingsToUpdate.forEach(binding => {
        binding = binding.fromId;
        for (const otherBinding of bindingsArr) {
          otherBinding.fromId === binding && bindingsToUpdate.add(otherBinding), otherBinding.toId === binding && bindingsToUpdate.add(otherBinding);
        }
      }), ids = bindingsToUpdate.size - bindings, bindings = bindingsToUpdate.size;
    }
    return Array.from(bindingsToUpdate.values());
  }
  function findBindingPoint(shape, target, handleId, bindingId, point, origin, direction, bindAnywhere) {
    if (point = target.getBindingPoint(point, origin, direction, bindAnywhere)) {
      return {id:bindingId, type:"line", fromId:shape.id, toId:target.id, handleId, point:src_default.toFixed(point.point), distance:point.distance};
    }
  }
  function createNewLineBinding(source, target) {
    const cs = source.getCenter(), ct2 = target.getCenter();
    var lineId = v1_default();
    lineId = __spreadProps(__spreadValues({}, TLLineShape.defaultProps), {id:lineId, type:TLLineShape.id, parentId:source.props.parentId, point:cs});
    source = findBindingPoint(lineId, source, "start", v1_default(), cs, cs, src_default.uni(src_default.sub(ct2, cs)), !1);
    target = findBindingPoint(lineId, target, "end", v1_default(), ct2, ct2, src_default.uni(src_default.sub(cs, ct2)), !1);
    return source && target ? (lineId.handles.start.point = [0, 0], lineId.handles.end.point = src_default.sub(ct2, cs), lineId.handles.start.bindingId = source.id, lineId.handles.end.bindingId = target.id, [lineId, [source, target]]) : null;
  }
  function createCacheLegacy() {
    return new LegacyCache();
  }
  function createCacheModern() {
    return new WeakMap();
  }
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
    regExp.global && (flags += "g");
    regExp.ignoreCase && (flags += "i");
    regExp.multiline && (flags += "m");
    regExp.unicode && (flags += "u");
    regExp.sticky && (flags += "y");
    return flags;
  }
  function getRegExpFlagsModern(regExp) {
    return regExp.flags;
  }
  function getTagLegacy(value) {
    value = toStringObject.call(value);
    return value.substring(8, value.length - 1);
  }
  function getTagModern(value) {
    return value[Symbol.toStringTag] || getTagLegacy(value);
  }
  function getStrictPropertiesModern(object2) {
    return getOwnPropertyNames(object2).concat(getOwnPropertySymbols(object2));
  }
  function copyOwnPropertiesStrict(value, clone, state) {
    for (var properties = getStrictProperties(value), index2 = 0, length_1 = properties.length, property, descriptor; index2 < length_1; ++index2) {
      if (property = properties[index2], "callee" !== property && "caller" !== property) {
        if (descriptor = getOwnPropertyDescriptor(value, property)) {
          descriptor.get || descriptor.set || (descriptor.value = state.copier(descriptor.value, state));
          try {
            defineProperty3(clone, property, descriptor);
          } catch (error) {
            clone[property] = descriptor.value;
          }
        } else {
          clone[property] = state.copier(value[property], state);
        }
      }
    }
    return clone;
  }
  function copyMapLoose(map3, state) {
    var clone = new state.Constructor();
    state.cache.set(map3, clone);
    map3.forEach(function(value, key) {
      clone.set(key, state.copier(value, state));
    });
    return clone;
  }
  function copyObjectLooseLegacy(object2, state) {
    var clone = getCleanClone(state.prototype);
    state.cache.set(object2, clone);
    for (var key in object2) {
      hasOwnProperty.call(object2, key) && (clone[key] = state.copier(object2[key], state));
    }
    return clone;
  }
  function copyObjectLooseModern(object2, state) {
    var clone = getCleanClone(state.prototype);
    state.cache.set(object2, clone);
    for (var key in object2) {
      hasOwnProperty.call(object2, key) && (clone[key] = state.copier(object2[key], state));
    }
    key = getOwnPropertySymbols(object2);
    for (var index2 = 0, length_3 = key.length, symbol; index2 < length_3; ++index2) {
      symbol = key[index2], propertyIsEnumerable.call(object2, symbol) && (clone[symbol] = state.copier(object2[symbol], state));
    }
    return clone;
  }
  function copyPrimitiveWrapper(primitiveObject, state) {
    return new state.Constructor(primitiveObject.valueOf());
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
  function createCopier(options) {
    function copier(value, state) {
      state.prototype = state.Constructor = void 0;
      if (!value || "object" !== typeof value) {
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
      return tagSpecificCopier ? tagSpecificCopier(value, state) : "function" === typeof value.then ? value : object2(value, state);
    }
    options = assign2({}, DEFAULT_LOOSE_OPTIONS, options);
    var tagSpecificCopiers = {Arguments:options.object, Array:options.array, ArrayBuffer:options.arrayBuffer, Blob:options.blob, Boolean:copyPrimitiveWrapper, DataView:options.dataView, Date:options.date, Error:options.error, Float32Array:options.arrayBuffer, Float64Array:options.arrayBuffer, Int8Array:options.arrayBuffer, Int16Array:options.arrayBuffer, Int32Array:options.arrayBuffer, Map:options.map, Number:copyPrimitiveWrapper, Object:options.object, Promise:copySelf, RegExp:options.regExp, Set:options.set, 
    String:copyPrimitiveWrapper, WeakMap:copySelf, WeakSet:copySelf, Uint8Array:options.arrayBuffer, Uint8ClampedArray:options.arrayBuffer, Uint16Array:options.arrayBuffer, Uint32Array:options.arrayBuffer, Uint64Array:options.arrayBuffer}, array2 = tagSpecificCopiers.Array, object2 = tagSpecificCopiers.Object;
    return function(value) {
      return copier(value, {Constructor:void 0, cache:createCache(), copier, prototype:void 0});
    };
  }
  function deepMerge(a3, b3) {
    return (0,import_deepmerge.default)(a3, b3, {arrayMerge:(destinationArray, sourceArray, options) => sourceArray});
  }
  function modulate(value, rangeA, rangeB, clamp3 = !1) {
    const [fromLow, fromHigh] = rangeA, [v0, v12] = rangeB;
    value = v0 + (value - fromLow) / (fromHigh - fromLow) * (v12 - v0);
    return clamp3 ? v0 < v12 ? Math.max(Math.min(value, v12), v0) : Math.max(Math.min(value, v0), v12) : value;
  }
  function getSizeFromSrc(dataURL, type) {
    return new Promise((resolve, reject) => {
      if ("video" === type) {
        const video = document.createElement("video");
        video.addEventListener("loadedmetadata", function() {
          resolve([this.videoWidth, this.videoHeight]);
        }, !1);
        video.src = dataURL;
      } else if ("image" === type) {
        const img = new Image();
        img.onload = () => resolve([img.width, img.height]);
        img.src = dataURL;
        img.onerror = err => reject(err);
      } else {
        "pdf" === type && resolve([595, 842]);
      }
    });
  }
  function isBuiltInColor(color) {
    return Object.values(Color).includes(color);
  }
  function getComputedColor(color, type) {
    return isBuiltInColor(color) || null == color ? `var(--ls-wb-${type}-color-${color ? color : "default"})` : color;
  }
  function getMeasurementDiv() {
    var _a3;
    null == (_a3 = document.getElementById("__textLabelMeasure")) || _a3.remove();
    _a3 = document.createElement("pre");
    _a3.id = "__textLabelMeasure";
    Object.assign(_a3.style, {whiteSpace:"pre", width:"auto", borderLeft:"2px solid transparent", borderRight:"1px solid transparent", borderBottom:"2px solid transparent", padding:"0px", margin:"0px", opacity:"0", position:"absolute", top:"-500px", left:"0px", zIndex:"9999", userSelect:"none", pointerEvents:"none", font:"var(--ls-font-family)"});
    _a3.tabIndex = -1;
    document.body.appendChild(_a3);
    return _a3;
  }
  function getTextLabelSize(text, fontOrStyles, padding = 0) {
    var _a3, _b, _c;
    if (!text) {
      return [16, 32];
    }
    let font5;
    font5 = "string" === typeof fontOrStyles ? fontOrStyles : `${null != (_a3 = fontOrStyles.fontStyle) ? _a3 : "normal"} ${null != (_b = fontOrStyles.fontVariant) ? _b : "normal"} ${null != (_c = fontOrStyles.fontWeight) ? _c : "normal"} ${fontOrStyles.fontSize}px/${fontOrStyles.fontSize * fontOrStyles.lineHeight}px ${fontOrStyles.fontFamily}`;
    if (!cache2.has(`${text}-${font5}-${padding}`)) {
      if (!melm) {
        return [10, 10];
      }
      melm.parentNode || document.body.appendChild(melm);
      melm.innerHTML = `${text}&#8203;`;
      melm.style.font = font5;
      melm.style.padding = padding + "px";
      fontOrStyles = melm.getBoundingClientRect();
      cache2.set(`${text}-${font5}-${padding}`, [Math.ceil(fontOrStyles.width || 1), Math.ceil(fontOrStyles.height || 1)]);
    }
    return cache2.get(`${text}-${font5}-${padding}`);
  }
  function validUUID(input) {
    try {
      if ("string" !== typeof input || !regex_default.test(input)) {
        throw TypeError("Invalid UUID");
      }
      let v2;
      const arr = new Uint8Array(16);
      arr[0] = (v2 = parseInt(input.slice(0, 8), 16)) >>> 24;
      arr[1] = v2 >>> 16 & 255;
      arr[2] = v2 >>> 8 & 255;
      arr[3] = v2 & 255;
      arr[4] = (v2 = parseInt(input.slice(9, 13), 16)) >>> 8;
      arr[5] = v2 & 255;
      arr[6] = (v2 = parseInt(input.slice(14, 18), 16)) >>> 8;
      arr[7] = v2 & 255;
      arr[8] = (v2 = parseInt(input.slice(19, 23), 16)) >>> 8;
      arr[9] = v2 & 255;
      arr[10] = (v2 = parseInt(input.slice(24, 36), 16)) / 1099511627776 & 255;
      arr[11] = v2 / 4294967296 & 255;
      arr[12] = v2 >>> 24 & 255;
      arr[13] = v2 >>> 16 & 255;
      arr[14] = v2 >>> 8 & 255;
      arr[15] = v2 & 255;
      return !0;
    } catch (e) {
      return !1;
    }
  }
  function debounce(fn, ms = 0, immediateFn) {
    let timeoutId;
    return function(...args) {
      null == immediateFn || immediateFn(...args);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(args), ms);
    };
  }
  function isDarwin() {
    return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
  }
  function isDev() {
    var _a3, _b, _c;
    return (null == (_c = null == (_b = null == (_a3 = null == window ? void 0 : window.logseq) ? void 0 : _a3.api) ? void 0 : _b.get_state_from_store) ? void 0 : _c.call(_b, "ui/developer-mode?")) || !1;
  }
  function isNonNullable(value) {
    return !!value;
  }
  function delay(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  function getRendererContext(id3 = "noid") {
    contextMap[id3] || (contextMap[id3] = React.createContext({}));
    return contextMap[id3];
  }
  function useRendererContext(id3 = "noid") {
    return React.useContext(getRendererContext(id3));
  }
  function useBoundsEvents(handle) {
    const {callbacks} = useRendererContext(), rDoubleClickTimer = React2.useRef(-1);
    return React2.useMemo(() => {
      const onPointerUp = e => {
        var _a3, _b;
        const {order = 0} = e;
        if (!order) {
          var elm = e.target;
          elm.removeEventListener("pointerup", onPointerUp);
          elm.releasePointerCapture(e.pointerId);
          null == (_a3 = callbacks.onPointerUp) || _a3.call(callbacks, {type:"selection", handle, order}, e);
          _a3 = Date.now();
          elm = _a3 - rDoubleClickTimer.current;
          300 < elm ? rDoubleClickTimer.current = _a3 : 300 >= elm && (null == (_b = callbacks.onDoubleClick) || _b.call(callbacks, {type:"selection", handle, order}, e), rDoubleClickTimer.current = -1);
          e.order = order + 1;
        }
      };
      return {onPointerDown:e => {
        var _a3;
        const {order = 0} = e;
        if (!order) {
          var elm = loopToHtmlElement(e.currentTarget);
          elm.setPointerCapture(e.pointerId);
          elm.addEventListener("pointerup", onPointerUp);
          null == (_a3 = callbacks.onPointerDown) || _a3.call(callbacks, {type:"selection", handle, order}, e);
          e.order = order + 1;
        }
      }, onPointerMove:e => {
        var _a3;
        const {order = 0} = e;
        order || (null == (_a3 = callbacks.onPointerMove) || _a3.call(callbacks, {type:"selection", handle, order}, e), e.order = order + 1);
      }, onPointerEnter:e => {
        var _a3;
        const {order = 0} = e;
        order || (null == (_a3 = callbacks.onPointerEnter) || _a3.call(callbacks, {type:"selection", handle, order}, e), e.order = order + 1);
      }, onPointerLeave:e => {
        var _a3;
        const {order = 0} = e;
        order || (null == (_a3 = callbacks.onPointerLeave) || _a3.call(callbacks, {type:"selection", handle, order}, e), e.order = order + 1);
      }, onKeyDown:e => {
        var _a3;
        null == (_a3 = callbacks.onKeyDown) || _a3.call(callbacks, {type:"selection", handle, order:-1}, e);
      }, onKeyUp:e => {
        var _a3;
        null == (_a3 = callbacks.onKeyUp) || _a3.call(callbacks, {type:"selection", handle, order:-1}, e);
      }};
    }, [callbacks]);
  }
  function loopToHtmlElement(elm) {
    var _a3;
    if (null == (_a3 = elm.namespaceURI) ? 0 : _a3.endsWith("svg")) {
      if (elm.parentElement) {
        return loopToHtmlElement(elm.parentElement);
      }
      throw Error("Could not find a parent element of an HTML type!");
    }
    return elm;
  }
  function useResizeObserver(ref, viewport, onBoundsChange) {
    const rIsMounted = React3.useRef(!1), updateBounds = React3.useCallback(() => {
      var _a3;
      if (rIsMounted.current) {
        const rect = null == (_a3 = ref.current) ? void 0 : _a3.getBoundingClientRect();
        rect && (_a3 = {minX:rect.left, maxX:rect.left + rect.width, minY:rect.top, maxY:rect.top + rect.height, width:rect.width, height:rect.height}, viewport.updateBounds(_a3), null == onBoundsChange || onBoundsChange(_a3));
      } else {
        rIsMounted.current = !0;
      }
    }, [ref, onBoundsChange]);
    React3.useEffect(() => {
      const scrollingAnchor = ref.current ? getNearestScrollableContainer(ref.current) : document, debouncedupdateBounds = debounce(updateBounds, 100);
      scrollingAnchor.addEventListener("scroll", debouncedupdateBounds);
      window.addEventListener("resize", debouncedupdateBounds);
      return () => {
        scrollingAnchor.removeEventListener("scroll", debouncedupdateBounds);
        window.removeEventListener("resize", debouncedupdateBounds);
      };
    }, []);
    React3.useLayoutEffect(() => {
      const resizeObserver = new ResizeObserver(entries => {
        entries[0].contentRect && updateBounds();
      });
      ref.current && resizeObserver.observe(ref.current);
      return () => {
        resizeObserver.disconnect();
      };
    }, [ref]);
    React3.useEffect(() => {
      updateBounds();
      setTimeout(() => {
        var _a3, _b;
        null == (_b = null == (_a3 = ref.current) ? void 0 : _a3.querySelector(".tl-canvas")) || _b.focus();
      });
    }, [ref]);
  }
  function makeCssTheme(prefix, theme) {
    return Object.keys(theme).reduce((acc, key) => {
      const value = theme[key];
      return value ? acc + `${`--${prefix}-${key}`}: ${value};
` : acc;
    }, "");
  }
  function useTheme(prefix, theme, selector = ".logseq-tldraw") {
    React4.useLayoutEffect(() => {
      const style = document.createElement("style"), cssTheme = makeCssTheme(prefix, theme);
      style.setAttribute("id", `${prefix}-theme`);
      style.setAttribute("data-selector", selector);
      style.innerHTML = `
        ${selector} {
          ${cssTheme}
        }
      `;
      document.head.appendChild(style);
      return () => {
        style && document.head.contains(style) && document.head.removeChild(style);
      };
    }, [prefix, theme, selector]);
  }
  function useStyle(uid, rules) {
    React4.useLayoutEffect(() => {
      if (styles.get(uid)) {
        return () => {
        };
      }
      const style = document.createElement("style");
      style.innerHTML = rules;
      style.setAttribute("id", uid);
      document.head.appendChild(style);
      styles.set(uid, style);
      return () => {
        style && document.head.contains(style) && (document.head.removeChild(style), styles.delete(uid));
      };
    }, [uid, rules]);
  }
  function useStylesheet(theme, selector) {
    const tltheme = React4.useMemo(() => __spreadValues(__spreadValues({}, defaultTheme), theme), [theme]);
    useTheme("tl", tltheme, selector);
    useStyle("tl-canvas", tlcss);
  }
  function getAppContext(id3 = "noid") {
    contextMap2[id3] || (contextMap2[id3] = React5.createContext({}));
    return contextMap2[id3];
  }
  function useApp(id3 = "noid") {
    return React5.useContext(getAppContext(id3));
  }
  function useCanvasEvents() {
    const app = useApp(), {callbacks} = useRendererContext(), rDoubleClickTimer = React6.useRef(-1);
    return React6.useMemo(() => ({onPointerDown:e => {
      var _a3, _b, _c;
      if (!app.settings.penMode || "pen" === e.pointerType && e.isPrimary) {
        var {order = 0} = e;
        order || null == (_a3 = e.currentTarget) || _a3.setPointerCapture(e.pointerId);
        e.isPrimary && (null == (_b = callbacks.onPointerDown) || _b.call(callbacks, {type:"canvas", order}, e), _a3 = Date.now(), _b = _a3 - rDoubleClickTimer.current, 300 < _b ? rDoubleClickTimer.current = _a3 : 300 >= _b && (null == (_c = callbacks.onDoubleClick) || _c.call(callbacks, {type:"canvas", order}, e), rDoubleClickTimer.current = -1));
      }
    }, onPointerMove:e => {
      var _a3;
      if (!app.settings.penMode || "pen" === e.pointerType && e.isPrimary) {
        var {order = 0} = e;
        null == (_a3 = callbacks.onPointerMove) || _a3.call(callbacks, {type:"canvas", order}, e);
      }
    }, onPointerUp:e => {
      var _a3, _b;
      if (!app.settings.penMode || "pen" === e.pointerType && e.isPrimary) {
        var {order = 0} = e;
        order || null == (_a3 = e.currentTarget) || _a3.releasePointerCapture(e.pointerId);
        null == (_b = callbacks.onPointerUp) || _b.call(callbacks, {type:"canvas", order}, e);
      }
    }, onPointerEnter:e => {
      var _a3;
      if (!app.settings.penMode || "pen" === e.pointerType && e.isPrimary) {
        var {order = 0} = e;
        null == (_a3 = callbacks.onPointerEnter) || _a3.call(callbacks, {type:"canvas", order}, e);
      }
    }, onPointerLeave:e => {
      var _a3;
      if (!app.settings.penMode || "pen" === e.pointerType && e.isPrimary) {
        var {order = 0} = e;
        null == (_a3 = callbacks.onPointerLeave) || _a3.call(callbacks, {type:"canvas", order}, e);
      }
    }, onDrop:e => __async(this, null, function*() {
      e.preventDefault();
      "clientX" in e && app.drop(e.dataTransfer, [e.clientX, e.clientY]);
    }), onDragOver:e => {
      e.preventDefault();
    }, onTouchEnd:e => {
      let tool = app.selectedTool.id;
      "pencil" !== tool && "highlighter" !== tool || e.preventDefault();
    }}), [callbacks]);
  }
  function rubberband(distance, dimension, constant) {
    return 0 === dimension || Infinity === Math.abs(dimension) ? Math.pow(distance, 5 * constant) : distance * dimension * constant / (dimension + constant * distance);
  }
  function rubberbandIfOutOfBounds(position, min, max, constant = 0.15) {
    return 0 === constant ? Math.max(min, Math.min(position, max)) : position < min ? -rubberband(min - position, max - min, constant) + min : position > max ? +rubberband(position - max, max - min, constant) + max : position;
  }
  function computeRubberband(bounds, [Vx, Vy], [Rx, Ry]) {
    const [[X0, X1], [Y0, Y1]] = bounds;
    return [rubberbandIfOutOfBounds(Vx, X0, X1, Rx), rubberbandIfOutOfBounds(Vy, Y0, Y1, Ry)];
  }
  function _defineProperty(obj, key, value) {
    key in obj ? Object.defineProperty(obj, key, {value, enumerable:!0, configurable:!0, writable:!0}) : obj[key] = value;
    return obj;
  }
  function ownKeys3(object2, enumerableOnly) {
    var keys = Object.keys(object2);
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object2);
      enumerableOnly && (symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object2, sym).enumerable;
      }));
      keys.push.apply(keys, symbols);
    }
    return keys;
  }
  function _objectSpread2(target) {
    for (var i2 = 1; i2 < arguments.length; i2++) {
      var source = null != arguments[i2] ? arguments[i2] : {};
      i2 % 2 ? ownKeys3(Object(source), !0).forEach(function(key) {
        _defineProperty(target, key, source[key]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys3(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
    return target;
  }
  function capitalize(string) {
    return string ? string[0].toUpperCase() + string.slice(1) : "";
  }
  function hasCapture(capture = !1, actionKey) {
    return capture && !actionsWithoutCaptureSupported.includes(actionKey);
  }
  function toHandlerProp(device, action2 = "", capture = !1) {
    const deviceProps = EVENT_TYPE_MAP[device];
    action2 = deviceProps ? deviceProps[action2] || action2 : action2;
    return "on" + capitalize(device) + capitalize(action2) + (hasCapture(capture, action2) ? "Capture" : "");
  }
  function parseProp(prop) {
    prop = prop.substring(2).toLowerCase();
    const passive = !!~prop.indexOf("passive");
    passive && (prop = prop.replace("passive", ""));
    var captureKey = pointerCaptureEvents.includes(prop) ? "capturecapture" : "capture";
    (captureKey = !!~prop.indexOf(captureKey)) && (prop = prop.replace("capture", ""));
    return {device:prop, capture:captureKey, passive};
  }
  function toDomEventType(device, action2 = "") {
    const deviceProps = EVENT_TYPE_MAP[device];
    return device + (deviceProps ? deviceProps[action2] || action2 : action2);
  }
  function getPointerType(event) {
    return "touches" in event ? "touch" : "pointerType" in event ? event.pointerType : "mouse";
  }
  function getCurrentTargetTouchList(event) {
    return Array.from(event.touches).filter(e => {
      var _event$currentTarget, _event$currentTarget$;
      return e.target === event.currentTarget || (null === (_event$currentTarget = event.currentTarget) || void 0 === _event$currentTarget ? void 0 : null === (_event$currentTarget$ = _event$currentTarget.contains) || void 0 === _event$currentTarget$ ? void 0 : _event$currentTarget$.call(_event$currentTarget, e.target));
    });
  }
  function getValueEvent(event) {
    return "touches" in event ? ("touchend" === event.type || "touchcancel" === event.type ? event.changedTouches : event.targetTouches)[0] : event;
  }
  function distanceAngle(P1, P2) {
    const dx = P2.clientX - P1.clientX, dy = P2.clientY - P1.clientY;
    return {angle:-(180 * Math.atan2(dx, dy)) / Math.PI, distance:Math.hypot(dx, dy), origin:[(P2.clientX + P1.clientX) / 2, (P2.clientY + P1.clientY) / 2]};
  }
  function touchIds(event) {
    return getCurrentTargetTouchList(event).map(touch => touch.identifier);
  }
  function touchDistanceAngle(event, ids) {
    const [P1, P2] = Array.from(event.touches).filter(touch => ids.includes(touch.identifier));
    return distanceAngle(P1, P2);
  }
  function pointerId(event) {
    const valueEvent = getValueEvent(event);
    return "touches" in event ? valueEvent.identifier : valueEvent.pointerId;
  }
  function pointerValues(event) {
    event = getValueEvent(event);
    return [event.clientX, event.clientY];
  }
  function wheelValues(event) {
    let {deltaX, deltaY, deltaMode} = event;
    1 === deltaMode ? (deltaX *= 40, deltaY *= 40) : 2 === deltaMode && (deltaX *= 800, deltaY *= 800);
    return [deltaX, deltaY];
  }
  function call(v2, ...args) {
    return "function" === typeof v2 ? v2(...args) : v2;
  }
  function noop3() {
  }
  function chain(...fns) {
    return 0 === fns.length ? noop3 : 1 === fns.length ? fns[0] : function() {
      let result;
      for (const fn of fns) {
        result = fn.apply(this, arguments) || result;
      }
      return result;
    };
  }
  function selectAxis([dx, dy], threshold) {
    dx = Math.abs(dx);
    dy = Math.abs(dy);
    if (dx > dy && dx > threshold) {
      return "x";
    }
    if (dy > dx && dy > threshold) {
      return "y";
    }
  }
  function clampStateInternalMovementToBounds(state) {
    const [ox, oy] = state.overflow, [dx, dy] = state._delta, [dirx, diry] = state._direction;
    if (0 > ox && 0 < dx && 0 > dirx || 0 < ox && 0 > dx && 0 < dirx) {
      state._movement[0] = state._movementBound[0];
    }
    if (0 > oy && 0 < dy && 0 > diry || 0 < oy && 0 > dy && 0 < diry) {
      state._movement[1] = state._movementBound[1];
    }
  }
  function registerAction(action2) {
    EngineMap.set(action2.key, action2.engine);
    ConfigResolverMap.set(action2.key, action2.resolver);
  }
  function resolveWith(config = {}, resolvers) {
    const result = {};
    for (const [key, resolver] of Object.entries(resolvers)) {
      switch(typeof resolver) {
        case "function":
          result[key] = resolver.call(result, config[key], key, config);
          break;
        case "object":
          result[key] = resolveWith(config[key], resolver);
          break;
        case "boolean":
          resolver && (result[key] = config[key]);
      }
    }
    return result;
  }
  function parse2(newConfig, gestureKey, _config = {}) {
    const {target, eventOptions, window:window2, enabled, transform} = newConfig;
    var excluded = _excluded;
    if (null == newConfig) {
      newConfig = {};
    } else {
      if (null == newConfig) {
        var target$jscomp$0 = {};
      } else {
        target$jscomp$0 = {};
        var sourceKeys = Object.keys(newConfig), i2;
        for (i2 = 0; i2 < sourceKeys.length; i2++) {
          var key = sourceKeys[i2];
          0 <= excluded.indexOf(key) || (target$jscomp$0[key] = newConfig[key]);
        }
      }
      if (Object.getOwnPropertySymbols) {
        for (i2 = Object.getOwnPropertySymbols(newConfig), key = 0; key < i2.length; key++) {
          sourceKeys = i2[key], 0 <= excluded.indexOf(sourceKeys) || Object.prototype.propertyIsEnumerable.call(newConfig, sourceKeys) && (target$jscomp$0[sourceKeys] = newConfig[sourceKeys]);
        }
      }
      newConfig = target$jscomp$0;
    }
    _config.shared = resolveWith({target, eventOptions, window:window2, enabled, transform}, sharedConfigResolver);
    if (gestureKey) {
      var resolver = ConfigResolverMap.get(gestureKey);
      _config[gestureKey] = resolveWith(_objectSpread2({shared:_config.shared}, newConfig), resolver);
    } else {
      for (resolver in newConfig) {
        (gestureKey = ConfigResolverMap.get(resolver)) && (_config[resolver] = resolveWith(_objectSpread2({shared:_config.shared}, newConfig[resolver]), gestureKey));
      }
    }
    return _config;
  }
  function setupGesture(ctrl, gestureKey) {
    ctrl.gestures.add(gestureKey);
    ctrl.gestureEventStores[gestureKey] = new EventStore(ctrl, gestureKey);
    ctrl.gestureTimeoutStores[gestureKey] = new TimeoutStore();
  }
  function registerGesture(actions, handlers, handlerKey, key, internalHandlers, config) {
    if (actions.has(handlerKey) && EngineMap.has(key)) {
      var startKey = handlerKey + "Start", endKey = handlerKey + "End";
      internalHandlers[key] = state => {
        let memo6 = void 0;
        if (state.first && startKey in handlers) {
          handlers[startKey](state);
        }
        handlerKey in handlers && (memo6 = handlers[handlerKey](state));
        if (state.last && endKey in handlers) {
          handlers[endKey](state);
        }
        return memo6;
      };
      config[key] = config[key] || {};
    }
  }
  function useRecognizers(handlers, config = {}, gestureKey, nativeHandlers) {
    const ctrl = import_react2.default.useMemo(() => new Controller(handlers), []);
    ctrl.applyHandlers(handlers, nativeHandlers);
    ctrl.applyConfig(config, gestureKey);
    import_react2.default.useEffect(ctrl.effect.bind(ctrl));
    import_react2.default.useEffect(() => ctrl.clean.bind(ctrl), []);
    if (void 0 === config.target) {
      return ctrl.bind.bind(ctrl);
    }
  }
  function createUseGesture(actions) {
    actions.forEach(registerAction);
    return function(_handlers, _config) {
      _config = _config || {};
      const native = {}, handlers = {}, actions = new Set();
      for (let key in _handlers) {
        RE_NOT_NATIVE.test(key) ? (actions.add(RegExp.lastMatch), handlers[key] = _handlers[key]) : native[key] = _handlers[key];
      }
      const [handlers$jscomp$0, nativeHandlers, actions$jscomp$0] = [handlers, native, actions];
      _handlers = {};
      registerGesture(actions$jscomp$0, handlers$jscomp$0, "onDrag", "drag", _handlers, _config);
      registerGesture(actions$jscomp$0, handlers$jscomp$0, "onWheel", "wheel", _handlers, _config);
      registerGesture(actions$jscomp$0, handlers$jscomp$0, "onScroll", "scroll", _handlers, _config);
      registerGesture(actions$jscomp$0, handlers$jscomp$0, "onPinch", "pinch", _handlers, _config);
      registerGesture(actions$jscomp$0, handlers$jscomp$0, "onMove", "move", _handlers, _config);
      registerGesture(actions$jscomp$0, handlers$jscomp$0, "onHover", "hover", _handlers, _config);
      const {handlers:handlers$jscomp$1, nativeHandlers:nativeHandlers$jscomp$0, config} = {handlers:_handlers, config:_config, nativeHandlers};
      return useRecognizers(handlers$jscomp$1, config, void 0, nativeHandlers$jscomp$0);
    };
  }
  function useGesture(handlers, config) {
    return createUseGesture([dragAction, pinchAction, scrollAction, wheelAction, moveAction, hoverAction])(handlers, config || {});
  }
  function useGestureEvents(ref) {
    const {viewport, inputs, callbacks} = useRendererContext(), rOriginPoint = React8.useRef(void 0), rDelta = React8.useRef([0, 0]), rWheelTs = React8.useRef(0), events = React8.useMemo(() => ({onWheel:gesture => {
      var _a3;
      ({event:gesture} = gesture);
      gesture.preventDefault();
      const {deltaY, deltaX} = gesture;
      var deltaZ = 0;
      if (gesture.ctrlKey || gesture.metaKey) {
        deltaZ = Math.sign(gesture.deltaY);
        let dy = deltaY;
        10 < Math.abs(gesture.deltaY) && (dy = 10 * deltaZ);
        deltaZ = dy;
      }
      const [x2, y2, z2] = [deltaX, deltaY, deltaZ];
      "pinching" === inputs.state || rWheelTs.current >= gesture.timeStamp || (rWheelTs.current = gesture.timeStamp, (gesture.altKey || gesture.ctrlKey || gesture.metaKey) && 0 === gesture.buttons ? (deltaZ = viewport.bounds, gesture = null != (_a3 = inputs.currentScreenPoint) ? _a3 : [deltaZ.width / 2, deltaZ.height / 2], _a3 = viewport.camera.zoom, viewport.onZoom(gesture, _a3 - z2 / 100 * _a3)) : (_a3 = src_default.mul(gesture.shiftKey && !isDarwin() ? [y2, 0] : [x2, y2], 0.8), src_default.isEqual(_a3, 
      [0, 0]) || viewport.panCamera(_a3)));
    }, onPinchStart:({event, delta, offset, origin}) => {
      var _a3;
      const elm = ref.current;
      event instanceof WheelEvent || !(event.target === elm || null != elm && elm.contains(event.target)) || (null == (_a3 = callbacks.onPinchStart) || _a3.call(callbacks, {type:"canvas", order:0, delta:[...delta, offset[0]], offset, point:src_default.sub(origin, inputs.containerOffset)}, event), rOriginPoint.current = origin, rDelta.current = [0, 0]);
    }, onPinchEnd:({event, offset, origin}) => {
      var _a3;
      const elm = ref.current;
      event instanceof WheelEvent || !(event.target === elm || null != elm && elm.contains(event.target)) || "pinching" !== inputs.state || (null == (_a3 = callbacks.onPinchEnd) || _a3.call(callbacks, {type:"canvas", order:0, delta:[0, 0, offset[0]], offset, point:src_default.sub(origin, inputs.containerOffset)}, event), rDelta.current = [0, 0]);
    }, onPinch:({event, offset, origin}) => {
      var _a3, elm = ref.current;
      if (!(event instanceof WheelEvent) && (event.target === elm || null != elm && elm.contains(event.target))) {
        rOriginPoint.current || (rOriginPoint.current = origin);
        elm = src_default.sub(rOriginPoint.current, origin);
        var trueDelta = src_default.sub(elm, rDelta.current);
        null == (_a3 = callbacks.onPinch) || _a3.call(callbacks, {type:"canvas", order:0, delta:[...trueDelta, offset[0]], offset, point:src_default.sub(origin, inputs.containerOffset)}, event);
        rDelta.current = elm;
      }
    }}), [callbacks]);
    useGesture(events, {target:ref, eventOptions:{passive:!1}, pinch:{from:[viewport.camera.zoom, viewport.camera.zoom], scaleBounds:() => ({from:viewport.camera.zoom, max:TLViewport.maxZoom, min:TLViewport.minZoom})}});
  }
  function useCounterScaledPosition(ref, bounds, rotation, zIndex) {
    React9.useLayoutEffect(() => {
      ref.current.style.transform = `translate(
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
      void 0 !== zIndex && (elm.style.zIndex = zIndex.toString());
    }, [zIndex]);
  }
  function useSetup(app, props) {
    const {onPersist, onError, onMount, onCreateAssets, onCreateShapes, onDeleteAssets, onDeleteShapes, onDrop, onPaste, onCopy, onCanvasDBClick} = props;
    React10.useLayoutEffect(() => {
      const unsubs = [];
      if (app) {
        return window.tlapps = window.tlapps || {}, window.tlapps[app.uuid] = app, onMount && onMount(app, null), () => {
          unsubs.forEach(unsub => unsub());
          window.tlapps && delete window.tlapps[app.uuid];
        };
      }
    }, [app]);
    React10.useLayoutEffect(() => {
      const unsubs = [];
      onPersist && unsubs.push(app.subscribe("persist", onPersist));
      onError && unsubs.push(app.subscribe("error", onError));
      onCreateShapes && unsubs.push(app.subscribe("create-shapes", onCreateShapes));
      onCreateAssets && unsubs.push(app.subscribe("create-assets", onCreateAssets));
      onDeleteShapes && unsubs.push(app.subscribe("delete-shapes", onDeleteShapes));
      onDeleteAssets && unsubs.push(app.subscribe("delete-assets", onDeleteAssets));
      onDrop && unsubs.push(app.subscribe("drop", onDrop));
      onPaste && unsubs.push(app.subscribe("paste", onPaste));
      onCopy && unsubs.push(app.subscribe("copy", onCopy));
      onCanvasDBClick && unsubs.push(app.subscribe("canvas-dbclick", onCanvasDBClick));
      return () => unsubs.forEach(unsub => unsub());
    }, [app, onPersist, onError]);
  }
  function useAppSetup(props) {
    if ("app" in props) {
      return props.app;
    }
    const [app] = React11.useState(() => new TLReactApp(props.model, props.Shapes, props.Tools, props.readOnly));
    React11.useLayoutEffect(() => () => {
      app.dispose();
    }, [app]);
    return app;
  }
  function usePropControl(app, props) {
    React12.useEffect(() => {
      "model" in props && props.model && app.loadDocumentModel(props.model);
    }, [props.model]);
  }
  function usePreventNavigation(rCanvas) {
    const context = useRendererContext(), {viewport:{bounds}} = context;
    React13.useEffect(() => {
      const preventGestureNavigation = event => {
        event.preventDefault();
      }, preventNavigation = event => {
        if (0 !== event.touches.length) {
          var touchXPosition = event.touches[0].pageX, touchXRadius = event.touches[0].radiusX || 0;
          (10 > touchXPosition - touchXRadius || touchXPosition + touchXRadius > bounds.width - 10) && event.preventDefault();
        }
      }, elm = rCanvas.current;
      if (!elm) {
        return () => {
        };
      }
      elm.addEventListener("touchstart", preventGestureNavigation, {passive:!0});
      elm.addEventListener("gestureend", preventGestureNavigation, {passive:!0});
      elm.addEventListener("gesturechange", preventGestureNavigation, {passive:!0});
      elm.addEventListener("gesturestart", preventGestureNavigation, {passive:!0});
      elm.addEventListener("touchstart", preventNavigation, {passive:!0});
      return () => {
        elm && (elm.removeEventListener("touchstart", preventGestureNavigation), elm.removeEventListener("gestureend", preventGestureNavigation), elm.removeEventListener("gesturechange", preventGestureNavigation), elm.removeEventListener("gesturestart", preventGestureNavigation), elm.removeEventListener("touchstart", preventNavigation));
      };
    }, [rCanvas, bounds.width]);
  }
  function useHandleEvents(shape, id3) {
    const {inputs, callbacks} = useRendererContext();
    return React14.useMemo(() => ({onPointerDown:e => {
      var _a3, _b;
      const {order = 0} = e;
      order || null == (_a3 = e.currentTarget) || _a3.setPointerCapture(e.pointerId);
      _a3 = shape.props.handles[id3];
      null == (_b = callbacks.onPointerDown) || _b.call(callbacks, {type:"handle", shape, handle:_a3, id:id3, order}, e);
      e.order = order + 1;
    }, onPointerMove:e => {
      var _a3;
      const {order = 0} = e, handle = shape.props.handles[id3];
      null == (_a3 = callbacks.onPointerMove) || _a3.call(callbacks, {type:"handle", shape, handle, id:id3, order}, e);
      e.order = order + 1;
    }, onPointerUp:e => {
      var _a3, _b;
      const {order = 0} = e;
      order || null == (_a3 = e.currentTarget) || _a3.releasePointerCapture(e.pointerId);
      _a3 = shape.props.handles[id3];
      null == (_b = callbacks.onPointerUp) || _b.call(callbacks, {type:"handle", shape, handle:_a3, id:id3, order}, e);
      e.order = order + 1;
    }, onPointerEnter:e => {
      var _a3;
      const {order = 0} = e, handle = shape.props.handles[id3];
      null == (_a3 = callbacks.onPointerEnter) || _a3.call(callbacks, {type:"handle", shape, handle, id:id3, order}, e);
      e.order = order + 1;
    }, onPointerLeave:e => {
      var _a3;
      const {order = 0} = e, handle = shape.props.handles[id3];
      null == (_a3 = callbacks.onPointerLeave) || _a3.call(callbacks, {type:"handle", shape, handle, id:id3, order}, e);
      e.order = order + 1;
    }, onKeyUp:e => {
      var _a3;
      const handle = shape.props.handles[id3];
      null == (_a3 = callbacks.onKeyUp) || _a3.call(callbacks, {type:"handle", shape, handle, id:id3, order:-1}, e);
    }, onKeyDown:e => {
      var _a3;
      const handle = shape.props.handles[id3];
      null == (_a3 = callbacks.onKeyDown) || _a3.call(callbacks, {type:"handle", shape, handle, id:id3, order:-1}, e);
    }}), [shape.id, inputs, callbacks]);
  }
  function getCursorCss(svg, r2, f2 = !1) {
    return `url("data:image/svg+xml,<svg height='32' width='32' viewBox='0 0 35 35' xmlns='http://www.w3.org/2000/svg'><g fill='none' style='transform-origin:center center' transform='rotate(${r2})${f2 ? " scale(-1,-1) translate(0, -32)" : ""}'>` + svg.replaceAll('"', "'") + '\x3c/g\x3e\x3c/svg\x3e") 16 16, pointer';
  }
  function useCursor(ref, cursor, rotation = 0) {
    React15.useEffect(() => {
      const elm = ref.current;
      elm && (elm.style.cursor = CURSORS3[cursor](GeomUtils.radiansToDegrees(rotation)));
    }, [cursor, rotation]);
  }
  function useZoom(ref) {
    const {viewport} = useRendererContext(), app = useApp();
    React16.useLayoutEffect(() => autorun(() => {
      const debouncedZoom = debounce(() => {
        var _a3;
        null == (_a3 = ref.current) || _a3.style.setProperty("--tl-zoom", viewport.camera.zoom.toString());
      }, 200);
      "pinching" !== app.inputs.state && null != viewport.camera.zoom && debouncedZoom();
    }), []);
  }
  function useDebouncedValue(value, ms = 0) {
    const [debouncedValue, setDebouncedValue] = (0,import_react4.useState)(value);
    (0,import_react4.useEffect)(() => {
      let canceled = !1;
      const handler = setTimeout(() => {
        canceled || setDebouncedValue(value);
      }, ms);
      return () => {
        canceled = !0;
        clearTimeout(handler);
      };
    }, [value, ms]);
    return debouncedValue;
  }
  function useRestoreCamera() {
    const app = useApp();
    React18.useEffect(() => {
      reaction(() => __spreadValues({}, app.viewport.camera), () => {
        window.sessionStorage.setItem("logseq.tldraw.camera:" + app.currentPageId, JSON.stringify(app.viewport.camera));
      });
    }, [app.viewport.camera]);
    React18.useEffect(() => {
      var _a3;
      const camera = JSON.parse(null != (_a3 = window.sessionStorage.getItem("logseq.tldraw.camera:" + app.currentPageId)) ? _a3 : "null");
      camera ? app.viewport.update(camera) : app.selectedIds.size ? app.api.zoomToSelection() : app.api.zoomToFit();
    }, [app]);
  }
  function defaultNoopBatch(callback) {
    callback();
  }
  function printDebugValue(v2) {
    return nodeToDependencyTree(getAtom(v2, void 0));
  }
  function createTrackingData(reaction2) {
    return {reaction:reaction2, mounted:!1, changedBeforeMount:!1, cleanAt:Date.now() + CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS};
  }
  function createReactionCleanupTrackingUsingFinalizationRegister(FinalizationRegistry2) {
    var cleanupTokenToReactionTrackingMap = new Map(), globalCleanupTokensCounter = 1, registry = new FinalizationRegistry2(function(token) {
      var trackedReaction = cleanupTokenToReactionTrackingMap.get(token);
      trackedReaction && (trackedReaction.reaction.dispose(), cleanupTokenToReactionTrackingMap.delete(token));
    });
    return {addReactionToTrack:function(reactionTrackingRef, reaction2, objectRetainedByReact) {
      var token = globalCleanupTokensCounter++;
      registry.register(objectRetainedByReact, token, reactionTrackingRef);
      reactionTrackingRef.current = createTrackingData(reaction2);
      reactionTrackingRef.current.finalizationRegistryCleanupToken = token;
      cleanupTokenToReactionTrackingMap.set(token, reactionTrackingRef.current);
      return reactionTrackingRef.current;
    }, recordReactionAsCommitted:function(reactionRef) {
      registry.unregister(reactionRef);
      reactionRef.current && reactionRef.current.finalizationRegistryCleanupToken && cleanupTokenToReactionTrackingMap.delete(reactionRef.current.finalizationRegistryCleanupToken);
    }, forceCleanupTimerToRunNowForTests:function() {
    }, resetCleanupScheduleForTests:function() {
    }};
  }
  function createTimerBasedReactionCleanupTracking() {
    function ensureCleanupTimerRunning() {
      void 0 === reactionCleanupHandle && (reactionCleanupHandle = setTimeout(cleanUncommittedReactions, 1e4));
    }
    function cleanUncommittedReactions() {
      reactionCleanupHandle = void 0;
      var now = Date.now();
      uncommittedReactionRefs.forEach(function(ref) {
        var tracking = ref.current;
        tracking && now >= tracking.cleanAt && (tracking.reaction.dispose(), ref.current = null, uncommittedReactionRefs.delete(ref));
      });
      0 < uncommittedReactionRefs.size && ensureCleanupTimerRunning();
    }
    var uncommittedReactionRefs = new Set(), reactionCleanupHandle;
    return {addReactionToTrack:function(reactionTrackingRef, reaction2, objectRetainedByReact) {
      reactionTrackingRef.current = createTrackingData(reaction2);
      uncommittedReactionRefs.add(reactionTrackingRef);
      ensureCleanupTimerRunning();
      return reactionTrackingRef.current;
    }, recordReactionAsCommitted:function(reactionRef) {
      uncommittedReactionRefs.delete(reactionRef);
    }, forceCleanupTimerToRunNowForTests:function() {
      reactionCleanupHandle && (clearTimeout(reactionCleanupHandle), cleanUncommittedReactions());
    }, resetCleanupScheduleForTests:function() {
      var _a3;
      if (0 < uncommittedReactionRefs.size) {
        try {
          for (var uncommittedReactionRefs_1 = __values(uncommittedReactionRefs), uncommittedReactionRefs_1_1 = uncommittedReactionRefs_1.next(); !uncommittedReactionRefs_1_1.done; uncommittedReactionRefs_1_1 = uncommittedReactionRefs_1.next()) {
            var ref = uncommittedReactionRefs_1_1.value, tracking = ref.current;
            tracking && (tracking.reaction.dispose(), ref.current = null);
          }
        } catch (e_1_1) {
          var e_1 = {error:e_1_1};
        } finally {
          try {
            uncommittedReactionRefs_1_1 && !uncommittedReactionRefs_1_1.done && (_a3 = uncommittedReactionRefs_1.return) && _a3.call(uncommittedReactionRefs_1);
          } finally {
            if (e_1) {
              throw e_1.error;
            }
          }
        }
        uncommittedReactionRefs.clear();
      }
      reactionCleanupHandle && (clearTimeout(reactionCleanupHandle), reactionCleanupHandle = void 0);
    }};
  }
  function objectToBeRetainedByReactFactory() {
    return new ObjectToBeRetainedByReact();
  }
  function useObserver(fn, baseComponentName) {
    void 0 === baseComponentName && (baseComponentName = "observed");
    var objectRetainedByReact = __read(import_react6.default.useState(objectToBeRetainedByReactFactory), 1)[0], setState = __read(import_react6.default.useState(), 2)[1], reactionTrackingRef = import_react6.default.useRef(null);
    if (!reactionTrackingRef.current) {
      var newReaction = new Reaction("observer".concat(baseComponentName), function() {
        trackingData_1.mounted ? setState([]) : trackingData_1.changedBeforeMount = !0;
      }), trackingData_1 = addReactionToTrack(reactionTrackingRef, newReaction, objectRetainedByReact);
    }
    objectRetainedByReact = reactionTrackingRef.current.reaction;
    import_react6.default.useDebugValue(objectRetainedByReact, printDebugValue);
    import_react6.default.useEffect(function() {
      recordReactionAsCommitted(reactionTrackingRef);
      reactionTrackingRef.current ? (reactionTrackingRef.current.mounted = !0, reactionTrackingRef.current.changedBeforeMount && (reactionTrackingRef.current.changedBeforeMount = !1, setState([]))) : (reactionTrackingRef.current = {reaction:new Reaction("observer".concat(baseComponentName), function() {
        setState([]);
      }), mounted:!0, changedBeforeMount:!1, cleanAt:Infinity}, setState([]));
      return function() {
        reactionTrackingRef.current.reaction.dispose();
        reactionTrackingRef.current = null;
      };
    }, []);
    var rendering, exception;
    objectRetainedByReact.track(function() {
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
  function observer(baseComponent, options) {
    var _a3;
    if (ReactMemoSymbol && baseComponent.$$typeof === ReactMemoSymbol) {
      throw Error("[mobx-react-lite] You are trying to use `observer` on a function component wrapped in either another `observer` or `React.memo`. The observer already applies 'React.memo' for you.");
    }
    options = null !== (_a3 = null === options || void 0 === options ? void 0 : options.forwardRef) && void 0 !== _a3 ? _a3 : !1;
    var render = baseComponent, baseComponentName = baseComponent.displayName || baseComponent.name;
    if (ReactForwardRefSymbol && baseComponent.$$typeof === ReactForwardRefSymbol && (options = !0, render = baseComponent.render, "function" !== typeof render)) {
      throw Error("[mobx-react-lite] `render` property of ForwardRef was not a function");
    }
    _a3 = function(props, ref) {
      return useObserver(function() {
        return render(props, ref);
      }, baseComponentName);
    };
    "" !== baseComponentName && (_a3.displayName = baseComponentName);
    baseComponent.contextTypes && (_a3.contextTypes = baseComponent.contextTypes);
    options && (_a3 = (0,import_react7.forwardRef)(_a3));
    _a3 = (0,import_react7.memo)(_a3);
    copyStaticProperties(baseComponent, _a3);
    return _a3;
  }
  function copyStaticProperties(base, target) {
    Object.keys(base).forEach(function(key) {
      hoistBlackList[key] || Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(base, key));
    });
  }
  function ObserverComponent(_a3) {
    var render = _a3.render;
    _a3 = _a3.children || render;
    return "function" !== typeof _a3 ? null : useObserver(_a3);
  }
  function useKeyboardEvents(ref) {
    const app = useApp(), {callbacks} = useRendererContext(), shiftKeyDownRef = React22.useRef(!1);
    React22.useEffect(() => {
      const onKeyDown = e => {
        var _a3, _b;
        if (null == (_a3 = ref.current) ? 0 : _a3.contains(document.activeElement)) {
          null == (_b = callbacks.onKeyDown) || _b.call(callbacks, {type:"canvas", order:-1}, e), shiftKeyDownRef.current = e.shiftKey;
        }
      }, onKeyUp = e => {
        var _a3, _b;
        if (null == (_a3 = ref.current) ? 0 : _a3.contains(document.activeElement)) {
          null == (_b = callbacks.onKeyUp) || _b.call(callbacks, {type:"canvas", order:-1}, e), shiftKeyDownRef.current = e.shiftKey;
        }
      }, onPaste = e => {
        var _a3, _b, _c;
        !app.editingShape && (null == (_a3 = ref.current) ? 0 : _a3.contains(document.activeElement)) && !["INPUT", "TEXTAREA"].includes(null != (_c = null == (_b = document.activeElement) ? void 0 : _b.tagName) ? _c : "") && (e.preventDefault(), app.paste(e, shiftKeyDownRef.current));
      }, onCopy = e => {
        var _a3, _b, _c;
        !app.editingShape && 0 < app.selectedShapes.size && (null == (_a3 = ref.current) ? 0 : _a3.contains(document.activeElement)) && !["INPUT", "TEXTAREA"].includes(null != (_c = null == (_b = document.activeElement) ? void 0 : _b.tagName) ? _c : "") && (e.preventDefault(), app.copy());
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
  function useShapeEvents(shape) {
    const app = useApp(), {inputs, callbacks} = useRendererContext(), rDoubleClickTimer = React26.useRef(-1);
    return React26.useMemo(() => ({onPointerDown:e => {
      var _a3, _b;
      if (!app.settings.penMode || "pen" === e.pointerType && e.isPrimary) {
        var {order = 0} = e;
        order || null == (_a3 = e.currentTarget) || _a3.setPointerCapture(e.pointerId);
        null == (_b = callbacks.onPointerDown) || _b.call(callbacks, {type:"shape", shape, order}, e);
        e.order = order + 1;
      }
    }, onPointerMove:e => {
      var _a3;
      if (!app.settings.penMode || "pen" === e.pointerType && e.isPrimary) {
        var {order = 0} = e;
        null == (_a3 = callbacks.onPointerMove) || _a3.call(callbacks, {type:"shape", shape, order}, e);
        e.order = order + 1;
      }
    }, onPointerUp:e => {
      var _a3, _b, _c;
      if (!app.settings.penMode || "pen" === e.pointerType && e.isPrimary) {
        var {order = 0} = e;
        order || null == (_a3 = e.currentTarget) || _a3.releasePointerCapture(e.pointerId);
        null == (_b = callbacks.onPointerUp) || _b.call(callbacks, {type:"shape", shape, order}, e);
        _a3 = Date.now();
        _b = _a3 - rDoubleClickTimer.current;
        300 < _b ? rDoubleClickTimer.current = _a3 : 300 >= _b && (null == (_c = callbacks.onDoubleClick) || _c.call(callbacks, {type:"shape", shape, order}, e), rDoubleClickTimer.current = -1);
        e.order = order + 1;
      }
    }, onPointerEnter:e => {
      var _a3;
      if (!app.settings.penMode || "pen" === e.pointerType && e.isPrimary) {
        var {order = 0} = e;
        null == (_a3 = callbacks.onPointerEnter) || _a3.call(callbacks, {type:"shape", shape, order}, e);
        e.order = order + 1;
      }
    }, onPointerLeave:e => {
      var _a3;
      if (!app.settings.penMode || "pen" === e.pointerType && e.isPrimary) {
        var {order = 0} = e;
        null == (_a3 = callbacks.onPointerLeave) || _a3.call(callbacks, {type:"shape", shape, order}, e);
        e.order = order + 1;
      }
    }, onKeyUp:e => {
      var _a3;
      null == (_a3 = callbacks.onKeyUp) || _a3.call(callbacks, {type:"shape", shape, order:-1}, e);
    }, onKeyDown:e => {
      var _a3;
      null == (_a3 = callbacks.onKeyDown) || _a3.call(callbacks, {type:"shape", shape, order:-1}, e);
    }}), [shape.id, inputs, callbacks]);
  }
  function Renderer2(_a3) {
    var {viewport, inputs, callbacks, components} = _a3;
    _a3 = __objRest(_a3, ["viewport", "inputs", "callbacks", "components"]);
    return (0,import_jsx_runtime29.jsx)(RendererContext, {id:_a3.id, viewport, inputs, callbacks, components, meta:_a3.meta, children:(0,import_jsx_runtime29.jsx)(Canvas, __spreadValues({}, _a3))});
  }
  function Tooltip(_a3) {
    var {side, content, sideOffset = 10} = _a3;
    _a3 = __objRest(_a3, ["side", "content", "sideOffset"]);
    return content ? (0,import_jsx_runtime33.jsx)(LSUI.TooltipProvider, {delayDuration:300, children:(0,import_jsx_runtime33.jsxs)(LSUI.Tooltip, {children:[(0,import_jsx_runtime33.jsx)(LSUI.TooltipTrigger, {asChild:!0, children:_a3.children}), (0,import_jsx_runtime33.jsxs)(LSUI.TooltipContent, __spreadProps(__spreadValues({sideOffset, side}, _a3), {children:[content, (0,import_jsx_runtime33.jsx)(LSUI.TooltipArrow, {className:"popper-arrow"})]}))]})}) : (0,import_jsx_runtime33.jsx)(import_jsx_runtime33.Fragment, 
    {children:_a3.children});
  }
  function Button(_a3) {
    var {className, tooltip, tooltipSide} = _a3;
    _a3 = __objRest(_a3, ["className", "tooltip", "tooltipSide"]);
    return (0,import_jsx_runtime34.jsx)(Tooltip, {content:tooltip, side:tooltipSide, children:(0,import_jsx_runtime34.jsx)("button", __spreadValues({className:"tl-button " + (null != className ? className : "")}, _a3))});
  }
  function ToggleInput(_a3) {
    var {toggle = !0, pressed, onPressedChange, className, tooltip} = _a3;
    _a3 = __objRest(_a3, ["toggle", "pressed", "onPressedChange", "className", "tooltip"]);
    return (0,import_jsx_runtime36.jsx)(Tooltip, {content:tooltip, children:(0,import_jsx_runtime36.jsx)("div", {className:"inline-flex", children:(0,import_jsx_runtime36.jsx)(LSUI2.Toggle, __spreadProps(__spreadValues({}, _a3), {"data-toggle":toggle, className:"tl-button" + (className ? " " + className : ""), pressed, onPressedChange}))})});
  }
  function PopoverButton(_a3) {
    var {side, align, alignOffset, label, children, border} = _a3;
    _a3 = __objRest(_a3, "side align alignOffset label children border".split(" "));
    return (0,import_jsx_runtime43.jsxs)(LSUI6.Popover, {children:[(0,import_jsx_runtime43.jsx)(LSUI6.PopoverTrigger, __spreadProps(__spreadValues({}, _a3), {"data-border":border, className:"tl-button tl-popover-trigger-button", children:label})), (0,import_jsx_runtime43.jsxs)(LSUI6.PopoverContent, {className:"w-auto p-1", align, alignOffset, side, sideOffset:15, collisionBoundary:document.querySelector(".logseq-tldraw"), children:[children, (0,import_jsx_runtime43.jsx)(LSUI6.PopoverArrow, {className:"popper-arrow"})]})]});
  }
  function ColorInput(_a3) {
    function renderColor(color2) {
      return color2 ? (0,import_jsx_runtime44.jsx)("div", {className:"tl-color-bg", style:{backgroundColor:color2}, children:(0,import_jsx_runtime44.jsx)("div", {className:`w-full h-full bg-${color2}-500`})}) : (0,import_jsx_runtime44.jsx)("div", {className:"tl-color-bg", children:(0,import_jsx_runtime44.jsx)(TablerIcon, {name:"color-swatch"})});
    }
    var {color, opacity, popoverSide, setColor, setOpacity} = _a3;
    _a3 = __objRest(_a3, ["color", "opacity", "popoverSide", "setColor", "setOpacity"]);
    const {handlers:{t}} = import_react19.default.useContext(LogseqContext), handleChangeDebounced = import_react19.default.useMemo(() => {
      let latestValue = "";
      return debounce(e => {
        setColor(latestValue);
      }, 100, e => {
        latestValue = e.target.value;
      });
    }, []);
    return (0,import_jsx_runtime44.jsx)(PopoverButton, __spreadProps(__spreadValues({}, _a3), {border:!0, side:popoverSide, label:(0,import_jsx_runtime44.jsx)(Tooltip, {content:t("whiteboard/color"), side:popoverSide, sideOffset:14, children:renderColor(color)}), children:(0,import_jsx_runtime44.jsxs)("div", {className:"p-1", children:[(0,import_jsx_runtime44.jsx)("div", {className:"tl-color-palette", children:Object.values(Color).map(value => (0,import_jsx_runtime44.jsx)("button", {className:`tl-color-drip m-1${value === 
    color ? " active" : ""}`, onClick:() => setColor(value), children:renderColor(value)}, value))}), (0,import_jsx_runtime44.jsxs)("div", {className:"flex items-center tl-custom-color", children:[(0,import_jsx_runtime44.jsx)("div", {className:`tl-color-drip m-1 mr-3 ${isBuiltInColor(color) ? "" : "active"}`, children:(0,import_jsx_runtime44.jsx)("div", {className:"color-input-wrapper tl-color-bg", children:(0,import_jsx_runtime44.jsx)("input", __spreadValues({className:"color-input cursor-pointer", 
    id:"tl-custom-color-input", type:"color", value:/^#(?:[0-9a-f]{3}){1,2}$/i.test(color) ? color : "#000000", onChange:handleChangeDebounced, style:{opacity:isBuiltInColor(color) ? 0 : 1}}, _a3))})}), (0,import_jsx_runtime44.jsx)("label", {htmlFor:"tl-custom-color-input", className:"text-xs cursor-pointer", children:t("whiteboard/select-custom-color")})]}), setOpacity && (0,import_jsx_runtime44.jsx)("div", {className:"mx-1 my-2", children:(0,import_jsx_runtime44.jsxs)(LSUI7.Slider, {defaultValue:[null != 
    opacity ? opacity : 0], onValueCommit:value => setOpacity(value[0]), max:1, step:0.1, "aria-label":t("whiteboard/opacity"), className:"tl-slider-root", children:[(0,import_jsx_runtime44.jsx)(LSUI7.SliderTrack, {className:"tl-slider-track", children:(0,import_jsx_runtime44.jsx)(LSUI7.SliderRange, {className:"tl-slider-range"})}), (0,import_jsx_runtime44.jsx)(LSUI7.SliderThumb, {className:"tl-slider-thumb"})]})})]})}));
  }
  function SelectInput(_a3) {
    var {options, tooltip, popoverSide, compact = !1, value, onValueChange} = _a3;
    _a3 = __objRest(_a3, "options tooltip popoverSide compact value onValueChange".split(" "));
    const [isOpen, setIsOpen] = React40.useState(!1);
    return (0,import_jsx_runtime45.jsx)("div", __spreadProps(__spreadValues({}, _a3), {children:(0,import_jsx_runtime45.jsxs)(LSUI8.Select, {open:isOpen, onOpenChange:setIsOpen, value, onValueChange, children:[(0,import_jsx_runtime45.jsx)(Tooltip, {content:tooltip, side:popoverSide, children:(0,import_jsx_runtime45.jsxs)(LSUI8.SelectTrigger, {className:`tl-select-trigger ${compact ? "compact" : ""}`, children:[(0,import_jsx_runtime45.jsx)(LSUI8.SelectValue, {}), !compact && (0,import_jsx_runtime45.jsx)(LSUI8.SelectIcon, 
    {asChild:!0, children:(0,import_jsx_runtime45.jsx)(ChevronDown, {className:"h-4 w-4 opacity-50"})})]})}), (0,import_jsx_runtime45.jsx)(LSUI8.SelectContent, {className:"min-w-min", side:popoverSide, position:"popper", sideOffset:14, align:"center", onKeyDown:e => e.stopPropagation(), children:options.map(option => (0,import_jsx_runtime45.jsx)(LSUI8.SelectItem, {value:option.value, children:option.label}, option.value))})]})}));
  }
  function ScaleInput(_a3) {
    var {scaleLevel, compact, popoverSide} = _a3;
    __objRest(_a3, ["scaleLevel", "compact", "popoverSide"]);
    const app = useApp();
    ({handlers:{t:_a3}} = import_react22.default.useContext(LogseqContext));
    const sizeOptions = [{label:compact ? "XS" : _a3("whiteboard/extra-small"), value:"xs"}, {label:compact ? "SM" : _a3("whiteboard/small"), value:"sm"}, {label:compact ? "MD" : _a3("whiteboard/medium"), value:"md"}, {label:compact ? "LG" : _a3("whiteboard/large"), value:"lg"}, {label:compact ? "XL" : _a3("whiteboard/extra-large"), value:"xl"}, {label:compact ? "XXL" : _a3("whiteboard/huge"), value:"xxl"}];
    return (0,import_jsx_runtime46.jsx)(SelectInput, {tooltip:_a3("whiteboard/scale-level"), options:sizeOptions, value:scaleLevel, popoverSide, compact, onValueChange:v2 => {
      app.api.setScaleLevel(v2);
    }});
  }
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
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
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
    for (var _len2 = arguments.length, procs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      procs[_key2] = arguments[_key2];
    }
    return function() {
      procs.map(call2);
    };
  }
  function noop4() {
  }
  function subscribe(emitter, subscription) {
    return emitter(1, subscription);
  }
  function publish(publisher, value) {
    publisher(0, value);
  }
  function reset(emitter) {
    emitter(2);
  }
  function getValue(depot) {
    return depot(4);
  }
  function connect(emitter, publisher) {
    return subscribe(emitter, curry2to1(publisher, 0));
  }
  function handleNext(emitter, subscription) {
    var unsub = emitter(1, function(value) {
      unsub();
      subscription(value);
    });
    return unsub;
  }
  function stream() {
    var subscriptions = [];
    return function(action2, arg) {
      switch(action2) {
        case 2:
          subscriptions.splice(0, subscriptions.length);
          break;
        case 1:
          return subscriptions.push(arg), function() {
            var indexOf = subscriptions.indexOf(arg);
            -1 < indexOf && subscriptions.splice(indexOf, 1);
          };
        case 0:
          subscriptions.slice().forEach(function(subscription) {
            subscription(arg);
          });
          break;
        default:
          throw Error("unrecognized action " + action2);
      }
    };
  }
  function statefulStream(initial) {
    var value = initial, innerSubject = stream();
    return function(action2, arg) {
      switch(action2) {
        case 1:
          arg(value);
          break;
        case 0:
          value = arg;
          break;
        case 4:
          return value;
      }
      return innerSubject(action2, arg);
    };
  }
  function eventHandler(emitter) {
    var unsub, currentSubscription;
    return function(action2, subscription) {
      switch(action2) {
        case 1:
          if (subscription) {
            if (currentSubscription === subscription) {
              break;
            }
            unsub && unsub();
            currentSubscription = subscription;
            return unsub = emitter(1, subscription);
          }
          unsub && unsub();
          return noop4;
        case 2:
          unsub && unsub();
          currentSubscription = null;
          break;
        default:
          throw Error("unrecognized action " + action2);
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
    for (var _len = arguments.length, operators = Array(_len), _key = 0; _key < _len; _key++) {
      operators[_key] = arguments[_key];
    }
    return function(subscriber) {
      return operators.reduceRight(thrush, subscriber);
    };
  }
  function pipe(source) {
    for (var _len2 = arguments.length, operators = Array(1 < _len2 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      operators[_key2 - 1] = arguments[_key2];
    }
    var project = combineOperators.apply(void 0, operators);
    return function(action2, subscription) {
      switch(action2) {
        case 1:
          return subscribe(source, project(subscription));
        case 2:
          source(2);
          break;
        default:
          throw Error("unrecognized action " + action2);
      }
    };
  }
  function defaultComparator(previous, next) {
    return previous === next;
  }
  function distinctUntilChanged(comparator) {
    void 0 === comparator && (comparator = defaultComparator);
    var current;
    return function(done) {
      return function(next) {
        comparator(current, next) || (current = next, done(next));
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
        0 < times ? times-- : done(value);
      };
    };
  }
  function throttleTime(interval) {
    var currentValue, timeout;
    return function(done) {
      return function(value) {
        currentValue = value;
        timeout ||= setTimeout(function() {
          timeout = void 0;
          done(currentValue);
        }, interval);
      };
    };
  }
  function debounceTime(interval) {
    var currentValue, timeout;
    return function(done) {
      return function(value) {
        currentValue = value;
        timeout && clearTimeout(timeout);
        timeout = setTimeout(function() {
          done(currentValue);
        }, interval);
      };
    };
  }
  function withLatestFrom() {
    for (var _len3 = arguments.length, sources = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      sources[_key3] = arguments[_key3];
    }
    var values = Array(sources.length), called = 0, pendingCall = null, allCalled = Math.pow(2, sources.length) - 1;
    sources.forEach(function(source, index2) {
      var bit = Math.pow(2, index2);
      subscribe(source, function(value) {
        var prevCalled = called;
        called |= bit;
        values[index2] = value;
        prevCalled !== allCalled && called === allCalled && pendingCall && (pendingCall(), pendingCall = null);
      });
    });
    return function(done) {
      return function(value) {
        var call3 = function() {
          return done([value].concat(values));
        };
        called === allCalled ? call3() : pendingCall = call3;
      };
    };
  }
  function merge() {
    for (var _len = arguments.length, sources = Array(_len), _key = 0; _key < _len; _key++) {
      sources[_key] = arguments[_key];
    }
    return function(action2, subscription) {
      switch(action2) {
        case 1:
          return joinProc.apply(void 0, sources.map(function(source) {
            return source(1, subscription);
          }));
        case 2:
          break;
        default:
          throw Error("unrecognized action " + action2);
      }
    };
  }
  function duc(source, comparator) {
    void 0 === comparator && (comparator = defaultComparator);
    return pipe(source, distinctUntilChanged(comparator));
  }
  function combineLatest() {
    for (var innerSubject = stream(), _len2 = arguments.length, emitters = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      emitters[_key2] = arguments[_key2];
    }
    var values = Array(emitters.length), called = 0, allCalled = Math.pow(2, emitters.length) - 1;
    emitters.forEach(function(source, index2) {
      var bit = Math.pow(2, index2);
      subscribe(source, function(value) {
        values[index2] = value;
        called |= bit;
        called === allCalled && innerSubject(0, values);
      });
    });
    return function(action2, subscription) {
      switch(action2) {
        case 1:
          return called === allCalled && subscription(values), innerSubject(1, subscription);
        case 2:
          innerSubject(2);
          break;
        default:
          throw Error("unrecognized action " + action2);
      }
    };
  }
  function system(constructor, dependencies, _temp) {
    void 0 === dependencies && (dependencies = []);
    _temp = (void 0 === _temp ? {singleton:!0} : _temp).singleton;
    return {id:Symbol(), constructor, dependencies, singleton:_temp};
  }
  function init(systemSpec) {
    var singletons = new Map();
    return function _init2(_ref2) {
      var id3 = _ref2.id, constructor = _ref2.constructor, dependencies = _ref2.dependencies;
      if ((_ref2 = _ref2.singleton) && singletons.has(id3)) {
        return singletons.get(id3);
      }
      constructor = constructor(dependencies.map(function(e) {
        return _init2(e);
      }));
      _ref2 && singletons.set(id3, constructor);
      return constructor;
    }(systemSpec);
  }
  function _objectWithoutPropertiesLoose2(source, excluded) {
    if (null == source) {
      return {};
    }
    var target = {}, sourceKeys = Object.keys(source), i2;
    for (i2 = 0; i2 < sourceKeys.length; i2++) {
      var key = sourceKeys[i2];
      0 <= excluded.indexOf(key) || (target[key] = source[key]);
    }
    return target;
  }
  function _unsupportedIterableToArray2(o2, minLen) {
    if (o2) {
      if ("string" === typeof o2) {
        return _arrayLikeToArray2(o2, minLen);
      }
      var n2 = Object.prototype.toString.call(o2).slice(8, -1);
      "Object" === n2 && o2.constructor && (n2 = o2.constructor.name);
      if ("Map" === n2 || "Set" === n2) {
        return Array.from(o2);
      }
      if ("Arguments" === n2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2)) {
        return _arrayLikeToArray2(o2, minLen);
      }
    }
  }
  function _arrayLikeToArray2(arr, len) {
    if (null == len || len > arr.length) {
      len = arr.length;
    }
    for (var i2 = 0, arr2 = Array(len); i2 < len; i2++) {
      arr2[i2] = arr[i2];
    }
    return arr2;
  }
  function _createForOfIteratorHelperLoose2(o2, allowArrayLike) {
    var it2 = "undefined" !== typeof Symbol && o2[Symbol.iterator] || o2["@@iterator"];
    if (it2) {
      return (it2 = it2.call(o2)).next.bind(it2);
    }
    if (Array.isArray(o2) || (it2 = _unsupportedIterableToArray2(o2)) || allowArrayLike && o2 && "number" === typeof o2.length) {
      it2 && (o2 = it2);
      var i2 = 0;
      return function() {
        return i2 >= o2.length ? {done:!0} : {done:!1, value:o2[i2++]};
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function omit(keys, obj) {
    for (var result = {}, index2 = {}, idx = 0, len = keys.length; idx < len;) {
      index2[keys[idx]] = 1, idx += 1;
    }
    for (var prop in obj) {
      index2.hasOwnProperty(prop) || (result[prop] = obj[prop]);
    }
    return result;
  }
  function systemToComponent(systemSpec, map3, Root) {
    function applyPropsToSystem(system2, props) {
      system2.propsReady && (0,system2.propsReady)(0, !1);
      for (var _iterator = _createForOfIteratorHelperLoose2(requiredPropNames), _step; !(_step = _iterator()).done;) {
        _step = _step.value, (0,system2[map3.required[_step]])(0, props[_step]);
      }
      for (_iterator = _createForOfIteratorHelperLoose2(optionalPropNames); !(_step = _iterator()).done;) {
        if (_step = _step.value, _step in props) {
          (0,system2[map3.optional[_step]])(0, props[_step]);
        }
      }
      system2.propsReady && (0,system2.propsReady)(0, !0);
    }
    function buildMethods(system2) {
      return methodNames.reduce(function(acc, methodName) {
        acc[methodName] = function(value) {
          (0,system2[map3.methods[methodName]])(0, value);
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
    var requiredPropNames = Object.keys(map3.required || {}), optionalPropNames = Object.keys(map3.optional || {}), methodNames = Object.keys(map3.methods || {}), eventNames = Object.keys(map3.events || {}), Context = (0,import_react27.createContext)({});
    return {Component:(0,import_react27.forwardRef)(function(propsWithChildren, ref) {
      var children = propsWithChildren.children, props = _objectWithoutPropertiesLoose2(propsWithChildren, _excluded2), system2 = (0,import_react27.useState)(function() {
        return tap(init(systemSpec), function(system3) {
          return applyPropsToSystem(system3, props);
        });
      })[0], handlers = (0,import_react27.useState)(curry1to0(buildEventHandlers, system2))[0];
      useIsomorphicLayoutEffect(function() {
        for (var _iterator3 = _createForOfIteratorHelperLoose2(eventNames), _step3; !(_step3 = _iterator3()).done;) {
          if (_step3 = _step3.value, _step3 in props) {
            (0,handlers[_step3])(1, props[_step3]);
          }
        }
        return function() {
          Object.values(handlers).map(reset);
        };
      }, [props, handlers, system2]);
      useIsomorphicLayoutEffect(function() {
        applyPropsToSystem(system2, props);
      });
      (0,import_react27.useImperativeHandle)(ref, always(buildMethods(system2)));
      return (0,import_react27.createElement)(Context.Provider, {value:system2}, Root ? (0,import_react27.createElement)(Root, omit([].concat(requiredPropNames, optionalPropNames, eventNames), props), children) : children);
    }), usePublisher:function(key) {
      return (0,import_react27.useCallback)(curry2to1(publish, (0,import_react27.useContext)(Context)[key]), [key]);
    }, useEmitterValue:function(key) {
      var source = (0,import_react27.useContext)(Context)[key];
      key = (0,import_react27.useState)(curry1to0(getValue, source));
      var value = key[0], setValue = key[1];
      useIsomorphicLayoutEffect(function() {
        return subscribe(source, function(next) {
          next !== value && setValue(always(next));
        });
      }, [source, value]);
      return value;
    }, useEmitter:function(key, callback) {
      var source = (0,import_react27.useContext)(Context)[key];
      useIsomorphicLayoutEffect(function() {
        return source(1, callback);
      }, [callback, source]);
    }};
  }
  function c() {
    return c = Object.assign || function(e) {
      for (var t = 1; t < arguments.length; t++) {
        var n2 = arguments[t], o2;
        for (o2 in n2) {
          Object.prototype.hasOwnProperty.call(n2, o2) && (e[o2] = n2[o2]);
        }
      }
      return e;
    }, c.apply(this, arguments);
  }
  function m(e, t) {
    if (null == e) {
      return {};
    }
    var n2, o2, r2 = {}, i2 = Object.keys(e);
    for (o2 = 0; o2 < i2.length; o2++) {
      0 <= t.indexOf(n2 = i2[o2]) || (r2[n2] = e[n2]);
    }
    return r2;
  }
  function d(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var n2 = 0, o2 = Array(t); n2 < t; n2++) {
      o2[n2] = e[n2];
    }
    return o2;
  }
  function f(e, t) {
    var n2 = "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
    if (n2) {
      return (n2 = n2.call(e)).next.bind(n2);
    }
    if (Array.isArray(e) || (n2 = function(e2, t2) {
      if (e2) {
        if ("string" == typeof e2) {
          return d(e2, t2);
        }
        var n3 = Object.prototype.toString.call(e2).slice(8, -1);
        return "Object" === n3 && e2.constructor && (n3 = e2.constructor.name), "Map" === n3 || "Set" === n3 ? Array.from(e2) : "Arguments" === n3 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n3) ? d(e2, t2) : void 0;
      }
    }(e)) || t && e && "number" == typeof e.length) {
      n2 && (e = n2);
      var o2 = 0;
      return function() {
        return o2 >= e.length ? {done:!0} : {done:!1, value:e[o2++]};
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function C(e, t) {
    void 0 === t && (t = !0);
    var n2 = (0,import_react28.useRef)(null), o2 = function(e2) {
    };
    if ("undefined" != typeof ResizeObserver) {
      var r2 = new ResizeObserver(function(t2) {
        t2 = t2[0].target;
        null !== t2.offsetParent && e(t2);
      });
      o2 = function(e2) {
        e2 && t ? (r2.observe(e2), n2.current = e2) : (n2.current && r2.unobserve(n2.current), n2.current = null);
      };
    }
    return {ref:n2, callbackRef:o2};
  }
  function I(e, t) {
    return void 0 === t && (t = !0), C(e, t).callbackRef;
  }
  function T(e, t, n2, o2, r2, i2, a3) {
    return C(function(n3) {
      for (var l3 = function(e2, t2, n4, o3) {
        n4 = e2.length;
        if (0 === n4) {
          return null;
        }
        for (var i3 = [], a4 = 0; a4 < n4; a4++) {
          var l4 = e2.item(a4);
          if (l4 && void 0 !== l4.dataset.index) {
            var s3 = parseInt(l4.dataset.index), u3 = parseFloat(l4.dataset.knownSize), c3 = t2(l4, "offsetHeight");
            if (0 === c3 && o3("Zero-sized element, this should not happen", {child:l4}, h.ERROR), c3 !== u3) {
              l4 = i3[i3.length - 1], 0 === i3.length || l4.size !== c3 || l4.endIndex !== s3 - 1 ? i3.push({startIndex:s3, endIndex:s3, size:c3}) : i3[i3.length - 1].endIndex++;
            }
          }
        }
        return i3;
      }(n3.children, t, 0, r2), s2 = n3.parentElement; !s2.dataset.virtuosoScroller;) {
        s2 = s2.parentElement;
      }
      var u2 = "window" === s2.firstElementChild.dataset.viewportType;
      o2({scrollTop:Math.max(a3 ? a3.scrollTop : u2 ? window.pageYOffset || document.documentElement.scrollTop : s2.scrollTop, 0), scrollHeight:a3 ? a3.scrollHeight : u2 ? document.documentElement.scrollHeight : s2.scrollHeight, viewportHeight:a3 ? a3.offsetHeight : u2 ? window.innerHeight : s2.offsetHeight});
      null == i2 || i2(function(e2, t2, n4) {
        return "normal" === t2 || null != t2 && t2.endsWith("px") || n4("row-gap was not resolved to pixel value correctly", t2, h.WARN), "normal" === t2 ? 0 : parseInt(null != t2 ? t2 : "0", 10);
      }(0, getComputedStyle(n3).rowGap, r2));
      null !== l3 && e(l3);
    }, n2);
  }
  function w(e, t) {
    return Math.round(e.getBoundingClientRect()[t]);
  }
  function b(e, n2, o2, l3, s2) {
    void 0 === l3 && (l3 = noop4);
    var c2 = (0,import_react28.useRef)(null), m2 = (0,import_react28.useRef)(null), d2 = (0,import_react28.useRef)(null), f2 = (0,import_react28.useRef)(!1), p2 = (0,import_react28.useCallback)(function(t) {
      t = t.target;
      var r2 = t === window || t === document, i2 = r2 ? window.pageYOffset || document.documentElement.scrollTop : t.scrollTop, a3 = r2 ? document.documentElement.scrollHeight : t.scrollHeight, l4 = r2 ? window.innerHeight : t.offsetHeight;
      t = function() {
        e({scrollTop:Math.max(i2, 0), scrollHeight:a3, viewportHeight:l4});
      };
      f2.current ? (0,import_react_dom3.flushSync)(t) : t();
      f2.current = !1;
      null !== m2.current && (i2 === m2.current || 0 >= i2 || i2 === a3 - l4) && (m2.current = null, n2(!0), d2.current && (clearTimeout(d2.current), d2.current = null));
    }, [e, n2]);
    return (0,import_react28.useEffect)(function() {
      var e2 = s2 || c2.current;
      return l3(s2 || c2.current), p2({target:e2}), e2.addEventListener("scroll", p2, {passive:!0}), function() {
        l3(null);
        e2.removeEventListener("scroll", p2);
      };
    }, [c2, p2, o2, l3, s2]), {scrollerRef:c2, scrollByCallback:function(e2) {
      f2.current = !0;
      c2.current.scrollBy(e2);
    }, scrollToCallback:function(t) {
      var o3 = c2.current;
      if (o3 && !("offsetHeight" in o3 && 0 === o3.offsetHeight)) {
        var r2, i2, a3, l4 = "smooth" === t.behavior;
        if (o3 === window ? (i2 = Math.max(w(document.documentElement, "height"), document.documentElement.scrollHeight), r2 = window.innerHeight, a3 = document.documentElement.scrollTop) : (i2 = o3.scrollHeight, r2 = w(o3, "height"), a3 = o3.scrollTop), t.top = Math.ceil(Math.max(Math.min(i2 - r2, t.top), 0)), 1.01 > Math.abs(r2 - i2) || t.top === a3) {
          return e({scrollTop:a3, scrollHeight:i2, viewportHeight:r2}), void(l4 && n2(!0));
        }
        l4 ? (m2.current = t.top, d2.current && clearTimeout(d2.current), d2.current = setTimeout(function() {
          d2.current = null;
          m2.current = null;
          n2(!0);
        }, 1e3)) : m2.current = null;
        o3.scrollTo(t);
      }
    }};
  }
  function E(e, t, n2, o2, r2) {
    return void 0 === o2 && (o2 = H), void 0 === r2 && (r2 = H), {k:e, v:t, lvl:n2, l:o2, r:r2};
  }
  function F(e, t) {
    if (e === H) {
      return H;
    }
    var n2 = e.k, o2 = e.l, r2 = e.r;
    if (t === n2) {
      if (o2 === H) {
        return r2;
      }
      if (r2 === H) {
        return o2;
      }
      t = O(o2);
      return U(W(e, {k:t[0], v:t[1], l:M(o2)}));
    }
    return U(W(e, t < n2 ? {l:F(o2, t)} : {r:F(r2, t)}));
  }
  function k(e, t, n2) {
    return (void 0 === n2 && (n2 = "k"), e === H) ? [-Infinity, void 0] : e[n2] === t ? [e.k, e.v] : e[n2] < t ? (t = k(e.r, t, n2), -Infinity === t[0] ? [e.k, e.v] : t) : k(e.l, t, n2);
  }
  function z(e, t, n2) {
    return e === H ? E(t, n2, 1) : t === e.k ? W(e, {k:t, v:n2}) : D(G(W(e, t < e.k ? {l:z(e.l, t, n2)} : {r:z(e.r, t, n2)})));
  }
  function B(e, t, n2) {
    if (e === H) {
      return [];
    }
    var o2 = e.k, r2 = e.v, i2 = e.r, a3 = [];
    return o2 > t && (a3 = a3.concat(B(e.l, t, n2))), o2 >= t && o2 <= n2 && a3.push({k:o2, v:r2}), o2 <= n2 && (a3 = a3.concat(B(i2, t, n2))), a3;
  }
  function P(e) {
    return e === H ? [] : [].concat(P(e.l), [{k:e.k, v:e.v}], P(e.r));
  }
  function O(e) {
    return e.r === H ? [e.k, e.v] : O(e.r);
  }
  function M(e) {
    return e.r === H ? e.l : U(W(e, {r:M(e.r)}));
  }
  function W(e, t) {
    return E(void 0 !== t.k ? t.k : e.k, void 0 !== t.v ? t.v : e.v, void 0 !== t.lvl ? t.lvl : e.lvl, void 0 !== t.l ? t.l : e.l, void 0 !== t.r ? t.r : e.r);
  }
  function V2(e) {
    return e === H || e.lvl > e.r.lvl;
  }
  function U(e) {
    var t = e.l, n2 = e.r, o2 = e.lvl;
    if (n2.lvl >= o2 - 1 && t.lvl >= o2 - 1) {
      return e;
    }
    if (o2 > n2.lvl + 1) {
      if (V2(t)) {
        return G(W(e, {lvl:o2 - 1}));
      }
      if (t === H || t.r === H) {
        throw Error("Unexpected empty nodes");
      }
      return W(t.r, {l:W(t, {r:t.r.l}), r:W(e, {l:t.r.r, lvl:o2 - 1}), lvl:o2});
    }
    if (V2(e)) {
      return D(W(e, {lvl:o2 - 1}));
    }
    if (n2 === H || n2.l === H) {
      throw Error("Unexpected empty nodes");
    }
    t = n2.l;
    var i2 = V2(t) ? n2.lvl - 1 : n2.lvl;
    return W(t, {l:W(e, {r:t.l, lvl:o2 - 1}), r:D(W(n2, {l:t.r, lvl:i2})), lvl:t.lvl + 1});
  }
  function A(e, t, n2) {
    return e === H ? [] : N(B(e, k(e, t)[0], n2), function(e2) {
      return {index:e2.k, value:e2.v};
    });
  }
  function N(e, t) {
    var n2 = e.length;
    if (0 === n2) {
      return [];
    }
    var o2 = t(e[0]), r2 = o2.index;
    o2 = o2.value;
    for (var a3 = [], l3 = 1; l3 < n2; l3++) {
      var s2 = t(e[l3]), u2 = s2.index;
      s2 = s2.value;
      a3.push({start:r2, end:u2 - 1, value:o2});
      r2 = u2;
      o2 = s2;
    }
    return a3.push({start:r2, end:Infinity, value:o2}), a3;
  }
  function D(e) {
    var t = e.r, n2 = e.lvl;
    return t === H || t.r === H || t.lvl !== n2 || t.r.lvl !== n2 ? e : W(t, {l:W(e, {r:t.l}), lvl:n2 + 1});
  }
  function G(e) {
    var t = e.l;
    return t === H || t.lvl !== e.lvl ? e : W(t, {r:W(e, {l:t.r})});
  }
  function _(e, t, n2, o2) {
    void 0 === o2 && (o2 = 0);
    for (var r2 = e.length - 1; o2 <= r2;) {
      var i2 = Math.floor((o2 + r2) / 2), a3 = n2(e[i2], t);
      if (0 === a3) {
        return i2;
      }
      if (-1 === a3) {
        if (2 > r2 - o2) {
          return i2 - 1;
        }
        r2 = i2 - 1;
      } else {
        if (r2 === o2) {
          return i2;
        }
        o2 = i2 + 1;
      }
    }
    throw Error("Failed binary finding record in array - " + e.join(",") + ", searched for " + t);
  }
  function Y(e) {
    var t = e.size, n2 = e.startIndex, o2 = e.endIndex;
    return function(e2) {
      return e2.start === n2 && (e2.end === o2 || Infinity === e2.end) && e2.value === t;
    };
  }
  function q(e, t) {
    e = e.index;
    return t === e ? 0 : t < e ? -1 : 1;
  }
  function Z(e, t) {
    e = e.offset;
    return t === e ? 0 : t < e ? -1 : 1;
  }
  function J(e) {
    return {index:e.index, value:e};
  }
  function $(e, t, n2, o2) {
    var i2 = 0, a3 = 0, l3 = 0, s2;
    0 !== t ? (l3 = e[s2 = _(e, t - 1, q)].offset, a3 = k(n2, t - 1), i2 = a3[0], a3 = a3[1], e.length && e[s2].size === k(n2, t)[1] && --s2, e = e.slice(0, s2 + 1)) : e = [];
    for (t = f(A(n2, t, Infinity)); !(n2 = t()).done;) {
      s2 = n2.value, n2 = s2.start, s2 = s2.value, i2 = n2 - i2, l3 = i2 * a3 + l3 + i2 * o2, e.push({offset:l3, size:s2, index:n2}), i2 = n2, a3 = s2;
    }
    return {offsetTree:e, lastIndex:i2, lastOffset:l3, lastSize:a3};
  }
  function Q(e, t) {
    var n2 = t[0], o2 = t[1], r2 = t[3];
    0 < n2.length && (0,t[2])("received item sizes", n2, h.DEBUG);
    var i2 = e.sizeTree;
    t = i2;
    var l3 = 0;
    if (0 < o2.length && i2 === H && 2 === n2.length) {
      var s2 = n2[0].size, u2 = n2[1].size;
      t = o2.reduce(function(e2, t2) {
        return z(z(e2, t2, s2), t2 + 1, u2);
      }, t);
    } else {
      n2 = function(e2, t2) {
        var n3, o3 = e2 === H ? 0 : Infinity;
        for (t2 = f(t2); !(n3 = t2()).done;) {
          var i3 = n3.value;
          n3 = i3.size;
          var l4 = i3.startIndex, s3 = i3.endIndex;
          if (o3 = Math.min(o3, l4), e2 === H) {
            e2 = z(e2, 0, n3);
          } else {
            var u3 = A(e2, l4 - 1, s3 + 1);
            if (!u3.some(Y(i3))) {
              var c3, d3 = i3 = !1;
              for (u3 = f(u3); !(c3 = u3()).done;) {
                var h2 = c3.value;
                c3 = h2.start;
                var v2 = h2.end;
                h2 = h2.value;
                i3 ? (s3 >= c3 || n3 === h2) && (e2 = F(e2, c3)) : (d3 = h2 !== n3, i3 = !0);
                v2 > s3 && s3 >= c3 && h2 !== n3 && (e2 = z(e2, s3 + 1, h2));
              }
              d3 && (e2 = z(e2, l4, n3));
            }
          }
        }
        return [e2, o3];
      }(t, n2), t = n2[0], l3 = n2[1];
    }
    if (t === i2) {
      return e;
    }
    e = $(e.offsetTree, l3, t, r2);
    var d2 = e.offsetTree;
    return {sizeTree:t, offsetTree:d2, lastIndex:e.lastIndex, lastOffset:e.lastOffset, lastSize:e.lastSize, groupOffsetTree:o2.reduce(function(e2, t2) {
      return z(e2, t2, X(t2, d2, r2));
    }, H), groupIndices:o2};
  }
  function X(e, t, n2) {
    if (0 === t.length) {
      return 0;
    }
    t = t[_(t, e, q)];
    e -= t.index;
    e = t.size * e + (e - 1) * n2 + t.offset;
    return 0 < e ? e + n2 : e;
  }
  function ee(e, t, n2) {
    if (void 0 !== e.groupIndex) {
      return t.groupIndices[e.groupIndex] + 1;
    }
    e = te("LAST" === e.index ? n2 : e.index, t);
    return Math.max(0, e, Math.min(n2, e));
  }
  function te(e, t) {
    if (t.groupOffsetTree === H) {
      return e;
    }
    for (var n2 = 0; t.groupIndices[n2] <= e + n2;) {
      n2++;
    }
    return e + n2;
  }
  function ae(e) {
    e = "number" == typeof e ? {index:e} : e;
    return e.align || (e.align = "start"), e.behavior && ie || (e.behavior = "auto"), e.offset || (e.offset = 0), e;
  }
  function fe(e) {
    return !!e && ("smooth" === e ? "smooth" : "auto");
  }
  function he(e) {
    return e.reduce(function(e2, t) {
      return e2.groupIndices.push(e2.totalCount), e2.totalCount += t + 1, e2;
    }, {totalCount:0, groupIndices:[]});
  }
  function ve(e, t) {
    return !(!e || e[0] !== t[0] || e[1] !== t[1]);
  }
  function Se(e, t) {
    return !(!e || e.startIndex !== t.startIndex || e.endIndex !== t.endIndex);
  }
  function Ce(e, t, n2) {
    return "number" == typeof e ? "up" === n2 && "top" === t || "down" === n2 && "bottom" === t ? e : 0 : "up" === n2 ? "top" === t ? e.main : e.reverse : "bottom" === t ? e.main : e.reverse;
  }
  function xe(e, t, n2) {
    if (0 === e.length) {
      return [];
    }
    if (t.groupOffsetTree === H) {
      return e.map(function(e2) {
        return c({}, e2, {index:e2.index + n2, originalIndex:e2.index});
      });
    }
    var o2, r2 = [], i2 = A(t.groupOffsetTree, e[0].index, e[e.length - 1].index), a3 = void 0, l3 = 0;
    for (e = f(e); !(o2 = e()).done;) {
      o2 = o2.value, (!a3 || a3.end < o2.index) && (a3 = i2.shift(), l3 = t.groupIndices.indexOf(a3.start)), r2.push(c({}, o2.index === a3.start ? {type:"group", index:l3} : {index:o2.index - (l3 + 1) + n2, groupIndex:l3}, {size:o2.size, offset:o2.offset, originalIndex:o2.index, data:o2.data}));
    }
    return r2;
  }
  function be(e, t, n2, o2, r2, i2) {
    var a3 = 0, l3 = 0;
    0 < e.length && (a3 = e[0].offset, l3 = e[e.length - 1], l3 = l3.offset + l3.size);
    var u2 = n2 - r2.lastIndex, c2 = a3;
    o2 = r2.lastOffset + u2 * r2.lastSize + (u2 - 1) * o2 - l3;
    return {items:xe(e, r2, i2), topItems:xe(t, r2, i2), topListHeight:t.reduce(function(e2, t2) {
      return t2.size + e2;
    }, 0), offsetTop:a3, offsetBottom:o2, top:c2, bottom:l3, totalCount:n2, firstItemIndex:i2};
  }
  function Fe(e) {
    var t, n2 = !1;
    return function() {
      return n2 || (n2 = !0, t = e()), t;
    };
  }
  function De(e, t) {
    var n2 = (0,import_react28.useRef)(null), o2 = (0,import_react28.useCallback)(function(o3) {
      if (null !== o3 && o3.offsetParent) {
        var i2 = o3.getBoundingClientRect();
        o3 = i2.width;
        if (t) {
          var r2 = t.getBoundingClientRect();
          i2 = i2.top - r2.top;
          r2 = r2.height - Math.max(0, i2);
          i2 += t.scrollTop;
        } else {
          r2 = window.innerHeight - Math.max(0, i2.top), i2 = i2.top + window.pageYOffset;
        }
        n2.current = {offsetTop:i2, visibleHeight:r2, visibleWidth:o3};
        e(n2.current);
      }
    }, [e, t]), l3 = C(o2), s2 = l3.callbackRef, u2 = l3.ref, c2 = (0,import_react28.useCallback)(function() {
      o2(u2.current);
    }, [o2, u2]);
    return (0,import_react28.useEffect)(function() {
      if (t) {
        t.addEventListener("scroll", c2);
        var e2 = new ResizeObserver(c2);
        return e2.observe(t), function() {
          t.removeEventListener("scroll", c2);
          e2.unobserve(t);
        };
      }
      return window.addEventListener("scroll", c2), window.addEventListener("resize", c2), function() {
        window.removeEventListener("scroll", c2);
        window.removeEventListener("resize", c2);
      };
    }, [c2, t]), s2;
  }
  function qe(e) {
    return e;
  }
  function Je(e, n2) {
    var o2 = stream();
    return subscribe(o2, function() {
      return console.warn("react-virtuoso: You are using a deprecated property. " + n2, "color: red;", "color: inherit;", "color: blue;");
    }), connect(o2, e), o2;
  }
  function it(e, t) {
    if ("string" != typeof e) {
      return {context:t};
    }
  }
  function st(e) {
    var t = e.usePublisher, o2 = e.useEmitter, r2 = e.useEmitterValue;
    return n.memo(function(e2) {
      var n2 = e2.style, i2 = e2.children;
      e2 = m(e2, Ke);
      var s2 = t("scrollContainerState"), u2 = r2("ScrollerComponent"), d2 = t("smoothScrollTargetReached"), f2 = r2("scrollerRef"), p2 = r2("context");
      s2 = b(s2, d2, u2, f2);
      d2 = s2.scrollerRef;
      f2 = s2.scrollByCallback;
      return o2("scrollTo", s2.scrollToCallback), o2("scrollBy", f2), (0,import_react28.createElement)(u2, c({ref:d2, style:c({}, nt, n2), "data-test-id":"virtuoso-scroller", "data-virtuoso-scroller":!0, tabIndex:0}, e2, it(u2, p2)), i2);
    });
  }
  function ut(e) {
    var o2 = e.usePublisher, r2 = e.useEmitter, i2 = e.useEmitterValue;
    return n.memo(function(e2) {
      var n2 = e2.style, a3 = e2.children;
      e2 = m(e2, Ye);
      var u2 = o2("windowScrollContainerState"), d2 = i2("ScrollerComponent"), f2 = o2("smoothScrollTargetReached"), p2 = i2("totalListHeight"), h2 = i2("deviation"), v2 = i2("customScrollParent"), S2 = i2("context");
      f2 = b(u2, f2, d2, noop4, v2);
      var I2 = f2.scrollerRef;
      u2 = f2.scrollByCallback;
      f2 = f2.scrollToCallback;
      return g(function() {
        return I2.current = v2 || window, function() {
          I2.current = null;
        };
      }, [I2, v2]), r2("windowScrollTo", f2), r2("scrollBy", u2), (0,import_react28.createElement)(d2, c({style:c({position:"relative"}, n2, 0 !== p2 ? {height:p2 + h2} : {}), "data-virtuoso-scroller":!0}, e2, it(d2, S2)), a3);
    });
  }
  function Et(e, t, n2) {
    return Array.from({length:t - e + 1}).map(function(t2, o2) {
      return {index:o2 + e, data:null == n2 ? void 0 : n2[o2 + e]};
    });
  }
  function Rt(e, t) {
    return e && e.column === t.column && e.row === t.row;
  }
  function Ft(e, t, n2, o2) {
    var r2 = n2.height;
    return void 0 === r2 || 0 === o2.length ? {top:0, bottom:0} : {top:kt(e, t, n2, o2[0].index), bottom:kt(e, t, n2, o2[o2.length - 1].index) + r2};
  }
  function kt(e, t, n2$jscomp$0, o2) {
    var n2 = t.column;
    e = Ht(1, bt((e.width + n2) / (n2$jscomp$0.width + n2)));
    o2 = bt(o2 / e);
    n2$jscomp$0 = o2 * n2$jscomp$0.height + Ht(0, o2 - 1) * t.row;
    return 0 < n2$jscomp$0 ? n2$jscomp$0 + t.row : n2$jscomp$0;
  }
  function qt(e, t, n2) {
    return "normal" === t || null != t && t.endsWith("px") || n2(e + " was not resolved to pixel value correctly", t, h.WARN), "normal" === t ? 0 : parseInt(null != t ? t : "0", 10);
  }
  function _extends2() {
    _extends2 = Object.assign ? Object.assign.bind() : function(target) {
      for (var i2 = 1; i2 < arguments.length; i2++) {
        var source = arguments[i2], key;
        for (key in source) {
          Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
        }
      }
      return target;
    };
    return _extends2.apply(this, arguments);
  }
  function _setPrototypeOf2(o2, p2) {
    _setPrototypeOf2 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(o3, p3) {
      o3.__proto__ = p3;
      return o3;
    };
    return _setPrototypeOf2(o2, p2);
  }
  function _inheritsLoose2(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    _setPrototypeOf2(subClass, superClass);
  }
  function _getPrototypeOf(o2) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(o3) {
      return o3.__proto__ || Object.getPrototypeOf(o3);
    };
    return _getPrototypeOf(o2);
  }
  function _isNativeReflectConstruct() {
    if ("undefined" === typeof Reflect || !Reflect.construct || Reflect.construct.sham) {
      return !1;
    }
    if ("function" === typeof Proxy) {
      return !0;
    }
    try {
      return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
      })), !0;
    } catch (e) {
      return !1;
    }
  }
  function _construct(Parent, args, Class) {
    _construct = _isNativeReflectConstruct() ? Reflect.construct.bind() : function(Parent2, args2, Class2) {
      var a3 = [null];
      a3.push.apply(a3, args2);
      Parent2 = new (Function.bind.apply(Parent2, a3))();
      Class2 && _setPrototypeOf2(Parent2, Class2.prototype);
      return Parent2;
    };
    return _construct.apply(null, arguments);
  }
  function _wrapNativeSuper(Class) {
    var _cache = "function" === typeof Map ? new Map() : void 0;
    _wrapNativeSuper = function(Class2) {
      function Wrapper() {
        return _construct(Class2, arguments, _getPrototypeOf(this).constructor);
      }
      if (null === Class2 || -1 === Function.toString.call(Class2).indexOf("[native code]")) {
        return Class2;
      }
      if ("function" !== typeof Class2) {
        throw new TypeError("Super expression must either be null or a function");
      }
      if ("undefined" !== typeof _cache) {
        if (_cache.has(Class2)) {
          return _cache.get(Class2);
        }
        _cache.set(Class2, Wrapper);
      }
      Wrapper.prototype = Object.create(Class2.prototype, {constructor:{value:Wrapper, enumerable:!1, writable:!0, configurable:!0}});
      return _setPrototypeOf2(Wrapper, Class2);
    };
    return _wrapNativeSuper(Class);
  }
  function convertToInt(red, green, blue) {
    return Math.round(255 * red) + "," + Math.round(255 * green) + "," + Math.round(255 * blue);
  }
  function hslToRgb(hue, saturation, lightness, convert) {
    void 0 === convert && (convert = convertToInt);
    if (0 === saturation) {
      return convert(lightness, lightness, lightness);
    }
    hue = (hue % 360 + 360) % 360 / 60;
    var chroma = (1 - Math.abs(2 * lightness - 1)) * saturation, secondComponent = chroma * (1 - Math.abs(hue % 2 - 1)), green = saturation = 0, blue = 0;
    0 <= hue && 1 > hue ? (saturation = chroma, green = secondComponent) : 1 <= hue && 2 > hue ? (saturation = secondComponent, green = chroma) : 2 <= hue && 3 > hue ? (green = chroma, blue = secondComponent) : 3 <= hue && 4 > hue ? (green = secondComponent, blue = chroma) : 4 <= hue && 5 > hue ? (saturation = secondComponent, blue = chroma) : 5 <= hue && 6 > hue && (saturation = chroma, blue = secondComponent);
    lightness -= chroma / 2;
    return convert(saturation + lightness, green + lightness, blue + lightness);
  }
  function parseToRgb(color) {
    if ("string" !== typeof color) {
      throw new PolishedError(3);
    }
    if ("string" === typeof color) {
      var normalizedColorName = color.toLowerCase();
      color = namedColorMap[normalizedColorName] ? "#" + namedColorMap[normalizedColorName] : color;
    }
    if (color.match(hexRegex)) {
      return {red:parseInt("" + color[1] + color[2], 16), green:parseInt("" + color[3] + color[4], 16), blue:parseInt("" + color[5] + color[6], 16)};
    }
    if (color.match(hexRgbaRegex)) {
      return normalizedColorName = parseFloat((parseInt("" + color[7] + color[8], 16) / 255).toFixed(2)), {red:parseInt("" + color[1] + color[2], 16), green:parseInt("" + color[3] + color[4], 16), blue:parseInt("" + color[5] + color[6], 16), alpha:normalizedColorName};
    }
    if (color.match(reducedHexRegex)) {
      return {red:parseInt("" + color[1] + color[1], 16), green:parseInt("" + color[2] + color[2], 16), blue:parseInt("" + color[3] + color[3], 16)};
    }
    if (color.match(reducedRgbaHexRegex)) {
      return normalizedColorName = parseFloat((parseInt("" + color[4] + color[4], 16) / 255).toFixed(2)), {red:parseInt("" + color[1] + color[1], 16), green:parseInt("" + color[2] + color[2], 16), blue:parseInt("" + color[3] + color[3], 16), alpha:normalizedColorName};
    }
    if (normalizedColorName = rgbRegex.exec(color)) {
      return {red:parseInt("" + normalizedColorName[1], 10), green:parseInt("" + normalizedColorName[2], 10), blue:parseInt("" + normalizedColorName[3], 10)};
    }
    if (normalizedColorName = rgbaRegex.exec(color.substring(0, 50))) {
      return {red:parseInt("" + normalizedColorName[1], 10), green:parseInt("" + normalizedColorName[2], 10), blue:parseInt("" + normalizedColorName[3], 10), alpha:1 < parseFloat("" + normalizedColorName[4]) ? parseFloat("" + normalizedColorName[4]) / 100 : parseFloat("" + normalizedColorName[4])};
    }
    var hslMatched = hslRegex.exec(color);
    if (hslMatched) {
      normalizedColorName = parseInt("" + hslMatched[1], 10);
      var saturation = parseInt("" + hslMatched[2], 10) / 100;
      hslMatched = parseInt("" + hslMatched[3], 10) / 100;
      normalizedColorName = "rgb(" + hslToRgb(normalizedColorName, saturation, hslMatched) + ")";
      saturation = rgbRegex.exec(normalizedColorName);
      if (!saturation) {
        throw new PolishedError(4, color, normalizedColorName);
      }
      return {red:parseInt("" + saturation[1], 10), green:parseInt("" + saturation[2], 10), blue:parseInt("" + saturation[3], 10)};
    }
    if (normalizedColorName = hslaRegex.exec(color.substring(0, 50))) {
      saturation = parseInt("" + normalizedColorName[1], 10);
      hslMatched = parseInt("" + normalizedColorName[2], 10) / 100;
      var _lightness = parseInt("" + normalizedColorName[3], 10) / 100;
      saturation = "rgb(" + hslToRgb(saturation, hslMatched, _lightness) + ")";
      hslMatched = rgbRegex.exec(saturation);
      if (!hslMatched) {
        throw new PolishedError(4, color, saturation);
      }
      return {red:parseInt("" + hslMatched[1], 10), green:parseInt("" + hslMatched[2], 10), blue:parseInt("" + hslMatched[3], 10), alpha:1 < parseFloat("" + normalizedColorName[4]) ? parseFloat("" + normalizedColorName[4]) / 100 : parseFloat("" + normalizedColorName[4])};
    }
    throw new PolishedError(5);
  }
  function numberToHex(value) {
    value = value.toString(16);
    return 1 === value.length ? "0" + value : value;
  }
  function convertToHex(red, green, blue) {
    return reduceHexValue$1("#" + numberToHex(Math.round(255 * red)) + numberToHex(Math.round(255 * green)) + numberToHex(Math.round(255 * blue)));
  }
  function rgb(value, green, blue) {
    if ("number" === typeof value && "number" === typeof green && "number" === typeof blue) {
      return reduceHexValue$1("#" + numberToHex(value) + numberToHex(green) + numberToHex(blue));
    }
    if ("object" === typeof value && void 0 === green && void 0 === blue) {
      return reduceHexValue$1("#" + numberToHex(value.red) + numberToHex(value.green) + numberToHex(value.blue));
    }
    throw new PolishedError(6);
  }
  function toColorString(color) {
    if ("object" !== typeof color) {
      throw new PolishedError(8);
    }
    if ("number" === typeof color.red && "number" === typeof color.green && "number" === typeof color.blue && "number" === typeof color.alpha) {
      if ("object" === typeof color) {
        color = 1 <= color.alpha ? rgb(color.red, color.green, color.blue) : "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
      } else {
        throw new PolishedError(7);
      }
      return color;
    }
    if ("number" === typeof color.red && "number" === typeof color.green && "number" === typeof color.blue && ("number" !== typeof color.alpha || "undefined" === typeof color.alpha)) {
      return rgb(color);
    }
    if ("number" === typeof color.hue && "number" === typeof color.saturation && "number" === typeof color.lightness && "number" === typeof color.alpha) {
      if ("object" === typeof color) {
        color = 1 <= color.alpha ? hslToRgb(color.hue, color.saturation, color.lightness, convertToHex) : "rgba(" + hslToRgb(color.hue, color.saturation, color.lightness) + "," + color.alpha + ")";
      } else {
        throw new PolishedError(2);
      }
      return color;
    }
    if ("number" === typeof color.hue && "number" === typeof color.saturation && "number" === typeof color.lightness && ("number" !== typeof color.alpha || "undefined" === typeof color.alpha)) {
      if ("object" === typeof color) {
        color = hslToRgb(color.hue, color.saturation, color.lightness, convertToHex);
      } else {
        throw new PolishedError(1);
      }
      return color;
    }
    throw new PolishedError(8);
  }
  function curried(f2, length, acc) {
    return function() {
      var combined = acc.concat(Array.prototype.slice.call(arguments));
      return combined.length >= length ? f2.apply(this, combined) : curried(f2, length, combined);
    };
  }
  function darken(amount, color) {
    if ("transparent" === color) {
      return color;
    }
    color = parseToRgb(color);
    var red = color.red / 255, green = color.green / 255, blue = color.blue / 255, max = Math.max(red, green, blue), min = Math.min(red, green, blue), lightness = (max + min) / 2;
    if (max === min) {
      color = void 0 !== color.alpha ? {hue:0, saturation:0, lightness, alpha:color.alpha} : {hue:0, saturation:0, lightness};
    } else {
      var delta = max - min;
      min = 0.5 < lightness ? delta / (2 - max - min) : delta / (max + min);
      switch(max) {
        case red:
          red = (green - blue) / delta + (green < blue ? 6 : 0);
          break;
        case green:
          red = (blue - red) / delta + 2;
          break;
        default:
          red = (red - green) / delta + 4;
      }
      red *= 60;
      color = void 0 !== color.alpha ? {hue:red, saturation:min, lightness, alpha:color.alpha} : {hue:red, saturation:min, lightness};
    }
    lightness = _extends2;
    amount = color.lightness - parseFloat(amount);
    return toColorString(lightness({}, color, {lightness:Math.max(0, Math.min(1, amount))}));
  }
  function withClampedStyles(self2, props) {
    var _a3;
    void 0 !== props.strokeWidth && (props.strokeWidth = Math.max(props.strokeWidth, 1));
    void 0 !== props.opacity && (props.opacity = Math.min(1, Math.max(props.opacity, 0)));
    let fill = null != (_a3 = props.fill) ? _a3 : self2.props.fill;
    void 0 === fill || isBuiltInColor(fill) || "var(--ls-secondary-background-color)" === fill || props.noFill || !withFillShapes.includes(self2.props.type) || (self2 = curriedDarken$1(0.3, fill), props.stroke = self2);
    return props;
  }
  function BindingIndicator({strokeWidth, size, mode}) {
    return "svg" === mode ? (0,import_jsx_runtime51.jsx)("rect", {className:"tl-binding-indicator", x:strokeWidth, y:strokeWidth, rx:2, ry:2, width:Math.max(0, size[0] - 2 * strokeWidth), height:Math.max(0, size[1] - 2 * strokeWidth), strokeWidth:4 * strokeWidth}) : (0,import_jsx_runtime51.jsx)("div", {className:"tl-binding-indicator", style:{position:"absolute", left:0, top:0, right:0, bottom:0, boxShadow:"0 0 0 4px var(--tl-binding)", borderRadius:4}});
  }
  function useCameraMovingRef() {
    const app = useApp();
    return "panning" === app.inputs.state || "pinching" === app.inputs.state;
  }
  function Arrowhead({left, middle, right, stroke, strokeWidth}) {
    return (0,import_jsx_runtime60.jsxs)("g", {children:[(0,import_jsx_runtime60.jsx)("path", {className:"tl-stroke-hitarea", d:`M ${left} L ${middle} ${right}`}), (0,import_jsx_runtime60.jsx)("path", {d:`M ${left} L ${middle} ${right}`, fill:"none", stroke, strokeWidth, strokeLinecap:"round", strokeLinejoin:"round", pointerEvents:"none"})]});
  }
  function getStraightArrowHeadPoints(A3, B3, r2) {
    B3 = intersectLineSegmentCircle(A3, B3, A3, r2).points;
    if (!B3) {
      return console.warn("Could not find an intersection for the arrow head."), {left:A3, right:A3};
    }
    B3 = (r2 = B3[0]) ? src_default.rotWith(r2, A3, Math.PI / 6) : A3;
    A3 = r2 ? src_default.rotWith(r2, A3, -Math.PI / 6) : A3;
    return {left:B3, right:A3};
  }
  function getStraightArrowHeadPath(A3, B3, r2) {
    const {left, right} = getStraightArrowHeadPoints(A3, B3, r2);
    return `M ${left} L ${A3} ${right}`;
  }
  function getArrowPath(style, start, end, decorationStart, decorationEnd) {
    style = style.strokeWidth;
    var arrowDist = src_default.dist(start, end);
    style = Math.min(arrowDist / 3, 16 * style);
    arrowDist = [];
    arrowDist.push(`M ${start} L ${end}`);
    decorationStart && arrowDist.push(getStraightArrowHeadPath(start, end, style));
    decorationEnd && arrowDist.push(getStraightArrowHeadPath(end, start, style));
    return arrowDist.join(" ");
  }
  function LabelMask({id:id3, bounds, labelSize, offset, scale = 1}) {
    return (0,import_jsx_runtime62.jsx)("defs", {children:(0,import_jsx_runtime62.jsxs)("mask", {id:id3 + "_clip", children:[(0,import_jsx_runtime62.jsx)("rect", {x:-100, y:-100, width:bounds.width + 200, height:bounds.height + 200, fill:"white"}), (0,import_jsx_runtime62.jsx)("rect", {x:bounds.width / 2 - labelSize[0] / 2 * scale + ((null == offset ? void 0 : offset[0]) || 0), y:bounds.height / 2 - labelSize[1] / 2 * scale + ((null == offset ? void 0 : offset[1]) || 0), width:labelSize[0] * scale, 
    height:labelSize[1] * scale, rx:4 * scale, ry:4 * scale, fill:"black"})]})});
  }
  function $2(e, t, u2, x2 = h2 => h2) {
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
  function R2(e) {
    return [e[1], -e[0]];
  }
  function ue2(e, t) {
    return e[0] === t[0] && e[1] === t[1];
  }
  function de2(e) {
    return e[0] * e[0] + e[1] * e[1];
  }
  function G2(e) {
    var t = Math.hypot(e[0], e[1]);
    return [e[0] / t, e[1] / t];
  }
  function ie2(e, t) {
    return Math.hypot(e[1] - t[1], e[0] - t[0]);
  }
  function L2(e, t, u2) {
    let x2 = Math.sin(u2);
    u2 = Math.cos(u2);
    let y2 = e[0] - t[0];
    e = e[1] - t[1];
    return [y2 * u2 - e * x2 + t[0], y2 * x2 + e * u2 + t[1]];
  }
  function K2(e, t, u2) {
    return l2(e, b2(a2(t, e), u2));
  }
  function ee2(e, t, u2) {
    return l2(e, b2(t, u2));
  }
  function ce2(e, t = {}) {
    let {size:u2 = 16, smoothing:x2 = 0.5, thinning:h2 = 0.5, simulatePressure:y2 = !0, easing:n2 = r2 => r2, start:f2 = {}, end:d2 = {}, last:D2 = !1} = t, {cap:S2 = !0, easing:j2 = r2 => r2 * (2 - r2)} = f2, {cap:q2 = !0, easing:c2 = r2 => --r2 * r2 * r2 + 1} = d2;
    if (0 === e.length || 0 >= u2) {
      return [];
    }
    var p2 = e[e.length - 1].runningLength;
    let g2 = !1 === f2.taper ? 0 : !0 === f2.taper ? Math.max(u2, p2) : f2.taper, T2 = !1 === d2.taper ? 0 : !0 === d2.taper ? Math.max(u2, p2) : d2.taper;
    var te2 = Math.pow(u2 * x2, 2);
    t = [];
    let M2 = [];
    var H2 = e.slice(0, 10).reduce((r2, i2) => {
      var o2 = i2.pressure;
      y2 && (i2 = C2(1, i2.distance / u2), o2 = C2(1, 1 - i2), o2 = C2(1, r2 + 0.275 * (o2 - r2) * i2));
      return (r2 + o2) / 2;
    }, e[0].pressure), m2 = $2(u2, h2, e[e.length - 1].pressure, n2), U2;
    let X2 = e[0].vector;
    var z2 = e[0].point;
    let F2 = z2;
    var O2 = z2;
    let E2 = F2;
    var J2 = !1;
    for (var r2 = 0; r2 < e.length; r2++) {
      var {pressure:i2} = e[r2];
      let {point:o2, vector:s2, distance:W2, runningLength:I2} = e[r2];
      if (r2 < e.length - 1 && 3 > p2 - I2) {
        continue;
      }
      h2 ? (y2 && (m2 = C2(1, W2 / u2), i2 = C2(1, 1 - m2), i2 = C2(1, H2 + 0.275 * (i2 - H2) * m2)), m2 = $2(u2, h2, i2, n2)) : m2 = u2 / 2;
      void 0 === U2 && (U2 = m2);
      var le2 = I2 < g2 ? j2(I2 / g2) : 1, fe2 = p2 - I2 < T2 ? c2((p2 - I2) / T2) : 1;
      m2 = Math.max(0.01, m2 * Math.min(le2, fe2));
      fe2 = (r2 < e.length - 1 ? e[r2 + 1] : e[r2]).vector;
      let Y2 = r2 < e.length - 1 ? s2[0] * fe2[0] + s2[1] * fe2[1] : 1;
      le2 = null !== Y2 && 0 > Y2;
      if (0 > s2[0] * X2[0] + s2[1] * X2[1] && !J2 || le2) {
        z2 = b2(R2(X2), m2);
        for (let Z2 = 1 / 13, w2 = 0; 1 >= w2; w2 += Z2) {
          O2 = L2(a2(o2, z2), o2, V3 * w2), t.push(O2), E2 = L2(l2(o2, z2), o2, V3 * -w2), M2.push(E2);
        }
        z2 = O2;
        F2 = E2;
        le2 && (J2 = !0);
      } else {
        (J2 = !1, r2 === e.length - 1) ? (i2 = b2(R2(s2), m2), t.push(a2(o2, i2)), M2.push(l2(o2, i2))) : (H2 = b2(R2(K2(fe2, s2, Y2)), m2), O2 = a2(o2, H2), (1 >= r2 || de2(a2(z2, O2)) > te2) && (t.push(O2), z2 = O2), E2 = l2(o2, H2), (1 >= r2 || de2(a2(F2, E2)) > te2) && (M2.push(E2), F2 = E2), H2 = i2, X2 = s2);
      }
    }
    p2 = e[0].point.slice(0, 2);
    te2 = 1 < e.length ? e[e.length - 1].point.slice(0, 2) : l2(e[0].point, [1, 1]);
    O2 = [];
    J2 = [];
    if (1 === e.length) {
      if (!g2 && !T2 || D2) {
        e = ee2(p2, G2(R2(a2(p2, te2))), -(U2 || m2));
        t = [];
        for (let o2 = 1 / 13, s2 = o2; 1 >= s2; s2 += o2) {
          t.push(L2(e, p2, 2 * V3 * s2));
        }
        return t;
      }
    } else {
      if (!(g2 || T2 && 1 === e.length)) {
        if (S2) {
          for (let i2 = 1 / 13, o2 = i2; 1 >= o2; o2 += i2) {
            U2 = L2(M2[0], p2, V3 * o2), O2.push(U2);
          }
        } else {
          r2 = a2(t[0], M2[0]), U2 = b2(r2, 0.5), r2 = b2(r2, 0.51), O2.push(a2(p2, U2), a2(p2, r2), l2(p2, r2), l2(p2, U2));
        }
      }
      U2 = R2(se2(e[e.length - 1].vector));
      if (T2 || g2 && 1 === e.length) {
        J2.push(te2);
      } else if (q2) {
        e = ee2(te2, U2, m2);
        for (let o2 = 1 / 29, s2 = o2; 1 > s2; s2 += o2) {
          J2.push(L2(e, te2, 3 * V3 * s2));
        }
      } else {
        J2.push(l2(te2, b2(U2, m2)), l2(te2, b2(U2, 0.99 * m2)), a2(te2, b2(U2, 0.99 * m2)), a2(te2, b2(U2, m2)));
      }
    }
    return t.concat(J2, M2.reverse(), O2);
  }
  function me2(e, t = {}) {
    var q2;
    let {streamline:u2 = 0.5, size:x2 = 16, last:h2 = !1} = t;
    if (0 === e.length) {
      return [];
    }
    t = 0.15 + 0.85 * (1 - u2);
    e = Array.isArray(e[0]) ? e : e.map(({x:c2, y:p2, pressure:g2 = 0.5}) => [c2, p2, g2]);
    if (2 === e.length) {
      var c2$jscomp$0 = e[1];
      e = e.slice(0, -1);
      for (var p2$jscomp$0 = 1; 5 > p2$jscomp$0; p2$jscomp$0++) {
        e.push(K2(e[0], c2$jscomp$0, p2$jscomp$0 / 4));
      }
    }
    1 === e.length && (e = [...e, [...l2(e[0], [1, 1]), ...e[0].slice(2)]]);
    c2$jscomp$0 = [{point:[e[0][0], e[0][1]], pressure:0 <= e[0][2] ? e[0][2] : 0.25, vector:[1, 1], distance:0, runningLength:0}];
    p2$jscomp$0 = !1;
    let D2 = 0, S2 = c2$jscomp$0[0], j2 = e.length - 1;
    for (let c2 = 1; c2 < e.length; c2++) {
      let p2 = h2 && c2 === j2 ? e[c2].slice(0, 2) : K2(S2.point, e[c2], t);
      if (ue2(S2.point, p2)) {
        continue;
      }
      let g2 = ie2(p2, S2.point);
      if (D2 += g2, c2 < j2 && !p2$jscomp$0) {
        if (D2 < x2) {
          continue;
        }
        p2$jscomp$0 = !0;
      }
      S2 = {point:p2, pressure:0 <= e[c2][2] ? e[c2][2] : 0.5, vector:G2(a2(S2.point, p2)), distance:g2, runningLength:D2};
      c2$jscomp$0.push(S2);
    }
    return c2$jscomp$0[0].vector = (null == (q2 = c2$jscomp$0[1]) ? void 0 : q2.vector) || [0, 0], c2$jscomp$0;
  }
  function generateSVGFromModel(serializedApp, ratio = 4 / 3) {
    return (new PreviewManager(serializedApp)).exportAsSVG(ratio);
  }
  function generateJSXFromModel(serializedApp, ratio = 4 / 3) {
    return (new PreviewManager(serializedApp)).generatePreviewJsx(void 0, ratio);
  }
  function ShapeLinkItem({id:id3, type, onRemove, showContent}) {
    const app = useApp(), {handlers} = import_react50.default.useContext(LogseqContext), t = handlers.t;
    return (0,import_jsx_runtime76.jsxs)("div", {className:"tl-shape-links-panel-item color-level relative", children:[(0,import_jsx_runtime76.jsx)("div", {className:"whitespace-pre break-all overflow-hidden text-ellipsis inline-flex", children:(0,import_jsx_runtime76.jsx)(BlockLink, {id:id3, showReferenceContent:showContent})}), (0,import_jsx_runtime76.jsx)("div", {className:"flex-1"}), handlers.getBlockPageName(id3) !== app.currentPage.name && (0,import_jsx_runtime76.jsx)(Button, {tooltip:t("whiteboard/open-page"), 
    type:"button", onClick:() => null == handlers ? void 0 : handlers.redirectToPage(id3), children:(0,import_jsx_runtime76.jsx)(TablerIcon, {name:"open-as-page"})}), (0,import_jsx_runtime76.jsx)(Button, {tooltip:t("whiteboard/open-page-in-sidebar"), type:"button", onClick:() => null == handlers ? void 0 : handlers.sidebarAddBlock(id3, "B" === type ? "block" : "page"), children:(0,import_jsx_runtime76.jsx)(TablerIcon, {name:"move-to-sidebar-right"})}), onRemove && (0,import_jsx_runtime76.jsx)(Button, 
    {className:"tl-shape-links-panel-item-remove-button", tooltip:t("whiteboard/remove-link"), type:"button", onClick:onRemove, children:(0,import_jsx_runtime76.jsx)(TablerIcon, {name:"x", className:"!translate-y-0"})})]});
  }
  function ToggleGroupInput({options, value, onValueChange}) {
    return (0,import_jsx_runtime77.jsx)(LSUI10.ToggleGroup, {type:"single", value, onValueChange, children:options.map(option => (0,import_jsx_runtime77.jsx)(Tooltip, {content:option.tooltip, children:(0,import_jsx_runtime77.jsx)("div", {className:"inline-flex", children:(0,import_jsx_runtime77.jsx)(LSUI10.ToggleGroupItem, {className:"tl-button", value:option.value, disabled:option.value === value, children:(0,import_jsx_runtime77.jsx)(TablerIcon, {name:option.icon})})})}, option.value))});
  }
  function ToggleGroupMultipleInput({options, value, onValueChange}) {
    return (0,import_jsx_runtime77.jsx)(LSUI10.ToggleGroup, {className:"inline-flex", type:"multiple", value, onValueChange, children:options.map(option => (0,import_jsx_runtime77.jsx)(LSUI10.ToggleGroupItem, {className:"tl-button", value:option.value, children:(0,import_jsx_runtime77.jsx)(TablerIcon, {name:option.icon})}, option.value))});
  }
  function filterShapeByAction(type) {
    return useApp().selectedShapesArray.filter(s2 => !s2.props.isLocked).filter(shape => {
      var _a3;
      return null == (_a3 = shapeMapping[shape.props.type]) ? void 0 : _a3.includes(type);
    });
  }
  function getFileType(filename) {
    var _a3;
    filename = filename.match(/\.[0-9a-z]+$/i);
    if (!filename) {
      return "unknown";
    }
    const extension = filename[0].toLowerCase();
    [filename] = null != (_a3 = Object.entries(assetExtensions).find(([, extensions]) => extensions.includes(extension))) ? _a3 : ["unknown", null];
    return filename;
  }
  function tryCreateShapeHelper(...fns) {
    return (...args) => __async(this, null, function*() {
      for (const fn of fns) {
        const result = yield fn(...args);
        if (result && 0 < result.length) {
          return result;
        }
      }
      return null;
    });
  }
  function getDataFromType(item, type) {
    return __async(this, null, function*() {
      return item.types.includes(type) ? item instanceof DataTransfer ? item.getData(type) : yield (yield item.getType(type)).text() : null;
    });
  }
  function usePaste() {
    const {handlers} = React65.useContext(LogseqContext);
    return React65.useCallback((app, info) => __async(this, null, function*() {
      if (info.shiftKey && 1 === app.selectedShapesArray.length) {
        var items = yield navigator.clipboard.read();
        let newRef;
        0 < items.length && (items = (yield (yield items[0].getType("text/plain")).text()).trim()) && (/^\(\(.*\)\)$/.test(items) && 40 === items.length ? (items = items.slice(2, -2), validUUID(items) && (newRef = items)) : /^\[\[.*\]\]$/.test(items) && (newRef = items.slice(2, -2)));
        if (newRef) {
          app.selectedShapesArray[0].update({refs:[newRef]});
          app.persist();
          return;
        }
      }
      handleCreatingShapes(app, info, handlers);
    }), []);
  }
  function useDrop() {
    const handlePaste = usePaste();
    return React66.useCallback((_0, _1) => __async(this, [_0, _1], function*(app, {dataTransfer, point}) {
      handlePaste(app, {point, shiftKey:!1, dataTransfer, fromDrop:!0});
    }), []);
  }
  function useCopy() {
    const {handlers} = React67.useContext(LogseqContext);
    return React67.useCallback((app, {text, html}) => {
      handlers.copyToClipboard(text, html);
    }, []);
  }
  function useQuickAdd() {
    return import_react57.default.useCallback(app => __async(this, null, function*() {
      setTimeout(() => {
        app.transition("logseq-portal").selectedTool.transition("creating");
      }, 100);
    }), []);
  }
  var __create = Object.create, __defProp = Object.defineProperty, __defProps = Object.defineProperties, __getOwnPropDesc = Object.getOwnPropertyDescriptor, __getOwnPropDescs = Object.getOwnPropertyDescriptors, __getOwnPropNames = Object.getOwnPropertyNames, __getOwnPropSymbols = Object.getOwnPropertySymbols, __getProtoOf = Object.getPrototypeOf, __hasOwnProp = Object.prototype.hasOwnProperty, __propIsEnum = Object.prototype.propertyIsEnumerable, __defNormalProp = (obj, key, value) => key in obj ? 
  __defProp(obj, key, {enumerable:!0, configurable:!0, writable:!0, value}) : obj[key] = value, __spreadValues = (a3, b3) => {
    for (var prop in b3 ||= {}) {
      __hasOwnProp.call(b3, prop) && __defNormalProp(a3, prop, b3[prop]);
    }
    if (__getOwnPropSymbols) {
      for (prop of __getOwnPropSymbols(b3)) {
        __propIsEnum.call(b3, prop) && __defNormalProp(a3, prop, b3[prop]);
      }
    }
    return a3;
  }, __spreadProps = (a3, b3) => __defProps(a3, __getOwnPropDescs(b3)), __objRest = (source, exclude) => {
    var target = {}, prop;
    for (prop in source) {
      __hasOwnProp.call(source, prop) && 0 > exclude.indexOf(prop) && (target[prop] = source[prop]);
    }
    if (null != source && __getOwnPropSymbols) {
      for (prop of __getOwnPropSymbols(source)) {
        0 > exclude.indexOf(prop) && __propIsEnum.call(source, prop) && (target[prop] = source[prop]);
      }
    }
    return target;
  }, __commonJS = (cb, mod) => function() {
    return mod || (0,cb[__getOwnPropNames(cb)[0]])((mod = {exports:{}}).exports, mod), mod.exports;
  }, __copyProps = (to, from, except, desc) => {
    if (from && "object" === typeof from || "function" === typeof from) {
      for (let key of __getOwnPropNames(from)) {
        __hasOwnProp.call(to, key) || key === except || __defProp(to, key, {get:() => from[key], enumerable:!(desc = __getOwnPropDesc(from, key)) || desc.enumerable});
      }
    }
    return to;
  }, __toESM = (mod, isNodeMode, target) => (target = null != mod ? __create(__getProtoOf(mod)) : {}, __copyProps(!isNodeMode && mod && mod.__esModule ? target : __defProp(target, "default", {value:mod, enumerable:!0}), mod)), __decorateClass = (decorators, target, key, kind) => {
    for (var result = 1 < kind ? void 0 : kind ? __getOwnPropDesc(target, key) : target, i2 = decorators.length - 1, decorator; 0 <= i2; i2--) {
      if (decorator = decorators[i2]) {
        result = (kind ? decorator(target, key, result) : decorator(result)) || result;
      }
    }
    kind && result && __defProp(target, key, result);
    return result;
  }, __publicField = (obj, key, value) => {
    __defNormalProp(obj, "symbol" !== typeof key ? key + "" : key, value);
    return value;
  }, __async = (__this, __arguments, generator) => new Promise((resolve, reject) => {
    var fulfilled = value => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }, rejected = value => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    }, step = x2 => x2.done ? resolve(x2.value) : Promise.resolve(x2.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  }), require_rbush_min = __commonJS({["../../node_modules/rbush/rbush.min.js"](exports, module2) {
    !function(t, i2) {
      "object" == typeof exports && "undefined" != typeof module2 ? module2.exports = i2() : "function" == typeof define && define.amd ? define(i2) : (t = t || self).RBush = i2();
    }(exports, function() {
      function t(t2, r3, e2, a4, h3) {
        !function t3(n3, r4, e3, a5, h4) {
          for (; a5 > e3;) {
            if (600 < a5 - e3) {
              var o3 = a5 - e3 + 1, s3 = r4 - e3 + 1, l4 = Math.log(o3), f3 = 0.5 * Math.exp(2 * l4 / 3);
              l4 = 0.5 * Math.sqrt(l4 * f3 * (o3 - f3) / o3) * (0 > s3 - o3 / 2 ? -1 : 1);
              t3(n3, r4, Math.max(e3, Math.floor(r4 - s3 * f3 / o3 + l4)), Math.min(a5, Math.floor(r4 + (o3 - s3) * f3 / o3 + l4)), h4);
            }
            o3 = n3[r4];
            s3 = e3;
            f3 = a5;
            i2(n3, e3, r4);
            for (0 < h4(n3[a5], o3) && i2(n3, e3, a5); s3 < f3;) {
              i2(n3, s3, f3);
              s3++;
              for (f3--; 0 > h4(n3[s3], o3);) {
                s3++;
              }
              for (; 0 < h4(n3[f3], o3);) {
                f3--;
              }
            }
            0 === h4(n3[e3], o3) ? i2(n3, e3, f3) : i2(n3, ++f3, a5);
            f3 <= r4 && (e3 = f3 + 1);
            r4 <= f3 && (a5 = f3 - 1);
          }
        }(t2, r3, e2 || 0, a4 || t2.length - 1, h3 || n2);
      }
      function i2(t2, i3, n3) {
        var r3 = t2[i3];
        t2[i3] = t2[n3];
        t2[n3] = r3;
      }
      function n2(t2, i3) {
        return t2 < i3 ? -1 : t2 > i3 ? 1 : 0;
      }
      function a3(t2, i3) {
        h2(t2, 0, t2.children.length, i3, t2);
      }
      function h2(t2, i3, n3, r3, e2) {
        e2 ||= p2(null);
        e2.minX = 1 / 0;
        e2.minY = 1 / 0;
        e2.maxX = -1 / 0;
        for (e2.maxY = -1 / 0; i3 < n3; i3++) {
          var h3 = t2.children[i3];
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
        return {children:t2, height:1, leaf:!0, minX:1 / 0, minY:1 / 0, maxX:-1 / 0, maxY:-1 / 0};
      }
      function d2(i3, n3, r3, e2, a4) {
        for (var h3 = [n3, r3]; h3.length;) {
          if (!((r3 = h3.pop()) - (n3 = h3.pop()) <= e2)) {
            var o3 = n3 + Math.ceil((r3 - n3) / e2 / 2) * e2;
            t(i3, o3, n3, r3, a4);
            h3.push(n3, o3, o3, r3);
          }
        }
      }
      var r2 = function(t2) {
        void 0 === t2 && (t2 = 9);
        this._maxEntries = Math.max(4, t2);
        this._minEntries = Math.max(2, Math.ceil(0.4 * this._maxEntries));
        this.clear();
      };
      return r2.prototype.all = function() {
        return this._all(this.data, []);
      }, r2.prototype.search = function(t2) {
        var i3 = this.data, n3 = [];
        if (!c2(t2, i3)) {
          return n3;
        }
        for (var r3 = this.toBBox, e2 = []; i3;) {
          for (var a4 = 0; a4 < i3.children.length; a4++) {
            var h3 = i3.children[a4], o3 = i3.leaf ? r3(h3) : h3;
            c2(t2, o3) && (i3.leaf ? n3.push(h3) : m2(t2, o3) ? this._all(h3, n3) : e2.push(h3));
          }
          i3 = e2.pop();
        }
        return n3;
      }, r2.prototype.collides = function(t2) {
        var i3 = this.data;
        if (!c2(t2, i3)) {
          return !1;
        }
        for (var n3 = []; i3;) {
          for (var r3 = 0; r3 < i3.children.length; r3++) {
            var e2 = i3.children[r3], a4 = i3.leaf ? this.toBBox(e2) : e2;
            if (c2(t2, a4)) {
              if (i3.leaf || m2(t2, a4)) {
                return !0;
              }
              n3.push(e2);
            }
          }
          i3 = n3.pop();
        }
        return !1;
      }, r2.prototype.load = function(t2) {
        if (!t2 || !t2.length) {
          return this;
        }
        if (t2.length < this._minEntries) {
          for (var i3 = 0; i3 < t2.length; i3++) {
            this.insert(t2[i3]);
          }
          return this;
        }
        t2 = this._build(t2.slice(), 0, t2.length - 1, 0);
        this.data.children.length ? this.data.height === t2.height ? this._splitRoot(this.data, t2) : (this.data.height < t2.height && (i3 = this.data, this.data = t2, t2 = i3), this._insert(t2, this.data.height - t2.height - 1, !0)) : this.data = t2;
        return this;
      }, r2.prototype.insert = function(t2) {
        return t2 && this._insert(t2, this.data.height - 1), this;
      }, r2.prototype.clear = function() {
        return this.data = p2([]), this;
      }, r2.prototype.remove = function(t2, i3$jscomp$0) {
        if (!t2) {
          return this;
        }
        for (var n3, r3, a4, h3 = this.data, o3 = this.toBBox(t2), s3 = [], l4 = []; h3 || s3.length;) {
          if (h3 || (h3 = s3.pop(), r3 = s3[s3.length - 1], n3 = l4.pop(), a4 = !0), h3.leaf) {
            a: {
              var f3 = t2;
              var i3 = h3.children, n3$jscomp$0 = i3$jscomp$0;
              if (n3$jscomp$0) {
                for (var r3$jscomp$0 = 0; r3$jscomp$0 < i3.length; r3$jscomp$0++) {
                  if (n3$jscomp$0(f3, i3[r3$jscomp$0])) {
                    f3 = r3$jscomp$0;
                    break a;
                  }
                }
                f3 = -1;
              } else {
                f3 = i3.indexOf(f3);
              }
            }
            if (-1 !== f3) {
              return h3.children.splice(f3, 1), s3.push(h3), this._condense(s3), this;
            }
          }
          a4 || h3.leaf || !m2(h3, o3) ? r3 ? (n3++, h3 = r3.children[n3], a4 = !1) : h3 = null : (s3.push(h3), l4.push(n3), n3 = 0, r3 = h3, h3 = h3.children[0]);
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
        for (var n3 = []; t2;) {
          t2.leaf ? i3.push.apply(i3, t2.children) : n3.push.apply(n3, t2.children), t2 = n3.pop();
        }
        return i3;
      }, r2.prototype._build = function(t2, i3, n3, r3) {
        var e2, h3 = n3 - i3 + 1, o3 = this._maxEntries;
        if (h3 <= o3) {
          return a3(e2 = p2(t2.slice(i3, n3 + 1)), this.toBBox), e2;
        }
        r3 || (r3 = Math.ceil(Math.log(h3) / Math.log(o3)), o3 = Math.ceil(h3 / Math.pow(o3, r3 - 1)));
        (e2 = p2([])).leaf = !1;
        e2.height = r3;
        h3 = Math.ceil(h3 / o3);
        o3 = h3 * Math.ceil(Math.sqrt(o3));
        for (d2(t2, i3, n3, o3, this.compareMinX); i3 <= n3; i3 += o3) {
          var u3 = Math.min(i3 + o3 - 1, n3);
          d2(t2, i3, u3, h3, this.compareMinY);
          for (var m3 = i3; m3 <= u3; m3 += h3) {
            e2.children.push(this._build(t2, m3, Math.min(m3 + h3 - 1, u3), r3 - 1));
          }
        }
        return a3(e2, this.toBBox), e2;
      }, r2.prototype._chooseSubtree = function(t2, i3, n3, r3) {
        for (; r3.push(i3), !i3.leaf && r3.length - 1 !== n3;) {
          for (var e2 = 1 / 0, a4 = 1 / 0, h3 = void 0, o3 = 0; o3 < i3.children.length; o3++) {
            var s3 = i3.children[o3], l4 = f2(s3), u3 = (m3 = t2, c3 = s3, (Math.max(c3.maxX, m3.maxX) - Math.min(c3.minX, m3.minX)) * (Math.max(c3.maxY, m3.maxY) - Math.min(c3.minY, m3.minY)) - l4);
            u3 < a4 ? (a4 = u3, e2 = l4 < e2 ? l4 : e2, h3 = s3) : u3 === a4 && l4 < e2 && (e2 = l4, h3 = s3);
          }
          i3 = h3 || i3.children[0];
        }
        var m3, c3;
        return i3;
      }, r2.prototype._insert = function(t2, i3, n3) {
        n3 = n3 ? t2 : this.toBBox(t2);
        var e2 = [], a4 = this._chooseSubtree(n3, this.data, i3, e2);
        a4.children.push(t2);
        for (o2(a4, n3); 0 <= i3 && e2[i3].children.length > this._maxEntries;) {
          this._split(e2, i3), i3--;
        }
        this._adjustParentBBoxes(n3, e2, i3);
      }, r2.prototype._split = function(t2, i3) {
        var n3 = t2[i3], r3 = n3.children.length, e2 = this._minEntries;
        this._chooseSplitAxis(n3, e2, r3);
        r3 = this._chooseSplitIndex(n3, e2, r3);
        r3 = p2(n3.children.splice(r3, n3.children.length - r3));
        r3.height = n3.height;
        r3.leaf = n3.leaf;
        a3(n3, this.toBBox);
        a3(r3, this.toBBox);
        i3 ? t2[i3 - 1].children.push(r3) : this._splitRoot(n3, r3);
      }, r2.prototype._splitRoot = function(t2, i3) {
        this.data = p2([t2, i3]);
        this.data.height = t2.height + 1;
        this.data.leaf = !1;
        a3(this.data, this.toBBox);
      }, r2.prototype._chooseSplitIndex = function(t2, i3, n3) {
        for (var r3, e2, a4, o3, s3, l4, u3, m3 = 1 / 0, c3 = 1 / 0, p3 = i3; p3 <= n3 - i3; p3++) {
          var d3 = h2(t2, 0, p3, this.toBBox), x2 = h2(t2, p3, n3, this.toBBox), v2 = (e2 = d3, a4 = x2, o3 = void 0, s3 = void 0, l4 = void 0, u3 = void 0, o3 = Math.max(e2.minX, a4.minX), s3 = Math.max(e2.minY, a4.minY), l4 = Math.min(e2.maxX, a4.maxX), u3 = Math.min(e2.maxY, a4.maxY), Math.max(0, l4 - o3) * Math.max(0, u3 - s3));
          d3 = f2(d3) + f2(x2);
          v2 < m3 ? (m3 = v2, r3 = p3, c3 = d3 < c3 ? d3 : c3) : v2 === m3 && d3 < c3 && (c3 = d3, r3 = p3);
        }
        return r3 || n3 - i3;
      }, r2.prototype._chooseSplitAxis = function(t2, i3, n3) {
        var r3 = t2.leaf ? this.compareMinX : s2, e2 = t2.leaf ? this.compareMinY : l3;
        this._allDistMargin(t2, i3, n3, r3) < this._allDistMargin(t2, i3, n3, e2) && t2.children.sort(r3);
      }, r2.prototype._allDistMargin = function(t2, i3, n3, r3) {
        t2.children.sort(r3);
        r3 = this.toBBox;
        for (var a4 = h2(t2, 0, i3, r3), s3 = h2(t2, n3 - i3, n3, r3), l4 = u2(a4) + u2(s3), f3 = i3; f3 < n3 - i3; f3++) {
          var m3 = t2.children[f3];
          o2(a4, t2.leaf ? r3(m3) : m3);
          l4 += u2(a4);
        }
        for (n3 = n3 - i3 - 1; n3 >= i3; n3--) {
          a4 = t2.children[n3], o2(s3, t2.leaf ? r3(a4) : a4), l4 += u2(s3);
        }
        return l4;
      }, r2.prototype._adjustParentBBoxes = function(t2, i3, n3) {
        for (; 0 <= n3; n3--) {
          o2(i3[n3], t2);
        }
      }, r2.prototype._condense = function(t2) {
        for (var i3 = t2.length - 1, n3 = void 0; 0 <= i3; i3--) {
          0 === t2[i3].children.length ? 0 < i3 ? (n3 = t2[i3 - 1].children).splice(n3.indexOf(t2[i3]), 1) : this.clear() : a3(t2[i3], this.toBBox);
        }
      }, r2;
    });
  }}), require_fast_deep_equal = __commonJS({["../../node_modules/fast-deep-equal/index.js"](exports, module2) {
    module2.exports = function equal(a3, b3) {
      if (a3 === b3) {
        return !0;
      }
      if (a3 && b3 && "object" == typeof a3 && "object" == typeof b3) {
        if (a3.constructor !== b3.constructor) {
          return !1;
        }
        var i2;
        if (Array.isArray(a3)) {
          var length = a3.length;
          if (length != b3.length) {
            return !1;
          }
          for (i2 = length; 0 !== i2--;) {
            if (!equal(a3[i2], b3[i2])) {
              return !1;
            }
          }
          return !0;
        }
        if (a3.constructor === RegExp) {
          return a3.source === b3.source && a3.flags === b3.flags;
        }
        if (a3.valueOf !== Object.prototype.valueOf) {
          return a3.valueOf() === b3.valueOf();
        }
        if (a3.toString !== Object.prototype.toString) {
          return a3.toString() === b3.toString();
        }
        var keys = Object.keys(a3);
        length = keys.length;
        if (length !== Object.keys(b3).length) {
          return !1;
        }
        for (i2 = length; 0 !== i2--;) {
          if (!Object.prototype.hasOwnProperty.call(b3, keys[i2])) {
            return !1;
          }
        }
        for (i2 = length; 0 !== i2--;) {
          if (length = keys[i2], !equal(a3[length], b3[length])) {
            return !1;
          }
        }
        return !0;
      }
      return a3 !== a3 && b3 !== b3;
    };
  }}), require_cjs = __commonJS({["../../../../node_modules/deepmerge/dist/cjs.js"](exports, module2) {
    function cloneUnlessOtherwiseSpecified(value, options) {
      return !1 !== options.clone && options.isMergeableObject(value) ? deepmerge2(Array.isArray(value) ? [] : {}, value, options) : value;
    }
    function defaultArrayMerge(target, source, options) {
      return target.concat(source).map(function(element) {
        return cloneUnlessOtherwiseSpecified(element, options);
      });
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
        return !1;
      }
    }
    function mergeObject(target, source, options) {
      var destination = {};
      options.isMergeableObject(target) && getKeys(target).forEach(function(key) {
        destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
      });
      getKeys(source).forEach(function(key) {
        if (!propertyIsOnObject(target, key) || Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key)) {
          if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
            if (options.customMerge) {
              var JSCompiler_inline_result = options.customMerge(key);
              JSCompiler_inline_result = "function" === typeof JSCompiler_inline_result ? JSCompiler_inline_result : deepmerge2;
            } else {
              JSCompiler_inline_result = deepmerge2;
            }
            destination[key] = JSCompiler_inline_result(target[key], source[key], options);
          } else {
            destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
          }
        }
      });
      return destination;
    }
    function deepmerge2(target, source, options) {
      options = options || {};
      options.arrayMerge = options.arrayMerge || defaultArrayMerge;
      options.isMergeableObject = options.isMergeableObject || isMergeableObject;
      options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
      var sourceIsArray = Array.isArray(source), targetIsArray = Array.isArray(target);
      return sourceIsArray !== targetIsArray ? cloneUnlessOtherwiseSpecified(source, options) : sourceIsArray ? options.arrayMerge(target, source, options) : mergeObject(target, source, options);
    }
    var isMergeableObject = function(value) {
      var JSCompiler_temp;
      if (JSCompiler_temp = !!value && "object" === typeof value) {
        JSCompiler_temp = Object.prototype.toString.call(value), JSCompiler_temp = !("[object RegExp]" === JSCompiler_temp || "[object Date]" === JSCompiler_temp || value.$$typeof === REACT_ELEMENT_TYPE);
      }
      return JSCompiler_temp;
    }, REACT_ELEMENT_TYPE = "function" === typeof Symbol && Symbol.for ? Symbol.for("react.element") : 60103;
    deepmerge2.all = function(array2, options) {
      if (!Array.isArray(array2)) {
        throw Error("first argument should be an array");
      }
      return array2.reduce(function(prev, next) {
        return deepmerge2(prev, next, options);
      }, {});
    };
    module2.exports = deepmerge2;
  }}), src_exports = {};
  ((target, all) => {
    for (var name in all) {
      __defProp(target, name, {get:all[name], enumerable:!0});
    }
  })(src_exports, {App:() => App3, PreviewManager:() => PreviewManager, generateJSXFromModel:() => generateJSXFromModel, generateSVGFromModel:() => generateSVGFromModel});
  module.exports = (mod => __copyProps(__defProp({}, "__esModule", {value:!0}), mod))(src_exports);
  var Color = (Color2 => {
    Color2.Yellow = "yellow";
    Color2.Red = "red";
    Color2.Pink = "pink";
    Color2.Green = "green";
    Color2.Blue = "blue";
    Color2.Purple = "purple";
    Color2.Gray = "gray";
    Color2.Default = "";
    return Color2;
  })(Color || {}), Geometry = (Geometry2 => {
    Geometry2.Box = "box";
    Geometry2.Ellipse = "ellipse";
    Geometry2.Polygon = "polygon";
    return Geometry2;
  })(Geometry || {}), getRandomValues, rnds8 = new Uint8Array(16), regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i, byteToHex = [];
  for (let i2 = 0; 256 > i2; ++i2) {
    byteToHex.push((i2 + 256).toString(16).slice(1));
  }
  var _nodeId, _clockseq, _lastMSecs = 0, _lastNSecs = 0, v1_default = function(options, buf, offset) {
    offset = buf && offset || 0;
    const b3 = buf || Array(16);
    options = options || {};
    let node = options.node || _nodeId;
    var clockseq = void 0 !== options.clockseq ? options.clockseq : _clockseq;
    if (null == node || null == clockseq) {
      var seedBytes = options.random || (options.rng || rng)();
      null == node && (node = _nodeId = [seedBytes[0] | 1, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]]);
      null == clockseq && (clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383);
    }
    seedBytes = void 0 !== options.msecs ? options.msecs : Date.now();
    let nsecs = void 0 !== options.nsecs ? options.nsecs : _lastNSecs + 1;
    const dt2 = seedBytes - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
    0 > dt2 && void 0 === options.clockseq && (clockseq = clockseq + 1 & 16383);
    (0 > dt2 || seedBytes > _lastMSecs) && void 0 === options.nsecs && (nsecs = 0);
    if (1e4 <= nsecs) {
      throw Error("uuid.v1(): Can't create more than 10M uuids/sec");
    }
    _lastMSecs = seedBytes;
    _lastNSecs = nsecs;
    _clockseq = clockseq;
    seedBytes += 122192928e5;
    options = (1e4 * (seedBytes & 268435455) + nsecs) % 4294967296;
    b3[offset++] = options >>> 24 & 255;
    b3[offset++] = options >>> 16 & 255;
    b3[offset++] = options >>> 8 & 255;
    b3[offset++] = options & 255;
    options = seedBytes / 4294967296 * 1e4 & 268435455;
    b3[offset++] = options >>> 8 & 255;
    b3[offset++] = options & 255;
    b3[offset++] = options >>> 24 & 15 | 16;
    b3[offset++] = options >>> 16 & 255;
    b3[offset++] = clockseq >>> 8 | 128;
    b3[offset++] = clockseq & 255;
    for (clockseq = 0; 6 > clockseq; ++clockseq) {
      b3[offset + clockseq] = node[clockseq];
    }
    return buf || unsafeStringify(b3);
  }, _Vec = class {
    static clamp(n2, min, max) {
      return Math.max(min, "undefined" !== typeof max ? Math.min(n2, max) : n2);
    }
    static clampV(A3, min, max) {
      return A3.map(n2 => max ? _Vec.clamp(n2, min, max) : _Vec.clamp(n2, min));
    }
    static cross(x2, y2, z2) {
      return (y2[0] - x2[0]) * (z2[1] - x2[1]) - (z2[0] - x2[0]) * (y2[1] - x2[1]);
    }
    static snap(a3, step = 1) {
      return [Math.round(a3[0] / step) * step, Math.round(a3[1] / step) * step];
    }
  }, Vec = _Vec;
  Vec.neg = A3 => [-A3[0], -A3[1]];
  Vec.add = (A3, B3) => [A3[0] + B3[0], A3[1] + B3[1]];
  Vec.addScalar = (A3, n2) => [A3[0] + n2, A3[1] + n2];
  Vec.sub = (A3, B3) => [A3[0] - B3[0], A3[1] - B3[1]];
  Vec.subScalar = (A3, n2) => [A3[0] - n2, A3[1] - n2];
  Vec.vec = (A3, B3) => [B3[0] - A3[0], B3[1] - A3[1]];
  Vec.mul = (A3, n2) => [A3[0] * n2, A3[1] * n2];
  Vec.mulV = (A3, B3) => [A3[0] * B3[0], A3[1] * B3[1]];
  Vec.div = (A3, n2) => [A3[0] / n2, A3[1] / n2];
  Vec.divV = (A3, B3) => [A3[0] / B3[0], A3[1] / B3[1]];
  Vec.per = A3 => [A3[1], -A3[0]];
  Vec.dpr = (A3, B3) => A3[0] * B3[0] + A3[1] * B3[1];
  Vec.cpr = (A3, B3) => A3[0] * B3[1] - B3[0] * A3[1];
  Vec.len2 = A3 => A3[0] * A3[0] + A3[1] * A3[1];
  Vec.len = A3 => Math.hypot(A3[0], A3[1]);
  Vec.pry = (A3, B3) => _Vec.dpr(A3, B3) / _Vec.len(B3);
  Vec.uni = A3 => _Vec.div(A3, _Vec.len(A3));
  Vec.normalize = A3 => _Vec.uni(A3);
  Vec.tangent = (A3, B3) => _Vec.uni(_Vec.sub(A3, B3));
  Vec.dist2 = (A3, B3) => _Vec.len2(_Vec.sub(A3, B3));
  Vec.dist = (A3, B3) => Math.hypot(A3[1] - B3[1], A3[0] - B3[0]);
  Vec.fastDist = (A3, B3) => {
    A3 = [B3[0] - A3[0], B3[1] - A3[1]];
    B3 = [Math.abs(A3[0]), Math.abs(A3[1])];
    let r2 = 1 / Math.max(B3[0], B3[1]);
    r2 *= 1.29289 - (B3[0] + B3[1]) * r2 * 0.29289;
    return [A3[0] * r2, A3[1] * r2];
  };
  Vec.ang = (A3, B3) => Math.atan2(_Vec.cpr(A3, B3), _Vec.dpr(A3, B3));
  Vec.angle = (A3, B3) => Math.atan2(B3[1] - A3[1], B3[0] - A3[0]);
  Vec.med = (A3, B3) => _Vec.mul(_Vec.add(A3, B3), 0.5);
  Vec.rot = (A3, r2 = 0) => [A3[0] * Math.cos(r2) - A3[1] * Math.sin(r2), A3[0] * Math.sin(r2) + A3[1] * Math.cos(r2)];
  Vec.rotWith = (A3, C3, r2 = 0) => {
    if (0 === r2) {
      return A3;
    }
    const s2 = Math.sin(r2);
    r2 = Math.cos(r2);
    const px = A3[0] - C3[0];
    A3 = A3[1] - C3[1];
    return [px * r2 - A3 * s2 + C3[0], px * s2 + A3 * r2 + C3[1]];
  };
  Vec.isEqual = (A3, B3) => A3[0] === B3[0] && A3[1] === B3[1];
  Vec.lrp = (A3, B3, t) => _Vec.add(A3, _Vec.mul(_Vec.sub(B3, A3), t));
  Vec.int = (A3, B3, from, to, s2 = 1) => {
    from = (_Vec.clamp(from, to) - from) / (to - from);
    return _Vec.add(_Vec.mul(A3, 1 - from), _Vec.mul(B3, s2));
  };
  Vec.ang3 = (p1, pc, p2) => {
    p1 = _Vec.vec(pc, p1);
    pc = _Vec.vec(pc, p2);
    return _Vec.ang(p1, pc);
  };
  Vec.abs = A3 => [Math.abs(A3[0]), Math.abs(A3[1])];
  Vec.rescale = (a3, n2) => {
    const l3 = _Vec.len(a3);
    return [n2 * a3[0] / l3, n2 * a3[1] / l3];
  };
  Vec.isLeft = (p1, pc, p2) => (pc[0] - p1[0]) * (p2[1] - p1[1]) - (p2[0] - p1[0]) * (pc[1] - p1[1]);
  Vec.clockwise = (p1, pc, p2) => 0 < _Vec.isLeft(p1, pc, p2);
  Vec.toFixed = a3 => a3.map(v2 => Math.round(100 * v2) / 100);
  Vec.nearestPointOnLineThroughPoint = (A3, u2, P2) => _Vec.add(A3, _Vec.mul(u2, _Vec.pry(_Vec.sub(P2, A3), u2)));
  Vec.distanceToLineThroughPoint = (A3, u2, P2) => _Vec.dist(P2, _Vec.nearestPointOnLineThroughPoint(A3, u2, P2));
  Vec.nearestPointOnLineSegment = (A3, B3, P2, clamp3 = !0) => {
    const u2 = _Vec.uni(_Vec.sub(B3, A3));
    P2 = _Vec.add(A3, _Vec.mul(u2, _Vec.pry(_Vec.sub(P2, A3), u2)));
    if (clamp3) {
      if (P2[0] < Math.min(A3[0], B3[0])) {
        return A3[0] < B3[0] ? A3 : B3;
      }
      if (P2[0] > Math.max(A3[0], B3[0])) {
        return A3[0] > B3[0] ? A3 : B3;
      }
      if (P2[1] < Math.min(A3[1], B3[1])) {
        return A3[1] < B3[1] ? A3 : B3;
      }
      if (P2[1] > Math.max(A3[1], B3[1])) {
        return A3[1] > B3[1] ? A3 : B3;
      }
    }
    return P2;
  };
  Vec.distanceToLineSegment = (A3, B3, P2, clamp3 = !0) => _Vec.dist(P2, _Vec.nearestPointOnLineSegment(A3, B3, P2, clamp3));
  Vec.nudge = (A3, B3, d2) => _Vec.isEqual(A3, B3) ? A3 : _Vec.add(A3, _Vec.mul(_Vec.uni(_Vec.sub(B3, A3)), d2));
  Vec.nudgeAtAngle = (A3, a3, d2) => [Math.cos(a3) * d2 + A3[0], Math.sin(a3) * d2 + A3[1]];
  Vec.toPrecision = (a3, n2 = 4) => [+a3[0].toPrecision(n2), +a3[1].toPrecision(n2)];
  Vec.pointsBetween = (A3, B3, steps = 6) => Array.from(Array(steps)).map((_2, i2) => {
    _2 = i2 / (steps - 1);
    i2 = Math.min(1, 0.5 + Math.abs(0.5 - _2));
    return [..._Vec.lrp(A3, B3, _2), i2];
  });
  Vec.slope = (A3, B3) => A3[0] === B3[0] ? NaN : (A3[1] - B3[1]) / (A3[0] - B3[0]);
  Vec.toAngle = A3 => {
    A3 = Math.atan2(A3[1], A3[0]);
    return 0 > A3 ? A3 + 2 * Math.PI : A3;
  };
  Vec.max = (...v2) => [Math.max(...v2.map(a3 => a3[0])), Math.max(...v2.map(a3 => a3[1]))];
  Vec.min = (...v2) => [Math.min(...v2.map(a3 => a3[0])), Math.min(...v2.map(a3 => a3[1]))];
  var src_default = Vec, BoundsUtils = class {
    static getRectangleSides(point, size, rotation = 0) {
      const center = [point[0] + size[0] / 2, point[1] + size[1] / 2], tl = Vec.rotWith(point, center, rotation), tr = Vec.rotWith(Vec.add(point, [size[0], 0]), center, rotation), br = Vec.rotWith(Vec.add(point, size), center, rotation);
      point = Vec.rotWith(Vec.add(point, [0, size[1]]), center, rotation);
      return [["top", [tl, tr]], ["right", [tr, br]], ["bottom", [br, point]], ["left", [point, tl]]];
    }
    static getBoundsSides(bounds) {
      return BoundsUtils.getRectangleSides([bounds.minX, bounds.minY], [bounds.width, bounds.height]);
    }
    static expandBounds(bounds, delta) {
      return {minX:bounds.minX - delta, minY:bounds.minY - delta, maxX:bounds.maxX + delta, maxY:bounds.maxY + delta, width:bounds.width + 2 * delta, height:bounds.height + 2 * delta};
    }
    static boundsCollide(a3, b3) {
      return !(a3.maxX < b3.minX || a3.minX > b3.maxX || a3.maxY < b3.minY || a3.minY > b3.maxY);
    }
    static boundsContain(a3, b3) {
      return Array.isArray(b3) ? a3.minX < b3[0] && a3.minY < b3[1] && a3.maxY > b3[1] && a3.maxX > b3[0] : a3.minX < b3.minX && a3.minY < b3.minY && a3.maxY > b3.maxY && a3.maxX > b3.maxX;
    }
    static boundsContained(a3, b3) {
      return BoundsUtils.boundsContain(b3, a3);
    }
    static boundsAreEqual(a3, b3) {
      return !(b3.maxX !== a3.maxX || b3.minX !== a3.minX || b3.maxY !== a3.maxY || b3.minY !== a3.minY);
    }
    static getBoundsFromPoints(points, rotation = 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      if (2 > points.length) {
        minY = minX = 0, maxY = maxX = 1;
      } else {
        for (const point of points) {
          minX = Math.min(point[0], minX), minY = Math.min(point[1], minY), maxX = Math.max(point[0], maxX), maxY = Math.max(point[1], maxY);
        }
      }
      return 0 !== rotation ? BoundsUtils.getBoundsFromPoints(points.map(pt2 => Vec.rotWith(pt2, [(minX + maxX) / 2, (minY + maxY) / 2], rotation))) : {minX, minY, maxX, maxY, width:Math.max(1, maxX - minX), height:Math.max(1, maxY - minY)};
    }
    static centerBounds(bounds, point) {
      const boundsCenter = BoundsUtils.getBoundsCenter(bounds);
      return BoundsUtils.translateBounds(bounds, [point[0] - boundsCenter[0], point[1] - boundsCenter[1]]);
    }
    static snapBoundsToGrid(bounds, gridSize) {
      const minX = Math.round(bounds.minX / gridSize) * gridSize, minY = Math.round(bounds.minY / gridSize) * gridSize, maxX = Math.round(bounds.maxX / gridSize) * gridSize;
      bounds = Math.round(bounds.maxY / gridSize) * gridSize;
      return {minX, minY, maxX, maxY:bounds, width:Math.max(1, maxX - minX), height:Math.max(1, bounds - minY)};
    }
    static translateBounds(bounds, delta) {
      return {minX:bounds.minX + delta[0], minY:bounds.minY + delta[1], maxX:bounds.maxX + delta[0], maxY:bounds.maxY + delta[1], width:bounds.width, height:bounds.height};
    }
    static multiplyBounds(bounds, n2) {
      const center = BoundsUtils.getBoundsCenter(bounds);
      return BoundsUtils.centerBounds({minX:bounds.minX * n2, minY:bounds.minY * n2, maxX:bounds.maxX * n2, maxY:bounds.maxY * n2, width:bounds.width * n2, height:bounds.height * n2}, [center[0] * n2, center[1] * n2]);
    }
    static divideBounds(bounds, n2) {
      const center = BoundsUtils.getBoundsCenter(bounds);
      return BoundsUtils.centerBounds({minX:bounds.minX / n2, minY:bounds.minY / n2, maxX:bounds.maxX / n2, maxY:bounds.maxY / n2, width:bounds.width / n2, height:bounds.height / n2}, [center[0] / n2, center[1] / n2]);
    }
    static getRotatedBounds(bounds, rotation = 0) {
      bounds = BoundsUtils.getRotatedCorners(bounds, rotation);
      let minY = rotation = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const point of bounds) {
        rotation = Math.min(point[0], rotation), minY = Math.min(point[1], minY), maxX = Math.max(point[0], maxX), maxY = Math.max(point[1], maxY);
      }
      return {minX:rotation, minY, maxX, maxY, width:Math.max(1, maxX - rotation), height:Math.max(1, maxY - minY), rotation:0};
    }
    static getRotatedEllipseBounds(x2, y2, rx, ry, rotation = 0) {
      var c2 = Math.cos(rotation);
      const s2 = Math.sin(rotation);
      rotation = Math.hypot(rx * c2, ry * s2);
      c2 = Math.hypot(rx * s2, ry * c2);
      return {minX:x2 + rx - rotation, minY:y2 + ry - c2, maxX:x2 + rx + rotation, maxY:y2 + ry + c2, width:2 * rotation, height:2 * c2};
    }
    static getExpandedBounds(a3, b3) {
      const minX = Math.min(a3.minX, b3.minX), minY = Math.min(a3.minY, b3.minY), maxX = Math.max(a3.maxX, b3.maxX);
      a3 = Math.max(a3.maxY, b3.maxY);
      return {minX, minY, maxX, maxY:a3, width:Math.abs(maxX - minX), height:Math.abs(a3 - minY)};
    }
    static getCommonBounds(bounds) {
      if (2 > bounds.length) {
        return bounds[0];
      }
      let result = bounds[0];
      for (let i2 = 1; i2 < bounds.length; i2++) {
        result = BoundsUtils.getExpandedBounds(result, bounds[i2]);
      }
      return result;
    }
    static getRotatedCorners(b3, rotation = 0) {
      const center = [b3.minX + b3.width / 2, b3.minY + b3.height / 2];
      b3 = [[b3.minX, b3.minY], [b3.maxX, b3.minY], [b3.maxX, b3.maxY], [b3.minX, b3.maxY]];
      return rotation ? b3.map(point => Vec.rotWith(point, center, rotation)) : b3;
    }
    static getTransformedBoundingBox(bounds, handle, delta, rotation = 0, isAspectRatioLocked = !1) {
      const [ax0, ay0] = [bounds.minX, bounds.minY], [ax1, ay1] = [bounds.maxX, bounds.maxY];
      let [bx0, by0] = [bounds.minX, bounds.minY], [bx1, by1] = [bounds.maxX, bounds.maxY];
      if ("center" === handle) {
        return {minX:bx0 + delta[0], minY:by0 + delta[1], maxX:bx1 + delta[0], maxY:by1 + delta[1], width:bx1 - bx0, height:by1 - by0, scaleX:1, scaleY:1};
      }
      const [dx, dy] = Vec.rot(delta, -rotation);
      switch(handle) {
        case "top_edge":
        case "top_left_corner":
        case "top_right_corner":
          by0 += dy;
          break;
        case "bottom_edge":
        case "bottom_left_corner":
        case "bottom_right_corner":
          by1 += dy;
      }
      switch(handle) {
        case "left_edge":
        case "top_left_corner":
        case "bottom_left_corner":
          bx0 += dx;
          break;
        case "right_edge":
        case "top_right_corner":
        case "bottom_right_corner":
          bx1 += dx;
      }
      var aw = ax1 - ax0;
      const ah = ay1 - ay0;
      var scaleX = (bx1 - bx0) / aw, scaleY = (by1 - by0) / ah;
      bounds = 0 > scaleX;
      delta = 0 > scaleY;
      var bw = Math.abs(bx1 - bx0), bh = Math.abs(by1 - by0);
      if (isAspectRatioLocked) {
        switch(isAspectRatioLocked = aw / ah, aw = isAspectRatioLocked < bw / bh, scaleY = 1 / isAspectRatioLocked * (0 > scaleY ? 1 : -1) * bw, scaleX = bh * (0 > scaleX ? 1 : -1) * isAspectRatioLocked, handle) {
          case "top_left_corner":
            aw ? by0 = by1 + scaleY : bx0 = bx1 + scaleX;
            break;
          case "top_right_corner":
            aw ? by0 = by1 + scaleY : bx1 = bx0 - scaleX;
            break;
          case "bottom_right_corner":
            aw ? by1 = by0 - scaleY : bx1 = bx0 - scaleX;
            break;
          case "bottom_left_corner":
            aw ? by1 = by0 - scaleY : bx0 = bx1 + scaleX;
            break;
          case "bottom_edge":
          case "top_edge":
            bw = (bx0 + bx1) / 2;
            bh *= isAspectRatioLocked;
            bx0 = bw - bh / 2;
            bx1 = bw + bh / 2;
            break;
          case "left_edge":
          case "right_edge":
            bh = (by0 + by1) / 2, bw /= isAspectRatioLocked, by0 = bh - bw / 2, by1 = bh + bw / 2;
        }
      }
      if (0 !== rotation % (2 * Math.PI)) {
        bw = [0, 0];
        bh = Vec.med([ax0, ay0], [ax1, ay1]);
        scaleX = Vec.med([bx0, by0], [bx1, by1]);
        switch(handle) {
          case "top_left_corner":
            bw = Vec.sub(Vec.rotWith([bx1, by1], scaleX, rotation), Vec.rotWith([ax1, ay1], bh, rotation));
            break;
          case "top_right_corner":
            bw = Vec.sub(Vec.rotWith([bx0, by1], scaleX, rotation), Vec.rotWith([ax0, ay1], bh, rotation));
            break;
          case "bottom_right_corner":
            bw = Vec.sub(Vec.rotWith([bx0, by0], scaleX, rotation), Vec.rotWith([ax0, ay0], bh, rotation));
            break;
          case "bottom_left_corner":
            bw = Vec.sub(Vec.rotWith([bx1, by0], scaleX, rotation), Vec.rotWith([ax1, ay0], bh, rotation));
            break;
          case "top_edge":
            bw = Vec.sub(Vec.rotWith(Vec.med([bx0, by1], [bx1, by1]), scaleX, rotation), Vec.rotWith(Vec.med([ax0, ay1], [ax1, ay1]), bh, rotation));
            break;
          case "left_edge":
            bw = Vec.sub(Vec.rotWith(Vec.med([bx1, by0], [bx1, by1]), scaleX, rotation), Vec.rotWith(Vec.med([ax1, ay0], [ax1, ay1]), bh, rotation));
            break;
          case "bottom_edge":
            bw = Vec.sub(Vec.rotWith(Vec.med([bx0, by0], [bx1, by0]), scaleX, rotation), Vec.rotWith(Vec.med([ax0, ay0], [ax1, ay0]), bh, rotation));
            break;
          case "right_edge":
            bw = Vec.sub(Vec.rotWith(Vec.med([bx0, by0], [bx0, by1]), scaleX, rotation), Vec.rotWith(Vec.med([ax0, ay0], [ax0, ay1]), bh, rotation));
        }
        [bx0, by0] = Vec.sub([bx0, by0], bw);
        [bx1, by1] = Vec.sub([bx1, by1], bw);
      }
      bx1 < bx0 && ([bx1, bx0] = [bx0, bx1]);
      by1 < by0 && ([by1, by0] = [by0, by1]);
      return {minX:bx0, minY:by0, maxX:bx1, maxY:by1, width:bx1 - bx0, height:by1 - by0, scaleX:(bx1 - bx0) / (ax1 - ax0 || 1) * (bounds ? -1 : 1), scaleY:(by1 - by0) / (ay1 - ay0 || 1) * (delta ? -1 : 1)};
    }
    static getTransformAnchor(type, isFlippedX, isFlippedY) {
      let anchor = type;
      switch(type) {
        case "top_left_corner":
          anchor = isFlippedX && isFlippedY ? "bottom_right_corner" : isFlippedX ? "top_right_corner" : isFlippedY ? "bottom_left_corner" : "bottom_right_corner";
          break;
        case "top_right_corner":
          anchor = isFlippedX && isFlippedY ? "bottom_left_corner" : isFlippedX ? "top_left_corner" : isFlippedY ? "bottom_right_corner" : "bottom_left_corner";
          break;
        case "bottom_right_corner":
          anchor = isFlippedX && isFlippedY ? "top_left_corner" : isFlippedX ? "bottom_left_corner" : isFlippedY ? "top_right_corner" : "top_left_corner";
          break;
        case "bottom_left_corner":
          anchor = isFlippedX && isFlippedY ? "top_right_corner" : isFlippedX ? "bottom_right_corner" : isFlippedY ? "top_left_corner" : "top_right_corner";
      }
      return anchor;
    }
    static getRelativeTransformedBoundingBox(bounds, initialBounds, initialShapeBounds, isFlippedX, isFlippedY) {
      isFlippedX = bounds.minX + (isFlippedX ? initialBounds.maxX - initialShapeBounds.maxX : initialShapeBounds.minX - initialBounds.minX) / initialBounds.width * bounds.width;
      isFlippedY = bounds.minY + (isFlippedY ? initialBounds.maxY - initialShapeBounds.maxY : initialShapeBounds.minY - initialBounds.minY) / initialBounds.height * bounds.height;
      const width = initialShapeBounds.width / initialBounds.width * bounds.width;
      bounds = initialShapeBounds.height / initialBounds.height * bounds.height;
      return {minX:isFlippedX, minY:isFlippedY, maxX:isFlippedX + width, maxY:isFlippedY + bounds, width, height:bounds};
    }
    static getRotatedSize(size, rotation) {
      const center = Vec.div(size, 2);
      size = [[0, 0], [size[0], 0], size, [0, size[1]]].map(point => Vec.rotWith(point, center, rotation));
      size = BoundsUtils.getBoundsFromPoints(size);
      return [size.width, size.height];
    }
    static getBoundsCenter(bounds) {
      return [bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2];
    }
    static getBoundsWithCenter(bounds) {
      const center = BoundsUtils.getBoundsCenter(bounds);
      return __spreadProps(__spreadValues({}, bounds), {midX:center[0], midY:center[1]});
    }
    static getCommonTopLeft(points) {
      const min = [Infinity, Infinity];
      points.forEach(point => {
        min[0] = Math.min(min[0], point[0]);
        min[1] = Math.min(min[1], point[1]);
      });
      return min;
    }
    static getTLSnapPoints(bounds, others, snapDistance) {
      const A3 = __spreadValues({}, bounds);
      bounds = [0, 0];
      const snapLines = [], snaps = {minX:{id:"minX", isSnapped:!1}, midX:{id:"midX", isSnapped:!1}, maxX:{id:"maxX", isSnapped:!1}, minY:{id:"minY", isSnapped:!1}, midY:{id:"midY", isSnapped:!1}, maxY:{id:"maxY", isSnapped:!1}}, xs = ["midX", "minX", "maxX"], ys = ["midY", "minY", "maxY"];
      others = others.map(B3 => {
        const rx = xs.flatMap((f2, i2) => xs.map((t, k2) => {
          const gap = A3[f2] - B3[t];
          return {f:f2, t, gap, distance:Math.abs(gap), isCareful:0 === i2 || 3 === i2 + k2};
        })), ry = ys.flatMap((f2, i2) => ys.map((t, k2) => {
          const gap = A3[f2] - B3[t];
          return {f:f2, t, gap, distance:Math.abs(gap), isCareful:0 === i2 || 3 === i2 + k2};
        }));
        return [B3, rx, ry];
      });
      let gapX = Infinity, gapY = Infinity, minX = Infinity, minY = Infinity;
      others.forEach(([, rx, ry]) => {
        rx.forEach(r2 => {
          r2.distance < snapDistance && r2.distance < minX && (minX = r2.distance, gapX = r2.gap);
        });
        ry.forEach(r2 => {
          r2.distance < snapDistance && r2.distance < minY && (minY = r2.distance, gapY = r2.gap);
        });
      });
      others.forEach(([B3, rx, ry]) => {
        Infinity !== gapX && rx.forEach(r2 => {
          2 > Math.abs(r2.gap - gapX) && (snaps[r2.f] = __spreadProps(__spreadValues({}, snaps[r2.f]), {isSnapped:!0, to:B3[r2.t], B:B3, distance:r2.distance}));
        });
        Infinity !== gapY && ry.forEach(r2 => {
          2 > Math.abs(r2.gap - gapY) && (snaps[r2.f] = __spreadProps(__spreadValues({}, snaps[r2.f]), {isSnapped:!0, to:B3[r2.t], B:B3, distance:r2.distance}));
        });
      });
      bounds[0] = Infinity === gapX ? 0 : gapX;
      bounds[1] = Infinity === gapY ? 0 : gapY;
      A3.minX -= bounds[0];
      A3.midX -= bounds[0];
      A3.maxX -= bounds[0];
      A3.minY -= bounds[1];
      A3.midY -= bounds[1];
      A3.maxY -= bounds[1];
      xs.forEach(from => {
        from = snaps[from];
        if (from.isSnapped) {
          var {id:id3, B:B3} = from;
          from = A3[id3];
          snapLines.push("minX" === id3 ? [[from, A3.midY], [from, B3.minY], [from, B3.maxY]] : [[from, A3.minY], [from, A3.maxY], [from, B3.minY], [from, B3.maxY]]);
        }
      });
      ys.forEach(from => {
        from = snaps[from];
        if (from.isSnapped) {
          var {id:id3, B:B3} = from;
          from = A3[id3];
          snapLines.push("midY" === id3 ? [[A3.midX, from], [B3.minX, from], [B3.maxX, from]] : [[A3.minX, from], [A3.maxX, from], [B3.minX, from], [B3.maxX, from]]);
        }
      });
      return {offset:bounds, snapLines};
    }
    static ensureRatio(bounds, ratio) {
      const {width, height} = bounds, newBounds = __spreadValues({}, bounds);
      width / height < ratio ? (newBounds.width = height * ratio, newBounds.maxX += width - bounds.width) : (newBounds.height = width / ratio, newBounds.maxY += height - bounds.height);
      return newBounds;
    }
    static getDistributions(shapes2, type) {
      var entries = shapes2.map(shape => {
        const bounds = shape.getBounds();
        return {id:shape.id, point:[bounds.minX, bounds.minY], bounds, center:shape.getCenter()};
      });
      shapes2 = entries.length;
      var commonBounds = BoundsUtils.getCommonBounds(entries.map(({bounds}) => bounds));
      const results = [];
      switch(type) {
        case "horizontal":
          type = entries.reduce((a3, c2) => a3 + c2.bounds.width, 0);
          if (type > commonBounds.width) {
            const left = entries.sort((a3, b3) => a3.bounds.minX - b3.bounds.minX)[0], right = entries.sort((a3, b3) => b3.bounds.maxX - a3.bounds.maxX)[0];
            commonBounds = entries.filter(a3 => a3 !== left && a3 !== right).sort((a3, b3) => a3.center[0] - b3.center[0]);
            const step = (right.center[0] - left.center[0]) / (shapes2 - 1), x2 = left.center[0] + step;
            commonBounds.forEach(({id:id3, point, bounds}, i2) => {
              results.push({id:id3, prev:point, next:[x2 + step * i2 - bounds.width / 2, bounds.minY]});
            });
          } else {
            entries = entries.sort((a3, b3) => a3.center[0] - b3.center[0]);
            let x2 = commonBounds.minX;
            const step = (commonBounds.width - type) / (shapes2 - 1);
            entries.forEach(({id:id3, point, bounds}) => {
              results.push({id:id3, prev:point, next:[x2, bounds.minY]});
              x2 += bounds.width + step;
            });
          }
          break;
        case "vertical":
          if (type = entries.reduce((a3, c2) => a3 + c2.bounds.height, 0), type > commonBounds.height) {
            const top = entries.sort((a3, b3) => a3.bounds.minY - b3.bounds.minY)[0], bottom = entries.sort((a3, b3) => b3.bounds.maxY - a3.bounds.maxY)[0];
            commonBounds = entries.filter(a3 => a3 !== top && a3 !== bottom).sort((a3, b3) => a3.center[1] - b3.center[1]);
            const step = (bottom.center[1] - top.center[1]) / (shapes2 - 1), y2 = top.center[1] + step;
            commonBounds.forEach(({id:id3, point, bounds}, i2) => {
              results.push({id:id3, prev:point, next:[bounds.minX, y2 + step * i2 - bounds.height / 2]});
            });
          } else {
            entries = entries.sort((a3, b3) => a3.center[1] - b3.center[1]);
            let y2 = commonBounds.minY;
            const step = (commonBounds.height - type) / (shapes2 - 1);
            entries.forEach(({id:id3, point, bounds}) => {
              results.push({id:id3, prev:point, next:[bounds.minX, y2]});
              y2 += bounds.height + step;
            });
          }
      }
      return results;
    }
    static getPackedDistributions(shapes2) {
      const commonBounds = BoundsUtils.getCommonBounds(shapes2.map(({bounds}) => bounds)), origin = [commonBounds.minX, commonBounds.minY], shapesPosOriginal = Object.fromEntries(shapes2.map(s2 => [s2.id, [s2.bounds.minX, s2.bounds.minY]]));
      shapes2 = shapes2.filter(s2 => {
        var _a3, _b, _c, _d;
        return !((null == (_b = null == (_a3 = s2.props.handles) ? void 0 : _a3.start) ? 0 : _b.bindingId) || (null == (_d = null == (_c = s2.props.handles) ? void 0 : _c.end) ? 0 : _d.bindingId));
      }).map(shape => {
        const bounds = shape.getBounds();
        return {id:shape.id, w:bounds.width + 16, h:bounds.height + 16, x:bounds.minX, y:bounds.minY};
      });
      potpack(shapes2);
      return shapes2.map(({id:id3, x:x2, y:y2}) => ({id:id3, prev:shapesPosOriginal[id3], next:[x2 + origin[0], y2 + origin[1]]}));
    }
  }, _PointUtils = class {
    static pointInCircle(A3, C3, r2) {
      return Vec.dist(A3, C3) <= r2;
    }
    static pointInEllipse(A3, C3, rx, ry, rotation = 0) {
      rotation = rotation || 0;
      var cos = Math.cos(rotation);
      rotation = Math.sin(rotation);
      C3 = Vec.sub(A3, C3);
      A3 = cos * C3[0] + rotation * C3[1];
      cos = rotation * C3[0] - cos * C3[1];
      return 1 >= A3 * A3 / (rx * rx) + cos * cos / (ry * ry);
    }
    static pointInRect(point, size) {
      return !(point[0] < size[0] || point[0] > point[0] + size[0] || point[1] < size[1] || point[1] > point[1] + size[1]);
    }
    static pointInPolygon(p2, points) {
      let wn = 0;
      points.forEach((a3, i2) => {
        i2 = points[(i2 + 1) % points.length];
        a3[1] <= p2[1] ? i2[1] > p2[1] && 0 < Vec.cross(a3, i2, p2) && (wn += 1) : i2[1] <= p2[1] && 0 > Vec.cross(a3, i2, p2) && --wn;
      });
      return 0 !== wn;
    }
    static pointInBounds(A3, b3) {
      return !(A3[0] < b3.minX || A3[0] > b3.maxX || A3[1] < b3.minY || A3[1] > b3.maxY);
    }
    static pointInPolyline(A3, points, distance = 3) {
      for (let i2 = 1; i2 < points.length; i2++) {
        if (Vec.distanceToLineSegment(points[i2 - 1], points[i2], A3) < distance) {
          return !0;
        }
      }
      return !1;
    }
    static _getSqSegDist(p2, p1, p22) {
      let x2 = p1[0];
      p1 = p1[1];
      let dx = p22[0] - x2, dy = p22[1] - p1;
      if (0 !== dx || 0 !== dy) {
        const t = ((p2[0] - x2) * dx + (p2[1] - p1) * dy) / (dx * dx + dy * dy);
        1 < t ? (x2 = p22[0], p1 = p22[1]) : 0 < t && (x2 += dx * t, p1 += dy * t);
      }
      dx = p2[0] - x2;
      dy = p2[1] - p1;
      return dx * dx + dy * dy;
    }
    static _simplifyStep(points, first, last, sqTolerance, result) {
      let maxSqDist = sqTolerance, index2 = -1;
      for (let i2 = first + 1; i2 < last; i2++) {
        const sqDist = _PointUtils._getSqSegDist(points[i2], points[first], points[last]);
        sqDist > maxSqDist && (index2 = i2, maxSqDist = sqDist);
      }
      -1 < index2 && maxSqDist > sqTolerance && (1 < index2 - first && _PointUtils._simplifyStep(points, first, index2, sqTolerance, result), result.push(points[index2]), 1 < last - index2 && _PointUtils._simplifyStep(points, index2, last, sqTolerance, result));
    }
    static simplify2(points, tolerance = 1) {
      if (2 >= points.length) {
        return points;
      }
      tolerance *= tolerance;
      var A3 = points[0], B3 = points[1];
      const newPoints = [A3];
      for (let i2 = 1, len = points.length; i2 < len; i2++) {
        B3 = points[i2], (B3[0] - A3[0]) * (B3[0] - A3[0]) + (B3[1] - A3[1]) * (B3[1] - A3[1]) > tolerance && (newPoints.push(B3), A3 = B3);
      }
      A3 !== B3 && newPoints.push(B3);
      A3 = newPoints.length - 1;
      B3 = [newPoints[0]];
      _PointUtils._simplifyStep(newPoints, 0, A3, tolerance, B3);
      B3.push(newPoints[A3], points[points.length - 1]);
      return B3;
    }
    static pointNearToPolyline(point, points, distance = 8) {
      const len = points.length;
      for (let i2 = 1; i2 < len; i2++) {
        if (Vec.distanceToLineSegment(points[i2 - 1], points[i2], point) < distance) {
          return !0;
        }
      }
      return !1;
    }
  }, PointUtils = _PointUtils;
  __publicField(PointUtils, "simplify", (points, tolerance = 1) => {
    var len = points.length;
    const a3 = points[0], b3 = points[len - 1], [x1, y1] = a3, [x2, y2] = b3;
    if (2 < len) {
      let distance = 0, index2 = 0;
      const max = Vec.len2([y2 - y1, x2 - x1]);
      for (let i2 = 1; i2 < len - 1; i2++) {
        const [x0, y0] = points[i2], d2 = Math.pow(x0 * (y2 - y1) + x1 * (y0 - y2) + x2 * (y1 - y0), 2) / max;
        distance > d2 || (distance = d2, index2 = i2);
      }
      if (distance > tolerance) {
        return len = _PointUtils.simplify(points.slice(0, index2 + 1), tolerance), points = _PointUtils.simplify(points.slice(index2 + 1), tolerance), len.concat(points.slice(1));
      }
    }
    return [a3, b3];
  });
  var PI = Math.PI, TAU = PI / 2, PI2 = 2 * PI, EMPTY_OBJECT = {}, CURSORS = {bottom_edge:"ns-resize", top_edge:"ns-resize", left_edge:"ew-resize", right_edge:"ew-resize", bottom_left_corner:"nesw-resize", bottom_right_corner:"nwse-resize", top_left_corner:"nwse-resize", top_right_corner:"nesw-resize", bottom_left_resize_corner:"swne-rotate", bottom_right_resize_corner:"senw-rotate", top_left_resize_corner:"nwse-rotate", top_right_resize_corner:"nesw-rotate", rotate:"rotate", center:"grab", background:"grab"}, 
  GeomUtils = class {
    static circleFromThreePoints(A3, B3, C3) {
      const [x1, y1] = A3, [x2, y2] = B3, [x3, y3] = C3;
      B3 = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
      A3 = -((x1 * x1 + y1 * y1) * (y3 - y2) + (x2 * x2 + y2 * y2) * (y1 - y3) + (x3 * x3 + y3 * y3) * (y2 - y1)) / (2 * B3);
      B3 = -((x1 * x1 + y1 * y1) * (x2 - x3) + (x2 * x2 + y2 * y2) * (x3 - x1) + (x3 * x3 + y3 * y3) * (x1 - x2)) / (2 * B3);
      return [A3, B3, Math.hypot(A3 - x1, B3 - y1)];
    }
    static perimeterOfEllipse(rx, ry) {
      const h2 = Math.pow(rx - ry, 2) / Math.pow(rx + ry, 2);
      return PI * (rx + ry) * (1 + 3 * h2 / (10 + Math.sqrt(4 - 3 * h2)));
    }
    static shortAngleDist(a0, a1) {
      a0 = (a1 - a0) % PI2;
      return 2 * a0 % PI2 - a0;
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
      segments = PI2 / segments;
      r2 = Math.floor((GeomUtils.clampRadians(r2) + segments / 2) / segments) * segments % PI2;
      r2 < PI && (r2 += PI2);
      r2 > PI && (r2 -= PI2);
      return r2;
    }
    static isAngleBetween(a3, b3, c2) {
      if (c2 === a3 || c2 === b3) {
        return !0;
      }
      b3 = (b3 - a3 + TAU) % TAU;
      return b3 <= PI !== (c2 - a3 + TAU) % TAU > b3;
    }
    static degreesToRadians(d2) {
      return d2 * PI / 180;
    }
    static radiansToDegrees(r2) {
      return 180 * r2 / PI;
    }
    static getArcLength(C3, r2, A3, B3) {
      C3 = GeomUtils.getSweep(C3, A3, B3);
      return C3 / PI2 * PI2 * r2;
    }
    static getSweepFlag(A3, B3, C3) {
      C3 = src_default.angle(A3, C3);
      return 0 < (src_default.angle(A3, B3) - C3 + 3 * PI) % PI2 - PI ? 0 : 1;
    }
    static getLargeArcFlag(A3, C3, P2) {
      A3 = src_default.angle(P2, A3);
      C3 = (src_default.angle(P2, C3) - A3 + 3 * PI) % PI2 - PI;
      return Math.abs(C3) > TAU ? 0 : 1;
    }
    static getArcDashOffset(C3, r2, A3, B3, step) {
      const del0 = GeomUtils.getSweepFlag(C3, A3, B3);
      r2 = GeomUtils.getArcLength(C3, r2, A3, B3);
      return -(0 > del0 ? r2 : PI2 * C3[2] - r2) / 2 + step;
    }
    static getEllipseDashOffset(A3, step) {
      return -(PI2 * A3[2]) / 2 + -step;
    }
    static radiansToCardinalDirection(radians) {
      return radians < 0.25 * Math.PI ? "north" : radians < 0.75 * Math.PI ? "east" : radians < 1.25 * Math.PI ? "south" : radians < 1.75 * Math.PI ? "west" : "north";
    }
  }, _PolygonUtils = class {
    static getPolygonCentroid(points) {
      var x2 = points.map(point => point[0]);
      points = points.map(point => point[1]);
      x2 = Math.min(...x2) + Math.max(...x2);
      points = Math.min(...points) + Math.max(...points);
      return [x2 ? x2 / 2 : 0, points ? points / 2 : 0];
    }
  };
  __publicField(_PolygonUtils, "getEdges", points => {
    const len = points.length;
    return points.map((point, i2) => [point, points[(i2 + 1) % len]]);
  });
  __publicField(_PolygonUtils, "getEdgeOutwardNormal", (A3, B3) => src_default.per(src_default.uni(src_default.sub(B3, A3))));
  __publicField(_PolygonUtils, "getEdgeInwardNormal", (A3, B3) => src_default.neg(_PolygonUtils.getEdgeOutwardNormal(A3, B3)));
  __publicField(_PolygonUtils, "getOffsetEdge", (A3, B3, offset) => {
    offset = src_default.mul(src_default.per(src_default.uni(src_default.sub(B3, A3))), offset);
    return [src_default.add(A3, offset), src_default.add(B3, offset)];
  });
  __publicField(_PolygonUtils, "getOffsetEdges", (edges, offset) => edges.map(([A3, B3]) => _PolygonUtils.getOffsetEdge(A3, B3, offset)));
  __publicField(_PolygonUtils, "getOffsetPolygon", (points, offset) => {
    if (1 > points.length) {
      throw Error("Expected at least one point.");
    }
    if (1 === points.length) {
      return points = points[0], [src_default.add(points, [-offset, -offset]), src_default.add(points, [offset, -offset]), src_default.add(points, [offset, offset]), src_default.add(points, [-offset, offset])];
    }
    if (2 === points.length) {
      const [A3, B3] = points;
      return [..._PolygonUtils.getOffsetEdge(A3, B3, offset), ..._PolygonUtils.getOffsetEdge(B3, A3, offset)];
    }
    return _PolygonUtils.getOffsetEdges(_PolygonUtils.getEdges(points), offset).flatMap((edge, i2, edges) => {
      {
        i2 = edges[(i2 + 1) % edges.length];
        const slopeAB = Vec.slope(edge[0], edge[1]);
        edges = Vec.slope(i2[0], i2[1]);
        slopeAB !== edges ? Number.isNaN(slopeAB) && !Number.isNaN(edges) ? edge = [edge[0][0], (edge[0][0] - i2[0][0]) * edges + i2[0][1]] : Number.isNaN(edges) && !Number.isNaN(slopeAB) ? edge = [i2[0][0], (i2[0][0] - edge[0][0]) * slopeAB + edge[0][1]] : (edge = (slopeAB * edge[0][0] - edges * i2[0][0] + i2[0][1] - edge[0][1]) / (slopeAB - edges), edge = [edge, edges * (edge - i2[0][0]) + i2[0][1]]) : edge = void 0;
      }
      if (void 0 === edge) {
        throw Error("Expected an intersection");
      }
      return edge;
    });
  });
  __publicField(_PolygonUtils, "getPolygonVertices", (size, sides, padding = 0, ratio = 1) => {
    size = src_default.div(size, 2);
    const [rx, ry] = [Math.max(1, size[0] - padding), Math.max(1, size[1] - padding)];
    padding = [];
    for (let i2 = 0, step = PI2 / sides; i2 < sides; i2++) {
      var t1 = (-TAU + i2 * step) % PI2, t2 = (-TAU + (i2 + 1) * step) % PI2;
      t1 = src_default.add(size, [rx * Math.cos(t1), ry * Math.sin(t1)]);
      t2 = src_default.add(size, [rx * Math.cos(t2), ry * Math.sin(t2)]);
      var mid = src_default.med(t1, t2);
      mid = src_default.nudge(mid, size, src_default.dist(size, mid) * (1 - ratio));
      padding.push(t1, mid, t2);
    }
    return padding;
  });
  __publicField(_PolygonUtils, "getTriangleVertices", (size, padding = 0, ratio = 1) => {
    const [w2, h2] = size;
    var r2 = 1 - ratio;
    size = [w2 / 2, padding / 2];
    ratio = [w2 - padding, h2 - padding];
    padding = [padding / 2, h2 - padding];
    const centroid = _PolygonUtils.getPolygonCentroid([size, ratio, padding]), AB = src_default.med(size, ratio), BC = src_default.med(ratio, padding), CA = src_default.med(padding, size), dAB = src_default.dist(AB, centroid) * r2, dBC = src_default.dist(BC, centroid) * r2;
    r2 *= src_default.dist(CA, centroid);
    return [size, dAB ? src_default.nudge(AB, centroid, dAB) : AB, ratio, dBC ? src_default.nudge(BC, centroid, dBC) : BC, padding, r2 ? src_default.nudge(CA, centroid, r2) : CA];
  });
  __publicField(_PolygonUtils, "getStarVertices", (center, size, sides, ratio = 1) => {
    const outer = src_default.div(size, 2), inner = src_default.mul(outer, ratio / 2), step = PI2 / sides / 2;
    return Array.from(Array(2 * sides)).map((_2, i2) => {
      _2 = -TAU + i2 * step;
      const [rx, ry] = i2 % 2 ? inner : outer;
      return src_default.add(center, [rx * Math.cos(_2), ry * Math.sin(_2)]);
    });
  });
  var SvgPathUtils = class {
    static getCurvedPathForPolygon(points) {
      if (3 > points.length) {
        return "M -4, 0\n      a 4,4 0 1,0 8,0\n      a 4,4 0 1,0 -8,0";
      }
      const d2 = ["M", ...points[0].slice(0, 2), "Q"], len = points.length;
      for (let i2 = 1; i2 < len; i2++) {
        const [x0, y0] = points[i2], [x1, y1] = points[(i2 + 1) % len];
        d2.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      }
      d2.push("Z");
      return d2.join(" ");
    }
    static getCurvedPathForPoints(points) {
      if (3 > points.length) {
        return "M -4, 0\n      a 4,4 0 1,0 8,0\n      a 4,4 0 1,0 -8,0";
      }
      const d2 = ["M", ...points[0].slice(0, 2), "Q"], len = points.length;
      for (let i2 = 1; i2 < len - 1; i2++) {
        const [x0, y0] = points[i2], [x1, y1] = points[i2 + 1];
        d2.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      }
      return d2.join(" ");
    }
    static getSvgPathFromStroke(points, closed = !0) {
      const len = points.length;
      if (4 > len) {
        return "";
      }
      let a3 = points[0], b3 = points[1];
      var c2 = points[2];
      c2 = `M${a3[0].toFixed(2)},${a3[1].toFixed(2)} Q${b3[0].toFixed(2)},${b3[1].toFixed(2)} ${((b3[0] + c2[0]) / 2).toFixed(2)},${((b3[1] + c2[1]) / 2).toFixed(2)} T`;
      for (let i2 = 2, max = len - 1; i2 < max; i2++) {
        a3 = points[i2], b3 = points[i2 + 1], c2 += `${((a3[0] + b3[0]) / 2).toFixed(2)},${((a3[1] + b3[1]) / 2).toFixed(2)} `;
      }
      closed && (c2 += "Z");
      return c2;
    }
    static getSvgPathFromStrokePoints(points, closed = !1) {
      const len = points.length;
      if (4 > len) {
        return "";
      }
      let a3 = points[0].point, b3 = points[1].point;
      var c2 = points[2].point;
      c2 = `M${a3[0].toFixed(2)},${a3[1].toFixed(2)} Q${b3[0].toFixed(2)},${b3[1].toFixed(2)} ${((b3[0] + c2[0]) / 2).toFixed(2)},${((b3[1] + c2[1]) / 2).toFixed(2)} T`;
      for (let i2 = 2, max = len - 1; i2 < max; i2++) {
        a3 = points[i2].point, b3 = points[i2 + 1].point, c2 += `${((a3[0] + b3[0]) / 2).toFixed(2)},${((a3[1] + b3[1]) / 2).toFixed(2)} `;
      }
      closed && (c2 += "Z");
      return c2;
    }
  };
  __publicField(SvgPathUtils, "TRIM_NUMBERS", /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g);
  var mockGlobal = {}, assign = Object.assign, getDescriptor = Object.getOwnPropertyDescriptor, defineProperty = Object.defineProperty, objectPrototype = Object.prototype, EMPTY_ARRAY = [];
  Object.freeze(EMPTY_ARRAY);
  var EMPTY_OBJECT2 = {};
  Object.freeze(EMPTY_OBJECT2);
  var hasProxy = "undefined" !== typeof Proxy, plainObjectString = Object.toString(), noop = function() {
  }, hasGetOwnPropertySymbols = "undefined" !== typeof Object.getOwnPropertySymbols, ownKeys = "undefined" !== typeof Reflect && Reflect.ownKeys ? Reflect.ownKeys : hasGetOwnPropertySymbols ? function(obj) {
    return Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj));
  } : Object.getOwnPropertyNames, getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function(target) {
    var res = {};
    ownKeys(target).forEach(function(key) {
      res[key] = getDescriptor(target, key);
    });
    return res;
  }, storedAnnotationsSymbol = Symbol("mobx-stored-annotations"), $mobx = Symbol("mobx administration"), Atom = function() {
    function Atom2(name_) {
      void 0 === name_ && (name_ = "Atom");
      this.name_ = void 0;
      this.isBeingObserved_ = this.isPendingUnobservation_ = !1;
      this.observers_ = new Set();
      this.lastAccessedBy_ = this.diffValue_ = 0;
      this.lowestObserverState_ = IDerivationState_.NOT_TRACKING_;
      this.onBUOL = this.onBOL = void 0;
      this.name_ = name_;
    }
    var _proto = Atom2.prototype;
    _proto.onBO = function() {
      this.onBOL && this.onBOL.forEach(function(listener) {
        return listener();
      });
    };
    _proto.onBUO = function() {
      this.onBUOL && this.onBUOL.forEach(function(listener) {
        return listener();
      });
    };
    _proto.reportObserved = function() {
      return reportObserved(this);
    };
    _proto.reportChanged = function() {
      startBatch();
      propagateChanged(this);
      endBatch();
    };
    _proto.toString = function() {
      return this.name_;
    };
    return Atom2;
  }(), isAtom = createInstanceofPredicate("Atom", Atom), comparer = {identity:function(a3, b3) {
    return a3 === b3;
  }, structural:function(a3, b3) {
    return deepEqual(a3, b3);
  }, "default":function(a3, b3) {
    return Object.is ? Object.is(a3, b3) : a3 === b3 ? 0 !== a3 || 1 / a3 === 1 / b3 : a3 !== a3 && b3 !== b3;
  }, shallow:function(a3, b3) {
    return deepEqual(a3, b3, 1);
  }}, OVERRIDE = "override", autoAnnotation = createAutoAnnotation(), defaultCreateObservableOptions = {deep:!0, name:void 0, defaultDecorator:void 0, proxy:!0};
  Object.freeze(defaultCreateObservableOptions);
  var observableAnnotation = createObservableAnnotation("observable"), observableRefAnnotation = createObservableAnnotation("observable.ref", {enhancer:referenceEnhancer}), observableShallowAnnotation = createObservableAnnotation("observable.shallow", {enhancer:function(v2, _2, name) {
    if (void 0 === v2 || null === v2 || isObservableObject(v2) || isObservableArray(v2) || isObservableMap(v2) || isObservableSet(v2)) {
      return v2;
    }
    if (Array.isArray(v2)) {
      return observable.array(v2, {name, deep:!1});
    }
    if (isPlainObject(v2)) {
      return observable.object(v2, void 0, {name, deep:!1});
    }
    if (isES6Map(v2)) {
      return observable.map(v2, {name, deep:!1});
    }
    if (isES6Set(v2)) {
      return observable.set(v2, {name, deep:!1});
    }
  }}), observableStructAnnotation = createObservableAnnotation("observable.struct", {enhancer:function(v2, oldValue) {
    return deepEqual(v2, oldValue) ? oldValue : v2;
  }}), observableDecoratorAnnotation = createDecoratorAnnotation(observableAnnotation);
  Object.assign(createObservable, observableDecoratorAnnotation);
  var observableFactories = {box:function(value, options) {
    options = options || defaultCreateObservableOptions;
    return new ObservableValue(value, getEnhancerFromOptions(options), options.name, !0, options.equals);
  }, array:function(initialValues, options) {
    options = options || defaultCreateObservableOptions;
    return (!1 === globalState.useProxies || !1 === options.proxy ? createLegacyArray : createObservableArray)(initialValues, getEnhancerFromOptions(options), options.name);
  }, map:function(initialValues, options) {
    options = options || defaultCreateObservableOptions;
    return new ObservableMap(initialValues, getEnhancerFromOptions(options), options.name);
  }, set:function(initialValues, options) {
    options = options || defaultCreateObservableOptions;
    return new ObservableSet(initialValues, getEnhancerFromOptions(options), options.name);
  }, object:function(props, decorators, options) {
    if (!1 === globalState.useProxies || !1 === (null == options ? void 0 : options.proxy)) {
      options = asObservableObject({}, options);
    } else {
      var target = {}, _target$$mobx, _target$$mobx$proxy_;
      assertProxies();
      target = asObservableObject(target, options);
      options = null != (_target$$mobx$proxy_ = (_target$$mobx = target[$mobx]).proxy_) ? _target$$mobx$proxy_ : _target$$mobx.proxy_ = new Proxy(target, objectProxyTraps);
    }
    return extendObservable(options, props, decorators);
  }, ref:createDecoratorAnnotation(observableRefAnnotation), shallow:createDecoratorAnnotation(observableShallowAnnotation), deep:observableDecoratorAnnotation, struct:createDecoratorAnnotation(observableStructAnnotation)}, observable = assign(createObservable, observableFactories), computedAnnotation = createComputedAnnotation("computed"), computedStructAnnotation = createComputedAnnotation("computed.struct", {equals:comparer.structural}), computed = function(arg1, arg2) {
    if (isStringish(arg2)) {
      return storeAnnotation(arg1, arg2, computedAnnotation);
    }
    if (isPlainObject(arg1)) {
      return createDecoratorAnnotation(createComputedAnnotation("computed", arg1));
    }
    arg2 = isPlainObject(arg2) ? arg2 : {};
    arg2.get = arg1;
    arg2.name || (arg2.name = arg1.name || "");
    return new ComputedValue(arg2);
  };
  Object.assign(computed, computedAnnotation);
  computed.struct = createDecoratorAnnotation(computedStructAnnotation);
  var _getDescriptor$config, _getDescriptor, currentActionId = 0, nextActionId = 1, isFunctionNameConfigurable = null != (_getDescriptor$config = null == (_getDescriptor = getDescriptor(function() {
  }, "name")) ? void 0 : _getDescriptor.configurable) ? _getDescriptor$config : !1, tmpNameDescriptor = {value:"action", configurable:!0, writable:!1, enumerable:!1};
  var _Symbol$toPrimitive = Symbol.toPrimitive;
  var ObservableValue = function(_Atom) {
    function ObservableValue2(value, enhancer, name_, notifySpy, equals) {
      void 0 === name_ && (name_ = "ObservableValue");
      void 0 === equals && (equals = comparer["default"]);
      notifySpy = _Atom.call(this, name_) || this;
      notifySpy.enhancer = void 0;
      notifySpy.hasUnreportedChange_ = !1;
      notifySpy.interceptors_ = void 0;
      notifySpy.changeListeners_ = void 0;
      notifySpy.value_ = void 0;
      notifySpy.dehancer = void 0;
      notifySpy.enhancer = enhancer;
      notifySpy.name_ = name_;
      notifySpy.equals = equals;
      notifySpy.value_ = enhancer(value, void 0, name_);
      return notifySpy;
    }
    _inheritsLoose(ObservableValue2, _Atom);
    var _proto = ObservableValue2.prototype;
    _proto.dehanceValue = function(value) {
      return void 0 !== this.dehancer ? this.dehancer(value) : value;
    };
    _proto.set = function(newValue) {
      newValue = this.prepareNewValue_(newValue);
      newValue !== globalState.UNCHANGED && this.setNewValue_(newValue);
    };
    _proto.prepareNewValue_ = function(newValue) {
      if (hasInterceptors(this)) {
        newValue = interceptChange(this, {object:this, type:UPDATE, newValue});
        if (!newValue) {
          return globalState.UNCHANGED;
        }
        newValue = newValue.newValue;
      }
      newValue = this.enhancer(newValue, this.value_, this.name_);
      return this.equals(this.value_, newValue) ? globalState.UNCHANGED : newValue;
    };
    _proto.setNewValue_ = function(newValue) {
      var oldValue = this.value_;
      this.value_ = newValue;
      this.reportChanged();
      hasListeners(this) && notifyListeners(this, {type:UPDATE, object:this, newValue, oldValue});
    };
    _proto.get = function() {
      this.reportObserved();
      return this.dehanceValue(this.value_);
    };
    _proto.intercept_ = function(handler) {
      return registerInterceptor(this, handler);
    };
    _proto.observe_ = function(listener, fireImmediately) {
      fireImmediately && listener({observableKind:"value", debugObjectName:this.name_, object:this, type:UPDATE, newValue:this.value_, oldValue:void 0});
      return registerListener(this, listener);
    };
    _proto.raw = function() {
      return this.value_;
    };
    _proto.toJSON = function() {
      return this.get();
    };
    _proto.toString = function() {
      return this.name_ + "[" + this.value_ + "]";
    };
    _proto.valueOf = function() {
      return toPrimitive(this.get());
    };
    _proto[_Symbol$toPrimitive] = function() {
      return this.valueOf();
    };
    return ObservableValue2;
  }(Atom), isObservableValue = createInstanceofPredicate("ObservableValue", ObservableValue);
  var _Symbol$toPrimitive$1 = Symbol.toPrimitive;
  var ComputedValue = function() {
    function ComputedValue2(options) {
      this.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
      this.observing_ = [];
      this.newObserving_ = null;
      this.isPendingUnobservation_ = this.isBeingObserved_ = !1;
      this.observers_ = new Set();
      this.lastAccessedBy_ = this.runId_ = this.diffValue_ = 0;
      this.lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
      this.unboundDepsCount_ = 0;
      this.value_ = new CaughtException(null);
      this.triggeredBy_ = this.name_ = void 0;
      this.isRunningSetter_ = this.isComputing_ = !1;
      this.setter_ = this.derivation = void 0;
      this.isTracing_ = TraceMode.NONE;
      this.onBUOL = this.onBOL = this.keepAlive_ = this.requiresReaction_ = this.equals_ = this.scope_ = void 0;
      options.get || die(31);
      this.derivation = options.get;
      this.name_ = options.name || "ComputedValue";
      options.set && (this.setter_ = createAction("ComputedValue-setter", options.set));
      this.equals_ = options.equals || (options.compareStructural || options.struct ? comparer.structural : comparer["default"]);
      this.scope_ = options.context;
      this.requiresReaction_ = options.requiresReaction;
      this.keepAlive_ = !!options.keepAlive;
    }
    var _proto = ComputedValue2.prototype;
    _proto.onBecomeStale_ = function() {
      propagateMaybeChanged(this);
    };
    _proto.onBO = function() {
      this.onBOL && this.onBOL.forEach(function(listener) {
        return listener();
      });
    };
    _proto.onBUO = function() {
      this.onBUOL && this.onBUOL.forEach(function(listener) {
        return listener();
      });
    };
    _proto.get = function() {
      this.isComputing_ && die(32, this.name_, this.derivation);
      if (0 !== globalState.inBatch || 0 !== this.observers_.size || this.keepAlive_) {
        if (reportObserved(this), shouldCompute(this)) {
          var prevTrackingContext = globalState.trackingContext;
          this.keepAlive_ && !prevTrackingContext && (globalState.trackingContext = this);
          this.trackAndCompute() && propagateChangeConfirmed(this);
          globalState.trackingContext = prevTrackingContext;
        }
      } else {
        shouldCompute(this) && (this.warnAboutUntrackedRead_(), startBatch(), this.value_ = this.computeValue_(!1), endBatch());
      }
      prevTrackingContext = this.value_;
      if (prevTrackingContext instanceof CaughtException) {
        throw prevTrackingContext.cause;
      }
      return prevTrackingContext;
    };
    _proto.set = function(value) {
      if (this.setter_) {
        this.isRunningSetter_ && die(33, this.name_);
        this.isRunningSetter_ = !0;
        try {
          this.setter_.call(this.scope_, value);
        } finally {
          this.isRunningSetter_ = !1;
        }
      } else {
        die(34, this.name_);
      }
    };
    _proto.trackAndCompute = function() {
      var oldValue = this.value_, wasSuspended = this.dependenciesState_ === IDerivationState_.NOT_TRACKING_, newValue = this.computeValue_(!0);
      if (oldValue = wasSuspended || oldValue instanceof CaughtException || newValue instanceof CaughtException || !this.equals_(oldValue, newValue)) {
        this.value_ = newValue;
      }
      return oldValue;
    };
    _proto.computeValue_ = function(track) {
      this.isComputing_ = !0;
      var prev = allowStateChangesStart(!1);
      if (track) {
        var res = trackDerivedFunction(this, this.derivation, this.scope_);
      } else {
        if (!0 === globalState.disableErrorBoundaries) {
          res = this.derivation.call(this.scope_);
        } else {
          try {
            res = this.derivation.call(this.scope_);
          } catch (e) {
            res = new CaughtException(e);
          }
        }
      }
      globalState.allowStateChanges = prev;
      this.isComputing_ = !1;
      return res;
    };
    _proto.suspend_ = function() {
      this.keepAlive_ || (clearObserving(this), this.value_ = void 0);
    };
    _proto.observe_ = function(listener, fireImmediately) {
      var _this = this, firstTime = !0, prevValue = void 0;
      return autorun(function() {
        var newValue = _this.get();
        if (!firstTime || fireImmediately) {
          var prevU = untrackedStart();
          listener({observableKind:"computed", debugObjectName:_this.name_, type:UPDATE, object:_this, newValue, oldValue:prevValue});
          globalState.trackingDerivation = prevU;
        }
        firstTime = !1;
        prevValue = newValue;
      });
    };
    _proto.warnAboutUntrackedRead_ = function() {
    };
    _proto.toString = function() {
      return this.name_ + "[" + this.derivation.toString() + "]";
    };
    _proto.valueOf = function() {
      return toPrimitive(this.get());
    };
    _proto[_Symbol$toPrimitive$1] = function() {
      return this.valueOf();
    };
    return ComputedValue2;
  }(), isComputedValue = createInstanceofPredicate("ComputedValue", ComputedValue), IDerivationState_;
  (function(IDerivationState_2) {
    IDerivationState_2[IDerivationState_2.NOT_TRACKING_ = -1] = "NOT_TRACKING_";
    IDerivationState_2[IDerivationState_2.UP_TO_DATE_ = 0] = "UP_TO_DATE_";
    IDerivationState_2[IDerivationState_2.POSSIBLY_STALE_ = 1] = "POSSIBLY_STALE_";
    IDerivationState_2[IDerivationState_2.STALE_ = 2] = "STALE_";
  })(IDerivationState_ ||= {});
  var TraceMode;
  (function(TraceMode2) {
    TraceMode2[TraceMode2.NONE = 0] = "NONE";
    TraceMode2[TraceMode2.LOG = 1] = "LOG";
    TraceMode2[TraceMode2.BREAK = 2] = "BREAK";
  })(TraceMode ||= {});
  var CaughtException = function(cause) {
    this.cause = void 0;
    this.cause = cause;
  }, MobXGlobals = function() {
    this.version = 6;
    this.UNCHANGED = {};
    this.trackingContext = this.trackingDerivation = null;
    this.inBatch = this.mobxGuid = this.runId = 0;
    this.pendingUnobservations = [];
    this.pendingReactions = [];
    this.allowStateChanges = this.isRunningReactions = !1;
    this.enforceActions = this.allowStateReads = !0;
    this.spyListeners = [];
    this.globalReactionErrorHandlers = [];
    this.suppressReactionErrors = this.disableErrorBoundaries = this.observableRequiresReaction = this.reactionRequiresObservable = this.computedRequiresReaction = !1;
    this.useProxies = !0;
    this.verifyProxies = !1;
    this.safeDescriptors = !0;
  }, canMergeGlobalState = !0, isolateCalled = !1, globalState = function() {
    var global2 = getGlobal();
    0 < global2.__mobxInstanceCount && !global2.__mobxGlobals && (canMergeGlobalState = !1);
    global2.__mobxGlobals && global2.__mobxGlobals.version !== (new MobXGlobals()).version && (canMergeGlobalState = !1);
    if (canMergeGlobalState) {
      if (global2.__mobxGlobals) {
        return global2.__mobxInstanceCount += 1, global2.__mobxGlobals.UNCHANGED || (global2.__mobxGlobals.UNCHANGED = {}), global2.__mobxGlobals;
      }
      global2.__mobxInstanceCount = 1;
      return global2.__mobxGlobals = new MobXGlobals();
    }
    setTimeout(function() {
      isolateCalled || die(35);
    }, 1);
    return new MobXGlobals();
  }(), Reaction = function() {
    function Reaction2(name_, onInvalidate_, errorHandler_, requiresObservable_) {
      void 0 === name_ && (name_ = "Reaction");
      this.requiresObservable_ = this.errorHandler_ = this.onInvalidate_ = this.name_ = void 0;
      this.observing_ = [];
      this.newObserving_ = [];
      this.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
      this.unboundDepsCount_ = this.runId_ = this.diffValue_ = 0;
      this.isRunning_ = this.isTrackPending_ = this.isScheduled_ = this.isDisposed_ = !1;
      this.isTracing_ = TraceMode.NONE;
      this.name_ = name_;
      this.onInvalidate_ = onInvalidate_;
      this.errorHandler_ = errorHandler_;
      this.requiresObservable_ = requiresObservable_;
    }
    var _proto = Reaction2.prototype;
    _proto.onBecomeStale_ = function() {
      this.schedule_();
    };
    _proto.schedule_ = function() {
      this.isScheduled_ || (this.isScheduled_ = !0, globalState.pendingReactions.push(this), 0 < globalState.inBatch || globalState.isRunningReactions || reactionScheduler(runReactionsHelper));
    };
    _proto.isScheduled = function() {
      return this.isScheduled_;
    };
    _proto.runReaction_ = function() {
      if (!this.isDisposed_) {
        startBatch();
        this.isScheduled_ = !1;
        var prev = globalState.trackingContext;
        globalState.trackingContext = this;
        if (shouldCompute(this)) {
          this.isTrackPending_ = !0;
          try {
            this.onInvalidate_();
          } catch (e) {
            this.reportExceptionInDerivation_(e);
          }
        }
        globalState.trackingContext = prev;
        endBatch();
      }
    };
    _proto.track = function(fn) {
      if (!this.isDisposed_) {
        startBatch();
        this.isRunning_ = !0;
        var prevReaction = globalState.trackingContext;
        globalState.trackingContext = this;
        fn = trackDerivedFunction(this, fn, void 0);
        globalState.trackingContext = prevReaction;
        this.isTrackPending_ = this.isRunning_ = !1;
        this.isDisposed_ && clearObserving(this);
        fn instanceof CaughtException && this.reportExceptionInDerivation_(fn.cause);
        endBatch();
      }
    };
    _proto.reportExceptionInDerivation_ = function(error) {
      var _this = this;
      if (this.errorHandler_) {
        this.errorHandler_(error, this);
      } else {
        if (globalState.disableErrorBoundaries) {
          throw error;
        }
        globalState.suppressReactionErrors || console.error("[mobx] uncaught error in '" + this + "'", error);
        globalState.globalReactionErrorHandlers.forEach(function(f2) {
          return f2(error, _this);
        });
      }
    };
    _proto.dispose = function() {
      this.isDisposed_ || (this.isDisposed_ = !0, this.isRunning_ || (startBatch(), clearObserving(this), endBatch()));
    };
    _proto.getDisposer_ = function() {
      var r2 = this.dispose.bind(this);
      r2[$mobx] = this;
      return r2;
    };
    _proto.toString = function() {
      return "Reaction[" + this.name_ + "]";
    };
    _proto.trace = function(enterBreakPoint) {
      void 0 === enterBreakPoint && (enterBreakPoint = !1);
      trace(this, enterBreakPoint);
    };
    return Reaction2;
  }(), MAX_REACTION_ITERATIONS = 100, reactionScheduler = function(f2) {
    return f2();
  }, isReaction = createInstanceofPredicate("Reaction", Reaction), ACTION = "action", actionAnnotation = createActionAnnotation(ACTION), actionBoundAnnotation = createActionAnnotation("action.bound", {bound:!0}), autoActionAnnotation = createActionAnnotation("autoAction", {autoAction:!0}), autoActionBoundAnnotation = createActionAnnotation("autoAction.bound", {autoAction:!0, bound:!0}), action = createActionFactory(!1);
  Object.assign(action, actionAnnotation);
  var autoAction = createActionFactory(!0);
  Object.assign(autoAction, autoActionAnnotation);
  action.bound = createDecoratorAnnotation(actionBoundAnnotation);
  autoAction.bound = createDecoratorAnnotation(autoActionBoundAnnotation);
  var run = function(f2) {
    return f2();
  }, ON_BECOME_OBSERVED = "onBO", ON_BECOME_UNOBSERVED = "onBUO", generatorId = 0;
  FlowCancellationError.prototype = Object.create(Error.prototype);
  var flowAnnotation = createFlowAnnotation("flow"), flowBoundAnnotation = createFlowAnnotation("flow.bound", {bound:!0}), flow = Object.assign(function(arg1, arg2) {
    if (isStringish(arg2)) {
      return storeAnnotation(arg1, arg2, flowAnnotation);
    }
    var name = arg1.name || "\x3cunnamed flow\x3e";
    arg2 = function() {
      var args = arguments, runId = ++generatorId, gen = action(name + " - runid: " + runId + " - init", arg1).apply(this, args), rejector, pendingPromise = void 0;
      args = new Promise(function(resolve, reject) {
        function onFulfilled(res3) {
          pendingPromise = void 0;
          try {
            var ret = action(name + " - runid: " + runId + " - yield " + stepId++, gen.next).call(gen, res3);
          } catch (e) {
            return reject(e);
          }
          next(ret);
        }
        function onRejected(err) {
          pendingPromise = void 0;
          try {
            var ret = action(name + " - runid: " + runId + " - yield " + stepId++, gen["throw"]).call(gen, err);
          } catch (e) {
            return reject(e);
          }
          next(ret);
        }
        function next(ret) {
          if (isFunction(null == ret ? void 0 : ret.then)) {
            ret.then(next, reject);
          } else {
            if (ret.done) {
              return resolve(ret.value);
            }
            pendingPromise = Promise.resolve(ret.value);
            return pendingPromise.then(onFulfilled, onRejected);
          }
        }
        var stepId = 0;
        rejector = reject;
        onFulfilled(void 0);
      });
      args.cancel = action(name + " - runid: " + runId + " - cancel", function() {
        try {
          if (pendingPromise) {
            var promise = pendingPromise;
            isFunction(promise.cancel) && promise.cancel();
          }
          var _res = gen["return"](void 0), yieldedPromise = Promise.resolve(_res.value);
          yieldedPromise.then(noop, noop);
          isFunction(yieldedPromise.cancel) && yieldedPromise.cancel();
          rejector(new FlowCancellationError());
        } catch (e) {
          rejector(e);
        }
      });
      return args;
    };
    arg2.isMobXFlow = !0;
    return arg2;
  }, flowAnnotation);
  flow.bound = createDecoratorAnnotation(flowBoundAnnotation);
  var objectProxyTraps = {has:function(target, name) {
    return target[$mobx].has_(name);
  }, get:function(target, name) {
    return target[$mobx].get_(name);
  }, set:function(target, name, value) {
    var _getAdm$set_;
    return isStringish(name) ? null != (_getAdm$set_ = target[$mobx].set_(name, value, !0)) ? _getAdm$set_ : !0 : !1;
  }, deleteProperty:function(target, name) {
    var _getAdm$delete_;
    return isStringish(name) ? null != (_getAdm$delete_ = target[$mobx].delete_(name, !0)) ? _getAdm$delete_ : !0 : !1;
  }, defineProperty:function(target, name, descriptor) {
    var _getAdm$definePropert;
    return null != (_getAdm$definePropert = target[$mobx].defineProperty_(name, descriptor)) ? _getAdm$definePropert : !0;
  }, ownKeys:function(target) {
    return target[$mobx].ownKeys_();
  }, preventExtensions:function(target) {
    die(13);
  }}, UPDATE = "update", arrayTraps = {get:function(target, name) {
    var adm = target[$mobx];
    return name === $mobx ? adm : "length" === name ? adm.getArrayLength_() : "string" !== typeof name || isNaN(name) ? hasProp(arrayExtensions, name) ? arrayExtensions[name] : target[name] : adm.get_(parseInt(name));
  }, set:function(target, name, value) {
    var adm = target[$mobx];
    "length" === name && adm.setArrayLength_(value);
    "symbol" === typeof name || isNaN(name) ? target[name] = value : adm.set_(parseInt(name), value);
    return !0;
  }, preventExtensions:function() {
    die(15);
  }}, ObservableArrayAdministration = function() {
    function ObservableArrayAdministration2(name, enhancer, owned_, legacyMode_) {
      void 0 === name && (name = "ObservableArray");
      this.atom_ = this.legacyMode_ = this.owned_ = void 0;
      this.values_ = [];
      this.proxy_ = this.dehancer = this.enhancer_ = this.changeListeners_ = this.interceptors_ = void 0;
      this.lastKnownLength_ = 0;
      this.owned_ = owned_;
      this.legacyMode_ = legacyMode_;
      this.atom_ = new Atom(name);
      this.enhancer_ = function(newV, oldV) {
        return enhancer(newV, oldV, "ObservableArray[..]");
      };
    }
    var _proto = ObservableArrayAdministration2.prototype;
    _proto.dehanceValue_ = function(value) {
      return void 0 !== this.dehancer ? this.dehancer(value) : value;
    };
    _proto.dehanceValues_ = function(values) {
      return void 0 !== this.dehancer && 0 < values.length ? values.map(this.dehancer) : values;
    };
    _proto.intercept_ = function(handler) {
      return registerInterceptor(this, handler);
    };
    _proto.observe_ = function(listener, fireImmediately) {
      void 0 === fireImmediately && (fireImmediately = !1);
      fireImmediately && listener({observableKind:"array", object:this.proxy_, debugObjectName:this.atom_.name_, type:"splice", index:0, added:this.values_.slice(), addedCount:this.values_.length, removed:[], removedCount:0});
      return registerListener(this, listener);
    };
    _proto.getArrayLength_ = function() {
      this.atom_.reportObserved();
      return this.values_.length;
    };
    _proto.setArrayLength_ = function(newLength) {
      ("number" !== typeof newLength || isNaN(newLength) || 0 > newLength) && die("Out of range: " + newLength);
      var currentLength = this.values_.length;
      if (newLength !== currentLength) {
        if (newLength > currentLength) {
          for (var newItems = Array(newLength - currentLength), i2 = 0; i2 < newLength - currentLength; i2++) {
            newItems[i2] = void 0;
          }
          this.spliceWithArray_(currentLength, 0, newItems);
        } else {
          this.spliceWithArray_(newLength, currentLength - newLength);
        }
      }
    };
    _proto.updateArrayLength_ = function(oldLength, delta) {
      oldLength !== this.lastKnownLength_ && die(16);
      this.lastKnownLength_ += delta;
      this.legacyMode_ && 0 < delta && reserveArrayBuffer(oldLength + delta + 1);
    };
    _proto.spliceWithArray_ = function(index2, deleteCount, newItems) {
      var _this = this, length = this.values_.length;
      void 0 === index2 ? index2 = 0 : index2 > length ? index2 = length : 0 > index2 && (index2 = Math.max(0, length + index2));
      deleteCount = 1 === arguments.length ? length - index2 : void 0 === deleteCount || null === deleteCount ? 0 : Math.max(0, Math.min(deleteCount, length - index2));
      void 0 === newItems && (newItems = EMPTY_ARRAY);
      if (hasInterceptors(this)) {
        var change = interceptChange(this, {object:this.proxy_, type:"splice", index:index2, removedCount:deleteCount, added:newItems});
        if (!change) {
          return EMPTY_ARRAY;
        }
        deleteCount = change.removedCount;
        newItems = change.added;
      }
      newItems = 0 === newItems.length ? newItems : newItems.map(function(v2) {
        return _this.enhancer_(v2, void 0);
      });
      this.legacyMode_ && this.updateArrayLength_(length, newItems.length - deleteCount);
      length = this.spliceItemsIntoValues_(index2, deleteCount, newItems);
      0 === deleteCount && 0 === newItems.length || this.notifyArraySplice_(index2, newItems, length);
      return this.dehanceValues_(length);
    };
    _proto.spliceItemsIntoValues_ = function(index2, deleteCount, newItems) {
      if (1e4 > newItems.length) {
        var _this$values_;
        return (_this$values_ = this.values_).splice.apply(_this$values_, [index2, deleteCount].concat(newItems));
      }
      _this$values_ = this.values_.slice(index2, index2 + deleteCount);
      var oldItems = this.values_.slice(index2 + deleteCount);
      this.values_.length += newItems.length - deleteCount;
      for (deleteCount = 0; deleteCount < newItems.length; deleteCount++) {
        this.values_[index2 + deleteCount] = newItems[deleteCount];
      }
      for (deleteCount = 0; deleteCount < oldItems.length; deleteCount++) {
        this.values_[index2 + newItems.length + deleteCount] = oldItems[deleteCount];
      }
      return _this$values_;
    };
    _proto.notifyArrayChildUpdate_ = function(index2, newValue, oldValue) {
      var notifySpy = !this.owned_ && !1, notify = hasListeners(this);
      index2 = notify || notifySpy ? {observableKind:"array", object:this.proxy_, type:UPDATE, debugObjectName:this.atom_.name_, index:index2, newValue, oldValue} : null;
      this.atom_.reportChanged();
      notify && notifyListeners(this, index2);
    };
    _proto.notifyArraySplice_ = function(index2, added, removed) {
      var notifySpy = !this.owned_ && !1, notify = hasListeners(this);
      index2 = notify || notifySpy ? {observableKind:"array", object:this.proxy_, debugObjectName:this.atom_.name_, type:"splice", index:index2, removed, added, removedCount:removed.length, addedCount:added.length} : null;
      this.atom_.reportChanged();
      notify && notifyListeners(this, index2);
    };
    _proto.get_ = function(index2) {
      if (this.legacyMode_ && index2 >= this.values_.length) {
        console.warn("[mobx] Out of bounds read: " + index2);
      } else {
        return this.atom_.reportObserved(), this.dehanceValue_(this.values_[index2]);
      }
    };
    _proto.set_ = function(index2, newValue) {
      var values = this.values_;
      this.legacyMode_ && index2 > values.length && die(17, index2, values.length);
      if (index2 < values.length) {
        var oldValue = values[index2];
        if (hasInterceptors(this)) {
          newValue = interceptChange(this, {type:UPDATE, object:this.proxy_, index:index2, newValue});
          if (!newValue) {
            return;
          }
          newValue = newValue.newValue;
        }
        newValue = this.enhancer_(newValue, oldValue);
        newValue !== oldValue && (values[index2] = newValue, this.notifyArrayChildUpdate_(index2, newValue, oldValue));
      } else {
        index2 = Array(index2 + 1 - values.length);
        for (oldValue = 0; oldValue < index2.length - 1; oldValue++) {
          index2[oldValue] = void 0;
        }
        index2[index2.length - 1] = newValue;
        this.spliceWithArray_(values.length, 0, index2);
      }
    };
    return ObservableArrayAdministration2;
  }(), arrayExtensions = {clear:function() {
    return this.splice(0);
  }, replace:function(newItems) {
    var adm = this[$mobx];
    return adm.spliceWithArray_(0, adm.values_.length, newItems);
  }, toJSON:function() {
    return this.slice();
  }, splice:function(index2, deleteCount) {
    for (var _len = arguments.length, newItems = Array(2 < _len ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      newItems[_key - 2] = arguments[_key];
    }
    _len = this[$mobx];
    switch(arguments.length) {
      case 0:
        return [];
      case 1:
        return _len.spliceWithArray_(index2);
      case 2:
        return _len.spliceWithArray_(index2, deleteCount);
    }
    return _len.spliceWithArray_(index2, deleteCount, newItems);
  }, spliceWithArray:function(index2, deleteCount, newItems) {
    return this[$mobx].spliceWithArray_(index2, deleteCount, newItems);
  }, push:function() {
    for (var adm = this[$mobx], _len2 = arguments.length, items = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      items[_key2] = arguments[_key2];
    }
    adm.spliceWithArray_(adm.values_.length, 0, items);
    return adm.values_.length;
  }, pop:function() {
    return this.splice(Math.max(this[$mobx].values_.length - 1, 0), 1)[0];
  }, shift:function() {
    return this.splice(0, 1)[0];
  }, unshift:function() {
    for (var adm = this[$mobx], _len3 = arguments.length, items = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      items[_key3] = arguments[_key3];
    }
    adm.spliceWithArray_(0, 0, items);
    return adm.values_.length;
  }, reverse:function() {
    globalState.trackingDerivation && die(37, "reverse");
    this.replace(this.slice().reverse());
    return this;
  }, sort:function() {
    globalState.trackingDerivation && die(37, "sort");
    var copy = this.slice();
    copy.sort.apply(copy, arguments);
    this.replace(copy);
    return this;
  }, remove:function(value) {
    var adm = this[$mobx];
    value = adm.dehanceValues_(adm.values_).indexOf(value);
    return -1 < value ? (this.splice(value, 1), !0) : !1;
  }};
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
  var isObservableArrayAdministration = createInstanceofPredicate("ObservableArrayAdministration", ObservableArrayAdministration), ObservableMapMarker = {};
  var _Symbol$iterator = Symbol.iterator;
  var _Symbol$toStringTag = Symbol.toStringTag;
  var ObservableMap = function() {
    function ObservableMap2(initialData, enhancer_, name_) {
      var _this = this;
      void 0 === enhancer_ && (enhancer_ = deepEnhancer);
      void 0 === name_ && (name_ = "ObservableMap");
      this.name_ = this.enhancer_ = void 0;
      this[$mobx] = ObservableMapMarker;
      this.dehancer = this.changeListeners_ = this.interceptors_ = this.keysAtom_ = this.hasMap_ = this.data_ = void 0;
      this.enhancer_ = enhancer_;
      this.name_ = name_;
      isFunction(Map) || die(18);
      this.keysAtom_ = createAtom("ObservableMap.keys()");
      this.data_ = new Map();
      this.hasMap_ = new Map();
      allowStateChanges(!0, function() {
        _this.merge(initialData);
      });
    }
    var _proto = ObservableMap2.prototype;
    _proto.has_ = function(key) {
      return this.data_.has(key);
    };
    _proto.has = function(key) {
      var _this2 = this;
      if (!globalState.trackingDerivation) {
        return this.has_(key);
      }
      var entry = this.hasMap_.get(key);
      if (!entry) {
        var newEntry = entry = new ObservableValue(this.has_(key), referenceEnhancer, "ObservableMap.key?", !1);
        this.hasMap_.set(key, newEntry);
        onBecomeUnobserved(newEntry, function() {
          return _this2.hasMap_["delete"](key);
        });
      }
      return entry.get();
    };
    _proto.set = function(key, value) {
      var hasKey = this.has_(key);
      if (hasInterceptors(this)) {
        value = interceptChange(this, {type:hasKey ? UPDATE : "add", object:this, newValue:value, name:key});
        if (!value) {
          return this;
        }
        value = value.newValue;
      }
      hasKey ? this.updateValue_(key, value) : this.addValue_(key, value);
      return this;
    };
    _proto["delete"] = function(key) {
      var _this3 = this;
      if (hasInterceptors(this) && !interceptChange(this, {type:"delete", object:this, name:key})) {
        return !1;
      }
      if (this.has_(key)) {
        var notify = hasListeners(this), _change = notify ? {observableKind:"map", debugObjectName:this.name_, type:"delete", object:this, oldValue:this.data_.get(key).value_, name:key} : null;
        transaction(function() {
          var _this3$hasMap_$get;
          _this3.keysAtom_.reportChanged();
          null == (_this3$hasMap_$get = _this3.hasMap_.get(key)) || _this3$hasMap_$get.setNewValue_(!1);
          _this3.data_.get(key).setNewValue_(void 0);
          _this3.data_["delete"](key);
        });
        notify && notifyListeners(this, _change);
        return !0;
      }
      return !1;
    };
    _proto.updateValue_ = function(key, newValue) {
      var observable2 = this.data_.get(key);
      newValue = observable2.prepareNewValue_(newValue);
      if (newValue !== globalState.UNCHANGED) {
        var notify = hasListeners(this);
        key = notify ? {observableKind:"map", debugObjectName:this.name_, type:UPDATE, object:this, oldValue:observable2.value_, name:key, newValue} : null;
        observable2.setNewValue_(newValue);
        notify && notifyListeners(this, key);
      }
    };
    _proto.addValue_ = function(key, newValue) {
      var _this4 = this;
      transaction(function() {
        var _this4$hasMap_$get, observable2 = new ObservableValue(newValue, _this4.enhancer_, "ObservableMap.key", !1);
        _this4.data_.set(key, observable2);
        newValue = observable2.value_;
        null == (_this4$hasMap_$get = _this4.hasMap_.get(key)) || _this4$hasMap_$get.setNewValue_(!0);
        _this4.keysAtom_.reportChanged();
      });
      var notify = hasListeners(this), change = notify ? {observableKind:"map", debugObjectName:this.name_, type:"add", object:this, name:key, newValue} : null;
      notify && notifyListeners(this, change);
    };
    _proto.get = function(key) {
      return this.has(key) ? this.dehanceValue_(this.data_.get(key).get()) : this.dehanceValue_(void 0);
    };
    _proto.dehanceValue_ = function(value) {
      return void 0 !== this.dehancer ? this.dehancer(value) : value;
    };
    _proto.keys = function() {
      this.keysAtom_.reportObserved();
      return this.data_.keys();
    };
    _proto.values = function() {
      var self2 = this, keys = this.keys();
      return makeIterable({next:function() {
        var _keys$next = keys.next(), done = _keys$next.done;
        _keys$next = _keys$next.value;
        return {done, value:done ? void 0 : self2.get(_keys$next)};
      }});
    };
    _proto.entries = function() {
      var self2 = this, keys = this.keys();
      return makeIterable({next:function() {
        var _keys$next2 = keys.next(), done = _keys$next2.done;
        _keys$next2 = _keys$next2.value;
        return {done, value:done ? void 0 : [_keys$next2, self2.get(_keys$next2)]};
      }});
    };
    _proto[_Symbol$iterator] = function() {
      return this.entries();
    };
    _proto.forEach = function(callback, thisArg) {
      for (var _iterator = _createForOfIteratorHelperLoose(this), _step; !(_step = _iterator()).done;) {
        _step = _step.value, callback.call(thisArg, _step[1], _step[0], this);
      }
    };
    _proto.merge = function(other) {
      var _this5 = this;
      isObservableMap(other) && (other = new Map(other));
      transaction(function() {
        isPlainObject(other) ? getPlainObjectKeys(other).forEach(function(key) {
          return _this5.set(key, other[key]);
        }) : Array.isArray(other) ? other.forEach(function(_ref) {
          return _this5.set(_ref[0], _ref[1]);
        }) : isES6Map(other) ? (other.constructor !== Map && die(19, other), other.forEach(function(value, key) {
          return _this5.set(key, value);
        })) : null !== other && void 0 !== other && die(20, other);
      });
      return this;
    };
    _proto.clear = function() {
      var _this6 = this;
      transaction(function() {
        untracked(function() {
          for (var _iterator2 = _createForOfIteratorHelperLoose(_this6.keys()), _step2; !(_step2 = _iterator2()).done;) {
            _this6["delete"](_step2.value);
          }
        });
      });
    };
    _proto.replace = function(values) {
      var _this7 = this;
      transaction(function() {
        for (var replacementMap = convertToMap(values), orderedData = new Map(), keysReportChangedCalled = !1, _iterator3 = _createForOfIteratorHelperLoose(_this7.data_.keys()), _step3; !(_step3 = _iterator3()).done;) {
          if (_step3 = _step3.value, !replacementMap.has(_step3)) {
            if (_this7["delete"](_step3)) {
              keysReportChangedCalled = !0;
            } else {
              var value = _this7.data_.get(_step3);
              orderedData.set(_step3, value);
            }
          }
        }
        for (replacementMap = _createForOfIteratorHelperLoose(replacementMap.entries()); !(_iterator3 = replacementMap()).done;) {
          _step3 = _iterator3.value, _iterator3 = _step3[0], value = _step3[1], _step3 = _this7.data_.has(_iterator3), _this7.set(_iterator3, value), _this7.data_.has(_iterator3) && (value = _this7.data_.get(_iterator3), orderedData.set(_iterator3, value), _step3 || (keysReportChangedCalled = !0));
        }
        if (!keysReportChangedCalled) {
          if (_this7.data_.size !== orderedData.size) {
            _this7.keysAtom_.reportChanged();
          } else {
            for (keysReportChangedCalled = _this7.data_.keys(), replacementMap = orderedData.keys(), _iterator3 = keysReportChangedCalled.next(), _step3 = replacementMap.next(); !_iterator3.done;) {
              if (_iterator3.value !== _step3.value) {
                _this7.keysAtom_.reportChanged();
                break;
              }
              _iterator3 = keysReportChangedCalled.next();
              _step3 = replacementMap.next();
            }
          }
        }
        _this7.data_ = orderedData;
      });
      return this;
    };
    _proto.toString = function() {
      return "[object ObservableMap]";
    };
    _proto.toJSON = function() {
      return Array.from(this);
    };
    _proto.observe_ = function(listener, fireImmediately) {
      return registerListener(this, listener);
    };
    _proto.intercept_ = function(handler) {
      return registerInterceptor(this, handler);
    };
    _createClass(ObservableMap2, [{key:"size", get:function() {
      this.keysAtom_.reportObserved();
      return this.data_.size;
    }}, {key:_Symbol$toStringTag, get:function() {
      return "Map";
    }}]);
    return ObservableMap2;
  }(), isObservableMap = createInstanceofPredicate("ObservableMap", ObservableMap), ObservableSetMarker = {};
  var _Symbol$iterator$1 = Symbol.iterator;
  var _Symbol$toStringTag$1 = Symbol.toStringTag;
  var ObservableSet = function() {
    function ObservableSet2(initialData, enhancer, name_) {
      void 0 === enhancer && (enhancer = deepEnhancer);
      void 0 === name_ && (name_ = "ObservableSet");
      this.name_ = void 0;
      this[$mobx] = ObservableSetMarker;
      this.data_ = new Set();
      this.enhancer_ = this.dehancer = this.interceptors_ = this.changeListeners_ = this.atom_ = void 0;
      this.name_ = name_;
      isFunction(Set) || die(22);
      this.atom_ = createAtom(this.name_);
      this.enhancer_ = function(newV, oldV) {
        return enhancer(newV, oldV, name_);
      };
      initialData && this.replace(initialData);
    }
    var _proto = ObservableSet2.prototype;
    _proto.dehanceValue_ = function(value) {
      return void 0 !== this.dehancer ? this.dehancer(value) : value;
    };
    _proto.clear = function() {
      var _this = this;
      transaction(function() {
        untracked(function() {
          for (var _iterator = _createForOfIteratorHelperLoose(_this.data_.values()), _step; !(_step = _iterator()).done;) {
            _this["delete"](_step.value);
          }
        });
      });
    };
    _proto.forEach = function(callbackFn, thisArg) {
      for (var _iterator2 = _createForOfIteratorHelperLoose(this), _step2; !(_step2 = _iterator2()).done;) {
        _step2 = _step2.value, callbackFn.call(thisArg, _step2, _step2, this);
      }
    };
    _proto.add = function(value) {
      var _this2 = this;
      if (hasInterceptors(this) && !interceptChange(this, {type:"add", object:this, newValue:value})) {
        return this;
      }
      if (!this.has(value)) {
        transaction(function() {
          _this2.data_.add(_this2.enhancer_(value, void 0));
          _this2.atom_.reportChanged();
        });
        var notify = hasListeners(this), _change = notify ? {observableKind:"set", debugObjectName:this.name_, type:"add", object:this, newValue:value} : null;
        notify && notifyListeners(this, _change);
      }
      return this;
    };
    _proto["delete"] = function(value) {
      var _this3 = this;
      if (hasInterceptors(this) && !interceptChange(this, {type:"delete", object:this, oldValue:value})) {
        return !1;
      }
      if (this.has(value)) {
        var notify = hasListeners(this), _change2 = notify ? {observableKind:"set", debugObjectName:this.name_, type:"delete", object:this, oldValue:value} : null;
        transaction(function() {
          _this3.atom_.reportChanged();
          _this3.data_["delete"](value);
        });
        notify && notifyListeners(this, _change2);
        return !0;
      }
      return !1;
    };
    _proto.has = function(value) {
      this.atom_.reportObserved();
      return this.data_.has(this.dehanceValue_(value));
    };
    _proto.entries = function() {
      var nextIndex = 0, keys = Array.from(this.keys()), values = Array.from(this.values());
      return makeIterable({next:function() {
        var index2 = nextIndex;
        nextIndex += 1;
        return index2 < values.length ? {value:[keys[index2], values[index2]], done:!1} : {done:!0};
      }});
    };
    _proto.keys = function() {
      return this.values();
    };
    _proto.values = function() {
      this.atom_.reportObserved();
      var self2 = this, nextIndex = 0, observableValues = Array.from(this.data_.values());
      return makeIterable({next:function() {
        return nextIndex < observableValues.length ? {value:self2.dehanceValue_(observableValues[nextIndex++]), done:!1} : {done:!0};
      }});
    };
    _proto.replace = function(other) {
      var _this4 = this;
      isObservableSet(other) && (other = new Set(other));
      transaction(function() {
        Array.isArray(other) ? (_this4.clear(), other.forEach(function(value) {
          return _this4.add(value);
        })) : isES6Set(other) ? (_this4.clear(), other.forEach(function(value) {
          return _this4.add(value);
        })) : null !== other && void 0 !== other && die("Cannot initialize set from " + other);
      });
      return this;
    };
    _proto.observe_ = function(listener, fireImmediately) {
      return registerListener(this, listener);
    };
    _proto.intercept_ = function(handler) {
      return registerInterceptor(this, handler);
    };
    _proto.toJSON = function() {
      return Array.from(this);
    };
    _proto.toString = function() {
      return "[object ObservableSet]";
    };
    _proto[_Symbol$iterator$1] = function() {
      return this.values();
    };
    _createClass(ObservableSet2, [{key:"size", get:function() {
      this.atom_.reportObserved();
      return this.data_.size;
    }}, {key:_Symbol$toStringTag$1, get:function() {
      return "Set";
    }}]);
    return ObservableSet2;
  }(), isObservableSet = createInstanceofPredicate("ObservableSet", ObservableSet), descriptorCache = Object.create(null), ObservableObjectAdministration = function() {
    function ObservableObjectAdministration2(target_, values_, name_, defaultAnnotation_) {
      void 0 === values_ && (values_ = new Map());
      void 0 === defaultAnnotation_ && (defaultAnnotation_ = autoAnnotation);
      this.pendingKeys_ = this.appliedAnnotations_ = this.isPlainObject_ = this.proxy_ = this.interceptors_ = this.changeListeners_ = this.keysAtom_ = this.defaultAnnotation_ = this.values_ = this.target_ = void 0;
      this.target_ = target_;
      this.values_ = values_;
      this.name_ = name_;
      this.defaultAnnotation_ = defaultAnnotation_;
      this.keysAtom_ = new Atom("ObservableObject.keys");
      this.isPlainObject_ = isPlainObject(this.target_);
    }
    var _proto = ObservableObjectAdministration2.prototype;
    _proto.getObservablePropValue_ = function(key) {
      return this.values_.get(key).get();
    };
    _proto.setObservablePropValue_ = function(key, newValue) {
      var observable2 = this.values_.get(key);
      if (observable2 instanceof ComputedValue) {
        return observable2.set(newValue), !0;
      }
      if (hasInterceptors(this)) {
        newValue = interceptChange(this, {type:UPDATE, object:this.proxy_ || this.target_, name:key, newValue});
        if (!newValue) {
          return null;
        }
        newValue = newValue.newValue;
      }
      newValue = observable2.prepareNewValue_(newValue);
      if (newValue !== globalState.UNCHANGED) {
        var notify = hasListeners(this);
        key = notify ? {type:UPDATE, observableKind:"object", debugObjectName:this.name_, object:this.proxy_ || this.target_, oldValue:observable2.value_, name:key, newValue} : null;
        observable2.setNewValue_(newValue);
        notify && notifyListeners(this, key);
      }
      return !0;
    };
    _proto.get_ = function(key) {
      globalState.trackingDerivation && !hasProp(this.target_, key) && this.has_(key);
      return this.target_[key];
    };
    _proto.set_ = function(key, value, proxyTrap) {
      void 0 === proxyTrap && (proxyTrap = !1);
      if (hasProp(this.target_, key)) {
        if (this.values_.has(key)) {
          return this.setObservablePropValue_(key, value);
        }
        if (proxyTrap) {
          return Reflect.set(this.target_, key, value);
        }
        this.target_[key] = value;
        return !0;
      }
      return this.extend_(key, {value, enumerable:!0, writable:!0, configurable:!0}, this.defaultAnnotation_, proxyTrap);
    };
    _proto.has_ = function(key) {
      if (!globalState.trackingDerivation) {
        return key in this.target_;
      }
      this.pendingKeys_ || (this.pendingKeys_ = new Map());
      var entry = this.pendingKeys_.get(key);
      entry || (entry = new ObservableValue(key in this.target_, referenceEnhancer, "ObservableObject.key?", !1), this.pendingKeys_.set(key, entry));
      return entry.get();
    };
    _proto.make_ = function(key, annotation) {
      !0 === annotation && (annotation = this.defaultAnnotation_);
      if (!1 !== annotation) {
        if (!(key in this.target_)) {
          var _this$target_$storedA;
          if (null != (_this$target_$storedA = this.target_[storedAnnotationsSymbol]) && _this$target_$storedA[key]) {
            return;
          }
          die(1, annotation.annotationType_, this.name_ + "." + key.toString());
        }
        for (_this$target_$storedA = this.target_; _this$target_$storedA && _this$target_$storedA !== objectPrototype;) {
          var descriptor = getDescriptor(_this$target_$storedA, key);
          if (descriptor) {
            descriptor = annotation.make_(this, key, descriptor, _this$target_$storedA);
            if (0 === descriptor) {
              return;
            }
            if (1 === descriptor) {
              break;
            }
          }
          _this$target_$storedA = Object.getPrototypeOf(_this$target_$storedA);
        }
        var _adm$target_$storedAn;
        null == (_adm$target_$storedAn = this.target_[storedAnnotationsSymbol]) ? !0 : delete _adm$target_$storedAn[key];
      }
    };
    _proto.extend_ = function(key, descriptor, annotation, proxyTrap) {
      void 0 === proxyTrap && (proxyTrap = !1);
      !0 === annotation && (annotation = this.defaultAnnotation_);
      if (!1 === annotation) {
        return this.defineProperty_(key, descriptor, proxyTrap);
      }
      if (descriptor = annotation.extend_(this, key, descriptor, proxyTrap)) {
        var _adm$target_$storedAn;
        null == (_adm$target_$storedAn = this.target_[storedAnnotationsSymbol]) ? !0 : delete _adm$target_$storedAn[key];
      }
      return descriptor;
    };
    _proto.defineProperty_ = function(key, descriptor, proxyTrap) {
      void 0 === proxyTrap && (proxyTrap = !1);
      try {
        startBatch();
        var deleteOutcome = this.delete_(key);
        if (!deleteOutcome) {
          return deleteOutcome;
        }
        if (hasInterceptors(this)) {
          var change = interceptChange(this, {object:this.proxy_ || this.target_, name:key, type:"add", newValue:descriptor.value});
          if (!change) {
            return null;
          }
          var newValue = change.newValue;
          descriptor.value !== newValue && (descriptor = _extends({}, descriptor, {value:newValue}));
        }
        if (proxyTrap) {
          if (!Reflect.defineProperty(this.target_, key, descriptor)) {
            return !1;
          }
        } else {
          defineProperty(this.target_, key, descriptor);
        }
        this.notifyPropertyAddition_(key, descriptor.value);
      } finally {
        endBatch();
      }
      return !0;
    };
    _proto.defineObservableProperty_ = function(key, value, enhancer, proxyTrap) {
      void 0 === proxyTrap && (proxyTrap = !1);
      try {
        startBatch();
        var deleteOutcome = this.delete_(key);
        if (!deleteOutcome) {
          return deleteOutcome;
        }
        if (hasInterceptors(this)) {
          var change = interceptChange(this, {object:this.proxy_ || this.target_, name:key, type:"add", newValue:value});
          if (!change) {
            return null;
          }
          value = change.newValue;
        }
        var cachedDescriptor = getCachedObservablePropDescriptor(key), descriptor = {configurable:globalState.safeDescriptors ? this.isPlainObject_ : !0, enumerable:!0, get:cachedDescriptor.get, set:cachedDescriptor.set};
        if (proxyTrap) {
          if (!Reflect.defineProperty(this.target_, key, descriptor)) {
            return !1;
          }
        } else {
          defineProperty(this.target_, key, descriptor);
        }
        var observable2 = new ObservableValue(value, enhancer, "ObservableObject.key", !1);
        this.values_.set(key, observable2);
        this.notifyPropertyAddition_(key, observable2.value_);
      } finally {
        endBatch();
      }
      return !0;
    };
    _proto.defineComputedProperty_ = function(key, options, proxyTrap) {
      void 0 === proxyTrap && (proxyTrap = !1);
      try {
        startBatch();
        var deleteOutcome = this.delete_(key);
        if (!deleteOutcome) {
          return deleteOutcome;
        }
        if (hasInterceptors(this) && !interceptChange(this, {object:this.proxy_ || this.target_, name:key, type:"add", newValue:void 0})) {
          return null;
        }
        options.name || (options.name = "ObservableObject.key");
        options.context = this.proxy_ || this.target_;
        var cachedDescriptor = getCachedObservablePropDescriptor(key), descriptor = {configurable:globalState.safeDescriptors ? this.isPlainObject_ : !0, enumerable:!1, get:cachedDescriptor.get, set:cachedDescriptor.set};
        if (proxyTrap) {
          if (!Reflect.defineProperty(this.target_, key, descriptor)) {
            return !1;
          }
        } else {
          defineProperty(this.target_, key, descriptor);
        }
        this.values_.set(key, new ComputedValue(options));
        this.notifyPropertyAddition_(key, void 0);
      } finally {
        endBatch();
      }
      return !0;
    };
    _proto.delete_ = function(key, proxyTrap) {
      void 0 === proxyTrap && (proxyTrap = !1);
      if (!hasProp(this.target_, key)) {
        return !0;
      }
      if (hasInterceptors(this) && !interceptChange(this, {object:this.proxy_ || this.target_, name:key, type:"remove"})) {
        return null;
      }
      try {
        var _this$pendingKeys_, _this$pendingKeys_$ge;
        startBatch();
        var notify = hasListeners(this), observable2 = this.values_.get(key), value = void 0;
        if (!observable2 && notify) {
          var _getDescriptor2;
          value = null == (_getDescriptor2 = getDescriptor(this.target_, key)) ? void 0 : _getDescriptor2.value;
        }
        if (proxyTrap) {
          if (!Reflect.deleteProperty(this.target_, key)) {
            return !1;
          }
        } else {
          delete this.target_[key];
        }
        observable2 && (this.values_["delete"](key), observable2 instanceof ObservableValue && (value = observable2.value_), propagateChanged(observable2));
        this.keysAtom_.reportChanged();
        null == (_this$pendingKeys_ = this.pendingKeys_) || null == (_this$pendingKeys_$ge = _this$pendingKeys_.get(key)) || _this$pendingKeys_$ge.set(key in this.target_);
        if (notify) {
          var _change2 = {type:"remove", observableKind:"object", object:this.proxy_ || this.target_, debugObjectName:this.name_, oldValue:value, name:key};
          notify && notifyListeners(this, _change2);
        }
      } finally {
        endBatch();
      }
      return !0;
    };
    _proto.observe_ = function(callback, fireImmediately) {
      return registerListener(this, callback);
    };
    _proto.intercept_ = function(handler) {
      return registerInterceptor(this, handler);
    };
    _proto.notifyPropertyAddition_ = function(key, value) {
      var _this$pendingKeys_2, _this$pendingKeys_2$g, notify = hasListeners(this);
      notify && (value = notify ? {type:"add", observableKind:"object", debugObjectName:this.name_, object:this.proxy_ || this.target_, name:key, newValue:value} : null, notify && notifyListeners(this, value));
      null == (_this$pendingKeys_2 = this.pendingKeys_) || null == (_this$pendingKeys_2$g = _this$pendingKeys_2.get(key)) || _this$pendingKeys_2$g.set(!0);
      this.keysAtom_.reportChanged();
    };
    _proto.ownKeys_ = function() {
      this.keysAtom_.reportObserved();
      return ownKeys(this.target_);
    };
    _proto.keys_ = function() {
      this.keysAtom_.reportObserved();
      return Object.keys(this.target_);
    };
    return ObservableObjectAdministration2;
  }(), isObservableObjectAdministration = createInstanceofPredicate("ObservableObjectAdministration", ObservableObjectAdministration), ENTRY_0 = createArrayEntryDescriptor(0), OBSERVABLE_ARRAY_BUFFER_SIZE = 0, StubArray = function() {
  };
  (function(ctor, proto) {
    Object.setPrototypeOf ? Object.setPrototypeOf(ctor.prototype, proto) : void 0 !== ctor.prototype.__proto__ ? ctor.prototype.__proto__ = proto : ctor.prototype = proto;
  })(StubArray, Array.prototype);
  var LegacyObservableArray = function(_StubArray, _Symbol$toStringTag2, _Symbol$iterator2) {
    function LegacyObservableArray2(initialValues, enhancer, name, owned) {
      void 0 === name && (name = "ObservableArray");
      void 0 === owned && (owned = !1);
      var _this = _StubArray.call(this) || this;
      enhancer = new ObservableArrayAdministration(name, enhancer, owned, !0);
      enhancer.proxy_ = _assertThisInitialized(_this);
      addHiddenFinalProp(_assertThisInitialized(_this), $mobx, enhancer);
      initialValues && initialValues.length && (enhancer = allowStateChangesStart(!0), _this.spliceWithArray(0, 0, initialValues), globalState.allowStateChanges = enhancer);
      Object.defineProperty(_assertThisInitialized(_this), "0", ENTRY_0);
      return _this;
    }
    _inheritsLoose(LegacyObservableArray2, _StubArray);
    var _proto = LegacyObservableArray2.prototype;
    _proto.concat = function() {
      this[$mobx].atom_.reportObserved();
      for (var _len = arguments.length, arrays = Array(_len), _key = 0; _key < _len; _key++) {
        arrays[_key] = arguments[_key];
      }
      return Array.prototype.concat.apply(this.slice(), arrays.map(function(a3) {
        return isObservableArray(a3) ? a3.slice() : a3;
      }));
    };
    _proto[_Symbol$iterator2] = function() {
      var self2 = this, nextIndex = 0;
      return makeIterable({next:function() {
        return nextIndex < self2.length ? {value:self2[nextIndex++], done:!1} : {done:!0, value:void 0};
      }});
    };
    _createClass(LegacyObservableArray2, [{key:"length", get:function() {
      return this[$mobx].getArrayLength_();
    }, set:function(newLength) {
      this[$mobx].setArrayLength_(newLength);
    }}, {key:_Symbol$toStringTag2, get:function() {
      return "Array";
    }}]);
    return LegacyObservableArray2;
  }(StubArray, Symbol.toStringTag, Symbol.iterator);
  Object.entries(arrayExtensions).forEach(function(_ref) {
    var prop = _ref[0];
    _ref = _ref[1];
    "concat" !== prop && addHiddenProp(LegacyObservableArray.prototype, prop, _ref);
  });
  reserveArrayBuffer(1e3);
  var toString = objectPrototype.toString;
  ["Symbol", "Map", "Set"].forEach(function(m2) {
    "undefined" === typeof getGlobal()[m2] && die("MobX requires global '" + m2 + "' to be available or polyfilled");
  });
  "object" === typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ && __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobx({spy, extras:{getDebugName}, $mobx});
  var import_jsx_runtime = require("module$node_modules$react$jsx_runtime"), TLShape = class {
    constructor(props) {
      __publicField(this, "props");
      __publicField(this, "aspectRatio");
      __publicField(this, "type");
      __publicField(this, "hideCloneHandles", !1);
      __publicField(this, "hideResizeHandles", !1);
      __publicField(this, "hideRotateHandle", !1);
      __publicField(this, "hideContextBar", !1);
      __publicField(this, "hideSelectionDetail", !1);
      __publicField(this, "hideSelection", !1);
      __publicField(this, "canChangeAspectRatio", !0);
      __publicField(this, "canUnmount", !0);
      __publicField(this, "canResize", [!0, !0]);
      __publicField(this, "canScale", !0);
      __publicField(this, "canFlip", !0);
      __publicField(this, "canEdit", !1);
      __publicField(this, "canBind", !1);
      __publicField(this, "nonce");
      __publicField(this, "bindingDistance", 4);
      __publicField(this, "isDirty", !1);
      __publicField(this, "lastSerialized");
      __publicField(this, "getCenter", () => BoundsUtils.getBoundsCenter(this.bounds));
      __publicField(this, "getRotatedBounds", () => {
        const {bounds, props:{rotation}} = this;
        return rotation ? BoundsUtils.getBoundsFromPoints(BoundsUtils.getRotatedCorners(bounds, rotation)) : bounds;
      });
      __publicField(this, "hitTestPoint", point => {
        var ownBounds = this.rotatedBounds;
        if (!this.props.rotation) {
          return PointUtils.pointInBounds(point, ownBounds);
        }
        ownBounds = BoundsUtils.getRotatedCorners(ownBounds, this.props.rotation);
        return PointUtils.pointInPolygon(point, ownBounds);
      });
      __publicField(this, "hitTestLineSegment", (A3, B3) => {
        const box2 = BoundsUtils.getBoundsFromPoints([A3, B3]), {rotatedBounds, props:{rotation = 0}} = this;
        return BoundsUtils.boundsContain(rotatedBounds, box2) || rotation ? intersectLineSegmentPolyline(A3, B3, BoundsUtils.getRotatedCorners(this.bounds)).didIntersect : 0 < intersectBoundsLineSegment(rotatedBounds, A3, B3).length;
      });
      __publicField(this, "hitTestBounds", bounds => {
        const {rotatedBounds, props:{rotation = 0}} = this, corners = BoundsUtils.getRotatedCorners(this.bounds, rotation);
        return BoundsUtils.boundsContain(bounds, rotatedBounds) || 0 < intersectRectanglePolygon([bounds.minX, bounds.minY], [bounds.width, bounds.height], corners).length;
      });
      __publicField(this, "getExpandedBounds", () => BoundsUtils.expandBounds(this.getBounds(), this.bindingDistance));
      __publicField(this, "getBindingPoint", (point, origin, direction, bindAnywhere) => {
        var bounds = this.getBounds(), expandedBounds = this.getExpandedBounds();
        if (PointUtils.pointInBounds(point, expandedBounds)) {
          var intersections = intersectRayBounds(origin, direction, expandedBounds).filter(int => int.didIntersect).map(int => int.points[0]);
          if (intersections.length) {
            return direction = this.getCenter(), intersections = intersections.sort((a3, b3) => src_default.dist(b3, origin) - src_default.dist(a3, origin))[0], intersections = src_default.med(point, intersections), bindAnywhere ? (bindAnywhere = 2 > src_default.dist(point, direction) ? direction : point, bounds = 0) : (bindAnywhere = 2 > src_default.distanceToLineSegment(point, intersections, direction) ? direction : intersections, bounds = PointUtils.pointInBounds(point, bounds) ? this.bindingDistance : 
            Math.max(this.bindingDistance, BoundsUtils.getBoundsSides(bounds).map(side => src_default.distanceToLineSegment(side[1][0], side[1][1], point)).sort((a3, b3) => a3 - b3)[0])), expandedBounds = src_default.divV(src_default.sub(bindAnywhere, [expandedBounds.minX, expandedBounds.minY]), [expandedBounds.width, expandedBounds.height]), {point:src_default.clampV(expandedBounds, 0, 1), distance:bounds};
          }
        }
      });
      __publicField(this, "getSerialized", () => toJS(__spreadProps(__spreadValues({}, this.props), {type:this.type, nonce:this.nonce})));
      __publicField(this, "getCachedSerialized", () => {
        !this.isDirty && this.lastSerialized || transaction(() => {
          this.setIsDirty(!1);
          this.setLastSerialized(this.getSerialized());
        });
        if (this.lastSerialized) {
          return this.lastSerialized;
        }
        throw Error("Should not get here for getCachedSerialized");
      });
      __publicField(this, "validateProps", props => props);
      __publicField(this, "update", (props, isDeserializing = !1, skipNounce = !1) => {
        isDeserializing || this.isDirty || this.setIsDirty(!0);
        isDeserializing || skipNounce || this.incNonce();
        Object.assign(this.props, this.validateProps(props));
        return this;
      });
      __publicField(this, "clone", () => new this.constructor(this.serialized));
      __publicField(this, "onResetBounds", info => this);
      __publicField(this, "scale", [1, 1]);
      __publicField(this, "onResizeStart", info => {
        var _a3;
        this.scale = [...(null != (_a3 = this.props.scale) ? _a3 : [1, 1])];
        return this;
      });
      __publicField(this, "onResize", (initialProps, info) => {
        const {bounds, rotation, scale:[scaleX, scaleY]} = info;
        initialProps = [...this.scale];
        0 > scaleX && (initialProps[0] *= -1);
        0 > scaleY && (initialProps[1] *= -1);
        this.update({point:[bounds.minX, bounds.minY], scale:initialProps, rotation});
        return this;
      });
      __publicField(this, "onHandleChange", (initialShape, {id:id3, delta}) => {
        if (void 0 !== initialShape.handles) {
          var nextHandles = deepCopy(initialShape.handles);
          nextHandles[id3] = __spreadProps(__spreadValues({}, nextHandles[id3]), {point:src_default.add(delta, initialShape.handles[id3].point)});
          var topLeft = BoundsUtils.getCommonTopLeft(Object.values(nextHandles).map(h2 => h2.point));
          Object.values(nextHandles).forEach(h2 => {
            h2.point = src_default.sub(h2.point, topLeft);
          });
          this.update({point:src_default.add(initialShape.point, topLeft), handles:nextHandles});
        }
      });
      var _a3, _b;
      const type = this.constructor.id, defaultProps = null != (_a3 = this.constructor.defaultProps) ? _a3 : {};
      this.type = type;
      this.props = __spreadValues(__spreadValues({scale:[1, 1]}, defaultProps), props);
      this.nonce = null != (_b = props.nonce) ? _b : Date.now();
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
      _2 = this.getBounds();
      const {stroke, strokeWidth, strokeType, opacity, fill, noFill, borderRadius} = this.props;
      return (0,import_jsx_runtime.jsx)("rect", {fill:noFill ? "none" : getComputedColor(fill, "background"), stroke:getComputedColor(stroke, "stroke"), strokeWidth:null != strokeWidth ? strokeWidth : 2, strokeDasharray:"dashed" === strokeType ? "8 2" : void 0, fillOpacity:null != opacity ? opacity : 0.2, width:_2.width, height:_2.height, rx:borderRadius, ry:borderRadius});
    }
  };
  __publicField(TLShape, "type");
  __decorateClass([observable], TLShape.prototype, "props", 2);
  __decorateClass([observable], TLShape.prototype, "canResize", 2);
  __decorateClass([observable], TLShape.prototype, "nonce", 2);
  __decorateClass([observable], TLShape.prototype, "isDirty", 2);
  __decorateClass([observable], TLShape.prototype, "lastSerialized", 2);
  __decorateClass([computed], TLShape.prototype, "id", 1);
  __decorateClass([action], TLShape.prototype, "setNonce", 1);
  __decorateClass([action], TLShape.prototype, "incNonce", 1);
  __decorateClass([action], TLShape.prototype, "setIsDirty", 1);
  __decorateClass([action], TLShape.prototype, "setLastSerialized", 1);
  __decorateClass([computed], TLShape.prototype, "center", 1);
  __decorateClass([computed], TLShape.prototype, "bounds", 1);
  __decorateClass([computed], TLShape.prototype, "rotatedBounds", 1);
  __decorateClass([computed], TLShape.prototype, "serialized", 1);
  __decorateClass([action], TLShape.prototype, "update", 2);
  var TLBoxShape = class extends TLShape {
    constructor(props = {}) {
      super(props);
      __publicField(this, "canBind", !0);
      __publicField(this, "getBounds", () => {
        const [x2, y2] = this.props.point, [width, height] = this.props.size;
        return {minX:x2, minY:y2, maxX:x2 + width, maxY:y2 + height, width, height};
      });
      __publicField(this, "getRotatedBounds", () => BoundsUtils.getBoundsFromPoints(BoundsUtils.getRotatedCorners(this.bounds, this.props.rotation)));
      __publicField(this, "onResize", (initialProps, info) => {
        const {bounds, rotation, scale:[scaleX, scaleY]} = info;
        initialProps = [...this.scale];
        0 > scaleX && (initialProps[0] *= -1);
        0 > scaleY && (initialProps[1] *= -1);
        this.update({point:[bounds.minX, bounds.minY], scale:initialProps, rotation});
        return this.update({rotation, point:[bounds.minX, bounds.minY], size:[Math.max(1, bounds.width), Math.max(1, bounds.height)], scale:initialProps});
      });
      __publicField(this, "validateProps", props => {
        void 0 !== props.size && (props.size[0] = Math.max(props.size[0], 1), props.size[1] = Math.max(props.size[1], 1));
        return props;
      });
      makeObservable(this);
    }
  };
  __publicField(TLBoxShape, "id", "box");
  __publicField(TLBoxShape, "defaultProps", {id:"box", type:"box", parentId:"page", point:[0, 0], size:[100, 100]});
  var TLDrawShape = class extends TLShape {
    constructor(props = {}) {
      super(props);
      __publicField(this, "getBounds", () => {
        const {pointBounds, props:{point}} = this;
        return BoundsUtils.translateBounds(pointBounds, point);
      });
      __publicField(this, "getRotatedBounds", () => {
        const {props:{rotation, point}, bounds, rotatedPoints} = this;
        return rotation ? BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedPoints), point) : bounds;
      });
      __publicField(this, "normalizedPoints", []);
      __publicField(this, "isResizeFlippedX", !1);
      __publicField(this, "isResizeFlippedY", !1);
      __publicField(this, "onResizeStart", () => {
        var _a3;
        const {bounds, props:{points}} = this;
        this.scale = [...(null != (_a3 = this.props.scale) ? _a3 : [1, 1])];
        const size = [bounds.width, bounds.height];
        this.normalizedPoints = points.map(point => Vec.divV(point, size));
        return this;
      });
      __publicField(this, "onResize", (initialProps, info) => {
        const {bounds, scale:[scaleX, scaleY]} = info, size = [bounds.width, bounds.height];
        initialProps = [...this.scale];
        0 > scaleX && (initialProps[0] *= -1);
        0 > scaleY && (initialProps[1] *= -1);
        return this.update(scaleX || scaleY ? {point:[bounds.minX, bounds.minY], points:this.normalizedPoints.map(point => Vec.mulV(point, size).concat(point[2])), scale:initialProps} : {point:[bounds.minX, bounds.minY], points:this.normalizedPoints.map(point => Vec.mulV(point, size).concat(point[2]))});
      });
      __publicField(this, "hitTestPoint", point => {
        const {props:{points, point:ownPoint}} = this;
        return PointUtils.pointNearToPolyline(Vec.sub(point, ownPoint), points);
      });
      __publicField(this, "hitTestLineSegment", (A3, B3) => {
        const {bounds, props:{points, point}} = this;
        if (PointUtils.pointInBounds(A3, bounds) || PointUtils.pointInBounds(B3, bounds) || 0 < intersectBoundsLineSegment(bounds, A3, B3).length) {
          const rA = Vec.sub(A3, point), rB = Vec.sub(B3, point);
          return intersectLineSegmentPolyline(rA, rB, points).didIntersect || !!points.find(point2 => 5 > Vec.dist(rA, point2) || 5 > Vec.dist(rB, point2));
        }
        return !1;
      });
      __publicField(this, "hitTestBounds", bounds => {
        const {rotatedBounds, props:{points, point}} = this, oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(point));
        return BoundsUtils.boundsContain(bounds, rotatedBounds) || points.every(vert => PointUtils.pointInBounds(vert, oBounds)) || BoundsUtils.boundsCollide(bounds, rotatedBounds) && 0 < intersectRectanglePolyline([oBounds.minX, oBounds.minY], [oBounds.width, oBounds.height], points).length;
      });
      makeObservable(this);
    }
    get pointBounds() {
      const {props:{points}} = this;
      return BoundsUtils.getBoundsFromPoints(points);
    }
    get rotatedPoints() {
      const {props:{point, points, rotation}, center} = this;
      if (!rotation) {
        return points;
      }
      const relativeCenter = Vec.sub(center, point);
      return points.map(point2 => Vec.rotWith(point2, relativeCenter, rotation));
    }
  };
  __publicField(TLDrawShape, "id", "draw");
  __publicField(TLDrawShape, "defaultProps", {id:"draw", type:"draw", parentId:"page", point:[0, 0], points:[], isComplete:!1});
  __decorateClass([computed], TLDrawShape.prototype, "pointBounds", 1);
  __decorateClass([computed], TLDrawShape.prototype, "rotatedPoints", 1);
  var TLEllipseShape = class extends TLBoxShape {
    constructor(props = {}) {
      super(props);
      __publicField(this, "getBounds", () => {
        const {props:{point:[x2, y2], size:[w2, h2]}} = this;
        return BoundsUtils.getRotatedEllipseBounds(x2, y2, w2 / 2, h2 / 2, 0);
      });
      __publicField(this, "getRotatedBounds", () => {
        const {props:{point:[x2, y2], size:[w2, h2], rotation}} = this;
        return BoundsUtils.getRotatedEllipseBounds(x2, y2, w2 / 2, h2 / 2, rotation);
      });
      __publicField(this, "hitTestPoint", point => {
        const {props:{size, rotation}, center} = this;
        return PointUtils.pointInEllipse(point, center, size[0], size[1], rotation || 0);
      });
      __publicField(this, "hitTestLineSegment", (A3, B3) => {
        const {props:{size:[w2, h2], rotation = 0}, center} = this;
        return intersectLineSegmentEllipse(A3, B3, center, w2, h2, rotation).didIntersect;
      });
      __publicField(this, "hitTestBounds", bounds => {
        const {props:{size:[w2, h2], rotation = 0}, rotatedBounds} = this;
        var JSCompiler_temp;
        if (!(JSCompiler_temp = BoundsUtils.boundsContain(bounds, rotatedBounds))) {
          const {minX, minY, width, height} = bounds;
          JSCompiler_temp = 0 < intersectEllipseRectangle(this.center, w2 / 2, h2 / 2, rotation, [minX, minY], [width, height]).length;
        }
        return JSCompiler_temp;
      });
      makeObservable(this);
    }
  };
  __publicField(TLEllipseShape, "id", "ellipse");
  __publicField(TLEllipseShape, "defaultProps", {id:"ellipse", type:"ellipse", parentId:"page", point:[0, 0], size:[100, 100]});
  var TLImageShape = class extends TLBoxShape {
    constructor(props = {}) {
      super(props);
      __publicField(this, "onResetBounds", info => {
        const {clipping, size, point} = this.props;
        if (clipping) {
          const [t, r2, b3, l3] = Array.isArray(clipping) ? clipping : [clipping, clipping, clipping, clipping];
          return this.update({clipping:0, point:[point[0] - l3, point[1] - t], size:[size[0] + (l3 - r2), size[1] + (t - b3)]});
        }
        if (info.asset) {
          const {size:[w2, h2]} = info.asset;
          this.update({clipping:0, point:[point[0] + size[0] / 2 - w2 / 2, point[1] + size[1] / 2 - h2 / 2], size:[w2, h2]});
        }
        return this;
      });
      __publicField(this, "onResize", (initialProps, info) => {
        const {bounds, clip, scale} = info;
        ({clipping:info} = this.props);
        const {clipping:iClipping} = initialProps;
        if (clip) {
          const {point:[x2, y2], size:[w2, h2]} = initialProps, [t, r2, b3, l3] = iClipping ? Array.isArray(iClipping) ? iClipping : [iClipping, iClipping, iClipping, iClipping] : [0, 0, 0, 0];
          info = [t + (bounds.minY - y2), r2 + (bounds.maxX - (x2 + w2)), b3 + (bounds.maxY - (y2 + h2)), l3 + (bounds.minX - x2)];
        } else {
          void 0 !== iClipping && (info = Array.isArray(iClipping) ? iClipping : [iClipping, iClipping, iClipping, iClipping], info = [info[0] * scale[1], info[1] * scale[0], info[2] * scale[1], info[3] * scale[0]]);
        }
        if (info && Array.isArray(info)) {
          const c2 = info;
          c2.every((v2, i2) => 0 === i2 || v2 === c2[i2 - 1]) && (info = c2[0]);
        }
        return this.update({point:[bounds.minX, bounds.minY], size:[Math.max(1, bounds.width), Math.max(1, bounds.height)], clipping:info});
      });
      makeObservable(this);
    }
  };
  __publicField(TLImageShape, "id", "ellipse");
  __publicField(TLImageShape, "defaultProps", {id:"ellipse", type:"ellipse", parentId:"page", point:[0, 0], size:[100, 100], clipping:0, objectFit:"none", assetId:""});
  var _TLPolylineShape = class extends TLShape {
    constructor(props = {}) {
      super(props);
      __publicField(this, "getBounds", () => {
        const {points, props:{point}} = this;
        return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(points), point);
      });
      __publicField(this, "getRotatedBounds", () => {
        const {rotatedPoints, props:{point}} = this;
        return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedPoints), point);
      });
      __publicField(this, "normalizedHandles", []);
      __publicField(this, "onResizeStart", () => {
        var _a3;
        const {props:{handles}, bounds} = this;
        this.scale = [...(null != (_a3 = this.props.scale) ? _a3 : [1, 1])];
        const size = [bounds.width, bounds.height];
        this.normalizedHandles = Object.values(handles).map(h2 => Vec.divV(h2.point, size));
        return this;
      });
      __publicField(this, "onResize", (initialProps, info) => {
        const {bounds, scale:[scaleX, scaleY]} = info, {props:{handles}, normalizedHandles} = this, size = [bounds.width, bounds.height];
        initialProps = [...this.scale];
        0 > scaleX && (initialProps[0] *= -1);
        0 > scaleY && (initialProps[1] *= -1);
        return this.update({point:[bounds.minX, bounds.minY], handles:Object.values(handles).map((handle, i2) => __spreadProps(__spreadValues({}, handle), {point:Vec.mulV(normalizedHandles[i2], size)})), scale:initialProps});
      });
      __publicField(this, "hitTestPoint", point => {
        const {points} = this;
        return PointUtils.pointNearToPolyline(Vec.sub(point, this.props.point), points);
      });
      __publicField(this, "hitTestLineSegment", (A3, B3) => {
        const {bounds, points, props:{point}} = this;
        if (PointUtils.pointInBounds(A3, bounds) || PointUtils.pointInBounds(B3, bounds) || 0 < intersectBoundsLineSegment(bounds, A3, B3).length) {
          const rA = Vec.sub(A3, point), rB = Vec.sub(B3, point);
          return intersectLineSegmentPolyline(rA, rB, points).didIntersect || !!points.find(point2 => 5 > Vec.dist(rA, point2) || 5 > Vec.dist(rB, point2));
        }
        return !1;
      });
      __publicField(this, "hitTestBounds", bounds => {
        const {rotatedBounds, points, props:{point}} = this, oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(point));
        return BoundsUtils.boundsContain(bounds, rotatedBounds) || points.every(vert => PointUtils.pointInBounds(vert, oBounds)) || BoundsUtils.boundsCollide(bounds, rotatedBounds) && 0 < intersectRectanglePolyline([oBounds.minX, oBounds.minY], [oBounds.width, oBounds.height], points).length;
      });
      __publicField(this, "validateProps", props => {
        props.point && (props.point = [0, 0]);
        void 0 !== props.handles && 1 > Object.values(props.handles).length && (props.handles = _TLPolylineShape.defaultProps.handles);
        return props;
      });
      makeObservable(this);
    }
    get points() {
      return Object.values(this.props.handles).map(h2 => h2.point);
    }
    get centroid() {
      const {points} = this;
      return _PolygonUtils.getPolygonCentroid(points);
    }
    get rotatedPoints() {
      const {centroid, props:{handles, rotation}} = this;
      return rotation ? Object.values(handles).map(h2 => Vec.rotWith(h2.point, centroid, rotation)) : this.points;
    }
  }, TLPolylineShape = _TLPolylineShape;
  __publicField(TLPolylineShape, "id", "polyline");
  __publicField(TLPolylineShape, "defaultProps", {id:"polyline", type:"polyline", parentId:"page", point:[0, 0], handles:{}});
  __decorateClass([computed], TLPolylineShape.prototype, "points", 1);
  __decorateClass([computed], TLPolylineShape.prototype, "centroid", 1);
  __decorateClass([computed], TLPolylineShape.prototype, "rotatedPoints", 1);
  var _TLLineShape = class extends TLPolylineShape {
    constructor(props = {}) {
      super(props);
      __publicField(this, "hideResizeHandles", !0);
      __publicField(this, "hideRotateHandle", !0);
      __publicField(this, "validateProps", props => {
        props.point && (props.point = [0, 0]);
        void 0 !== props.handles && 1 > Object.values(props.handles).length && (props.handles = _TLLineShape.defaultProps.handles);
        return props;
      });
      __publicField(this, "getHandlesChange", (shape, handles) => {
        var nextHandles = deepMerge(shape.handles, handles);
        nextHandles = deepMerge(nextHandles, {start:{point:src_default.toFixed(nextHandles.start.point)}, end:{point:src_default.toFixed(nextHandles.end.point)}});
        if (!src_default.isEqual(nextHandles.start.point, nextHandles.end.point)) {
          handles = {point:shape.point, handles:deepCopy(nextHandles)};
          shape = shape.point;
          nextHandles = BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(Object.values(nextHandles).map(h2 => h2.point)), handles.point);
          var offset = src_default.sub([nextHandles.minX, nextHandles.minY], shape);
          src_default.isEqual(offset, [0, 0]) || (Object.values(handles.handles).forEach(handle => {
            handle.point = src_default.toFixed(src_default.sub(handle.point, offset));
          }), handles.point = src_default.toFixed(src_default.add(handles.point, offset)));
          return handles;
        }
      });
      makeObservable(this);
    }
  }, TLLineShape = _TLLineShape;
  __publicField(TLLineShape, "id", "line");
  __publicField(TLLineShape, "defaultProps", {id:"line", type:"line", parentId:"page", point:[0, 0], handles:{start:{id:"start", canBind:!0, point:[0, 0]}, end:{id:"end", canBind:!0, point:[1, 1]}}});
  var TLPolygonShape = class extends TLBoxShape {
    constructor(props = {}) {
      super(props);
      __publicField(this, "getRotatedBounds", () => {
        const {rotatedVertices, props:{point}, offset} = this;
        return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedVertices), Vec.add(point, offset));
      });
      __publicField(this, "hitTestPoint", point => {
        const {vertices} = this;
        return PointUtils.pointInPolygon(Vec.add(point, this.props.point), vertices);
      });
      __publicField(this, "hitTestLineSegment", (A3, B3) => {
        const {vertices, props:{point}} = this;
        return intersectLineSegmentPolyline(Vec.sub(A3, point), Vec.sub(B3, point), vertices).didIntersect;
      });
      __publicField(this, "hitTestBounds", bounds => {
        const {rotatedBounds, offset, rotatedVertices, props:{point}} = this, oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(Vec.add(point, offset)));
        return BoundsUtils.boundsContain(bounds, rotatedBounds) || rotatedVertices.every(vert => PointUtils.pointInBounds(vert, oBounds)) || 0 < intersectRectanglePolygon([oBounds.minX, oBounds.minY], [oBounds.width, oBounds.height], rotatedVertices).length;
      });
      __publicField(this, "validateProps", props => {
        props.point && (props.point = [0, 0]);
        void 0 !== props.sides && 3 > props.sides && (props.sides = 3);
        return props;
      });
      makeObservable(this);
    }
    get vertices() {
      return this.getVertices();
    }
    get pageVertices() {
      const {props:{point}, vertices} = this;
      return vertices.map(vert => Vec.add(vert, point));
    }
    get centroid() {
      const {vertices} = this;
      return _PolygonUtils.getPolygonCentroid(vertices);
    }
    get rotatedVertices() {
      const {vertices, centroid, props:{rotation}} = this;
      return rotation ? vertices.map(v2 => Vec.rotWith(v2, centroid, rotation)) : vertices;
    }
    get offset() {
      const {props:{size:[w2, h2]}} = this, center = BoundsUtils.getBoundsCenter(BoundsUtils.getBoundsFromPoints(this.vertices));
      return Vec.sub(Vec.div([w2, h2], 2), center);
    }
    getVertices(padding = 0) {
      const {ratio, sides, size} = this.props;
      return 3 === sides ? _PolygonUtils.getTriangleVertices(size, padding, ratio) : _PolygonUtils.getPolygonVertices(size, sides, padding, ratio);
    }
  };
  __publicField(TLPolygonShape, "id", "polygon");
  __publicField(TLPolygonShape, "defaultProps", {id:"polygon", type:"polygon", parentId:"page", point:[0, 0], size:[100, 100], sides:5, ratio:1, isFlippedY:!1});
  __decorateClass([computed], TLPolygonShape.prototype, "vertices", 1);
  __decorateClass([computed], TLPolygonShape.prototype, "pageVertices", 1);
  __decorateClass([computed], TLPolygonShape.prototype, "centroid", 1);
  __decorateClass([computed], TLPolygonShape.prototype, "rotatedVertices", 1);
  __decorateClass([computed], TLPolygonShape.prototype, "offset", 1);
  var TLTextShape = class extends TLBoxShape {
    constructor(props = {}) {
      super(props);
      __publicField(this, "canEdit", !0);
      __publicField(this, "canFlip", !1);
      makeObservable(this);
    }
  };
  __publicField(TLTextShape, "id", "text");
  __publicField(TLTextShape, "defaultProps", {id:"text", type:"text", parentId:"page", isSizeLocked:!0, point:[0, 0], size:[16, 32], text:""});
  var TLGroupShape = class extends TLBoxShape {
    constructor(props = {}) {
      super(props);
      __publicField(this, "canEdit", !1);
      __publicField(this, "canFlip", !1);
      __publicField(this, "getBounds", () => 0 === this.shapes.length ? (useApp().deleteShapes([this.id]), {minX:0, minY:0, maxX:0, maxY:0, width:0, height:0}) : BoundsUtils.getCommonBounds(this.shapes.map(s2 => s2.getBounds())));
      makeObservable(this);
      this.canResize = [!1, !1];
    }
    getShapes() {
      throw Error("will be implemented other places");
    }
    get shapes() {
      return this.getShapes();
    }
  };
  __publicField(TLGroupShape, "id", "group");
  __publicField(TLGroupShape, "defaultProps", {id:"group", type:"group", parentId:"page", point:[0, 0], size:[0, 0], children:[]});
  __decorateClass([computed], TLGroupShape.prototype, "shapes", 1);
  var TLRootState = class {
    constructor() {
      __publicField(this, "_id");
      __publicField(this, "_initial");
      __publicField(this, "_states");
      __publicField(this, "_isActive", !1);
      __publicField(this, "cursor");
      __publicField(this, "_disposables", []);
      __publicField(this, "children", new Map([]));
      __publicField(this, "registerStates", stateClasses => {
        stateClasses.forEach(StateClass => this.children.set(StateClass.id, new StateClass(this, this)));
        return this;
      });
      __publicField(this, "deregisterStates", states => {
        states.forEach(StateClass => {
          var _a3;
          null == (_a3 = this.children.get(StateClass.id)) || _a3.dispose();
          this.children.delete(StateClass.id);
        });
        return this;
      });
      __publicField(this, "currentState", {});
      __publicField(this, "transition", (id3, data = {}) => {
        if (0 === this.children.size) {
          throw Error(`Tool ${this.id} has no states, cannot transition to ${id3}.`);
        }
        const nextState = this.children.get(id3), prevState = this.currentState;
        if (!nextState) {
          throw Error(`Could not find a state named ${id3}.`);
        }
        transaction(() => {
          this.currentState ? (prevState._events.onExit(__spreadProps(__spreadValues({}, data), {toId:id3})), prevState.dispose(), this.setCurrentState(nextState), this._events.onTransition(__spreadProps(__spreadValues({}, data), {fromId:prevState.id, toId:id3})), nextState._events.onEnter(__spreadProps(__spreadValues({}, data), {fromId:prevState.id}))) : (this.currentState = nextState, nextState._events.onEnter(__spreadProps(__spreadValues({}, data), {fromId:""})));
        });
        return this;
      });
      __publicField(this, "isIn", path => {
        path = path.split(".").reverse();
        let state = this;
        for (; 0 < path.length;) {
          const id3 = path.pop();
          if (!id3) {
            return !0;
          }
          if (state.currentState.id === id3) {
            if (0 === path.length) {
              return !0;
            }
            state = state.currentState;
          } else {
            break;
          }
        }
        return !1;
      });
      __publicField(this, "isInAny", (...paths) => paths.some(this.isIn));
      __publicField(this, "forwardEvent", (eventName, ...args) => {
        var _a3, _b;
        (null == (_b = null == (_a3 = this.currentState) ? void 0 : _a3._events) ? 0 : _b[eventName]) && transaction(() => {
          var _a4;
          return null == (_a4 = this.currentState._events) ? void 0 : _a4[eventName](...args);
        });
      });
      __publicField(this, "_events", {onTransition:info => {
        var _a3;
        null == (_a3 = this.onTransition) || _a3.call(this, info);
      }, onEnter:info => {
        var _a3;
        this._isActive = !0;
        this.initial && this.transition(this.initial, info);
        null == (_a3 = this.onEnter) || _a3.call(this, info);
      }, onExit:info => {
        var _a3, _b, _c;
        this._isActive = !1;
        null == (_b = null == (_a3 = this.currentState) ? void 0 : _a3.onExit) || _b.call(_a3, {toId:"parent"});
        null == (_c = this.onExit) || _c.call(this, info);
      }, onPointerDown:(info, event) => {
        var _a3;
        null == (_a3 = this.onPointerDown) || _a3.call(this, info, event);
        this.forwardEvent("onPointerDown", info, event);
      }, onPointerUp:(info, event) => {
        var _a3;
        null == (_a3 = this.onPointerUp) || _a3.call(this, info, event);
        this.forwardEvent("onPointerUp", info, event);
      }, onPointerMove:(info, event) => {
        var _a3;
        null == (_a3 = this.onPointerMove) || _a3.call(this, info, event);
        this.forwardEvent("onPointerMove", info, event);
      }, onPointerEnter:(info, event) => {
        var _a3;
        null == (_a3 = this.onPointerEnter) || _a3.call(this, info, event);
        this.forwardEvent("onPointerEnter", info, event);
      }, onPointerLeave:(info, event) => {
        var _a3;
        null == (_a3 = this.onPointerLeave) || _a3.call(this, info, event);
        this.forwardEvent("onPointerLeave", info, event);
      }, onDoubleClick:(info, event) => {
        var _a3;
        null == (_a3 = this.onDoubleClick) || _a3.call(this, info, event);
        this.forwardEvent("onDoubleClick", info, event);
      }, onKeyDown:(info, event) => {
        var _a3;
        this._events.onModifierKey(info, event);
        null == (_a3 = this.onKeyDown) || _a3.call(this, info, event);
        this.forwardEvent("onKeyDown", info, event);
      }, onKeyUp:(info, event) => {
        var _a3;
        this._events.onModifierKey(info, event);
        null == (_a3 = this.onKeyUp) || _a3.call(this, info, event);
        this.forwardEvent("onKeyUp", info, event);
      }, onPinchStart:(info, event) => {
        var _a3;
        null == (_a3 = this.onPinchStart) || _a3.call(this, info, event);
        this.forwardEvent("onPinchStart", info, event);
      }, onPinch:(info, event) => {
        var _a3;
        null == (_a3 = this.onPinch) || _a3.call(this, info, event);
        this.forwardEvent("onPinch", info, event);
      }, onPinchEnd:(info, event) => {
        var _a3;
        null == (_a3 = this.onPinchEnd) || _a3.call(this, info, event);
        this.forwardEvent("onPinchEnd", info, event);
      }, onModifierKey:(info, event) => {
        switch(event.key) {
          case "Shift":
          case "Alt":
          case "Ctrl":
          case "Meta":
            this._events.onPointerMove(info, event);
        }
      }});
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
      const initial = this.constructor.initial, states = this.constructor.states;
      this._id = this.constructor.id;
      this._initial = initial;
      this._states = states;
    }
    dispose() {
      this._disposables.forEach(disposable => disposable());
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
      return Array.from(this.children.values()).flatMap(state => [state, ...state.descendants]);
    }
    setCurrentState(state) {
      this.currentState = state;
    }
  };
  __publicField(TLRootState, "id");
  __publicField(TLRootState, "shortcuts");
  __decorateClass([observable], TLRootState.prototype, "currentState", 2);
  __decorateClass([action], TLRootState.prototype, "setCurrentState", 1);
  var TLState = class extends TLRootState {
    constructor(parent, root) {
      var _a3, _b;
      super();
      __publicField(this, "_root");
      __publicField(this, "_parent");
      __publicField(this, "children", new Map([]));
      __publicField(this, "registerStates", stateClasses => {
        stateClasses.forEach(StateClass => this.children.set(StateClass.id, new StateClass(this, this._root)));
        return this;
      });
      __publicField(this, "deregisterStates", states => {
        states.forEach(StateClass => {
          var _a3;
          null == (_a3 = this.children.get(StateClass.id)) || _a3.dispose();
          this.children.delete(StateClass.id);
        });
        return this;
      });
      this._parent = parent;
      this._root = root;
      this.states && 0 < this.states.length && (this.registerStates(this.states), parent = null != (_a3 = this.initial) ? _a3 : this.states[0].id, _a3 = this.children.get(parent)) && (this.setCurrentState(_a3), null == (_b = this.currentState) || _b._events.onEnter({fromId:"initial"}));
      makeObservable(this);
    }
    get root() {
      return this._root;
    }
    get parent() {
      return this._parent;
    }
    get ascendants() {
      return this.parent ? "ascendants" in this.parent ? [...this.parent.ascendants, this] : [this.parent, this] : [this];
    }
  };
  __publicField(TLState, "cursor");
  var TLTool = class extends TLState {
    constructor() {
      super(...arguments);
      __publicField(this, "isLocked", !1);
      __publicField(this, "previous");
      __publicField(this, "onEnter", ({fromId}) => {
        this.previous = fromId;
        this.cursor && this.app.cursors.setCursor(this.cursor);
      });
      __publicField(this, "onTransition", info => {
        ({toId:info} = info);
        info = this.children.get(info);
        this.app.cursors.reset();
        info.cursor ? this.app.cursors.setCursor(info.cursor) : this.cursor && this.app.cursors.setCursor(this.cursor);
      });
    }
    get app() {
      return this.root;
    }
  }, TLToolState = class extends TLState {
    get app() {
      return this.root;
    }
    get tool() {
      return this.parent;
    }
  }, CreatingState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "crosshair");
      __publicField(this, "creatingShape");
      __publicField(this, "aspectRatio");
      __publicField(this, "initialBounds", {});
      __publicField(this, "onEnter", () => {
        const {currentPage, inputs:{originPoint, currentPoint}} = this.app;
        var {Shape:Shape5} = this.tool;
        Shape5 = new Shape5({id:v1_default(), type:Shape5.id, parentId:currentPage.id, point:[...originPoint], fill:this.app.settings.color, stroke:this.app.settings.color, size:src_default.abs(src_default.sub(currentPoint, originPoint))});
        this.initialBounds = {minX:originPoint[0], minY:originPoint[1], maxX:originPoint[0] + 1, maxY:originPoint[1] + 1, width:1, height:1};
        Shape5.canChangeAspectRatio || (Shape5.aspectRatio ? (this.aspectRatio = Shape5.aspectRatio, this.initialBounds.height = this.aspectRatio) : (this.aspectRatio = 1, this.initialBounds.height = 1), this.initialBounds.width = 1, this.initialBounds.maxY = this.initialBounds.minY + this.initialBounds.height);
        this.creatingShape = Shape5;
        this.creatingShape.setScaleLevel(this.app.settings.scaleLevel);
        this.app.currentPage.addShapes(Shape5);
        this.app.setSelectedShapes([Shape5]);
      });
      __publicField(this, "onPointerMove", info => {
        if (!info.order) {
          if (!this.creatingShape) {
            throw Error("Expected a creating shape.");
          }
          var {initialBounds} = this, {currentPoint, originPoint, shiftKey} = this.app.inputs;
          info = shiftKey || this.creatingShape.props.isAspectRatioLocked || !this.creatingShape.canChangeAspectRatio;
          initialBounds = BoundsUtils.getTransformedBoundingBox(initialBounds, "bottom_right_corner", src_default.sub(currentPoint, originPoint), 0, info);
          this.app.settings.snapToGrid && !info && (initialBounds = BoundsUtils.snapBoundsToGrid(initialBounds, 8));
          this.creatingShape.update({point:[initialBounds.minX, initialBounds.minY], size:[initialBounds.width, initialBounds.height]});
        }
      });
      __publicField(this, "onPointerUp", () => {
        this.tool.transition("idle");
        this.creatingShape ? (this.app.setSelectedShapes([this.creatingShape]), this.app.api.editShape(this.creatingShape)) : this.app.transition("select");
        this.app.persist();
      });
      __publicField(this, "onKeyDown", (info, e) => {
        switch(e.key) {
          case "Escape":
            if (!this.creatingShape) {
              throw Error("Expected a creating shape.");
            }
            this.app.deleteShapes([this.creatingShape]);
            this.tool.transition("idle");
        }
      });
    }
  };
  __publicField(CreatingState, "id", "creating");
  var IdleState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onPointerDown", (info, e) => {
        info.order || this.tool.transition("pointing");
      });
      __publicField(this, "onPinchStart", (...args) => {
        var _a3, _b;
        this.app.transition("select", {returnTo:this.app.currentState.id});
        null == (_b = (_a3 = this.app._events).onPinchStart) || _b.call(_a3, ...args);
      });
      __publicField(this, "onKeyDown", (info, e) => {
        switch(e.key) {
          case "Escape":
            this.app.transition("select");
        }
      });
    }
  };
  __publicField(IdleState, "id", "idle");
  var PointingState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onPointerMove", () => {
        const {currentPoint, originPoint} = this.app.inputs;
        5 < Vec.dist(currentPoint, originPoint) && !this.app.readOnly && (this.tool.transition("creating"), this.app.setSelectedShapes(this.app.currentPage.shapes));
      });
      __publicField(this, "onPointerUp", () => {
        this.tool.transition("idle");
      });
    }
  };
  __publicField(PointingState, "id", "pointing");
  var TLBoxTool = class extends TLTool {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "crosshair");
    }
  };
  __publicField(TLBoxTool, "id", "box");
  __publicField(TLBoxTool, "states", [IdleState, PointingState, CreatingState]);
  __publicField(TLBoxTool, "initial", "idle");
  var CreatingState3 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "shape", {});
      __publicField(this, "points", [[0, 0, 0.5]]);
      __publicField(this, "persistDebounced", debounce(this.app.persist, 200));
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
      __publicField(this, "onEnter", () => {
        var _a3;
        const {Shape:Shape5, previousShape} = this.tool;
        var {originPoint} = this.app.inputs;
        this.app.history.pause();
        if (this.app.inputs.shiftKey && previousShape) {
          this.shape = previousShape;
          var {shape} = this;
          var _b = shape.props.points[shape.props.points.length - 1];
          const nextPoint = Vec.sub(originPoint, shape.props.point).concat(null != (_a3 = originPoint[2]) ? _a3 : 0.5);
          this.points = [...shape.props.points, _b, _b];
          const len = Math.ceil(Vec.dist(_b, originPoint) / 16);
          for (let i2 = 0, t = i2 / (len - 1); i2 < len; i2++) {
            _a3 = this.points;
            originPoint = _a3.push;
            shape = Vec.lrp(_b, nextPoint, t);
            var a3 = _b[2];
            originPoint.call(_a3, shape.concat.call(shape, a3 + (nextPoint[2] - a3) * t));
          }
          this.addNextPoint(nextPoint);
        } else {
          this.tool.previousShape = void 0, this.points = [[0, 0, null != (_b = originPoint[2]) ? _b : 0.5]], this.shape = new Shape5({id:v1_default(), type:Shape5.id, parentId:this.app.currentPage.id, point:originPoint.slice(0, 2), points:this.points, isComplete:!1, fill:this.app.settings.color, stroke:this.app.settings.color}), this.shape.setScaleLevel(this.app.settings.scaleLevel), this.app.currentPage.addShapes(this.shape);
        }
      });
      __publicField(this, "onPointerMove", () => {
        const {shape} = this, {currentPoint, previousPoint} = this.app.inputs;
        Vec.isEqual(previousPoint, currentPoint) || this.addNextPoint(Vec.sub(currentPoint, shape.props.point).concat(currentPoint[2]));
      });
      __publicField(this, "onPointerUp", () => {
        if (!this.shape) {
          throw Error("Expected a creating shape.");
        }
        this.app.history.resume();
        this.shape.update({isComplete:!0, points:this.tool.simplify ? PointUtils.simplify2(this.points, this.tool.simplifyTolerance) : this.shape.props.points});
        this.tool.previousShape = this.shape;
        this.tool.transition("idle");
        let tool = this.app.selectedTool.id;
        "pencil" === tool || "highlighter" === tool ? this.persistDebounced() : this.app.persist();
      });
      __publicField(this, "onKeyDown", (info, e) => {
        switch(e.key) {
          case "Escape":
            if (!this.shape) {
              throw Error("Expected a creating shape.");
            }
            this.app.deleteShapes([this.shape]);
            this.tool.transition("idle");
        }
      });
    }
    addNextPoint(point) {
      const {shape} = this, offset = Vec.min(point, [0, 0]);
      this.points.push(point);
      0 > offset[0] || 0 > offset[1] ? (this.points = this.points.map(pt2 => Vec.sub(pt2, offset).concat(pt2[2])), shape.update({point:Vec.add(shape.props.point, offset), points:this.points})) : shape.update({points:this.points});
    }
  };
  __publicField(CreatingState3, "id", "creating");
  var IdleState3 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onPointerDown", (info, e) => {
        info.order || this.app.readOnly || this.tool.transition("creating");
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
      __publicField(this, "onKeyDown", (info, e) => {
        switch(e.key) {
          case "Escape":
            this.app.transition("select");
        }
      });
    }
  };
  __publicField(IdleState3, "id", "idle");
  var PinchingState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "origin", [0, 0]);
      __publicField(this, "prevDelta", [0, 0]);
      __publicField(this, "onEnter", info => {
        this.prevDelta = info.info.delta;
        this.origin = info.info.point;
      });
      __publicField(this, "onPinch", info => {
        this.app.viewport.pinchZoom(info.point, info.delta, info.delta[2]);
      });
      __publicField(this, "onPinchEnd", () => {
        this.tool.transition("idle");
      });
    }
  };
  __publicField(PinchingState, "id", "pinching");
  var TLDrawTool = class extends TLTool {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "crosshair");
      __publicField(this, "simplify", !0);
      __publicField(this, "simplifyTolerance", 1);
      __publicField(this, "previousShape");
      __publicField(this, "onPinchStart", (info, event) => {
        this.transition("pinching", {info, event});
      });
    }
  };
  __publicField(TLDrawTool, "id", "draw");
  __publicField(TLDrawTool, "states", [IdleState3, CreatingState3, PinchingState]);
  __publicField(TLDrawTool, "initial", "idle");
  var ErasingState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "points", [[0, 0, 0.5]]);
      __publicField(this, "hitShapes", new Set());
      __publicField(this, "onEnter", () => {
        const {originPoint} = this.app.inputs;
        this.points = [originPoint];
        this.hitShapes.clear();
      });
      __publicField(this, "onPointerMove", () => {
        const {currentPoint, previousPoint} = this.app.inputs;
        Vec.isEqual(previousPoint, currentPoint) || (this.points.push(currentPoint), this.app.shapesInViewport.filter(shape => shape.hitTestLineSegment(previousPoint, currentPoint)).forEach(shape => this.hitShapes.add(shape)), this.app.setErasingShapes(Array.from(this.hitShapes.values())));
      });
      __publicField(this, "onPointerUp", () => {
        this.app.deleteShapes(Array.from(this.hitShapes.values()));
        this.tool.transition("idle");
      });
      __publicField(this, "onKeyDown", (info, e) => {
        switch(e.key) {
          case "Escape":
            this.app.setErasingShapes([]), this.tool.transition("idle");
        }
      });
    }
  };
  __publicField(ErasingState, "id", "erasing");
  var IdleState4 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onPointerDown", (info, e) => {
        info.order || this.tool.transition("pointing");
      });
      __publicField(this, "onPinchStart", (...args) => {
        var _a3, _b;
        this.app.transition("select", {returnTo:this.app.currentState.id});
        null == (_b = (_a3 = this.app._events).onPinchStart) || _b.call(_a3, ...args);
      });
      __publicField(this, "onKeyDown", (info, e) => {
        switch(e.key) {
          case "Escape":
            this.app.transition("select");
        }
      });
    }
  };
  __publicField(IdleState4, "id", "idle");
  var PointingState2 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onEnter", () => {
        const {currentPoint} = this.app.inputs;
        this.app.setErasingShapes(this.app.shapesInViewport.filter(shape => shape.hitTestPoint(currentPoint)));
      });
      __publicField(this, "onPointerMove", () => {
        const {currentPoint, originPoint} = this.app.inputs;
        5 < Vec.dist(currentPoint, originPoint) && (this.tool.transition("erasing"), this.app.setSelectedShapes([]));
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
  var TLEraseTool = class extends TLTool {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "crosshair");
    }
  };
  __publicField(TLEraseTool, "id", "erase");
  __publicField(TLEraseTool, "states", [IdleState4, PointingState2, ErasingState]);
  __publicField(TLEraseTool, "initial", "idle");
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
        const {inputs:{shiftKey, previousPoint, originPoint, currentPoint, modKey:modKey2, altKey}, settings:{snapToGrid}} = this.app;
        var shape = this.app.getShapeById(this.initialShape.id), {handles} = this.initialShape, handleId = this.handleId, otherHandleId = "start" === this.handleId ? "end" : "start";
        if (!src_default.isEqual(previousPoint, currentPoint)) {
          var delta = src_default.sub(currentPoint, originPoint);
          if (shiftKey) {
            var A3 = handles[otherHandleId].point, C3 = src_default.add(handles[handleId].point, delta), angle = src_default.angle(A3, C3);
            A3 = src_default.rotWith(C3, A3, GeomUtils.snapAngleToSegments(angle, 24) - angle);
            delta = src_default.add(delta, src_default.sub(A3, C3));
          }
          delta = src_default.add(handles[handleId].point, delta);
          handles = {[handleId]:__spreadProps(__spreadValues({}, handles[handleId]), {point:snapToGrid ? src_default.snap(delta, 8) : src_default.toFixed(delta), bindingId:void 0})};
          var updated = this.currentShape.getHandlesChange(this.initialShape, handles);
          if (updated) {
            handles = deepMerge(shape.props, updated);
            var JSCompiler_object_inline_bindings_5440 = {}, draggedBinding;
            handleId = handles.handles[handleId];
            otherHandleId = handles.handles[otherHandleId];
            if (this.startBindingShapeId) {
              var nextStartBinding;
              if (delta = this.app.getShapeById(this.startBindingShapeId)) {
                C3 = delta.getCenter();
                A3 = handles.handles.end;
                var rayPoint = src_default.add(handles.handles.start.point, handles.point);
                src_default.isEqual(rayPoint, C3) && rayPoint[1]++;
                angle = delta.hitTestPoint(currentPoint);
                rayPoint = src_default.uni(src_default.sub(rayPoint, C3));
                const hasStartBinding = void 0 !== this.app.currentPage.bindings[this.newStartBindingId];
                modKey2 || delta.hitTestPoint(src_default.add(handles.point, A3.point)) || (nextStartBinding = findBindingPoint(shape.props, delta, "start", this.newStartBindingId, C3, C3, rayPoint, angle));
                nextStartBinding && !hasStartBinding ? (JSCompiler_object_inline_bindings_5440[this.newStartBindingId] = nextStartBinding, handles.handles.start.bindingId = nextStartBinding.id) : !nextStartBinding && hasStartBinding && (console.log("removing start binding"), delete JSCompiler_object_inline_bindings_5440[this.newStartBindingId], handles.handles.start.bindingId = void 0);
              }
            }
            if (!modKey2) {
              nextStartBinding = src_default.add(otherHandleId.point, handles.point);
              otherHandleId = src_default.add(handleId.point, handles.point);
              handleId = src_default.uni(src_default.sub(otherHandleId, nextStartBinding));
              const startPoint = src_default.add(handles.point, handles.handles.start.point), endPoint = src_default.add(handles.point, handles.handles.end.point);
              delta = this.bindableShapeIds.map(id3 => this.app.getShapeById(id3)).sort((a3, b3) => b3.nonce - a3.nonce).filter(shape2 => ![startPoint, endPoint].every(point => shape2.hitTestPoint(point)));
              for (const target of delta) {
                if (draggedBinding = findBindingPoint(shape.props, target, this.handleId, this.draggedBindingId, otherHandleId, nextStartBinding, handleId, altKey)) {
                  break;
                }
              }
            }
            draggedBinding ? (JSCompiler_object_inline_bindings_5440[this.draggedBindingId] = draggedBinding, handles = deepMerge(handles, {handles:{[this.handleId]:{bindingId:this.draggedBindingId}}})) : (shape = shape.props.handles[this.handleId].bindingId, void 0 !== shape && (delete JSCompiler_object_inline_bindings_5440[shape], handles = deepMerge(handles, {handles:{[this.handleId]:{bindingId:void 0}}})));
            updated = this.currentShape.getHandlesChange(handles, handles.handles);
            transaction(() => {
              var _a3;
              if (updated) {
                this.currentShape.update(updated);
                this.app.currentPage.updateBindings(JSCompiler_object_inline_bindings_5440);
                const bindingShapes = Object.values(null != (_a3 = updated.handles) ? _a3 : {}).map(handle => handle.bindingId).map(id3 => this.app.currentPage.bindings[id3]).filter(Boolean).flatMap(binding => [binding.toId, binding.fromId].filter(Boolean));
                this.app.setBindingShapes(bindingShapes);
              }
            });
          }
        }
      });
      __publicField(this, "onPointerUp", () => {
        this.tool.transition("idle");
        this.currentShape && this.app.setSelectedShapes([this.currentShape]);
        this.app.transition("select");
        this.app.persist();
      });
      __publicField(this, "onExit", () => {
        this.app.clearBindingShape();
        this.app.history.resume();
        this.app.persist();
      });
      __publicField(this, "onKeyDown", (info, e) => {
        switch(e.key) {
          case "Escape":
            this.app.deleteShapes([this.currentShape]), this.tool.transition("idle");
        }
      });
    }
  };
  __publicField(TLBaseLineBindingState, "id", "creating");
  var CreatingState4 = class extends TLBaseLineBindingState {
    constructor() {
      super(...arguments);
      __publicField(this, "onEnter", () => {
        var _a3;
        this.app.history.pause();
        this.newStartBindingId = v1_default();
        this.draggedBindingId = v1_default();
        this.bindableShapeIds = this.app.currentPage.getBindableShapes();
        var {Shape:Shape5} = this.tool;
        const {originPoint} = this.app.inputs;
        Shape5 = new Shape5(__spreadProps(__spreadValues({}, Shape5.defaultProps), {id:v1_default(), type:Shape5.id, parentId:this.app.currentPage.id, point:this.app.settings.snapToGrid ? src_default.snap(originPoint, 8) : originPoint, fill:this.app.settings.color, stroke:this.app.settings.color, scaleLevel:this.app.settings.scaleLevel}));
        this.initialShape = toJS(Shape5.props);
        this.currentShape = Shape5;
        this.app.currentPage.addShapes(Shape5);
        this.app.setSelectedShapes([Shape5]);
        if (this.startBindingShapeId = null == (_a3 = this.bindableShapeIds.map(id3 => this.app.getShapeById(id3)).filter(s2 => PointUtils.pointInBounds(originPoint, s2.bounds))[0]) ? void 0 : _a3.id) {
          this.bindableShapeIds.splice(this.bindableShapeIds.indexOf(this.startBindingShapeId), 1), this.app.setBindingShapes([this.startBindingShapeId]);
        }
      });
    }
  };
  __publicField(CreatingState4, "id", "creating");
  var IdleState5 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onPointerDown", (info, e) => {
        info.order || this.tool.transition("pointing");
      });
      __publicField(this, "onPinchStart", (...args) => {
        var _a3, _b;
        this.app.transition("select", {returnTo:this.app.currentState.id});
        null == (_b = (_a3 = this.app._events).onPinchStart) || _b.call(_a3, ...args);
      });
      __publicField(this, "onKeyDown", (info, e) => {
        switch(e.key) {
          case "Escape":
            this.app.transition("select");
        }
      });
      __publicField(this, "onPointerEnter", info => {
        if (!info.order) {
          switch(info.type) {
            case "shape":
              this.app.setHoveredShape(info.shape.id);
              break;
            case "selection":
              "background" !== info.handle && "center" !== info.handle && this.tool.transition("hoveringSelectionHandle", info);
          }
        }
      });
      __publicField(this, "onPointerLeave", info => {
        info.order || "shape" === info.type && this.app.hoveredId && this.app.setHoveredShape(void 0);
      });
    }
  };
  __publicField(IdleState5, "id", "idle");
  var PointingState3 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onPointerMove", () => {
        const {currentPoint, originPoint} = this.app.inputs;
        5 < Vec.dist(currentPoint, originPoint) && !this.app.readOnly && (this.tool.transition("creating"), this.app.setSelectedShapes(this.app.currentPage.shapes));
      });
    }
  };
  __publicField(PointingState3, "id", "pointing");
  var TLLineTool = class extends TLTool {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "crosshair");
    }
  };
  __publicField(TLLineTool, "id", "line");
  __publicField(TLLineTool, "states", [IdleState5, PointingState3, CreatingState4]);
  __publicField(TLLineTool, "initial", "idle");
  var CreatingState5 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "crosshair");
      __publicField(this, "creatingShape");
      __publicField(this, "aspectRatio");
      __publicField(this, "initialBounds", {});
      __publicField(this, "onEnter", () => {
        const {currentPage, inputs:{originPoint}} = this.app, {Shape:Shape5} = this.tool, shape = new Shape5({id:v1_default(), type:Shape5.id, parentId:currentPage.id, point:[...originPoint], text:"", size:[16, 32], isSizeLocked:!0, fill:this.app.settings.color, stroke:this.app.settings.color});
        this.creatingShape = shape;
        this.creatingShape.setScaleLevel(this.app.settings.scaleLevel);
        transaction(() => {
          this.app.currentPage.addShapes(shape);
          const point = this.app.settings.snapToGrid ? src_default.snap([...originPoint], 8) : originPoint, {bounds} = shape;
          shape.update({point:src_default.sub(point, [bounds.width / 2, bounds.height / 2])});
          this.app.transition("select");
          this.app.setSelectedShapes([shape]);
          this.app.currentState.transition("editingShape", {type:"shape", shape:this.creatingShape, order:0});
        });
      });
    }
  };
  __publicField(CreatingState5, "id", "creating");
  var IdleState6 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onPointerDown", (info, e) => {
        info.order || this.app.readOnly || this.tool.transition("creating");
      });
      __publicField(this, "onPinchStart", (...args) => {
        var _a3, _b;
        this.app.transition("select", {returnTo:this.app.currentState.id});
        null == (_b = (_a3 = this.app._events).onPinchStart) || _b.call(_a3, ...args);
      });
      __publicField(this, "onKeyDown", (info, e) => {
        switch(e.key) {
          case "Escape":
            this.app.transition("select");
        }
      });
    }
  };
  __publicField(IdleState6, "id", "idle");
  var TLTextTool = class extends TLTool {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "crosshair");
    }
  };
  __publicField(TLTextTool, "id", "box");
  __publicField(TLTextTool, "states", [IdleState6, CreatingState5]);
  __publicField(TLTextTool, "initial", "idle");
  var import_rbush = __toESM(require_rbush_min()), TLBush = class extends import_rbush.default {
    constructor() {
      super(...arguments);
      __publicField(this, "toBBox", shape => shape.rotatedBounds);
    }
  }, BrushingState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "initialSelectedIds", []);
      __publicField(this, "initialSelectedShapes", []);
      __publicField(this, "tree", new TLBush());
      __publicField(this, "onEnter", () => {
        const {selectedShapes, currentPage, selectedIds} = this.app;
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
        const {inputs:{shiftKey, ctrlKey, originPoint, currentPoint}} = this.app, brushBounds = BoundsUtils.getBoundsFromPoints([currentPoint, originPoint], 0);
        this.app.setBrush(brushBounds);
        const hits = [...(new Set(this.tree.search(brushBounds).filter(shape => ctrlKey ? BoundsUtils.boundsContain(brushBounds, shape.rotatedBounds) : shape.hitTestBounds(brushBounds)).filter(shape => "group" !== shape.type).map(shape => {
          var _a3;
          return null != (_a3 = this.app.getParentGroup(shape)) ? _a3 : shape;
        })))];
        shiftKey ? hits.every(hit => this.initialSelectedShapes.includes(hit)) ? this.app.setSelectedShapes(this.initialSelectedShapes.filter(hit => !hits.includes(hit))) : this.app.setSelectedShapes([...(new Set([...this.initialSelectedShapes, ...hits]))]) : this.app.setSelectedShapes(hits);
        this.app.viewport.panToPointWhenNearBounds(currentPoint);
      });
      __publicField(this, "onPointerUp", () => {
        this.app.setBrush(void 0);
        this.tool.transition("idle");
      });
      __publicField(this, "handleModifierKey", (info, e) => {
        switch(e.key) {
          case "Escape":
            this.app.setBrush(void 0), this.app.setSelectedShapes(this.initialSelectedIds), this.tool.transition("idle");
        }
      });
    }
  };
  __publicField(BrushingState, "id", "brushing");
  var ContextMenuState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onEnter", info => {
        var _a3;
        const {selectedIds, inputs:{shiftKey}} = this.app;
        if ("shape" === info.type && !selectedIds.has(info.shape.id)) {
          const shape = null != (_a3 = this.app.getParentGroup(info.shape)) ? _a3 : info.shape;
          shiftKey ? this.app.setSelectedShapes([...Array.from(selectedIds.values()), shape.id]) : this.app.setSelectedShapes([shape]);
        }
      });
      __publicField(this, "onPointerDown", () => {
        this.tool.transition("idle");
      });
    }
  };
  __publicField(ContextMenuState, "id", "contextMenu");
  var IdleState7 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onEnter", info => {
        "pinching" === info.fromId && this.parent.returnTo && this.app.transition(this.parent.returnTo);
      });
      __publicField(this, "onExit", () => {
      });
      __publicField(this, "onPointerEnter", info => {
        if (!info.order) {
          switch(info.type) {
            case "shape":
              this.app.setHoveredShape(info.shape.id);
              break;
            case "selection":
              "background" !== info.handle && "center" !== info.handle && this.tool.transition("hoveringSelectionHandle", info);
              break;
            case "canvas":
              this.app.setHoveredShape(void 0);
          }
        }
      });
      __publicField(this, "onPointerDown", (info, event) => {
        const {selectedShapes, inputs:{ctrlKey}} = this.app;
        if (2 === event.button) {
          this.tool.transition("contextMenu", info);
        } else {
          if (ctrlKey) {
            this.tool.transition("pointingCanvas");
          } else {
            switch(info.type) {
              case "selection":
                switch(info.handle) {
                  case "center":
                    break;
                  case "background":
                    this.tool.transition("pointingBoundsBackground");
                    break;
                  case "rotate":
                    this.tool.transition("pointingRotateHandle");
                    break;
                  default:
                    this.tool.transition("pointingResizeHandle", info);
                }break;
              case "shape":
                if (selectedShapes.has(info.shape)) {
                  this.tool.transition("pointingSelectedShape", info);
                } else {
                  const {selectionBounds, inputs} = this.app;
                  selectionBounds && PointUtils.pointInBounds(inputs.currentPoint, selectionBounds) ? this.tool.transition("pointingShapeBehindBounds", info) : this.tool.transition("pointingShape", info);
                }
                break;
              case "handle":
                this.tool.transition("pointingHandle", info);
                break;
              case "canvas":
                this.tool.transition("pointingCanvas");
                break;
              case "minimap":
                this.tool.transition("pointingMinimap", __spreadValues(__spreadValues({}, event), info));
            }
          }
        }
      });
      __publicField(this, "onPointerLeave", info => {
        info.order || "shape" === info.type && this.app.hoveredId && this.app.setHoveredShape(void 0);
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
      __publicField(this, "onDoubleClick", info => {
        if (!info.order && 1 === this.app.selectedShapesArray.length && !this.app.readOnly) {
          var selectedShape = this.app.selectedShapesArray[0];
          if (selectedShape.canEdit && !selectedShape.props.isLocked) {
            switch(info.type) {
              case "shape":
                this.tool.transition("editingShape", info);
                break;
              case "selection":
                1 === this.app.selectedShapesArray.length && this.tool.transition("editingShape", {type:"shape", target:selectedShape});
            }
          }
        }
      });
      __publicField(this, "onKeyDown", (info, e) => {
        ({selectedShapesArray:info} = this.app);
        switch(e.key) {
          case "Enter":
            1 === info.length && info[0].canEdit && !this.app.readOnly && this.tool.transition("editingShape", {type:"shape", shape:info[0], order:0});
            break;
          case "Escape":
            info.length && this.app.setSelectedShapes([]);
        }
      });
    }
  };
  __publicField(IdleState7, "id", "idle");
  var PointingShapeState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onEnter", info => {
        var _a3;
        const {selectedIds, inputs:{shiftKey}} = this.app, shape = null != (_a3 = this.app.getParentGroup(info.shape)) ? _a3 : info.shape;
        shiftKey ? this.app.setSelectedShapes([...Array.from(selectedIds.values()), shape.id]) : this.app.setSelectedShapes([shape]);
      });
      __publicField(this, "onPointerMove", () => {
        const {currentPoint, originPoint} = this.app.inputs;
        5 < Vec.dist(currentPoint, originPoint) && !this.app.readOnly && this.tool.transition("translating");
      });
      __publicField(this, "onPointerUp", () => {
        this.tool.transition("idle");
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
    }
  };
  __publicField(PointingShapeState, "id", "pointingShape");
  var PointingBoundsBackgroundState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "move");
      __publicField(this, "onPointerMove", () => {
        const {currentPoint, originPoint} = this.app.inputs;
        5 < Vec.dist(currentPoint, originPoint) && !this.app.readOnly && this.tool.transition("translating");
      });
      __publicField(this, "onPointerUp", () => {
        this.app.setSelectedShapes([]);
        this.tool.transition("idle");
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
    }
  };
  __publicField(PointingBoundsBackgroundState, "id", "pointingBoundsBackground");
  var PointingCanvasState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onEnter", () => {
        var _a3;
        const {shiftKey} = this.app.inputs;
        shiftKey || (this.app.setSelectedShapes([]), this.app.setEditingShape(), null == (_a3 = window.getSelection()) || _a3.removeAllRanges());
      });
      __publicField(this, "onPointerMove", () => {
        const {currentPoint, originPoint} = this.app.inputs;
        5 < Vec.dist(currentPoint, originPoint) && this.tool.transition("brushing");
      });
      __publicField(this, "onPointerUp", () => {
        this.app.inputs.shiftKey || this.app.setSelectedShapes([]);
        this.tool.transition("idle");
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
      __publicField(this, "onDoubleClick", () => {
        this.app.notify("canvas-dbclick", {point:this.app.inputs.originPoint});
      });
    }
  };
  __publicField(PointingCanvasState, "id", "pointingCanvas");
  var TranslatingState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "move");
      __publicField(this, "isCloning", !1);
      __publicField(this, "didClone", !1);
      __publicField(this, "initialPoints", {});
      __publicField(this, "initialShapePoints", {});
      __publicField(this, "initialClonePoints", {});
      __publicField(this, "clones", []);
      __publicField(this, "onEnter", () => {
        var _a3;
        this.app.history.pause();
        const {allSelectedShapesArray, inputs} = this.app;
        this.initialPoints = this.initialShapePoints = Object.fromEntries(allSelectedShapesArray.map(({id:id3, props:{point}}) => [id3, point.slice()]));
        document.querySelectorAll("input,textarea").forEach(el => el.blur());
        null == (_a3 = document.getSelection()) || _a3.empty();
        inputs.altKey ? this.startCloning() : this.moveSelectedShapesToPointer();
      });
      __publicField(this, "onExit", () => {
        this.app.history.resume();
        this.isCloning = this.didClone = !1;
        this.clones = [];
        this.initialPoints = {};
        this.initialShapePoints = {};
        this.initialClonePoints = {};
      });
      __publicField(this, "onPointerMove", () => {
        const {inputs:{currentPoint}} = this.app;
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
        switch(e.key) {
          case "Alt":
            this.startCloning();
            break;
          case "Escape":
            this.app.allSelectedShapes.forEach(shape => {
              shape.update({point:this.initialPoints[shape.id]});
            }), this.tool.transition("idle");
        }
      });
      __publicField(this, "onKeyUp", (info, e) => {
        switch(e.key) {
          case "Alt":
            if (!this.isCloning) {
              throw Error("Expected to be cloning.");
            }
            const {currentPage, allSelectedShapes} = this.app;
            currentPage.removeShapes(...allSelectedShapes);
            this.initialPoints = this.initialShapePoints;
            this.app.setSelectedShapes(Object.keys(this.initialPoints));
            this.moveSelectedShapesToPointer();
            this.isCloning = !1;
        }
      });
    }
    moveSelectedShapesToPointer() {
      const {inputs:{shiftKey, originPoint, currentPoint}} = this.app, {initialPoints} = this, delta = Vec.sub(currentPoint, originPoint);
      shiftKey && (Math.abs(delta[0]) < Math.abs(delta[1]) ? delta[0] = 0 : delta[1] = 0);
      transaction(() => {
        this.app.allSelectedShapesArray.filter(s2 => !s2.props.isLocked).forEach(shape => {
          let position = Vec.add(initialPoints[shape.id], delta);
          this.app.settings.snapToGrid && (position = Vec.snap(position, 8));
          shape.update({point:position});
        });
      });
    }
    startCloning() {
      this.didClone || (this.clones = this.app.allSelectedShapesArray.map(shape => {
        const ShapeClass = this.app.getShapeClass(shape.type);
        if (!ShapeClass) {
          throw Error("Could not find that shape class.");
        }
        return new ShapeClass(__spreadProps(__spreadValues({}, shape.serialized), {id:v1_default(), type:shape.type, point:this.initialPoints[shape.id], rotation:shape.props.rotation, isLocked:!1}));
      }), this.initialClonePoints = Object.fromEntries(this.clones.map(({id:id3, props:{point}}) => [id3, point.slice()])), this.didClone = !0);
      this.app.allSelectedShapes.forEach(shape => {
        shape.update({point:this.initialPoints[shape.id]});
      });
      this.initialPoints = this.initialClonePoints;
      this.app.currentPage.addShapes(...this.clones);
      this.app.setSelectedShapes(Object.keys(this.initialClonePoints));
      this.moveSelectedShapesToPointer();
      this.isCloning = !0;
    }
  };
  __publicField(TranslatingState, "id", "translating");
  var PointingSelectedShapeState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "pointedSelectedShape");
      __publicField(this, "onEnter", info => {
        this.pointedSelectedShape = info.shape;
      });
      __publicField(this, "onExit", () => {
        this.pointedSelectedShape = void 0;
      });
      __publicField(this, "onPointerMove", () => {
        const {currentPoint, originPoint} = this.app.inputs;
        5 < Vec.dist(currentPoint, originPoint) && !this.app.readOnly && this.tool.transition("translating");
      });
      __publicField(this, "onPointerUp", () => {
        const {shiftKey, currentPoint} = this.app.inputs;
        var {selectedShapesArray} = this.app;
        if (!this.pointedSelectedShape) {
          throw Error("Expected a pointed selected shape");
        }
        if (shiftKey) {
          ({selectedIds:selectedShapesArray} = this.app), selectedShapesArray = Array.from(selectedShapesArray.values()), selectedShapesArray.splice(selectedShapesArray.indexOf(this.pointedSelectedShape.id), 1), this.app.setSelectedShapes(selectedShapesArray);
        } else {
          if (1 === selectedShapesArray.length && this.pointedSelectedShape.canEdit && !this.app.readOnly && !this.pointedSelectedShape.props.isLocked && this.pointedSelectedShape instanceof TLBoxShape && PointUtils.pointInBounds(currentPoint, this.pointedSelectedShape.bounds)) {
            this.tool.transition("editingShape", {shape:this.pointedSelectedShape, order:0, type:"shape"});
            return;
          }
          this.app.setSelectedShapes([this.pointedSelectedShape.id]);
        }
        this.tool.transition("idle");
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
    }
  };
  __publicField(PointingSelectedShapeState, "id", "pointingSelectedShape");
  var PointingResizeHandleState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "info", {});
      __publicField(this, "onEnter", info => {
        this.info = info;
        this.updateCursor();
      });
      __publicField(this, "onExit", () => {
        this.app.cursors.reset();
      });
      __publicField(this, "onPointerMove", () => {
        const {currentPoint, originPoint} = this.app.inputs;
        5 < Vec.dist(currentPoint, originPoint) && this.tool.transition("resizing", this.info);
      });
      __publicField(this, "onPointerUp", () => {
        this.tool.transition("hoveringSelectionHandle", this.info);
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
    }
    updateCursor() {
      this.app.cursors.setCursor(CURSORS[this.info.handle], this.app.selectionBounds.rotation);
    }
  };
  __publicField(PointingResizeHandleState, "id", "pointingResizeHandle");
  var _ResizingState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "isSingle", !1);
      __publicField(this, "handle", "bottom_right_corner");
      __publicField(this, "snapshots", {});
      __publicField(this, "initialCommonBounds", {});
      __publicField(this, "selectionRotation", 0);
      __publicField(this, "resizeType", "corner");
      __publicField(this, "onEnter", info => {
        var _a3, _b;
        const {history, selectedShapesArray, selectionBounds} = this.app;
        if (!selectionBounds) {
          throw Error("Expected a selected bounds.");
        }
        this.handle = info.handle;
        this.resizeType = "left_edge" === info.handle || "right_edge" === info.handle ? "horizontal-edge" : "top_edge" === info.handle || "bottom_edge" === info.handle ? "vertical-edge" : "corner";
        this.app.cursors.setCursor(_ResizingState.CURSORS[info.handle], null == (_a3 = this.app.selectionBounds) ? void 0 : _a3.rotation);
        history.pause();
        const initialInnerBounds = BoundsUtils.getBoundsFromPoints(selectedShapesArray.map(shape => BoundsUtils.getBoundsCenter(shape.bounds)));
        this.selectionRotation = (this.isSingle = 1 === selectedShapesArray.length) ? null != (_b = selectedShapesArray[0].props.rotation) ? _b : 0 : 0;
        this.initialCommonBounds = __spreadValues({}, selectionBounds);
        this.snapshots = Object.fromEntries(selectedShapesArray.map(shape => {
          const bounds = __spreadValues({}, shape.bounds), [cx2, cy] = BoundsUtils.getBoundsCenter(bounds);
          return [shape.id, {props:shape.serialized, bounds, transformOrigin:[(cx2 - this.initialCommonBounds.minX) / this.initialCommonBounds.width, (cy - this.initialCommonBounds.minY) / this.initialCommonBounds.height], innerTransformOrigin:[(cx2 - initialInnerBounds.minX) / initialInnerBounds.width, (cy - initialInnerBounds.minY) / initialInnerBounds.height], isAspectRatioLocked:shape.props.isAspectRatioLocked || !(shape.canChangeAspectRatio && !shape.props.rotation)}];
        }));
        selectedShapesArray.forEach(shape => {
          var _a4;
          null == (_a4 = shape.onResizeStart) || _a4.call(shape, {isSingle:this.isSingle});
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
        const {inputs:{altKey, shiftKey, ctrlKey, originPoint, currentPoint}} = this.app, {handle, snapshots, initialCommonBounds} = this;
        let delta = Vec.sub(currentPoint, originPoint);
        altKey && (delta = Vec.mul(delta, 2));
        const firstShape = this.app.selectedShapes.values().next().value;
        let nextBounds = BoundsUtils.getTransformedBoundingBox(initialCommonBounds, handle, delta, this.selectionRotation, shiftKey || this.isSingle && (ctrlKey ? !("clipping" in firstShape.props) : !firstShape.canChangeAspectRatio || firstShape.props.isAspectRatioLocked));
        altKey && (nextBounds = __spreadValues(__spreadValues({}, nextBounds), BoundsUtils.centerBounds(nextBounds, BoundsUtils.getBoundsCenter(initialCommonBounds))));
        const {scaleX, scaleY} = nextBounds;
        this.app.selectedShapes.forEach(shape => {
          var _a3, _b;
          const {isAspectRatioLocked, props:initialShapeProps, bounds:initialShapeBounds, transformOrigin} = snapshots[shape.id];
          let relativeBounds = BoundsUtils.getRelativeTransformedBoundingBox(nextBounds, initialCommonBounds, initialShapeBounds, 0 > scaleX, 0 > scaleY);
          if (shape.canResize.some(r2 => r2) || shape.props.isSizeLocked || !this.isSingle) {
            var scale = [scaleX, scaleY], rotation = null != (_a3 = initialShapeProps.rotation) ? _a3 : 0;
            _a3 = BoundsUtils.getBoundsCenter(relativeBounds);
            shape.canFlip || (scale = Vec.abs(scale));
            shape.canScale || (scale = null != (_b = initialShapeProps.scale) ? _b : [1, 1]);
            if (rotation && 0 > scaleX && 0 <= scaleY || 0 > scaleY && 0 <= scaleX) {
              rotation *= -1;
            }
            this.app.settings.snapToGrid && !isAspectRatioLocked && (relativeBounds = BoundsUtils.snapBoundsToGrid(relativeBounds, 8));
            shape.onResize(initialShapeProps, {center:_a3, rotation, scale, bounds:relativeBounds, type:handle, clip:ctrlKey, transformOrigin});
          }
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
        switch(e.key) {
          case "Escape":
            this.app.selectedShapes.forEach(shape => {
              shape.update(__spreadValues({}, this.snapshots[shape.id].props));
            }), this.tool.transition("idle");
        }
      });
    }
    updateCursor(scaleX, scaleY) {
      var _a3, _b, _c, _d;
      const isFlippedX = 0 > scaleX && 0 <= scaleY;
      scaleX = 0 > scaleY && 0 <= scaleX;
      switch(this.handle) {
        case "top_left_corner":
        case "bottom_right_corner":
          isFlippedX || scaleX ? "nwse-resize" === this.app.cursors.cursor && this.app.cursors.setCursor("nesw-resize", null == (_a3 = this.app.selectionBounds) ? void 0 : _a3.rotation) : "nesw-resize" === this.app.cursors.cursor && this.app.cursors.setCursor("nwse-resize", null == (_b = this.app.selectionBounds) ? void 0 : _b.rotation);
          break;
        case "top_right_corner":
        case "bottom_left_corner":
          isFlippedX || scaleX ? "nesw-resize" === this.app.cursors.cursor && this.app.cursors.setCursor("nwse-resize", null == (_c = this.app.selectionBounds) ? void 0 : _c.rotation) : "nwse-resize" === this.app.cursors.cursor && this.app.cursors.setCursor("nesw-resize", null == (_d = this.app.selectionBounds) ? void 0 : _d.rotation);
      }
    }
  }, ResizingState = _ResizingState;
  __publicField(ResizingState, "id", "resizing");
  __publicField(ResizingState, "CURSORS", {bottom_edge:"ns-resize", top_edge:"ns-resize", left_edge:"ew-resize", right_edge:"ew-resize", bottom_left_corner:"nesw-resize", bottom_right_corner:"nwse-resize", top_left_corner:"nwse-resize", top_right_corner:"nesw-resize"});
  var PointingRotateHandleState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "rotate");
      __publicField(this, "handle", "");
      __publicField(this, "onEnter", info => {
        this.app.history.pause();
        this.handle = info.handle;
        this.updateCursor();
      });
      __publicField(this, "onPointerMove", () => {
        const {currentPoint, originPoint} = this.app.inputs;
        5 < Vec.dist(currentPoint, originPoint) && this.tool.transition("rotating", {handle:this.handle});
      });
      __publicField(this, "onPointerUp", () => {
        this.app.history.resume();
        this.app.persist();
        this.tool.transition("idle");
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
    }
    updateCursor() {
      this.app.cursors.setCursor(CURSORS[this.handle], this.app.selectionRotation);
    }
  };
  __publicField(PointingRotateHandleState, "id", "pointingRotateHandle");
  var PointingShapeBehindBoundsState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "info", {});
      __publicField(this, "onEnter", info => {
        this.info = info;
      });
      __publicField(this, "onPointerMove", () => {
        const {currentPoint, originPoint} = this.app.inputs;
        5 < Vec.dist(currentPoint, originPoint) && !this.app.readOnly && this.tool.transition("translating");
      });
      __publicField(this, "onPointerUp", () => {
        const {selectedIds, inputs:{shiftKey}} = this.app;
        shiftKey ? this.app.setSelectedShapes([...Array.from(selectedIds.values()), this.info.shape.id]) : this.app.setSelectedShapes([this.info.shape.id]);
        this.tool.transition("idle");
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
    }
  };
  __publicField(PointingShapeBehindBoundsState, "id", "pointingShapeBehindBounds");
  var RotatingState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "rotate");
      __publicField(this, "snapshot", {});
      __publicField(this, "initialCommonCenter", [0, 0]);
      __publicField(this, "initialCommonBounds", {});
      __publicField(this, "initialAngle", 0);
      __publicField(this, "initialSelectionRotation", 0);
      __publicField(this, "handle", "");
      __publicField(this, "onEnter", info => {
        const {history, selectedShapesArray, selectionBounds} = this.app;
        if (!selectionBounds) {
          throw Error("Expected selected bounds.");
        }
        history.pause();
        this.handle = info.handle;
        this.initialSelectionRotation = this.app.selectionRotation;
        this.initialCommonBounds = __spreadValues({}, selectionBounds);
        this.initialCommonCenter = BoundsUtils.getBoundsCenter(selectionBounds);
        this.initialAngle = Vec.angle(this.initialCommonCenter, this.app.inputs.currentPoint);
        this.snapshot = Object.fromEntries(selectedShapesArray.map(shape => [shape.id, {point:[...shape.props.point], center:[...shape.center], rotation:shape.props.rotation, handles:"handles" in shape ? deepCopy(shape.handles) : void 0}]));
        this.updateCursor();
      });
      __publicField(this, "onExit", () => {
        this.app.history.resume();
        this.snapshot = {};
      });
      __publicField(this, "onPointerMove", () => {
        const {selectedShapes, inputs:{shiftKey, currentPoint}} = this.app, {snapshot, initialCommonCenter, initialAngle, initialSelectionRotation} = this;
        let angleDelta = Vec.angle(initialCommonCenter, currentPoint) - initialAngle;
        shiftKey && (angleDelta = GeomUtils.snapAngleToSegments(angleDelta, 24));
        selectedShapes.forEach(shape => {
          var initialShape = snapshot[shape.id];
          let initialAngle2 = 0;
          if (shiftKey) {
            var {rotation = 0} = initialShape;
            initialAngle2 = GeomUtils.snapAngleToSegments(rotation, 24) - rotation;
          }
          const relativeCenter = Vec.sub(initialShape.center, initialShape.point);
          rotation = Vec.rotWith(initialShape.center, initialCommonCenter, angleDelta);
          if ("handles" in shape) {
            initialShape = initialShape.handles;
            const handlePoints = initialShape.map(handle => Vec.rotWith(handle.point, relativeCenter, angleDelta)), topLeft = BoundsUtils.getCommonTopLeft(handlePoints);
            shape.update({point:Vec.add(topLeft, Vec.sub(rotation, relativeCenter)), handles:initialShape.map((h2, i2) => __spreadProps(__spreadValues({}, h2), {point:Vec.sub(handlePoints[i2], topLeft)}))});
          } else {
            shape.update({point:Vec.sub(rotation, relativeCenter), rotation:GeomUtils.clampRadians((initialShape.rotation || 0) + angleDelta + initialAngle2)});
          }
        });
        const selectionRotation = GeomUtils.clampRadians(initialSelectionRotation + angleDelta);
        this.app.setSelectionRotation(shiftKey ? GeomUtils.snapAngleToSegments(selectionRotation, 24) : selectionRotation);
        this.updateCursor();
      });
      __publicField(this, "onPointerUp", () => {
        this.app.history.resume();
        this.app.persist();
        this.tool.transition("idle");
      });
      __publicField(this, "onKeyDown", (info, e) => {
        switch(e.key) {
          case "Escape":
            this.app.selectedShapes.forEach(shape => {
              shape.update(this.snapshot[shape.id]);
            }), this.tool.transition("idle");
        }
      });
    }
    updateCursor() {
      this.app.cursors.setCursor(CURSORS[this.handle], this.app.selectionRotation);
    }
  };
  __publicField(RotatingState, "id", "rotating");
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
  var TranslatingHandleState = class extends TLBaseLineBindingState {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "grabbing");
      __publicField(this, "onEnter", info => {
        this.app.history.pause();
        this.newStartBindingId = v1_default();
        this.draggedBindingId = v1_default();
        this.bindableShapeIds = this.app.currentPage.getBindableShapes();
        this.handleId = info.id;
        this.currentShape = info.shape;
        this.initialShape = toJS(this.currentShape.props);
        this.app.setSelectedShapes([this.currentShape]);
      });
    }
  };
  __publicField(TranslatingHandleState, "id", "translatingHandle");
  var PointingHandleState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "grabbing");
      __publicField(this, "info", {});
      __publicField(this, "onEnter", info => {
        this.info = info;
      });
      __publicField(this, "onPointerMove", () => {
        const {currentPoint, originPoint} = this.app.inputs;
        5 < Vec.dist(currentPoint, originPoint) && this.tool.transition("translatingHandle", this.info);
      });
      __publicField(this, "onPointerUp", () => {
        this.tool.transition("idle");
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
    }
  };
  __publicField(PointingHandleState, "id", "pointingHandle");
  var HoveringSelectionHandleState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "handle");
      __publicField(this, "onEnter", info => {
        var _a3;
        this.app.cursors.setCursor(CURSORS[info.handle], null != (_a3 = this.app.selectionBounds.rotation) ? _a3 : 0);
        this.handle = info.handle;
      });
      __publicField(this, "onExit", () => {
        this.app.cursors.reset();
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
      __publicField(this, "onPointerDown", info => {
        switch(info.type) {
          case "selection":
            switch(info.handle) {
              case "center":
                break;
              case "background":
                break;
              case "top_left_resize_corner":
              case "top_right_resize_corner":
              case "bottom_right_resize_corner":
              case "bottom_left_resize_corner":
                this.tool.transition("pointingRotateHandle", info);
                break;
              default:
                this.tool.transition("pointingResizeHandle", info);
            }
        }
      });
      __publicField(this, "onPointerLeave", () => {
        this.tool.transition("idle");
      });
      __publicField(this, "onDoubleClick", info => {
        var _a3;
        if (!info.order && 1 === this.app.selectedShapes.size) {
          var selectedShape = this.app.selectedShapes.values().next().value;
          if (!selectedShape.canEdit || this.app.readOnly || selectedShape.props.isLocked) {
            selectedShape.onResetBounds({asset:selectedShape.props.assetId ? this.app.assets[selectedShape.props.assetId] : void 0, zoom:this.app.viewport.camera.zoom}), this.tool.transition("idle");
          } else {
            switch(info.type) {
              case "shape":
                this.tool.transition("editingShape", info);
                break;
              case "selection":
                null == (_a3 = selectedShape.onResetBounds) || _a3.call(selectedShape, {zoom:this.app.viewport.camera.zoom}), 1 === this.app.selectedShapesArray.length && this.tool.transition("editingShape", {type:"shape", target:selectedShape});
            }
          }
        }
      });
    }
  };
  __publicField(HoveringSelectionHandleState, "id", "hoveringSelectionHandle");
  var EditingShapeState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "editingShape", {});
      __publicField(this, "onEnter", info => {
        this.editingShape = info.shape;
        this.app.setEditingShape(info.shape);
      });
      __publicField(this, "onExit", () => {
        var _a3;
        if (this.editingShape && "text" in this.editingShape.props) {
          const newText = this.editingShape.props.text.trim();
          "" === newText && "text" === this.editingShape.props.type ? this.app.deleteShapes([this.editingShape]) : (this.editingShape.onResetBounds(), this.editingShape.update({text:newText}));
        }
        this.app.persist();
        this.app.setEditingShape();
        null == (_a3 = document.querySelector(".tl-canvas")) || _a3.focus();
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
      __publicField(this, "onPointerDown", info => {
        switch(info.type) {
          case "shape":
            if (info.shape === this.editingShape) {
              break;
            }
            this.tool.transition("idle", info);
            break;
          case "canvas":
            info.order || this.tool.transition("idle", info);
        }
      });
      __publicField(this, "onKeyDown", (info, e) => {
        switch(e.key) {
          case "Escape":
            transaction(() => {
              e.stopPropagation();
              this.app.setSelectedShapes([this.editingShape]);
              this.tool.transition("idle");
            });
        }
      });
    }
  };
  __publicField(EditingShapeState, "id", "editingShape");
  var PointingMinimapState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "minimapZoom", 1);
      __publicField(this, "minimapRect", {minX:0, minY:0, maxX:0, maxY:0, width:0, height:0});
      __publicField(this, "getCameraPoint", clientPoint => {
        const minimapContainer = document.querySelector(".tl-preview-minimap svg");
        var minimapCamera = document.querySelector(".tl-preview-minimap #minimap-camera-rect");
        if (minimapContainer && minimapCamera) {
          const rect = minimapContainer.getBoundingClientRect();
          this.minimapRect.height = rect.height;
          this.minimapRect.width = rect.width;
          this.minimapRect.minX = rect.left;
          this.minimapRect.minY = rect.top;
          this.minimapRect.maxX = rect.right;
          this.minimapRect.maxY = rect.bottom;
          this.minimapZoom = +minimapContainer.dataset.commonBoundWidth / this.minimapRect.width;
          clientPoint = Vec.sub(clientPoint, [this.minimapRect.minX, this.minimapRect.minY]);
          minimapCamera = minimapCamera.getBoundingClientRect();
          minimapCamera = Vec.mul(Vec.sub(clientPoint, [minimapCamera.left + minimapCamera.width / 2, minimapCamera.top + minimapCamera.height / 2]), this.minimapZoom);
          return Vec.sub(this.app.viewport.camera.point, minimapCamera);
        }
      });
      __publicField(this, "onEnter", info => {
        (info = this.getCameraPoint([info.clientX, info.clientY])) ? this.app.viewport.update({point:info}) : this.tool.transition("idle");
      });
      __publicField(this, "onPointerMove", (info, e) => {
        "clientX" in e && (info = this.getCameraPoint([e.clientX, e.clientY])) && this.app.viewport.update({point:info});
      });
      __publicField(this, "onPointerUp", () => {
        this.tool.transition("idle");
      });
    }
  };
  __publicField(PointingMinimapState, "id", "pointingMinimap");
  var TLSelectTool = class extends TLTool {
    constructor() {
      super(...arguments);
      __publicField(this, "returnTo", "");
      __publicField(this, "onEnter", info => {
        this.returnTo = null == info ? void 0 : info.returnTo;
      });
    }
  };
  __publicField(TLSelectTool, "id", "select");
  __publicField(TLSelectTool, "initial", "idle");
  __publicField(TLSelectTool, "shortcut", "whiteboard/select");
  __publicField(TLSelectTool, "states", [IdleState7, BrushingState, ContextMenuState, PointingCanvasState, PointingShapeState, PointingShapeBehindBoundsState, PointingSelectedShapeState, PointingBoundsBackgroundState, HoveringSelectionHandleState, PointingResizeHandleState, PointingRotateHandleState, PointingMinimapState, PointingHandleState, TranslatingHandleState, TranslatingState, ResizingState, RotatingState, RotatingState, PinchingState2, EditingShapeState]);
  var PanningState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "grabbing");
      __publicField(this, "originalScreenPoint", []);
      __publicField(this, "originalCameraPoint", []);
      __publicField(this, "prevState", "idle");
      __publicField(this, "onEnter", info => {
        this.prevState = null == info ? void 0 : info.prevState;
        this.originalScreenPoint = this.app.inputs.currentScreenPoint;
        this.originalCameraPoint = this.app.viewport.camera.point;
      });
      __publicField(this, "onPointerMove", (_2, e) => {
        _2 = src_default.sub(this.originalScreenPoint, this.app.inputs.currentScreenPoint);
        this.app.viewport.update({point:src_default.sub(this.originalCameraPoint, src_default.div(_2, this.app.viewport.camera.zoom))});
      });
      __publicField(this, "onPointerUp", () => {
        var _a3;
        this.tool.transition(null != (_a3 = this.prevState) ? _a3 : "idle");
      });
    }
  };
  __publicField(PanningState, "id", "panning");
  var IdleState8 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onEnter", info => {
        this.parent.prevTool && info.exit && (this.app.setCurrentState(this.parent.prevTool), setTimeout(() => {
          this.app.cursors.reset();
          this.app.cursors.setCursor(this.parent.prevTool.cursor);
        }));
      });
      __publicField(this, "onPointerDown", (info, e) => {
        info.order || this.tool.transition("panning");
      });
    }
  };
  __publicField(IdleState8, "id", "idle");
  var IdleHoldState = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "onPointerDown", (info, e) => {
        info.order || this.tool.transition("panning", {prevState:"idleHold"});
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.tool.transition("pinching", {info, event});
      });
    }
  };
  __publicField(IdleHoldState, "id", "idleHold");
  var PinchingState3 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "origin", [0, 0]);
      __publicField(this, "prevDelta", [0, 0]);
      __publicField(this, "onEnter", info => {
        this.prevDelta = info.info.delta;
        this.origin = info.info.point;
      });
      __publicField(this, "onPinch", info => {
        this.app.viewport.pinchZoom(info.point, info.delta, info.delta[2]);
      });
      __publicField(this, "onPinchEnd", () => {
        this.tool.transition("idle");
      });
    }
  };
  __publicField(PinchingState3, "id", "pinching");
  var TLMoveTool = class extends TLTool {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "grab");
      __publicField(this, "prevTool", null);
      __publicField(this, "onEnter", info => {
        this.prevTool = null == info ? void 0 : info.prevTool;
      });
      __publicField(this, "onKeyDown", (info, e) => {
        switch(e.key) {
          case "Escape":
            this.app.transition("select");
        }
      });
      __publicField(this, "onPinchStart", (info, event) => {
        this.transition("pinching", {info, event});
      });
    }
  };
  __publicField(TLMoveTool, "id", "move");
  __publicField(TLMoveTool, "shortcut", "whiteboard/pan");
  __publicField(TLMoveTool, "states", [IdleState8, IdleHoldState, PanningState, PinchingState3]);
  __publicField(TLMoveTool, "initial", "idle");
  var TLPage = class {
    constructor(app, props = {}) {
      __publicField(this, "lastShapesNounces", null);
      __publicField(this, "app");
      __publicField(this, "id");
      __publicField(this, "name");
      __publicField(this, "shapes", []);
      __publicField(this, "bindings", {});
      __publicField(this, "nonce", 0);
      __publicField(this, "bringForward", shapes2 => {
        this.bringToFront(shapes2);
        return this;
      });
      __publicField(this, "sendBackward", shapes2 => {
        this.sendToBack(shapes2);
        return this;
      });
      __publicField(this, "bringToFront", shapes2 => {
        const shapesToMove = this.parseShapesArg(shapes2);
        shapes2 = this.shapes.filter(shape => !shapesToMove.includes(shape));
        this.shapes = shapes2.concat(shapesToMove);
        shapes2 = {op:"bringToFront", shapes:shapesToMove, before:shapes2[shapes2.length - 1]};
        this.app.persist(shapes2);
        this.persistInfo = shapes2;
        return this;
      });
      __publicField(this, "sendToBack", shapes2 => {
        const shapesToMove = this.parseShapesArg(shapes2);
        shapes2 = this.shapes.filter(shape => !shapesToMove.includes(shape));
        this.shapes = shapesToMove.concat(shapes2);
        this.app.persist({op:"sendToBack", shapes:shapesToMove, next:shapes2[0]});
        return this;
      });
      __publicField(this, "flip", (shapes2, direction) => {
        shapes2 = this.parseShapesArg(shapes2);
        const commonBounds = BoundsUtils.getCommonBounds(shapes2.map(shape => shape.bounds));
        shapes2.forEach(shape => {
          var _a3;
          const relativeBounds = BoundsUtils.getRelativeTransformedBoundingBox(commonBounds, commonBounds, shape.bounds, "horizontal" === direction, "vertical" === direction);
          if (shape.serialized) {
            shape.onResize(shape.serialized, {bounds:relativeBounds, center:BoundsUtils.getBoundsCenter(relativeBounds), rotation:null != (_a3 = shape.props.rotation) ? _a3 : -0, type:"top_left_corner", scale:shape.canFlip && shape.props.scale ? "horizontal" === direction ? [-shape.props.scale[0], 1] : [1, -shape.props.scale[1]] : [1, 1], clip:!1, transformOrigin:[0.5, 0.5]});
          }
        });
        this.app.persist();
        return this;
      });
      __publicField(this, "getShapeById", id3 => this.shapes.find(shape2 => shape2.id === id3));
      __publicField(this, "cleanup", changedShapeIds => {
        changedShapeIds = getRelatedBindings(this.bindings, changedShapeIds);
        const visitedShapes = new Set();
        let bindingChanged = !1;
        const newBindings = deepCopy(this.bindings);
        changedShapeIds.forEach(binding => {
          var _a3;
          if (this.bindings[binding.id]) {
            var toShape = this.getShapeById(binding.toId), fromShape = this.getShapeById(binding.fromId);
            toShape && fromShape ? visitedShapes.has(fromShape.id) || (binding = this.updateArrowBindings(fromShape), visitedShapes.add(fromShape.id), binding && (toShape = __spreadValues(__spreadValues({}, fromShape.props), binding), null == (_a3 = this.getShapeById(toShape.id)) || _a3.update(toShape, !1, (0,import_fast_deep_equal.default)(null == binding ? void 0 : binding.handles, null == fromShape ? void 0 : fromShape.props.handles)))) : (delete newBindings[binding.id], bindingChanged = !0);
          }
        });
        Object.keys(newBindings).forEach(id3 => {
          const binding = this.bindings[id3];
          0 === this.shapes.filter(shape => shape.id === binding.fromId || shape.id === binding.toId).length && (delete newBindings[id3], bindingChanged = !0);
        });
        bindingChanged && this.update({bindings:newBindings});
      });
      __publicField(this, "updateArrowBindings", lineShape => {
        var _a3, _b, _c, result = {start:deepCopy(lineShape.props.handles.start), end:deepCopy(lineShape.props.handles.end)}, start = {isBound:!1, handle:lineShape.props.handles.start, point:src_default.add(lineShape.props.handles.start.point, lineShape.props.point)}, end = {isBound:!1, handle:lineShape.props.handles.end, point:src_default.add(lineShape.props.handles.end.point, lineShape.props.point)};
        if (lineShape.props.handles.start.bindingId) {
          var hasDecoration = void 0 !== (null == (_a3 = lineShape.props.decorations) ? void 0 : _a3.start);
          _a3 = lineShape.props.handles.start;
          var binding = this.bindings[lineShape.props.handles.start.bindingId], target = this.getShapeById(null == binding ? void 0 : binding.toId);
          if (target) {
            start = target.getBounds();
            var expandedBounds = target.getExpandedBounds(), intersectBounds = BoundsUtils.expandBounds(start, hasDecoration ? binding.distance : 1);
            const {minX, minY, width, height} = expandedBounds, anchorPoint = src_default.add([minX, minY], src_default.mulV([width, height], src_default.rotWith(binding.point, [0.5, 0.5], target.props.rotation || 0)));
            start = {isBound:!0, hasDecoration, binding, handle:_a3, point:anchorPoint, target, bounds:start, expandedBounds, intersectBounds, center:target.getCenter()};
          }
        }
        if (lineShape.props.handles.end.bindingId && (hasDecoration = void 0 !== (null == (_b = lineShape.props.decorations) ? void 0 : _b.end), _b = lineShape.props.handles.end, _a3 = this.bindings[lineShape.props.handles.end.bindingId], binding = this.getShapeById(null == _a3 ? void 0 : _a3.toId))) {
          end = binding.getBounds();
          target = binding.getExpandedBounds();
          expandedBounds = hasDecoration ? BoundsUtils.expandBounds(end, _a3.distance) : end;
          const {minX, minY, width, height} = target;
          intersectBounds = src_default.add([minX, minY], src_default.mulV([width, height], src_default.rotWith(_a3.point, [0.5, 0.5], binding.props.rotation || 0)));
          end = {isBound:!0, hasDecoration, binding:_a3, handle:_b, point:intersectBounds, target:binding, bounds:end, expandedBounds:target, intersectBounds:expandedBounds, center:binding.getCenter()};
        }
        for (const ID of ["end", "start"]) {
          _b = "start" === ID ? start : end;
          const B3 = "start" === ID ? end : start;
          if (_b.isBound) {
            if (_b.binding.distance) {
              if (hasDecoration = src_default.uni(src_default.sub(_b.point, B3.point)), _a3 = intersectRayBounds(B3.point, hasDecoration, _b.intersectBounds, _b.target.props.rotation).filter(int => int.didIntersect).map(int => int.points[0]).sort((a3, b3) => src_default.dist(a3, B3.point) - src_default.dist(b3, B3.point)), _a3[0]) {
                if (binding = void 0, B3.isBound && (binding = intersectRayBounds(B3.point, hasDecoration, B3.intersectBounds, B3.target.props.rotation).filter(int => int.didIntersect).map(int => int.points[0]).sort((a3, b3) => src_default.dist(a3, B3.point) - src_default.dist(b3, B3.point))[0]), B3.isBound && (2 > _a3.length || binding && _a3[0] && 10 > Math.ceil(src_default.dist(_a3[0], binding)) || BoundsUtils.boundsContain(_b.expandedBounds, B3.expandedBounds) || BoundsUtils.boundsCollide(_b.expandedBounds, 
                B3.expandedBounds))) {
                  hasDecoration = src_default.uni(src_default.sub(B3.point, _b.point)), _a3 = intersectRayBounds(_b.point, hasDecoration, _b.bounds, _b.target.props.rotation).filter(int => int.didIntersect).map(int => int.points[0]), _a3[0] && (result[ID].point = src_default.toFixed(src_default.sub(_a3[0], lineShape.props.point)), result["start" === ID ? "end" : "start"].point = src_default.toFixed(src_default.add(src_default.sub(_a3[0], lineShape.props.point), src_default.mul(hasDecoration, Math.min(src_default.dist(_a3[0], 
                  B3.point), 10 * (BoundsUtils.boundsContain(B3.bounds, _b.intersectBounds) ? -1 : 1))))));
                } else {
                  if (!B3.isBound && (_a3[0] && 10 > src_default.dist(_a3[0], B3.point) || PointUtils.pointInBounds(B3.point, _b.intersectBounds))) {
                    return result = src_default.uni(src_default.sub(_b.center, B3.point)), null == (_c = lineShape.getHandlesChange) ? void 0 : _c.call(lineShape, lineShape.props, {[ID]:__spreadProps(__spreadValues({}, lineShape.props.handles[ID]), {point:src_default.toFixed(src_default.add(src_default.sub(B3.point, lineShape.props.point), src_default.mul(result, 10)))})});
                  }
                  _a3[0] && (result[ID].point = src_default.toFixed(src_default.sub(_a3[0], lineShape.props.point)));
                }
              }
            } else {
              result[ID].point = src_default.sub(_b.point, lineShape.props.point);
            }
          }
        }
        return lineShape.getHandlesChange(lineShape.props, result);
      });
      const {id:id3, name, shapes:shapes2 = [], bindings = {}, nonce} = props;
      this.id = id3;
      this.name = name;
      this.bindings = Object.assign({}, bindings);
      this.app = app;
      this.nonce = nonce || 0;
      this.persistInfo = null;
      this.addShapes(...shapes2);
      makeObservable(this);
      autorun(() => {
        const newShapesNouncesMap = 0 < this.shapes.length ? Object.fromEntries(this.shapes.map(shape => [shape.id, shape.nonce])) : null;
        if (this.lastShapesNounces && newShapesNouncesMap) {
          const lastShapesNounces = this.lastShapesNounces, changedShapeIds = [...(new Set([...Object.keys(newShapesNouncesMap), ...Object.keys(lastShapesNounces)]))].filter(s2 => lastShapesNounces[s2] !== newShapesNouncesMap[s2]);
          requestAnimationFrame(() => {
            this.cleanup(changedShapeIds);
          });
        }
        newShapesNouncesMap && (this.lastShapesNounces = newShapesNouncesMap);
      });
    }
    get serialized() {
      return {id:this.id, name:this.name, shapes:this.shapes.map(shape => shape.serialized).filter(s2 => !!s2).map(s2 => toJS(s2)), bindings:deepCopy(this.bindings), nonce:this.nonce};
    }
    get shapesById() {
      return Object.fromEntries(this.shapes.map(shape => [shape.id, shape]));
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
      if (0 !== shapes2.length) {
        return shapes2 = "getBounds" in shapes2[0] ? shapes2 : shapes2.map(shape => new (this.app.getShapeClass(shape.type))(shape)), this.shapes.push(...shapes2), shapes2;
      }
    }
    parseShapesArg(shapes2) {
      return "string" === typeof shapes2[0] ? this.shapes.filter(shape => shapes2.includes(shape.id)) : shapes2;
    }
    removeShapes(...shapes2) {
      const shapeInstances = this.parseShapesArg(shapes2);
      this.shapes = this.shapes.filter(shape => !shapeInstances.includes(shape));
      return shapeInstances;
    }
    getBindableShapes() {
      return this.shapes.filter(shape => shape.canBind).sort((a3, b3) => b3.nonce - a3.nonce).map(s2 => s2.id);
    }
  };
  __decorateClass([observable], TLPage.prototype, "id", 2);
  __decorateClass([observable], TLPage.prototype, "name", 2);
  __decorateClass([observable], TLPage.prototype, "shapes", 2);
  __decorateClass([observable], TLPage.prototype, "bindings", 2);
  __decorateClass([computed], TLPage.prototype, "serialized", 1);
  __decorateClass([computed], TLPage.prototype, "shapesById", 1);
  __decorateClass([observable], TLPage.prototype, "nonce", 2);
  __decorateClass([action], TLPage.prototype, "update", 1);
  __decorateClass([action], TLPage.prototype, "updateBindings", 1);
  __decorateClass([action], TLPage.prototype, "updateShapesIndex", 1);
  __decorateClass([action], TLPage.prototype, "addShapes", 1);
  __decorateClass([action], TLPage.prototype, "removeShapes", 1);
  __decorateClass([action], TLPage.prototype, "bringForward", 2);
  __decorateClass([action], TLPage.prototype, "sendBackward", 2);
  __decorateClass([action], TLPage.prototype, "bringToFront", 2);
  __decorateClass([action], TLPage.prototype, "sendToBack", 2);
  __decorateClass([action], TLPage.prototype, "cleanup", 2);
  var TLInputs = class {
    constructor() {
      __publicField(this, "shiftKey", !1);
      __publicField(this, "ctrlKey", !1);
      __publicField(this, "modKey", !1);
      __publicField(this, "altKey", !1);
      __publicField(this, "spaceKey", !1);
      __publicField(this, "isPinching", !1);
      __publicField(this, "currentScreenPoint", [0, 0]);
      __publicField(this, "currentPoint", [0, 0]);
      __publicField(this, "previousScreenPoint", [0, 0]);
      __publicField(this, "previousPoint", [0, 0]);
      __publicField(this, "originScreenPoint", [0, 0]);
      __publicField(this, "originPoint", [0, 0]);
      __publicField(this, "pointerIds", new Set());
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
        "pinching" !== this.state && ("panning" === this.state && (this.state = "idle"), this.updateModifiers(event), this.previousPoint = this.currentPoint, this.currentPoint = pagePoint);
      });
      __publicField(this, "onPointerUp", (pagePoint, event) => {
        this.pointerIds.clear();
        this.updateModifiers(event);
        this.state = "idle";
      });
      __publicField(this, "onKeyDown", event => {
        this.updateModifiers(event);
        switch(event.key) {
          case " ":
            this.spaceKey = !0;
        }
      });
      __publicField(this, "onKeyUp", event => {
        this.updateModifiers(event);
        switch(event.key) {
          case " ":
            this.spaceKey = !1;
        }
      });
      __publicField(this, "onPinchStart", (pagePoint, event) => {
        this.updateModifiers(event);
        this.state = "pinching";
      });
      __publicField(this, "onPinch", (pagePoint, event) => {
        "pinching" === this.state && this.updateModifiers(event);
      });
      __publicField(this, "onPinchEnd", (pagePoint, event) => {
        "pinching" === this.state && (this.updateModifiers(event), this.state = "idle");
      });
      makeObservable(this);
    }
    updateContainerOffset(containerOffset) {
      Object.assign(this.containerOffset, containerOffset);
    }
    updateModifiers(event) {
      event.isPrimary && ("clientX" in event && (this.previousScreenPoint = this.currentScreenPoint, this.currentScreenPoint = src_default.sub([event.clientX, event.clientY], this.containerOffset)), "shiftKey" in event && (this.shiftKey = event.shiftKey, this.ctrlKey = event.ctrlKey, this.altKey = event.altKey, this.modKey = isDarwin() ? event.metaKey : event.ctrlKey));
    }
  };
  __decorateClass([observable], TLInputs.prototype, "shiftKey", 2);
  __decorateClass([observable], TLInputs.prototype, "ctrlKey", 2);
  __decorateClass([observable], TLInputs.prototype, "modKey", 2);
  __decorateClass([observable], TLInputs.prototype, "altKey", 2);
  __decorateClass([observable], TLInputs.prototype, "spaceKey", 2);
  __decorateClass([observable], TLInputs.prototype, "isPinching", 2);
  __decorateClass([observable], TLInputs.prototype, "currentScreenPoint", 2);
  __decorateClass([observable], TLInputs.prototype, "currentPoint", 2);
  __decorateClass([observable], TLInputs.prototype, "previousScreenPoint", 2);
  __decorateClass([observable], TLInputs.prototype, "previousPoint", 2);
  __decorateClass([observable], TLInputs.prototype, "originScreenPoint", 2);
  __decorateClass([observable], TLInputs.prototype, "originPoint", 2);
  __decorateClass([observable], TLInputs.prototype, "state", 2);
  __decorateClass([observable], TLInputs.prototype, "containerOffset", 2);
  __decorateClass([action], TLInputs.prototype, "updateContainerOffset", 1);
  __decorateClass([action], TLInputs.prototype, "updateModifiers", 1);
  __decorateClass([action], TLInputs.prototype, "onPointerDown", 2);
  __decorateClass([action], TLInputs.prototype, "onPointerMove", 2);
  __decorateClass([action], TLInputs.prototype, "onPointerUp", 2);
  __decorateClass([action], TLInputs.prototype, "onKeyDown", 2);
  __decorateClass([action], TLInputs.prototype, "onKeyUp", 2);
  __decorateClass([action], TLInputs.prototype, "onPinchStart", 2);
  __decorateClass([action], TLInputs.prototype, "onPinch", 2);
  __decorateClass([action], TLInputs.prototype, "onPinchEnd", 2);
  var elapsedProgress = (t, duration = 100) => -(Math.cos(Math.PI * Vec.clamp(t / duration, 0, 1)) - 1) / 2, _TLViewport = class {
    constructor() {
      __publicField(this, "bounds", {minX:0, minY:0, maxX:1080, maxY:720, width:1080, height:720});
      __publicField(this, "camera", {point:[0, 0], zoom:1});
      __publicField(this, "updateBounds", bounds => {
        this.bounds = bounds;
        return this;
      });
      __publicField(this, "panCamera", delta => this.update({point:Vec.sub(this.camera.point, Vec.div(delta, this.camera.zoom))}));
      __publicField(this, "panToPointWhenNearBounds", point => {
        const threshold = Vec.div([_TLViewport.panThreshold, _TLViewport.panThreshold], this.camera.zoom), deltaMax = Vec.sub([this.currentView.maxX, this.currentView.maxY], Vec.add(point, threshold));
        point = Vec.sub([this.currentView.minX, this.currentView.minY], Vec.sub(point, threshold));
        this.panCamera(Vec.mul([0 > deltaMax[0] ? deltaMax[0] : 0 < point[0] ? point[0] : 0, 0 > deltaMax[1] ? deltaMax[1] : 0 < point[1] ? point[1] : 0], -_TLViewport.panMultiplier * this.camera.zoom));
      });
      __publicField(this, "update", ({point, zoom}) => {
        void 0 === point || isNaN(point[0]) || isNaN(point[1]) || (this.camera.point = point);
        void 0 === zoom || isNaN(zoom) || (this.camera.zoom = Math.min(4, Math.max(0.1, zoom)));
        return this;
      });
      __publicField(this, "getPagePoint", point => {
        const {camera, bounds} = this;
        return Vec.sub(Vec.div(Vec.sub(point, [bounds.minX, bounds.minY]), camera.zoom), camera.point);
      });
      __publicField(this, "getScreenPoint", point => {
        const {camera} = this;
        return Vec.mul(Vec.add(point, camera.point), camera.zoom);
      });
      __publicField(this, "onZoom", (point, zoom, animate = !1) => this.pinchZoom(point, [0, 0], zoom, animate));
      __publicField(this, "pinchZoom", (point, delta, zoom, animate = !1) => {
        var {camera} = this;
        delta = Vec.sub(camera.point, Vec.div(delta, camera.zoom));
        zoom = Vec.clamp(zoom, _TLViewport.minZoom, _TLViewport.maxZoom);
        camera = Vec.div(point, camera.zoom);
        point = Vec.div(point, zoom);
        point = Vec.toFixed(Vec.add(delta, Vec.sub(point, camera)));
        animate ? this.animateCamera({point, zoom}) : this.update({point, zoom});
        return this;
      });
      __publicField(this, "setZoom", (zoom, animate = !1) => {
        const {bounds} = this;
        this.onZoom([bounds.width / 2, bounds.height / 2], zoom, animate);
      });
      __publicField(this, "zoomIn", () => {
        const {camera} = this;
        this.setZoom(camera.zoom / 0.8, !0);
      });
      __publicField(this, "zoomOut", () => {
        const {camera} = this;
        this.setZoom(0.8 * camera.zoom, !0);
      });
      __publicField(this, "resetZoom", () => {
        this.setZoom(1, !0);
        return this;
      });
      __publicField(this, "animateCamera", ({point, zoom}) => this.animateToViewport({minX:-point[0], minY:-point[1], maxX:this.bounds.width / zoom - point[0], maxY:this.bounds.height / zoom - point[1], width:this.bounds.width / zoom, height:this.bounds.height / zoom}));
      __publicField(this, "animateToViewport", view => {
        const startTime = performance.now(), oldView = __spreadValues({}, this.currentView), step = () => {
          var elapsed = performance.now() - startTime;
          elapsed = elapsedProgress(elapsed);
          var JSCompiler_object_inline_minX_5441 = oldView.minX + (view.minX - oldView.minX) * elapsed;
          this.update({point:[-JSCompiler_object_inline_minX_5441, -(oldView.minY + (view.minY - oldView.minY) * elapsed)], zoom:this.bounds.width / (oldView.maxX + (view.maxX - oldView.maxX) * elapsed - JSCompiler_object_inline_minX_5441)});
          1 > elapsed && requestAnimationFrame(step);
        };
        step();
      });
      __publicField(this, "zoomToBounds", ({width, height, minX, minY}) => {
        const {bounds, camera} = this;
        let zoom = Math.min((bounds.width - 100) / width, (bounds.height - 100) / height);
        zoom = Math.min(1, Math.max(_TLViewport.minZoom, camera.zoom === zoom || 1 > camera.zoom ? Math.min(1, zoom) : zoom));
        width = Vec.add([-minX, -minY], [(bounds.width - width * zoom) / 2 / zoom, (bounds.height - height * zoom) / 2 / zoom]);
        this.animateCamera({point:width, zoom});
      });
      makeObservable(this);
    }
    get currentView() {
      const {bounds, camera:{point, zoom}} = this, w2 = bounds.width / zoom, h2 = bounds.height / zoom;
      return {minX:-point[0], minY:-point[1], maxX:w2 - point[0], maxY:h2 - point[1], width:w2, height:h2};
    }
  }, TLViewport = _TLViewport;
  __publicField(TLViewport, "minZoom", 0.1);
  __publicField(TLViewport, "maxZoom", 4);
  __publicField(TLViewport, "panMultiplier", 0.05);
  __publicField(TLViewport, "panThreshold", 100);
  __decorateClass([observable], TLViewport.prototype, "bounds", 2);
  __decorateClass([observable], TLViewport.prototype, "camera", 2);
  __decorateClass([action], TLViewport.prototype, "updateBounds", 2);
  __decorateClass([action], TLViewport.prototype, "update", 2);
  __decorateClass([computed], TLViewport.prototype, "currentView", 1);
  var TLApi = class {
    constructor(app) {
      __publicField(this, "app");
      __publicField(this, "editShape", shape => {
        (null == shape ? 0 : shape.props.isLocked) || this.app.transition("select").selectedTool.transition("editingShape", {shape});
        return this;
      });
      __publicField(this, "hoverShape", shape => {
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
        const ids = "string" === typeof shapes2[0] ? shapes2 : shapes2.map(shape => shape.id);
        this.app.setSelectedShapes(this.app.selectedShapesArray.filter(shape => !ids.includes(shape.id)));
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
        this.app.setSelectedShapes(this.app.currentPage.shapes.filter(s2 => !this.app.shapesInGroups().includes(s2)));
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
        var {shapes:shapes2} = this.app.currentPage;
        if (0 === shapes2.length) {
          return this;
        }
        shapes2 = BoundsUtils.getCommonBounds(shapes2.map(shape => shape.bounds));
        this.app.viewport.zoomToBounds(shapes2);
        return this;
      });
      __publicField(this, "cameraToCenter", () => {
        var {shapes:shapes2} = this.app.currentPage;
        if (0 === shapes2.length) {
          return this;
        }
        shapes2 = BoundsUtils.getCommonBounds(shapes2.map(shape => shape.bounds));
        this.app.viewport.update({point:src_default.add(src_default.neg(BoundsUtils.getBoundsCenter(shapes2)), [this.app.viewport.currentView.width / 2, this.app.viewport.currentView.height / 2])});
        return this;
      });
      __publicField(this, "zoomToSelection", () => {
        const {selectionBounds} = this.app;
        if (!selectionBounds) {
          return this;
        }
        this.app.viewport.zoomToBounds(selectionBounds);
        return this;
      });
      __publicField(this, "resetZoomToCursor", () => {
        this.app.viewport.animateCamera({zoom:1, point:src_default.sub(this.app.inputs.originScreenPoint, this.app.inputs.originPoint)});
        return this;
      });
      __publicField(this, "toggleGrid", () => {
        const {settings} = this.app;
        settings.update({showGrid:!settings.showGrid});
        return this;
      });
      __publicField(this, "toggleSnapToGrid", () => {
        const {settings} = this.app;
        settings.update({snapToGrid:!settings.snapToGrid});
        return this;
      });
      __publicField(this, "togglePenMode", () => {
        const {settings} = this.app;
        settings.update({penMode:!settings.penMode});
        return this;
      });
      __publicField(this, "setColor", color => {
        const {settings} = this.app;
        settings.update({color});
        this.app.selectedShapesArray.forEach(s2 => {
          s2.props.isLocked || s2.update({fill:color, stroke:color});
        });
        this.app.persist();
        return this;
      });
      __publicField(this, "setScaleLevel", scaleLevel => {
        const {settings} = this.app;
        settings.update({scaleLevel});
        this.app.selectedShapes.forEach(shape => {
          shape.props.isLocked || shape.setScaleLevel(scaleLevel);
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
      __publicField(this, "createNewLineBinding", (source, target) => this.app.createNewLineBinding(source, target));
      __publicField(this, "clone", direction => {
        if (!this.app.readOnly && 1 === this.app.selectedShapesArray.length && Object.values(Geometry).some(geometry => geometry === this.app.selectedShapesArray[0].type)) {
          var shape = this.app.allSelectedShapesArray[0], ShapeClass = this.app.getShapeClass(shape.type), {minX, minY, maxX, maxY, width, height} = shape.bounds, point = [0, 0];
          switch(direction) {
            case "down":
              point = [minX, maxY + 100];
              break;
            case "up":
              point = [minX, minY - 100 - height];
              break;
            case "left":
              point = [minX - 100 - width, minY];
              break;
            case "right":
              point = [maxX + 100, minY];
          }
          var clone = new ShapeClass(__spreadProps(__spreadValues({}, shape.serialized), {id:v1_default(), nonce:Date.now(), refs:[], label:"", point}));
          this.app.history.pause();
          this.app.currentPage.addShapes(clone);
          this.app.createNewLineBinding(shape, clone);
          this.app.history.resume();
          this.app.persist();
          setTimeout(() => this.editShape(clone));
        }
      });
      __publicField(this, "cloneShapes", ({shapes:shapes2, assets, bindings, point = [0, 0]}) => {
        const commonBounds = BoundsUtils.getCommonBounds(shapes2.filter(s2 => "group" !== s2.type).map(shape => {
          var _a3, _b, _c, _d, _e2, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
          return {minX:null != (_b = null == (_a3 = shape.point) ? void 0 : _a3[0]) ? _b : point[0], minY:null != (_d = null == (_c = shape.point) ? void 0 : _c[1]) ? _d : point[1], width:null != (_f = null == (_e2 = shape.size) ? void 0 : _e2[0]) ? _f : 4, height:null != (_h = null == (_g = shape.size) ? void 0 : _g[1]) ? _h : 4, maxX:(null != (_j = null == (_i = shape.point) ? void 0 : _i[0]) ? _j : point[0]) + (null != (_l = null == (_k = shape.size) ? void 0 : _k[0]) ? _l : 4), maxY:(null != 
          (_n = null == (_m = shape.point) ? void 0 : _m[1]) ? _n : point[1]) + (null != (_p = null == (_o = shape.size) ? void 0 : _o[1]) ? _p : 4)};
        })), clonedShapes = shapes2.map(shape => __spreadProps(__spreadValues({}, shape), {id:v1_default(), point:[point[0] + shape.point[0] - commonBounds.minX, point[1] + shape.point[1] - commonBounds.minY]}));
        clonedShapes.forEach(s2 => {
          var _a3;
          s2.children && 0 < (null == (_a3 = s2.children) ? void 0 : _a3.length) && (s2.children = s2.children.map(oldId => {
            var _a4;
            return null == (_a4 = clonedShapes[shapes2.findIndex(s3 => s3.id === oldId)]) ? void 0 : _a4.id;
          }).filter(isNonNullable));
        });
        const clonedBindings = [];
        clonedShapes.flatMap(s2 => {
          var _a3;
          return Object.values(null != (_a3 = s2.handles) ? _a3 : {});
        }).forEach(handle => {
          if (handle.bindingId) {
            var binding = bindings[handle.bindingId];
            if (binding) {
              var oldFromIdx = shapes2.findIndex(s2 => s2.id === binding.fromId);
              const oldToIdx = shapes2.findIndex(s2 => s2.id === binding.toId);
              binding && -1 !== oldFromIdx && -1 !== oldToIdx ? (oldFromIdx = __spreadProps(__spreadValues({}, binding), {id:v1_default(), fromId:clonedShapes[oldFromIdx].id, toId:clonedShapes[oldToIdx].id}), clonedBindings.push(oldFromIdx), handle.bindingId = oldFromIdx.id) : handle.bindingId = void 0;
            } else {
              console.warn("binding not found", handle.bindingId);
            }
          }
        });
        assets = assets.filter(asset => clonedShapes.some(shape => shape.assetId === asset.id));
        return {shapes:clonedShapes, assets, bindings:clonedBindings};
      });
      __publicField(this, "getClonedShapesFromTldrString", (text, point) => {
        try {
          {
            var _a3;
            const innerText = null == (_a3 = text.match(/<whiteboard-tldr>(.*)<\/whiteboard-tldr>/)) ? void 0 : _a3[1];
            if (innerText) {
              try {
                var JSCompiler_inline_result = JSON.parse(innerText);
              } catch (e) {
                JSCompiler_inline_result = null;
              }
              var JSCompiler_inline_result$jscomp$0 = JSCompiler_inline_result;
            } else {
              JSCompiler_inline_result$jscomp$0 = void 0;
            }
          }
          text = JSCompiler_inline_result$jscomp$0;
          if (!text) {
            return null;
          }
          const {shapes:shapes2, bindings, assets} = text;
          return this.cloneShapes({shapes:shapes2, bindings, assets, point});
        } catch (err) {
          console.log(err);
        }
        return null;
      });
      __publicField(this, "cloneShapesIntoCurrentPage", opts => {
        (opts = this.cloneShapes(opts)) && this.addClonedShapes(opts);
        return this;
      });
      __publicField(this, "addClonedShapes", opts => {
        const {shapes:shapes2, assets, bindings} = opts;
        0 < assets.length && this.app.createAssets(assets);
        0 < shapes2.length && this.app.createShapes(shapes2);
        this.app.currentPage.updateBindings(Object.fromEntries(bindings.map(b3 => [b3.id, b3])));
        this.app.selectedTool.transition("idle");
        return this;
      });
      __publicField(this, "addClonedShapesFromTldrString", (text, point) => {
        (text = this.getClonedShapesFromTldrString(text, point)) && this.addClonedShapes(text);
        return this;
      });
      __publicField(this, "doGroup", (shapes2 = this.app.allSelectedShapesArray) => {
        if (!this.app.readOnly) {
          this.app.history.pause();
          var selectedGroups = [...shapes2.filter(s2 => "group" === s2.type), ...shapes2.map(s2 => this.app.getParentGroup(s2))].filter(isNonNullable);
          this.app.currentPage.removeShapes(...selectedGroups);
          shapes2 = shapes2.filter(s2 => "group" !== s2.type);
          1 < shapes2.length && (selectedGroups = this.app.getShapeClass("group"), selectedGroups = new selectedGroups({id:v1_default(), type:selectedGroups.id, parentId:this.app.currentPage.id, children:shapes2.map(s2 => s2.id)}), this.app.currentPage.addShapes(selectedGroups), this.app.setSelectedShapes([selectedGroups]), shapes2.push(selectedGroups), this.app.bringForward(shapes2));
          this.app.history.resume();
          this.app.persist(this.app.currentPage.persistInfo);
        }
      });
      __publicField(this, "unGroup", (shapes2 = this.app.allSelectedShapesArray) => {
        if (!this.app.readOnly) {
          shapes2 = [...shapes2.filter(s2 => "group" === s2.type), ...shapes2.map(s2 => this.app.getParentGroup(s2))].filter(isNonNullable);
          var shapesInGroups = this.app.shapesInGroups(shapes2);
          0 < shapes2.length && (this.app.currentPage.removeShapes(...shapes2), this.app.persist(), this.app.setSelectedShapes(shapesInGroups));
        }
      });
      __publicField(this, "convertShapes", (type, shapes2 = this.app.allSelectedShapesArray) => {
        const ShapeClass = this.app.getShapeClass(type);
        this.app.currentPage.removeShapes(...shapes2);
        shapes2 = shapes2.map(s2 => new ShapeClass(__spreadProps(__spreadValues({}, s2.serialized), {type, nonce:Date.now()})));
        this.app.currentPage.addShapes(...shapes2);
        this.app.persist();
        this.app.setSelectedShapes(shapes2);
      });
      __publicField(this, "setCollapsed", (collapsed, shapes2 = this.app.allSelectedShapesArray) => {
        shapes2.forEach(shape => {
          "logseq-portal" === shape.props.type && shape.setCollapsed(collapsed);
        });
        this.app.persist();
      });
      this.app = app;
    }
  }, TLCursors = class {
    constructor() {
      __publicField(this, "cursor", "default");
      __publicField(this, "rotation", 0);
      __publicField(this, "reset", () => {
        this.cursor = "default";
      });
      __publicField(this, "setCursor", (cursor, rotation = 0) => {
        if (cursor !== this.cursor || rotation !== this.rotation) {
          this.cursor = cursor, this.rotation = rotation;
        }
      });
      __publicField(this, "setRotation", rotation => {
        rotation !== this.rotation && (this.rotation = rotation);
      });
      makeObservable(this);
    }
  };
  __decorateClass([observable], TLCursors.prototype, "cursor", 2);
  __decorateClass([observable], TLCursors.prototype, "rotation", 2);
  __decorateClass([action], TLCursors.prototype, "reset", 2);
  __decorateClass([action], TLCursors.prototype, "setCursor", 2);
  __decorateClass([action], TLCursors.prototype, "setRotation", 2);
  var TLHistory = class {
    constructor(app) {
      __publicField(this, "app");
      __publicField(this, "stack", []);
      __publicField(this, "isPaused", !0);
      __publicField(this, "pause", () => {
        this.isPaused || (this.isPaused = !0);
      });
      __publicField(this, "resume", () => {
        this.isPaused && (this.isPaused = !1);
      });
      __publicField(this, "persist", info => {
        this.isPaused || this.creating || this.app.notify("persist", info);
      });
      __publicField(this, "undo", () => {
        this.isPaused || "idle" === this.app.selectedTool.currentState.id && this.app.appUndo && this.app.appUndo();
      });
      __publicField(this, "redo", () => {
        this.isPaused || "idle" === this.app.selectedTool.currentState.id && this.app.appRedo && this.app.appRedo();
      });
      __publicField(this, "instantiateShape", serializedShape => new (this.app.getShapeClass(serializedShape.type))(serializedShape));
      __publicField(this, "deserialize", snapshot => {
        transaction(() => {
          var _a3, {pages} = snapshot;
          const wasPaused = this.isPaused;
          this.pause();
          const newSelectedIds = [...this.app.selectedIds];
          try {
            const pagesMap = new Map(this.app.pages), pagesToAdd = [];
            for (const serializedPage of pages) {
              const page = pagesMap.get(serializedPage.id);
              if (void 0 !== page) {
                const shapesMap = new Map(page.shapes.map(shape => [shape.props.id, shape]));
                pages = [];
                for (const serializedShape of serializedPage.shapes) {
                  const shape = shapesMap.get(serializedShape.id);
                  void 0 !== shape ? (shape.nonce !== serializedShape.nonce && (shape.update(serializedShape, !0), shape.nonce = serializedShape.nonce, shape.setLastSerialized(serializedShape)), shapesMap.delete(serializedShape.id)) : pages.push(this.instantiateShape(serializedShape));
                }
                0 < shapesMap.size && !this.app.selectedTool.isInAny("creating", "editingShape") && page.removeShapes(...shapesMap.values());
                0 < pages.length && page.addShapes(...pages);
                pagesMap.delete(serializedPage.id);
                page.updateBindings(serializedPage.bindings);
                page.nonce = null != (_a3 = serializedPage.nonce) ? _a3 : 0;
              } else {
                const {id:id3, name, shapes:shapes2, bindings, nonce} = serializedPage;
                pagesToAdd.push(new TLPage(this.app, {id:id3, name, nonce, bindings, shapes:shapes2.map(serializedShape => this.instantiateShape(serializedShape))}));
              }
            }
            0 < pagesToAdd.length && this.app.addPages(pagesToAdd);
            0 < pagesMap.size && this.app.removePages(Array.from(pagesMap.values()));
            this.app.setSelectedShapes(newSelectedIds).setErasingShapes([]);
          } catch (e) {
            console.warn(e);
          }
          wasPaused || this.resume();
        });
      });
      this.app = app;
      makeObservable(this);
    }
    get creating() {
      return "creating" === this.app.selectedTool.currentState.id;
    }
  };
  __decorateClass([observable], TLHistory.prototype, "stack", 2);
  __decorateClass([action], TLHistory.prototype, "persist", 2);
  __decorateClass([action], TLHistory.prototype, "undo", 2);
  __decorateClass([action], TLHistory.prototype, "redo", 2);
  __decorateClass([action], TLHistory.prototype, "deserialize", 2);
  var TLSettings = class {
    constructor() {
      __publicField(this, "mode", "light");
      __publicField(this, "showGrid", !0);
      __publicField(this, "snapToGrid", !1);
      __publicField(this, "penMode", !1);
      __publicField(this, "scaleLevel", "md");
      __publicField(this, "color", "");
      makeObservable(this);
    }
    update(props) {
      Object.assign(this, props);
    }
  };
  __decorateClass([observable], TLSettings.prototype, "mode", 2);
  __decorateClass([observable], TLSettings.prototype, "showGrid", 2);
  __decorateClass([observable], TLSettings.prototype, "snapToGrid", 2);
  __decorateClass([observable], TLSettings.prototype, "penMode", 2);
  __decorateClass([observable], TLSettings.prototype, "scaleLevel", 2);
  __decorateClass([observable], TLSettings.prototype, "color", 2);
  __decorateClass([action], TLSettings.prototype, "update", 1);
  var TLApp = class extends TLRootState {
    constructor(serializedApp, Shapes, Tools, readOnly) {
      var _a3, _b;
      super();
      __publicField(this, "uuid", v1_default());
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
      __publicField(this, "saving", !1);
      __publicField(this, "saveState", () => {
        this.history.isPaused || (this.saving = !0, requestAnimationFrame(() => {
          this.saving && (this.persist(), this.saving = !1);
        }));
      });
      __publicField(this, "load", () => {
        this.notify("load", null);
        return this;
      });
      __publicField(this, "save", () => {
        this.notify("save", null);
        return this;
      });
      __publicField(this, "pages", new Map([["page", new TLPage(this, {id:"page", name:"page", shapes:[], bindings:{}})]]));
      __publicField(this, "getPageById", pageId => {
        const page = this.pages.get(pageId);
        if (!page) {
          throw Error(`Could not find a page named ${pageId}.`);
        }
        return page;
      });
      __publicField(this, "getShapeById", (id3, pageId = this.currentPage.id) => {
        var _a3;
        return null == (_a3 = this.getPageById(pageId)) ? void 0 : _a3.shapesById[id3];
      });
      __publicField(this, "createShapes", shapes2 => {
        if (this.readOnly) {
          return this;
        }
        (shapes2 = this.currentPage.addShapes(...shapes2)) && this.notify("create-shapes", shapes2);
        this.persist();
        return this;
      });
      __publicField(this, "updateShapes", shapes2 => {
        if (this.readOnly) {
          return this;
        }
        shapes2.forEach(shape => {
          const oldShape = this.getShapeById(shape.id);
          null == oldShape || oldShape.update(shape);
          shape.type !== (null == oldShape ? void 0 : oldShape.type) && this.api.convertShapes(shape.type, [oldShape]);
        });
        this.persist();
        return this;
      });
      __publicField(this, "deleteShapes", shapes2 => {
        if (0 === shapes2.length || this.readOnly) {
          return this;
        }
        shapes2 = shapes2.map(shape => "string" === typeof shape ? this.getShapeById(shape) : shape).filter(isNonNullable).filter(s2 => !s2.props.isLocked);
        const shapesInGroups = this.shapesInGroups(shapes2);
        shapes2.forEach(shape => {
          this.getParentGroup(shape) && shapesInGroups.push(shape);
        });
        let ids = new Set([...shapes2, ...shapesInGroups].map(s2 => s2.id));
        shapesInGroups.forEach(shape => {
          var _a3;
          const parentGroup = this.getParentGroup(shape);
          if (parentGroup) {
            const newChildren = null == (_a3 = parentGroup.props.children) ? void 0 : _a3.filter(id3 => id3 !== shape.id);
            !newChildren || 1 >= (null == newChildren ? void 0 : newChildren.length) ? ids.add(parentGroup.id) : parentGroup.update({children:newChildren});
          }
        });
        const deleteBinding = (shapeA, shapeB) => {
          var _a3;
          [...ids].includes(shapeA) && "line" === (null == (_a3 = this.getShapeById(shapeB)) ? void 0 : _a3.type) && ids.add(shapeB);
        };
        this.currentPage.shapes.filter(s2 => !s2.props.isLocked).flatMap(s2 => {
          var _a3;
          return Object.values(null != (_a3 = s2.props.handles) ? _a3 : {});
        }).flatMap(h2 => h2.bindingId).filter(isNonNullable).map(binding => {
          var _a3, _b;
          const toId = null == (_a3 = this.currentPage.bindings[binding]) ? void 0 : _a3.toId;
          binding = null == (_b = this.currentPage.bindings[binding]) ? void 0 : _b.fromId;
          toId && binding && (deleteBinding(toId, binding), deleteBinding(binding, toId));
        });
        shapes2 = [...ids].map(id3 => this.getShapeById(id3));
        this.setSelectedShapes(this.selectedShapesArray.filter(shape => !ids.has(shape.id)));
        (shapes2 = this.currentPage.removeShapes(...shapes2)) && this.notify("delete-shapes", shapes2);
        this.persist();
        return this;
      });
      __publicField(this, "bringForward", (shapes2 = this.selectedShapesArray) => {
        0 < shapes2.length && !this.readOnly && this.currentPage.bringForward(shapes2);
        return this;
      });
      __publicField(this, "sendBackward", (shapes2 = this.selectedShapesArray) => {
        0 < shapes2.length && !this.readOnly && this.currentPage.sendBackward(shapes2);
        return this;
      });
      __publicField(this, "sendToBack", (shapes2 = this.selectedShapesArray) => {
        0 < shapes2.length && !this.readOnly && this.currentPage.sendToBack(shapes2);
        return this;
      });
      __publicField(this, "bringToFront", (shapes2 = this.selectedShapesArray) => {
        0 < shapes2.length && !this.readOnly && this.currentPage.bringToFront(shapes2);
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
        if (2 > shapes2.length || this.readOnly) {
          return this;
        }
        const boundsForShapes = shapes2.map(shape => {
          const bounds = shape.getBounds();
          return {id:shape.id, point:[bounds.minX, bounds.minY], bounds};
        }), commonBounds = BoundsUtils.getCommonBounds(boundsForShapes.map(({bounds}) => bounds)), midX = commonBounds.minX + commonBounds.width / 2, midY = commonBounds.minY + commonBounds.height / 2, deltaMap = Object.fromEntries(boundsForShapes.map(({id:id3, point, bounds}) => [id3, {prev:point, next:{top:[point[0], commonBounds.minY], centerVertical:[point[0], midY - bounds.height / 2], bottom:[point[0], commonBounds.maxY - bounds.height], left:[commonBounds.minX, point[1]], centerHorizontal:[midX - 
        bounds.width / 2, point[1]], right:[commonBounds.maxX - bounds.width, point[1]]}[type]}]));
        shapes2.forEach(shape => {
          deltaMap[shape.id] && shape.update({point:deltaMap[shape.id].next});
        });
        this.persist();
        return this;
      });
      __publicField(this, "distribute", (type, shapes2 = this.selectedShapesArray) => {
        if (2 > shapes2.length || this.readOnly) {
          return this;
        }
        const deltaMap = Object.fromEntries(BoundsUtils.getDistributions(shapes2, type).map(d2 => [d2.id, d2]));
        shapes2.forEach(shape => {
          deltaMap[shape.id] && shape.update({point:deltaMap[shape.id].next});
        });
        this.persist();
        return this;
      });
      __publicField(this, "packIntoRectangle", (shapes2 = this.selectedShapesArray) => {
        if (2 > shapes2.length || this.readOnly) {
          return this;
        }
        const deltaMap = Object.fromEntries(BoundsUtils.getPackedDistributions(shapes2).map(d2 => [d2.id, d2]));
        shapes2.forEach(shape => {
          deltaMap[shape.id] && shape.update({point:deltaMap[shape.id].next});
        });
        this.persist();
        return this;
      });
      __publicField(this, "setLocked", locked => {
        if (0 === this.selectedShapesArray.length || this.readOnly) {
          return this;
        }
        this.selectedShapesArray.forEach(shape => {
          shape.update({isLocked:locked});
        });
        this.persist();
        return this;
      });
      __publicField(this, "assets", {});
      __publicField(this, "removeUnusedAssets", () => {
        const usedAssets = this.getCleanUpAssets();
        Object.keys(this.assets).forEach(assetId => {
          usedAssets.some(asset => asset.id === assetId) || delete this.assets[assetId];
        });
        this.persist();
        return this;
      });
      __publicField(this, "copy", () => {
        if (0 < this.selectedShapesArray.length && !this.editingShape) {
          const selectedShapes = this.allSelectedShapesArray;
          var jsonString = JSON.stringify({shapes:selectedShapes.map(shape => shape.serialized), assets:this.getCleanUpAssets().filter(asset => selectedShapes.some(shape => shape.props.assetId === asset.id)), bindings:toJS(this.currentPage.bindings)});
          jsonString = encodeURIComponent(`<whiteboard-tldr>${jsonString}</whiteboard-tldr>`);
          const shapeBlockRefs = this.selectedShapesArray.map(s2 => `((${s2.props.id}))`).join(" ");
          this.notify("copy", {text:shapeBlockRefs, html:jsonString});
        }
      });
      __publicField(this, "paste", (e, shiftKey) => {
        var _a3;
        this.editingShape || this.readOnly || this.notify("paste", {point:this.inputs.currentPoint, shiftKey:!!shiftKey, dataTransfer:null != (_a3 = null == e ? void 0 : e.clipboardData) ? _a3 : void 0});
      });
      __publicField(this, "cut", () => {
        this.copy();
        this.api.deleteShapes();
      });
      __publicField(this, "drop", (dataTransfer, point) => {
        this.notify("drop", {dataTransfer, point:point ? this.viewport.getPagePoint(point) : BoundsUtils.getBoundsCenter(this.viewport.currentView)});
      });
      __publicField(this, "selectTool", (id3, data = {}) => {
        this.readOnly && !["select", "move"].includes(id3) || this.transition(id3, data);
      });
      __publicField(this, "editingId");
      __publicField(this, "setEditingShape", shape => {
        this.editingId = "string" === typeof shape ? shape : null == shape ? void 0 : shape.id;
        return this;
      });
      __publicField(this, "clearEditingState", () => {
        this.selectedTool.transition("idle");
        return this.setEditingShape();
      });
      __publicField(this, "hoveredId");
      __publicField(this, "setHoveredShape", shape => {
        this.hoveredId = "string" === typeof shape ? shape : null == shape ? void 0 : shape.id;
        return this;
      });
      __publicField(this, "selectedIds", new Set());
      __publicField(this, "selectedShapes", new Set());
      __publicField(this, "selectionRotation", 0);
      __publicField(this, "setSelectedShapes", shapes2 => {
        var _a3;
        const {selectedIds, selectedShapes} = this;
        selectedIds.clear();
        selectedShapes.clear();
        shapes2[0] && "string" === typeof shapes2[0] ? shapes2.forEach(s2 => selectedIds.add(s2)) : shapes2.forEach(s2 => selectedIds.add(s2.id));
        const newSelectedShapes = this.currentPage.shapes.filter(shape => selectedIds.has(shape.id));
        newSelectedShapes.forEach(s2 => selectedShapes.add(s2));
        this.selectionRotation = 1 === newSelectedShapes.length ? null != (_a3 = newSelectedShapes[0].props.rotation) ? _a3 : 0 : 0;
        0 === shapes2.length && this.setEditingShape();
        return this;
      });
      __publicField(this, "erasingIds", new Set());
      __publicField(this, "erasingShapes", new Set());
      __publicField(this, "setErasingShapes", shapes2 => {
        const {erasingIds, erasingShapes} = this;
        erasingIds.clear();
        erasingShapes.clear();
        shapes2[0] && "string" === typeof shapes2[0] ? shapes2.forEach(s2 => erasingIds.add(s2)) : shapes2.forEach(s2 => erasingIds.add(s2.id));
        this.currentPage.shapes.filter(shape => erasingIds.has(shape.id)).forEach(s2 => erasingShapes.add(s2));
        return this;
      });
      __publicField(this, "bindingIds");
      __publicField(this, "setBindingShapes", ids => {
        this.bindingIds = ids;
        return this;
      });
      __publicField(this, "clearBindingShape", () => this.setBindingShapes());
      __publicField(this, "createNewLineBinding", (source, target) => {
        source = "string" === typeof source ? this.getShapeById(source) : source;
        target = "string" === typeof target ? this.getShapeById(target) : target;
        if ((null == source ? 0 : source.canBind) && (null == target ? 0 : target.canBind) && (target = createNewLineBinding(source, target))) {
          const [newLine, newBindings] = target;
          this.createShapes([newLine]);
          this.currentPage.updateBindings(Object.fromEntries(newBindings.map(b3 => [b3.id, b3])));
          this.persist();
          return !0;
        }
        return !1;
      });
      __publicField(this, "brush");
      __publicField(this, "setBrush", brush => {
        this.brush = brush;
        return this;
      });
      __publicField(this, "setCamera", (point, zoom) => {
        this.viewport.update({point, zoom});
        return this;
      });
      __publicField(this, "getPagePoint", point => {
        const {camera} = this.viewport;
        return Vec.sub(Vec.div(point, camera.zoom), camera.point);
      });
      __publicField(this, "getScreenPoint", point => {
        const {camera} = this.viewport;
        return Vec.mul(Vec.add(point, camera.point), camera.zoom);
      });
      __publicField(this, "Shapes", new Map());
      __publicField(this, "registerShapes", Shapes => {
        Shapes.forEach(Shape5 => {
          if ("group" === Shape5.id) {
            const app = this;
            Shape5.prototype.getShapes = function() {
              var _a3, _b;
              return null != (_b = null == (_a3 = this.props.children) ? void 0 : _a3.map(id3 => app.getShapeById(id3)).filter(Boolean)) ? _b : [];
            };
          }
          return this.Shapes.set(Shape5.id, Shape5);
        });
      });
      __publicField(this, "deregisterShapes", Shapes => {
        Shapes.forEach(Shape5 => this.Shapes.delete(Shape5.id));
      });
      __publicField(this, "getShapeClass", type => {
        if (!type) {
          throw Error("No shape type provided.");
        }
        const Shape5 = this.Shapes.get(type);
        if (!Shape5) {
          throw Error(`Could not find shape class for ${type}`);
        }
        return Shape5;
      });
      __publicField(this, "wrapUpdate", fn => {
        transaction(() => {
          const shouldSave = !this.history.isPaused;
          shouldSave && this.history.pause();
          fn();
          shouldSave && (this.history.resume(), this.persist());
        });
      });
      __publicField(this, "subscriptions", new Set([]));
      __publicField(this, "subscribe", (event, callback) => {
        if (void 0 === callback) {
          throw Error("Callback is required.");
        }
        const subscription = {event, callback};
        this.subscriptions.add(subscription);
        return () => this.unsubscribe(subscription);
      });
      __publicField(this, "unsubscribe", subscription => {
        this.subscriptions.delete(subscription);
        return this;
      });
      __publicField(this, "notify", (event, info) => {
        this.subscriptions.forEach(subscription => {
          subscription.event === event && subscription.callback(this, info);
        });
        return this;
      });
      __publicField(this, "onTransition", () => {
      });
      __publicField(this, "onPointerDown", (info, e) => {
        if (!this.editingShape && 1 === e.button && !this.isIn("move")) {
          this.temporaryTransitionToMove(e);
        } else {
          if (2 === e.button && !this.editingShape) {
            e.preventDefault(), this.transition("select");
          } else {
            if ("clientX" in e) {
              this.inputs.onPointerDown([...this.viewport.getPagePoint([e.clientX, e.clientY]), e.pressure], e);
            }
          }
        }
      });
      __publicField(this, "onPointerUp", (info, e) => {
        if (!this.editingShape && 1 === e.button && this.isIn("move")) {
          this.selectedTool.transition("idle", {exit:!0}), e.stopPropagation(), e.preventDefault();
        } else {
          if ("clientX" in e) {
            this.inputs.onPointerUp([...this.viewport.getPagePoint([e.clientX, e.clientY]), e.pressure], e);
          }
        }
      });
      __publicField(this, "onPointerMove", (info, e) => {
        if ("clientX" in e) {
          this.inputs.onPointerMove([...this.viewport.getPagePoint([e.clientX, e.clientY]), e.pressure], e);
        }
      });
      __publicField(this, "onKeyDown", (info, e) => {
        if (this.editingShape || " " !== e.key || this.isIn("move")) {
          this.inputs.onKeyDown(e);
        } else {
          this.temporaryTransitionToMove(e);
        }
      });
      __publicField(this, "onKeyUp", (info, e) => {
        if (!this.editingShape && " " === e.key && this.isIn("move")) {
          this.selectedTool.transition("idle", {exit:!0}), e.stopPropagation(), e.preventDefault();
        } else {
          this.inputs.onKeyUp(e);
        }
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
      this.states && 0 < this.states.length && (this.registerStates(this.states), readOnly = null != (_a3 = this.initial) ? _a3 : this.states[0].id, _a3 = this.children.get(readOnly)) && (this.currentState = _a3, null == (_b = this.currentState) || _b._events.onEnter({fromId:"initial"}));
      Shapes && this.registerShapes(Shapes);
      Tools && this.registerTools(Tools);
      this.history.resume();
      serializedApp && this.history.deserialize(serializedApp);
      this.api = new TLApi(this);
      makeObservable(this);
      this.notify("mount", null);
    }
    loadDocumentModel(model) {
      this.history.deserialize(model);
      model.assets && 0 < model.assets.length && this.addAssets(model.assets);
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
      pages.forEach(page => this.pages.set(page.id, page));
      this.persist();
      return this;
    }
    removePages(pages) {
      pages.forEach(page => this.pages.delete(page.id));
      this.persist();
      return this;
    }
    shapesInGroups(groups = this.shapes) {
      return groups.flatMap(shape => shape.props.children).filter(isNonNullable).map(id3 => this.getShapeById(id3)).filter(isNonNullable);
    }
    getParentGroup(shape) {
      return this.shapes.find(group => {
        var _a3;
        return null == (_a3 = group.props.children) ? void 0 : _a3.includes(shape.id);
      });
    }
    addAssets(assets) {
      assets.forEach(asset => this.assets[asset.id] = asset);
      return this;
    }
    removeAssets(assets) {
      "string" === typeof assets[0] ? assets.forEach(asset => delete this.assets[asset]) : assets.forEach(asset => delete this.assets[asset.id]);
      this.persist();
      return this;
    }
    getCleanUpAssets() {
      const usedAssets = new Set();
      this.pages.forEach(p2 => p2.shapes.forEach(s2 => {
        s2.props.assetId && this.assets[s2.props.assetId] && usedAssets.add(this.assets[s2.props.assetId]);
      }));
      return Array.from(usedAssets);
    }
    createAssets(assets) {
      this.addAssets(assets);
      this.notify("create-assets", {assets});
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
      const {editingId, currentPage} = this;
      return editingId ? currentPage.shapes.find(shape => shape.id === editingId) : void 0;
    }
    get hoveredShape() {
      const {hoveredId, currentPage} = this;
      return hoveredId ? currentPage.shapes.find(shape => shape.id === hoveredId) : void 0;
    }
    get hoveredGroup() {
      const {hoveredShape} = this;
      return hoveredShape ? this.shapes.find(s2 => {
        var _a3;
        return "group" === s2.type && (null == (_a3 = s2.props.children) ? void 0 : _a3.includes(hoveredShape.id));
      }) : void 0;
    }
    get selectedShapesArray() {
      const {selectedShapes, selectedTool} = this;
      return "select" !== selectedTool.id ? [] : Array.from(selectedShapes.values());
    }
    get allSelectedShapes() {
      return new Set(this.allSelectedShapesArray);
    }
    get allSelectedShapesArray() {
      const {selectedShapesArray} = this;
      return [...(new Set([...selectedShapesArray, ...this.shapesInGroups(selectedShapesArray)]))];
    }
    setSelectionRotation(radians) {
      this.selectionRotation = radians;
    }
    get erasingShapesArray() {
      return Array.from(this.erasingShapes.values());
    }
    get bindingShapes() {
      var _a3;
      const activeBindings = 1 === this.selectedShapesArray.length ? this.selectedShapesArray.flatMap(s2 => {
        var _a4;
        return Object.values(null != (_a4 = s2.props.handles) ? _a4 : {});
      }).flatMap(h2 => h2.bindingId).filter(isNonNullable).flatMap(binding => {
        var _a4, _b;
        return [null == (_a4 = this.currentPage.bindings[binding]) ? void 0 : _a4.fromId, null == (_b = this.currentPage.bindings[binding]) ? void 0 : _b.toId];
      }).filter(isNonNullable) : [], bindingIds = [...(null != (_a3 = this.bindingIds) ? _a3 : []), ...activeBindings];
      return bindingIds ? this.currentPage.shapes.filter(shape => null == bindingIds ? void 0 : bindingIds.includes(shape.id)) : void 0;
    }
    get currentGrid() {
      const {zoom} = this.viewport.camera;
      return 0.15 > zoom ? 128 : 1 > zoom ? 32 : 8;
    }
    get shapes() {
      const {currentPage:{shapes:shapes2}} = this;
      return Array.from(shapes2.values());
    }
    get shapesInViewport() {
      const {selectedShapes, currentPage, viewport:{currentView}} = this;
      return currentPage.shapes.filter(shape => !shape.canUnmount || selectedShapes.has(shape) || BoundsUtils.boundsContain(currentView, shape.rotatedBounds) || BoundsUtils.boundsCollide(currentView, shape.rotatedBounds));
    }
    get selectionDirectionHint() {
      const {selectionBounds, viewport:{currentView}} = this;
      if (selectionBounds && !BoundsUtils.boundsContain(currentView, selectionBounds) && !BoundsUtils.boundsCollide(currentView, selectionBounds)) {
        var center = BoundsUtils.getBoundsCenter(selectionBounds);
        return Vec.clampV([(center[0] - currentView.minX - currentView.width / 2) / currentView.width, (center[1] - currentView.minY - currentView.height / 2) / currentView.height], -1, 1);
      }
    }
    get selectionBounds() {
      const {selectedShapesArray} = this;
      if (0 !== selectedShapesArray.length) {
        return 1 === selectedShapesArray.length ? __spreadProps(__spreadValues({}, selectedShapesArray[0].bounds), {rotation:selectedShapesArray[0].props.rotation}) : BoundsUtils.getCommonBounds(this.selectedShapesArray.map(shape => shape.rotatedBounds));
      }
    }
    get showSelection() {
      var _a3;
      const {selectedShapesArray} = this;
      return this.isIn("select") && !this.isInAny("select.translating", "select.pinching", "select.rotating") && (1 === selectedShapesArray.length && !(null == (_a3 = selectedShapesArray[0]) ? 0 : _a3.hideSelection) || 1 < selectedShapesArray.length);
    }
    get showSelectionDetail() {
      return this.isIn("select") && !this.isInAny("select.translating", "select.pinching") && 0 < this.selectedShapes.size && !this.selectedShapesArray.every(shape => shape.hideSelectionDetail) && !1;
    }
    get showSelectionRotation() {
      return this.showSelectionDetail && this.isInAny("select.rotating", "select.pointingRotateHandle");
    }
    get showContextBar() {
      const {selectedShapesArray} = this;
      return this.isInAny("select.idle", "select.hoveringSelectionHandle") && !this.isIn("select.contextMenu") && 0 < selectedShapesArray.length && !this.readOnly && !selectedShapesArray.every(shape => shape.hideContextBar);
    }
    get showRotateHandles() {
      const {selectedShapesArray} = this;
      return this.isInAny("select.idle", "select.hoveringSelectionHandle", "select.pointingRotateHandle", "select.pointingResizeHandle") && 0 < selectedShapesArray.length && !this.readOnly && !selectedShapesArray.some(shape => shape.hideRotateHandle);
    }
    get showResizeHandles() {
      const {selectedShapesArray} = this;
      return this.isInAny("select.idle", "select.hoveringSelectionHandle", "select.pointingShape", "select.pointingSelectedShape", "select.pointingRotateHandle", "select.pointingResizeHandle") && 1 === selectedShapesArray.length && !this.readOnly && !selectedShapesArray.every(shape => shape.hideResizeHandles);
    }
    get showCloneHandles() {
      const {selectedShapesArray} = this;
      return this.isInAny("select.idle", "select.hoveringSelectionHandle", "select.pointingShape", "select.pointingSelectedShape") && 1 === selectedShapesArray.length && Object.values(Geometry).some(geometry => geometry === this.selectedShapesArray[0].type) && !this.readOnly;
    }
    temporaryTransitionToMove(event) {
      event.stopPropagation();
      event.preventDefault();
      this.transition("move", {prevTool:this.selectedTool});
      this.selectedTool.transition("idleHold");
    }
  };
  __publicField(TLApp, "id", "app");
  __publicField(TLApp, "initial", "select");
  __decorateClass([computed], TLApp.prototype, "serialized", 1);
  __decorateClass([observable], TLApp.prototype, "pages", 2);
  __decorateClass([computed], TLApp.prototype, "currentPageId", 1);
  __decorateClass([computed], TLApp.prototype, "currentPage", 1);
  __decorateClass([action], TLApp.prototype, "addPages", 1);
  __decorateClass([action], TLApp.prototype, "removePages", 1);
  __decorateClass([action], TLApp.prototype, "createShapes", 2);
  __decorateClass([action], TLApp.prototype, "updateShapes", 2);
  __decorateClass([action], TLApp.prototype, "deleteShapes", 2);
  __decorateClass([observable], TLApp.prototype, "assets", 2);
  __decorateClass([action], TLApp.prototype, "addAssets", 1);
  __decorateClass([action], TLApp.prototype, "removeAssets", 1);
  __decorateClass([action], TLApp.prototype, "removeUnusedAssets", 2);
  __decorateClass([computed], TLApp.prototype, "selectedTool", 1);
  __decorateClass([observable], TLApp.prototype, "editingId", 2);
  __decorateClass([computed], TLApp.prototype, "editingShape", 1);
  __decorateClass([action], TLApp.prototype, "setEditingShape", 2);
  __decorateClass([observable], TLApp.prototype, "hoveredId", 2);
  __decorateClass([computed], TLApp.prototype, "hoveredShape", 1);
  __decorateClass([computed], TLApp.prototype, "hoveredGroup", 1);
  __decorateClass([action], TLApp.prototype, "setHoveredShape", 2);
  __decorateClass([observable], TLApp.prototype, "selectedIds", 2);
  __decorateClass([observable], TLApp.prototype, "selectedShapes", 2);
  __decorateClass([observable], TLApp.prototype, "selectionRotation", 2);
  __decorateClass([computed], TLApp.prototype, "selectedShapesArray", 1);
  __decorateClass([computed], TLApp.prototype, "allSelectedShapes", 1);
  __decorateClass([computed], TLApp.prototype, "allSelectedShapesArray", 1);
  __decorateClass([action], TLApp.prototype, "setSelectedShapes", 2);
  __decorateClass([action], TLApp.prototype, "setSelectionRotation", 1);
  __decorateClass([observable], TLApp.prototype, "erasingIds", 2);
  __decorateClass([observable], TLApp.prototype, "erasingShapes", 2);
  __decorateClass([computed], TLApp.prototype, "erasingShapesArray", 1);
  __decorateClass([action], TLApp.prototype, "setErasingShapes", 2);
  __decorateClass([observable], TLApp.prototype, "bindingIds", 2);
  __decorateClass([computed], TLApp.prototype, "bindingShapes", 1);
  __decorateClass([action], TLApp.prototype, "setBindingShapes", 2);
  __decorateClass([action], TLApp.prototype, "createNewLineBinding", 2);
  __decorateClass([observable], TLApp.prototype, "brush", 2);
  __decorateClass([action], TLApp.prototype, "setBrush", 2);
  __decorateClass([action], TLApp.prototype, "setCamera", 2);
  __decorateClass([computed], TLApp.prototype, "currentGrid", 1);
  __decorateClass([computed], TLApp.prototype, "shapes", 1);
  __decorateClass([computed], TLApp.prototype, "shapesInViewport", 1);
  __decorateClass([computed], TLApp.prototype, "selectionDirectionHint", 1);
  __decorateClass([computed], TLApp.prototype, "selectionBounds", 1);
  __decorateClass([computed], TLApp.prototype, "showSelection", 1);
  __decorateClass([computed], TLApp.prototype, "showSelectionDetail", 1);
  __decorateClass([computed], TLApp.prototype, "showSelectionRotation", 1);
  __decorateClass([computed], TLApp.prototype, "showContextBar", 1);
  __decorateClass([computed], TLApp.prototype, "showRotateHandles", 1);
  __decorateClass([computed], TLApp.prototype, "showResizeHandles", 1);
  __decorateClass([computed], TLApp.prototype, "showCloneHandles", 1);
  var toStringFunction = Function.prototype.toString, create = Object.create, toStringObject = Object.prototype.toString, LegacyCache = function() {
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
  }(), createCache = "undefined" !== typeof WeakMap ? createCacheModern : createCacheLegacy, getRegExpFlags = "g" === /test/g.flags ? getRegExpFlagsModern : getRegExpFlagsLegacy, getTag = "undefined" !== typeof Symbol ? getTagModern : getTagLegacy, defineProperty3 = Object.defineProperty, getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor, getOwnPropertyNames = Object.getOwnPropertyNames, getOwnPropertySymbols = Object.getOwnPropertySymbols, _a = Object.prototype, hasOwnProperty = _a.hasOwnProperty, 
  propertyIsEnumerable = _a.propertyIsEnumerable, SUPPORTS_SYMBOL = "function" === typeof getOwnPropertySymbols, getStrictProperties = SUPPORTS_SYMBOL ? getStrictPropertiesModern : getOwnPropertyNames, isArray = Array.isArray, assign2 = Object.assign, getPrototypeOf = Object.getPrototypeOf, DEFAULT_LOOSE_OPTIONS = {array:function(array2, state) {
    var clone = new state.Constructor();
    state.cache.set(array2, clone);
    for (var index2 = 0, length_2 = array2.length; index2 < length_2; ++index2) {
      clone[index2] = state.copier(array2[index2], state);
    }
    return clone;
  }, arrayBuffer:function(arrayBuffer, _state) {
    return arrayBuffer.slice(0);
  }, blob:function(blob, _state) {
    return blob.slice(0, blob.size, blob.type);
  }, dataView:function(dataView, state) {
    return new state.Constructor(dataView.buffer.slice(0));
  }, date:function(date, state) {
    return new state.Constructor(date.getTime());
  }, error:copySelf, map:copyMapLoose, object:SUPPORTS_SYMBOL ? copyObjectLooseModern : copyObjectLooseLegacy, regExp:function(regExp, state) {
    state = new state.Constructor(regExp.source, getRegExpFlags(regExp));
    state.lastIndex = regExp.lastIndex;
    return state;
  }, set:copySetLoose}, DEFAULT_STRICT_OPTIONS = assign2({}, DEFAULT_LOOSE_OPTIONS, {array:function(array2, state) {
    var clone = new state.Constructor();
    state.cache.set(array2, clone);
    return copyOwnPropertiesStrict(array2, clone, state);
  }, map:function(map3, state) {
    return copyOwnPropertiesStrict(map3, copyMapLoose(map3, state), state);
  }, object:function(object2, state) {
    var clone = getCleanClone(state.prototype);
    state.cache.set(object2, clone);
    return copyOwnPropertiesStrict(object2, clone, state);
  }, set:function(set4, state) {
    return copyOwnPropertiesStrict(set4, copySetLoose(set4, state), state);
  }});
  createCopier(assign2({}, DEFAULT_STRICT_OPTIONS, {}));
  var index = createCopier({}), import_fast_deep_equal = __toESM(require_fast_deep_equal()), import_deepmerge = __toESM(require_cjs()), deepCopy = index, _TextUtils = class {
    static insertTextFirefox(field, text) {
      field.setRangeText(text, field.selectionStart || 0, field.selectionEnd || 0, "end");
      field.dispatchEvent(new InputEvent("input", {data:text, inputType:"insertText", isComposing:!1}));
    }
    static insert(field, text) {
      const document2 = field.ownerDocument, initialFocus = document2.activeElement;
      initialFocus !== field && field.focus();
      document2.execCommand("insertText", !1, text) || _TextUtils.insertTextFirefox(field, text);
      initialFocus === document2.body ? field.blur() : initialFocus instanceof HTMLElement && initialFocus !== field && initialFocus.focus();
    }
    static set(field, text) {
      field.select();
      _TextUtils.insert(field, text);
    }
    static getSelection(field) {
      const {selectionStart, selectionEnd} = field;
      return field.value.slice(selectionStart ? selectionStart : void 0, selectionEnd ? selectionEnd : void 0);
    }
    static wrapSelection(field, wrap, wrapEnd) {
      const {selectionStart, selectionEnd} = field, selection = _TextUtils.getSelection(field);
      _TextUtils.insert(field, wrap + selection + (null != wrapEnd ? wrapEnd : wrap));
      field.selectionStart = (selectionStart || 0) + wrap.length;
      field.selectionEnd = (selectionEnd || 0) + wrap.length;
    }
    static replace(field, searchValue, replacer) {
      let drift = 0;
      field.value.replace(searchValue, (...args) => {
        const matchStart = drift + args[args.length - 2], matchLength = args[0].length;
        field.selectionStart = matchStart;
        field.selectionEnd = matchStart + matchLength;
        args = "string" === typeof replacer ? replacer : replacer(...args);
        _TextUtils.insert(field, args);
        field.selectionStart = matchStart;
        drift += args.length - matchLength;
        return args;
      });
    }
    static findLineEnd(value, currentEnd) {
      const lastLineStart = value.lastIndexOf("\n", currentEnd - 1) + 1;
      return "\t" !== value.charAt(lastLineStart) ? currentEnd : lastLineStart + 1;
    }
    static indent(element) {
      var _a3;
      const {selectionStart, selectionEnd, value} = element;
      var selectedContrast = value.slice(selectionStart, selectionEnd);
      if ((selectedContrast = null == (_a3 = /\n/g.exec(selectedContrast)) ? void 0 : _a3.length) && 0 < selectedContrast) {
        _a3 = value.lastIndexOf("\n", selectionStart - 1) + 1;
        var newSelection = element.value.slice(_a3, selectionEnd - 1);
        selectedContrast = newSelection.replace(/^|\n/g, `$&${_TextUtils.INDENT}`);
        newSelection = selectedContrast.length - newSelection.length;
        element.setSelectionRange(_a3, selectionEnd - 1);
        _TextUtils.insert(element, selectedContrast);
        element.setSelectionRange(selectionStart + 1, selectionEnd + newSelection);
      } else {
        _TextUtils.insert(element, _TextUtils.INDENT);
      }
    }
    static unindent(element) {
      const {selectionStart, selectionEnd, value} = element;
      var firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const minimumSelectionEnd = _TextUtils.findLineEnd(value, selectionEnd);
      var newSelection = element.value.slice(firstLineStart, minimumSelectionEnd);
      const indentedText = newSelection.replace(/(^|\n)(\t| {1,2})/g, "$1");
      newSelection = newSelection.length - indentedText.length;
      element.setSelectionRange(firstLineStart, minimumSelectionEnd);
      _TextUtils.insert(element, indentedText);
      firstLineStart = (firstLineStart = /\t| {1,2}/.exec(value.slice(firstLineStart, selectionStart))) ? firstLineStart[0].length : 0;
      element.setSelectionRange(selectionStart - firstLineStart, Math.max(selectionStart - firstLineStart, selectionEnd - newSelection));
    }
    static normalizeText(text) {
      return text.replace(_TextUtils.fixNewLines, "\n");
    }
  }, TextUtils = _TextUtils;
  __publicField(TextUtils, "fixNewLines", /\r?\n|\r/g);
  __publicField(TextUtils, "INDENT", "  ");
  var melm;
  "undefined" !== typeof window && (melm = getMeasurementDiv());
  var cache2 = new Map(), MOD_KEY = isDarwin() ? "⌘" : "ctrl", TLReactApp = class extends TLApp {
  }, React2 = __toESM(require("module$react")), NOOP = () => {
  };
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  var React = __toESM(require("module$react")), contextMap = {}, React3 = __toESM(require("module$react")), getNearestScrollableContainer = element => {
    for (element = element.parentElement; element && element !== document.body;) {
      const {overflowY} = window.getComputedStyle(element);
      if (element.scrollHeight > element.clientHeight && ("auto" === overflowY || "scroll" === overflowY || "overlay" === overflowY)) {
        return element;
      }
      element = element.parentElement;
    }
    return document;
  }, React4 = __toESM(require("module$react")), styles = new Map(), defaultTheme = {accent:"var(--lx-accent-09, hsl(var(--primary)))", brushFill:"var(--ls-scrollbar-background-color, rgba(0, 0, 0, .05))", brushStroke:"var(--ls-scrollbar-thumb-hover-color, rgba(0, 0, 0, .05))", selectStroke:"var(--color-selectedStroke)", selectFill:"var(--color-selectedFill)", binding:"var(--color-binding, rgba(65, 132, 244, 0.5))", background:"var(--ls-primary-background-color, hsl(var(--background)))", foreground:"var(--ls-primary-text-color, hsl(var(--foreground)))", 
  grid:"var(--ls-quaternary-background-color, hsl(var(--secondary)))"}, tlcss = ((strings, ...args) => strings.reduce((acc, string, index2) => acc + string + (index2 < args.length ? args[index2] : ""), ""))`
  .tl-container {
    --tl-zoom: 1;
    --tl-scale: calc(1 / var(--tl-zoom));
    --tl-padding: calc(64px / var(--tl-zoom));;
    --tl-shadow-color: 0deg 0% 0%;
    --tl-binding-distance: ${4}px;
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
`, React6 = __toESM(require("module$react")), React5 = __toESM(require("module$react")), contextMap2 = {}, V = {toVector(v2, fallback) {
    void 0 === v2 && (v2 = fallback);
    return Array.isArray(v2) ? v2 : [v2, v2];
  }, add(v12, v2) {
    return [v12[0] + v2[0], v12[1] + v2[1]];
  }, sub(v12, v2) {
    return [v12[0] - v2[0], v12[1] - v2[1]];
  }, addTo(v12, v2) {
    v12[0] += v2[0];
    v12[1] += v2[1];
  }, subTo(v12, v2) {
    v12[0] -= v2[0];
    v12[1] -= v2[1];
  }}, EVENT_TYPE_MAP = {pointer:{start:"down", change:"move", end:"up"}, mouse:{start:"down", change:"move", end:"up"}, touch:{start:"start", change:"move", end:"end"}, gesture:{start:"start", change:"change", end:"end"}}, actionsWithoutCaptureSupported = ["enter", "leave"], pointerCaptureEvents = ["gotpointercapture", "lostpointercapture"], Engine = class {
    constructor(ctrl, args, key) {
      this.ctrl = ctrl;
      this.args = args;
      this.key = key;
      this.state || (this.state = {}, this.computeValues([0, 0]), this.computeInitial(), this.init && this.init(), this.reset());
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
      const {state, shared, ingKey, args} = this;
      shared[ingKey] = state._active = state.active = state._blocked = state._force = !1;
      state._step = [!1, !1];
      state.intentional = !1;
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
      state._movementBound = [!1, !1];
      state.velocity = [0, 0];
      state.movement = [0, 0];
      state.delta = [0, 0];
      state.timeStamp = 0;
    }
    start(event) {
      const state = this.state, config = this.config;
      state._active || (this.reset(), this.computeInitial(), state._active = !0, state.target = event.target, state.currentTarget = event.currentTarget, state.lastOffset = config.from ? call(config.from, state) : state.offset, state.offset = state.lastOffset);
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
      const {state, config, shared} = this;
      state.args = this.args;
      var dt2 = 0;
      if (event) {
        state.event = event;
        config.preventDefault && event.cancelable && state.event.preventDefault();
        state.type = event.type;
        shared.touches = this.ctrl.pointerIds.size || this.ctrl.touchIds.size;
        shared.locked = !!document.pointerLockElement;
        dt2 = Object;
        var JSCompiler_temp_const = dt2.assign, payload = {};
        "buttons" in event && (payload.buttons = event.buttons);
        if ("shiftKey" in event) {
          const {shiftKey, altKey, metaKey, ctrlKey} = event;
          Object.assign(payload, {shiftKey, altKey, metaKey, ctrlKey});
        }
        JSCompiler_temp_const.call(dt2, shared, payload);
        shared.down = shared.pressed = 1 === shared.buttons % 2 || 0 < shared.touches;
        dt2 = event.timeStamp - state.timeStamp;
        state.timeStamp = event.timeStamp;
        state.elapsedTime = state.timeStamp - state.startTime;
      }
      state._active && (JSCompiler_temp_const = state._delta.map(Math.abs), V.addTo(state._distance, JSCompiler_temp_const));
      this.axisIntent && this.axisIntent(event);
      const [_m0, _m1] = state._movement, [t0, t1] = config.threshold, {_step, values} = state;
      config.hasCustomTransform ? (!1 === _step[0] && (_step[0] = Math.abs(_m0) >= t0 && values[0]), !1 === _step[1] && (_step[1] = Math.abs(_m1) >= t1 && values[1])) : (!1 === _step[0] && (_step[0] = Math.abs(_m0) >= t0 && Math.sign(_m0) * t0), !1 === _step[1] && (_step[1] = Math.abs(_m1) >= t1 && Math.sign(_m1) * t1));
      state.intentional = !1 !== _step[0] || !1 !== _step[1];
      if (state.intentional) {
        JSCompiler_temp_const = [0, 0];
        if (config.hasCustomTransform) {
          const [v0, v12] = values;
          JSCompiler_temp_const[0] = !1 !== _step[0] ? v0 - _step[0] : 0;
          JSCompiler_temp_const[1] = !1 !== _step[1] ? v12 - _step[1] : 0;
        } else {
          JSCompiler_temp_const[0] = !1 !== _step[0] ? _m0 - _step[0] : 0, JSCompiler_temp_const[1] = !1 !== _step[1] ? _m1 - _step[1] : 0;
        }
        this.restrictToAxis && !state._blocked && this.restrictToAxis(JSCompiler_temp_const);
        payload = state.offset;
        var gestureIsActive = state._active && !state._blocked || state.active;
        gestureIsActive && (state.first = state._active && !state.active, state.last = !state._active && state.active, state.active = shared[this.ingKey] = state._active, event && (state.first && ("bounds" in config && (state._bounds = call(config.bounds, state)), this.setup && this.setup()), state.movement = JSCompiler_temp_const, this.computeOffset()));
        var [ox, oy] = state.offset, [[x0, x1], [y0, y1]] = state._bounds;
        state.overflow = [ox < x0 ? -1 : ox > x1 ? 1 : 0, oy < y0 ? -1 : oy > y1 ? 1 : 0];
        state._movementBound[0] = state.overflow[0] ? !1 === state._movementBound[0] ? state._movement[0] : state._movementBound[0] : !1;
        state._movementBound[1] = state.overflow[1] ? !1 === state._movementBound[1] ? state._movement[1] : state._movementBound[1] : !1;
        state.offset = computeRubberband(state._bounds, state.offset, state._active ? config.rubberband || [0, 0] : [0, 0]);
        state.delta = V.sub(state.offset, payload);
        this.computeMovement();
        gestureIsActive && (!state.last || 32 < dt2) && (state.delta = V.sub(state.offset, payload), event = state.delta.map(Math.abs), V.addTo(state.distance, event), state.direction = state.delta.map(Math.sign), state._direction = state._delta.map(Math.sign), !state.first && 0 < dt2 && (state.velocity = [event[0] / dt2, event[1] / dt2]));
      }
    }
    emit() {
      const state = this.state;
      var shared = this.shared;
      const config = this.config;
      state._active || this.clean();
      if (!state._blocked && state.intentional || state._force || config.triggerAllEvents) {
        shared = this.handler(_objectSpread2(_objectSpread2(_objectSpread2({}, shared), state), {}, {[this.aliasKey]:state.values})), void 0 !== shared && (state.memo = shared);
      }
    }
    clean() {
      this.eventStore.clean();
      this.timeoutStore.clean();
    }
  }, CoordinatesEngine = class extends Engine {
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
      const state = this.state, config = this.config;
      !state.axis && event && (event = "object" === typeof config.axisThreshold ? config.axisThreshold[getPointerType(event)] : config.axisThreshold, state.axis = selectAxis(state._movement, event));
      state._blocked = (config.lockDirection || !!config.axis) && !state.axis || !!config.axis && config.axis !== state.axis;
    }
    restrictToAxis(v2) {
      if (this.config.axis || this.config.lockDirection) {
        switch(this.state.axis) {
          case "x":
            v2[1] = 0;
            break;
          case "y":
            v2[0] = 0;
        }
      }
    }
  }, identity = v2 => v2, commonConfigResolver = {enabled(value = !0) {
    return value;
  }, eventOptions(value, _k, config) {
    return _objectSpread2(_objectSpread2({}, config.shared.eventOptions), value);
  }, preventDefault(value = !1) {
    return value;
  }, triggerAllEvents(value = !1) {
    return value;
  }, rubberband(value = 0) {
    switch(value) {
      case !0:
        return [0.15, 0.15];
      case !1:
        return [0, 0];
      default:
        return V.toVector(value);
    }
  }, from(value) {
    if ("function" === typeof value) {
      return value;
    }
    if (null != value) {
      return V.toVector(value);
    }
  }, transform(value, _k, config) {
    value = value || config.shared.transform;
    this.hasCustomTransform = !!value;
    return value || identity;
  }, threshold(value) {
    return V.toVector(value, 0);
  }}, coordinatesConfigResolver = _objectSpread2(_objectSpread2({}, commonConfigResolver), {}, {axis(_v, _k, {axis}) {
    this.lockDirection = "lock" === axis;
    if (!this.lockDirection) {
      return axis;
    }
  }, axisThreshold(value = 0) {
    return value;
  }, bounds(value = {}) {
    if ("function" === typeof value) {
      return state => coordinatesConfigResolver.bounds(value(state));
    }
    if ("current" in value) {
      return () => value.current;
    }
    if ("function" === typeof HTMLElement && value instanceof HTMLElement) {
      return value;
    }
    const {left = -Infinity, right = Infinity, top = -Infinity, bottom = Infinity} = value;
    return [[left, right], [top, bottom]];
  }}), KEYS_DELTA_MAP = {ArrowRight:(factor = 1) => [10 * factor, 0], ArrowLeft:(factor = 1) => [-10 * factor, 0], ArrowUp:(factor = 1) => [0, -10 * factor], ArrowDown:(factor = 1) => [0, 10 * factor]}, DragEngine = class extends CoordinatesEngine {
    constructor(...args) {
      super(...args);
      _defineProperty(this, "ingKey", "dragging");
    }
    reset() {
      super.reset();
      const state = this.state;
      state._pointerId = void 0;
      state._pointerActive = !1;
      state._keyboardActive = !1;
      state._preventScroll = !1;
      state._delayed = !1;
      state.swipe = [0, 0];
      state.tap = !1;
      state.canceled = !1;
      state.cancel = this.cancel.bind(this);
    }
    setup() {
      const state = this.state;
      if (state._bounds instanceof HTMLElement) {
        const boundRect = state._bounds.getBoundingClientRect(), targetRect = state.currentTarget.getBoundingClientRect();
        state._bounds = coordinatesConfigResolver.bounds({left:boundRect.left - targetRect.left + state.offset[0], right:boundRect.right - targetRect.right + state.offset[0], top:boundRect.top - targetRect.top + state.offset[1], bottom:boundRect.bottom - targetRect.bottom + state.offset[1]});
      }
    }
    cancel() {
      const state = this.state;
      state.canceled || (state.canceled = !0, state._active = !1, setTimeout(() => {
        this.compute();
        this.emit();
      }, 0));
    }
    setActive() {
      this.state._active = this.state._pointerActive || this.state._keyboardActive;
    }
    clean() {
      this.pointerClean();
      this.state._pointerActive = !1;
      this.state._keyboardActive = !1;
      super.clean();
    }
    pointerDown(event) {
      const config = this.config, state = this.state;
      if (null == event.buttons || (Array.isArray(config.pointerButtons) ? config.pointerButtons.includes(event.buttons) : -1 === config.pointerButtons || config.pointerButtons === event.buttons)) {
        var ctrlIds = this.ctrl.setEventIds(event);
        config.pointerCapture && event.target.setPointerCapture(event.pointerId);
        ctrlIds && 1 < ctrlIds.size && state._pointerActive || (this.start(event), this.setupPointer(event), state._pointerId = pointerId(event), state._pointerActive = !0, this.computeValues(pointerValues(event)), this.computeInitial(), config.preventScrollAxis && "mouse" !== getPointerType(event) ? (state._active = !1, this.setupScrollPrevention(event)) : 0 < config.delay ? (this.setupDelayTrigger(event), config.triggerAllEvents && (this.compute(event), this.emit())) : this.startPointerDrag(event));
      }
    }
    startPointerDrag(event) {
      const state = this.state;
      state._active = !0;
      state._preventScroll = !0;
      state._delayed = !1;
      this.compute(event);
      this.emit();
    }
    pointerMove(event) {
      const state = this.state, config = this.config;
      if (state._pointerActive && (state.type !== event.type || event.timeStamp !== state.timeStamp)) {
        var id3 = pointerId(event);
        if (void 0 === state._pointerId || id3 === state._pointerId) {
          id3 = pointerValues(event), document.pointerLockElement === event.target ? state._delta = [event.movementX, event.movementY] : (state._delta = V.sub(id3, state._values), this.computeValues(id3)), V.addTo(state._movement, state._delta), this.compute(event), state._delayed && state.intentional ? (this.timeoutStore.remove("dragDelay"), state.active = !1, this.startPointerDrag(event)) : config.preventScrollAxis && !state._preventScroll ? state.axis && (state.axis === config.preventScrollAxis || 
          "xy" === config.preventScrollAxis ? (state._active = !1, this.clean()) : (this.timeoutStore.remove("startPointerDrag"), this.startPointerDrag(event))) : this.emit();
        }
      }
    }
    pointerUp(event) {
      this.ctrl.setEventIds(event);
      try {
        this.config.pointerCapture && event.target.hasPointerCapture(event.pointerId) && event.target.releasePointerCapture(event.pointerId);
      } catch (_unused) {
      }
      const state = this.state, config = this.config;
      if (state._active && state._pointerActive) {
        var id3 = pointerId(event);
        if (void 0 === state._pointerId || id3 === state._pointerId) {
          this.state._pointerActive = !1;
          this.setActive();
          this.compute(event);
          var [dx, dy] = state._distance;
          state.tap = dx <= config.tapsThreshold && dy <= config.tapsThreshold;
          if (state.tap && config.filterTaps) {
            state._force = !0;
          } else {
            const [dirx, diry] = state.direction, [vx, vy] = state.velocity, [mx, my] = state.movement, [svx, svy] = config.swipe.velocity, [sx, sy] = config.swipe.distance;
            state.elapsedTime < config.swipe.duration && (Math.abs(vx) > svx && Math.abs(mx) > sx && (state.swipe[0] = dirx), Math.abs(vy) > svy && Math.abs(my) > sy && (state.swipe[1] = diry));
          }
          this.emit();
        }
      }
    }
    pointerClick(event) {
      !this.state.tap && 0 < event.detail && (event.preventDefault(), event.stopPropagation());
    }
    setupPointer(event) {
      const config = this.config, device = config.device;
      config.pointerLock && event.currentTarget.requestPointerLock();
      config.pointerCapture || (this.eventStore.add(this.sharedConfig.window, device, "change", this.pointerMove.bind(this)), this.eventStore.add(this.sharedConfig.window, device, "end", this.pointerUp.bind(this)), this.eventStore.add(this.sharedConfig.window, device, "cancel", this.pointerUp.bind(this)));
    }
    pointerClean() {
      this.config.pointerLock && document.pointerLockElement === this.state.currentTarget && document.exitPointerLock();
    }
    preventScroll(event) {
      this.state._preventScroll && event.cancelable && event.preventDefault();
    }
    setupScrollPrevention(event) {
      this.state._preventScroll = !1;
      "persist" in event && "function" === typeof event.persist && event.persist();
      const remove2 = this.eventStore.add(this.sharedConfig.window, "touch", "change", this.preventScroll.bind(this), {passive:!1});
      this.eventStore.add(this.sharedConfig.window, "touch", "end", remove2);
      this.eventStore.add(this.sharedConfig.window, "touch", "cancel", remove2);
      this.timeoutStore.add("startPointerDrag", this.startPointerDrag.bind(this), this.config.preventScrollDelay, event);
    }
    setupDelayTrigger(event) {
      this.state._delayed = !0;
      this.timeoutStore.add("dragDelay", () => {
        this.state._step = [0, 0];
        this.startPointerDrag(event);
      }, this.config.delay);
    }
    keyDown(event) {
      const deltaFn = KEYS_DELTA_MAP[event.key];
      if (deltaFn) {
        const state = this.state, factor = event.shiftKey ? 10 : event.altKey ? 0.1 : 1;
        this.start(event);
        state._delta = deltaFn(factor);
        state._keyboardActive = !0;
        V.addTo(state._movement, state._delta);
        this.compute(event);
        this.emit();
      }
    }
    keyUp(event) {
      event.key in KEYS_DELTA_MAP && (this.state._keyboardActive = !1, this.setActive(), this.compute(event), this.emit());
    }
    bind(bindFunction) {
      const device = this.config.device;
      bindFunction(device, "start", this.pointerDown.bind(this));
      this.config.pointerCapture && (bindFunction(device, "change", this.pointerMove.bind(this)), bindFunction(device, "end", this.pointerUp.bind(this)), bindFunction(device, "cancel", this.pointerUp.bind(this)), bindFunction("lostPointerCapture", "", this.pointerUp.bind(this)));
      this.config.keys && (bindFunction("key", "down", this.keyDown.bind(this)), bindFunction("key", "up", this.keyUp.bind(this)));
      this.config.filterTaps && bindFunction("click", "", this.pointerClick.bind(this), {capture:!0, passive:!1});
    }
  }, isBrowser = "undefined" !== typeof window && window.document && window.document.createElement;
  try {
    var JSCompiler_inline_result = "constructor" in GestureEvent;
  } catch (e) {
    JSCompiler_inline_result = !1;
  }
  var JSCompiler_object_inline_gesture_5446 = JSCompiler_inline_result, JSCompiler_object_inline_touch_5447 = isBrowser && "ontouchstart" in window || isBrowser && 1 < window.navigator.maxTouchPoints, JSCompiler_object_inline_touchscreen_5448 = isBrowser && "ontouchstart" in window || isBrowser && 1 < window.navigator.maxTouchPoints, JSCompiler_object_inline_pointer_5449 = isBrowser && "onpointerdown" in window, JSCompiler_object_inline_pointerLock_5450 = isBrowser && "exitPointerLock" in window.document, 
  DEFAULT_DRAG_AXIS_THRESHOLD = {mouse:0, touch:0, pen:8}, dragConfigResolver = _objectSpread2(_objectSpread2({}, coordinatesConfigResolver), {}, {device(_v, _k, {pointer:{touch = !1, lock = !1, mouse = !1} = {}}) {
    this.pointerLock = lock && JSCompiler_object_inline_pointerLock_5450;
    return JSCompiler_object_inline_touch_5447 && touch ? "touch" : this.pointerLock ? "mouse" : JSCompiler_object_inline_pointer_5449 && !mouse ? "pointer" : JSCompiler_object_inline_touch_5447 ? "touch" : "mouse";
  }, preventScrollAxis(value, _k, {preventScroll}) {
    this.preventScrollDelay = "number" === typeof preventScroll ? preventScroll : preventScroll || void 0 === preventScroll && value ? 250 : void 0;
    if (JSCompiler_object_inline_touchscreen_5448 && !1 !== preventScroll) {
      return value ? value : void 0 !== preventScroll ? "y" : void 0;
    }
  }, pointerCapture(_v, _k, {pointer:{capture = !0, buttons = 1, keys = !0} = {}}) {
    this.pointerButtons = buttons;
    this.keys = keys;
    return !this.pointerLock && "pointer" === this.device && capture;
  }, threshold(value, _k, {filterTaps = !1, tapsThreshold = 3, axis}) {
    value = V.toVector(value, filterTaps ? tapsThreshold : axis ? 1 : 0);
    this.filterTaps = filterTaps;
    this.tapsThreshold = tapsThreshold;
    return value;
  }, swipe({velocity = 0.5, distance = 50, duration = 250} = {}) {
    return {velocity:this.transform(V.toVector(velocity)), distance:this.transform(V.toVector(distance)), duration};
  }, delay(value = 0) {
    switch(value) {
      case !0:
        return 180;
      case !1:
        return 0;
      default:
        return value;
    }
  }, axisThreshold(value) {
    return value ? _objectSpread2(_objectSpread2({}, DEFAULT_DRAG_AXIS_THRESHOLD), value) : DEFAULT_DRAG_AXIS_THRESHOLD;
  }}), PinchEngine = class extends Engine {
    constructor(...args) {
      super(...args);
      _defineProperty(this, "ingKey", "pinching");
      _defineProperty(this, "aliasKey", "da");
    }
    init() {
      this.state.offset = [1, 0];
      this.state.lastOffset = [1, 0];
      this.state._pointerEvents = new Map();
    }
    reset() {
      super.reset();
      const state = this.state;
      state._touchIds = [];
      state.canceled = !1;
      state.cancel = this.cancel.bind(this);
      state.turns = 0;
    }
    computeOffset() {
      const {type, movement, lastOffset} = this.state;
      this.state.offset = "wheel" === type ? V.add(movement, lastOffset) : [(1 + movement[0]) * lastOffset[0], movement[1] + lastOffset[1]];
    }
    computeMovement() {
      const {offset, lastOffset} = this.state;
      this.state.movement = [offset[0] / lastOffset[0], offset[1] - lastOffset[1]];
    }
    axisIntent() {
      const state = this.state, [_m0, _m1] = state._movement;
      if (!state.axis) {
        const axisMovementDifference = 30 * Math.abs(_m0) - Math.abs(_m1);
        0 > axisMovementDifference ? state.axis = "angle" : 0 < axisMovementDifference && (state.axis = "scale");
      }
    }
    restrictToAxis(v2) {
      this.config.lockDirection && ("scale" === this.state.axis ? v2[1] = 0 : "angle" === this.state.axis && (v2[0] = 0));
    }
    cancel() {
      const state = this.state;
      state.canceled || setTimeout(() => {
        state.canceled = !0;
        state._active = !1;
        this.compute();
        this.emit();
      }, 0);
    }
    touchStart(event) {
      this.ctrl.setEventIds(event);
      var state = this.state;
      const ctrlTouchIds = this.ctrl.touchIds;
      state._active && state._touchIds.every(id3 => ctrlTouchIds.has(id3)) || 2 > ctrlTouchIds.size || (this.start(event), state._touchIds = Array.from(ctrlTouchIds).slice(0, 2), state = touchDistanceAngle(event, state._touchIds), this.pinchStart(event, state));
    }
    pointerStart(event) {
      if (null == event.buttons || 1 === event.buttons % 2) {
        this.ctrl.setEventIds(event);
        event.target.setPointerCapture(event.pointerId);
        var state = this.state, _pointerEvents = state._pointerEvents, ctrlPointerIds = this.ctrl.pointerIds;
        state._active && Array.from(_pointerEvents.keys()).every(id3 => ctrlPointerIds.has(id3)) || (2 > _pointerEvents.size && _pointerEvents.set(event.pointerId, event), 2 > state._pointerEvents.size || (this.start(event), state = distanceAngle(...Array.from(_pointerEvents.values())), this.pinchStart(event, state)));
      }
    }
    pinchStart(event, payload) {
      this.state.origin = payload.origin;
      this.computeValues([payload.distance, payload.angle]);
      this.computeInitial();
      this.compute(event);
      this.emit();
    }
    touchMove(event) {
      if (this.state._active) {
        var payload = touchDistanceAngle(event, this.state._touchIds);
        this.pinchMove(event, payload);
      }
    }
    pointerMove(event) {
      var _pointerEvents = this.state._pointerEvents;
      _pointerEvents.has(event.pointerId) && _pointerEvents.set(event.pointerId, event);
      this.state._active && (_pointerEvents = distanceAngle(...Array.from(_pointerEvents.values())), this.pinchMove(event, _pointerEvents));
    }
    pinchMove(event, payload) {
      const state = this.state, delta_a = payload.angle - state._values[1];
      let delta_turns = 0;
      270 < Math.abs(delta_a) && (delta_turns += Math.sign(delta_a));
      this.computeValues([payload.distance, payload.angle - 360 * delta_turns]);
      state.origin = payload.origin;
      state.turns = delta_turns;
      state._movement = [state._values[0] / state._initial[0] - 1, state._values[1] - state._initial[1]];
      this.compute(event);
      this.emit();
    }
    touchEnd(event) {
      this.ctrl.setEventIds(event);
      this.state._active && this.state._touchIds.some(id3 => !this.ctrl.touchIds.has(id3)) && (this.state._active = !1, this.compute(event), this.emit());
    }
    pointerEnd(event) {
      const state = this.state;
      this.ctrl.setEventIds(event);
      try {
        event.target.releasePointerCapture(event.pointerId);
      } catch (_unused) {
      }
      state._pointerEvents.has(event.pointerId) && state._pointerEvents.delete(event.pointerId);
      state._active && 2 > state._pointerEvents.size && (state._active = !1, this.compute(event), this.emit());
    }
    gestureStart(event) {
      event.cancelable && event.preventDefault();
      const state = this.state;
      state._active || (this.start(event), this.computeValues([event.scale, event.rotation]), state.origin = [event.clientX, event.clientY], this.compute(event), this.emit());
    }
    gestureMove(event) {
      event.cancelable && event.preventDefault();
      if (this.state._active) {
        var state = this.state;
        this.computeValues([event.scale, event.rotation]);
        state.origin = [event.clientX, event.clientY];
        var _previousMovement = state._movement;
        state._movement = [event.scale - 1, event.rotation];
        state._delta = V.sub(state._movement, _previousMovement);
        this.compute(event);
        this.emit();
      }
    }
    gestureEnd(event) {
      this.state._active && (this.state._active = !1, this.compute(event), this.emit());
    }
    wheel(event) {
      const modifierKey = this.config.modifierKey;
      if (!modifierKey || event[modifierKey]) {
        this.state._active ? this.wheelChange(event) : this.wheelStart(event), this.timeoutStore.add("wheelEnd", this.wheelEnd.bind(this));
      }
    }
    wheelStart(event) {
      this.start(event);
      this.wheelChange(event);
    }
    wheelChange(event) {
      "uv" in event || event.cancelable && event.preventDefault();
      const state = this.state;
      state._delta = [-wheelValues(event)[1] / 100 * state.offset[0], 0];
      V.addTo(state._movement, state._delta);
      clampStateInternalMovementToBounds(state);
      this.state.origin = [event.clientX, event.clientY];
      this.compute(event);
      this.emit();
    }
    wheelEnd() {
      this.state._active && (this.state._active = !1, this.compute(), this.emit());
    }
    bind(bindFunction) {
      const device = this.config.device;
      device && (bindFunction(device, "start", this[device + "Start"].bind(this)), bindFunction(device, "change", this[device + "Move"].bind(this)), bindFunction(device, "end", this[device + "End"].bind(this)), bindFunction(device, "cancel", this[device + "End"].bind(this)));
      this.config.pinchOnWheel && bindFunction("wheel", "", this.wheel.bind(this), {passive:!1});
    }
  }, pinchConfigResolver = _objectSpread2(_objectSpread2({}, commonConfigResolver), {}, {device(_v, _k, {shared, pointer:{touch = !1} = {}}) {
    if (shared.target && !JSCompiler_object_inline_touch_5447 && JSCompiler_object_inline_gesture_5446) {
      return "gesture";
    }
    if (JSCompiler_object_inline_touch_5447 && touch) {
      return "touch";
    }
    if (JSCompiler_object_inline_touchscreen_5448) {
      if (JSCompiler_object_inline_pointer_5449) {
        return "pointer";
      }
      if (JSCompiler_object_inline_touch_5447) {
        return "touch";
      }
    }
  }, bounds(_v, _k, {scaleBounds = {}, angleBounds = {}}) {
    const _scaleBounds = state => {
      state = call(scaleBounds, state);
      state = Object.assign({}, {min:-Infinity, max:Infinity}, state || {});
      return [state.min, state.max];
    }, _angleBounds = state => {
      state = call(angleBounds, state);
      state = Object.assign({}, {min:-Infinity, max:Infinity}, state || {});
      return [state.min, state.max];
    };
    return "function" !== typeof scaleBounds && "function" !== typeof angleBounds ? [_scaleBounds(), _angleBounds()] : state => [_scaleBounds(state), _angleBounds(state)];
  }, threshold(value, _k, config) {
    this.lockDirection = "lock" === config.axis;
    return V.toVector(value, this.lockDirection ? [0.1, 3] : 0);
  }, modifierKey(value) {
    return void 0 === value ? "ctrlKey" : value;
  }, pinchOnWheel(value = !0) {
    return value;
  }}), MoveEngine = class extends CoordinatesEngine {
    constructor(...args) {
      super(...args);
      _defineProperty(this, "ingKey", "moving");
    }
    move(event) {
      this.config.mouseOnly && "mouse" !== event.pointerType || (this.state._active ? this.moveChange(event) : this.moveStart(event), this.timeoutStore.add("moveEnd", this.moveEnd.bind(this)));
    }
    moveStart(event) {
      this.start(event);
      this.computeValues(pointerValues(event));
      this.compute(event);
      this.computeInitial();
      this.emit();
    }
    moveChange(event) {
      if (this.state._active) {
        var values = pointerValues(event), state = this.state;
        state._delta = V.sub(values, state._values);
        V.addTo(state._movement, state._delta);
        this.computeValues(values);
        this.compute(event);
        this.emit();
      }
    }
    moveEnd(event) {
      this.state._active && (this.state._active = !1, this.compute(event), this.emit());
    }
    bind(bindFunction) {
      bindFunction("pointer", "change", this.move.bind(this));
      bindFunction("pointer", "leave", this.moveEnd.bind(this));
    }
  }, moveConfigResolver = _objectSpread2(_objectSpread2({}, coordinatesConfigResolver), {}, {mouseOnly:(value = !0) => value}), ScrollEngine = class extends CoordinatesEngine {
    constructor(...args) {
      super(...args);
      _defineProperty(this, "ingKey", "scrolling");
    }
    scroll(event) {
      this.state._active || this.start(event);
      this.scrollChange(event);
      this.timeoutStore.add("scrollEnd", this.scrollEnd.bind(this));
    }
    scrollChange(event) {
      event.cancelable && event.preventDefault();
      const state = this.state;
      var _ref, _ref2;
      const {scrollX, scrollY, scrollLeft, scrollTop} = event.currentTarget;
      var JSCompiler_inline_result = [null !== (_ref = null !== scrollX && void 0 !== scrollX ? scrollX : scrollLeft) && void 0 !== _ref ? _ref : 0, null !== (_ref2 = null !== scrollY && void 0 !== scrollY ? scrollY : scrollTop) && void 0 !== _ref2 ? _ref2 : 0];
      state._delta = V.sub(JSCompiler_inline_result, state._values);
      V.addTo(state._movement, state._delta);
      this.computeValues(JSCompiler_inline_result);
      this.compute(event);
      this.emit();
    }
    scrollEnd() {
      this.state._active && (this.state._active = !1, this.compute(), this.emit());
    }
    bind(bindFunction) {
      bindFunction("scroll", "", this.scroll.bind(this));
    }
  }, scrollConfigResolver = coordinatesConfigResolver, WheelEngine = class extends CoordinatesEngine {
    constructor(...args) {
      super(...args);
      _defineProperty(this, "ingKey", "wheeling");
    }
    wheel(event) {
      this.state._active || this.start(event);
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
      this.state._active && (this.state._active = !1, this.compute(), this.emit());
    }
    bind(bindFunction) {
      bindFunction("wheel", "", this.wheel.bind(this));
    }
  }, wheelConfigResolver = coordinatesConfigResolver, HoverEngine = class extends CoordinatesEngine {
    constructor(...args) {
      super(...args);
      _defineProperty(this, "ingKey", "hovering");
    }
    enter(event) {
      this.config.mouseOnly && "mouse" !== event.pointerType || (this.start(event), this.computeValues(pointerValues(event)), this.compute(event), this.emit());
    }
    leave(event) {
      if (!this.config.mouseOnly || "mouse" === event.pointerType) {
        var state = this.state;
        if (state._active) {
          state._active = !1;
          var values = pointerValues(event);
          state._movement = state._delta = V.sub(values, state._values);
          this.computeValues(values);
          this.compute(event);
          state.delta = state.movement;
          this.emit();
        }
      }
    }
    bind(bindFunction) {
      bindFunction("pointer", "enter", this.enter.bind(this));
      bindFunction("pointer", "leave", this.leave.bind(this));
    }
  }, hoverConfigResolver = _objectSpread2(_objectSpread2({}, coordinatesConfigResolver), {}, {mouseOnly:(value = !0) => value}), EngineMap = new Map(), ConfigResolverMap = new Map(), dragAction = {key:"drag", engine:DragEngine, resolver:dragConfigResolver}, hoverAction = {key:"hover", engine:HoverEngine, resolver:hoverConfigResolver}, moveAction = {key:"move", engine:MoveEngine, resolver:moveConfigResolver}, pinchAction = {key:"pinch", engine:PinchEngine, resolver:pinchConfigResolver}, scrollAction = 
  {key:"scroll", engine:ScrollEngine, resolver:scrollConfigResolver}, wheelAction = {key:"wheel", engine:WheelEngine, resolver:wheelConfigResolver}, import_react2 = __toESM(require("module$react")), sharedConfigResolver = {target(value) {
    if (value) {
      return () => "current" in value ? value.current : value;
    }
  }, enabled(value = !0) {
    return value;
  }, window(value = isBrowser ? window : void 0) {
    return value;
  }, eventOptions({passive = !0, capture = !1} = {}) {
    return {passive, capture};
  }, transform(value) {
    return value;
  }}, _excluded = ["target", "eventOptions", "window", "enabled", "transform"], EventStore = class {
    constructor(ctrl, gestureKey) {
      _defineProperty(this, "_listeners", new Set());
      this._ctrl = ctrl;
      this._gestureKey = gestureKey;
    }
    add(element, device, action2, handler, options) {
      const listeners = this._listeners, type = toDomEventType(device, action2), eventOptions = _objectSpread2(_objectSpread2({}, this._gestureKey ? this._ctrl.config[this._gestureKey].eventOptions : {}), options);
      element.addEventListener(type, handler, eventOptions);
      const remove2 = () => {
        element.removeEventListener(type, handler, eventOptions);
        listeners.delete(remove2);
      };
      listeners.add(remove2);
      return remove2;
    }
    clean() {
      this._listeners.forEach(remove2 => remove2());
      this._listeners.clear();
    }
  }, TimeoutStore = class {
    constructor() {
      _defineProperty(this, "_timeouts", new Map());
    }
    add(key, callback, ms = 140, ...args) {
      this.remove(key);
      this._timeouts.set(key, window.setTimeout(callback, ms, ...args));
    }
    remove(key) {
      (key = this._timeouts.get(key)) && window.clearTimeout(key);
    }
    clean() {
      this._timeouts.forEach(timeout => void window.clearTimeout(timeout));
      this._timeouts.clear();
    }
  }, Controller = class {
    constructor(handlers) {
      _defineProperty(this, "gestures", new Set());
      _defineProperty(this, "_targetEventStore", new EventStore(this));
      _defineProperty(this, "gestureEventStores", {});
      _defineProperty(this, "gestureTimeoutStores", {});
      _defineProperty(this, "handlers", {});
      _defineProperty(this, "config", {});
      _defineProperty(this, "pointerIds", new Set());
      _defineProperty(this, "touchIds", new Set());
      _defineProperty(this, "state", {shared:{shiftKey:!1, metaKey:!1, ctrlKey:!1, altKey:!1}});
      handlers.drag && setupGesture(this, "drag");
      handlers.wheel && setupGesture(this, "wheel");
      handlers.scroll && setupGesture(this, "scroll");
      handlers.move && setupGesture(this, "move");
      handlers.pinch && setupGesture(this, "pinch");
      handlers.hover && setupGesture(this, "hover");
    }
    setEventIds(event) {
      if ("touches" in event) {
        return this.touchIds = new Set(touchIds(event));
      }
      if ("pointerId" in event) {
        return "pointerup" === event.type || "pointercancel" === event.type ? this.pointerIds.delete(event.pointerId) : "pointerdown" === event.type && this.pointerIds.add(event.pointerId), this.pointerIds;
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
        this.gestureEventStores[key].clean(), this.gestureTimeoutStores[key].clean();
      }
    }
    effect() {
      this.config.shared.target && this.bind();
      return () => this._targetEventStore.clean();
    }
    bind(...args) {
      var sharedConfig = this.config.shared;
      const props = {};
      let target;
      if (sharedConfig.target && (target = sharedConfig.target(), !target)) {
        return;
      }
      if (sharedConfig.enabled) {
        for (const gestureKey of this.gestures) {
          const gestureConfig = this.config[gestureKey], bindFunction = bindToProps(props, gestureConfig.eventOptions, !!target);
          gestureConfig.enabled && (new (EngineMap.get(gestureKey))(this, args, gestureKey)).bind(bindFunction);
        }
        sharedConfig = bindToProps(props, sharedConfig.eventOptions, !!target);
        for (const eventKey in this.nativeHandlers) {
          sharedConfig(eventKey, "", event => this.nativeHandlers[eventKey](_objectSpread2(_objectSpread2({}, this.state.shared), {}, {event, args})), void 0, !0);
        }
      }
      for (const handlerProp in props) {
        props[handlerProp] = chain(...props[handlerProp]);
      }
      if (!target) {
        return props;
      }
      for (const handlerProp in props) {
        const {device, capture, passive} = parseProp(handlerProp);
        this._targetEventStore.add(target, device, "", props[handlerProp], {capture, passive});
      }
    }
  }, bindToProps = (props, eventOptions, withPassiveOption) => (device, action2, handler, options = {}, isNative = !1) => {
    var _options$capture, _options$passive;
    const capture = null !== (_options$capture = options.capture) && void 0 !== _options$capture ? _options$capture : eventOptions.capture;
    options = null !== (_options$passive = options.passive) && void 0 !== _options$passive ? _options$passive : eventOptions.passive;
    device = isNative ? device : toHandlerProp(device, action2, capture);
    withPassiveOption && options && (device += "Passive");
    props[device] = props[device] || [];
    props[device].push(handler);
  }, RE_NOT_NATIVE = /^on(Drag|Wheel|Scroll|Move|Pinch|Hover)/, React8 = __toESM(require("module$react")), React9 = __toESM(require("module$react")), React10 = __toESM(require("module$react")), React11 = __toESM(require("module$react")), React12 = __toESM(require("module$react")), React13 = __toESM(require("module$react")), React14 = __toESM(require("module$react")), React15 = __toESM(require("module$react")), CURSORS3 = {none:(r2, f2) => "none", ["default"]:(r2, f2) => "default", pointer:(r2, f2) => 
  "pointer", crosshair:(r2, f2) => "crosshair", move:(r2, f2) => "move", wait:(r2, f2) => "wait", progress:(r2, f2) => "progress", grab:(r2, f2) => getCursorCss('\x3cpath d\x3d"m13.5557 17.5742c-.098-.375-.196-.847-.406-1.552-.167-.557-.342-.859-.47-1.233-.155-.455-.303-.721-.496-1.181-.139-.329-.364-1.048-.457-1.44-.119-.509.033-.924.244-1.206.253-.339.962-.49 1.357-.351.371.13.744.512.916.788.288.46.357.632.717 1.542.393.992.564 1.918.611 2.231l.085.452c-.001-.04-.043-1.122-.044-1.162-.035-1.029-.06-1.823-.038-2.939.002-.126.064-.587.084-.715.078-.5.305-.8.673-.979.412-.201.926-.215 1.401-.017.423.173.626.55.687 1.022.014.109.094.987.093 1.107-.013 1.025.006 1.641.015 2.174.004.231.003 1.625.017 1.469.061-.656.094-3.189.344-3.942.144-.433.405-.746.794-.929.431-.203 1.113-.07 1.404.243.285.305.446.692.482 1.153.032.405-.019.897-.02 1.245 0 .867-.021 1.324-.037 2.121-.001.038-.015.298.023.182.094-.28.188-.542.266-.745.049-.125.241-.614.359-.859.114-.234.211-.369.415-.688.2-.313.415-.448.668-.561.54-.235 1.109.112 1.301.591.086.215.009.713-.028 1.105-.061.647-.254 1.306-.352 1.648-.128.447-.274 1.235-.34 1.601-.072.394-.234 1.382-.359 1.82-.086.301-.371.978-.652 1.384 0 0-1.074 1.25-1.192 1.812-.117.563-.078.567-.101.965-.024.399.121.923.121.923s-.802.104-1.234.034c-.391-.062-.875-.841-1-1.078-.172-.328-.539-.265-.682-.023-.225.383-.709 1.07-1.051 1.113-.668.084-2.054.03-3.139.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.284-.36-.629-1.093-1.243-1.985-.348-.504-1.027-1.085-1.284-1.579-.223-.425-.331-.954-.19-1.325.225-.594.675-.897 1.362-.832.519.05.848.206 1.238.537.225.19.573.534.75.748.163.195.203.276.377.509.23.307.302.459.214.121" fill\x3d"%23fff"/\x3e\x3cg stroke\x3d"%23000" stroke-linecap\x3d"round" stroke-width\x3d".75"\x3e\x3cpath d\x3d"m13.5557 17.5742c-.098-.375-.196-.847-.406-1.552-.167-.557-.342-.859-.47-1.233-.155-.455-.303-.721-.496-1.181-.139-.329-.364-1.048-.457-1.44-.119-.509.033-.924.244-1.206.253-.339.962-.49 1.357-.351.371.13.744.512.916.788.288.46.357.632.717 1.542.393.992.564 1.918.611 2.231l.085.452c-.001-.04-.043-1.122-.044-1.162-.035-1.029-.06-1.823-.038-2.939.002-.126.064-.587.084-.715.078-.5.305-.8.673-.979.412-.201.926-.215 1.401-.017.423.173.626.55.687 1.022.014.109.094.987.093 1.107-.013 1.025.006 1.641.015 2.174.004.231.003 1.625.017 1.469.061-.656.094-3.189.344-3.942.144-.433.405-.746.794-.929.431-.203 1.113-.07 1.404.243.285.305.446.692.482 1.153.032.405-.019.897-.02 1.245 0 .867-.021 1.324-.037 2.121-.001.038-.015.298.023.182.094-.28.188-.542.266-.745.049-.125.241-.614.359-.859.114-.234.211-.369.415-.688.2-.313.415-.448.668-.561.54-.235 1.109.112 1.301.591.086.215.009.713-.028 1.105-.061.647-.254 1.306-.352 1.648-.128.447-.274 1.235-.34 1.601-.072.394-.234 1.382-.359 1.82-.086.301-.371.978-.652 1.384 0 0-1.074 1.25-1.192 1.812-.117.563-.078.567-.101.965-.024.399.121.923.121.923s-.802.104-1.234.034c-.391-.062-.875-.841-1-1.078-.172-.328-.539-.265-.682-.023-.225.383-.709 1.07-1.051 1.113-.668.084-2.054.03-3.139.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.284-.36-.629-1.093-1.243-1.985-.348-.504-1.027-1.085-1.284-1.579-.223-.425-.331-.954-.19-1.325.225-.594.675-.897 1.362-.832.519.05.848.206 1.238.537.225.19.573.534.75.748.163.195.203.276.377.509.23.307.302.459.214.121" stroke-linejoin\x3d"round"/\x3e\x3cpath d\x3d"m20.5664 21.7344v-3.459"/\x3e\x3cpath d\x3d"m18.5508 21.7461-.016-3.473"/\x3e\x3cpath d\x3d"m16.5547 18.3047.021 3.426"/\x3e\x3c/g\x3e', 
  r2, f2), grabbing:(r2, f2) => getCursorCss("\x3cpath d\x3d'm13.5732 12.0361c.48-.178 1.427-.069 1.677.473.213.462.396 1.241.406 1.075.024-.369-.024-1.167.137-1.584.117-.304.347-.59.686-.691.285-.086.62-.116.916-.055.313.064.642.287.765.499.362.623.368 1.899.385 1.831.064-.272.07-1.229.283-1.584.141-.235.497-.445.687-.479.294-.052.656-.068.964-.008.249.049.586.344.677.487.219.344.342 1.316.379 1.658.016.141.074-.393.293-.736.406-.639 1.844-.763 1.898.639.026.654.02.624.02 1.064 0 .516-.012.828-.04 1.202-.03.399-.116 1.304-.241 1.742-.086.301-.371.978-.653 1.384 0 0-1.074 1.25-1.191 1.812-.117.563-.078.567-.102.965-.023.399.121.923.121.923s-.801.104-1.234.034c-.391-.062-.875-.84-1-1.078-.172-.328-.539-.265-.682-.023-.224.383-.709 1.07-1.05 1.113-.669.084-2.055.03-3.14.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.283-.36-1.002-.929-1.243-1.985-.213-.936-.192-1.395.037-1.77.232-.381.67-.589.854-.625.208-.042.692-.039.875.062.223.123.313.159.488.391.23.307.312.456.213.121-.076-.262-.322-.595-.434-.97-.109-.361-.401-.943-.38-1.526.008-.221.103-.771.832-1.042' fill\x3d'%23fff'/\x3e\x3cg stroke\x3d'%23000' stroke-width\x3d'.75'\x3e\x3cpath d\x3d'm13.5732 12.0361c.48-.178 1.427-.069 1.677.473.213.462.396 1.241.406 1.075.024-.369-.024-1.167.137-1.584.117-.304.347-.59.686-.691.285-.086.62-.116.916-.055.313.064.642.287.765.499.362.623.368 1.899.385 1.831.064-.272.07-1.229.283-1.584.141-.235.497-.445.687-.479.294-.052.656-.068.964-.008.249.049.586.344.677.487.219.344.342 1.316.379 1.658.016.141.074-.393.293-.736.406-.639 1.844-.763 1.898.639.026.654.02.624.02 1.064 0 .516-.012.828-.04 1.202-.03.399-.116 1.304-.241 1.742-.086.301-.371.978-.653 1.384 0 0-1.074 1.25-1.191 1.812-.117.563-.078.567-.102.965-.023.399.121.923.121.923s-.801.104-1.234.034c-.391-.062-.875-.84-1-1.078-.172-.328-.539-.265-.682-.023-.224.383-.709 1.07-1.05 1.113-.669.084-2.055.03-3.14.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.283-.36-1.002-.929-1.243-1.985-.213-.936-.192-1.395.037-1.77.232-.381.67-.589.854-.625.208-.042.692-.039.875.062.223.123.313.159.488.391.23.307.312.456.213.121-.076-.262-.322-.595-.434-.97-.109-.361-.401-.943-.38-1.526.008-.221.103-.771.832-1.042z' stroke-linejoin\x3d'round'/\x3e\x3cpath d\x3d'm20.5664 19.7344v-3.459' stroke-linecap\x3d'round'/\x3e\x3cpath d\x3d'm18.5508 19.7461-.016-3.473' stroke-linecap\x3d'round'/\x3e\x3cpath d\x3d'm16.5547 16.3047.021 3.426' stroke-linecap\x3d'round'/\x3e\x3c/g\x3e", 
  r2, f2), text:(r2, f2) => getCursorCss("\x3cpath d\x3d'm6.94 2v-1c-1.35866267-.08246172-2.66601117.53165299-3.47 1.63-.80398883-1.09834701-2.11133733-1.71246172-3.47-1.63v1c1.30781678-.16635468 2.55544738.59885876 3 1.84v5.1h-1v1h1v4.16c-.4476345 1.2386337-1.69302129 2.002471-3 1.84v1c1.35687108.0731933 2.6600216-.5389494 3.47-1.63.8099784 1.0910506 2.11312892 1.7031933 3.47 1.63v-1c-1.28590589.133063-2.49760499-.6252793-2.94-1.84v-4.18h1v-1h-1v-5.08c.43943906-1.21710975 1.65323743-1.97676587 2.94-1.84z' transform\x3d'translate(14 9)'/\x3e", 
  r2, f2), ["resize-edge"]:(r2, f2) => getCursorCss("\x3cpath d\x3d'm9 17.9907v.005l5.997 5.996.001-3.999h1.999 2.02v4l5.98-6.001-5.98-5.999.001 4.019-2.021.002h-2l.001-4.022zm1.411.003 3.587-3.588-.001 2.587h3.5 2.521v-2.585l3.565 3.586-3.564 3.585-.001-2.585h-2.521l-3.499-.001-.001 2.586z' fill\x3d'%23fff'/\x3e\x3cpath d\x3d'm17.4971 18.9932h2.521v2.586l3.565-3.586-3.565-3.585v2.605h-2.521-3.5v-2.607l-3.586 3.587 3.586 3.586v-2.587z' fill\x3d'%23000'/\x3e", r2, f2), ["resize-corner"]:(r2, f2) => 
  getCursorCss("\x3cpath d\x3d'm19.7432 17.0869-4.072 4.068 2.829 2.828-8.473-.013-.013-8.47 2.841 2.842 4.075-4.068 1.414-1.415-2.844-2.842h8.486v8.484l-2.83-2.827z' fill\x3d'%23fff'/\x3e\x3cpath d\x3d'm18.6826 16.7334-4.427 4.424 1.828 1.828-5.056-.016-.014-5.054 1.842 1.841 4.428-4.422 2.474-2.475-1.844-1.843h5.073v5.071l-1.83-1.828z' fill\x3d'%23000'/\x3e", r2, f2), ["ew-resize"]:(r2, f2) => getCursorCss("\x3cpath d\x3d'm9 17.9907v.005l5.997 5.996.001-3.999h1.999 2.02v4l5.98-6.001-5.98-5.999.001 4.019-2.021.002h-2l.001-4.022zm1.411.003 3.587-3.588-.001 2.587h3.5 2.521v-2.585l3.565 3.586-3.564 3.585-.001-2.585h-2.521l-3.499-.001-.001 2.586z' fill\x3d'%23fff'/\x3e\x3cpath d\x3d'm17.4971 18.9932h2.521v2.586l3.565-3.586-3.565-3.585v2.605h-2.521-3.5v-2.607l-3.586 3.587 3.586 3.586v-2.587z' fill\x3d'%23000'/\x3e", 
  r2, f2), ["ns-resize"]:(r2, f2) => getCursorCss("\x3cpath d\x3d'm9 17.9907v.005l5.997 5.996.001-3.999h1.999 2.02v4l5.98-6.001-5.98-5.999.001 4.019-2.021.002h-2l.001-4.022zm1.411.003 3.587-3.588-.001 2.587h3.5 2.521v-2.585l3.565 3.586-3.564 3.585-.001-2.585h-2.521l-3.499-.001-.001 2.586z' fill\x3d'%23fff'/\x3e\x3cpath d\x3d'm17.4971 18.9932h2.521v2.586l3.565-3.586-3.565-3.585v2.605h-2.521-3.5v-2.607l-3.586 3.587 3.586 3.586v-2.587z' fill\x3d'%23000'/\x3e", r2 + 90, f2), ["nesw-resize"]:(r2, f2) => 
  getCursorCss("\x3cpath d\x3d'm19.7432 17.0869-4.072 4.068 2.829 2.828-8.473-.013-.013-8.47 2.841 2.842 4.075-4.068 1.414-1.415-2.844-2.842h8.486v8.484l-2.83-2.827z' fill\x3d'%23fff'/\x3e\x3cpath d\x3d'm18.6826 16.7334-4.427 4.424 1.828 1.828-5.056-.016-.014-5.054 1.842 1.841 4.428-4.422 2.474-2.475-1.844-1.843h5.073v5.071l-1.83-1.828z' fill\x3d'%23000'/\x3e", r2, f2), ["nwse-resize"]:(r2, f2) => getCursorCss("\x3cpath d\x3d'm19.7432 17.0869-4.072 4.068 2.829 2.828-8.473-.013-.013-8.47 2.841 2.842 4.075-4.068 1.414-1.415-2.844-2.842h8.486v8.484l-2.83-2.827z' fill\x3d'%23fff'/\x3e\x3cpath d\x3d'm18.6826 16.7334-4.427 4.424 1.828 1.828-5.056-.016-.014-5.054 1.842 1.841 4.428-4.422 2.474-2.475-1.844-1.843h5.073v5.071l-1.83-1.828z' fill\x3d'%23000'/\x3e", 
  r2 + 90, f2), rotate:(r2, f2) => getCursorCss('\x3cg\x3e\x3cpath d\x3d"M22.4789 9.45728L25.9935 12.9942L22.4789 16.5283V14.1032C18.126 14.1502 14.6071 17.6737 14.5675 22.0283H17.05L13.513 25.543L9.97889 22.0283H12.5674C12.6071 16.5691 17.0214 12.1503 22.4789 12.1031L22.4789 9.45728Z" fill\x3d"black"/\x3e\x3cpath fill-rule\x3d"evenodd" clip-rule\x3d"evenodd" d\x3d"M21.4789 7.03223L27.4035 12.9945L21.4789 18.9521V15.1868C18.4798 15.6549 16.1113 18.0273 15.649 21.0284H19.475L13.5128 26.953L7.55519 21.0284H11.6189C12.1243 15.8155 16.2679 11.6677 21.4789 11.1559L21.4789 7.03223ZM22.4789 12.1031C17.0214 12.1503 12.6071 16.5691 12.5674 22.0284H9.97889L13.513 25.543L17.05 22.0284H14.5675C14.5705 21.6896 14.5947 21.3558 14.6386 21.0284C15.1157 17.4741 17.9266 14.6592 21.4789 14.1761C21.8063 14.1316 22.1401 14.1069 22.4789 14.1032V16.5284L25.9935 12.9942L22.4789 9.45729L22.4789 12.1031Z" fill\x3d"white"/\x3e\x3c/g\x3e', 
  r2 + 45, f2), ["nwse-rotate"]:(r2, f2) => getCursorCss('\x3cg\x3e\x3cpath d\x3d"M22.4789 9.45728L25.9935 12.9942L22.4789 16.5283V14.1032C18.126 14.1502 14.6071 17.6737 14.5675 22.0283H17.05L13.513 25.543L9.97889 22.0283H12.5674C12.6071 16.5691 17.0214 12.1503 22.4789 12.1031L22.4789 9.45728Z" fill\x3d"black"/\x3e\x3cpath fill-rule\x3d"evenodd" clip-rule\x3d"evenodd" d\x3d"M21.4789 7.03223L27.4035 12.9945L21.4789 18.9521V15.1868C18.4798 15.6549 16.1113 18.0273 15.649 21.0284H19.475L13.5128 26.953L7.55519 21.0284H11.6189C12.1243 15.8155 16.2679 11.6677 21.4789 11.1559L21.4789 7.03223ZM22.4789 12.1031C17.0214 12.1503 12.6071 16.5691 12.5674 22.0284H9.97889L13.513 25.543L17.05 22.0284H14.5675C14.5705 21.6896 14.5947 21.3558 14.6386 21.0284C15.1157 17.4741 17.9266 14.6592 21.4789 14.1761C21.8063 14.1316 22.1401 14.1069 22.4789 14.1032V16.5284L25.9935 12.9942L22.4789 9.45729L22.4789 12.1031Z" fill\x3d"white"/\x3e\x3c/g\x3e', 
  r2, f2), ["nesw-rotate"]:(r2, f2) => getCursorCss('\x3cg\x3e\x3cpath d\x3d"M22.4789 9.45728L25.9935 12.9942L22.4789 16.5283V14.1032C18.126 14.1502 14.6071 17.6737 14.5675 22.0283H17.05L13.513 25.543L9.97889 22.0283H12.5674C12.6071 16.5691 17.0214 12.1503 22.4789 12.1031L22.4789 9.45728Z" fill\x3d"black"/\x3e\x3cpath fill-rule\x3d"evenodd" clip-rule\x3d"evenodd" d\x3d"M21.4789 7.03223L27.4035 12.9945L21.4789 18.9521V15.1868C18.4798 15.6549 16.1113 18.0273 15.649 21.0284H19.475L13.5128 26.953L7.55519 21.0284H11.6189C12.1243 15.8155 16.2679 11.6677 21.4789 11.1559L21.4789 7.03223ZM22.4789 12.1031C17.0214 12.1503 12.6071 16.5691 12.5674 22.0284H9.97889L13.513 25.543L17.05 22.0284H14.5675C14.5705 21.6896 14.5947 21.3558 14.6386 21.0284C15.1157 17.4741 17.9266 14.6592 21.4789 14.1761C21.8063 14.1316 22.1401 14.1069 22.4789 14.1032V16.5284L25.9935 12.9942L22.4789 9.45729L22.4789 12.1031Z" fill\x3d"white"/\x3e\x3c/g\x3e', 
  r2 + 90, f2), ["senw-rotate"]:(r2, f2) => getCursorCss('\x3cg\x3e\x3cpath d\x3d"M22.4789 9.45728L25.9935 12.9942L22.4789 16.5283V14.1032C18.126 14.1502 14.6071 17.6737 14.5675 22.0283H17.05L13.513 25.543L9.97889 22.0283H12.5674C12.6071 16.5691 17.0214 12.1503 22.4789 12.1031L22.4789 9.45728Z" fill\x3d"black"/\x3e\x3cpath fill-rule\x3d"evenodd" clip-rule\x3d"evenodd" d\x3d"M21.4789 7.03223L27.4035 12.9945L21.4789 18.9521V15.1868C18.4798 15.6549 16.1113 18.0273 15.649 21.0284H19.475L13.5128 26.953L7.55519 21.0284H11.6189C12.1243 15.8155 16.2679 11.6677 21.4789 11.1559L21.4789 7.03223ZM22.4789 12.1031C17.0214 12.1503 12.6071 16.5691 12.5674 22.0284H9.97889L13.513 25.543L17.05 22.0284H14.5675C14.5705 21.6896 14.5947 21.3558 14.6386 21.0284C15.1157 17.4741 17.9266 14.6592 21.4789 14.1761C21.8063 14.1316 22.1401 14.1069 22.4789 14.1032V16.5284L25.9935 12.9942L22.4789 9.45729L22.4789 12.1031Z" fill\x3d"white"/\x3e\x3c/g\x3e', 
  r2 + 180, f2), ["swne-rotate"]:(r2, f2) => getCursorCss('\x3cg\x3e\x3cpath d\x3d"M22.4789 9.45728L25.9935 12.9942L22.4789 16.5283V14.1032C18.126 14.1502 14.6071 17.6737 14.5675 22.0283H17.05L13.513 25.543L9.97889 22.0283H12.5674C12.6071 16.5691 17.0214 12.1503 22.4789 12.1031L22.4789 9.45728Z" fill\x3d"black"/\x3e\x3cpath fill-rule\x3d"evenodd" clip-rule\x3d"evenodd" d\x3d"M21.4789 7.03223L27.4035 12.9945L21.4789 18.9521V15.1868C18.4798 15.6549 16.1113 18.0273 15.649 21.0284H19.475L13.5128 26.953L7.55519 21.0284H11.6189C12.1243 15.8155 16.2679 11.6677 21.4789 11.1559L21.4789 7.03223ZM22.4789 12.1031C17.0214 12.1503 12.6071 16.5691 12.5674 22.0284H9.97889L13.513 25.543L17.05 22.0284H14.5675C14.5705 21.6896 14.5947 21.3558 14.6386 21.0284C15.1157 17.4741 17.9266 14.6592 21.4789 14.1761C21.8063 14.1316 22.1401 14.1069 22.4789 14.1032V16.5284L25.9935 12.9942L22.4789 9.45729L22.4789 12.1031Z" fill\x3d"white"/\x3e\x3c/g\x3e', 
  r2 + 270, f2)}, React16 = __toESM(require("module$react"));
  __toESM(require("module$react"));
  var import_react4 = require("module$react"), React18 = __toESM(require("module$react"));
  if (!require("module$react").useState) {
    throw Error("mobx-react-lite requires React with Hooks support");
  }
  if (!makeObservable) {
    throw Error("mobx-react-lite@3 requires mobx at least version 6 to be available");
  }
  var import_react_dom = require("module$react_dom"), import_react6 = __toESM(require("module$react")), FinalizationRegistryLocal = "undefined" === typeof FinalizationRegistry ? void 0 : FinalizationRegistry, CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS = 1e4, __values = function(o2) {
    var s2 = "function" === typeof Symbol && Symbol.iterator, m2 = s2 && o2[s2], i2 = 0;
    if (m2) {
      return m2.call(o2);
    }
    if (o2 && "number" === typeof o2.length) {
      return {next:function() {
        o2 && i2 >= o2.length && (o2 = void 0);
        return {value:o2 && o2[i2++], done:!o2};
      }};
    }
    throw new TypeError(s2 ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }, _a2 = FinalizationRegistryLocal ? createReactionCleanupTrackingUsingFinalizationRegister(FinalizationRegistryLocal) : createTimerBasedReactionCleanupTracking(), addReactionToTrack = _a2.addReactionToTrack, recordReactionAsCommitted = _a2.recordReactionAsCommitted, __read = function(o2, n2) {
    var m2 = "function" === typeof Symbol && o2[Symbol.iterator];
    if (!m2) {
      return o2;
    }
    o2 = m2.call(o2);
    var r2, ar = [];
    try {
      for (; (void 0 === n2 || 0 < n2--) && !(r2 = o2.next()).done;) {
        ar.push(r2.value);
      }
    } catch (error) {
      var e = {error};
    } finally {
      try {
        r2 && !r2.done && (m2 = o2["return"]) && m2.call(o2);
      } finally {
        if (e) {
          throw e.error;
        }
      }
    }
    return ar;
  }, ObjectToBeRetainedByReact = function() {
    return function() {
    };
  }(), import_react7 = require("module$react"), hasSymbol = "function" === typeof Symbol && Symbol.for, ReactForwardRefSymbol = hasSymbol ? Symbol.for("react.forward_ref") : "function" === typeof import_react7.forwardRef && (0,import_react7.forwardRef)(function(props) {
    return null;
  }).$$typeof, ReactMemoSymbol = hasSymbol ? Symbol.for("react.memo") : "function" === typeof import_react7.memo && (0,import_react7.memo)(function(props) {
    return null;
  }).$$typeof, hoistBlackList = {$$typeof:!0, render:!0, compare:!0, type:!0, displayName:!0};
  ObserverComponent.displayName = "Observer";
  require("module$react");
  require("module$react");
  require("module$react");
  (function(reactionScheduler3) {
    reactionScheduler3 ||= defaultNoopBatch;
    configure({reactionScheduler:reactionScheduler3});
  })(import_react_dom.unstable_batchedUpdates);
  var React20 = __toESM(require("module$react")), import_jsx_runtime2 = require("module$node_modules$react$jsx_runtime"), HTMLContainer = React20.forwardRef(function(_a3, ref) {
    var {children, opacity, centered, className = ""} = _a3, rest = __objRest(_a3, ["children", "opacity", "centered", "className"]);
    return (0,import_jsx_runtime2.jsx)(ObserverComponent, {children:() => (0,import_jsx_runtime2.jsx)("div", {ref, className:`tl-positioned-div ${className}`, style:opacity ? {opacity} : void 0, draggable:!1, children:(0,import_jsx_runtime2.jsx)("div", __spreadProps(__spreadValues({className:`tl-positioned-inner ${centered ? "tl-centered" : ""}`}, rest), {children}))})});
  }), React21 = __toESM(require("module$react")), import_jsx_runtime3 = require("module$node_modules$react$jsx_runtime"), SVGContainer = React21.forwardRef(function(_a3, ref) {
    var {id:id3, className = "", style, children} = _a3, rest = __objRest(_a3, ["id", "className", "style", "children"]);
    return (0,import_jsx_runtime3.jsx)(ObserverComponent, {children:() => (0,import_jsx_runtime3.jsx)("svg", {ref, style, className:`tl-positioned-svg ${className}`, children:(0,import_jsx_runtime3.jsx)("g", __spreadProps(__spreadValues({id:id3, className:"tl-centered-g"}, rest), {children}))})});
  }), React31 = __toESM(require("module$react")), React22 = __toESM(require("module$react")), React23 = __toESM(require("module$react")), import_jsx_runtime4 = require("module$node_modules$react$jsx_runtime"), Container = observer(function(_a3) {
    var {id:id3, bounds, zIndex, rotation = 0, className = "", children} = _a3;
    _a3 = __objRest(_a3, "id bounds zIndex rotation className children".split(" "));
    const rBounds = React23.useRef(null);
    React23.useLayoutEffect(() => {
      rBounds.current.style.transform = `translate(
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
      void 0 !== zIndex && (elm.style.zIndex = zIndex.toString());
    }, [zIndex]);
    return (0,import_jsx_runtime4.jsx)("div", __spreadProps(__spreadValues({id:id3, ref:rBounds, className:`tl-positioned ${className}`, "aria-label":"container"}, _a3), {children}));
  }), React24 = __toESM(require("module$react")), import_jsx_runtime5 = require("module$node_modules$react$jsx_runtime"), ContextBarContainer = observer(function({shapes:shapes2, hidden, bounds, rotation = 0}) {
    const {components:{ContextBar:ContextBar2}, viewport:{bounds:vpBounds, camera:{point:[x2, y2], zoom}}} = useRendererContext(), rBounds = React24.useRef(null);
    var rotatedBounds = BoundsUtils.getRotatedBounds(bounds, rotation);
    rotatedBounds = BoundsUtils.multiplyBounds(rotatedBounds, zoom);
    useCounterScaledPosition(rBounds, bounds, rotation, 10005);
    if (!ContextBar2) {
      throw Error("Expected a ContextBar component.");
    }
    const screenBounds = BoundsUtils.translateBounds(rotatedBounds, [x2 * zoom, y2 * zoom]);
    return (0,import_jsx_runtime5.jsx)("div", {ref:rBounds, className:"tl-counter-scaled-positioned", "aria-label":"context-bar-container", "data-html2canvas-ignore":"true", children:(0,import_jsx_runtime5.jsx)(ContextBar2, {hidden, shapes:shapes2, bounds, offsets:{left:screenBounds.minX, right:vpBounds.width - screenBounds.maxX, top:screenBounds.minY, bottom:vpBounds.height - screenBounds.maxY, width:screenBounds.width, height:screenBounds.height}, scaledBounds:rotatedBounds, rotation})});
  }), React25 = __toESM(require("module$react")), import_jsx_runtime6 = require("module$node_modules$react$jsx_runtime"), HTMLLayer = observer(function({children}) {
    const rLayer = React25.useRef(null), {viewport} = useRendererContext(), layer = rLayer.current, {zoom, point} = viewport.camera;
    React25.useEffect(() => {
      layer && (layer.style.transform = `scale(${zoom}) translate3d(${point[0]}px, ${point[1]}px, 0)`);
    }, [zoom, point, layer]);
    return (0,import_jsx_runtime6.jsx)("div", {ref:rLayer, className:"tl-absolute tl-layer", children});
  }), import_jsx_runtime7 = require("module$node_modules$react$jsx_runtime"), Indicator = observer(function({shape, isHovered = !1, isSelected = !1, isBinding = !1, isEditing = !1, isLocked = !1, meta}) {
    const {bounds, props:{scale, rotation = 0}, ReactIndicator} = shape;
    return (0,import_jsx_runtime7.jsx)(Container, {"data-type":"Indicator", "data-html2canvas-ignore":"true", bounds, rotation, scale, zIndex:isEditing ? 1e3 : 1e4, children:(0,import_jsx_runtime7.jsx)(SVGContainer, {children:(0,import_jsx_runtime7.jsx)("g", {className:`tl-indicator-container ${isSelected ? "tl-selected" : "tl-hovered"} ${isLocked ? "tl-locked" : ""}`, children:(0,import_jsx_runtime7.jsx)(ReactIndicator, {isEditing, isBinding, isHovered, isLocked, isSelected, isErasing:!1, meta})})})});
  }), React26 = __toESM(require("module$react")), import_jsx_runtime8 = require("module$node_modules$react$jsx_runtime"), QuickLinksContainer = observer(function({bounds, shape}) {
    const {viewport:{camera:{zoom}}, components:{QuickLinks:QuickLinks2}} = useRendererContext();
    var app = useApp();
    const events = useShapeEvents(shape);
    if (!QuickLinks2) {
      throw Error("Expected a QuickLinks component.");
    }
    app = 50 > bounds.height * zoom || !app.selectedShapesArray.includes(shape);
    return (0,import_jsx_runtime8.jsx)(Container, {bounds, className:"tl-quick-links-container", "data-html2canvas-ignore":"true", children:(0,import_jsx_runtime8.jsx)(HTMLContainer, {children:(0,import_jsx_runtime8.jsx)("span", __spreadProps(__spreadValues({style:{position:"absolute", top:"100%", pointerEvents:"all", transformOrigin:"left top", paddingTop:"8px", transform:"scale(var(--tl-scale))", minWidth:"320px"}}, events), {onPointerDown:e => e.stopPropagation(), children:(0,import_jsx_runtime8.jsx)(QuickLinks2, 
    {className:"tl-backlinks-count " + (app ? "tl-backlinks-count-rounded" : ""), id:shape.id, shape})}))})});
  }), import_jsx_runtime9 = require("module$node_modules$react$jsx_runtime"), BacklinksCountContainer = observer(function({bounds, shape}) {
    const {viewport:{camera:{zoom}}, components:{BacklinksCount:BacklinksCount2}} = useRendererContext();
    var app = useApp();
    if (!BacklinksCount2) {
      throw Error("Expected a BacklinksCount component.");
    }
    const stop2 = e => e.stopPropagation();
    app = 50 > bounds.height * zoom || !app.selectedShapesArray.includes(shape) || shape.hideSelection;
    return (0,import_jsx_runtime9.jsx)(Container, {bounds, className:"tl-backlinks-count-container", children:(0,import_jsx_runtime9.jsx)(HTMLContainer, {children:(0,import_jsx_runtime9.jsx)("span", {style:{position:"absolute", left:"100%", pointerEvents:"all", transformOrigin:"left top", transform:"translateY(6px) scale(var(--tl-scale))"}, onPointerDown:stop2, onWheelCapture:stop2, onKeyDown:stop2, title:"Shape Backlinks", children:(0,import_jsx_runtime9.jsx)(BacklinksCount2, {className:"tl-backlinks-count " + 
    (app ? "tl-backlinks-count-rounded" : ""), id:shape.id, shape})})})});
  }), React27 = __toESM(require("module$react")), import_jsx_runtime10 = require("module$node_modules$react$jsx_runtime"), SelectionDetailContainer = observer(function({bounds, hidden, shapes:shapes2, rotation = 0, detail = "size"}) {
    const {components:{SelectionDetail:SelectionDetail4}, viewport:{camera:{zoom}}} = useRendererContext(), rBounds = React27.useRef(null), scaledBounds = BoundsUtils.multiplyBounds(bounds, zoom);
    useCounterScaledPosition(rBounds, bounds, rotation, 10003);
    if (!SelectionDetail4) {
      throw Error("Expected a SelectionDetail component.");
    }
    return (0,import_jsx_runtime10.jsx)("div", {ref:rBounds, className:`tl-counter-scaled-positioned ${hidden ? "tl-fade-out" : ""}`, "aria-label":"bounds-detail-container", "data-html2canvas-ignore":"true", children:(0,import_jsx_runtime10.jsx)(SelectionDetail4, {shapes:shapes2, bounds, scaledBounds, zoom, rotation, detail})});
  }), import_jsx_runtime11 = require("module$node_modules$react$jsx_runtime"), Shape2 = observer(function({shape, isHovered = !1, isSelected = !1, isBinding = !1, isErasing = !1, isEditing = !1, onEditingEnd, asset, meta, zIndex}) {
    const {bounds, props:{rotation, scale}, ReactComponent} = shape, app = useApp(), events = useShapeEvents(shape);
    var parentGroup = app.getParentGroup(shape);
    parentGroup = app.selectedIds.has(null == parentGroup ? void 0 : parentGroup.id);
    return (0,import_jsx_runtime11.jsx)(Container, {"data-shape-id":shape.id, "data-html2canvas-ignore":!isSelected && !parentGroup && 0 !== app.selectedShapes.size || null, zIndex, "data-type":"Shape", bounds, rotation, scale, children:(0,import_jsx_runtime11.jsx)(ReactComponent, {meta, isEditing, isBinding, isHovered, isSelected, isErasing, events, asset, onEditingEnd})});
  }), import_jsx_runtime12 = require("module$node_modules$react$jsx_runtime"), STEPS = [[-1, 0.15, 64], [0.05, 0.375, 16], [0.15, 1, 4], [0.7, 2.5, 1]], SVGGrid = observer(function({size}) {
    const {viewport:{camera:{point, zoom}}} = useRendererContext();
    return (0,import_jsx_runtime12.jsxs)("svg", {className:"tl-grid", version:"1.1", xmlns:"http://www.w3.org/2000/svg", "data-html2canvas-ignore":"true", children:[(0,import_jsx_runtime12.jsx)("defs", {children:STEPS.map(([min, mid, _size], i2) => {
      _size = _size * size * zoom;
      var xo = point[0] * zoom, yo = point[1] * zoom;
      xo = 0 < xo ? xo % _size : _size + xo % _size;
      yo = 0 < yo ? yo % _size : _size + yo % _size;
      min = modulate(zoom, [min, mid], [0, 1]);
      return (0,import_jsx_runtime12.jsx)("pattern", {id:`grid-${i2}`, width:_size, height:_size, patternUnits:"userSpaceOnUse", children:!(2 < min || 0.1 > min) && (0,import_jsx_runtime12.jsx)("circle", {className:"tl-grid-dot", cx:xo, cy:yo, r:1.5, opacity:Math.max(0, Math.min(min, 1))})}, `grid-pattern-${i2}`);
    })}), STEPS.map((_2, i2) => (0,import_jsx_runtime12.jsx)("rect", {width:"100%", height:"100%", fill:`url(#grid-${i2})`}, `grid-rect-${i2}`))]});
  }), Grid = observer(function({size}) {
    return (0,import_jsx_runtime12.jsx)(SVGGrid, {size});
  }), import_jsx_runtime13 = require("module$node_modules$react$jsx_runtime"), SelectionBackground = observer(function({bounds}) {
    const events = useBoundsEvents("background");
    return (0,import_jsx_runtime13.jsx)(SVGContainer, __spreadProps(__spreadValues({"data-html2canvas-ignore":"true"}, events), {children:(0,import_jsx_runtime13.jsx)("rect", {className:"tl-bounds-bg", width:Math.max(1, bounds.width), height:Math.max(1, bounds.height), pointerEvents:"all", rx:8, ry:8})}));
  });
  require("module$react");
  var import_jsx_runtime14 = require("module$node_modules$react$jsx_runtime"), SelectionDetail2 = observer(function({scaledBounds, shapes:shapes2, detail = "size", rotation = 0}) {
    var _a3;
    const selectionRotation = 1 === shapes2.length ? rotation : null != (_a3 = scaledBounds.rotation) ? _a3 : 0;
    return (0,import_jsx_runtime14.jsx)(HTMLContainer, {centered:!0, children:(0,import_jsx_runtime14.jsx)("div", {className:"tl-bounds-detail", style:{transform:selectionRotation < TAU || selectionRotation > 3 * TAU ? `rotate(${selectionRotation}rad) translateY(${scaledBounds.height / 2 + 24}px)` : `rotate(${Math.PI + selectionRotation}rad) translateY(${scaledBounds.height / 2 + 32}px)`, padding:"2px 3px", borderRadius:"1px"}, children:1 === shapes2.length && "line" === shapes2[0].type ? `${src_default.dist(shapes2[0].props.handles.start.point, 
    shapes2[0].props.handles.end.point).toFixed()}` : "size" === detail ? `${scaledBounds.width.toFixed()} \xD7 ${scaledBounds.height.toFixed()}` : `\u2220${GeomUtils.radiansToDegrees(GeomUtils.clampRadians(rotation)).toFixed()}\xB0`})});
  }), import_jsx_runtime15 = require("module$node_modules$react$jsx_runtime"), cornerBgClassnames = {top_left_corner:"tl-cursor-nwse", top_right_corner:"tl-cursor-nesw", bottom_right_corner:"tl-cursor-nwse", bottom_left_corner:"tl-cursor-nesw"}, CornerHandle = observer(function({cx:cx2, cy, size, targetSize, corner, isHidden}) {
    const events = useBoundsEvents(corner);
    return (0,import_jsx_runtime15.jsxs)("g", __spreadProps(__spreadValues({opacity:isHidden ? 0 : 1}, events), {children:[(0,import_jsx_runtime15.jsx)("rect", {className:"tl-transparent " + (isHidden ? "" : cornerBgClassnames[corner]), "aria-label":`${corner} target`, x:cx2 - 1.25 * targetSize, y:cy - 1.25 * targetSize, width:2.5 * targetSize, height:2.5 * targetSize, pointerEvents:isHidden ? "none" : "all"}), (0,import_jsx_runtime15.jsx)("rect", {className:"tl-corner-handle", "aria-label":`${corner} handle`, 
    x:cx2 - size / 2, y:cy - size / 2, width:size, height:size, pointerEvents:"none"})]}));
  }), import_jsx_runtime16 = require("module$node_modules$react$jsx_runtime"), CloneHandle = observer(function({cx:cx2, cy, size, direction, isHidden}) {
    const app = useApp();
    return (0,import_jsx_runtime16.jsxs)("g", {className:"tl-clone-handle", opacity:isHidden ? 0 : 1, children:[(0,import_jsx_runtime16.jsx)("circle", {"aria-label":`${direction} handle`, pointerEvents:"all", onPointerDown:e => app.api.clone(direction), cx:cx2, cy, r:size}), (0,import_jsx_runtime16.jsx)("line", {x1:cx2 - size / 2, y1:cy, x2:cx2 + size / 2, y2:cy}), (0,import_jsx_runtime16.jsx)("line", {x1:cx2, y1:cy - size / 2, x2:cx2, y2:cy + size / 2})]});
  }), import_jsx_runtime17 = require("module$node_modules$react$jsx_runtime"), edgeClassnames = {top_edge:"tl-cursor-ns", right_edge:"tl-cursor-ew", bottom_edge:"tl-cursor-ns", left_edge:"tl-cursor-ew"}, EdgeHandle = observer(function({x:x2, y:y2, width, height, targetSize, edge, disabled, isHidden}) {
    const events = useBoundsEvents(edge);
    return (0,import_jsx_runtime17.jsx)("rect", __spreadValues({pointerEvents:isHidden || disabled ? "none" : "all", className:"tl-transparent tl-edge-handle " + (isHidden ? "" : edgeClassnames[edge]), "aria-label":`${edge} target`, opacity:isHidden ? 0 : 1, x:x2 - targetSize, y:y2 - targetSize, width:Math.max(1, width + 2 * targetSize), height:Math.max(1, height + 2 * targetSize)}, events));
  }), import_jsx_runtime18 = require("module$node_modules$react$jsx_runtime");
  observer(function({cx:cx2, cy, size, targetSize, isHidden}) {
    const events = useBoundsEvents("rotate");
    return (0,import_jsx_runtime18.jsxs)("g", __spreadProps(__spreadValues({opacity:isHidden ? 0 : 1}, events), {children:[(0,import_jsx_runtime18.jsx)("circle", {className:"tl-transparent ", "aria-label":"rotate target", cx:cx2, cy, r:targetSize, pointerEvents:isHidden ? "none" : "all"}), (0,import_jsx_runtime18.jsx)("circle", {className:"tl-rotate-handle", "aria-label":"rotate handle", cx:cx2, cy, r:size / 2, pointerEvents:"none"})]}));
  });
  require("module$react");
  var import_jsx_runtime19 = require("module$node_modules$react$jsx_runtime"), RotateCornerHandle = observer(function({cx:cx2, cy, targetSize, corner, isHidden}) {
    const events = useBoundsEvents(corner);
    return (0,import_jsx_runtime19.jsx)("g", __spreadProps(__spreadValues({opacity:isHidden ? 0 : 1}, events), {children:(0,import_jsx_runtime19.jsx)("rect", {className:"tl-transparent", "aria-label":`${corner} target`, x:cx2 - 2.5 * targetSize, y:cy - 2.5 * targetSize, width:3 * targetSize, height:3 * targetSize, pointerEvents:isHidden ? "none" : "all"})}));
  }), import_jsx_runtime20 = require("module$node_modules$react$jsx_runtime"), SelectionForeground = observer(function({bounds, showResizeHandles, showRotateHandles, showCloneHandles, shapes:shapes2}) {
    var _a3, _b;
    const app = useApp();
    let {width, height} = bounds;
    var zoom = app.viewport.camera.zoom;
    bounds = 8 / zoom;
    const targetSize = 6 / zoom;
    zoom = 30 / zoom;
    const cloneHandleSize = 2 * bounds, canResize = 1 === shapes2.length ? shapes2[0].canResize : [!0, !0], borderRadius = null != (_b = null == (_a3 = app.editingShape) ? void 0 : _a3.props.borderRadius) ? _b : 0;
    return (0,import_jsx_runtime20.jsx)(import_jsx_runtime20.Fragment, {children:0 < shapes2.length && (0,import_jsx_runtime20.jsxs)(SVGContainer, {children:[!app.editingShape && (0,import_jsx_runtime20.jsx)("rect", {className:"tl-bounds-fg", width:Math.max(width, 1), height:Math.max(height, 1), rx:borderRadius, ry:borderRadius, pointerEvents:"none"}), (0,import_jsx_runtime20.jsx)(EdgeHandle, {x:2 * targetSize, y:0, width:width - 4 * targetSize, height:0, targetSize, edge:"top_edge", disabled:!canResize[1], 
    isHidden:!showResizeHandles}), (0,import_jsx_runtime20.jsx)(EdgeHandle, {x:width, y:2 * targetSize, width:0, height:height - 4 * targetSize, targetSize, edge:"right_edge", disabled:!canResize[0], isHidden:!showResizeHandles}), (0,import_jsx_runtime20.jsx)(EdgeHandle, {x:2 * targetSize, y:height, width:width - 4 * targetSize, height:0, targetSize, edge:"bottom_edge", disabled:!canResize[1], isHidden:!showResizeHandles}), (0,import_jsx_runtime20.jsx)(EdgeHandle, {x:0, y:2 * targetSize, width:0, 
    height:height - 4 * targetSize, targetSize, edge:"left_edge", disabled:!canResize[0], isHidden:!showResizeHandles}), (0,import_jsx_runtime20.jsx)(RotateCornerHandle, {cx:0, cy:0, targetSize, corner:"top_left_resize_corner", isHidden:!showRotateHandles}), (0,import_jsx_runtime20.jsx)(RotateCornerHandle, {cx:width + 2 * targetSize, cy:0, targetSize, corner:"top_right_resize_corner", isHidden:!showRotateHandles}), (0,import_jsx_runtime20.jsx)(RotateCornerHandle, {cx:width + 2 * targetSize, cy:height + 
    2 * targetSize, targetSize, corner:"bottom_right_resize_corner", isHidden:!showRotateHandles}), (0,import_jsx_runtime20.jsx)(RotateCornerHandle, {cx:0, cy:height + 2 * targetSize, targetSize, corner:"bottom_left_resize_corner", isHidden:!showRotateHandles}), (0,import_jsx_runtime20.jsx)(CloneHandle, {cx:-zoom, cy:height / 2, size:cloneHandleSize, direction:"left", isHidden:!showCloneHandles}), (0,import_jsx_runtime20.jsx)(CloneHandle, {cx:width + zoom, cy:height / 2, size:cloneHandleSize, direction:"right", 
    isHidden:!showCloneHandles}), (0,import_jsx_runtime20.jsx)(CloneHandle, {cx:width / 2, cy:height + zoom, size:cloneHandleSize, direction:"down", isHidden:!showCloneHandles}), (null == canResize ? void 0 : canResize.every(r2 => r2)) && (0,import_jsx_runtime20.jsxs)(import_jsx_runtime20.Fragment, {children:[(0,import_jsx_runtime20.jsx)(CornerHandle, {cx:0, cy:0, size:bounds, targetSize, corner:"top_left_corner", isHidden:!showResizeHandles}), (0,import_jsx_runtime20.jsx)(CornerHandle, {cx:width, 
    cy:0, size:bounds, targetSize, corner:"top_right_corner", isHidden:!showResizeHandles}), (0,import_jsx_runtime20.jsx)(CornerHandle, {cx:width, cy:height, size:bounds, targetSize, corner:"bottom_right_corner", isHidden:!showResizeHandles}), (0,import_jsx_runtime20.jsx)(CornerHandle, {cx:0, cy:height, size:bounds, targetSize, corner:"bottom_left_corner", isHidden:!showResizeHandles})]})]})});
  }), import_jsx_runtime21 = require("module$node_modules$react$jsx_runtime"), Brush = observer(function({bounds}) {
    return (0,import_jsx_runtime21.jsx)(Container, {bounds, zIndex:10001, children:(0,import_jsx_runtime21.jsx)(SVGContainer, {children:(0,import_jsx_runtime21.jsx)("rect", {className:"tl-brush", x:0, y:0, width:bounds.width, height:bounds.height})})});
  }), import_jsx_runtime22 = require("module$node_modules$react$jsx_runtime");
  observer(function() {
    return (0,import_jsx_runtime22.jsx)(import_jsx_runtime22.Fragment, {});
  });
  var import_jsx_runtime23 = require("module$node_modules$react$jsx_runtime"), Handle = observer(function({shape, handle, id:id3}) {
    shape = useHandleEvents(shape, id3);
    const [x2, y2] = handle.point;
    return (0,import_jsx_runtime23.jsxs)("g", __spreadProps(__spreadValues({className:"tl-handle", "aria-label":"handle"}, shape), {transform:`translate(${x2}, ${y2})`, children:[(0,import_jsx_runtime23.jsx)("circle", {className:"tl-handle-bg", pointerEvents:"all"}), (0,import_jsx_runtime23.jsx)("circle", {className:"tl-counter-scaled tl-handle", pointerEvents:"none", r:4})]}));
  }), React30 = __toESM(require("module$react")), import_jsx_runtime24 = require("module$node_modules$react$jsx_runtime"), DirectionIndicator = observer(function({direction}) {
    const {viewport:{bounds}} = useRendererContext(), rIndicator = React30.useRef(null);
    React30.useLayoutEffect(() => {
      const elm = rIndicator.current;
      if (elm) {
        var center = [bounds.width / 2, bounds.height / 2], insetBoundSides = BoundsUtils.getRectangleSides([12, 12], [bounds.width - 24, bounds.height - 24]);
        for (const [, [A3, B3]] of insetBoundSides) {
          insetBoundSides = intersectRayLineSegment(center, direction, A3, B3), insetBoundSides.didIntersect && (insetBoundSides = insetBoundSides.points[0], elm.style.transform = `translate(${insetBoundSides[0] - 6}px,${insetBoundSides[1] - 6}px) rotate(${src_default.toAngle(direction)}rad)`);
        }
      }
    }, [direction, bounds]);
    return (0,import_jsx_runtime24.jsx)("div", {ref:rIndicator, className:"tl-direction-indicator", "data-html2canvas-ignore":"true", children:(0,import_jsx_runtime24.jsx)("svg", {height:12, width:12, children:(0,import_jsx_runtime24.jsx)("polygon", {points:"0,0 12,6 0,12"})})});
  }), import_jsx_runtime25 = require("module$node_modules$react$jsx_runtime"), Canvas = observer(function({id:id3, className, brush, shapes:shapes2, assets, bindingShapes, editingShape, hoveredShape, hoveredGroup, selectionBounds, selectedShapes, erasingShapes, selectionDirectionHint, cursor = "default", cursorRotation = 0, selectionRotation = 0, showSelection = !0, showHandles = !0, showSelectionRotation = !1, showResizeHandles = !0, showRotateHandles = !0, showCloneHandles = !0, showSelectionDetail = 
  !0, showContextBar = !0, showGrid = !0, gridSize = 8, onEditingEnd = NOOP, theme = EMPTY_OBJECT, children}) {
    var _a3;
    const rContainer = React31.useRef(null), {viewport, components, meta} = useRendererContext(), app = useApp(), onBoundsChange = React31.useCallback(bounds => {
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
    id3 = useCanvasEvents();
    const onlySelectedShapeWithHandles = (cursor = 1 === (null == selectedShapes ? void 0 : selectedShapes.length) && selectedShapes[0]) && "handles" in cursor.props ? null == selectedShapes ? void 0 : selectedShapes[0] : void 0, selectedShapesSet = React31.useMemo(() => new Set(selectedShapes || []), [selectedShapes]), erasingShapesSet = React31.useMemo(() => new Set(erasingShapes || []), [erasingShapes]);
    cursor = 1 === (null == selectedShapes ? void 0 : selectedShapes.length) ? selectedShapes[0] : void 0;
    hoveredGroup = [...(new Set([hoveredGroup, hoveredShape]))].filter(isNonNullable);
    return (0,import_jsx_runtime25.jsxs)("div", {ref:rContainer, className:`tl-container ${null != className ? className : ""}`, children:[(0,import_jsx_runtime25.jsxs)("div", __spreadProps(__spreadValues({tabIndex:-1, className:"tl-absolute tl-canvas"}, id3), {children:[showGrid && components.Grid && (0,import_jsx_runtime25.jsx)(components.Grid, {size:gridSize}), (0,import_jsx_runtime25.jsxs)(HTMLLayer, {children:[components.SelectionBackground && selectedShapes && selectionBounds && showSelection && 
    (0,import_jsx_runtime25.jsx)(Container, {"data-type":"SelectionBackground", bounds:selectionBounds, zIndex:2, "data-html2canvas-ignore":"true", children:(0,import_jsx_runtime25.jsx)(components.SelectionBackground, {shapes:selectedShapes, bounds:selectionBounds, showResizeHandles, showRotateHandles})}), shapes2 && shapes2.map((shape, i2) => (0,import_jsx_runtime25.jsx)(Shape2, {shape, asset:assets && shape.props.assetId ? assets[shape.props.assetId] : void 0, isEditing:shape === editingShape, 
    isHovered:shape === hoveredShape, isBinding:null == bindingShapes ? void 0 : bindingShapes.includes(shape), isSelected:selectedShapesSet.has(shape), isErasing:erasingShapesSet.has(shape), meta, zIndex:1e3 + i2, onEditingEnd}, "shape_" + shape.id)), !app.isIn("select.pinching") && (null == selectedShapes ? void 0 : selectedShapes.map(shape => (0,import_jsx_runtime25.jsx)(Indicator, {shape, isEditing:shape === editingShape, isHovered:!1, isBinding:!1, isSelected:!0, isLocked:shape.props.isLocked}, 
    "selected_indicator_" + shape.id))), hoveredGroup.map(s2 => s2 !== editingShape && (0,import_jsx_runtime25.jsx)(Indicator, {shape:s2}, "hovered_indicator_" + s2.id)), cursor && components.BacklinksCount && (0,import_jsx_runtime25.jsx)(BacklinksCountContainer, {hidden:!1, bounds:cursor.bounds, shape:cursor}), hoveredShape && hoveredShape !== cursor && components.QuickLinks && (0,import_jsx_runtime25.jsx)(QuickLinksContainer, {hidden:!1, bounds:hoveredShape.bounds, shape:hoveredShape}), brush && 
    components.Brush && (0,import_jsx_runtime25.jsx)(components.Brush, {bounds:brush}), selectedShapes && selectionBounds && (0,import_jsx_runtime25.jsxs)(import_jsx_runtime25.Fragment, {children:[showSelection && components.SelectionForeground && (0,import_jsx_runtime25.jsx)(Container, {"data-type":"SelectionForeground", "data-html2canvas-ignore":"true", bounds:selectionBounds, zIndex:editingShape && selectedShapes.includes(editingShape) ? 1002 : 10002, children:(0,import_jsx_runtime25.jsx)(components.SelectionForeground, 
    {shapes:selectedShapes.filter(shape => !shape.props.isLocked), bounds:selectionBounds, showResizeHandles, showRotateHandles, showCloneHandles})}), showHandles && onlySelectedShapeWithHandles && components.Handle && (0,import_jsx_runtime25.jsx)(Container, {"data-type":"onlySelectedShapeWithHandles", "data-html2canvas-ignore":"true", bounds:selectionBounds, zIndex:10003, children:(0,import_jsx_runtime25.jsx)(SVGContainer, {children:Object.entries(null != (_a3 = onlySelectedShapeWithHandles.props.handles) ? 
    _a3 : {}).map(([id4, handle]) => React31.createElement(components.Handle, {key:`${handle.id}_handle_${handle.id}`, shape:onlySelectedShapeWithHandles, handle, id:id4}))})}), selectedShapes && components.SelectionDetail && (0,import_jsx_runtime25.jsx)(SelectionDetailContainer, {"data-html2canvas-ignore":"true", shapes:selectedShapes, bounds:selectionBounds, detail:showSelectionRotation ? "rotation" : "size", hidden:!showSelectionDetail, rotation:selectionRotation}, "detail" + selectedShapes.map(shape => 
    shape.id).join(""))]})]}), selectionDirectionHint && selectionBounds && selectedShapes && (0,import_jsx_runtime25.jsx)(DirectionIndicator, {direction:selectionDirectionHint, bounds:selectionBounds, shapes:selectedShapes}), (0,import_jsx_runtime25.jsx)("div", {id:"tl-dev-tools-canvas-anchor", "data-html2canvas-ignore":"true"})]})), (0,import_jsx_runtime25.jsx)(HTMLLayer, {children:selectedShapes && selectionBounds && (0,import_jsx_runtime25.jsx)(import_jsx_runtime25.Fragment, {children:selectedShapes && 
    components.ContextBar && (0,import_jsx_runtime25.jsx)(ContextBarContainer, {shapes:selectedShapes.filter(s2 => !s2.props.isLocked), hidden:!showContextBar, bounds:cursor ? cursor.bounds : selectionBounds, rotation:cursor ? cursor.props.rotation : 0}, "context" + selectedShapes.map(shape => shape.id).join(""))})}), children]});
  }), React33 = __toESM(require("module$react")), React32 = __toESM(require("module$react")), import_jsx_runtime26 = require("module$node_modules$react$jsx_runtime");
  observer(function({children}) {
    const rGroup = React32.useRef(null), {viewport} = useRendererContext();
    React32.useEffect(() => autorun(() => {
      const group = rGroup.current;
      if (group) {
        var {zoom, point} = viewport.camera;
        group.style.transform = `scale(${zoom}) translateX(${point[0]}px) translateY(${point[1]}px)`;
      }
    }), []);
    return (0,import_jsx_runtime26.jsx)("svg", {className:"tl-absolute tl-overlay", pointerEvents:"none", children:(0,import_jsx_runtime26.jsx)("g", {ref:rGroup, pointerEvents:"none", children})});
  });
  var import_jsx_runtime27 = require("module$node_modules$react$jsx_runtime"), AppProvider = observer(function(props) {
    const app = useAppSetup(props), context = getAppContext(props.id);
    usePropControl(app, props);
    useSetup(app, props);
    return (0,import_jsx_runtime27.jsx)(context.Provider, {value:app, children:props.children});
  }), import_jsx_runtime28 = require("module$node_modules$react$jsx_runtime"), RendererContext = observer(function({id:id3 = "noid", viewport, inputs, callbacks = EMPTY_OBJECT, meta = EMPTY_OBJECT, components = EMPTY_OBJECT, children}) {
    const [currentContext, setCurrentContext] = React33.useState(() => {
      const {Brush:Brush3, ContextBar:ContextBar2, DirectionIndicator:DirectionIndicator3, Grid:Grid3, Handle:Handle3, SelectionBackground:SelectionBackground3, SelectionDetail:SelectionDetail4, SelectionForeground:SelectionForeground3} = components, rest = __objRest(components, "Brush ContextBar DirectionIndicator Grid Handle SelectionBackground SelectionDetail SelectionForeground".split(" "));
      return {id:id3, viewport, inputs, callbacks, meta, components:__spreadProps(__spreadValues({}, rest), {Brush:null === Brush3 ? void 0 : Brush, ContextBar:ContextBar2, DirectionIndicator:null === DirectionIndicator3 ? void 0 : DirectionIndicator, Grid:null === Grid3 ? void 0 : Grid, Handle:null === Handle3 ? void 0 : Handle, SelectionBackground:null === SelectionBackground3 ? void 0 : SelectionBackground, SelectionDetail:null === SelectionDetail4 ? void 0 : SelectionDetail2, SelectionForeground:null === 
      SelectionForeground3 ? void 0 : SelectionForeground})};
    });
    React33.useLayoutEffect(() => {
      const {Brush:Brush3, ContextBar:ContextBar2, DirectionIndicator:DirectionIndicator3, Grid:Grid3, Handle:Handle3, SelectionBackground:SelectionBackground3, SelectionDetail:SelectionDetail4, SelectionForeground:SelectionForeground3} = components, rest = __objRest(components, "Brush ContextBar DirectionIndicator Grid Handle SelectionBackground SelectionDetail SelectionForeground".split(" "));
      return autorun(() => {
        setCurrentContext({id:id3, viewport, inputs, callbacks, meta, components:__spreadProps(__spreadValues({}, rest), {Brush:null === Brush3 ? void 0 : Brush, ContextBar:ContextBar2, DirectionIndicator:null === DirectionIndicator3 ? void 0 : DirectionIndicator, Grid:null === Grid3 ? void 0 : Grid, Handle:null === Handle3 ? void 0 : Handle, SelectionBackground:null === SelectionBackground3 ? void 0 : SelectionBackground, SelectionDetail:null === SelectionDetail4 ? void 0 : SelectionDetail2, SelectionForeground:null === 
        SelectionForeground3 ? void 0 : SelectionForeground})});
      });
    }, []);
    const context = getRendererContext(id3);
    return (0,import_jsx_runtime28.jsx)(context.Provider, {value:currentContext, children});
  }), import_jsx_runtime29 = require("module$node_modules$react$jsx_runtime"), import_jsx_runtime30 = require("module$node_modules$react$jsx_runtime"), AppCanvas = observer(function(props) {
    const app = useApp();
    return (0,import_jsx_runtime30.jsx)(Renderer2, __spreadValues({viewport:app.viewport, inputs:app.inputs, callbacks:app._events, brush:app.brush, editingShape:app.editingShape, hoveredShape:app.hoveredShape, hoveredGroup:app.hoveredGroup, bindingShapes:app.bindingShapes, selectionDirectionHint:app.selectionDirectionHint, selectionBounds:app.selectionBounds, selectedShapes:app.selectedShapesArray, erasingShapes:app.erasingShapesArray, shapes:app.shapes, assets:app.assets, showGrid:app.settings.showGrid, 
    penMode:app.settings.penMode, showSelection:app.showSelection, showSelectionRotation:app.showSelectionRotation, showResizeHandles:app.showResizeHandles, showRotateHandles:app.showRotateHandles, showCloneHandles:app.showCloneHandles, showSelectionDetail:app.showSelectionDetail, showContextBar:app.showContextBar, cursor:app.cursors.cursor, cursorRotation:app.cursors.rotation, selectionRotation:app.selectionRotation, onEditingEnd:app.clearEditingState}, props));
  });
  require("module$node_modules$react$jsx_runtime");
  var React69 = __toESM(require("module$react")), React36 = __toESM(require("module$react")), import_jsx_runtime32 = require("module$node_modules$react$jsx_runtime"), extendedIcons = "add-link block-search block connector group internal-link link-to-block link-to-page link-to-whiteboard move-to-sidebar-right object-compact object-expanded open-as-page page-search page references-hide references-show select-cursor text ungroup whiteboard-element whiteboard".split(" "), TablerIcon = _a3 => {
    var {name, className} = _a3;
    _a3 = __objRest(_a3, ["name", "className"]);
    const classNamePrefix = extendedIcons.includes(name) ? "tie tie-" : "ti ti-";
    return (0,import_jsx_runtime32.jsx)("i", __spreadValues({className:[classNamePrefix + name, className].join(" ")}, _a3));
  }, import_jsx_runtime33 = require("module$node_modules$react$jsx_runtime"), LSUI = window.LSUI, import_jsx_runtime34 = require("module$node_modules$react$jsx_runtime"), import_jsx_runtime35 = require("module$node_modules$react$jsx_runtime"), CircleButton = ({style, icon, onClick}) => (0,import_jsx_runtime35.jsx)("button", {"data-html2canvas-ignore":"true", style, className:"tl-circle-button", onPointerDown:onClick, children:(0,import_jsx_runtime35.jsx)("div", {className:"tl-circle-button-icons-wrapper", 
  children:(0,import_jsx_runtime35.jsx)(TablerIcon, {name:icon})})}), import_jsx_runtime36 = require("module$node_modules$react$jsx_runtime"), LSUI2 = window.LSUI, LogseqContext = __toESM(require("module$react")).default.createContext({}), React35 = __toESM(require("module$react")), import_jsx_runtime37 = require("module$node_modules$react$jsx_runtime"), KeyboardShortcut = _a3 => {
    var {action:action2, shortcut, opts} = _a3;
    _a3 = __objRest(_a3, ["action", "shortcut", "opts"]);
    var {renderers} = React35.useContext(LogseqContext);
    renderers = null == renderers ? void 0 : renderers.KeyboardShortcut;
    return (0,import_jsx_runtime37.jsx)("div", __spreadProps(__spreadValues({className:"tl-menu-right-slot"}, _a3), {children:(0,import_jsx_runtime37.jsx)(renderers, {action:action2, shortcut, opts})}));
  }, import_jsx_runtime38 = require("module$node_modules$react$jsx_runtime"), LSUI3 = window.LSUI, ZoomMenu = observer(function() {
    const app = useApp(), preventEvent = e => {
      e.preventDefault();
    };
    return (0,import_jsx_runtime38.jsxs)(LSUI3.DropdownMenu, {children:[(0,import_jsx_runtime38.jsx)(LSUI3.DropdownMenuTrigger, {className:"tl-button text-sm px-2 important", id:"tl-zoom", children:(100 * app.viewport.camera.zoom).toFixed(0) + "%"}), (0,import_jsx_runtime38.jsxs)(LSUI3.DropdownMenuContent, {onCloseAutoFocus:e => e.preventDefault(), id:"zoomPopup", sideOffset:12, children:[(0,import_jsx_runtime38.jsxs)(LSUI3.DropdownMenuItem, {onSelect:preventEvent, onClick:app.api.zoomToFit, children:["Zoom to drawing", 
    (0,import_jsx_runtime38.jsx)(KeyboardShortcut, {action:"whiteboard/zoom-to-fit"})]}), (0,import_jsx_runtime38.jsxs)(LSUI3.DropdownMenuItem, {onSelect:preventEvent, onClick:app.api.zoomToSelection, disabled:0 === app.selectedShapesArray.length, children:["Zoom to fit selection", (0,import_jsx_runtime38.jsx)(KeyboardShortcut, {action:"whiteboard/zoom-to-selection"})]}), (0,import_jsx_runtime38.jsxs)(LSUI3.DropdownMenuItem, {onSelect:preventEvent, onClick:app.api.zoomIn, children:["Zoom in", (0,import_jsx_runtime38.jsx)(KeyboardShortcut, 
    {action:"whiteboard/zoom-in"})]}), (0,import_jsx_runtime38.jsxs)(LSUI3.DropdownMenuItem, {onSelect:preventEvent, onClick:app.api.zoomOut, children:["Zoom out", (0,import_jsx_runtime38.jsx)(KeyboardShortcut, {action:"whiteboard/zoom-out"})]}), (0,import_jsx_runtime38.jsxs)(LSUI3.DropdownMenuItem, {onSelect:preventEvent, onClick:app.api.resetZoom, children:["Reset zoom", (0,import_jsx_runtime38.jsx)(KeyboardShortcut, {action:"whiteboard/reset-zoom"})]})]})]});
  }), import_jsx_runtime39 = require("module$node_modules$react$jsx_runtime"), LSUI4 = window.LSUI, ActionBar = observer(function() {
    const app = useApp(), {handlers:{t}} = React36.useContext(LogseqContext), undo = React36.useCallback(() => {
      app.api.undo();
    }, [app]), redo = React36.useCallback(() => {
      app.api.redo();
    }, [app]), zoomIn = React36.useCallback(() => {
      app.api.zoomIn();
    }, [app]), zoomOut = React36.useCallback(() => {
      app.api.zoomOut();
    }, [app]), toggleGrid = React36.useCallback(() => {
      app.api.toggleGrid();
    }, [app]), toggleSnapToGrid = React36.useCallback(() => {
      app.api.toggleSnapToGrid();
    }, [app]), togglePenMode = React36.useCallback(() => {
      app.api.togglePenMode();
    }, [app]);
    return (0,import_jsx_runtime39.jsxs)("div", {className:"tl-action-bar", "data-html2canvas-ignore":"true", children:[!app.readOnly && (0,import_jsx_runtime39.jsxs)("div", {className:"tl-toolbar tl-history-bar mr-2 mb-2", children:[(0,import_jsx_runtime39.jsx)(Button, {tooltip:t("whiteboard/undo"), onClick:undo, children:(0,import_jsx_runtime39.jsx)(TablerIcon, {name:"arrow-back-up"})}), (0,import_jsx_runtime39.jsx)(Button, {tooltip:t("whiteboard/redo"), onClick:redo, children:(0,import_jsx_runtime39.jsx)(TablerIcon, 
    {name:"arrow-forward-up"})})]}), (0,import_jsx_runtime39.jsxs)("div", {className:"tl-toolbar tl-zoom-bar mr-2 mb-2", children:[(0,import_jsx_runtime39.jsx)(Button, {tooltip:t("whiteboard/zoom-in"), onClick:zoomIn, id:"tl-zoom-in", children:(0,import_jsx_runtime39.jsx)(TablerIcon, {name:"plus"})}), (0,import_jsx_runtime39.jsx)(Button, {tooltip:t("whiteboard/zoom-out"), onClick:zoomOut, id:"tl-zoom-out", children:(0,import_jsx_runtime39.jsx)(TablerIcon, {name:"minus"})}), (0,import_jsx_runtime39.jsx)(LSUI4.Separator, 
    {orientation:"vertical"}), (0,import_jsx_runtime39.jsx)(ZoomMenu, {})]}), (0,import_jsx_runtime39.jsxs)("div", {className:"tl-toolbar tl-grid-bar mr-2 mb-2", children:[(0,import_jsx_runtime39.jsx)(ToggleInput, {tooltip:t("whiteboard/toggle-grid"), className:"tl-button", pressed:app.settings.showGrid, id:"tl-show-grid", onPressedChange:toggleGrid, children:(0,import_jsx_runtime39.jsx)(TablerIcon, {name:"grid-dots"})}), !app.readOnly && (0,import_jsx_runtime39.jsx)(ToggleInput, {tooltip:t("whiteboard/snap-to-grid"), 
    className:"tl-button", pressed:app.settings.snapToGrid, id:"tl-snap-to-grid", onPressedChange:toggleSnapToGrid, children:(0,import_jsx_runtime39.jsx)(TablerIcon, {name:app.settings.snapToGrid ? "magnet" : "magnet-off"})})]}), !app.readOnly && (0,import_jsx_runtime39.jsx)("div", {className:"tl-toolbar tl-pen-mode-bar mb-2", children:(0,import_jsx_runtime39.jsx)(ToggleInput, {tooltip:t("whiteboard/toggle-pen-mode"), className:"tl-button", pressed:app.settings.penMode, id:"tl-toggle-pen-mode", onPressedChange:togglePenMode, 
    children:(0,import_jsx_runtime39.jsx)(TablerIcon, {name:app.settings.penMode ? "pencil" : "pencil-off"})})})]});
  }), import_react16 = __toESM(require("module$react")), import_react_dom2 = __toESM(require("module$react_dom")), import_jsx_runtime40 = require("module$node_modules$react$jsx_runtime"), printPoint = point => `[${point.map(d2 => {
    var _a3;
    return null != (_a3 = null == d2 ? void 0 : d2.toFixed(2)) ? _a3 : "-";
  }).join(", ")}]`, DevTools = observer(() => {
    var _a3;
    const {viewport:{bounds, camera:{point, zoom}}, inputs} = useRendererContext(), statusbarAnchorRef = import_react16.default.useRef();
    import_react16.default.useEffect(() => {
      const statusbarAnchor = document.getElementById("tl-statusbar-anchor");
      statusbarAnchorRef.current = statusbarAnchor;
    }, []);
    const rendererStatusText = [["Z", null != (_a3 = null == zoom ? void 0 : zoom.toFixed(2)) ? _a3 : "null"], ["MP", printPoint(inputs.currentPoint)], ["MS", printPoint(inputs.currentScreenPoint)], ["VP", printPoint(point)], ["VBR", printPoint([bounds.maxX, bounds.maxY])]].map(p2 => p2.join("")).join("|");
    _a3 = statusbarAnchorRef.current ? import_react_dom2.default.createPortal((0,import_jsx_runtime40.jsx)("div", {style:{flex:1, display:"flex", alignItems:"center"}, children:rendererStatusText}), statusbarAnchorRef.current) : null;
    return (0,import_jsx_runtime40.jsx)(import_jsx_runtime40.Fragment, {children:_a3});
  }), React42 = __toESM(require("module$react")), import_jsx_runtime41 = require("module$node_modules$react$jsx_runtime"), ToolButton = observer(_a3 => {
    var {id:id3, icon, tooltip, tooltipSide = "left", handleClick} = _a3;
    _a3 = __objRest(_a3, ["id", "icon", "tooltip", "tooltipSide", "handleClick"]);
    var _a4;
    const app = useApp(), Tool = null == (_a4 = [...app.Tools, TLSelectTool, TLMoveTool]) ? void 0 : _a4.find(T2 => T2.id === id3);
    _a4 = (_a4 = null == Tool ? void 0 : Tool.shortcut) && tooltip ? (0,import_jsx_runtime41.jsxs)("div", {className:"flex", children:[tooltip, (0,import_jsx_runtime41.jsx)(KeyboardShortcut, {action:_a4})]}) : tooltip;
    return (0,import_jsx_runtime41.jsx)(Button, __spreadProps(__spreadValues({}, _a3), {tooltipSide, tooltip:_a4, "data-tool":id3, "data-selected":id3 === app.selectedTool.id, onClick:handleClick, children:"string" === typeof icon ? (0,import_jsx_runtime41.jsx)(TablerIcon, {name:icon}) : icon}));
  }), import_react18 = __toESM(require("module$react")), import_jsx_runtime42 = require("module$node_modules$react$jsx_runtime"), LSUI5 = window.LSUI, GeometryTools = observer(function(_a3) {
    var {popoverSide = "left", setGeometry, activeGeometry, chevron = !0} = _a3;
    _a3 = __objRest(_a3, ["popoverSide", "setGeometry", "activeGeometry", "chevron"]);
    var {handlers:{t}} = import_react18.default.useContext(LogseqContext);
    const geometries = [{id:"box", icon:"square", tooltip:t("whiteboard/rectangle")}, {id:"ellipse", icon:"circle", tooltip:t("whiteboard/circle")}, {id:"polygon", icon:"triangle", tooltip:t("whiteboard/triangle")}];
    t = {id:"shapes", icon:"triangle-square-circle", tooltip:t("whiteboard/shape")};
    t = activeGeometry ? geometries.find(geo => geo.id === activeGeometry) : t;
    return (0,import_jsx_runtime42.jsxs)(LSUI5.Popover, {children:[(0,import_jsx_runtime42.jsx)(LSUI5.PopoverTrigger, {asChild:!0, children:(0,import_jsx_runtime42.jsxs)("div", __spreadProps(__spreadValues({}, _a3), {className:"tl-geometry-tools-pane-anchor", children:[(0,import_jsx_runtime42.jsx)(ToolButton, __spreadProps(__spreadValues({}, t), {tooltipSide:popoverSide})), chevron && (0,import_jsx_runtime42.jsx)(TablerIcon, {"data-selected":activeGeometry, className:"tl-popover-indicator", name:"chevron-down-left"})]}))}), 
    (0,import_jsx_runtime42.jsx)(LSUI5.PopoverContent, {className:"p-0 w-auto", side:popoverSide, sideOffset:15, collisionBoundary:document.querySelector(".logseq-tldraw"), children:(0,import_jsx_runtime42.jsx)("div", {className:`tl-toolbar tl-geometry-toolbar ${["left", "right"].includes(popoverSide) ? "flex-col" : "flex-row"}`, children:geometries.map(props => (0,import_jsx_runtime42.jsx)(ToolButton, {id:props.id, icon:props.icon, handleClick:setGeometry, tooltipSide:popoverSide}, props.id))})})]});
  }), import_jsx_runtime43 = require("module$node_modules$react$jsx_runtime"), LSUI6 = window.LSUI, import_react19 = __toESM(require("module$react")), import_jsx_runtime44 = require("module$node_modules$react$jsx_runtime"), LSUI7 = window.LSUI, React40 = __toESM(require("module$react")), import_react20 = require("module$react"), defaultAttributes = {xmlns:"http://www.w3.org/2000/svg", width:24, height:24, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:2, strokeLinecap:"round", 
  strokeLinejoin:"round"}, ChevronDown = ((iconName, iconNode) => {
    const Component = (0,import_react20.forwardRef)((_a3, ref) => {
      var {color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, children} = _a3;
      _a3 = __objRest(_a3, ["color", "size", "strokeWidth", "absoluteStrokeWidth", "children"]);
      return (0,import_react20.createElement)("svg", __spreadValues(__spreadProps(__spreadValues({ref}, defaultAttributes), {width:size, height:size, stroke:color, strokeWidth:absoluteStrokeWidth ? 24 * Number(strokeWidth) / Number(size) : strokeWidth, className:`lucide lucide-${iconName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`}), _a3), [...iconNode.map(([tag, attrs]) => (0,import_react20.createElement)(tag, attrs)), ...((Array.isArray(children) ? children : [children]) || [])]);
    });
    Component.displayName = `${iconName}`;
    return Component;
  })("ChevronDown", [["path", {d:"m6 9 6 6 6-6", key:"qrunsl"}]]), import_jsx_runtime45 = require("module$node_modules$react$jsx_runtime"), LSUI8 = window.LSUI, import_react22 = __toESM(require("module$react")), import_jsx_runtime46 = require("module$node_modules$react$jsx_runtime"), import_jsx_runtime47 = require("module$node_modules$react$jsx_runtime"), LSUI9 = window.LSUI, PrimaryTools = observer(function() {
    const app = useApp(), {handlers:{t}} = React42.useContext(LogseqContext), handleSetColor = React42.useCallback(color => {
      app.api.setColor(color);
    }, []), handleToolClick = React42.useCallback(e => {
      (e = e.currentTarget.dataset.tool) && app.selectTool(e);
    }, []), [activeGeomId, setActiveGeomId] = React42.useState(() => {
      var _a3;
      return null != (_a3 = Object.values(Geometry).find(geo => geo === app.selectedTool.id)) ? _a3 : Object.values(Geometry)[0];
    });
    React42.useEffect(() => {
      setActiveGeomId(prevId => {
        var _a3;
        return null != (_a3 = Object.values(Geometry).find(geo => geo === app.selectedTool.id)) ? _a3 : prevId;
      });
    }, [app.selectedTool.id]);
    return (0,import_jsx_runtime47.jsx)("div", {className:"tl-primary-tools", "data-html2canvas-ignore":"true", children:(0,import_jsx_runtime47.jsxs)("div", {className:"tl-toolbar tl-tools-floating-panel", children:[(0,import_jsx_runtime47.jsx)(ToolButton, {handleClick:() => app.selectTool("select"), tooltip:t("whiteboard/select"), id:"select", icon:"select-cursor"}), (0,import_jsx_runtime47.jsx)(ToolButton, {handleClick:() => app.selectTool("move"), tooltip:t("whiteboard/pan"), id:"move", icon:app.isIn("move.panning") ? 
    "hand-grab" : "hand-stop"}), (0,import_jsx_runtime47.jsx)(LSUI9.Separator, {orientation:"horizontal"}), (0,import_jsx_runtime47.jsx)(ToolButton, {handleClick:() => app.selectTool("logseq-portal"), tooltip:t("whiteboard/add-block-or-page"), id:"logseq-portal", icon:"circle-plus"}), (0,import_jsx_runtime47.jsx)(ToolButton, {handleClick:() => app.selectTool("pencil"), tooltip:t("whiteboard/draw"), id:"pencil", icon:"ballpen"}), (0,import_jsx_runtime47.jsx)(ToolButton, {handleClick:() => app.selectTool("highlighter"), 
    tooltip:t("whiteboard/highlight"), id:"highlighter", icon:"highlight"}), (0,import_jsx_runtime47.jsx)(ToolButton, {handleClick:() => app.selectTool("erase"), tooltip:t("whiteboard/eraser"), id:"erase", icon:"eraser"}), (0,import_jsx_runtime47.jsx)(ToolButton, {handleClick:() => app.selectTool("line"), tooltip:t("whiteboard/connector"), id:"line", icon:"connector"}), (0,import_jsx_runtime47.jsx)(ToolButton, {handleClick:() => app.selectTool("text"), tooltip:t("whiteboard/text"), id:"text", icon:"text"}), 
    (0,import_jsx_runtime47.jsx)(GeometryTools, {activeGeometry:activeGeomId, setGeometry:handleToolClick}), (0,import_jsx_runtime47.jsx)(LSUI9.Separator, {orientation:"horizontal", style:{margin:"0 -4px"}}), (0,import_jsx_runtime47.jsx)(ColorInput, {popoverSide:"left", color:app.settings.color, setColor:handleSetColor}), (0,import_jsx_runtime47.jsx)(ScaleInput, {scaleLevel:app.settings.scaleLevel, popoverSide:"left", compact:!0})]})});
  }), import_jsx_runtime48 = require("module$node_modules$react$jsx_runtime"), StatusBar = observer(function() {
    const app = useApp();
    return (0,import_jsx_runtime48.jsxs)("div", {className:"tl-statusbar", "data-html2canvas-ignore":"true", children:[app.selectedTool.id, " | ", app.selectedTool.currentState.id, (0,import_jsx_runtime48.jsx)("div", {style:{flex:1}}), (0,import_jsx_runtime48.jsx)("div", {id:"tl-statusbar-anchor", className:"flex gap-1"})]});
  }), import_jsx_runtime49 = require("module$node_modules$react$jsx_runtime"), AppUI = observer(function() {
    const app = useApp();
    return (0,import_jsx_runtime49.jsxs)(import_jsx_runtime49.Fragment, {children:[isDev() && (0,import_jsx_runtime49.jsx)(StatusBar, {}), isDev() && (0,import_jsx_runtime49.jsx)(DevTools, {}), !app.readOnly && (0,import_jsx_runtime49.jsx)(PrimaryTools, {}), (0,import_jsx_runtime49.jsx)(ActionBar, {})]});
  }), React62 = __toESM(require("module$react")), import_react52 = __toESM(require("module$react")), import_react50 = __toESM(require("module$react")), import_react26 = __toESM(require("module$react")), import_jsx_runtime50 = require("module$node_modules$react$jsx_runtime"), BlockLink = ({id:id3, showReferenceContent = !1}) => {
    var _a3;
    const {handlers:{isWhiteboardPage, redirectToPage, sidebarAddBlock, queryBlockByUUID}, renderers:{Breadcrumb, PageName}} = import_react26.default.useContext(LogseqContext);
    var iconName = "";
    let linkType = validUUID(id3) ? "B" : "P", blockContent = "";
    if (validUUID(id3)) {
      iconName = queryBlockByUUID(id3);
      if (!iconName) {
        return (0,import_jsx_runtime50.jsx)("span", {className:"p-2", children:"Invalid reference. Did you remove it?"});
      }
      blockContent = iconName.title;
      iconName = "whiteboard-shape" === (null == (_a3 = iconName.properties) ? void 0 : _a3["ls-type"]) ? "link-to-whiteboard" : "link-to-block";
    } else {
      iconName = isWhiteboardPage(id3) ? "link-to-whiteboard" : "link-to-page";
    }
    _a3 = blockContent && 23 < blockContent.length ? blockContent.slice(0, 20) + "..." : blockContent;
    return (0,import_jsx_runtime50.jsxs)("button", {className:"inline-flex gap-1 items-center w-full", onPointerDown:e => {
      e.stopPropagation();
      e.shiftKey ? sidebarAddBlock(id3, "B" === linkType ? "block" : "page") : redirectToPage(id3);
    }, children:[(0,import_jsx_runtime50.jsx)(TablerIcon, {name:iconName}), (0,import_jsx_runtime50.jsx)("span", {className:"pointer-events-none block-link-reference-row", children:"P" === linkType ? (0,import_jsx_runtime50.jsx)(PageName, {pageName:id3}) : (0,import_jsx_runtime50.jsxs)(import_jsx_runtime50.Fragment, {children:[(0,import_jsx_runtime50.jsx)(Breadcrumb, {levelLimit:1, blockId:id3, endSeparator:showReferenceContent}), showReferenceContent && _a3]})})]});
  }, import_react48 = __toESM(require("module$react")), import_react27 = require("module$react"), _excluded2 = ["children"], useIsomorphicLayoutEffect = "undefined" !== typeof document ? import_react27.useLayoutEffect : import_react27.useEffect, n = __toESM(require("module$react")), import_react28 = require("module$react"), import_react_dom3 = require("module$react_dom"), p, h, g = "undefined" != typeof document ? import_react28.useLayoutEffect : import_react28.useEffect;
  !function(e) {
    e[e.DEBUG = 0] = "DEBUG";
    e[e.INFO = 1] = "INFO";
    e[e.WARN = 2] = "WARN";
    e[e.ERROR = 3] = "ERROR";
  }(h ||= {});
  var v = ((p = {})[h.DEBUG] = "debug", p[h.INFO] = "log", p[h.WARN] = "warn", p[h.ERROR] = "error", p), S = system(function() {
    var e = statefulStream(h.ERROR);
    return {log:statefulStream(function(n2, o2, r2) {
      var i2;
      void 0 === r2 && (r2 = h.INFO);
      r2 >= (null != (i2 = ("undefined" == typeof globalThis ? window : globalThis).VIRTUOSO_LOG_LEVEL) ? i2 : e(4)) && console[v[r2]]("%creact-virtuoso: %c%s %o", "color: #0253b3; font-weight: bold", "color: initial", n2, o2);
    }), logLevel:e};
  }, [], {singleton:!0}), y = system(function() {
    var e = stream(), n2 = stream(), o2 = statefulStream(0), r2 = stream(), i2 = statefulStream(0), a3 = stream(), l3 = stream(), s2 = statefulStream(0), u2 = statefulStream(0), c2 = statefulStream(0), m2 = statefulStream(0), d2 = stream(), f2 = stream(), p2 = statefulStream(!1), h2 = statefulStream(!1);
    return connect(pipe(e, map2(function(e2) {
      return e2.scrollTop;
    })), n2), connect(pipe(e, map2(function(e2) {
      return e2.scrollHeight;
    })), l3), connect(n2, i2), {scrollContainerState:e, scrollTop:n2, viewportHeight:a3, headerHeight:s2, fixedHeaderHeight:u2, fixedFooterHeight:c2, footerHeight:m2, scrollHeight:l3, smoothScrollTargetReached:r2, react18ConcurrentRendering:h2, scrollTo:d2, scrollBy:f2, statefulScrollTop:i2, deviation:o2, scrollingInProgress:p2};
  }, [], {singleton:!0}), H = {lvl:0}, K = system(function() {
    return {recalcInProgress:statefulStream(!1)};
  }, [], {singleton:!0}), oe = {offsetHeight:"height", offsetWidth:"width"}, re = system(function(e) {
    var n2 = e[0].log, o2 = e[1].recalcInProgress;
    e = stream();
    var i2 = stream(), a3 = statefulStreamFromEmitter(i2, 0), l3 = stream(), s2 = stream(), u2 = statefulStream(0), m2 = statefulStream([]), d2 = statefulStream(void 0), f2 = statefulStream(void 0), p2 = statefulStream(function(e2, t) {
      return w(e2, oe[t]);
    }), g2 = statefulStream(void 0), v2 = statefulStream(0), S2 = {offsetTree:[], sizeTree:H, groupOffsetTree:H, lastIndex:0, lastOffset:0, lastSize:0, groupIndices:[]}, C3 = statefulStreamFromEmitter(pipe(e, withLatestFrom(m2, n2, v2), scan(Q, S2), distinctUntilChanged()), S2);
    connect(pipe(m2, filter(function(e2) {
      return 0 < e2.length;
    }), withLatestFrom(C3, v2), map2(function(e2) {
      var t = e2[0], n3 = e2[1], o3 = e2[2];
      e2 = t.reduce(function(e3, t2, r4) {
        return z(e3, t2, X(t2, n3.offsetTree, o3) || r4);
      }, H);
      return c({}, n3, {groupIndices:t, groupOffsetTree:e2});
    })), C3);
    connect(pipe(i2, withLatestFrom(C3), filter(function(e2) {
      return e2[0] < e2[1].lastIndex;
    }), map2(function(e2) {
      var t = e2[1];
      return [{startIndex:e2[0], endIndex:t.lastIndex, size:t.lastSize}];
    })), e);
    connect(d2, f2);
    var I2 = statefulStreamFromEmitter(pipe(d2, map2(function(e2) {
      return void 0 === e2;
    })), !0);
    connect(pipe(f2, filter(function(e2) {
      return void 0 !== e2 && C3(4).sizeTree === H;
    }), map2(function(e2) {
      return [{startIndex:0, endIndex:0, size:e2}];
    })), e);
    S2 = streamFromEmitter(pipe(e, withLatestFrom(C3), scan(function(e2, t) {
      t = t[1];
      return {changed:t !== e2.sizes, sizes:t};
    }, {changed:!1, sizes:S2}), map2(function(e2) {
      return e2.changed;
    })));
    subscribe(pipe(u2, scan(function(e2, t) {
      return {diff:e2.prev - t, prev:t};
    }, {diff:0, prev:0}), map2(function(e2) {
      return e2.diff;
    })), function(e2) {
      0 < e2 ? (o2(0, !0), l3(0, e2)) : 0 > e2 && s2(0, e2);
    });
    subscribe(pipe(u2, withLatestFrom(n2)), function(e2) {
      0 > e2[0] && (0,e2[1])("`firstItemIndex` prop should not be set to less than zero. If you don't know the total count, just use a very high value", {firstItemIndex:u2}, h.ERROR);
    });
    n2 = streamFromEmitter(l3);
    connect(pipe(l3, withLatestFrom(C3), map2(function(e2) {
      var t = e2[0];
      e2 = e2[1];
      if (0 < e2.groupIndices.length) {
        throw Error("Virtuoso: prepending items does not work with groups");
      }
      return P(e2.sizeTree).reduce(function(e3, n4) {
        var o3 = n4.k;
        n4 = n4.v;
        return {ranges:[].concat(e3.ranges, [{startIndex:e3.prevIndex, endIndex:o3 + t - 1, size:e3.prevSize}]), prevIndex:o3 + t, prevSize:n4};
      }, {ranges:[], prevIndex:0, prevSize:e2.lastSize}).ranges;
    })), e);
    var b3 = streamFromEmitter(pipe(s2, withLatestFrom(C3, v2), map2(function(e2) {
      return X(-e2[0], e2[1].offsetTree, e2[2]);
    })));
    return connect(pipe(s2, withLatestFrom(C3, v2), map2(function(e2) {
      var t = e2[0], n3 = e2[1];
      e2 = e2[2];
      if (0 < n3.groupIndices.length) {
        throw Error("Virtuoso: shifting items does not work with groups");
      }
      var r3 = P(n3.sizeTree).reduce(function(e3, n4) {
        return z(e3, Math.max(0, n4.k + t), n4.v);
      }, H);
      return c({}, n3, {sizeTree:r3}, $(n3.offsetTree, 0, r3, e2));
    })), C3), {data:g2, totalCount:i2, sizeRanges:e, groupIndices:m2, defaultItemSize:f2, fixedItemSize:d2, unshiftWith:l3, shiftWith:s2, shiftWithOffset:b3, beforeUnshiftWith:n2, firstItemIndex:u2, gap:v2, sizes:C3, listRefresh:S2, statefulTotalCount:a3, trackItemSizes:I2, itemSize:p2};
  }, tup(S, K), {singleton:!0}), ie = "undefined" != typeof document && "scrollBehavior" in document.documentElement.style, le = system(function(e) {
    function x2() {
      I2 && (I2(), I2 = null);
      w2 && (w2(), w2 = null);
      T2 && (clearTimeout(T2), T2 = null);
      s2(0, !1);
    }
    var n2 = e[0], o2 = n2.sizes, r2 = n2.totalCount, i2 = n2.listRefresh;
    n2 = n2.gap;
    var l3 = e[1], s2 = l3.scrollingInProgress, u2 = l3.viewportHeight, c2 = l3.scrollTo, m2 = l3.smoothScrollTargetReached, d2 = l3.headerHeight, f2 = l3.footerHeight, p2 = l3.fixedHeaderHeight;
    l3 = l3.fixedFooterHeight;
    e = e[2].log;
    var S2 = stream(), C3 = statefulStream(0), I2 = null, T2 = null, w2 = null;
    return connect(pipe(S2, withLatestFrom(o2, u2, r2, C3, d2, f2, e), withLatestFrom(n2, p2, l3), map2(function(e2) {
      var n3 = e2[0], o3 = n3[0], r3 = n3[1], a4 = n3[2], l4 = n3[3], u3 = n3[4], c3 = n3[5], d3 = n3[6], f3 = n3[7], p3 = e2[1];
      n3 = e2[2];
      e2 = e2[3];
      var C4 = ae(o3), b3 = C4.align, y2 = C4.behavior, H2 = C4.offset;
      --l4;
      C4 = ee(C4, r3, l4);
      c3 = X(C4, r3.offsetTree, p3) + c3;
      "end" === b3 ? (c3 += n3 + k(r3.sizeTree, C4)[1] - a4 + e2, C4 === l4 && (c3 += d3)) : "center" === b3 ? c3 += (n3 + k(r3.sizeTree, C4)[1] - a4 + e2) / 2 : c3 -= u3;
      H2 && (c3 += H2);
      var F2 = function(e3) {
        x2();
        e3 ? (f3("retrying to scroll to", {location:o3}, h.DEBUG), S2(0, o3)) : f3("list did not change, scroll successful", {}, h.DEBUG);
      };
      if (x2(), "smooth" === y2) {
        var z2 = !1;
        w2 = subscribe(i2, function(e3) {
          z2 = z2 || e3;
        });
        I2 = handleNext(m2, function() {
          F2(z2);
        });
      } else {
        I2 = handleNext(pipe(i2, function(e3) {
          var t = setTimeout(function() {
            e3(!1);
          }, 150);
          return function(n4) {
            n4 && (e3(!0), clearTimeout(t));
          };
        }), F2);
      }
      T2 = setTimeout(function() {
        x2();
      }, 1200);
      s2(0, !0);
      return f3("scrolling from index to", {index:C4, top:c3, behavior:y2}, h.DEBUG), {top:c3, behavior:y2};
    })), c2), {scrollToIndex:S2, topListHeight:C3};
  }, tup(re, y, S), {singleton:!0}), ue = {atBottom:!1, notAtBottomBecause:"NOT_SHOWING_LAST_ITEM", state:{offsetBottom:0, scrollTop:0, viewportHeight:0, scrollHeight:0}}, ce = system(function(e) {
    var n2 = e[0], o2 = n2.scrollContainerState;
    e = n2.scrollTop;
    var i2 = n2.viewportHeight, a3 = n2.headerHeight, l3 = n2.footerHeight, s2 = n2.scrollBy;
    n2 = statefulStream(!1);
    var c2 = statefulStream(!0), m2 = stream(), d2 = stream(), f2 = statefulStream(4), p2 = statefulStream(0), h2 = statefulStreamFromEmitter(pipe(merge(pipe(duc(e), skip(1), mapTo(!0)), pipe(duc(e), skip(1), mapTo(!1), debounceTime(100))), distinctUntilChanged()), !1), g2 = statefulStreamFromEmitter(pipe(merge(pipe(s2, mapTo(!0)), pipe(s2, mapTo(!1), debounceTime(200))), distinctUntilChanged()), !1);
    connect(pipe(combineLatest(duc(e), duc(p2)), map2(function(e2) {
      return e2[0] <= e2[1];
    }), distinctUntilChanged()), c2);
    connect(pipe(c2, throttleTime(50)), d2);
    i2 = streamFromEmitter(pipe(combineLatest(o2, duc(i2), duc(a3), duc(l3), duc(f2)), scan(function(e2, t) {
      var n3, o3, r3 = t[0], i3 = r3.scrollTop;
      r3 = r3.scrollHeight;
      var l4 = t[1], s3 = {viewportHeight:l4, scrollTop:i3, scrollHeight:r3};
      return i3 + l4 - r3 > -t[4] ? (i3 > e2.state.scrollTop ? (n3 = "SCROLLED_DOWN", o3 = e2.state.scrollTop - i3) : (n3 = "SIZE_DECREASED", o3 = e2.state.scrollTop - i3 || e2.scrollTopDelta), {atBottom:!0, state:s3, atBottomBecause:n3, scrollTopDelta:o3}) : {atBottom:!1, notAtBottomBecause:s3.scrollHeight > e2.state.scrollHeight ? "SIZE_INCREASED" : l4 < e2.state.viewportHeight ? "VIEWPORT_HEIGHT_DECREASING" : i3 < e2.state.scrollTop ? "SCROLLING_UPWARDS" : "NOT_FULLY_SCROLLED_TO_LAST_ITEM_BOTTOM", 
      state:s3};
    }, ue), distinctUntilChanged(function(e2, t) {
      return e2 && e2.atBottom === t.atBottom;
    })));
    a3 = statefulStreamFromEmitter(pipe(o2, scan(function(e2, t) {
      var n3 = t.scrollTop, o3 = t.scrollHeight;
      t = t.viewportHeight;
      return 1.01 > Math.abs(e2.scrollHeight - o3) ? {scrollTop:n3, scrollHeight:o3, jump:0, changed:!1} : e2.scrollTop !== n3 && 1 > o3 - (n3 + t) ? {scrollHeight:o3, scrollTop:n3, jump:e2.scrollTop - n3, changed:!0} : {scrollHeight:o3, scrollTop:n3, jump:0, changed:!0};
    }, {scrollHeight:0, jump:0, scrollTop:0, changed:!1}), filter(function(e2) {
      return e2.changed;
    }), map2(function(e2) {
      return e2.jump;
    })), 0);
    connect(pipe(i2, map2(function(e2) {
      return e2.atBottom;
    })), n2);
    connect(pipe(n2, throttleTime(50)), m2);
    l3 = statefulStream("down");
    connect(pipe(o2, map2(function(e2) {
      return e2.scrollTop;
    }), distinctUntilChanged(), scan(function(e2, n3) {
      return g2(4) ? {direction:e2.direction, prevScrollTop:n3} : {direction:n3 < e2.prevScrollTop ? "up" : "down", prevScrollTop:n3};
    }, {direction:"down", prevScrollTop:0}), map2(function(e2) {
      return e2.direction;
    })), l3);
    connect(pipe(o2, throttleTime(50), mapTo("none")), l3);
    o2 = statefulStream(0);
    return connect(pipe(h2, filter(function(e2) {
      return !e2;
    }), mapTo(0)), o2), connect(pipe(e, throttleTime(100), withLatestFrom(h2), filter(function(e2) {
      return !!e2[1];
    }), scan(function(e2, t) {
      return [e2[1], t[0]];
    }, [0, 0]), map2(function(e2) {
      return e2[1] - e2[0];
    })), o2), {isScrolling:h2, isAtTop:c2, isAtBottom:n2, atBottomState:i2, atTopStateChange:d2, atBottomStateChange:m2, scrollDirection:l3, atBottomThreshold:f2, atTopThreshold:p2, scrollVelocity:o2, lastJumpDueToItemResize:a3};
  }, tup(y)), me = system(function(e) {
    var n2 = e[0].log;
    e = statefulStream(!1);
    var r2 = streamFromEmitter(pipe(e, filter(function(e2) {
      return e2;
    }), distinctUntilChanged()));
    return subscribe(e, function(e2) {
      e2 && n2(4)("props updated", {}, h.DEBUG);
    }), {propsReady:e, didMount:r2};
  }, tup(S), {singleton:!0}), de = system(function(e) {
    var n2 = e[0], o2 = n2.sizes, r2 = n2.listRefresh;
    n2 = n2.defaultItemSize;
    var a3 = e[1].scrollTop, l3 = e[2].scrollToIndex;
    e = e[3].didMount;
    var u2 = statefulStream(!0), c2 = statefulStream(0);
    return connect(pipe(e, withLatestFrom(c2), filter(function(e2) {
      return !!e2[1];
    }), mapTo(!1)), u2), subscribe(pipe(combineLatest(r2, e), withLatestFrom(u2, o2, n2), filter(function(e2) {
      var t = e2[1], n3 = e2[3];
      return e2[0][1] && (e2[2].sizeTree !== H || void 0 !== n3) && !t;
    }), withLatestFrom(c2)), function(e2) {
      var n3 = e2[1];
      setTimeout(function() {
        handleNext(a3, function() {
          u2(0, !0);
        });
        l3(0, n3);
      });
    }), {scrolledToInitialItem:u2, initialTopMostItemIndex:c2};
  }, tup(re, y, le, me), {singleton:!0}), pe = system(function(e) {
    function C3(e2) {
      s2(0, {index:"LAST", align:"end", behavior:e2});
    }
    function I2(e2) {
      var n3 = handleNext(l3, function(n4) {
        !e2 || n4.atBottom || "SIZE_INCREASED" !== n4.notAtBottomBecause || S2 || (f2(4)("scrolling to bottom due to increased size", {}, h.DEBUG), C3("auto"));
      });
      setTimeout(n3, 100);
    }
    var n2 = e[0], o2 = n2.totalCount, r2 = n2.listRefresh, i2 = e[1];
    n2 = i2.isAtBottom;
    var l3 = i2.atBottomState, s2 = e[2].scrollToIndex;
    i2 = e[3].scrolledToInitialItem;
    var c2 = e[4], m2 = c2.propsReady;
    c2 = c2.didMount;
    var f2 = e[5].log;
    e = e[6].scrollingInProgress;
    var g2 = statefulStream(!1), v2 = stream(), S2 = null;
    return subscribe(pipe(combineLatest(pipe(duc(o2), skip(1)), c2), withLatestFrom(duc(g2), n2, i2, e), map2(function(e2) {
      var t = e2[0], n3 = t[0];
      t = t[1] && e2[3];
      var r3 = "auto";
      t && (r3 = e2[1], e2 = e2[2] || e2[4], r3 = "function" == typeof r3 ? fe(r3(e2)) : e2 && fe(r3), t = t && !!r3);
      return {totalCount:n3, shouldFollow:t, followOutputBehavior:r3};
    }), filter(function(e2) {
      return e2.shouldFollow;
    })), function(e2) {
      var n3 = e2.totalCount, o3 = e2.followOutputBehavior;
      S2 && (S2(), S2 = null);
      S2 = handleNext(r2, function() {
        f2(4)("following output to ", {totalCount:n3}, h.DEBUG);
        C3(o3);
        S2 = null;
      });
    }), subscribe(pipe(combineLatest(duc(g2), o2, m2), filter(function(e2) {
      return e2[0] && e2[2];
    }), scan(function(e2, t) {
      t = t[1];
      return {refreshed:e2.value === t, value:t};
    }, {refreshed:!1, value:0}), filter(function(e2) {
      return e2.refreshed;
    }), withLatestFrom(g2, o2)), function(e2) {
      I2(!1 !== e2[1]);
    }), subscribe(v2, function() {
      I2(!1 !== g2(4));
    }), subscribe(combineLatest(duc(g2), l3), function(e2) {
      var t = e2[1];
      e2[0] && !t.atBottom && "VIEWPORT_HEIGHT_DECREASING" === t.notAtBottomBecause && C3("auto");
    }), {followOutput:g2, autoscrollToBottom:v2};
  }, tup(re, ce, le, de, me, S, y)), ge = system(function(e) {
    var n2 = e[0], o2 = n2.totalCount, r2 = n2.groupIndices;
    n2 = n2.sizes;
    var a3 = e[1];
    e = a3.scrollTop;
    a3 = a3.headerHeight;
    var u2 = stream(), c2 = stream(), m2 = streamFromEmitter(pipe(u2, map2(he)));
    return connect(pipe(m2, map2(function(e2) {
      return e2.totalCount;
    })), o2), connect(pipe(m2, map2(function(e2) {
      return e2.groupIndices;
    })), r2), connect(pipe(combineLatest(e, n2, a3), filter(function(e2) {
      return e2[1].groupOffsetTree !== H;
    }), map2(function(e2) {
      return k(e2[1].groupOffsetTree, Math.max(e2[0] - e2[2], 0), "v")[0];
    }), distinctUntilChanged(), map2(function(e2) {
      return [e2];
    })), c2), {groupCounts:u2, topItemsIndexes:c2};
  }, tup(re, y)), Te = system(function(e) {
    var n2 = e[0];
    e = n2.scrollTop;
    var r2 = n2.viewportHeight, i2 = n2.deviation, a3 = n2.headerHeight, l3 = n2.fixedHeaderHeight;
    n2 = stream();
    var u2 = statefulStream(0), c2 = statefulStream(0), m2 = statefulStream(0);
    e = statefulStreamFromEmitter(pipe(combineLatest(duc(e), duc(r2), duc(a3), duc(n2, ve), duc(m2), duc(u2), duc(l3), duc(i2), duc(c2)), map2(function(e2) {
      var t = e2[0], n3 = e2[1], o3 = e2[2], r3 = e2[3], i3 = r3[0];
      r3 = r3[1];
      var l4 = e2[4], s3 = e2[6], u3 = e2[7], c3 = e2[8], m3 = t - u3;
      e2 = e2[5] + s3;
      var f2 = Math.max(o3 - m3, 0), p2 = "none", h2 = "number" == typeof c3 ? c3 : c3.top || 0;
      c3 = "number" == typeof c3 ? c3 : c3.bottom || 0;
      return i3 -= u3, r3 += o3 + s3, i3 + (o3 + s3) > t + e2 - h2 && (p2 = "up"), r3 - u3 < t - f2 + n3 + c3 && (p2 = "down"), "none" !== p2 ? [Math.max(m3 - o3 - Ce(l4, "top", p2) - h2, 0), m3 - f2 - s3 + n3 + Ce(l4, "bottom", p2) + c3] : null;
    }), filter(function(e2) {
      return null != e2;
    }), distinctUntilChanged(ve)), [0, 0]);
    return {listBoundary:n2, overscan:m2, topListHeight:u2, increaseViewportBy:c2, visibleRange:e};
  }, tup(y), {singleton:!0}), we = {items:[], topItems:[], offsetTop:0, offsetBottom:0, top:0, bottom:0, topListHeight:0, totalCount:0, firstItemIndex:0}, ye = system(function(e) {
    var n2 = e[0], o2 = n2.sizes, r2 = n2.totalCount, i2 = n2.data, a3 = n2.firstItemIndex, l3 = n2.gap, s2 = e[1], u2 = e[2], m2 = u2.visibleRange;
    n2 = u2.listBoundary;
    u2 = u2.topListHeight;
    var h2 = e[3], g2 = h2.scrolledToInitialItem, v2 = h2.initialTopMostItemIndex;
    h2 = e[4].topListHeight;
    var C3 = e[5], I2 = e[6].didMount, T2 = e[7].recalcInProgress;
    e = statefulStream([]);
    var x2 = stream();
    connect(s2.topItemsIndexes, e);
    o2 = statefulStreamFromEmitter(pipe(combineLatest(I2, T2, duc(m2, ve), duc(r2), duc(o2), duc(v2), g2, duc(e), duc(a3), duc(l3), i2), filter(function(e2) {
      return e2[0] && !e2[1];
    }), map2(function(e2) {
      var n3 = e2[2], o3 = n3[0], r3 = n3[1];
      n3 = e2[3];
      var a4 = e2[5], l4 = e2[6], s3 = e2[7], u3 = e2[8], m3 = e2[9], d3 = e2[10];
      e2 = e2[4];
      var h3 = e2.sizeTree, g3 = e2.offsetTree;
      if (0 === n3 || 0 === o3 && 0 === r3) {
        return c({}, we, {totalCount:n3});
      }
      if (h3 === H) {
        return be(function(e3, t, n4) {
          return t.groupOffsetTree !== H ? (e3 = te(e3, t), [{index:k(t.groupOffsetTree, e3)[0], size:0, offset:0}, {index:e3, size:0, offset:0, data:n4 && n4[0]}]) : [{index:e3, size:0, offset:0, data:n4 && n4[0]}];
        }("number" == typeof a4 ? a4 : "LAST" === a4.index ? n3 - 1 : a4.index, e2, d3), [], n3, m3, e2, u3);
      }
      a4 = [];
      if (0 < s3.length) {
        var S3, C4 = s3[0], I3 = s3[s3.length - 1], T3 = 0;
        for (h3 = f(A(h3, C4, I3)); !(S3 = h3()).done;) {
          var x3 = S3.value;
          S3 = x3.value;
          var H2 = Math.min(x3.end, I3);
          for (x3 = Math.max(x3.start, C4); x3 <= H2; x3++) {
            a4.push({index:x3, size:S3, offset:T3, data:d3 && d3[x3]}), T3 += S3;
          }
        }
      }
      if (!l4) {
        return be([], a4, n3, m3, e2, u3);
      }
      var L3 = 0 < s3.length ? s3[s3.length - 1] + 1 : 0, F2 = function(e3, t, n4, o4) {
        var s4, l5;
        return void 0 === o4 && (o4 = 0), 0 < o4 && (t = Math.max(t, e3[_(e3, o4, q)].offset)), N((l5 = _(e3, t, Z), s4 = _(e3, n4, Z, l5), e3.slice(l5, s4 + 1)), J);
      }(g3, o3, r3, L3);
      if (0 === F2.length) {
        return null;
      }
      var z2 = n3 - 1;
      return be(tap([], function(e3) {
        for (var t, n4 = f(F2); !(t = n4()).done;) {
          var i4 = t.value, a5 = i4.value;
          t = a5.offset;
          var s4 = i4.start, u4 = a5.size;
          a5.offset < o3 && (a5 = (s4 += Math.floor((o3 - a5.offset + m3) / (u4 + m3))) - i4.start, t += a5 * u4 + a5 * m3);
          s4 < L3 && (t += (L3 - s4) * u4, s4 = L3);
          for (i4 = Math.min(i4.end, z2); s4 <= i4 && !(t >= r3); s4++) {
            e3.push({index:s4, size:u4, offset:t, data:d3 && d3[s4]}), t += u4 + m3;
          }
        }
      }), a4, n3, m3, e2, u3);
    }), filter(function(e2) {
      return null !== e2;
    }), distinctUntilChanged()), we);
    return connect(pipe(i2, filter(function(e2) {
      return void 0 !== e2;
    }), map2(function(e2) {
      return e2.length;
    })), r2), connect(pipe(o2, map2(function(e2) {
      return e2.topListHeight;
    })), h2), connect(h2, u2), connect(pipe(o2, map2(function(e2) {
      return [e2.top, e2.bottom];
    })), n2), connect(pipe(o2, map2(function(e2) {
      return e2.items;
    })), x2), c({listState:o2, topItemsIndexes:e, endReached:streamFromEmitter(pipe(o2, filter(function(e2) {
      return 0 < e2.items.length;
    }), withLatestFrom(r2, i2), filter(function(e2) {
      var t = e2[0].items;
      return t[t.length - 1].originalIndex === e2[1] - 1;
    }), map2(function(e2) {
      return [e2[1] - 1, e2[2]];
    }), distinctUntilChanged(ve), map2(function(e2) {
      return e2[0];
    }))), startReached:streamFromEmitter(pipe(o2, throttleTime(200), filter(function(e2) {
      var t = e2.items;
      return 0 < t.length && t[0].originalIndex === e2.topItems.length;
    }), map2(function(e2) {
      return e2.items[0].index;
    }), distinctUntilChanged())), rangeChanged:streamFromEmitter(pipe(o2, filter(function(e2) {
      return 0 < e2.items.length;
    }), map2(function(e2) {
      e2 = e2.items;
      for (var n3 = 0, o3 = e2.length - 1; "group" === e2[n3].type && n3 < o3;) {
        n3++;
      }
      for (; "group" === e2[o3].type && o3 > n3;) {
        o3--;
      }
      return {startIndex:e2[n3].index, endIndex:e2[o3].index};
    }), distinctUntilChanged(Se))), itemsRendered:x2}, C3);
  }, tup(re, ge, Te, de, le, ce, me, K), {singleton:!0}), He = system(function(e) {
    var n2 = e[0], o2 = n2.sizes, r2 = n2.firstItemIndex, i2 = n2.data;
    n2 = n2.gap;
    var l3 = e[1].listState;
    e = e[2].didMount;
    var u2 = statefulStream(0);
    return connect(pipe(e, withLatestFrom(u2), filter(function(e2) {
      return 0 !== e2[1];
    }), withLatestFrom(o2, r2, n2, i2), map2(function(e2) {
      var t = e2[0][1], n3 = e2[1], o3 = e2[2], r3 = e2[3];
      e2 = e2[4];
      var a4 = void 0 === e2 ? [] : e2;
      e2 = 0;
      if (0 < n3.groupIndices.length) {
        for (var s3, u3 = f(n3.groupIndices); !((s3 = u3()).done || s3.value - e2 >= t);) {
          e2++;
        }
      }
      t += e2;
      return be(Array.from({length:t}).map(function(e3, t2) {
        return {index:t2, size:0, offset:0, data:a4[t2]};
      }), [], t, r3, n3, o3);
    })), l3), {initialItemCount:u2};
  }, tup(re, ye, me), {singleton:!0}), Ee = system(function(e) {
    e = e[0].scrollVelocity;
    var o2 = statefulStream(!1), r2 = stream(), i2 = statefulStream(!1);
    return connect(pipe(e, withLatestFrom(i2, o2, r2), filter(function(e2) {
      return !!e2[1];
    }), map2(function(e2) {
      var t = e2[0], n3 = e2[1], o3 = e2[2];
      e2 = e2[3];
      var i3 = n3.enter;
      if (o3) {
        if ((0,n3.exit)(t, e2)) {
          return !1;
        }
      } else if (i3(t, e2)) {
        return !0;
      }
      return o3;
    }), distinctUntilChanged()), o2), subscribe(pipe(combineLatest(o2, e, r2), withLatestFrom(i2)), function(e2) {
      var t = e2[0];
      e2 = e2[1];
      return t[0] && e2 && e2.change && e2.change(t[1], t[2]);
    }), {isSeeking:o2, scrollSeekConfiguration:i2, scrollVelocity:e, scrollSeekRangeChanged:r2};
  }, tup(ce), {singleton:!0}), Re = system(function(e) {
    e = e[0].topItemsIndexes;
    var o2 = statefulStream(0);
    return connect(pipe(o2, filter(function(e2) {
      return 0 < e2;
    }), map2(function(e2) {
      return Array.from({length:e2}).map(function(e3, t) {
        return t;
      });
    })), e), {topItemCount:o2};
  }, tup(ye)), Le = system(function(e) {
    var n2 = e[0], o2 = n2.footerHeight, r2 = n2.headerHeight, i2 = n2.fixedHeaderHeight;
    n2 = n2.fixedFooterHeight;
    var l3 = e[1].listState;
    e = stream();
    o2 = statefulStreamFromEmitter(pipe(combineLatest(o2, n2, r2, i2, l3), map2(function(e2) {
      var t = e2[4];
      return e2[0] + e2[1] + e2[2] + e2[3] + t.offsetBottom + t.bottom;
    })), 0);
    return connect(duc(o2), e), {totalListHeight:o2, totalListHeightChanged:e};
  }, tup(y, ye), {singleton:!0}), ke = Fe(function() {
    return /iP(ad|hone|od).+Version\/[\d.]+.*Safari/i.test(navigator.userAgent);
  }), ze = system(function(e) {
    function I2(e2) {
      0 < e2 ? (o2(0, {top:-e2, behavior:"auto"}), i2(0, 0)) : (i2(0, 0), o2(0, {top:-e2, behavior:"auto"}));
    }
    var n2 = e[0], o2 = n2.scrollBy, r2 = n2.scrollTop, i2 = n2.deviation, a3 = n2.scrollingInProgress, l3 = e[1];
    n2 = l3.isScrolling;
    var u2 = l3.isAtBottom, c2 = l3.scrollDirection, m2 = e[3], d2 = m2.beforeUnshiftWith, f2 = m2.shiftWithOffset, p2 = m2.sizes;
    m2 = m2.gap;
    var v2 = e[4].log, S2 = e[5].recalcInProgress;
    e = streamFromEmitter(pipe(e[2].listState, withLatestFrom(l3.lastJumpDueToItemResize), scan(function(e2, t) {
      var n3 = e2[1], o3 = t[0], r3 = o3.items, i3 = o3.totalCount;
      o3 = o3.bottom + o3.offsetBottom;
      var l4 = 0;
      return e2[2] === i3 && 0 < n3.length && 0 < r3.length && (0 === r3[0].originalIndex && 0 === n3[0].originalIndex || 0 != (l4 = o3 - e2[3]) && (l4 += t[1])), [l4, r3, i3, o3];
    }, [0, [], 0, 0]), filter(function(e2) {
      return 0 !== e2[0];
    }), withLatestFrom(r2, c2, a3, u2, v2), filter(function(e2) {
      return !e2[3] && 0 !== e2[1] && "up" === e2[2];
    }), map2(function(e2) {
      var t = e2[0][0];
      return (0,e2[5])("Upward scrolling compensation", {amount:t}, h.DEBUG), t;
    })));
    return subscribe(pipe(e, withLatestFrom(i2, n2)), function(e2) {
      var n3 = e2[0], o3 = e2[1];
      e2[2] && ke() ? i2(0, o3 - n3) : I2(-n3);
    }), subscribe(pipe(combineLatest(statefulStreamFromEmitter(n2, !1), i2, S2), filter(function(e2) {
      return !e2[0] && !e2[2] && 0 !== e2[1];
    }), map2(function(e2) {
      return e2[1];
    }), throttleTime(1)), I2), connect(pipe(f2, map2(function(e2) {
      return {top:-e2};
    })), o2), subscribe(pipe(d2, withLatestFrom(p2, m2), map2(function(e2) {
      var t = e2[0];
      return t * e2[1].lastSize + t * e2[2];
    })), function(e2) {
      i2(0, e2);
      requestAnimationFrame(function() {
        publish(o2, {top:e2});
        requestAnimationFrame(function() {
          i2(0, 0);
          S2(0, !1);
        });
      });
    }), {deviation:i2};
  }, tup(y, ce, ye, re, S, K)), Be = system(function(e) {
    var n2 = e[0].totalListHeight, o2 = e[1].didMount, r2 = e[2].scrollTo;
    e = statefulStream(0);
    return subscribe(pipe(o2, withLatestFrom(e), filter(function(e2) {
      return 0 !== e2[1];
    }), map2(function(e2) {
      return {top:e2[1]};
    })), function(e2) {
      handleNext(pipe(n2, filter(function(e3) {
        return 0 !== e3;
      })), function() {
        setTimeout(function() {
          r2(0, e2);
        });
      });
    }), {initialScrollTop:e};
  }, tup(Le, me, y), {singleton:!0}), Pe = system(function(e) {
    var n2 = e[0].viewportHeight;
    e = e[1].totalListHeight;
    var r2 = statefulStream(!1);
    return {alignToBottom:r2, paddingTopAddition:statefulStreamFromEmitter(pipe(combineLatest(r2, n2, e), filter(function(e2) {
      return e2[0];
    }), map2(function(e2) {
      return Math.max(0, e2[1] - e2[2]);
    }), distinctUntilChanged()), 0)};
  }, tup(y, Le), {singleton:!0}), Oe = system(function(e) {
    var n2 = e[0];
    e = n2.scrollTo;
    n2 = n2.scrollContainerState;
    var i2 = stream(), a3 = stream(), l3 = stream(), s2 = statefulStream(!1), u2 = statefulStream(void 0);
    return connect(pipe(combineLatest(i2, a3), map2(function(e2) {
      var t = e2[0];
      return {scrollTop:Math.max(0, t.scrollTop - e2[1].offsetTop), scrollHeight:t.scrollHeight, viewportHeight:t.viewportHeight};
    })), n2), connect(pipe(e, withLatestFrom(a3), map2(function(e2) {
      var t = e2[0];
      return c({}, t, {top:t.top + e2[1].offsetTop});
    })), l3), {useWindowScroll:s2, customScrollParent:u2, windowScrollContainerState:i2, windowViewportRect:a3, windowScrollTo:l3};
  }, tup(y)), Me = ["done", "behavior", "align"], We = system(function(e) {
    var n2 = e[0], o2 = n2.sizes, r2 = n2.totalCount;
    n2 = n2.gap;
    var a3 = e[1], l3 = a3.scrollTop, s2 = a3.viewportHeight, u2 = a3.headerHeight, d2 = a3.fixedHeaderHeight, f2 = a3.fixedFooterHeight, p2 = a3.scrollingInProgress;
    e = e[2].scrollToIndex;
    a3 = stream();
    return connect(pipe(a3, withLatestFrom(o2, s2, r2, u2, d2, f2, l3), withLatestFrom(n2), map2(function(e2) {
      var n3 = e2[0], o3 = n3[0], r3 = n3[1], i3 = n3[2], a4 = n3[3], l4 = n3[4], s3 = n3[5], u3 = n3[6];
      n3 = n3[7];
      var f3 = e2[1];
      e2 = o3.done;
      var g3 = o3.behavior, v2 = o3.align, S2 = m(o3, Me), C3 = null;
      o3 = ee(o3, r3, a4 - 1);
      l4 = X(o3, r3.offsetTree, f3) + l4 + s3;
      return l4 < n3 + s3 ? C3 = c({}, S2, {behavior:g3, align:null != v2 ? v2 : "start"}) : l4 + k(r3.sizeTree, o3)[1] > n3 + i3 - u3 && (C3 = c({}, S2, {behavior:g3, align:null != v2 ? v2 : "end"})), C3 ? e2 && handleNext(pipe(p2, skip(1), filter(function(e3) {
        return !1 === e3;
      })), e2) : e2 && e2(), C3;
    }), filter(function(e2) {
      return null !== e2;
    })), e), {scrollIntoView:a3};
  }, tup(re, y, le, ye, S), {singleton:!0}), Ve = ["listState", "topItemsIndexes"], Ue = system(function(e) {
    return c({}, e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]);
  }, tup(Te, He, me, Ee, Le, Be, Pe, Oe, We)), Ae = system(function(e) {
    var n2 = e[0], o2 = n2.totalCount, r2 = n2.sizeRanges, i2 = n2.fixedItemSize, a3 = n2.defaultItemSize, l3 = n2.trackItemSizes, s2 = n2.itemSize, u2 = n2.data, d2 = n2.firstItemIndex, f2 = n2.groupIndices, p2 = n2.statefulTotalCount;
    n2 = n2.gap;
    var g2 = e[1], v2 = g2.initialTopMostItemIndex;
    g2 = g2.scrolledToInitialItem;
    var C3 = e[2], I2 = e[3], T2 = e[4], w2 = T2.listState, x2 = T2.topItemsIndexes;
    T2 = m(T2, Ve);
    var y2 = e[5].scrollToIndex, H2 = e[7].topItemCount, E2 = e[8].groupCounts, R3 = e[9];
    e = e[10];
    return connect(T2.rangeChanged, R3.scrollSeekRangeChanged), connect(pipe(R3.windowViewportRect, map2(function(e2) {
      return e2.visibleHeight;
    })), C3.viewportHeight), c({totalCount:o2, data:u2, firstItemIndex:d2, sizeRanges:r2, initialTopMostItemIndex:v2, scrolledToInitialItem:g2, topItemsIndexes:x2, topItemCount:H2, groupCounts:E2, fixedItemHeight:i2, defaultItemHeight:a3, gap:n2}, I2, {statefulTotalCount:p2, listState:w2, scrollToIndex:y2, trackItemSizes:l3, itemSize:s2, groupIndices:f2}, T2, R3, C3, e);
  }, tup(re, de, y, pe, ye, le, ze, Re, ge, Ue, S)), Ne = Fe(function() {
    if ("undefined" == typeof document) {
      return "sticky";
    }
    var e = document.createElement("div");
    return e.style.position = "-webkit-sticky", "-webkit-sticky" === e.style.position ? "-webkit-sticky" : "sticky";
  }), Ge = n.createContext(void 0), _e = n.createContext(void 0), je = ["placeholder"], Ke = ["style", "children"], Ye = ["style", "children"], Ze = system(function() {
    var e = statefulStream(function(e2) {
      return "Item " + e2;
    }), n2 = statefulStream(null), o2 = statefulStream(function(e2) {
      return "Group " + e2;
    }), r2 = statefulStream({}), i2 = statefulStream(qe), a3 = statefulStream("div"), l3 = statefulStream(noop4), s2 = function(e2, n3) {
      return void 0 === n3 && (n3 = null), statefulStreamFromEmitter(pipe(r2, map2(function(t) {
        return t[e2];
      }), distinctUntilChanged()), n3);
    };
    return {context:n2, itemContent:e, groupContent:o2, components:r2, computeItemKey:i2, headerFooterTag:a3, scrollerRef:l3, FooterComponent:s2("Footer"), HeaderComponent:s2("Header"), TopItemListComponent:s2("TopItemList"), ListComponent:s2("List", "div"), ItemComponent:s2("Item", "div"), GroupComponent:s2("Group", "div"), ScrollerComponent:s2("Scroller", "div"), EmptyPlaceholder:s2("EmptyPlaceholder"), ScrollSeekPlaceholder:s2("ScrollSeekPlaceholder")};
  }), $e = system(function(e) {
    function i2(e2, n3, r3) {
      connect(pipe(e2, withLatestFrom(o2.components), map2(function(e3) {
        var t, o3 = e3[0];
        e3 = e3[1];
        return console.warn("react-virtuoso: " + r3 + " property is deprecated. Pass components." + n3 + " instead."), c({}, e3, ((t = {})[n3] = o3, t));
      })), o2.components);
    }
    var n2 = e[0], o2 = e[1];
    e = {item:Je(o2.itemContent, "Rename the %citem%c prop to %citemContent."), group:Je(o2.groupContent, "Rename the %cgroup%c prop to %cgroupContent."), topItems:Je(n2.topItemCount, "Rename the %ctopItems%c prop to %ctopItemCount."), itemHeight:Je(n2.fixedItemHeight, "Rename the %citemHeight%c prop to %cfixedItemHeight."), scrollingStateChange:Je(n2.isScrolling, "Rename the %cscrollingStateChange%c prop to %cisScrolling."), adjustForPrependedItems:stream(), maxHeightCacheSize:stream(), footer:stream(), 
    header:stream(), HeaderContainer:stream(), FooterContainer:stream(), ItemContainer:stream(), ScrollContainer:stream(), GroupContainer:stream(), ListContainer:stream(), emptyComponent:stream(), scrollSeek:stream()};
    return subscribe(e.adjustForPrependedItems, function() {
      console.warn("react-virtuoso: adjustForPrependedItems is no longer supported. Use the firstItemIndex property instead - https://virtuoso.dev/prepend-items.", "color: red;", "color: inherit;", "color: blue;");
    }), subscribe(e.maxHeightCacheSize, function() {
      console.warn("react-virtuoso: maxHeightCacheSize is no longer necessary. Setting it has no effect - remove it from your code.");
    }), subscribe(e.HeaderContainer, function() {
      console.warn("react-virtuoso: HeaderContainer is deprecated. Use headerFooterTag if you want to change the wrapper of the header component and pass components.Header to change its contents.");
    }), subscribe(e.FooterContainer, function() {
      console.warn("react-virtuoso: FooterContainer is deprecated. Use headerFooterTag if you want to change the wrapper of the footer component and pass components.Footer to change its contents.");
    }), subscribe(e.scrollSeek, function(e2) {
      var r3 = e2.placeholder;
      e2 = m(e2, je);
      console.warn("react-virtuoso: scrollSeek property is deprecated. Pass scrollSeekConfiguration and specify the placeholder in components.ScrollSeekPlaceholder instead.");
      var publisher = o2.components;
      r3 = c({}, (0,o2.components)(4), {ScrollSeekPlaceholder:r3});
      publisher(0, r3);
      (0,n2.scrollSeekConfiguration)(0, e2);
    }), i2(e.footer, "Footer", "footer"), i2(e.header, "Header", "header"), i2(e.ItemContainer, "Item", "ItemContainer"), i2(e.ListContainer, "List", "ListContainer"), i2(e.ScrollContainer, "Scroller", "ScrollContainer"), i2(e.emptyComponent, "EmptyPlaceholder", "emptyComponent"), i2(e.GroupContainer, "Group", "GroupContainer"), c({}, n2, o2, e);
  }, tup(Ae, Ze)), Qe = function(e) {
    return n.createElement("div", {style:{height:e.height}});
  }, Xe = {position:Ne(), zIndex:1, overflowAnchor:"none"}, et = {overflowAnchor:"none"}, tt = n.memo(function(e) {
    e = e.showTopList;
    e = void 0 !== e && e;
    var i2 = gt("listState"), a3 = ht("sizeRanges"), s2 = gt("useWindowScroll"), u2 = gt("customScrollParent"), m2 = ht("windowScrollContainerState"), d2 = ht("scrollContainerState");
    s2 = u2 || s2 ? m2 : d2;
    var p2 = gt("itemContent"), h2 = gt("context"), g2 = gt("groupContent");
    m2 = gt("trackItemSizes");
    d2 = gt("itemSize");
    var C3 = gt("log"), I2 = ht("gap");
    a3 = T(a3, d2, m2, e ? noop4 : s2, C3, I2, u2).callbackRef;
    u2 = n.useState(0);
    var b3 = u2[0], y2 = u2[1];
    vt("deviation", function(e2) {
      b3 !== e2 && y2(e2);
    });
    u2 = gt("EmptyPlaceholder");
    var E2 = gt("ScrollSeekPlaceholder") || Qe;
    s2 = gt("ListComponent");
    var L3 = gt("ItemComponent"), F2 = gt("GroupComponent"), k2 = gt("computeItemKey"), z2 = gt("isSeeking"), B3 = 0 < gt("groupIndices").length;
    m2 = gt("paddingTopAddition");
    m2 = e ? {} : {boxSizing:"border-box", paddingTop:i2.offsetTop + m2, paddingBottom:i2.offsetBottom, marginTop:b3};
    return !e && 0 === i2.totalCount && u2 ? (0,import_react28.createElement)(u2, it(u2, h2)) : (0,import_react28.createElement)(s2, c({}, it(s2, h2), {ref:a3, style:m2, "data-test-id":e ? "virtuoso-top-item-list" : "virtuoso-item-list"}), (e ? i2.topItems : i2.items).map(function(e2) {
      var t = e2.originalIndex, n2 = k2(t + i2.firstItemIndex, e2.data, h2);
      return z2 ? (0,import_react28.createElement)(E2, c({}, it(E2, h2), {key:n2, index:e2.index, height:e2.size, type:e2.type || "item"}, "group" === e2.type ? {} : {groupIndex:e2.groupIndex})) : "group" === e2.type ? (0,import_react28.createElement)(F2, c({}, it(F2, h2), {key:n2, "data-index":t, "data-known-size":e2.size, "data-item-index":e2.index, style:Xe}), g2(e2.index)) : (0,import_react28.createElement)(L3, c({}, it(L3, h2), {key:n2, "data-index":t, "data-known-size":e2.size, "data-item-index":e2.index, 
      "data-item-group-index":e2.groupIndex, style:et}), B3 ? p2(e2.index, e2.groupIndex, e2.data, h2) : p2(e2.index, e2.data, h2));
    }));
  }), nt = {height:"100%", outline:"none", overflowY:"auto", position:"relative", WebkitOverflowScrolling:"touch"}, ot = {width:"100%", height:"100%", position:"absolute", top:0}, rt = {width:"100%", position:Ne(), top:0}, at = n.memo(function() {
    var e = gt("HeaderComponent"), t = ht("headerHeight"), n2 = gt("headerFooterTag"), o2 = I(function(e2) {
      return t(w(e2, "height"));
    }), r2 = gt("context");
    return e ? (0,import_react28.createElement)(n2, {ref:o2}, (0,import_react28.createElement)(e, it(e, r2))) : null;
  }), lt = n.memo(function() {
    var e = gt("FooterComponent"), t = ht("footerHeight"), n2 = gt("headerFooterTag"), o2 = I(function(e2) {
      return t(w(e2, "height"));
    }), r2 = gt("context");
    return e ? (0,import_react28.createElement)(n2, {ref:o2}, (0,import_react28.createElement)(e, it(e, r2))) : null;
  }), ct = function(e) {
    e = e.children;
    var r2 = (0,import_react28.useContext)(Ge), i2 = ht("viewportHeight"), a3 = ht("fixedItemHeight"), l3 = I(compose(i2, function(e2) {
      return w(e2, "height");
    }));
    return n.useEffect(function() {
      r2 && (i2(r2.viewportHeight), a3(r2.itemHeight));
    }, [r2, i2, a3]), n.createElement("div", {style:ot, ref:l3, "data-viewport-type":"element"}, e);
  }, mt = function(e) {
    e = e.children;
    var o2 = (0,import_react28.useContext)(Ge), r2 = ht("windowViewportRect"), i2 = ht("fixedItemHeight"), a3 = gt("customScrollParent");
    a3 = De(r2, a3);
    return n.useEffect(function() {
      o2 && (i2(o2.itemHeight), r2({offsetTop:0, visibleHeight:o2.viewportHeight, visibleWidth:100}));
    }, [o2, r2, i2]), n.createElement("div", {ref:a3, style:ot, "data-viewport-type":"window"}, e);
  }, dt = function(e) {
    e = e.children;
    var n2 = gt("TopItemListComponent"), o2 = gt("headerHeight");
    o2 = c({}, rt, {marginTop:o2 + "px"});
    var i2 = gt("context");
    return (0,import_react28.createElement)(n2 || "div", {style:o2, context:i2}, e);
  }, ft = systemToComponent($e, {required:{}, optional:{context:"context", followOutput:"followOutput", firstItemIndex:"firstItemIndex", itemContent:"itemContent", groupContent:"groupContent", overscan:"overscan", increaseViewportBy:"increaseViewportBy", totalCount:"totalCount", topItemCount:"topItemCount", initialTopMostItemIndex:"initialTopMostItemIndex", components:"components", groupCounts:"groupCounts", atBottomThreshold:"atBottomThreshold", atTopThreshold:"atTopThreshold", computeItemKey:"computeItemKey", 
  defaultItemHeight:"defaultItemHeight", fixedItemHeight:"fixedItemHeight", itemSize:"itemSize", scrollSeekConfiguration:"scrollSeekConfiguration", headerFooterTag:"headerFooterTag", data:"data", initialItemCount:"initialItemCount", initialScrollTop:"initialScrollTop", alignToBottom:"alignToBottom", useWindowScroll:"useWindowScroll", customScrollParent:"customScrollParent", scrollerRef:"scrollerRef", logLevel:"logLevel", react18ConcurrentRendering:"react18ConcurrentRendering", item:"item", group:"group", 
  topItems:"topItems", itemHeight:"itemHeight", scrollingStateChange:"scrollingStateChange", maxHeightCacheSize:"maxHeightCacheSize", footer:"footer", header:"header", ItemContainer:"ItemContainer", ScrollContainer:"ScrollContainer", ListContainer:"ListContainer", GroupContainer:"GroupContainer", emptyComponent:"emptyComponent", HeaderContainer:"HeaderContainer", FooterContainer:"FooterContainer", scrollSeek:"scrollSeek"}, methods:{scrollToIndex:"scrollToIndex", scrollIntoView:"scrollIntoView", scrollTo:"scrollTo", 
  scrollBy:"scrollBy", adjustForPrependedItems:"adjustForPrependedItems", autoscrollToBottom:"autoscrollToBottom"}, events:{isScrolling:"isScrolling", endReached:"endReached", startReached:"startReached", rangeChanged:"rangeChanged", atBottomStateChange:"atBottomStateChange", atTopStateChange:"atTopStateChange", totalListHeightChanged:"totalListHeightChanged", itemsRendered:"itemsRendered", groupIndices:"groupIndices"}}, n.memo(function(e) {
    var t = gt("useWindowScroll"), o2 = 0 < gt("topItemsIndexes").length, r2 = gt("customScrollParent"), i2 = r2 || t ? mt : ct;
    return n.createElement(r2 || t ? Ct : St, c({}, e), n.createElement(i2, null, n.createElement(at, null), n.createElement(tt, null), n.createElement(lt, null)), o2 && n.createElement(dt, null, n.createElement(tt, {showTopList:!0})));
  })), pt = ft.Component, ht = ft.usePublisher, gt = ft.useEmitterValue, vt = ft.useEmitter, St = st({usePublisher:ht, useEmitterValue:gt, useEmitter:vt}), Ct = ut({usePublisher:ht, useEmitterValue:gt, useEmitter:vt}), It = {items:[], offsetBottom:0, offsetTop:0, top:0, bottom:0, itemHeight:0, itemWidth:0}, Tt = {items:[{index:0}], offsetBottom:0, offsetTop:0, top:0, bottom:0, itemHeight:0, itemWidth:0}, wt = Math.round, xt = Math.ceil, bt = Math.floor, yt = Math.min, Ht = Math.max, Lt = system(function(e) {
    var n2 = e[0], o2 = n2.overscan, r2 = n2.visibleRange, i2 = n2.listBoundary, a3 = e[1];
    n2 = a3.scrollTop;
    var s2 = a3.viewportHeight, u2 = a3.scrollBy, m2 = a3.scrollTo, d2 = a3.smoothScrollTargetReached, f2 = a3.scrollContainerState, p2 = a3.footerHeight;
    a3 = a3.headerHeight;
    var g2 = e[2], v2 = e[3], S2 = e[4], C3 = S2.propsReady, I2 = S2.didMount, T2 = e[5];
    S2 = T2.windowViewportRect;
    var x2 = T2.windowScrollTo, b3 = T2.useWindowScroll, y2 = T2.customScrollParent;
    T2 = T2.windowScrollContainerState;
    e = e[6];
    var R3 = statefulStream(0), L3 = statefulStream(0), F2 = statefulStream(It), k2 = statefulStream({height:0, width:0}), z2 = statefulStream({height:0, width:0}), B3 = stream(), P2 = stream(), O2 = statefulStream(0), M2 = statefulStream(void 0), W2 = statefulStream({row:0, column:0});
    connect(pipe(combineLatest(I2, L3, M2), filter(function(e2) {
      return 0 !== e2[1];
    }), map2(function(e2) {
      return {items:Et(0, e2[1] - 1, e2[2]), top:0, bottom:0, offsetBottom:0, offsetTop:0, itemHeight:0, itemWidth:0};
    })), F2);
    connect(pipe(combineLatest(duc(R3), r2, duc(W2, Rt), duc(z2, function(e2, t) {
      return e2 && e2.width === t.width && e2.height === t.height;
    }), M2), withLatestFrom(k2), map2(function(e2) {
      var t = e2[0], n3 = t[0], o3 = t[1], r3 = o3[0], i3 = o3[1], a4 = t[2], l4 = t[3], s3 = t[4], u3 = e2[1];
      e2 = a4.row;
      var d3 = a4.column;
      t = l4.height;
      o3 = l4.width;
      var h3 = u3.width;
      if (0 === n3 || 0 === h3) {
        return It;
      }
      if (0 === o3) {
        return c({}, Tt, {items:Et(0, 0, s3)});
      }
      d3 = Ht(1, bt((h3 + d3) / (o3 + d3)));
      r3 = d3 * bt((r3 + e2) / (t + e2));
      i3 = d3 * xt((i3 + e2) / (t + e2)) - 1;
      i3 = yt(n3 - 1, Ht(i3, d3 - 1));
      r3 = Et(yt(i3, Ht(0, r3)), i3, s3);
      l4 = Ft(u3, a4, l4, r3);
      a4 = l4.top;
      l4 = l4.bottom;
      n3 = xt(n3 / d3);
      return {items:r3, offsetTop:a4, offsetBottom:n3 * t + (n3 - 1) * e2 - l4, top:a4, bottom:l4, itemHeight:t, itemWidth:o3};
    })), F2);
    connect(pipe(M2, filter(function(e2) {
      return void 0 !== e2;
    }), map2(function(e2) {
      return e2.length;
    })), R3);
    connect(pipe(k2, map2(function(e2) {
      return e2.height;
    })), s2);
    connect(pipe(combineLatest(k2, z2, F2, W2), map2(function(e2) {
      e2 = Ft(e2[0], e2[3], e2[1], e2[2].items);
      return [e2.top, e2.bottom];
    }), distinctUntilChanged(ve)), i2);
    r2 = streamFromEmitter(pipe(duc(F2), filter(function(e2) {
      return 0 < e2.items.length;
    }), withLatestFrom(R3), filter(function(e2) {
      var t = e2[0].items;
      return t[t.length - 1].index === e2[1] - 1;
    }), map2(function(e2) {
      return e2[1] - 1;
    }), distinctUntilChanged()));
    i2 = streamFromEmitter(pipe(duc(F2), filter(function(e2) {
      e2 = e2.items;
      return 0 < e2.length && 0 === e2[0].index;
    }), mapTo(0), distinctUntilChanged()));
    s2 = streamFromEmitter(pipe(duc(F2), filter(function(e2) {
      return 0 < e2.items.length;
    }), map2(function(e2) {
      e2 = e2.items;
      return {startIndex:e2[0].index, endIndex:e2[e2.length - 1].index};
    }), distinctUntilChanged(Se)));
    connect(s2, v2.scrollSeekRangeChanged);
    connect(pipe(B3, withLatestFrom(k2, z2, R3, W2), map2(function(e2) {
      var t = e2[1], n3 = e2[2], o3 = e2[3], r3 = e2[4], i3 = ae(e2[0]);
      e2 = i3.align;
      var l4 = i3.behavior, s3 = i3.offset;
      i3 = i3.index;
      "LAST" === i3 && (i3 = o3 - 1);
      o3 = kt(t, r3, n3, Ht(0, i3, yt(o3 - 1, i3)));
      return "end" === e2 ? o3 = wt(o3 - t.height + n3.height) : "center" === e2 && (o3 = wt(o3 - t.height / 2 + n3.height / 2)), s3 && (o3 += s3), {top:o3, behavior:l4};
    })), m2);
    I2 = statefulStreamFromEmitter(pipe(F2, map2(function(e2) {
      return e2.offsetBottom + e2.bottom;
    })), 0);
    return connect(pipe(S2, map2(function(e2) {
      return {width:e2.visibleWidth, height:e2.visibleHeight};
    })), k2), c({data:M2, totalCount:R3, viewportDimensions:k2, itemDimensions:z2, scrollTop:n2, scrollHeight:P2, overscan:o2, scrollBy:u2, scrollTo:m2, scrollToIndex:B3, smoothScrollTargetReached:d2, windowViewportRect:S2, windowScrollTo:x2, useWindowScroll:b3, customScrollParent:y2, windowScrollContainerState:T2, deviation:O2, scrollContainerState:f2, footerHeight:p2, headerHeight:a3, initialItemCount:L3, gap:W2}, v2, {gridState:F2, totalListHeight:I2}, g2, {startReached:i2, endReached:r2, rangeChanged:s2, 
    propsReady:C3}, e);
  }, tup(Te, y, ce, Ee, me, Oe, S)), Bt = ["placeholder"], Pt = system(function() {
    var e = statefulStream(function(e2) {
      return "Item " + e2;
    }), n2 = statefulStream({}), o2 = statefulStream(null), r2 = statefulStream("virtuoso-grid-item"), i2 = statefulStream("virtuoso-grid-list"), a3 = statefulStream(qe), l3 = statefulStream("div"), s2 = statefulStream(noop4), u2 = function(e2, o3) {
      return void 0 === o3 && (o3 = null), statefulStreamFromEmitter(pipe(n2, map2(function(t) {
        return t[e2];
      }), distinctUntilChanged()), o3);
    };
    return {context:o2, itemContent:e, components:n2, computeItemKey:a3, itemClassName:r2, listClassName:i2, headerFooterTag:l3, scrollerRef:s2, FooterComponent:u2("Footer"), HeaderComponent:u2("Header"), ListComponent:u2("List", "div"), ItemComponent:u2("Item", "div"), ScrollerComponent:u2("Scroller", "div"), ScrollSeekPlaceholder:u2("ScrollSeekPlaceholder", "div")};
  }), Ot = system(function(e) {
    function i2(e2, n3, r3) {
      connect(pipe(e2, withLatestFrom(o2.components), map2(function(e3) {
        var t, o3 = e3[0];
        e3 = e3[1];
        return console.warn("react-virtuoso: " + r3 + " property is deprecated. Pass components." + n3 + " instead."), c({}, e3, ((t = {})[n3] = o3, t));
      })), o2.components);
    }
    var n2 = e[0], o2 = e[1];
    e = {item:Je(o2.itemContent, "Rename the %citem%c prop to %citemContent."), ItemContainer:stream(), ScrollContainer:stream(), ListContainer:stream(), emptyComponent:stream(), scrollSeek:stream()};
    return subscribe(e.scrollSeek, function(e2) {
      var r3 = e2.placeholder;
      e2 = m(e2, Bt);
      console.warn("react-virtuoso: scrollSeek property is deprecated. Pass scrollSeekConfiguration and specify the placeholder in components.ScrollSeekPlaceholder instead.");
      var publisher = o2.components;
      r3 = c({}, (0,o2.components)(4), {ScrollSeekPlaceholder:r3});
      publisher(0, r3);
      (0,n2.scrollSeekConfiguration)(0, e2);
    }), i2(e.ItemContainer, "Item", "ItemContainer"), i2(e.ListContainer, "List", "ListContainer"), i2(e.ScrollContainer, "Scroller", "ScrollContainer"), c({}, n2, o2, e);
  }, tup(Lt, Pt)), Mt = n.memo(function() {
    var e = _t("gridState"), t = _t("listClassName"), n2 = _t("itemClassName"), o2 = _t("itemContent"), r2 = _t("computeItemKey"), i2 = _t("isSeeking"), a3 = Gt("scrollHeight"), s2 = _t("ItemComponent"), u2 = _t("ListComponent"), m2 = _t("ScrollSeekPlaceholder"), d2 = _t("context"), f2 = Gt("itemDimensions"), p2 = Gt("gap"), h2 = _t("log"), g2 = I(function(e2) {
      a3(e2.parentElement.parentElement.scrollHeight);
      var t2 = e2.firstChild;
      t2 && f2(t2.getBoundingClientRect());
      p2({row:qt("row-gap", getComputedStyle(e2).rowGap, h2), column:qt("column-gap", getComputedStyle(e2).columnGap, h2)});
    });
    return (0,import_react28.createElement)(u2, c({ref:g2, className:t}, it(u2, d2), {style:{paddingTop:e.offsetTop, paddingBottom:e.offsetBottom}}), e.items.map(function(t2) {
      var a4 = r2(t2.index, t2.data, d2);
      return i2 ? (0,import_react28.createElement)(m2, c({key:a4}, it(m2, d2), {index:t2.index, height:e.itemHeight, width:e.itemWidth})) : (0,import_react28.createElement)(s2, c({}, it(s2, d2), {className:n2, "data-index":t2.index, key:a4}), o2(t2.index, t2.data, d2));
    }));
  }), Wt = n.memo(function() {
    var e = _t("HeaderComponent"), t = Gt("headerHeight"), n2 = _t("headerFooterTag"), o2 = I(function(e2) {
      return t(w(e2, "height"));
    }), r2 = _t("context");
    return e ? (0,import_react28.createElement)(n2, {ref:o2}, (0,import_react28.createElement)(e, it(e, r2))) : null;
  }), Vt = n.memo(function() {
    var e = _t("FooterComponent"), t = Gt("footerHeight"), n2 = _t("headerFooterTag"), o2 = I(function(e2) {
      return t(w(e2, "height"));
    }), r2 = _t("context");
    return e ? (0,import_react28.createElement)(n2, {ref:o2}, (0,import_react28.createElement)(e, it(e, r2))) : null;
  }), Ut = function(e) {
    e = e.children;
    var o2 = (0,import_react28.useContext)(_e), r2 = Gt("itemDimensions"), i2 = Gt("viewportDimensions"), a3 = I(function(e2) {
      i2(e2.getBoundingClientRect());
    });
    return n.useEffect(function() {
      o2 && (i2({height:o2.viewportHeight, width:o2.viewportWidth}), r2({height:o2.itemHeight, width:o2.itemWidth}));
    }, [o2, i2, r2]), n.createElement("div", {style:ot, ref:a3}, e);
  }, At = function(e) {
    e = e.children;
    var o2 = (0,import_react28.useContext)(_e), r2 = Gt("windowViewportRect"), i2 = Gt("itemDimensions"), a3 = _t("customScrollParent");
    a3 = De(r2, a3);
    return n.useEffect(function() {
      o2 && (i2({height:o2.itemHeight, width:o2.itemWidth}), r2({offsetTop:0, visibleHeight:o2.viewportHeight, visibleWidth:o2.viewportWidth}));
    }, [o2, r2, i2]), n.createElement("div", {ref:a3, style:ot}, e);
  }, Nt = systemToComponent(Ot, {optional:{context:"context", totalCount:"totalCount", overscan:"overscan", itemContent:"itemContent", components:"components", computeItemKey:"computeItemKey", data:"data", initialItemCount:"initialItemCount", scrollSeekConfiguration:"scrollSeekConfiguration", headerFooterTag:"headerFooterTag", listClassName:"listClassName", itemClassName:"itemClassName", useWindowScroll:"useWindowScroll", customScrollParent:"customScrollParent", scrollerRef:"scrollerRef", item:"item", 
  ItemContainer:"ItemContainer", ScrollContainer:"ScrollContainer", ListContainer:"ListContainer", scrollSeek:"scrollSeek"}, methods:{scrollTo:"scrollTo", scrollBy:"scrollBy", scrollToIndex:"scrollToIndex"}, events:{isScrolling:"isScrolling", endReached:"endReached", startReached:"startReached", rangeChanged:"rangeChanged", atBottomStateChange:"atBottomStateChange", atTopStateChange:"atTopStateChange"}}, n.memo(function(e) {
    e = c({}, e);
    var o2 = _t("useWindowScroll"), r2 = _t("customScrollParent"), i2 = r2 || o2 ? At : Ut;
    return n.createElement(r2 || o2 ? Yt : Kt, c({}, e), n.createElement(i2, null, n.createElement(Wt, null), n.createElement(Mt, null), n.createElement(Vt, null)));
  })), Gt = Nt.usePublisher, _t = Nt.useEmitterValue, jt = Nt.useEmitter, Kt = st({usePublisher:Gt, useEmitterValue:_t, useEmitter:jt}), Yt = ut({usePublisher:Gt, useEmitterValue:_t, useEmitter:jt}), Zt = system(function() {
    var e = statefulStream(function(e2) {
      return n.createElement("td", null, "Item $", e2);
    }), o2 = statefulStream(null), r2 = statefulStream(null), i2 = statefulStream(null), a3 = statefulStream({}), l3 = statefulStream(qe), s2 = statefulStream(noop4), u2 = function(e2, n2) {
      return void 0 === n2 && (n2 = null), statefulStreamFromEmitter(pipe(a3, map2(function(t) {
        return t[e2];
      }), distinctUntilChanged()), n2);
    };
    return {context:o2, itemContent:e, fixedHeaderContent:r2, fixedFooterContent:i2, components:a3, computeItemKey:l3, scrollerRef:s2, TableComponent:u2("Table", "table"), TableHeadComponent:u2("TableHead", "thead"), TableFooterComponent:u2("TableFoot", "tfoot"), TableBodyComponent:u2("TableBody", "tbody"), TableRowComponent:u2("TableRow", "tr"), ScrollerComponent:u2("Scroller", "div"), EmptyPlaceholder:u2("EmptyPlaceholder"), ScrollSeekPlaceholder:u2("ScrollSeekPlaceholder"), FillerRow:u2("FillerRow")};
  }), Jt = system(function(e) {
    return c({}, e[0], e[1]);
  }, tup(Ae, Zt)), $t = function(e) {
    return n.createElement("tr", null, n.createElement("td", {style:{height:e.height}}));
  }, Qt = function(e) {
    return n.createElement("tr", null, n.createElement("td", {style:{height:e.height, padding:0, border:0}}));
  }, Xt = n.memo(function() {
    var e = an("listState"), t = rn("sizeRanges"), o2 = an("useWindowScroll"), r2 = an("customScrollParent"), i2 = rn("windowScrollContainerState"), a3 = rn("scrollContainerState");
    o2 = r2 || o2 ? i2 : a3;
    var u2 = an("itemContent");
    i2 = an("trackItemSizes");
    r2 = T(t, an("itemSize"), i2, o2, an("log"), void 0, r2);
    t = r2.callbackRef;
    var p2 = r2.ref;
    r2 = n.useState(0);
    var g2 = r2[0], v2 = r2[1];
    ln("deviation", function(e2) {
      g2 !== e2 && (p2.current.style.marginTop = e2 + "px", v2(e2));
    });
    i2 = an("EmptyPlaceholder");
    var C3 = an("ScrollSeekPlaceholder") || $t;
    o2 = an("FillerRow") || Qt;
    r2 = an("TableBodyComponent");
    var x2 = an("TableRowComponent"), b3 = an("computeItemKey"), y2 = an("isSeeking");
    a3 = an("paddingTopAddition");
    var E2 = an("firstItemIndex"), R3 = an("statefulTotalCount"), L3 = an("context");
    if (0 === R3 && i2) {
      return (0,import_react28.createElement)(i2, it(i2, L3));
    }
    i2 = e.offsetTop + a3 + g2;
    a3 = e.offsetBottom;
    i2 = 0 < i2 ? n.createElement(o2, {height:i2, key:"padding-top"}) : null;
    o2 = 0 < a3 ? n.createElement(o2, {height:a3, key:"padding-bottom"}) : null;
    e = e.items.map(function(e2) {
      var t2 = e2.originalIndex, n2 = b3(t2 + E2, e2.data, L3);
      return y2 ? (0,import_react28.createElement)(C3, c({}, it(C3, L3), {key:n2, index:e2.index, height:e2.size, type:e2.type || "item"})) : (0,import_react28.createElement)(x2, c({}, it(x2, L3), {key:n2, "data-index":t2, "data-known-size":e2.size, "data-item-index":e2.index, style:{overflowAnchor:"none"}}), u2(e2.index, e2.data, L3));
    });
    return (0,import_react28.createElement)(r2, c({ref:t, "data-test-id":"virtuoso-item-list"}, it(r2, L3)), [i2].concat(e, [o2]));
  }), en = function(e) {
    e = e.children;
    var r2 = (0,import_react28.useContext)(Ge), i2 = rn("viewportHeight"), a3 = rn("fixedItemHeight"), l3 = I(compose(i2, function(e2) {
      return w(e2, "height");
    }));
    return n.useEffect(function() {
      r2 && (i2(r2.viewportHeight), a3(r2.itemHeight));
    }, [r2, i2, a3]), n.createElement("div", {style:ot, ref:l3, "data-viewport-type":"element"}, e);
  }, tn = function(e) {
    e = e.children;
    var o2 = (0,import_react28.useContext)(Ge), r2 = rn("windowViewportRect"), i2 = rn("fixedItemHeight"), a3 = an("customScrollParent");
    a3 = De(r2, a3);
    return n.useEffect(function() {
      o2 && (i2(o2.itemHeight), r2({offsetTop:0, visibleHeight:o2.viewportHeight, visibleWidth:100}));
    }, [o2, r2, i2]), n.createElement("div", {ref:a3, style:ot, "data-viewport-type":"window"}, e);
  }, nn = systemToComponent(Jt, {required:{}, optional:{context:"context", followOutput:"followOutput", firstItemIndex:"firstItemIndex", itemContent:"itemContent", fixedHeaderContent:"fixedHeaderContent", fixedFooterContent:"fixedFooterContent", overscan:"overscan", increaseViewportBy:"increaseViewportBy", totalCount:"totalCount", topItemCount:"topItemCount", initialTopMostItemIndex:"initialTopMostItemIndex", components:"components", groupCounts:"groupCounts", atBottomThreshold:"atBottomThreshold", 
  atTopThreshold:"atTopThreshold", computeItemKey:"computeItemKey", defaultItemHeight:"defaultItemHeight", fixedItemHeight:"fixedItemHeight", itemSize:"itemSize", scrollSeekConfiguration:"scrollSeekConfiguration", data:"data", initialItemCount:"initialItemCount", initialScrollTop:"initialScrollTop", alignToBottom:"alignToBottom", useWindowScroll:"useWindowScroll", customScrollParent:"customScrollParent", scrollerRef:"scrollerRef", logLevel:"logLevel", react18ConcurrentRendering:"react18ConcurrentRendering"}, 
  methods:{scrollToIndex:"scrollToIndex", scrollIntoView:"scrollIntoView", scrollTo:"scrollTo", scrollBy:"scrollBy"}, events:{isScrolling:"isScrolling", endReached:"endReached", startReached:"startReached", rangeChanged:"rangeChanged", atBottomStateChange:"atBottomStateChange", atTopStateChange:"atTopStateChange", totalListHeightChanged:"totalListHeightChanged", itemsRendered:"itemsRendered", groupIndices:"groupIndices"}}, n.memo(function(e) {
    var o2 = an("useWindowScroll"), r2 = an("customScrollParent"), i2 = rn("fixedHeaderHeight"), a3 = rn("fixedFooterHeight"), l3 = an("fixedHeaderContent"), s2 = an("fixedFooterContent"), u2 = an("context");
    i2 = I(compose(i2, function(e2) {
      return w(e2, "height");
    }));
    var d2 = I(compose(a3, function(e2) {
      return w(e2, "height");
    }));
    a3 = r2 || o2 ? un : sn;
    o2 = r2 || o2 ? tn : en;
    r2 = an("TableComponent");
    var g2 = an("TableHeadComponent"), v2 = an("TableFooterComponent");
    l3 = l3 ? n.createElement(g2, c({key:"TableHead", style:{zIndex:1, position:"sticky", top:0}, ref:i2}, it(g2, u2)), l3()) : null;
    s2 = s2 ? n.createElement(v2, c({key:"TableFoot", style:{zIndex:1, position:"sticky", bottom:0}, ref:d2}, it(v2, u2)), s2()) : null;
    return n.createElement(a3, c({}, e), n.createElement(o2, null, n.createElement(r2, c({style:{borderSpacing:0}}, it(r2, u2)), [l3, n.createElement(Xt, {key:"TableBody"}), s2])));
  })), rn = nn.usePublisher, an = nn.useEmitterValue, ln = nn.useEmitter, sn = st({usePublisher:rn, useEmitterValue:an, useEmitter:ln}), un = ut({usePublisher:rn, useEmitterValue:an, useEmitter:ln}), React45 = __toESM(require("module$react")), PolishedError = function(_Error) {
    function PolishedError2(code) {
      code = _Error.call(this, "An error occurred. See https://github.com/styled-components/polished/blob/main/src/internalHelpers/errors.md#" + code + " for more information.") || this;
      if (void 0 === code) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }
      return code;
    }
    _inheritsLoose2(PolishedError2, _Error);
    return PolishedError2;
  }(_wrapNativeSuper(Error)), namedColorMap = {aliceblue:"f0f8ff", antiquewhite:"faebd7", aqua:"00ffff", aquamarine:"7fffd4", azure:"f0ffff", beige:"f5f5dc", bisque:"ffe4c4", black:"000", blanchedalmond:"ffebcd", blue:"0000ff", blueviolet:"8a2be2", brown:"a52a2a", burlywood:"deb887", cadetblue:"5f9ea0", chartreuse:"7fff00", chocolate:"d2691e", coral:"ff7f50", cornflowerblue:"6495ed", cornsilk:"fff8dc", crimson:"dc143c", cyan:"00ffff", darkblue:"00008b", darkcyan:"008b8b", darkgoldenrod:"b8860b", 
  darkgray:"a9a9a9", darkgreen:"006400", darkgrey:"a9a9a9", darkkhaki:"bdb76b", darkmagenta:"8b008b", darkolivegreen:"556b2f", darkorange:"ff8c00", darkorchid:"9932cc", darkred:"8b0000", darksalmon:"e9967a", darkseagreen:"8fbc8f", darkslateblue:"483d8b", darkslategray:"2f4f4f", darkslategrey:"2f4f4f", darkturquoise:"00ced1", darkviolet:"9400d3", deeppink:"ff1493", deepskyblue:"00bfff", dimgray:"696969", dimgrey:"696969", dodgerblue:"1e90ff", firebrick:"b22222", floralwhite:"fffaf0", forestgreen:"228b22", 
  fuchsia:"ff00ff", gainsboro:"dcdcdc", ghostwhite:"f8f8ff", gold:"ffd700", goldenrod:"daa520", gray:"808080", green:"008000", greenyellow:"adff2f", grey:"808080", honeydew:"f0fff0", hotpink:"ff69b4", indianred:"cd5c5c", indigo:"4b0082", ivory:"fffff0", khaki:"f0e68c", lavender:"e6e6fa", lavenderblush:"fff0f5", lawngreen:"7cfc00", lemonchiffon:"fffacd", lightblue:"add8e6", lightcoral:"f08080", lightcyan:"e0ffff", lightgoldenrodyellow:"fafad2", lightgray:"d3d3d3", lightgreen:"90ee90", lightgrey:"d3d3d3", 
  lightpink:"ffb6c1", lightsalmon:"ffa07a", lightseagreen:"20b2aa", lightskyblue:"87cefa", lightslategray:"789", lightslategrey:"789", lightsteelblue:"b0c4de", lightyellow:"ffffe0", lime:"0f0", limegreen:"32cd32", linen:"faf0e6", magenta:"f0f", maroon:"800000", mediumaquamarine:"66cdaa", mediumblue:"0000cd", mediumorchid:"ba55d3", mediumpurple:"9370db", mediumseagreen:"3cb371", mediumslateblue:"7b68ee", mediumspringgreen:"00fa9a", mediumturquoise:"48d1cc", mediumvioletred:"c71585", midnightblue:"191970", 
  mintcream:"f5fffa", mistyrose:"ffe4e1", moccasin:"ffe4b5", navajowhite:"ffdead", navy:"000080", oldlace:"fdf5e6", olive:"808000", olivedrab:"6b8e23", orange:"ffa500", orangered:"ff4500", orchid:"da70d6", palegoldenrod:"eee8aa", palegreen:"98fb98", paleturquoise:"afeeee", palevioletred:"db7093", papayawhip:"ffefd5", peachpuff:"ffdab9", peru:"cd853f", pink:"ffc0cb", plum:"dda0dd", powderblue:"b0e0e6", purple:"800080", rebeccapurple:"639", red:"f00", rosybrown:"bc8f8f", royalblue:"4169e1", saddlebrown:"8b4513", 
  salmon:"fa8072", sandybrown:"f4a460", seagreen:"2e8b57", seashell:"fff5ee", sienna:"a0522d", silver:"c0c0c0", skyblue:"87ceeb", slateblue:"6a5acd", slategray:"708090", slategrey:"708090", snow:"fffafa", springgreen:"00ff7f", steelblue:"4682b4", tan:"d2b48c", teal:"008080", thistle:"d8bfd8", tomato:"ff6347", turquoise:"40e0d0", violet:"ee82ee", wheat:"f5deb3", white:"fff", whitesmoke:"f5f5f5", yellow:"ff0", yellowgreen:"9acd32"}, hexRegex = /^#[a-fA-F0-9]{6}$/, hexRgbaRegex = /^#[a-fA-F0-9]{8}$/, 
  reducedHexRegex = /^#[a-fA-F0-9]{3}$/, reducedRgbaHexRegex = /^#[a-fA-F0-9]{4}$/, rgbRegex = /^rgb\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*\)$/i, rgbaRegex = /^rgb(?:a)?\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i, hslRegex = /^hsl\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*\)$/i, hslaRegex = /^hsl(?:a)?\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i, 
  reduceHexValue$1 = function(value) {
    return 7 === value.length && value[1] === value[2] && value[3] === value[4] && value[5] === value[6] ? "#" + value[1] + value[3] + value[5] : value;
  }, curriedDarken$1 = curried(darken, darken.length, []), import_jsx_runtime51 = require("module$node_modules$react$jsx_runtime"), React44 = __toESM(require("module$react")), TextAreaUtils = class {
    static insertTextFirefox(field, text) {
      field.setRangeText(text, field.selectionStart || 0, field.selectionEnd || 0, "end");
      field.dispatchEvent(new InputEvent("input", {data:text, inputType:"insertText", isComposing:!1}));
    }
    static insert(field, text) {
      const document2 = field.ownerDocument, initialFocus = document2.activeElement;
      initialFocus !== field && field.focus();
      document2.execCommand("insertText", !1, text) || TextAreaUtils.insertTextFirefox(field, text);
      initialFocus === document2.body ? field.blur() : initialFocus instanceof HTMLElement && initialFocus !== field && initialFocus.focus();
    }
    static set(field, text) {
      field.select();
      TextAreaUtils.insert(field, text);
    }
    static getSelection(field) {
      const {selectionStart, selectionEnd} = field;
      return field.value.slice(selectionStart ? selectionStart : void 0, selectionEnd ? selectionEnd : void 0);
    }
    static wrapSelection(field, wrap, wrapEnd) {
      const {selectionStart, selectionEnd} = field, selection = TextAreaUtils.getSelection(field);
      TextAreaUtils.insert(field, wrap + selection + (null != wrapEnd ? wrapEnd : wrap));
      field.selectionStart = (selectionStart || 0) + wrap.length;
      field.selectionEnd = (selectionEnd || 0) + wrap.length;
    }
    static replace(field, searchValue, replacer) {
      let drift = 0;
      field.value.replace(searchValue, (...args) => {
        const matchStart = drift + args[args.length - 2], matchLength = args[0].length;
        field.selectionStart = matchStart;
        field.selectionEnd = matchStart + matchLength;
        args = "string" === typeof replacer ? replacer : replacer(...args);
        TextAreaUtils.insert(field, args);
        field.selectionStart = matchStart;
        drift += args.length - matchLength;
        return args;
      });
    }
    static findLineEnd(value, currentEnd) {
      const lastLineStart = value.lastIndexOf("\n", currentEnd - 1) + 1;
      return "\t" !== value.charAt(lastLineStart) ? currentEnd : lastLineStart + 1;
    }
    static indent(element) {
      var _a3;
      const {selectionStart, selectionEnd, value} = element;
      var selectedContrast = value.slice(selectionStart, selectionEnd);
      if ((selectedContrast = null == (_a3 = /\n/g.exec(selectedContrast)) ? void 0 : _a3.length) && 0 < selectedContrast) {
        _a3 = value.lastIndexOf("\n", selectionStart - 1) + 1;
        var newSelection = element.value.slice(_a3, selectionEnd - 1);
        selectedContrast = newSelection.replace(/^|\n/g, "$\x26  ");
        newSelection = selectedContrast.length - newSelection.length;
        element.setSelectionRange(_a3, selectionEnd - 1);
        TextAreaUtils.insert(element, selectedContrast);
        element.setSelectionRange(selectionStart + 1, selectionEnd + newSelection);
      } else {
        TextAreaUtils.insert(element, "  ");
      }
    }
    static unindent(element) {
      const {selectionStart, selectionEnd, value} = element;
      var firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const minimumSelectionEnd = TextAreaUtils.findLineEnd(value, selectionEnd);
      var newSelection = element.value.slice(firstLineStart, minimumSelectionEnd);
      const indentedText = newSelection.replace(/(^|\n)(\t| {1,2})/g, "$1");
      newSelection = newSelection.length - indentedText.length;
      element.setSelectionRange(firstLineStart, minimumSelectionEnd);
      TextAreaUtils.insert(element, indentedText);
      firstLineStart = (firstLineStart = /\t| {1,2}/.exec(value.slice(firstLineStart, selectionStart))) ? firstLineStart[0].length : 0;
      element.setSelectionRange(selectionStart - firstLineStart, Math.max(selectionStart - firstLineStart, selectionEnd - newSelection));
    }
  }, import_jsx_runtime52 = require("module$node_modules$react$jsx_runtime"), stopPropagation = e => e.stopPropagation(), TextLabel = React44.memo(function({font:font5, text, color, fontStyle, fontSize, fontWeight, offsetX = 0, offsetY = 0, scale = 1, isEditing = !1, pointerEvents = !1, onBlur, onChange}) {
    const rInput = React44.useRef(null), rIsMounted = React44.useRef(!1), handleChange = React44.useCallback(e => {
      onChange(TextUtils.normalizeText(e.currentTarget.value));
    }, [onChange]), handleKeyDown = React44.useCallback(e => {
      if ("Escape" !== e.key) {
        if ("Tab" === e.key && 0 === text.length) {
          e.preventDefault();
        } else {
          if ("Meta" !== e.key && !e.metaKey) {
            e.stopPropagation();
          } else if ("z" === e.key && e.metaKey) {
            document.execCommand(e.shiftKey ? "redo" : "undo", !1);
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          "Tab" === e.key && (e.preventDefault(), e.shiftKey ? TextAreaUtils.unindent(e.currentTarget) : TextAreaUtils.indent(e.currentTarget), null == onChange || onChange(TextUtils.normalizeText(e.currentTarget.value)));
        }
      }
    }, [onChange]), handleBlur = React44.useCallback(e => {
      isEditing && (e.currentTarget.setSelectionRange(0, 0), null == onBlur || onBlur());
    }, [onBlur]), handleFocus = React44.useCallback(e => {
      isEditing && rIsMounted.current && document.activeElement === e.currentTarget && e.currentTarget.select();
    }, [isEditing]), handlePointerDown = React44.useCallback(e => {
      isEditing && e.stopPropagation();
    }, [isEditing]);
    React44.useEffect(() => {
      isEditing && requestAnimationFrame(() => {
        rIsMounted.current = !0;
        const elm = rInput.current;
        elm && (elm.focus(), elm.select());
      });
    }, [isEditing, onBlur]);
    const rInnerWrapper = React44.useRef(null);
    React44.useLayoutEffect(() => {
      const elm = rInnerWrapper.current;
      if (elm) {
        var size = getTextLabelSize(text || "Enter text", {fontFamily:"var(--ls-font-family)", fontSize, lineHeight:1, fontWeight}, 4);
        elm.style.transform = `scale(${scale}, ${scale}) translate(${offsetX}px, ${offsetY}px)`;
        elm.style.width = size[0] + 1 + "px";
        elm.style.height = size[1] + 1 + "px";
      }
    }, [text, fontWeight, fontSize, offsetY, offsetX, scale]);
    return (0,import_jsx_runtime52.jsx)("div", {className:"tl-text-label-wrapper", children:(0,import_jsx_runtime52.jsxs)("div", {className:"tl-text-label-inner-wrapper", ref:rInnerWrapper, style:{font:font5, fontStyle, fontSize, fontWeight, color, pointerEvents:pointerEvents ? "all" : "none", userSelect:isEditing ? "text" : "none"}, children:[isEditing ? (0,import_jsx_runtime52.jsx)("textarea", {ref:rInput, style:{font:font5, color, fontStyle, fontSize, fontWeight}, className:"tl-text-label-textarea", 
    name:"text", tabIndex:-1, autoComplete:"false", autoCapitalize:"false", autoCorrect:"false", autoSave:"false", autoFocus:!0, placeholder:"Enter text", spellCheck:"true", wrap:"off", dir:"auto", datatype:"wysiwyg", defaultValue:text, color, onFocus:handleFocus, onChange:handleChange, onKeyDown:handleKeyDown, onBlur:handleBlur, onPointerDown:handlePointerDown, onContextMenu:stopPropagation, onCopy:stopPropagation, onPaste:stopPropagation, onCut:stopPropagation}) : text, "​"]})});
  }), import_jsx_runtime53 = require("module$node_modules$react$jsx_runtime"), levelToScale = {xs:10, sm:16, md:20, lg:32, xl:48, xxl:60}, BoxShape = class extends TLBoxShape {
    constructor() {
      super(...arguments);
      __publicField(this, "canEdit", !0);
      __publicField(this, "ReactComponent", observer(({events, isErasing, isBinding, isSelected, isEditing, onEditingEnd}) => {
        const {props:{size:[w2, h2], stroke, fill, noFill, strokeWidth, strokeType, borderRadius, opacity, label, italic, fontWeight, fontSize}} = this;
        var labelSize = label || isEditing ? getTextLabelSize(label, {fontFamily:"var(--ls-font-family)", fontSize, lineHeight:1, fontWeight}, 4) : [0, 0];
        const midPoint = src_default.mul(this.props.size, 0.5);
        labelSize = Math.max(0.5, Math.min(1, w2 / labelSize[0], h2 / labelSize[1]));
        const bounds = this.getBounds(), offset = React45.useMemo(() => src_default.sub(midPoint, src_default.toFixed([bounds.width / 2, bounds.height / 2])), [bounds, labelSize, midPoint]), handleLabelChange = React45.useCallback(label2 => {
          var _a3;
          null == (_a3 = this.update) || _a3.call(this, {label:label2});
        }, [label]);
        return (0,import_jsx_runtime53.jsxs)("div", __spreadProps(__spreadValues({}, events), {style:{width:"100%", height:"100%", overflow:"hidden"}, className:"tl-box-container", children:[(0,import_jsx_runtime53.jsx)(TextLabel, {font:"20px / 1 var(--ls-font-family)", text:label, color:getComputedColor(stroke, "text"), offsetX:offset[0], offsetY:offset[1], fontSize, scale:labelSize, isEditing, onChange:handleLabelChange, onBlur:onEditingEnd, fontStyle:italic ? "italic" : "normal", fontWeight, pointerEvents:!!label}), 
        (0,import_jsx_runtime53.jsxs)(SVGContainer, {opacity:isErasing ? 0.2 : opacity, children:[isBinding && (0,import_jsx_runtime53.jsx)(BindingIndicator, {mode:"svg", strokeWidth, size:[w2, h2]}), (0,import_jsx_runtime53.jsx)("rect", {className:isSelected || !noFill ? "tl-hitarea-fill" : "tl-hitarea-stroke", x:strokeWidth / 2, y:strokeWidth / 2, rx:borderRadius, ry:borderRadius, width:Math.max(0.01, w2 - strokeWidth), height:Math.max(0.01, h2 - strokeWidth), pointerEvents:"all"}), (0,import_jsx_runtime53.jsx)("rect", 
        {x:strokeWidth / 2, y:strokeWidth / 2, rx:borderRadius, ry:borderRadius, width:Math.max(0.01, w2 - strokeWidth), height:Math.max(0.01, h2 - strokeWidth), strokeWidth, stroke:getComputedColor(stroke, "stroke"), strokeDasharray:"dashed" === strokeType ? "8 2" : void 0, fill:noFill ? "none" : getComputedColor(fill, "background")})]})]}));
      }));
      __publicField(this, "setScaleLevel", v2 => __async(this, null, function*() {
        this.update({scaleLevel:v2, fontSize:levelToScale[null != v2 ? v2 : "md"], strokeWidth:levelToScale[null != v2 ? v2 : "md"] / 10});
        this.onResetBounds();
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const {props:{size:[w2, h2], borderRadius, isLocked}} = this;
        return (0,import_jsx_runtime53.jsx)("g", {children:(0,import_jsx_runtime53.jsx)("rect", {width:w2, height:h2, rx:borderRadius, ry:borderRadius, fill:"transparent", strokeDasharray:isLocked ? "8 2" : void 0})});
      }));
      __publicField(this, "validateProps", props => {
        void 0 !== props.size && (props.size[0] = Math.max(props.size[0], 1), props.size[1] = Math.max(props.size[1], 1));
        void 0 !== props.borderRadius && (props.borderRadius = Math.max(0, props.borderRadius));
        return withClampedStyles(this, props);
      });
    }
    get scaleLevel() {
      var _a3;
      return null != (_a3 = this.props.scaleLevel) ? _a3 : "md";
    }
  };
  __publicField(BoxShape, "id", "box");
  __publicField(BoxShape, "defaultProps", {id:"box", parentId:"page", type:"box", point:[0, 0], size:[100, 100], borderRadius:2, stroke:"", fill:"", noFill:!1, fontWeight:400, fontSize:20, italic:!1, strokeType:"line", strokeWidth:2, opacity:1, label:""});
  __decorateClass([computed], BoxShape.prototype, "scaleLevel", 1);
  __decorateClass([action], BoxShape.prototype, "setScaleLevel", 2);
  var React46 = __toESM(require("module$react")), import_jsx_runtime54 = require("module$node_modules$react$jsx_runtime"), levelToScale2 = {xs:10, sm:16, md:20, lg:32, xl:48, xxl:60}, EllipseShape = class extends TLEllipseShape {
    constructor() {
      super(...arguments);
      __publicField(this, "canEdit", !0);
      __publicField(this, "ReactComponent", observer(({isSelected, isErasing, events, isEditing, onEditingEnd}) => {
        const {size:[w2, h2], stroke, fill, noFill, strokeWidth, strokeType, opacity, label, italic, fontWeight, fontSize} = this.props;
        var labelSize = label || isEditing ? getTextLabelSize(label, {fontFamily:"var(--ls-font-family)", fontSize, lineHeight:1, fontWeight}, 4) : [0, 0];
        const midPoint = src_default.mul(this.props.size, 0.5);
        labelSize = Math.max(0.5, Math.min(1, w2 / labelSize[0], h2 / labelSize[1]));
        const bounds = this.getBounds(), offset = React46.useMemo(() => src_default.sub(midPoint, src_default.toFixed([bounds.width / 2, bounds.height / 2])), [bounds, labelSize, midPoint]), handleLabelChange = React46.useCallback(label2 => {
          var _a3;
          null == (_a3 = this.update) || _a3.call(this, {label:label2});
        }, [label]);
        return (0,import_jsx_runtime54.jsxs)("div", __spreadProps(__spreadValues({}, events), {style:{width:"100%", height:"100%", overflow:"hidden"}, className:"tl-ellipse-container", children:[(0,import_jsx_runtime54.jsx)(TextLabel, {font:"18px / 1 var(--ls-font-family)", text:label, color:getComputedColor(stroke, "text"), offsetX:offset[0], offsetY:offset[1], scale:labelSize, isEditing, onChange:handleLabelChange, onBlur:onEditingEnd, fontStyle:italic ? "italic" : "normal", fontSize, fontWeight, 
        pointerEvents:!!label}), (0,import_jsx_runtime54.jsxs)(SVGContainer, __spreadProps(__spreadValues({}, events), {opacity:isErasing ? 0.2 : opacity, children:[(0,import_jsx_runtime54.jsx)("ellipse", {className:isSelected || !noFill ? "tl-hitarea-fill" : "tl-hitarea-stroke", cx:w2 / 2, cy:h2 / 2, rx:Math.max(0.01, (w2 - strokeWidth) / 2), ry:Math.max(0.01, (h2 - strokeWidth) / 2)}), (0,import_jsx_runtime54.jsx)("ellipse", {cx:w2 / 2, cy:h2 / 2, rx:Math.max(0.01, (w2 - strokeWidth) / 2), ry:Math.max(0.01, 
        (h2 - strokeWidth) / 2), strokeWidth, stroke:getComputedColor(stroke, "stroke"), strokeDasharray:"dashed" === strokeType ? "8 2" : void 0, fill:noFill ? "none" : getComputedColor(fill, "background")})]}))]}));
      }));
      __publicField(this, "setScaleLevel", v2 => __async(this, null, function*() {
        this.update({scaleLevel:v2, fontSize:levelToScale2[null != v2 ? v2 : "md"], strokeWidth:levelToScale2[null != v2 ? v2 : "md"] / 10});
        this.onResetBounds();
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const {size:[w2, h2], isLocked} = this.props;
        return (0,import_jsx_runtime54.jsx)("g", {children:(0,import_jsx_runtime54.jsx)("ellipse", {cx:w2 / 2, cy:h2 / 2, rx:w2 / 2, ry:h2 / 2, strokeWidth:2, fill:"transparent", strokeDasharray:isLocked ? "8 2" : "undefined"})});
      }));
      __publicField(this, "validateProps", props => {
        void 0 !== props.size && (props.size[0] = Math.max(props.size[0], 1), props.size[1] = Math.max(props.size[1], 1));
        return withClampedStyles(this, props);
      });
    }
    get scaleLevel() {
      var _a3;
      return null != (_a3 = this.props.scaleLevel) ? _a3 : "md";
    }
    getShapeSVGJsx(opts) {
      const {size:[w2, h2], stroke, fill, noFill, strokeWidth, strokeType, opacity} = this.props;
      return (0,import_jsx_runtime54.jsxs)("g", {opacity, children:[(0,import_jsx_runtime54.jsx)("ellipse", {className:noFill ? "tl-hitarea-stroke" : "tl-hitarea-fill", cx:w2 / 2, cy:h2 / 2, rx:Math.max(0.01, (w2 - strokeWidth) / 2), ry:Math.max(0.01, (h2 - strokeWidth) / 2)}), (0,import_jsx_runtime54.jsx)("ellipse", {cx:w2 / 2, cy:h2 / 2, rx:Math.max(0.01, (w2 - strokeWidth) / 2), ry:Math.max(0.01, (h2 - strokeWidth) / 2), strokeWidth, stroke:getComputedColor(stroke, "stroke"), strokeDasharray:"dashed" === 
      strokeType ? "8 2" : void 0, fill:noFill ? "none" : getComputedColor(fill, "background")})]});
    }
  };
  __publicField(EllipseShape, "id", "ellipse");
  __publicField(EllipseShape, "defaultProps", {id:"ellipse", parentId:"page", type:"ellipse", point:[0, 0], size:[100, 100], stroke:"", fill:"", noFill:!1, fontWeight:400, fontSize:20, italic:!1, strokeType:"line", strokeWidth:2, opacity:1, label:""});
  __decorateClass([computed], EllipseShape.prototype, "scaleLevel", 1);
  __decorateClass([action], EllipseShape.prototype, "setScaleLevel", 2);
  var import_jsx_runtime55 = require("module$node_modules$react$jsx_runtime"), GroupShape = class extends TLGroupShape {
    constructor() {
      super(...arguments);
      __publicField(this, "ReactComponent", observer(({events}) => {
        const bounds = this.getBounds(), app = useApp(), childSelected = app.selectedShapesArray.some(s2 => app.shapesInGroups([this]).includes(s2)), Indicator2 = this.ReactIndicator;
        return (0,import_jsx_runtime55.jsxs)(SVGContainer, __spreadProps(__spreadValues({}, events), {className:"tl-group-container", children:[(0,import_jsx_runtime55.jsx)("rect", {className:"tl-hitarea-fill", x:1, y:1, width:Math.max(0.01, bounds.width - 2), height:Math.max(0.01, bounds.height - 2), pointerEvents:"all"}), childSelected && (0,import_jsx_runtime55.jsx)("g", {stroke:"var(--color-selectedFill)", children:(0,import_jsx_runtime55.jsx)(Indicator2, {})})]}));
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const bounds = this.getBounds();
        return (0,import_jsx_runtime55.jsx)("rect", {strokeDasharray:"8 2", x:-8, y:-8, rx:4, ry:4, width:bounds.width + 16, height:bounds.height + 16, fill:"transparent"});
      }));
    }
  };
  __publicField(GroupShape, "id", "group");
  __publicField(GroupShape, "defaultProps", {id:"group", type:"group", parentId:"page", point:[0, 0], size:[0, 0], children:[]});
  var import_jsx_runtime56 = require("module$node_modules$react$jsx_runtime"), levelToScale3 = {xs:1, sm:1.6, md:2, lg:3.2, xl:4.8, xxl:6}, HighlighterShape = class extends TLDrawShape {
    constructor(props = {}) {
      super(props);
      __publicField(this, "ReactComponent", observer(({events, isErasing}) => {
        const {pointsPath, props:{stroke, strokeWidth, opacity}} = this;
        return (0,import_jsx_runtime56.jsx)(SVGContainer, __spreadProps(__spreadValues({}, events), {opacity:isErasing ? 0.2 : 1, children:(0,import_jsx_runtime56.jsx)("path", {d:pointsPath, strokeWidth:16 * strokeWidth, stroke:getComputedColor(stroke, "stroke"), fill:"none", pointerEvents:"all", strokeLinejoin:"round", strokeLinecap:"round", opacity})}));
      }));
      __publicField(this, "setScaleLevel", v2 => __async(this, null, function*() {
        this.update({scaleLevel:v2, strokeWidth:levelToScale3[null != v2 ? v2 : "md"]});
        this.onResetBounds();
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const {pointsPath, props} = this;
        return (0,import_jsx_runtime56.jsx)("path", {d:pointsPath, fill:"none", strokeDasharray:props.isLocked ? "8 2" : "undefined"});
      }));
      __publicField(this, "validateProps", props => {
        props = withClampedStyles(this, props);
        void 0 !== props.strokeWidth && (props.strokeWidth = Math.max(props.strokeWidth, 1));
        return props;
      });
      makeObservable(this);
    }
    get pointsPath() {
      const {points} = this.props;
      return SvgPathUtils.getCurvedPathForPoints(points);
    }
    get scaleLevel() {
      var _a3;
      return null != (_a3 = this.props.scaleLevel) ? _a3 : "md";
    }
    getShapeSVGJsx() {
      const {pointsPath, props:{stroke, strokeWidth, opacity}} = this;
      return (0,import_jsx_runtime56.jsx)("path", {d:pointsPath, strokeWidth:16 * strokeWidth, stroke:getComputedColor(stroke, "stroke"), fill:"none", pointerEvents:"all", strokeLinejoin:"round", strokeLinecap:"round", opacity});
    }
  };
  __publicField(HighlighterShape, "id", "highlighter");
  __publicField(HighlighterShape, "defaultProps", {id:"highlighter", parentId:"page", type:"highlighter", point:[0, 0], points:[], isComplete:!1, stroke:"", fill:"", noFill:!0, strokeType:"line", strokeWidth:2, opacity:0.5});
  __decorateClass([computed], HighlighterShape.prototype, "pointsPath", 1);
  __decorateClass([computed], HighlighterShape.prototype, "scaleLevel", 1);
  __decorateClass([action], HighlighterShape.prototype, "setScaleLevel", 2);
  var React47 = __toESM(require("module$react")), import_jsx_runtime57 = require("module$node_modules$react$jsx_runtime"), levelToScale4 = {xs:0.5, sm:0.8, md:1, lg:1.5, xl:2, xxl:3}, HTMLShape = class extends TLBoxShape {
    constructor() {
      super(...arguments);
      __publicField(this, "canChangeAspectRatio", !0);
      __publicField(this, "canFlip", !1);
      __publicField(this, "canEdit", !0);
      __publicField(this, "htmlAnchorRef", React47.createRef());
      __publicField(this, "setScaleLevel", v2 => __async(this, null, function*() {
        var _a3;
        const newSize = src_default.mul(this.props.size, levelToScale4[null != v2 ? v2 : "md"] / levelToScale4[null != (_a3 = this.props.scaleLevel) ? _a3 : "md"]);
        this.update({scaleLevel:v2});
        yield delay();
        this.update({size:newSize});
      }));
      __publicField(this, "onResetBounds", info => {
        var _a3;
        if (this.htmlAnchorRef.current) {
          const rect = this.htmlAnchorRef.current.getBoundingClientRect(), [w2, h2] = src_default.div([rect.width, rect.height], null != (_a3 = null == info ? void 0 : info.zoom) ? _a3 : 1);
          this.update({size:[Math.max(Math.min(w2 || 400, 1400), 10), Math.max(Math.min(h2 || 400, 1400), 10)]});
        }
        return this;
      });
      __publicField(this, "ReactComponent", observer(({events, isErasing, isEditing}) => {
        const {props:{html, scaleLevel}} = this, isMoving = useCameraMovingRef(), app = useApp(), isSelected = app.selectedIds.has(this.id), tlEventsEnabled = isMoving || isSelected && !isEditing || "select" !== app.selectedTool.id, stop2 = React47.useCallback(e => {
          tlEventsEnabled || e.stopPropagation();
        }, [tlEventsEnabled]), scaleRatio = levelToScale4[null != scaleLevel ? scaleLevel : "md"];
        React47.useEffect(() => {
          0 === this.props.size[1] && (this.onResetBounds({zoom:app.viewport.camera.zoom}), app.persist());
        }, []);
        return (0,import_jsx_runtime57.jsx)(HTMLContainer, __spreadProps(__spreadValues({style:{overflow:"hidden", pointerEvents:"all", opacity:isErasing ? 0.2 : 1}}, events), {children:(0,import_jsx_runtime57.jsx)("div", {onWheelCapture:stop2, onPointerDown:stop2, onPointerUp:stop2, className:"tl-html-container", style:{pointerEvents:isMoving || !isEditing && !isSelected ? "none" : "all", overflow:isEditing ? "auto" : "hidden", width:`calc(100% / ${scaleRatio})`, height:`calc(100% / ${scaleRatio})`, 
        transform:`scale(${scaleRatio})`}, children:(0,import_jsx_runtime57.jsx)("div", {ref:this.htmlAnchorRef, className:"tl-html-anchor", dangerouslySetInnerHTML:{__html:html.trim()}})})}));
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const {props:{size:[w2, h2], isLocked}} = this;
        return (0,import_jsx_runtime57.jsx)("rect", {width:w2, height:h2, fill:"transparent", strokeDasharray:isLocked ? "8 2" : "undefined"});
      }));
      __publicField(this, "validateProps", props => {
        void 0 !== props.size && (props.size[0] = Math.max(props.size[0], 1), props.size[1] = Math.max(props.size[1], 1));
        return withClampedStyles(this, props);
      });
    }
    get scaleLevel() {
      var _a3;
      return null != (_a3 = this.props.scaleLevel) ? _a3 : "md";
    }
  };
  __publicField(HTMLShape, "id", "html");
  __publicField(HTMLShape, "defaultProps", {id:"html", type:"html", parentId:"page", point:[0, 0], size:[600, 0], html:""});
  __decorateClass([computed], HTMLShape.prototype, "scaleLevel", 1);
  __decorateClass([action], HTMLShape.prototype, "setScaleLevel", 2);
  var React48 = __toESM(require("module$react")), import_jsx_runtime58 = require("module$node_modules$react$jsx_runtime"), IFrameShape = class extends TLBoxShape {
    constructor() {
      super(...arguments);
      __publicField(this, "frameRef", React48.createRef());
      __publicField(this, "canEdit", !0);
      __publicField(this, "onIFrameSourceChange", url => {
        this.update({url});
      });
      __publicField(this, "reload", () => {
        var _a3, _b;
        this.frameRef.current && (this.frameRef.current.src = null == (_b = null == (_a3 = this.frameRef) ? void 0 : _a3.current) ? void 0 : _b.src);
      });
      __publicField(this, "ReactComponent", observer(({events, isErasing, isEditing}) => {
        React48.useRef(null);
        const app = useApp();
        return (0,import_jsx_runtime58.jsx)(HTMLContainer, __spreadProps(__spreadValues({style:{overflow:"hidden", pointerEvents:"all", opacity:isErasing ? 0.2 : 1}}, events), {children:(0,import_jsx_runtime58.jsx)("div", {className:"tl-iframe-container", style:{pointerEvents:isEditing || app.readOnly ? "all" : "none", userSelect:"none"}, children:this.props.url && (0,import_jsx_runtime58.jsx)("div", {style:{overflow:"hidden", position:"relative", height:"100%"}, children:(0,import_jsx_runtime58.jsx)("iframe", 
        {ref:this.frameRef, className:"absolute inset-0 w-full h-full m-0", width:"100%", height:"100%", src:`${this.props.url}`, frameBorder:"0", sandbox:"allow-scripts allow-same-origin allow-presentation"})})})}));
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const {props:{size:[w2, h2], isLocked}} = this;
        return (0,import_jsx_runtime58.jsx)("rect", {width:w2, height:h2, fill:"transparent", rx:8, ry:8, strokeDasharray:isLocked ? "8 2" : "undefined"});
      }));
    }
  };
  __publicField(IFrameShape, "id", "iframe");
  __publicField(IFrameShape, "defaultProps", {id:"iframe", type:"iframe", parentId:"page", point:[0, 0], size:[853, 480], url:""});
  __decorateClass([action], IFrameShape.prototype, "onIFrameSourceChange", 2);
  __decorateClass([action], IFrameShape.prototype, "reload", 2);
  var React49 = __toESM(require("module$react")), import_jsx_runtime59 = require("module$node_modules$react$jsx_runtime"), ImageShape = class extends TLImageShape {
    constructor() {
      super(...arguments);
      __publicField(this, "ReactComponent", observer(({events, isErasing, isBinding, asset}) => {
        const {props:{opacity, objectFit, clipping, size:[w2, h2]}} = this, [t, r2, b3, l3] = Array.isArray(clipping) ? clipping : [clipping, clipping, clipping, clipping], {handlers} = React49.useContext(LogseqContext);
        return (0,import_jsx_runtime59.jsxs)(HTMLContainer, __spreadProps(__spreadValues({}, events), {opacity:isErasing ? 0.2 : opacity, children:[isBinding && (0,import_jsx_runtime59.jsx)(BindingIndicator, {mode:"html", strokeWidth:4, size:[w2, h2]}), (0,import_jsx_runtime59.jsx)("div", {"data-asset-loaded":!!asset, className:"tl-image-shape-container", children:asset ? (0,import_jsx_runtime59.jsx)("img", {src:handlers ? handlers.makeAssetUrl(asset.src) : asset.src, draggable:!1, style:{position:"relative", 
        top:-t, left:-l3, width:w2 + (l3 - r2), height:h2 + (t - b3), objectFit}}) : "Asset is missing"})]}));
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const {props:{size:[w2, h2], isLocked}} = this;
        return (0,import_jsx_runtime59.jsx)("rect", {width:w2, height:h2, fill:"transparent", strokeDasharray:isLocked ? "8 2" : "undefined"});
      }));
    }
    getShapeSVGJsx({assets}) {
      var _a3, _b;
      const bounds = this.getBounds(), {assetId, clipping} = this.props;
      if (assets = assets.find(ass => ass.id === assetId)) {
        Array.isArray(clipping);
        const make_asset_url = null == (_b = null == (_a3 = window.logseq) ? void 0 : _a3.api) ? void 0 : _b.make_asset_url;
        return (0,import_jsx_runtime59.jsx)("image", {width:bounds.width, height:bounds.height, href:make_asset_url ? make_asset_url(assets.src) : assets.src});
      }
      return super.getShapeSVGJsx({});
    }
  };
  __publicField(ImageShape, "id", "image");
  __publicField(ImageShape, "defaultProps", {id:"image1", parentId:"page", type:"image", point:[0, 0], size:[100, 100], opacity:1, assetId:"", clipping:0, objectFit:"fill", isAspectRatioLocked:!0});
  var React51 = __toESM(require("module$react")), React50 = __toESM(require("module$react")), import_jsx_runtime60 = require("module$node_modules$react$jsx_runtime"), import_jsx_runtime61 = require("module$node_modules$react$jsx_runtime"), levelToScale5 = {xs:10, sm:16, md:20, lg:32, xl:48, xxl:60}, Arrow = React50.memo(function({style, start, end, decorationStart, decorationEnd, scaleLevel}) {
    const arrowDist = src_default.dist(start, end);
    if (2 > arrowDist) {
      return null;
    }
    const {strokeWidth} = style, sw = 1 + strokeWidth * levelToScale5[null != scaleLevel ? scaleLevel : "md"] / 10, path = "M" + src_default.toFixed(start) + "L" + src_default.toFixed(end);
    scaleLevel = Math.min(arrowDist / 3, strokeWidth * levelToScale5[null != scaleLevel ? scaleLevel : "md"]);
    decorationStart = decorationStart ? getStraightArrowHeadPoints(start, end, scaleLevel) : null;
    decorationEnd = decorationEnd ? getStraightArrowHeadPoints(end, start, scaleLevel) : null;
    return (0,import_jsx_runtime61.jsxs)(import_jsx_runtime61.Fragment, {children:[(0,import_jsx_runtime61.jsx)("path", {className:"tl-stroke-hitarea", d:path}), (0,import_jsx_runtime61.jsx)("path", {d:path, strokeWidth:sw, stroke:style.stroke, strokeLinecap:"round", strokeLinejoin:"round", strokeDasharray:"dashed" === style.strokeType ? "8 4" : void 0, pointerEvents:"stroke"}), decorationStart && (0,import_jsx_runtime61.jsx)(Arrowhead, {left:decorationStart.left, middle:start, right:decorationStart.right, 
    stroke:style.stroke, strokeWidth:sw}), decorationEnd && (0,import_jsx_runtime61.jsx)(Arrowhead, {left:decorationEnd.left, middle:end, right:decorationEnd.right, stroke:style.stroke, strokeWidth:sw})]});
  }), import_jsx_runtime62 = require("module$node_modules$react$jsx_runtime"), import_jsx_runtime63 = require("module$node_modules$react$jsx_runtime"), levelToScale6 = {xs:10, sm:16, md:20, lg:32, xl:48, xxl:60}, LineShape = class extends TLLineShape {
    constructor() {
      super(...arguments);
      __publicField(this, "hideSelection", !0);
      __publicField(this, "canEdit", !0);
      __publicField(this, "ReactComponent", observer(({events, isErasing, isEditing, onEditingEnd}) => {
        const {stroke, handles:{start, end}, opacity, label, italic, fontWeight, fontSize, id:id3} = this.props, labelSize = label || isEditing ? getTextLabelSize(label || "Enter text", {fontFamily:"var(--ls-font-family)", fontSize, lineHeight:1, fontWeight}, 6) : [0, 0], midPoint = src_default.med(start.point, end.point);
        var dist = src_default.dist(start.point, end.point);
        dist = Math.max(0.5, Math.min(1, Math.max(dist / (labelSize[1] + 128), dist / (labelSize[0] + 128))));
        const bounds = this.getBounds(), offset = React51.useMemo(() => src_default.sub(midPoint, src_default.toFixed([bounds.width / 2, bounds.height / 2])), [bounds, dist, midPoint]), handleLabelChange = React51.useCallback(label2 => {
          var _a3;
          null == (_a3 = this.update) || _a3.call(this, {label:label2});
        }, [label]);
        return (0,import_jsx_runtime63.jsxs)("div", __spreadProps(__spreadValues({}, events), {style:{width:"100%", height:"100%", overflow:"hidden"}, className:"tl-line-container", children:[(0,import_jsx_runtime63.jsx)(TextLabel, {font:"20px / 1 var(--ls-font-family)", text:label, fontSize, color:getComputedColor(stroke, "text"), offsetX:offset[0], offsetY:offset[1], scale:dist, isEditing, onChange:handleLabelChange, onBlur:onEditingEnd, fontStyle:italic ? "italic" : "normal", fontWeight, pointerEvents:!!label}), 
        (0,import_jsx_runtime63.jsxs)(SVGContainer, {opacity:isErasing ? 0.2 : opacity, id:id3 + "_svg", children:[(0,import_jsx_runtime63.jsx)(LabelMask, {id:id3, bounds, labelSize, offset, scale:dist}), (0,import_jsx_runtime63.jsx)("g", {pointerEvents:"none", mask:label || isEditing ? `url(#${id3}_clip)` : "", children:this.getShapeSVGJsx({preview:!1})})]})]}));
      }));
      __publicField(this, "setScaleLevel", v2 => __async(this, null, function*() {
        this.update({scaleLevel:v2, fontSize:levelToScale6[null != v2 ? v2 : "md"]});
        this.onResetBounds();
      }));
      __publicField(this, "ReactIndicator", observer(({isEditing}) => {
        const {id:id3, decorations, label, strokeWidth, fontSize, fontWeight, handles:{start, end}, isLocked} = this.props, bounds = this.getBounds(), labelSize = label || isEditing ? getTextLabelSize(label, {fontFamily:"var(--ls-font-family)", fontSize, lineHeight:1, fontWeight}, 6) : [0, 0], midPoint = src_default.med(start.point, end.point);
        var dist = src_default.dist(start.point, end.point);
        dist = Math.max(0.5, Math.min(1, Math.max(dist / (labelSize[1] + 128), dist / (labelSize[0] + 128))));
        const offset = React51.useMemo(() => src_default.sub(midPoint, src_default.toFixed([bounds.width / 2, bounds.height / 2])), [bounds, dist, midPoint]);
        return (0,import_jsx_runtime63.jsxs)("g", {children:[(0,import_jsx_runtime63.jsx)("path", {mask:label ? `url(#${id3}_clip)` : "", d:getArrowPath({strokeWidth}, start.point, end.point, null == decorations ? void 0 : decorations.start, null == decorations ? void 0 : decorations.end), strokeDasharray:isLocked ? "8 2" : "undefined"}), label && !isEditing && (0,import_jsx_runtime63.jsx)("rect", {x:bounds.width / 2 - labelSize[0] / 2 * dist + offset[0], y:bounds.height / 2 - labelSize[1] / 2 * 
        dist + offset[1], width:labelSize[0] * dist, height:labelSize[1] * dist, rx:4 * dist, ry:4 * dist, fill:"transparent"})]});
      }));
      __publicField(this, "validateProps", props => withClampedStyles(this, props));
    }
    get scaleLevel() {
      var _a3;
      return null != (_a3 = this.props.scaleLevel) ? _a3 : "md";
    }
    getShapeSVGJsx({preview}) {
      const {stroke, fill, strokeWidth, strokeType, decorations, label, scaleLevel, handles:{start, end}} = this.props, midPoint = src_default.med(start.point, end.point);
      return (0,import_jsx_runtime63.jsxs)(import_jsx_runtime63.Fragment, {children:[(0,import_jsx_runtime63.jsx)(Arrow, {style:{stroke:getComputedColor(stroke, "text"), fill, strokeWidth, strokeType}, scaleLevel, start:start.point, end:end.point, decorationStart:null == decorations ? void 0 : decorations.start, decorationEnd:null == decorations ? void 0 : decorations.end}), preview && (0,import_jsx_runtime63.jsx)(import_jsx_runtime63.Fragment, {children:(0,import_jsx_runtime63.jsx)("text", {style:{transformOrigin:"top left"}, 
      fontFamily:"Inter", fontSize:20, transform:`translate(${midPoint[0]}, ${midPoint[1]})`, textAnchor:"middle", fill:getComputedColor(stroke, "text"), stroke:getComputedColor(stroke, "text"), children:label})})]});
    }
  };
  __publicField(LineShape, "id", "line");
  __publicField(LineShape, "defaultProps", {id:"line", parentId:"page", type:"line", point:[0, 0], handles:{start:{id:"start", canBind:!0, point:[0, 0]}, end:{id:"end", canBind:!0, point:[1, 1]}}, stroke:"", fill:"", noFill:!0, fontWeight:400, fontSize:20, italic:!1, strokeType:"line", strokeWidth:1, opacity:1, decorations:{end:"arrow"}, label:""});
  __decorateClass([computed], LineShape.prototype, "scaleLevel", 1);
  __decorateClass([action], LineShape.prototype, "setScaleLevel", 2);
  var React52 = __toESM(require("module$react")), import_jsx_runtime64 = require("module$node_modules$react$jsx_runtime"), levelToScale7 = {xs:0.5, sm:0.8, md:1, lg:1.5, xl:2, xxl:3}, LogseqPortalShapeHeader = observer(({type, fill, opacity, children}) => {
    const bgColor = "var(--ls-secondary-background-color)" !== fill ? getComputedColor(fill, "background") : "var(--ls-tertiary-background-color)";
    fill = fill && "var(--ls-secondary-background-color)" !== fill ? isBuiltInColor(fill) ? `var(--ls-highlight-color-${fill})` : fill : "var(--ls-secondary-background-color)";
    return (0,import_jsx_runtime64.jsxs)("div", {className:`tl-logseq-portal-header tl-logseq-portal-header-${"P" === type ? "page" : "block"}`, children:[(0,import_jsx_runtime64.jsx)("div", {className:"absolute inset-0 tl-logseq-portal-header-bg", style:{opacity, background:"P" === type ? bgColor : `linear-gradient(0deg, ${fill}, ${bgColor})`}}), (0,import_jsx_runtime64.jsx)("div", {className:"relative", children})]});
  }), LogseqPortalShape = class extends TLBoxShape {
    constructor(props = {}) {
      var _a3;
      super(props);
      __publicField(this, "hideRotateHandle", !0);
      __publicField(this, "canChangeAspectRatio", !0);
      __publicField(this, "canFlip", !0);
      __publicField(this, "canEdit", !0);
      __publicField(this, "persist", null);
      __publicField(this, "initialHeightCalculated", !0);
      __publicField(this, "getInnerHeight", null);
      __publicField(this, "setCollapsed", collapsed => __async(this, null, function*() {
        var _a3;
        if ("B" === this.props.blockType) {
          if (this.update({compact:collapsed}), this.canResize[1] = !collapsed, !collapsed) {
            this.onResetBounds();
          }
        } else {
          const originalHeight = this.props.size[1];
          this.canResize[1] = !collapsed;
          this.update({isAutoResizing:!collapsed, collapsed, size:[this.props.size[0], collapsed ? this.getHeaderHeight() : this.props.collapsedHeight], collapsedHeight:collapsed ? originalHeight : this.props.collapsedHeight});
        }
        null == (_a3 = this.persist) || _a3.call(this);
      }));
      __publicField(this, "setScaleLevel", v2 => __async(this, null, function*() {
        var _a3;
        const newSize = src_default.mul(this.props.size, levelToScale7[null != v2 ? v2 : "md"] / levelToScale7[null != (_a3 = this.props.scaleLevel) ? _a3 : "md"]);
        this.update({scaleLevel:v2});
        yield delay();
        this.update({size:newSize});
      }));
      __publicField(this, "onResetBounds", info => {
        info = this.getAutoResizeHeight();
        null !== info && 1 < Math.abs(info - this.props.size[1]) && (this.update({size:[this.props.size[0], info]}), this.initialHeightCalculated = !0);
        return this;
      });
      __publicField(this, "onResize", (initialProps, info) => {
        var _a3;
        const {bounds, rotation, scale:[scaleX, scaleY]} = info;
        initialProps = [...this.scale];
        0 > scaleX && (initialProps[0] *= -1);
        0 > scaleY && (initialProps[1] *= -1);
        info = bounds.height;
        this.props.isAutoResizing && (info = null != (_a3 = this.getAutoResizeHeight()) ? _a3 : info);
        return this.update({point:[bounds.minX, bounds.minY], size:[Math.max(1, bounds.width), Math.max(1, info)], scale:initialProps, rotation});
      });
      __publicField(this, "PortalComponent", observer(({}) => {
        const {props:{pageId, fill, opacity}} = this, {renderers} = React52.useContext(LogseqContext), app = useApp(), cpRefContainer = React52.useRef(null), [, innerHeight] = this.useComponentSize(cpRefContainer, this.props.compact ? ".tl-logseq-cp-container \x3e .single-block" : ".tl-logseq-cp-container \x3e .page");
        if (null == renderers || !renderers.Page) {
          return null;
        }
        const {Page, Block} = renderers, [loaded, setLoaded] = React52.useState(!1);
        React52.useEffect(() => {
          var _a3, _b;
          if (this.props.isAutoResizing) {
            const newHeight = (null != (_b = null == (_a3 = this.getInnerHeight) ? void 0 : _a3.call(this)) ? _b : innerHeight) + this.getHeaderHeight();
            innerHeight && 1 < Math.abs(newHeight - this.props.size[1]) && (this.update({size:[this.props.size[0], newHeight]}), loaded && app.persist({}));
          }
        }, [innerHeight, this.props.isAutoResizing]);
        React52.useEffect(() => {
          this.initialHeightCalculated || setTimeout(() => {
            this.onResetBounds();
            app.persist({});
          });
        }, [this.initialHeightCalculated]);
        React52.useEffect(() => {
          setTimeout(function() {
            setLoaded(!0);
          });
        }, []);
        return (0,import_jsx_runtime64.jsxs)(import_jsx_runtime64.Fragment, {children:[(0,import_jsx_runtime64.jsx)("div", {className:"absolute inset-0 tl-logseq-cp-container-bg", style:{textRendering:0.5 > app.viewport.camera.zoom ? "optimizeSpeed" : "auto", background:fill && "var(--ls-secondary-background-color)" !== fill ? isBuiltInColor(fill) ? `var(--ls-highlight-color-${fill})` : fill : "var(--ls-secondary-background-color)", opacity}}), (0,import_jsx_runtime64.jsx)("div", {ref:cpRefContainer, 
        className:"relative tl-logseq-cp-container", style:{overflow:this.props.isAutoResizing ? "visible" : "auto"}, children:(loaded || !this.initialHeightCalculated) && ("B" === this.props.blockType && this.props.compact ? (0,import_jsx_runtime64.jsx)(Block, {blockId:pageId}) : (0,import_jsx_runtime64.jsx)(Page, {pageName:pageId}))})]});
      }));
      __publicField(this, "ReactComponent", observer(componentProps => {
        var _a3;
        const {events, isErasing, isEditing, isBinding} = componentProps, {props:{opacity, pageId, fill, scaleLevel, strokeWidth, size}} = this, app = useApp(), {renderers, handlers} = React52.useContext(LogseqContext);
        this.persist = () => app.persist();
        const isMoving = useCameraMovingRef(), isSelected = app.selectedIds.has(this.id) && 1 === app.selectedIds.size, isCreating = app.isIn("logseq-portal.creating") && !pageId, tlEventsEnabled = (isMoving || isSelected && !isEditing || "select" !== app.selectedTool.id) && !isCreating, stop2 = React52.useCallback(e => {
          tlEventsEnabled || e.stopPropagation();
        }, [tlEventsEnabled]), portalSelected = 1 === app.selectedShapesArray.length && app.selectedShapesArray.some(shape => "logseq-portal" === shape.type && shape.props.id !== this.props.id && pageId && shape.props.pageId === pageId), scaleRatio = levelToScale7[null != scaleLevel ? scaleLevel : "md"];
        React52.useEffect(() => this.props.collapsed && isEditing ? (this.update({size:[this.props.size[0], this.props.collapsedHeight]}), () => {
          this.update({size:[this.props.size[0], this.getHeaderHeight()]});
        }) : () => {
        }, [isEditing, this.props.collapsed]);
        React52.useEffect(() => {
          if (isCreating) {
            const screenSize = [app.viewport.bounds.width, app.viewport.bounds.height], boundScreenCenter = app.viewport.getScreenPoint([this.bounds.minX, this.bounds.minY]);
            (boundScreenCenter[0] > screenSize[0] - 400 || boundScreenCenter[1] > screenSize[1] - 240 || 1.5 < app.viewport.camera.zoom || 0.5 > app.viewport.camera.zoom) && app.viewport.zoomToBounds(__spreadProps(__spreadValues({}, this.bounds), {minY:this.bounds.maxY + 25}));
          }
        }, [app.viewport.bounds.height.toFixed(2)]);
        const onPageNameChanged = React52.useCallback((id3, isPage) => {
          this.initialHeightCalculated = !1;
          const blockType = isPage ? "P" : "B";
          this.update({pageId:id3, size:[400, isPage ? 320 : 40], blockType, compact:"B" === blockType});
          app.selectTool("select");
          app.history.resume();
          app.history.persist();
        }, []), PortalComponent = this.PortalComponent;
        var blockContent = React52.useMemo(() => {
          var _a4;
          if (pageId && "B" === this.props.blockType) {
            return null == (_a4 = null == handlers ? void 0 : handlers.queryBlockByUUID(pageId)) ? void 0 : _a4.title;
          }
        }, [null == handlers ? void 0 : handlers.queryBlockByUUID, pageId]);
        blockContent = "B" === this.props.blockType && "string" !== typeof blockContent;
        const showingPortal = (!this.props.collapsed || isEditing) && !blockContent;
        if (null == renderers || !renderers.Page) {
          return null;
        }
        const {Breadcrumb, PageName} = renderers, portalStyle = {width:`calc(100% / ${scaleRatio})`, height:`calc(100% / ${scaleRatio})`, opacity:isErasing ? 0.2 : 1};
        1 !== scaleRatio && (portalStyle.transform = `scale(${scaleRatio})`);
        return (0,import_jsx_runtime64.jsxs)(HTMLContainer, __spreadProps(__spreadValues({style:{pointerEvents:"all"}}, events), {children:[isBinding && (0,import_jsx_runtime64.jsx)(BindingIndicator, {mode:"html", strokeWidth, size}), (0,import_jsx_runtime64.jsx)("div", {"data-inner-events":!tlEventsEnabled, onWheelCapture:stop2, onPointerDown:stop2, onPointerUp:stop2, style:{width:"100%", height:"100%", pointerEvents:isMoving || !isEditing && !isSelected ? "none" : "all"}, children:isCreating ? 
        (0,import_jsx_runtime64.jsx)(LogseqQuickSearch, {onChange:onPageNameChanged, onAddBlock:uuid => {
          setTimeout(() => {
            var _a4, _b, _c;
            app.api.editShape(this);
            null == (_c = null == (_b = null == (_a4 = window.logseq) ? void 0 : _a4.api) ? void 0 : _b.edit_block) || _c.call(_b, uuid);
          }, 128);
        }, placeholder:"Create or search your graph..."}) : (0,import_jsx_runtime64.jsxs)("div", {className:"tl-logseq-portal-container", "data-collapsed":this.collapsed, "data-page-id":pageId, "data-portal-selected":portalSelected, "data-editing":isEditing, style:portalStyle, children:[!this.props.compact && !blockContent && (0,import_jsx_runtime64.jsx)(LogseqPortalShapeHeader, {type:null != (_a3 = this.props.blockType) ? _a3 : "P", fill, opacity, children:"P" === this.props.blockType ? (0,import_jsx_runtime64.jsx)(PageName, 
        {pageName:pageId}) : (0,import_jsx_runtime64.jsx)(Breadcrumb, {blockId:pageId})}), blockContent && (0,import_jsx_runtime64.jsx)("div", {className:"tl-target-not-found", children:"Target not found"}), showingPortal && (0,import_jsx_runtime64.jsx)(PortalComponent, __spreadValues({}, componentProps))]})})]}));
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const bounds = this.getBounds();
        return (0,import_jsx_runtime64.jsx)("rect", {width:bounds.width, height:bounds.height, fill:"transparent", rx:8, ry:8, strokeDasharray:this.props.isLocked ? "8 2" : "undefined"});
      }));
      __publicField(this, "validateProps", props => {
        var _a3;
        if (void 0 !== props.size) {
          const scale = levelToScale7[null != (_a3 = this.props.scaleLevel) ? _a3 : "md"];
          props.size[0] = Math.max(props.size[0], 60 * scale);
          props.size[1] = Math.max(props.size[1], 40 * scale);
        }
        return withClampedStyles(this, props);
      });
      makeObservable(this);
      props.collapsed && Object.assign(this.canResize, [!0, !1]);
      0 === (null == (_a3 = props.size) ? void 0 : _a3[1]) && (this.initialHeightCalculated = !1);
    }
    static isPageOrBlock(id3) {
      return id3 ? /^\(\(.*\)\)$/.test(id3) && 40 === id3.length ? "B" : "P" : !1;
    }
    get collapsed() {
      return "B" === this.props.blockType ? this.props.compact : this.props.collapsed;
    }
    get scaleLevel() {
      var _a3;
      return null != (_a3 = this.props.scaleLevel) ? _a3 : "md";
    }
    useComponentSize(ref, selector = "") {
      const [size, setSize] = React52.useState([0, 0]), app = useApp();
      React52.useEffect(() => {
        setTimeout(() => {
          if (null == ref ? 0 : ref.current) {
            const el = selector ? ref.current.querySelector(selector) : ref.current;
            if (el) {
              const updateSize = () => {
                const {width, height} = el.getBoundingClientRect(), bound = src_default.div([width, height], app.viewport.camera.zoom);
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
      const scale = levelToScale7[null != (_a3 = this.props.scaleLevel) ? _a3 : "md"];
      return this.props.compact ? 0 : 40 * scale;
    }
    getAutoResizeHeight() {
      return this.getInnerHeight ? this.getHeaderHeight() + this.getInnerHeight() : null;
    }
    getShapeSVGJsx({}) {
      var _a3, _b, _c;
      const bounds = this.getBounds();
      return (0,import_jsx_runtime64.jsxs)(import_jsx_runtime64.Fragment, {children:[(0,import_jsx_runtime64.jsx)("rect", {fill:this.props.fill && "var(--ls-secondary-background-color)" !== this.props.fill ? isBuiltInColor(this.props.fill) ? `var(--ls-highlight-color-${this.props.fill})` : this.props.fill : "var(--ls-secondary-background-color)", stroke:getComputedColor(this.props.fill, "background"), strokeWidth:null != (_a3 = this.props.strokeWidth) ? _a3 : 2, fillOpacity:null != (_b = this.props.opacity) ? 
      _b : 0.2, width:bounds.width, rx:8, ry:8, height:bounds.height}), !this.props.compact && (0,import_jsx_runtime64.jsx)("rect", {fill:this.props.fill && "var(--ls-secondary-background-color)" !== this.props.fill ? getComputedColor(this.props.fill, "background") : "var(--ls-tertiary-background-color)", fillOpacity:null != (_c = this.props.opacity) ? _c : 0.2, x:1, y:1, width:bounds.width - 2, height:38, rx:8, ry:8}), (0,import_jsx_runtime64.jsx)("text", {style:{transformOrigin:"top left"}, transform:`translate(${bounds.width / 
      2}, ${10 + bounds.height / 2})`, textAnchor:"middle", fontFamily:"var(--ls-font-family)", fontSize:"32", fill:"var(--ls-secondary-text-color)", stroke:"var(--ls-secondary-text-color)", children:"P" === this.props.blockType ? this.props.pageName : ""})]});
    }
  };
  __publicField(LogseqPortalShape, "id", "logseq-portal");
  __publicField(LogseqPortalShape, "defaultSearchQuery", "");
  __publicField(LogseqPortalShape, "defaultSearchFilter", null);
  __publicField(LogseqPortalShape, "defaultProps", {id:"logseq-portal", type:"logseq-portal", parentId:"page", point:[0, 0], size:[400, 50], collapsedHeight:0, stroke:"", fill:"", noFill:!1, borderRadius:8, strokeWidth:2, strokeType:"line", opacity:1, pageId:"", collapsed:!1, compact:!1, scaleLevel:"md", isAutoResizing:!0});
  __decorateClass([computed], LogseqPortalShape.prototype, "collapsed", 1);
  __decorateClass([action], LogseqPortalShape.prototype, "setCollapsed", 2);
  __decorateClass([computed], LogseqPortalShape.prototype, "scaleLevel", 1);
  __decorateClass([action], LogseqPortalShape.prototype, "setScaleLevel", 2);
  var {min:C2, PI:xe2} = Math, V3 = xe2 + 1e-4, import_jsx_runtime65 = require("module$node_modules$react$jsx_runtime"), levelToScale8 = {xs:1, sm:1.6, md:2, lg:3.2, xl:4.8, xxl:6}, simulatePressureSettings = {easing:t => Math.sin(t * Math.PI / 2), simulatePressure:!0}, realPressureSettings = {easing:t => t * t, simulatePressure:!1}, PencilShape = class extends TLDrawShape {
    constructor(props = {}) {
      super(props);
      __publicField(this, "ReactComponent", observer(({events, isErasing}) => {
        const {props:{opacity}} = this;
        return (0,import_jsx_runtime65.jsx)(SVGContainer, __spreadProps(__spreadValues({}, events), {opacity:isErasing ? 0.2 : opacity, children:this.getShapeSVGJsx()}));
      }));
      __publicField(this, "setScaleLevel", v2 => __async(this, null, function*() {
        this.update({scaleLevel:v2, strokeWidth:levelToScale8[null != v2 ? v2 : "md"]});
        this.onResetBounds();
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const {pointsPath} = this;
        return (0,import_jsx_runtime65.jsx)("path", {d:pointsPath, strokeDasharray:this.props.isLocked ? "8 2" : "undefined"});
      }));
      __publicField(this, "validateProps", props => {
        props = withClampedStyles(this, props);
        void 0 !== props.strokeWidth && (props.strokeWidth = Math.max(props.strokeWidth, 1));
        return props;
      });
      makeObservable(this);
    }
    get pointsPath() {
      var shape = this.props;
      if (2 > shape.points.length) {
        var JSCompiler_inline_result = "";
      } else {
        JSCompiler_inline_result = __spreadProps(__spreadValues({size:1 + 1.5 * shape.strokeWidth, thinning:0.65, streamline:0.65, smoothing:0.65}, 0.5 === shape.points[1][2] ? simulatePressureSettings : realPressureSettings), {last:shape.isComplete}), shape = me2(shape.points, JSCompiler_inline_result), JSCompiler_inline_result = SvgPathUtils.getSvgPathFromStroke(ce2(shape, JSCompiler_inline_result));
      }
      return JSCompiler_inline_result;
    }
    get scaleLevel() {
      var _a3;
      return null != (_a3 = this.props.scaleLevel) ? _a3 : "md";
    }
    getShapeSVGJsx() {
      const {pointsPath, props:{stroke, strokeWidth, strokeType}} = this;
      return (0,import_jsx_runtime65.jsx)("path", {pointerEvents:"all", d:pointsPath, strokeWidth:strokeWidth / 2, strokeLinejoin:"round", strokeLinecap:"round", stroke:getComputedColor(stroke, "text"), fill:getComputedColor(stroke, "text"), strokeDasharray:"dashed" === strokeType ? "12 4" : void 0});
    }
  };
  __publicField(PencilShape, "id", "pencil");
  __publicField(PencilShape, "defaultProps", {id:"pencil", parentId:"page", type:"pencil", point:[0, 0], points:[], isComplete:!1, stroke:"", fill:"", noFill:!0, strokeType:"line", strokeWidth:2, opacity:1});
  __decorateClass([computed], PencilShape.prototype, "pointsPath", 1);
  __decorateClass([computed], PencilShape.prototype, "scaleLevel", 1);
  __decorateClass([action], PencilShape.prototype, "setScaleLevel", 2);
  var React53 = __toESM(require("module$react")), import_jsx_runtime66 = require("module$node_modules$react$jsx_runtime"), levelToScale9 = {xs:10, sm:16, md:20, lg:32, xl:48, xxl:60}, PolygonShape = class extends TLPolygonShape {
    constructor() {
      super(...arguments);
      __publicField(this, "canEdit", !0);
      __publicField(this, "ReactComponent", observer(({events, isErasing, isSelected, isEditing, onEditingEnd}) => {
        const {offset:[x2, y2], props:{stroke, fill, noFill, strokeWidth, opacity, strokeType, label, italic, fontWeight, fontSize}} = this, path = this.getVertices(strokeWidth / 2).join();
        var labelSize = label || isEditing ? getTextLabelSize(label, {fontFamily:"var(--ls-font-family)", fontSize, lineHeight:1, fontWeight}, 4) : [0, 0];
        const midPoint = [this.props.size[0] / 2, 2 * this.props.size[1] / 3];
        labelSize = Math.max(0.5, Math.min(1, this.props.size[0] / (2 * labelSize[0]), this.props.size[1] / (2 * labelSize[1])));
        const bounds = this.getBounds(), offset = React53.useMemo(() => src_default.sub(midPoint, src_default.toFixed([bounds.width / 2, bounds.height / 2])), [bounds, labelSize, midPoint]), handleLabelChange = React53.useCallback(label2 => {
          var _a3;
          null == (_a3 = this.update) || _a3.call(this, {label:label2});
        }, [label]);
        return (0,import_jsx_runtime66.jsxs)("div", __spreadProps(__spreadValues({}, events), {style:{width:"100%", height:"100%", overflow:"hidden"}, children:[(0,import_jsx_runtime66.jsx)(TextLabel, {font:"20px / 1 var(--ls-font-family)", text:label, fontSize, color:getComputedColor(stroke, "text"), offsetX:offset[0], offsetY:offset[1] / labelSize, scale:labelSize, isEditing, onChange:handleLabelChange, onBlur:onEditingEnd, fontStyle:italic ? "italic" : "normal", fontWeight, pointerEvents:!!label}), 
        (0,import_jsx_runtime66.jsx)(SVGContainer, {opacity:isErasing ? 0.2 : opacity, children:(0,import_jsx_runtime66.jsxs)("g", {transform:`translate(${x2}, ${y2})`, children:[(0,import_jsx_runtime66.jsx)("polygon", {className:isSelected || !noFill ? "tl-hitarea-fill" : "tl-hitarea-stroke", points:path}), (0,import_jsx_runtime66.jsx)("polygon", {points:path, stroke:getComputedColor(stroke, "stroke"), fill:noFill ? "none" : getComputedColor(fill, "background"), strokeWidth, rx:2, ry:2, strokeLinejoin:"round", 
        strokeDasharray:"dashed" === strokeType ? "8 2" : void 0})]})})]}));
      }));
      __publicField(this, "setScaleLevel", v2 => __async(this, null, function*() {
        this.update({scaleLevel:v2, fontSize:levelToScale9[null != v2 ? v2 : "md"], strokeWidth:levelToScale9[null != v2 ? v2 : "md"] / 10});
        this.onResetBounds();
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const {offset:[x2, y2], props:{strokeWidth, isLocked}} = this;
        return (0,import_jsx_runtime66.jsx)("g", {children:(0,import_jsx_runtime66.jsx)("polygon", {transform:`translate(${x2}, ${y2})`, points:this.getVertices(strokeWidth / 2).join(), strokeDasharray:isLocked ? "8 2" : "undefined"})});
      }));
      __publicField(this, "validateProps", props => {
        void 0 !== props.sides && (props.sides = Math.max(props.sides, 3));
        return withClampedStyles(this, props);
      });
    }
    get scaleLevel() {
      var _a3;
      return null != (_a3 = this.props.scaleLevel) ? _a3 : "md";
    }
    getShapeSVGJsx(opts) {
      const {offset:[x2, y2], props:{stroke, fill, noFill, strokeWidth, opacity, strokeType}} = this;
      opts = this.getVertices(strokeWidth / 2).join();
      return (0,import_jsx_runtime66.jsxs)("g", {transform:`translate(${x2}, ${y2})`, opacity, children:[(0,import_jsx_runtime66.jsx)("polygon", {className:noFill ? "tl-hitarea-stroke" : "tl-hitarea-fill", points:opts}), (0,import_jsx_runtime66.jsx)("polygon", {points:opts, stroke:getComputedColor(stroke, "stroke"), fill:noFill ? "none" : getComputedColor(fill, "background"), strokeWidth, rx:2, ry:2, strokeLinejoin:"round", strokeDasharray:"dashed" === strokeType ? "8 2" : void 0})]});
    }
  };
  __publicField(PolygonShape, "id", "polygon");
  __publicField(PolygonShape, "defaultProps", {id:"polygon", parentId:"page", type:"polygon", point:[0, 0], size:[100, 100], sides:3, ratio:1, isFlippedY:!1, stroke:"", fill:"", fontWeight:400, fontSize:20, italic:!1, noFill:!1, strokeType:"line", strokeWidth:2, opacity:1, label:""});
  __decorateClass([computed], PolygonShape.prototype, "scaleLevel", 1);
  __decorateClass([action], PolygonShape.prototype, "setScaleLevel", 2);
  var React54 = __toESM(require("module$react")), import_jsx_runtime67 = require("module$node_modules$react$jsx_runtime"), levelToScale10 = {xs:10, sm:16, md:20, lg:32, xl:48, xxl:60}, TextShape = class extends TLTextShape {
    constructor() {
      super(...arguments);
      __publicField(this, "ReactComponent", observer(({events, isErasing, isEditing, onEditingEnd}) => {
        const {props:{opacity, fontFamily, fontSize, fontWeight, italic, lineHeight, text, stroke, padding}} = this, rInput = React54.useRef(null), rIsMounted = React54.useRef(!1), rInnerWrapper = React54.useRef(null), handleChange = React54.useCallback(e => {
          const {isSizeLocked} = this.props;
          e = TextUtils.normalizeText(e.currentTarget.value);
          isSizeLocked ? this.update({text:e, size:this.getAutoSizedBoundingBox({text:e})}) : this.update({text:e});
        }, []), handleKeyDown = React54.useCallback(e => {
          if ("Escape" !== e.key) {
            if ("Tab" === e.key && 0 === text.length) {
              e.preventDefault();
            } else {
              if ("Meta" !== e.key && !e.metaKey) {
                e.stopPropagation();
              } else if ("z" === e.key && e.metaKey) {
                e.shiftKey ? document.execCommand("redo", !1) : document.execCommand("undo", !1);
                e.stopPropagation();
                e.preventDefault();
                return;
              }
              "Tab" === e.key && (e.preventDefault(), e.shiftKey ? TextAreaUtils.unindent(e.currentTarget) : TextAreaUtils.indent(e.currentTarget), this.update({text:TextUtils.normalizeText(e.currentTarget.value)}));
            }
          }
        }, []), handleBlur = React54.useCallback(e => {
          isEditing && (null == onEditingEnd || onEditingEnd());
        }, [onEditingEnd]), handleFocus = React54.useCallback(e => {
          isEditing && rIsMounted.current && document.activeElement === e.currentTarget && e.currentTarget.select();
        }, [isEditing]), handlePointerDown = React54.useCallback(e => {
          isEditing && e.stopPropagation();
        }, [isEditing]);
        React54.useEffect(() => {
          isEditing && requestAnimationFrame(() => {
            rIsMounted.current = !0;
            const elm = rInput.current;
            elm && (elm.focus(), elm.select());
          });
        }, [isEditing, onEditingEnd]);
        React54.useLayoutEffect(() => {
          if (0 === this.props.size[0] || 0 === this.props.size[1]) {
            this.onResetBounds();
          }
        }, []);
        return (0,import_jsx_runtime67.jsx)(HTMLContainer, __spreadProps(__spreadValues({}, events), {opacity:isErasing ? 0.2 : opacity, children:(0,import_jsx_runtime67.jsx)("div", {ref:rInnerWrapper, className:"tl-text-shape-wrapper", "data-hastext":!!text, "data-isediting":isEditing, style:{fontFamily, fontStyle:italic ? "italic" : "normal", fontSize, fontWeight, padding, lineHeight, color:getComputedColor(stroke, "text")}, children:isEditing ? (0,import_jsx_runtime67.jsx)("textarea", {ref:rInput, 
        className:"tl-text-shape-input", name:"text", tabIndex:-1, autoComplete:"false", autoCapitalize:"false", autoCorrect:"false", autoSave:"false", placeholder:"", spellCheck:"true", wrap:"off", dir:"auto", datatype:"wysiwyg", defaultValue:text, onFocus:handleFocus, onChange:handleChange, onKeyDown:handleKeyDown, onBlur:handleBlur, onPointerDown:handlePointerDown}) : (0,import_jsx_runtime67.jsxs)(import_jsx_runtime67.Fragment, {children:[text, "​"]})})}));
      }));
      __publicField(this, "setScaleLevel", v2 => __async(this, null, function*() {
        this.update({scaleLevel:v2, fontSize:levelToScale10[null != v2 ? v2 : "md"]});
        this.onResetBounds();
      }));
      __publicField(this, "ReactIndicator", observer(({isEditing}) => {
        const {props:{borderRadius, isLocked}, bounds} = this;
        return isEditing ? null : (0,import_jsx_runtime67.jsx)("rect", {width:bounds.width, height:bounds.height, rx:borderRadius, ry:borderRadius, fill:"transparent", strokeDasharray:isLocked ? "8 2" : "undefined"});
      }));
      __publicField(this, "validateProps", props => withClampedStyles(this, props));
      __publicField(this, "getBounds", () => {
        const [x2, y2] = this.props.point, [width, height] = this.props.size;
        return {minX:x2, minY:y2, maxX:x2 + width, maxY:y2 + height, width, height};
      });
      __publicField(this, "onResizeStart", ({isSingle}) => {
        var _a3;
        if (!isSingle) {
          return this;
        }
        this.scale = [...(null != (_a3 = this.props.scale) ? _a3 : [1, 1])];
        return this.update({isSizeLocked:!1});
      });
      __publicField(this, "onResetBounds", () => {
        this.update({size:this.getAutoSizedBoundingBox(), isSizeLocked:!0});
        return this;
      });
    }
    get scaleLevel() {
      var _a3;
      return null != (_a3 = this.props.scaleLevel) ? _a3 : "md";
    }
    getAutoSizedBoundingBox(props = {}) {
      const {text = this.props.text, fontFamily = this.props.fontFamily, fontSize = this.props.fontSize, fontWeight = this.props.fontWeight, lineHeight = this.props.lineHeight, padding = this.props.padding} = props, [width, height] = getTextLabelSize(text, {fontFamily, fontSize, lineHeight, fontWeight}, padding);
      return [width, height];
    }
    getShapeSVGJsx() {
      var ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes("webkit") && !ua.includes("chrome")) {
        return super.getShapeSVGJsx(null);
      }
      const {props:{text, stroke, fontSize, fontFamily}} = this;
      ua = this.getBounds();
      return (0,import_jsx_runtime67.jsx)("foreignObject", {width:ua.width, height:ua.height, children:(0,import_jsx_runtime67.jsx)("div", {style:{color:getComputedColor(stroke, "text"), fontSize, fontFamily, display:"contents"}, children:text})});
    }
  };
  __publicField(TextShape, "id", "text");
  __publicField(TextShape, "defaultProps", {id:"box", parentId:"page", type:"text", point:[0, 0], size:[0, 0], isSizeLocked:!0, text:"", lineHeight:1.2, fontSize:20, fontWeight:400, italic:!1, padding:4, fontFamily:"var(--ls-font-family)", borderRadius:0, stroke:"", fill:"", noFill:!0, strokeType:"line", strokeWidth:2, opacity:1});
  __decorateClass([computed], TextShape.prototype, "scaleLevel", 1);
  __decorateClass([action], TextShape.prototype, "setScaleLevel", 2);
  var React55 = __toESM(require("module$react")), import_jsx_runtime68 = require("module$node_modules$react$jsx_runtime"), VideoShape = class extends TLBoxShape {
    constructor() {
      super(...arguments);
      __publicField(this, "canFlip", !1);
      __publicField(this, "canEdit", !0);
      __publicField(this, "canChangeAspectRatio", !1);
      __publicField(this, "ReactComponent", observer(({events, isErasing, asset, isEditing}) => {
        const {props:{opacity}} = this, isMoving = useCameraMovingRef();
        var app = useApp();
        const isSelected = app.selectedIds.has(this.id), tlEventsEnabled = isMoving || isSelected && !isEditing || "select" !== app.selectedTool.id;
        app = React55.useCallback(e => {
          tlEventsEnabled || e.stopPropagation();
        }, [tlEventsEnabled]);
        const {handlers} = React55.useContext(LogseqContext);
        return (0,import_jsx_runtime68.jsx)(HTMLContainer, __spreadProps(__spreadValues({style:{overflow:"hidden", pointerEvents:"all", opacity:isErasing ? 0.2 : opacity}}, events), {children:(0,import_jsx_runtime68.jsx)("div", {onWheelCapture:app, onPointerDown:app, onPointerUp:app, className:"tl-video-container", style:{pointerEvents:isMoving || !isEditing && !isSelected ? "none" : "all", overflow:isEditing ? "auto" : "hidden"}, children:asset && (0,import_jsx_runtime68.jsx)("video", {controls:!0, 
        src:handlers ? handlers.makeAssetUrl(asset.src) : asset.src})})}));
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const {props:{size:[w2, h2], isLocked}} = this;
        return (0,import_jsx_runtime68.jsx)("rect", {width:w2, height:h2, fill:"transparent", strokeDasharray:isLocked ? "8 2" : "undefined"});
      }));
    }
  };
  __publicField(VideoShape, "id", "video");
  __publicField(VideoShape, "defaultProps", {id:"video1", parentId:"page", type:"video", point:[0, 0], size:[100, 100], opacity:1, assetId:"", clipping:0, isAspectRatioLocked:!0});
  var import_jsx_runtime69 = require("module$node_modules$react$jsx_runtime"), YOUTUBE_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/, _YouTubeShape = class extends TLBoxShape {
    constructor() {
      super(...arguments);
      __publicField(this, "aspectRatio", 480 / 853);
      __publicField(this, "canChangeAspectRatio", !1);
      __publicField(this, "canFlip", !1);
      __publicField(this, "canEdit", !0);
      __publicField(this, "onYoutubeLinkChange", url => {
        this.update({url, size:_YouTubeShape.defaultProps.size});
      });
      __publicField(this, "ReactComponent", observer(({events, isErasing, isEditing}) => {
        const app = useApp();
        return (0,import_jsx_runtime69.jsx)(HTMLContainer, __spreadProps(__spreadValues({style:{overflow:"hidden", pointerEvents:"all", opacity:isErasing ? 0.2 : 1}}, events), {children:(0,import_jsx_runtime69.jsx)("div", {className:"rounded-lg w-full h-full relative overflow-hidden shadow-xl tl-youtube-container", style:{pointerEvents:isEditing || app.readOnly ? "all" : "none", userSelect:"none", background:`url('https://img.youtube.com/vi/${this.embedId}/mqdefault.jpg') no-repeat center/cover`}, 
        children:this.embedId ? (0,import_jsx_runtime69.jsx)("div", {style:{overflow:"hidden", position:"relative", height:"100%"}, children:(0,import_jsx_runtime69.jsx)("iframe", {className:"absolute inset-0 w-full h-full m-0", width:"853", height:"480", src:`https://www.youtube.com/embed/${this.embedId}`, frameBorder:"0", allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen:!0, title:"Embedded youtube"})}) : (0,import_jsx_runtime69.jsx)("div", 
        {className:"w-full h-full flex items-center justify-center p-4", style:{backgroundColor:"var(--ls-primary-background-color)"}, children:(0,import_jsx_runtime69.jsx)("svg", {xmlns:"http://www.w3.org/2000/svg", viewBox:"0 0 502 210.649", height:"210.65", width:"128", children:(0,import_jsx_runtime69.jsxs)("g", {children:[(0,import_jsx_runtime69.jsx)("path", {d:"M498.333 45.7s-2.91-20.443-11.846-29.447C475.157 4.44 462.452 4.38 456.627 3.687c-41.7-3-104.25-3-104.25-3h-.13s-62.555 0-104.255 3c-5.826.693-18.523.753-29.86 12.566-8.933 9.004-11.84 29.447-11.84 29.447s-2.983 24.003-2.983 48.009v22.507c0 24.006 2.983 48.013 2.983 48.013s2.907 20.44 11.84 29.446c11.337 11.817 26.23 11.44 32.86 12.677 23.84 2.28 101.315 2.983 101.315 2.983s62.62-.094 104.32-3.093c5.824-.694 18.527-.75 29.857-12.567 8.936-9.006 11.846-29.446 11.846-29.446s2.98-24.007 2.98-48.013V93.709c0-24.006-2.98-48.01-2.98-48.01", 
        fill:"#cd201f"}), (0,import_jsx_runtime69.jsx)("g", {children:(0,import_jsx_runtime69.jsx)("path", {d:"M187.934 169.537h-18.96V158.56c-7.19 8.24-13.284 12.4-19.927 12.4-5.826 0-9.876-2.747-11.9-7.717-1.23-3.02-2.103-7.736-2.103-14.663V68.744h18.957v81.833c.443 2.796 1.636 3.823 4.043 3.823 3.63 0 6.913-3.153 10.93-8.817V68.744h18.96v100.793zM102.109 139.597c.996 9.98-2.1 14.93-7.987 14.93s-8.98-4.95-7.98-14.93v-39.92c-1-9.98 2.093-14.657 7.98-14.657 5.89 0 8.993 4.677 7.996 14.657l-.01 39.92zm18.96-37.923c0-10.77-2.164-18.86-5.987-23.95-5.054-6.897-12.973-9.72-20.96-9.72-9.033 0-15.913 2.823-20.957 9.72-3.886 5.09-5.97 13.266-5.97 24.036l-.016 35.84c0 10.71 1.853 18.11 5.736 23.153 5.047 6.873 13.227 10.513 21.207 10.513 7.986 0 16.306-3.64 21.36-10.513 3.823-5.043 5.586-12.443 5.586-23.153v-35.926zM46.223 114.647v54.889h-19.96v-54.89S5.582 47.358 1.314 34.815H22.27L36.277 87.38l13.936-52.566H71.17l-24.947 79.833z"})}), 
        (0,import_jsx_runtime69.jsxs)("g", {fill:"#fff", children:[(0,import_jsx_runtime69.jsx)("path", {d:"M440.413 96.647c0-9.33 2.557-11.874 8.59-11.874 5.99 0 8.374 2.777 8.374 11.997v10.893l-16.964.02V96.647zm35.96 25.986l-.003-20.4c0-10.656-2.1-18.456-5.88-23.5-5.06-6.823-12.253-10.436-21.317-10.436-9.226 0-16.42 3.613-21.643 10.436-3.84 5.044-6.076 13.28-6.076 23.943v34.927c0 10.596 2.46 18.013 6.296 23.003 5.227 6.813 12.42 10.216 21.87 10.216 9.44 0 16.853-3.566 21.85-10.81 2.2-3.196 3.616-6.82 4.226-10.823.164-1.81.64-5.933.64-11.753v-2.827h-18.96c0 7.247.037 11.557-.133 12.54-1.033 4.834-3.623 7.25-8.07 7.25-6.203 0-8.826-4.636-8.76-13.843v-17.923h35.96zM390.513 140.597c0 9.98-2.353 13.806-7.563 13.806-2.973 0-6.4-1.53-9.423-4.553l.02-60.523c3.02-2.98 6.43-4.55 9.403-4.55 5.21 0 7.563 2.93 7.563 12.91v42.91zm2.104-72.453c-6.647 0-13.253 4.087-19.09 11.27l.02-43.603h-17.963V169.54h17.963l.027-10.05c6.036 7.47 12.62 11.333 19.043 11.333 7.193 0 12.45-3.85 14.863-11.267 1.203-4.226 1.993-10.733 1.993-19.956V99.684c0-9.447-1.21-15.907-2.416-19.917-2.41-7.466-7.247-11.623-14.44-11.623M340.618 169.537h-18.956V158.56c-7.193 8.24-13.283 12.4-19.926 12.4-5.827 0-9.877-2.747-11.9-7.717-1.234-3.02-2.107-7.736-2.107-14.663V69.744h18.96v80.833c.443 2.796 1.633 3.823 4.043 3.823 3.63 0 6.913-3.153 10.93-8.817V69.744h18.957v99.793z"}), 
        (0,import_jsx_runtime69.jsx)("path", {d:"M268.763 169.537h-19.956V54.77h-20.956V35.835l62.869-.024v18.96h-21.957v114.766z"})]})]})})})})}));
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const {props:{size:[w2, h2], isLocked}} = this;
        return (0,import_jsx_runtime69.jsx)("rect", {width:w2, height:h2, fill:"transparent", rx:8, ry:8, strokeDasharray:isLocked ? "8 2" : "undefined"});
      }));
      __publicField(this, "validateProps", props => {
        void 0 !== props.size && (props.size[0] = Math.max(props.size[0], 1), props.size[1] = Math.max(props.size[0] * this.aspectRatio, 1));
        return withClampedStyles(this, props);
      });
    }
    get embedId() {
      var _a3, _b;
      const url = this.props.url, match = url.match(YOUTUBE_REGEX);
      return null != (_b = null != (_a3 = null == match ? void 0 : match[1]) ? _a3 : url) ? _b : "";
    }
    getShapeSVGJsx() {
      const bounds = this.getBounds(), embedId = this.embedId;
      return embedId ? (0,import_jsx_runtime69.jsxs)("g", {children:[(0,import_jsx_runtime69.jsx)("image", {width:bounds.width, height:bounds.height, href:`https://img.youtube.com/vi/${embedId}/mqdefault.jpg`, className:"grayscale-[50%]"}), (0,import_jsx_runtime69.jsx)("svg", {x:bounds.width / 4, y:bounds.height / 4, width:bounds.width / 2, height:bounds.height / 2, viewBox:"0 0 15 15", fill:"none", xmlns:"http://www.w3.org/2000/svg", children:(0,import_jsx_runtime69.jsx)("path", {d:"M4.76447 3.12199C5.63151 3.04859 6.56082 3 7.5 3C8.43918 3 9.36849 3.04859 10.2355 3.12199C11.2796 3.21037 11.9553 3.27008 12.472 3.39203C12.9425 3.50304 13.2048 3.64976 13.4306 3.88086C13.4553 3.90618 13.4902 3.94414 13.5133 3.97092C13.7126 4.20149 13.8435 4.4887 13.918 5.03283C13.9978 5.6156 14 6.37644 14 7.52493C14 8.66026 13.9978 9.41019 13.9181 9.98538C13.8439 10.5206 13.7137 10.8061 13.5125 11.0387C13.4896 11.0651 13.4541 11.1038 13.4296 11.1287C13.2009 11.3625 12.9406 11.5076 12.4818 11.6164C11.9752 11.7365 11.3143 11.7942 10.2878 11.8797C9.41948 11.9521 8.47566 12 7.5 12C6.52434 12 5.58052 11.9521 4.7122 11.8797C3.68572 11.7942 3.02477 11.7365 2.51816 11.6164C2.05936 11.5076 1.7991 11.3625 1.57037 11.1287C1.54593 11.1038 1.51035 11.0651 1.48748 11.0387C1.28628 10.8061 1.15612 10.5206 1.08193 9.98538C1.00221 9.41019 1 8.66026 1 7.52493C1 6.37644 1.00216 5.6156 1.082 5.03283C1.15654 4.4887 1.28744 4.20149 1.48666 3.97092C1.5098 3.94414 1.54468 3.90618 1.56942 3.88086C1.7952 3.64976 2.05752 3.50304 2.52796 3.39203C3.04473 3.27008 3.7204 3.21037 4.76447 3.12199ZM0 7.52493C0 5.28296 0 4.16198 0.729985 3.31713C0.766457 3.27491 0.815139 3.22194 0.854123 3.18204C1.63439 2.38339 2.64963 2.29744 4.68012 2.12555C5.56923 2.05028 6.52724 2 7.5 2C8.47276 2 9.43077 2.05028 10.3199 2.12555C12.3504 2.29744 13.3656 2.38339 14.1459 3.18204C14.1849 3.22194 14.2335 3.27491 14.27 3.31713C15 4.16198 15 5.28296 15 7.52493C15 9.74012 15 10.8477 14.2688 11.6929C14.2326 11.7348 14.1832 11.7885 14.1444 11.8281C13.3629 12.6269 12.3655 12.71 10.3709 12.8763C9.47971 12.9505 8.50782 13 7.5 13C6.49218 13 5.52028 12.9505 4.62915 12.8763C2.63446 12.71 1.63712 12.6269 0.855558 11.8281C0.816844 11.7885 0.767442 11.7348 0.731221 11.6929C0 10.8477 0 9.74012 0 7.52493ZM5.25 5.38264C5.25 5.20225 5.43522 5.08124 5.60041 5.15369L10.428 7.27105C10.6274 7.35853 10.6274 7.64147 10.428 7.72895L5.60041 9.84631C5.43522 9.91876 5.25 9.79775 5.25 9.61736V5.38264Z", 
      fill:"#D10014", fillRule:"evenodd", clipRule:"evenodd"})})]}) : super.getShapeSVGJsx({});
    }
  }, YouTubeShape = _YouTubeShape;
  __publicField(YouTubeShape, "id", "youtube");
  __publicField(YouTubeShape, "defaultProps", {id:"youtube", type:"youtube", parentId:"page", point:[0, 0], size:[853, 480], url:""});
  __decorateClass([computed], YouTubeShape.prototype, "embedId", 1);
  __decorateClass([action], YouTubeShape.prototype, "onYoutubeLinkChange", 2);
  var React56 = __toESM(require("module$react")), import_jsx_runtime70 = require("module$node_modules$react$jsx_runtime"), X_OR_TWITTER_REGEX = /https?:\/\/(x|twitter).com\/[0-9a-zA-Z_]{1,20}\/status\/([0-9]*)/, _TweetShape = class extends TLBoxShape {
    constructor() {
      super(...arguments);
      __publicField(this, "canFlip", !1);
      __publicField(this, "canEdit", !0);
      __publicField(this, "initialHeightCalculated", !0);
      __publicField(this, "getInnerHeight", null);
      __publicField(this, "onTwitterLinkChange", url => {
        this.update({url, size:_TweetShape.defaultProps.size});
      });
      __publicField(this, "ReactComponent", observer(({events, isErasing, isEditing}) => {
        const {renderers:{Tweet}} = React56.useContext(LogseqContext), app = useApp(), cpRefContainer = React56.useRef(null), [, innerHeight] = this.useComponentSize(cpRefContainer);
        React56.useEffect(() => {
          var _a3, _b;
          const newHeight = null != (_b = null == (_a3 = this.getInnerHeight) ? void 0 : _a3.call(this)) ? _b : innerHeight;
          innerHeight && 1 < Math.abs(newHeight - this.props.size[1]) && (this.update({size:[this.props.size[0], newHeight]}), app.persist());
        }, [innerHeight]);
        React56.useEffect(() => {
          this.initialHeightCalculated || setTimeout(() => {
            this.onResetBounds();
            app.persist();
          });
        }, [this.initialHeightCalculated]);
        return (0,import_jsx_runtime70.jsx)(HTMLContainer, __spreadProps(__spreadValues({style:{overflow:"hidden", pointerEvents:"all", opacity:isErasing ? 0.2 : 1}}, events), {children:(0,import_jsx_runtime70.jsx)("div", {className:"rounded-xl w-full h-full relative shadow-xl tl-tweet-container", style:{pointerEvents:isEditing || app.readOnly ? "all" : "none", userSelect:"none"}, children:this.embedId ? (0,import_jsx_runtime70.jsx)("div", {ref:cpRefContainer, children:(0,import_jsx_runtime70.jsx)(Tweet, 
        {tweetId:this.embedId})}) : null})}));
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const {props:{size:[w2, h2], isLocked}} = this;
        return (0,import_jsx_runtime70.jsx)("rect", {width:w2, height:h2, fill:"transparent", rx:8, ry:8, strokeDasharray:isLocked ? "8 2" : "undefined"});
      }));
      __publicField(this, "onResetBounds", info => {
        info = this.getAutoResizeHeight();
        null !== info && 1 < Math.abs(info - this.props.size[1]) && (this.update({size:[this.props.size[0], info]}), this.initialHeightCalculated = !0);
        return this;
      });
      __publicField(this, "onResize", (initialProps, info) => {
        var _a3;
        const {bounds, rotation, scale:[scaleX, scaleY]} = info;
        initialProps = [...this.scale];
        0 > scaleX && (initialProps[0] *= -1);
        0 > scaleY && (initialProps[1] *= -1);
        info = null != (_a3 = this.getAutoResizeHeight()) ? _a3 : bounds.height;
        return this.update({point:[bounds.minX, bounds.minY], size:[Math.max(1, bounds.width), Math.max(1, info)], scale:initialProps, rotation});
      });
      __publicField(this, "validateProps", props => {
        void 0 !== props.size && (props.size[0] = Math.min(Math.max(props.size[0], 300), 550), props.size[1] = Math.max(props.size[1], 1));
        return withClampedStyles(this, props);
      });
    }
    get embedId() {
      var _a3, _b;
      const url = this.props.url, match = url.match(X_OR_TWITTER_REGEX);
      return null != (_b = null != (_a3 = null == match ? void 0 : match[1]) ? _a3 : url) ? _b : "";
    }
    useComponentSize(ref, selector = "") {
      const [size, setSize] = React56.useState([0, 0]), app = useApp();
      React56.useEffect(() => {
        if (null == ref ? 0 : ref.current) {
          const el = selector ? ref.current.querySelector(selector) : ref.current;
          if (el) {
            const updateSize = () => {
              const {width, height} = el.getBoundingClientRect(), bound = src_default.div([width, height], app.viewport.camera.zoom);
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
      return this.getInnerHeight ? this.getInnerHeight() : null;
    }
    getShapeSVGJsx() {
      const bounds = this.getBounds();
      return this.embedId ? (0,import_jsx_runtime70.jsxs)("g", {children:[(0,import_jsx_runtime70.jsx)("rect", {width:bounds.width, height:bounds.height, fill:"#15202b", rx:8, ry:8}), (0,import_jsx_runtime70.jsx)("svg", {x:bounds.width / 4, y:bounds.height / 4, width:bounds.width / 2, height:bounds.height / 2, viewBox:"0 0 15 15", fill:"none", xmlns:"http://www.w3.org/2000/svg", children:(0,import_jsx_runtime70.jsx)("path", {d:"m13.464 4.4401c0.0091 0.13224 0.0091 0.26447 0.0091 0.39793 0 4.0664-3.0957 8.7562-8.7562 8.7562v-0.0024c-1.6721 0.0024-3.3095-0.47658-4.7172-1.3797 0.24314 0.02925 0.48751 0.04387 0.73248 0.04448 1.3857 0.0013 2.7319-0.46374 3.8221-1.3199-1.3169-0.024981-2.4717-0.8836-2.8751-2.1371 0.4613 0.08897 0.93662 0.070688 1.3894-0.053016-1.4357-0.29007-2.4686-1.5515-2.4686-3.0165v-0.039001c0.42779 0.23827 0.90676 0.37051 1.3967 0.38513-1.3522-0.90372-1.769-2.7026-0.95247-4.1091 1.5625 1.9226 3.8678 3.0914 6.3425 3.2151-0.24802-1.0689 0.090798-2.1889 0.89031-2.9403 1.2395-1.1651 3.1889-1.1054 4.3541 0.13346 0.68921-0.13589 1.3498-0.38879 1.9543-0.74711-0.22974 0.71237-0.71054 1.3175-1.3528 1.702 0.60999-0.071907 1.206-0.23522 1.7672-0.48446-0.41316 0.61913-0.93358 1.1584-1.5356 1.5942z", 
      fill:"#1d9bf0", fillRule:"evenodd", clipRule:"evenodd"})})]}) : super.getShapeSVGJsx({});
    }
  }, TweetShape = _TweetShape;
  __publicField(TweetShape, "id", "tweet");
  __publicField(TweetShape, "defaultProps", {id:"tweet", type:"tweet", parentId:"page", point:[0, 0], size:[331, 290], url:""});
  __decorateClass([computed], TweetShape.prototype, "embedId", 1);
  __decorateClass([action], TweetShape.prototype, "onTwitterLinkChange", 2);
  var React57 = __toESM(require("module$react")), import_jsx_runtime71 = require("module$node_modules$react$jsx_runtime"), PdfShape = class extends TLBoxShape {
    constructor() {
      super(...arguments);
      __publicField(this, "frameRef", React57.createRef());
      __publicField(this, "canChangeAspectRatio", !0);
      __publicField(this, "canFlip", !0);
      __publicField(this, "canEdit", !0);
      __publicField(this, "ReactComponent", observer(({events, asset, isErasing, isEditing}) => {
        React57.useRef(null);
        const {handlers} = React57.useContext(LogseqContext);
        useApp();
        const isMoving = useCameraMovingRef();
        return (0,import_jsx_runtime71.jsx)(HTMLContainer, __spreadProps(__spreadValues({style:{overflow:"hidden", pointerEvents:"all", opacity:isErasing ? 0.2 : 1}}, events), {children:asset ? (0,import_jsx_runtime71.jsx)("embed", {src:handlers ? handlers.inflateAsset(asset.src).url : asset.src, className:"relative tl-pdf-container", onWheelCapture:stop, onPointerDown:stop, onPointerUp:stop, style:{width:"100%", height:"100%", pointerEvents:!isMoving && isEditing ? "all" : "none"}}) : null}));
      }));
      __publicField(this, "ReactIndicator", observer(() => {
        const {props:{size:[w2, h2], isLocked}} = this;
        return (0,import_jsx_runtime71.jsx)("rect", {width:w2, height:h2, fill:"transparent", rx:8, ry:8, strokeDasharray:isLocked ? "8 2" : "undefined"});
      }));
    }
  };
  __publicField(PdfShape, "id", "pdf");
  __publicField(PdfShape, "defaultProps", {id:"pdf", type:"pdf", parentId:"page", point:[0, 0], size:[595, 842], assetId:""});
  require("module$node_modules$react$jsx_runtime");
  var shapes = [BoxShape, EllipseShape, HighlighterShape, ImageShape, VideoShape, LineShape, PencilShape, PolygonShape, TextShape, YouTubeShape, TweetShape, IFrameShape, HTMLShape, PdfShape, LogseqPortalShape, GroupShape], BoxTool = class extends TLBoxTool {
    constructor() {
      super(...arguments);
      __publicField(this, "Shape", BoxShape);
    }
  };
  __publicField(BoxTool, "id", "box");
  __publicField(BoxTool, "shortcut", "whiteboard/rectangle");
  var EllipseTool = class extends TLBoxTool {
    constructor() {
      super(...arguments);
      __publicField(this, "Shape", EllipseShape);
    }
  };
  __publicField(EllipseTool, "id", "ellipse");
  __publicField(EllipseTool, "shortcut", "whiteboard/ellipse");
  var NuEraseTool = class extends TLEraseTool {
  };
  __publicField(NuEraseTool, "id", "erase");
  __publicField(NuEraseTool, "shortcut", "whiteboard/eraser");
  var HighlighterTool = class extends TLDrawTool {
    constructor() {
      super(...arguments);
      __publicField(this, "Shape", HighlighterShape);
      __publicField(this, "simplify", !0);
      __publicField(this, "simplifyTolerance", 0.618);
    }
  };
  __publicField(HighlighterTool, "id", "highlighter");
  __publicField(HighlighterTool, "shortcut", "whiteboard/highlighter");
  var LineTool = class extends TLLineTool {
    constructor() {
      super(...arguments);
      __publicField(this, "Shape", LineShape);
    }
  };
  __publicField(LineTool, "id", "line");
  __publicField(LineTool, "shortcut", "whiteboard/connector");
  var PencilTool = class extends TLDrawTool {
    constructor() {
      super(...arguments);
      __publicField(this, "Shape", PencilShape);
      __publicField(this, "simplify", !1);
    }
  };
  __publicField(PencilTool, "id", "pencil");
  __publicField(PencilTool, "shortcut", "whiteboard/pencil");
  var PolygonTool = class extends TLBoxTool {
    constructor() {
      super(...arguments);
      __publicField(this, "Shape", PolygonShape);
    }
  };
  __publicField(PolygonTool, "id", "polygon");
  var TextTool = class extends TLTextTool {
    constructor() {
      super(...arguments);
      __publicField(this, "Shape", TextShape);
    }
  };
  __publicField(TextTool, "id", "text");
  __publicField(TextTool, "shortcut", "whiteboard/text");
  var YouTubeTool = class extends TLBoxTool {
    constructor() {
      super(...arguments);
      __publicField(this, "Shape", YouTubeShape);
    }
  };
  __publicField(YouTubeTool, "id", "youtube");
  var CreatingState6 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "creatingShape");
      __publicField(this, "offset", [0, 0]);
      __publicField(this, "onEnter", () => {
        this.app.history.pause();
        transaction(() => {
          var point = src_default.sub(this.app.inputs.originPoint, this.offset);
          this.app.settings.snapToGrid && (point = src_default.snap(point, 8));
          this.creatingShape = point = new LogseqPortalShape({id:v1_default(), parentId:this.app.currentPage.id, point, size:LogseqPortalShape.defaultProps.size, fill:this.app.settings.color, stroke:this.app.settings.color});
          this.app.currentPage.addShapes(point);
          this.app.setEditingShape(point);
          this.app.setSelectedShapes([point]);
        });
      });
      __publicField(this, "onPointerDown", info => {
        switch(info.type) {
          case "shape":
            if (info.shape === this.creatingShape) {
              break;
            }
            this.app.selectTool("select");
            break;
          case "canvas":
            info.order || this.app.selectTool("select");
        }
      });
      __publicField(this, "onExit", () => {
        var _a3;
        this.creatingShape && (this.app.history.resume(), (null == (_a3 = this.creatingShape) ? 0 : _a3.props.pageId) ? this.app.setSelectedShapes([this.creatingShape.id]) : (this.app.deleteShapes([this.creatingShape.id]), this.app.setEditingShape()), this.creatingShape = void 0);
      });
    }
  };
  __publicField(CreatingState6, "id", "creating");
  var IdleState9 = class extends TLToolState {
    constructor() {
      super(...arguments);
      __publicField(this, "cursor", "crosshair");
      __publicField(this, "onPointerDown", e => {
        this.tool.transition("creating");
      });
    }
  };
  __publicField(IdleState9, "id", "idle");
  var LogseqPortalTool = class extends TLTool {
    constructor() {
      super(...arguments);
      __publicField(this, "Shape", LogseqPortalShape);
      __publicField(this, "onPinch", info => {
        this.app.viewport.pinchZoom(info.point, info.delta, info.delta[2]);
      });
    }
  };
  __publicField(LogseqPortalTool, "id", "logseq-portal");
  __publicField(LogseqPortalTool, "shortcut", "whiteboard/portal");
  __publicField(LogseqPortalTool, "states", [IdleState9, CreatingState6]);
  __publicField(LogseqPortalTool, "initial", "idle");
  var HTMLTool = class extends TLBoxTool {
    constructor() {
      super(...arguments);
      __publicField(this, "Shape", HTMLShape);
    }
  };
  __publicField(HTMLTool, "id", "youtube");
  var IFrameTool = class extends TLBoxTool {
    constructor() {
      super(...arguments);
      __publicField(this, "Shape", IFrameShape);
    }
  };
  __publicField(IFrameTool, "id", "iframe");
  var import_server = __toESM(require("module$node_modules$react_dom$server_browser")), import_jsx_runtime73 = require("module$node_modules$react$jsx_runtime"), ShapesMap = new Map(shapes.map(shape => [shape.id, shape])), PreviewManager = class {
    constructor(serializedApp) {
      __publicField(this, "shapes");
      __publicField(this, "pageId");
      __publicField(this, "assets");
      serializedApp && this.load(serializedApp);
    }
    load(snapshot) {
      var _a3;
      const page = null == (_a3 = null == snapshot ? void 0 : snapshot.pages) ? void 0 : _a3[0];
      this.pageId = null == page ? void 0 : page.id;
      this.assets = snapshot.assets;
      this.shapes = null == page ? void 0 : page.shapes.map(s2 => {
        var type = s2.type;
        if (!type) {
          throw Error("No shape type provided.");
        }
        const Shape5 = ShapesMap.get(type);
        if (!Shape5) {
          throw Error(`Could not find shape class for ${type}`);
        }
        return new Shape5(s2);
      }).filter(s2 => "group" !== s2.type);
    }
    generatePreviewJsx(viewport, ratio) {
      var _a3, _b;
      const allBounds = [...(null != (_a3 = this.shapes) ? _a3 : []).map(s2 => s2.getRotatedBounds())];
      (_a3 = null == viewport ? void 0 : viewport.currentView) && allBounds.push(_a3);
      let commonBounds = BoundsUtils.getCommonBounds(allBounds);
      if (!commonBounds) {
        return null;
      }
      commonBounds = BoundsUtils.expandBounds(commonBounds, 16);
      commonBounds = ratio ? BoundsUtils.ensureRatio(commonBounds, ratio) : commonBounds;
      const translatePoint = p2 => [(p2[0] - commonBounds.minX).toFixed(2), (p2[1] - commonBounds.minY).toFixed(2)], [vx, vy] = _a3 ? translatePoint([_a3.minX, _a3.minY]) : [0, 0];
      return commonBounds && (0,import_jsx_runtime73.jsxs)("svg", {xmlns:"http://www.w3.org/2000/svg", "data-common-bound-x":commonBounds.minX.toFixed(2), "data-common-bound-y":commonBounds.minY.toFixed(2), "data-common-bound-width":commonBounds.width.toFixed(2), "data-common-bound-height":commonBounds.height.toFixed(2), viewBox:[0, 0, commonBounds.width, commonBounds.height].join(" "), children:[(0,import_jsx_runtime73.jsx)("defs", {children:_a3 && (0,import_jsx_runtime73.jsxs)(import_jsx_runtime73.Fragment, 
      {children:[(0,import_jsx_runtime73.jsx)("rect", {id:this.pageId + "-camera-rect", transform:`translate(${vx}, ${vy})`, width:_a3.width, height:_a3.height}), (0,import_jsx_runtime73.jsxs)("mask", {id:this.pageId + "-camera-mask", children:[(0,import_jsx_runtime73.jsx)("rect", {width:commonBounds.width, height:commonBounds.height, fill:"white"}), (0,import_jsx_runtime73.jsx)("use", {href:`#${this.pageId}-camera-rect`, fill:"black"})]})]})}), (0,import_jsx_runtime73.jsx)("g", {id:this.pageId + 
      "-preview-shapes", children:null == (_b = this.shapes) ? void 0 : _b.map(s2 => {
        var _a4, _b2;
        const {bounds, props:{rotation}} = s2, [tx, ty] = translatePoint([bounds.minX, bounds.minY]), r2 = +(180 * ((null != rotation ? rotation : 0) + (null != (_a4 = bounds.rotation) ? _a4 : 0)) / Math.PI).toFixed(2), [rdx, rdy] = [(bounds.width / 2).toFixed(2), (bounds.height / 2).toFixed(2)];
        return (0,import_jsx_runtime73.jsx)("g", {transform:[`translate(${tx}, ${ty})`, `rotate(${r2}, ${rdx}, ${rdy})`].join(" "), children:s2.getShapeSVGJsx({assets:null != (_b2 = this.assets) ? _b2 : []})}, s2.id);
      })}), (0,import_jsx_runtime73.jsx)("rect", {mask:_a3 ? `url(#${this.pageId}-camera-mask)` : "", width:commonBounds.width, height:commonBounds.height, fill:"transparent"}), _a3 && (0,import_jsx_runtime73.jsx)("use", {id:"minimap-camera-rect", "data-x":vx, "data-y":vy, "data-width":_a3.width, "data-height":_a3.height, href:`#${this.pageId}-camera-rect`, fill:"transparent", stroke:"red", strokeWidth:4 / viewport.camera.zoom})]});
    }
    exportAsSVG(ratio) {
      return (ratio = this.generatePreviewJsx(void 0, ratio)) ? import_server.default.renderToString(ratio) : "";
    }
  }, React58 = __toESM(require("module$react")), import_jsx_runtime74 = require("module$node_modules$react$jsx_runtime"), TextInput = React58.forwardRef((_a3, ref) => {
    var {value, className} = _a3;
    _a3 = __objRest(_a3, ["autoResize", "value", "className"]);
    return (0,import_jsx_runtime74.jsx)("div", {className:"tl-input" + (className ? " " + className : ""), children:(0,import_jsx_runtime74.jsxs)("div", {className:"tl-input-sizer", children:[(0,import_jsx_runtime74.jsx)("div", {className:"tl-input-hidden", children:value}), (0,import_jsx_runtime74.jsx)("input", __spreadValues({ref, value, className:"tl-text-input", type:"text"}, _a3))]})});
  }), import_jsx_runtime75 = require("module$node_modules$react$jsx_runtime"), LogseqTypeTag = ({type, active}) => (0,import_jsx_runtime75.jsx)("span", {className:"tl-type-tag", "data-active":active, children:(0,import_jsx_runtime75.jsx)("i", {className:`tie tie-${({B:"block", P:"page", WP:"whiteboard", BA:"new-block", PA:"new-page", WA:"new-whiteboard", BS:"block-search", PS:"page-search"})[type]}`})}), highlightedJSX = (input, keyword) => (0,import_jsx_runtime75.jsx)("span", {children:input.split(new RegExp(`(${keyword.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, 
  "\\$\x26")})`, "gi")).map((part, index2) => 1 === index2 % 2 ? (0,import_jsx_runtime75.jsx)("mark", {className:"tl-highlighted", children:part}) : part).map((frag, idx) => (0,import_jsx_runtime75.jsx)(import_react48.default.Fragment, {children:frag}, idx))}), useSearch = (q2, searchFilter) => {
    const {handlers} = import_react48.default.useContext(LogseqContext), [results, setResults] = import_react48.default.useState(null), dq = useDebouncedValue(q2, 200);
    import_react48.default.useEffect(() => {
      let canceled = !1;
      if (0 < dq.length) {
        const filter2 = {"pages?":!0, "blocks?":!0, "files?":!1};
        "B" === searchFilter ? filter2["pages?"] = !1 : "P" === searchFilter && (filter2["blocks?"] = !1);
        handlers.search(dq, filter2).then(_results => {
          canceled || setResults(_results);
        });
      } else {
        setResults(null);
      }
      return () => {
        canceled = !0;
      };
    }, [dq, null == handlers ? void 0 : handlers.search]);
    return results;
  }, LogseqQuickSearch = observer(({className, style, placeholder:placeholder2, onChange, onBlur, onAddBlock}) => {
    const [q2, setQ] = import_react48.default.useState(LogseqPortalShape.defaultSearchQuery), [searchFilter, setSearchFilter] = import_react48.default.useState(LogseqPortalShape.defaultSearchFilter), rInput = import_react48.default.useRef(null), {handlers, renderers} = import_react48.default.useContext(LogseqContext), t = handlers.t, finishSearching = import_react48.default.useCallback((id3, isPage) => {
      var _a3;
      console.log({id:id3, isPage});
      setTimeout(() => onChange(id3, isPage));
      null == (_a3 = rInput.current) || _a3.blur();
      id3 && (LogseqPortalShape.defaultSearchQuery = "", LogseqPortalShape.defaultSearchFilter = null);
    }, []), handleAddBlock = import_react48.default.useCallback(content => __async(void 0, null, function*() {
      const uuid = yield null == handlers ? void 0 : handlers.addNewBlock(content);
      uuid && (finishSearching(uuid), null == onAddBlock || onAddBlock(uuid));
      return uuid;
    }), [onAddBlock]), optionsWrapperRef = import_react48.default.useRef(null), [focusedOptionIdx, setFocusedOptionIdx] = import_react48.default.useState(0), searchResult = useSearch(q2, searchFilter), [prefixIcon, setPrefixIcon] = import_react48.default.useState("circle-plus"), [showPanel, setShowPanel] = import_react48.default.useState(!1);
    import_react48.default.useEffect(() => {
      setTimeout(() => {
        var _a3;
        null == (_a3 = rInput.current) || _a3.focus();
      });
    }, [searchFilter]);
    import_react48.default.useEffect(() => {
      LogseqPortalShape.defaultSearchQuery = q2;
      LogseqPortalShape.defaultSearchFilter = searchFilter;
    }, [q2, searchFilter]);
    const options = import_react48.default.useMemo(() => {
      var _a3;
      const options2 = [];
      if (null == renderers || !renderers.Breadcrumb || !handlers) {
        return [];
      }
      onAddBlock && options2.push({actionIcon:"circle-plus", onChosen:() => !!handleAddBlock(q2), element:(0,import_jsx_runtime75.jsxs)("div", {className:"tl-quick-search-option-row", children:[(0,import_jsx_runtime75.jsx)(LogseqTypeTag, {active:!0, type:"BA"}), 0 < q2.length ? (0,import_jsx_runtime75.jsxs)(import_jsx_runtime75.Fragment, {children:[(0,import_jsx_runtime75.jsx)("strong", {children:t("whiteboard/new-block")}), q2]}) : (0,import_jsx_runtime75.jsx)("strong", {children:t("whiteboard/new-block-no-colon")})]})});
      (null == (_a3 = null == searchResult ? void 0 : searchResult.pages) ? 0 : _a3.some(p2 => p2.title.toLowerCase() === q2.toLowerCase())) || !q2 || options2.push({actionIcon:"circle-plus", onChosen:() => __async(void 0, null, function*() {
        let result = yield null == handlers ? void 0 : handlers.addNewPage(q2);
        finishSearching(result, !0);
        return !0;
      }), element:(0,import_jsx_runtime75.jsxs)("div", {className:"tl-quick-search-option-row", children:[(0,import_jsx_runtime75.jsx)(LogseqTypeTag, {active:!0, type:"PA"}), (0,import_jsx_runtime75.jsx)("strong", {children:t("whiteboard/new-page")}), q2]})}, {actionIcon:"circle-plus", onChosen:() => __async(void 0, null, function*() {
        let result = yield null == handlers ? void 0 : handlers.addNewWhiteboard(q2);
        finishSearching(result, !0);
        return !0;
      }), element:(0,import_jsx_runtime75.jsxs)("div", {className:"tl-quick-search-option-row", children:[(0,import_jsx_runtime75.jsx)(LogseqTypeTag, {active:!0, type:"WA"}), (0,import_jsx_runtime75.jsx)("strong", {children:t("whiteboard/new-whiteboard")}), q2]})});
      0 === q2.length && null === searchFilter && options2.push({actionIcon:"search", onChosen:() => {
        setSearchFilter("B");
        return !0;
      }, element:(0,import_jsx_runtime75.jsxs)("div", {className:"tl-quick-search-option-row", children:[(0,import_jsx_runtime75.jsx)(LogseqTypeTag, {type:"BS"}), t("whiteboard/search-only-blocks")]})}, {actionIcon:"search", onChosen:() => {
        setSearchFilter("P");
        return !0;
      }, element:(0,import_jsx_runtime75.jsxs)("div", {className:"tl-quick-search-option-row", children:[(0,import_jsx_runtime75.jsx)(LogseqTypeTag, {type:"PS"}), t("whiteboard/search-only-pages")]})});
      searchFilter && "P" !== searchFilter || !searchResult || !searchResult.pages || options2.push(...searchResult.pages.map(page => ({actionIcon:"search", onChosen:() => {
        finishSearching(page.id, !0);
        return !0;
      }, element:(0,import_jsx_runtime75.jsxs)("div", {className:"tl-quick-search-option-row", children:[(0,import_jsx_runtime75.jsx)(LogseqTypeTag, {type:handlers.isWhiteboardPage(page.id) ? "WP" : "P"}), highlightedJSX(page.title, q2)]})})));
      searchFilter && "B" !== searchFilter || !searchResult || !searchResult.blocks || options2.push(...searchResult.blocks.filter(block => block.title && block.uuid).map(({title, uuid}) => {
        const block = handlers.queryBlockByUUID(uuid);
        return {actionIcon:"search", onChosen:() => {
          var _a4, _b, _c;
          return block ? (finishSearching(uuid), null == (_c = null == (_b = null == (_a4 = window.logseq) ? void 0 : _a4.api) ? void 0 : _b.set_blocks_id) || _c.call(_b, [uuid]), !0) : !1;
        }, element:(0,import_jsx_runtime75.jsx)(import_jsx_runtime75.Fragment, {children:(0,import_jsx_runtime75.jsxs)("div", {className:"tl-quick-search-option-row", children:[(0,import_jsx_runtime75.jsx)(LogseqTypeTag, {type:"B"}), highlightedJSX(title, q2)]})})};
      }));
      return options2;
    }, [q2, searchFilter, searchResult, null == renderers ? void 0 : renderers.Breadcrumb, handlers]);
    import_react48.default.useEffect(() => {
      const keydownListener = e => {
        var _a3, _b;
        let newIndex = focusedOptionIdx;
        "ArrowDown" === e.key ? newIndex = Math.min(options.length - 1, focusedOptionIdx + 1) : "ArrowUp" === e.key ? newIndex = Math.max(0, focusedOptionIdx - 1) : "Enter" === e.key ? (null == (_a3 = options[focusedOptionIdx]) || _a3.onChosen(), e.stopPropagation(), e.preventDefault()) : "Backspace" === e.key && 0 === q2.length ? setSearchFilter(null) : "Escape" === e.key && finishSearching("");
        newIndex !== focusedOptionIdx && (_a3 = options[newIndex], setFocusedOptionIdx(newIndex), setPrefixIcon(_a3.actionIcon), e.stopPropagation(), e.preventDefault(), (e = null == (_b = optionsWrapperRef.current) ? void 0 : _b.querySelector(".tl-quick-search-option:nth-child(" + (newIndex + 1) + ")")) && (null == e || e.scrollIntoViewIfNeeded(!1)));
      };
      document.addEventListener("keydown", keydownListener, !0);
      return () => {
        document.removeEventListener("keydown", keydownListener, !0);
      };
    }, [options, focusedOptionIdx, q2]);
    return (0,import_jsx_runtime75.jsxs)("div", {className:"tl-quick-search " + (null != className ? className : ""), style, children:[(0,import_jsx_runtime75.jsx)(CircleButton, {icon:prefixIcon, onClick:() => {
      var _a3;
      null == (_a3 = options[focusedOptionIdx]) || _a3.onChosen();
    }}), (0,import_jsx_runtime75.jsxs)("div", {className:"tl-quick-search-input-container", children:[searchFilter && (0,import_jsx_runtime75.jsxs)("div", {className:"tl-quick-search-input-filter", children:[(0,import_jsx_runtime75.jsx)(LogseqTypeTag, {type:searchFilter}), "B" === searchFilter ? "Search blocks" : "Search pages", (0,import_jsx_runtime75.jsx)("div", {className:"tl-quick-search-input-filter-remove", onClick:() => setSearchFilter(null), children:(0,import_jsx_runtime75.jsx)(TablerIcon, 
    {name:"x"})})]}), (0,import_jsx_runtime75.jsx)(TextInput, {ref:rInput, type:"text", value:q2, className:"tl-quick-search-input", placeholder:null != placeholder2 ? placeholder2 : "Create or search your graph...", onChange:q3 => setQ(q3.target.value), onKeyDown:e => {
      "Enter" === e.key && finishSearching(q2);
      e.stopPropagation();
    }, onFocus:() => {
      setShowPanel(!0);
    }, onBlur:() => {
      setShowPanel(!1);
      null == onBlur || onBlur();
    }})]}), 0 < options.length && (0,import_jsx_runtime75.jsx)("div", {onWheelCapture:e => e.stopPropagation(), className:"tl-quick-search-options", ref:optionsWrapperRef, style:{visibility:showPanel ? "visible" : "hidden", pointerEvents:showPanel ? "all" : "none"}, children:(0,import_jsx_runtime75.jsx)(pt, {style:{height:40 * Math.min(Math.max(1, options.length), 12)}, totalCount:options.length, itemContent:index2 => {
      const {actionIcon, onChosen, element} = options[index2];
      return (0,import_jsx_runtime75.jsx)("div", {"data-focused":index2 === focusedOptionIdx, className:"tl-quick-search-option", tabIndex:0, onMouseEnter:() => {
        setPrefixIcon(actionIcon);
        setFocusedOptionIdx(index2);
      }, onPointerDownCapture:e => {
        onChosen() && (e.stopPropagation(), e.preventDefault());
      }, children:element}, index2);
    }})})]});
  }), import_jsx_runtime76 = require("module$node_modules$react$jsx_runtime"), ShapeLinksInput = observer(function(_a3) {
    var {pageId, portalType, refs, side, onRefsChange} = _a3;
    _a3 = __objRest(_a3, "pageId portalType shapeType refs side onRefsChange".split(" "));
    const {handlers:{t}} = import_react50.default.useContext(LogseqContext), noOfLinks = refs.length + (pageId ? 1 : 0), canAddLink = 0 === refs.length, addNewRef = value => {
      value && !refs.includes(value) && canAddLink && onRefsChange([...refs, value]);
    }, showReferencePanel = !(!pageId || !portalType);
    return (0,import_jsx_runtime76.jsx)(PopoverButton, __spreadProps(__spreadValues({}, _a3), {side, align:"start", alignOffset:-6, label:(0,import_jsx_runtime76.jsx)(Tooltip, {content:t("whiteboard/link"), sideOffset:14, children:(0,import_jsx_runtime76.jsxs)("div", {className:"flex gap-1 relative items-center justify-center px-1", children:[(0,import_jsx_runtime76.jsx)(TablerIcon, {name:0 < noOfLinks ? "link" : "add-link"}), 0 < noOfLinks && (0,import_jsx_runtime76.jsx)("div", {className:"tl-shape-links-count", 
    children:noOfLinks})]})}), children:(0,import_jsx_runtime76.jsxs)("div", {className:"color-level rounded-lg", "data-show-reference-panel":showReferencePanel, children:[showReferencePanel && (0,import_jsx_runtime76.jsxs)("div", {className:"tl-shape-links-reference-panel", children:[(0,import_jsx_runtime76.jsxs)("div", {className:"text-base inline-flex gap-1 items-center", children:[(0,import_jsx_runtime76.jsx)(TablerIcon, {className:"opacity-50", name:"internal-link"}), t("whiteboard/references")]}), 
    (0,import_jsx_runtime76.jsx)(ShapeLinkItem, {type:portalType, id:pageId})]}), (0,import_jsx_runtime76.jsxs)("div", {className:"tl-shape-links-panel color-level", children:[(0,import_jsx_runtime76.jsxs)("div", {className:"text-base inline-flex gap-1 items-center", children:[(0,import_jsx_runtime76.jsx)(TablerIcon, {className:"opacity-50", name:"add-link"}), t("whiteboard/link-to-any-page-or-block")]}), canAddLink && (0,import_jsx_runtime76.jsx)(LogseqQuickSearch, {style:{width:"calc(100% - 46px)", 
    marginLeft:"46px"}, placeholder:t("whiteboard/start-typing-to-search"), onChange:addNewRef}), 0 < refs.length && (0,import_jsx_runtime76.jsx)("div", {className:"flex flex-col items-stretch gap-2", children:refs.map((ref, i2) => (0,import_jsx_runtime76.jsx)(ShapeLinkItem, {id:ref, type:validUUID(ref) ? "B" : "P", onRemove:() => {
      onRefsChange(refs.filter((_2, j2) => i2 !== j2));
    }, showContent:!0}, ref))})]})]})}));
  }), import_jsx_runtime77 = require("module$node_modules$react$jsx_runtime"), LSUI10 = window.LSUI, import_jsx_runtime78 = require("module$node_modules$react$jsx_runtime"), contextBarActionTypes = "EditPdf LogseqPortalViewMode Geometry AutoResizing Swatch NoFill StrokeType ScaleLevel TextStyle YoutubeLink TwitterLink IFrameSource ArrowMode Links".split(" "), singleShapeActions = ["YoutubeLink", "TwitterLink", "IFrameSource", "Links", "EditPdf"], contextBarActionMapping = new Map(), shapeMapping = 
  {"logseq-portal":["Swatch", "LogseqPortalViewMode", "ScaleLevel", "AutoResizing", "Links"], youtube:["YoutubeLink", "Links"], tweet:["TwitterLink", "Links"], iframe:["IFrameSource", "Links"], box:"Geometry TextStyle Swatch ScaleLevel NoFill StrokeType Links".split(" "), ellipse:"Geometry TextStyle Swatch ScaleLevel NoFill StrokeType Links".split(" "), polygon:"Geometry TextStyle Swatch ScaleLevel NoFill StrokeType Links".split(" "), line:["TextStyle", "Swatch", "ScaleLevel", "ArrowMode", "Links"], 
  pencil:["Swatch", "Links", "ScaleLevel"], highlighter:["Swatch", "Links", "ScaleLevel"], text:["TextStyle", "Swatch", "ScaleLevel", "AutoResizing", "Links"], html:["ScaleLevel", "AutoResizing", "Links"], image:["Links"], video:["Links"], pdf:["EditPdf", "Links"]}, withFillShapes = Object.entries(shapeMapping).filter(([, types]) => types.includes("NoFill") && types.includes("Swatch")).map(([key]) => key), AutoResizingAction = observer(() => {
    const app = useApp(), {handlers:{t}} = import_react52.default.useContext(LogseqContext), shapes2 = filterShapeByAction("AutoResizing"), pressed = shapes2.every(s2 => s2.props.isAutoResizing);
    return (0,import_jsx_runtime78.jsx)(ToggleInput, {tooltip:t("whiteboard/auto-resize"), toggle:shapes2.every(s2 => "logseq-portal" === s2.props.type), className:"tl-button", pressed, onPressedChange:v2 => {
      shapes2.forEach(s2 => {
        if ("logseq-portal" === s2.props.type) {
          s2.update({isAutoResizing:v2});
        } else {
          s2.onResetBounds({zoom:app.viewport.camera.zoom});
        }
      });
      app.persist();
    }, children:(0,import_jsx_runtime78.jsx)(TablerIcon, {name:"dimensions"})});
  }), LogseqPortalViewModeAction = observer(() => {
    const app = useApp();
    var {handlers:{t}} = import_react52.default.useContext(LogseqContext);
    const shapes2 = filterShapeByAction("LogseqPortalViewMode"), collapsed = shapes2.every(s2 => s2.collapsed);
    if (!collapsed && !shapes2.every(s2 => !s2.collapsed)) {
      return null;
    }
    t = (0,import_jsx_runtime78.jsxs)("div", {className:"flex", children:[collapsed ? t("whiteboard/expand") : t("whiteboard/collapse"), (0,import_jsx_runtime78.jsx)(KeyboardShortcut, {action:collapsed ? "editor/expand-block-children" : "editor/collapse-block-children"})]});
    return (0,import_jsx_runtime78.jsx)(ToggleInput, {tooltip:t, toggle:shapes2.every(s2 => "logseq-portal" === s2.props.type), className:"tl-button", pressed:collapsed, onPressedChange:() => app.api.setCollapsed(!collapsed), children:(0,import_jsx_runtime78.jsx)(TablerIcon, {name:collapsed ? "object-expanded" : "object-compact"})});
  }), ScaleLevelAction = observer(() => {
    const {handlers:{isMobile}} = import_react52.default.useContext(LogseqContext);
    var shapes2 = filterShapeByAction("ScaleLevel");
    shapes2 = 1 < (new Set(shapes2.map(s2 => s2.scaleLevel))).size ? "" : shapes2[0].scaleLevel;
    return (0,import_jsx_runtime78.jsx)(ScaleInput, {scaleLevel:shapes2, compact:isMobile()});
  }), IFrameSourceAction = observer(() => {
    const app = useApp(), {handlers:{t}} = import_react52.default.useContext(LogseqContext), shape = filterShapeByAction("IFrameSource")[0], handleChange = import_react52.default.useCallback(e => {
      shape.onIFrameSourceChange(e.target.value.trim().toLowerCase());
      app.persist();
    }, []), handleReload = import_react52.default.useCallback(() => {
      shape.reload();
    }, []);
    return (0,import_jsx_runtime78.jsxs)("span", {className:"flex gap-3", children:[(0,import_jsx_runtime78.jsx)(Button, {tooltip:t("whiteboard/reload"), type:"button", onClick:handleReload, children:(0,import_jsx_runtime78.jsx)(TablerIcon, {name:"refresh"})}), (0,import_jsx_runtime78.jsx)(TextInput, {title:t("whiteboard/website-url"), className:"tl-iframe-src", value:`${shape.props.url}`, onChange:handleChange}), (0,import_jsx_runtime78.jsx)(Button, {tooltip:t("whiteboard/open-website-url"), type:"button", 
    onClick:() => window.open(shape.props.url), children:(0,import_jsx_runtime78.jsx)(TablerIcon, {name:"external-link"})})]});
  }), YoutubeLinkAction = observer(() => {
    const app = useApp(), {handlers:{t}} = import_react52.default.useContext(LogseqContext), shape = filterShapeByAction("YoutubeLink")[0], handleChange = import_react52.default.useCallback(e => {
      shape.onYoutubeLinkChange(e.target.value);
      app.persist();
    }, []);
    return (0,import_jsx_runtime78.jsxs)("span", {className:"flex gap-3", children:[(0,import_jsx_runtime78.jsx)(TextInput, {title:t("whiteboard/youtube-url"), className:"tl-youtube-link", value:`${shape.props.url}`, onChange:handleChange}), (0,import_jsx_runtime78.jsx)(Button, {tooltip:t("whiteboard/open-youtube-url"), type:"button", onClick:() => {
      var _a3, _b, _c;
      return null == (_c = null == (_b = null == (_a3 = window.logseq) ? void 0 : _a3.api) ? void 0 : _b.open_external_link) ? void 0 : _c.call(_b, shape.props.url);
    }, children:(0,import_jsx_runtime78.jsx)(TablerIcon, {name:"external-link"})})]});
  }), TwitterLinkAction = observer(() => {
    const app = useApp(), {handlers:{t}} = import_react52.default.useContext(LogseqContext), shape = filterShapeByAction("TwitterLink")[0], handleChange = import_react52.default.useCallback(e => {
      shape.onTwitterLinkChange(e.target.value);
      app.persist();
    }, []);
    return (0,import_jsx_runtime78.jsxs)("span", {className:"flex gap-3", children:[(0,import_jsx_runtime78.jsx)(TextInput, {title:t("whiteboard/twitter-url"), className:"tl-twitter-link", value:`${shape.props.url}`, onChange:handleChange}), (0,import_jsx_runtime78.jsx)(Button, {tooltip:t("whiteboard/open-twitter-url"), type:"button", onClick:() => {
      var _a3, _b, _c;
      return null == (_c = null == (_b = null == (_a3 = window.logseq) ? void 0 : _a3.api) ? void 0 : _b.open_external_link) ? void 0 : _c.call(_b, shape.props.url);
    }, children:(0,import_jsx_runtime78.jsx)(TablerIcon, {name:"external-link"})})]});
  }), EditPdfAction = observer(() => {
    const app = useApp(), {handlers:{t, setCurrentPdf}} = import_react52.default.useContext(LogseqContext), shape = app.selectedShapesArray[0];
    return (0,import_jsx_runtime78.jsx)(Button, {tooltip:t("whiteboard/edit-pdf"), type:"button", onClick:() => setCurrentPdf(app.assets[shape.props.assetId].src), children:(0,import_jsx_runtime78.jsx)(TablerIcon, {name:"edit"})});
  }), NoFillAction = observer(() => {
    const app = useApp(), {handlers:{t}} = import_react52.default.useContext(LogseqContext);
    var shapes2 = filterShapeByAction("NoFill");
    const handleChange = import_react52.default.useCallback(v2 => {
      app.selectedShapesArray.forEach(s2 => s2.update({noFill:v2}));
      app.persist();
    }, []);
    shapes2 = shapes2.every(s2 => s2.props.noFill);
    return (0,import_jsx_runtime78.jsx)(ToggleInput, {tooltip:t("whiteboard/fill"), className:"tl-button", pressed:shapes2, onPressedChange:handleChange, children:(0,import_jsx_runtime78.jsx)(TablerIcon, {name:shapes2 ? "droplet-off" : "droplet"})});
  }), SwatchAction = observer(() => {
    const app = useApp(), shapes2 = filterShapeByAction("Swatch"), handleSetColor = import_react52.default.useCallback(color2 => {
      app.selectedShapesArray.forEach(s2 => {
        s2.update({fill:color2, stroke:color2});
      });
      app.persist();
    }, []), handleSetOpacity = import_react52.default.useCallback(opacity => {
      app.selectedShapesArray.forEach(s2 => {
        s2.update({opacity});
      });
      app.persist();
    }, []);
    return (0,import_jsx_runtime78.jsx)(ColorInput, {popoverSide:"top", color:shapes2[0].props.noFill ? shapes2[0].props.stroke : shapes2[0].props.fill, opacity:shapes2[0].props.opacity, setOpacity:handleSetOpacity, setColor:handleSetColor});
  }), GeometryAction = observer(() => {
    const app = useApp(), handleSetGeometry = import_react52.default.useCallback(e => {
      app.api.convertShapes(e.currentTarget.dataset.tool);
    }, []);
    return (0,import_jsx_runtime78.jsx)(GeometryTools, {popoverSide:"top", chevron:!1, setGeometry:handleSetGeometry});
  }), StrokeTypeAction = observer(() => {
    const app = useApp(), {handlers:{t}} = import_react52.default.useContext(LogseqContext), shapes2 = filterShapeByAction("StrokeType"), value = shapes2.every(s2 => "dashed" === s2.props.strokeType) ? "dashed" : shapes2.every(s2 => "line" === s2.props.strokeType) ? "line" : "mixed";
    return (0,import_jsx_runtime78.jsx)(ToggleGroupInput, {title:t("whiteboard/stroke-type"), options:[{value:"line", icon:"circle", tooltip:"Solid"}, {value:"dashed", icon:"circle-dashed", tooltip:"Dashed"}], value, onValueChange:v2 => {
      shapes2.forEach(shape => {
        shape.update({strokeType:v2});
      });
      app.persist();
    }});
  }), ArrowModeAction = observer(() => {
    const app = useApp(), {handlers:{t}} = import_react52.default.useContext(LogseqContext), shapes2 = filterShapeByAction("ArrowMode");
    var startValue = shapes2.every(s2 => {
      var _a3;
      return "arrow" === (null == (_a3 = s2.props.decorations) ? void 0 : _a3.start);
    });
    const endValue = shapes2.every(s2 => {
      var _a3;
      return "arrow" === (null == (_a3 = s2.props.decorations) ? void 0 : _a3.end);
    });
    startValue = [startValue ? "start" : null, endValue ? "end" : null].filter(isNonNullable);
    return (0,import_jsx_runtime78.jsx)(ToggleGroupMultipleInput, {title:t("whiteboard/arrow-head"), options:[{value:"start", icon:"arrow-narrow-left"}, {value:"end", icon:"arrow-narrow-right"}], value:startValue, onValueChange:v2 => {
      shapes2.forEach(shape => {
        var JSCompiler_temp_const = shape.update;
        var JSCompiler_inline_result = {start:v2.includes("start") ? "arrow" : null, end:v2.includes("end") ? "arrow" : null};
        JSCompiler_temp_const.call(shape, {decorations:JSCompiler_inline_result});
      });
      app.persist();
    }});
  }), TextStyleAction = observer(() => {
    const app = useApp(), {handlers:{t}} = import_react52.default.useContext(LogseqContext), shapes2 = filterShapeByAction("TextStyle"), bold = shapes2.every(s2 => 500 < s2.props.fontWeight), italic = shapes2.every(s2 => s2.props.italic);
    return (0,import_jsx_runtime78.jsxs)("span", {className:"flex gap-1", children:[(0,import_jsx_runtime78.jsx)(ToggleInput, {tooltip:t("whiteboard/bold"), className:"tl-button", pressed:bold, onPressedChange:v2 => {
      shapes2.forEach(shape => {
        shape.update({fontWeight:v2 ? 700 : 400});
        shape.onResetBounds();
      });
      app.persist();
    }, children:(0,import_jsx_runtime78.jsx)(TablerIcon, {name:"bold"})}), (0,import_jsx_runtime78.jsx)(ToggleInput, {tooltip:t("whiteboard/italic"), className:"tl-button", pressed:italic, onPressedChange:v2 => {
      shapes2.forEach(shape => {
        shape.update({italic:v2});
        shape.onResetBounds();
      });
      app.persist();
    }, children:(0,import_jsx_runtime78.jsx)(TablerIcon, {name:"italic"})})]});
  }), LinksAction = observer(() => {
    var _a3;
    const app = useApp(), shape = app.selectedShapesArray[0];
    return (0,import_jsx_runtime78.jsx)(ShapeLinksInput, {onRefsChange:refs => {
      shape.update({refs});
      app.persist();
    }, refs:null != (_a3 = shape.props.refs) ? _a3 : [], shapeType:shape.props.type, side:"right", pageId:"logseq-portal" === shape.props.type ? shape.props.pageId : void 0, portalType:"logseq-portal" === shape.props.type ? shape.props.blockType : void 0});
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
  var getContextBarActionTypes = type => {
    var _a3;
    return (null != (_a3 = shapeMapping[type]) ? _a3 : []).filter(isNonNullable);
  }, getContextBarActionsForShapes = shapes2 => {
    const types = shapes2.map(s2 => s2.props.type), actionTypes = new Set(0 < shapes2.length ? getContextBarActionTypes(types[0]) : []);
    for (let i2 = 1; i2 < types.length && 0 < actionTypes.size; i2++) {
      const otherActionTypes = getContextBarActionTypes(types[i2]);
      actionTypes.forEach(action2 => {
        otherActionTypes.includes(action2) || actionTypes.delete(action2);
      });
    }
    1 < shapes2.length && singleShapeActions.forEach(action2 => {
      actionTypes.has(action2) && actionTypes.delete(action2);
    });
    return Array.from(actionTypes).sort((a3, b3) => contextBarActionTypes.indexOf(a3) - contextBarActionTypes.indexOf(b3)).map(action2 => contextBarActionMapping.get(action2));
  }, import_jsx_runtime79 = require("module$node_modules$react$jsx_runtime"), LSUI11 = window.LSUI, ContextBar = observer(({shapes:shapes2, offsets, hidden}) => {
    const app = useApp(), rSize = React62.useRef(null), rContextBar = React62.useRef(null);
    React62.useLayoutEffect(() => {
      setTimeout(() => {
        const elm = rContextBar.current;
        if (elm) {
          var {offsetWidth, offsetHeight} = elm;
          rSize.current = [offsetWidth, offsetHeight];
        }
      });
    });
    React62.useLayoutEffect(() => {
      var _a3;
      const elm = rContextBar.current;
      if (elm) {
        var size = null != (_a3 = rSize.current) ? _a3 : [0, 0];
        _a3 = 0;
        if (116 > offsets.top) {
          var y2 = offsets.height / 2 + 40;
          140 > offsets.bottom && (y2 += offsets.bottom - 140);
        } else {
          y2 = -(offsets.height / 2 + 40);
        }
        16 > offsets.left + offsets.width / 2 - size[0] / 2 ? _a3 += -(offsets.left + offsets.width / 2 - size[0] / 2 - 16) : 16 > offsets.right + offsets.width / 2 - size[0] / 2 && (_a3 += offsets.right + offsets.width / 2 - size[0] / 2 - 16);
        var [x2, y2$jscomp$0] = [_a3, y2];
        elm.style.transform = `translateX(${x2}px) translateY(${y2$jscomp$0}px)`;
      }
    }, [offsets]);
    if (!app) {
      return null;
    }
    const Actions = getContextBarActionsForShapes(shapes2);
    return (0,import_jsx_runtime79.jsx)(HTMLContainer, {centered:!0, children:0 < Actions.length && (0,import_jsx_runtime79.jsx)("div", {ref:rContextBar, className:"tl-toolbar tl-context-bar", style:{visibility:hidden ? "hidden" : "visible", pointerEvents:hidden ? "none" : "all"}, children:Actions.map((Action, idx) => (0,import_jsx_runtime79.jsxs)(React62.Fragment, {children:[(0,import_jsx_runtime79.jsx)(Action, {}), idx < Actions.length - 1 && (0,import_jsx_runtime79.jsx)(LSUI11.Separator, {className:"tl-toolbar-separator", 
    orientation:"vertical"})]}, idx))})});
  }), React63 = __toESM(require("module$react")), import_jsx_runtime80 = require("module$node_modules$react$jsx_runtime"), LSUI12 = window.LSUI, ContextMenu = observer(function({children, collisionRef}) {
    var _a3, _b, _c, _d, _e2, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
    const app = useApp(), {handlers} = React63.useContext(LogseqContext), t = handlers.t, rContent = React63.useRef(null), runAndTransition = f2 => {
      f2();
      app.transition("select");
    }, developerMode = React63.useMemo(() => isDev(), []);
    return (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenu, {onOpenChange:open => {
      open && !app.isIn("select.contextMenu") ? app.transition("select").selectedTool.transition("contextMenu") : !open && app.isIn("select.contextMenu") && app.selectedTool.transition("idle");
    }, children:[(0,import_jsx_runtime80.jsx)(LSUI12.ContextMenuTrigger, {disabled:app.editingShape && 0 !== Object.keys(app.editingShape).length, children}), (0,import_jsx_runtime80.jsx)(LSUI12.ContextMenuContent, {className:"tl-menu tl-context-menu", ref:rContent, onEscapeKeyDown:() => app.transition("select"), collisionBoundary:collisionRef.current, asChild:!0, tabIndex:-1, children:(0,import_jsx_runtime80.jsxs)("div", {children:[1 < (null == (_a3 = app.selectedShapes) ? void 0 : _a3.size) && 
    !app.readOnly && (null == (_b = app.selectedShapesArray) ? void 0 : _b.some(s2 => !s2.props.isLocked)) && (0,import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {children:[(0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-button-row-wrap", children:[(0,import_jsx_runtime80.jsxs)("div", {className:"tl-menu-button-row pb-0", children:[(0,import_jsx_runtime80.jsx)(Button, {tooltip:t("whiteboard/align-left"), onClick:() => runAndTransition(() => app.align("left")), children:(0,import_jsx_runtime80.jsx)(TablerIcon, 
    {name:"layout-align-left"})}), (0,import_jsx_runtime80.jsx)(Button, {tooltip:t("whiteboard/align-center-horizontally"), onClick:() => runAndTransition(() => app.align("centerHorizontal")), children:(0,import_jsx_runtime80.jsx)(TablerIcon, {name:"layout-align-center"})}), (0,import_jsx_runtime80.jsx)(Button, {tooltip:t("whiteboard/align-right"), onClick:() => runAndTransition(() => app.align("right")), children:(0,import_jsx_runtime80.jsx)(TablerIcon, {name:"layout-align-right"})}), (0,import_jsx_runtime80.jsx)(LSUI12.Separator, 
    {className:"tl-toolbar-separator", orientation:"vertical"}), (0,import_jsx_runtime80.jsx)(Button, {tooltip:t("whiteboard/distribute-horizontally"), onClick:() => runAndTransition(() => app.distribute("horizontal")), children:(0,import_jsx_runtime80.jsx)(TablerIcon, {name:"layout-distribute-vertical"})})]}), (0,import_jsx_runtime80.jsxs)("div", {className:"tl-menu-button-row pt-0", children:[(0,import_jsx_runtime80.jsx)(Button, {tooltip:t("whiteboard/align-top"), onClick:() => runAndTransition(() => 
    app.align("top")), children:(0,import_jsx_runtime80.jsx)(TablerIcon, {name:"layout-align-top"})}), (0,import_jsx_runtime80.jsx)(Button, {tooltip:t("whiteboard/align-center-vertically"), onClick:() => runAndTransition(() => app.align("centerVertical")), children:(0,import_jsx_runtime80.jsx)(TablerIcon, {name:"layout-align-middle"})}), (0,import_jsx_runtime80.jsx)(Button, {tooltip:t("whiteboard/align-bottom"), onClick:() => runAndTransition(() => app.align("bottom")), children:(0,import_jsx_runtime80.jsx)(TablerIcon, 
    {name:"layout-align-bottom"})}), (0,import_jsx_runtime80.jsx)(LSUI12.Separator, {className:"tl-toolbar-separator", orientation:"vertical"}), (0,import_jsx_runtime80.jsx)(Button, {tooltip:t("whiteboard/distribute-vertically"), onClick:() => runAndTransition(() => app.distribute("vertical")), children:(0,import_jsx_runtime80.jsx)(TablerIcon, {name:"layout-distribute-horizontal"})})]})]}), (0,import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {className:"menu-separator"}), (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, 
    {className:"tl-menu-item", onClick:() => runAndTransition(app.packIntoRectangle), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"layout-grid"}), t("whiteboard/pack-into-rectangle")]}), (0,import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {className:"menu-separator"})]}), 0 < (null == (_c = app.selectedShapes) ? void 0 : _c.size) && (0,import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {children:[(0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, 
    {className:"tl-menu-item", onClick:() => runAndTransition(app.api.zoomToSelection), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"circle-dotted"}), t("whiteboard/zoom-to-fit"), (0,import_jsx_runtime80.jsx)(KeyboardShortcut, {action:"whiteboard/zoom-to-fit"})]}), (0,import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {className:"menu-separator"})]}), (app.selectedShapesArray.some(s2 => "group" === s2.type || app.getParentGroup(s2)) || 1 < app.selectedShapesArray.length) && 
    (null == (_d = app.selectedShapesArray) ? void 0 : _d.some(s2 => !s2.props.isLocked)) && !app.readOnly && (0,import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {children:[app.selectedShapesArray.some(s2 => "group" === s2.type || app.getParentGroup(s2)) && (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(app.api.unGroup), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"ungroup"}), t("whiteboard/ungroup"), 
    (0,import_jsx_runtime80.jsx)(KeyboardShortcut, {action:"whiteboard/ungroup"})]}), 1 < app.selectedShapesArray.length && (null == (_e2 = app.selectedShapesArray) ? void 0 : _e2.some(s2 => !s2.props.isLocked)) && (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(app.api.doGroup), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"group"}), t("whiteboard/group"), (0,import_jsx_runtime80.jsx)(KeyboardShortcut, 
    {action:"whiteboard/group"})]}), (0,import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {className:"menu-separator"})]}), 0 < (null == (_f = app.selectedShapes) ? void 0 : _f.size) && (null == (_g = app.selectedShapesArray) ? void 0 : _g.some(s2 => !s2.props.isLocked)) && (0,import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {children:[!app.readOnly && (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(app.cut), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, 
    {className:"tl-menu-icon", name:"cut"}), t("whiteboard/cut")]}), (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(app.copy), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"copy"}), t("whiteboard/copy"), (0,import_jsx_runtime80.jsx)(KeyboardShortcut, {action:"editor/copy"})]})]}), !app.readOnly && (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(app.paste), 
    children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"clipboard"}), t("whiteboard/paste"), (0,import_jsx_runtime80.jsx)(KeyboardShortcut, {shortcut:`${MOD_KEY}+v`})]}), 1 === (null == (_h = app.selectedShapes) ? void 0 : _h.size) && !app.readOnly && (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(() => app.paste(void 0, !0)), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", 
    name:"circle-dotted"}), t("whiteboard/paste-as-link"), (0,import_jsx_runtime80.jsx)(KeyboardShortcut, {shortcut:`${MOD_KEY}+\u21E7+v`})]}), 0 < (null == (_i = app.selectedShapes) ? void 0 : _i.size) && (0,import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {children:[(0,import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {className:"menu-separator"}), (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(() => {
      var _a4, _b2;
      return handlers.exportToImage(app.currentPageId, {x:app.selectionBounds.minX + app.viewport.camera.point[0] - 8, y:app.selectionBounds.minY + app.viewport.camera.point[1] - 8, width:(null == (_a4 = app.selectionBounds) ? void 0 : _a4.width) + 16, height:(null == (_b2 = app.selectionBounds) ? void 0 : _b2.height) + 16, zoom:app.viewport.camera.zoom});
    }), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"file-export"}), t("whiteboard/export"), (0,import_jsx_runtime80.jsx)("div", {className:"tl-menu-right-slot", children:(0,import_jsx_runtime80.jsx)("span", {className:"keyboard-shortcut"})})]})]}), (0,import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {className:"menu-separator"}), (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(app.api.selectAll), 
    children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"circle-dotted"}), t("whiteboard/select-all"), (0,import_jsx_runtime80.jsx)(KeyboardShortcut, {action:"editor/select-parent"})]}), 1 < (null == (_j = app.selectedShapes) ? void 0 : _j.size) && (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(app.api.deselectAll), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"circle-dotted"}), 
    t("whiteboard/deselect-all")]}), !app.readOnly && 0 < (null == (_k = app.selectedShapes) ? void 0 : _k.size) && (null == (_l = app.selectedShapesArray) ? void 0 : _l.some(s2 => !s2.props.isLocked)) && (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(() => app.setLocked(!0)), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"lock"}), t("whiteboard/lock"), (0,import_jsx_runtime80.jsx)(KeyboardShortcut, 
    {action:"whiteboard/lock"})]}), !app.readOnly && 0 < (null == (_m = app.selectedShapes) ? void 0 : _m.size) && (null == (_n = app.selectedShapesArray) ? void 0 : _n.some(s2 => s2.props.isLocked)) && (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(() => app.setLocked(!1)), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"lock-open"}), t("whiteboard/unlock"), (0,import_jsx_runtime80.jsx)(KeyboardShortcut, 
    {action:"whiteboard/unlock"})]}), 0 < (null == (_o = app.selectedShapes) ? void 0 : _o.size) && !app.readOnly && (null == (_p = app.selectedShapesArray) ? void 0 : _p.some(s2 => !s2.props.isLocked)) && (0,import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {children:[(0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(app.api.deleteShapes), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"backspace"}), 
    t("whiteboard/delete"), (0,import_jsx_runtime80.jsx)(KeyboardShortcut, {action:"editor/delete"})]}), 1 < (null == (_q = app.selectedShapes) ? void 0 : _q.size) && !app.readOnly && (0,import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {children:[(0,import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, {className:"menu-separator"}), (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(app.flipHorizontal), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, 
    {className:"tl-menu-icon", name:"flip-horizontal"}), t("whiteboard/flip-horizontally")]}), (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(app.flipVertical), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"flip-vertical"}), t("whiteboard/flip-vertically")]})]}), !app.readOnly && (0,import_jsx_runtime80.jsxs)(import_jsx_runtime80.Fragment, {children:[(0,import_jsx_runtime80.jsx)(LSUI12.ContextMenuSeparator, 
    {className:"menu-separator"}), (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(app.bringToFront), children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"circle-dotted"}), t("whiteboard/move-to-front"), (0,import_jsx_runtime80.jsx)(KeyboardShortcut, {action:"whiteboard/bring-to-front"})]}), (0,import_jsx_runtime80.jsxs)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => runAndTransition(app.sendToBack), 
    children:[(0,import_jsx_runtime80.jsx)(TablerIcon, {className:"tl-menu-icon", name:"circle-dotted"}), t("whiteboard/move-to-back"), (0,import_jsx_runtime80.jsx)(KeyboardShortcut, {action:"whiteboard/send-to-back"})]})]}), developerMode && (0,import_jsx_runtime80.jsx)(LSUI12.ContextMenuItem, {className:"tl-menu-item", onClick:() => {
      1 === app.selectedShapesArray.length ? console.log(toJS(app.selectedShapesArray[0].serialized)) : console.log(app.selectedShapesArray.map(s2 => toJS(s2.serialized)));
    }, children:t("whiteboard/dev-print-shape-props")})]})]})})]});
  }), import_react56 = __toESM(require("module$react")), import_jsx_runtime81 = require("module$node_modules$react$jsx_runtime"), QuickLinks = observer(({shape}) => {
    const app = useApp();
    var {handlers} = import_react56.default.useContext(LogseqContext);
    handlers = handlers.t;
    const links = import_react56.default.useMemo(() => {
      var _a3;
      const links2 = [...(null != (_a3 = shape.props.refs) ? _a3 : [])].map(l3 => [l3, !0]);
      "logseq-portal" === shape.props.type && shape.props.pageId && links2.unshift([shape.props.pageId, !1]);
      return links2.filter(link => link[0].toLowerCase() !== app.currentPage.id && link[0] !== shape.props.pageId);
    }, [shape.props.id, shape.props.type, shape.props.parentId, shape.props.refs]);
    return 0 === links.length ? null : (0,import_jsx_runtime81.jsx)("div", {className:"tl-quick-links", title:handlers("whiteboard/shape-quick-links"), children:links.map(([ref, showReferenceContent]) => (0,import_jsx_runtime81.jsx)("div", {className:"tl-quick-links-row", children:(0,import_jsx_runtime81.jsx)(BlockLink, {id:ref, showReferenceContent})}, ref))});
  }), React66 = __toESM(require("module$react")), React65 = __toESM(require("module$react")), assetExtensions = {image:[".png", ".svg", ".jpg", ".jpeg", ".gif"], video:[".mp4", ".webm", ".ogg"], pdf:[".pdf"]}, handleCreatingShapes = (_0, _1, _2) => __async(void 0, [_0, _1, _2], function*(app, {point, shiftKey, dataTransfer, fromDrop}, handlers) {
    function createAssetsFromURL(url, type) {
      return __async(this, null, function*() {
        const existingAsset = Object.values(app.assets).find(asset2 => asset2.src === url);
        return existingAsset ? existingAsset : {id:v1_default(), type, src:url, size:yield getSizeFromSrc(handlers.makeAssetUrl(url), type)};
      });
    }
    function createAssetsFromFiles(files) {
      return __async(this, null, function*() {
        const tasks = files.filter(file => "unknown" !== getFileType(file.name)).map(file => __async(this, null, function*() {
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
      return [__spreadProps(__spreadValues({}, HTMLShape.defaultProps), {html:text, point:[point[0], point[1]]})];
    }
    function tryCreateShapesFromDataTransfer(dataTransfer2) {
      return __async(this, null, function*() {
        return tryCreateShapeHelper(tryCreateShapeFromFilePath, tryCreateShapeFromFiles, tryCreateShapeFromPageName, tryCreateShapeFromBlockUUID, tryCreateShapeFromTextPlain, tryCreateShapeFromTextHTML, tryCreateLogseqPortalShapesFromString)(dataTransfer2);
      });
    }
    function tryCreateShapesFromClipboard() {
      return __async(this, null, function*() {
        const items = yield navigator.clipboard.read(), createShapesFn = tryCreateShapeHelper(tryCreateShapeFromTextPlain, tryCreateShapeFromTextHTML, tryCreateLogseqPortalShapesFromString);
        return (yield Promise.all(items.map(item => createShapesFn(item)))).flat().filter(isNonNullable);
      });
    }
    function tryCreateShapeFromFilePath(item) {
      return __async(this, null, function*() {
        var file = item.getData("file");
        if (!file) {
          return null;
        }
        const asset = yield createAssetsFromURL(file, "pdf");
        app.addAssets([asset]);
        file = __spreadProps(__spreadValues({}, PdfShape.defaultProps), {id:v1_default(), assetId:asset.id, url:file, opacity:1});
        asset.size && Object.assign(file, {point:[point[0] - asset.size[0] / 4 + 16, point[1] - asset.size[1] / 4 + 16], size:src_default.div(asset.size, 2)});
        return [file];
      });
    }
    function tryCreateShapeFromFiles(item) {
      return __async(this, null, function*() {
        var files = Array.from(item.files);
        return 0 < files.length ? (imageAssetsToCreate = files = yield createAssetsFromFiles(files), files.map((asset, i2) => {
          switch(asset.type) {
            case "video":
              var defaultProps = VideoShape.defaultProps;
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
          defaultProps = __spreadProps(__spreadValues({}, defaultProps), {id:v1_default(), assetId:asset.id, opacity:1});
          asset.size && Object.assign(defaultProps, {point:[point[0] - asset.size[0] / 4 + 16 * i2, point[1] - asset.size[1] / 4 + 16 * i2], size:src_default.div(asset.size, 2)});
          return defaultProps;
        })) : null;
      });
    }
    function tryCreateShapeFromTextHTML(item) {
      return __async(this, null, function*() {
        if (item.types.includes("text/plain") && (shiftKey || fromDrop)) {
          return null;
        }
        const rawText = yield getDataFromType(item, "text/html");
        return rawText ? tryCreateShapeHelper(tryCreateClonedShapesFromJSON, createHTMLShape)(rawText) : null;
      });
    }
    function tryCreateShapeFromBlockUUID(dataTransfer2) {
      return __async(this, null, function*() {
        var _a4, _b2, _c, _d, _e2, _f, rawText = dataTransfer2.getData("block-uuid");
        if (rawText) {
          rawText = rawText.trim();
          const allSelectedBlocks = null == (_c = null == (_b2 = null == (_a4 = window.logseq) ? void 0 : _a4.api) ? void 0 : _b2.get_selected_blocks) ? void 0 : _c.call(_b2);
          _a4 = allSelectedBlocks && 1 < (null == allSelectedBlocks ? void 0 : allSelectedBlocks.length) ? allSelectedBlocks.map(b3 => b3.uuid) : [rawText];
          null == (_f = null == (_e2 = null == (_d = window.logseq) ? void 0 : _d.api) ? void 0 : _e2.set_blocks_id) || _f.call(_e2, _a4);
          _d = _a4.map(uuid => tryCreateLogseqPortalShapesFromUUID(`((${uuid}))`));
          return (yield Promise.all(_d)).flat().filter(isNonNullable).map((s2, idx) => __spreadProps(__spreadValues({}, s2), {point:[point[0] + (LogseqPortalShape.defaultProps.size[0] + 16) * idx, point[1]]}));
        }
        return null;
      });
    }
    function tryCreateShapeFromPageName(dataTransfer2) {
      return __async(this, null, function*() {
        var rawText = dataTransfer2.getData("page-name");
        return rawText ? (rawText = rawText.trim(), tryCreateLogseqPortalShapesFromUUID(`[[${rawText}]]`)) : null;
      });
    }
    function tryCreateShapeFromTextPlain(item) {
      return __async(this, null, function*() {
        var rawText = yield getDataFromType(item, "text/plain");
        return rawText ? (rawText = rawText.trim(), tryCreateShapeHelper(tryCreateShapeFromURL, tryCreateShapeFromIframeString)(rawText)) : null;
      });
    }
    function tryCreateClonedShapesFromJSON(rawText) {
      if (rawText = app.api.getClonedShapesFromTldrString(decodeURIComponent(rawText), point)) {
        const {shapes:shapes2, assets, bindings} = rawText;
        assetsToClone.push(...assets);
        bindingsToCreate.push(...bindings);
        return shapes2;
      }
      return null;
    }
    function tryCreateShapeFromURL(rawText) {
      return __async(this, null, function*() {
        try {
          const parsedUrl = new URL(rawText);
          var JSCompiler_inline_result = parsedUrl.host && ["http:", "https:"].includes(parsedUrl.protocol);
        } catch (e) {
          JSCompiler_inline_result = !1;
        }
        return JSCompiler_inline_result && !shiftKey ? YOUTUBE_REGEX.test(rawText) ? [__spreadProps(__spreadValues({}, YouTubeShape.defaultProps), {url:rawText, point:[point[0], point[1]]})] : X_OR_TWITTER_REGEX.test(rawText) ? [__spreadProps(__spreadValues({}, TweetShape.defaultProps), {url:rawText, point:[point[0], point[1]]})] : [__spreadProps(__spreadValues({}, IFrameShape.defaultProps), {url:rawText, point:[point[0], point[1]]})] : null;
      });
    }
    function tryCreateShapeFromIframeString(rawText) {
      return rawText.startsWith("\x3ciframe") ? [__spreadProps(__spreadValues({}, HTMLShape.defaultProps), {html:rawText, point:[point[0], point[1]]})] : null;
    }
    function tryCreateLogseqPortalShapesFromUUID(rawText) {
      return __async(this, null, function*() {
        if (/^\(\(.*\)\)$/.test(rawText) && 40 === rawText.length) {
          var blockRef = rawText.slice(2, -2);
          if (validUUID(blockRef)) {
            return [__spreadProps(__spreadValues({}, LogseqPortalShape.defaultProps), {point:[point[0], point[1]], size:[400, 0], pageId:blockRef, fill:app.settings.color, stroke:app.settings.color, scaleLevel:app.settings.scaleLevel, blockType:"B"})];
          }
        } else if (/^\[\[.*\]\]$/.test(rawText)) {
          return blockRef = rawText.slice(2, -2), [__spreadProps(__spreadValues({}, LogseqPortalShape.defaultProps), {point:[point[0], point[1]], size:[400, 0], pageId:blockRef, fill:app.settings.color, stroke:app.settings.color, scaleLevel:app.settings.scaleLevel, blockType:"P"})];
        }
        return null;
      });
    }
    function tryCreateLogseqPortalShapesFromString(item) {
      return __async(this, null, function*() {
        var rawText = yield getDataFromType(item, "text/plain");
        return rawText && (rawText = rawText.trim(), rawText = yield null == handlers ? void 0 : handlers.addNewBlock(rawText)) ? [__spreadProps(__spreadValues({}, LogseqPortalShape.defaultProps), {size:[400, 0], point:[point[0], point[1]], pageId:rawText, fill:app.settings.color, stroke:app.settings.color, scaleLevel:app.settings.scaleLevel, blockType:"B", compact:!0})] : null;
      });
    }
    var _a3, _b;
    let imageAssetsToCreate = [], assetsToClone = [];
    const bindingsToCreate = [];
    app.cursors.setCursor("progress");
    let newShapes = [];
    try {
      dataTransfer ? newShapes.push(...(null != (_a3 = yield tryCreateShapesFromDataTransfer(dataTransfer)) ? _a3 : [])) : newShapes.push(...(null != (_b = yield tryCreateShapesFromClipboard()) ? _b : []));
    } catch (error) {
      console.error(error);
    }
    const allShapesToAdd = newShapes.map(shape => __spreadProps(__spreadValues({}, shape), {parentId:app.currentPageId, isLocked:!1, id:validUUID(shape.id) ? shape.id : v1_default()})), filesOnly = null == dataTransfer ? void 0 : dataTransfer.types.every(t => "Files" === t);
    app.wrapUpdate(() => {
      var allAssets = [...imageAssetsToCreate, ...assetsToClone];
      0 < allAssets.length && app.createAssets(allAssets);
      0 < allShapesToAdd.length && app.createShapes(allShapesToAdd);
      app.currentPage.updateBindings(Object.fromEntries(bindingsToCreate.map(b3 => [b3.id, b3])));
      if (1 === app.selectedShapesArray.length && 1 === allShapesToAdd.length && fromDrop) {
        allAssets = app.selectedShapesArray[0];
        const target = app.getShapeById(allShapesToAdd[0].id);
        app.createNewLineBinding(allAssets, target);
      }
      app.setSelectedShapes(allShapesToAdd.map(s2 => s2.id));
      app.selectedTool.transition("idle");
      app.cursors.setCursor("default");
      (fromDrop || filesOnly) && app.packIntoRectangle();
    });
  }), React67 = __toESM(require("module$react")), import_react57 = __toESM(require("module$react")), import_jsx_runtime82 = require("module$node_modules$react$jsx_runtime"), tools = [BoxTool, EllipseTool, PolygonTool, NuEraseTool, HighlighterTool, LineTool, PencilTool, TextTool, YouTubeTool, IFrameTool, HTMLTool, LogseqPortalTool], BacklinksCount = props => {
    const {renderers} = React69.useContext(LogseqContext);
    return (0,import_jsx_runtime82.jsx)(renderers.BacklinksCount, __spreadProps(__spreadValues({}, props), {options:{"portal?":!1}}));
  }, AppImpl = () => {
    const ref = React69.useRef(null), app = useApp(), components = React69.useMemo(() => ({ContextBar, BacklinksCount, QuickLinks}), []);
    return (0,import_jsx_runtime82.jsx)(ContextMenu, {collisionRef:ref, children:(0,import_jsx_runtime82.jsx)("div", {ref, className:"logseq-tldraw logseq-tldraw-wrapper", "data-tlapp":app.uuid, children:(0,import_jsx_runtime82.jsx)(AppCanvas, {components, children:(0,import_jsx_runtime82.jsx)(AppUI, {})})})});
  }, AppInner = _a3 => {
    var {onPersist, readOnly, model} = _a3;
    _a3 = __objRest(_a3, ["onPersist", "readOnly", "model"]);
    const onDrop = useDrop(), onPaste = usePaste(), onCopy = useCopy(), onQuickAdd = readOnly ? null : useQuickAdd(), onPersistOnDiff = React69.useCallback((app, info) => {
      null == onPersist || onPersist(app, info);
    }, [model]);
    return (0,import_jsx_runtime82.jsx)(AppProvider, __spreadProps(__spreadValues({Shapes:shapes, Tools:tools, onDrop, onPaste, onCopy, readOnly, onCanvasDBClick:onQuickAdd, onPersist:onPersistOnDiff, model}, _a3), {children:(0,import_jsx_runtime82.jsx)(AppImpl, {})}));
  }, App3 = function(_a3) {
    var {renderers, handlers} = _a3;
    _a3 = __objRest(_a3, ["renderers", "handlers"]);
    const contextValue = {renderers:React69.useMemo(() => Object.fromEntries(Object.entries(renderers).map(([key, comp]) => [key, React69.memo(comp)])), []), handlers};
    return (0,import_jsx_runtime82.jsx)(LogseqContext.Provider, {value:contextValue, children:(0,import_jsx_runtime82.jsx)(AppInner, __spreadValues({}, _a3))});
  };
};

//# sourceMappingURL=module$frontend$tldraw_logseq.js.map
