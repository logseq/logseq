(* UI-facing logseq.api methods — navigation, editing mode, toasts,
   theme, selection. Side effects go through Actions or the documented
   cross-area CustomEvents. *)

open Promise_ext
open Sdk_util

let detail_obj pairs =
  let o = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set o k v) pairs;
  Sdk_convert.json_obj o

let push_state a b _c _d =
  match arg_string a with
  | Some "page" -> (
      let name = Wire.map_get_string (Sdk_convert.wire_of_json b) "name" in
      match name with
      | Some n ->
          Runtime.mark_nav ();
          Platform.set_location_hash (Runtime.nav_hash ("#/page/" ^ n));
          Platform.dispatch "ls:navigate"
            (detail_obj [ ("name", Js.Json.string n) ]);
          resolved_nil
      | None -> resolved_nil)
  | Some route ->
      Platform.set_location_hash (Runtime.nav_hash ("#/" ^ route));
      resolved_nil
  | None -> resolved_nil

let exit_editing_mode _a _b _c _d =
  Platform.dispatch "ls:exit-editing" (detail_obj []);
  resolved_nil

let open_in_right_sidebar a _b _c _d =
  (match arg_string a with
   | Some uuid ->
       Platform.dispatch "ls:open-right-sidebar"
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
  Platform.dispatch "ls:toast"
    (detail_obj
       [ ("msg", Js.Json.string msg)
       ; ("cls", Js.Json.string cls)
       ; ("key", Js.Json.string key')
       ]);
  resolved (Js.Json.string key')

let close_msg a _b _c _d =
  (match arg_string a with
   | Some key ->
       Platform.dispatch "ls:toast-close"
         (detail_obj [ ("key", Js.Json.string key) ])
   | None -> ());
  resolved_nil

let set_theme_mode a _b _c _d =
  (match arg_string a with
   | Some mode ->
       Platform.document_set_data "theme" mode;
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
       Platform.document_set_data "color" color;
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
         Platform.document_set_data "theme"
           (if Browser_ui.prefers_dark () then "dark" else "light")
   | _ -> ());
  resolved_nil

let get_selected_blocks _a _b _c _d =
  (* cljs state/get-selection-blocks reads the selection set, not the
     DOM — under virtualization the selected range outlives mounted
     rows, so .ls-block.selected would only see the windowed subset *)
  let uuids = Editor_actions.selected_uuids () in
  match uuids with
  | [] -> resolved (Sdk_convert.json_arr [||])
  | _ ->
      let* entities =
        Js.Promise.all
          (Array.of_list (List.map get_entity uuids))
      in
      Js.Promise.resolve
        (Sdk_convert.json_arr
           (Array.map Sdk_convert.json_of_wire entities))

let get_current_graph _a _b _c _d =
  resolved (Js.Json.string (repo ()))

let get_current_graph_configs _a b c d = Sdk_config.get_configs _a b c d

let set_current_graph_configs a b c d = Sdk_config.set_configs a b c d
