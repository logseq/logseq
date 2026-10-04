(* window.logseq api/sdk bridge install; missing args arrive as undefined. *)

type api_fn =
  Js.Json.t -> Js.Json.t -> Js.Json.t -> Js.Json.t
  -> Js.Json.t Js.Promise.t

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
  ]
  @ Plugin_host.api_methods

let sdk_ui_methods : (string * api_fn) list =
  [ "show_msg", (fun a b c d -> Sdk_ui.show_msg a b c d)
  ; "close_msg", (fun a b c d -> Sdk_ui.close_msg a b c d)
  ]

let dict_of methods =
  let d = Js.Dict.empty () in
  List.iter (fun (name, f) -> Js.Dict.set d name f) methods;
  d

let install () =
  let logseq = Js.Json.object_ (Js.Dict.empty ()) in
  Web_dom.js_set logseq "api" (dict_of api_methods);
  let sdk = Js.Json.object_ (Js.Dict.empty ()) in
  Web_dom.js_set sdk "ui" (dict_of sdk_ui_methods);
  Web_dom.js_set logseq "sdk" sdk;
  Worker_client.set_global "logseq" logseq;
  Plugin_host.setup ()
