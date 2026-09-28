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
  ; ai_group : string option
  ; ai_info : string option
  ; ai_idx : int
  ; ai_hdr : string option (* group-name banner, only on group starts *)
  ; ai_act : item_action
  }

let mk_item ~key ~label ?group ?info act =
  { ai_key = key; ai_label = label; ai_group = group
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
  | Ci_item of string
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
  }

let make scheduler : t =
  { vs = Signal.state scheduler { ac = None; cm = None }
  ; gen = ref 0
  ; titles = ref []
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

let group_items grp entries =
  let g = Some (U.t grp) in
  List.map (fun (key, act) -> mk_item ~key ~label:(U.t key) ?group:g act) entries
;;

let slash_items () : ac_item list =
  let cmd label = Editor_cmd label in
  List.concat
    [ group_items "editor.slash/group-basic"
        [ "editor.slash/node-reference", Switch Page_ref
        ; "editor.slash/node-embed", Switch Page_ref ]
    ; group_items "editor.slash/group-format"
        [ "ui/link", Emit "[]()"
        ; "editor.slash/image-link", Emit "![]()"
        ; "editor.slash/underline", Emit "<ins></ins>"
        ; "editor.slash/code-block", Emit "```\n\n```"
        ; "class.built-in/quote-block", cmd "Quote"
        ; "editor.slash/math-block", Emit "$$\n\n$$" ]
    ; group_items "editor.slash/group-heading"
        ([ "editor.slash/normal-text", cmd "Normal text"
         ; "editor.slash/clear-heading", cmd "Clear heading" ]
        @ List.init 6 (fun i ->
            ( "h-" ^ string_of_int (i + 1)
            , cmd (U.tf "editor/heading" [ string_of_int (i + 1) ]) )))
    ; group_items "editor.slash/group-task-status"
        [ "property.status/backlog", cmd "Backlog"
        ; "property.status/todo", cmd "Todo"
        ; "property.status/doing", cmd "Doing"
        ; "property.status/in-review", cmd "In Review"
        ; "property.status/done", cmd "Done"
        ; "property.status/canceled", cmd "Canceled" ]
    ; group_items "editor.slash/group-task-date"
        [ "property.built-in/deadline", cmd "Deadline"
        ; "property.built-in/scheduled", cmd "Scheduled" ]
    ; group_items "editor.slash/group-priority"
        ([ "editor.slash/no-priority", cmd "No priority" ]
        @ List.map
            (fun lvl ->
              ( "p-" ^ lvl
              , cmd (U.tf "editor.slash/priority-label" [ U.t ("property.priority/" ^ lvl) ]) ))
            [ "low"; "medium"; "high"; "urgent" ])
    ; group_items "editor.slash/group-time-and-date"
        [ "date.nlp/tomorrow", Emit (journal_offset 1)
        ; "date.nlp/yesterday", Emit (journal_offset (-1))
        ; "date.nlp/today", Emit ("[[" ^ Dates.today () ^ "]]")
        ; "editor.slash/current-time", Emit (current_time ())
        ; "editor.slash/date-picker", cmd "Date picker" ]
    ; group_items "editor.slash/group-list-type"
        [ "editor.slash/number-list", cmd "Number list"
        ; "editor.slash/number-children", cmd "Number children" ]
    ; group_items "editor.slash/group-advanced"
        [ "block.comments/add-comment", cmd "Add comment"
        ; "property.built-in/query", Emit "{{query }}"
        ; "editor.slash/advanced-query", Emit "{{query }}"
        ; "editor.slash/query-function", Emit "{{function }}"
        ; "editor.slash/calculator", cmd "Calculator"
        ; "editor.slash/upload-asset", cmd "Upload an asset"
        ; "class.built-in/template", cmd "Template"
        ; "editor.slash/embed-html", Emit "```html\n\n```"
        ; "editor.slash/embed-video-url", Emit "{{video }}"
        ; "editor.slash/embed-youtube-timestamp", cmd "Embed YouTube timestamp"
        ; "editor.slash/embed-twitter-tweet", Emit "{{tweet }}"
        ; "command.editor/add-property", cmd "Add property" ]
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
  (match fs with [] -> [ slash_fallback ] | _ -> fs)
  |> with_headers (q = "")
;;

let page_items_for t kind q =
  let wrap title =
    match kind with
    | Tag_search -> mk_item ~key:("page:" ^ title) ~label:title (Tag_apply title)
    | _ ->
        mk_item ~key:("page:" ^ title) ~label:title (Emit ("[[" ^ title ^ "]]"))
  in
  let matched =
    take 20 (List.map wrap (List.filter (fun ti -> contains_ci ti q) !(t.titles)))
  in
  let exact = List.exists (fun ti -> S.equal ti q) !(t.titles) in
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
             | Some ({ kind = Page_ref | Tag_search; _ } as ac) ->
                 set_ac t (Some (refresh_items t ac))
             | _ -> ());
            Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("popups titles failed", e);
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
   | Page_ref | Tag_search -> load_titles t
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
          pos < 2 || (let p = S.get v (pos - 2) in p = ' ' || p = '\n')
        in
        if c = '/' then open_ac t Slash el
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
  Dom_ext.dispatch_custom "ls:editor-insert"
    (detail_obj
       [ "text", Js.Json.string text
       ; "from", Js.Json.number (float_of_int tpos)
       ; "to", Js.Json.number (float_of_int (Dom_ext.selection_start editor)) ]);
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
  match Editor_state.editing_uuid () with
  | None -> ()
  | Some buuid ->
      let repo_v = repo () in
      let save_and_tag dbid =
        (* emit already stripped "#q" from the buffer; persist the new
           buffer and the tag in one batch *)
        let v = Dom_ext.value ac.editor in
        ignore
          (Outliner_ops.apply_and_refresh
             [ Outliner_ops.save_block buuid v
             ; Outliner_ops.set_block_property buuid "block/tags"
                 (Wire.Int dbid)
             ])
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
                  match w with
                  | Wire.Map _ -> (
                      match Wire.map_get_int w "db/id" with
                      | None -> Js.Promise.resolve ()
                      | Some dbid ->
                          (match Wire.get w "db/ident" with
                           | Some _ ->
                               emit ac.editor ac.tpos "";
                               close_ac t;
                               save_and_tag dbid;
                               Js.Promise.resolve ()
                           | None ->
                               (* cljs tag-on-chosen-handler: a plain page
                                  chosen in the hashtag search is converted
                                  to a class, then attached via block/tags *)
                               emit ac.editor ac.tpos "";
                               close_ac t;
                               Runtime.invoke2
                                 "thread-api/convert-page-to-tag"
                                 (Wire.String repo_v) (Wire.Int dbid)
                               |> Js.Promise.then_ (fun _ ->
                                      save_and_tag dbid;
                                      Js.Promise.resolve ())))
                  | _ ->
                      create_and_tag ();
                      Js.Promise.resolve ()))

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

(* mirrors content.cljs block-context-menu-content *)
let block_entries () =
  [ Ci_colors; Ci_headings; Ci_sep
  ; Ci_item (U.t "sidebar.right/open")
  ; Ci_item (U.t "block.comments/add-comment")
  ; Ci_sub (U.t "command.editor/add-reaction")
  ; Ci_sub (U.t "context-menu/set-icon")
  ; Ci_sep
  ; Ci_item (U.t "block/copy-ref")
  ; Ci_item (U.t "export/copy-or-export-as")
  ; Ci_item (U.t "editor/cut")
  ; Ci_item (U.t "editor/delete-selection")
  ; Ci_sep
  ; Ci_item (U.t "context-menu/toggle-number-list")
  ; Ci_sep
  ; Ci_item (U.t "editor/expand-block-children")
  ; Ci_item (U.t "editor/collapse-block-children")
  ]
;;

(* mirrors content.cljs custom-context-menu-content (multi-select) *)
let multi_entries () =
  [ Ci_colors; Ci_headings
  ; Ci_sub (U.t "context-menu/set-icon")
  ; Ci_sep
  ; Ci_item (U.t "editor/cut")
  ; Ci_item (U.t "editor/delete-selection")
  ; Ci_item (U.t "ui/copy")
  ; Ci_item (U.t "export/copy-or-export-as")
  ; Ci_item (U.t "block/copy-ref")
  ; Ci_sep
  ; Ci_item (U.t "context-menu/toggle-number-list")
  ; Ci_item (U.t "editor/cycle-todo")
  ; Ci_sep
  ; Ci_item (U.t "editor/expand-block-children")
  ; Ci_item (U.t "editor/collapse-block-children")
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
      emit_cmd "Set block color"
        [ "block", Js.Json.string cm.block_id
        ; "value", Js.Json.string color ];
      close_cm t
  | None -> ()
;;

let run_cm_heading t h =
  match (get t).cm with
  | Some cm ->
      emit_cmd "Set heading"
        [ "block", Js.Json.string cm.block_id
        ; "value", Js.Json.string h ];
      close_cm t
  | None -> ()
;;
