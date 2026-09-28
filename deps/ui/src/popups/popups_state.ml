(* Autocomplete popups + block context menu state — mirrors
   src/main/frontend/components/editor.cljs (auto-complete) and
   src/main/frontend/components/content.cljs (custom context menu).

   Documented cross-area hooks dispatched on document:
   - "ls:editor-insert"  CustomEvent {text, from, to}
     replace buffer range [from,to) (the typed trigger text) with text.
   - "ls:editor-command" CustomEvent {command, block?, value?}
     editor-owned side effect (heading/status/priority/color/…).
   The editor area wires the listeners; see e2e-contract.md. *)

module S = String
module U = Ui_strings

type ac_kind = Slash | Page_ref | Block_ref | Tag_search

type item_action =
  | Emit of string (* ls:editor-insert {text} *)
  | Switch of ac_kind (* reopen as another autocomplete *)
  | Editor_cmd of string (* ls:editor-command {command} *)
  | Tag_apply of string (* existing entity — cljs tag-on-chosen-handler *)
  | Tag_create of string (* "New tag" row — always creates a class *)
  | Noop (* empty-state placeholder row; never applied *)

type ac_item =
  { ai_key : string
  ; ai_label : string
  ; ai_icon : string option (* tabler/tabler-ext icon name *)
  ; ai_group : string option
  ; ai_info : string option
  ; ai_idx : int
  ; ai_hdr : string option (* group-name banner, only on group starts *)
  ; ai_act : item_action
  }

let mk_item ~key ~label ?icon ?group ?info act =
  { ai_key = key; ai_label = label; ai_icon = icon; ai_group = group
  ; ai_info = info; ai_idx = -1; ai_hdr = None; ai_act = act }

let empty_key = "__ac_empty__"
let empty_item = mk_item ~key:empty_key ~label:"" Noop

type ac =
  { kind : ac_kind
  ; x : float
  ; y : float
  ; query : string
  ; tpos : int
  ; tlen : int
  ; items : ac_item list
  ; chosen : int
  ; editor : Dom_ext.element
  }

type cm_item =
  (* label, optional (binding, display caps) shortcut, command id —
     mirrors ui/dropdown-shortcut output; the id is what
     ls:editor-command carries *)
  | Ci_item of string * (string * string list) option * string
  | Ci_sub of string
  | Ci_sep
  | Ci_colors
  | Ci_headings

type cm =
  { cx : float
  ; cy : float
  ; block_id : string
  ; multi : bool
  ; entries : cm_item list
  }

type view =
  { ac : ac option
  ; cm : cm option
  }

type t =
  { vs : view Signal.state
  ; gen : int ref (* stale-response guard *)
  ; titles : string list ref
  ; tag_titles : (string * string option) list ref
    (* class/tag entities for the # popup: (title, tabler icon) *)
  }

let make scheduler : t =
  { vs = Signal.state scheduler { ac = None; cm = None }
  ; gen = ref 0
  ; titles = ref []
  ; tag_titles = ref []
  }

let get t = Signal.get t.vs.Signal.state_signal
let set t v = Runtime.signal_set t.vs v
let set_ac t ac = set t { (get t) with ac }
let set_cm t cm = set t { (get t) with cm }
let close_ac t = set_ac t None
let close_cm t = set_cm t None

let ac_class_of_kind = function
  | Slash -> "cp__commands-slash"
  | Page_ref | Tag_search -> "black"
  | Block_ref -> "ac-block-search"
;;

let trigger_len_of_kind = function
  | Slash | Tag_search -> 1
  | Page_ref | Block_ref -> 2

(* cljs data-editor-popup-ref values drive popup sizing in editor.css *)
let popup_ref_of_kind = function
  | Slash -> "commands"
  | Page_ref -> "page-search"
  | Block_ref -> "block-search"
  | Tag_search -> "page-search-hashtag"
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

(* (i18n key, icon, action) — icon names mirror commands.cljs :icon/*
   values verbatim (custom-pack names like pageRef stay camelCase) *)
let group_items grp entries =
  let g = Some (U.t grp) in
  List.map
    (fun (key, icon, act) ->
      mk_item ~key ~label:(U.t key) ~icon ?group:g act)
    entries
;;

let slash_items () : ac_item list =
  List.concat
    [ group_items "editor.slash/group-basic"
        [ "editor.slash/node-reference", "pageRef", Switch Page_ref
        ; "editor.slash/node-embed", "blockEmbed", Switch Page_ref ]
    ; group_items "editor.slash/group-format"
        [ "ui/link", "link", Emit "[]()"
        ; "editor.slash/image-link", "photoLink", Emit "![]()"
        ; "editor.slash/underline", "underline", Emit "<ins></ins>"
        ; "editor.slash/code-block", "code", Emit "```\n\n```"
        ; "class.built-in/quote-block", "quote", Editor_cmd "quote"
        ; "editor.slash/math-block", "math", Emit "$$\n\n$$" ]
    ; (let g = Some (U.t "editor.slash/group-heading") in
       [ mk_item ~key:"editor.slash/normal-text"
           ~label:(U.t "editor.slash/normal-text") ~icon:"text" ?group:g
           (Editor_cmd "heading-normal")
       ; mk_item ~key:"editor.slash/clear-heading"
           ~label:(U.t "editor.slash/clear-heading") ~icon:"heading-off"
           ?group:g (Editor_cmd "heading-clear") ]
       @ List.init 6 (fun i ->
           let l = string_of_int (i + 1) in
           mk_item ~key:("heading-" ^ l)
             ~label:(U.tf "editor/heading" [ l ]) ~icon:("h-" ^ l)
             ?group:g (Editor_cmd ("heading-" ^ l))))
    ; group_items "editor.slash/group-task-status"
        [ "property.status/backlog", "backlog", Editor_cmd "status-backlog"
        ; "property.status/todo", "todo", Editor_cmd "status-todo"
        ; "property.status/doing", "inProgress50", Editor_cmd "status-doing"
        ; "property.status/in-review", "inReview", Editor_cmd "status-in-review"
        ; "property.status/done", "done", Editor_cmd "status-done"
        ; "property.status/canceled", "cancelled", Editor_cmd "status-canceled" ]
    ; group_items "editor.slash/group-task-date"
        [ "property.built-in/deadline", "calendar-stats", Editor_cmd "deadline"
        ; "property.built-in/scheduled", "calendar-month", Editor_cmd "scheduled" ]
    ; (let g = Some (U.t "editor.slash/group-priority") in
       mk_item ~key:"editor.slash/no-priority"
         ~label:(U.t "editor.slash/no-priority") ~icon:"priorityLvlNone"
         ?group:g (Editor_cmd "priority-none")
       :: List.map
            (fun lvl ->
              mk_item ~key:("priority-" ^ lvl)
                ~label:
                  (U.tf "editor.slash/priority-label"
                     [ U.t ("property.priority/" ^ lvl) ])
                ~icon:("priorityLvl" ^ String.capitalize_ascii lvl)
                ?group:g (Editor_cmd ("priority-" ^ lvl)))
            [ "low"; "medium"; "high"; "urgent" ])
    ; group_items "editor.slash/group-time-and-date"
        [ "date.nlp/tomorrow", "tomorrow", Emit (journal_offset 1)
        ; "date.nlp/yesterday", "yesterday", Emit (journal_offset (-1))
        ; "date.nlp/today", "calendar", Emit ("[[" ^ Dates.today () ^ "]]")
        ; "editor.slash/current-time", "clock", Emit (current_time ())
        ; "editor.slash/date-picker", "calendar-dots", Editor_cmd "Date picker" ]
    ; group_items "editor.slash/group-list-type"
        [ "editor.slash/number-list", "numberedParents", Editor_cmd "Number list"
        ; "editor.slash/number-children", "numberedChildren", Editor_cmd "Number children" ]
    ; group_items "editor.slash/group-advanced"
        [ "block.comments/add-comment", "messageCircle", Editor_cmd "Add comment"
        ; "property.built-in/query", "query", Emit "{{query }}"
        ; "editor.slash/advanced-query", "query", Emit "{{query }}"
        ; "editor.slash/query-function", "queryCode", Emit "{{function }}"
        ; "editor.slash/calculator", "calculator", Editor_cmd "Calculator"
        ; "editor.slash/upload-asset", "upload", Editor_cmd "Upload an asset"
        ; "class.built-in/template", "template", Editor_cmd "Template"
        ; "editor.slash/embed-html", "htmlEmbed", Emit "```html\n\n```"
        ; "editor.slash/embed-video-url", "videoEmbed", Emit "{{video }}"
        ; "editor.slash/embed-youtube-timestamp", "videoEmbed", Editor_cmd "Embed YouTube timestamp"
        ; "editor.slash/embed-twitter-tweet", "xEmbed", Emit "{{tweet }}"
        ; "command.editor/add-property", "cube-plus", Editor_cmd "Add property" ]
    ]
;;

(* cljs editor.cljs keeps a fallback item for slash — literal there too *)
let slash_fallback =
  mk_item ~key:"no-matched" ~label:"No matched commands"
    (Editor_cmd "No matched commands")
;;

(* ---- filtering ---- *)

let contains_ci hay needle =
  let h = S.lowercase_ascii hay and n = S.lowercase_ascii needle in
  let hl = S.length h and nl = S.length n in
  if nl = 0 then true
  else if nl > hl then false
  else
    let rec loop i = i <= hl - nl && (S.sub h i nl = n || loop (i + 1)) in
    loop 0
;;

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

let filter_slash q items =
  let fs = List.filter (fun it -> contains_ci it.ai_label q) items in
  (* cljs only renders group headers when `filtered?` is false — i.e. when
     the filtered command list equals *initial-commands*. filter-commands
     always rebuilds the list, so headers effectively never show *)
  (match fs with [] -> [ slash_fallback ] | _ -> fs)
  |> with_headers false
;;

let page_items_for t kind q =
  let wrap title =
    match kind with
    | Tag_search -> mk_item ~key:("page:" ^ title) ~label:title (Tag_apply title)
    | _ ->
        mk_item ~key:("page:" ^ title) ~label:title (Emit ("[[" ^ title ^ "]]"))
  in
  let wrap_tag (title, icon) =
    mk_item ~key:("page:" ^ title) ~label:title ?icon (Tag_apply title)
  in
  let matched =
    match kind with
    | Tag_search ->
        take 20
          (List.map wrap_tag
             (List.filter
                (fun (ti, _) -> contains_ci ti q)
                !(t.tag_titles)))
    | _ ->
        take 20
          (List.map wrap
             (List.filter (fun ti -> contains_ci ti q) !(t.titles)))
  in
  let exact =
    match kind with
    | Tag_search ->
        List.exists (fun (ti, _) -> S.equal ti q) !(t.tag_titles)
    | _ -> List.exists (fun ti -> S.equal ti q) !(t.titles)
  in
  let items =
    if q <> "" && not exact then
      let label =
        (match kind with
         | Tag_search -> U.t "editor/new-tag"
         | _ -> U.t "editor/new-page")
        ^ " " ^ q
      in
      let act =
        match kind with
        | Tag_search -> Tag_create q
        | _ -> Emit ("[[" ^ q ^ "]]")
      in
      mk_item ~key:("new:" ^ q) ~label act :: matched
    else matched
  in
  renumber items
;;

(* ---- async loads ---- *)

let repo () = Option.value !(Runtime.current_repo) ~default:""

let refresh_items t ac =
  match ac.kind with
  | Slash -> { ac with items = filter_slash ac.query (slash_items ()) }
  | Page_ref | Tag_search -> { ac with items = page_items_for t ac.kind ac.query }
  | Block_ref -> ac (* filled asynchronously by run_block_search *)
;;

let block_item_of_row i w =
  let it = Cmdk_state.item_of_row w i in
  let uuid =
    match Wire.map_get_uuid w "block/uuid" with
    | Some u -> u
    | None -> Option.value (Cmdk_state.str_field w "block/uuid") ~default:""
  in
  mk_item ~key:it.Cmdk_state.ikey ~label:it.Cmdk_state.ititle
    ?info:it.Cmdk_state.header
    (Emit ("((" ^ uuid ^ "))"))
;;

let run_block_search t ac =
  incr t.gen;
  let gen = !(t.gen) in
  ignore
    (Runtime.invoke3 "thread-api/search-blocks"
       (Wire.String (repo ()))
       (Wire.String ac.query)
       (Cmdk_state.search_opts false 20)
     |> Js.Promise.then_ (fun w ->
            let rows =
              match w with
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

let load_titles t =
  ignore
    (Runtime.invoke1 "thread-api/get-all-page-titles"
       (Wire.String (repo ()))
     |> Js.Promise.then_ (fun w ->
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
             | Some ({ kind = Page_ref; _ } as ac) ->
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

let load_tag_titles t _editor =
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
    (Runtime.invoke2 "thread-api/get-all-classes"
       (Wire.String (repo ()))
       (wopts [ ("except-private-tags?", Wire.Bool true) ])
     |> Js.Promise.then_ (fun w ->
            let rows =
              match w with
              | Wire.Array xs | Wire.List xs -> xs
              | _ -> []
            in
            t.tag_titles := class_titles_of rows;
            if editing_block then
              Runtime.invoke2 "thread-api/get-all-classes"
                (Wire.String (repo ()))
                (wopts [ ("except-private-tags?", Wire.Bool false) ])
              |> Js.Promise.then_ (fun w2 ->
                     let rows2 =
                       match w2 with
                       | Wire.Array xs | Wire.List xs -> xs
                       | _ -> []
                     in
                     let page_class =
                       List.filter
                         (fun r ->
                           Cmdk_state.str_field r "db/ident"
                           = Some "logseq.class/Page")
                         rows2
                     in
                     t.tag_titles :=
                       !(t.tag_titles)
                       @ class_titles_of page_class;
                     Js.Promise.resolve ())
            else Js.Promise.resolve ())
     |> Js.Promise.then_ (fun () ->
            (match (get t).ac with
             | Some ({ kind = Tag_search; _ } as ac) ->
                 set_ac t (Some (refresh_items t ac))
             | _ -> ());
            Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("popups classes failed", e);
            Js.Promise.resolve ()))
;;

(* ---- open / update ---- *)

let open_ac t kind editor =
  let x, y = Dom_ext.caret_popup_pos editor in
  let tlen = trigger_len_of_kind kind in
  let ac =
    { kind; x; y; query = ""
    ; tpos = Dom_ext.selection_start editor - tlen
    ; tlen; items = []; chosen = 0; editor }
  in
  (match kind with
   | Page_ref -> load_titles t
   | Tag_search -> load_tag_titles t editor
   | Block_ref -> ()
   | Slash -> ());
  set_cm t None;
  set_ac t (Some (refresh_items t ac))
;;

let ac_update t ac q =
  let ac = { ac with query = q; chosen = 0 } in
  set_ac t (Some (refresh_items t ac));
  if ac.kind = Block_ref then run_block_search t ac
;;

let query_closed ac q =
  match ac.kind with
  | Page_ref -> S.contains q ']'
  | Block_ref -> S.contains q ')'
  | Slash | Tag_search -> S.contains q '\n'
;;

(* after an `input` event in a .editor-wrapper textarea *)
let on_editor_input t el =
  let pos = Dom_ext.selection_start el in
  match (get t).ac with
  | Some ac ->
      if pos < ac.tpos + ac.tlen then close_ac t
      else
        let v = Dom_ext.value el in
        let qend = pos - ac.tpos - ac.tlen in
        if ac.tpos + ac.tlen > S.length v || qend > S.length v then close_ac t
        else
          let q = S.sub v (ac.tpos + ac.tlen) qend in
          if query_closed ac q then close_ac t else ac_update t ac q
  | None ->
      let v = Dom_ext.value el in
      if pos < 1 || pos > S.length v then ()
      else
        let c = S.get v (pos - 1) in
        let two = pos >= 2 && S.get v (pos - 1) = S.get v (pos - 2) in
        let bounded =
          pos < 2
          || (let p = S.get v (pos - 2) in p = ' ' || p = '\n')
          || (pos >= 3 && S.get v (pos - 2) = ']' && S.get v (pos - 3) = ']')
        in
        if c = '/' && bounded then open_ac t Slash el
        else if c = '[' && two then open_ac t Page_ref el
        else if c = '(' && two then open_ac t Block_ref el
        else if c = '#' && bounded then open_ac t Tag_search el
        else ()
;;

(* ---- events ---- *)

let detail_obj pairs =
  let o = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set o k v) pairs;
  Js.Json.object_ o
;;

let emit editor tpos text =
  match Dom_ext.closest editor ".ls-page-title" with
  | Some _ ->
      (* the page-title editor isn't a block editor — splice the buffer
         directly instead of dispatching ls:editor-insert *)
      let v = Dom_ext.value editor in
      let n = String.length v in
      let f = Int.max 0 (Int.min tpos n) in
      let t_ = Int.max f (Int.min (Dom_ext.selection_start editor) n) in
      let nv = String.sub v 0 f ^ text ^ String.sub v t_ (n - t_) in
      let caret = f + String.length text in
      Dom_ext.set_value editor nv;
      Dom_ext.set_text_content editor nv;
      Dom_ext.set_selection_range editor caret caret;
      Dom_ext.focus editor
  | None ->
      Dom_ext.dispatch_custom "ls:editor-insert"
        (detail_obj
           [ "text", Js.Json.string text
           ; "from", Js.Json.number (float_of_int tpos)
           ; "to",
             Js.Json.number (float_of_int (Dom_ext.selection_start editor)) ]);
      (* cljs refocuses the editor input after a chosen item *)
      Dom_ext.focus editor
;;

let emit_cmd command extra =
  Dom_ext.dispatch_custom "ls:editor-command"
    (detail_obj (("command", Js.Json.string command) :: extra))
;;

(* cljs tag-on-chosen-handler: strip the "#query" fragment, then either
   keep "#title" inline (existing page) or attach the tag as a class via
   block/tags (existing class or a new "New tag" class). The "New tag"
   row always takes the class path even when a plain page exists. *)
let apply_tag t ac ~create title =
  (* the page-title textarea isn't registered as a block editor —
     resolve it to the current page entity instead *)
  let buuid_opt, title_edit =
    match Editor_state.editing_uuid () with
    | Some u -> (Some u, false)
    | None -> (
        match Dom_ext.closest ac.editor ".ls-page-title" with
        | Some _ -> (
            match !Runtime.current_page with
            | Some p -> (p.Model.page_uuid, true)
            | None -> (None, false))
        | None -> (None, false))
  in
  match buuid_opt with
  | None -> ()
  | Some buuid ->
      let repo_v = repo () in
      let save_and_tag dbid =
        (* emit already stripped "#q" from the buffer; persist the new
           buffer and the tag in one batch. For the page-title editor the
           stripped title is committed by the title's own rename path —
           save-block rejects page entities, so only the tag is sent. *)
        let ops =
          if title_edit then
            [ Outliner_ops.set_block_property buuid "block/tags"
                (Wire.Int dbid)
            ]
          else
            [ Outliner_ops.save_block buuid (Dom_ext.value ac.editor)
            ; Outliner_ops.set_block_property buuid "block/tags"
                (Wire.Int dbid)
            ]
        in
        ignore (Outliner_ops.apply_and_refresh ops)
      in
      let create_and_tag () =
        emit ac.editor ac.tpos "";
        close_ac t;
        ignore
          (Runtime.invoke3 "thread-api/apply-outliner-ops"
             (Wire.String repo_v)
             (Wire.Array [ Outliner_ops.create_class title ])
             (Wire.Map [])
           |> Js.Promise.then_ (fun _ ->
                  Runtime.invoke2 "thread-api/get-case-page"
                    (Wire.String repo_v) (Wire.String title))
           |> Js.Promise.then_ (fun e ->
                  (match Wire.map_get_int e "db/id" with
                   | Some dbid -> save_and_tag dbid
                   | None -> ());
                  Js.Promise.resolve ()))
      in
      if create then create_and_tag ()
      else
        ignore
          (Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo_v)
             (Wire.String title)
           |> Js.Promise.then_ (fun w ->
                  Js.Promise.resolve
                    (match Wire.get w "db/ident" with
                     | Some _ -> (
                         emit ac.editor ac.tpos "";
                         close_ac t;
                         match Wire.map_get_int w "db/id" with
                         | Some dbid -> save_and_tag dbid
                         | None -> ())
                     | None -> (
                         match w with
                         | Wire.Map _ ->
                             emit ac.editor ac.tpos ("#" ^ title);
                             close_ac t
                         | _ -> create_and_tag ()))))

let apply_item t ac it =
  match it.ai_act with
  | Switch kind ->
      (* keep tpos: the typed "/query" text is the range the eventual
         ls:editor-insert replaces (e.g. "/nod" -> "[[page]]") *)
      (match kind with
       | Page_ref | Tag_search -> load_titles t
       | _ -> ());
      set_ac t
        (Some
           (refresh_items t
              { ac with kind; query = ""; items = []; chosen = 0 }))
  | Emit text -> emit ac.editor ac.tpos text; close_ac t
  | Editor_cmd c -> emit_cmd c []; close_ac t
  | Tag_apply title -> apply_tag t ac ~create:false title
  | Tag_create title -> apply_tag t ac ~create:true title
  | Noop -> ()
;;

let chosen_scroll chosen =
  Dom_ext.set_timeout
    (fun () ->
      match Dom_ext.doc_query_selector "#ui__ac-inner" with
      | Some scroller -> (
          match Dom_ext.doc_query_selector ("#ac-" ^ string_of_int chosen) with
          | Some row -> Dom_ext.scroll_row_into_view ~scroller ~row
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
      Option.iter (fun it -> apply_item t ac it) (List.nth_opt ac.items i)
  | None -> ()
;;

let apply_chosen t =
  match (get t).ac with
  | Some ac -> apply_index t ac.chosen
  | None -> ()
;;

(* true if the keydown was consumed by the open popup *)
let ac_keydown t ev =
  if (get t).ac = None then false
  else
    match Dom_ext.key_ ev with
    | Some "ArrowDown" -> move_chosen t 1; true
    | Some "ArrowUp" -> move_chosen t (-1); true
    | Some ("Enter" | "Tab") -> apply_chosen t; true
    | Some "Escape" -> close_ac t; true
    | _ -> false
;;

let ac_mousemove t el =
  match Dom_ext.get_attribute el "id" with
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
  ; Ci_sub (U.t "command.editor/add-reaction")
  ; Ci_sub (U.t "context-menu/set-icon")
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
  ; Ci_sub (U.t "context-menu/set-icon")
  ; Ci_sep
  ; Ci_item (U.t "editor/cut", Some ("meta+x", [ "\u{2318}"; "X" ]), "cut")
  ; Ci_item (U.t "editor/delete-selection", Some ("delete", [ "Delete" ]), "delete")
  ; Ci_item (U.t "ui/copy", Some ("meta+c", [ "\u{2318}"; "C" ]), "copy")
  ; Ci_item (U.t "export/copy-or-export-as", None, "copy-export-as")
  ; Ci_item (U.t "block/copy-ref", None, "copy-ref")
  ; Ci_sep
  ; Ci_item (U.t "context-menu/toggle-number-list", None, "toggle-numbered-list")
  ; Ci_item (U.t "editor/cycle-todo", None, "cycle-todo")
  ; Ci_sep
  ; Ci_item (U.t "editor/expand-block-children", Some ("meta+down", [ "\u{2318}"; "\u{2193}" ]), "expand-children")
  ; Ci_item (U.t "editor/collapse-block-children", Some ("meta+up", [ "\u{2318}"; "\u{2191}" ]), "collapse-children")
  ]
;;

let open_cm t ~x ~y ~block_id ~multi =
  let entries = if multi then multi_entries () else block_entries () in
  close_ac t;
  set_cm t (Some { cx = x; cy = y; block_id; multi; entries })
;;

let run_cm_item t label =
  match (get t).cm with
  | Some cm ->
      emit_cmd label [ "block", Js.Json.string cm.block_id ];
      close_cm t
  | None -> ()
;;

let run_cm_color t color =
  match (get t).cm with
  | Some cm ->
      emit_cmd "set-color"
        [ "block", Js.Json.string cm.block_id
        ; "value", Js.Json.string color ];
      close_cm t
  | None -> ()
;;

let run_cm_heading t h =
  match (get t).cm with
  | Some cm ->
      emit_cmd "set-heading"
        [ "block", Js.Json.string cm.block_id
        ; "value", Js.Json.string h ];
      close_cm t
  | None -> ()
;;
