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
  | Embed_target of int (* selected entity id *)
  | Tag_apply of string (* existing entity — cljs tag-on-chosen-handler *)
  | Tag_create of string (* "New tag" row — always creates a class *)
  | Template_apply of string (* template block uuid — apply-template op *)
  | Run_query of bool (* cljs editor/run-query-command; arg = advanced? *)
  | Plugin_slash of string * string (* plugin pid + trigger tag *)
  | Configured of Wire.t
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
  ; ai_english : string
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

let mk_item ~key ~label ?english ?icon ?group ?info ?(desc = Desc_none)
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
  ; ai_english = Option.value english ~default:label
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
  ; pos_pending : bool
    (* the caret anchor hasn't been measured yet (hosts with async
       measurement answer popup_pos with None first); x/y/cy hold the
       (0,0,0) fallback only while this is set — a measured anchor that
       genuinely resolves to zeros must not keep re-reading *)
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
  ; editor : Editor_state.editing option
  }

let draft_editing () = Option.fold ~none:false ~some:Editor_state.is_draft (Editor_state.editing ())
let draft_ac_kind = function Page_ref | Block_ref -> true | _ -> false
let ac_current ac =
  let live = Editor_state.editing () in
  Editor_state.replay_current ac.editor live
  && match ac.editor, live with
     | Some before, Some after -> before.epoch == after.epoch
         && before.uuid = after.uuid && before.scope = after.scope
     | _ -> true

let ac_height_limit kind ~flipped available =
  let inset, cap =
    match kind, flipped with
    | Slash, true -> 60., 460.
    | _ -> 20., 480.
  in
  Float.max 0. (Float.min (available -. inset) cap)
;;

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

type cm_highlight = Main_item of int | Sub_item of int

type cm =
  { epoch : int
  ; cx : float
    (* anchor element center-x — cljs popup-show! re-anchors
       pointer-opened dropdowns to the event target's rect and centers
       the content on it *)
  ; cy : float (* menu top: anchor bottom, or anchor top when flipped —
                  the ls-anchor-top CSS translate lifts it by its own
                  height *)
  ; atop : float (* anchor element top — bounds the flipped menu's
                    available height *)
  ; flip : bool (* menu opens above the anchor *)
  ; block_id : string (* owner block/page entity of the menu target *)
  ; multi : bool
  ; entries : cm_item list
  ; sub_open : int (* index into entries, -1 = none *)
  ; sub_xy : float * float
  ; highlighted : cm_highlight option
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
  ; session : int ref
  ; cm_epoch : int ref
  ; cache_repo : string option ref
  ; titles : string list ref
  ; page_exact_titles : string list ref (* parentless internal pages/journals *)
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
  ; session = ref 0
  ; cm_epoch = ref 0
  ; cache_repo = ref None
  ; titles = ref []
  ; page_exact_titles = ref []
    ; tag_titles = ref []
    ; tag_exact_titles = ref []
    ; templates = ref []  }
  in
  active := Some t;
  t

let get t = Runtime.signal_get t.vs

(* signal of whether any popover layer (autocomplete / context menu /
   picker popup) is open — drives chrome that must hide while one is up *)
let popup_signal () =
  match !active with
  | Some t ->
      Some
        (Signal.map
           (fun v -> v.ac <> None || v.cm <> None || v.pv <> None)
           (Signal.value (t.vs)))
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
           (Signal.value (t.vs)))
  | None -> None

let ac_open () =
  match !active with
  | Some t -> (get t).ac <> None
  | None -> false

(* Resolve popup ownership from the event target's ancestors. Web
   popovers use a portal; native editor popovers retain their own roots
   without a DOM portal or coordinate hit-test. *)
let inside (el : Ui_services.el) =
  el.Ui_services.closest ".cp__overlays" <> None
  || el.Ui_services.closest ".lui-popup-portal" <> None
  || el.Ui_services.closest "#date-time-picker, .ls-editor-link-form" <> None
  || Properties_state.overlay_contains el

(* whether any popup layer is up, for code paths that only need the
   boolean (the per-layer popup_signal above drives reactive chrome) *)
let any_open () =
  (match popup_signal () with
   | Some s -> Signal.get s
   | None -> false)
  || Cmdk_state.is_open ()
  || Properties_state.overlay_open ()
  || !Runtime.editor_popup_open

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

(* field writes must compose onto the staged value: Signal.set stages a
   whole-record pending value, so a setter built from `get` (the last
   published view) would clobber another field's pending write queued in
   the same flush — e.g. close_ac/close_cm/close_pv in the outside-click
   handler would leave the menu open forever *)
let update t f =
  Signal.update t.vs f;
  Runtime.flush ()

let set_ac t ac = update t (fun v -> { v with ac })
let set_cm t cm = update t (fun v -> { v with cm })
let set_pv t pv = update t (fun v -> { v with pv })
let invalidate_ac t =
  incr t.gen;
  incr t.session

let ac_keys = Keymap_data.chord ()

let close_ac t =
  Keymap_data.reset_chord ac_keys;
  invalidate_ac t;
  set_ac t None
let close_cm t = set_cm t None
let next_cm_epoch t =
  incr t.cm_epoch;
  !(t.cm_epoch)

let highlight_cm t highlighted =
  match (get t).cm with
  | Some cm when cm.highlighted <> highlighted ->
      update t (fun v ->
        match v.cm with
        | Some cm -> { v with cm = Some { cm with highlighted } }
        | None -> v)
  | _ -> ()

let close_pv t = set_pv t None

let () = Editor_state.on_edit_exit (fun _uuid ->
    match !active with
    | Some t -> update t (fun _ -> { ac = None; cm = None; pv = None })
    | None -> ())

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
  let d = Dates.shift_day (Dates.date_now ()) days in
  "[[" ^ Dates.journal_title_of d ^ "]]"
;;

let current_time () =
  let f = Dates.fields (Dates.date_now ()) in
  Printf.sprintf "%02d:%02d" f.hours f.minutes
;;

(* (i18n key, icon, desc, action) — icon names mirror commands.cljs :icon/*
   values verbatim (custom-pack names like pageRef stay camelCase); desc
   mirrors each command tuple's doc slot (title attr / help tooltip) *)
let group_items grp entries =
  let g = Some (U.t grp) in
  List.map
    (fun (key, icon, desc, act) ->
      mk_item ~key ~label:(U.t key) ~english:(U.en_text key) ~icon ?group:g ~desc act)
    entries

;;

let cmd label = Editor_cmd label

(* has_heading gates "Clear heading" (cljs filter-commands drops it when
   the edited block has no heading prop, leaving "No matched commands") *)
let configured_slash_items () =
  let optional_text = function
    | None | Some Wire.Nil -> None
    | Some (Wire.String text) | Some (Wire.Keyword text) -> Some text
    | _ -> invalid_arg "Slash command metadata must be text" in
  match Wire.get (Runtime.model ()).Model.graph_config "commands" with
  | None | Some Wire.Nil -> []
  | Some (Wire.Array rows) ->
      List.mapi (fun index -> function
        | Wire.Array (Wire.String label :: output :: rest) when List.length rest <= 3 ->
            let doc = optional_text (List.nth_opt rest 0) in
            let icon = match List.nth_opt rest 1 with
              | Some (Wire.Map _ as options) -> optional_text (Wire.get options "icon")
              | icon -> optional_text icon in
            let group = optional_text (List.nth_opt rest 2) in
            mk_item ~key:("configured:" ^ string_of_int index) ~label ?icon ?group
              ~desc:(match doc with Some text -> Desc_custom text | None -> Desc_none)
              (Configured output)
        | _ -> invalid_arg "Slash command must be [label output doc? icon? group?]") rows
  | _ -> invalid_arg "Configured commands must be a vector"

let slash_value_label translate value =
  let title = Properties_data.ref_title value in
  let prefix = "logseq.property/" in
  match Properties_data.getk (Properties_data.untag value) "db/ident" with
  | Some ident when S.starts_with ~prefix ident ->
      let name = S.sub ident (S.length prefix) (S.length ident - S.length prefix) in
      (match S.index_opt name '.' with
       | Some dot ->
           let key = "property." ^ S.sub name 0 dot ^ "/"
             ^ S.sub name (dot + 1) (S.length name - dot - 1) in
           let label = translate key in
           if label = key then title else label
       | None -> title)
  | _ -> title

let slash_items ~statuses ~priorities ~has_heading : ac_item list =
  let items = List.concat
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
       List.init 6 (fun i ->
           let l = string_of_int (i + 1) in
           mk_item ~key:("heading-" ^ l)
             ~label:(U.tf "editor.slash/heading-label" [ l ])
             ~english:(U.sub (U.en_text "editor.slash/heading-label") [ l ])
             ~icon:("h-" ^ l) ?group:g ~desc:Desc_self
             (cmd ("heading:" ^ l)))
       @ (if has_heading then
            [ mk_item ~key:"editor.slash/clear-heading"
                ~label:(U.t "editor.slash/clear-heading") ~icon:"heading-off"
                ~english:(U.en_text "editor.slash/clear-heading")
                ?group:g ~desc:(Desc_key "editor.slash/normal-text-desc")
                (cmd "clear-heading") ]
          else []))
    ; List.filter_map (fun value ->
        Option.map (fun title ->
          let label = slash_value_label U.t value in
          let icon = match title with
            | "Canceled" -> "Cancelled" | "Doing" -> "InProgress50" | _ -> title
          in
          mk_item ~key:("status:" ^ title) ~label
            ~english:(slash_value_label U.en_text value) ~icon
            ~group:(U.t "editor.slash/group-task-status")
            ~desc:(Desc_custom (U.tf "editor.slash/status-desc" [label]))
            (cmd ("status:" ^ title))) (Properties_data.entity_title_of value)) statuses
    ; group_items "editor.slash/group-task-date"
        [ "property.built-in/deadline", "calendar-stats"
          , Desc_none, cmd "deadline"
        ; "property.built-in/scheduled", "calendar-month"
          , Desc_none, cmd "scheduled" ]
    ; (let g = Some (U.t "editor.slash/group-priority") in
       List.filter_map (fun value ->
            Option.map (fun title ->
              let label = slash_value_label U.t value in
              mk_item ~key:("priority:" ^ title)
                ~label:(U.tf "editor.slash/priority-label" [label])
                ~english:(U.sub (U.en_text "editor.slash/priority-label")
                  [slash_value_label U.en_text value])
                ~icon:("priorityLvl" ^ title)
                ~desc:(Desc_custom (U.tf "editor.slash/priority-desc" [label]))
                ?group:g (cmd ("priority:" ^ title)))
              (Properties_data.entity_title_of value)) priorities
       @ [mk_item ~key:"editor.slash/no-priority"
           ~label:(U.t "editor.slash/no-priority")
           ~english:(U.en_text "editor.slash/no-priority")
           ~icon:"priorityLvlNone" ?group:g (cmd "priority:")])

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
          , cmd "add-property" ]
    ; configured_slash_items ()
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
    ] in
  let labels = Hashtbl.create (List.length items) in
  let items = List.fold_right (fun item result ->
      if Hashtbl.mem labels item.ai_label then result
      else begin Hashtbl.add labels item.ai_label (); item :: result end) items [] in
  let page = Option.fold ~none:false ~some:Editor_actions.anchor_is_page_title
      (Editor_state.editing_uuid ()) in
  if not page then items else
    let groups = List.map U.t ["editor.slash/group-task-status";
      "editor.slash/group-task-date"; "editor.slash/group-priority"] in
    List.filter (fun item -> item.ai_label = U.t "command.editor/add-property"
      || Option.fold ~none:false ~some:(fun group -> List.mem group groups) item.ai_group) items
;;

(* cljs editor.cljs keeps a fallback item for slash *)
let slash_fallback () =
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
  let fields = [ (fun it -> it.ai_label); (fun it -> it.ai_english) ] in
  let fields = if U.current_lang () = "zh-CN" then
      fields @ [fun it -> Fuzzy.hanzi_initials it.ai_label] else fields in
  let fs =
    Fuzzy.fuzzy_search_multi ~extract_fns:fields ~limit:50 items q
  in

  (match fs with [] -> [ slash_fallback () ] | _ -> fs)
  |> with_headers (q = "")
;;

(* cljs editor.cljs page-search: an empty [[ query lists the i18n nlp
   date pages (calendar icon); choosing one emits [[<journal title>]]
   parsed from the english name *)
let nlp_date_of (en : string) : Dates.t =
  let now = Dates.date_now () in
  let add n = Dates.add_days now (int_of_float n) in
  let shift_month n = Dates.shift_month now (int_of_float n) in
  let shift_year n = Dates.shift_year now (int_of_float n) in
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
    | Page_ref | Page_embed ->
        if q = "" then
          List.map
            (fun en ->
              let jt = Dates.journal_title_of (nlp_date_of en) in
              mk_item ~key:("nlp:" ^ en) ~node:true
                ~node_icon:("calendar", false)
                ~label:(U.t (nlp_i18n_key en)) ~icon:"calendar"
                (match kind with
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
    | _ -> List.exists (fun ti -> S.equal ti q) !(t.page_exact_titles)
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

let page_item_of_row ?(kind = Page_ref) i w =
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
    if kind = Embed_ref then
      match Wire.map_get_int w "db/id" with
      | Some id -> Embed_target id
      | None -> invalid_arg "Node embed search result is missing db/id"
    else if is_page then Emit ("[[" ^ title ^ "]]", 0)
    else Emit ("[[" ^ uuid ^ "]]", 0)
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
      let graph = repo () and session = !(t.session) in
      ignore (let* values = Js.Promise.all [|
        Properties_data.closed_values (Wire.Keyword "logseq.property/status");
        Properties_data.closed_values (Wire.Keyword "logseq.property/priority") |] in
        (match (get t).ac with
         | Some current when session = !(t.session) && graph = repo ()
              && current.kind = Slash && current.auuid = ac.auuid
              && current.query = ac.query ->
             let items = slash_items ~statuses:(Wire.elems values.(0))
               ~priorities:(Wire.elems values.(1))
               ~has_heading:(editing_has_heading ()) |> filter_slash current.query in
             set_ac t (Some {current with items; chosen = 0})
         | _ -> ());
        Js.Promise.resolve ());
      { ac with
        items =
          filter_slash ac.query
            (slash_items ~statuses:[] ~priorities:[]
              ~has_heading:(editing_has_heading ())) }
  | Page_ref | Page_embed | Tag_search ->
      { ac with items = page_items_for t ac.kind ac.query }
  | Template_search -> { ac with items = template_items_for t ac.query }
  | Embed_ref -> { ac with items = [] }
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
  let gen = !(t.gen) and graph = repo () in
  ignore
    ((let* w =
       Runtime.invoke3 "thread-api/search-blocks"
         (Wire.String graph)
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
        when gen = !(t.gen) && graph = repo ()
             && a.kind = Block_ref && a.query = ac.query ->
          set_ac t
            (Some
               { a with
                 items = renumber (take 20 (List.mapi block_item_of_row rows))
               ; chosen = 0 })
      | _ -> ());
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Ui_services.log_error ("popups block search failed", e);
            Js.Promise.resolve ()))
;;

(* cljs search-pages/<get-matched-blocks: [[ ]] completion matches pages
   AND blocks via block-search; block rows carry their page breadcrumb.
   Results replace the sync title matches; a "New page" row is kept first
   (or second, when the first match starts with the query). *)
let run_node_search t ac =
  incr t.gen;
  let gen = !(t.gen) and graph = repo () and session = !(t.session) in
  ignore
    ((let* w =
       Runtime.invoke3 "thread-api/search-blocks"
         (Wire.String graph)
         (Wire.String ac.query)
         (* cljs <get-matched-blocks passes :enable-snippet? false — the
            page-ref menu renders no snippets and snippet() is the
            expensive part of the FTS query *)
         (Wire.Map
            [ (Wire.kw "limit", Wire.Int 20)
            ; (Wire.kw "search-limit", Wire.Int 100)
            ; (Wire.kw "enable-snippet?", Wire.Bool false)
            ; (Wire.kw "include-breadcrumb?", Wire.Bool true)
            ; (Wire.kw "include-matched-count?", Wire.Bool true)
            ; (Wire.kw "built-in?", Wire.Bool (ac.kind = Page_ref))
            ; (Wire.kw "dev?", Wire.Bool false) ])
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
        when gen = !(t.gen) && session = !(t.session) && graph = repo ()
             && (a.kind = Page_ref || a.kind = Embed_ref) && a.kind = ac.kind
             && a.auuid = ac.auuid && ac_current a && a.query = ac.query
             && (match ac.editor, Editor_state.editing () with
                 | Some origin, Some editor ->
                     editor.uuid = ac.auuid && origin.epoch == editor.epoch
                 | _ -> false) ->
          let rows =
            if a.kind = Embed_ref then
              List.filter (fun row ->
                Wire.map_get_uuid row "block/uuid" <> Some a.auuid
                && Cmdk_state.str_field row "block/uuid" <> Some a.auuid) rows
            else rows
          in
          let pages, blocks =
            List.partition
              (fun w ->
                match Wire.get w "page?" with
                | Some (Wire.Bool b) -> b
                | _ -> false)
              rows
          in
          (* cljs <get-matched-blocks: block-search rows go through a
             client-side fuzzy re-rank (limit 50) and the unmatched
             leftovers are appended rather than dropped. The loaded page
             titles stand in for cljs's leftover source so a search index
             that is still (re)building can't starve the menu, and nlp
             date pages join the pool as they do in cljs nlp-pages?. *)
          let matched_pages = List.mapi (page_item_of_row ~kind:a.kind) pages
          and matched_blocks = List.mapi (page_item_of_row ~kind:a.kind) blocks in
          let items =
            if a.kind = Embed_ref then matched_pages @ matched_blocks
            else begin
          let seen = Hashtbl.create 32 in
          List.iter
            (fun it -> Hashtbl.replace seen it.ai_label ())
            matched_pages;
          let leftover =
            List.filter_map
              (fun title ->
                 if Hashtbl.mem seen title then None
                 else Some (mk_item ~key:("page:" ^ title) ~label:title
                              ~node:true ~node_icon:("file", true)
                              (Emit ("[[" ^ title ^ "]]", 0))))
              (Fuzzy.fuzzy_search ~extract:(fun ti -> ti) ~limit:50
                 !(t.titles) a.query)
          in
          List.iter
            (fun it -> Hashtbl.replace seen it.ai_label ()) leftover;
          let nlp =
            List.filter_map
              (fun en ->
                 let jt = Dates.journal_title_of (nlp_date_of en) in
                 let label = U.t (nlp_i18n_key en) in
                 if Hashtbl.mem seen jt || Hashtbl.mem seen label
                 then None
                 else
                   Some
                     (mk_item ~key:("nlp:" ^ en) ~node:true
                        ~node_icon:("calendar", false) ~label
                        ~icon:"calendar"
                        (Emit ("[[" ^ jt ^ "]]", 0))))
              (Fuzzy.fuzzy_search
                 ~extract:(fun en ->
                    en ^ " "
                    ^ Dates.journal_title_of (nlp_date_of en))
                 ~limit:10 nlp_en_names a.query)
          in
          let matched =
            take 50
              (matched_pages @ nlp @ leftover @ matched_blocks)
          in
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
            end
          in
          set_ac t (Some { a with items = renumber items; chosen = 0 })
      | _ -> ());
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Ui_services.log_error ("popups node search failed", e);
            Js.Promise.resolve ()))
;;

let load_titles t =
  let session = !(t.session) and graph = repo () in
  ignore
    ((let* w =
       Runtime.invoke1 "thread-api/get-all-page-titles"
         (Wire.String graph)
     in
     let rows =
       match w with
       | Wire.Array xs | Wire.List xs -> xs
       | _ -> []
     in
     let titles =
       List.filter_map
         (fun row ->
           match row with
           | Wire.String s -> Some s
           | _ -> Cmdk_state.str_field row "block/title")
         rows
     in
     (* get-all-page-titles intentionally returns strings, so resolve the
        suppression set separately: ordinary names need an internal page
        or journal with no parent. Tags retain their class/alias check. *)
     let* exact =
       Runtime.invoke2 "thread-api/q" (Wire.String graph)
         (Wire.Array
            [ Wire.String
                "[:find ?title :where (or [?page :block/tags :logseq.class/Page] [?page :block/tags :logseq.class/Journal]) [?page :block/title ?title] (not [?page :block/parent])]" ])
     in
     if session = !(t.session) && graph = repo () then (
     t.titles := titles;
     t.page_exact_titles :=
       (match exact with
        | Wire.Array xs | Wire.List xs ->
            List.filter_map
              (function
                | Wire.Array [ Wire.String title ] | Wire.List [ Wire.String title ] -> Some title
                | _ -> None)
              xs
        | _ -> []);
     (match (get t).ac with
      | Some ({ kind = Page_ref; query; _ } as ac) when String.trim query <> "" ->
          run_node_search t ac
      | Some ({ kind = Page_ref | Page_embed | Tag_search; _ } as ac) ->
          set_ac t (Some (refresh_items t ac))
      | _ -> ()));
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Ui_services.log_error ("popups titles failed", e);
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
  let session = !(t.session) and graph = repo () in
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
         (Wire.String graph)
         (wopts [ ("except-private-tags?", Wire.Bool true) ])
     in
     let rows =
       match w with
       | Wire.Array xs | Wire.List xs -> xs
       | _ -> []
     in
     let* () =
       let titles = class_titles_of rows in
       (* the full class list (private tags included) feeds only
          tag_exact_titles; Page is conjoined to the candidates just
          when editing a non-page block *)
       let* w2 =
         Runtime.invoke2 "thread-api/get-all-classes"
           (Wire.String graph)
           (wopts [ ("except-private-tags?", Wire.Bool false) ])
       in
       let rows2 =
         match w2 with
         | Wire.Array xs | Wire.List xs -> xs
         | _ -> []
       in
       if session = !(t.session) && graph = repo () then (
       t.tag_titles := titles;
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
            @ class_titles_of page_class));
       Js.Promise.resolve ()
     in
     (match (get t).ac with
      | _ when session <> !(t.session) || graph <> repo () -> ()
      | Some ({ kind = Tag_search; _ } as ac) ->
          set_ac t (Some (refresh_items t ac))
      | _ -> ());
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Ui_services.log_error ("popups classes failed", e);            Js.Promise.resolve ()))
;;

(* template-search: blocks tagged logseq.class/Template (cljs
   search/template-search = get-tag-objects + fuzzy) *)
let load_templates t =
  let session = !(t.session) and graph = repo () in
  ignore
    (let* w =
      Runtime.invoke2 "thread-api/q" (Wire.String graph)
        (Wire.Array
           [ Wire.String
               "[:find ?u ?ti :where [?b :block/tags ?t] \
                [?t :db/ident :logseq.class/Template] \
                [?b :block/uuid ?u] [?b :block/title ?ti]]"
           ])
    in
    let rows = Wire.elems w in
    if session = !(t.session) && graph = repo () then (
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
     | _ -> ()));
    Js.Promise.resolve ())
;;

(* ---- open / update ---- *)

let measure_ac ?(retries = 120) t kind =
  let session = !(t.session) in
  (* base-ui avoidCollisions: the popup mounts below the caret, then
     flips above when it overflows the viewport and there is more room
     above — measure once mounted and record (top, avail). Items can
     resolve well after the mount (first query after a cold load), so
     retry while the popup is up (~2s) to match base-ui's continuous
     collision re-check. Measure the scroll content independently of
     its clipped viewport; layout constraints stay in typed view props. *)
  let rec measure tries =
    match (get t).ac with
    | Some a when session = !(t.session) && a.kind = kind -> (
        (* cljs pins the popup at the caret position captured when it
           opened — typing further must not re-anchor it. While the
           anchor is still pending (async-measurement hosts answer
           popup_pos with None first) retries keep re-reading and
           upgrade it once — then the anchor freezes for the popup's
           session *)
        let a =
          if a.pos_pending then
            match Editor_sink.popup_pos a.auuid with
            | Some (x', y', cy') ->
                let a' =
                  { a with x = x'; y = y'; cy = cy'; pos_pending = false }
                in
                set_ac t (Some a');
                a'
            | None -> a
          else a
        in
        match Ui_services.dom_query "#ui__ac-inner" with
        | Some inner -> (
            match inner.Ui_services.closest ".ui__popover-content",
                  inner.Ui_services.query "#ui__ac-items" with
            | Some pop, Some items ->
                let _, _, w, popup_height = pop.Ui_services.rect () in
                let _, _, _, viewport_height = inner.Ui_services.rect () in
                let _, _, _, content_height = items.Ui_services.rect () in
                if w <= 0. || popup_height <= 0. || content_height <= 0.
                then retry tries
                else (
                  let chrome =
                    Float.max 0. (popup_height -. viewport_height)
                  in
                  let height ~flipped available =
                    chrome +. Float.min content_height
                      (ac_height_limit a.kind ~flipped available)
                  in
                  let fx =
                    if a.x +. w > Ui_services.dom_viewport_width () -. 5.
                    then Some (Float.max 8. (a.x -. w))
                    else None
                  in
                  let below =
                    Ui_services.dom_viewport_height () -. a.y -. 5.
                  in
                  let above = a.cy -. 5. in
                  (* Compare the natural bottom-side height, not the
                     current clipped height, so flipping cannot feed
                     back into its own overflow decision. *)
                  let flip' =
                    if height ~flipped:false Float.infinity > below
                       && above > below then
                      let avail = above in
                      let h_eff = height ~flipped:true avail in
                      Some (Float.max 5.0 (a.cy -. 5. -. h_eff), avail)
                    else None
                  in
                  if flip' <> a.flip || fx <> a.flipx then
                    set_ac t (Some { a with flip = flip'; flipx = fx });
                  retry tries)
            | _ -> retry tries)
        | None -> retry tries)
    | None when session = !(t.session) -> retry tries
    | _ -> ()
  and retry tries =
    if tries > 0 then
      ignore (Ui_services.timers_timeout (fun () -> measure (tries - 1)) 16)
  in
  measure retries
;;

let open_ac ?tpos ?(autopair = true) t kind =
  if not (draft_editing ()) || draft_ac_kind kind then begin
  invalidate_ac t;
  let graph = repo () in
  if !(t.cache_repo) <> Some graph then (
    t.cache_repo := Some graph;
    t.titles := [];
    t.page_exact_titles := [];
    t.tag_titles := [];
    t.tag_exact_titles := [];
    t.templates := []);
  let auuid = Option.value (Editor_state.editing_uuid ()) ~default:"" in
  let pos = Editor_sink.popup_pos auuid in
  let x, y, cy = Option.value pos ~default:(0., 0., 0.) in
  let tlen = trigger_len_of_kind kind in
  let tpos = Option.value tpos ~default:(fst (Editor_actions.sel_span auuid) - tlen) in
  let ac =
    { kind; x; y; cy; pos_pending = Option.is_none pos
    ; flip = None; flipx = None; query = ""
    ; tpos; tlen
    ; items = []; chosen = 0; auuid; editor = Editor_state.editing () }
  in
  (* cljs autopair: typing [[ inputs ]] immediately with the caret kept
     inside the brackets; insert_text consumes the ghost pair on choice *)
  (match kind with
   | Page_ref when autopair ->
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
   | Page_ref | Page_embed -> load_titles t
   | Tag_search -> load_tag_titles t
   | Template_search -> load_templates t   | Block_ref | Embed_ref -> ()
   | Slash -> ());
  set_cm t None;
  set_ac t (Some (refresh_items t ac));
  measure_ac t kind
  end
;;

let ac_update t ac q =
  incr t.gen;
  let ac = { ac with query = q; chosen = 0 } in
  set_ac t (Some (refresh_items t ac));
  if ac.kind = Block_ref then run_block_search t ac
  else if (ac.kind = Page_ref || ac.kind = Embed_ref) && String.trim q <> ""
  then run_node_search t ac
;;

let query_closed_kind kind q =
  match kind with
  | Page_ref | Page_embed -> S.contains q ']'
  | Block_ref -> S.contains q ')'
  | Slash | Tag_search | Template_search | Embed_ref -> S.contains q '\n'
;;

let query_closed ac q = query_closed_kind ac.kind q

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
              (* cljs autopairs "(" -> "()" and warns to use [[ instead —
                 "((" never opens block-ref search; the typed char just
                 joins the open popup's query below *)
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

let page_reference_at (m : Edit_model.t) pos =
  let rec find = function
    | [] -> None
    | (r : Edit_runs.run) :: rest ->
        if r.start_off > pos then None
        else if r.kind = Edit_runs.Atomic && r.start_off + 2 <= pos
                && pos <= r.end_off - 2 && Str_util.contains r.cls "ed-page-ref"
        then Some r
        else find rest
  in
  find m.runs

let on_caret_move uuid =
  match !active, Editor_actions.edit_model uuid with
  | Some t, Some m when not (Edit_model.has_selection m) ->
      (match page_reference_at m m.caret with
       | Some r ->
           (match (get t).ac with
            | Some ac when ac.auuid = uuid && ac.kind = Page_ref && ac.tpos = r.start_off -> ()
            | _ -> open_ac ~tpos:r.start_off ~autopair:false t Page_ref);
           (match (get t).ac with
            | Some ac -> ac_update t ac (S.sub m.source (r.start_off + 2) (m.caret - r.start_off - 2))
            | None -> ())
       | None ->
           (match (get t).ac with
            | Some { kind = Page_ref; _ } -> close_ac t
            | _ -> ()))
  | _ -> ()

let () = Editor_state.caret_changed := on_caret_move

(* ---- events ---- *)

let detail_obj pairs = Json.Object pairs;;

(* replace [tpos, caret) with text in the editing model — equivalent
   to cljs's ls:editor-insert handler *)
let insert_text (ac : ac) text back =
  if ac_current ac then
  match Editor_actions.edit_model ac.auuid with
  | Some m ->
      let v = m.Edit_model.source in
      let n = S.length v in
      let tpos = max 0 (min ac.tpos n) in
      let pos = max tpos (min (fst (Editor_actions.sel_span_of m)) n) in
      (* consume the autopaired ]] sitting right after the caret *)
      let pos =
        if ac.kind = Page_ref then
          match page_reference_at m pos with
          | Some r when r.start_off = tpos -> r.end_off
          | _ when pos + 1 < n && S.sub v pos 2 = "]]" -> pos + 2
          | _ -> pos
        else if ac.kind = Embed_ref
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
  Ui_services.dom_dispatch_json "ls:editor-insert"
    (detail_obj
       [ "text", Json.String text
       ; "from", Json.Number (float_of_int tpos)
       ; "to"
         , Json.Number
             (float_of_int (fst (Editor_actions.sel_span auuid)))
       ; "exit", Json.Bool exit ]);
  (* cljs refocuses the editor input after a chosen item *)
  Editor_sink.focus_input auuid
;;

let emit_cmd ?pos command extra =
  Ui_services.dom_dispatch_json "ls:editor-command"
    (detail_obj
       (("command", Json.String command)
        :: (match pos with
            | Some p ->
                [ "from", Json.Number (float_of_int p)
                ; "to", Json.Number (float_of_int p) ]
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
  match Editor_state.editing () with
  | Some editing when editing.uuid = ac.auuid ->
      let buuid = editing.uuid in
      let repo_v = repo () in
      let gen = !(t.gen) and session = !(t.session) in
      let awaiting_lookup () =
        gen = !(t.gen) && session = !(t.session) && repo_v = repo ()
        && ac_current ac
        && match Editor_state.editing () with
           | Some current ->
               current.epoch == editing.epoch
               && current.model.version = editing.model.version
               && current.model.caret = editing.model.caret
               && current.model.anchor = editing.model.anchor
               && not (Edit_model.composing current.model)
           | None -> false
      in
      let attach_tag dbid =
        let ops =
          [ Outliner_ops.set_block_property buuid "block/tags" (Wire.Int dbid) ]
        in
        if repo_v = repo () then
          ignore (Outliner_ops.apply_and_refresh ops)
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
             if repo_v <> repo () then Js.Promise.resolve ()
             else
             let* e =
               Runtime.invoke2 "thread-api/get-case-page"
                 (Wire.String repo_v) (Wire.String title)
             in
             (match Wire.map_get_int e "db/id" with
              | Some dbid -> attach_tag dbid
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
          if not (awaiting_lookup ()) then Js.Promise.resolve ()
          else match w with
          | Wire.Map _ -> (
              match Wire.map_get_int w "db/id" with
              | None -> Js.Promise.resolve ()
              | Some dbid ->
                  (match Wire.get w "db/ident" with
                   | Some _ ->
                       insert ();
                       close_ac t;
                       if not (tag_in_ref ()) then attach_tag dbid;
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
                         attach_tag dbid;
                         Js.Promise.resolve ()))
          | _ ->
              create_and_tag ();
              Js.Promise.resolve ())
  | _ -> ()

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

exception Unsupported_configured_input

let configured_blank units text =
  let rec blank index =
    index = S.length text ||
    let cp = Edit_model.decode_cp units text index in
    ((cp >= 0x09 && cp <= 0x0D) || cp = 0x20 || cp = 0xA0 || cp = 0x1680
     || (cp >= 0x2000 && cp <= 0x200A) || cp = 0x2028 || cp = 0x2029
     || cp = 0x202F || cp = 0x205F || cp = 0x3000 || cp = 0xFEFF)
    && blank (index + Edit_model.cp_len units text index) in
  blank 0

let configured_cjk cp =
  (cp >= 0x3040 && cp <= 0x30FF) || (cp >= 0x3400 && cp <= 0x4DBF)
  || (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0xF900 && cp <= 0xFAFF)
  || (cp >= 0xFF66 && cp <= 0xFF9F)

let configured_has_cjk units text =
  let rec has index =
    index < S.length text
    && (configured_cjk (Edit_model.decode_cp units text index)
        || has (index + Edit_model.cp_len units text index)) in
  has 0

let configured_concat ~units left right =
  let horizontal = function ' ' | '\t' | '\r' -> true | _ -> false in
  let end_ = ref (S.length left) and start = ref 0 in
  while !end_ > 0 && horizontal left.[!end_ - 1] do decr end_ done;
  while !start < S.length right && horizontal right.[!start] do incr start done;
  let left = S.sub left 0 !end_ in
  left ^ (if configured_blank units left || left.[S.length left - 1] = '\n' then "" else " ")
    ^ S.sub right !start (S.length right - !start)

let configured_last_index text pattern =
  if pattern = "" then Some (S.length text) else
  let rec find start found = match Str_util.index_from text start pattern with
    | None -> found
    | Some index -> find (index + 1) (Some index) in
  find 0 None

let configured_input ?(backward_pos = 0) ?(last_pattern = Some "/")
    ?end_pattern ?backward_truncate_number ?(only_breakline = false)
    ?(block_input = false) ?(at_block_start = false) ?(page_ref = false)
    value (model : Edit_model.t) =
  let text =
    if block_input && not at_block_start && model.caret > 0
       && model.source.[model.caret - 1] <> '\n'
    then "\n" ^ value else value in
  let rewind ?(truncate = false) text count =
    match model.units with
    | Edit_model.U16 -> max 0 (S.length text - count)
    | Edit_model.Bytes ->
        let rec back pos count =
          if count <= 0 || pos = 0 then pos else
          let prev = Edit_model.prev_cp model.units text pos in
          let width = if Edit_model.decode_cp model.units text prev > 0xFFFF then 2 else 1 in
          if truncate && count < width then raise Unsupported_configured_input;
          back prev (count - width) in
        back (S.length text) count in
  let pos = match end_pattern with
    | None -> model.caret
    | Some pattern ->
        Option.value (Str_util.index_from model.source model.caret pattern)
          ~default:model.caret in
  let last_pattern = if backward_truncate_number = None then last_pattern else None in
  let prefix = S.sub model.source 0 pos in
  let suffix = S.sub model.source pos (S.length model.source - pos) in
  let index = Option.bind last_pattern (configured_last_index prefix) in
  let cjk_adjacent =
    page_ref && configured_has_cjk model.units text
    && ((prefix <> "" && configured_cjk (Edit_model.decode_cp model.units prefix
           (Edit_model.prev_cp model.units prefix (S.length prefix))))
        || (suffix <> "" && configured_cjk (Edit_model.decode_cp model.units suffix 0))) in
  let space = match last_pattern with
    | None -> false
    | Some pattern ->
        not (cjk_adjacent || Str_util.starts_with pattern "::" || Str_util.ends_with pattern "::"
             || Str_util.starts_with pattern "#[[" || Str_util.starts_with pattern "```"
             || Option.fold ~none:false ~some:(fun index ->
                  let before = S.sub prefix 0 index in
                  (Str_util.ends_with before "("
                   && (Str_util.starts_with pattern "((" || Str_util.starts_with pattern "[["))
                  || Str_util.starts_with before "{{embed"
                  || (Str_util.ends_with before "#" && Str_util.starts_with pattern "[[")) index) in
  let concat left right = if space then configured_concat ~units:model.units left right else left ^ right in
  let prefix = match backward_truncate_number with
    | Some 0 -> prefix
    | Some count -> S.sub prefix 0 (rewind ~truncate:true prefix count) ^ text
    | None ->
        (match last_pattern, index with
         | None, _ -> prefix ^ text
         | Some pattern, _ when configured_blank model.units pattern -> concat prefix text
         | Some _, Some index -> concat (S.sub prefix 0 index) text
         | Some _, None -> prefix) in
  let suffix =
    if only_breakline && Str_util.starts_with suffix "\n" then
      S.sub suffix 1 (S.length suffix - 1)
    else suffix in
  let source = if configured_blank model.units suffix then prefix else concat prefix suffix in
  let pos = rewind prefix backward_pos in
  if not (configured_blank model.units text) && configured_blank model.units source then model else
    Edit_model.select (Edit_model.splice model 0 (S.length model.source) source)
      ~anchor:pos ~focus:pos

let configured_steps ?(at_block_start = false) output =
  let move direction count model =
    let rec loop count model = if count <= 0 then model else
      loop (count - 1) (Edit_model.move model direction ~extend:false) in
    loop count model in
  let input text fields =
    let supported = List.for_all (function
      | Wire.Keyword ("backward-pos" | "backward-truncate-number"), Wire.Int n -> n >= 0
      | Wire.Keyword "last-pattern", (Wire.String _ | Wire.Keyword "skip-check")
      | Wire.Keyword "end-pattern", Wire.String _
      | Wire.Keyword "only-breakline?", Wire.Bool _
      | Wire.Keyword ("type" | "command"), _
      | Wire.Keyword ("backward-pos" | "backward-truncate-number" | "last-pattern"
                      | "end-pattern" | "only-breakline?"), Wire.Nil -> true
      | _ -> false) fields in
    if not supported then None else
    let options = Wire.Map fields in
    let integer key = match Wire.get options key with
      | Some (Wire.Int n) -> Some n | _ -> None in
    let last_pattern = match Wire.get options "last-pattern" with
      | Some (Wire.Keyword "skip-check") -> None
      | Some (Wire.String pattern) -> Some pattern
      | _ -> Some "/" in
    let end_pattern = match Wire.get options "end-pattern" with
      | Some (Wire.String pattern) -> Some pattern | _ -> None in
    Some (configured_input ~last_pattern ?end_pattern
      ?backward_pos:(integer "backward-pos")
      ?backward_truncate_number:(integer "backward-truncate-number")
      ~at_block_start
      ~block_input:(match Wire.get options "type" with
        | Some (Wire.String ("block" | "properties")) -> true | _ -> false)
      ~page_ref:(Wire.get options "command" = Some (Wire.Keyword "page-ref"))
      ~only_breakline:(Wire.get options "only-breakline?" = Some (Wire.Bool true)) text) in
  let step = function
    | Wire.Array [Wire.Keyword "editor/input"; Wire.String text]
    | Wire.Array [Wire.Keyword "editor/input"; Wire.String text; Wire.Nil] ->
        Some (configured_input text)
    | Wire.Array [Wire.Keyword "editor/input"; Wire.String text; Wire.Map fields] ->
        input text fields
    | Wire.Array [Wire.Keyword "editor/cursor-back"; Wire.Int count] when count >= 0 ->
        Some (move Edit_model.Left count)
    | Wire.Array [Wire.Keyword "editor/cursor-forward"; Wire.Int count] when count >= 0 ->
        Some (move Edit_model.Right count)
    | Wire.Array [Wire.Keyword "editor/move-cursor-to-end"] ->
        Some (move Edit_model.Doc_end 1)
    | Wire.Array [Wire.Keyword "editor/clear-current-slash"]
    | Wire.Array [Wire.Keyword "editor/clear-current-slash"; Wire.Bool false]
    | Wire.Array [Wire.Keyword "editor/clear-current-slash"; Wire.Nil] ->
        Some (fun (model : Edit_model.t) ->
          let prefix = S.sub model.source 0 model.caret in
          match S.rindex_opt prefix '/' with
          | None -> model
          | Some index -> Edit_model.select (Edit_model.splice model index model.caret "")
              ~anchor:index ~focus:index)
    | Wire.Array [Wire.Keyword "editor/clear-current-slash"; Wire.Bool true] ->
        Some (fun (model : Edit_model.t) ->
          let prefix = S.sub model.source 0 model.caret in
          match S.rindex_opt prefix '/' with
          | None -> model
          | Some index ->
              let prefix = configured_concat ~units:model.units (S.sub prefix 0 index) "" in
              let suffix = S.sub model.source model.caret (S.length model.source - model.caret) in
              Edit_model.select (Edit_model.splice model 0 (S.length model.source) (prefix ^ suffix))
                ~anchor:(S.length prefix) ~focus:(S.length prefix))
    | _ -> None in
  match output with
  | Wire.String text -> Some [configured_input text]
  | Wire.Array steps ->
      List.fold_right (fun value result -> match step value, result with
        | Some step, Some steps -> Some (step :: steps)
        | _ -> None) steps (Some [])
  | _ -> None

type configured_effect =
  | Configured_property of Wire.t * Wire.t
  | Configured_nested_property of Wire.t * Wire.t * Wire.t
  | Configured_closed_value of string * Wire.t
  | Configured_heading of Wire.t
  | Configured_own_list of bool
  | Configured_children_list

type configured_ui =
  | Configured_new_property of string option
  | Configured_date_picker
  | Configured_link_form of bool

type configured_checkpoint =
  { configured_uuid : string
  ; configured_caret : int
  ; configured_editor : Editor_state.editing
  ; configured_repo : string
  ; configured_route : Model.route
  ; configured_input_seq : int
  ; configured_popup_session : int ref
  ; configured_popup_generation : int
  }

let configured_checkpoint_current checkpoint =
  checkpoint.configured_repo = Runtime.repo ()
  && checkpoint.configured_route = Runtime.route ()
  && checkpoint.configured_input_seq = !Editor_state.edit_input_seq
  && checkpoint.configured_popup_generation = !(checkpoint.configured_popup_session)
  && match Editor_state.editing () with
     | Some live ->
         let before = checkpoint.configured_editor in
         live.uuid = checkpoint.configured_uuid && live.epoch == before.epoch
         && live.scope = before.scope && live.model.source = before.model.source
         && live.buffer = before.buffer
         && live.model.caret = checkpoint.configured_caret
         && live.model.anchor = before.model.anchor
         && not (Edit_model.composing live.model)
     | None -> false

type configured_ui_entry =
  configured_checkpoint -> current:(unit -> bool) -> configured_ui -> bool

let configured_ui_entry : configured_ui_entry option ref = ref None
let install_configured_ui entry = configured_ui_entry := Some entry

type configured_terminal =
  | Configured_search of ac_kind
  | Configured_exit
  | Configured_ui of configured_ui

type configured_step =
  | Configured_models of (Edit_model.t -> Edit_model.t) list
  | Configured_effect of configured_effect
  | Configured_terminal of configured_terminal

let configured_link_form = function
  | Wire.Array [Wire.Map url; Wire.Map label] ->
      let first = Wire.Map url and second = Wire.Map label in
      let command = Wire.get first "command" in
      let fields expected_id expected_placeholder fields =
        List.for_all (function
          | Wire.Keyword "command", value -> Some value = command
          | Wire.Keyword "id", Wire.Keyword id -> id = expected_id
          | Wire.Keyword "placeholder", Wire.String text -> text = U.t expected_placeholder
          | Wire.Keyword "auto-focus", Wire.Bool value -> value = (expected_id = "link")
          | _ -> false) fields in
      if Wire.get first "id" <> Some (Wire.kw "link")
         || Wire.get second "id" <> Some (Wire.kw "label")
         || Wire.get second "command" <> command
         || Wire.get first "placeholder" <> Some (Wire.String (U.t "ui/link"))
         || Wire.get second "placeholder" <> Some (Wire.String (U.t "ui/label"))
         || Wire.get first "auto-focus" <> Some (Wire.Bool true)
         || not (fields "link" "ui/link" url && fields "label" "ui/label" label)
      then None else
      (match command with
       | Some (Wire.Keyword "link") -> Some (Configured_link_form false)
       | Some (Wire.Keyword "image-link") -> Some (Configured_link_form true)
       | _ -> None)
  | _ -> None

let configured_property_ref = function
  | Wire.Keyword ident ->
      (match S.index_opt ident '/' with
       | Some index -> index > 0 && index < S.length ident - 1
       | None -> false)
  | Wire.Int id -> id > 0
  | _ -> false

let configured_program ?(at_block_start = false) output =
  let step value =
    match configured_steps ~at_block_start (Wire.Array [value]) with
    | Some models -> Some (Configured_models models)
    | None ->
      let terminal action = Some (Configured_terminal action) in
      match value with
      | Wire.Array [Wire.Keyword "editor/exit"] -> terminal Configured_exit
      | Wire.Array [Wire.Keyword "editor/search-page"] -> terminal (Configured_search Page_ref)
      | Wire.Array [Wire.Keyword "editor/search-page-hashtag"] -> terminal (Configured_search Tag_search)
      | Wire.Array [Wire.Keyword "editor/search-block"]
      | Wire.Array [Wire.Keyword "editor/search-block"; Wire.Nil] -> terminal (Configured_search Block_ref)
      | Wire.Array [Wire.Keyword "editor/search-block"; Wire.Keyword "embed"] ->
          terminal (Configured_search Embed_ref)
      | Wire.Array [Wire.Keyword "editor/new-property"] ->
          terminal (Configured_ui (Configured_new_property None))
      | Wire.Array [Wire.Keyword "editor/set-scheduled"] ->
          terminal (Configured_ui (Configured_new_property (Some "logseq.property/scheduled")))
      | Wire.Array [Wire.Keyword "editor/set-deadline"] ->
          terminal (Configured_ui (Configured_new_property (Some "logseq.property/deadline")))
      | Wire.Array [Wire.Keyword "editor/show-date-picker"]
      | Wire.Array [Wire.Keyword "editor/show-date-picker"; Wire.Nil] ->
          terminal (Configured_ui Configured_date_picker)
      | Wire.Array [Wire.Keyword "editor/show-input"; options] ->
          Option.map (fun action -> Configured_terminal (Configured_ui action))
            (configured_link_form options)
      | _ ->
        Option.map (fun action -> Configured_effect action) (match value with
          | Wire.Array [Wire.Keyword "editor/toggle-own-number-list"] ->
              Some (Configured_own_list true)
          | Wire.Array [Wire.Keyword "editor/remove-own-number-list"] ->
              Some (Configured_own_list false)
          | Wire.Array [Wire.Keyword "editor/toggle-children-number-list"] ->
              Some Configured_children_list
          | Wire.Array [Wire.Keyword "editor/set-status"; value] ->
              Some (Configured_closed_value ("logseq.property/status", value))
          | Wire.Array [Wire.Keyword "editor/set-priority"; Wire.Nil] ->
              Some (Configured_property (Wire.kw "logseq.property/priority",
                Wire.kw "logseq.property/empty-placeholder"))
          | Wire.Array [Wire.Keyword "editor/set-priority"; value] ->
              Some (Configured_closed_value ("logseq.property/priority", value))
          | Wire.Array [Wire.Keyword "editor/set-heading"; (Wire.Nil | Wire.Int _ as value)] ->
              Some (Configured_heading value)
          | Wire.Array [Wire.Keyword "editor/set-property"; ident; value]
            when configured_property_ref ident ->
              Some (Configured_property (ident, value))
          | Wire.Array [Wire.Keyword "editor/set-property-on-block-property";
              parent; ident; value]
            when configured_property_ref parent && configured_property_ref ident ->
              Some (Configured_nested_property (parent, ident, value))
          | _ -> None)
  in
  match output with
  | Wire.String _ -> Option.map (fun models -> [Configured_models models])
      (configured_steps ~at_block_start output)
  | Wire.Array values ->
      List.fold_right (fun value result -> match step value, result with
        | Some (Configured_terminal _), Some (_ :: _) -> None
        | Some step, Some steps -> Some (step :: steps)
        | _ -> None) values (Some [])
  | _ -> None

let configured_pull ~current ~repo query target =
  if not (current ()) then Js.Promise.resolve None else
  let* entity = Runtime.invoke "thread-api/pull" [Wire.String repo; query; target] in
  Js.Promise.resolve (if current () then Some entity else None)

let configured_property_ident ~current ~repo = function
  | Wire.Keyword ident -> Js.Promise.resolve (if current () then Some ident else None)
  | Wire.Int id ->
      let* entity = configured_pull ~current ~repo
          (Wire.Array [Wire.kw "db/ident"]) (Wire.Int id) in
      (match entity with
       | None -> Js.Promise.resolve None
       | Some entity ->
           match Properties_data.getk (Properties_data.untag entity) "db/ident" with
           | Some ident -> Js.Promise.resolve (Some ident)
           | None -> invalid_arg "Configured command property has no db/ident")
  | _ -> invalid_arg "Invalid configured command property reference"

let configured_effect_ops ~current ~repo uuid action =
  let ( let*? ) pending next =
    let* value = pending in
    match value with None -> Js.Promise.resolve None | Some value -> next value in
  if not (current ()) then Js.Promise.resolve None else
  match action with
  | Configured_own_list toggle ->
      let ordered = match Editor_state.find uuid with
        | Some block -> block.Model.block_order_list = Some "number" | None -> false in
      Js.Promise.resolve (Some (if not toggle && not ordered then [] else [if ordered then
        Outliner_ops.remove_block_property uuid "logseq.property/order-list-type"
      else Outliner_ops.set_block_property uuid "logseq.property/order-list-type"
        (Wire.String "number")]))
  | Configured_children_list ->
      let* wire = Runtime.invoke2 "thread-api/get-block-immediate-children"
          (Wire.String repo) (Wire.Uuid uuid) in
      if not (current ()) then Js.Promise.resolve None else
      let children = match wire with
        | Wire.Array children | Wire.List children -> children
        | _ -> invalid_arg "Invalid configured child list response" in
      let ordered = List.exists (fun child ->
        Decode.order_list_type_of_wire child = Some "number") children in
      let ops = List.map (fun child ->
        let target = match Wire.map_get_uuid child "block/uuid" with
          | Some uuid -> uuid
          | None -> invalid_arg "Configured child list target has no block/uuid" in
        if ordered then Outliner_ops.remove_block_property target "logseq.property/order-list-type"
        else Outliner_ops.set_block_property target "logseq.property/order-list-type" (Wire.String "number")) children in
      Js.Promise.resolve (Some ops)
  | Configured_property (property, value) ->
      let*? ident = configured_property_ident ~current ~repo property in
      Js.Promise.resolve (Some [Outliner_ops.set_block_property uuid ident value])
  | Configured_heading Wire.Nil ->
      Js.Promise.resolve (Some [Outliner_ops.remove_block_property uuid "logseq.property/heading"])
  | Configured_heading value ->
      Js.Promise.resolve (Some [Outliner_ops.set_block_property uuid "logseq.property/heading" value])
  | Configured_closed_value (ident, value) ->
      let* values = Properties_data.closed_values (Wire.kw ident) in
      if not (current ()) then Js.Promise.resolve None else
      let id = List.find_map (fun entity ->
        let entity = Properties_data.untag entity in
        let content = match Wire.get entity "block/title" with
          | Some Wire.Nil | None -> Wire.get entity "logseq.property/value"
          | content -> content in
        if content = Some value then Properties_data.geti entity "db/id" else None)
          (Wire.elems values) in
      (match id with
       | Some id -> Js.Promise.resolve (Some
           [Outliner_ops.batch_set_property [uuid] ident (Wire.Int id) ~entity_id:true])
       | None ->
           Ui_services.log_error ("No entity found for configured closed value", value);
           Js.Promise.resolve (Some []))
  | Configured_nested_property (parent, property, value) ->
      let*? parent = configured_property_ident ~current ~repo parent in
      let*? ident = configured_property_ident ~current ~repo property in
      let*? entity = configured_pull ~current ~repo
          (Wire.Array [Wire.Map [Wire.kw parent, Wire.Array [Wire.kw "block/uuid"]]])
          (Wire.Array [Wire.kw "block/uuid"; Wire.Uuid uuid]) in
      (match Wire.get (Properties_data.untag entity) parent with
       | None | Some Wire.Nil -> Js.Promise.resolve (Some [])
       | Some target ->
           match Properties_data.entity_uuid_of target with
           | Some target -> Js.Promise.resolve (Some
               [Outliner_ops.set_block_property target ident value])
           | None -> invalid_arg "Configured block property has no block/uuid")

let apply_configured_models uuid steps =
  match Editor_actions.edit_model uuid with
  | None -> None
  | Some before ->
      let model = List.fold_left (fun model step -> step model) before steps in
      Editor_actions.update_model uuid (fun _ -> model);
      if before.Edit_model.source <> model.Edit_model.source then
        Outliner_ops.schedule_save uuid model.Edit_model.source;
      Some model

let open_configured_search t checkpoint kind =
  let model = checkpoint.configured_editor.model in
  let caret = checkpoint.configured_caret in
  if Option.fold ~none:false ~some:(( <> ) caret) model.anchor then false else
  let trigger = trigger_text_of_kind kind in
  let length = S.length trigger in
  let prefix = S.sub model.source 0 caret in
  let start = if length = 0 then Some caret else
    Option.bind (S.rindex_opt prefix (S.get trigger (length - 1))) (fun index ->
      let start = index - length + 1 in
      if start >= 0 && S.sub prefix start length = trigger then Some start else None) in
  match start with
  | None -> false
  | Some start ->
      let query = S.sub prefix (start + length) (caret - start - length) in
      if query_closed_kind kind query
      then false else begin
        open_ac ~tpos:start ~autopair:false t kind;
        match (get t).ac with
        | Some ac -> ac_update t ac query; true
        | None -> false
      end

let run_configured t ac ~unsupported steps =
  match Editor_state.editing (), Runtime.capture_reload_origin () with
  | Some editor, Some origin when editor.uuid = ac.auuid
      && (match ac.editor with
          | Some captured -> captured.epoch == editor.epoch && captured.scope = editor.scope
              && captured.uuid = editor.uuid
          | None -> false) ->
      let context = Runtime.model () in
      let owner = Outliner_ops.refresh_owner origin in
      let input_seq = !Editor_state.edit_input_seq in
      let expected = ref editor.model in
      close_ac t;
      let session = !(t.session) in
      let current () =
        session = !(t.session) && input_seq = !Editor_state.edit_input_seq
        && Outliner_ops.refresh_current ~owner context
        && match Editor_state.editing () with
           | Some live -> live.epoch == editor.epoch && live.uuid = editor.uuid
               && live.scope = editor.scope && live.model.source = (!expected).source
               && live.buffer = (!expected).source
               && live.model.caret = (!expected).caret && live.model.anchor = (!expected).anchor
               && not (Edit_model.composing live.model)
           | None -> false
      in
      let rec run = function
        | _ when not (current ()) -> Js.Promise.resolve ()
        | [] -> Editor_sink.focus_input ac.auuid; Js.Promise.resolve ()
        | [Configured_terminal action] ->
            let editor = Option.get (Editor_state.editing ()) in
            let checkpoint =
              {configured_uuid=ac.auuid; configured_caret=editor.model.caret;
               configured_editor=editor; configured_repo=origin.reload_repo;
               configured_route=origin.reload_route; configured_input_seq=input_seq;
               configured_popup_session=t.session; configured_popup_generation=session} in
            (match action with
             | Configured_exit -> Editor_actions.exit_edit ~select:false
             | Configured_search kind ->
                 if not (open_configured_search t checkpoint kind) then unsupported ()
             | Configured_ui action ->
                 match !configured_ui_entry with
                 | Some entry -> if not (entry checkpoint ~current action) then unsupported ()
                 | None -> invalid_arg "Configured UI entries are not installed");
            Js.Promise.resolve ()
        | Configured_terminal _ :: _ ->
            invalid_arg "Configured terminal action escaped structural validation"
        | Configured_models models :: rest ->
            let rec gather models = function
              | Configured_models next :: rest -> gather (next :: models) rest
              | rest -> List.concat (List.rev models), rest in
            let models, rest = gather [models] rest in
            (try
               Option.iter (fun model -> expected := model)
                 (apply_configured_models ac.auuid models);
               run rest
             with Unsupported_configured_input -> unsupported (); Js.Promise.resolve ())
        | Configured_effect action :: rest ->
            let* ops = configured_effect_ops ~current ~repo:origin.reload_repo ac.auuid action in
            if not (current ()) then Js.Promise.resolve () else
            match ops with
            | None -> Js.Promise.resolve ()
            | Some [] -> run rest
            | Some ops ->
                let* result = Outliner_ops.apply_result_for ~current context ops in
                if not (current ()) || Option.is_none result then Js.Promise.resolve () else
                let* () = Outliner_ops.refresh_via_delta ~owner result in
                let* () = Outliner_ops.require_refresh_success owner in
                if current () then begin
                  Properties_state.refresh_entity ac.auuid;
                  if Dialogs_state.ready () && Dialogs_state.is_open "quick-add" then
                    Quick_add_state.reload ()
                end;
                run rest
      in
      Editor_sink.focus_input ac.auuid;
      run steps
  | _ -> Js.Promise.resolve ()

let apply_item t ac ~meta it =
  let draft_allowed = match it.ai_act with
    | Emit _ | Noop -> true
    | Switch kind -> draft_ac_kind kind
    | _ -> false in
  if not (ac_current ac) || (draft_editing () && not draft_allowed) then close_ac t else
  match it.ai_act with
  | Configured output ->
      let unsupported () =
        Toast.error (U.t1 "editor.slash/unsupported-configured-command-error" it.ai_label) in
      (match configured_steps ~at_block_start:(ac.tpos = 0) output with
       | None ->
           (match configured_program ~at_block_start:(ac.tpos = 0) output with
            | None -> unsupported ()
            | Some steps -> ignore (run_configured t ac ~unsupported steps))
       | Some steps -> (try
           ignore (apply_configured_models ac.auuid steps);
           close_ac t;
           Editor_sink.focus_input ac.auuid
           with Unsupported_configured_input -> unsupported ()))
  | Switch kind ->
      invalidate_ac t;
      erase_trigger_text ac;
      (match kind with
       | Page_ref | Page_embed | Tag_search -> load_titles t
       | Template_search -> load_templates t
       | _ -> ());
      set_ac t
        (Some
           (refresh_items t
              { ac with kind; flip = None; flipx = None; query = ""; tlen = 0
              ; items = []; chosen = 0 }));
      measure_ac t kind
  | Embed_target target_id ->
      erase_trigger_text ac;
      close_ac t;
      Editor_embed.insert ~target_id ""
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

let chosen_scroll t chosen =
  let session = !(t.session) in
  ignore
    (Ui_services.timers_timeout
       (fun () ->
         if session = !(t.session)
            && (match (get t).ac with
                | Some ac -> ac.chosen = chosen
                | None -> false)
         then
         match Ui_services.dom_query "#ui__ac-inner" with
         | Some scroller -> (
             match
               Ui_services.dom_query ("#ac-" ^ string_of_int chosen)
             with
             | Some row ->
                 Ui_services.dom_scroll_row_into_view ~scroller ~row
             | None -> ())
         | None -> ())
       0)
;;

let move_chosen t dir =
  match (get t).ac with
  | Some ac ->
      let n = List.length ac.items in
      if n > 0 then (
        let chosen = (ac.chosen + dir + n) mod n in
        set_ac t (Some { ac with chosen });
        chosen_scroll t chosen)
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
  if ev.Ui_services.composing then false
  else match (get t).ac with
  | None -> false
  | Some ac when Option.fold ~none:false ~some:Edit_model.composing
      (Editor_actions.edit_model ac.auuid) -> false
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
        match Keymap_data.match_event ac_keys
            ~ids:["auto-complete/next"; "auto-complete/prev"; "auto-complete/complete";
              "auto-complete/meta-complete"; "auto-complete/shift-complete"] ev with
        | Keymap_data.Command "auto-complete/next" -> move_chosen t 1; true
        | Keymap_data.Command "auto-complete/prev" -> move_chosen t (-1); true
        (* cljs enter/meta-complete/shift-complete: apply the chosen
           item — mod+enter inlines a tag — or the kind's on-enter when
           no item matched. shift+enter shares enter: no AC supplies
           on-shift-chosen. Tab is NOT an ac binding on master
           (:editor/indent) — it falls through to the editor keymap *)
        | Keymap_data.Command command -> (
            let inline = command = "auto-complete/meta-complete" in
            (match List.nth_opt ac.items ac.chosen with
             | Some it -> apply_item t ac ~meta:inline it
             | None -> ac_on_enter t ac);
            true)
        | Keymap_data.Prefix -> true
        | Keymap_data.No_match when ev.Ui_services.key = Some "Escape" ->
            (* cljs: Escape only dismisses the popup — the block stays
               in edit mode (the editor's own Escape exits editing on
               the next press) *)
            close_ac t;
            true
        | _ ->
            (if ac_position_closed ac then close_ac t);
            false)
;;

let ac_mousemove t (el : Ui_services.el) =
  match el.Ui_services.attr "id" with
  | Some id
    when S.length id > 3 && S.sub id 0 3 = "ac-" -> (
      match int_of_string_opt (S.sub id 3 (S.length id - 3)) with
      | Some i -> set_chosen t i
      | None -> ())
  | _ -> ()
;;

(* ---- context menu ---- *)

let colors = [ "yellow"; "red"; "pink"; "green"; "blue"; "purple"; "gray" ]

(* color name -> hex; the LUI swatch row and the native spec share the
   table so both paint identical dots *)
let color_hex = function
  | "yellow" -> "#eab308"
  | "red" -> "#ef4444"
  | "pink" -> "#ec4899"
  | "green" -> "#22c55e"
  | "blue" -> "#3b82f6"
  | "purple" -> "#a855f7"
  | _ -> "#6b7280"

(* mirrors content.cljs block-context-menu-content. Shortcut caps match
   shortcut utils decorate-binding/print-shortcut-key output on macOS *)
let block_entries () =
  [ Ci_colors; Ci_headings; Ci_sep
  ; Ci_item (U.t "sidebar.right/open", Some ("shift+click", [ {js|⇧|js}; "Click" ]), "open-in-sidebar")
  ; Ci_item (U.t "block.comments/add-comment", None, "add-comment")
  ; Ci_sub (U.t "command.editor/add-reaction", Sub_picker Picker_emoji)
  ; Ci_sub (U.t "context-menu/set-icon", Sub_picker Picker_icon)
  ; Ci_sep
  ; Ci_item (U.t "block/copy-ref", None, "copy-ref")
  ; Ci_item (U.t "export/copy-or-export-as", None, "copy-export-as")
  ; Ci_item (U.t "editor/cut", Some ("meta+x", [ {js|⌘|js}; "X" ]), "cut")
  ; Ci_item (U.t "editor/delete-selection", Some ("delete", [ "Delete" ]), "delete")
  ; Ci_sep
  ; Ci_item (U.t "context-menu/make-a-flashcard", None, "make-flashcard")
  ; Ci_item (U.t "context-menu/toggle-number-list", None, "toggle-numbered-list")
  ; Ci_sep
  ; Ci_item (U.t "editor/expand-block-children", Some ("meta+down", [ {js|⌘|js}; {js|↓|js} ]), "expand-children")
  ; Ci_item (U.t "editor/collapse-block-children", Some ("meta+up", [ {js|⌘|js}; {js|↑|js} ]), "collapse-children")
  ]
  (* cljs block-context-menu-item simple commands append below *)
  @ (match
       Plugin_host.simple_commands_of_type "block-context-menu-item"
     with
     | [] -> []
     | cmds ->
         Ci_sep
         :: List.map
              (fun (pid, key, label) ->
                Ci_item
                  ( label
                  , None
                  , "plugin-ctx:" ^ pid ^ "/" ^ key ))
              cmds)
;;

(* mirrors content.cljs custom-context-menu-content (multi-select) *)
let multi_entries ?(allow_cut = true) ?(allow_delete = true) () =
  [ Ci_colors; Ci_headings
  ; Ci_sub (U.t "context-menu/set-icon", Sub_picker Picker_icon)
  ; Ci_sep
  ]
  @ (if allow_cut then
       [ Ci_item (U.t "editor/cut", Some ("meta+x", [ {js|⌘|js}; "X" ]), "cut") ]
     else [])
  @ (if allow_delete then
       [ Ci_item (U.t "editor/delete-selection", Some ("delete", [ "Delete" ]), "delete") ]
     else [])
  @ [ Ci_item (U.t "ui/copy", Some ("meta+c", [ {js|⌘|js}; "C" ]), "copy")
  ; Ci_item (U.t "export/copy-or-export-as", None, "copy-export-as")
  ; Ci_item (U.t "block/copy-ref", None, "copy-ref")  ; Ci_sep
  ; Ci_item (U.t "context-menu/make-a-flashcard", None, "make-flashcard")
  ; Ci_item (U.t "block.comments/add-comment", None, "add-comment")
  ; Ci_item (U.t "context-menu/toggle-number-list", None, "toggle-numbered-list")
  ; Ci_item (U.t "editor/cycle-todo", Some ("meta+enter", [ {js|⌘|js}; {js|↵|js} ]), "cycle-todo")
  ; Ci_sep
  ; Ci_item (U.t "editor/expand-block-children", Some ("meta+down", [ {js|⌘|js}; {js|↓|js} ]), "expand-children")
  ; Ci_item (U.t "editor/collapse-block-children", Some ("meta+up", [ {js|⌘|js}; {js|↑|js} ]), "collapse-children")
  ]
;;

(* text-edit context menu — right-click inside .block-editor with a live
   model selection. One menu on every host: web drops the inconsistent
   per-browser native menus, the native host gets the same edit
   commands *)
let edit_entries () =
  [ Ci_item (U.t "editor/cut", Some ("meta+x", [ {js|⌘|js}; "X" ]), "edit-cut")
  ; Ci_item (U.t "ui/copy", Some ("meta+c", [ {js|⌘|js}; "C" ]), "edit-copy")
  ; Ci_item (U.t "editor/paste", Some ("meta+v", [ {js|⌘|js}; "V" ]), "edit-paste")
  ; Ci_sep
  ; Ci_item (U.t "editor/select-all", Some ("meta+a", [ {js|⌘|js}; "A" ]), "edit-select-all") ]
;;

(* cljs state/developer-mode? — storage holds raw "true" (ours) or a
   JSON-quoted "\"true\"" (cljs storage) *)
let dev_mode () =
  match Ui_services.storage_get "developer-mode" with
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

(* cljs state/enable-flashcards? — the :feature/enable-flashcards?
   config flag (default on) gates the make-a-flashcard menu items *)
let flashcards_enabled () =
  Settings_state.config_bool "feature/enable-flashcards?" ~default:true

(* cljs base-ui auto-side: stay below while the space under the
   anchor exceeds 280px, flip above only when the top side wins by
   more than 100px; the flipped menu's top needs the measured popup
   height, applied after mount by flip_cm_if_pending *)
let anchor_above atop abot =
  let bh = Ui_services.dom_viewport_height () -. abot in
  bh <= 280. && atop -. bh > 100.

(* cm anchor: (center-x, top, bottom) of the event target element; a
   native host without hit-testing synthesizes a 1px rect at the
   pointer *)
let anchor_of_el (el : Ui_services.el) =
  let x, y, w, h = el.Ui_services.rect () in
  (x +. (w /. 2.), y, y +. h)

(* contextmenu anchoring: the native host stamps the hit node's live
   rect into the event's detail (tx/ty/tw/th) because element rect
   queries there are fire-and-poll; other hosts fall back to the
   event target's synchronous rect *)
let anchor_of_ev (ev : Ui_services.ev) (el : Ui_services.el) =
  let f s = Option.bind s float_of_string_opt in
  match
    ( f (ev.Ui_services.detail "tx")
    , f (ev.Ui_services.detail "ty")
    , f (ev.Ui_services.detail "tw")
    , f (ev.Ui_services.detail "th") )
  with
  | Some x, Some y, Some w, Some h -> (x +. (w /. 2.), y, y +. h)
  | _ -> anchor_of_el el

let anchor_at_point ~x ~y = (x, y, y)

let icon_of_cmd = function
  | "cut" | "edit-cut" -> "scissors"
  | "delete" -> "trash"
  | "copy" | "edit-copy" -> "copy"
  | "edit-paste" -> "clipboard"
  | "edit-select-all" -> "select-all"
  | "copy-ref" -> "link"
  | "copy-export-as" -> "export"
  | "open-in-sidebar" -> "layout-sidebar-right"
  | "add-comment" -> "message-circle-plus"
  | "make-flashcard" -> "cards"
  | "toggle-numbered-list" -> "list-numbers"
  | "cycle-todo" -> "checkbox"
  | "expand-children" -> "chevrons-down"
  | "collapse-children" -> "chevrons-up"
  | "dev/show-block-data" -> "database"
  | "dev/show-block-ast" -> "code"
  | _ -> ""

let open_cm ?allow_cut ?allow_delete t ~ax ~atop ~abot ~block_id ~multi =
  let entries =
    (* cljs adds Developer tools only to the single-block menu *)
    let base =
      if multi then multi_entries ?allow_cut ?allow_delete ()
      else block_entries () @ dev_entries ()
    in
    if flashcards_enabled () then base
    else
      List.filter
        (fun e ->
          match e with
          | Ci_item (_, _, action) -> action <> "make-flashcard"
          | _ -> true)
        base
  in
  close_ac t;
  let flip = anchor_above atop abot in
  let cm =
    { epoch = next_cm_epoch t
    ; cx = ax; cy = (if flip then atop else abot); atop; flip
    ; block_id; multi; entries; sub_open = -1; sub_xy = (0., 0.)
    ; highlighted = None; tag = None }
  in
  set_cm t (Some cm)
;;

let open_cm_edit t ~ax ~atop ~abot ~block_id =
  close_ac t;
  let flip = anchor_above atop abot in
  set_cm t (Some
    { epoch = next_cm_epoch t
    ; cx = ax; cy = (if flip then atop else abot); atop; flip
    ; block_id; multi = false; entries = edit_entries ()
    ; sub_open = -1; sub_xy = (0., 0.); tag = None
    ; highlighted = None })
;;

(* cljs block-tag popup (block.cljs): Go to #tag (mod+click) / Open in
   sidebar (shift+click) / Remove tag — the last hidden for private
   class idents *)
let tag_entries ~title ~priv =
  [ Ci_item
      ( "Go to #" ^ title
      , Some
          ( "mod+click"
          , [ (if Ui_services.env_is_mac () then {js|⌘|js} else "Ctrl")
            ; "Click" ] )
      , "go-to-tag" )
  ; Ci_item
      ( U.t "sidebar.right/open"
      , Some ("shift+click", [ {js|⇧|js}; "Click" ])
      , "open-tag-sidebar" ) ]
  @ if priv then []
    else [ Ci_item (U.t "block/remove-tag", None, "remove-tag") ]

let open_cm_tag t ~ax ~atop ~abot ~block_id ~tag_uuid ~tag_id ~tag_title
    ~priv =
  close_ac t;
  let flip = anchor_above atop abot in
  set_cm t (Some
    { epoch = next_cm_epoch t
    ; cx = ax; cy = (if flip then atop else abot); atop; flip
    ; block_id; multi = false
    ; entries = tag_entries ~title:tag_title ~priv
    ; sub_open = -1; sub_xy = (0., 0.)
    ; tag = Some (tag_uuid, tag_id, priv)
    ; highlighted = None })
;;

let open_cm_sub t ~index ~x ~y =
  match (get t).cm with
  | Some cm when cm.sub_open <> index ->
      set_cm t (Some { cm with sub_open = index; sub_xy = (x, y)
                            ; highlighted = Some (Main_item index) })
  | _ -> ()
;;

let close_cm_sub t =
  match (get t).cm with
  | Some cm when cm.sub_open <> -1 ->
      set_cm t (Some { cm with sub_open = -1
                            ; highlighted = Some (Main_item cm.sub_open) })
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
               Ui_services.nav_set_hash
                 (Runtime.nav_hash ("#/page/" ^ tuuid))
           | "open-tag-sidebar" ->
               Ui_services.dom_dispatch_json "ls:open-right-sidebar"
                 (Json.Object [ "uuid", Json.String tuuid ])
           | "remove-tag" ->
               ignore
                 (Outliner_ops.apply_and_refresh
                    [ Outliner_ops.op "delete-property-value"
                        [ Wire.Uuid cm.block_id
                        ; Wire.Keyword "block/tags"
                        ; Wire.Int tid ] ])
           | _ -> ())
       | None -> emit_cmd label [ "block", Json.String cm.block_id ]);
      close_cm t
  | None -> ()
;;

let run_cm_color t color =
  match (get t).cm with
  | Some cm ->
      emit_cmd "set-color"        [ "block", Json.String cm.block_id
        ; "value", Json.String color ];
      close_cm t
  | None -> ()
;;

let run_cm_heading t h =
  match (get t).cm with
  | Some cm ->
      emit_cmd "set-heading"        [ "block", Json.String cm.block_id
        ; "value", Json.String h ];
      close_cm t
  | None -> ()
;;
