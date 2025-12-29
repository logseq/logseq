import katexPkg from "https://esm.sh/katex@0.16.10?bundle";

// Core CodeMirror pieces
import { EditorState } from "https://esm.sh/@codemirror/state@6";
import {
  EditorView,
  lineNumbers,
} from "https://esm.sh/@codemirror/view@6";

// Highlighting
import {
  syntaxHighlighting,
  defaultHighlightStyle,
} from "https://esm.sh/@codemirror/language@6";

// Languages
import { javascript } from "https://esm.sh/@codemirror/lang-javascript@6";
import { python } from "https://esm.sh/@codemirror/lang-python@6";
import { html } from "https://esm.sh/@codemirror/lang-html@6";
import { json } from "https://esm.sh/@codemirror/lang-json@6";
import { markdown } from "https://esm.sh/@codemirror/lang-markdown@6";
import { sql } from "https://esm.sh/@codemirror/lang-sql@6";
import { css } from "https://esm.sh/@codemirror/lang-css@6";
import { clojure } from "https://esm.sh/@nextjournal/lang-clojure";
import emojiData from "https://esm.sh/@emoji-mart/data@1?bundle";

const katex = katexPkg.default || katexPkg;
const THEME_KEY = "publish-theme";

document.addEventListener("click", (event) => {
  const btn = event.target.closest(".block-toggle");
  if (!btn) return;
  const li = btn.closest("li.block");
  if (!li) return;
  const collapsed = li.classList.toggle("is-collapsed");
  btn.setAttribute("aria-expanded", String(!collapsed));
});

const getEmojiNative = (id) => {
  const emoji = emojiData?.emojis?.[id];
  if (!emoji) return null;
  return emoji?.skins?.[0]?.native || null;
};

const toKebabCase = (value) =>
  (value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])([0-9])/g, "$1-$2")
    .replace(/([0-9])([a-zA-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

const toPascalCase = (value) =>
  (value || "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const toTablerIconName = (id) => {
  if (!id) return null;
  return id.startsWith("Icon") ? id : `Icon${toPascalCase(id)}`;
};

const svgNamespace = "http://www.w3.org/2000/svg";

const isReactElement = (node) =>
  node &&
  typeof node === "object" &&
  node.$$typeof &&
  node.type &&
  node.props;

const setDomAttribute = (el, key, val, isSvg) => {
  if (key === "className") {
    el.setAttribute("class", val);
    return;
  }
  if (key === "style" && val && typeof val === "object") {
    Object.entries(val).forEach(([styleKey, styleVal]) => {
      el.style[styleKey] = styleVal;
    });
    return;
  }
  if (key === "ref" || key === "key" || key === "children") return;
  if (val === true) {
    el.setAttribute(key, "");
    return;
  }
  if (val === false || val == null) return;

  let attr = key;
  if (isSvg) {
    if (key === "strokeWidth") attr = "stroke-width";
    else if (key === "strokeLinecap") attr = "stroke-linecap";
    else if (key === "strokeLinejoin") attr = "stroke-linejoin";
    else if (key !== "viewBox" && /[A-Z]/.test(key)) {
      attr = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    }
  }
  el.setAttribute(attr, val);
};

const reactNodeToDom = (node, parentIsSvg = false) => {
  if (node == null || node === false) return null;
  if (Array.isArray(node)) {
    const frag = document.createDocumentFragment();
    node.forEach((child) => {
      const childNode = reactNodeToDom(child, parentIsSvg);
      if (childNode) frag.appendChild(childNode);
    });
    return frag;
  }
  if (typeof node === "string" || typeof node === "number") {
    return document.createTextNode(String(node));
  }
  if (node.nodeType) return node;
  if (isReactElement(node)) {
    if (node.type === Symbol.for("react.fragment")) {
      return reactNodeToDom(node.props?.children, parentIsSvg);
    }
    if (typeof node.type === "function") {
      return reactNodeToDom(node.type(node.props), parentIsSvg);
    }
    const tag = node.type;
    const isSvg = parentIsSvg || tag === "svg";
    const el = isSvg
      ? document.createElementNS(svgNamespace, tag)
      : document.createElement(tag);
    const props = node.props || {};
    Object.entries(props).forEach(([key, val]) => {
      setDomAttribute(el, key, val, isSvg);
    });
    const children = props.children;
    if (children != null) {
      const childNode = reactNodeToDom(children, isSvg);
      if (childNode) el.appendChild(childNode);
    }
    return el;
  }
  return null;
};

const getTablerExtIcon = (id) => {
  const name = toTablerIconName(id);
  if (!name) return null;
  return window.tablerIcons?.[name] || null;
};

const renderTablerExtIcon = (el, id) => {
  const iconFn = getTablerExtIcon(id);
  if (!iconFn) return false;
  const node = iconFn({ size: 14, stroke: 2 });
  if (!node) return false;
  el.textContent = "";
  const domNode = reactNodeToDom(node);
  if (!domNode) return false;
  if (domNode.nodeType === 11) {
    el.appendChild(domNode);
    return true;
  }
  if (domNode.nodeType) {
    if (domNode.tagName === "svg") {
      domNode.setAttribute("aria-hidden", "true");
    }
    el.appendChild(domNode);
    return true;
  }
  return false;
};

const renderPropertyIcons = () => {
  const icons = Array.from(
    document.querySelectorAll(".property-icon[data-icon-type][data-icon-id]")
  );
  if (!icons.length) return;

  icons.forEach((el) => {
    const id = el.dataset.iconId;
    const type = el.dataset.iconType;
    if (!id) return;

    if (type === "emoji") {
      const native = getEmojiNative(id);
      el.textContent = native || id;
      return;
    }

    el.textContent = "";
    el.setAttribute("aria-hidden", "true");

    if (type === "tabler-ext-icon") {
      if (renderTablerExtIcon(el, id)) return;
      const slug = toKebabCase(id);
      el.classList.add("tie", `tie-${slug}`);
      return;
    }

    if (type === "tabler-icon") {
      if (renderTablerExtIcon(el, id)) return;
      const slug = toKebabCase(id);
      el.classList.add("ti", `ti-${slug}`);
      return;
    }

    el.textContent = id;
  });
};

let sequenceKey = null;
let sequenceTimer = null;
const SEQUENCE_TIMEOUT_MS = 900;

const resetSequence = () => {
  sequenceKey = null;
  if (sequenceTimer) {
    clearTimeout(sequenceTimer);
    sequenceTimer = null;
  }
};

const isTypingTarget = (target) => {
  if (!target) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    target.isContentEditable
  );
};

document.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (isTypingTarget(event.target)) return;

  const key = (event.key || "").toLowerCase();
  if (!key) return;

  if (sequenceKey === "t" && key === "o") {
    resetSequence();
    window.toggleTopBlocks();
    event.preventDefault();
    return;
  }

  if (key === "t") {
    sequenceKey = "t";
    if (sequenceTimer) clearTimeout(sequenceTimer);
    sequenceTimer = setTimeout(resetSequence, SEQUENCE_TIMEOUT_MS);
    return;
  }

  resetSequence();
});

document.addEventListener("click", (event) => {
  const toggle = event.target.closest(".theme-toggle");
  if (!toggle) return;
  event.preventDefault();
  window.toggleTheme();
});

window.toggleTopBlocks = (btn) => {
  const list = document.querySelector(".blocks");
  if (!list) return;
  const collapsed = list.classList.toggle("collapsed-all");
  list.querySelectorAll(":scope > .block").forEach((el) => {
    if (collapsed) {
      el.classList.add("is-collapsed");
    } else {
      el.classList.remove("is-collapsed");
    }
  });
  if (btn) {
    btn.textContent = collapsed ? "Expand all" : "Collapse all";
  }
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelectorAll(".theme-toggle").forEach((toggle) => {
    toggle.classList.toggle("is-dark", theme === "dark");
    toggle.setAttribute("aria-checked", String(theme === "dark"));
  });
};

const preferredTheme = () => {
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

window.toggleTheme = () => {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  window.localStorage.setItem(THEME_KEY, next);
};

const initTwitterEmbeds = () => {
  const tweetTargets = document.querySelectorAll(".twitter-tweet");
  if (!tweetTargets.length) return;

  const ensureTwitterScript = () =>
    new Promise((resolve) => {
      if (window.twttr?.widgets?.createTweet) {
        return resolve(window.twttr);
      }

      let script = document.querySelector("script[data-twitter-widget]");
      if (!script) {
        script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.defer = true;
        script.setAttribute("data-twitter-widget", "true");
        document.body.appendChild(script);
      }

      script.addEventListener("load", () => {
        resolve(window.twttr);
      });
    });

  ensureTwitterScript().then((twttr) => {
    if (!twttr?.widgets?.createTweet) return;

    tweetTargets.forEach((el) => {
      const a = el.querySelector("a[href*='/status/']");
      if (!a) return;
      const m = a.href.match(/status\/(\d+)/);
      if (!m) return;
      const tweetId = m[1];

      // Clear fallback text
      el.innerHTML = "";

      // Optional: theme based on your current theme
      const theme =
        (document.documentElement.getAttribute("data-theme") || "light") ===
        "dark"
          ? "dark"
          : "light";

      twttr.widgets.createTweet(tweetId, el, { theme });
    });
  });
};

const initPublish = () => {
  applyTheme(preferredTheme());
  renderPropertyIcons();
  if (!window.tablerIcons) {
    window.addEventListener("load", renderPropertyIcons, { once: true });
  }

  initTwitterEmbeds();

  document.querySelectorAll(".math-block").forEach((el) => {
    const tex = el.textContent;
    try {
      katex.render(tex, el, { displayMode: true, throwOnError: false });
    } catch (_) {}
  });

  document.querySelectorAll(".code-block").forEach((block) => {
    const codeEl = block.querySelector("code");
    const doc = codeEl ? codeEl.textContent : "";
    block.textContent = "";

    const lang = (block.dataset.lang || "").toLowerCase();
    const langExt = (() => {
      if (!lang) return null;
      if (["js", "javascript", "ts", "typescript"].includes(lang)) {
        return javascript({ typescript: lang.startsWith("t") });
      }
      if (["py", "python"].includes(lang)) return python();
      if (["html", "htm"].includes(lang)) return html();
      if (["json"].includes(lang)) return json();
      if (["md", "markdown"].includes(lang)) return markdown();
      if (["sql"].includes(lang)) return sql();
      if (["css", "scss"].includes(lang)) return css();
      if (["clj", "cljc", "cljs", "clojure"].includes(lang)) return clojure();
      return null;
    })();

    const extensions = [
      lineNumbers(),
      syntaxHighlighting(defaultHighlightStyle),
      EditorView.editable.of(false),
      EditorView.lineWrapping,
    ];

    if (langExt) extensions.push(langExt);

    const state = EditorState.create({
      doc,
      extensions,
    });

    new EditorView({ state, parent: block });
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPublish);
} else {
  initPublish();
}
