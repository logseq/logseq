type validation_input = {
  db_based : bool;
  rtc_download : bool;
  reset_conn : bool;
  initial_db : bool;
  skip_meta : bool;
  skip_conn : bool;
  exporter_new_graph : bool;
}

type favorite = { uuid : string; title : string }

let ui_only_attributes =
  Rrbvec.of_array
    [|
      "block/children";
      "block/meta";
      "block/top?";
      "block/bottom?";
      "block/anchor";
      "block/level";
      "block/container";
      "db/other-tx";
      "block/unordered";
    |]

let has_prefix value prefix =
  let value_length = String.length value in
  let prefix_length = String.length prefix in
  value_length >= prefix_length && String.sub value 0 prefix_length = prefix

let keep_map_attribute ~external_transact attribute =
  let _ = external_transact in
  (not (has_prefix attribute "block.temp/"))
  && not
       (Rrbvec.exists
          (fun candidate -> candidate = attribute)
          ui_only_attributes)

let keep_temporary_attribute attribute =
  not (has_prefix attribute "block.temp/")

let keep_map ~empty ~db_ident =
  (not empty) && db_ident <> Some "block/path-refs"

let keep_vector_attribute = function
  | Some attribute -> not (has_prefix attribute "block.temp/")
  | None -> true

let should_validate input =
  input.db_based && (not input.rtc_download) && (not input.reset_conn)
  && (not input.initial_db) && (not input.skip_meta) && (not input.skip_conn)
  && not input.exporter_new_graph

let favorite uuid = { uuid; title = "" }
let favorite_uuid favorite = favorite.uuid
let favorite_title favorite = favorite.title
