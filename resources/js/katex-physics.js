(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("main", [], factory);
	else if(typeof exports === 'object')
		exports["main"] = factory();
	else
		root["main"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["c"] = popNextArg;
/* harmony export (immutable) */ __webpack_exports__["a"] = getSqureParameter;
/* harmony export (immutable) */ __webpack_exports__["b"] = isAlt;
function popNextArg(ctx) {
    return ctx.consumeArgs(1)[0].reverse().map(function (t) {
        return t.text;
    }).join("");
}

function getSqureParameter(ctx) {
    while (ctx.future().text === " ") {
        ctx.popToken();
    }

    var parameter = "";
    if (ctx.future().text === "[") {
        ctx.popToken();
        while (true) {
            var ch = ctx.popToken().text;

            if (ch === "]") {
                break;
            } else if (ch === "EOF") {
                throw new Error("Expecting ]");
            }

            parameter += ch;
        }
    }

    return parameter;
}

function isAlt(ctx) {
    while (ctx.future().text === " ") {
        ctx.popToken();
    }

    if (ctx.future().text === "*") {
        ctx.popToken();
        return true;
    }

    return false;
}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(2);


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__macros_bracing__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__macros_derivative__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__macros_dirac__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__macros_matrix__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__macros_text__ = __webpack_require__(7);
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };







var macros = _extends({}, __WEBPACK_IMPORTED_MODULE_0__macros_bracing__["a" /* default */], __WEBPACK_IMPORTED_MODULE_1__macros_derivative__["a" /* default */], __WEBPACK_IMPORTED_MODULE_2__macros_dirac__["a" /* default */], __WEBPACK_IMPORTED_MODULE_3__macros_matrix__["a" /* default */], __WEBPACK_IMPORTED_MODULE_4__macros_text__["a" /* default */]);

if (typeof window !== "undefined") {
    window.macros_physics = macros;
}

/* harmony default export */ __webpack_exports__["default"] = (macros);

/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var braces = {
    "(": ")",
    "[": "]",
    "{": "}",
    "\\{": "\\}",
    "|": "|"
};

var evalBraces = {
    "(": "|",
    "[": "|",
    "{": "}"
};

/* harmony default export */ __webpack_exports__["a"] = ({
    "\\qty": function qty(ctx) {
        var start = ctx.popToken().text;
        var end = braces[start];
        if (typeof end === "undefined") {
            throw new Error("Expecting opening delimeters after \\qty");
        }

        var expr = ["\\left"];
        expr.push(start === "{" ? "\\{" : start);

        var opened = 0;
        while (true) {
            var next = ctx.popToken().text;
            if (next === "EOF") {
                throw new Error("Expecting closing delimeters " + end + " after \\mqty");
            } else if (next !== end) {
                expr.push(next);
                if (next === start) {
                    ++opened;
                }
            } else if (opened > 0) {
                expr.push(next);
                --opened;
            } else {
                // end
                expr.push("\\right");
                expr.push(end === "}" ? "\\}" : next);
                break;
            }
        }

        return expr.join(" ");
    },

	"\\abs": "\\qty|{#1}|",
	"\\order": "\\mathcal{O}\\qty({#1})",
	"\\va": "\\vec{\\mathbf{#1}}",
	"\\vb": "\\mathbf{#1}",
	"\\vdot": "\\boldsymbol\\cdot",
    "\\eval": function _eval(ctx) {
        var start = ctx.popToken().text;
        var end = evalBraces[start];
        if (typeof end === "undefined") {
            throw new Error("Expecting opening delimeters after \\eval");
        }

        var expr = ["\\left"];
        expr.push(start === "{" ? "." : start);

        var opened = 0;
        while (true) {
            var next = ctx.popToken().text;
            if (next === "EOF") {
                throw new Error("Expecting " + end + " after \\eval");
            } else if (next !== end) {
                expr.push(next);
                if (next === start) {
                    ++opened;
                }
            } else if (end === "}" && opened > 0) {
                expr.push(next);
                --opened;
            } else {
                // end
                expr.push("\\rule{0px}{1.2em}\\right|");
                break;
            }
        }

        return expr.join(" ");
    }
});

/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util__ = __webpack_require__(0);


var isDigit = /^\d+$/;
var dd = function dd(n, f) {
    return "\\dd[" + n + "]{" + f + "}";
};
var pd = function pd(n, f) {
    return "\\pd[" + n + "]{" + f + "}";
};

/* harmony default export */ __webpack_exports__["a"] = ({
    "\\dd": function dd(ctx) {
        var n = Object(__WEBPACK_IMPORTED_MODULE_0__util__["a" /* getSqureParameter */])(ctx);

        var op = "\\mathrm{d}";
        if (n && !isDigit.test(n) || n > 1) {
            op += "^{" + n + "}";
        }

        if (ctx.future().text !== "{") {
            return op;
        }

        try {
            var ch = Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx);
            return "\\mathop{}\\!" + op + "{" + ch + "}";
        } catch (e) {
            return op;
        }
    },
    "\\pd": function pd(ctx) {
        var n = Object(__WEBPACK_IMPORTED_MODULE_0__util__["a" /* getSqureParameter */])(ctx);

        var op = "\\partial";
        if (n && !isDigit.test(n) || n > 1) {
            op += "^{" + n + "}";
        }

        if (ctx.future().text !== "{") {
            return op;
        }

        try {
            var ch = Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx);
            return "\\mathop{}\\!" + op + "{" + ch + "}";
        } catch (e) {
            return op;
        }
    },
    "\\dv": function dv(ctx) {
        var n = Object(__WEBPACK_IMPORTED_MODULE_0__util__["a" /* getSqureParameter */])(ctx);
        var fn = Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx);

        while (ctx.future().text === " ") {
            ctx.popToken();
        }
        if (ctx.future().text !== "{") {
            return "\\frac{\\dd^{" + n + "}}{" + dd(1, fn) + "^{" + n + "}}";
        }

        var variable = void 0;
        try {
            variable = Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx);
        } catch (e) {}

        return "\\frac{" + dd(n, fn) + "}{" + dd(1, variable) + "^{" + n + "}}";
    },
    "\\pdv": function pdv(ctx) {
        var n = Object(__WEBPACK_IMPORTED_MODULE_0__util__["a" /* getSqureParameter */])(ctx);
        var fn = Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx);

        if (n) {
            while (ctx.future().text === " ") {
                ctx.popToken();
            }
            if (ctx.future().text !== "{") {
                return "\\frac{\\pd^{" + n + "}}{" + pd(1, fn) + "^{" + n + "}}";
            }

            var variable = void 0;
            try {
                variable = Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx);
            } catch (e) {}

            return "\\frac{" + pd(n, fn) + "}{" + pd(1, variable) + "^{" + n + "}}";
        }

        var args = [];
        while (true) {
            while (ctx.future().text === " ") {
                ctx.popToken();
            }
            if (ctx.future().text !== "{") {
                break;
            }

            try {
                args.push(Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx));
            } catch (e) {
                break;
            }
        }

        if (args.length === 0) {
            return "\\frac{\\partial}{" + pd(args.length, fn) + "}";
        }

        return "\\frac{" + pd(args.length, fn) + "}{" + args.map(function (arg) {
            return pd(1, arg);
        }).join("") + "}";
    }
});

/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util__ = __webpack_require__(0);
var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();



/* harmony default export */ __webpack_exports__["a"] = ({
    "\\bra": function bra(ctx) {
        var expr = ["\\left<{" + Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx)];

        while (ctx.future().text === " ") {
            ctx.popToken();
        }

        if (ctx.future().text !== "\\ket") {
            expr.push("}\\right|");
            return expr.join(" ");
        }

        // \bra{a}\ket{b} => \left<{a}\middle|{b}\right>
        ctx.popToken();
        expr.push("}\\middle|{");
        expr.push(Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx));
        expr.push("}\\right>");

        return expr.join(" ");
    },

    "\\ket": "\\left|{#1}\\right>",
    "\\braket": function braket(ctx) {
        var a = Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx);

        var expr = ["\\left<{" + a + "}\\middle|{"];

        try {
            expr.push(Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx));
        } catch (e) {
            expr.push(a);
        }

        expr.push("}\\right>");
        return expr.join(" ");
    },
	"\\ev": "\\left<{#1}\\right>",
    "\\ketbra": function ketbra(ctx) {
        var a = Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx);

        var expr = ["\\left|{" + a + "}\\middle>\\middle<{"];

        try {
            expr.push(Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx));
        } catch (e) {
            expr.push(a);
        }

        expr.push("}\\right|");
        return expr.join(" ");
    },
    "\\expval": function expval(ctx) {
        var a = Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx);

        while (ctx.future().text === " ") {
            ctx.popToken();
        }
        if (ctx.future().text !== "{") {
            return "\\left<{" + a + "}\\right>";
        }

        var b = Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx);
        return "\\left<{" + b + "}\\middle|{" + a + "}\\middle|{" + b + "}\\right>";
    },
    "\\matrixel": function matrixel(ctx) {
        var _ctx$consumeArgs$map = ctx.consumeArgs(3).map(function (arg) {
            return arg.reverse().map(function (t) {
                return t.text;
            }).join("");
        }),
            _ctx$consumeArgs$map2 = _slicedToArray(_ctx$consumeArgs$map, 3),
            a = _ctx$consumeArgs$map2[0],
            b = _ctx$consumeArgs$map2[1],
            c = _ctx$consumeArgs$map2[2];

        return "\\left<{" + a + "}\\middle|{" + b + "}\\middle|{" + c + "}\\right>";
    }
});

/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util__ = __webpack_require__(0);


var matrixBraces = {
    "(": ")",
    "[": "]",
    "{": "}",
    "\\{": "\\}",
    "|": "|"
};

/* harmony default export */ __webpack_exports__["a"] = ({
    "\\mqty": function mqty(ctx) {
        var start = ctx.popToken().text;
        var end = matrixBraces[start];
        if (typeof end === "undefined") {
            throw new Error("Expecting opening delimeters after \\qty");
        }

        var expr = ["\\left"];
        expr.push(start === "{" ? "\\{" : start);
        expr.push("\\begin{matrix}");

        var opened = 0;
        while (true) {
            var next = ctx.popToken().text;
            if (next === "EOF") {
                throw new Error("Expecting closing delimeters " + end + " after \\mqty");
            } else if (next !== end) {
                expr.push(next);
                if (next === start) {
                    ++opened;
                }
            } else if (opened > 0) {
                expr.push(next);
                --opened;
            } else {
                // end
                expr.push("\\end{matrix}\\right");
                expr.push(end === "}" ? "\\}" : next);
                break;
            }
        }

        return expr.join(" ");
    },

    "\\mdet": "\\left|\\begin{matrix}#1\\end{matrix}\\right|",
    "\\dmat": function dmat(ctx) {
        var fill = Object(__WEBPACK_IMPORTED_MODULE_0__util__["a" /* getSqureParameter */])(ctx);
        var elements = Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx).split(",");
        var lines = [];

        for (var i = 0; i < elements.length; ++i) {
            var line = new Array(elements.length).fill(fill);
            line[i] = elements[i];
            lines.push(line.map(function (el) {
                return "{" + el + "}";
            }).join("&"));
        }

        return lines.join("\\\\");
    },
    "\\admat": function admat(ctx) {
        var fill = Object(__WEBPACK_IMPORTED_MODULE_0__util__["a" /* getSqureParameter */])(ctx);
        var elements = Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx).split(",");
        var lines = [];

        for (var i = 0; i < elements.length; ++i) {
            var line = new Array(elements.length).fill(fill);
            line[elements.length - i - 1] = elements[i];
            lines.push(line.map(function (el) {
                return "{" + el + "}";
            }).join("&"));
        }

        return lines.join("\\\\");
    },
    "\\imat": function imat(ctx) {
        var n = parseInt(Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx));
        if (isNaN(n)) {
            throw new Error("Expecting integers as the parameter of \\imat");
        }
        return "\\dmat[0]{" + new Array(n).fill(1).join(",") + "}";
    },
    "\\xmat": function xmat(ctx) {
        var labeled = Object(__WEBPACK_IMPORTED_MODULE_0__util__["b" /* isAlt */])(ctx);
        var _ref = [Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx), parseInt(Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx)), parseInt(Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])(ctx))],
            x = _ref[0],
            n = _ref[1],
            m = _ref[2];


        if (isNaN(n) || isNaN(m)) {
            throw new Error("Expecting integers as the second and third parameter of \\xmat");
        }

        if (!labeled || n === 1 && m === 1) {
            return new Array(n).fill(new Array(m).fill(x).join("&")).join("\\\\");
        }

        var matrix = [];
        for (var i = 1; i <= n; ++i) {
            var row = [];
            for (var j = 1; j <= m; ++j) {
                var label = "" + (n > 1 ? i : "") + (m > 1 ? j : "");
                row.push(x + "_{" + label + "}");
            }
            matrix.push(row);
        }

        return matrix.map(function (row) {
            return row.join(",");
        }).join("\\\\");
    }
});

/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util__ = __webpack_require__(0);


/* harmony default export */ __webpack_exports__["a"] = ({
    "\\qc": ",\\quad",
    "\\qq": function qq(ctx) {
        return (Object(__WEBPACK_IMPORTED_MODULE_0__util__["b" /* isAlt */])(ctx) ? "" : "\\quad") + "\\text{" + Object(__WEBPACK_IMPORTED_MODULE_0__util__["c" /* popNextArg */])() + "}\\quad";
    },
    "\\qcc": function qcc(ctx) {
        return (Object(__WEBPACK_IMPORTED_MODULE_0__util__["b" /* isAlt */])(ctx) ? "" : "\\quad") + "\\text{c.c.}\\quad";
    },
    "\\qif": function qif(ctx) {
        return (Object(__WEBPACK_IMPORTED_MODULE_0__util__["b" /* isAlt */])(ctx) ? "" : "\\quad") + "\\text{if}\\quad";
    }
});

/***/ })
/******/ ])["default"];
});
//# sourceMappingURL=main.js.map

for (var key in macros_physics) {
    katex.__defineMacro(key, macros_physics[key]);
}
