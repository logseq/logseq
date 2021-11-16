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
		let namespacesCache;
		let enabledCache;

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
			get: () => {
				if (enableOverride !== null) {
					return enableOverride;
				}
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}

				return enabledCache;
			},
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
		createDebug.namespaces = namespaces;

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

/*! @license DOMPurify 2.3.1 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/2.3.1/LICENSE */

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

  var html$1 = freeze(['accept', 'action', 'align', 'alt', 'autocapitalize', 'autocomplete', 'autopictureinpicture', 'autoplay', 'background', 'bgcolor', 'border', 'capture', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'clear', 'color', 'cols', 'colspan', 'controls', 'controlslist', 'coords', 'crossorigin', 'datetime', 'decoding', 'default', 'dir', 'disabled', 'disablepictureinpicture', 'disableremoteplayback', 'download', 'draggable', 'enctype', 'enterkeyhint', 'face', 'for', 'headers', 'height', 'hidden', 'high', 'href', 'hreflang', 'id', 'inputmode', 'integrity', 'ismap', 'kind', 'label', 'lang', 'list', 'loading', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple', 'muted', 'name', 'noshade', 'novalidate', 'nowrap', 'open', 'optimum', 'pattern', 'placeholder', 'playsinline', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'rev', 'reversed', 'role', 'rows', 'rowspan', 'spellcheck', 'scope', 'selected', 'shape', 'size', 'sizes', 'span', 'srclang', 'start', 'src', 'srcset', 'step', 'style', 'summary', 'tabindex', 'title', 'translate', 'type', 'usemap', 'valign', 'value', 'width', 'xmlns', 'slot']);

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
    DOMPurify.version = '2.3.1';

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
        createDocumentFragment = _document.createDocumentFragment,
        getElementsByTagName = _document.getElementsByTagName;
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
    var FORBID_CONTENTS = null;
    var DEFAULT_FORBID_CONTENTS = addToSet({}, ['annotation-xml', 'audio', 'colgroup', 'desc', 'foreignobject', 'head', 'iframe', 'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'noembed', 'noframes', 'noscript', 'plaintext', 'script', 'style', 'svg', 'template', 'thead', 'title', 'video', 'xmp']);

    /* Tags that are safe for data: URIs */
    var DATA_URI_TAGS = null;
    var DEFAULT_DATA_URI_TAGS = addToSet({}, ['audio', 'video', 'img', 'source', 'image', 'track']);

    /* Attributes safe for values like "javascript:" */
    var URI_SAFE_ATTRIBUTES = null;
    var DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ['alt', 'class', 'for', 'id', 'label', 'name', 'pattern', 'placeholder', 'role', 'summary', 'title', 'value', 'style', 'xmlns']);

    var MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
    var SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
    var HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
    /* Document namespace */
    var NAMESPACE = HTML_NAMESPACE;
    var IS_EMPTY_INPUT = false;

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
      FORBID_CONTENTS = 'FORBID_CONTENTS' in cfg ? addToSet({}, cfg.FORBID_CONTENTS) : DEFAULT_FORBID_CONTENTS;
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
      NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
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

      if (cfg.FORBID_CONTENTS) {
        if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
          FORBID_CONTENTS = clone(FORBID_CONTENTS);
        }

        addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS);
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
        // eslint-disable-next-line unicorn/prefer-dom-node-remove
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
      /*
       * Use the DOMParser API by default, fallback later if needs be
       * DOMParser not work for svg when has multiple root element.
       */
      if (NAMESPACE === HTML_NAMESPACE) {
        try {
          doc = new DOMParser().parseFromString(dirtyPayload, 'text/html');
        } catch (_) {}
      }

      /* Use createHTMLDocument in case DOMParser is not available */
      if (!doc || !doc.documentElement) {
        doc = implementation.createDocument(NAMESPACE, 'template', null);
        try {
          doc.documentElement.innerHTML = IS_EMPTY_INPUT ? '' : dirtyPayload;
        } catch (_) {
          // Syntax error if dirtyPayload is invalid xml
        }
      }

      var body = doc.body || doc.documentElement;

      if (dirty && leadingWhitespace) {
        body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
      }

      /* Work on whole document or just its body */
      if (NAMESPACE === HTML_NAMESPACE) {
        return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? 'html' : 'body')[0];
      }

      return WHOLE_DOCUMENT ? doc.documentElement : body;
    };

    /**
     * _createIterator
     *
     * @param  {Document} root document/fragment to create iterator for
     * @return {Iterator} iterator instance
     */
    var _createIterator = function _createIterator(root) {
      return createNodeIterator.call(root.ownerDocument || root, root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT, null, false);
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

      /* Mitigate a problem with templates inside select */
      if (tagName === 'select' && regExpTest(/<template/i, currentNode.innerHTML)) {
        _forceRemove(currentNode);
        return true;
      }

      /* Remove element if anything forbids its presence */
      if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
        /* Keep content except for bad-listed elements */
        if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
          var parentNode = getParentNode(currentNode) || currentNode.parentNode;
          var childNodes = getChildNodes(currentNode) || currentNode.childNodes;

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
      if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR$$1, lcName)) ; else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$$1, lcName)) ; else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
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
      IS_EMPTY_INPUT = !dirty;
      if (IS_EMPTY_INPUT) {
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
          // eslint-disable-next-line unicorn/prefer-dom-node-append
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
            // eslint-disable-next-line unicorn/prefer-dom-node-append
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
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js");
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(debug__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _postmate__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./postmate */ "./src/postmate/index.ts");
/* harmony import */ var eventemitter3__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! eventemitter3 */ "./node_modules/eventemitter3/index.js");
/* harmony import */ var eventemitter3__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(eventemitter3__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _helpers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./helpers */ "./src/helpers.ts");
/* harmony import */ var _LSPlugin_shadow__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./LSPlugin.shadow */ "./src/LSPlugin.shadow.ts");





const debug = debug__WEBPACK_IMPORTED_MODULE_0___default()('LSPlugin:caller');
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
class LSPluginCaller extends (eventemitter3__WEBPACK_IMPORTED_MODULE_2___default()) {
    _pluginLocal;
    _connected = false;
    _parent;
    _child;
    _shadow;
    _status;
    _userModel = {};
    _call;
    _callUserModel;
    _debugTag = '';
    constructor(_pluginLocal) {
        super();
        this._pluginLocal = _pluginLocal;
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
    // run in sandbox
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
            [LSPMSG_READY]: async (baseInfo) => {
                // dynamically setup common msg handler
                model[LSPMSGFn(baseInfo?.pid)] = ({ type, payload }) => {
                    debug(`[call from host (_call)] ${this._debugTag}`, type, payload);
                    // host._call without async
                    caller.emit(type, payload);
                };
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
                debug(`[call from host (async)] ${this._debugTag}`, ns, type, payload);
                if (ns && ns.startsWith('hook')) {
                    caller.emit(`${ns}:${type}`, payload);
                    return;
                }
                caller.emit(type, payload);
            },
            [LSPMSG_SYNC]: ({ _sync, result }) => {
                debug(`[sync reply] #${_sync}`, result);
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
        const pm = new _postmate__WEBPACK_IMPORTED_MODULE_1__.Model(model);
        const handshake = pm.sendHandshakeReply();
        this._status = 'pending';
        await handshake.then((refParent) => {
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
                    debug(`[model method] #${type} not existed`);
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
    // run in host
    async _setupIframeSandbox() {
        const pl = this._pluginLocal;
        const id = pl.id;
        const url = new URL(pl.options.entry);
        url.searchParams
            .set(`__v__`, _helpers__WEBPACK_IMPORTED_MODULE_3__.IS_DEV ? Date.now().toString() : pl.options.version);
        // clear zombie sandbox
        const zb = document.querySelector(`#${id}`);
        if (zb)
            zb.parentElement.removeChild(zb);
        const cnt = document.createElement('div');
        cnt.classList.add('lsp-iframe-sandbox-container');
        cnt.id = id;
        // TODO: apply any container layout data
        {
            const mainLayoutInfo = this._pluginLocal.settings.get('layout')?.[0];
            if (mainLayoutInfo) {
                cnt.dataset.inited_layout = 'true';
                const { width, height, left, top } = mainLayoutInfo;
                Object.assign(cnt.style, {
                    width: width + 'px', height: height + 'px',
                    left: left + 'px', top: top + 'px'
                });
            }
        }
        document.body.appendChild(cnt);
        const pt = new _postmate__WEBPACK_IMPORTED_MODULE_1__.Postmate({
            id: id + '_iframe', container: cnt, url: url.href,
            classListArray: ['lsp-iframe-sandbox'],
            model: { baseInfo: JSON.parse(JSON.stringify(pl.toJSON())) }
        });
        let handshake = pt.sendHandshake();
        this._status = 'pending';
        // timeout for handshake
        let timer;
        return new Promise((resolve, reject) => {
            timer = setTimeout(() => {
                reject(new Error(`handshake Timeout`));
            }, 3 * 1000); // 3secs
            handshake.then((refChild) => {
                this._parent = refChild;
                this._connected = true;
                this.emit('connected');
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
            debug('[iframe sandbox] error', e);
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
            debug('[shadow sandbox] error', e);
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
        return this._parent?.frame.parentNode;
    }
    _getSandboxShadowContainer() {
        return this._shadow?.frame.parentNode;
    }
    _getSandboxIframeRoot() {
        return this._parent?.frame;
    }
    _getSandboxShadowRoot() {
        return this._shadow?.frame;
    }
    set debugTag(value) {
        this._debugTag = value;
    }
    async destroy() {
        let root = null;
        if (this._parent) {
            root = this._getSandboxIframeContainer();
            await this._parent.destroy();
        }
        if (this._shadow) {
            root = this._getSandboxShadowContainer();
            this._shadow.destroy();
        }
        root?.parentNode.removeChild(root);
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
    _pluginLocal;
    _frame;
    _root;
    _loaded = false;
    _unmountFns = [];
    constructor(_pluginLocal) {
        super();
        this._pluginLocal = _pluginLocal;
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
 * @param type (key of group commands)
 * @param opts
 * @param action
 */
function registerSimpleCommand(type, opts, action) {
    if (typeof action !== 'function') {
        return false;
    }
    const { key, label, desc, palette } = opts;
    const eventKey = `SimpleCommandHook${key}${++registeredCmdUid}`;
    this.Editor['on' + eventKey](action);
    this.caller?.call(`api:call`, {
        method: 'register-plugin-simple-command',
        args: [this.baseInfo.id, [{ key, label, type, desc }, ['editor/hook', eventKey]], palette]
    });
}
const app = {
    registerCommand: registerSimpleCommand,
    registerCommandPalette(opts, action) {
        const { key, label } = opts;
        const group = 'global-palette-command';
        return registerSimpleCommand.call(this, group, { key, label, palette: true }, action);
    },
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
    },
    setFullScreen(flag) {
        const sf = (...args) => this._callWin('setFullScreen', ...args);
        if (flag === 'toggle') {
            this._callWin('isFullScreen').then(r => {
                r ? sf() : sf(true);
            });
        }
        else {
            flag ? sf(true) : sf();
        }
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
    _baseInfo;
    _caller;
    /**
     * @private
     */
    _connected = false;
    /**
     * ui frame identities
     * @private
     */
    _ui = new Map();
    _fileStorage;
    /**
     * handler of before unload plugin
     * @private
     */
    _beforeunloadCallback;
    /**
     * @param _baseInfo
     * @param _caller
     */
    constructor(_baseInfo, _caller) {
        super();
        this._baseInfo = _baseInfo;
        this._caller = _caller;
        _caller.on('sys:ui:visible', (payload) => {
            if (payload?.toggle) {
                this.toggleMainUI();
            }
        });
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
    ensureConnected() {
        if (!this._connected) {
            throw new Error('not connected');
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
        const state = this._ui.get(KEY_MAIN_UI);
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
    resolveResourceFullUrl(filePath) {
        this.ensureConnected();
        if (!filePath)
            return;
        filePath = filePath.replace(/^[.\\/]+/, '');
        return (0,_helpers__WEBPACK_IMPORTED_MODULE_0__.safetyPathJoin)(this._baseInfo.lsr, filePath);
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
                        tag, method: propKey, args: args
                    });
                };
            }
        });
    }
    /**
     * @param args
     */
    _callWin(...args) {
        return this._caller.callAsync(`api:call`, {
            method: '_callMainWin',
            args: args
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
/* harmony export */   "path": () => (/* binding */ path),
/* harmony export */   "IS_DEV": () => (/* binding */ IS_DEV),
/* harmony export */   "PROTOCOL_FILE": () => (/* binding */ PROTOCOL_FILE),
/* harmony export */   "PROTOCOL_LSP": () => (/* binding */ PROTOCOL_LSP),
/* harmony export */   "URL_LSP": () => (/* binding */ URL_LSP),
/* harmony export */   "getAppPathRoot": () => (/* binding */ getAppPathRoot),
/* harmony export */   "getSDKPathRoot": () => (/* binding */ getSDKPathRoot),
/* harmony export */   "isObject": () => (/* binding */ isObject),
/* harmony export */   "deepMerge": () => (/* binding */ deepMerge),
/* harmony export */   "genID": () => (/* binding */ genID),
/* harmony export */   "ucFirst": () => (/* binding */ ucFirst),
/* harmony export */   "withFileProtocol": () => (/* binding */ withFileProtocol),
/* harmony export */   "safetyPathJoin": () => (/* binding */ safetyPathJoin),
/* harmony export */   "safetyPathNormalize": () => (/* binding */ safetyPathNormalize),
/* harmony export */   "deferred": () => (/* binding */ deferred),
/* harmony export */   "invokeHostExportedApi": () => (/* binding */ invokeHostExportedApi),
/* harmony export */   "setupIframeSandbox": () => (/* binding */ setupIframeSandbox),
/* harmony export */   "setupInjectedStyle": () => (/* binding */ setupInjectedStyle),
/* harmony export */   "setupInjectedUI": () => (/* binding */ setupInjectedUI),
/* harmony export */   "transformableEvent": () => (/* binding */ transformableEvent),
/* harmony export */   "setupInjectedTheme": () => (/* binding */ setupInjectedTheme)
/* harmony export */ });
/* harmony import */ var snake_case__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! snake-case */ "./node_modules/snake-case/dist.es2015/index.js");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! path */ "./node_modules/path/path.js");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var dompurify__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! dompurify */ "./node_modules/dompurify/dist/purify.js");
/* harmony import */ var dompurify__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(dompurify__WEBPACK_IMPORTED_MODULE_1__);



const path = navigator.platform.toLowerCase() === 'win32' ? path__WEBPACK_IMPORTED_MODULE_0__.win32 : path__WEBPACK_IMPORTED_MODULE_0__.posix;
const IS_DEV = "development" === 'development';
const PROTOCOL_FILE = 'file://';
const PROTOCOL_LSP = 'lsp://';
const URL_LSP = PROTOCOL_LSP + 'logseq.io/';
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
    return safetyPathJoin(appPathRoot, 'js');
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
    const reg = /^(http|file|lsp)/;
    if (!reg.test(path)) {
        path = PROTOCOL_FILE + path;
    }
    return path;
}
function safetyPathJoin(basePath, ...parts) {
    try {
        const url = new URL(basePath);
        if (!url.origin)
            throw new Error(null);
        const fullPath = path.join(basePath.substr(url.origin.length), ...parts);
        return url.origin + fullPath;
    }
    catch (e) {
        return path.join(basePath, ...parts);
    }
}
function safetyPathNormalize(basePath) {
    if (!basePath?.match(/^(http?|lsp|assets):/)) {
        basePath = path.normalize(basePath);
    }
    return basePath;
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
    method = method?.startsWith('_call') ? method :
        method?.replace(/^[_$]+/, '');
    const method1 = (0,snake_case__WEBPACK_IMPORTED_MODULE_2__.snakeCase)(method);
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
const injectedUIEffects = new Map();
function setupInjectedUI(ui, attrs, initialCallback) {
    let slot = '';
    let selector;
    let float;
    const pl = this;
    if ('slot' in ui) {
        slot = ui.slot;
        selector = `#${slot}`;
    }
    else if ('path' in ui) {
        selector = ui.path;
    }
    else {
        float = true;
    }
    const id = `${ui.key}-${slot}-${pl.id}`;
    const key = `${ui.key}--${pl.id}`;
    const target = float ? document.body : (selector && document.querySelector(selector));
    if (!target) {
        console.warn(`${this.debugTag} can not resolve selector target ${selector}`);
        return;
    }
    if (ui.template) {
        // safe template
        ui.template = dompurify__WEBPACK_IMPORTED_MODULE_1___default().sanitize(ui.template, {
            ADD_TAGS: ['iframe'],
            ALLOW_UNKNOWN_PROTOCOLS: true,
            ADD_ATTR: ['allow', 'src', 'allowfullscreen', 'frameborder', 'scrolling']
        });
    }
    else { // remove ui
        injectedUIEffects.get(id)?.call(null);
        return;
    }
    let el = document.querySelector(`#${id}`);
    let content = float ? el?.querySelector('.ls-ui-float-content') : el;
    if (content) {
        content.innerHTML = ui.template;
        // update attributes
        attrs && Object.entries(attrs).forEach(([k, v]) => {
            el.setAttribute(k, v);
        });
        let positionDirty = el.dataset.dx != null;
        ui.style && Object.entries(ui.style).forEach(([k, v]) => {
            if (positionDirty && [
                'left', 'top', 'bottom', 'right', 'width', 'height'
            ].includes(k)) {
                return;
            }
            el.style[k] = v;
        });
        return;
    }
    el = document.createElement('div');
    el.id = id;
    el.dataset.injectedUi = key || '';
    if (float) {
        content = document.createElement('div');
        content.classList.add('ls-ui-float-content');
        el.appendChild(content);
    }
    else {
        content = el;
    }
    // TODO: enhance template
    content.innerHTML = ui.template;
    attrs && Object.entries(attrs).forEach(([k, v]) => {
        el.setAttribute(k, v);
    });
    ui.style && Object.entries(ui.style).forEach(([k, v]) => {
        el.style[k] = v;
    });
    let teardownUI;
    let disposeFloat;
    if (float) {
        el.setAttribute('draggable', 'true');
        el.setAttribute('resizable', 'true');
        ui.close && (el.dataset.close = ui.close);
        el.classList.add('lsp-ui-float-container', 'visible');
        disposeFloat = (pl._setupResizableContainer(el, key),
            pl._setupDraggableContainer(el, { key, close: () => teardownUI(), title: attrs?.title }));
    }
    if (!!slot && ui.reset) {
        const exists = Array.from(target.querySelectorAll('[data-injected-ui]'))
            .map((it) => it.id);
        exists?.forEach((exist) => {
            injectedUIEffects.get(exist)?.call(null);
        });
    }
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
    // callback
    initialCallback?.({ el, float });
    teardownUI = () => {
        disposeFloat?.();
        injectedUIEffects.delete(id);
        target.removeChild(el);
    };
    injectedUIEffects.set(id, teardownUI);
    return teardownUI;
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
        try {
            document.head.removeChild(link);
        }
        catch (e) {
            console.error(e);
        }
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
    ctx;
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

/***/ "./src/postmate/index.ts":
/*!*******************************!*\
  !*** ./src/postmate/index.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "messageType": () => (/* binding */ messageType),
/* harmony export */   "maxHandshakeRequests": () => (/* binding */ maxHandshakeRequests),
/* harmony export */   "generateNewMessageId": () => (/* binding */ generateNewMessageId),
/* harmony export */   "log": () => (/* binding */ log),
/* harmony export */   "resolveOrigin": () => (/* binding */ resolveOrigin),
/* harmony export */   "sanitize": () => (/* binding */ sanitize),
/* harmony export */   "resolveValue": () => (/* binding */ resolveValue),
/* harmony export */   "ParentAPI": () => (/* binding */ ParentAPI),
/* harmony export */   "ChildAPI": () => (/* binding */ ChildAPI),
/* harmony export */   "Postmate": () => (/* binding */ Postmate),
/* harmony export */   "Model": () => (/* binding */ Model)
/* harmony export */ });
// Fork from https://github.com/dollarshaveclub/postmate
/**
 * The type of messages our frames our sending
 * @type {String}
 */
const messageType = 'application/x-postmate-v1+json';
/**
 * The maximum number of attempts to send a handshake request to the parent
 * @type {Number}
 */
const maxHandshakeRequests = 5;
/**
 * A unique message ID that is used to ensure responses are sent to the correct requests
 * @type {Number}
 */
let _messageId = 0;
/**
 * Increments and returns a message ID
 * @return {Number} A unique ID for a message
 */
const generateNewMessageId = () => ++_messageId;
/**
 * Postmate logging function that enables/disables via config
 */
const log = (...args) => Postmate.debug ? console.log(...args) : null;
/**
 * Takes a URL and returns the origin
 * @param  {String} url The full URL being requested
 * @return {String}     The URLs origin
 */
const resolveOrigin = (url) => {
    const a = document.createElement('a');
    a.href = url;
    const protocol = a.protocol.length > 4 ? a.protocol : window.location.protocol;
    const host = a.host.length ? ((a.port === '80' || a.port === '443') ? a.hostname : a.host) : window.location.host;
    return a.origin || `${protocol}//${host}`;
};
const messageTypes = {
    handshake: 1,
    'handshake-reply': 1,
    call: 1,
    emit: 1,
    reply: 1,
    request: 1,
};
/**
 * Ensures that a message is safe to interpret
 * @param  {Object} message The postmate message being sent
 * @param  {String|Boolean} allowedOrigin The whitelisted origin or false to skip origin check
 * @return {Boolean}
 */
const sanitize = (message, allowedOrigin) => {
    if (typeof allowedOrigin === 'string' &&
        message.origin !== allowedOrigin)
        return false;
    if (!message.data)
        return false;
    if (typeof message.data === 'object' &&
        !('postmate' in message.data))
        return false;
    if (message.data.type !== messageType)
        return false;
    if (!messageTypes[message.data.postmate])
        return false;
    return true;
};
/**
 * Takes a model, and searches for a value by the property
 * @param  {Object} model     The dictionary to search against
 * @param  {String} property  A path within a dictionary (i.e. 'window.location.href')
 *                            passed to functions in the child model
 * @return {Promise}
 */
const resolveValue = (model, property) => {
    const unwrappedContext = typeof model[property] === 'function'
        ? model[property]() : model[property];
    return Promise.resolve(unwrappedContext);
};
/**
 * Composes an API to be used by the parent
 * @param {Object} info Information on the consumer
 */
class ParentAPI {
    parent;
    frame;
    child;
    events = {};
    childOrigin;
    listener;
    constructor(info) {
        this.parent = info.parent;
        this.frame = info.frame;
        this.child = info.child;
        this.childOrigin = info.childOrigin;
        if (true) {
            log('Parent: Registering API');
            log('Parent: Awaiting messages...');
        }
        this.listener = (e) => {
            if (!sanitize(e, this.childOrigin))
                return false;
            /**
             * the assignments below ensures that e, data, and value are all defined
             */
            const { data, name } = (((e || {}).data || {}).value || {});
            if (e.data.postmate === 'emit') {
                if (true) {
                    log(`Parent: Received event emission: ${name}`);
                }
                if (name in this.events) {
                    this.events[name].forEach(callback => {
                        callback.call(this, data);
                    });
                }
            }
        };
        this.parent.addEventListener('message', this.listener, false);
        if (true) {
            log('Parent: Awaiting event emissions from Child');
        }
    }
    get(property) {
        return new Promise((resolve) => {
            // Extract data from response and kill listeners
            const uid = generateNewMessageId();
            const transact = (e) => {
                if (e.data.uid === uid && e.data.postmate === 'reply') {
                    this.parent.removeEventListener('message', transact, false);
                    resolve(e.data.value);
                }
            };
            // Prepare for response from Child...
            this.parent.addEventListener('message', transact, false);
            // Then ask child for information
            this.child.postMessage({
                postmate: 'request',
                type: messageType,
                property,
                uid,
            }, this.childOrigin);
        });
    }
    call(property, data) {
        // Send information to the child
        this.child.postMessage({
            postmate: 'call',
            type: messageType,
            property,
            data,
        }, this.childOrigin);
    }
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }
    destroy() {
        if (true) {
            log('Parent: Destroying Postmate instance');
        }
        window.removeEventListener('message', this.listener, false);
        this.frame.parentNode.removeChild(this.frame);
    }
}
/**
 * Composes an API to be used by the child
 * @param {Object} info Information on the consumer
 */
class ChildAPI {
    model;
    parent;
    parentOrigin;
    child;
    constructor(info) {
        this.model = info.model;
        this.parent = info.parent;
        this.parentOrigin = info.parentOrigin;
        this.child = info.child;
        if (true) {
            log('Child: Registering API');
            log('Child: Awaiting messages...');
        }
        this.child.addEventListener('message', (e) => {
            if (!sanitize(e, this.parentOrigin))
                return;
            if (true) {
                log('Child: Received request', e.data);
            }
            const { property, uid, data } = e.data;
            if (e.data.postmate === 'call') {
                if (property in this.model && typeof this.model[property] === 'function') {
                    this.model[property](data);
                }
                return;
            }
            // Reply to Parent
            resolveValue(this.model, property)
                .then(value => {
                e.source.postMessage({
                    property,
                    postmate: 'reply',
                    type: messageType,
                    uid,
                    value,
                }, e.origin);
            });
        });
    }
    emit(name, data) {
        if (true) {
            log(`Child: Emitting Event "${name}"`, data);
        }
        this.parent.postMessage({
            postmate: 'emit',
            type: messageType,
            value: {
                name,
                data,
            },
        }, this.parentOrigin);
    }
}
/**
 * The entry point of the Parent.
 */
class Postmate {
    static debug = false; // eslint-disable-line no-undef
    container;
    parent;
    frame;
    child;
    childOrigin;
    url;
    model;
    static Model;
    /**
     * @param opts
     */
    constructor(opts) {
        this.container = opts.container;
        this.url = opts.url;
        this.parent = window;
        this.frame = document.createElement('iframe');
        if (opts.id)
            this.frame.id = opts.id;
        if (opts.name)
            this.frame.name = opts.name;
        this.frame.classList.add.apply(this.frame.classList, opts.classListArray || []);
        this.container.appendChild(this.frame);
        this.child = this.frame.contentWindow;
        this.model = opts.model || {};
    }
    /**
     * Begins the handshake strategy
     * @param  {String} url The URL to send a handshake request to
     * @return {Promise}     Promise that resolves when the handshake is complete
     */
    sendHandshake(url) {
        url = url || this.url;
        const childOrigin = resolveOrigin(url);
        let attempt = 0;
        let responseInterval;
        return new Promise((resolve, reject) => {
            const reply = (e) => {
                if (!sanitize(e, childOrigin))
                    return false;
                if (e.data.postmate === 'handshake-reply') {
                    clearInterval(responseInterval);
                    if (true) {
                        log('Parent: Received handshake reply from Child');
                    }
                    this.parent.removeEventListener('message', reply, false);
                    this.childOrigin = e.origin;
                    if (true) {
                        log('Parent: Saving Child origin', this.childOrigin);
                    }
                    return resolve(new ParentAPI(this));
                }
                // Might need to remove since parent might be receiving different messages
                // from different hosts
                if (true) {
                    log('Parent: Invalid handshake reply');
                }
                return reject('Failed handshake');
            };
            this.parent.addEventListener('message', reply, false);
            const doSend = () => {
                attempt++;
                if (true) {
                    log(`Parent: Sending handshake attempt ${attempt}`, { childOrigin });
                }
                this.child.postMessage({
                    postmate: 'handshake',
                    type: messageType,
                    model: this.model,
                }, childOrigin);
                if (attempt === maxHandshakeRequests) {
                    clearInterval(responseInterval);
                }
            };
            const loaded = () => {
                doSend();
                responseInterval = setInterval(doSend, 500);
            };
            this.frame.addEventListener('load', loaded);
            if (true) {
                log('Parent: Loading frame', { url });
            }
            this.frame.src = url;
        });
    }
}
/**
 * The entry point of the Child
 */
class Model {
    child;
    model;
    parent;
    parentOrigin;
    /**
     * Initializes the child, model, parent, and responds to the Parents handshake
     * @param {Object} model Hash of values, functions, or promises
     * @return {Promise}       The Promise that resolves when the handshake has been received
     */
    constructor(model) {
        this.child = window;
        this.model = model;
        this.parent = this.child.parent;
    }
    /**
     * Responds to a handshake initiated by the Parent
     * @return {Promise} Resolves an object that exposes an API for the Child
     */
    sendHandshakeReply() {
        return new Promise((resolve, reject) => {
            const shake = (e) => {
                if (!e.data.postmate) {
                    return;
                }
                if (e.data.postmate === 'handshake') {
                    if (true) {
                        log('Child: Received handshake from Parent');
                    }
                    this.child.removeEventListener('message', shake, false);
                    if (true) {
                        log('Child: Sending handshake reply to Parent');
                    }
                    e.source.postMessage({
                        postmate: 'handshake-reply',
                        type: messageType,
                    }, e.origin);
                    this.parentOrigin = e.origin;
                    // Extend model with the one provided by the parent
                    const defaults = e.data.model;
                    if (defaults) {
                        Object.keys(defaults).forEach(key => {
                            this.model[key] = defaults[key];
                        });
                        if (true) {
                            log('Child: Inherited and extended model from Parent');
                        }
                    }
                    if (true) {
                        log('Child: Saving Parent origin', this.parentOrigin);
                    }
                    return resolve(new ChildAPI(this));
                }
                return reject('Handshake Reply Failed');
            };
            this.child.addEventListener('message', shake, false);
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

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
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

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
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
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
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
/* harmony import */ var snake_case__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! snake-case */ "./node_modules/snake-case/dist.es2015/index.js");






const debug = debug__WEBPACK_IMPORTED_MODULE_2___default()('LSPlugin:core');
const DIR_PLUGINS = 'plugins';
/**
 * User settings
 */
class PluginSettings extends (eventemitter3__WEBPACK_IMPORTED_MODULE_0___default()) {
    _userPluginSettings;
    _settings = {
        disabled: false
    };
    constructor(_userPluginSettings) {
        super();
        this._userPluginSettings = _userPluginSettings;
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
    _tag;
    _logs = [];
    constructor(_tag) {
        super();
        this._tag = _tag;
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
        const el = pluginLocal.getMainUIContainer();
        el?.classList[toggle ? 'toggle' : (visible ? 'add' : 'remove')]('visible');
        // pluginLocal.caller!.callUserModel(LSPMSG, { type: _('visible'), payload: visible })
        // auto focus frame
        if (visible) {
            if (!pluginLocal.shadow && el) {
                el.querySelector('iframe')?.contentWindow?.focus();
            }
        }
        if (cursor) {
            (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)('restore_editing_cursor');
        }
    });
    pluginLocal.on(_('attrs'), (attrs) => {
        const el = pluginLocal.getMainUIContainer();
        Object.entries(attrs).forEach(([k, v]) => {
            el?.setAttribute(k, v);
            if (k === 'draggable' && v) {
                pluginLocal._dispose(pluginLocal._setupDraggableContainer(el, {
                    title: pluginLocal.options.name,
                    close: () => {
                        pluginLocal.caller.call('sys:ui:visible', { toggle: true });
                    }
                }));
            }
            if (k === 'resizable' && v) {
                pluginLocal._dispose(pluginLocal._setupResizableContainer(el));
            }
        });
    });
    pluginLocal.on(_('style'), (style) => {
        const el = pluginLocal.getMainUIContainer();
        const isInitedLayout = !!el.dataset.inited_layout;
        Object.entries(style).forEach(([k, v]) => {
            if (isInitedLayout && [
                'left', 'top', 'bottom', 'right', 'width', 'height'
            ].includes(k)) {
                return;
            }
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
            pluginLocal._dispose(_helpers__WEBPACK_IMPORTED_MODULE_1__.setupInjectedUI.call(pluginLocal, ui, Object.assign({
                'data-ref': pluginLocal.id
            }, ui.attrs || {}), ({ el, float }) => {
                if (!float)
                    return;
                const identity = el.dataset.identity;
                pluginLocal.layoutCore.move_container_to_top(identity);
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
function convertToLSPResource(fullUrl, dotPluginRoot) {
    if (dotPluginRoot &&
        fullUrl.startsWith(_helpers__WEBPACK_IMPORTED_MODULE_1__.PROTOCOL_FILE + dotPluginRoot)) {
        fullUrl = (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.safetyPathJoin)(_helpers__WEBPACK_IMPORTED_MODULE_1__.URL_LSP, fullUrl.substr(_helpers__WEBPACK_IMPORTED_MODULE_1__.PROTOCOL_FILE.length + dotPluginRoot.length));
    }
    return fullUrl;
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
    _options;
    _themeMgr;
    _ctx;
    _disposes = [];
    _id;
    _status = PluginLocalLoadStatus.UNLOADED;
    _loadErr;
    _localRoot;
    _dotSettingsFile;
    _caller;
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
        this._id = _options.key || (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.genID)();
        initUserSettingsHandlers(this);
        initMainUIHandlers(this);
        initProviderHandlers(this);
        initApiProxyHandlers(this);
    }
    async _setupUserSettings() {
        const { _options } = this;
        const logger = _options.logger = new PluginLogger('Loader');
        try {
            const [userSettingsFilePath, userSettings] = await (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)('load_plugin_user_settings', this.id);
            this._dotSettingsFile = userSettingsFilePath;
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
                    (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)(`save_plugin_user_settings`, this.id, a);
                }
            });
        }
        catch (e) {
            debug('[load plugin user settings Error]', e);
            logger?.error(e);
        }
    }
    getMainUIContainer() {
        if (this.shadow) {
            return this.caller?._getSandboxShadowContainer();
        }
        return this.caller?._getSandboxIframeContainer();
    }
    _resolveResourceFullUrl(filePath, localRoot) {
        if (!filePath?.trim())
            return;
        localRoot = localRoot || this._localRoot;
        const reg = /^(http|file)/;
        if (!reg.test(filePath)) {
            const url = _helpers__WEBPACK_IMPORTED_MODULE_1__.path.join(localRoot, filePath);
            filePath = reg.test(url) ? url : (_helpers__WEBPACK_IMPORTED_MODULE_1__.PROTOCOL_FILE + url);
        }
        return (!this.options.effect && this.isInstalledInDotRoot) ?
            convertToLSPResource(filePath, this.dotPluginsRoot) : filePath;
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
        const localRoot = this._localRoot = (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.safetyPathNormalize)(url);
        const logseq = pkg.logseq || {};
        ['name', 'author', 'repository', 'version',
            'description', 'repo', 'title', 'effect',
        ].concat(!this.isInstalledInDotRoot ? ['devEntry'] : []).forEach(k => {
            this._options[k] = pkg[k];
        });
        const validateEntry = (main) => main && /\.(js|html)$/.test(main);
        // Entry from main
        const entry = logseq.entry || logseq.main || pkg.main;
        if (validateEntry(entry)) { // Theme has no main
            this._options.entry = this._resolveResourceFullUrl(entry, localRoot);
            this._options.devEntry = logseq.devEntry;
            if (logseq.mode) {
                this._options.mode = logseq.mode;
            }
        }
        const title = logseq.title || pkg.title;
        const icon = logseq.icon || pkg.icon;
        this._options.title = title;
        this._options.icon = icon &&
            this._resolveResourceFullUrl(icon);
        // TODO: strategy for Logseq plugins center
        if (this.isInstalledInDotRoot) {
            this._id = _helpers__WEBPACK_IMPORTED_MODULE_1__.path.basename(localRoot);
        }
        else {
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
        let { entry, settings, devEntry } = this.options;
        devEntry = devEntry || settings?.get('_devEntry');
        if (devEntry) {
            this._options.entry = devEntry;
            return;
        }
        if (!entry.endsWith('.js'))
            return;
        let dirPathInstalled = null;
        let tmp_file_method = 'write_user_tmp_file';
        if (this.isInstalledInDotRoot) {
            tmp_file_method = 'write_dotdir_file';
            dirPathInstalled = this._localRoot.replace(this.dotPluginsRoot, '');
            dirPathInstalled = _helpers__WEBPACK_IMPORTED_MODULE_1__.path.join(DIR_PLUGINS, dirPathInstalled);
        }
        let sdkPathRoot = await (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.getSDKPathRoot)();
        let entryPath = await (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.invokeHostExportedApi)(tmp_file_method, `${this._id}_index.html`, `<!doctype html>
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
</html>`, dirPathInstalled);
        entry = convertToLSPResource((0,_helpers__WEBPACK_IMPORTED_MODULE_1__.withFileProtocol)(_helpers__WEBPACK_IMPORTED_MODULE_1__.path.normalize(entryPath)), this.dotPluginsRoot);
        this._options.entry = entry;
    }
    async _loadConfigThemes(themes) {
        themes.forEach((options) => {
            if (!options.url)
                return;
            if (!options.url.startsWith('http') && this._localRoot) {
                options.url = _helpers__WEBPACK_IMPORTED_MODULE_1__.path.join(this._localRoot, options.url);
                // file:// for native
                if (!options.url.startsWith('file:')) {
                    options.url = 'assets://' + options.url;
                }
            }
            // @ts-ignore
            this.emit('provider:theme', options);
        });
    }
    _persistMainUILayoutData(e) {
        const layouts = this.settings.get('layouts') || [];
        layouts[0] = e;
        this.settings.set('layout', layouts);
    }
    _setupDraggableContainer(el, opts = {}) {
        const ds = el.dataset;
        if (ds.inited_draggable)
            return;
        if (!ds.identity) {
            ds.identity = 'dd-' + (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.genID)();
        }
        const isInjectedUI = !!opts.key;
        const handle = document.createElement('div');
        handle.classList.add('draggable-handle');
        handle.innerHTML = `
      <div class="th">
        <div class="l"><h3>${opts.title || ''}</h3></div>
        <div class="r">
          <a class="button x"><i class="ti ti-x"></i></a>
        </div>
      </div>
    `;
        handle.querySelector('.x')
            .addEventListener('click', (e) => {
            opts?.close?.();
            e.stopPropagation();
        }, false);
        handle.addEventListener('mousedown', (e) => {
            const target = e.target;
            if (target?.closest('.r')) {
                e.stopPropagation();
                e.preventDefault();
                return;
            }
        }, false);
        el.prepend(handle);
        // move to top
        el.addEventListener('mousedown', (e) => {
            this.layoutCore.move_container_to_top(ds.identity);
        }, true);
        const setTitle = (title) => {
            handle.querySelector('h3').textContent = title;
        };
        const dispose = this.layoutCore.setup_draggable_container_BANG_(el, !isInjectedUI ? this._persistMainUILayoutData.bind(this) : () => { });
        ds.inited_draggable = 'true';
        if (opts.title) {
            setTitle(opts.title);
        }
        // click outside
        let removeOutsideListener = null;
        if (ds.close === 'outside') {
            const handler = (e) => {
                const target = e.target;
                if (!el.contains(target)) {
                    opts.close();
                }
            };
            document.addEventListener('click', handler, false);
            removeOutsideListener = () => {
                document.removeEventListener('click', handler);
            };
        }
        return () => {
            dispose();
            removeOutsideListener?.();
        };
    }
    _setupResizableContainer(el, key) {
        const ds = el.dataset;
        if (ds.inited_resizable)
            return;
        if (!ds.identity) {
            ds.identity = 'dd-' + (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.genID)();
        }
        const handle = document.createElement('div');
        handle.classList.add('resizable-handle');
        el.prepend(handle);
        // @ts-ignore
        const layoutCore = window.frontend.modules.layout.core;
        const dispose = layoutCore.setup_resizable_container_BANG_(el, !key ? this._persistMainUILayoutData.bind(this) : () => { });
        ds.inited_resizable = 'true';
        return dispose;
    }
    async load(readyIndicator) {
        if (this.pending) {
            return;
        }
        this._status = PluginLocalLoadStatus.LOADING;
        this._loadErr = undefined;
        try {
            // if (!this.options.entry) { // Themes package no entry field
            // }
            let installPackageThemes = await this._preparePackageConfigs();
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
                this._caller?.callUserModel(_LSPlugin_caller__WEBPACK_IMPORTED_MODULE_3__.LSPMSG_READY, { pid: this.id });
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
                if (this.disabled) {
                    this._status = PluginLocalLoadStatus.UNLOADED;
                }
                else {
                    this._status = PluginLocalLoadStatus.LOADED;
                }
            }
        }
    }
    async reload() {
        if (this.pending) {
            return;
        }
        this._ctx.emit('beforereload', this);
        await this.unload();
        await this.load();
        this._ctx.emit('reloaded', this);
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
            if (this.isInstalledInDotRoot) {
                this._ctx.emit('unlink-plugin', this.id);
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
            return false;
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
    get layoutCore() {
        // @ts-ignore
        return window.frontend.modules.layout.core;
    }
    get isInstalledInDotRoot() {
        const dotRoot = this.dotConfigRoot;
        const plgRoot = this.localRoot;
        return dotRoot && plgRoot && plgRoot.startsWith(dotRoot);
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
    get dotConfigRoot() {
        return _helpers__WEBPACK_IMPORTED_MODULE_1__.path.normalize(this._ctx.options.dotConfigRoot);
    }
    get dotSettingsFile() {
        return this._dotSettingsFile;
    }
    get dotPluginsRoot() {
        return _helpers__WEBPACK_IMPORTED_MODULE_1__.path.join(this.dotConfigRoot, DIR_PLUGINS);
    }
    toJSON() {
        const json = { ...this.options };
        json.id = this.id;
        json.err = this.loadErr;
        json.usf = this.dotSettingsFile;
        json.iir = this.isInstalledInDotRoot;
        json.lsr = this._resolveResourceFullUrl('');
        return json;
    }
}
/**
 * Host plugin core
 */
class LSPluginCore extends (eventemitter3__WEBPACK_IMPORTED_MODULE_0___default()) {
    _options;
    _isRegistering = false;
    _readyIndicator;
    _hostMountedActor = (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.deferred)();
    _userPreferences = {};
    _registeredThemes = new Map();
    _registeredPlugins = new Map();
    _currentTheme;
    /**
     * @param _options
     */
    constructor(_options) {
        super();
        this._options = _options;
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
        const perfTable = new Map();
        const debugPerfInfo = () => {
            const data = Array.from(perfTable.values()).reduce((ac, it) => {
                const { options, status, disabled } = it.o;
                ac[it.o.id] = {
                    name: options.name,
                    entry: options.entry,
                    status: status,
                    enabled: typeof disabled === 'boolean' ? (!disabled ? '🟢' : '⚫️') : '🔴',
                    perf: !it.e ? it.o.loadErr : `${(it.e - it.s).toFixed(2)}ms`
                };
                return ac;
            }, {});
            console.table(data);
        };
        // @ts-ignore
        window.__debugPluginsPerfInfo = debugPerfInfo;
        try {
            this._isRegistering = true;
            const userConfigRoot = this._options.dotConfigRoot;
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
                const perfInfo = { o: pluginLocal, s: performance.now(), e: 0 };
                perfTable.set(pluginLocal.id, perfInfo);
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
                perfInfo.e = performance.now();
                pluginLocal.settings?.on('change', (a) => {
                    this.emit('settings-changed', pluginLocal.id, a);
                    pluginLocal.caller?.callUserModel(_LSPlugin_caller__WEBPACK_IMPORTED_MODULE_3__.LSPMSG_SETTINGS, { payload: a });
                });
                this._registeredPlugins.set(pluginLocal.id, pluginLocal);
                this.emit('registered', pluginLocal);
                // external plugins
                if (!pluginLocal.isInstalledInDotRoot) {
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
            debugPerfInfo();
        }
    }
    async reload(plugins) {
        if (!Array.isArray(plugins)) {
            await this.reload([plugins]);
            return;
        }
        for (const identity of plugins) {
            try {
                const p = this.ensurePlugin(identity);
                await p.reload();
            }
            catch (e) {
                debug(e);
            }
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
            if (!p.isInstalledInDotRoot) {
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
                    ns, type: (0,snake_case__WEBPACK_IMPORTED_MODULE_4__.snakeCase)(type), payload
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
        // clear current
        if (this._currentTheme) {
            this._currentTheme.dis?.();
        }
        const disInjectedTheme = (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.setupInjectedTheme)(opt?.url);
        this.emit('theme-selected', opt);
        effect && await this.saveUserPreferences({ theme: opt?.url ? opt : null });
        if (opt?.url) {
            this._currentTheme = {
                dis: () => {
                    disInjectedTheme();
                    effect && this.saveUserPreferences({ theme: null });
                }, opt, pid: opt.pid
            };
        }
    }
    async unregisterTheme(id, effect = true) {
        debug('unregistered Theme #', id);
        if (!this._registeredThemes.has(id))
            return;
        this._registeredThemes.delete(id);
        this.emit('theme-changed', this.themes, { id });
        if (effect && this._currentTheme?.pid == id) {
            this._currentTheme.dis?.();
            this._currentTheme = null;
            // reset current theme
            this.emit('theme-selected', null);
        }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRDs7QUFFbEQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0IsTUFBTTtBQUN0QjtBQUNBO0FBQ0EscUNBQXFDLGVBQWU7QUFDcEQ7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLFFBQVE7QUFDeEIsZ0JBQWdCLE1BQU07QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWixVQUFVO0FBQ1Y7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLFFBQVE7QUFDeEIsZ0JBQWdCLFVBQVU7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLFVBQVU7QUFDMUIsZ0JBQWdCLFVBQVU7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLE1BQU07QUFDdEIsZ0JBQWdCLFNBQVM7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0IsTUFBTTtBQUN0QixnQkFBZ0IsU0FBUztBQUN6QjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQixRQUFRO0FBQ3hCLGdCQUFnQixNQUFNO0FBQ3RCLGdCQUFnQixRQUFRO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLE9BQU87QUFDUDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixNQUFNO0FBQ3ZCLGlCQUFpQixTQUFTO0FBQzFCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTzs7QUFFUDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEseUNBQXlDLFFBQVE7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5Q0FBeUMsa0NBQWtDO0FBQzNFO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLFFBQVE7QUFDeEIsZ0JBQWdCLFFBQVE7QUFDeEIsZ0JBQWdCLFFBQVE7QUFDeEIsZ0JBQWdCLFNBQVM7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsNENBQTRDO0FBQzVDLHlGQUF5RixnRUFBZ0U7QUFDeko7O0FBRUE7QUFDQSxRQUFRLHdDQUF3Qyx3RkFBd0Ysb0tBQW9LLHVIQUF1SCxtQkFBbUI7QUFDdGI7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0IsTUFBTTtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBLHNDQUFzQzs7QUFFdEM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLDJDQUEyQztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2Q0FBNkM7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBOztBQUVBO0FBQ0EsVUFBVTtBQUNWOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0Isa0JBQWtCO0FBQ2xDO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLGFBQWE7QUFDNUIsZUFBZSxRQUFRO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWUsUUFBUTtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLFFBQVE7QUFDeEIsZ0JBQWdCLFFBQVE7QUFDeEIsZ0JBQWdCLFFBQVE7QUFDeEIsZ0JBQWdCLFNBQVM7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUI7QUFDdkI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLFFBQVE7QUFDdkIsZUFBZSxVQUFV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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQixZQUFZO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQ0FBZ0MsMkJBQTJCO0FBQzNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkIsSUFBSTtBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QTtBQUNBLEdBQUc7O0FBRUg7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSw0Q0FBNEMsS0FBSzs7QUFFakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBLG9DQUFvQyxPQUFPO0FBQzNDO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQSwwREFBMEQ7QUFDMUQ7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtB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Q0E7QUFDQTtBQUNBO0FBQ0Esd0NBQXdDLG9EQUFNO0FBQzlDLDhCQUE4QixxREFBUztBQUN2QyxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxRQUFRO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRCxZQUFZO0FBQzlEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQyw0REFBa0I7QUFDbkQ7QUFDQSxtREFBbUQsOEJBQThCO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseURBQXlELGFBQWE7QUFDdEUsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsSUFBSTtBQUN0RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUN1RCIsInNvdXJjZXMiOlsid2VicGFjazovL0xTUGx1Z2luL3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL25vZGVfbW9kdWxlcy9kZWJ1Zy9zcmMvYnJvd3Nlci5qcyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL25vZGVfbW9kdWxlcy9kZWJ1Zy9zcmMvY29tbW9uLmpzIiwid2VicGFjazovL0xTUGx1Z2luLy4vbm9kZV9tb2R1bGVzL2RvbXB1cmlmeS9kaXN0L3B1cmlmeS5qcyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL25vZGVfbW9kdWxlcy9kb3QtY2FzZS9kaXN0LmVzMjAxNS9pbmRleC5qcyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL25vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwid2VicGFjazovL0xTUGx1Z2luLy4vbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9ub2RlX21vZHVsZXMvbG93ZXItY2FzZS9kaXN0LmVzMjAxNS9pbmRleC5qcyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL25vZGVfbW9kdWxlcy9tcy9pbmRleC5qcyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL25vZGVfbW9kdWxlcy9uby1jYXNlL2Rpc3QuZXMyMDE1L2luZGV4LmpzIiwid2VicGFjazovL0xTUGx1Z2luLy4vbm9kZV9tb2R1bGVzL3BhdGgvcGF0aC5qcyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9ub2RlX21vZHVsZXMvc25ha2UtY2FzZS9kaXN0LmVzMjAxNS9pbmRleC5qcyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL3NyYy9MU1BsdWdpbi5jYWxsZXIudHMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9zcmMvTFNQbHVnaW4uc2hhZG93LnRzIiwid2VicGFjazovL0xTUGx1Z2luLy4vc3JjL0xTUGx1Z2luLnRzIiwid2VicGFjazovL0xTUGx1Z2luLy4vc3JjL0xTUGx1Z2luLnVzZXIudHMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9zcmMvaGVscGVycy50cyIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL3NyYy9tb2R1bGVzL0xTUGx1Z2luLlN0b3JhZ2UudHMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9zcmMvcG9zdG1hdGUvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9ub2RlX21vZHVsZXMvdHNsaWIvdHNsaWIuZXM2LmpzIiwid2VicGFjazovL0xTUGx1Z2luLy4vbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vLi9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwid2VicGFjazovL0xTUGx1Z2luL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL0xTUGx1Z2luL3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL0xTUGx1Z2luL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9MU1BsdWdpbi93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL0xTUGx1Z2luL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vTFNQbHVnaW4vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9MU1BsdWdpbi8uL3NyYy9MU1BsdWdpbi5jb3JlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIkxTUGx1Z2luXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcIkxTUGx1Z2luXCJdID0gZmFjdG9yeSgpO1xufSkoc2VsZiwgZnVuY3Rpb24oKSB7XG5yZXR1cm4gIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICovXG5cbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gbG9jYWxzdG9yYWdlKCk7XG5leHBvcnRzLmRlc3Ryb3kgPSAoKCkgPT4ge1xuXHRsZXQgd2FybmVkID0gZmFsc2U7XG5cblx0cmV0dXJuICgpID0+IHtcblx0XHRpZiAoIXdhcm5lZCkge1xuXHRcdFx0d2FybmVkID0gdHJ1ZTtcblx0XHRcdGNvbnNvbGUud2FybignSW5zdGFuY2UgbWV0aG9kIGBkZWJ1Zy5kZXN0cm95KClgIGlzIGRlcHJlY2F0ZWQgYW5kIG5vIGxvbmdlciBkb2VzIGFueXRoaW5nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvbiBvZiBgZGVidWdgLicpO1xuXHRcdH1cblx0fTtcbn0pKCk7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuXHQnIzAwMDBDQycsXG5cdCcjMDAwMEZGJyxcblx0JyMwMDMzQ0MnLFxuXHQnIzAwMzNGRicsXG5cdCcjMDA2NkNDJyxcblx0JyMwMDY2RkYnLFxuXHQnIzAwOTlDQycsXG5cdCcjMDA5OUZGJyxcblx0JyMwMENDMDAnLFxuXHQnIzAwQ0MzMycsXG5cdCcjMDBDQzY2Jyxcblx0JyMwMENDOTknLFxuXHQnIzAwQ0NDQycsXG5cdCcjMDBDQ0ZGJyxcblx0JyMzMzAwQ0MnLFxuXHQnIzMzMDBGRicsXG5cdCcjMzMzM0NDJyxcblx0JyMzMzMzRkYnLFxuXHQnIzMzNjZDQycsXG5cdCcjMzM2NkZGJyxcblx0JyMzMzk5Q0MnLFxuXHQnIzMzOTlGRicsXG5cdCcjMzNDQzAwJyxcblx0JyMzM0NDMzMnLFxuXHQnIzMzQ0M2NicsXG5cdCcjMzNDQzk5Jyxcblx0JyMzM0NDQ0MnLFxuXHQnIzMzQ0NGRicsXG5cdCcjNjYwMENDJyxcblx0JyM2NjAwRkYnLFxuXHQnIzY2MzNDQycsXG5cdCcjNjYzM0ZGJyxcblx0JyM2NkNDMDAnLFxuXHQnIzY2Q0MzMycsXG5cdCcjOTkwMENDJyxcblx0JyM5OTAwRkYnLFxuXHQnIzk5MzNDQycsXG5cdCcjOTkzM0ZGJyxcblx0JyM5OUNDMDAnLFxuXHQnIzk5Q0MzMycsXG5cdCcjQ0MwMDAwJyxcblx0JyNDQzAwMzMnLFxuXHQnI0NDMDA2NicsXG5cdCcjQ0MwMDk5Jyxcblx0JyNDQzAwQ0MnLFxuXHQnI0NDMDBGRicsXG5cdCcjQ0MzMzAwJyxcblx0JyNDQzMzMzMnLFxuXHQnI0NDMzM2NicsXG5cdCcjQ0MzMzk5Jyxcblx0JyNDQzMzQ0MnLFxuXHQnI0NDMzNGRicsXG5cdCcjQ0M2NjAwJyxcblx0JyNDQzY2MzMnLFxuXHQnI0NDOTkwMCcsXG5cdCcjQ0M5OTMzJyxcblx0JyNDQ0NDMDAnLFxuXHQnI0NDQ0MzMycsXG5cdCcjRkYwMDAwJyxcblx0JyNGRjAwMzMnLFxuXHQnI0ZGMDA2NicsXG5cdCcjRkYwMDk5Jyxcblx0JyNGRjAwQ0MnLFxuXHQnI0ZGMDBGRicsXG5cdCcjRkYzMzAwJyxcblx0JyNGRjMzMzMnLFxuXHQnI0ZGMzM2NicsXG5cdCcjRkYzMzk5Jyxcblx0JyNGRjMzQ0MnLFxuXHQnI0ZGMzNGRicsXG5cdCcjRkY2NjAwJyxcblx0JyNGRjY2MzMnLFxuXHQnI0ZGOTkwMCcsXG5cdCcjRkY5OTMzJyxcblx0JyNGRkNDMDAnLFxuXHQnI0ZGQ0MzMydcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcblx0Ly8gTkI6IEluIGFuIEVsZWN0cm9uIHByZWxvYWQgc2NyaXB0LCBkb2N1bWVudCB3aWxsIGJlIGRlZmluZWQgYnV0IG5vdCBmdWxseVxuXHQvLyBpbml0aWFsaXplZC4gU2luY2Ugd2Uga25vdyB3ZSdyZSBpbiBDaHJvbWUsIHdlJ2xsIGp1c3QgZGV0ZWN0IHRoaXMgY2FzZVxuXHQvLyBleHBsaWNpdGx5XG5cdGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucHJvY2VzcyAmJiAod2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJyB8fCB3aW5kb3cucHJvY2Vzcy5fX253anMpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyBJbnRlcm5ldCBFeHBsb3JlciBhbmQgRWRnZSBkbyBub3Qgc3VwcG9ydCBjb2xvcnMuXG5cdGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvKGVkZ2V8dHJpZGVudClcXC8oXFxkKykvKSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIElzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG5cdC8vIGRvY3VtZW50IGlzIHVuZGVmaW5lZCBpbiByZWFjdC1uYXRpdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC1uYXRpdmUvcHVsbC8xNjMyXG5cdHJldHVybiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5XZWJraXRBcHBlYXJhbmNlKSB8fFxuXHRcdC8vIElzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcblx0XHQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLmZpcmVidWcgfHwgKHdpbmRvdy5jb25zb2xlLmV4Y2VwdGlvbiAmJiB3aW5kb3cuY29uc29sZS50YWJsZSkpKSB8fFxuXHRcdC8vIElzIGZpcmVmb3ggPj0gdjMxP1xuXHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuXHRcdCh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKSB8fFxuXHRcdC8vIERvdWJsZSBjaGVjayB3ZWJraXQgaW4gdXNlckFnZW50IGp1c3QgaW4gY2FzZSB3ZSBhcmUgaW4gYSB3b3JrZXJcblx0XHQodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2FwcGxld2Via2l0XFwvKFxcZCspLykpO1xufVxuXG4vKipcbiAqIENvbG9yaXplIGxvZyBhcmd1bWVudHMgaWYgZW5hYmxlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGZvcm1hdEFyZ3MoYXJncykge1xuXHRhcmdzWzBdID0gKHRoaXMudXNlQ29sb3JzID8gJyVjJyA6ICcnKSArXG5cdFx0dGhpcy5uYW1lc3BhY2UgK1xuXHRcdCh0aGlzLnVzZUNvbG9ycyA/ICcgJWMnIDogJyAnKSArXG5cdFx0YXJnc1swXSArXG5cdFx0KHRoaXMudXNlQ29sb3JzID8gJyVjICcgOiAnICcpICtcblx0XHQnKycgKyBtb2R1bGUuZXhwb3J0cy5odW1hbml6ZSh0aGlzLmRpZmYpO1xuXG5cdGlmICghdGhpcy51c2VDb2xvcnMpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcblx0YXJncy5zcGxpY2UoMSwgMCwgYywgJ2NvbG9yOiBpbmhlcml0Jyk7XG5cblx0Ly8gVGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcblx0Ly8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuXHQvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cblx0bGV0IGluZGV4ID0gMDtcblx0bGV0IGxhc3RDID0gMDtcblx0YXJnc1swXS5yZXBsYWNlKC8lW2EtekEtWiVdL2csIG1hdGNoID0+IHtcblx0XHRpZiAobWF0Y2ggPT09ICclJScpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aW5kZXgrKztcblx0XHRpZiAobWF0Y2ggPT09ICclYycpIHtcblx0XHRcdC8vIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuXHRcdFx0Ly8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcblx0XHRcdGxhc3RDID0gaW5kZXg7XG5cdFx0fVxuXHR9KTtcblxuXHRhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5kZWJ1ZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUuZGVidWdgIGlzIG5vdCBhIFwiZnVuY3Rpb25cIi5cbiAqIElmIGBjb25zb2xlLmRlYnVnYCBpcyBub3QgYXZhaWxhYmxlLCBmYWxscyBiYWNrXG4gKiB0byBgY29uc29sZS5sb2dgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydHMubG9nID0gY29uc29sZS5kZWJ1ZyB8fCBjb25zb2xlLmxvZyB8fCAoKCkgPT4ge30pO1xuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG5cdHRyeSB7XG5cdFx0aWYgKG5hbWVzcGFjZXMpIHtcblx0XHRcdGV4cG9ydHMuc3RvcmFnZS5zZXRJdGVtKCdkZWJ1ZycsIG5hbWVzcGFjZXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcblx0XHR9XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gU3dhbGxvd1xuXHRcdC8vIFhYWCAoQFFpeC0pIHNob3VsZCB3ZSBiZSBsb2dnaW5nIHRoZXNlP1xuXHR9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGxvYWQoKSB7XG5cdGxldCByO1xuXHR0cnkge1xuXHRcdHIgPSBleHBvcnRzLnN0b3JhZ2UuZ2V0SXRlbSgnZGVidWcnKTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHQvLyBTd2FsbG93XG5cdFx0Ly8gWFhYIChAUWl4LSkgc2hvdWxkIHdlIGJlIGxvZ2dpbmcgdGhlc2U/XG5cdH1cblxuXHQvLyBJZiBkZWJ1ZyBpc24ndCBzZXQgaW4gTFMsIGFuZCB3ZSdyZSBpbiBFbGVjdHJvbiwgdHJ5IHRvIGxvYWQgJERFQlVHXG5cdGlmICghciAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgJ2VudicgaW4gcHJvY2Vzcykge1xuXHRcdHIgPSBwcm9jZXNzLmVudi5ERUJVRztcblx0fVxuXG5cdHJldHVybiByO1xufVxuXG4vKipcbiAqIExvY2Fsc3RvcmFnZSBhdHRlbXB0cyB0byByZXR1cm4gdGhlIGxvY2Fsc3RvcmFnZS5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNhZmFyaSB0aHJvd3NcbiAqIHdoZW4gYSB1c2VyIGRpc2FibGVzIGNvb2tpZXMvbG9jYWxzdG9yYWdlXG4gKiBhbmQgeW91IGF0dGVtcHQgdG8gYWNjZXNzIGl0LlxuICpcbiAqIEByZXR1cm4ge0xvY2FsU3RvcmFnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvY2Fsc3RvcmFnZSgpIHtcblx0dHJ5IHtcblx0XHQvLyBUVk1MS2l0IChBcHBsZSBUViBKUyBSdW50aW1lKSBkb2VzIG5vdCBoYXZlIGEgd2luZG93IG9iamVjdCwganVzdCBsb2NhbFN0b3JhZ2UgaW4gdGhlIGdsb2JhbCBjb250ZXh0XG5cdFx0Ly8gVGhlIEJyb3dzZXIgYWxzbyBoYXMgbG9jYWxTdG9yYWdlIGluIHRoZSBnbG9iYWwgY29udGV4dC5cblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdC8vIFN3YWxsb3dcblx0XHQvLyBYWFggKEBRaXgtKSBzaG91bGQgd2UgYmUgbG9nZ2luZyB0aGVzZT9cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY29tbW9uJykoZXhwb3J0cyk7XG5cbmNvbnN0IHtmb3JtYXR0ZXJzfSA9IG1vZHVsZS5leHBvcnRzO1xuXG4vKipcbiAqIE1hcCAlaiB0byBgSlNPTi5zdHJpbmdpZnkoKWAsIHNpbmNlIG5vIFdlYiBJbnNwZWN0b3JzIGRvIHRoYXQgYnkgZGVmYXVsdC5cbiAqL1xuXG5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbiAodikge1xuXHR0cnkge1xuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRyZXR1cm4gJ1tVbmV4cGVjdGVkSlNPTlBhcnNlRXJyb3JdOiAnICsgZXJyb3IubWVzc2FnZTtcblx0fVxufTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICovXG5cbmZ1bmN0aW9uIHNldHVwKGVudikge1xuXHRjcmVhdGVEZWJ1Zy5kZWJ1ZyA9IGNyZWF0ZURlYnVnO1xuXHRjcmVhdGVEZWJ1Zy5kZWZhdWx0ID0gY3JlYXRlRGVidWc7XG5cdGNyZWF0ZURlYnVnLmNvZXJjZSA9IGNvZXJjZTtcblx0Y3JlYXRlRGVidWcuZGlzYWJsZSA9IGRpc2FibGU7XG5cdGNyZWF0ZURlYnVnLmVuYWJsZSA9IGVuYWJsZTtcblx0Y3JlYXRlRGVidWcuZW5hYmxlZCA9IGVuYWJsZWQ7XG5cdGNyZWF0ZURlYnVnLmh1bWFuaXplID0gcmVxdWlyZSgnbXMnKTtcblx0Y3JlYXRlRGVidWcuZGVzdHJveSA9IGRlc3Ryb3k7XG5cblx0T2JqZWN0LmtleXMoZW52KS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0Y3JlYXRlRGVidWdba2V5XSA9IGVudltrZXldO1xuXHR9KTtcblxuXHQvKipcblx0KiBUaGUgY3VycmVudGx5IGFjdGl2ZSBkZWJ1ZyBtb2RlIG5hbWVzLCBhbmQgbmFtZXMgdG8gc2tpcC5cblx0Ki9cblxuXHRjcmVhdGVEZWJ1Zy5uYW1lcyA9IFtdO1xuXHRjcmVhdGVEZWJ1Zy5za2lwcyA9IFtdO1xuXG5cdC8qKlxuXHQqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cblx0KlxuXHQqIFZhbGlkIGtleSBuYW1lcyBhcmUgYSBzaW5nbGUsIGxvd2VyIG9yIHVwcGVyLWNhc2UgbGV0dGVyLCBpLmUuIFwiblwiIGFuZCBcIk5cIi5cblx0Ki9cblx0Y3JlYXRlRGVidWcuZm9ybWF0dGVycyA9IHt9O1xuXG5cdC8qKlxuXHQqIFNlbGVjdHMgYSBjb2xvciBmb3IgYSBkZWJ1ZyBuYW1lc3BhY2Vcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2Ugc3RyaW5nIGZvciB0aGUgZm9yIHRoZSBkZWJ1ZyBpbnN0YW5jZSB0byBiZSBjb2xvcmVkXG5cdCogQHJldHVybiB7TnVtYmVyfFN0cmluZ30gQW4gQU5TSSBjb2xvciBjb2RlIGZvciB0aGUgZ2l2ZW4gbmFtZXNwYWNlXG5cdCogQGFwaSBwcml2YXRlXG5cdCovXG5cdGZ1bmN0aW9uIHNlbGVjdENvbG9yKG5hbWVzcGFjZSkge1xuXHRcdGxldCBoYXNoID0gMDtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbmFtZXNwYWNlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBuYW1lc3BhY2UuY2hhckNvZGVBdChpKTtcblx0XHRcdGhhc2ggfD0gMDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNyZWF0ZURlYnVnLmNvbG9yc1tNYXRoLmFicyhoYXNoKSAlIGNyZWF0ZURlYnVnLmNvbG9ycy5sZW5ndGhdO1xuXHR9XG5cdGNyZWF0ZURlYnVnLnNlbGVjdENvbG9yID0gc2VsZWN0Q29sb3I7XG5cblx0LyoqXG5cdCogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVzcGFjZWAuXG5cdCpcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG5cdCogQHJldHVybiB7RnVuY3Rpb259XG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gY3JlYXRlRGVidWcobmFtZXNwYWNlKSB7XG5cdFx0bGV0IHByZXZUaW1lO1xuXHRcdGxldCBlbmFibGVPdmVycmlkZSA9IG51bGw7XG5cdFx0bGV0IG5hbWVzcGFjZXNDYWNoZTtcblx0XHRsZXQgZW5hYmxlZENhY2hlO1xuXG5cdFx0ZnVuY3Rpb24gZGVidWcoLi4uYXJncykge1xuXHRcdFx0Ly8gRGlzYWJsZWQ/XG5cdFx0XHRpZiAoIWRlYnVnLmVuYWJsZWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzZWxmID0gZGVidWc7XG5cblx0XHRcdC8vIFNldCBgZGlmZmAgdGltZXN0YW1wXG5cdFx0XHRjb25zdCBjdXJyID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuXHRcdFx0Y29uc3QgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuXHRcdFx0c2VsZi5kaWZmID0gbXM7XG5cdFx0XHRzZWxmLnByZXYgPSBwcmV2VGltZTtcblx0XHRcdHNlbGYuY3VyciA9IGN1cnI7XG5cdFx0XHRwcmV2VGltZSA9IGN1cnI7XG5cblx0XHRcdGFyZ3NbMF0gPSBjcmVhdGVEZWJ1Zy5jb2VyY2UoYXJnc1swXSk7XG5cblx0XHRcdGlmICh0eXBlb2YgYXJnc1swXSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0Ly8gQW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJU9cblx0XHRcdFx0YXJncy51bnNoaWZ0KCclTycpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBBcHBseSBhbnkgYGZvcm1hdHRlcnNgIHRyYW5zZm9ybWF0aW9uc1xuXHRcdFx0bGV0IGluZGV4ID0gMDtcblx0XHRcdGFyZ3NbMF0gPSBhcmdzWzBdLnJlcGxhY2UoLyUoW2EtekEtWiVdKS9nLCAobWF0Y2gsIGZvcm1hdCkgPT4ge1xuXHRcdFx0XHQvLyBJZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XG5cdFx0XHRcdGlmIChtYXRjaCA9PT0gJyUlJykge1xuXHRcdFx0XHRcdHJldHVybiAnJSc7XG5cdFx0XHRcdH1cblx0XHRcdFx0aW5kZXgrKztcblx0XHRcdFx0Y29uc3QgZm9ybWF0dGVyID0gY3JlYXRlRGVidWcuZm9ybWF0dGVyc1tmb3JtYXRdO1xuXHRcdFx0XHRpZiAodHlwZW9mIGZvcm1hdHRlciA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNvbnN0IHZhbCA9IGFyZ3NbaW5kZXhdO1xuXHRcdFx0XHRcdG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuXHRcdFx0XHRcdC8vIE5vdyB3ZSBuZWVkIHRvIHJlbW92ZSBgYXJnc1tpbmRleF1gIHNpbmNlIGl0J3MgaW5saW5lZCBpbiB0aGUgYGZvcm1hdGBcblx0XHRcdFx0XHRhcmdzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdFx0aW5kZXgtLTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gQXBwbHkgZW52LXNwZWNpZmljIGZvcm1hdHRpbmcgKGNvbG9ycywgZXRjLilcblx0XHRcdGNyZWF0ZURlYnVnLmZvcm1hdEFyZ3MuY2FsbChzZWxmLCBhcmdzKTtcblxuXHRcdFx0Y29uc3QgbG9nRm4gPSBzZWxmLmxvZyB8fCBjcmVhdGVEZWJ1Zy5sb2c7XG5cdFx0XHRsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcblx0XHR9XG5cblx0XHRkZWJ1Zy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG5cdFx0ZGVidWcudXNlQ29sb3JzID0gY3JlYXRlRGVidWcudXNlQ29sb3JzKCk7XG5cdFx0ZGVidWcuY29sb3IgPSBjcmVhdGVEZWJ1Zy5zZWxlY3RDb2xvcihuYW1lc3BhY2UpO1xuXHRcdGRlYnVnLmV4dGVuZCA9IGV4dGVuZDtcblx0XHRkZWJ1Zy5kZXN0cm95ID0gY3JlYXRlRGVidWcuZGVzdHJveTsgLy8gWFhYIFRlbXBvcmFyeS4gV2lsbCBiZSByZW1vdmVkIGluIHRoZSBuZXh0IG1ham9yIHJlbGVhc2UuXG5cblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZGVidWcsICdlbmFibGVkJywge1xuXHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG5cdFx0XHRnZXQ6ICgpID0+IHtcblx0XHRcdFx0aWYgKGVuYWJsZU92ZXJyaWRlICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGVuYWJsZU92ZXJyaWRlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChuYW1lc3BhY2VzQ2FjaGUgIT09IGNyZWF0ZURlYnVnLm5hbWVzcGFjZXMpIHtcblx0XHRcdFx0XHRuYW1lc3BhY2VzQ2FjaGUgPSBjcmVhdGVEZWJ1Zy5uYW1lc3BhY2VzO1xuXHRcdFx0XHRcdGVuYWJsZWRDYWNoZSA9IGNyZWF0ZURlYnVnLmVuYWJsZWQobmFtZXNwYWNlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBlbmFibGVkQ2FjaGU7XG5cdFx0XHR9LFxuXHRcdFx0c2V0OiB2ID0+IHtcblx0XHRcdFx0ZW5hYmxlT3ZlcnJpZGUgPSB2O1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gRW52LXNwZWNpZmljIGluaXRpYWxpemF0aW9uIGxvZ2ljIGZvciBkZWJ1ZyBpbnN0YW5jZXNcblx0XHRpZiAodHlwZW9mIGNyZWF0ZURlYnVnLmluaXQgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdGNyZWF0ZURlYnVnLmluaXQoZGVidWcpO1xuXHRcdH1cblxuXHRcdHJldHVybiBkZWJ1Zztcblx0fVxuXG5cdGZ1bmN0aW9uIGV4dGVuZChuYW1lc3BhY2UsIGRlbGltaXRlcikge1xuXHRcdGNvbnN0IG5ld0RlYnVnID0gY3JlYXRlRGVidWcodGhpcy5uYW1lc3BhY2UgKyAodHlwZW9mIGRlbGltaXRlciA9PT0gJ3VuZGVmaW5lZCcgPyAnOicgOiBkZWxpbWl0ZXIpICsgbmFtZXNwYWNlKTtcblx0XHRuZXdEZWJ1Zy5sb2cgPSB0aGlzLmxvZztcblx0XHRyZXR1cm4gbmV3RGVidWc7XG5cdH1cblxuXHQvKipcblx0KiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG5cdCogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZW5hYmxlKG5hbWVzcGFjZXMpIHtcblx0XHRjcmVhdGVEZWJ1Zy5zYXZlKG5hbWVzcGFjZXMpO1xuXHRcdGNyZWF0ZURlYnVnLm5hbWVzcGFjZXMgPSBuYW1lc3BhY2VzO1xuXG5cdFx0Y3JlYXRlRGVidWcubmFtZXMgPSBbXTtcblx0XHRjcmVhdGVEZWJ1Zy5za2lwcyA9IFtdO1xuXG5cdFx0bGV0IGk7XG5cdFx0Y29uc3Qgc3BsaXQgPSAodHlwZW9mIG5hbWVzcGFjZXMgPT09ICdzdHJpbmcnID8gbmFtZXNwYWNlcyA6ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuXHRcdGNvbnN0IGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKCFzcGxpdFtpXSkge1xuXHRcdFx0XHQvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0bmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG5cblx0XHRcdGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcblx0XHRcdFx0Y3JlYXRlRGVidWcuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjcmVhdGVEZWJ1Zy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuXHQqXG5cdCogQHJldHVybiB7U3RyaW5nfSBuYW1lc3BhY2VzXG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZGlzYWJsZSgpIHtcblx0XHRjb25zdCBuYW1lc3BhY2VzID0gW1xuXHRcdFx0Li4uY3JlYXRlRGVidWcubmFtZXMubWFwKHRvTmFtZXNwYWNlKSxcblx0XHRcdC4uLmNyZWF0ZURlYnVnLnNraXBzLm1hcCh0b05hbWVzcGFjZSkubWFwKG5hbWVzcGFjZSA9PiAnLScgKyBuYW1lc3BhY2UpXG5cdFx0XS5qb2luKCcsJyk7XG5cdFx0Y3JlYXRlRGVidWcuZW5hYmxlKCcnKTtcblx0XHRyZXR1cm4gbmFtZXNwYWNlcztcblx0fVxuXG5cdC8qKlxuXHQqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG5cdCogQHJldHVybiB7Qm9vbGVhbn1cblx0KiBAYXBpIHB1YmxpY1xuXHQqL1xuXHRmdW5jdGlvbiBlbmFibGVkKG5hbWUpIHtcblx0XHRpZiAobmFtZVtuYW1lLmxlbmd0aCAtIDFdID09PSAnKicpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGxldCBpO1xuXHRcdGxldCBsZW47XG5cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjcmVhdGVEZWJ1Zy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGNyZWF0ZURlYnVnLnNraXBzW2ldLnRlc3QobmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGxlbiA9IGNyZWF0ZURlYnVnLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAoY3JlYXRlRGVidWcubmFtZXNbaV0udGVzdChuYW1lKSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvKipcblx0KiBDb252ZXJ0IHJlZ2V4cCB0byBuYW1lc3BhY2Vcblx0KlxuXHQqIEBwYXJhbSB7UmVnRXhwfSByZWd4ZXBcblx0KiBAcmV0dXJuIHtTdHJpbmd9IG5hbWVzcGFjZVxuXHQqIEBhcGkgcHJpdmF0ZVxuXHQqL1xuXHRmdW5jdGlvbiB0b05hbWVzcGFjZShyZWdleHApIHtcblx0XHRyZXR1cm4gcmVnZXhwLnRvU3RyaW5nKClcblx0XHRcdC5zdWJzdHJpbmcoMiwgcmVnZXhwLnRvU3RyaW5nKCkubGVuZ3RoIC0gMilcblx0XHRcdC5yZXBsYWNlKC9cXC5cXCpcXD8kLywgJyonKTtcblx0fVxuXG5cdC8qKlxuXHQqIENvZXJjZSBgdmFsYC5cblx0KlxuXHQqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuXHQqIEByZXR1cm4ge01peGVkfVxuXHQqIEBhcGkgcHJpdmF0ZVxuXHQqL1xuXHRmdW5jdGlvbiBjb2VyY2UodmFsKSB7XG5cdFx0aWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSB7XG5cdFx0XHRyZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuXHRcdH1cblx0XHRyZXR1cm4gdmFsO1xuXHR9XG5cblx0LyoqXG5cdCogWFhYIERPIE5PVCBVU0UuIFRoaXMgaXMgYSB0ZW1wb3Jhcnkgc3R1YiBmdW5jdGlvbi5cblx0KiBYWFggSXQgV0lMTCBiZSByZW1vdmVkIGluIHRoZSBuZXh0IG1ham9yIHJlbGVhc2UuXG5cdCovXG5cdGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG5cdFx0Y29uc29sZS53YXJuKCdJbnN0YW5jZSBtZXRob2QgYGRlYnVnLmRlc3Ryb3koKWAgaXMgZGVwcmVjYXRlZCBhbmQgbm8gbG9uZ2VyIGRvZXMgYW55dGhpbmcuIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiB0aGUgbmV4dCBtYWpvciB2ZXJzaW9uIG9mIGBkZWJ1Z2AuJyk7XG5cdH1cblxuXHRjcmVhdGVEZWJ1Zy5lbmFibGUoY3JlYXRlRGVidWcubG9hZCgpKTtcblxuXHRyZXR1cm4gY3JlYXRlRGVidWc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dXA7XG4iLCIvKiEgQGxpY2Vuc2UgRE9NUHVyaWZ5IDIuMy4xIHwgKGMpIEN1cmU1MyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIHwgUmVsZWFzZWQgdW5kZXIgdGhlIEFwYWNoZSBsaWNlbnNlIDIuMCBhbmQgTW96aWxsYSBQdWJsaWMgTGljZW5zZSAyLjAgfCBnaXRodWIuY29tL2N1cmU1My9ET01QdXJpZnkvYmxvYi8yLjMuMS9MSUNFTlNFICovXG5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcbiAgKGdsb2JhbCA9IGdsb2JhbCB8fCBzZWxmLCBnbG9iYWwuRE9NUHVyaWZ5ID0gZmFjdG9yeSgpKTtcbn0odGhpcywgZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gX3RvQ29uc3VtYWJsZUFycmF5KGFycikgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IGZvciAodmFyIGkgPSAwLCBhcnIyID0gQXJyYXkoYXJyLmxlbmd0aCk7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHsgYXJyMltpXSA9IGFycltpXTsgfSByZXR1cm4gYXJyMjsgfSBlbHNlIHsgcmV0dXJuIEFycmF5LmZyb20oYXJyKTsgfSB9XG5cbiAgdmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0Lmhhc093blByb3BlcnR5LFxuICAgICAgc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YsXG4gICAgICBpc0Zyb3plbiA9IE9iamVjdC5pc0Zyb3plbixcbiAgICAgIGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mLFxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtcbiAgdmFyIGZyZWV6ZSA9IE9iamVjdC5mcmVlemUsXG4gICAgICBzZWFsID0gT2JqZWN0LnNlYWwsXG4gICAgICBjcmVhdGUgPSBPYmplY3QuY3JlYXRlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGltcG9ydC9uby1tdXRhYmxlLWV4cG9ydHNcblxuICB2YXIgX3JlZiA9IHR5cGVvZiBSZWZsZWN0ICE9PSAndW5kZWZpbmVkJyAmJiBSZWZsZWN0LFxuICAgICAgYXBwbHkgPSBfcmVmLmFwcGx5LFxuICAgICAgY29uc3RydWN0ID0gX3JlZi5jb25zdHJ1Y3Q7XG5cbiAgaWYgKCFhcHBseSkge1xuICAgIGFwcGx5ID0gZnVuY3Rpb24gYXBwbHkoZnVuLCB0aGlzVmFsdWUsIGFyZ3MpIHtcbiAgICAgIHJldHVybiBmdW4uYXBwbHkodGhpc1ZhbHVlLCBhcmdzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFmcmVlemUpIHtcbiAgICBmcmVlemUgPSBmdW5jdGlvbiBmcmVlemUoeCkge1xuICAgICAgcmV0dXJuIHg7XG4gICAgfTtcbiAgfVxuXG4gIGlmICghc2VhbCkge1xuICAgIHNlYWwgPSBmdW5jdGlvbiBzZWFsKHgpIHtcbiAgICAgIHJldHVybiB4O1xuICAgIH07XG4gIH1cblxuICBpZiAoIWNvbnN0cnVjdCkge1xuICAgIGNvbnN0cnVjdCA9IGZ1bmN0aW9uIGNvbnN0cnVjdChGdW5jLCBhcmdzKSB7XG4gICAgICByZXR1cm4gbmV3IChGdW5jdGlvbi5wcm90b3R5cGUuYmluZC5hcHBseShGdW5jLCBbbnVsbF0uY29uY2F0KF90b0NvbnN1bWFibGVBcnJheShhcmdzKSkpKSgpO1xuICAgIH07XG4gIH1cblxuICB2YXIgYXJyYXlGb3JFYWNoID0gdW5hcHBseShBcnJheS5wcm90b3R5cGUuZm9yRWFjaCk7XG4gIHZhciBhcnJheVBvcCA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLnBvcCk7XG4gIHZhciBhcnJheVB1c2ggPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5wdXNoKTtcblxuICB2YXIgc3RyaW5nVG9Mb3dlckNhc2UgPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUudG9Mb3dlckNhc2UpO1xuICB2YXIgc3RyaW5nTWF0Y2ggPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUubWF0Y2gpO1xuICB2YXIgc3RyaW5nUmVwbGFjZSA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS5yZXBsYWNlKTtcbiAgdmFyIHN0cmluZ0luZGV4T2YgPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUuaW5kZXhPZik7XG4gIHZhciBzdHJpbmdUcmltID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnRyaW0pO1xuXG4gIHZhciByZWdFeHBUZXN0ID0gdW5hcHBseShSZWdFeHAucHJvdG90eXBlLnRlc3QpO1xuXG4gIHZhciB0eXBlRXJyb3JDcmVhdGUgPSB1bmNvbnN0cnVjdChUeXBlRXJyb3IpO1xuXG4gIGZ1bmN0aW9uIHVuYXBwbHkoZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGhpc0FyZykge1xuICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgIGFyZ3NbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXBwbHkoZnVuYywgdGhpc0FyZywgYXJncyk7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVuY29uc3RydWN0KGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbjIpLCBfa2V5MiA9IDA7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgICAgYXJnc1tfa2V5Ml0gPSBhcmd1bWVudHNbX2tleTJdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY29uc3RydWN0KGZ1bmMsIGFyZ3MpO1xuICAgIH07XG4gIH1cblxuICAvKiBBZGQgcHJvcGVydGllcyB0byBhIGxvb2t1cCB0YWJsZSAqL1xuICBmdW5jdGlvbiBhZGRUb1NldChzZXQsIGFycmF5KSB7XG4gICAgaWYgKHNldFByb3RvdHlwZU9mKSB7XG4gICAgICAvLyBNYWtlICdpbicgYW5kIHRydXRoeSBjaGVja3MgbGlrZSBCb29sZWFuKHNldC5jb25zdHJ1Y3RvcilcbiAgICAgIC8vIGluZGVwZW5kZW50IG9mIGFueSBwcm9wZXJ0aWVzIGRlZmluZWQgb24gT2JqZWN0LnByb3RvdHlwZS5cbiAgICAgIC8vIFByZXZlbnQgcHJvdG90eXBlIHNldHRlcnMgZnJvbSBpbnRlcmNlcHRpbmcgc2V0IGFzIGEgdGhpcyB2YWx1ZS5cbiAgICAgIHNldFByb3RvdHlwZU9mKHNldCwgbnVsbCk7XG4gICAgfVxuXG4gICAgdmFyIGwgPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGwtLSkge1xuICAgICAgdmFyIGVsZW1lbnQgPSBhcnJheVtsXTtcbiAgICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFyIGxjRWxlbWVudCA9IHN0cmluZ1RvTG93ZXJDYXNlKGVsZW1lbnQpO1xuICAgICAgICBpZiAobGNFbGVtZW50ICE9PSBlbGVtZW50KSB7XG4gICAgICAgICAgLy8gQ29uZmlnIHByZXNldHMgKGUuZy4gdGFncy5qcywgYXR0cnMuanMpIGFyZSBpbW11dGFibGUuXG4gICAgICAgICAgaWYgKCFpc0Zyb3plbihhcnJheSkpIHtcbiAgICAgICAgICAgIGFycmF5W2xdID0gbGNFbGVtZW50O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsZW1lbnQgPSBsY0VsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2V0W2VsZW1lbnRdID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2V0O1xuICB9XG5cbiAgLyogU2hhbGxvdyBjbG9uZSBhbiBvYmplY3QgKi9cbiAgZnVuY3Rpb24gY2xvbmUob2JqZWN0KSB7XG4gICAgdmFyIG5ld09iamVjdCA9IGNyZWF0ZShudWxsKTtcblxuICAgIHZhciBwcm9wZXJ0eSA9IHZvaWQgMDtcbiAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgaWYgKGFwcGx5KGhhc093blByb3BlcnR5LCBvYmplY3QsIFtwcm9wZXJ0eV0pKSB7XG4gICAgICAgIG5ld09iamVjdFtwcm9wZXJ0eV0gPSBvYmplY3RbcHJvcGVydHldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXdPYmplY3Q7XG4gIH1cblxuICAvKiBJRTEwIGRvZXNuJ3Qgc3VwcG9ydCBfX2xvb2t1cEdldHRlcl9fIHNvIGxldHMnXG4gICAqIHNpbXVsYXRlIGl0LiBJdCBhbHNvIGF1dG9tYXRpY2FsbHkgY2hlY2tzXG4gICAqIGlmIHRoZSBwcm9wIGlzIGZ1bmN0aW9uIG9yIGdldHRlciBhbmQgYmVoYXZlc1xuICAgKiBhY2NvcmRpbmdseS4gKi9cbiAgZnVuY3Rpb24gbG9va3VwR2V0dGVyKG9iamVjdCwgcHJvcCkge1xuICAgIHdoaWxlIChvYmplY3QgIT09IG51bGwpIHtcbiAgICAgIHZhciBkZXNjID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgcHJvcCk7XG4gICAgICBpZiAoZGVzYykge1xuICAgICAgICBpZiAoZGVzYy5nZXQpIHtcbiAgICAgICAgICByZXR1cm4gdW5hcHBseShkZXNjLmdldCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGRlc2MudmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICByZXR1cm4gdW5hcHBseShkZXNjLnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBvYmplY3QgPSBnZXRQcm90b3R5cGVPZihvYmplY3QpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZhbGxiYWNrVmFsdWUoZWxlbWVudCkge1xuICAgICAgY29uc29sZS53YXJuKCdmYWxsYmFjayB2YWx1ZSBmb3InLCBlbGVtZW50KTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxsYmFja1ZhbHVlO1xuICB9XG5cbiAgdmFyIGh0bWwgPSBmcmVlemUoWydhJywgJ2FiYnInLCAnYWNyb255bScsICdhZGRyZXNzJywgJ2FyZWEnLCAnYXJ0aWNsZScsICdhc2lkZScsICdhdWRpbycsICdiJywgJ2JkaScsICdiZG8nLCAnYmlnJywgJ2JsaW5rJywgJ2Jsb2NrcXVvdGUnLCAnYm9keScsICdicicsICdidXR0b24nLCAnY2FudmFzJywgJ2NhcHRpb24nLCAnY2VudGVyJywgJ2NpdGUnLCAnY29kZScsICdjb2wnLCAnY29sZ3JvdXAnLCAnY29udGVudCcsICdkYXRhJywgJ2RhdGFsaXN0JywgJ2RkJywgJ2RlY29yYXRvcicsICdkZWwnLCAnZGV0YWlscycsICdkZm4nLCAnZGlhbG9nJywgJ2RpcicsICdkaXYnLCAnZGwnLCAnZHQnLCAnZWxlbWVudCcsICdlbScsICdmaWVsZHNldCcsICdmaWdjYXB0aW9uJywgJ2ZpZ3VyZScsICdmb250JywgJ2Zvb3RlcicsICdmb3JtJywgJ2gxJywgJ2gyJywgJ2gzJywgJ2g0JywgJ2g1JywgJ2g2JywgJ2hlYWQnLCAnaGVhZGVyJywgJ2hncm91cCcsICdocicsICdodG1sJywgJ2knLCAnaW1nJywgJ2lucHV0JywgJ2lucycsICdrYmQnLCAnbGFiZWwnLCAnbGVnZW5kJywgJ2xpJywgJ21haW4nLCAnbWFwJywgJ21hcmsnLCAnbWFycXVlZScsICdtZW51JywgJ21lbnVpdGVtJywgJ21ldGVyJywgJ25hdicsICdub2JyJywgJ29sJywgJ29wdGdyb3VwJywgJ29wdGlvbicsICdvdXRwdXQnLCAncCcsICdwaWN0dXJlJywgJ3ByZScsICdwcm9ncmVzcycsICdxJywgJ3JwJywgJ3J0JywgJ3J1YnknLCAncycsICdzYW1wJywgJ3NlY3Rpb24nLCAnc2VsZWN0JywgJ3NoYWRvdycsICdzbWFsbCcsICdzb3VyY2UnLCAnc3BhY2VyJywgJ3NwYW4nLCAnc3RyaWtlJywgJ3N0cm9uZycsICdzdHlsZScsICdzdWInLCAnc3VtbWFyeScsICdzdXAnLCAndGFibGUnLCAndGJvZHknLCAndGQnLCAndGVtcGxhdGUnLCAndGV4dGFyZWEnLCAndGZvb3QnLCAndGgnLCAndGhlYWQnLCAndGltZScsICd0cicsICd0cmFjaycsICd0dCcsICd1JywgJ3VsJywgJ3ZhcicsICd2aWRlbycsICd3YnInXSk7XG5cbiAgLy8gU1ZHXG4gIHZhciBzdmcgPSBmcmVlemUoWydzdmcnLCAnYScsICdhbHRnbHlwaCcsICdhbHRnbHlwaGRlZicsICdhbHRnbHlwaGl0ZW0nLCAnYW5pbWF0ZWNvbG9yJywgJ2FuaW1hdGVtb3Rpb24nLCAnYW5pbWF0ZXRyYW5zZm9ybScsICdjaXJjbGUnLCAnY2xpcHBhdGgnLCAnZGVmcycsICdkZXNjJywgJ2VsbGlwc2UnLCAnZmlsdGVyJywgJ2ZvbnQnLCAnZycsICdnbHlwaCcsICdnbHlwaHJlZicsICdoa2VybicsICdpbWFnZScsICdsaW5lJywgJ2xpbmVhcmdyYWRpZW50JywgJ21hcmtlcicsICdtYXNrJywgJ21ldGFkYXRhJywgJ21wYXRoJywgJ3BhdGgnLCAncGF0dGVybicsICdwb2x5Z29uJywgJ3BvbHlsaW5lJywgJ3JhZGlhbGdyYWRpZW50JywgJ3JlY3QnLCAnc3RvcCcsICdzdHlsZScsICdzd2l0Y2gnLCAnc3ltYm9sJywgJ3RleHQnLCAndGV4dHBhdGgnLCAndGl0bGUnLCAndHJlZicsICd0c3BhbicsICd2aWV3JywgJ3ZrZXJuJ10pO1xuXG4gIHZhciBzdmdGaWx0ZXJzID0gZnJlZXplKFsnZmVCbGVuZCcsICdmZUNvbG9yTWF0cml4JywgJ2ZlQ29tcG9uZW50VHJhbnNmZXInLCAnZmVDb21wb3NpdGUnLCAnZmVDb252b2x2ZU1hdHJpeCcsICdmZURpZmZ1c2VMaWdodGluZycsICdmZURpc3BsYWNlbWVudE1hcCcsICdmZURpc3RhbnRMaWdodCcsICdmZUZsb29kJywgJ2ZlRnVuY0EnLCAnZmVGdW5jQicsICdmZUZ1bmNHJywgJ2ZlRnVuY1InLCAnZmVHYXVzc2lhbkJsdXInLCAnZmVNZXJnZScsICdmZU1lcmdlTm9kZScsICdmZU1vcnBob2xvZ3knLCAnZmVPZmZzZXQnLCAnZmVQb2ludExpZ2h0JywgJ2ZlU3BlY3VsYXJMaWdodGluZycsICdmZVNwb3RMaWdodCcsICdmZVRpbGUnLCAnZmVUdXJidWxlbmNlJ10pO1xuXG4gIC8vIExpc3Qgb2YgU1ZHIGVsZW1lbnRzIHRoYXQgYXJlIGRpc2FsbG93ZWQgYnkgZGVmYXVsdC5cbiAgLy8gV2Ugc3RpbGwgbmVlZCB0byBrbm93IHRoZW0gc28gdGhhdCB3ZSBjYW4gZG8gbmFtZXNwYWNlXG4gIC8vIGNoZWNrcyBwcm9wZXJseSBpbiBjYXNlIG9uZSB3YW50cyB0byBhZGQgdGhlbSB0b1xuICAvLyBhbGxvdy1saXN0LlxuICB2YXIgc3ZnRGlzYWxsb3dlZCA9IGZyZWV6ZShbJ2FuaW1hdGUnLCAnY29sb3ItcHJvZmlsZScsICdjdXJzb3InLCAnZGlzY2FyZCcsICdmZWRyb3BzaGFkb3cnLCAnZmVpbWFnZScsICdmb250LWZhY2UnLCAnZm9udC1mYWNlLWZvcm1hdCcsICdmb250LWZhY2UtbmFtZScsICdmb250LWZhY2Utc3JjJywgJ2ZvbnQtZmFjZS11cmknLCAnZm9yZWlnbm9iamVjdCcsICdoYXRjaCcsICdoYXRjaHBhdGgnLCAnbWVzaCcsICdtZXNoZ3JhZGllbnQnLCAnbWVzaHBhdGNoJywgJ21lc2hyb3cnLCAnbWlzc2luZy1nbHlwaCcsICdzY3JpcHQnLCAnc2V0JywgJ3NvbGlkY29sb3InLCAndW5rbm93bicsICd1c2UnXSk7XG5cbiAgdmFyIG1hdGhNbCA9IGZyZWV6ZShbJ21hdGgnLCAnbWVuY2xvc2UnLCAnbWVycm9yJywgJ21mZW5jZWQnLCAnbWZyYWMnLCAnbWdseXBoJywgJ21pJywgJ21sYWJlbGVkdHInLCAnbW11bHRpc2NyaXB0cycsICdtbicsICdtbycsICdtb3ZlcicsICdtcGFkZGVkJywgJ21waGFudG9tJywgJ21yb290JywgJ21yb3cnLCAnbXMnLCAnbXNwYWNlJywgJ21zcXJ0JywgJ21zdHlsZScsICdtc3ViJywgJ21zdXAnLCAnbXN1YnN1cCcsICdtdGFibGUnLCAnbXRkJywgJ210ZXh0JywgJ210cicsICdtdW5kZXInLCAnbXVuZGVyb3ZlciddKTtcblxuICAvLyBTaW1pbGFybHkgdG8gU1ZHLCB3ZSB3YW50IHRvIGtub3cgYWxsIE1hdGhNTCBlbGVtZW50cyxcbiAgLy8gZXZlbiB0aG9zZSB0aGF0IHdlIGRpc2FsbG93IGJ5IGRlZmF1bHQuXG4gIHZhciBtYXRoTWxEaXNhbGxvd2VkID0gZnJlZXplKFsnbWFjdGlvbicsICdtYWxpZ25ncm91cCcsICdtYWxpZ25tYXJrJywgJ21sb25nZGl2JywgJ21zY2FycmllcycsICdtc2NhcnJ5JywgJ21zZ3JvdXAnLCAnbXN0YWNrJywgJ21zbGluZScsICdtc3JvdycsICdzZW1hbnRpY3MnLCAnYW5ub3RhdGlvbicsICdhbm5vdGF0aW9uLXhtbCcsICdtcHJlc2NyaXB0cycsICdub25lJ10pO1xuXG4gIHZhciB0ZXh0ID0gZnJlZXplKFsnI3RleHQnXSk7XG5cbiAgdmFyIGh0bWwkMSA9IGZyZWV6ZShbJ2FjY2VwdCcsICdhY3Rpb24nLCAnYWxpZ24nLCAnYWx0JywgJ2F1dG9jYXBpdGFsaXplJywgJ2F1dG9jb21wbGV0ZScsICdhdXRvcGljdHVyZWlucGljdHVyZScsICdhdXRvcGxheScsICdiYWNrZ3JvdW5kJywgJ2JnY29sb3InLCAnYm9yZGVyJywgJ2NhcHR1cmUnLCAnY2VsbHBhZGRpbmcnLCAnY2VsbHNwYWNpbmcnLCAnY2hlY2tlZCcsICdjaXRlJywgJ2NsYXNzJywgJ2NsZWFyJywgJ2NvbG9yJywgJ2NvbHMnLCAnY29sc3BhbicsICdjb250cm9scycsICdjb250cm9sc2xpc3QnLCAnY29vcmRzJywgJ2Nyb3Nzb3JpZ2luJywgJ2RhdGV0aW1lJywgJ2RlY29kaW5nJywgJ2RlZmF1bHQnLCAnZGlyJywgJ2Rpc2FibGVkJywgJ2Rpc2FibGVwaWN0dXJlaW5waWN0dXJlJywgJ2Rpc2FibGVyZW1vdGVwbGF5YmFjaycsICdkb3dubG9hZCcsICdkcmFnZ2FibGUnLCAnZW5jdHlwZScsICdlbnRlcmtleWhpbnQnLCAnZmFjZScsICdmb3InLCAnaGVhZGVycycsICdoZWlnaHQnLCAnaGlkZGVuJywgJ2hpZ2gnLCAnaHJlZicsICdocmVmbGFuZycsICdpZCcsICdpbnB1dG1vZGUnLCAnaW50ZWdyaXR5JywgJ2lzbWFwJywgJ2tpbmQnLCAnbGFiZWwnLCAnbGFuZycsICdsaXN0JywgJ2xvYWRpbmcnLCAnbG9vcCcsICdsb3cnLCAnbWF4JywgJ21heGxlbmd0aCcsICdtZWRpYScsICdtZXRob2QnLCAnbWluJywgJ21pbmxlbmd0aCcsICdtdWx0aXBsZScsICdtdXRlZCcsICduYW1lJywgJ25vc2hhZGUnLCAnbm92YWxpZGF0ZScsICdub3dyYXAnLCAnb3BlbicsICdvcHRpbXVtJywgJ3BhdHRlcm4nLCAncGxhY2Vob2xkZXInLCAncGxheXNpbmxpbmUnLCAncG9zdGVyJywgJ3ByZWxvYWQnLCAncHViZGF0ZScsICdyYWRpb2dyb3VwJywgJ3JlYWRvbmx5JywgJ3JlbCcsICdyZXF1aXJlZCcsICdyZXYnLCAncmV2ZXJzZWQnLCAncm9sZScsICdyb3dzJywgJ3Jvd3NwYW4nLCAnc3BlbGxjaGVjaycsICdzY29wZScsICdzZWxlY3RlZCcsICdzaGFwZScsICdzaXplJywgJ3NpemVzJywgJ3NwYW4nLCAnc3JjbGFuZycsICdzdGFydCcsICdzcmMnLCAnc3Jjc2V0JywgJ3N0ZXAnLCAnc3R5bGUnLCAnc3VtbWFyeScsICd0YWJpbmRleCcsICd0aXRsZScsICd0cmFuc2xhdGUnLCAndHlwZScsICd1c2VtYXAnLCAndmFsaWduJywgJ3ZhbHVlJywgJ3dpZHRoJywgJ3htbG5zJywgJ3Nsb3QnXSk7XG5cbiAgdmFyIHN2ZyQxID0gZnJlZXplKFsnYWNjZW50LWhlaWdodCcsICdhY2N1bXVsYXRlJywgJ2FkZGl0aXZlJywgJ2FsaWdubWVudC1iYXNlbGluZScsICdhc2NlbnQnLCAnYXR0cmlidXRlbmFtZScsICdhdHRyaWJ1dGV0eXBlJywgJ2F6aW11dGgnLCAnYmFzZWZyZXF1ZW5jeScsICdiYXNlbGluZS1zaGlmdCcsICdiZWdpbicsICdiaWFzJywgJ2J5JywgJ2NsYXNzJywgJ2NsaXAnLCAnY2xpcHBhdGh1bml0cycsICdjbGlwLXBhdGgnLCAnY2xpcC1ydWxlJywgJ2NvbG9yJywgJ2NvbG9yLWludGVycG9sYXRpb24nLCAnY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzJywgJ2NvbG9yLXByb2ZpbGUnLCAnY29sb3ItcmVuZGVyaW5nJywgJ2N4JywgJ2N5JywgJ2QnLCAnZHgnLCAnZHknLCAnZGlmZnVzZWNvbnN0YW50JywgJ2RpcmVjdGlvbicsICdkaXNwbGF5JywgJ2Rpdmlzb3InLCAnZHVyJywgJ2VkZ2Vtb2RlJywgJ2VsZXZhdGlvbicsICdlbmQnLCAnZmlsbCcsICdmaWxsLW9wYWNpdHknLCAnZmlsbC1ydWxlJywgJ2ZpbHRlcicsICdmaWx0ZXJ1bml0cycsICdmbG9vZC1jb2xvcicsICdmbG9vZC1vcGFjaXR5JywgJ2ZvbnQtZmFtaWx5JywgJ2ZvbnQtc2l6ZScsICdmb250LXNpemUtYWRqdXN0JywgJ2ZvbnQtc3RyZXRjaCcsICdmb250LXN0eWxlJywgJ2ZvbnQtdmFyaWFudCcsICdmb250LXdlaWdodCcsICdmeCcsICdmeScsICdnMScsICdnMicsICdnbHlwaC1uYW1lJywgJ2dseXBocmVmJywgJ2dyYWRpZW50dW5pdHMnLCAnZ3JhZGllbnR0cmFuc2Zvcm0nLCAnaGVpZ2h0JywgJ2hyZWYnLCAnaWQnLCAnaW1hZ2UtcmVuZGVyaW5nJywgJ2luJywgJ2luMicsICdrJywgJ2sxJywgJ2syJywgJ2szJywgJ2s0JywgJ2tlcm5pbmcnLCAna2V5cG9pbnRzJywgJ2tleXNwbGluZXMnLCAna2V5dGltZXMnLCAnbGFuZycsICdsZW5ndGhhZGp1c3QnLCAnbGV0dGVyLXNwYWNpbmcnLCAna2VybmVsbWF0cml4JywgJ2tlcm5lbHVuaXRsZW5ndGgnLCAnbGlnaHRpbmctY29sb3InLCAnbG9jYWwnLCAnbWFya2VyLWVuZCcsICdtYXJrZXItbWlkJywgJ21hcmtlci1zdGFydCcsICdtYXJrZXJoZWlnaHQnLCAnbWFya2VydW5pdHMnLCAnbWFya2Vyd2lkdGgnLCAnbWFza2NvbnRlbnR1bml0cycsICdtYXNrdW5pdHMnLCAnbWF4JywgJ21hc2snLCAnbWVkaWEnLCAnbWV0aG9kJywgJ21vZGUnLCAnbWluJywgJ25hbWUnLCAnbnVtb2N0YXZlcycsICdvZmZzZXQnLCAnb3BlcmF0b3InLCAnb3BhY2l0eScsICdvcmRlcicsICdvcmllbnQnLCAnb3JpZW50YXRpb24nLCAnb3JpZ2luJywgJ292ZXJmbG93JywgJ3BhaW50LW9yZGVyJywgJ3BhdGgnLCAncGF0aGxlbmd0aCcsICdwYXR0ZXJuY29udGVudHVuaXRzJywgJ3BhdHRlcm50cmFuc2Zvcm0nLCAncGF0dGVybnVuaXRzJywgJ3BvaW50cycsICdwcmVzZXJ2ZWFscGhhJywgJ3ByZXNlcnZlYXNwZWN0cmF0aW8nLCAncHJpbWl0aXZldW5pdHMnLCAncicsICdyeCcsICdyeScsICdyYWRpdXMnLCAncmVmeCcsICdyZWZ5JywgJ3JlcGVhdGNvdW50JywgJ3JlcGVhdGR1cicsICdyZXN0YXJ0JywgJ3Jlc3VsdCcsICdyb3RhdGUnLCAnc2NhbGUnLCAnc2VlZCcsICdzaGFwZS1yZW5kZXJpbmcnLCAnc3BlY3VsYXJjb25zdGFudCcsICdzcGVjdWxhcmV4cG9uZW50JywgJ3NwcmVhZG1ldGhvZCcsICdzdGFydG9mZnNldCcsICdzdGRkZXZpYXRpb24nLCAnc3RpdGNodGlsZXMnLCAnc3RvcC1jb2xvcicsICdzdG9wLW9wYWNpdHknLCAnc3Ryb2tlLWRhc2hhcnJheScsICdzdHJva2UtZGFzaG9mZnNldCcsICdzdHJva2UtbGluZWNhcCcsICdzdHJva2UtbGluZWpvaW4nLCAnc3Ryb2tlLW1pdGVybGltaXQnLCAnc3Ryb2tlLW9wYWNpdHknLCAnc3Ryb2tlJywgJ3N0cm9rZS13aWR0aCcsICdzdHlsZScsICdzdXJmYWNlc2NhbGUnLCAnc3lzdGVtbGFuZ3VhZ2UnLCAndGFiaW5kZXgnLCAndGFyZ2V0eCcsICd0YXJnZXR5JywgJ3RyYW5zZm9ybScsICd0ZXh0LWFuY2hvcicsICd0ZXh0LWRlY29yYXRpb24nLCAndGV4dC1yZW5kZXJpbmcnLCAndGV4dGxlbmd0aCcsICd0eXBlJywgJ3UxJywgJ3UyJywgJ3VuaWNvZGUnLCAndmFsdWVzJywgJ3ZpZXdib3gnLCAndmlzaWJpbGl0eScsICd2ZXJzaW9uJywgJ3ZlcnQtYWR2LXknLCAndmVydC1vcmlnaW4teCcsICd2ZXJ0LW9yaWdpbi15JywgJ3dpZHRoJywgJ3dvcmQtc3BhY2luZycsICd3cmFwJywgJ3dyaXRpbmctbW9kZScsICd4Y2hhbm5lbHNlbGVjdG9yJywgJ3ljaGFubmVsc2VsZWN0b3InLCAneCcsICd4MScsICd4MicsICd4bWxucycsICd5JywgJ3kxJywgJ3kyJywgJ3onLCAnem9vbWFuZHBhbiddKTtcblxuICB2YXIgbWF0aE1sJDEgPSBmcmVlemUoWydhY2NlbnQnLCAnYWNjZW50dW5kZXInLCAnYWxpZ24nLCAnYmV2ZWxsZWQnLCAnY2xvc2UnLCAnY29sdW1uc2FsaWduJywgJ2NvbHVtbmxpbmVzJywgJ2NvbHVtbnNwYW4nLCAnZGVub21hbGlnbicsICdkZXB0aCcsICdkaXInLCAnZGlzcGxheScsICdkaXNwbGF5c3R5bGUnLCAnZW5jb2RpbmcnLCAnZmVuY2UnLCAnZnJhbWUnLCAnaGVpZ2h0JywgJ2hyZWYnLCAnaWQnLCAnbGFyZ2VvcCcsICdsZW5ndGgnLCAnbGluZXRoaWNrbmVzcycsICdsc3BhY2UnLCAnbHF1b3RlJywgJ21hdGhiYWNrZ3JvdW5kJywgJ21hdGhjb2xvcicsICdtYXRoc2l6ZScsICdtYXRodmFyaWFudCcsICdtYXhzaXplJywgJ21pbnNpemUnLCAnbW92YWJsZWxpbWl0cycsICdub3RhdGlvbicsICdudW1hbGlnbicsICdvcGVuJywgJ3Jvd2FsaWduJywgJ3Jvd2xpbmVzJywgJ3Jvd3NwYWNpbmcnLCAncm93c3BhbicsICdyc3BhY2UnLCAncnF1b3RlJywgJ3NjcmlwdGxldmVsJywgJ3NjcmlwdG1pbnNpemUnLCAnc2NyaXB0c2l6ZW11bHRpcGxpZXInLCAnc2VsZWN0aW9uJywgJ3NlcGFyYXRvcicsICdzZXBhcmF0b3JzJywgJ3N0cmV0Y2h5JywgJ3N1YnNjcmlwdHNoaWZ0JywgJ3N1cHNjcmlwdHNoaWZ0JywgJ3N5bW1ldHJpYycsICd2b2Zmc2V0JywgJ3dpZHRoJywgJ3htbG5zJ10pO1xuXG4gIHZhciB4bWwgPSBmcmVlemUoWyd4bGluazpocmVmJywgJ3htbDppZCcsICd4bGluazp0aXRsZScsICd4bWw6c3BhY2UnLCAneG1sbnM6eGxpbmsnXSk7XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vYmV0dGVyLXJlZ2V4XG4gIHZhciBNVVNUQUNIRV9FWFBSID0gc2VhbCgvXFx7XFx7W1xcc1xcU10qfFtcXHNcXFNdKlxcfVxcfS9nbSk7IC8vIFNwZWNpZnkgdGVtcGxhdGUgZGV0ZWN0aW9uIHJlZ2V4IGZvciBTQUZFX0ZPUl9URU1QTEFURVMgbW9kZVxuICB2YXIgRVJCX0VYUFIgPSBzZWFsKC88JVtcXHNcXFNdKnxbXFxzXFxTXSolPi9nbSk7XG4gIHZhciBEQVRBX0FUVFIgPSBzZWFsKC9eZGF0YS1bXFwtXFx3LlxcdTAwQjctXFx1RkZGRl0vKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2VsZXNzLWVzY2FwZVxuICB2YXIgQVJJQV9BVFRSID0gc2VhbCgvXmFyaWEtW1xcLVxcd10rJC8pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZWxlc3MtZXNjYXBlXG4gIHZhciBJU19BTExPV0VEX1VSSSA9IHNlYWwoL14oPzooPzooPzpmfGh0KXRwcz98bWFpbHRvfHRlbHxjYWxsdG98Y2lkfHhtcHApOnxbXmEtel18W2EteisuXFwtXSsoPzpbXmEteisuXFwtOl18JCkpL2kgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2VsZXNzLWVzY2FwZVxuICApO1xuICB2YXIgSVNfU0NSSVBUX09SX0RBVEEgPSBzZWFsKC9eKD86XFx3K3NjcmlwdHxkYXRhKTovaSk7XG4gIHZhciBBVFRSX1dISVRFU1BBQ0UgPSBzZWFsKC9bXFx1MDAwMC1cXHUwMDIwXFx1MDBBMFxcdTE2ODBcXHUxODBFXFx1MjAwMC1cXHUyMDI5XFx1MjA1RlxcdTMwMDBdL2cgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb250cm9sLXJlZ2V4XG4gICk7XG5cbiAgdmFyIF90eXBlb2YgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH0gOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xuXG4gIGZ1bmN0aW9uIF90b0NvbnN1bWFibGVBcnJheSQxKGFycikgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IGZvciAodmFyIGkgPSAwLCBhcnIyID0gQXJyYXkoYXJyLmxlbmd0aCk7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHsgYXJyMltpXSA9IGFycltpXTsgfSByZXR1cm4gYXJyMjsgfSBlbHNlIHsgcmV0dXJuIEFycmF5LmZyb20oYXJyKTsgfSB9XG5cbiAgdmFyIGdldEdsb2JhbCA9IGZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgICByZXR1cm4gdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogd2luZG93O1xuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbm8tb3AgcG9saWN5IGZvciBpbnRlcm5hbCB1c2Ugb25seS5cbiAgICogRG9uJ3QgZXhwb3J0IHRoaXMgZnVuY3Rpb24gb3V0c2lkZSB0aGlzIG1vZHVsZSFcbiAgICogQHBhcmFtIHs/VHJ1c3RlZFR5cGVQb2xpY3lGYWN0b3J5fSB0cnVzdGVkVHlwZXMgVGhlIHBvbGljeSBmYWN0b3J5LlxuICAgKiBAcGFyYW0ge0RvY3VtZW50fSBkb2N1bWVudCBUaGUgZG9jdW1lbnQgb2JqZWN0ICh0byBkZXRlcm1pbmUgcG9saWN5IG5hbWUgc3VmZml4KVxuICAgKiBAcmV0dXJuIHs/VHJ1c3RlZFR5cGVQb2xpY3l9IFRoZSBwb2xpY3kgY3JlYXRlZCAob3IgbnVsbCwgaWYgVHJ1c3RlZCBUeXBlc1xuICAgKiBhcmUgbm90IHN1cHBvcnRlZCkuXG4gICAqL1xuICB2YXIgX2NyZWF0ZVRydXN0ZWRUeXBlc1BvbGljeSA9IGZ1bmN0aW9uIF9jcmVhdGVUcnVzdGVkVHlwZXNQb2xpY3kodHJ1c3RlZFR5cGVzLCBkb2N1bWVudCkge1xuICAgIGlmICgodHlwZW9mIHRydXN0ZWRUeXBlcyA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YodHJ1c3RlZFR5cGVzKSkgIT09ICdvYmplY3QnIHx8IHR5cGVvZiB0cnVzdGVkVHlwZXMuY3JlYXRlUG9saWN5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBBbGxvdyB0aGUgY2FsbGVycyB0byBjb250cm9sIHRoZSB1bmlxdWUgcG9saWN5IG5hbWVcbiAgICAvLyBieSBhZGRpbmcgYSBkYXRhLXR0LXBvbGljeS1zdWZmaXggdG8gdGhlIHNjcmlwdCBlbGVtZW50IHdpdGggdGhlIERPTVB1cmlmeS5cbiAgICAvLyBQb2xpY3kgY3JlYXRpb24gd2l0aCBkdXBsaWNhdGUgbmFtZXMgdGhyb3dzIGluIFRydXN0ZWQgVHlwZXMuXG4gICAgdmFyIHN1ZmZpeCA9IG51bGw7XG4gICAgdmFyIEFUVFJfTkFNRSA9ICdkYXRhLXR0LXBvbGljeS1zdWZmaXgnO1xuICAgIGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0ICYmIGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuaGFzQXR0cmlidXRlKEFUVFJfTkFNRSkpIHtcbiAgICAgIHN1ZmZpeCA9IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuZ2V0QXR0cmlidXRlKEFUVFJfTkFNRSk7XG4gICAgfVxuXG4gICAgdmFyIHBvbGljeU5hbWUgPSAnZG9tcHVyaWZ5JyArIChzdWZmaXggPyAnIycgKyBzdWZmaXggOiAnJyk7XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRydXN0ZWRUeXBlcy5jcmVhdGVQb2xpY3kocG9saWN5TmFtZSwge1xuICAgICAgICBjcmVhdGVIVE1MOiBmdW5jdGlvbiBjcmVhdGVIVE1MKGh0bWwkJDEpIHtcbiAgICAgICAgICByZXR1cm4gaHRtbCQkMTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgLy8gUG9saWN5IGNyZWF0aW9uIGZhaWxlZCAobW9zdCBsaWtlbHkgYW5vdGhlciBET01QdXJpZnkgc2NyaXB0IGhhc1xuICAgICAgLy8gYWxyZWFkeSBydW4pLiBTa2lwIGNyZWF0aW5nIHRoZSBwb2xpY3ksIGFzIHRoaXMgd2lsbCBvbmx5IGNhdXNlIGVycm9yc1xuICAgICAgLy8gaWYgVFQgYXJlIGVuZm9yY2VkLlxuICAgICAgY29uc29sZS53YXJuKCdUcnVzdGVkVHlwZXMgcG9saWN5ICcgKyBwb2xpY3lOYW1lICsgJyBjb3VsZCBub3QgYmUgY3JlYXRlZC4nKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBjcmVhdGVET01QdXJpZnkoKSB7XG4gICAgdmFyIHdpbmRvdyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogZ2V0R2xvYmFsKCk7XG5cbiAgICB2YXIgRE9NUHVyaWZ5ID0gZnVuY3Rpb24gRE9NUHVyaWZ5KHJvb3QpIHtcbiAgICAgIHJldHVybiBjcmVhdGVET01QdXJpZnkocm9vdCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFZlcnNpb24gbGFiZWwsIGV4cG9zZWQgZm9yIGVhc2llciBjaGVja3NcbiAgICAgKiBpZiBET01QdXJpZnkgaXMgdXAgdG8gZGF0ZSBvciBub3RcbiAgICAgKi9cbiAgICBET01QdXJpZnkudmVyc2lvbiA9ICcyLjMuMSc7XG5cbiAgICAvKipcbiAgICAgKiBBcnJheSBvZiBlbGVtZW50cyB0aGF0IERPTVB1cmlmeSByZW1vdmVkIGR1cmluZyBzYW5pdGF0aW9uLlxuICAgICAqIEVtcHR5IGlmIG5vdGhpbmcgd2FzIHJlbW92ZWQuXG4gICAgICovXG4gICAgRE9NUHVyaWZ5LnJlbW92ZWQgPSBbXTtcblxuICAgIGlmICghd2luZG93IHx8ICF3aW5kb3cuZG9jdW1lbnQgfHwgd2luZG93LmRvY3VtZW50Lm5vZGVUeXBlICE9PSA5KSB7XG4gICAgICAvLyBOb3QgcnVubmluZyBpbiBhIGJyb3dzZXIsIHByb3ZpZGUgYSBmYWN0b3J5IGZ1bmN0aW9uXG4gICAgICAvLyBzbyB0aGF0IHlvdSBjYW4gcGFzcyB5b3VyIG93biBXaW5kb3dcbiAgICAgIERPTVB1cmlmeS5pc1N1cHBvcnRlZCA9IGZhbHNlO1xuXG4gICAgICByZXR1cm4gRE9NUHVyaWZ5O1xuICAgIH1cblxuICAgIHZhciBvcmlnaW5hbERvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xuXG4gICAgdmFyIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xuICAgIHZhciBEb2N1bWVudEZyYWdtZW50ID0gd2luZG93LkRvY3VtZW50RnJhZ21lbnQsXG4gICAgICAgIEhUTUxUZW1wbGF0ZUVsZW1lbnQgPSB3aW5kb3cuSFRNTFRlbXBsYXRlRWxlbWVudCxcbiAgICAgICAgTm9kZSA9IHdpbmRvdy5Ob2RlLFxuICAgICAgICBFbGVtZW50ID0gd2luZG93LkVsZW1lbnQsXG4gICAgICAgIE5vZGVGaWx0ZXIgPSB3aW5kb3cuTm9kZUZpbHRlcixcbiAgICAgICAgX3dpbmRvdyROYW1lZE5vZGVNYXAgPSB3aW5kb3cuTmFtZWROb2RlTWFwLFxuICAgICAgICBOYW1lZE5vZGVNYXAgPSBfd2luZG93JE5hbWVkTm9kZU1hcCA9PT0gdW5kZWZpbmVkID8gd2luZG93Lk5hbWVkTm9kZU1hcCB8fCB3aW5kb3cuTW96TmFtZWRBdHRyTWFwIDogX3dpbmRvdyROYW1lZE5vZGVNYXAsXG4gICAgICAgIFRleHQgPSB3aW5kb3cuVGV4dCxcbiAgICAgICAgQ29tbWVudCA9IHdpbmRvdy5Db21tZW50LFxuICAgICAgICBET01QYXJzZXIgPSB3aW5kb3cuRE9NUGFyc2VyLFxuICAgICAgICB0cnVzdGVkVHlwZXMgPSB3aW5kb3cudHJ1c3RlZFR5cGVzO1xuXG5cbiAgICB2YXIgRWxlbWVudFByb3RvdHlwZSA9IEVsZW1lbnQucHJvdG90eXBlO1xuXG4gICAgdmFyIGNsb25lTm9kZSA9IGxvb2t1cEdldHRlcihFbGVtZW50UHJvdG90eXBlLCAnY2xvbmVOb2RlJyk7XG4gICAgdmFyIGdldE5leHRTaWJsaW5nID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICduZXh0U2libGluZycpO1xuICAgIHZhciBnZXRDaGlsZE5vZGVzID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICdjaGlsZE5vZGVzJyk7XG4gICAgdmFyIGdldFBhcmVudE5vZGUgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ3BhcmVudE5vZGUnKTtcblxuICAgIC8vIEFzIHBlciBpc3N1ZSAjNDcsIHRoZSB3ZWItY29tcG9uZW50cyByZWdpc3RyeSBpcyBpbmhlcml0ZWQgYnkgYVxuICAgIC8vIG5ldyBkb2N1bWVudCBjcmVhdGVkIHZpYSBjcmVhdGVIVE1MRG9jdW1lbnQuIEFzIHBlciB0aGUgc3BlY1xuICAgIC8vIChodHRwOi8vdzNjLmdpdGh1Yi5pby93ZWJjb21wb25lbnRzL3NwZWMvY3VzdG9tLyNjcmVhdGluZy1hbmQtcGFzc2luZy1yZWdpc3RyaWVzKVxuICAgIC8vIGEgbmV3IGVtcHR5IHJlZ2lzdHJ5IGlzIHVzZWQgd2hlbiBjcmVhdGluZyBhIHRlbXBsYXRlIGNvbnRlbnRzIG93bmVyXG4gICAgLy8gZG9jdW1lbnQsIHNvIHdlIHVzZSB0aGF0IGFzIG91ciBwYXJlbnQgZG9jdW1lbnQgdG8gZW5zdXJlIG5vdGhpbmdcbiAgICAvLyBpcyBpbmhlcml0ZWQuXG4gICAgaWYgKHR5cGVvZiBIVE1MVGVtcGxhdGVFbGVtZW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgICAgaWYgKHRlbXBsYXRlLmNvbnRlbnQgJiYgdGVtcGxhdGUuY29udGVudC5vd25lckRvY3VtZW50KSB7XG4gICAgICAgIGRvY3VtZW50ID0gdGVtcGxhdGUuY29udGVudC5vd25lckRvY3VtZW50O1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0cnVzdGVkVHlwZXNQb2xpY3kgPSBfY3JlYXRlVHJ1c3RlZFR5cGVzUG9saWN5KHRydXN0ZWRUeXBlcywgb3JpZ2luYWxEb2N1bWVudCk7XG4gICAgdmFyIGVtcHR5SFRNTCA9IHRydXN0ZWRUeXBlc1BvbGljeSAmJiBSRVRVUk5fVFJVU1RFRF9UWVBFID8gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoJycpIDogJyc7XG5cbiAgICB2YXIgX2RvY3VtZW50ID0gZG9jdW1lbnQsXG4gICAgICAgIGltcGxlbWVudGF0aW9uID0gX2RvY3VtZW50LmltcGxlbWVudGF0aW9uLFxuICAgICAgICBjcmVhdGVOb2RlSXRlcmF0b3IgPSBfZG9jdW1lbnQuY3JlYXRlTm9kZUl0ZXJhdG9yLFxuICAgICAgICBjcmVhdGVEb2N1bWVudEZyYWdtZW50ID0gX2RvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQsXG4gICAgICAgIGdldEVsZW1lbnRzQnlUYWdOYW1lID0gX2RvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lO1xuICAgIHZhciBpbXBvcnROb2RlID0gb3JpZ2luYWxEb2N1bWVudC5pbXBvcnROb2RlO1xuXG5cbiAgICB2YXIgZG9jdW1lbnRNb2RlID0ge307XG4gICAgdHJ5IHtcbiAgICAgIGRvY3VtZW50TW9kZSA9IGNsb25lKGRvY3VtZW50KS5kb2N1bWVudE1vZGUgPyBkb2N1bWVudC5kb2N1bWVudE1vZGUgOiB7fTtcbiAgICB9IGNhdGNoIChfKSB7fVxuXG4gICAgdmFyIGhvb2tzID0ge307XG5cbiAgICAvKipcbiAgICAgKiBFeHBvc2Ugd2hldGhlciB0aGlzIGJyb3dzZXIgc3VwcG9ydHMgcnVubmluZyB0aGUgZnVsbCBET01QdXJpZnkuXG4gICAgICovXG4gICAgRE9NUHVyaWZ5LmlzU3VwcG9ydGVkID0gdHlwZW9mIGdldFBhcmVudE5vZGUgPT09ICdmdW5jdGlvbicgJiYgaW1wbGVtZW50YXRpb24gJiYgdHlwZW9mIGltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgZG9jdW1lbnRNb2RlICE9PSA5O1xuXG4gICAgdmFyIE1VU1RBQ0hFX0VYUFIkJDEgPSBNVVNUQUNIRV9FWFBSLFxuICAgICAgICBFUkJfRVhQUiQkMSA9IEVSQl9FWFBSLFxuICAgICAgICBEQVRBX0FUVFIkJDEgPSBEQVRBX0FUVFIsXG4gICAgICAgIEFSSUFfQVRUUiQkMSA9IEFSSUFfQVRUUixcbiAgICAgICAgSVNfU0NSSVBUX09SX0RBVEEkJDEgPSBJU19TQ1JJUFRfT1JfREFUQSxcbiAgICAgICAgQVRUUl9XSElURVNQQUNFJCQxID0gQVRUUl9XSElURVNQQUNFO1xuICAgIHZhciBJU19BTExPV0VEX1VSSSQkMSA9IElTX0FMTE9XRURfVVJJO1xuXG4gICAgLyoqXG4gICAgICogV2UgY29uc2lkZXIgdGhlIGVsZW1lbnRzIGFuZCBhdHRyaWJ1dGVzIGJlbG93IHRvIGJlIHNhZmUuIElkZWFsbHlcbiAgICAgKiBkb24ndCBhZGQgYW55IG5ldyBvbmVzIGJ1dCBmZWVsIGZyZWUgdG8gcmVtb3ZlIHVud2FudGVkIG9uZXMuXG4gICAgICovXG5cbiAgICAvKiBhbGxvd2VkIGVsZW1lbnQgbmFtZXMgKi9cblxuICAgIHZhciBBTExPV0VEX1RBR1MgPSBudWxsO1xuICAgIHZhciBERUZBVUxUX0FMTE9XRURfVEFHUyA9IGFkZFRvU2V0KHt9LCBbXS5jb25jYXQoX3RvQ29uc3VtYWJsZUFycmF5JDEoaHRtbCksIF90b0NvbnN1bWFibGVBcnJheSQxKHN2ZyksIF90b0NvbnN1bWFibGVBcnJheSQxKHN2Z0ZpbHRlcnMpLCBfdG9Db25zdW1hYmxlQXJyYXkkMShtYXRoTWwpLCBfdG9Db25zdW1hYmxlQXJyYXkkMSh0ZXh0KSkpO1xuXG4gICAgLyogQWxsb3dlZCBhdHRyaWJ1dGUgbmFtZXMgKi9cbiAgICB2YXIgQUxMT1dFRF9BVFRSID0gbnVsbDtcbiAgICB2YXIgREVGQVVMVF9BTExPV0VEX0FUVFIgPSBhZGRUb1NldCh7fSwgW10uY29uY2F0KF90b0NvbnN1bWFibGVBcnJheSQxKGh0bWwkMSksIF90b0NvbnN1bWFibGVBcnJheSQxKHN2ZyQxKSwgX3RvQ29uc3VtYWJsZUFycmF5JDEobWF0aE1sJDEpLCBfdG9Db25zdW1hYmxlQXJyYXkkMSh4bWwpKSk7XG5cbiAgICAvKiBFeHBsaWNpdGx5IGZvcmJpZGRlbiB0YWdzIChvdmVycmlkZXMgQUxMT1dFRF9UQUdTL0FERF9UQUdTKSAqL1xuICAgIHZhciBGT1JCSURfVEFHUyA9IG51bGw7XG5cbiAgICAvKiBFeHBsaWNpdGx5IGZvcmJpZGRlbiBhdHRyaWJ1dGVzIChvdmVycmlkZXMgQUxMT1dFRF9BVFRSL0FERF9BVFRSKSAqL1xuICAgIHZhciBGT1JCSURfQVRUUiA9IG51bGw7XG5cbiAgICAvKiBEZWNpZGUgaWYgQVJJQSBhdHRyaWJ1dGVzIGFyZSBva2F5ICovXG4gICAgdmFyIEFMTE9XX0FSSUFfQVRUUiA9IHRydWU7XG5cbiAgICAvKiBEZWNpZGUgaWYgY3VzdG9tIGRhdGEgYXR0cmlidXRlcyBhcmUgb2theSAqL1xuICAgIHZhciBBTExPV19EQVRBX0FUVFIgPSB0cnVlO1xuXG4gICAgLyogRGVjaWRlIGlmIHVua25vd24gcHJvdG9jb2xzIGFyZSBva2F5ICovXG4gICAgdmFyIEFMTE9XX1VOS05PV05fUFJPVE9DT0xTID0gZmFsc2U7XG5cbiAgICAvKiBPdXRwdXQgc2hvdWxkIGJlIHNhZmUgZm9yIGNvbW1vbiB0ZW1wbGF0ZSBlbmdpbmVzLlxuICAgICAqIFRoaXMgbWVhbnMsIERPTVB1cmlmeSByZW1vdmVzIGRhdGEgYXR0cmlidXRlcywgbXVzdGFjaGVzIGFuZCBFUkJcbiAgICAgKi9cbiAgICB2YXIgU0FGRV9GT1JfVEVNUExBVEVTID0gZmFsc2U7XG5cbiAgICAvKiBEZWNpZGUgaWYgZG9jdW1lbnQgd2l0aCA8aHRtbD4uLi4gc2hvdWxkIGJlIHJldHVybmVkICovXG4gICAgdmFyIFdIT0xFX0RPQ1VNRU5UID0gZmFsc2U7XG5cbiAgICAvKiBUcmFjayB3aGV0aGVyIGNvbmZpZyBpcyBhbHJlYWR5IHNldCBvbiB0aGlzIGluc3RhbmNlIG9mIERPTVB1cmlmeS4gKi9cbiAgICB2YXIgU0VUX0NPTkZJRyA9IGZhbHNlO1xuXG4gICAgLyogRGVjaWRlIGlmIGFsbCBlbGVtZW50cyAoZS5nLiBzdHlsZSwgc2NyaXB0KSBtdXN0IGJlIGNoaWxkcmVuIG9mXG4gICAgICogZG9jdW1lbnQuYm9keS4gQnkgZGVmYXVsdCwgYnJvd3NlcnMgbWlnaHQgbW92ZSB0aGVtIHRvIGRvY3VtZW50LmhlYWQgKi9cbiAgICB2YXIgRk9SQ0VfQk9EWSA9IGZhbHNlO1xuXG4gICAgLyogRGVjaWRlIGlmIGEgRE9NIGBIVE1MQm9keUVsZW1lbnRgIHNob3VsZCBiZSByZXR1cm5lZCwgaW5zdGVhZCBvZiBhIGh0bWxcbiAgICAgKiBzdHJpbmcgKG9yIGEgVHJ1c3RlZEhUTUwgb2JqZWN0IGlmIFRydXN0ZWQgVHlwZXMgYXJlIHN1cHBvcnRlZCkuXG4gICAgICogSWYgYFdIT0xFX0RPQ1VNRU5UYCBpcyBlbmFibGVkIGEgYEhUTUxIdG1sRWxlbWVudGAgd2lsbCBiZSByZXR1cm5lZCBpbnN0ZWFkXG4gICAgICovXG4gICAgdmFyIFJFVFVSTl9ET00gPSBmYWxzZTtcblxuICAgIC8qIERlY2lkZSBpZiBhIERPTSBgRG9jdW1lbnRGcmFnbWVudGAgc2hvdWxkIGJlIHJldHVybmVkLCBpbnN0ZWFkIG9mIGEgaHRtbFxuICAgICAqIHN0cmluZyAgKG9yIGEgVHJ1c3RlZEhUTUwgb2JqZWN0IGlmIFRydXN0ZWQgVHlwZXMgYXJlIHN1cHBvcnRlZCkgKi9cbiAgICB2YXIgUkVUVVJOX0RPTV9GUkFHTUVOVCA9IGZhbHNlO1xuXG4gICAgLyogSWYgYFJFVFVSTl9ET01gIG9yIGBSRVRVUk5fRE9NX0ZSQUdNRU5UYCBpcyBlbmFibGVkLCBkZWNpZGUgaWYgdGhlIHJldHVybmVkIERPTVxuICAgICAqIGBOb2RlYCBpcyBpbXBvcnRlZCBpbnRvIHRoZSBjdXJyZW50IGBEb2N1bWVudGAuIElmIHRoaXMgZmxhZyBpcyBub3QgZW5hYmxlZCB0aGVcbiAgICAgKiBgTm9kZWAgd2lsbCBiZWxvbmcgKGl0cyBvd25lckRvY3VtZW50KSB0byBhIGZyZXNoIGBIVE1MRG9jdW1lbnRgLCBjcmVhdGVkIGJ5XG4gICAgICogRE9NUHVyaWZ5LlxuICAgICAqXG4gICAgICogVGhpcyBkZWZhdWx0cyB0byBgdHJ1ZWAgc3RhcnRpbmcgRE9NUHVyaWZ5IDIuMi4wLiBOb3RlIHRoYXQgc2V0dGluZyBpdCB0byBgZmFsc2VgXG4gICAgICogbWlnaHQgY2F1c2UgWFNTIGZyb20gYXR0YWNrcyBoaWRkZW4gaW4gY2xvc2VkIHNoYWRvd3Jvb3RzIGluIGNhc2UgdGhlIGJyb3dzZXJcbiAgICAgKiBzdXBwb3J0cyBEZWNsYXJhdGl2ZSBTaGFkb3c6IERPTSBodHRwczovL3dlYi5kZXYvZGVjbGFyYXRpdmUtc2hhZG93LWRvbS9cbiAgICAgKi9cbiAgICB2YXIgUkVUVVJOX0RPTV9JTVBPUlQgPSB0cnVlO1xuXG4gICAgLyogVHJ5IHRvIHJldHVybiBhIFRydXN0ZWQgVHlwZSBvYmplY3QgaW5zdGVhZCBvZiBhIHN0cmluZywgcmV0dXJuIGEgc3RyaW5nIGluXG4gICAgICogY2FzZSBUcnVzdGVkIFR5cGVzIGFyZSBub3Qgc3VwcG9ydGVkICAqL1xuICAgIHZhciBSRVRVUk5fVFJVU1RFRF9UWVBFID0gZmFsc2U7XG5cbiAgICAvKiBPdXRwdXQgc2hvdWxkIGJlIGZyZWUgZnJvbSBET00gY2xvYmJlcmluZyBhdHRhY2tzPyAqL1xuICAgIHZhciBTQU5JVElaRV9ET00gPSB0cnVlO1xuXG4gICAgLyogS2VlcCBlbGVtZW50IGNvbnRlbnQgd2hlbiByZW1vdmluZyBlbGVtZW50PyAqL1xuICAgIHZhciBLRUVQX0NPTlRFTlQgPSB0cnVlO1xuXG4gICAgLyogSWYgYSBgTm9kZWAgaXMgcGFzc2VkIHRvIHNhbml0aXplKCksIHRoZW4gcGVyZm9ybXMgc2FuaXRpemF0aW9uIGluLXBsYWNlIGluc3RlYWRcbiAgICAgKiBvZiBpbXBvcnRpbmcgaXQgaW50byBhIG5ldyBEb2N1bWVudCBhbmQgcmV0dXJuaW5nIGEgc2FuaXRpemVkIGNvcHkgKi9cbiAgICB2YXIgSU5fUExBQ0UgPSBmYWxzZTtcblxuICAgIC8qIEFsbG93IHVzYWdlIG9mIHByb2ZpbGVzIGxpa2UgaHRtbCwgc3ZnIGFuZCBtYXRoTWwgKi9cbiAgICB2YXIgVVNFX1BST0ZJTEVTID0ge307XG5cbiAgICAvKiBUYWdzIHRvIGlnbm9yZSBjb250ZW50IG9mIHdoZW4gS0VFUF9DT05URU5UIGlzIHRydWUgKi9cbiAgICB2YXIgRk9SQklEX0NPTlRFTlRTID0gbnVsbDtcbiAgICB2YXIgREVGQVVMVF9GT1JCSURfQ09OVEVOVFMgPSBhZGRUb1NldCh7fSwgWydhbm5vdGF0aW9uLXhtbCcsICdhdWRpbycsICdjb2xncm91cCcsICdkZXNjJywgJ2ZvcmVpZ25vYmplY3QnLCAnaGVhZCcsICdpZnJhbWUnLCAnbWF0aCcsICdtaScsICdtbicsICdtbycsICdtcycsICdtdGV4dCcsICdub2VtYmVkJywgJ25vZnJhbWVzJywgJ25vc2NyaXB0JywgJ3BsYWludGV4dCcsICdzY3JpcHQnLCAnc3R5bGUnLCAnc3ZnJywgJ3RlbXBsYXRlJywgJ3RoZWFkJywgJ3RpdGxlJywgJ3ZpZGVvJywgJ3htcCddKTtcblxuICAgIC8qIFRhZ3MgdGhhdCBhcmUgc2FmZSBmb3IgZGF0YTogVVJJcyAqL1xuICAgIHZhciBEQVRBX1VSSV9UQUdTID0gbnVsbDtcbiAgICB2YXIgREVGQVVMVF9EQVRBX1VSSV9UQUdTID0gYWRkVG9TZXQoe30sIFsnYXVkaW8nLCAndmlkZW8nLCAnaW1nJywgJ3NvdXJjZScsICdpbWFnZScsICd0cmFjayddKTtcblxuICAgIC8qIEF0dHJpYnV0ZXMgc2FmZSBmb3IgdmFsdWVzIGxpa2UgXCJqYXZhc2NyaXB0OlwiICovXG4gICAgdmFyIFVSSV9TQUZFX0FUVFJJQlVURVMgPSBudWxsO1xuICAgIHZhciBERUZBVUxUX1VSSV9TQUZFX0FUVFJJQlVURVMgPSBhZGRUb1NldCh7fSwgWydhbHQnLCAnY2xhc3MnLCAnZm9yJywgJ2lkJywgJ2xhYmVsJywgJ25hbWUnLCAncGF0dGVybicsICdwbGFjZWhvbGRlcicsICdyb2xlJywgJ3N1bW1hcnknLCAndGl0bGUnLCAndmFsdWUnLCAnc3R5bGUnLCAneG1sbnMnXSk7XG5cbiAgICB2YXIgTUFUSE1MX05BTUVTUEFDRSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGgvTWF0aE1MJztcbiAgICB2YXIgU1ZHX05BTUVTUEFDRSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gICAgdmFyIEhUTUxfTkFNRVNQQUNFID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwnO1xuICAgIC8qIERvY3VtZW50IG5hbWVzcGFjZSAqL1xuICAgIHZhciBOQU1FU1BBQ0UgPSBIVE1MX05BTUVTUEFDRTtcbiAgICB2YXIgSVNfRU1QVFlfSU5QVVQgPSBmYWxzZTtcblxuICAgIC8qIEtlZXAgYSByZWZlcmVuY2UgdG8gY29uZmlnIHRvIHBhc3MgdG8gaG9va3MgKi9cbiAgICB2YXIgQ09ORklHID0gbnVsbDtcblxuICAgIC8qIElkZWFsbHksIGRvIG5vdCB0b3VjaCBhbnl0aGluZyBiZWxvdyB0aGlzIGxpbmUgKi9cbiAgICAvKiBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fICovXG5cbiAgICB2YXIgZm9ybUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJyk7XG5cbiAgICAvKipcbiAgICAgKiBfcGFyc2VDb25maWdcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gY2ZnIG9wdGlvbmFsIGNvbmZpZyBsaXRlcmFsXG4gICAgICovXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbiAgICB2YXIgX3BhcnNlQ29uZmlnID0gZnVuY3Rpb24gX3BhcnNlQ29uZmlnKGNmZykge1xuICAgICAgaWYgKENPTkZJRyAmJiBDT05GSUcgPT09IGNmZykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8qIFNoaWVsZCBjb25maWd1cmF0aW9uIG9iamVjdCBmcm9tIHRhbXBlcmluZyAqL1xuICAgICAgaWYgKCFjZmcgfHwgKHR5cGVvZiBjZmcgPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKGNmZykpICE9PSAnb2JqZWN0Jykge1xuICAgICAgICBjZmcgPSB7fTtcbiAgICAgIH1cblxuICAgICAgLyogU2hpZWxkIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGZyb20gcHJvdG90eXBlIHBvbGx1dGlvbiAqL1xuICAgICAgY2ZnID0gY2xvbmUoY2ZnKTtcblxuICAgICAgLyogU2V0IGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyAqL1xuICAgICAgQUxMT1dFRF9UQUdTID0gJ0FMTE9XRURfVEFHUycgaW4gY2ZnID8gYWRkVG9TZXQoe30sIGNmZy5BTExPV0VEX1RBR1MpIDogREVGQVVMVF9BTExPV0VEX1RBR1M7XG4gICAgICBBTExPV0VEX0FUVFIgPSAnQUxMT1dFRF9BVFRSJyBpbiBjZmcgPyBhZGRUb1NldCh7fSwgY2ZnLkFMTE9XRURfQVRUUikgOiBERUZBVUxUX0FMTE9XRURfQVRUUjtcbiAgICAgIFVSSV9TQUZFX0FUVFJJQlVURVMgPSAnQUREX1VSSV9TQUZFX0FUVFInIGluIGNmZyA/IGFkZFRvU2V0KGNsb25lKERFRkFVTFRfVVJJX1NBRkVfQVRUUklCVVRFUyksIGNmZy5BRERfVVJJX1NBRkVfQVRUUikgOiBERUZBVUxUX1VSSV9TQUZFX0FUVFJJQlVURVM7XG4gICAgICBEQVRBX1VSSV9UQUdTID0gJ0FERF9EQVRBX1VSSV9UQUdTJyBpbiBjZmcgPyBhZGRUb1NldChjbG9uZShERUZBVUxUX0RBVEFfVVJJX1RBR1MpLCBjZmcuQUREX0RBVEFfVVJJX1RBR1MpIDogREVGQVVMVF9EQVRBX1VSSV9UQUdTO1xuICAgICAgRk9SQklEX0NPTlRFTlRTID0gJ0ZPUkJJRF9DT05URU5UUycgaW4gY2ZnID8gYWRkVG9TZXQoe30sIGNmZy5GT1JCSURfQ09OVEVOVFMpIDogREVGQVVMVF9GT1JCSURfQ09OVEVOVFM7XG4gICAgICBGT1JCSURfVEFHUyA9ICdGT1JCSURfVEFHUycgaW4gY2ZnID8gYWRkVG9TZXQoe30sIGNmZy5GT1JCSURfVEFHUykgOiB7fTtcbiAgICAgIEZPUkJJRF9BVFRSID0gJ0ZPUkJJRF9BVFRSJyBpbiBjZmcgPyBhZGRUb1NldCh7fSwgY2ZnLkZPUkJJRF9BVFRSKSA6IHt9O1xuICAgICAgVVNFX1BST0ZJTEVTID0gJ1VTRV9QUk9GSUxFUycgaW4gY2ZnID8gY2ZnLlVTRV9QUk9GSUxFUyA6IGZhbHNlO1xuICAgICAgQUxMT1dfQVJJQV9BVFRSID0gY2ZnLkFMTE9XX0FSSUFfQVRUUiAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgICAgQUxMT1dfREFUQV9BVFRSID0gY2ZnLkFMTE9XX0RBVEFfQVRUUiAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgICAgQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgPSBjZmcuQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICAgIFNBRkVfRk9SX1RFTVBMQVRFUyA9IGNmZy5TQUZFX0ZPUl9URU1QTEFURVMgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICAgIFdIT0xFX0RPQ1VNRU5UID0gY2ZnLldIT0xFX0RPQ1VNRU5UIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgICBSRVRVUk5fRE9NID0gY2ZnLlJFVFVSTl9ET00gfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICAgIFJFVFVSTl9ET01fRlJBR01FTlQgPSBjZmcuUkVUVVJOX0RPTV9GUkFHTUVOVCB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgICAgUkVUVVJOX0RPTV9JTVBPUlQgPSBjZmcuUkVUVVJOX0RPTV9JTVBPUlQgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICAgIFJFVFVSTl9UUlVTVEVEX1RZUEUgPSBjZmcuUkVUVVJOX1RSVVNURURfVFlQRSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgICAgRk9SQ0VfQk9EWSA9IGNmZy5GT1JDRV9CT0RZIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgICBTQU5JVElaRV9ET00gPSBjZmcuU0FOSVRJWkVfRE9NICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgICBLRUVQX0NPTlRFTlQgPSBjZmcuS0VFUF9DT05URU5UICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgICBJTl9QTEFDRSA9IGNmZy5JTl9QTEFDRSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgICAgSVNfQUxMT1dFRF9VUkkkJDEgPSBjZmcuQUxMT1dFRF9VUklfUkVHRVhQIHx8IElTX0FMTE9XRURfVVJJJCQxO1xuICAgICAgTkFNRVNQQUNFID0gY2ZnLk5BTUVTUEFDRSB8fCBIVE1MX05BTUVTUEFDRTtcbiAgICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMpIHtcbiAgICAgICAgQUxMT1dfREFUQV9BVFRSID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChSRVRVUk5fRE9NX0ZSQUdNRU5UKSB7XG4gICAgICAgIFJFVFVSTl9ET00gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvKiBQYXJzZSBwcm9maWxlIGluZm8gKi9cbiAgICAgIGlmIChVU0VfUFJPRklMRVMpIHtcbiAgICAgICAgQUxMT1dFRF9UQUdTID0gYWRkVG9TZXQoe30sIFtdLmNvbmNhdChfdG9Db25zdW1hYmxlQXJyYXkkMSh0ZXh0KSkpO1xuICAgICAgICBBTExPV0VEX0FUVFIgPSBbXTtcbiAgICAgICAgaWYgKFVTRV9QUk9GSUxFUy5odG1sID09PSB0cnVlKSB7XG4gICAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBodG1sKTtcbiAgICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIGh0bWwkMSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoVVNFX1BST0ZJTEVTLnN2ZyA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgc3ZnKTtcbiAgICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHN2ZyQxKTtcbiAgICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHhtbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoVVNFX1BST0ZJTEVTLnN2Z0ZpbHRlcnMgPT09IHRydWUpIHtcbiAgICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIHN2Z0ZpbHRlcnMpO1xuICAgICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgc3ZnJDEpO1xuICAgICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgeG1sKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVU0VfUFJPRklMRVMubWF0aE1sID09PSB0cnVlKSB7XG4gICAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBtYXRoTWwpO1xuICAgICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgbWF0aE1sJDEpO1xuICAgICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgeG1sKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBNZXJnZSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgKi9cbiAgICAgIGlmIChjZmcuQUREX1RBR1MpIHtcbiAgICAgICAgaWYgKEFMTE9XRURfVEFHUyA9PT0gREVGQVVMVF9BTExPV0VEX1RBR1MpIHtcbiAgICAgICAgICBBTExPV0VEX1RBR1MgPSBjbG9uZShBTExPV0VEX1RBR1MpO1xuICAgICAgICB9XG5cbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBjZmcuQUREX1RBR1MpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2ZnLkFERF9BVFRSKSB7XG4gICAgICAgIGlmIChBTExPV0VEX0FUVFIgPT09IERFRkFVTFRfQUxMT1dFRF9BVFRSKSB7XG4gICAgICAgICAgQUxMT1dFRF9BVFRSID0gY2xvbmUoQUxMT1dFRF9BVFRSKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgY2ZnLkFERF9BVFRSKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNmZy5BRERfVVJJX1NBRkVfQVRUUikge1xuICAgICAgICBhZGRUb1NldChVUklfU0FGRV9BVFRSSUJVVEVTLCBjZmcuQUREX1VSSV9TQUZFX0FUVFIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2ZnLkZPUkJJRF9DT05URU5UUykge1xuICAgICAgICBpZiAoRk9SQklEX0NPTlRFTlRTID09PSBERUZBVUxUX0ZPUkJJRF9DT05URU5UUykge1xuICAgICAgICAgIEZPUkJJRF9DT05URU5UUyA9IGNsb25lKEZPUkJJRF9DT05URU5UUyk7XG4gICAgICAgIH1cblxuICAgICAgICBhZGRUb1NldChGT1JCSURfQ09OVEVOVFMsIGNmZy5GT1JCSURfQ09OVEVOVFMpO1xuICAgICAgfVxuXG4gICAgICAvKiBBZGQgI3RleHQgaW4gY2FzZSBLRUVQX0NPTlRFTlQgaXMgc2V0IHRvIHRydWUgKi9cbiAgICAgIGlmIChLRUVQX0NPTlRFTlQpIHtcbiAgICAgICAgQUxMT1dFRF9UQUdTWycjdGV4dCddID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLyogQWRkIGh0bWwsIGhlYWQgYW5kIGJvZHkgdG8gQUxMT1dFRF9UQUdTIGluIGNhc2UgV0hPTEVfRE9DVU1FTlQgaXMgdHJ1ZSAqL1xuICAgICAgaWYgKFdIT0xFX0RPQ1VNRU5UKSB7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgWydodG1sJywgJ2hlYWQnLCAnYm9keSddKTtcbiAgICAgIH1cblxuICAgICAgLyogQWRkIHRib2R5IHRvIEFMTE9XRURfVEFHUyBpbiBjYXNlIHRhYmxlcyBhcmUgcGVybWl0dGVkLCBzZWUgIzI4NiwgIzM2NSAqL1xuICAgICAgaWYgKEFMTE9XRURfVEFHUy50YWJsZSkge1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIFsndGJvZHknXSk7XG4gICAgICAgIGRlbGV0ZSBGT1JCSURfVEFHUy50Ym9keTtcbiAgICAgIH1cblxuICAgICAgLy8gUHJldmVudCBmdXJ0aGVyIG1hbmlwdWxhdGlvbiBvZiBjb25maWd1cmF0aW9uLlxuICAgICAgLy8gTm90IGF2YWlsYWJsZSBpbiBJRTgsIFNhZmFyaSA1LCBldGMuXG4gICAgICBpZiAoZnJlZXplKSB7XG4gICAgICAgIGZyZWV6ZShjZmcpO1xuICAgICAgfVxuXG4gICAgICBDT05GSUcgPSBjZmc7XG4gICAgfTtcblxuICAgIHZhciBNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFMgPSBhZGRUb1NldCh7fSwgWydtaScsICdtbycsICdtbicsICdtcycsICdtdGV4dCddKTtcblxuICAgIHZhciBIVE1MX0lOVEVHUkFUSU9OX1BPSU5UUyA9IGFkZFRvU2V0KHt9LCBbJ2ZvcmVpZ25vYmplY3QnLCAnZGVzYycsICd0aXRsZScsICdhbm5vdGF0aW9uLXhtbCddKTtcblxuICAgIC8qIEtlZXAgdHJhY2sgb2YgYWxsIHBvc3NpYmxlIFNWRyBhbmQgTWF0aE1MIHRhZ3NcbiAgICAgKiBzbyB0aGF0IHdlIGNhbiBwZXJmb3JtIHRoZSBuYW1lc3BhY2UgY2hlY2tzXG4gICAgICogY29ycmVjdGx5LiAqL1xuICAgIHZhciBBTExfU1ZHX1RBR1MgPSBhZGRUb1NldCh7fSwgc3ZnKTtcbiAgICBhZGRUb1NldChBTExfU1ZHX1RBR1MsIHN2Z0ZpbHRlcnMpO1xuICAgIGFkZFRvU2V0KEFMTF9TVkdfVEFHUywgc3ZnRGlzYWxsb3dlZCk7XG5cbiAgICB2YXIgQUxMX01BVEhNTF9UQUdTID0gYWRkVG9TZXQoe30sIG1hdGhNbCk7XG4gICAgYWRkVG9TZXQoQUxMX01BVEhNTF9UQUdTLCBtYXRoTWxEaXNhbGxvd2VkKTtcblxuICAgIC8qKlxuICAgICAqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtFbGVtZW50fSBlbGVtZW50IGEgRE9NIGVsZW1lbnQgd2hvc2UgbmFtZXNwYWNlIGlzIGJlaW5nIGNoZWNrZWRcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJuIGZhbHNlIGlmIHRoZSBlbGVtZW50IGhhcyBhXG4gICAgICogIG5hbWVzcGFjZSB0aGF0IGEgc3BlYy1jb21wbGlhbnQgcGFyc2VyIHdvdWxkIG5ldmVyXG4gICAgICogIHJldHVybi4gUmV0dXJuIHRydWUgb3RoZXJ3aXNlLlxuICAgICAqL1xuICAgIHZhciBfY2hlY2tWYWxpZE5hbWVzcGFjZSA9IGZ1bmN0aW9uIF9jaGVja1ZhbGlkTmFtZXNwYWNlKGVsZW1lbnQpIHtcbiAgICAgIHZhciBwYXJlbnQgPSBnZXRQYXJlbnROb2RlKGVsZW1lbnQpO1xuXG4gICAgICAvLyBJbiBKU0RPTSwgaWYgd2UncmUgaW5zaWRlIHNoYWRvdyBET00sIHRoZW4gcGFyZW50Tm9kZVxuICAgICAgLy8gY2FuIGJlIG51bGwuIFdlIGp1c3Qgc2ltdWxhdGUgcGFyZW50IGluIHRoaXMgY2FzZS5cbiAgICAgIGlmICghcGFyZW50IHx8ICFwYXJlbnQudGFnTmFtZSkge1xuICAgICAgICBwYXJlbnQgPSB7XG4gICAgICAgICAgbmFtZXNwYWNlVVJJOiBIVE1MX05BTUVTUEFDRSxcbiAgICAgICAgICB0YWdOYW1lOiAndGVtcGxhdGUnXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHZhciB0YWdOYW1lID0gc3RyaW5nVG9Mb3dlckNhc2UoZWxlbWVudC50YWdOYW1lKTtcbiAgICAgIHZhciBwYXJlbnRUYWdOYW1lID0gc3RyaW5nVG9Mb3dlckNhc2UocGFyZW50LnRhZ05hbWUpO1xuXG4gICAgICBpZiAoZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IFNWR19OQU1FU1BBQ0UpIHtcbiAgICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIEhUTUwgbmFtZXNwYWNlIHRvIFNWR1xuICAgICAgICAvLyBpcyB2aWEgPHN2Zz4uIElmIGl0IGhhcHBlbnMgdmlhIGFueSBvdGhlciB0YWcsIHRoZW5cbiAgICAgICAgLy8gaXQgc2hvdWxkIGJlIGtpbGxlZC5cbiAgICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdzdmcnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIE1hdGhNTCB0byBTVkcgaXMgdmlhXG4gICAgICAgIC8vIHN2ZyBpZiBwYXJlbnQgaXMgZWl0aGVyIDxhbm5vdGF0aW9uLXhtbD4gb3IgTWF0aE1MXG4gICAgICAgIC8vIHRleHQgaW50ZWdyYXRpb24gcG9pbnRzLlxuICAgICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gTUFUSE1MX05BTUVTUEFDRSkge1xuICAgICAgICAgIHJldHVybiB0YWdOYW1lID09PSAnc3ZnJyAmJiAocGFyZW50VGFnTmFtZSA9PT0gJ2Fubm90YXRpb24teG1sJyB8fCBNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFNbcGFyZW50VGFnTmFtZV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2Ugb25seSBhbGxvdyBlbGVtZW50cyB0aGF0IGFyZSBkZWZpbmVkIGluIFNWR1xuICAgICAgICAvLyBzcGVjLiBBbGwgb3RoZXJzIGFyZSBkaXNhbGxvd2VkIGluIFNWRyBuYW1lc3BhY2UuXG4gICAgICAgIHJldHVybiBCb29sZWFuKEFMTF9TVkdfVEFHU1t0YWdOYW1lXSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChlbGVtZW50Lm5hbWVzcGFjZVVSSSA9PT0gTUFUSE1MX05BTUVTUEFDRSkge1xuICAgICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gSFRNTCBuYW1lc3BhY2UgdG8gTWF0aE1MXG4gICAgICAgIC8vIGlzIHZpYSA8bWF0aD4uIElmIGl0IGhhcHBlbnMgdmlhIGFueSBvdGhlciB0YWcsIHRoZW5cbiAgICAgICAgLy8gaXQgc2hvdWxkIGJlIGtpbGxlZC5cbiAgICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdtYXRoJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBTVkcgdG8gTWF0aE1MIGlzIHZpYVxuICAgICAgICAvLyA8bWF0aD4gYW5kIEhUTUwgaW50ZWdyYXRpb24gcG9pbnRzXG4gICAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBTVkdfTkFNRVNQQUNFKSB7XG4gICAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdtYXRoJyAmJiBIVE1MX0lOVEVHUkFUSU9OX1BPSU5UU1twYXJlbnRUYWdOYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIG9ubHkgYWxsb3cgZWxlbWVudHMgdGhhdCBhcmUgZGVmaW5lZCBpbiBNYXRoTUxcbiAgICAgICAgLy8gc3BlYy4gQWxsIG90aGVycyBhcmUgZGlzYWxsb3dlZCBpbiBNYXRoTUwgbmFtZXNwYWNlLlxuICAgICAgICByZXR1cm4gQm9vbGVhbihBTExfTUFUSE1MX1RBR1NbdGFnTmFtZV0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBTVkcgdG8gSFRNTCBpcyB2aWFcbiAgICAgICAgLy8gSFRNTCBpbnRlZ3JhdGlvbiBwb2ludHMsIGFuZCBmcm9tIE1hdGhNTCB0byBIVE1MXG4gICAgICAgIC8vIGlzIHZpYSBNYXRoTUwgdGV4dCBpbnRlZ3JhdGlvbiBwb2ludHNcbiAgICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IFNWR19OQU1FU1BBQ0UgJiYgIUhUTUxfSU5URUdSQVRJT05fUE9JTlRTW3BhcmVudFRhZ05hbWVdKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IE1BVEhNTF9OQU1FU1BBQ0UgJiYgIU1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UU1twYXJlbnRUYWdOYW1lXSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENlcnRhaW4gZWxlbWVudHMgYXJlIGFsbG93ZWQgaW4gYm90aCBTVkcgYW5kIEhUTUxcbiAgICAgICAgLy8gbmFtZXNwYWNlLiBXZSBuZWVkIHRvIHNwZWNpZnkgdGhlbSBleHBsaWNpdGx5XG4gICAgICAgIC8vIHNvIHRoYXQgdGhleSBkb24ndCBnZXQgZXJyb25vdXNseSBkZWxldGVkIGZyb21cbiAgICAgICAgLy8gSFRNTCBuYW1lc3BhY2UuXG4gICAgICAgIHZhciBjb21tb25TdmdBbmRIVE1MRWxlbWVudHMgPSBhZGRUb1NldCh7fSwgWyd0aXRsZScsICdzdHlsZScsICdmb250JywgJ2EnLCAnc2NyaXB0J10pO1xuXG4gICAgICAgIC8vIFdlIGRpc2FsbG93IHRhZ3MgdGhhdCBhcmUgc3BlY2lmaWMgZm9yIE1hdGhNTFxuICAgICAgICAvLyBvciBTVkcgYW5kIHNob3VsZCBuZXZlciBhcHBlYXIgaW4gSFRNTCBuYW1lc3BhY2VcbiAgICAgICAgcmV0dXJuICFBTExfTUFUSE1MX1RBR1NbdGFnTmFtZV0gJiYgKGNvbW1vblN2Z0FuZEhUTUxFbGVtZW50c1t0YWdOYW1lXSB8fCAhQUxMX1NWR19UQUdTW3RhZ05hbWVdKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGNvZGUgc2hvdWxkIG5ldmVyIHJlYWNoIHRoaXMgcGxhY2UgKHRoaXMgbWVhbnNcbiAgICAgIC8vIHRoYXQgdGhlIGVsZW1lbnQgc29tZWhvdyBnb3QgbmFtZXNwYWNlIHRoYXQgaXMgbm90XG4gICAgICAvLyBIVE1MLCBTVkcgb3IgTWF0aE1MKS4gUmV0dXJuIGZhbHNlIGp1c3QgaW4gY2FzZS5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogX2ZvcmNlUmVtb3ZlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtOb2RlfSBub2RlIGEgRE9NIG5vZGVcbiAgICAgKi9cbiAgICB2YXIgX2ZvcmNlUmVtb3ZlID0gZnVuY3Rpb24gX2ZvcmNlUmVtb3ZlKG5vZGUpIHtcbiAgICAgIGFycmF5UHVzaChET01QdXJpZnkucmVtb3ZlZCwgeyBlbGVtZW50OiBub2RlIH0pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWRvbS1ub2RlLXJlbW92ZVxuICAgICAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbm9kZS5vdXRlckhUTUwgPSBlbXB0eUhUTUw7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICBub2RlLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIF9yZW1vdmVBdHRyaWJ1dGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gbmFtZSBhbiBBdHRyaWJ1dGUgbmFtZVxuICAgICAqIEBwYXJhbSAge05vZGV9IG5vZGUgYSBET00gbm9kZVxuICAgICAqL1xuICAgIHZhciBfcmVtb3ZlQXR0cmlidXRlID0gZnVuY3Rpb24gX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBub2RlKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgICAgICBhdHRyaWJ1dGU6IG5vZGUuZ2V0QXR0cmlidXRlTm9kZShuYW1lKSxcbiAgICAgICAgICBmcm9tOiBub2RlXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgICAgICBhdHRyaWJ1dGU6IG51bGwsXG4gICAgICAgICAgZnJvbTogbm9kZVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG5cbiAgICAgIC8vIFdlIHZvaWQgYXR0cmlidXRlIHZhbHVlcyBmb3IgdW5yZW1vdmFibGUgXCJpc1wiXCIgYXR0cmlidXRlc1xuICAgICAgaWYgKG5hbWUgPT09ICdpcycgJiYgIUFMTE9XRURfQVRUUltuYW1lXSkge1xuICAgICAgICBpZiAoUkVUVVJOX0RPTSB8fCBSRVRVUk5fRE9NX0ZSQUdNRU5UKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIF9mb3JjZVJlbW92ZShub2RlKTtcbiAgICAgICAgICB9IGNhdGNoIChfKSB7fVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShuYW1lLCAnJyk7XG4gICAgICAgICAgfSBjYXRjaCAoXykge31cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBfaW5pdERvY3VtZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGRpcnR5IGEgc3RyaW5nIG9mIGRpcnR5IG1hcmt1cFxuICAgICAqIEByZXR1cm4ge0RvY3VtZW50fSBhIERPTSwgZmlsbGVkIHdpdGggdGhlIGRpcnR5IG1hcmt1cFxuICAgICAqL1xuICAgIHZhciBfaW5pdERvY3VtZW50ID0gZnVuY3Rpb24gX2luaXREb2N1bWVudChkaXJ0eSkge1xuICAgICAgLyogQ3JlYXRlIGEgSFRNTCBkb2N1bWVudCAqL1xuICAgICAgdmFyIGRvYyA9IHZvaWQgMDtcbiAgICAgIHZhciBsZWFkaW5nV2hpdGVzcGFjZSA9IHZvaWQgMDtcblxuICAgICAgaWYgKEZPUkNFX0JPRFkpIHtcbiAgICAgICAgZGlydHkgPSAnPHJlbW92ZT48L3JlbW92ZT4nICsgZGlydHk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvKiBJZiBGT1JDRV9CT0RZIGlzbid0IHVzZWQsIGxlYWRpbmcgd2hpdGVzcGFjZSBuZWVkcyB0byBiZSBwcmVzZXJ2ZWQgbWFudWFsbHkgKi9cbiAgICAgICAgdmFyIG1hdGNoZXMgPSBzdHJpbmdNYXRjaChkaXJ0eSwgL15bXFxyXFxuXFx0IF0rLyk7XG4gICAgICAgIGxlYWRpbmdXaGl0ZXNwYWNlID0gbWF0Y2hlcyAmJiBtYXRjaGVzWzBdO1xuICAgICAgfVxuXG4gICAgICB2YXIgZGlydHlQYXlsb2FkID0gdHJ1c3RlZFR5cGVzUG9saWN5ID8gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoZGlydHkpIDogZGlydHk7XG4gICAgICAvKlxuICAgICAgICogVXNlIHRoZSBET01QYXJzZXIgQVBJIGJ5IGRlZmF1bHQsIGZhbGxiYWNrIGxhdGVyIGlmIG5lZWRzIGJlXG4gICAgICAgKiBET01QYXJzZXIgbm90IHdvcmsgZm9yIHN2ZyB3aGVuIGhhcyBtdWx0aXBsZSByb290IGVsZW1lbnQuXG4gICAgICAgKi9cbiAgICAgIGlmIChOQU1FU1BBQ0UgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZG9jID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhkaXJ0eVBheWxvYWQsICd0ZXh0L2h0bWwnKTtcbiAgICAgICAgfSBjYXRjaCAoXykge31cbiAgICAgIH1cblxuICAgICAgLyogVXNlIGNyZWF0ZUhUTUxEb2N1bWVudCBpbiBjYXNlIERPTVBhcnNlciBpcyBub3QgYXZhaWxhYmxlICovXG4gICAgICBpZiAoIWRvYyB8fCAhZG9jLmRvY3VtZW50RWxlbWVudCkge1xuICAgICAgICBkb2MgPSBpbXBsZW1lbnRhdGlvbi5jcmVhdGVEb2N1bWVudChOQU1FU1BBQ0UsICd0ZW1wbGF0ZScsIG51bGwpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGRvYy5kb2N1bWVudEVsZW1lbnQuaW5uZXJIVE1MID0gSVNfRU1QVFlfSU5QVVQgPyAnJyA6IGRpcnR5UGF5bG9hZDtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIC8vIFN5bnRheCBlcnJvciBpZiBkaXJ0eVBheWxvYWQgaXMgaW52YWxpZCB4bWxcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgYm9keSA9IGRvYy5ib2R5IHx8IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICAgIGlmIChkaXJ0eSAmJiBsZWFkaW5nV2hpdGVzcGFjZSkge1xuICAgICAgICBib2R5Lmluc2VydEJlZm9yZShkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShsZWFkaW5nV2hpdGVzcGFjZSksIGJvZHkuY2hpbGROb2Rlc1swXSB8fCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgLyogV29yayBvbiB3aG9sZSBkb2N1bWVudCBvciBqdXN0IGl0cyBib2R5ICovXG4gICAgICBpZiAoTkFNRVNQQUNFID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgICByZXR1cm4gZ2V0RWxlbWVudHNCeVRhZ05hbWUuY2FsbChkb2MsIFdIT0xFX0RPQ1VNRU5UID8gJ2h0bWwnIDogJ2JvZHknKVswXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFdIT0xFX0RPQ1VNRU5UID8gZG9jLmRvY3VtZW50RWxlbWVudCA6IGJvZHk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIF9jcmVhdGVJdGVyYXRvclxuICAgICAqXG4gICAgICogQHBhcmFtICB7RG9jdW1lbnR9IHJvb3QgZG9jdW1lbnQvZnJhZ21lbnQgdG8gY3JlYXRlIGl0ZXJhdG9yIGZvclxuICAgICAqIEByZXR1cm4ge0l0ZXJhdG9yfSBpdGVyYXRvciBpbnN0YW5jZVxuICAgICAqL1xuICAgIHZhciBfY3JlYXRlSXRlcmF0b3IgPSBmdW5jdGlvbiBfY3JlYXRlSXRlcmF0b3Iocm9vdCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZU5vZGVJdGVyYXRvci5jYWxsKHJvb3Qub3duZXJEb2N1bWVudCB8fCByb290LCByb290LCBOb2RlRmlsdGVyLlNIT1dfRUxFTUVOVCB8IE5vZGVGaWx0ZXIuU0hPV19DT01NRU5UIHwgTm9kZUZpbHRlci5TSE9XX1RFWFQsIG51bGwsIGZhbHNlKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogX2lzQ2xvYmJlcmVkXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtOb2RlfSBlbG0gZWxlbWVudCB0byBjaGVjayBmb3IgY2xvYmJlcmluZyBhdHRhY2tzXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBjbG9iYmVyZWQsIGZhbHNlIGlmIHNhZmVcbiAgICAgKi9cbiAgICB2YXIgX2lzQ2xvYmJlcmVkID0gZnVuY3Rpb24gX2lzQ2xvYmJlcmVkKGVsbSkge1xuICAgICAgaWYgKGVsbSBpbnN0YW5jZW9mIFRleHQgfHwgZWxtIGluc3RhbmNlb2YgQ29tbWVudCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgZWxtLm5vZGVOYW1lICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgZWxtLnRleHRDb250ZW50ICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgZWxtLnJlbW92ZUNoaWxkICE9PSAnZnVuY3Rpb24nIHx8ICEoZWxtLmF0dHJpYnV0ZXMgaW5zdGFuY2VvZiBOYW1lZE5vZGVNYXApIHx8IHR5cGVvZiBlbG0ucmVtb3ZlQXR0cmlidXRlICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBlbG0uc2V0QXR0cmlidXRlICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBlbG0ubmFtZXNwYWNlVVJJICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgZWxtLmluc2VydEJlZm9yZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBfaXNOb2RlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtOb2RlfSBvYmogb2JqZWN0IHRvIGNoZWNrIHdoZXRoZXIgaXQncyBhIERPTSBub2RlXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpcyBvYmplY3QgaXMgYSBET00gbm9kZVxuICAgICAqL1xuICAgIHZhciBfaXNOb2RlID0gZnVuY3Rpb24gX2lzTm9kZShvYmplY3QpIHtcbiAgICAgIHJldHVybiAodHlwZW9mIE5vZGUgPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKE5vZGUpKSA9PT0gJ29iamVjdCcgPyBvYmplY3QgaW5zdGFuY2VvZiBOb2RlIDogb2JqZWN0ICYmICh0eXBlb2Ygb2JqZWN0ID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihvYmplY3QpKSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG9iamVjdC5ub2RlVHlwZSA9PT0gJ251bWJlcicgJiYgdHlwZW9mIG9iamVjdC5ub2RlTmFtZSA9PT0gJ3N0cmluZyc7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIF9leGVjdXRlSG9va1xuICAgICAqIEV4ZWN1dGUgdXNlciBjb25maWd1cmFibGUgaG9va3NcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZW50cnlQb2ludCAgTmFtZSBvZiB0aGUgaG9vaydzIGVudHJ5IHBvaW50XG4gICAgICogQHBhcmFtICB7Tm9kZX0gY3VycmVudE5vZGUgbm9kZSB0byB3b3JrIG9uIHdpdGggdGhlIGhvb2tcbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IGRhdGEgYWRkaXRpb25hbCBob29rIHBhcmFtZXRlcnNcbiAgICAgKi9cbiAgICB2YXIgX2V4ZWN1dGVIb29rID0gZnVuY3Rpb24gX2V4ZWN1dGVIb29rKGVudHJ5UG9pbnQsIGN1cnJlbnROb2RlLCBkYXRhKSB7XG4gICAgICBpZiAoIWhvb2tzW2VudHJ5UG9pbnRdKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXJyYXlGb3JFYWNoKGhvb2tzW2VudHJ5UG9pbnRdLCBmdW5jdGlvbiAoaG9vaykge1xuICAgICAgICBob29rLmNhbGwoRE9NUHVyaWZ5LCBjdXJyZW50Tm9kZSwgZGF0YSwgQ09ORklHKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBfc2FuaXRpemVFbGVtZW50c1xuICAgICAqXG4gICAgICogQHByb3RlY3Qgbm9kZU5hbWVcbiAgICAgKiBAcHJvdGVjdCB0ZXh0Q29udGVudFxuICAgICAqIEBwcm90ZWN0IHJlbW92ZUNoaWxkXG4gICAgICpcbiAgICAgKiBAcGFyYW0gICB7Tm9kZX0gY3VycmVudE5vZGUgdG8gY2hlY2sgZm9yIHBlcm1pc3Npb24gdG8gZXhpc3RcbiAgICAgKiBAcmV0dXJuICB7Qm9vbGVhbn0gdHJ1ZSBpZiBub2RlIHdhcyBraWxsZWQsIGZhbHNlIGlmIGxlZnQgYWxpdmVcbiAgICAgKi9cbiAgICB2YXIgX3Nhbml0aXplRWxlbWVudHMgPSBmdW5jdGlvbiBfc2FuaXRpemVFbGVtZW50cyhjdXJyZW50Tm9kZSkge1xuICAgICAgdmFyIGNvbnRlbnQgPSB2b2lkIDA7XG5cbiAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgIF9leGVjdXRlSG9vaygnYmVmb3JlU2FuaXRpemVFbGVtZW50cycsIGN1cnJlbnROb2RlLCBudWxsKTtcblxuICAgICAgLyogQ2hlY2sgaWYgZWxlbWVudCBpcyBjbG9iYmVyZWQgb3IgY2FuIGNsb2JiZXIgKi9cbiAgICAgIGlmIChfaXNDbG9iYmVyZWQoY3VycmVudE5vZGUpKSB7XG4gICAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvKiBDaGVjayBpZiB0YWduYW1lIGNvbnRhaW5zIFVuaWNvZGUgKi9cbiAgICAgIGlmIChzdHJpbmdNYXRjaChjdXJyZW50Tm9kZS5ub2RlTmFtZSwgL1tcXHUwMDgwLVxcdUZGRkZdLykpIHtcbiAgICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8qIE5vdyBsZXQncyBjaGVjayB0aGUgZWxlbWVudCdzIHR5cGUgYW5kIG5hbWUgKi9cbiAgICAgIHZhciB0YWdOYW1lID0gc3RyaW5nVG9Mb3dlckNhc2UoY3VycmVudE5vZGUubm9kZU5hbWUpO1xuXG4gICAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgICBfZXhlY3V0ZUhvb2soJ3Vwb25TYW5pdGl6ZUVsZW1lbnQnLCBjdXJyZW50Tm9kZSwge1xuICAgICAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgICAgICBhbGxvd2VkVGFnczogQUxMT1dFRF9UQUdTXG4gICAgICB9KTtcblxuICAgICAgLyogRGV0ZWN0IG1YU1MgYXR0ZW1wdHMgYWJ1c2luZyBuYW1lc3BhY2UgY29uZnVzaW9uICovXG4gICAgICBpZiAoIV9pc05vZGUoY3VycmVudE5vZGUuZmlyc3RFbGVtZW50Q2hpbGQpICYmICghX2lzTm9kZShjdXJyZW50Tm9kZS5jb250ZW50KSB8fCAhX2lzTm9kZShjdXJyZW50Tm9kZS5jb250ZW50LmZpcnN0RWxlbWVudENoaWxkKSkgJiYgcmVnRXhwVGVzdCgvPFsvXFx3XS9nLCBjdXJyZW50Tm9kZS5pbm5lckhUTUwpICYmIHJlZ0V4cFRlc3QoLzxbL1xcd10vZywgY3VycmVudE5vZGUudGV4dENvbnRlbnQpKSB7XG4gICAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvKiBNaXRpZ2F0ZSBhIHByb2JsZW0gd2l0aCB0ZW1wbGF0ZXMgaW5zaWRlIHNlbGVjdCAqL1xuICAgICAgaWYgKHRhZ05hbWUgPT09ICdzZWxlY3QnICYmIHJlZ0V4cFRlc3QoLzx0ZW1wbGF0ZS9pLCBjdXJyZW50Tm9kZS5pbm5lckhUTUwpKSB7XG4gICAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvKiBSZW1vdmUgZWxlbWVudCBpZiBhbnl0aGluZyBmb3JiaWRzIGl0cyBwcmVzZW5jZSAqL1xuICAgICAgaWYgKCFBTExPV0VEX1RBR1NbdGFnTmFtZV0gfHwgRk9SQklEX1RBR1NbdGFnTmFtZV0pIHtcbiAgICAgICAgLyogS2VlcCBjb250ZW50IGV4Y2VwdCBmb3IgYmFkLWxpc3RlZCBlbGVtZW50cyAqL1xuICAgICAgICBpZiAoS0VFUF9DT05URU5UICYmICFGT1JCSURfQ09OVEVOVFNbdGFnTmFtZV0pIHtcbiAgICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGdldFBhcmVudE5vZGUoY3VycmVudE5vZGUpIHx8IGN1cnJlbnROb2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgdmFyIGNoaWxkTm9kZXMgPSBnZXRDaGlsZE5vZGVzKGN1cnJlbnROb2RlKSB8fCBjdXJyZW50Tm9kZS5jaGlsZE5vZGVzO1xuXG4gICAgICAgICAgaWYgKGNoaWxkTm9kZXMgJiYgcGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgdmFyIGNoaWxkQ291bnQgPSBjaGlsZE5vZGVzLmxlbmd0aDtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGNoaWxkQ291bnQgLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZShjbG9uZU5vZGUoY2hpbGROb2Rlc1tpXSwgdHJ1ZSksIGdldE5leHRTaWJsaW5nKGN1cnJlbnROb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8qIENoZWNrIHdoZXRoZXIgZWxlbWVudCBoYXMgYSB2YWxpZCBuYW1lc3BhY2UgKi9cbiAgICAgIGlmIChjdXJyZW50Tm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQgJiYgIV9jaGVja1ZhbGlkTmFtZXNwYWNlKGN1cnJlbnROb2RlKSkge1xuICAgICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCh0YWdOYW1lID09PSAnbm9zY3JpcHQnIHx8IHRhZ05hbWUgPT09ICdub2VtYmVkJykgJiYgcmVnRXhwVGVzdCgvPFxcL25vKHNjcmlwdHxlbWJlZCkvaSwgY3VycmVudE5vZGUuaW5uZXJIVE1MKSkge1xuICAgICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLyogU2FuaXRpemUgZWxlbWVudCBjb250ZW50IHRvIGJlIHRlbXBsYXRlLXNhZmUgKi9cbiAgICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMgJiYgY3VycmVudE5vZGUubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgLyogR2V0IHRoZSBlbGVtZW50J3MgdGV4dCBjb250ZW50ICovXG4gICAgICAgIGNvbnRlbnQgPSBjdXJyZW50Tm9kZS50ZXh0Q29udGVudDtcbiAgICAgICAgY29udGVudCA9IHN0cmluZ1JlcGxhY2UoY29udGVudCwgTVVTVEFDSEVfRVhQUiQkMSwgJyAnKTtcbiAgICAgICAgY29udGVudCA9IHN0cmluZ1JlcGxhY2UoY29udGVudCwgRVJCX0VYUFIkJDEsICcgJyk7XG4gICAgICAgIGlmIChjdXJyZW50Tm9kZS50ZXh0Q29udGVudCAhPT0gY29udGVudCkge1xuICAgICAgICAgIGFycmF5UHVzaChET01QdXJpZnkucmVtb3ZlZCwgeyBlbGVtZW50OiBjdXJyZW50Tm9kZS5jbG9uZU5vZGUoKSB9KTtcbiAgICAgICAgICBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgX2V4ZWN1dGVIb29rKCdhZnRlclNhbml0aXplRWxlbWVudHMnLCBjdXJyZW50Tm9kZSwgbnVsbCk7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogX2lzVmFsaWRBdHRyaWJ1dGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gbGNUYWcgTG93ZXJjYXNlIHRhZyBuYW1lIG9mIGNvbnRhaW5pbmcgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IGxjTmFtZSBMb3dlcmNhc2UgYXR0cmlidXRlIG5hbWUuXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSB2YWx1ZSBBdHRyaWJ1dGUgdmFsdWUuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIGB2YWx1ZWAgaXMgdmFsaWQsIG90aGVyd2lzZSBmYWxzZS5cbiAgICAgKi9cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuICAgIHZhciBfaXNWYWxpZEF0dHJpYnV0ZSA9IGZ1bmN0aW9uIF9pc1ZhbGlkQXR0cmlidXRlKGxjVGFnLCBsY05hbWUsIHZhbHVlKSB7XG4gICAgICAvKiBNYWtlIHN1cmUgYXR0cmlidXRlIGNhbm5vdCBjbG9iYmVyICovXG4gICAgICBpZiAoU0FOSVRJWkVfRE9NICYmIChsY05hbWUgPT09ICdpZCcgfHwgbGNOYW1lID09PSAnbmFtZScpICYmICh2YWx1ZSBpbiBkb2N1bWVudCB8fCB2YWx1ZSBpbiBmb3JtRWxlbWVudCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvKiBBbGxvdyB2YWxpZCBkYXRhLSogYXR0cmlidXRlczogQXQgbGVhc3Qgb25lIGNoYXJhY3RlciBhZnRlciBcIi1cIlxuICAgICAgICAgIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9kb20uaHRtbCNlbWJlZGRpbmctY3VzdG9tLW5vbi12aXNpYmxlLWRhdGEtd2l0aC10aGUtZGF0YS0qLWF0dHJpYnV0ZXMpXG4gICAgICAgICAgWE1MLWNvbXBhdGlibGUgKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZnJhc3RydWN0dXJlLmh0bWwjeG1sLWNvbXBhdGlibGUgYW5kIGh0dHA6Ly93d3cudzMub3JnL1RSL3htbC8jZDBlODA0KVxuICAgICAgICAgIFdlIGRvbid0IG5lZWQgdG8gY2hlY2sgdGhlIHZhbHVlOyBpdCdzIGFsd2F5cyBVUkkgc2FmZS4gKi9cbiAgICAgIGlmIChBTExPV19EQVRBX0FUVFIgJiYgIUZPUkJJRF9BVFRSW2xjTmFtZV0gJiYgcmVnRXhwVGVzdChEQVRBX0FUVFIkJDEsIGxjTmFtZSkpIDsgZWxzZSBpZiAoQUxMT1dfQVJJQV9BVFRSICYmIHJlZ0V4cFRlc3QoQVJJQV9BVFRSJCQxLCBsY05hbWUpKSA7IGVsc2UgaWYgKCFBTExPV0VEX0FUVFJbbGNOYW1lXSB8fCBGT1JCSURfQVRUUltsY05hbWVdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAvKiBDaGVjayB2YWx1ZSBpcyBzYWZlLiBGaXJzdCwgaXMgYXR0ciBpbmVydD8gSWYgc28sIGlzIHNhZmUgKi9cbiAgICAgIH0gZWxzZSBpZiAoVVJJX1NBRkVfQVRUUklCVVRFU1tsY05hbWVdKSA7IGVsc2UgaWYgKHJlZ0V4cFRlc3QoSVNfQUxMT1dFRF9VUkkkJDEsIHN0cmluZ1JlcGxhY2UodmFsdWUsIEFUVFJfV0hJVEVTUEFDRSQkMSwgJycpKSkgOyBlbHNlIGlmICgobGNOYW1lID09PSAnc3JjJyB8fCBsY05hbWUgPT09ICd4bGluazpocmVmJyB8fCBsY05hbWUgPT09ICdocmVmJykgJiYgbGNUYWcgIT09ICdzY3JpcHQnICYmIHN0cmluZ0luZGV4T2YodmFsdWUsICdkYXRhOicpID09PSAwICYmIERBVEFfVVJJX1RBR1NbbGNUYWddKSA7IGVsc2UgaWYgKEFMTE9XX1VOS05PV05fUFJPVE9DT0xTICYmICFyZWdFeHBUZXN0KElTX1NDUklQVF9PUl9EQVRBJCQxLCBzdHJpbmdSZXBsYWNlKHZhbHVlLCBBVFRSX1dISVRFU1BBQ0UkJDEsICcnKSkpIDsgZWxzZSBpZiAoIXZhbHVlKSA7IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBfc2FuaXRpemVBdHRyaWJ1dGVzXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdCBhdHRyaWJ1dGVzXG4gICAgICogQHByb3RlY3Qgbm9kZU5hbWVcbiAgICAgKiBAcHJvdGVjdCByZW1vdmVBdHRyaWJ1dGVcbiAgICAgKiBAcHJvdGVjdCBzZXRBdHRyaWJ1dGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge05vZGV9IGN1cnJlbnROb2RlIHRvIHNhbml0aXplXG4gICAgICovXG4gICAgdmFyIF9zYW5pdGl6ZUF0dHJpYnV0ZXMgPSBmdW5jdGlvbiBfc2FuaXRpemVBdHRyaWJ1dGVzKGN1cnJlbnROb2RlKSB7XG4gICAgICB2YXIgYXR0ciA9IHZvaWQgMDtcbiAgICAgIHZhciB2YWx1ZSA9IHZvaWQgMDtcbiAgICAgIHZhciBsY05hbWUgPSB2b2lkIDA7XG4gICAgICB2YXIgbCA9IHZvaWQgMDtcbiAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgIF9leGVjdXRlSG9vaygnYmVmb3JlU2FuaXRpemVBdHRyaWJ1dGVzJywgY3VycmVudE5vZGUsIG51bGwpO1xuXG4gICAgICB2YXIgYXR0cmlidXRlcyA9IGN1cnJlbnROb2RlLmF0dHJpYnV0ZXM7XG5cbiAgICAgIC8qIENoZWNrIGlmIHdlIGhhdmUgYXR0cmlidXRlczsgaWYgbm90IHdlIG1pZ2h0IGhhdmUgYSB0ZXh0IG5vZGUgKi9cblxuICAgICAgaWYgKCFhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIGhvb2tFdmVudCA9IHtcbiAgICAgICAgYXR0ck5hbWU6ICcnLFxuICAgICAgICBhdHRyVmFsdWU6ICcnLFxuICAgICAgICBrZWVwQXR0cjogdHJ1ZSxcbiAgICAgICAgYWxsb3dlZEF0dHJpYnV0ZXM6IEFMTE9XRURfQVRUUlxuICAgICAgfTtcbiAgICAgIGwgPSBhdHRyaWJ1dGVzLmxlbmd0aDtcblxuICAgICAgLyogR28gYmFja3dhcmRzIG92ZXIgYWxsIGF0dHJpYnV0ZXM7IHNhZmVseSByZW1vdmUgYmFkIG9uZXMgKi9cbiAgICAgIHdoaWxlIChsLS0pIHtcbiAgICAgICAgYXR0ciA9IGF0dHJpYnV0ZXNbbF07XG4gICAgICAgIHZhciBfYXR0ciA9IGF0dHIsXG4gICAgICAgICAgICBuYW1lID0gX2F0dHIubmFtZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZVVSSSA9IF9hdHRyLm5hbWVzcGFjZVVSSTtcblxuICAgICAgICB2YWx1ZSA9IHN0cmluZ1RyaW0oYXR0ci52YWx1ZSk7XG4gICAgICAgIGxjTmFtZSA9IHN0cmluZ1RvTG93ZXJDYXNlKG5hbWUpO1xuXG4gICAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgICAgaG9va0V2ZW50LmF0dHJOYW1lID0gbGNOYW1lO1xuICAgICAgICBob29rRXZlbnQuYXR0clZhbHVlID0gdmFsdWU7XG4gICAgICAgIGhvb2tFdmVudC5rZWVwQXR0ciA9IHRydWU7XG4gICAgICAgIGhvb2tFdmVudC5mb3JjZUtlZXBBdHRyID0gdW5kZWZpbmVkOyAvLyBBbGxvd3MgZGV2ZWxvcGVycyB0byBzZWUgdGhpcyBpcyBhIHByb3BlcnR5IHRoZXkgY2FuIHNldFxuICAgICAgICBfZXhlY3V0ZUhvb2soJ3Vwb25TYW5pdGl6ZUF0dHJpYnV0ZScsIGN1cnJlbnROb2RlLCBob29rRXZlbnQpO1xuICAgICAgICB2YWx1ZSA9IGhvb2tFdmVudC5hdHRyVmFsdWU7XG4gICAgICAgIC8qIERpZCB0aGUgaG9va3MgYXBwcm92ZSBvZiB0aGUgYXR0cmlidXRlPyAqL1xuICAgICAgICBpZiAoaG9va0V2ZW50LmZvcmNlS2VlcEF0dHIpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIFJlbW92ZSBhdHRyaWJ1dGUgKi9cbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG5cbiAgICAgICAgLyogRGlkIHRoZSBob29rcyBhcHByb3ZlIG9mIHRoZSBhdHRyaWJ1dGU/ICovXG4gICAgICAgIGlmICghaG9va0V2ZW50LmtlZXBBdHRyKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBXb3JrIGFyb3VuZCBhIHNlY3VyaXR5IGlzc3VlIGluIGpRdWVyeSAzLjAgKi9cbiAgICAgICAgaWYgKHJlZ0V4cFRlc3QoL1xcLz4vaSwgdmFsdWUpKSB7XG4gICAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBTYW5pdGl6ZSBhdHRyaWJ1dGUgY29udGVudCB0byBiZSB0ZW1wbGF0ZS1zYWZlICovXG4gICAgICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMpIHtcbiAgICAgICAgICB2YWx1ZSA9IHN0cmluZ1JlcGxhY2UodmFsdWUsIE1VU1RBQ0hFX0VYUFIkJDEsICcgJyk7XG4gICAgICAgICAgdmFsdWUgPSBzdHJpbmdSZXBsYWNlKHZhbHVlLCBFUkJfRVhQUiQkMSwgJyAnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIElzIGB2YWx1ZWAgdmFsaWQgZm9yIHRoaXMgYXR0cmlidXRlPyAqL1xuICAgICAgICB2YXIgbGNUYWcgPSBjdXJyZW50Tm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAoIV9pc1ZhbGlkQXR0cmlidXRlKGxjVGFnLCBsY05hbWUsIHZhbHVlKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogSGFuZGxlIGludmFsaWQgZGF0YS0qIGF0dHJpYnV0ZSBzZXQgYnkgdHJ5LWNhdGNoaW5nIGl0ICovXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKG5hbWVzcGFjZVVSSSkge1xuICAgICAgICAgICAgY3VycmVudE5vZGUuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8qIEZhbGxiYWNrIHRvIHNldEF0dHJpYnV0ZSgpIGZvciBicm93c2VyLXVucmVjb2duaXplZCBuYW1lc3BhY2VzIGUuZy4gXCJ4LXNjaGVtYVwiLiAqL1xuICAgICAgICAgICAgY3VycmVudE5vZGUuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhcnJheVBvcChET01QdXJpZnkucmVtb3ZlZCk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHt9XG4gICAgICB9XG5cbiAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgIF9leGVjdXRlSG9vaygnYWZ0ZXJTYW5pdGl6ZUF0dHJpYnV0ZXMnLCBjdXJyZW50Tm9kZSwgbnVsbCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIF9zYW5pdGl6ZVNoYWRvd0RPTVxuICAgICAqXG4gICAgICogQHBhcmFtICB7RG9jdW1lbnRGcmFnbWVudH0gZnJhZ21lbnQgdG8gaXRlcmF0ZSBvdmVyIHJlY3Vyc2l2ZWx5XG4gICAgICovXG4gICAgdmFyIF9zYW5pdGl6ZVNoYWRvd0RPTSA9IGZ1bmN0aW9uIF9zYW5pdGl6ZVNoYWRvd0RPTShmcmFnbWVudCkge1xuICAgICAgdmFyIHNoYWRvd05vZGUgPSB2b2lkIDA7XG4gICAgICB2YXIgc2hhZG93SXRlcmF0b3IgPSBfY3JlYXRlSXRlcmF0b3IoZnJhZ21lbnQpO1xuXG4gICAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgICBfZXhlY3V0ZUhvb2soJ2JlZm9yZVNhbml0aXplU2hhZG93RE9NJywgZnJhZ21lbnQsIG51bGwpO1xuXG4gICAgICB3aGlsZSAoc2hhZG93Tm9kZSA9IHNoYWRvd0l0ZXJhdG9yLm5leHROb2RlKCkpIHtcbiAgICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgICBfZXhlY3V0ZUhvb2soJ3Vwb25TYW5pdGl6ZVNoYWRvd05vZGUnLCBzaGFkb3dOb2RlLCBudWxsKTtcblxuICAgICAgICAvKiBTYW5pdGl6ZSB0YWdzIGFuZCBlbGVtZW50cyAqL1xuICAgICAgICBpZiAoX3Nhbml0aXplRWxlbWVudHMoc2hhZG93Tm9kZSkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIERlZXAgc2hhZG93IERPTSBkZXRlY3RlZCAqL1xuICAgICAgICBpZiAoc2hhZG93Tm9kZS5jb250ZW50IGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudCkge1xuICAgICAgICAgIF9zYW5pdGl6ZVNoYWRvd0RPTShzaGFkb3dOb2RlLmNvbnRlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogQ2hlY2sgYXR0cmlidXRlcywgc2FuaXRpemUgaWYgbmVjZXNzYXJ5ICovXG4gICAgICAgIF9zYW5pdGl6ZUF0dHJpYnV0ZXMoc2hhZG93Tm9kZSk7XG4gICAgICB9XG5cbiAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgIF9leGVjdXRlSG9vaygnYWZ0ZXJTYW5pdGl6ZVNoYWRvd0RPTScsIGZyYWdtZW50LCBudWxsKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2FuaXRpemVcbiAgICAgKiBQdWJsaWMgbWV0aG9kIHByb3ZpZGluZyBjb3JlIHNhbml0YXRpb24gZnVuY3Rpb25hbGl0eVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8Tm9kZX0gZGlydHkgc3RyaW5nIG9yIERPTSBub2RlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAgICovXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbiAgICBET01QdXJpZnkuc2FuaXRpemUgPSBmdW5jdGlvbiAoZGlydHksIGNmZykge1xuICAgICAgdmFyIGJvZHkgPSB2b2lkIDA7XG4gICAgICB2YXIgaW1wb3J0ZWROb2RlID0gdm9pZCAwO1xuICAgICAgdmFyIGN1cnJlbnROb2RlID0gdm9pZCAwO1xuICAgICAgdmFyIG9sZE5vZGUgPSB2b2lkIDA7XG4gICAgICB2YXIgcmV0dXJuTm9kZSA9IHZvaWQgMDtcbiAgICAgIC8qIE1ha2Ugc3VyZSB3ZSBoYXZlIGEgc3RyaW5nIHRvIHNhbml0aXplLlxuICAgICAgICBETyBOT1QgcmV0dXJuIGVhcmx5LCBhcyB0aGlzIHdpbGwgcmV0dXJuIHRoZSB3cm9uZyB0eXBlIGlmXG4gICAgICAgIHRoZSB1c2VyIGhhcyByZXF1ZXN0ZWQgYSBET00gb2JqZWN0IHJhdGhlciB0aGFuIGEgc3RyaW5nICovXG4gICAgICBJU19FTVBUWV9JTlBVVCA9ICFkaXJ0eTtcbiAgICAgIGlmIChJU19FTVBUWV9JTlBVVCkge1xuICAgICAgICBkaXJ0eSA9ICc8IS0tPic7XG4gICAgICB9XG5cbiAgICAgIC8qIFN0cmluZ2lmeSwgaW4gY2FzZSBkaXJ0eSBpcyBhbiBvYmplY3QgKi9cbiAgICAgIGlmICh0eXBlb2YgZGlydHkgIT09ICdzdHJpbmcnICYmICFfaXNOb2RlKGRpcnR5KSkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmVnYXRlZC1jb25kaXRpb25cbiAgICAgICAgaWYgKHR5cGVvZiBkaXJ0eS50b1N0cmluZyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgndG9TdHJpbmcgaXMgbm90IGEgZnVuY3Rpb24nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkaXJ0eSA9IGRpcnR5LnRvU3RyaW5nKCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkaXJ0eSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgnZGlydHkgaXMgbm90IGEgc3RyaW5nLCBhYm9ydGluZycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBDaGVjayB3ZSBjYW4gcnVuLiBPdGhlcndpc2UgZmFsbCBiYWNrIG9yIGlnbm9yZSAqL1xuICAgICAgaWYgKCFET01QdXJpZnkuaXNTdXBwb3J0ZWQpIHtcbiAgICAgICAgaWYgKF90eXBlb2Yod2luZG93LnRvU3RhdGljSFRNTCkgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB3aW5kb3cudG9TdGF0aWNIVE1MID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkaXJ0eSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cudG9TdGF0aWNIVE1MKGRpcnR5KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoX2lzTm9kZShkaXJ0eSkpIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cudG9TdGF0aWNIVE1MKGRpcnR5Lm91dGVySFRNTCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRpcnR5O1xuICAgICAgfVxuXG4gICAgICAvKiBBc3NpZ24gY29uZmlnIHZhcnMgKi9cbiAgICAgIGlmICghU0VUX0NPTkZJRykge1xuICAgICAgICBfcGFyc2VDb25maWcoY2ZnKTtcbiAgICAgIH1cblxuICAgICAgLyogQ2xlYW4gdXAgcmVtb3ZlZCBlbGVtZW50cyAqL1xuICAgICAgRE9NUHVyaWZ5LnJlbW92ZWQgPSBbXTtcblxuICAgICAgLyogQ2hlY2sgaWYgZGlydHkgaXMgY29ycmVjdGx5IHR5cGVkIGZvciBJTl9QTEFDRSAqL1xuICAgICAgaWYgKHR5cGVvZiBkaXJ0eSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgSU5fUExBQ0UgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKElOX1BMQUNFKSA7IGVsc2UgaWYgKGRpcnR5IGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICAvKiBJZiBkaXJ0eSBpcyBhIERPTSBlbGVtZW50LCBhcHBlbmQgdG8gYW4gZW1wdHkgZG9jdW1lbnQgdG8gYXZvaWRcbiAgICAgICAgICAgZWxlbWVudHMgYmVpbmcgc3RyaXBwZWQgYnkgdGhlIHBhcnNlciAqL1xuICAgICAgICBib2R5ID0gX2luaXREb2N1bWVudCgnPCEtLS0tPicpO1xuICAgICAgICBpbXBvcnRlZE5vZGUgPSBib2R5Lm93bmVyRG9jdW1lbnQuaW1wb3J0Tm9kZShkaXJ0eSwgdHJ1ZSk7XG4gICAgICAgIGlmIChpbXBvcnRlZE5vZGUubm9kZVR5cGUgPT09IDEgJiYgaW1wb3J0ZWROb2RlLm5vZGVOYW1lID09PSAnQk9EWScpIHtcbiAgICAgICAgICAvKiBOb2RlIGlzIGFscmVhZHkgYSBib2R5LCB1c2UgYXMgaXMgKi9cbiAgICAgICAgICBib2R5ID0gaW1wb3J0ZWROb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKGltcG9ydGVkTm9kZS5ub2RlTmFtZSA9PT0gJ0hUTUwnKSB7XG4gICAgICAgICAgYm9keSA9IGltcG9ydGVkTm9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItZG9tLW5vZGUtYXBwZW5kXG4gICAgICAgICAgYm9keS5hcHBlbmRDaGlsZChpbXBvcnRlZE5vZGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvKiBFeGl0IGRpcmVjdGx5IGlmIHdlIGhhdmUgbm90aGluZyB0byBkbyAqL1xuICAgICAgICBpZiAoIVJFVFVSTl9ET00gJiYgIVNBRkVfRk9SX1RFTVBMQVRFUyAmJiAhV0hPTEVfRE9DVU1FTlQgJiZcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWluY2x1ZGVzXG4gICAgICAgIGRpcnR5LmluZGV4T2YoJzwnKSA9PT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1c3RlZFR5cGVzUG9saWN5ICYmIFJFVFVSTl9UUlVTVEVEX1RZUEUgPyB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTChkaXJ0eSkgOiBkaXJ0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIEluaXRpYWxpemUgdGhlIGRvY3VtZW50IHRvIHdvcmsgb24gKi9cbiAgICAgICAgYm9keSA9IF9pbml0RG9jdW1lbnQoZGlydHkpO1xuXG4gICAgICAgIC8qIENoZWNrIHdlIGhhdmUgYSBET00gbm9kZSBmcm9tIHRoZSBkYXRhICovXG4gICAgICAgIGlmICghYm9keSkge1xuICAgICAgICAgIHJldHVybiBSRVRVUk5fRE9NID8gbnVsbCA6IGVtcHR5SFRNTDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBSZW1vdmUgZmlyc3QgZWxlbWVudCBub2RlIChvdXJzKSBpZiBGT1JDRV9CT0RZIGlzIHNldCAqL1xuICAgICAgaWYgKGJvZHkgJiYgRk9SQ0VfQk9EWSkge1xuICAgICAgICBfZm9yY2VSZW1vdmUoYm9keS5maXJzdENoaWxkKTtcbiAgICAgIH1cblxuICAgICAgLyogR2V0IG5vZGUgaXRlcmF0b3IgKi9cbiAgICAgIHZhciBub2RlSXRlcmF0b3IgPSBfY3JlYXRlSXRlcmF0b3IoSU5fUExBQ0UgPyBkaXJ0eSA6IGJvZHkpO1xuXG4gICAgICAvKiBOb3cgc3RhcnQgaXRlcmF0aW5nIG92ZXIgdGhlIGNyZWF0ZWQgZG9jdW1lbnQgKi9cbiAgICAgIHdoaWxlIChjdXJyZW50Tm9kZSA9IG5vZGVJdGVyYXRvci5uZXh0Tm9kZSgpKSB7XG4gICAgICAgIC8qIEZpeCBJRSdzIHN0cmFuZ2UgYmVoYXZpb3Igd2l0aCBtYW5pcHVsYXRlZCB0ZXh0Tm9kZXMgIzg5ICovXG4gICAgICAgIGlmIChjdXJyZW50Tm9kZS5ub2RlVHlwZSA9PT0gMyAmJiBjdXJyZW50Tm9kZSA9PT0gb2xkTm9kZSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogU2FuaXRpemUgdGFncyBhbmQgZWxlbWVudHMgKi9cbiAgICAgICAgaWYgKF9zYW5pdGl6ZUVsZW1lbnRzKGN1cnJlbnROb2RlKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogU2hhZG93IERPTSBkZXRlY3RlZCwgc2FuaXRpemUgaXQgKi9cbiAgICAgICAgaWYgKGN1cnJlbnROb2RlLmNvbnRlbnQgaW5zdGFuY2VvZiBEb2N1bWVudEZyYWdtZW50KSB7XG4gICAgICAgICAgX3Nhbml0aXplU2hhZG93RE9NKGN1cnJlbnROb2RlLmNvbnRlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyogQ2hlY2sgYXR0cmlidXRlcywgc2FuaXRpemUgaWYgbmVjZXNzYXJ5ICovXG4gICAgICAgIF9zYW5pdGl6ZUF0dHJpYnV0ZXMoY3VycmVudE5vZGUpO1xuXG4gICAgICAgIG9sZE5vZGUgPSBjdXJyZW50Tm9kZTtcbiAgICAgIH1cblxuICAgICAgb2xkTm9kZSA9IG51bGw7XG5cbiAgICAgIC8qIElmIHdlIHNhbml0aXplZCBgZGlydHlgIGluLXBsYWNlLCByZXR1cm4gaXQuICovXG4gICAgICBpZiAoSU5fUExBQ0UpIHtcbiAgICAgICAgcmV0dXJuIGRpcnR5O1xuICAgICAgfVxuXG4gICAgICAvKiBSZXR1cm4gc2FuaXRpemVkIHN0cmluZyBvciBET00gKi9cbiAgICAgIGlmIChSRVRVUk5fRE9NKSB7XG4gICAgICAgIGlmIChSRVRVUk5fRE9NX0ZSQUdNRU5UKSB7XG4gICAgICAgICAgcmV0dXJuTm9kZSA9IGNyZWF0ZURvY3VtZW50RnJhZ21lbnQuY2FsbChib2R5Lm93bmVyRG9jdW1lbnQpO1xuXG4gICAgICAgICAgd2hpbGUgKGJvZHkuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWRvbS1ub2RlLWFwcGVuZFxuICAgICAgICAgICAgcmV0dXJuTm9kZS5hcHBlbmRDaGlsZChib2R5LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm5Ob2RlID0gYm9keTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChSRVRVUk5fRE9NX0lNUE9SVCkge1xuICAgICAgICAgIC8qXG4gICAgICAgICAgICBBZG9wdE5vZGUoKSBpcyBub3QgdXNlZCBiZWNhdXNlIGludGVybmFsIHN0YXRlIGlzIG5vdCByZXNldFxuICAgICAgICAgICAgKGUuZy4gdGhlIHBhc3QgbmFtZXMgbWFwIG9mIGEgSFRNTEZvcm1FbGVtZW50KSwgdGhpcyBpcyBzYWZlXG4gICAgICAgICAgICBpbiB0aGVvcnkgYnV0IHdlIHdvdWxkIHJhdGhlciBub3QgcmlzayBhbm90aGVyIGF0dGFjayB2ZWN0b3IuXG4gICAgICAgICAgICBUaGUgc3RhdGUgdGhhdCBpcyBjbG9uZWQgYnkgaW1wb3J0Tm9kZSgpIGlzIGV4cGxpY2l0bHkgZGVmaW5lZFxuICAgICAgICAgICAgYnkgdGhlIHNwZWNzLlxuICAgICAgICAgICovXG4gICAgICAgICAgcmV0dXJuTm9kZSA9IGltcG9ydE5vZGUuY2FsbChvcmlnaW5hbERvY3VtZW50LCByZXR1cm5Ob2RlLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXR1cm5Ob2RlO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2VyaWFsaXplZEhUTUwgPSBXSE9MRV9ET0NVTUVOVCA/IGJvZHkub3V0ZXJIVE1MIDogYm9keS5pbm5lckhUTUw7XG5cbiAgICAgIC8qIFNhbml0aXplIGZpbmFsIHN0cmluZyB0ZW1wbGF0ZS1zYWZlICovXG4gICAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTKSB7XG4gICAgICAgIHNlcmlhbGl6ZWRIVE1MID0gc3RyaW5nUmVwbGFjZShzZXJpYWxpemVkSFRNTCwgTVVTVEFDSEVfRVhQUiQkMSwgJyAnKTtcbiAgICAgICAgc2VyaWFsaXplZEhUTUwgPSBzdHJpbmdSZXBsYWNlKHNlcmlhbGl6ZWRIVE1MLCBFUkJfRVhQUiQkMSwgJyAnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydXN0ZWRUeXBlc1BvbGljeSAmJiBSRVRVUk5fVFJVU1RFRF9UWVBFID8gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoc2VyaWFsaXplZEhUTUwpIDogc2VyaWFsaXplZEhUTUw7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBtZXRob2QgdG8gc2V0IHRoZSBjb25maWd1cmF0aW9uIG9uY2VcbiAgICAgKiBzZXRDb25maWdcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjZmcgY29uZmlndXJhdGlvbiBvYmplY3RcbiAgICAgKi9cbiAgICBET01QdXJpZnkuc2V0Q29uZmlnID0gZnVuY3Rpb24gKGNmZykge1xuICAgICAgX3BhcnNlQ29uZmlnKGNmZyk7XG4gICAgICBTRVRfQ09ORklHID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUHVibGljIG1ldGhvZCB0byByZW1vdmUgdGhlIGNvbmZpZ3VyYXRpb25cbiAgICAgKiBjbGVhckNvbmZpZ1xuICAgICAqXG4gICAgICovXG4gICAgRE9NUHVyaWZ5LmNsZWFyQ29uZmlnID0gZnVuY3Rpb24gKCkge1xuICAgICAgQ09ORklHID0gbnVsbDtcbiAgICAgIFNFVF9DT05GSUcgPSBmYWxzZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUHVibGljIG1ldGhvZCB0byBjaGVjayBpZiBhbiBhdHRyaWJ1dGUgdmFsdWUgaXMgdmFsaWQuXG4gICAgICogVXNlcyBsYXN0IHNldCBjb25maWcsIGlmIGFueS4gT3RoZXJ3aXNlLCB1c2VzIGNvbmZpZyBkZWZhdWx0cy5cbiAgICAgKiBpc1ZhbGlkQXR0cmlidXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IHRhZyBUYWcgbmFtZSBvZiBjb250YWluaW5nIGVsZW1lbnQuXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSBhdHRyIEF0dHJpYnV0ZSBuYW1lLlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gdmFsdWUgQXR0cmlidXRlIHZhbHVlLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiBgdmFsdWVgIGlzIHZhbGlkLiBPdGhlcndpc2UsIHJldHVybnMgZmFsc2UuXG4gICAgICovXG4gICAgRE9NUHVyaWZ5LmlzVmFsaWRBdHRyaWJ1dGUgPSBmdW5jdGlvbiAodGFnLCBhdHRyLCB2YWx1ZSkge1xuICAgICAgLyogSW5pdGlhbGl6ZSBzaGFyZWQgY29uZmlnIHZhcnMgaWYgbmVjZXNzYXJ5LiAqL1xuICAgICAgaWYgKCFDT05GSUcpIHtcbiAgICAgICAgX3BhcnNlQ29uZmlnKHt9KTtcbiAgICAgIH1cblxuICAgICAgdmFyIGxjVGFnID0gc3RyaW5nVG9Mb3dlckNhc2UodGFnKTtcbiAgICAgIHZhciBsY05hbWUgPSBzdHJpbmdUb0xvd2VyQ2FzZShhdHRyKTtcbiAgICAgIHJldHVybiBfaXNWYWxpZEF0dHJpYnV0ZShsY1RhZywgbGNOYW1lLCB2YWx1ZSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFkZEhvb2tcbiAgICAgKiBQdWJsaWMgbWV0aG9kIHRvIGFkZCBET01QdXJpZnkgaG9va3NcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBlbnRyeVBvaW50IGVudHJ5IHBvaW50IGZvciB0aGUgaG9vayB0byBhZGRcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBob29rRnVuY3Rpb24gZnVuY3Rpb24gdG8gZXhlY3V0ZVxuICAgICAqL1xuICAgIERPTVB1cmlmeS5hZGRIb29rID0gZnVuY3Rpb24gKGVudHJ5UG9pbnQsIGhvb2tGdW5jdGlvbikge1xuICAgICAgaWYgKHR5cGVvZiBob29rRnVuY3Rpb24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBob29rc1tlbnRyeVBvaW50XSA9IGhvb2tzW2VudHJ5UG9pbnRdIHx8IFtdO1xuICAgICAgYXJyYXlQdXNoKGhvb2tzW2VudHJ5UG9pbnRdLCBob29rRnVuY3Rpb24pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVIb29rXG4gICAgICogUHVibGljIG1ldGhvZCB0byByZW1vdmUgYSBET01QdXJpZnkgaG9vayBhdCBhIGdpdmVuIGVudHJ5UG9pbnRcbiAgICAgKiAocG9wcyBpdCBmcm9tIHRoZSBzdGFjayBvZiBob29rcyBpZiBtb3JlIGFyZSBwcmVzZW50KVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGVudHJ5UG9pbnQgZW50cnkgcG9pbnQgZm9yIHRoZSBob29rIHRvIHJlbW92ZVxuICAgICAqL1xuICAgIERPTVB1cmlmeS5yZW1vdmVIb29rID0gZnVuY3Rpb24gKGVudHJ5UG9pbnQpIHtcbiAgICAgIGlmIChob29rc1tlbnRyeVBvaW50XSkge1xuICAgICAgICBhcnJheVBvcChob29rc1tlbnRyeVBvaW50XSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZUhvb2tzXG4gICAgICogUHVibGljIG1ldGhvZCB0byByZW1vdmUgYWxsIERPTVB1cmlmeSBob29rcyBhdCBhIGdpdmVuIGVudHJ5UG9pbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZW50cnlQb2ludCBlbnRyeSBwb2ludCBmb3IgdGhlIGhvb2tzIHRvIHJlbW92ZVxuICAgICAqL1xuICAgIERPTVB1cmlmeS5yZW1vdmVIb29rcyA9IGZ1bmN0aW9uIChlbnRyeVBvaW50KSB7XG4gICAgICBpZiAoaG9va3NbZW50cnlQb2ludF0pIHtcbiAgICAgICAgaG9va3NbZW50cnlQb2ludF0gPSBbXTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlQWxsSG9va3NcbiAgICAgKiBQdWJsaWMgbWV0aG9kIHRvIHJlbW92ZSBhbGwgRE9NUHVyaWZ5IGhvb2tzXG4gICAgICpcbiAgICAgKi9cbiAgICBET01QdXJpZnkucmVtb3ZlQWxsSG9va3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBob29rcyA9IHt9O1xuICAgIH07XG5cbiAgICByZXR1cm4gRE9NUHVyaWZ5O1xuICB9XG5cbiAgdmFyIHB1cmlmeSA9IGNyZWF0ZURPTVB1cmlmeSgpO1xuXG4gIHJldHVybiBwdXJpZnk7XG5cbn0pKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXB1cmlmeS5qcy5tYXBcbiIsImltcG9ydCB7IF9fYXNzaWduIH0gZnJvbSBcInRzbGliXCI7XG5pbXBvcnQgeyBub0Nhc2UgfSBmcm9tIFwibm8tY2FzZVwiO1xuZXhwb3J0IGZ1bmN0aW9uIGRvdENhc2UoaW5wdXQsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgIHJldHVybiBub0Nhc2UoaW5wdXQsIF9fYXNzaWduKHsgZGVsaW1pdGVyOiBcIi5cIiB9LCBvcHRpb25zKSk7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG4gICwgcHJlZml4ID0gJ34nO1xuXG4vKipcbiAqIENvbnN0cnVjdG9yIHRvIGNyZWF0ZSBhIHN0b3JhZ2UgZm9yIG91ciBgRUVgIG9iamVjdHMuXG4gKiBBbiBgRXZlbnRzYCBpbnN0YW5jZSBpcyBhIHBsYWluIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBldmVudCBuYW1lcy5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEV2ZW50cygpIHt9XG5cbi8vXG4vLyBXZSB0cnkgdG8gbm90IGluaGVyaXQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuIEluIHNvbWUgZW5naW5lcyBjcmVhdGluZyBhblxuLy8gaW5zdGFuY2UgaW4gdGhpcyB3YXkgaXMgZmFzdGVyIHRoYW4gY2FsbGluZyBgT2JqZWN0LmNyZWF0ZShudWxsKWAgZGlyZWN0bHkuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gY2hhcmFjdGVyIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90XG4vLyBvdmVycmlkZGVuIG9yIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vXG5pZiAoT2JqZWN0LmNyZWF0ZSkge1xuICBFdmVudHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvL1xuICAvLyBUaGlzIGhhY2sgaXMgbmVlZGVkIGJlY2F1c2UgdGhlIGBfX3Byb3RvX19gIHByb3BlcnR5IGlzIHN0aWxsIGluaGVyaXRlZCBpblxuICAvLyBzb21lIG9sZCBicm93c2VycyBsaWtlIEFuZHJvaWQgNCwgaVBob25lIDUuMSwgT3BlcmEgMTEgYW5kIFNhZmFyaSA1LlxuICAvL1xuICBpZiAoIW5ldyBFdmVudHMoKS5fX3Byb3RvX18pIHByZWZpeCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIGV2ZW50IGxpc3RlbmVyLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gY29udGV4dCBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBTcGVjaWZ5IGlmIHRoZSBsaXN0ZW5lciBpcyBhIG9uZS10aW1lIGxpc3RlbmVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFRShmbiwgY29udGV4dCwgb25jZSkge1xuICB0aGlzLmZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMub25jZSA9IG9uY2UgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogQWRkIGEgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtFdmVudEVtaXR0ZXJ9IGVtaXR0ZXIgUmVmZXJlbmNlIHRvIHRoZSBgRXZlbnRFbWl0dGVyYCBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gY29udGV4dCBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgU3BlY2lmeSBpZiB0aGUgbGlzdGVuZXIgaXMgYSBvbmUtdGltZSBsaXN0ZW5lci5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBhZGRMaXN0ZW5lcihlbWl0dGVyLCBldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCBlbWl0dGVyLCBvbmNlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIWVtaXR0ZXIuX2V2ZW50c1tldnRdKSBlbWl0dGVyLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyLCBlbWl0dGVyLl9ldmVudHNDb3VudCsrO1xuICBlbHNlIGlmICghZW1pdHRlci5fZXZlbnRzW2V2dF0uZm4pIGVtaXR0ZXIuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlIGVtaXR0ZXIuX2V2ZW50c1tldnRdID0gW2VtaXR0ZXIuX2V2ZW50c1tldnRdLCBsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIGVtaXR0ZXI7XG59XG5cbi8qKlxuICogQ2xlYXIgZXZlbnQgYnkgbmFtZS5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gZW1pdHRlciBSZWZlcmVuY2UgdG8gdGhlIGBFdmVudEVtaXR0ZXJgIGluc3RhbmNlLlxuICogQHBhcmFtIHsoU3RyaW5nfFN5bWJvbCl9IGV2dCBUaGUgRXZlbnQgbmFtZS5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGNsZWFyRXZlbnQoZW1pdHRlciwgZXZ0KSB7XG4gIGlmICgtLWVtaXR0ZXIuX2V2ZW50c0NvdW50ID09PSAwKSBlbWl0dGVyLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gIGVsc2UgZGVsZXRlIGVtaXR0ZXIuX2V2ZW50c1tldnRdO1xufVxuXG4vKipcbiAqIE1pbmltYWwgYEV2ZW50RW1pdHRlcmAgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZFxuICogbGlzdGVuZXJzLlxuICpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIG5hbWVzID0gW11cbiAgICAsIGV2ZW50c1xuICAgICwgbmFtZTtcblxuICBpZiAodGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gKGV2ZW50cyA9IHRoaXMuX2V2ZW50cykpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFRoZSByZWdpc3RlcmVkIGxpc3RlbmVycy5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnQpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGhhbmRsZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKCFoYW5kbGVycykgcmV0dXJuIFtdO1xuICBpZiAoaGFuZGxlcnMuZm4pIHJldHVybiBbaGFuZGxlcnMuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gaGFuZGxlcnMubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gaGFuZGxlcnNbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbnVtYmVyIG9mIGxpc3RlbmVycyBsaXN0ZW5pbmcgdG8gYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgbnVtYmVyIG9mIGxpc3RlbmVycy5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24gbGlzdGVuZXJDb3VudChldmVudCkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudFxuICAgICwgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKCFsaXN0ZW5lcnMpIHJldHVybiAwO1xuICBpZiAobGlzdGVuZXJzLmZuKSByZXR1cm4gMTtcbiAgcmV0dXJuIGxpc3RlbmVycy5sZW5ndGg7XG59O1xuXG4vKipcbiAqIENhbGxzIGVhY2ggb2YgdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGV2ZW50IGhhZCBsaXN0ZW5lcnMsIGVsc2UgYGZhbHNlYC5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgc3dpdGNoIChsZW4pIHtcbiAgICAgICAgY2FzZSAxOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCk7IGJyZWFrO1xuICAgICAgICBjYXNlIDI6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSk7IGJyZWFrO1xuICAgICAgICBjYXNlIDM6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIpOyBicmVhaztcbiAgICAgICAgY2FzZSA0OiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyLCBhMyk7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIEFkZCBhIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHJldHVybiBhZGRMaXN0ZW5lcih0aGlzLCBldmVudCwgZm4sIGNvbnRleHQsIGZhbHNlKTtcbn07XG5cbi8qKlxuICogQWRkIGEgb25lLXRpbWUgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHsoU3RyaW5nfFN5bWJvbCl9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHsqfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHJldHVybiBhZGRMaXN0ZW5lcih0aGlzLCBldmVudCwgZm4sIGNvbnRleHQsIHRydWUpO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhlIGxpc3RlbmVycyBvZiBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBtYXRjaCB0aGlzIGZ1bmN0aW9uLlxuICogQHBhcmFtIHsqfSBjb250ZXh0IE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBoYXZlIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmUtdGltZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIHRoaXM7XG4gIGlmICghZm4pIHtcbiAgICBjbGVhckV2ZW50KHRoaXMsIGV2dCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChcbiAgICAgIGxpc3RlbmVycy5mbiA9PT0gZm4gJiZcbiAgICAgICghb25jZSB8fCBsaXN0ZW5lcnMub25jZSkgJiZcbiAgICAgICghY29udGV4dCB8fCBsaXN0ZW5lcnMuY29udGV4dCA9PT0gY29udGV4dClcbiAgICApIHtcbiAgICAgIGNsZWFyRXZlbnQodGhpcywgZXZ0KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50cyA9IFtdLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChcbiAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmbiB8fFxuICAgICAgICAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpIHx8XG4gICAgICAgIChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gICAgLy9cbiAgICBpZiAoZXZlbnRzLmxlbmd0aCkgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICAgIGVsc2UgY2xlYXJFdmVudCh0aGlzLCBldnQpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzLCBvciB0aG9zZSBvZiB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBbZXZlbnRdIFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICB2YXIgZXZ0O1xuXG4gIGlmIChldmVudCkge1xuICAgIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG4gICAgaWYgKHRoaXMuX2V2ZW50c1tldnRdKSBjbGVhckV2ZW50KHRoaXMsIGV2dCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBBbGxvdyBgRXZlbnRFbWl0dGVyYCB0byBiZSBpbXBvcnRlZCBhcyBtb2R1bGUgbmFtZXNwYWNlLlxuLy9cbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8qKlxuICogU291cmNlOiBmdHA6Ly9mdHAudW5pY29kZS5vcmcvUHVibGljL1VDRC9sYXRlc3QvdWNkL1NwZWNpYWxDYXNpbmcudHh0XG4gKi9cbnZhciBTVVBQT1JURURfTE9DQUxFID0ge1xuICAgIHRyOiB7XG4gICAgICAgIHJlZ2V4cDogL1xcdTAxMzB8XFx1MDA0OXxcXHUwMDQ5XFx1MDMwNy9nLFxuICAgICAgICBtYXA6IHtcbiAgICAgICAgICAgIMSwOiBcIlxcdTAwNjlcIixcbiAgICAgICAgICAgIEk6IFwiXFx1MDEzMVwiLFxuICAgICAgICAgICAgScyHOiBcIlxcdTAwNjlcIixcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGF6OiB7XG4gICAgICAgIHJlZ2V4cDogL1xcdTAxMzAvZyxcbiAgICAgICAgbWFwOiB7XG4gICAgICAgICAgICDEsDogXCJcXHUwMDY5XCIsXG4gICAgICAgICAgICBJOiBcIlxcdTAxMzFcIixcbiAgICAgICAgICAgIEnMhzogXCJcXHUwMDY5XCIsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBsdDoge1xuICAgICAgICByZWdleHA6IC9cXHUwMDQ5fFxcdTAwNEF8XFx1MDEyRXxcXHUwMENDfFxcdTAwQ0R8XFx1MDEyOC9nLFxuICAgICAgICBtYXA6IHtcbiAgICAgICAgICAgIEk6IFwiXFx1MDA2OVxcdTAzMDdcIixcbiAgICAgICAgICAgIEo6IFwiXFx1MDA2QVxcdTAzMDdcIixcbiAgICAgICAgICAgIMSuOiBcIlxcdTAxMkZcXHUwMzA3XCIsXG4gICAgICAgICAgICDDjDogXCJcXHUwMDY5XFx1MDMwN1xcdTAzMDBcIixcbiAgICAgICAgICAgIMONOiBcIlxcdTAwNjlcXHUwMzA3XFx1MDMwMVwiLFxuICAgICAgICAgICAgxKg6IFwiXFx1MDA2OVxcdTAzMDdcXHUwMzAzXCIsXG4gICAgICAgIH0sXG4gICAgfSxcbn07XG4vKipcbiAqIExvY2FsaXplZCBsb3dlciBjYXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYWxlTG93ZXJDYXNlKHN0ciwgbG9jYWxlKSB7XG4gICAgdmFyIGxhbmcgPSBTVVBQT1JURURfTE9DQUxFW2xvY2FsZS50b0xvd2VyQ2FzZSgpXTtcbiAgICBpZiAobGFuZylcbiAgICAgICAgcmV0dXJuIGxvd2VyQ2FzZShzdHIucmVwbGFjZShsYW5nLnJlZ2V4cCwgZnVuY3Rpb24gKG0pIHsgcmV0dXJuIGxhbmcubWFwW21dOyB9KSk7XG4gICAgcmV0dXJuIGxvd2VyQ2FzZShzdHIpO1xufVxuLyoqXG4gKiBMb3dlciBjYXNlIGFzIGEgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb3dlckNhc2Uoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpO1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB3ID0gZCAqIDc7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKHZhbCkpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArXG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWwpXG4gICk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChzdHIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtYXRjaCA9IC9eKC0/KD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx3ZWVrcz98d3x5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhcbiAgICBzdHJcbiAgKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnd2Vla3MnOlxuICAgIGNhc2UgJ3dlZWsnOlxuICAgIGNhc2UgJ3cnOlxuICAgICAgcmV0dXJuIG4gKiB3O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICB9XG4gIGlmIChtc0FicyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgfVxuICBpZiAobXNBYnMgPj0gcykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIH1cbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBkLCAnZGF5Jyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgaCwgJ2hvdXInKTtcbiAgfVxuICBpZiAobXNBYnMgPj0gbSkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBtLCAnbWludXRlJyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IHMpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgcywgJ3NlY29uZCcpO1xuICB9XG4gIHJldHVybiBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbXNBYnMsIG4sIG5hbWUpIHtcbiAgdmFyIGlzUGx1cmFsID0gbXNBYnMgPj0gbiAqIDEuNTtcbiAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBuKSArICcgJyArIG5hbWUgKyAoaXNQbHVyYWwgPyAncycgOiAnJyk7XG59XG4iLCJpbXBvcnQgeyBsb3dlckNhc2UgfSBmcm9tIFwibG93ZXItY2FzZVwiO1xuLy8gU3VwcG9ydCBjYW1lbCBjYXNlIChcImNhbWVsQ2FzZVwiIC0+IFwiY2FtZWwgQ2FzZVwiIGFuZCBcIkNBTUVMQ2FzZVwiIC0+IFwiQ0FNRUwgQ2FzZVwiKS5cbnZhciBERUZBVUxUX1NQTElUX1JFR0VYUCA9IFsvKFthLXowLTldKShbQS1aXSkvZywgLyhbQS1aXSkoW0EtWl1bYS16XSkvZ107XG4vLyBSZW1vdmUgYWxsIG5vbi13b3JkIGNoYXJhY3RlcnMuXG52YXIgREVGQVVMVF9TVFJJUF9SRUdFWFAgPSAvW15BLVowLTldKy9naTtcbi8qKlxuICogTm9ybWFsaXplIHRoZSBzdHJpbmcgaW50byBzb21ldGhpbmcgb3RoZXIgbGlicmFyaWVzIGNhbiBtYW5pcHVsYXRlIGVhc2llci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vQ2FzZShpbnB1dCwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgdmFyIF9hID0gb3B0aW9ucy5zcGxpdFJlZ2V4cCwgc3BsaXRSZWdleHAgPSBfYSA9PT0gdm9pZCAwID8gREVGQVVMVF9TUExJVF9SRUdFWFAgOiBfYSwgX2IgPSBvcHRpb25zLnN0cmlwUmVnZXhwLCBzdHJpcFJlZ2V4cCA9IF9iID09PSB2b2lkIDAgPyBERUZBVUxUX1NUUklQX1JFR0VYUCA6IF9iLCBfYyA9IG9wdGlvbnMudHJhbnNmb3JtLCB0cmFuc2Zvcm0gPSBfYyA9PT0gdm9pZCAwID8gbG93ZXJDYXNlIDogX2MsIF9kID0gb3B0aW9ucy5kZWxpbWl0ZXIsIGRlbGltaXRlciA9IF9kID09PSB2b2lkIDAgPyBcIiBcIiA6IF9kO1xuICAgIHZhciByZXN1bHQgPSByZXBsYWNlKHJlcGxhY2UoaW5wdXQsIHNwbGl0UmVnZXhwLCBcIiQxXFwwJDJcIiksIHN0cmlwUmVnZXhwLCBcIlxcMFwiKTtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIHZhciBlbmQgPSByZXN1bHQubGVuZ3RoO1xuICAgIC8vIFRyaW0gdGhlIGRlbGltaXRlciBmcm9tIGFyb3VuZCB0aGUgb3V0cHV0IHN0cmluZy5cbiAgICB3aGlsZSAocmVzdWx0LmNoYXJBdChzdGFydCkgPT09IFwiXFwwXCIpXG4gICAgICAgIHN0YXJ0Kys7XG4gICAgd2hpbGUgKHJlc3VsdC5jaGFyQXQoZW5kIC0gMSkgPT09IFwiXFwwXCIpXG4gICAgICAgIGVuZC0tO1xuICAgIC8vIFRyYW5zZm9ybSBlYWNoIHRva2VuIGluZGVwZW5kZW50bHkuXG4gICAgcmV0dXJuIHJlc3VsdC5zbGljZShzdGFydCwgZW5kKS5zcGxpdChcIlxcMFwiKS5tYXAodHJhbnNmb3JtKS5qb2luKGRlbGltaXRlcik7XG59XG4vKipcbiAqIFJlcGxhY2UgYHJlYCBpbiB0aGUgaW5wdXQgc3RyaW5nIHdpdGggdGhlIHJlcGxhY2VtZW50IHZhbHVlLlxuICovXG5mdW5jdGlvbiByZXBsYWNlKGlucHV0LCByZSwgdmFsdWUpIHtcbiAgICBpZiAocmUgaW5zdGFuY2VvZiBSZWdFeHApXG4gICAgICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKHJlLCB2YWx1ZSk7XG4gICAgcmV0dXJuIHJlLnJlZHVjZShmdW5jdGlvbiAoaW5wdXQsIHJlKSB7IHJldHVybiBpbnB1dC5yZXBsYWNlKHJlLCB2YWx1ZSk7IH0sIGlucHV0KTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxyXG4vL1xyXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxyXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXHJcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xyXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXHJcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcclxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXHJcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4vL1xyXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxyXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuLy9cclxuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xyXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXHJcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cclxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXHJcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxyXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXHJcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5cclxudmFyIGlzV2luZG93cyA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMic7XHJcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xyXG5cclxuXHJcbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxyXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcclxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXHJcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcclxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XHJcbiAgdmFyIHJlcyA9IFtdO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcclxuICAgIHZhciBwID0gcGFydHNbaV07XHJcblxyXG4gICAgLy8gaWdub3JlIGVtcHR5IHBhcnRzXHJcbiAgICBpZiAoIXAgfHwgcCA9PT0gJy4nKVxyXG4gICAgICBjb250aW51ZTtcclxuXHJcbiAgICBpZiAocCA9PT0gJy4uJykge1xyXG4gICAgICBpZiAocmVzLmxlbmd0aCAmJiByZXNbcmVzLmxlbmd0aCAtIDFdICE9PSAnLi4nKSB7XHJcbiAgICAgICAgcmVzLnBvcCgpO1xyXG4gICAgICB9IGVsc2UgaWYgKGFsbG93QWJvdmVSb290KSB7XHJcbiAgICAgICAgcmVzLnB1c2goJy4uJyk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJlcy5wdXNoKHApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuLy8gcmV0dXJucyBhbiBhcnJheSB3aXRoIGVtcHR5IGVsZW1lbnRzIHJlbW92ZWQgZnJvbSBlaXRoZXIgZW5kIG9mIHRoZSBpbnB1dFxyXG4vLyBhcnJheSBvciB0aGUgb3JpZ2luYWwgYXJyYXkgaWYgbm8gZWxlbWVudHMgbmVlZCB0byBiZSByZW1vdmVkXHJcbmZ1bmN0aW9uIHRyaW1BcnJheShhcnIpIHtcclxuICB2YXIgbGFzdEluZGV4ID0gYXJyLmxlbmd0aCAtIDE7XHJcbiAgdmFyIHN0YXJ0ID0gMDtcclxuICBmb3IgKDsgc3RhcnQgPD0gbGFzdEluZGV4OyBzdGFydCsrKSB7XHJcbiAgICBpZiAoYXJyW3N0YXJ0XSlcclxuICAgICAgYnJlYWs7XHJcbiAgfVxyXG5cclxuICB2YXIgZW5kID0gbGFzdEluZGV4O1xyXG4gIGZvciAoOyBlbmQgPj0gMDsgZW5kLS0pIHtcclxuICAgIGlmIChhcnJbZW5kXSlcclxuICAgICAgYnJlYWs7XHJcbiAgfVxyXG5cclxuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBsYXN0SW5kZXgpXHJcbiAgICByZXR1cm4gYXJyO1xyXG4gIGlmIChzdGFydCA+IGVuZClcclxuICAgIHJldHVybiBbXTtcclxuICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgKyAxKTtcclxufVxyXG5cclxuLy8gUmVnZXggdG8gc3BsaXQgYSB3aW5kb3dzIHBhdGggaW50byB0aHJlZSBwYXJ0czogWyosIGRldmljZSwgc2xhc2gsXHJcbi8vIHRhaWxdIHdpbmRvd3Mtb25seVxyXG52YXIgc3BsaXREZXZpY2VSZSA9XHJcbiAgICAvXihbYS16QS1aXTp8W1xcXFxcXC9dezJ9W15cXFxcXFwvXStbXFxcXFxcL10rW15cXFxcXFwvXSspPyhbXFxcXFxcL10pPyhbXFxzXFxTXSo/KSQvO1xyXG5cclxuLy8gUmVnZXggdG8gc3BsaXQgdGhlIHRhaWwgcGFydCBvZiB0aGUgYWJvdmUgaW50byBbKiwgZGlyLCBiYXNlbmFtZSwgZXh0XVxyXG52YXIgc3BsaXRUYWlsUmUgPVxyXG4gICAgL14oW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXFxcXFwvXSs/fCkoXFwuW14uXFwvXFxcXF0qfCkpKD86W1xcXFxcXC9dKikkLztcclxuXHJcbnZhciB3aW4zMiA9IHt9O1xyXG5cclxuLy8gRnVuY3Rpb24gdG8gc3BsaXQgYSBmaWxlbmFtZSBpbnRvIFtyb290LCBkaXIsIGJhc2VuYW1lLCBleHRdXHJcbmZ1bmN0aW9uIHdpbjMyU3BsaXRQYXRoKGZpbGVuYW1lKSB7XHJcbiAgLy8gU2VwYXJhdGUgZGV2aWNlK3NsYXNoIGZyb20gdGFpbFxyXG4gIHZhciByZXN1bHQgPSBzcGxpdERldmljZVJlLmV4ZWMoZmlsZW5hbWUpLFxyXG4gICAgICBkZXZpY2UgPSAocmVzdWx0WzFdIHx8ICcnKSArIChyZXN1bHRbMl0gfHwgJycpLFxyXG4gICAgICB0YWlsID0gcmVzdWx0WzNdIHx8ICcnO1xyXG4gIC8vIFNwbGl0IHRoZSB0YWlsIGludG8gZGlyLCBiYXNlbmFtZSBhbmQgZXh0ZW5zaW9uXHJcbiAgdmFyIHJlc3VsdDIgPSBzcGxpdFRhaWxSZS5leGVjKHRhaWwpLFxyXG4gICAgICBkaXIgPSByZXN1bHQyWzFdLFxyXG4gICAgICBiYXNlbmFtZSA9IHJlc3VsdDJbMl0sXHJcbiAgICAgIGV4dCA9IHJlc3VsdDJbM107XHJcbiAgcmV0dXJuIFtkZXZpY2UsIGRpciwgYmFzZW5hbWUsIGV4dF07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdpbjMyU3RhdFBhdGgocGF0aCkge1xyXG4gIHZhciByZXN1bHQgPSBzcGxpdERldmljZVJlLmV4ZWMocGF0aCksXHJcbiAgICAgIGRldmljZSA9IHJlc3VsdFsxXSB8fCAnJyxcclxuICAgICAgaXNVbmMgPSAhIWRldmljZSAmJiBkZXZpY2VbMV0gIT09ICc6JztcclxuICByZXR1cm4ge1xyXG4gICAgZGV2aWNlOiBkZXZpY2UsXHJcbiAgICBpc1VuYzogaXNVbmMsXHJcbiAgICBpc0Fic29sdXRlOiBpc1VuYyB8fCAhIXJlc3VsdFsyXSwgLy8gVU5DIHBhdGhzIGFyZSBhbHdheXMgYWJzb2x1dGVcclxuICAgIHRhaWw6IHJlc3VsdFszXVxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZVVOQ1Jvb3QoZGV2aWNlKSB7XHJcbiAgcmV0dXJuICdcXFxcXFxcXCcgKyBkZXZpY2UucmVwbGFjZSgvXltcXFxcXFwvXSsvLCAnJykucmVwbGFjZSgvW1xcXFxcXC9dKy9nLCAnXFxcXCcpO1xyXG59XHJcblxyXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXHJcbndpbjMyLnJlc29sdmUgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgcmVzb2x2ZWREZXZpY2UgPSAnJyxcclxuICAgICAgcmVzb2x2ZWRUYWlsID0gJycsXHJcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcclxuXHJcbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xOyBpLS0pIHtcclxuICAgIHZhciBwYXRoO1xyXG4gICAgaWYgKGkgPj0gMCkge1xyXG4gICAgICBwYXRoID0gYXJndW1lbnRzW2ldO1xyXG4gICAgfSBlbHNlIGlmICghcmVzb2x2ZWREZXZpY2UpIHtcclxuICAgICAgcGF0aCA9IHByb2Nlc3MuY3dkKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBXaW5kb3dzIGhhcyB0aGUgY29uY2VwdCBvZiBkcml2ZS1zcGVjaWZpYyBjdXJyZW50IHdvcmtpbmdcclxuICAgICAgLy8gZGlyZWN0b3JpZXMuIElmIHdlJ3ZlIHJlc29sdmVkIGEgZHJpdmUgbGV0dGVyIGJ1dCBub3QgeWV0IGFuXHJcbiAgICAgIC8vIGFic29sdXRlIHBhdGgsIGdldCBjd2QgZm9yIHRoYXQgZHJpdmUuIFdlJ3JlIHN1cmUgdGhlIGRldmljZSBpcyBub3RcclxuICAgICAgLy8gYW4gdW5jIHBhdGggYXQgdGhpcyBwb2ludHMsIGJlY2F1c2UgdW5jIHBhdGhzIGFyZSBhbHdheXMgYWJzb2x1dGUuXHJcbiAgICAgIHBhdGggPSBwcm9jZXNzLmVudlsnPScgKyByZXNvbHZlZERldmljZV07XHJcbiAgICAgIC8vIFZlcmlmeSB0aGF0IGEgZHJpdmUtbG9jYWwgY3dkIHdhcyBmb3VuZCBhbmQgdGhhdCBpdCBhY3R1YWxseSBwb2ludHNcclxuICAgICAgLy8gdG8gb3VyIGRyaXZlLiBJZiBub3QsIGRlZmF1bHQgdG8gdGhlIGRyaXZlJ3Mgcm9vdC5cclxuICAgICAgaWYgKCFwYXRoIHx8IHBhdGguc3Vic3RyKDAsIDMpLnRvTG93ZXJDYXNlKCkgIT09XHJcbiAgICAgICAgICByZXNvbHZlZERldmljZS50b0xvd2VyQ2FzZSgpICsgJ1xcXFwnKSB7XHJcbiAgICAgICAgcGF0aCA9IHJlc29sdmVkRGV2aWNlICsgJ1xcXFwnO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXHJcbiAgICBpZiAoIXV0aWwuaXNTdHJpbmcocGF0aCkpIHtcclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcclxuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHJlc3VsdCA9IHdpbjMyU3RhdFBhdGgocGF0aCksXHJcbiAgICAgICAgZGV2aWNlID0gcmVzdWx0LmRldmljZSxcclxuICAgICAgICBpc1VuYyA9IHJlc3VsdC5pc1VuYyxcclxuICAgICAgICBpc0Fic29sdXRlID0gcmVzdWx0LmlzQWJzb2x1dGUsXHJcbiAgICAgICAgdGFpbCA9IHJlc3VsdC50YWlsO1xyXG5cclxuICAgIGlmIChkZXZpY2UgJiZcclxuICAgICAgICByZXNvbHZlZERldmljZSAmJlxyXG4gICAgICAgIGRldmljZS50b0xvd2VyQ2FzZSgpICE9PSByZXNvbHZlZERldmljZS50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICAgIC8vIFRoaXMgcGF0aCBwb2ludHMgdG8gYW5vdGhlciBkZXZpY2Ugc28gaXQgaXMgbm90IGFwcGxpY2FibGVcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFyZXNvbHZlZERldmljZSkge1xyXG4gICAgICByZXNvbHZlZERldmljZSA9IGRldmljZTtcclxuICAgIH1cclxuICAgIGlmICghcmVzb2x2ZWRBYnNvbHV0ZSkge1xyXG4gICAgICByZXNvbHZlZFRhaWwgPSB0YWlsICsgJ1xcXFwnICsgcmVzb2x2ZWRUYWlsO1xyXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gaXNBYnNvbHV0ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVzb2x2ZWREZXZpY2UgJiYgcmVzb2x2ZWRBYnNvbHV0ZSkge1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIENvbnZlcnQgc2xhc2hlcyB0byBiYWNrc2xhc2hlcyB3aGVuIGByZXNvbHZlZERldmljZWAgcG9pbnRzIHRvIGFuIFVOQ1xyXG4gIC8vIHJvb3QuIEFsc28gc3F1YXNoIG11bHRpcGxlIHNsYXNoZXMgaW50byBhIHNpbmdsZSBvbmUgd2hlcmUgYXBwcm9wcmlhdGUuXHJcbiAgaWYgKGlzVW5jKSB7XHJcbiAgICByZXNvbHZlZERldmljZSA9IG5vcm1hbGl6ZVVOQ1Jvb3QocmVzb2x2ZWREZXZpY2UpO1xyXG4gIH1cclxuXHJcbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsXHJcbiAgLy8gYnV0IGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpXHJcbiAgLy8gZmFpbHMpXHJcblxyXG4gIC8vIE5vcm1hbGl6ZSB0aGUgdGFpbCBwYXRoXHJcbiAgcmVzb2x2ZWRUYWlsID0gbm9ybWFsaXplQXJyYXkocmVzb2x2ZWRUYWlsLnNwbGl0KC9bXFxcXFxcL10rLyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJ1xcXFwnKTtcclxuXHJcbiAgcmV0dXJuIChyZXNvbHZlZERldmljZSArIChyZXNvbHZlZEFic29sdXRlID8gJ1xcXFwnIDogJycpICsgcmVzb2x2ZWRUYWlsKSB8fFxyXG4gICAgICAgICAnLic7XHJcbn07XHJcblxyXG5cclxud2luMzIubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xyXG4gIHZhciByZXN1bHQgPSB3aW4zMlN0YXRQYXRoKHBhdGgpLFxyXG4gICAgICBkZXZpY2UgPSByZXN1bHQuZGV2aWNlLFxyXG4gICAgICBpc1VuYyA9IHJlc3VsdC5pc1VuYyxcclxuICAgICAgaXNBYnNvbHV0ZSA9IHJlc3VsdC5pc0Fic29sdXRlLFxyXG4gICAgICB0YWlsID0gcmVzdWx0LnRhaWwsXHJcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSAvW1xcXFxcXC9dJC8udGVzdCh0YWlsKTtcclxuXHJcbiAgLy8gTm9ybWFsaXplIHRoZSB0YWlsIHBhdGhcclxuICB0YWlsID0gbm9ybWFsaXplQXJyYXkodGFpbC5zcGxpdCgvW1xcXFxcXC9dKy8pLCAhaXNBYnNvbHV0ZSkuam9pbignXFxcXCcpO1xyXG5cclxuICBpZiAoIXRhaWwgJiYgIWlzQWJzb2x1dGUpIHtcclxuICAgIHRhaWwgPSAnLic7XHJcbiAgfVxyXG4gIGlmICh0YWlsICYmIHRyYWlsaW5nU2xhc2gpIHtcclxuICAgIHRhaWwgKz0gJ1xcXFwnO1xyXG4gIH1cclxuXHJcbiAgLy8gQ29udmVydCBzbGFzaGVzIHRvIGJhY2tzbGFzaGVzIHdoZW4gYGRldmljZWAgcG9pbnRzIHRvIGFuIFVOQyByb290LlxyXG4gIC8vIEFsc28gc3F1YXNoIG11bHRpcGxlIHNsYXNoZXMgaW50byBhIHNpbmdsZSBvbmUgd2hlcmUgYXBwcm9wcmlhdGUuXHJcbiAgaWYgKGlzVW5jKSB7XHJcbiAgICBkZXZpY2UgPSBub3JtYWxpemVVTkNSb290KGRldmljZSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGV2aWNlICsgKGlzQWJzb2x1dGUgPyAnXFxcXCcgOiAnJykgKyB0YWlsO1xyXG59O1xyXG5cclxuXHJcbndpbjMyLmlzQWJzb2x1dGUgPSBmdW5jdGlvbihwYXRoKSB7XHJcbiAgcmV0dXJuIHdpbjMyU3RhdFBhdGgocGF0aCkuaXNBYnNvbHV0ZTtcclxufTtcclxuXHJcbndpbjMyLmpvaW4gPSBmdW5jdGlvbigpIHtcclxuICB2YXIgcGF0aHMgPSBbXTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgdmFyIGFyZyA9IGFyZ3VtZW50c1tpXTtcclxuICAgIGlmICghdXRpbC5pc1N0cmluZyhhcmcpKSB7XHJcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoYXJnKSB7XHJcbiAgICAgIHBhdGhzLnB1c2goYXJnKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHZhciBqb2luZWQgPSBwYXRocy5qb2luKCdcXFxcJyk7XHJcblxyXG4gIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSBqb2luZWQgcGF0aCBkb2Vzbid0IHN0YXJ0IHdpdGggdHdvIHNsYXNoZXMsIGJlY2F1c2VcclxuICAvLyBub3JtYWxpemUoKSB3aWxsIG1pc3Rha2UgaXQgZm9yIGFuIFVOQyBwYXRoIHRoZW4uXHJcbiAgLy9cclxuICAvLyBUaGlzIHN0ZXAgaXMgc2tpcHBlZCB3aGVuIGl0IGlzIHZlcnkgY2xlYXIgdGhhdCB0aGUgdXNlciBhY3R1YWxseVxyXG4gIC8vIGludGVuZGVkIHRvIHBvaW50IGF0IGFuIFVOQyBwYXRoLiBUaGlzIGlzIGFzc3VtZWQgd2hlbiB0aGUgZmlyc3RcclxuICAvLyBub24tZW1wdHkgc3RyaW5nIGFyZ3VtZW50cyBzdGFydHMgd2l0aCBleGFjdGx5IHR3byBzbGFzaGVzIGZvbGxvd2VkIGJ5XHJcbiAgLy8gYXQgbGVhc3Qgb25lIG1vcmUgbm9uLXNsYXNoIGNoYXJhY3Rlci5cclxuICAvL1xyXG4gIC8vIE5vdGUgdGhhdCBmb3Igbm9ybWFsaXplKCkgdG8gdHJlYXQgYSBwYXRoIGFzIGFuIFVOQyBwYXRoIGl0IG5lZWRzIHRvXHJcbiAgLy8gaGF2ZSBhdCBsZWFzdCAyIGNvbXBvbmVudHMsIHNvIHdlIGRvbid0IGZpbHRlciBmb3IgdGhhdCBoZXJlLlxyXG4gIC8vIFRoaXMgbWVhbnMgdGhhdCB0aGUgdXNlciBjYW4gdXNlIGpvaW4gdG8gY29uc3RydWN0IFVOQyBwYXRocyBmcm9tXHJcbiAgLy8gYSBzZXJ2ZXIgbmFtZSBhbmQgYSBzaGFyZSBuYW1lOyBmb3IgZXhhbXBsZTpcclxuICAvLyAgIHBhdGguam9pbignLy9zZXJ2ZXInLCAnc2hhcmUnKSAtPiAnXFxcXFxcXFxzZXJ2ZXJcXFxcc2hhcmVcXCcpXHJcbiAgaWYgKCEvXltcXFxcXFwvXXsyfVteXFxcXFxcL10vLnRlc3QocGF0aHNbMF0pKSB7XHJcbiAgICBqb2luZWQgPSBqb2luZWQucmVwbGFjZSgvXltcXFxcXFwvXXsyLH0vLCAnXFxcXCcpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHdpbjMyLm5vcm1hbGl6ZShqb2luZWQpO1xyXG59O1xyXG5cclxuXHJcbi8vIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pXHJcbi8vIGl0IHdpbGwgc29sdmUgdGhlIHJlbGF0aXZlIHBhdGggZnJvbSAnZnJvbScgdG8gJ3RvJywgZm9yIGluc3RhbmNlOlxyXG4vLyBmcm9tID0gJ0M6XFxcXG9yYW5kZWFcXFxcdGVzdFxcXFxhYWEnXHJcbi8vIHRvID0gJ0M6XFxcXG9yYW5kZWFcXFxcaW1wbFxcXFxiYmInXHJcbi8vIFRoZSBvdXRwdXQgb2YgdGhlIGZ1bmN0aW9uIHNob3VsZCBiZTogJy4uXFxcXC4uXFxcXGltcGxcXFxcYmJiJ1xyXG53aW4zMi5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XHJcbiAgZnJvbSA9IHdpbjMyLnJlc29sdmUoZnJvbSk7XHJcbiAgdG8gPSB3aW4zMi5yZXNvbHZlKHRvKTtcclxuXHJcbiAgLy8gd2luZG93cyBpcyBub3QgY2FzZSBzZW5zaXRpdmVcclxuICB2YXIgbG93ZXJGcm9tID0gZnJvbS50b0xvd2VyQ2FzZSgpO1xyXG4gIHZhciBsb3dlclRvID0gdG8udG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgdmFyIHRvUGFydHMgPSB0cmltQXJyYXkodG8uc3BsaXQoJ1xcXFwnKSk7XHJcblxyXG4gIHZhciBsb3dlckZyb21QYXJ0cyA9IHRyaW1BcnJheShsb3dlckZyb20uc3BsaXQoJ1xcXFwnKSk7XHJcbiAgdmFyIGxvd2VyVG9QYXJ0cyA9IHRyaW1BcnJheShsb3dlclRvLnNwbGl0KCdcXFxcJykpO1xyXG5cclxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4obG93ZXJGcm9tUGFydHMubGVuZ3RoLCBsb3dlclRvUGFydHMubGVuZ3RoKTtcclxuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgIGlmIChsb3dlckZyb21QYXJ0c1tpXSAhPT0gbG93ZXJUb1BhcnRzW2ldKSB7XHJcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKHNhbWVQYXJ0c0xlbmd0aCA9PSAwKSB7XHJcbiAgICByZXR1cm4gdG87XHJcbiAgfVxyXG5cclxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcclxuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgbG93ZXJGcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcclxuICAgIG91dHB1dFBhcnRzLnB1c2goJy4uJyk7XHJcbiAgfVxyXG5cclxuICBvdXRwdXRQYXJ0cyA9IG91dHB1dFBhcnRzLmNvbmNhdCh0b1BhcnRzLnNsaWNlKHNhbWVQYXJ0c0xlbmd0aCkpO1xyXG5cclxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignXFxcXCcpO1xyXG59O1xyXG5cclxuXHJcbndpbjMyLl9tYWtlTG9uZyA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuICAvLyBOb3RlOiB0aGlzIHdpbGwgKnByb2JhYmx5KiB0aHJvdyBzb21ld2hlcmUuXHJcbiAgaWYgKCF1dGlsLmlzU3RyaW5nKHBhdGgpKVxyXG4gICAgcmV0dXJuIHBhdGg7XHJcblxyXG4gIGlmICghcGF0aCkge1xyXG4gICAgcmV0dXJuICcnO1xyXG4gIH1cclxuXHJcbiAgdmFyIHJlc29sdmVkUGF0aCA9IHdpbjMyLnJlc29sdmUocGF0aCk7XHJcblxyXG4gIGlmICgvXlthLXpBLVpdXFw6XFxcXC8udGVzdChyZXNvbHZlZFBhdGgpKSB7XHJcbiAgICAvLyBwYXRoIGlzIGxvY2FsIGZpbGVzeXN0ZW0gcGF0aCwgd2hpY2ggbmVlZHMgdG8gYmUgY29udmVydGVkXHJcbiAgICAvLyB0byBsb25nIFVOQyBwYXRoLlxyXG4gICAgcmV0dXJuICdcXFxcXFxcXD9cXFxcJyArIHJlc29sdmVkUGF0aDtcclxuICB9IGVsc2UgaWYgKC9eXFxcXFxcXFxbXj8uXS8udGVzdChyZXNvbHZlZFBhdGgpKSB7XHJcbiAgICAvLyBwYXRoIGlzIG5ldHdvcmsgVU5DIHBhdGgsIHdoaWNoIG5lZWRzIHRvIGJlIGNvbnZlcnRlZFxyXG4gICAgLy8gdG8gbG9uZyBVTkMgcGF0aC5cclxuICAgIHJldHVybiAnXFxcXFxcXFw/XFxcXFVOQ1xcXFwnICsgcmVzb2x2ZWRQYXRoLnN1YnN0cmluZygyKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBwYXRoO1xyXG59O1xyXG5cclxuXHJcbndpbjMyLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XHJcbiAgdmFyIHJlc3VsdCA9IHdpbjMyU3BsaXRQYXRoKHBhdGgpLFxyXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxyXG4gICAgICBkaXIgPSByZXN1bHRbMV07XHJcblxyXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XHJcbiAgICAvLyBObyBkaXJuYW1lIHdoYXRzb2V2ZXJcclxuICAgIHJldHVybiAnLic7XHJcbiAgfVxyXG5cclxuICBpZiAoZGlyKSB7XHJcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxyXG4gICAgZGlyID0gZGlyLnN1YnN0cigwLCBkaXIubGVuZ3RoIC0gMSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcm9vdCArIGRpcjtcclxufTtcclxuXHJcblxyXG53aW4zMi5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xyXG4gIHZhciBmID0gd2luMzJTcGxpdFBhdGgocGF0aClbMl07XHJcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xyXG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XHJcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcclxuICB9XHJcbiAgcmV0dXJuIGY7XHJcbn07XHJcblxyXG5cclxud2luMzIuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuICByZXR1cm4gd2luMzJTcGxpdFBhdGgocGF0aClbM107XHJcbn07XHJcblxyXG5cclxud2luMzIuZm9ybWF0ID0gZnVuY3Rpb24ocGF0aE9iamVjdCkge1xyXG4gIGlmICghdXRpbC5pc09iamVjdChwYXRoT2JqZWN0KSkge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcclxuICAgICAgICBcIlBhcmFtZXRlciAncGF0aE9iamVjdCcgbXVzdCBiZSBhbiBvYmplY3QsIG5vdCBcIiArIHR5cGVvZiBwYXRoT2JqZWN0XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgdmFyIHJvb3QgPSBwYXRoT2JqZWN0LnJvb3QgfHwgJyc7XHJcblxyXG4gIGlmICghdXRpbC5pc1N0cmluZyhyb290KSkge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcclxuICAgICAgICBcIidwYXRoT2JqZWN0LnJvb3QnIG11c3QgYmUgYSBzdHJpbmcgb3IgdW5kZWZpbmVkLCBub3QgXCIgK1xyXG4gICAgICAgIHR5cGVvZiBwYXRoT2JqZWN0LnJvb3RcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICB2YXIgZGlyID0gcGF0aE9iamVjdC5kaXI7XHJcbiAgdmFyIGJhc2UgPSBwYXRoT2JqZWN0LmJhc2UgfHwgJyc7XHJcbiAgaWYgKCFkaXIpIHtcclxuICAgIHJldHVybiBiYXNlO1xyXG4gIH1cclxuICBpZiAoZGlyW2Rpci5sZW5ndGggLSAxXSA9PT0gd2luMzIuc2VwKSB7XHJcbiAgICByZXR1cm4gZGlyICsgYmFzZTtcclxuICB9XHJcbiAgcmV0dXJuIGRpciArIHdpbjMyLnNlcCArIGJhc2U7XHJcbn07XHJcblxyXG5cclxud2luMzIucGFyc2UgPSBmdW5jdGlvbihwYXRoU3RyaW5nKSB7XHJcbiAgaWYgKCF1dGlsLmlzU3RyaW5nKHBhdGhTdHJpbmcpKSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxyXG4gICAgICAgIFwiUGFyYW1ldGVyICdwYXRoU3RyaW5nJyBtdXN0IGJlIGEgc3RyaW5nLCBub3QgXCIgKyB0eXBlb2YgcGF0aFN0cmluZ1xyXG4gICAgKTtcclxuICB9XHJcbiAgdmFyIGFsbFBhcnRzID0gd2luMzJTcGxpdFBhdGgocGF0aFN0cmluZyk7XHJcbiAgaWYgKCFhbGxQYXJ0cyB8fCBhbGxQYXJ0cy5sZW5ndGggIT09IDQpIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIHBhdGggJ1wiICsgcGF0aFN0cmluZyArIFwiJ1wiKTtcclxuICB9XHJcbiAgcmV0dXJuIHtcclxuICAgIHJvb3Q6IGFsbFBhcnRzWzBdLFxyXG4gICAgZGlyOiBhbGxQYXJ0c1swXSArIGFsbFBhcnRzWzFdLnNsaWNlKDAsIC0xKSxcclxuICAgIGJhc2U6IGFsbFBhcnRzWzJdLFxyXG4gICAgZXh0OiBhbGxQYXJ0c1szXSxcclxuICAgIG5hbWU6IGFsbFBhcnRzWzJdLnNsaWNlKDAsIGFsbFBhcnRzWzJdLmxlbmd0aCAtIGFsbFBhcnRzWzNdLmxlbmd0aClcclxuICB9O1xyXG59O1xyXG5cclxuXHJcbndpbjMyLnNlcCA9ICdcXFxcJztcclxud2luMzIuZGVsaW1pdGVyID0gJzsnO1xyXG5cclxuXHJcbi8vIFNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XSwgdW5peCB2ZXJzaW9uXHJcbi8vICdyb290JyBpcyBqdXN0IGEgc2xhc2gsIG9yIG5vdGhpbmcuXHJcbnZhciBzcGxpdFBhdGhSZSA9XHJcbiAgICAvXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztcclxudmFyIHBvc2l4ID0ge307XHJcblxyXG5cclxuZnVuY3Rpb24gcG9zaXhTcGxpdFBhdGgoZmlsZW5hbWUpIHtcclxuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSk7XHJcbn1cclxuXHJcblxyXG4vLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXHJcbi8vIHBvc2l4IHZlcnNpb25cclxucG9zaXgucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcclxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xyXG5cclxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xyXG4gICAgdmFyIHBhdGggPSAoaSA+PSAwKSA/IGFyZ3VtZW50c1tpXSA6IHByb2Nlc3MuY3dkKCk7XHJcblxyXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXHJcbiAgICBpZiAoIXV0aWwuaXNTdHJpbmcocGF0aCkpIHtcclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcclxuICAgIH0gZWxzZSBpZiAoIXBhdGgpIHtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcclxuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoWzBdID09PSAnLyc7XHJcbiAgfVxyXG5cclxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XHJcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXHJcblxyXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxyXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XHJcblxyXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcclxufTtcclxuXHJcbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXHJcbi8vIHBvc2l4IHZlcnNpb25cclxucG9zaXgubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xyXG4gIHZhciBpc0Fic29sdXRlID0gcG9zaXguaXNBYnNvbHV0ZShwYXRoKSxcclxuICAgICAgdHJhaWxpbmdTbGFzaCA9IHBhdGggJiYgcGF0aFtwYXRoLmxlbmd0aCAtIDFdID09PSAnLyc7XHJcblxyXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxyXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShwYXRoLnNwbGl0KCcvJyksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XHJcblxyXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xyXG4gICAgcGF0aCA9ICcuJztcclxuICB9XHJcbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xyXG4gICAgcGF0aCArPSAnLyc7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xyXG59O1xyXG5cclxuLy8gcG9zaXggdmVyc2lvblxyXG5wb3NpeC5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xyXG4gIHJldHVybiBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xyXG59O1xyXG5cclxuLy8gcG9zaXggdmVyc2lvblxyXG5wb3NpeC5qb2luID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBhdGggPSAnJztcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgdmFyIHNlZ21lbnQgPSBhcmd1bWVudHNbaV07XHJcbiAgICBpZiAoIXV0aWwuaXNTdHJpbmcoc2VnbWVudCkpIHtcclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGguam9pbiBtdXN0IGJlIHN0cmluZ3MnKTtcclxuICAgIH1cclxuICAgIGlmIChzZWdtZW50KSB7XHJcbiAgICAgIGlmICghcGF0aCkge1xyXG4gICAgICAgIHBhdGggKz0gc2VnbWVudDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwYXRoICs9ICcvJyArIHNlZ21lbnQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHBvc2l4Lm5vcm1hbGl6ZShwYXRoKTtcclxufTtcclxuXHJcblxyXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxyXG4vLyBwb3NpeCB2ZXJzaW9uXHJcbnBvc2l4LnJlbGF0aXZlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcclxuICBmcm9tID0gcG9zaXgucmVzb2x2ZShmcm9tKS5zdWJzdHIoMSk7XHJcbiAgdG8gPSBwb3NpeC5yZXNvbHZlKHRvKS5zdWJzdHIoMSk7XHJcblxyXG4gIHZhciBmcm9tUGFydHMgPSB0cmltQXJyYXkoZnJvbS5zcGxpdCgnLycpKTtcclxuICB2YXIgdG9QYXJ0cyA9IHRyaW1BcnJheSh0by5zcGxpdCgnLycpKTtcclxuXHJcbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGZyb21QYXJ0cy5sZW5ndGgsIHRvUGFydHMubGVuZ3RoKTtcclxuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgIGlmIChmcm9tUGFydHNbaV0gIT09IHRvUGFydHNbaV0pIHtcclxuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgb3V0cHV0UGFydHMgPSBbXTtcclxuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xyXG4gIH1cclxuXHJcbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcclxuXHJcbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcclxufTtcclxuXHJcblxyXG5wb3NpeC5fbWFrZUxvbmcgPSBmdW5jdGlvbihwYXRoKSB7XHJcbiAgcmV0dXJuIHBhdGg7XHJcbn07XHJcblxyXG5cclxucG9zaXguZGlybmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuICB2YXIgcmVzdWx0ID0gcG9zaXhTcGxpdFBhdGgocGF0aCksXHJcbiAgICAgIHJvb3QgPSByZXN1bHRbMF0sXHJcbiAgICAgIGRpciA9IHJlc3VsdFsxXTtcclxuXHJcbiAgaWYgKCFyb290ICYmICFkaXIpIHtcclxuICAgIC8vIE5vIGRpcm5hbWUgd2hhdHNvZXZlclxyXG4gICAgcmV0dXJuICcuJztcclxuICB9XHJcblxyXG4gIGlmIChkaXIpIHtcclxuICAgIC8vIEl0IGhhcyBhIGRpcm5hbWUsIHN0cmlwIHRyYWlsaW5nIHNsYXNoXHJcbiAgICBkaXIgPSBkaXIuc3Vic3RyKDAsIGRpci5sZW5ndGggLSAxKTtcclxuICB9XHJcblxyXG4gIHJldHVybiByb290ICsgZGlyO1xyXG59O1xyXG5cclxuXHJcbnBvc2l4LmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XHJcbiAgdmFyIGYgPSBwb3NpeFNwbGl0UGF0aChwYXRoKVsyXTtcclxuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XHJcbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcclxuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xyXG4gIH1cclxuICByZXR1cm4gZjtcclxufTtcclxuXHJcblxyXG5wb3NpeC5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xyXG4gIHJldHVybiBwb3NpeFNwbGl0UGF0aChwYXRoKVszXTtcclxufTtcclxuXHJcblxyXG5wb3NpeC5mb3JtYXQgPSBmdW5jdGlvbihwYXRoT2JqZWN0KSB7XHJcbiAgaWYgKCF1dGlsLmlzT2JqZWN0KHBhdGhPYmplY3QpKSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxyXG4gICAgICAgIFwiUGFyYW1ldGVyICdwYXRoT2JqZWN0JyBtdXN0IGJlIGFuIG9iamVjdCwgbm90IFwiICsgdHlwZW9mIHBhdGhPYmplY3RcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICB2YXIgcm9vdCA9IHBhdGhPYmplY3Qucm9vdCB8fCAnJztcclxuXHJcbiAgaWYgKCF1dGlsLmlzU3RyaW5nKHJvb3QpKSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxyXG4gICAgICAgIFwiJ3BhdGhPYmplY3Qucm9vdCcgbXVzdCBiZSBhIHN0cmluZyBvciB1bmRlZmluZWQsIG5vdCBcIiArXHJcbiAgICAgICAgdHlwZW9mIHBhdGhPYmplY3Qucm9vdFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHZhciBkaXIgPSBwYXRoT2JqZWN0LmRpciA/IHBhdGhPYmplY3QuZGlyICsgcG9zaXguc2VwIDogJyc7XHJcbiAgdmFyIGJhc2UgPSBwYXRoT2JqZWN0LmJhc2UgfHwgJyc7XHJcbiAgcmV0dXJuIGRpciArIGJhc2U7XHJcbn07XHJcblxyXG5cclxucG9zaXgucGFyc2UgPSBmdW5jdGlvbihwYXRoU3RyaW5nKSB7XHJcbiAgaWYgKCF1dGlsLmlzU3RyaW5nKHBhdGhTdHJpbmcpKSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxyXG4gICAgICAgIFwiUGFyYW1ldGVyICdwYXRoU3RyaW5nJyBtdXN0IGJlIGEgc3RyaW5nLCBub3QgXCIgKyB0eXBlb2YgcGF0aFN0cmluZ1xyXG4gICAgKTtcclxuICB9XHJcbiAgdmFyIGFsbFBhcnRzID0gcG9zaXhTcGxpdFBhdGgocGF0aFN0cmluZyk7XHJcbiAgaWYgKCFhbGxQYXJ0cyB8fCBhbGxQYXJ0cy5sZW5ndGggIT09IDQpIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIHBhdGggJ1wiICsgcGF0aFN0cmluZyArIFwiJ1wiKTtcclxuICB9XHJcbiAgYWxsUGFydHNbMV0gPSBhbGxQYXJ0c1sxXSB8fCAnJztcclxuICBhbGxQYXJ0c1syXSA9IGFsbFBhcnRzWzJdIHx8ICcnO1xyXG4gIGFsbFBhcnRzWzNdID0gYWxsUGFydHNbM10gfHwgJyc7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICByb290OiBhbGxQYXJ0c1swXSxcclxuICAgIGRpcjogYWxsUGFydHNbMF0gKyBhbGxQYXJ0c1sxXS5zbGljZSgwLCAtMSksXHJcbiAgICBiYXNlOiBhbGxQYXJ0c1syXSxcclxuICAgIGV4dDogYWxsUGFydHNbM10sXHJcbiAgICBuYW1lOiBhbGxQYXJ0c1syXS5zbGljZSgwLCBhbGxQYXJ0c1syXS5sZW5ndGggLSBhbGxQYXJ0c1szXS5sZW5ndGgpXHJcbiAgfTtcclxufTtcclxuXHJcblxyXG5wb3NpeC5zZXAgPSAnLyc7XHJcbnBvc2l4LmRlbGltaXRlciA9ICc6JztcclxuXHJcblxyXG5pZiAoaXNXaW5kb3dzKVxyXG4gIG1vZHVsZS5leHBvcnRzID0gd2luMzI7XHJcbmVsc2UgLyogcG9zaXggKi9cclxuICBtb2R1bGUuZXhwb3J0cyA9IHBvc2l4O1xyXG5cclxubW9kdWxlLmV4cG9ydHMucG9zaXggPSBwb3NpeDtcclxubW9kdWxlLmV4cG9ydHMud2luMzIgPSB3aW4zMjtcclxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsImltcG9ydCB7IF9fYXNzaWduIH0gZnJvbSBcInRzbGliXCI7XG5pbXBvcnQgeyBkb3RDYXNlIH0gZnJvbSBcImRvdC1jYXNlXCI7XG5leHBvcnQgZnVuY3Rpb24gc25ha2VDYXNlKGlucHV0LCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICByZXR1cm4gZG90Q2FzZShpbnB1dCwgX19hc3NpZ24oeyBkZWxpbWl0ZXI6IFwiX1wiIH0sIG9wdGlvbnMpKTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsImltcG9ydCBEZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5pbXBvcnQgeyBQb3N0bWF0ZSwgTW9kZWwgfSBmcm9tICcuL3Bvc3RtYXRlJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRlbWl0dGVyMyc7XG5pbXBvcnQgeyBkZWZlcnJlZCwgSVNfREVWIH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7IExTUGx1Z2luU2hhZG93RnJhbWUgfSBmcm9tICcuL0xTUGx1Z2luLnNoYWRvdyc7XG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdMU1BsdWdpbjpjYWxsZXInKTtcbmV4cG9ydCBjb25zdCBGTEFHX0FXQUlUID0gJyNhd2FpdCNyZXNwb25zZSMnO1xuZXhwb3J0IGNvbnN0IExTUE1TRyA9ICcjbHNwbXNnIyc7XG5leHBvcnQgY29uc3QgTFNQTVNHX0VSUk9SX1RBRyA9ICcjbHNwbXNnI2Vycm9yIyc7XG5leHBvcnQgY29uc3QgTFNQTVNHX1NFVFRJTkdTID0gJyNsc3Btc2cjc2V0dGluZ3MjJztcbmV4cG9ydCBjb25zdCBMU1BNU0dfQkVGT1JFX1VOTE9BRCA9ICcjbHNwbXNnI2JlZm9yZXVubG9hZCMnO1xuZXhwb3J0IGNvbnN0IExTUE1TR19TWU5DID0gJyNsc3Btc2cjcmVwbHkjJztcbmV4cG9ydCBjb25zdCBMU1BNU0dfUkVBRFkgPSAnI2xzcG1zZyNyZWFkeSMnO1xuZXhwb3J0IGNvbnN0IExTUE1TR0ZuID0gKGlkKSA9PiBgJHtMU1BNU0d9JHtpZH1gO1xuZXhwb3J0IGNvbnN0IEFXQUlUX0xTUE1TR0ZuID0gKGlkKSA9PiBgJHtGTEFHX0FXQUlUfSR7aWR9YDtcbi8qKlxuICogQ2FsbCBiZXR3ZWVuIGNvcmUgYW5kIHVzZXJcbiAqL1xuY2xhc3MgTFNQbHVnaW5DYWxsZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIF9wbHVnaW5Mb2NhbDtcbiAgICBfY29ubmVjdGVkID0gZmFsc2U7XG4gICAgX3BhcmVudDtcbiAgICBfY2hpbGQ7XG4gICAgX3NoYWRvdztcbiAgICBfc3RhdHVzO1xuICAgIF91c2VyTW9kZWwgPSB7fTtcbiAgICBfY2FsbDtcbiAgICBfY2FsbFVzZXJNb2RlbDtcbiAgICBfZGVidWdUYWcgPSAnJztcbiAgICBjb25zdHJ1Y3RvcihfcGx1Z2luTG9jYWwpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fcGx1Z2luTG9jYWwgPSBfcGx1Z2luTG9jYWw7XG4gICAgICAgIGlmIChfcGx1Z2luTG9jYWwpIHtcbiAgICAgICAgICAgIHRoaXMuX2RlYnVnVGFnID0gX3BsdWdpbkxvY2FsLmRlYnVnVGFnO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGNvbm5lY3RUb0NoaWxkKCkge1xuICAgICAgICBpZiAodGhpcy5fY29ubmVjdGVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB7IHNoYWRvdyB9ID0gdGhpcy5fcGx1Z2luTG9jYWw7XG4gICAgICAgIGlmIChzaGFkb3cpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3NldHVwU2hhZG93U2FuZGJveCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fc2V0dXBJZnJhbWVTYW5kYm94KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gcnVuIGluIHNhbmRib3hcbiAgICBhc3luYyBjb25uZWN0VG9QYXJlbnQodXNlck1vZGVsID0ge30pIHtcbiAgICAgICAgaWYgKHRoaXMuX2Nvbm5lY3RlZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgY2FsbGVyID0gdGhpcztcbiAgICAgICAgY29uc3QgaXNTaGFkb3dNb2RlID0gdGhpcy5fcGx1Z2luTG9jYWwgIT0gbnVsbDtcbiAgICAgICAgbGV0IHN5bmNHQ1RpbWVyID0gMDtcbiAgICAgICAgbGV0IHN5bmNUYWcgPSAwO1xuICAgICAgICBjb25zdCBzeW5jQWN0b3JzID0gbmV3IE1hcCgpO1xuICAgICAgICBjb25zdCByZWFkeURlZmVycmVkID0gZGVmZXJyZWQoMTAwMCAqIDUpO1xuICAgICAgICBjb25zdCBtb2RlbCA9IHRoaXMuX2V4dGVuZFVzZXJNb2RlbCh7XG4gICAgICAgICAgICBbTFNQTVNHX1JFQURZXTogYXN5bmMgKGJhc2VJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gZHluYW1pY2FsbHkgc2V0dXAgY29tbW9uIG1zZyBoYW5kbGVyXG4gICAgICAgICAgICAgICAgbW9kZWxbTFNQTVNHRm4oYmFzZUluZm8/LnBpZCldID0gKHsgdHlwZSwgcGF5bG9hZCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGBbY2FsbCBmcm9tIGhvc3QgKF9jYWxsKV0gJHt0aGlzLl9kZWJ1Z1RhZ31gLCB0eXBlLCBwYXlsb2FkKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaG9zdC5fY2FsbCB3aXRob3V0IGFzeW5jXG4gICAgICAgICAgICAgICAgICAgIGNhbGxlci5lbWl0KHR5cGUsIHBheWxvYWQpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVhZHlEZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgW0xTUE1TR19CRUZPUkVfVU5MT0FEXTogYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3RvciA9IGRlZmVycmVkKDEwICogMTAwMCk7XG4gICAgICAgICAgICAgICAgY2FsbGVyLmVtaXQoJ2JlZm9yZXVubG9hZCcsIE9iamVjdC5hc3NpZ24oeyBhY3RvciB9LCBlKSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgYWN0b3IucHJvbWlzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbTFNQTVNHX1NFVFRJTkdTXTogYXN5bmMgKHsgdHlwZSwgcGF5bG9hZCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgY2FsbGVyLmVtaXQoJ3NldHRpbmdzOmNoYW5nZWQnLCBwYXlsb2FkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbTFNQTVNHXTogYXN5bmMgKHsgbnMsIHR5cGUsIHBheWxvYWQgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGRlYnVnKGBbY2FsbCBmcm9tIGhvc3QgKGFzeW5jKV0gJHt0aGlzLl9kZWJ1Z1RhZ31gLCBucywgdHlwZSwgcGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgaWYgKG5zICYmIG5zLnN0YXJ0c1dpdGgoJ2hvb2snKSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsZXIuZW1pdChgJHtuc306JHt0eXBlfWAsIHBheWxvYWQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbGxlci5lbWl0KHR5cGUsIHBheWxvYWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFtMU1BNU0dfU1lOQ106ICh7IF9zeW5jLCByZXN1bHQgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGRlYnVnKGBbc3luYyByZXBseV0gIyR7X3N5bmN9YCwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICBpZiAoc3luY0FjdG9ycy5oYXMoX3N5bmMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdG9yID0gc3luY0FjdG9ycy5nZXQoX3N5bmMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQ/Lmhhc093blByb3BlcnR5KExTUE1TR19FUlJPUl9UQUcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0b3IucmVqZWN0KHJlc3VsdFtMU1BNU0dfRVJST1JfVEFHXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rvci5yZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzeW5jQWN0b3JzLmRlbGV0ZShfc3luYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLi4udXNlck1vZGVsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaXNTaGFkb3dNb2RlKSB7XG4gICAgICAgICAgICBhd2FpdCByZWFkeURlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLl9wbHVnaW5Mb2NhbD8udG9KU09OKCkpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwbSA9IG5ldyBNb2RlbChtb2RlbCk7XG4gICAgICAgIGNvbnN0IGhhbmRzaGFrZSA9IHBtLnNlbmRIYW5kc2hha2VSZXBseSgpO1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSAncGVuZGluZyc7XG4gICAgICAgIGF3YWl0IGhhbmRzaGFrZS50aGVuKChyZWZQYXJlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2NoaWxkID0gcmVmUGFyZW50O1xuICAgICAgICAgICAgdGhpcy5fY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX2NhbGwgPSBhc3luYyAodHlwZSwgcGF5bG9hZCA9IHt9LCBhY3RvcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhY3Rvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YWcgPSArK3N5bmNUYWc7XG4gICAgICAgICAgICAgICAgICAgIHN5bmNBY3RvcnMuc2V0KHRhZywgYWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICBwYXlsb2FkLl9zeW5jID0gdGFnO1xuICAgICAgICAgICAgICAgICAgICBhY3Rvci5zZXRUYWcoYGFzeW5jIGNhbGwgIyR7dGFnfWApO1xuICAgICAgICAgICAgICAgICAgICBkZWJ1ZygnYXN5bmMgY2FsbCAjJywgdGFnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVmUGFyZW50LmVtaXQoTFNQTVNHRm4obW9kZWwuYmFzZUluZm8uaWQpLCB7IHR5cGUsIHBheWxvYWQgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjdG9yPy5wcm9taXNlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX2NhbGxVc2VyTW9kZWwgPSBhc3luYyAodHlwZSwgcGF5bG9hZCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVsW3R5cGVdKHBheWxvYWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgW21vZGVsIG1ldGhvZF0gIyR7dHlwZX0gbm90IGV4aXN0ZWRgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gYWN0b3JzIEdDXG4gICAgICAgICAgICBzeW5jR0NUaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3luY0FjdG9ycy5zaXplID4gMTAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIHN5bmNBY3RvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2LnNldHRsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeW5jQWN0b3JzLmRlbGV0ZShrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMDAgKiA2MCAqIDMwKTtcbiAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCByZWFkeURlZmVycmVkLnByb21pc2U7XG4gICAgICAgIHJldHVybiBtb2RlbC5iYXNlSW5mbztcbiAgICB9XG4gICAgYXN5bmMgY2FsbCh0eXBlLCBwYXlsb2FkID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NhbGw/LmNhbGwodGhpcywgdHlwZSwgcGF5bG9hZCk7XG4gICAgfVxuICAgIGFzeW5jIGNhbGxBc3luYyh0eXBlLCBwYXlsb2FkID0ge30pIHtcbiAgICAgICAgY29uc3QgYWN0b3IgPSBkZWZlcnJlZCgxMDAwICogMTApO1xuICAgICAgICByZXR1cm4gdGhpcy5fY2FsbD8uY2FsbCh0aGlzLCB0eXBlLCBwYXlsb2FkLCBhY3Rvcik7XG4gICAgfVxuICAgIGFzeW5jIGNhbGxVc2VyTW9kZWwodHlwZSwgcGF5bG9hZCA9IHt9KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jYWxsVXNlck1vZGVsPy5jYWxsKHRoaXMsIHR5cGUsIHBheWxvYWQpO1xuICAgIH1cbiAgICAvLyBydW4gaW4gaG9zdFxuICAgIGFzeW5jIF9zZXR1cElmcmFtZVNhbmRib3goKSB7XG4gICAgICAgIGNvbnN0IHBsID0gdGhpcy5fcGx1Z2luTG9jYWw7XG4gICAgICAgIGNvbnN0IGlkID0gcGwuaWQ7XG4gICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocGwub3B0aW9ucy5lbnRyeSk7XG4gICAgICAgIHVybC5zZWFyY2hQYXJhbXNcbiAgICAgICAgICAgIC5zZXQoYF9fdl9fYCwgSVNfREVWID8gRGF0ZS5ub3coKS50b1N0cmluZygpIDogcGwub3B0aW9ucy52ZXJzaW9uKTtcbiAgICAgICAgLy8gY2xlYXIgem9tYmllIHNhbmRib3hcbiAgICAgICAgY29uc3QgemIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjJHtpZH1gKTtcbiAgICAgICAgaWYgKHpiKVxuICAgICAgICAgICAgemIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh6Yik7XG4gICAgICAgIGNvbnN0IGNudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjbnQuY2xhc3NMaXN0LmFkZCgnbHNwLWlmcmFtZS1zYW5kYm94LWNvbnRhaW5lcicpO1xuICAgICAgICBjbnQuaWQgPSBpZDtcbiAgICAgICAgLy8gVE9ETzogYXBwbHkgYW55IGNvbnRhaW5lciBsYXlvdXQgZGF0YVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBtYWluTGF5b3V0SW5mbyA9IHRoaXMuX3BsdWdpbkxvY2FsLnNldHRpbmdzLmdldCgnbGF5b3V0Jyk/LlswXTtcbiAgICAgICAgICAgIGlmIChtYWluTGF5b3V0SW5mbykge1xuICAgICAgICAgICAgICAgIGNudC5kYXRhc2V0LmluaXRlZF9sYXlvdXQgPSAndHJ1ZSc7XG4gICAgICAgICAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0LCBsZWZ0LCB0b3AgfSA9IG1haW5MYXlvdXRJbmZvO1xuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oY250LnN0eWxlLCB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCArICdweCcsIGhlaWdodDogaGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogbGVmdCArICdweCcsIHRvcDogdG9wICsgJ3B4J1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY250KTtcbiAgICAgICAgY29uc3QgcHQgPSBuZXcgUG9zdG1hdGUoe1xuICAgICAgICAgICAgaWQ6IGlkICsgJ19pZnJhbWUnLCBjb250YWluZXI6IGNudCwgdXJsOiB1cmwuaHJlZixcbiAgICAgICAgICAgIGNsYXNzTGlzdEFycmF5OiBbJ2xzcC1pZnJhbWUtc2FuZGJveCddLFxuICAgICAgICAgICAgbW9kZWw6IHsgYmFzZUluZm86IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkocGwudG9KU09OKCkpKSB9XG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgaGFuZHNoYWtlID0gcHQuc2VuZEhhbmRzaGFrZSgpO1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSAncGVuZGluZyc7XG4gICAgICAgIC8vIHRpbWVvdXQgZm9yIGhhbmRzaGFrZVxuICAgICAgICBsZXQgdGltZXI7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYGhhbmRzaGFrZSBUaW1lb3V0YCkpO1xuICAgICAgICAgICAgfSwgMyAqIDEwMDApOyAvLyAzc2Vjc1xuICAgICAgICAgICAgaGFuZHNoYWtlLnRoZW4oKHJlZkNoaWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyZW50ID0gcmVmQ2hpbGQ7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgICAgIHJlZkNoaWxkLm9uKExTUE1TR0ZuKHBsLmlkKSwgKHsgdHlwZSwgcGF5bG9hZCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGBbY2FsbCBmcm9tIHBsdWdpbl0gYCwgdHlwZSwgcGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BsdWdpbkxvY2FsPy5lbWl0KHR5cGUsIHBheWxvYWQgfHwge30pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhbGwgPSBhc3luYyAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBwYXJlbnQgYWxsIHdpbGwgZ2V0IG1lc3NhZ2UgYmVmb3JlIGhhbmRzaGFrZWRcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgcmVmQ2hpbGQuY2FsbChMU1BNU0dGbihwbC5pZCksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGFyZ3NbMF0sIHBheWxvYWQ6IE9iamVjdC5hc3NpZ24oYXJnc1sxXSB8fCB7fSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQkcGlkOiBwbC5pZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYWxsVXNlck1vZGVsID0gYXN5bmMgKHR5cGUsIHBheWxvYWQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUuc3RhcnRzV2l0aChGTEFHX0FXQUlUKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogYXR0YWNoIHBheWxvYWQgd2l0aCBtZXRob2QgY2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHJlZkNoaWxkLmdldCh0eXBlLnJlcGxhY2UoRkxBR19BV0FJVCwgJycpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZkNoaWxkLmNhbGwodHlwZSwgcGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICB9KS5jYXRjaChlID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgZGVidWcoJ1tpZnJhbWUgc2FuZGJveF0gZXJyb3InLCBlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fc3RhdHVzID0gdW5kZWZpbmVkO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMgX3NldHVwU2hhZG93U2FuZGJveCgpIHtcbiAgICAgICAgY29uc3QgcGwgPSB0aGlzLl9wbHVnaW5Mb2NhbDtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5fc2hhZG93ID0gbmV3IExTUGx1Z2luU2hhZG93RnJhbWUocGwpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5fc3RhdHVzID0gJ3BlbmRpbmcnO1xuICAgICAgICAgICAgYXdhaXQgc2hhZG93LmxvYWQoKTtcbiAgICAgICAgICAgIHRoaXMuX2Nvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgdGhpcy5fY2FsbCA9IGFzeW5jICh0eXBlLCBwYXlsb2FkID0ge30sIGFjdG9yKSA9PiB7XG4gICAgICAgICAgICAgICAgYWN0b3IgJiYgKHBheWxvYWQuYWN0b3IgPSBhY3Rvcik7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBDYWxsIGluIHNhbWUgdGhyZWFkXG4gICAgICAgICAgICAgICAgdGhpcy5fcGx1Z2luTG9jYWw/LmVtaXQodHlwZSwgT2JqZWN0LmFzc2lnbihwYXlsb2FkLCB7XG4gICAgICAgICAgICAgICAgICAgICQkcGlkOiBwbC5pZFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0b3I/LnByb21pc2U7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5fY2FsbFVzZXJNb2RlbCA9IGFzeW5jICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHR5cGUgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlPy5zdGFydHNXaXRoKEZMQUdfQVdBSVQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLnJlcGxhY2UoRkxBR19BV0FJVCwgJycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBwYXlsb2FkID0gYXJnc1sxXSB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBmbiA9IHRoaXMuX3VzZXJNb2RlbFt0eXBlXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZuLmNhbGwobnVsbCwgcGF5bG9hZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZGVidWcoJ1tzaGFkb3cgc2FuZGJveF0gZXJyb3InLCBlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2V4dGVuZFVzZXJNb2RlbChtb2RlbCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih0aGlzLl91c2VyTW9kZWwsIG1vZGVsKTtcbiAgICB9XG4gICAgX2dldFNhbmRib3hJZnJhbWVDb250YWluZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQ/LmZyYW1lLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIF9nZXRTYW5kYm94U2hhZG93Q29udGFpbmVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2hhZG93Py5mcmFtZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgICBfZ2V0U2FuZGJveElmcmFtZVJvb3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQ/LmZyYW1lO1xuICAgIH1cbiAgICBfZ2V0U2FuZGJveFNoYWRvd1Jvb3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zaGFkb3c/LmZyYW1lO1xuICAgIH1cbiAgICBzZXQgZGVidWdUYWcodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fZGVidWdUYWcgPSB2YWx1ZTtcbiAgICB9XG4gICAgYXN5bmMgZGVzdHJveSgpIHtcbiAgICAgICAgbGV0IHJvb3QgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5fcGFyZW50KSB7XG4gICAgICAgICAgICByb290ID0gdGhpcy5fZ2V0U2FuZGJveElmcmFtZUNvbnRhaW5lcigpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fcGFyZW50LmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fc2hhZG93KSB7XG4gICAgICAgICAgICByb290ID0gdGhpcy5fZ2V0U2FuZGJveFNoYWRvd0NvbnRhaW5lcigpO1xuICAgICAgICAgICAgdGhpcy5fc2hhZG93LmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgICByb290Py5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHJvb3QpO1xuICAgIH1cbn1cbmV4cG9ydCB7IExTUGx1Z2luQ2FsbGVyIH07XG4iLCJpbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuaW1wb3J0IHsgTFNQbHVnaW5Vc2VyIH0gZnJvbSAnLi9MU1BsdWdpbi51c2VyJztcbi8vIEB0cy1pZ25vcmVcbmNvbnN0IHsgaW1wb3J0SFRNTCwgY3JlYXRlU2FuZGJveENvbnRhaW5lciB9ID0gd2luZG93LlFTYW5kYm94IHx8IHt9O1xuZnVuY3Rpb24gdXNlckZldGNoKHVybCwgb3B0cykge1xuICAgIGlmICghdXJsLnN0YXJ0c1dpdGgoJ2h0dHAnKSkge1xuICAgICAgICB1cmwgPSB1cmwucmVwbGFjZSgnZmlsZTovLycsICcnKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHdpbmRvdy5hcGlzLmRvQWN0aW9uKFsncmVhZEZpbGUnLCB1cmxdKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dCgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGZldGNoKHVybCwgb3B0cyk7XG59XG5jbGFzcyBMU1BsdWdpblNoYWRvd0ZyYW1lIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBfcGx1Z2luTG9jYWw7XG4gICAgX2ZyYW1lO1xuICAgIF9yb290O1xuICAgIF9sb2FkZWQgPSBmYWxzZTtcbiAgICBfdW5tb3VudEZucyA9IFtdO1xuICAgIGNvbnN0cnVjdG9yKF9wbHVnaW5Mb2NhbCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9wbHVnaW5Mb2NhbCA9IF9wbHVnaW5Mb2NhbDtcbiAgICAgICAgX3BsdWdpbkxvY2FsLl9kaXNwb3NlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3VubW91bnQoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIGxvYWQoKSB7XG4gICAgICAgIGNvbnN0IHsgbmFtZSwgZW50cnkgfSA9IHRoaXMuX3BsdWdpbkxvY2FsLm9wdGlvbnM7XG4gICAgICAgIGlmICh0aGlzLmxvYWRlZCB8fCAhZW50cnkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHsgdGVtcGxhdGUsIGV4ZWNTY3JpcHRzIH0gPSBhd2FpdCBpbXBvcnRIVE1MKGVudHJ5LCB7IGZldGNoOiB1c2VyRmV0Y2ggfSk7XG4gICAgICAgIHRoaXMuX21vdW50KHRlbXBsYXRlLCBkb2N1bWVudC5ib2R5KTtcbiAgICAgICAgY29uc3Qgc2FuZGJveCA9IGNyZWF0ZVNhbmRib3hDb250YWluZXIobmFtZSwge1xuICAgICAgICAgICAgZWxlbWVudEdldHRlcjogKCkgPT4gdGhpcy5fcm9vdD8uZmlyc3RDaGlsZCxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGdsb2JhbCA9IHNhbmRib3guaW5zdGFuY2UucHJveHk7XG4gICAgICAgIGdsb2JhbC5fX3NoYWRvd19tb2RlX18gPSB0cnVlO1xuICAgICAgICBnbG9iYWwuTFNQbHVnaW5Mb2NhbCA9IHRoaXMuX3BsdWdpbkxvY2FsO1xuICAgICAgICBnbG9iYWwuTFNQbHVnaW5TaGFkb3cgPSB0aGlzO1xuICAgICAgICBnbG9iYWwuTFNQbHVnaW5Vc2VyID0gZ2xvYmFsLmxvZ3NlcSA9IG5ldyBMU1BsdWdpblVzZXIodGhpcy5fcGx1Z2luTG9jYWwudG9KU09OKCksIHRoaXMuX3BsdWdpbkxvY2FsLmNhbGxlcik7XG4gICAgICAgIC8vIFRPRE86IHttb3VudCwgdW5tb3VudH1cbiAgICAgICAgY29uc3QgZXhlY1Jlc3VsdCA9IGF3YWl0IGV4ZWNTY3JpcHRzKGdsb2JhbCwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX3VubW91bnRGbnMucHVzaChleGVjUmVzdWx0LnVubW91bnQpO1xuICAgICAgICB0aGlzLl9sb2FkZWQgPSB0cnVlO1xuICAgIH1cbiAgICBfbW91bnQoY29udGVudCwgY29udGFpbmVyKSB7XG4gICAgICAgIGNvbnN0IGZyYW1lID0gdGhpcy5fZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZnJhbWUuY2xhc3NMaXN0LmFkZCgnbHNwLXNoYWRvdy1zYW5kYm94Jyk7XG4gICAgICAgIGZyYW1lLmlkID0gdGhpcy5fcGx1Z2luTG9jYWwuaWQ7XG4gICAgICAgIHRoaXMuX3Jvb3QgPSBmcmFtZS5hdHRhY2hTaGFkb3coeyBtb2RlOiAnb3BlbicgfSk7XG4gICAgICAgIHRoaXMuX3Jvb3QuaW5uZXJIVE1MID0gYDxkaXY+JHtjb250ZW50fTwvZGl2PmA7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChmcmFtZSk7XG4gICAgICAgIHRoaXMuZW1pdCgnbW91bnRlZCcpO1xuICAgIH1cbiAgICBfdW5tb3VudCgpIHtcbiAgICAgICAgZm9yIChjb25zdCBmbiBvZiB0aGlzLl91bm1vdW50Rm5zKSB7XG4gICAgICAgICAgICBmbiAmJiBmbi5jYWxsKG51bGwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMuZnJhbWU/LnBhcmVudE5vZGU/LnJlbW92ZUNoaWxkKHRoaXMuZnJhbWUpO1xuICAgIH1cbiAgICBnZXQgbG9hZGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9hZGVkO1xuICAgIH1cbiAgICBnZXQgZG9jdW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yb290Py5maXJzdENoaWxkO1xuICAgIH1cbiAgICBnZXQgZnJhbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9mcmFtZTtcbiAgICB9XG59XG5leHBvcnQgeyBMU1BsdWdpblNoYWRvd0ZyYW1lIH07XG4iLCJleHBvcnQge307XG4iLCJpbXBvcnQgeyBkZWVwTWVyZ2UsIHNhZmV0eVBhdGhKb2luIH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7IExTUGx1Z2luQ2FsbGVyIH0gZnJvbSAnLi9MU1BsdWdpbi5jYWxsZXInO1xuaW1wb3J0IERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCB7IHNuYWtlQ2FzZSB9IGZyb20gJ3NuYWtlLWNhc2UnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudGVtaXR0ZXIzJztcbmltcG9ydCB7IExTUGx1Z2luRmlsZVN0b3JhZ2UgfSBmcm9tICcuL21vZHVsZXMvTFNQbHVnaW4uU3RvcmFnZSc7XG5jb25zdCBQUk9YWV9DT05USU5VRSA9IFN5bWJvbC5mb3IoJ3Byb3h5LWNvbnRpbnVlJyk7XG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdMU1BsdWdpbjp1c2VyJyk7XG4vKipcbiAqIEBwYXJhbSB0eXBlIChrZXkgb2YgZ3JvdXAgY29tbWFuZHMpXG4gKiBAcGFyYW0gb3B0c1xuICogQHBhcmFtIGFjdGlvblxuICovXG5mdW5jdGlvbiByZWdpc3RlclNpbXBsZUNvbW1hbmQodHlwZSwgb3B0cywgYWN0aW9uKSB7XG4gICAgaWYgKHR5cGVvZiBhY3Rpb24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCB7IGtleSwgbGFiZWwsIGRlc2MsIHBhbGV0dGUgfSA9IG9wdHM7XG4gICAgY29uc3QgZXZlbnRLZXkgPSBgU2ltcGxlQ29tbWFuZEhvb2ske2tleX0keysrcmVnaXN0ZXJlZENtZFVpZH1gO1xuICAgIHRoaXMuRWRpdG9yWydvbicgKyBldmVudEtleV0oYWN0aW9uKTtcbiAgICB0aGlzLmNhbGxlcj8uY2FsbChgYXBpOmNhbGxgLCB7XG4gICAgICAgIG1ldGhvZDogJ3JlZ2lzdGVyLXBsdWdpbi1zaW1wbGUtY29tbWFuZCcsXG4gICAgICAgIGFyZ3M6IFt0aGlzLmJhc2VJbmZvLmlkLCBbeyBrZXksIGxhYmVsLCB0eXBlLCBkZXNjIH0sIFsnZWRpdG9yL2hvb2snLCBldmVudEtleV1dLCBwYWxldHRlXVxuICAgIH0pO1xufVxuY29uc3QgYXBwID0ge1xuICAgIHJlZ2lzdGVyQ29tbWFuZDogcmVnaXN0ZXJTaW1wbGVDb21tYW5kLFxuICAgIHJlZ2lzdGVyQ29tbWFuZFBhbGV0dGUob3B0cywgYWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IHsga2V5LCBsYWJlbCB9ID0gb3B0cztcbiAgICAgICAgY29uc3QgZ3JvdXAgPSAnZ2xvYmFsLXBhbGV0dGUtY29tbWFuZCc7XG4gICAgICAgIHJldHVybiByZWdpc3RlclNpbXBsZUNvbW1hbmQuY2FsbCh0aGlzLCBncm91cCwgeyBrZXksIGxhYmVsLCBwYWxldHRlOiB0cnVlIH0sIGFjdGlvbik7XG4gICAgfSxcbiAgICByZWdpc3RlclVJSXRlbSh0eXBlLCBvcHRzKSB7XG4gICAgICAgIGNvbnN0IHBpZCA9IHRoaXMuYmFzZUluZm8uaWQ7XG4gICAgICAgIC8vIG9wdHMua2V5ID0gYCR7cGlkfV8ke29wdHMua2V5fWBcbiAgICAgICAgdGhpcy5jYWxsZXI/LmNhbGwoYGFwaTpjYWxsYCwge1xuICAgICAgICAgICAgbWV0aG9kOiAncmVnaXN0ZXItcGx1Z2luLXVpLWl0ZW0nLFxuICAgICAgICAgICAgYXJnczogW3BpZCwgdHlwZSwgb3B0c11cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICByZWdpc3RlclBhZ2VNZW51SXRlbSh0YWcsIGFjdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIGFjdGlvbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGtleSA9IHRhZyArICdfJyArIHRoaXMuYmFzZUluZm8uaWQ7XG4gICAgICAgIGNvbnN0IGxhYmVsID0gdGFnO1xuICAgICAgICBjb25zdCB0eXBlID0gJ3BhZ2UtbWVudS1pdGVtJztcbiAgICAgICAgcmVnaXN0ZXJTaW1wbGVDb21tYW5kLmNhbGwodGhpcywgdHlwZSwge1xuICAgICAgICAgICAga2V5LCBsYWJlbFxuICAgICAgICB9LCBhY3Rpb24pO1xuICAgIH0sXG4gICAgc2V0RnVsbFNjcmVlbihmbGFnKSB7XG4gICAgICAgIGNvbnN0IHNmID0gKC4uLmFyZ3MpID0+IHRoaXMuX2NhbGxXaW4oJ3NldEZ1bGxTY3JlZW4nLCAuLi5hcmdzKTtcbiAgICAgICAgaWYgKGZsYWcgPT09ICd0b2dnbGUnKSB7XG4gICAgICAgICAgICB0aGlzLl9jYWxsV2luKCdpc0Z1bGxTY3JlZW4nKS50aGVuKHIgPT4ge1xuICAgICAgICAgICAgICAgIHIgPyBzZigpIDogc2YodHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZsYWcgPyBzZih0cnVlKSA6IHNmKCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xubGV0IHJlZ2lzdGVyZWRDbWRVaWQgPSAwO1xuY29uc3QgZWRpdG9yID0ge1xuICAgIHJlZ2lzdGVyU2xhc2hDb21tYW5kKHRhZywgYWN0aW9ucykge1xuICAgICAgICBkZWJ1ZygnUmVnaXN0ZXIgc2xhc2ggY29tbWFuZCAjJywgdGhpcy5iYXNlSW5mby5pZCwgdGFnLCBhY3Rpb25zKTtcbiAgICAgICAgaWYgKHR5cGVvZiBhY3Rpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBhY3Rpb25zID0gW1xuICAgICAgICAgICAgICAgIFsnZWRpdG9yL2NsZWFyLWN1cnJlbnQtc2xhc2gnLCBmYWxzZV0sXG4gICAgICAgICAgICAgICAgWydlZGl0b3IvcmVzdG9yZS1zYXZlZC1jdXJzb3InXSxcbiAgICAgICAgICAgICAgICBbJ2VkaXRvci9ob29rJywgYWN0aW9uc11cbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgYWN0aW9ucyA9IGFjdGlvbnMubWFwKChpdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgW3RhZywgLi4uYXJnc10gPSBpdDtcbiAgICAgICAgICAgIHN3aXRjaCAodGFnKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnZWRpdG9yL2hvb2snOlxuICAgICAgICAgICAgICAgICAgICBsZXQga2V5ID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZuID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWxsZXI/LmNhbGxVc2VyTW9kZWwoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuID0ga2V5O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50S2V5ID0gYFNsYXNoQ29tbWFuZEhvb2ske3RhZ30keysrcmVnaXN0ZXJlZENtZFVpZH1gO1xuICAgICAgICAgICAgICAgICAgICBpdFsxXSA9IGV2ZW50S2V5O1xuICAgICAgICAgICAgICAgICAgICAvLyByZWdpc3RlciBjb21tYW5kIGxpc3RlbmVyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuRWRpdG9yWydvbicgKyBldmVudEtleV0oZm4pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGl0O1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jYWxsZXI/LmNhbGwoYGFwaTpjYWxsYCwge1xuICAgICAgICAgICAgbWV0aG9kOiAncmVnaXN0ZXItcGx1Z2luLXNsYXNoLWNvbW1hbmQnLFxuICAgICAgICAgICAgYXJnczogW3RoaXMuYmFzZUluZm8uaWQsIFt0YWcsIGFjdGlvbnNdXVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHJlZ2lzdGVyQmxvY2tDb250ZXh0TWVudUl0ZW0odGFnLCBhY3Rpb24pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhY3Rpb24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBrZXkgPSB0YWcgKyAnXycgKyB0aGlzLmJhc2VJbmZvLmlkO1xuICAgICAgICBjb25zdCBsYWJlbCA9IHRhZztcbiAgICAgICAgY29uc3QgdHlwZSA9ICdibG9jay1jb250ZXh0LW1lbnUtaXRlbSc7XG4gICAgICAgIHJlZ2lzdGVyU2ltcGxlQ29tbWFuZC5jYWxsKHRoaXMsIHR5cGUsIHtcbiAgICAgICAgICAgIGtleSwgbGFiZWxcbiAgICAgICAgfSwgYWN0aW9uKTtcbiAgICB9LFxuICAgIHNjcm9sbFRvQmxvY2tJblBhZ2UocGFnZU5hbWUsIGJsb2NrSWQpIHtcbiAgICAgICAgY29uc3QgYW5jaG9yID0gYGJsb2NrLWNvbnRlbnQtYCArIGJsb2NrSWQ7XG4gICAgICAgIHRoaXMuQXBwLnB1c2hTdGF0ZSgncGFnZScsIHsgbmFtZTogcGFnZU5hbWUgfSwgeyBhbmNob3IgfSk7XG4gICAgfVxufTtcbmNvbnN0IGRiID0ge307XG5jb25zdCBLRVlfTUFJTl9VSSA9IDA7XG4vKipcbiAqIFVzZXIgcGx1Z2luIGluc3RhbmNlXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBjbGFzcyBMU1BsdWdpblVzZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIF9iYXNlSW5mbztcbiAgICBfY2FsbGVyO1xuICAgIC8qKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgIC8qKlxuICAgICAqIHVpIGZyYW1lIGlkZW50aXRpZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF91aSA9IG5ldyBNYXAoKTtcbiAgICBfZmlsZVN0b3JhZ2U7XG4gICAgLyoqXG4gICAgICogaGFuZGxlciBvZiBiZWZvcmUgdW5sb2FkIHBsdWdpblxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2JlZm9yZXVubG9hZENhbGxiYWNrO1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSBfYmFzZUluZm9cbiAgICAgKiBAcGFyYW0gX2NhbGxlclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKF9iYXNlSW5mbywgX2NhbGxlcikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9iYXNlSW5mbyA9IF9iYXNlSW5mbztcbiAgICAgICAgdGhpcy5fY2FsbGVyID0gX2NhbGxlcjtcbiAgICAgICAgX2NhbGxlci5vbignc3lzOnVpOnZpc2libGUnLCAocGF5bG9hZCkgPT4ge1xuICAgICAgICAgICAgaWYgKHBheWxvYWQ/LnRvZ2dsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlTWFpblVJKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBfY2FsbGVyLm9uKCdzZXR0aW5nczpjaGFuZ2VkJywgKHBheWxvYWQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGIgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLnNldHRpbmdzKTtcbiAgICAgICAgICAgIGNvbnN0IGEgPSBPYmplY3QuYXNzaWduKHRoaXMuX2Jhc2VJbmZvLnNldHRpbmdzLCBwYXlsb2FkKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnc2V0dGluZ3M6Y2hhbmdlZCcsIHsgLi4uYSB9LCBiKTtcbiAgICAgICAgfSk7XG4gICAgICAgIF9jYWxsZXIub24oJ2JlZm9yZXVubG9hZCcsIGFzeW5jIChwYXlsb2FkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IGFjdG9yLCAuLi5yZXN0IH0gPSBwYXlsb2FkO1xuICAgICAgICAgICAgY29uc3QgY2IgPSB0aGlzLl9iZWZvcmV1bmxvYWRDYWxsYmFjaztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2IgJiYgYXdhaXQgY2IocmVzdCk7XG4gICAgICAgICAgICAgICAgYWN0b3I/LnJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYCR7X2NhbGxlci5kZWJ1Z1RhZ30gW2JlZm9yZXVubG9hZF0gYCwgZSk7XG4gICAgICAgICAgICAgICAgYWN0b3I/LnJlamVjdChlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIG1vZHVsZXNcbiAgICAgICAgdGhpcy5fZmlsZVN0b3JhZ2UgPSBuZXcgTFNQbHVnaW5GaWxlU3RvcmFnZSh0aGlzKTtcbiAgICB9XG4gICAgYXN5bmMgcmVhZHkobW9kZWwsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0aGlzLl9jb25uZWN0ZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1vZGVsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBtb2RlbDtcbiAgICAgICAgICAgICAgICBtb2RlbCA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGJhc2VJbmZvID0gYXdhaXQgdGhpcy5fY2FsbGVyLmNvbm5lY3RUb1BhcmVudChtb2RlbCk7XG4gICAgICAgICAgICBiYXNlSW5mbyA9IGRlZXBNZXJnZSh0aGlzLl9iYXNlSW5mbywgYmFzZUluZm8pO1xuICAgICAgICAgICAgdGhpcy5fY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChiYXNlSW5mbz8uaWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYWxsZXIuZGVidWdUYWcgPSBgIyR7YmFzZUluZm8uaWR9IFske2Jhc2VJbmZvLm5hbWV9XWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjay5jYWxsKHRoaXMsIGJhc2VJbmZvKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0xTUGx1Z2luIFJlYWR5IEVycm9yXScsIGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVuc3VyZUNvbm5lY3RlZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGNvbm5lY3RlZCcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGJlZm9yZXVubG9hZChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLl9iZWZvcmV1bmxvYWRDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIH1cbiAgICBwcm92aWRlTW9kZWwobW9kZWwpIHtcbiAgICAgICAgdGhpcy5jYWxsZXIuX2V4dGVuZFVzZXJNb2RlbChtb2RlbCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBwcm92aWRlVGhlbWUodGhlbWUpIHtcbiAgICAgICAgdGhpcy5jYWxsZXIuY2FsbCgncHJvdmlkZXI6dGhlbWUnLCB0aGVtZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBwcm92aWRlU3R5bGUoc3R5bGUpIHtcbiAgICAgICAgdGhpcy5jYWxsZXIuY2FsbCgncHJvdmlkZXI6c3R5bGUnLCBzdHlsZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBwcm92aWRlVUkodWkpIHtcbiAgICAgICAgdGhpcy5jYWxsZXIuY2FsbCgncHJvdmlkZXI6dWknLCB1aSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB1cGRhdGVTZXR0aW5ncyhhdHRycykge1xuICAgICAgICB0aGlzLmNhbGxlci5jYWxsKCdzZXR0aW5nczp1cGRhdGUnLCBhdHRycyk7XG4gICAgICAgIC8vIFRPRE86IHVwZGF0ZSBhc3NvY2lhdGVkIGJhc2VJbmZvIHNldHRpbmdzXG4gICAgfVxuICAgIHNldE1haW5VSUF0dHJzKGF0dHJzKSB7XG4gICAgICAgIHRoaXMuY2FsbGVyLmNhbGwoJ21haW4tdWk6YXR0cnMnLCBhdHRycyk7XG4gICAgfVxuICAgIHNldE1haW5VSUlubGluZVN0eWxlKHN0eWxlKSB7XG4gICAgICAgIHRoaXMuY2FsbGVyLmNhbGwoJ21haW4tdWk6c3R5bGUnLCBzdHlsZSk7XG4gICAgfVxuICAgIGhpZGVNYWluVUkob3B0cykge1xuICAgICAgICBjb25zdCBwYXlsb2FkID0geyBrZXk6IEtFWV9NQUlOX1VJLCB2aXNpYmxlOiBmYWxzZSwgY3Vyc29yOiBvcHRzPy5yZXN0b3JlRWRpdGluZ0N1cnNvciB9O1xuICAgICAgICB0aGlzLmNhbGxlci5jYWxsKCdtYWluLXVpOnZpc2libGUnLCBwYXlsb2FkKTtcbiAgICAgICAgdGhpcy5lbWl0KCd1aTp2aXNpYmxlOmNoYW5nZWQnLCBwYXlsb2FkKTtcbiAgICAgICAgdGhpcy5fdWkuc2V0KHBheWxvYWQua2V5LCBwYXlsb2FkKTtcbiAgICB9XG4gICAgc2hvd01haW5VSSgpIHtcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IHsga2V5OiBLRVlfTUFJTl9VSSwgdmlzaWJsZTogdHJ1ZSB9O1xuICAgICAgICB0aGlzLmNhbGxlci5jYWxsKCdtYWluLXVpOnZpc2libGUnLCBwYXlsb2FkKTtcbiAgICAgICAgdGhpcy5lbWl0KCd1aTp2aXNpYmxlOmNoYW5nZWQnLCBwYXlsb2FkKTtcbiAgICAgICAgdGhpcy5fdWkuc2V0KHBheWxvYWQua2V5LCBwYXlsb2FkKTtcbiAgICB9XG4gICAgdG9nZ2xlTWFpblVJKCkge1xuICAgICAgICBjb25zdCBwYXlsb2FkID0geyBrZXk6IEtFWV9NQUlOX1VJLCB0b2dnbGU6IHRydWUgfTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLl91aS5nZXQocGF5bG9hZC5rZXkpO1xuICAgICAgICBpZiAoc3RhdGUgJiYgc3RhdGUudmlzaWJsZSkge1xuICAgICAgICAgICAgdGhpcy5oaWRlTWFpblVJKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNob3dNYWluVUkoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgaXNNYWluVUlWaXNpYmxlKCkge1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuX3VpLmdldChLRVlfTUFJTl9VSSk7XG4gICAgICAgIHJldHVybiBCb29sZWFuKHN0YXRlICYmIHN0YXRlLnZpc2libGUpO1xuICAgIH1cbiAgICBnZXQgY29ubmVjdGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29ubmVjdGVkO1xuICAgIH1cbiAgICBnZXQgYmFzZUluZm8oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9iYXNlSW5mbztcbiAgICB9XG4gICAgZ2V0IHNldHRpbmdzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5iYXNlSW5mbz8uc2V0dGluZ3M7XG4gICAgfVxuICAgIGdldCBjYWxsZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jYWxsZXI7XG4gICAgfVxuICAgIHJlc29sdmVSZXNvdXJjZUZ1bGxVcmwoZmlsZVBhdGgpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVDb25uZWN0ZWQoKTtcbiAgICAgICAgaWYgKCFmaWxlUGF0aClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgZmlsZVBhdGggPSBmaWxlUGF0aC5yZXBsYWNlKC9eWy5cXFxcL10rLywgJycpO1xuICAgICAgICByZXR1cm4gc2FmZXR5UGF0aEpvaW4odGhpcy5fYmFzZUluZm8ubHNyLCBmaWxlUGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqL1xuICAgIF9tYWtlVXNlclByb3h5KHRhcmdldCwgdGFnKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgICAgICBjb25zdCBjYWxsZXIgPSB0aGlzLmNhbGxlcjtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm94eSh0YXJnZXQsIHtcbiAgICAgICAgICAgIGdldCh0YXJnZXQsIHByb3BLZXksIHJlY2VpdmVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3JpZ01ldGhvZCA9IHRhcmdldFtwcm9wS2V5XTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9yaWdNZXRob2QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJldCA9IG9yaWdNZXRob2QuYXBwbHkodGhhdCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmV0ICE9PSBQUk9YWV9DT05USU5VRSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gSGFuZGxlIGhvb2tcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaG9va01hdGNoZXIgPSBwcm9wS2V5LnRvU3RyaW5nKCkubWF0Y2goL14ob25jZXxvZmZ8b24pL2kpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhvb2tNYXRjaGVyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmID0gaG9va01hdGNoZXJbMF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gaG9va01hdGNoZXIuaW5wdXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZSA9IHMuc2xpY2UoZi5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBgaG9vazoke3RhZ306JHtzbmFrZUNhc2UoZSl9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsZXJbZl0odHlwZSwgaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGYgIT09ICdvZmYnID8gKCkgPT4gKGNhbGxlci5vZmYodHlwZSwgaGFuZGxlcikpIDogdm9pZCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIENhbGwgaG9zdFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGVyLmNhbGxBc3luYyhgYXBpOmNhbGxgLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWcsIG1ldGhvZDogcHJvcEtleSwgYXJnczogYXJnc1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHBhcmFtIGFyZ3NcbiAgICAgKi9cbiAgICBfY2FsbFdpbiguLi5hcmdzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jYWxsZXIuY2FsbEFzeW5jKGBhcGk6Y2FsbGAsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ19jYWxsTWFpbldpbicsXG4gICAgICAgICAgICBhcmdzOiBhcmdzXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUaGUgaW50ZXJmYWNlIG1ldGhvZHMgb2Yge0BsaW5rIElBcHBQcm94eX1cbiAgICAgKi9cbiAgICBnZXQgQXBwKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFrZVVzZXJQcm94eShhcHAsICdhcHAnKTtcbiAgICB9XG4gICAgZ2V0IEVkaXRvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21ha2VVc2VyUHJveHkoZWRpdG9yLCAnZWRpdG9yJyk7XG4gICAgfVxuICAgIGdldCBEQigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21ha2VVc2VyUHJveHkoZGIpO1xuICAgIH1cbiAgICBnZXQgRmlsZVN0b3JhZ2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maWxlU3RvcmFnZTtcbiAgICB9XG59XG5leHBvcnQgKiBmcm9tICcuL0xTUGx1Z2luJztcbi8qKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXR1cFBsdWdpblVzZXJJbnN0YW5jZShwbHVnaW5CYXNlSW5mbywgcGx1Z2luQ2FsbGVyKSB7XG4gICAgcmV0dXJuIG5ldyBMU1BsdWdpblVzZXIocGx1Z2luQmFzZUluZm8sIHBsdWdpbkNhbGxlcik7XG59XG5pZiAod2luZG93Ll9fTFNQX19IT1NUX18gPT0gbnVsbCkgeyAvLyBFbnRyeSBvZiBpZnJhbWUgbW9kZVxuICAgIGNvbnN0IGNhbGxlciA9IG5ldyBMU1BsdWdpbkNhbGxlcihudWxsKTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgd2luZG93LmxvZ3NlcSA9IHNldHVwUGx1Z2luVXNlckluc3RhbmNlKHt9LCBjYWxsZXIpO1xufVxuIiwiaW1wb3J0IHsgc25ha2VDYXNlIH0gZnJvbSAnc25ha2UtY2FzZSc7XG5pbXBvcnQgKiBhcyBub2RlUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBET01QdXJpZnkgZnJvbSAnZG9tcHVyaWZ5JztcbmV4cG9ydCBjb25zdCBwYXRoID0gbmF2aWdhdG9yLnBsYXRmb3JtLnRvTG93ZXJDYXNlKCkgPT09ICd3aW4zMicgPyBub2RlUGF0aC53aW4zMiA6IG5vZGVQYXRoLnBvc2l4O1xuZXhwb3J0IGNvbnN0IElTX0RFViA9IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnO1xuZXhwb3J0IGNvbnN0IFBST1RPQ09MX0ZJTEUgPSAnZmlsZTovLyc7XG5leHBvcnQgY29uc3QgUFJPVE9DT0xfTFNQID0gJ2xzcDovLyc7XG5leHBvcnQgY29uc3QgVVJMX0xTUCA9IFBST1RPQ09MX0xTUCArICdsb2dzZXEuaW8vJztcbmxldCBfYXBwUGF0aFJvb3Q7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QXBwUGF0aFJvb3QoKSB7XG4gICAgaWYgKF9hcHBQYXRoUm9vdCkge1xuICAgICAgICByZXR1cm4gX2FwcFBhdGhSb290O1xuICAgIH1cbiAgICByZXR1cm4gKF9hcHBQYXRoUm9vdCA9XG4gICAgICAgIGF3YWl0IGludm9rZUhvc3RFeHBvcnRlZEFwaSgnX2NhbGxBcHBsaWNhdGlvbicsICdnZXRBcHBQYXRoJykpO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNES1BhdGhSb290KCkge1xuICAgIGlmIChJU19ERVYpIHtcbiAgICAgICAgLy8gVE9ETzogY2FjaGUgaW4gcHJlZmVyZW5jZSBmaWxlXG4gICAgICAgIHJldHVybiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnTFNQX0RFVl9TREtfUk9PVCcpIHx8ICdodHRwOi8vbG9jYWxob3N0OjgwODAnO1xuICAgIH1cbiAgICBjb25zdCBhcHBQYXRoUm9vdCA9IGF3YWl0IGdldEFwcFBhdGhSb290KCk7XG4gICAgcmV0dXJuIHNhZmV0eVBhdGhKb2luKGFwcFBhdGhSb290LCAnanMnKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc09iamVjdChpdGVtKSB7XG4gICAgcmV0dXJuIChpdGVtID09PSBPYmplY3QoaXRlbSkgJiYgIUFycmF5LmlzQXJyYXkoaXRlbSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGRlZXBNZXJnZSh0YXJnZXQsIC4uLnNvdXJjZXMpIHtcbiAgICAvLyByZXR1cm4gdGhlIHRhcmdldCBpZiBubyBzb3VyY2VzIHBhc3NlZFxuICAgIGlmICghc291cmNlcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gdGFyZ2V0O1xuICAgIGlmIChpc09iamVjdChyZXN1bHQpKSB7XG4gICAgICAgIGNvbnN0IGxlbiA9IHNvdXJjZXMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBlbG0gPSBzb3VyY2VzW2ldO1xuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KGVsbSkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBlbG0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsbS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNPYmplY3QoZWxtW2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXN1bHRba2V5XSB8fCAhaXNPYmplY3QocmVzdWx0W2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZXBNZXJnZShyZXN1bHRba2V5XSwgZWxtW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0W2tleV0pICYmIEFycmF5LmlzQXJyYXkoZWxtW2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbmNhdGVuYXRlIHRoZSB0d28gYXJyYXlzIGFuZCByZW1vdmUgYW55IGR1cGxpY2F0ZSBwcmltaXRpdmUgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gQXJyYXkuZnJvbShuZXcgU2V0KHJlc3VsdFtrZXldLmNvbmNhdChlbG1ba2V5XSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtrZXldID0gZWxtW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2VuSUQoKSB7XG4gICAgLy8gTWF0aC5yYW5kb20gc2hvdWxkIGJlIHVuaXF1ZSBiZWNhdXNlIG9mIGl0cyBzZWVkaW5nIGFsZ29yaXRobS5cbiAgICAvLyBDb252ZXJ0IGl0IHRvIGJhc2UgMzYgKG51bWJlcnMgKyBsZXR0ZXJzKSwgYW5kIGdyYWIgdGhlIGZpcnN0IDkgY2hhcmFjdGVyc1xuICAgIC8vIGFmdGVyIHRoZSBkZWNpbWFsLlxuICAgIHJldHVybiAnXycgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgOSk7XG59XG5leHBvcnQgZnVuY3Rpb24gdWNGaXJzdChzdHIpIHtcbiAgICByZXR1cm4gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyLnNsaWNlKDEpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHdpdGhGaWxlUHJvdG9jb2wocGF0aCkge1xuICAgIGlmICghcGF0aClcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIGNvbnN0IHJlZyA9IC9eKGh0dHB8ZmlsZXxsc3ApLztcbiAgICBpZiAoIXJlZy50ZXN0KHBhdGgpKSB7XG4gICAgICAgIHBhdGggPSBQUk9UT0NPTF9GSUxFICsgcGF0aDtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGg7XG59XG5leHBvcnQgZnVuY3Rpb24gc2FmZXR5UGF0aEpvaW4oYmFzZVBhdGgsIC4uLnBhcnRzKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChiYXNlUGF0aCk7XG4gICAgICAgIGlmICghdXJsLm9yaWdpbilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihudWxsKTtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oYmFzZVBhdGguc3Vic3RyKHVybC5vcmlnaW4ubGVuZ3RoKSwgLi4ucGFydHMpO1xuICAgICAgICByZXR1cm4gdXJsLm9yaWdpbiArIGZ1bGxQYXRoO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gcGF0aC5qb2luKGJhc2VQYXRoLCAuLi5wYXJ0cyk7XG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIHNhZmV0eVBhdGhOb3JtYWxpemUoYmFzZVBhdGgpIHtcbiAgICBpZiAoIWJhc2VQYXRoPy5tYXRjaCgvXihodHRwP3xsc3B8YXNzZXRzKTovKSkge1xuICAgICAgICBiYXNlUGF0aCA9IHBhdGgubm9ybWFsaXplKGJhc2VQYXRoKTtcbiAgICB9XG4gICAgcmV0dXJuIGJhc2VQYXRoO1xufVxuLyoqXG4gKiBAcGFyYW0gdGltZW91dCBtaWxsaXNlY29uZHNcbiAqIEBwYXJhbSB0YWcgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWZlcnJlZCh0aW1lb3V0LCB0YWcpIHtcbiAgICBsZXQgcmVzb2x2ZSwgcmVqZWN0O1xuICAgIGxldCBzZXR0bGVkID0gZmFsc2U7XG4gICAgY29uc3QgdGltZUZuID0gKHIpID0+IHtcbiAgICAgICAgcmV0dXJuICh2KSA9PiB7XG4gICAgICAgICAgICB0aW1lb3V0ICYmIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICAgIHIodik7XG4gICAgICAgICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZTEsIHJlamVjdDEpID0+IHtcbiAgICAgICAgcmVzb2x2ZSA9IHRpbWVGbihyZXNvbHZlMSk7XG4gICAgICAgIHJlamVjdCA9IHRpbWVGbihyZWplY3QxKTtcbiAgICAgICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IoYFtkZWZlcnJlZCB0aW1lb3V0XSAke3RhZ31gKSksIHRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3JlYXRlZDogRGF0ZS5ub3coKSxcbiAgICAgICAgc2V0VGFnOiAodCkgPT4gdGFnID0gdCxcbiAgICAgICAgcmVzb2x2ZSwgcmVqZWN0LCBwcm9taXNlLFxuICAgICAgICBnZXQgc2V0dGxlZCgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZXR0bGVkO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpbnZva2VIb3N0RXhwb3J0ZWRBcGkobWV0aG9kLCAuLi5hcmdzKSB7XG4gICAgbWV0aG9kID0gbWV0aG9kPy5zdGFydHNXaXRoKCdfY2FsbCcpID8gbWV0aG9kIDpcbiAgICAgICAgbWV0aG9kPy5yZXBsYWNlKC9eW18kXSsvLCAnJyk7XG4gICAgY29uc3QgbWV0aG9kMSA9IHNuYWtlQ2FzZShtZXRob2QpO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBsb2dzZXFIb3N0RXhwb3J0ZWRBcGkgPSB3aW5kb3cubG9nc2VxPy5hcGkgfHwge307XG4gICAgY29uc3QgZm4gPSBsb2dzZXFIb3N0RXhwb3J0ZWRBcGlbbWV0aG9kMV0gfHwgd2luZG93LmFwaXNbbWV0aG9kMV0gfHxcbiAgICAgICAgbG9nc2VxSG9zdEV4cG9ydGVkQXBpW21ldGhvZF0gfHwgd2luZG93LmFwaXNbbWV0aG9kXTtcbiAgICBpZiAoIWZuKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm90IGV4aXN0ZWQgbWV0aG9kICMke21ldGhvZH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJyA/IGZuIDogZm4uYXBwbHkobnVsbCwgYXJncyk7XG59XG5leHBvcnQgZnVuY3Rpb24gc2V0dXBJZnJhbWVTYW5kYm94KHByb3BzLCB0YXJnZXQpIHtcbiAgICBjb25zdCBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICBpZnJhbWUuY2xhc3NMaXN0LmFkZCgnbHNwLWlmcmFtZS1zYW5kYm94Jyk7XG4gICAgT2JqZWN0LmVudHJpZXMocHJvcHMpLmZvckVhY2goKFtrLCB2XSkgPT4ge1xuICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKGssIHYpO1xuICAgIH0pO1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgIHJldHVybiBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRhcmdldC5yZW1vdmVDaGlsZChpZnJhbWUpO1xuICAgIH07XG59XG5leHBvcnQgZnVuY3Rpb24gc2V0dXBJbmplY3RlZFN0eWxlKHN0eWxlLCBhdHRycykge1xuICAgIGNvbnN0IGtleSA9IGF0dHJzWydkYXRhLWluamVjdGVkLXN0eWxlJ107XG4gICAgbGV0IGVsID0ga2V5ICYmIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWluamVjdGVkLXN0eWxlPSR7a2V5fV1gKTtcbiAgICBpZiAoZWwpIHtcbiAgICAgICAgZWwudGV4dENvbnRlbnQgPSBzdHlsZTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgZWwudGV4dENvbnRlbnQgPSBzdHlsZTtcbiAgICBhdHRycyAmJiBPYmplY3QuZW50cmllcyhhdHRycykuZm9yRWFjaCgoW2ssIHZdKSA9PiB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShrLCB2KTtcbiAgICB9KTtcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZChlbCk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZG9jdW1lbnQuaGVhZC5yZW1vdmVDaGlsZChlbCk7XG4gICAgfTtcbn1cbmNvbnN0IGluamVjdGVkVUlFZmZlY3RzID0gbmV3IE1hcCgpO1xuZXhwb3J0IGZ1bmN0aW9uIHNldHVwSW5qZWN0ZWRVSSh1aSwgYXR0cnMsIGluaXRpYWxDYWxsYmFjaykge1xuICAgIGxldCBzbG90ID0gJyc7XG4gICAgbGV0IHNlbGVjdG9yO1xuICAgIGxldCBmbG9hdDtcbiAgICBjb25zdCBwbCA9IHRoaXM7XG4gICAgaWYgKCdzbG90JyBpbiB1aSkge1xuICAgICAgICBzbG90ID0gdWkuc2xvdDtcbiAgICAgICAgc2VsZWN0b3IgPSBgIyR7c2xvdH1gO1xuICAgIH1cbiAgICBlbHNlIGlmICgncGF0aCcgaW4gdWkpIHtcbiAgICAgICAgc2VsZWN0b3IgPSB1aS5wYXRoO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZmxvYXQgPSB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBpZCA9IGAke3VpLmtleX0tJHtzbG90fS0ke3BsLmlkfWA7XG4gICAgY29uc3Qga2V5ID0gYCR7dWkua2V5fS0tJHtwbC5pZH1gO1xuICAgIGNvbnN0IHRhcmdldCA9IGZsb2F0ID8gZG9jdW1lbnQuYm9keSA6IChzZWxlY3RvciAmJiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKSk7XG4gICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGAke3RoaXMuZGVidWdUYWd9IGNhbiBub3QgcmVzb2x2ZSBzZWxlY3RvciB0YXJnZXQgJHtzZWxlY3Rvcn1gKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodWkudGVtcGxhdGUpIHtcbiAgICAgICAgLy8gc2FmZSB0ZW1wbGF0ZVxuICAgICAgICB1aS50ZW1wbGF0ZSA9IERPTVB1cmlmeS5zYW5pdGl6ZSh1aS50ZW1wbGF0ZSwge1xuICAgICAgICAgICAgQUREX1RBR1M6IFsnaWZyYW1lJ10sXG4gICAgICAgICAgICBBTExPV19VTktOT1dOX1BST1RPQ09MUzogdHJ1ZSxcbiAgICAgICAgICAgIEFERF9BVFRSOiBbJ2FsbG93JywgJ3NyYycsICdhbGxvd2Z1bGxzY3JlZW4nLCAnZnJhbWVib3JkZXInLCAnc2Nyb2xsaW5nJ11cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgeyAvLyByZW1vdmUgdWlcbiAgICAgICAgaW5qZWN0ZWRVSUVmZmVjdHMuZ2V0KGlkKT8uY2FsbChudWxsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjJHtpZH1gKTtcbiAgICBsZXQgY29udGVudCA9IGZsb2F0ID8gZWw/LnF1ZXJ5U2VsZWN0b3IoJy5scy11aS1mbG9hdC1jb250ZW50JykgOiBlbDtcbiAgICBpZiAoY29udGVudCkge1xuICAgICAgICBjb250ZW50LmlubmVySFRNTCA9IHVpLnRlbXBsYXRlO1xuICAgICAgICAvLyB1cGRhdGUgYXR0cmlidXRlc1xuICAgICAgICBhdHRycyAmJiBPYmplY3QuZW50cmllcyhhdHRycykuZm9yRWFjaCgoW2ssIHZdKSA9PiB7XG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoaywgdik7XG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgcG9zaXRpb25EaXJ0eSA9IGVsLmRhdGFzZXQuZHggIT0gbnVsbDtcbiAgICAgICAgdWkuc3R5bGUgJiYgT2JqZWN0LmVudHJpZXModWkuc3R5bGUpLmZvckVhY2goKFtrLCB2XSkgPT4ge1xuICAgICAgICAgICAgaWYgKHBvc2l0aW9uRGlydHkgJiYgW1xuICAgICAgICAgICAgICAgICdsZWZ0JywgJ3RvcCcsICdib3R0b20nLCAncmlnaHQnLCAnd2lkdGgnLCAnaGVpZ2h0J1xuICAgICAgICAgICAgXS5pbmNsdWRlcyhrKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsLnN0eWxlW2tdID0gdjtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbC5pZCA9IGlkO1xuICAgIGVsLmRhdGFzZXQuaW5qZWN0ZWRVaSA9IGtleSB8fCAnJztcbiAgICBpZiAoZmxvYXQpIHtcbiAgICAgICAgY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjb250ZW50LmNsYXNzTGlzdC5hZGQoJ2xzLXVpLWZsb2F0LWNvbnRlbnQnKTtcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoY29udGVudCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb250ZW50ID0gZWw7XG4gICAgfVxuICAgIC8vIFRPRE86IGVuaGFuY2UgdGVtcGxhdGVcbiAgICBjb250ZW50LmlubmVySFRNTCA9IHVpLnRlbXBsYXRlO1xuICAgIGF0dHJzICYmIE9iamVjdC5lbnRyaWVzKGF0dHJzKS5mb3JFYWNoKChbaywgdl0pID0+IHtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKGssIHYpO1xuICAgIH0pO1xuICAgIHVpLnN0eWxlICYmIE9iamVjdC5lbnRyaWVzKHVpLnN0eWxlKS5mb3JFYWNoKChbaywgdl0pID0+IHtcbiAgICAgICAgZWwuc3R5bGVba10gPSB2O1xuICAgIH0pO1xuICAgIGxldCB0ZWFyZG93blVJO1xuICAgIGxldCBkaXNwb3NlRmxvYXQ7XG4gICAgaWYgKGZsb2F0KSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnZHJhZ2dhYmxlJywgJ3RydWUnKTtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKCdyZXNpemFibGUnLCAndHJ1ZScpO1xuICAgICAgICB1aS5jbG9zZSAmJiAoZWwuZGF0YXNldC5jbG9zZSA9IHVpLmNsb3NlKTtcbiAgICAgICAgZWwuY2xhc3NMaXN0LmFkZCgnbHNwLXVpLWZsb2F0LWNvbnRhaW5lcicsICd2aXNpYmxlJyk7XG4gICAgICAgIGRpc3Bvc2VGbG9hdCA9IChwbC5fc2V0dXBSZXNpemFibGVDb250YWluZXIoZWwsIGtleSksXG4gICAgICAgICAgICBwbC5fc2V0dXBEcmFnZ2FibGVDb250YWluZXIoZWwsIHsga2V5LCBjbG9zZTogKCkgPT4gdGVhcmRvd25VSSgpLCB0aXRsZTogYXR0cnM/LnRpdGxlIH0pKTtcbiAgICB9XG4gICAgaWYgKCEhc2xvdCAmJiB1aS5yZXNldCkge1xuICAgICAgICBjb25zdCBleGlzdHMgPSBBcnJheS5mcm9tKHRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1pbmplY3RlZC11aV0nKSlcbiAgICAgICAgICAgIC5tYXAoKGl0KSA9PiBpdC5pZCk7XG4gICAgICAgIGV4aXN0cz8uZm9yRWFjaCgoZXhpc3QpID0+IHtcbiAgICAgICAgICAgIGluamVjdGVkVUlFZmZlY3RzLmdldChleGlzdCk/LmNhbGwobnVsbCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoZWwpO1xuICAgIC8vIFRPRE86IEhvdyBoYW5kbGUgZXZlbnRzXG4gICAgWydjbGljaycsICdmb2N1cycsICdmb2N1c2luJywgJ2ZvY3Vzb3V0JywgJ2JsdXInLCAnZGJsY2xpY2snLFxuICAgICAgICAna2V5dXAnLCAna2V5cHJlc3MnLCAna2V5ZG93bicsICdjaGFuZ2UnLCAnaW5wdXQnXS5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICAgICAgY29uc3QgdHJpZ2dlciA9IHRhcmdldC5jbG9zZXN0KGBbZGF0YS1vbi0ke3R5cGV9XWApO1xuICAgICAgICAgICAgaWYgKCF0cmlnZ2VyKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IG1zZ1R5cGUgPSB0cmlnZ2VyLmRhdGFzZXRbYG9uJHt1Y0ZpcnN0KHR5cGUpfWBdO1xuICAgICAgICAgICAgbXNnVHlwZSAmJiBwbC5jYWxsZXI/LmNhbGxVc2VyTW9kZWwobXNnVHlwZSwgdHJhbnNmb3JtYWJsZUV2ZW50KHRyaWdnZXIsIGUpKTtcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgIH0pO1xuICAgIC8vIGNhbGxiYWNrXG4gICAgaW5pdGlhbENhbGxiYWNrPy4oeyBlbCwgZmxvYXQgfSk7XG4gICAgdGVhcmRvd25VSSA9ICgpID0+IHtcbiAgICAgICAgZGlzcG9zZUZsb2F0Py4oKTtcbiAgICAgICAgaW5qZWN0ZWRVSUVmZmVjdHMuZGVsZXRlKGlkKTtcbiAgICAgICAgdGFyZ2V0LnJlbW92ZUNoaWxkKGVsKTtcbiAgICB9O1xuICAgIGluamVjdGVkVUlFZmZlY3RzLnNldChpZCwgdGVhcmRvd25VSSk7XG4gICAgcmV0dXJuIHRlYXJkb3duVUk7XG59XG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtYWJsZUV2ZW50KHRhcmdldCwgZSkge1xuICAgIGNvbnN0IG9iaiA9IHt9O1xuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgY29uc3QgZHMgPSB0YXJnZXQuZGF0YXNldDtcbiAgICAgICAgY29uc3QgRkxBR19SRUNUID0gJ3JlY3QnO1xuICAgICAgICBbJ3ZhbHVlJywgJ2lkJywgJ2NsYXNzTmFtZScsXG4gICAgICAgICAgICAnZGF0YXNldCcsIEZMQUdfUkVDVFxuICAgICAgICBdLmZvckVhY2goKGspID0+IHtcbiAgICAgICAgICAgIGxldCB2O1xuICAgICAgICAgICAgc3dpdGNoIChrKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBGTEFHX1JFQ1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICghZHMuaGFzT3duUHJvcGVydHkoRkxBR19SRUNUKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgdiA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b0pTT04oKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgdiA9IHRhcmdldFtrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdiA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICB2ID0geyAuLi52IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvYmpba10gPSB2O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbn1cbmxldCBpbmplY3RlZFRoZW1lRWZmZWN0ID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBzZXR1cEluamVjdGVkVGhlbWUodXJsKSB7XG4gICAgaW5qZWN0ZWRUaGVtZUVmZmVjdD8uY2FsbCgpO1xuICAgIGlmICghdXJsKVxuICAgICAgICByZXR1cm47XG4gICAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICBsaW5rLnJlbCA9ICdzdHlsZXNoZWV0JztcbiAgICBsaW5rLmhyZWYgPSB1cmw7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsaW5rKTtcbiAgICByZXR1cm4gKGluamVjdGVkVGhlbWVFZmZlY3QgPSAoKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkb2N1bWVudC5oZWFkLnJlbW92ZUNoaWxkKGxpbmspO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9XG4gICAgICAgIGluamVjdGVkVGhlbWVFZmZlY3QgPSBudWxsO1xuICAgIH0pO1xufVxuIiwiLyoqXG4gKiBBIHN0b3JhZ2UgYmFzZWQgb24gbG9jYWwgZmlsZXMgdW5kZXIgc3BlY2lmaWMgY29udGV4dFxuICovXG5jbGFzcyBMU1BsdWdpbkZpbGVTdG9yYWdlIHtcbiAgICBjdHg7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIGN0eFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGN0eCkge1xuICAgICAgICB0aGlzLmN0eCA9IGN0eDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogcGx1Z2luIGlkXG4gICAgICovXG4gICAgZ2V0IGN0eElkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdHguYmFzZUluZm8uaWQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBrZXkgQSBzdHJpbmcgYXMgZmlsZSBuYW1lIHRoYXQgc3VwcG9ydCBuZXN0ZWQgZGlyZWN0b3J5XG4gICAgICogQHBhcmFtIHZhbHVlIFN0b3JhZ2UgdmFsdWVcbiAgICAgKi9cbiAgICBzZXRJdGVtKGtleSwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3R4LmNhbGxlci5jYWxsQXN5bmMoYGFwaTpjYWxsYCwge1xuICAgICAgICAgICAgbWV0aG9kOiAnd3JpdGUtcGx1Z2luLXN0b3JhZ2UtZmlsZScsXG4gICAgICAgICAgICBhcmdzOiBbdGhpcy5jdHhJZCwga2V5LCB2YWx1ZV1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBrZXlcbiAgICAgKi9cbiAgICBnZXRJdGVtKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdHguY2FsbGVyLmNhbGxBc3luYyhgYXBpOmNhbGxgLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdyZWFkLXBsdWdpbi1zdG9yYWdlLWZpbGUnLFxuICAgICAgICAgICAgYXJnczogW3RoaXMuY3R4SWQsIGtleV1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBrZXlcbiAgICAgKi9cbiAgICByZW1vdmVJdGVtKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdHguY2FsbGVyLmNhbGwoYGFwaTpjYWxsYCwge1xuICAgICAgICAgICAgbWV0aG9kOiAndW5saW5rLXBsdWdpbi1zdG9yYWdlLWZpbGUnLFxuICAgICAgICAgICAgYXJnczogW3RoaXMuY3R4SWQsIGtleV1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsZWFycyB0aGUgc3RvcmFnZVxuICAgICAqL1xuICAgIGNsZWFyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdHguY2FsbGVyLmNhbGwoYGFwaTpjYWxsYCwge1xuICAgICAgICAgICAgbWV0aG9kOiAnY2xlYXItcGx1Z2luLXN0b3JhZ2UtZmlsZXMnLFxuICAgICAgICAgICAgYXJnczogW3RoaXMuY3R4SWRdXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICovXG4gICAgaGFzSXRlbShrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3R4LmNhbGxlci5jYWxsQXN5bmMoYGFwaTpjYWxsYCwge1xuICAgICAgICAgICAgbWV0aG9kOiAnZXhpc3QtcGx1Z2luLXN0b3JhZ2UtZmlsZScsXG4gICAgICAgICAgICBhcmdzOiBbdGhpcy5jdHhJZCwga2V5XVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnQgeyBMU1BsdWdpbkZpbGVTdG9yYWdlIH07XG4iLCIvLyBGb3JrIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2RvbGxhcnNoYXZlY2x1Yi9wb3N0bWF0ZVxuLyoqXG4gKiBUaGUgdHlwZSBvZiBtZXNzYWdlcyBvdXIgZnJhbWVzIG91ciBzZW5kaW5nXG4gKiBAdHlwZSB7U3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgbWVzc2FnZVR5cGUgPSAnYXBwbGljYXRpb24veC1wb3N0bWF0ZS12MStqc29uJztcbi8qKlxuICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGF0dGVtcHRzIHRvIHNlbmQgYSBoYW5kc2hha2UgcmVxdWVzdCB0byB0aGUgcGFyZW50XG4gKiBAdHlwZSB7TnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgbWF4SGFuZHNoYWtlUmVxdWVzdHMgPSA1O1xuLyoqXG4gKiBBIHVuaXF1ZSBtZXNzYWdlIElEIHRoYXQgaXMgdXNlZCB0byBlbnN1cmUgcmVzcG9uc2VzIGFyZSBzZW50IHRvIHRoZSBjb3JyZWN0IHJlcXVlc3RzXG4gKiBAdHlwZSB7TnVtYmVyfVxuICovXG5sZXQgX21lc3NhZ2VJZCA9IDA7XG4vKipcbiAqIEluY3JlbWVudHMgYW5kIHJldHVybnMgYSBtZXNzYWdlIElEXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEEgdW5pcXVlIElEIGZvciBhIG1lc3NhZ2VcbiAqL1xuZXhwb3J0IGNvbnN0IGdlbmVyYXRlTmV3TWVzc2FnZUlkID0gKCkgPT4gKytfbWVzc2FnZUlkO1xuLyoqXG4gKiBQb3N0bWF0ZSBsb2dnaW5nIGZ1bmN0aW9uIHRoYXQgZW5hYmxlcy9kaXNhYmxlcyB2aWEgY29uZmlnXG4gKi9cbmV4cG9ydCBjb25zdCBsb2cgPSAoLi4uYXJncykgPT4gUG9zdG1hdGUuZGVidWcgPyBjb25zb2xlLmxvZyguLi5hcmdzKSA6IG51bGw7XG4vKipcbiAqIFRha2VzIGEgVVJMIGFuZCByZXR1cm5zIHRoZSBvcmlnaW5cbiAqIEBwYXJhbSAge1N0cmluZ30gdXJsIFRoZSBmdWxsIFVSTCBiZWluZyByZXF1ZXN0ZWRcbiAqIEByZXR1cm4ge1N0cmluZ30gICAgIFRoZSBVUkxzIG9yaWdpblxuICovXG5leHBvcnQgY29uc3QgcmVzb2x2ZU9yaWdpbiA9ICh1cmwpID0+IHtcbiAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIGEuaHJlZiA9IHVybDtcbiAgICBjb25zdCBwcm90b2NvbCA9IGEucHJvdG9jb2wubGVuZ3RoID4gNCA/IGEucHJvdG9jb2wgOiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2w7XG4gICAgY29uc3QgaG9zdCA9IGEuaG9zdC5sZW5ndGggPyAoKGEucG9ydCA9PT0gJzgwJyB8fCBhLnBvcnQgPT09ICc0NDMnKSA/IGEuaG9zdG5hbWUgOiBhLmhvc3QpIDogd2luZG93LmxvY2F0aW9uLmhvc3Q7XG4gICAgcmV0dXJuIGEub3JpZ2luIHx8IGAke3Byb3RvY29sfS8vJHtob3N0fWA7XG59O1xuY29uc3QgbWVzc2FnZVR5cGVzID0ge1xuICAgIGhhbmRzaGFrZTogMSxcbiAgICAnaGFuZHNoYWtlLXJlcGx5JzogMSxcbiAgICBjYWxsOiAxLFxuICAgIGVtaXQ6IDEsXG4gICAgcmVwbHk6IDEsXG4gICAgcmVxdWVzdDogMSxcbn07XG4vKipcbiAqIEVuc3VyZXMgdGhhdCBhIG1lc3NhZ2UgaXMgc2FmZSB0byBpbnRlcnByZXRcbiAqIEBwYXJhbSAge09iamVjdH0gbWVzc2FnZSBUaGUgcG9zdG1hdGUgbWVzc2FnZSBiZWluZyBzZW50XG4gKiBAcGFyYW0gIHtTdHJpbmd8Qm9vbGVhbn0gYWxsb3dlZE9yaWdpbiBUaGUgd2hpdGVsaXN0ZWQgb3JpZ2luIG9yIGZhbHNlIHRvIHNraXAgb3JpZ2luIGNoZWNrXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5leHBvcnQgY29uc3Qgc2FuaXRpemUgPSAobWVzc2FnZSwgYWxsb3dlZE9yaWdpbikgPT4ge1xuICAgIGlmICh0eXBlb2YgYWxsb3dlZE9yaWdpbiA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgbWVzc2FnZS5vcmlnaW4gIT09IGFsbG93ZWRPcmlnaW4pXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIW1lc3NhZ2UuZGF0YSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmICh0eXBlb2YgbWVzc2FnZS5kYXRhID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAhKCdwb3N0bWF0ZScgaW4gbWVzc2FnZS5kYXRhKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChtZXNzYWdlLmRhdGEudHlwZSAhPT0gbWVzc2FnZVR5cGUpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIW1lc3NhZ2VUeXBlc1ttZXNzYWdlLmRhdGEucG9zdG1hdGVdKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuLyoqXG4gKiBUYWtlcyBhIG1vZGVsLCBhbmQgc2VhcmNoZXMgZm9yIGEgdmFsdWUgYnkgdGhlIHByb3BlcnR5XG4gKiBAcGFyYW0gIHtPYmplY3R9IG1vZGVsICAgICBUaGUgZGljdGlvbmFyeSB0byBzZWFyY2ggYWdhaW5zdFxuICogQHBhcmFtICB7U3RyaW5nfSBwcm9wZXJ0eSAgQSBwYXRoIHdpdGhpbiBhIGRpY3Rpb25hcnkgKGkuZS4gJ3dpbmRvdy5sb2NhdGlvbi5ocmVmJylcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCB0byBmdW5jdGlvbnMgaW4gdGhlIGNoaWxkIG1vZGVsXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICovXG5leHBvcnQgY29uc3QgcmVzb2x2ZVZhbHVlID0gKG1vZGVsLCBwcm9wZXJ0eSkgPT4ge1xuICAgIGNvbnN0IHVud3JhcHBlZENvbnRleHQgPSB0eXBlb2YgbW9kZWxbcHJvcGVydHldID09PSAnZnVuY3Rpb24nXG4gICAgICAgID8gbW9kZWxbcHJvcGVydHldKCkgOiBtb2RlbFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bndyYXBwZWRDb250ZXh0KTtcbn07XG4vKipcbiAqIENvbXBvc2VzIGFuIEFQSSB0byBiZSB1c2VkIGJ5IHRoZSBwYXJlbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbmZvIEluZm9ybWF0aW9uIG9uIHRoZSBjb25zdW1lclxuICovXG5leHBvcnQgY2xhc3MgUGFyZW50QVBJIHtcbiAgICBwYXJlbnQ7XG4gICAgZnJhbWU7XG4gICAgY2hpbGQ7XG4gICAgZXZlbnRzID0ge307XG4gICAgY2hpbGRPcmlnaW47XG4gICAgbGlzdGVuZXI7XG4gICAgY29uc3RydWN0b3IoaW5mbykge1xuICAgICAgICB0aGlzLnBhcmVudCA9IGluZm8ucGFyZW50O1xuICAgICAgICB0aGlzLmZyYW1lID0gaW5mby5mcmFtZTtcbiAgICAgICAgdGhpcy5jaGlsZCA9IGluZm8uY2hpbGQ7XG4gICAgICAgIHRoaXMuY2hpbGRPcmlnaW4gPSBpbmZvLmNoaWxkT3JpZ2luO1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgICAgbG9nKCdQYXJlbnQ6IFJlZ2lzdGVyaW5nIEFQSScpO1xuICAgICAgICAgICAgbG9nKCdQYXJlbnQ6IEF3YWl0aW5nIG1lc3NhZ2VzLi4uJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saXN0ZW5lciA9IChlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXNhbml0aXplKGUsIHRoaXMuY2hpbGRPcmlnaW4pKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogdGhlIGFzc2lnbm1lbnRzIGJlbG93IGVuc3VyZXMgdGhhdCBlLCBkYXRhLCBhbmQgdmFsdWUgYXJlIGFsbCBkZWZpbmVkXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbnN0IHsgZGF0YSwgbmFtZSB9ID0gKCgoZSB8fCB7fSkuZGF0YSB8fCB7fSkudmFsdWUgfHwge30pO1xuICAgICAgICAgICAgaWYgKGUuZGF0YS5wb3N0bWF0ZSA9PT0gJ2VtaXQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nKGBQYXJlbnQ6IFJlY2VpdmVkIGV2ZW50IGVtaXNzaW9uOiAke25hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChuYW1lIGluIHRoaXMuZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzW25hbWVdLmZvckVhY2goY2FsbGJhY2sgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnBhcmVudC5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5saXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgICAgbG9nKCdQYXJlbnQ6IEF3YWl0aW5nIGV2ZW50IGVtaXNzaW9ucyBmcm9tIENoaWxkJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0KHByb3BlcnR5KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8gRXh0cmFjdCBkYXRhIGZyb20gcmVzcG9uc2UgYW5kIGtpbGwgbGlzdGVuZXJzXG4gICAgICAgICAgICBjb25zdCB1aWQgPSBnZW5lcmF0ZU5ld01lc3NhZ2VJZCgpO1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3QgPSAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlLmRhdGEudWlkID09PSB1aWQgJiYgZS5kYXRhLnBvc3RtYXRlID09PSAncmVwbHknKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0cmFuc2FjdCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGUuZGF0YS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIFByZXBhcmUgZm9yIHJlc3BvbnNlIGZyb20gQ2hpbGQuLi5cbiAgICAgICAgICAgIHRoaXMucGFyZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0cmFuc2FjdCwgZmFsc2UpO1xuICAgICAgICAgICAgLy8gVGhlbiBhc2sgY2hpbGQgZm9yIGluZm9ybWF0aW9uXG4gICAgICAgICAgICB0aGlzLmNoaWxkLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICBwb3N0bWF0ZTogJ3JlcXVlc3QnLFxuICAgICAgICAgICAgICAgIHR5cGU6IG1lc3NhZ2VUeXBlLFxuICAgICAgICAgICAgICAgIHByb3BlcnR5LFxuICAgICAgICAgICAgICAgIHVpZCxcbiAgICAgICAgICAgIH0sIHRoaXMuY2hpbGRPcmlnaW4pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY2FsbChwcm9wZXJ0eSwgZGF0YSkge1xuICAgICAgICAvLyBTZW5kIGluZm9ybWF0aW9uIHRvIHRoZSBjaGlsZFxuICAgICAgICB0aGlzLmNoaWxkLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHBvc3RtYXRlOiAnY2FsbCcsXG4gICAgICAgICAgICB0eXBlOiBtZXNzYWdlVHlwZSxcbiAgICAgICAgICAgIHByb3BlcnR5LFxuICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgfSwgdGhpcy5jaGlsZE9yaWdpbik7XG4gICAgfVxuICAgIG9uKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCF0aGlzLmV2ZW50c1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ldmVudHNbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgIGxvZygnUGFyZW50OiBEZXN0cm95aW5nIFBvc3RtYXRlIGluc3RhbmNlJyk7XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLmxpc3RlbmVyLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZnJhbWUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmZyYW1lKTtcbiAgICB9XG59XG4vKipcbiAqIENvbXBvc2VzIGFuIEFQSSB0byBiZSB1c2VkIGJ5IHRoZSBjaGlsZFxuICogQHBhcmFtIHtPYmplY3R9IGluZm8gSW5mb3JtYXRpb24gb24gdGhlIGNvbnN1bWVyXG4gKi9cbmV4cG9ydCBjbGFzcyBDaGlsZEFQSSB7XG4gICAgbW9kZWw7XG4gICAgcGFyZW50O1xuICAgIHBhcmVudE9yaWdpbjtcbiAgICBjaGlsZDtcbiAgICBjb25zdHJ1Y3RvcihpbmZvKSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSBpbmZvLm1vZGVsO1xuICAgICAgICB0aGlzLnBhcmVudCA9IGluZm8ucGFyZW50O1xuICAgICAgICB0aGlzLnBhcmVudE9yaWdpbiA9IGluZm8ucGFyZW50T3JpZ2luO1xuICAgICAgICB0aGlzLmNoaWxkID0gaW5mby5jaGlsZDtcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgIGxvZygnQ2hpbGQ6IFJlZ2lzdGVyaW5nIEFQSScpO1xuICAgICAgICAgICAgbG9nKCdDaGlsZDogQXdhaXRpbmcgbWVzc2FnZXMuLi4nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoaWxkLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFzYW5pdGl6ZShlLCB0aGlzLnBhcmVudE9yaWdpbikpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgICAgICBsb2coJ0NoaWxkOiBSZWNlaXZlZCByZXF1ZXN0JywgZS5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHsgcHJvcGVydHksIHVpZCwgZGF0YSB9ID0gZS5kYXRhO1xuICAgICAgICAgICAgaWYgKGUuZGF0YS5wb3N0bWF0ZSA9PT0gJ2NhbGwnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5IGluIHRoaXMubW9kZWwgJiYgdHlwZW9mIHRoaXMubW9kZWxbcHJvcGVydHldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW9kZWxbcHJvcGVydHldKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBSZXBseSB0byBQYXJlbnRcbiAgICAgICAgICAgIHJlc29sdmVWYWx1ZSh0aGlzLm1vZGVsLCBwcm9wZXJ0eSlcbiAgICAgICAgICAgICAgICAudGhlbih2YWx1ZSA9PiB7XG4gICAgICAgICAgICAgICAgZS5zb3VyY2UucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAgcG9zdG1hdGU6ICdyZXBseScsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IG1lc3NhZ2VUeXBlLFxuICAgICAgICAgICAgICAgICAgICB1aWQsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgICAgIH0sIGUub3JpZ2luKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZW1pdChuYW1lLCBkYXRhKSB7XG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgICBsb2coYENoaWxkOiBFbWl0dGluZyBFdmVudCBcIiR7bmFtZX1cImAsIGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGFyZW50LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHBvc3RtYXRlOiAnZW1pdCcsXG4gICAgICAgICAgICB0eXBlOiBtZXNzYWdlVHlwZSxcbiAgICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgdGhpcy5wYXJlbnRPcmlnaW4pO1xuICAgIH1cbn1cbi8qKlxuICogVGhlIGVudHJ5IHBvaW50IG9mIHRoZSBQYXJlbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBQb3N0bWF0ZSB7XG4gICAgc3RhdGljIGRlYnVnID0gZmFsc2U7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiAgICBjb250YWluZXI7XG4gICAgcGFyZW50O1xuICAgIGZyYW1lO1xuICAgIGNoaWxkO1xuICAgIGNoaWxkT3JpZ2luO1xuICAgIHVybDtcbiAgICBtb2RlbDtcbiAgICBzdGF0aWMgTW9kZWw7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIG9wdHNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gb3B0cy5jb250YWluZXI7XG4gICAgICAgIHRoaXMudXJsID0gb3B0cy51cmw7XG4gICAgICAgIHRoaXMucGFyZW50ID0gd2luZG93O1xuICAgICAgICB0aGlzLmZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgICAgIGlmIChvcHRzLmlkKVxuICAgICAgICAgICAgdGhpcy5mcmFtZS5pZCA9IG9wdHMuaWQ7XG4gICAgICAgIGlmIChvcHRzLm5hbWUpXG4gICAgICAgICAgICB0aGlzLmZyYW1lLm5hbWUgPSBvcHRzLm5hbWU7XG4gICAgICAgIHRoaXMuZnJhbWUuY2xhc3NMaXN0LmFkZC5hcHBseSh0aGlzLmZyYW1lLmNsYXNzTGlzdCwgb3B0cy5jbGFzc0xpc3RBcnJheSB8fCBbXSk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZnJhbWUpO1xuICAgICAgICB0aGlzLmNoaWxkID0gdGhpcy5mcmFtZS5jb250ZW50V2luZG93O1xuICAgICAgICB0aGlzLm1vZGVsID0gb3B0cy5tb2RlbCB8fCB7fTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQmVnaW5zIHRoZSBoYW5kc2hha2Ugc3RyYXRlZ3lcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IHVybCBUaGUgVVJMIHRvIHNlbmQgYSBoYW5kc2hha2UgcmVxdWVzdCB0b1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9ICAgICBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgaGFuZHNoYWtlIGlzIGNvbXBsZXRlXG4gICAgICovXG4gICAgc2VuZEhhbmRzaGFrZSh1cmwpIHtcbiAgICAgICAgdXJsID0gdXJsIHx8IHRoaXMudXJsO1xuICAgICAgICBjb25zdCBjaGlsZE9yaWdpbiA9IHJlc29sdmVPcmlnaW4odXJsKTtcbiAgICAgICAgbGV0IGF0dGVtcHQgPSAwO1xuICAgICAgICBsZXQgcmVzcG9uc2VJbnRlcnZhbDtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcGx5ID0gKGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXNhbml0aXplKGUsIGNoaWxkT3JpZ2luKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmIChlLmRhdGEucG9zdG1hdGUgPT09ICdoYW5kc2hha2UtcmVwbHknKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwocmVzcG9uc2VJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2coJ1BhcmVudDogUmVjZWl2ZWQgaGFuZHNoYWtlIHJlcGx5IGZyb20gQ2hpbGQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgcmVwbHksIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGlsZE9yaWdpbiA9IGUub3JpZ2luO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nKCdQYXJlbnQ6IFNhdmluZyBDaGlsZCBvcmlnaW4nLCB0aGlzLmNoaWxkT3JpZ2luKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShuZXcgUGFyZW50QVBJKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gTWlnaHQgbmVlZCB0byByZW1vdmUgc2luY2UgcGFyZW50IG1pZ2h0IGJlIHJlY2VpdmluZyBkaWZmZXJlbnQgbWVzc2FnZXNcbiAgICAgICAgICAgICAgICAvLyBmcm9tIGRpZmZlcmVudCBob3N0c1xuICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZygnUGFyZW50OiBJbnZhbGlkIGhhbmRzaGFrZSByZXBseScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KCdGYWlsZWQgaGFuZHNoYWtlJyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5wYXJlbnQuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHJlcGx5LCBmYWxzZSk7XG4gICAgICAgICAgICBjb25zdCBkb1NlbmQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgYXR0ZW1wdCsrO1xuICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZyhgUGFyZW50OiBTZW5kaW5nIGhhbmRzaGFrZSBhdHRlbXB0ICR7YXR0ZW1wdH1gLCB7IGNoaWxkT3JpZ2luIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgcG9zdG1hdGU6ICdoYW5kc2hha2UnLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBtZXNzYWdlVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgbW9kZWw6IHRoaXMubW9kZWwsXG4gICAgICAgICAgICAgICAgfSwgY2hpbGRPcmlnaW4pO1xuICAgICAgICAgICAgICAgIGlmIChhdHRlbXB0ID09PSBtYXhIYW5kc2hha2VSZXF1ZXN0cykge1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHJlc3BvbnNlSW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCBsb2FkZWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZG9TZW5kKCk7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2VJbnRlcnZhbCA9IHNldEludGVydmFsKGRvU2VuZCwgNTAwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmZyYW1lLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBsb2FkZWQpO1xuICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgICAgICBsb2coJ1BhcmVudDogTG9hZGluZyBmcmFtZScsIHsgdXJsIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mcmFtZS5zcmMgPSB1cmw7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbi8qKlxuICogVGhlIGVudHJ5IHBvaW50IG9mIHRoZSBDaGlsZFxuICovXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICAgIGNoaWxkO1xuICAgIG1vZGVsO1xuICAgIHBhcmVudDtcbiAgICBwYXJlbnRPcmlnaW47XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIGNoaWxkLCBtb2RlbCwgcGFyZW50LCBhbmQgcmVzcG9uZHMgdG8gdGhlIFBhcmVudHMgaGFuZHNoYWtlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG1vZGVsIEhhc2ggb2YgdmFsdWVzLCBmdW5jdGlvbnMsIG9yIHByb21pc2VzXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gICAgICAgVGhlIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBoYW5kc2hha2UgaGFzIGJlZW4gcmVjZWl2ZWRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihtb2RlbCkge1xuICAgICAgICB0aGlzLmNoaWxkID0gd2luZG93O1xuICAgICAgICB0aGlzLm1vZGVsID0gbW9kZWw7XG4gICAgICAgIHRoaXMucGFyZW50ID0gdGhpcy5jaGlsZC5wYXJlbnQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlc3BvbmRzIHRvIGEgaGFuZHNoYWtlIGluaXRpYXRlZCBieSB0aGUgUGFyZW50XG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gUmVzb2x2ZXMgYW4gb2JqZWN0IHRoYXQgZXhwb3NlcyBhbiBBUEkgZm9yIHRoZSBDaGlsZFxuICAgICAqL1xuICAgIHNlbmRIYW5kc2hha2VSZXBseSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNoYWtlID0gKGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWUuZGF0YS5wb3N0bWF0ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlLmRhdGEucG9zdG1hdGUgPT09ICdoYW5kc2hha2UnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2coJ0NoaWxkOiBSZWNlaXZlZCBoYW5kc2hha2UgZnJvbSBQYXJlbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoaWxkLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBzaGFrZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nKCdDaGlsZDogU2VuZGluZyBoYW5kc2hha2UgcmVwbHkgdG8gUGFyZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZS5zb3VyY2UucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdG1hdGU6ICdoYW5kc2hha2UtcmVwbHknLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogbWVzc2FnZVR5cGUsXG4gICAgICAgICAgICAgICAgICAgIH0sIGUub3JpZ2luKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnRPcmlnaW4gPSBlLm9yaWdpbjtcbiAgICAgICAgICAgICAgICAgICAgLy8gRXh0ZW5kIG1vZGVsIHdpdGggdGhlIG9uZSBwcm92aWRlZCBieSB0aGUgcGFyZW50XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRzID0gZS5kYXRhLm1vZGVsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVmYXVsdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGRlZmF1bHRzKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb2RlbFtrZXldID0gZGVmYXVsdHNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2coJ0NoaWxkOiBJbmhlcml0ZWQgYW5kIGV4dGVuZGVkIG1vZGVsIGZyb20gUGFyZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZygnQ2hpbGQ6IFNhdmluZyBQYXJlbnQgb3JpZ2luJywgdGhpcy5wYXJlbnRPcmlnaW4pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKG5ldyBDaGlsZEFQSSh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoJ0hhbmRzaGFrZSBSZXBseSBGYWlsZWQnKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmNoaWxkLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBzaGFrZSwgZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCIvKiEgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXHJcblxyXG5QZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcclxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxyXG5cclxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxyXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcclxuQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxyXG5JTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cclxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcclxuT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxyXG5QRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG4vKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgaWYgKHR5cGVvZiBiICE9PSBcImZ1bmN0aW9uXCIgJiYgYiAhPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2xhc3MgZXh0ZW5kcyB2YWx1ZSBcIiArIFN0cmluZyhiKSArIFwiIGlzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIG51bGxcIik7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxyXG4gICAgICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICAgICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXRlcih0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcclxuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxyXG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XHJcbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2dlbmVyYXRvcih0aGlzQXJnLCBib2R5KSB7XHJcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnO1xyXG4gICAgcmV0dXJuIGcgPSB7IG5leHQ6IHZlcmIoMCksIFwidGhyb3dcIjogdmVyYigxKSwgXCJyZXR1cm5cIjogdmVyYigyKSB9LCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcclxuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XHJcbiAgICAgICAgd2hpbGUgKF8pIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcclxuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cclxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2NyZWF0ZUJpbmRpbmcgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIGsyLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH0pO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIG8pIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgcCkpIF9fY3JlYXRlQmluZGluZyhvLCBtLCBwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBzID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciwgbSA9IHMgJiYgb1tzXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIGlmIChvICYmIHR5cGVvZiBvLmxlbmd0aCA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChvICYmIGkgPj0gby5sZW5ndGgpIG8gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBvICYmIG9baSsrXSwgZG9uZTogIW8gfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzID8gXCJPYmplY3QgaXMgbm90IGl0ZXJhYmxlLlwiIDogXCJTeW1ib2wuaXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZWFkKG8sIG4pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXTtcclxuICAgIGlmICghbSkgcmV0dXJuIG87XHJcbiAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2hpbGUgKChuID09PSB2b2lkIDAgfHwgbi0tID4gMCkgJiYgIShyID0gaS5uZXh0KCkpLmRvbmUpIGFyLnB1c2goci52YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHsgZSA9IHsgZXJyb3I6IGVycm9yIH07IH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChyICYmICFyLmRvbmUgJiYgKG0gPSBpW1wicmV0dXJuXCJdKSkgbS5jYWxsKGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5cygpIHtcclxuICAgIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgZm9yICh2YXIgciA9IEFycmF5KHMpLCBrID0gMCwgaSA9IDA7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIGZvciAodmFyIGEgPSBhcmd1bWVudHNbaV0sIGogPSAwLCBqbCA9IGEubGVuZ3RoOyBqIDwgamw7IGorKywgaysrKVxyXG4gICAgICAgICAgICByW2tdID0gYVtqXTtcclxuICAgIHJldHVybiByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheSh0bywgZnJvbSwgcGFjaykge1xyXG4gICAgaWYgKHBhY2sgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMikgZm9yICh2YXIgaSA9IDAsIGwgPSBmcm9tLmxlbmd0aCwgYXI7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICBpZiAoYXIgfHwgIShpIGluIGZyb20pKSB7XHJcbiAgICAgICAgICAgIGlmICghYXIpIGFyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSwgMCwgaSk7XHJcbiAgICAgICAgICAgIGFyW2ldID0gZnJvbVtpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdG8uY29uY2F0KGFyIHx8IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20pKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXQodikge1xyXG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaWYgKGdbbl0pIGlbbl0gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHsgcS5wdXNoKFtuLCB2LCBhLCBiXSkgPiAxIHx8IHJlc3VtZShuLCB2KTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHJlc3VtZShuLCB2KSB7IHRyeSB7IHN0ZXAoZ1tuXSh2KSk7IH0gY2F0Y2ggKGUpIHsgc2V0dGxlKHFbMF1bM10sIGUpOyB9IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAocikgeyByLnZhbHVlIGluc3RhbmNlb2YgX19hd2FpdCA/IFByb21pc2UucmVzb2x2ZShyLnZhbHVlLnYpLnRoZW4oZnVsZmlsbCwgcmVqZWN0KSA6IHNldHRsZShxWzBdWzJdLCByKTsgfVxyXG4gICAgZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkgeyByZXN1bWUoXCJuZXh0XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gcmVqZWN0KHZhbHVlKSB7IHJlc3VtZShcInRocm93XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKGYsIHYpIHsgaWYgKGYodiksIHEuc2hpZnQoKSwgcS5sZW5ndGgpIHJlc3VtZShxWzBdWzBdLCBxWzBdWzFdKTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0RlbGVnYXRvcihvKSB7XHJcbiAgICB2YXIgaSwgcDtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiwgZnVuY3Rpb24gKGUpIHsgdGhyb3cgZTsgfSksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4sIGYpIHsgaVtuXSA9IG9bbl0gPyBmdW5jdGlvbiAodikgeyByZXR1cm4gKHAgPSAhcCkgPyB7IHZhbHVlOiBfX2F3YWl0KG9bbl0odikpLCBkb25lOiBuID09PSBcInJldHVyblwiIH0gOiBmID8gZih2KSA6IHY7IH0gOiBmOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jVmFsdWVzKG8pIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdLCBpO1xyXG4gICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiAobyA9IHR5cGVvZiBfX3ZhbHVlcyA9PT0gXCJmdW5jdGlvblwiID8gX192YWx1ZXMobykgOiBvW1N5bWJvbC5pdGVyYXRvcl0oKSwgaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGkpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlbbl0gPSBvW25dICYmIGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHYgPSBvW25dKHYpLCBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCB2LmRvbmUsIHYudmFsdWUpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgZCwgdikgeyBQcm9taXNlLnJlc29sdmUodikudGhlbihmdW5jdGlvbih2KSB7IHJlc29sdmUoeyB2YWx1ZTogdiwgZG9uZTogZCB9KTsgfSwgcmVqZWN0KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tYWtlVGVtcGxhdGVPYmplY3QoY29va2VkLCByYXcpIHtcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvb2tlZCwgXCJyYXdcIiwgeyB2YWx1ZTogcmF3IH0pOyB9IGVsc2UgeyBjb29rZWQucmF3ID0gcmF3OyB9XHJcbiAgICByZXR1cm4gY29va2VkO1xyXG59O1xyXG5cclxudmFyIF9fc2V0TW9kdWxlRGVmYXVsdCA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgdikge1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIFwiZGVmYXVsdFwiLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2IH0pO1xyXG59KSA6IGZ1bmN0aW9uKG8sIHYpIHtcclxuICAgIG9bXCJkZWZhdWx0XCJdID0gdjtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydFN0YXIobW9kKSB7XHJcbiAgICBpZiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSByZXR1cm4gbW9kO1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgaWYgKG1vZCAhPSBudWxsKSBmb3IgKHZhciBrIGluIG1vZCkgaWYgKGsgIT09IFwiZGVmYXVsdFwiICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb2QsIGspKSBfX2NyZWF0ZUJpbmRpbmcocmVzdWx0LCBtb2QsIGspO1xyXG4gICAgX19zZXRNb2R1bGVEZWZhdWx0KHJlc3VsdCwgbW9kKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydERlZmF1bHQobW9kKSB7XHJcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IGRlZmF1bHQ6IG1vZCB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZEdldChyZWNlaXZlciwgc3RhdGUsIGtpbmQsIGYpIHtcclxuICAgIGlmIChraW5kID09PSBcImFcIiAmJiAhZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgYWNjZXNzb3Igd2FzIGRlZmluZWQgd2l0aG91dCBhIGdldHRlclwiKTtcclxuICAgIGlmICh0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyICE9PSBzdGF0ZSB8fCAhZiA6ICFzdGF0ZS5oYXMocmVjZWl2ZXIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHJlYWQgcHJpdmF0ZSBtZW1iZXIgZnJvbSBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIGtpbmQgPT09IFwibVwiID8gZiA6IGtpbmQgPT09IFwiYVwiID8gZi5jYWxsKHJlY2VpdmVyKSA6IGYgPyBmLnZhbHVlIDogc3RhdGUuZ2V0KHJlY2VpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRTZXQocmVjZWl2ZXIsIHN0YXRlLCB2YWx1ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwibVwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBtZXRob2QgaXMgbm90IHdyaXRhYmxlXCIpO1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgc2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3Qgd3JpdGUgcHJpdmF0ZSBtZW1iZXIgdG8gYW4gb2JqZWN0IHdob3NlIGNsYXNzIGRpZCBub3QgZGVjbGFyZSBpdFwiKTtcclxuICAgIHJldHVybiAoa2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIsIHZhbHVlKSA6IGYgPyBmLnZhbHVlID0gdmFsdWUgOiBzdGF0ZS5zZXQocmVjZWl2ZXIsIHZhbHVlKSksIHZhbHVlO1xyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbl9fd2VicGFja19yZXF1aXJlX18ubiA9IChtb2R1bGUpID0+IHtcblx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG5cdFx0KCkgPT4gKG1vZHVsZVsnZGVmYXVsdCddKSA6XG5cdFx0KCkgPT4gKG1vZHVsZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsIHsgYTogZ2V0dGVyIH0pO1xuXHRyZXR1cm4gZ2V0dGVyO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50ZW1pdHRlcjMnO1xuaW1wb3J0IHsgZGVlcE1lcmdlLCBzZXR1cEluamVjdGVkU3R5bGUsIGdlbklELCBzZXR1cEluamVjdGVkVGhlbWUsIHNldHVwSW5qZWN0ZWRVSSwgZGVmZXJyZWQsIGludm9rZUhvc3RFeHBvcnRlZEFwaSwgaXNPYmplY3QsIHdpdGhGaWxlUHJvdG9jb2wsIGdldFNES1BhdGhSb290LCBQUk9UT0NPTF9GSUxFLCBVUkxfTFNQLCBzYWZldHlQYXRoSm9pbiwgcGF0aCwgc2FmZXR5UGF0aE5vcm1hbGl6ZSB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgKiBhcyBwbHVnaW5IZWxwZXJzIGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgRGVidWcgZnJvbSAnZGVidWcnO1xuaW1wb3J0IHsgTFNQbHVnaW5DYWxsZXIsIExTUE1TR19SRUFEWSwgTFNQTVNHX1NZTkMsIExTUE1TRywgTFNQTVNHX1NFVFRJTkdTLCBMU1BNU0dfRVJST1JfVEFHLCBMU1BNU0dfQkVGT1JFX1VOTE9BRCwgQVdBSVRfTFNQTVNHRm4gfSBmcm9tICcuL0xTUGx1Z2luLmNhbGxlcic7XG5pbXBvcnQgeyBzbmFrZUNhc2UgfSBmcm9tICdzbmFrZS1jYXNlJztcbmNvbnN0IGRlYnVnID0gRGVidWcoJ0xTUGx1Z2luOmNvcmUnKTtcbmNvbnN0IERJUl9QTFVHSU5TID0gJ3BsdWdpbnMnO1xuLyoqXG4gKiBVc2VyIHNldHRpbmdzXG4gKi9cbmNsYXNzIFBsdWdpblNldHRpbmdzIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBfdXNlclBsdWdpblNldHRpbmdzO1xuICAgIF9zZXR0aW5ncyA9IHtcbiAgICAgICAgZGlzYWJsZWQ6IGZhbHNlXG4gICAgfTtcbiAgICBjb25zdHJ1Y3RvcihfdXNlclBsdWdpblNldHRpbmdzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX3VzZXJQbHVnaW5TZXR0aW5ncyA9IF91c2VyUGx1Z2luU2V0dGluZ3M7XG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5fc2V0dGluZ3MsIF91c2VyUGx1Z2luU2V0dGluZ3MpO1xuICAgIH1cbiAgICBnZXQoaykge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2V0dGluZ3Nba107XG4gICAgfVxuICAgIHNldChrLCB2KSB7XG4gICAgICAgIGNvbnN0IG8gPSBkZWVwTWVyZ2Uoe30sIHRoaXMuX3NldHRpbmdzKTtcbiAgICAgICAgaWYgKHR5cGVvZiBrID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NldHRpbmdzW2tdID09IHYpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5fc2V0dGluZ3Nba10gPSB2O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzT2JqZWN0KGspKSB7XG4gICAgICAgICAgICBkZWVwTWVyZ2UodGhpcy5fc2V0dGluZ3MsIGspO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW1pdCgnY2hhbmdlJywgT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5fc2V0dGluZ3MpLCBvKTtcbiAgICB9XG4gICAgdG9KU09OKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2V0dGluZ3M7XG4gICAgfVxufVxuY2xhc3MgUGx1Z2luTG9nZ2VyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBfdGFnO1xuICAgIF9sb2dzID0gW107XG4gICAgY29uc3RydWN0b3IoX3RhZykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl90YWcgPSBfdGFnO1xuICAgIH1cbiAgICB3cml0ZSh0eXBlLCBwYXlsb2FkKSB7XG4gICAgICAgIGxldCBtc2cgPSBwYXlsb2FkLnJlZHVjZSgoYWMsIGl0KSA9PiB7XG4gICAgICAgICAgICBpZiAoaXQgJiYgaXQgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgIGFjICs9IGAke2l0Lm1lc3NhZ2V9ICR7aXQuc3RhY2t9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGFjICs9IGl0LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWM7XG4gICAgICAgIH0sIGBbJHt0aGlzLl90YWd9XVske25ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9XSBgKTtcbiAgICAgICAgdGhpcy5fbG9ncy5wdXNoKFt0eXBlLCBtc2ddKTtcbiAgICAgICAgdGhpcy5lbWl0KCdjaGFuZ2UnKTtcbiAgICB9XG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuX2xvZ3MgPSBbXTtcbiAgICAgICAgdGhpcy5lbWl0KCdjaGFuZ2UnKTtcbiAgICB9XG4gICAgaW5mbyguLi5hcmdzKSB7XG4gICAgICAgIHRoaXMud3JpdGUoJ0lORk8nLCBhcmdzKTtcbiAgICB9XG4gICAgZXJyb3IoLi4uYXJncykge1xuICAgICAgICB0aGlzLndyaXRlKCdFUlJPUicsIGFyZ3MpO1xuICAgIH1cbiAgICB3YXJuKC4uLmFyZ3MpIHtcbiAgICAgICAgdGhpcy53cml0ZSgnV0FSTicsIGFyZ3MpO1xuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb2dzO1xuICAgIH1cbn1cbnZhciBQbHVnaW5Mb2NhbExvYWRTdGF0dXM7XG4oZnVuY3Rpb24gKFBsdWdpbkxvY2FsTG9hZFN0YXR1cykge1xuICAgIFBsdWdpbkxvY2FsTG9hZFN0YXR1c1tcIkxPQURJTkdcIl0gPSBcImxvYWRpbmdcIjtcbiAgICBQbHVnaW5Mb2NhbExvYWRTdGF0dXNbXCJVTkxPQURJTkdcIl0gPSBcInVubG9hZGluZ1wiO1xuICAgIFBsdWdpbkxvY2FsTG9hZFN0YXR1c1tcIkxPQURFRFwiXSA9IFwibG9hZGVkXCI7XG4gICAgUGx1Z2luTG9jYWxMb2FkU3RhdHVzW1wiVU5MT0FERURcIl0gPSBcInVubG9hZFwiO1xuICAgIFBsdWdpbkxvY2FsTG9hZFN0YXR1c1tcIkVSUk9SXCJdID0gXCJlcnJvclwiO1xufSkoUGx1Z2luTG9jYWxMb2FkU3RhdHVzIHx8IChQbHVnaW5Mb2NhbExvYWRTdGF0dXMgPSB7fSkpO1xuZnVuY3Rpb24gaW5pdFVzZXJTZXR0aW5nc0hhbmRsZXJzKHBsdWdpbkxvY2FsKSB7XG4gICAgY29uc3QgXyA9IChsYWJlbCkgPT4gYHNldHRpbmdzOiR7bGFiZWx9YDtcbiAgICBwbHVnaW5Mb2NhbC5vbihfKCd1cGRhdGUnKSwgKGF0dHJzKSA9PiB7XG4gICAgICAgIGlmICghYXR0cnMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHBsdWdpbkxvY2FsLnNldHRpbmdzPy5zZXQoYXR0cnMpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gaW5pdE1haW5VSUhhbmRsZXJzKHBsdWdpbkxvY2FsKSB7XG4gICAgY29uc3QgXyA9IChsYWJlbCkgPT4gYG1haW4tdWk6JHtsYWJlbH1gO1xuICAgIHBsdWdpbkxvY2FsLm9uKF8oJ3Zpc2libGUnKSwgKHsgdmlzaWJsZSwgdG9nZ2xlLCBjdXJzb3IgfSkgPT4ge1xuICAgICAgICBjb25zdCBlbCA9IHBsdWdpbkxvY2FsLmdldE1haW5VSUNvbnRhaW5lcigpO1xuICAgICAgICBlbD8uY2xhc3NMaXN0W3RvZ2dsZSA/ICd0b2dnbGUnIDogKHZpc2libGUgPyAnYWRkJyA6ICdyZW1vdmUnKV0oJ3Zpc2libGUnKTtcbiAgICAgICAgLy8gcGx1Z2luTG9jYWwuY2FsbGVyIS5jYWxsVXNlck1vZGVsKExTUE1TRywgeyB0eXBlOiBfKCd2aXNpYmxlJyksIHBheWxvYWQ6IHZpc2libGUgfSlcbiAgICAgICAgLy8gYXV0byBmb2N1cyBmcmFtZVxuICAgICAgICBpZiAodmlzaWJsZSkge1xuICAgICAgICAgICAgaWYgKCFwbHVnaW5Mb2NhbC5zaGFkb3cgJiYgZWwpIHtcbiAgICAgICAgICAgICAgICBlbC5xdWVyeVNlbGVjdG9yKCdpZnJhbWUnKT8uY29udGVudFdpbmRvdz8uZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY3Vyc29yKSB7XG4gICAgICAgICAgICBpbnZva2VIb3N0RXhwb3J0ZWRBcGkoJ3Jlc3RvcmVfZWRpdGluZ19jdXJzb3InKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHBsdWdpbkxvY2FsLm9uKF8oJ2F0dHJzJyksIChhdHRycykgPT4ge1xuICAgICAgICBjb25zdCBlbCA9IHBsdWdpbkxvY2FsLmdldE1haW5VSUNvbnRhaW5lcigpO1xuICAgICAgICBPYmplY3QuZW50cmllcyhhdHRycykuZm9yRWFjaCgoW2ssIHZdKSA9PiB7XG4gICAgICAgICAgICBlbD8uc2V0QXR0cmlidXRlKGssIHYpO1xuICAgICAgICAgICAgaWYgKGsgPT09ICdkcmFnZ2FibGUnICYmIHYpIHtcbiAgICAgICAgICAgICAgICBwbHVnaW5Mb2NhbC5fZGlzcG9zZShwbHVnaW5Mb2NhbC5fc2V0dXBEcmFnZ2FibGVDb250YWluZXIoZWwsIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHBsdWdpbkxvY2FsLm9wdGlvbnMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY2xvc2U6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbkxvY2FsLmNhbGxlci5jYWxsKCdzeXM6dWk6dmlzaWJsZScsIHsgdG9nZ2xlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGsgPT09ICdyZXNpemFibGUnICYmIHYpIHtcbiAgICAgICAgICAgICAgICBwbHVnaW5Mb2NhbC5fZGlzcG9zZShwbHVnaW5Mb2NhbC5fc2V0dXBSZXNpemFibGVDb250YWluZXIoZWwpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgcGx1Z2luTG9jYWwub24oXygnc3R5bGUnKSwgKHN0eWxlKSA9PiB7XG4gICAgICAgIGNvbnN0IGVsID0gcGx1Z2luTG9jYWwuZ2V0TWFpblVJQ29udGFpbmVyKCk7XG4gICAgICAgIGNvbnN0IGlzSW5pdGVkTGF5b3V0ID0gISFlbC5kYXRhc2V0LmluaXRlZF9sYXlvdXQ7XG4gICAgICAgIE9iamVjdC5lbnRyaWVzKHN0eWxlKS5mb3JFYWNoKChbaywgdl0pID0+IHtcbiAgICAgICAgICAgIGlmIChpc0luaXRlZExheW91dCAmJiBbXG4gICAgICAgICAgICAgICAgJ2xlZnQnLCAndG9wJywgJ2JvdHRvbScsICdyaWdodCcsICd3aWR0aCcsICdoZWlnaHQnXG4gICAgICAgICAgICBdLmluY2x1ZGVzKGspKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWwuc3R5bGVba10gPSB2O1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGluaXRQcm92aWRlckhhbmRsZXJzKHBsdWdpbkxvY2FsKSB7XG4gICAgbGV0IF8gPSAobGFiZWwpID0+IGBwcm92aWRlcjoke2xhYmVsfWA7XG4gICAgbGV0IHRoZW1lZCA9IGZhbHNlO1xuICAgIHBsdWdpbkxvY2FsLm9uKF8oJ3RoZW1lJyksICh0aGVtZSkgPT4ge1xuICAgICAgICBwbHVnaW5Mb2NhbC50aGVtZU1nci5yZWdpc3RlclRoZW1lKHBsdWdpbkxvY2FsLmlkLCB0aGVtZSk7XG4gICAgICAgIGlmICghdGhlbWVkKSB7XG4gICAgICAgICAgICBwbHVnaW5Mb2NhbC5fZGlzcG9zZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgcGx1Z2luTG9jYWwudGhlbWVNZ3IudW5yZWdpc3RlclRoZW1lKHBsdWdpbkxvY2FsLmlkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhlbWVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHBsdWdpbkxvY2FsLm9uKF8oJ3N0eWxlJyksIChzdHlsZSkgPT4ge1xuICAgICAgICBsZXQga2V5O1xuICAgICAgICBpZiAodHlwZW9mIHN0eWxlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAga2V5ID0gc3R5bGUua2V5O1xuICAgICAgICAgICAgc3R5bGUgPSBzdHlsZS5zdHlsZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXN0eWxlIHx8ICFzdHlsZS50cmltKCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHBsdWdpbkxvY2FsLl9kaXNwb3NlKHNldHVwSW5qZWN0ZWRTdHlsZShzdHlsZSwge1xuICAgICAgICAgICAgJ2RhdGEtaW5qZWN0ZWQtc3R5bGUnOiBrZXkgPyBgJHtrZXl9LSR7cGx1Z2luTG9jYWwuaWR9YCA6ICcnLFxuICAgICAgICAgICAgJ2RhdGEtcmVmJzogcGx1Z2luTG9jYWwuaWRcbiAgICAgICAgfSkpO1xuICAgIH0pO1xuICAgIHBsdWdpbkxvY2FsLm9uKF8oJ3VpJyksICh1aSkgPT4ge1xuICAgICAgICBwbHVnaW5Mb2NhbC5fb25Ib3N0TW91bnRlZCgoKSA9PiB7XG4gICAgICAgICAgICBwbHVnaW5Mb2NhbC5fZGlzcG9zZShzZXR1cEluamVjdGVkVUkuY2FsbChwbHVnaW5Mb2NhbCwgdWksIE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgICAgICdkYXRhLXJlZic6IHBsdWdpbkxvY2FsLmlkXG4gICAgICAgICAgICB9LCB1aS5hdHRycyB8fCB7fSksICh7IGVsLCBmbG9hdCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFmbG9hdClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlkZW50aXR5ID0gZWwuZGF0YXNldC5pZGVudGl0eTtcbiAgICAgICAgICAgICAgICBwbHVnaW5Mb2NhbC5sYXlvdXRDb3JlLm1vdmVfY29udGFpbmVyX3RvX3RvcChpZGVudGl0eSk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gaW5pdEFwaVByb3h5SGFuZGxlcnMocGx1Z2luTG9jYWwpIHtcbiAgICBsZXQgXyA9IChsYWJlbCkgPT4gYGFwaToke2xhYmVsfWA7XG4gICAgcGx1Z2luTG9jYWwub24oXygnY2FsbCcpLCBhc3luYyAocGF5bG9hZCkgPT4ge1xuICAgICAgICBsZXQgcmV0O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0ID0gYXdhaXQgaW52b2tlSG9zdEV4cG9ydGVkQXBpKHBheWxvYWQubWV0aG9kLCAuLi5wYXlsb2FkLmFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXQgPSB7XG4gICAgICAgICAgICAgICAgW0xTUE1TR19FUlJPUl9UQUddOiBlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IF9zeW5jIH0gPSBwYXlsb2FkO1xuICAgICAgICBpZiAocGx1Z2luTG9jYWwuc2hhZG93KSB7XG4gICAgICAgICAgICBpZiAocGF5bG9hZC5hY3Rvcikge1xuICAgICAgICAgICAgICAgIHBheWxvYWQuYWN0b3IucmVzb2x2ZShyZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfc3luYyAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCByZXBseSA9IChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBwbHVnaW5Mb2NhbC5jYWxsZXI/LmNhbGxVc2VyTW9kZWwoTFNQTVNHX1NZTkMsIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LCBfc3luY1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFByb21pc2UucmVzb2x2ZShyZXQpLnRoZW4ocmVwbHksIHJlcGx5KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZnVuY3Rpb24gY29udmVydFRvTFNQUmVzb3VyY2UoZnVsbFVybCwgZG90UGx1Z2luUm9vdCkge1xuICAgIGlmIChkb3RQbHVnaW5Sb290ICYmXG4gICAgICAgIGZ1bGxVcmwuc3RhcnRzV2l0aChQUk9UT0NPTF9GSUxFICsgZG90UGx1Z2luUm9vdCkpIHtcbiAgICAgICAgZnVsbFVybCA9IHNhZmV0eVBhdGhKb2luKFVSTF9MU1AsIGZ1bGxVcmwuc3Vic3RyKFBST1RPQ09MX0ZJTEUubGVuZ3RoICsgZG90UGx1Z2luUm9vdC5sZW5ndGgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bGxVcmw7XG59XG5jbGFzcyBJbGxlZ2FsUGx1Z2luUGFja2FnZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UpIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSk7XG4gICAgICAgIHRoaXMubmFtZSA9IElsbGVnYWxQbHVnaW5QYWNrYWdlRXJyb3IubmFtZTtcbiAgICB9XG59XG5jbGFzcyBFeGlzdGVkSW1wb3J0ZWRQbHVnaW5QYWNrYWdlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5uYW1lID0gRXhpc3RlZEltcG9ydGVkUGx1Z2luUGFja2FnZUVycm9yLm5hbWU7XG4gICAgfVxufVxuLyoqXG4gKiBIb3N0IHBsdWdpbiBmb3IgbG9jYWxcbiAqL1xuY2xhc3MgUGx1Z2luTG9jYWwgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIF9vcHRpb25zO1xuICAgIF90aGVtZU1ncjtcbiAgICBfY3R4O1xuICAgIF9kaXNwb3NlcyA9IFtdO1xuICAgIF9pZDtcbiAgICBfc3RhdHVzID0gUGx1Z2luTG9jYWxMb2FkU3RhdHVzLlVOTE9BREVEO1xuICAgIF9sb2FkRXJyO1xuICAgIF9sb2NhbFJvb3Q7XG4gICAgX2RvdFNldHRpbmdzRmlsZTtcbiAgICBfY2FsbGVyO1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSBfb3B0aW9uc1xuICAgICAqIEBwYXJhbSBfdGhlbWVNZ3JcbiAgICAgKiBAcGFyYW0gX2N0eFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKF9vcHRpb25zLCBfdGhlbWVNZ3IsIF9jdHgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fb3B0aW9ucyA9IF9vcHRpb25zO1xuICAgICAgICB0aGlzLl90aGVtZU1nciA9IF90aGVtZU1ncjtcbiAgICAgICAgdGhpcy5fY3R4ID0gX2N0eDtcbiAgICAgICAgdGhpcy5faWQgPSBfb3B0aW9ucy5rZXkgfHwgZ2VuSUQoKTtcbiAgICAgICAgaW5pdFVzZXJTZXR0aW5nc0hhbmRsZXJzKHRoaXMpO1xuICAgICAgICBpbml0TWFpblVJSGFuZGxlcnModGhpcyk7XG4gICAgICAgIGluaXRQcm92aWRlckhhbmRsZXJzKHRoaXMpO1xuICAgICAgICBpbml0QXBpUHJveHlIYW5kbGVycyh0aGlzKTtcbiAgICB9XG4gICAgYXN5bmMgX3NldHVwVXNlclNldHRpbmdzKCkge1xuICAgICAgICBjb25zdCB7IF9vcHRpb25zIH0gPSB0aGlzO1xuICAgICAgICBjb25zdCBsb2dnZXIgPSBfb3B0aW9ucy5sb2dnZXIgPSBuZXcgUGx1Z2luTG9nZ2VyKCdMb2FkZXInKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IFt1c2VyU2V0dGluZ3NGaWxlUGF0aCwgdXNlclNldHRpbmdzXSA9IGF3YWl0IGludm9rZUhvc3RFeHBvcnRlZEFwaSgnbG9hZF9wbHVnaW5fdXNlcl9zZXR0aW5ncycsIHRoaXMuaWQpO1xuICAgICAgICAgICAgdGhpcy5fZG90U2V0dGluZ3NGaWxlID0gdXNlclNldHRpbmdzRmlsZVBhdGg7XG4gICAgICAgICAgICBjb25zdCBzZXR0aW5ncyA9IF9vcHRpb25zLnNldHRpbmdzID0gbmV3IFBsdWdpblNldHRpbmdzKHVzZXJTZXR0aW5ncyk7XG4gICAgICAgICAgICAvLyBvYnNlcnZlIHNldHRpbmdzXG4gICAgICAgICAgICBzZXR0aW5ncy5vbignY2hhbmdlJywgKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICBkZWJ1ZygnbGlua2VkIHNldHRpbmdzIGNoYW5nZScsIGEpO1xuICAgICAgICAgICAgICAgIGlmICghYS5kaXNhYmxlZCAmJiBiLmRpc2FibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVuYWJsZSBwbHVnaW5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhLmRpc2FibGVkICYmICFiLmRpc2FibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIERpc2FibGUgcGx1Z2luXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudW5sb2FkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhKSB7XG4gICAgICAgICAgICAgICAgICAgIGludm9rZUhvc3RFeHBvcnRlZEFwaShgc2F2ZV9wbHVnaW5fdXNlcl9zZXR0aW5nc2AsIHRoaXMuaWQsIGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBkZWJ1ZygnW2xvYWQgcGx1Z2luIHVzZXIgc2V0dGluZ3MgRXJyb3JdJywgZSk7XG4gICAgICAgICAgICBsb2dnZXI/LmVycm9yKGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldE1haW5VSUNvbnRhaW5lcigpIHtcbiAgICAgICAgaWYgKHRoaXMuc2hhZG93KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWxsZXI/Ll9nZXRTYW5kYm94U2hhZG93Q29udGFpbmVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY2FsbGVyPy5fZ2V0U2FuZGJveElmcmFtZUNvbnRhaW5lcigpO1xuICAgIH1cbiAgICBfcmVzb2x2ZVJlc291cmNlRnVsbFVybChmaWxlUGF0aCwgbG9jYWxSb290KSB7XG4gICAgICAgIGlmICghZmlsZVBhdGg/LnRyaW0oKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbG9jYWxSb290ID0gbG9jYWxSb290IHx8IHRoaXMuX2xvY2FsUm9vdDtcbiAgICAgICAgY29uc3QgcmVnID0gL14oaHR0cHxmaWxlKS87XG4gICAgICAgIGlmICghcmVnLnRlc3QoZmlsZVBhdGgpKSB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSBwYXRoLmpvaW4obG9jYWxSb290LCBmaWxlUGF0aCk7XG4gICAgICAgICAgICBmaWxlUGF0aCA9IHJlZy50ZXN0KHVybCkgPyB1cmwgOiAoUFJPVE9DT0xfRklMRSArIHVybCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICghdGhpcy5vcHRpb25zLmVmZmVjdCAmJiB0aGlzLmlzSW5zdGFsbGVkSW5Eb3RSb290KSA/XG4gICAgICAgICAgICBjb252ZXJ0VG9MU1BSZXNvdXJjZShmaWxlUGF0aCwgdGhpcy5kb3RQbHVnaW5zUm9vdCkgOiBmaWxlUGF0aDtcbiAgICB9XG4gICAgYXN5bmMgX3ByZXBhcmVQYWNrYWdlQ29uZmlncygpIHtcbiAgICAgICAgY29uc3QgeyB1cmwgfSA9IHRoaXMuX29wdGlvbnM7XG4gICAgICAgIGxldCBwa2c7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIXVybCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG5vdCByZXNvbHZlIHBhY2thZ2UgY29uZmlnIGxvY2F0aW9uJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWJ1ZygncHJlcGFyZSBwYWNrYWdlIHJvb3QnLCB1cmwpO1xuICAgICAgICAgICAgcGtnID0gYXdhaXQgaW52b2tlSG9zdEV4cG9ydGVkQXBpKCdsb2FkX3BsdWdpbl9jb25maWcnLCB1cmwpO1xuICAgICAgICAgICAgaWYgKCFwa2cgfHwgKHBrZyA9IEpTT04ucGFyc2UocGtnKSwgIXBrZykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhcnNlIHBhY2thZ2UgY29uZmlnIGVycm9yICMke3VybH0vcGFja2FnZS5qc29uYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBJbGxlZ2FsUGx1Z2luUGFja2FnZUVycm9yKGUubWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbG9jYWxSb290ID0gdGhpcy5fbG9jYWxSb290ID0gc2FmZXR5UGF0aE5vcm1hbGl6ZSh1cmwpO1xuICAgICAgICBjb25zdCBsb2dzZXEgPSBwa2cubG9nc2VxIHx8IHt9O1xuICAgICAgICBbJ25hbWUnLCAnYXV0aG9yJywgJ3JlcG9zaXRvcnknLCAndmVyc2lvbicsXG4gICAgICAgICAgICAnZGVzY3JpcHRpb24nLCAncmVwbycsICd0aXRsZScsICdlZmZlY3QnLFxuICAgICAgICBdLmNvbmNhdCghdGhpcy5pc0luc3RhbGxlZEluRG90Um9vdCA/IFsnZGV2RW50cnknXSA6IFtdKS5mb3JFYWNoKGsgPT4ge1xuICAgICAgICAgICAgdGhpcy5fb3B0aW9uc1trXSA9IHBrZ1trXTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHZhbGlkYXRlRW50cnkgPSAobWFpbikgPT4gbWFpbiAmJiAvXFwuKGpzfGh0bWwpJC8udGVzdChtYWluKTtcbiAgICAgICAgLy8gRW50cnkgZnJvbSBtYWluXG4gICAgICAgIGNvbnN0IGVudHJ5ID0gbG9nc2VxLmVudHJ5IHx8IGxvZ3NlcS5tYWluIHx8IHBrZy5tYWluO1xuICAgICAgICBpZiAodmFsaWRhdGVFbnRyeShlbnRyeSkpIHsgLy8gVGhlbWUgaGFzIG5vIG1haW5cbiAgICAgICAgICAgIHRoaXMuX29wdGlvbnMuZW50cnkgPSB0aGlzLl9yZXNvbHZlUmVzb3VyY2VGdWxsVXJsKGVudHJ5LCBsb2NhbFJvb3QpO1xuICAgICAgICAgICAgdGhpcy5fb3B0aW9ucy5kZXZFbnRyeSA9IGxvZ3NlcS5kZXZFbnRyeTtcbiAgICAgICAgICAgIGlmIChsb2dzZXEubW9kZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX29wdGlvbnMubW9kZSA9IGxvZ3NlcS5tb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRpdGxlID0gbG9nc2VxLnRpdGxlIHx8IHBrZy50aXRsZTtcbiAgICAgICAgY29uc3QgaWNvbiA9IGxvZ3NlcS5pY29uIHx8IHBrZy5pY29uO1xuICAgICAgICB0aGlzLl9vcHRpb25zLnRpdGxlID0gdGl0bGU7XG4gICAgICAgIHRoaXMuX29wdGlvbnMuaWNvbiA9IGljb24gJiZcbiAgICAgICAgICAgIHRoaXMuX3Jlc29sdmVSZXNvdXJjZUZ1bGxVcmwoaWNvbik7XG4gICAgICAgIC8vIFRPRE86IHN0cmF0ZWd5IGZvciBMb2dzZXEgcGx1Z2lucyBjZW50ZXJcbiAgICAgICAgaWYgKHRoaXMuaXNJbnN0YWxsZWRJbkRvdFJvb3QpIHtcbiAgICAgICAgICAgIHRoaXMuX2lkID0gcGF0aC5iYXNlbmFtZShsb2NhbFJvb3QpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKGxvZ3NlcS5pZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2lkID0gbG9nc2VxLmlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbG9nc2VxLmlkID0gdGhpcy5pZDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBpbnZva2VIb3N0RXhwb3J0ZWRBcGkoJ3NhdmVfcGx1Z2luX2NvbmZpZycsIHVybCwgeyAuLi5wa2csIGxvZ3NlcSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoJ1tzYXZlIHBsdWdpbiBJRCBFcnJvcl0gJywgZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFZhbGlkYXRlIGlkXG4gICAgICAgIGNvbnN0IHsgcmVnaXN0ZXJlZFBsdWdpbnMsIGlzUmVnaXN0ZXJpbmcgfSA9IHRoaXMuX2N0eDtcbiAgICAgICAgaWYgKGlzUmVnaXN0ZXJpbmcgJiYgcmVnaXN0ZXJlZFBsdWdpbnMuaGFzKGxvZ3NlcS5pZCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFeGlzdGVkSW1wb3J0ZWRQbHVnaW5QYWNrYWdlRXJyb3IoJ3ByZXBhcmUgcGFja2FnZSBFcnJvcicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIDAuIEluc3RhbGwgVGhlbWVzXG4gICAgICAgICAgICAgICAgbGV0IHRoZW1lcyA9IGxvZ3NlcS50aGVtZXM7XG4gICAgICAgICAgICAgICAgaWYgKHRoZW1lcykge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9sb2FkQ29uZmlnVGhlbWVzKEFycmF5LmlzQXJyYXkodGhlbWVzKSA/IHRoZW1lcyA6IFt0aGVtZXNdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGRlYnVnKCdbcHJlcGFyZSBwYWNrYWdlIGVmZmVjdCBFcnJvcl0nLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgYXN5bmMgX3RyeVRvTm9ybWFsaXplRW50cnkoKSB7XG4gICAgICAgIGxldCB7IGVudHJ5LCBzZXR0aW5ncywgZGV2RW50cnkgfSA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgZGV2RW50cnkgPSBkZXZFbnRyeSB8fCBzZXR0aW5ncz8uZ2V0KCdfZGV2RW50cnknKTtcbiAgICAgICAgaWYgKGRldkVudHJ5KSB7XG4gICAgICAgICAgICB0aGlzLl9vcHRpb25zLmVudHJ5ID0gZGV2RW50cnk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFlbnRyeS5lbmRzV2l0aCgnLmpzJykpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBkaXJQYXRoSW5zdGFsbGVkID0gbnVsbDtcbiAgICAgICAgbGV0IHRtcF9maWxlX21ldGhvZCA9ICd3cml0ZV91c2VyX3RtcF9maWxlJztcbiAgICAgICAgaWYgKHRoaXMuaXNJbnN0YWxsZWRJbkRvdFJvb3QpIHtcbiAgICAgICAgICAgIHRtcF9maWxlX21ldGhvZCA9ICd3cml0ZV9kb3RkaXJfZmlsZSc7XG4gICAgICAgICAgICBkaXJQYXRoSW5zdGFsbGVkID0gdGhpcy5fbG9jYWxSb290LnJlcGxhY2UodGhpcy5kb3RQbHVnaW5zUm9vdCwgJycpO1xuICAgICAgICAgICAgZGlyUGF0aEluc3RhbGxlZCA9IHBhdGguam9pbihESVJfUExVR0lOUywgZGlyUGF0aEluc3RhbGxlZCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNka1BhdGhSb290ID0gYXdhaXQgZ2V0U0RLUGF0aFJvb3QoKTtcbiAgICAgICAgbGV0IGVudHJ5UGF0aCA9IGF3YWl0IGludm9rZUhvc3RFeHBvcnRlZEFwaSh0bXBfZmlsZV9tZXRob2QsIGAke3RoaXMuX2lkfV9pbmRleC5odG1sYCwgYDwhZG9jdHlwZSBodG1sPlxuPGh0bWwgbGFuZz1cImVuXCI+XG4gIDxoZWFkPlxuICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiPlxuICAgIDx0aXRsZT5sb2dzZXEgcGx1Z2luIGVudHJ5PC90aXRsZT5cbiAgICA8c2NyaXB0IHNyYz1cIiR7c2RrUGF0aFJvb3R9L2xzcGx1Z2luLnVzZXIuanNcIj48L3NjcmlwdD5cbiAgPC9oZWFkPlxuICA8Ym9keT5cbiAgPGRpdiBpZD1cImFwcFwiPjwvZGl2PlxuICA8c2NyaXB0IHNyYz1cIiR7ZW50cnl9XCI+PC9zY3JpcHQ+XG4gIDwvYm9keT5cbjwvaHRtbD5gLCBkaXJQYXRoSW5zdGFsbGVkKTtcbiAgICAgICAgZW50cnkgPSBjb252ZXJ0VG9MU1BSZXNvdXJjZSh3aXRoRmlsZVByb3RvY29sKHBhdGgubm9ybWFsaXplKGVudHJ5UGF0aCkpLCB0aGlzLmRvdFBsdWdpbnNSb290KTtcbiAgICAgICAgdGhpcy5fb3B0aW9ucy5lbnRyeSA9IGVudHJ5O1xuICAgIH1cbiAgICBhc3luYyBfbG9hZENvbmZpZ1RoZW1lcyh0aGVtZXMpIHtcbiAgICAgICAgdGhlbWVzLmZvckVhY2goKG9wdGlvbnMpID0+IHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy51cmwpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnVybC5zdGFydHNXaXRoKCdodHRwJykgJiYgdGhpcy5fbG9jYWxSb290KSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51cmwgPSBwYXRoLmpvaW4odGhpcy5fbG9jYWxSb290LCBvcHRpb25zLnVybCk7XG4gICAgICAgICAgICAgICAgLy8gZmlsZTovLyBmb3IgbmF0aXZlXG4gICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLnVybC5zdGFydHNXaXRoKCdmaWxlOicpKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMudXJsID0gJ2Fzc2V0czovLycgKyBvcHRpb25zLnVybDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3Byb3ZpZGVyOnRoZW1lJywgb3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfcGVyc2lzdE1haW5VSUxheW91dERhdGEoZSkge1xuICAgICAgICBjb25zdCBsYXlvdXRzID0gdGhpcy5zZXR0aW5ncy5nZXQoJ2xheW91dHMnKSB8fCBbXTtcbiAgICAgICAgbGF5b3V0c1swXSA9IGU7XG4gICAgICAgIHRoaXMuc2V0dGluZ3Muc2V0KCdsYXlvdXQnLCBsYXlvdXRzKTtcbiAgICB9XG4gICAgX3NldHVwRHJhZ2dhYmxlQ29udGFpbmVyKGVsLCBvcHRzID0ge30pIHtcbiAgICAgICAgY29uc3QgZHMgPSBlbC5kYXRhc2V0O1xuICAgICAgICBpZiAoZHMuaW5pdGVkX2RyYWdnYWJsZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKCFkcy5pZGVudGl0eSkge1xuICAgICAgICAgICAgZHMuaWRlbnRpdHkgPSAnZGQtJyArIGdlbklEKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaXNJbmplY3RlZFVJID0gISFvcHRzLmtleTtcbiAgICAgICAgY29uc3QgaGFuZGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGhhbmRsZS5jbGFzc0xpc3QuYWRkKCdkcmFnZ2FibGUtaGFuZGxlJyk7XG4gICAgICAgIGhhbmRsZS5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwidGhcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImxcIj48aDM+JHtvcHRzLnRpdGxlIHx8ICcnfTwvaDM+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJyXCI+XG4gICAgICAgICAgPGEgY2xhc3M9XCJidXR0b24geFwiPjxpIGNsYXNzPVwidGkgdGkteFwiPjwvaT48L2E+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgYDtcbiAgICAgICAgaGFuZGxlLnF1ZXJ5U2VsZWN0b3IoJy54JylcbiAgICAgICAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBvcHRzPy5jbG9zZT8uKCk7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIGhhbmRsZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBpZiAodGFyZ2V0Py5jbG9zZXN0KCcucicpKSB7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIGVsLnByZXBlbmQoaGFuZGxlKTtcbiAgICAgICAgLy8gbW92ZSB0byB0b3BcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0Q29yZS5tb3ZlX2NvbnRhaW5lcl90b190b3AoZHMuaWRlbnRpdHkpO1xuICAgICAgICB9LCB0cnVlKTtcbiAgICAgICAgY29uc3Qgc2V0VGl0bGUgPSAodGl0bGUpID0+IHtcbiAgICAgICAgICAgIGhhbmRsZS5xdWVyeVNlbGVjdG9yKCdoMycpLnRleHRDb250ZW50ID0gdGl0bGU7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGRpc3Bvc2UgPSB0aGlzLmxheW91dENvcmUuc2V0dXBfZHJhZ2dhYmxlX2NvbnRhaW5lcl9CQU5HXyhlbCwgIWlzSW5qZWN0ZWRVSSA/IHRoaXMuX3BlcnNpc3RNYWluVUlMYXlvdXREYXRhLmJpbmQodGhpcykgOiAoKSA9PiB7IH0pO1xuICAgICAgICBkcy5pbml0ZWRfZHJhZ2dhYmxlID0gJ3RydWUnO1xuICAgICAgICBpZiAob3B0cy50aXRsZSkge1xuICAgICAgICAgICAgc2V0VGl0bGUob3B0cy50aXRsZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY2xpY2sgb3V0c2lkZVxuICAgICAgICBsZXQgcmVtb3ZlT3V0c2lkZUxpc3RlbmVyID0gbnVsbDtcbiAgICAgICAgaWYgKGRzLmNsb3NlID09PSAnb3V0c2lkZScpIHtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICAgICAgICAgIGlmICghZWwuY29udGFpbnModGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgICAgICBvcHRzLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICAgICAgcmVtb3ZlT3V0c2lkZUxpc3RlbmVyID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBkaXNwb3NlKCk7XG4gICAgICAgICAgICByZW1vdmVPdXRzaWRlTGlzdGVuZXI/LigpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBfc2V0dXBSZXNpemFibGVDb250YWluZXIoZWwsIGtleSkge1xuICAgICAgICBjb25zdCBkcyA9IGVsLmRhdGFzZXQ7XG4gICAgICAgIGlmIChkcy5pbml0ZWRfcmVzaXphYmxlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoIWRzLmlkZW50aXR5KSB7XG4gICAgICAgICAgICBkcy5pZGVudGl0eSA9ICdkZC0nICsgZ2VuSUQoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoYW5kbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgaGFuZGxlLmNsYXNzTGlzdC5hZGQoJ3Jlc2l6YWJsZS1oYW5kbGUnKTtcbiAgICAgICAgZWwucHJlcGVuZChoYW5kbGUpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGxheW91dENvcmUgPSB3aW5kb3cuZnJvbnRlbmQubW9kdWxlcy5sYXlvdXQuY29yZTtcbiAgICAgICAgY29uc3QgZGlzcG9zZSA9IGxheW91dENvcmUuc2V0dXBfcmVzaXphYmxlX2NvbnRhaW5lcl9CQU5HXyhlbCwgIWtleSA/IHRoaXMuX3BlcnNpc3RNYWluVUlMYXlvdXREYXRhLmJpbmQodGhpcykgOiAoKSA9PiB7IH0pO1xuICAgICAgICBkcy5pbml0ZWRfcmVzaXphYmxlID0gJ3RydWUnO1xuICAgICAgICByZXR1cm4gZGlzcG9zZTtcbiAgICB9XG4gICAgYXN5bmMgbG9hZChyZWFkeUluZGljYXRvcikge1xuICAgICAgICBpZiAodGhpcy5wZW5kaW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3RhdHVzID0gUGx1Z2luTG9jYWxMb2FkU3RhdHVzLkxPQURJTkc7XG4gICAgICAgIHRoaXMuX2xvYWRFcnIgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBpZiAoIXRoaXMub3B0aW9ucy5lbnRyeSkgeyAvLyBUaGVtZXMgcGFja2FnZSBubyBlbnRyeSBmaWVsZFxuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgbGV0IGluc3RhbGxQYWNrYWdlVGhlbWVzID0gYXdhaXQgdGhpcy5fcHJlcGFyZVBhY2thZ2VDb25maWdzKCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9zZXR1cFVzZXJTZXR0aW5ncygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVkKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgaW5zdGFsbFBhY2thZ2VUaGVtZXMuY2FsbChudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmRpc2FibGVkIHx8ICF0aGlzLm9wdGlvbnMuZW50cnkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl90cnlUb05vcm1hbGl6ZUVudHJ5KCk7XG4gICAgICAgICAgICB0aGlzLl9jYWxsZXIgPSBuZXcgTFNQbHVnaW5DYWxsZXIodGhpcyk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9jYWxsZXIuY29ubmVjdFRvQ2hpbGQoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlYWR5Rm4gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2FsbGVyPy5jYWxsVXNlck1vZGVsKExTUE1TR19SRUFEWSwgeyBwaWQ6IHRoaXMuaWQgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHJlYWR5SW5kaWNhdG9yKSB7XG4gICAgICAgICAgICAgICAgcmVhZHlJbmRpY2F0b3IucHJvbWlzZS50aGVuKHJlYWR5Rm4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVhZHlGbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zZXMucHVzaChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fY2FsbGVyPy5kZXN0cm95KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZGVidWcoJ1tMb2FkIFBsdWdpbiBFcnJvcl0gJywgZSk7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlcj8uZXJyb3IoZSk7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSBQbHVnaW5Mb2NhbExvYWRTdGF0dXMuRVJST1I7XG4gICAgICAgICAgICB0aGlzLl9sb2FkRXJyID0gZTtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fbG9hZEVycikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IFBsdWdpbkxvY2FsTG9hZFN0YXR1cy5VTkxPQURFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IFBsdWdpbkxvY2FsTG9hZFN0YXR1cy5MT0FERUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHJlbG9hZCgpIHtcbiAgICAgICAgaWYgKHRoaXMucGVuZGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2N0eC5lbWl0KCdiZWZvcmVyZWxvYWQnLCB0aGlzKTtcbiAgICAgICAgYXdhaXQgdGhpcy51bmxvYWQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkKCk7XG4gICAgICAgIHRoaXMuX2N0eC5lbWl0KCdyZWxvYWRlZCcsIHRoaXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gdW5yZWdpc3RlciBJZiB0cnVlIGRlbGV0ZSBwbHVnaW4gZmlsZXNcbiAgICAgKi9cbiAgICBhc3luYyB1bmxvYWQodW5yZWdpc3RlciA9IGZhbHNlKSB7XG4gICAgICAgIGlmICh0aGlzLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodW5yZWdpc3Rlcikge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51bmxvYWQoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzSW5zdGFsbGVkSW5Eb3RSb290KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3R4LmVtaXQoJ3VubGluay1wbHVnaW4nLCB0aGlzLmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5fc3RhdHVzID0gUGx1Z2luTG9jYWxMb2FkU3RhdHVzLlVOTE9BRElORztcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50QmVmb3JlVW5sb2FkID0geyB1bnJlZ2lzdGVyIH07XG4gICAgICAgICAgICAvLyBzeW5jIGNhbGxcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fY2FsbGVyPy5jYWxsVXNlck1vZGVsKEFXQUlUX0xTUE1TR0ZuKExTUE1TR19CRUZPUkVfVU5MT0FEKSwgZXZlbnRCZWZvcmVVbmxvYWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnYmVmb3JldW5sb2FkJywgZXZlbnRCZWZvcmVVbmxvYWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbYmVmb3JldW5sb2FkIEVycm9yXScsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3VubG9hZGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGRlYnVnKCdbcGx1Z2luIHVubG9hZCBFcnJvcl0nLCBlKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IFBsdWdpbkxvY2FsTG9hZFN0YXR1cy5VTkxPQURFRDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBkaXNwb3NlKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGZuIG9mIHRoaXMuX2Rpc3Bvc2VzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZuICYmIChhd2FpdCBmbigpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLmRlYnVnVGFnLCAnZGlzcG9zZSBFcnJvcicsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGNsZWFyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2VzID0gW107XG4gICAgfVxuICAgIF9kaXNwb3NlKGZuKSB7XG4gICAgICAgIGlmICghZm4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2VzLnB1c2goZm4pO1xuICAgIH1cbiAgICBfb25Ib3N0TW91bnRlZChjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBhY3RvciA9IHRoaXMuX2N0eC5ob3N0TW91bnRlZEFjdG9yO1xuICAgICAgICBpZiAoIWFjdG9yIHx8IGFjdG9yLnNldHRsZWQpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhY3Rvcj8ucHJvbWlzZS50aGVuKGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgbGF5b3V0Q29yZSgpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gd2luZG93LmZyb250ZW5kLm1vZHVsZXMubGF5b3V0LmNvcmU7XG4gICAgfVxuICAgIGdldCBpc0luc3RhbGxlZEluRG90Um9vdCgpIHtcbiAgICAgICAgY29uc3QgZG90Um9vdCA9IHRoaXMuZG90Q29uZmlnUm9vdDtcbiAgICAgICAgY29uc3QgcGxnUm9vdCA9IHRoaXMubG9jYWxSb290O1xuICAgICAgICByZXR1cm4gZG90Um9vdCAmJiBwbGdSb290ICYmIHBsZ1Jvb3Quc3RhcnRzV2l0aChkb3RSb290KTtcbiAgICB9XG4gICAgZ2V0IGxvYWRlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PT0gUGx1Z2luTG9jYWxMb2FkU3RhdHVzLkxPQURFRDtcbiAgICB9XG4gICAgZ2V0IHBlbmRpbmcoKSB7XG4gICAgICAgIHJldHVybiBbUGx1Z2luTG9jYWxMb2FkU3RhdHVzLkxPQURJTkcsIFBsdWdpbkxvY2FsTG9hZFN0YXR1cy5VTkxPQURJTkddXG4gICAgICAgICAgICAuaW5jbHVkZXModGhpcy5fc3RhdHVzKTtcbiAgICB9XG4gICAgZ2V0IHN0YXR1cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1cztcbiAgICB9XG4gICAgZ2V0IHNldHRpbmdzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLnNldHRpbmdzO1xuICAgIH1cbiAgICBnZXQgbG9nZ2VyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmxvZ2dlcjtcbiAgICB9XG4gICAgZ2V0IGRpc2FibGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncz8uZ2V0KCdkaXNhYmxlZCcpO1xuICAgIH1cbiAgICBnZXQgY2FsbGVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2FsbGVyO1xuICAgIH1cbiAgICBnZXQgaWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pZDtcbiAgICB9XG4gICAgZ2V0IHNoYWRvdygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5tb2RlID09PSAnc2hhZG93JztcbiAgICB9XG4gICAgZ2V0IG9wdGlvbnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vcHRpb25zO1xuICAgIH1cbiAgICBnZXQgdGhlbWVNZ3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90aGVtZU1ncjtcbiAgICB9XG4gICAgZ2V0IGRlYnVnVGFnKCkge1xuICAgICAgICBjb25zdCBuYW1lID0gdGhpcy5fb3B0aW9ucz8ubmFtZTtcbiAgICAgICAgcmV0dXJuIGAjJHt0aGlzLl9pZH0gJHtuYW1lID8/ICcnfWA7XG4gICAgfVxuICAgIGdldCBsb2NhbFJvb3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb2NhbFJvb3QgfHwgdGhpcy5fb3B0aW9ucy51cmw7XG4gICAgfVxuICAgIGdldCBsb2FkRXJyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbG9hZEVycjtcbiAgICB9XG4gICAgZ2V0IGRvdENvbmZpZ1Jvb3QoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLm5vcm1hbGl6ZSh0aGlzLl9jdHgub3B0aW9ucy5kb3RDb25maWdSb290KTtcbiAgICB9XG4gICAgZ2V0IGRvdFNldHRpbmdzRmlsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RvdFNldHRpbmdzRmlsZTtcbiAgICB9XG4gICAgZ2V0IGRvdFBsdWdpbnNSb290KCkge1xuICAgICAgICByZXR1cm4gcGF0aC5qb2luKHRoaXMuZG90Q29uZmlnUm9vdCwgRElSX1BMVUdJTlMpO1xuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGNvbnN0IGpzb24gPSB7IC4uLnRoaXMub3B0aW9ucyB9O1xuICAgICAgICBqc29uLmlkID0gdGhpcy5pZDtcbiAgICAgICAganNvbi5lcnIgPSB0aGlzLmxvYWRFcnI7XG4gICAgICAgIGpzb24udXNmID0gdGhpcy5kb3RTZXR0aW5nc0ZpbGU7XG4gICAgICAgIGpzb24uaWlyID0gdGhpcy5pc0luc3RhbGxlZEluRG90Um9vdDtcbiAgICAgICAganNvbi5sc3IgPSB0aGlzLl9yZXNvbHZlUmVzb3VyY2VGdWxsVXJsKCcnKTtcbiAgICAgICAgcmV0dXJuIGpzb247XG4gICAgfVxufVxuLyoqXG4gKiBIb3N0IHBsdWdpbiBjb3JlXG4gKi9cbmNsYXNzIExTUGx1Z2luQ29yZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgX29wdGlvbnM7XG4gICAgX2lzUmVnaXN0ZXJpbmcgPSBmYWxzZTtcbiAgICBfcmVhZHlJbmRpY2F0b3I7XG4gICAgX2hvc3RNb3VudGVkQWN0b3IgPSBkZWZlcnJlZCgpO1xuICAgIF91c2VyUHJlZmVyZW5jZXMgPSB7fTtcbiAgICBfcmVnaXN0ZXJlZFRoZW1lcyA9IG5ldyBNYXAoKTtcbiAgICBfcmVnaXN0ZXJlZFBsdWdpbnMgPSBuZXcgTWFwKCk7XG4gICAgX2N1cnJlbnRUaGVtZTtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0gX29wdGlvbnNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihfb3B0aW9ucykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9vcHRpb25zID0gX29wdGlvbnM7XG4gICAgfVxuICAgIGFzeW5jIGxvYWRVc2VyUHJlZmVyZW5jZXMoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzZXR0aW5ncyA9IGF3YWl0IGludm9rZUhvc3RFeHBvcnRlZEFwaShgbG9hZF91c2VyX3ByZWZlcmVuY2VzYCk7XG4gICAgICAgICAgICBpZiAoc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMuX3VzZXJQcmVmZXJlbmNlcywgc2V0dGluZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBkZWJ1ZygnW2xvYWQgdXNlciBwcmVmZXJlbmNlcyBFcnJvcl0nLCBlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBzYXZlVXNlclByZWZlcmVuY2VzKHNldHRpbmdzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMuX3VzZXJQcmVmZXJlbmNlcywgc2V0dGluZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgaW52b2tlSG9zdEV4cG9ydGVkQXBpKGBzYXZlX3VzZXJfcHJlZmVyZW5jZXNgLCB0aGlzLl91c2VyUHJlZmVyZW5jZXMpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBkZWJ1ZygnW3NhdmUgdXNlciBwcmVmZXJlbmNlcyBFcnJvcl0nLCBlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBhY3RpdmF0ZVVzZXJQcmVmZXJlbmNlcygpIHtcbiAgICAgICAgY29uc3QgeyB0aGVtZSB9ID0gdGhpcy5fdXNlclByZWZlcmVuY2VzO1xuICAgICAgICAvLyAwLiB0aGVtZVxuICAgICAgICBpZiAodGhlbWUpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VsZWN0VGhlbWUodGhlbWUsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gcGx1Z2luc1xuICAgICAqIEBwYXJhbSBpbml0aWFsXG4gICAgICovXG4gICAgYXN5bmMgcmVnaXN0ZXIocGx1Z2lucywgaW5pdGlhbCA9IGZhbHNlKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShwbHVnaW5zKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWdpc3RlcihbcGx1Z2luc10pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBlcmZUYWJsZSA9IG5ldyBNYXAoKTtcbiAgICAgICAgY29uc3QgZGVidWdQZXJmSW5mbyA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBBcnJheS5mcm9tKHBlcmZUYWJsZS52YWx1ZXMoKSkucmVkdWNlKChhYywgaXQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IG9wdGlvbnMsIHN0YXR1cywgZGlzYWJsZWQgfSA9IGl0Lm87XG4gICAgICAgICAgICAgICAgYWNbaXQuby5pZF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZW50cnk6IG9wdGlvbnMuZW50cnksXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiB0eXBlb2YgZGlzYWJsZWQgPT09ICdib29sZWFuJyA/ICghZGlzYWJsZWQgPyAn8J+foicgOiAn4pqr77iPJykgOiAn8J+UtCcsXG4gICAgICAgICAgICAgICAgICAgIHBlcmY6ICFpdC5lID8gaXQuby5sb2FkRXJyIDogYCR7KGl0LmUgLSBpdC5zKS50b0ZpeGVkKDIpfW1zYFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjO1xuICAgICAgICAgICAgfSwge30pO1xuICAgICAgICAgICAgY29uc29sZS50YWJsZShkYXRhKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB3aW5kb3cuX19kZWJ1Z1BsdWdpbnNQZXJmSW5mbyA9IGRlYnVnUGVyZkluZm87XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLl9pc1JlZ2lzdGVyaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJDb25maWdSb290ID0gdGhpcy5fb3B0aW9ucy5kb3RDb25maWdSb290O1xuICAgICAgICAgICAgY29uc3QgcmVhZHlJbmRpY2F0b3IgPSB0aGlzLl9yZWFkeUluZGljYXRvciA9IGRlZmVycmVkKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWRVc2VyUHJlZmVyZW5jZXMoKTtcbiAgICAgICAgICAgIGNvbnN0IGV4dGVybmFscyA9IG5ldyBTZXQodGhpcy5fdXNlclByZWZlcmVuY2VzLmV4dGVybmFscyB8fCBbXSk7XG4gICAgICAgICAgICBpZiAoaW5pdGlhbCkge1xuICAgICAgICAgICAgICAgIHBsdWdpbnMgPSBwbHVnaW5zLmNvbmNhdChbLi4uZXh0ZXJuYWxzXS5maWx0ZXIodXJsID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICFwbHVnaW5zLmxlbmd0aCB8fCBwbHVnaW5zLmV2ZXJ5KChwKSA9PiAhcC5lbnRyeSAmJiAocC51cmwgIT09IHVybCkpO1xuICAgICAgICAgICAgICAgIH0pLm1hcCh1cmwgPT4gKHsgdXJsIH0pKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBsdWdpbk9wdGlvbnMgb2YgcGx1Z2lucykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgdXJsIH0gPSBwbHVnaW5PcHRpb25zO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsdWdpbkxvY2FsID0gbmV3IFBsdWdpbkxvY2FsKHBsdWdpbk9wdGlvbnMsIHRoaXMsIHRoaXMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBlcmZJbmZvID0geyBvOiBwbHVnaW5Mb2NhbCwgczogcGVyZm9ybWFuY2Uubm93KCksIGU6IDAgfTtcbiAgICAgICAgICAgICAgICBwZXJmVGFibGUuc2V0KHBsdWdpbkxvY2FsLmlkLCBwZXJmSW5mbyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luTG9jYWwubG9hZChyZWFkeUluZGljYXRvcik7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBsb2FkRXJyIH0gPSBwbHVnaW5Mb2NhbDtcbiAgICAgICAgICAgICAgICBpZiAobG9hZEVycikge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgW0ZhaWxlZCBMT0FEIFBsdWdpbl0gI2AsIHBsdWdpbk9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgbG9hZEVycik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkRXJyIGluc3RhbmNlb2YgSWxsZWdhbFBsdWdpblBhY2thZ2VFcnJvciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZEVyciBpbnN0YW5jZW9mIEV4aXN0ZWRJbXBvcnRlZFBsdWdpblBhY2thZ2VFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogbm90aWZ5IGdsb2JhbCBsb2cgc3lzdGVtP1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGVyZkluZm8uZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICAgICAgICAgIHBsdWdpbkxvY2FsLnNldHRpbmdzPy5vbignY2hhbmdlJywgKGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdzZXR0aW5ncy1jaGFuZ2VkJywgcGx1Z2luTG9jYWwuaWQsIGEpO1xuICAgICAgICAgICAgICAgICAgICBwbHVnaW5Mb2NhbC5jYWxsZXI/LmNhbGxVc2VyTW9kZWwoTFNQTVNHX1NFVFRJTkdTLCB7IHBheWxvYWQ6IGEgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJlZFBsdWdpbnMuc2V0KHBsdWdpbkxvY2FsLmlkLCBwbHVnaW5Mb2NhbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZWdpc3RlcmVkJywgcGx1Z2luTG9jYWwpO1xuICAgICAgICAgICAgICAgIC8vIGV4dGVybmFsIHBsdWdpbnNcbiAgICAgICAgICAgICAgICBpZiAoIXBsdWdpbkxvY2FsLmlzSW5zdGFsbGVkSW5Eb3RSb290KSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVybmFscy5hZGQodXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVVc2VyUHJlZmVyZW5jZXMoeyBleHRlcm5hbHM6IEFycmF5LmZyb20oZXh0ZXJuYWxzKSB9KTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYWN0aXZhdGVVc2VyUHJlZmVyZW5jZXMoKTtcbiAgICAgICAgICAgIHJlYWR5SW5kaWNhdG9yLnJlc29sdmUoJ3JlYWR5Jyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLl9pc1JlZ2lzdGVyaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBkZWJ1Z1BlcmZJbmZvKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgcmVsb2FkKHBsdWdpbnMpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHBsdWdpbnMpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlbG9hZChbcGx1Z2luc10pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgaWRlbnRpdHkgb2YgcGx1Z2lucykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwID0gdGhpcy5lbnN1cmVQbHVnaW4oaWRlbnRpdHkpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHAucmVsb2FkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGRlYnVnKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHVucmVnaXN0ZXIocGx1Z2lucykge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocGx1Z2lucykpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudW5yZWdpc3RlcihbcGx1Z2luc10pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHVucmVnaXN0ZXJlZEV4dGVybmFscyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGlkZW50aXR5IG9mIHBsdWdpbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSB0aGlzLmVuc3VyZVBsdWdpbihpZGVudGl0eSk7XG4gICAgICAgICAgICBpZiAoIXAuaXNJbnN0YWxsZWRJbkRvdFJvb3QpIHtcbiAgICAgICAgICAgICAgICB1bnJlZ2lzdGVyZWRFeHRlcm5hbHMucHVzaChwLm9wdGlvbnMudXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IHAudW5sb2FkKHRydWUpO1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJlZFBsdWdpbnMuZGVsZXRlKGlkZW50aXR5KTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgndW5yZWdpc3RlcmVkJywgaWRlbnRpdHkpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBleHRlcm5hbHMgPSB0aGlzLl91c2VyUHJlZmVyZW5jZXMuZXh0ZXJuYWxzIHx8IFtdO1xuICAgICAgICBpZiAoZXh0ZXJuYWxzLmxlbmd0aCAmJiB1bnJlZ2lzdGVyZWRFeHRlcm5hbHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVVc2VyUHJlZmVyZW5jZXMoe1xuICAgICAgICAgICAgICAgIGV4dGVybmFsczogZXh0ZXJuYWxzLmZpbHRlcigoaXQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICF1bnJlZ2lzdGVyZWRFeHRlcm5hbHMuaW5jbHVkZXMoaXQpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBlbmFibGUocGx1Z2luKSB7XG4gICAgICAgIGNvbnN0IHAgPSB0aGlzLmVuc3VyZVBsdWdpbihwbHVnaW4pO1xuICAgICAgICBpZiAocC5wZW5kaW5nKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmVtaXQoJ2JlZm9yZWVuYWJsZScpO1xuICAgICAgICBwLnNldHRpbmdzPy5zZXQoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVtaXQoJ2VuYWJsZWQnLCBwLmlkKTtcbiAgICB9XG4gICAgYXN5bmMgZGlzYWJsZShwbHVnaW4pIHtcbiAgICAgICAgY29uc3QgcCA9IHRoaXMuZW5zdXJlUGx1Z2luKHBsdWdpbik7XG4gICAgICAgIGlmIChwLnBlbmRpbmcpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZW1pdCgnYmVmb3JlZGlzYWJsZScpO1xuICAgICAgICBwLnNldHRpbmdzPy5zZXQoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuZW1pdCgnZGlzYWJsZWQnLCBwLmlkKTtcbiAgICB9XG4gICAgYXN5bmMgX2hvb2sobnMsIHR5cGUsIHBheWxvYWQsIHBpZCkge1xuICAgICAgICBmb3IgKGNvbnN0IFtfLCBwXSBvZiB0aGlzLl9yZWdpc3RlcmVkUGx1Z2lucykge1xuICAgICAgICAgICAgaWYgKCFwaWQgfHwgcGlkID09PSBwLmlkKSB7XG4gICAgICAgICAgICAgICAgcC5jYWxsZXI/LmNhbGxVc2VyTW9kZWwoTFNQTVNHLCB7XG4gICAgICAgICAgICAgICAgICAgIG5zLCB0eXBlOiBzbmFrZUNhc2UodHlwZSksIHBheWxvYWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBob29rQXBwKHR5cGUsIHBheWxvYWQsIHBpZCkge1xuICAgICAgICB0aGlzLl9ob29rKGBob29rOmFwcGAsIHR5cGUsIHBheWxvYWQsIHBpZCk7XG4gICAgfVxuICAgIGhvb2tFZGl0b3IodHlwZSwgcGF5bG9hZCwgcGlkKSB7XG4gICAgICAgIHRoaXMuX2hvb2soYGhvb2s6ZWRpdG9yYCwgdHlwZSwgcGF5bG9hZCwgcGlkKTtcbiAgICB9XG4gICAgX2V4ZWNEaXJlY3RpdmUodGFnLCAuLi5wYXJhbXMpIHtcbiAgICB9XG4gICAgZW5zdXJlUGx1Z2luKHBsdWdpbikge1xuICAgICAgICBpZiAocGx1Z2luIGluc3RhbmNlb2YgUGx1Z2luTG9jYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBwbHVnaW47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcCA9IHRoaXMuX3JlZ2lzdGVyZWRQbHVnaW5zLmdldChwbHVnaW4pO1xuICAgICAgICBpZiAoIXApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgcGx1Z2luICMke3BsdWdpbn0gbm90IGV4aXN0ZWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfVxuICAgIGhvc3RNb3VudGVkKCkge1xuICAgICAgICB0aGlzLl9ob3N0TW91bnRlZEFjdG9yLnJlc29sdmUoKTtcbiAgICB9XG4gICAgZ2V0IHJlZ2lzdGVyZWRQbHVnaW5zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJlZFBsdWdpbnM7XG4gICAgfVxuICAgIGdldCBvcHRpb25zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fb3B0aW9ucztcbiAgICB9XG4gICAgZ2V0IHJlYWR5SW5kaWNhdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVhZHlJbmRpY2F0b3I7XG4gICAgfVxuICAgIGdldCBob3N0TW91bnRlZEFjdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faG9zdE1vdW50ZWRBY3RvcjtcbiAgICB9XG4gICAgZ2V0IGlzUmVnaXN0ZXJpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc1JlZ2lzdGVyaW5nO1xuICAgIH1cbiAgICBnZXQgdGhlbWVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJlZFRoZW1lcztcbiAgICB9XG4gICAgYXN5bmMgcmVnaXN0ZXJUaGVtZShpZCwgb3B0KSB7XG4gICAgICAgIGRlYnVnKCdyZWdpc3RlcmVkIFRoZW1lICMnLCBpZCwgb3B0KTtcbiAgICAgICAgaWYgKCFpZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IHRoZW1lcyA9IHRoaXMuX3JlZ2lzdGVyZWRUaGVtZXMuZ2V0KGlkKTtcbiAgICAgICAgaWYgKCF0aGVtZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyZWRUaGVtZXMuc2V0KGlkLCB0aGVtZXMgPSBbXSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhlbWVzLnB1c2gob3B0KTtcbiAgICAgICAgdGhpcy5lbWl0KCd0aGVtZS1jaGFuZ2VkJywgdGhpcy50aGVtZXMsIHsgaWQsIC4uLm9wdCB9KTtcbiAgICB9XG4gICAgYXN5bmMgc2VsZWN0VGhlbWUob3B0LCBlZmZlY3QgPSB0cnVlKSB7XG4gICAgICAgIC8vIGNsZWFyIGN1cnJlbnRcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRUaGVtZSkge1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudFRoZW1lLmRpcz8uKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGlzSW5qZWN0ZWRUaGVtZSA9IHNldHVwSW5qZWN0ZWRUaGVtZShvcHQ/LnVybCk7XG4gICAgICAgIHRoaXMuZW1pdCgndGhlbWUtc2VsZWN0ZWQnLCBvcHQpO1xuICAgICAgICBlZmZlY3QgJiYgYXdhaXQgdGhpcy5zYXZlVXNlclByZWZlcmVuY2VzKHsgdGhlbWU6IG9wdD8udXJsID8gb3B0IDogbnVsbCB9KTtcbiAgICAgICAgaWYgKG9wdD8udXJsKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50VGhlbWUgPSB7XG4gICAgICAgICAgICAgICAgZGlzOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRpc0luamVjdGVkVGhlbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgZWZmZWN0ICYmIHRoaXMuc2F2ZVVzZXJQcmVmZXJlbmNlcyh7IHRoZW1lOiBudWxsIH0pO1xuICAgICAgICAgICAgICAgIH0sIG9wdCwgcGlkOiBvcHQucGlkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIHVucmVnaXN0ZXJUaGVtZShpZCwgZWZmZWN0ID0gdHJ1ZSkge1xuICAgICAgICBkZWJ1ZygndW5yZWdpc3RlcmVkIFRoZW1lICMnLCBpZCk7XG4gICAgICAgIGlmICghdGhpcy5fcmVnaXN0ZXJlZFRoZW1lcy5oYXMoaWQpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLl9yZWdpc3RlcmVkVGhlbWVzLmRlbGV0ZShpZCk7XG4gICAgICAgIHRoaXMuZW1pdCgndGhlbWUtY2hhbmdlZCcsIHRoaXMudGhlbWVzLCB7IGlkIH0pO1xuICAgICAgICBpZiAoZWZmZWN0ICYmIHRoaXMuX2N1cnJlbnRUaGVtZT8ucGlkID09IGlkKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50VGhlbWUuZGlzPy4oKTtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRUaGVtZSA9IG51bGw7XG4gICAgICAgICAgICAvLyByZXNldCBjdXJyZW50IHRoZW1lXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3RoZW1lLXNlbGVjdGVkJywgbnVsbCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBzZXR1cFBsdWdpbkNvcmUob3B0aW9ucykge1xuICAgIGNvbnN0IHBsdWdpbkNvcmUgPSBuZXcgTFNQbHVnaW5Db3JlKG9wdGlvbnMpO1xuICAgIGRlYnVnKCc9PT0g8J+UlyBTZXR1cCBMb2dzZXEgUGx1Z2luIFN5c3RlbSDwn5SXID09PScpO1xuICAgIHdpbmRvdy5MU1BsdWdpbkNvcmUgPSBwbHVnaW5Db3JlO1xufVxuZXhwb3J0IHsgUGx1Z2luTG9jYWwsIHBsdWdpbkhlbHBlcnMsIHNldHVwUGx1Z2luQ29yZSB9O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9