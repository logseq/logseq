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

  if (sequenceKey === "t" && key === "t") {
    resetSequence();
    window.toggleTheme();
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

const searchStateMap = new WeakMap();

const getSearchContainerState = () => {
  const container =
    document.querySelector(".publish-search.is-expanded") ||
    document.querySelector(".publish-search");
  if (!container) return null;
  return searchStateMap.get(container) || null;
};

document.addEventListener("keydown", (event) => {
  const isMod = event.metaKey || event.ctrlKey;
  if (!isMod) return;

  const key = (event.key || "").toLowerCase();
  if (!key) return;

  const typingTarget = isTypingTarget(event.target);
  if (
    typingTarget &&
    !event.target.classList?.contains("publish-search-input")
  ) {
    return;
  }

  const state = getSearchContainerState();
  if (!state) return;

  if (key === "k") {
    event.preventDefault();
    state.setExpanded(true);
    state.focusInput();
    return;
  }
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

const buildSnippet = (text, query) => {
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  const idx = haystack.indexOf(needle);
  if (idx < 0) return text.slice(0, 160);
  const start = Math.max(0, idx - 48);
  const end = Math.min(text.length, idx + needle.length + 48);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
};

const initSearch = () => {
  const containers = Array.from(
    document.querySelectorAll(".publish-search")
  );
  if (!containers.length) return;

  containers.forEach((container) => {
    const graphUuid = container.dataset.graphUuid;
    const input = container.querySelector(".publish-search-input");
    const toggleBtn = container.querySelector(".publish-search-toggle");
    const toggleIcon = container.querySelector(".publish-search-toggle .ti");
    const resultsEl = container.querySelector(".publish-search-results");
    if (!input || !resultsEl || !toggleBtn) return;

    let debounceTimer = null;
    let activeController = null;
    let activeIndex = -1;
    let activeItems = [];

    const hideResults = () => {
      resultsEl.hidden = true;
      resultsEl.innerHTML = "";
      activeIndex = -1;
      activeItems = [];
    };

    const renderSection = (title) => {
      const header = document.createElement("div");
      header.className = "publish-search-section";
      header.textContent = title;
      return header;
    };

    const renderResults = (query, data) => {
      const pages = data?.pages || [];
      const blocks = data?.blocks || [];

      if (!pages.length && !blocks.length) {
        resultsEl.innerHTML = "";
        const empty = document.createElement("div");
        empty.className = "publish-search-empty";
        empty.textContent = `No results for "${query}".`;
        resultsEl.appendChild(empty);
        resultsEl.hidden = false;
        activeIndex = -1;
        activeItems = [];
        return;
      }

      const list = document.createElement("div");
      list.className = "publish-search-list";

      if (pages.length) {
        pages.forEach((page) => {
          const title = page.page_title || page.page_uuid;
          const href = `/page/${graphUuid}/${page.page_uuid}`;
          const item = document.createElement("a");
          item.className = "publish-search-result";
          item.href = href;

          const kind = document.createElement("span");
          kind.className = "publish-search-kind";
          kind.textContent = "Page";

          const titleEl = document.createElement("span");
          titleEl.className = "publish-search-title";
          titleEl.textContent = title;

          item.appendChild(kind);
          item.appendChild(titleEl);
          list.appendChild(item);
        });
      }

      if (blocks.length) {
        blocks.forEach((block) => {
          const title = block.page_title || block.page_uuid;
          const href = `/page/${graphUuid}/${block.page_uuid}#block-${block.block_uuid}`;
          const snippet = buildSnippet(block.block_content || "", query);
          const item = document.createElement("a");
          item.className = "publish-search-result";
          item.href = href;

          const titleEl = document.createElement("span");
          titleEl.className = "publish-search-title";
          titleEl.textContent = title;

          const snippetEl = document.createElement("span");
          snippetEl.className = "publish-search-snippet";
          snippetEl.textContent = snippet;

          item.appendChild(titleEl);
          item.appendChild(snippetEl);
          list.appendChild(item);
        });
      }

      resultsEl.innerHTML = "";
      resultsEl.appendChild(list);
      resultsEl.hidden = false;
      activeIndex = -1;
      activeItems = Array.from(
        resultsEl.querySelectorAll(".publish-search-result")
      );
      activeItems.forEach((item, index) => {
        item.addEventListener("mouseenter", () => {
          activeIndex = index;
          updateActive();
        });
      });
    };

    const updateActive = () => {
      if (!activeItems.length) return;
      activeItems.forEach((item, index) => {
        item.classList.toggle("is-active", index === activeIndex);
      });
      const activeEl = activeItems[activeIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    };

    const moveActive = (direction) => {
      if (!activeItems.length) {
        activeItems = Array.from(
          resultsEl.querySelectorAll(".publish-search-result")
        );
      }
      if (!activeItems.length) return;

      if (activeIndex === -1) {
        activeIndex = direction > 0 ? 0 : activeItems.length - 1;
      } else {
        activeIndex =
          (activeIndex + direction + activeItems.length) %
          activeItems.length;
      }
      updateActive();
    };

    const activateSelection = () => {
      if (!activeItems.length) {
        activeItems = Array.from(
          resultsEl.querySelectorAll(".publish-search-result")
        );
      }
      if (!activeItems.length) return;
      const item =
        activeIndex >= 0 ? activeItems[activeIndex] : activeItems[0];
      if (item?.href) {
        window.location.href = item.href;
      }
    };

    const setExpanded = (expanded) => {
      container.classList.toggle("is-expanded", expanded);
      toggleBtn.setAttribute("aria-expanded", String(expanded));
      if (toggleIcon) {
        toggleIcon.classList.toggle("ti-search", !expanded);
        toggleIcon.classList.toggle("ti-x", expanded);
      }
      if (expanded) {
        input.focus();
      } else {
        input.value = "";
        hideResults();
      }
    };

    const runSearch = async (query) => {
      if (!query) {
        hideResults();
        return;
      }

      if (activeController) activeController.abort();
      activeController = new AbortController();

      try {
        const resp = await fetch(
          `/search/${encodeURIComponent(graphUuid)}?q=${encodeURIComponent(query)}`,
          { signal: activeController.signal }
        );
        if (!resp.ok) throw new Error("search request failed");
        const data = await resp.json();
        renderResults(query, data);
      } catch (error) {
        if (error?.name === "AbortError") return;
        hideResults();
      }
    };

    if (graphUuid) {
      input.addEventListener("input", () => {
        const query = input.value.trim();
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => runSearch(query), 250);
      });
    }

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
      if (event.key === "Enter") {
        if (!resultsEl.hidden && input.value.trim()) {
          activateSelection();
          event.preventDefault();
        }
      }
      if (
        !resultsEl.hidden &&
        input.value.trim() &&
        resultsEl.querySelector(".publish-search-result")
      ) {
        const key = event.key;
        if (key === "ArrowDown" || key === "Down") {
          moveActive(1);
          event.preventDefault();
        } else if (key === "ArrowUp" || key === "Up") {
          moveActive(-1);
          event.preventDefault();
        } else if ((event.metaKey || event.ctrlKey) && key === "n") {
          moveActive(1);
          event.preventDefault();
        } else if ((event.metaKey || event.ctrlKey) && key === "p") {
          moveActive(-1);
          event.preventDefault();
        }
      }
    });

    document.addEventListener("click", (event) => {
      if (!container.contains(event.target)) setExpanded(false);
    });

    toggleBtn.addEventListener("click", () => {
      const expanded = container.classList.contains("is-expanded");
      setExpanded(!expanded);
    });

    searchStateMap.set(container, {
      setExpanded,
      focusInput: () => input.focus(),
      moveActive,
      activateSelection,
      hasResults: () => !!resultsEl.querySelector(".publish-search-result"),
      isExpanded: () => container.classList.contains("is-expanded"),
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
  initSearch();

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
