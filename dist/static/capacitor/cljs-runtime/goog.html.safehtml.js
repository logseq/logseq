goog.loadModule(function(exports) {
  "use strict";
  goog.module("goog.html.SafeHtml");
  goog.module.declareLegacyNamespace();
  const Const = goog.require("goog.string.Const");
  const SafeScript = goog.require("goog.html.SafeScript");
  const SafeStyle = goog.require("goog.html.SafeStyle");
  const SafeStyleSheet = goog.require("goog.html.SafeStyleSheet");
  const SafeUrl = goog.require("goog.html.SafeUrl");
  const TagName = goog.require("goog.dom.TagName");
  const TrustedResourceUrl = goog.require("goog.html.TrustedResourceUrl");
  const TypedString = goog.require("goog.string.TypedString");
  const asserts = goog.require("goog.asserts");
  const browser = goog.require("goog.labs.userAgent.browser");
  const googArray = goog.require("goog.array");
  const googObject = goog.require("goog.object");
  const internal = goog.require("goog.string.internal");
  const tags = goog.require("goog.dom.tags");
  const trustedtypes = goog.require("goog.html.trustedtypes");
  const CONSTRUCTOR_TOKEN_PRIVATE = {};
  class SafeHtml {
    constructor(value, token) {
      this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ = token === CONSTRUCTOR_TOKEN_PRIVATE ? value : "";
      this.implementsGoogStringTypedString = true;
    }
    getTypedStringValue() {
      return this.privateDoNotAccessOrElseSafeHtmlWrappedValue_.toString();
    }
    toString() {
      return this.privateDoNotAccessOrElseSafeHtmlWrappedValue_.toString();
    }
    static unwrap(safeHtml) {
      return SafeHtml.unwrapTrustedHTML(safeHtml).toString();
    }
    static unwrapTrustedHTML(safeHtml) {
      if (safeHtml instanceof SafeHtml && safeHtml.constructor === SafeHtml) {
        return safeHtml.privateDoNotAccessOrElseSafeHtmlWrappedValue_;
      } else {
        asserts.fail(`expected object of type SafeHtml, got '${safeHtml}' of type ` + goog.typeOf(safeHtml));
        return "type_error:SafeHtml";
      }
    }
    static htmlEscape(textOrHtml) {
      if (textOrHtml instanceof SafeHtml) {
        return textOrHtml;
      }
      const textIsObject = typeof textOrHtml == "object";
      let textAsString;
      if (textIsObject && textOrHtml.implementsGoogStringTypedString) {
        textAsString = textOrHtml.getTypedStringValue();
      } else {
        textAsString = String(textOrHtml);
      }
      return SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(internal.htmlEscape(textAsString));
    }
    static htmlEscapePreservingNewlines(textOrHtml) {
      if (textOrHtml instanceof SafeHtml) {
        return textOrHtml;
      }
      const html = SafeHtml.htmlEscape(textOrHtml);
      return SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(internal.newLineToBr(SafeHtml.unwrap(html)));
    }
    static htmlEscapePreservingNewlinesAndSpaces(textOrHtml) {
      if (textOrHtml instanceof SafeHtml) {
        return textOrHtml;
      }
      const html = SafeHtml.htmlEscape(textOrHtml);
      return SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(internal.whitespaceEscape(SafeHtml.unwrap(html)));
    }
    static comment(text) {
      return SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("\x3c!--" + internal.htmlEscape(text) + "--\x3e");
    }
    static create(tagName, attributes = undefined, content = undefined) {
      SafeHtml.verifyTagName(String(tagName));
      return SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse(String(tagName), attributes, content);
    }
    static verifyTagName(tagName) {
      if (!VALID_NAMES_IN_TAG.test(tagName)) {
        throw new Error(SafeHtml.ENABLE_ERROR_MESSAGES ? `Invalid tag name <${tagName}>.` : "");
      }
      if (tagName.toUpperCase() in NOT_ALLOWED_TAG_NAMES) {
        throw new Error(SafeHtml.ENABLE_ERROR_MESSAGES ? `Tag name <${tagName}> is not allowed for SafeHtml.` : "");
      }
    }
    static createIframe(src = undefined, srcdoc = undefined, attributes = undefined, content = undefined) {
      if (src) {
        TrustedResourceUrl.unwrap(src);
      }
      const fixedAttributes = {};
      fixedAttributes["src"] = src || null;
      fixedAttributes["srcdoc"] = srcdoc && SafeHtml.unwrap(srcdoc);
      const defaultAttributes = {"sandbox":""};
      const combinedAttrs = SafeHtml.combineAttributes(fixedAttributes, defaultAttributes, attributes);
      return SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("iframe", combinedAttrs, content);
    }
    static createSandboxIframe(src = undefined, srcdoc = undefined, attributes = undefined, content = undefined) {
      if (!SafeHtml.canUseSandboxIframe()) {
        throw new Error(SafeHtml.ENABLE_ERROR_MESSAGES ? "The browser does not support sandboxed iframes." : "");
      }
      const fixedAttributes = {};
      if (src) {
        fixedAttributes["src"] = SafeUrl.unwrap(SafeUrl.sanitize(src));
      } else {
        fixedAttributes["src"] = null;
      }
      fixedAttributes["srcdoc"] = srcdoc || null;
      fixedAttributes["sandbox"] = "";
      const combinedAttrs = SafeHtml.combineAttributes(fixedAttributes, {}, attributes);
      return SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("iframe", combinedAttrs, content);
    }
    static canUseSandboxIframe() {
      return goog.global["HTMLIFrameElement"] && "sandbox" in goog.global["HTMLIFrameElement"].prototype;
    }
    static createScriptSrc(src, attributes = undefined) {
      TrustedResourceUrl.unwrap(src);
      const fixedAttributes = {"src":src};
      const defaultAttributes = {};
      const combinedAttrs = SafeHtml.combineAttributes(fixedAttributes, defaultAttributes, attributes);
      return SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("script", combinedAttrs);
    }
    static createScript(script, attributes = undefined) {
      for (let attr in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, attr)) {
          const attrLower = attr.toLowerCase();
          if (attrLower == "language" || attrLower == "src" || attrLower == "text") {
            throw new Error(SafeHtml.ENABLE_ERROR_MESSAGES ? `Cannot set "${attrLower}" attribute` : "");
          }
        }
      }
      let content = "";
      script = googArray.concat(script);
      for (let i = 0; i < script.length; i++) {
        content += SafeScript.unwrap(script[i]);
      }
      const htmlContent = SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(content);
      return SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("script", attributes, htmlContent);
    }
    static createStyle(styleSheet, attributes = undefined) {
      const fixedAttributes = {"type":"text/css"};
      const defaultAttributes = {};
      const combinedAttrs = SafeHtml.combineAttributes(fixedAttributes, defaultAttributes, attributes);
      let content = "";
      styleSheet = googArray.concat(styleSheet);
      for (let i = 0; i < styleSheet.length; i++) {
        content += SafeStyleSheet.unwrap(styleSheet[i]);
      }
      const htmlContent = SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(content);
      return SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("style", combinedAttrs, htmlContent);
    }
    static createMetaRefresh(url, secs = undefined) {
      let unwrappedUrl = SafeUrl.unwrap(SafeUrl.sanitize(url));
      if (browser.isIE() || browser.isEdge()) {
        if (internal.contains(unwrappedUrl, ";")) {
          unwrappedUrl = "'" + unwrappedUrl.replace(/'/g, "%27") + "'";
        }
      }
      const attributes = {"http-equiv":"refresh", "content":(secs || 0) + "; url\x3d" + unwrappedUrl,};
      return SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("meta", attributes);
    }
    static join(separator, parts) {
      const separatorHtml = SafeHtml.htmlEscape(separator);
      const content = [];
      const addArgument = argument => {
        if (Array.isArray(argument)) {
          argument.forEach(addArgument);
        } else {
          const html = SafeHtml.htmlEscape(argument);
          content.push(SafeHtml.unwrap(html));
        }
      };
      parts.forEach(addArgument);
      return SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(content.join(SafeHtml.unwrap(separatorHtml)));
    }
    static concat(var_args) {
      return SafeHtml.join(SafeHtml.EMPTY, Array.prototype.slice.call(arguments));
    }
    static createSafeHtmlSecurityPrivateDoNotAccessOrElse(html) {
      const noinlineHtml = html;
      const policy = trustedtypes.getPolicyPrivateDoNotAccessOrElse();
      const trustedHtml = policy ? policy.createHTML(noinlineHtml) : noinlineHtml;
      return new SafeHtml(trustedHtml, CONSTRUCTOR_TOKEN_PRIVATE);
    }
    static createSafeHtmlTagSecurityPrivateDoNotAccessOrElse(tagName, attributes = undefined, content = undefined) {
      let result = `<${tagName}`;
      result += SafeHtml.stringifyAttributes(tagName, attributes);
      if (content == null) {
        content = [];
      } else if (!Array.isArray(content)) {
        content = [content];
      }
      if (tags.isVoidTag(tagName.toLowerCase())) {
        asserts.assert(!content.length, `Void tag <${tagName}> does not allow content.`);
        result += "\x3e";
      } else {
        const html = SafeHtml.concat(content);
        result += "\x3e" + SafeHtml.unwrap(html) + "\x3c/" + tagName + "\x3e";
      }
      return SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(result);
    }
    static stringifyAttributes(tagName, attributes = undefined) {
      let result = "";
      if (attributes) {
        for (let name in attributes) {
          if (Object.prototype.hasOwnProperty.call(attributes, name)) {
            if (!VALID_NAMES_IN_TAG.test(name)) {
              throw new Error(SafeHtml.ENABLE_ERROR_MESSAGES ? `Invalid attribute name "${name}".` : "");
            }
            const value = attributes[name];
            if (value == null) {
              continue;
            }
            result += " " + getAttrNameAndValue(tagName, name, value);
          }
        }
      }
      return result;
    }
    static combineAttributes(fixedAttributes, defaultAttributes, attributes = undefined) {
      const combinedAttributes = {};
      for (const name in fixedAttributes) {
        if (Object.prototype.hasOwnProperty.call(fixedAttributes, name)) {
          asserts.assert(name.toLowerCase() == name, "Must be lower case");
          combinedAttributes[name] = fixedAttributes[name];
        }
      }
      for (const name in defaultAttributes) {
        if (Object.prototype.hasOwnProperty.call(defaultAttributes, name)) {
          asserts.assert(name.toLowerCase() == name, "Must be lower case");
          combinedAttributes[name] = defaultAttributes[name];
        }
      }
      if (attributes) {
        for (const name in attributes) {
          if (Object.prototype.hasOwnProperty.call(attributes, name)) {
            const nameLower = name.toLowerCase();
            if (nameLower in fixedAttributes) {
              throw new Error(SafeHtml.ENABLE_ERROR_MESSAGES ? `Cannot override "${nameLower}" attribute, got "` + name + '" with value "' + attributes[name] + '"' : "");
            }
            if (nameLower in defaultAttributes) {
              delete combinedAttributes[nameLower];
            }
            combinedAttributes[name] = attributes[name];
          }
        }
      }
      return combinedAttributes;
    }
  }
  SafeHtml.ENABLE_ERROR_MESSAGES = goog.define("goog.html.SafeHtml.ENABLE_ERROR_MESSAGES", goog.DEBUG);
  SafeHtml.SUPPORT_STYLE_ATTRIBUTE = goog.define("goog.html.SafeHtml.SUPPORT_STYLE_ATTRIBUTE", true);
  SafeHtml.TextOrHtml_;
  SafeHtml.from = SafeHtml.htmlEscape;
  const VALID_NAMES_IN_TAG = /^[a-zA-Z0-9-]+$/;
  const URL_ATTRIBUTES = googObject.createSet("action", "cite", "data", "formaction", "href", "manifest", "poster", "src");
  const NOT_ALLOWED_TAG_NAMES = googObject.createSet(TagName.APPLET, TagName.BASE, TagName.EMBED, TagName.IFRAME, TagName.LINK, TagName.MATH, TagName.META, TagName.OBJECT, TagName.SCRIPT, TagName.STYLE, TagName.SVG, TagName.TEMPLATE);
  SafeHtml.AttributeValue;
  function getAttrNameAndValue(tagName, name, value) {
    if (value instanceof Const) {
      value = Const.unwrap(value);
    } else if (name.toLowerCase() == "style") {
      if (SafeHtml.SUPPORT_STYLE_ATTRIBUTE) {
        value = getStyleValue(value);
      } else {
        throw new Error(SafeHtml.ENABLE_ERROR_MESSAGES ? 'Attribute "style" not supported.' : "");
      }
    } else if (/^on/i.test(name)) {
      throw new Error(SafeHtml.ENABLE_ERROR_MESSAGES ? `Attribute "${name}` + '" requires goog.string.Const value, "' + value + '" given.' : "");
    } else if (name.toLowerCase() in URL_ATTRIBUTES) {
      if (value instanceof TrustedResourceUrl) {
        value = TrustedResourceUrl.unwrap(value);
      } else if (value instanceof SafeUrl) {
        value = SafeUrl.unwrap(value);
      } else if (typeof value === "string") {
        value = SafeUrl.sanitize(value).getTypedStringValue();
      } else {
        throw new Error(SafeHtml.ENABLE_ERROR_MESSAGES ? `Attribute "${name}" on tag "${tagName}` + '" requires goog.html.SafeUrl, goog.string.Const, or' + ' string, value "' + value + '" given.' : "");
      }
    }
    if (value.implementsGoogStringTypedString) {
      value = value.getTypedStringValue();
    }
    asserts.assert(typeof value === "string" || typeof value === "number", "String or number value expected, got " + typeof value + " with value: " + value);
    return `${name}="` + internal.htmlEscape(String(value)) + '"';
  }
  function getStyleValue(value) {
    if (!goog.isObject(value)) {
      throw new Error(SafeHtml.ENABLE_ERROR_MESSAGES ? 'The "style" attribute requires goog.html.SafeStyle or map ' + "of style properties, " + typeof value + " given: " + value : "");
    }
    if (!(value instanceof SafeStyle)) {
      value = SafeStyle.create(value);
    }
    return SafeStyle.unwrap(value);
  }
  SafeHtml.DOCTYPE_HTML = {valueOf:function() {
    return SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("\x3c!DOCTYPE html\x3e");
  },}.valueOf();
  SafeHtml.EMPTY = new SafeHtml(goog.global.trustedTypes && goog.global.trustedTypes.emptyHTML || "", CONSTRUCTOR_TOKEN_PRIVATE);
  SafeHtml.BR = {valueOf:function() {
    return SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("\x3cbr\x3e");
  },}.valueOf();
  exports = SafeHtml;
  return exports;
});

//# sourceMappingURL=goog.html.safehtml.js.map
