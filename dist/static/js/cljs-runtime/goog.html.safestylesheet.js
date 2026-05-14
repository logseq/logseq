goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.html.SafeStyleSheet");
  goog.module.declareLegacyNamespace();
  const Const = goog.require("goog.string.Const");
  const SafeStyle = goog.require("goog.html.SafeStyle");
  const TypedString = goog.require("goog.string.TypedString");
  const googObject = goog.require("goog.object");
  const {assert, fail} = goog.require("goog.asserts");
  const {contains} = goog.require("goog.string.internal");
  const CONSTRUCTOR_TOKEN_PRIVATE = {};
  class SafeStyleSheet {
    constructor(value, token) {
      this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_ = token === CONSTRUCTOR_TOKEN_PRIVATE ? value : "";
      this.implementsGoogStringTypedString = true;
    }
    toString() {
      return this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_.toString();
    }
    static createRule(selector, style) {
      if (contains(selector, "\x3c")) {
        throw new Error(`Selector does not allow '<', got: ${selector}`);
      }
      const selectorToCheck = selector.replace(/('|")((?!\1)[^\r\n\f\\]|\\[\s\S])*\1/g, "");
      if (!/^[-_a-zA-Z0-9#.:* ,>+~[\]()=^$|]+$/.test(selectorToCheck)) {
        throw new Error("Selector allows only [-_a-zA-Z0-9#.:* ,\x3e+~[\\]()\x3d^$|] and " + "strings, got: " + selector);
      }
      if (!SafeStyleSheet.hasBalancedBrackets_(selectorToCheck)) {
        throw new Error("() and [] in selector must be balanced, got: " + selector);
      }
      if (!(style instanceof SafeStyle)) {
        style = SafeStyle.create(style);
      }
      const styleSheet = `${selector}{` + SafeStyle.unwrap(style).replace(/</g, "\\3C ") + "}";
      return SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(styleSheet);
    }
    static hasBalancedBrackets_(s) {
      const brackets = {"(":")", "[":"]"};
      const expectedBrackets = [];
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (brackets[ch]) {
          expectedBrackets.push(brackets[ch]);
        } else if (googObject.contains(brackets, ch)) {
          if (expectedBrackets.pop() != ch) {
            return false;
          }
        }
      }
      return expectedBrackets.length == 0;
    }
    static concat(var_args) {
      let result = "";
      const addArgument = argument => {
        if (Array.isArray(argument)) {
          argument.forEach(addArgument);
        } else {
          result += SafeStyleSheet.unwrap(argument);
        }
      };
      Array.prototype.forEach.call(arguments, addArgument);
      return SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(result);
    }
    static fromConstant(styleSheet) {
      const styleSheetString = Const.unwrap(styleSheet);
      if (styleSheetString.length === 0) {
        return SafeStyleSheet.EMPTY;
      }
      assert(!contains(styleSheetString, "\x3c"), `Forbidden '<' character in style sheet string: ${styleSheetString}`);
      return SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(styleSheetString);
    }
    getTypedStringValue() {
      return this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_;
    }
    static unwrap(safeStyleSheet) {
      if (safeStyleSheet instanceof SafeStyleSheet && safeStyleSheet.constructor === SafeStyleSheet) {
        return safeStyleSheet.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_;
      } else {
        fail("expected object of type SafeStyleSheet, got '" + safeStyleSheet + "' of type " + goog.typeOf(safeStyleSheet));
        return "type_error:SafeStyleSheet";
      }
    }
    static createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(styleSheet) {
      return new SafeStyleSheet(styleSheet, CONSTRUCTOR_TOKEN_PRIVATE);
    }
  }
  SafeStyleSheet.EMPTY = SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse("");
  exports = SafeStyleSheet;
  return exports;
});

//# sourceMappingURL=goog.html.safestylesheet.js.map
