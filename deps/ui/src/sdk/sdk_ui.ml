(* UI-facing logseq.api methods — navigation, editing mode, toasts,
   theme, selection. Side effects go through Actions or the documented
   cross-area CustomEvents. *)

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
          Platform.set_location_hash ("#/page/" ^ n);
          Platform.dispatch "ls:navigate"
            (detail_obj [ ("name", Js.Json.string n) ]);
          resolved_nil
      | None -> resolved_nil)
  | Some route ->
      Platform.set_location_hash ("#/" ^ route);
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

let show_msg a b _c _d =
  let msg = Option.value ~default:"" (arg_string a) in
  let cls =
    match arg_string b with
    | Some s -> s
    | None -> "success"
  in
  Platform.dispatch "ls:toast"
    (detail_obj
       [ ("msg", Js.Json.string msg); ("cls", Js.Json.string cls) ]);
  resolved_nil

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

let set_state_from_store _a _b _c _d = resolved_nil

let get_selected_blocks _a _b _c _d =
  let uuids = Platform.selected_block_uuids () in
  match uuids with
  | [] -> resolved (Sdk_convert.json_arr [||])
  | _ ->
      Js.Promise.all
        (Array.of_list (List.map get_entity uuids))
      |> Js.Promise.then_ (fun entities ->
             Js.Promise.resolve
               (Sdk_convert.json_arr
                  (Array.map Sdk_convert.json_of_wire entities)))

let get_current_graph _a _b _c _d =
  resolved (Js.Json.string (repo ()))

let graph_configs : Js.Json.t Js.Dict.t option ref = ref None

let get_current_graph_configs _a _b _c _d =
  match !graph_configs with
  | Some o -> resolved (Sdk_convert.json_obj o)
  | None -> resolved_nil

let set_current_graph_configs a _b _c _d =
  (match Js.Json.classify a with
   | Js.Json.JSONObject o -> graph_configs := Some o
   | _ -> ());
  resolved_nil
