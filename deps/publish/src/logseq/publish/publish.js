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

document.addEventListener("click", (event) => {
  const btn = event.target.closest(".block-toggle");
  if (!btn) return;
  const li = btn.closest("li.block");
  if (!li) return;
  const collapsed = li.classList.toggle("is-collapsed");
  btn.setAttribute("aria-expanded", String(!collapsed));
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

const initPublish = () => {
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
