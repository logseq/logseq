let app_name = "logseq"
let asset_protocol = "assets://"
let db_version_prefix = "logseq_db_"
let file_version_prefix = "logseq_local_"
let default_graphs_dir = "~/logseq/graphs"
let local_assets_dir = "assets"
let unlinked_graphs_dir = "Unlinked graphs"
let favorites_page_name = "$$$favorites"
let views_page_name = "$$$views"
let library_page_name = "Library"
let quick_add_page_name = "Quick add"
let recycle_page_name = "Recycle"
let block_pattern = "-"
let unused_in_db_graphs_deprecation = "is not used in DB graphs"

let strip_leading_db_version_prefix value =
  if String.starts_with ~prefix:db_version_prefix value then
    String.sub value
      (String.length db_version_prefix)
      (String.length value - String.length db_version_prefix)
  else value

let rec strip_all_db_version_prefixes value =
  let stripped = strip_leading_db_version_prefix value in
  if String.equal stripped value then value
  else strip_all_db_version_prefixes stripped

let canonicalize_db_version_repo value =
  if String.equal value "" then None
  else Some (db_version_prefix ^ strip_all_db_version_prefixes value)

let local_relative_asset_re = Js.Re.fromString ("^[./]*" ^ local_assets_dir)

let is_local_relative_asset value =
  (not (Js.String.includes value ~search:"://"))
  && Option.is_some (Js.Re.exec ~str:value local_relative_asset_re)

let is_local_protocol_asset value =
  String.starts_with ~prefix:asset_protocol value

let is_protocol_path = Namespace.can_parse_url

let remove_asset_protocol value =
  if is_local_protocol_asset value then
    "file://"
    ^ String.sub value
        (String.length asset_protocol)
        (String.length value - String.length asset_protocol)
  else value

let text_formats =
  [|
    "json";
    "org";
    "md";
    "yml";
    "dat";
    "asciidoc";
    "rst";
    "txt";
    "markdown";
    "adoc";
    "html";
    "js";
    "ts";
    "edn";
    "clj";
    "ml";
    "rb";
    "ex";
    "erl";
    "java";
    "php";
    "c";
    "css";
    "tldr";
    "sh";
  |]
  |> Rrbvec.of_array

let image_formats =
  [| "gif"; "svg"; "jpeg"; "ico"; "png"; "jpg"; "bmp"; "webp"; "avif"; "cr2" |]
  |> Rrbvec.of_array

let vector_contains values expected =
  let rec loop index =
    index < Rrbvec.length values
    &&
    let value = Rrbvec.nth values index in
    String.equal value expected || loop (index + 1)
  in
  loop 0

let is_text_format value = vector_contains text_formats value
let is_image_format value = vector_contains image_formats value
let text_format_keys () = Rrbvec.to_array text_formats
let image_format_keys () = Rrbvec.to_array image_formats

let normalize_hidden_path path =
  if String.starts_with ~prefix:"/" path then
    String.sub path 1 (String.length path - 1)
  else path

let normalize_hidden_pattern pattern =
  if String.starts_with ~prefix:"/" pattern then pattern else "/" ^ pattern

let is_hidden path patterns =
  let normalized_path = "/" ^ normalize_hidden_path path in
  let patterns = Rrbvec.of_array patterns in
  let rec loop index =
    index < Rrbvec.length patterns
    &&
    let pattern = Rrbvec.nth patterns index |> normalize_hidden_pattern in
    String.starts_with ~prefix:pattern normalized_path || loop (index + 1)
  in
  loop 0

let common_file_only_config_keys =
  [|
    "file/name-format";
    "file-sync/ignore-files";
    "hidden";
    "ignored-page-references-keywords";
    "journal/file-name-format";
    "journal/page-title-format";
    "journals-directory";
    "logbook/settings";
    "org-mode/insert-file-link?";
    "pages-directory";
    "preferred-workflow";
    "property/separated-by-commas";
    "property-pages/excludelist";
    "srs/learning-fraction";
    "srs/initial-interval";
    "whiteboards-directory";
    "feature/enable-whiteboards?";
  |]
  |> Rrbvec.of_array

let special_file_only_config =
  [|
    ( "preferred-format",
      "is not used in DB graphs as there is only markdown mode." );
    ( "property-pages/enabled?",
      "is not used in DB graphs as all properties have pages" );
    ( "block-hidden-properties",
      "is not used in DB graphs as hiding a property is done in its \
       configuration" );
    ( "feature/enable-block-timestamps?",
      "is not used in DB graphs as it is always enabled" );
    ("favorites", "is not stored in config for DB graphs");
    ( "default-templates",
      "is replaced by #Template and the `Apply template to tags` property" );
  |]
  |> Rrbvec.of_array

let file_only_config_keys_vector =
  let result = ref common_file_only_config_keys in
  for index = 0 to Rrbvec.length special_file_only_config - 1 do
    let key, _ = Rrbvec.nth special_file_only_config index in
    result := Rrbvec.push_back !result key
  done;
  !result

let file_only_config_keys () = Rrbvec.to_array file_only_config_keys_vector

let file_only_config_description key =
  if vector_contains common_file_only_config_keys key then
    Some unused_in_db_graphs_deprecation
  else
    let rec loop index =
      if index >= Rrbvec.length special_file_only_config then None
      else
        let candidate, description =
          Rrbvec.nth special_file_only_config index
        in
        if String.equal candidate key then Some description else loop (index + 1)
    in
    loop 0
