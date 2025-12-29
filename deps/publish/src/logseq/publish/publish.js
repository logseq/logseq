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

const initPublish = () => {
  applyTheme(preferredTheme());

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
