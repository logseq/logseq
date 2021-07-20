(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["LSPlugin"] = factory();
	else
		root["LSPlugin"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/debug/src/browser.js":
/*!*******************************************!*\
  !*** ./node_modules/debug/src/browser.js ***!
  \*******************************************/
/***/ ((module, exports, __webpack_require__) => {

/* provided dependency */ var process = __webpack_require__(/*! process/browser */ "./node_modules/process/browser.js");
/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug');
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = __webpack_require__(/*! ./common */ "./node_modules/debug/src/common.js")(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};


/***/ }),

/***/ "./node_modules/debug/src/common.js":
/*!******************************************!*\
  !*** ./node_modules/debug/src/common.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = __webpack_require__(/*! ms */ "./node_modules/ms/index.js");
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => enableOverride === null ? createDebug.enabled(namespace) : enableOverride,
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);

		createDebug.names = [];
		createDebug.skips = [];

		let i;
		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
		const len = split.length;

		for (i = 0; i < len; i++) {
			if (!split[i]) {
				// ignore empty strings
				continue;
			}

			namespaces = split[i].replace(/\*/g, '.*?');

			if (namespaces[0] === '-') {
				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
			} else {
				createDebug.names.push(new RegExp('^' + namespaces + '$'));
			}
		}
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names.map(toNamespace),
			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		if (name[name.length - 1] === '*') {
			return true;
		}

		let i;
		let len;

		for (i = 0, len = createDebug.skips.length; i < len; i++) {
			if (createDebug.skips[i].test(name)) {
				return false;
			}
		}

		for (i = 0, len = createDebug.names.length; i < len; i++) {
			if (createDebug.names[i].test(name)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Convert regexp to namespace
	*
	* @param {RegExp} regxep
	* @return {String} namespace
	* @api private
	*/
	function toNamespace(regexp) {
		return regexp.toString()
			.substring(2, regexp.toString().length - 2)
			.replace(/\.\*\?$/, '*');
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

module.exports = setup;


/***/ }),

/***/ "./node_modules/dompurify/dist/purify.js":
/*!***********************************************!*\
  !*** ./node_modules/dompurify/dist/purify.js ***!
  \***********************************************/
/***/ (function(module) {

/*! @license DOMPurify | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/2.2.2/LICENSE */

(function (global, factory) {
   true ? module.exports = factory() :
  0;
}(this, function () { 'use strict';

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

  var hasOwnProperty = Object.hasOwnProperty,
      setPrototypeOf = Object.setPrototypeOf,
      isFrozen = Object.isFrozen,
      getPrototypeOf = Object.getPrototypeOf,
      getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  var freeze = Object.freeze,
      seal = Object.seal,
      create = Object.create; // eslint-disable-line import/no-mutable-exports

  var _ref = typeof Reflect !== 'undefined' && Reflect,
      apply = _ref.apply,
      construct = _ref.construct;

  if (!apply) {
    apply = function apply(fun, thisValue, args) {
      return fun.apply(thisValue, args);
    };
  }

  if (!freeze) {
    freeze = function freeze(x) {
      return x;
    };
  }

  if (!seal) {
    seal = function seal(x) {
      return x;
    };
  }

  if (!construct) {
    construct = function construct(Func, args) {
      return new (Function.prototype.bind.apply(Func, [null].concat(_toConsumableArray(args))))();
    };
  }

  var arrayForEach = unapply(Array.prototype.forEach);
  var arrayPop = unapply(Array.prototype.pop);
  var arrayPush = unapply(Array.prototype.push);

  var stringToLowerCase = unapply(String.prototype.toLowerCase);
  var stringMatch = unapply(String.prototype.match);
  var stringReplace = unapply(String.prototype.replace);
  var stringIndexOf = unapply(String.prototype.indexOf);
  var stringTrim = unapply(String.prototype.trim);

  var regExpTest = unapply(RegExp.prototype.test);

  var typeErrorCreate = unconstruct(TypeError);

  function unapply(func) {
    return function (thisArg) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return apply(func, thisArg, args);
    };
  }

  function unconstruct(func) {
    return function () {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return construct(func, args);
    };
  }

  /* Add properties to a lookup table */
  function addToSet(set, array) {
    if (setPrototypeOf) {
      // Make 'in' and truthy checks like Boolean(set.constructor)
      // independent of any properties defined on Object.prototype.
      // Prevent prototype setters from intercepting set as a this value.
      setPrototypeOf(set, null);
    }

    var l = array.length;
    while (l--) {
      var element = array[l];
      if (typeof element === 'string') {
        var lcElement = stringToLowerCase(element);
        if (lcElement !== element) {
          // Config presets (e.g. tags.js, attrs.js) are immutable.
          if (!isFrozen(array)) {
            array[l] = lcElement;
          }

          element = lcElement;
        }
      }

      set[element] = true;
    }

    return set;
  }

  /* Shallow clone an object */
  function clone(object) {
    var newObject = create(null);

    var property = void 0;
    for (property in object) {
      if (apply(hasOwnProperty, object, [property])) {
        newObject[property] = object[property];
      }
    }

    return newObject;
  }

  /* IE10 doesn't support __lookupGetter__ so lets'
   * simulate it. It also automatically checks
   * if the prop is function or getter and behaves
   * accordingly. */
  function lookupGetter(object, prop) {
    while (object !== null) {
      var desc = getOwnPropertyDescriptor(object, prop);
      if (desc) {
        if (desc.get) {
          return unapply(desc.get);
        }

        if (typeof desc.value === 'function') {
          return unapply(desc.value);
        }
      }

      object = getPrototypeOf(object);
    }

    function fallbackValue(element) {
      console.warn('fallback value for', element);
      return null;
    }

    return fallbackValue;
  }

  var html = freeze(['a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content', 'data', 'datalist', 'dd', 'decorator', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meter', 'nav', 'nobr', 'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'section', 'select', 'shadow', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']);

  // SVG
  var svg = freeze(['svg', 'a', 'altglyph', 'altglyphdef', 'altglyphitem', 'animatecolor', 'animatemotion', 'animatetransform', 'circle', 'clippath', 'defs', 'desc', 'ellipse', 'filter', 'font', 'g', 'glyph', 'glyphref', 'hkern', 'image', 'line', 'lineargradient', 'marker', 'mask', 'metadata', 'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialgradient', 'rect', 'stop', 'style', 'switch', 'symbol', 'text', 'textpath', 'title', 'tref', 'tspan', 'view', 'vkern']);

  var svgFilters = freeze(['feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence']);

  // List of SVG elements that are disallowed by default.
  // We still need to know them so that we can do namespace
  // checks properly in case one wants to add them to
  // allow-list.
  var svgDisallowed = freeze(['animate', 'color-profile', 'cursor', 'discard', 'fedropshadow', 'feimage', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri', 'foreignobject', 'hatch', 'hatchpath', 'mesh', 'meshgradient', 'meshpatch', 'meshrow', 'missing-glyph', 'script', 'set', 'solidcolor', 'unknown', 'use']);

  var mathMl = freeze(['math', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover']);

  // Similarly to SVG, we want to know all MathML elements,
  // even those that we disallow by default.
  var mathMlDisallowed = freeze(['maction', 'maligngroup', 'malignmark', 'mlongdiv', 'mscarries', 'mscarry', 'msgroup', 'mstack', 'msline', 'msrow', 'semantics', 'annotation', 'annotation-xml', 'mprescripts', 'none']);

  var text = freeze(['#text']);

  var html$1 = freeze(['accept', 'action', 'align', 'alt', 'autocapitalize', 'autocomplete', 'autopictureinpicture', 'autoplay', 'background', 'bgcolor', 'border', 'capture', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'clear', 'color', 'cols', 'colspan', 'controls', 'controlslist', 'coords', 'crossorigin', 'datetime', 'decoding', 'default', 'dir', 'disabled', 'disablepictureinpicture', 'disableremoteplayback', 'download', 'draggable', 'enctype', 'enterkeyhint', 'face', 'for', 'headers', 'height', 'hidden', 'high', 'href', 'hreflang', 'id', 'inputmode', 'integrity', 'ismap', 'kind', 'label', 'lang', 'list', 'loading', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple', 'muted', 'name', 'noshade', 'novalidate', 'nowrap', 'open', 'optimum', 'pattern', 'placeholder', 'playsinline', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'rev', 'reversed', 'role', 'rows', 'rowspan', 'spellcheck', 'scope', 'selected', 'shape', 'size', 'sizes', 'span', 'srclang', 'start', 'src', 'srcset', 'step', 'style', 'summary', 'tabindex', 'title', 'translate', 'type', 'usemap', 'valign', 'value', 'width', 'xmlns']);

  var svg$1 = freeze(['accent-height', 'accumulate', 'additive', 'alignment-baseline', 'ascent', 'attributename', 'attributetype', 'azimuth', 'basefrequency', 'baseline-shift', 'begin', 'bias', 'by', 'class', 'clip', 'clippathunits', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cx', 'cy', 'd', 'dx', 'dy', 'diffuseconstant', 'direction', 'display', 'divisor', 'dur', 'edgemode', 'elevation', 'end', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'filterunits', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'fx', 'fy', 'g1', 'g2', 'glyph-name', 'glyphref', 'gradientunits', 'gradienttransform', 'height', 'href', 'id', 'image-rendering', 'in', 'in2', 'k', 'k1', 'k2', 'k3', 'k4', 'kerning', 'keypoints', 'keysplines', 'keytimes', 'lang', 'lengthadjust', 'letter-spacing', 'kernelmatrix', 'kernelunitlength', 'lighting-color', 'local', 'marker-end', 'marker-mid', 'marker-start', 'markerheight', 'markerunits', 'markerwidth', 'maskcontentunits', 'maskunits', 'max', 'mask', 'media', 'method', 'mode', 'min', 'name', 'numoctaves', 'offset', 'operator', 'opacity', 'order', 'orient', 'orientation', 'origin', 'overflow', 'paint-order', 'path', 'pathlength', 'patterncontentunits', 'patterntransform', 'patternunits', 'points', 'preservealpha', 'preserveaspectratio', 'primitiveunits', 'r', 'rx', 'ry', 'radius', 'refx', 'refy', 'repeatcount', 'repeatdur', 'restart', 'result', 'rotate', 'scale', 'seed', 'shape-rendering', 'specularconstant', 'specularexponent', 'spreadmethod', 'startoffset', 'stddeviation', 'stitchtiles', 'stop-color', 'stop-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke', 'stroke-width', 'style', 'surfacescale', 'systemlanguage', 'tabindex', 'targetx', 'targety', 'transform', 'text-anchor', 'text-decoration', 'text-rendering', 'textlength', 'type', 'u1', 'u2', 'unicode', 'values', 'viewbox', 'visibility', 'version', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'width', 'word-spacing', 'wrap', 'writing-mode', 'xchannelselector', 'ychannelselector', 'x', 'x1', 'x2', 'xmlns', 'y', 'y1', 'y2', 'z', 'zoomandpan']);

  var mathMl$1 = freeze(['accent', 'accentunder', 'align', 'bevelled', 'close', 'columnsalign', 'columnlines', 'columnspan', 'denomalign', 'depth', 'dir', 'display', 'displaystyle', 'encoding', 'fence', 'frame', 'height', 'href', 'id', 'largeop', 'length', 'linethickness', 'lspace', 'lquote', 'mathbackground', 'mathcolor', 'mathsize', 'mathvariant', 'maxsize', 'minsize', 'movablelimits', 'notation', 'numalign', 'open', 'rowalign', 'rowlines', 'rowspacing', 'rowspan', 'rspace', 'rquote', 'scriptlevel', 'scriptminsize', 'scriptsizemultiplier', 'selection', 'separator', 'separators', 'stretchy', 'subscriptshift', 'supscriptshift', 'symmetric', 'voffset', 'width', 'xmlns']);

  var xml = freeze(['xlink:href', 'xml:id', 'xlink:title', 'xml:space', 'xmlns:xlink']);

  // eslint-disable-next-line unicorn/better-regex
  var MUSTACHE_EXPR = seal(/\{\{[\s\S]*|[\s\S]*\}\}/gm); // Specify template detection regex for SAFE_FOR_TEMPLATES mode
  var ERB_EXPR = seal(/<%[\s\S]*|[\s\S]*%>/gm);
  var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]/); // eslint-disable-line no-useless-escape
  var ARIA_ATTR = seal(/^aria-[\-\w]+$/); // eslint-disable-line no-useless-escape
  var IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i // eslint-disable-line no-useless-escape
  );
  var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
  var ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g // eslint-disable-line no-control-regex
  );

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  function _toConsumableArray$1(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

  var getGlobal = function getGlobal() {
    return typeof window === 'undefined' ? null : window;
  };

  /**
   * Creates a no-op policy for internal use only.
   * Don't export this function outside this module!
   * @param {?TrustedTypePolicyFactory} trustedTypes The policy factory.
   * @param {Document} document The document object (to determine policy name suffix)
   * @return {?TrustedTypePolicy} The policy created (or null, if Trusted Types
   * are not supported).
   */
  var _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, document) {
    if ((typeof trustedTypes === 'undefined' ? 'undefined' : _typeof(trustedTypes)) !== 'object' || typeof trustedTypes.createPolicy !== 'function') {
      return null;
    }

    // Allow the callers to control the unique policy name
    // by adding a data-tt-policy-suffix to the script element with the DOMPurify.
    // Policy creation with duplicate names throws in Trusted Types.
    var suffix = null;
    var ATTR_NAME = 'data-tt-policy-suffix';
    if (document.currentScript && document.currentScript.hasAttribute(ATTR_NAME)) {
      suffix = document.currentScript.getAttribute(ATTR_NAME);
    }

    var policyName = 'dompurify' + (suffix ? '#' + suffix : '');

    try {
      return trustedTypes.createPolicy(policyName, {
        createHTML: function createHTML(html$$1) {
          return html$$1;
        }
      });
    } catch (_) {
      // Policy creation failed (most likely another DOMPurify script has
      // already run). Skip creating the policy, as this will only cause errors
      // if TT are enforced.
      console.warn('TrustedTypes policy ' + policyName + ' could not be created.');
      return null;
    }
  };

  function createDOMPurify() {
    var window = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getGlobal();

    var DOMPurify = function DOMPurify(root) {
      return createDOMPurify(root);
    };

    /**
     * Version label, exposed for easier checks
     * if DOMPurify is up to date or not
     */
    DOMPurify.version = '2.2.7';

    /**
     * Array of elements that DOMPurify removed during sanitation.
     * Empty if nothing was removed.
     */
    DOMPurify.removed = [];

    if (!window || !window.document || window.document.nodeType !== 9) {
      // Not running in a browser, provide a factory function
      // so that you can pass your own Window
      DOMPurify.isSupported = false;

      return DOMPurify;
    }

    var originalDocument = window.document;

    var document = window.document;
    var DocumentFragment = window.DocumentFragment,
        HTMLTemplateElement = window.HTMLTemplateElement,
        Node = window.Node,
        Element = window.Element,
        NodeFilter = window.NodeFilter,
        _window$NamedNodeMap = window.NamedNodeMap,
        NamedNodeMap = _window$NamedNodeMap === undefined ? window.NamedNodeMap || window.MozNamedAttrMap : _window$NamedNodeMap,
        Text = window.Text,
        Comment = window.Comment,
        DOMParser = window.DOMParser,
        trustedTypes = window.trustedTypes;


    var ElementPrototype = Element.prototype;

    var cloneNode = lookupGetter(ElementPrototype, 'cloneNode');
    var getNextSibling = lookupGetter(ElementPrototype, 'nextSibling');
    var getChildNodes = lookupGetter(ElementPrototype, 'childNodes');
    var getParentNode = lookupGetter(ElementPrototype, 'parentNode');

    // As per issue #47, the web-components registry is inherited by a
    // new document created via createHTMLDocument. As per the spec
    // (http://w3c.github.io/webcomponents/spec/custom/#creating-and-passing-registries)
    // a new empty registry is used when creating a template contents owner
    // document, so we use that as our parent document to ensure nothing
    // is inherited.
    if (typeof HTMLTemplateElement === 'function') {
      var template = document.createElement('template');
      if (template.content && template.content.ownerDocument) {
        document = template.content.ownerDocument;
      }
    }

    var trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, originalDocument);
    var emptyHTML = trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML('') : '';

    var _document = document,
        implementation = _document.implementation,
        createNodeIterator = _document.createNodeIterator,
        getElementsByTagName = _document.getElementsByTagName,
        createDocumentFragment = _document.createDocumentFragment;
    var importNode = originalDocument.importNode;


    var documentMode = {};
    try {
      documentMode = clone(document).documentMode ? document.documentMode : {};
    } catch (_) {}

    var hooks = {};

    /**
     * Expose whether this browser supports running the full DOMPurify.
     */
    DOMPurify.isSupported = typeof getParentNode === 'function' && implementation && typeof implementation.createHTMLDocument !== 'undefined' && documentMode !== 9;

    var MUSTACHE_EXPR$$1 = MUSTACHE_EXPR,
        ERB_EXPR$$1 = ERB_EXPR,
        DATA_ATTR$$1 = DATA_ATTR,
        ARIA_ATTR$$1 = ARIA_ATTR,
        IS_SCRIPT_OR_DATA$$1 = IS_SCRIPT_OR_DATA,
        ATTR_WHITESPACE$$1 = ATTR_WHITESPACE;
    var IS_ALLOWED_URI$$1 = IS_ALLOWED_URI;

    /**
     * We consider the elements and attributes below to be safe. Ideally
     * don't add any new ones but feel free to remove unwanted ones.
     */

    /* allowed element names */

    var ALLOWED_TAGS = null;
    var DEFAULT_ALLOWED_TAGS = addToSet({}, [].concat(_toConsumableArray$1(html), _toConsumableArray$1(svg), _toConsumableArray$1(svgFilters), _toConsumableArray$1(mathMl), _toConsumableArray$1(text)));

    /* Allowed attribute names */
    var ALLOWED_ATTR = null;
    var DEFAULT_ALLOWED_ATTR = addToSet({}, [].concat(_toConsumableArray$1(html$1), _toConsumableArray$1(svg$1), _toConsumableArray$1(mathMl$1), _toConsumableArray$1(xml)));

    /* Explicitly forbidden tags (overrides ALLOWED_TAGS/ADD_TAGS) */
    var FORBID_TAGS = null;

    /* Explicitly forbidden attributes (overrides ALLOWED_ATTR/ADD_ATTR) */
    var FORBID_ATTR = null;

    /* Decide if ARIA attributes are okay */
    var ALLOW_ARIA_ATTR = true;

    /* Decide if custom data attributes are okay */
    var ALLOW_DATA_ATTR = true;

    /* Decide if unknown protocols are okay */
    var ALLOW_UNKNOWN_PROTOCOLS = false;

    /* Output should be safe for common template engines.
     * This means, DOMPurify removes data attributes, mustaches and ERB
     */
    var SAFE_FOR_TEMPLATES = false;

    /* Decide if document with <html>... should be returned */
    var WHOLE_DOCUMENT = false;

    /* Track whether config is already set on this instance of DOMPurify. */
    var SET_CONFIG = false;

    /* Decide if all elements (e.g. style, script) must be children of
     * document.body. By default, browsers might move them to document.head */
    var FORCE_BODY = false;

    /* Decide if a DOM `HTMLBodyElement` should be returned, instead of a html
     * string (or a TrustedHTML object if Trusted Types are supported).
     * If `WHOLE_DOCUMENT` is enabled a `HTMLHtmlElement` will be returned instead
     */
    var RETURN_DOM = false;

    /* Decide if a DOM `DocumentFragment` should be returned, instead of a html
     * string  (or a TrustedHTML object if Trusted Types are supported) */
    var RETURN_DOM_FRAGMENT = false;

    /* If `RETURN_DOM` or `RETURN_DOM_FRAGMENT` is enabled, decide if the returned DOM
     * `Node` is imported into the current `Document`. If this flag is not enabled the
     * `Node` will belong (its ownerDocument) to a fresh `HTMLDocument`, created by
     * DOMPurify.
     *
     * This defaults to `true` starting DOMPurify 2.2.0. Note that setting it to `false`
     * might cause XSS from attacks hidden in closed shadowroots in case the browser
     * supports Declarative Shadow: DOM https://web.dev/declarative-shadow-dom/
     */
    var RETURN_DOM_IMPORT = true;

    /* Try to return a Trusted Type object instead of a string, return a string in
     * case Trusted Types are not supported  */
    var RETURN_TRUSTED_TYPE = false;

    /* Output should be free from DOM clobbering attacks? */
    var SANITIZE_DOM = true;

    /* Keep element content when removing element? */
    var KEEP_CONTENT = true;

    /* If a `Node` is passed to sanitize(), then performs sanitization in-place instead
     * of importing it into a new Document and returning a sanitized copy */
    var IN_PLACE = false;

    /* Allow usage of profiles like html, svg and mathMl */
    var USE_PROFILES = {};

    /* Tags to ignore content of when KEEP_CONTENT is true */
    var FORBID_CONTENTS = addToSet({}, ['annotation-xml', 'audio', 'colgroup', 'desc', 'foreignobject', 'head', 'iframe', 'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'noembed', 'noframes', 'noscript', 'plaintext', 'script', 'style', 'svg', 'template', 'thead', 'title', 'video', 'xmp']);

    /* Tags that are safe for data: URIs */
    var DATA_URI_TAGS = null;
    var DEFAULT_DATA_URI_TAGS = addToSet({}, ['audio', 'video', 'img', 'source', 'image', 'track']);

    /* Attributes safe for values like "javascript:" */
    var URI_SAFE_ATTRIBUTES = null;
    var DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ['alt', 'class', 'for', 'id', 'label', 'name', 'pattern', 'placeholder', 'summary', 'title', 'value', 'style', 'xmlns']);

    /* Keep a reference to config to pass to hooks */
    var CONFIG = null;

    /* Ideally, do not touch anything below this line */
    /* ______________________________________________ */

    var formElement = document.createElement('form');

    /**
     * _parseConfig
     *
     * @param  {Object} cfg optional config literal
     */
    // eslint-disable-next-line complexity
    var _parseConfig = function _parseConfig(cfg) {
      if (CONFIG && CONFIG === cfg) {
        return;
      }

      /* Shield configuration object from tampering */
      if (!cfg || (typeof cfg === 'undefined' ? 'undefined' : _typeof(cfg)) !== 'object') {
        cfg = {};
      }

      /* Shield configuration object from prototype pollution */
      cfg = clone(cfg);

      /* Set configuration parameters */
      ALLOWED_TAGS = 'ALLOWED_TAGS' in cfg ? addToSet({}, cfg.ALLOWED_TAGS) : DEFAULT_ALLOWED_TAGS;
      ALLOWED_ATTR = 'ALLOWED_ATTR' in cfg ? addToSet({}, cfg.ALLOWED_ATTR) : DEFAULT_ALLOWED_ATTR;
      URI_SAFE_ATTRIBUTES = 'ADD_URI_SAFE_ATTR' in cfg ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR) : DEFAULT_URI_SAFE_ATTRIBUTES;
      DATA_URI_TAGS = 'ADD_DATA_URI_TAGS' in cfg ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS) : DEFAULT_DATA_URI_TAGS;
      FORBID_TAGS = 'FORBID_TAGS' in cfg ? addToSet({}, cfg.FORBID_TAGS) : {};
      FORBID_ATTR = 'FORBID_ATTR' in cfg ? addToSet({}, cfg.FORBID_ATTR) : {};
      USE_PROFILES = 'USE_PROFILES' in cfg ? cfg.USE_PROFILES : false;
      ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false; // Default true
      ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false; // Default true
      ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false; // Default false
      SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false; // Default false
      WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false; // Default false
      RETURN_DOM = cfg.RETURN_DOM || false; // Default false
      RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false; // Default false
      RETURN_DOM_IMPORT = cfg.RETURN_DOM_IMPORT !== false; // Default true
      RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false; // Default false
      FORCE_BODY = cfg.FORCE_BODY || false; // Default false
      SANITIZE_DOM = cfg.SANITIZE_DOM !== false; // Default true
      KEEP_CONTENT = cfg.KEEP_CONTENT !== false; // Default true
      IN_PLACE = cfg.IN_PLACE || false; // Default false
      IS_ALLOWED_URI$$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI$$1;
      if (SAFE_FOR_TEMPLATES) {
        ALLOW_DATA_ATTR = false;
      }

      if (RETURN_DOM_FRAGMENT) {
        RETURN_DOM = true;
      }

      /* Parse profile info */
      if (USE_PROFILES) {
        ALLOWED_TAGS = addToSet({}, [].concat(_toConsumableArray$1(text)));
        ALLOWED_ATTR = [];
        if (USE_PROFILES.html === true) {
          addToSet(ALLOWED_TAGS, html);
          addToSet(ALLOWED_ATTR, html$1);
        }

        if (USE_PROFILES.svg === true) {
          addToSet(ALLOWED_TAGS, svg);
          addToSet(ALLOWED_ATTR, svg$1);
          addToSet(ALLOWED_ATTR, xml);
        }

        if (USE_PROFILES.svgFilters === true) {
          addToSet(ALLOWED_TAGS, svgFilters);
          addToSet(ALLOWED_ATTR, svg$1);
          addToSet(ALLOWED_ATTR, xml);
        }

        if (USE_PROFILES.mathMl === true) {
          addToSet(ALLOWED_TAGS, mathMl);
          addToSet(ALLOWED_ATTR, mathMl$1);
          addToSet(ALLOWED_ATTR, xml);
        }
      }

      /* Merge configuration parameters */
      if (cfg.ADD_TAGS) {
        if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
          ALLOWED_TAGS = clone(ALLOWED_TAGS);
        }

        addToSet(ALLOWED_TAGS, cfg.ADD_TAGS);
      }

      if (cfg.ADD_ATTR) {
        if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
          ALLOWED_ATTR = clone(ALLOWED_ATTR);
        }

        addToSet(ALLOWED_ATTR, cfg.ADD_ATTR);
      }

      if (cfg.ADD_URI_SAFE_ATTR) {
        addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR);
      }

      /* Add #text in case KEEP_CONTENT is set to true */
      if (KEEP_CONTENT) {
        ALLOWED_TAGS['#text'] = true;
      }

      /* Add html, head and body to ALLOWED_TAGS in case WHOLE_DOCUMENT is true */
      if (WHOLE_DOCUMENT) {
        addToSet(ALLOWED_TAGS, ['html', 'head', 'body']);
      }

      /* Add tbody to ALLOWED_TAGS in case tables are permitted, see #286, #365 */
      if (ALLOWED_TAGS.table) {
        addToSet(ALLOWED_TAGS, ['tbody']);
        delete FORBID_TAGS.tbody;
      }

      // Prevent further manipulation of configuration.
      // Not available in IE8, Safari 5, etc.
      if (freeze) {
        freeze(cfg);
      }

      CONFIG = cfg;
    };

    var MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ['mi', 'mo', 'mn', 'ms', 'mtext']);

    var HTML_INTEGRATION_POINTS = addToSet({}, ['foreignobject', 'desc', 'title', 'annotation-xml']);

    /* Keep track of all possible SVG and MathML tags
     * so that we can perform the namespace checks
     * correctly. */
    var ALL_SVG_TAGS = addToSet({}, svg);
    addToSet(ALL_SVG_TAGS, svgFilters);
    addToSet(ALL_SVG_TAGS, svgDisallowed);

    var ALL_MATHML_TAGS = addToSet({}, mathMl);
    addToSet(ALL_MATHML_TAGS, mathMlDisallowed);

    var MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
    var SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
    var HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

    /**
     *
     *
     * @param  {Element} element a DOM element whose namespace is being checked
     * @returns {boolean} Return false if the element has a
     *  namespace that a spec-compliant parser would never
     *  return. Return true otherwise.
     */
    var _checkValidNamespace = function _checkValidNamespace(element) {
      var parent = getParentNode(element);

      // In JSDOM, if we're inside shadow DOM, then parentNode
      // can be null. We just simulate parent in this case.
      if (!parent || !parent.tagName) {
        parent = {
          namespaceURI: HTML_NAMESPACE,
          tagName: 'template'
        };
      }

      var tagName = stringToLowerCase(element.tagName);
      var parentTagName = stringToLowerCase(parent.tagName);

      if (element.namespaceURI === SVG_NAMESPACE) {
        // The only way to switch from HTML namespace to SVG
        // is via <svg>. If it happens via any other tag, then
        // it should be killed.
        if (parent.namespaceURI === HTML_NAMESPACE) {
          return tagName === 'svg';
        }

        // The only way to switch from MathML to SVG is via
        // svg if parent is either <annotation-xml> or MathML
        // text integration points.
        if (parent.namespaceURI === MATHML_NAMESPACE) {
          return tagName === 'svg' && (parentTagName === 'annotation-xml' || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
        }

        // We only allow elements that are defined in SVG
        // spec. All others are disallowed in SVG namespace.
        return Boolean(ALL_SVG_TAGS[tagName]);
      }

      if (element.namespaceURI === MATHML_NAMESPACE) {
        // The only way to switch from HTML namespace to MathML
        // is via <math>. If it happens via any other tag, then
        // it should be killed.
        if (parent.namespaceURI === HTML_NAMESPACE) {
          return tagName === 'math';
        }

        // The only way to switch from SVG to MathML is via
        // <math> and HTML integration points
        if (parent.namespaceURI === SVG_NAMESPACE) {
          return tagName === 'math' && HTML_INTEGRATION_POINTS[parentTagName];
        }

        // We only allow elements that are defined in MathML
        // spec. All others are disallowed in MathML namespace.
        return Boolean(ALL_MATHML_TAGS[tagName]);
      }

      if (element.namespaceURI === HTML_NAMESPACE) {
        // The only way to switch from SVG to HTML is via
        // HTML integration points, and from MathML to HTML
        // is via MathML text integration points
        if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
          return false;
        }

        if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
          return false;
        }

        // Certain elements are allowed in both SVG and HTML
        // namespace. We need to specify them explicitly
        // so that they don't get erronously deleted from
        // HTML namespace.
        var commonSvgAndHTMLElements = addToSet({}, ['title', 'style', 'font', 'a', 'script']);

        // We disallow tags that are specific for MathML
        // or SVG and should never appear in HTML namespace
        return !ALL_MATHML_TAGS[tagName] && (commonSvgAndHTMLElements[tagName] || !ALL_SVG_TAGS[tagName]);
      }

      // The code should never reach this place (this means
      // that the element somehow got namespace that is not
      // HTML, SVG or MathML). Return false just in case.
      return false;
    };

    /**
     * _forceRemove
     *
     * @param  {Node} node a DOM node
     */
    var _forceRemove = function _forceRemove(node) {
      arrayPush(DOMPurify.removed, { element: node });
      try {
        node.parentNode.removeChild(node);
      } catch (_) {
        try {
          node.outerHTML = emptyHTML;
        } catch (_) {
          node.remove();
        }
      }
    };

    /**
     * _removeAttribute
     *
     * @param  {String} name an Attribute name
     * @param  {Node} node a DOM node
     */
    var _removeAttribute = function _removeAttribute(name, node) {
      try {
        arrayPush(DOMPurify.removed, {
          attribute: node.getAttributeNode(name),
          from: node
        });
      } catch (_) {
        arrayPush(DOMPurify.removed, {
          attribute: null,
          from: node
        });
      }

      node.removeAttribute(name);

      // We void attribute values for unremovable "is"" attributes
      if (name === 'is' && !ALLOWED_ATTR[name]) {
        if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
          try {
            _forceRemove(node);
          } catch (_) {}
        } else {
          try {
            node.setAttribute(name, '');
          } catch (_) {}
        }
      }
    };

    /**
     * _initDocument
     *
     * @param  {String} dirty a string of dirty markup
     * @return {Document} a DOM, filled with the dirty markup
     */
    var _initDocument = function _initDocument(dirty) {
      /* Create a HTML document */
      var doc = void 0;
      var leadingWhitespace = void 0;

      if (FORCE_BODY) {
        dirty = '<remove></remove>' + dirty;
      } else {
        /* If FORCE_BODY isn't used, leading whitespace needs to be preserved manually */
        var matches = stringMatch(dirty, /^[\r\n\t ]+/);
        leadingWhitespace = matches && matches[0];
      }

      var dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
      /* Use the DOMParser API by default, fallback later if needs be */
      try {
        doc = new DOMParser().parseFromString(dirtyPayload, 'text/html');
      } catch (_) {}

      /* Use createHTMLDocument in case DOMParser is not available */
      if (!doc || !doc.documentElement) {
        doc = implementation.createHTMLDocument('');
        var _doc = doc,
            body = _doc.body;

        body.parentNode.removeChild(body.parentNode.firstElementChild);
        body.outerHTML = dirtyPayload;
      }

      if (dirty && leadingWhitespace) {
        doc.body.insertBefore(document.createTextNode(leadingWhitespace), doc.body.childNodes[0] || null);
      }

      /* Work on whole document or just its body */
      return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? 'html' : 'body')[0];
    };

    /**
     * _createIterator
     *
     * @param  {Document} root document/fragment to create iterator for
     * @return {Iterator} iterator instance
     */
    var _createIterator = function _createIterator(root) {
      return createNodeIterator.call(root.ownerDocument || root, root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT, function () {
        return NodeFilter.FILTER_ACCEPT;
      }, false);
    };

    /**
     * _isClobbered
     *
     * @param  {Node} elm element to check for clobbering attacks
     * @return {Boolean} true if clobbered, false if safe
     */
    var _isClobbered = function _isClobbered(elm) {
      if (elm instanceof Text || elm instanceof Comment) {
        return false;
      }

      if (typeof elm.nodeName !== 'string' || typeof elm.textContent !== 'string' || typeof elm.removeChild !== 'function' || !(elm.attributes instanceof NamedNodeMap) || typeof elm.removeAttribute !== 'function' || typeof elm.setAttribute !== 'function' || typeof elm.namespaceURI !== 'string' || typeof elm.insertBefore !== 'function') {
        return true;
      }

      return false;
    };

    /**
     * _isNode
     *
     * @param  {Node} obj object to check whether it's a DOM node
     * @return {Boolean} true is object is a DOM node
     */
    var _isNode = function _isNode(object) {
      return (typeof Node === 'undefined' ? 'undefined' : _typeof(Node)) === 'object' ? object instanceof Node : object && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && typeof object.nodeType === 'number' && typeof object.nodeName === 'string';
    };

    /**
     * _executeHook
     * Execute user configurable hooks
     *
     * @param  {String} entryPoint  Name of the hook's entry point
     * @param  {Node} currentNode node to work on with the hook
     * @param  {Object} data additional hook parameters
     */
    var _executeHook = function _executeHook(entryPoint, currentNode, data) {
      if (!hooks[entryPoint]) {
        return;
      }

      arrayForEach(hooks[entryPoint], function (hook) {
        hook.call(DOMPurify, currentNode, data, CONFIG);
      });
    };

    /**
     * _sanitizeElements
     *
     * @protect nodeName
     * @protect textContent
     * @protect removeChild
     *
     * @param   {Node} currentNode to check for permission to exist
     * @return  {Boolean} true if node was killed, false if left alive
     */
    var _sanitizeElements = function _sanitizeElements(currentNode) {
      var content = void 0;

      /* Execute a hook if present */
      _executeHook('beforeSanitizeElements', currentNode, null);

      /* Check if element is clobbered or can clobber */
      if (_isClobbered(currentNode)) {
        _forceRemove(currentNode);
        return true;
      }

      /* Check if tagname contains Unicode */
      if (stringMatch(currentNode.nodeName, /[\u0080-\uFFFF]/)) {
        _forceRemove(currentNode);
        return true;
      }

      /* Now let's check the element's type and name */
      var tagName = stringToLowerCase(currentNode.nodeName);

      /* Execute a hook if present */
      _executeHook('uponSanitizeElement', currentNode, {
        tagName: tagName,
        allowedTags: ALLOWED_TAGS
      });

      /* Detect mXSS attempts abusing namespace confusion */
      if (!_isNode(currentNode.firstElementChild) && (!_isNode(currentNode.content) || !_isNode(currentNode.content.firstElementChild)) && regExpTest(/<[/\w]/g, currentNode.innerHTML) && regExpTest(/<[/\w]/g, currentNode.textContent)) {
        _forceRemove(currentNode);
        return true;
      }

      /* Remove element if anything forbids its presence */
      if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
        /* Keep content except for bad-listed elements */
        if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
          var parentNode = getParentNode(currentNode);
          var childNodes = getChildNodes(currentNode);

          if (childNodes && parentNode) {
            var childCount = childNodes.length;

            for (var i = childCount - 1; i >= 0; --i) {
              parentNode.insertBefore(cloneNode(childNodes[i], true), getNextSibling(currentNode));
            }
          }
        }

        _forceRemove(currentNode);
        return true;
      }

      /* Check whether element has a valid namespace */
      if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
        _forceRemove(currentNode);
        return true;
      }

      if ((tagName === 'noscript' || tagName === 'noembed') && regExpTest(/<\/no(script|embed)/i, currentNode.innerHTML)) {
        _forceRemove(currentNode);
        return true;
      }

      /* Sanitize element content to be template-safe */
      if (SAFE_FOR_TEMPLATES && currentNode.nodeType === 3) {
        /* Get the element's text content */
        content = currentNode.textContent;
        content = stringReplace(content, MUSTACHE_EXPR$$1, ' ');
        content = stringReplace(content, ERB_EXPR$$1, ' ');
        if (currentNode.textContent !== content) {
          arrayPush(DOMPurify.removed, { element: currentNode.cloneNode() });
          currentNode.textContent = content;
        }
      }

      /* Execute a hook if present */
      _executeHook('afterSanitizeElements', currentNode, null);

      return false;
    };

    /**
     * _isValidAttribute
     *
     * @param  {string} lcTag Lowercase tag name of containing element.
     * @param  {string} lcName Lowercase attribute name.
     * @param  {string} value Attribute value.
     * @return {Boolean} Returns true if `value` is valid, otherwise false.
     */
    // eslint-disable-next-line complexity
    var _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
      /* Make sure attribute cannot clobber */
      if (SANITIZE_DOM && (lcName === 'id' || lcName === 'name') && (value in document || value in formElement)) {
        return false;
      }

      /* Allow valid data-* attributes: At least one character after "-"
          (https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes)
          XML-compatible (https://html.spec.whatwg.org/multipage/infrastructure.html#xml-compatible and http://www.w3.org/TR/xml/#d0e804)
          We don't need to check the value; it's always URI safe. */
      if (ALLOW_DATA_ATTR && regExpTest(DATA_ATTR$$1, lcName)) ; else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$$1, lcName)) ; else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
        return false;

        /* Check value is safe. First, is attr inert? If so, is safe */
      } else if (URI_SAFE_ATTRIBUTES[lcName]) ; else if (regExpTest(IS_ALLOWED_URI$$1, stringReplace(value, ATTR_WHITESPACE$$1, ''))) ; else if ((lcName === 'src' || lcName === 'xlink:href' || lcName === 'href') && lcTag !== 'script' && stringIndexOf(value, 'data:') === 0 && DATA_URI_TAGS[lcTag]) ; else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$$1, stringReplace(value, ATTR_WHITESPACE$$1, ''))) ; else if (!value) ; else {
        return false;
      }

      return true;
    };

    /**
     * _sanitizeAttributes
     *
     * @protect attributes
     * @protect nodeName
     * @protect removeAttribute
     * @protect setAttribute
     *
     * @param  {Node} currentNode to sanitize
     */
    var _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
      var attr = void 0;
      var value = void 0;
      var lcName = void 0;
      var l = void 0;
      /* Execute a hook if present */
      _executeHook('beforeSanitizeAttributes', currentNode, null);

      var attributes = currentNode.attributes;

      /* Check if we have attributes; if not we might have a text node */

      if (!attributes) {
        return;
      }

      var hookEvent = {
        attrName: '',
        attrValue: '',
        keepAttr: true,
        allowedAttributes: ALLOWED_ATTR
      };
      l = attributes.length;

      /* Go backwards over all attributes; safely remove bad ones */
      while (l--) {
        attr = attributes[l];
        var _attr = attr,
            name = _attr.name,
            namespaceURI = _attr.namespaceURI;

        value = stringTrim(attr.value);
        lcName = stringToLowerCase(name);

        /* Execute a hook if present */
        hookEvent.attrName = lcName;
        hookEvent.attrValue = value;
        hookEvent.keepAttr = true;
        hookEvent.forceKeepAttr = undefined; // Allows developers to see this is a property they can set
        _executeHook('uponSanitizeAttribute', currentNode, hookEvent);
        value = hookEvent.attrValue;
        /* Did the hooks approve of the attribute? */
        if (hookEvent.forceKeepAttr) {
          continue;
        }

        /* Remove attribute */
        _removeAttribute(name, currentNode);

        /* Did the hooks approve of the attribute? */
        if (!hookEvent.keepAttr) {
          continue;
        }

        /* Work around a security issue in jQuery 3.0 */
        if (regExpTest(/\/>/i, value)) {
          _removeAttribute(name, currentNode);
          continue;
        }

        /* Sanitize attribute content to be template-safe */
        if (SAFE_FOR_TEMPLATES) {
          value = stringReplace(value, MUSTACHE_EXPR$$1, ' ');
          value = stringReplace(value, ERB_EXPR$$1, ' ');
        }

        /* Is `value` valid for this attribute? */
        var lcTag = currentNode.nodeName.toLowerCase();
        if (!_isValidAttribute(lcTag, lcName, value)) {
          continue;
        }

        /* Handle invalid data-* attribute set by try-catching it */
        try {
          if (namespaceURI) {
            currentNode.setAttributeNS(namespaceURI, name, value);
          } else {
            /* Fallback to setAttribute() for browser-unrecognized namespaces e.g. "x-schema". */
            currentNode.setAttribute(name, value);
          }

          arrayPop(DOMPurify.removed);
        } catch (_) {}
      }

      /* Execute a hook if present */
      _executeHook('afterSanitizeAttributes', currentNode, null);
    };

    /**
     * _sanitizeShadowDOM
     *
     * @param  {DocumentFragment} fragment to iterate over recursively
     */
    var _sanitizeShadowDOM = function _sanitizeShadowDOM(fragment) {
      var shadowNode = void 0;
      var shadowIterator = _createIterator(fragment);

      /* Execute a hook if present */
      _executeHook('beforeSanitizeShadowDOM', fragment, null);

      while (shadowNode = shadowIterator.nextNode()) {
        /* Execute a hook if present */
        _executeHook('uponSanitizeShadowNode', shadowNode, null);

        /* Sanitize tags and elements */
        if (_sanitizeElements(shadowNode)) {
          continue;
        }

        /* Deep shadow DOM detected */
        if (shadowNode.content instanceof DocumentFragment) {
          _sanitizeShadowDOM(shadowNode.content);
        }

        /* Check attributes, sanitize if necessary */
        _sanitizeAttributes(shadowNode);
      }

      /* Execute a hook if present */
      _executeHook('afterSanitizeShadowDOM', fragment, null);
    };

    /**
     * Sanitize
     * Public method providing core sanitation functionality
     *
     * @param {String|Node} dirty string or DOM node
     * @param {Object} configuration object
     */
    // eslint-disable-next-line complexity
    DOMPurify.sanitize = function (dirty, cfg) {
      var body = void 0;
      var importedNode = void 0;
      var currentNode = void 0;
      var oldNode = void 0;
      var returnNode = void 0;
      /* Make sure we have a string to sanitize.
        DO NOT return early, as this will return the wrong type if
        the user has requested a DOM object rather than a string */
      if (!dirty) {
        dirty = '<!-->';
      }

      /* Stringify, in case dirty is an object */
      if (typeof dirty !== 'string' && !_isNode(dirty)) {
        // eslint-disable-next-line no-negated-condition
        if (typeof dirty.toString !== 'function') {
          throw typeErrorCreate('toString is not a function');
        } else {
          dirty = dirty.toString();
          if (typeof dirty !== 'string') {
            throw typeErrorCreate('dirty is not a string, aborting');
          }
        }
      }

      /* Check we can run. Otherwise fall back or ignore */
      if (!DOMPurify.isSupported) {
        if (_typeof(window.toStaticHTML) === 'object' || typeof window.toStaticHTML === 'function') {
          if (typeof dirty === 'string') {
            return window.toStaticHTML(dirty);
          }

          if (_isNode(dirty)) {
            return window.toStaticHTML(dirty.outerHTML);
          }
        }

        return dirty;
      }

      /* Assign config vars */
      if (!SET_CONFIG) {
        _parseConfig(cfg);
      }

      /* Clean up removed elements */
      DOMPurify.removed = [];

      /* Check if dirty is correctly typed for IN_PLACE */
      if (typeof dirty === 'string') {
        IN_PLACE = false;
      }

      if (IN_PLACE) ; else if (dirty instanceof Node) {
        /* If dirty is a DOM element, append to an empty document to avoid
           elements being stripped by the parser */
        body = _initDocument('<!---->');
        importedNode = body.ownerDocument.importNode(dirty, true);
        if (importedNode.nodeType === 1 && importedNode.nodeName === 'BODY') {
          /* Node is already a body, use as is */
          body = importedNode;
        } else if (importedNode.nodeName === 'HTML') {
          body = importedNode;
        } else {
          // eslint-disable-next-line unicorn/prefer-node-append
          body.appendChild(importedNode);
        }
      } else {
        /* Exit directly if we have nothing to do */
        if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT &&
        // eslint-disable-next-line unicorn/prefer-includes
        dirty.indexOf('<') === -1) {
          return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
        }

        /* Initialize the document to work on */
        body = _initDocument(dirty);

        /* Check we have a DOM node from the data */
        if (!body) {
          return RETURN_DOM ? null : emptyHTML;
        }
      }

      /* Remove first element node (ours) if FORCE_BODY is set */
      if (body && FORCE_BODY) {
        _forceRemove(body.firstChild);
      }

      /* Get node iterator */
      var nodeIterator = _createIterator(IN_PLACE ? dirty : body);

      /* Now start iterating over the created document */
      while (currentNode = nodeIterator.nextNode()) {
        /* Fix IE's strange behavior with manipulated textNodes #89 */
        if (currentNode.nodeType === 3 && currentNode === oldNode) {
          continue;
        }

        /* Sanitize tags and elements */
        if (_sanitizeElements(currentNode)) {
          continue;
        }

        /* Shadow DOM detected, sanitize it */
        if (currentNode.content instanceof DocumentFragment) {
          _sanitizeShadowDOM(currentNode.content);
        }

        /* Check attributes, sanitize if necessary */
        _sanitizeAttributes(currentNode);

        oldNode = currentNode;
      }

      oldNode = null;

      /* If we sanitized `dirty` in-place, return it. */
      if (IN_PLACE) {
        return dirty;
      }

      /* Return sanitized string or DOM */
      if (RETURN_DOM) {
        if (RETURN_DOM_FRAGMENT) {
          returnNode = createDocumentFragment.call(body.ownerDocument);

          while (body.firstChild) {
            // eslint-disable-next-line unicorn/prefer-node-append
            returnNode.appendChild(body.firstChild);
          }
        } else {
          returnNode = body;
        }

        if (RETURN_DOM_IMPORT) {
          /*
            AdoptNode() is not used because internal state is not reset
            (e.g. the past names map of a HTMLFormElement), this is safe
            in theory but we would rather not risk another attack vector.
            The state that is cloned by importNode() is explicitly defined
            by the specs.
          */
          returnNode = importNode.call(originalDocument, returnNode, true);
        }

        return returnNode;
      }

      var serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;

      /* Sanitize final string template-safe */
      if (SAFE_FOR_TEMPLATES) {
        serializedHTML = stringReplace(serializedHTML, MUSTACHE_EXPR$$1, ' ');
        serializedHTML = stringReplace(serializedHTML, ERB_EXPR$$1, ' ');
      }

      return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
    };

    /**
     * Public method to set the configuration once
     * setConfig
     *
     * @param {Object} cfg configuration object
     */
    DOMPurify.setConfig = function (cfg) {
      _parseConfig(cfg);
      SET_CONFIG = true;
    };

    /**
     * Public method to remove the configuration
     * clearConfig
     *
     */
    DOMPurify.clearConfig = function () {
      CONFIG = null;
      SET_CONFIG = false;
    };

    /**
     * Public method to check if an attribute value is valid.
     * Uses last set config, if any. Otherwise, uses config defaults.
     * isValidAttribute
     *
     * @param  {string} tag Tag name of containing element.
     * @param  {string} attr Attribute name.
     * @param  {string} value Attribute value.
     * @return {Boolean} Returns true if `value` is valid. Otherwise, returns false.
     */
    DOMPurify.isValidAttribute = function (tag, attr, value) {
      /* Initialize shared config vars if necessary. */
      if (!CONFIG) {
        _parseConfig({});
      }

      var lcTag = stringToLowerCase(tag);
      var lcName = stringToLowerCase(attr);
      return _isValidAttribute(lcTag, lcName, value);
    };

    /**
     * AddHook
     * Public method to add DOMPurify hooks
     *
     * @param {String} entryPoint entry point for the hook to add
     * @param {Function} hookFunction function to execute
     */
    DOMPurify.addHook = function (entryPoint, hookFunction) {
      if (typeof hookFunction !== 'function') {
        return;
      }

      hooks[entryPoint] = hooks[entryPoint] || [];
      arrayPush(hooks[entryPoint], hookFunction);
    };

    /**
     * RemoveHook
     * Public method to remove a DOMPurify hook at a given entryPoint
     * (pops it from the stack of hooks if more are present)
     *
     * @param {String} entryPoint entry point for the hook to remove
     */
    DOMPurify.removeHook = function (entryPoint) {
      if (hooks[entryPoint]) {
        arrayPop(hooks[entryPoint]);
      }
    };

    /**
     * RemoveHooks
     * Public method to remove all DOMPurify hooks at a given entryPoint
     *
     * @param  {String} entryPoint entry point for the hooks to remove
     */
    DOMPurify.removeHooks = function (entryPoint) {
      if (hooks[entryPoint]) {
        hooks[entryPoint] = [];
      }
    };

    /**
     * RemoveAllHooks
     * Public method to remove all DOMPurify hooks
     *
     */
    DOMPurify.removeAllHooks = function () {
      hooks = {};
    };

    return DOMPurify;
  }

  var purify = createDOMPurify();

  return purify;

}));
//# sourceMappingURL=purify.js.map


/***/ }),

/***/ "./node_modules/dot-case/dist.es2015/index.js":
/*!****************************************************!*\
  !*** ./node_modules/dot-case/dist.es2015/index.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "dotCase": () => (/* binding */ dotCase)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var no_case__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! no-case */ "./node_modules/no-case/dist.es2015/index.js");


function dotCase(input, options) {
    if (options === void 0) { options = {}; }
    return (0,no_case__WEBPACK_IMPORTED_MODULE_0__.noCase)(input, (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({ delimiter: "." }, options));
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/eventemitter3/index.js":
/*!*********************************************!*\
  !*** ./node_modules/eventemitter3/index.js ***!
  \*********************************************/
/***/ ((module) => {

"use strict";


var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if (true) {
  module.exports = EventEmitter;
}


/***/ }),

/***/ "./node_modules/inherits/inherits_browser.js":
/*!***************************************************!*\
  !*** ./node_modules/inherits/inherits_browser.js ***!
  \***************************************************/
/***/ ((module) => {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}


/***/ }),

/***/ "./node_modules/lower-case/dist.es2015/index.js":
/*!******************************************************!*\
  !*** ./node_modules/lower-case/dist.es2015/index.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "localeLowerCase": () => (/* binding */ localeLowerCase),
/* harmony export */   "lowerCase": () => (/* binding */ lowerCase)
/* harmony export */ });
/**
 * Source: ftp://ftp.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
 */
var SUPPORTED_LOCALE = {
    tr: {
        regexp: /\u0130|\u0049|\u0049\u0307/g,
        map: {
            İ: "\u0069",
            I: "\u0131",
            İ: "\u0069",
        },
    },
    az: {
        regexp: /\u0130/g,
        map: {
            İ: "\u0069",
            I: "\u0131",
            İ: "\u0069",
        },
    },
    lt: {
        regexp: /\u0049|\u004A|\u012E|\u00CC|\u00CD|\u0128/g,
        map: {
            I: "\u0069\u0307",
            J: "\u006A\u0307",
            Į: "\u012F\u0307",
            Ì: "\u0069\u0307\u0300",
            Í: "\u0069\u0307\u0301",
            Ĩ: "\u0069\u0307\u0303",
        },
    },
};
/**
 * Localized lower case.
 */
function localeLowerCase(str, locale) {
    var lang = SUPPORTED_LOCALE[locale.toLowerCase()];
    if (lang)
        return lowerCase(str.replace(lang.regexp, function (m) { return lang.map[m]; }));
    return lowerCase(str);
}
/**
 * Lower case as a function.
 */
function lowerCase(str) {
    return str.toLowerCase();
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/ms/index.js":
/*!**********************************!*\
  !*** ./node_modules/ms/index.js ***!
  \**********************************/
/***/ ((module) => {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}


/***/ }),

/***/ "./node_modules/no-case/dist.es2015/index.js":
/*!***************************************************!*\
  !*** ./node_modules/no-case/dist.es2015/index.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "noCase": () => (/* binding */ noCase)
/* harmony export */ });
/* harmony import */ var lower_case__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lower-case */ "./node_modules/lower-case/dist.es2015/index.js");

// Support camel case ("camelCase" -> "camel Case" and "CAMELCase" -> "CAMEL Case").
var DEFAULT_SPLIT_REGEXP = [/([a-z0-9])([A-Z])/g, /([A-Z])([A-Z][a-z])/g];
// Remove all non-word characters.
var DEFAULT_STRIP_REGEXP = /[^A-Z0-9]+/gi;
/**
 * Normalize the string into something other libraries can manipulate easier.
 */
function noCase(input, options) {
    if (options === void 0) { options = {}; }
    var _a = options.splitRegexp, splitRegexp = _a === void 0 ? DEFAULT_SPLIT_REGEXP : _a, _b = options.stripRegexp, stripRegexp = _b === void 0 ? DEFAULT_STRIP_REGEXP : _b, _c = options.transform, transform = _c === void 0 ? lower_case__WEBPACK_IMPORTED_MODULE_0__.lowerCase : _c, _d = options.delimiter, delimiter = _d === void 0 ? " " : _d;
    var result = replace(replace(input, splitRegexp, "$1\0$2"), stripRegexp, "\0");
    var start = 0;
    var end = result.length;
    // Trim the delimiter from around the output string.
    while (result.charAt(start) === "\0")
        start++;
    while (result.charAt(end - 1) === "\0")
        end--;
    // Transform each token independently.
    return result.slice(start, end).split("\0").map(transform).join(delimiter);
}
/**
 * Replace `re` in the input string with the replacement value.
 */
function replace(input, re, value) {
    if (re instanceof RegExp)
        return input.replace(re, value);
    return re.reduce(function (input, re) { return input.replace(re, value); }, input);
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/path/path.js":
/*!***********************************!*\
  !*** ./node_modules/path/path.js ***!
  \***********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(/*! process/browser */ "./node_modules/process/browser.js");
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.




var isWindows = process.platform === 'win32';
var util = __webpack_require__(/*! util */ "./node_modules/util/util.js");


// resolves . and .. elements in a path array with directory names there
// must be no slashes or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  var res = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];

    // ignore empty parts
    if (!p || p === '.')
      continue;

    if (p === '..') {
      if (res.length && res[res.length - 1] !== '..') {
        res.pop();
      } else if (allowAboveRoot) {
        res.push('..');
      }
    } else {
      res.push(p);
    }
  }

  return res;
}

// returns an array with empty elements removed from either end of the input
// array or the original array if no elements need to be removed
function trimArray(arr) {
  var lastIndex = arr.length - 1;
  var start = 0;
  for (; start <= lastIndex; start++) {
    if (arr[start])
      break;
  }

  var end = lastIndex;
  for (; end >= 0; end--) {
    if (arr[end])
      break;
  }

  if (start === 0 && end === lastIndex)
    return arr;
  if (start > end)
    return [];
  return arr.slice(start, end + 1);
}

// Regex to split a windows path into three parts: [*, device, slash,
// tail] windows-only
var splitDeviceRe =
    /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

// Regex to split the tail part of the above into [*, dir, basename, ext]
var splitTailRe =
    /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;

var win32 = {};

// Function to split a filename into [root, dir, basename, ext]
function win32SplitPath(filename) {
  // Separate device+slash from tail
  var result = splitDeviceRe.exec(filename),
      device = (result[1] || '') + (result[2] || ''),
      tail = result[3] || '';
  // Split the tail into dir, basename and extension
  var result2 = splitTailRe.exec(tail),
      dir = result2[1],
      basename = result2[2],
      ext = result2[3];
  return [device, dir, basename, ext];
}

function win32StatPath(path) {
  var result = splitDeviceRe.exec(path),
      device = result[1] || '',
      isUnc = !!device && device[1] !== ':';
  return {
    device: device,
    isUnc: isUnc,
    isAbsolute: isUnc || !!result[2], // UNC paths are always absolute
    tail: result[3]
  };
}

function normalizeUNCRoot(device) {
  return '\\\\' + device.replace(/^[\\\/]+/, '').replace(/[\\\/]+/g, '\\');
}

// path.resolve([from ...], to)
win32.resolve = function() {
  var resolvedDevice = '',
      resolvedTail = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1; i--) {
    var path;
    if (i >= 0) {
      path = arguments[i];
    } else if (!resolvedDevice) {
      path = process.cwd();
    } else {
      // Windows has the concept of drive-specific current working
      // directories. If we've resolved a drive letter but not yet an
      // absolute path, get cwd for that drive. We're sure the device is not
      // an unc path at this points, because unc paths are always absolute.
      path = process.env['=' + resolvedDevice];
      // Verify that a drive-local cwd was found and that it actually points
      // to our drive. If not, default to the drive's root.
      if (!path || path.substr(0, 3).toLowerCase() !==
          resolvedDevice.toLowerCase() + '\\') {
        path = resolvedDevice + '\\';
      }
    }

    // Skip empty and invalid entries
    if (!util.isString(path)) {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    var result = win32StatPath(path),
        device = result.device,
        isUnc = result.isUnc,
        isAbsolute = result.isAbsolute,
        tail = result.tail;

    if (device &&
        resolvedDevice &&
        device.toLowerCase() !== resolvedDevice.toLowerCase()) {
      // This path points to another device so it is not applicable
      continue;
    }

    if (!resolvedDevice) {
      resolvedDevice = device;
    }
    if (!resolvedAbsolute) {
      resolvedTail = tail + '\\' + resolvedTail;
      resolvedAbsolute = isAbsolute;
    }

    if (resolvedDevice && resolvedAbsolute) {
      break;
    }
  }

  // Convert slashes to backslashes when `resolvedDevice` points to an UNC
  // root. Also squash multiple slashes into a single one where appropriate.
  if (isUnc) {
    resolvedDevice = normalizeUNCRoot(resolvedDevice);
  }

  // At this point the path should be resolved to a full absolute path,
  // but handle relative paths to be safe (might happen when process.cwd()
  // fails)

  // Normalize the tail path
  resolvedTail = normalizeArray(resolvedTail.split(/[\\\/]+/),
                                !resolvedAbsolute).join('\\');

  return (resolvedDevice + (resolvedAbsolute ? '\\' : '') + resolvedTail) ||
         '.';
};


win32.normalize = function(path) {
  var result = win32StatPath(path),
      device = result.device,
      isUnc = result.isUnc,
      isAbsolute = result.isAbsolute,
      tail = result.tail,
      trailingSlash = /[\\\/]$/.test(tail);

  // Normalize the tail path
  tail = normalizeArray(tail.split(/[\\\/]+/), !isAbsolute).join('\\');

  if (!tail && !isAbsolute) {
    tail = '.';
  }
  if (tail && trailingSlash) {
    tail += '\\';
  }

  // Convert slashes to backslashes when `device` points to an UNC root.
  // Also squash multiple slashes into a single one where appropriate.
  if (isUnc) {
    device = normalizeUNCRoot(device);
  }

  return device + (isAbsolute ? '\\' : '') + tail;
};


win32.isAbsolute = function(path) {
  return win32StatPath(path).isAbsolute;
};

win32.join = function() {
  var paths = [];
  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    if (!util.isString(arg)) {
      throw new TypeError('Arguments to path.join must be strings');
    }
    if (arg) {
      paths.push(arg);
    }
  }

  var joined = paths.join('\\');

  // Make sure that the joined path doesn't start with two slashes, because
  // normalize() will mistake it for an UNC path then.
  //
  // This step is skipped when it is very clear that the user actually
  // intended to point at an UNC path. This is assumed when the first
  // non-empty string arguments starts with exactly two slashes followed by
  // at least one more non-slash character.
  //
  // Note that for normalize() to treat a path as an UNC path it needs to
  // have at least 2 components, so we don't filter for that here.
  // This means that the user can use join to construct UNC paths from
  // a server name and a share name; for example:
  //   path.join('//server', 'share') -> '\\\\server\\share\')
  if (!/^[\\\/]{2}[^\\\/]/.test(paths[0])) {
    joined = joined.replace(/^[\\\/]{2,}/, '\\');
  }

  return win32.normalize(joined);
};


// path.relative(from, to)
// it will solve the relative path from 'from' to 'to', for instance:
// from = 'C:\\orandea\\test\\aaa'
// to = 'C:\\orandea\\impl\\bbb'
// The output of the function should be: '..\\..\\impl\\bbb'
win32.relative = function(from, to) {
  from = win32.resolve(from);
  to = win32.resolve(to);

  // windows is not case sensitive
  var lowerFrom = from.toLowerCase();
  var lowerTo = to.toLowerCase();

  var toParts = trimArray(to.split('\\'));

  var lowerFromParts = trimArray(lowerFrom.split('\\'));
  var lowerToParts = trimArray(lowerTo.split('\\'));

  var length = Math.min(lowerFromParts.length, lowerToParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (lowerFromParts[i] !== lowerToParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  if (samePartsLength == 0) {
    return to;
  }

  var outputParts = [];
  for (var i = samePartsLength; i < lowerFromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('\\');
};


win32._makeLong = function(path) {
  // Note: this will *probably* throw somewhere.
  if (!util.isString(path))
    return path;

  if (!path) {
    return '';
  }

  var resolvedPath = win32.resolve(path);

  if (/^[a-zA-Z]\:\\/.test(resolvedPath)) {
    // path is local filesystem path, which needs to be converted
    // to long UNC path.
    return '\\\\?\\' + resolvedPath;
  } else if (/^\\\\[^?.]/.test(resolvedPath)) {
    // path is network UNC path, which needs to be converted
    // to long UNC path.
    return '\\\\?\\UNC\\' + resolvedPath.substring(2);
  }

  return path;
};


win32.dirname = function(path) {
  var result = win32SplitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


win32.basename = function(path, ext) {
  var f = win32SplitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


win32.extname = function(path) {
  return win32SplitPath(path)[3];
};


win32.format = function(pathObject) {
  if (!util.isObject(pathObject)) {
    throw new TypeError(
        "Parameter 'pathObject' must be an object, not " + typeof pathObject
    );
  }

  var root = pathObject.root || '';

  if (!util.isString(root)) {
    throw new TypeError(
        "'pathObject.root' must be a string or undefined, not " +
        typeof pathObject.root
    );
  }

  var dir = pathObject.dir;
  var base = pathObject.base || '';
  if (!dir) {
    return base;
  }
  if (dir[dir.length - 1] === win32.sep) {
    return dir + base;
  }
  return dir + win32.sep + base;
};


win32.parse = function(pathString) {
  if (!util.isString(pathString)) {
    throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof pathString
    );
  }
  var allParts = win32SplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, -1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};


win32.sep = '\\';
win32.delimiter = ';';


// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var posix = {};


function posixSplitPath(filename) {
  return splitPathRe.exec(filename).slice(1);
}


// path.resolve([from ...], to)
// posix version
posix.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (!util.isString(path)) {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path[0] === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(resolvedPath.split('/'),
                                !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
posix.normalize = function(path) {
  var isAbsolute = posix.isAbsolute(path),
      trailingSlash = path && path[path.length - 1] === '/';

  // Normalize the path
  path = normalizeArray(path.split('/'), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
posix.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
posix.join = function() {
  var path = '';
  for (var i = 0; i < arguments.length; i++) {
    var segment = arguments[i];
    if (!util.isString(segment)) {
      throw new TypeError('Arguments to path.join must be strings');
    }
    if (segment) {
      if (!path) {
        path += segment;
      } else {
        path += '/' + segment;
      }
    }
  }
  return posix.normalize(path);
};


// path.relative(from, to)
// posix version
posix.relative = function(from, to) {
  from = posix.resolve(from).substr(1);
  to = posix.resolve(to).substr(1);

  var fromParts = trimArray(from.split('/'));
  var toParts = trimArray(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};


posix._makeLong = function(path) {
  return path;
};


posix.dirname = function(path) {
  var result = posixSplitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


posix.basename = function(path, ext) {
  var f = posixSplitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


posix.extname = function(path) {
  return posixSplitPath(path)[3];
};


posix.format = function(pathObject) {
  if (!util.isObject(pathObject)) {
    throw new TypeError(
        "Parameter 'pathObject' must be an object, not " + typeof pathObject
    );
  }

  var root = pathObject.root || '';

  if (!util.isString(root)) {
    throw new TypeError(
        "'pathObject.root' must be a string or undefined, not " +
        typeof pathObject.root
    );
  }

  var dir = pathObject.dir ? pathObject.dir + posix.sep : '';
  var base = pathObject.base || '';
  return dir + base;
};


posix.parse = function(pathString) {
  if (!util.isString(pathString)) {
    throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof pathString
    );
  }
  var allParts = posixSplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  allParts[1] = allParts[1] || '';
  allParts[2] = allParts[2] || '';
  allParts[3] = allParts[3] || '';

  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, -1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};


posix.sep = '/';
posix.delimiter = ':';


if (isWindows)
  module.exports = win32;
else /* posix */
  module.exports = posix;

module.exports.posix = posix;
module.exports.win32 = win32;


/***/ }),

/***/ "./node_modules/postmate/build/postmate.es.js":
/*!****************************************************!*\
  !*** ./node_modules/postmate/build/postmate.es.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
  postmate - A powerful, simple, promise-based postMessage library
  @version v1.5.2
  @link https://github.com/dollarshaveclub/postmate
  @author Jacob Kelley <jakie8@gmail.com>
  @license MIT
**/
/**
 * The type of messages our frames our sending
 * @type {String}
 */
var messageType = 'application/x-postmate-v1+json';
/**
 * The maximum number of attempts to send a handshake request to the parent
 * @type {Number}
 */

var maxHandshakeRequests = 5;
/**
 * A unique message ID that is used to ensure responses are sent to the correct requests
 * @type {Number}
 */

var _messageId = 0;
/**
 * Increments and returns a message ID
 * @return {Number} A unique ID for a message
 */

var generateNewMessageId = function generateNewMessageId() {
  return ++_messageId;
};
/**
 * Postmate logging function that enables/disables via config
 * @param  {Object} ...args Rest Arguments
 */

var log = function log() {
  var _console;

  return Postmate.debug ? (_console = console).log.apply(_console, arguments) : null;
}; // eslint-disable-line no-console

/**
 * Takes a URL and returns the origin
 * @param  {String} url The full URL being requested
 * @return {String}     The URLs origin
 */

var resolveOrigin = function resolveOrigin(url) {
  var a = document.createElement('a');
  a.href = url;
  var protocol = a.protocol.length > 4 ? a.protocol : window.location.protocol;
  var host = a.host.length ? a.port === '80' || a.port === '443' ? a.hostname : a.host : window.location.host;
  return a.origin || protocol + "//" + host;
};
var messageTypes = {
  handshake: 1,
  'handshake-reply': 1,
  call: 1,
  emit: 1,
  reply: 1,
  request: 1
  /**
   * Ensures that a message is safe to interpret
   * @param  {Object} message The postmate message being sent
   * @param  {String|Boolean} allowedOrigin The whitelisted origin or false to skip origin check
   * @return {Boolean}
   */

};
var sanitize = function sanitize(message, allowedOrigin) {
  if (typeof allowedOrigin === 'string' && message.origin !== allowedOrigin) return false;
  if (!message.data) return false;
  if (typeof message.data === 'object' && !('postmate' in message.data)) return false;
  if (message.data.type !== messageType) return false;
  if (!messageTypes[message.data.postmate]) return false;
  return true;
};
/**
 * Takes a model, and searches for a value by the property
 * @param  {Object} model     The dictionary to search against
 * @param  {String} property  A path within a dictionary (i.e. 'window.location.href')
 * @param  {Object} data      Additional information from the get request that is
 *                            passed to functions in the child model
 * @return {Promise}
 */

var resolveValue = function resolveValue(model, property) {
  var unwrappedContext = typeof model[property] === 'function' ? model[property]() : model[property];
  return Postmate.Promise.resolve(unwrappedContext);
};
/**
 * Composes an API to be used by the parent
 * @param {Object} info Information on the consumer
 */

var ParentAPI =
/*#__PURE__*/
function () {
  function ParentAPI(info) {
    var _this = this;

    this.parent = info.parent;
    this.frame = info.frame;
    this.child = info.child;
    this.childOrigin = info.childOrigin;
    this.events = {};

    if (true) {
      log('Parent: Registering API');
      log('Parent: Awaiting messages...');
    }

    this.listener = function (e) {
      if (!sanitize(e, _this.childOrigin)) return false;
      /**
       * the assignments below ensures that e, data, and value are all defined
       */

      var _ref = ((e || {}).data || {}).value || {},
          data = _ref.data,
          name = _ref.name;

      if (e.data.postmate === 'emit') {
        if (true) {
          log("Parent: Received event emission: " + name);
        }

        if (name in _this.events) {
          _this.events[name].call(_this, data);
        }
      }
    };

    this.parent.addEventListener('message', this.listener, false);

    if (true) {
      log('Parent: Awaiting event emissions from Child');
    }
  }

  var _proto = ParentAPI.prototype;

  _proto.get = function get(property) {
    var _this2 = this;

    return new Postmate.Promise(function (resolve) {
      // Extract data from response and kill listeners
      var uid = generateNewMessageId();

      var transact = function transact(e) {
        if (e.data.uid === uid && e.data.postmate === 'reply') {
          _this2.parent.removeEventListener('message', transact, false);

          resolve(e.data.value);
        }
      }; // Prepare for response from Child...


      _this2.parent.addEventListener('message', transact, false); // Then ask child for information


      _this2.child.postMessage({
        postmate: 'request',
        type: messageType,
        property: property,
        uid: uid
      }, _this2.childOrigin);
    });
  };

  _proto.call = function call(property, data) {
    // Send information to the child
    this.child.postMessage({
      postmate: 'call',
      type: messageType,
      property: property,
      data: data
    }, this.childOrigin);
  };

  _proto.on = function on(eventName, callback) {
    this.events[eventName] = callback;
  };

  _proto.destroy = function destroy() {
    if (true) {
      log('Parent: Destroying Postmate instance');
    }

    window.removeEventListener('message', this.listener, false);
    this.frame.parentNode.removeChild(this.frame);
  };

  return ParentAPI;
}();
/**
 * Composes an API to be used by the child
 * @param {Object} info Information on the consumer
 */

var ChildAPI =
/*#__PURE__*/
function () {
  function ChildAPI(info) {
    var _this3 = this;

    this.model = info.model;
    this.parent = info.parent;
    this.parentOrigin = info.parentOrigin;
    this.child = info.child;

    if (true) {
      log('Child: Registering API');
      log('Child: Awaiting messages...');
    }

    this.child.addEventListener('message', function (e) {
      if (!sanitize(e, _this3.parentOrigin)) return;

      if (true) {
        log('Child: Received request', e.data);
      }

      var _e$data = e.data,
          property = _e$data.property,
          uid = _e$data.uid,
          data = _e$data.data;

      if (e.data.postmate === 'call') {
        if (property in _this3.model && typeof _this3.model[property] === 'function') {
          _this3.model[property](data);
        }

        return;
      } // Reply to Parent


      resolveValue(_this3.model, property).then(function (value) {
        return e.source.postMessage({
          property: property,
          postmate: 'reply',
          type: messageType,
          uid: uid,
          value: value
        }, e.origin);
      });
    });
  }

  var _proto2 = ChildAPI.prototype;

  _proto2.emit = function emit(name, data) {
    if (true) {
      log("Child: Emitting Event \"" + name + "\"", data);
    }

    this.parent.postMessage({
      postmate: 'emit',
      type: messageType,
      value: {
        name: name,
        data: data
      }
    }, this.parentOrigin);
  };

  return ChildAPI;
}();
/**
  * The entry point of the Parent.
 * @type {Class}
 */

var Postmate =
/*#__PURE__*/
function () {
  // eslint-disable-line no-undef
  // Internet Explorer craps itself

  /**
   * Sets options related to the Parent
   * @param {Object} object The element to inject the frame into, and the url
   * @return {Promise}
   */
  function Postmate(_ref2) {
    var _ref2$container = _ref2.container,
        container = _ref2$container === void 0 ? typeof container !== 'undefined' ? container : document.body : _ref2$container,
        model = _ref2.model,
        url = _ref2.url,
        name = _ref2.name,
        _ref2$classListArray = _ref2.classListArray,
        classListArray = _ref2$classListArray === void 0 ? [] : _ref2$classListArray;
    // eslint-disable-line no-undef
    this.parent = window;
    this.frame = document.createElement('iframe');
    this.frame.name = name || '';
    this.frame.classList.add.apply(this.frame.classList, classListArray);
    container.appendChild(this.frame);
    this.child = this.frame.contentWindow || this.frame.contentDocument.parentWindow;
    this.model = model || {};
    return this.sendHandshake(url);
  }
  /**
   * Begins the handshake strategy
   * @param  {String} url The URL to send a handshake request to
   * @return {Promise}     Promise that resolves when the handshake is complete
   */


  var _proto3 = Postmate.prototype;

  _proto3.sendHandshake = function sendHandshake(url) {
    var _this4 = this;

    var childOrigin = resolveOrigin(url);
    var attempt = 0;
    var responseInterval;
    return new Postmate.Promise(function (resolve, reject) {
      var reply = function reply(e) {
        if (!sanitize(e, childOrigin)) return false;

        if (e.data.postmate === 'handshake-reply') {
          clearInterval(responseInterval);

          if (true) {
            log('Parent: Received handshake reply from Child');
          }

          _this4.parent.removeEventListener('message', reply, false);

          _this4.childOrigin = e.origin;

          if (true) {
            log('Parent: Saving Child origin', _this4.childOrigin);
          }

          return resolve(new ParentAPI(_this4));
        } // Might need to remove since parent might be receiving different messages
        // from different hosts


        if (true) {
          log('Parent: Invalid handshake reply');
        }

        return reject('Failed handshake');
      };

      _this4.parent.addEventListener('message', reply, false);

      var doSend = function doSend() {
        attempt++;

        if (true) {
          log("Parent: Sending handshake attempt " + attempt, {
            childOrigin: childOrigin
          });
        }

        _this4.child.postMessage({
          postmate: 'handshake',
          type: messageType,
          model: _this4.model
        }, childOrigin);

        if (attempt === maxHandshakeRequests) {
          clearInterval(responseInterval);
        }
      };

      var loaded = function loaded() {
        doSend();
        responseInterval = setInterval(doSend, 500);
      };

      if (_this4.frame.attachEvent) {
        _this4.frame.attachEvent('onload', loaded);
      } else {
        _this4.frame.onload = loaded;
      }

      if (true) {
        log('Parent: Loading frame', {
          url: url
        });
      }

      _this4.frame.src = url;
    });
  };

  return Postmate;
}();
/**
 * The entry point of the Child
 * @type {Class}
 */


Postmate.debug = false;

Postmate.Promise = function () {
  try {
    return window ? window.Promise : Promise;
  } catch (e) {
    return null;
  }
}();

Postmate.Model =
/*#__PURE__*/
function () {
  /**
   * Initializes the child, model, parent, and responds to the Parents handshake
   * @param {Object} model Hash of values, functions, or promises
   * @return {Promise}       The Promise that resolves when the handshake has been received
   */
  function Model(model) {
    this.child = window;
    this.model = model;
    this.parent = this.child.parent;
    return this.sendHandshakeReply();
  }
  /**
   * Responds to a handshake initiated by the Parent
   * @return {Promise} Resolves an object that exposes an API for the Child
   */


  var _proto4 = Model.prototype;

  _proto4.sendHandshakeReply = function sendHandshakeReply() {
    var _this5 = this;

    return new Postmate.Promise(function (resolve, reject) {
      var shake = function shake(e) {
        if (!e.data.postmate) {
          return;
        }

        if (e.data.postmate === 'handshake') {
          if (true) {
            log('Child: Received handshake from Parent');
          }

          _this5.child.removeEventListener('message', shake, false);

          if (true) {
            log('Child: Sending handshake reply to Parent');
          }

          e.source.postMessage({
            postmate: 'handshake-reply',
            type: messageType
          }, e.origin);
          _this5.parentOrigin = e.origin; // Extend model with the one provided by the parent

          var defaults = e.data.model;

          if (defaults) {
            Object.keys(defaults).forEach(function (key) {
              _this5.model[key] = defaults[key];
            });

            if (true) {
              log('Child: Inherited and extended model from Parent');
            }
          }

          if (true) {
            log('Child: Saving Parent origin', _this5.parentOrigin);
          }

          return resolve(new ChildAPI(_this5));
        }

        return reject('Handshake Reply Failed');
      };

      _this5.child.addEventListener('message', shake, false);
    });
  };

  return Model;
}();

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Postmate);


/***/ }),

/***/ "./node_modules/process/browser.js":
/*!*****************************************!*\
  !*** ./node_modules/process/browser.js ***!
  \*****************************************/
/***/ ((module) => {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ "./node_modules/snake-case/dist.es2015/index.js":
/*!******************************************************!*\
  !*** ./node_modules/snake-case/dist.es2015/index.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "snakeCase": () => (/* binding */ snakeCase)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var dot_case__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! dot-case */ "./node_modules/dot-case/dist.es2015/index.js");


function snakeCase(input, options) {
    if (options === void 0) { options = {}; }
    return (0,dot_case__WEBPACK_IMPORTED_MODULE_0__.dotCase)(input, (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__assign)({ delimiter: "_" }, options));
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./src/LSPlugin.caller.ts":
/*!********************************!*\
  !*** ./src/LSPlugin.caller.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FLAG_AWAIT": () => (/* binding */ FLAG_AWAIT),
/* harmony export */   "LSPMSG": () => (/* binding */ LSPMSG),
/* harmony export */   "LSPMSG_ERROR_TAG": () => (/* binding */ LSPMSG_ERROR_TAG),
/* harmony export */   "LSPMSG_SETTINGS": () => (/* binding */ LSPMSG_SETTINGS),
/* harmony export */   "LSPMSG_BEFORE_UNLOAD": () => (/* binding */ LSPMSG_BEFORE_UNLOAD),
/* harmony export */   "LSPMSG_SYNC": () => (/* binding */ LSPMSG_SYNC),
/* harmony export */   "LSPMSG_READY": () => (/* binding */ LSPMSG_READY),
/* harmony export */   "LSPMSGFn": () => (/* binding */ LSPMSGFn),
/* harmony export */   "AWAIT_LSPMSGFn": () => (/* binding */ AWAIT_LSPMSGFn),
/* harmony export */   "LSPluginCaller": () => (/* binding */ LSPluginCaller)
/* harmony export */ });
/* harmony import */ var postmate__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! postmate */ "./node_modules/postmate/build/postmate.es.js");
/* harmony import */ var eventemitter3__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! eventemitter3 */ "./node_modules/eventemitter3/index.js");
/* harmony import */ var eventemitter3__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(eventemitter3__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js");
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(debug__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _helpers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./helpers */ "./src/helpers.ts");
/* harmony import */ var _LSPlugin_shadow__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./LSPlugin.shadow */ "./src/LSPlugin.shadow.ts");





const debug = debug__WEBPACK_IMPORTED_MODULE_2___default()('LSPlugin:caller');
const FLAG_AWAIT = '#await#response#';
const LSPMSG = '#lspmsg#';
const LSPMSG_ERROR_TAG = '#lspmsg#error#';
const LSPMSG_SETTINGS = '#lspmsg#settings#';
const LSPMSG_BEFORE_UNLOAD = '#lspmsg#beforeunload#';
const LSPMSG_SYNC = '#lspmsg#reply#';
const LSPMSG_READY = '#lspmsg#ready#';
const LSPMSGFn = (id) => `${LSPMSG}${id}`;
const AWAIT_LSPMSGFn = (id) => `${FLAG_AWAIT}${id}`;
/**
 * Call between core and user
 */
class LSPluginCaller extends (eventemitter3__WEBPACK_IMPORTED_MODULE_1___default()) {
    constructor(_pluginLocal) {
        super();
        this._pluginLocal = _pluginLocal;
        this._connected = false;
        this._userModel = {};
        this._debugTag = '';
        if (_pluginLocal) {
            this._debugTag = _pluginLocal.debugTag;
        }
    }
    async connectToChild() {
        if (this._connected)
            return;
        const { shadow } = this._pluginLocal;
        if (shadow) {
            await this._setupShadowSandbox();
        }
        else {
            await this._setupIframeSandbox();
        }
    }
    async connectToParent(userModel = {}) {
        if (this._connected)
            return;
        const caller = this;
        const isShadowMode = this._pluginLocal != null;
        let syncGCTimer = 0;
        let syncTag = 0;
        const syncActors = new Map();
        const readyDeferred = (0,_helpers__WEBPACK_IMPORTED_MODULE_3__.deferred)(1000 * 5);
        const model = this._extendUserModel({
            [LSPMSG_READY]: async () => {
                await readyDeferred.resolve();
            },
            [LSPMSG_BEFORE_UNLOAD]: async (e) => {
                const actor = (0,_helpers__WEBPACK_IMPORTED_MODULE_3__.deferred)(10 * 1000);
                caller.emit('beforeunload', Object.assign({ actor }, e));
                await actor.promise;
            },
            [LSPMSG_SETTINGS]: async ({ type, payload }) => {
                caller.emit('settings:changed', payload);
            },
            [LSPMSG]: async ({ ns, type, payload }) => {
                debug(`${this._debugTag} [call from host]`, ns, type, payload);
                if (ns && ns.startsWith('hook')) {
                    caller.emit(`${ns}:${type}`, payload);
                    return;
                }
                caller.emit(type, payload);
            },
            [LSPMSG_SYNC]: ({ _sync, result }) => {
                debug(`sync reply #${_sync}`, result);
                if (syncActors.has(_sync)) {
                    const actor = syncActors.get(_sync);
                    if (actor) {
                        if (result?.hasOwnProperty(LSPMSG_ERROR_TAG)) {
                            actor.reject(result[LSPMSG_ERROR_TAG]);
                        }
                        else {
                            actor.resolve(result);
                        }
                        syncActors.delete(_sync);
                    }
                }
            },
            ...userModel
        });
        if (isShadowMode) {
            await readyDeferred.promise;
            return JSON.parse(JSON.stringify(this._pluginLocal?.toJSON()));
        }
        const handshake = new postmate__WEBPACK_IMPORTED_MODULE_0__.default.Model(model);
        this._status = 'pending';
        await handshake.then(refParent => {
            this._child = refParent;
            this._connected = true;
            this._call = async (type, payload = {}, actor) => {
                if (actor) {
                    const tag = ++syncTag;
                    syncActors.set(tag, actor);
                    payload._sync = tag;
                    actor.setTag(`async call #${tag}`);
                    debug('async call #', tag);
                }
                refParent.emit(LSPMSGFn(model.baseInfo.id), { type, payload });
                return actor?.promise;
            };
            this._callUserModel = async (type, payload) => {
                try {
                    model[type](payload);
                }
                catch (e) {
                    debug(`model method #${type} not existed`);
                }
            };
            // actors GC
            syncGCTimer = setInterval(() => {
                if (syncActors.size > 100) {
                    for (const [k, v] of syncActors) {
                        if (v.settled) {
                            syncActors.delete(k);
                        }
                    }
                }
            }, 1000 * 60 * 30);
        }).finally(() => {
            this._status = undefined;
        });
        await readyDeferred.promise;
        return model.baseInfo;
    }
    async call(type, payload = {}) {
        return this._call?.call(this, type, payload);
    }
    async callAsync(type, payload = {}) {
        const actor = (0,_helpers__WEBPACK_IMPORTED_MODULE_3__.deferred)(1000 * 10);
        return this._call?.call(this, type, payload, actor);
    }
    async callUserModel(type, payload = {}) {
        return this._callUserModel?.call(this, type, payload);
    }
    async _setupIframeSandbox() {
        const pl = this._pluginLocal;
        const handshake = new postmate__WEBPACK_IMPORTED_MODULE_0__.default({
            container: document.body,
            url: pl.options.entry,
            classListArray: ['lsp-iframe-sandbox'],
            model: { baseInfo: JSON.parse(JSON.stringify(pl.toJSON())) }
        });
        this._status = 'pending';
        // timeout for handshake
        let timer;
        return new Promise((resolve, reject) => {
            timer = setTimeout(() => {
                reject(new Error(`handshake Timeout`));
            }, 3 * 1000); // 3secs
            handshake.then(refChild => {
                this._parent = refChild;
                this._connected = true;
                this.emit('connected');
                refChild.frame.setAttribute('id', pl.id);
                refChild.on(LSPMSGFn(pl.id), ({ type, payload }) => {
                    debug(`[call from plugin] `, type, payload);
                    this._pluginLocal?.emit(type, payload || {});
                });
                this._call = async (...args) => {
                    // parent all will get message before handshaked
                    await refChild.call(LSPMSGFn(pl.id), {
                        type: args[0], payload: Object.assign(args[1] || {}, {
                            $$pid: pl.id
                        })
                    });
                };
                this._callUserModel = async (type, payload) => {
                    if (type.startsWith(FLAG_AWAIT)) {
                        // TODO: attach payload with method call
                        return await refChild.get(type.replace(FLAG_AWAIT, ''));
                    }
                    else {
                        refChild.call(type, payload);
                    }
                };
                resolve(null);
            }).catch(e => {
                reject(e);
            }).finally(() => {
                clearTimeout(timer);
            });
        }).catch(e => {
            debug('iframe sandbox error', e);
            throw e;
        }).finally(() => {
            this._status = undefined;
        });
    }
    async _setupShadowSandbox() {
        const pl = this._pluginLocal;
        const shadow = this._shadow = new _LSPlugin_shadow__WEBPACK_IMPORTED_MODULE_4__.LSPluginShadowFrame(pl);
        try {
            this._status = 'pending';
            await shadow.load();
            this._connected = true;
            this.emit('connected');
            this._call = async (type, payload = {}, actor) => {
                actor && (payload.actor = actor);
                // TODO: support sync call
                // @ts-ignore Call in same thread
                this._pluginLocal?.emit(type, Object.assign(payload, {
                    $$pid: pl.id
                }));
                return actor?.promise;
            };
            this._callUserModel = async (...args) => {
                let type = args[0];
                if (type?.startsWith(FLAG_AWAIT)) {
                    type = type.replace(FLAG_AWAIT, '');
                }
                const payload = args[1] || {};
                const fn = this._userModel[type];
                if (typeof fn === 'function') {
                    await fn.call(null, payload);
                }
            };
        }
        catch (e) {
            debug('shadow sandbox error', e);
            throw e;
        }
        finally {
            this._status = undefined;
        }
    }
    _extendUserModel(model) {
        return Object.assign(this._userModel, model);
    }
    _getSandboxIframeContainer() {
        return this._parent?.frame;
    }
    _getSandboxShadowContainer() {
        return this._shadow?.frame;
    }
    set debugTag(value) {
        this._debugTag = value;
    }
    async destroy() {
        if (this._parent) {
            await this._parent.destroy();
        }
        if (this._shadow) {
            this._shadow.destroy();
        }
    }
}



/***/ }),

/***/ "./src/LSPlugin.shadow.ts":
/*!********************************!*\
  !*** ./src/LSPlugin.shadow.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "LSPluginShadowFrame": () => (/* binding */ LSPluginShadowFrame)
/* harmony export */ });
/* harmony import */ var eventemitter3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! eventemitter3 */ "./node_modules/eventemitter3/index.js");
/* harmony import */ var eventemitter3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(eventemitter3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _LSPlugin_user__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./LSPlugin.user */ "./src/LSPlugin.user.ts");


// @ts-ignore
const { importHTML, createSandboxContainer } = window.QSandbox || {};
function userFetch(url, opts) {
    if (!url.startsWith('http')) {
        url = url.replace('file://', '');
        return new Promise(async (resolve, reject) => {
            try {
                const content = await window.apis.doAction(['readFile', url]);
                resolve({
                    text() {
                        return content;
                    }
                });
            }
            catch (e) {
                console.error(e);
                reject(e);
            }
        });
    }
    return fetch(url, opts);
}
class LSPluginShadowFrame extends (eventemitter3__WEBPACK_IMPORTED_MODULE_0___default()) {
    constructor(_pluginLocal) {
        super();
        this._pluginLocal = _pluginLocal;
        this._loaded = false;
        this._unmountFns = [];
        _pluginLocal._dispose(() => {
            this._unmount();
        });
    }
    async load() {
        const { name, entry } = this._pluginLocal.options;
        if (this.loaded || !entry)
            return;
        const { template, execScripts } = await importHTML(entry, { fetch: userFetch });
        this._mount(template, document.body);
        const sandbox = createSandboxContainer(name, {
            elementGetter: () => this._root?.firstChild,
        });
        const global = sandbox.instance.proxy;
        global.__shadow_mode__ = true;
        global.LSPluginLocal = this._pluginLocal;
        global.LSPluginShadow = this;
        global.LSPluginUser = global.logseq = new _LSPlugin_user__WEBPACK_IMPORTED_MODULE_1__.LSPluginUser(this._pluginLocal.toJSON(), this._pluginLocal.caller);
        // TODO: {mount, unmount}
        const execResult = await execScripts(global, true);
        this._unmountFns.push(execResult.unmount);
        this._loaded = true;
    }
    _mount(content, container) {
        const frame = this._frame = document.createElement('div');
        frame.classList.add('lsp-shadow-sandbox');
        frame.id = this._pluginLocal.id;
        this._root = frame.attachShadow({ mode: 'open' });
        this._root.innerHTML = `<div>${content}</div>`;
        container.appendChild(frame);
        this.emit('mounted');
    }
    _unmount() {
        for (const fn of this._unmountFns) {
            fn && fn.call(null);
        }
    }
    destroy() {
        this.frame?.parentNode?.removeChild(this.frame);
    }
    get loaded() {
        return this._loaded;
    }
    get document() {
        return this._root?.firstChild;
    }
    get frame() {
        return this._frame;
    }
}



/***/ }),

/***/ "./src/LSPlugin.ts":
/*!*************************!*\
  !*** ./src/LSPlugin.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "./src/LSPlugin.user.ts":
/*!******************************!*\
  !*** ./src/LSPlugin.user.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "LSPluginUser": () => (/* binding */ LSPluginUser),
/* harmony export */   "setupPluginUserInstance": () => (/* binding */ setupPluginUserInstance)
/* harmony export */ });
/* harmony import */ var _helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./helpers */ "./src/helpers.ts");
/* harmony import */ var _LSPlugin_caller__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./LSPlugin.caller */ "./src/LSPlugin.caller.ts");
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js");
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(debug__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var snake_case__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! snake-case */ "./node_modules/snake-case/dist.es2015/index.js");
/* harmony import */ var eventemitter3__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! eventemitter3 */ "./node_modules/eventemitter3/index.js");
/* harmony import */ var eventemitter3__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(eventemitter3__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _modules_LSPlugin_Storage__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./modules/LSPlugin.Storage */ "./src/modules/LSPlugin.Storage.ts");
/* harmony import */ var _LSPlugin__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./LSPlugin */ "./src/LSPlugin.ts");






const PROXY_CONTINUE = Symbol.for('proxy-continue');
const debug = debug__WEBPACK_IMPORTED_MODULE_2___default()('LSPlugin:user');
/**
 * @param type
 * @param opts
 * @param action
 */
function registerSimpleCommand(type, opts, action) {
    if (typeof action !== 'function') {
        return false;
    }
    const { key, label } = opts;
    const eventKey = `SimpleCommandHook${key}${++registeredCmdUid}`;
    this.Editor['on' + eventKey](action);
    this.caller?.call(`api:call`, {
        method: 'register-plugin-simple-command',
        args: [this.baseInfo.id, [{ key, label, type }, ['editor/hook', eventKey]]]
    });
}
const app = {
    registerUIItem(type, opts) {
        const pid = this.baseInfo.id;
        // opts.key = `${pid}_${opts.key}`
        this.caller?.call(`api:call`, {
            method: 'register-plugin-ui-item',
            args: [pid, type, opts]
        });
    },
    registerPageMenuItem(tag, action) {
        if (typeof action !== 'function') {
            return false;
        }
        const key = tag + '_' + this.baseInfo.id;
        const label = tag;
        const type = 'page-menu-item';
        registerSimpleCommand.call(this, type, {
            key, label
        }, action);
    }
};
let registeredCmdUid = 0;
const editor = {
    registerSlashCommand(tag, actions) {
        debug('Register slash command #', this.baseInfo.id, tag, actions);
        if (typeof actions === 'function') {
            actions = [
                ['editor/clear-current-slash', false],
                ['editor/restore-saved-cursor'],
                ['editor/hook', actions]
            ];
        }
        actions = actions.map((it) => {
            const [tag, ...args] = it;
            switch (tag) {
                case 'editor/hook':
                    let key = args[0];
                    let fn = () => {
                        this.caller?.callUserModel(key);
                    };
                    if (typeof key === 'function') {
                        fn = key;
                    }
                    const eventKey = `SlashCommandHook${tag}${++registeredCmdUid}`;
                    it[1] = eventKey;
                    // register command listener
                    this.Editor['on' + eventKey](fn);
                    break;
                default:
            }
            return it;
        });
        this.caller?.call(`api:call`, {
            method: 'register-plugin-slash-command',
            args: [this.baseInfo.id, [tag, actions]]
        });
    },
    registerBlockContextMenuItem(tag, action) {
        if (typeof action !== 'function') {
            return false;
        }
        const key = tag + '_' + this.baseInfo.id;
        const label = tag;
        const type = 'block-context-menu-item';
        registerSimpleCommand.call(this, type, {
            key, label
        }, action);
    },
    scrollToBlockInPage(pageName, blockId) {
        const anchor = `block-content-` + blockId;
        this.App.pushState('page', { name: pageName }, { anchor });
    }
};
const db = {};
const KEY_MAIN_UI = 0;
/**
 * User plugin instance
 * @public
 */
class LSPluginUser extends (eventemitter3__WEBPACK_IMPORTED_MODULE_3___default()) {
    /**
     * @param _baseInfo
     * @param _caller
     */
    constructor(_baseInfo, _caller) {
        super();
        this._baseInfo = _baseInfo;
        this._caller = _caller;
        /**
         * @private
         */
        this._connected = false;
        /**
         * ui frame identities
         * @private
         */
        this._ui = new Map();
        _caller.on('settings:changed', (payload) => {
            const b = Object.assign({}, this.settings);
            const a = Object.assign(this._baseInfo.settings, payload);
            this.emit('settings:changed', { ...a }, b);
        });
        _caller.on('beforeunload', async (payload) => {
            const { actor, ...rest } = payload;
            const cb = this._beforeunloadCallback;
            try {
                cb && await cb(rest);
                actor?.resolve(null);
            }
            catch (e) {
                console.debug(`${_caller.debugTag} [beforeunload] `, e);
                actor?.reject(e);
            }
        });
        // modules
        this._fileStorage = new _modules_LSPlugin_Storage__WEBPACK_IMPORTED_MODULE_4__.LSPluginFileStorage(this);
    }
    async ready(model, callback) {
        if (this._connected)
            return;
        try {
            if (typeof model === 'function') {
                callback = model;
                model = {};
            }
            let baseInfo = await this._caller.connectToParent(model);
            baseInfo = (0,_helpers__WEBPACK_IMPORTED_MODULE_0__.deepMerge)(this._baseInfo, baseInfo);
            this._connected = true;
            if (baseInfo?.id) {
                this._caller.debugTag = `#${baseInfo.id} [${baseInfo.name}]`;
            }
            callback && callback.call(this, baseInfo);
        }
        catch (e) {
            console.error('[LSPlugin Ready Error]', e);
        }
    }
    beforeunload(callback) {
        if (typeof callback !== 'function')
            return;
        this._beforeunloadCallback = callback;
    }
    provideModel(model) {
        this.caller._extendUserModel(model);
        return this;
    }
    provideTheme(theme) {
        this.caller.call('provider:theme', theme);
        return this;
    }
    provideStyle(style) {
        this.caller.call('provider:style', style);
        return this;
    }
    provideUI(ui) {
        this.caller.call('provider:ui', ui);
        return this;
    }
    updateSettings(attrs) {
        this.caller.call('settings:update', attrs);
        // TODO: update associated baseInfo settings
    }
    setMainUIAttrs(attrs) {
        this.caller.call('main-ui:attrs', attrs);
    }
    setMainUIInlineStyle(style) {
        this.caller.call('main-ui:style', style);
    }
    hideMainUI(opts) {
        const payload = { key: KEY_MAIN_UI, visible: false, cursor: opts?.restoreEditingCursor };
        this.caller.call('main-ui:visible', payload);
        this.emit('ui:visible:changed', payload);
        this._ui.set(payload.key, payload);
    }
    showMainUI() {
        const payload = { key: KEY_MAIN_UI, visible: true };
        this.caller.call('main-ui:visible', payload);
        this.emit('ui:visible:changed', payload);
        this._ui.set(payload.key, payload);
    }
    toggleMainUI() {
        const payload = { key: KEY_MAIN_UI, toggle: true };
        const state = this._ui.get(payload.key);
        if (state && state.visible) {
            this.hideMainUI();
        }
        else {
            this.showMainUI();
        }
    }
    get isMainUIVisible() {
        const state = this._ui.get(0);
        return Boolean(state && state.visible);
    }
    get connected() {
        return this._connected;
    }
    get baseInfo() {
        return this._baseInfo;
    }
    get settings() {
        return this.baseInfo?.settings;
    }
    get caller() {
        return this._caller;
    }
    /**
     * @internal
     */
    _makeUserProxy(target, tag) {
        const that = this;
        const caller = this.caller;
        return new Proxy(target, {
            get(target, propKey, receiver) {
                const origMethod = target[propKey];
                return function (...args) {
                    if (origMethod) {
                        const ret = origMethod.apply(that, args);
                        if (ret !== PROXY_CONTINUE)
                            return;
                    }
                    // Handle hook
                    if (tag) {
                        const hookMatcher = propKey.toString().match(/^(once|off|on)/i);
                        if (hookMatcher != null) {
                            const f = hookMatcher[0].toLowerCase();
                            const s = hookMatcher.input;
                            const e = s.slice(f.length);
                            const type = `hook:${tag}:${(0,snake_case__WEBPACK_IMPORTED_MODULE_5__.snakeCase)(e)}`;
                            const handler = args[0];
                            caller[f](type, handler);
                            return f !== 'off' ? () => (caller.off(type, handler)) : void 0;
                        }
                    }
                    // Call host
                    return caller.callAsync(`api:call`, {
                        method: propKey,
                        args: args
                    });
                };
            }
        });
    }
    /**
     * The interface methods of {@link IAppProxy}
     */
    get App() {
        return this._makeUserProxy(app, 'app');
    }
    get Editor() {
        return this._makeUserProxy(editor, 'editor');
    }
    get DB() {
        return this._makeUserProxy(db);
    }
    get FileStorage() {
        return this._fileStorage;
    }
}

/**
 * @internal
 */
function setupPluginUserInstance(pluginBaseInfo, pluginCaller) {
    return new LSPluginUser(pluginBaseInfo, pluginCaller);
}
if (window.__LSP__HOST__ == null) { // Entry of iframe mode
    const caller = new _LSPlugin_caller__WEBPACK_IMPORTED_MODULE_1__.LSPluginCaller(null);
    // @ts-ignore
    window.logseq = setupPluginUserInstance({}, caller);
}


/***/ }),

/***/ "./src/helpers.ts":
/*!************************!*\
  !*** ./src/helpers.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "IS_DEV": () => (/* binding */ IS_DEV),
/* harmony export */   "getAppPathRoot": () => (/* binding */ getAppPathRoot),
/* harmony export */   "getSDKPathRoot": () => (/* binding */ getSDKPathRoot),
/* harmony export */   "isObject": () => (/* binding */ isObject),
/* harmony export */   "deepMerge": () => (/* binding */ deepMerge),
/* harmony export */   "genID": () => (/* binding */ genID),
/* harmony export */   "ucFirst": () => (/* binding */ ucFirst),
/* harmony export */   "withFileProtocol": () => (/* binding */ withFileProtocol),
/* harmony export */   "deferred": () => (/* binding */ deferred),
/* harmony export */   "invokeHostExportedApi": () => (/* binding */ invokeHostExportedApi),
/* harmony export */   "setupIframeSandbox": () => (/* binding */ setupIframeSandbox),
/* harmony export */   "setupInjectedStyle": () => (/* binding */ setupInjectedStyle),
/* harmony export */   "setupInjectedUI": () => (/* binding */ setupInjectedUI),
/* harmony export */   "transformableEvent": () => (/* binding */ transformableEvent),
/* harmony export */   "setupInjectedTheme": () => (/* binding */ setupInjectedTheme)
/* harmony export */ });
/* harmony import */ var snake_case__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! snake-case */ "./node_modules/snake-case/dist.es2015/index.js");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! path */ "./node_modules/path/path.js");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_0__);


const IS_DEV = "development" === 'development';
let _appPathRoot;
async function getAppPathRoot() {
    if (_appPathRoot) {
        return _appPathRoot;
    }
    return (_appPathRoot =
        await invokeHostExportedApi('_callApplication', 'getAppPath'));
}
async function getSDKPathRoot() {
    if (IS_DEV) {
        // TODO: cache in preference file
        return localStorage.getItem('LSP_DEV_SDK_ROOT') || 'http://localhost:8080';
    }
    const appPathRoot = await getAppPathRoot();
    return path__WEBPACK_IMPORTED_MODULE_0__.join(appPathRoot, 'js');
}
function isObject(item) {
    return (item === Object(item) && !Array.isArray(item));
}
function deepMerge(target, ...sources) {
    // return the target if no sources passed
    if (!sources.length) {
        return target;
    }
    const result = target;
    if (isObject(result)) {
        const len = sources.length;
        for (let i = 0; i < len; i += 1) {
            const elm = sources[i];
            if (isObject(elm)) {
                for (const key in elm) {
                    if (elm.hasOwnProperty(key)) {
                        if (isObject(elm[key])) {
                            if (!result[key] || !isObject(result[key])) {
                                result[key] = {};
                            }
                            deepMerge(result[key], elm[key]);
                        }
                        else {
                            if (Array.isArray(result[key]) && Array.isArray(elm[key])) {
                                // concatenate the two arrays and remove any duplicate primitive values
                                result[key] = Array.from(new Set(result[key].concat(elm[key])));
                            }
                            else {
                                result[key] = elm[key];
                            }
                        }
                    }
                }
            }
        }
    }
    return result;
}
function genID() {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
}
function ucFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function withFileProtocol(path) {
    if (!path)
        return '';
    const reg = /^(http|file|assets)/;
    if (!reg.test(path)) {
        path = 'file://' + path;
    }
    return path;
}
/**
 * @param timeout milliseconds
 * @param tag string
 */
function deferred(timeout, tag) {
    let resolve, reject;
    let settled = false;
    const timeFn = (r) => {
        return (v) => {
            timeout && clearTimeout(timeout);
            r(v);
            settled = true;
        };
    };
    const promise = new Promise((resolve1, reject1) => {
        resolve = timeFn(resolve1);
        reject = timeFn(reject1);
        if (timeout) {
            // @ts-ignore
            timeout = setTimeout(() => reject(new Error(`[deferred timeout] ${tag}`)), timeout);
        }
    });
    return {
        created: Date.now(),
        setTag: (t) => tag = t,
        resolve, reject, promise,
        get settled() {
            return settled;
        }
    };
}
function invokeHostExportedApi(method, ...args) {
    const method1 = (0,snake_case__WEBPACK_IMPORTED_MODULE_1__.snakeCase)(method);
    // @ts-ignore
    const logseqHostExportedApi = window.logseq?.api || {};
    const fn = logseqHostExportedApi[method1] || window.apis[method1] ||
        logseqHostExportedApi[method] || window.apis[method];
    if (!fn) {
        throw new Error(`Not existed method #${method}`);
    }
    return typeof fn !== 'function' ? fn : fn.apply(null, args);
}
function setupIframeSandbox(props, target) {
    const iframe = document.createElement('iframe');
    iframe.classList.add('lsp-iframe-sandbox');
    Object.entries(props).forEach(([k, v]) => {
        iframe.setAttribute(k, v);
    });
    target.appendChild(iframe);
    return async () => {
        target.removeChild(iframe);
    };
}
function setupInjectedStyle(style, attrs) {
    const key = attrs['data-injected-style'];
    let el = key && document.querySelector(`[data-injected-style=${key}]`);
    if (el) {
        el.textContent = style;
        return;
    }
    el = document.createElement('style');
    el.textContent = style;
    attrs && Object.entries(attrs).forEach(([k, v]) => {
        el.setAttribute(k, v);
    });
    document.head.append(el);
    return () => {
        document.head.removeChild(el);
    };
}
function setupInjectedUI(ui, attrs) {
    const pl = this;
    let selector = '';
    if ('slot' in ui) {
        selector = `#${ui.slot}`;
    }
    else {
        selector = ui.path;
    }
    const target = selector && document.querySelector(selector);
    if (!target) {
        console.error(`${this.debugTag} can not resolve selector target ${selector}`);
        return;
    }
    const key = `${ui.key}-${pl.id}`;
    let el = document.querySelector(`div[data-injected-ui="${key}"]`);
    if (el) {
        el.innerHTML = ui.template;
        return;
    }
    el = document.createElement('div');
    el.dataset.injectedUi = key || '';
    // TODO: Support more
    el.innerHTML = ui.template;
    attrs && Object.entries(attrs).forEach(([k, v]) => {
        el.setAttribute(k, v);
    });
    target.appendChild(el);
    // TODO: How handle events
    ['click', 'focus', 'focusin', 'focusout', 'blur', 'dblclick',
        'keyup', 'keypress', 'keydown', 'change', 'input'].forEach((type) => {
        el.addEventListener(type, (e) => {
            const target = e.target;
            const trigger = target.closest(`[data-on-${type}]`);
            if (!trigger)
                return;
            const msgType = trigger.dataset[`on${ucFirst(type)}`];
            msgType && pl.caller?.callUserModel(msgType, transformableEvent(trigger, e));
        }, false);
    });
    return () => {
        target.removeChild(el);
    };
}
function transformableEvent(target, e) {
    const obj = {};
    if (target) {
        const ds = target.dataset;
        const FLAG_RECT = 'rect';
        ['value', 'id', 'className',
            'dataset', FLAG_RECT
        ].forEach((k) => {
            let v;
            switch (k) {
                case FLAG_RECT:
                    if (!ds.hasOwnProperty(FLAG_RECT))
                        return;
                    v = target.getBoundingClientRect().toJSON();
                    break;
                default:
                    v = target[k];
            }
            if (typeof v === 'object') {
                v = { ...v };
            }
            obj[k] = v;
        });
    }
    return obj;
}
let injectedThemeEffect = null;
function setupInjectedTheme(url) {
    injectedThemeEffect?.call();
    if (!url)
        return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    return (injectedThemeEffect = () => {
        document.head.removeChild(link);
        injectedThemeEffect = null;
    });
}


/***/ }),

/***/ "./src/modules/LSPlugin.Storage.ts":
/*!*****************************************!*\
  !*** ./src/modules/LSPlugin.Storage.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "LSPluginFileStorage": () => (/* binding */ LSPluginFileStorage)
/* harmony export */ });
/**
 * A storage based on local files under specific context
 */
class LSPluginFileStorage {
    /**
     * @param ctx
     */
    constructor(ctx) {
        this.ctx = ctx;
    }
    /**
     * plugin id
     */
    get ctxId() {
        return this.ctx.baseInfo.id;
    }
    /**
     * @param key A string as file name that support nested directory
     * @param value Storage value
     */
    setItem(key, value) {
        return this.ctx.caller.callAsync(`api:call`, {
            method: 'write-plugin-storage-file',
            args: [this.ctxId, key, value]
        });
    }
    /**
     * @param key
     */
    getItem(key) {
        return this.ctx.caller.callAsync(`api:call`, {
            method: 'read-plugin-storage-file',
            args: [this.ctxId, key]
        });
    }
    /**
     * @param key
     */
    removeItem(key) {
        return this.ctx.caller.call(`api:call`, {
            method: 'unlink-plugin-storage-file',
            args: [this.ctxId, key]
        });
    }
    /**
     * Clears the storage
     */
    clear() {
        return this.ctx.caller.call(`api:call`, {
            method: 'clear-plugin-storage-files',
            args: [this.ctxId]
        });
    }
    /**
     * @param key
     */
    hasItem(key) {
        return this.ctx.caller.callAsync(`api:call`, {
            method: 'exist-plugin-storage-file',
            args: [this.ctxId, key]
        });
    }
}



/***/ }),

/***/ "./node_modules/tslib/tslib.es6.js":
/*!*****************************************!*\
  !*** ./node_modules/tslib/tslib.es6.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "__extends": () => (/* binding */ __extends),
/* harmony export */   "__assign": () => (/* binding */ __assign),
/* harmony export */   "__rest": () => (/* binding */ __rest),
/* harmony export */   "__decorate": () => (/* binding */ __decorate),
/* harmony export */   "__param": () => (/* binding */ __param),
/* harmony export */   "__metadata": () => (/* binding */ __metadata),
/* harmony export */   "__awaiter": () => (/* binding */ __awaiter),
/* harmony export */   "__generator": () => (/* binding */ __generator),
/* harmony export */   "__createBinding": () => (/* binding */ __createBinding),
/* harmony export */   "__exportStar": () => (/* binding */ __exportStar),
/* harmony export */   "__values": () => (/* binding */ __values),
/* harmony export */   "__read": () => (/* binding */ __read),
/* harmony export */   "__spread": () => (/* binding */ __spread),
/* harmony export */   "__spreadArrays": () => (/* binding */ __spreadArrays),
/* harmony export */   "__spreadArray": () => (/* binding */ __spreadArray),
/* harmony export */   "__await": () => (/* binding */ __await),
/* harmony export */   "__asyncGenerator": () => (/* binding */ __asyncGenerator),
/* harmony export */   "__asyncDelegator": () => (/* binding */ __asyncDelegator),
/* harmony export */   "__asyncValues": () => (/* binding */ __asyncValues),
/* harmony export */   "__makeTemplateObject": () => (/* binding */ __makeTemplateObject),
/* harmony export */   "__importStar": () => (/* binding */ __importStar),
/* harmony export */   "__importDefault": () => (/* binding */ __importDefault),
/* harmony export */   "__classPrivateFieldGet": () => (/* binding */ __classPrivateFieldGet),
/* harmony export */   "__classPrivateFieldSet": () => (/* binding */ __classPrivateFieldSet)
/* harmony export */ });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var __createBinding = Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});

function __exportStar(m, o) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

/** @deprecated */
function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

/** @deprecated */
function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

function __spreadArray(to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

var __setModuleDefault = Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
}

function __classPrivateFieldSet(receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
}


/***/ }),

/***/ "./node_modules/util/support/isBufferBrowser.js":
/*!******************************************************!*\
  !*** ./node_modules/util/support/isBufferBrowser.js ***!
  \******************************************************/
/***/ ((module) => {

module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}

/***/ }),

/***/ "./node_modules/util/util.js":
/*!***********************************!*\
  !*** ./node_modules/util/util.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/* provided dependency */ var process = __webpack_require__(/*! process/browser */ "./node_modules/process/browser.js");
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(__webpack_require__.g.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = __webpack_require__(/*! ./support/isBuffer */ "./node_modules/util/support/isBufferBrowser.js");

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = __webpack_require__(/*! inherits */ "./node_modules/inherits/inherits_browser.js");

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!******************************!*\
  !*** ./src/LSPlugin.core.ts ***!
  \******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "PluginLocal": () => (/* binding */ PluginLocal),
/* harmony export */   "pluginHelpers": () => (/* reexport module object */ _helpers__WEBPACK_IMPORTED_MODULE_1__),
/* harmony export */   "setupPluginCore": () => (/* binding */ setupPluginCore)
/* harmony export */ });
/* harmony import */ var eventemitter3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! eventemitter3 */ "./node_modules/eventemitter3/index.js");
/* harmony import */ var eventemitter3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(eventemitter3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _helpers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./helpers */ "./src/helpers.ts");
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js");
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(debug__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _LSPlugin_caller__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./LSPlugin.caller */ "./src/LSPlugin.caller.ts");
/* harmony import */ var snake_case__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! snake-case */ "./node_modules/snake-case/dist.es2015/index.js");
/* harmony import */ var dompurify__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! dompurify */ "./node_modules/dompurify/dist/purify.js");
/* harmony import */ var dompurify__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(dompurify__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! path */ "./node_modules/path/path.js");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_5__);








const debug = debug__WEBPACK_IMPORTED_MODULE_2___default()('LSPlugin:core');
/**
 * User settings
 */
class PluginSettings extends (eventemitter3__WEBPACK_IMPORTED_MODULE_0___default()) {
    constructor(_userPluginSettings) {
        super();
        this._userPluginSettings = _userPluginSettings;
        this._settings = {
            disabled: false
        };
        Object.assign(this._settings, _userPluginSettings);
    }
    get(k) {
        return this._settings[k];
    }
    set(k, v) {
        const o = (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.deepMerge)({}, this._settings);
        if (typeof k === 'string') {
            if (this._settings[k] == v)
                return;
            this._settings[k] = v;
        }
        else if ((0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isObject)(k)) {
            (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.deepMerge)(this._settings, k);
        }
        else {
            return;
        }
        this.emit('change', Object.assign({}, this._settings), o);
    }
    toJSON() {
        return this._settings;
    }
}
class PluginLogger extends (eventemitter3__WEBPACK_IMPORTED_MODULE_0___default()) {
    constructor(_tag) {
        super();
        this._tag = _tag;
        this._logs = [];
    }
    write(type, payload) {
        let msg = payload.reduce((ac, it) => {
            if (it && it instanceof Error) {
                ac += `${it.message} ${it.stack}`;
            }
            else {
                ac += it.toString();
            }
            return ac;
        }, `[${this._tag}][${new Date().toLocaleTimeString()}] `);
        this._logs.push([type, msg]);
        this.emit('change');
    }
    clear() {
        this._logs = [];
        this.emit('change');
    }
    info(...args) {
        this.write('INFO', args);
    }
    error(...args) {
        this.write('ERROR', args);
    }
    warn(...args) {
        this.write('WARN', args);
    }
    toJSON() {
        return this._logs;
    }
}
var PluginLocalLoadStatus;
(function (PluginLocalLoadStatus) {
    PluginLocalLoadStatus["LOADING"] = "loading";
    PluginLocalLoadStatus["UNLOADING"] = "unloading";
    PluginLocalLoadStatus["LOADED"] = "loaded";
    PluginLocalLoadStatus["UNLOADED"] = "unload";
    PluginLocalLoadStatus["ERROR"] = "error";
})(PluginLocalLoadStatus || (PluginLocalLoadStatus = {}));
function initUserSettingsHandlers(pluginLocal) {
    const _ = (label) => `settings:${label}`;
    pluginLocal.on(_('update'), (attrs) => {
        if (!attrs)
            return;
        pluginLocal.settings?.set(attrs);
    });
}
function initMainUIHandlers(pluginLocal) {
    const _ = (label) => `main-ui:${label}`;
    pluginLocal.on(_('visible'), ({ visible, toggle, cursor }) => {
        const el = pluginLocal.getMainUI();
        el?.classList[toggle ? 'toggle' : (visible ? 'add' : 'remove')]('visible');
        // pluginLocal.caller!.callUserModel(LSPMSG, { type: _('visible'), payload: visible })
        // auto focus frame
        if (visible) {
            if (!pluginLocal.shadow && el) {
                el.contentWindow?.focus();
            }
        }
        if (cursor) {
            (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)('restore_editing_cursor');
        }
    });
    pluginLocal.on(_('attrs'), (attrs) => {
        const el = pluginLocal.getMainUI();
        Object.entries(attrs).forEach(([k, v]) => {
            el?.setAttribute(k, v);
        });
    });
    pluginLocal.on(_('style'), (style) => {
        const el = pluginLocal.getMainUI();
        Object.entries(style).forEach(([k, v]) => {
            el.style[k] = v;
        });
    });
}
function initProviderHandlers(pluginLocal) {
    let _ = (label) => `provider:${label}`;
    let themed = false;
    pluginLocal.on(_('theme'), (theme) => {
        pluginLocal.themeMgr.registerTheme(pluginLocal.id, theme);
        if (!themed) {
            pluginLocal._dispose(() => {
                pluginLocal.themeMgr.unregisterTheme(pluginLocal.id);
            });
            themed = true;
        }
    });
    pluginLocal.on(_('style'), (style) => {
        let key;
        if (typeof style !== 'string') {
            key = style.key;
            style = style.style;
        }
        if (!style || !style.trim())
            return;
        pluginLocal._dispose((0,_helpers__WEBPACK_IMPORTED_MODULE_1__.setupInjectedStyle)(style, {
            'data-injected-style': key ? `${key}-${pluginLocal.id}` : '',
            'data-ref': pluginLocal.id
        }));
    });
    pluginLocal.on(_('ui'), (ui) => {
        pluginLocal._onHostMounted(() => {
            // safe template
            ui.template = dompurify__WEBPACK_IMPORTED_MODULE_4___default().sanitize(ui.template);
            pluginLocal._dispose(_helpers__WEBPACK_IMPORTED_MODULE_1__.setupInjectedUI.call(pluginLocal, ui, {
                'data-ref': pluginLocal.id
            }));
        });
    });
}
function initApiProxyHandlers(pluginLocal) {
    let _ = (label) => `api:${label}`;
    pluginLocal.on(_('call'), async (payload) => {
        let ret;
        try {
            ret = await (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)(payload.method, ...payload.args);
        }
        catch (e) {
            ret = {
                [_LSPlugin_caller__WEBPACK_IMPORTED_MODULE_3__.LSPMSG_ERROR_TAG]: e,
            };
        }
        const { _sync } = payload;
        if (pluginLocal.shadow) {
            if (payload.actor) {
                payload.actor.resolve(ret);
            }
            return;
        }
        if (_sync != null) {
            const reply = (result) => {
                pluginLocal.caller?.callUserModel(_LSPlugin_caller__WEBPACK_IMPORTED_MODULE_3__.LSPMSG_SYNC, {
                    result, _sync
                });
            };
            Promise.resolve(ret).then(reply, reply);
        }
    });
}
class IllegalPluginPackageError extends Error {
    constructor(message) {
        super(message);
        this.name = IllegalPluginPackageError.name;
    }
}
class ExistedImportedPluginPackageError extends Error {
    constructor(message) {
        super(message);
        this.name = ExistedImportedPluginPackageError.name;
    }
}
/**
 * Host plugin for local
 */
class PluginLocal extends (eventemitter3__WEBPACK_IMPORTED_MODULE_0___default()) {
    /**
     * @param _options
     * @param _themeMgr
     * @param _ctx
     */
    constructor(_options, _themeMgr, _ctx) {
        super();
        this._options = _options;
        this._themeMgr = _themeMgr;
        this._ctx = _ctx;
        this._disposes = [];
        this._status = PluginLocalLoadStatus.UNLOADED;
        this._id = _options.key || (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.genID)();
        initUserSettingsHandlers(this);
        initMainUIHandlers(this);
        initProviderHandlers(this);
        initApiProxyHandlers(this);
    }
    async _setupUserSettings() {
        const { _options } = this;
        const key = _options.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_' + this.id;
        const logger = _options.logger = new PluginLogger('Loader');
        try {
            const [userSettingsFilePath, userSettings] = await (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)('load_plugin_user_settings', key);
            this._userSettingsFile = userSettingsFilePath;
            const settings = _options.settings = new PluginSettings(userSettings);
            // observe settings
            settings.on('change', (a, b) => {
                debug('linked settings change', a);
                if (!a.disabled && b.disabled) {
                    // Enable plugin
                    this.load();
                }
                if (a.disabled && !b.disabled) {
                    // Disable plugin
                    this.unload();
                }
                if (a) {
                    (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)(`save_plugin_user_settings`, key, a);
                }
            });
        }
        catch (e) {
            debug('[load plugin user settings Error]', e);
            logger?.error(e);
        }
    }
    getMainUI() {
        if (this.shadow) {
            return this.caller?._getSandboxShadowContainer();
        }
        return this.caller?._getSandboxIframeContainer();
    }
    async _preparePackageConfigs() {
        const { url } = this._options;
        let pkg;
        try {
            if (!url) {
                throw new Error('Can not resolve package config location');
            }
            debug('prepare package root', url);
            pkg = await (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)('load_plugin_config', url);
            if (!pkg || (pkg = JSON.parse(pkg), !pkg)) {
                throw new Error(`Parse package config error #${url}/package.json`);
            }
        }
        catch (e) {
            throw new IllegalPluginPackageError(e.message);
        }
        // Pick legal attrs
        ['name', 'author', 'repository', 'version', 'description'].forEach(k => {
            this._options[k] = pkg[k];
        });
        // TODO: How with local protocol
        const localRoot = this._localRoot = url;
        const logseq = pkg.logseq || {};
        const makeFullUrl = (loc, useFileProtocol = false) => {
            if (!loc)
                return;
            const reg = /^(http|file|assets)/;
            if (!reg.test(loc)) {
                const url = path__WEBPACK_IMPORTED_MODULE_5__.join(localRoot, loc);
                loc = reg.test(url) ? url : ('file://' + url);
            }
            return useFileProtocol ? loc : loc.replace('file:', 'assets:');
        };
        const validateMain = (main) => main && /\.(js|html)$/.test(main);
        // Entry from main
        if (validateMain(pkg.main)) {
            this._options.entry = makeFullUrl(pkg.main, true);
            if (logseq.mode) {
                this._options.mode = logseq.mode;
            }
        }
        const icon = logseq.icon || pkg.icon;
        if (icon) {
            this._options.icon = makeFullUrl(icon);
        }
        // TODO: strategy for Logseq plugins center
        if (logseq.id) {
            this._id = logseq.id;
        }
        else {
            logseq.id = this.id;
            try {
                await (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)('save_plugin_config', url, { ...pkg, logseq });
            }
            catch (e) {
                debug('[save plugin ID Error] ', e);
            }
        }
        // Validate id
        const { registeredPlugins, isRegistering } = this._ctx;
        if (isRegistering && registeredPlugins.has(logseq.id)) {
            throw new ExistedImportedPluginPackageError('prepare package Error');
        }
        return async () => {
            try {
                // 0. Install Themes
                let themes = logseq.themes;
                if (themes) {
                    await this._loadConfigThemes(Array.isArray(themes) ? themes : [themes]);
                }
            }
            catch (e) {
                debug('[prepare package effect Error]', e);
            }
        };
    }
    async _tryToNormalizeEntry() {
        let { entry, settings } = this.options;
        let devEntry = settings?.get('_devEntry');
        if (devEntry) {
            this._options.entry = devEntry;
            return;
        }
        if (!entry.endsWith('.js'))
            return;
        let sdkPathRoot = await (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.getSDKPathRoot)();
        let entryPath = await (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)('write_user_tmp_file', `${this._id}_index.html`, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>logseq plugin entry</title>
    <script src="${sdkPathRoot}/lsplugin.user.js"></script>
  </head>
  <body>
  <div id="app"></div>
  <script src="${entry}"></script>
  </body>
</html>`);
        this._options.entry = (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.withFileProtocol)(entryPath);
    }
    async _loadConfigThemes(themes) {
        themes.forEach((options) => {
            if (!options.url)
                return;
            if (!options.url.startsWith('http') && this._localRoot) {
                options.url = path__WEBPACK_IMPORTED_MODULE_5__.join(this._localRoot, options.url);
                // file:// for native
                if (!options.url.startsWith('file:')) {
                    options.url = 'assets://' + options.url;
                }
            }
            // @ts-ignore
            this.emit('provider:theme', options);
        });
    }
    async load(readyIndicator) {
        if (this.pending) {
            return;
        }
        this._status = PluginLocalLoadStatus.LOADING;
        this._loadErr = undefined;
        try {
            let installPackageThemes = () => Promise.resolve();
            if (!this.options.entry) { // Themes package no entry field
                installPackageThemes = await this._preparePackageConfigs();
            }
            if (!this.settings) {
                await this._setupUserSettings();
            }
            if (!this.disabled) {
                await installPackageThemes.call(null);
            }
            if (this.disabled || !this.options.entry) {
                return;
            }
            await this._tryToNormalizeEntry();
            this._caller = new _LSPlugin_caller__WEBPACK_IMPORTED_MODULE_3__.LSPluginCaller(this);
            await this._caller.connectToChild();
            const readyFn = () => {
                this._caller?.callUserModel(_LSPlugin_caller__WEBPACK_IMPORTED_MODULE_3__.LSPMSG_READY);
            };
            if (readyIndicator) {
                readyIndicator.promise.then(readyFn);
            }
            else {
                readyFn();
            }
            this._disposes.push(async () => {
                await this._caller?.destroy();
            });
        }
        catch (e) {
            debug('[Load Plugin Error] ', e);
            this.logger?.error(e);
            this._status = PluginLocalLoadStatus.ERROR;
            this._loadErr = e;
        }
        finally {
            if (!this._loadErr) {
                this._status = PluginLocalLoadStatus.LOADED;
            }
        }
    }
    async reload() {
        debug('TODO: reload plugin', this.id);
    }
    /**
     * @param unregister If true delete plugin files
     */
    async unload(unregister = false) {
        if (this.pending) {
            return;
        }
        if (unregister) {
            await this.unload();
            if (this.isInstalledInUserRoot) {
                debug('TODO: remove plugin local files from user home root :)');
            }
            return;
        }
        try {
            this._status = PluginLocalLoadStatus.UNLOADING;
            const eventBeforeUnload = { unregister };
            // sync call
            try {
                await this._caller?.callUserModel((0,_LSPlugin_caller__WEBPACK_IMPORTED_MODULE_3__.AWAIT_LSPMSGFn)(_LSPlugin_caller__WEBPACK_IMPORTED_MODULE_3__.LSPMSG_BEFORE_UNLOAD), eventBeforeUnload);
                this.emit('beforeunload', eventBeforeUnload);
            }
            catch (e) {
                console.error('[beforeunload Error]', e);
            }
            await this.dispose();
            this.emit('unloaded');
        }
        catch (e) {
            debug('[plugin unload Error]', e);
        }
        finally {
            this._status = PluginLocalLoadStatus.UNLOADED;
        }
    }
    async dispose() {
        for (const fn of this._disposes) {
            try {
                fn && (await fn());
            }
            catch (e) {
                console.error(this.debugTag, 'dispose Error', e);
            }
        }
        // clear
        this._disposes = [];
    }
    _dispose(fn) {
        if (!fn)
            return;
        this._disposes.push(fn);
    }
    _onHostMounted(callback) {
        const actor = this._ctx.hostMountedActor;
        if (!actor || actor.settled) {
            callback();
        }
        else {
            actor?.promise.then(callback);
        }
    }
    get isInstalledInUserRoot() {
        const userRoot = this._ctx.options.localUserConfigRoot;
        const plugRoot = this._localRoot;
        return userRoot && plugRoot && plugRoot.startsWith(userRoot);
    }
    get loaded() {
        return this._status === PluginLocalLoadStatus.LOADED;
    }
    get pending() {
        return [PluginLocalLoadStatus.LOADING, PluginLocalLoadStatus.UNLOADING]
            .includes(this._status);
    }
    get status() {
        return this._status;
    }
    get settings() {
        return this.options.settings;
    }
    get logger() {
        return this.options.logger;
    }
    get disabled() {
        return this.settings?.get('disabled');
    }
    get caller() {
        return this._caller;
    }
    get id() {
        return this._id;
    }
    get shadow() {
        return this.options.mode === 'shadow';
    }
    get options() {
        return this._options;
    }
    get themeMgr() {
        return this._themeMgr;
    }
    get debugTag() {
        const name = this._options?.name;
        return `#${this._id} ${name ?? ''}`;
    }
    get localRoot() {
        return this._localRoot || this._options.url;
    }
    get loadErr() {
        return this._loadErr;
    }
    get userSettingsFile() {
        return this._userSettingsFile;
    }
    toJSON() {
        const json = { ...this.options };
        json.id = this.id;
        json.err = this.loadErr;
        json.usf = this.userSettingsFile;
        return json;
    }
}
/**
 * Host plugin core
 */
class LSPluginCore extends (eventemitter3__WEBPACK_IMPORTED_MODULE_0___default()) {
    /**
     * @param _options
     */
    constructor(_options) {
        super();
        this._options = _options;
        this._isRegistering = false;
        this._hostMountedActor = (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.deferred)();
        this._userPreferences = {};
        this._registeredThemes = new Map();
        this._registeredPlugins = new Map();
    }
    async loadUserPreferences() {
        try {
            const settings = await (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)(`load_user_preferences`);
            if (settings) {
                Object.assign(this._userPreferences, settings);
            }
        }
        catch (e) {
            debug('[load user preferences Error]', e);
        }
    }
    async saveUserPreferences(settings) {
        try {
            if (settings) {
                Object.assign(this._userPreferences, settings);
            }
            await (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)(`save_user_preferences`, this._userPreferences);
        }
        catch (e) {
            debug('[save user preferences Error]', e);
        }
    }
    async activateUserPreferences() {
        const { theme } = this._userPreferences;
        // 0. theme
        if (theme) {
            await this.selectTheme(theme, false);
        }
    }
    /**
     * @param plugins
     * @param initial
     */
    async register(plugins, initial = false) {
        if (!Array.isArray(plugins)) {
            await this.register([plugins]);
            return;
        }
        try {
            this._isRegistering = true;
            const userConfigRoot = this._options.localUserConfigRoot;
            const readyIndicator = this._readyIndicator = (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.deferred)();
            await this.loadUserPreferences();
            const externals = new Set(this._userPreferences.externals || []);
            if (initial) {
                plugins = plugins.concat([...externals].filter(url => {
                    return !plugins.length || plugins.every((p) => !p.entry && (p.url !== url));
                }).map(url => ({ url })));
            }
            for (const pluginOptions of plugins) {
                const { url } = pluginOptions;
                const pluginLocal = new PluginLocal(pluginOptions, this, this);
                const timeLabel = `[LOAD Plugin] ${pluginLocal.debugTag}`;
                console.time(timeLabel);
                await pluginLocal.load(readyIndicator);
                const { loadErr } = pluginLocal;
                if (loadErr) {
                    debug(`[Failed LOAD Plugin] #`, pluginOptions);
                    this.emit('error', loadErr);
                    if (loadErr instanceof IllegalPluginPackageError ||
                        loadErr instanceof ExistedImportedPluginPackageError) {
                        // TODO: notify global log system?
                        continue;
                    }
                }
                console.timeEnd(timeLabel);
                pluginLocal.settings?.on('change', (a) => {
                    this.emit('settings-changed', pluginLocal.id, a);
                    pluginLocal.caller?.callUserModel(_LSPlugin_caller__WEBPACK_IMPORTED_MODULE_3__.LSPMSG_SETTINGS, { payload: a });
                });
                this._registeredPlugins.set(pluginLocal.id, pluginLocal);
                this.emit('registered', pluginLocal);
                // external plugins
                if (!pluginLocal.isInstalledInUserRoot) {
                    externals.add(url);
                }
            }
            await this.saveUserPreferences({ externals: Array.from(externals) });
            await this.activateUserPreferences();
            readyIndicator.resolve('ready');
        }
        catch (e) {
            console.error(e);
        }
        finally {
            this._isRegistering = false;
        }
    }
    async reload(plugins) {
        if (!Array.isArray(plugins)) {
            await this.reload([plugins]);
            return;
        }
        for (const identity of plugins) {
            const p = this.ensurePlugin(identity);
            await p.reload();
        }
    }
    async unregister(plugins) {
        if (!Array.isArray(plugins)) {
            await this.unregister([plugins]);
            return;
        }
        const unregisteredExternals = [];
        for (const identity of plugins) {
            const p = this.ensurePlugin(identity);
            if (!p.isInstalledInUserRoot) {
                unregisteredExternals.push(p.options.url);
            }
            await p.unload(true);
            this._registeredPlugins.delete(identity);
            this.emit('unregistered', identity);
        }
        let externals = this._userPreferences.externals || [];
        if (externals.length && unregisteredExternals.length) {
            await this.saveUserPreferences({
                externals: externals.filter((it) => {
                    return !unregisteredExternals.includes(it);
                })
            });
        }
    }
    async enable(plugin) {
        const p = this.ensurePlugin(plugin);
        if (p.pending)
            return;
        this.emit('beforeenable');
        p.settings?.set('disabled', false);
        this.emit('enabled', p.id);
    }
    async disable(plugin) {
        const p = this.ensurePlugin(plugin);
        if (p.pending)
            return;
        this.emit('beforedisable');
        p.settings?.set('disabled', true);
        this.emit('disabled', p.id);
    }
    async _hook(ns, type, payload, pid) {
        for (const [_, p] of this._registeredPlugins) {
            if (!pid || pid === p.id) {
                p.caller?.callUserModel(_LSPlugin_caller__WEBPACK_IMPORTED_MODULE_3__.LSPMSG, {
                    ns, type: (0,snake_case__WEBPACK_IMPORTED_MODULE_6__.snakeCase)(type), payload
                });
            }
        }
    }
    hookApp(type, payload, pid) {
        this._hook(`hook:app`, type, payload, pid);
    }
    hookEditor(type, payload, pid) {
        this._hook(`hook:editor`, type, payload, pid);
    }
    _execDirective(tag, ...params) {
    }
    ensurePlugin(plugin) {
        if (plugin instanceof PluginLocal) {
            return plugin;
        }
        const p = this._registeredPlugins.get(plugin);
        if (!p) {
            throw new Error(`plugin #${plugin} not existed.`);
        }
        return p;
    }
    hostMounted() {
        this._hostMountedActor.resolve();
    }
    get registeredPlugins() {
        return this._registeredPlugins;
    }
    get options() {
        return this._options;
    }
    get readyIndicator() {
        return this._readyIndicator;
    }
    get hostMountedActor() {
        return this._hostMountedActor;
    }
    get isRegistering() {
        return this._isRegistering;
    }
    get themes() {
        return this._registeredThemes;
    }
    async registerTheme(id, opt) {
        debug('registered Theme #', id, opt);
        if (!id)
            return;
        let themes = this._registeredThemes.get(id);
        if (!themes) {
            this._registeredThemes.set(id, themes = []);
        }
        themes.push(opt);
        this.emit('theme-changed', this.themes, { id, ...opt });
    }
    async selectTheme(opt, effect = true) {
        (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.setupInjectedTheme)(opt?.url);
        this.emit('theme-selected', opt);
        effect && this.saveUserPreferences({ theme: opt });
    }
    async unregisterTheme(id) {
        debug('unregistered Theme #', id);
        if (!this._registeredThemes.has(id))
            return;
        this._registeredThemes.delete(id);
        this.emit('theme-changed', this.themes, { id });
    }
}
function setupPluginCore(options) {
    const pluginCore = new LSPluginCore(options);
    debug('=== 🔗 Setup Logseq Plugin System 🔗 ===');
    window.LSPluginCore = pluginCore;
}


})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9MU1BsdWdpbi93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2NvbW1vbi5qcyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL25vZGVfbW9kdWxlcy9kb21wdXJpZnkvZGlzdC9wdXJpZnkuanMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9ub2RlX21vZHVsZXMvZG90LWNhc2UvZGlzdC5lczIwMTUvaW5kZXguanMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9ub2RlX21vZHVsZXMvZXZlbnRlbWl0dGVyMy9pbmRleC5qcyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwid2VicGFjazovL0xTUGx1Z2luLy4vbm9kZV9tb2R1bGVzL2xvd2VyLWNhc2UvZGlzdC5lczIwMTUvaW5kZXguanMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9ub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9ub2RlX21vZHVsZXMvbm8tY2FzZS9kaXN0LmVzMjAxNS9pbmRleC5qcyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL25vZGVfbW9kdWxlcy9wYXRoL3BhdGguanMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9ub2RlX21vZHVsZXMvcG9zdG1hdGUvYnVpbGQvcG9zdG1hdGUuZXMuanMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwid2VicGFjazovL0xTUGx1Z2luLy4vbm9kZV9tb2R1bGVzL3NuYWtlLWNhc2UvZGlzdC5lczIwMTUvaW5kZXguanMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9zcmMvTFNQbHVnaW4uY2FsbGVyLnRzIiwid2VicGFjazovL0xTUGx1Z2luLy4vc3JjL0xTUGx1Z2luLnNoYWRvdy50cyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL3NyYy9MU1BsdWdpbi50cyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL3NyYy9MU1BsdWdpbi51c2VyLnRzIiwid2VicGFjazovL0xTUGx1Z2luLy4vc3JjL2hlbHBlcnMudHMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9zcmMvbW9kdWxlcy9MU1BsdWdpbi5TdG9yYWdlLnRzIiwid2VicGFjazovL0xTUGx1Z2luLy4vbm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwid2VicGFjazovL0xTUGx1Z2luLy4vbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIndlYnBhY2s6Ly9MU1BsdWdpbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9MU1BsdWdpbi93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9MU1BsdWdpbi93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9MU1BsdWdpbi93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL0xTUGx1Z2luL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9zcmMvTFNQbHVnaW4uY29yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QsTzs7Ozs7Ozs7OztBQ1ZBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxrQkFBa0I7QUFDbEIsWUFBWTtBQUNaLFlBQVk7QUFDWixpQkFBaUI7QUFDakIsZUFBZTtBQUNmLGVBQWU7QUFDZjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEO0FBQ0E7QUFDQTs7QUFFQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFOztBQUVGO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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NEM7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7QUFDQTtBQUNBOztBQUVBO0FBQ0EsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0IsaUJBQWlCO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLFlBQVk7QUFDM0IsZUFBZSxPQUFPO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLE9BQU87QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQixPQUFPO0FBQ3ZCLGdCQUFnQixPQUFPO0FBQ3ZCLGdCQUFnQixPQUFPO0FBQ3ZCLGdCQUFnQixRQUFRO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCO0FBQ3ZCOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSxPQUFPO0FBQ3RCLGVBQWUsU0FBUztBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSxPQUFPO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQixPQUFPO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUEsQ0FBQztBQUNEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNqMENpQztBQUNBO0FBQzFCO0FBQ1AsNkJBQTZCLGNBQWM7QUFDM0MsV0FBVywrQ0FBTSxRQUFRLCtDQUFRLEVBQUUsaUJBQWlCO0FBQ3BEO0FBQ0EsaUM7Ozs7Ozs7Ozs7O0FDTmE7O0FBRWI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxTQUFTO0FBQ3BCLFdBQVcsRUFBRTtBQUNiLFdBQVcsUUFBUTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsYUFBYTtBQUN4QixXQUFXLGdCQUFnQjtBQUMzQixXQUFXLFNBQVM7QUFDcEIsV0FBVyxFQUFFO0FBQ2IsV0FBVyxRQUFRO0FBQ25CLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLGFBQWE7QUFDeEIsV0FBVyxnQkFBZ0I7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLGdCQUFnQjtBQUMzQixhQUFhLE1BQU07QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLHlEQUF5RCxPQUFPO0FBQ2hFO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLGdCQUFnQjtBQUMzQixhQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLGdCQUFnQjtBQUMzQixhQUFhLFFBQVE7QUFDckI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHlDQUF5QyxTQUFTO0FBQ2xEO0FBQ0E7O0FBRUE7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQSxlQUFlLFlBQVk7QUFDM0I7O0FBRUE7QUFDQSwyREFBMkQ7QUFDM0QsK0RBQStEO0FBQy9ELG1FQUFtRTtBQUNuRSx1RUFBdUU7QUFDdkU7QUFDQSwwREFBMEQsU0FBUztBQUNuRTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxnQkFBZ0I7QUFDM0IsV0FBVyxTQUFTO0FBQ3BCLFdBQVcsRUFBRTtBQUNiLGFBQWEsYUFBYTtBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsZ0JBQWdCO0FBQzNCLFdBQVcsU0FBUztBQUNwQixXQUFXLEVBQUU7QUFDYixhQUFhLGFBQWE7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLGdCQUFnQjtBQUMzQixXQUFXLFNBQVM7QUFDcEIsV0FBVyxFQUFFO0FBQ2IsV0FBVyxRQUFRO0FBQ25CLGFBQWEsYUFBYTtBQUMxQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0gsMkRBQTJELFlBQVk7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLGdCQUFnQjtBQUMzQixhQUFhLGFBQWE7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBSSxJQUE2QjtBQUNqQztBQUNBOzs7Ozs7Ozs7OztBQy9VQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBLGdFQUFnRSxvQkFBb0IsRUFBRTtBQUN0RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0EsaUM7Ozs7Ozs7Ozs7QUMvQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsY0FBYztBQUN6QixXQUFXLE9BQU87QUFDbEIsWUFBWSxNQUFNO0FBQ2xCLFlBQVk7QUFDWjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCLFlBQVk7QUFDWjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCLFlBQVk7QUFDWjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQixZQUFZO0FBQ1o7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDakt1QztBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1AsNkJBQTZCLGNBQWM7QUFDM0Msa09BQWtPLGlEQUFTO0FBQzNPO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsaUNBQWlDLEVBQUU7QUFDOUU7QUFDQSxpQzs7Ozs7Ozs7Ozs7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRWE7OztBQUdiLGdCQUFnQixPQUFPO0FBQ3ZCLFdBQVcsbUJBQU8sQ0FBQyx5Q0FBTTs7O0FBR3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixrQkFBa0I7QUFDbkM7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxRQUFRLFVBQVU7QUFDbEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsRUFBRTs7QUFFMUI7QUFDQTtBQUNBLHVCQUF1QixJQUFJOztBQUUzQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG9DQUFvQyxTQUFTO0FBQzdDO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxhQUFhLE9BQU87QUFDcEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYSxPQUFPO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7O0FBR0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxpQkFBaUIsc0JBQXNCO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9DQUFvQztBQUNwQztBQUNBLGdCQUFnQixFQUFFO0FBQ2xCLHFDQUFxQyxHQUFHO0FBQ3hDOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGlCQUFpQixZQUFZO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsK0JBQStCLDJCQUEyQjtBQUMxRDtBQUNBOztBQUVBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQSxvQkFBb0I7OztBQUdwQjtBQUNBO0FBQ0E7QUFDQSw2QkFBNkIsSUFBSTtBQUNqQzs7O0FBR0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG9DQUFvQyw4QkFBOEI7QUFDbEUseUNBQXlDLE9BQU87O0FBRWhEO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsc0JBQXNCO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxpQkFBaUIsWUFBWTtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsK0JBQStCLHNCQUFzQjtBQUNyRDtBQUNBOztBQUVBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxvQkFBb0I7QUFDcEIsb0JBQW9COzs7Ozs7Ozs7Ozs7Ozs7O0FDbm5CcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLE9BQU87QUFDbkI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVksT0FBTztBQUNuQjs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBO0FBQ0EsWUFBWSxPQUFPO0FBQ25CLFlBQVksT0FBTztBQUNuQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWMsT0FBTztBQUNyQixjQUFjLGVBQWU7QUFDN0IsY0FBYztBQUNkOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLE9BQU87QUFDbkIsWUFBWSxPQUFPO0FBQ25CLFlBQVksT0FBTztBQUNuQjtBQUNBLFlBQVk7QUFDWjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE9BQU87QUFDbEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFFBQVEsSUFBcUM7QUFDN0M7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsMEJBQTBCLFlBQVksYUFBYTtBQUNuRDtBQUNBOztBQUVBO0FBQ0EsWUFBWSxJQUFxQztBQUNqRDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsUUFBUSxJQUFxQztBQUM3QztBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxRQUFROzs7QUFHUixpRUFBaUU7OztBQUdqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxRQUFRLElBQXFDO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQSxXQUFXLE9BQU87QUFDbEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxRQUFRLElBQXFDO0FBQzdDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLFVBQVUsSUFBcUM7QUFDL0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLE9BQU87OztBQUdQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULE9BQU87QUFDUCxLQUFLO0FBQ0w7O0FBRUE7O0FBRUE7QUFDQSxRQUFRLElBQXFDO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBLFVBQVU7QUFDVjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxhQUFhLE9BQU87QUFDcEIsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWMsT0FBTztBQUNyQixjQUFjLFFBQVE7QUFDdEI7OztBQUdBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsY0FBYyxJQUFxQztBQUNuRDtBQUNBOztBQUVBOztBQUVBOztBQUVBLGNBQWMsSUFBcUM7QUFDbkQ7QUFDQTs7QUFFQTtBQUNBLFNBQVM7QUFDVDs7O0FBR0EsWUFBWSxJQUFxQztBQUNqRDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQSxZQUFZLElBQXFDO0FBQ2pEO0FBQ0E7QUFDQSxXQUFXO0FBQ1g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTOztBQUVUO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTs7QUFFQSxVQUFVLElBQXFDO0FBQy9DO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7O0FBRUE7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBLFVBQVU7QUFDVjs7O0FBR0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQSxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLE9BQU87QUFDcEIsY0FBYyxRQUFRO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWMsUUFBUTtBQUN0Qjs7O0FBR0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsY0FBYyxJQUFxQztBQUNuRDtBQUNBOztBQUVBOztBQUVBLGNBQWMsSUFBcUM7QUFDbkQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXO0FBQ1gseUNBQXlDOztBQUV6Qzs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxhQUFhOztBQUViLGdCQUFnQixJQUFxQztBQUNyRDtBQUNBO0FBQ0E7O0FBRUEsY0FBYyxJQUFxQztBQUNuRDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBLENBQUM7O0FBRUQsaUVBQWUsUUFBUSxFQUFDOzs7Ozs7Ozs7OztBQ3hleEI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixzQkFBc0I7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHFDQUFxQzs7QUFFckM7QUFDQTtBQUNBOztBQUVBLDJCQUEyQjtBQUMzQjtBQUNBO0FBQ0E7QUFDQSw0QkFBNEIsVUFBVTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDdkxMO0FBQ0U7QUFDNUI7QUFDUCw2QkFBNkIsY0FBYztBQUMzQyxXQUFXLGlEQUFPLFFBQVEsK0NBQVEsRUFBRSxpQkFBaUI7QUFDckQ7QUFDQSxpQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ05nQztBQUNTO0FBQ2Y7QUFDVztBQUNtQjtBQUN4RCxjQUFjLDRDQUFLO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEIsT0FBTyxFQUFFLEdBQUc7QUFDeEMsa0NBQWtDLFdBQVcsRUFBRSxHQUFHO0FBQ3pEO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QixzREFBWTtBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWUsU0FBUztBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdDQUF3QztBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4QixrREFBUTtBQUN0QztBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSw4QkFBOEIsa0RBQVE7QUFDdEMsMkRBQTJELFFBQVE7QUFDbkU7QUFDQSxhQUFhO0FBQ2IsdUNBQXVDLGdCQUFnQjtBQUN2RDtBQUNBLGFBQWE7QUFDYiw4QkFBOEIsb0JBQW9CO0FBQ2xELHlCQUF5QixlQUFlO0FBQ3hDO0FBQ0EsbUNBQW1DLEdBQUcsR0FBRyxLQUFLO0FBQzlDO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYiw2QkFBNkIsZ0JBQWdCO0FBQzdDLHFDQUFxQyxNQUFNO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4QixtREFBYztBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRDtBQUNsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxJQUFJO0FBQ3BEO0FBQ0E7QUFDQSw2REFBNkQsZ0JBQWdCO0FBQzdFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkNBQTJDLEtBQUs7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQSxzQ0FBc0M7QUFDdEMsc0JBQXNCLGtEQUFRO0FBQzlCO0FBQ0E7QUFDQSwwQ0FBMEM7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEIsNkNBQVE7QUFDdEM7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CO0FBQ3BCLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLFlBQVk7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUErQyxnQkFBZ0I7QUFDL0Q7QUFDQSwrREFBK0Q7QUFDL0QsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLDJFQUEyRTtBQUMzRTtBQUNBLHlCQUF5QjtBQUN6QixxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLGFBQWE7QUFDYjtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSwwQ0FBMEMsaUVBQW1CO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0Q7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUMwQjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzVQZTtBQUNNO0FBQy9DO0FBQ0EsT0FBTyxxQ0FBcUM7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0Msc0RBQVk7QUFDOUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGVBQWUsY0FBYztBQUM3QjtBQUNBO0FBQ0EsZUFBZSx3QkFBd0IsNEJBQTRCLG1CQUFtQjtBQUN0RjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0Qsd0RBQVk7QUFDOUQsa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5Q0FBeUMsZUFBZTtBQUN4RCx1Q0FBdUMsUUFBUTtBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDK0I7Ozs7Ozs7Ozs7Ozs7QUNoRnJCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0E0QjtBQUNhO0FBQ3pCO0FBQ2E7QUFDRTtBQUN3QjtBQUNqRTtBQUNBLGNBQWMsNENBQUs7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxhQUFhO0FBQ3hCLHlDQUF5QyxJQUFJLEVBQUUsbUJBQW1CO0FBQ2xFO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyxtQkFBbUI7QUFDdEQsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLElBQUksR0FBRyxTQUFTO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdEQUF3RCxJQUFJLEVBQUUsbUJBQW1CO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0Esb0NBQW9DLGlCQUFpQixHQUFHLFNBQVM7QUFDakU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLDJCQUEyQixzREFBWTtBQUM5QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQ0FBc0M7QUFDdEM7QUFDQSwyQ0FBMkMsT0FBTztBQUNsRCxTQUFTO0FBQ1Q7QUFDQSxtQkFBbUIsaUJBQWlCO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQyxpQkFBaUI7QUFDbEQ7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBLGdDQUFnQywwRUFBbUI7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsbURBQVM7QUFDaEM7QUFDQTtBQUNBLDRDQUE0QyxZQUFZLElBQUksY0FBYztBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQWlELElBQUksR0FBRyxxREFBUyxJQUFJO0FBQ3JFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUMyQjtBQUMzQjtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQSxtQ0FBbUM7QUFDbkMsdUJBQXVCLDREQUFjO0FBQ3JDO0FBQ0EsOENBQThDO0FBQzlDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN2U3VDO0FBQ1Y7QUFDdEIsZUFBZSxhQUFvQjtBQUMxQztBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxzQ0FBUztBQUNwQjtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsU0FBUztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4RUFBOEUsSUFBSTtBQUNsRjtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQLG9CQUFvQixxREFBUztBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0NBQStDLE9BQU87QUFDdEQ7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBLG1FQUFtRSxJQUFJO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLFFBQVE7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLGNBQWMsbUNBQW1DLFNBQVM7QUFDbkY7QUFDQTtBQUNBLG1CQUFtQixPQUFPLEdBQUcsTUFBTTtBQUNuQyw2REFBNkQsSUFBSTtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1REFBdUQsS0FBSztBQUM1RDtBQUNBO0FBQ0EsaURBQWlELGNBQWM7QUFDL0Q7QUFDQSxTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7Ozs7Ozs7Ozs7Ozs7Ozs7QUNwT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUMrQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDL0QvQjtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxVQUFVLGdCQUFnQixzQ0FBc0MsaUJBQWlCLEVBQUU7QUFDbkYseUJBQXlCLDhFQUE4RTtBQUN2RztBQUNBOztBQUVPO0FBQ1A7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLHNCQUFzQjtBQUN6QztBQUNBOztBQUVPO0FBQ1A7QUFDQSxnREFBZ0QsT0FBTztBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNERBQTRELGNBQWM7QUFDMUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFTztBQUNQO0FBQ0E7QUFDQSw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBOztBQUVPO0FBQ1AsbUNBQW1DLG9DQUFvQztBQUN2RTs7QUFFTztBQUNQO0FBQ0E7O0FBRU87QUFDUCwyQkFBMkIsK0RBQStELGdCQUFnQixFQUFFLEVBQUU7QUFDOUc7QUFDQSxtQ0FBbUMsTUFBTSw2QkFBNkIsRUFBRSxZQUFZLFdBQVcsRUFBRTtBQUNqRyxrQ0FBa0MsTUFBTSxpQ0FBaUMsRUFBRSxZQUFZLFdBQVcsRUFBRTtBQUNwRywrQkFBK0IscUZBQXFGO0FBQ3BIO0FBQ0EsS0FBSztBQUNMOztBQUVPO0FBQ1AsYUFBYSw2QkFBNkIsMEJBQTBCLGFBQWEsRUFBRSxxQkFBcUI7QUFDeEcsZ0JBQWdCLHFEQUFxRCxvRUFBb0UsYUFBYSxFQUFFO0FBQ3hKLHNCQUFzQixzQkFBc0IscUJBQXFCLEdBQUc7QUFDcEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDO0FBQ3ZDLGtDQUFrQyxTQUFTO0FBQzNDLGtDQUFrQyxXQUFXLFVBQVU7QUFDdkQseUNBQXlDLGNBQWM7QUFDdkQ7QUFDQSw2R0FBNkcsT0FBTyxVQUFVO0FBQzlILGdGQUFnRixpQkFBaUIsT0FBTztBQUN4Ryx3REFBd0QsZ0JBQWdCLFFBQVEsT0FBTztBQUN2Riw4Q0FBOEMsZ0JBQWdCLGdCQUFnQixPQUFPO0FBQ3JGO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQSxTQUFTLFlBQVksYUFBYSxPQUFPLEVBQUUsVUFBVSxXQUFXO0FBQ2hFLG1DQUFtQyxTQUFTO0FBQzVDO0FBQ0E7O0FBRU87QUFDUDtBQUNBLGtDQUFrQyxvQ0FBb0MsYUFBYSxFQUFFLEVBQUU7QUFDdkYsQ0FBQztBQUNEO0FBQ0E7QUFDQSxDQUFDOztBQUVNO0FBQ1A7QUFDQTs7QUFFTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0I7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7O0FBRU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsTUFBTSxnQkFBZ0I7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsc0JBQXNCO0FBQ3ZDO0FBQ0E7QUFDQTs7QUFFQTtBQUNPO0FBQ1AsNEJBQTRCLHNCQUFzQjtBQUNsRDtBQUNBO0FBQ0E7O0FBRUE7QUFDTztBQUNQLGlEQUFpRCxRQUFRO0FBQ3pELHdDQUF3QyxRQUFRO0FBQ2hELHdEQUF3RCxRQUFRO0FBQ2hFO0FBQ0E7QUFDQTs7QUFFTztBQUNQLG9EQUFvRCxRQUFRO0FBQzVEO0FBQ0E7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRU87QUFDUDtBQUNBO0FBQ0EsaUJBQWlCLHNGQUFzRixhQUFhLEVBQUU7QUFDdEgsc0JBQXNCLGdDQUFnQyxxQ0FBcUMsMENBQTBDLEVBQUUsRUFBRSxHQUFHO0FBQzVJLDJCQUEyQixNQUFNLGVBQWUsRUFBRSxZQUFZLG9CQUFvQixFQUFFO0FBQ3BGLHNCQUFzQixvR0FBb0c7QUFDMUgsNkJBQTZCLHVCQUF1QjtBQUNwRCw0QkFBNEIsd0JBQXdCO0FBQ3BELDJCQUEyQix5REFBeUQ7QUFDcEY7O0FBRU87QUFDUDtBQUNBLGlCQUFpQiw0Q0FBNEMsU0FBUyxFQUFFLHFEQUFxRCxhQUFhLEVBQUU7QUFDNUkseUJBQXlCLDZCQUE2QixvQkFBb0IsZ0RBQWdELGdCQUFnQixFQUFFLEtBQUs7QUFDako7O0FBRU87QUFDUDtBQUNBO0FBQ0EsMkdBQTJHLHNGQUFzRixhQUFhLEVBQUU7QUFDaE4sc0JBQXNCLDhCQUE4QixnREFBZ0QsdURBQXVELEVBQUUsRUFBRSxHQUFHO0FBQ2xLLDRDQUE0QyxzQ0FBc0MsVUFBVSxvQkFBb0IsRUFBRSxFQUFFLFVBQVU7QUFDOUg7O0FBRU87QUFDUCxnQ0FBZ0MsdUNBQXVDLGFBQWEsRUFBRSxFQUFFLE9BQU8sa0JBQWtCO0FBQ2pIO0FBQ0E7O0FBRUE7QUFDQSx5Q0FBeUMsNkJBQTZCO0FBQ3RFLENBQUM7QUFDRDtBQUNBOztBQUVPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVPO0FBQ1AsNENBQTRDO0FBQzVDOztBQUVPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEM7Ozs7Ozs7Ozs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0EsbUJBQW1CLHNCQUFzQjtBQUN6QztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCx1QkFBdUIsU0FBUztBQUNoQztBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGtCQUFrQixxQkFBTTtBQUN4QjtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNLE9BQU87QUFDYjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFVBQVUsT0FBTztBQUNqQjtBQUNBLE9BQU8sVUFBVSxPQUFPO0FBQ3hCO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0EsZ0JBQWdCO0FBQ2hCO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUI7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLE9BQU87QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE9BQU87QUFDbEIsV0FBVyxPQUFPO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWU7OztBQUdmO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSw0Q0FBNEMsS0FBSzs7QUFFakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBLG1DQUFtQyxPQUFPO0FBQzFDO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQSx5REFBeUQ7QUFDekQ7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQWlELGFBQWE7QUFDOUQ7QUFDQTtBQUNBLFFBQVEsNERBQWtCO0FBQzFCO0FBQ0EsNENBQTRDLGFBQWE7QUFDekQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQWlELEtBQUs7QUFDdEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDdUQiLCJmaWxlIjoibHNwbHVnaW4uY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIkxTUGx1Z2luXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcIkxTUGx1Z2luXCJdID0gZmFjdG9yeSgpO1xufSkoc2VsZiwgZnVuY3Rpb24oKSB7XG5yZXR1cm4gIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICovXG5cbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gbG9jYWxzdG9yYWdlKCk7XG5leHBvcnRzLmRlc3Ryb3kgPSAoKCkgPT4ge1xuXHRsZXQgd2FybmVkID0gZmFsc2U7XG5cblx0cmV0dXJuICgpID0+IHtcblx0XHRpZiAoIXdhcm5lZCkge1xuXHRcdFx0d2FybmVkID0gdHJ1ZTtcblx0XHRcdGNvbnNvbGUud2FybignSW5zdGFuY2UgbWV0aG9kIGBkZWJ1Zy5kZXN0cm95KClgIGlzIGRlcHJlY2F0ZWQgYW5kIG5vIGxvbmdlciBkb2VzIGFueXRoaW5nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvbiBvZiBgZGVidWdgLicpO1xuXHRcdH1cblx0fTtcbn0pKCk7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuXHQnIzAwMDBDQycsXG5cdCcjMDAwMEZGJyxcblx0JyMwMDMzQ0MnLFxuXHQnIzAwMzNGRicsXG5cdCcjMDA2NkNDJyxcblx0JyMwMDY2RkYnLFxuXHQnIzAwOTlDQycsXG5cdCcjMDA5OUZGJyxcblx0JyMwMENDMDAnLFxuXHQnIzAwQ0MzMycsXG5cdCcjMDBDQzY2Jyxcblx0JyMwMENDOTknLFxuXHQnIzAwQ0NDQycsXG5cdCcjMDBDQ0ZGJyxcblx0JyMzMzAwQ0MnLFxuXHQnIzMzMDBGRicsXG5cdCcjMzMzM0NDJyxcblx0JyMzMzMzRkYnLFxuXHQnIzMzNjZDQycsXG5cdCcjMzM2NkZGJyxcblx0JyMzMzk5Q0MnLFxuXHQnIzMzOTlGRicsXG5cdCcjMzNDQzAwJyxcblx0JyMzM0NDMzMnLFxuXHQnIzMzQ0M2NicsXG5cdCcjMzNDQzk5Jyxcblx0JyMzM0NDQ0MnLFxuXHQnIzMzQ0NGRicsXG5cdCcjNjYwMENDJyxcblx0JyM2NjAwRkYnLFxuXHQnIzY2MzNDQycsXG5cdCcjNjYzM0ZGJyxcblx0JyM2NkNDMDAnLFxuXHQnIzY2Q0MzMycsXG5cdCcjOTkwMENDJyxcblx0JyM5OTAwRkYnLFxuXHQnIzk5MzNDQycsXG5cdCcjOTkzM0ZGJyxcblx0JyM5OUNDMDAnLFxuXHQnIzk5Q0MzMycsXG5cdCcjQ0MwMDAwJyxcblx0JyNDQzAwMzMnLFxuXHQnI0NDMDA2NicsXG5cdCcjQ0MwMDk5Jyxcblx0JyNDQzAwQ0MnLFxuXHQnI0NDMDBGRicsXG5cdCcjQ0MzMzAwJyxcblx0JyNDQzMzMzMnLFxuXHQnI0NDMzM2NicsXG5cdCcjQ0MzMzk5Jyxcblx0JyNDQzMzQ0MnLFxuXHQnI0NDMzNGRicsXG5cdCcjQ0M2NjAwJyxcblx0JyNDQzY2MzMnLFxuXHQnI0NDOTkwMCcsXG5cdCcjQ0M5OTMzJyxcblx0JyNDQ0NDMDAnLFxuXHQnI0NDQ0MzMycsXG5cdCcjRkYwMDAwJyxcblx0JyNGRjAwMzMnLFxuXHQnI0ZGMDA2NicsXG5cdCcjRkYwMDk5Jyxcblx0JyNGRjAwQ0MnLFxuXHQnI0ZGMDBGRicsXG5cdCcjRkYzMzAwJyxcblx0JyNGRjMzMzMnLFxuXHQnI0ZGMzM2NicsXG5cdCcjRkYzMzk5Jyxcblx0JyNGRjMzQ0MnLFxuXHQnI0ZGMzNGRicsXG5cdCcjRkY2NjAwJyxcblx0JyNGRjY2MzMnLFxuXHQnI0ZGOTkwMCcsXG5cdCcjRkY5OTMzJyxcblx0JyNGRkNDMDAnLFxuXHQnI0ZGQ0MzMydcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcblx0Ly8gTkI6IEluIGFuIEVsZWN0cm9uIHByZWxvYWQgc2NyaXB0LCBkb2N1bWVudCB3aWxsIGJlIGRlZmluZWQgYnV0IG5vdCBmdWxseVxuXHQvLyBpbml0aWFsaXplZC4gU2luY2Ugd2Uga25vdyB3ZSdyZSBpbiBDaHJvbWUsIHdlJ2xsIGp1c3QgZGV0ZWN0IHRoaXMgY2FzZVxuXHQvLyBleHBsaWNpdGx5XG5cdGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucHJvY2VzcyAmJiAod2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJyB8fCB3aW5kb3cucHJvY2Vzcy5fX253anMpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyBJbnRlcm5ldCBFeHBsb3JlciBhbmQgRWRnZSBkbyBub3Qgc3VwcG9ydCBjb2xvcnMuXG5cdGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvKGVkZ2V8dHJpZGVudClcXC8oXFxkKykvKSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIElzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG5cdC8vIGRvY3VtZW50IGlzIHVuZGVmaW5lZCBpbiByZWFjdC1uYXRpdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC1uYXRpdmUvcHVsbC8xNjMyXG5cdHJldHVybiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5XZWJraXRBcHBlYXJhbmNlKSB8fFxuXHRcdC8vIElzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcblx0XHQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLmZpcmVidWcgfHwgKHdpbmRvdy5jb25zb2xlLmV4Y2VwdGlvbiAmJiB3aW5kb3cuY29uc29sZS50YWJsZSkpKSB8fFxuXHRcdC8vIElzIGZpcmVmb3ggPj0gdjMxP1xuXHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuXHRcdCh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKSB8fFxuXHRcdC8vIERvdWJsZSBjaGVjayB3ZWJraXQgaW4gdXNlckFnZW50IGp1c3QgaW4gY2FzZSB3ZSBhcmUgaW4gYSB3b3JrZXJcblx0XHQodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2FwcGxld2Via2l0XFwvKFxcZCspLykpO1xufVxuXG4vKipcbiAqIENvbG9yaXplIGxvZyBhcmd1bWVudHMgaWYgZW5hYmxlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGZvcm1hdEFyZ3MoYXJncykge1xuXHRhcmdzWzBdID0gKHRoaXMudXNlQ29sb3JzID8gJyVjJyA6ICcnKSArXG5cdFx0dGhpcy5uYW1lc3BhY2UgK1xuXHRcdCh0aGlzLnVzZUNvbG9ycyA/ICcgJWMnIDogJyAnKSArXG5cdFx0YXJnc1swXSArXG5cdFx0KHRoaXMudXNlQ29sb3JzID8gJyVjICcgOiAnICcpICtcblx0XHQnKycgKyBtb2R1bGUuZXhwb3J0cy5odW1hbml6ZSh0aGlzLmRpZmYpO1xuXG5cdGlmICghdGhpcy51c2VDb2xvcnMpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcblx0YXJncy5zcGxpY2UoMSwgMCwgYywgJ2NvbG9yOiBpbmhlcml0Jyk7XG5cblx0Ly8gVGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcblx0Ly8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuXHQvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cblx0bGV0IGluZGV4ID0gMDtcblx0bGV0IGxhc3RDID0gMDtcblx0YXJnc1swXS5yZXBsYWNlKC8lW2EtekEtWiVdL2csIG1hdGNoID0+IHtcblx0XHRpZiAobWF0Y2ggPT09ICclJScpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aW5kZXgrKztcblx0XHRpZiAobWF0Y2ggPT09ICclYycpIHtcblx0XHRcdC8vIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuXHRcdFx0Ly8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcblx0XHRcdGxhc3RDID0gaW5kZXg7XG5cdFx0fVxuXHR9KTtcblxuXHRhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5kZWJ1ZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUuZGVidWdgIGlzIG5vdCBhIFwiZnVuY3Rpb25cIi5cbiAqIElmIGBjb25zb2xlLmRlYnVnYCBpcyBub3QgYXZhaWxhYmxlLCBmYWxscyBiYWNrXG4gKiB0byBgY29uc29sZS5sb2dgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydHMubG9nID0gY29uc29sZS5kZWJ1ZyB8fCBjb25zb2xlLmxvZyB8fCAoKCkgPT4ge30pO1xuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG5cdHRyeSB7XG5cdFx0aWYgKG5hbWVzcGFjZXMpIHtcblx0XHRcdGV4cG9ydHMuc3RvcmFnZS5zZXRJdGVtKCdkZWJ1ZycsIG5hbWVzcGFjZXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcblx0XHR9XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gU3dhbGxvd1xuXHRcdC8vIFhYWCAoQFFpeC0pIHNob3VsZCB3ZSBiZSBsb2dnaW5nIHRoZXNlP1xuXHR9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGxvYWQoKSB7XG5cdGxldCByO1xuXHR0cnkge1xuXHRcdHIgPSBleHBvcnRzLnN0b3JhZ2UuZ2V0SXRlbSgnZGVidWcnKTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHQvLyBTd2FsbG93XG5cdFx0Ly8gWFhYIChAUWl4LSkgc2hvdWxkIHdlIGJlIGxvZ2dpbmcgdGhlc2U/XG5cdH1cblxuXHQvLyBJZiBkZWJ1ZyBpc24ndCBzZXQgaW4gTFMsIGFuZCB3ZSdyZSBpbiBFbGVjdHJvbiwgdHJ5IHRvIGxvYWQgJERFQlVHXG5cdGlmICghciAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgJ2VudicgaW4gcHJvY2Vzcykge1xuXHRcdHIgPSBwcm9jZXNzLmVudi5ERUJVRztcblx0fVxuXG5cdHJldHVybiByO1xufVxuXG4vKipcbiAqIExvY2Fsc3RvcmFnZSBhdHRlbXB0cyB0byByZXR1cm4gdGhlIGxvY2Fsc3RvcmFnZS5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNhZmFyaSB0aHJvd3NcbiAqIHdoZW4gYSB1c2VyIGRpc2FibGVzIGNvb2tpZXMvbG9jYWxzdG9yYWdlXG4gKiBhbmQgeW91IGF0dGVtcHQgdG8gYWNjZXNzIGl0LlxuICpcbiAqIEByZXR1cm4ge0xvY2FsU3RvcmFnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvY2Fsc3RvcmFnZSgpIHtcblx0dHJ5IHtcblx0XHQvLyBUVk1MS2l0IChBcHBsZSBUViBKUyBSdW50aW1lKSBkb2VzIG5vdCBoYXZlIGEgd2luZG93IG9iamVjdCwganVzdCBsb2NhbFN0b3JhZ2UgaW4gdGhlIGdsb2JhbCBjb250ZXh0XG5cdFx0Ly8gVGhlIEJyb3dzZXIgYWxzbyBoYXMgbG9jYWxTdG9yYWdlIGluIHRoZSBnbG9iYWwgY29udGV4dC5cblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdC8vIFN3YWxsb3dcblx0XHQvLyBYWFggKEBRaXgtKSBzaG91bGQgd2UgYmUgbG9nZ2luZyB0aGVzZT9cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY29tbW9uJykoZXhwb3J0cyk7XG5cbmNvbnN0IHtmb3JtYXR0ZXJzfSA9IG1vZHVsZS5leHBvcnRzO1xuXG4vKipcbiAqIE1hcCAlaiB0byBgSlNPTi5zdHJpbmdpZnkoKWAsIHNpbmNlIG5vIFdlYiBJbnNwZWN0b3JzIGRvIHRoYXQgYnkgZGVmYXVsdC5cbiAqL1xuXG5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbiAodikge1xuXHR0cnkge1xuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRyZXR1cm4gJ1tVbmV4cGVjdGVkSlNPTlBhcnNlRXJyb3JdOiAnICsgZXJyb3IubWVzc2FnZTtcblx0fVxufTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICovXG5cbmZ1bmN0aW9uIHNldHVwKGVudikge1xuXHRjcmVhdGVEZWJ1Zy5kZWJ1ZyA9IGNyZWF0ZURlYnVnO1xuXHRjcmVhdGVEZWJ1Zy5kZWZhdWx0ID0gY3JlYXRlRGVidWc7XG5cdGNyZWF0ZURlYnVnLmNvZXJjZSA9IGNvZXJjZTtcblx0Y3JlYXRlRGVidWcuZGlzYWJsZSA9IGRpc2FibGU7XG5cdGNyZWF0ZURlYnVnLmVuYWJsZSA9IGVuYWJsZTtcblx0Y3JlYXRlRGVidWcuZW5hYmxlZCA9IGVuYWJsZWQ7XG5cdGNyZWF0ZURlYnVnLmh1bWFuaXplID0gcmVxdWlyZSgnbXMnKTtcblx0Y3JlYXRlRGVidWcuZGVzdHJveSA9IGRlc3Ryb3k7XG5cblx0T2JqZWN0LmtleXMoZW52KS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0Y3JlYXRlRGVidWdba2V5XSA9IGVudltrZXldO1xuXHR9KTtcblxuXHQvKipcblx0KiBUaGUgY3VycmVudGx5IGFjdGl2ZSBkZWJ1ZyBtb2RlIG5hbWVzLCBhbmQgbmFtZXMgdG8gc2tpcC5cblx0Ki9cblxuXHRjcmVhdGVEZWJ1Zy5uYW1lcyA9IFtdO1xuXHRjcmVhdGVEZWJ1Zy5za2lwcyA9IFtdO1xuXG5cdC8qKlxuXHQqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cblx0KlxuXHQqIFZhbGlkIGtleSBuYW1lcyBhcmUgYSBzaW5nbGUsIGxvd2VyIG9yIHVwcGVyLWNhc2UgbGV0dGVyLCBpLmUuIFwiblwiIGFuZCBcIk5cIi5cblx0Ki9cblx0Y3JlYXRlRGVidWcuZm9ybWF0dGVycyA9IHt9O1xuXG5cdC8qKlxuXHQqIFNlbGVjdHMgYSBjb2xvciBmb3IgYSBkZWJ1ZyBuYW1lc3BhY2Vcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2Ugc3RyaW5nIGZvciB0aGUgZm9yIHRoZSBkZWJ1ZyBpbnN0YW5jZSB0byBiZSBjb2xvcmVkXG5cdCogQHJldHVybiB7TnVtYmVyfFN0cmluZ30gQW4gQU5TSSBjb2xvciBjb2RlIGZvciB0aGUgZ2l2ZW4gbmFtZXNwYWNlXG5cdCogQGFwaSBwcml2YXRlXG5cdCovXG5cdGZ1bmN0aW9uIHNlbGVjdENvbG9yKG5hbWVzcGFjZSkge1xuXHRcdGxldCBoYXNoID0gMDtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbmFtZXNwYWNlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBuYW1lc3BhY2UuY2hhckNvZGVBdChpKTtcblx0XHRcdGhhc2ggfD0gMDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNyZWF0ZURlYnVnLmNvbG9yc1tNYXRoLmFicyhoYXNoKSAlIGNyZWF0ZURlYnVnLmNvbG9ycy5sZW5ndGhdO1xuXHR9XG5cdGNyZWF0ZURlYnVnLnNlbGVjdENvbG9yID0gc2VsZWN0Q29sb3I7XG5cblx0LyoqXG5cdCogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVzcGFjZWAuXG5cdCpcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG5cdCogQHJldHVybiB7RnVuY3Rpb259XG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gY3JlYXRlRGVidWcobmFtZXNwYWNlKSB7XG5cdFx0bGV0IHByZXZUaW1lO1xuXHRcdGxldCBlbmFibGVPdmVycmlkZSA9IG51bGw7XG5cblx0XHRmdW5jdGlvbiBkZWJ1ZyguLi5hcmdzKSB7XG5cdFx0XHQvLyBEaXNhYmxlZD9cblx0XHRcdGlmICghZGVidWcuZW5hYmxlZCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHNlbGYgPSBkZWJ1ZztcblxuXHRcdFx0Ly8gU2V0IGBkaWZmYCB0aW1lc3RhbXBcblx0XHRcdGNvbnN0IGN1cnIgPSBOdW1iZXIobmV3IERhdGUoKSk7XG5cdFx0XHRjb25zdCBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG5cdFx0XHRzZWxmLmRpZmYgPSBtcztcblx0XHRcdHNlbGYucHJldiA9IHByZXZUaW1lO1xuXHRcdFx0c2VsZi5jdXJyID0gY3Vycjtcblx0XHRcdHByZXZUaW1lID0gY3VycjtcblxuXHRcdFx0YXJnc1swXSA9IGNyZWF0ZURlYnVnLmNvZXJjZShhcmdzWzBdKTtcblxuXHRcdFx0aWYgKHR5cGVvZiBhcmdzWzBdICE9PSAnc3RyaW5nJykge1xuXHRcdFx0XHQvLyBBbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlT1xuXHRcdFx0XHRhcmdzLnVuc2hpZnQoJyVPJyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG5cdFx0XHRsZXQgaW5kZXggPSAwO1xuXHRcdFx0YXJnc1swXSA9IGFyZ3NbMF0ucmVwbGFjZSgvJShbYS16QS1aJV0pL2csIChtYXRjaCwgZm9ybWF0KSA9PiB7XG5cdFx0XHRcdC8vIElmIHdlIGVuY291bnRlciBhbiBlc2NhcGVkICUgdGhlbiBkb24ndCBpbmNyZWFzZSB0aGUgYXJyYXkgaW5kZXhcblx0XHRcdFx0aWYgKG1hdGNoID09PSAnJSUnKSB7XG5cdFx0XHRcdFx0cmV0dXJuICclJztcblx0XHRcdFx0fVxuXHRcdFx0XHRpbmRleCsrO1xuXHRcdFx0XHRjb25zdCBmb3JtYXR0ZXIgPSBjcmVhdGVEZWJ1Zy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG5cdFx0XHRcdGlmICh0eXBlb2YgZm9ybWF0dGVyID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y29uc3QgdmFsID0gYXJnc1tpbmRleF07XG5cdFx0XHRcdFx0bWF0Y2ggPSBmb3JtYXR0ZXIuY2FsbChzZWxmLCB2YWwpO1xuXG5cdFx0XHRcdFx0Ly8gTm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuXHRcdFx0XHRcdGFyZ3Muc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0XHRpbmRleC0tO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBtYXRjaDtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBBcHBseSBlbnYtc3BlY2lmaWMgZm9ybWF0dGluZyAoY29sb3JzLCBldGMuKVxuXHRcdFx0Y3JlYXRlRGVidWcuZm9ybWF0QXJncy5jYWxsKHNlbGYsIGFyZ3MpO1xuXG5cdFx0XHRjb25zdCBsb2dGbiA9IHNlbGYubG9nIHx8IGNyZWF0ZURlYnVnLmxvZztcblx0XHRcdGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuXHRcdH1cblxuXHRcdGRlYnVnLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblx0XHRkZWJ1Zy51c2VDb2xvcnMgPSBjcmVhdGVEZWJ1Zy51c2VDb2xvcnMoKTtcblx0XHRkZWJ1Zy5jb2xvciA9IGNyZWF0ZURlYnVnLnNlbGVjdENvbG9yKG5hbWVzcGFjZSk7XG5cdFx0ZGVidWcuZXh0ZW5kID0gZXh0ZW5kO1xuXHRcdGRlYnVnLmRlc3Ryb3kgPSBjcmVhdGVEZWJ1Zy5kZXN0cm95OyAvLyBYWFggVGVtcG9yYXJ5LiBXaWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgcmVsZWFzZS5cblxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShkZWJ1ZywgJ2VuYWJsZWQnLCB7XG5cdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcblx0XHRcdGdldDogKCkgPT4gZW5hYmxlT3ZlcnJpZGUgPT09IG51bGwgPyBjcmVhdGVEZWJ1Zy5lbmFibGVkKG5hbWVzcGFjZSkgOiBlbmFibGVPdmVycmlkZSxcblx0XHRcdHNldDogdiA9PiB7XG5cdFx0XHRcdGVuYWJsZU92ZXJyaWRlID0gdjtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIEVudi1zcGVjaWZpYyBpbml0aWFsaXphdGlvbiBsb2dpYyBmb3IgZGVidWcgaW5zdGFuY2VzXG5cdFx0aWYgKHR5cGVvZiBjcmVhdGVEZWJ1Zy5pbml0ID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRjcmVhdGVEZWJ1Zy5pbml0KGRlYnVnKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZGVidWc7XG5cdH1cblxuXHRmdW5jdGlvbiBleHRlbmQobmFtZXNwYWNlLCBkZWxpbWl0ZXIpIHtcblx0XHRjb25zdCBuZXdEZWJ1ZyA9IGNyZWF0ZURlYnVnKHRoaXMubmFtZXNwYWNlICsgKHR5cGVvZiBkZWxpbWl0ZXIgPT09ICd1bmRlZmluZWQnID8gJzonIDogZGVsaW1pdGVyKSArIG5hbWVzcGFjZSk7XG5cdFx0bmV3RGVidWcubG9nID0gdGhpcy5sb2c7XG5cdFx0cmV0dXJuIG5ld0RlYnVnO1xuXHR9XG5cblx0LyoqXG5cdCogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuXHQqIHNlcGFyYXRlZCBieSBhIGNvbG9uIGFuZCB3aWxkY2FyZHMuXG5cdCpcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuXHQqIEBhcGkgcHVibGljXG5cdCovXG5cdGZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG5cdFx0Y3JlYXRlRGVidWcuc2F2ZShuYW1lc3BhY2VzKTtcblxuXHRcdGNyZWF0ZURlYnVnLm5hbWVzID0gW107XG5cdFx0Y3JlYXRlRGVidWcuc2tpcHMgPSBbXTtcblxuXHRcdGxldCBpO1xuXHRcdGNvbnN0IHNwbGl0ID0gKHR5cGVvZiBuYW1lc3BhY2VzID09PSAnc3RyaW5nJyA/IG5hbWVzcGFjZXMgOiAnJykuc3BsaXQoL1tcXHMsXSsvKTtcblx0XHRjb25zdCBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmICghc3BsaXRbaV0pIHtcblx0XHRcdFx0Ly8gaWdub3JlIGVtcHR5IHN0cmluZ3Ncblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuXG5cdFx0XHRpZiAobmFtZXNwYWNlc1swXSA9PT0gJy0nKSB7XG5cdFx0XHRcdGNyZWF0ZURlYnVnLnNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzLnN1YnN0cigxKSArICckJykpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y3JlYXRlRGVidWcubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0KiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cblx0KlxuXHQqIEByZXR1cm4ge1N0cmluZ30gbmFtZXNwYWNlc1xuXHQqIEBhcGkgcHVibGljXG5cdCovXG5cdGZ1bmN0aW9uIGRpc2FibGUoKSB7XG5cdFx0Y29uc3QgbmFtZXNwYWNlcyA9IFtcblx0XHRcdC4uLmNyZWF0ZURlYnVnLm5hbWVzLm1hcCh0b05hbWVzcGFjZSksXG5cdFx0XHQuLi5jcmVhdGVEZWJ1Zy5za2lwcy5tYXAodG9OYW1lc3BhY2UpLm1hcChuYW1lc3BhY2UgPT4gJy0nICsgbmFtZXNwYWNlKVxuXHRcdF0uam9pbignLCcpO1xuXHRcdGNyZWF0ZURlYnVnLmVuYWJsZSgnJyk7XG5cdFx0cmV0dXJuIG5hbWVzcGFjZXM7XG5cdH1cblxuXHQvKipcblx0KiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG5cdCpcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuXHQqIEByZXR1cm4ge0Jvb2xlYW59XG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG5cdFx0aWYgKG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJyonKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRsZXQgaTtcblx0XHRsZXQgbGVuO1xuXG5cdFx0Zm9yIChpID0gMCwgbGVuID0gY3JlYXRlRGVidWcuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChjcmVhdGVEZWJ1Zy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjcmVhdGVEZWJ1Zy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGNyZWF0ZURlYnVnLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCogQ29udmVydCByZWdleHAgdG8gbmFtZXNwYWNlXG5cdCpcblx0KiBAcGFyYW0ge1JlZ0V4cH0gcmVneGVwXG5cdCogQHJldHVybiB7U3RyaW5nfSBuYW1lc3BhY2Vcblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gdG9OYW1lc3BhY2UocmVnZXhwKSB7XG5cdFx0cmV0dXJuIHJlZ2V4cC50b1N0cmluZygpXG5cdFx0XHQuc3Vic3RyaW5nKDIsIHJlZ2V4cC50b1N0cmluZygpLmxlbmd0aCAtIDIpXG5cdFx0XHQucmVwbGFjZSgvXFwuXFwqXFw/JC8sICcqJyk7XG5cdH1cblxuXHQvKipcblx0KiBDb2VyY2UgYHZhbGAuXG5cdCpcblx0KiBAcGFyYW0ge01peGVkfSB2YWxcblx0KiBAcmV0dXJuIHtNaXhlZH1cblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuXHRcdGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikge1xuXHRcdFx0cmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcblx0XHR9XG5cdFx0cmV0dXJuIHZhbDtcblx0fVxuXG5cdC8qKlxuXHQqIFhYWCBETyBOT1QgVVNFLiBUaGlzIGlzIGEgdGVtcG9yYXJ5IHN0dWIgZnVuY3Rpb24uXG5cdCogWFhYIEl0IFdJTEwgYmUgcmVtb3ZlZCBpbiB0aGUgbmV4dCBtYWpvciByZWxlYXNlLlxuXHQqL1xuXHRmdW5jdGlvbiBkZXN0cm95KCkge1xuXHRcdGNvbnNvbGUud2FybignSW5zdGFuY2UgbWV0aG9kIGBkZWJ1Zy5kZXN0cm95KClgIGlzIGRlcHJlY2F0ZWQgYW5kIG5vIGxvbmdlciBkb2VzIGFueXRoaW5nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvbiBvZiBgZGVidWdgLicpO1xuXHR9XG5cblx0Y3JlYXRlRGVidWcuZW5hYmxlKGNyZWF0ZURlYnVnLmxvYWQoKSk7XG5cblx0cmV0dXJuIGNyZWF0ZURlYnVnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNldHVwO1xuIiwiLyohIEBsaWNlbnNlIERPTVB1cmlmeSB8IChjKSBDdXJlNTMgYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyB8IFJlbGVhc2VkIHVuZGVyIHRoZSBBcGFjaGUgbGljZW5zZSAyLjAgYW5kIE1vemlsbGEgUHVibGljIExpY2Vuc2UgMi4wIHwgZ2l0aHViLmNvbS9jdXJlNTMvRE9NUHVyaWZ5L2Jsb2IvMi4yLjIvTElDRU5TRSAqL1xuXG4oZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShmYWN0b3J5KSA6XG4gIChnbG9iYWwgPSBnbG9iYWwgfHwgc2VsZiwgZ2xvYmFsLkRPTVB1cmlmeSA9IGZhY3RvcnkoKSk7XG59KHRoaXMsIGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG4gIGZ1bmN0aW9uIF90b0NvbnN1bWFibGVBcnJheShhcnIpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyBmb3IgKHZhciBpID0gMCwgYXJyMiA9IEFycmF5KGFyci5sZW5ndGgpOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7IGFycjJbaV0gPSBhcnJbaV07IH0gcmV0dXJuIGFycjI7IH0gZWxzZSB7IHJldHVybiBBcnJheS5mcm9tKGFycik7IH0gfVxuXG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5oYXNPd25Qcm9wZXJ0eSxcbiAgICAgIHNldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mLFxuICAgICAgaXNGcm96ZW4gPSBPYmplY3QuaXNGcm96ZW4sXG4gICAgICBnZXRQcm90b3R5cGVPZiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZixcbiAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG4gIHZhciBmcmVlemUgPSBPYmplY3QuZnJlZXplLFxuICAgICAgc2VhbCA9IE9iamVjdC5zZWFsLFxuICAgICAgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBpbXBvcnQvbm8tbXV0YWJsZS1leHBvcnRzXG5cbiAgdmFyIF9yZWYgPSB0eXBlb2YgUmVmbGVjdCAhPT0gJ3VuZGVmaW5lZCcgJiYgUmVmbGVjdCxcbiAgICAgIGFwcGx5ID0gX3JlZi5hcHBseSxcbiAgICAgIGNvbnN0cnVjdCA9IF9yZWYuY29uc3RydWN0O1xuXG4gIGlmICghYXBwbHkpIHtcbiAgICBhcHBseSA9IGZ1bmN0aW9uIGFwcGx5KGZ1biwgdGhpc1ZhbHVlLCBhcmdzKSB7XG4gICAgICByZXR1cm4gZnVuLmFwcGx5KHRoaXNWYWx1ZSwgYXJncyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmICghZnJlZXplKSB7XG4gICAgZnJlZXplID0gZnVuY3Rpb24gZnJlZXplKHgpIHtcbiAgICAgIHJldHVybiB4O1xuICAgIH07XG4gIH1cblxuICBpZiAoIXNlYWwpIHtcbiAgICBzZWFsID0gZnVuY3Rpb24gc2VhbCh4KSB7XG4gICAgICByZXR1cm4geDtcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFjb25zdHJ1Y3QpIHtcbiAgICBjb25zdHJ1Y3QgPSBmdW5jdGlvbiBjb25zdHJ1Y3QoRnVuYywgYXJncykge1xuICAgICAgcmV0dXJuIG5ldyAoRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQuYXBwbHkoRnVuYywgW251bGxdLmNvbmNhdChfdG9Db25zdW1hYmxlQXJyYXkoYXJncykpKSkoKTtcbiAgICB9O1xuICB9XG5cbiAgdmFyIGFycmF5Rm9yRWFjaCA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLmZvckVhY2gpO1xuICB2YXIgYXJyYXlQb3AgPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5wb3ApO1xuICB2YXIgYXJyYXlQdXNoID0gdW5hcHBseShBcnJheS5wcm90b3R5cGUucHVzaCk7XG5cbiAgdmFyIHN0cmluZ1RvTG93ZXJDYXNlID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnRvTG93ZXJDYXNlKTtcbiAgdmFyIHN0cmluZ01hdGNoID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLm1hdGNoKTtcbiAgdmFyIHN0cmluZ1JlcGxhY2UgPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUucmVwbGFjZSk7XG4gIHZhciBzdHJpbmdJbmRleE9mID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLmluZGV4T2YpO1xuICB2YXIgc3RyaW5nVHJpbSA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS50cmltKTtcblxuICB2YXIgcmVnRXhwVGVzdCA9IHVuYXBwbHkoUmVnRXhwLnByb3RvdHlwZS50ZXN0KTtcblxuICB2YXIgdHlwZUVycm9yQ3JlYXRlID0gdW5jb25zdHJ1Y3QoVHlwZUVycm9yKTtcblxuICBmdW5jdGlvbiB1bmFwcGx5KGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRoaXNBcmcpIHtcbiAgICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICBhcmdzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFwcGx5KGZ1bmMsIHRoaXNBcmcsIGFyZ3MpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB1bmNvbnN0cnVjdChmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIGZvciAodmFyIF9sZW4yID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IEFycmF5KF9sZW4yKSwgX2tleTIgPSAwOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XG4gICAgICAgIGFyZ3NbX2tleTJdID0gYXJndW1lbnRzW19rZXkyXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvbnN0cnVjdChmdW5jLCBhcmdzKTtcbiAgICB9O1xuICB9XG5cbiAgLyogQWRkIHByb3BlcnRpZXMgdG8gYSBsb29rdXAgdGFibGUgKi9cbiAgZnVuY3Rpb24gYWRkVG9TZXQoc2V0LCBhcnJheSkge1xuICAgIGlmIChzZXRQcm90b3R5cGVPZikge1xuICAgICAgLy8gTWFrZSAnaW4nIGFuZCB0cnV0aHkgY2hlY2tzIGxpa2UgQm9vbGVhbihzZXQuY29uc3RydWN0b3IpXG4gICAgICAvLyBpbmRlcGVuZGVudCBvZiBhbnkgcHJvcGVydGllcyBkZWZpbmVkIG9uIE9iamVjdC5wcm90b3R5cGUuXG4gICAgICAvLyBQcmV2ZW50IHByb3RvdHlwZSBzZXR0ZXJzIGZyb20gaW50ZXJjZXB0aW5nIHNldCBhcyBhIHRoaXMgdmFsdWUuXG4gICAgICBzZXRQcm90b3R5cGVPZihzZXQsIG51bGwpO1xuICAgIH1cblxuICAgIHZhciBsID0gYXJyYXkubGVuZ3RoO1xuICAgIHdoaWxlIChsLS0pIHtcbiAgICAgIHZhciBlbGVtZW50ID0gYXJyYXlbbF07XG4gICAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHZhciBsY0VsZW1lbnQgPSBzdHJpbmdUb0xvd2VyQ2FzZShlbGVtZW50KTtcbiAgICAgICAgaWYgKGxjRWxlbWVudCAhPT0gZWxlbWVudCkge1xuICAgICAgICAgIC8vIENvbmZpZyBwcmVzZXRzIChlLmcuIHRhZ3MuanMsIGF0dHJzLmpzKSBhcmUgaW1tdXRhYmxlLlxuICAgICAgICAgIGlmICghaXNGcm96ZW4oYXJyYXkpKSB7XG4gICAgICAgICAgICBhcnJheVtsXSA9IGxjRWxlbWVudDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlbGVtZW50ID0gbGNFbGVtZW50O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNldFtlbGVtZW50XSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNldDtcbiAgfVxuXG4gIC8qIFNoYWxsb3cgY2xvbmUgYW4gb2JqZWN0ICovXG4gIGZ1bmN0aW9uIGNsb25lKG9iamVjdCkge1xuICAgIHZhciBuZXdPYmplY3QgPSBjcmVhdGUobnVsbCk7XG5cbiAgICB2YXIgcHJvcGVydHkgPSB2b2lkIDA7XG4gICAgZm9yIChwcm9wZXJ0eSBpbiBvYmplY3QpIHtcbiAgICAgIGlmIChhcHBseShoYXNPd25Qcm9wZXJ0eSwgb2JqZWN0LCBbcHJvcGVydHldKSkge1xuICAgICAgICBuZXdPYmplY3RbcHJvcGVydHldID0gb2JqZWN0W3Byb3BlcnR5XTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3T2JqZWN0O1xuICB9XG5cbiAgLyogSUUxMCBkb2Vzbid0IHN1cHBvcnQgX19sb29rdXBHZXR0ZXJfXyBzbyBsZXRzJ1xuICAgKiBzaW11bGF0ZSBpdC4gSXQgYWxzbyBhdXRvbWF0aWNhbGx5IGNoZWNrc1xuICAgKiBpZiB0aGUgcHJvcCBpcyBmdW5jdGlvbiBvciBnZXR0ZXIgYW5kIGJlaGF2ZXNcbiAgICogYWNjb3JkaW5nbHkuICovXG4gIGZ1bmN0aW9uIGxvb2t1cEdldHRlcihvYmplY3QsIHByb3ApIHtcbiAgICB3aGlsZSAob2JqZWN0ICE9PSBudWxsKSB7XG4gICAgICB2YXIgZGVzYyA9IGdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3ApO1xuICAgICAgaWYgKGRlc2MpIHtcbiAgICAgICAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgICAgICAgcmV0dXJuIHVuYXBwbHkoZGVzYy5nZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkZXNjLnZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgcmV0dXJuIHVuYXBwbHkoZGVzYy52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgb2JqZWN0ID0gZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmYWxsYmFja1ZhbHVlKGVsZW1lbnQpIHtcbiAgICAgIGNvbnNvbGUud2FybignZmFsbGJhY2sgdmFsdWUgZm9yJywgZWxlbWVudCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsbGJhY2tWYWx1ZTtcbiAgfVxuXG4gIHZhciBodG1sID0gZnJlZXplKFsnYScsICdhYmJyJywgJ2Fjcm9ueW0nLCAnYWRkcmVzcycsICdhcmVhJywgJ2FydGljbGUnLCAnYXNpZGUnLCAnYXVkaW8nLCAnYicsICdiZGknLCAnYmRvJywgJ2JpZycsICdibGluaycsICdibG9ja3F1b3RlJywgJ2JvZHknLCAnYnInLCAnYnV0dG9uJywgJ2NhbnZhcycsICdjYXB0aW9uJywgJ2NlbnRlcicsICdjaXRlJywgJ2NvZGUnLCAnY29sJywgJ2NvbGdyb3VwJywgJ2NvbnRlbnQnLCAnZGF0YScsICdkYXRhbGlzdCcsICdkZCcsICdkZWNvcmF0b3InLCAnZGVsJywgJ2RldGFpbHMnLCAnZGZuJywgJ2RpYWxvZycsICdkaXInLCAnZGl2JywgJ2RsJywgJ2R0JywgJ2VsZW1lbnQnLCAnZW0nLCAnZmllbGRzZXQnLCAnZmlnY2FwdGlvbicsICdmaWd1cmUnLCAnZm9udCcsICdmb290ZXInLCAnZm9ybScsICdoMScsICdoMicsICdoMycsICdoNCcsICdoNScsICdoNicsICdoZWFkJywgJ2hlYWRlcicsICdoZ3JvdXAnLCAnaHInLCAnaHRtbCcsICdpJywgJ2ltZycsICdpbnB1dCcsICdpbnMnLCAna2JkJywgJ2xhYmVsJywgJ2xlZ2VuZCcsICdsaScsICdtYWluJywgJ21hcCcsICdtYXJrJywgJ21hcnF1ZWUnLCAnbWVudScsICdtZW51aXRlbScsICdtZXRlcicsICduYXYnLCAnbm9icicsICdvbCcsICdvcHRncm91cCcsICdvcHRpb24nLCAnb3V0cHV0JywgJ3AnLCAncGljdHVyZScsICdwcmUnLCAncHJvZ3Jlc3MnLCAncScsICdycCcsICdydCcsICdydWJ5JywgJ3MnLCAnc2FtcCcsICdzZWN0aW9uJywgJ3NlbGVjdCcsICdzaGFkb3cnLCAnc21hbGwnLCAnc291cmNlJywgJ3NwYWNlcicsICdzcGFuJywgJ3N0cmlrZScsICdzdHJvbmcnLCAnc3R5bGUnLCAnc3ViJywgJ3N1bW1hcnknLCAnc3VwJywgJ3RhYmxlJywgJ3Rib2R5JywgJ3RkJywgJ3RlbXBsYXRlJywgJ3RleHRhcmVhJywgJ3Rmb290JywgJ3RoJywgJ3RoZWFkJywgJ3RpbWUnLCAndHInLCAndHJhY2snLCAndHQnLCAndScsICd1bCcsICd2YXInLCAndmlkZW8nLCAnd2JyJ10pO1xuXG4gIC8vIFNWR1xuICB2YXIgc3ZnID0gZnJlZXplKFsnc3ZnJywgJ2EnLCAnYWx0Z2x5cGgnLCAnYWx0Z2x5cGhkZWYnLCAnYWx0Z2x5cGhpdGVtJywgJ2FuaW1hdGVjb2xvcicsICdhbmltYXRlbW90aW9uJywgJ2FuaW1hdGV0cmFuc2Zvcm0nLCAnY2lyY2xlJywgJ2NsaXBwYXRoJywgJ2RlZnMnLCAnZGVzYycsICdlbGxpcHNlJywgJ2ZpbHRlcicsICdmb250JywgJ2cnLCAnZ2x5cGgnLCAnZ2x5cGhyZWYnLCAnaGtlcm4nLCAnaW1hZ2UnLCAnbGluZScsICdsaW5lYXJncmFkaWVudCcsICdtYXJrZXInLCAnbWFzaycsICdtZXRhZGF0YScsICdtcGF0aCcsICdwYXRoJywgJ3BhdHRlcm4nLCAncG9seWdvbicsICdwb2x5bGluZScsICdyYWRpYWxncmFkaWVudCcsICdyZWN0JywgJ3N0b3AnLCAnc3R5bGUnLCAnc3dpdGNoJywgJ3N5bWJvbCcsICd0ZXh0JywgJ3RleHRwYXRoJywgJ3RpdGxlJywgJ3RyZWYnLCAndHNwYW4nLCAndmlldycsICd2a2VybiddKTtcblxuICB2YXIgc3ZnRmlsdGVycyA9IGZyZWV6ZShbJ2ZlQmxlbmQnLCAnZmVDb2xvck1hdHJpeCcsICdmZUNvbXBvbmVudFRyYW5zZmVyJywgJ2ZlQ29tcG9zaXRlJywgJ2ZlQ29udm9sdmVNYXRyaXgnLCAnZmVEaWZmdXNlTGlnaHRpbmcnLCAnZmVEaXNwbGFjZW1lbnRNYXAnLCAnZmVEaXN0YW50TGlnaHQnLCAnZmVGbG9vZCcsICdmZUZ1bmNBJywgJ2ZlRnVuY0InLCAnZmVGdW5jRycsICdmZUZ1bmNSJywgJ2ZlR2F1c3NpYW5CbHVyJywgJ2ZlTWVyZ2UnLCAnZmVNZXJnZU5vZGUnLCAnZmVNb3JwaG9sb2d5JywgJ2ZlT2Zmc2V0JywgJ2ZlUG9pbnRMaWdodCcsICdmZVNwZWN1bGFyTGlnaHRpbmcnLCAnZmVTcG90TGlnaHQnLCAnZmVUaWxlJywgJ2ZlVHVyYnVsZW5jZSddKTtcblxuICAvLyBMaXN0IG9mIFNWRyBlbGVtZW50cyB0aGF0IGFyZSBkaXNhbGxvd2VkIGJ5IGRlZmF1bHQuXG4gIC8vIFdlIHN0aWxsIG5lZWQgdG8ga25vdyB0aGVtIHNvIHRoYXQgd2UgY2FuIGRvIG5hbWVzcGFjZVxuICAvLyBjaGVja3MgcHJvcGVybHkgaW4gY2FzZSBvbmUgd2FudHMgdG8gYWRkIHRoZW0gdG9cbiAgLy8gYWxsb3ctbGlzdC5cbiAgdmFyIHN2Z0Rpc2FsbG93ZWQgPSBmcmVlemUoWydhbmltYXRlJywgJ2NvbG9yLXByb2ZpbGUnLCAnY3Vyc29yJywgJ2Rpc2NhcmQnLCAnZmVkcm9wc2hhZG93JywgJ2ZlaW1hZ2UnLCAnZm9udC1mYWNlJywgJ2ZvbnQtZmFjZS1mb3JtYXQnLCAnZm9udC1mYWNlLW5hbWUnLCAnZm9udC1mYWNlLXNyYycsICdmb250LWZhY2UtdXJpJywgJ2ZvcmVpZ25vYmplY3QnLCAnaGF0Y2gnLCAnaGF0Y2hwYXRoJywgJ21lc2gnLCAnbWVzaGdyYWRpZW50JywgJ21lc2hwYXRjaCcsICdtZXNocm93JywgJ21pc3NpbmctZ2x5cGgnLCAnc2NyaXB0JywgJ3NldCcsICdzb2xpZGNvbG9yJywgJ3Vua25vd24nLCAndXNlJ10pO1xuXG4gIHZhciBtYXRoTWwgPSBmcmVlemUoWydtYXRoJywgJ21lbmNsb3NlJywgJ21lcnJvcicsICdtZmVuY2VkJywgJ21mcmFjJywgJ21nbHlwaCcsICdtaScsICdtbGFiZWxlZHRyJywgJ21tdWx0aXNjcmlwdHMnLCAnbW4nLCAnbW8nLCAnbW92ZXInLCAnbXBhZGRlZCcsICdtcGhhbnRvbScsICdtcm9vdCcsICdtcm93JywgJ21zJywgJ21zcGFjZScsICdtc3FydCcsICdtc3R5bGUnLCAnbXN1YicsICdtc3VwJywgJ21zdWJzdXAnLCAnbXRhYmxlJywgJ210ZCcsICdtdGV4dCcsICdtdHInLCAnbXVuZGVyJywgJ211bmRlcm92ZXInXSk7XG5cbiAgLy8gU2ltaWxhcmx5IHRvIFNWRywgd2Ugd2FudCB0byBrbm93IGFsbCBNYXRoTUwgZWxlbWVudHMsXG4gIC8vIGV2ZW4gdGhvc2UgdGhhdCB3ZSBkaXNhbGxvdyBieSBkZWZhdWx0LlxuICB2YXIgbWF0aE1sRGlzYWxsb3dlZCA9IGZyZWV6ZShbJ21hY3Rpb24nLCAnbWFsaWduZ3JvdXAnLCAnbWFsaWdubWFyaycsICdtbG9uZ2RpdicsICdtc2NhcnJpZXMnLCAnbXNjYXJyeScsICdtc2dyb3VwJywgJ21zdGFjaycsICdtc2xpbmUnLCAnbXNyb3cnLCAnc2VtYW50aWNzJywgJ2Fubm90YXRpb24nLCAnYW5ub3RhdGlvbi14bWwnLCAnbXByZXNjcmlwdHMnLCAnbm9uZSddKTtcblxuICB2YXIgdGV4dCA9IGZyZWV6ZShbJyN0ZXh0J10pO1xuXG4gIHZhciBodG1sJDEgPSBmcmVlemUoWydhY2NlcHQnLCAnYWN0aW9uJywgJ2FsaWduJywgJ2FsdCcsICdhdXRvY2FwaXRhbGl6ZScsICdhdXRvY29tcGxldGUnLCAnYXV0b3BpY3R1cmVpbnBpY3R1cmUnLCAnYXV0b3BsYXknLCAnYmFja2dyb3VuZCcsICdiZ2NvbG9yJywgJ2JvcmRlcicsICdjYXB0dXJlJywgJ2NlbGxwYWRkaW5nJywgJ2NlbGxzcGFjaW5nJywgJ2NoZWNrZWQnLCAnY2l0ZScsICdjbGFzcycsICdjbGVhcicsICdjb2xvcicsICdjb2xzJywgJ2NvbHNwYW4nLCAnY29udHJvbHMnLCAnY29udHJvbHNsaXN0JywgJ2Nvb3JkcycsICdjcm9zc29yaWdpbicsICdkYXRldGltZScsICdkZWNvZGluZycsICdkZWZhdWx0JywgJ2RpcicsICdkaXNhYmxlZCcsICdkaXNhYmxlcGljdHVyZWlucGljdHVyZScsICdkaXNhYmxlcmVtb3RlcGxheWJhY2snLCAnZG93bmxvYWQnLCAnZHJhZ2dhYmxlJywgJ2VuY3R5cGUnLCAnZW50ZXJrZXloaW50JywgJ2ZhY2UnLCAnZm9yJywgJ2hlYWRlcnMnLCAnaGVpZ2h0JywgJ2hpZGRlbicsICdoaWdoJywgJ2hyZWYnLCAnaHJlZmxhbmcnLCAnaWQnLCAnaW5wdXRtb2RlJywgJ2ludGVncml0eScsICdpc21hcCcsICdraW5kJywgJ2xhYmVsJywgJ2xhbmcnLCAnbGlzdCcsICdsb2FkaW5nJywgJ2xvb3AnLCAnbG93JywgJ21heCcsICdtYXhsZW5ndGgnLCAnbWVkaWEnLCAnbWV0aG9kJywgJ21pbicsICdtaW5sZW5ndGgnLCAnbXVsdGlwbGUnLCAnbXV0ZWQnLCAnbmFtZScsICdub3NoYWRlJywgJ25vdmFsaWRhdGUnLCAnbm93cmFwJywgJ29wZW4nLCAnb3B0aW11bScsICdwYXR0ZXJuJywgJ3BsYWNlaG9sZGVyJywgJ3BsYXlzaW5saW5lJywgJ3Bvc3RlcicsICdwcmVsb2FkJywgJ3B1YmRhdGUnLCAncmFkaW9ncm91cCcsICdyZWFkb25seScsICdyZWwnLCAncmVxdWlyZWQnLCAncmV2JywgJ3JldmVyc2VkJywgJ3JvbGUnLCAncm93cycsICdyb3dzcGFuJywgJ3NwZWxsY2hlY2snLCAnc2NvcGUnLCAnc2VsZWN0ZWQnLCAnc2hhcGUnLCAnc2l6ZScsICdzaXplcycsICdzcGFuJywgJ3NyY2xhbmcnLCAnc3RhcnQnLCAnc3JjJywgJ3NyY3NldCcsICdzdGVwJywgJ3N0eWxlJywgJ3N1bW1hcnknLCAndGFiaW5kZXgnLCAndGl0bGUnLCAndHJhbnNsYXRlJywgJ3R5cGUnLCAndXNlbWFwJywgJ3ZhbGlnbicsICd2YWx1ZScsICd3aWR0aCcsICd4bWxucyddKTtcblxuICB2YXIgc3ZnJDEgPSBmcmVlemUoWydhY2NlbnQtaGVpZ2h0JywgJ2FjY3VtdWxhdGUnLCAnYWRkaXRpdmUnLCAnYWxpZ25tZW50LWJhc2VsaW5lJywgJ2FzY2VudCcsICdhdHRyaWJ1dGVuYW1lJywgJ2F0dHJpYnV0ZXR5cGUnLCAnYXppbXV0aCcsICdiYXNlZnJlcXVlbmN5JywgJ2Jhc2VsaW5lLXNoaWZ0JywgJ2JlZ2luJywgJ2JpYXMnLCAnYnknLCAnY2xhc3MnLCAnY2xpcCcsICdjbGlwcGF0aHVuaXRzJywgJ2NsaXAtcGF0aCcsICdjbGlwLXJ1bGUnLCAnY29sb3InLCAnY29sb3ItaW50ZXJwb2xhdGlvbicsICdjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnMnLCAnY29sb3ItcHJvZmlsZScsICdjb2xvci1yZW5kZXJpbmcnLCAnY3gnLCAnY3knLCAnZCcsICdkeCcsICdkeScsICdkaWZmdXNlY29uc3RhbnQnLCAnZGlyZWN0aW9uJywgJ2Rpc3BsYXknLCAnZGl2aXNvcicsICdkdXInLCAnZWRnZW1vZGUnLCAnZWxldmF0aW9uJywgJ2VuZCcsICdmaWxsJywgJ2ZpbGwtb3BhY2l0eScsICdmaWxsLXJ1bGUnLCAnZmlsdGVyJywgJ2ZpbHRlcnVuaXRzJywgJ2Zsb29kLWNvbG9yJywgJ2Zsb29kLW9wYWNpdHknLCAnZm9udC1mYW1pbHknLCAnZm9udC1zaXplJywgJ2ZvbnQtc2l6ZS1hZGp1c3QnLCAnZm9udC1zdHJldGNoJywgJ2ZvbnQtc3R5bGUnLCAnZm9udC12YXJpYW50JywgJ2ZvbnQtd2VpZ2h0JywgJ2Z4JywgJ2Z5JywgJ2cxJywgJ2cyJywgJ2dseXBoLW5hbWUnLCAnZ2x5cGhyZWYnLCAnZ3JhZGllbnR1bml0cycsICdncmFkaWVudHRyYW5zZm9ybScsICdoZWlnaHQnLCAnaHJlZicsICdpZCcsICdpbWFnZS1yZW5kZXJpbmcnLCAnaW4nLCAnaW4yJywgJ2snLCAnazEnLCAnazInLCAnazMnLCAnazQnLCAna2VybmluZycsICdrZXlwb2ludHMnLCAna2V5c3BsaW5lcycsICdrZXl0aW1lcycsICdsYW5nJywgJ2xlbmd0aGFkanVzdCcsICdsZXR0ZXItc3BhY2luZycsICdrZXJuZWxtYXRyaXgnLCAna2VybmVsdW5pdGxlbmd0aCcsICdsaWdodGluZy1jb2xvcicsICdsb2NhbCcsICdtYXJrZXItZW5kJywgJ21hcmtlci1taWQnLCAnbWFya2VyLXN0YXJ0JywgJ21hcmtlcmhlaWdodCcsICdtYXJrZXJ1bml0cycsICdtYXJrZXJ3aWR0aCcsICdtYXNrY29udGVudHVuaXRzJywgJ21hc2t1bml0cycsICdtYXgnLCAnbWFzaycsICdtZWRpYScsICdtZXRob2QnLCAnbW9kZScsICdtaW4nLCAnbmFtZScsICdudW1vY3RhdmVzJywgJ29mZnNldCcsICdvcGVyYXRvcicsICdvcGFjaXR5JywgJ29yZGVyJywgJ29yaWVudCcsICdvcmllbnRhdGlvbicsICdvcmlnaW4nLCAnb3ZlcmZsb3cnLCAncGFpbnQtb3JkZXInLCAncGF0aCcsICdwYXRobGVuZ3RoJywgJ3BhdHRlcm5jb250ZW50dW5pdHMnLCAncGF0dGVybnRyYW5zZm9ybScsICdwYXR0ZXJudW5pdHMnLCAncG9pbnRzJywgJ3ByZXNlcnZlYWxwaGEnLCAncHJlc2VydmVhc3BlY3RyYXRpbycsICdwcmltaXRpdmV1bml0cycsICdyJywgJ3J4JywgJ3J5JywgJ3JhZGl1cycsICdyZWZ4JywgJ3JlZnknLCAncmVwZWF0Y291bnQnLCAncmVwZWF0ZHVyJywgJ3Jlc3RhcnQnLCAncmVzdWx0JywgJ3JvdGF0ZScsICdzY2FsZScsICdzZWVkJywgJ3NoYXBlLXJlbmRlcmluZycsICdzcGVjdWxhcmNvbnN0YW50JywgJ3NwZWN1bGFyZXhwb25lbnQnLCAnc3ByZWFkbWV0aG9kJywgJ3N0YXJ0b2Zmc2V0JywgJ3N0ZGRldmlhdGlvbicsICdzdGl0Y2h0aWxlcycsICdzdG9wLWNvbG9yJywgJ3N0b3Atb3BhY2l0eScsICdzdHJva2UtZGFzaGFycmF5JywgJ3N0cm9rZS1kYXNob2Zmc2V0JywgJ3N0cm9rZS1saW5lY2FwJywgJ3N0cm9rZS1saW5lam9pbicsICdzdHJva2UtbWl0ZXJsaW1pdCcsICdzdHJva2Utb3BhY2l0eScsICdzdHJva2UnLCAnc3Ryb2tlLXdpZHRoJywgJ3N0eWxlJywgJ3N1cmZhY2VzY2FsZScsICdzeXN0ZW1sYW5ndWFnZScsICd0YWJpbmRleCcsICd0YXJnZXR4JywgJ3RhcmdldHknLCAndHJhbnNmb3JtJywgJ3RleHQtYW5jaG9yJywgJ3RleHQtZGVjb3JhdGlvbicsICd0ZXh0LXJlbmRlcmluZycsICd0ZXh0bGVuZ3RoJywgJ3R5cGUnLCAndTEnLCAndTInLCAndW5pY29kZScsICd2YWx1ZXMnLCAndmlld2JveCcsICd2aXNpYmlsaXR5JywgJ3ZlcnNpb24nLCAndmVydC1hZHYteScsICd2ZXJ0LW9yaWdpbi14JywgJ3ZlcnQtb3JpZ2luLXknLCAnd2lkdGgnLCAnd29yZC1zcGFjaW5nJywgJ3dyYXAnLCAnd3JpdGluZy1tb2RlJywgJ3hjaGFubmVsc2VsZWN0b3InLCAneWNoYW5uZWxzZWxlY3RvcicsICd4JywgJ3gxJywgJ3gyJywgJ3htbG5zJywgJ3knLCAneTEnLCAneTInLCAneicsICd6b29tYW5kcGFuJ10pO1xuXG4gIHZhciBtYXRoTWwkMSA9IGZyZWV6ZShbJ2FjY2VudCcsICdhY2NlbnR1bmRlcicsICdhbGlnbicsICdiZXZlbGxlZCcsICdjbG9zZScsICdjb2x1bW5zYWxpZ24nLCAnY29sdW1ubGluZXMnLCAnY29sdW1uc3BhbicsICdkZW5vbWFsaWduJywgJ2RlcHRoJywgJ2RpcicsICdkaXNwbGF5JywgJ2Rpc3BsYXlzdHlsZScsICdlbmNvZGluZycsICdmZW5jZScsICdmcmFtZScsICdoZWlnaHQnLCAnaHJlZicsICdpZCcsICdsYXJnZW9wJywgJ2xlbmd0aCcsICdsaW5ldGhpY2tuZXNzJywgJ2xzcGFjZScsICdscXVvdGUnLCAnbWF0aGJhY2tncm91bmQnLCAnbWF0aGNvbG9yJywgJ21hdGhzaXplJywgJ21hdGh2YXJpYW50JywgJ21heHNpemUnLCAnbWluc2l6ZScsICdtb3ZhYmxlbGltaXRzJywgJ25vdGF0aW9uJywgJ251bWFsaWduJywgJ29wZW4nLCAncm93YWxpZ24nLCAncm93bGluZXMnLCAncm93c3BhY2luZycsICdyb3dzcGFuJywgJ3JzcGFjZScsICdycXVvdGUnLCAnc2NyaXB0bGV2ZWwnLCAnc2NyaXB0bWluc2l6ZScsICdzY3JpcHRzaXplbXVsdGlwbGllcicsICdzZWxlY3Rpb24nLCAnc2VwYXJhdG9yJywgJ3NlcGFyYXRvcnMnLCAnc3RyZXRjaHknLCAnc3Vic2NyaXB0c2hpZnQnLCAnc3Vwc2NyaXB0c2hpZnQnLCAnc3ltbWV0cmljJywgJ3ZvZmZzZXQnLCAnd2lkdGgnLCAneG1sbnMnXSk7XG5cbiAgdmFyIHhtbCA9IGZyZWV6ZShbJ3hsaW5rOmhyZWYnLCAneG1sOmlkJywgJ3hsaW5rOnRpdGxlJywgJ3htbDpzcGFjZScsICd4bWxuczp4bGluayddKTtcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9iZXR0ZXItcmVnZXhcbiAgdmFyIE1VU1RBQ0hFX0VYUFIgPSBzZWFsKC9cXHtcXHtbXFxzXFxTXSp8W1xcc1xcU10qXFx9XFx9L2dtKTsgLy8gU3BlY2lmeSB0ZW1wbGF0ZSBkZXRlY3Rpb24gcmVnZXggZm9yIFNBRkVfRk9SX1RFTVBMQVRFUyBtb2RlXG4gIHZhciBFUkJfRVhQUiA9IHNlYWwoLzwlW1xcc1xcU10qfFtcXHNcXFNdKiU+L2dtKTtcbiAgdmFyIERBVEFfQVRUUiA9IHNlYWwoL15kYXRhLVtcXC1cXHcuXFx1MDBCNy1cXHVGRkZGXS8pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZWxlc3MtZXNjYXBlXG4gIHZhciBBUklBX0FUVFIgPSBzZWFsKC9eYXJpYS1bXFwtXFx3XSskLyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlbGVzcy1lc2NhcGVcbiAgdmFyIElTX0FMTE9XRURfVVJJID0gc2VhbCgvXig/Oig/Oig/OmZ8aHQpdHBzP3xtYWlsdG98dGVsfGNhbGx0b3xjaWR8eG1wcCk6fFteYS16XXxbYS16Ky5cXC1dKyg/OlteYS16Ky5cXC06XXwkKSkvaSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZWxlc3MtZXNjYXBlXG4gICk7XG4gIHZhciBJU19TQ1JJUFRfT1JfREFUQSA9IHNlYWwoL14oPzpcXHcrc2NyaXB0fGRhdGEpOi9pKTtcbiAgdmFyIEFUVFJfV0hJVEVTUEFDRSA9IHNlYWwoL1tcXHUwMDAwLVxcdTAwMjBcXHUwMEEwXFx1MTY4MFxcdTE4MEVcXHUyMDAwLVxcdTIwMjlcXHUyMDVGXFx1MzAwMF0vZyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnRyb2wtcmVnZXhcbiAgKTtcblxuICB2YXIgX3R5cGVvZiA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07XG5cbiAgZnVuY3Rpb24gX3RvQ29uc3VtYWJsZUFycmF5JDEoYXJyKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgZm9yICh2YXIgaSA9IDAsIGFycjIgPSBBcnJheShhcnIubGVuZ3RoKTsgaSA8IGFyci5sZW5ndGg7IGkrKykgeyBhcnIyW2ldID0gYXJyW2ldOyB9IHJldHVybiBhcnIyOyB9IGVsc2UgeyByZXR1cm4gQXJyYXkuZnJvbShhcnIpOyB9IH1cblxuICB2YXIgZ2V0R2xvYmFsID0gZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHJldHVybiB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiB3aW5kb3c7XG4gIH07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuby1vcCBwb2xpY3kgZm9yIGludGVybmFsIHVzZSBvbmx5LlxuICAgKiBEb24ndCBleHBvcnQgdGhpcyBmdW5jdGlvbiBvdXRzaWRlIHRoaXMgbW9kdWxlIVxuICAgKiBAcGFyYW0gez9UcnVzdGVkVHlwZVBvbGljeUZhY3Rvcnl9IHRydXN0ZWRUeXBlcyBUaGUgcG9saWN5IGZhY3RvcnkuXG4gICAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvY3VtZW50IFRoZSBkb2N1bWVudCBvYmplY3QgKHRvIGRldGVybWluZSBwb2xpY3kgbmFtZSBzdWZmaXgpXG4gICAqIEByZXR1cm4gez9UcnVzdGVkVHlwZVBvbGljeX0gVGhlIHBvbGljeSBjcmVhdGVkIChvciBudWxsLCBpZiBUcnVzdGVkIFR5cGVzXG4gICAqIGFyZSBub3Qgc3VwcG9ydGVkKS5cbiAgICovXG4gIHZhciBfY3JlYXRlVHJ1c3RlZFR5cGVzUG9saWN5ID0gZnVuY3Rpb24gX2NyZWF0ZVRydXN0ZWRUeXBlc1BvbGljeSh0cnVzdGVkVHlwZXMsIGRvY3VtZW50KSB7XG4gICAgaWYgKCh0eXBlb2YgdHJ1c3RlZFR5cGVzID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZih0cnVzdGVkVHlwZXMpKSAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHRydXN0ZWRUeXBlcy5jcmVhdGVQb2xpY3kgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIEFsbG93IHRoZSBjYWxsZXJzIHRvIGNvbnRyb2wgdGhlIHVuaXF1ZSBwb2xpY3kgbmFtZVxuICAgIC8vIGJ5IGFkZGluZyBhIGRhdGEtdHQtcG9saWN5LXN1ZmZpeCB0byB0aGUgc2NyaXB0IGVsZW1lbnQgd2l0aCB0aGUgRE9NUHVyaWZ5LlxuICAgIC8vIFBvbGljeSBjcmVhdGlvbiB3aXRoIGR1cGxpY2F0ZSBuYW1lcyB0aHJvd3MgaW4gVHJ1c3RlZCBUeXBlcy5cbiAgICB2YXIgc3VmZml4ID0gbnVsbDtcbiAgICB2YXIgQVRUUl9OQU1FID0gJ2RhdGEtdHQtcG9saWN5LXN1ZmZpeCc7XG4gICAgaWYgKGRvY3VtZW50LmN1cnJlbnRTY3JpcHQgJiYgZG9jdW1lbnQuY3VycmVudFNjcmlwdC5oYXNBdHRyaWJ1dGUoQVRUUl9OQU1FKSkge1xuICAgICAgc3VmZml4ID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5nZXRBdHRyaWJ1dGUoQVRUUl9OQU1FKTtcbiAgICB9XG5cbiAgICB2YXIgcG9saWN5TmFtZSA9ICdkb21wdXJpZnknICsgKHN1ZmZpeCA/ICcjJyArIHN1ZmZpeCA6ICcnKTtcblxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdHJ1c3RlZFR5cGVzLmNyZWF0ZVBvbGljeShwb2xpY3lOYW1lLCB7XG4gICAgICAgIGNyZWF0ZUhUTUw6IGZ1bmN0aW9uIGNyZWF0ZUhUTUwoaHRtbCQkMSkge1xuICAgICAgICAgIHJldHVybiBodG1sJCQxO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICAvLyBQb2xpY3kgY3JlYXRpb24gZmFpbGVkIChtb3N0IGxpa2VseSBhbm90aGVyIERPTVB1cmlmeSBzY3JpcHQgaGFzXG4gICAgICAvLyBhbHJlYWR5IHJ1bikuIFNraXAgY3JlYXRpbmcgdGhlIHBvbGljeSwgYXMgdGhpcyB3aWxsIG9ubHkgY2F1c2UgZXJyb3JzXG4gICAgICAvLyBpZiBUVCBhcmUgZW5mb3JjZWQuXG4gICAgICBjb25zb2xlLndhcm4oJ1RydXN0ZWRUeXBlcyBwb2xpY3kgJyArIHBvbGljeU5hbWUgKyAnIGNvdWxkIG5vdCBiZSBjcmVhdGVkLicpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGNyZWF0ZURPTVB1cmlmeSgpIHtcbiAgICB2YXIgd2luZG93ID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBnZXRHbG9iYWwoKTtcblxuICAgIHZhciBET01QdXJpZnkgPSBmdW5jdGlvbiBET01QdXJpZnkocm9vdCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZURPTVB1cmlmeShyb290KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVmVyc2lvbiBsYWJlbCwgZXhwb3NlZCBmb3IgZWFzaWVyIGNoZWNrc1xuICAgICAqIGlmIERPTVB1cmlmeSBpcyB1cCB0byBkYXRlIG9yIG5vdFxuICAgICAqL1xuICAgIERPTVB1cmlmeS52ZXJzaW9uID0gJzIuMi43JztcblxuICAgIC8qKlxuICAgICAqIEFycmF5IG9mIGVsZW1lbnRzIHRoYXQgRE9NUHVyaWZ5IHJlbW92ZWQgZHVyaW5nIHNhbml0YXRpb24uXG4gICAgICogRW1wdHkgaWYgbm90aGluZyB3YXMgcmVtb3ZlZC5cbiAgICAgKi9cbiAgICBET01QdXJpZnkucmVtb3ZlZCA9IFtdO1xuXG4gICAgaWYgKCF3aW5kb3cgfHwgIXdpbmRvdy5kb2N1bWVudCB8fCB3aW5kb3cuZG9jdW1lbnQubm9kZVR5cGUgIT09IDkpIHtcbiAgICAgIC8vIE5vdCBydW5uaW5nIGluIGEgYnJvd3NlciwgcHJvdmlkZSBhIGZhY3RvcnkgZnVuY3Rpb25cbiAgICAgIC8vIHNvIHRoYXQgeW91IGNhbiBwYXNzIHlvdXIgb3duIFdpbmRvd1xuICAgICAgRE9NUHVyaWZ5LmlzU3VwcG9ydGVkID0gZmFsc2U7XG5cbiAgICAgIHJldHVybiBET01QdXJpZnk7XG4gICAgfVxuXG4gICAgdmFyIG9yaWdpbmFsRG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQ7XG5cbiAgICB2YXIgZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQ7XG4gICAgdmFyIERvY3VtZW50RnJhZ21lbnQgPSB3aW5kb3cuRG9jdW1lbnRGcmFnbWVudCxcbiAgICAgICAgSFRNTFRlbXBsYXRlRWxlbWVudCA9IHdpbmRvdy5IVE1MVGVtcGxhdGVFbGVtZW50LFxuICAgICAgICBOb2RlID0gd2luZG93Lk5vZGUsXG4gICAgICAgIEVsZW1lbnQgPSB3aW5kb3cuRWxlbWVudCxcbiAgICAgICAgTm9kZUZpbHRlciA9IHdpbmRvdy5Ob2RlRmlsdGVyLFxuICAgICAgICBfd2luZG93JE5hbWVkTm9kZU1hcCA9IHdpbmRvdy5OYW1lZE5vZGVNYXAsXG4gICAgICAgIE5hbWVkTm9kZU1hcCA9IF93aW5kb3ckTmFtZWROb2RlTWFwID09PSB1bmRlZmluZWQgPyB3aW5kb3cuTmFtZWROb2RlTWFwIHx8IHdpbmRvdy5Nb3pOYW1lZEF0dHJNYXAgOiBfd2luZG93JE5hbWVkTm9kZU1hcCxcbiAgICAgICAgVGV4dCA9IHdpbmRvdy5UZXh0LFxuICAgICAgICBDb21tZW50ID0gd2luZG93LkNvbW1lbnQsXG4gICAgICAgIERPTVBhcnNlciA9IHdpbmRvdy5ET01QYXJzZXIsXG4gICAgICAgIHRydXN0ZWRUeXBlcyA9IHdpbmRvdy50cnVzdGVkVHlwZXM7XG5cblxuICAgIHZhciBFbGVtZW50UHJvdG90eXBlID0gRWxlbWVudC5wcm90b3R5cGU7XG5cbiAgICB2YXIgY2xvbmVOb2RlID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICdjbG9uZU5vZGUnKTtcbiAgICB2YXIgZ2V0TmV4dFNpYmxpbmcgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ25leHRTaWJsaW5nJyk7XG4gICAgdmFyIGdldENoaWxkTm9kZXMgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ2NoaWxkTm9kZXMnKTtcbiAgICB2YXIgZ2V0UGFyZW50Tm9kZSA9IGxvb2t1cEdldHRlcihFbGVtZW50UHJvdG90eXBlLCAncGFyZW50Tm9kZScpO1xuXG4gICAgLy8gQXMgcGVyIGlzc3VlICM0NywgdGhlIHdlYi1jb21wb25lbnRzIHJlZ2lzdHJ5IGlzIGluaGVyaXRlZCBieSBhXG4gICAgLy8gbmV3IGRvY3VtZW50IGNyZWF0ZWQgdmlhIGNyZWF0ZUhUTUxEb2N1bWVudC4gQXMgcGVyIHRoZSBzcGVjXG4gICAgLy8gKGh0dHA6Ly93M2MuZ2l0aHViLmlvL3dlYmNvbXBvbmVudHMvc3BlYy9jdXN0b20vI2NyZWF0aW5nLWFuZC1wYXNzaW5nLXJlZ2lzdHJpZXMpXG4gICAgLy8gYSBuZXcgZW1wdHkgcmVnaXN0cnkgaXMgdXNlZCB3aGVuIGNyZWF0aW5nIGEgdGVtcGxhdGUgY29udGVudHMgb3duZXJcbiAgICAvLyBkb2N1bWVudCwgc28gd2UgdXNlIHRoYXQgYXMgb3VyIHBhcmVudCBkb2N1bWVudCB0byBlbnN1cmUgbm90aGluZ1xuICAgIC8vIGlzIGluaGVyaXRlZC5cbiAgICBpZiAodHlwZW9mIEhUTUxUZW1wbGF0ZUVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgICBpZiAodGVtcGxhdGUuY29udGVudCAmJiB0ZW1wbGF0ZS5jb250ZW50Lm93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgZG9jdW1lbnQgPSB0ZW1wbGF0ZS5jb250ZW50Lm93bmVyRG9jdW1lbnQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHRydXN0ZWRUeXBlc1BvbGljeSA9IF9jcmVhdGVUcnVzdGVkVHlwZXNQb2xpY3kodHJ1c3RlZFR5cGVzLCBvcmlnaW5hbERvY3VtZW50KTtcbiAgICB2YXIgZW1wdHlIVE1MID0gdHJ1c3RlZFR5cGVzUG9saWN5ICYmIFJFVFVSTl9UUlVTVEVEX1RZUEUgPyB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTCgnJykgOiAnJztcblxuICAgIHZhciBfZG9jdW1lbnQgPSBkb2N1bWVudCxcbiAgICAgICAgaW1wbGVtZW50YXRpb24gPSBfZG9jdW1lbnQuaW1wbGVtZW50YXRpb24sXG4gICAgICAgIGNyZWF0ZU5vZGVJdGVyYXRvciA9IF9kb2N1bWVudC5jcmVhdGVOb2RlSXRlcmF0b3IsXG4gICAgICAgIGdldEVsZW1lbnRzQnlUYWdOYW1lID0gX2RvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lLFxuICAgICAgICBjcmVhdGVEb2N1bWVudEZyYWdtZW50ID0gX2RvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQ7XG4gICAgdmFyIGltcG9ydE5vZGUgPSBvcmlnaW5hbERvY3VtZW50LmltcG9ydE5vZGU7XG5cblxuICAgIHZhciBkb2N1bWVudE1vZGUgPSB7fTtcbiAgICB0cnkge1xuICAgICAgZG9jdW1lbnRNb2RlID0gY2xvbmUoZG9jdW1lbnQpLmRvY3VtZW50TW9kZSA/IGRvY3VtZW50LmRvY3VtZW50TW9kZSA6IHt9O1xuICAgIH0gY2F0Y2ggKF8pIHt9XG5cbiAgICB2YXIgaG9va3MgPSB7fTtcblxuICAgIC8qKlxuICAgICAqIEV4cG9zZSB3aGV0aGVyIHRoaXMgYnJvd3NlciBzdXBwb3J0cyBydW5uaW5nIHRoZSBmdWxsIERPTVB1cmlmeS5cbiAgICAgKi9cbiAgICBET01QdXJpZnkuaXNTdXBwb3J0ZWQgPSB0eXBlb2YgZ2V0UGFyZW50Tm9kZSA9PT0gJ2Z1bmN0aW9uJyAmJiBpbXBsZW1lbnRhdGlvbiAmJiB0eXBlb2YgaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudE1vZGUgIT09IDk7XG5cbiAgICB2YXIgTVVTVEFDSEVfRVhQUiQkMSA9IE1VU1RBQ0hFX0VYUFIsXG4gICAgICAgIEVSQl9FWFBSJCQxID0gRVJCX0VYUFIsXG4gICAgICAgIERBVEFfQVRUUiQkMSA9IERBVEFfQVRUUixcbiAgICAgICAgQVJJQV9BVFRSJCQxID0gQVJJQV9BVFRSLFxuICAgICAgICBJU19TQ1JJUFRfT1JfREFUQSQkMSA9IElTX1NDUklQVF9PUl9EQVRBLFxuICAgICAgICBBVFRSX1dISVRFU1BBQ0UkJDEgPSBBVFRSX1dISVRFU1BBQ0U7XG4gICAgdmFyIElTX0FMTE9XRURfVVJJJCQxID0gSVNfQUxMT1dFRF9VUkk7XG5cbiAgICAvKipcbiAgICAgKiBXZSBjb25zaWRlciB0aGUgZWxlbWVudHMgYW5kIGF0dHJpYnV0ZXMgYmVsb3cgdG8gYmUgc2FmZS4gSWRlYWxseVxuICAgICAqIGRvbid0IGFkZCBhbnkgbmV3IG9uZXMgYnV0IGZlZWwgZnJlZSB0byByZW1vdmUgdW53YW50ZWQgb25lcy5cbiAgICAgKi9cblxuICAgIC8qIGFsbG93ZWQgZWxlbWVudCBuYW1lcyAqL1xuXG4gICAgdmFyIEFMTE9XRURfVEFHUyA9IG51bGw7XG4gICAgdmFyIERFRkFVTFRfQUxMT1dFRF9UQUdTID0gYWRkVG9TZXQoe30sIFtdLmNvbmNhdChfdG9Db25zdW1hYmxlQXJyYXkkMShodG1sKSwgX3RvQ29uc3VtYWJsZUFycmF5JDEoc3ZnKSwgX3RvQ29uc3VtYWJsZUFycmF5JDEoc3ZnRmlsdGVycyksIF90b0NvbnN1bWFibGVBcnJheSQxKG1hdGhNbCksIF90b0NvbnN1bWFibGVBcnJheSQxKHRleHQpKSk7XG5cbiAgICAvKiBBbGxvd2VkIGF0dHJpYnV0ZSBuYW1lcyAqL1xuICAgIHZhciBBTExPV0VEX0FUVFIgPSBudWxsO1xuICAgIHZhciBERUZBVUxUX0FMTE9XRURfQVRUUiA9IGFkZFRvU2V0KHt9LCBbXS5jb25jYXQoX3RvQ29uc3VtYWJsZUFycmF5JDEoaHRtbCQxKSwgX3RvQ29uc3VtYWJsZUFycmF5JDEoc3ZnJDEpLCBfdG9Db25zdW1hYmxlQXJyYXkkMShtYXRoTWwkMSksIF90b0NvbnN1bWFibGVBcnJheSQxKHhtbCkpKTtcblxuICAgIC8qIEV4cGxpY2l0bHkgZm9yYmlkZGVuIHRhZ3MgKG92ZXJyaWRlcyBBTExPV0VEX1RBR1MvQUREX1RBR1MpICovXG4gICAgdmFyIEZPUkJJRF9UQUdTID0gbnVsbDtcblxuICAgIC8qIEV4cGxpY2l0bHkgZm9yYmlkZGVuIGF0dHJpYnV0ZXMgKG92ZXJyaWRlcyBBTExPV0VEX0FUVFIvQUREX0FUVFIpICovXG4gICAgdmFyIEZPUkJJRF9BVFRSID0gbnVsbDtcblxuICAgIC8qIERlY2lkZSBpZiBBUklBIGF0dHJpYnV0ZXMgYXJlIG9rYXkgKi9cbiAgICB2YXIgQUxMT1dfQVJJQV9BVFRSID0gdHJ1ZTtcblxuICAgIC8qIERlY2lkZSBpZiBjdXN0b20gZGF0YSBhdHRyaWJ1dGVzIGFyZSBva2F5ICovXG4gICAgdmFyIEFMTE9XX0RBVEFfQVRUUiA9IHRydWU7XG5cbiAgICAvKiBEZWNpZGUgaWYgdW5rbm93biBwcm90b2NvbHMgYXJlIG9rYXkgKi9cbiAgICB2YXIgQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgPSBmYWxzZTtcblxuICAgIC8qIE91dHB1dCBzaG91bGQgYmUgc2FmZSBmb3IgY29tbW9uIHRlbXBsYXRlIGVuZ2luZXMuXG4gICAgICogVGhpcyBtZWFucywgRE9NUHVyaWZ5IHJlbW92ZXMgZGF0YSBhdHRyaWJ1dGVzLCBtdXN0YWNoZXMgYW5kIEVSQlxuICAgICAqL1xuICAgIHZhciBTQUZFX0ZPUl9URU1QTEFURVMgPSBmYWxzZTtcblxuICAgIC8qIERlY2lkZSBpZiBkb2N1bWVudCB3aXRoIDxodG1sPi4uLiBzaG91bGQgYmUgcmV0dXJuZWQgKi9cbiAgICB2YXIgV0hPTEVfRE9DVU1FTlQgPSBmYWxzZTtcblxuICAgIC8qIFRyYWNrIHdoZXRoZXIgY29uZmlnIGlzIGFscmVhZHkgc2V0IG9uIHRoaXMgaW5zdGFuY2Ugb2YgRE9NUHVyaWZ5LiAqL1xuICAgIHZhciBTRVRfQ09ORklHID0gZmFsc2U7XG5cbiAgICAvKiBEZWNpZGUgaWYgYWxsIGVsZW1lbnRzIChlLmcuIHN0eWxlLCBzY3JpcHQpIG11c3QgYmUgY2hpbGRyZW4gb2ZcbiAgICAgKiBkb2N1bWVudC5ib2R5LiBCeSBkZWZhdWx0LCBicm93c2VycyBtaWdodCBtb3ZlIHRoZW0gdG8gZG9jdW1lbnQuaGVhZCAqL1xuICAgIHZhciBGT1JDRV9CT0RZID0gZmFsc2U7XG5cbiAgICAvKiBEZWNpZGUgaWYgYSBET00gYEhUTUxCb2R5RWxlbWVudGAgc2hvdWxkIGJlIHJldHVybmVkLCBpbnN0ZWFkIG9mIGEgaHRtbFxuICAgICAqIHN0cmluZyAob3IgYSBUcnVzdGVkSFRNTCBvYmplY3QgaWYgVHJ1c3RlZCBUeXBlcyBhcmUgc3VwcG9ydGVkKS5cbiAgICAgKiBJZiBgV0hPTEVfRE9DVU1FTlRgIGlzIGVuYWJsZWQgYSBgSFRNTEh0bWxFbGVtZW50YCB3aWxsIGJlIHJldHVybmVkIGluc3RlYWRcbiAgICAgKi9cbiAgICB2YXIgUkVUVVJOX0RPTSA9IGZhbHNlO1xuXG4gICAgLyogRGVjaWRlIGlmIGEgRE9NIGBEb2N1bWVudEZyYWdtZW50YCBzaG91bGQgYmUgcmV0dXJuZWQsIGluc3RlYWQgb2YgYSBodG1sXG4gICAgICogc3RyaW5nICAob3IgYSBUcnVzdGVkSFRNTCBvYmplY3QgaWYgVHJ1c3RlZCBUeXBlcyBhcmUgc3VwcG9ydGVkKSAqL1xuICAgIHZhciBSRVRVUk5fRE9NX0ZSQUdNRU5UID0gZmFsc2U7XG5cbiAgICAvKiBJZiBgUkVUVVJOX0RPTWAgb3IgYFJFVFVSTl9ET01fRlJBR01FTlRgIGlzIGVuYWJsZWQsIGRlY2lkZSBpZiB0aGUgcmV0dXJuZWQgRE9NXG4gICAgICogYE5vZGVgIGlzIGltcG9ydGVkIGludG8gdGhlIGN1cnJlbnQgYERvY3VtZW50YC4gSWYgdGhpcyBmbGFnIGlzIG5vdCBlbmFibGVkIHRoZVxuICAgICAqIGBOb2RlYCB3aWxsIGJlbG9uZyAoaXRzIG93bmVyRG9jdW1lbnQpIHRvIGEgZnJlc2ggYEhUTUxEb2N1bWVudGAsIGNyZWF0ZWQgYnlcbiAgICAgKiBET01QdXJpZnkuXG4gICAgICpcbiAgICAgKiBUaGlzIGRlZmF1bHRzIHRvIGB0cnVlYCBzdGFydGluZyBET01QdXJpZnkgMi4yLjAuIE5vdGUgdGhhdCBzZXR0aW5nIGl0IHRvIGBmYWxzZWBcbiAgICAgKiBtaWdodCBjYXVzZSBYU1MgZnJvbSBhdHRhY2tzIGhpZGRlbiBpbiBjbG9zZWQgc2hhZG93cm9vdHMgaW4gY2FzZSB0aGUgYnJvd3NlclxuICAgICAqIHN1cHBvcnRzIERlY2xhcmF0aXZlIFNoYWRvdzogRE9NIGh0dHBzOi8vd2ViLmRldi9kZWNsYXJhdGl2ZS1zaGFkb3ctZG9tL1xuICAgICAqL1xuICAgIHZhciBSRVRVUk5fRE9NX0lNUE9SVCA9IHRydWU7XG5cbiAgICAvKiBUcnkgdG8gcmV0dXJuIGEgVHJ1c3RlZCBUeXBlIG9iamVjdCBpbnN0ZWFkIG9mIGEgc3RyaW5nLCByZXR1cm4gYSBzdHJpbmcgaW5cbiAgICAgKiBjYXNlIFRydXN0ZWQgVHlwZXMgYXJlIG5vdCBzdXBwb3J0ZWQgICovXG4gICAgdmFyIFJFVFVSTl9UUlVTVEVEX1RZUEUgPSBmYWxzZTtcblxuICAgIC8qIE91dHB1dCBzaG91bGQgYmUgZnJlZSBmcm9tIERPTSBjbG9iYmVyaW5nIGF0dGFja3M/ICovXG4gICAgdmFyIFNBTklUSVpFX0RPTSA9IHRydWU7XG5cbiAgICAvKiBLZWVwIGVsZW1lbnQgY29udGVudCB3aGVuIHJlbW92aW5nIGVsZW1lbnQ/ICovXG4gICAgdmFyIEtFRVBfQ09OVEVOVCA9IHRydWU7XG5cbiAgICAvKiBJZiBhIGBOb2RlYCBpcyBwYXNzZWQgdG8gc2FuaXRpemUoKSwgdGhlbiBwZXJmb3JtcyBzYW5pdGl6YXRpb24gaW4tcGxhY2UgaW5zdGVhZFxuICAgICAqIG9mIGltcG9ydGluZyBpdCBpbnRvIGEgbmV3IERvY3VtZW50IGFuZCByZXR1cm5pbmcgYSBzYW5pdGl6ZWQgY29weSAqL1xuICAgIHZhciBJTl9QTEFDRSA9IGZhbHNlO1xuXG4gICAgLyogQWxsb3cgdXNhZ2Ugb2YgcHJvZmlsZXMgbGlrZSBodG1sLCBzdmcgYW5kIG1hdGhNbCAqL1xuICAgIHZhciBVU0VfUFJPRklMRVMgPSB7fTtcblxuICAgIC8qIFRhZ3MgdG8gaWdub3JlIGNvbnRlbnQgb2Ygd2hlbiBLRUVQX0NPTlRFTlQgaXMgdHJ1ZSAqL1xuICAgIHZhciBGT1JCSURfQ09OVEVOVFMgPSBhZGRUb1NldCh7fSwgWydhbm5vdGF0aW9uLXhtbCcsICdhdWRpbycsICdjb2xncm91cCcsICdkZXNjJywgJ2ZvcmVpZ25vYmplY3QnLCAnaGVhZCcsICdpZnJhbWUnLCAnbWF0aCcsICdtaScsICdtbicsICdtbycsICdtcycsICdtdGV4dCcsICdub2VtYmVkJywgJ25vZnJhbWVzJywgJ25vc2NyaXB0JywgJ3BsYWludGV4dCcsICdzY3JpcHQnLCAnc3R5bGUnLCAnc3ZnJywgJ3RlbXBsYXRlJywgJ3RoZWFkJywgJ3RpdGxlJywgJ3ZpZGVvJywgJ3htcCddKTtcblxuICAgIC8qIFRhZ3MgdGhhdCBhcmUgc2FmZSBmb3IgZGF0YTogVVJJcyAqL1xuICAgIHZhciBEQVRBX1VSSV9UQUdTID0gbnVsbDtcbiAgICB2YXIgREVGQVVMVF9EQVRBX1VSSV9UQUdTID0gYWRkVG9TZXQoe30sIFsnYXVkaW8nLCAndmlkZW8nLCAnaW1nJywgJ3NvdXJjZScsICdpbWFnZScsICd0cmFjayddKTtcblxuICAgIC8qIEF0dHJpYnV0ZXMgc2FmZSBmb3IgdmFsdWVzIGxpa2UgXCJqYXZhc2NyaXB0OlwiICovXG4gICAgdmFyIFVSSV9TQUZFX0FUVFJJQlVURVMgPSBudWxsO1xuICAgIHZhciBERUZBVUxUX1VSSV9TQUZFX0FUVFJJQlVURVMgPSBhZGRUb1NldCh7fSwgWydhbHQnLCAnY2xhc3MnLCAnZm9yJywgJ2lkJywgJ2xhYmVsJywgJ25hbWUnLCAncGF0dGVybicsICdwbGFjZWhvbGRlcicsICdzdW1tYXJ5JywgJ3RpdGxlJywgJ3ZhbHVlJywgJ3N0eWxlJywgJ3htbG5zJ10pO1xuXG4gICAgLyogS2VlcCBhIHJlZmVyZW5jZSB0byBjb25maWcgdG8gcGFzcyB0byBob29rcyAqL1xuICAgIHZhciBDT05GSUcgPSBudWxsO1xuXG4gICAgLyogSWRlYWxseSwgZG8gbm90IHRvdWNoIGFueXRoaW5nIGJlbG93IHRoaXMgbGluZSAqL1xuICAgIC8qIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gKi9cblxuICAgIHZhciBmb3JtRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcblxuICAgIC8qKlxuICAgICAqIF9wYXJzZUNvbmZpZ1xuICAgICAqXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBjZmcgb3B0aW9uYWwgY29uZmlnIGxpdGVyYWxcbiAgICAgKi9cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuICAgIHZhciBfcGFyc2VDb25maWcgPSBmdW5jdGlvbiBfcGFyc2VDb25maWcoY2ZnKSB7XG4gICAgICBpZiAoQ09ORklHICYmIENPTkZJRyA9PT0gY2ZnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLyogU2hpZWxkIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGZyb20gdGFtcGVyaW5nICovXG4gICAgICBpZiAoIWNmZyB8fCAodHlwZW9mIGNmZyA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YoY2ZnKSkgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNmZyA9IHt9O1xuICAgICAgfVxuXG4gICAgICAvKiBTaGllbGQgY29uZmlndXJhdGlvbiBvYmplY3QgZnJvbSBwcm90b3R5cGUgcG9sbHV0aW9uICovXG4gICAgICBjZmcgPSBjbG9uZShjZmcpO1xuXG4gICAgICAvKiBTZXQgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzICovXG4gICAgICBBTExPV0VEX1RBR1MgPSAnQUxMT1dFRF9UQUdTJyBpbiBjZmcgPyBhZGRUb1NldCh7fSwgY2ZnLkFMTE9XRURfVEFHUykgOiBERUZBVUxUX0FMTE9XRURfVEFHUztcbiAgICAgIEFMTE9XRURfQVRUUiA9ICdBTExPV0VEX0FUVFInIGluIGNmZyA/IGFkZFRvU2V0KHt9LCBjZmcuQUxMT1dFRF9BVFRSKSA6IERFRkFVTFRfQUxMT1dFRF9BVFRSO1xuICAgICAgVVJJX1NBRkVfQVRUUklCVVRFUyA9ICdBRERfVVJJX1NBRkVfQVRUUicgaW4gY2ZnID8gYWRkVG9TZXQoY2xvbmUoREVGQVVMVF9VUklfU0FGRV9BVFRSSUJVVEVTKSwgY2ZnLkFERF9VUklfU0FGRV9BVFRSKSA6IERFRkFVTFRfVVJJX1NBRkVfQVRUUklCVVRFUztcbiAgICAgIERBVEFfVVJJX1RBR1MgPSAnQUREX0RBVEFfVVJJX1RBR1MnIGluIGNmZyA/IGFkZFRvU2V0KGNsb25lKERFRkFVTFRfREFUQV9VUklfVEFHUyksIGNmZy5BRERfREFUQV9VUklfVEFHUykgOiBERUZBVUxUX0RBVEFfVVJJX1RBR1M7XG4gICAgICBGT1JCSURfVEFHUyA9ICdGT1JCSURfVEFHUycgaW4gY2ZnID8gYWRkVG9TZXQoe30sIGNmZy5GT1JCSURfVEFHUykgOiB7fTtcbiAgICAgIEZPUkJJRF9BVFRSID0gJ0ZPUkJJRF9BVFRSJyBpbiBjZmcgPyBhZGRUb1NldCh7fSwgY2ZnLkZPUkJJRF9BVFRSKSA6IHt9O1xuICAgICAgVVNFX1BST0ZJTEVTID0gJ1VTRV9QUk9GSUxFUycgaW4gY2ZnID8gY2ZnLlVTRV9QUk9GSUxFUyA6IGZhbHNlO1xuICAgICAgQUxMT1dfQVJJQV9BVFRSID0gY2ZnLkFMTE9XX0FSSUFfQVRUUiAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgICAgQUxMT1dfREFUQV9BVFRSID0gY2ZnLkFMTE9XX0RBVEFfQVRUUiAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgICAgQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgPSBjZmcuQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICAgIFNBRkVfRk9SX1RFTVBMQVRFUyA9IGNmZy5TQUZFX0ZPUl9URU1QTEFURVMgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICAgIFdIT0xFX0RPQ1VNRU5UID0gY2ZnLldIT0xFX0RPQ1VNRU5UIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgICBSRVRVUk5fRE9NID0gY2ZnLlJFVFVSTl9ET00gfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICAgIFJFVFVSTl9ET01fRlJBR01FTlQgPSBjZmcuUkVUVVJOX0RPTV9GUkFHTUVOVCB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgICAgUkVUVVJOX0RPTV9JTVBPUlQgPSBjZmcuUkVUVVJOX0RPTV9JTVBPUlQgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICAgIFJFVFVSTl9UUlVTVEVEX1RZUEUgPSBjZmcuUkVUVVJOX1RSVVNURURfVFlQRSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgICAgRk9SQ0VfQk9EWSA9IGNmZy5GT1JDRV9CT0RZIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgICBTQU5JVElaRV9ET00gPSBjZmcuU0FOSVRJWkVfRE9NICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgICBLRUVQX0NPTlRFTlQgPSBjZmcuS0VFUF9DT05URU5UICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgICBJTl9QTEFDRSA9IGNmZy5JTl9QTEFDRSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgICAgSVNfQUxMT1dFRF9VUkkkJDEgPSBjZmcuQUxMT1dFRF9VUklfUkVHRVhQIHx8IElTX0FMTE9XRURfVVJJJCQxO1xuICAgICAgaWYgKFNBRkVfRk9SX1RFTVBMQVRFUykge1xuICAgICAgICBBTExPV19EQVRBX0FUVFIgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKFJFVFVSTl9ET01fRlJBR01FTlQpIHtcbiAgICAgICAgUkVUVVJOX0RPTSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8qIFBhcnNlIHByb2ZpbGUgaW5mbyAqL1xuICAgICAgaWYgKFVTRV9QUk9GSUxFUykge1xuICAgICAgICBBTExPV0VEX1RBR1MgPSBhZGRUb1NldCh7fSwgW10uY29uY2F0KF90b0NvbnN1bWFibGVBcnJheSQxKHRleHQpKSk7XG4gICAgICAgIEFMTE9XRURfQVRUUiA9IFtdO1xuICAgICAgICBpZiAoVVNFX1BST0ZJTEVTLmh0bWwgPT09IHRydWUpIHtcbiAgICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIGh0bWwpO1xuICAgICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgaHRtbCQxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVU0VfUFJPRklMRVMuc3ZnID09PSB0cnVlKSB7XG4gICAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBzdmcpO1xuICAgICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgc3ZnJDEpO1xuICAgICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgeG1sKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVU0VfUFJPRklMRVMuc3ZnRmlsdGVycyA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgc3ZnRmlsdGVycyk7XG4gICAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBzdmckMSk7XG4gICAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCB4bWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFVTRV9QUk9GSUxFUy5tYXRoTWwgPT09IHRydWUpIHtcbiAgICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIG1hdGhNbCk7XG4gICAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBtYXRoTWwkMSk7XG4gICAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCB4bWwpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8qIE1lcmdlIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyAqL1xuICAgICAgaWYgKGNmZy5BRERfVEFHUykge1xuICAgICAgICBpZiAoQUxMT1dFRF9UQUdTID09PSBERUZBVUxUX0FMTE9XRURfVEFHUykge1xuICAgICAgICAgIEFMTE9XRURfVEFHUyA9IGNsb25lKEFMTE9XRURfVEFHUyk7XG4gICAgICAgIH1cblxuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIGNmZy5BRERfVEFHUyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjZmcuQUREX0FUVFIpIHtcbiAgICAgICAgaWYgKEFMTE9XRURfQVRUUiA9PT0gREVGQVVMVF9BTExPV0VEX0FUVFIpIHtcbiAgICAgICAgICBBTExPV0VEX0FUVFIgPSBjbG9uZShBTExPV0VEX0FUVFIpO1xuICAgICAgICB9XG5cbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBjZmcuQUREX0FUVFIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2ZnLkFERF9VUklfU0FGRV9BVFRSKSB7XG4gICAgICAgIGFkZFRvU2V0KFVSSV9TQUZFX0FUVFJJQlVURVMsIGNmZy5BRERfVVJJX1NBRkVfQVRUUik7XG4gICAgICB9XG5cbiAgICAgIC8qIEFkZCAjdGV4dCBpbiBjYXNlIEtFRVBfQ09OVEVOVCBpcyBzZXQgdG8gdHJ1ZSAqL1xuICAgICAgaWYgKEtFRVBfQ09OVEVOVCkge1xuICAgICAgICBBTExPV0VEX1RBR1NbJyN0ZXh0J10gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvKiBBZGQgaHRtbCwgaGVhZCBhbmQgYm9keSB0byBBTExPV0VEX1RBR1MgaW4gY2FzZSBXSE9MRV9ET0NVTUVOVCBpcyB0cnVlICovXG4gICAgICBpZiAoV0hPTEVfRE9DVU1FTlQpIHtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBbJ2h0bWwnLCAnaGVhZCcsICdib2R5J10pO1xuICAgICAgfVxuXG4gICAgICAvKiBBZGQgdGJvZHkgdG8gQUxMT1dFRF9UQUdTIGluIGNhc2UgdGFibGVzIGFyZSBwZXJtaXR0ZWQsIHNlZSAjMjg2LCAjMzY1ICovXG4gICAgICBpZiAoQUxMT1dFRF9UQUdTLnRhYmxlKSB7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgWyd0Ym9keSddKTtcbiAgICAgICAgZGVsZXRlIEZPUkJJRF9UQUdTLnRib2R5O1xuICAgICAgfVxuXG4gICAgICAvLyBQcmV2ZW50IGZ1cnRoZXIgbWFuaXB1bGF0aW9uIG9mIGNvbmZpZ3VyYXRpb24uXG4gICAgICAvLyBOb3QgYXZhaWxhYmxlIGluIElFOCwgU2FmYXJpIDUsIGV0Yy5cbiAgICAgIGlmIChmcmVlemUpIHtcbiAgICAgICAgZnJlZXplKGNmZyk7XG4gICAgICB9XG5cbiAgICAgIENPTkZJRyA9IGNmZztcbiAgICB9O1xuXG4gICAgdmFyIE1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UUyA9IGFkZFRvU2V0KHt9LCBbJ21pJywgJ21vJywgJ21uJywgJ21zJywgJ210ZXh0J10pO1xuXG4gICAgdmFyIEhUTUxfSU5URUdSQVRJT05fUE9JTlRTID0gYWRkVG9TZXQoe30sIFsnZm9yZWlnbm9iamVjdCcsICdkZXNjJywgJ3RpdGxlJywgJ2Fubm90YXRpb24teG1sJ10pO1xuXG4gICAgLyogS2VlcCB0cmFjayBvZiBhbGwgcG9zc2libGUgU1ZHIGFuZCBNYXRoTUwgdGFnc1xuICAgICAqIHNvIHRoYXQgd2UgY2FuIHBlcmZvcm0gdGhlIG5hbWVzcGFjZSBjaGVja3NcbiAgICAgKiBjb3JyZWN0bHkuICovXG4gICAgdmFyIEFMTF9TVkdfVEFHUyA9IGFkZFRvU2V0KHt9LCBzdmcpO1xuICAgIGFkZFRvU2V0KEFMTF9TVkdfVEFHUywgc3ZnRmlsdGVycyk7XG4gICAgYWRkVG9TZXQoQUxMX1NWR19UQUdTLCBzdmdEaXNhbGxvd2VkKTtcblxuICAgIHZhciBBTExfTUFUSE1MX1RBR1MgPSBhZGRUb1NldCh7fSwgbWF0aE1sKTtcbiAgICBhZGRUb1NldChBTExfTUFUSE1MX1RBR1MsIG1hdGhNbERpc2FsbG93ZWQpO1xuXG4gICAgdmFyIE1BVEhNTF9OQU1FU1BBQ0UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoL01hdGhNTCc7XG4gICAgdmFyIFNWR19OQU1FU1BBQ0UgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICAgIHZhciBIVE1MX05BTUVTUEFDRSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sJztcblxuICAgIC8qKlxuICAgICAqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtFbGVtZW50fSBlbGVtZW50IGEgRE9NIGVsZW1lbnQgd2hvc2UgbmFtZXNwYWNlIGlzIGJlaW5nIGNoZWNrZWRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJuIGZhbHNlIGlmIHRoZSBlbGVtZW50IGhhcyBhXG4gICAgICogIG5hbWVzcGFjZSB0aGF0IGEgc3BlYy1jb21wbGlhbnQgcGFyc2VyIHdvdWxkIG5ldmVyXG4gICAgICogIHJldHVybi4gUmV0dXJuIHRydWUgb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIHZhciBfY2hlY2tWYWxpZE5hbWVzcGFjZSA9IGZ1bmN0aW9uIF9jaGVja1ZhbGlkTmFtZXNwYWNlKGVsZW1lbnQpIHtcbiAgICAgIHZhciBwYXJlbnQgPSBnZXRQYXJlbnROb2RlKGVsZW1lbnQpO1xuXG4gICAgICAvLyBJbiBKU0RPTSwgaWYgd2UncmUgaW5zaWRlIHNoYWRvdyBET00sIHRoZW4gcGFyZW50Tm9kZVxuICAgICAgLy8gY2FuIGJlIG51bGwuIFdlIGp1c3Qgc2ltdWxhdGUgcGFyZW50IGluIHRoaXMgY2FzZS5cbiAgICAgIGlmICghcGFyZW50IHx8ICFwYXJlbnQudGFnTmFtZSkge1xuICAgICAgICBwYXJlbnQgPSB7XG4gICAgICAgICAgbmFtZXNwYWNlVVJJOiBIVE1MX05BTUVTUEFDRSxcbiAgICAgICAgICB0YWdOYW1lOiAndGVtcGxhdGUnXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHZhciB0YWdOYW1lID0gc3RyaW5nVG9Mb3dlckNhc2UoZWxlbWVudC50YWdOYW1lKTtcbiAgICAgIHZhciBwYXJlbnRUYWdOYW1lID0gc3RyaW5nVG9Mb3dlckNhc2UocGFyZW50LnRhZ05hbWUpO1xuXG4gICAgICBpZiAoZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IFNWR19OQU1FU1BBQ0UpIHtcbiAgICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIEhUTUwgbmFtZXNwYWNlIHRvIFNWR1xuICAgICAgICAvLyBpcyB2aWEgPHN2Zz4uIElmIGl0IGhhcHBlbnMgdmlhIGFueSBvdGhlciB0YWcsIHRoZW5cbiAgICAgICAgLy8gaXQgc2hvdWxkIGJlIGtpbGxlZC5cbiAgICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdzdmcnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIE1hdGhNTCB0byBTVkcgaXMgdmlhXG4gICAgICAgIC8vIHN2ZyBpZiBwYXJlbnQgaXMgZWl0aGVyIDxhbm5vdGF0aW9uLXhtbD4gb3IgTWF0aE1MXG4gICAgICAgIC8vIHRleHQgaW50ZWdyYXRpb24gcG9pbnRzLlxuICAgICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gTUFUSE1MX05BTUVTUEFDRSkge1xuICAgICAgICAgIHJldHVybiB0YWdOYW1lID09PSAnc3ZnJyAmJiAocGFyZW50VGFnTmFtZSA9PT0gJ2Fubm90YXRpb24teG1sJyB8fCBNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFNbcGFyZW50VGFnTmFtZV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2Ugb25seSBhbGxvdyBlbGVtZW50cyB0aGF0IGFyZSBkZWZpbmVkIGluIFNWR1xuICAgICAgICAvLyBzcGVjLiBBbGwgb3RoZXJzIGFyZSBkaXNhbGxvd2VkIGluIFNWRyBuYW1lc3BhY2UuXG4gICAgICAgIHJldHVybiBCb29sZWFuKEFMTF9TVkdfVEFHU1t0YWdOYW1lXSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChlbGVtZW50Lm5hbWVzcGFjZVVSSSA9PT0gTUFUSE1MX05BTUVTUEFDRSkge1xuICAgICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gSFRNTCBuYW1lc3BhY2UgdG8gTWF0aE1MXG4gICAgICAgIC8vIGlzIHZpYSA8bWF0aD4uIElmIGl0IGhhcHBlbnMgdmlhIGFueSBvdGhlciB0YWcsIHRoZW5cbiAgICAgICAgLy8gaXQgc2hvdWxkIGJlIGtpbGxlZC5cbiAgICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdtYXRoJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBTVkcgdG8gTWF0aE1MIGlzIHZpYVxuICAgICAgICAvLyA8bWF0aD4gYW5kIEhUTUwgaW50ZWdyYXRpb24gcG9pbnRzXG4gICAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBTVkdfTkFNRVNQQUNFKSB7XG4gICAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdtYXRoJyAmJiBIVE1MX0lOVEVHUkFUSU9OX1BPSU5UU1twYXJlbnRUYWdOYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIG9ubHkgYWxsb3cgZWxlbWVudHMgdGhhdCBhcmUgZGVmaW5lZCBpbiBNYXRoTUxcbiAgICAgICAgLy8gc3BlYy4gQWxsIG90aGVycyBhcmUgZGlzYWxsb3dlZCBpbiBNYXRoTUwgbmFtZXNwYWNlLlxuICAgICAgICByZXR1cm4gQm9vbGVhbihBTExfTUFUSE1MX1RBR1NbdGFnTmFtZV0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBTVkcgdG8gSFRNTCBpcyB2aWFcbiAgICAgICAgLy8gSFRNTCBpbnRlZ3JhdGlvbiBwb2ludHMsIGFuZCBmcm9tIE1hdGhNTCB0byBIVE1MXG4gICAgICAgIC8vIGlzIHZpYSBNYXRoTUwgdGV4dCBpbnRlZ3JhdGlvbiBwb2ludHNcbiAgICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IFNWR19OQU1FU1BBQ0UgJiYgIUhUTUxfSU5URUdSQVRJT05fUE9JTlRTW3BhcmVudFRhZ05hbWVdKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IE1BVEhNTF9OQU1FU1BBQ0UgJiYgIU1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UU1twYXJlbnRUYWdOYW1lXSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENlcnRhaW4gZWxlbWVudHMgYXJlIGFsbG93ZWQgaW4gYm90aCBTVkcgYW5kIEhUTUxcbiAgICAgICAgLy8gbmFtZXNwYWNlLiBXZSBuZWVkIHRvIHNwZWNpZnkgdGhlbSBleHBsaWNpdGx5XG4gICAgICAgIC8vIHNvIHRoYXQgdGhleSBkb24ndCBnZXQgZXJyb25vdXNseSBkZWxldGVkIGZyb21cbiAgICAgICAgLy8gSFRNTCBuYW1lc3BhY2UuXG4gICAgICAgIHZhciBjb21tb25TdmdBbmRIVE1MRWxlbWVudHMgPSBhZGRUb1NldCh7fSwgWyd0aXRsZScsICdzdHlsZScsICdmb250JywgJ2EnLCAnc2NyaXB0J10pO1xuXG4gICAgICAgIC8vIFdlIGRpc2FsbG93IHRhZ3MgdGhhdCBhcmUgc3BlY2lmaWMgZm9yIE1hdGhNTFxuICAgICAgICAvLyBvciBTVkcgYW5kIHNob3VsZCBuZXZlciBhcHBlYXIgaW4gSFRNTCBuYW1lc3BhY2VcbiAgICAgICAgcmV0dXJuICFBTExfTUFUSE1MX1RBR1NbdGFnTmFtZV0gJiYgKGNvbW1vblN2Z0FuZEhUTUxFbGVtZW50c1t0YWdOYW1lXSB8fCAhQUxMX1NWR19UQUdTW3RhZ05hbWVdKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGNvZGUgc2hvdWxkIG5ldmVyIHJlYWNoIHRoaXMgcGxhY2UgKHRoaXMgbWVhbnNcbiAgICAgIC8vIHRoYXQgdGhlIGVsZW1lbnQgc29tZWhvdyBnb3QgbmFtZXNwYWNlIHRoYXQgaXMgbm90XG4gICAgICAvLyBIVE1MLCBTVkcgb3IgTWF0aE1MKS4gUmV0dXJuIGZhbHNlIGp1c3QgaW4gY2FzZS5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogX2ZvcmNlUmVtb3ZlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtOb2RlfSBub2RlIGEgRE9NIG5vZGVcbiAgICAgKi9cbiAgICB2YXIgX2ZvcmNlUmVtb3ZlID0gZnVuY3Rpb24gX2ZvcmNlUmVtb3ZlKG5vZGUpIHtcbiAgICAgIGFycmF5UHVzaChET01QdXJpZnkucmVtb3ZlZCwgeyBlbGVtZW50OiBub2RlIH0pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG5vZGUub3V0ZXJIVE1MID0gZW1wdHlIVE1MO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgbm9kZS5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBfcmVtb3ZlQXR0cmlidXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IG5hbWUgYW4gQXR0cmlidXRlIG5hbWVcbiAgICAgKiBAcGFyYW0gIHtOb2RlfSBub2RlIGEgRE9NIG5vZGVcbiAgICAgKi9cbiAgICB2YXIgX3JlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgbm9kZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXJyYXlQdXNoKERPTVB1cmlmeS5yZW1vdmVkLCB7XG4gICAgICAgICAgYXR0cmlidXRlOiBub2RlLmdldEF0dHJpYnV0ZU5vZGUobmFtZSksXG4gICAgICAgICAgZnJvbTogbm9kZVxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgYXJyYXlQdXNoKERPTVB1cmlmeS5yZW1vdmVkLCB7XG4gICAgICAgICAgYXR0cmlidXRlOiBudWxsLFxuICAgICAgICAgIGZyb206IG5vZGVcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuXG4gICAgICAvLyBXZSB2b2lkIGF0dHJpYnV0ZSB2YWx1ZXMgZm9yIHVucmVtb3ZhYmxlIFwiaXNcIlwiIGF0dHJpYnV0ZXNcbiAgICAgIGlmIChuYW1lID09PSAnaXMnICYmICFBTExPV0VEX0FUVFJbbmFtZV0pIHtcbiAgICAgICAgaWYgKFJFVFVSTl9ET00gfHwgUkVUVVJOX0RPTV9GUkFHTUVOVCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBfZm9yY2VSZW1vdmUobm9kZSk7XG4gICAgICAgICAgfSBjYXRjaCAoXykge31cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUobmFtZSwgJycpO1xuICAgICAgICAgIH0gY2F0Y2ggKF8pIHt9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogX2luaXREb2N1bWVudFxuICAgICAqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBkaXJ0eSBhIHN0cmluZyBvZiBkaXJ0eSBtYXJrdXBcbiAgICAgKiBAcmV0dXJuIHtEb2N1bWVudH0gYSBET00sIGZpbGxlZCB3aXRoIHRoZSBkaXJ0eSBtYXJrdXBcbiAgICAgKi9cbiAgICB2YXIgX2luaXREb2N1bWVudCA9IGZ1bmN0aW9uIF9pbml0RG9jdW1lbnQoZGlydHkpIHtcbiAgICAgIC8qIENyZWF0ZSBhIEhUTUwgZG9jdW1lbnQgKi9cbiAgICAgIHZhciBkb2MgPSB2b2lkIDA7XG4gICAgICB2YXIgbGVhZGluZ1doaXRlc3BhY2UgPSB2b2lkIDA7XG5cbiAgICAgIGlmIChGT1JDRV9CT0RZKSB7XG4gICAgICAgIGRpcnR5ID0gJzxyZW1vdmU+PC9yZW1vdmU+JyArIGRpcnR5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLyogSWYgRk9SQ0VfQk9EWSBpc24ndCB1c2VkLCBsZWFkaW5nIHdoaXRlc3BhY2UgbmVlZHMgdG8gYmUgcHJlc2VydmVkIG1hbnVhbGx5ICovXG4gICAgICAgIHZhciBtYXRjaGVzID0gc3RyaW5nTWF0Y2goZGlydHksIC9eW1xcclxcblxcdCBdKy8pO1xuICAgICAgICBsZWFkaW5nV2hpdGVzcGFjZSA9IG1hdGNoZXMgJiYgbWF0Y2hlc1swXTtcbiAgICAgIH1cblxuICAgICAgdmFyIGRpcnR5UGF5bG9hZCA9IHRydXN0ZWRUeXBlc1BvbGljeSA/IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKGRpcnR5KSA6IGRpcnR5O1xuICAgICAgLyogVXNlIHRoZSBET01QYXJzZXIgQVBJIGJ5IGRlZmF1bHQsIGZhbGxiYWNrIGxhdGVyIGlmIG5lZWRzIGJlICovXG4gICAgICB0cnkge1xuICAgICAgICBkb2MgPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKGRpcnR5UGF5bG9hZCwgJ3RleHQvaHRtbCcpO1xuICAgICAgfSBjYXRjaCAoXykge31cblxuICAgICAgLyogVXNlIGNyZWF0ZUhUTUxEb2N1bWVudCBpbiBjYXNlIERPTVBhcnNlciBpcyBub3QgYXZhaWxhYmxlICovXG4gICAgICBpZiAoIWRvYyB8fCAhZG9jLmRvY3VtZW50RWxlbWVudCkge1xuICAgICAgICBkb2MgPSBpbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQoJycpO1xuICAgICAgICB2YXIgX2RvYyA9IGRvYyxcbiAgICAgICAgICAgIGJvZHkgPSBfZG9jLmJvZHk7XG5cbiAgICAgICAgYm9keS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGJvZHkucGFyZW50Tm9kZS5maXJzdEVsZW1lbnRDaGlsZCk7XG4gICAgICAgIGJvZHkub3V0ZXJIVE1MID0gZGlydHlQYXlsb2FkO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGlydHkgJiYgbGVhZGluZ1doaXRlc3BhY2UpIHtcbiAgICAgICAgZG9jLmJvZHkuaW5zZXJ0QmVmb3JlKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGxlYWRpbmdXaGl0ZXNwYWNlKSwgZG9jLmJvZHkuY2hpbGROb2Rlc1swXSB8fCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgLyogV29yayBvbiB3aG9sZSBkb2N1bWVudCBvciBqdXN0IGl0cyBib2R5ICovXG4gICAgICByZXR1cm4gZ2V0RWxlbWVudHNCeVRhZ05hbWUuY2FsbChkb2MsIFdIT0xFX0RPQ1VNRU5UID8gJ2h0bWwnIDogJ2JvZHknKVswXTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogX2NyZWF0ZUl0ZXJhdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtEb2N1bWVudH0gcm9vdCBkb2N1bWVudC9mcmFnbWVudCB0byBjcmVhdGUgaXRlcmF0b3IgZm9yXG4gICAgICogQHJldHVybiB7SXRlcmF0b3J9IGl0ZXJhdG9yIGluc3RhbmNlXG4gICAgICovXG4gICAgdmFyIF9jcmVhdGVJdGVyYXRvciA9IGZ1bmN0aW9uIF9jcmVhdGVJdGVyYXRvcihyb290KSB7XG4gICAgICByZXR1cm4gY3JlYXRlTm9kZUl0ZXJhdG9yLmNhbGwocm9vdC5vd25lckRvY3VtZW50IHx8IHJvb3QsIHJvb3QsIE5vZGVGaWx0ZXIuU0hPV19FTEVNRU5UIHwgTm9kZUZpbHRlci5TSE9XX0NPTU1FTlQgfCBOb2RlRmlsdGVyLlNIT1dfVEVYVCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gTm9kZUZpbHRlci5GSUxURVJfQUNDRVBUO1xuICAgICAgfSwgZmFsc2UpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBfaXNDbG9iYmVyZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge05vZGV9IGVsbSBlbGVtZW50IHRvIGNoZWNrIGZvciBjbG9iYmVyaW5nIGF0dGFja3NcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGNsb2JiZXJlZCwgZmFsc2UgaWYgc2FmZVxuICAgICAqL1xuICAgIHZhciBfaXNDbG9iYmVyZWQgPSBmdW5jdGlvbiBfaXNDbG9iYmVyZWQoZWxtKSB7XG4gICAgICBpZiAoZWxtIGluc3RhbmNlb2YgVGV4dCB8fCBlbG0gaW5zdGFuY2VvZiBDb21tZW50KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBlbG0ubm9kZU5hbWUgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlbG0udGV4dENvbnRlbnQgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlbG0ucmVtb3ZlQ2hpbGQgIT09ICdmdW5jdGlvbicgfHwgIShlbG0uYXR0cmlidXRlcyBpbnN0YW5jZW9mIE5hbWVkTm9kZU1hcCkgfHwgdHlwZW9mIGVsbS5yZW1vdmVBdHRyaWJ1dGUgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIGVsbS5zZXRBdHRyaWJ1dGUgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIGVsbS5uYW1lc3BhY2VVUkkgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlbG0uaW5zZXJ0QmVmb3JlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIF9pc05vZGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge05vZGV9IG9iaiBvYmplY3QgdG8gY2hlY2sgd2hldGhlciBpdCdzIGEgRE9NIG5vZGVcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlzIG9iamVjdCBpcyBhIERPTSBub2RlXG4gICAgICovXG4gICAgdmFyIF9pc05vZGUgPSBmdW5jdGlvbiBfaXNOb2RlKG9iamVjdCkge1xuICAgICAgcmV0dXJuICh0eXBlb2YgTm9kZSA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YoTm9kZSkpID09PSAnb2JqZWN0JyA/IG9iamVjdCBpbnN0YW5jZW9mIE5vZGUgOiBvYmplY3QgJiYgKHR5cGVvZiBvYmplY3QgPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKG9iamVjdCkpID09PSAnb2JqZWN0JyAmJiB0eXBlb2Ygb2JqZWN0Lm5vZGVUeXBlID09PSAnbnVtYmVyJyAmJiB0eXBlb2Ygb2JqZWN0Lm5vZGVOYW1lID09PSAnc3RyaW5nJztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogX2V4ZWN1dGVIb29rXG4gICAgICogRXhlY3V0ZSB1c2VyIGNvbmZpZ3VyYWJsZSBob29rc1xuICAgICAqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBlbnRyeVBvaW50ICBOYW1lIG9mIHRoZSBob29rJ3MgZW50cnkgcG9pbnRcbiAgICAgKiBAcGFyYW0gIHtOb2RlfSBjdXJyZW50Tm9kZSBub2RlIHRvIHdvcmsgb24gd2l0aCB0aGUgaG9va1xuICAgICAqIEBwYXJhbSAge09iamVjdH0gZGF0YSBhZGRpdGlvbmFsIGhvb2sgcGFyYW1ldGVyc1xuICAgICAqL1xuICAgIHZhciBfZXhlY3V0ZUhvb2sgPSBmdW5jdGlvbiBfZXhlY3V0ZUhvb2soZW50cnlQb2ludCwgY3VycmVudE5vZGUsIGRhdGEpIHtcbiAgICAgIGlmICghaG9va3NbZW50cnlQb2ludF0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhcnJheUZvckVhY2goaG9va3NbZW50cnlQb2ludF0sIGZ1bmN0aW9uIChob29rKSB7XG4gICAgICAgIGhvb2suY2FsbChET01QdXJpZnksIGN1cnJlbnROb2RlLCBkYXRhLCBDT05GSUcpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIF9zYW5pdGl6ZUVsZW1lbnRzXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdCBub2RlTmFtZVxuICAgICAqIEBwcm90ZWN0IHRleHRDb250ZW50XG4gICAgICogQHByb3RlY3QgcmVtb3ZlQ2hpbGRcbiAgICAgKlxuICAgICAqIEBwYXJhbSAgIHtOb2RlfSBjdXJyZW50Tm9kZSB0byBjaGVjayBmb3IgcGVybWlzc2lvbiB0byBleGlzdFxuICAgICAqIEByZXR1cm4gIHtCb29sZWFufSB0cnVlIGlmIG5vZGUgd2FzIGtpbGxlZCwgZmFsc2UgaWYgbGVmdCBhbGl2ZVxuICAgICAqL1xuICAgIHZhciBfc2FuaXRpemVFbGVtZW50cyA9IGZ1bmN0aW9uIF9zYW5pdGl6ZUVsZW1lbnRzKGN1cnJlbnROb2RlKSB7XG4gICAgICB2YXIgY29udGVudCA9IHZvaWQgMDtcblxuICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgX2V4ZWN1dGVIb29rKCdiZWZvcmVTYW5pdGl6ZUVsZW1lbnRzJywgY3VycmVudE5vZGUsIG51bGwpO1xuXG4gICAgICAvKiBDaGVjayBpZiBlbGVtZW50IGlzIGNsb2JiZXJlZCBvciBjYW4gY2xvYmJlciAqL1xuICAgICAgaWYgKF9pc0Nsb2JiZXJlZChjdXJyZW50Tm9kZSkpIHtcbiAgICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8qIENoZWNrIGlmIHRhZ25hbWUgY29udGFpbnMgVW5pY29kZSAqL1xuICAgICAgaWYgKHN0cmluZ01hdGNoKGN1cnJlbnROb2RlLm5vZGVOYW1lLCAvW1xcdTAwODAtXFx1RkZGRl0vKSkge1xuICAgICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLyogTm93IGxldCdzIGNoZWNrIHRoZSBlbGVtZW50J3MgdHlwZSBhbmQgbmFtZSAqL1xuICAgICAgdmFyIHRhZ05hbWUgPSBzdHJpbmdUb0xvd2VyQ2FzZShjdXJyZW50Tm9kZS5ub2RlTmFtZSk7XG5cbiAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgIF9leGVjdXRlSG9vaygndXBvblNhbml0aXplRWxlbWVudCcsIGN1cnJlbnROb2RlLCB7XG4gICAgICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgICAgIGFsbG93ZWRUYWdzOiBBTExPV0VEX1RBR1NcbiAgICAgIH0pO1xuXG4gICAgICAvKiBEZXRlY3QgbVhTUyBhdHRlbXB0cyBhYnVzaW5nIG5hbWVzcGFjZSBjb25mdXNpb24gKi9cbiAgICAgIGlmICghX2lzTm9kZShjdXJyZW50Tm9kZS5maXJzdEVsZW1lbnRDaGlsZCkgJiYgKCFfaXNOb2RlKGN1cnJlbnROb2RlLmNvbnRlbnQpIHx8ICFfaXNOb2RlKGN1cnJlbnROb2RlLmNvbnRlbnQuZmlyc3RFbGVtZW50Q2hpbGQpKSAmJiByZWdFeHBUZXN0KC88Wy9cXHddL2csIGN1cnJlbnROb2RlLmlubmVySFRNTCkgJiYgcmVnRXhwVGVzdCgvPFsvXFx3XS9nLCBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCkpIHtcbiAgICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8qIFJlbW92ZSBlbGVtZW50IGlmIGFueXRoaW5nIGZvcmJpZHMgaXRzIHByZXNlbmNlICovXG4gICAgICBpZiAoIUFMTE9XRURfVEFHU1t0YWdOYW1lXSB8fCBGT1JCSURfVEFHU1t0YWdOYW1lXSkge1xuICAgICAgICAvKiBLZWVwIGNvbnRlbnQgZXhjZXB0IGZvciBiYWQtbGlzdGVkIGVsZW1lbnRzICovXG4gICAgICAgIGlmIChLRUVQX0NPTlRFTlQgJiYgIUZPUkJJRF9DT05URU5UU1t0YWdOYW1lXSkge1xuICAgICAgICAgIHZhciBwYXJlbnROb2RlID0gZ2V0UGFyZW50Tm9kZShjdXJyZW50Tm9kZSk7XG4gICAgICAgICAgdmFyIGNoaWxkTm9kZXMgPSBnZXRDaGlsZE5vZGVzKGN1cnJlbnROb2RlKTtcblxuICAgICAgICAgIGlmIChjaGlsZE5vZGVzICYmIHBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZENvdW50ID0gY2hpbGROb2Rlcy5sZW5ndGg7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBjaGlsZENvdW50IC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY2xvbmVOb2RlKGNoaWxkTm9kZXNbaV0sIHRydWUpLCBnZXROZXh0U2libGluZyhjdXJyZW50Tm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvKiBDaGVjayB3aGV0aGVyIGVsZW1lbnQgaGFzIGEgdmFsaWQgbmFtZXNwYWNlICovXG4gICAgICBpZiAoY3VycmVudE5vZGUgaW5zdGFuY2VvZiBFbGVtZW50ICYmICFfY2hlY2tWYWxpZE5hbWVzcGFjZShjdXJyZW50Tm9kZSkpIHtcbiAgICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmICgodGFnTmFtZSA9PT0gJ25vc2NyaXB0JyB8fCB0YWdOYW1lID09PSAnbm9lbWJlZCcpICYmIHJlZ0V4cFRlc3QoLzxcXC9ubyhzY3JpcHR8ZW1iZWQpL2ksIGN1cnJlbnROb2RlLmlubmVySFRNTCkpIHtcbiAgICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8qIFNhbml0aXplIGVsZW1lbnQgY29udGVudCB0byBiZSB0ZW1wbGF0ZS1zYWZlICovXG4gICAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTICYmIGN1cnJlbnROb2RlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgIC8qIEdldCB0aGUgZWxlbWVudCdzIHRleHQgY29udGVudCAqL1xuICAgICAgICBjb250ZW50ID0gY3VycmVudE5vZGUudGV4dENvbnRlbnQ7XG4gICAgICAgIGNvbnRlbnQgPSBzdHJpbmdSZXBsYWNlKGNvbnRlbnQsIE1VU1RBQ0hFX0VYUFIkJDEsICcgJyk7XG4gICAgICAgIGNvbnRlbnQgPSBzdHJpbmdSZXBsYWNlKGNvbnRlbnQsIEVSQl9FWFBSJCQxLCAnICcpO1xuICAgICAgICBpZiAoY3VycmVudE5vZGUudGV4dENvbnRlbnQgIT09IGNvbnRlbnQpIHtcbiAgICAgICAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHsgZWxlbWVudDogY3VycmVudE5vZGUuY2xvbmVOb2RlKCkgfSk7XG4gICAgICAgICAgY3VycmVudE5vZGUudGV4dENvbnRlbnQgPSBjb250ZW50O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgIF9leGVjdXRlSG9vaygnYWZ0ZXJTYW5pdGl6ZUVsZW1lbnRzJywgY3VycmVudE5vZGUsIG51bGwpO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIF9pc1ZhbGlkQXR0cmlidXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IGxjVGFnIExvd2VyY2FzZSB0YWcgbmFtZSBvZiBjb250YWluaW5nIGVsZW1lbnQuXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSBsY05hbWUgTG93ZXJjYXNlIGF0dHJpYnV0ZSBuYW1lLlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gdmFsdWUgQXR0cmlidXRlIHZhbHVlLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiBgdmFsdWVgIGlzIHZhbGlkLCBvdGhlcndpc2UgZmFsc2UuXG4gICAgICovXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbiAgICB2YXIgX2lzVmFsaWRBdHRyaWJ1dGUgPSBmdW5jdGlvbiBfaXNWYWxpZEF0dHJpYnV0ZShsY1RhZywgbGNOYW1lLCB2YWx1ZSkge1xuICAgICAgLyogTWFrZSBzdXJlIGF0dHJpYnV0ZSBjYW5ub3QgY2xvYmJlciAqL1xuICAgICAgaWYgKFNBTklUSVpFX0RPTSAmJiAobGNOYW1lID09PSAnaWQnIHx8IGxjTmFtZSA9PT0gJ25hbWUnKSAmJiAodmFsdWUgaW4gZG9jdW1lbnQgfHwgdmFsdWUgaW4gZm9ybUVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLyogQWxsb3cgdmFsaWQgZGF0YS0qIGF0dHJpYnV0ZXM6IEF0IGxlYXN0IG9uZSBjaGFyYWN0ZXIgYWZ0ZXIgXCItXCJcbiAgICAgICAgICAoaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvZG9tLmh0bWwjZW1iZWRkaW5nLWN1c3RvbS1ub24tdmlzaWJsZS1kYXRhLXdpdGgtdGhlLWRhdGEtKi1hdHRyaWJ1dGVzKVxuICAgICAgICAgIFhNTC1jb21wYXRpYmxlIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9pbmZyYXN0cnVjdHVyZS5odG1sI3htbC1jb21wYXRpYmxlIGFuZCBodHRwOi8vd3d3LnczLm9yZy9UUi94bWwvI2QwZTgwNClcbiAgICAgICAgICBXZSBkb24ndCBuZWVkIHRvIGNoZWNrIHRoZSB2YWx1ZTsgaXQncyBhbHdheXMgVVJJIHNhZmUuICovXG4gICAgICBpZiAoQUxMT1dfREFUQV9BVFRSICYmIHJlZ0V4cFRlc3QoREFUQV9BVFRSJCQxLCBsY05hbWUpKSA7IGVsc2UgaWYgKEFMTE9XX0FSSUFfQVRUUiAmJiByZWdFeHBUZXN0KEFSSUFfQVRUUiQkMSwgbGNOYW1lKSkgOyBlbHNlIGlmICghQUxMT1dFRF9BVFRSW2xjTmFtZV0gfHwgRk9SQklEX0FUVFJbbGNOYW1lXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgLyogQ2hlY2sgdmFsdWUgaXMgc2FmZS4gRmlyc3QsIGlzIGF0dHIgaW5lcnQ/IElmIHNvLCBpcyBzYWZlICovXG4gICAgICB9IGVsc2UgaWYgKFVSSV9TQUZFX0FUVFJJQlVURVNbbGNOYW1lXSkgOyBlbHNlIGlmIChyZWdFeHBUZXN0KElTX0FMTE9XRURfVVJJJCQxLCBzdHJpbmdSZXBsYWNlKHZhbHVlLCBBVFRSX1dISVRFU1BBQ0UkJDEsICcnKSkpIDsgZWxzZSBpZiAoKGxjTmFtZSA9PT0gJ3NyYycgfHwgbGNOYW1lID09PSAneGxpbms6aHJlZicgfHwgbGNOYW1lID09PSAnaHJlZicpICYmIGxjVGFnICE9PSAnc2NyaXB0JyAmJiBzdHJpbmdJbmRleE9mKHZhbHVlLCAnZGF0YTonKSA9PT0gMCAmJiBEQVRBX1VSSV9UQUdTW2xjVGFnXSkgOyBlbHNlIGlmIChBTExPV19VTktOT1dOX1BST1RPQ09MUyAmJiAhcmVnRXhwVGVzdChJU19TQ1JJUFRfT1JfREFUQSQkMSwgc3RyaW5nUmVwbGFjZSh2YWx1ZSwgQVRUUl9XSElURVNQQUNFJCQxLCAnJykpKSA7IGVsc2UgaWYgKCF2YWx1ZSkgOyBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogX3Nhbml0aXplQXR0cmlidXRlc1xuICAgICAqXG4gICAgICogQHByb3RlY3QgYXR0cmlidXRlc1xuICAgICAqIEBwcm90ZWN0IG5vZGVOYW1lXG4gICAgICogQHByb3RlY3QgcmVtb3ZlQXR0cmlidXRlXG4gICAgICogQHByb3RlY3Qgc2V0QXR0cmlidXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtOb2RlfSBjdXJyZW50Tm9kZSB0byBzYW5pdGl6ZVxuICAgICAqL1xuICAgIHZhciBfc2FuaXRpemVBdHRyaWJ1dGVzID0gZnVuY3Rpb24gX3Nhbml0aXplQXR0cmlidXRlcyhjdXJyZW50Tm9kZSkge1xuICAgICAgdmFyIGF0dHIgPSB2b2lkIDA7XG4gICAgICB2YXIgdmFsdWUgPSB2b2lkIDA7XG4gICAgICB2YXIgbGNOYW1lID0gdm9pZCAwO1xuICAgICAgdmFyIGwgPSB2b2lkIDA7XG4gICAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgICBfZXhlY3V0ZUhvb2soJ2JlZm9yZVNhbml0aXplQXR0cmlidXRlcycsIGN1cnJlbnROb2RlLCBudWxsKTtcblxuICAgICAgdmFyIGF0dHJpYnV0ZXMgPSBjdXJyZW50Tm9kZS5hdHRyaWJ1dGVzO1xuXG4gICAgICAvKiBDaGVjayBpZiB3ZSBoYXZlIGF0dHJpYnV0ZXM7IGlmIG5vdCB3ZSBtaWdodCBoYXZlIGEgdGV4dCBub2RlICovXG5cbiAgICAgIGlmICghYXR0cmlidXRlcykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBob29rRXZlbnQgPSB7XG4gICAgICAgIGF0dHJOYW1lOiAnJyxcbiAgICAgICAgYXR0clZhbHVlOiAnJyxcbiAgICAgICAga2VlcEF0dHI6IHRydWUsXG4gICAgICAgIGFsbG93ZWRBdHRyaWJ1dGVzOiBBTExPV0VEX0FUVFJcbiAgICAgIH07XG4gICAgICBsID0gYXR0cmlidXRlcy5sZW5ndGg7XG5cbiAgICAgIC8qIEdvIGJhY2t3YXJkcyBvdmVyIGFsbCBhdHRyaWJ1dGVzOyBzYWZlbHkgcmVtb3ZlIGJhZCBvbmVzICovXG4gICAgICB3aGlsZSAobC0tKSB7XG4gICAgICAgIGF0dHIgPSBhdHRyaWJ1dGVzW2xdO1xuICAgICAgICB2YXIgX2F0dHIgPSBhdHRyLFxuICAgICAgICAgICAgbmFtZSA9IF9hdHRyLm5hbWUsXG4gICAgICAgICAgICBuYW1lc3BhY2VVUkkgPSBfYXR0ci5uYW1lc3BhY2VVUkk7XG5cbiAgICAgICAgdmFsdWUgPSBzdHJpbmdUcmltKGF0dHIudmFsdWUpO1xuICAgICAgICBsY05hbWUgPSBzdHJpbmdUb0xvd2VyQ2FzZShuYW1lKTtcblxuICAgICAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgICAgIGhvb2tFdmVudC5hdHRyTmFtZSA9IGxjTmFtZTtcbiAgICAgICAgaG9va0V2ZW50LmF0dHJWYWx1ZSA9IHZhbHVlO1xuICAgICAgICBob29rRXZlbnQua2VlcEF0dHIgPSB0cnVlO1xuICAgICAgICBob29rRXZlbnQuZm9yY2VLZWVwQXR0ciA9IHVuZGVmaW5lZDsgLy8gQWxsb3dzIGRldmVsb3BlcnMgdG8gc2VlIHRoaXMgaXMgYSBwcm9wZXJ0eSB0aGV5IGNhbiBzZXRcbiAgICAgICAgX2V4ZWN1dGVIb29rKCd1cG9uU2FuaXRpemVBdHRyaWJ1dGUnLCBjdXJyZW50Tm9kZSwgaG9va0V2ZW50KTtcbiAgICAgICAgdmFsdWUgPSBob29rRXZlbnQuYXR0clZhbHVlO1xuICAgICAgICAvKiBEaWQgdGhlIGhvb2tzIGFwcHJvdmUgb2YgdGhlIGF0dHJpYnV0ZT8gKi9cbiAgICAgICAgaWYgKGhvb2tFdmVudC5mb3JjZUtlZXBBdHRyKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBSZW1vdmUgYXR0cmlidXRlICovXG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuXG4gICAgICAgIC8qIERpZCB0aGUgaG9va3MgYXBwcm92ZSBvZiB0aGUgYXR0cmlidXRlPyAqL1xuICAgICAgICBpZiAoIWhvb2tFdmVudC5rZWVwQXR0cikge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogV29yayBhcm91bmQgYSBzZWN1cml0eSBpc3N1ZSBpbiBqUXVlcnkgMy4wICovXG4gICAgICAgIGlmIChyZWdFeHBUZXN0KC9cXC8+L2ksIHZhbHVlKSkge1xuICAgICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogU2FuaXRpemUgYXR0cmlidXRlIGNvbnRlbnQgdG8gYmUgdGVtcGxhdGUtc2FmZSAqL1xuICAgICAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTKSB7XG4gICAgICAgICAgdmFsdWUgPSBzdHJpbmdSZXBsYWNlKHZhbHVlLCBNVVNUQUNIRV9FWFBSJCQxLCAnICcpO1xuICAgICAgICAgIHZhbHVlID0gc3RyaW5nUmVwbGFjZSh2YWx1ZSwgRVJCX0VYUFIkJDEsICcgJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBJcyBgdmFsdWVgIHZhbGlkIGZvciB0aGlzIGF0dHJpYnV0ZT8gKi9cbiAgICAgICAgdmFyIGxjVGFnID0gY3VycmVudE5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKCFfaXNWYWxpZEF0dHJpYnV0ZShsY1RhZywgbGNOYW1lLCB2YWx1ZSkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEhhbmRsZSBpbnZhbGlkIGRhdGEtKiBhdHRyaWJ1dGUgc2V0IGJ5IHRyeS1jYXRjaGluZyBpdCAqL1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChuYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgICAgIGN1cnJlbnROb2RlLnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZVVSSSwgbmFtZSwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvKiBGYWxsYmFjayB0byBzZXRBdHRyaWJ1dGUoKSBmb3IgYnJvd3Nlci11bnJlY29nbml6ZWQgbmFtZXNwYWNlcyBlLmcuIFwieC1zY2hlbWFcIi4gKi9cbiAgICAgICAgICAgIGN1cnJlbnROb2RlLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYXJyYXlQb3AoRE9NUHVyaWZ5LnJlbW92ZWQpO1xuICAgICAgICB9IGNhdGNoIChfKSB7fVxuICAgICAgfVxuXG4gICAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgICBfZXhlY3V0ZUhvb2soJ2FmdGVyU2FuaXRpemVBdHRyaWJ1dGVzJywgY3VycmVudE5vZGUsIG51bGwpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBfc2FuaXRpemVTaGFkb3dET01cbiAgICAgKlxuICAgICAqIEBwYXJhbSAge0RvY3VtZW50RnJhZ21lbnR9IGZyYWdtZW50IHRvIGl0ZXJhdGUgb3ZlciByZWN1cnNpdmVseVxuICAgICAqL1xuICAgIHZhciBfc2FuaXRpemVTaGFkb3dET00gPSBmdW5jdGlvbiBfc2FuaXRpemVTaGFkb3dET00oZnJhZ21lbnQpIHtcbiAgICAgIHZhciBzaGFkb3dOb2RlID0gdm9pZCAwO1xuICAgICAgdmFyIHNoYWRvd0l0ZXJhdG9yID0gX2NyZWF0ZUl0ZXJhdG9yKGZyYWdtZW50KTtcblxuICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgX2V4ZWN1dGVIb29rKCdiZWZvcmVTYW5pdGl6ZVNoYWRvd0RPTScsIGZyYWdtZW50LCBudWxsKTtcblxuICAgICAgd2hpbGUgKHNoYWRvd05vZGUgPSBzaGFkb3dJdGVyYXRvci5uZXh0Tm9kZSgpKSB7XG4gICAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgICAgX2V4ZWN1dGVIb29rKCd1cG9uU2FuaXRpemVTaGFkb3dOb2RlJywgc2hhZG93Tm9kZSwgbnVsbCk7XG5cbiAgICAgICAgLyogU2FuaXRpemUgdGFncyBhbmQgZWxlbWVudHMgKi9cbiAgICAgICAgaWYgKF9zYW5pdGl6ZUVsZW1lbnRzKHNoYWRvd05vZGUpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBEZWVwIHNoYWRvdyBET00gZGV0ZWN0ZWQgKi9cbiAgICAgICAgaWYgKHNoYWRvd05vZGUuY29udGVudCBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQpIHtcbiAgICAgICAgICBfc2FuaXRpemVTaGFkb3dET00oc2hhZG93Tm9kZS5jb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIENoZWNrIGF0dHJpYnV0ZXMsIHNhbml0aXplIGlmIG5lY2Vzc2FyeSAqL1xuICAgICAgICBfc2FuaXRpemVBdHRyaWJ1dGVzKHNoYWRvd05vZGUpO1xuICAgICAgfVxuXG4gICAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgICBfZXhlY3V0ZUhvb2soJ2FmdGVyU2FuaXRpemVTaGFkb3dET00nLCBmcmFnbWVudCwgbnVsbCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNhbml0aXplXG4gICAgICogUHVibGljIG1ldGhvZCBwcm92aWRpbmcgY29yZSBzYW5pdGF0aW9uIGZ1bmN0aW9uYWxpdHlcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfE5vZGV9IGRpcnR5IHN0cmluZyBvciBET00gbm9kZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWd1cmF0aW9uIG9iamVjdFxuICAgICAqL1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG4gICAgRE9NUHVyaWZ5LnNhbml0aXplID0gZnVuY3Rpb24gKGRpcnR5LCBjZmcpIHtcbiAgICAgIHZhciBib2R5ID0gdm9pZCAwO1xuICAgICAgdmFyIGltcG9ydGVkTm9kZSA9IHZvaWQgMDtcbiAgICAgIHZhciBjdXJyZW50Tm9kZSA9IHZvaWQgMDtcbiAgICAgIHZhciBvbGROb2RlID0gdm9pZCAwO1xuICAgICAgdmFyIHJldHVybk5vZGUgPSB2b2lkIDA7XG4gICAgICAvKiBNYWtlIHN1cmUgd2UgaGF2ZSBhIHN0cmluZyB0byBzYW5pdGl6ZS5cbiAgICAgICAgRE8gTk9UIHJldHVybiBlYXJseSwgYXMgdGhpcyB3aWxsIHJldHVybiB0aGUgd3JvbmcgdHlwZSBpZlxuICAgICAgICB0aGUgdXNlciBoYXMgcmVxdWVzdGVkIGEgRE9NIG9iamVjdCByYXRoZXIgdGhhbiBhIHN0cmluZyAqL1xuICAgICAgaWYgKCFkaXJ0eSkge1xuICAgICAgICBkaXJ0eSA9ICc8IS0tPic7XG4gICAgICB9XG5cbiAgICAgIC8qIFN0cmluZ2lmeSwgaW4gY2FzZSBkaXJ0eSBpcyBhbiBvYmplY3QgKi9cbiAgICAgIGlmICh0eXBlb2YgZGlydHkgIT09ICdzdHJpbmcnICYmICFfaXNOb2RlKGRpcnR5KSkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmVnYXRlZC1jb25kaXRpb25cbiAgICAgICAgaWYgKHR5cGVvZiBkaXJ0eS50b1N0cmluZyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgndG9TdHJpbmcgaXMgbm90IGEgZnVuY3Rpb24nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkaXJ0eSA9IGRpcnR5LnRvU3RyaW5nKCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkaXJ0eSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgnZGlydHkgaXMgbm90IGEgc3RyaW5nLCBhYm9ydGluZycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBDaGVjayB3ZSBjYW4gcnVuLiBPdGhlcndpc2UgZmFsbCBiYWNrIG9yIGlnbm9yZSAqL1xuICAgICAgaWYgKCFET01QdXJpZnkuaXNTdXBwb3J0ZWQpIHtcbiAgICAgICAgaWYgKF90eXBlb2Yod2luZG93LnRvU3RhdGljSFRNTCkgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB3aW5kb3cudG9TdGF0aWNIVE1MID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkaXJ0eSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cudG9TdGF0aWNIVE1MKGRpcnR5KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoX2lzTm9kZShkaXJ0eSkpIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cudG9TdGF0aWNIVE1MKGRpcnR5Lm91dGVySFRNTCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRpcnR5O1xuICAgICAgfVxuXG4gICAgICAvKiBBc3NpZ24gY29uZmlnIHZhcnMgKi9cbiAgICAgIGlmICghU0VUX0NPTkZJRykge1xuICAgICAgICBfcGFyc2VDb25maWcoY2ZnKTtcbiAgICAgIH1cblxuICAgICAgLyogQ2xlYW4gdXAgcmVtb3ZlZCBlbGVtZW50cyAqL1xuICAgICAgRE9NUHVyaWZ5LnJlbW92ZWQgPSBbXTtcblxuICAgICAgLyogQ2hlY2sgaWYgZGlydHkgaXMgY29ycmVjdGx5IHR5cGVkIGZvciBJTl9QTEFDRSAqL1xuICAgICAgaWYgKHR5cGVvZiBkaXJ0eSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgSU5fUExBQ0UgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKElOX1BMQUNFKSA7IGVsc2UgaWYgKGRpcnR5IGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICAvKiBJZiBkaXJ0eSBpcyBhIERPTSBlbGVtZW50LCBhcHBlbmQgdG8gYW4gZW1wdHkgZG9jdW1lbnQgdG8gYXZvaWRcbiAgICAgICAgICAgZWxlbWVudHMgYmVpbmcgc3RyaXBwZWQgYnkgdGhlIHBhcnNlciAqL1xuICAgICAgICBib2R5ID0gX2luaXREb2N1bWVudCgnPCEtLS0tPicpO1xuICAgICAgICBpbXBvcnRlZE5vZGUgPSBib2R5Lm93bmVyRG9jdW1lbnQuaW1wb3J0Tm9kZShkaXJ0eSwgdHJ1ZSk7XG4gICAgICAgIGlmIChpbXBvcnRlZE5vZGUubm9kZVR5cGUgPT09IDEgJiYgaW1wb3J0ZWROb2RlLm5vZGVOYW1lID09PSAnQk9EWScpIHtcbiAgICAgICAgICAvKiBOb2RlIGlzIGFscmVhZHkgYSBib2R5LCB1c2UgYXMgaXMgKi9cbiAgICAgICAgICBib2R5ID0gaW1wb3J0ZWROb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKGltcG9ydGVkTm9kZS5ub2RlTmFtZSA9PT0gJ0hUTUwnKSB7XG4gICAgICAgICAgYm9keSA9IGltcG9ydGVkTm9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItbm9kZS1hcHBlbmRcbiAgICAgICAgICBib2R5LmFwcGVuZENoaWxkKGltcG9ydGVkTm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8qIEV4aXQgZGlyZWN0bHkgaWYgd2UgaGF2ZSBub3RoaW5nIHRvIGRvICovXG4gICAgICAgIGlmICghUkVUVVJOX0RPTSAmJiAhU0FGRV9GT1JfVEVNUExBVEVTICYmICFXSE9MRV9ET0NVTUVOVCAmJlxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItaW5jbHVkZXNcbiAgICAgICAgZGlydHkuaW5kZXhPZignPCcpID09PSAtMSkge1xuICAgICAgICAgIHJldHVybiB0cnVzdGVkVHlwZXNQb2xpY3kgJiYgUkVUVVJOX1RSVVNURURfVFlQRSA/IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKGRpcnR5KSA6IGRpcnR5O1xuICAgICAgICB9XG5cbiAgICAgICAgLyogSW5pdGlhbGl6ZSB0aGUgZG9jdW1lbnQgdG8gd29yayBvbiAqL1xuICAgICAgICBib2R5ID0gX2luaXREb2N1bWVudChkaXJ0eSk7XG5cbiAgICAgICAgLyogQ2hlY2sgd2UgaGF2ZSBhIERPTSBub2RlIGZyb20gdGhlIGRhdGEgKi9cbiAgICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgICAgcmV0dXJuIFJFVFVSTl9ET00gPyBudWxsIDogZW1wdHlIVE1MO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8qIFJlbW92ZSBmaXJzdCBlbGVtZW50IG5vZGUgKG91cnMpIGlmIEZPUkNFX0JPRFkgaXMgc2V0ICovXG4gICAgICBpZiAoYm9keSAmJiBGT1JDRV9CT0RZKSB7XG4gICAgICAgIF9mb3JjZVJlbW92ZShib2R5LmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuXG4gICAgICAvKiBHZXQgbm9kZSBpdGVyYXRvciAqL1xuICAgICAgdmFyIG5vZGVJdGVyYXRvciA9IF9jcmVhdGVJdGVyYXRvcihJTl9QTEFDRSA/IGRpcnR5IDogYm9keSk7XG5cbiAgICAgIC8qIE5vdyBzdGFydCBpdGVyYXRpbmcgb3ZlciB0aGUgY3JlYXRlZCBkb2N1bWVudCAqL1xuICAgICAgd2hpbGUgKGN1cnJlbnROb2RlID0gbm9kZUl0ZXJhdG9yLm5leHROb2RlKCkpIHtcbiAgICAgICAgLyogRml4IElFJ3Mgc3RyYW5nZSBiZWhhdmlvciB3aXRoIG1hbmlwdWxhdGVkIHRleHROb2RlcyAjODkgKi9cbiAgICAgICAgaWYgKGN1cnJlbnROb2RlLm5vZGVUeXBlID09PSAzICYmIGN1cnJlbnROb2RlID09PSBvbGROb2RlKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTYW5pdGl6ZSB0YWdzIGFuZCBlbGVtZW50cyAqL1xuICAgICAgICBpZiAoX3Nhbml0aXplRWxlbWVudHMoY3VycmVudE5vZGUpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTaGFkb3cgRE9NIGRldGVjdGVkLCBzYW5pdGl6ZSBpdCAqL1xuICAgICAgICBpZiAoY3VycmVudE5vZGUuY29udGVudCBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQpIHtcbiAgICAgICAgICBfc2FuaXRpemVTaGFkb3dET00oY3VycmVudE5vZGUuY29udGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBDaGVjayBhdHRyaWJ1dGVzLCBzYW5pdGl6ZSBpZiBuZWNlc3NhcnkgKi9cbiAgICAgICAgX3Nhbml0aXplQXR0cmlidXRlcyhjdXJyZW50Tm9kZSk7XG5cbiAgICAgICAgb2xkTm9kZSA9IGN1cnJlbnROb2RlO1xuICAgICAgfVxuXG4gICAgICBvbGROb2RlID0gbnVsbDtcblxuICAgICAgLyogSWYgd2Ugc2FuaXRpemVkIGBkaXJ0eWAgaW4tcGxhY2UsIHJldHVybiBpdC4gKi9cbiAgICAgIGlmIChJTl9QTEFDRSkge1xuICAgICAgICByZXR1cm4gZGlydHk7XG4gICAgICB9XG5cbiAgICAgIC8qIFJldHVybiBzYW5pdGl6ZWQgc3RyaW5nIG9yIERPTSAqL1xuICAgICAgaWYgKFJFVFVSTl9ET00pIHtcbiAgICAgICAgaWYgKFJFVFVSTl9ET01fRlJBR01FTlQpIHtcbiAgICAgICAgICByZXR1cm5Ob2RlID0gY3JlYXRlRG9jdW1lbnRGcmFnbWVudC5jYWxsKGJvZHkub3duZXJEb2N1bWVudCk7XG5cbiAgICAgICAgICB3aGlsZSAoYm9keS5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItbm9kZS1hcHBlbmRcbiAgICAgICAgICAgIHJldHVybk5vZGUuYXBwZW5kQ2hpbGQoYm9keS5maXJzdENoaWxkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuTm9kZSA9IGJvZHk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoUkVUVVJOX0RPTV9JTVBPUlQpIHtcbiAgICAgICAgICAvKlxuICAgICAgICAgICAgQWRvcHROb2RlKCkgaXMgbm90IHVzZWQgYmVjYXVzZSBpbnRlcm5hbCBzdGF0ZSBpcyBub3QgcmVzZXRcbiAgICAgICAgICAgIChlLmcuIHRoZSBwYXN0IG5hbWVzIG1hcCBvZiBhIEhUTUxGb3JtRWxlbWVudCksIHRoaXMgaXMgc2FmZVxuICAgICAgICAgICAgaW4gdGhlb3J5IGJ1dCB3ZSB3b3VsZCByYXRoZXIgbm90IHJpc2sgYW5vdGhlciBhdHRhY2sgdmVjdG9yLlxuICAgICAgICAgICAgVGhlIHN0YXRlIHRoYXQgaXMgY2xvbmVkIGJ5IGltcG9ydE5vZGUoKSBpcyBleHBsaWNpdGx5IGRlZmluZWRcbiAgICAgICAgICAgIGJ5IHRoZSBzcGVjcy5cbiAgICAgICAgICAqL1xuICAgICAgICAgIHJldHVybk5vZGUgPSBpbXBvcnROb2RlLmNhbGwob3JpZ2luYWxEb2N1bWVudCwgcmV0dXJuTm9kZSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmV0dXJuTm9kZTtcbiAgICAgIH1cblxuICAgICAgdmFyIHNlcmlhbGl6ZWRIVE1MID0gV0hPTEVfRE9DVU1FTlQgPyBib2R5Lm91dGVySFRNTCA6IGJvZHkuaW5uZXJIVE1MO1xuXG4gICAgICAvKiBTYW5pdGl6ZSBmaW5hbCBzdHJpbmcgdGVtcGxhdGUtc2FmZSAqL1xuICAgICAgaWYgKFNBRkVfRk9SX1RFTVBMQVRFUykge1xuICAgICAgICBzZXJpYWxpemVkSFRNTCA9IHN0cmluZ1JlcGxhY2Uoc2VyaWFsaXplZEhUTUwsIE1VU1RBQ0hFX0VYUFIkJDEsICcgJyk7XG4gICAgICAgIHNlcmlhbGl6ZWRIVE1MID0gc3RyaW5nUmVwbGFjZShzZXJpYWxpemVkSFRNTCwgRVJCX0VYUFIkJDEsICcgJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVzdGVkVHlwZXNQb2xpY3kgJiYgUkVUVVJOX1RSVVNURURfVFlQRSA/IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKHNlcmlhbGl6ZWRIVE1MKSA6IHNlcmlhbGl6ZWRIVE1MO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgbWV0aG9kIHRvIHNldCB0aGUgY29uZmlndXJhdGlvbiBvbmNlXG4gICAgICogc2V0Q29uZmlnXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2ZnIGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAgICovXG4gICAgRE9NUHVyaWZ5LnNldENvbmZpZyA9IGZ1bmN0aW9uIChjZmcpIHtcbiAgICAgIF9wYXJzZUNvbmZpZyhjZmcpO1xuICAgICAgU0VUX0NPTkZJRyA9IHRydWU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBtZXRob2QgdG8gcmVtb3ZlIHRoZSBjb25maWd1cmF0aW9uXG4gICAgICogY2xlYXJDb25maWdcbiAgICAgKlxuICAgICAqL1xuICAgIERPTVB1cmlmeS5jbGVhckNvbmZpZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIENPTkZJRyA9IG51bGw7XG4gICAgICBTRVRfQ09ORklHID0gZmFsc2U7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBtZXRob2QgdG8gY2hlY2sgaWYgYW4gYXR0cmlidXRlIHZhbHVlIGlzIHZhbGlkLlxuICAgICAqIFVzZXMgbGFzdCBzZXQgY29uZmlnLCBpZiBhbnkuIE90aGVyd2lzZSwgdXNlcyBjb25maWcgZGVmYXVsdHMuXG4gICAgICogaXNWYWxpZEF0dHJpYnV0ZVxuICAgICAqXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSB0YWcgVGFnIG5hbWUgb2YgY29udGFpbmluZyBlbGVtZW50LlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gYXR0ciBBdHRyaWJ1dGUgbmFtZS5cbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IHZhbHVlIEF0dHJpYnV0ZSB2YWx1ZS5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBSZXR1cm5zIHRydWUgaWYgYHZhbHVlYCBpcyB2YWxpZC4gT3RoZXJ3aXNlLCByZXR1cm5zIGZhbHNlLlxuICAgICAqL1xuICAgIERPTVB1cmlmeS5pc1ZhbGlkQXR0cmlidXRlID0gZnVuY3Rpb24gKHRhZywgYXR0ciwgdmFsdWUpIHtcbiAgICAgIC8qIEluaXRpYWxpemUgc2hhcmVkIGNvbmZpZyB2YXJzIGlmIG5lY2Vzc2FyeS4gKi9cbiAgICAgIGlmICghQ09ORklHKSB7XG4gICAgICAgIF9wYXJzZUNvbmZpZyh7fSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBsY1RhZyA9IHN0cmluZ1RvTG93ZXJDYXNlKHRhZyk7XG4gICAgICB2YXIgbGNOYW1lID0gc3RyaW5nVG9Mb3dlckNhc2UoYXR0cik7XG4gICAgICByZXR1cm4gX2lzVmFsaWRBdHRyaWJ1dGUobGNUYWcsIGxjTmFtZSwgdmFsdWUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBZGRIb29rXG4gICAgICogUHVibGljIG1ldGhvZCB0byBhZGQgRE9NUHVyaWZ5IGhvb2tzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZW50cnlQb2ludCBlbnRyeSBwb2ludCBmb3IgdGhlIGhvb2sgdG8gYWRkXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaG9va0Z1bmN0aW9uIGZ1bmN0aW9uIHRvIGV4ZWN1dGVcbiAgICAgKi9cbiAgICBET01QdXJpZnkuYWRkSG9vayA9IGZ1bmN0aW9uIChlbnRyeVBvaW50LCBob29rRnVuY3Rpb24pIHtcbiAgICAgIGlmICh0eXBlb2YgaG9va0Z1bmN0aW9uICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaG9va3NbZW50cnlQb2ludF0gPSBob29rc1tlbnRyeVBvaW50XSB8fCBbXTtcbiAgICAgIGFycmF5UHVzaChob29rc1tlbnRyeVBvaW50XSwgaG9va0Z1bmN0aW9uKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlSG9va1xuICAgICAqIFB1YmxpYyBtZXRob2QgdG8gcmVtb3ZlIGEgRE9NUHVyaWZ5IGhvb2sgYXQgYSBnaXZlbiBlbnRyeVBvaW50XG4gICAgICogKHBvcHMgaXQgZnJvbSB0aGUgc3RhY2sgb2YgaG9va3MgaWYgbW9yZSBhcmUgcHJlc2VudClcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBlbnRyeVBvaW50IGVudHJ5IHBvaW50IGZvciB0aGUgaG9vayB0byByZW1vdmVcbiAgICAgKi9cbiAgICBET01QdXJpZnkucmVtb3ZlSG9vayA9IGZ1bmN0aW9uIChlbnRyeVBvaW50KSB7XG4gICAgICBpZiAoaG9va3NbZW50cnlQb2ludF0pIHtcbiAgICAgICAgYXJyYXlQb3AoaG9va3NbZW50cnlQb2ludF0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVIb29rc1xuICAgICAqIFB1YmxpYyBtZXRob2QgdG8gcmVtb3ZlIGFsbCBET01QdXJpZnkgaG9va3MgYXQgYSBnaXZlbiBlbnRyeVBvaW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGVudHJ5UG9pbnQgZW50cnkgcG9pbnQgZm9yIHRoZSBob29rcyB0byByZW1vdmVcbiAgICAgKi9cbiAgICBET01QdXJpZnkucmVtb3ZlSG9va3MgPSBmdW5jdGlvbiAoZW50cnlQb2ludCkge1xuICAgICAgaWYgKGhvb2tzW2VudHJ5UG9pbnRdKSB7XG4gICAgICAgIGhvb2tzW2VudHJ5UG9pbnRdID0gW107XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZUFsbEhvb2tzXG4gICAgICogUHVibGljIG1ldGhvZCB0byByZW1vdmUgYWxsIERPTVB1cmlmeSBob29rc1xuICAgICAqXG4gICAgICovXG4gICAgRE9NUHVyaWZ5LnJlbW92ZUFsbEhvb2tzID0gZnVuY3Rpb24gKCkge1xuICAgICAgaG9va3MgPSB7fTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIERPTVB1cmlmeTtcbiAgfVxuXG4gIHZhciBwdXJpZnkgPSBjcmVhdGVET01QdXJpZnkoKTtcblxuICByZXR1cm4gcHVyaWZ5O1xuXG59KSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wdXJpZnkuanMubWFwXG4iLCJpbXBvcnQgeyBfX2Fzc2lnbiB9IGZyb20gXCJ0c2xpYlwiO1xuaW1wb3J0IHsgbm9DYXNlIH0gZnJvbSBcIm5vLWNhc2VcIjtcbmV4cG9ydCBmdW5jdGlvbiBkb3RDYXNlKGlucHV0LCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICByZXR1cm4gbm9DYXNlKGlucHV0LCBfX2Fzc2lnbih7IGRlbGltaXRlcjogXCIuXCIgfSwgb3B0aW9ucykpO1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAsIHByZWZpeCA9ICd+JztcblxuLyoqXG4gKiBDb25zdHJ1Y3RvciB0byBjcmVhdGUgYSBzdG9yYWdlIGZvciBvdXIgYEVFYCBvYmplY3RzLlxuICogQW4gYEV2ZW50c2AgaW5zdGFuY2UgaXMgYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFdmVudHMoKSB7fVxuXG4vL1xuLy8gV2UgdHJ5IHRvIG5vdCBpbmhlcml0IGZyb20gYE9iamVjdC5wcm90b3R5cGVgLiBJbiBzb21lIGVuZ2luZXMgY3JlYXRpbmcgYW5cbi8vIGluc3RhbmNlIGluIHRoaXMgd2F5IGlzIGZhc3RlciB0aGFuIGNhbGxpbmcgYE9iamVjdC5jcmVhdGUobnVsbClgIGRpcmVjdGx5LlxuLy8gSWYgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIG5vdCBzdXBwb3J0ZWQgd2UgcHJlZml4IHRoZSBldmVudCBuYW1lcyB3aXRoIGFcbi8vIGNoYXJhY3RlciB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdFxuLy8gb3ZlcnJpZGRlbiBvciB1c2VkIGFzIGFuIGF0dGFjayB2ZWN0b3IuXG4vL1xuaWYgKE9iamVjdC5jcmVhdGUpIHtcbiAgRXZlbnRzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgLy9cbiAgLy8gVGhpcyBoYWNrIGlzIG5lZWRlZCBiZWNhdXNlIHRoZSBgX19wcm90b19fYCBwcm9wZXJ0eSBpcyBzdGlsbCBpbmhlcml0ZWQgaW5cbiAgLy8gc29tZSBvbGQgYnJvd3NlcnMgbGlrZSBBbmRyb2lkIDQsIGlQaG9uZSA1LjEsIE9wZXJhIDExIGFuZCBTYWZhcmkgNS5cbiAgLy9cbiAgaWYgKCFuZXcgRXZlbnRzKCkuX19wcm90b19fKSBwcmVmaXggPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBldmVudCBsaXN0ZW5lci5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0geyp9IGNvbnRleHQgVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gU3BlY2lmeSBpZiB0aGUgbGlzdGVuZXIgaXMgYSBvbmUtdGltZSBsaXN0ZW5lci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIEFkZCBhIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7RXZlbnRFbWl0dGVyfSBlbWl0dGVyIFJlZmVyZW5jZSB0byB0aGUgYEV2ZW50RW1pdHRlcmAgaW5zdGFuY2UuXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0geyp9IGNvbnRleHQgVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIFNwZWNpZnkgaWYgdGhlIGxpc3RlbmVyIGlzIGEgb25lLXRpbWUgbGlzdGVuZXIuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gYWRkTGlzdGVuZXIoZW1pdHRlciwgZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cblxuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgZW1pdHRlciwgb25jZSlcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCFlbWl0dGVyLl9ldmVudHNbZXZ0XSkgZW1pdHRlci5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lciwgZW1pdHRlci5fZXZlbnRzQ291bnQrKztcbiAgZWxzZSBpZiAoIWVtaXR0ZXIuX2V2ZW50c1tldnRdLmZuKSBlbWl0dGVyLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZSBlbWl0dGVyLl9ldmVudHNbZXZ0XSA9IFtlbWl0dGVyLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJdO1xuXG4gIHJldHVybiBlbWl0dGVyO1xufVxuXG4vKipcbiAqIENsZWFyIGV2ZW50IGJ5IG5hbWUuXG4gKlxuICogQHBhcmFtIHtFdmVudEVtaXR0ZXJ9IGVtaXR0ZXIgUmVmZXJlbmNlIHRvIHRoZSBgRXZlbnRFbWl0dGVyYCBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldnQgVGhlIEV2ZW50IG5hbWUuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjbGVhckV2ZW50KGVtaXR0ZXIsIGV2dCkge1xuICBpZiAoLS1lbWl0dGVyLl9ldmVudHNDb3VudCA9PT0gMCkgZW1pdHRlci5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICBlbHNlIGRlbGV0ZSBlbWl0dGVyLl9ldmVudHNbZXZ0XTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBgRXZlbnRFbWl0dGVyYCBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG59XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7XG4gIHZhciBuYW1lcyA9IFtdXG4gICAgLCBldmVudHNcbiAgICAsIG5hbWU7XG5cbiAgaWYgKHRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSByZXR1cm4gbmFtZXM7XG5cbiAgZm9yIChuYW1lIGluIChldmVudHMgPSB0aGlzLl9ldmVudHMpKSB7XG4gICAgaWYgKGhhcy5jYWxsKGV2ZW50cywgbmFtZSkpIG5hbWVzLnB1c2gocHJlZml4ID8gbmFtZS5zbGljZSgxKSA6IG5hbWUpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICByZXR1cm4gbmFtZXMuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZXZlbnRzKSk7XG4gIH1cblxuICByZXR1cm4gbmFtZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHsoU3RyaW5nfFN5bWJvbCl9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge0FycmF5fSBUaGUgcmVnaXN0ZXJlZCBsaXN0ZW5lcnMuXG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBoYW5kbGVycyA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmICghaGFuZGxlcnMpIHJldHVybiBbXTtcbiAgaWYgKGhhbmRsZXJzLmZuKSByZXR1cm4gW2hhbmRsZXJzLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGhhbmRsZXJzLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGhhbmRsZXJzW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG51bWJlciBvZiBsaXN0ZW5lcnMgbGlzdGVuaW5nIHRvIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHsoU3RyaW5nfFN5bWJvbCl9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge051bWJlcn0gVGhlIG51bWJlciBvZiBsaXN0ZW5lcnMuXG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uIGxpc3RlbmVyQ291bnQoZXZlbnQpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmICghbGlzdGVuZXJzKSByZXR1cm4gMDtcbiAgaWYgKGxpc3RlbmVycy5mbikgcmV0dXJuIDE7XG4gIHJldHVybiBsaXN0ZW5lcnMubGVuZ3RoO1xufTtcblxuLyoqXG4gKiBDYWxscyBlYWNoIG9mIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBldmVudCBoYWQgbGlzdGVuZXJzLCBlbHNlIGBmYWxzZWAuXG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgNDogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMiwgYTMpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBBZGQgYSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0geyp9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICByZXR1cm4gYWRkTGlzdGVuZXIodGhpcywgZXZlbnQsIGZuLCBjb250ZXh0LCBmYWxzZSk7XG59O1xuXG4vKipcbiAqIEFkZCBhIG9uZS10aW1lIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICByZXR1cm4gYWRkTGlzdGVuZXIodGhpcywgZXZlbnQsIGZuLCBjb250ZXh0LCB0cnVlKTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBsaXN0ZW5lcnMgb2YgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgbWF0Y2ggdGhpcyBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gY29udGV4dCBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgaGF2ZSB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25lLXRpbWUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuICBpZiAoIWZuKSB7XG4gICAgY2xlYXJFdmVudCh0aGlzLCBldnQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAoXG4gICAgICBsaXN0ZW5lcnMuZm4gPT09IGZuICYmXG4gICAgICAoIW9uY2UgfHwgbGlzdGVuZXJzLm9uY2UpICYmXG4gICAgICAoIWNvbnRleHQgfHwgbGlzdGVuZXJzLmNvbnRleHQgPT09IGNvbnRleHQpXG4gICAgKSB7XG4gICAgICBjbGVhckV2ZW50KHRoaXMsIGV2dCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvciAodmFyIGkgPSAwLCBldmVudHMgPSBbXSwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoXG4gICAgICAgIGxpc3RlbmVyc1tpXS5mbiAhPT0gZm4gfHxcbiAgICAgICAgKG9uY2UgJiYgIWxpc3RlbmVyc1tpXS5vbmNlKSB8fFxuICAgICAgICAoY29udGV4dCAmJiBsaXN0ZW5lcnNbaV0uY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICkge1xuICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vXG4gICAgLy8gUmVzZXQgdGhlIGFycmF5LCBvciByZW1vdmUgaXQgY29tcGxldGVseSBpZiB3ZSBoYXZlIG5vIG1vcmUgbGlzdGVuZXJzLlxuICAgIC8vXG4gICAgaWYgKGV2ZW50cy5sZW5ndGgpIHRoaXMuX2V2ZW50c1tldnRdID0gZXZlbnRzLmxlbmd0aCA9PT0gMSA/IGV2ZW50c1swXSA6IGV2ZW50cztcbiAgICBlbHNlIGNsZWFyRXZlbnQodGhpcywgZXZ0KTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycywgb3IgdGhvc2Ugb2YgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gW2V2ZW50XSBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgdmFyIGV2dDtcblxuICBpZiAoZXZlbnQpIHtcbiAgICBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuICAgIGlmICh0aGlzLl9ldmVudHNbZXZ0XSkgY2xlYXJFdmVudCh0aGlzLCBldnQpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gQWxsb3cgYEV2ZW50RW1pdHRlcmAgdG8gYmUgaW1wb3J0ZWQgYXMgbW9kdWxlIG5hbWVzcGFjZS5cbi8vXG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvKipcbiAqIFNvdXJjZTogZnRwOi8vZnRwLnVuaWNvZGUub3JnL1B1YmxpYy9VQ0QvbGF0ZXN0L3VjZC9TcGVjaWFsQ2FzaW5nLnR4dFxuICovXG52YXIgU1VQUE9SVEVEX0xPQ0FMRSA9IHtcbiAgICB0cjoge1xuICAgICAgICByZWdleHA6IC9cXHUwMTMwfFxcdTAwNDl8XFx1MDA0OVxcdTAzMDcvZyxcbiAgICAgICAgbWFwOiB7XG4gICAgICAgICAgICDEsDogXCJcXHUwMDY5XCIsXG4gICAgICAgICAgICBJOiBcIlxcdTAxMzFcIixcbiAgICAgICAgICAgIEnMhzogXCJcXHUwMDY5XCIsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBhejoge1xuICAgICAgICByZWdleHA6IC9cXHUwMTMwL2csXG4gICAgICAgIG1hcDoge1xuICAgICAgICAgICAgxLA6IFwiXFx1MDA2OVwiLFxuICAgICAgICAgICAgSTogXCJcXHUwMTMxXCIsXG4gICAgICAgICAgICBJzIc6IFwiXFx1MDA2OVwiLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgbHQ6IHtcbiAgICAgICAgcmVnZXhwOiAvXFx1MDA0OXxcXHUwMDRBfFxcdTAxMkV8XFx1MDBDQ3xcXHUwMENEfFxcdTAxMjgvZyxcbiAgICAgICAgbWFwOiB7XG4gICAgICAgICAgICBJOiBcIlxcdTAwNjlcXHUwMzA3XCIsXG4gICAgICAgICAgICBKOiBcIlxcdTAwNkFcXHUwMzA3XCIsXG4gICAgICAgICAgICDErjogXCJcXHUwMTJGXFx1MDMwN1wiLFxuICAgICAgICAgICAgw4w6IFwiXFx1MDA2OVxcdTAzMDdcXHUwMzAwXCIsXG4gICAgICAgICAgICDDjTogXCJcXHUwMDY5XFx1MDMwN1xcdTAzMDFcIixcbiAgICAgICAgICAgIMSoOiBcIlxcdTAwNjlcXHUwMzA3XFx1MDMwM1wiLFxuICAgICAgICB9LFxuICAgIH0sXG59O1xuLyoqXG4gKiBMb2NhbGl6ZWQgbG93ZXIgY2FzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2FsZUxvd2VyQ2FzZShzdHIsIGxvY2FsZSkge1xuICAgIHZhciBsYW5nID0gU1VQUE9SVEVEX0xPQ0FMRVtsb2NhbGUudG9Mb3dlckNhc2UoKV07XG4gICAgaWYgKGxhbmcpXG4gICAgICAgIHJldHVybiBsb3dlckNhc2Uoc3RyLnJlcGxhY2UobGFuZy5yZWdleHAsIGZ1bmN0aW9uIChtKSB7IHJldHVybiBsYW5nLm1hcFttXTsgfSkpO1xuICAgIHJldHVybiBsb3dlckNhc2Uoc3RyKTtcbn1cbi8qKlxuICogTG93ZXIgY2FzZSBhcyBhIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG93ZXJDYXNlKHN0cikge1xuICAgIHJldHVybiBzdHIudG9Mb3dlckNhc2UoKTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIi8qKlxuICogSGVscGVycy5cbiAqL1xuXG52YXIgcyA9IDEwMDA7XG52YXIgbSA9IHMgKiA2MDtcbnZhciBoID0gbSAqIDYwO1xudmFyIGQgPSBoICogMjQ7XG52YXIgdyA9IGQgKiA3O1xudmFyIHkgPSBkICogMzY1LjI1O1xuXG4vKipcbiAqIFBhcnNlIG9yIGZvcm1hdCB0aGUgZ2l2ZW4gYHZhbGAuXG4gKlxuICogT3B0aW9uczpcbiAqXG4gKiAgLSBgbG9uZ2AgdmVyYm9zZSBmb3JtYXR0aW5nIFtmYWxzZV1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IHZhbFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHRocm93cyB7RXJyb3J9IHRocm93IGFuIGVycm9yIGlmIHZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgbnVtYmVyXG4gKiBAcmV0dXJuIHtTdHJpbmd8TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuICBpZiAodHlwZSA9PT0gJ3N0cmluZycgJiYgdmFsLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gcGFyc2UodmFsKTtcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiBpc0Zpbml0ZSh2YWwpKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMubG9uZyA/IGZtdExvbmcodmFsKSA6IGZtdFNob3J0KHZhbCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICd2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIHZhbGlkIG51bWJlci4gdmFsPScgK1xuICAgICAgSlNPTi5zdHJpbmdpZnkodmFsKVxuICApO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHN0ciA9IFN0cmluZyhzdHIpO1xuICBpZiAoc3RyLmxlbmd0aCA+IDEwMCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbWF0Y2ggPSAvXigtPyg/OlxcZCspP1xcLj9cXGQrKSAqKG1pbGxpc2Vjb25kcz98bXNlY3M/fG1zfHNlY29uZHM/fHNlY3M/fHN8bWludXRlcz98bWlucz98bXxob3Vycz98aHJzP3xofGRheXM/fGR8d2Vla3M/fHd8eWVhcnM/fHlycz98eSk/JC9pLmV4ZWMoXG4gICAgc3RyXG4gICk7XG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG4gPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgdmFyIHR5cGUgPSAobWF0Y2hbMl0gfHwgJ21zJykudG9Mb3dlckNhc2UoKTtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAneWVhcnMnOlxuICAgIGNhc2UgJ3llYXInOlxuICAgIGNhc2UgJ3lycyc6XG4gICAgY2FzZSAneXInOlxuICAgIGNhc2UgJ3knOlxuICAgICAgcmV0dXJuIG4gKiB5O1xuICAgIGNhc2UgJ3dlZWtzJzpcbiAgICBjYXNlICd3ZWVrJzpcbiAgICBjYXNlICd3JzpcbiAgICAgIHJldHVybiBuICogdztcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkO1xuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdocnMnOlxuICAgIGNhc2UgJ2hyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaDtcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ21pbnMnOlxuICAgIGNhc2UgJ21pbic6XG4gICAgY2FzZSAnbSc6XG4gICAgICByZXR1cm4gbiAqIG07XG4gICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgY2FzZSAnc2Vjb25kJzpcbiAgICBjYXNlICdzZWNzJzpcbiAgICBjYXNlICdzZWMnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21pbGxpc2Vjb25kcyc6XG4gICAgY2FzZSAnbWlsbGlzZWNvbmQnOlxuICAgIGNhc2UgJ21zZWNzJzpcbiAgICBjYXNlICdtc2VjJzpcbiAgICBjYXNlICdtcyc6XG4gICAgICByZXR1cm4gbjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdFNob3J0KG1zKSB7XG4gIHZhciBtc0FicyA9IE1hdGguYWJzKG1zKTtcbiAgaWYgKG1zQWJzID49IGQpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGQpICsgJ2QnO1xuICB9XG4gIGlmIChtc0FicyA+PSBoKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBoKSArICdoJztcbiAgfVxuICBpZiAobXNBYnMgPj0gbSkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbSkgKyAnbSc7XG4gIH1cbiAgaWYgKG1zQWJzID49IHMpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIHMpICsgJ3MnO1xuICB9XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBmbXRMb25nKG1zKSB7XG4gIHZhciBtc0FicyA9IE1hdGguYWJzKG1zKTtcbiAgaWYgKG1zQWJzID49IGQpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgZCwgJ2RheScpO1xuICB9XG4gIGlmIChtc0FicyA+PSBoKSB7XG4gICAgcmV0dXJuIHBsdXJhbChtcywgbXNBYnMsIGgsICdob3VyJyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IG0pIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgbSwgJ21pbnV0ZScpO1xuICB9XG4gIGlmIChtc0FicyA+PSBzKSB7XG4gICAgcmV0dXJuIHBsdXJhbChtcywgbXNBYnMsIHMsICdzZWNvbmQnKTtcbiAgfVxuICByZXR1cm4gbXMgKyAnIG1zJztcbn1cblxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqL1xuXG5mdW5jdGlvbiBwbHVyYWwobXMsIG1zQWJzLCBuLCBuYW1lKSB7XG4gIHZhciBpc1BsdXJhbCA9IG1zQWJzID49IG4gKiAxLjU7XG4gIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbikgKyAnICcgKyBuYW1lICsgKGlzUGx1cmFsID8gJ3MnIDogJycpO1xufVxuIiwiaW1wb3J0IHsgbG93ZXJDYXNlIH0gZnJvbSBcImxvd2VyLWNhc2VcIjtcbi8vIFN1cHBvcnQgY2FtZWwgY2FzZSAoXCJjYW1lbENhc2VcIiAtPiBcImNhbWVsIENhc2VcIiBhbmQgXCJDQU1FTENhc2VcIiAtPiBcIkNBTUVMIENhc2VcIikuXG52YXIgREVGQVVMVF9TUExJVF9SRUdFWFAgPSBbLyhbYS16MC05XSkoW0EtWl0pL2csIC8oW0EtWl0pKFtBLVpdW2Etel0pL2ddO1xuLy8gUmVtb3ZlIGFsbCBub24td29yZCBjaGFyYWN0ZXJzLlxudmFyIERFRkFVTFRfU1RSSVBfUkVHRVhQID0gL1teQS1aMC05XSsvZ2k7XG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgc3RyaW5nIGludG8gc29tZXRoaW5nIG90aGVyIGxpYnJhcmllcyBjYW4gbWFuaXB1bGF0ZSBlYXNpZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub0Nhc2UoaW5wdXQsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgIHZhciBfYSA9IG9wdGlvbnMuc3BsaXRSZWdleHAsIHNwbGl0UmVnZXhwID0gX2EgPT09IHZvaWQgMCA/IERFRkFVTFRfU1BMSVRfUkVHRVhQIDogX2EsIF9iID0gb3B0aW9ucy5zdHJpcFJlZ2V4cCwgc3RyaXBSZWdleHAgPSBfYiA9PT0gdm9pZCAwID8gREVGQVVMVF9TVFJJUF9SRUdFWFAgOiBfYiwgX2MgPSBvcHRpb25zLnRyYW5zZm9ybSwgdHJhbnNmb3JtID0gX2MgPT09IHZvaWQgMCA/IGxvd2VyQ2FzZSA6IF9jLCBfZCA9IG9wdGlvbnMuZGVsaW1pdGVyLCBkZWxpbWl0ZXIgPSBfZCA9PT0gdm9pZCAwID8gXCIgXCIgOiBfZDtcbiAgICB2YXIgcmVzdWx0ID0gcmVwbGFjZShyZXBsYWNlKGlucHV0LCBzcGxpdFJlZ2V4cCwgXCIkMVxcMCQyXCIpLCBzdHJpcFJlZ2V4cCwgXCJcXDBcIik7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICB2YXIgZW5kID0gcmVzdWx0Lmxlbmd0aDtcbiAgICAvLyBUcmltIHRoZSBkZWxpbWl0ZXIgZnJvbSBhcm91bmQgdGhlIG91dHB1dCBzdHJpbmcuXG4gICAgd2hpbGUgKHJlc3VsdC5jaGFyQXQoc3RhcnQpID09PSBcIlxcMFwiKVxuICAgICAgICBzdGFydCsrO1xuICAgIHdoaWxlIChyZXN1bHQuY2hhckF0KGVuZCAtIDEpID09PSBcIlxcMFwiKVxuICAgICAgICBlbmQtLTtcbiAgICAvLyBUcmFuc2Zvcm0gZWFjaCB0b2tlbiBpbmRlcGVuZGVudGx5LlxuICAgIHJldHVybiByZXN1bHQuc2xpY2Uoc3RhcnQsIGVuZCkuc3BsaXQoXCJcXDBcIikubWFwKHRyYW5zZm9ybSkuam9pbihkZWxpbWl0ZXIpO1xufVxuLyoqXG4gKiBSZXBsYWNlIGByZWAgaW4gdGhlIGlucHV0IHN0cmluZyB3aXRoIHRoZSByZXBsYWNlbWVudCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gcmVwbGFjZShpbnB1dCwgcmUsIHZhbHVlKSB7XG4gICAgaWYgKHJlIGluc3RhbmNlb2YgUmVnRXhwKVxuICAgICAgICByZXR1cm4gaW5wdXQucmVwbGFjZShyZSwgdmFsdWUpO1xuICAgIHJldHVybiByZS5yZWR1Y2UoZnVuY3Rpb24gKGlucHV0LCByZSkgeyByZXR1cm4gaW5wdXQucmVwbGFjZShyZSwgdmFsdWUpOyB9LCBpbnB1dCk7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cclxuLy9cclxuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcclxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxyXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcclxuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxyXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XHJcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxyXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcclxuLy9cclxuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcclxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXHJcbi8vXHJcbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1NcclxuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxyXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXHJcbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxyXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1JcclxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxyXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuXHJcbnZhciBpc1dpbmRvd3MgPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInO1xyXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcclxuXHJcblxyXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcclxuLy8gbXVzdCBiZSBubyBzbGFzaGVzIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XHJcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxyXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xyXG4gIHZhciByZXMgPSBbXTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICB2YXIgcCA9IHBhcnRzW2ldO1xyXG5cclxuICAgIC8vIGlnbm9yZSBlbXB0eSBwYXJ0c1xyXG4gICAgaWYgKCFwIHx8IHAgPT09ICcuJylcclxuICAgICAgY29udGludWU7XHJcblxyXG4gICAgaWYgKHAgPT09ICcuLicpIHtcclxuICAgICAgaWYgKHJlcy5sZW5ndGggJiYgcmVzW3Jlcy5sZW5ndGggLSAxXSAhPT0gJy4uJykge1xyXG4gICAgICAgIHJlcy5wb3AoKTtcclxuICAgICAgfSBlbHNlIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xyXG4gICAgICAgIHJlcy5wdXNoKCcuLicpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXMucHVzaChwKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbi8vIHJldHVybnMgYW4gYXJyYXkgd2l0aCBlbXB0eSBlbGVtZW50cyByZW1vdmVkIGZyb20gZWl0aGVyIGVuZCBvZiB0aGUgaW5wdXRcclxuLy8gYXJyYXkgb3IgdGhlIG9yaWdpbmFsIGFycmF5IGlmIG5vIGVsZW1lbnRzIG5lZWQgdG8gYmUgcmVtb3ZlZFxyXG5mdW5jdGlvbiB0cmltQXJyYXkoYXJyKSB7XHJcbiAgdmFyIGxhc3RJbmRleCA9IGFyci5sZW5ndGggLSAxO1xyXG4gIHZhciBzdGFydCA9IDA7XHJcbiAgZm9yICg7IHN0YXJ0IDw9IGxhc3RJbmRleDsgc3RhcnQrKykge1xyXG4gICAgaWYgKGFycltzdGFydF0pXHJcbiAgICAgIGJyZWFrO1xyXG4gIH1cclxuXHJcbiAgdmFyIGVuZCA9IGxhc3RJbmRleDtcclxuICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XHJcbiAgICBpZiAoYXJyW2VuZF0pXHJcbiAgICAgIGJyZWFrO1xyXG4gIH1cclxuXHJcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gbGFzdEluZGV4KVxyXG4gICAgcmV0dXJuIGFycjtcclxuICBpZiAoc3RhcnQgPiBlbmQpXHJcbiAgICByZXR1cm4gW107XHJcbiAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kICsgMSk7XHJcbn1cclxuXHJcbi8vIFJlZ2V4IHRvIHNwbGl0IGEgd2luZG93cyBwYXRoIGludG8gdGhyZWUgcGFydHM6IFsqLCBkZXZpY2UsIHNsYXNoLFxyXG4vLyB0YWlsXSB3aW5kb3dzLW9ubHlcclxudmFyIHNwbGl0RGV2aWNlUmUgPVxyXG4gICAgL14oW2EtekEtWl06fFtcXFxcXFwvXXsyfVteXFxcXFxcL10rW1xcXFxcXC9dK1teXFxcXFxcL10rKT8oW1xcXFxcXC9dKT8oW1xcc1xcU10qPykkLztcclxuXHJcbi8vIFJlZ2V4IHRvIHNwbGl0IHRoZSB0YWlsIHBhcnQgb2YgdGhlIGFib3ZlIGludG8gWyosIGRpciwgYmFzZW5hbWUsIGV4dF1cclxudmFyIHNwbGl0VGFpbFJlID1cclxuICAgIC9eKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFxcXFxcL10rP3wpKFxcLlteLlxcL1xcXFxdKnwpKSg/OltcXFxcXFwvXSopJC87XHJcblxyXG52YXIgd2luMzIgPSB7fTtcclxuXHJcbi8vIEZ1bmN0aW9uIHRvIHNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XVxyXG5mdW5jdGlvbiB3aW4zMlNwbGl0UGF0aChmaWxlbmFtZSkge1xyXG4gIC8vIFNlcGFyYXRlIGRldmljZStzbGFzaCBmcm9tIHRhaWxcclxuICB2YXIgcmVzdWx0ID0gc3BsaXREZXZpY2VSZS5leGVjKGZpbGVuYW1lKSxcclxuICAgICAgZGV2aWNlID0gKHJlc3VsdFsxXSB8fCAnJykgKyAocmVzdWx0WzJdIHx8ICcnKSxcclxuICAgICAgdGFpbCA9IHJlc3VsdFszXSB8fCAnJztcclxuICAvLyBTcGxpdCB0aGUgdGFpbCBpbnRvIGRpciwgYmFzZW5hbWUgYW5kIGV4dGVuc2lvblxyXG4gIHZhciByZXN1bHQyID0gc3BsaXRUYWlsUmUuZXhlYyh0YWlsKSxcclxuICAgICAgZGlyID0gcmVzdWx0MlsxXSxcclxuICAgICAgYmFzZW5hbWUgPSByZXN1bHQyWzJdLFxyXG4gICAgICBleHQgPSByZXN1bHQyWzNdO1xyXG4gIHJldHVybiBbZGV2aWNlLCBkaXIsIGJhc2VuYW1lLCBleHRdO1xyXG59XHJcblxyXG5mdW5jdGlvbiB3aW4zMlN0YXRQYXRoKHBhdGgpIHtcclxuICB2YXIgcmVzdWx0ID0gc3BsaXREZXZpY2VSZS5leGVjKHBhdGgpLFxyXG4gICAgICBkZXZpY2UgPSByZXN1bHRbMV0gfHwgJycsXHJcbiAgICAgIGlzVW5jID0gISFkZXZpY2UgJiYgZGV2aWNlWzFdICE9PSAnOic7XHJcbiAgcmV0dXJuIHtcclxuICAgIGRldmljZTogZGV2aWNlLFxyXG4gICAgaXNVbmM6IGlzVW5jLFxyXG4gICAgaXNBYnNvbHV0ZTogaXNVbmMgfHwgISFyZXN1bHRbMl0sIC8vIFVOQyBwYXRocyBhcmUgYWx3YXlzIGFic29sdXRlXHJcbiAgICB0YWlsOiByZXN1bHRbM11cclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBub3JtYWxpemVVTkNSb290KGRldmljZSkge1xyXG4gIHJldHVybiAnXFxcXFxcXFwnICsgZGV2aWNlLnJlcGxhY2UoL15bXFxcXFxcL10rLywgJycpLnJlcGxhY2UoL1tcXFxcXFwvXSsvZywgJ1xcXFwnKTtcclxufVxyXG5cclxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxyXG53aW4zMi5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHJlc29sdmVkRGV2aWNlID0gJycsXHJcbiAgICAgIHJlc29sdmVkVGFpbCA9ICcnLFxyXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XHJcblxyXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMTsgaS0tKSB7XHJcbiAgICB2YXIgcGF0aDtcclxuICAgIGlmIChpID49IDApIHtcclxuICAgICAgcGF0aCA9IGFyZ3VtZW50c1tpXTtcclxuICAgIH0gZWxzZSBpZiAoIXJlc29sdmVkRGV2aWNlKSB7XHJcbiAgICAgIHBhdGggPSBwcm9jZXNzLmN3ZCgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gV2luZG93cyBoYXMgdGhlIGNvbmNlcHQgb2YgZHJpdmUtc3BlY2lmaWMgY3VycmVudCB3b3JraW5nXHJcbiAgICAgIC8vIGRpcmVjdG9yaWVzLiBJZiB3ZSd2ZSByZXNvbHZlZCBhIGRyaXZlIGxldHRlciBidXQgbm90IHlldCBhblxyXG4gICAgICAvLyBhYnNvbHV0ZSBwYXRoLCBnZXQgY3dkIGZvciB0aGF0IGRyaXZlLiBXZSdyZSBzdXJlIHRoZSBkZXZpY2UgaXMgbm90XHJcbiAgICAgIC8vIGFuIHVuYyBwYXRoIGF0IHRoaXMgcG9pbnRzLCBiZWNhdXNlIHVuYyBwYXRocyBhcmUgYWx3YXlzIGFic29sdXRlLlxyXG4gICAgICBwYXRoID0gcHJvY2Vzcy5lbnZbJz0nICsgcmVzb2x2ZWREZXZpY2VdO1xyXG4gICAgICAvLyBWZXJpZnkgdGhhdCBhIGRyaXZlLWxvY2FsIGN3ZCB3YXMgZm91bmQgYW5kIHRoYXQgaXQgYWN0dWFsbHkgcG9pbnRzXHJcbiAgICAgIC8vIHRvIG91ciBkcml2ZS4gSWYgbm90LCBkZWZhdWx0IHRvIHRoZSBkcml2ZSdzIHJvb3QuXHJcbiAgICAgIGlmICghcGF0aCB8fCBwYXRoLnN1YnN0cigwLCAzKS50b0xvd2VyQ2FzZSgpICE9PVxyXG4gICAgICAgICAgcmVzb2x2ZWREZXZpY2UudG9Mb3dlckNhc2UoKSArICdcXFxcJykge1xyXG4gICAgICAgIHBhdGggPSByZXNvbHZlZERldmljZSArICdcXFxcJztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xyXG4gICAgaWYgKCF1dGlsLmlzU3RyaW5nKHBhdGgpKSB7XHJcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XHJcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciByZXN1bHQgPSB3aW4zMlN0YXRQYXRoKHBhdGgpLFxyXG4gICAgICAgIGRldmljZSA9IHJlc3VsdC5kZXZpY2UsXHJcbiAgICAgICAgaXNVbmMgPSByZXN1bHQuaXNVbmMsXHJcbiAgICAgICAgaXNBYnNvbHV0ZSA9IHJlc3VsdC5pc0Fic29sdXRlLFxyXG4gICAgICAgIHRhaWwgPSByZXN1bHQudGFpbDtcclxuXHJcbiAgICBpZiAoZGV2aWNlICYmXHJcbiAgICAgICAgcmVzb2x2ZWREZXZpY2UgJiZcclxuICAgICAgICBkZXZpY2UudG9Mb3dlckNhc2UoKSAhPT0gcmVzb2x2ZWREZXZpY2UudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAvLyBUaGlzIHBhdGggcG9pbnRzIHRvIGFub3RoZXIgZGV2aWNlIHNvIGl0IGlzIG5vdCBhcHBsaWNhYmxlXHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghcmVzb2x2ZWREZXZpY2UpIHtcclxuICAgICAgcmVzb2x2ZWREZXZpY2UgPSBkZXZpY2U7XHJcbiAgICB9XHJcbiAgICBpZiAoIXJlc29sdmVkQWJzb2x1dGUpIHtcclxuICAgICAgcmVzb2x2ZWRUYWlsID0gdGFpbCArICdcXFxcJyArIHJlc29sdmVkVGFpbDtcclxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGlzQWJzb2x1dGU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc29sdmVkRGV2aWNlICYmIHJlc29sdmVkQWJzb2x1dGUpIHtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBDb252ZXJ0IHNsYXNoZXMgdG8gYmFja3NsYXNoZXMgd2hlbiBgcmVzb2x2ZWREZXZpY2VgIHBvaW50cyB0byBhbiBVTkNcclxuICAvLyByb290LiBBbHNvIHNxdWFzaCBtdWx0aXBsZSBzbGFzaGVzIGludG8gYSBzaW5nbGUgb25lIHdoZXJlIGFwcHJvcHJpYXRlLlxyXG4gIGlmIChpc1VuYykge1xyXG4gICAgcmVzb2x2ZWREZXZpY2UgPSBub3JtYWxpemVVTkNSb290KHJlc29sdmVkRGV2aWNlKTtcclxuICB9XHJcblxyXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLFxyXG4gIC8vIGJ1dCBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKVxyXG4gIC8vIGZhaWxzKVxyXG5cclxuICAvLyBOb3JtYWxpemUgdGhlIHRhaWwgcGF0aFxyXG4gIHJlc29sdmVkVGFpbCA9IG5vcm1hbGl6ZUFycmF5KHJlc29sdmVkVGFpbC5zcGxpdCgvW1xcXFxcXC9dKy8pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCdcXFxcJyk7XHJcblxyXG4gIHJldHVybiAocmVzb2x2ZWREZXZpY2UgKyAocmVzb2x2ZWRBYnNvbHV0ZSA/ICdcXFxcJyA6ICcnKSArIHJlc29sdmVkVGFpbCkgfHxcclxuICAgICAgICAgJy4nO1xyXG59O1xyXG5cclxuXHJcbndpbjMyLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuICB2YXIgcmVzdWx0ID0gd2luMzJTdGF0UGF0aChwYXRoKSxcclxuICAgICAgZGV2aWNlID0gcmVzdWx0LmRldmljZSxcclxuICAgICAgaXNVbmMgPSByZXN1bHQuaXNVbmMsXHJcbiAgICAgIGlzQWJzb2x1dGUgPSByZXN1bHQuaXNBYnNvbHV0ZSxcclxuICAgICAgdGFpbCA9IHJlc3VsdC50YWlsLFxyXG4gICAgICB0cmFpbGluZ1NsYXNoID0gL1tcXFxcXFwvXSQvLnRlc3QodGFpbCk7XHJcblxyXG4gIC8vIE5vcm1hbGl6ZSB0aGUgdGFpbCBwYXRoXHJcbiAgdGFpbCA9IG5vcm1hbGl6ZUFycmF5KHRhaWwuc3BsaXQoL1tcXFxcXFwvXSsvKSwgIWlzQWJzb2x1dGUpLmpvaW4oJ1xcXFwnKTtcclxuXHJcbiAgaWYgKCF0YWlsICYmICFpc0Fic29sdXRlKSB7XHJcbiAgICB0YWlsID0gJy4nO1xyXG4gIH1cclxuICBpZiAodGFpbCAmJiB0cmFpbGluZ1NsYXNoKSB7XHJcbiAgICB0YWlsICs9ICdcXFxcJztcclxuICB9XHJcblxyXG4gIC8vIENvbnZlcnQgc2xhc2hlcyB0byBiYWNrc2xhc2hlcyB3aGVuIGBkZXZpY2VgIHBvaW50cyB0byBhbiBVTkMgcm9vdC5cclxuICAvLyBBbHNvIHNxdWFzaCBtdWx0aXBsZSBzbGFzaGVzIGludG8gYSBzaW5nbGUgb25lIHdoZXJlIGFwcHJvcHJpYXRlLlxyXG4gIGlmIChpc1VuYykge1xyXG4gICAgZGV2aWNlID0gbm9ybWFsaXplVU5DUm9vdChkZXZpY2UpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRldmljZSArIChpc0Fic29sdXRlID8gJ1xcXFwnIDogJycpICsgdGFpbDtcclxufTtcclxuXHJcblxyXG53aW4zMi5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xyXG4gIHJldHVybiB3aW4zMlN0YXRQYXRoKHBhdGgpLmlzQWJzb2x1dGU7XHJcbn07XHJcblxyXG53aW4zMi5qb2luID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBhdGhzID0gW107XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgIHZhciBhcmcgPSBhcmd1bWVudHNbaV07XHJcbiAgICBpZiAoIXV0aWwuaXNTdHJpbmcoYXJnKSkge1xyXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xyXG4gICAgfVxyXG4gICAgaWYgKGFyZykge1xyXG4gICAgICBwYXRocy5wdXNoKGFyZyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgam9pbmVkID0gcGF0aHMuam9pbignXFxcXCcpO1xyXG5cclxuICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgam9pbmVkIHBhdGggZG9lc24ndCBzdGFydCB3aXRoIHR3byBzbGFzaGVzLCBiZWNhdXNlXHJcbiAgLy8gbm9ybWFsaXplKCkgd2lsbCBtaXN0YWtlIGl0IGZvciBhbiBVTkMgcGF0aCB0aGVuLlxyXG4gIC8vXHJcbiAgLy8gVGhpcyBzdGVwIGlzIHNraXBwZWQgd2hlbiBpdCBpcyB2ZXJ5IGNsZWFyIHRoYXQgdGhlIHVzZXIgYWN0dWFsbHlcclxuICAvLyBpbnRlbmRlZCB0byBwb2ludCBhdCBhbiBVTkMgcGF0aC4gVGhpcyBpcyBhc3N1bWVkIHdoZW4gdGhlIGZpcnN0XHJcbiAgLy8gbm9uLWVtcHR5IHN0cmluZyBhcmd1bWVudHMgc3RhcnRzIHdpdGggZXhhY3RseSB0d28gc2xhc2hlcyBmb2xsb3dlZCBieVxyXG4gIC8vIGF0IGxlYXN0IG9uZSBtb3JlIG5vbi1zbGFzaCBjaGFyYWN0ZXIuXHJcbiAgLy9cclxuICAvLyBOb3RlIHRoYXQgZm9yIG5vcm1hbGl6ZSgpIHRvIHRyZWF0IGEgcGF0aCBhcyBhbiBVTkMgcGF0aCBpdCBuZWVkcyB0b1xyXG4gIC8vIGhhdmUgYXQgbGVhc3QgMiBjb21wb25lbnRzLCBzbyB3ZSBkb24ndCBmaWx0ZXIgZm9yIHRoYXQgaGVyZS5cclxuICAvLyBUaGlzIG1lYW5zIHRoYXQgdGhlIHVzZXIgY2FuIHVzZSBqb2luIHRvIGNvbnN0cnVjdCBVTkMgcGF0aHMgZnJvbVxyXG4gIC8vIGEgc2VydmVyIG5hbWUgYW5kIGEgc2hhcmUgbmFtZTsgZm9yIGV4YW1wbGU6XHJcbiAgLy8gICBwYXRoLmpvaW4oJy8vc2VydmVyJywgJ3NoYXJlJykgLT4gJ1xcXFxcXFxcc2VydmVyXFxcXHNoYXJlXFwnKVxyXG4gIGlmICghL15bXFxcXFxcL117Mn1bXlxcXFxcXC9dLy50ZXN0KHBhdGhzWzBdKSkge1xyXG4gICAgam9pbmVkID0gam9pbmVkLnJlcGxhY2UoL15bXFxcXFxcL117Mix9LywgJ1xcXFwnKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB3aW4zMi5ub3JtYWxpemUoam9pbmVkKTtcclxufTtcclxuXHJcblxyXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxyXG4vLyBpdCB3aWxsIHNvbHZlIHRoZSByZWxhdGl2ZSBwYXRoIGZyb20gJ2Zyb20nIHRvICd0bycsIGZvciBpbnN0YW5jZTpcclxuLy8gZnJvbSA9ICdDOlxcXFxvcmFuZGVhXFxcXHRlc3RcXFxcYWFhJ1xyXG4vLyB0byA9ICdDOlxcXFxvcmFuZGVhXFxcXGltcGxcXFxcYmJiJ1xyXG4vLyBUaGUgb3V0cHV0IG9mIHRoZSBmdW5jdGlvbiBzaG91bGQgYmU6ICcuLlxcXFwuLlxcXFxpbXBsXFxcXGJiYidcclxud2luMzIucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xyXG4gIGZyb20gPSB3aW4zMi5yZXNvbHZlKGZyb20pO1xyXG4gIHRvID0gd2luMzIucmVzb2x2ZSh0byk7XHJcblxyXG4gIC8vIHdpbmRvd3MgaXMgbm90IGNhc2Ugc2Vuc2l0aXZlXHJcbiAgdmFyIGxvd2VyRnJvbSA9IGZyb20udG9Mb3dlckNhc2UoKTtcclxuICB2YXIgbG93ZXJUbyA9IHRvLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gIHZhciB0b1BhcnRzID0gdHJpbUFycmF5KHRvLnNwbGl0KCdcXFxcJykpO1xyXG5cclxuICB2YXIgbG93ZXJGcm9tUGFydHMgPSB0cmltQXJyYXkobG93ZXJGcm9tLnNwbGl0KCdcXFxcJykpO1xyXG4gIHZhciBsb3dlclRvUGFydHMgPSB0cmltQXJyYXkobG93ZXJUby5zcGxpdCgnXFxcXCcpKTtcclxuXHJcbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGxvd2VyRnJvbVBhcnRzLmxlbmd0aCwgbG93ZXJUb1BhcnRzLmxlbmd0aCk7XHJcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICBpZiAobG93ZXJGcm9tUGFydHNbaV0gIT09IGxvd2VyVG9QYXJ0c1tpXSkge1xyXG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChzYW1lUGFydHNMZW5ndGggPT0gMCkge1xyXG4gICAgcmV0dXJuIHRvO1xyXG4gIH1cclxuXHJcbiAgdmFyIG91dHB1dFBhcnRzID0gW107XHJcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGxvd2VyRnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xyXG4gIH1cclxuXHJcbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcclxuXHJcbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJ1xcXFwnKTtcclxufTtcclxuXHJcblxyXG53aW4zMi5fbWFrZUxvbmcgPSBmdW5jdGlvbihwYXRoKSB7XHJcbiAgLy8gTm90ZTogdGhpcyB3aWxsICpwcm9iYWJseSogdGhyb3cgc29tZXdoZXJlLlxyXG4gIGlmICghdXRpbC5pc1N0cmluZyhwYXRoKSlcclxuICAgIHJldHVybiBwYXRoO1xyXG5cclxuICBpZiAoIXBhdGgpIHtcclxuICAgIHJldHVybiAnJztcclxuICB9XHJcblxyXG4gIHZhciByZXNvbHZlZFBhdGggPSB3aW4zMi5yZXNvbHZlKHBhdGgpO1xyXG5cclxuICBpZiAoL15bYS16QS1aXVxcOlxcXFwvLnRlc3QocmVzb2x2ZWRQYXRoKSkge1xyXG4gICAgLy8gcGF0aCBpcyBsb2NhbCBmaWxlc3lzdGVtIHBhdGgsIHdoaWNoIG5lZWRzIHRvIGJlIGNvbnZlcnRlZFxyXG4gICAgLy8gdG8gbG9uZyBVTkMgcGF0aC5cclxuICAgIHJldHVybiAnXFxcXFxcXFw/XFxcXCcgKyByZXNvbHZlZFBhdGg7XHJcbiAgfSBlbHNlIGlmICgvXlxcXFxcXFxcW14/Ll0vLnRlc3QocmVzb2x2ZWRQYXRoKSkge1xyXG4gICAgLy8gcGF0aCBpcyBuZXR3b3JrIFVOQyBwYXRoLCB3aGljaCBuZWVkcyB0byBiZSBjb252ZXJ0ZWRcclxuICAgIC8vIHRvIGxvbmcgVU5DIHBhdGguXHJcbiAgICByZXR1cm4gJ1xcXFxcXFxcP1xcXFxVTkNcXFxcJyArIHJlc29sdmVkUGF0aC5zdWJzdHJpbmcoMik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcGF0aDtcclxufTtcclxuXHJcblxyXG53aW4zMi5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xyXG4gIHZhciByZXN1bHQgPSB3aW4zMlNwbGl0UGF0aChwYXRoKSxcclxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcclxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xyXG5cclxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xyXG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXHJcbiAgICByZXR1cm4gJy4nO1xyXG4gIH1cclxuXHJcbiAgaWYgKGRpcikge1xyXG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcclxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJvb3QgKyBkaXI7XHJcbn07XHJcblxyXG5cclxud2luMzIuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcclxuICB2YXIgZiA9IHdpbjMyU3BsaXRQYXRoKHBhdGgpWzJdO1xyXG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cclxuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xyXG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XHJcbiAgfVxyXG4gIHJldHVybiBmO1xyXG59O1xyXG5cclxuXHJcbndpbjMyLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XHJcbiAgcmV0dXJuIHdpbjMyU3BsaXRQYXRoKHBhdGgpWzNdO1xyXG59O1xyXG5cclxuXHJcbndpbjMyLmZvcm1hdCA9IGZ1bmN0aW9uKHBhdGhPYmplY3QpIHtcclxuICBpZiAoIXV0aWwuaXNPYmplY3QocGF0aE9iamVjdCkpIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXHJcbiAgICAgICAgXCJQYXJhbWV0ZXIgJ3BhdGhPYmplY3QnIG11c3QgYmUgYW4gb2JqZWN0LCBub3QgXCIgKyB0eXBlb2YgcGF0aE9iamVjdFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHZhciByb290ID0gcGF0aE9iamVjdC5yb290IHx8ICcnO1xyXG5cclxuICBpZiAoIXV0aWwuaXNTdHJpbmcocm9vdCkpIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXHJcbiAgICAgICAgXCIncGF0aE9iamVjdC5yb290JyBtdXN0IGJlIGEgc3RyaW5nIG9yIHVuZGVmaW5lZCwgbm90IFwiICtcclxuICAgICAgICB0eXBlb2YgcGF0aE9iamVjdC5yb290XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgdmFyIGRpciA9IHBhdGhPYmplY3QuZGlyO1xyXG4gIHZhciBiYXNlID0gcGF0aE9iamVjdC5iYXNlIHx8ICcnO1xyXG4gIGlmICghZGlyKSB7XHJcbiAgICByZXR1cm4gYmFzZTtcclxuICB9XHJcbiAgaWYgKGRpcltkaXIubGVuZ3RoIC0gMV0gPT09IHdpbjMyLnNlcCkge1xyXG4gICAgcmV0dXJuIGRpciArIGJhc2U7XHJcbiAgfVxyXG4gIHJldHVybiBkaXIgKyB3aW4zMi5zZXAgKyBiYXNlO1xyXG59O1xyXG5cclxuXHJcbndpbjMyLnBhcnNlID0gZnVuY3Rpb24ocGF0aFN0cmluZykge1xyXG4gIGlmICghdXRpbC5pc1N0cmluZyhwYXRoU3RyaW5nKSkge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcclxuICAgICAgICBcIlBhcmFtZXRlciAncGF0aFN0cmluZycgbXVzdCBiZSBhIHN0cmluZywgbm90IFwiICsgdHlwZW9mIHBhdGhTdHJpbmdcclxuICAgICk7XHJcbiAgfVxyXG4gIHZhciBhbGxQYXJ0cyA9IHdpbjMyU3BsaXRQYXRoKHBhdGhTdHJpbmcpO1xyXG4gIGlmICghYWxsUGFydHMgfHwgYWxsUGFydHMubGVuZ3RoICE9PSA0KSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBwYXRoICdcIiArIHBhdGhTdHJpbmcgKyBcIidcIik7XHJcbiAgfVxyXG4gIHJldHVybiB7XHJcbiAgICByb290OiBhbGxQYXJ0c1swXSxcclxuICAgIGRpcjogYWxsUGFydHNbMF0gKyBhbGxQYXJ0c1sxXS5zbGljZSgwLCAtMSksXHJcbiAgICBiYXNlOiBhbGxQYXJ0c1syXSxcclxuICAgIGV4dDogYWxsUGFydHNbM10sXHJcbiAgICBuYW1lOiBhbGxQYXJ0c1syXS5zbGljZSgwLCBhbGxQYXJ0c1syXS5sZW5ndGggLSBhbGxQYXJ0c1szXS5sZW5ndGgpXHJcbiAgfTtcclxufTtcclxuXHJcblxyXG53aW4zMi5zZXAgPSAnXFxcXCc7XHJcbndpbjMyLmRlbGltaXRlciA9ICc7JztcclxuXHJcblxyXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxyXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxyXG52YXIgc3BsaXRQYXRoUmUgPVxyXG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XHJcbnZhciBwb3NpeCA9IHt9O1xyXG5cclxuXHJcbmZ1bmN0aW9uIHBvc2l4U3BsaXRQYXRoKGZpbGVuYW1lKSB7XHJcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xyXG59XHJcblxyXG5cclxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxyXG4vLyBwb3NpeCB2ZXJzaW9uXHJcbnBvc2l4LnJlc29sdmUgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXHJcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcclxuXHJcbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcclxuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xyXG5cclxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xyXG4gICAgaWYgKCF1dGlsLmlzU3RyaW5nKHBhdGgpKSB7XHJcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XHJcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XHJcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aFswXSA9PT0gJy8nO1xyXG4gIH1cclxuXHJcbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxyXG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxyXG5cclxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcclxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xyXG5cclxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XHJcbn07XHJcblxyXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxyXG4vLyBwb3NpeCB2ZXJzaW9uXHJcbnBvc2l4Lm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuICB2YXIgaXNBYnNvbHV0ZSA9IHBvc2l4LmlzQWJzb2x1dGUocGF0aCksXHJcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBwYXRoICYmIHBhdGhbcGF0aC5sZW5ndGggLSAxXSA9PT0gJy8nO1xyXG5cclxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcclxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkocGF0aC5zcGxpdCgnLycpLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xyXG5cclxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcclxuICAgIHBhdGggPSAnLic7XHJcbiAgfVxyXG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcclxuICAgIHBhdGggKz0gJy8nO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcclxufTtcclxuXHJcbi8vIHBvc2l4IHZlcnNpb25cclxucG9zaXguaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcclxufTtcclxuXHJcbi8vIHBvc2l4IHZlcnNpb25cclxucG9zaXguam9pbiA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBwYXRoID0gJyc7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgIHZhciBzZWdtZW50ID0gYXJndW1lbnRzW2ldO1xyXG4gICAgaWYgKCF1dGlsLmlzU3RyaW5nKHNlZ21lbnQpKSB7XHJcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoc2VnbWVudCkge1xyXG4gICAgICBpZiAoIXBhdGgpIHtcclxuICAgICAgICBwYXRoICs9IHNlZ21lbnQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcGF0aCArPSAnLycgKyBzZWdtZW50O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBwb3NpeC5ub3JtYWxpemUocGF0aCk7XHJcbn07XHJcblxyXG5cclxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcclxuLy8gcG9zaXggdmVyc2lvblxyXG5wb3NpeC5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XHJcbiAgZnJvbSA9IHBvc2l4LnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xyXG4gIHRvID0gcG9zaXgucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xyXG5cclxuICB2YXIgZnJvbVBhcnRzID0gdHJpbUFycmF5KGZyb20uc3BsaXQoJy8nKSk7XHJcbiAgdmFyIHRvUGFydHMgPSB0cmltQXJyYXkodG8uc3BsaXQoJy8nKSk7XHJcblxyXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XHJcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XHJcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdmFyIG91dHB1dFBhcnRzID0gW107XHJcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcclxuICB9XHJcblxyXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XHJcblxyXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XHJcbn07XHJcblxyXG5cclxucG9zaXguX21ha2VMb25nID0gZnVuY3Rpb24ocGF0aCkge1xyXG4gIHJldHVybiBwYXRoO1xyXG59O1xyXG5cclxuXHJcbnBvc2l4LmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XHJcbiAgdmFyIHJlc3VsdCA9IHBvc2l4U3BsaXRQYXRoKHBhdGgpLFxyXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxyXG4gICAgICBkaXIgPSByZXN1bHRbMV07XHJcblxyXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XHJcbiAgICAvLyBObyBkaXJuYW1lIHdoYXRzb2V2ZXJcclxuICAgIHJldHVybiAnLic7XHJcbiAgfVxyXG5cclxuICBpZiAoZGlyKSB7XHJcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxyXG4gICAgZGlyID0gZGlyLnN1YnN0cigwLCBkaXIubGVuZ3RoIC0gMSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcm9vdCArIGRpcjtcclxufTtcclxuXHJcblxyXG5wb3NpeC5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xyXG4gIHZhciBmID0gcG9zaXhTcGxpdFBhdGgocGF0aClbMl07XHJcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xyXG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XHJcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcclxuICB9XHJcbiAgcmV0dXJuIGY7XHJcbn07XHJcblxyXG5cclxucG9zaXguZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuICByZXR1cm4gcG9zaXhTcGxpdFBhdGgocGF0aClbM107XHJcbn07XHJcblxyXG5cclxucG9zaXguZm9ybWF0ID0gZnVuY3Rpb24ocGF0aE9iamVjdCkge1xyXG4gIGlmICghdXRpbC5pc09iamVjdChwYXRoT2JqZWN0KSkge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcclxuICAgICAgICBcIlBhcmFtZXRlciAncGF0aE9iamVjdCcgbXVzdCBiZSBhbiBvYmplY3QsIG5vdCBcIiArIHR5cGVvZiBwYXRoT2JqZWN0XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgdmFyIHJvb3QgPSBwYXRoT2JqZWN0LnJvb3QgfHwgJyc7XHJcblxyXG4gIGlmICghdXRpbC5pc1N0cmluZyhyb290KSkge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcclxuICAgICAgICBcIidwYXRoT2JqZWN0LnJvb3QnIG11c3QgYmUgYSBzdHJpbmcgb3IgdW5kZWZpbmVkLCBub3QgXCIgK1xyXG4gICAgICAgIHR5cGVvZiBwYXRoT2JqZWN0LnJvb3RcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICB2YXIgZGlyID0gcGF0aE9iamVjdC5kaXIgPyBwYXRoT2JqZWN0LmRpciArIHBvc2l4LnNlcCA6ICcnO1xyXG4gIHZhciBiYXNlID0gcGF0aE9iamVjdC5iYXNlIHx8ICcnO1xyXG4gIHJldHVybiBkaXIgKyBiYXNlO1xyXG59O1xyXG5cclxuXHJcbnBvc2l4LnBhcnNlID0gZnVuY3Rpb24ocGF0aFN0cmluZykge1xyXG4gIGlmICghdXRpbC5pc1N0cmluZyhwYXRoU3RyaW5nKSkge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcclxuICAgICAgICBcIlBhcmFtZXRlciAncGF0aFN0cmluZycgbXVzdCBiZSBhIHN0cmluZywgbm90IFwiICsgdHlwZW9mIHBhdGhTdHJpbmdcclxuICAgICk7XHJcbiAgfVxyXG4gIHZhciBhbGxQYXJ0cyA9IHBvc2l4U3BsaXRQYXRoKHBhdGhTdHJpbmcpO1xyXG4gIGlmICghYWxsUGFydHMgfHwgYWxsUGFydHMubGVuZ3RoICE9PSA0KSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBwYXRoICdcIiArIHBhdGhTdHJpbmcgKyBcIidcIik7XHJcbiAgfVxyXG4gIGFsbFBhcnRzWzFdID0gYWxsUGFydHNbMV0gfHwgJyc7XHJcbiAgYWxsUGFydHNbMl0gPSBhbGxQYXJ0c1syXSB8fCAnJztcclxuICBhbGxQYXJ0c1szXSA9IGFsbFBhcnRzWzNdIHx8ICcnO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcm9vdDogYWxsUGFydHNbMF0sXHJcbiAgICBkaXI6IGFsbFBhcnRzWzBdICsgYWxsUGFydHNbMV0uc2xpY2UoMCwgLTEpLFxyXG4gICAgYmFzZTogYWxsUGFydHNbMl0sXHJcbiAgICBleHQ6IGFsbFBhcnRzWzNdLFxyXG4gICAgbmFtZTogYWxsUGFydHNbMl0uc2xpY2UoMCwgYWxsUGFydHNbMl0ubGVuZ3RoIC0gYWxsUGFydHNbM10ubGVuZ3RoKVxyXG4gIH07XHJcbn07XHJcblxyXG5cclxucG9zaXguc2VwID0gJy8nO1xyXG5wb3NpeC5kZWxpbWl0ZXIgPSAnOic7XHJcblxyXG5cclxuaWYgKGlzV2luZG93cylcclxuICBtb2R1bGUuZXhwb3J0cyA9IHdpbjMyO1xyXG5lbHNlIC8qIHBvc2l4ICovXHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBwb3NpeDtcclxuXHJcbm1vZHVsZS5leHBvcnRzLnBvc2l4ID0gcG9zaXg7XHJcbm1vZHVsZS5leHBvcnRzLndpbjMyID0gd2luMzI7XHJcbiIsIi8qKlxuICBwb3N0bWF0ZSAtIEEgcG93ZXJmdWwsIHNpbXBsZSwgcHJvbWlzZS1iYXNlZCBwb3N0TWVzc2FnZSBsaWJyYXJ5XG4gIEB2ZXJzaW9uIHYxLjUuMlxuICBAbGluayBodHRwczovL2dpdGh1Yi5jb20vZG9sbGFyc2hhdmVjbHViL3Bvc3RtYXRlXG4gIEBhdXRob3IgSmFjb2IgS2VsbGV5IDxqYWtpZThAZ21haWwuY29tPlxuICBAbGljZW5zZSBNSVRcbioqL1xuLyoqXG4gKiBUaGUgdHlwZSBvZiBtZXNzYWdlcyBvdXIgZnJhbWVzIG91ciBzZW5kaW5nXG4gKiBAdHlwZSB7U3RyaW5nfVxuICovXG52YXIgbWVzc2FnZVR5cGUgPSAnYXBwbGljYXRpb24veC1wb3N0bWF0ZS12MStqc29uJztcbi8qKlxuICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGF0dGVtcHRzIHRvIHNlbmQgYSBoYW5kc2hha2UgcmVxdWVzdCB0byB0aGUgcGFyZW50XG4gKiBAdHlwZSB7TnVtYmVyfVxuICovXG5cbnZhciBtYXhIYW5kc2hha2VSZXF1ZXN0cyA9IDU7XG4vKipcbiAqIEEgdW5pcXVlIG1lc3NhZ2UgSUQgdGhhdCBpcyB1c2VkIHRvIGVuc3VyZSByZXNwb25zZXMgYXJlIHNlbnQgdG8gdGhlIGNvcnJlY3QgcmVxdWVzdHNcbiAqIEB0eXBlIHtOdW1iZXJ9XG4gKi9cblxudmFyIF9tZXNzYWdlSWQgPSAwO1xuLyoqXG4gKiBJbmNyZW1lbnRzIGFuZCByZXR1cm5zIGEgbWVzc2FnZSBJRFxuICogQHJldHVybiB7TnVtYmVyfSBBIHVuaXF1ZSBJRCBmb3IgYSBtZXNzYWdlXG4gKi9cblxudmFyIGdlbmVyYXRlTmV3TWVzc2FnZUlkID0gZnVuY3Rpb24gZ2VuZXJhdGVOZXdNZXNzYWdlSWQoKSB7XG4gIHJldHVybiArK19tZXNzYWdlSWQ7XG59O1xuLyoqXG4gKiBQb3N0bWF0ZSBsb2dnaW5nIGZ1bmN0aW9uIHRoYXQgZW5hYmxlcy9kaXNhYmxlcyB2aWEgY29uZmlnXG4gKiBAcGFyYW0gIHtPYmplY3R9IC4uLmFyZ3MgUmVzdCBBcmd1bWVudHNcbiAqL1xuXG52YXIgbG9nID0gZnVuY3Rpb24gbG9nKCkge1xuICB2YXIgX2NvbnNvbGU7XG5cbiAgcmV0dXJuIFBvc3RtYXRlLmRlYnVnID8gKF9jb25zb2xlID0gY29uc29sZSkubG9nLmFwcGx5KF9jb25zb2xlLCBhcmd1bWVudHMpIDogbnVsbDtcbn07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuXG4vKipcbiAqIFRha2VzIGEgVVJMIGFuZCByZXR1cm5zIHRoZSBvcmlnaW5cbiAqIEBwYXJhbSAge1N0cmluZ30gdXJsIFRoZSBmdWxsIFVSTCBiZWluZyByZXF1ZXN0ZWRcbiAqIEByZXR1cm4ge1N0cmluZ30gICAgIFRoZSBVUkxzIG9yaWdpblxuICovXG5cbnZhciByZXNvbHZlT3JpZ2luID0gZnVuY3Rpb24gcmVzb2x2ZU9yaWdpbih1cmwpIHtcbiAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gIGEuaHJlZiA9IHVybDtcbiAgdmFyIHByb3RvY29sID0gYS5wcm90b2NvbC5sZW5ndGggPiA0ID8gYS5wcm90b2NvbCA6IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbDtcbiAgdmFyIGhvc3QgPSBhLmhvc3QubGVuZ3RoID8gYS5wb3J0ID09PSAnODAnIHx8IGEucG9ydCA9PT0gJzQ0MycgPyBhLmhvc3RuYW1lIDogYS5ob3N0IDogd2luZG93LmxvY2F0aW9uLmhvc3Q7XG4gIHJldHVybiBhLm9yaWdpbiB8fCBwcm90b2NvbCArIFwiLy9cIiArIGhvc3Q7XG59O1xudmFyIG1lc3NhZ2VUeXBlcyA9IHtcbiAgaGFuZHNoYWtlOiAxLFxuICAnaGFuZHNoYWtlLXJlcGx5JzogMSxcbiAgY2FsbDogMSxcbiAgZW1pdDogMSxcbiAgcmVwbHk6IDEsXG4gIHJlcXVlc3Q6IDFcbiAgLyoqXG4gICAqIEVuc3VyZXMgdGhhdCBhIG1lc3NhZ2UgaXMgc2FmZSB0byBpbnRlcnByZXRcbiAgICogQHBhcmFtICB7T2JqZWN0fSBtZXNzYWdlIFRoZSBwb3N0bWF0ZSBtZXNzYWdlIGJlaW5nIHNlbnRcbiAgICogQHBhcmFtICB7U3RyaW5nfEJvb2xlYW59IGFsbG93ZWRPcmlnaW4gVGhlIHdoaXRlbGlzdGVkIG9yaWdpbiBvciBmYWxzZSB0byBza2lwIG9yaWdpbiBjaGVja1xuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKi9cblxufTtcbnZhciBzYW5pdGl6ZSA9IGZ1bmN0aW9uIHNhbml0aXplKG1lc3NhZ2UsIGFsbG93ZWRPcmlnaW4pIHtcbiAgaWYgKHR5cGVvZiBhbGxvd2VkT3JpZ2luID09PSAnc3RyaW5nJyAmJiBtZXNzYWdlLm9yaWdpbiAhPT0gYWxsb3dlZE9yaWdpbikgcmV0dXJuIGZhbHNlO1xuICBpZiAoIW1lc3NhZ2UuZGF0YSkgcmV0dXJuIGZhbHNlO1xuICBpZiAodHlwZW9mIG1lc3NhZ2UuZGF0YSA9PT0gJ29iamVjdCcgJiYgISgncG9zdG1hdGUnIGluIG1lc3NhZ2UuZGF0YSkpIHJldHVybiBmYWxzZTtcbiAgaWYgKG1lc3NhZ2UuZGF0YS50eXBlICE9PSBtZXNzYWdlVHlwZSkgcmV0dXJuIGZhbHNlO1xuICBpZiAoIW1lc3NhZ2VUeXBlc1ttZXNzYWdlLmRhdGEucG9zdG1hdGVdKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB0cnVlO1xufTtcbi8qKlxuICogVGFrZXMgYSBtb2RlbCwgYW5kIHNlYXJjaGVzIGZvciBhIHZhbHVlIGJ5IHRoZSBwcm9wZXJ0eVxuICogQHBhcmFtICB7T2JqZWN0fSBtb2RlbCAgICAgVGhlIGRpY3Rpb25hcnkgdG8gc2VhcmNoIGFnYWluc3RcbiAqIEBwYXJhbSAge1N0cmluZ30gcHJvcGVydHkgIEEgcGF0aCB3aXRoaW4gYSBkaWN0aW9uYXJ5IChpLmUuICd3aW5kb3cubG9jYXRpb24uaHJlZicpXG4gKiBAcGFyYW0gIHtPYmplY3R9IGRhdGEgICAgICBBZGRpdGlvbmFsIGluZm9ybWF0aW9uIGZyb20gdGhlIGdldCByZXF1ZXN0IHRoYXQgaXNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCB0byBmdW5jdGlvbnMgaW4gdGhlIGNoaWxkIG1vZGVsXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICovXG5cbnZhciByZXNvbHZlVmFsdWUgPSBmdW5jdGlvbiByZXNvbHZlVmFsdWUobW9kZWwsIHByb3BlcnR5KSB7XG4gIHZhciB1bndyYXBwZWRDb250ZXh0ID0gdHlwZW9mIG1vZGVsW3Byb3BlcnR5XSA9PT0gJ2Z1bmN0aW9uJyA/IG1vZGVsW3Byb3BlcnR5XSgpIDogbW9kZWxbcHJvcGVydHldO1xuICByZXR1cm4gUG9zdG1hdGUuUHJvbWlzZS5yZXNvbHZlKHVud3JhcHBlZENvbnRleHQpO1xufTtcbi8qKlxuICogQ29tcG9zZXMgYW4gQVBJIHRvIGJlIHVzZWQgYnkgdGhlIHBhcmVudFxuICogQHBhcmFtIHtPYmplY3R9IGluZm8gSW5mb3JtYXRpb24gb24gdGhlIGNvbnN1bWVyXG4gKi9cblxudmFyIFBhcmVudEFQSSA9XG4vKiNfX1BVUkVfXyovXG5mdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIFBhcmVudEFQSShpbmZvKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMucGFyZW50ID0gaW5mby5wYXJlbnQ7XG4gICAgdGhpcy5mcmFtZSA9IGluZm8uZnJhbWU7XG4gICAgdGhpcy5jaGlsZCA9IGluZm8uY2hpbGQ7XG4gICAgdGhpcy5jaGlsZE9yaWdpbiA9IGluZm8uY2hpbGRPcmlnaW47XG4gICAgdGhpcy5ldmVudHMgPSB7fTtcblxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBsb2coJ1BhcmVudDogUmVnaXN0ZXJpbmcgQVBJJyk7XG4gICAgICBsb2coJ1BhcmVudDogQXdhaXRpbmcgbWVzc2FnZXMuLi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmICghc2FuaXRpemUoZSwgX3RoaXMuY2hpbGRPcmlnaW4pKSByZXR1cm4gZmFsc2U7XG4gICAgICAvKipcbiAgICAgICAqIHRoZSBhc3NpZ25tZW50cyBiZWxvdyBlbnN1cmVzIHRoYXQgZSwgZGF0YSwgYW5kIHZhbHVlIGFyZSBhbGwgZGVmaW5lZFxuICAgICAgICovXG5cbiAgICAgIHZhciBfcmVmID0gKChlIHx8IHt9KS5kYXRhIHx8IHt9KS52YWx1ZSB8fCB7fSxcbiAgICAgICAgICBkYXRhID0gX3JlZi5kYXRhLFxuICAgICAgICAgIG5hbWUgPSBfcmVmLm5hbWU7XG5cbiAgICAgIGlmIChlLmRhdGEucG9zdG1hdGUgPT09ICdlbWl0Jykge1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgIGxvZyhcIlBhcmVudDogUmVjZWl2ZWQgZXZlbnQgZW1pc3Npb246IFwiICsgbmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmFtZSBpbiBfdGhpcy5ldmVudHMpIHtcbiAgICAgICAgICBfdGhpcy5ldmVudHNbbmFtZV0uY2FsbChfdGhpcywgZGF0YSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5wYXJlbnQuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMubGlzdGVuZXIsIGZhbHNlKTtcblxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBsb2coJ1BhcmVudDogQXdhaXRpbmcgZXZlbnQgZW1pc3Npb25zIGZyb20gQ2hpbGQnKTtcbiAgICB9XG4gIH1cblxuICB2YXIgX3Byb3RvID0gUGFyZW50QVBJLnByb3RvdHlwZTtcblxuICBfcHJvdG8uZ2V0ID0gZnVuY3Rpb24gZ2V0KHByb3BlcnR5KSB7XG4gICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICByZXR1cm4gbmV3IFBvc3RtYXRlLlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgIC8vIEV4dHJhY3QgZGF0YSBmcm9tIHJlc3BvbnNlIGFuZCBraWxsIGxpc3RlbmVyc1xuICAgICAgdmFyIHVpZCA9IGdlbmVyYXRlTmV3TWVzc2FnZUlkKCk7XG5cbiAgICAgIHZhciB0cmFuc2FjdCA9IGZ1bmN0aW9uIHRyYW5zYWN0KGUpIHtcbiAgICAgICAgaWYgKGUuZGF0YS51aWQgPT09IHVpZCAmJiBlLmRhdGEucG9zdG1hdGUgPT09ICdyZXBseScpIHtcbiAgICAgICAgICBfdGhpczIucGFyZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0cmFuc2FjdCwgZmFsc2UpO1xuXG4gICAgICAgICAgcmVzb2x2ZShlLmRhdGEudmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9OyAvLyBQcmVwYXJlIGZvciByZXNwb25zZSBmcm9tIENoaWxkLi4uXG5cblxuICAgICAgX3RoaXMyLnBhcmVudC5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdHJhbnNhY3QsIGZhbHNlKTsgLy8gVGhlbiBhc2sgY2hpbGQgZm9yIGluZm9ybWF0aW9uXG5cblxuICAgICAgX3RoaXMyLmNoaWxkLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgcG9zdG1hdGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgdHlwZTogbWVzc2FnZVR5cGUsXG4gICAgICAgIHByb3BlcnR5OiBwcm9wZXJ0eSxcbiAgICAgICAgdWlkOiB1aWRcbiAgICAgIH0sIF90aGlzMi5jaGlsZE9yaWdpbik7XG4gICAgfSk7XG4gIH07XG5cbiAgX3Byb3RvLmNhbGwgPSBmdW5jdGlvbiBjYWxsKHByb3BlcnR5LCBkYXRhKSB7XG4gICAgLy8gU2VuZCBpbmZvcm1hdGlvbiB0byB0aGUgY2hpbGRcbiAgICB0aGlzLmNoaWxkLnBvc3RNZXNzYWdlKHtcbiAgICAgIHBvc3RtYXRlOiAnY2FsbCcsXG4gICAgICB0eXBlOiBtZXNzYWdlVHlwZSxcbiAgICAgIHByb3BlcnR5OiBwcm9wZXJ0eSxcbiAgICAgIGRhdGE6IGRhdGFcbiAgICB9LCB0aGlzLmNoaWxkT3JpZ2luKTtcbiAgfTtcblxuICBfcHJvdG8ub24gPSBmdW5jdGlvbiBvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5ldmVudHNbZXZlbnROYW1lXSA9IGNhbGxiYWNrO1xuICB9O1xuXG4gIF9wcm90by5kZXN0cm95ID0gZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgbG9nKCdQYXJlbnQ6IERlc3Ryb3lpbmcgUG9zdG1hdGUgaW5zdGFuY2UnKTtcbiAgICB9XG5cbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMubGlzdGVuZXIsIGZhbHNlKTtcbiAgICB0aGlzLmZyYW1lLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5mcmFtZSk7XG4gIH07XG5cbiAgcmV0dXJuIFBhcmVudEFQSTtcbn0oKTtcbi8qKlxuICogQ29tcG9zZXMgYW4gQVBJIHRvIGJlIHVzZWQgYnkgdGhlIGNoaWxkXG4gKiBAcGFyYW0ge09iamVjdH0gaW5mbyBJbmZvcm1hdGlvbiBvbiB0aGUgY29uc3VtZXJcbiAqL1xuXG52YXIgQ2hpbGRBUEkgPVxuLyojX19QVVJFX18qL1xuZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBDaGlsZEFQSShpbmZvKSB7XG4gICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICB0aGlzLm1vZGVsID0gaW5mby5tb2RlbDtcbiAgICB0aGlzLnBhcmVudCA9IGluZm8ucGFyZW50O1xuICAgIHRoaXMucGFyZW50T3JpZ2luID0gaW5mby5wYXJlbnRPcmlnaW47XG4gICAgdGhpcy5jaGlsZCA9IGluZm8uY2hpbGQ7XG5cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgbG9nKCdDaGlsZDogUmVnaXN0ZXJpbmcgQVBJJyk7XG4gICAgICBsb2coJ0NoaWxkOiBBd2FpdGluZyBtZXNzYWdlcy4uLicpO1xuICAgIH1cblxuICAgIHRoaXMuY2hpbGQuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoIXNhbml0aXplKGUsIF90aGlzMy5wYXJlbnRPcmlnaW4pKSByZXR1cm47XG5cbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgIGxvZygnQ2hpbGQ6IFJlY2VpdmVkIHJlcXVlc3QnLCBlLmRhdGEpO1xuICAgICAgfVxuXG4gICAgICB2YXIgX2UkZGF0YSA9IGUuZGF0YSxcbiAgICAgICAgICBwcm9wZXJ0eSA9IF9lJGRhdGEucHJvcGVydHksXG4gICAgICAgICAgdWlkID0gX2UkZGF0YS51aWQsXG4gICAgICAgICAgZGF0YSA9IF9lJGRhdGEuZGF0YTtcblxuICAgICAgaWYgKGUuZGF0YS5wb3N0bWF0ZSA9PT0gJ2NhbGwnKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0eSBpbiBfdGhpczMubW9kZWwgJiYgdHlwZW9mIF90aGlzMy5tb2RlbFtwcm9wZXJ0eV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBfdGhpczMubW9kZWxbcHJvcGVydHldKGRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSAvLyBSZXBseSB0byBQYXJlbnRcblxuXG4gICAgICByZXNvbHZlVmFsdWUoX3RoaXMzLm1vZGVsLCBwcm9wZXJ0eSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGUuc291cmNlLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICBwcm9wZXJ0eTogcHJvcGVydHksXG4gICAgICAgICAgcG9zdG1hdGU6ICdyZXBseScsXG4gICAgICAgICAgdHlwZTogbWVzc2FnZVR5cGUsXG4gICAgICAgICAgdWlkOiB1aWQsXG4gICAgICAgICAgdmFsdWU6IHZhbHVlXG4gICAgICAgIH0sIGUub3JpZ2luKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgdmFyIF9wcm90bzIgPSBDaGlsZEFQSS5wcm90b3R5cGU7XG5cbiAgX3Byb3RvMi5lbWl0ID0gZnVuY3Rpb24gZW1pdChuYW1lLCBkYXRhKSB7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGxvZyhcIkNoaWxkOiBFbWl0dGluZyBFdmVudCBcXFwiXCIgKyBuYW1lICsgXCJcXFwiXCIsIGRhdGEpO1xuICAgIH1cblxuICAgIHRoaXMucGFyZW50LnBvc3RNZXNzYWdlKHtcbiAgICAgIHBvc3RtYXRlOiAnZW1pdCcsXG4gICAgICB0eXBlOiBtZXNzYWdlVHlwZSxcbiAgICAgIHZhbHVlOiB7XG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIGRhdGE6IGRhdGFcbiAgICAgIH1cbiAgICB9LCB0aGlzLnBhcmVudE9yaWdpbik7XG4gIH07XG5cbiAgcmV0dXJuIENoaWxkQVBJO1xufSgpO1xuLyoqXG4gICogVGhlIGVudHJ5IHBvaW50IG9mIHRoZSBQYXJlbnQuXG4gKiBAdHlwZSB7Q2xhc3N9XG4gKi9cblxudmFyIFBvc3RtYXRlID1cbi8qI19fUFVSRV9fKi9cbmZ1bmN0aW9uICgpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuICAvLyBJbnRlcm5ldCBFeHBsb3JlciBjcmFwcyBpdHNlbGZcblxuICAvKipcbiAgICogU2V0cyBvcHRpb25zIHJlbGF0ZWQgdG8gdGhlIFBhcmVudFxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBlbGVtZW50IHRvIGluamVjdCB0aGUgZnJhbWUgaW50bywgYW5kIHRoZSB1cmxcbiAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICovXG4gIGZ1bmN0aW9uIFBvc3RtYXRlKF9yZWYyKSB7XG4gICAgdmFyIF9yZWYyJGNvbnRhaW5lciA9IF9yZWYyLmNvbnRhaW5lcixcbiAgICAgICAgY29udGFpbmVyID0gX3JlZjIkY29udGFpbmVyID09PSB2b2lkIDAgPyB0eXBlb2YgY29udGFpbmVyICE9PSAndW5kZWZpbmVkJyA/IGNvbnRhaW5lciA6IGRvY3VtZW50LmJvZHkgOiBfcmVmMiRjb250YWluZXIsXG4gICAgICAgIG1vZGVsID0gX3JlZjIubW9kZWwsXG4gICAgICAgIHVybCA9IF9yZWYyLnVybCxcbiAgICAgICAgbmFtZSA9IF9yZWYyLm5hbWUsXG4gICAgICAgIF9yZWYyJGNsYXNzTGlzdEFycmF5ID0gX3JlZjIuY2xhc3NMaXN0QXJyYXksXG4gICAgICAgIGNsYXNzTGlzdEFycmF5ID0gX3JlZjIkY2xhc3NMaXN0QXJyYXkgPT09IHZvaWQgMCA/IFtdIDogX3JlZjIkY2xhc3NMaXN0QXJyYXk7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuICAgIHRoaXMucGFyZW50ID0gd2luZG93O1xuICAgIHRoaXMuZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICB0aGlzLmZyYW1lLm5hbWUgPSBuYW1lIHx8ICcnO1xuICAgIHRoaXMuZnJhbWUuY2xhc3NMaXN0LmFkZC5hcHBseSh0aGlzLmZyYW1lLmNsYXNzTGlzdCwgY2xhc3NMaXN0QXJyYXkpO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmZyYW1lKTtcbiAgICB0aGlzLmNoaWxkID0gdGhpcy5mcmFtZS5jb250ZW50V2luZG93IHx8IHRoaXMuZnJhbWUuY29udGVudERvY3VtZW50LnBhcmVudFdpbmRvdztcbiAgICB0aGlzLm1vZGVsID0gbW9kZWwgfHwge307XG4gICAgcmV0dXJuIHRoaXMuc2VuZEhhbmRzaGFrZSh1cmwpO1xuICB9XG4gIC8qKlxuICAgKiBCZWdpbnMgdGhlIGhhbmRzaGFrZSBzdHJhdGVneVxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IHVybCBUaGUgVVJMIHRvIHNlbmQgYSBoYW5kc2hha2UgcmVxdWVzdCB0b1xuICAgKiBAcmV0dXJuIHtQcm9taXNlfSAgICAgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGhhbmRzaGFrZSBpcyBjb21wbGV0ZVxuICAgKi9cblxuXG4gIHZhciBfcHJvdG8zID0gUG9zdG1hdGUucHJvdG90eXBlO1xuXG4gIF9wcm90bzMuc2VuZEhhbmRzaGFrZSA9IGZ1bmN0aW9uIHNlbmRIYW5kc2hha2UodXJsKSB7XG4gICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICB2YXIgY2hpbGRPcmlnaW4gPSByZXNvbHZlT3JpZ2luKHVybCk7XG4gICAgdmFyIGF0dGVtcHQgPSAwO1xuICAgIHZhciByZXNwb25zZUludGVydmFsO1xuICAgIHJldHVybiBuZXcgUG9zdG1hdGUuUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgcmVwbHkgPSBmdW5jdGlvbiByZXBseShlKSB7XG4gICAgICAgIGlmICghc2FuaXRpemUoZSwgY2hpbGRPcmlnaW4pKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgaWYgKGUuZGF0YS5wb3N0bWF0ZSA9PT0gJ2hhbmRzaGFrZS1yZXBseScpIHtcbiAgICAgICAgICBjbGVhckludGVydmFsKHJlc3BvbnNlSW50ZXJ2YWwpO1xuXG4gICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgIGxvZygnUGFyZW50OiBSZWNlaXZlZCBoYW5kc2hha2UgcmVwbHkgZnJvbSBDaGlsZCcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIF90aGlzNC5wYXJlbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHJlcGx5LCBmYWxzZSk7XG5cbiAgICAgICAgICBfdGhpczQuY2hpbGRPcmlnaW4gPSBlLm9yaWdpbjtcblxuICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgICBsb2coJ1BhcmVudDogU2F2aW5nIENoaWxkIG9yaWdpbicsIF90aGlzNC5jaGlsZE9yaWdpbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUobmV3IFBhcmVudEFQSShfdGhpczQpKTtcbiAgICAgICAgfSAvLyBNaWdodCBuZWVkIHRvIHJlbW92ZSBzaW5jZSBwYXJlbnQgbWlnaHQgYmUgcmVjZWl2aW5nIGRpZmZlcmVudCBtZXNzYWdlc1xuICAgICAgICAvLyBmcm9tIGRpZmZlcmVudCBob3N0c1xuXG5cbiAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICBsb2coJ1BhcmVudDogSW52YWxpZCBoYW5kc2hha2UgcmVwbHknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZWplY3QoJ0ZhaWxlZCBoYW5kc2hha2UnKTtcbiAgICAgIH07XG5cbiAgICAgIF90aGlzNC5wYXJlbnQuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHJlcGx5LCBmYWxzZSk7XG5cbiAgICAgIHZhciBkb1NlbmQgPSBmdW5jdGlvbiBkb1NlbmQoKSB7XG4gICAgICAgIGF0dGVtcHQrKztcblxuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgIGxvZyhcIlBhcmVudDogU2VuZGluZyBoYW5kc2hha2UgYXR0ZW1wdCBcIiArIGF0dGVtcHQsIHtcbiAgICAgICAgICAgIGNoaWxkT3JpZ2luOiBjaGlsZE9yaWdpblxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgX3RoaXM0LmNoaWxkLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICBwb3N0bWF0ZTogJ2hhbmRzaGFrZScsXG4gICAgICAgICAgdHlwZTogbWVzc2FnZVR5cGUsXG4gICAgICAgICAgbW9kZWw6IF90aGlzNC5tb2RlbFxuICAgICAgICB9LCBjaGlsZE9yaWdpbik7XG5cbiAgICAgICAgaWYgKGF0dGVtcHQgPT09IG1heEhhbmRzaGFrZVJlcXVlc3RzKSB7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbChyZXNwb25zZUludGVydmFsKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIGxvYWRlZCA9IGZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICAgICAgZG9TZW5kKCk7XG4gICAgICAgIHJlc3BvbnNlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChkb1NlbmQsIDUwMCk7XG4gICAgICB9O1xuXG4gICAgICBpZiAoX3RoaXM0LmZyYW1lLmF0dGFjaEV2ZW50KSB7XG4gICAgICAgIF90aGlzNC5mcmFtZS5hdHRhY2hFdmVudCgnb25sb2FkJywgbG9hZGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF90aGlzNC5mcmFtZS5vbmxvYWQgPSBsb2FkZWQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgIGxvZygnUGFyZW50OiBMb2FkaW5nIGZyYW1lJywge1xuICAgICAgICAgIHVybDogdXJsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBfdGhpczQuZnJhbWUuc3JjID0gdXJsO1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBQb3N0bWF0ZTtcbn0oKTtcbi8qKlxuICogVGhlIGVudHJ5IHBvaW50IG9mIHRoZSBDaGlsZFxuICogQHR5cGUge0NsYXNzfVxuICovXG5cblxuUG9zdG1hdGUuZGVidWcgPSBmYWxzZTtcblxuUG9zdG1hdGUuUHJvbWlzZSA9IGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gd2luZG93ID8gd2luZG93LlByb21pc2UgOiBQcm9taXNlO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn0oKTtcblxuUG9zdG1hdGUuTW9kZWwgPVxuLyojX19QVVJFX18qL1xuZnVuY3Rpb24gKCkge1xuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGNoaWxkLCBtb2RlbCwgcGFyZW50LCBhbmQgcmVzcG9uZHMgdG8gdGhlIFBhcmVudHMgaGFuZHNoYWtlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBtb2RlbCBIYXNoIG9mIHZhbHVlcywgZnVuY3Rpb25zLCBvciBwcm9taXNlc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlfSAgICAgICBUaGUgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGhhbmRzaGFrZSBoYXMgYmVlbiByZWNlaXZlZFxuICAgKi9cbiAgZnVuY3Rpb24gTW9kZWwobW9kZWwpIHtcbiAgICB0aGlzLmNoaWxkID0gd2luZG93O1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcbiAgICB0aGlzLnBhcmVudCA9IHRoaXMuY2hpbGQucGFyZW50O1xuICAgIHJldHVybiB0aGlzLnNlbmRIYW5kc2hha2VSZXBseSgpO1xuICB9XG4gIC8qKlxuICAgKiBSZXNwb25kcyB0byBhIGhhbmRzaGFrZSBpbml0aWF0ZWQgYnkgdGhlIFBhcmVudFxuICAgKiBAcmV0dXJuIHtQcm9taXNlfSBSZXNvbHZlcyBhbiBvYmplY3QgdGhhdCBleHBvc2VzIGFuIEFQSSBmb3IgdGhlIENoaWxkXG4gICAqL1xuXG5cbiAgdmFyIF9wcm90bzQgPSBNb2RlbC5wcm90b3R5cGU7XG5cbiAgX3Byb3RvNC5zZW5kSGFuZHNoYWtlUmVwbHkgPSBmdW5jdGlvbiBzZW5kSGFuZHNoYWtlUmVwbHkoKSB7XG4gICAgdmFyIF90aGlzNSA9IHRoaXM7XG5cbiAgICByZXR1cm4gbmV3IFBvc3RtYXRlLlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIHNoYWtlID0gZnVuY3Rpb24gc2hha2UoZSkge1xuICAgICAgICBpZiAoIWUuZGF0YS5wb3N0bWF0ZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlLmRhdGEucG9zdG1hdGUgPT09ICdoYW5kc2hha2UnKSB7XG4gICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgIGxvZygnQ2hpbGQ6IFJlY2VpdmVkIGhhbmRzaGFrZSBmcm9tIFBhcmVudCcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIF90aGlzNS5jaGlsZC5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgc2hha2UsIGZhbHNlKTtcblxuICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgICBsb2coJ0NoaWxkOiBTZW5kaW5nIGhhbmRzaGFrZSByZXBseSB0byBQYXJlbnQnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlLnNvdXJjZS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBwb3N0bWF0ZTogJ2hhbmRzaGFrZS1yZXBseScsXG4gICAgICAgICAgICB0eXBlOiBtZXNzYWdlVHlwZVxuICAgICAgICAgIH0sIGUub3JpZ2luKTtcbiAgICAgICAgICBfdGhpczUucGFyZW50T3JpZ2luID0gZS5vcmlnaW47IC8vIEV4dGVuZCBtb2RlbCB3aXRoIHRoZSBvbmUgcHJvdmlkZWQgYnkgdGhlIHBhcmVudFxuXG4gICAgICAgICAgdmFyIGRlZmF1bHRzID0gZS5kYXRhLm1vZGVsO1xuXG4gICAgICAgICAgaWYgKGRlZmF1bHRzKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhkZWZhdWx0cykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgIF90aGlzNS5tb2RlbFtrZXldID0gZGVmYXVsdHNba2V5XTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgICAgICBsb2coJ0NoaWxkOiBJbmhlcml0ZWQgYW5kIGV4dGVuZGVkIG1vZGVsIGZyb20gUGFyZW50Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgIGxvZygnQ2hpbGQ6IFNhdmluZyBQYXJlbnQgb3JpZ2luJywgX3RoaXM1LnBhcmVudE9yaWdpbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUobmV3IENoaWxkQVBJKF90aGlzNSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlamVjdCgnSGFuZHNoYWtlIFJlcGx5IEZhaWxlZCcpO1xuICAgICAgfTtcblxuICAgICAgX3RoaXM1LmNoaWxkLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBzaGFrZSwgZmFsc2UpO1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBNb2RlbDtcbn0oKTtcblxuZXhwb3J0IGRlZmF1bHQgUG9zdG1hdGU7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiaW1wb3J0IHsgX19hc3NpZ24gfSBmcm9tIFwidHNsaWJcIjtcbmltcG9ydCB7IGRvdENhc2UgfSBmcm9tIFwiZG90LWNhc2VcIjtcbmV4cG9ydCBmdW5jdGlvbiBzbmFrZUNhc2UoaW5wdXQsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgIHJldHVybiBkb3RDYXNlKGlucHV0LCBfX2Fzc2lnbih7IGRlbGltaXRlcjogXCJfXCIgfSwgb3B0aW9ucykpO1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiaW1wb3J0IFBvc3RtYXRlIGZyb20gJ3Bvc3RtYXRlJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMyc7XG5pbXBvcnQgRGVidWcgZnJvbSAnZGVidWcnO1xuaW1wb3J0IHsgZGVmZXJyZWQgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgTFNQbHVnaW5TaGFkb3dGcmFtZSB9IGZyb20gJy4vTFNQbHVnaW4uc2hhZG93JztcbmNvbnN0IGRlYnVnID0gRGVidWcoJ0xTUGx1Z2luOmNhbGxlcicpO1xuZXhwb3J0IGNvbnN0IEZMQUdfQVdBSVQgPSAnI2F3YWl0I3Jlc3BvbnNlIyc7XG5leHBvcnQgY29uc3QgTFNQTVNHID0gJyNsc3Btc2cjJztcbmV4cG9ydCBjb25zdCBMU1BNU0dfRVJST1JfVEFHID0gJyNsc3Btc2cjZXJyb3IjJztcbmV4cG9ydCBjb25zdCBMU1BNU0dfU0VUVElOR1MgPSAnI2xzcG1zZyNzZXR0aW5ncyMnO1xuZXhwb3J0IGNvbnN0IExTUE1TR19CRUZPUkVfVU5MT0FEID0gJyNsc3Btc2cjYmVmb3JldW5sb2FkIyc7XG5leHBvcnQgY29uc3QgTFNQTVNHX1NZTkMgPSAnI2xzcG1zZyNyZXBseSMnO1xuZXhwb3J0IGNvbnN0IExTUE1TR19SRUFEWSA9ICcjbHNwbXNnI3JlYWR5Iyc7XG5leHBvcnQgY29uc3QgTFNQTVNHRm4gPSAoaWQpID0+IGAke0xTUE1TR30ke2lkfWA7XG5leHBvcnQgY29uc3QgQVdBSVRfTFNQTVNHRm4gPSAoaWQpID0+IGAke0ZMQUdfQVdBSVR9JHtpZH1gO1xuLyoqXG4gKiBDYWxsIGJldHdlZW4gY29yZSBhbmQgdXNlclxuICovXG5jbGFzcyBMU1BsdWdpbkNhbGxlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IoX3BsdWdpbkxvY2FsKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX3BsdWdpbkxvY2FsID0gX3BsdWdpbkxvY2FsO1xuICAgICAgICB0aGlzLl9jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fdXNlck1vZGVsID0ge307XG4gICAgICAgIHRoaXMuX2RlYnVnVGFnID0gJyc7XG4gICAgICAgIGlmIChfcGx1Z2luTG9jYWwpIHtcbiAgICAgICAgICAgIHRoaXMuX2RlYnVnVGFnID0gX3BsdWdpbkxvY2FsLmRlYnVnVGFnO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGNvbm5lY3RUb0NoaWxkKCkge1xuICAgICAgICBpZiAodGhpcy5fY29ubmVjdGVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB7IHNoYWRvdyB9ID0gdGhpcy5fcGx1Z2luTG9jYWw7XG4gICAgICAgIGlmIChzaGFkb3cpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3NldHVwU2hhZG93U2FuZGJveCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fc2V0dXBJZnJhbWVTYW5kYm94KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgY29ubmVjdFRvUGFyZW50KHVzZXJNb2RlbCA9IHt9KSB7XG4gICAgICAgIGlmICh0aGlzLl9jb25uZWN0ZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGNhbGxlciA9IHRoaXM7XG4gICAgICAgIGNvbnN0IGlzU2hhZG93TW9kZSA9IHRoaXMuX3BsdWdpbkxvY2FsICE9IG51bGw7XG4gICAgICAgIGxldCBzeW5jR0NUaW1lciA9IDA7XG4gICAgICAgIGxldCBzeW5jVGFnID0gMDtcbiAgICAgICAgY29uc3Qgc3luY0FjdG9ycyA9IG5ldyBNYXAoKTtcbiAgICAgICAgY29uc3QgcmVhZHlEZWZlcnJlZCA9IGRlZmVycmVkKDEwMDAgKiA1KTtcbiAgICAgICAgY29uc3QgbW9kZWwgPSB0aGlzLl9leHRlbmRVc2VyTW9kZWwoe1xuICAgICAgICAgICAgW0xTUE1TR19SRUFEWV06IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBhd2FpdCByZWFkeURlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbTFNQTVNHX0JFRk9SRV9VTkxPQURdOiBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdG9yID0gZGVmZXJyZWQoMTAgKiAxMDAwKTtcbiAgICAgICAgICAgICAgICBjYWxsZXIuZW1pdCgnYmVmb3JldW5sb2FkJywgT2JqZWN0LmFzc2lnbih7IGFjdG9yIH0sIGUpKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBhY3Rvci5wcm9taXNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFtMU1BNU0dfU0VUVElOR1NdOiBhc3luYyAoeyB0eXBlLCBwYXlsb2FkIH0pID0+IHtcbiAgICAgICAgICAgICAgICBjYWxsZXIuZW1pdCgnc2V0dGluZ3M6Y2hhbmdlZCcsIHBheWxvYWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFtMU1BNU0ddOiBhc3luYyAoeyBucywgdHlwZSwgcGF5bG9hZCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgZGVidWcoYCR7dGhpcy5fZGVidWdUYWd9IFtjYWxsIGZyb20gaG9zdF1gLCBucywgdHlwZSwgcGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgaWYgKG5zICYmIG5zLnN0YXJ0c1dpdGgoJ2hvb2snKSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsZXIuZW1pdChgJHtuc306JHt0eXBlfWAsIHBheWxvYWQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbGxlci5lbWl0KHR5cGUsIHBheWxvYWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFtMU1BNU0dfU1lOQ106ICh7IF9zeW5jLCByZXN1bHQgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGRlYnVnKGBzeW5jIHJlcGx5ICMke19zeW5jfWAsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgaWYgKHN5bmNBY3RvcnMuaGFzKF9zeW5jKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3RvciA9IHN5bmNBY3RvcnMuZ2V0KF9zeW5jKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0Py5oYXNPd25Qcm9wZXJ0eShMU1BNU0dfRVJST1JfVEFHKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdG9yLnJlamVjdChyZXN1bHRbTFNQTVNHX0VSUk9SX1RBR10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0b3IucmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3luY0FjdG9ycy5kZWxldGUoX3N5bmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC4uLnVzZXJNb2RlbFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGlzU2hhZG93TW9kZSkge1xuICAgICAgICAgICAgYXdhaXQgcmVhZHlEZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhpcy5fcGx1Z2luTG9jYWw/LnRvSlNPTigpKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaGFuZHNoYWtlID0gbmV3IFBvc3RtYXRlLk1vZGVsKG1vZGVsKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gJ3BlbmRpbmcnO1xuICAgICAgICBhd2FpdCBoYW5kc2hha2UudGhlbihyZWZQYXJlbnQgPT4ge1xuICAgICAgICAgICAgdGhpcy5fY2hpbGQgPSByZWZQYXJlbnQ7XG4gICAgICAgICAgICB0aGlzLl9jb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fY2FsbCA9IGFzeW5jICh0eXBlLCBwYXlsb2FkID0ge30sIGFjdG9yKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhZyA9ICsrc3luY1RhZztcbiAgICAgICAgICAgICAgICAgICAgc3luY0FjdG9ycy5zZXQodGFnLCBhY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIHBheWxvYWQuX3N5bmMgPSB0YWc7XG4gICAgICAgICAgICAgICAgICAgIGFjdG9yLnNldFRhZyhgYXN5bmMgY2FsbCAjJHt0YWd9YCk7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKCdhc3luYyBjYWxsICMnLCB0YWcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZWZQYXJlbnQuZW1pdChMU1BNU0dGbihtb2RlbC5iYXNlSW5mby5pZCksIHsgdHlwZSwgcGF5bG9hZCB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0b3I/LnByb21pc2U7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5fY2FsbFVzZXJNb2RlbCA9IGFzeW5jICh0eXBlLCBwYXlsb2FkKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbW9kZWxbdHlwZV0ocGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGBtb2RlbCBtZXRob2QgIyR7dHlwZX0gbm90IGV4aXN0ZWRgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gYWN0b3JzIEdDXG4gICAgICAgICAgICBzeW5jR0NUaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3luY0FjdG9ycy5zaXplID4gMTAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIHN5bmNBY3RvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2LnNldHRsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeW5jQWN0b3JzLmRlbGV0ZShrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMDAgKiA2MCAqIDMwKTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCByZWFkeURlZmVycmVkLnByb21pc2U7XG4gICAgICAgIHJldHVybiBtb2RlbC5iYXNlSW5mbztcbiAgICB9XG4gICAgYXN5bmMgY2FsbCh0eXBlLCBwYXlsb2FkID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NhbGw/LmNhbGwodGhpcywgdHlwZSwgcGF5bG9hZCk7XG4gICAgfVxuICAgIGFzeW5jIGNhbGxBc3luYyh0eXBlLCBwYXlsb2FkID0ge30pIHtcbiAgICAgICAgY29uc3QgYWN0b3IgPSBkZWZlcnJlZCgxMDAwICogMTApO1xuICAgICAgICByZXR1cm4gdGhpcy5fY2FsbD8uY2FsbCh0aGlzLCB0eXBlLCBwYXlsb2FkLCBhY3Rvcik7XG4gICAgfVxuICAgIGFzeW5jIGNhbGxVc2VyTW9kZWwodHlwZSwgcGF5bG9hZCA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jYWxsVXNlck1vZGVsPy5jYWxsKHRoaXMsIHR5cGUsIHBheWxvYWQpO1xuICAgIH1cbiAgICBhc3luYyBfc2V0dXBJZnJhbWVTYW5kYm94KCkge1xuICAgICAgICBjb25zdCBwbCA9IHRoaXMuX3BsdWdpbkxvY2FsO1xuICAgICAgICBjb25zdCBoYW5kc2hha2UgPSBuZXcgUG9zdG1hdGUoe1xuICAgICAgICAgICAgY29udGFpbmVyOiBkb2N1bWVudC5ib2R5LFxuICAgICAgICAgICAgdXJsOiBwbC5vcHRpb25zLmVudHJ5LFxuICAgICAgICAgICAgY2xhc3NMaXN0QXJyYXk6IFsnbHNwLWlmcmFtZS1zYW5kYm94J10sXG4gICAgICAgICAgICBtb2RlbDogeyBiYXNlSW5mbzogSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShwbC50b0pTT04oKSkpIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9ICdwZW5kaW5nJztcbiAgICAgICAgLy8gdGltZW91dCBmb3IgaGFuZHNoYWtlXG4gICAgICAgIGxldCB0aW1lcjtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgaGFuZHNoYWtlIFRpbWVvdXRgKSk7XG4gICAgICAgICAgICB9LCAzICogMTAwMCk7IC8vIDNzZWNzXG4gICAgICAgICAgICBoYW5kc2hha2UudGhlbihyZWZDaGlsZCA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyZW50ID0gcmVmQ2hpbGQ7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgICAgIHJlZkNoaWxkLmZyYW1lLnNldEF0dHJpYnV0ZSgnaWQnLCBwbC5pZCk7XG4gICAgICAgICAgICAgICAgcmVmQ2hpbGQub24oTFNQTVNHRm4ocGwuaWQpLCAoeyB0eXBlLCBwYXlsb2FkIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYFtjYWxsIGZyb20gcGx1Z2luXSBgLCB0eXBlLCBwYXlsb2FkKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGx1Z2luTG9jYWw/LmVtaXQodHlwZSwgcGF5bG9hZCB8fCB7fSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2FsbCA9IGFzeW5jICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHBhcmVudCBhbGwgd2lsbCBnZXQgbWVzc2FnZSBiZWZvcmUgaGFuZHNoYWtlZFxuICAgICAgICAgICAgICAgICAgICBhd2FpdCByZWZDaGlsZC5jYWxsKExTUE1TR0ZuKHBsLmlkKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogYXJnc1swXSwgcGF5bG9hZDogT2JqZWN0LmFzc2lnbihhcmdzWzFdIHx8IHt9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCRwaWQ6IHBsLmlkXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhbGxVc2VyTW9kZWwgPSBhc3luYyAodHlwZSwgcGF5bG9hZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZS5zdGFydHNXaXRoKEZMQUdfQVdBSVQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBhdHRhY2ggcGF5bG9hZCB3aXRoIG1ldGhvZCBjYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgcmVmQ2hpbGQuZ2V0KHR5cGUucmVwbGFjZShGTEFHX0FXQUlULCAnJykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVmQ2hpbGQuY2FsbCh0eXBlLCBwYXlsb2FkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICBkZWJ1ZygnaWZyYW1lIHNhbmRib3ggZXJyb3InLCBlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fc3RhdHVzID0gdW5kZWZpbmVkO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgX3NldHVwU2hhZG93U2FuZGJveCgpIHtcbiAgICAgICAgY29uc3QgcGwgPSB0aGlzLl9wbHVnaW5Mb2NhbDtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5fc2hhZG93ID0gbmV3IExTUGx1Z2luU2hhZG93RnJhbWUocGwpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5fc3RhdHVzID0gJ3BlbmRpbmcnO1xuICAgICAgICAgICAgYXdhaXQgc2hhZG93LmxvYWQoKTtcbiAgICAgICAgICAgIHRoaXMuX2Nvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgdGhpcy5fY2FsbCA9IGFzeW5jICh0eXBlLCBwYXlsb2FkID0ge30sIGFjdG9yKSA9PiB7XG4gICAgICAgICAgICAgICAgYWN0b3IgJiYgKHBheWxvYWQuYWN0b3IgPSBhY3Rvcik7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogc3VwcG9ydCBzeW5jIGNhbGxcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIENhbGwgaW4gc2FtZSB0aHJlYWRcbiAgICAgICAgICAgICAgICB0aGlzLl9wbHVnaW5Mb2NhbD8uZW1pdCh0eXBlLCBPYmplY3QuYXNzaWduKHBheWxvYWQsIHtcbiAgICAgICAgICAgICAgICAgICAgJCRwaWQ6IHBsLmlkXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBhY3Rvcj8ucHJvbWlzZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLl9jYWxsVXNlck1vZGVsID0gYXN5bmMgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgdHlwZSA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGU/LnN0YXJ0c1dpdGgoRkxBR19BV0FJVCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHR5cGUucmVwbGFjZShGTEFHX0FXQUlULCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSBhcmdzWzFdIHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGZuID0gdGhpcy5fdXNlck1vZGVsW3R5cGVdO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZm4uY2FsbChudWxsLCBwYXlsb2FkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBkZWJ1Zygnc2hhZG93IHNhbmRib3ggZXJyb3InLCBlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2V4dGVuZFVzZXJNb2RlbChtb2RlbCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih0aGlzLl91c2VyTW9kZWwsIG1vZGVsKTtcbiAgICB9XG4gICAgX2dldFNhbmRib3hJZnJhbWVDb250YWluZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQ/LmZyYW1lO1xuICAgIH1cbiAgICBfZ2V0U2FuZGJveFNoYWRvd0NvbnRhaW5lcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NoYWRvdz8uZnJhbWU7XG4gICAgfVxuICAgIHNldCBkZWJ1Z1RhZyh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9kZWJ1Z1RhZyA9IHZhbHVlO1xuICAgIH1cbiAgICBhc3luYyBkZXN0cm95KCkge1xuICAgICAgICBpZiAodGhpcy5fcGFyZW50KSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9wYXJlbnQuZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zaGFkb3cpIHtcbiAgICAgICAgICAgIHRoaXMuX3NoYWRvdy5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgeyBMU1BsdWdpbkNhbGxlciB9O1xuIiwiaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJztcbmltcG9ydCB7IExTUGx1Z2luVXNlciB9IGZyb20gJy4vTFNQbHVnaW4udXNlcic7XG4vLyBAdHMtaWdub3JlXG5jb25zdCB7IGltcG9ydEhUTUwsIGNyZWF0ZVNhbmRib3hDb250YWluZXIgfSA9IHdpbmRvdy5RU2FuZGJveCB8fCB7fTtcbmZ1bmN0aW9uIHVzZXJGZXRjaCh1cmwsIG9wdHMpIHtcbiAgICBpZiAoIXVybC5zdGFydHNXaXRoKCdodHRwJykpIHtcbiAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UoJ2ZpbGU6Ly8nLCAnJyk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB3aW5kb3cuYXBpcy5kb0FjdGlvbihbJ3JlYWRGaWxlJywgdXJsXSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHRleHQoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBmZXRjaCh1cmwsIG9wdHMpO1xufVxuY2xhc3MgTFNQbHVnaW5TaGFkb3dGcmFtZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IoX3BsdWdpbkxvY2FsKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX3BsdWdpbkxvY2FsID0gX3BsdWdpbkxvY2FsO1xuICAgICAgICB0aGlzLl9sb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fdW5tb3VudEZucyA9IFtdO1xuICAgICAgICBfcGx1Z2luTG9jYWwuX2Rpc3Bvc2UoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdW5tb3VudCgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZCgpIHtcbiAgICAgICAgY29uc3QgeyBuYW1lLCBlbnRyeSB9ID0gdGhpcy5fcGx1Z2luTG9jYWwub3B0aW9ucztcbiAgICAgICAgaWYgKHRoaXMubG9hZGVkIHx8ICFlbnRyeSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgeyB0ZW1wbGF0ZSwgZXhlY1NjcmlwdHMgfSA9IGF3YWl0IGltcG9ydEhUTUwoZW50cnksIHsgZmV0Y2g6IHVzZXJGZXRjaCB9KTtcbiAgICAgICAgdGhpcy5fbW91bnQodGVtcGxhdGUsIGRvY3VtZW50LmJvZHkpO1xuICAgICAgICBjb25zdCBzYW5kYm94ID0gY3JlYXRlU2FuZGJveENvbnRhaW5lcihuYW1lLCB7XG4gICAgICAgICAgICBlbGVtZW50R2V0dGVyOiAoKSA9PiB0aGlzLl9yb290Py5maXJzdENoaWxkLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZ2xvYmFsID0gc2FuZGJveC5pbnN0YW5jZS5wcm94eTtcbiAgICAgICAgZ2xvYmFsLl9fc2hhZG93X21vZGVfXyA9IHRydWU7XG4gICAgICAgIGdsb2JhbC5MU1BsdWdpbkxvY2FsID0gdGhpcy5fcGx1Z2luTG9jYWw7XG4gICAgICAgIGdsb2JhbC5MU1BsdWdpblNoYWRvdyA9IHRoaXM7XG4gICAgICAgIGdsb2JhbC5MU1BsdWdpblVzZXIgPSBnbG9iYWwubG9nc2VxID0gbmV3IExTUGx1Z2luVXNlcih0aGlzLl9wbHVnaW5Mb2NhbC50b0pTT04oKSwgdGhpcy5fcGx1Z2luTG9jYWwuY2FsbGVyKTtcbiAgICAgICAgLy8gVE9ETzoge21vdW50LCB1bm1vdW50fVxuICAgICAgICBjb25zdCBleGVjUmVzdWx0ID0gYXdhaXQgZXhlY1NjcmlwdHMoZ2xvYmFsLCB0cnVlKTtcbiAgICAgICAgdGhpcy5fdW5tb3VudEZucy5wdXNoKGV4ZWNSZXN1bHQudW5tb3VudCk7XG4gICAgICAgIHRoaXMuX2xvYWRlZCA9IHRydWU7XG4gICAgfVxuICAgIF9tb3VudChjb250ZW50LCBjb250YWluZXIpIHtcbiAgICAgICAgY29uc3QgZnJhbWUgPSB0aGlzLl9mcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBmcmFtZS5jbGFzc0xpc3QuYWRkKCdsc3Atc2hhZG93LXNhbmRib3gnKTtcbiAgICAgICAgZnJhbWUuaWQgPSB0aGlzLl9wbHVnaW5Mb2NhbC5pZDtcbiAgICAgICAgdGhpcy5fcm9vdCA9IGZyYW1lLmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcbiAgICAgICAgdGhpcy5fcm9vdC5pbm5lckhUTUwgPSBgPGRpdj4ke2NvbnRlbnR9PC9kaXY+YDtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGZyYW1lKTtcbiAgICAgICAgdGhpcy5lbWl0KCdtb3VudGVkJyk7XG4gICAgfVxuICAgIF91bm1vdW50KCkge1xuICAgICAgICBmb3IgKGNvbnN0IGZuIG9mIHRoaXMuX3VubW91bnRGbnMpIHtcbiAgICAgICAgICAgIGZuICYmIGZuLmNhbGwobnVsbCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5mcmFtZT8ucGFyZW50Tm9kZT8ucmVtb3ZlQ2hpbGQodGhpcy5mcmFtZSk7XG4gICAgfVxuICAgIGdldCBsb2FkZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkZWQ7XG4gICAgfVxuICAgIGdldCBkb2N1bWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jvb3Q/LmZpcnN0Q2hpbGQ7XG4gICAgfVxuICAgIGdldCBmcmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZyYW1lO1xuICAgIH1cbn1cbmV4cG9ydCB7IExTUGx1Z2luU2hhZG93RnJhbWUgfTtcbiIsImV4cG9ydCB7fTtcbiIsImltcG9ydCB7IGRlZXBNZXJnZSB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBMU1BsdWdpbkNhbGxlciB9IGZyb20gJy4vTFNQbHVnaW4uY2FsbGVyJztcbmltcG9ydCBEZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5pbXBvcnQgeyBzbmFrZUNhc2UgfSBmcm9tICdzbmFrZS1jYXNlJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMyc7XG5pbXBvcnQgeyBMU1BsdWdpbkZpbGVTdG9yYWdlIH0gZnJvbSAnLi9tb2R1bGVzL0xTUGx1Z2luLlN0b3JhZ2UnO1xuY29uc3QgUFJPWFlfQ09OVElOVUUgPSBTeW1ib2wuZm9yKCdwcm94eS1jb250aW51ZScpO1xuY29uc3QgZGVidWcgPSBEZWJ1ZygnTFNQbHVnaW46dXNlcicpO1xuLyoqXG4gKiBAcGFyYW0gdHlwZVxuICogQHBhcmFtIG9wdHNcbiAqIEBwYXJhbSBhY3Rpb25cbiAqL1xuZnVuY3Rpb24gcmVnaXN0ZXJTaW1wbGVDb21tYW5kKHR5cGUsIG9wdHMsIGFjdGlvbikge1xuICAgIGlmICh0eXBlb2YgYWN0aW9uICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgeyBrZXksIGxhYmVsIH0gPSBvcHRzO1xuICAgIGNvbnN0IGV2ZW50S2V5ID0gYFNpbXBsZUNvbW1hbmRIb29rJHtrZXl9JHsrK3JlZ2lzdGVyZWRDbWRVaWR9YDtcbiAgICB0aGlzLkVkaXRvclsnb24nICsgZXZlbnRLZXldKGFjdGlvbik7XG4gICAgdGhpcy5jYWxsZXI/LmNhbGwoYGFwaTpjYWxsYCwge1xuICAgICAgICBtZXRob2Q6ICdyZWdpc3Rlci1wbHVnaW4tc2ltcGxlLWNvbW1hbmQnLFxuICAgICAgICBhcmdzOiBbdGhpcy5iYXNlSW5mby5pZCwgW3sga2V5LCBsYWJlbCwgdHlwZSB9LCBbJ2VkaXRvci9ob29rJywgZXZlbnRLZXldXV1cbiAgICB9KTtcbn1cbmNvbnN0IGFwcCA9IHtcbiAgICByZWdpc3RlclVJSXRlbSh0eXBlLCBvcHRzKSB7XG4gICAgICAgIGNvbnN0IHBpZCA9IHRoaXMuYmFzZUluZm8uaWQ7XG4gICAgICAgIC8vIG9wdHMua2V5ID0gYCR7cGlkfV8ke29wdHMua2V5fWBcbiAgICAgICAgdGhpcy5jYWxsZXI/LmNhbGwoYGFwaTpjYWxsYCwge1xuICAgICAgICAgICAgbWV0aG9kOiAncmVnaXN0ZXItcGx1Z2luLXVpLWl0ZW0nLFxuICAgICAgICAgICAgYXJnczogW3BpZCwgdHlwZSwgb3B0c11cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICByZWdpc3RlclBhZ2VNZW51SXRlbSh0YWcsIGFjdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIGFjdGlvbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGtleSA9IHRhZyArICdfJyArIHRoaXMuYmFzZUluZm8uaWQ7XG4gICAgICAgIGNvbnN0IGxhYmVsID0gdGFnO1xuICAgICAgICBjb25zdCB0eXBlID0gJ3BhZ2UtbWVudS1pdGVtJztcbiAgICAgICAgcmVnaXN0ZXJTaW1wbGVDb21tYW5kLmNhbGwodGhpcywgdHlwZSwge1xuICAgICAgICAgICAga2V5LCBsYWJlbFxuICAgICAgICB9LCBhY3Rpb24pO1xuICAgIH1cbn07XG5sZXQgcmVnaXN0ZXJlZENtZFVpZCA9IDA7XG5jb25zdCBlZGl0b3IgPSB7XG4gICAgcmVnaXN0ZXJTbGFzaENvbW1hbmQodGFnLCBhY3Rpb25zKSB7XG4gICAgICAgIGRlYnVnKCdSZWdpc3RlciBzbGFzaCBjb21tYW5kICMnLCB0aGlzLmJhc2VJbmZvLmlkLCB0YWcsIGFjdGlvbnMpO1xuICAgICAgICBpZiAodHlwZW9mIGFjdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGFjdGlvbnMgPSBbXG4gICAgICAgICAgICAgICAgWydlZGl0b3IvY2xlYXItY3VycmVudC1zbGFzaCcsIGZhbHNlXSxcbiAgICAgICAgICAgICAgICBbJ2VkaXRvci9yZXN0b3JlLXNhdmVkLWN1cnNvciddLFxuICAgICAgICAgICAgICAgIFsnZWRpdG9yL2hvb2snLCBhY3Rpb25zXVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICBhY3Rpb25zID0gYWN0aW9ucy5tYXAoKGl0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBbdGFnLCAuLi5hcmdzXSA9IGl0O1xuICAgICAgICAgICAgc3dpdGNoICh0YWcpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdlZGl0b3IvaG9vayc6XG4gICAgICAgICAgICAgICAgICAgIGxldCBrZXkgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZm4gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbGxlcj8uY2FsbFVzZXJNb2RlbChrZXkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm4gPSBrZXk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXZlbnRLZXkgPSBgU2xhc2hDb21tYW5kSG9vayR7dGFnfSR7KytyZWdpc3RlcmVkQ21kVWlkfWA7XG4gICAgICAgICAgICAgICAgICAgIGl0WzFdID0gZXZlbnRLZXk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlZ2lzdGVyIGNvbW1hbmQgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5FZGl0b3JbJ29uJyArIGV2ZW50S2V5XShmbik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaXQ7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNhbGxlcj8uY2FsbChgYXBpOmNhbGxgLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdyZWdpc3Rlci1wbHVnaW4tc2xhc2gtY29tbWFuZCcsXG4gICAgICAgICAgICBhcmdzOiBbdGhpcy5iYXNlSW5mby5pZCwgW3RhZywgYWN0aW9uc11dXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVnaXN0ZXJCbG9ja0NvbnRleHRNZW51SXRlbSh0YWcsIGFjdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIGFjdGlvbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGtleSA9IHRhZyArICdfJyArIHRoaXMuYmFzZUluZm8uaWQ7XG4gICAgICAgIGNvbnN0IGxhYmVsID0gdGFnO1xuICAgICAgICBjb25zdCB0eXBlID0gJ2Jsb2NrLWNvbnRleHQtbWVudS1pdGVtJztcbiAgICAgICAgcmVnaXN0ZXJTaW1wbGVDb21tYW5kLmNhbGwodGhpcywgdHlwZSwge1xuICAgICAgICAgICAga2V5LCBsYWJlbFxuICAgICAgICB9LCBhY3Rpb24pO1xuICAgIH0sXG4gICAgc2Nyb2xsVG9CbG9ja0luUGFnZShwYWdlTmFtZSwgYmxvY2tJZCkge1xuICAgICAgICBjb25zdCBhbmNob3IgPSBgYmxvY2stY29udGVudC1gICsgYmxvY2tJZDtcbiAgICAgICAgdGhpcy5BcHAucHVzaFN0YXRlKCdwYWdlJywgeyBuYW1lOiBwYWdlTmFtZSB9LCB7IGFuY2hvciB9KTtcbiAgICB9XG59O1xuY29uc3QgZGIgPSB7fTtcbmNvbnN0IEtFWV9NQUlOX1VJID0gMDtcbi8qKlxuICogVXNlciBwbHVnaW4gaW5zdGFuY2VcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGNsYXNzIExTUGx1Z2luVXNlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIF9iYXNlSW5mb1xuICAgICAqIEBwYXJhbSBfY2FsbGVyXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoX2Jhc2VJbmZvLCBfY2FsbGVyKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX2Jhc2VJbmZvID0gX2Jhc2VJbmZvO1xuICAgICAgICB0aGlzLl9jYWxsZXIgPSBfY2FsbGVyO1xuICAgICAgICAvKipcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAvKipcbiAgICAgICAgICogdWkgZnJhbWUgaWRlbnRpdGllc1xuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fdWkgPSBuZXcgTWFwKCk7XG4gICAgICAgIF9jYWxsZXIub24oJ3NldHRpbmdzOmNoYW5nZWQnLCAocGF5bG9hZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYiA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICAgICAgY29uc3QgYSA9IE9iamVjdC5hc3NpZ24odGhpcy5fYmFzZUluZm8uc2V0dGluZ3MsIHBheWxvYWQpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdzZXR0aW5nczpjaGFuZ2VkJywgeyAuLi5hIH0sIGIpO1xuICAgICAgICB9KTtcbiAgICAgICAgX2NhbGxlci5vbignYmVmb3JldW5sb2FkJywgYXN5bmMgKHBheWxvYWQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgYWN0b3IsIC4uLnJlc3QgfSA9IHBheWxvYWQ7XG4gICAgICAgICAgICBjb25zdCBjYiA9IHRoaXMuX2JlZm9yZXVubG9hZENhbGxiYWNrO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjYiAmJiBhd2FpdCBjYihyZXN0KTtcbiAgICAgICAgICAgICAgICBhY3Rvcj8ucmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgJHtfY2FsbGVyLmRlYnVnVGFnfSBbYmVmb3JldW5sb2FkXSBgLCBlKTtcbiAgICAgICAgICAgICAgICBhY3Rvcj8ucmVqZWN0KGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gbW9kdWxlc1xuICAgICAgICB0aGlzLl9maWxlU3RvcmFnZSA9IG5ldyBMU1BsdWdpbkZpbGVTdG9yYWdlKHRoaXMpO1xuICAgIH1cbiAgICBhc3luYyByZWFkeShtb2RlbCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3RlZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbW9kZWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IG1vZGVsO1xuICAgICAgICAgICAgICAgIG1vZGVsID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgYmFzZUluZm8gPSBhd2FpdCB0aGlzLl9jYWxsZXIuY29ubmVjdFRvUGFyZW50KG1vZGVsKTtcbiAgICAgICAgICAgIGJhc2VJbmZvID0gZGVlcE1lcmdlKHRoaXMuX2Jhc2VJbmZvLCBiYXNlSW5mbyk7XG4gICAgICAgICAgICB0aGlzLl9jb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGJhc2VJbmZvPy5pZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhbGxlci5kZWJ1Z1RhZyA9IGAjJHtiYXNlSW5mby5pZH0gWyR7YmFzZUluZm8ubmFtZX1dYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrLmNhbGwodGhpcywgYmFzZUluZm8pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTFNQbHVnaW4gUmVhZHkgRXJyb3JdJywgZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYmVmb3JldW5sb2FkKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX2JlZm9yZXVubG9hZENhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgfVxuICAgIHByb3ZpZGVNb2RlbChtb2RlbCkge1xuICAgICAgICB0aGlzLmNhbGxlci5fZXh0ZW5kVXNlck1vZGVsKG1vZGVsKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHByb3ZpZGVUaGVtZSh0aGVtZSkge1xuICAgICAgICB0aGlzLmNhbGxlci5jYWxsKCdwcm92aWRlcjp0aGVtZScsIHRoZW1lKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHByb3ZpZGVTdHlsZShzdHlsZSkge1xuICAgICAgICB0aGlzLmNhbGxlci5jYWxsKCdwcm92aWRlcjpzdHlsZScsIHN0eWxlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHByb3ZpZGVVSSh1aSkge1xuICAgICAgICB0aGlzLmNhbGxlci5jYWxsKCdwcm92aWRlcjp1aScsIHVpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHVwZGF0ZVNldHRpbmdzKGF0dHJzKSB7XG4gICAgICAgIHRoaXMuY2FsbGVyLmNhbGwoJ3NldHRpbmdzOnVwZGF0ZScsIGF0dHJzKTtcbiAgICAgICAgLy8gVE9ETzogdXBkYXRlIGFzc29jaWF0ZWQgYmFzZUluZm8gc2V0dGluZ3NcbiAgICB9XG4gICAgc2V0TWFpblVJQXR0cnMoYXR0cnMpIHtcbiAgICAgICAgdGhpcy5jYWxsZXIuY2FsbCgnbWFpbi11aTphdHRycycsIGF0dHJzKTtcbiAgICB9XG4gICAgc2V0TWFpblVJSW5saW5lU3R5bGUoc3R5bGUpIHtcbiAgICAgICAgdGhpcy5jYWxsZXIuY2FsbCgnbWFpbi11aTpzdHlsZScsIHN0eWxlKTtcbiAgICB9XG4gICAgaGlkZU1haW5VSShvcHRzKSB7XG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSB7IGtleTogS0VZX01BSU5fVUksIHZpc2libGU6IGZhbHNlLCBjdXJzb3I6IG9wdHM/LnJlc3RvcmVFZGl0aW5nQ3Vyc29yIH07XG4gICAgICAgIHRoaXMuY2FsbGVyLmNhbGwoJ21haW4tdWk6dmlzaWJsZScsIHBheWxvYWQpO1xuICAgICAgICB0aGlzLmVtaXQoJ3VpOnZpc2libGU6Y2hhbmdlZCcsIHBheWxvYWQpO1xuICAgICAgICB0aGlzLl91aS5zZXQocGF5bG9hZC5rZXksIHBheWxvYWQpO1xuICAgIH1cbiAgICBzaG93TWFpblVJKCkge1xuICAgICAgICBjb25zdCBwYXlsb2FkID0geyBrZXk6IEtFWV9NQUlOX1VJLCB2aXNpYmxlOiB0cnVlIH07XG4gICAgICAgIHRoaXMuY2FsbGVyLmNhbGwoJ21haW4tdWk6dmlzaWJsZScsIHBheWxvYWQpO1xuICAgICAgICB0aGlzLmVtaXQoJ3VpOnZpc2libGU6Y2hhbmdlZCcsIHBheWxvYWQpO1xuICAgICAgICB0aGlzLl91aS5zZXQocGF5bG9hZC5rZXksIHBheWxvYWQpO1xuICAgIH1cbiAgICB0b2dnbGVNYWluVUkoKSB7XG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSB7IGtleTogS0VZX01BSU5fVUksIHRvZ2dsZTogdHJ1ZSB9O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuX3VpLmdldChwYXlsb2FkLmtleSk7XG4gICAgICAgIGlmIChzdGF0ZSAmJiBzdGF0ZS52aXNpYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVNYWluVUkoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd01haW5VSSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBpc01haW5VSVZpc2libGUoKSB7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5fdWkuZ2V0KDApO1xuICAgICAgICByZXR1cm4gQm9vbGVhbihzdGF0ZSAmJiBzdGF0ZS52aXNpYmxlKTtcbiAgICB9XG4gICAgZ2V0IGNvbm5lY3RlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Nvbm5lY3RlZDtcbiAgICB9XG4gICAgZ2V0IGJhc2VJbmZvKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYmFzZUluZm87XG4gICAgfVxuICAgIGdldCBzZXR0aW5ncygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFzZUluZm8/LnNldHRpbmdzO1xuICAgIH1cbiAgICBnZXQgY2FsbGVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2FsbGVyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBfbWFrZVVzZXJQcm94eSh0YXJnZXQsIHRhZykge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpcztcbiAgICAgICAgY29uc3QgY2FsbGVyID0gdGhpcy5jYWxsZXI7XG4gICAgICAgIHJldHVybiBuZXcgUHJveHkodGFyZ2V0LCB7XG4gICAgICAgICAgICBnZXQodGFyZ2V0LCBwcm9wS2V5LCByZWNlaXZlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdNZXRob2QgPSB0YXJnZXRbcHJvcEtleV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcmlnTWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXQgPSBvcmlnTWV0aG9kLmFwcGx5KHRoYXQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJldCAhPT0gUFJPWFlfQ09OVElOVUUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBob29rXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhvb2tNYXRjaGVyID0gcHJvcEtleS50b1N0cmluZygpLm1hdGNoKC9eKG9uY2V8b2ZmfG9uKS9pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChob29rTWF0Y2hlciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZiA9IGhvb2tNYXRjaGVyWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGhvb2tNYXRjaGVyLmlucHV0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGUgPSBzLnNsaWNlKGYubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gYGhvb2s6JHt0YWd9OiR7c25ha2VDYXNlKGUpfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVyW2ZdKHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmICE9PSAnb2ZmJyA/ICgpID0+IChjYWxsZXIub2ZmKHR5cGUsIGhhbmRsZXIpKSA6IHZvaWQgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIGhvc3RcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxlci5jYWxsQXN5bmMoYGFwaTpjYWxsYCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBwcm9wS2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogYXJnc1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVGhlIGludGVyZmFjZSBtZXRob2RzIG9mIHtAbGluayBJQXBwUHJveHl9XG4gICAgICovXG4gICAgZ2V0IEFwcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21ha2VVc2VyUHJveHkoYXBwLCAnYXBwJyk7XG4gICAgfVxuICAgIGdldCBFZGl0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYWtlVXNlclByb3h5KGVkaXRvciwgJ2VkaXRvcicpO1xuICAgIH1cbiAgICBnZXQgREIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYWtlVXNlclByb3h5KGRiKTtcbiAgICB9XG4gICAgZ2V0IEZpbGVTdG9yYWdlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZmlsZVN0b3JhZ2U7XG4gICAgfVxufVxuZXhwb3J0ICogZnJvbSAnLi9MU1BsdWdpbic7XG4vKipcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBQbHVnaW5Vc2VySW5zdGFuY2UocGx1Z2luQmFzZUluZm8sIHBsdWdpbkNhbGxlcikge1xuICAgIHJldHVybiBuZXcgTFNQbHVnaW5Vc2VyKHBsdWdpbkJhc2VJbmZvLCBwbHVnaW5DYWxsZXIpO1xufVxuaWYgKHdpbmRvdy5fX0xTUF9fSE9TVF9fID09IG51bGwpIHsgLy8gRW50cnkgb2YgaWZyYW1lIG1vZGVcbiAgICBjb25zdCBjYWxsZXIgPSBuZXcgTFNQbHVnaW5DYWxsZXIobnVsbCk7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHdpbmRvdy5sb2dzZXEgPSBzZXR1cFBsdWdpblVzZXJJbnN0YW5jZSh7fSwgY2FsbGVyKTtcbn1cbiIsImltcG9ydCB7IHNuYWtlQ2FzZSB9IGZyb20gJ3NuYWtlLWNhc2UnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmV4cG9ydCBjb25zdCBJU19ERVYgPSBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JztcbmxldCBfYXBwUGF0aFJvb3Q7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QXBwUGF0aFJvb3QoKSB7XG4gICAgaWYgKF9hcHBQYXRoUm9vdCkge1xuICAgICAgICByZXR1cm4gX2FwcFBhdGhSb290O1xuICAgIH1cbiAgICByZXR1cm4gKF9hcHBQYXRoUm9vdCA9XG4gICAgICAgIGF3YWl0IGludm9rZUhvc3RFeHBvcnRlZEFwaSgnX2NhbGxBcHBsaWNhdGlvbicsICdnZXRBcHBQYXRoJykpO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNES1BhdGhSb290KCkge1xuICAgIGlmIChJU19ERVYpIHtcbiAgICAgICAgLy8gVE9ETzogY2FjaGUgaW4gcHJlZmVyZW5jZSBmaWxlXG4gICAgICAgIHJldHVybiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnTFNQX0RFVl9TREtfUk9PVCcpIHx8ICdodHRwOi8vbG9jYWxob3N0OjgwODAnO1xuICAgIH1cbiAgICBjb25zdCBhcHBQYXRoUm9vdCA9IGF3YWl0IGdldEFwcFBhdGhSb290KCk7XG4gICAgcmV0dXJuIHBhdGguam9pbihhcHBQYXRoUm9vdCwgJ2pzJyk7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNPYmplY3QoaXRlbSkge1xuICAgIHJldHVybiAoaXRlbSA9PT0gT2JqZWN0KGl0ZW0pICYmICFBcnJheS5pc0FycmF5KGl0ZW0pKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBkZWVwTWVyZ2UodGFyZ2V0LCAuLi5zb3VyY2VzKSB7XG4gICAgLy8gcmV0dXJuIHRoZSB0YXJnZXQgaWYgbm8gc291cmNlcyBwYXNzZWRcbiAgICBpZiAoIXNvdXJjZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IHRhcmdldDtcbiAgICBpZiAoaXNPYmplY3QocmVzdWx0KSkge1xuICAgICAgICBjb25zdCBsZW4gPSBzb3VyY2VzLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3QgZWxtID0gc291cmNlc1tpXTtcbiAgICAgICAgICAgIGlmIChpc09iamVjdChlbG0pKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gZWxtKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbG0uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzT2JqZWN0KGVsbVtrZXldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzdWx0W2tleV0gfHwgIWlzT2JqZWN0KHJlc3VsdFtrZXldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWVwTWVyZ2UocmVzdWx0W2tleV0sIGVsbVtrZXldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdFtrZXldKSAmJiBBcnJheS5pc0FycmF5KGVsbVtrZXldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25jYXRlbmF0ZSB0aGUgdHdvIGFycmF5cyBhbmQgcmVtb3ZlIGFueSBkdXBsaWNhdGUgcHJpbWl0aXZlIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IEFycmF5LmZyb20obmV3IFNldChyZXN1bHRba2V5XS5jb25jYXQoZWxtW2tleV0pKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRba2V5XSA9IGVsbVtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdlbklEKCkge1xuICAgIC8vIE1hdGgucmFuZG9tIHNob3VsZCBiZSB1bmlxdWUgYmVjYXVzZSBvZiBpdHMgc2VlZGluZyBhbGdvcml0aG0uXG4gICAgLy8gQ29udmVydCBpdCB0byBiYXNlIDM2IChudW1iZXJzICsgbGV0dGVycyksIGFuZCBncmFiIHRoZSBmaXJzdCA5IGNoYXJhY3RlcnNcbiAgICAvLyBhZnRlciB0aGUgZGVjaW1hbC5cbiAgICByZXR1cm4gJ18nICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIDkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHVjRmlyc3Qoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiB3aXRoRmlsZVByb3RvY29sKHBhdGgpIHtcbiAgICBpZiAoIXBhdGgpXG4gICAgICAgIHJldHVybiAnJztcbiAgICBjb25zdCByZWcgPSAvXihodHRwfGZpbGV8YXNzZXRzKS87XG4gICAgaWYgKCFyZWcudGVzdChwYXRoKSkge1xuICAgICAgICBwYXRoID0gJ2ZpbGU6Ly8nICsgcGF0aDtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGg7XG59XG4vKipcbiAqIEBwYXJhbSB0aW1lb3V0IG1pbGxpc2Vjb25kc1xuICogQHBhcmFtIHRhZyBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZmVycmVkKHRpbWVvdXQsIHRhZykge1xuICAgIGxldCByZXNvbHZlLCByZWplY3Q7XG4gICAgbGV0IHNldHRsZWQgPSBmYWxzZTtcbiAgICBjb25zdCB0aW1lRm4gPSAocikgPT4ge1xuICAgICAgICByZXR1cm4gKHYpID0+IHtcbiAgICAgICAgICAgIHRpbWVvdXQgJiYgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgcih2KTtcbiAgICAgICAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgIH07XG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlMSwgcmVqZWN0MSkgPT4ge1xuICAgICAgICByZXNvbHZlID0gdGltZUZuKHJlc29sdmUxKTtcbiAgICAgICAgcmVqZWN0ID0gdGltZUZuKHJlamVjdDEpO1xuICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgW2RlZmVycmVkIHRpbWVvdXRdICR7dGFnfWApKSwgdGltZW91dCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBjcmVhdGVkOiBEYXRlLm5vdygpLFxuICAgICAgICBzZXRUYWc6ICh0KSA9PiB0YWcgPSB0LFxuICAgICAgICByZXNvbHZlLCByZWplY3QsIHByb21pc2UsXG4gICAgICAgIGdldCBzZXR0bGVkKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNldHRsZWQ7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGludm9rZUhvc3RFeHBvcnRlZEFwaShtZXRob2QsIC4uLmFyZ3MpIHtcbiAgICBjb25zdCBtZXRob2QxID0gc25ha2VDYXNlKG1ldGhvZCk7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGxvZ3NlcUhvc3RFeHBvcnRlZEFwaSA9IHdpbmRvdy5sb2dzZXE/LmFwaSB8fCB7fTtcbiAgICBjb25zdCBmbiA9IGxvZ3NlcUhvc3RFeHBvcnRlZEFwaVttZXRob2QxXSB8fCB3aW5kb3cuYXBpc1ttZXRob2QxXSB8fFxuICAgICAgICBsb2dzZXFIb3N0RXhwb3J0ZWRBcGlbbWV0aG9kXSB8fCB3aW5kb3cuYXBpc1ttZXRob2RdO1xuICAgIGlmICghZm4pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBOb3QgZXhpc3RlZCBtZXRob2QgIyR7bWV0aG9kfWApO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nID8gZm4gOiBmbi5hcHBseShudWxsLCBhcmdzKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXR1cElmcmFtZVNhbmRib3gocHJvcHMsIHRhcmdldCkge1xuICAgIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICAgIGlmcmFtZS5jbGFzc0xpc3QuYWRkKCdsc3AtaWZyYW1lLXNhbmRib3gnKTtcbiAgICBPYmplY3QuZW50cmllcyhwcm9wcykuZm9yRWFjaCgoW2ssIHZdKSA9PiB7XG4gICAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoaywgdik7XG4gICAgfSk7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgcmV0dXJuIGFzeW5jICgpID0+IHtcbiAgICAgICAgdGFyZ2V0LnJlbW92ZUNoaWxkKGlmcmFtZSk7XG4gICAgfTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXR1cEluamVjdGVkU3R5bGUoc3R5bGUsIGF0dHJzKSB7XG4gICAgY29uc3Qga2V5ID0gYXR0cnNbJ2RhdGEtaW5qZWN0ZWQtc3R5bGUnXTtcbiAgICBsZXQgZWwgPSBrZXkgJiYgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtaW5qZWN0ZWQtc3R5bGU9JHtrZXl9XWApO1xuICAgIGlmIChlbCkge1xuICAgICAgICBlbC50ZXh0Q29udGVudCA9IHN0eWxlO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBlbC50ZXh0Q29udGVudCA9IHN0eWxlO1xuICAgIGF0dHJzICYmIE9iamVjdC5lbnRyaWVzKGF0dHJzKS5mb3JFYWNoKChbaywgdl0pID0+IHtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKGssIHYpO1xuICAgIH0pO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kKGVsKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBkb2N1bWVudC5oZWFkLnJlbW92ZUNoaWxkKGVsKTtcbiAgICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNldHVwSW5qZWN0ZWRVSSh1aSwgYXR0cnMpIHtcbiAgICBjb25zdCBwbCA9IHRoaXM7XG4gICAgbGV0IHNlbGVjdG9yID0gJyc7XG4gICAgaWYgKCdzbG90JyBpbiB1aSkge1xuICAgICAgICBzZWxlY3RvciA9IGAjJHt1aS5zbG90fWA7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzZWxlY3RvciA9IHVpLnBhdGg7XG4gICAgfVxuICAgIGNvbnN0IHRhcmdldCA9IHNlbGVjdG9yICYmIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7dGhpcy5kZWJ1Z1RhZ30gY2FuIG5vdCByZXNvbHZlIHNlbGVjdG9yIHRhcmdldCAke3NlbGVjdG9yfWApO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGtleSA9IGAke3VpLmtleX0tJHtwbC5pZH1gO1xuICAgIGxldCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGRpdltkYXRhLWluamVjdGVkLXVpPVwiJHtrZXl9XCJdYCk7XG4gICAgaWYgKGVsKSB7XG4gICAgICAgIGVsLmlubmVySFRNTCA9IHVpLnRlbXBsYXRlO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWwuZGF0YXNldC5pbmplY3RlZFVpID0ga2V5IHx8ICcnO1xuICAgIC8vIFRPRE86IFN1cHBvcnQgbW9yZVxuICAgIGVsLmlubmVySFRNTCA9IHVpLnRlbXBsYXRlO1xuICAgIGF0dHJzICYmIE9iamVjdC5lbnRyaWVzKGF0dHJzKS5mb3JFYWNoKChbaywgdl0pID0+IHtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKGssIHYpO1xuICAgIH0pO1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChlbCk7XG4gICAgLy8gVE9ETzogSG93IGhhbmRsZSBldmVudHNcbiAgICBbJ2NsaWNrJywgJ2ZvY3VzJywgJ2ZvY3VzaW4nLCAnZm9jdXNvdXQnLCAnYmx1cicsICdkYmxjbGljaycsXG4gICAgICAgICdrZXl1cCcsICdrZXlwcmVzcycsICdrZXlkb3duJywgJ2NoYW5nZScsICdpbnB1dCddLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBjb25zdCB0cmlnZ2VyID0gdGFyZ2V0LmNsb3Nlc3QoYFtkYXRhLW9uLSR7dHlwZX1dYCk7XG4gICAgICAgICAgICBpZiAoIXRyaWdnZXIpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgY29uc3QgbXNnVHlwZSA9IHRyaWdnZXIuZGF0YXNldFtgb24ke3VjRmlyc3QodHlwZSl9YF07XG4gICAgICAgICAgICBtc2dUeXBlICYmIHBsLmNhbGxlcj8uY2FsbFVzZXJNb2RlbChtc2dUeXBlLCB0cmFuc2Zvcm1hYmxlRXZlbnQodHJpZ2dlciwgZSkpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgdGFyZ2V0LnJlbW92ZUNoaWxkKGVsKTtcbiAgICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybWFibGVFdmVudCh0YXJnZXQsIGUpIHtcbiAgICBjb25zdCBvYmogPSB7fTtcbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgIGNvbnN0IGRzID0gdGFyZ2V0LmRhdGFzZXQ7XG4gICAgICAgIGNvbnN0IEZMQUdfUkVDVCA9ICdyZWN0JztcbiAgICAgICAgWyd2YWx1ZScsICdpZCcsICdjbGFzc05hbWUnLFxuICAgICAgICAgICAgJ2RhdGFzZXQnLCBGTEFHX1JFQ1RcbiAgICAgICAgXS5mb3JFYWNoKChrKSA9PiB7XG4gICAgICAgICAgICBsZXQgdjtcbiAgICAgICAgICAgIHN3aXRjaCAoaykge1xuICAgICAgICAgICAgICAgIGNhc2UgRkxBR19SRUNUOlxuICAgICAgICAgICAgICAgICAgICBpZiAoIWRzLmhhc093blByb3BlcnR5KEZMQUdfUkVDVCkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIHYgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9KU09OKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHYgPSB0YXJnZXRba107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIHYgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgdiA9IHsgLi4udiB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb2JqW2tdID0gdjtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG59XG5sZXQgaW5qZWN0ZWRUaGVtZUVmZmVjdCA9IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gc2V0dXBJbmplY3RlZFRoZW1lKHVybCkge1xuICAgIGluamVjdGVkVGhlbWVFZmZlY3Q/LmNhbGwoKTtcbiAgICBpZiAoIXVybClcbiAgICAgICAgcmV0dXJuO1xuICAgIGNvbnN0IGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgbGluay5yZWwgPSAnc3R5bGVzaGVldCc7XG4gICAgbGluay5ocmVmID0gdXJsO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluayk7XG4gICAgcmV0dXJuIChpbmplY3RlZFRoZW1lRWZmZWN0ID0gKCkgPT4ge1xuICAgICAgICBkb2N1bWVudC5oZWFkLnJlbW92ZUNoaWxkKGxpbmspO1xuICAgICAgICBpbmplY3RlZFRoZW1lRWZmZWN0ID0gbnVsbDtcbiAgICB9KTtcbn1cbiIsIi8qKlxuICogQSBzdG9yYWdlIGJhc2VkIG9uIGxvY2FsIGZpbGVzIHVuZGVyIHNwZWNpZmljIGNvbnRleHRcbiAqL1xuY2xhc3MgTFNQbHVnaW5GaWxlU3RvcmFnZSB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIGN0eFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGN0eCkge1xuICAgICAgICB0aGlzLmN0eCA9IGN0eDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogcGx1Z2luIGlkXG4gICAgICovXG4gICAgZ2V0IGN0eElkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdHguYmFzZUluZm8uaWQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBrZXkgQSBzdHJpbmcgYXMgZmlsZSBuYW1lIHRoYXQgc3VwcG9ydCBuZXN0ZWQgZGlyZWN0b3J5XG4gICAgICogQHBhcmFtIHZhbHVlIFN0b3JhZ2UgdmFsdWVcbiAgICAgKi9cbiAgICBzZXRJdGVtKGtleSwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3R4LmNhbGxlci5jYWxsQXN5bmMoYGFwaTpjYWxsYCwge1xuICAgICAgICAgICAgbWV0aG9kOiAnd3JpdGUtcGx1Z2luLXN0b3JhZ2UtZmlsZScsXG4gICAgICAgICAgICBhcmdzOiBbdGhpcy5jdHhJZCwga2V5LCB2YWx1ZV1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBrZXlcbiAgICAgKi9cbiAgICBnZXRJdGVtKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdHguY2FsbGVyLmNhbGxBc3luYyhgYXBpOmNhbGxgLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdyZWFkLXBsdWdpbi1zdG9yYWdlLWZpbGUnLFxuICAgICAgICAgICAgYXJnczogW3RoaXMuY3R4SWQsIGtleV1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBrZXlcbiAgICAgKi9cbiAgICByZW1vdmVJdGVtKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdHguY2FsbGVyLmNhbGwoYGFwaTpjYWxsYCwge1xuICAgICAgICAgICAgbWV0aG9kOiAndW5saW5rLXBsdWdpbi1zdG9yYWdlLWZpbGUnLFxuICAgICAgICAgICAgYXJnczogW3RoaXMuY3R4SWQsIGtleV1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsZWFycyB0aGUgc3RvcmFnZVxuICAgICAqL1xuICAgIGNsZWFyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdHguY2FsbGVyLmNhbGwoYGFwaTpjYWxsYCwge1xuICAgICAgICAgICAgbWV0aG9kOiAnY2xlYXItcGx1Z2luLXN0b3JhZ2UtZmlsZXMnLFxuICAgICAgICAgICAgYXJnczogW3RoaXMuY3R4SWRdXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICovXG4gICAgaGFzSXRlbShrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3R4LmNhbGxlci5jYWxsQXN5bmMoYGFwaTpjYWxsYCwge1xuICAgICAgICAgICAgbWV0aG9kOiAnZXhpc3QtcGx1Z2luLXN0b3JhZ2UtZmlsZScsXG4gICAgICAgICAgICBhcmdzOiBbdGhpcy5jdHhJZCwga2V5XVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnQgeyBMU1BsdWdpbkZpbGVTdG9yYWdlIH07XG4iLCIvKiEgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXHJcblxyXG5QZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcclxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxyXG5cclxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxyXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcclxuQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxyXG5JTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cclxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcclxuT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxyXG5QRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG4vKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgaWYgKHR5cGVvZiBiICE9PSBcImZ1bmN0aW9uXCIgJiYgYiAhPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2xhc3MgZXh0ZW5kcyB2YWx1ZSBcIiArIFN0cmluZyhiKSArIFwiIGlzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIG51bGxcIik7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxyXG4gICAgICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICAgICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXRlcih0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcclxuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxyXG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XHJcbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2dlbmVyYXRvcih0aGlzQXJnLCBib2R5KSB7XHJcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnO1xyXG4gICAgcmV0dXJuIGcgPSB7IG5leHQ6IHZlcmIoMCksIFwidGhyb3dcIjogdmVyYigxKSwgXCJyZXR1cm5cIjogdmVyYigyKSB9LCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcclxuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XHJcbiAgICAgICAgd2hpbGUgKF8pIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcclxuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cclxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2NyZWF0ZUJpbmRpbmcgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIGsyLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH0pO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIG8pIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgcCkpIF9fY3JlYXRlQmluZGluZyhvLCBtLCBwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBzID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciwgbSA9IHMgJiYgb1tzXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIGlmIChvICYmIHR5cGVvZiBvLmxlbmd0aCA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChvICYmIGkgPj0gby5sZW5ndGgpIG8gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBvICYmIG9baSsrXSwgZG9uZTogIW8gfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzID8gXCJPYmplY3QgaXMgbm90IGl0ZXJhYmxlLlwiIDogXCJTeW1ib2wuaXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZWFkKG8sIG4pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXTtcclxuICAgIGlmICghbSkgcmV0dXJuIG87XHJcbiAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2hpbGUgKChuID09PSB2b2lkIDAgfHwgbi0tID4gMCkgJiYgIShyID0gaS5uZXh0KCkpLmRvbmUpIGFyLnB1c2goci52YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHsgZSA9IHsgZXJyb3I6IGVycm9yIH07IH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChyICYmICFyLmRvbmUgJiYgKG0gPSBpW1wicmV0dXJuXCJdKSkgbS5jYWxsKGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5cygpIHtcclxuICAgIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgZm9yICh2YXIgciA9IEFycmF5KHMpLCBrID0gMCwgaSA9IDA7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIGZvciAodmFyIGEgPSBhcmd1bWVudHNbaV0sIGogPSAwLCBqbCA9IGEubGVuZ3RoOyBqIDwgamw7IGorKywgaysrKVxyXG4gICAgICAgICAgICByW2tdID0gYVtqXTtcclxuICAgIHJldHVybiByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheSh0bywgZnJvbSkge1xyXG4gICAgZm9yICh2YXIgaSA9IDAsIGlsID0gZnJvbS5sZW5ndGgsIGogPSB0by5sZW5ndGg7IGkgPCBpbDsgaSsrLCBqKyspXHJcbiAgICAgICAgdG9bal0gPSBmcm9tW2ldO1xyXG4gICAgcmV0dXJuIHRvO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBwcml2YXRlTWFwKSB7XHJcbiAgICBpZiAoIXByaXZhdGVNYXAuaGFzKHJlY2VpdmVyKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhdHRlbXB0ZWQgdG8gZ2V0IHByaXZhdGUgZmllbGQgb24gbm9uLWluc3RhbmNlXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByaXZhdGVNYXAuZ2V0KHJlY2VpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRTZXQocmVjZWl2ZXIsIHByaXZhdGVNYXAsIHZhbHVlKSB7XHJcbiAgICBpZiAoIXByaXZhdGVNYXAuaGFzKHJlY2VpdmVyKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhdHRlbXB0ZWQgdG8gc2V0IHByaXZhdGUgZmllbGQgb24gbm9uLWluc3RhbmNlXCIpO1xyXG4gICAgfVxyXG4gICAgcHJpdmF0ZU1hcC5zZXQocmVjZWl2ZXIsIHZhbHVlKTtcclxuICAgIHJldHVybiB2YWx1ZTtcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0aWYoX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSkge1xuXHRcdHJldHVybiBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMyc7XG5pbXBvcnQgeyBkZWVwTWVyZ2UsIHNldHVwSW5qZWN0ZWRTdHlsZSwgZ2VuSUQsIHNldHVwSW5qZWN0ZWRUaGVtZSwgc2V0dXBJbmplY3RlZFVJLCBkZWZlcnJlZCwgaW52b2tlSG9zdEV4cG9ydGVkQXBpLCBpc09iamVjdCwgd2l0aEZpbGVQcm90b2NvbCwgZ2V0U0RLUGF0aFJvb3QgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0ICogYXMgcGx1Z2luSGVscGVycyBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCB7IExTUGx1Z2luQ2FsbGVyLCBMU1BNU0dfUkVBRFksIExTUE1TR19TWU5DLCBMU1BNU0csIExTUE1TR19TRVRUSU5HUywgTFNQTVNHX0VSUk9SX1RBRywgTFNQTVNHX0JFRk9SRV9VTkxPQUQsIEFXQUlUX0xTUE1TR0ZuIH0gZnJvbSAnLi9MU1BsdWdpbi5jYWxsZXInO1xuaW1wb3J0IHsgc25ha2VDYXNlIH0gZnJvbSAnc25ha2UtY2FzZSc7XG5pbXBvcnQgRE9NUHVyaWZ5IGZyb20gJ2RvbXB1cmlmeSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuY29uc3QgZGVidWcgPSBEZWJ1ZygnTFNQbHVnaW46Y29yZScpO1xuLyoqXG4gKiBVc2VyIHNldHRpbmdzXG4gKi9cbmNsYXNzIFBsdWdpblNldHRpbmdzIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvcihfdXNlclBsdWdpblNldHRpbmdzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX3VzZXJQbHVnaW5TZXR0aW5ncyA9IF91c2VyUGx1Z2luU2V0dGluZ3M7XG4gICAgICAgIHRoaXMuX3NldHRpbmdzID0ge1xuICAgICAgICAgICAgZGlzYWJsZWQ6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5fc2V0dGluZ3MsIF91c2VyUGx1Z2luU2V0dGluZ3MpO1xuICAgIH1cbiAgICBnZXQoaykge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2V0dGluZ3Nba107XG4gICAgfVxuICAgIHNldChrLCB2KSB7XG4gICAgICAgIGNvbnN0IG8gPSBkZWVwTWVyZ2Uoe30sIHRoaXMuX3NldHRpbmdzKTtcbiAgICAgICAgaWYgKHR5cGVvZiBrID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NldHRpbmdzW2tdID09IHYpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5fc2V0dGluZ3Nba10gPSB2O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzT2JqZWN0KGspKSB7XG4gICAgICAgICAgICBkZWVwTWVyZ2UodGhpcy5fc2V0dGluZ3MsIGspO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW1pdCgnY2hhbmdlJywgT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5fc2V0dGluZ3MpLCBvKTtcbiAgICB9XG4gICAgdG9KU09OKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2V0dGluZ3M7XG4gICAgfVxufVxuY2xhc3MgUGx1Z2luTG9nZ2VyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvcihfdGFnKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX3RhZyA9IF90YWc7XG4gICAgICAgIHRoaXMuX2xvZ3MgPSBbXTtcbiAgICB9XG4gICAgd3JpdGUodHlwZSwgcGF5bG9hZCkge1xuICAgICAgICBsZXQgbXNnID0gcGF5bG9hZC5yZWR1Y2UoKGFjLCBpdCkgPT4ge1xuICAgICAgICAgICAgaWYgKGl0ICYmIGl0IGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBhYyArPSBgJHtpdC5tZXNzYWdlfSAke2l0LnN0YWNrfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBhYyArPSBpdC50b1N0cmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjO1xuICAgICAgICB9LCBgWyR7dGhpcy5fdGFnfV1bJHtuZXcgRGF0ZSgpLnRvTG9jYWxlVGltZVN0cmluZygpfV0gYCk7XG4gICAgICAgIHRoaXMuX2xvZ3MucHVzaChbdHlwZSwgbXNnXSk7XG4gICAgICAgIHRoaXMuZW1pdCgnY2hhbmdlJyk7XG4gICAgfVxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLl9sb2dzID0gW107XG4gICAgICAgIHRoaXMuZW1pdCgnY2hhbmdlJyk7XG4gICAgfVxuICAgIGluZm8oLi4uYXJncykge1xuICAgICAgICB0aGlzLndyaXRlKCdJTkZPJywgYXJncyk7XG4gICAgfVxuICAgIGVycm9yKC4uLmFyZ3MpIHtcbiAgICAgICAgdGhpcy53cml0ZSgnRVJST1InLCBhcmdzKTtcbiAgICB9XG4gICAgd2FybiguLi5hcmdzKSB7XG4gICAgICAgIHRoaXMud3JpdGUoJ1dBUk4nLCBhcmdzKTtcbiAgICB9XG4gICAgdG9KU09OKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9ncztcbiAgICB9XG59XG52YXIgUGx1Z2luTG9jYWxMb2FkU3RhdHVzO1xuKGZ1bmN0aW9uIChQbHVnaW5Mb2NhbExvYWRTdGF0dXMpIHtcbiAgICBQbHVnaW5Mb2NhbExvYWRTdGF0dXNbXCJMT0FESU5HXCJdID0gXCJsb2FkaW5nXCI7XG4gICAgUGx1Z2luTG9jYWxMb2FkU3RhdHVzW1wiVU5MT0FESU5HXCJdID0gXCJ1bmxvYWRpbmdcIjtcbiAgICBQbHVnaW5Mb2NhbExvYWRTdGF0dXNbXCJMT0FERURcIl0gPSBcImxvYWRlZFwiO1xuICAgIFBsdWdpbkxvY2FsTG9hZFN0YXR1c1tcIlVOTE9BREVEXCJdID0gXCJ1bmxvYWRcIjtcbiAgICBQbHVnaW5Mb2NhbExvYWRTdGF0dXNbXCJFUlJPUlwiXSA9IFwiZXJyb3JcIjtcbn0pKFBsdWdpbkxvY2FsTG9hZFN0YXR1cyB8fCAoUGx1Z2luTG9jYWxMb2FkU3RhdHVzID0ge30pKTtcbmZ1bmN0aW9uIGluaXRVc2VyU2V0dGluZ3NIYW5kbGVycyhwbHVnaW5Mb2NhbCkge1xuICAgIGNvbnN0IF8gPSAobGFiZWwpID0+IGBzZXR0aW5nczoke2xhYmVsfWA7XG4gICAgcGx1Z2luTG9jYWwub24oXygndXBkYXRlJyksIChhdHRycykgPT4ge1xuICAgICAgICBpZiAoIWF0dHJzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBwbHVnaW5Mb2NhbC5zZXR0aW5ncz8uc2V0KGF0dHJzKTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGluaXRNYWluVUlIYW5kbGVycyhwbHVnaW5Mb2NhbCkge1xuICAgIGNvbnN0IF8gPSAobGFiZWwpID0+IGBtYWluLXVpOiR7bGFiZWx9YDtcbiAgICBwbHVnaW5Mb2NhbC5vbihfKCd2aXNpYmxlJyksICh7IHZpc2libGUsIHRvZ2dsZSwgY3Vyc29yIH0pID0+IHtcbiAgICAgICAgY29uc3QgZWwgPSBwbHVnaW5Mb2NhbC5nZXRNYWluVUkoKTtcbiAgICAgICAgZWw/LmNsYXNzTGlzdFt0b2dnbGUgPyAndG9nZ2xlJyA6ICh2aXNpYmxlID8gJ2FkZCcgOiAncmVtb3ZlJyldKCd2aXNpYmxlJyk7XG4gICAgICAgIC8vIHBsdWdpbkxvY2FsLmNhbGxlciEuY2FsbFVzZXJNb2RlbChMU1BNU0csIHsgdHlwZTogXygndmlzaWJsZScpLCBwYXlsb2FkOiB2aXNpYmxlIH0pXG4gICAgICAgIC8vIGF1dG8gZm9jdXMgZnJhbWVcbiAgICAgICAgaWYgKHZpc2libGUpIHtcbiAgICAgICAgICAgIGlmICghcGx1Z2luTG9jYWwuc2hhZG93ICYmIGVsKSB7XG4gICAgICAgICAgICAgICAgZWwuY29udGVudFdpbmRvdz8uZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgICAgICBpbnZva2VIb3N0RXhwb3J0ZWRBcGkoJ3Jlc3RvcmVfZWRpdGluZ19jdXJzb3InKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHBsdWdpbkxvY2FsLm9uKF8oJ2F0dHJzJyksIChhdHRycykgPT4ge1xuICAgICAgICBjb25zdCBlbCA9IHBsdWdpbkxvY2FsLmdldE1haW5VSSgpO1xuICAgICAgICBPYmplY3QuZW50cmllcyhhdHRycykuZm9yRWFjaCgoW2ssIHZdKSA9PiB7XG4gICAgICAgICAgICBlbD8uc2V0QXR0cmlidXRlKGssIHYpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBwbHVnaW5Mb2NhbC5vbihfKCdzdHlsZScpLCAoc3R5bGUpID0+IHtcbiAgICAgICAgY29uc3QgZWwgPSBwbHVnaW5Mb2NhbC5nZXRNYWluVUkoKTtcbiAgICAgICAgT2JqZWN0LmVudHJpZXMoc3R5bGUpLmZvckVhY2goKFtrLCB2XSkgPT4ge1xuICAgICAgICAgICAgZWwuc3R5bGVba10gPSB2O1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGluaXRQcm92aWRlckhhbmRsZXJzKHBsdWdpbkxvY2FsKSB7XG4gICAgbGV0IF8gPSAobGFiZWwpID0+IGBwcm92aWRlcjoke2xhYmVsfWA7XG4gICAgbGV0IHRoZW1lZCA9IGZhbHNlO1xuICAgIHBsdWdpbkxvY2FsLm9uKF8oJ3RoZW1lJyksICh0aGVtZSkgPT4ge1xuICAgICAgICBwbHVnaW5Mb2NhbC50aGVtZU1nci5yZWdpc3RlclRoZW1lKHBsdWdpbkxvY2FsLmlkLCB0aGVtZSk7XG4gICAgICAgIGlmICghdGhlbWVkKSB7XG4gICAgICAgICAgICBwbHVnaW5Mb2NhbC5fZGlzcG9zZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgcGx1Z2luTG9jYWwudGhlbWVNZ3IudW5yZWdpc3RlclRoZW1lKHBsdWdpbkxvY2FsLmlkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhlbWVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHBsdWdpbkxvY2FsLm9uKF8oJ3N0eWxlJyksIChzdHlsZSkgPT4ge1xuICAgICAgICBsZXQga2V5O1xuICAgICAgICBpZiAodHlwZW9mIHN0eWxlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAga2V5ID0gc3R5bGUua2V5O1xuICAgICAgICAgICAgc3R5bGUgPSBzdHlsZS5zdHlsZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXN0eWxlIHx8ICFzdHlsZS50cmltKCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHBsdWdpbkxvY2FsLl9kaXNwb3NlKHNldHVwSW5qZWN0ZWRTdHlsZShzdHlsZSwge1xuICAgICAgICAgICAgJ2RhdGEtaW5qZWN0ZWQtc3R5bGUnOiBrZXkgPyBgJHtrZXl9LSR7cGx1Z2luTG9jYWwuaWR9YCA6ICcnLFxuICAgICAgICAgICAgJ2RhdGEtcmVmJzogcGx1Z2luTG9jYWwuaWRcbiAgICAgICAgfSkpO1xuICAgIH0pO1xuICAgIHBsdWdpbkxvY2FsLm9uKF8oJ3VpJyksICh1aSkgPT4ge1xuICAgICAgICBwbHVnaW5Mb2NhbC5fb25Ib3N0TW91bnRlZCgoKSA9PiB7XG4gICAgICAgICAgICAvLyBzYWZlIHRlbXBsYXRlXG4gICAgICAgICAgICB1aS50ZW1wbGF0ZSA9IERPTVB1cmlmeS5zYW5pdGl6ZSh1aS50ZW1wbGF0ZSk7XG4gICAgICAgICAgICBwbHVnaW5Mb2NhbC5fZGlzcG9zZShzZXR1cEluamVjdGVkVUkuY2FsbChwbHVnaW5Mb2NhbCwgdWksIHtcbiAgICAgICAgICAgICAgICAnZGF0YS1yZWYnOiBwbHVnaW5Mb2NhbC5pZFxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGluaXRBcGlQcm94eUhhbmRsZXJzKHBsdWdpbkxvY2FsKSB7XG4gICAgbGV0IF8gPSAobGFiZWwpID0+IGBhcGk6JHtsYWJlbH1gO1xuICAgIHBsdWdpbkxvY2FsLm9uKF8oJ2NhbGwnKSwgYXN5bmMgKHBheWxvYWQpID0+IHtcbiAgICAgICAgbGV0IHJldDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldCA9IGF3YWl0IGludm9rZUhvc3RFeHBvcnRlZEFwaShwYXlsb2FkLm1ldGhvZCwgLi4ucGF5bG9hZC5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0ID0ge1xuICAgICAgICAgICAgICAgIFtMU1BNU0dfRVJST1JfVEFHXTogZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBfc3luYyB9ID0gcGF5bG9hZDtcbiAgICAgICAgaWYgKHBsdWdpbkxvY2FsLnNoYWRvdykge1xuICAgICAgICAgICAgaWYgKHBheWxvYWQuYWN0b3IpIHtcbiAgICAgICAgICAgICAgICBwYXlsb2FkLmFjdG9yLnJlc29sdmUocmV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoX3N5bmMgIT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc3QgcmVwbHkgPSAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgcGx1Z2luTG9jYWwuY2FsbGVyPy5jYWxsVXNlck1vZGVsKExTUE1TR19TWU5DLCB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCwgX3N5bmNcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUocmV0KS50aGVuKHJlcGx5LCByZXBseSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmNsYXNzIElsbGVnYWxQbHVnaW5QYWNrYWdlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5uYW1lID0gSWxsZWdhbFBsdWdpblBhY2thZ2VFcnJvci5uYW1lO1xuICAgIH1cbn1cbmNsYXNzIEV4aXN0ZWRJbXBvcnRlZFBsdWdpblBhY2thZ2VFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlKSB7XG4gICAgICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgICAgICB0aGlzLm5hbWUgPSBFeGlzdGVkSW1wb3J0ZWRQbHVnaW5QYWNrYWdlRXJyb3IubmFtZTtcbiAgICB9XG59XG4vKipcbiAqIEhvc3QgcGx1Z2luIGZvciBsb2NhbFxuICovXG5jbGFzcyBQbHVnaW5Mb2NhbCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIF9vcHRpb25zXG4gICAgICogQHBhcmFtIF90aGVtZU1nclxuICAgICAqIEBwYXJhbSBfY3R4XG4gICAgICovXG4gICAgY29uc3RydWN0b3IoX29wdGlvbnMsIF90aGVtZU1nciwgX2N0eCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9vcHRpb25zID0gX29wdGlvbnM7XG4gICAgICAgIHRoaXMuX3RoZW1lTWdyID0gX3RoZW1lTWdyO1xuICAgICAgICB0aGlzLl9jdHggPSBfY3R4O1xuICAgICAgICB0aGlzLl9kaXNwb3NlcyA9IFtdO1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBQbHVnaW5Mb2NhbExvYWRTdGF0dXMuVU5MT0FERUQ7XG4gICAgICAgIHRoaXMuX2lkID0gX29wdGlvbnMua2V5IHx8IGdlbklEKCk7XG4gICAgICAgIGluaXRVc2VyU2V0dGluZ3NIYW5kbGVycyh0aGlzKTtcbiAgICAgICAgaW5pdE1haW5VSUhhbmRsZXJzKHRoaXMpO1xuICAgICAgICBpbml0UHJvdmlkZXJIYW5kbGVycyh0aGlzKTtcbiAgICAgICAgaW5pdEFwaVByb3h5SGFuZGxlcnModGhpcyk7XG4gICAgfVxuICAgIGFzeW5jIF9zZXR1cFVzZXJTZXR0aW5ncygpIHtcbiAgICAgICAgY29uc3QgeyBfb3B0aW9ucyB9ID0gdGhpcztcbiAgICAgICAgY29uc3Qga2V5ID0gX29wdGlvbnMubmFtZS5yZXBsYWNlKC9bXmEtejAtOV0vZ2ksICdfJykudG9Mb3dlckNhc2UoKSArICdfJyArIHRoaXMuaWQ7XG4gICAgICAgIGNvbnN0IGxvZ2dlciA9IF9vcHRpb25zLmxvZ2dlciA9IG5ldyBQbHVnaW5Mb2dnZXIoJ0xvYWRlcicpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgW3VzZXJTZXR0aW5nc0ZpbGVQYXRoLCB1c2VyU2V0dGluZ3NdID0gYXdhaXQgaW52b2tlSG9zdEV4cG9ydGVkQXBpKCdsb2FkX3BsdWdpbl91c2VyX3NldHRpbmdzJywga2V5KTtcbiAgICAgICAgICAgIHRoaXMuX3VzZXJTZXR0aW5nc0ZpbGUgPSB1c2VyU2V0dGluZ3NGaWxlUGF0aDtcbiAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzID0gX29wdGlvbnMuc2V0dGluZ3MgPSBuZXcgUGx1Z2luU2V0dGluZ3ModXNlclNldHRpbmdzKTtcbiAgICAgICAgICAgIC8vIG9ic2VydmUgc2V0dGluZ3NcbiAgICAgICAgICAgIHNldHRpbmdzLm9uKCdjaGFuZ2UnLCAoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgIGRlYnVnKCdsaW5rZWQgc2V0dGluZ3MgY2hhbmdlJywgYSk7XG4gICAgICAgICAgICAgICAgaWYgKCFhLmRpc2FibGVkICYmIGIuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRW5hYmxlIHBsdWdpblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGEuZGlzYWJsZWQgJiYgIWIuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRGlzYWJsZSBwbHVnaW5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy51bmxvYWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW52b2tlSG9zdEV4cG9ydGVkQXBpKGBzYXZlX3BsdWdpbl91c2VyX3NldHRpbmdzYCwga2V5LCBhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZGVidWcoJ1tsb2FkIHBsdWdpbiB1c2VyIHNldHRpbmdzIEVycm9yXScsIGUpO1xuICAgICAgICAgICAgbG9nZ2VyPy5lcnJvcihlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRNYWluVUkoKSB7XG4gICAgICAgIGlmICh0aGlzLnNoYWRvdykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FsbGVyPy5fZ2V0U2FuZGJveFNoYWRvd0NvbnRhaW5lcigpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmNhbGxlcj8uX2dldFNhbmRib3hJZnJhbWVDb250YWluZXIoKTtcbiAgICB9XG4gICAgYXN5bmMgX3ByZXBhcmVQYWNrYWdlQ29uZmlncygpIHtcbiAgICAgICAgY29uc3QgeyB1cmwgfSA9IHRoaXMuX29wdGlvbnM7XG4gICAgICAgIGxldCBwa2c7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIXVybCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG5vdCByZXNvbHZlIHBhY2thZ2UgY29uZmlnIGxvY2F0aW9uJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWJ1ZygncHJlcGFyZSBwYWNrYWdlIHJvb3QnLCB1cmwpO1xuICAgICAgICAgICAgcGtnID0gYXdhaXQgaW52b2tlSG9zdEV4cG9ydGVkQXBpKCdsb2FkX3BsdWdpbl9jb25maWcnLCB1cmwpO1xuICAgICAgICAgICAgaWYgKCFwa2cgfHwgKHBrZyA9IEpTT04ucGFyc2UocGtnKSwgIXBrZykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhcnNlIHBhY2thZ2UgY29uZmlnIGVycm9yICMke3VybH0vcGFja2FnZS5qc29uYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBJbGxlZ2FsUGx1Z2luUGFja2FnZUVycm9yKGUubWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUGljayBsZWdhbCBhdHRyc1xuICAgICAgICBbJ25hbWUnLCAnYXV0aG9yJywgJ3JlcG9zaXRvcnknLCAndmVyc2lvbicsICdkZXNjcmlwdGlvbiddLmZvckVhY2goayA9PiB7XG4gICAgICAgICAgICB0aGlzLl9vcHRpb25zW2tdID0gcGtnW2tdO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gVE9ETzogSG93IHdpdGggbG9jYWwgcHJvdG9jb2xcbiAgICAgICAgY29uc3QgbG9jYWxSb290ID0gdGhpcy5fbG9jYWxSb290ID0gdXJsO1xuICAgICAgICBjb25zdCBsb2dzZXEgPSBwa2cubG9nc2VxIHx8IHt9O1xuICAgICAgICBjb25zdCBtYWtlRnVsbFVybCA9IChsb2MsIHVzZUZpbGVQcm90b2NvbCA9IGZhbHNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWxvYylcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBjb25zdCByZWcgPSAvXihodHRwfGZpbGV8YXNzZXRzKS87XG4gICAgICAgICAgICBpZiAoIXJlZy50ZXN0KGxvYykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1cmwgPSBwYXRoLmpvaW4obG9jYWxSb290LCBsb2MpO1xuICAgICAgICAgICAgICAgIGxvYyA9IHJlZy50ZXN0KHVybCkgPyB1cmwgOiAoJ2ZpbGU6Ly8nICsgdXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB1c2VGaWxlUHJvdG9jb2wgPyBsb2MgOiBsb2MucmVwbGFjZSgnZmlsZTonLCAnYXNzZXRzOicpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCB2YWxpZGF0ZU1haW4gPSAobWFpbikgPT4gbWFpbiAmJiAvXFwuKGpzfGh0bWwpJC8udGVzdChtYWluKTtcbiAgICAgICAgLy8gRW50cnkgZnJvbSBtYWluXG4gICAgICAgIGlmICh2YWxpZGF0ZU1haW4ocGtnLm1haW4pKSB7XG4gICAgICAgICAgICB0aGlzLl9vcHRpb25zLmVudHJ5ID0gbWFrZUZ1bGxVcmwocGtnLm1haW4sIHRydWUpO1xuICAgICAgICAgICAgaWYgKGxvZ3NlcS5tb2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb3B0aW9ucy5tb2RlID0gbG9nc2VxLm1vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaWNvbiA9IGxvZ3NlcS5pY29uIHx8IHBrZy5pY29uO1xuICAgICAgICBpZiAoaWNvbikge1xuICAgICAgICAgICAgdGhpcy5fb3B0aW9ucy5pY29uID0gbWFrZUZ1bGxVcmwoaWNvbik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzogc3RyYXRlZ3kgZm9yIExvZ3NlcSBwbHVnaW5zIGNlbnRlclxuICAgICAgICBpZiAobG9nc2VxLmlkKSB7XG4gICAgICAgICAgICB0aGlzLl9pZCA9IGxvZ3NlcS5pZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxvZ3NlcS5pZCA9IHRoaXMuaWQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGludm9rZUhvc3RFeHBvcnRlZEFwaSgnc2F2ZV9wbHVnaW5fY29uZmlnJywgdXJsLCB7IC4uLnBrZywgbG9nc2VxIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBkZWJ1ZygnW3NhdmUgcGx1Z2luIElEIEVycm9yXSAnLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBWYWxpZGF0ZSBpZFxuICAgICAgICBjb25zdCB7IHJlZ2lzdGVyZWRQbHVnaW5zLCBpc1JlZ2lzdGVyaW5nIH0gPSB0aGlzLl9jdHg7XG4gICAgICAgIGlmIChpc1JlZ2lzdGVyaW5nICYmIHJlZ2lzdGVyZWRQbHVnaW5zLmhhcyhsb2dzZXEuaWQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXhpc3RlZEltcG9ydGVkUGx1Z2luUGFja2FnZUVycm9yKCdwcmVwYXJlIHBhY2thZ2UgRXJyb3InKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyAwLiBJbnN0YWxsIFRoZW1lc1xuICAgICAgICAgICAgICAgIGxldCB0aGVtZXMgPSBsb2dzZXEudGhlbWVzO1xuICAgICAgICAgICAgICAgIGlmICh0aGVtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fbG9hZENvbmZpZ1RoZW1lcyhBcnJheS5pc0FycmF5KHRoZW1lcykgPyB0aGVtZXMgOiBbdGhlbWVzXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBkZWJ1ZygnW3ByZXBhcmUgcGFja2FnZSBlZmZlY3QgRXJyb3JdJywgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGFzeW5jIF90cnlUb05vcm1hbGl6ZUVudHJ5KCkge1xuICAgICAgICBsZXQgeyBlbnRyeSwgc2V0dGluZ3MgfSA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgbGV0IGRldkVudHJ5ID0gc2V0dGluZ3M/LmdldCgnX2RldkVudHJ5Jyk7XG4gICAgICAgIGlmIChkZXZFbnRyeSkge1xuICAgICAgICAgICAgdGhpcy5fb3B0aW9ucy5lbnRyeSA9IGRldkVudHJ5O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZW50cnkuZW5kc1dpdGgoJy5qcycpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgc2RrUGF0aFJvb3QgPSBhd2FpdCBnZXRTREtQYXRoUm9vdCgpO1xuICAgICAgICBsZXQgZW50cnlQYXRoID0gYXdhaXQgaW52b2tlSG9zdEV4cG9ydGVkQXBpKCd3cml0ZV91c2VyX3RtcF9maWxlJywgYCR7dGhpcy5faWR9X2luZGV4Lmh0bWxgLCBgPCFkb2N0eXBlIGh0bWw+XG48aHRtbCBsYW5nPVwiZW5cIj5cbiAgPGhlYWQ+XG4gICAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gICAgPHRpdGxlPmxvZ3NlcSBwbHVnaW4gZW50cnk8L3RpdGxlPlxuICAgIDxzY3JpcHQgc3JjPVwiJHtzZGtQYXRoUm9vdH0vbHNwbHVnaW4udXNlci5qc1wiPjwvc2NyaXB0PlxuICA8L2hlYWQ+XG4gIDxib2R5PlxuICA8ZGl2IGlkPVwiYXBwXCI+PC9kaXY+XG4gIDxzY3JpcHQgc3JjPVwiJHtlbnRyeX1cIj48L3NjcmlwdD5cbiAgPC9ib2R5PlxuPC9odG1sPmApO1xuICAgICAgICB0aGlzLl9vcHRpb25zLmVudHJ5ID0gd2l0aEZpbGVQcm90b2NvbChlbnRyeVBhdGgpO1xuICAgIH1cbiAgICBhc3luYyBfbG9hZENvbmZpZ1RoZW1lcyh0aGVtZXMpIHtcbiAgICAgICAgdGhlbWVzLmZvckVhY2goKG9wdGlvbnMpID0+IHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy51cmwpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnVybC5zdGFydHNXaXRoKCdodHRwJykgJiYgdGhpcy5fbG9jYWxSb290KSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51cmwgPSBwYXRoLmpvaW4odGhpcy5fbG9jYWxSb290LCBvcHRpb25zLnVybCk7XG4gICAgICAgICAgICAgICAgLy8gZmlsZTovLyBmb3IgbmF0aXZlXG4gICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLnVybC5zdGFydHNXaXRoKCdmaWxlOicpKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMudXJsID0gJ2Fzc2V0czovLycgKyBvcHRpb25zLnVybDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3Byb3ZpZGVyOnRoZW1lJywgb3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYyBsb2FkKHJlYWR5SW5kaWNhdG9yKSB7XG4gICAgICAgIGlmICh0aGlzLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdGF0dXMgPSBQbHVnaW5Mb2NhbExvYWRTdGF0dXMuTE9BRElORztcbiAgICAgICAgdGhpcy5fbG9hZEVyciA9IHVuZGVmaW5lZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBpbnN0YWxsUGFja2FnZVRoZW1lcyA9ICgpID0+IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuZW50cnkpIHsgLy8gVGhlbWVzIHBhY2thZ2Ugbm8gZW50cnkgZmllbGRcbiAgICAgICAgICAgICAgICBpbnN0YWxsUGFja2FnZVRoZW1lcyA9IGF3YWl0IHRoaXMuX3ByZXBhcmVQYWNrYWdlQ29uZmlncygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fc2V0dXBVc2VyU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGluc3RhbGxQYWNrYWdlVGhlbWVzLmNhbGwobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCB8fCAhdGhpcy5vcHRpb25zLmVudHJ5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fdHJ5VG9Ob3JtYWxpemVFbnRyeSgpO1xuICAgICAgICAgICAgdGhpcy5fY2FsbGVyID0gbmV3IExTUGx1Z2luQ2FsbGVyKHRoaXMpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fY2FsbGVyLmNvbm5lY3RUb0NoaWxkKCk7XG4gICAgICAgICAgICBjb25zdCByZWFkeUZuID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhbGxlcj8uY2FsbFVzZXJNb2RlbChMU1BNU0dfUkVBRFkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChyZWFkeUluZGljYXRvcikge1xuICAgICAgICAgICAgICAgIHJlYWR5SW5kaWNhdG9yLnByb21pc2UudGhlbihyZWFkeUZuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlYWR5Rm4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2VzLnB1c2goYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX2NhbGxlcj8uZGVzdHJveSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGRlYnVnKCdbTG9hZCBQbHVnaW4gRXJyb3JdICcsIGUpO1xuICAgICAgICAgICAgdGhpcy5sb2dnZXI/LmVycm9yKGUpO1xuICAgICAgICAgICAgdGhpcy5fc3RhdHVzID0gUGx1Z2luTG9jYWxMb2FkU3RhdHVzLkVSUk9SO1xuICAgICAgICAgICAgdGhpcy5fbG9hZEVyciA9IGU7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2xvYWRFcnIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSBQbHVnaW5Mb2NhbExvYWRTdGF0dXMuTE9BREVEO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHJlbG9hZCgpIHtcbiAgICAgICAgZGVidWcoJ1RPRE86IHJlbG9hZCBwbHVnaW4nLCB0aGlzLmlkKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHVucmVnaXN0ZXIgSWYgdHJ1ZSBkZWxldGUgcGx1Z2luIGZpbGVzXG4gICAgICovXG4gICAgYXN5bmMgdW5sb2FkKHVucmVnaXN0ZXIgPSBmYWxzZSkge1xuICAgICAgICBpZiAodGhpcy5wZW5kaW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVucmVnaXN0ZXIpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudW5sb2FkKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0luc3RhbGxlZEluVXNlclJvb3QpIHtcbiAgICAgICAgICAgICAgICBkZWJ1ZygnVE9ETzogcmVtb3ZlIHBsdWdpbiBsb2NhbCBmaWxlcyBmcm9tIHVzZXIgaG9tZSByb290IDopJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IFBsdWdpbkxvY2FsTG9hZFN0YXR1cy5VTkxPQURJTkc7XG4gICAgICAgICAgICBjb25zdCBldmVudEJlZm9yZVVubG9hZCA9IHsgdW5yZWdpc3RlciB9O1xuICAgICAgICAgICAgLy8gc3luYyBjYWxsXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX2NhbGxlcj8uY2FsbFVzZXJNb2RlbChBV0FJVF9MU1BNU0dGbihMU1BNU0dfQkVGT1JFX1VOTE9BRCksIGV2ZW50QmVmb3JlVW5sb2FkKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2JlZm9yZXVubG9hZCcsIGV2ZW50QmVmb3JlVW5sb2FkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW2JlZm9yZXVubG9hZCBFcnJvcl0nLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCd1bmxvYWRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBkZWJ1ZygnW3BsdWdpbiB1bmxvYWQgRXJyb3JdJywgZSk7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSBQbHVnaW5Mb2NhbExvYWRTdGF0dXMuVU5MT0FERUQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgZGlzcG9zZSgpIHtcbiAgICAgICAgZm9yIChjb25zdCBmbiBvZiB0aGlzLl9kaXNwb3Nlcykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmbiAmJiAoYXdhaXQgZm4oKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5kZWJ1Z1RhZywgJ2Rpc3Bvc2UgRXJyb3InLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBjbGVhclxuICAgICAgICB0aGlzLl9kaXNwb3NlcyA9IFtdO1xuICAgIH1cbiAgICBfZGlzcG9zZShmbikge1xuICAgICAgICBpZiAoIWZuKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLl9kaXNwb3Nlcy5wdXNoKGZuKTtcbiAgICB9XG4gICAgX29uSG9zdE1vdW50ZWQoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgYWN0b3IgPSB0aGlzLl9jdHguaG9zdE1vdW50ZWRBY3RvcjtcbiAgICAgICAgaWYgKCFhY3RvciB8fCBhY3Rvci5zZXR0bGVkKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYWN0b3I/LnByb21pc2UudGhlbihjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IGlzSW5zdGFsbGVkSW5Vc2VyUm9vdCgpIHtcbiAgICAgICAgY29uc3QgdXNlclJvb3QgPSB0aGlzLl9jdHgub3B0aW9ucy5sb2NhbFVzZXJDb25maWdSb290O1xuICAgICAgICBjb25zdCBwbHVnUm9vdCA9IHRoaXMuX2xvY2FsUm9vdDtcbiAgICAgICAgcmV0dXJuIHVzZXJSb290ICYmIHBsdWdSb290ICYmIHBsdWdSb290LnN0YXJ0c1dpdGgodXNlclJvb3QpO1xuICAgIH1cbiAgICBnZXQgbG9hZGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzID09PSBQbHVnaW5Mb2NhbExvYWRTdGF0dXMuTE9BREVEO1xuICAgIH1cbiAgICBnZXQgcGVuZGluZygpIHtcbiAgICAgICAgcmV0dXJuIFtQbHVnaW5Mb2NhbExvYWRTdGF0dXMuTE9BRElORywgUGx1Z2luTG9jYWxMb2FkU3RhdHVzLlVOTE9BRElOR11cbiAgICAgICAgICAgIC5pbmNsdWRlcyh0aGlzLl9zdGF0dXMpO1xuICAgIH1cbiAgICBnZXQgc3RhdHVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzO1xuICAgIH1cbiAgICBnZXQgc2V0dGluZ3MoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuc2V0dGluZ3M7XG4gICAgfVxuICAgIGdldCBsb2dnZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMubG9nZ2VyO1xuICAgIH1cbiAgICBnZXQgZGlzYWJsZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzPy5nZXQoJ2Rpc2FibGVkJyk7XG4gICAgfVxuICAgIGdldCBjYWxsZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jYWxsZXI7XG4gICAgfVxuICAgIGdldCBpZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lkO1xuICAgIH1cbiAgICBnZXQgc2hhZG93KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLm1vZGUgPT09ICdzaGFkb3cnO1xuICAgIH1cbiAgICBnZXQgb3B0aW9ucygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX29wdGlvbnM7XG4gICAgfVxuICAgIGdldCB0aGVtZU1ncigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RoZW1lTWdyO1xuICAgIH1cbiAgICBnZXQgZGVidWdUYWcoKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLl9vcHRpb25zPy5uYW1lO1xuICAgICAgICByZXR1cm4gYCMke3RoaXMuX2lkfSAke25hbWUgPz8gJyd9YDtcbiAgICB9XG4gICAgZ2V0IGxvY2FsUm9vdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvY2FsUm9vdCB8fCB0aGlzLl9vcHRpb25zLnVybDtcbiAgICB9XG4gICAgZ2V0IGxvYWRFcnIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb2FkRXJyO1xuICAgIH1cbiAgICBnZXQgdXNlclNldHRpbmdzRmlsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3VzZXJTZXR0aW5nc0ZpbGU7XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgY29uc3QganNvbiA9IHsgLi4udGhpcy5vcHRpb25zIH07XG4gICAgICAgIGpzb24uaWQgPSB0aGlzLmlkO1xuICAgICAgICBqc29uLmVyciA9IHRoaXMubG9hZEVycjtcbiAgICAgICAganNvbi51c2YgPSB0aGlzLnVzZXJTZXR0aW5nc0ZpbGU7XG4gICAgICAgIHJldHVybiBqc29uO1xuICAgIH1cbn1cbi8qKlxuICogSG9zdCBwbHVnaW4gY29yZVxuICovXG5jbGFzcyBMU1BsdWdpbkNvcmUgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSBfb3B0aW9uc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKF9vcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX29wdGlvbnMgPSBfb3B0aW9ucztcbiAgICAgICAgdGhpcy5faXNSZWdpc3RlcmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9ob3N0TW91bnRlZEFjdG9yID0gZGVmZXJyZWQoKTtcbiAgICAgICAgdGhpcy5fdXNlclByZWZlcmVuY2VzID0ge307XG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyZWRUaGVtZXMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyZWRQbHVnaW5zID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBhc3luYyBsb2FkVXNlclByZWZlcmVuY2VzKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBhd2FpdCBpbnZva2VIb3N0RXhwb3J0ZWRBcGkoYGxvYWRfdXNlcl9wcmVmZXJlbmNlc2ApO1xuICAgICAgICAgICAgaWYgKHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLl91c2VyUHJlZmVyZW5jZXMsIHNldHRpbmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZGVidWcoJ1tsb2FkIHVzZXIgcHJlZmVyZW5jZXMgRXJyb3JdJywgZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgc2F2ZVVzZXJQcmVmZXJlbmNlcyhzZXR0aW5ncykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLl91c2VyUHJlZmVyZW5jZXMsIHNldHRpbmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IGludm9rZUhvc3RFeHBvcnRlZEFwaShgc2F2ZV91c2VyX3ByZWZlcmVuY2VzYCwgdGhpcy5fdXNlclByZWZlcmVuY2VzKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZGVidWcoJ1tzYXZlIHVzZXIgcHJlZmVyZW5jZXMgRXJyb3JdJywgZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgYWN0aXZhdGVVc2VyUHJlZmVyZW5jZXMoKSB7XG4gICAgICAgIGNvbnN0IHsgdGhlbWUgfSA9IHRoaXMuX3VzZXJQcmVmZXJlbmNlcztcbiAgICAgICAgLy8gMC4gdGhlbWVcbiAgICAgICAgaWYgKHRoZW1lKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNlbGVjdFRoZW1lKHRoZW1lLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHBsdWdpbnNcbiAgICAgKiBAcGFyYW0gaW5pdGlhbFxuICAgICAqL1xuICAgIGFzeW5jIHJlZ2lzdGVyKHBsdWdpbnMsIGluaXRpYWwgPSBmYWxzZSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocGx1Z2lucykpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucmVnaXN0ZXIoW3BsdWdpbnNdKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5faXNSZWdpc3RlcmluZyA9IHRydWU7XG4gICAgICAgICAgICBjb25zdCB1c2VyQ29uZmlnUm9vdCA9IHRoaXMuX29wdGlvbnMubG9jYWxVc2VyQ29uZmlnUm9vdDtcbiAgICAgICAgICAgIGNvbnN0IHJlYWR5SW5kaWNhdG9yID0gdGhpcy5fcmVhZHlJbmRpY2F0b3IgPSBkZWZlcnJlZCgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkVXNlclByZWZlcmVuY2VzKCk7XG4gICAgICAgICAgICBjb25zdCBleHRlcm5hbHMgPSBuZXcgU2V0KHRoaXMuX3VzZXJQcmVmZXJlbmNlcy5leHRlcm5hbHMgfHwgW10pO1xuICAgICAgICAgICAgaWYgKGluaXRpYWwpIHtcbiAgICAgICAgICAgICAgICBwbHVnaW5zID0gcGx1Z2lucy5jb25jYXQoWy4uLmV4dGVybmFsc10uZmlsdGVyKHVybCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhcGx1Z2lucy5sZW5ndGggfHwgcGx1Z2lucy5ldmVyeSgocCkgPT4gIXAuZW50cnkgJiYgKHAudXJsICE9PSB1cmwpKTtcbiAgICAgICAgICAgICAgICB9KS5tYXAodXJsID0+ICh7IHVybCB9KSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBwbHVnaW5PcHRpb25zIG9mIHBsdWdpbnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHVybCB9ID0gcGx1Z2luT3B0aW9ucztcbiAgICAgICAgICAgICAgICBjb25zdCBwbHVnaW5Mb2NhbCA9IG5ldyBQbHVnaW5Mb2NhbChwbHVnaW5PcHRpb25zLCB0aGlzLCB0aGlzKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lTGFiZWwgPSBgW0xPQUQgUGx1Z2luXSAke3BsdWdpbkxvY2FsLmRlYnVnVGFnfWA7XG4gICAgICAgICAgICAgICAgY29uc29sZS50aW1lKHRpbWVMYWJlbCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luTG9jYWwubG9hZChyZWFkeUluZGljYXRvcik7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBsb2FkRXJyIH0gPSBwbHVnaW5Mb2NhbDtcbiAgICAgICAgICAgICAgICBpZiAobG9hZEVycikge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgW0ZhaWxlZCBMT0FEIFBsdWdpbl0gI2AsIHBsdWdpbk9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgbG9hZEVycik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkRXJyIGluc3RhbmNlb2YgSWxsZWdhbFBsdWdpblBhY2thZ2VFcnJvciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZEVyciBpbnN0YW5jZW9mIEV4aXN0ZWRJbXBvcnRlZFBsdWdpblBhY2thZ2VFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogbm90aWZ5IGdsb2JhbCBsb2cgc3lzdGVtP1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS50aW1lRW5kKHRpbWVMYWJlbCk7XG4gICAgICAgICAgICAgICAgcGx1Z2luTG9jYWwuc2V0dGluZ3M/Lm9uKCdjaGFuZ2UnLCAoYSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3NldHRpbmdzLWNoYW5nZWQnLCBwbHVnaW5Mb2NhbC5pZCwgYSk7XG4gICAgICAgICAgICAgICAgICAgIHBsdWdpbkxvY2FsLmNhbGxlcj8uY2FsbFVzZXJNb2RlbChMU1BNU0dfU0VUVElOR1MsIHsgcGF5bG9hZDogYSB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWdpc3RlcmVkUGx1Z2lucy5zZXQocGx1Z2luTG9jYWwuaWQsIHBsdWdpbkxvY2FsKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3JlZ2lzdGVyZWQnLCBwbHVnaW5Mb2NhbCk7XG4gICAgICAgICAgICAgICAgLy8gZXh0ZXJuYWwgcGx1Z2luc1xuICAgICAgICAgICAgICAgIGlmICghcGx1Z2luTG9jYWwuaXNJbnN0YWxsZWRJblVzZXJSb290KSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVybmFscy5hZGQodXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVVc2VyUHJlZmVyZW5jZXMoeyBleHRlcm5hbHM6IEFycmF5LmZyb20oZXh0ZXJuYWxzKSB9KTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYWN0aXZhdGVVc2VyUHJlZmVyZW5jZXMoKTtcbiAgICAgICAgICAgIHJlYWR5SW5kaWNhdG9yLnJlc29sdmUoJ3JlYWR5Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLl9pc1JlZ2lzdGVyaW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgcmVsb2FkKHBsdWdpbnMpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHBsdWdpbnMpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlbG9hZChbcGx1Z2luc10pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgaWRlbnRpdHkgb2YgcGx1Z2lucykge1xuICAgICAgICAgICAgY29uc3QgcCA9IHRoaXMuZW5zdXJlUGx1Z2luKGlkZW50aXR5KTtcbiAgICAgICAgICAgIGF3YWl0IHAucmVsb2FkKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgdW5yZWdpc3RlcihwbHVnaW5zKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShwbHVnaW5zKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51bnJlZ2lzdGVyKFtwbHVnaW5zXSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdW5yZWdpc3RlcmVkRXh0ZXJuYWxzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgaWRlbnRpdHkgb2YgcGx1Z2lucykge1xuICAgICAgICAgICAgY29uc3QgcCA9IHRoaXMuZW5zdXJlUGx1Z2luKGlkZW50aXR5KTtcbiAgICAgICAgICAgIGlmICghcC5pc0luc3RhbGxlZEluVXNlclJvb3QpIHtcbiAgICAgICAgICAgICAgICB1bnJlZ2lzdGVyZWRFeHRlcm5hbHMucHVzaChwLm9wdGlvbnMudXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IHAudW5sb2FkKHRydWUpO1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJlZFBsdWdpbnMuZGVsZXRlKGlkZW50aXR5KTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgndW5yZWdpc3RlcmVkJywgaWRlbnRpdHkpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBleHRlcm5hbHMgPSB0aGlzLl91c2VyUHJlZmVyZW5jZXMuZXh0ZXJuYWxzIHx8IFtdO1xuICAgICAgICBpZiAoZXh0ZXJuYWxzLmxlbmd0aCAmJiB1bnJlZ2lzdGVyZWRFeHRlcm5hbHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVVc2VyUHJlZmVyZW5jZXMoe1xuICAgICAgICAgICAgICAgIGV4dGVybmFsczogZXh0ZXJuYWxzLmZpbHRlcigoaXQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICF1bnJlZ2lzdGVyZWRFeHRlcm5hbHMuaW5jbHVkZXMoaXQpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBlbmFibGUocGx1Z2luKSB7XG4gICAgICAgIGNvbnN0IHAgPSB0aGlzLmVuc3VyZVBsdWdpbihwbHVnaW4pO1xuICAgICAgICBpZiAocC5wZW5kaW5nKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmVtaXQoJ2JlZm9yZWVuYWJsZScpO1xuICAgICAgICBwLnNldHRpbmdzPy5zZXQoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVtaXQoJ2VuYWJsZWQnLCBwLmlkKTtcbiAgICB9XG4gICAgYXN5bmMgZGlzYWJsZShwbHVnaW4pIHtcbiAgICAgICAgY29uc3QgcCA9IHRoaXMuZW5zdXJlUGx1Z2luKHBsdWdpbik7XG4gICAgICAgIGlmIChwLnBlbmRpbmcpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZW1pdCgnYmVmb3JlZGlzYWJsZScpO1xuICAgICAgICBwLnNldHRpbmdzPy5zZXQoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuZW1pdCgnZGlzYWJsZWQnLCBwLmlkKTtcbiAgICB9XG4gICAgYXN5bmMgX2hvb2sobnMsIHR5cGUsIHBheWxvYWQsIHBpZCkge1xuICAgICAgICBmb3IgKGNvbnN0IFtfLCBwXSBvZiB0aGlzLl9yZWdpc3RlcmVkUGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKCFwaWQgfHwgcGlkID09PSBwLmlkKSB7XG4gICAgICAgICAgICAgICAgcC5jYWxsZXI/LmNhbGxVc2VyTW9kZWwoTFNQTVNHLCB7XG4gICAgICAgICAgICAgICAgICAgIG5zLCB0eXBlOiBzbmFrZUNhc2UodHlwZSksIHBheWxvYWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBob29rQXBwKHR5cGUsIHBheWxvYWQsIHBpZCkge1xuICAgICAgICB0aGlzLl9ob29rKGBob29rOmFwcGAsIHR5cGUsIHBheWxvYWQsIHBpZCk7XG4gICAgfVxuICAgIGhvb2tFZGl0b3IodHlwZSwgcGF5bG9hZCwgcGlkKSB7XG4gICAgICAgIHRoaXMuX2hvb2soYGhvb2s6ZWRpdG9yYCwgdHlwZSwgcGF5bG9hZCwgcGlkKTtcbiAgICB9XG4gICAgX2V4ZWNEaXJlY3RpdmUodGFnLCAuLi5wYXJhbXMpIHtcbiAgICB9XG4gICAgZW5zdXJlUGx1Z2luKHBsdWdpbikge1xuICAgICAgICBpZiAocGx1Z2luIGluc3RhbmNlb2YgUGx1Z2luTG9jYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBwbHVnaW47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcCA9IHRoaXMuX3JlZ2lzdGVyZWRQbHVnaW5zLmdldChwbHVnaW4pO1xuICAgICAgICBpZiAoIXApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgcGx1Z2luICMke3BsdWdpbn0gbm90IGV4aXN0ZWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfVxuICAgIGhvc3RNb3VudGVkKCkge1xuICAgICAgICB0aGlzLl9ob3N0TW91bnRlZEFjdG9yLnJlc29sdmUoKTtcbiAgICB9XG4gICAgZ2V0IHJlZ2lzdGVyZWRQbHVnaW5zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJlZFBsdWdpbnM7XG4gICAgfVxuICAgIGdldCBvcHRpb25zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fb3B0aW9ucztcbiAgICB9XG4gICAgZ2V0IHJlYWR5SW5kaWNhdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVhZHlJbmRpY2F0b3I7XG4gICAgfVxuICAgIGdldCBob3N0TW91bnRlZEFjdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faG9zdE1vdW50ZWRBY3RvcjtcbiAgICB9XG4gICAgZ2V0IGlzUmVnaXN0ZXJpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc1JlZ2lzdGVyaW5nO1xuICAgIH1cbiAgICBnZXQgdGhlbWVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJlZFRoZW1lcztcbiAgICB9XG4gICAgYXN5bmMgcmVnaXN0ZXJUaGVtZShpZCwgb3B0KSB7XG4gICAgICAgIGRlYnVnKCdyZWdpc3RlcmVkIFRoZW1lICMnLCBpZCwgb3B0KTtcbiAgICAgICAgaWYgKCFpZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IHRoZW1lcyA9IHRoaXMuX3JlZ2lzdGVyZWRUaGVtZXMuZ2V0KGlkKTtcbiAgICAgICAgaWYgKCF0aGVtZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyZWRUaGVtZXMuc2V0KGlkLCB0aGVtZXMgPSBbXSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhlbWVzLnB1c2gob3B0KTtcbiAgICAgICAgdGhpcy5lbWl0KCd0aGVtZS1jaGFuZ2VkJywgdGhpcy50aGVtZXMsIHsgaWQsIC4uLm9wdCB9KTtcbiAgICB9XG4gICAgYXN5bmMgc2VsZWN0VGhlbWUob3B0LCBlZmZlY3QgPSB0cnVlKSB7XG4gICAgICAgIHNldHVwSW5qZWN0ZWRUaGVtZShvcHQ/LnVybCk7XG4gICAgICAgIHRoaXMuZW1pdCgndGhlbWUtc2VsZWN0ZWQnLCBvcHQpO1xuICAgICAgICBlZmZlY3QgJiYgdGhpcy5zYXZlVXNlclByZWZlcmVuY2VzKHsgdGhlbWU6IG9wdCB9KTtcbiAgICB9XG4gICAgYXN5bmMgdW5yZWdpc3RlclRoZW1lKGlkKSB7XG4gICAgICAgIGRlYnVnKCd1bnJlZ2lzdGVyZWQgVGhlbWUgIycsIGlkKTtcbiAgICAgICAgaWYgKCF0aGlzLl9yZWdpc3RlcmVkVGhlbWVzLmhhcyhpZCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyZWRUaGVtZXMuZGVsZXRlKGlkKTtcbiAgICAgICAgdGhpcy5lbWl0KCd0aGVtZS1jaGFuZ2VkJywgdGhpcy50aGVtZXMsIHsgaWQgfSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0dXBQbHVnaW5Db3JlKG9wdGlvbnMpIHtcbiAgICBjb25zdCBwbHVnaW5Db3JlID0gbmV3IExTUGx1Z2luQ29yZShvcHRpb25zKTtcbiAgICBkZWJ1ZygnPT09IPCflJcgU2V0dXAgTG9nc2VxIFBsdWdpbiBTeXN0ZW0g8J+UlyA9PT0nKTtcbiAgICB3aW5kb3cuTFNQbHVnaW5Db3JlID0gcGx1Z2luQ29yZTtcbn1cbmV4cG9ydCB7IFBsdWdpbkxvY2FsLCBwbHVnaW5IZWxwZXJzLCBzZXR1cFBsdWdpbkNvcmUgfTtcbiJdLCJzb3VyY2VSb290IjoiIn0=