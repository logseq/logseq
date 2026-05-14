goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.dom.element");
  goog.module.declareLegacyNamespace();
  const NodeType = goog.require("goog.dom.NodeType");
  const TagName = goog.require("goog.dom.TagName");
  const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  const isElement = value => {
    return goog.isObject(value) && value.nodeType === NodeType.ELEMENT;
  };
  const isHtmlElement = value => {
    return goog.isObject(value) && isElement(value) && (!value.namespaceURI || value.namespaceURI === HTML_NAMESPACE);
  };
  const isHtmlElementOfType = (value, tagName) => {
    return goog.isObject(value) && isHtmlElement(value) && value.tagName.toUpperCase() === tagName.toString();
  };
  const isHtmlAnchorElement = value => {
    return isHtmlElementOfType(value, TagName.A);
  };
  const isHtmlButtonElement = value => {
    return isHtmlElementOfType(value, TagName.BUTTON);
  };
  const isHtmlLinkElement = value => {
    return isHtmlElementOfType(value, TagName.LINK);
  };
  const isHtmlImageElement = value => {
    return isHtmlElementOfType(value, TagName.IMG);
  };
  const isHtmlAudioElement = value => {
    return isHtmlElementOfType(value, TagName.AUDIO);
  };
  const isHtmlVideoElement = value => {
    return isHtmlElementOfType(value, TagName.VIDEO);
  };
  const isHtmlInputElement = value => {
    return isHtmlElementOfType(value, TagName.INPUT);
  };
  const isHtmlTextAreaElement = value => {
    return isHtmlElementOfType(value, TagName.TEXTAREA);
  };
  const isHtmlCanvasElement = value => {
    return isHtmlElementOfType(value, TagName.CANVAS);
  };
  const isHtmlEmbedElement = value => {
    return isHtmlElementOfType(value, TagName.EMBED);
  };
  const isHtmlFormElement = value => {
    return isHtmlElementOfType(value, TagName.FORM);
  };
  const isHtmlFrameElement = value => {
    return isHtmlElementOfType(value, TagName.FRAME);
  };
  const isHtmlIFrameElement = value => {
    return isHtmlElementOfType(value, TagName.IFRAME);
  };
  const isHtmlObjectElement = value => {
    return isHtmlElementOfType(value, TagName.OBJECT);
  };
  const isHtmlScriptElement = value => {
    return isHtmlElementOfType(value, TagName.SCRIPT);
  };
  exports = {isElement, isHtmlElement, isHtmlElementOfType, isHtmlAnchorElement, isHtmlButtonElement, isHtmlLinkElement, isHtmlImageElement, isHtmlAudioElement, isHtmlVideoElement, isHtmlInputElement, isHtmlTextAreaElement, isHtmlCanvasElement, isHtmlEmbedElement, isHtmlFormElement, isHtmlFrameElement, isHtmlIFrameElement, isHtmlObjectElement, isHtmlScriptElement,};
  return exports;
});

//# sourceMappingURL=goog.dom.element.js.map
