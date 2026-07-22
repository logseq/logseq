let page_sort_key ~title ~journal ~uuid =
  match (title, journal) with
  | Some title, _ -> title
  | None, Some journal -> Int.to_string journal
  | None, None -> uuid

let keep_uuid ~referenced ~unique_attributes = referenced || unique_attributes

let excluded_kvs =
  Rrbvec.of_array
    [|
      "logseq.kv/local-graph-uuid";
      "logseq.kv/graph-uuid";
      "logseq.kv/graph-local-tx";
      "logseq.kv/remote-schema-version";
      "logseq.kv/graph-rtc-e2ee?";
      "logseq.kv/graph-remote?";
      "logseq.kv/import-type";
      "logseq.kv/imported-at";
      "logseq.kv/graph-backup-folder";
      "logseq.kv/graph-last-gc-at";
      "logseq.kv/graph-git-sha";
    |]

let excluded_kv value = Rrbvec.mem value excluded_kvs

let excluded_attribute = function
  | "block/tx-id" | "logseq.property.embedding/hnsw-label"
  | "logseq.property.embedding/hnsw-label-updated-at"
  | "logseq.property/created-by-ref" | "logseq.property.user/email"
  | "logseq.property.user/name" | "logseq.property.user/avatar" ->
      true
  | _ -> false

let exportable_datom ~excluded_entity ~attribute =
  (not excluded_entity) && not (excluded_attribute attribute)

let include_kv_in_diff = function
  | "logseq.kv/import-type" | "logseq.kv/imported-at"
  | "logseq.kv/local-graph-uuid" ->
      false
  | _ -> true

let prepare_diff_kvs ~ident values =
  let values =
    values
    |> Rrbvec.filter (fun value -> include_kv_in_diff (ident value))
    |> Rrbvec.to_array
  in
  Array.stable_sort
    (fun left right -> String.compare (ident left) (ident right))
    values;
  Rrbvec.of_array values

let patch_legacy_user_ident ~initial_version ~namespace_ ~name =
  let fixed_schema = Schema_version.make 64 (Some 8) in
  let requires_patch =
    match initial_version with
    | None -> true
    | Some version ->
        Schema_version.compare (Schema_version.parse version) fixed_schema <= 0
  in
  if
    (not requires_patch)
    || not (String.starts_with ~prefix:"user." namespace_)
  then None
  else
    let normalized = Db_ident.normalize_name_part name in
    if String.equal normalized name then None
    else Some (namespace_ ^ "/" ^ normalized)

let sort_pages ~title ~journal ~uuid pages =
  let pages = Rrbvec.to_array pages in
  Array.stable_sort
    (fun left right ->
      String.compare
        (page_sort_key ~title:(title left) ~journal:(journal left)
           ~uuid:(uuid left))
        (page_sort_key ~title:(title right) ~journal:(journal right)
           ~uuid:(uuid right)))
    pages;
  Rrbvec.of_array pages

let import_transaction_data ~init ~block_properties ~misc =
  Rrbvec.append (Rrbvec.append init block_properties) misc

type validation_error_group = {
  attribute : string option;
  messages : string Rrbvec.t;
}

type 'entity_id entity_validation_error = {
  entity_id : 'entity_id option;
  groups : validation_error_group Rrbvec.t;
}

type ('database, 'entity_id, 'transaction) import_validation_capabilities = {
  dry_run : 'database -> 'transaction Rrbvec.t -> 'database;
  validate : 'database -> 'entity_id entity_validation_error Rrbvec.t;
  added_attribute : 'transaction -> ('entity_id * string) option;
  equal_entity_id : 'entity_id -> 'entity_id -> bool;
}

type ('database, 'transaction) import_validation_result =
  | Valid_import of {
      database : 'database;
      transactions : 'transaction Rrbvec.t;
    }
  | Invalid_import of { error_count : int }

let disallowed_group group =
  (not (Rrbvec.is_empty group.messages))
  && Rrbvec.for_all (String.equal "disallowed key") group.messages

let all_disallowed_errors errors =
  (not (Rrbvec.is_empty errors))
  && Rrbvec.for_all
       (fun error ->
         (not (Rrbvec.is_empty error.groups))
         && Rrbvec.for_all disallowed_group error.groups)
       errors

let disallowed_attributes errors =
  Rrbvec.filter_map
    (fun error ->
      let attributes =
        Rrbvec.filter_map
          (fun group ->
            if disallowed_group group then group.attribute else None)
          error.groups
      in
      match error.entity_id with
      | Some entity_id when not (Rrbvec.is_empty attributes) ->
          Some (entity_id, attributes)
      | Some _ | None -> None)
    errors

let remove_disallowed_transactions capabilities entity_attributes transactions =
  Rrbvec.filter
    (fun transaction ->
      match capabilities.added_attribute transaction with
      | None -> true
      | Some (entity_id, attribute) -> (
          match
            Rrbvec.find_opt
              (fun (candidate, _attributes) ->
                capabilities.equal_entity_id candidate entity_id)
              entity_attributes
          with
          | None -> true
          | Some (_candidate, attributes) ->
              not (Rrbvec.mem attribute attributes)))
    transactions

let validate_import_transactions capabilities database transactions =
  let rec validate transactions =
    let database_after = capabilities.dry_run database transactions in
    let errors = capabilities.validate database_after in
    if Rrbvec.is_empty errors then Valid_import { database = database_after; transactions }
    else
      let entity_attributes = disallowed_attributes errors in
      let filtered =
        remove_disallowed_transactions capabilities entity_attributes transactions
      in
      if
        all_disallowed_errors errors
        && not (Rrbvec.is_empty entity_attributes)
        && Rrbvec.length filtered < Rrbvec.length transactions
      then validate filtered
      else Invalid_import { error_count = Rrbvec.length errors }
  in
  validate transactions

type ('entity, 'value) export_datom = {
  entity : 'entity;
  attribute : 'value;
  value : 'value;
}

type ('database, 'entity, 'datom, 'value) datom_capabilities = {
  excluded_entity : 'database -> string -> 'entity option;
  datoms : 'database -> 'datom array;
  datom_entity : 'datom -> 'entity;
  datom_attribute : 'datom -> 'value;
  datom_value : 'datom -> 'value;
  attribute_name : 'value -> string;
  lookup_ref : 'value -> bool;
  resolve_lookup : 'database -> 'value -> 'value option;
  equal_entity : 'entity -> 'entity -> bool;
  entity_order : 'entity -> int;
}

let graph_datoms capabilities database =
  let excluded_entities =
    excluded_kvs |> Rrbvec.filter_map (capabilities.excluded_entity database)
  in
  let excluded entity =
    Rrbvec.exists (capabilities.equal_entity entity) excluded_entities
  in
  let result =
    capabilities.datoms database
    |> Rrbvec.of_array
    |> Rrbvec.filter_map (fun datom ->
        let entity = capabilities.datom_entity datom in
        let attribute = capabilities.datom_attribute datom in
        if
          not
            (exportable_datom ~excluded_entity:(excluded entity)
               ~attribute:(capabilities.attribute_name attribute))
        then None
        else
          let value = capabilities.datom_value datom in
          let value =
            if not (capabilities.lookup_ref value) then value
            else
              capabilities.resolve_lookup database value
              |> Option.value ~default:value
          in
          Some { entity; attribute; value })
    |> Rrbvec.to_array
  in
  Array.stable_sort
    (fun left right ->
      Int.compare
        (capabilities.entity_order left.entity)
        (capabilities.entity_order right.entity))
    result;
  Rrbvec.of_array result

type 'value import_datom = {
  import_entity : int;
  import_attribute : 'value;
  import_value : 'value;
}

type 'value import_operation =
  | Retract_entity of int
  | Add of int * 'value * 'value

type ('database, 'value) import_capabilities = {
  current_entity_ids : 'database -> int array;
  attribute_name : 'value -> string;
  value_key : 'value -> string;
  entity_value : int -> 'value;
  lookup_ref : 'value -> ('value * 'value) option;
}

module Lookup_key = struct
  type t = string * string

  let equal (left_attribute, left_value) (right_attribute, right_value) =
    String.equal left_attribute right_attribute
    && String.equal left_value right_value

  let hash = Hashtbl.hash
end

module Lookup_table = Hashtbl.Make (Lookup_key)

let schema_attribute = function
  | "db/ident" | "db/cardinality" | "db/valueType" | "db/unique" | "db/index" ->
      true
  | _ -> false

let datom_import capabilities database datoms =
  let current_ids = Hashtbl.create 128 in
  let retractions =
    capabilities.current_entity_ids database
    |> Array.fold_left
         (fun operations entity ->
           if Hashtbl.mem current_ids entity then operations
           else (
             Hashtbl.add current_ids entity ();
             Rrbvec.push_back operations (Retract_entity entity)))
         Rrbvec.empty
  in
  let lookup_entities = Lookup_table.create (Rrbvec.length datoms) in
  Rrbvec.iter
    (fun datom ->
      Lookup_table.replace lookup_entities
        ( capabilities.attribute_name datom.import_attribute,
          capabilities.value_key datom.import_value )
        datom.import_entity)
    datoms;
  let resolved =
    Rrbvec.map
      (fun datom ->
        let import_value =
          match capabilities.lookup_ref datom.import_value with
          | None -> datom.import_value
          | Some (attribute, value) -> (
              match
                Lookup_table.find_opt lookup_entities
                  ( capabilities.attribute_name attribute,
                    capabilities.value_key value )
              with
              | None -> datom.import_value
              | Some entity -> capabilities.entity_value entity)
        in
        { datom with import_value })
      datoms
  in
  let ident_entities = Hashtbl.create 128 in
  let schema_entities = Hashtbl.create 128 in
  Rrbvec.iter
    (fun datom ->
      match capabilities.attribute_name datom.import_attribute with
      | "db/ident" -> Hashtbl.replace ident_entities datom.import_entity ()
      | attribute when schema_attribute attribute ->
          Hashtbl.replace schema_entities datom.import_entity ()
      | _ -> ())
    resolved;
  let schema_datom datom =
    Hashtbl.mem ident_entities datom.import_entity
    && Hashtbl.mem schema_entities datom.import_entity
    && schema_attribute (capabilities.attribute_name datom.import_attribute)
  in
  let ordered =
    Rrbvec.append
      (Rrbvec.filter schema_datom resolved)
      (Rrbvec.filter (fun datom -> not (schema_datom datom)) resolved)
  in
  Rrbvec.append retractions
    (Rrbvec.map
       (fun datom ->
         Add (datom.import_entity, datom.import_attribute, datom.import_value))
       ordered)
