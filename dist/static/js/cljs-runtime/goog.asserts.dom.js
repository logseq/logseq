goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.asserts.dom");
  goog.module.declareLegacyNamespace();
  const TagName = goog.require("goog.dom.TagName");
  const asserts = goog.require("goog.asserts");
  const element = goog.require("goog.dom.element");
  const assertIsElement = value => {
    if (asserts.ENABLE_ASSERTS && !element.isElement(value)) {
      asserts.fail(`Argument is not an Element; got: ${debugStringForType(value)}`);
    }
    return value;
  };
  const assertIsHtmlElement = value => {
    if (asserts.ENABLE_ASSERTS && !element.isHtmlElement(value)) {
      asserts.fail(`Argument is not an HTML Element; got: ${debugStringForType(value)}`);
    }
    return value;
  };
  const assertIsHtmlElementOfType = (value, tagName) => {
    if (asserts.ENABLE_ASSERTS && !element.isHtmlElementOfType(value, tagName)) {
      asserts.fail(`Argument is not an HTML Element with tag name ` + `${tagName.toString()}; got: ${debugStringForType(value)}`);
    }
    return value;
  };
  const assertIsHtmlAnchorElement = value => {
    return assertIsHtmlElementOfType(value, TagName.A);
  };
  const assertIsHtmlButtonElement = value => {
    return assertIsHtmlElementOfType(value, TagName.BUTTON);
  };
  const assertIsHtmlLinkElement = value => {
    return assertIsHtmlElementOfType(value, TagName.LINK);
  };
  const assertIsHtmlImageElement = value => {
    return assertIsHtmlElementOfType(value, TagName.IMG);
  };
  const assertIsHtmlAudioElement = value => {
    return assertIsHtmlElementOfType(value, TagName.AUDIO);
  };
  const assertIsHtmlVideoElement = value => {
    return assertIsHtmlElementOfType(value, TagName.VIDEO);
  };
  const assertIsHtmlInputElement = value => {
    return assertIsHtmlElementOfType(value, TagName.INPUT);
  };
  const assertIsHtmlTextAreaElement = value => {
    return assertIsHtmlElementOfType(value, TagName.TEXTAREA);
  };
  const assertIsHtmlCanvasElement = value => {
    return assertIsHtmlElementOfType(value, TagName.CANVAS);
  };
  const assertIsHtmlEmbedElement = value => {
    return assertIsHtmlElementOfType(value, TagName.EMBED);
  };
  const assertIsHtmlFormElement = value => {
    return assertIsHtmlElementOfType(value, TagName.FORM);
  };
  const assertIsHtmlFrameElement = value => {
    return assertIsHtmlElementOfType(value, TagName.FRAME);
  };
  const assertIsHtmlIFrameElement = value => {
    return assertIsHtmlElementOfType(value, TagName.IFRAME);
  };
  const assertIsHtmlObjectElement = value => {
    return assertIsHtmlElementOfType(value, TagName.OBJECT);
  };
  const assertIsHtmlScriptElement = value => {
    return assertIsHtmlElementOfType(value, TagName.SCRIPT);
  };
  const debugStringForType = value => {
    if (goog.isObject(value)) {
      try {
        return value.constructor.displayName || value.constructor.name || Object.prototype.toString.call(value);
      } catch (e) {
        return "\x3cobject could not be stringified\x3e";
      }
    } else {
      return value === undefined ? "undefined" : value === null ? "null" : typeof value;
    }
  };
  exports = {assertIsElement, assertIsHtmlElement, assertIsHtmlElementOfType, assertIsHtmlAnchorElement, assertIsHtmlButtonElement, assertIsHtmlLinkElement, assertIsHtmlImageElement, assertIsHtmlAudioElement, assertIsHtmlVideoElement, assertIsHtmlInputElement, assertIsHtmlTextAreaElement, assertIsHtmlCanvasElement, assertIsHtmlEmbedElement, assertIsHtmlFormElement, assertIsHtmlFrameElement, assertIsHtmlIFrameElement, assertIsHtmlObjectElement, assertIsHtmlScriptElement,};
  return exports;
});

//# sourceMappingURL=goog.asserts.dom.js.map
