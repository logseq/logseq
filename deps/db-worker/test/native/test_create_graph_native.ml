(* OCaml port of deps/db/test/logseq/db/sqlite/create_graph_test.cljs —
   covers the seed tx produced by Sqlite_create_graph.initial_tx_data.

   Self-contained: carries its own copy of the static schema EDN (cljs
   db-schema/schema, the same one cljs db-test/create-conn uses) because
   test helpers can't be shared across dune executables.

   cljs `validate-local-db!` maps to `Db_validate.validate_local_db`
   (returns grouped errors; empty = valid) and `sqlite-build/create-blocks`
   to `Sqlite_build.create_blocks`.

   cljs-vs-OCaml divergences asserted where observable:
   - Ldb.property_value_content only reads String values, so the cljs
     `(= 1 (property-value-content recur-frequency-default))` is asserted
     as `(= (Int64 1L) (:logseq.property/value ...))` directly. *)

open Datascript

let failures = ref 0

let check (name : string) (ok : bool) =
  if ok then ()
  else begin
    incr failures;
    Printf.eprintf "FAIL: %s\n" name
  end

(* cljs db-schema/schema — the static graph schema. *)
let schema_edn =
  "{:db/ident {:db/unique :db.unique/identity}
    :kv/value {}
    :block/uuid {:db/unique :db.unique/identity}
    :block/parent {:db/valueType :db.type/ref :db/index true}
    :block/order {:db/index true}
    :block/collapsed? {}
    :block/page {:db/valueType :db.type/ref :db/index true}
    :block/refs {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :block/tags {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :block/link {:db/valueType :db.type/ref :db/index true}
    :block/alias {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many :db/index true}
    :block/created-at {:db/index true}
    :block/updated-at {:db/index true}
    :block/name {:db/index true}
    :block/title {:db/index true}
    :block/journal-day {:db/index true}
    :block/tx-id {}
    :block/closed-value-property {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
    :file/path {:db/unique :db.unique/identity}
    :file/content {}
    :file/created-at {}
    :file/last-modified-at {}
    :file/size {}}"

let schema () = Datascript.schema_of_edn_string schema_edn

(* cljs (db-test/create-conn) for sqlite tests — a fresh conn seeded with
   build-db-initial-data. *)
let create_conn () : conn =
  let conn = Datascript.create_conn ~schema:(schema ()) () in
  ignore
    (Datascript.transact_conn conn
       (Sqlite_create_graph.initial_tx_data ~db:(Datascript.db conn)
          ~config_content:"" ())
       ~tx_meta:[ "initial-db?", Bool true ]);
  conn

(* cljs [:find [?b ...] :where [?b :db/ident]] *)
let ident_entities (db : db) : entity list =
  List.of_seq (datoms db Aevt ~a:"db/ident" ())
  |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)

(* cljs [:find ... :where [?b :block/tags <tag-ident>]] *)
let tag_eid (db : db) (tag_ident : string) : entity_id option =
  entid db "db/ident" (Keyword tag_ident)

let entities_tagged (db : db) (tag_ident : string) : entity list =
  match tag_eid db tag_ident with
  | None -> []
  | Some eid ->
    List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Ref eid) ())
    |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)

let namespace (ident : string) : string =
  match String.index_opt ident '/' with
  | Some p -> String.sub ident 0 p
  | None -> ""

let ident_name (ident : string) : string =
  match String.rindex_opt ident '/' with
  | Some p -> String.sub ident (p + 1) (String.length ident - p - 1)
  | None -> ident

let starts_with s prefix =
  String.length s >= String.length prefix
  && String.sub s 0 (String.length prefix) = prefix

(* cljs string/includes? *)
let contains_sub s sub =
  let n = String.length sub in
  let rec go i =
    if i + n > String.length s then false
    else if String.sub s i n = sub then true
    else go (i + 1)
  in
  n = 0 || go 0

(* cljs string/replace (name %) #"\.[^.]+$" "" *)
let drop_last_segment (name : string) : string =
  match String.rindex_opt name '.' with
  | Some p -> String.sub name 0 p
  | None -> name

(* ---------- (deftest new-graph-db-idents) ---------- *)

let () =
  let conn = create_conn () in
  let db = Datascript.db conn in
  let ident_ents = ident_entities db in
  let default_idents = List.filter_map Ldb.ident_of ident_ents in
  check "new-graph-db-idents: > 45 default idents"
    (List.length default_idents > 45);
  check "new-graph-db-idents: all :db/ident's have namespaces"
    (List.for_all (fun i -> namespace i <> "") default_idents);
  check
    "new-graph-db-idents: all non-db-attribute namespaces start with logseq"
    (List.for_all
       (fun i ->
         List.mem i Db_schema.db_attribute_properties
         || starts_with (namespace i) "logseq")
       default_idents);
  let cv_idents =
    List.filter (fun i -> String.contains (ident_name i) '.') default_idents
  in
  check "new-graph-db-idents: property names with '.' are closed values"
    (List.for_all
       (fun i ->
         match Datascript.entity db (Ident i) with
         | Some e -> Ldb.closed_value e
         | None -> false)
       cv_idents);
  let cv_properties =
    List.sort_uniq compare
      (List.map
         (fun i -> namespace i ^ "/" ^ drop_last_segment (ident_name i))
         cv_idents)
    |> List.filter (fun p -> p <> "logseq.property/color")
  in
  check "new-graph-db-idents: closed values' prefixes are property idents"
    (List.for_all (fun p -> List.mem p default_idents) cv_properties)

(* ---------- (deftest new-graph-marks-built-ins) ---------- *)

let () =
  let conn = create_conn () in
  let db = Datascript.db conn in
  let ident_ents = ident_entities db in
  (* only kv's and empty property value aren't marked because
     they aren't user facing *)
  let user_idents =
    List.filter
      (fun e ->
        match Ldb.ident_of e with
        | Some i ->
          namespace i <> "logseq.kv"
          && i <> "logseq.property/empty-placeholder"
        | None -> false)
      ident_ents
  in
  check "new-graph-marks-built-ins: ident entities are built-in"
    (List.for_all Ldb.built_in user_idents);
  let pages = entities_tagged db "logseq.class/Page" in
  check "new-graph-marks-built-ins: default internal pages are built-in"
    (List.for_all Ldb.built_in pages)

(* ---------- (deftest new-graph-creates-class) ---------- *)

let () =
  let conn = create_conn () in
  let db = Datascript.db conn in
  match Datascript.entity db (Ident "logseq.class/Task") with
  | None -> check "new-graph-creates-class: Task exists" false
  | Some task ->
    check "new-graph-creates-class: Task class has correct type"
      (Ldb.is_class task);
    let props = Ldb.ref_ents task "logseq.property.class/properties" in
    check "new-graph-creates-class: 4 task properties" (List.length props = 4);
    check "new-graph-creates-class: task properties are properties"
      (List.for_all Ldb.is_property props)

(* ---------- (deftest new-graph-initializes-default-classes-correctly) ---------- *)

let () =
  let conn = create_conn () in
  let db = Datascript.db conn in
  let class_idents =
    List.sort compare
      (List.map (fun (c : Builtin_data.builtin_class) -> c.c_ident)
         Builtin_data.built_in_classes)
  in
  let tagged =
    List.sort compare
      (List.filter_map Ldb.ident_of (entities_tagged db "logseq.class/Tag"))
  in
  check "default-classes: built-in classes indexed by :block/tags Tag"
    (tagged = class_idents);
  (* reverse lookup of :logseq.property.class/extends fetches every
     class that extends a Tag class — all classes but Root.
     cljs uses :avet; this datascript build doesn't backfill avet for
     attrs whose :db/index arrives mid-tx, so :aevt is used (same set). *)
  let class_eids =
    List.filter_map
      (fun e ->
        match Ldb.ident_of e with
        | None -> None
        | Some i -> tag_eid db i)
      (entities_tagged db "logseq.class/Tag")
  in
  let children =
    List.of_seq (datoms db Aevt ~a:"logseq.property.class/extends" ())
    |> List.filter_map (fun (d : datom) ->
        match d.v with
        | Ref r when List.mem r class_eids -> Some d.e
        | _ -> None)
    |> List.sort_uniq compare
  in
  check "default-classes: extends reverse lookup covers non-Root classes"
    (List.length children = List.length class_idents - 1)

(* ---------- (deftest new-graph-initializes-default-properties-correctly) ---------- *)

let () =
  let conn = create_conn () in
  let db = Datascript.db conn in
  let property_idents =
    List.sort compare
      (List.map (fun (p : Builtin_data.builtin_property) -> p.ident)
         Builtin_data.built_in_properties)
  in
  let tagged =
    List.sort compare
      (List.filter_map Ldb.ident_of
         (entities_tagged db "logseq.class/Property"))
  in
  check "default-properties: indexed by :block/tags Property"
    (tagged = property_idents);
  let with_type =
    List.of_seq (datoms db Aevt ~a:"logseq.property/type" ())
    |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
    |> List.filter_map Ldb.ident_of
    |> List.sort compare
  in
  check "default-properties: all indexed by :logseq.property/type"
    (with_type = property_idents);
  let with_built_in =
    List.of_seq (datoms db Aevt ~a:"logseq.property/built-in?" ())
    |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
    |> List.filter_map Ldb.ident_of
    |> List.sort compare
  in
  (* cljs set/difference — built-in? entities are a superset of the
     properties (classes, pages and closed values are marked too) *)
  check "default-properties: all indexed by :logseq.property/built-in?"
    (List.for_all (fun i -> List.mem i with_built_in) property_idents);
  (* testing :properties config *)
  (match Datascript.entity db (Ident "logseq.property/status") with
   | Some status ->
     (match Ldb.ref_ent status "logseq.property/default-value" with
      | Some dv ->
        check "properties config: ident default-value resolves"
          (Ldb.ident_of dv = Some "logseq.property/status.todo")
      | None -> check "properties config: ident default-value resolves" false);
     check "properties config: checkbox property created"
       (Ldb.value status "logseq.property/enable-history?" = Some (Bool true))
   | None ->
     check "properties config: ident default-value resolves" false;
     check "properties config: checkbox property created" false);
  (match Datascript.entity db (Ident "logseq.property/deadline") with
   | Some deadline ->
     (match Ldb.ref_ent deadline "logseq.property/description" with
      | Some dv ->
        (match Ldb.property_value_content dv with
         | Some s ->
           check "properties config: :default property created"
             (contains_sub s "finish something")
         | None -> check "properties config: :default property created" false)
      | None -> check "properties config: :default property created" false)
   | None -> check "properties config: :default property created" false);
  (match Datascript.entity db (Ident "logseq.property.repeat/recur-frequency") with
   | Some recur ->
     (match Ldb.ref_ent recur "logseq.property/default-value" with
      | Some dv ->
        check "properties config: numeric property created"
          (Ldb.value dv "logseq.property/value" = Some (Int64 1L))
      | None -> check "properties config: numeric property created" false)
   | None -> check "properties config: numeric property created" false)

(* ---------- (deftest new-graph-is-valid) ---------- *)

let () =
  let conn = create_conn () in
  let errors = Db_validate.validate_local_db (Datascript.db conn) in
  check "new-graph-is-valid: no validation errors" (errors = [])

(* ---------- (deftest property-types) ---------- *)

let () =
  (* cljs (d/create-conn db-schema/schema) + build-db-initial-data with
     {:macros {"docs-base-url" "https://docs.logseq.com/#/page/$1"}} *)
  let conn = Datascript.create_conn ~schema:(schema ()) () in
  ignore
    (Datascript.transact_conn conn
       (Sqlite_create_graph.initial_tx_data ~db:(Datascript.db conn)
          ~config_content:
            "{:macros {\"docs-base-url\" \"https://docs.logseq.com/#/page/$1\"}}"
          ())
       ~tx_meta:[ "initial-db?", Bool true ]);
  (* testing ":url property" *)
  Sqlite_build.create_blocks conn
    (Edn_util.read_string
       "{:properties {:url {:logseq.property/type :url}}
         :pages-and-blocks
         [{:page {:block/title \"page1\"}
           :blocks [{:block/title \"b1\" :build/properties {:url \"https://logseq.com\"}}
                    {:block/title \"b2\" :build/properties {:url \"{{docs-base-url test}}\"}}]}]}");
  let errors = Db_validate.validate_local_db (Datascript.db conn) in
  check "property-types: :url graph has no validation errors" (errors = [])

(* ---------- build-db-initial-data with :import-type ----------
   The import tx retracts four rtc kv idents; on a fresh graph they were
   never seeded, and upstream datascript silently no-ops retract ops whose
   entity fails entid resolution — the tx must not raise. *)
let () =
  let conn = Datascript.create_conn ~schema:(schema ()) () in
  ignore
    (Datascript.transact_conn conn
       (Sqlite_create_graph.initial_tx_data ~db:(Datascript.db conn)
          ~config_content:"" ~import_type:(Keyword "sqlite-db") ())
       ~tx_meta:[ "initial-db?", Bool true ]);
  let db = Datascript.db conn in
  check "initial-data-with-import-type: import kv entities created"
    (entid db "db/ident" (Keyword "logseq.kv/import-type") <> None
     && entid db "db/ident" (Keyword "logseq.kv/imported-at") <> None)

(* ---------- (deftest build-db-initial-data-test — idempotent) ---------- *)

let () =
  let conn = create_conn () in
  let db = Datascript.db conn in
  let ignored_idents =
    [ "logseq.kv/graph-created-at"; "logseq.kv/graph-uuid"
    ; "logseq.kv/local-graph-uuid" ]
  in
  let ignored_attrs =
    [ "block/created-at"; "block/updated-at"; "file/last-modified-at"
    ; "file/created-at"; "block/order" ]
  in
  let normalize (tx : tx_op list) : tx_op list =
    tx
    |> List.filter (function
         | Entity (e : tx_entity) ->
           (match List.assoc_opt "db/ident" e.attrs with
            | Some (One_value (Keyword i)) | Some (One_value (String i)) ->
              not (List.mem i ignored_idents)
            | _ -> true)
         | _ -> true)
    |> List.map (function
         | Entity (e : tx_entity) ->
           Entity
             { e with
               attrs =
                 List.filter
                   (fun (a, _) -> not (List.mem a ignored_attrs))
                   e.attrs }
         | op -> op)
  in
  let tx1 =
    normalize
      (Sqlite_create_graph.initial_tx_data ~db ~config_content:"" ())
  in
  let tx2 =
    normalize
      (Sqlite_create_graph.initial_tx_data ~db ~config_content:"" ())
  in
  check "build-db-initial-data: idempotent" (tx1 = tx2)

let () =
  if !failures > 0 then begin
    Printf.eprintf "%d translated cljs test assertion(s) failed\n" !failures;
    exit 1
  end
  else Printf.printf "test_create_graph_native: all assertions passed\n"
