(* Native twin of sdk/markdown.ml — no window.marked/DOMPurify on
   native. Matches the cljs fallback: markdown-to-html returns the raw
   input when marked is unavailable. *)

let markdown_to_html s = s
