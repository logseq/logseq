open Melange_db

type source_datom = { entity : int; attribute : string; value : string }
type validation_transaction = Add_attribute of int * string | Entity of int

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let () =
  Fest.test "DB SQLite export chooses stable page sort keys" (fun () ->
      expect_equal "title"
        (Sqlite_export.page_sort_key ~title:(Some "Page") ~journal:None
           ~uuid:"uuid")
        "Page";
      expect_equal "journal"
        (Sqlite_export.page_sort_key ~title:None ~journal:(Some 20260714)
           ~uuid:"uuid")
        "20260714";
      expect_equal "uuid"
        (Sqlite_export.page_sort_key ~title:None ~journal:None ~uuid:"uuid")
        "uuid");
  Fest.test "DB SQLite export owns UUID retention decisions" (fun () ->
      expect_equal "referenced"
        (Sqlite_export.keep_uuid ~referenced:true ~unique_attributes:false)
        true;
      expect_equal "attributes"
        (Sqlite_export.keep_uuid ~referenced:false ~unique_attributes:true)
        true;
      expect_equal "shrink"
        (Sqlite_export.keep_uuid ~referenced:false ~unique_attributes:false)
        false);
  Fest.test "DB SQLite export filters local datom metadata" (fun () ->
      expect_equal "kv"
        (Sqlite_export.excluded_kv "logseq.kv/graph-local-tx")
        true;
      expect_equal "normal kv"
        (Sqlite_export.excluded_kv "logseq.kv/user-config")
        false;
      expect_equal "attr" (Sqlite_export.excluded_attribute "block/tx-id") true;
      expect_equal "normal attr"
        (Sqlite_export.excluded_attribute "block/title")
        false;
      expect_equal "excluded entity"
        (Sqlite_export.exportable_datom ~excluded_entity:true
           ~attribute:"block/title")
        false;
      expect_equal "excluded attr"
        (Sqlite_export.exportable_datom ~excluded_entity:false
           ~attribute:"logseq.property.user/email")
        false;
      expect_equal "included"
        (Sqlite_export.exportable_datom ~excluded_entity:false
           ~attribute:"block/title")
        true);
  Fest.test "DB SQLite export normalizes comparison metadata" (fun () ->
      expect_equal "local uuid"
        (Sqlite_export.include_kv_in_diff "logseq.kv/local-graph-uuid")
        false;
      expect_equal "imported time"
        (Sqlite_export.include_kv_in_diff "logseq.kv/imported-at")
        false;
      expect_equal "config"
        (Sqlite_export.include_kv_in_diff "logseq.kv/user-config")
        true;
      expect_equal "filtered and sorted kvs"
        (Sqlite_export.prepare_diff_kvs ~ident:Fun.id
           (Rrbvec.of_array
              [|
                "logseq.kv/user-z";
                "logseq.kv/local-graph-uuid";
                "logseq.kv/user-a";
              |])
        |> Rrbvec.to_array)
        [| "logseq.kv/user-a"; "logseq.kv/user-z" |]);
  Fest.test "DB SQLite export patches legacy invalid user idents" (fun () ->
      expect_equal "legacy"
        (Sqlite_export.patch_legacy_user_ident ~initial_version:(Some "64.8")
           ~namespace_:"user.property" ~name:"2nd value")
        (Some "user.property/NUM-2ndvalue");
      expect_equal "missing version"
        (Sqlite_export.patch_legacy_user_ident ~initial_version:None
           ~namespace_:"user.class" ~name:"3rd")
        (Some "user.class/NUM-3rd");
      expect_equal "fixed schema"
        (Sqlite_export.patch_legacy_user_ident ~initial_version:(Some "64.9")
           ~namespace_:"user.property" ~name:"2nd")
        None;
      expect_equal "internal"
        (Sqlite_export.patch_legacy_user_ident ~initial_version:(Some "64.8")
           ~namespace_:"logseq.property" ~name:"2nd")
        None);
  Fest.test "DB SQLite export sorts pages stably" (fun () ->
      let pages =
        Rrbvec.of_list
          [
            ("uuid-page", None, None, "b");
            ("title-page", Some "Alpha", None, "z");
            ("journal-page", None, Some 20260715, "a");
            ("same-title-first", Some "Same", None, "2");
            ("same-title-second", Some "Same", None, "1");
          ]
      in
      expect_equal "pages"
        (Sqlite_export.sort_pages
           ~title:(fun (_, title, _, _) -> title)
           ~journal:(fun (_, _, journal, _) -> journal)
           ~uuid:(fun (_, _, _, uuid) -> uuid)
           pages
        |> Rrbvec.map (fun (name, _, _, _) -> name)
        |> Rrbvec.to_list)
        [
          "journal-page";
          "title-page";
          "same-title-first";
          "same-title-second";
          "uuid-page";
        ]);
  Fest.test "DB SQLite export concatenates import transaction groups" (fun () ->
      expect_equal "transaction data"
        (Sqlite_export.import_transaction_data
           ~init:(Rrbvec.of_list [ 1; 2 ])
           ~block_properties:(Rrbvec.of_list [ 3 ])
           ~misc:(Rrbvec.of_list [ 4; 5 ])
        |> Rrbvec.to_list)
        [ 1; 2; 3; 4; 5 ]);
  Fest.test "DB SQLite export owns graph datom filtering and lookup resolution"
    (fun () ->
      let source =
        [|
          { entity = 2; attribute = "block/title"; value = "Title" };
          { entity = 1; attribute = "block/refs"; value = "lookup:target" };
          { entity = 9; attribute = "block/title"; value = "Excluded" };
          { entity = 3; attribute = "block/tx-id"; value = "local" };
        |]
      in
      let capabilities :
          (unit, int, source_datom, string) Sqlite_export.datom_capabilities =
        {
          excluded_entity =
            (fun () ident ->
              if String.equal ident "logseq.kv/graph-uuid" then Some 9 else None);
          datoms = (fun () -> source);
          datom_entity = (fun datom -> datom.entity);
          datom_attribute = (fun datom -> datom.attribute);
          datom_value = (fun datom -> datom.value);
          attribute_name = Fun.id;
          lookup_ref = (fun value -> String.starts_with ~prefix:"lookup:" value);
          resolve_lookup =
            (fun () value ->
              if String.equal value "lookup:target" then Some "42" else None);
          equal_entity = Int.equal;
          entity_order = Fun.id;
        }
      in
      let result = Sqlite_export.graph_datoms capabilities () in
      expect_equal "datoms"
        (result |> Rrbvec.to_list
        |> List.map (fun (datom : (int, string) Sqlite_export.export_datom) ->
            (datom.entity, datom.attribute, datom.value)))
        [ (1, "block/refs", "42"); (2, "block/title", "Title") ]);
  Fest.test "DB SQLite export owns graph datom import ordering" (fun () ->
      let open Sqlite_export in
      let imported =
        Rrbvec.of_list
          [
            {
              import_entity = 10;
              import_attribute = "db/valueType";
              import_value = "db.type/ref";
            };
            {
              import_entity = 20;
              import_attribute = "block/uuid";
              import_value = "target";
            };
            {
              import_entity = 10;
              import_attribute = "db/ident";
              import_value = "block/ref";
            };
            {
              import_entity = 30;
              import_attribute = "block/ref";
              import_value = "lookup:block/uuid=target";
            };
            {
              import_entity = 1;
              import_attribute = "block/title";
              import_value = "Title";
            };
          ]
      in
      let capabilities : (unit, string) import_capabilities =
        {
          current_entity_ids = (fun () -> [| 4; 2; 4 |]);
          attribute_name = Fun.id;
          value_key = Fun.id;
          entity_value = Int.to_string;
          lookup_ref =
            (fun value ->
              if String.equal value "lookup:block/uuid=target" then
                Some ("block/uuid", "target")
              else None);
        }
      in
      expect_equal "transactions"
        (datom_import capabilities () imported |> Rrbvec.to_list)
        [
          Retract_entity 4;
          Retract_entity 2;
          Add (10, "db/valueType", "db.type/ref");
          Add (10, "db/ident", "block/ref");
          Add (20, "block/uuid", "target");
          Add (30, "block/ref", "20");
          Add (1, "block/title", "Title");
        ]);
  Fest.test "DB SQLite export validation retries after disallowed attributes"
    (fun () ->
      let open Sqlite_export in
      let validation_calls = ref 0 in
      let capabilities :
          (validation_transaction Rrbvec.t, int, validation_transaction)
          import_validation_capabilities =
        {
          dry_run = (fun _database transactions -> transactions);
          validate =
            (fun database ->
              incr validation_calls;
              if
                Rrbvec.exists
                  (function
                    | Add_attribute (_, "custom/value") -> true
                    | _ -> false)
                  database
              then
                Rrbvec.singleton
                  {
                    entity_id = Some 1;
                    groups =
                      Rrbvec.singleton
                        {
                          attribute = Some "custom/value";
                          messages = Rrbvec.singleton "disallowed key";
                        };
                  }
              else Rrbvec.empty);
          added_attribute =
            (function
            | Add_attribute (entity, attribute) -> Some (entity, attribute)
            | Entity _ -> None);
          equal_entity_id = Int.equal;
        }
      in
      let transactions =
        Rrbvec.of_array
          [| Entity 1; Add_attribute (1, "custom/value"); Entity 2 |]
      in
      match
        validate_import_transactions capabilities Rrbvec.empty transactions
      with
      | Valid_import { transactions; _ } ->
          expect_equal "retry count" !validation_calls 2;
          expect_equal "filtered transactions" (Rrbvec.to_array transactions)
            [| Entity 1; Entity 2 |]
      | Invalid_import _ -> failwith "expected valid import after retry");
  Fest.test "DB SQLite export validation preserves non-disallowed failures"
    (fun () ->
      let open Sqlite_export in
      let capabilities : (unit, int, validation_transaction) import_validation_capabilities =
        {
          dry_run = (fun database _transactions -> database);
          validate =
            (fun _database ->
              Rrbvec.singleton
                {
                  entity_id = Some 1;
                  groups =
                    Rrbvec.singleton
                      {
                        attribute = Some "block/title";
                        messages = Rrbvec.singleton "missing required key";
                      };
                });
          added_attribute = (fun _transaction -> None);
          equal_entity_id = Int.equal;
        }
      in
      match
        validate_import_transactions capabilities ()
          (Rrbvec.singleton (Entity 1))
      with
      | Valid_import _ -> failwith "expected validation failure"
      | Invalid_import { error_count } ->
          expect_equal "error count" error_count 1)
