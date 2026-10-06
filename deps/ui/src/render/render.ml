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
(* non-span tag is always h1..h6 (callers pass ~tag:("h" ^ lvl)) *)
let h_element_tag tag =
  match tag with
  | "h1" -> (1, `H1)
  | "h2" -> (2, `H2)
  | "h3" -> (3, `H3)
  | "h4" -> (4, `H4)
  | "h5" -> (5, `H5)
  | "h6" -> (6, `H6)
  | _ -> invalid_arg ("wrap: not a heading tag: " ^ tag)

let wrap ?(cls = "block-title-wrap") ?(tag = "span") ?(self = "")
    ?(wrap_attrs = []) ?(prefix : t option = None) s : t =
  if tag <> "span" then
    (* h1..h6.block-title-wrap are e2e contract *)
    match Render_inline.plain_text s, prefix with
    | Some text, None ->
        let level, as_tag = h_element_tag tag in
        heading ~key:("btw-t-" ^ tag) ~level ~as_:as_tag ~style_class:cls
          ~data_attrs:wrap_attrs ~value:text []
    | Some text, Some p ->
        (* annotation blocks carry plain hl text — prefix-link sibling +
           raw text node (cljs puts the title children after .prefix-link).
           TODO(component): hN-with-children needs the heading kind to
           accept children (heading is a leaf; text ~as_ only covers
           phrasing tags) *)
        D.el ~key:("btw-a-" ^ tag) ~tag ~style_class:cls ~attrs:wrap_attrs
          [ p; D.txt text ]
    | None, _ ->
        (* TODO(component): same heading-children gap as btw-a *)
        D.el ~key:("btw-c-" ^ tag) ~tag ~style_class:cls ~attrs:wrap_attrs
          ((match prefix with Some p -> [ p ] | None -> [])
           @ Render_inline.parse ~self s)
  else
    match Render_inline.plain_text s, prefix with
    | Some v, None ->
        text ~key:("btw-t-" ^ tag) ~style_class:cls ~value:v []
    | Some v, Some p ->
        text ~key:("btw-a-" ^ tag) ~style_class:cls [ p; D.txt v ]
    | None, _ ->
        text ~key:("btw-c-" ^ tag) ~style_class:cls
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

(* #+BEGIN_QUOTE is deprecated in db graphs — cljs renders a
   .warning notice (t :block/deprecated-quote), not a quote block *)
let deprecated_quote s = Str_util.starts_with_ci s "#+begin_quote"

(* #+BEGIN_QUERY — same deprecation treatment (cljs
   :block/deprecated-query-syntax) *)
let deprecated_query s = Str_util.starts_with_ci s "#+begin_query"

(* '#+BEGIN_EXPORT latex' — deprecated in favor of '/Math block' *)
let deprecated_latex_export s =
  Str_util.starts_with_ci s "#+begin_export"
  && Str_util.starts_with_ci
       (String.trim
          (String.sub s (String.length "#+begin_export")
             (String.length s - String.length "#+begin_export")))
       "latex"

let deprecated_warning key =
  box ~style_class:"warning" [ text ~value:(I18n.t key) [] ]

(* #+BEGIN_SRC lang\n...\n#+END_SRC or a markdown ```lang\n...\n``` fence —
   code block; plain pre.CodeMirror-line fallback (real CodeMirror mount
   is a separate editor concern). *)
let src_block s =
  if String.length s >= 3 && String.sub s 0 3 = "```" then (
    let rest = String.sub s 3 (String.length s - 3) in
    match String.index_opt rest '\n' with
    | None -> None
    | Some nl ->
        let lang = String.trim (String.sub rest 0 nl) in
        let body =
          String.sub rest (nl + 1) (String.length rest - nl - 1)
        in
        let body =
          let n = String.length body in
          if n >= 3 && String.sub body (n - 3) 3 = "```" then
            let b = String.sub body 0 (n - 3) in
            if String.length b > 0 && b.[String.length b - 1] = '\n' then
              String.sub b 0 (String.length b - 1)
            else b
          else body
        in
        Some (lang, body))
  else
    let prefix = "#+begin_src" in
    if Str_util.starts_with_ci s prefix then (
      let rest =
        String.sub s (String.length prefix)
          (String.length s - String.length prefix)
      in
      match String.index_opt rest '\n' with
      | None -> None
      | Some nl ->
          let lang = String.trim (String.sub rest 0 nl) in
          let body_start = String.length prefix + nl + 1 in
          let body =
            String.sub s body_start (String.length s - body_start)
          in
          let body =
            let suffix = "#+end_src" in
            let n = String.length body and m = String.length suffix in
            if n >= m
               && String.lowercase_ascii (String.sub body (n - m) m)
                  = suffix
            then String.sub body 0 (n - m)
            else body
          in
          Some (lang, body))
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
        (column ~style_class:"extensions__code-calc"
           (List.map
              (fun line ->
                text ~style_class:"extensions__code-calc-output-line"
                  ~value:line [])
              lines))

(* cljs components/block.cljs src-cp actions bar — .code-block-actions
   with a language picker button + copy button. Handlers live in
   Code_mirror (open_lang_picker/copy_button). *)
let code_block_actions ~self lang =
  (* the language picker is anchored by the .select-language query in
     Code_mirror — the class stays *)
  row ~key:"cba" ~style_class:"code-block-actions" ~gap:4
    [ button ~key:"sl" ~variant:`ghost ~size:`sm
        ~style_class:"select-language ls-code-action"
        ~text:
          (if lang <> "" then lang
           else I18n.t "editor/code-language-placeholder")
        ~icon:`chevron_down ~icon_placement:`trailing
        ~on_press:(fun _ -> Code_mirror.open_lang_picker self)
        []
    ; button ~key:"cp" ~variant:`ghost ~size:`sm
        ~style_class:"ls-code-action"
        ~icon:`copy ~icon_placement:`leading
        ~text:(I18n.t "ui/copy")
        ~on_press:(fun _ -> Code_mirror.copy_button self)
        []
    ]

(* cljs src-cp + extensions/code.cljs editor DOM:
   .ui-fenced-code-editor > .ls-code-editor-wrap > (.code-block-actions +
   .extensions__code > .extensions__code-lang? + .code-editor >
   logseq-codemirror > textarea + calc-results?). The extension adapter
   emits the textarea and mounts the real CodeMirror on it (vendored
   codemirror@5) —
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
  row ~key:("fcb-" ^ self) ~grow:1.0
    ~style_class:"ui-fenced-code-editor"
    [ box ~key:"wrap" ~style_class:"ls-code-editor-wrap"
        [ code_block_actions ~self lang
        ; row ~key:"ec" ~grow:1.0 ~style_class:"extensions__code"
            ([ (if lang <> "" && not calc then
                 text ~key:"lang"
                   ~style_class:"extensions__code-lang"
                   ~value:(String.lowercase_ascii lang) []
               else Logseq_dom.fragment [])
             ; row ~key:"ce" ~grow:1.0 ~style_class:"code-editor"
                 [ (* logseq-codemirror block role: the adapter emits the
                      textarea#edit-block-<uuid>[data-lang] surface and
                      mounts CM on it (editor/code_mirror.ml owns the
                      instance) *)
                   Logseq_codemirror.cm ~key:"ta" ~uuid:self ~lang
                     ~value:code ~source_role:"block" ()
                 ; (if not calc then Logseq_dom.fragment []
                    else
                      match calc_results_el code with
                      | Some el -> el
                      | None ->
                          (* cljs mounts .extensions__code-calc for calc
                             blocks even when empty —
                             Code_mirror.update_calc fills it on change *)
                          column ~key:"calc"
                            ~style_class:"extensions__code-calc" [])
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
  (box
     [ (* <code>/<pre> carry element-tag semantics (:not(pre) > code
          styling, pre whitespace); the result text itself rides a
          signal prop *)
       text ~key:"rsc" ~as_:`Code ~value:(I18n.t "view/results") []
     ; box ~style_class:"results mt-1"
         [ text ~key:"rsp" ~as_:`Pre ~style_class:"code"
             ~value_signal:(Signal.value st)
             [] ] ])
    context parent

(* cljs block-title-aux query-setting: class-Query blocks get a ghost
   settings button next to the title (opacity-0 until the head row is
   hovered) that toggles the query source editor inside the block's
   below-row .custom-query-results view *)
let query_setting_el ~block_uuid =
  button ~key:"qs" ~variant:`ghost ~size:`icon
    ~style_class:"ls-query-setting ls-small-icon"
    ~label:(I18n.t "block/set-query")
    ~icon:`settings
    ~on_press:(fun _ -> Views_view.toggle_query_editor ~block_uuid)
    []

(* cljs cards-block?: logseq.class/Cards tag adds a "Practice" ghost
   button next to the title that opens the flashcards modal
   ([:modal/show-cards] -> ls:open-cards) *)
let practice_el =
  button ~key:"pr" ~variant:`ghost ~size:`sm
    ~label:(I18n.t "block/practice-cards")
    ~text:(I18n.t "block/practice")
    ~on_press:(fun _ ->
      Web_dom.dispatch_custom "ls:open-cards" Js.Json.null)
    []

let is_query_block (b : Model.block) =
  List.mem "logseq.class/Query" b.Model.block_tag_idents

let is_cards_block (b : Model.block) =
  List.mem "logseq.class/Cards" b.Model.block_tag_idents

(* cljs custom-query*: class-Query blocks render their live query inside
   .custom-query > .bd > .custom-query-results BELOW .block-main-container
   (a sibling inside .ls-block) — mounted declaratively as a KQuery view
   (.views-query-inner + raw-source .CodeMirror when the editor is open) *)
let query_below_el uuid =
  box ~key:("cq-" ^ uuid) ~style_class:"custom-query"
    [ box ~style_class:"bd"
        [ box ~style_class:"custom-query-results"
            [ Views_view.view
                ~kind:(Views_state.KQuery { block_uuid = uuid })
                ~owner:(Wire.Uuid uuid) ]
        ]
    ]

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
            text ~key:"btw-empty" ~style_class:"block-title-wrap"
              [ br ~key:"btw-br" [] ]
          else wrap ~self ~wrap_attrs ~prefix s)


(* @@html:<fragment> whole-title — parsed into real elements so the e2e
   can address the emitted markup (#embed-test). *)
let html_body s =
  let t = String.trim s in
  if Str_util.starts_with_ci t "@@html:" then
    Some (String.trim (String.sub t 7 (String.length t - 7)))
  else None

(* cljs block-title picks the .block-head-wrap carrier by
   logseq.property.node/display-type: code -> .flex.flex-1.w-full,
   math -> bare .math-block (no carrier), text -> .w-full.inline. *)
let title_outer_class (b : Model.block) =
  (* cljs block-title-aux: the title wrapper is .inline-flex only for
     class-Query blocks (title + setting button) *)
  if is_query_block b then Some "inline-flex"
  else
    match b.Model.block_display_type with
    | Some "code" -> Some "flex flex-1 w-full"
    | Some "math" -> None
    | _ ->
        let s = b.Model.block_title in
        if src_block s <> None || src_eval_parts s <> None then
          Some "flex flex-1 w-full"
        else Some "w-full inline"

(* self: uuid of the block whose title this is — seeds the ref chain
   (cljs :ref-set) that suppresses self/cycle references. is_query:
   class-Query blocks keep their title and append the query-setting
   ghost button; the live query shell lives below the block row
   (query_below_el). is_cards: class-Cards blocks append "Practice". *)
let title ?heading ?(is_query = false) ?(is_cards = false) ?(self = "")
    ?(wrap_attrs = []) ?(prefix : t option = None) (s : string) : t list =
  match html_body s with
  | Some frag -> Render_html.els_of_string frag

  | None ->
      if deprecated_quote s then
        [ (* data-node-type attr is an e2e selector *)
          box ~key:"rc-quote"
            ~data_attrs:[ ("data-node-type", "quote") ]
            [ deprecated_warning "block/deprecated-quote" ] ]
      else if deprecated_query s then
        [ deprecated_warning "block/deprecated-query-syntax" ]
      else if deprecated_latex_export s then
        [ deprecated_warning "block/deprecated-latex-export" ]
      else
        match src_block s with
        | Some (lang, code) -> [ code_block ~self lang code ]
        | None -> (
            (* {{query}} is a normal inline macro — macro_el renders the
               deprecation .warning inside .block-title-wrap like cljs *)
            let tail =
              (if is_query then [ query_setting_el ~block_uuid:self ]
               else [])
              @ if is_cards then [ practice_el ] else []
            in
            match ordered_prefix s with
            | Some (num, rest) ->
                [ text ~key:"rc-typed-list" ~style_class:"typed-list"
                    [ label ~value:num [] ]
                ; content ?heading ~self ~wrap_attrs ~prefix rest ]
                @ tail
            | None ->
                [ content ?heading ~self ~wrap_attrs ~prefix s ] @ tail)

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
      [ box ~style_class:"math-block"
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

