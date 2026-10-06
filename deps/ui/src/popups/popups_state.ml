(* Autocomplete popups + block context menu state — mirrors
   src/main/frontend/components/editor.cljs (auto-complete) and
   src/main/frontend/components/content.cljs (custom context menu).

   Documented cross-area hooks dispatched on document:
   - "ls:editor-insert"  CustomEvent {text, from, to, back}
     replace buffer range [from,to) (the typed trigger text) with text;
     `back` pulls the caret back (cljs backward-pos).
   - "ls:editor-command" CustomEvent {command, from, to, block?}
     editor-owned side effect (heading/status/priority/color/…) consumed
     by editor/editor_commands.ml. `from`/`to` is the slash-command range
     the consumer clears before running the command.
   The editor area wires the listeners; see e2e-contract.md. *)

open Promise_ext
module S = String
module U = I18n

type ac_kind =
    Slash | Page_ref | Page_embed | Block_ref | Tag_search
  | Template_search | Embed_ref
type item_action =
  | Emit of string * int (* ls:editor-insert {text, back} *)
  | Emit_exit of string (* ls:editor-insert {text, exit} — cljs clear-edit! *)
  | Switch of ac_kind (* reopen as another autocomplete *)
  | Editor_cmd of string (* ls:editor-command {command, from, to} *)
  | Embed of string (* page title — insert a :block/link embed *)
  | Tag_apply of string (* existing entity — cljs tag-on-chosen-handler *)
  | Tag_create of string (* "New tag" row — always creates a class *)
  | Template_apply of string (* template block uuid — apply-template op *)
  | Run_query of bool (* cljs editor/run-query-command; arg = advanced? *)
  | Plugin_slash of string * string (* plugin pid + trigger tag *)
  | Noop (* "No matched commands" row — applies to nothing *)

(* cljs commands-map item doc: title attr text, label echo, formatted
   desc, or the vector help tooltip (Query) *)
type ac_desc =
  | Desc_none
  | Desc_key of string
  | Desc_self
  | Desc_fmt of string
  | Desc_custom of string
  | Desc_help

type ac_item =
  { ai_key : string
  ; ai_label : string
  ; ai_icon : string option (* tabler/tabler-ext icon name *)

  ; ai_group : string option
  ; ai_info : string option
  ; ai_title : string option (* cljs item-render div[title] *)
  ; ai_help : bool (* cljs item-render div.has-help > small help icon *)
  ; ai_node : bool (* cljs node-render shape (page/tag/block search) *)
  ; ai_node_icon : (string * bool) option
  (* icon name for the h-5 slot; bool = wrap in .icon-cp-container *)
  ; ai_title_icon : string option
  (* entity icon → gap-1 wrap around the title (block-title-with-icon) *)
  ; ai_breadcrumb : string option (* mb-1 breadcrumb row; Some "" = empty *)
  ; ai_idx : int
  ; ai_hdr : string option (* group-name banner, only on group starts *)
  ; ai_act : item_action
  }

let mk_item ~key ~label ?icon ?group ?info ?(desc = Desc_none)
    ?(node = false) ?node_icon ?title_icon ?breadcrumb act =
  let title, help =
    match desc with
    | Desc_none -> (None, false)
    | Desc_key k -> (Some (U.t k), false)
    | Desc_self -> (Some label, false)
    | Desc_fmt k -> (Some (U.tf k [ label ]), false)
    | Desc_custom t -> (Some t, false)
    | Desc_help -> (None, true)
  in
  { ai_key = key; ai_label = label; ai_icon = icon; ai_group = group
  ; ai_info = info; ai_title = title; ai_help = help
  ; ai_node = node; ai_node_icon = node_icon
  ; ai_title_icon = title_icon; ai_breadcrumb = breadcrumb
  ; ai_idx = -1
  ; ai_hdr = None; ai_act = act }

let empty_key = "__ac_empty__"
let empty_item = mk_item ~key:empty_key ~label:"" Noop

type ac =
  { kind : ac_kind
  ; x : float
  ; y : float
  ; cy : float (* caret line top — flip-above anchor *)
  ; flip : (float * float) option
    (* Some (top, avail-h) once the popup measured too tall for the
       space below the caret — base-ui avoidCollisions flips it above *)
  ; flipx : float option
    (* Some left' when the popup measured wider than the space to the
       right of the caret — base-ui flips align start->end, so the
       right edge lands at the caret; x keeps the caret anchor *)
  ; query : string
  ; tpos : int (* query-trigger offset (the "/" "[[" "((" "#" start) *)
  ; tlen : int
  ; items : ac_item list
  ; chosen : int
  ; auuid : string (* editing uuid the popup was opened on — a remount
     swaps editing_uuid before the position check can run *)
  }

type cm_picker = Picker_emoji | Picker_icon

type cm_item =
  (* label, optional (binding, display caps) shortcut, command id —
     mirrors ui/dropdown-shortcut output; the id is what
     ls:editor-command carries *)
  | Ci_item of string * (string * string list) option * string
  | Ci_sub of string * cm_sub
  | Ci_sep
  | Ci_colors
  | Ci_headings

and cm_sub =
  (* Sub_menu renders a dropdown-menu-sub-content of items; Sub_picker
     opens the icon/emoji picker anchored to the trigger *)
  | Sub_menu of cm_item list
  | Sub_picker of cm_picker

type cm =
  { cx : float
  ; cy : float
  ; block_id : string (* owner block/page entity of the menu target *)
  ; multi : bool
  ; entries : cm_item list
  ; sub_open : int (* index into entries, -1 = none *)
  ; sub_xy : float * float
  ; tag : (string * int * bool) option
    (* Some (uuid, db/id, private?) => block-tag chip menu, not the
       block context menu *)
  }

type pv =
  { pv_x : float
  ; pv_y : float
  ; pv_title : string
  ; pv_page : Model.page option (* feeds the title actions — cljs
                                     page-preview renders page-cp with
                                     with-actions? *)
  ; pv_blocks : Model.block list
  }

type view =
  { ac : ac option
  ; cm : cm option
  ; pv : pv option
  }

type t =
  { vs : view Signal.state
  ; gen : int ref (* stale-response guard *)
  ; titles : string list ref
  ; tag_titles : (string * string option) list ref
    (* class/tag entities for the # popup: (title, tabler icon) *)
  ; tag_exact_titles : string list ref
    (* every class + alias title — feeds only the exact-match check that
       suppresses the "New tag" row (cljs page-exists?/class-alias?); the
       candidate list stays private-tag-filtered *)
  ; templates : (string * string) list ref (* (uuid, title) *)  }

(* the live popups layer — exactly one exists per app; lets editor key
   handling yield to an open autocomplete (cljs: the commands popup consumes
   arrows/enter/tab/escape before the editor sees them) *)
let active : t option ref = ref None

let make scheduler : t =
  let t =
    { vs = Signal.state scheduler { ac = None; cm = None; pv = None }
  ; gen = ref 0
  ; titles = ref []
    ; tag_titles = ref []
    ; tag_exact_titles = ref []
    ; templates = ref []  }
  in
  active := Some t;
  t

let get t = Signal.get t.vs.Signal.state_signal

(* signal of whether any popover layer (autocomplete / context menu /
   picker popup) is open — drives chrome that must hide while one is up *)
let popup_signal () =
  match !active with
  | Some t ->
      Some
        (Signal.map
           (fun v -> v.ac <> None || v.cm <> None || v.pv <> None)
           t.vs.Signal.state_signal)
  | None -> None

(* signal of whether a popover layer other than the context menu is open —
   cljs keeps the selection action-bar rendered while the block context
   menu that spawned from it is open, so the bar only hides under the
   other layers *)
let non_cm_popup_signal () =
  match !active with
  | Some t ->
      Some
        (Signal.map
           (fun v -> v.ac <> None || v.pv <> None)
           t.vs.Signal.state_signal)
  | None -> None

let ac_open () =
  match !active with
  | Some t -> (get t).ac <> None
  | None -> false

(* THE "is the pointer over popup UI" check — hit-tests mounted roots
   rather than enumerating selector lists: every popup mounts either
   inside the .cp__overlays chrome container (ac/cm/pv, cmdk, dialogs,
   toasts, page menu) or registers a body-level root it owns
   (Properties_state overlays, Editor_commands inline popups) *)
let inside el =
  Web_dom.el_closest el ".cp__overlays" <> None
  || Properties_state.overlay_contains el
  ||
  (match !Runtime.editor_popup_root with
   | Some root -> Web_dom.el_contains root el
   | None -> false)

(* whether any popup layer is up, for code paths that only need the
   boolean (the per-layer popup_signal above drives reactive chrome) *)
let any_open () =
  (match popup_signal () with
   | Some s -> Signal.get s
   | None -> false)
  || Cmdk_state.is_open ()
  || Properties_state.overlay_open ()
  || !Runtime.editor_popup_root <> None

(* popup bound to the block currently being edited (unanchored popups
   like cmdk-spawned search count as attached too) *)
let ac_attached () =
  match !active with
  | Some t -> (
      match (get t).ac with
      | Some ac ->
        ac.auuid = "" || Editor_state.editing_uuid () = Some ac.auuid
      | None -> false)
  | None -> false

let set t v = Runtime.signal_set t.vs v
let set_ac t ac = set t { (get t) with ac }
let set_cm t cm = set t { (get t) with cm }
let set_pv t pv = set t { (get t) with pv }
let close_ac t = set_ac t None
let close_cm t = set_cm t None
let close_pv t = set_pv t None

(* title + blocks of the page a .preview-ref-link points at — same bare
   uuid/name ref as sidebar_state.fetch_blocks *)

let fetch_preview repo name
    : (string * Model.page option * Model.block list) Js.Promise.t =
  let* info =
    Runtime.invoke2 "thread-api/get-page-route-info" (Wire.String repo)
      (Wire.page_ref name)
  in
  let page = Decode.page_of_summary info in
  let title =
    match page with
    | Some p -> p.Model.page_title
    | None -> name
  in
  let* w =
    Runtime.invoke3 "thread-api/get-page-blocks-tree"
      (Wire.String repo) (Wire.page_ref name) Wire.Nil
  in
  Js.Promise.resolve
    (title, page, Decode.blocks_of_wire w)

let ac_class_of_kind = function
  | Slash -> "cp__commands-slash"
  | Page_ref | Page_embed | Tag_search | Template_search | Embed_ref
      -> "black"
  | Block_ref -> "ac-block-search"
;;

let trigger_len_of_kind = function
  | Slash | Tag_search | Template_search -> 1
  | Page_ref | Page_embed | Block_ref -> 2
  | Embed_ref -> 0 (* only reachable via Switch — no typed trigger *)

(* cljs data-editor-popup-ref values drive popup sizing in editor.css *)
let popup_ref_of_kind = function
  | Slash -> "commands"
  | Page_ref | Page_embed | Embed_ref | Template_search -> "page-search"
  | Block_ref -> "block-search"
  | Tag_search -> "page-search-hashtag"
;;

let trigger_text_of_kind = function
  | Page_ref | Page_embed -> "[["
  | Embed_ref -> ""
  | Block_ref -> "(("
  | Tag_search -> "#"
  | Slash | Template_search -> "/"
;;

(* ---- slash command table ---- *)

let journal_offset days =
  let d = Dates.date_now () in
  ignore (Js.Date.setDate ~date:(Js.Date.getDate d +. float_of_int days) d);
  "[[" ^ Dates.journal_title_of d ^ "]]"
;;

let current_time () =
  let d = Dates.date_now () in
  Printf.sprintf "%02d:%02d"
    (int_of_float (Js.Date.getHours d))
    (int_of_float (Js.Date.getMinutes d))
;;

(* (i18n key, icon, desc, action) — icon names mirror commands.cljs :icon/*
   values verbatim (custom-pack names like pageRef stay camelCase); desc
   mirrors each command tuple's doc slot (title attr / help tooltip) *)
let group_items grp entries =
  let g = Some (U.t grp) in
  List.map
    (fun (key, icon, desc, act) ->
      mk_item ~key ~label:(U.t key) ~icon ?group:g ~desc act)
    entries

;;

let cmd label = Editor_cmd label

(* has_heading gates "Clear heading" (cljs filter-commands drops it when
   the edited block has no heading prop, leaving "No matched commands") *)
let slash_items ~has_heading : ac_item list =  List.concat
    [ group_items "editor.slash/group-basic"
        [ "editor.slash/node-reference", "pageRef"
          , Desc_key "editor.slash/node-reference-desc", Switch Page_ref
        ; "editor.slash/node-embed", "blockEmbed"
          , Desc_key "editor.slash/node-embed-desc", Switch Embed_ref ]
    ; group_items "editor.slash/group-format"
        [ "ui/link", "link", Desc_key "editor.slash/link-desc", cmd "link"
        ; "editor.slash/image-link", "photoLink"
          , Desc_key "editor.slash/image-link-desc", cmd "image-link"
        ; "editor.slash/underline", "underline"
          , Desc_key "editor.slash/underline-desc", Emit ("<ins></ins>", 6)
        ; "editor.slash/code-block", "code"
          , Desc_key "editor.slash/code-block-desc", cmd "code-block"
        ; "class.built-in/quote-block", "quote"
          , Desc_key "editor.slash/quote-desc", cmd "quote"
        ; "editor.slash/math-block", "math"
          , Desc_key "editor.slash/math-block-desc", cmd "math-block" ]
    ; (let g = Some (U.t "editor.slash/group-heading") in
       [ mk_item ~key:"editor.slash/normal-text"
           ~label:(U.t "editor.slash/normal-text") ~icon:"text" ?group:g
           ~desc:(Desc_key "editor.slash/normal-text-desc")
           (cmd "normal-text") ]
       @ (if has_heading then
            [ mk_item ~key:"editor.slash/clear-heading"
                ~label:(U.t "editor.slash/clear-heading") ~icon:"heading-off"
                ?group:g ~desc:(Desc_key "editor.slash/normal-text-desc")
                (cmd "clear-heading") ]
          else [])
       @ List.init 6 (fun i ->
           let l = string_of_int (i + 1) in
           mk_item ~key:("heading-" ^ l)
             ~label:(U.tf "editor.slash/heading-label" [ l ])
             ~icon:("h-" ^ l) ?group:g ~desc:Desc_self
             (cmd ("heading:" ^ l))))    ; group_items "editor.slash/group-task-status"
        [ "property.status/backlog", "Backlog"
          , Desc_fmt "editor.slash/status-desc", cmd "status:Backlog"
        ; "property.status/todo", "Todo"
          , Desc_fmt "editor.slash/status-desc", cmd "status:Todo"
        ; "property.status/doing", "InProgress50"
          , Desc_fmt "editor.slash/status-desc", cmd "status:Doing"
        ; "property.status/in-review", "In Review"
          , Desc_fmt "editor.slash/status-desc", cmd "status:In Review"
        ; "property.status/done", "Done"
          , Desc_fmt "editor.slash/status-desc", cmd "status:Done"
        ; "property.status/canceled", "Cancelled"
          , Desc_fmt "editor.slash/status-desc", cmd "status:Canceled" ]    ; group_items "editor.slash/group-task-date"
        [ "property.built-in/deadline", "calendar-stats"
          , Desc_none, cmd "deadline"
        ; "property.built-in/scheduled", "calendar-month"
          , Desc_none, cmd "scheduled" ]
    ; (let g = Some (U.t "editor.slash/group-priority") in
       mk_item ~key:"editor.slash/no-priority"
         ~label:(U.t "editor.slash/no-priority") ~icon:"priorityLvlNone"
         ?group:g (cmd "priority:")
       :: List.map            (fun lvl ->
              let lvl_label = U.t ("property.priority/" ^ lvl) in
              mk_item ~key:("priority-" ^ lvl)
                ~label:(U.tf "editor.slash/priority-label" [ lvl_label ])
                ~icon:("priorityLvl" ^ String.capitalize_ascii lvl)
                ~desc:
                  (Desc_custom (U.tf "editor.slash/priority-desc" [ lvl_label ]))
                ?group:g (cmd ("priority:" ^ lvl)))            [ "low"; "medium"; "high"; "urgent" ])

    ; group_items "editor.slash/group-time-and-date"
        [ "date.nlp/tomorrow", "tomorrow"
          , Desc_key "editor.slash/tomorrow-desc", Emit (journal_offset 1, 0)
        ; "date.nlp/yesterday", "yesterday"
          , Desc_key "editor.slash/yesterday-desc"
          , Emit (journal_offset (-1), 0)
        ; "date.nlp/today", "calendar", Desc_key "editor.slash/today-desc"
          , Emit ("[[" ^ Dates.today () ^ "]]", 0)
        ; "editor.slash/current-time", "clock"
          , Desc_key "editor.slash/current-time-desc"
          , Emit (current_time (), 0)
        ; "editor.slash/date-picker", "calendar-dots"
          , Desc_key "editor.slash/date-picker-desc", cmd "date-picker" ]    ; group_items "editor.slash/group-list-type"
        [ "editor.slash/number-list", "numberedParents"
          , Desc_self, cmd "number-list"
        ; "editor.slash/number-children", "numberedChildren"
          , Desc_self, cmd "number-children" ]    ; group_items "editor.slash/group-advanced"
        [ "block.comments/add-comment", "messageCircle"
          , Desc_key "block.comments/add-comment-command-desc"
          , cmd "add-comment"
        ; "property.built-in/query", "query", Desc_help, Run_query false
        ; "editor.slash/advanced-query", "query"
          , Desc_key "editor.slash/advanced-query-desc", Run_query true
        ; "editor.slash/query-function", "queryCode"
          , Desc_key "editor.slash/query-function-desc"
          , Emit ("{{function }}", 2)
        ; "editor.slash/calculator", "calculator"
          , Desc_key "editor.slash/calculator-desc", cmd "calculator"
        ; "editor.slash/upload-asset", "upload"
          , Desc_key "editor.slash/upload-asset-desc", cmd "upload"
        ; "class.built-in/template", "template"
          , Desc_key "editor.slash/template-desc", Switch Template_search
        ; "editor.slash/embed-html", "htmlEmbed", Desc_none
          , Emit ("@@html: @@", 2)
        ; "editor.slash/embed-video-url", "videoEmbed", Desc_none
          , Emit ("{{video }}", 2)
        ; "editor.slash/embed-youtube-timestamp", "videoEmbed", Desc_none
          , cmd "youtube-timestamp"
        ; "editor.slash/embed-twitter-tweet", "xEmbed", Desc_none
          , Emit ("{{tweet }}", 2)
        ; "command.editor/add-property", "cube-plus", Desc_none
          , cmd "add-property"
        ; "editor.slash/cloze", "brackets-contain", Desc_none, Emit ("{{cloze }}", 2) ]
    ; (match Plugin_host.slash_cmd_tags () with
       | [] -> []
       | xs ->
           (* cljs get-plugins-slash-commands — one "PLUGINS" group,
              puzzle icon *)
           let g = Some (U.t "editor.slash/group-plugins") in
           List.map
             (fun (pid, tag) ->
               mk_item ~key:("plugin." ^ pid ^ "/" ^ tag) ~label:tag
                 ~icon:"puzzle" ?group:g ~desc:Desc_none
                 (Plugin_slash (pid, tag)))
             xs)
    ]
;;

(* cljs editor.cljs keeps a fallback item for slash *)
let slash_fallback =
  mk_item ~key:"no-matched"
    ~label:(U.t "editor.slash/no-matched-commands") Noop
;;

(* ---- filtering ---- *)


let rec take n xs =
  if n <= 0 then [] else match xs with [] -> [] | x :: tl -> x :: take (n - 1) tl
;;

(* index + .ui__ac-group-name banners (unfiltered slash only, like cljs) *)
let with_headers show items =
  let rec go last idx = function
    | [] -> []
    | it :: tl ->
        let hdr =
          if show then
            match it.ai_group with
            | Some g when not (last = Some g) -> Some g
            | _ -> None
          else None
        in
        { it with ai_idx = idx; ai_hdr = hdr } :: go it.ai_group (idx + 1) tl
  in
  go None 0 items
;;

let renumber items = with_headers false items

let editing_has_heading () =
  match Editor_state.editing_uuid () with
  | Some u -> (
      match Editor_state.find u with
      | Some b -> b.Model.block_heading <> None
      | None -> false)
  | None -> false
;;

let filter_slash q items =
  (* cljs get-matched-commands → fuzzy-search-multi (label, limit 50) —
     hides the group banners while filtered *)
  let fs =
    Fuzzy.fuzzy_search ~extract:(fun it -> it.ai_label) ~limit:50 items q
  in

  (match fs with [] -> [ slash_fallback ] | _ -> fs)
  |> with_headers (q = "")
;;

(* cljs editor.cljs page-search: an empty [[ query lists the i18n nlp
   date pages (calendar icon); choosing one emits [[<journal title>]]
   parsed from the english name *)
let nlp_date_of (en : string) : Js.Date.t =
  let now = Dates.date_now () in
  let add n = Js.Date.fromFloat (Js.Date.getTime now +. n *. 86400000.) in
  let shift_month n =
    let c = Js.Date.fromFloat (Js.Date.getTime now) in
    ignore (Js.Date.setMonth c ~month:(Js.Date.getMonth c +. n));
    c
  in
  let shift_year n =
    let c = Js.Date.fromFloat (Js.Date.getTime now) in
    ignore (Js.Date.setFullYear c ~year:(Js.Date.getFullYear c +. n));
    c
  in
  match en with
  | "Today" -> now
  | "Tomorrow" -> add 1.
  | "Yesterday" -> add (-1.)
  | "Next week" -> add 7.
  | "This week" -> now
  | "Last week" -> add (-7.)
  | "Next month" -> shift_month 1.
  | "This month" -> now
  | "Last month" -> shift_month (-1.)
  | "Next year" -> shift_year 1.
  | _ -> now

let nlp_en_names =
  [ "Today"; "Tomorrow"; "Yesterday"; "Next week"; "This week"
  ; "Last week"; "Next month"; "This month"; "Last month"; "Next year" ]

let nlp_i18n_key en =
  "date.nlp/"
  ^ String.concat "-"
      (List.map String.lowercase_ascii (String.split_on_char ' ' en))

let page_items_for t kind q =
  let act_of ~created title =
    match kind with
    | Tag_search -> if created then Tag_create title else Tag_apply title
    | Embed_ref -> Embed title
    | Page_embed -> Emit ("{{embed [[" ^ title ^ "]]}}", 0)
    | _ -> Emit ("[[" ^ title ^ "]]", 0)
  in
  let wrap title =
    (* cljs get-node-icon: plain pages get the file icon in an
       icon-cp-container; pages have no parent → no breadcrumb row *)
    mk_item ~key:("page:" ^ title) ~label:title ~node:true
      ~node_icon:("file", true) (act_of ~created:false title)
  in
  let wrap_tag (title, icon) =
    (* db-tag rows skip the h-5 icon slot; the entity icon wraps the
       title instead, and tags always have a parent → breadcrumb row *)
    mk_item ~key:("page:" ^ title) ~label:title ~node:true
      ?title_icon:icon ~breadcrumb:"" (Tag_apply title)
  in
  let matched =
    match kind with
    | Tag_search ->
        (* cljs get-matched-classes → fuzzy-search (limit 20) *)
        Fuzzy.fuzzy_search ~extract:fst ~limit:20 !(t.tag_titles) q
        |> List.map wrap_tag
    | Page_ref | Page_embed | Embed_ref ->
        if q = "" then
          List.map
            (fun en ->
              let jt = Dates.journal_title_of (nlp_date_of en) in
              mk_item ~key:("nlp:" ^ en) ~node:true
                ~node_icon:("calendar", false)
                ~label:(U.t (nlp_i18n_key en)) ~icon:"calendar"
                (match kind with
                 | Embed_ref -> Embed jt
                 | Page_embed -> Emit ("{{embed [[" ^ jt ^ "]]}}", 0)
                 | _ -> Emit ("[[" ^ jt ^ "]]", 0)))
            nlp_en_names
        else
          Fuzzy.fuzzy_search ~extract:(fun ti -> ti) ~limit:50 !(t.titles) q
          |> List.map wrap
    | _ ->
        take 20
          (List.map wrap
             (List.filter (fun ti -> I18n.contains_ci ti q) !(t.titles)))
  in
  let exact =
    match kind with
    | Tag_search ->
        (* cljs search-pages db-tag?: the "New tag" row is suppressed when
           the query exactly names an existing class (internal ones like
           Page count) or a class alias *)
        List.exists (fun ti -> S.equal ti q) !(t.tag_exact_titles)
    | _ -> List.exists (fun ti -> S.equal ti q) !(t.titles)
  in
  (* cljs matched-pages-with-new-page: the "New tag/page" row goes after a
     leading starts-with match, else first *)
  let with_new xs =
    if q <> "" && not exact then
      let label =
        (match kind with
         | Tag_search -> U.t "editor/new-tag"
         | _ -> U.t "editor/new-page")
        ^ " " ^ q
      in
      (* cljs node-render: new-tag/new-page rows show a bare plus icon *)
      mk_item ~key:("new:" ^ q) ~label ~node:true
        ~node_icon:("plus", false) (act_of ~created:true q)
      :: xs
    else xs
  in
  let items =
    match matched with
    | first :: rest
      when S.length first.ai_label >= S.length q
           && S.equal
                (S.lowercase_ascii
                   (S.sub first.ai_label 0 (S.length q)))
                (S.lowercase_ascii q) ->
        first :: with_new rest
    | _ -> with_new matched
  in
  renumber items
;;
let template_items_for t q =
  let q = S.trim q in
  (* cljs template-search → fuzzy-search (block/title, limit 100) *)
  renumber
    (List.map
       (fun (uuid, title) ->
         mk_item ~key:("tpl:" ^ uuid) ~label:title (Template_apply uuid))
       (Fuzzy.fuzzy_search ~extract:snd ~limit:100 !(t.templates) q))
;;

(* ---- async loads ---- *)

let repo = Runtime.repo

let page_item_of_row i w =
  let title =
    match
      [ Cmdk_state.str_field w "block.temp/original-title"
      ; Cmdk_state.str_field w "block/title" ]
      |> List.filter_map Fun.id
    with
    | t :: _ -> t
    | [] -> ""
  in
  let uuid =
    match Wire.map_get_uuid w "block/uuid" with
    | Some u -> u
    | None -> Option.value (Cmdk_state.str_field w "block/uuid") ~default:""
  in
  let is_page =
    match Wire.get w "page?" with
    | Some (Wire.Bool b) -> b
    | _ -> false
  in
  (* cljs page-on-chosen-handler: non-page results are inserted as uuid
     page-refs ([[uuid]]) so retitling the target renames the link *)
  let act =
    if is_page then Emit ("[[" ^ title ^ "]]", 0) else Emit ("[[" ^ uuid ^ "]]", 0)
  in
  (* cljs node-render: node icon + title, block rows carry a .breadcrumb
     row with the parent page path *)
  mk_item
    ~key:("node-" ^ uuid ^ "-" ^ string_of_int i)
    ~label:title ~node:true
    ~node_icon:((if is_page then "file" else "point-filled"), true)
    ?breadcrumb:(if is_page then None else Cmdk_state.breadcrumb_of w)
    act
;;

let refresh_items t ac =
  match ac.kind with
  | Slash ->
      { ac with
        items =
          filter_slash ac.query
            (slash_items ~has_heading:(editing_has_heading ())) }
  | Page_ref | Page_embed | Tag_search | Embed_ref ->
      { ac with items = page_items_for t ac.kind ac.query }
  | Template_search -> { ac with items = template_items_for t ac.query }
  | Block_ref -> ac (* filled asynchronously by run_block_search *)
;;

let block_item_of_row i w =
  let it = Cmdk_state.item_of_row w i in
  let uuid =
    match Wire.map_get_uuid w "block/uuid" with
    | Some u -> u
    | None -> Option.value (Cmdk_state.str_field w "block/uuid") ~default:""
  in
  (* cljs node-render for blocks: point-filled node icon and the parent
     path in the breadcrumb row. FTS rows carry
     $pfts_2lqh>$..$<pfts_2lqh$ markers — strip them; the view's query
     highlight still marks the hit *)
  mk_item ~key:it.Cmdk_state.ikey
    ~label:(Cmdk_state.strip_pfts it.Cmdk_state.ititle)
    ~node:true
    ~node_icon:("point-filled", true)
    ~breadcrumb:(Option.value it.Cmdk_state.header ~default:"")
    (Emit ("[[" ^ uuid ^ "]]", 0));;

let run_block_search t ac =
  incr t.gen;
  let gen = !(t.gen) in
  ignore
    ((let* w =
       Runtime.invoke3 "thread-api/search-blocks"
         (Wire.String (repo ()))
         (Wire.String ac.query)
         (Cmdk_state.search_opts ~dev:false false 20)
     in
     let rows =
       match w with
       | Wire.Map _ -> (
           match Wire.get w "items" with
           | Some (Wire.Array xs) | Some (Wire.List xs) -> xs
           | _ -> [])
       | Wire.Array xs | Wire.List xs -> xs
       | _ -> []
     in
     (match (get t).ac with
      | Some a
        when gen = !(t.gen) && a.kind = Block_ref && a.query = ac.query ->
          set_ac t
            (Some
               { a with
                 items = renumber (take 20 (List.mapi block_item_of_row rows))
               ; chosen = 0 })
      | _ -> ());
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("popups block search failed", e);
            Js.Promise.resolve ()))
;;

(* cljs search-pages/<get-matched-blocks: [[ ]] completion matches pages
   AND blocks via block-search; block rows carry their page breadcrumb.
   Results replace the sync title matches; a "New page" row is kept first
   (or second, when the first match starts with the query). *)
let run_node_search t ac =
  incr t.gen;
  let gen = !(t.gen) in
  ignore
    ((let* w =
       Runtime.invoke3 "thread-api/search-blocks"
         (Wire.String (repo ()))
         (Wire.String ac.query)
         (Cmdk_state.search_opts ~dev:false false 20)
     in
     let rows =
       match w with
       | Wire.Map _ -> (
           match Wire.get w "items" with
           | Some (Wire.Array xs) | Some (Wire.List xs) -> xs
           | _ -> [])
       | Wire.Array xs | Wire.List xs -> xs
       | _ -> []
     in
     (match (get t).ac with
      | Some a
        when gen = !(t.gen) && a.kind = Page_ref
             && a.query = ac.query ->
          let pages, blocks =
            List.partition
              (fun w ->
                match Wire.get w "page?" with
                | Some (Wire.Bool b) -> b
                | _ -> false)
              rows
          in
          let matched =
            take 20
              (List.mapi page_item_of_row (pages @ blocks))
          in
          let items =
            match
              List.filter
                (fun it -> S.sub it.ai_key 0 4 = "new:")
                (page_items_for t a.kind a.query)
            with
            | [] -> matched
            | new_items ->
                let first_starts =
                  match matched with
                  | m :: _ -> Str_util.starts_with_ci m.ai_label a.query
                  | [] -> false
                in
                if first_starts then
                  (match matched with
                   | m :: rest -> m :: new_items @ rest
                   | [] -> new_items)
                else new_items @ matched
          in
          set_ac t (Some { a with items = renumber items; chosen = 0 })
      | _ -> ());
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("popups node search failed", e);
            Js.Promise.resolve ()))
;;

let load_titles t =
  ignore
    ((let* w =
       Runtime.invoke1 "thread-api/get-all-page-titles"
         (Wire.String (repo ()))
     in
     let rows =
       match w with
       | Wire.Array xs | Wire.List xs -> xs
       | _ -> []
     in
     t.titles :=
       List.filter_map
         (fun row ->
           match row with
           | Wire.String s -> Some s
           | _ -> Cmdk_state.str_field row "block/title")
         rows;
     (match (get t).ac with
      | Some ({ kind = Page_ref | Page_embed | Tag_search | Embed_ref; _ } as ac) ->
          set_ac t (Some (refresh_items t ac))
      | _ -> ());
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("popups titles failed", e);
            Js.Promise.resolve ()))
;;

(* cljs get-matched-classes: all classes except the root tag (plus the
   Page class when editing a non-page block), alias titles included.
   Entity maps carry block/title and block/alias rows. *)
let class_titles_of rows =
  (* cljs icon-component/get-node-icon: logseq.property/icon of the class,
     shape {:type :tabler-icon :id <name>} *)
  let icon_of row =
    match Wire.get row "logseq.property/icon" with
    | Some m -> (
        match Wire.get m "id" with
        | Some (Wire.String id) -> Some id
        | _ -> None)
    | None -> None
  in
  List.concat_map
    (fun row ->
      let title = Cmdk_state.str_field row "block/title" in
      let icon = icon_of row in
      let aliases =
        match Wire.get row "block/alias" with
        | Some (Wire.Array xs) | Some (Wire.List xs) ->
            List.filter_map
              (fun a -> Cmdk_state.str_field a "block/title")
              xs
        | _ -> []
      in
      (match title with
       | Some t -> [ (t, icon) ]
       | None -> [])
      @ List.map (fun a -> (a, None)) aliases)
    rows

let load_tag_titles t =
  let editing_block =
    match Editor_state.editing_uuid () with
    | Some _ -> true
    | None -> false
  in
  let wopts extra =
    Wire.Map
      (List.map
         (fun (k, v) -> (Wire.kw k, v))
         ([ ("except-root-class?", Wire.Bool true) ]
          @ extra))
  in
  ignore
    ((let* w =
       Runtime.invoke2 "thread-api/get-all-classes"
         (Wire.String (repo ()))
         (wopts [ ("except-private-tags?", Wire.Bool true) ])
     in
     let rows =
       match w with
       | Wire.Array xs | Wire.List xs -> xs
       | _ -> []
     in
     let* () =
       t.tag_titles := class_titles_of rows;
       (* the full class list (private tags included) feeds only
          tag_exact_titles; Page is conjoined to the candidates just
          when editing a non-page block *)
       let* w2 =
         Runtime.invoke2 "thread-api/get-all-classes"
           (Wire.String (repo ()))
           (wopts [ ("except-private-tags?", Wire.Bool false) ])
       in
       let rows2 =
         match w2 with
         | Wire.Array xs | Wire.List xs -> xs
         | _ -> []
       in
       t.tag_exact_titles :=
         List.map fst (class_titles_of rows2);
       (if editing_block then
          let page_class =
            List.filter
              (fun r ->
                (* entity_map_wire emits db/ident as a keyword
                   value, not a string *)
                Wire.get r "db/ident"
                = Some (Wire.Keyword "logseq.class/Page"))
              rows2
          in
          t.tag_titles :=
            !(t.tag_titles)
            @ class_titles_of page_class);
       Js.Promise.resolve ()
     in
     (match (get t).ac with
      | Some ({ kind = Tag_search; _ } as ac) ->
          set_ac t (Some (refresh_items t ac))
      | _ -> ());
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("popups classes failed", e);            Js.Promise.resolve ()))
;;

(* template-search: blocks tagged logseq.class/Template (cljs
   search/template-search = get-tag-objects + fuzzy) *)
let load_templates t =
  ignore
    (let* w =
      Runtime.invoke2 "thread-api/q" (Wire.String (repo ()))
        (Wire.Array
           [ Wire.String
               "[:find ?u ?ti :where [?b :block/tags ?t] \
                [?t :db/ident :logseq.class/Template] \
                [?b :block/uuid ?u] [?b :block/title ?ti]]"
           ])
    in
    let rows = Wire.elems w in
    t.templates :=
      List.filter_map
        (fun row ->
          match Wire.elems row with
          | [ u; ti ] -> (
              match (u, Wire.as_string ti) with
              | Wire.Uuid u, Some ti -> Some (u, ti)
              | Wire.String u, Some ti -> Some (u, ti)
              | _ -> None)
          | _ -> None)
        rows;
    (match (get t).ac with
     | Some ({ kind = Template_search; _ } as ac) ->
         set_ac t (Some (refresh_items t ac))
     | _ -> ());
    Js.Promise.resolve ())
;;

(* ---- open / update ---- *)

let open_ac t kind =
  let auuid = Option.value (Editor_state.editing_uuid ()) ~default:"" in
  let x, y, cy =
    Option.value (Editor_sink.popup_pos auuid) ~default:(0., 0., 0.)
  in
  let tlen = trigger_len_of_kind kind in
  let tpos = fst (Editor_actions.sel_span auuid) - tlen in
  let ac =
    { kind; x; y; cy; flip = None; flipx = None; query = ""
    ; tpos; tlen
    ; items = []; chosen = 0; auuid }
  in
  (* base-ui avoidCollisions: the popup mounts below the caret, then
     flips above when it overflows the viewport and there is more room
     above — measure once mounted and record (top, avail). Items can
     resolve after the mount, so retry while the popup is up (~480ms).
     The popover's --available-height clamp already bounds the rendered
     rect, so lift it briefly to learn the real height (CSS caps such
     as the commands list's own max-height still apply — matching what
     the popup can actually render on either side) *)
  let rec measure tries =
    match (get t).ac with
    | Some a when a.flip = None && a.kind = kind -> (
        match Web_dom.query_selector "#ui__ac-inner" with
        | Some inner -> (
            match Web_dom.el_closest inner ".ui__popover-content" with
            | Some pop ->
                (* --available-height propagates to #ui__ac-inner's own
                   max-height; lift it to read the real rendered height
                   (the list's own CSS max still applies). The lift must
                   stay the last override while measuring — the rect
                   reads back asynchronously, so clamping right after
                   would mask the lifted frame; restore the clamp only
                   when the loop ends without a flip. The lifted frame
                   renders clipped at the window edge either way, so it
                   is not visible to the user. *)
                Web_dom.el_style_set_property pop "--available-height"
                  "2000px";
                let rect = Web_dom.el_bounding_rect pop in
                (* base-ui flips align start->end when the popup would
                   overflow the right viewport edge — the right edge
                   lands at the caret; clamp to the margin when even
                   that doesn't fit *)
                let fx =
                  let w = Web_dom.rect_width rect in
                  if a.x +. w > Web_dom.win_inner_width -. 8. then
                    Some (Float.max 8. (a.x -. w))
                  else None
                in
                if fx <> a.flipx then
                  set_ac t (Some { a with flipx = fx });
                let h = Web_dom.rect_height rect in
                let below = Web_dom.win_inner_height -. a.y -. 8. in                let above = a.cy -. 8. in
                if h > below && above > below then (
                  (* avail is the constraint, h the measured render —
                     the inner's own max-height subtracts chrome from
                     avail, so pass the whole space and place the top
                     so the bottom edge lands just above the caret *)
                  let avail = above -. 4. in
                  let h_eff = Float.min h avail in
                  let top' = Float.max 4.0 (a.cy -. 8. -. h_eff) in
                  set_ac t (Some { a with flip = Some (top', avail) }))
                else if tries <= 0 then
                  Web_dom.el_style_set_property pop "--available-height"
                    (Printf.sprintf "calc(100vh - %.0fpx)" (a.y +. 8.))
                else retry tries            | None -> retry tries)
        | None -> retry tries)
    | None -> retry tries
    | _ -> ()
  and retry tries =
    if tries > 0 then
      Web_dom.set_timeout (fun () -> measure (tries - 1)) 16
  in
  measure 30;
  (* cljs autopair: typing [[ inputs ]] immediately with the caret kept
     inside the brackets; insert_text consumes the ghost pair on choice *)
  (match kind with
   | Page_ref ->
       (match Editor_actions.edit_model auuid with
        | Some m ->
            let v = m.Edit_model.source in
            let n = S.length v in
            let pos = ac.tpos + tlen in
            if not (pos + 1 < n && S.sub v pos 2 = "]]") then
              Editor_actions.update_model auuid (fun _ ->
                  Edit_model.select
                    (Edit_model.splice m pos pos "]]")
                    ~anchor:pos ~focus:pos)
        | None -> ())
   | _ -> ());
  (match kind with
   | Page_ref | Page_embed | Embed_ref -> load_titles t
   | Tag_search -> load_tag_titles t
   | Template_search -> load_templates t   | Block_ref -> ()
   | Slash -> ());
  set_cm t None;
  set_ac t (Some (refresh_items t ac))
;;

let ac_update t ac q =
  let ac = { ac with query = q; chosen = 0 } in
  set_ac t (Some (refresh_items t ac));
  if ac.kind = Block_ref then run_block_search t ac
  else if ac.kind = Page_ref && String.trim q <> "" then run_node_search t ac
;;

let query_closed ac q =
  match ac.kind with
  | Page_ref | Page_embed -> S.contains q ']'
  | Block_ref -> S.contains q ')'
  | Slash | Tag_search | Template_search | Embed_ref -> S.contains q '\n'
;;

(* after a buffer change in the open block editor — the model carries
   the new text/caret; [deleted] marks Delete events (the cljs
   delete-inputType branch that closes a wiped trigger) *)
let on_buffer_change t ~deleted uuid =
  match Editor_actions.edit_model uuid with
  | None -> ()
  | Some m ->
      let v = m.Edit_model.source in
      let pos = fst (Editor_actions.sel_span_of m) in
      match (get t).ac with
      | Some ac ->
          let trig_missing =
            ac.tpos + ac.tlen > S.length v
            || S.sub v ac.tpos ac.tlen <> trigger_text_of_kind ac.kind
          in
          if pos < ac.tpos + ac.tlen then close_ac t
          else
            (* cljs handle-last-input runs the /, [[, (( and # openers
               regardless of an open popup, so a trigger char typed
               while an ac is open replaces it (e.g. / inside a #tag
               query starts the slash menu); # followed by another #
               clears instead *)
            let c =
              if pos >= 1 && pos <= S.length v then Some (S.get v (pos - 1))
              else None
            in
            let two ch = pos >= 2 && S.get v (pos - 2) = ch in
            let bounded =
              pos < 2 || (let p = S.get v (pos - 2) in p = ' ' || p = '\n')
            in
            let switched =
              match c with
              | Some '/' when bounded ->
                  close_ac t;
                  open_ac t Slash;
                  true
              | Some '[' when two '[' ->
                  close_ac t;
                  open_ac t Page_ref;
                  true
              | Some '(' when two '(' ->
                  close_ac t;
                  open_ac t Block_ref;
                  true
              | Some '#' when bounded || two '#' ->
                  if bounded && not (two '#') then open_ac t Tag_search
                  else close_ac t;
                  true
              | _ -> false
            in
            if switched then ()
            else if trig_missing then
              (* cljs ac state isn't tied to the trigger still being in
                 the buffer: a whole-buffer replacement wipes the
                 trigger but the popup stays open with the buffer as
                 its query. Only a real delete removes it *)
              if deleted then close_ac t
              else
                ac_update t { ac with tpos = 0; tlen = 0 }
                  (S.sub v 0 pos)
            else
              let qend = pos - ac.tpos - ac.tlen in
              if qend > S.length v then close_ac t
              else
                let q = S.sub v (ac.tpos + ac.tlen) qend in
                (* "# " clears hashtag search (a space right after the
                   trigger), and "#+" is an org directive, not a tag *)
                if query_closed ac q
                   || (ac.kind = Tag_search && (q = " " || q = "+"))
                then close_ac t
                else ac_update t ac q
      | None ->
          if pos < 1 || pos > S.length v then ()
          else
            let c = S.get v (pos - 1) in
            let two = pos >= 2 && S.get v (pos - 1) = S.get v (pos - 2) in
            (* cljs opens "/" / "#" menus when any line already starts
               with the trigger, or when the char starts a new word
               (preceded by space or tab); "#" also opens right after
               "]]" *)
            let line_starts_with ch =
              (S.length v > 0 && S.get v 0 = ch)
              ||
                let rec scan i =
                  if i + 1 >= S.length v then false
                  else if S.get v i = '\n' && S.get v (i + 1) = ch then true
                  else scan (i + 1)
                in
                scan 0
            in
            let word_before =
              pos >= 2
              &&
                let p = S.get v (pos - 2) in
                p = ' ' || p = '\t'
            in
            let ref_before =
              pos >= 3 && S.get v (pos - 2) = ']' && S.get v (pos - 3) = ']'
            in
            if c = '/' && (line_starts_with '/' || word_before) then
              open_ac t Slash
            else if c = '[' && two then open_ac t Page_ref
            else if c = '(' && two then open_ac t Block_ref
            else if
              c = '#' && (line_starts_with '#' || word_before || ref_before)
              && not (pos < S.length v && S.get v pos = '+')
            then open_ac t Tag_search
            else ()

(* the event funnel in editor_keys calls through the live layer *)
let on_model_input ~deleted uuid =
  match !active with
  | Some t -> on_buffer_change t ~deleted uuid
  | None -> ()

(* ---- events ---- *)

let detail_obj pairs =
  let o = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set o k v) pairs;
  Js.Json.object_ o
;;

(* replace [tpos, caret) with text in the editing model — equivalent
   to cljs's ls:editor-insert handler *)
let insert_text (ac : ac) text back =
  match Editor_actions.edit_model ac.auuid with
  | Some m ->
      let v = m.Edit_model.source in
      let n = S.length v in
      let tpos = max 0 (min ac.tpos n) in
      let pos = max tpos (min (fst (Editor_actions.sel_span_of m)) n) in
      (* consume the autopaired ]] sitting right after the caret *)
      let pos =
        if (ac.kind = Page_ref || ac.kind = Embed_ref)
           && pos + 1 < n && S.sub v pos 2 = "]]"
        then pos + 2
        else pos
      in
      let caret = tpos + S.length text - back in
      Editor_actions.update_model ac.auuid (fun _ ->
          Edit_model.select
            (Edit_model.splice m tpos pos text)
            ~anchor:caret ~focus:caret);
      Editor_sink.focus_input ac.auuid
  | None -> ()

let emit ?(exit = false) auuid tpos text =
  Web_dom.dispatch_custom "ls:editor-insert"
    (detail_obj
       [ "text", Js.Json.string text
       ; "from", Js.Json.number (float_of_int tpos)
       ; "to"
         , Js.Json.number
             (float_of_int (fst (Editor_actions.sel_span auuid)))
       ; "exit", Js.Json.boolean exit ]);
  (* cljs refocuses the editor input after a chosen item *)
  Editor_sink.focus_input auuid
;;

let emit_cmd ?pos command extra =
  Web_dom.dispatch_custom "ls:editor-command"
    (detail_obj
       (("command", Js.Json.string command)
        :: (match pos with
            | Some p ->
                [ "from", Js.Json.number (float_of_int p)
                ; "to", Js.Json.number (float_of_int p) ]
            | None -> [])
        @ extra))
;;

(* erase the typed trigger range [tpos, caret) from the editor and
   hand focus back to the input — a clicked menu-link steals focus to
   its anchor, and Switch keeps no literal text (cljs [:editor/input ""]) *)
let erase_trigger_text (ac : ac) =
  match Editor_actions.edit_model ac.auuid with
  | Some m ->
      let v = m.Edit_model.source in
      let n = S.length v in
      let tpos = max 0 (min ac.tpos n) in
      let pos = max tpos (min (fst (Editor_actions.sel_span_of m)) n) in
      let pos =
        if (ac.kind = Page_ref || ac.kind = Embed_ref)
           && pos + 1 < n && S.sub v pos 2 = "]]"
        then pos + 2
        else pos
      in
      Editor_actions.update_model ac.auuid (fun _ ->
          Edit_model.select
            (Edit_model.splice m tpos pos "")
            ~anchor:tpos ~focus:tpos);
      Editor_sink.focus_input ac.auuid
  | None -> ()
;;
(* cljs auto-complete/meta-complete on a tag item inserts the tag
   inline: "#last-part" (page-ref-wrapped when the last namespace part
   has whitespace, or not wrapped at all when the "#" already sits
   inside a [[ pair]). *)
let inline_tag_text ac title =
  let last_part =
    match String.rindex_opt title '/' with
    | Some i -> S.sub title (i + 1) (S.length title - i - 1)
    | None -> title
  in
  let v, pos =
    match Editor_actions.edit_model ac.auuid with
    | Some m ->
        ( m.Edit_model.source
        , fst (Editor_actions.sel_span_of m) )
    | None -> ("", 0)
  in
  if pos >= 2 && pos <= S.length v && S.sub v (pos - 2) 2 = "[["
  then "#" ^ last_part
  else if
    S.exists (fun c -> c = ' ' || c = '\t' || c = '\n') last_part
  then "#[[" ^ last_part ^ "]]"
  else "#" ^ last_part

(* cljs tag-on-chosen-handler: strip the "#query" fragment, then either
   keep "#title" inline (existing page) or attach the tag as a class via
   block/tags (existing class or a new "New tag" class). The "New tag"
   row always takes the class path even when a plain page exists. *)
let apply_tag t ac ~create ~inline title =
  match Editor_state.editing_uuid () with
  | None -> ()
  | Some buuid ->
      let repo_v = repo () in
      let save_and_tag dbid =
        (* emit already stripped "#q" from the buffer; persist the new
           buffer and the tag in one batch *)
        let rest =
          [ Outliner_ops.set_block_property buuid "block/tags" (Wire.Int dbid) ]
        in
        ignore
          (Outliner_ops.apply_parsed_and_refresh ~rest
             [ (buuid, Editor_actions.live_buffer buuid) ])
      in
      (* cljs tag-in-page-auto-complete?: "#" typed inside a [[ pair
         still erases the query but skips the tag/class attach — the
         page-ref autocomplete owns that context *)
      let tag_in_ref () =
        match Editor_actions.edit_model buuid with
        | Some m ->
            let v = m.Edit_model.source in
            let pos = fst (Editor_actions.sel_span_of m) in
            pos + 2 <= S.length v && S.sub v pos 2 = "]]"
        | None -> false
      in
      let insert () =
        (* cljs: class items erase "#q" on enter but insert "#wrapped"
           on mod+enter (inline-tag?; the Page class is exempt) *)
        emit ac.auuid ac.tpos
          (if inline && title <> "Page" then inline_tag_text ac title
           else "")
      in
      let create_and_tag () =
        insert ();
        close_ac t;
        if not (tag_in_ref ()) then
          ignore
            (let* _ =
               Runtime.invoke3 "thread-api/apply-outliner-ops"
                 (Wire.String repo_v)
                 (Wire.Array [ Outliner_ops.create_class title ])
                 (Wire.Map [])
             in
             let* e =
               Runtime.invoke2 "thread-api/get-case-page"
                 (Wire.String repo_v) (Wire.String title)
             in
             (match Wire.map_get_int e "db/id" with
              | Some dbid -> save_and_tag dbid
              | None -> ());
             Js.Promise.resolve ())
      in
      if create then create_and_tag ()
      else
        ignore
          (let* w =
            Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo_v)
              (Wire.String title)
          in
          match w with
          | Wire.Map _ -> (
              match Wire.map_get_int w "db/id" with
              | None -> Js.Promise.resolve ()
              | Some dbid ->
                  (match Wire.get w "db/ident" with
                   | Some _ ->
                       insert ();
                       close_ac t;
                       if not (tag_in_ref ()) then save_and_tag dbid;
                       Js.Promise.resolve ()
                   | None ->
                       (* cljs tag-on-chosen-handler: a plain page
                          chosen in the hashtag search is converted
                          to a class, then attached via block/tags *)
                       insert ();
                       close_ac t;
                       if tag_in_ref () then Js.Promise.resolve ()
                       else
                         let* _ =
                           Runtime.invoke2
                             "thread-api/convert-page-to-tag"
                             (Wire.String repo_v) (Wire.Int dbid)
                         in
                         save_and_tag dbid;
                         Js.Promise.resolve ()))
          | _ ->
              create_and_tag ();
              Js.Promise.resolve ())

let apply_template t _ac uuid =
  match Editor_state.editing_uuid () with
  | None -> ()
  | Some buuid ->
      let buf = Editor_actions.live_buffer buuid in
      close_ac t;
      ignore
        (let* sop = Outliner_ops.save_block_parsed buuid buf in
         Outliner_ops.apply_and_refresh
           ~opts:(Outliner_ops.op_opts "apply-template")
           [ sop; Outliner_ops.apply_template uuid buuid ])
(* cljs run-query-command! / advanced-query-steps: save the current
   block, tag it logseq.class/Query, create the hidden
   logseq.property/query value block and copy the current title into it
   (the query source), clear the block title, exit edit. Advanced also
   marks the value block display-type=code + code/lang=clojure so the
   worker's render-view-data exposes the pulled :query columns. *)
let run_query t ac ~advanced =
  match Editor_state.editing_uuid () with
  | None -> ()
  | Some buuid ->
      emit ac.auuid ac.tpos "";
      close_ac t;
      let title = Editor_actions.live_buffer buuid in
      Editor_actions.exit_edit ~select:false;
      let repo_v = repo () in
      ignore
        (let* sop = Outliner_ops.save_block_parsed buuid title in
        let* _ =
           Outliner_ops.apply
             [ sop
             ; Outliner_ops.op "create-property-text-block"
                 [ Wire.Uuid buuid
                 ; Wire.Keyword "logseq.property/query"
                 ; Wire.String ""
                 ; Wire.Map
                     [ (Wire.Keyword "set-block-property?", Wire.Bool true) ] ]
             ]
         in
         let* w =
          Runtime.invoke2 "thread-api/get-blocks" (Wire.String repo_v)
            (Wire.Array
               [ Wire.Map
                   [ (Wire.Keyword "id", Wire.Uuid buuid)
                   ; ( Wire.Keyword "opts"
                     , Wire.Map
                         [ (Wire.Keyword "children?", Wire.Bool true)
                         ; ( Wire.Keyword "include-property-block?"
                           , Wire.Bool true ) ] ) ]
               ])
        in
        let quuid =
          match Wire.args_list w with
          | res :: _ -> (
              let b =
                match Wire.get res "block" with
                | Some b -> b
                | None -> res
              in
              match Wire.get b "logseq.property/query" with
              | Some v -> (
                  match Wire.map_get_uuid v "block/uuid" with
                  | Some u -> u
                  | None -> (
                      match Wire.as_uuid v with
                      | Some u -> u
                      | None -> ""))
              | None -> "")
          | [] -> ""
        in
        if quuid = "" then Js.Promise.resolve ()
        else
          let rest =
            [ Outliner_ops.set_block_property buuid "block/tags"
                (Wire.Keyword "logseq.class/Query") ]
            @ if advanced then
                [ Outliner_ops.set_block_property quuid
                    "logseq.property.node/display-type"
                    (Wire.Keyword "code")
                ; Outliner_ops.set_block_property quuid
                    "logseq.property.code/lang"
                    (Wire.String "clojure") ]
              else []
          in
          Outliner_ops.apply_parsed ~rest
            [ (quuid, title); (buuid, "") ])

let apply_item t ac ~meta it =
  match it.ai_act with
  | Switch kind ->
      erase_trigger_text ac;
      (match kind with
       | Page_ref | Page_embed | Tag_search | Embed_ref -> load_titles t
       | Template_search -> load_templates t
       | _ -> ());
      set_ac t
        (Some
           (refresh_items t
              { ac with kind; query = ""; tlen = 0; items = []; chosen = 0 }))
  | Embed title ->
      erase_trigger_text ac;
      close_ac t;
      Editor_embed.insert title
  | Emit (text, back) -> insert_text ac text back; close_ac t
  | Emit_exit text -> emit ~exit:true ac.auuid ac.tpos text; close_ac t
  | Editor_cmd c ->
      (match c with
       | "date-picker" ->
           (* cljs :editor/show-date-picker keeps the typed trigger
              text — the calendar's commit replaces it *)
           ()
       | "link" | "image-link" ->
           (* cljs [:editor/input "/link"] — the buffer holds the literal
              command text while the form is open *)
           emit ac.auuid ac.tpos ("/" ^ c)
       | _ ->
           (* cljs strips the "/cmd" trigger text like an Emit "" insert *)
           emit ac.auuid ac.tpos "");
      emit_cmd ~pos:ac.tpos c [];
      close_ac t  | Plugin_slash (pid, tag) ->
      (* cljs handle-steps — strip the "/tag" trigger like an Emit ""
         insert, then run each step (editor/input inserts text;
         editor/hook fires the plugin's event) *)
      emit ac.auuid ac.tpos "";
      close_ac t;
      Plugin_host.exec_slash_command
        ~insert:(fun text -> insert_text ac text 0)
        pid tag
  | Run_query advanced -> run_query t ac ~advanced

  | Tag_apply title -> apply_tag t ac ~create:false ~inline:meta title
  | Tag_create title -> apply_tag t ac ~create:true ~inline:meta title
  | Template_apply uuid -> apply_template t ac uuid
  | Noop -> close_ac t
;;

let chosen_scroll chosen =
  Web_dom.set_timeout
    (fun () ->
      match Web_dom.query_selector "#ui__ac-inner" with
      | Some scroller -> (
          match Web_dom.query_selector ("#ac-" ^ string_of_int chosen) with
          | Some row -> Web_dom.scroll_row_into_view ~scroller ~row
          | None -> ())
      | None -> ())
    0
;;

let move_chosen t dir =
  match (get t).ac with
  | Some ac ->
      let n = List.length ac.items in
      if n > 0 then (
        let chosen = (ac.chosen + dir + n) mod n in
        set_ac t (Some { ac with chosen });
        chosen_scroll chosen)
  | None -> ()
;;

let set_chosen t i =
  match (get t).ac with
  | Some ac -> set_ac t (Some { ac with chosen = i })
  | None -> ()
;;

let apply_index t i =
  match (get t).ac with
  | Some ac ->
      Option.iter (fun it -> apply_item t ac ~meta:false it)
        (List.nth_opt ac.items i)
  | None -> ()
;;

(* cljs on-enter when no item matched: page/block refs hop the caret
   past the closing ]] / )) and close; template search clears the
   editor action; slash and hashtag have no on-enter — the key is
   consumed and the popup stays open *)
let ac_on_enter t ac =
  match ac.kind with
  | Page_ref | Page_embed | Embed_ref | Block_ref ->
      let pos = fst (Editor_actions.sel_span ac.auuid) in
      Editor_actions.set_caret ac.auuid (pos + 2);
      close_ac t
  | Template_search -> close_ac t
  | Slash | Tag_search -> ()
;;

(* true if the keydown was consumed by the open popup *)
(* cljs closes the mention/search popup on keyup once the caret is no
   longer wrapped by its trigger pair (close-autocomplete-if-outside).
   Our editor `]`/`)` autopair-overtype skips the caret past the ghost
   bracket without a buffer change, so no event reaches
   on_buffer_change — check the same close condition on leftover keys:
   the model caret moved before the trigger, or the buffer shows a
   completed closer in the query *)
let ac_position_closed ac =
  match Editor_actions.edit_model ac.auuid with
  | None -> true
  | Some m ->
      let pos = fst (Editor_actions.sel_span_of m) in
      let v = m.Edit_model.source in
      let qend = pos - ac.tpos - ac.tlen in
      qend < 0 || qend > S.length v
      || query_closed ac (S.sub v (ac.tpos + ac.tlen) qend)
;;

(* true if the keydown was consumed by the open popup *)
let ac_keydown t ev =
  match (get t).ac with
  | None -> false
  | Some ac ->
      (* the ac outlives its editor sink on remount — Enter/Tab reach
         apply_chosen before the position check could close it, eating
         the key forever; once the editing session it opened on is gone
         the popup is dead, so close it and let the key through *)
      if
        ac.auuid <> "" && Editor_state.editing_uuid () <> Some ac.auuid
      then (
        close_ac t;
        false)
      else (
        match Web_dom.ev_key ev with
        | "ArrowDown" -> move_chosen t 1; true
        | "ArrowUp" -> move_chosen t (-1); true
        (* cljs binds ctrl+n/ctrl+p alongside the arrows *)
        | "n" when Web_dom.ev_ctrl ev -> move_chosen t 1; true
        | "p" when Web_dom.ev_ctrl ev -> move_chosen t (-1); true
        (* cljs enter/meta-complete/shift-complete: apply the chosen
           item — mod+enter inlines a tag — or the kind's on-enter when
           no item matched. shift+enter shares enter: no AC supplies
           on-shift-chosen. Tab is NOT an ac binding on master
           (:editor/indent) — it falls through to the editor keymap *)
        | "Enter" -> (
            (match List.nth_opt ac.items ac.chosen with
             | Some it -> apply_item t ac ~meta:(Web_dom.ev_meta ev) it
             | None -> ac_on_enter t ac);
            true)
        | "Escape" -> close_ac t; true
        | _ ->
            (if ac_position_closed ac then close_ac t);
            false)
;;

let ac_mousemove t el =
  match Web_dom.el_get_attr el "id" with
  | Some id
    when S.length id > 3 && S.sub id 0 3 = "ac-" -> (
      match int_of_string_opt (S.sub id 3 (S.length id - 3)) with
      | Some i -> set_chosen t i
      | None -> ())
  | _ -> ()
;;

(* ---- context menu ---- *)

let colors = [ "yellow"; "red"; "pink"; "green"; "blue"; "purple"; "gray" ]

(* mirrors content.cljs block-context-menu-content. Shortcut caps match
   shortcut utils decorate-binding/print-shortcut-key output on macOS *)
let block_entries () =
  [ Ci_colors; Ci_headings; Ci_sep
  ; Ci_item (U.t "sidebar.right/open", Some ("shift+click", [ "\u{21e7}"; "Click" ]), "open-in-sidebar")
  ; Ci_item (U.t "block.comments/add-comment", None, "add-comment")
  ; Ci_sub (U.t "command.editor/add-reaction", Sub_picker Picker_emoji)
  ; Ci_sub (U.t "context-menu/set-icon", Sub_picker Picker_icon)
  ; Ci_sep
  ; Ci_item (U.t "block/copy-ref", None, "copy-ref")
  ; Ci_item (U.t "export/copy-or-export-as", None, "copy-export-as")
  ; Ci_item (U.t "editor/cut", Some ("meta+x", [ "\u{2318}"; "X" ]), "cut")
  ; Ci_item (U.t "editor/delete-selection", Some ("delete", [ "Delete" ]), "delete")
  ; Ci_sep
  ; Ci_item (U.t "context-menu/make-a-flashcard", None, "make-flashcard")
  ; Ci_item (U.t "context-menu/toggle-number-list", None, "toggle-numbered-list")
  ; Ci_sep
  ; Ci_item (U.t "editor/expand-block-children", Some ("meta+down", [ "\u{2318}"; "\u{2193}" ]), "expand-children")
  ; Ci_item (U.t "editor/collapse-block-children", Some ("meta+up", [ "\u{2318}"; "\u{2191}" ]), "collapse-children")
  ]
;;

(* mirrors content.cljs custom-context-menu-content (multi-select) *)
let multi_entries () =
  [ Ci_colors; Ci_headings
  ; Ci_sub (U.t "context-menu/set-icon", Sub_picker Picker_icon)
  ; Ci_sep
  ; Ci_item (U.t "editor/cut", Some ("meta+x", [ "\u{2318}"; "X" ]), "cut")
  ; Ci_item (U.t "editor/delete-selection", Some ("delete", [ "Delete" ]), "delete")
  ; Ci_item (U.t "ui/copy", Some ("meta+c", [ "\u{2318}"; "C" ]), "copy")
  ; Ci_item (U.t "export/copy-or-export-as", None, "copy-export-as")
  ; Ci_item (U.t "block/copy-ref", None, "copy-ref")  ; Ci_sep
  ; Ci_item (U.t "context-menu/make-a-flashcard", None, "make-flashcard")
  ; Ci_item (U.t "block.comments/add-comment", None, "add-comment")
  ; Ci_item (U.t "context-menu/toggle-number-list", None, "toggle-numbered-list")
  ; Ci_item (U.t "editor/cycle-todo", Some ("meta+enter", [ "\u{2318}"; "\u{21b5}" ]), "cycle-todo")
  ; Ci_sep
  ; Ci_item (U.t "editor/expand-block-children", Some ("meta+down", [ "\u{2318}"; "\u{2193}" ]), "expand-children")
  ; Ci_item (U.t "editor/collapse-block-children", Some ("meta+up", [ "\u{2318}"; "\u{2191}" ]), "collapse-children")
  ]
;;

(* cljs state/developer-mode? — storage holds raw "true" (ours) or a
   JSON-quoted "\"true\"" (cljs storage) *)
let dev_mode () =
  match Platform.local_storage_get "developer-mode" with
  | Some "true" | Some "\"true\"" -> true
  | _ -> false

(* cljs adds a Developer tools submenu to the block context menu in
   developer-mode (content.cljs block-context-menu-content) *)
let dev_entries () =
  if dev_mode () then
    [ Ci_sep
    ; Ci_sub
        ( U.t "context-menu/developer-tools"
        , Sub_menu
            [ Ci_item ("(Dev) Show block data", None, "dev/show-block-data")
            ; Ci_item ("(Dev) Show block AST", None, "dev/show-block-ast") ] )
    ]
  else []

let open_cm t ~x ~y ~block_id ~multi =
  let entries =
    (* cljs adds Developer tools only to the single-block menu *)
    if multi then multi_entries ()
    else block_entries () @ dev_entries ()
  in
  close_ac t;
  set_cm t
    (Some
       { cx = x; cy = y; block_id; multi; entries; sub_open = -1
       ; sub_xy = (0., 0.); tag = None })
;;

(* cljs block-tag popup (block.cljs): Go to #tag (mod+click) / Open in
   sidebar (shift+click) / Remove tag — the last hidden for private
   class idents *)
let tag_entries ~title ~priv =
  [ Ci_item
      ( "Go to #" ^ title
      , Some ("mod+click", [ "\u{2318}"; "Click" ])
      , "go-to-tag" )
  ; Ci_item
      ( U.t "sidebar.right/open"
      , Some ("shift+click", [ "\u{21e7}"; "Click" ])
      , "open-tag-sidebar" ) ]
  @ if priv then []
    else [ Ci_item (U.t "block/remove-tag", None, "remove-tag") ]

let open_cm_tag t ~x ~y ~block_id ~tag_uuid ~tag_id ~tag_title ~priv =
  close_ac t;
  set_cm t
    (Some
       { cx = x; cy = y; block_id; multi = false
       ; entries = tag_entries ~title:tag_title ~priv
       ; sub_open = -1; sub_xy = (0., 0.)
       ; tag = Some (tag_uuid, tag_id, priv) })
;;

let open_cm_sub t ~index ~x ~y =
  match (get t).cm with
  | Some cm when cm.sub_open <> index ->
      set_cm t (Some { cm with sub_open = index; sub_xy = (x, y) })
  | _ -> ()
;;

let close_cm_sub t =
  match (get t).cm with
  | Some cm when cm.sub_open <> -1 ->
      set_cm t (Some { cm with sub_open = -1 })
  | _ -> ()
;;

let cm_sub_at t index =
  match (get t).cm with
  | Some cm -> (
      match List.nth_opt cm.entries index with
      | Some (Ci_sub (_, sub)) -> Some sub
      | _ -> None)
  | None -> None
;;

let run_cm_item t label =
  match (get t).cm with
  | Some cm ->
      (match cm.tag with
       | Some (tuuid, tid, _) -> (
           match label with
           | "go-to-tag" ->
               Platform.set_location_hash
                 (Runtime.nav_hash ("#/page/" ^ tuuid))
           | "open-tag-sidebar" ->
               Web_dom.dispatch_custom "ls:open-right-sidebar"
                 (Js.Json.object_
                    (Js.Dict.fromList
                       [ ("uuid", Js.Json.string tuuid) ]))
           | "remove-tag" ->
               ignore
                 (Outliner_ops.apply_and_refresh
                    [ Outliner_ops.op "delete-property-value"
                        [ Wire.Uuid cm.block_id
                        ; Wire.Keyword "block/tags"
                        ; Wire.Int tid ] ])
           | _ -> ())
       | None -> emit_cmd label [ "block", Js.Json.string cm.block_id ]);
      close_cm t
  | None -> ()
;;

let run_cm_color t color =
  match (get t).cm with
  | Some cm ->
      emit_cmd "set-color"        [ "block", Js.Json.string cm.block_id
        ; "value", Js.Json.string color ];
      close_cm t
  | None -> ()
;;

let run_cm_heading t h =
  match (get t).cm with
  | Some cm ->
      emit_cmd "set-heading"        [ "block", Js.Json.string cm.block_id
        ; "value", Js.Json.string h ];
      close_cm t
  | None -> ()
;;
