type collection_kind = [ `Vector | `Set | `Sequential ]
type 'value entity_id = [ `Not_entity | `Missing | `Id of 'value ]

type 'value capabilities = {
  entity_id : 'value -> 'value entity_id;
  map_entries : 'value -> ('value * 'value) Rrbvec.t option;
  collection : 'value -> (collection_kind * 'value Rrbvec.t) option;
  build_map : ('value * 'value) Rrbvec.t -> 'value;
  build_collection : collection_kind -> 'value Rrbvec.t -> 'value;
  integer : 'value -> bool;
  nil : 'value -> bool;
  value_text : 'value -> string;
}

type ('connection,
       'database,
       'transaction_data,
       'metadata,
       'report,
       'errors)
     sync_capabilities = {
  database : 'connection -> 'database;
  validation_input :
    'connection -> 'database -> 'metadata -> Transaction_policy.validation_input;
  with_tx : 'database -> 'transaction_data -> 'metadata -> 'report;
  apply_pipeline : 'report -> 'report;
  validate_parent : 'report -> bool;
  validate_report : 'report -> (unit, 'errors) result;
  same_database : 'database -> 'database -> bool;
  report_after : 'report -> 'database;
  report_has_datoms : 'report -> bool;
  compare_and_set : 'connection -> 'database -> 'database -> bool;
  store_after : 'connection -> 'report -> unit;
  run_callbacks : 'connection -> 'report -> unit;
  direct_transact : 'connection -> 'transaction_data -> 'metadata -> 'report;
  notify_invalid : 'report -> 'errors -> unit;
  invalid_error : 'metadata -> 'transaction_data -> 'errors -> 'report -> exn;
  parent_error : 'transaction_data -> exn;
  suppress_failure : 'metadata -> exn -> bool;
  log_failure : exn -> 'metadata -> 'transaction_data -> unit;
}

type ('connection,
       'database,
       'metadata,
       'report,
       'transaction_data,
       'collector,
       'result)
     temp_batch_capabilities = {
  database : 'connection -> 'database;
  create_temporary : 'database -> 'connection;
  create_collector : unit -> 'collector;
  listen : 'connection -> ('report -> unit) -> unit;
  unlisten : 'connection -> unit;
  append_report : 'collector -> 'report -> unit;
  notify_listener : 'report -> unit;
  invoke_batch : 'connection -> 'collector -> unit;
  before_commit : unit -> unit;
  collector_data : 'collector -> 'transaction_data;
  transaction_data_nonempty : 'transaction_data -> bool;
  commit : 'connection -> 'transaction_data -> 'metadata -> 'result;
  release_connection : 'connection -> unit;
  clear_collector : 'collector -> unit;
}

type ('connection, 'database, 'metadata, 'report, 'datom) batch_capabilities = {
  database : 'connection -> 'database;
  batch_active : 'connection -> bool;
  nested_error : 'metadata -> exn;
  listen : 'connection -> ('report -> unit) -> unit;
  unlisten : 'connection -> unit;
  report_data : 'report -> 'datom Rrbvec.t;
  notify_listener : 'report -> unit;
  begin_batch : 'connection -> unit;
  invoke_batch : 'connection -> unit;
  end_batch : 'connection -> unit;
  storage_exists : 'database -> bool;
  store : 'database -> unit;
  mark_database_stored : 'connection -> 'database -> unit;
  final_metadata : 'metadata -> 'metadata;
  make_report :
    'database -> 'database -> 'metadata -> 'datom Rrbvec.t -> 'report;
  run_callbacks : 'connection -> 'report -> unit;
  log_error : exn -> unit;
  reset_database : 'connection -> 'database -> unit;
}

type ('target,
       'connection,
       'transaction_data,
       'metadata,
       'result)
     transact_capabilities = {
  prepare : 'transaction_data -> bool -> 'transaction_data;
  transaction_nonempty : 'transaction_data -> bool;
  local_target : 'target -> 'connection option;
  expand_delete :
    'connection -> 'transaction_data -> 'metadata -> 'transaction_data;
  update_history :
    'connection -> 'transaction_data -> 'metadata -> 'transaction_data;
  concat_transaction :
    'transaction_data -> 'transaction_data -> 'transaction_data;
  batch_metadata : 'metadata -> 'metadata;
  external_transact :
    ('target -> 'transaction_data -> 'metadata -> 'result) option;
  local_transact : 'connection -> 'transaction_data -> 'metadata -> 'result;
  missing_target_error : 'target -> exn;
}

let rec replace_entities capabilities value =
  match capabilities.entity_id value with
  | `Id id -> id
  | `Missing -> invalid_arg "ldb/transact! doesn't support Entity without db/id"
  | `Not_entity -> (
      match capabilities.map_entries value with
      | Some entries ->
          entries
          |> Rrbvec.map (fun (key, item) ->
              ( replace_entities capabilities key,
                replace_entities capabilities item ))
          |> capabilities.build_map
      | None -> (
          match capabilities.collection value with
          | Some (kind, values) ->
              values
              |> Rrbvec.map (replace_entities capabilities)
              |> capabilities.build_collection kind
          | None -> value))

let filter_map capabilities predicate entries =
  entries
  |> Rrbvec.filter (fun (key, _value) ->
      predicate (capabilities.value_text key))

let clean_nested_refs capabilities entries =
  entries
  |> Rrbvec.map (fun (key, value) ->
      if capabilities.value_text key <> "block/refs" then (key, value)
      else
        match capabilities.collection value with
        | None -> (key, value)
        | Some (kind, refs) ->
            let refs =
              refs
              |> Rrbvec.map (fun reference ->
                  match capabilities.map_entries reference with
                  | None -> reference
                  | Some entries ->
                      filter_map capabilities
                        Transaction_policy.keep_temporary_attribute entries
                      |> capabilities.build_map)
            in
            (key, capabilities.build_collection kind refs))

let clean_top_map capabilities ~external_transact entries =
  entries
  |> filter_map capabilities (fun attribute ->
      Transaction_policy.keep_map_attribute ~external_transact attribute)
  |> Rrbvec.filter (fun (_key, value) -> not (capabilities.nil value))
  |> clean_nested_refs capabilities

let vector_attribute capabilities value =
  match capabilities.collection value with
  | Some (`Vector, values) when Rrbvec.length values > 2 -> (
      match (Rrbvec.nth_opt values 0, Rrbvec.nth_opt values 2) with
      | Some operation, Some attribute
        when Rrbvec.mem
               (capabilities.value_text operation)
               (Rrbvec.of_array [| "db/add"; "db/retract" |]) ->
          Some (capabilities.value_text attribute)
      | Some _, Some _ | Some _, None | None, Some _ | None, None -> None)
  | Some (`Vector, _) | Some (`Set, _) | Some (`Sequential, _) | None -> None

let map_ident capabilities entries =
  entries
  |> Rrbvec.find_opt (fun (key, _value) ->
      capabilities.value_text key = "db/ident")
  |> Option.map (fun (_key, value) -> capabilities.value_text value)

let prepare capabilities ~external_transact tx_data =
  tx_data
  |> Rrbvec.map (replace_entities capabilities)
  |> Rrbvec.filter_map (fun value ->
      match capabilities.map_entries value with
      | Some entries ->
          Some
            (clean_top_map capabilities ~external_transact entries
            |> capabilities.build_map)
      | None -> (
          match vector_attribute capabilities value with
          | Some attribute
            when not (Transaction_policy.keep_vector_attribute (Some attribute))
            ->
              None
          | Some _ | None -> Some value))
  |> Rrbvec.filter (fun value ->
      if capabilities.nil value || capabilities.integer value then false
      else
        match capabilities.map_entries value with
        | None -> true
        | Some entries ->
            Transaction_policy.keep_map ~empty:(Rrbvec.is_empty entries)
              ~db_ident:(map_ident capabilities entries))

let transact_sync (capabilities : (_, _, _, _, _, _) sync_capabilities)
    connection transaction_data metadata =
  let rec attempt () =
    let database = capabilities.database connection in
    if
      not
        (Transaction_policy.should_validate
           (capabilities.validation_input connection database metadata))
    then capabilities.direct_transact connection transaction_data metadata
    else
      let report =
        capabilities.with_tx database transaction_data metadata
        |> capabilities.apply_pipeline
      in
      if not (capabilities.validate_parent report) then
        raise (capabilities.parent_error transaction_data)
      else
        match capabilities.validate_report report with
        | Error errors ->
            if
              capabilities.same_database database
                (capabilities.database connection)
            then (
              capabilities.notify_invalid report errors;
              raise
                (capabilities.invalid_error metadata transaction_data errors
                   report))
            else attempt ()
        | Ok () ->
            if not (capabilities.report_has_datoms report) then report
            else
              let database_after = capabilities.report_after report in
              if capabilities.compare_and_set connection database database_after
              then (
                capabilities.store_after connection report;
                capabilities.run_callbacks connection report;
                report)
              else attempt ()
  in
  try attempt ()
  with error ->
    if not (capabilities.suppress_failure metadata error) then
      capabilities.log_failure error metadata transaction_data;
    raise error

let batch_with_temp
    (capabilities : (_, _, _, _, _, _, _) temp_batch_capabilities) connection
    metadata =
  let temporary =
    connection |> capabilities.database |> capabilities.create_temporary
  in
  let collector = capabilities.create_collector () in
  let cleanup () =
    capabilities.unlisten temporary;
    capabilities.release_connection temporary;
    capabilities.clear_collector collector
  in
  try
    let result =
      capabilities.listen temporary (fun report ->
          capabilities.append_report collector report;
          capabilities.notify_listener report);
      capabilities.invoke_batch temporary collector;
      capabilities.before_commit ();
      let transaction_data = capabilities.collector_data collector in
      if capabilities.transaction_data_nonempty transaction_data then
        Some (capabilities.commit connection transaction_data metadata)
      else None
    in
    cleanup ();
    result
  with error ->
    cleanup ();
    raise error

let batch_transact (capabilities : (_, _, _, _, _) batch_capabilities)
    connection metadata =
  let database_before = capabilities.database connection in
  let transaction_data = ref Rrbvec.empty in
  let cleanup () =
    capabilities.unlisten connection;
    capabilities.end_batch connection
  in
  try
    let result =
      (try
        if capabilities.batch_active connection then
          raise (capabilities.nested_error metadata);
        capabilities.listen connection (fun report ->
            transaction_data :=
              Rrbvec.append !transaction_data (capabilities.report_data report);
            capabilities.notify_listener report);
        capabilities.begin_batch connection;
        capabilities.invoke_batch connection;
        capabilities.end_batch connection;
        let database_after = capabilities.database connection in
        if capabilities.storage_exists database_after then (
          capabilities.store database_after;
          capabilities.mark_database_stored connection database_after);
        let report =
          capabilities.make_report database_before database_after
            (capabilities.final_metadata metadata)
            !transaction_data
        in
        capabilities.run_callbacks connection report;
        report
      with error ->
        capabilities.log_error error;
        capabilities.reset_database connection database_before;
        raise error)
    in
    cleanup ();
    result
  with error ->
    cleanup ();
    raise error

let transact (capabilities : (_, _, _, _, _) transact_capabilities) target
    transaction_data metadata =
  let external_transact = Option.is_some capabilities.external_transact in
  let transaction_data =
    capabilities.prepare transaction_data external_transact
  in
  let local_target = capabilities.local_target target in
  let transaction_data =
    match local_target with
    | None -> transaction_data
    | Some connection ->
        let expanded =
          capabilities.expand_delete connection transaction_data metadata
        in
        capabilities.concat_transaction expanded
          (capabilities.update_history connection expanded metadata)
  in
  if not (capabilities.transaction_nonempty transaction_data) then None
  else
    let metadata = capabilities.batch_metadata metadata in
    match (capabilities.external_transact, local_target) with
    | Some transact, _ -> Some (transact target transaction_data metadata)
    | None, Some connection ->
        Some (capabilities.local_transact connection transaction_data metadata)
    | None, None -> raise (capabilities.missing_target_error target)
