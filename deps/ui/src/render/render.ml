(* Rich block-title rendering — markdown-ish inline markup -> DOM elements.

   Public contract (do not change signatures; other areas call these):

     title : string -> Lui_elements.t list
       Render a raw block title string ("has a [[page]] and #tag") into
       inline elements: a.page-ref, a.tag, mark, strong, em, code spans,
       katex, embeds, cloze, lists, .ls-datetime a.page-ref dates, etc.
       DOM contract: docs/e2e-contract.md §3.1 "Rich content".

   Implementation owns all of src/render/. *)
open Lui_elements

(* stub: plain text; the render module replaces this with real markup. *)
let title (s : string) : t list =
  [ Logseq_dom.dom ~key:"rt" ~tag:"span" ~text:s [] ]
