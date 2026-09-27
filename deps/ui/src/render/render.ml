(* Rich block-title rendering — markdown-ish inline markup -> DOM elements.

   Public contract (do not change signatures; other areas call these):

     title : string -> Lui_elements.t list
       Render a raw block title string ("has a [[page]] and #tag") into
       elements to mount inside .block-content.  The first element is
       always the .block-title-wrap (span, or h1..h6 for markdown
       headings); block-level constructs (code blocks, query results,
       embeds) append sibling elements after it.

   DOM contract: docs/e2e-contract.md §3.1 "Rich content".
   Inline markup lives in render_inline.ml; shared element helpers in
   render_dom.ml. *)

open Lui_elements
module D = Render_dom

(* .block-title-wrap with inline-parsed children; plain titles become a
   direct text node (cljs parity — Playwright :text-is needs it) *)
let wrap ?(cls = "block-title-wrap") ?(tag = "span") s : t =
  match Render_inline.plain_text s with
  | Some text -> D.el ~tag ~style_class:cls ~text []
  | None -> D.el ~tag ~style_class:cls (Render_inline.parse s)

(* #..###### markdown heading at title start *)
let heading_level s =
  let n = String.length s in
  let rec count i =
    if i < n && s.[i] = '#' then count (i + 1) else i
  in
  let i = count 0 in
  if i >= 1 && i <= 6 && i < n && (s.[i] = ' ' || s.[i] = '\t')
  then Some (i, String.trim (String.sub s (i + 1) (n - i - 1)))
  else None

(* "1. " ordered-list prefix *)
let ordered_prefix s =
  let n = String.length s in
  let rec digits i =
    if i < n && s.[i] >= '0' && s.[i] <= '9' then digits (i + 1) else i
  in
  let i = digits 0 in
  if i > 0 && i + 1 < n && s.[i] = '.' && s.[i + 1] = ' '
  then
    Some
      ( String.sub s 0 (i + 1)
      , String.trim (String.sub s (i + 2) (n - i - 2)) )
  else None

let starts_ci s pat =
  let n = String.length pat in
  String.length s >= n
  && String.lowercase_ascii (String.sub s 0 n)
     = String.lowercase_ascii pat

(* #+BEGIN_QUOTE body [#+END_QUOTE] — directive may wrap the rest of the
   title inline. *)
let quote_body s =
  let prefix = "#+begin_quote" in
  if starts_ci s prefix then
    let body =
      String.trim (String.sub s (String.length prefix)
                     (String.length s - String.length prefix))
    in
    let body =
      let suffix = "#+end_quote" in
      let n = String.length body and m = String.length suffix in
      if n >= m
         && String.lowercase_ascii (String.sub body (n - m) m) = suffix
      then String.trim (String.sub body 0 (n - m))
      else body
    in
    Some body
  else None

(* #+BEGIN_SRC lang\n...\n#+END_SRC — code block; plain pre.CodeMirror-line
   fallback (real CodeMirror mount is a separate editor concern). *)
let src_block s =
  let prefix = "#+begin_src" in
  if starts_ci s prefix then
    let rest = String.sub s (String.length prefix)
                 (String.length s - String.length prefix) in
    match String.index_opt rest '\n' with
    | None -> None
    | Some nl ->
        let lang = String.trim (String.sub rest 0 nl) in
        let body_start = String.length prefix + nl + 1 in
        let body = String.sub s body_start (String.length s - body_start) in
        let body =
          let suffix = "#+end_src" in
          let n = String.length body and m = String.length suffix in
          if n >= m
             && String.lowercase_ascii
                  (String.sub body (n - m) m) = suffix
          then String.sub body 0 (n - m)
          else body
        in
        Some (lang, body)
  else None

(* {{query ...}} occupying the whole title — emit the outer
   .custom-query-results + .ls-query-setting shell; the queries area
   fills in real results later. *)
let is_whole_query s =
  let t = String.trim s in
  String.length t > 8
  && String.sub t 0 8 = "{{query "
  && String.sub t (String.length t - 2) 2 = "}}"

let code_block lang code =
  D.el ~tag:"div" ~style_class:"extensions__code"
    [ D.el ~tag:"div" ~style_class:"CodeMirror"
        ~attrs:[ ("data-lang", lang) ]
        [ D.el ~tag:"pre" ~style_class:"CodeMirror-line"
            ~text:(String.trim code) []
        ]
    ]

let query_shell =
  D.el ~tag:"div" ~style_class:"custom-query-results"
    [ D.el ~tag:"button"
        ~style_class:
          "ls-query-setting ls-small-icon text-muted-foreground ml-2 w-6 h-6"
        ~attrs:[ ("type", "button"); ("title", "Set query") ] []
    ]

(* content for a (possibly quoted) body — headings nest inside quote *)
let content s =
  match heading_level s with
  | Some (lvl, rest) ->
      wrap ~tag:("h" ^ string_of_int lvl)
        ~cls:"block-title-wrap as-heading" rest
  | None ->
      (* empty title: a <br> gives the inline wrap a line box, so
         .block-content keeps its clickable area (cljs does the same via
         the mldoc linebreak node it emits for empty content) *)
      if s = "" then
        D.el ~tag:"span" ~style_class:"block-title-wrap" [ D.el ~tag:"br" [] ]
      else wrap s

let title (s : string) : t list =
  match quote_body s with
  | Some body ->
      [ D.el ~tag:"div" ~attrs:[ ("data-node-type", "quote") ]
          [ content body ] ]
  | None -> (
      match src_block s with
      | Some (lang, code) -> [ code_block lang code ]
      | None -> (
          if is_whole_query s then [ wrap ""; query_shell ]
          else (
              match ordered_prefix s with
              | Some (num, rest) ->
                  [ D.el ~tag:"span" ~style_class:"typed-list"
                      [ D.el ~tag:"label" ~text:num [] ]
                  ; content rest ]
              | None -> [ content s ])))
