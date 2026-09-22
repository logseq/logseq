(* logseq.common.config — only the parts the file-graph import pipeline uses. *)

open Datascript

let hidden (path : string) (patterns : string list) : bool =
  let path =
    if path <> "" && path.[0] = '/' then String.sub path 1 (String.length path - 1)
    else path
  in
  List.exists
    (fun pattern ->
      let pattern =
        if pattern <> "" && pattern.[0] <> '/' then "/" ^ pattern else pattern
      in
      Common_util.str_starts_with ("/" ^ path) pattern)
    patterns

(* remove-hidden-files — [files] are maps with a path entry; [get_path_fn]
   extracts it, mirroring the cljs arg *)
let remove_hidden_files (files : 'a list) (config : (attr * value) list)
    (get_path_fn : 'a -> string) : 'a list =
  match List.assoc_opt "hidden" config with
  | Some v ->
    let patterns =
      List.filter_map Clj_value.string_of_kwish (Clj_value.coll_items v)
    in
    if patterns = [] then files
    else List.filter (fun f -> not (hidden (get_path_fn f) patterns)) files
  | None -> files

let app_name = "logseq"
let asset_protocol = "assets://"
let db_version_prefix = "logseq_db_"
let file_version_prefix = "logseq_local_"
let local_assets_dir = "assets"
let unlinked_graphs_dir = "Unlinked graphs"
let favorites_page_name = "$$$favorites"
let views_page_name = "$$$views"
let library_page_name = "Library"
let quick_add_page_name = "Quick add"
let recycle_page_name = "Recycle"

let local_relative_asset_re =
  Regexp.compile ("^[./]*" ^ local_assets_dir)

let local_relative_asset (s : string) : bool =
  s <> ""
  && not (Common_util.str_includes s "://")
  && Regexp.test local_relative_asset_re s

let local_protocol_asset (s : string) : bool =
  Common_util.str_starts_with s asset_protocol

let protocol_path (s : string) : bool = Common_path.protocol_url s

let remove_asset_protocol (s : string) : string =
  if local_protocol_asset s then
    Common_util.str_replace_all s asset_protocol "file://"
  else s

let block_pattern = "-"

let unused_in_db_graphs_deprecation = "is not used in DB graphs"

(* file-only-config: deprecated config keys -> deprecation reason *)
let file_only_config : (string * string) list =
  let keys =
    [ "file/name-format"; "file-sync/ignore-files"; "hidden";
      "ignored-page-references-keywords"; "journal/file-name-format";
      "journal/page-title-format"; "journals-directory"; "logbook/settings";
      "org-mode/insert-file-link?"; "pages-directory"; "preferred-workflow";
      "property/separated-by-commas"; "property-pages/excludelist";
      "srs/learning-fraction"; "srs/initial-interval"; "whiteboards-directory";
      "feature/enable-whiteboards?" ]
  in
  List.map (fun k -> (k, unused_in_db_graphs_deprecation)) keys
  @ [ "preferred-format",
      "is not used in DB graphs as there is only markdown mode."
    ; "property-pages/enabled?",
      "is not used in DB graphs as all properties have pages"
    ; "block-hidden-properties",
      "is not used in DB graphs as hiding a property is done in its configuration"
    ; "feature/enable-block-timestamps?",
      "is not used in DB graphs as it is always enabled"
    ; "favorites", "is not stored in config for DB graphs"
    ; "default-templates",
      "is replaced by #Template and the `Apply template to tags` property" ]
