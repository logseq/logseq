(* UI-facing logseq.api methods — navigation, editing mode, toasts,
   theme, selection. Side effects go through Actions or the documented
   cross-area CustomEvents. *)

open Promise_ext
open Sdk_util

let detail_obj pairs =
  let o = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set o k v) pairs;
  Js.Json.object_ o

let push_state a b _c _d =
  match arg_string a with
  | Some "page" -> (
      let name = Wire.map_get_string (Sdk_convert.wire_of_json b) "name" in
      match name with
      | Some n ->
          Runtime.mark_nav ();
          Platform.set_location_hash (Runtime.nav_hash ("#/page/" ^ n));
          Web_dom.dispatch_custom "ls:navigate"
            (detail_obj [ ("name", Js.Json.string n) ]);
          resolved_nil
      | None -> resolved_nil)
  | Some route ->
      Platform.set_location_hash (Runtime.nav_hash ("#/" ^ route));
      resolved_nil
  | None -> resolved_nil

let exit_editing_mode _a _b _c _d =
  Web_dom.dispatch_custom "ls:exit-editing" (detail_obj []);
  resolved_nil

let open_in_right_sidebar a _b _c _d =
  (match arg_string a with
   | Some uuid ->
       Web_dom.dispatch_custom "ls:open-right-sidebar"
         (detail_obj [ ("uuid", Js.Json.string uuid) ])
   | None -> ());
  resolved_nil

(* cljs -show_msg(content, status, opts) — opts {key, timeout}; returns
   the notification key (generated when opts.key is absent) so the plugin
   can later close_msg it *)
let show_msg a b c _d =
  let msg = Option.value ~default:"" (arg_string a) in
  let cls =
    match arg_string b with
    | Some s -> s
    | None -> "success"
  in
  let key =
    match
      Js.Json.decodeObject (Sdk_convert.json_of_wire (arg_wire c))
    with
    | Some o -> (
        match Js.Dict.get o "key" with
        | Some v -> Js.Json.decodeString v
        | None -> None)
    | None -> None
  in
  let key' = Option.value key ~default:(Platform.random_uuid ()) in
  Web_dom.dispatch_custom "ls:toast"
    (detail_obj
       [ ("msg", Js.Json.string msg)
       ; ("cls", Js.Json.string cls)
       ; ("key", Js.Json.string key')
       ]);
  resolved (Js.Json.string key')

let close_msg a _b _c _d =
  (match arg_string a with
   | Some key ->
       Web_dom.dispatch_custom "ls:toast-close"
         (detail_obj [ ("key", Js.Json.string key) ])
   | None -> ());
  resolved_nil

let set_theme_mode a _b _c _d =
  (match arg_string a with
   | Some mode ->
       Web_dom.doc_set_data "theme" mode;
       Platform.local_storage_set "ui/theme" ("\"" ^ mode ^ "\"")
   | None -> ());
  resolved_nil

(* app.setStateFromStore — the cljs impl assoc-in's the app-state atom and
   lets subscriptions apply side effects; here the ui/* keys apply their
   DOM/storage effects directly. *)
let set_state_from_store a b _c _d =
  let key =
    match arg_wire a with
    | Wire.String s -> s
    | w -> (
        match List.filter_map Wire.as_string (Wire.elems w) with
        | k :: _ -> k
        | [] -> "")
  in
  (match key with
   | "ui/radix-color" ->
       let color =
         match arg_string b with
         | Some s -> s
         | None -> "logseq"
       in
       Web_dom.doc_set_data "color" color;
       Platform.local_storage_set "radix-color" ("\"" ^ color ^ "\"")
   | "ui/system-theme?" ->
       let enabled =
         match arg_wire b with
         | Wire.Bool v -> v
         | _ -> false
       in
       Platform.local_storage_set "system-theme?"
         (if enabled then "true" else "false");
       if enabled then
         Web_dom.doc_set_data "theme"
           (if Web_dom.prefers_dark () then "dark" else "light")
   | _ -> ());
  resolved_nil

let get_selected_blocks _a _b _c _d =
  (* cljs state/get-selection-blocks reads the selection set, not the
     DOM — under virtualization the selected range outlives mounted
     rows, so .ls-block.selected would only see the windowed subset *)
  let uuids = Editor_actions.selected_uuids () in
  match uuids with
  | [] -> resolved (Js.Json.array [||])
  | _ ->
      let* entities =
        Js.Promise.all
          (Array.of_list (List.map get_entity uuids))
      in
      Js.Promise.resolve
        (Js.Json.array
           (Array.map Sdk_convert.json_of_wire entities))

(* cljs get-current-graph -> {url, name, path}; a db graph's "path" is
   its repo id — there is no filesystem dir on the web runtime *)
let get_current_graph _a _b _c _d =
  let r = repo () in
  if r = "" then resolved_nil
  else
    let name =
      match String.rindex_opt r '/' with
      | Some i ->
          String.sub r (i + 1) (String.length r - i - 1)
      | None -> r
    in
    resolved
      (detail_obj
         [ ("url", Js.Json.string r)
         ; ("name", Js.Json.string name)
         ; ("path", Js.Json.string r) ])

let get_current_graph_configs _a b c d = Sdk_config.get_configs _a b c d

let set_current_graph_configs a b c d = Sdk_config.set_configs a b c d

(* cljs push_state's {push:false} counterpart — replace-state swaps the
   hash without a history entry *)
let replace_state a b _c _d =
  match arg_string a with
  | Some "page" -> (
      let name = Wire.map_get_string (Sdk_convert.wire_of_json b) "name" in
      match name with
      | Some n ->
          Runtime.mark_nav ();
          Platform.replace_url_fragment (Runtime.nav_hash ("#/page/" ^ n));
          Web_dom.dispatch_custom "ls:navigate"
            (detail_obj [ ("name", Js.Json.string n) ]);
          resolved_nil
      | None -> resolved_nil)
  | Some route ->
      Platform.replace_url_fragment (Runtime.nav_hash ("#/" ^ route));
      resolved_nil
  | None -> resolved_nil

(* cljs get-current-route -> route-match dissoc :data *)
let get_current_route _a _b _c _d =
  match !(Runtime.current_route) with
  | Some (Model.Page name) ->
      resolved
        (detail_obj
           [ ("to", Js.Json.string "page")
           ; ( "pathParams"
             , detail_obj [ ("name", Js.Json.string name) ] )
           ])
  | Some Model.Home ->
      resolved (detail_obj [ ("to", Js.Json.string "home") ])
  | Some Model.Journals ->
      resolved (detail_obj [ ("to", Js.Json.string "all-journals") ])
  | Some Model.Library ->
      resolved (detail_obj [ ("to", Js.Json.string "library") ])
  | Some Model.All_pages ->
      resolved (detail_obj [ ("to", Js.Json.string "all-pages") ])
  | Some Model.All_graphs ->
      resolved (detail_obj [ ("to", Js.Json.string "all-graphs") ])
  | Some Model.Graph_view ->
      resolved (detail_obj [ ("to", Js.Json.string "graph") ])
  | Some Model.Import ->
      resolved (detail_obj [ ("to", Js.Json.string "import") ])
  | Some Model.Settings ->
      resolved (detail_obj [ ("to", Js.Json.string "settings") ])
  | Some (Model.Block_zoom uuid) ->
      resolved
        (detail_obj
           [ ("to", Js.Json.string "page")
           ; ( "queryParams"
             , detail_obj [ ("block-id", Js.Json.string uuid) ] )
           ])
  | Some (Model.Not_found _) ->
      resolved (detail_obj [ ("to", Js.Json.string "404") ])
  | None -> resolved_nil

(* cljs query_element_rect — getBoundingClientRect().toJSON() *)
let query_element_rect a _b _c _d =
  match arg_string a with
  | Some sel -> (
      match Web_dom.doc_query sel with
      | Some el ->
          let r = Web_dom.el_bounding_rect el in
          let f g = Js.Json.number (g r) in
          resolved
            (detail_obj
               [ ("x", f Web_dom.rect_left)
               ; ("y", f Web_dom.rect_top)
               ; ("width", f Web_dom.rect_width)
               ; ("height", f Web_dom.rect_height)
               ; ("top", f Web_dom.rect_top)
               ; ("right", f Web_dom.rect_right)
               ; ("bottom", f Web_dom.rect_bottom)
               ; ("left", f Web_dom.rect_left) ])
      | None -> resolved_nil)
  | None -> resolved_nil

(* cljs query_element_by_id -> "TAG#id" or false *)
let query_element_by_id a _b _c _d =
  match arg_string a with
  | Some id -> (
      match Web_dom.get_element_by_id id with
      | Some el ->
          resolved
            (Js.Json.string (Web_dom.el_tag el ^ "#" ^ id))
      | None -> resolved (Js.Json.boolean false))
  | None -> resolved (Js.Json.boolean false)

(* cljs check-editing -> editing block uuid string or false *)
let check_editing _a _b _c _d =
  resolved
    (match Editor_state.editing_uuid () with
     | Some u -> Js.Json.string u
     | None -> Js.Json.boolean false)

(* cljs get-editing-block-content *)
let get_editing_block_content _a _b _c _d =
  resolved
    (match Editor_state.editing_uuid () with
     | Some u -> Js.Json.string (Editor_actions.live_buffer u)
     | None -> Js.Json.null)

(* cljs get-editing-cursor-position — {pos} is the caret offset; the
   cljs rect comes from measuring the mounted textarea, which the sdk
   layer can't reach here *)
let get_editing_cursor_position _a _b _c _d =
  match Editor_state.editing_uuid () with
  | Some u ->
      resolved
        (detail_obj
           [ ("pos", Js.Json.number (float_of_int (Editor_actions.caret_of u))) ])
  | None -> resolved_nil

(* cljs insert-at-editing-cursor: splice text at the selection and
   schedule the save, keeping focus *)
let insert_at_editing_cursor a _b _c _d =
  match Editor_state.editing_uuid (), arg_string a with
  | Some uuid, Some text ->
      let lo, hi = Editor_actions.sel_span uuid in
      Editor_actions.splice_range uuid lo hi text;
      Outliner_ops.schedule_save uuid (Editor_actions.live_buffer uuid);
      Editor_actions.request_focus uuid (Editor_actions.caret_of uuid);
      resolved_nil
  | _ -> resolved_nil

(* cljs restore-editing-cursor: re-focus the editing surface at the
   current caret *)
let restore_editing_cursor _a _b _c _d =
  (match Editor_state.editing_uuid () with
   | Some u ->
       Editor_actions.request_focus u (Editor_actions.caret_of u)
   | None -> ());
  resolved_nil

(* cljs edit-block — uuid arg, {:pos} defaults to the end *)
let edit_block a b _c _d =
  match arg_string a with
  | Some u when not (Wire.is_uuid_string u) ->
      Js.Promise.reject (Failure "Invalid block uuid")
  | Some u -> (
      let* block = get_by_id (Wire.Uuid u) in
      match block_uuid_of block with
      | Some uuid ->
          let opts = arg_map b in
          let pos =
            match Wire.get opts "pos" with
            | Some (Wire.Int n) -> n
            | Some (Wire.Float f) -> int_of_float f
            | _ -> (
                match Wire.map_get_string block "block/title" with
                | Some t -> String.length t
                | None -> 0)
          in
          Editor_actions.enter_edit uuid pos;
          resolved_nil
      | None -> resolved_nil)
  | None -> resolved_nil

(* cljs select-block -> single selection of the uuid *)
let select_block a _b _c _d =
  match arg_string a with
  | Some u when not (Wire.is_uuid_string u) ->
      Js.Promise.reject (Failure "Invalid block uuid")
  | Some u -> (
      let* block = get_by_id (Wire.Uuid u) in
      match block_uuid_of block with
      | Some uuid ->
          Editor_actions.select_single uuid;
          resolved_nil
      | None -> resolved_nil)
  | None -> resolved_nil

let clear_selected_blocks _a _b _c _d =
  Editor_actions.clear_selection ();
  resolved_nil

(* cljs set-block-collapsed: flag = bool | "toggle" | {flag}; (boolean
   flag) makes any other truthy value collapse *)
let set_block_collapsed a b _c _d =
  let* block = get_entity_json a in
  match block_uuid_of block with
  | Some uuid ->
      let flag_arg = arg_wire b in
      let raw =
        match flag_arg with
        | Wire.Map _ -> Option.value ~default:Wire.Nil (Wire.get flag_arg "flag")
        | w -> w
      in
      let flag =
        match raw with
        | Wire.String "toggle" ->
            not (Editor_state.is_collapsed_in uuid)
        | Wire.Bool f -> f
        | Wire.Nil -> false
        | _ -> true
      in
      Editor_actions.set_collapsed uuid flag;
      resolved_nil
  | None -> resolved_nil

(* cljs save-focused-code-editor-content -> code-handler/save-code-editor!
   — the editing block's buffer commit *)
let save_focused_code_editor_content _a _b _c _d =
  (match Editor_state.editing_uuid () with
   | Some u -> Editor_actions.save_if_dirty u
   | None -> ());
  resolved_nil

(* cljs set-left/right-sidebar-visible: flag = bool | "toggle";
   (boolean flag) treats any other truthy value as true *)
let sidebar_flag a =
  match arg_wire a with
  | Wire.String "toggle" -> `Toggle
  | Wire.Bool b -> `Bool b
  | Wire.Nil -> `Bool false
  | _ -> `Bool true

let apply_sidebar_flag flag is_open toggle =
  match flag with
  | `Toggle -> toggle ()
  | `Bool v -> if v <> is_open then toggle ()

let set_left_sidebar_visible a _b _c _d =
  apply_sidebar_flag (sidebar_flag a)
    (Runtime.model ()).Model.left_sidebar_open
    (fun () -> Runtime.send Action.Toggle_left_sidebar);
  resolved_nil

let set_right_sidebar_visible a _b _c _d =
  apply_sidebar_flag (sidebar_flag a)
    (Runtime.model ()).Model.right_sidebar_open
    (fun () -> Runtime.send Action.Toggle_right_sidebar);
  resolved_nil

(* cljs clear-right-sidebar-blocks: clear always, close only with
   {close:true} — Sidebar_state.clear_items also closes, so clear the
   items directly *)
let clear_right_sidebar_blocks a _b _c _d =
  (match Sidebar_state.current () with
   | Some st -> Runtime.signal_set st.Sidebar_state.items []
   | None -> ());
  let close =
    match Wire.get (arg_map a) "close" with
    | Some (Wire.Bool v) -> v
    | _ -> false
  in
  if close && (Runtime.model ()).Model.right_sidebar_open then
    Runtime.send Action.Toggle_right_sidebar;
  resolved_nil

(* cljs open-external-link: http(s) only, via window.open *)
let open_external_link a _b _c _d =
  (match arg_string a with
   | Some url
     when String.length url > 8
          && (String.sub url 0 7 = "http://"
             || String.sub url 0 8 = "https://") ->
       Web_dom.win_open url
   | _ -> ());
  resolved_nil
