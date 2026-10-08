(* window.logseq api/sdk bridge install; missing args arrive as undefined. *)

type api_fn =
  Js.Json.t -> Js.Json.t -> Js.Json.t -> Js.Json.t
  -> Js.Json.t Js.Promise.t

(* cljs api.cljs invoke_external_command — "logseq.<cmd-id>" -> palette
   dispatch (Commands_data ids already carry the cljs form) *)
let invoke_external_command a _b _c _d =
  (match Sdk_util.arg_string a with
   | Some t ->
       let cid =
         if String.starts_with ~prefix:"logseq." t then
           String.sub t 7 (String.length t - 7)
         else t
       in
       Cmdk_state.dispatch_id (String.lowercase_ascii cid)
   | None -> ());
  Sdk_util.resolved_nil

(* cljs api.cljs show_themes — opens the plugins dialog on the themes
   category (plugins_view reads + clears the pending tab) *)
let show_themes _a _b _c _d =
  Plugin_host.pending_dialog_tab := Some "themes";
  ignore
    (Web_dom.dispatch_custom "ls:open-dialog"
       (Js.Json.object_
          (Js.Dict.fromList
             [ ("name", Js.Json.string "plugins") ])));
  Sdk_util.resolved_nil

let api_methods : (string * api_fn) list =
  [ "get_block", (fun a b c d -> Sdk_read.get_block a b c d)
  ; "get_page", (fun a b c d -> Sdk_read.get_page a b c d)
  ; "get_page_blocks_tree", (fun a b c d -> Sdk_read.get_page_blocks_tree a b c d)
  ; "get_current_page", (fun a b c d -> Sdk_read.get_current_page a b c d)
  ; "get_tag", (fun a b c d -> Sdk_read.get_tag a b c d)
  ; "get_tags_by_name", (fun a b c d -> Sdk_read.get_tags_by_name a b c d)
  ; "get_tag_objects", (fun a b c d -> Sdk_read.get_tag_objects a b c d)
  ; "get_all_tags", (fun a b c d -> Sdk_read.get_all_tags a b c d)
  ; "get_all_properties", (fun a b c d -> Sdk_read.get_all_properties a b c d)
  ; "get_property", (fun a b c d -> Sdk_read.get_property a b c d)
  ; "get_block_properties", (fun a b c d -> Sdk_read.get_block_properties a b c d)
  ; "get_page_properties", (fun a b c d -> Sdk_read.get_page_properties a b c d)
  ; "get_block_property", (fun a b c d -> Sdk_read.get_block_property a b c d)
  ; "insert_block", (fun a b c d -> Sdk_write.insert_block a b c d)
  ; "insert_batch_block", (fun a b c d -> Sdk_write.insert_batch_block a b c d)
  ; "append_block_in_page", (fun a b c d -> Sdk_write.append_block_in_page a b c d)
  ; "update_block", (fun a b c d -> Sdk_write.update_block a b c d)
  ; "remove_block", (fun a b c d -> Sdk_write.remove_block a b c d)
  ; "create_page", (fun a b c d -> Sdk_write.create_page a b c d)
  ; "create_journal_page", (fun a b c d -> Sdk_write.create_journal_page a b c d)
  ; "create_tag", (fun a b c d -> Sdk_write.create_tag a b c d)
  ; "delete_page", (fun a b c d -> Sdk_write.delete_page a b c d)
  ; "upsert_block_property", (fun a b c d -> Sdk_write.upsert_block_property a b c d)
  ; "remove_block_property", (fun a b c d -> Sdk_write.remove_block_property a b c d)
  ; "upsert_property", (fun a b c d -> Sdk_write.upsert_property a b c d)
  ; "remove_property", (fun a b c d -> Sdk_write.remove_property a b c d)
  ; "add_tag_extends", (fun a b c d -> Sdk_write.add_tag_extends a b c d)
  ; "set_property_node_tags", (fun a b c d -> Sdk_write.set_property_node_tags a b c d)
  ; "add_block_tag", (fun a b c d -> Sdk_write.add_block_tag a b c d)
  ; "add_tag_property", (fun a b c d -> Sdk_write.add_tag_property a b c d)
  ; "add_property_value_choices", (fun a b c d -> Sdk_write.add_property_value_choices a b c d)
  ; "upsert_nodes", (fun a b c d -> Sdk_write.upsert_nodes a b c d)
  ; "import_edn", (fun a b c d -> Sdk_write.import_edn a b c d)
  ; "get_today_page", (fun a b c d -> Sdk_read.get_today_page a b c d)
  ; "get_all_pages", (fun a b c d -> Sdk_read.get_all_pages a b c d)
  ; "get_current_block", (fun a b c d -> Sdk_read.get_current_block a b c d)
  ; "get_current_page_blocks_tree", (fun a b c d -> Sdk_read.get_current_page_blocks_tree a b c d)
  ; "get_previous_sibling_block", (fun a b c d -> Sdk_read.get_previous_sibling_block a b c d)
  ; "get_next_sibling_block", (fun a b c d -> Sdk_read.get_next_sibling_block a b c d)
  ; "get_page_linked_references", (fun a b c d -> Sdk_read.get_page_linked_references a b c d)
  ; "list_tags", (fun a b c d -> Sdk_read.list_tags a b c d)
  ; "list_properties", (fun a b c d -> Sdk_read.list_properties a b c d)
  ; "list_pages", (fun a b c d -> Sdk_read.list_pages a b c d)
  ; "get_page_data", (fun a b c d -> Sdk_read.get_page_data a b c d)
  ; "get_current_graph_favorites", (fun a b c d -> Sdk_read.get_current_graph_favorites a b c d)
  ; "get_current_graph_recent", (fun a b c d -> Sdk_read.get_current_graph_recent a b c d)
  ; "export_edn", (fun a b c d -> Sdk_read.export_edn a b c d)
  ; "get_file_content", (fun a b c d -> Sdk_read.get_file_content a b c d)
  ; "search", (fun a b c d -> Sdk_read.search a b c d)
  ; "custom_query", (fun a b c d -> Sdk_read.custom_query a b c d)
  ; "remove_tag_extends", (fun a b c d -> Sdk_write.remove_tag_extends a b c d)
  ; "remove_block_tag", (fun a b c d -> Sdk_write.remove_block_tag a b c d)
  ; "remove_tag_property", (fun a b c d -> Sdk_write.remove_tag_property a b c d)
  ; "set_block_icon", (fun a b c d -> Sdk_write.set_block_icon a b c d)
  ; "remove_block_icon", (fun a b c d -> Sdk_write.remove_block_icon a b c d)
  ; "prepend_block_in_page", (fun a b c d -> Sdk_write.prepend_block_in_page a b c d)
  ; "move_block", (fun a b c d -> Sdk_write.move_block a b c d)
  ; "rename_page", (fun a b c d -> Sdk_write.rename_page a b c d)
  ; "restore_page", (fun a b c d -> Sdk_write.restore_page a b c d)
  ; "delete_recycled_page_permanently", (fun a b c d -> Sdk_write.delete_recycled_page_permanently a b c d)
  ; "new_block_uuid", (fun a b c d -> Sdk_write.new_block_uuid a b c d)
  ; "force_save_graph", (fun a b c d -> Sdk_write.force_save_graph a b c d)
  ; "set_file_content", (fun a b c d -> Sdk_write.set_file_content a b c d)
  ; "download_graph_db", (fun a b c d -> Sdk_write.download_graph_db a b c d)
  ; "download_graph_pages", (fun a b c d -> Sdk_write.download_graph_pages a b c d)
  ; "replace_state", (fun a b c d -> Sdk_ui.replace_state a b c d)
  ; "get_current_route", (fun a b c d -> Sdk_ui.get_current_route a b c d)
  ; "query_element_rect", (fun a b c d -> Sdk_ui.query_element_rect a b c d)
  ; "query_element_by_id", (fun a b c d -> Sdk_ui.query_element_by_id a b c d)
  ; "check_editing", (fun a b c d -> Sdk_ui.check_editing a b c d)
  ; "get_editing_block_content", (fun a b c d -> Sdk_ui.get_editing_block_content a b c d)
  ; "get_editing_cursor_position", (fun a b c d -> Sdk_ui.get_editing_cursor_position a b c d)
  ; "insert_at_editing_cursor", (fun a b c d -> Sdk_ui.insert_at_editing_cursor a b c d)
  ; "restore_editing_cursor", (fun a b c d -> Sdk_ui.restore_editing_cursor a b c d)
  ; "edit_block", (fun a b c d -> Sdk_ui.edit_block a b c d)
  ; "select_block", (fun a b c d -> Sdk_ui.select_block a b c d)
  ; "clear_selected_blocks", (fun a b c d -> Sdk_ui.clear_selected_blocks a b c d)
  ; "set_block_collapsed", (fun a b c d -> Sdk_ui.set_block_collapsed a b c d)
  ; "save_focused_code_editor_content", (fun a b c d -> Sdk_ui.save_focused_code_editor_content a b c d)
  ; "set_left_sidebar_visible", (fun a b c d -> Sdk_ui.set_left_sidebar_visible a b c d)
  ; "set_right_sidebar_visible", (fun a b c d -> Sdk_ui.set_right_sidebar_visible a b c d)
  ; "clear_right_sidebar_blocks", (fun a b c d -> Sdk_ui.clear_right_sidebar_blocks a b c d)
  ; "open_external_link", (fun a b c d -> Sdk_ui.open_external_link a b c d)
  ; "push_state", (fun a b c d -> Sdk_ui.push_state a b c d)
  ; "exit_editing_mode", (fun a b c d -> Sdk_ui.exit_editing_mode a b c d)
  ; "open_in_right_sidebar", (fun a b c d -> Sdk_ui.open_in_right_sidebar a b c d)
  ; "show_msg", (fun a b c d -> Sdk_ui.show_msg a b c d)
  ; "set_theme_mode", (fun a b c d -> Sdk_ui.set_theme_mode a b c d)
  ; "set_state_from_store", (fun a b c d -> Sdk_ui.set_state_from_store a b c d)
  ; "get_selected_blocks", (fun a b c d -> Sdk_ui.get_selected_blocks a b c d)
  ; "get_current_graph", (fun a b c d -> Sdk_ui.get_current_graph a b c d)
  ; "get_current_graph_configs", (fun a b c d -> Sdk_ui.get_current_graph_configs a b c d)
  ; "set_current_graph_configs", (fun a b c d -> Sdk_ui.set_current_graph_configs a b c d)
  ; "datascript_query", (fun a b c d -> Sdk_read.datascript_query a b c d)
  ; "q", (fun a b c d -> Sdk_read.dsl_query a b c d)
  ; "invoke_external_command", invoke_external_command
  ; "show_themes", show_themes
  ]
  @ Plugin_host.api_methods

let sdk_ui_methods : (string * api_fn) list =
  [ "show_msg", (fun a b c d -> Sdk_ui.show_msg a b c d)
  ; "close_msg", (fun a b c d -> Sdk_ui.close_msg a b c d)
  ; "query_element_rect", (fun a b c d -> Sdk_ui.query_element_rect a b c d)
  ; "query_element_by_id", (fun a b c d -> Sdk_ui.query_element_by_id a b c d)
  ; "check_slot_valid", (fun a b c d -> Sdk_ui.check_slot_valid a b c d)
  ; "resolve_theme_css_props_vals",
    (fun a b c d -> Sdk_ui.resolve_theme_css_props_vals a b c d)
  ]

(* cljs sdk/*.cljs secondary namespaces — minimal objects so
   plugin callers find the method rather than aborting on missing *)
let pass_through a _b _c _d = Sdk_util.resolved a

let sdk_utils_methods : (string * api_fn) list =
  [ "normalize_keyword_for_json",
    (fun a _b _c _d ->
      (* camelCase the top-level map keys — cljs camel-snake-kebab *)
      (match Js.Json.decodeObject a with
       | Some o ->
           let out = Js.Dict.empty () in
           Array.iter
             (fun (k, v) ->
               Js.Dict.set out (String.map (fun c -> if c = '-' then '_' else c) k) v)
             (Js.Dict.entries o);
           Sdk_util.resolved (Js.Json.object_ out)
       | None -> Sdk_util.resolved a))
  ; "to_js", pass_through
  ; "to_clj", pass_through
  ; "to_keyword", pass_through
  ; "to_symbol", pass_through
  ; "jsx_to_clj", pass_through
  ; "remove_hidden_properties", pass_through
  ]

let sdk_assets_methods : (string * api_fn) list =
  [ "make_url",
    (fun a b c d -> Plugin_host.make_asset_url a b c d)
  ; "list_files_of_current_graph",
    (fun _a _b _c _d -> Sdk_util.resolved (Js.Json.array [||]))
  ; "built_in_open",
    (fun a b c d -> Plugin_host.open_pdf_viewer a b c d)
  ]

(* experiments register_* fns are recorded no-ops — LUI has no renderer
   dispatch sites yet, but the methods must exist *)
let sdk_experiments_methods : (string * api_fn) list =
  [ "cp_page_editor", (fun _a _b _c _d -> Sdk_util.resolved_nil)
  ; "register_fenced_code_renderer",
    (fun _a _b _c _d -> Sdk_util.resolved (Js.Json.boolean true))
  ; "register_route_renderer",
    (fun _a _b _c _d -> Sdk_util.resolved (Js.Json.boolean true))
  ; "register_daemon_renderer",
    (fun _a _b _c _d -> Sdk_util.resolved (Js.Json.boolean true))
  ; "register_hosted_renderer",
    (fun _a _b _c _d -> Sdk_util.resolved (Js.Json.boolean true))
  ; "register_block_properties_renderer",
    (fun _a _b _c _d -> Sdk_util.resolved (Js.Json.boolean true))
  ; "register_block_renderer",
    (fun _a _b _c _d -> Sdk_util.resolved (Js.Json.boolean true))
  ; "register_extensions_enhancer",
    (fun _a _b _c _d -> Sdk_util.resolved (Js.Json.boolean true))
  ]

let sdk_debug_methods : (string * api_fn) list =
  [ "log_app_state", (fun _a _b _c _d -> Sdk_util.resolved_nil)
  ; "sync_stop_upload", (fun _a _b _c _d -> Sdk_util.resolved_nil)
  ; "sync_resume_upload", (fun _a _b _c _d -> Sdk_util.resolved_nil)
  ; "sync_upload_stopped", (fun _a _b _c _d -> Sdk_util.resolved_nil)
  ]

let dict_of methods =
  let d = Js.Dict.empty () in
  List.iter (fun (name, f) -> Js.Dict.set d name f) methods;
  Sdk_convert.json_obj d

let jobj kv =
  let d = Js.Dict.fromList kv in
  Js.Json.object_ d

let install () =
  let logseq : Js.Json.t Js.Dict.t = Js.Dict.empty () in
  Js.Dict.set logseq "api" (dict_of api_methods);
  let sdk : Js.Json.t Js.Dict.t = Js.Dict.empty () in
  Js.Dict.set sdk "ui" (dict_of sdk_ui_methods);
  Js.Dict.set sdk "utils" (dict_of sdk_utils_methods);
  Js.Dict.set sdk "assets" (dict_of sdk_assets_methods);
  Js.Dict.set sdk "experiments" (dict_of sdk_experiments_methods);
  Js.Dict.set sdk "debug" (dict_of sdk_debug_methods);
  Js.Dict.set sdk "core"
    (jobj
       [ ("version", Js.Json.string "20230330")
       ]);
  Js.Dict.set logseq "sdk" (Sdk_convert.json_obj sdk);
  Worker_client.set_global "logseq" (Sdk_convert.json_obj logseq);
  if not (Platform.publishing ()) then Plugin_host.setup ()
