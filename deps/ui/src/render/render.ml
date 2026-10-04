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
(* calc result lines for display-type=code + code/lang=calc — cljs
   extensions/calc.cljc results (.extensions__code-calc > per-line
   .extensions__code-calc-output-line), mounted inside .code-editor *)
let calc_results_el code =
  match Render_calc.results code with
  | [] -> None
  | lines ->
      Some
        (D.el ~tag:"div" ~style_class:"extensions__code-calc pr-2"
           (List.map
              (fun line ->
                D.el ~tag:"div"
                  ~style_class:"extensions__code-calc-output-line"
                  ~text:line [])
              lines))

(* cljs components/block.cljs src-cp actions bar — .code-block-actions
   with a language picker button + copy button. Handlers live in
   Code_mirror (open_lang_picker/copy_button). *)
let code_block_actions ~self lang =
  D.el ~key:"cba" ~tag:"div" ~style_class:"code-block-actions"
    [ D.el ~key:"sl" ~tag:"button"
        ~style_class:"select-language"
        ~attrs:[ ("type", "button"); ("blockid", self) ]
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Code_mirror.open_lang_picker self)
        [ D.el ~key:"t" ~tag:"span"
            ~text:
              (if lang <> "" then lang
               else I18n.t "editor/code-language-placeholder")
            []
        ; Icons.icon ~size:14. "chevron-down"
        ]
    ; D.el ~key:"cp" ~tag:"button"
        ~attrs:[ ("type", "button") ]
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Code_mirror.copy_button self)
        [ Icons.icon ~size:14. "copy"
        ; D.el ~key:"l" ~tag:"span" ~text:(I18n.t "ui/copy") []
        ]
    ]

(* cljs src-cp + extensions/code.cljs editor DOM:
   .ui-fenced-code-editor > .ls-code-editor-wrap > (.code-block-actions +
   .extensions__code > .extensions__code-lang? + .code-editor > textarea
   + calc-results?). Code_mirror mounts the real CodeMirror on the
   textarea via the document mutation scan (vendored codemirror@5) —
   DOM structure matches cljs so both display and edit look identical.
   ~extra appends inside .extensions__code (the src-eval .results div). *)
let code_block ?(self = "") ?(extra = []) lang code =
  let lang =
    (* cljs src-cp aliases the fence's stored lang to clojure *)
    match lang with
    | "edn" | "clj" | "cljc" | "cljs" | "clojurescript" -> "clojure"
    | l -> l
  in
  let calc = lang = "calc" in
  D.el ~key:("fcb-" ^ self) ~tag:"div"
    ~style_class:"ui-fenced-code-editor flex w-full"
    [ D.el ~key:"wrap" ~tag:"div" ~style_class:"ls-code-editor-wrap"
        [ code_block_actions ~self lang
        ; D.el ~key:"ec" ~tag:"div"
            ~style_class:"extensions__code flex flex-1"
            ~attrs:(if calc then [ ("data-lang", "calc") ] else [])
            ([ (if lang <> "" && not calc then
                 D.el ~key:"lang" ~tag:"div"
                   ~style_class:"extensions__code-lang"
                   ~text:(String.lowercase_ascii lang) []
               else Logseq_dom.fragment [])
             ; D.el ~key:"ce" ~tag:"div"
                 ~style_class:"code-editor flex flex-1 flex-row w-full"
                 [ D.el ~key:"ta" ~tag:"textarea"
                     ~id:("edit-block-" ^ self)
                     ~attrs:
                       (if lang <> "" then [ ("data-lang", lang) ]
                        else [])
                     ~text:code []
                 ; (if not calc then Logseq_dom.fragment []
                    else
                      match calc_results_el code with
                      | Some el -> el
                      | None ->
                          (* cljs mounts .extensions__code-calc for calc
                             blocks even when empty —
                             Code_mirror.update_calc fills it on change *)
                          D.el ~key:"calc" ~tag:"div"
                            ~style_class:"extensions__code-calc pr-2" [])
                 ]
             ]
            @ extra)
        ]
    ]

let has_sub hay needle =
  let n = String.length hay and m = String.length needle in
  let rec go i =
    i + m <= n && (String.sub hay i m = needle || go (i + 1))
  in
  go 0

(* "#+BEGIN_SRC clojure :results" — cljs src-cp evals the body through
   sci/eval-string ('block bound) only for clojure language + :results
   option. Options only survive on raw #+BEGIN_SRC titles (saved
   display-type=code blocks drop the fence header). *)
let src_eval_parts s =
  match src_block s with
  | Some (hdr, code) -> (
      match String.index_opt hdr ' ' with
      | None -> None
      | Some i ->
          let lang = String.sub hdr 0 i in
          let opts = String.sub hdr (i + 1) (String.length hdr - i - 1) in
          if String.lowercase_ascii lang = "clojure"
             && has_sub opts ":results"
          then Some (lang, code)
          else None)
  | None -> None

(* async eval-string -> div > code "Results" + .results.mt-1 > pre.code;
   stays empty until the worker answers (cljs mounts the shell and fills
   the value when sci resolves) *)
let src_eval_el ~(code : string) ~(uuid : string) : t =
 fun context parent ->
  let st = Signal.state context.Lui_ui.ui_scheduler "" in
  Render_state.with_repo (fun repo ->
      Runtime.invoke3 "thread-api/eval-string" (Wire.String repo)
        (Wire.String code) (Wire.String uuid)
      |> Js.Promise.then_ (fun w ->
             (match w with
              | Wire.String s -> Runtime.signal_set st s
              | Wire.Nil -> ()
              | w -> Runtime.signal_set st (Edn.to_string w));
             Js.Promise.resolve ())
      |> ignore);
  Logseq_dom.dyn ~equal:(fun a b -> (a : string) = b)
    (fun s ->
      D.el ~tag:"div"
        [ D.el ~tag:"code" ~text:(I18n.t "view/results") []
        ; D.el ~tag:"div" ~style_class:"results mt-1"
            [ D.el ~tag:"pre" ~style_class:"code" ~text:s [] ] ])
    (Signal.value st)
    context parent

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
        ~attrs:[ ("type", "button"); ("title", I18n.t "block/set-query") ] []
    ]

(* cljs block-title-aux query-setting: class-Query blocks get a ghost
   settings button next to the title (opacity-0 until the head row is
   hovered) that toggles the query source editor — the delegated click
   handler in Views_mount resolves the shell inside the same .ls-block *)
let query_setting_el =
  D.el ~key:"qs" ~tag:"button"
    ~style_class:
      "ls-query-setting ls-small-icon text-muted-foreground ml-2 w-6 h-6 \
       transition-opacity ease-in duration-300 opacity-0"
    ~attrs:[ ("type", "button"); ("title", I18n.t "block/set-query") ]
    [ Icons.icon ~size:14. "settings" ]

(* cljs cards-block?: logseq.class/Cards tag adds a "Practice" ghost
   button next to the title that opens the flashcards modal
   ([:modal/show-cards] -> ls:open-cards) *)
let practice_el =
  D.el ~key:"pr" ~tag:"button"
    ~style_class:"!px-1 text-xs text-muted-foreground"
    ~attrs:
      [ ("type", "button"); ("title", I18n.t "block/practice-cards") ]
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then Platform.dispatch "ls:open-cards" Js.Json.null)
    [ D.el ~tag:"span" ~text:(I18n.t "block/practice") [] ]

let is_query_block (b : Model.block) =
  List.mem "logseq.class/Query" b.Model.block_tag_idents

let is_cards_block (b : Model.block) =
  List.mem "logseq.class/Cards" b.Model.block_tag_idents

(* cljs custom-query*: class-Query blocks render their live query inside
   .custom-query > .bd > .custom-query-results BELOW .block-main-container
   (a sibling inside .ls-block); Views_mount.ensure_query_shells mounts
   the query-result view into it *)
let query_below_el uuid =
  D.el ~key:("cq-" ^ uuid) ~tag:"div" ~style_class:"custom-query"
    [ D.el ~tag:"div" ~style_class:"bd"
        [ D.el ~tag:"div" ~style_class:"custom-query-results" [] ] ]

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

(* self: uuid of the block whose title this is — seeds the ref chain
   (cljs :ref-set) that suppresses self/cycle references. is_query:
   class-Query blocks keep their title and append the query-setting
   ghost button; the live query shell lives below the block row
   (query_below_el). is_cards: class-Cards blocks append "Practice". *)
let title ?heading ?(is_query = false) ?(is_cards = false) ?(self = "")
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
          | Some (lang, code) -> [ code_block ~self lang code ]
          | None -> (
              if is_whole_query s then [ wrap ""; query_shell ]
              else
                let tail =
                  (if is_query then [ query_setting_el ] else [])
                  @ if is_cards then [ practice_el ] else []
                in
                match ordered_prefix s with
                | Some (num, rest) ->
                    [ D.el ~key:"rc-typed-list" ~tag:"span"
                        ~style_class:"typed-list"
                        [ D.el ~tag:"label" ~text:num [] ]
                    ; content ?heading ~self ~wrap_attrs ~prefix rest ]
                    @ tail
                | None ->
                    [ content ?heading ~self ~wrap_attrs ~prefix s ] @ tail)))

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
      [ code_block ~self lang s ]
  | Some "math" ->
      [ D.el ~tag:"div" ~style_class:"math-block"
          [ Render_inline.katex_el ~block:true ~display:true s ] ]
  | _ -> (
      match src_eval_parts s with
      | Some (lang, code) ->
          [ code_block ~self lang code
              ~extra:
                [ src_eval_el ~code
                    ~uuid:(Option.value b.Model.block_uuid ~default:"") ] ]
      | None ->
          title ?heading ~is_query:(is_query_block b)
            ~is_cards:(is_cards_block b) ~self ~wrap_attrs ~prefix
            (Option.value resolved ~default:s))

