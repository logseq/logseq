goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.html.SafeStyle");
  goog.module.declareLegacyNamespace();
  const Const = goog.require("goog.string.Const");
  const SafeUrl = goog.require("goog.html.SafeUrl");
  const TypedString = goog.require("goog.string.TypedString");
  const {AssertionError, assert, fail} = goog.require("goog.asserts");
  const {contains, endsWith} = goog.require("goog.string.internal");
  const CONSTRUCTOR_TOKEN_PRIVATE = {};
  class SafeStyle {
    constructor(value, token) {
      this.privateDoNotAccessOrElseSafeStyleWrappedValue_ = token === CONSTRUCTOR_TOKEN_PRIVATE ? value : "";
      this.implementsGoogStringTypedString = true;
    }
    static fromConstant(style) {
      const styleString = Const.unwrap(style);
      if (styleString.length === 0) {
        return SafeStyle.EMPTY;
      }
      assert(endsWith(styleString, ";"), `Last character of style string is not ';': ${styleString}`);
      assert(contains(styleString, ":"), "Style string must contain at least one ':', to " + 'specify a "name: value" pair: ' + styleString);
      return SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(styleString);
    }
    getTypedStringValue() {
      return this.privateDoNotAccessOrElseSafeStyleWrappedValue_;
    }
    toString() {
      return this.privateDoNotAccessOrElseSafeStyleWrappedValue_.toString();
    }
    static unwrap(safeStyle) {
      if (safeStyle instanceof SafeStyle && safeStyle.constructor === SafeStyle) {
        return safeStyle.privateDoNotAccessOrElseSafeStyleWrappedValue_;
      } else {
        fail(`expected object of type SafeStyle, got '${safeStyle}` + "' of type " + goog.typeOf(safeStyle));
        return "type_error:SafeStyle";
      }
    }
    static createSafeStyleSecurityPrivateDoNotAccessOrElse(style) {
      return new SafeStyle(style, CONSTRUCTOR_TOKEN_PRIVATE);
    }
    static create(map) {
      let style = "";
      for (let name in map) {
        if (Object.prototype.hasOwnProperty.call(map, name)) {
          if (!/^[-_a-zA-Z0-9]+$/.test(name)) {
            throw new Error(`Name allows only [-_a-zA-Z0-9], got: ${name}`);
          }
          let value = map[name];
          if (value == null) {
            continue;
          }
          if (Array.isArray(value)) {
            value = value.map(sanitizePropertyValue).join(" ");
          } else {
            value = sanitizePropertyValue(value);
          }
          style += `${name}:${value};`;
        }
      }
      if (!style) {
        return SafeStyle.EMPTY;
      }
      return SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(style);
    }
    static concat(var_args) {
      let style = "";
      const addArgument = argument => {
        if (Array.isArray(argument)) {
          argument.forEach(addArgument);
        } else {
          style += SafeStyle.unwrap(argument);
        }
      };
      Array.prototype.forEach.call(arguments, addArgument);
      if (!style) {
        return SafeStyle.EMPTY;
      }
      return SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(style);
    }
  }
  SafeStyle.EMPTY = SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse("");
  SafeStyle.INNOCUOUS_STRING = "zClosurez";
  SafeStyle.PropertyValue;
  SafeStyle.PropertyMap;
  function sanitizePropertyValue(value) {
    if (value instanceof SafeUrl) {
      const url = SafeUrl.unwrap(value);
      return 'url("' + url.replace(/</g, "%3c").replace(/[\\"]/g, "\\$\x26") + '")';
    }
    const result = value instanceof Const ? Const.unwrap(value) : sanitizePropertyValueString(String(value));
    if (/[{;}]/.test(result)) {
      throw new AssertionError("Value does not allow [{;}], got: %s.", [result]);
    }
    return result;
  }
  function sanitizePropertyValueString(value) {
    const valueWithoutFunctions = value.replace(FUNCTIONS_RE, "$1").replace(FUNCTIONS_RE, "$1").replace(URL_RE, "url");
    if (!VALUE_RE.test(valueWithoutFunctions)) {
      fail(`String value allows only ${VALUE_ALLOWED_CHARS}` + " and simple functions, got: " + value);
      return SafeStyle.INNOCUOUS_STRING;
    } else if (COMMENT_RE.test(value)) {
      fail(`String value disallows comments, got: ${value}`);
      return SafeStyle.INNOCUOUS_STRING;
    } else if (!hasBalancedQuotes(value)) {
      fail(`String value requires balanced quotes, got: ${value}`);
      return SafeStyle.INNOCUOUS_STRING;
    } else if (!hasBalancedSquareBrackets(value)) {
      fail("String value requires balanced square brackets and one" + " identifier per pair of brackets, got: " + value);
      return SafeStyle.INNOCUOUS_STRING;
    }
    return sanitizeUrl(value);
  }
  function hasBalancedQuotes(value) {
    let outsideSingle = true;
    let outsideDouble = true;
    for (let i = 0; i < value.length; i++) {
      const c = value.charAt(i);
      if (c == "'" && outsideDouble) {
        outsideSingle = !outsideSingle;
      } else if (c == '"' && outsideSingle) {
        outsideDouble = !outsideDouble;
      }
    }
    return outsideSingle && outsideDouble;
  }
  function hasBalancedSquareBrackets(value) {
    let outside = true;
    const tokenRe = /^[-_a-zA-Z0-9]$/;
    for (let i = 0; i < value.length; i++) {
      const c = value.charAt(i);
      if (c == "]") {
        if (outside) {
          return false;
        }
        outside = true;
      } else if (c == "[") {
        if (!outside) {
          return false;
        }
        outside = false;
      } else if (!outside && !tokenRe.test(c)) {
        return false;
      }
    }
    return outside;
  }
  const VALUE_ALLOWED_CHARS = "[-+,.\"'%_!#/ a-zA-Z0-9\\[\\]]";
  const VALUE_RE = new RegExp(`^${VALUE_ALLOWED_CHARS}+\$`);
  const URL_RE = new RegExp("\\b(url\\([ \t\n]*)(" + "'[ -\x26(-\\[\\]-~]*'" + '|"[ !#-\\[\\]-~]*"' + "|[!#-\x26*-\\[\\]-~]*" + ")([ \t\n]*\\))", "g");
  const ALLOWED_FUNCTIONS = ["calc", "cubic-bezier", "fit-content", "hsl", "hsla", "linear-gradient", "matrix", "minmax", "radial-gradient", "repeat", "rgb", "rgba", "(rotate|scale|translate)(X|Y|Z|3d)?", "steps", "var",];
  const FUNCTIONS_RE = new RegExp("\\b(" + ALLOWED_FUNCTIONS.join("|") + ")" + "\\([-+*/0-9a-zA-Z.%#\\[\\], ]+\\)", "g");
  const COMMENT_RE = /\/\*/;
  function sanitizeUrl(value) {
    return value.replace(URL_RE, (match, before, url, after) => {
      let quote = "";
      url = url.replace(/^(['"])(.*)\1$/, (match, start, inside) => {
        quote = start;
        return inside;
      });
      const sanitized = SafeUrl.sanitize(url).getTypedStringValue();
      return before + quote + sanitized + quote + after;
    });
  }
  exports = SafeStyle;
  return exports;
});

//# sourceMappingURL=goog.html.safestyle.js.map
