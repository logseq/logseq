open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

type tx_value =
  | Nil
  | Integer of int
  | Keyword of string
  | Text of string
  | Entity of int option
  | Map of (tx_value * tx_value) Rrbvec.t
  | Vector of tx_value Rrbvec.t
  | Sequence of tx_value Rrbvec.t

type fake_report = { after : int; datoms : int Rrbvec.t; valid : bool }

let () =
  Fest.test "DB transaction policy filters representation-only attributes"
    (fun () ->
      expect_equal "normal"
        (Transaction_policy.keep_map_attribute ~external_transact:false
           "block/title")
        true;
      expect_equal "UI state"
        (Transaction_policy.keep_map_attribute ~external_transact:false
           "block/children")
        false;
      expect_equal "temporary"
        (Transaction_policy.keep_map_attribute ~external_transact:true
           "block.temp/refs-count")
        false;
      expect_equal "load status with local transact"
        (Transaction_policy.keep_map_attribute ~external_transact:false
           "block.temp/load-status")
        false;
      expect_equal "load status with external transact"
        (Transaction_policy.keep_map_attribute ~external_transact:true
           "block.temp/load-status")
        false;
      expect_equal "nested UI state"
        (Transaction_policy.keep_temporary_attribute "block/children")
        true;
      expect_equal "nested temporary"
        (Transaction_policy.keep_temporary_attribute "block.temp/refs-count")
        false);
  Fest.test "DB transaction policy drops invalid top-level entries" (fun () ->
      expect_equal "normal map"
        (Transaction_policy.keep_map ~empty:false
           ~db_ident:(Some "user.class/Task"))
        true;
      expect_equal "path refs"
        (Transaction_policy.keep_map ~empty:false
           ~db_ident:(Some "block/path-refs"))
        false;
      expect_equal "empty"
        (Transaction_policy.keep_map ~empty:true ~db_ident:None)
        false;
      expect_equal "normal vector"
        (Transaction_policy.keep_vector_attribute (Some "block/title"))
        true;
      expect_equal "temporary vector"
        (Transaction_policy.keep_vector_attribute
           (Some "block.temp/load-status"))
        false;
      expect_equal "non-attribute vector"
        (Transaction_policy.keep_vector_attribute None)
        true);
  Fest.test "DB transaction policy selects validation" (fun () ->
      let base : Transaction_policy.validation_input =
        {
          db_based = true;
          rtc_download = false;
          reset_conn = false;
          initial_db = false;
          skip_meta = false;
          skip_conn = false;
          exporter_new_graph = false;
        }
      in
      expect_equal "validate" (Transaction_policy.should_validate base) true;
      expect_equal "file graph"
        (Transaction_policy.should_validate { base with db_based = false })
        false;
      expect_equal "download"
        (Transaction_policy.should_validate { base with rtc_download = true })
        false;
      expect_equal "conn skip"
        (Transaction_policy.should_validate { base with skip_conn = true })
        false);
  Fest.test "DB transaction policy constructs favorite values" (fun () ->
      let favorite =
        Transaction_policy.favorite "00000000-0000-0000-0000-000000000001"
      in
      expect_equal "uuid"
        (Transaction_policy.favorite_uuid favorite)
        "00000000-0000-0000-0000-000000000001";
      expect_equal "title" (Transaction_policy.favorite_title favorite) "");
  Fest.test "DB transaction workflow prepares nested transaction values"
    (fun () ->
      let capabilities : tx_value Transaction_workflow.capabilities =
        {
          entity_id =
            (function
            | Entity (Some id) -> `Id (Integer id)
            | Entity None -> `Missing
            | _ -> `Not_entity);
          map_entries = (function Map values -> Some values | _ -> None);
          collection =
            (function
            | Vector values -> Some (`Vector, values)
            | Sequence values -> Some (`Sequential, values)
            | _ -> None);
          build_map = (fun values -> Map values);
          build_collection =
            (fun kind values ->
              match kind with
              | `Vector -> Vector values
              | `Set -> assert false
              | `Sequential -> Sequence values);
          integer = (function Integer _ -> true | _ -> false);
          nil = (function Nil -> true | _ -> false);
          value_text =
            (function Keyword value | Text value -> value | _ -> "value");
        }
      in
      let map values = Map (Rrbvec.of_list values) in
      let tx_data =
        Rrbvec.of_list
          [
            map
              [
                (Keyword "block/title", Text "Title");
                (Keyword "block/children", Vector Rrbvec.empty);
                (Keyword "block.temp/cache", Text "drop");
                (Keyword "block/link", Entity (Some 9));
                ( Keyword "block/refs",
                  Sequence
                    (Rrbvec.singleton
                       (map
                          [
                            (Keyword "block/title", Text "Ref");
                            (Keyword "block.temp/cache", Text "drop");
                          ])) );
              ];
            Vector
              (Rrbvec.of_list
                 [
                   Keyword "db/add";
                   Integer 1;
                   Keyword "block.temp/cache";
                   Text "drop";
                 ]);
            Vector
              (Rrbvec.of_list
                 [
                   Keyword "db/add";
                   Integer 1;
                   Keyword "block/title";
                   Text "keep";
                 ]);
            map [ (Keyword "db/ident", Keyword "block/path-refs") ];
            Integer 7;
            Nil;
          ]
      in
      expect_equal "prepared"
        (Transaction_workflow.prepare capabilities ~external_transact:false
           tx_data)
        (Rrbvec.of_list
           [
             map
               [
                 (Keyword "block/title", Text "Title");
                 (Keyword "block/link", Integer 9);
                 ( Keyword "block/refs",
                   Sequence
                     (Rrbvec.singleton
                        (map [ (Keyword "block/title", Text "Ref") ])) );
               ];
             Vector
               (Rrbvec.of_list
                  [
                    Keyword "db/add";
                    Integer 1;
                    Keyword "block/title";
                    Text "keep";
                  ]);
           ]));
  Fest.test "DB transaction workflow retries and commits validated reports"
    (fun () ->
      let database = ref 1 in
      let calls = ref Rrbvec.empty in
      let record call = calls := Rrbvec.push_back !calls call in
      let attempts = ref 0 in
      let capabilities :
          ( unit,
            int,
            string,
            string,
            fake_report,
            string )
          Transaction_workflow.sync_capabilities =
        {
          database = (fun () -> !database);
          validation_input =
            (fun () _db _metadata ->
              {
                Transaction_policy.db_based = true;
                rtc_download = false;
                reset_conn = false;
                initial_db = false;
                skip_meta = false;
                skip_conn = false;
                exporter_new_graph = false;
              });
          with_tx =
            (fun db _tx_data _metadata ->
              incr attempts;
              record ("with:" ^ string_of_int db);
              {
                after = db + 1;
                datoms = Rrbvec.singleton db;
                valid = !attempts > 1;
              });
          apply_pipeline =
            (fun report ->
              record "pipeline";
              report);
          validate_parent =
            (fun report ->
              record "parent";
              report.after > 0);
          validate_report =
            (fun report ->
              record "validate";
              if report.valid then Ok ()
              else (
                database := 2;
                Error "invalid"));
          same_database = Int.equal;
          report_after = (fun report -> report.after);
          report_has_datoms =
            (fun report -> not (Rrbvec.is_empty report.datoms));
          compare_and_set =
            (fun () before after ->
              record "cas";
              if !database = before then (
                database := after;
                true)
              else false);
          store_after = (fun () _report -> record "store");
          run_callbacks = (fun () _report -> record "callbacks");
          direct_transact =
            (fun () _tx_data _metadata -> failwith "unexpected direct transact");
          notify_invalid = (fun _report _errors -> record "notify-invalid");
          invalid_error =
            (fun _metadata _tx_data _errors _report -> Failure "invalid");
          parent_error = (fun _tx_data -> Failure "parent");
          suppress_failure = (fun _metadata _error -> false);
          log_failure = (fun _error _metadata _tx_data -> record "failure");
        }
      in
      let report =
        Transaction_workflow.transact_sync capabilities () "tx" "metadata"
      in
      expect_equal "committed db" !database 3;
      expect_equal "report" report.after 3;
      expect_equal "attempt count" !attempts 2;
      expect_equal "call order" !calls
        (Rrbvec.of_list
           [
             "with:1";
             "pipeline";
             "parent";
             "validate";
             "with:2";
             "pipeline";
             "parent";
             "validate";
             "cas";
             "store";
             "callbacks";
           ]));
  Fest.test "DB transaction workflow commits temporary batches once" (fun () ->
      let calls = ref Rrbvec.empty in
      let record call = calls := Rrbvec.push_back !calls call in
      let collector = ref Rrbvec.empty in
      let capabilities :
          ( int,
            int,
            string,
            fake_report,
            int Rrbvec.t,
            int Rrbvec.t ref,
            string )
          Transaction_workflow.temp_batch_capabilities =
        {
          database = (fun _connection -> 7);
          create_temporary =
            (fun db ->
              record "create";
              db + 1);
          create_collector = (fun () -> collector);
          listen =
            (fun _connection listener ->
              record "listen";
              listener
                { after = 9; datoms = Rrbvec.of_list [ 1; 2 ]; valid = true });
          unlisten = (fun _connection -> record "unlisten");
          append_report =
            (fun collector report ->
              collector := Rrbvec.append !collector report.datoms);
          notify_listener = (fun _report -> record "notify");
          invoke_batch = (fun _connection _collector -> record "batch");
          before_commit = (fun () -> record "before");
          collector_data = (fun collector -> !collector);
          transaction_data_nonempty =
            (fun values -> not (Rrbvec.is_empty values));
          commit =
            (fun _connection values metadata ->
              record
                ("commit:"
                ^ string_of_int (Rrbvec.length values)
                ^ ":" ^ metadata);
              "committed");
          release_connection = (fun _connection -> record "release");
          clear_collector =
            (fun collector ->
              collector := Rrbvec.empty;
              record "clear");
        }
      in
      expect_equal "result"
        (Transaction_workflow.batch_with_temp capabilities 0 "meta")
        (Some "committed");
      expect_equal "temporary batch call order" !calls
        (Rrbvec.of_list
           [
             "create";
             "listen";
             "notify";
             "batch";
             "before";
             "commit:2:meta";
             "unlisten";
             "release";
             "clear";
           ]));
  Fest.test "DB transaction workflow persists one final batch report" (fun () ->
      let database = ref 3 in
      let calls = ref Rrbvec.empty in
      let record call = calls := Rrbvec.push_back !calls call in
      let capabilities :
          ( unit,
            int,
            string,
            fake_report,
            int )
          Transaction_workflow.batch_capabilities =
        {
          database = (fun () -> !database);
          batch_active = (fun () -> false);
          nested_error = (fun _metadata -> Failure "nested");
          listen =
            (fun () listener ->
              record "listen";
              listener
                { after = 4; datoms = Rrbvec.of_list [ 4; 5 ]; valid = true });
          unlisten = (fun () -> record "unlisten");
          report_data = (fun report -> report.datoms);
          notify_listener = (fun _report -> record "notify");
          begin_batch = (fun () -> record "begin");
          invoke_batch =
            (fun () ->
              database := 4;
              record "batch");
          end_batch = (fun () -> record "end");
          storage_exists = (fun _database -> true);
          store = (fun _database -> record "store");
          mark_database_stored = (fun () _database -> record "mark-stored");
          final_metadata = (fun metadata -> metadata ^ ":final");
          make_report =
            (fun _before after _metadata datoms ->
              { after; datoms; valid = true });
          run_callbacks = (fun () _report -> record "callbacks");
          log_error = (fun _error -> record "error");
          reset_database =
            (fun () value ->
              database := value;
              record "reset");
        }
      in
      let report = Transaction_workflow.batch_transact capabilities () "meta" in
      expect_equal "database" !database 4;
      expect_equal "final report datoms" report.datoms (Rrbvec.of_list [ 4; 5 ]);
      expect_equal "persistent batch call order" !calls
        (Rrbvec.of_list
           [
             "listen";
             "notify";
             "begin";
             "batch";
             "end";
             "store";
             "mark-stored";
             "callbacks";
             "unlisten";
             "end";
           ]));
  Fest.test "DB transaction workflow owns preparation and dispatch" (fun () ->
      let calls = ref Rrbvec.empty in
      let record call = calls := Rrbvec.push_back !calls call in
      let capabilities :
          ( string,
            int,
            string Rrbvec.t,
            string,
            string )
          Transaction_workflow.transact_capabilities =
        {
          prepare =
            (fun values external_transact ->
              record ("prepare:" ^ string_of_bool external_transact);
              values);
          transaction_nonempty = (fun values -> not (Rrbvec.is_empty values));
          local_target =
            (fun target -> if target = "local" then Some 1 else None);
          expand_delete =
            (fun _connection values _metadata ->
              record "expand";
              Rrbvec.push_back values "expanded");
          update_history =
            (fun _connection _values _metadata ->
              record "history";
              Rrbvec.singleton "history");
          concat_transaction = Rrbvec.append;
          batch_metadata =
            (fun metadata ->
              record "metadata";
              metadata ^ ":batch");
          external_transact =
            Some
              (fun _target values metadata ->
                record
                  ("external:"
                  ^ string_of_int (Rrbvec.length values)
                  ^ ":" ^ metadata);
                "external-result");
          local_transact =
            (fun _connection _values _metadata -> failwith "unexpected local");
          missing_target_error = (fun _target -> Failure "missing target");
        }
      in
      expect_equal "dispatch result"
        (Transaction_workflow.transact capabilities "local"
           (Rrbvec.singleton "tx") "meta")
        (Some "external-result");
      expect_equal "dispatch order" !calls
        (Rrbvec.of_list
           [
             "prepare:true";
             "expand";
             "history";
             "metadata";
             "external:3:meta:batch";
           ]))
