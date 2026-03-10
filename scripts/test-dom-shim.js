/* eslint-disable no-empty-function */

// Minimal DOM-like globals for Node test runtime.
if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis;
}

if (typeof globalThis.self === "undefined") {
  globalThis.self = globalThis;
}

if (typeof globalThis.postMessage === "undefined") {
  globalThis.postMessage = function postMessage() {};
}

if (typeof globalThis.self.postMessage === "undefined") {
  globalThis.self.postMessage = globalThis.postMessage;
}

if (typeof globalThis.self.addEventListener === "undefined") {
  globalThis.self.addEventListener = function addEventListener() {};
}

if (typeof globalThis.self.removeEventListener === "undefined") {
  globalThis.self.removeEventListener = function removeEventListener() {};
}

if (typeof globalThis.navigator === "undefined") {
  globalThis.navigator = { userAgent: "node.js" };
}

const createNoopElement = (tagName = "div") => ({
  tagName: String(tagName).toUpperCase(),
  style: {},
  dataset: {},
  classList: { add() {}, remove() {}, contains() { return false; } },
  children: [],
  childNodes: [],
  appendChild() {},
  removeChild() {},
  setAttribute() {},
  getAttribute() { return null; },
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() { return false; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  getBoundingClientRect() {
    return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
});

if (typeof globalThis.document === "undefined") {
  const body = createNoopElement("body");
  const head = createNoopElement("head");
  const documentElement = createNoopElement("html");

  globalThis.document = {
    documentElement,
    body,
    head,
    activeElement: body,
    createElement: createNoopElement,
    createElementNS(_ns, tagName) { return createNoopElement(tagName); },
    createTextNode(text) { return { textContent: String(text) }; },
    getElementById() { return null; },
    getElementsByClassName() { return []; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {},
    hasFocus() { return false; },
    execCommand() { return false; }
  };
}

if (typeof globalThis.HTMLElement === "undefined") {
  globalThis.HTMLElement = function HTMLElement() {};
}

if (typeof globalThis.Element === "undefined") {
  globalThis.Element = globalThis.HTMLElement;
}

if (typeof globalThis.Node === "undefined") {
  globalThis.Node = function Node() {};
}

if (typeof globalThis.MutationObserver === "undefined") {
  globalThis.MutationObserver = class MutationObserver {
    disconnect() {}
    observe() {}
    takeRecords() { return []; }
  };
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
  };
}

if (typeof globalThis.getComputedStyle === "undefined") {
  globalThis.getComputedStyle = () => ({ overflow: "visible" });
}

if (typeof globalThis.requestAnimationFrame === "undefined") {
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
}

if (typeof globalThis.cancelAnimationFrame === "undefined") {
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

if (typeof globalThis.customElements === "undefined") {
  globalThis.customElements = {
    define() {},
    get() { return undefined; }
  };
}

// Some optional runtime provider SDKs are not present in local test env.
// Stub them only when module resolution fails.
const Module = require("module");
const originalLoad = Module._load;
const optionalModuleStubs = {
  "@cloudflare/sandbox": {
    getSandbox() {
      return {};
    }
  },
  "@vercel/sandbox": {
    Sandbox: {
      create: async () => ({}),
      get: async () => ({})
    }
  }
};

Module._load = function patchedModuleLoad(request, parent, isMain) {
  if (Object.prototype.hasOwnProperty.call(optionalModuleStubs, request)) {
    try {
      return originalLoad.call(this, request, parent, isMain);
    } catch (error) {
      if (error && error.code === "MODULE_NOT_FOUND") {
        return optionalModuleStubs[request];
      }
      throw error;
    }
  }

  return originalLoad.call(this, request, parent, isMain);
};
