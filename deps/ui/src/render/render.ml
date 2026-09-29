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
   direct text node (cljs parity — Playwright :text-is needs it).

   The key flips between "t" (text prop) and "c" (children) so a
   text↔children transition remounts: LUI applies the textContent write
   before the child removal within a batch, which would detach the
   tracked child early. *)
let wrap ?(cls = "block-title-wrap") ?(tag = "span") ?(self = "")
    ?(wrap_attrs = []) ?(prefix : t option = None) s : t =
  match Render_inline.plain_text s, prefix with
  | Some text, None ->
      D.el ~key:("btw-t-" ^ tag) ~tag ~style_class:cls ~attrs:wrap_attrs
        ~text []
  | Some text, Some p ->
      (* annotation blocks carry plain hl text — prefix-link sibling +
         raw text node (cljs puts the title children after .prefix-link) *)
      D.el ~key:("btw-a-" ^ tag) ~tag ~style_class:cls ~attrs:wrap_attrs
        [ p; D.txt text ]
  | None, _ ->
      D.el ~key:("btw-c-" ^ tag) ~tag ~style_class:cls ~attrs:wrap_attrs
        ((match prefix with Some p -> [ p ] | None -> [])
         @ Render_inline.parse ~self s)

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

(* blocks tagged logseq.class/Query (created by the /query commands)
   render the outer .custom-query-results + .ls-query-setting shell;
   the query source lives on the hidden logseq.property/query value
   block and the queries area fills in real results later. *)
let code_block lang code =
  let trimmed = String.trim code in
  D.el ~tag:"div" ~style_class:"extensions__code"
    [ D.el ~tag:"div" ~style_class:"CodeMirror"
        ~attrs:[ ("data-lang", lang) ]
        [ (if trimmed = "" then
             (* empty line needs a br to have a box (CodeMirror renders
                one inside an empty CodeMirror-line) *)
             D.el ~tag:"pre" ~style_class:"CodeMirror-line"
               [ D.el ~tag:"br" [] ]
           else
             D.el ~tag:"pre" ~style_class:"CodeMirror-line"
               ~text:trimmed [])
        ]
    ]

(* {{query ...}} whole-title -> the query shell:
   .custom-query-results + .ls-query-setting shell; the queries area
   fills in real results later. *)
let is_whole_query s =
  let t = String.trim s in
  String.length t > 8
  && String.sub t 0 8 = "{{query "
  && String.sub t (String.length t - 2) 2 = "}}"

let query_shell =
  D.el ~tag:"div" ~style_class:"custom-query-results"
    [ D.el ~tag:"button"
        ~style_class:
          "ls-query-setting ls-small-icon text-muted-foreground ml-2 w-6 h-6"
        ~attrs:[ ("type", "button"); ("title", "Set query") ] []
    ]

let heading_tag lvl = "h" ^ string_of_int (max 1 (min lvl 6))

(* content for a (possibly quoted) body — headings nest inside quote *)
let content ?(heading : int option) ?(self = "") ?(wrap_attrs = [])
    ?(prefix : t option = None) s =
  match heading with
  | Some lvl when lvl >= 1 && lvl <= 6 ->
      wrap ~tag:("h" ^ string_of_int lvl)
        ~cls:"block-title-wrap as-heading" ~self ~wrap_attrs ~prefix s
  | _ -> (
      match heading_level s with
      | Some (lvl, rest) ->
          wrap ~tag:("h" ^ string_of_int lvl)
            ~cls:"block-title-wrap as-heading" ~self ~wrap_attrs ~prefix
            rest
      | None ->
          (* empty title: a <br> gives the inline wrap a line box, so
             .block-content keeps its clickable area (cljs does the same
             via the mldoc linebreak node it emits for empty content) *)
          if s = "" then
            D.el ~key:"btw-empty" ~tag:"span" ~style_class:"block-title-wrap"
              [ D.el ~key:"btw-br" ~tag:"br" [] ]
          else wrap ~self ~wrap_attrs ~prefix s)


(* @@html:<fragment> whole-title — parsed into real elements so the e2e
   can address the emitted markup (#embed-test). *)
let html_body s =
  let t = String.trim s in
  if starts_ci t "@@html:" then
    Some (String.trim (String.sub t 7 (String.length t - 7)))
  else None

(* calc result lines for display-type=code + code/lang=calc *)
let calc_results_el code =
  match Render_calc.results code with
  | [] -> None
  | lines ->
      Some
        (D.el ~tag:"div" ~style_class:"extensions__code-calc-results"
           (List.map
              (fun line ->
                D.el ~tag:"div"
                  ~style_class:"extensions__code-calc-output-line"
                  ~text:line [])
              lines))

(* self: uuid of the block whose title this is — seeds the ref chain
   (cljs :ref-set) that suppresses self/cycle references. is_query:
   query blocks render the .custom-query-results shell instead of
   inline content (cljs query view). *)
let title ?heading ?(is_query = false) ?(self = "")
    ?(wrap_attrs = []) ?(prefix : t option = None) (s : string) : t list =
  match html_body s with
  | Some frag -> Render_html.els_of_string frag

  | None -> (
      match quote_body s with
      | Some body ->
          [ D.el ~key:"rc-quote" ~tag:"div"
              ~attrs:[ ("data-node-type", "quote") ]
              [ content ?heading ~self body ] ]
      | None -> (
          match src_block s with
          | Some (lang, code) -> [ code_block lang code ]
          | None -> (
              if is_whole_query s || is_query then [ wrap ""; query_shell ]
              else
                match ordered_prefix s with
                | Some (num, rest) ->
                    [ D.el ~key:"rc-typed-list" ~tag:"span"
                        ~style_class:"typed-list"
                        [ D.el ~tag:"label" ~text:num [] ]
                    ; content ?heading ~self ~wrap_attrs ~prefix rest ]
                | None ->
                    [ content ?heading ~self ~wrap_attrs ~prefix s ])))

(* display-type/heading aware variant — the block model carries
   logseq.property.node/display-type + logseq.property/heading.
   ~resolved: the caller's ref-resolved title (uuid refs rendered to page
   titles); code/math surfaces keep the raw block_title. *)
let title_block ?(self = "") ?resolved ?(annot = false)
    (b : Model.block) : t list =
  let s = b.Model.block_title in
  let heading = b.Model.block_heading in
  (* cljs block-title: Pdf-annotation ref blocks prepend .prefix-link
     (.hl-page "P<n>" + optional .hl-area) and stamp data-hl-type on
     .block-title-wrap *)
  let annot = annot && b.Model.block_ls_type = Some "annotation" in
  let prefix =
    if annot then Some (Pdf_annotation.prefix_el b) else None
  in
  let wrap_attrs =
    match b.Model.block_hl_type with
    | Some ty when annot -> [ ("data-hl-type", ty) ]
    | _ -> []
  in
  match b.Model.block_display_type with
  | Some "code" ->
      let lang = Option.value b.Model.block_code_lang ~default:"" in
      code_block lang s
      :: (match calc_results_el s with Some el -> [ el ] | None -> [])
  | Some "math" ->
      [ D.el ~tag:"div" ~style_class:"math-block"
          [ Render_inline.katex_el s ] ]
  | _ ->
      title ?heading
        ~is_query:(List.mem "logseq.class/Query" b.Model.block_tag_idents)
        ~self ~wrap_attrs ~prefix (Option.value resolved ~default:s)

