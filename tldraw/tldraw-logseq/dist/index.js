import regeneratorRuntime from "regenerator-runtime";
function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
}
function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
        for(var i = 0, arr2 = new Array(arr.length); i < arr.length; i++){
            arr2[i] = arr[i];
        }
        return arr2;
    }
}
function _assertThisInitialized(self) {
    if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _asyncToGenerator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _get(target, property, receiver) {
    if (typeof Reflect !== "undefined" && Reflect.get) {
        _get = Reflect.get;
    } else {
        _get = function _get(target, property, receiver) {
            var base = _superPropBase(target, property);
            if (!base) return;
            var desc = Object.getOwnPropertyDescriptor(base, property);
            if (desc.get) {
                return desc.get.call(receiver);
            }
            return desc.value;
        };
    }
    return _get(target, property, receiver || target);
}
function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
}
function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
}
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}
function _iterableToArrayLimit(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;
    try {
        for(var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
}
function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
}
function _objectSpread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {
        };
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _defineProperty(target, key, source[key]);
        });
    }
    return target;
}
function _objectWithoutProperties(source, excluded) {
    if (source == null) return {
    };
    var target = _objectWithoutPropertiesLoose(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
        var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
        for(i = 0; i < sourceSymbolKeys.length; i++){
            key = sourceSymbolKeys[i];
            if (excluded.indexOf(key) >= 0) continue;
            if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
            target[key] = source[key];
        }
    }
    return target;
}
function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {
    };
    var target = {
    };
    var sourceKeys = Object.keys(source);
    var key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
    }
    return target;
}
function _possibleConstructorReturn(self, call) {
    if (call && (_typeof(call) === "object" || typeof call === "function")) {
        return call;
    }
    return _assertThisInitialized(self);
}
function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _setPrototypeOf(o, p);
}
function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}
function _superPropBase(object, property) {
    while(!Object.prototype.hasOwnProperty.call(object, property)){
        object = _getPrototypeOf(object);
        if (object === null) break;
    }
    return object;
}
function _taggedTemplateLiteral(strings, raw) {
    if (!raw) {
        raw = strings.slice(0);
    }
    return Object.freeze(Object.defineProperties(strings, {
        raw: {
            value: Object.freeze(raw)
        }
    }));
}
function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}
var _typeof = function(obj) {
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
};
function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;
    try {
        Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
        }));
        return true;
    } catch (e) {
        return false;
    }
}
function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();
    return function _createSuperInternal() {
        var Super = _getPrototypeOf(Derived), result;
        if (hasNativeReflectConstruct) {
            var NewTarget = _getPrototypeOf(this).constructor;
            result = Reflect.construct(Super, arguments, NewTarget);
        } else {
            result = Super.apply(this, arguments);
        }
        return _possibleConstructorReturn(this, result);
    };
}
function _templateObject() {
    var data = _taggedTemplateLiteral([
        "\n  @font-face {\n    font-family: 'Recursive';\n    font-style: normal;\n    font-weight: 500;\n    font-display: swap;\n    src: url(https://fonts.gstatic.com/s/recursive/v23/8vI-7wMr0mhh-RQChyHEH06TlXhq_gukbYrFMk1QuAIcyEwG_X-dpEfaE5YaERmK-CImKsvxvU-MXGX2fSqasNfUlTGZnI14ZeY.woff2)\n      format('woff2');\n    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,\n      U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n  }\n\n  @font-face {\n    font-family: 'Recursive';\n    font-style: normal;\n    font-weight: 700;\n    font-display: swap;\n    src: url(https://fonts.gstatic.com/s/recursive/v23/8vI-7wMr0mhh-RQChyHEH06TlXhq_gukbYrFMk1QuAIcyEwG_X-dpEfaE5YaERmK-CImKsvxvU-MXGX2fSqasNfUlTGZnI14ZeY.woff2)\n      format('woff2');\n    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,\n      U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n  }\n\n  @font-face {\n    font-family: 'Recursive Mono';\n    font-style: normal;\n    font-weight: 420;\n    font-display: swap;\n    src: url(https://fonts.gstatic.com/s/recursive/v23/8vI-7wMr0mhh-RQChyHEH06TlXhq_gukbYrFMk1QuAIcyEwG_X-dpEfaE5YaERmK-CImqvTxvU-MXGX2fSqasNfUlTGZnI14ZeY.woff2)\n      format('woff2');\n    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,\n      U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n  }\n\n  .tl-container {\n    --tl-cursor: inherit;\n    --tl-zoom: 1;\n    --tl-scale: calc(1 / var(--tl-zoom));\n    --tl-padding: calc(64px * var(--tl-scale));\n    --tl-shadow-color: 0deg 0% 0%;\n    --tl-shadow-elevation-low: 0px 0.4px 0.5px hsl(var(--tl-shadow-color) / 0.04),\n      0px 0.6px 0.8px -0.7px hsl(var(--tl-shadow-color) / 0.06),\n      0.1px 1.2px 1.5px -1.4px hsl(var(--tl-shadow-color) / 0.08);\n    --tl-shadow-elevation-medium: 0px 0.4px 0.5px hsl(var(--tl-shadow-color) / 0.04),\n      0.1px 1.3px 1.7px -0.5px hsl(var(--tl-shadow-color) / 0.06),\n      0.1px 2.8px 3.6px -1px hsl(var(--tl-shadow-color) / 0.07),\n      0.3px 6.1px 7.8px -1.4px hsl(var(--tl-shadow-color) / 0.09);\n    --tl-shadow-elevation-high: 0px 0.4px 0.5px hsl(var(--tl-shadow-color) / 0.04),\n      0.1px 2.3px 3px -0.2px hsl(var(--tl-shadow-color) / 0.05),\n      0.2px 4.1px 5.3px -0.5px hsl(var(--tl-shadow-color) / 0.06),\n      0.4px 6.6px 8.5px -0.7px hsl(var(--tl-shadow-color) / 0.07),\n      0.6px 10.3px 13.2px -1px hsl(var(--tl-shadow-color) / 0.08),\n      0.9px 16px 20.6px -1.2px hsl(var(--tl-shadow-color) / 0.09),\n      1.3px 24.3px 31.2px -1.4px hsl(var(--tl-shadow-color) / 0.1);\n    box-sizing: border-box;\n    position: relative;\n    top: 0px;\n    left: 0px;\n    width: 100%;\n    height: 100%;\n    max-width: 100%;\n    max-height: 100%;\n    box-sizing: border-box;\n    padding: 0px;\n    margin: 0px;\n    outline: none;\n    z-index: 100;\n    user-select: none;\n    touch-action: none;\n    overscroll-behavior: none;\n    background-color: var(--tl-background);\n    cursor: var(--tl-cursor) !important;\n    box-sizing: border-box;\n  }\n\n  .tl-overlay {\n    background: none;\n    fill: transparent;\n    position: absolute;\n    width: 100%;\n    height: 100%;\n    touch-action: none;\n    pointer-events: none;\n  }\n\n  .tl-grid {\n    position: absolute;\n    width: 100%;\n    height: 100%;\n    touch-action: none;\n    pointer-events: none;\n    user-select: none;\n  }\n\n  .tl-snap-line {\n    stroke: var(--tl-accent);\n    stroke-width: calc(1px * var(--tl-scale));\n  }\n\n  .tl-snap-point {\n    stroke: var(--tl-accent);\n    stroke-width: calc(1px * var(--tl-scale));\n  }\n\n  .tl-canvas {\n    position: absolute;\n    width: 100%;\n    height: 100%;\n    touch-action: none;\n    pointer-events: all;\n    overflow: clip;\n    outline: none;\n  }\n\n  .tl-layer {\n    position: absolute;\n    top: 0px;\n    left: 0px;\n    height: 0px;\n    width: 0px;\n    contain: layout style size;\n  }\n\n  .tl-absolute {\n    position: absolute;\n    top: 0px;\n    left: 0px;\n    transform-origin: center center;\n    contain: layout style size;\n  }\n\n  .tl-positioned {\n    position: absolute;\n    transform-origin: center center;\n    pointer-events: none;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    contain: layout style size;\n  }\n\n  .tl-positioned-svg {\n    width: 100%;\n    height: 100%;\n    overflow: hidden;\n    contain: layout style size;\n    pointer-events: none;\n  }\n\n  .tl-positioned-div {\n    position: relative;\n    width: 100%;\n    height: 100%;\n    padding: var(--tl-padding);\n    contain: layout style size;\n  }\n\n  .tl-positioned-inner {\n    position: relative;\n    width: 100%;\n    height: 100%;\n  }\n\n  .tl-counter-scaled {\n    transform: scale(var(--tl-scale));\n  }\n\n  .tl-dashed {\n    stroke-dasharray: calc(2px * var(--tl-scale)), calc(2px * var(--tl-scale));\n  }\n\n  .tl-transparent {\n    fill: transparent;\n    stroke: transparent;\n  }\n\n  .tl-corner-handle {\n    stroke: var(--tl-selectStroke);\n    fill: var(--tl-background);\n    stroke-width: calc(1.5px * var(--tl-scale));\n  }\n\n  .tl-rotate-handle {\n    stroke: var(--tl-selectStroke);\n    fill: var(--tl-background);\n    stroke-width: calc(1.5px * var(--tl-scale));\n  }\n\n  .tl-binding {\n    fill: var(--tl-selectFill);\n    stroke: var(--tl-selectStroke);\n    stroke-width: calc(1px * var(--tl-scale));\n    pointer-events: none;\n  }\n\n  .tl-user {\n    left: -4px;\n    top: -4px;\n    height: 8px;\n    width: 8px;\n    border-radius: 100%;\n    pointer-events: none;\n  }\n\n  .tl-indicator {\n    fill: transparent;\n    stroke-width: calc(1.5px * var(--tl-scale));\n    pointer-events: none;\n  }\n\n  .tl-indicator-container {\n    transform-origin: 0 0;\n    fill: transparent;\n    stroke-width: calc(1.5px * var(--tl-scale));\n    pointer-events: none;\n  }\n\n  .tl-user-indicator-bounds {\n    border-style: solid;\n    border-width: calc(1px * var(--tl-scale));\n  }\n\n  .tl-selected {\n    stroke: var(--tl-selectStroke);\n  }\n\n  .tl-hovered {\n    stroke: var(--tl-selectStroke);\n  }\n\n  .tl-clone-target {\n    pointer-events: all;\n  }\n\n  .tl-clone-target:hover .tl-clone-button {\n    opacity: 1;\n  }\n\n  .tl-clone-button-target {\n    cursor: pointer;\n    pointer-events: all;\n  }\n\n  .tl-clone-button-target:hover .tl-clone-button {\n    fill: var(--tl-selectStroke);\n  }\n\n  .tl-clone-button {\n    opacity: 0;\n    r: calc(8px * var(--tl-scale));\n    stroke-width: calc(1.5px * var(--tl-scale));\n    stroke: var(--tl-selectStroke);\n    fill: var(--tl-background);\n  }\n\n  .tl-bounds {\n    pointer-events: none;\n    contain: layout style size;\n  }\n\n  .tl-bounds-bg {\n    stroke: none;\n    fill: var(--tl-selectFill);\n    pointer-events: all;\n    contain: layout style size;\n  }\n\n  .tl-bounds-fg {\n    fill: transparent;\n    stroke: var(--tl-selectStroke);\n    stroke-width: calc(1.5px * var(--tl-scale));\n  }\n\n  .tl-brush {\n    fill: var(--tl-brushFill);\n    stroke: var(--tl-brushStroke);\n    stroke-width: calc(1px * var(--tl-scale));\n    pointer-events: none;\n  }\n\n  .tl-dot {\n    fill: var(--tl-background);\n    stroke: var(--tl-foreground);\n    stroke-width: 2px;\n  }\n\n  .tl-handle {\n    fill: var(--tl-background);\n    stroke: var(--tl-selectStroke);\n    stroke-width: 1.5px;\n    pointer-events: none;\n  }\n\n  .tl-handle-bg {\n    fill: transparent;\n    stroke: none;\n    r: calc(16px / max(1, var(--tl-zoom)));\n    pointer-events: all;\n    cursor: grab;\n  }\n\n  .tl-handle-bg:active {\n    pointer-events: all;\n    fill: none;\n  }\n\n  .tl-handle-bg:hover {\n    cursor: grab;\n    fill: var(--tl-selectFill);\n  }\n\n  .tl-binding-indicator {\n    stroke-width: calc(3px * var(--tl-scale));\n    fill: var(--tl-selectFill);\n    stroke: var(--tl-selectStroke);\n  }\n\n  .tl-centered {\n    display: grid;\n    place-content: center;\n    place-items: center;\n  }\n\n  .tl-centered > * {\n    grid-column: 1;\n    grid-row: 1;\n  }\n\n  .tl-centered-g {\n    transform: translate(var(--tl-padding), var(--tl-padding));\n  }\n\n  .tl-current-parent > *[data-shy='true'] {\n    opacity: 1;\n  }\n\n  .tl-binding {\n    fill: none;\n    stroke: var(--tl-selectStroke);\n    stroke-width: calc(2px * var(--tl-scale));\n  }\n\n  .tl-grid-dot {\n    fill: var(--tl-grid);\n  }\n\n  .tl-counter-scaled-positioned {\n    position: absolute;\n    top: 0;\n    left: 0;\n    pointer-events: none;\n    padding: 0;\n    contain: layout style size;\n  }\n\n  .tl-fade-in {\n    opacity: 1;\n    transition-timing-function: ease-in-out;\n    transition-property: opacity;\n    transition-duration: 0.12s;\n    transition-delay: 0;\n  }\n\n  .tl-fade-out {\n    opacity: 0;\n    transition-timing-function: ease-out;\n    transition-property: opacity;\n    transition-duration: 0.12s;\n    transition-delay: 0;\n  }\n\n  .tl-counter-scaled-positioned > .tl-positioned-div {\n    user-select: none;\n    padding: 64px;\n  }\n\n  .tl-context-bar > * {\n    grid-column: 1;\n    grid-row: 1;\n  }\n\n  .tl-bounds-detail {\n    padding: 2px 3px;\n    border-radius: 1px;\n    white-space: nowrap;\n    width: fit-content;\n    text-align: center;\n    font-size: 12px;\n    font-weight: 500;\n    background-color: var(--tl-selectStroke);\n    color: var(--tl-background);\n  }\n\n  .tl-hitarea-stroke {\n    fill: none;\n    stroke: transparent;\n    pointer-events: stroke;\n    stroke-width: min(100px, calc(24px * var(--tl-scale)));\n  }\n\n  .tl-hitarea-fill {\n    fill: transparent;\n    stroke: transparent;\n    pointer-events: all;\n    stroke-width: min(100px, calc(24px * var(--tl-scale)));\n  }\n\n  .tl-grid {\n    position: absolute;\n    width: 100%;\n    height: 100%;\n    touch-action: none;\n    pointer-events: none;\n    user-select: none;\n  }\n\n  .tl-grid-dot {\n    fill: var(--tl-grid);\n  }\n\n  .tl-html-canvas {\n    position: absolute;\n    top: 0px;\n    left: 0px;\n    width: 100%;\n    height: 100%;\n    zindex: 20000;\n    pointer-events: none;\n    border: 2px solid red;\n  }\n\n  .tl-direction-indicator {\n    z-index: 100000;\n    position: absolute;\n    top: 0px;\n    left: 0px;\n    fill: var(--tl-selectStroke);\n  }\n"
    ]);
    _templateObject = function _templateObject() {
        return data;
    };
    return data;
}
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = function(obj, key, value) {
    return key in obj ? __defProp(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: value
    }) : obj[key] = value;
};
var __esm = function(fn, res) {
    return function __init() {
        return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    };
};
var __commonJS = function(cb, mod) {
    return function __require() {
        return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = {
            exports: {
            }
        }).exports, mod), mod.exports;
    };
};
var __export = function(target, all) {
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = function(to, from, except, desc) {
    if (from && typeof from === "object" || typeof from === "function") {
        var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
        try {
            var _loop = function(_iterator, _step) {
                var key = _step.value;
                if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
                    get: function() {
                        return from[key];
                    },
                    enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
                });
            };
            for(var _iterator = __getOwnPropNames(from)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true)_loop(_iterator, _step);
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally{
            try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                }
            } finally{
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }
    return to;
};
var __toESM = function(mod, isNodeMode, target) {
    return target = mod != null ? __create(__getProtoOf(mod)) : {
    }, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
        value: mod,
        enumerable: true
    }) : target, mod);
};
var __toCommonJS = function(mod) {
    return __copyProps(__defProp({
    }, "__esModule", {
        value: true
    }), mod);
};
var __decorateClass = function(decorators, target, key, kind) {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
    for(var i = decorators.length - 1, decorator; i >= 0; i--)if (decorator = decorators[i]) result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result) __defProp(target, key, result);
    return result;
};
var __publicField = function(obj, key, value) {
    __defNormalProp(obj, (typeof key === "undefined" ? "undefined" : _typeof(key)) !== "symbol" ? key + "" : key, value);
    return value;
};
// node_modules/tsup/assets/cjs_shims.js
var init_cjs_shims = __esm({
    "node_modules/tsup/assets/cjs_shims.js": function() {
    }
});
// ../../node_modules/mousetrap/mousetrap.js
var require_mousetrap = __commonJS({
    "../../node_modules/mousetrap/mousetrap.js": function(exports, module2) {
        init_cjs_shims();
        (function(window2, document2, undefined2) {
            var _addEvent = function _addEvent(object2, type, callback) {
                if (object2.addEventListener) {
                    object2.addEventListener(type, callback, false);
                    return;
                }
                object2.attachEvent("on" + type, callback);
            };
            var _characterFromEvent = function _characterFromEvent(e) {
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
            };
            var _modifiersMatch = function _modifiersMatch(modifiers1, modifiers2) {
                return modifiers1.sort().join(",") === modifiers2.sort().join(",");
            };
            var _eventModifiers = function _eventModifiers(e) {
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
            };
            var _preventDefault = function _preventDefault(e) {
                if (e.preventDefault) {
                    e.preventDefault();
                    return;
                }
                e.returnValue = false;
            };
            var _stopPropagation = function _stopPropagation(e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                    return;
                }
                e.cancelBubble = true;
            };
            var _isModifier = function _isModifier(key) {
                return key == "shift" || key == "ctrl" || key == "alt" || key == "meta";
            };
            var _getReverseMap = function _getReverseMap() {
                if (!_REVERSE_MAP) {
                    _REVERSE_MAP = {
                    };
                    for(var key in _MAP){
                        if (key > 95 && key < 112) {
                            continue;
                        }
                        if (_MAP.hasOwnProperty(key)) {
                            _REVERSE_MAP[_MAP[key]] = key;
                        }
                    }
                }
                return _REVERSE_MAP;
            };
            var _pickBestAction = function _pickBestAction(key, modifiers, action2) {
                if (!action2) {
                    action2 = _getReverseMap()[key] ? "keydown" : "keypress";
                }
                if (action2 == "keypress" && modifiers.length) {
                    action2 = "keydown";
                }
                return action2;
            };
            var _keysFromString = function _keysFromString(combination) {
                if (combination === "+") {
                    return [
                        "+"
                    ];
                }
                combination = combination.replace(/\+{2}/g, "+plus");
                return combination.split("+");
            };
            var _getKeyInfo = function _getKeyInfo(combination, action2) {
                var keys;
                var key;
                var i2;
                var modifiers = [];
                keys = _keysFromString(combination);
                for(i2 = 0; i2 < keys.length; ++i2){
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
                    key: key,
                    modifiers: modifiers,
                    action: action2
                };
            };
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
            for(var i = 1; i < 20; ++i){
                _MAP[111 + i] = "f" + i;
            }
            for(i = 0; i <= 9; ++i){
                _MAP[i + 96] = i.toString();
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
                if (!_instanceof(self2, Mousetrap2)) {
                    return new Mousetrap2(targetElement);
                }
                self2.target = targetElement;
                self2._callbacks = {
                };
                self2._directMap = {
                };
                var _sequenceLevels = {
                };
                var _resetTimer;
                var _ignoreNextKeyup = false;
                var _ignoreNextKeypress = false;
                var _nextExpectedAction = false;
                function _resetSequences(doNotReset) {
                    doNotReset = doNotReset || {
                    };
                    var activeSequences = false, key;
                    for(key in _sequenceLevels){
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
                        modifiers = [
                            character
                        ];
                    }
                    for(i2 = 0; i2 < self2._callbacks[character].length; ++i2){
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
                    var doNotReset = {
                    };
                    var maxLevel = 0;
                    var processedSequenceCallback = false;
                    for(i2 = 0; i2 < callbacks.length; ++i2){
                        if (callbacks[i2].seq) {
                            maxLevel = Math.max(maxLevel, callbacks[i2].level);
                        }
                    }
                    for(i2 = 0; i2 < callbacks.length; ++i2){
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
                    _resetTimer = setTimeout(_resetSequences, 1000);
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
                    for(var i2 = 0; i2 < keys.length; ++i2){
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
                    _getMatches(info.key, info.modifiers, {
                        type: info.action
                    }, sequenceName, combination, level);
                    self2._callbacks[info.key][sequenceName ? "unshift" : "push"]({
                        callback: callback,
                        modifiers: info.modifiers,
                        action: info.action,
                        seq: sequenceName,
                        level: level,
                        combo: combination
                    });
                }
                self2._bindMultiple = function(combinations, callback, action2) {
                    for(var i2 = 0; i2 < combinations.length; ++i2){
                        _bindSingle(combinations[i2], callback, action2);
                    }
                };
                _addEvent(targetElement, "keypress", _handleKeyEvent);
                _addEvent(targetElement, "keydown", _handleKeyEvent);
                _addEvent(targetElement, "keyup", _handleKeyEvent);
            }
            Mousetrap2.prototype.bind = function(keys, callback, action2) {
                var self2 = this;
                keys = _instanceof(keys, Array) ? keys : [
                    keys
                ];
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
                    self2._directMap[keys + ":" + action2]({
                    }, keys);
                }
                return self2;
            };
            Mousetrap2.prototype.reset = function() {
                var self2 = this;
                self2._callbacks = {
                };
                self2._directMap = {
                };
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
                for(var key in object2){
                    if (object2.hasOwnProperty(key)) {
                        _MAP[key] = object2[key];
                    }
                }
                _REVERSE_MAP = null;
            };
            Mousetrap2.init = function() {
                var documentMousetrap = Mousetrap2(document2);
                for(var method in documentMousetrap){
                    if (method.charAt(0) !== "_") {
                        Mousetrap2[method] = (function(method2) {
                            return function() {
                                return documentMousetrap[method2].apply(documentMousetrap, arguments);
                            };
                        })(method);
                    }
                }
            };
            Mousetrap2.init();
            window2.Mousetrap = Mousetrap2;
            if (typeof module2 !== "undefined" && module2.exports) {
                module2.exports = Mousetrap2;
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
    "../../node_modules/rbush/rbush.min.js": function(exports, module2) {
        init_cjs_shims();
        !function(t, i) {
            typeof exports == "object" && typeof module2 != "undefined" ? module2.exports = i() : typeof define == "function" && define.amd ? define(i) : (t = t || self).RBush = i();
        }(exports, function() {
            "use strict";
            var t = function t(t2, r2, e2, a3, h2) {
                !function t3(n2, r3, e3, a4, h3) {
                    for(; a4 > e3;){
                        if (a4 - e3 > 600) {
                            var o2 = a4 - e3 + 1, s2 = r3 - e3 + 1, l3 = Math.log(o2), f3 = 0.5 * Math.exp(2 * l3 / 3), u2 = 0.5 * Math.sqrt(l3 * f3 * (o2 - f3) / o2) * (s2 - o2 / 2 < 0 ? -1 : 1), m2 = Math.max(e3, Math.floor(r3 - s2 * f3 / o2 + u2)), c2 = Math.min(a4, Math.floor(r3 + (o2 - s2) * f3 / o2 + u2));
                            t3(n2, r3, m2, c2, h3);
                        }
                        var p2 = n2[r3], d2 = e3, x = a4;
                        for(i(n2, e3, r3), h3(n2[a4], p2) > 0 && i(n2, e3, a4); d2 < x;){
                            for(i(n2, d2, x), d2++, x--; h3(n2[d2], p2) < 0;)d2++;
                            for(; h3(n2[x], p2) > 0;)x--;
                        }
                        h3(n2[e3], p2) === 0 ? i(n2, e3, x) : i(n2, ++x, a4), x <= r3 && (e3 = x + 1), r3 <= x && (a4 = x - 1);
                    }
                }(t2, r2, e2 || 0, a3 || t2.length - 1, h2 || n);
            };
            var i = function i(t2, i2, n2) {
                var r2 = t2[i2];
                t2[i2] = t2[n2], t2[n2] = r2;
            };
            var n = function n(t2, i2) {
                return t2 < i2 ? -1 : t2 > i2 ? 1 : 0;
            };
            var e = function e(t2, i2, n2) {
                if (!n2) return i2.indexOf(t2);
                for(var r2 = 0; r2 < i2.length; r2++)if (n2(t2, i2[r2])) return r2;
                return -1;
            };
            var a2 = function a2(t2, i2) {
                h(t2, 0, t2.children.length, i2, t2);
            };
            var h = function h(t2, i2, n2, r2, e2) {
                e2 || (e2 = p(null)), e2.minX = 1 / 0, e2.minY = 1 / 0, e2.maxX = -1 / 0, e2.maxY = -1 / 0;
                for(var a3 = i2; a3 < n2; a3++){
                    var h2 = t2.children[a3];
                    o(e2, t2.leaf ? r2(h2) : h2);
                }
                return e2;
            };
            var o = function o(t2, i2) {
                return t2.minX = Math.min(t2.minX, i2.minX), t2.minY = Math.min(t2.minY, i2.minY), t2.maxX = Math.max(t2.maxX, i2.maxX), t2.maxY = Math.max(t2.maxY, i2.maxY), t2;
            };
            var s = function s(t2, i2) {
                return t2.minX - i2.minX;
            };
            var l2 = function l2(t2, i2) {
                return t2.minY - i2.minY;
            };
            var f2 = function f2(t2) {
                return (t2.maxX - t2.minX) * (t2.maxY - t2.minY);
            };
            var u = function u(t2) {
                return t2.maxX - t2.minX + (t2.maxY - t2.minY);
            };
            var m = function m(t2, i2) {
                return t2.minX <= i2.minX && t2.minY <= i2.minY && i2.maxX <= t2.maxX && i2.maxY <= t2.maxY;
            };
            var c = function c(t2, i2) {
                return i2.minX <= t2.maxX && i2.minY <= t2.maxY && i2.maxX >= t2.minX && i2.maxY >= t2.minY;
            };
            var p = function p(t2) {
                return {
                    children: t2,
                    height: 1,
                    leaf: true,
                    minX: 1 / 0,
                    minY: 1 / 0,
                    maxX: -1 / 0,
                    maxY: -1 / 0
                };
            };
            var d = function d(i2, n2, r2, e2, a3) {
                for(var h2 = [
                    n2,
                    r2
                ]; h2.length;)if (!((r2 = h2.pop()) - (n2 = h2.pop()) <= e2)) {
                    var o2 = n2 + Math.ceil((r2 - n2) / e2 / 2) * e2;
                    t(i2, o2, n2, r2, a3), h2.push(n2, o2, o2, r2);
                }
            };
            var r = function r(t2) {
                t2 === void 0 && (t2 = 9), this._maxEntries = Math.max(4, t2), this._minEntries = Math.max(2, Math.ceil(0.4 * this._maxEntries)), this.clear();
            };
            return r.prototype.all = function() {
                return this._all(this.data, []);
            }, r.prototype.search = function(t2) {
                var i2 = this.data, n2 = [];
                if (!c(t2, i2)) return n2;
                for(var r2 = this.toBBox, e2 = []; i2;){
                    for(var a3 = 0; a3 < i2.children.length; a3++){
                        var h2 = i2.children[a3], o2 = i2.leaf ? r2(h2) : h2;
                        c(t2, o2) && (i2.leaf ? n2.push(h2) : m(t2, o2) ? this._all(h2, n2) : e2.push(h2));
                    }
                    i2 = e2.pop();
                }
                return n2;
            }, r.prototype.collides = function(t2) {
                var i2 = this.data;
                if (!c(t2, i2)) return false;
                for(var n2 = []; i2;){
                    for(var r2 = 0; r2 < i2.children.length; r2++){
                        var e2 = i2.children[r2], a3 = i2.leaf ? this.toBBox(e2) : e2;
                        if (c(t2, a3)) {
                            if (i2.leaf || m(t2, a3)) return true;
                            n2.push(e2);
                        }
                    }
                    i2 = n2.pop();
                }
                return false;
            }, r.prototype.load = function(t2) {
                if (!t2 || !t2.length) return this;
                if (t2.length < this._minEntries) {
                    for(var i2 = 0; i2 < t2.length; i2++)this.insert(t2[i2]);
                    return this;
                }
                var n2 = this._build(t2.slice(), 0, t2.length - 1, 0);
                if (this.data.children.length) if (this.data.height === n2.height) this._splitRoot(this.data, n2);
                else {
                    if (this.data.height < n2.height) {
                        var r2 = this.data;
                        this.data = n2, n2 = r2;
                    }
                    this._insert(n2, this.data.height - n2.height - 1, true);
                }
                else this.data = n2;
                return this;
            }, r.prototype.insert = function(t2) {
                return t2 && this._insert(t2, this.data.height - 1), this;
            }, r.prototype.clear = function() {
                return this.data = p([]), this;
            }, r.prototype.remove = function(t2, i2) {
                if (!t2) return this;
                for(var n2, r2, a3, h2 = this.data, o2 = this.toBBox(t2), s2 = [], l3 = []; h2 || s2.length;){
                    if (h2 || (h2 = s2.pop(), r2 = s2[s2.length - 1], n2 = l3.pop(), a3 = true), h2.leaf) {
                        var f3 = e(t2, h2.children, i2);
                        if (f3 !== -1) return h2.children.splice(f3, 1), s2.push(h2), this._condense(s2), this;
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
                for(var n2 = []; t2;)t2.leaf ? i2.push.apply(i2, t2.children) : n2.push.apply(n2, t2.children), t2 = n2.pop();
                return i2;
            }, r.prototype._build = function(t2, i2, n2, r2) {
                var e2, h2 = n2 - i2 + 1, o2 = this._maxEntries;
                if (h2 <= o2) return a2(e2 = p(t2.slice(i2, n2 + 1)), this.toBBox), e2;
                r2 || (r2 = Math.ceil(Math.log(h2) / Math.log(o2)), o2 = Math.ceil(h2 / Math.pow(o2, r2 - 1))), (e2 = p([])).leaf = false, e2.height = r2;
                var s2 = Math.ceil(h2 / o2), l3 = s2 * Math.ceil(Math.sqrt(o2));
                d(t2, i2, n2, l3, this.compareMinX);
                for(var f3 = i2; f3 <= n2; f3 += l3){
                    var u2 = Math.min(f3 + l3 - 1, n2);
                    d(t2, f3, u2, s2, this.compareMinY);
                    for(var m2 = f3; m2 <= u2; m2 += s2){
                        var c2 = Math.min(m2 + s2 - 1, u2);
                        e2.children.push(this._build(t2, m2, c2, r2 - 1));
                    }
                }
                return a2(e2, this.toBBox), e2;
            }, r.prototype._chooseSubtree = function(t2, i2, n2, r2) {
                for(; r2.push(i2), !i2.leaf && r2.length - 1 !== n2;){
                    for(var e2 = 1 / 0, a3 = 1 / 0, h2 = void 0, o2 = 0; o2 < i2.children.length; o2++){
                        var s2 = i2.children[o2], l3 = f2(s2), u2 = (m2 = t2, c2 = s2, (Math.max(c2.maxX, m2.maxX) - Math.min(c2.minX, m2.minX)) * (Math.max(c2.maxY, m2.maxY) - Math.min(c2.minY, m2.minY)) - l3);
                        u2 < a3 ? (a3 = u2, e2 = l3 < e2 ? l3 : e2, h2 = s2) : u2 === a3 && l3 < e2 && (e2 = l3, h2 = s2);
                    }
                    i2 = h2 || i2.children[0];
                }
                var m2, c2;
                return i2;
            }, r.prototype._insert = function(t2, i2, n2) {
                var r2 = n2 ? t2 : this.toBBox(t2), e2 = [], a3 = this._chooseSubtree(r2, this.data, i2, e2);
                for(a3.children.push(t2), o(a3, r2); i2 >= 0 && e2[i2].children.length > this._maxEntries;)this._split(e2, i2), i2--;
                this._adjustParentBBoxes(r2, e2, i2);
            }, r.prototype._split = function(t2, i2) {
                var n2 = t2[i2], r2 = n2.children.length, e2 = this._minEntries;
                this._chooseSplitAxis(n2, e2, r2);
                var h2 = this._chooseSplitIndex(n2, e2, r2), o2 = p(n2.children.splice(h2, n2.children.length - h2));
                o2.height = n2.height, o2.leaf = n2.leaf, a2(n2, this.toBBox), a2(o2, this.toBBox), i2 ? t2[i2 - 1].children.push(o2) : this._splitRoot(n2, o2);
            }, r.prototype._splitRoot = function(t2, i2) {
                this.data = p([
                    t2,
                    i2
                ]), this.data.height = t2.height + 1, this.data.leaf = false, a2(this.data, this.toBBox);
            }, r.prototype._chooseSplitIndex = function(t2, i2, n2) {
                for(var r2, e2, a3, o2, s2, l3, u2, m2 = 1 / 0, c2 = 1 / 0, p2 = i2; p2 <= n2 - i2; p2++){
                    var d2 = h(t2, 0, p2, this.toBBox), x = h(t2, p2, n2, this.toBBox), v = (e2 = d2, a3 = x, o2 = void 0, s2 = void 0, l3 = void 0, u2 = void 0, o2 = Math.max(e2.minX, a3.minX), s2 = Math.max(e2.minY, a3.minY), l3 = Math.min(e2.maxX, a3.maxX), u2 = Math.min(e2.maxY, a3.maxY), Math.max(0, l3 - o2) * Math.max(0, u2 - s2)), M = f2(d2) + f2(x);
                    v < m2 ? (m2 = v, r2 = p2, c2 = M < c2 ? M : c2) : v === m2 && M < c2 && (c2 = M, r2 = p2);
                }
                return r2 || n2 - i2;
            }, r.prototype._chooseSplitAxis = function(t2, i2, n2) {
                var r2 = t2.leaf ? this.compareMinX : s, e2 = t2.leaf ? this.compareMinY : l2;
                this._allDistMargin(t2, i2, n2, r2) < this._allDistMargin(t2, i2, n2, e2) && t2.children.sort(r2);
            }, r.prototype._allDistMargin = function(t2, i2, n2, r2) {
                t2.children.sort(r2);
                for(var e2 = this.toBBox, a3 = h(t2, 0, i2, e2), s2 = h(t2, n2 - i2, n2, e2), l3 = u(a3) + u(s2), f3 = i2; f3 < n2 - i2; f3++){
                    var m2 = t2.children[f3];
                    o(a3, t2.leaf ? e2(m2) : m2), l3 += u(a3);
                }
                for(var c2 = n2 - i2 - 1; c2 >= i2; c2--){
                    var p2 = t2.children[c2];
                    o(s2, t2.leaf ? e2(p2) : p2), l3 += u(s2);
                }
                return l3;
            }, r.prototype._adjustParentBBoxes = function(t2, i2, n2) {
                for(var r2 = n2; r2 >= 0; r2--)o(i2[r2], t2);
            }, r.prototype._condense = function(t2) {
                for(var i2 = t2.length - 1, n2 = void 0; i2 >= 0; i2--)t2[i2].children.length === 0 ? i2 > 0 ? (n2 = t2[i2 - 1].children).splice(n2.indexOf(t2[i2]), 1) : this.clear() : a2(t2[i2], this.toBBox);
            }, r;
        });
    }
});
// src/index.ts
var src_exports = {
};
__export(src_exports, {
    App: function() {
        return App3;
    }
});
module.exports = __toCommonJS(src_exports);
init_cjs_shims();
// src/app.tsx
init_cjs_shims();
// ../../packages/react/dist/esm/index.js
init_cjs_shims();
// ../../packages/core/dist/esm/index.js
init_cjs_shims();
// ../../node_modules/nanoid/index.prod.js
init_cjs_shims();
// ../../node_modules/nanoid/url-alphabet/index.js
init_cjs_shims();
// ../../node_modules/nanoid/index.prod.js
if (false) {
    if (typeof navigator !== "undefined" && navigator.product === "ReactNative" && typeof crypto === "undefined") {
        throw new Error("React Native does not have a built-in secure random generator. If you don’t need unpredictable IDs use `nanoid/non-secure`. For secure IDs, import `react-native-get-random-values` before Nano ID.");
    }
    if (typeof msCrypto !== "undefined" && typeof crypto === "undefined") {
        throw new Error("Import file with `if (!window.crypto) window.crypto = window.msCrypto` before importing Nano ID to fix IE 11 support");
    }
    if (typeof crypto === "undefined") {
        throw new Error("Your browser does not have secure random generator. If you don’t need unpredictable IDs, you can use nanoid/non-secure.");
    }
}
var nanoid = function(param) {
    var size = param === void 0 ? 21 : param;
    var id = "";
    var bytes = crypto.getRandomValues(new Uint8Array(size));
    while(size--){
        var byte = bytes[size] & 63;
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
init_cjs_shims();
var __defProp2 = Object.defineProperty;
var __defNormalProp2 = function(obj, key, value) {
    return key in obj ? __defProp2(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: value
    }) : obj[key] = value;
};
var __publicField2 = function(obj, key, value) {
    __defNormalProp2(obj, (typeof key === "undefined" ? "undefined" : _typeof(key)) !== "symbol" ? key + "" : key, value);
    return value;
};
var _Vec = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        _classCallCheck(this, _class);
    }
    _createClass(_class, null, [
        {
            key: "clamp",
            value: function clamp(n, min, max) {
                return Math.max(min, typeof max !== "undefined" ? Math.min(n, max) : n);
            }
        },
        {
            key: "clampV",
            value: function clampV(A, min, max) {
                return A.map(function(n) {
                    return max ? _Vec.clamp(n, min, max) : _Vec.clamp(n, min);
                });
            }
        },
        {
            key: "cross",
            value: function cross(x, y, z) {
                return (y[0] - x[0]) * (z[1] - x[1]) - (z[0] - x[0]) * (y[1] - x[1]);
            }
        },
        {
            key: "snap",
            value: function snap(a2, param) {
                var step = param === void 0 ? 1 : param;
                return [
                    Math.round(a2[0] / step) * step,
                    Math.round(a2[1] / step) * step
                ];
            }
        }
    ]);
    return _class;
}();
var Vec = _Vec;
__publicField2(Vec, "neg", function(A) {
    return [
        -A[0],
        -A[1]
    ];
});
__publicField2(Vec, "add", function(A, B) {
    return [
        A[0] + B[0],
        A[1] + B[1]
    ];
});
__publicField2(Vec, "addScalar", function(A, n) {
    return [
        A[0] + n,
        A[1] + n
    ];
});
__publicField2(Vec, "sub", function(A, B) {
    return [
        A[0] - B[0],
        A[1] - B[1]
    ];
});
__publicField2(Vec, "subScalar", function(A, n) {
    return [
        A[0] - n,
        A[1] - n
    ];
});
__publicField2(Vec, "vec", function(A, B) {
    return [
        B[0] - A[0],
        B[1] - A[1]
    ];
});
__publicField2(Vec, "mul", function(A, n) {
    return [
        A[0] * n,
        A[1] * n
    ];
});
__publicField2(Vec, "mulV", function(A, B) {
    return [
        A[0] * B[0],
        A[1] * B[1]
    ];
});
__publicField2(Vec, "div", function(A, n) {
    return [
        A[0] / n,
        A[1] / n
    ];
});
__publicField2(Vec, "divV", function(A, B) {
    return [
        A[0] / B[0],
        A[1] / B[1]
    ];
});
__publicField2(Vec, "per", function(A) {
    return [
        A[1],
        -A[0]
    ];
});
__publicField2(Vec, "dpr", function(A, B) {
    return A[0] * B[0] + A[1] * B[1];
});
__publicField2(Vec, "cpr", function(A, B) {
    return A[0] * B[1] - B[0] * A[1];
});
__publicField2(Vec, "len2", function(A) {
    return A[0] * A[0] + A[1] * A[1];
});
__publicField2(Vec, "len", function(A) {
    return Math.hypot(A[0], A[1]);
});
__publicField2(Vec, "pry", function(A, B) {
    return _Vec.dpr(A, B) / _Vec.len(B);
});
__publicField2(Vec, "uni", function(A) {
    return _Vec.div(A, _Vec.len(A));
});
__publicField2(Vec, "normalize", function(A) {
    return _Vec.uni(A);
});
__publicField2(Vec, "tangent", function(A, B) {
    return _Vec.uni(_Vec.sub(A, B));
});
__publicField2(Vec, "dist2", function(A, B) {
    return _Vec.len2(_Vec.sub(A, B));
});
__publicField2(Vec, "dist", function(A, B) {
    return Math.hypot(A[1] - B[1], A[0] - B[0]);
});
__publicField2(Vec, "fastDist", function(A, B) {
    var V3 = [
        B[0] - A[0],
        B[1] - A[1]
    ];
    var aV = [
        Math.abs(V3[0]),
        Math.abs(V3[1])
    ];
    var r = 1 / Math.max(aV[0], aV[1]);
    r = r * (1.29289 - (aV[0] + aV[1]) * r * 0.29289);
    return [
        V3[0] * r,
        V3[1] * r
    ];
});
__publicField2(Vec, "ang", function(A, B) {
    return Math.atan2(_Vec.cpr(A, B), _Vec.dpr(A, B));
});
__publicField2(Vec, "angle", function(A, B) {
    return Math.atan2(B[1] - A[1], B[0] - A[0]);
});
__publicField2(Vec, "med", function(A, B) {
    return _Vec.mul(_Vec.add(A, B), 0.5);
});
__publicField2(Vec, "rot", function(A, param) {
    var r = param === void 0 ? 0 : param;
    return [
        A[0] * Math.cos(r) - A[1] * Math.sin(r),
        A[0] * Math.sin(r) + A[1] * Math.cos(r)
    ];
});
__publicField2(Vec, "rotWith", function(A, C, param) {
    var r = param === void 0 ? 0 : param;
    if (r === 0) return A;
    var s = Math.sin(r);
    var c = Math.cos(r);
    var px = A[0] - C[0];
    var py = A[1] - C[1];
    var nx = px * c - py * s;
    var ny = px * s + py * c;
    return [
        nx + C[0],
        ny + C[1]
    ];
});
__publicField2(Vec, "isEqual", function(A, B) {
    return A[0] === B[0] && A[1] === B[1];
});
__publicField2(Vec, "lrp", function(A, B, t) {
    return _Vec.add(A, _Vec.mul(_Vec.sub(B, A), t));
});
__publicField2(Vec, "int", function(A, B, from, to, param) {
    var s = param === void 0 ? 1 : param;
    var t = (_Vec.clamp(from, to) - from) / (to - from);
    return _Vec.add(_Vec.mul(A, 1 - t), _Vec.mul(B, s));
});
__publicField2(Vec, "ang3", function(p1, pc, p2) {
    var v1 = _Vec.vec(pc, p1);
    var v2 = _Vec.vec(pc, p2);
    return _Vec.ang(v1, v2);
});
__publicField2(Vec, "abs", function(A) {
    return [
        Math.abs(A[0]),
        Math.abs(A[1])
    ];
});
__publicField2(Vec, "rescale", function(a2, n) {
    var l2 = _Vec.len(a2);
    return [
        n * a2[0] / l2,
        n * a2[1] / l2
    ];
});
__publicField2(Vec, "isLeft", function(p1, pc, p2) {
    return (pc[0] - p1[0]) * (p2[1] - p1[1]) - (p2[0] - p1[0]) * (pc[1] - p1[1]);
});
__publicField2(Vec, "clockwise", function(p1, pc, p2) {
    return _Vec.isLeft(p1, pc, p2) > 0;
});
__publicField2(Vec, "toFixed", function(a2, param) {
    var d = param === void 0 ? 2 : param;
    return a2.map(function(v) {
        return +v.toFixed(d);
    });
});
__publicField2(Vec, "nearestPointOnLineThroughPoint", function(A, u, P) {
    return _Vec.add(A, _Vec.mul(u, _Vec.pry(_Vec.sub(P, A), u)));
});
__publicField2(Vec, "distanceToLineThroughPoint", function(A, u, P) {
    return _Vec.dist(P, _Vec.nearestPointOnLineThroughPoint(A, u, P));
});
__publicField2(Vec, "nearestPointOnLineSegment", function(A, B, P, param) {
    var clamp2 = param === void 0 ? true : param;
    var u = _Vec.uni(_Vec.sub(B, A));
    var C = _Vec.add(A, _Vec.mul(u, _Vec.pry(_Vec.sub(P, A), u)));
    if (clamp2) {
        if (C[0] < Math.min(A[0], B[0])) return A[0] < B[0] ? A : B;
        if (C[0] > Math.max(A[0], B[0])) return A[0] > B[0] ? A : B;
        if (C[1] < Math.min(A[1], B[1])) return A[1] < B[1] ? A : B;
        if (C[1] > Math.max(A[1], B[1])) return A[1] > B[1] ? A : B;
    }
    return C;
});
__publicField2(Vec, "distanceToLineSegment", function(A, B, P, param) {
    var clamp2 = param === void 0 ? true : param;
    return _Vec.dist(P, _Vec.nearestPointOnLineSegment(A, B, P, clamp2));
});
__publicField2(Vec, "nudge", function(A, B, d) {
    return _Vec.add(A, _Vec.mul(_Vec.uni(_Vec.sub(B, A)), d));
});
__publicField2(Vec, "nudgeAtAngle", function(A, a2, d) {
    return [
        Math.cos(a2) * d + A[0],
        Math.sin(a2) * d + A[1]
    ];
});
__publicField2(Vec, "toPrecision", function(a2, param) {
    var n = param === void 0 ? 4 : param;
    return [
        +a2[0].toPrecision(n),
        +a2[1].toPrecision(n)
    ];
});
__publicField2(Vec, "pointsBetween", function(A, B, param) {
    var steps = param === void 0 ? 6 : param;
    return Array.from(Array(steps)).map(function(_15, i) {
        var t = i / (steps - 1);
        var k = Math.min(1, 0.5 + Math.abs(0.5 - t));
        return _toConsumableArray(_Vec.lrp(A, B, t)).concat([
            k
        ]);
    });
});
__publicField2(Vec, "slope", function(A, B) {
    if (A[0] === B[0]) return NaN;
    return (A[1] - B[1]) / (A[0] - B[0]);
});
__publicField2(Vec, "toAngle", function(A) {
    var angle = Math.atan2(A[1], A[0]);
    if (angle < 0) return angle + Math.PI * 2;
    return angle;
});
__publicField2(Vec, "max", function() {
    for(var _len = arguments.length, v = new Array(_len), _key = 0; _key < _len; _key++){
        v[_key] = arguments[_key];
    }
    var _Math, _Math1;
    return [
        (_Math = Math).max.apply(_Math, _toConsumableArray(v.map(function(a2) {
            return a2[0];
        }))),
        (_Math1 = Math).max.apply(_Math1, _toConsumableArray(v.map(function(a2) {
            return a2[1];
        })))
    ];
});
__publicField2(Vec, "min", function() {
    for(var _len = arguments.length, v = new Array(_len), _key = 0; _key < _len; _key++){
        v[_key] = arguments[_key];
    }
    var _Math, _Math2;
    return [
        (_Math = Math).min.apply(_Math, _toConsumableArray(v.map(function(a2) {
            return a2[0];
        }))),
        (_Math2 = Math).min.apply(_Math2, _toConsumableArray(v.map(function(a2) {
            return a2[1];
        })))
    ];
});
var src_default = Vec;
// ../../packages/core/dist/esm/index.js
var import_mousetrap = __toESM(require_mousetrap());
// ../../packages/utils/intersect/dist/esm/index.js
init_cjs_shims();
var __defProp3 = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp3 = function(obj, key, value) {
    return key in obj ? __defProp3(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: value
    }) : obj[key] = value;
};
var __spreadValues = function(a2, b) {
    for(var prop in b || (b = {
    }))if (__hasOwnProp2.call(b, prop)) __defNormalProp3(a2, prop, b[prop]);
    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
    if (__getOwnPropSymbols) try {
        for(var _iterator = __getOwnPropSymbols(b)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
            var prop = _step.value;
            if (__propIsEnum.call(b, prop)) __defNormalProp3(a2, prop, b[prop]);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally{
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally{
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
    return a2;
};
var __spreadProps = function(a2, b) {
    return __defProps(a2, __getOwnPropDescs(b));
};
function createIntersection(message) {
    for(var _len = arguments.length, points = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
        points[_key - 1] = arguments[_key];
    }
    var didIntersect = points.length > 0;
    return {
        didIntersect: didIntersect,
        message: message,
        points: points
    };
}
function getRectangleSides(point, size, param) {
    var rotation = param === void 0 ? 0 : param;
    var center = [
        point[0] + size[0] / 2,
        point[1] + size[1] / 2
    ];
    var tl = Vec.rotWith(point, center, rotation);
    var tr = Vec.rotWith(Vec.add(point, [
        size[0],
        0
    ]), center, rotation);
    var br = Vec.rotWith(Vec.add(point, size), center, rotation);
    var bl = Vec.rotWith(Vec.add(point, [
        0,
        size[1]
    ]), center, rotation);
    return [
        [
            tl,
            tr
        ],
        [
            tr,
            br
        ],
        [
            br,
            bl
        ],
        [
            bl,
            tl
        ]
    ];
}
function intersectLineLine(AB, PQ) {
    var slopeAB = Vec.slope(AB[0], AB[1]);
    var slopePQ = Vec.slope(PQ[0], PQ[1]);
    if (slopeAB === slopePQ) return createIntersection("no intersection");
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
    var x = (slopeAB * AB[0][0] - slopePQ * PQ[0][0] + PQ[0][1] - AB[0][1]) / (slopeAB - slopePQ);
    var y = slopePQ * (x - PQ[0][0]) + PQ[0][1];
    return createIntersection("intersection", [
        x,
        y
    ]);
}
function intersectRayLineSegment(origin, direction, a1, a2) {
    var _origin = _slicedToArray(origin, 2), x = _origin[0], y = _origin[1];
    var _direction = _slicedToArray(direction, 2), dx = _direction[0], dy = _direction[1];
    var _a1 = _slicedToArray(a1, 2), x1 = _a1[0], y1 = _a1[1];
    var _a2 = _slicedToArray(a2, 2), x2 = _a2[0], y2 = _a2[1];
    if (dy / dx !== (y2 - y1) / (x2 - x1)) {
        var d = dx * (y2 - y1) - dy * (x2 - x1);
        if (d !== 0) {
            var r = ((y - y1) * (x2 - x1) - (x - x1) * (y2 - y1)) / d;
            var s = ((y - y1) * dx - (x - x1) * dy) / d;
            if (r >= 0 && s >= 0 && s <= 1) {
                return createIntersection("intersection", [
                    x + r * dx,
                    y + r * dy
                ]);
            }
        }
    }
    return createIntersection("no intersection");
}
function intersectLineSegmentLineSegment(a1, a2, b1, b2) {
    var AB = Vec.sub(a1, b1);
    var BV = Vec.sub(b2, b1);
    var AV = Vec.sub(a2, a1);
    var ua_t = BV[0] * AB[1] - BV[1] * AB[0];
    var ub_t = AV[0] * AB[1] - AV[1] * AB[0];
    var u_b = BV[1] * AV[0] - BV[0] * AV[1];
    if (ua_t === 0 || ub_t === 0) return createIntersection("coincident");
    if (u_b === 0) return createIntersection("parallel");
    if (u_b !== 0) {
        var ua = ua_t / u_b;
        var ub = ub_t / u_b;
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
    var a3 = (a2[0] - a1[0]) * (a2[0] - a1[0]) + (a2[1] - a1[1]) * (a2[1] - a1[1]);
    var b = 2 * ((a2[0] - a1[0]) * (a1[0] - c[0]) + (a2[1] - a1[1]) * (a1[1] - c[1]));
    var cc = c[0] * c[0] + c[1] * c[1] + a1[0] * a1[0] + a1[1] * a1[1] - 2 * (c[0] * a1[0] + c[1] * a1[1]) - r * r;
    var deter = b * b - 4 * a3 * cc;
    if (deter < 0) return createIntersection("outside");
    if (deter === 0) return createIntersection("tangent");
    var e = Math.sqrt(deter);
    var u1 = (-b + e) / (2 * a3);
    var u2 = (-b - e) / (2 * a3);
    if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
        if (u1 < 0 && u2 < 0 || u1 > 1 && u2 > 1) {
            return createIntersection("outside");
        } else return createIntersection("inside");
    }
    var results = [];
    if (0 <= u1 && u1 <= 1) results.push(Vec.lrp(a1, a2, u1));
    if (0 <= u2 && u2 <= 1) results.push(Vec.lrp(a1, a2, u2));
    return createIntersection.apply(void 0, [
        "intersection"
    ].concat(_toConsumableArray(results)));
}
function intersectLineSegmentEllipse(a1, a2, center, rx, ry, param) {
    var rotation = param === void 0 ? 0 : param;
    if (rx === 0 || ry === 0 || Vec.isEqual(a1, a2)) return createIntersection("no intersection");
    rx = rx < 0 ? rx : -rx;
    ry = ry < 0 ? ry : -ry;
    a1 = Vec.sub(Vec.rotWith(a1, center, -rotation), center);
    a2 = Vec.sub(Vec.rotWith(a2, center, -rotation), center);
    var diff = Vec.sub(a2, a1);
    var A = diff[0] * diff[0] / rx / rx + diff[1] * diff[1] / ry / ry;
    var B = 2 * a1[0] * diff[0] / rx / rx + 2 * a1[1] * diff[1] / ry / ry;
    var C = a1[0] * a1[0] / rx / rx + a1[1] * a1[1] / ry / ry - 1;
    var tValues = [];
    var discriminant = B * B - 4 * A * C;
    if (discriminant === 0) {
        tValues.push(-B / 2 / A);
    } else if (discriminant > 0) {
        var root = Math.sqrt(discriminant);
        tValues.push((-B + root) / 2 / A);
        tValues.push((-B - root) / 2 / A);
    }
    return createIntersection.apply(void 0, [
        "intersection"
    ].concat(_toConsumableArray(tValues.filter(function(t) {
        return t >= 0 && t <= 1;
    }).map(function(t) {
        return Vec.add(center, Vec.add(a1, Vec.mul(Vec.sub(a2, a1), t)));
    }).map(function(p) {
        return Vec.rotWith(p, center, rotation);
    }))));
}
function intersectLineSegmentBounds(a1, a2, bounds) {
    return intersectBoundsLineSegment(bounds, a1, a2);
}
function intersectLineSegmentPolyline(a1, a2, points) {
    var pts = [];
    for(var i = 1; i < points.length; i++){
        var _pts;
        var int = intersectLineSegmentLineSegment(a1, a2, points[i - 1], points[i]);
        if (int) (_pts = pts).push.apply(_pts, _toConsumableArray(int.points));
    }
    if (pts.length === 0) return createIntersection("no intersection");
    return createIntersection.apply(void 0, [
        "intersection"
    ].concat(_toConsumableArray(points)));
}
function intersectLineSegmentPolygon(a1, a2, points) {
    var pts = [];
    for(var i = 1; i < points.length + 1; i++){
        var _pts;
        var int = intersectLineSegmentLineSegment(a1, a2, points[i - 1], points[i % points.length]);
        if (int) (_pts = pts).push.apply(_pts, _toConsumableArray(int.points));
    }
    if (!pts.length) return createIntersection("no intersection");
    return createIntersection.apply(void 0, [
        "intersection"
    ].concat(_toConsumableArray(points)));
}
function intersectRectangleLineSegment(point, size, a1, a2) {
    return getRectangleSides(point, size).reduce(function(acc, param, i) {
        var _param = _slicedToArray(param, 2), b1 = _param[0], b2 = _param[1];
        var intersection = intersectLineSegmentLineSegment(a1, a2, b1, b2);
        if (intersection) acc.push(createIntersection.apply(void 0, [
            SIDES[i]
        ].concat(_toConsumableArray(intersection.points))));
        return acc;
    }, []).filter(function(int) {
        return int.didIntersect;
    });
}
function intersectRectangleCircle(point, size, c, r) {
    return getRectangleSides(point, size).reduce(function(acc, param, i) {
        var _param = _slicedToArray(param, 2), a1 = _param[0], a2 = _param[1];
        var intersection = intersectLineSegmentCircle(a1, a2, c, r);
        if (intersection) acc.push(__spreadProps(__spreadValues({
        }, intersection), {
            message: SIDES[i]
        }));
        return acc;
    }, []).filter(function(int) {
        return int.didIntersect;
    });
}
function intersectRectangleEllipse(point, size, c, rx, ry, param1) {
    var rotation = param1 === void 0 ? 0 : param1;
    return getRectangleSides(point, size).reduce(function(acc, param, i) {
        var _param = _slicedToArray(param, 2), a1 = _param[0], a2 = _param[1];
        var intersection = intersectLineSegmentEllipse(a1, a2, c, rx, ry, rotation);
        if (intersection) acc.push(__spreadProps(__spreadValues({
        }, intersection), {
            message: SIDES[i]
        }));
        return acc;
    }, []).filter(function(int) {
        return int.didIntersect;
    });
}
function intersectRectanglePolyline(point, size, points) {
    return getRectangleSides(point, size).reduce(function(acc, param, i) {
        var _param = _slicedToArray(param, 2), a1 = _param[0], a2 = _param[1];
        var intersection = intersectLineSegmentPolyline(a1, a2, points);
        if (intersection.didIntersect) acc.push(createIntersection.apply(void 0, [
            SIDES[i]
        ].concat(_toConsumableArray(intersection.points))));
        return acc;
    }, []).filter(function(int) {
        return int.didIntersect;
    });
}
function intersectRectanglePolygon(point, size, points) {
    return getRectangleSides(point, size).reduce(function(acc, param, i) {
        var _param = _slicedToArray(param, 2), a1 = _param[0], a2 = _param[1];
        var intersection = intersectLineSegmentPolygon(a1, a2, points);
        if (intersection.didIntersect) acc.push(createIntersection.apply(void 0, [
            SIDES[i]
        ].concat(_toConsumableArray(intersection.points))));
        return acc;
    }, []).filter(function(int) {
        return int.didIntersect;
    });
}
function intersectEllipseRectangle(center, rx, ry, param, point, size) {
    var rotation = param === void 0 ? 0 : param;
    if (rx === ry) return intersectRectangleCircle(point, size, center, rx);
    return intersectRectangleEllipse(point, size, center, rx, ry, rotation);
}
function intersectEllipseBounds(c, rx, ry, rotation, bounds) {
    var minX = bounds.minX, minY = bounds.minY, width = bounds.width, height = bounds.height;
    return intersectEllipseRectangle(c, rx, ry, rotation, [
        minX,
        minY
    ], [
        width,
        height
    ]);
}
function intersectBoundsLineSegment(bounds, a1, a2) {
    var minX = bounds.minX, minY = bounds.minY, width = bounds.width, height = bounds.height;
    return intersectLineSegmentRectangle(a1, a2, [
        minX,
        minY
    ], [
        width,
        height
    ]);
}
function intersectPolylineBounds(points, bounds) {
    return intersectRectanglePolyline([
        bounds.minX,
        bounds.minY
    ], [
        bounds.width,
        bounds.height
    ], points);
}
function intersectPolygonBounds(points, bounds) {
    return intersectRectanglePolygon([
        bounds.minX,
        bounds.minY
    ], [
        bounds.width,
        bounds.height
    ], points);
}
var SIDES = [
    "top",
    "right",
    "bottom",
    "left"
];
// ../../node_modules/is-plain-object/dist/is-plain-object.mjs
init_cjs_shims();
// ../../node_modules/mobx/dist/mobx.esm.js
init_cjs_shims();
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
var errors = true ? niceErrors : {
};
function die(error) {
    for(var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
        args[_key - 1] = arguments[_key];
    }
    if (true) {
        var e = typeof error === "string" ? error : errors[error];
        if (typeof e === "function") e = e.apply(null, args);
        throw new Error("[MobX] " + e);
    }
    throw new Error(typeof error === "number" ? "[MobX] minified error nr: " + error + (args.length ? " " + args.map(String).join(",") : "") + ". Find the full error at: https://github.com/mobxjs/mobx/blob/main/packages/mobx/src/errors.ts" : "[MobX] " + error);
}
var mockGlobal = {
};
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
var EMPTY_OBJECT = {
};
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
        if (invoked) return;
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
    var t = typeof value === "undefined" ? "undefined" : _typeof(value);
    switch(t){
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
    if (!isObject(value)) return false;
    var proto = Object.getPrototypeOf(value);
    if (proto == null) return true;
    return ((_proto$constructor = proto.constructor) == null ? void 0 : _proto$constructor.toString()) === plainObjectString;
}
function isGenerator(obj) {
    var constructor = obj == null ? void 0 : obj.constructor;
    if (!constructor) return false;
    if (constructor.name === "GeneratorFunction" || constructor.displayName === "GeneratorFunction") return true;
    return false;
}
function addHiddenProp(object2, propName, value) {
    defineProperty(object2, propName, {
        enumerable: false,
        writable: true,
        configurable: true,
        value: value
    });
}
function addHiddenFinalProp(object2, propName, value) {
    defineProperty(object2, propName, {
        enumerable: false,
        writable: false,
        configurable: true,
        value: value
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
    return _instanceof(thing, Map);
}
function isES6Set(thing) {
    return _instanceof(thing, Set);
}
var hasGetOwnPropertySymbols = typeof Object.getOwnPropertySymbols !== "undefined";
function getPlainObjectKeys(object2) {
    var keys = Object.keys(object2);
    if (!hasGetOwnPropertySymbols) return keys;
    var symbols = Object.getOwnPropertySymbols(object2);
    if (!symbols.length) return keys;
    return [].concat(keys, symbols.filter(function(s) {
        return objectPrototype.propertyIsEnumerable.call(object2, s);
    }));
}
var ownKeys1 = typeof Reflect !== "undefined" && Reflect.ownKeys ? Reflect.ownKeys : hasGetOwnPropertySymbols ? function ownKeys1(obj) {
    return Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj));
} : Object.getOwnPropertyNames;
function stringifyKey(key) {
    if (typeof key === "string") return key;
    if ((typeof key === "undefined" ? "undefined" : _typeof(key)) === "symbol") return key.toString();
    return new String(key).toString();
}
function toPrimitive(value) {
    return value === null ? null : typeof value === "object" ? "" + value : value;
}
function hasProp(target, prop) {
    return objectPrototype.hasOwnProperty.call(target, prop);
}
var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function getOwnPropertyDescriptors2(target) {
    var res = {
    };
    ownKeys1(target).forEach(function(key) {
        res[key] = getDescriptor(target, key);
    });
    return res;
};
function _defineProperties1(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _createClass1(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties1(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties1(Constructor, staticProps);
    return Constructor;
}
function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
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
function _assertThisInitialized1(self2) {
    if (self2 === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self2;
}
function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _createForOfIteratorHelperLoose(o, allowArrayLike) {
    var it;
    if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
        if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
            if (it) o = it;
            var i = 0;
            return function() {
                if (i >= o.length) return {
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
    var decorator = function decorator(target, property) {
        storeAnnotation(target, property, annotation);
    };
    return Object.assign(decorator, annotation);
}
function storeAnnotation(prototype, key, annotation) {
    if (!hasProp(prototype, storedAnnotationsSymbol)) {
        addHiddenProp(prototype, storedAnnotationsSymbol, _extends({
        }, prototype[storedAnnotationsSymbol]));
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
        addHiddenProp(target, storedAnnotationsSymbol, _extends({
        }, target[storedAnnotationsSymbol]));
    }
    return target[storedAnnotationsSymbol];
}
var $mobx = /* @__PURE__ */ Symbol("mobx administration");
var Atom = /* @__PURE__ */ function() {
    var Atom2 = function Atom2(name_) {
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
    };
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
    if (Object.is) return Object.is(a2, b);
    return a2 === b ? a2 !== 0 || 1 / a2 === 1 / b : a2 !== a2 && b !== b;
}
var comparer = {
    identity: identityComparer,
    structural: structuralComparer,
    "default": defaultComparer,
    shallow: shallowComparer
};
function deepEnhancer(v, _15, name) {
    if (isObservable(v)) return v;
    if (Array.isArray(v)) return observable.array(v, {
        name: name
    });
    if (isPlainObject(v)) return observable.object(v, void 0, {
        name: name
    });
    if (isES6Map(v)) return observable.map(v, {
        name: name
    });
    if (isES6Set(v)) return observable.set(v, {
        name: name
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
    if (v === void 0 || v === null) return v;
    if (isObservableObject(v) || isObservableArray(v) || isObservableMap(v) || isObservableSet(v)) return v;
    if (Array.isArray(v)) return observable.array(v, {
        name: name,
        deep: false
    });
    if (isPlainObject(v)) return observable.object(v, void 0, {
        name: name,
        deep: false
    });
    if (isES6Map(v)) return observable.map(v, {
        name: name,
        deep: false
    });
    if (isES6Set(v)) return observable.set(v, {
        name: name,
        deep: false
    });
    if (true) die("The shallow modifier / decorator can only used in combination with arrays, objects, maps and sets");
}
function referenceEnhancer(newValue) {
    return newValue;
}
function refStructEnhancer(v, oldValue) {
    if (isObservable(v)) die("observable.struct should not be used with observable values");
    if (deepEqual(v, oldValue)) return oldValue;
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
        if (this.extend_(adm, key, descriptor, false) === null) return 0;
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
    return adm.defineComputedProperty_(key, _extends({
    }, this.options_, {
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
    if (isObservable(v)) return v;
    if (isPlainObject(v)) return observable.object(v, arg2, arg3);
    if (Array.isArray(v)) return observable.array(v, arg2);
    if (isES6Map(v)) return observable.map(v, arg2);
    if (isES6Set(v)) return observable.set(v, arg2);
    if (typeof v === "object" && v !== null) return v;
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
        return extendObservable(globalState.useProxies === false || (options == null ? void 0 : options.proxy) === false ? asObservableObject({
        }, options) : asDynamicObservableObject({
        }, options), props, decorators);
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
        if (!isFunction(arg1)) die("First argument to `computed` should be an expression.");
        if (isFunction(arg2)) die("A setter as second argument is no longer supported, use `{ set: fn }` option instead");
    }
    var opts = isPlainObject(arg2) ? arg2 : {
    };
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
    var res = function res() {
        return executeAction(actionName, autoAction2, fn, ref || this, arguments);
    };
    if (autoAction2 === void 0) {
        autoAction2 = false;
    }
    if (true) {
        if (!isFunction(fn)) die("`action` can only be invoked on functions");
        if (typeof actionName !== "string" || !actionName) die("actions should have valid names, got: '" + actionName + "'");
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
    } finally{
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
        prevDerivation_: prevDerivation_,
        prevAllowStateChanges_: prevAllowStateChanges_,
        prevAllowStateReads_: prevAllowStateReads_,
        notifySpy_: notifySpy_,
        startTime_: startTime_,
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
    if (runInfo.runAsAction_) untrackedEnd(runInfo.prevDerivation_);
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
    var ObservableValue2 = function ObservableValue2(value, enhancer, name_, notifySpy, equals) {
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
                object: _assertThisInitialized1(_this),
                observableKind: "value",
                debugObjectName: _this.name_,
                newValue: "" + _this.value_
            });
        }
        return _this;
    };
    _inheritsLoose(ObservableValue2, _Atom);
    var _proto = ObservableValue2.prototype;
    _proto.dehanceValue = function dehanceValue(value) {
        if (this.dehancer !== void 0) return this.dehancer(value);
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
                    newValue: newValue,
                    oldValue: oldValue
                });
            }
            this.setNewValue_(newValue);
            if (notifySpy) spyReportEnd();
        }
    };
    _proto.prepareNewValue_ = function prepareNewValue_(newValue) {
        checkIfStateModificationsAreAllowed(this);
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                object: this,
                type: UPDATE,
                newValue: newValue
            });
            if (!change) return globalState.UNCHANGED;
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
                newValue: newValue,
                oldValue: oldValue
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
        if (fireImmediately) listener({
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
    var ComputedValue2 = function ComputedValue2(options) {
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
        if (!options.get) die(31);
        this.derivation = options.get;
        this.name_ = options.name || (true ? "ComputedValue@" + getNextId() : "ComputedValue");
        if (options.set) {
            this.setter_ = createAction(true ? this.name_ + "-setter" : "ComputedValue-setter", options.set);
        }
        this.equals_ = options.equals || (options.compareStructural || options.struct ? comparer.structural : comparer["default"]);
        this.scope_ = options.context;
        this.requiresReaction_ = !!options.requiresReaction;
        this.keepAlive_ = !!options.keepAlive;
    };
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
        if (this.isComputing_) die(32, this.name_, this.derivation);
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
                if (this.keepAlive_ && !prevTrackingContext) globalState.trackingContext = this;
                if (this.trackAndCompute()) propagateChangeConfirmed(this);
                globalState.trackingContext = prevTrackingContext;
            }
        }
        var result = this.value_;
        if (isCaughtException(result)) throw result.cause;
        return result;
    };
    _proto.set = function set4(value) {
        if (this.setter_) {
            if (this.isRunningSetter_) die(33, this.name_);
            this.isRunningSetter_ = true;
            try {
                this.setter_.call(this.scope_, value);
            } finally{
                this.isRunningSetter_ = false;
            }
        } else die(34, this.name_);
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
                    oldValue: oldValue,
                    newValue: newValue
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
                    newValue: newValue,
                    oldValue: prevValue
                });
                untrackedEnd(prevU);
            }
            firstTime = false;
            prevValue = newValue;
        });
    };
    _proto.warnAboutUntrackedRead_ = function warnAboutUntrackedRead_() {
        if (false) return;
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
})(IDerivationState_ || (IDerivationState_ = {
}));
var TraceMode;
(function(TraceMode2) {
    TraceMode2[TraceMode2["NONE"] = 0] = "NONE";
    TraceMode2[TraceMode2["LOG"] = 1] = "LOG";
    TraceMode2[TraceMode2["BREAK"] = 2] = "BREAK";
})(TraceMode || (TraceMode = {
}));
var CaughtException = function CaughtException2(cause) {
    this.cause = void 0;
    this.cause = cause;
};
function isCaughtException(e) {
    return _instanceof(e, CaughtException);
}
function shouldCompute(derivation) {
    switch(derivation.dependenciesState_){
        case IDerivationState_.UP_TO_DATE_:
            return false;
        case IDerivationState_.NOT_TRACKING_:
        case IDerivationState_.STALE_:
            return true;
        case IDerivationState_.POSSIBLY_STALE_:
            {
                var prevAllowStateReads = allowStateReadsStart(true);
                var prevUntracked = untrackedStart();
                var obs = derivation.observing_, l2 = obs.length;
                for(var i = 0; i < l2; i++){
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
    if (!globalState.allowStateChanges && (hasObservers || globalState.enforceActions === "always")) console.warn("[MobX] " + (globalState.enforceActions ? "Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed. Tried to modify: " : "Side effects like changing state are not allowed at this point. Are you trying to modify state from, for example, a computed value or the render function of a React component? You can wrap side effects in 'runInAction' (or decorate functions with 'action') if needed. Tried to modify: ") + atom.name_);
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
    if (false) return;
    if (derivation.observing_.length !== 0) return;
    if (globalState.reactionRequiresObservable || derivation.requiresObservable_) {
        console.warn("[mobx] Derivation '" + derivation.name_ + "' is created/updated without reading any observable value.");
    }
}
function bindDependencies(derivation) {
    var prevObserving = derivation.observing_;
    var observing = derivation.observing_ = derivation.newObserving_;
    var lowestNewObservingDerivationState = IDerivationState_.UP_TO_DATE_;
    var i0 = 0, l2 = derivation.unboundDepsCount_;
    for(var i = 0; i < l2; i++){
        var dep = observing[i];
        if (dep.diffValue_ === 0) {
            dep.diffValue_ = 1;
            if (i0 !== i) observing[i0] = dep;
            i0++;
        }
        if (dep.dependenciesState_ > lowestNewObservingDerivationState) {
            lowestNewObservingDerivationState = dep.dependenciesState_;
        }
    }
    observing.length = i0;
    derivation.newObserving_ = null;
    l2 = prevObserving.length;
    while(l2--){
        var _dep = prevObserving[l2];
        if (_dep.diffValue_ === 0) {
            removeObserver(_dep, derivation);
        }
        _dep.diffValue_ = 0;
    }
    while(i0--){
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
    while(i--){
        removeObserver(obs[i], derivation);
    }
    derivation.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
}
function untracked(action2) {
    var prev = untrackedStart();
    try {
        return action2();
    } finally{
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
    if (derivation.dependenciesState_ === IDerivationState_.UP_TO_DATE_) return;
    derivation.dependenciesState_ = IDerivationState_.UP_TO_DATE_;
    var obs = derivation.observing_;
    var i = obs.length;
    while(i--){
        obs[i].lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
    }
}
var MobXGlobals = function MobXGlobals2() {
    this.version = 6;
    this.UNCHANGED = {
    };
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
    if (global2.__mobxInstanceCount > 0 && !global2.__mobxGlobals) canMergeGlobalState = false;
    if (global2.__mobxGlobals && global2.__mobxGlobals.version !== new MobXGlobals().version) canMergeGlobalState = false;
    if (!canMergeGlobalState) {
        setTimeout(function() {
            if (!isolateCalled) {
                die(35);
            }
        }, 1);
        return new MobXGlobals();
    } else if (global2.__mobxGlobals) {
        global2.__mobxInstanceCount += 1;
        if (!global2.__mobxGlobals.UNCHANGED) global2.__mobxGlobals.UNCHANGED = {
        };
        return global2.__mobxGlobals;
    } else {
        global2.__mobxInstanceCount = 1;
        return global2.__mobxGlobals = /* @__PURE__ */ new MobXGlobals();
    }
}();
function isolateGlobalState() {
    if (globalState.pendingReactions.length || globalState.inBatch || globalState.isRunningReactions) die(36);
    isolateCalled = true;
    if (canMergeGlobalState) {
        var global2 = getGlobal();
        if (--global2.__mobxInstanceCount === 0) global2.__mobxGlobals = void 0;
        globalState = new MobXGlobals();
    }
}
function addObserver(observable2, node) {
    observable2.observers_.add(node);
    if (observable2.lowestObserverState_ > node.dependenciesState_) observable2.lowestObserverState_ = node.dependenciesState_;
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
        for(var i = 0; i < list.length; i++){
            var observable2 = list[i];
            observable2.isPendingUnobservation_ = false;
            if (observable2.observers_.size === 0) {
                if (observable2.isBeingObserved_) {
                    observable2.isBeingObserved_ = false;
                    observable2.onBUO();
                }
                if (_instanceof(observable2, ComputedValue)) {
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
    if (observable2.lowestObserverState_ === IDerivationState_.STALE_) return;
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
    if (observable2.lowestObserverState_ === IDerivationState_.STALE_) return;
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
    if (observable2.lowestObserverState_ !== IDerivationState_.UP_TO_DATE_) return;
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
        new Function("debugger;\n/*\nTracing '" + derivation.name_ + "'\n\nYou are entering this break point because derivation '" + derivation.name_ + "' is being traced and '" + observable2.name_ + "' is now forcing it to update.\nJust follow the stacktrace you should now see in the devtools to see precisely what piece of your code is causing this update\nThe stackframe you are looking for is at least ~6-8 stack-frames up.\n\n" + (_instanceof(derivation, ComputedValue) ? derivation.derivation.toString().replace(/[*]\//g, "/") : "") + "\n\nThe dependencies for this derivation are:\n\n" + lines.join("\n") + "\n*/\n    ")();
    }
}
function printDepTree(tree, lines, depth) {
    if (lines.length >= 1000) {
        lines.push("(and many more)");
        return;
    }
    lines.push("" + "\t".repeat(depth - 1) + tree.name);
    if (tree.dependencies) tree.dependencies.forEach(function(child) {
        return printDepTree(child, lines, depth + 1);
    });
}
var Reaction = /* @__PURE__ */ function() {
    var Reaction2 = function Reaction2(name_, onInvalidate_, errorHandler_, requiresObservable_) {
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
    };
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
        if (isCaughtException(result)) this.reportExceptionInDerivation_(result.cause);
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
        if (globalState.disableErrorBoundaries) throw error;
        var message = true ? "[mobx] Encountered an uncaught exception that was thrown by a reaction or observer component, in: '" + this + "'" : "[mobx] uncaught error in '" + this + "'";
        if (!globalState.suppressReactionErrors) {
            console.error(message, error);
        } else if (true) console.warn("[mobx] (error in reaction '" + this.name_ + "' suppressed, fix error of causing action below)");
        if (isSpyEnabled()) {
            spyReport({
                type: "error",
                name: this.name_,
                message: message,
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
    if (globalState.inBatch > 0 || globalState.isRunningReactions) return;
    reactionScheduler(runReactionsHelper);
}
function runReactionsHelper() {
    globalState.isRunningReactions = true;
    var allReactions = globalState.pendingReactions;
    var iterations = 0;
    while(allReactions.length > 0){
        if (++iterations === MAX_REACTION_ITERATIONS) {
            console.error(true ? "Reaction doesn't converge to a stable state after " + MAX_REACTION_ITERATIONS + " iterations." + (" Probably there is a cycle in the reactive function: " + allReactions[0]) : "[mobx] cycle in reaction: " + allReactions[0]);
            allReactions.splice(0);
        }
        var remainingReactions = allReactions.splice(0);
        for(var i = 0, l2 = remainingReactions.length; i < l2; i++){
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
    if (false) return;
    if (!globalState.spyListeners.length) return;
    var listeners = globalState.spyListeners;
    for(var i = 0, l2 = listeners.length; i < l2; i++){
        listeners[i](event);
    }
}
function spyReportStart(event) {
    if (false) return;
    var change = _extends({
    }, event, {
        spyReportStart: true
    });
    spyReport(change);
}
var END_EVENT = {
    type: "report-end",
    spyReportEnd: true
};
function spyReportEnd(change) {
    if (false) return;
    if (change) spyReport(_extends({
    }, change, {
        type: "report-end",
        spyReportEnd: true
    }));
    else spyReport(END_EVENT);
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
        if (isFunction(arg1)) return createAction(arg1.name || DEFAULT_ACTION_NAME, arg1, autoAction2);
        if (isFunction(arg2)) return createAction(arg1, arg2, autoAction2);
        if (isStringish(arg2)) {
            return storeAnnotation(arg1, arg2, autoAction2 ? autoActionAnnotation : actionAnnotation);
        }
        if (isStringish(arg1)) {
            return createDecoratorAnnotation(createActionAnnotation(autoAction2 ? AUTOACTION : ACTION, {
                name: arg1,
                autoAction: autoAction2
            }));
        }
        if (true) die("Invalid arguments for `action`");
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
    var reactionRunner = function reactionRunner() {
        view(reaction);
    };
    var _opts$name, _opts;
    if (opts === void 0) {
        opts = EMPTY_OBJECT;
    }
    if (true) {
        if (!isFunction(view)) die("Autorun expects a function as first argument");
        if (isAction(view)) die("Autorun does not accept actions since actions are untrackable");
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
                    if (!reaction.isDisposed_) reaction.track(reactionRunner);
                });
            }
        }, opts.onError, opts.requiresObservable);
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
        atom[listenersKey] = /* @__PURE__ */ new Set([
            cb
        ]);
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
    if (useProxies === "ifavailable") globalState.verifyProxies = true;
    if (enforceActions !== void 0) {
        var ea = enforceActions === ALWAYS ? ALWAYS : enforceActions === OBSERVED;
        globalState.enforceActions = ea;
        globalState.allowStateChanges = ea === true || ea === ALWAYS ? false : true;
    }
    [
        "computedRequiresReaction",
        "reactionRequiresObservable",
        "observableRequiresReaction",
        "disableErrorBoundaries",
        "safeDescriptors"
    ].forEach(function(key) {
        if (key in options) globalState[key] = !!options[key];
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
        if (arguments.length > 4) die("'extendObservable' expected 2-4 arguments");
        if (typeof target !== "object") die("'extendObservable' expects an object as first argument");
        if (isObservableMap(target)) die("'extendObservable' should not be used on maps, use map.merge instead");
        if (!isPlainObject(properties)) die("'extendObservable' only accepts plain objects as second argument");
        if (isObservable(properties) || isObservable(annotations)) die("Extending an object with another observable (object) is not supported");
    }
    var descriptors = getOwnPropertyDescriptors(properties);
    var adm = asObservableObject(target, options)[$mobx];
    startBatch();
    try {
        ownKeys1(descriptors).forEach(function(key) {
            adm.extend_(key, descriptors[key], !annotations ? true : key in annotations ? annotations[key] : true);
        });
    } finally{
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
    if (node.observing_ && node.observing_.length > 0) result.dependencies = unique(node.observing_).map(nodeToDependencyTree);
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
    if (arguments.length !== 1) die("Flow expects single argument with generator function");
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
            var onFulfilled = function onFulfilled(res3) {
                pendingPromise = void 0;
                var ret;
                try {
                    ret = action(name + " - runid: " + runId + " - yield " + stepId++, gen.next).call(gen, res3);
                } catch (e) {
                    return reject(e);
                }
                next(ret);
            };
            var onRejected = function onRejected(err) {
                pendingPromise = void 0;
                var ret;
                try {
                    ret = action(name + " - runid: " + runId + " - yield " + stepId++, gen["throw"]).call(gen, err);
                } catch (e) {
                    return reject(e);
                }
                next(ret);
            };
            var stepId = 0;
            rejector = reject;
            function next(ret) {
                if (isFunction(ret == null ? void 0 : ret.then)) {
                    ret.then(next, reject);
                    return;
                }
                if (ret.done) return resolve(ret.value);
                pendingPromise = Promise.resolve(ret.value);
                return pendingPromise.then(onFulfilled, onRejected);
            }
            onFulfilled(void 0);
        });
        promise.cancel = action(name + " - runid: " + runId + " - cancel", function() {
            try {
                if (pendingPromise) cancelPromise(pendingPromise);
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
    if (isFunction(promise.cancel)) promise.cancel();
}
function isFlow(fn) {
    return (fn == null ? void 0 : fn.isMobXFlow) === true;
}
function _isObservable(value, property) {
    if (!value) return false;
    if (property !== void 0) {
        if (isObservableMap(value) || isObservableArray(value)) return die("isObservable(object, propertyName) is not supported for arrays and maps. Use map.has or array.length instead.");
        if (isObservableObject(value)) {
            return value[$mobx].values_.has(property);
        }
        return false;
    }
    return isObservableObject(value) || !!value[$mobx] || isAtom(value) || isReaction(value) || isComputedValue(value);
}
function isObservable(value) {
    if (arguments.length !== 1) die("isObservable expects only 1 argument. Use isObservableProp to inspect the observability of a property");
    return _isObservable(value);
}
function apiOwnKeys(obj) {
    if (isObservableObject(obj)) {
        return obj[$mobx].ownKeys_();
    }
    die(38);
}
function observe(thing, propOrCb, cbOrFire, fireImmediately) {
    if (isFunction(cbOrFire)) return observeObservableProperty(thing, propOrCb, cbOrFire, fireImmediately);
    else return observeObservable(thing, propOrCb, cbOrFire);
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
    if (source == null || typeof source !== "object" || _instanceof(source, Date) || !isObservable(source)) return source;
    if (isObservableValue(source) || isComputedValue(source)) return toJSHelper(source.get(), __alreadySeen);
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
        var _res3 = cache(__alreadySeen, source, {
        });
        apiOwnKeys(source).forEach(function(key) {
            if (objectPrototype.propertyIsEnumerable.call(source, key)) {
                _res3[key] = toJSHelper(source[key], __alreadySeen);
            }
        });
        return _res3;
    }
}
function toJS(source, options) {
    if (options) die("toJS no longer supports options");
    return toJSHelper(source, /* @__PURE__ */ new Map());
}
function trace() {
    if (false) die("trace() is not available in production builds");
    var enterBreakPoint = false;
    for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
        args[_key] = arguments[_key];
    }
    if (typeof args[args.length - 1] === "boolean") enterBreakPoint = args.pop();
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
    switch(args.length){
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
    } finally{
        endBatch();
    }
}
function getAdm(target) {
    return target[$mobx];
}
var objectProxyTraps = {
    has: function has(target, name) {
        if (globalState.trackingDerivation) warnAboutProxyRequirement("detect new properties using the 'in' operator. Use 'has' from 'mobx' instead.");
        return getAdm(target).has_(name);
    },
    get: function get(target, name) {
        return getAdm(target).get_(name);
    },
    set: function set2(target, name, value) {
        var _getAdm$set_;
        if (!isStringish(name)) return false;
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
        if (!isStringish(name)) return false;
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
        if (globalState.trackingDerivation) warnAboutProxyRequirement("iterate keys to detect added / removed properties. Use 'keys' from 'mobx' instead.");
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
        if (idx !== -1) interceptors.splice(idx, 1);
    });
}
function interceptChange(interceptable, change) {
    var prevU = untrackedStart();
    try {
        var interceptors = [].concat(interceptable.interceptors_ || []);
        for(var i = 0, l2 = interceptors.length; i < l2; i++){
            change = interceptors[i](change);
            if (change && !change.type) die(14);
            if (!change) break;
        }
        return change;
    } finally{
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
        if (idx !== -1) listeners.splice(idx, 1);
    });
}
function notifyListeners(listenable, change) {
    var prevU = untrackedStart();
    var listeners = listenable.changeListeners_;
    if (!listeners) return;
    listeners = listeners.slice();
    for(var i = 0, l2 = listeners.length; i < l2; i++){
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
        ownKeys1(annotations).forEach(function(key) {
            return adm.make_(key, annotations[key]);
        });
    } finally{
        endBatch();
    }
    return target;
}
var SPLICE = "splice";
var UPDATE = "update";
var MAX_SPLICE_SIZE = 10000;
var arrayTraps = {
    get: function get2(target, name) {
        var adm = target[$mobx];
        if (name === $mobx) return adm;
        if (name === "length") return adm.getArrayLength_();
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
        if ((typeof name === "undefined" ? "undefined" : _typeof(name)) === "symbol" || isNaN(name)) {
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
    var ObservableArrayAdministration2 = function ObservableArrayAdministration2(name, enhancer, owned_, legacyMode_) {
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
    };
    var _proto = ObservableArrayAdministration2.prototype;
    _proto.dehanceValue_ = function dehanceValue_(value) {
        if (this.dehancer !== void 0) return this.dehancer(value);
        return value;
    };
    _proto.dehanceValues_ = function dehanceValues_(values) {
        if (this.dehancer !== void 0 && values.length > 0) return values.map(this.dehancer);
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
        if (typeof newLength !== "number" || isNaN(newLength) || newLength < 0) die("Out of range: " + newLength);
        var currentLength = this.values_.length;
        if (newLength === currentLength) return;
        else if (newLength > currentLength) {
            var newItems = new Array(newLength - currentLength);
            for(var i = 0; i < newLength - currentLength; i++){
                newItems[i] = void 0;
            }
            this.spliceWithArray_(currentLength, 0, newItems);
        } else this.spliceWithArray_(newLength, currentLength - newLength);
    };
    _proto.updateArrayLength_ = function updateArrayLength_(oldLength, delta) {
        if (oldLength !== this.lastKnownLength_) die(16);
        this.lastKnownLength_ += delta;
        if (this.legacyMode_ && delta > 0) reserveArrayBuffer(oldLength + delta + 1);
    };
    _proto.spliceWithArray_ = function spliceWithArray_(index, deleteCount, newItems) {
        var _this = this;
        checkIfStateModificationsAreAllowed(this.atom_);
        var length = this.values_.length;
        if (index === void 0) index = 0;
        else if (index > length) index = length;
        else if (index < 0) index = Math.max(0, length + index);
        if (arguments.length === 1) deleteCount = length - index;
        else if (deleteCount === void 0 || deleteCount === null) deleteCount = 0;
        else deleteCount = Math.max(0, Math.min(deleteCount, length - index));
        if (newItems === void 0) newItems = EMPTY_ARRAY;
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                object: this.proxy_,
                type: SPLICE,
                index: index,
                removedCount: deleteCount,
                added: newItems
            });
            if (!change) return EMPTY_ARRAY;
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
        if (deleteCount !== 0 || newItems.length !== 0) this.notifyArraySplice_(index, newItems, res);
        return this.dehanceValues_(res);
    };
    _proto.spliceItemsIntoValues_ = function spliceItemsIntoValues_(index, deleteCount, newItems) {
        if (newItems.length < MAX_SPLICE_SIZE) {
            var _this$values_;
            return (_this$values_ = this.values_).splice.apply(_this$values_, [
                index,
                deleteCount
            ].concat(newItems));
        } else {
            var res = this.values_.slice(index, index + deleteCount);
            var oldItems = this.values_.slice(index + deleteCount);
            this.values_.length += newItems.length - deleteCount;
            for(var i = 0; i < newItems.length; i++){
                this.values_[index + i] = newItems[i];
            }
            for(var _i = 0; _i < oldItems.length; _i++){
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
            index: index,
            newValue: newValue,
            oldValue: oldValue
        } : null;
        if (notifySpy) spyReportStart(change);
        this.atom_.reportChanged();
        if (notify) notifyListeners(this, change);
        if (notifySpy) spyReportEnd();
    };
    _proto.notifyArraySplice_ = function notifyArraySplice_(index, added, removed) {
        var notifySpy = !this.owned_ && isSpyEnabled();
        var notify = hasListeners(this);
        var change = notify || notifySpy ? {
            observableKind: "array",
            object: this.proxy_,
            debugObjectName: this.atom_.name_,
            type: SPLICE,
            index: index,
            removed: removed,
            added: added,
            removedCount: removed.length,
            addedCount: added.length
        } : null;
        if (notifySpy) spyReportStart(change);
        this.atom_.reportChanged();
        if (notify) notifyListeners(this, change);
        if (notifySpy) spyReportEnd();
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
                    index: index,
                    newValue: newValue
                });
                if (!change) return;
                newValue = change.newValue;
            }
            newValue = this.enhancer_(newValue, oldValue);
            var changed = newValue !== oldValue;
            if (changed) {
                values[index] = newValue;
                this.notifyArrayChildUpdate_(index, newValue, oldValue);
            }
        } else if (index === values.length) {
            this.spliceWithArray_(index, 0, [
                newValue
            ]);
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
        for(var _len = arguments.length, newItems = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++){
            newItems[_key - 2] = arguments[_key];
        }
        var adm = this[$mobx];
        switch(arguments.length){
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
        for(var _len2 = arguments.length, items = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++){
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
        for(var _len3 = arguments.length, items = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++){
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
var ObservableMapMarker = {
};
var ADD = "add";
var DELETE = "delete";
_Symbol$iterator = Symbol.iterator;
_Symbol$toStringTag = Symbol.toStringTag;
var ObservableMap = /* @__PURE__ */ function() {
    var ObservableMap2 = function ObservableMap2(initialData, enhancer_, name_) {
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
    };
    var _proto = ObservableMap2.prototype;
    _proto.has_ = function has_(key) {
        return this.data_.has(key);
    };
    _proto.has = function has2(key) {
        var _this = this;
        if (!globalState.trackingDerivation) return this.has_(key);
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
            if (!change) return this;
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
            if (!change) return false;
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
            if (notifySpy) spyReportStart(_change);
            transaction(function() {
                var _this2$hasMap_$get;
                _this2.keysAtom_.reportChanged();
                (_this2$hasMap_$get = _this2.hasMap_.get(key)) == null ? void 0 : _this2$hasMap_$get.setNewValue_(false);
                var observable2 = _this2.data_.get(key);
                observable2.setNewValue_(void 0);
                _this2.data_["delete"](key);
            });
            if (notify) notifyListeners(this, _change);
            if (notifySpy) spyReportEnd();
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
                newValue: newValue
            } : null;
            if (notifySpy) spyReportStart(change);
            observable2.setNewValue_(newValue);
            if (notify) notifyListeners(this, change);
            if (notifySpy) spyReportEnd();
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
            newValue: newValue
        } : null;
        if (notifySpy) spyReportStart(change);
        if (notify) notifyListeners(this, change);
        if (notifySpy) spyReportEnd();
    };
    _proto.get = function get3(key) {
        if (this.has(key)) return this.dehanceValue_(this.data_.get(key).get());
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
                    done: done,
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
                    done: done,
                    value: done ? void 0 : [
                        value,
                        self2.get(value)
                    ]
                };
            }
        });
    };
    _proto[_Symbol$iterator] = function() {
        return this.entries();
    };
    _proto.forEach = function forEach(callback, thisArg) {
        for(var _iterator = _createForOfIteratorHelperLoose(this), _step; !(_step = _iterator()).done;){
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
            if (isPlainObject(other)) getPlainObjectKeys(other).forEach(function(key) {
                return _this4.set(key, other[key]);
            });
            else if (Array.isArray(other)) other.forEach(function(_ref) {
                var key = _ref[0], value = _ref[1];
                return _this4.set(key, value);
            });
            else if (isES6Map(other)) {
                if (other.constructor !== Map) die(19, other);
                other.forEach(function(value, key) {
                    return _this4.set(key, value);
                });
            } else if (other !== null && other !== void 0) die(20, other);
        });
        return this;
    };
    _proto.clear = function clear2() {
        var _this5 = this;
        transaction(function() {
            untracked(function() {
                for(var _iterator2 = _createForOfIteratorHelperLoose(_this5.keys()), _step2; !(_step2 = _iterator2()).done;){
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
            for(var _iterator3 = _createForOfIteratorHelperLoose(_this6.data_.keys()), _step3; !(_step3 = _iterator3()).done;){
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
            for(var _iterator4 = _createForOfIteratorHelperLoose(replacementMap.entries()), _step4; !(_step4 = _iterator4()).done;){
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
                    while(!next1.done){
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
        if (fireImmediately === true) die("`observe` doesn't support fireImmediately=true in combination with maps.");
        return registerListener(this, listener);
    };
    _proto.intercept_ = function intercept_(handler) {
        return registerInterceptor(this, handler);
    };
    _createClass1(ObservableMap2, [
        {
            key: "size",
            get: function get3() {
                this.keysAtom_.reportObserved();
                return this.data_.size;
            }
        },
        {
            key: _Symbol$toStringTag,
            get: function get3() {
                return "Map";
            }
        }
    ]);
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
        for(var key in dataStructure){
            map2.set(key, dataStructure[key]);
        }
        return map2;
    } else {
        return die(21, dataStructure);
    }
}
var _Symbol$iterator$1;
var _Symbol$toStringTag$1;
var ObservableSetMarker = {
};
_Symbol$iterator$1 = Symbol.iterator;
_Symbol$toStringTag$1 = Symbol.toStringTag;
var ObservableSet = /* @__PURE__ */ function() {
    var ObservableSet2 = function ObservableSet2(initialData, enhancer, name_) {
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
    };
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
                for(var _iterator = _createForOfIteratorHelperLoose(_this.data_.values()), _step; !(_step = _iterator()).done;){
                    var value = _step.value;
                    _this["delete"](value);
                }
            });
        });
    };
    _proto.forEach = function forEach(callbackFn, thisArg) {
        for(var _iterator2 = _createForOfIteratorHelperLoose(this), _step2; !(_step2 = _iterator2()).done;){
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
            if (!change) return this;
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
            if (notifySpy && true) spyReportStart(_change);
            if (notify) notifyListeners(this, _change);
            if (notifySpy && true) spyReportEnd();
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
            if (!change) return false;
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
            if (notifySpy && true) spyReportStart(_change2);
            transaction(function() {
                _this3.atom_.reportChanged();
                _this3.data_["delete"](value);
            });
            if (notify) notifyListeners(this, _change2);
            if (notifySpy && true) spyReportEnd();
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
                    value: [
                        keys[index],
                        values[index]
                    ],
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
        if (fireImmediately === true) die("`observe` doesn't support fireImmediately=true in combination with sets.");
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
    _createClass1(ObservableSet2, [
        {
            key: "size",
            get: function get3() {
                this.atom_.reportObserved();
                return this.data_.size;
            }
        },
        {
            key: _Symbol$toStringTag$1,
            get: function get3() {
                return "Set";
            }
        }
    ]);
    return ObservableSet2;
}();
var isObservableSet = /* @__PURE__ */ createInstanceofPredicate("ObservableSet", ObservableSet);
var descriptorCache = /* @__PURE__ */ Object.create(null);
var REMOVE = "remove";
var ObservableObjectAdministration = /* @__PURE__ */ function() {
    var ObservableObjectAdministration2 = function ObservableObjectAdministration2(target_, values_, name_, defaultAnnotation_) {
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
            this.appliedAnnotations_ = {
            };
        }
    };
    var _proto = ObservableObjectAdministration2.prototype;
    _proto.getObservablePropValue_ = function getObservablePropValue_(key) {
        return this.values_.get(key).get();
    };
    _proto.setObservablePropValue_ = function setObservablePropValue_(key, newValue) {
        var observable2 = this.values_.get(key);
        if (_instanceof(observable2, ComputedValue)) {
            observable2.set(newValue);
            return true;
        }
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                type: UPDATE,
                object: this.proxy_ || this.target_,
                name: key,
                newValue: newValue
            });
            if (!change) return null;
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
                newValue: newValue
            } : null;
            if (notifySpy) spyReportStart(_change);
            observable2.setNewValue_(newValue);
            if (notify) notifyListeners(this, _change);
            if (notifySpy) spyReportEnd();
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
                value: value,
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
        while(source && source !== objectPrototype){
            var descriptor = getDescriptor(source, key);
            if (descriptor) {
                var outcome = annotation.make_(this, key, descriptor, source);
                if (outcome === 0) return;
                if (outcome === 1) break;
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
                if (!change) return null;
                var newValue = change.newValue;
                if (descriptor.value !== newValue) {
                    descriptor = _extends({
                    }, descriptor, {
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
        } finally{
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
                if (!change) return null;
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
        } finally{
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
                if (!change) return null;
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
        } finally{
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
            if (!change) return null;
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
                if (_instanceof(observable2, ObservableValue)) {
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
                if (notifySpy) spyReportStart(_change2);
                if (notify) notifyListeners(this, _change2);
                if (notifySpy) spyReportEnd();
            }
        } finally{
            endBatch();
        }
        return true;
    };
    _proto.observe_ = function observe_(callback, fireImmediately) {
        if (fireImmediately === true) die("`observe` doesn't support the fire immediately property for observable objects.");
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
            if (notifySpy) spyReportStart(change);
            if (notify) notifyListeners(this, change);
            if (notifySpy) spyReportEnd();
        }
        (_this$pendingKeys_2 = this.pendingKeys_) == null ? void 0 : (_this$pendingKeys_2$g = _this$pendingKeys_2.get(key)) == null ? void 0 : _this$pendingKeys_2$g.set(true);
        this.keysAtom_.reportChanged();
    };
    _proto.ownKeys_ = function ownKeys_() {
        this.keysAtom_.reportObserved();
        return ownKeys1(this.target_);
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
        if (!_instanceof(getAdministration(target), ObservableObjectAdministration)) {
            die("Cannot convert '" + getDebugName(target) + "' into observable object:\nThe target is already observable of different type.\nExtending builtins is not supported.");
        }
        return target;
    }
    if (!Object.isExtensible(target)) die("Cannot make the designated object observable; it is not extensible");
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
    var LegacyObservableArray2 = function LegacyObservableArray2(initialValues, enhancer, name, owned) {
        var _this;
        if (name === void 0) {
            name = true ? "ObservableArray@" + getNextId() : "ObservableArray";
        }
        if (owned === void 0) {
            owned = false;
        }
        _this = _StubArray.call(this) || this;
        var adm = new ObservableArrayAdministration(name, enhancer, owned, true);
        adm.proxy_ = _assertThisInitialized1(_this);
        addHiddenFinalProp(_assertThisInitialized1(_this), $mobx, adm);
        if (initialValues && initialValues.length) {
            var prev = allowStateChangesStart(true);
            _this.spliceWithArray(0, 0, initialValues);
            allowStateChangesEnd(prev);
        }
        return _this;
    };
    _inheritsLoose(LegacyObservableArray2, _StubArray);
    var _proto = LegacyObservableArray2.prototype;
    _proto.concat = function concat() {
        this[$mobx].atom_.reportObserved();
        for(var _len = arguments.length, arrays = new Array(_len), _key = 0; _key < _len; _key++){
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
    _createClass1(LegacyObservableArray2, [
        {
            key: "length",
            get: function get3() {
                return this[$mobx].getArrayLength_();
            },
            set: function set4(newLength) {
                this[$mobx].setArrayLength_(newLength);
            }
        },
        {
            key: Symbol.toStringTag,
            get: function get3() {
                return "Array";
            }
        }
    ]);
    return LegacyObservableArray2;
}(StubArray);
Object.entries(arrayExtensions).forEach(function(_ref) {
    var prop = _ref[0], fn = _ref[1];
    if (prop !== "concat") addHiddenProp(LegacyObservableArray.prototype, prop, fn);
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
        for(var index = OBSERVABLE_ARRAY_BUFFER_SIZE; index < max + 100; index++){
            createArrayBufferItem(index);
        }
        OBSERVABLE_ARRAY_BUFFER_SIZE = max;
    }
}
reserveArrayBuffer(1000);
function createLegacyArray(initialValues, enhancer, name) {
    return new LegacyObservableArray(initialValues, enhancer, name);
}
function getAtom(thing, property) {
    if (typeof thing === "object" && thing !== null) {
        if (isObservableArray(thing)) {
            if (property !== void 0) die(23);
            return thing[$mobx].atom_;
        }
        if (isObservableSet(thing)) {
            return thing[$mobx];
        }
        if (isObservableMap(thing)) {
            if (property === void 0) return thing.keysAtom_;
            var observable2 = thing.data_.get(property) || thing.hasMap_.get(property);
            if (!observable2) die(25, property, getDebugName(thing));
            return observable2;
        }
        if (isObservableObject(thing)) {
            if (!property) return die(26);
            var _observable = thing[$mobx].values_.get(property);
            if (!_observable) die(27, property, getDebugName(thing));
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
    if (!thing) die(29);
    if (property !== void 0) return getAdministration(getAtom(thing, property));
    if (isAtom(thing) || isComputedValue(thing) || isReaction(thing)) return thing;
    if (isObservableMap(thing) || isObservableSet(thing)) return thing;
    if (thing[$mobx]) return thing[$mobx];
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
    if (a2 === b) return a2 !== 0 || 1 / a2 === 1 / b;
    if (a2 == null || b == null) return false;
    if (a2 !== a2) return b !== b;
    var type = typeof a2 === "undefined" ? "undefined" : _typeof(a2);
    if (!isFunction(type) && type !== "object" && typeof b != "object") return false;
    var className = toString.call(a2);
    if (className !== toString.call(b)) return false;
    switch(className){
        case "[object RegExp]":
        case "[object String]":
            return "" + a2 === "" + b;
        case "[object Number]":
            if (+a2 !== +a2) return +b !== +b;
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
        if (typeof a2 != "object" || typeof b != "object") return false;
        var aCtor = a2.constructor, bCtor = b.constructor;
        if (aCtor !== bCtor && !(isFunction(aCtor) && _instanceof(aCtor, aCtor) && isFunction(bCtor) && _instanceof(bCtor, bCtor)) && "constructor" in a2 && "constructor" in b) {
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
    while(length--){
        if (aStack[length] === a2) return bStack[length] === b;
    }
    aStack.push(a2);
    bStack.push(b);
    if (areArrays) {
        length = a2.length;
        if (length !== b.length) return false;
        while(length--){
            if (!eq(a2[length], b[length], depth - 1, aStack, bStack)) return false;
        }
    } else {
        var keys = Object.keys(a2);
        var key;
        length = keys.length;
        if (Object.keys(b).length !== length) return false;
        while(length--){
            key = keys[length];
            if (!(hasProp(b, key) && eq(a2[key], b[key], depth - 1, aStack, bStack))) return false;
        }
    }
    aStack.pop();
    bStack.pop();
    return true;
}
function unwrap(a2) {
    if (isObservableArray(a2)) return a2.slice();
    if (isES6Map(a2) || isObservableMap(a2)) return Array.from(a2.entries());
    if (isES6Set(a2) || isObservableSet(a2)) return Array.from(a2.entries());
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
    return _instanceof(thing, Object) && typeof thing.annotationType_ === "string" && isFunction(thing.make_) && isFunction(thing.extend_);
}
[
    "Symbol",
    "Map",
    "Set"
].forEach(function(m) {
    var g = getGlobal();
    if (typeof g[m] === "undefined") {
        die("MobX requires global '" + m + "' to be available or polyfilled");
    }
});
if (typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ === "object") {
    __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobx({
        spy: spy,
        extras: {
            getDebugName: getDebugName
        },
        $mobx: $mobx
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
var __defNormalProp4 = function(obj, key, value) {
    return key in obj ? __defProp4(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: value
    }) : obj[key] = value;
};
var __spreadValues2 = function(a2, b) {
    for(var prop in b || (b = {
    }))if (__hasOwnProp3.call(b, prop)) __defNormalProp4(a2, prop, b[prop]);
    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
    if (__getOwnPropSymbols2) try {
        for(var _iterator = __getOwnPropSymbols2(b)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
            var prop = _step.value;
            if (__propIsEnum2.call(b, prop)) __defNormalProp4(a2, prop, b[prop]);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally{
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally{
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
    return a2;
};
var __spreadProps2 = function(a2, b) {
    return __defProps2(a2, __getOwnPropDescs2(b));
};
var __decorateClass2 = function(decorators, target, key, kind) {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc2(target, key) : target;
    for(var i = decorators.length - 1, decorator; i >= 0; i--)if (decorator = decorators[i]) result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result) __defProp4(target, key, result);
    return result;
};
var __publicField3 = function(obj, key, value) {
    __defNormalProp4(obj, (typeof key === "undefined" ? "undefined" : _typeof(key)) !== "symbol" ? key + "" : key, value);
    return value;
};
var TLResizeEdge = /* @__PURE__ */ function(TLResizeEdge2) {
    TLResizeEdge2["Top"] = "top_edge";
    TLResizeEdge2["Right"] = "right_edge";
    TLResizeEdge2["Bottom"] = "bottom_edge";
    TLResizeEdge2["Left"] = "left_edge";
    return TLResizeEdge2;
}(TLResizeEdge || {
});
var TLResizeCorner = /* @__PURE__ */ function(TLResizeCorner2) {
    TLResizeCorner2["TopLeft"] = "top_left_corner";
    TLResizeCorner2["TopRight"] = "top_right_corner";
    TLResizeCorner2["BottomRight"] = "bottom_right_corner";
    TLResizeCorner2["BottomLeft"] = "bottom_left_corner";
    return TLResizeCorner2;
}(TLResizeCorner || {
});
var TLRotateCorner = /* @__PURE__ */ function(TLRotateCorner2) {
    TLRotateCorner2["TopLeft"] = "top_left_resize_corner";
    TLRotateCorner2["TopRight"] = "top_right_resize_corner";
    TLRotateCorner2["BottomRight"] = "bottom_right_resize_corner";
    TLRotateCorner2["BottomLeft"] = "bottom_left_resize_corner";
    return TLRotateCorner2;
}(TLRotateCorner || {
});
var TLTargetType = /* @__PURE__ */ function(TLTargetType2) {
    TLTargetType2["Canvas"] = "canvas";
    TLTargetType2["Shape"] = "shape";
    TLTargetType2["Selection"] = "selection";
    TLTargetType2["Handle"] = "handle";
    return TLTargetType2;
}(TLTargetType || {
});
var TLCursor = /* @__PURE__ */ function(TLCursor2) {
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
}(TLCursor || {
});
var _obj;
var BoundsUtils = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        _classCallCheck(this, _class);
    }
    _createClass(_class, null, [
        {
            key: "getRectangleSides",
            value: function getRectangleSides(point, size, param) {
                var rotation = param === void 0 ? 0 : param;
                var center = [
                    point[0] + size[0] / 2,
                    point[1] + size[1] / 2
                ];
                var tl = Vec.rotWith(point, center, rotation);
                var tr = Vec.rotWith(Vec.add(point, [
                    size[0],
                    0
                ]), center, rotation);
                var br = Vec.rotWith(Vec.add(point, size), center, rotation);
                var bl = Vec.rotWith(Vec.add(point, [
                    0,
                    size[1]
                ]), center, rotation);
                return [
                    [
                        tl,
                        tr
                    ],
                    [
                        tr,
                        br
                    ],
                    [
                        br,
                        bl
                    ],
                    [
                        bl,
                        tl
                    ]
                ];
            }
        },
        {
            key: "getBoundsSides",
            value: function getBoundsSides(bounds) {
                return BoundsUtils.getRectangleSides([
                    bounds.minX,
                    bounds.minY
                ], [
                    bounds.width,
                    bounds.height
                ]);
            }
        },
        {
            key: "expandBounds",
            value: function expandBounds(bounds, delta) {
                return {
                    minX: bounds.minX - delta,
                    minY: bounds.minY - delta,
                    maxX: bounds.maxX + delta,
                    maxY: bounds.maxY + delta,
                    width: bounds.width + delta * 2,
                    height: bounds.height + delta * 2
                };
            }
        },
        {
            key: "boundsCollide",
            value: function boundsCollide(a2, b) {
                return !(a2.maxX < b.minX || a2.minX > b.maxX || a2.maxY < b.minY || a2.minY > b.maxY);
            }
        },
        {
            key: "boundsContain",
            value: function boundsContain(a2, b) {
                return a2.minX < b.minX && a2.minY < b.minY && a2.maxY > b.maxY && a2.maxX > b.maxX;
            }
        },
        {
            key: "boundsContained",
            value: function boundsContained(a2, b) {
                return BoundsUtils.boundsContain(b, a2);
            }
        },
        {
            key: "boundsAreEqual",
            value: function boundsAreEqual(a2, b) {
                return !(b.maxX !== a2.maxX || b.minX !== a2.minX || b.maxY !== a2.maxY || b.minY !== a2.minY);
            }
        },
        {
            key: "getBoundsFromPoints",
            value: function getBoundsFromPoints(points, param) {
                var rotation = param === void 0 ? 0 : param;
                var minX = Infinity;
                var minY = Infinity;
                var maxX = -Infinity;
                var maxY = -Infinity;
                if (points.length < 2) {
                    minX = 0;
                    minY = 0;
                    maxX = 1;
                    maxY = 1;
                } else {
                    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                    try {
                        for(var _iterator = points[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                            var point = _step.value;
                            minX = Math.min(point[0], minX);
                            minY = Math.min(point[1], minY);
                            maxX = Math.max(point[0], maxX);
                            maxY = Math.max(point[1], maxY);
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally{
                        try {
                            if (!_iteratorNormalCompletion && _iterator.return != null) {
                                _iterator.return();
                            }
                        } finally{
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }
                }
                if (rotation !== 0) {
                    return BoundsUtils.getBoundsFromPoints(points.map(function(pt) {
                        return Vec.rotWith(pt, [
                            (minX + maxX) / 2,
                            (minY + maxY) / 2
                        ], rotation);
                    }));
                }
                return {
                    minX: minX,
                    minY: minY,
                    maxX: maxX,
                    maxY: maxY,
                    width: Math.max(1, maxX - minX),
                    height: Math.max(1, maxY - minY)
                };
            }
        },
        {
            key: "centerBounds",
            value: function centerBounds(bounds, point) {
                var boundsCenter = BoundsUtils.getBoundsCenter(bounds);
                var dx = point[0] - boundsCenter[0];
                var dy = point[1] - boundsCenter[1];
                return BoundsUtils.translateBounds(bounds, [
                    dx,
                    dy
                ]);
            }
        },
        {
            key: "snapBoundsToGrid",
            value: function snapBoundsToGrid(bounds, gridSize) {
                var minX = Math.round(bounds.minX / gridSize) * gridSize;
                var minY = Math.round(bounds.minY / gridSize) * gridSize;
                var maxX = Math.round(bounds.maxX / gridSize) * gridSize;
                var maxY = Math.round(bounds.maxY / gridSize) * gridSize;
                return {
                    minX: minX,
                    minY: minY,
                    maxX: maxX,
                    maxY: maxY,
                    width: Math.max(1, maxX - minX),
                    height: Math.max(1, maxY - minY)
                };
            }
        },
        {
            key: "translateBounds",
            value: function translateBounds(bounds, delta) {
                return {
                    minX: bounds.minX + delta[0],
                    minY: bounds.minY + delta[1],
                    maxX: bounds.maxX + delta[0],
                    maxY: bounds.maxY + delta[1],
                    width: bounds.width,
                    height: bounds.height
                };
            }
        },
        {
            key: "multiplyBounds",
            value: function multiplyBounds(bounds, n) {
                var center = BoundsUtils.getBoundsCenter(bounds);
                return BoundsUtils.centerBounds({
                    minX: bounds.minX * n,
                    minY: bounds.minY * n,
                    maxX: bounds.maxX * n,
                    maxY: bounds.maxY * n,
                    width: bounds.width * n,
                    height: bounds.height * n
                }, center);
            }
        },
        {
            key: "divideBounds",
            value: function divideBounds(bounds, n) {
                var center = BoundsUtils.getBoundsCenter(bounds);
                return BoundsUtils.centerBounds({
                    minX: bounds.minX / n,
                    minY: bounds.minY / n,
                    maxX: bounds.maxX / n,
                    maxY: bounds.maxY / n,
                    width: bounds.width / n,
                    height: bounds.height / n
                }, center);
            }
        },
        {
            key: "getRotatedBounds",
            value: function getRotatedBounds(bounds, param) {
                var rotation = param === void 0 ? 0 : param;
                var corners = BoundsUtils.getRotatedCorners(bounds, rotation);
                var minX = Infinity;
                var minY = Infinity;
                var maxX = -Infinity;
                var maxY = -Infinity;
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = corners[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var point = _step.value;
                        minX = Math.min(point[0], minX);
                        minY = Math.min(point[1], minY);
                        maxX = Math.max(point[0], maxX);
                        maxY = Math.max(point[1], maxY);
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally{
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                            _iterator.return();
                        }
                    } finally{
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
                return {
                    minX: minX,
                    minY: minY,
                    maxX: maxX,
                    maxY: maxY,
                    width: Math.max(1, maxX - minX),
                    height: Math.max(1, maxY - minY),
                    rotation: 0
                };
            }
        },
        {
            key: "getRotatedEllipseBounds",
            value: function getRotatedEllipseBounds(x, y, rx, ry, param) {
                var rotation = param === void 0 ? 0 : param;
                var c = Math.cos(rotation);
                var s = Math.sin(rotation);
                var w = Math.hypot(rx * c, ry * s);
                var h = Math.hypot(rx * s, ry * c);
                return {
                    minX: x + rx - w,
                    minY: y + ry - h,
                    maxX: x + rx + w,
                    maxY: y + ry + h,
                    width: w * 2,
                    height: h * 2
                };
            }
        },
        {
            key: "getExpandedBounds",
            value: function getExpandedBounds(a2, b) {
                var minX = Math.min(a2.minX, b.minX);
                var minY = Math.min(a2.minY, b.minY);
                var maxX = Math.max(a2.maxX, b.maxX);
                var maxY = Math.max(a2.maxY, b.maxY);
                var width = Math.abs(maxX - minX);
                var height = Math.abs(maxY - minY);
                return {
                    minX: minX,
                    minY: minY,
                    maxX: maxX,
                    maxY: maxY,
                    width: width,
                    height: height
                };
            }
        },
        {
            key: "getCommonBounds",
            value: function getCommonBounds(bounds) {
                if (bounds.length < 2) return bounds[0];
                var result = bounds[0];
                for(var i = 1; i < bounds.length; i++){
                    result = BoundsUtils.getExpandedBounds(result, bounds[i]);
                }
                return result;
            }
        },
        {
            key: "getRotatedCorners",
            value: function getRotatedCorners(b, param) {
                var rotation = param === void 0 ? 0 : param;
                var center = [
                    b.minX + b.width / 2,
                    b.minY + b.height / 2
                ];
                var corners = [
                    [
                        b.minX,
                        b.minY
                    ],
                    [
                        b.maxX,
                        b.minY
                    ],
                    [
                        b.maxX,
                        b.maxY
                    ],
                    [
                        b.minX,
                        b.maxY
                    ]
                ];
                if (rotation) return corners.map(function(point) {
                    return Vec.rotWith(point, center, rotation);
                });
                return corners;
            }
        },
        {
            key: "getTransformedBoundingBox",
            value: function getTransformedBoundingBox(bounds, handle, delta, param, param2) {
                var rotation = param === void 0 ? 0 : param, isAspectRatioLocked = param2 === void 0 ? false : param2;
                var ref = [
                    bounds.minX,
                    bounds.minY
                ], ax0 = ref[0], ay0 = ref[1];
                var ref1 = [
                    bounds.maxX,
                    bounds.maxY
                ], ax1 = ref1[0], ay1 = ref1[1];
                var ref2 = [
                    bounds.minX,
                    bounds.minY
                ], bx0 = ref2[0], by0 = ref2[1];
                var ref3 = [
                    bounds.maxX,
                    bounds.maxY
                ], bx1 = ref3[0], by1 = ref3[1];
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
                var ref4 = _slicedToArray(Vec.rot(delta, -rotation), 2), dx = ref4[0], dy = ref4[1];
                switch(handle){
                    case "top_edge":
                    case "top_left_corner":
                    case "top_right_corner":
                        {
                            by0 += dy;
                            break;
                        }
                    case "bottom_edge":
                    case "bottom_left_corner":
                    case "bottom_right_corner":
                        {
                            by1 += dy;
                            break;
                        }
                }
                switch(handle){
                    case "left_edge":
                    case "top_left_corner":
                    case "bottom_left_corner":
                        {
                            bx0 += dx;
                            break;
                        }
                    case "right_edge":
                    case "top_right_corner":
                    case "bottom_right_corner":
                        {
                            bx1 += dx;
                            break;
                        }
                }
                var aw = ax1 - ax0;
                var ah = ay1 - ay0;
                var scaleX = (bx1 - bx0) / aw;
                var scaleY = (by1 - by0) / ah;
                var flipX = scaleX < 0;
                var flipY = scaleY < 0;
                var bw = Math.abs(bx1 - bx0);
                var bh = Math.abs(by1 - by0);
                if (isAspectRatioLocked) {
                    var ar = aw / ah;
                    var isTall = ar < bw / bh;
                    var tw = bw * (scaleY < 0 ? 1 : -1) * (1 / ar);
                    var th = bh * (scaleX < 0 ? 1 : -1) * ar;
                    switch(handle){
                        case "top_left_corner":
                            {
                                if (isTall) by0 = by1 + tw;
                                else bx0 = bx1 + th;
                                break;
                            }
                        case "top_right_corner":
                            {
                                if (isTall) by0 = by1 + tw;
                                else bx1 = bx0 - th;
                                break;
                            }
                        case "bottom_right_corner":
                            {
                                if (isTall) by1 = by0 - tw;
                                else bx1 = bx0 - th;
                                break;
                            }
                        case "bottom_left_corner":
                            {
                                if (isTall) by1 = by0 - tw;
                                else bx0 = bx1 + th;
                                break;
                            }
                        case "bottom_edge":
                        case "top_edge":
                            {
                                var m = (bx0 + bx1) / 2;
                                var w = bh * ar;
                                bx0 = m - w / 2;
                                bx1 = m + w / 2;
                                break;
                            }
                        case "left_edge":
                        case "right_edge":
                            {
                                var m1 = (by0 + by1) / 2;
                                var h = bw / ar;
                                by0 = m1 - h / 2;
                                by1 = m1 + h / 2;
                                break;
                            }
                    }
                }
                if (rotation % (Math.PI * 2) !== 0) {
                    var cv = [
                        0,
                        0
                    ];
                    var c0 = Vec.med([
                        ax0,
                        ay0
                    ], [
                        ax1,
                        ay1
                    ]);
                    var c1 = Vec.med([
                        bx0,
                        by0
                    ], [
                        bx1,
                        by1
                    ]);
                    switch(handle){
                        case "top_left_corner":
                            {
                                cv = Vec.sub(Vec.rotWith([
                                    bx1,
                                    by1
                                ], c1, rotation), Vec.rotWith([
                                    ax1,
                                    ay1
                                ], c0, rotation));
                                break;
                            }
                        case "top_right_corner":
                            {
                                cv = Vec.sub(Vec.rotWith([
                                    bx0,
                                    by1
                                ], c1, rotation), Vec.rotWith([
                                    ax0,
                                    ay1
                                ], c0, rotation));
                                break;
                            }
                        case "bottom_right_corner":
                            {
                                cv = Vec.sub(Vec.rotWith([
                                    bx0,
                                    by0
                                ], c1, rotation), Vec.rotWith([
                                    ax0,
                                    ay0
                                ], c0, rotation));
                                break;
                            }
                        case "bottom_left_corner":
                            {
                                cv = Vec.sub(Vec.rotWith([
                                    bx1,
                                    by0
                                ], c1, rotation), Vec.rotWith([
                                    ax1,
                                    ay0
                                ], c0, rotation));
                                break;
                            }
                        case "top_edge":
                            {
                                cv = Vec.sub(Vec.rotWith(Vec.med([
                                    bx0,
                                    by1
                                ], [
                                    bx1,
                                    by1
                                ]), c1, rotation), Vec.rotWith(Vec.med([
                                    ax0,
                                    ay1
                                ], [
                                    ax1,
                                    ay1
                                ]), c0, rotation));
                                break;
                            }
                        case "left_edge":
                            {
                                cv = Vec.sub(Vec.rotWith(Vec.med([
                                    bx1,
                                    by0
                                ], [
                                    bx1,
                                    by1
                                ]), c1, rotation), Vec.rotWith(Vec.med([
                                    ax1,
                                    ay0
                                ], [
                                    ax1,
                                    ay1
                                ]), c0, rotation));
                                break;
                            }
                        case "bottom_edge":
                            {
                                cv = Vec.sub(Vec.rotWith(Vec.med([
                                    bx0,
                                    by0
                                ], [
                                    bx1,
                                    by0
                                ]), c1, rotation), Vec.rotWith(Vec.med([
                                    ax0,
                                    ay0
                                ], [
                                    ax1,
                                    ay0
                                ]), c0, rotation));
                                break;
                            }
                        case "right_edge":
                            {
                                cv = Vec.sub(Vec.rotWith(Vec.med([
                                    bx0,
                                    by0
                                ], [
                                    bx0,
                                    by1
                                ]), c1, rotation), Vec.rotWith(Vec.med([
                                    ax0,
                                    ay0
                                ], [
                                    ax0,
                                    ay1
                                ]), c0, rotation));
                                break;
                            }
                    }
                    ;
                    var ref5;
                    ref5 = Vec.sub([
                        bx0,
                        by0
                    ], cv), bx0 = ref5[0], by0 = ref5[1], ref5;
                    var ref6;
                    ref6 = Vec.sub([
                        bx1,
                        by1
                    ], cv), bx1 = ref6[0], by1 = ref6[1], ref6;
                }
                var ref7;
                if (bx1 < bx0) ref7 = [
                    bx0,
                    bx1
                ], bx1 = ref7[0], bx0 = ref7[1], ref7;
                var ref8;
                if (by1 < by0) ref8 = [
                    by0,
                    by1
                ], by1 = ref8[0], by0 = ref8[1], ref8;
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
        },
        {
            key: "getTransformAnchor",
            value: function getTransformAnchor(type, isFlippedX, isFlippedY) {
                var anchor = type;
                switch(type){
                    case "top_left_corner":
                        {
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
                    case "top_right_corner":
                        {
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
                    case "bottom_right_corner":
                        {
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
                    case "bottom_left_corner":
                        {
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
        },
        {
            key: "getRelativeTransformedBoundingBox",
            value: function getRelativeTransformedBoundingBox(bounds, initialBounds, initialShapeBounds, isFlippedX, isFlippedY) {
                var nx = (isFlippedX ? initialBounds.maxX - initialShapeBounds.maxX : initialShapeBounds.minX - initialBounds.minX) / initialBounds.width;
                var ny = (isFlippedY ? initialBounds.maxY - initialShapeBounds.maxY : initialShapeBounds.minY - initialBounds.minY) / initialBounds.height;
                var nw = initialShapeBounds.width / initialBounds.width;
                var nh = initialShapeBounds.height / initialBounds.height;
                var minX = bounds.minX + bounds.width * nx;
                var minY = bounds.minY + bounds.height * ny;
                var width = bounds.width * nw;
                var height = bounds.height * nh;
                return {
                    minX: minX,
                    minY: minY,
                    maxX: minX + width,
                    maxY: minY + height,
                    width: width,
                    height: height
                };
            }
        },
        {
            key: "getRotatedSize",
            value: function getRotatedSize(size, rotation) {
                var center = Vec.div(size, 2);
                var points = [
                    [
                        0,
                        0
                    ],
                    [
                        size[0],
                        0
                    ],
                    size,
                    [
                        0,
                        size[1]
                    ]
                ].map(function(point) {
                    return Vec.rotWith(point, center, rotation);
                });
                var bounds = BoundsUtils.getBoundsFromPoints(points);
                return [
                    bounds.width,
                    bounds.height
                ];
            }
        },
        {
            key: "getBoundsCenter",
            value: function getBoundsCenter(bounds) {
                return [
                    bounds.minX + bounds.width / 2,
                    bounds.minY + bounds.height / 2
                ];
            }
        },
        {
            key: "getBoundsWithCenter",
            value: function getBoundsWithCenter(bounds) {
                var center = BoundsUtils.getBoundsCenter(bounds);
                return __spreadProps2(__spreadValues2({
                }, bounds), {
                    midX: center[0],
                    midY: center[1]
                });
            }
        },
        {
            key: "getCommonTopLeft",
            value: function getCommonTopLeft(points) {
                var min = [
                    Infinity,
                    Infinity
                ];
                points.forEach(function(point) {
                    min[0] = Math.min(min[0], point[0]);
                    min[1] = Math.min(min[1], point[1]);
                });
                return min;
            }
        },
        {
            key: "getTLSnapPoints",
            value: function getTLSnapPoints(bounds, others, snapDistance) {
                var A = __spreadValues2({
                }, bounds);
                var offset = [
                    0,
                    0
                ];
                var snapLines = [];
                var snaps = (_obj = {
                }, _defineProperty(_obj, "minX", {
                    id: "minX",
                    isSnapped: false
                }), _defineProperty(_obj, "midX", {
                    id: "midX",
                    isSnapped: false
                }), _defineProperty(_obj, "maxX", {
                    id: "maxX",
                    isSnapped: false
                }), _defineProperty(_obj, "minY", {
                    id: "minY",
                    isSnapped: false
                }), _defineProperty(_obj, "midY", {
                    id: "midY",
                    isSnapped: false
                }), _defineProperty(_obj, "maxY", {
                    id: "maxY",
                    isSnapped: false
                }), _obj);
                var xs = [
                    "midX",
                    "minX",
                    "maxX"
                ];
                var ys = [
                    "midY",
                    "minY",
                    "maxY"
                ];
                var snapResults = others.map(function(B) {
                    var rx = xs.flatMap(function(f2, i) {
                        return xs.map(function(t, k) {
                            var gap = A[f2] - B[t];
                            var distance = Math.abs(gap);
                            return {
                                f: f2,
                                t: t,
                                gap: gap,
                                distance: distance,
                                isCareful: i === 0 || i + k === 3
                            };
                        });
                    });
                    var ry = ys.flatMap(function(f2, i) {
                        return ys.map(function(t, k) {
                            var gap = A[f2] - B[t];
                            var distance = Math.abs(gap);
                            return {
                                f: f2,
                                t: t,
                                gap: gap,
                                distance: distance,
                                isCareful: i === 0 || i + k === 3
                            };
                        });
                    });
                    return [
                        B,
                        rx,
                        ry
                    ];
                });
                var gapX = Infinity;
                var gapY = Infinity;
                var minX = Infinity;
                var minY = Infinity;
                snapResults.forEach(function(param) {
                    var _param = _slicedToArray(param, 3), _15 = _param[0], rx = _param[1], ry = _param[2];
                    rx.forEach(function(r) {
                        if (r.distance < snapDistance && r.distance < minX) {
                            minX = r.distance;
                            gapX = r.gap;
                        }
                    });
                    ry.forEach(function(r) {
                        if (r.distance < snapDistance && r.distance < minY) {
                            minY = r.distance;
                            gapY = r.gap;
                        }
                    });
                });
                snapResults.forEach(function(param) {
                    var _param = _slicedToArray(param, 3), B = _param[0], rx = _param[1], ry = _param[2];
                    if (gapX !== Infinity) {
                        rx.forEach(function(r) {
                            if (Math.abs(r.gap - gapX) < 2) {
                                snaps[r.f] = __spreadProps2(__spreadValues2({
                                }, snaps[r.f]), {
                                    isSnapped: true,
                                    to: B[r.t],
                                    B: B,
                                    distance: r.distance
                                });
                            }
                        });
                    }
                    if (gapY !== Infinity) {
                        ry.forEach(function(r) {
                            if (Math.abs(r.gap - gapY) < 2) {
                                snaps[r.f] = __spreadProps2(__spreadValues2({
                                }, snaps[r.f]), {
                                    isSnapped: true,
                                    to: B[r.t],
                                    B: B,
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
                xs.forEach(function(from) {
                    var snap = snaps[from];
                    if (!snap.isSnapped) return;
                    var id = snap.id, B = snap.B;
                    var x = A[id];
                    snapLines.push(id === "minX" ? [
                        [
                            x,
                            A.midY
                        ],
                        [
                            x,
                            B.minY
                        ],
                        [
                            x,
                            B.maxY
                        ]
                    ] : [
                        [
                            x,
                            A.minY
                        ],
                        [
                            x,
                            A.maxY
                        ],
                        [
                            x,
                            B.minY
                        ],
                        [
                            x,
                            B.maxY
                        ]
                    ]);
                });
                ys.forEach(function(from) {
                    var snap = snaps[from];
                    if (!snap.isSnapped) return;
                    var id = snap.id, B = snap.B;
                    var y = A[id];
                    snapLines.push(id === "midY" ? [
                        [
                            A.midX,
                            y
                        ],
                        [
                            B.minX,
                            y
                        ],
                        [
                            B.maxX,
                            y
                        ]
                    ] : [
                        [
                            A.minX,
                            y
                        ],
                        [
                            A.maxX,
                            y
                        ],
                        [
                            B.minX,
                            y
                        ],
                        [
                            B.maxX,
                            y
                        ]
                    ]);
                });
                return {
                    offset: offset,
                    snapLines: snapLines
                };
            }
        }
    ]);
    return _class;
}();
var _PointUtils = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        _classCallCheck(this, _class);
    }
    _createClass(_class, null, [
        {
            key: "pointInCircle",
            value: function pointInCircle(A, C, r) {
                return Vec.dist(A, C) <= r;
            }
        },
        {
            key: "pointInEllipse",
            value: function pointInEllipse(A, C, rx, ry, param) {
                var rotation = param === void 0 ? 0 : param;
                rotation = rotation || 0;
                var cos = Math.cos(rotation);
                var sin = Math.sin(rotation);
                var delta = Vec.sub(A, C);
                var tdx = cos * delta[0] + sin * delta[1];
                var tdy = sin * delta[0] - cos * delta[1];
                return tdx * tdx / (rx * rx) + tdy * tdy / (ry * ry) <= 1;
            }
        },
        {
            key: "pointInRect",
            value: function pointInRect(point, size) {
                return !(point[0] < size[0] || point[0] > point[0] + size[0] || point[1] < size[1] || point[1] > point[1] + size[1]);
            }
        },
        {
            key: "pointInPolygon",
            value: function pointInPolygon(p, points) {
                var wn = 0;
                points.forEach(function(a2, i) {
                    var b = points[(i + 1) % points.length];
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
        },
        {
            key: "pointInBounds",
            value: function pointInBounds(A, b) {
                return !(A[0] < b.minX || A[0] > b.maxX || A[1] < b.minY || A[1] > b.maxY);
            }
        },
        {
            key: "pointInPolyline",
            value: function pointInPolyline(A, points, param) {
                var distance = param === void 0 ? 3 : param;
                for(var i = 1; i < points.length; i++){
                    if (Vec.distanceToLineSegment(points[i - 1], points[i], A) < distance) {
                        return true;
                    }
                }
                return false;
            }
        },
        {
            key: "_getSqSegDist",
            value: function _getSqSegDist(p, p1, p2) {
                var x = p1[0];
                var y = p1[1];
                var dx = p2[0] - x;
                var dy = p2[1] - y;
                if (dx !== 0 || dy !== 0) {
                    var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
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
        },
        {
            key: "_simplifyStep",
            value: function _simplifyStep(points, first, last, sqTolerance, result) {
                var maxSqDist = sqTolerance;
                var index = -1;
                for(var i = first + 1; i < last; i++){
                    var sqDist = _PointUtils._getSqSegDist(points[i], points[first], points[last]);
                    if (sqDist > maxSqDist) {
                        index = i;
                        maxSqDist = sqDist;
                    }
                }
                if (index > -1 && maxSqDist > sqTolerance) {
                    if (index - first > 1) _PointUtils._simplifyStep(points, first, index, sqTolerance, result);
                    result.push(points[index]);
                    if (last - index > 1) _PointUtils._simplifyStep(points, index, last, sqTolerance, result);
                }
            }
        },
        {
            key: "simplify2",
            value: function simplify2(points, param) {
                var tolerance = param === void 0 ? 1 : param;
                if (points.length <= 2) return points;
                var sqTolerance = tolerance * tolerance;
                var A = points[0];
                var B = points[1];
                var newPoints = [
                    A
                ];
                for(var i = 1, len = points.length; i < len; i++){
                    B = points[i];
                    if ((B[0] - A[0]) * (B[0] - A[0]) + (B[1] - A[1]) * (B[1] - A[1]) > sqTolerance) {
                        newPoints.push(B);
                        A = B;
                    }
                }
                if (A !== B) newPoints.push(B);
                var last = newPoints.length - 1;
                var result = [
                    newPoints[0]
                ];
                _PointUtils._simplifyStep(newPoints, 0, last, sqTolerance, result);
                result.push(newPoints[last], points[points.length - 1]);
                return result;
            }
        },
        {
            key: "pointNearToPolyline",
            value: function pointNearToPolyline(point, points, param) {
                var distance = param === void 0 ? 8 : param;
                var len = points.length;
                for(var i = 1; i < len; i++){
                    var p1 = points[i - 1];
                    var p2 = points[i];
                    var d = Vec.distanceToLineSegment(p1, p2, point);
                    if (d < distance) return true;
                }
                return false;
            }
        }
    ]);
    return _class;
}();
var PointUtils = _PointUtils;
__publicField3(PointUtils, "simplify", function(points, param) {
    var tolerance = param === void 0 ? 1 : param;
    var len = points.length;
    var a2 = points[0];
    var b = points[len - 1];
    var _a2 = _slicedToArray(a2, 2), x1 = _a2[0], y1 = _a2[1];
    var _b = _slicedToArray(b, 2), x2 = _b[0], y2 = _b[1];
    if (len > 2) {
        var distance = 0;
        var index = 0;
        var max = Vec.len2([
            y2 - y1,
            x2 - x1
        ]);
        for(var i = 1; i < len - 1; i++){
            var _i = _slicedToArray(points[i], 2), x0 = _i[0], y0 = _i[1];
            var d = Math.pow(x0 * (y2 - y1) + x1 * (y0 - y2) + x2 * (y1 - y0), 2) / max;
            if (distance > d) continue;
            distance = d;
            index = i;
        }
        if (distance > tolerance) {
            var l0 = _PointUtils.simplify(points.slice(0, index + 1), tolerance);
            var l1 = _PointUtils.simplify(points.slice(index + 1), tolerance);
            return l0.concat(l1.slice(1));
        }
    }
    return [
        a2,
        b
    ];
});
var tagFilter = function(param, enableOnTags) {
    var target = param.target;
    var targetTagName = target && target.tagName;
    return Boolean(targetTagName && enableOnTags && enableOnTags.includes(targetTagName));
};
var KeyUtils = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        _classCallCheck(this, _class);
    }
    _createClass(_class, null, [
        {
            key: "registerShortcut",
            value: function registerShortcut(keys, callback) {
                var fn = function(keyboardEvent, combo) {
                    var _a2;
                    keyboardEvent.preventDefault();
                    if (tagFilter(keyboardEvent, [
                        "INPUT",
                        "TEXTAREA",
                        "SELECT"
                    ]) || ((_a2 = keyboardEvent.target) == null ? void 0 : _a2.isContentEditable)) {
                        return;
                    }
                    callback(keyboardEvent, combo);
                };
                import_mousetrap.default.bind(keys, fn);
                return function() {
                    return import_mousetrap.default.unbind(keys);
                };
            }
        }
    ]);
    return _class;
}();
var PI = Math.PI;
var TAU = PI / 2;
var PI2 = PI * 2;
var EPSILON = Math.PI / 180;
var FIT_TO_SCREEN_PADDING = 100;
var _obj1;
var CURSORS = (_obj1 = {
}, _defineProperty(_obj1, "bottom_edge", "ns-resize"), _defineProperty(_obj1, "top_edge", "ns-resize"), _defineProperty(_obj1, "left_edge", "ew-resize"), _defineProperty(_obj1, "right_edge", "ew-resize"), _defineProperty(_obj1, "bottom_left_corner", "nesw-resize"), _defineProperty(_obj1, "bottom_right_corner", "nwse-resize"), _defineProperty(_obj1, "top_left_corner", "nwse-resize"), _defineProperty(_obj1, "top_right_corner", "nesw-resize"), _defineProperty(_obj1, "bottom_left_resize_corner", "swne-rotate"), _defineProperty(_obj1, "bottom_right_resize_corner", "senw-rotate"), _defineProperty(_obj1, "top_left_resize_corner", "nwse-rotate"), _defineProperty(_obj1, "top_right_resize_corner", "nesw-rotate"), _defineProperty(_obj1, "rotate", "rotate"), _defineProperty(_obj1, "center", "grab"), _defineProperty(_obj1, "background", "grab"), _obj1);
var GeomUtils = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        _classCallCheck(this, _class);
    }
    _createClass(_class, null, [
        {
            key: "circleFromThreePoints",
            value: function circleFromThreePoints(A, B, C) {
                var _A = _slicedToArray(A, 2), x1 = _A[0], y1 = _A[1];
                var _B = _slicedToArray(B, 2), x2 = _B[0], y2 = _B[1];
                var _C = _slicedToArray(C, 2), x3 = _C[0], y3 = _C[1];
                var a2 = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
                var b = (x1 * x1 + y1 * y1) * (y3 - y2) + (x2 * x2 + y2 * y2) * (y1 - y3) + (x3 * x3 + y3 * y3) * (y2 - y1);
                var c = (x1 * x1 + y1 * y1) * (x2 - x3) + (x2 * x2 + y2 * y2) * (x3 - x1) + (x3 * x3 + y3 * y3) * (x1 - x2);
                var x = -b / (2 * a2);
                var y = -c / (2 * a2);
                return [
                    x,
                    y,
                    Math.hypot(x - x1, y - y1)
                ];
            }
        },
        {
            key: "perimeterOfEllipse",
            value: function perimeterOfEllipse(rx, ry) {
                var h = Math.pow(rx - ry, 2) / Math.pow(rx + ry, 2);
                var p = PI * (rx + ry) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));
                return p;
            }
        },
        {
            key: "shortAngleDist",
            value: function shortAngleDist(a0, a1) {
                var da = (a1 - a0) % PI2;
                return 2 * da % PI2 - da;
            }
        },
        {
            key: "longAngleDist",
            value: function longAngleDist(a0, a1) {
                return PI2 - GeomUtils.shortAngleDist(a0, a1);
            }
        },
        {
            key: "lerpAngles",
            value: function lerpAngles(a0, a1, t) {
                return a0 + GeomUtils.shortAngleDist(a0, a1) * t;
            }
        },
        {
            key: "angleDelta",
            value: function angleDelta(a0, a1) {
                return GeomUtils.shortAngleDist(a0, a1);
            }
        },
        {
            key: "getSweep",
            value: function getSweep(C, A, B) {
                return GeomUtils.angleDelta(src_default.angle(C, A), src_default.angle(C, B));
            }
        },
        {
            key: "clampRadians",
            value: function clampRadians(r) {
                return (PI2 + r) % PI2;
            }
        },
        {
            key: "snapAngleToSegments",
            value: function snapAngleToSegments(r, segments) {
                var seg = PI2 / segments;
                var ang = Math.floor((GeomUtils.clampRadians(r) + seg / 2) / seg) * seg % PI2;
                if (ang < PI) ang += PI2;
                if (ang > PI) ang -= PI2;
                return ang;
            }
        },
        {
            key: "isAngleBetween",
            value: function isAngleBetween(a2, b, c) {
                if (c === a2 || c === b) return true;
                var AB = (b - a2 + TAU) % TAU;
                var AC = (c - a2 + TAU) % TAU;
                return AB <= PI !== AC > AB;
            }
        },
        {
            key: "degreesToRadians",
            value: function degreesToRadians(d) {
                return d * PI / 180;
            }
        },
        {
            key: "radiansToDegrees",
            value: function radiansToDegrees(r) {
                return r * 180 / PI;
            }
        },
        {
            key: "getArcLength",
            value: function getArcLength(C, r, A, B) {
                var sweep = GeomUtils.getSweep(C, A, B);
                return r * PI2 * (sweep / PI2);
            }
        },
        {
            key: "getSweepFlag",
            value: function getSweepFlag(A, B, C) {
                var angleAC = src_default.angle(A, C);
                var angleAB = src_default.angle(A, B);
                var angleCAB = (angleAB - angleAC + 3 * PI) % PI2 - PI;
                return angleCAB > 0 ? 0 : 1;
            }
        },
        {
            key: "getLargeArcFlag",
            value: function getLargeArcFlag(A, C, P) {
                var anglePA = src_default.angle(P, A);
                var anglePC = src_default.angle(P, C);
                var angleAPC = (anglePC - anglePA + 3 * PI) % PI2 - PI;
                return Math.abs(angleAPC) > TAU ? 0 : 1;
            }
        },
        {
            key: "getArcDashOffset",
            value: function getArcDashOffset(C, r, A, B, step) {
                var del0 = GeomUtils.getSweepFlag(C, A, B);
                var len0 = GeomUtils.getArcLength(C, r, A, B);
                var off0 = del0 < 0 ? len0 : PI2 * C[2] - len0;
                return -off0 / 2 + step;
            }
        },
        {
            key: "getEllipseDashOffset",
            value: function getEllipseDashOffset(A, step) {
                var c = PI2 * A[2];
                return -c / 2 + -step;
            }
        },
        {
            key: "radiansToCardinalDirection",
            value: function radiansToCardinalDirection(radians) {
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
        }
    ]);
    return _class;
}();
var _PolygonUtils = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        _classCallCheck(this, _class);
    }
    _createClass(_class, null, [
        {
            key: "getPolygonCentroid",
            value: function getPolygonCentroid(points) {
                var _Math, _Math3, _Math4, _Math5;
                var x = points.map(function(point) {
                    return point[0];
                });
                var y = points.map(function(point) {
                    return point[1];
                });
                var cx = (_Math = Math).min.apply(_Math, _toConsumableArray(x)) + (_Math3 = Math).max.apply(_Math3, _toConsumableArray(x));
                var cy = (_Math4 = Math).min.apply(_Math4, _toConsumableArray(y)) + (_Math5 = Math).max.apply(_Math5, _toConsumableArray(y));
                return [
                    cx ? cx / 2 : 0,
                    cy ? cy / 2 : 0
                ];
            }
        }
    ]);
    return _class;
}();
var PolygonUtils = _PolygonUtils;
__publicField3(PolygonUtils, "getEdges", function(points) {
    var len = points.length;
    return points.map(function(point, i) {
        return [
            point,
            points[(i + 1) % len]
        ];
    });
});
__publicField3(PolygonUtils, "getEdgeOutwardNormal", function(A, B) {
    return src_default.per(src_default.uni(src_default.sub(B, A)));
});
__publicField3(PolygonUtils, "getEdgeInwardNormal", function(A, B) {
    return src_default.neg(_PolygonUtils.getEdgeOutwardNormal(A, B));
});
__publicField3(PolygonUtils, "getOffsetEdge", function(A, B, offset) {
    var offsetVector = src_default.mul(src_default.per(src_default.uni(src_default.sub(B, A))), offset);
    return [
        src_default.add(A, offsetVector),
        src_default.add(B, offsetVector)
    ];
});
__publicField3(PolygonUtils, "getOffsetEdges", function(edges, offset) {
    return edges.map(function(param) {
        var _param = _slicedToArray(param, 2), A = _param[0], B = _param[1];
        return _PolygonUtils.getOffsetEdge(A, B, offset);
    });
});
__publicField3(PolygonUtils, "getOffsetPolygon", function(points, offset) {
    if (points.length < 1) {
        throw Error("Expected at least one point.");
    } else if (points.length === 1) {
        var A = points[0];
        return [
            src_default.add(A, [
                -offset,
                -offset
            ]),
            src_default.add(A, [
                offset,
                -offset
            ]),
            src_default.add(A, [
                offset,
                offset
            ]),
            src_default.add(A, [
                -offset,
                offset
            ])
        ];
    } else if (points.length === 2) {
        var _points = _slicedToArray(points, 2), A1 = _points[0], B = _points[1];
        return _toConsumableArray(_PolygonUtils.getOffsetEdge(A1, B, offset)).concat(_toConsumableArray(_PolygonUtils.getOffsetEdge(B, A1, offset)));
    }
    return _PolygonUtils.getOffsetEdges(_PolygonUtils.getEdges(points), offset).flatMap(function(edge, i, edges) {
        var intersection = intersectLineLine(edge, edges[(i + 1) % edges.length]);
        if (intersection === void 0) throw Error("Expected an intersection");
        return intersection.points;
    });
});
__publicField3(PolygonUtils, "getPolygonVertices", function(size, sides, param, param3) {
    var padding = param === void 0 ? 0 : param, ratio = param3 === void 0 ? 1 : param3;
    var center = src_default.div(size, 2);
    var ref = [
        Math.max(1, center[0] - padding),
        Math.max(1, center[1] - padding)
    ], rx = ref[0], ry = ref[1];
    var pointsOnPerimeter = [];
    for(var i = 0, step = PI2 / sides; i < sides; i++){
        var t1 = (-TAU + i * step) % PI2;
        var t2 = (-TAU + (i + 1) * step) % PI2;
        var p1 = src_default.add(center, [
            rx * Math.cos(t1),
            ry * Math.sin(t1)
        ]);
        var p3 = src_default.add(center, [
            rx * Math.cos(t2),
            ry * Math.sin(t2)
        ]);
        var mid = src_default.med(p1, p3);
        var p2 = src_default.nudge(mid, center, src_default.dist(center, mid) * (1 - ratio));
        pointsOnPerimeter.push(p1, p2, p3);
    }
    return pointsOnPerimeter;
});
__publicField3(PolygonUtils, "getTriangleVertices", function(size, param, param4) {
    var padding = param === void 0 ? 0 : param, ratio = param4 === void 0 ? 1 : param4;
    var _size = _slicedToArray(size, 2), w = _size[0], h = _size[1];
    var r = 1 - ratio;
    var A = [
        w / 2,
        padding / 2
    ];
    var B = [
        w - padding,
        h - padding
    ];
    var C = [
        padding / 2,
        h - padding
    ];
    var centroid = _PolygonUtils.getPolygonCentroid([
        A,
        B,
        C
    ]);
    var AB = src_default.med(A, B);
    var BC = src_default.med(B, C);
    var CA = src_default.med(C, A);
    var dAB = src_default.dist(AB, centroid) * r;
    var dBC = src_default.dist(BC, centroid) * r;
    var dCA = src_default.dist(CA, centroid) * r;
    return [
        A,
        dAB ? src_default.nudge(AB, centroid, dAB) : AB,
        B,
        dBC ? src_default.nudge(BC, centroid, dBC) : BC,
        C,
        dCA ? src_default.nudge(CA, centroid, dCA) : CA
    ];
});
__publicField3(PolygonUtils, "getStarVertices", function(center, size, sides, param) {
    var ratio = param === void 0 ? 1 : param;
    var outer = src_default.div(size, 2);
    var inner = src_default.mul(outer, ratio / 2);
    var step = PI2 / sides / 2;
    return Array.from(Array(sides * 2)).map(function(_15, i) {
        var theta = -TAU + i * step;
        var ref = _slicedToArray(i % 2 ? inner : outer, 2), rx = ref[0], ry = ref[1];
        return src_default.add(center, [
            rx * Math.cos(theta),
            ry * Math.sin(theta)
        ]);
    });
});
var SvgPathUtils = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        _classCallCheck(this, _class);
    }
    _createClass(_class, null, [
        {
            key: "getCurvedPathForPolygon",
            value: function getCurvedPathForPolygon(points) {
                if (points.length < 3) {
                    return "M -4, 0\n      a 4,4 0 1,0 8,0\n      a 4,4 0 1,0 -8,0";
                }
                var d = [
                    "M"
                ].concat(_toConsumableArray(points[0].slice(0, 2)), [
                    "Q"
                ]);
                var len = points.length;
                for(var i = 1; i < len; i++){
                    var _i = _slicedToArray(points[i], 2), x0 = _i[0], y0 = _i[1];
                    var ref = _slicedToArray(points[(i + 1) % len], 2), x1 = ref[0], y1 = ref[1];
                    d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
                }
                d.push("Z");
                return d.join(" ");
            }
        },
        {
            key: "getCurvedPathForPoints",
            value: function getCurvedPathForPoints(points) {
                if (points.length < 3) {
                    return "M -4, 0\n      a 4,4 0 1,0 8,0\n      a 4,4 0 1,0 -8,0";
                }
                var d = [
                    "M"
                ].concat(_toConsumableArray(points[0].slice(0, 2)), [
                    "Q"
                ]);
                var len = points.length;
                for(var i = 1; i < len - 1; i++){
                    var _i = _slicedToArray(points[i], 2), x0 = _i[0], y0 = _i[1];
                    var ref = _slicedToArray(points[i + 1], 2), x1 = ref[0], y1 = ref[1];
                    d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
                }
                return d.join(" ");
            }
        }
    ]);
    return _class;
}();
function deepCopy(target) {
    if (target === null) {
        return target;
    }
    if (_instanceof(target, Date)) {
        return new Date(target.getTime());
    }
    if (typeof target === "object") {
        if (typeof target[Symbol.iterator] === "function") {
            var cp = [];
            if (target.length > 0) {
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = target[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var arrayMember = _step.value;
                        cp.push(deepCopy(arrayMember));
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally{
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                            _iterator.return();
                        }
                    } finally{
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
            return cp;
        } else {
            var targetKeys = Object.keys(target);
            var cp1 = {
            };
            if (targetKeys.length > 0) {
                var _iteratorNormalCompletion1 = true, _didIteratorError1 = false, _iteratorError1 = undefined;
                try {
                    for(var _iterator1 = targetKeys[Symbol.iterator](), _step1; !(_iteratorNormalCompletion1 = (_step1 = _iterator1.next()).done); _iteratorNormalCompletion1 = true){
                        var key = _step1.value;
                        cp1[key] = deepCopy(target[key]);
                    }
                } catch (err) {
                    _didIteratorError1 = true;
                    _iteratorError1 = err;
                } finally{
                    try {
                        if (!_iteratorNormalCompletion1 && _iterator1.return != null) {
                            _iterator1.return();
                        }
                    } finally{
                        if (_didIteratorError1) {
                            throw _iteratorError1;
                        }
                    }
                }
            }
            return cp1;
        }
    }
    return target;
}
function modulate(value, rangeA, rangeB, param) {
    var clamp2 = param === void 0 ? false : param;
    var _rangeA = _slicedToArray(rangeA, 2), fromLow = _rangeA[0], fromHigh = _rangeA[1];
    var _rangeB = _slicedToArray(rangeB, 2), v0 = _rangeB[0], v1 = _rangeB[1];
    var result = v0 + (value - fromLow) / (fromHigh - fromLow) * (v1 - v0);
    return clamp2 ? v0 < v1 ? Math.max(Math.min(result, v1), v0) : Math.max(Math.min(result, v0), v1) : result;
}
function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
        if (file) {
            var reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function() {
                return resolve(reader.result);
            };
            reader.onerror = function(error) {
                return reject(error);
            };
            reader.onabort = function(error) {
                return reject(error);
            };
        }
    });
}
function getSizeFromSrc(dataURL) {
    return new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
            return resolve([
                img.width,
                img.height
            ]);
        };
        img.src = dataURL;
    });
}
function getFirstFromSet(set4) {
    return set4.values().next().value;
}
var _TextUtils = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        _classCallCheck(this, _class);
    }
    _createClass(_class, null, [
        {
            key: "insertTextFirefox",
            value: function insertTextFirefox(field, text) {
                field.setRangeText(text, field.selectionStart || 0, field.selectionEnd || 0, "end");
                field.dispatchEvent(new InputEvent("input", {
                    data: text,
                    inputType: "insertText",
                    isComposing: false
                }));
            }
        },
        {
            key: "insert",
            value: function insert(field, text) {
                var document2 = field.ownerDocument;
                var initialFocus = document2.activeElement;
                if (initialFocus !== field) {
                    field.focus();
                }
                if (!document2.execCommand("insertText", false, text)) {
                    _TextUtils.insertTextFirefox(field, text);
                }
                if (initialFocus === document2.body) {
                    field.blur();
                } else if (_instanceof(initialFocus, HTMLElement) && initialFocus !== field) {
                    initialFocus.focus();
                }
            }
        },
        {
            key: "set",
            value: function set(field, text) {
                field.select();
                _TextUtils.insert(field, text);
            }
        },
        {
            key: "getSelection",
            value: function getSelection(field) {
                var selectionStart = field.selectionStart, selectionEnd = field.selectionEnd;
                return field.value.slice(selectionStart ? selectionStart : void 0, selectionEnd ? selectionEnd : void 0);
            }
        },
        {
            key: "wrapSelection",
            value: function wrapSelection(field, wrap, wrapEnd) {
                var selectionStart = field.selectionStart, selectionEnd = field.selectionEnd;
                var selection = _TextUtils.getSelection(field);
                _TextUtils.insert(field, wrap + selection + (wrapEnd != null ? wrapEnd : wrap));
                field.selectionStart = (selectionStart || 0) + wrap.length;
                field.selectionEnd = (selectionEnd || 0) + wrap.length;
            }
        },
        {
            key: "replace",
            value: function replace(field, searchValue, replacer) {
                var drift = 0;
                field.value.replace(searchValue, function() {
                    for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                        args[_key] = arguments[_key];
                    }
                    var matchStart = drift + args[args.length - 2];
                    var matchLength = args[0].length;
                    field.selectionStart = matchStart;
                    field.selectionEnd = matchStart + matchLength;
                    var replacement = typeof replacer === "string" ? replacer : replacer.apply(void 0, _toConsumableArray(args));
                    _TextUtils.insert(field, replacement);
                    field.selectionStart = matchStart;
                    drift += replacement.length - matchLength;
                    return replacement;
                });
            }
        },
        {
            key: "findLineEnd",
            value: function findLineEnd(value, currentEnd) {
                var lastLineStart = value.lastIndexOf("\n", currentEnd - 1) + 1;
                if (value.charAt(lastLineStart) !== "\t") {
                    return currentEnd;
                }
                return lastLineStart + 1;
            }
        },
        {
            key: "indent",
            value: function indent(element) {
                var _a2;
                var selectionStart = element.selectionStart, selectionEnd = element.selectionEnd, value = element.value;
                var selectedContrast = value.slice(selectionStart, selectionEnd);
                var lineBreakCount = (_a2 = /\n/g.exec(selectedContrast)) == null ? void 0 : _a2.length;
                if (lineBreakCount && lineBreakCount > 0) {
                    var firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
                    var newSelection = element.value.slice(firstLineStart, selectionEnd - 1);
                    var indentedText = newSelection.replace(/^|\n/g, "$&".concat(_TextUtils.INDENT));
                    var replacementsCount = indentedText.length - newSelection.length;
                    element.setSelectionRange(firstLineStart, selectionEnd - 1);
                    _TextUtils.insert(element, indentedText);
                    element.setSelectionRange(selectionStart + 1, selectionEnd + replacementsCount);
                } else {
                    _TextUtils.insert(element, _TextUtils.INDENT);
                }
            }
        },
        {
            key: "unindent",
            value: function unindent(element) {
                var selectionStart = element.selectionStart, selectionEnd = element.selectionEnd, value = element.value;
                var firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
                var minimumSelectionEnd = _TextUtils.findLineEnd(value, selectionEnd);
                var newSelection = element.value.slice(firstLineStart, minimumSelectionEnd);
                var indentedText = newSelection.replace(/(^|\n)(\t| {1,2})/g, "$1");
                var replacementsCount = newSelection.length - indentedText.length;
                element.setSelectionRange(firstLineStart, minimumSelectionEnd);
                _TextUtils.insert(element, indentedText);
                var firstLineIndentation = /\t| {1,2}/.exec(value.slice(firstLineStart, selectionStart));
                var difference = firstLineIndentation ? firstLineIndentation[0].length : 0;
                var newSelectionStart = selectionStart - difference;
                element.setSelectionRange(selectionStart - difference, Math.max(newSelectionStart, selectionEnd - replacementsCount));
            }
        },
        {
            key: "normalizeText",
            value: function normalizeText(text) {
                return text.replace(_TextUtils.fixNewLines, "\n");
            }
        }
    ]);
    return _class;
}();
var TextUtils = _TextUtils;
__publicField3(TextUtils, "fixNewLines", /\r?\n|\r/g);
__publicField3(TextUtils, "INDENT", "  ");
function uniqueId() {
    return nanoid();
}
function lerp(a2, b, t) {
    return a2 + (b - a2) * t;
}
var TLShape1 = /*#__PURE__*/ function() {
    "use strict";
    function _class(props) {
        var _this = this;
        _classCallCheck(this, _class);
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
        __publicField3(this, "lastSerialized", {
        });
        __publicField3(this, "getCenter", function() {
            return BoundsUtils.getBoundsCenter(_this.bounds);
        });
        __publicField3(this, "getRotatedBounds", function() {
            var bounds = _this.bounds, rotation = _this.props.rotation;
            if (!rotation) return bounds;
            return BoundsUtils.getBoundsFromPoints(BoundsUtils.getRotatedCorners(bounds, rotation));
        });
        __publicField3(this, "hitTestPoint", function(point) {
            var ownBounds = _this.rotatedBounds;
            if (!_this.props.rotation) {
                return PointUtils.pointInBounds(point, ownBounds);
            }
            var corners = BoundsUtils.getRotatedCorners(ownBounds, _this.props.rotation);
            return PointUtils.pointInPolygon(point, corners);
        });
        __publicField3(this, "hitTestLineSegment", function(A, B) {
            var box2 = BoundsUtils.getBoundsFromPoints([
                A,
                B
            ]);
            var rotatedBounds = _this.rotatedBounds, _props = _this.props, _rotation = _props.rotation, rotation = _rotation === void 0 ? 0 : _rotation;
            return BoundsUtils.boundsContain(rotatedBounds, box2) || rotation ? intersectLineSegmentPolyline(A, B, BoundsUtils.getRotatedCorners(_this.bounds)).didIntersect : intersectLineSegmentBounds(A, B, rotatedBounds).length > 0;
        });
        __publicField3(this, "hitTestBounds", function(bounds) {
            var rotatedBounds = _this.rotatedBounds, _props = _this.props, _rotation = _props.rotation, rotation = _rotation === void 0 ? 0 : _rotation;
            var corners = BoundsUtils.getRotatedCorners(_this.bounds, rotation);
            return BoundsUtils.boundsContain(bounds, rotatedBounds) || intersectPolygonBounds(corners, bounds).length > 0;
        });
        __publicField3(this, "getSerialized", function() {
            return toJS(__spreadProps2(__spreadValues2({
            }, _this.props), {
                type: _this.type,
                nonce: _this.nonce
            }));
        });
        __publicField3(this, "getCachedSerialized", function() {
            if (_this.isDirty || Object.keys(_this.lastSerialized).length === 0) {
                _this.nonce++;
                _this.isDirty = false;
                _this.lastSerialized = _this.getSerialized();
            }
            return _this.lastSerialized;
        });
        __publicField3(this, "validateProps", function(props2) {
            return props2;
        });
        __publicField3(this, "update", function(props2, param) {
            var isDeserializing = param === void 0 ? false : param;
            if (!(isDeserializing || _this.isDirty)) _this.isDirty = true;
            Object.assign(_this.props, _this.validateProps(props2));
            return _this;
        });
        __publicField3(this, "clone", function() {
            return new _this.constructor(_this.serialized);
        });
        __publicField3(this, "onResetBounds", function(info) {
            return _this;
        });
        __publicField3(this, "scale", [
            1,
            1
        ]);
        __publicField3(this, "onResizeStart", function(info) {
            var _a3;
            _this.scale = _toConsumableArray((_a3 = _this.props.scale) != null ? _a3 : [
                1,
                1
            ]);
            return _this;
        });
        __publicField3(this, "onResize", function(initialProps, info) {
            var bounds = info.bounds, rotation = info.rotation, _scale = _slicedToArray(info.scale, 2), scaleX = _scale[0], scaleY = _scale[1];
            var nextScale = _toConsumableArray(_this.scale);
            if (scaleX < 0) nextScale[0] *= -1;
            if (scaleY < 0) nextScale[1] *= -1;
            _this.update({
                point: [
                    bounds.minX,
                    bounds.minY
                ],
                scale: nextScale,
                rotation: rotation
            });
            return _this;
        });
        __publicField3(this, "onHandleChange", function(initialShape, param) {
            var index = param.index, delta = param.delta;
            if (initialShape.handles === void 0) return;
            var nextHandles = _toConsumableArray(initialShape.handles);
            nextHandles[index] = __spreadProps2(__spreadValues2({
            }, nextHandles[index]), {
                point: src_default.add(delta, initialShape.handles[index].point)
            });
            var topLeft = BoundsUtils.getCommonTopLeft(nextHandles.map(function(h) {
                return h.point;
            }));
            _this.update({
                point: src_default.add(initialShape.point, topLeft),
                handles: nextHandles.map(function(h) {
                    return __spreadProps2(__spreadValues2({
                    }, h), {
                        point: src_default.sub(h.point, topLeft)
                    });
                })
            });
        });
        var _a2;
        var type = this.constructor["id"];
        var defaultProps = (_a2 = this.constructor["defaultProps"]) != null ? _a2 : {
        };
        this.type = type;
        this.props = __spreadValues2(__spreadValues2({
            scale: [
                1,
                1
            ]
        }, defaultProps), props);
        makeObservable(this);
    }
    _createClass(_class, [
        {
            key: "id",
            get: function get() {
                return this.props.id;
            }
        },
        {
            key: "center",
            get: function get() {
                return this.getCenter();
            }
        },
        {
            key: "bounds",
            get: function get() {
                return this.getBounds();
            }
        },
        {
            key: "rotatedBounds",
            get: function get() {
                return this.getRotatedBounds();
            }
        },
        {
            key: "serialized",
            get: function get() {
                return this.getCachedSerialized();
            }
        }
    ]);
    return _class;
}();
__publicField3(TLShape1, "type");
__decorateClass2([
    observable
], TLShape1.prototype, "props", 2);
__decorateClass2([
    computed
], TLShape1.prototype, "id", 1);
__decorateClass2([
    computed
], TLShape1.prototype, "center", 1);
__decorateClass2([
    computed
], TLShape1.prototype, "bounds", 1);
__decorateClass2([
    computed
], TLShape1.prototype, "rotatedBounds", 1);
__decorateClass2([
    action
], TLShape1.prototype, "update", 2);
var TLBoxShape1 = /*#__PURE__*/ function(TLShape) {
    "use strict";
    _inherits(_class, TLShape);
    var _super = _createSuper(_class);
    function _class(param) {
        var props = param === void 0 ? {
        } : param;
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call(this, props);
        __publicField3(_assertThisInitialized(_this), "getBounds", function() {
            var _point = _slicedToArray(_this.props.point, 2), x = _point[0], y = _point[1];
            var _size = _slicedToArray(_this.props.size, 2), width = _size[0], height = _size[1];
            return {
                minX: x,
                minY: y,
                maxX: x + width,
                maxY: y + height,
                width: width,
                height: height
            };
        });
        __publicField3(_assertThisInitialized(_this), "getRotatedBounds", function() {
            return BoundsUtils.getBoundsFromPoints(BoundsUtils.getRotatedCorners(_this.bounds, _this.props.rotation));
        });
        __publicField3(_assertThisInitialized(_this), "onResize", function(initialProps, info) {
            var bounds = info.bounds, rotation = info.rotation, _scale = _slicedToArray(info.scale, 2), scaleX = _scale[0], scaleY = _scale[1];
            var nextScale = _toConsumableArray(_this.scale);
            if (scaleX < 0) nextScale[0] *= -1;
            if (scaleY < 0) nextScale[1] *= -1;
            _this.update({
                point: [
                    bounds.minX,
                    bounds.minY
                ],
                scale: nextScale,
                rotation: rotation
            });
            return _this.update({
                point: [
                    bounds.minX,
                    bounds.minY
                ],
                size: [
                    Math.max(1, bounds.width),
                    Math.max(1, bounds.height)
                ],
                scale: nextScale
            });
        });
        __publicField3(_assertThisInitialized(_this), "validateProps", function(props2) {
            if (props2.size !== void 0) {
                props2.size[0] = Math.max(props2.size[0], 1);
                props2.size[1] = Math.max(props2.size[1], 1);
            }
            return props2;
        });
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    return _class;
}(TLShape1);
__publicField3(TLBoxShape1, "id", "box");
__publicField3(TLBoxShape1, "defaultProps", {
    id: "box",
    type: "box",
    parentId: "page",
    point: [
        0,
        0
    ],
    size: [
        100,
        100
    ]
});
var TLDrawShape1 = /*#__PURE__*/ function(TLShape) {
    "use strict";
    _inherits(_class, TLShape);
    var _super = _createSuper(_class);
    function _class(param) {
        var props = param === void 0 ? {
        } : param;
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call(this, props);
        __publicField3(_assertThisInitialized(_this), "getBounds", function() {
            var ref = _assertThisInitialized(_this), pointBounds = ref.pointBounds, point = ref.props.point;
            return BoundsUtils.translateBounds(pointBounds, point);
        });
        __publicField3(_assertThisInitialized(_this), "getRotatedBounds", function() {
            var ref = _assertThisInitialized(_this), _props = ref.props, rotation = _props.rotation, point = _props.point, bounds = ref.bounds, rotatedPoints = ref.rotatedPoints;
            if (!rotation) return bounds;
            return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedPoints), point);
        });
        __publicField3(_assertThisInitialized(_this), "normalizedPoints", []);
        __publicField3(_assertThisInitialized(_this), "isResizeFlippedX", false);
        __publicField3(_assertThisInitialized(_this), "isResizeFlippedY", false);
        __publicField3(_assertThisInitialized(_this), "onResizeStart", function() {
            var _a2;
            var ref = _assertThisInitialized(_this), bounds = ref.bounds, points = ref.props.points;
            _this.scale = _toConsumableArray((_a2 = _this.props.scale) != null ? _a2 : [
                1,
                1
            ]);
            var size = [
                bounds.width,
                bounds.height
            ];
            _this.normalizedPoints = points.map(function(point) {
                return Vec.divV(point, size);
            });
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "onResize", function(initialProps, info) {
            var bounds = info.bounds, _scale = _slicedToArray(info.scale, 2), scaleX = _scale[0], scaleY = _scale[1];
            var size = [
                bounds.width,
                bounds.height
            ];
            var nextScale = _toConsumableArray(_this.scale);
            if (scaleX < 0) nextScale[0] *= -1;
            if (scaleY < 0) nextScale[1] *= -1;
            return _this.update(scaleX || scaleY ? {
                point: [
                    bounds.minX,
                    bounds.minY
                ],
                points: _this.normalizedPoints.map(function(point) {
                    return Vec.mulV(point, size).concat(point[2]);
                }),
                scale: nextScale
            } : {
                point: [
                    bounds.minX,
                    bounds.minY
                ],
                points: _this.normalizedPoints.map(function(point) {
                    return Vec.mulV(point, size).concat(point[2]);
                })
            });
        });
        __publicField3(_assertThisInitialized(_this), "hitTestPoint", function(point) {
            var ref = _assertThisInitialized(_this), _props = ref.props, points = _props.points, ownPoint = _props.point;
            return PointUtils.pointNearToPolyline(Vec.sub(point, ownPoint), points);
        });
        __publicField3(_assertThisInitialized(_this), "hitTestLineSegment", function(A, B) {
            var ref = _assertThisInitialized(_this), bounds = ref.bounds, _props = ref.props, points = _props.points, point = _props.point;
            if (PointUtils.pointInBounds(A, bounds) || PointUtils.pointInBounds(B, bounds) || intersectBoundsLineSegment(bounds, A, B).length > 0) {
                var rA = Vec.sub(A, point);
                var rB = Vec.sub(B, point);
                return intersectLineSegmentPolyline(rA, rB, points).didIntersect || !!points.find(function(point2) {
                    return Vec.dist(rA, point2) < 5 || Vec.dist(rB, point2) < 5;
                });
            }
            return false;
        });
        __publicField3(_assertThisInitialized(_this), "hitTestBounds", function(bounds) {
            var ref = _assertThisInitialized(_this), rotatedBounds = ref.rotatedBounds, _props = ref.props, points = _props.points, point = _props.point;
            var oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(point));
            return BoundsUtils.boundsContain(bounds, rotatedBounds) || points.every(function(vert) {
                return PointUtils.pointInBounds(vert, oBounds);
            }) || BoundsUtils.boundsCollide(bounds, rotatedBounds) && intersectPolylineBounds(points, oBounds).length > 0;
        });
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    _createClass(_class, [
        {
            key: "pointBounds",
            get: function get() {
                var ref = this, points = ref.props.points;
                return BoundsUtils.getBoundsFromPoints(points);
            }
        },
        {
            key: "rotatedPoints",
            get: function get() {
                var ref = this, _props = ref.props, point = _props.point, points = _props.points, rotation = _props.rotation, center = ref.center;
                if (!rotation) return points;
                var relativeCenter = Vec.sub(center, point);
                return points.map(function(point2) {
                    return Vec.rotWith(point2, relativeCenter, rotation);
                });
            }
        }
    ]);
    return _class;
}(TLShape1);
__publicField3(TLDrawShape1, "id", "draw");
__publicField3(TLDrawShape1, "defaultProps", {
    id: "draw",
    type: "draw",
    parentId: "page",
    point: [
        0,
        0
    ],
    points: [],
    isComplete: false
});
__decorateClass2([
    computed
], TLDrawShape1.prototype, "pointBounds", 1);
__decorateClass2([
    computed
], TLDrawShape1.prototype, "rotatedPoints", 1);
var TLDotShape1 = /*#__PURE__*/ function(TLShape) {
    "use strict";
    _inherits(_class, TLShape);
    var _super = _createSuper(_class);
    function _class(param) {
        var props = param === void 0 ? {
        } : param;
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call(this, props);
        __publicField3(_assertThisInitialized(_this), "hideSelection", true);
        __publicField3(_assertThisInitialized(_this), "hideResizeHandles", true);
        __publicField3(_assertThisInitialized(_this), "hideRotateHandle", true);
        __publicField3(_assertThisInitialized(_this), "hideSelectionDetail", true);
        __publicField3(_assertThisInitialized(_this), "getBounds", function() {
            var ref = _assertThisInitialized(_this), _props = ref.props, _point = _slicedToArray(_props.point, 2), x = _point[0], y = _point[1], radius = _props.radius;
            return {
                minX: x,
                minY: y,
                maxX: x + radius * 2,
                maxY: y + radius * 2,
                width: radius * 2,
                height: radius * 2
            };
        });
        __publicField3(_assertThisInitialized(_this), "getRotatedBounds", function() {
            return BoundsUtils.getBoundsFromPoints(BoundsUtils.getRotatedCorners(_this.bounds, _this.props.rotation));
        });
        __publicField3(_assertThisInitialized(_this), "onResize", function(initialProps, info) {
            var ref = _assertThisInitialized(_this), radius = ref.props.radius;
            return _this.update({
                point: [
                    info.bounds.minX + info.bounds.width / 2 - radius,
                    info.bounds.minY + info.bounds.height / 2 - radius
                ]
            });
        });
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    return _class;
}(TLShape1);
__publicField3(TLDotShape1, "id", "dot");
__publicField3(TLDotShape1, "defaultProps", {
    id: "dot",
    type: "dot",
    parentId: "page",
    point: [
        0,
        0
    ],
    radius: 6
});
var TLEllipseShape1 = /*#__PURE__*/ function(TLBoxShape) {
    "use strict";
    _inherits(_class, TLBoxShape);
    var _super = _createSuper(_class);
    function _class(param) {
        var props = param === void 0 ? {
        } : param;
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call(this, props);
        __publicField3(_assertThisInitialized(_this), "getBounds", function() {
            var ref = _assertThisInitialized(_this), _props = ref.props, _point = _slicedToArray(_props.point, 2), x = _point[0], y = _point[1], _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1];
            return BoundsUtils.getRotatedEllipseBounds(x, y, w / 2, h / 2, 0);
        });
        __publicField3(_assertThisInitialized(_this), "getRotatedBounds", function() {
            var ref = _assertThisInitialized(_this), _props = ref.props, _point = _slicedToArray(_props.point, 2), x = _point[0], y = _point[1], _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1], rotation = _props.rotation;
            return BoundsUtils.getRotatedEllipseBounds(x, y, w / 2, h / 2, rotation);
        });
        __publicField3(_assertThisInitialized(_this), "hitTestPoint", function(point) {
            var ref = _assertThisInitialized(_this), _props = ref.props, size = _props.size, rotation = _props.rotation, center = ref.center;
            return PointUtils.pointInEllipse(point, center, size[0], size[1], rotation || 0);
        });
        __publicField3(_assertThisInitialized(_this), "hitTestLineSegment", function(A, B) {
            var ref = _assertThisInitialized(_this), _props = ref.props, _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1], _rotation = _props.rotation, rotation = _rotation === void 0 ? 0 : _rotation, center = ref.center;
            return intersectLineSegmentEllipse(A, B, center, w, h, rotation).didIntersect;
        });
        __publicField3(_assertThisInitialized(_this), "hitTestBounds", function(bounds) {
            var ref = _assertThisInitialized(_this), _props = ref.props, _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1], _rotation = _props.rotation, rotation = _rotation === void 0 ? 0 : _rotation, rotatedBounds = ref.rotatedBounds;
            return BoundsUtils.boundsContain(bounds, rotatedBounds) || intersectEllipseBounds(_this.center, w / 2, h / 2, rotation, bounds).length > 0;
        });
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    return _class;
}(TLBoxShape1);
__publicField3(TLEllipseShape1, "id", "ellipse");
__publicField3(TLEllipseShape1, "defaultProps", {
    id: "ellipse",
    type: "ellipse",
    parentId: "page",
    point: [
        0,
        0
    ],
    size: [
        100,
        100
    ]
});
var TLImageShape1 = /*#__PURE__*/ function(TLBoxShape) {
    "use strict";
    _inherits(_class, TLBoxShape);
    var _super = _createSuper(_class);
    function _class(param) {
        var props = param === void 0 ? {
        } : param;
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call(this, props);
        __publicField3(_assertThisInitialized(_this), "onResetBounds", function(info) {
            var _props = _this.props, clipping = _props.clipping, size = _props.size, point = _props.point;
            if (clipping) {
                var ref = _slicedToArray(Array.isArray(clipping) ? clipping : [
                    clipping,
                    clipping,
                    clipping,
                    clipping
                ], 4), t = ref[0], r = ref[1], b = ref[2], l2 = ref[3];
                return _this.update({
                    clipping: 0,
                    point: [
                        point[0] - l2,
                        point[1] - t
                    ],
                    size: [
                        size[0] + (l2 - r),
                        size[1] + (t - b)
                    ]
                });
            } else if (info.asset) {
                var _asset = info.asset, _size = _slicedToArray(_asset.size, 2), w = _size[0], h = _size[1];
                _this.update({
                    clipping: 0,
                    point: [
                        point[0] + size[0] / 2 - w / 2,
                        point[1] + size[1] / 2 - h / 2
                    ],
                    size: [
                        w,
                        h
                    ]
                });
            }
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "onResize", function(initialProps, info) {
            var bounds = info.bounds, clip = info.clip, scale = info.scale;
            var clipping = _this.props.clipping;
            var iClipping = initialProps.clipping;
            if (clip) {
                var _point = _slicedToArray(initialProps.point, 2), x = _point[0], y = _point[1], _size = _slicedToArray(initialProps.size, 2), w = _size[0], h = _size[1];
                var ref = _slicedToArray(iClipping ? Array.isArray(iClipping) ? iClipping : [
                    iClipping,
                    iClipping,
                    iClipping,
                    iClipping
                ] : [
                    0,
                    0,
                    0,
                    0
                ], 4), t = ref[0], r = ref[1], b = ref[2], l2 = ref[3];
                clipping = [
                    t + (bounds.minY - y),
                    r + (bounds.maxX - (x + w)),
                    b + (bounds.maxY - (y + h)),
                    l2 + (bounds.minX - x)
                ];
            } else {
                if (iClipping !== void 0) {
                    clipping = Array.isArray(iClipping) ? iClipping : [
                        iClipping,
                        iClipping,
                        iClipping,
                        iClipping
                    ];
                    clipping = [
                        clipping[0] * scale[1],
                        clipping[1] * scale[0],
                        clipping[2] * scale[1],
                        clipping[3] * scale[0]
                    ];
                }
            }
            if (clipping && Array.isArray(clipping)) {
                var c = clipping;
                if (c.every(function(v, i) {
                    return i === 0 || v === c[i - 1];
                })) {
                    clipping = c[0];
                }
            }
            return _this.update({
                point: [
                    bounds.minX,
                    bounds.minY
                ],
                size: [
                    Math.max(1, bounds.width),
                    Math.max(1, bounds.height)
                ],
                clipping: clipping
            });
        });
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    return _class;
}(TLBoxShape1);
__publicField3(TLImageShape1, "id", "ellipse");
__publicField3(TLImageShape1, "defaultProps", {
    id: "ellipse",
    type: "ellipse",
    parentId: "page",
    point: [
        0,
        0
    ],
    size: [
        100,
        100
    ],
    clipping: 0,
    objectFit: "none",
    assetId: ""
});
var TLPolylineShape1 = /*#__PURE__*/ function(TLShape) {
    "use strict";
    _inherits(_class, TLShape);
    var _super = _createSuper(_class);
    function _class(param) {
        var props = param === void 0 ? {
        } : param;
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call(this, props);
        __publicField3(_assertThisInitialized(_this), "getBounds", function() {
            var ref = _assertThisInitialized(_this), points = ref.points, point = ref.props.point;
            return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(points), point);
        });
        __publicField3(_assertThisInitialized(_this), "getRotatedBounds", function() {
            var ref = _assertThisInitialized(_this), rotatedPoints = ref.rotatedPoints, point = ref.props.point;
            return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedPoints), point);
        });
        __publicField3(_assertThisInitialized(_this), "normalizedHandles", []);
        __publicField3(_assertThisInitialized(_this), "onResizeStart", function() {
            var _a2;
            var ref = _assertThisInitialized(_this), handles = ref.props.handles, bounds = ref.bounds;
            _this.scale = _toConsumableArray((_a2 = _this.props.scale) != null ? _a2 : [
                1,
                1
            ]);
            var size = [
                bounds.width,
                bounds.height
            ];
            _this.normalizedHandles = handles.map(function(h) {
                return Vec.divV(h.point, size);
            });
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "onResize", function(initialProps, info) {
            var bounds = info.bounds, _scale = _slicedToArray(info.scale, 2), scaleX = _scale[0], scaleY = _scale[1];
            var ref = _assertThisInitialized(_this), handles = ref.props.handles, normalizedHandles = ref.normalizedHandles;
            var size = [
                bounds.width,
                bounds.height
            ];
            var nextScale = _toConsumableArray(_this.scale);
            if (scaleX < 0) nextScale[0] *= -1;
            if (scaleY < 0) nextScale[1] *= -1;
            return _this.update({
                point: [
                    bounds.minX,
                    bounds.minY
                ],
                handles: handles.map(function(handle, i) {
                    return __spreadProps2(__spreadValues2({
                    }, handle), {
                        point: Vec.mulV(normalizedHandles[i], size)
                    });
                }),
                scale: nextScale
            });
        });
        __publicField3(_assertThisInitialized(_this), "hitTestPoint", function(point) {
            var points = _assertThisInitialized(_this).points;
            return PointUtils.pointNearToPolyline(Vec.sub(point, _this.props.point), points);
        });
        __publicField3(_assertThisInitialized(_this), "hitTestLineSegment", function(A, B) {
            var ref = _assertThisInitialized(_this), bounds = ref.bounds, points = ref.points, point = ref.props.point;
            if (PointUtils.pointInBounds(A, bounds) || PointUtils.pointInBounds(B, bounds) || intersectBoundsLineSegment(bounds, A, B).length > 0) {
                var rA = Vec.sub(A, point);
                var rB = Vec.sub(B, point);
                return intersectLineSegmentPolyline(rA, rB, points).didIntersect || !!points.find(function(point2) {
                    return Vec.dist(rA, point2) < 5 || Vec.dist(rB, point2) < 5;
                });
            }
            return false;
        });
        __publicField3(_assertThisInitialized(_this), "hitTestBounds", function(bounds) {
            var ref = _assertThisInitialized(_this), rotatedBounds = ref.rotatedBounds, points = ref.points, point = ref.props.point;
            var oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(point));
            return BoundsUtils.boundsContain(bounds, rotatedBounds) || points.every(function(vert) {
                return PointUtils.pointInBounds(vert, oBounds);
            }) || BoundsUtils.boundsCollide(bounds, rotatedBounds) && intersectPolylineBounds(points, oBounds).length > 0;
        });
        __publicField3(_assertThisInitialized(_this), "validateProps", function(props2) {
            if (props2.point) props2.point = [
                0,
                0
            ];
            if (props2.handles !== void 0 && props2.handles.length < 1) props2.handles = [
                {
                    point: [
                        0,
                        0
                    ]
                }
            ];
            return props2;
        });
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    _createClass(_class, [
        {
            key: "points",
            get: function get() {
                return this.props.handles.map(function(h) {
                    return h.point;
                });
            }
        },
        {
            key: "centroid",
            get: function get() {
                var points = this.points;
                return PolygonUtils.getPolygonCentroid(points);
            }
        },
        {
            key: "rotatedPoints",
            get: function get() {
                var ref = this, centroid = ref.centroid, _props = ref.props, handles = _props.handles, rotation = _props.rotation;
                if (!rotation) return this.points;
                return handles.map(function(h) {
                    return Vec.rotWith(h.point, centroid, rotation);
                });
            }
        }
    ]);
    return _class;
}(TLShape1);
__publicField3(TLPolylineShape1, "id", "polyline");
__publicField3(TLPolylineShape1, "defaultProps", {
    id: "polyline",
    type: "polyline",
    parentId: "page",
    point: [
        0,
        0
    ],
    handles: [
        {
            id: "0",
            point: [
                0,
                0
            ]
        }
    ]
});
__decorateClass2([
    computed
], TLPolylineShape1.prototype, "points", 1);
__decorateClass2([
    computed
], TLPolylineShape1.prototype, "centroid", 1);
__decorateClass2([
    computed
], TLPolylineShape1.prototype, "rotatedPoints", 1);
var TLLineShape1 = /*#__PURE__*/ function(TLPolylineShape) {
    "use strict";
    _inherits(_class, TLPolylineShape);
    var _super = _createSuper(_class);
    function _class(param) {
        var props = param === void 0 ? {
        } : param;
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call(this, props);
        __publicField3(_assertThisInitialized(_this), "validateProps", function(props2) {
            if (props2.point) props2.point = [
                0,
                0
            ];
            if (props2.handles !== void 0 && props2.handles.length < 1) props2.handles = [
                {
                    point: [
                        0,
                        0
                    ]
                }
            ];
            return props2;
        });
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    return _class;
}(TLPolylineShape1);
__publicField3(TLLineShape1, "id", "line");
__publicField3(TLLineShape1, "defaultProps", {
    id: "line",
    type: "line",
    parentId: "page",
    point: [
        0,
        0
    ],
    handles: [
        {
            id: "start",
            point: [
                0,
                0
            ]
        },
        {
            id: "end",
            point: [
                1,
                1
            ]
        }
    ]
});
var TLPolygonShape1 = /*#__PURE__*/ function(TLBoxShape) {
    "use strict";
    _inherits(_class, TLBoxShape);
    var _super = _createSuper(_class);
    function _class(param) {
        var props = param === void 0 ? {
        } : param;
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call(this, props);
        __publicField3(_assertThisInitialized(_this), "getRotatedBounds", function() {
            var ref = _assertThisInitialized(_this), rotatedVertices = ref.rotatedVertices, point = ref.props.point, offset = ref.offset;
            return BoundsUtils.translateBounds(BoundsUtils.getBoundsFromPoints(rotatedVertices), Vec.add(point, offset));
        });
        __publicField3(_assertThisInitialized(_this), "hitTestPoint", function(point) {
            var vertices = _assertThisInitialized(_this).vertices;
            return PointUtils.pointInPolygon(Vec.add(point, _this.props.point), vertices);
        });
        __publicField3(_assertThisInitialized(_this), "hitTestLineSegment", function(A, B) {
            var ref = _assertThisInitialized(_this), vertices = ref.vertices, point = ref.props.point;
            return intersectLineSegmentPolyline(Vec.sub(A, point), Vec.sub(B, point), vertices).didIntersect;
        });
        __publicField3(_assertThisInitialized(_this), "hitTestBounds", function(bounds) {
            var ref = _assertThisInitialized(_this), rotatedBounds = ref.rotatedBounds, offset = ref.offset, rotatedVertices = ref.rotatedVertices, point = ref.props.point;
            var oBounds = BoundsUtils.translateBounds(bounds, Vec.neg(Vec.add(point, offset)));
            return BoundsUtils.boundsContain(bounds, rotatedBounds) || rotatedVertices.every(function(vert) {
                return PointUtils.pointInBounds(vert, oBounds);
            }) || intersectPolygonBounds(rotatedVertices, oBounds).length > 0;
        });
        __publicField3(_assertThisInitialized(_this), "validateProps", function(props2) {
            if (props2.point) props2.point = [
                0,
                0
            ];
            if (props2.sides !== void 0 && props2.sides < 3) props2.sides = 3;
            return props2;
        });
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    _createClass(_class, [
        {
            key: "vertices",
            get: function get() {
                return this.getVertices();
            }
        },
        {
            key: "pageVertices",
            get: function get() {
                var ref = this, point = ref.props.point, vertices = ref.vertices;
                return vertices.map(function(vert) {
                    return Vec.add(vert, point);
                });
            }
        },
        {
            key: "centroid",
            get: function get() {
                var vertices = this.vertices;
                return PolygonUtils.getPolygonCentroid(vertices);
            }
        },
        {
            key: "rotatedVertices",
            get: function get() {
                var ref = this, vertices = ref.vertices, centroid = ref.centroid, rotation = ref.props.rotation;
                if (!rotation) return vertices;
                return vertices.map(function(v) {
                    return Vec.rotWith(v, centroid, rotation);
                });
            }
        },
        {
            key: "offset",
            get: function get() {
                var ref = this, _props = ref.props, _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1];
                var center = BoundsUtils.getBoundsCenter(BoundsUtils.getBoundsFromPoints(this.vertices));
                return Vec.sub(Vec.div([
                    w,
                    h
                ], 2), center);
            }
        },
        {
            key: "getVertices",
            value: function getVertices(param) {
                var padding = param === void 0 ? 0 : param;
                var _props = this.props, ratio = _props.ratio, sides = _props.sides, size = _props.size, scale = _props.scale;
                var vertices = sides === 3 ? PolygonUtils.getTriangleVertices(size, padding, ratio) : PolygonUtils.getPolygonVertices(size, sides, padding, ratio);
                return vertices;
            }
        }
    ]);
    return _class;
}(TLBoxShape1);
__publicField3(TLPolygonShape1, "id", "polygon");
__publicField3(TLPolygonShape1, "defaultProps", {
    id: "polygon",
    type: "polygon",
    parentId: "page",
    point: [
        0,
        0
    ],
    size: [
        100,
        100
    ],
    sides: 5,
    ratio: 1,
    isFlippedY: false
});
__decorateClass2([
    computed
], TLPolygonShape1.prototype, "vertices", 1);
__decorateClass2([
    computed
], TLPolygonShape1.prototype, "pageVertices", 1);
__decorateClass2([
    computed
], TLPolygonShape1.prototype, "centroid", 1);
__decorateClass2([
    computed
], TLPolygonShape1.prototype, "rotatedVertices", 1);
__decorateClass2([
    computed
], TLPolygonShape1.prototype, "offset", 1);
var TLStarShape1 = /*#__PURE__*/ function(TLPolygonShape) {
    "use strict";
    _inherits(_class, TLPolygonShape);
    var _super = _createSuper(_class);
    function _class(param) {
        var props = param === void 0 ? {
        } : param;
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call(this, props);
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    _createClass(_class, [
        {
            key: "getVertices",
            value: function getVertices(param) {
                var padding = param === void 0 ? 0 : param;
                var _props = this.props, ratio = _props.ratio, sides = _props.sides, size = _props.size, isFlippedY = _props.isFlippedY;
                var _size = _slicedToArray(size, 2), w = _size[0], h = _size[1];
                var vertices = PolygonUtils.getStarVertices(Vec.div([
                    w,
                    h
                ], 2), [
                    Math.max(1, w - padding),
                    Math.max(1, h - padding)
                ], Math.round(sides), ratio);
                if (isFlippedY) {
                    return vertices.map(function(point) {
                        return [
                            point[0],
                            h - point[1]
                        ];
                    });
                }
                return vertices;
            }
        }
    ]);
    return _class;
}(TLPolygonShape1);
__publicField3(TLStarShape1, "id", "star");
__publicField3(TLStarShape1, "defaultProps", {
    id: "star",
    parentId: "page",
    type: "star",
    point: [
        0,
        0
    ],
    size: [
        100,
        100
    ],
    sides: 3,
    ratio: 1,
    isFlippedY: false
});
var TLTextShape1 = /*#__PURE__*/ function(TLBoxShape) {
    "use strict";
    _inherits(_class, TLBoxShape);
    var _super = _createSuper(_class);
    function _class(param) {
        var props = param === void 0 ? {
        } : param;
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call(this, props);
        __publicField3(_assertThisInitialized(_this), "canEdit", true);
        __publicField3(_assertThisInitialized(_this), "canFlip", false);
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    return _class;
}(TLBoxShape1);
__publicField3(TLTextShape1, "id", "text");
__publicField3(TLTextShape1, "defaultProps", {
    id: "text",
    type: "text",
    parentId: "page",
    isSizeLocked: true,
    point: [
        0,
        0
    ],
    size: [
        16,
        32
    ],
    text: ""
});
var TLRootState1 = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        var _this = this;
        _classCallCheck(this, _class);
        __publicField3(this, "_id");
        __publicField3(this, "_initial");
        __publicField3(this, "_states");
        __publicField3(this, "_isActive", false);
        __publicField3(this, "cursor");
        __publicField3(this, "_disposables", []);
        __publicField3(this, "children", /* @__PURE__ */ new Map([]));
        __publicField3(this, "registerStates", function(stateClasses) {
            var _this1 = _this;
            stateClasses.forEach(function(StateClass) {
                return _this1.children.set(StateClass.id, new StateClass(_this1, _this1));
            });
            return _this;
        });
        __publicField3(this, "deregisterStates", function(states2) {
            var _this2 = _this;
            states2.forEach(function(StateClass) {
                var _a2;
                (_a2 = _this2.children.get(StateClass.id)) == null ? void 0 : _a2.dispose();
                _this2.children.delete(StateClass.id);
            });
            return _this;
        });
        __publicField3(this, "currentState", {
        });
        __publicField3(this, "transition", function(id2, param) {
            var data = param === void 0 ? {
            } : param;
            var _this3 = _this;
            if (_this.children.size === 0) throw Error("Tool ".concat(_this.id, " has no states, cannot transition to ").concat(id2, "."));
            var nextState = _this.children.get(id2);
            var prevState = _this.currentState;
            if (!nextState) throw Error("Could not find a state named ".concat(id2, "."));
            transaction(function() {
                if (_this3.currentState) {
                    prevState._events.onExit(__spreadProps2(__spreadValues2({
                    }, data), {
                        toId: id2
                    }));
                    prevState.dispose();
                    nextState.registerKeyboardShortcuts();
                    _this3.setCurrentState(nextState);
                    _this3._events.onTransition(__spreadProps2(__spreadValues2({
                    }, data), {
                        fromId: prevState.id,
                        toId: id2
                    }));
                    nextState._events.onEnter(__spreadProps2(__spreadValues2({
                    }, data), {
                        fromId: prevState.id
                    }));
                } else {
                    _this3.currentState = nextState;
                    nextState._events.onEnter(__spreadProps2(__spreadValues2({
                    }, data), {
                        fromId: ""
                    }));
                }
            });
            return _this;
        });
        __publicField3(this, "isIn", function(path) {
            var ids = path.split(".").reverse();
            var state = _this;
            while(ids.length > 0){
                var id2 = ids.pop();
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
        __publicField3(this, "isInAny", function() {
            for(var _len = arguments.length, paths = new Array(_len), _key = 0; _key < _len; _key++){
                paths[_key] = arguments[_key];
            }
            return paths.some(_this.isIn);
        });
        __publicField3(this, "forwardEvent", function(eventName) {
            for(var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
                args[_key - 1] = arguments[_key];
            }
            var _a2, _b;
            if ((_b = (_a2 = _this.currentState) == null ? void 0 : _a2._events) == null ? void 0 : _b[eventName]) {
                var _this4 = _this;
                transaction(function() {
                    var __a22;
                    var _a22;
                    return (_a22 = _this4.currentState._events) == null ? void 0 : (__a22 = _a22)[eventName].apply(__a22, _toConsumableArray(args));
                });
            }
        });
        __publicField3(this, "_events", {
            onTransition: function(info) {
                var _a2;
                (_a2 = _this.onTransition) == null ? void 0 : _a2.call(_this, info);
            },
            onEnter: function(info) {
                var _a2;
                _this._isActive = true;
                if (_this.initial) _this.transition(_this.initial, info);
                (_a2 = _this.onEnter) == null ? void 0 : _a2.call(_this, info);
            },
            onExit: function(info) {
                var _a2, _b, _c;
                _this._isActive = false;
                (_b = (_a2 = _this.currentState) == null ? void 0 : _a2.onExit) == null ? void 0 : _b.call(_a2, {
                    toId: "parent"
                });
                (_c = _this.onExit) == null ? void 0 : _c.call(_this, info);
            },
            onWheel: function(info, event) {
                var _a2;
                (_a2 = _this.onWheel) == null ? void 0 : _a2.call(_this, info, event);
                _this.forwardEvent("onWheel", info, event);
            },
            onPointerDown: function(info, event) {
                var _a2;
                (_a2 = _this.onPointerDown) == null ? void 0 : _a2.call(_this, info, event);
                _this.forwardEvent("onPointerDown", info, event);
            },
            onPointerUp: function(info, event) {
                var _a2;
                (_a2 = _this.onPointerUp) == null ? void 0 : _a2.call(_this, info, event);
                _this.forwardEvent("onPointerUp", info, event);
            },
            onPointerMove: function(info, event) {
                var _a2;
                (_a2 = _this.onPointerMove) == null ? void 0 : _a2.call(_this, info, event);
                _this.forwardEvent("onPointerMove", info, event);
            },
            onPointerEnter: function(info, event) {
                var _a2;
                (_a2 = _this.onPointerEnter) == null ? void 0 : _a2.call(_this, info, event);
                _this.forwardEvent("onPointerEnter", info, event);
            },
            onPointerLeave: function(info, event) {
                var _a2;
                (_a2 = _this.onPointerLeave) == null ? void 0 : _a2.call(_this, info, event);
                _this.forwardEvent("onPointerLeave", info, event);
            },
            onDoubleClick: function(info, event) {
                var _a2;
                (_a2 = _this.onDoubleClick) == null ? void 0 : _a2.call(_this, info, event);
                _this.forwardEvent("onDoubleClick", info, event);
            },
            onKeyDown: function(info, event) {
                var _a2;
                _this._events.onModifierKey(info, event);
                (_a2 = _this.onKeyDown) == null ? void 0 : _a2.call(_this, info, event);
                _this.forwardEvent("onKeyDown", info, event);
            },
            onKeyUp: function(info, event) {
                var _a2;
                _this._events.onModifierKey(info, event);
                (_a2 = _this.onKeyUp) == null ? void 0 : _a2.call(_this, info, event);
                _this.forwardEvent("onKeyUp", info, event);
            },
            onPinchStart: function(info, event) {
                var _a2;
                (_a2 = _this.onPinchStart) == null ? void 0 : _a2.call(_this, info, event);
                _this.forwardEvent("onPinchStart", info, event);
            },
            onPinch: function(info, event) {
                var _a2;
                (_a2 = _this.onPinch) == null ? void 0 : _a2.call(_this, info, event);
                _this.forwardEvent("onPinch", info, event);
            },
            onPinchEnd: function(info, event) {
                var _a2;
                (_a2 = _this.onPinchEnd) == null ? void 0 : _a2.call(_this, info, event);
                _this.forwardEvent("onPinchEnd", info, event);
            },
            onModifierKey: function(info, event) {
                switch(event.key){
                    case "Shift":
                    case "Alt":
                    case "Ctrl":
                    case "Meta":
                        {
                            _this._events.onPointerMove(info, event);
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
        var id = this.constructor["id"];
        var initial = this.constructor["initial"];
        var states = this.constructor["states"];
        this._id = id;
        this._initial = initial;
        this._states = states;
    }
    _createClass(_class, [
        {
            key: "dispose",
            value: function dispose() {
                this._disposables.forEach(function(disposable) {
                    return disposable();
                });
                return this;
            }
        },
        {
            key: "initial",
            get: function get() {
                return this._initial;
            }
        },
        {
            key: "states",
            get: function get() {
                return this._states;
            }
        },
        {
            key: "id",
            get: function get() {
                return this._id;
            }
        },
        {
            key: "isActive",
            get: function get() {
                return this._isActive;
            }
        },
        {
            key: "ascendants",
            get: function get() {
                return [
                    this
                ];
            }
        },
        {
            key: "descendants",
            get: function get() {
                return Array.from(this.children.values()).flatMap(function(state) {
                    return [
                        state
                    ].concat(_toConsumableArray(state.descendants));
                });
            }
        },
        {
            key: "setCurrentState",
            value: function setCurrentState(state) {
                this.currentState = state;
            }
        }
    ]);
    return _class;
}();
__publicField3(TLRootState1, "id");
__publicField3(TLRootState1, "shortcuts");
__decorateClass2([
    observable
], TLRootState1.prototype, "currentState", 2);
__decorateClass2([
    action
], TLRootState1.prototype, "setCurrentState", 1);
var TLState1 = /*#__PURE__*/ function(TLRootState) {
    "use strict";
    _inherits(_class, TLRootState);
    var _super = _createSuper(_class);
    function _class(parent, root) {
        _classCallCheck(this, _class);
        var _this;
        var _a2, _b;
        _this = _super.call(this);
        __publicField3(_assertThisInitialized(_this), "registerKeyboardShortcuts", function() {
            var __disposables;
            var _a3;
            if (!((_a3 = _this._shortcuts) == null ? void 0 : _a3.length)) return;
            (__disposables = _this._disposables).push.apply(__disposables, _toConsumableArray(_this._shortcuts.map(function(param) {
                var keys = param.keys, fn = param.fn;
                return KeyUtils.registerShortcut(keys, function(event) {
                    if (!_this.isActive) return;
                    fn(_this.root, _assertThisInitialized(_this), event);
                });
            })));
        });
        __publicField3(_assertThisInitialized(_this), "_root");
        __publicField3(_assertThisInitialized(_this), "_parent");
        __publicField3(_assertThisInitialized(_this), "_shortcuts", []);
        __publicField3(_assertThisInitialized(_this), "children", /* @__PURE__ */ new Map([]));
        __publicField3(_assertThisInitialized(_this), "registerStates", function(stateClasses) {
            stateClasses.forEach(function(StateClass) {
                return _this.children.set(StateClass.id, new StateClass(_assertThisInitialized(_this), _this._root));
            });
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "deregisterStates", function(states) {
            states.forEach(function(StateClass) {
                var _a3;
                (_a3 = _this.children.get(StateClass.id)) == null ? void 0 : _a3.dispose();
                _this.children.delete(StateClass.id);
            });
            return _assertThisInitialized(_this);
        });
        _this._parent = parent;
        _this._root = root;
        if (_this.states && _this.states.length > 0) {
            _this.registerStates(_this.states);
            var initialId = (_a2 = _this.initial) != null ? _a2 : _this.states[0].id;
            var state = _this.children.get(initialId);
            if (state) {
                _this.setCurrentState(state);
                (_b = _this.currentState) == null ? void 0 : _b._events.onEnter({
                    fromId: "initial"
                });
            }
        }
        var shortcut = _this.constructor["shortcut"];
        if (shortcut) {
            KeyUtils.registerShortcut(shortcut, function() {
                _this.parent.transition(_this.id);
            });
        }
        var shortcuts = _this.constructor["shortcuts"];
        _this._shortcuts = shortcuts;
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    _createClass(_class, [
        {
            key: "root",
            get: function get() {
                return this._root;
            }
        },
        {
            key: "parent",
            get: function get() {
                return this._parent;
            }
        },
        {
            key: "ascendants",
            get: function get() {
                if (!this.parent) return [
                    this
                ];
                if (!("ascendants" in this.parent)) return [
                    this.parent,
                    this
                ];
                return _toConsumableArray(this.parent.ascendants).concat([
                    this
                ]);
            }
        }
    ]);
    return _class;
}(TLRootState1);
__publicField3(TLState1, "cursor");
var TLTool1 = /*#__PURE__*/ function(TLState) {
    "use strict";
    _inherits(_class, TLState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "isLocked", false);
        __publicField3(_assertThisInitialized(_this), "previous");
        __publicField3(_assertThisInitialized(_this), "onEnter", function(param) {
            var fromId = param.fromId;
            _this.previous = fromId;
            if (_this.cursor) _this.app.cursors.setCursor(_this.cursor);
        });
        __publicField3(_assertThisInitialized(_this), "onTransition", function(info) {
            var toId = info.toId;
            var toState = _this.children.get(toId);
            _this.app.cursors.reset();
            if (toState.cursor) {
                _this.app.cursors.setCursor(toState.cursor);
            } else if (_this.cursor) {
                _this.app.cursors.setCursor(_this.cursor);
            }
        });
        return _this;
    }
    _createClass(_class, [
        {
            key: "app",
            get: function get() {
                return this.root;
            }
        }
    ]);
    return _class;
}(TLState1);
var TLToolState1 = /*#__PURE__*/ function(TLState) {
    "use strict";
    _inherits(_class, TLState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        return _super.apply(this, arguments);
    }
    _createClass(_class, [
        {
            key: "app",
            get: function get() {
                return this.root;
            }
        },
        {
            key: "tool",
            get: function get() {
                return this.parent;
            }
        }
    ]);
    return _class;
}(TLState1);
var CreatingState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "crosshair");
        __publicField3(_assertThisInitialized(_this), "creatingShape");
        __publicField3(_assertThisInitialized(_this), "aspectRatio");
        __publicField3(_assertThisInitialized(_this), "initialBounds", {
        });
        __publicField3(_assertThisInitialized(_this), "onEnter", function() {
            var _app = _this.app, currentPage = _app.currentPage, _inputs = _app.inputs, originPoint = _inputs.originPoint, currentPoint = _inputs.currentPoint;
            var _tool = _this.tool, Shape17 = _tool.Shape;
            var shape = new Shape17({
                id: uniqueId(),
                type: Shape17.id,
                parentId: currentPage.id,
                point: _toConsumableArray(originPoint),
                size: src_default.abs(src_default.sub(currentPoint, originPoint))
            });
            _this.initialBounds = {
                minX: originPoint[0],
                minY: originPoint[1],
                maxX: originPoint[0] + 1,
                maxY: originPoint[1] + 1,
                width: 1,
                height: 1
            };
            if (!shape.canChangeAspectRatio) {
                if (shape.aspectRatio) {
                    _this.aspectRatio = shape.aspectRatio;
                    _this.initialBounds.height = _this.aspectRatio;
                    _this.initialBounds.width = 1;
                } else {
                    _this.aspectRatio = 1;
                    _this.initialBounds.height = 1;
                    _this.initialBounds.width = 1;
                }
                _this.initialBounds.maxY = _this.initialBounds.minY + _this.initialBounds.height;
            }
            _this.creatingShape = shape;
            _this.app.currentPage.addShapes(shape);
            _this.app.setSelectedShapes([
                shape
            ]);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function(info) {
            if (info.order) return;
            if (!_this.creatingShape) throw Error("Expected a creating shape.");
            var initialBounds = _assertThisInitialized(_this).initialBounds;
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, originPoint = _inputs.originPoint, shiftKey = _inputs.shiftKey;
            var bounds = BoundsUtils.getTransformedBoundingBox(initialBounds, "bottom_right_corner", src_default.sub(currentPoint, originPoint), 0, shiftKey || _this.creatingShape.props.isAspectRatioLocked || !_this.creatingShape.canChangeAspectRatio);
            _this.creatingShape.update({
                point: [
                    bounds.minX,
                    bounds.minY
                ],
                size: [
                    bounds.width,
                    bounds.height
                ]
            });
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.tool.transition("idle");
            if (_this.creatingShape) {
                _this.app.setSelectedShapes([
                    _this.creatingShape
                ]);
            }
            if (!_this.app.settings.isToolLocked) {
                _this.app.transition("select");
            }
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        if (!_this.creatingShape) throw Error("Expected a creating shape.");
                        _this.app.deleteShapes([
                            _this.creatingShape
                        ]);
                        _this.tool.transition("idle");
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(CreatingState, "id", "creating");
var IdleState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "onPointerDown", function(info, e) {
            if (info.order) return;
            _this.tool.transition("pointing");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            var __b;
            var _a2, _b;
            _this.app.transition("select", {
                returnTo: "box"
            });
            (_b = (_a2 = _this.app).onPinchStart) == null ? void 0 : (__b = _b).call.apply(__b, [
                _a2
            ].concat(_toConsumableArray(args)));
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        _this.app.transition("select");
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(IdleState, "id", "idle");
var PointingState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, originPoint = _inputs.originPoint;
            if (Vec.dist(currentPoint, originPoint) > 5) {
                _this.tool.transition("creating");
                _this.app.setSelectedShapes(_this.app.currentPage.shapes);
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.tool.transition("idle");
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(PointingState, "id", "pointing");
var TLBoxTool1 = /*#__PURE__*/ function(TLTool) {
    "use strict";
    _inherits(_class, TLTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "crosshair");
        return _this;
    }
    return _class;
}(TLTool1);
__publicField3(TLBoxTool1, "id", "box");
__publicField3(TLBoxTool1, "states", [
    IdleState,
    PointingState,
    CreatingState
]);
__publicField3(TLBoxTool1, "initial", "idle");
var CreatingState2 = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "creatingShape");
        __publicField3(_assertThisInitialized(_this), "offset", [
            0,
            0
        ]);
        __publicField3(_assertThisInitialized(_this), "onEnter", function() {
            var _tool = _this.tool, Shape17 = _tool.Shape;
            _this.offset = [
                Shape17.defaultProps.radius,
                Shape17.defaultProps.radius
            ];
            var shape = new Shape17({
                id: uniqueId(),
                parentId: _this.app.currentPage.id,
                point: src_default.sub(_this.app.inputs.originPoint, _this.offset)
            });
            _this.creatingShape = shape;
            _this.app.currentPage.addShapes(shape);
            _this.app.setSelectedShapes([
                shape
            ]);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            if (!_this.creatingShape) throw Error("Expected a creating shape.");
            var currentPoint = _this.app.inputs.currentPoint;
            _this.creatingShape.update({
                point: src_default.sub(currentPoint, _this.offset)
            });
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.tool.transition("idle");
            if (_this.creatingShape) {
                _this.app.setSelectedShapes([
                    _this.creatingShape
                ]);
            }
            if (!_this.app.settings.isToolLocked) {
                _this.app.transition("select");
            }
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        if (!_this.creatingShape) throw Error("Expected a creating shape.");
                        _this.app.deleteShapes([
                            _this.creatingShape
                        ]);
                        _this.tool.transition("idle");
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(CreatingState2, "id", "creating");
var IdleState2 = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "onPointerDown", function(info, e) {
            if (info.order) return;
            _this.tool.transition("creating");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            var __b;
            var _a2, _b;
            _this.app.transition("select", {
                returnTo: "box"
            });
            (_b = (_a2 = _this.app).onPinchStart) == null ? void 0 : (__b = _b).call.apply(__b, [
                _a2
            ].concat(_toConsumableArray(args)));
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        _this.app.transition("select");
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(IdleState2, "id", "idle");
var TLDotTool1 = /*#__PURE__*/ function(TLTool) {
    "use strict";
    _inherits(_class, TLTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "crosshair");
        return _this;
    }
    return _class;
}(TLTool1);
__publicField3(TLDotTool1, "id", "box");
__publicField3(TLDotTool1, "states", [
    IdleState2,
    CreatingState2
]);
__publicField3(TLDotTool1, "initial", "idle");
var CreatingState3 = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "shape", {
        });
        __publicField3(_assertThisInitialized(_this), "points", [
            [
                0,
                0,
                0.5
            ]
        ]);
        __publicField3(_assertThisInitialized(_this), "onEnter", function() {
            var _a2, _b;
            var _tool = _this.tool, Shape17 = _tool.Shape, previousShape = _tool.previousShape;
            var originPoint = _this.app.inputs.originPoint;
            _this.app.history.pause();
            if (_this.app.inputs.shiftKey && previousShape) {
                _this.shape = previousShape;
                var shape = _assertThisInitialized(_this).shape;
                var prevPoint = shape.props.points[shape.props.points.length - 1];
                var nextPoint = Vec.sub(originPoint, shape.props.point).concat((_a2 = originPoint[2]) != null ? _a2 : 0.5);
                _this.points = _toConsumableArray(shape.props.points).concat([
                    prevPoint,
                    prevPoint
                ]);
                var len = Math.ceil(Vec.dist(prevPoint, originPoint) / 16);
                for(var i = 0, t = i / (len - 1); i < len; i++){
                    _this.points.push(Vec.lrp(prevPoint, nextPoint, t).concat(lerp(prevPoint[2], nextPoint[2], t)));
                }
                _this.addNextPoint(nextPoint);
            } else {
                _this.tool.previousShape = void 0;
                _this.points = [
                    [
                        0,
                        0,
                        (_b = originPoint[2]) != null ? _b : 0.5
                    ]
                ];
                _this.shape = new Shape17({
                    id: uniqueId(),
                    type: Shape17.id,
                    parentId: _this.app.currentPage.id,
                    point: originPoint.slice(0, 2),
                    points: _this.points,
                    isComplete: false
                });
                _this.app.currentPage.addShapes(_this.shape);
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var shape = _assertThisInitialized(_this).shape;
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, previousPoint = _inputs.previousPoint;
            if (Vec.isEqual(previousPoint, currentPoint)) return;
            _this.addNextPoint(Vec.sub(currentPoint, shape.props.point).concat(currentPoint[2]));
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            if (!_this.shape) throw Error("Expected a creating shape.");
            _this.app.history.resume();
            _this.shape.update({
                isComplete: true,
                points: _this.tool.simplify ? PointUtils.simplify2(_this.points, _this.tool.simplifyTolerance) : _this.shape.props.points
            });
            _this.tool.previousShape = _this.shape;
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        if (!_this.shape) throw Error("Expected a creating shape.");
                        _this.app.deleteShapes([
                            _this.shape
                        ]);
                        _this.tool.transition("idle");
                        break;
                    }
            }
        });
        return _this;
    }
    _createClass(_class, [
        {
            key: "addNextPoint",
            value: function addNextPoint(point) {
                var shape = this.shape;
                var offset = Vec.min(point, [
                    0,
                    0
                ]);
                this.points.push(point);
                if (offset[0] < 0 || offset[1] < 0) {
                    this.points = this.points.map(function(pt) {
                        return Vec.sub(pt, offset).concat(pt[2]);
                    });
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
        }
    ]);
    return _class;
}(TLToolState1);
__publicField3(CreatingState3, "id", "creating");
var IdleState3 = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "onPointerDown", function(info, e) {
            if (info.order) return;
            _this.tool.transition("creating");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            var __b;
            var _a2, _b;
            _this.app.transition("select", {
                returnTo: "draw"
            });
            (_b = (_a2 = _this.app._events).onPinchStart) == null ? void 0 : (__b = _b).call.apply(__b, [
                _a2
            ].concat(_toConsumableArray(args)));
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        _this.app.transition("select");
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(IdleState3, "id", "idle");
var TLDrawTool1 = /*#__PURE__*/ function(TLTool) {
    "use strict";
    _inherits(_class, TLTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "crosshair");
        __publicField3(_assertThisInitialized(_this), "simplify", true);
        __publicField3(_assertThisInitialized(_this), "simplifyTolerance", 1);
        __publicField3(_assertThisInitialized(_this), "previousShape");
        return _this;
    }
    return _class;
}(TLTool1);
__publicField3(TLDrawTool1, "id", "draw");
__publicField3(TLDrawTool1, "states", [
    IdleState3,
    CreatingState3
]);
__publicField3(TLDrawTool1, "initial", "idle");
var ErasingState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "points", [
            [
                0,
                0,
                0.5
            ]
        ]);
        __publicField3(_assertThisInitialized(_this), "hitShapes", /* @__PURE__ */ new Set());
        __publicField3(_assertThisInitialized(_this), "onEnter", function() {
            var originPoint = _this.app.inputs.originPoint;
            _this.points = [
                originPoint
            ];
            _this.hitShapes.clear();
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, previousPoint = _inputs.previousPoint;
            if (Vec.isEqual(previousPoint, currentPoint)) return;
            _this.points.push(currentPoint);
            _this.app.shapesInViewport.filter(function(shape) {
                return shape.hitTestLineSegment(previousPoint, currentPoint);
            }).forEach(function(shape) {
                return _this.hitShapes.add(shape);
            });
            _this.app.setErasingShapes(Array.from(_this.hitShapes.values()));
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.app.deleteShapes(Array.from(_this.hitShapes.values()));
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        _this.app.setErasingShapes([]);
                        _this.tool.transition("idle");
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(ErasingState, "id", "erasing");
var IdleState4 = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "onPointerDown", function(info, e) {
            if (info.order) return;
            _this.tool.transition("pointing");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            var __b;
            var _a2, _b;
            _this.app.transition("select", {
                returnTo: "draw"
            });
            (_b = (_a2 = _this.app).onPinchStart) == null ? void 0 : (__b = _b).call.apply(__b, [
                _a2
            ].concat(_toConsumableArray(args)));
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        _this.app.transition("select");
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(IdleState4, "id", "idle");
var PointingState2 = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "onEnter", function() {
            var currentPoint = _this.app.inputs.currentPoint;
            _this.app.setErasingShapes(_this.app.shapesInViewport.filter(function(shape) {
                return shape.hitTestPoint(currentPoint);
            }));
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, originPoint = _inputs.originPoint;
            if (Vec.dist(currentPoint, originPoint) > 5) {
                _this.tool.transition("erasing");
                _this.app.setSelectedShapes([]);
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            var shapesToDelete = _toConsumableArray(_this.app.erasingShapes);
            _this.app.setErasingShapes([]);
            _this.app.deleteShapes(shapesToDelete);
            _this.tool.transition("idle");
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(PointingState2, "id", "pointing");
var TLEraseTool1 = /*#__PURE__*/ function(TLTool) {
    "use strict";
    _inherits(_class, TLTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "crosshair");
        return _this;
    }
    return _class;
}(TLTool1);
__publicField3(TLEraseTool1, "id", "erase");
__publicField3(TLEraseTool1, "states", [
    IdleState4,
    PointingState2,
    ErasingState
]);
__publicField3(TLEraseTool1, "initial", "idle");
var CreatingState4 = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "creatingShape", {
        });
        __publicField3(_assertThisInitialized(_this), "initialShape", {
        });
        __publicField3(_assertThisInitialized(_this), "onEnter", function() {
            var _tool = _this.tool, Shape17 = _tool.Shape;
            var shape = new Shape17({
                id: uniqueId(),
                type: Shape17.id,
                parentId: _this.app.currentPage.id,
                point: _this.app.inputs.originPoint,
                handles: [
                    {
                        point: [
                            0,
                            0
                        ]
                    },
                    {
                        point: [
                            1,
                            1
                        ]
                    }
                ]
            });
            _this.initialShape = toJS(shape.props);
            _this.creatingShape = shape;
            _this.app.currentPage.addShapes(shape);
            _this.app.setSelectedShapes([
                shape
            ]);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _app = _this.app, _inputs = _app.inputs, shiftKey = _inputs.shiftKey, previousPoint = _inputs.previousPoint, originPoint = _inputs.originPoint, currentPoint = _inputs.currentPoint;
            if (src_default.isEqual(previousPoint, currentPoint)) return;
            var delta = src_default.sub(currentPoint, originPoint);
            if (shiftKey) {
                if (Math.abs(delta[0]) < Math.abs(delta[1])) {
                    delta[0] = 0;
                } else {
                    delta[1] = 0;
                }
            }
            var initialShape = _assertThisInitialized(_this).initialShape;
            _this.creatingShape.onHandleChange(initialShape, {
                index: 1,
                delta: delta
            });
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.tool.transition("idle");
            if (_this.creatingShape) {
                _this.app.setSelectedShapes([
                    _this.creatingShape
                ]);
            }
            if (!_this.app.settings.isToolLocked) {
                _this.app.transition("select");
            }
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        _this.app.deleteShapes([
                            _this.creatingShape
                        ]);
                        _this.tool.transition("idle");
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(CreatingState4, "id", "creating");
var IdleState5 = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "onPointerDown", function(info, e) {
            if (info.order) return;
            _this.tool.transition("pointing");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            var __b;
            var _a2, _b;
            _this.app.transition("select", {
                returnTo: "Line"
            });
            (_b = (_a2 = _this.app).onPinchStart) == null ? void 0 : (__b = _b).call.apply(__b, [
                _a2
            ].concat(_toConsumableArray(args)));
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        _this.app.transition("select");
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(IdleState5, "id", "idle");
var PointingState3 = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, originPoint = _inputs.originPoint;
            if (Vec.dist(currentPoint, originPoint) > 5) {
                _this.tool.transition("creating");
                _this.app.setSelectedShapes(_this.app.currentPage.shapes);
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(PointingState3, "id", "pointing");
var TLLineTool1 = /*#__PURE__*/ function(TLTool) {
    "use strict";
    _inherits(_class, TLTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "crosshair");
        return _this;
    }
    return _class;
}(TLTool1);
__publicField3(TLLineTool1, "id", "line");
__publicField3(TLLineTool1, "states", [
    IdleState5,
    PointingState3,
    CreatingState4
]);
__publicField3(TLLineTool1, "initial", "idle");
var CreatingState5 = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "crosshair");
        __publicField3(_assertThisInitialized(_this), "creatingShape");
        __publicField3(_assertThisInitialized(_this), "aspectRatio");
        __publicField3(_assertThisInitialized(_this), "initialBounds", {
        });
        __publicField3(_assertThisInitialized(_this), "onEnter", function() {
            var _app = _this.app, currentPage = _app.currentPage, originPoint = _app.inputs.originPoint;
            var _tool = _this.tool, Shape17 = _tool.Shape;
            var shape = new Shape17({
                id: uniqueId(),
                type: Shape17.id,
                parentId: currentPage.id,
                point: _toConsumableArray(originPoint),
                text: "",
                size: [
                    16,
                    32
                ],
                isSizeLocked: true
            });
            _this.creatingShape = shape;
            transaction(function() {
                _this.app.currentPage.addShapes(shape);
                var bounds = shape.bounds;
                shape.update({
                    point: src_default.sub(originPoint, [
                        bounds.width / 2,
                        bounds.height / 2
                    ])
                });
                _this.app.transition("select");
                _this.app.setSelectedShapes([
                    shape
                ]);
                _this.app.currentState.transition("editingShape", {
                    type: "shape",
                    shape: _this.creatingShape,
                    order: 0
                });
            });
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(CreatingState5, "id", "creating");
var IdleState6 = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "onPointerDown", function(info, e) {
            if (info.order) return;
            _this.tool.transition("creating");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function() {
            for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                args[_key] = arguments[_key];
            }
            var __b;
            var _a2, _b;
            _this.app.transition("select", {
                returnTo: "box"
            });
            (_b = (_a2 = _this.app).onPinchStart) == null ? void 0 : (__b = _b).call.apply(__b, [
                _a2
            ].concat(_toConsumableArray(args)));
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        _this.app.transition("select");
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(IdleState6, "id", "idle");
var TLTextTool1 = /*#__PURE__*/ function(TLTool) {
    "use strict";
    _inherits(_class, TLTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "crosshair");
        return _this;
    }
    return _class;
}(TLTool1);
__publicField3(TLTextTool1, "id", "box");
__publicField3(TLTextTool1, "states", [
    IdleState6,
    CreatingState5
]);
__publicField3(TLTextTool1, "initial", "idle");
var BrushingState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "initialSelectedIds", []);
        __publicField3(_assertThisInitialized(_this), "initialSelectedShapes", []);
        __publicField3(_assertThisInitialized(_this), "tree", new TLBush());
        __publicField3(_assertThisInitialized(_this), "onEnter", function() {
            var _app = _this.app, selectedShapes = _app.selectedShapes, currentPage = _app.currentPage, selectedIds = _app.selectedIds;
            _this.initialSelectedIds = Array.from(selectedIds.values());
            _this.initialSelectedShapes = Array.from(selectedShapes.values());
            _this.tree.load(currentPage.shapes);
        });
        __publicField3(_assertThisInitialized(_this), "onExit", function() {
            _this.initialSelectedIds = [];
            _this.tree.clear();
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _app = _this.app, _inputs = _app.inputs, shiftKey = _inputs.shiftKey, ctrlKey = _inputs.ctrlKey, originPoint = _inputs.originPoint, currentPoint = _inputs.currentPoint;
            var brushBounds = BoundsUtils.getBoundsFromPoints([
                currentPoint,
                originPoint
            ], 0);
            _this.app.setBrush(brushBounds);
            var hits = _this.tree.search(brushBounds).filter(function(shape) {
                return ctrlKey ? BoundsUtils.boundsContain(brushBounds, shape.rotatedBounds) : shape.hitTestBounds(brushBounds);
            });
            if (shiftKey) {
                if (hits.every(function(hit) {
                    return _this.initialSelectedShapes.includes(hit);
                })) {
                    _this.app.setSelectedShapes(_this.initialSelectedShapes.filter(function(hit) {
                        return !hits.includes(hit);
                    }));
                } else {
                    _this.app.setSelectedShapes(Array.from(/* @__PURE__ */ new Set(_toConsumableArray(_this.initialSelectedShapes).concat(_toConsumableArray(hits))).values()));
                }
            } else {
                _this.app.setSelectedShapes(hits);
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.app.setBrush(void 0);
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "handleModifierKey", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        _this.app.setBrush(void 0);
                        _this.app.setSelectedShapes(_this.initialSelectedIds);
                        _this.tool.transition("idle");
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(BrushingState, "id", "brushing");
var IdleState7 = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
        });
        __publicField3(_assertThisInitialized(_this), "onExit", function() {
            _this.app.setHoveredShape(void 0);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerEnter", function(info) {
            if (info.order) return;
            switch(info.type){
                case "shape":
                    {
                        _this.app.setHoveredShape(info.shape.id);
                        break;
                    }
                case "selection":
                    {
                        if (!(info.handle === "background" || info.handle === "center")) {
                            _this.tool.transition("hoveringSelectionHandle", info);
                        }
                        break;
                    }
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerDown", function(info, event) {
            var _app = _this.app, selectedShapes = _app.selectedShapes, ctrlKey = _app.inputs.ctrlKey;
            if (ctrlKey) {
                _this.tool.transition("pointingCanvas");
                return;
            }
            switch(info.type){
                case "selection":
                    {
                        switch(info.handle){
                            case "center":
                                {
                                    break;
                                }
                            case "background":
                                {
                                    _this.tool.transition("pointingBoundsBackground");
                                    break;
                                }
                            case "rotate":
                                {
                                    _this.tool.transition("pointingRotateHandle");
                                    break;
                                }
                            default:
                                {
                                    _this.tool.transition("pointingResizeHandle", info);
                                }
                        }
                        break;
                    }
                case "shape":
                    {
                        if (selectedShapes.has(info.shape)) {
                            _this.tool.transition("pointingSelectedShape", info);
                        } else {
                            var _app1 = _this.app, selectionBounds = _app1.selectionBounds, inputs = _app1.inputs;
                            if (selectionBounds && PointUtils.pointInBounds(inputs.currentPoint, selectionBounds)) {
                                _this.tool.transition("pointingShapeBehindBounds", info);
                            } else {
                                _this.tool.transition("pointingShape", info);
                            }
                        }
                        break;
                    }
                case "handle":
                    {
                        _this.tool.transition("pointingHandle", info);
                        break;
                    }
                case "canvas":
                    {
                        _this.tool.transition("pointingCanvas");
                        break;
                    }
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerLeave", function(info) {
            if (info.order) return;
            if (info.type === "shape") {
                if (_this.app.hoveredId) {
                    _this.app.setHoveredShape(void 0);
                }
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function(info, event) {
            _this.tool.transition("pinching", {
                info: info,
                event: event
            });
        });
        __publicField3(_assertThisInitialized(_this), "onDoubleClick", function(info) {
            if (info.order) return;
            if (_this.app.selectedShapesArray.length !== 1) return;
            var selectedShape = _this.app.selectedShapesArray[0];
            if (!selectedShape.canEdit) return;
            switch(info.type){
                case "shape":
                    {
                        _this.tool.transition("editingShape", info);
                        break;
                    }
                case "selection":
                    {
                        if (_this.app.selectedShapesArray.length === 1) {
                            _this.tool.transition("editingShape", {
                                type: "shape",
                                target: selectedShape
                            });
                        }
                        break;
                    }
            }
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            var selectedShapesArray = _this.app.selectedShapesArray;
            switch(e.key){
                case "Enter":
                    {
                        if (selectedShapesArray.length === 1 && selectedShapesArray[0].canEdit) {
                            _this.tool.transition("editingShape", {
                                type: "shape",
                                shape: selectedShapesArray[0],
                                order: 0
                            });
                        }
                        break;
                    }
                case "Escape":
                    {
                        if (selectedShapesArray.length) {
                            _this.app.setSelectedShapes([]);
                        }
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(IdleState7, "id", "idle");
__publicField3(IdleState7, "shortcuts", [
    {
        keys: [
            "delete",
            "backspace"
        ],
        fn: function(app) {
            return app.api.deleteShapes();
        }
    }
]);
var PointingShapeState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
            var _app = _this.app, selectedIds = _app.selectedIds, shiftKey = _app.inputs.shiftKey;
            if (shiftKey) {
                _this.app.setSelectedShapes(_toConsumableArray(Array.from(selectedIds.values())).concat([
                    info.shape.id
                ]));
            } else {
                _this.app.setSelectedShapes([
                    info.shape
                ]);
            }
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, originPoint = _inputs.originPoint;
            if (Vec.dist(currentPoint, originPoint) > 5) {
                _this.tool.transition("translating");
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function(info, event) {
            _this.tool.transition("pinching", {
                info: info,
                event: event
            });
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(PointingShapeState, "id", "pointingShape");
var PointingBoundsBackgroundState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "move");
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, originPoint = _inputs.originPoint;
            if (Vec.dist(currentPoint, originPoint) > 5) {
                _this.tool.transition("translating");
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.app.setSelectedShapes([]);
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function(info, event) {
            _this.tool.transition("pinching", {
                info: info,
                event: event
            });
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(PointingBoundsBackgroundState, "id", "pointingBoundsBackground");
var PointingCanvasState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "onEnter", function() {
            var shiftKey = _this.app.inputs.shiftKey;
            if (!shiftKey) _this.app.setSelectedShapes([]);
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, originPoint = _inputs.originPoint;
            if (Vec.dist(currentPoint, originPoint) > 5) {
                _this.tool.transition("brushing");
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            if (!_this.app.inputs.shiftKey) {
                _this.app.setSelectedShapes([]);
            }
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function(info, event) {
            _this.tool.transition("pinching", {
                info: info,
                event: event
            });
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(PointingCanvasState, "id", "pointingCanvas");
var TranslatingState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "move");
        __publicField3(_assertThisInitialized(_this), "isCloning", false);
        __publicField3(_assertThisInitialized(_this), "didClone", false);
        __publicField3(_assertThisInitialized(_this), "initialPoints", {
        });
        __publicField3(_assertThisInitialized(_this), "initialShapePoints", {
        });
        __publicField3(_assertThisInitialized(_this), "initialClonePoints", {
        });
        __publicField3(_assertThisInitialized(_this), "clones", []);
        __publicField3(_assertThisInitialized(_this), "onEnter", function() {
            _this.app.history.pause();
            var _app = _this.app, selectedShapesArray = _app.selectedShapesArray, inputs = _app.inputs;
            _this.initialShapePoints = Object.fromEntries(selectedShapesArray.map(function(param) {
                var id = param.id, point = param.props.point;
                return [
                    id,
                    point.slice()
                ];
            }));
            _this.initialPoints = _this.initialShapePoints;
            if (inputs.altKey) {
                _this.startCloning();
            } else {
                _this.moveSelectedShapesToPointer();
            }
        });
        __publicField3(_assertThisInitialized(_this), "onExit", function() {
            _this.app.history.resume();
            _this.didClone = false;
            _this.isCloning = false;
            _this.clones = [];
            _this.initialPoints = {
            };
            _this.initialShapePoints = {
            };
            _this.initialClonePoints = {
            };
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            _this.moveSelectedShapesToPointer();
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.app.history.resume();
            _this.app.persist();
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Alt":
                    {
                        _this.startCloning();
                        break;
                    }
                case "Escape":
                    {
                        _this.app.selectedShapes.forEach(function(shape) {
                            shape.update({
                                point: _this.initialPoints[shape.id]
                            });
                        });
                        _this.tool.transition("idle");
                        break;
                    }
            }
        });
        __publicField3(_assertThisInitialized(_this), "onKeyUp", function(info, e) {
            switch(e.key){
                case "Alt":
                    {
                        var _currentPage;
                        if (!_this.isCloning) throw Error("Expected to be cloning.");
                        var _app = _this.app, currentPage = _app.currentPage, selectedShapes = _app.selectedShapes;
                        (_currentPage = currentPage).removeShapes.apply(_currentPage, _toConsumableArray(selectedShapes));
                        _this.initialPoints = _this.initialShapePoints;
                        _this.app.setSelectedShapes(Object.keys(_this.initialPoints));
                        _this.moveSelectedShapesToPointer();
                        _this.isCloning = false;
                        break;
                    }
            }
        });
        return _this;
    }
    _createClass(_class, [
        {
            key: "moveSelectedShapesToPointer",
            value: function moveSelectedShapesToPointer() {
                var _app = this.app, selectedShapes = _app.selectedShapes, _inputs = _app.inputs, shiftKey = _inputs.shiftKey, originPoint = _inputs.originPoint, currentPoint = _inputs.currentPoint;
                var initialPoints = this.initialPoints;
                var delta = Vec.sub(currentPoint, originPoint);
                if (shiftKey) {
                    if (Math.abs(delta[0]) < Math.abs(delta[1])) {
                        delta[0] = 0;
                    } else {
                        delta[1] = 0;
                    }
                }
                selectedShapes.forEach(function(shape) {
                    return shape.update({
                        point: Vec.add(initialPoints[shape.id], delta)
                    });
                });
            }
        },
        {
            key: "startCloning",
            value: function startCloning() {
                var _this = this;
                var _currentPage;
                if (!this.didClone) {
                    var _this5 = this;
                    this.clones = this.app.selectedShapesArray.map(function(shape) {
                        var ShapeClass = _this5.app.getShapeClass(shape.type);
                        if (!ShapeClass) throw Error("Could not find that shape class.");
                        var clone = new ShapeClass(__spreadProps2(__spreadValues2({
                        }, shape.serialized), {
                            id: uniqueId(),
                            type: shape.type,
                            point: _this5.initialPoints[shape.id],
                            rotation: shape.props.rotation
                        }));
                        return clone;
                    });
                    this.initialClonePoints = Object.fromEntries(this.clones.map(function(param) {
                        var id = param.id, point = param.props.point;
                        return [
                            id,
                            point.slice()
                        ];
                    }));
                    this.didClone = true;
                }
                this.app.selectedShapes.forEach(function(shape) {
                    shape.update({
                        point: _this.initialPoints[shape.id]
                    });
                });
                this.initialPoints = this.initialClonePoints;
                (_currentPage = this.app.currentPage).addShapes.apply(_currentPage, _toConsumableArray(this.clones));
                this.app.setSelectedShapes(Object.keys(this.initialClonePoints));
                this.moveSelectedShapesToPointer();
                this.isCloning = true;
                this.moveSelectedShapesToPointer();
            }
        }
    ]);
    return _class;
}(TLToolState1);
__publicField3(TranslatingState, "id", "translating");
var PointingSelectedShapeState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "pointedSelectedShape");
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
            _this.pointedSelectedShape = info.shape;
        });
        __publicField3(_assertThisInitialized(_this), "onExit", function() {
            _this.pointedSelectedShape = void 0;
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, originPoint = _inputs.originPoint;
            if (Vec.dist(currentPoint, originPoint) > 5) {
                _this.tool.transition("translating");
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            var shiftKey = _this.app.inputs.shiftKey;
            if (!_this.pointedSelectedShape) throw Error("Expected a pointed selected shape");
            if (shiftKey) {
                var selectedIds = _this.app.selectedIds;
                var next = Array.from(selectedIds.values());
                next.splice(next.indexOf(_this.pointedSelectedShape.id), 1);
                _this.app.setSelectedShapes(next);
            } else {
                _this.app.setSelectedShapes([
                    _this.pointedSelectedShape.id
                ]);
            }
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function(info, event) {
            _this.tool.transition("pinching", {
                info: info,
                event: event
            });
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(PointingSelectedShapeState, "id", "pointingSelectedShape");
var PointingResizeHandleState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "info", {
        });
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
            _this.info = info;
            _this.updateCursor();
        });
        __publicField3(_assertThisInitialized(_this), "onExit", function() {
            _this.app.cursors.reset();
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, originPoint = _inputs.originPoint;
            if (Vec.dist(currentPoint, originPoint) > 5) {
                _this.tool.transition("resizing", _this.info);
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.tool.transition("hoveringSelectionHandle", _this.info);
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function(info, event) {
            _this.tool.transition("pinching", {
                info: info,
                event: event
            });
        });
        return _this;
    }
    _createClass(_class, [
        {
            key: "updateCursor",
            value: function updateCursor() {
                var rotation = this.app.selectionBounds.rotation;
                var cursor = CURSORS[this.info.handle];
                this.app.cursors.setCursor(cursor, rotation);
            }
        }
    ]);
    return _class;
}(TLToolState1);
__publicField3(PointingResizeHandleState, "id", "pointingResizeHandle");
var _ResizingState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "isSingle", false);
        __publicField3(_assertThisInitialized(_this), "handle", "bottom_right_corner");
        __publicField3(_assertThisInitialized(_this), "snapshots", {
        });
        __publicField3(_assertThisInitialized(_this), "initialCommonBounds", {
        });
        __publicField3(_assertThisInitialized(_this), "selectionRotation", 0);
        __publicField3(_assertThisInitialized(_this), "resizeType", "corner");
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
            var _a2, _b;
            var _app = _this.app, history = _app.history, selectedShapesArray = _app.selectedShapesArray, selectionBounds = _app.selectionBounds;
            if (!selectionBounds) throw Error("Expected a selected bounds.");
            _this.handle = info.handle;
            _this.resizeType = info.handle === "left_edge" || info.handle === "right_edge" ? "horizontal-edge" : info.handle === "top_edge" || info.handle === "bottom_edge" ? "vertical-edge" : "corner";
            _this.app.cursors.setCursor(_ResizingState.CURSORS[info.handle], (_a2 = _this.app.selectionBounds) == null ? void 0 : _a2.rotation);
            history.pause();
            var initialInnerBounds = BoundsUtils.getBoundsFromPoints(selectedShapesArray.map(function(shape) {
                return BoundsUtils.getBoundsCenter(shape.bounds);
            }));
            _this.isSingle = selectedShapesArray.length === 1;
            _this.selectionRotation = _this.isSingle ? (_b = selectedShapesArray[0].props.rotation) != null ? _b : 0 : 0;
            _this.initialCommonBounds = __spreadValues2({
            }, selectionBounds);
            _this.snapshots = Object.fromEntries(selectedShapesArray.map(function(shape) {
                var bounds = __spreadValues2({
                }, shape.bounds);
                var ref = _slicedToArray(BoundsUtils.getBoundsCenter(bounds), 2), cx = ref[0], cy = ref[1];
                return [
                    shape.id,
                    {
                        props: shape.serialized,
                        bounds: bounds,
                        transformOrigin: [
                            (cx - _this.initialCommonBounds.minX) / _this.initialCommonBounds.width,
                            (cy - _this.initialCommonBounds.minY) / _this.initialCommonBounds.height
                        ],
                        innerTransformOrigin: [
                            (cx - initialInnerBounds.minX) / initialInnerBounds.width,
                            (cy - initialInnerBounds.minY) / initialInnerBounds.height
                        ],
                        isAspectRatioLocked: shape.props.isAspectRatioLocked || Boolean(!shape.canChangeAspectRatio || shape.props.rotation)
                    }
                ];
            }));
            selectedShapesArray.forEach(function(shape) {
                var _a22;
                return (_a22 = shape.onResizeStart) == null ? void 0 : _a22.call(shape, {
                    isSingle: _this.isSingle
                });
            });
        });
        __publicField3(_assertThisInitialized(_this), "onExit", function() {
            _this.app.cursors.reset();
            _this.snapshots = {
            };
            _this.initialCommonBounds = {
            };
            _this.selectionRotation = 0;
            _this.app.history.resume();
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _app = _this.app, _inputs = _app.inputs, altKey = _inputs.altKey, shiftKey = _inputs.shiftKey, ctrlKey = _inputs.ctrlKey, originPoint = _inputs.originPoint, currentPoint = _inputs.currentPoint;
            var ref = _assertThisInitialized(_this), handle = ref.handle, snapshots = ref.snapshots, initialCommonBounds = ref.initialCommonBounds;
            var delta = Vec.sub(currentPoint, originPoint);
            if (altKey) {
                delta = Vec.mul(delta, 2);
            }
            var firstShape = getFirstFromSet(_this.app.selectedShapes);
            var useAspectRatioLock = shiftKey || _this.isSingle && (ctrlKey ? !("clipping" in firstShape.props) : !firstShape.canChangeAspectRatio || firstShape.props.isAspectRatioLocked);
            var nextBounds = BoundsUtils.getTransformedBoundingBox(initialCommonBounds, handle, delta, _this.selectionRotation, useAspectRatioLock);
            if (altKey) {
                nextBounds = __spreadValues2(__spreadValues2({
                }, nextBounds), BoundsUtils.centerBounds(nextBounds, BoundsUtils.getBoundsCenter(initialCommonBounds)));
            }
            var scaleX = nextBounds.scaleX, scaleY = nextBounds.scaleY;
            var resizeDimension;
            switch(_this.resizeType){
                case "horizontal-edge":
                    {
                        resizeDimension = Math.abs(scaleX);
                        break;
                    }
                case "vertical-edge":
                    {
                        resizeDimension = Math.abs(scaleY);
                        break;
                    }
                case "corner":
                    {
                        resizeDimension = Math.min(Math.abs(scaleX), Math.abs(scaleY));
                    }
            }
            _this.app.selectedShapes.forEach(function(shape) {
                var _a2, _b;
                var _id = snapshots[shape.id], isAspectRatioLocked = _id.isAspectRatioLocked, initialShapeProps = _id.props, initialShapeBounds = _id.bounds, transformOrigin = _id.transformOrigin, innerTransformOrigin = _id.innerTransformOrigin;
                var relativeBounds = BoundsUtils.getRelativeTransformedBoundingBox(nextBounds, initialCommonBounds, initialShapeBounds, scaleX < 0, scaleY < 0);
                if (!(shape.canResize || shape.props.isSizeLocked) && _this.isSingle) {
                    return;
                }
                var scale = [
                    scaleX,
                    scaleY
                ];
                var rotation = (_a2 = initialShapeProps.rotation) != null ? _a2 : 0;
                var center = BoundsUtils.getBoundsCenter(relativeBounds);
                if (!shape.canFlip) {
                    scale = Vec.abs(scale);
                }
                if (!shape.canScale) {
                    scale = (_b = initialShapeProps.scale) != null ? _b : [
                        1,
                        1
                    ];
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
                    center: center,
                    rotation: rotation,
                    scale: scale,
                    bounds: relativeBounds,
                    type: handle,
                    clip: ctrlKey,
                    transformOrigin: transformOrigin
                });
            });
            _this.updateCursor(scaleX, scaleY);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.app.history.resume();
            _this.app.persist();
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        _this.app.selectedShapes.forEach(function(shape) {
                            shape.update(__spreadValues2({
                            }, _this.snapshots[shape.id].props));
                        });
                        _this.tool.transition("idle");
                        break;
                    }
            }
        });
        return _this;
    }
    _createClass(_class, [
        {
            key: "updateCursor",
            value: function updateCursor(scaleX, scaleY) {
                var _a2, _b, _c, _d;
                var isFlippedX = scaleX < 0 && scaleY >= 0;
                var isFlippedY = scaleY < 0 && scaleX >= 0;
                switch(this.handle){
                    case "top_left_corner":
                    case "bottom_right_corner":
                        {
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
                    case "bottom_left_corner":
                        {
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
        }
    ]);
    return _class;
}(TLToolState1);
var ResizingState = _ResizingState;
__publicField3(ResizingState, "id", "resizing");
var _obj2;
__publicField3(ResizingState, "CURSORS", (_obj2 = {
}, _defineProperty(_obj2, "bottom_edge", "ns-resize"), _defineProperty(_obj2, "top_edge", "ns-resize"), _defineProperty(_obj2, "left_edge", "ew-resize"), _defineProperty(_obj2, "right_edge", "ew-resize"), _defineProperty(_obj2, "bottom_left_corner", "nesw-resize"), _defineProperty(_obj2, "bottom_right_corner", "nwse-resize"), _defineProperty(_obj2, "top_left_corner", "nwse-resize"), _defineProperty(_obj2, "top_right_corner", "nesw-resize"), _obj2));
var PointingRotateHandleState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "rotate");
        __publicField3(_assertThisInitialized(_this), "handle", "");
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
            _this.handle = info.handle;
            _this.updateCursor();
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, originPoint = _inputs.originPoint;
            if (Vec.dist(currentPoint, originPoint) > 5) {
                _this.tool.transition("rotating", {
                    handle: _this.handle
                });
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function(info, event) {
            _this.tool.transition("pinching", {
                info: info,
                event: event
            });
        });
        return _this;
    }
    _createClass(_class, [
        {
            key: "updateCursor",
            value: function updateCursor() {
                this.app.cursors.setCursor(CURSORS[this.handle], this.app.selectionRotation);
            }
        }
    ]);
    return _class;
}(TLToolState1);
__publicField3(PointingRotateHandleState, "id", "pointingRotateHandle");
var PointingShapeBehindBoundsState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "info", {
        });
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
            _this.info = info;
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, originPoint = _inputs.originPoint;
            if (Vec.dist(currentPoint, originPoint) > 5) {
                _this.tool.transition("translating");
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            var _app = _this.app, selectedIds = _app.selectedIds, shiftKey = _app.inputs.shiftKey;
            if (shiftKey) {
                _this.app.setSelectedShapes(_toConsumableArray(Array.from(selectedIds.values())).concat([
                    _this.info.shape.id
                ]));
            } else {
                _this.app.setSelectedShapes([
                    _this.info.shape.id
                ]);
            }
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function(info, event) {
            _this.tool.transition("pinching", {
                info: info,
                event: event
            });
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(PointingShapeBehindBoundsState, "id", "pointingShapeBehindBounds");
var RotatingState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "rotate");
        __publicField3(_assertThisInitialized(_this), "snapshot", {
        });
        __publicField3(_assertThisInitialized(_this), "initialCommonCenter", [
            0,
            0
        ]);
        __publicField3(_assertThisInitialized(_this), "initialCommonBounds", {
        });
        __publicField3(_assertThisInitialized(_this), "initialAngle", 0);
        __publicField3(_assertThisInitialized(_this), "initialSelectionRotation", 0);
        __publicField3(_assertThisInitialized(_this), "handle", "");
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
            var _app = _this.app, history = _app.history, selectedShapesArray = _app.selectedShapesArray, selectionBounds = _app.selectionBounds;
            if (!selectionBounds) throw Error("Expected selected bounds.");
            history.pause();
            _this.handle = info.handle;
            _this.initialSelectionRotation = _this.app.selectionRotation;
            _this.initialCommonBounds = __spreadValues2({
            }, selectionBounds);
            _this.initialCommonCenter = BoundsUtils.getBoundsCenter(selectionBounds);
            _this.initialAngle = Vec.angle(_this.initialCommonCenter, _this.app.inputs.currentPoint);
            _this.snapshot = Object.fromEntries(selectedShapesArray.map(function(shape) {
                return [
                    shape.id,
                    {
                        point: _toConsumableArray(shape.props.point),
                        center: _toConsumableArray(shape.center),
                        rotation: shape.props.rotation,
                        handles: "handles" in shape ? deepCopy(shape.handles) : void 0
                    }
                ];
            }));
            _this.updateCursor();
        });
        __publicField3(_assertThisInitialized(_this), "onExit", function() {
            _this.app.history.resume();
            _this.snapshot = {
            };
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _app = _this.app, selectedShapes = _app.selectedShapes, _inputs = _app.inputs, shiftKey = _inputs.shiftKey, currentPoint = _inputs.currentPoint;
            var ref = _assertThisInitialized(_this), snapshot = ref.snapshot, initialCommonCenter = ref.initialCommonCenter, initialAngle = ref.initialAngle, initialSelectionRotation = ref.initialSelectionRotation;
            var currentAngle = Vec.angle(initialCommonCenter, currentPoint);
            var angleDelta = currentAngle - initialAngle;
            if (shiftKey) {
                angleDelta = GeomUtils.snapAngleToSegments(angleDelta, 24);
            }
            selectedShapes.forEach(function(shape) {
                var initialShape = snapshot[shape.id];
                var initialAngle2 = 0;
                if (shiftKey) {
                    var _rotation = initialShape.rotation, rotation = _rotation === void 0 ? 0 : _rotation;
                    initialAngle2 = GeomUtils.snapAngleToSegments(rotation, 24) - rotation;
                }
                var relativeCenter = Vec.sub(initialShape.center, initialShape.point);
                var rotatedCenter = Vec.rotWith(initialShape.center, initialCommonCenter, angleDelta);
                if ("handles" in shape) {
                    var initialHandles = initialShape.handles;
                    var handlePoints = initialHandles.map(function(handle) {
                        return Vec.rotWith(handle.point, relativeCenter, angleDelta);
                    });
                    var topLeft = BoundsUtils.getCommonTopLeft(handlePoints);
                    shape.update({
                        point: Vec.add(topLeft, Vec.sub(rotatedCenter, relativeCenter)),
                        handles: initialHandles.map(function(h, i) {
                            return __spreadProps2(__spreadValues2({
                            }, h), {
                                point: Vec.sub(handlePoints[i], topLeft)
                            });
                        })
                    });
                } else {
                    shape.update({
                        point: Vec.sub(rotatedCenter, relativeCenter),
                        rotation: GeomUtils.clampRadians((initialShape.rotation || 0) + angleDelta + initialAngle2)
                    });
                }
            });
            var selectionRotation = GeomUtils.clampRadians(initialSelectionRotation + angleDelta);
            _this.app.setSelectionRotation(shiftKey ? GeomUtils.snapAngleToSegments(selectionRotation, 24) : selectionRotation);
            _this.updateCursor();
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.app.history.resume();
            _this.app.persist();
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        _this.app.selectedShapes.forEach(function(shape) {
                            shape.update(_this.snapshot[shape.id]);
                        });
                        _this.tool.transition("idle");
                        break;
                    }
            }
        });
        return _this;
    }
    _createClass(_class, [
        {
            key: "updateCursor",
            value: function updateCursor() {
                this.app.cursors.setCursor(CURSORS[this.handle], this.app.selectionRotation);
            }
        }
    ]);
    return _class;
}(TLToolState1);
__publicField3(RotatingState, "id", "rotating");
var PinchingState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "origin", [
            0,
            0
        ]);
        __publicField3(_assertThisInitialized(_this), "prevDelta", [
            0,
            0
        ]);
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
            _this.prevDelta = info.info.delta;
            _this.origin = info.info.point;
        });
        __publicField3(_assertThisInitialized(_this), "onPinch", function(info) {
            _this.pinchCamera(info.point, [
                0,
                0
            ], info.offset[0]);
        });
        __publicField3(_assertThisInitialized(_this), "onPinchEnd", function() {
            _this.tool.transition("idle");
        });
        return _this;
    }
    _createClass(_class, [
        {
            key: "pinchCamera",
            value: function pinchCamera(point, delta, zoom) {
                var camera = this.app.viewport.camera;
                var nextPoint = Vec.sub(camera.point, Vec.div(delta, camera.zoom));
                var p0 = Vec.sub(Vec.div(point, camera.zoom), nextPoint);
                var p1 = Vec.sub(Vec.div(point, zoom), nextPoint);
                this.app.setCamera(Vec.toFixed(Vec.add(nextPoint, Vec.sub(p1, p0))), zoom);
            }
        }
    ]);
    return _class;
}(TLToolState1);
__publicField3(PinchingState, "id", "pinching");
var TranslatingHandleState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "grabbing");
        __publicField3(_assertThisInitialized(_this), "offset", [
            0,
            0
        ]);
        __publicField3(_assertThisInitialized(_this), "initialTopLeft", [
            0,
            0
        ]);
        __publicField3(_assertThisInitialized(_this), "index", 0);
        __publicField3(_assertThisInitialized(_this), "shape", {
        });
        __publicField3(_assertThisInitialized(_this), "initialShape", {
        });
        __publicField3(_assertThisInitialized(_this), "handles", []);
        __publicField3(_assertThisInitialized(_this), "initialHandles", []);
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
            _this.app.history.pause();
            _this.offset = [
                0,
                0
            ];
            _this.index = info.index;
            _this.shape = info.shape;
            _this.initialShape = __spreadValues2({
            }, _this.shape.props);
            _this.handles = deepCopy(info.shape.props.handles);
            _this.initialHandles = deepCopy(info.shape.props.handles);
            _this.initialTopLeft = _toConsumableArray(info.shape.props.point);
        });
        __publicField3(_assertThisInitialized(_this), "onExit", function() {
            _this.app.history.resume();
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _app = _this.app, _inputs = _app.inputs, shiftKey = _inputs.shiftKey, previousPoint = _inputs.previousPoint, originPoint = _inputs.originPoint, currentPoint = _inputs.currentPoint;
            if (Vec.isEqual(previousPoint, currentPoint)) return;
            var delta = Vec.sub(currentPoint, originPoint);
            if (shiftKey) {
                if (Math.abs(delta[0]) < Math.abs(delta[1])) {
                    delta[0] = 0;
                } else {
                    delta[1] = 0;
                }
            }
            var ref = _assertThisInitialized(_this), shape = ref.shape, initialShape = ref.initialShape, index = ref.index;
            shape.onHandleChange(initialShape, {
                index: index,
                delta: delta
            });
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.app.history.resume();
            _this.app.persist();
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        _this.shape.update({
                            handles: _this.initialHandles
                        });
                        _this.tool.transition("idle");
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(TranslatingHandleState, "id", "translatingHandle");
var PointingHandleState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "cursor", "grabbing");
        __publicField3(_assertThisInitialized(_this), "info", {
        });
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
            _this.info = info;
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.onPointerMove(info, e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function() {
            var _inputs = _this.app.inputs, currentPoint = _inputs.currentPoint, originPoint = _inputs.originPoint;
            if (Vec.dist(currentPoint, originPoint) > 5) {
                _this.tool.transition("translatingHandle", _this.info);
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function() {
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function(info, event) {
            _this.tool.transition("pinching", {
                info: info,
                event: event
            });
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(PointingHandleState, "id", "pointingHandle");
var HoveringSelectionHandleState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "handle");
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
            var _a2;
            _this.app.cursors.setCursor(CURSORS[info.handle], (_a2 = _this.app.selectionBounds.rotation) != null ? _a2 : 0);
            _this.handle = info.handle;
        });
        __publicField3(_assertThisInitialized(_this), "onExit", function() {
            _this.app.cursors.reset();
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function(info, event) {
            _this.tool.transition("pinching", {
                info: info,
                event: event
            });
        });
        __publicField3(_assertThisInitialized(_this), "onPointerDown", function(info) {
            switch(info.type){
                case "selection":
                    {
                        switch(info.handle){
                            case "center":
                                {
                                    break;
                                }
                            case "background":
                                {
                                    break;
                                }
                            case "top_left_resize_corner":
                            case "top_right_resize_corner":
                            case "bottom_right_resize_corner":
                            case "bottom_left_resize_corner":
                                {
                                    _this.tool.transition("pointingRotateHandle", info);
                                    break;
                                }
                            default:
                                {
                                    _this.tool.transition("pointingResizeHandle", info);
                                }
                        }
                        break;
                    }
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerLeave", function() {
            _this.tool.transition("idle");
        });
        __publicField3(_assertThisInitialized(_this), "onDoubleClick", function(info) {
            var _a2;
            if (info.order) return;
            var isSingle = _this.app.selectedShapes.size === 1;
            if (!isSingle) return;
            var selectedShape = getFirstFromSet(_this.app.selectedShapes);
            if (selectedShape.canEdit) {
                switch(info.type){
                    case "shape":
                        {
                            _this.tool.transition("editingShape", info);
                            break;
                        }
                    case "selection":
                        {
                            (_a2 = selectedShape.onResetBounds) == null ? void 0 : _a2.call(selectedShape, {
                            });
                            if (_this.app.selectedShapesArray.length === 1) {
                                _this.tool.transition("editingShape", {
                                    type: "shape",
                                    target: selectedShape
                                });
                            }
                            break;
                        }
                }
            } else {
                var asset = selectedShape.props.assetId ? _this.app.assets[selectedShape.props.assetId] : void 0;
                selectedShape.onResetBounds({
                    asset: asset
                });
                _this.tool.transition("idle");
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(HoveringSelectionHandleState, "id", "hoveringSelectionHandle");
var EditingShapeState = /*#__PURE__*/ function(TLToolState) {
    "use strict";
    _inherits(_class, TLToolState);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "editingShape", {
        });
        __publicField3(_assertThisInitialized(_this), "onEnter", function(info) {
            _this.editingShape = info.shape;
            _this.app.setEditingShape(info.shape);
        });
        __publicField3(_assertThisInitialized(_this), "onExit", function() {
            _this.app.clearEditingShape();
        });
        __publicField3(_assertThisInitialized(_this), "onPointerDown", function(info) {
            switch(info.type){
                case "shape":
                    {
                        if (info.shape === _this.editingShape) return;
                        _this.tool.transition("idle", info);
                        break;
                    }
                case "selection":
                    {
                        break;
                    }
                case "handle":
                    {
                        break;
                    }
                case "canvas":
                    {
                        if (!info.order) {
                            _this.tool.transition("idle", info);
                        }
                        break;
                    }
            }
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            switch(e.key){
                case "Escape":
                    {
                        transaction(function() {
                            e.stopPropagation();
                            _this.app.setSelectedShapes([
                                _this.editingShape
                            ]);
                            _this.tool.transition("idle");
                        });
                        break;
                    }
            }
        });
        return _this;
    }
    return _class;
}(TLToolState1);
__publicField3(EditingShapeState, "id", "editingShape");
var TLSelectTool18 = /*#__PURE__*/ function(TLTool) {
    "use strict";
    _inherits(_class, TLTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        return _super.apply(this, arguments);
    }
    return _class;
}(TLTool1);
__publicField3(TLSelectTool18, "id", "select");
__publicField3(TLSelectTool18, "initial", "idle");
__publicField3(TLSelectTool18, "shortcut", [
    "v"
]);
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
var TLPage = /*#__PURE__*/ function() {
    "use strict";
    function _class(app, param) {
        var props = param === void 0 ? {
        } : param;
        var _this = this;
        _classCallCheck(this, _class);
        __publicField3(this, "app");
        __publicField3(this, "id");
        __publicField3(this, "name");
        __publicField3(this, "shapes", []);
        __publicField3(this, "bindings");
        __publicField3(this, "nonce", 0);
        __publicField3(this, "bump", function() {
            _this.nonce++;
        });
        __publicField3(this, "bringForward", function(shapes3) {
            var _this6 = _this;
            var shapesToMove = _this.parseShapesArg(shapes3);
            shapesToMove.sort(function(a2, b) {
                return _this6.shapes.indexOf(b) - _this6.shapes.indexOf(a2);
            }).map(function(shape) {
                return _this6.shapes.indexOf(shape);
            }).forEach(function(index) {
                if (index === _this6.shapes.length - 1) return;
                var next = _this6.shapes[index + 1];
                if (shapesToMove.includes(next)) return;
                var t = _this6.shapes[index];
                _this6.shapes[index] = _this6.shapes[index + 1];
                _this6.shapes[index + 1] = t;
            });
            return _this;
        });
        __publicField3(this, "sendBackward", function(shapes3) {
            var _this7 = _this;
            var shapesToMove = _this.parseShapesArg(shapes3);
            shapesToMove.sort(function(a2, b) {
                return _this7.shapes.indexOf(a2) - _this7.shapes.indexOf(b);
            }).map(function(shape) {
                return _this7.shapes.indexOf(shape);
            }).forEach(function(index) {
                if (index === 0) return;
                var next = _this7.shapes[index - 1];
                if (shapesToMove.includes(next)) return;
                var t = _this7.shapes[index];
                _this7.shapes[index] = _this7.shapes[index - 1];
                _this7.shapes[index - 1] = t;
            });
            return _this;
        });
        __publicField3(this, "bringToFront", function(shapes3) {
            var shapesToMove = _this.parseShapesArg(shapes3);
            _this.shapes = _this.shapes.filter(function(shape) {
                return !shapesToMove.includes(shape);
            }).concat(shapesToMove);
            return _this;
        });
        __publicField3(this, "sendToBack", function(shapes3) {
            var shapesToMove = _this.parseShapesArg(shapes3);
            _this.shapes = shapesToMove.concat(_this.shapes.filter(function(shape) {
                return !shapesToMove.includes(shape);
            }));
            return _this;
        });
        __publicField3(this, "flip", function(shapes3, direction) {
            var shapesToMove = _this.parseShapesArg(shapes3);
            var commonBounds = BoundsUtils.getCommonBounds(shapesToMove.map(function(shape) {
                return shape.bounds;
            }));
            shapesToMove.forEach(function(shape) {
                var _a2;
                var relativeBounds = BoundsUtils.getRelativeTransformedBoundingBox(commonBounds, commonBounds, shape.bounds, direction === "horizontal", direction === "vertical");
                shape.onResize(shape.serialized, {
                    bounds: relativeBounds,
                    center: BoundsUtils.getBoundsCenter(relativeBounds),
                    rotation: (_a2 = shape.props.rotation) != null ? _a2 : 0 * -1,
                    type: "top_left_corner",
                    scale: shape.canFlip && shape.props.scale ? direction === "horizontal" ? [
                        -shape.props.scale[0],
                        1
                    ] : [
                        1,
                        -shape.props.scale[1]
                    ] : [
                        1,
                        1
                    ],
                    clip: false,
                    transformOrigin: [
                        0.5,
                        0.5
                    ]
                });
            });
            return _this;
        });
        var id = props.id, name = props.name, tmp = props.shapes, shapes2 = tmp === void 0 ? [] : tmp, _bindings = props.bindings, bindings = _bindings === void 0 ? [] : _bindings;
        this.id = id;
        this.name = name;
        this.bindings = bindings;
        this.app = app;
        this.addShapes.apply(this, _toConsumableArray(shapes2));
        makeObservable(this);
    }
    _createClass(_class, [
        {
            key: "serialized",
            get: function get() {
                return {
                    id: this.id,
                    name: this.name,
                    shapes: this.shapes.map(function(shape) {
                        return shape.serialized;
                    }),
                    bindings: this.bindings.map(function(binding) {
                        return __spreadValues2({
                        }, binding);
                    }),
                    nonce: this.nonce
                };
            }
        },
        {
            key: "update",
            value: function update(props) {
                Object.assign(this, props);
                return this;
            }
        },
        {
            key: "addShapes",
            value: function addShapes() {
                for(var _len = arguments.length, shapes2 = new Array(_len), _key = 0; _key < _len; _key++){
                    shapes2[_key] = arguments[_key];
                }
                var _this = this;
                var _shapes;
                if (shapes2.length === 0) return;
                var shapeInstances = "getBounds" in shapes2[0] ? shapes2 : shapes2.map(function(shape) {
                    var ShapeClass = _this.app.getShapeClass(shape.type);
                    return new ShapeClass(shape);
                });
                shapeInstances.forEach(function(instance) {
                    return observe(instance, _this.app.saveState);
                });
                (_shapes = this.shapes).push.apply(_shapes, _toConsumableArray(shapeInstances));
                this.bump();
                this.app.saveState();
                return shapeInstances;
            }
        },
        {
            key: "parseShapesArg",
            value: function parseShapesArg(shapes2) {
                if (typeof shapes2[0] === "string") {
                    return this.shapes.filter(function(shape) {
                        return shapes2.includes(shape.id);
                    });
                } else {
                    return shapes2;
                }
            }
        },
        {
            key: "removeShapes",
            value: function removeShapes() {
                for(var _len = arguments.length, shapes2 = new Array(_len), _key = 0; _key < _len; _key++){
                    shapes2[_key] = arguments[_key];
                }
                var shapeInstances = this.parseShapesArg(shapes2);
                this.shapes = this.shapes.filter(function(shape) {
                    return !shapeInstances.includes(shape);
                });
                return shapeInstances;
            }
        }
    ]);
    return _class;
}();
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
var TLBush = /*#__PURE__*/ function(_default) {
    "use strict";
    _inherits(_class, _default);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField3(_assertThisInitialized(_this), "toBBox", function(shape) {
            return shape.rotatedBounds;
        });
        return _this;
    }
    return _class;
}(import_rbush.default);
var TLInputs = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        var _this = this;
        _classCallCheck(this, _class);
        __publicField3(this, "shiftKey", false);
        __publicField3(this, "ctrlKey", false);
        __publicField3(this, "altKey", false);
        __publicField3(this, "spaceKey", false);
        __publicField3(this, "isPinching", false);
        __publicField3(this, "currentScreenPoint", [
            0,
            0
        ]);
        __publicField3(this, "currentPoint", [
            0,
            0
        ]);
        __publicField3(this, "previousScreenPoint", [
            0,
            0
        ]);
        __publicField3(this, "previousPoint", [
            0,
            0
        ]);
        __publicField3(this, "originScreenPoint", [
            0,
            0
        ]);
        __publicField3(this, "originPoint", [
            0,
            0
        ]);
        __publicField3(this, "pointerIds", /* @__PURE__ */ new Set());
        __publicField3(this, "state", "idle");
        __publicField3(this, "onWheel", function(pagePoint, event) {
            _this.updateModifiers(event);
            _this.previousPoint = _this.currentPoint;
            _this.currentPoint = pagePoint;
        });
        __publicField3(this, "onPointerDown", function(pagePoint, event) {
            _this.pointerIds.add(event.pointerId);
            _this.updateModifiers(event);
            _this.originScreenPoint = _this.currentScreenPoint;
            _this.originPoint = pagePoint;
            _this.state = "pointing";
        });
        __publicField3(this, "onPointerMove", function(pagePoint, event) {
            if (_this.state === "pinching") return;
            _this.updateModifiers(event);
            _this.previousPoint = _this.currentPoint;
            _this.currentPoint = pagePoint;
        });
        __publicField3(this, "onPointerUp", function(pagePoint, event) {
            _this.pointerIds.clear();
            _this.updateModifiers(event);
            _this.state = "idle";
        });
        __publicField3(this, "onKeyDown", function(event) {
            _this.updateModifiers(event);
            switch(event.key){
                case " ":
                    {
                        _this.spaceKey = true;
                        break;
                    }
            }
        });
        __publicField3(this, "onKeyUp", function(event) {
            _this.updateModifiers(event);
            switch(event.key){
                case " ":
                    {
                        _this.spaceKey = false;
                        break;
                    }
            }
        });
        __publicField3(this, "onPinchStart", function(pagePoint, event) {
            _this.updateModifiers(event);
            _this.state = "pinching";
        });
        __publicField3(this, "onPinch", function(pagePoint, event) {
            if (_this.state !== "pinching") return;
            _this.updateModifiers(event);
        });
        __publicField3(this, "onPinchEnd", function(pagePoint, event) {
            if (_this.state !== "pinching") return;
            _this.updateModifiers(event);
            _this.state = "idle";
        });
        makeObservable(this);
    }
    _createClass(_class, [
        {
            key: "updateModifiers",
            value: function updateModifiers(event) {
                if ("clientX" in event) {
                    this.previousScreenPoint = this.currentScreenPoint;
                    this.currentScreenPoint = [
                        event.clientX,
                        event.clientY
                    ];
                }
                if ("shiftKey" in event) {
                    this.shiftKey = event.shiftKey;
                    this.ctrlKey = event.metaKey || event.ctrlKey;
                    this.altKey = event.altKey;
                }
            }
        }
    ]);
    return _class;
}();
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
var TLViewport = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        var _this = this;
        _classCallCheck(this, _class);
        __publicField3(this, "minZoom", 0.1);
        __publicField3(this, "maxZoom", 8);
        __publicField3(this, "zooms", [
            0.1,
            0.25,
            0.5,
            1,
            2,
            4,
            8
        ]);
        __publicField3(this, "bounds", {
            minX: 0,
            minY: 0,
            maxX: 1080,
            maxY: 720,
            width: 1080,
            height: 720
        });
        __publicField3(this, "camera", {
            point: [
                0,
                0
            ],
            zoom: 1
        });
        __publicField3(this, "updateBounds", function(bounds) {
            _this.bounds = bounds;
            return _this;
        });
        __publicField3(this, "panCamera", function(delta) {
            return _this.update({
                point: Vec.sub(_this.camera.point, Vec.div(delta, _this.camera.zoom))
            });
        });
        __publicField3(this, "update", function(param) {
            var point = param.point, zoom = param.zoom;
            if (point !== void 0) _this.camera.point = point;
            if (zoom !== void 0) _this.camera.zoom = zoom;
            return _this;
        });
        __publicField3(this, "_currentView", {
            minX: 0,
            minY: 0,
            maxX: 1,
            maxY: 1,
            width: 1,
            height: 1
        });
        __publicField3(this, "getPagePoint", function(point) {
            var camera = _this.camera, bounds = _this.bounds;
            return Vec.sub(Vec.div(Vec.sub(point, [
                bounds.minX,
                bounds.minY
            ]), camera.zoom), camera.point);
        });
        __publicField3(this, "getScreenPoint", function(point) {
            var camera = _this.camera;
            return Vec.mul(Vec.add(point, camera.point), camera.zoom);
        });
        __publicField3(this, "zoomIn", function() {
            var camera = _this.camera, bounds = _this.bounds, zooms = _this.zooms;
            var zoom;
            for(var i = 1; i < zooms.length; i++){
                var z1 = zooms[i - 1];
                var z2 = zooms[i];
                if (z2 - camera.zoom <= (z2 - z1) / 2) continue;
                zoom = z2;
                break;
            }
            if (zoom === void 0) zoom = zooms[zooms.length - 1];
            var center = [
                bounds.width / 2,
                bounds.height / 2
            ];
            var p0 = Vec.sub(Vec.div(center, camera.zoom), center);
            var p1 = Vec.sub(Vec.div(center, zoom), center);
            return _this.update({
                point: Vec.toFixed(Vec.add(camera.point, Vec.sub(p1, p0))),
                zoom: zoom
            });
        });
        __publicField3(this, "zoomOut", function() {
            var camera = _this.camera, bounds = _this.bounds, zooms = _this.zooms;
            var zoom;
            for(var i = zooms.length - 1; i > 0; i--){
                var z1 = zooms[i - 1];
                var z2 = zooms[i];
                if (z2 - camera.zoom >= (z2 - z1) / 2) continue;
                zoom = z1;
                break;
            }
            if (zoom === void 0) zoom = zooms[0];
            var center = [
                bounds.width / 2,
                bounds.height / 2
            ];
            var p0 = Vec.sub(Vec.div(center, camera.zoom), center);
            var p1 = Vec.sub(Vec.div(center, zoom), center);
            return _this.update({
                point: Vec.toFixed(Vec.add(camera.point, Vec.sub(p1, p0))),
                zoom: zoom
            });
        });
        __publicField3(this, "resetZoom", function() {
            var bounds = _this.bounds, _camera = _this.camera, zoom = _camera.zoom, point = _camera.point;
            var center = [
                bounds.width / 2,
                bounds.height / 2
            ];
            var p0 = Vec.sub(Vec.div(center, zoom), point);
            var p1 = Vec.sub(Vec.div(center, 1), point);
            return _this.update({
                point: Vec.toFixed(Vec.add(point, Vec.sub(p1, p0))),
                zoom: 1
            });
        });
        __publicField3(this, "zoomToBounds", function(param) {
            var width = param.width, height = param.height, minX = param.minX, minY = param.minY;
            var bounds = _this.bounds, camera = _this.camera;
            var zoom = Math.min((bounds.width - FIT_TO_SCREEN_PADDING) / width, (bounds.height - FIT_TO_SCREEN_PADDING) / height);
            zoom = Math.min(_this.maxZoom, Math.max(_this.minZoom, camera.zoom === zoom || camera.zoom < 1 ? Math.min(1, zoom) : zoom));
            var delta = [
                (bounds.width - width * zoom) / 2 / zoom,
                (bounds.height - height * zoom) / 2 / zoom
            ];
            return _this.update({
                point: Vec.add([
                    -minX,
                    -minY
                ], delta),
                zoom: zoom
            });
        });
        makeObservable(this);
    }
    _createClass(_class, [
        {
            key: "currentView",
            get: function get() {
                var ref = this, bounds = ref.bounds, _camera = ref.camera, point = _camera.point, zoom = _camera.zoom;
                var w = bounds.width / zoom;
                var h = bounds.height / zoom;
                return {
                    minX: -point[0],
                    minY: -point[1],
                    maxX: w - point[0],
                    maxY: h - point[1],
                    width: w,
                    height: h
                };
            }
        }
    ]);
    return _class;
}();
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
var TLHistory = function _class(app) {
    "use strict";
    var _this = this;
    _classCallCheck(this, _class);
    __publicField3(this, "app");
    __publicField3(this, "stack", []);
    __publicField3(this, "pointer", 0);
    __publicField3(this, "isPaused", true);
    __publicField3(this, "pause", function() {
        if (_this.isPaused) return;
        _this.isPaused = true;
    });
    __publicField3(this, "resume", function() {
        if (!_this.isPaused) return;
        _this.isPaused = false;
    });
    __publicField3(this, "reset", function() {
        _this.stack = [
            _this.app.serialized
        ];
        _this.pointer = 0;
        _this.resume();
        _this.app.notify("persist", null);
    });
    __publicField3(this, "persist", function() {
        if (_this.isPaused) return;
        var serialized = _this.app.serialized;
        if (_this.pointer < _this.stack.length) {
            _this.stack = _this.stack.slice(0, _this.pointer + 1);
        }
        _this.stack.push(serialized);
        _this.pointer = _this.stack.length - 1;
        _this.app.notify("persist", null);
    });
    __publicField3(this, "undo", function() {
        if (_this.isPaused) return;
        if (_this.app.selectedTool.currentState.id !== "idle") return;
        if (_this.pointer > 0) {
            _this.pointer--;
            var snapshot = _this.stack[_this.pointer];
            _this.deserialize(snapshot);
        }
        _this.app.notify("persist", null);
    });
    __publicField3(this, "redo", function() {
        if (_this.isPaused) return;
        if (_this.app.selectedTool.currentState.id !== "idle") return;
        if (_this.pointer < _this.stack.length - 1) {
            _this.pointer++;
            var snapshot = _this.stack[_this.pointer];
            _this.deserialize(snapshot);
        }
        _this.app.notify("persist", null);
    });
    __publicField3(this, "deserialize", function(snapshot) {
        var currentPageId = snapshot.currentPageId, selectedIds = snapshot.selectedIds, pages = snapshot.pages;
        var wasPaused = _this.isPaused;
        _this.pause();
        try {
            var pagesMap = new Map(_this.app.pages);
            var pagesToAdd = [];
            var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
            try {
                for(var _iterator = pages[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                    var serializedPage = _step.value;
                    var page = pagesMap.get(serializedPage.id);
                    if (page !== void 0) {
                        var _page, _page1;
                        var shapesMap = new Map(page.shapes.map(function(shape) {
                            return [
                                shape.props.id,
                                shape
                            ];
                        }));
                        var shapesToAdd = [];
                        var _iteratorNormalCompletion2 = true, _didIteratorError2 = false, _iteratorError2 = undefined;
                        try {
                            for(var _iterator2 = serializedPage.shapes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true){
                                var serializedShape = _step2.value;
                                var shape1 = shapesMap.get(serializedShape.id);
                                if (shape1 !== void 0) {
                                    if (shape1.nonce !== serializedShape.nonce) {
                                        shape1.update(serializedShape, true);
                                    }
                                    shapesMap.delete(serializedShape.id);
                                } else {
                                    var ShapeClass = _this.app.getShapeClass(serializedShape.type);
                                    shapesToAdd.push(new ShapeClass(serializedShape));
                                }
                            }
                        } catch (err) {
                            _didIteratorError2 = true;
                            _iteratorError2 = err;
                        } finally{
                            try {
                                if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
                                    _iterator2.return();
                                }
                            } finally{
                                if (_didIteratorError2) {
                                    throw _iteratorError2;
                                }
                            }
                        }
                        if (shapesMap.size > 0) (_page = page).removeShapes.apply(_page, _toConsumableArray(shapesMap.values()));
                        if (shapesToAdd.length > 0) (_page1 = page).addShapes.apply(_page1, _toConsumableArray(shapesToAdd));
                        pagesMap.delete(serializedPage.id);
                    } else {
                        var _this8 = _this;
                        var id = serializedPage.id, name = serializedPage.name, shapes2 = serializedPage.shapes, bindings = serializedPage.bindings;
                        pagesToAdd.push(new TLPage(_this.app, {
                            id: id,
                            name: name,
                            bindings: bindings,
                            shapes: shapes2.map(function(serializedShape) {
                                var ShapeClass = _this8.app.getShapeClass(serializedShape.type);
                                return new ShapeClass(serializedShape);
                            })
                        }));
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally{
                try {
                    if (!_iteratorNormalCompletion && _iterator.return != null) {
                        _iterator.return();
                    }
                } finally{
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
            if (pagesMap.size > 0) _this.app.removePages(Array.from(pagesMap.values()));
            if (pagesToAdd.length > 0) _this.app.addPages(pagesToAdd);
            _this.app.setCurrentPage(currentPageId).setSelectedShapes(selectedIds).setErasingShapes([]);
        } catch (e) {
            console.warn(e);
        }
        if (!wasPaused) _this.resume();
    });
    this.app = app;
};
var TLSettings = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        _classCallCheck(this, _class);
        __publicField3(this, "mode", "light");
        __publicField3(this, "showGrid", false);
        __publicField3(this, "isToolLocked", false);
        makeObservable(this);
    }
    _createClass(_class, [
        {
            key: "update",
            value: function update(props) {
                Object.assign(this, props);
            }
        }
    ]);
    return _class;
}();
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
var TLApi = function _class(app) {
    "use strict";
    var _this = this;
    _classCallCheck(this, _class);
    __publicField3(this, "app");
    __publicField3(this, "changePage", function(page) {
        _this.app.setCurrentPage(page);
        return _this;
    });
    __publicField3(this, "hoverShape", function(shape) {
        _this.app.setHoveredShape(shape);
        return _this;
    });
    __publicField3(this, "createShapes", function() {
        for(var _len = arguments.length, shapes2 = new Array(_len), _key = 0; _key < _len; _key++){
            shapes2[_key] = arguments[_key];
        }
        _this.app.createShapes(shapes2);
        return _this;
    });
    __publicField3(this, "updateShapes", function() {
        for(var _len = arguments.length, shapes2 = new Array(_len), _key = 0; _key < _len; _key++){
            shapes2[_key] = arguments[_key];
        }
        _this.app.updateShapes(shapes2);
        return _this;
    });
    __publicField3(this, "deleteShapes", function() {
        for(var _len = arguments.length, shapes2 = new Array(_len), _key = 0; _key < _len; _key++){
            shapes2[_key] = arguments[_key];
        }
        _this.app.deleteShapes(shapes2.length ? shapes2 : _this.app.selectedShapesArray);
        return _this;
    });
    __publicField3(this, "selectShapes", function() {
        for(var _len = arguments.length, shapes2 = new Array(_len), _key = 0; _key < _len; _key++){
            shapes2[_key] = arguments[_key];
        }
        _this.app.setSelectedShapes(shapes2);
        return _this;
    });
    __publicField3(this, "deselectShapes", function() {
        for(var _len = arguments.length, shapes2 = new Array(_len), _key = 0; _key < _len; _key++){
            shapes2[_key] = arguments[_key];
        }
        var ids = typeof shapes2[0] === "string" ? shapes2 : shapes2.map(function(shape) {
            return shape.id;
        });
        _this.app.setSelectedShapes(_this.app.selectedShapesArray.filter(function(shape) {
            return !ids.includes(shape.id);
        }));
        return _this;
    });
    __publicField3(this, "flipHorizontal", function() {
        for(var _len = arguments.length, shapes2 = new Array(_len), _key = 0; _key < _len; _key++){
            shapes2[_key] = arguments[_key];
        }
        _this.app.flipHorizontal(shapes2);
        return _this;
    });
    __publicField3(this, "flipVertical", function() {
        for(var _len = arguments.length, shapes2 = new Array(_len), _key = 0; _key < _len; _key++){
            shapes2[_key] = arguments[_key];
        }
        _this.app.flipVertical(shapes2);
        return _this;
    });
    __publicField3(this, "selectAll", function() {
        _this.app.setSelectedShapes(_this.app.currentPage.shapes);
        return _this;
    });
    __publicField3(this, "deselectAll", function() {
        _this.app.setSelectedShapes([]);
        return _this;
    });
    __publicField3(this, "zoomIn", function() {
        _this.app.viewport.zoomIn();
        return _this;
    });
    __publicField3(this, "zoomOut", function() {
        _this.app.viewport.zoomOut();
        return _this;
    });
    __publicField3(this, "resetZoom", function() {
        _this.app.viewport.resetZoom();
        return _this;
    });
    __publicField3(this, "zoomToFit", function() {
        var _currentPage = _this.app.currentPage, shapes2 = _currentPage.shapes;
        if (shapes2.length === 0) return _this;
        var commonBounds = BoundsUtils.getCommonBounds(shapes2.map(function(shape) {
            return shape.bounds;
        }));
        _this.app.viewport.zoomToBounds(commonBounds);
        return _this;
    });
    __publicField3(this, "zoomToSelection", function() {
        var selectionBounds = _this.app.selectionBounds;
        if (!selectionBounds) return _this;
        _this.app.viewport.zoomToBounds(selectionBounds);
        return _this;
    });
    __publicField3(this, "toggleGrid", function() {
        var settings = _this.app.settings;
        settings.update({
            showGrid: !settings.showGrid
        });
        return _this;
    });
    __publicField3(this, "toggleToolLock", function() {
        var settings = _this.app.settings;
        settings.update({
            showGrid: !settings.isToolLocked
        });
        return _this;
    });
    __publicField3(this, "save", function() {
        _this.app.save();
        return _this;
    });
    __publicField3(this, "saveAs", function() {
        _this.app.save();
        return _this;
    });
    this.app = app;
};
var TLCursors = function _class() {
    "use strict";
    var _this = this;
    _classCallCheck(this, _class);
    __publicField3(this, "cursor", "default");
    __publicField3(this, "rotation", 0);
    __publicField3(this, "reset", function() {
        _this.cursor = "default";
    });
    __publicField3(this, "setCursor", function(cursor, param) {
        var rotation = param === void 0 ? 0 : param;
        if (cursor === _this.cursor && rotation === _this.rotation) return;
        _this.cursor = cursor;
        _this.rotation = rotation;
    });
    __publicField3(this, "setRotation", function(rotation) {
        if (rotation === _this.rotation) return;
        _this.rotation = rotation;
    });
    makeObservable(this);
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
var TLApp411 = /*#__PURE__*/ function(TLRootState) {
    "use strict";
    _inherits(_class, TLRootState);
    var _super = _createSuper(_class);
    function _class(serializedApp, Shapes, Tools) {
        var __disposables;
        _classCallCheck(this, _class);
        var _this;
        var _a2, _b;
        _this = _super.call(this);
        __publicField3(_assertThisInitialized(_this), "api");
        __publicField3(_assertThisInitialized(_this), "inputs", new TLInputs());
        __publicField3(_assertThisInitialized(_this), "cursors", new TLCursors());
        __publicField3(_assertThisInitialized(_this), "viewport", new TLViewport());
        __publicField3(_assertThisInitialized(_this), "settings", new TLSettings());
        __publicField3(_assertThisInitialized(_this), "history", new TLHistory(_assertThisInitialized(_this)));
        __publicField3(_assertThisInitialized(_this), "persist", _this.history.persist);
        __publicField3(_assertThisInitialized(_this), "undo", _this.history.undo);
        __publicField3(_assertThisInitialized(_this), "redo", _this.history.redo);
        __publicField3(_assertThisInitialized(_this), "saving", false);
        __publicField3(_assertThisInitialized(_this), "saveState", function() {
            if (_this.history.isPaused) return;
            _this.saving = true;
            requestAnimationFrame(function() {
                if (_this.saving) {
                    _this.persist();
                    _this.saving = false;
                }
            });
        });
        __publicField3(_assertThisInitialized(_this), "load", function() {
            _this.notify("load", null);
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "save", function() {
            _this.notify("save", null);
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "saveAs", function() {
            _this.notify("saveAs", null);
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "pages", /* @__PURE__ */ new Map([
            [
                "page",
                new TLPage(_assertThisInitialized(_this), {
                    id: "page",
                    name: "page",
                    shapes: [],
                    bindings: []
                })
            ]
        ]));
        __publicField3(_assertThisInitialized(_this), "currentPageId", "page");
        __publicField3(_assertThisInitialized(_this), "getPageById", function(pageId) {
            var page = _this.pages.get(pageId);
            if (!page) throw Error("Could not find a page named ".concat(pageId, "."));
            return page;
        });
        __publicField3(_assertThisInitialized(_this), "getShapeById", function(id, param) {
            var pageId = param === void 0 ? _this.currentPage.id : param;
            var _a3;
            var shape = (_a3 = _this.getPageById(pageId)) == null ? void 0 : _a3.shapes.find(function(shape2) {
                return shape2.id === id;
            });
            if (!shape) throw Error("Could not find that shape: ".concat(id, " on page ").concat(pageId));
            return shape;
        });
        __publicField3(_assertThisInitialized(_this), "createShapes", function(shapes2) {
            var _currentPage;
            var newShapes = (_currentPage = _this.currentPage).addShapes.apply(_currentPage, _toConsumableArray(shapes2));
            if (newShapes) _this.notify("create-shapes", newShapes);
            _this.persist();
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "updateShapes", function(shapes2) {
            shapes2.forEach(function(shape) {
                var _a3;
                return (_a3 = _this.getShapeById(shape.id)) == null ? void 0 : _a3.update(shape);
            });
            _this.persist();
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "deleteShapes", function(shapes2) {
            var _currentPage;
            if (shapes2.length === 0) return _assertThisInitialized(_this);
            var ids;
            if (typeof shapes2[0] === "string") {
                ids = new Set(shapes2);
            } else {
                ids = new Set(shapes2.map(function(shape) {
                    return shape.id;
                }));
            }
            _this.setSelectedShapes(_this.selectedShapesArray.filter(function(shape) {
                return !ids.has(shape.id);
            }));
            var removedShapes = (_currentPage = _this.currentPage).removeShapes.apply(_currentPage, _toConsumableArray(shapes2));
            if (removedShapes) _this.notify("delete-shapes", removedShapes);
            _this.persist();
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "bringForward", function(param) {
            var shapes2 = param === void 0 ? _this.selectedShapesArray : param;
            if (shapes2.length > 0) _this.currentPage.bringForward(shapes2);
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "sendBackward", function(param) {
            var shapes2 = param === void 0 ? _this.selectedShapesArray : param;
            if (shapes2.length > 0) _this.currentPage.sendBackward(shapes2);
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "sendToBack", function(param) {
            var shapes2 = param === void 0 ? _this.selectedShapesArray : param;
            if (shapes2.length > 0) _this.currentPage.sendToBack(shapes2);
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "bringToFront", function(param) {
            var shapes2 = param === void 0 ? _this.selectedShapesArray : param;
            if (shapes2.length > 0) _this.currentPage.bringToFront(shapes2);
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "flipHorizontal", function(param) {
            var shapes2 = param === void 0 ? _this.selectedShapesArray : param;
            _this.currentPage.flip(shapes2, "horizontal");
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "flipVertical", function(param) {
            var shapes2 = param === void 0 ? _this.selectedShapesArray : param;
            _this.currentPage.flip(shapes2, "vertical");
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "assets", {
        });
        __publicField3(_assertThisInitialized(_this), "dropFiles", function(files, point) {
            _this.notify("drop-files", {
                files: Array.from(files),
                point: point ? _this.viewport.getPagePoint(point) : BoundsUtils.getBoundsCenter(_this.viewport.currentView)
            });
            return void 0;
        });
        __publicField3(_assertThisInitialized(_this), "selectTool", _this.transition);
        __publicField3(_assertThisInitialized(_this), "registerTools", _this.registerStates);
        __publicField3(_assertThisInitialized(_this), "editingId");
        __publicField3(_assertThisInitialized(_this), "setEditingShape", function(shape) {
            _this.editingId = typeof shape === "string" ? shape : shape == null ? void 0 : shape.id;
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "clearEditingShape", function() {
            return _this.setEditingShape();
        });
        __publicField3(_assertThisInitialized(_this), "hoveredId");
        __publicField3(_assertThisInitialized(_this), "setHoveredShape", function(shape) {
            _this.hoveredId = typeof shape === "string" ? shape : shape == null ? void 0 : shape.id;
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "selectedIds", /* @__PURE__ */ new Set());
        __publicField3(_assertThisInitialized(_this), "selectedShapes", /* @__PURE__ */ new Set());
        __publicField3(_assertThisInitialized(_this), "selectionRotation", 0);
        __publicField3(_assertThisInitialized(_this), "setSelectedShapes", function(shapes2) {
            var _a3;
            var ref = _assertThisInitialized(_this), selectedIds = ref.selectedIds, selectedShapes = ref.selectedShapes;
            selectedIds.clear();
            selectedShapes.clear();
            if (shapes2[0] && typeof shapes2[0] === "string") {
                ;
                shapes2.forEach(function(s) {
                    return selectedIds.add(s);
                });
            } else {
                ;
                shapes2.forEach(function(s) {
                    return selectedIds.add(s.id);
                });
            }
            var newSelectedShapes = _this.currentPage.shapes.filter(function(shape) {
                return selectedIds.has(shape.id);
            });
            newSelectedShapes.forEach(function(s) {
                return selectedShapes.add(s);
            });
            if (newSelectedShapes.length === 1) {
                _this.selectionRotation = (_a3 = newSelectedShapes[0].props.rotation) != null ? _a3 : 0;
            } else {
                _this.selectionRotation = 0;
            }
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "erasingIds", /* @__PURE__ */ new Set());
        __publicField3(_assertThisInitialized(_this), "erasingShapes", /* @__PURE__ */ new Set());
        __publicField3(_assertThisInitialized(_this), "setErasingShapes", function(shapes2) {
            var ref = _assertThisInitialized(_this), erasingIds = ref.erasingIds, erasingShapes = ref.erasingShapes;
            erasingIds.clear();
            erasingShapes.clear();
            if (shapes2[0] && typeof shapes2[0] === "string") {
                ;
                shapes2.forEach(function(s) {
                    return erasingIds.add(s);
                });
            } else {
                ;
                shapes2.forEach(function(s) {
                    return erasingIds.add(s.id);
                });
            }
            var newErasingShapes = _this.currentPage.shapes.filter(function(shape) {
                return erasingIds.has(shape.id);
            });
            newErasingShapes.forEach(function(s) {
                return erasingShapes.add(s);
            });
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "brush");
        __publicField3(_assertThisInitialized(_this), "setBrush", function(brush) {
            _this.brush = brush;
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "setCamera", function(point, zoom) {
            _this.viewport.update({
                point: point,
                zoom: zoom
            });
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "getPagePoint", function(point) {
            var camera = _this.viewport.camera;
            return Vec.sub(Vec.div(point, camera.zoom), camera.point);
        });
        __publicField3(_assertThisInitialized(_this), "getScreenPoint", function(point) {
            var camera = _this.viewport.camera;
            return Vec.mul(Vec.add(point, camera.point), camera.zoom);
        });
        __publicField3(_assertThisInitialized(_this), "Shapes", /* @__PURE__ */ new Map());
        __publicField3(_assertThisInitialized(_this), "registerShapes", function(Shapes2) {
            Shapes2.forEach(function(Shape17) {
                return _this.Shapes.set(Shape17.id, Shape17);
            });
        });
        __publicField3(_assertThisInitialized(_this), "deregisterShapes", function(Shapes2) {
            Shapes2.forEach(function(Shape17) {
                return _this.Shapes.delete(Shape17.id);
            });
        });
        __publicField3(_assertThisInitialized(_this), "getShapeClass", function(type) {
            if (!type) throw Error("No shape type provided.");
            var Shape17 = _this.Shapes.get(type);
            if (!Shape17) throw Error("Could not find shape class for ".concat(type));
            return Shape17;
        });
        __publicField3(_assertThisInitialized(_this), "subscriptions", /* @__PURE__ */ new Set([]));
        __publicField3(_assertThisInitialized(_this), "subscribe", function(event, callback) {
            if (callback === void 0) throw Error("Callback is required.");
            var subscription = {
                event: event,
                callback: callback
            };
            _this.subscriptions.add(subscription);
            return function() {
                return _this.unsubscribe(subscription);
            };
        });
        __publicField3(_assertThisInitialized(_this), "unsubscribe", function(subscription) {
            _this.subscriptions.delete(subscription);
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "notify", function(event, info) {
            _this.subscriptions.forEach(function(subscription) {
                if (subscription.event === event) {
                    subscription.callback(_assertThisInitialized(_this), info);
                }
            });
            return _assertThisInitialized(_this);
        });
        __publicField3(_assertThisInitialized(_this), "onTransition", function() {
            _this.settings.update({
                isToolLocked: false
            });
        });
        __publicField3(_assertThisInitialized(_this), "onWheel", function(info, e) {
            _this.viewport.panCamera(info.delta);
            _this.inputs.onWheel(_toConsumableArray(_this.viewport.getPagePoint([
                e.clientX,
                e.clientY
            ])).concat([
                0.5
            ]), e);
        });
        __publicField3(_assertThisInitialized(_this), "onPointerDown", function(info, e) {
            if ("clientX" in e) {
                _this.inputs.onPointerDown(_toConsumableArray(_this.viewport.getPagePoint([
                    e.clientX,
                    e.clientY
                ])).concat([
                    0.5
                ]), e);
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerUp", function(info, e) {
            if ("clientX" in e) {
                _this.inputs.onPointerUp(_toConsumableArray(_this.viewport.getPagePoint([
                    e.clientX,
                    e.clientY
                ])).concat([
                    0.5
                ]), e);
            }
        });
        __publicField3(_assertThisInitialized(_this), "onPointerMove", function(info, e) {
            if ("clientX" in e) {
                _this.inputs.onPointerMove(_toConsumableArray(_this.viewport.getPagePoint([
                    e.clientX,
                    e.clientY
                ])).concat([
                    0.5
                ]), e);
            }
        });
        __publicField3(_assertThisInitialized(_this), "onKeyDown", function(info, e) {
            _this.inputs.onKeyDown(e);
        });
        __publicField3(_assertThisInitialized(_this), "onKeyUp", function(info, e) {
            _this.inputs.onKeyUp(e);
        });
        __publicField3(_assertThisInitialized(_this), "onPinchStart", function(info, e) {
            _this.inputs.onPinchStart(_toConsumableArray(_this.viewport.getPagePoint(info.point)).concat([
                0.5
            ]), e);
        });
        __publicField3(_assertThisInitialized(_this), "onPinch", function(info, e) {
            _this.inputs.onPinch(_toConsumableArray(_this.viewport.getPagePoint(info.point)).concat([
                0.5
            ]), e);
        });
        __publicField3(_assertThisInitialized(_this), "onPinchEnd", function(info, e) {
            _this.inputs.onPinchEnd(_toConsumableArray(_this.viewport.getPagePoint(info.point)).concat([
                0.5
            ]), e);
        });
        _this.history.pause();
        if (_this.states && _this.states.length > 0) {
            _this.registerStates(_this.states);
            var initialId = (_a2 = _this.initial) != null ? _a2 : _this.states[0].id;
            var state = _this.children.get(initialId);
            if (state) {
                _this.currentState = state;
                (_b = _this.currentState) == null ? void 0 : _b._events.onEnter({
                    fromId: "initial"
                });
            }
        }
        if (Shapes) _this.registerShapes(Shapes);
        if (Tools) _this.registerTools(Tools);
        _this.history.resume();
        if (serializedApp) _this.history.deserialize(serializedApp);
        var ownShortcuts = [
            {
                keys: "mod+shift+g",
                fn: function() {
                    return _this.api.toggleGrid();
                }
            },
            {
                keys: "shift+0",
                fn: function() {
                    return _this.api.resetZoom();
                }
            },
            {
                keys: "mod+-",
                fn: function() {
                    return _this.api.zoomToSelection();
                }
            },
            {
                keys: "mod+-",
                fn: function() {
                    return _this.api.zoomOut();
                }
            },
            {
                keys: "mod+=",
                fn: function() {
                    return _this.api.zoomIn();
                }
            },
            {
                keys: "mod+z",
                fn: function() {
                    return _this.undo();
                }
            },
            {
                keys: "mod+shift+z",
                fn: function() {
                    return _this.redo();
                }
            },
            {
                keys: "[",
                fn: function() {
                    return _this.sendBackward();
                }
            },
            {
                keys: "shift+[",
                fn: function() {
                    return _this.sendToBack();
                }
            },
            {
                keys: "]",
                fn: function() {
                    return _this.bringForward();
                }
            },
            {
                keys: "shift+]",
                fn: function() {
                    return _this.bringToFront();
                }
            },
            {
                keys: "mod+a",
                fn: function() {
                    var selectedTool = _assertThisInitialized(_this).selectedTool;
                    if (selectedTool.currentState.id !== "idle") return;
                    if (selectedTool.id !== "select") {
                        _this.selectTool("select");
                    }
                    _this.api.selectAll();
                }
            },
            {
                keys: "mod+s",
                fn: function() {
                    _this.save();
                    _this.notify("save", null);
                }
            },
            {
                keys: "mod+shift+s",
                fn: function() {
                    _this.saveAs();
                    _this.notify("saveAs", null);
                }
            }
        ];
        var shortcuts = _this.constructor["shortcuts"] || [];
        (__disposables = _this._disposables).push.apply(__disposables, _toConsumableArray(_toConsumableArray(ownShortcuts).concat(_toConsumableArray(shortcuts)).map(function(param) {
            var keys = param.keys, fn = param.fn;
            return KeyUtils.registerShortcut(keys, function(e) {
                fn(_assertThisInitialized(_this), _assertThisInitialized(_this), e);
            });
        })));
        _this.api = new TLApi(_assertThisInitialized(_this));
        makeObservable(_assertThisInitialized(_this));
        _this.notify("mount", null);
        return _this;
    }
    _createClass(_class, [
        {
            key: "loadDocumentModel",
            value: function loadDocumentModel(model) {
                this.history.deserialize(model);
                if (model.assets) this.addAssets(model.assets);
                return this;
            }
        },
        {
            key: "serialized",
            get: function get() {
                return {
                    currentPageId: this.currentPageId,
                    selectedIds: Array.from(this.selectedIds.values()),
                    pages: Array.from(this.pages.values()).map(function(page) {
                        return page.serialized;
                    })
                };
            }
        },
        {
            key: "currentPage",
            get: function get() {
                return this.getPageById(this.currentPageId);
            }
        },
        {
            key: "setCurrentPage",
            value: function setCurrentPage(page) {
                this.currentPageId = typeof page === "string" ? page : page.id;
                return this;
            }
        },
        {
            key: "addPages",
            value: function addPages(pages) {
                var _this = this;
                pages.forEach(function(page) {
                    return _this.pages.set(page.id, page);
                });
                this.persist();
                return this;
            }
        },
        {
            key: "removePages",
            value: function removePages(pages) {
                var _this = this;
                pages.forEach(function(page) {
                    return _this.pages.delete(page.id);
                });
                this.persist();
                return this;
            }
        },
        {
            key: "addAssets",
            value: function addAssets(assets) {
                var _this = this;
                assets.forEach(function(asset) {
                    return _this.assets[asset.id] = asset;
                });
                this.persist();
                return this;
            }
        },
        {
            key: "removeAssets",
            value: function removeAssets(assets) {
                var _this = this;
                if (typeof assets[0] === "string") assets.forEach(function(asset) {
                    return delete _this.assets[asset];
                });
                else assets.forEach(function(asset) {
                    return delete _this.assets[asset.id];
                });
                this.persist();
                return this;
            }
        },
        {
            key: "createAssets",
            value: function createAssets(assets) {
                this.addAssets(assets);
                this.notify("create-assets", {
                    assets: assets
                });
                this.persist();
                return this;
            }
        },
        {
            key: "selectedTool",
            get: function get() {
                return this.currentState;
            }
        },
        {
            key: "editingShape",
            get: function get() {
                var ref = this, editingId = ref.editingId, currentPage = ref.currentPage;
                return editingId ? currentPage.shapes.find(function(shape) {
                    return shape.id === editingId;
                }) : void 0;
            }
        },
        {
            key: "hoveredShape",
            get: function get() {
                var ref = this, hoveredId = ref.hoveredId, currentPage = ref.currentPage;
                return hoveredId ? currentPage.shapes.find(function(shape) {
                    return shape.id === hoveredId;
                }) : void 0;
            }
        },
        {
            key: "selectedShapesArray",
            get: function get() {
                var ref = this, selectedShapes = ref.selectedShapes, selectedTool = ref.selectedTool;
                var stateId = selectedTool.id;
                if (stateId !== "select") return [];
                return Array.from(selectedShapes.values());
            }
        },
        {
            key: "setSelectionRotation",
            value: function setSelectionRotation(radians) {
                this.selectionRotation = radians;
            }
        },
        {
            key: "erasingShapesArray",
            get: function get() {
                return Array.from(this.erasingShapes.values());
            }
        },
        {
            key: "shapes",
            get: function get() {
                var ref = this, _currentPage = ref.currentPage, shapes2 = _currentPage.shapes;
                return Array.from(shapes2.values());
            }
        },
        {
            key: "shapesInViewport",
            get: function get() {
                var ref = this, selectedShapes = ref.selectedShapes, currentPage = ref.currentPage, currentView = ref.viewport.currentView;
                return currentPage.shapes.filter(function(shape) {
                    return shape.props.parentId === currentPage.id && (!shape.canUnmount || selectedShapes.has(shape) || BoundsUtils.boundsContain(currentView, shape.rotatedBounds) || BoundsUtils.boundsCollide(currentView, shape.rotatedBounds));
                });
            }
        },
        {
            key: "selectionDirectionHint",
            get: function get() {
                var ref = this, selectionBounds = ref.selectionBounds, currentView = ref.viewport.currentView;
                if (!selectionBounds || BoundsUtils.boundsContain(currentView, selectionBounds) || BoundsUtils.boundsCollide(currentView, selectionBounds)) {
                    return;
                }
                var center = BoundsUtils.getBoundsCenter(selectionBounds);
                return Vec.clampV([
                    (center[0] - currentView.minX - currentView.width / 2) / currentView.width,
                    (center[1] - currentView.minY - currentView.height / 2) / currentView.height
                ], -1, 1);
            }
        },
        {
            key: "selectionBounds",
            get: function get() {
                var selectedShapesArray = this.selectedShapesArray;
                if (selectedShapesArray.length === 0) return void 0;
                if (selectedShapesArray.length === 1) {
                    return __spreadProps2(__spreadValues2({
                    }, selectedShapesArray[0].bounds), {
                        rotation: selectedShapesArray[0].props.rotation
                    });
                }
                return BoundsUtils.getCommonBounds(this.selectedShapesArray.map(function(shape) {
                    return shape.rotatedBounds;
                }));
            }
        },
        {
            key: "showSelection",
            get: function get() {
                var _a2;
                var selectedShapesArray = this.selectedShapesArray;
                return this.isIn("select") && (selectedShapesArray.length === 1 && !((_a2 = selectedShapesArray[0]) == null ? void 0 : _a2.hideSelection) || selectedShapesArray.length > 1);
            }
        },
        {
            key: "showSelectionDetail",
            get: function get() {
                return this.isIn("select") && this.selectedShapes.size > 0 && !this.selectedShapesArray.every(function(shape) {
                    return shape.hideSelectionDetail;
                });
            }
        },
        {
            key: "showSelectionRotation",
            get: function get() {
                return this.showSelectionDetail && this.isInAny("select.rotating", "select.pointingRotateHandle");
            }
        },
        {
            key: "showContextBar",
            get: function get() {
                var ref = this, selectedShapesArray = ref.selectedShapesArray, ctrlKey = ref.inputs.ctrlKey;
                return !ctrlKey && this.isInAny("select.idle", "select.hoveringSelectionHandle") && selectedShapesArray.length > 0 && !selectedShapesArray.every(function(shape) {
                    return shape.hideContextBar;
                });
            }
        },
        {
            key: "showRotateHandles",
            get: function get() {
                var selectedShapesArray = this.selectedShapesArray;
                return this.isInAny("select.idle", "select.hoveringSelectionHandle", "select.pointingRotateHandle", "select.pointingResizeHandle") && selectedShapesArray.length > 0 && !selectedShapesArray.every(function(shape) {
                    return shape.hideRotateHandle;
                });
            }
        },
        {
            key: "showResizeHandles",
            get: function get() {
                var selectedShapesArray = this.selectedShapesArray;
                return this.isInAny("select.idle", "select.hoveringSelectionHandle", "select.pointingShape", "select.pointingSelectedShape", "select.pointingRotateHandle", "select.pointingResizeHandle") && selectedShapesArray.length > 0 && !selectedShapesArray.every(function(shape) {
                    return shape.hideResizeHandles;
                });
            }
        }
    ]);
    return _class;
}(TLRootState1);
__publicField3(TLApp411, "id", "app");
__publicField3(TLApp411, "states", [
    TLSelectTool18
]);
__publicField3(TLApp411, "initial", "select");
__decorateClass2([
    computed
], TLApp411.prototype, "serialized", 1);
__decorateClass2([
    observable
], TLApp411.prototype, "pages", 2);
__decorateClass2([
    observable
], TLApp411.prototype, "currentPageId", 2);
__decorateClass2([
    computed
], TLApp411.prototype, "currentPage", 1);
__decorateClass2([
    action
], TLApp411.prototype, "setCurrentPage", 1);
__decorateClass2([
    action
], TLApp411.prototype, "addPages", 1);
__decorateClass2([
    action
], TLApp411.prototype, "removePages", 1);
__decorateClass2([
    action
], TLApp411.prototype, "createShapes", 2);
__decorateClass2([
    action
], TLApp411.prototype, "updateShapes", 2);
__decorateClass2([
    action
], TLApp411.prototype, "deleteShapes", 2);
__decorateClass2([
    observable
], TLApp411.prototype, "assets", 2);
__decorateClass2([
    action
], TLApp411.prototype, "addAssets", 1);
__decorateClass2([
    action
], TLApp411.prototype, "removeAssets", 1);
__decorateClass2([
    computed
], TLApp411.prototype, "selectedTool", 1);
__decorateClass2([
    observable
], TLApp411.prototype, "editingId", 2);
__decorateClass2([
    computed
], TLApp411.prototype, "editingShape", 1);
__decorateClass2([
    action
], TLApp411.prototype, "setEditingShape", 2);
__decorateClass2([
    observable
], TLApp411.prototype, "hoveredId", 2);
__decorateClass2([
    computed
], TLApp411.prototype, "hoveredShape", 1);
__decorateClass2([
    action
], TLApp411.prototype, "setHoveredShape", 2);
__decorateClass2([
    observable
], TLApp411.prototype, "selectedIds", 2);
__decorateClass2([
    observable
], TLApp411.prototype, "selectedShapes", 2);
__decorateClass2([
    observable
], TLApp411.prototype, "selectionRotation", 2);
__decorateClass2([
    computed
], TLApp411.prototype, "selectedShapesArray", 1);
__decorateClass2([
    action
], TLApp411.prototype, "setSelectedShapes", 2);
__decorateClass2([
    action
], TLApp411.prototype, "setSelectionRotation", 1);
__decorateClass2([
    observable
], TLApp411.prototype, "erasingIds", 2);
__decorateClass2([
    observable
], TLApp411.prototype, "erasingShapes", 2);
__decorateClass2([
    computed
], TLApp411.prototype, "erasingShapesArray", 1);
__decorateClass2([
    action
], TLApp411.prototype, "setErasingShapes", 2);
__decorateClass2([
    observable
], TLApp411.prototype, "brush", 2);
__decorateClass2([
    action
], TLApp411.prototype, "setBrush", 2);
__decorateClass2([
    action
], TLApp411.prototype, "setCamera", 2);
__decorateClass2([
    computed
], TLApp411.prototype, "shapes", 1);
__decorateClass2([
    computed
], TLApp411.prototype, "shapesInViewport", 1);
__decorateClass2([
    computed
], TLApp411.prototype, "selectionDirectionHint", 1);
__decorateClass2([
    computed
], TLApp411.prototype, "selectionBounds", 1);
__decorateClass2([
    computed
], TLApp411.prototype, "showSelection", 1);
__decorateClass2([
    computed
], TLApp411.prototype, "showSelectionDetail", 1);
__decorateClass2([
    computed
], TLApp411.prototype, "showSelectionRotation", 1);
__decorateClass2([
    computed
], TLApp411.prototype, "showContextBar", 1);
__decorateClass2([
    computed
], TLApp411.prototype, "showRotateHandles", 1);
__decorateClass2([
    computed
], TLApp411.prototype, "showResizeHandles", 1);
// ../../packages/react/dist/esm/index.js
var React3 = __toESM(require("react"));
var React22 = __toESM(require("react"));
// ../../node_modules/mobx-react-lite/es/index.js
init_cjs_shims();
// ../../node_modules/mobx-react-lite/es/utils/assertEnvironment.js
init_cjs_shims();
var import_react = require("react");
if (!import_react.useState) {
    throw new Error("mobx-react-lite requires React with Hooks support");
}
if (!makeObservable) {
    throw new Error("mobx-react-lite@3 requires mobx at least version 6 to be available");
}
// ../../node_modules/mobx-react-lite/es/utils/reactBatchedUpdates.js
init_cjs_shims();
var import_react_dom = require("react-dom");
// ../../node_modules/mobx-react-lite/es/utils/observerBatching.js
init_cjs_shims();
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
    configure({
        reactionScheduler: reactionScheduler3
    });
}
// ../../node_modules/mobx-react-lite/es/utils/utils.js
init_cjs_shims();
// ../../node_modules/mobx-react-lite/es/useObserver.js
init_cjs_shims();
var import_react2 = __toESM(require("react"));
// ../../node_modules/mobx-react-lite/es/utils/printDebugValue.js
init_cjs_shims();
function printDebugValue(v) {
    return getDependencyTree(v);
}
// ../../node_modules/mobx-react-lite/es/utils/reactionCleanupTracking.js
init_cjs_shims();
// ../../node_modules/mobx-react-lite/es/utils/FinalizationRegistryWrapper.js
init_cjs_shims();
var FinalizationRegistryLocal = typeof FinalizationRegistry === "undefined" ? void 0 : FinalizationRegistry;
// ../../node_modules/mobx-react-lite/es/utils/createReactionCleanupTrackingUsingFinalizationRegister.js
init_cjs_shims();
// ../../node_modules/mobx-react-lite/es/utils/reactionCleanupTrackingCommon.js
init_cjs_shims();
function createTrackingData(reaction) {
    var trackingData = {
        reaction: reaction,
        mounted: false,
        changedBeforeMount: false,
        cleanAt: Date.now() + CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS
    };
    return trackingData;
}
var CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS = 10000;
var CLEANUP_TIMER_LOOP_MILLIS = 10000;
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
        addReactionToTrack: function addReactionToTrack(reactionTrackingRef, reaction, objectRetainedByReact) {
            var token = globalCleanupTokensCounter++;
            registry.register(objectRetainedByReact, token, reactionTrackingRef);
            reactionTrackingRef.current = createTrackingData(reaction);
            reactionTrackingRef.current.finalizationRegistryCleanupToken = token;
            cleanupTokenToReactionTrackingMap.set(token, reactionTrackingRef.current);
            return reactionTrackingRef.current;
        },
        recordReactionAsCommitted: function recordReactionAsCommitted(reactionRef) {
            registry.unregister(reactionRef);
            if (reactionRef.current && reactionRef.current.finalizationRegistryCleanupToken) {
                cleanupTokenToReactionTrackingMap.delete(reactionRef.current.finalizationRegistryCleanupToken);
            }
        },
        forceCleanupTimerToRunNowForTests: function forceCleanupTimerToRunNowForTests() {
        },
        resetCleanupScheduleForTests: function resetCleanupScheduleForTests() {
        }
    };
}
// ../../node_modules/mobx-react-lite/es/utils/createTimerBasedReactionCleanupTracking.js
init_cjs_shims();
var __values = function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function next() {
            if (o && i >= o.length) o = void 0;
            return {
                value: o && o[i++],
                done: !o
            };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
function createTimerBasedReactionCleanupTracking() {
    var forceCleanupTimerToRunNowForTests2 = function forceCleanupTimerToRunNowForTests2() {
        if (reactionCleanupHandle) {
            clearTimeout(reactionCleanupHandle);
            cleanUncommittedReactions();
        }
    };
    var resetCleanupScheduleForTests2 = function resetCleanupScheduleForTests2() {
        var e_1, _a2;
        if (uncommittedReactionRefs.size > 0) {
            try {
                for(var uncommittedReactionRefs_1 = __values(uncommittedReactionRefs), uncommittedReactionRefs_1_1 = uncommittedReactionRefs_1.next(); !uncommittedReactionRefs_1_1.done; uncommittedReactionRefs_1_1 = uncommittedReactionRefs_1.next()){
                    var ref = uncommittedReactionRefs_1_1.value;
                    var tracking = ref.current;
                    if (tracking) {
                        tracking.reaction.dispose();
                        ref.current = null;
                    }
                }
            } catch (e_1_1) {
                e_1 = {
                    error: e_1_1
                };
            } finally{
                try {
                    if (uncommittedReactionRefs_1_1 && !uncommittedReactionRefs_1_1.done && (_a2 = uncommittedReactionRefs_1.return)) _a2.call(uncommittedReactionRefs_1);
                } finally{
                    if (e_1) throw e_1.error;
                }
            }
            uncommittedReactionRefs.clear();
        }
        if (reactionCleanupHandle) {
            clearTimeout(reactionCleanupHandle);
            reactionCleanupHandle = void 0;
        }
    };
    var ensureCleanupTimerRunning = function ensureCleanupTimerRunning() {
        if (reactionCleanupHandle === void 0) {
            reactionCleanupHandle = setTimeout(cleanUncommittedReactions, CLEANUP_TIMER_LOOP_MILLIS);
        }
    };
    var scheduleCleanupOfReactionIfLeaked = function scheduleCleanupOfReactionIfLeaked(ref) {
        uncommittedReactionRefs.add(ref);
        ensureCleanupTimerRunning();
    };
    var recordReactionAsCommitted2 = function recordReactionAsCommitted2(reactionRef) {
        uncommittedReactionRefs.delete(reactionRef);
    };
    var cleanUncommittedReactions = function cleanUncommittedReactions() {
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
    };
    var uncommittedReactionRefs = /* @__PURE__ */ new Set();
    var reactionCleanupHandle;
    return {
        addReactionToTrack: function addReactionToTrack(reactionTrackingRef, reaction, objectRetainedByReact) {
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
init_cjs_shims();
var globalIsUsingStaticRendering = false;
function isUsingStaticRendering() {
    return globalIsUsingStaticRendering;
}
// ../../node_modules/mobx-react-lite/es/useObserver.js
var __read = function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while((n === void 0 || n-- > 0) && !(r = i.next()).done)ar.push(r.value);
    } catch (error) {
        e = {
            error: error
        };
    } finally{
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally{
            if (e) throw e.error;
        }
    }
    return ar;
};
function observerComponentNameFor(baseComponentName) {
    return "observer" + baseComponentName;
}
var ObjectToBeRetainedByReact = function() {
    var ObjectToBeRetainedByReact2 = function ObjectToBeRetainedByReact2() {
    };
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
    var _a2 = __read(import_react2.default.useState(objectToBeRetainedByReactFactory), 1), objectRetainedByReact = _a2[0];
    var _b = __read(import_react2.default.useState(), 2), setState = _b[1];
    var forceUpdate = function forceUpdate() {
        return setState([]);
    };
    var reactionTrackingRef = import_react2.default.useRef(null);
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
    import_react2.default.useDebugValue(reaction, printDebugValue);
    import_react2.default.useEffect(function() {
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
init_cjs_shims();
var import_react3 = require("react");
var __assign = function() {
    __assign = Object.assign || function(t) {
        for(var s, i = 1, n = arguments.length; i < n; i++){
            s = arguments[i];
            for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
function observer(baseComponent, options) {
    if (isUsingStaticRendering()) {
        return baseComponent;
    }
    var realOptions = __assign({
        forwardRef: false
    }, options);
    var baseComponentName = baseComponent.displayName || baseComponent.name;
    var wrappedComponent = function wrappedComponent(props, ref) {
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
        memoComponent = (0, import_react3.memo)((0, import_react3.forwardRef)(wrappedComponent));
    } else {
        memoComponent = (0, import_react3.memo)(wrappedComponent);
    }
    copyStaticProperties(baseComponent, memoComponent);
    memoComponent.displayName = baseComponentName;
    if (true) {
        Object.defineProperty(memoComponent, "contextTypes", {
            set: function set() {
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
init_cjs_shims();
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
    return new Error("Invalid prop `" + propFullName + "` of type `" + _typeof(props[key]) + "` supplied to `" + componentName + "`, expected `function`.");
}
// ../../node_modules/mobx-react-lite/es/useLocalObservable.js
init_cjs_shims();
var import_react4 = require("react");
// ../../node_modules/mobx-react-lite/es/useLocalStore.js
init_cjs_shims();
var import_react6 = require("react");
// ../../node_modules/mobx-react-lite/es/useAsObservableSource.js
init_cjs_shims();
var import_react5 = require("react");
// ../../node_modules/mobx-react-lite/es/index.js
observerBatching(import_react_dom.unstable_batchedUpdates);
// ../../packages/react/dist/esm/index.js
var React32 = __toESM(require("react"));
var React4 = __toESM(require("react"));
var React44 = __toESM(require("react"));
var React5 = __toESM(require("react"));
var React19 = __toESM(require("react"));
var React6 = __toESM(require("react"));
var React7 = __toESM(require("react"));
var React8 = __toESM(require("react"));
var React9 = __toESM(require("react"));
// ../../node_modules/@use-gesture/react/dist/use-gesture-react.esm.js
init_cjs_shims();
// ../../node_modules/@use-gesture/core/actions/dist/use-gesture-core-actions.esm.js
init_cjs_shims();
// ../../node_modules/@use-gesture/core/dist/actions-d9485484.esm.js
init_cjs_shims();
// ../../node_modules/@use-gesture/core/dist/maths-b2a210f4.esm.js
init_cjs_shims();
function clamp(v, min, max) {
    return Math.max(min, Math.min(v, max));
}
var V = {
    toVector: function(v, fallback) {
        if (v === void 0) v = fallback;
        return Array.isArray(v) ? v : [
            v,
            v
        ];
    },
    add: function(v1, v2) {
        return [
            v1[0] + v2[0],
            v1[1] + v2[1]
        ];
    },
    sub: function(v1, v2) {
        return [
            v1[0] - v2[0],
            v1[1] - v2[1]
        ];
    },
    addTo: function(v1, v2) {
        v1[0] += v2[0];
        v1[1] += v2[1];
    },
    subTo: function(v1, v2) {
        v1[0] -= v2[0];
        v1[1] -= v2[1];
    }
};
function rubberband(distance, dimension, constant) {
    if (dimension === 0 || Math.abs(dimension) === Infinity) return Math.pow(distance, constant * 5);
    return distance * dimension * constant / (dimension + constant * distance);
}
function rubberbandIfOutOfBounds(position, min, max, param) {
    var constant = param === void 0 ? 0.15 : param;
    if (constant === 0) return clamp(position, min, max);
    if (position < min) return -rubberband(min - position, max - min, constant) + min;
    if (position > max) return +rubberband(position - max, max - min, constant) + max;
    return position;
}
function computeRubberband(bounds, param, param5) {
    var _param = _slicedToArray(param, 2), Vx = _param[0], Vy = _param[1], _param1 = _slicedToArray(param5, 2), Rx = _param1[0], Ry = _param1[1];
    var _bounds = _slicedToArray(bounds, 2), ref = _slicedToArray(_bounds[0], 2), X0 = ref[0], X1 = ref[1], ref9 = _slicedToArray(_bounds[1], 2), Y0 = ref9[0], Y1 = ref9[1];
    return [
        rubberbandIfOutOfBounds(Vx, X0, X1, Rx),
        rubberbandIfOutOfBounds(Vy, Y0, Y1, Ry)
    ];
}
// ../../node_modules/@use-gesture/core/dist/actions-d9485484.esm.js
function _defineProperty1(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
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
    var _arguments = arguments, _loop = function(i) {
        var source = _arguments[i] != null ? _arguments[i] : {
        };
        if (i % 2) {
            ownKeys3(Object(source), true).forEach(function(key) {
                _defineProperty1(target, key, source[key]);
            });
        } else if (Object.getOwnPropertyDescriptors) {
            Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        } else {
            ownKeys3(Object(source)).forEach(function(key) {
                Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
            });
        }
    };
    for(var i = 1; i < arguments.length; i++)_loop(i);
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
    if (!string) return "";
    return string[0].toUpperCase() + string.slice(1);
}
function toHandlerProp(device, param, param6) {
    var action2 = param === void 0 ? "" : param, capture = param6 === void 0 ? false : param6;
    var deviceProps = EVENT_TYPE_MAP[device];
    var actionKey = deviceProps ? deviceProps[action2] || action2 : action2;
    return "on" + capitalize(device) + capitalize(actionKey) + (capture ? "Capture" : "");
}
function toDomEventType(device, param) {
    var action2 = param === void 0 ? "" : param;
    var deviceProps = EVENT_TYPE_MAP[device];
    var actionKey = deviceProps ? deviceProps[action2] || action2 : action2;
    return device + actionKey;
}
function isTouch(event) {
    return "touches" in event;
}
function getCurrentTargetTouchList(event) {
    return Array.from(event.touches).filter(function(e) {
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
    var dx = P2.clientX - P1.clientX;
    var dy = P2.clientY - P1.clientY;
    var cx = (P2.clientX + P1.clientX) / 2;
    var cy = (P2.clientY + P1.clientY) / 2;
    var distance = Math.hypot(dx, dy);
    var angle = -(Math.atan2(dx, dy) * 180) / Math.PI;
    var origin = [
        cx,
        cy
    ];
    return {
        angle: angle,
        distance: distance,
        origin: origin
    };
}
function touchIds(event) {
    return getCurrentTargetTouchList(event).map(function(touch) {
        return touch.identifier;
    });
}
function touchDistanceAngle(event, ids) {
    var ref = _slicedToArray(Array.from(event.touches).filter(function(touch) {
        return ids.includes(touch.identifier);
    }), 2), P1 = ref[0], P2 = ref[1];
    return distanceAngle(P1, P2);
}
function pointerId(event) {
    var valueEvent = getValueEvent(event);
    return isTouch(event) ? valueEvent.identifier : valueEvent.pointerId;
}
function pointerValues(event) {
    var valueEvent = getValueEvent(event);
    return [
        valueEvent.clientX,
        valueEvent.clientY
    ];
}
var LINE_HEIGHT = 40;
var PAGE_HEIGHT = 800;
function wheelValues(event) {
    var deltaX = event.deltaX, deltaY = event.deltaY, deltaMode = event.deltaMode;
    if (deltaMode === 1) {
        deltaX *= LINE_HEIGHT;
        deltaY *= LINE_HEIGHT;
    } else if (deltaMode === 2) {
        deltaX *= PAGE_HEIGHT;
        deltaY *= PAGE_HEIGHT;
    }
    return [
        deltaX,
        deltaY
    ];
}
function scrollValues(event) {
    var _ref, _ref2;
    var _currentTarget = event.currentTarget, scrollX = _currentTarget.scrollX, scrollY = _currentTarget.scrollY, scrollLeft = _currentTarget.scrollLeft, scrollTop = _currentTarget.scrollTop;
    return [
        (_ref = scrollX !== null && scrollX !== void 0 ? scrollX : scrollLeft) !== null && _ref !== void 0 ? _ref : 0,
        (_ref2 = scrollY !== null && scrollY !== void 0 ? scrollY : scrollTop) !== null && _ref2 !== void 0 ? _ref2 : 0
    ];
}
function getEventDetails(event) {
    var payload = {
    };
    if ("buttons" in event) payload.buttons = event.buttons;
    if ("shiftKey" in event) {
        var shiftKey = event.shiftKey, altKey = event.altKey, metaKey = event.metaKey, ctrlKey = event.ctrlKey;
        Object.assign(payload, {
            shiftKey: shiftKey,
            altKey: altKey,
            metaKey: metaKey,
            ctrlKey: ctrlKey
        });
    }
    return payload;
}
function call1(v) {
    for(var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
        args[_key - 1] = arguments[_key];
    }
    if (typeof v === "function") {
        return v.apply(void 0, _toConsumableArray(args));
    } else {
        return v;
    }
}
function noop3() {
}
function chain() {
    for(var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++){
        fns[_key] = arguments[_key];
    }
    if (fns.length === 0) return noop3;
    if (fns.length === 1) return fns[0];
    return function() {
        var result;
        var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
        try {
            for(var _iterator = fns[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                var fn = _step.value;
                result = fn.apply(this, arguments) || result;
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally{
            try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                }
            } finally{
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
        return result;
    };
}
function assignDefault(value, fallback) {
    return Object.assign({
    }, fallback, value || {
    });
}
var BEFORE_LAST_KINEMATICS_DELAY = 32;
var Engine1 = /*#__PURE__*/ function() {
    "use strict";
    function _class(ctrl, args, key) {
        _classCallCheck(this, _class);
        this.ctrl = ctrl;
        this.args = args;
        this.key = key;
        if (!this.state) {
            this.state = {
                values: [
                    0,
                    0
                ],
                initial: [
                    0,
                    0
                ]
            };
            if (this.init) this.init();
            this.reset();
        }
    }
    _createClass(_class, [
        {
            key: "state",
            get: function get() {
                return this.ctrl.state[this.key];
            },
            set: function set(state) {
                this.ctrl.state[this.key] = state;
            }
        },
        {
            key: "shared",
            get: function get() {
                return this.ctrl.state.shared;
            }
        },
        {
            key: "eventStore",
            get: function get() {
                return this.ctrl.gestureEventStores[this.key];
            }
        },
        {
            key: "timeoutStore",
            get: function get() {
                return this.ctrl.gestureTimeoutStores[this.key];
            }
        },
        {
            key: "config",
            get: function get() {
                return this.ctrl.config[this.key];
            }
        },
        {
            key: "sharedConfig",
            get: function get() {
                return this.ctrl.config.shared;
            }
        },
        {
            key: "handler",
            get: function get() {
                return this.ctrl.handlers[this.key];
            }
        },
        {
            key: "reset",
            value: function reset() {
                var ref = this, state = ref.state, shared = ref.shared, config = ref.config, ingKey = ref.ingKey, args = ref.args;
                var transform = config.transform, threshold = config.threshold;
                shared[ingKey] = state._active = state.active = state._blocked = state._force = false;
                state._step = [
                    false,
                    false
                ];
                state.intentional = false;
                state._movement = [
                    0,
                    0
                ];
                state._distance = [
                    0,
                    0
                ];
                state._delta = [
                    0,
                    0
                ];
                state._threshold = V.sub(transform(threshold), transform([
                    0,
                    0
                ])).map(Math.abs);
                state._bounds = [
                    [
                        -Infinity,
                        Infinity
                    ],
                    [
                        -Infinity,
                        Infinity
                    ]
                ];
                state.args = args;
                state.axis = void 0;
                state.memo = void 0;
                state.elapsedTime = 0;
                state.direction = [
                    0,
                    0
                ];
                state.distance = [
                    0,
                    0
                ];
                state.velocity = [
                    0,
                    0
                ];
                state.movement = [
                    0,
                    0
                ];
                state.delta = [
                    0,
                    0
                ];
                state.timeStamp = 0;
            }
        },
        {
            key: "start",
            value: function start(event) {
                var state = this.state;
                var config = this.config;
                if (!state._active) {
                    this.reset();
                    state._active = true;
                    state.target = event.target;
                    state.currentTarget = event.currentTarget;
                    state.initial = state.values;
                    state.lastOffset = config.from ? call1(config.from, state) : state.offset;
                    state.offset = state.lastOffset;
                }
                state.startTime = state.timeStamp = event.timeStamp;
            }
        },
        {
            key: "compute",
            value: function compute(event) {
                var ref = this, state = ref.state, config = ref.config, shared = ref.shared;
                state.args = this.args;
                var dt = 0;
                if (event) {
                    state.event = event;
                    if (config.preventDefault && event.cancelable) state.event.preventDefault();
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
                    var _absoluteDelta = state._delta.map(Math.abs);
                    V.addTo(state._distance, _absoluteDelta);
                }
                var ref10 = _slicedToArray(config.transform(state._movement), 2), _m0 = ref10[0], _m1 = ref10[1];
                if (true) {
                    var isNumberAndNotNaN = function(v) {
                        return typeof v === "number" && !Number.isNaN(v);
                    };
                    if (!isNumberAndNotNaN(_m0) || !isNumberAndNotNaN(_m1)) {
                        console.warn("[@use-gesture]: config.transform() must produce a valid result, but it was: [".concat(_m0, ",").concat(_m1, "]"));
                    }
                }
                var __threshold = _slicedToArray(state._threshold, 2), _t0 = __threshold[0], _t1 = __threshold[1];
                var __step = _slicedToArray(state._step, 2), _s0 = __step[0], _s1 = __step[1];
                if (_s0 === false) _s0 = Math.abs(_m0) >= _t0 && Math.sign(_m0) * _t0;
                if (_s1 === false) _s1 = Math.abs(_m1) >= _t1 && Math.sign(_m1) * _t1;
                state.intentional = _s0 !== false || _s1 !== false;
                if (!state.intentional) return;
                state._step = [
                    _s0,
                    _s1
                ];
                var movement = [
                    0,
                    0
                ];
                movement[0] = _s0 !== false ? _m0 - _s0 : 0;
                movement[1] = _s1 !== false ? _m1 - _s1 : 0;
                if (this.intent) this.intent(movement);
                if (state._active && !state._blocked || state.active) {
                    state.first = state._active && !state.active;
                    state.last = !state._active && state.active;
                    state.active = shared[this.ingKey] = state._active;
                    if (event) {
                        if (state.first) {
                            if ("bounds" in config) state._bounds = call1(config.bounds, state);
                            if (this.setup) this.setup();
                        }
                        state.movement = movement;
                        var previousOffset = state.offset;
                        this.computeOffset();
                        if (!state.last || dt > BEFORE_LAST_KINEMATICS_DELAY) {
                            state.delta = V.sub(state.offset, previousOffset);
                            var absoluteDelta = state.delta.map(Math.abs);
                            V.addTo(state.distance, absoluteDelta);
                            state.direction = state.delta.map(Math.sign);
                            if (!state.first && dt > 0) {
                                state.velocity = [
                                    absoluteDelta[0] / dt,
                                    absoluteDelta[1] / dt
                                ];
                            }
                        }
                    }
                }
                var rubberband2 = state._active ? config.rubberband || [
                    0,
                    0
                ] : [
                    0,
                    0
                ];
                state.offset = computeRubberband(state._bounds, state.offset, rubberband2);
                this.computeMovement();
            }
        },
        {
            key: "emit",
            value: function emit() {
                var state = this.state;
                var shared = this.shared;
                var config = this.config;
                if (!state._active) this.clean();
                if ((state._blocked || !state.intentional) && !state._force && !config.triggerAllEvents) return;
                var memo3 = this.handler(_objectSpread2(_objectSpread2(_objectSpread2({
                }, shared), state), {
                }, _defineProperty({
                }, this.aliasKey, state.values)));
                if (memo3 !== void 0) state.memo = memo3;
            }
        },
        {
            key: "clean",
            value: function clean() {
                this.eventStore.clean();
                this.timeoutStore.clean();
            }
        }
    ]);
    return _class;
}();
function selectAxis(param) {
    var _param = _slicedToArray(param, 2), dx = _param[0], dy = _param[1];
    var d = Math.abs(dx) - Math.abs(dy);
    if (d > 0) return "x";
    if (d < 0) return "y";
    return void 0;
}
function restrictVectorToAxis(v, axis) {
    switch(axis){
        case "x":
            v[1] = 0;
            break;
        case "y":
            v[0] = 0;
            break;
    }
}
var CoordinatesEngine1 = /*#__PURE__*/ function(Engine) {
    "use strict";
    _inherits(_class, Engine);
    var _super = _createSuper(_class);
    function _class() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(_toConsumableArray(args)));
        _defineProperty1(_assertThisInitialized(_this), "aliasKey", "xy");
        return _this;
    }
    _createClass(_class, [
        {
            key: "reset",
            value: function reset() {
                _get(_getPrototypeOf(_class.prototype), "reset", this).call(this);
                this.state.axis = void 0;
            }
        },
        {
            key: "init",
            value: function init() {
                this.state.offset = [
                    0,
                    0
                ];
                this.state.lastOffset = [
                    0,
                    0
                ];
            }
        },
        {
            key: "computeOffset",
            value: function computeOffset() {
                this.state.offset = V.add(this.state.lastOffset, this.state.movement);
            }
        },
        {
            key: "computeMovement",
            value: function computeMovement() {
                this.state.movement = V.sub(this.state.offset, this.state.lastOffset);
            }
        },
        {
            key: "intent",
            value: function intent(v) {
                this.state.axis = this.state.axis || selectAxis(v);
                this.state._blocked = (this.config.lockDirection || !!this.config.axis) && !this.state.axis || !!this.config.axis && this.config.axis !== this.state.axis;
                if (this.state._blocked) return;
                if (this.config.axis || this.config.lockDirection) {
                    restrictVectorToAxis(v, this.state.axis);
                }
            }
        }
    ]);
    return _class;
}(Engine1);
var DEFAULT_RUBBERBAND = 0.15;
var commonConfigResolver = {
    enabled: function(param) {
        var value = param === void 0 ? true : param;
        return value;
    },
    preventDefault: function(param) {
        var value = param === void 0 ? false : param;
        return value;
    },
    triggerAllEvents: function(param) {
        var value = param === void 0 ? false : param;
        return value;
    },
    rubberband: function(param) {
        var value = param === void 0 ? 0 : param;
        switch(value){
            case true:
                return [
                    DEFAULT_RUBBERBAND,
                    DEFAULT_RUBBERBAND
                ];
            case false:
                return [
                    0,
                    0
                ];
            default:
                return V.toVector(value);
        }
    },
    from: function(value) {
        if (typeof value === "function") return value;
        if (value != null) return V.toVector(value);
    },
    transform: function(value, _k, config) {
        return value || config.shared.transform;
    },
    threshold: function(value) {
        return V.toVector(value, 0);
    }
};
if (true) {
    Object.assign(commonConfigResolver, {
        domTarget: function(value) {
            if (value !== void 0) {
                throw Error("[@use-gesture]: `domTarget` option has been renamed to `target`.");
            }
        },
        lockDirection: function(value) {
            if (value !== void 0) {
                throw Error("[@use-gesture]: `lockDirection` option has been merged with `axis`. Use it as in `{ axis: 'lock' }`");
            }
        },
        initial: function(value) {
            if (value !== void 0) {
                throw Error("[@use-gesture]: `initial` option has been renamed to `from`.");
            }
        }
    });
}
var coordinatesConfigResolver = _objectSpread2(_objectSpread2({
}, commonConfigResolver), {
}, {
    axis: function(_v, _k, param) {
        var axis = param.axis;
        this.lockDirection = axis === "lock";
        if (!this.lockDirection) return axis;
    },
    bounds: function(param) {
        var value = param === void 0 ? {
        } : param;
        if (typeof value === "function") {
            return function(state) {
                return coordinatesConfigResolver.bounds(value(state));
            };
        }
        if ("current" in value) {
            return function() {
                return value.current;
            };
        }
        if (typeof HTMLElement === "function" && _instanceof(value, HTMLElement)) {
            return value;
        }
        var _left = value.left, left = _left === void 0 ? -Infinity : _left, _right = value.right, right = _right === void 0 ? Infinity : _right, _top = value.top, top = _top === void 0 ? -Infinity : _top, _bottom = value.bottom, bottom = _bottom === void 0 ? Infinity : _bottom;
        return [
            [
                left,
                right
            ],
            [
                top,
                bottom
            ]
        ];
    }
});
var DISPLACEMENT = 10;
var KEYS_DELTA_MAP = {
    ArrowRight: function(param) {
        var factor = param === void 0 ? 1 : param;
        return [
            DISPLACEMENT * factor,
            0
        ];
    },
    ArrowLeft: function(param) {
        var factor = param === void 0 ? 1 : param;
        return [
            -DISPLACEMENT * factor,
            0
        ];
    },
    ArrowUp: function(param) {
        var factor = param === void 0 ? 1 : param;
        return [
            0,
            -DISPLACEMENT * factor
        ];
    },
    ArrowDown: function(param) {
        var factor = param === void 0 ? 1 : param;
        return [
            0,
            DISPLACEMENT * factor
        ];
    }
};
var DragEngine = /*#__PURE__*/ function(CoordinatesEngine) {
    "use strict";
    _inherits(_class, CoordinatesEngine);
    var _super = _createSuper(_class);
    function _class() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(_toConsumableArray(args)));
        _defineProperty1(_assertThisInitialized(_this), "ingKey", "dragging");
        return _this;
    }
    _createClass(_class, [
        {
            key: "reset",
            value: function reset() {
                _get(_getPrototypeOf(_class.prototype), "reset", this).call(this);
                var state = this.state;
                state._pointerId = void 0;
                state._pointerActive = false;
                state._keyboardActive = false;
                state._preventScroll = false;
                state._delayed = false;
                state.swipe = [
                    0,
                    0
                ];
                state.tap = false;
                state.canceled = false;
                state.cancel = this.cancel.bind(this);
            }
        },
        {
            key: "setup",
            value: function setup() {
                var state = this.state;
                if (_instanceof(state._bounds, HTMLElement)) {
                    var boundRect = state._bounds.getBoundingClientRect();
                    var targetRect = state.currentTarget.getBoundingClientRect();
                    var _bounds = {
                        left: boundRect.left - targetRect.left + state.offset[0],
                        right: boundRect.right - targetRect.right + state.offset[0],
                        top: boundRect.top - targetRect.top + state.offset[1],
                        bottom: boundRect.bottom - targetRect.bottom + state.offset[1]
                    };
                    state._bounds = coordinatesConfigResolver.bounds(_bounds);
                }
            }
        },
        {
            key: "cancel",
            value: function cancel() {
                var _this = this;
                var state = this.state;
                if (state.canceled) return;
                state.canceled = true;
                state._active = false;
                setTimeout(function() {
                    _this.compute();
                    _this.emit();
                }, 0);
            }
        },
        {
            key: "setActive",
            value: function setActive() {
                this.state._active = this.state._pointerActive || this.state._keyboardActive;
            }
        },
        {
            key: "clean",
            value: function clean() {
                this.pointerClean();
                this.state._pointerActive = false;
                this.state._keyboardActive = false;
                _get(_getPrototypeOf(_class.prototype), "clean", this).call(this);
            }
        },
        {
            key: "pointerDown",
            value: function pointerDown(event) {
                var config = this.config;
                var state = this.state;
                if (event.buttons != null && (Array.isArray(config.pointerButtons) ? !config.pointerButtons.includes(event.buttons) : config.pointerButtons !== -1 && config.pointerButtons !== event.buttons)) return;
                this.ctrl.setEventIds(event);
                if (config.pointerCapture) {
                    event.target.setPointerCapture(event.pointerId);
                }
                if (state._pointerActive) return;
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
        },
        {
            key: "startPointerDrag",
            value: function startPointerDrag(event) {
                var state = this.state;
                state._active = true;
                state._preventScroll = true;
                state._delayed = false;
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "pointerMove",
            value: function pointerMove(event) {
                var state = this.state;
                var config = this.config;
                if (!state._pointerActive) return;
                if (state.type === event.type && event.timeStamp === state.timeStamp) return;
                var id = pointerId(event);
                if (state._pointerId && id !== state._pointerId) return;
                var values = pointerValues(event);
                if (document.pointerLockElement === event.target) {
                    state._delta = [
                        event.movementX,
                        event.movementY
                    ];
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
        },
        {
            key: "pointerUp",
            value: function pointerUp(event) {
                this.ctrl.setEventIds(event);
                try {
                    if (this.config.pointerCapture && event.target.hasPointerCapture(event.pointerId)) {
                        ;
                        event.target.releasePointerCapture(event.pointerId);
                    }
                } catch (_unused) {
                    if (true) {
                        console.warn("[@use-gesture]: If you see this message, it's likely that you're using an outdated version of `@react-three/fiber`. \n\nPlease upgrade to the latest version.");
                    }
                }
                var state = this.state;
                var config = this.config;
                if (!state._pointerActive) return;
                var id = pointerId(event);
                if (state._pointerId && id !== state._pointerId) return;
                this.state._pointerActive = false;
                this.setActive();
                this.compute(event);
                var __distance = _slicedToArray(state._distance, 2), dx = __distance[0], dy = __distance[1];
                state.tap = dx <= 3 && dy <= 3;
                if (state.tap && config.filterTaps) {
                    state._force = true;
                } else {
                    var _direction = _slicedToArray(state.direction, 2), dirx = _direction[0], diry = _direction[1];
                    var _velocity = _slicedToArray(state.velocity, 2), vx = _velocity[0], vy = _velocity[1];
                    var _movement = _slicedToArray(state.movement, 2), mx = _movement[0], my = _movement[1];
                    var _velocity1 = _slicedToArray(config.swipe.velocity, 2), svx = _velocity1[0], svy = _velocity1[1];
                    var _distance = _slicedToArray(config.swipe.distance, 2), sx = _distance[0], sy = _distance[1];
                    var sdt = config.swipe.duration;
                    if (state.elapsedTime < sdt) {
                        if (Math.abs(vx) > svx && Math.abs(mx) > sx) state.swipe[0] = dirx;
                        if (Math.abs(vy) > svy && Math.abs(my) > sy) state.swipe[1] = diry;
                    }
                }
                this.emit();
            }
        },
        {
            key: "pointerClick",
            value: function pointerClick(event) {
                if (!this.state.tap) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        },
        {
            key: "setupPointer",
            value: function setupPointer(event) {
                var config = this.config;
                var device = config.device;
                if (true) {
                    try {
                        if (device === "pointer") {
                            var currentTarget = "uv" in event ? event.sourceEvent.currentTarget : event.currentTarget;
                            var style = window.getComputedStyle(currentTarget);
                            if (style.touchAction === "auto") {
                                console.warn("[@use-gesture]: The drag target has its `touch-action` style property set to `auto`. It is recommended to add `touch-action: 'none'` so that the drag gesture behaves correctly on touch-enabled devices. For more information read this: https://use-gesture.netlify.app/docs/extras/#touch-action.\n\nThis message will only show in development mode. It won't appear in production. If this is intended, you can ignore it.", currentTarget);
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
        },
        {
            key: "pointerClean",
            value: function pointerClean() {
                if (this.config.pointerLock && document.pointerLockElement === this.state.currentTarget) {
                    document.exitPointerLock();
                }
            }
        },
        {
            key: "preventScroll",
            value: function preventScroll(event) {
                if (this.state._preventScroll && event.cancelable) {
                    event.preventDefault();
                }
            }
        },
        {
            key: "setupScrollPrevention",
            value: function setupScrollPrevention(event) {
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
        },
        {
            key: "setupDelayTrigger",
            value: function setupDelayTrigger(event) {
                this.state._delayed = true;
                this.timeoutStore.add("dragDelay", this.startPointerDrag.bind(this), this.config.delay, event);
            }
        },
        {
            key: "keyDown",
            value: function keyDown(event) {
                var deltaFn = KEYS_DELTA_MAP[event.key];
                var state = this.state;
                if (deltaFn) {
                    var factor = event.shiftKey ? 10 : event.altKey ? 0.1 : 1;
                    state._delta = deltaFn(factor);
                    this.start(event);
                    state._keyboardActive = true;
                    V.addTo(state._movement, state._delta);
                    this.compute(event);
                    this.emit();
                }
            }
        },
        {
            key: "keyUp",
            value: function keyUp(event) {
                if (!(event.key in KEYS_DELTA_MAP)) return;
                this.state._keyboardActive = false;
                this.setActive();
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "bind",
            value: function bind(bindFunction) {
                var device = this.config.device;
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
        }
    ]);
    return _class;
}(CoordinatesEngine1);
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
    isBrowser: isBrowser,
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
var _obj3;
var dragConfigResolver = _objectSpread2(_objectSpread2({
}, coordinatesConfigResolver), {
}, (_obj3 = {
    pointerLock: function(_v, _k, param) {
        var tmp = param.pointer, ref = tmp === void 0 ? {
        } : tmp, _lock = ref.lock, lock = _lock === void 0 ? false : _lock, _touch = ref.touch, touch = _touch === void 0 ? false : _touch;
        this.useTouch = SUPPORT.touch && touch;
        return SUPPORT.pointerLock && lock;
    },
    device: function(_v, _k) {
        if (this.useTouch) return "touch";
        if (this.pointerLock) return "mouse";
        if (SUPPORT.pointer) return "pointer";
        if (SUPPORT.touch) return "touch";
        return "mouse";
    },
    preventScroll: function(param, _k, param7) {
        var value = param === void 0 ? false : param, _preventScrollAxis = param7.preventScrollAxis, preventScrollAxis = _preventScrollAxis === void 0 ? "y" : _preventScrollAxis;
        if (preventScrollAxis) this.preventScrollAxis = preventScrollAxis;
        if (!SUPPORT.touchscreen) return false;
        if (typeof value === "number") return value;
        return value ? DEFAULT_PREVENT_SCROLL_DELAY : false;
    }
}, _defineProperty(_obj3, "pointerCapture", function(_v, _k, param) {
    var tmp = param["pointer"], ref = tmp === void 0 ? {
    } : tmp, _capture = ref.capture, capture = _capture === void 0 ? true : _capture, _buttons = ref.buttons, buttons = _buttons === void 0 ? 1 : _buttons;
    this.pointerButtons = buttons;
    return !this.pointerLock && this.device === "pointer" && capture;
}), _defineProperty(_obj3, "threshold", function(value, _k, param) {
    var _filterTaps = param.filterTaps, filterTaps = _filterTaps === void 0 ? false : _filterTaps, _axis = param.axis, axis = _axis === void 0 ? void 0 : _axis;
    var threshold = V.toVector(value, filterTaps ? 3 : axis ? 1 : 0);
    this.filterTaps = filterTaps;
    return threshold;
}), _defineProperty(_obj3, "swipe", function(param) {
    var ref = param === void 0 ? {
    } : param, _velocity = ref.velocity, velocity = _velocity === void 0 ? DEFAULT_SWIPE_VELOCITY : _velocity, _distance = ref.distance, distance = _distance === void 0 ? DEFAULT_SWIPE_DISTANCE : _distance, _duration = ref.duration, duration = _duration === void 0 ? DEFAULT_SWIPE_DURATION : _duration;
    return {
        velocity: this.transform(V.toVector(velocity)),
        distance: this.transform(V.toVector(distance)),
        duration: duration
    };
}), _defineProperty(_obj3, "delay", function(param) {
    var value = param === void 0 ? 0 : param;
    switch(value){
        case true:
            return DEFAULT_DRAG_DELAY;
        case false:
            return 0;
        default:
            return value;
    }
}), _obj3));
if (true) {
    Object.assign(dragConfigResolver, {
        useTouch: function(value) {
            if (value !== void 0) {
                throw Error("[@use-gesture]: `useTouch` option has been renamed to `pointer.touch`. Use it as in `{ pointer: { touch: true } }`.");
            }
        },
        experimental_preventWindowScrollY: function(value) {
            if (value !== void 0) {
                throw Error("[@use-gesture]: `experimental_preventWindowScrollY` option has been renamed to `preventScroll`.");
            }
        },
        swipeVelocity: function(value) {
            if (value !== void 0) {
                throw Error("[@use-gesture]: `swipeVelocity` option has been renamed to `swipe.velocity`. Use it as in `{ swipe: { velocity: 0.5 } }`.");
            }
        },
        swipeDistance: function(value) {
            if (value !== void 0) {
                throw Error("[@use-gesture]: `swipeDistance` option has been renamed to `swipe.distance`. Use it as in `{ swipe: { distance: 50 } }`.");
            }
        },
        swipeDuration: function(value) {
            if (value !== void 0) {
                throw Error("[@use-gesture]: `swipeDuration` option has been renamed to `swipe.duration`. Use it as in `{ swipe: { duration: 250 } }`.");
            }
        }
    });
}
var SCALE_ANGLE_RATIO_INTENT_DEG = 30;
var PINCH_WHEEL_RATIO = 36;
var PinchEngine = /*#__PURE__*/ function(Engine) {
    "use strict";
    _inherits(_class, Engine);
    var _super = _createSuper(_class);
    function _class() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(_toConsumableArray(args)));
        _defineProperty1(_assertThisInitialized(_this), "ingKey", "pinching");
        _defineProperty1(_assertThisInitialized(_this), "aliasKey", "da");
        return _this;
    }
    _createClass(_class, [
        {
            key: "init",
            value: function init() {
                this.state.offset = [
                    1,
                    0
                ];
                this.state.lastOffset = [
                    1,
                    0
                ];
                this.state._pointerEvents = /* @__PURE__ */ new Map();
            }
        },
        {
            key: "reset",
            value: function reset() {
                _get(_getPrototypeOf(_class.prototype), "reset", this).call(this);
                var state = this.state;
                state._touchIds = [];
                state.canceled = false;
                state.cancel = this.cancel.bind(this);
                state.turns = 0;
            }
        },
        {
            key: "computeOffset",
            value: function computeOffset() {
                var _state = this.state, type = _state.type, movement = _state.movement, lastOffset = _state.lastOffset;
                if (type === "wheel") {
                    this.state.offset = V.add(movement, lastOffset);
                } else {
                    this.state.offset = [
                        (1 + movement[0]) * lastOffset[0],
                        movement[1] + lastOffset[1]
                    ];
                }
            }
        },
        {
            key: "computeMovement",
            value: function computeMovement() {
                var _state = this.state, offset = _state.offset, lastOffset = _state.lastOffset;
                this.state.movement = [
                    offset[0] / lastOffset[0],
                    offset[1] - lastOffset[1]
                ];
            }
        },
        {
            key: "intent",
            value: function intent(v) {
                var state = this.state;
                if (!state.axis) {
                    var axisMovementDifference = Math.abs(v[0]) * SCALE_ANGLE_RATIO_INTENT_DEG - Math.abs(v[1]);
                    if (axisMovementDifference < 0) state.axis = "angle";
                    else if (axisMovementDifference > 0) state.axis = "scale";
                }
                if (this.config.lockDirection) {
                    if (state.axis === "scale") v[1] = 0;
                    else if (state.axis === "angle") v[0] = 0;
                }
            }
        },
        {
            key: "cancel",
            value: function cancel() {
                var _this = this;
                var state = this.state;
                if (state.canceled) return;
                setTimeout(function() {
                    state.canceled = true;
                    state._active = false;
                    _this.compute();
                    _this.emit();
                }, 0);
            }
        },
        {
            key: "touchStart",
            value: function touchStart(event) {
                this.ctrl.setEventIds(event);
                var state = this.state;
                var ctrlTouchIds = this.ctrl.touchIds;
                if (state._active) {
                    if (state._touchIds.every(function(id) {
                        return ctrlTouchIds.has(id);
                    })) return;
                }
                if (ctrlTouchIds.size < 2) return;
                this.start(event);
                state._touchIds = Array.from(ctrlTouchIds).slice(0, 2);
                var payload = touchDistanceAngle(event, state._touchIds);
                this.pinchStart(event, payload);
            }
        },
        {
            key: "pointerStart",
            value: function pointerStart(event) {
                if (event.buttons != null && event.buttons % 2 !== 1) return;
                this.ctrl.setEventIds(event);
                event.target.setPointerCapture(event.pointerId);
                var state = this.state;
                var _pointerEvents = state._pointerEvents;
                var ctrlPointerIds = this.ctrl.pointerIds;
                if (state._active) {
                    if (Array.from(_pointerEvents.keys()).every(function(id) {
                        return ctrlPointerIds.has(id);
                    })) return;
                }
                if (_pointerEvents.size < 2) {
                    _pointerEvents.set(event.pointerId, event);
                }
                if (state._pointerEvents.size < 2) return;
                this.start(event);
                var payload = distanceAngle.apply(void 0, _toConsumableArray(Array.from(_pointerEvents.values())));
                this.pinchStart(event, payload);
            }
        },
        {
            key: "pinchStart",
            value: function pinchStart(event, payload) {
                var state = this.state;
                state.origin = payload.origin;
                state.values = [
                    payload.distance,
                    payload.angle
                ];
                state.initial = state.values;
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "touchMove",
            value: function touchMove(event) {
                if (!this.state._active) return;
                var payload = touchDistanceAngle(event, this.state._touchIds);
                this.pinchMove(event, payload);
            }
        },
        {
            key: "pointerMove",
            value: function pointerMove(event) {
                var _pointerEvents = this.state._pointerEvents;
                if (_pointerEvents.has(event.pointerId)) {
                    _pointerEvents.set(event.pointerId, event);
                }
                if (!this.state._active) return;
                var payload = distanceAngle.apply(void 0, _toConsumableArray(Array.from(_pointerEvents.values())));
                this.pinchMove(event, payload);
            }
        },
        {
            key: "pinchMove",
            value: function pinchMove(event, payload) {
                var state = this.state;
                var prev_a = state.values[1];
                var delta_a = payload.angle - prev_a;
                var delta_turns = 0;
                if (Math.abs(delta_a) > 270) delta_turns += Math.sign(delta_a);
                state.values = [
                    payload.distance,
                    payload.angle - 360 * delta_turns
                ];
                state.origin = payload.origin;
                state.turns = delta_turns;
                state._movement = [
                    state.values[0] / state.initial[0] - 1,
                    state.values[1] - state.initial[1]
                ];
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "touchEnd",
            value: function touchEnd(event) {
                var _this = this;
                this.ctrl.setEventIds(event);
                if (!this.state._active) return;
                if (this.state._touchIds.some(function(id) {
                    return !_this.ctrl.touchIds.has(id);
                })) {
                    this.state._active = false;
                    this.compute(event);
                    this.emit();
                }
            }
        },
        {
            key: "pointerEnd",
            value: function pointerEnd(event) {
                var state = this.state;
                this.ctrl.setEventIds(event);
                try {
                    event.target.releasePointerCapture(event.pointerId);
                } catch (_unused) {
                }
                if (state._pointerEvents.has(event.pointerId)) {
                    state._pointerEvents.delete(event.pointerId);
                }
                if (!state._active) return;
                if (state._pointerEvents.size < 2) {
                    state._active = false;
                    this.compute(event);
                    this.emit();
                }
            }
        },
        {
            key: "gestureStart",
            value: function gestureStart(event) {
                if (event.cancelable) event.preventDefault();
                var state = this.state;
                if (state._active) return;
                this.start(event);
                state.values = [
                    event.scale,
                    event.rotation
                ];
                state.origin = [
                    event.clientX,
                    event.clientY
                ];
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "gestureMove",
            value: function gestureMove(event) {
                if (event.cancelable) event.preventDefault();
                if (!this.state._active) return;
                var state = this.state;
                state.values = [
                    event.scale,
                    event.rotation
                ];
                state.origin = [
                    event.clientX,
                    event.clientY
                ];
                var _previousMovement = state._movement;
                state._movement = [
                    event.scale - 1,
                    event.rotation
                ];
                state._delta = V.sub(state._movement, _previousMovement);
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "gestureEnd",
            value: function gestureEnd(event) {
                if (!this.state._active) return;
                this.state._active = false;
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "wheel",
            value: function wheel(event) {
                if (!event.ctrlKey) return;
                if (!this.state._active) this.wheelStart(event);
                else this.wheelChange(event);
                this.timeoutStore.add("wheelEnd", this.wheelEnd.bind(this));
            }
        },
        {
            key: "wheelStart",
            value: function wheelStart(event) {
                this.start(event);
                this.wheelChange(event);
            }
        },
        {
            key: "wheelChange",
            value: function wheelChange(event) {
                var isR3f = "uv" in event;
                if (!isR3f) {
                    if (event.cancelable) {
                        event.preventDefault();
                    }
                    if (!event.defaultPrevented) {
                        console.warn("[@use-gesture]: To properly support zoom on trackpads, try using the `target` option.\n\nThis message will only appear in development mode.");
                    }
                }
                var state = this.state;
                state._delta = [
                    -wheelValues(event)[1] / PINCH_WHEEL_RATIO * state.offset[0],
                    0
                ];
                V.addTo(state._movement, state._delta);
                this.state.origin = [
                    event.clientX,
                    event.clientY
                ];
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "wheelEnd",
            value: function wheelEnd() {
                if (!this.state._active) return;
                this.state._active = false;
                this.compute();
                this.emit();
            }
        },
        {
            key: "bind",
            value: function bind(bindFunction) {
                var device = this.config.device;
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
        }
    ]);
    return _class;
}(Engine1);
var pinchConfigResolver = _objectSpread2(_objectSpread2({
}, commonConfigResolver), {
}, {
    useTouch: function(_v, _k, param) {
        var tmp = param.pointer, ref = tmp === void 0 ? {
        } : tmp, _touch = ref.touch, touch = _touch === void 0 ? false : _touch;
        return SUPPORT.touch && touch;
    },
    device: function(_v, _k, config) {
        var sharedConfig = config.shared;
        if (sharedConfig.target && !SUPPORT.touch && SUPPORT.gesture) return "gesture";
        if (this.useTouch) return "touch";
        if (SUPPORT.touchscreen) {
            if (SUPPORT.pointer) return "pointer";
            if (SUPPORT.touch) return "touch";
        }
    },
    bounds: function(_v, _k, param) {
        var _scaleBounds = param.scaleBounds, scaleBounds = _scaleBounds === void 0 ? {
        } : _scaleBounds, _angleBounds = param.angleBounds, angleBounds = _angleBounds === void 0 ? {
        } : _angleBounds;
        var _scaleBounds1 = function(state) {
            var D = assignDefault(call1(scaleBounds, state), {
                min: -Infinity,
                max: Infinity
            });
            return [
                D.min,
                D.max
            ];
        };
        var _angleBounds1 = function(state) {
            var A = assignDefault(call1(angleBounds, state), {
                min: -Infinity,
                max: Infinity
            });
            return [
                A.min,
                A.max
            ];
        };
        if (typeof scaleBounds !== "function" && typeof angleBounds !== "function") return [
            _scaleBounds1(),
            _angleBounds1()
        ];
        return function(state) {
            return [
                _scaleBounds1(state),
                _angleBounds1(state)
            ];
        };
    },
    threshold: function(value, _k, config) {
        this.lockDirection = config.axis === "lock";
        var threshold = V.toVector(value, this.lockDirection ? [
            0.1,
            3
        ] : 0);
        return threshold;
    }
});
var MoveEngine = /*#__PURE__*/ function(CoordinatesEngine) {
    "use strict";
    _inherits(_class, CoordinatesEngine);
    var _super = _createSuper(_class);
    function _class() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(_toConsumableArray(args)));
        _defineProperty1(_assertThisInitialized(_this), "ingKey", "moving");
        return _this;
    }
    _createClass(_class, [
        {
            key: "move",
            value: function move(event) {
                if (this.config.mouseOnly && event.pointerType !== "mouse") return;
                if (!this.state._active) this.moveStart(event);
                else this.moveChange(event);
                this.timeoutStore.add("moveEnd", this.moveEnd.bind(this));
            }
        },
        {
            key: "moveStart",
            value: function moveStart(event) {
                this.start(event);
                var state = this.state;
                state.values = pointerValues(event);
                this.compute(event);
                state.initial = state.values;
                this.emit();
            }
        },
        {
            key: "moveChange",
            value: function moveChange(event) {
                if (!this.state._active) return;
                var values = pointerValues(event);
                var state = this.state;
                state._delta = V.sub(values, state.values);
                V.addTo(state._movement, state._delta);
                state.values = values;
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "moveEnd",
            value: function moveEnd(event) {
                if (!this.state._active) return;
                this.state._active = false;
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "bind",
            value: function bind(bindFunction) {
                bindFunction("pointer", "change", this.move.bind(this));
                bindFunction("pointer", "leave", this.moveEnd.bind(this));
            }
        }
    ]);
    return _class;
}(CoordinatesEngine1);
var moveConfigResolver = _objectSpread2(_objectSpread2({
}, coordinatesConfigResolver), {
}, {
    mouseOnly: function(param) {
        var value = param === void 0 ? true : param;
        return value;
    }
});
var ScrollEngine = /*#__PURE__*/ function(CoordinatesEngine) {
    "use strict";
    _inherits(_class, CoordinatesEngine);
    var _super = _createSuper(_class);
    function _class() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(_toConsumableArray(args)));
        _defineProperty1(_assertThisInitialized(_this), "ingKey", "scrolling");
        return _this;
    }
    _createClass(_class, [
        {
            key: "scroll",
            value: function scroll(event) {
                if (!this.state._active) this.start(event);
                this.scrollChange(event);
                this.timeoutStore.add("scrollEnd", this.scrollEnd.bind(this));
            }
        },
        {
            key: "scrollChange",
            value: function scrollChange(event) {
                if (event.cancelable) event.preventDefault();
                var state = this.state;
                var values = scrollValues(event);
                state._delta = V.sub(values, state.values);
                V.addTo(state._movement, state._delta);
                state.values = values;
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "scrollEnd",
            value: function scrollEnd() {
                if (!this.state._active) return;
                this.state._active = false;
                this.compute();
                this.emit();
            }
        },
        {
            key: "bind",
            value: function bind(bindFunction) {
                bindFunction("scroll", "", this.scroll.bind(this));
            }
        }
    ]);
    return _class;
}(CoordinatesEngine1);
var scrollConfigResolver = coordinatesConfigResolver;
var WheelEngine = /*#__PURE__*/ function(CoordinatesEngine) {
    "use strict";
    _inherits(_class, CoordinatesEngine);
    var _super = _createSuper(_class);
    function _class() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(_toConsumableArray(args)));
        _defineProperty1(_assertThisInitialized(_this), "ingKey", "wheeling");
        return _this;
    }
    _createClass(_class, [
        {
            key: "wheel",
            value: function wheel(event) {
                if (!this.state._active) this.start(event);
                this.wheelChange(event);
                this.timeoutStore.add("wheelEnd", this.wheelEnd.bind(this));
            }
        },
        {
            key: "wheelChange",
            value: function wheelChange(event) {
                var state = this.state;
                state._delta = wheelValues(event);
                V.addTo(this.state._movement, state._delta);
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "wheelEnd",
            value: function wheelEnd() {
                if (!this.state._active) return;
                this.state._active = false;
                this.compute();
                this.emit();
            }
        },
        {
            key: "bind",
            value: function bind(bindFunction) {
                bindFunction("wheel", "", this.wheel.bind(this));
            }
        }
    ]);
    return _class;
}(CoordinatesEngine1);
var wheelConfigResolver = coordinatesConfigResolver;
var HoverEngine = /*#__PURE__*/ function(CoordinatesEngine) {
    "use strict";
    _inherits(_class, CoordinatesEngine);
    var _super = _createSuper(_class);
    function _class() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(_toConsumableArray(args)));
        _defineProperty1(_assertThisInitialized(_this), "ingKey", "hovering");
        return _this;
    }
    _createClass(_class, [
        {
            key: "enter",
            value: function enter(event) {
                if (this.config.mouseOnly && event.pointerType !== "mouse") return;
                this.start(event);
                this.state.values = pointerValues(event);
                this.compute(event);
                this.emit();
            }
        },
        {
            key: "leave",
            value: function leave(event) {
                if (this.config.mouseOnly && event.pointerType !== "mouse") return;
                var state = this.state;
                if (!state._active) return;
                state._active = false;
                var values = pointerValues(event);
                state._movement = state._delta = V.sub(values, state.values);
                state.values = values;
                this.compute(event);
                state.delta = state.movement;
                this.emit();
            }
        },
        {
            key: "bind",
            value: function bind(bindFunction) {
                bindFunction("pointer", "enter", this.enter.bind(this));
                bindFunction("pointer", "leave", this.leave.bind(this));
            }
        }
    ]);
    return _class;
}(CoordinatesEngine1);
var hoverConfigResolver = _objectSpread2(_objectSpread2({
}, coordinatesConfigResolver), {
}, {
    mouseOnly: function(param) {
        var value = param === void 0 ? true : param;
        return value;
    }
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
var import_react7 = __toESM(require("react"));
// ../../node_modules/@use-gesture/core/dist/use-gesture-core.esm.js
init_cjs_shims();
function _objectWithoutPropertiesLoose1(source, excluded) {
    if (source == null) return {
    };
    var target = {
    };
    var sourceKeys = Object.keys(source);
    var key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
    }
    return target;
}
function _objectWithoutProperties1(source, excluded) {
    if (source == null) return {
    };
    var target = _objectWithoutPropertiesLoose1(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
        var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
        for(i = 0; i < sourceSymbolKeys.length; i++){
            key = sourceSymbolKeys[i];
            if (excluded.indexOf(key) >= 0) continue;
            if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
            target[key] = source[key];
        }
    }
    return target;
}
var identity = function(v) {
    return v;
};
var sharedConfigResolver = {
    target: function(value) {
        if (value) {
            return function() {
                return "current" in value ? value.current : value;
            };
        }
        return void 0;
    },
    enabled: function(param) {
        var value = param === void 0 ? true : param;
        return value;
    },
    window: function(param) {
        var value = param === void 0 ? SUPPORT.isBrowser ? window : void 0 : param;
        return value;
    },
    eventOptions: function(param) {
        var ref = param === void 0 ? {
        } : param, _passive = ref.passive, passive = _passive === void 0 ? true : _passive, _capture = ref.capture, capture = _capture === void 0 ? false : _capture;
        return {
            passive: passive,
            capture: capture
        };
    },
    transform: function(param) {
        var value = param === void 0 ? identity : param;
        return value;
    }
};
var _excluded = [
    "target",
    "eventOptions",
    "window",
    "enabled",
    "transform"
];
function resolveWith(param, resolvers) {
    var config = param === void 0 ? {
    } : param;
    var result = {
    };
    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
    try {
        for(var _iterator = Object.entries(resolvers)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
            var _value = _slicedToArray(_step.value, 2), key = _value[0], resolver = _value[1];
            switch(typeof resolver === "undefined" ? "undefined" : _typeof(resolver)){
                case "function":
                    result[key] = resolver.call(result, config[key], key, config);
                    break;
                case "object":
                    result[key] = resolveWith(config[key], resolver);
                    break;
                case "boolean":
                    if (resolver) result[key] = config[key];
                    break;
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally{
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally{
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
    return result;
}
function parse(config, gestureKey) {
    var _ref = config, target = _ref.target, eventOptions = _ref.eventOptions, window2 = _ref.window, enabled = _ref.enabled, transform = _ref.transform, rest = _objectWithoutProperties1(_ref, _excluded);
    var _config = {
        shared: resolveWith({
            target: target,
            eventOptions: eventOptions,
            window: window2,
            enabled: enabled,
            transform: transform
        }, sharedConfigResolver)
    };
    if (gestureKey) {
        var resolver = ConfigResolverMap.get(gestureKey);
        _config[gestureKey] = resolveWith(_objectSpread2({
            shared: _config.shared
        }, rest), resolver);
    } else {
        for(var key in rest){
            var resolver1 = ConfigResolverMap.get(key);
            if (resolver1) {
                _config[key] = resolveWith(_objectSpread2({
                    shared: _config.shared
                }, rest[key]), resolver1);
            } else if (true) {
                if (![
                    "drag",
                    "pinch",
                    "scroll",
                    "wheel",
                    "move",
                    "hover"
                ].includes(key)) {
                    if (key === "domTarget") {
                        throw Error("[@use-gesture]: `domTarget` option has been renamed to `target`.");
                    }
                    console.warn("[@use-gesture]: Unknown config key `".concat(key, "` was used. Please read the documentation for further information."));
                }
            }
        }
    }
    return _config;
}
var EventStore = /*#__PURE__*/ function() {
    "use strict";
    function _class(ctrl) {
        _classCallCheck(this, _class);
        _defineProperty1(this, "_listeners", []);
        this._ctrl = ctrl;
    }
    _createClass(_class, [
        {
            key: "add",
            value: function add(element, device, action2, handler, options) {
                var type = toDomEventType(device, action2);
                var eventOptions = _objectSpread2(_objectSpread2({
                }, this._ctrl.config.shared.eventOptions), options);
                element.addEventListener(type, handler, eventOptions);
                this._listeners.push(function() {
                    return element.removeEventListener(type, handler, eventOptions);
                });
            }
        },
        {
            key: "clean",
            value: function clean() {
                this._listeners.forEach(function(remove2) {
                    return remove2();
                });
                this._listeners = [];
            }
        }
    ]);
    return _class;
}();
var TimeoutStore = /*#__PURE__*/ function() {
    "use strict";
    function _class() {
        _classCallCheck(this, _class);
        _defineProperty1(this, "_timeouts", /* @__PURE__ */ new Map());
    }
    _createClass(_class, [
        {
            key: "add",
            value: function add(key, callback, param) {
                var ms = param === void 0 ? 140 : param;
                for(var _len = arguments.length, args = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++){
                    args[_key - 3] = arguments[_key];
                }
                var _window;
                this.remove(key);
                this._timeouts.set(key, (_window = window).setTimeout.apply(_window, [
                    callback,
                    ms
                ].concat(_toConsumableArray(args))));
            }
        },
        {
            key: "remove",
            value: function remove(key) {
                var timeout = this._timeouts.get(key);
                if (timeout) window.clearTimeout(timeout);
            }
        },
        {
            key: "clean",
            value: function clean() {
                this._timeouts.forEach(function(timeout) {
                    return void window.clearTimeout(timeout);
                });
                this._timeouts.clear();
            }
        }
    ]);
    return _class;
}();
var Controller = /*#__PURE__*/ function() {
    "use strict";
    function _class(handlers) {
        _classCallCheck(this, _class);
        _defineProperty1(this, "gestures", /* @__PURE__ */ new Set());
        _defineProperty1(this, "_targetEventStore", new EventStore(this));
        _defineProperty1(this, "gestureEventStores", {
        });
        _defineProperty1(this, "gestureTimeoutStores", {
        });
        _defineProperty1(this, "handlers", {
        });
        _defineProperty1(this, "config", {
        });
        _defineProperty1(this, "pointerIds", /* @__PURE__ */ new Set());
        _defineProperty1(this, "touchIds", /* @__PURE__ */ new Set());
        _defineProperty1(this, "state", {
            shared: {
                shiftKey: false,
                metaKey: false,
                ctrlKey: false,
                altKey: false
            }
        });
        resolveGestures(this, handlers);
    }
    _createClass(_class, [
        {
            key: "setEventIds",
            value: function setEventIds(event) {
                if (isTouch(event)) {
                    this.touchIds = new Set(touchIds(event));
                } else if ("pointerId" in event) {
                    if (event.type === "pointerup") this.pointerIds.delete(event.pointerId);
                    else this.pointerIds.add(event.pointerId);
                }
            }
        },
        {
            key: "applyHandlers",
            value: function applyHandlers(handlers, nativeHandlers) {
                this.handlers = handlers;
                this.nativeHandlers = nativeHandlers;
            }
        },
        {
            key: "applyConfig",
            value: function applyConfig(config, gestureKey) {
                this.config = parse(config, gestureKey);
            }
        },
        {
            key: "clean",
            value: function clean() {
                this._targetEventStore.clean();
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = this.gestures[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var key = _step.value;
                        this.gestureEventStores[key].clean();
                        this.gestureTimeoutStores[key].clean();
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally{
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                            _iterator.return();
                        }
                    } finally{
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
        },
        {
            key: "effect",
            value: function effect() {
                var _this = this;
                if (this.config.shared.target) this.bind();
                return function() {
                    return _this._targetEventStore.clean();
                };
            }
        },
        {
            key: "bind",
            value: function bind() {
                for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                    args[_key] = arguments[_key];
                }
                var sharedConfig = this.config.shared;
                var eventOptions = sharedConfig.eventOptions;
                var props = {
                };
                var target = void 0;
                if (sharedConfig.target) {
                    target = sharedConfig.target();
                    if (!target) return;
                }
                var bindFunction = bindToProps(props, eventOptions, !!target);
                if (sharedConfig.enabled) {
                    var _this = this, _loop = function(eventKey) {
                        var _this9 = _this;
                        bindFunction(eventKey, "", function(event) {
                            return _this9.nativeHandlers[eventKey](_objectSpread2(_objectSpread2({
                            }, _this9.state.shared), {
                            }, {
                                event: event,
                                args: args
                            }));
                        }, void 0, true);
                    };
                    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                    try {
                        for(var _iterator = this.gestures[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                            var gestureKey = _step.value;
                            if (this.config[gestureKey].enabled) {
                                var Engine2 = EngineMap.get(gestureKey);
                                new Engine2(this, args, gestureKey).bind(bindFunction);
                            }
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally{
                        try {
                            if (!_iteratorNormalCompletion && _iterator.return != null) {
                                _iterator.return();
                            }
                        } finally{
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }
                    for(var eventKey in this.nativeHandlers)_loop(eventKey);
                }
                for(var handlerProp in props){
                    props[handlerProp] = chain.apply(void 0, _toConsumableArray(props[handlerProp]));
                }
                if (!target) return props;
                for(var handlerProp1 in props){
                    var eventKey1 = handlerProp1.substr(2).toLowerCase();
                    var capture = !!~eventKey1.indexOf("capture");
                    var passive = !!~eventKey1.indexOf("passive");
                    if (capture || passive) eventKey1 = eventKey1.replace(/capture|passive/g, "");
                    this._targetEventStore.add(target, eventKey1, "", props[handlerProp1], {
                        capture: capture,
                        passive: passive
                    });
                }
            }
        }
    ]);
    return _class;
}();
function setupGesture(ctrl, gestureKey) {
    ctrl.gestures.add(gestureKey);
    ctrl.gestureEventStores[gestureKey] = new EventStore(ctrl);
    ctrl.gestureTimeoutStores[gestureKey] = new TimeoutStore();
}
function resolveGestures(ctrl, internalHandlers) {
    if (internalHandlers.drag) setupGesture(ctrl, "drag");
    if (internalHandlers.wheel) setupGesture(ctrl, "wheel");
    if (internalHandlers.scroll) setupGesture(ctrl, "scroll");
    if (internalHandlers.move) setupGesture(ctrl, "move");
    if (internalHandlers.pinch) setupGesture(ctrl, "pinch");
    if (internalHandlers.hover) setupGesture(ctrl, "hover");
}
var bindToProps = function(props, eventOptions, withPassiveOption) {
    return function(device, action2, handler, param, param8) {
        var options = param === void 0 ? {
        } : param, isNative = param8 === void 0 ? false : param8;
        var _options$capture, _options$passive;
        var capture = (_options$capture = options.capture) !== null && _options$capture !== void 0 ? _options$capture : eventOptions.capture;
        var passive = (_options$passive = options.passive) !== null && _options$passive !== void 0 ? _options$passive : eventOptions.passive;
        var handlerProp = isNative ? device : toHandlerProp(device, action2, capture);
        if (withPassiveOption && passive) handlerProp += "Passive";
        props[handlerProp] = props[handlerProp] || [];
        props[handlerProp].push(handler);
    };
};
var RE_NOT_NATIVE = /^on(Drag|Wheel|Scroll|Move|Pinch|Hover)/;
function sortHandlers(_handlers) {
    var native = {
    };
    var handlers = {
    };
    var actions = /* @__PURE__ */ new Set();
    for(var key in _handlers){
        if (RE_NOT_NATIVE.test(key)) {
            actions.add(RegExp.lastMatch);
            handlers[key] = _handlers[key];
        } else {
            native[key] = _handlers[key];
        }
    }
    return [
        handlers,
        native,
        actions
    ];
}
function registerGesture(actions, handlers, handlerKey, key, internalHandlers, config) {
    if (!actions.has(handlerKey)) return;
    if (!EngineMap.has(key)) {
        if (true) {
            console.warn("[@use-gesture]: You've created a custom handler that that uses the `".concat(key, "` gesture but isn't properly configured.\n\nPlease add `").concat(key, "Action` when creating your handler."));
        }
        return;
    }
    var startKey = handlerKey + "Start";
    var endKey = handlerKey + "End";
    var fn = function(state) {
        var memo3 = void 0;
        if (state.first && startKey in handlers) handlers[startKey](state);
        if (handlerKey in handlers) memo3 = handlers[handlerKey](state);
        if (state.last && endKey in handlers) handlers[endKey](state);
        return memo3;
    };
    internalHandlers[key] = fn;
    config[key] = config[key] || {
    };
}
function parseMergedHandlers(mergedHandlers, mergedConfig) {
    var ref = _slicedToArray(sortHandlers(mergedHandlers), 3), handlers = ref[0], nativeHandlers = ref[1], actions = ref[2];
    var internalHandlers = {
    };
    registerGesture(actions, handlers, "onDrag", "drag", internalHandlers, mergedConfig);
    registerGesture(actions, handlers, "onWheel", "wheel", internalHandlers, mergedConfig);
    registerGesture(actions, handlers, "onScroll", "scroll", internalHandlers, mergedConfig);
    registerGesture(actions, handlers, "onPinch", "pinch", internalHandlers, mergedConfig);
    registerGesture(actions, handlers, "onMove", "move", internalHandlers, mergedConfig);
    registerGesture(actions, handlers, "onHover", "hover", internalHandlers, mergedConfig);
    return {
        handlers: internalHandlers,
        config: mergedConfig,
        nativeHandlers: nativeHandlers
    };
}
// ../../node_modules/@use-gesture/core/utils/dist/use-gesture-core-utils.esm.js
init_cjs_shims();
// ../../node_modules/@use-gesture/core/types/dist/use-gesture-core-types.esm.js
init_cjs_shims();
// ../../node_modules/@use-gesture/react/dist/use-gesture-react.esm.js
function useRecognizers(handlers, param, gestureKey, nativeHandlers) {
    var config = param === void 0 ? {
    } : param;
    var ctrl = import_react7.default.useMemo(function() {
        return new Controller(handlers);
    }, []);
    ctrl.applyHandlers(handlers, nativeHandlers);
    ctrl.applyConfig(config, gestureKey);
    import_react7.default.useEffect(ctrl.effect.bind(ctrl));
    import_react7.default.useEffect(function() {
        return ctrl.clean.bind(ctrl);
    }, []);
    if (config.target === void 0) {
        return ctrl.bind.bind(ctrl);
    }
    return void 0;
}
function createUseGesture(actions) {
    actions.forEach(registerAction);
    return function useGesture2(_handlers, param) {
        var _config = param === void 0 ? {
        } : param;
        var ref = parseMergedHandlers(_handlers, _config), handlers = ref.handlers, nativeHandlers = ref.nativeHandlers, config = ref.config;
        return useRecognizers(handlers, config, void 0, nativeHandlers);
    };
}
function useGesture(handlers, param) {
    var config = param === void 0 ? {
    } : param;
    var hook = createUseGesture([
        dragAction,
        pinchAction,
        scrollAction,
        wheelAction,
        moveAction,
        hoverAction
    ]);
    return hook(handlers, config);
}
// ../../packages/react/dist/esm/index.js
var React10 = __toESM(require("react"));
var React11 = __toESM(require("react"));
var React12 = __toESM(require("react"));
var React13 = __toESM(require("react"));
var React14 = __toESM(require("react"));
var React15 = __toESM(require("react"));
var React16 = __toESM(require("react"));
var React17 = __toESM(require("react"));
var React18 = __toESM(require("react"));
var React20 = __toESM(require("react"));
var React21 = __toESM(require("react"));
var React23 = __toESM(require("react"));
var React222 = __toESM(require("react"));
var React24 = __toESM(require("react"));
var React25 = __toESM(require("react"));
var React26 = __toESM(require("react"));
var React29 = __toESM(require("react"));
var React27 = __toESM(require("react"));
var React28 = __toESM(require("react"));
var React30 = __toESM(require("react"));
var React31 = __toESM(require("react"));
var React322 = __toESM(require("react"));
var React33 = __toESM(require("react"));
var React38 = __toESM(require("react"));
var React34 = __toESM(require("react"));
var React35 = __toESM(require("react"));
var React36 = __toESM(require("react"));
var React37 = __toESM(require("react"));
var React39 = __toESM(require("react"));
var React40 = __toESM(require("react"));
var React41 = __toESM(require("react"));
var React42 = __toESM(require("react"));
var React43 = __toESM(require("react"));
var __defProp5 = Object.defineProperty;
var __defProps3 = Object.defineProperties;
var __getOwnPropDescs3 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols3 = Object.getOwnPropertySymbols;
var __hasOwnProp4 = Object.prototype.hasOwnProperty;
var __propIsEnum3 = Object.prototype.propertyIsEnumerable;
var __defNormalProp5 = function(obj, key, value) {
    return key in obj ? __defProp5(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: value
    }) : obj[key] = value;
};
var __spreadValues3 = function(a2, b) {
    for(var prop in b || (b = {
    }))if (__hasOwnProp4.call(b, prop)) __defNormalProp5(a2, prop, b[prop]);
    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
    if (__getOwnPropSymbols3) try {
        for(var _iterator = __getOwnPropSymbols3(b)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
            var prop = _step.value;
            if (__propIsEnum3.call(b, prop)) __defNormalProp5(a2, prop, b[prop]);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally{
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally{
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
    return a2;
};
var __spreadProps3 = function(a2, b) {
    return __defProps3(a2, __getOwnPropDescs3(b));
};
var __objRest = function(source, exclude) {
    var target = {
    };
    for(var prop in source)if (__hasOwnProp4.call(source, prop) && exclude.indexOf(prop) < 0) target[prop] = source[prop];
    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
    if (source != null && __getOwnPropSymbols3) try {
        for(var _iterator = __getOwnPropSymbols3(source)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
            var prop = _step.value;
            if (exclude.indexOf(prop) < 0 && __propIsEnum3.call(source, prop)) target[prop] = source[prop];
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally{
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally{
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
    return target;
};
var __publicField4 = function(obj, key, value) {
    __defNormalProp5(obj, (typeof key === "undefined" ? "undefined" : _typeof(key)) !== "symbol" ? key + "" : key, value);
    return value;
};
var __async = function(__this, __arguments, generator) {
    return new Promise(function(resolve, reject) {
        var fulfilled = function(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        };
        var rejected = function(value) {
            try {
                step(generator.throw(value));
            } catch (e) {
                reject(e);
            }
        };
        var step = function(x) {
            return x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
        };
        step((generator = generator.apply(__this, __arguments)).next());
    });
};
var TLReactBoxShape1 = /*#__PURE__*/ function(TLBoxShape) {
    "use strict";
    _inherits(_class, TLBoxShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        return _super.apply(this, arguments);
    }
    return _class;
}(TLBoxShape1);
var TLReactApp = /*#__PURE__*/ function(TLApp41) {
    "use strict";
    _inherits(_class, TLApp41);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        return _super.apply(this, arguments);
    }
    return _class;
}(TLApp411);
var TLTextMeasure = function _class() {
    "use strict";
    var _this = this;
    _classCallCheck(this, _class);
    __publicField4(this, "elm");
    __publicField4(this, "measureText", function(text, styles2, param) {
        var padding = param === void 0 ? 0 : param;
        var _a2, _b, _c, _d, _e;
        var elm = _this.elm;
        elm.style.setProperty("font", "".concat((_a2 = styles2.fontStyle) != null ? _a2 : "normal", " ").concat((_b = styles2.fontVariant) != null ? _b : "normal", " ").concat((_c = styles2.fontWeight) != null ? _c : "normal", " ").concat(styles2.fontSize, "px/").concat(styles2.fontSize * styles2.lineHeight, "px ").concat(styles2.fontFamily));
        elm.style.padding = padding + "px";
        elm.innerHTML = "".concat(text, "&#8203;");
        var width = (_d = elm.offsetWidth) != null ? _d : 1;
        var height = (_e = elm.offsetHeight) != null ? _e : 1;
        return {
            width: width,
            height: height
        };
    });
    var pre = document.createElement("pre");
    var id = uniqueId();
    pre.id = "__textMeasure_".concat(id);
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
};
var contextMap = {
};
function getAppContext(param) {
    var id = param === void 0 ? "noid" : param;
    if (!contextMap[id]) {
        contextMap[id] = React3.createContext({
        });
    }
    return contextMap[id];
}
function useApp(param) {
    var id = param === void 0 ? "noid" : param;
    return React3.useContext(getAppContext(id));
}
var contextMap2 = {
};
function getRendererContext(param) {
    var id = param === void 0 ? "noid" : param;
    if (!contextMap2[id]) {
        contextMap2[id] = React22.createContext({
        });
    }
    return contextMap2[id];
}
function useRendererContext(param) {
    var id = param === void 0 ? "noid" : param;
    return React22.useContext(getRendererContext(id));
}
var HTMLContainer = React32.forwardRef(function HTMLContainer2(_a2, ref) {
    var _b = _a2, children = _b.children, opacity = _b.opacity, centered = _b.centered, _className = _b.className, className = _className === void 0 ? "" : _className, rest = __objRest(_b, [
        "children",
        "opacity",
        "centered",
        "className"
    ]);
    return(/* @__PURE__ */ React32.createElement(ObserverComponent, null, function() {
        /* @__PURE__ */ return React32.createElement("div", {
            ref: ref,
            className: "tl-positioned-div ".concat(className),
            style: opacity ? {
                opacity: opacity
            } : void 0,
            draggable: false
        }, /* @__PURE__ */ React32.createElement("div", __spreadValues3({
            className: "tl-positioned-inner ".concat(centered ? "tl-centered" : "")
        }, rest), children));
    }));
});
var SVGContainer = React4.forwardRef(function SVGContainer2(_a2, ref) {
    var _b = _a2, id = _b.id, _className = _b.className, className = _className === void 0 ? "" : _className, children = _b.children, rest = __objRest(_b, [
        "id",
        "className",
        "children"
    ]);
    return(/* @__PURE__ */ React4.createElement(ObserverComponent, null, function() {
        /* @__PURE__ */ return React4.createElement("svg", {
            ref: ref,
            className: "tl-positioned-svg ".concat(className)
        }, /* @__PURE__ */ React4.createElement("g", __spreadValues3({
            id: id,
            className: "tl-centered-g"
        }, rest), children));
    }));
});
var Container = observer(function Container2(_a2) {
    var _b = _a2, id = _b.id, bounds = _b.bounds, scale = _b.scale, zIndex = _b.zIndex, _rotation = _b.rotation, rotation = _rotation === void 0 ? 0 : _rotation, _className = _b.className, className = _className === void 0 ? "" : _className, children = _b.children, props = __objRest(_b, [
        "id",
        "bounds",
        "scale",
        "zIndex",
        "rotation",
        "className",
        "children"
    ]);
    var rBounds = React5.useRef(null);
    React5.useLayoutEffect(function() {
        var elm = rBounds.current;
        elm.style.transform = "translate(\n        calc(".concat(bounds.minX, "px - var(--tl-padding)),\n        calc(").concat(bounds.minY, "px - var(--tl-padding)))\n        rotate(").concat(rotation + (bounds.rotation || 0), "rad)\n      ").concat(scale ? "scale(".concat(scale[0], ", ").concat(scale[1], ")") : "");
    }, [
        bounds.minX,
        bounds.minY,
        rotation,
        bounds.rotation,
        scale
    ]);
    React5.useLayoutEffect(function() {
        var elm = rBounds.current;
        elm.style.width = "calc(".concat(Math.floor(bounds.width), "px + (var(--tl-padding) * 2))");
        elm.style.height = "calc(".concat(Math.floor(bounds.height), "px + (var(--tl-padding) * 2))");
    }, [
        bounds.width,
        bounds.height
    ]);
    React5.useLayoutEffect(function() {
        var elm = rBounds.current;
        if (zIndex !== void 0) elm.style.zIndex = zIndex.toString();
    }, [
        zIndex
    ]);
    return(/* @__PURE__ */ React5.createElement("div", __spreadValues3({
        id: id,
        ref: rBounds,
        className: "tl-positioned ".concat(className),
        "aria-label": "container"
    }, props), children));
});
var PI3 = Math.PI;
var TAU2 = PI3 / 2;
var PI22 = PI3 * 2;
var EPSILON2 = Math.PI / 180;
var DOUBLE_CLICK_DURATION = 450;
var NOOP = function() {
    return void 0;
};
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var EMPTY_OBJECT2 = {
};
var _obj4;
var CURSORS2 = (_obj4 = {
    canvas: "default",
    grab: "grab",
    grabbing: "grabbing"
}, _defineProperty(_obj4, TLResizeCorner.TopLeft, "resize-nwse"), _defineProperty(_obj4, TLResizeCorner.TopRight, "resize-nesw"), _defineProperty(_obj4, TLResizeCorner.BottomRight, "resize-nwse"), _defineProperty(_obj4, TLResizeCorner.BottomLeft, "resize-nesw"), _defineProperty(_obj4, TLResizeEdge.Top, "resize-ns"), _defineProperty(_obj4, TLResizeEdge.Right, "resize-ew"), _defineProperty(_obj4, TLResizeEdge.Bottom, "resize-ns"), _defineProperty(_obj4, TLResizeEdge.Left, "resize-ew"), _obj4);
function useBoundsEvents(handle) {
    var callbacks = useRendererContext().callbacks;
    var rDoubleClickTimer = React6.useRef(-1);
    var events = React6.useMemo(function() {
        var onPointerMove = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            if (order) return;
            (_a2 = callbacks.onPointerMove) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Selection,
                handle: handle,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onPointerDown = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            if (order) return;
            var elm = loopToHtmlElement(e.currentTarget);
            elm.setPointerCapture(e.pointerId);
            elm.addEventListener("pointerup", onPointerUp);
            (_a2 = callbacks.onPointerDown) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Selection,
                handle: handle,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onPointerUp = function(e) {
            var _a2, _b;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            if (order) return;
            var elm = e.target;
            elm.removeEventListener("pointerup", onPointerUp);
            elm.releasePointerCapture(e.pointerId);
            (_a2 = callbacks.onPointerUp) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Selection,
                handle: handle,
                order: order
            }, e);
            var now = Date.now();
            var elapsed = now - rDoubleClickTimer.current;
            if (elapsed > DOUBLE_CLICK_DURATION) {
                rDoubleClickTimer.current = now;
            } else {
                if (elapsed <= DOUBLE_CLICK_DURATION) {
                    (_b = callbacks.onDoubleClick) == null ? void 0 : _b.call(callbacks, {
                        type: TLTargetType.Selection,
                        handle: handle,
                        order: order
                    }, e);
                    rDoubleClickTimer.current = -1;
                }
            }
            e.order = order + 1;
        };
        var onPointerEnter = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            if (order) return;
            (_a2 = callbacks.onPointerEnter) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Selection,
                handle: handle,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onPointerLeave = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            if (order) return;
            (_a2 = callbacks.onPointerLeave) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Selection,
                handle: handle,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onKeyDown = function(e) {
            var _a2;
            (_a2 = callbacks.onKeyDown) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Selection,
                handle: handle,
                order: -1
            }, e);
        };
        var onKeyUp = function(e) {
            var _a2;
            (_a2 = callbacks.onKeyUp) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Selection,
                handle: handle,
                order: -1
            }, e);
        };
        return {
            onPointerDown: onPointerDown,
            onPointerMove: onPointerMove,
            onPointerEnter: onPointerEnter,
            onPointerLeave: onPointerLeave,
            onKeyDown: onKeyDown,
            onKeyUp: onKeyUp
        };
    }, [
        callbacks
    ]);
    return events;
}
function loopToHtmlElement(elm) {
    var _a2;
    if ((_a2 = elm.namespaceURI) == null ? void 0 : _a2.endsWith("svg")) {
        if (elm.parentElement) return loopToHtmlElement(elm.parentElement);
        else throw Error("Could not find a parent element of an HTML type!");
    }
    return elm;
}
function useResizeObserver(ref, viewport, onBoundsChange) {
    var rIsMounted = React7.useRef(false);
    var updateBounds = React7.useCallback(function() {
        var _a2;
        if (rIsMounted.current) {
            var rect = (_a2 = ref.current) == null ? void 0 : _a2.getBoundingClientRect();
            if (rect) {
                var bounds = {
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
    }, [
        ref,
        onBoundsChange
    ]);
    React7.useEffect(function() {
        window.addEventListener("scroll", updateBounds);
        window.addEventListener("resize", updateBounds);
        return function() {
            window.removeEventListener("scroll", updateBounds);
            window.removeEventListener("resize", updateBounds);
        };
    }, []);
    React7.useLayoutEffect(function() {
        var resizeObserver = new ResizeObserver(function(entries) {
            if (entries[0].contentRect) {
                updateBounds();
            }
        });
        if (ref.current) {
            resizeObserver.observe(ref.current);
        }
        return function() {
            resizeObserver.disconnect();
        };
    }, [
        ref
    ]);
    React7.useLayoutEffect(function() {
        updateBounds();
    }, [
        ref
    ]);
}
var styles = /* @__PURE__ */ new Map();
function makeCssTheme(prefix, theme) {
    return Object.keys(theme).reduce(function(acc, key) {
        var value = theme[key];
        if (value) {
            return acc + "".concat("--".concat(prefix, "-").concat(key), ": ").concat(value, ";\n");
        }
        return acc;
    }, "");
}
function useTheme(prefix, theme, param) {
    var selector = param === void 0 ? ":root" : param;
    React8.useLayoutEffect(function() {
        var style = document.createElement("style");
        var cssTheme = makeCssTheme(prefix, theme);
        style.setAttribute("id", "".concat(prefix, "-theme"));
        style.setAttribute("data-selector", selector);
        style.innerHTML = "\n        ".concat(selector, " {\n          ").concat(cssTheme, "\n        }\n      ");
        document.head.appendChild(style);
        return function() {
            if (style && document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }, [
        prefix,
        theme,
        selector
    ]);
}
function useStyle(uid, rules) {
    React8.useLayoutEffect(function() {
        if (styles.get(uid)) {
            return function() {
                return void 0;
            };
        }
        var style = document.createElement("style");
        style.innerHTML = rules;
        style.setAttribute("id", uid);
        document.head.appendChild(style);
        styles.set(uid, style);
        return function() {
            if (style && document.head.contains(style)) {
                document.head.removeChild(style);
                styles.delete(uid);
            }
        };
    }, [
        uid,
        rules
    ]);
}
var css = function(strings) {
    for(var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
        args[_key - 1] = arguments[_key];
    }
    return strings.reduce(function(acc, string, index) {
        return acc + string + (index < args.length ? args[index] : "");
    }, "");
};
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
var tlcss = css(_templateObject());
function useStylesheet(theme, selector) {
    var tltheme = React8.useMemo(function() {
        return __spreadValues3(__spreadValues3({
        }, defaultTheme), theme);
    }, [
        theme
    ]);
    useTheme("tl", tltheme, selector);
    useStyle("tl-canvas", tlcss);
}
function useCanvasEvents() {
    var _this = this;
    var app = useApp();
    var callbacks = useRendererContext().callbacks;
    var events = React9.useMemo(function() {
        var _this10 = _this;
        var onPointerMove = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            (_a2 = callbacks.onPointerMove) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Canvas,
                order: order
            }, e);
        };
        var onPointerDown = function(e) {
            var _a2, _b;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            if (!order) (_a2 = e.currentTarget) == null ? void 0 : _a2.setPointerCapture(e.pointerId);
            (_b = callbacks.onPointerDown) == null ? void 0 : _b.call(callbacks, {
                type: TLTargetType.Canvas,
                order: order
            }, e);
        };
        var onPointerUp = function(e) {
            var _a2, _b;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            if (!order) (_a2 = e.currentTarget) == null ? void 0 : _a2.releasePointerCapture(e.pointerId);
            (_b = callbacks.onPointerUp) == null ? void 0 : _b.call(callbacks, {
                type: TLTargetType.Canvas,
                order: order
            }, e);
        };
        var onPointerEnter = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            (_a2 = callbacks.onPointerEnter) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Canvas,
                order: order
            }, e);
        };
        var onPointerLeave = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            (_a2 = callbacks.onPointerLeave) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Canvas,
                order: order
            }, e);
        };
        var onDrop = function(e) {
            return __async(_this10, null, regeneratorRuntime.mark(function _callee() {
                var _a2, point;
                return regeneratorRuntime.wrap(function _callee$(_ctx) {
                    while(1)switch(_ctx.prev = _ctx.next){
                        case 0:
                            ;
                            e.preventDefault();
                            if ((_a2 = e.dataTransfer.files) == null ? void 0 : _a2.length) {
                                _ctx.next = 4;
                                break;
                            }
                            return _ctx.abrupt("return");
                        case 4:
                            point = [
                                e.clientX,
                                e.clientY
                            ];
                            app.dropFiles(e.dataTransfer.files, point);
                        case 6:
                        case "end":
                            return _ctx.stop();
                    }
                }, _callee);
            }));
        };
        var onDragOver = function(e) {
            e.preventDefault();
        };
        return {
            onPointerDown: onPointerDown,
            onPointerMove: onPointerMove,
            onPointerUp: onPointerUp,
            onPointerEnter: onPointerEnter,
            onPointerLeave: onPointerLeave,
            onDrop: onDrop,
            onDragOver: onDragOver
        };
    }, [
        callbacks
    ]);
    return events;
}
function useGestureEvents(ref) {
    var ref11 = useRendererContext(), viewport = ref11.viewport, inputs = ref11.inputs, callbacks = ref11.callbacks;
    var events = React10.useMemo(function() {
        var onWheel = function(gesture) {
            var _a2;
            var event = gesture.event, delta = gesture.delta;
            event.preventDefault();
            if (inputs.state === "pinching") return;
            if (src_default.isEqual(delta, [
                0,
                0
            ])) return;
            (_a2 = callbacks.onWheel) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Canvas,
                order: 0,
                delta: gesture.delta,
                point: inputs.currentPoint
            }, event);
        };
        var onPinchStart = function(gesture) {
            var _a2;
            var elm = ref.current;
            var event = gesture.event;
            if (!(event.target === elm || (elm == null ? void 0 : elm.contains(event.target)))) return;
            if (inputs.state !== "idle") return;
            (_a2 = callbacks.onPinchStart) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Canvas,
                order: 0,
                delta: gesture.delta,
                offset: gesture.offset,
                point: gesture.origin
            }, event);
        };
        var onPinch = function(gesture) {
            var _a2;
            var elm = ref.current;
            var event = gesture.event;
            if (!(event.target === elm || (elm == null ? void 0 : elm.contains(event.target)))) return;
            if (inputs.state !== "pinching") return;
            (_a2 = callbacks.onPinch) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Canvas,
                order: 0,
                delta: gesture.delta,
                offset: gesture.offset,
                point: gesture.origin
            }, event);
        };
        var onPinchEnd = function(gesture) {
            var _a2;
            var elm = ref.current;
            var event = gesture.event;
            if (!(event.target === elm || (elm == null ? void 0 : elm.contains(event.target)))) return;
            if (inputs.state !== "pinching") return;
            (_a2 = callbacks.onPinchEnd) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Canvas,
                order: 0,
                delta: gesture.delta,
                offset: gesture.offset,
                point: gesture.origin
            }, event);
        };
        return {
            onWheel: onWheel,
            onPinchStart: onPinchStart,
            onPinchEnd: onPinchEnd,
            onPinch: onPinch
        };
    }, [
        callbacks
    ]);
    useGesture(events, {
        target: ref,
        eventOptions: {
            passive: false
        },
        pinch: {
            from: viewport.camera.zoom,
            scaleBounds: function() {
                return {
                    from: viewport.camera.zoom,
                    max: 8,
                    min: 0.1
                };
            }
        }
    });
}
function useCounterScaledPosition(ref, bounds, zoom, zIndex) {
    React11.useLayoutEffect(function() {
        var elm = ref.current;
        if (!elm) return;
        elm.style.setProperty("transform", "translate(\n          calc(".concat(bounds.minX - 64, "px),\n          calc(").concat(bounds.minY - 64, "px)\n        )\n        scale(var(--tl-scale))"));
    }, [
        bounds.minX,
        bounds.minY
    ]);
    React11.useLayoutEffect(function() {
        var elm = ref.current;
        if (!elm) return;
        elm.style.setProperty("width", "calc(".concat(Math.floor(bounds.width), "px + 64px * 2)"));
        elm.style.setProperty("height", "calc(".concat(Math.floor(bounds.height), "px + 64px * 2)"));
        elm.style.setProperty("z-index", "10003");
    }, [
        bounds.width,
        bounds.height,
        zoom
    ]);
    React11.useLayoutEffect(function() {
        var elm = ref.current;
        if (!elm) return;
        elm.style.setProperty("z-index", zIndex.toString());
    }, [
        zIndex
    ]);
}
function useSetup(app, props) {
    var onPersist = props.onPersist, onSave = props.onSave, onSaveAs = props.onSaveAs, onError = props.onError, onMount = props.onMount, onCreateAssets = props.onCreateAssets, onCreateShapes = props.onCreateShapes, onDeleteAssets = props.onDeleteAssets, onDeleteShapes = props.onDeleteShapes, onFileDrop = props.onFileDrop;
    React12.useLayoutEffect(function() {
        var unsubs = [];
        if (!app) return;
        app.history.reset();
        if ((typeof window === "undefined" ? "undefined" : _typeof(window)) !== void 0) window["tln"] = app;
        if (onMount) onMount(app, null);
        return function() {
            unsubs.forEach(function(unsub) {
                return unsub();
            });
            app.dispose();
        };
    }, [
        app
    ]);
    React12.useLayoutEffect(function() {
        var unsubs = [];
        if (onPersist) unsubs.push(app.subscribe("persist", onPersist));
        if (onSave) unsubs.push(app.subscribe("save", onSave));
        if (onSaveAs) unsubs.push(app.subscribe("saveAs", onSaveAs));
        if (onError) unsubs.push(app.subscribe("error", onError));
        if (onCreateShapes) unsubs.push(app.subscribe("create-shapes", onCreateShapes));
        if (onCreateAssets) unsubs.push(app.subscribe("create-assets", onCreateAssets));
        if (onDeleteShapes) unsubs.push(app.subscribe("delete-shapes", onDeleteShapes));
        if (onDeleteAssets) unsubs.push(app.subscribe("delete-assets", onDeleteAssets));
        if (onFileDrop) unsubs.push(app.subscribe("drop-files", onFileDrop));
        return function() {
            return unsubs.forEach(function(unsub) {
                return unsub();
            });
        };
    }, [
        app,
        onPersist,
        onSave,
        onSaveAs,
        onError
    ]);
}
function useAppSetup(props) {
    if ("app" in props) return props.app;
    var ref = _slicedToArray(React13.useState(function() {
        return new TLReactApp(props.model, props.Shapes, props.Tools);
    }), 1), app = ref[0];
    return app;
}
function usePropControl(app, props) {
    React14.useEffect(function() {
        if (!("model" in props)) return;
        if (props.model) app.loadDocumentModel(props.model);
    }, [
        props.model
    ]);
}
function usePreventNavigation(rCanvas) {
    var context = useRendererContext();
    var bounds = context.viewport.bounds;
    React15.useEffect(function() {
        var preventGestureNavigation = function(event) {
            event.preventDefault();
        };
        var preventNavigation = function(event) {
            var touchXPosition = event.touches[0].pageX;
            var touchXRadius = event.touches[0].radiusX || 0;
            if (touchXPosition - touchXRadius < 10 || touchXPosition + touchXRadius > bounds.width - 10) {
                event.preventDefault();
            }
        };
        var elm = rCanvas.current;
        if (!elm) return function() {
            return void 0;
        };
        elm.addEventListener("touchstart", preventGestureNavigation);
        elm.addEventListener("gestureend", preventGestureNavigation);
        elm.addEventListener("gesturechange", preventGestureNavigation);
        elm.addEventListener("gesturestart", preventGestureNavigation);
        elm.addEventListener("touchstart", preventNavigation);
        return function() {
            if (elm) {
                elm.removeEventListener("touchstart", preventGestureNavigation);
                elm.removeEventListener("gestureend", preventGestureNavigation);
                elm.removeEventListener("gesturechange", preventGestureNavigation);
                elm.removeEventListener("gesturestart", preventGestureNavigation);
                elm.removeEventListener("touchstart", preventNavigation);
            }
        };
    }, [
        rCanvas,
        bounds.width
    ]);
}
function useHandleEvents(shape, index) {
    var ref = useRendererContext(), inputs = ref.inputs, callbacks = ref.callbacks;
    var events = React16.useMemo(function() {
        var onPointerMove = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            var handle = shape.props.handles[index];
            (_a2 = callbacks.onPointerMove) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Handle,
                shape: shape,
                handle: handle,
                index: index,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onPointerDown = function(e) {
            var _a2, _b;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            if (!order) (_a2 = e.currentTarget) == null ? void 0 : _a2.setPointerCapture(e.pointerId);
            var handle = shape.props.handles[index];
            (_b = callbacks.onPointerDown) == null ? void 0 : _b.call(callbacks, {
                type: TLTargetType.Handle,
                shape: shape,
                handle: handle,
                index: index,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onPointerUp = function(e) {
            var _a2, _b;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            if (!order) (_a2 = e.currentTarget) == null ? void 0 : _a2.releasePointerCapture(e.pointerId);
            var handle = shape.props.handles[index];
            (_b = callbacks.onPointerUp) == null ? void 0 : _b.call(callbacks, {
                type: TLTargetType.Handle,
                shape: shape,
                handle: handle,
                index: index,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onPointerEnter = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            var handle = shape.props.handles[index];
            (_a2 = callbacks.onPointerEnter) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Handle,
                shape: shape,
                handle: handle,
                index: index,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onPointerLeave = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            var handle = shape.props.handles[index];
            (_a2 = callbacks.onPointerLeave) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Handle,
                shape: shape,
                handle: handle,
                index: index,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onKeyDown = function(e) {
            var _a2;
            var handle = shape.props.handles[index];
            (_a2 = callbacks.onKeyDown) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Handle,
                shape: shape,
                handle: handle,
                index: index,
                order: -1
            }, e);
        };
        var onKeyUp = function(e) {
            var _a2;
            var handle = shape.props.handles[index];
            (_a2 = callbacks.onKeyUp) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Handle,
                shape: shape,
                handle: handle,
                index: index,
                order: -1
            }, e);
        };
        return {
            onPointerDown: onPointerDown,
            onPointerMove: onPointerMove,
            onPointerUp: onPointerUp,
            onPointerEnter: onPointerEnter,
            onPointerLeave: onPointerLeave,
            onKeyUp: onKeyUp,
            onKeyDown: onKeyDown
        };
    }, [
        shape.id,
        inputs,
        callbacks
    ]);
    return events;
}
function getCursorCss(svg, r, param) {
    var f2 = param === void 0 ? false : param;
    return "url(\"data:image/svg+xml,<svg height='32' width='32' viewBox='0 0 35 35' xmlns='http://www.w3.org/2000/svg'><g fill='none' style='transform-origin:center center' transform='rotate(".concat(r, ")").concat(f2 ? " scale(-1,-1) translate(0, -32)" : "", "'>") + svg.replaceAll("\"", "'") + '</g></svg>") 16 16, pointer';
}
var CORNER_SVG = "<path d='m19.7432 17.0869-4.072 4.068 2.829 2.828-8.473-.013-.013-8.47 2.841 2.842 4.075-4.068 1.414-1.415-2.844-2.842h8.486v8.484l-2.83-2.827z' fill='%23fff'/><path d='m18.6826 16.7334-4.427 4.424 1.828 1.828-5.056-.016-.014-5.054 1.842 1.841 4.428-4.422 2.474-2.475-1.844-1.843h5.073v5.071l-1.83-1.828z' fill='%23000'/>";
var EDGE_SVG = "<path d='m9 17.9907v.005l5.997 5.996.001-3.999h1.999 2.02v4l5.98-6.001-5.98-5.999.001 4.019-2.021.002h-2l.001-4.022zm1.411.003 3.587-3.588-.001 2.587h3.5 2.521v-2.585l3.565 3.586-3.564 3.585-.001-2.585h-2.521l-3.499-.001-.001 2.586z' fill='%23fff'/><path d='m17.4971 18.9932h2.521v2.586l3.565-3.586-3.565-3.585v2.605h-2.521-3.5v-2.607l-3.586 3.587 3.586 3.586v-2.587z' fill='%23000'/>";
var ROTATE_CORNER_SVG = "<g><path d=\"M22.4789 9.45728L25.9935 12.9942L22.4789 16.5283V14.1032C18.126 14.1502 14.6071 17.6737 14.5675 22.0283H17.05L13.513 25.543L9.97889 22.0283H12.5674C12.6071 16.5691 17.0214 12.1503 22.4789 12.1031L22.4789 9.45728Z\" fill=\"black\"/><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M21.4789 7.03223L27.4035 12.9945L21.4789 18.9521V15.1868C18.4798 15.6549 16.1113 18.0273 15.649 21.0284H19.475L13.5128 26.953L7.55519 21.0284H11.6189C12.1243 15.8155 16.2679 11.6677 21.4789 11.1559L21.4789 7.03223ZM22.4789 12.1031C17.0214 12.1503 12.6071 16.5691 12.5674 22.0284H9.97889L13.513 25.543L17.05 22.0284H14.5675C14.5705 21.6896 14.5947 21.3558 14.6386 21.0284C15.1157 17.4741 17.9266 14.6592 21.4789 14.1761C21.8063 14.1316 22.1401 14.1069 22.4789 14.1032V16.5284L25.9935 12.9942L22.4789 9.45729L22.4789 12.1031Z\" fill=\"white\"/></g>";
var TEXT_SVG = "<path d='m6.94 2v-1c-1.35866267-.08246172-2.66601117.53165299-3.47 1.63-.80398883-1.09834701-2.11133733-1.71246172-3.47-1.63v1c1.30781678-.16635468 2.55544738.59885876 3 1.84v5.1h-1v1h1v4.16c-.4476345 1.2386337-1.69302129 2.002471-3 1.84v1c1.35687108.0731933 2.6600216-.5389494 3.47-1.63.8099784 1.0910506 2.11312892 1.7031933 3.47 1.63v-1c-1.28590589.133063-2.49760499-.6252793-2.94-1.84v-4.18h1v-1h-1v-5.08c.43943906-1.21710975 1.65323743-1.97676587 2.94-1.84z' transform='translate(14 9)'/>";
var GRABBING_SVG = "<path d='m13.5732 12.0361c.48-.178 1.427-.069 1.677.473.213.462.396 1.241.406 1.075.024-.369-.024-1.167.137-1.584.117-.304.347-.59.686-.691.285-.086.62-.116.916-.055.313.064.642.287.765.499.362.623.368 1.899.385 1.831.064-.272.07-1.229.283-1.584.141-.235.497-.445.687-.479.294-.052.656-.068.964-.008.249.049.586.344.677.487.219.344.342 1.316.379 1.658.016.141.074-.393.293-.736.406-.639 1.844-.763 1.898.639.026.654.02.624.02 1.064 0 .516-.012.828-.04 1.202-.03.399-.116 1.304-.241 1.742-.086.301-.371.978-.653 1.384 0 0-1.074 1.25-1.191 1.812-.117.563-.078.567-.102.965-.023.399.121.923.121.923s-.801.104-1.234.034c-.391-.062-.875-.84-1-1.078-.172-.328-.539-.265-.682-.023-.224.383-.709 1.07-1.05 1.113-.669.084-2.055.03-3.14.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.283-.36-1.002-.929-1.243-1.985-.213-.936-.192-1.395.037-1.77.232-.381.67-.589.854-.625.208-.042.692-.039.875.062.223.123.313.159.488.391.23.307.312.456.213.121-.076-.262-.322-.595-.434-.97-.109-.361-.401-.943-.38-1.526.008-.221.103-.771.832-1.042' fill='%23fff'/><g stroke='%23000' stroke-width='.75'><path d='m13.5732 12.0361c.48-.178 1.427-.069 1.677.473.213.462.396 1.241.406 1.075.024-.369-.024-1.167.137-1.584.117-.304.347-.59.686-.691.285-.086.62-.116.916-.055.313.064.642.287.765.499.362.623.368 1.899.385 1.831.064-.272.07-1.229.283-1.584.141-.235.497-.445.687-.479.294-.052.656-.068.964-.008.249.049.586.344.677.487.219.344.342 1.316.379 1.658.016.141.074-.393.293-.736.406-.639 1.844-.763 1.898.639.026.654.02.624.02 1.064 0 .516-.012.828-.04 1.202-.03.399-.116 1.304-.241 1.742-.086.301-.371.978-.653 1.384 0 0-1.074 1.25-1.191 1.812-.117.563-.078.567-.102.965-.023.399.121.923.121.923s-.801.104-1.234.034c-.391-.062-.875-.84-1-1.078-.172-.328-.539-.265-.682-.023-.224.383-.709 1.07-1.05 1.113-.669.084-2.055.03-3.14.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.283-.36-1.002-.929-1.243-1.985-.213-.936-.192-1.395.037-1.77.232-.381.67-.589.854-.625.208-.042.692-.039.875.062.223.123.313.159.488.391.23.307.312.456.213.121-.076-.262-.322-.595-.434-.97-.109-.361-.401-.943-.38-1.526.008-.221.103-.771.832-1.042z' stroke-linejoin='round'/><path d='m20.5664 19.7344v-3.459' stroke-linecap='round'/><path d='m18.5508 19.7461-.016-3.473' stroke-linecap='round'/><path d='m16.5547 16.3047.021 3.426' stroke-linecap='round'/></g>";
var GRAB_SVG = "<path d=\"m13.5557 17.5742c-.098-.375-.196-.847-.406-1.552-.167-.557-.342-.859-.47-1.233-.155-.455-.303-.721-.496-1.181-.139-.329-.364-1.048-.457-1.44-.119-.509.033-.924.244-1.206.253-.339.962-.49 1.357-.351.371.13.744.512.916.788.288.46.357.632.717 1.542.393.992.564 1.918.611 2.231l.085.452c-.001-.04-.043-1.122-.044-1.162-.035-1.029-.06-1.823-.038-2.939.002-.126.064-.587.084-.715.078-.5.305-.8.673-.979.412-.201.926-.215 1.401-.017.423.173.626.55.687 1.022.014.109.094.987.093 1.107-.013 1.025.006 1.641.015 2.174.004.231.003 1.625.017 1.469.061-.656.094-3.189.344-3.942.144-.433.405-.746.794-.929.431-.203 1.113-.07 1.404.243.285.305.446.692.482 1.153.032.405-.019.897-.02 1.245 0 .867-.021 1.324-.037 2.121-.001.038-.015.298.023.182.094-.28.188-.542.266-.745.049-.125.241-.614.359-.859.114-.234.211-.369.415-.688.2-.313.415-.448.668-.561.54-.235 1.109.112 1.301.591.086.215.009.713-.028 1.105-.061.647-.254 1.306-.352 1.648-.128.447-.274 1.235-.34 1.601-.072.394-.234 1.382-.359 1.82-.086.301-.371.978-.652 1.384 0 0-1.074 1.25-1.192 1.812-.117.563-.078.567-.101.965-.024.399.121.923.121.923s-.802.104-1.234.034c-.391-.062-.875-.841-1-1.078-.172-.328-.539-.265-.682-.023-.225.383-.709 1.07-1.051 1.113-.668.084-2.054.03-3.139.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.284-.36-.629-1.093-1.243-1.985-.348-.504-1.027-1.085-1.284-1.579-.223-.425-.331-.954-.19-1.325.225-.594.675-.897 1.362-.832.519.05.848.206 1.238.537.225.19.573.534.75.748.163.195.203.276.377.509.23.307.302.459.214.121\" fill=\"%23fff\"/><g stroke=\"%23000\" stroke-linecap=\"round\" stroke-width=\".75\"><path d=\"m13.5557 17.5742c-.098-.375-.196-.847-.406-1.552-.167-.557-.342-.859-.47-1.233-.155-.455-.303-.721-.496-1.181-.139-.329-.364-1.048-.457-1.44-.119-.509.033-.924.244-1.206.253-.339.962-.49 1.357-.351.371.13.744.512.916.788.288.46.357.632.717 1.542.393.992.564 1.918.611 2.231l.085.452c-.001-.04-.043-1.122-.044-1.162-.035-1.029-.06-1.823-.038-2.939.002-.126.064-.587.084-.715.078-.5.305-.8.673-.979.412-.201.926-.215 1.401-.017.423.173.626.55.687 1.022.014.109.094.987.093 1.107-.013 1.025.006 1.641.015 2.174.004.231.003 1.625.017 1.469.061-.656.094-3.189.344-3.942.144-.433.405-.746.794-.929.431-.203 1.113-.07 1.404.243.285.305.446.692.482 1.153.032.405-.019.897-.02 1.245 0 .867-.021 1.324-.037 2.121-.001.038-.015.298.023.182.094-.28.188-.542.266-.745.049-.125.241-.614.359-.859.114-.234.211-.369.415-.688.2-.313.415-.448.668-.561.54-.235 1.109.112 1.301.591.086.215.009.713-.028 1.105-.061.647-.254 1.306-.352 1.648-.128.447-.274 1.235-.34 1.601-.072.394-.234 1.382-.359 1.82-.086.301-.371.978-.652 1.384 0 0-1.074 1.25-1.192 1.812-.117.563-.078.567-.101.965-.024.399.121.923.121.923s-.802.104-1.234.034c-.391-.062-.875-.841-1-1.078-.172-.328-.539-.265-.682-.023-.225.383-.709 1.07-1.051 1.113-.668.084-2.054.03-3.139.02 0 0 .185-1.011-.227-1.358-.305-.26-.83-.784-1.144-1.06l-.832-.921c-.284-.36-.629-1.093-1.243-1.985-.348-.504-1.027-1.085-1.284-1.579-.223-.425-.331-.954-.19-1.325.225-.594.675-.897 1.362-.832.519.05.848.206 1.238.537.225.19.573.534.75.748.163.195.203.276.377.509.23.307.302.459.214.121\" stroke-linejoin=\"round\"/><path d=\"m20.5664 21.7344v-3.459\"/><path d=\"m18.5508 21.7461-.016-3.473\"/><path d=\"m16.5547 18.3047.021 3.426\"/></g>";
var _obj5;
var CURSORS22 = (_obj5 = {
}, _defineProperty(_obj5, TLCursor.None, function(r, f2) {
    return "none";
}), _defineProperty(_obj5, TLCursor.Default, function(r, f2) {
    return "default";
}), _defineProperty(_obj5, TLCursor.Pointer, function(r, f2) {
    return "pointer";
}), _defineProperty(_obj5, TLCursor.Cross, function(r, f2) {
    return "crosshair";
}), _defineProperty(_obj5, TLCursor.Move, function(r, f2) {
    return "move";
}), _defineProperty(_obj5, TLCursor.Grab, function(r, f2) {
    return getCursorCss(GRAB_SVG, r, f2);
}), _defineProperty(_obj5, TLCursor.Grabbing, function(r, f2) {
    return getCursorCss(GRABBING_SVG, r, f2);
}), _defineProperty(_obj5, TLCursor.Text, function(r, f2) {
    return getCursorCss(TEXT_SVG, r, f2);
}), _defineProperty(_obj5, TLCursor.ResizeEdge, function(r, f2) {
    return getCursorCss(EDGE_SVG, r, f2);
}), _defineProperty(_obj5, TLCursor.ResizeCorner, function(r, f2) {
    return getCursorCss(CORNER_SVG, r, f2);
}), _defineProperty(_obj5, TLCursor.EwResize, function(r, f2) {
    return getCursorCss(EDGE_SVG, r, f2);
}), _defineProperty(_obj5, TLCursor.NsResize, function(r, f2) {
    return getCursorCss(EDGE_SVG, r + 90, f2);
}), _defineProperty(_obj5, TLCursor.NeswResize, function(r, f2) {
    return getCursorCss(CORNER_SVG, r, f2);
}), _defineProperty(_obj5, TLCursor.NwseResize, function(r, f2) {
    return getCursorCss(CORNER_SVG, r + 90, f2);
}), _defineProperty(_obj5, TLCursor.Rotate, function(r, f2) {
    return getCursorCss(ROTATE_CORNER_SVG, r + 45, f2);
}), _defineProperty(_obj5, TLCursor.NwseRotate, function(r, f2) {
    return getCursorCss(ROTATE_CORNER_SVG, r, f2);
}), _defineProperty(_obj5, TLCursor.NeswRotate, function(r, f2) {
    return getCursorCss(ROTATE_CORNER_SVG, r + 90, f2);
}), _defineProperty(_obj5, TLCursor.SenwRotate, function(r, f2) {
    return getCursorCss(ROTATE_CORNER_SVG, r + 180, f2);
}), _defineProperty(_obj5, TLCursor.SwneRotate, function(r, f2) {
    return getCursorCss(ROTATE_CORNER_SVG, r + 270, f2);
}), _obj5);
function useCursor(ref, cursor, param) {
    var rotation = param === void 0 ? 0 : param;
    React17.useEffect(function() {
        var elm = ref.current;
        if (!elm) return;
        elm.style.setProperty("--tl-cursor", CURSORS22[cursor](GeomUtils.radiansToDegrees(rotation)));
    }, [
        cursor,
        rotation
    ]);
}
function useZoom(ref) {
    var viewport = useRendererContext().viewport;
    React18.useLayoutEffect(function() {
        return autorun(function() {
            var zoom = viewport.camera.zoom;
            var container = ref.current;
            if (!container) return;
            container.style.setProperty("--tl-zoom", zoom.toString());
        });
    }, []);
}
var stopEventPropagation = function(e) {
    return e.stopPropagation();
};
var ContextBarContainer = observer(function ContextBar(param) {
    var shapes2 = param.shapes, hidden = param.hidden, bounds = param.bounds, _rotation = param.rotation, rotation = _rotation === void 0 ? 0 : _rotation;
    var ref = useRendererContext(), _components = ref.components, ContextBar22 = _components.ContextBar, _viewport = ref.viewport, vpBounds = _viewport.bounds, _camera = _viewport.camera, _point = _slicedToArray(_camera.point, 2), x = _point[0], y = _point[1], zoom = _camera.zoom;
    var rBounds = React19.useRef(null);
    var rotatedBounds = BoundsUtils.getRotatedBounds(bounds, rotation);
    var scaledBounds = BoundsUtils.multiplyBounds(rotatedBounds, zoom);
    useCounterScaledPosition(rBounds, scaledBounds, zoom, 10003);
    if (!ContextBar22) throw Error("Expected a ContextBar component.");
    var screenBounds = BoundsUtils.translateBounds(scaledBounds, [
        x,
        y
    ]);
    var offsets = {
        left: screenBounds.minX,
        right: vpBounds.width - screenBounds.maxX,
        top: screenBounds.minY,
        bottom: vpBounds.height - screenBounds.maxY,
        width: screenBounds.width,
        height: screenBounds.height
    };
    var inView = BoundsUtils.boundsContain(vpBounds, screenBounds) || BoundsUtils.boundsCollide(vpBounds, screenBounds);
    React19.useLayoutEffect(function() {
        var elm = rBounds.current;
        if (!elm) return;
        if (hidden || !inView) {
            elm.classList.add("tl-fade-out");
            elm.classList.remove("tl-fade-in");
        } else {
            elm.classList.add("tl-fade-in");
            elm.classList.remove("tl-fade-out");
        }
    }, [
        hidden,
        inView
    ]);
    return(/* @__PURE__ */ React19.createElement("div", {
        ref: rBounds,
        className: "tl-counter-scaled-positioned tl-fade-out",
        "aria-label": "context-bar-container",
        onPointerMove: stopEventPropagation,
        onPointerUp: stopEventPropagation,
        onPointerDown: stopEventPropagation
    }, /* @__PURE__ */ React19.createElement(ContextBar22, {
        shapes: shapes2,
        bounds: bounds,
        offset: offsets,
        scaledBounds: scaledBounds,
        rotation: rotation
    })));
});
var HTMLLayer = observer(function HTMLLayer2(param) {
    var children = param.children;
    var rLayer = React20.useRef(null);
    var viewport = useRendererContext().viewport;
    React20.useEffect(function() {
        return autorun(function() {
            var layer = rLayer.current;
            if (!layer) return;
            var _camera = viewport.camera, zoom = _camera.zoom, point = _camera.point;
            layer.style.setProperty("transform", "scale(".concat(zoom, ") translate(").concat(point[0], "px, ").concat(point[1], "px)"));
        });
    }, []);
    return(/* @__PURE__ */ React20.createElement("div", {
        ref: rLayer,
        className: "tl-absolute tl-layer"
    }, children));
});
var Indicator = observer(function Shape(param) {
    var shape = param.shape, _isHovered = param.isHovered, isHovered = _isHovered === void 0 ? false : _isHovered, _isSelected = param.isSelected, isSelected = _isSelected === void 0 ? false : _isSelected, _isBinding = param.isBinding, isBinding = _isBinding === void 0 ? false : _isBinding, _isEditing = param.isEditing, isEditing = _isEditing === void 0 ? false : _isEditing, meta = param.meta;
    var bounds = shape.bounds, _props = shape.props, scale = _props.scale, _rotation = _props.rotation, rotation = _rotation === void 0 ? 0 : _rotation, ReactIndicator = shape.ReactIndicator;
    return(/* @__PURE__ */ React21.createElement(Container, {
        bounds: bounds,
        rotation: rotation,
        scale: scale,
        zIndex: 10000
    }, /* @__PURE__ */ React21.createElement(SVGContainer, null, /* @__PURE__ */ React21.createElement("g", {
        className: "tl-indicator-container ".concat(isSelected ? "tl-selected" : "tl-hovered")
    }, /* @__PURE__ */ React21.createElement(ReactIndicator, {
        isEditing: isEditing,
        isBinding: isBinding,
        isHovered: isHovered,
        isSelected: isSelected,
        isErasing: false,
        meta: meta
    })))));
});
function useShapeEvents(shape) {
    var ref = useRendererContext(), inputs = ref.inputs, callbacks = ref.callbacks;
    var rDoubleClickTimer = React222.useRef(-1);
    var events = React222.useMemo(function() {
        var onPointerMove = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            (_a2 = callbacks.onPointerMove) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Shape,
                shape: shape,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onPointerDown = function(e) {
            var _a2, _b;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            if (!order) (_a2 = e.currentTarget) == null ? void 0 : _a2.setPointerCapture(e.pointerId);
            (_b = callbacks.onPointerDown) == null ? void 0 : _b.call(callbacks, {
                type: TLTargetType.Shape,
                shape: shape,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onPointerUp = function(e) {
            var _a2, _b, _c;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            if (!order) (_a2 = e.currentTarget) == null ? void 0 : _a2.releasePointerCapture(e.pointerId);
            (_b = callbacks.onPointerUp) == null ? void 0 : _b.call(callbacks, {
                type: TLTargetType.Shape,
                shape: shape,
                order: order
            }, e);
            var now = Date.now();
            var elapsed = now - rDoubleClickTimer.current;
            if (elapsed > DOUBLE_CLICK_DURATION) {
                rDoubleClickTimer.current = now;
            } else {
                if (elapsed <= DOUBLE_CLICK_DURATION) {
                    (_c = callbacks.onDoubleClick) == null ? void 0 : _c.call(callbacks, {
                        type: TLTargetType.Shape,
                        shape: shape,
                        order: order
                    }, e);
                    rDoubleClickTimer.current = -1;
                }
            }
            e.order = order + 1;
        };
        var onPointerEnter = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            (_a2 = callbacks.onPointerEnter) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Shape,
                shape: shape,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onPointerLeave = function(e) {
            var _a2;
            var _order = e.order, order = _order === void 0 ? 0 : _order;
            (_a2 = callbacks.onPointerLeave) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Shape,
                shape: shape,
                order: order
            }, e);
            e.order = order + 1;
        };
        var onKeyDown = function(e) {
            var _a2;
            (_a2 = callbacks.onKeyDown) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Shape,
                shape: shape,
                order: -1
            }, e);
            e.stopPropagation();
        };
        var onKeyUp = function(e) {
            var _a2;
            (_a2 = callbacks.onKeyUp) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Shape,
                shape: shape,
                order: -1
            }, e);
            e.stopPropagation();
        };
        return {
            onPointerDown: onPointerDown,
            onPointerMove: onPointerMove,
            onPointerUp: onPointerUp,
            onPointerEnter: onPointerEnter,
            onPointerLeave: onPointerLeave,
            onKeyUp: onKeyUp,
            onKeyDown: onKeyDown
        };
    }, [
        shape.id,
        inputs,
        callbacks
    ]);
    return events;
}
var Shape2 = observer(function Shape3(param) {
    var shape = param.shape, _isHovered = param.isHovered, isHovered = _isHovered === void 0 ? false : _isHovered, _isSelected = param.isSelected, isSelected = _isSelected === void 0 ? false : _isSelected, _isBinding = param.isBinding, isBinding = _isBinding === void 0 ? false : _isBinding, _isErasing = param.isErasing, isErasing = _isErasing === void 0 ? false : _isErasing, _isEditing = param.isEditing, isEditing = _isEditing === void 0 ? false : _isEditing, onEditingEnd = param.onEditingEnd, asset = param.asset, meta = param.meta;
    var bounds = shape.bounds, _props = shape.props, rotation = _props.rotation, scale = _props.scale, ReactComponent = shape.ReactComponent;
    var events = useShapeEvents(shape);
    return(/* @__PURE__ */ React23.createElement(Container, {
        bounds: bounds,
        rotation: rotation,
        scale: scale
    }, /* @__PURE__ */ React23.createElement(ReactComponent, {
        meta: meta,
        isEditing: isEditing,
        isBinding: isBinding,
        isHovered: isHovered,
        isSelected: isSelected,
        isErasing: isErasing,
        events: events,
        asset: asset,
        onEditingEnd: onEditingEnd
    })));
});
var SVGLayer = observer(function SVGLayer2(param) {
    var children = param.children;
    var rGroup = React24.useRef(null);
    var viewport = useRendererContext().viewport;
    React24.useEffect(function() {
        return autorun(function() {
            var group = rGroup.current;
            if (!group) return;
            var _camera = viewport.camera, zoom = _camera.zoom, point = _camera.point;
            group.style.setProperty("transform", "scale(".concat(zoom, ") translateX(").concat(point[0], "px) translateY(").concat(point[1], "px)"));
        });
    }, []);
    return(/* @__PURE__ */ React24.createElement("svg", {
        className: "tl-absolute tl-overlay",
        pointerEvents: "none"
    }, /* @__PURE__ */ React24.createElement("g", {
        ref: rGroup,
        pointerEvents: "none"
    }, children)));
});
var AppProvider = observer(function App(props) {
    var app = useAppSetup(props);
    var context = getAppContext(props.id);
    usePropControl(app, props);
    useSetup(app, props);
    return(/* @__PURE__ */ React25.createElement(context.Provider, {
        value: app
    }, props.children));
});
function Renderer(_a2) {
    var _b = _a2, viewport = _b.viewport, inputs = _b.inputs, callbacks = _b.callbacks, components2 = _b.components, rest = __objRest(_b, [
        "viewport",
        "inputs",
        "callbacks",
        "components"
    ]);
    return(/* @__PURE__ */ React26.createElement(RendererContext, {
        id: rest.id,
        viewport: viewport,
        inputs: inputs,
        callbacks: callbacks,
        components: components2,
        meta: rest.meta
    }, /* @__PURE__ */ React26.createElement(Canvas, __spreadValues3({
    }, rest))));
}
var DirectionIndicator = observer(function DirectionIndicator2(param) {
    var direction = param.direction;
    var ref = useRendererContext(), bounds = ref.viewport.bounds;
    var rIndicator = React27.useRef(null);
    React27.useLayoutEffect(function() {
        var elm = rIndicator.current;
        if (!elm) return;
        var center = [
            bounds.width / 2,
            bounds.height / 2
        ];
        var insetBoundSides = BoundsUtils.getRectangleSides([
            12,
            12
        ], [
            bounds.width - 24,
            bounds.height - 24
        ]);
        var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
        try {
            for(var _iterator = insetBoundSides[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                var _value = _slicedToArray(_step.value, 2), A = _value[0], B = _value[1];
                var int = intersectRayLineSegment(center, direction, A, B);
                if (!int.didIntersect) continue;
                var point = int.points[0];
                elm.style.setProperty("transform", "translate(".concat(point[0] - 6, "px,").concat(point[1] - 6, "px) rotate(").concat(src_default.toAngle(direction), "rad)"));
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally{
            try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                }
            } finally{
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }, [
        direction,
        bounds
    ]);
    return(/* @__PURE__ */ React27.createElement("div", {
        ref: rIndicator,
        className: "tl-direction-indicator"
    }, /* @__PURE__ */ React27.createElement("svg", {
        height: 12,
        width: 12
    }, /* @__PURE__ */ React27.createElement("polygon", {
        points: "0,0 12,6 0,12"
    }))));
});
function useKeyboardEvents() {
    var callbacks = useRendererContext().callbacks;
    React28.useEffect(function() {
        var onKeyDown = function(e) {
            var _a2;
            (_a2 = callbacks.onKeyDown) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Canvas,
                order: -1
            }, e);
        };
        var onKeyUp = function(e) {
            var _a2;
            (_a2 = callbacks.onKeyUp) == null ? void 0 : _a2.call(callbacks, {
                type: TLTargetType.Canvas,
                order: -1
            }, e);
        };
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        return function() {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        };
    }, []);
}
var Canvas = observer(function Renderer2(param) {
    var id = param.id, className = param.className, brush = param.brush, shapes2 = param.shapes, assets = param.assets, bindingShape = param.bindingShape, editingShape = param.editingShape, hoveredShape = param.hoveredShape, selectionBounds = param.selectionBounds, selectedShapes = param.selectedShapes, erasingShapes = param.erasingShapes, selectionDirectionHint = param.selectionDirectionHint, _cursor = param.cursor, cursor = _cursor === void 0 ? TLCursor.Default : _cursor, _cursorRotation = param.cursorRotation, cursorRotation = _cursorRotation === void 0 ? 0 : _cursorRotation, _selectionRotation = param.selectionRotation, selectionRotation = _selectionRotation === void 0 ? 0 : _selectionRotation, _showSelection = param.showSelection, showSelection = _showSelection === void 0 ? true : _showSelection, _showHandles = param.showHandles, showHandles = _showHandles === void 0 ? true : _showHandles, _showSelectionRotation = param.showSelectionRotation, showSelectionRotation = _showSelectionRotation === void 0 ? false : _showSelectionRotation, _showResizeHandles = param.showResizeHandles, showResizeHandles = _showResizeHandles === void 0 ? true : _showResizeHandles, _showRotateHandles = param.showRotateHandles, showRotateHandles = _showRotateHandles === void 0 ? true : _showRotateHandles, _showSelectionDetail = param.showSelectionDetail, showSelectionDetail = _showSelectionDetail === void 0 ? true : _showSelectionDetail, _showContextBar = param.showContextBar, showContextBar = _showContextBar === void 0 ? true : _showContextBar, _showGrid = param.showGrid, showGrid = _showGrid === void 0 ? true : _showGrid, _gridSize = param.gridSize, gridSize = _gridSize === void 0 ? 8 : _gridSize, _onEditingEnd = param.onEditingEnd, onEditingEnd = _onEditingEnd === void 0 ? NOOP : _onEditingEnd, _theme = param.theme, theme = _theme === void 0 ? EMPTY_OBJECT2 : _theme, children = param.children;
    var rContainer = React29.useRef(null);
    var ref = useRendererContext(), viewport = ref.viewport, components2 = ref.components, meta = ref.meta;
    var zoom = viewport.camera.zoom;
    useStylesheet(theme, id);
    usePreventNavigation(rContainer);
    useResizeObserver(rContainer, viewport);
    useGestureEvents(rContainer);
    useCursor(rContainer, cursor, cursorRotation);
    useZoom(rContainer);
    useKeyboardEvents();
    var events = useCanvasEvents();
    var onlySelectedShape = (selectedShapes == null ? void 0 : selectedShapes.length) === 1 && selectedShapes[0];
    var onlySelectedShapeWithHandles = onlySelectedShape && "handles" in onlySelectedShape.props ? selectedShapes == null ? void 0 : selectedShapes[0] : void 0;
    var selectedShapesSet = React29.useMemo(function() {
        return new Set(selectedShapes || []);
    }, [
        selectedShapes
    ]);
    var erasingShapesSet = React29.useMemo(function() {
        return new Set(erasingShapes || []);
    }, [
        erasingShapes
    ]);
    return(/* @__PURE__ */ React29.createElement("div", {
        ref: rContainer,
        className: "tl-container ".concat(className != null ? className : "")
    }, /* @__PURE__ */ React29.createElement("div", __spreadValues3({
        tabIndex: -1,
        className: "tl-absolute tl-canvas"
    }, events), showGrid && components2.Grid && /* @__PURE__ */ React29.createElement(components2.Grid, {
        size: gridSize
    }), /* @__PURE__ */ React29.createElement(HTMLLayer, null, components2.SelectionBackground && selectedShapes && selectionBounds && showSelection && /* @__PURE__ */ React29.createElement(Container, {
        bounds: selectionBounds,
        zIndex: 2
    }, /* @__PURE__ */ React29.createElement(components2.SelectionBackground, {
        zoom: zoom,
        shapes: selectedShapes,
        bounds: selectionBounds,
        showResizeHandles: showResizeHandles,
        showRotateHandles: showRotateHandles
    })), shapes2 && shapes2.map(function(shape, i) {
        /* @__PURE__ */ return React29.createElement(Shape2, {
            key: "shape_" + shape.id,
            shape: shape,
            asset: assets && shape.props.assetId ? assets[shape.props.assetId] : void 0,
            isEditing: shape === editingShape,
            isHovered: shape === hoveredShape,
            isBinding: shape === bindingShape,
            isSelected: selectedShapesSet.has(shape),
            isErasing: erasingShapesSet.has(shape),
            meta: meta,
            zIndex: 1000 + i,
            onEditingEnd: onEditingEnd
        });
    }), selectedShapes == null ? void 0 : selectedShapes.map(function(shape) {
        /* @__PURE__ */ return React29.createElement(Indicator, {
            key: "selected_indicator_" + shape.id,
            shape: shape,
            isEditing: shape === editingShape,
            isHovered: false,
            isBinding: false,
            isSelected: true
        });
    }), hoveredShape && /* @__PURE__ */ React29.createElement(Indicator, {
        key: "hovered_indicator_" + hoveredShape.id,
        shape: hoveredShape
    }), brush && components2.Brush && /* @__PURE__ */ React29.createElement(components2.Brush, {
        bounds: brush
    }), selectedShapes && selectionBounds && /* @__PURE__ */ React29.createElement(React29.Fragment, null, showSelection && components2.SelectionForeground && /* @__PURE__ */ React29.createElement(Container, {
        bounds: selectionBounds,
        zIndex: 10002
    }, /* @__PURE__ */ React29.createElement(components2.SelectionForeground, {
        zoom: zoom,
        shapes: selectedShapes,
        bounds: selectionBounds,
        showResizeHandles: showResizeHandles,
        showRotateHandles: showRotateHandles
    })), showHandles && onlySelectedShapeWithHandles && components2.Handle && /* @__PURE__ */ React29.createElement(Container, {
        bounds: selectionBounds,
        zIndex: 10003
    }, /* @__PURE__ */ React29.createElement(SVGContainer, null, onlySelectedShapeWithHandles.props.handles.map(function(handle, i) {
        return React29.createElement(components2.Handle, {
            key: "".concat(handle.id, "_handle_").concat(i),
            shape: onlySelectedShapeWithHandles,
            handle: handle,
            index: i
        });
    }))), selectedShapes && components2.SelectionDetail && /* @__PURE__ */ React29.createElement(SelectionDetailContainer, {
        key: "detail" + selectedShapes.map(function(shape) {
            return shape.id;
        }).join(""),
        shapes: selectedShapes,
        bounds: selectionBounds,
        detail: showSelectionRotation ? "rotation" : "size",
        hidden: !showSelectionDetail,
        rotation: selectionRotation
    }), selectedShapes && components2.ContextBar && /* @__PURE__ */ React29.createElement(ContextBarContainer, {
        key: "context" + selectedShapes.map(function(shape) {
            return shape.id;
        }).join(""),
        shapes: selectedShapes,
        hidden: !showContextBar,
        bounds: selectedShapes.length === 1 ? selectedShapes[0].bounds : selectionBounds,
        rotation: selectedShapes.length === 1 ? selectedShapes[0].props.rotation : 0
    }))), selectionDirectionHint && selectionBounds && selectedShapes && /* @__PURE__ */ React29.createElement(DirectionIndicator, {
        direction: selectionDirectionHint,
        bounds: selectionBounds,
        shapes: selectedShapes
    })), children));
});
var RendererContext = observer(function App2(param) {
    var _id = param.id, id = _id === void 0 ? "noid" : _id, viewport = param.viewport, inputs = param.inputs, _callbacks = param.callbacks, callbacks = _callbacks === void 0 ? EMPTY_OBJECT2 : _callbacks, _meta = param.meta, meta = _meta === void 0 ? EMPTY_OBJECT2 : _meta, tmp = param.components, components2 = tmp === void 0 ? EMPTY_OBJECT2 : tmp, children = param.children;
    var ref = _slicedToArray(React30.useState(function() {
        var Brush3 = components2.Brush, ContextBar22 = components2.ContextBar, DirectionIndicator3 = components2.DirectionIndicator, Grid3 = components2.Grid, Handle3 = components2.Handle, SelectionBackground3 = components2.SelectionBackground, SelectionDetail4 = components2.SelectionDetail, SelectionForeground3 = components2.SelectionForeground;
        return {
            id: id,
            viewport: viewport,
            inputs: inputs,
            callbacks: callbacks,
            meta: meta,
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
    }), 2), currentContext = ref[0], setCurrentContext = ref[1];
    React30.useLayoutEffect(function() {
        var Brush3 = components2.Brush, ContextBar22 = components2.ContextBar, DirectionIndicator3 = components2.DirectionIndicator, Grid3 = components2.Grid, Handle3 = components2.Handle, SelectionBackground3 = components2.SelectionBackground, SelectionDetail4 = components2.SelectionDetail, SelectionForeground3 = components2.SelectionForeground;
        return autorun(function() {
            setCurrentContext({
                id: id,
                viewport: viewport,
                inputs: inputs,
                callbacks: callbacks,
                meta: meta,
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
    var context = getRendererContext(id);
    return(/* @__PURE__ */ React30.createElement(context.Provider, {
        value: currentContext
    }, children));
});
var STEPS = [
    [
        -1,
        0.15,
        64
    ],
    [
        0.05,
        0.375,
        16
    ],
    [
        0.15,
        1,
        4
    ],
    [
        0.7,
        2.5,
        1
    ]
];
var Grid = observer(function Grid2(param9) {
    var size = param9.size;
    var ref = useRendererContext(), _viewport = ref.viewport, _camera = _viewport.camera, point = _camera.point, zoom = _camera.zoom;
    return(/* @__PURE__ */ React31.createElement("svg", {
        className: "tl-grid",
        version: "1.1",
        xmlns: "http://www.w3.org/2000/svg"
    }, /* @__PURE__ */ React31.createElement("defs", null, STEPS.map(function(param, i) {
        var _param = _slicedToArray(param, 3), min = _param[0], mid = _param[1], _size = _param[2];
        var s = _size * size * zoom;
        var xo = point[0] * zoom;
        var yo = point[1] * zoom;
        var gxo = xo > 0 ? xo % s : s + xo % s;
        var gyo = yo > 0 ? yo % s : s + yo % s;
        var opacity = zoom < mid ? modulate(zoom, [
            min,
            mid
        ], [
            0,
            1
        ]) : 1;
        return(/* @__PURE__ */ React31.createElement("pattern", {
            key: "grid-pattern-".concat(i),
            id: "grid-".concat(i),
            width: s,
            height: s,
            patternUnits: "userSpaceOnUse"
        }, /* @__PURE__ */ React31.createElement("circle", {
            className: "tl-grid-dot",
            cx: gxo,
            cy: gyo,
            r: 1,
            opacity: opacity
        })));
    })), STEPS.map(function(_15, i) {
        /* @__PURE__ */ return React31.createElement("rect", {
            key: "grid-rect-".concat(i),
            width: "100%",
            height: "100%",
            fill: "url(#grid-".concat(i, ")")
        });
    })));
});
var SelectionBackground = observer(function SelectionBackground2(param) {
    var bounds = param.bounds;
    var events = useBoundsEvents("background");
    return(/* @__PURE__ */ React322.createElement(SVGContainer, __spreadValues3({
    }, events), /* @__PURE__ */ React322.createElement("rect", {
        className: "tl-bounds-bg",
        width: Math.max(1, bounds.width),
        height: Math.max(1, bounds.height),
        pointerEvents: "all"
    })));
});
var SelectionDetail = observer(function SelectionDetail2(param) {
    var bounds = param.bounds, shapes2 = param.shapes, scaledBounds = param.scaledBounds, _detail = param.detail, detail = _detail === void 0 ? "size" : _detail, _rotation = param.rotation, rotation = _rotation === void 0 ? 0 : _rotation;
    var _a2;
    var selectionRotation = shapes2.length === 1 ? rotation : (_a2 = bounds.rotation) != null ? _a2 : 0;
    var isFlipped = !(selectionRotation < TAU2 || selectionRotation > TAU2 * 3);
    var isLine = shapes2.length === 1 && shapes2[0].type === "line";
    return(/* @__PURE__ */ React33.createElement(HTMLContainer, {
        centered: true
    }, /* @__PURE__ */ React33.createElement("div", {
        className: "tl-bounds-detail",
        style: {
            transform: isFlipped ? "rotate(".concat(Math.PI + selectionRotation, "rad) translateY(").concat(scaledBounds.height / 2 + 32, "px)") : "rotate(".concat(selectionRotation, "rad) translateY(").concat(scaledBounds.height / 2 + 24, "px)"),
            padding: "2px 3px",
            borderRadius: "1px"
        }
    }, isLine ? "".concat(src_default.dist(shapes2[0].props.handles[0].point, shapes2[0].props.handles[1].point).toFixed()) : detail === "size" ? "".concat(bounds.width.toFixed(), " \xd7 ").concat(bounds.height.toFixed()) : "∠".concat(GeomUtils.radiansToDegrees(GeomUtils.clampRadians(rotation)).toFixed(), "\xb0"))));
});
var _obj6;
var cornerBgClassnames = (_obj6 = {
}, _defineProperty(_obj6, TLResizeCorner.TopLeft, "tl-cursor-nwse"), _defineProperty(_obj6, TLResizeCorner.TopRight, "tl-cursor-nesw"), _defineProperty(_obj6, TLResizeCorner.BottomRight, "tl-cursor-nwse"), _defineProperty(_obj6, TLResizeCorner.BottomLeft, "tl-cursor-nesw"), _obj6);
var CornerHandle = observer(function CornerHandle2(param) {
    var cx = param.cx, cy = param.cy, size = param.size, targetSize = param.targetSize, corner = param.corner, isHidden = param.isHidden;
    var events = useBoundsEvents(corner);
    return(/* @__PURE__ */ React34.createElement("g", __spreadValues3({
        opacity: isHidden ? 0 : 1
    }, events), /* @__PURE__ */ React34.createElement("rect", {
        className: "tl-transparent " + (isHidden ? "" : cornerBgClassnames[corner]),
        "aria-label": "".concat(corner, " target"),
        x: cx - targetSize * 1.25,
        y: cy - targetSize * 1.25,
        width: targetSize * 2.5,
        height: targetSize * 2.5,
        pointerEvents: isHidden ? "none" : "all"
    }), /* @__PURE__ */ React34.createElement("rect", {
        className: "tl-corner-handle",
        "aria-label": "".concat(corner, " handle"),
        x: cx - size / 2,
        y: cy - size / 2,
        width: size,
        height: size,
        pointerEvents: "none"
    })));
});
var _obj7;
var edgeClassnames = (_obj7 = {
}, _defineProperty(_obj7, TLResizeEdge.Top, "tl-cursor-ns"), _defineProperty(_obj7, TLResizeEdge.Right, "tl-cursor-ew"), _defineProperty(_obj7, TLResizeEdge.Bottom, "tl-cursor-ns"), _defineProperty(_obj7, TLResizeEdge.Left, "tl-cursor-ew"), _obj7);
var EdgeHandle = observer(function EdgeHandle2(param) {
    var x = param.x, y = param.y, width = param.width, height = param.height, targetSize = param.targetSize, edge = param.edge, isHidden = param.isHidden;
    var events = useBoundsEvents(edge);
    return(/* @__PURE__ */ React35.createElement("rect", __spreadValues3({
        pointerEvents: isHidden ? "none" : "all",
        className: "tl-transparent tl-edge-handle " + (isHidden ? "" : edgeClassnames[edge]),
        "aria-label": "".concat(edge, " target"),
        opacity: isHidden ? 0 : 1,
        x: x - targetSize,
        y: y - targetSize,
        width: Math.max(1, width + targetSize * 2),
        height: Math.max(1, height + targetSize * 2)
    }, events)));
});
var RotateHandle = observer(function RotateHandle2(param) {
    var cx = param.cx, cy = param.cy, size = param.size, targetSize = param.targetSize, isHidden = param.isHidden;
    var events = useBoundsEvents("rotate");
    return(/* @__PURE__ */ React36.createElement("g", __spreadValues3({
        opacity: isHidden ? 0 : 1
    }, events), /* @__PURE__ */ React36.createElement("circle", {
        className: "tl-transparent ",
        "aria-label": "rotate target",
        cx: cx,
        cy: cy,
        r: targetSize,
        pointerEvents: isHidden ? "none" : "all"
    }), /* @__PURE__ */ React36.createElement("circle", {
        className: "tl-rotate-handle",
        "aria-label": "rotate handle",
        cx: cx,
        cy: cy,
        r: size / 2,
        pointerEvents: "none"
    })));
});
var RotateCornerHandle = observer(function RotateCornerHandle2(param) {
    var cx = param.cx, cy = param.cy, targetSize = param.targetSize, corner = param.corner, isHidden = param.isHidden;
    var events = useBoundsEvents(corner);
    return(/* @__PURE__ */ React37.createElement("g", __spreadValues3({
        opacity: isHidden ? 0 : 1
    }, events), /* @__PURE__ */ React37.createElement("rect", {
        className: "tl-transparent",
        "aria-label": "".concat(corner, " target"),
        x: cx - targetSize * 2.5,
        y: cy - targetSize * 2.5,
        width: targetSize * 3,
        height: targetSize * 3,
        pointerEvents: isHidden ? "none" : "all"
    })));
});
var SelectionForeground = observer(function SelectionForeground2(param) {
    var bounds = param.bounds, zoom = param.zoom, showResizeHandles = param.showResizeHandles, showRotateHandles = param.showRotateHandles;
    var width = bounds.width, height = bounds.height;
    var size = 8 / zoom;
    var targetSize = 6 / zoom;
    return(/* @__PURE__ */ React38.createElement(SVGContainer, null, /* @__PURE__ */ React38.createElement("rect", {
        className: "tl-bounds-fg",
        width: Math.max(width, 1),
        height: Math.max(height, 1),
        pointerEvents: "none"
    }), /* @__PURE__ */ React38.createElement(EdgeHandle, {
        x: targetSize * 2,
        y: 0,
        width: width - targetSize * 4,
        height: 0,
        targetSize: targetSize,
        edge: TLResizeEdge.Top,
        isHidden: !showResizeHandles
    }), /* @__PURE__ */ React38.createElement(EdgeHandle, {
        x: width,
        y: targetSize * 2,
        width: 0,
        height: height - targetSize * 4,
        targetSize: targetSize,
        edge: TLResizeEdge.Right,
        isHidden: !showResizeHandles
    }), /* @__PURE__ */ React38.createElement(EdgeHandle, {
        x: targetSize * 2,
        y: height,
        width: width - targetSize * 4,
        height: 0,
        targetSize: targetSize,
        edge: TLResizeEdge.Bottom,
        isHidden: !showResizeHandles
    }), /* @__PURE__ */ React38.createElement(EdgeHandle, {
        x: 0,
        y: targetSize * 2,
        width: 0,
        height: height - targetSize * 4,
        targetSize: targetSize,
        edge: TLResizeEdge.Left,
        isHidden: !showResizeHandles
    }), /* @__PURE__ */ React38.createElement(RotateCornerHandle, {
        cx: 0,
        cy: 0,
        targetSize: targetSize,
        corner: TLRotateCorner.TopLeft,
        isHidden: !showRotateHandles
    }), /* @__PURE__ */ React38.createElement(RotateCornerHandle, {
        cx: width + targetSize * 2,
        cy: 0,
        targetSize: targetSize,
        corner: TLRotateCorner.TopRight,
        isHidden: !showRotateHandles
    }), /* @__PURE__ */ React38.createElement(RotateCornerHandle, {
        cx: width + targetSize * 2,
        cy: height + targetSize * 2,
        targetSize: targetSize,
        corner: TLRotateCorner.BottomRight,
        isHidden: !showRotateHandles
    }), /* @__PURE__ */ React38.createElement(RotateCornerHandle, {
        cx: 0,
        cy: height + targetSize * 2,
        targetSize: targetSize,
        corner: TLRotateCorner.BottomLeft,
        isHidden: !showRotateHandles
    }), /* @__PURE__ */ React38.createElement(CornerHandle, {
        cx: 0,
        cy: 0,
        size: size,
        targetSize: targetSize,
        corner: TLResizeCorner.TopLeft,
        isHidden: !showResizeHandles
    }), /* @__PURE__ */ React38.createElement(CornerHandle, {
        cx: width,
        cy: 0,
        size: size,
        targetSize: targetSize,
        corner: TLResizeCorner.TopRight,
        isHidden: !showResizeHandles
    }), /* @__PURE__ */ React38.createElement(CornerHandle, {
        cx: width,
        cy: height,
        size: size,
        targetSize: targetSize,
        corner: TLResizeCorner.BottomRight,
        isHidden: !showResizeHandles
    }), /* @__PURE__ */ React38.createElement(CornerHandle, {
        cx: 0,
        cy: height,
        size: size,
        targetSize: targetSize,
        corner: TLResizeCorner.BottomLeft,
        isHidden: !showResizeHandles
    })));
});
var Brush = observer(function Brush2(param) {
    var bounds = param.bounds;
    return(/* @__PURE__ */ React39.createElement(Container, {
        bounds: bounds,
        zIndex: 10001
    }, /* @__PURE__ */ React39.createElement(SVGContainer, null, /* @__PURE__ */ React39.createElement("rect", {
        className: "tl-brush",
        x: 0,
        y: 0,
        width: bounds.width,
        height: bounds.height
    }))));
});
var Cursor = observer(function Cursor2() {
    return(/* @__PURE__ */ React40.createElement(React40.Fragment, null));
});
var Handle = observer(function Handle2(param) {
    var shape = param.shape, handle = param.handle, index = param.index;
    var events = useHandleEvents(shape, index);
    var _point = _slicedToArray(handle.point, 2), x = _point[0], y = _point[1];
    return(/* @__PURE__ */ React41.createElement("g", __spreadProps3(__spreadValues3({
        className: "tl-handle",
        "aria-label": "handle"
    }, events), {
        transform: "translate(".concat(x, ", ").concat(y, ")")
    }), /* @__PURE__ */ React41.createElement("circle", {
        className: "tl-handle-bg",
        pointerEvents: "all"
    }), /* @__PURE__ */ React41.createElement("circle", {
        className: "tl-counter-scaled tl-handle",
        pointerEvents: "none",
        r: 4
    })));
});
var SelectionDetailContainer = observer(function SelectionDetail3(param) {
    var bounds = param.bounds, hidden = param.hidden, shapes2 = param.shapes, _rotation = param.rotation, rotation = _rotation === void 0 ? 0 : _rotation, _detail = param.detail, detail = _detail === void 0 ? "size" : _detail;
    var ref = useRendererContext(), _components = ref.components, SelectionDetail4 = _components.SelectionDetail, _viewport = ref.viewport, zoom = _viewport.camera.zoom;
    var rBounds = React42.useRef(null);
    var scaledBounds = BoundsUtils.multiplyBounds(bounds, zoom);
    useCounterScaledPosition(rBounds, scaledBounds, zoom, 10003);
    if (!SelectionDetail4) throw Error("Expected a SelectionDetail component.");
    return(/* @__PURE__ */ React42.createElement("div", {
        ref: rBounds,
        className: "tl-counter-scaled-positioned ".concat(hidden ? "tl-fade-out" : ""),
        "aria-label": "bounds-detail-container"
    }, /* @__PURE__ */ React42.createElement(SelectionDetail4, {
        shapes: shapes2,
        bounds: bounds,
        scaledBounds: scaledBounds,
        zoom: zoom,
        rotation: rotation,
        detail: detail
    })));
});
var AppCanvas = observer(function InnerApp(props) {
    var app = useApp();
    return(/* @__PURE__ */ React43.createElement(Renderer, __spreadValues3({
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
    }, props)));
});
function getContextBarTranslation(barSize, offset) {
    var x = 0;
    var y = 0;
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
    return [
        x,
        y
    ];
}
// src/app.tsx
var React87 = __toESM(require("react"));
// src/components/AppUI.tsx
init_cjs_shims();
var React66 = __toESM(require("react"));
// src/components/Toolbar/index.ts
init_cjs_shims();
// src/components/Toolbar/ToolBar.tsx
init_cjs_shims();
var React45 = __toESM(require("react"));
var ToolBar = observer(function ToolBar2() {
    var app = useApp();
    var zoomIn = React45.useCallback(function() {
        app.api.zoomIn();
    }, [
        app
    ]);
    var zoomOut = React45.useCallback(function() {
        app.api.zoomOut();
    }, [
        app
    ]);
    var resetZoom = React45.useCallback(function() {
        app.api.resetZoom();
    }, [
        app
    ]);
    var zoomToFit = React45.useCallback(function() {
        app.api.zoomToFit();
    }, [
        app
    ]);
    var zoomToSelection = React45.useCallback(function() {
        app.api.zoomToSelection();
    }, [
        app
    ]);
    var sendToBack = React45.useCallback(function() {
        app.sendToBack();
    }, [
        app
    ]);
    var sendBackward = React45.useCallback(function() {
        app.sendBackward();
    }, [
        app
    ]);
    var bringToFront = React45.useCallback(function() {
        app.bringToFront();
    }, [
        app
    ]);
    var bringForward = React45.useCallback(function() {
        app.bringForward();
    }, [
        app
    ]);
    var flipHorizontal = React45.useCallback(function() {
        app.flipHorizontal();
    }, [
        app
    ]);
    var flipVertical = React45.useCallback(function() {
        app.flipVertical();
    }, [
        app
    ]);
    return(/* @__PURE__ */ React45.createElement("div", {
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
    }, "zoom to selection")));
});
// src/components/StatusBar/index.ts
init_cjs_shims();
// src/components/StatusBar/StatusBar.tsx
init_cjs_shims();
var React46 = __toESM(require("react"));
var StatusBar = observer(function StatusBar2() {
    var app = useApp();
    return(/* @__PURE__ */ React46.createElement("div", {
        className: "statusbar"
    }, app.selectedTool.id, " | ", app.selectedTool.currentState.id));
});
// src/components/PrimaryTools/index.ts
init_cjs_shims();
// src/components/PrimaryTools/PrimaryTools.tsx
init_cjs_shims();
var React65 = __toESM(require("react"));
// ../../node_modules/@radix-ui/react-icons/dist/react-icons.esm.js
init_cjs_shims();
var import_react11 = require("react");
function _objectWithoutPropertiesLoose2(source, excluded) {
    if (source == null) return {
    };
    var target = {
    };
    var sourceKeys = Object.keys(source);
    var key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
    }
    return target;
}
var BoxIcon = /* @__PURE__ */ (0, import_react11.forwardRef)(function(_ref, forwardedRef) {
    var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, [
        "color"
    ]);
    return (0, import_react11.createElement)("svg", Object.assign({
        width: "15",
        height: "15",
        viewBox: "0 0 15 15",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    }, props, {
        ref: forwardedRef
    }), (0, import_react11.createElement)("path", {
        d: "M12.5 2H2.5C2.22386 2 2 2.22386 2 2.5V12.5C2 12.7761 2.22386 13 2.5 13H12.5C12.7761 13 13 12.7761 13 12.5V2.5C13 2.22386 12.7761 2 12.5 2ZM2.5 1C1.67157 1 1 1.67157 1 2.5V12.5C1 13.3284 1.67157 14 2.5 14H12.5C13.3284 14 14 13.3284 14 12.5V2.5C14 1.67157 13.3284 1 12.5 1H2.5Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }));
});
var CircleIcon = /* @__PURE__ */ (0, import_react11.forwardRef)(function(_ref, forwardedRef) {
    var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, [
        "color"
    ]);
    return (0, import_react11.createElement)("svg", Object.assign({
        width: "15",
        height: "15",
        viewBox: "0 0 15 15",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    }, props, {
        ref: forwardedRef
    }), (0, import_react11.createElement)("path", {
        d: "M0.877075 7.49991C0.877075 3.84222 3.84222 0.877075 7.49991 0.877075C11.1576 0.877075 14.1227 3.84222 14.1227 7.49991C14.1227 11.1576 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1576 0.877075 7.49991ZM7.49991 1.82708C4.36689 1.82708 1.82708 4.36689 1.82708 7.49991C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49991C13.1727 4.36689 10.6329 1.82708 7.49991 1.82708Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }));
});
var CodeIcon = /* @__PURE__ */ (0, import_react11.forwardRef)(function(_ref, forwardedRef) {
    var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, [
        "color"
    ]);
    return (0, import_react11.createElement)("svg", Object.assign({
        width: "15",
        height: "15",
        viewBox: "0 0 15 15",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    }, props, {
        ref: forwardedRef
    }), (0, import_react11.createElement)("path", {
        d: "M9.96424 2.68571C10.0668 2.42931 9.94209 2.13833 9.6857 2.03577C9.4293 1.93322 9.13832 2.05792 9.03576 2.31432L5.03576 12.3143C4.9332 12.5707 5.05791 12.8617 5.3143 12.9642C5.5707 13.0668 5.86168 12.9421 5.96424 12.6857L9.96424 2.68571ZM3.85355 5.14646C4.04882 5.34172 4.04882 5.6583 3.85355 5.85356L2.20711 7.50001L3.85355 9.14646C4.04882 9.34172 4.04882 9.6583 3.85355 9.85356C3.65829 10.0488 3.34171 10.0488 3.14645 9.85356L1.14645 7.85356C0.951184 7.6583 0.951184 7.34172 1.14645 7.14646L3.14645 5.14646C3.34171 4.9512 3.65829 4.9512 3.85355 5.14646ZM11.1464 5.14646C11.3417 4.9512 11.6583 4.9512 11.8536 5.14646L13.8536 7.14646C14.0488 7.34172 14.0488 7.6583 13.8536 7.85356L11.8536 9.85356C11.6583 10.0488 11.3417 10.0488 11.1464 9.85356C10.9512 9.6583 10.9512 9.34172 11.1464 9.14646L12.7929 7.50001L11.1464 5.85356C10.9512 5.6583 10.9512 5.34172 11.1464 5.14646Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }));
});
var CursorArrowIcon = /* @__PURE__ */ (0, import_react11.forwardRef)(function(_ref, forwardedRef) {
    var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, [
        "color"
    ]);
    return (0, import_react11.createElement)("svg", Object.assign({
        width: "15",
        height: "15",
        viewBox: "0 0 15 15",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    }, props, {
        ref: forwardedRef
    }), (0, import_react11.createElement)("path", {
        d: "M3.29227 0.048984C3.47033 -0.032338 3.67946 -0.00228214 3.8274 0.125891L12.8587 7.95026C13.0134 8.08432 13.0708 8.29916 13.0035 8.49251C12.9362 8.68586 12.7578 8.81866 12.5533 8.82768L9.21887 8.97474L11.1504 13.2187C11.2648 13.47 11.1538 13.7664 10.9026 13.8808L8.75024 14.8613C8.499 14.9758 8.20255 14.8649 8.08802 14.6137L6.15339 10.3703L3.86279 12.7855C3.72196 12.934 3.50487 12.9817 3.31479 12.9059C3.1247 12.8301 3 12.6461 3 12.4414V0.503792C3 0.308048 3.11422 0.130306 3.29227 0.048984ZM4 1.59852V11.1877L5.93799 9.14425C6.05238 9.02363 6.21924 8.96776 6.38319 8.99516C6.54715 9.02256 6.68677 9.12965 6.75573 9.2809L8.79056 13.7441L10.0332 13.178L8.00195 8.71497C7.93313 8.56376 7.94391 8.38824 8.03072 8.24659C8.11753 8.10494 8.26903 8.01566 8.435 8.00834L11.2549 7.88397L4 1.59852Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }));
});
var Pencil1Icon = /* @__PURE__ */ (0, import_react11.forwardRef)(function(_ref, forwardedRef) {
    var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, [
        "color"
    ]);
    return (0, import_react11.createElement)("svg", Object.assign({
        width: "15",
        height: "15",
        viewBox: "0 0 15 15",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    }, props, {
        ref: forwardedRef
    }), (0, import_react11.createElement)("path", {
        d: "M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }));
});
var ShadowIcon = /* @__PURE__ */ (0, import_react11.forwardRef)(function(_ref, forwardedRef) {
    var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, [
        "color"
    ]);
    return (0, import_react11.createElement)("svg", Object.assign({
        width: "15",
        height: "15",
        viewBox: "0 0 15 15",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    }, props, {
        ref: forwardedRef
    }), (0, import_react11.createElement)("path", {
        d: "M0.877075 7.49988C0.877075 3.84219 3.84222 0.877045 7.49991 0.877045C11.1576 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1575 0.877075 7.49988ZM7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49991 1.82704Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }), (0, import_react11.createElement)("path", {
        opacity: ".05",
        d: "M6.78296 13.376C8.73904 9.95284 8.73904 5.04719 6.78296 1.62405L7.21708 1.37598C9.261 4.95283 9.261 10.0472 7.21708 13.624L6.78296 13.376Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }), (0, import_react11.createElement)("path", {
        opacity: ".1",
        d: "M7.28204 13.4775C9.23929 9.99523 9.23929 5.00475 7.28204 1.52248L7.71791 1.2775C9.76067 4.9119 9.76067 10.0881 7.71791 13.7225L7.28204 13.4775Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }), (0, import_react11.createElement)("path", {
        opacity: ".15",
        d: "M7.82098 13.5064C9.72502 9.99523 9.72636 5.01411 7.82492 1.50084L8.26465 1.26285C10.2465 4.92466 10.2451 10.085 8.26052 13.7448L7.82098 13.5064Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }), (0, import_react11.createElement)("path", {
        opacity: ".2",
        d: "M8.41284 13.429C10.1952 9.92842 10.1957 5.07537 8.41435 1.57402L8.85999 1.34729C10.7139 4.99113 10.7133 10.0128 8.85841 13.6559L8.41284 13.429Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }), (0, import_react11.createElement)("path", {
        opacity: ".25",
        d: "M9.02441 13.2956C10.6567 9.8379 10.6586 5.17715 9.03005 1.71656L9.48245 1.50366C11.1745 5.09919 11.1726 9.91629 9.47657 13.5091L9.02441 13.2956Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }), (0, import_react11.createElement)("path", {
        opacity: ".3",
        d: "M9.66809 13.0655C11.1097 9.69572 11.1107 5.3121 9.67088 1.94095L10.1307 1.74457C11.6241 5.24121 11.6231 9.76683 10.1278 13.2622L9.66809 13.0655Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }), (0, import_react11.createElement)("path", {
        opacity: ".35",
        d: "M10.331 12.7456C11.5551 9.52073 11.5564 5.49103 10.3347 2.26444L10.8024 2.0874C12.0672 5.42815 12.0659 9.58394 10.7985 12.9231L10.331 12.7456Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }), (0, import_react11.createElement)("path", {
        opacity: ".4",
        d: "M11.0155 12.2986C11.9938 9.29744 11.9948 5.71296 11.0184 2.71067L11.4939 2.55603C12.503 5.6589 12.502 9.35178 11.4909 12.4535L11.0155 12.2986Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }), (0, import_react11.createElement)("path", {
        opacity: ".45",
        d: "M11.7214 11.668C12.4254 9.01303 12.4262 5.99691 11.7237 3.34116L12.2071 3.21329C12.9318 5.95292 12.931 9.05728 12.2047 11.7961L11.7214 11.668Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }), (0, import_react11.createElement)("path", {
        opacity: ".5",
        d: "M12.4432 10.752C12.8524 8.63762 12.8523 6.36089 12.4429 4.2466L12.9338 4.15155C13.3553 6.32861 13.3554 8.66985 12.9341 10.847L12.4432 10.752Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }));
});
var StarIcon = /* @__PURE__ */ (0, import_react11.forwardRef)(function(_ref, forwardedRef) {
    var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, [
        "color"
    ]);
    return (0, import_react11.createElement)("svg", Object.assign({
        width: "15",
        height: "15",
        viewBox: "0 0 15 15",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    }, props, {
        ref: forwardedRef
    }), (0, import_react11.createElement)("path", {
        d: "M6.97942 1.25171L6.9585 1.30199L5.58662 4.60039C5.54342 4.70426 5.44573 4.77523 5.3336 4.78422L1.7727 5.0697L1.71841 5.07405L1.38687 5.10063L1.08608 5.12475C0.820085 5.14607 0.712228 5.47802 0.914889 5.65162L1.14406 5.84793L1.39666 6.06431L1.43802 6.09974L4.15105 8.42374C4.23648 8.49692 4.2738 8.61176 4.24769 8.72118L3.41882 12.196L3.40618 12.249L3.32901 12.5725L3.25899 12.866C3.19708 13.1256 3.47945 13.3308 3.70718 13.1917L3.9647 13.0344L4.24854 12.861L4.29502 12.8326L7.34365 10.9705C7.43965 10.9119 7.5604 10.9119 7.6564 10.9705L10.705 12.8326L10.7515 12.861L11.0354 13.0344L11.2929 13.1917C11.5206 13.3308 11.803 13.1256 11.7411 12.866L11.671 12.5725L11.5939 12.249L11.5812 12.196L10.7524 8.72118C10.7263 8.61176 10.7636 8.49692 10.849 8.42374L13.562 6.09974L13.6034 6.06431L13.856 5.84793L14.0852 5.65162C14.2878 5.47802 14.18 5.14607 13.914 5.12475L13.6132 5.10063L13.2816 5.07405L13.2274 5.0697L9.66645 4.78422C9.55432 4.77523 9.45663 4.70426 9.41343 4.60039L8.04155 1.30199L8.02064 1.25171L7.89291 0.944609L7.77702 0.665992C7.67454 0.419604 7.32551 0.419604 7.22303 0.665992L7.10715 0.944609L6.97942 1.25171ZM7.50003 2.60397L6.50994 4.98442C6.32273 5.43453 5.89944 5.74207 5.41351 5.78103L2.84361 5.98705L4.8016 7.66428C5.17183 7.98142 5.33351 8.47903 5.2204 8.95321L4.62221 11.461L6.8224 10.1171C7.23842 9.86302 7.76164 9.86302 8.17766 10.1171L10.3778 11.461L9.77965 8.95321C9.66654 8.47903 9.82822 7.98142 10.1984 7.66428L12.1564 5.98705L9.58654 5.78103C9.10061 5.74207 8.67732 5.43453 8.49011 4.98442L7.50003 2.60397Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }));
});
var TextIcon = /* @__PURE__ */ (0, import_react11.forwardRef)(function(_ref, forwardedRef) {
    var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, [
        "color"
    ]);
    return (0, import_react11.createElement)("svg", Object.assign({
        width: "15",
        height: "15",
        viewBox: "0 0 15 15",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    }, props, {
        ref: forwardedRef
    }), (0, import_react11.createElement)("path", {
        d: "M3.94993 2.95002L3.94993 4.49998C3.94993 4.74851 3.74845 4.94998 3.49993 4.94998C3.2514 4.94998 3.04993 4.74851 3.04993 4.49998V2.50004C3.04993 2.45246 3.05731 2.40661 3.07099 2.36357C3.12878 2.18175 3.29897 2.05002 3.49993 2.05002H11.4999C11.6553 2.05002 11.7922 2.12872 11.8731 2.24842C11.9216 2.32024 11.9499 2.40682 11.9499 2.50002L11.9499 2.50004V4.49998C11.9499 4.74851 11.7485 4.94998 11.4999 4.94998C11.2514 4.94998 11.0499 4.74851 11.0499 4.49998V2.95002H8.04993V12.05H9.25428C9.50281 12.05 9.70428 12.2515 9.70428 12.5C9.70428 12.7486 9.50281 12.95 9.25428 12.95H5.75428C5.50575 12.95 5.30428 12.7486 5.30428 12.5C5.30428 12.2515 5.50575 12.05 5.75428 12.05H6.94993V2.95002H3.94993Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }));
});
var VercelLogoIcon = /* @__PURE__ */ (0, import_react11.forwardRef)(function(_ref, forwardedRef) {
    var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, [
        "color"
    ]);
    return (0, import_react11.createElement)("svg", Object.assign({
        width: "15",
        height: "15",
        viewBox: "0 0 15 15",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    }, props, {
        ref: forwardedRef
    }), (0, import_react11.createElement)("path", {
        d: "M7.49998 1L6.92321 2.00307L1.17498 12L0.599976 13H1.7535H13.2464H14.4L13.825 12L8.07674 2.00307L7.49998 1ZM7.49998 3.00613L2.3285 12H12.6714L7.49998 3.00613Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }));
});
var VideoIcon = /* @__PURE__ */ (0, import_react11.forwardRef)(function(_ref, forwardedRef) {
    var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose2(_ref, [
        "color"
    ]);
    return (0, import_react11.createElement)("svg", Object.assign({
        width: "15",
        height: "15",
        viewBox: "0 0 15 15",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    }, props, {
        ref: forwardedRef
    }), (0, import_react11.createElement)("path", {
        d: "M4.76447 3.12199C5.63151 3.04859 6.56082 3 7.5 3C8.43918 3 9.36849 3.04859 10.2355 3.12199C11.2796 3.21037 11.9553 3.27008 12.472 3.39203C12.9425 3.50304 13.2048 3.64976 13.4306 3.88086C13.4553 3.90618 13.4902 3.94414 13.5133 3.97092C13.7126 4.20149 13.8435 4.4887 13.918 5.03283C13.9978 5.6156 14 6.37644 14 7.52493C14 8.66026 13.9978 9.41019 13.9181 9.98538C13.8439 10.5206 13.7137 10.8061 13.5125 11.0387C13.4896 11.0651 13.4541 11.1038 13.4296 11.1287C13.2009 11.3625 12.9406 11.5076 12.4818 11.6164C11.9752 11.7365 11.3143 11.7942 10.2878 11.8797C9.41948 11.9521 8.47566 12 7.5 12C6.52434 12 5.58052 11.9521 4.7122 11.8797C3.68572 11.7942 3.02477 11.7365 2.51816 11.6164C2.05936 11.5076 1.7991 11.3625 1.57037 11.1287C1.54593 11.1038 1.51035 11.0651 1.48748 11.0387C1.28628 10.8061 1.15612 10.5206 1.08193 9.98538C1.00221 9.41019 1 8.66026 1 7.52493C1 6.37644 1.00216 5.6156 1.082 5.03283C1.15654 4.4887 1.28744 4.20149 1.48666 3.97092C1.5098 3.94414 1.54468 3.90618 1.56942 3.88086C1.7952 3.64976 2.05752 3.50304 2.52796 3.39203C3.04473 3.27008 3.7204 3.21037 4.76447 3.12199ZM0 7.52493C0 5.28296 0 4.16198 0.729985 3.31713C0.766457 3.27491 0.815139 3.22194 0.854123 3.18204C1.63439 2.38339 2.64963 2.29744 4.68012 2.12555C5.56923 2.05028 6.52724 2 7.5 2C8.47276 2 9.43077 2.05028 10.3199 2.12555C12.3504 2.29744 13.3656 2.38339 14.1459 3.18204C14.1849 3.22194 14.2335 3.27491 14.27 3.31713C15 4.16198 15 5.28296 15 7.52493C15 9.74012 15 10.8477 14.2688 11.6929C14.2326 11.7348 14.1832 11.7885 14.1444 11.8281C13.3629 12.6269 12.3655 12.71 10.3709 12.8763C9.47971 12.9505 8.50782 13 7.5 13C6.49218 13 5.52028 12.9505 4.62915 12.8763C2.63446 12.71 1.63712 12.6269 0.855558 11.8281C0.816844 11.7885 0.767442 11.7348 0.731221 11.6929C0 10.8477 0 9.74012 0 7.52493ZM5.25 5.38264C5.25 5.20225 5.43522 5.08124 5.60041 5.15369L10.428 7.27105C10.6274 7.35853 10.6274 7.64147 10.428 7.72895L5.60041 9.84631C5.43522 9.91876 5.25 9.79775 5.25 9.61736V5.38264Z",
        fill: color,
        fillRule: "evenodd",
        clipRule: "evenodd"
    }));
});
// src/components/Button/index.ts
init_cjs_shims();
// src/components/Button/Button.tsx
init_cjs_shims();
var React47 = __toESM(require("react"));
function Button(props) {
    return(/* @__PURE__ */ React47.createElement("button", _objectSpread({
        className: "button"
    }, props)));
}
// src/components/icons/index.ts
init_cjs_shims();
// src/components/icons/BoxIcon.tsx
init_cjs_shims();
var React48 = __toESM(require("react"));
// src/components/icons/CircleIcon.tsx
init_cjs_shims();
var React49 = __toESM(require("react"));
// src/components/icons/DashDashedIcon.tsx
init_cjs_shims();
var React50 = __toESM(require("react"));
// src/components/icons/DashDottedIcon.tsx
init_cjs_shims();
var React51 = __toESM(require("react"));
var dottedDasharray = "".concat(50.26548 * 0.025, " ").concat(50.26548 * 0.1);
// src/components/icons/DashDrawIcon.tsx
init_cjs_shims();
var React52 = __toESM(require("react"));
// src/components/icons/DashSolidIcon.tsx
init_cjs_shims();
var React53 = __toESM(require("react"));
// src/components/icons/IsFilledIcon.tsx
init_cjs_shims();
var React54 = __toESM(require("react"));
// src/components/icons/RedoIcon.tsx
init_cjs_shims();
var React55 = __toESM(require("react"));
// src/components/icons/TrashIcon.tsx
init_cjs_shims();
var React56 = __toESM(require("react"));
// src/components/icons/UndoIcon.tsx
init_cjs_shims();
var React57 = __toESM(require("react"));
// src/components/icons/SizeSmallIcon.tsx
init_cjs_shims();
var React58 = __toESM(require("react"));
// src/components/icons/SizeMediumIcon.tsx
init_cjs_shims();
var React59 = __toESM(require("react"));
// src/components/icons/SizeLargeIcon.tsx
init_cjs_shims();
var React60 = __toESM(require("react"));
// src/components/icons/EraserIcon.tsx
init_cjs_shims();
var React61 = __toESM(require("react"));
function EraserIcon() {
    return(/* @__PURE__ */ React61.createElement("svg", {
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
    })));
}
// src/components/icons/MultiplayerIcon.tsx
init_cjs_shims();
var React62 = __toESM(require("react"));
// src/components/icons/DiscordIcon.tsx
init_cjs_shims();
var React63 = __toESM(require("react"));
// src/components/icons/LineIcon.tsx
init_cjs_shims();
var React64 = __toESM(require("react"));
function LineIcon() {
    return(/* @__PURE__ */ React64.createElement("svg", {
        width: "15",
        height: "15",
        viewBox: "0 0 15 15",
        fill: "currentColor",
        xmlns: "http://www.w3.org/2000/svg"
    }, /* @__PURE__ */ React64.createElement("path", {
        d: "M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L11.1464 3.14645C11.3417 2.95118 11.6583 2.95118 11.8536 3.14645C12.0488 3.34171 12.0488 3.65829 11.8536 3.85355L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z"
    })));
}
// src/components/PrimaryTools/PrimaryTools.tsx
var PrimaryTools = observer(function PrimaryTools2() {
    var app = useApp();
    var handleToolClick = React65.useCallback(function(e) {
        var tool = e.currentTarget.dataset.tool;
        if (tool) app.selectTool(tool);
    }, [
        app
    ]);
    var handleToolDoubleClick = React65.useCallback(function(e) {
        var tool = e.currentTarget.dataset.tool;
        if (tool) app.selectTool(tool);
        app.settings.update({
            isToolLocked: true
        });
    }, [
        app
    ]);
    var selectedToolId = app.selectedTool.id;
    return(/* @__PURE__ */ React65.createElement("div", {
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
    }, "🥹")), /* @__PURE__ */ React65.createElement("button", {
        className: "floating-button"
    })));
});
// src/components/AppUI.tsx
var AppUI = observer(function AppUI2() {
    return(/* @__PURE__ */ React66.createElement(React66.Fragment, null, /* @__PURE__ */ React66.createElement(PrimaryTools, null)));
});
// src/components/ContextBar/ContextBar.tsx
init_cjs_shims();
var React69 = __toESM(require("react"));
// src/components/inputs/NumberInput.tsx
init_cjs_shims();
var React67 = __toESM(require("react"));
function NumberInput(_param) {
    var label = _param.label, rest = _objectWithoutProperties(_param, [
        "label"
    ]);
    return(/* @__PURE__ */ React67.createElement("div", {
        className: "input"
    }, /* @__PURE__ */ React67.createElement("label", {
        htmlFor: "number-".concat(label)
    }, label), /* @__PURE__ */ React67.createElement("input", _objectSpread({
        className: "number-input",
        name: "number-".concat(label),
        type: "number"
    }, rest))));
}
// src/components/inputs/ColorInput.tsx
init_cjs_shims();
var React68 = __toESM(require("react"));
function ColorInput(_param) {
    var label = _param.label, rest = _objectWithoutProperties(_param, [
        "label"
    ]);
    return(/* @__PURE__ */ React68.createElement("div", {
        className: "input"
    }, /* @__PURE__ */ React68.createElement("label", {
        htmlFor: "color-".concat(label)
    }, label), /* @__PURE__ */ React68.createElement("input", _objectSpread({
        className: "color-input",
        name: "color-".concat(label),
        type: "color"
    }, rest))));
}
// src/components/ContextBar/ContextBar.tsx
var _ContextBar = function(param) {
    var shapes2 = param.shapes, offset = param.offset, scaledBounds = param.scaledBounds;
    var _Math, _Math6, _Math7, _Math8, _Math9, _Math10;
    var app = useApp();
    var rSize = React69.useRef([
        0,
        0
    ]);
    var rContextBar = React69.useRef(null);
    var updateStroke = React69.useCallback(function(e) {
        shapes2.forEach(function(shape) {
            return shape.update({
                stroke: e.currentTarget.value
            });
        });
    }, []);
    var updateFill = React69.useCallback(function(e) {
        shapes2.forEach(function(shape) {
            return shape.update({
                fill: e.currentTarget.value
            });
        });
    }, []);
    var updateStrokeWidth = React69.useCallback(function(e) {
        shapes2.forEach(function(shape) {
            return shape.update({
                strokeWidth: +e.currentTarget.value
            });
        });
    }, []);
    var updateOpacity = React69.useCallback(function(e) {
        shapes2.forEach(function(shape) {
            return shape.update({
                opacity: +e.currentTarget.value
            });
        });
    }, []);
    var updateSides = React69.useCallback(function(e) {
        shapes2.forEach(function(shape) {
            return shape.update({
                sides: +e.currentTarget.value
            });
        });
    }, []);
    var updateRatio = React69.useCallback(function(e) {
        shapes2.forEach(function(shape) {
            return shape.update({
                ratio: +e.currentTarget.value
            });
        });
    }, []);
    var updateFontSize = React69.useCallback(function(e) {
        textShapes.forEach(function(shape) {
            return shape.update({
                fontSize: +e.currentTarget.value
            });
        });
    }, []);
    var updateFontWeight = React69.useCallback(function(e) {
        textShapes.forEach(function(shape) {
            return shape.update({
                fontWeight: +e.currentTarget.value
            });
        });
    }, []);
    React69.useLayoutEffect(function() {
        var elm = rContextBar.current;
        if (!elm) return;
        var offsetWidth = elm.offsetWidth, offsetHeight = elm.offsetHeight;
        rSize.current = [
            offsetWidth,
            offsetHeight
        ];
    }, []);
    React69.useLayoutEffect(function() {
        var elm = rContextBar.current;
        if (!elm) return;
        var size = rSize.current;
        var ref = _slicedToArray(getContextBarTranslation(size, _objectSpread({
        }, offset, {
            bottom: offset.bottom - 32
        })), 2), x = ref[0], y = ref[1];
        elm.style.setProperty("transform", "translateX(".concat(x, "px) translateY(").concat(y, "px)"));
    }, [
        scaledBounds,
        offset
    ]);
    if (!app) return null;
    var textShapes = shapes2.filter(function(shape) {
        return shape.type === "text";
    });
    var sidesShapes = shapes2.filter(function(shape) {
        return "sides" in shape.props;
    });
    var ShapeContent = shapes2.length === 1 && "ReactContextBar" in shapes2[0] ? shapes2[0]["ReactContextBar"] : null;
    return(/* @__PURE__ */ React69.createElement(HTMLContainer, {
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
        value: (_Math = Math).max.apply(_Math, _toConsumableArray(shapes2.map(function(shape) {
            return shape.props.strokeWidth;
        }))),
        onChange: updateStrokeWidth,
        style: {
            width: 48
        }
    }), sidesShapes.length > 0 && /* @__PURE__ */ React69.createElement(NumberInput, {
        label: "Sides",
        value: (_Math6 = Math).max.apply(_Math6, _toConsumableArray(sidesShapes.map(function(shape) {
            return shape.props.sides;
        }))),
        onChange: updateSides,
        style: {
            width: 40
        }
    }), sidesShapes.length > 0 && /* @__PURE__ */ React69.createElement(NumberInput, {
        label: "Ratio",
        value: (_Math7 = Math).max.apply(_Math7, _toConsumableArray(sidesShapes.map(function(shape) {
            return shape.props.ratio;
        }))),
        onChange: updateRatio,
        step: 0.1,
        min: 0,
        max: 2,
        style: {
            width: 40
        }
    }), /* @__PURE__ */ React69.createElement(NumberInput, {
        label: "Opacity",
        value: (_Math8 = Math).max.apply(_Math8, _toConsumableArray(shapes2.map(function(shape) {
            return shape.props.opacity;
        }))),
        onChange: updateOpacity,
        step: 0.1,
        style: {
            width: 48
        }
    }), textShapes.length > 0 ? /* @__PURE__ */ React69.createElement(React69.Fragment, null, /* @__PURE__ */ React69.createElement(NumberInput, {
        label: "Size",
        value: (_Math9 = Math).max.apply(_Math9, _toConsumableArray(textShapes.map(function(shape) {
            return shape.props.fontSize;
        }))),
        onChange: updateFontSize,
        style: {
            width: 48
        }
    }), /* @__PURE__ */ React69.createElement(NumberInput, {
        label: " Weight",
        value: (_Math10 = Math).max.apply(_Math10, _toConsumableArray(textShapes.map(function(shape) {
            return shape.props.fontWeight;
        }))),
        onChange: updateFontWeight,
        style: {
            width: 48
        }
    })) : null))));
};
var ContextBar2 = observer(_ContextBar);
// src/hooks/useFileDrop.ts
init_cjs_shims();
var React70 = __toESM(require("react"));
function useFileDrop() {
    return React70.useCallback(_asyncToGenerator(regeneratorRuntime.mark(function _callee(app, param) {
        var files, point, IMAGE_EXTENSIONS, assetId, assetsToCreate, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, file, extensionMatch, extension, dataurl, existingAsset, asset1;
        return regeneratorRuntime.wrap(function _callee$(_ctx) {
            while(1)switch(_ctx.prev = _ctx.next){
                case 0:
                    files = param.files, point = param.point;
                    IMAGE_EXTENSIONS = [
                        ".png",
                        ".svg",
                        ".jpg",
                        ".jpeg",
                        ".gif"
                    ];
                    assetId = uniqueId();
                    assetsToCreate = [];
                    _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                    _ctx.prev = 5;
                    _iterator = files[Symbol.iterator]();
                case 7:
                    if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                        _ctx.next = 40;
                        break;
                    }
                    file = _step.value;
                    _ctx.prev = 9;
                    extensionMatch = file.name.match(/\.[0-9a-z]+$/i);
                    if (extensionMatch) {
                        _ctx.next = 13;
                        break;
                    }
                    throw Error("No extension.");
                case 13:
                    extension = extensionMatch[0].toLowerCase();
                    if (IMAGE_EXTENSIONS.includes(extension)) {
                        _ctx.next = 16;
                        break;
                    }
                    return _ctx.abrupt("continue", 37);
                case 16:
                    _ctx.next = 18;
                    return fileToBase64(file);
                case 18:
                    dataurl = _ctx.sent;
                    if (!(typeof dataurl !== "string")) {
                        _ctx.next = 21;
                        break;
                    }
                    return _ctx.abrupt("continue", 37);
                case 21:
                    existingAsset = Object.values(app.assets).find(function(asset2) {
                        return asset2.src === dataurl;
                    });
                    if (!existingAsset) {
                        _ctx.next = 25;
                        break;
                    }
                    assetsToCreate.push(existingAsset);
                    return _ctx.abrupt("continue", 37);
                case 25:
                    _ctx.t0 = assetId;
                    _ctx.t1 = dataurl;
                    _ctx.next = 29;
                    return getSizeFromSrc(dataurl);
                case 29:
                    _ctx.t2 = _ctx.sent;
                    asset1 = {
                        id: _ctx.t0,
                        type: "image",
                        src: _ctx.t1,
                        size: _ctx.t2
                    };
                    assetsToCreate.push(asset1);
                    _ctx.next = 37;
                    break;
                case 34:
                    _ctx.prev = 34;
                    _ctx.t3 = _ctx["catch"](9);
                    console.error(_ctx.t3);
                case 37:
                    _iteratorNormalCompletion = true;
                    _ctx.next = 7;
                    break;
                case 40:
                    _ctx.next = 46;
                    break;
                case 42:
                    _ctx.prev = 42;
                    _ctx.t4 = _ctx["catch"](5);
                    _didIteratorError = true;
                    _iteratorError = _ctx.t4;
                case 46:
                    _ctx.prev = 46;
                    _ctx.prev = 47;
                    if (!_iteratorNormalCompletion && _iterator.return != null) {
                        _iterator.return();
                    }
                case 49:
                    _ctx.prev = 49;
                    if (!_didIteratorError) {
                        _ctx.next = 52;
                        break;
                    }
                    throw _iteratorError;
                case 52:
                    return _ctx.finish(49);
                case 53:
                    return _ctx.finish(46);
                case 54:
                    app.createAssets(assetsToCreate);
                    app.createShapes(assetsToCreate.map(function(asset, i) {
                        return {
                            id: uniqueId(),
                            type: "image",
                            parentId: app.currentPageId,
                            point: [
                                point[0] - asset.size[0] / 2 + i * 16,
                                point[1] - asset.size[1] / 2 + i * 16
                            ],
                            size: asset.size,
                            assetId: asset.id,
                            opacity: 1
                        };
                    }));
                case 56:
                case "end":
                    return _ctx.stop();
            }
        }, _callee, null, [
            [
                5,
                42,
                46,
                54
            ],
            [
                9,
                34
            ],
            [
                47,
                ,
                49,
                53
            ]
        ]);
    })), []);
}
// src/lib/logseq-context.ts
init_cjs_shims();
var import_react14 = __toESM(require("react"));
var LogseqContext = import_react14.default.createContext({
});
// src/lib/shapes/index.ts
init_cjs_shims();
// src/lib/shapes/BoxShape.tsx
init_cjs_shims();
var React72 = __toESM(require("react"));
// src/lib/shapes/style-props.tsx
init_cjs_shims();
function withClampedStyles(props) {
    if (props.strokeWidth !== void 0) props.strokeWidth = Math.max(props.strokeWidth, 1);
    if (props.opacity !== void 0) props.opacity = Math.min(1, Math.max(props.opacity, 0));
    return props;
}
// src/lib/shapes/BoxShape.tsx
var BoxShape = /*#__PURE__*/ function(TLBoxShape) {
    "use strict";
    _inherits(_class, TLBoxShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isErasing = param.isErasing, isSelected = param.isSelected;
            var ref = _assertThisInitialized(_this), _props = ref.props, _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1], stroke = _props.stroke, fill = _props.fill, strokeWidth = _props.strokeWidth, borderRadius = _props.borderRadius, opacity = _props.opacity;
            return(/* @__PURE__ */ React72.createElement(SVGContainer, _objectSpread({
            }, events, {
                opacity: isErasing ? 0.2 : opacity
            }), /* @__PURE__ */ React72.createElement("rect", {
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
                strokeWidth: strokeWidth,
                stroke: stroke,
                fill: fill
            })));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var ref = _assertThisInitialized(_this), _props = ref.props, _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1], borderRadius = _props.borderRadius;
            return(/* @__PURE__ */ React72.createElement("rect", {
                width: w,
                height: h,
                rx: borderRadius,
                ry: borderRadius,
                fill: "transparent"
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            if (props.size !== void 0) {
                props.size[0] = Math.max(props.size[0], 1);
                props.size[1] = Math.max(props.size[1], 1);
            }
            if (props.borderRadius !== void 0) props.borderRadius = Math.max(0, props.borderRadius);
            return withClampedStyles(props);
        });
        return _this;
    }
    return _class;
}(TLBoxShape1);
__publicField(BoxShape, "id", "box");
__publicField(BoxShape, "defaultProps", {
    id: "box",
    parentId: "page",
    type: "box",
    point: [
        0,
        0
    ],
    size: [
        100,
        100
    ],
    borderRadius: 0,
    stroke: "#000000",
    fill: "#ffffff",
    strokeWidth: 2,
    opacity: 1
});
// src/lib/shapes/CodeSandboxShape.tsx
init_cjs_shims();
var React74 = __toESM(require("react"));
// src/components/inputs/TextInput.tsx
init_cjs_shims();
var React73 = __toESM(require("react"));
var TextInput = React73.forwardRef(function(_param, ref) {
    var label = _param.label, rest = _objectWithoutProperties(_param, [
        "label"
    ]);
    return(/* @__PURE__ */ React73.createElement("div", {
        className: "input"
    }, /* @__PURE__ */ React73.createElement("label", {
        htmlFor: "text-".concat(label)
    }, label), /* @__PURE__ */ React73.createElement("input", _objectSpread({
        ref: ref,
        className: "text-input",
        name: "text-".concat(label),
        type: "text"
    }, rest))));
});
// src/lib/shapes/CodeSandboxShape.tsx
var CodeSandboxShape = /*#__PURE__*/ function(TLReactBoxShape) {
    "use strict";
    _inherits(_class, TLReactBoxShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "canEdit", true);
        __publicField(_assertThisInitialized(_this), "canFlip", false);
        __publicField(_assertThisInitialized(_this), "ReactContextBar", observer(function() {
            var embedId = _this.props.embedId;
            var rInput = React74.useRef(null);
            var handleChange = React74.useCallback(function(e) {
                var url = e.currentTarget.value;
                var match = url.match(/\/s\/([^?]+)/);
                var ref, ref12;
                var embedId2 = (ref12 = (ref = match === null || match === void 0 ? void 0 : match[1]) !== null && ref !== void 0 ? ref : url) !== null && ref12 !== void 0 ? ref12 : "";
                _this.update({
                    embedId: embedId2
                });
            }, []);
            return(/* @__PURE__ */ React74.createElement(React74.Fragment, null, /* @__PURE__ */ React74.createElement(TextInput, {
                ref: rInput,
                label: "CodeSandbox Embed ID",
                type: "text",
                value: embedId,
                onChange: handleChange
            })));
        }));
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isEditing = param.isEditing, isErasing = param.isErasing;
            var _props = _this.props, opacity = _props.opacity, embedId = _props.embedId;
            return(/* @__PURE__ */ React74.createElement(HTMLContainer, _objectSpread({
                style: {
                    overflow: "hidden",
                    pointerEvents: "all",
                    opacity: isErasing ? 0.2 : opacity
                }
            }, events), /* @__PURE__ */ React74.createElement("div", {
                style: {
                    width: "100%",
                    height: "100%",
                    pointerEvents: isEditing ? "all" : "none",
                    userSelect: "none"
                }
            }, embedId ? /* @__PURE__ */ React74.createElement("iframe", {
                src: "https://codesandbox.io/embed/".concat(embedId, "?&fontsize=14&hidenavigation=1&theme=dark"),
                style: {
                    width: "100%",
                    height: "100%",
                    overflow: "hidden"
                },
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
            }))))));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var _props = _this.props, _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1];
            return(/* @__PURE__ */ React74.createElement("rect", {
                width: w,
                height: h,
                fill: "transparent"
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            if (props.size !== void 0) {
                props.size[0] = Math.max(props.size[0], 1);
                props.size[1] = Math.max(props.size[1], 1);
            }
            return withClampedStyles(props);
        });
        return _this;
    }
    return _class;
}(TLReactBoxShape1);
__publicField(CodeSandboxShape, "id", "code");
__publicField(CodeSandboxShape, "defaultProps", {
    id: "code",
    type: "code",
    parentId: "page",
    point: [
        0,
        0
    ],
    size: [
        600,
        320
    ],
    stroke: "#000000",
    fill: "#ffffff",
    strokeWidth: 2,
    opacity: 1,
    embedId: ""
});
// src/lib/shapes/DotShape.tsx
init_cjs_shims();
var React75 = __toESM(require("react"));
var DotShape = /*#__PURE__*/ function(TLDotShape) {
    "use strict";
    _inherits(_class, TLDotShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isErasing = param.isErasing;
            var _props = _this.props, radius = _props.radius, stroke = _props.stroke, fill = _props.fill, strokeWidth = _props.strokeWidth, opacity = _props.opacity;
            return(/* @__PURE__ */ React75.createElement(SVGContainer, _objectSpread({
            }, events, {
                opacity: isErasing ? 0.2 : opacity
            }), /* @__PURE__ */ React75.createElement("circle", {
                className: "tl-hitarea-fill",
                cx: radius,
                cy: radius,
                r: radius
            }), /* @__PURE__ */ React75.createElement("circle", {
                cx: radius,
                cy: radius,
                r: radius,
                stroke: stroke,
                fill: fill,
                strokeWidth: strokeWidth,
                pointerEvents: "none"
            })));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var radius = _this.props.radius;
            return(/* @__PURE__ */ React75.createElement("circle", {
                cx: radius,
                cy: radius,
                r: radius,
                pointerEvents: "all"
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            if (props.radius !== void 0) props.radius = Math.max(props.radius, 1);
            return withClampedStyles(props);
        });
        return _this;
    }
    return _class;
}(TLDotShape1);
__publicField(DotShape, "id", "dot");
__publicField(DotShape, "defaultProps", {
    id: "dot",
    parentId: "page",
    type: "dot",
    point: [
        0,
        0
    ],
    radius: 4,
    stroke: "#000000",
    fill: "#ffffff",
    strokeWidth: 2,
    opacity: 1
});
// src/lib/shapes/EllipseShape.tsx
init_cjs_shims();
var React76 = __toESM(require("react"));
var EllipseShape = /*#__PURE__*/ function(TLEllipseShape) {
    "use strict";
    _inherits(_class, TLEllipseShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var isSelected = param.isSelected, isErasing = param.isErasing, events = param.events;
            var _props = _this.props, _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1], stroke = _props.stroke, fill = _props.fill, strokeWidth = _props.strokeWidth, opacity = _props.opacity;
            return(/* @__PURE__ */ React76.createElement(SVGContainer, _objectSpread({
            }, events, {
                opacity: isErasing ? 0.2 : opacity
            }), /* @__PURE__ */ React76.createElement("ellipse", {
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
                strokeWidth: strokeWidth,
                stroke: stroke,
                fill: fill
            })));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var _props = _this.props, _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1];
            return(/* @__PURE__ */ React76.createElement("ellipse", {
                cx: w / 2,
                cy: h / 2,
                rx: w / 2,
                ry: h / 2,
                strokeWidth: 2,
                fill: "transparent"
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            if (props.size !== void 0) {
                props.size[0] = Math.max(props.size[0], 1);
                props.size[1] = Math.max(props.size[1], 1);
            }
            return withClampedStyles(props);
        });
        return _this;
    }
    return _class;
}(TLEllipseShape1);
__publicField(EllipseShape, "id", "ellipse");
__publicField(EllipseShape, "defaultProps", {
    id: "ellipse",
    parentId: "page",
    type: "ellipse",
    point: [
        0,
        0
    ],
    size: [
        100,
        100
    ],
    stroke: "#000000",
    fill: "#ffffff",
    strokeWidth: 2,
    opacity: 1
});
// src/lib/shapes/HighlighterShape.tsx
init_cjs_shims();
var React77 = __toESM(require("react"));
var HighlighterShape = /*#__PURE__*/ function(TLDrawShape) {
    "use strict";
    _inherits(_class, TLDrawShape);
    var _super = _createSuper(_class);
    function _class(param10) {
        var props1 = param10 === void 0 ? {
        } : param10;
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call(this, props1);
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isErasing = param.isErasing;
            var ref = _assertThisInitialized(_this), pointsPath = ref.pointsPath, _props = ref.props, stroke = _props.stroke, strokeWidth = _props.strokeWidth, opacity = _props.opacity;
            return(/* @__PURE__ */ React77.createElement(SVGContainer, _objectSpread({
            }, events, {
                opacity: isErasing ? 0.2 : opacity
            }), /* @__PURE__ */ React77.createElement("path", {
                d: pointsPath,
                strokeWidth: strokeWidth * 16,
                stroke: stroke,
                fill: "none",
                pointerEvents: "all",
                strokeLinejoin: "round",
                strokeLinecap: "round",
                opacity: 0.5
            })));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var pointsPath = _assertThisInitialized(_this).pointsPath;
            return(/* @__PURE__ */ React77.createElement("path", {
                d: pointsPath,
                fill: "none"
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            props = withClampedStyles(props);
            if (props.strokeWidth !== void 0) props.strokeWidth = Math.max(props.strokeWidth, 1);
            return props;
        });
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    _createClass(_class, [
        {
            key: "pointsPath",
            get: function get() {
                var points = this.props.points;
                return SvgPathUtils.getCurvedPathForPoints(points);
            }
        }
    ]);
    return _class;
}(TLDrawShape1);
__publicField(HighlighterShape, "id", "highlighter");
__publicField(HighlighterShape, "defaultProps", {
    id: "highlighter",
    parentId: "page",
    type: "highlighter",
    point: [
        0,
        0
    ],
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
init_cjs_shims();
var React78 = __toESM(require("react"));
var ImageShape = /*#__PURE__*/ function(TLImageShape) {
    "use strict";
    _inherits(_class, TLImageShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isErasing = param.isErasing, asset = param.asset;
            var ref = _assertThisInitialized(_this), _props = ref.props, opacity = _props.opacity, objectFit = _props.objectFit, clipping = _props.clipping, _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1];
            var ref13 = _slicedToArray(Array.isArray(clipping) ? clipping : [
                clipping,
                clipping,
                clipping,
                clipping
            ], 4), t = ref13[0], r = ref13[1], b = ref13[2], l2 = ref13[3];
            return(/* @__PURE__ */ React78.createElement(HTMLContainer, _objectSpread({
            }, events, {
                opacity: isErasing ? 0.2 : opacity
            }), /* @__PURE__ */ React78.createElement("div", {
                style: {
                    width: "100%",
                    height: "100%",
                    overflow: "hidden"
                }
            }, asset && /* @__PURE__ */ React78.createElement("img", {
                src: asset.src,
                draggable: false,
                style: {
                    position: "relative",
                    top: -t,
                    left: -l2,
                    width: w + (l2 - r),
                    height: h + (t - b),
                    objectFit: objectFit,
                    pointerEvents: "all"
                }
            }))));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var ref = _assertThisInitialized(_this), _props = ref.props, _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1];
            return(/* @__PURE__ */ React78.createElement("rect", {
                width: w,
                height: h,
                fill: "transparent"
            }));
        }));
        return _this;
    }
    return _class;
}(TLImageShape1);
__publicField(ImageShape, "id", "image");
__publicField(ImageShape, "defaultProps", {
    id: "image1",
    parentId: "page",
    type: "image",
    point: [
        0,
        0
    ],
    size: [
        100,
        100
    ],
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
init_cjs_shims();
var React79 = __toESM(require("react"));
var LineShape = /*#__PURE__*/ function(TLLineShape) {
    "use strict";
    _inherits(_class, TLLineShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "hideSelection", true);
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isErasing = param.isErasing, isSelected = param.isSelected;
            var ref = _assertThisInitialized(_this), points = ref.points, _props = ref.props, stroke = _props.stroke, fill = _props.fill, strokeWidth = _props.strokeWidth, opacity = _props.opacity;
            var path = points.join();
            return(/* @__PURE__ */ React79.createElement(SVGContainer, _objectSpread({
            }, events, {
                opacity: isErasing ? 0.2 : opacity
            }), /* @__PURE__ */ React79.createElement("g", null, /* @__PURE__ */ React79.createElement("polygon", {
                className: isSelected ? "tl-hitarea-fill" : "tl-hitarea-stroke",
                points: path
            }), /* @__PURE__ */ React79.createElement("polygon", {
                points: path,
                stroke: stroke,
                fill: fill,
                strokeWidth: strokeWidth,
                strokeLinejoin: "round"
            }))));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var points = _assertThisInitialized(_this).points;
            var path = points.join();
            return(/* @__PURE__ */ React79.createElement("polygon", {
                points: path
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            return withClampedStyles(props);
        });
        return _this;
    }
    return _class;
}(TLLineShape1);
__publicField(LineShape, "id", "line");
__publicField(LineShape, "defaultProps", {
    id: "line",
    parentId: "page",
    type: "line",
    point: [
        0,
        0
    ],
    handles: [
        {
            id: "start",
            point: [
                0,
                0
            ]
        },
        {
            id: "end",
            point: [
                1,
                1
            ]
        }
    ],
    stroke: "#000000",
    fill: "#ffffff",
    strokeWidth: 2,
    opacity: 1
});
// src/lib/shapes/PenShape.tsx
init_cjs_shims();
var React80 = __toESM(require("react"));
// ../../node_modules/perfect-freehand/dist/esm/index.js
init_cjs_shims();
function W(e, t, s, param) {
    var h = param === void 0 ? function(b) {
        return b;
    } : param;
    return e * h(0.5 - t * (0.5 - s));
}
function re(e) {
    return [
        -e[0],
        -e[1]
    ];
}
function l(e, t) {
    return [
        e[0] + t[0],
        e[1] + t[1]
    ];
}
function a(e, t) {
    return [
        e[0] - t[0],
        e[1] - t[1]
    ];
}
function f(e, t) {
    return [
        e[0] * t,
        e[1] * t
    ];
}
function le(e, t) {
    return [
        e[0] / t,
        e[1] / t
    ];
}
function L(e) {
    return [
        e[1],
        -e[0]
    ];
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
    var h = Math.sin(s), b = Math.cos(s), v = e[0] - t[0], n = e[1] - t[1], g = v * b - n * h, E = v * h + n * b;
    return [
        g + t[0],
        E + t[1]
    ];
}
function V2(e, t, s) {
    return l(e, f(a(t, e), s));
}
function Z(e, t, s) {
    return l(e, f(t, s));
}
var _14 = Math.min, ge = Math.PI;
var se = 0.275;
var j = ge + 0.0001;
function ie(e, param) {
    var t = param === void 0 ? {
    } : param;
    var tmp = t.size, s = tmp === void 0 ? 16 : tmp, tmp1 = t.smoothing, h = tmp1 === void 0 ? 0.5 : tmp1, tmp2 = t.thinning, b = tmp2 === void 0 ? 0.5 : tmp2, tmp3 = t.simulatePressure, v = tmp3 === void 0 ? true : tmp3, tmp4 = t.easing, n = tmp4 === void 0 ? function(r) {
        return r;
    } : tmp4, tmp5 = t.start, g = tmp5 === void 0 ? {
    } : tmp5, tmp6 = t.end, E = tmp6 === void 0 ? {
    } : tmp6, tmp7 = t.last, z = tmp7 === void 0 ? false : tmp7, tmp8 = g.cap, d = tmp8 === void 0 ? true : tmp8, tmp9 = g.taper, x = tmp9 === void 0 ? 0 : tmp9, tmp10 = g.easing, q = tmp10 === void 0 ? function(r) {
        return r * (2 - r);
    } : tmp10, tmp11 = E.cap, m = tmp11 === void 0 ? true : tmp11, tmp12 = E.taper, c = tmp12 === void 0 ? 0 : tmp12, tmp13 = E.easing, M = tmp13 === void 0 ? function(r) {
        return --r * r * r + 1;
    } : tmp13;
    if (e.length === 0 || s <= 0) return [];
    var H = e[e.length - 1].runningLength, $ = Math.pow(s * h, 2), D = [], R = [], N = e.slice(0, 10).reduce(function(r, i) {
        var o = i.pressure;
        if (v) {
            var u = _14(1, i.distance / s), J = _14(1, 1 - u);
            o = _14(1, r + (J - r) * (u * se));
        }
        return (r + o) / 2;
    }, e[0].pressure), p = W(s, b, e[e.length - 1].pressure, n), U, B = e[0].vector, I = e[0].point, C = I, y = I, O = C;
    for(var r3 = 0; r3 < e.length; r3++){
        var _r = e[r3], i5 = _r.pressure, _r1 = e[r3], o5 = _r1.point, u5 = _r1.vector, J1 = _r1.distance, K = _r1.runningLength;
        if (r3 < e.length - 1 && H - K < 3) continue;
        if (b) {
            if (v) {
                var P = _14(1, J1 / s), Q = _14(1, 1 - P);
                i5 = _14(1, N + (Q - N) * (P * se));
            }
            p = W(s, b, i5, n);
        } else p = s / 2;
        U === void 0 && (U = p);
        var pe = K < x ? q(K / x) : 1, ae = H - K < c ? M((H - K) / c) : 1;
        if (p = Math.max(0.01, p * Math.min(pe, ae)), r3 === e.length - 1) {
            var P1 = f(L(u5), p);
            D.push(a(o5, P1)), R.push(l(o5, P1));
            continue;
        }
        var A = e[r3 + 1].vector, ee = ne(u5, A);
        if (ee < 0) {
            var P2 = f(L(B), p);
            for(var Q1 = 1 / 13, w = 0; w <= 1; w += Q1)y = T(a(o5, P2), o5, j * w), D.push(y), O = T(l(o5, P2), o5, j * -w), R.push(O);
            I = y, C = O;
            continue;
        }
        var te = f(L(V2(A, u5, ee)), p);
        y = a(o5, te), (r3 <= 1 || Y(I, y) > $) && (D.push(y), I = y), O = l(o5, te), (r3 <= 1 || Y(C, O) > $) && (R.push(O), C = O), N = i5, B = u5;
    }
    var S = e[0].point.slice(0, 2), k = e.length > 1 ? e[e.length - 1].point.slice(0, 2) : l(e[0].point, [
        1,
        1
    ]), X = [], F = [];
    if (e.length === 1) {
        if (!(x || c) || z) {
            var r1 = Z(S, G(L(a(S, k))), -(U || p)), i1 = [];
            for(var o1 = 1 / 13, u1 = o1; u1 <= 1; u1 += o1)i1.push(T(r1, S, j * 2 * u1));
            return i1;
        }
    } else {
        if (!(x || c && e.length === 1)) if (d) for(var i2 = 1 / 13, o2 = i2; o2 <= 1; o2 += i2){
            var u2 = T(R[0], S, j * o2);
            X.push(u2);
        }
        else {
            var i3 = a(D[0], R[0]), o3 = f(i3, 0.5), u3 = f(i3, 0.51);
            X.push(a(S, o3), a(S, u3), l(S, u3), l(S, o3));
        }
        var r2 = L(re(e[e.length - 1].vector));
        if (c || x && e.length === 1) F.push(k);
        else if (m) {
            var i4 = Z(k, r2, p);
            for(var o4 = 1 / 29, u4 = o4; u4 < 1; u4 += o4)F.push(T(i4, k, j * 3 * u4));
        } else F.push(l(k, f(r2, p)), l(k, f(r2, p * 0.99)), a(k, f(r2, p * 0.99)), a(k, f(r2, p)));
    }
    return D.concat(F, R.reverse(), X);
}
function ce(e, param11) {
    var t = param11 === void 0 ? {
    } : param11;
    var q;
    var tmp16 = t.streamline, s = tmp16 === void 0 ? 0.5 : tmp16, tmp14 = t.size, h = tmp14 === void 0 ? 16 : tmp14, tmp15 = t.last, b = tmp15 === void 0 ? false : tmp15;
    if (e.length === 0) return [];
    var v = 0.15 + (1 - s) * 0.85, n = Array.isArray(e[0]) ? e : e.map(function(param) {
        var m = param.x, c = param.y, tmp = param.pressure, M = tmp === void 0 ? 0.5 : tmp;
        return [
            m,
            c,
            M
        ];
    });
    if (n.length === 2) {
        var m3 = n[1];
        n = n.slice(0, -1);
        for(var c2 = 1; c2 < 5; c2++)n.push(V2(n[0], m3, c2 / 4));
    }
    n.length === 1 && (n = _toConsumableArray(n).concat([
        _toConsumableArray(l(n[0], [
            1,
            1
        ])).concat(_toConsumableArray(n[0].slice(2)))
    ]));
    var g = [
        {
            point: [
                n[0][0],
                n[0][1]
            ],
            pressure: n[0][2] >= 0 ? n[0][2] : 0.25,
            vector: [
                1,
                1
            ],
            distance: 0,
            runningLength: 0
        }
    ], E = false, z = 0, d = g[0], x = n.length - 1;
    for(var m2 = 1; m2 < n.length; m2++){
        var c1 = b && m2 === x ? n[m2].slice(0, 2) : V2(d.point, n[m2], v);
        if (oe(d.point, c1)) continue;
        var M1 = ue(c1, d.point);
        if (z += M1, m2 < x && !E) {
            if (z < h) continue;
            E = true;
        }
        d = {
            point: c1,
            pressure: n[m2][2] >= 0 ? n[m2][2] : 0.5,
            vector: G(a(d.point, c1)),
            distance: M1,
            runningLength: z
        }, g.push(d);
    }
    return g[0].vector = ((q = g[1]) == null ? void 0 : q.vector) || [
        0,
        0
    ], g;
}
function me(e, param) {
    var t = param === void 0 ? {
    } : param;
    return ie(ce(e, t), t);
}
// src/lib/shapes/PenShape.tsx
var PenShape = /*#__PURE__*/ function(TLDrawShape) {
    "use strict";
    _inherits(_class, TLDrawShape);
    var _super = _createSuper(_class);
    function _class(param12) {
        var props2 = param12 === void 0 ? {
        } : param12;
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call(this, props2);
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isErasing = param.isErasing;
            var ref = _assertThisInitialized(_this), pointsPath = ref.pointsPath, _props = ref.props, stroke = _props.stroke, strokeWidth = _props.strokeWidth, opacity = _props.opacity;
            return(/* @__PURE__ */ React80.createElement(SVGContainer, _objectSpread({
            }, events, {
                opacity: isErasing ? 0.2 : opacity
            }), /* @__PURE__ */ React80.createElement("path", {
                d: pointsPath,
                strokeWidth: strokeWidth,
                stroke: stroke,
                fill: stroke,
                pointerEvents: "all"
            })));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var pointsPath = _assertThisInitialized(_this).pointsPath;
            return(/* @__PURE__ */ React80.createElement("path", {
                d: pointsPath
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            props = withClampedStyles(props);
            if (props.strokeWidth !== void 0) props.strokeWidth = Math.max(props.strokeWidth, 1);
            return props;
        });
        makeObservable(_assertThisInitialized(_this));
        return _this;
    }
    _createClass(_class, [
        {
            key: "pointsPath",
            get: function get() {
                var ref = this, _props = ref.props, points = _props.points, isComplete = _props.isComplete, strokeWidth = _props.strokeWidth;
                if (points.length < 2) {
                    return "M -4, 0\n      a 4,4 0 1,0 8,0\n      a 4,4 0 1,0 -8,0";
                }
                var stroke = me(points, {
                    size: 4 + strokeWidth * 2,
                    last: isComplete
                });
                return SvgPathUtils.getCurvedPathForPolygon(stroke);
            }
        }
    ]);
    return _class;
}(TLDrawShape1);
__publicField(PenShape, "id", "draw");
__publicField(PenShape, "defaultProps", {
    id: "draw",
    parentId: "page",
    type: "draw",
    point: [
        0,
        0
    ],
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
init_cjs_shims();
var React81 = __toESM(require("react"));
var PolygonShape = /*#__PURE__*/ function(TLPolygonShape) {
    "use strict";
    _inherits(_class, TLPolygonShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isErasing = param.isErasing, isSelected = param.isSelected;
            var ref = _assertThisInitialized(_this), _offset = _slicedToArray(ref.offset, 2), x = _offset[0], y = _offset[1], _props = ref.props, stroke = _props.stroke, fill = _props.fill, strokeWidth = _props.strokeWidth, opacity = _props.opacity;
            var path = _this.getVertices(strokeWidth / 2).join();
            return(/* @__PURE__ */ React81.createElement(SVGContainer, _objectSpread({
            }, events, {
                opacity: isErasing ? 0.2 : opacity
            }), /* @__PURE__ */ React81.createElement("g", {
                transform: "translate(".concat(x, ", ").concat(y, ")")
            }, /* @__PURE__ */ React81.createElement("polygon", {
                className: isSelected ? "tl-hitarea-fill" : "tl-hitarea-stroke",
                points: path
            }), /* @__PURE__ */ React81.createElement("polygon", {
                points: path,
                stroke: stroke,
                fill: fill,
                strokeWidth: strokeWidth,
                strokeLinejoin: "round"
            }))));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var ref = _assertThisInitialized(_this), _offset = _slicedToArray(ref.offset, 2), x = _offset[0], y = _offset[1], strokeWidth = ref.props.strokeWidth;
            return(/* @__PURE__ */ React81.createElement("polygon", {
                transform: "translate(".concat(x, ", ").concat(y, ")"),
                points: _this.getVertices(strokeWidth / 2).join()
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            if (props.sides !== void 0) props.sides = Math.max(props.sides, 3);
            return withClampedStyles(props);
        });
        return _this;
    }
    return _class;
}(TLPolygonShape1);
__publicField(PolygonShape, "id", "polygon");
__publicField(PolygonShape, "defaultProps", {
    id: "polygon",
    parentId: "page",
    type: "polygon",
    point: [
        0,
        0
    ],
    size: [
        100,
        100
    ],
    sides: 5,
    ratio: 1,
    isFlippedY: false,
    stroke: "#000000",
    fill: "#ffffff",
    strokeWidth: 2,
    opacity: 1
});
// src/lib/shapes/PolylineShape.tsx
init_cjs_shims();
var React82 = __toESM(require("react"));
var PolylineShape = /*#__PURE__*/ function(TLPolylineShape) {
    "use strict";
    _inherits(_class, TLPolylineShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "hideSelection", true);
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isErasing = param.isErasing;
            var ref = _assertThisInitialized(_this), points = ref.points, _props = ref.props, stroke = _props.stroke, strokeWidth = _props.strokeWidth, opacity = _props.opacity;
            var path = points.join();
            return(/* @__PURE__ */ React82.createElement(SVGContainer, _objectSpread({
            }, events, {
                opacity: isErasing ? 0.2 : opacity
            }), /* @__PURE__ */ React82.createElement("g", null, /* @__PURE__ */ React82.createElement("polyline", {
                className: "tl-hitarea-stroke",
                points: path
            }), /* @__PURE__ */ React82.createElement("polyline", {
                points: path,
                stroke: stroke,
                fill: "none",
                strokeWidth: strokeWidth,
                strokeLinejoin: "round"
            }))));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var points = _assertThisInitialized(_this).points;
            var path = points.join();
            return(/* @__PURE__ */ React82.createElement("polyline", {
                points: path
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            return withClampedStyles(props);
        });
        return _this;
    }
    return _class;
}(TLPolylineShape1);
__publicField(PolylineShape, "id", "polyline");
__publicField(PolylineShape, "defaultProps", {
    id: "box",
    parentId: "page",
    type: "polyline",
    point: [
        0,
        0
    ],
    handles: [],
    stroke: "#000000",
    fill: "#ffffff",
    strokeWidth: 2,
    opacity: 1
});
// src/lib/shapes/StarShape.tsx
init_cjs_shims();
var React83 = __toESM(require("react"));
var StarShape = /*#__PURE__*/ function(TLStarShape) {
    "use strict";
    _inherits(_class, TLStarShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isErasing = param.isErasing, isSelected = param.isSelected;
            var ref = _assertThisInitialized(_this), _offset = _slicedToArray(ref.offset, 2), x = _offset[0], y = _offset[1], _props = ref.props, stroke = _props.stroke, fill = _props.fill, strokeWidth = _props.strokeWidth, opacity = _props.opacity;
            var path = _this.getVertices(strokeWidth / 2).join();
            return(/* @__PURE__ */ React83.createElement(SVGContainer, _objectSpread({
            }, events, {
                opacity: isErasing ? 0.2 : opacity
            }), /* @__PURE__ */ React83.createElement("polygon", {
                className: isSelected ? "tl-hitarea-fill" : "tl-hitarea-stroke",
                transform: "translate(".concat(x, ", ").concat(y, ")"),
                points: path
            }), /* @__PURE__ */ React83.createElement("polygon", {
                transform: "translate(".concat(x, ", ").concat(y, ")"),
                points: path,
                stroke: stroke,
                fill: fill,
                strokeWidth: strokeWidth,
                strokeLinejoin: "round",
                strokeLinecap: "round"
            })));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var ref = _assertThisInitialized(_this), _offset = _slicedToArray(ref.offset, 2), x = _offset[0], y = _offset[1], strokeWidth = ref.props.strokeWidth;
            return(/* @__PURE__ */ React83.createElement("polygon", {
                transform: "translate(".concat(x, ", ").concat(y, ")"),
                points: _this.getVertices(strokeWidth / 2).join()
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            if (props.sides !== void 0) props.sides = Math.max(props.sides, 3);
            return withClampedStyles(props);
        });
        return _this;
    }
    return _class;
}(TLStarShape1);
__publicField(StarShape, "id", "star");
__publicField(StarShape, "defaultProps", {
    id: "star",
    parentId: "page",
    type: "star",
    point: [
        0,
        0
    ],
    size: [
        100,
        100
    ],
    sides: 5,
    ratio: 1,
    isFlippedY: false,
    stroke: "#000000",
    fill: "#ffffff",
    strokeWidth: 2,
    opacity: 1
});
// src/lib/shapes/TextShape.tsx
init_cjs_shims();
var React84 = __toESM(require("react"));
var TextShape = /*#__PURE__*/ function(TLTextShape) {
    "use strict";
    _inherits(_class, TLTextShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isErasing = param.isErasing, isEditing = param.isEditing, onEditingEnd = param.onEditingEnd;
            var ref14 = _assertThisInitialized(_this), _props1 = ref14.props, opacity = _props1.opacity, fontFamily = _props1.fontFamily, fontSize = _props1.fontSize, fontWeight = _props1.fontWeight, lineHeight = _props1.lineHeight, text = _props1.text, stroke = _props1.stroke, padding = _props1.padding;
            var rInput = React84.useRef(null);
            var rIsMounted = React84.useRef(false);
            var rInnerWrapper = React84.useRef(null);
            var handleChange = React84.useCallback(function(e) {
                var isSizeLocked = _this.props.isSizeLocked;
                var text2 = TextUtils.normalizeText(e.currentTarget.value);
                if (isSizeLocked) {
                    _this.update({
                        text: text2,
                        size: _this.getAutoSizedBoundingBox({
                            text: text2
                        })
                    });
                    return;
                }
                _this.update({
                    text: text2
                });
            }, []);
            var handleKeyDown = React84.useCallback(function(e) {
                if (e.metaKey) e.stopPropagation();
                switch(e.key){
                    case "Meta":
                        {
                            e.stopPropagation();
                            break;
                        }
                    case "z":
                        {
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
                    case "Enter":
                        {
                            if (e.ctrlKey || e.metaKey) {
                                e.currentTarget.blur();
                            }
                            break;
                        }
                    case "Tab":
                        {
                            e.preventDefault();
                            if (e.shiftKey) {
                                TextUtils.unindent(e.currentTarget);
                            } else {
                                TextUtils.indent(e.currentTarget);
                            }
                            _this.update({
                                text: TextUtils.normalizeText(e.currentTarget.value)
                            });
                            break;
                        }
                }
            }, []);
            var handleBlur = React84.useCallback(function(e) {
                e.currentTarget.setSelectionRange(0, 0);
                onEditingEnd === null || onEditingEnd === void 0 ? void 0 : onEditingEnd();
            }, [
                onEditingEnd
            ]);
            var handleFocus = React84.useCallback(function(e) {
                if (!isEditing) return;
                if (!rIsMounted.current) return;
                if (document.activeElement === e.currentTarget) {
                    e.currentTarget.select();
                }
            }, [
                isEditing
            ]);
            var handlePointerDown = React84.useCallback(function(e) {
                if (isEditing) e.stopPropagation();
            }, [
                isEditing
            ]);
            React84.useEffect(function() {
                if (isEditing) {
                    requestAnimationFrame(function() {
                        rIsMounted.current = true;
                        var elm = rInput.current;
                        if (elm) {
                            elm.focus();
                            elm.select();
                        }
                    });
                } else {
                    onEditingEnd === null || onEditingEnd === void 0 ? void 0 : onEditingEnd();
                }
            }, [
                isEditing,
                onEditingEnd
            ]);
            React84.useLayoutEffect(function() {
                var _props = _this.props, fontFamily2 = _props.fontFamily, fontSize2 = _props.fontSize, fontWeight2 = _props.fontWeight, lineHeight2 = _props.lineHeight, padding2 = _props.padding;
                var ref = _this.measure.measureText(text, {
                    fontFamily: fontFamily2,
                    fontSize: fontSize2,
                    fontWeight: fontWeight2,
                    lineHeight: lineHeight2
                }, padding2), width = ref.width, height = ref.height;
                _this.update({
                    size: [
                        width,
                        height
                    ]
                });
            }, []);
            return(/* @__PURE__ */ React84.createElement(HTMLContainer, _objectSpread({
            }, events, {
                opacity: isErasing ? 0.2 : opacity
            }), /* @__PURE__ */ React84.createElement("div", {
                ref: rInnerWrapper,
                className: "text-shape-wrapper",
                "data-hastext": !!text,
                "data-isediting": isEditing,
                style: {
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    fontWeight: fontWeight,
                    padding: padding,
                    lineHeight: lineHeight,
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
            }) : /* @__PURE__ */ React84.createElement(React84.Fragment, null, text, "​"))));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var ref = _assertThisInitialized(_this), borderRadius = ref.props.borderRadius, bounds = ref.bounds;
            return(/* @__PURE__ */ React84.createElement("rect", {
                width: bounds.width,
                height: bounds.height,
                rx: borderRadius,
                ry: borderRadius,
                fill: "transparent"
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            if (props.isSizeLocked || _this.props.isSizeLocked) {
                props.size = _this.getAutoSizedBoundingBox(props);
            }
            return withClampedStyles(props);
        });
        __publicField(_assertThisInitialized(_this), "measure", new TLTextMeasure());
        __publicField(_assertThisInitialized(_this), "getBounds", function() {
            var _point = _slicedToArray(_this.props.point, 2), x = _point[0], y = _point[1];
            var _size = _slicedToArray(_this.props.size, 2), width = _size[0], height = _size[1];
            return {
                minX: x,
                minY: y,
                maxX: x + width,
                maxY: y + height,
                width: width,
                height: height
            };
        });
        __publicField(_assertThisInitialized(_this), "onResizeStart", function(param) {
            var isSingle = param.isSingle;
            if (!isSingle) return _assertThisInitialized(_this);
            var _scale;
            _this.scale = _toConsumableArray((_scale = _this.props.scale) !== null && _scale !== void 0 ? _scale : [
                1,
                1
            ]);
            return _this.update({
                isSizeLocked: false
            });
        });
        __publicField(_assertThisInitialized(_this), "onResetBounds", function() {
            _this.update({
                size: _this.getAutoSizedBoundingBox(),
                isSizeLocked: true
            });
            return _assertThisInitialized(_this);
        });
        return _this;
    }
    _createClass(_class, [
        {
            key: "getAutoSizedBoundingBox",
            value: function getAutoSizedBoundingBox(param) {
                var props = param === void 0 ? {
                } : param;
                var _text = props.text, text = _text === void 0 ? this.props.text : _text, _fontFamily = props.fontFamily, fontFamily = _fontFamily === void 0 ? this.props.fontFamily : _fontFamily, _fontSize = props.fontSize, fontSize = _fontSize === void 0 ? this.props.fontSize : _fontSize, _fontWeight = props.fontWeight, fontWeight = _fontWeight === void 0 ? this.props.fontWeight : _fontWeight, _lineHeight = props.lineHeight, lineHeight = _lineHeight === void 0 ? this.props.lineHeight : _lineHeight, _padding = props.padding, padding = _padding === void 0 ? this.props.padding : _padding;
                var ref = this.measure.measureText(text, {
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    lineHeight: lineHeight,
                    fontWeight: fontWeight
                }, padding), width = ref.width, height = ref.height;
                return [
                    width,
                    height
                ];
            }
        }
    ]);
    return _class;
}(TLTextShape1);
__publicField(TextShape, "id", "text");
__publicField(TextShape, "defaultProps", {
    id: "box",
    parentId: "page",
    type: "text",
    point: [
        0,
        0
    ],
    size: [
        100,
        100
    ],
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
init_cjs_shims();
var React85 = __toESM(require("react"));
var _YouTubeShape = /*#__PURE__*/ function(TLBoxShape) {
    "use strict";
    _inherits(_class, TLBoxShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "aspectRatio", 480 / 853);
        __publicField(_assertThisInitialized(_this), "canChangeAspectRatio", false);
        __publicField(_assertThisInitialized(_this), "canFlip", false);
        __publicField(_assertThisInitialized(_this), "canEdit", true);
        __publicField(_assertThisInitialized(_this), "ReactContextBar", observer(function() {
            var embedId = _this.props.embedId;
            var rInput = React85.useRef(null);
            var app = useApp();
            var handleChange = React85.useCallback(function(e) {
                var url = e.currentTarget.value;
                var match = url.match(/^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/);
                var ref, ref15;
                var embedId2 = (ref15 = (ref = match === null || match === void 0 ? void 0 : match[1]) !== null && ref !== void 0 ? ref : url) !== null && ref15 !== void 0 ? ref15 : "";
                _this.update({
                    embedId: embedId2,
                    size: _YouTubeShape.defaultProps.size
                });
                app.persist();
            }, []);
            return(/* @__PURE__ */ React85.createElement(React85.Fragment, null, /* @__PURE__ */ React85.createElement(TextInput, {
                ref: rInput,
                label: "Youtube Video ID",
                type: "text",
                value: embedId,
                onChange: handleChange
            })));
        }));
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isEditing = param.isEditing, isErasing = param.isErasing;
            var ref = _assertThisInitialized(_this), _props = ref.props, opacity = _props.opacity, embedId = _props.embedId;
            var app = useApp();
            var isSelected = app.selectedIds.has(_this.id);
            return(/* @__PURE__ */ React85.createElement(HTMLContainer, _objectSpread({
                style: {
                    overflow: "hidden",
                    pointerEvents: "all",
                    opacity: isErasing ? 0.2 : opacity
                }
            }, events), embedId && /* @__PURE__ */ React85.createElement("div", {
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
                src: "https://www.youtube.com/embed/".concat(embedId),
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
            }))))))));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var ref = _assertThisInitialized(_this), _props = ref.props, _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1];
            return(/* @__PURE__ */ React85.createElement("rect", {
                width: w,
                height: h,
                fill: "transparent"
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            if (props.size !== void 0) {
                props.size[0] = Math.max(props.size[0], 1);
                props.size[1] = Math.max(props.size[0] * _this.aspectRatio, 1);
            }
            return withClampedStyles(props);
        });
        return _this;
    }
    return _class;
}(TLBoxShape1);
var YouTubeShape = _YouTubeShape;
__publicField(YouTubeShape, "id", "youtube");
__publicField(YouTubeShape, "defaultProps", {
    id: "youtube",
    type: "youtube",
    parentId: "page",
    point: [
        0,
        0
    ],
    size: [
        600,
        320
    ],
    stroke: "#000000",
    fill: "#ffffff",
    strokeWidth: 2,
    opacity: 1,
    embedId: ""
});
// src/lib/shapes/LogseqPortalShape.tsx
init_cjs_shims();
var React86 = __toESM(require("react"));
var _LogseqPortalShape = /*#__PURE__*/ function(TLBoxShape) {
    "use strict";
    _inherits(_class, TLBoxShape);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "canChangeAspectRatio", true);
        __publicField(_assertThisInitialized(_this), "canFlip", false);
        __publicField(_assertThisInitialized(_this), "canEdit", false);
        __publicField(_assertThisInitialized(_this), "ReactContextBar", observer(function() {
            var pageId = _this.props.pageId;
            var ref16 = _slicedToArray(React86.useState(pageId), 2), q = ref16[0], setQ = ref16[1];
            var rInput = React86.useRef(null);
            var search = React86.useContext(LogseqContext).search;
            var app = useApp();
            var secretPrefix = "œ::";
            var commitChange = React86.useCallback(function(id) {
                var ref;
                setQ(id);
                _this.update({
                    pageId: id,
                    size: _LogseqPortalShape.defaultProps.size
                });
                app.persist();
                (ref = rInput.current) === null || ref === void 0 ? void 0 : ref.blur();
            }, []);
            var handleChange = React86.useCallback(function(e) {
                var _q = e.currentTarget.value;
                if (_q.startsWith(secretPrefix)) {
                    var id = _q.substring(secretPrefix.length);
                    commitChange(id);
                } else {
                    setQ(_q);
                }
            }, []);
            var options = React86.useMemo(function() {
                if (search && q) {
                    return search(q);
                }
                return null;
            }, [
                search,
                q
            ]);
            return(/* @__PURE__ */ React86.createElement(React86.Fragment, null, /* @__PURE__ */ React86.createElement(TextInput, {
                ref: rInput,
                label: "Page name or block UUID",
                type: "text",
                value: q,
                onChange: handleChange,
                list: "logseq-portal-search-results"
            }), /* @__PURE__ */ React86.createElement("datalist", {
                id: "logseq-portal-search-results"
            }, options === null || options === void 0 ? void 0 : options.map(function(option) {
                /* @__PURE__ */ return React86.createElement("option", {
                    key: option,
                    value: secretPrefix + option
                }, option);
            }))));
        }));
        __publicField(_assertThisInitialized(_this), "ReactComponent", observer(function(param) {
            var events = param.events, isEditing = param.isEditing, isErasing = param.isErasing;
            var ref = _assertThisInitialized(_this), _props = ref.props, opacity = _props.opacity, pageId = _props.pageId;
            var app = useApp();
            var Page = React86.useContext(LogseqContext).Page;
            var isSelected = app.selectedIds.has(_this.id);
            if (!Page) {
                return null;
            }
            return(/* @__PURE__ */ React86.createElement(HTMLContainer, _objectSpread({
                style: {
                    overflow: "hidden",
                    pointerEvents: "all",
                    opacity: isErasing ? 0.2 : opacity,
                    border: "1px solid rgb(52, 52, 52)",
                    backgroundColor: "#ffffff"
                }
            }, events), pageId && /* @__PURE__ */ React86.createElement("div", {
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
                onPointerDown: function(e) {
                    return !isEditing && e.stopPropagation();
                },
                onPointerUp: function(e) {
                    return !isEditing && e.stopPropagation();
                },
                style: {
                    padding: "0 24px"
                }
            }, /* @__PURE__ */ React86.createElement(Page, {
                pageId: pageId
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
            }, "LOGSEQ PORTAL PLACEHOLDER"))));
        }));
        __publicField(_assertThisInitialized(_this), "ReactIndicator", observer(function() {
            var ref = _assertThisInitialized(_this), _props = ref.props, _size = _slicedToArray(_props.size, 2), w = _size[0], h = _size[1];
            return(/* @__PURE__ */ React86.createElement("rect", {
                width: w,
                height: h,
                fill: "transparent"
            }));
        }));
        __publicField(_assertThisInitialized(_this), "validateProps", function(props) {
            if (props.size !== void 0) {
                props.size[0] = Math.max(props.size[0], 50);
                props.size[1] = Math.max(props.size[1], 50);
            }
            return withClampedStyles(props);
        });
        return _this;
    }
    return _class;
}(TLBoxShape1);
var LogseqPortalShape = _LogseqPortalShape;
__publicField(LogseqPortalShape, "id", "logseq-portal");
__publicField(LogseqPortalShape, "defaultProps", {
    id: "logseq-portal",
    type: "logseq-portal",
    parentId: "page",
    point: [
        0,
        0
    ],
    size: [
        600,
        320
    ],
    stroke: "#000000",
    fill: "#ffffff",
    strokeWidth: 2,
    opacity: 1,
    pageId: ""
});
// src/lib/tools/index.ts
init_cjs_shims();
// src/lib/tools/BoxTool.tsx
init_cjs_shims();
// src/lib/index.ts
init_cjs_shims();
// src/lib/unused-app/index.ts
init_cjs_shims();
// src/lib/unused-app/NuApp.ts
init_cjs_shims();
// src/lib/tools/BoxTool.tsx
var BoxTool = /*#__PURE__*/ function(TLBoxTool) {
    "use strict";
    _inherits(_class, TLBoxTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "Shape", BoxShape);
        return _this;
    }
    return _class;
}(TLBoxTool1);
__publicField(BoxTool, "id", "box");
__publicField(BoxTool, "shortcut", [
    "r"
]);
// src/lib/tools/CodeSandboxTool.tsx
init_cjs_shims();
var CodeSandboxTool = /*#__PURE__*/ function(TLBoxTool) {
    "use strict";
    _inherits(_class, TLBoxTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "Shape", CodeSandboxShape);
        return _this;
    }
    return _class;
}(TLBoxTool1);
__publicField(CodeSandboxTool, "id", "code");
__publicField(CodeSandboxTool, "shortcut", [
    "x"
]);
// src/lib/tools/DotTool.tsx
init_cjs_shims();
var DotTool = /*#__PURE__*/ function(TLDotTool) {
    "use strict";
    _inherits(_class, TLDotTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "Shape", DotShape);
        return _this;
    }
    return _class;
}(TLDotTool1);
__publicField(DotTool, "id", "dot");
__publicField(DotTool, "shortcut", [
    "t"
]);
// src/lib/tools/EllipseTool.tsx
init_cjs_shims();
var EllipseTool = /*#__PURE__*/ function(TLBoxTool) {
    "use strict";
    _inherits(_class, TLBoxTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "Shape", EllipseShape);
        return _this;
    }
    return _class;
}(TLBoxTool1);
__publicField(EllipseTool, "id", "ellipse");
__publicField(EllipseTool, "shortcut", [
    "o"
]);
// src/lib/tools/EraseTool.tsx
init_cjs_shims();
var NuEraseTool = /*#__PURE__*/ function(TLEraseTool) {
    "use strict";
    _inherits(_class, TLEraseTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        return _super.apply(this, arguments);
    }
    return _class;
}(TLEraseTool1);
__publicField(NuEraseTool, "id", "erase");
__publicField(NuEraseTool, "shortcut", [
    "e"
]);
// src/lib/tools/HighlighterTool.tsx
init_cjs_shims();
var HighlighterTool = /*#__PURE__*/ function(TLDrawTool) {
    "use strict";
    _inherits(_class, TLDrawTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "Shape", HighlighterShape);
        __publicField(_assertThisInitialized(_this), "simplify", true);
        __publicField(_assertThisInitialized(_this), "simplifyTolerance", 0.618);
        return _this;
    }
    return _class;
}(TLDrawTool1);
__publicField(HighlighterTool, "id", "highlighter");
__publicField(HighlighterTool, "shortcut", [
    "h"
]);
// src/lib/tools/LineTool.tsx
init_cjs_shims();
var LineTool = /*#__PURE__*/ function(TLLineTool) {
    "use strict";
    _inherits(_class, TLLineTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "Shape", LineShape);
        return _this;
    }
    return _class;
}(TLLineTool1);
__publicField(LineTool, "id", "line");
__publicField(LineTool, "shortcut", [
    "l"
]);
// src/lib/tools/PenTool.tsx
init_cjs_shims();
var PenTool = /*#__PURE__*/ function(TLDrawTool) {
    "use strict";
    _inherits(_class, TLDrawTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "Shape", PenShape);
        __publicField(_assertThisInitialized(_this), "simplify", false);
        return _this;
    }
    return _class;
}(TLDrawTool1);
__publicField(PenTool, "id", "pen");
__publicField(PenTool, "shortcut", [
    "d",
    "p"
]);
// src/lib/tools/PolygonTool.tsx
init_cjs_shims();
var PolygonTool = /*#__PURE__*/ function(TLBoxTool) {
    "use strict";
    _inherits(_class, TLBoxTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "Shape", PolygonShape);
        return _this;
    }
    return _class;
}(TLBoxTool1);
__publicField(PolygonTool, "id", "polygon");
__publicField(PolygonTool, "shortcut", [
    "g"
]);
// src/lib/tools/StarTool.tsx
init_cjs_shims();
var StarTool = /*#__PURE__*/ function(TLBoxTool) {
    "use strict";
    _inherits(_class, TLBoxTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "Shape", StarShape);
        return _this;
    }
    return _class;
}(TLBoxTool1);
__publicField(StarTool, "id", "star");
__publicField(StarTool, "shortcut", [
    "s"
]);
// src/lib/tools/TextTool.tsx
init_cjs_shims();
var TextTool = /*#__PURE__*/ function(TLTextTool) {
    "use strict";
    _inherits(_class, TLTextTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "Shape", TextShape);
        return _this;
    }
    return _class;
}(TLTextTool1);
__publicField(TextTool, "id", "text");
__publicField(TextTool, "shortcut", [
    "t"
]);
// src/lib/tools/YouTubeTool.tsx
init_cjs_shims();
var YouTubeTool = /*#__PURE__*/ function(TLBoxTool) {
    "use strict";
    _inherits(_class, TLBoxTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "Shape", YouTubeShape);
        return _this;
    }
    return _class;
}(TLBoxTool1);
__publicField(YouTubeTool, "id", "youtube");
__publicField(YouTubeTool, "shortcut", [
    "y"
]);
// src/lib/tools/LogseqPortalTool.tsx
init_cjs_shims();
var LogseqPortalTool = /*#__PURE__*/ function(TLBoxTool) {
    "use strict";
    _inherits(_class, TLBoxTool);
    var _super = _createSuper(_class);
    function _class() {
        _classCallCheck(this, _class);
        var _this;
        _this = _super.call.apply(_super, [
            this
        ].concat(Array.prototype.slice.call(arguments)));
        __publicField(_assertThisInitialized(_this), "Shape", LogseqPortalShape);
        return _this;
    }
    return _class;
}(TLBoxTool1);
__publicField(LogseqPortalTool, "id", "logseq-portal");
__publicField(LogseqPortalTool, "shortcut", [
    "i"
]);
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
    var onFileDrop = useFileDrop();
    var Page = React87.useMemo(function() {
        return React87.memo(props.PageComponent);
    }, []);
    return(/* @__PURE__ */ React87.createElement(LogseqContext.Provider, {
        value: {
            Page: Page,
            search: props.searchHandler
        }
    }, /* @__PURE__ */ React87.createElement(AppProvider, _objectSpread({
        Shapes: shapes,
        Tools: tools,
        onFileDrop: onFileDrop
    }, props), /* @__PURE__ */ React87.createElement("div", {
        className: "logseq-tldraw logseq-tldraw-wrapper"
    }, /* @__PURE__ */ React87.createElement(AppCanvas, {
        components: components
    }), /* @__PURE__ */ React87.createElement(AppUI, null)))));
}; /*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */ 
