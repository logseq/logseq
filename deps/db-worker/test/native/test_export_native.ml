(* 1:1 port of deps/db/test/logseq/db/sqlite/export_test.cljs into native
   OCaml. The cljs file contains 42 deftests; all 42 are ported here with the
   cljs deftest names kept as OCaml test names.

   Ported cljs source files:
   - deps/db/test/logseq/db/sqlite/export_test.cljs
   - deps/db/src/logseq/db/test/helper.cljs (find-*/readable-properties/
     create-conn-with-* helpers, inlined below)

   Skipped cases: none.

   Notes/divergences:
   - cljs `=` on maps/sets is order-insensitive; datascript-ocaml
     Util.value_equal is order-sensitive — [v_eq] implements cljs equality
     semantics and is used for every `(is (= ...))`.
   - cljs random-uuid -> Db_test_util.gen_uuid (deterministic uuids).
   - cljs (common-util/time-ms) -> Date_time_util.time_ms; cljs (js/Date.)
     -> Instant <current-ms>.
   - cljs (d/transact! conn items) -> Datascript.transact_conn with EDN tx
     items converted via Sqlite_build.tx_ops_of_values (extended to cover
     db/add, db/retract, db/cas, db/retractEntity, db/retractAttribute op
     vectors, 5-elem explicit-tx datoms, and bare [attr v] lookup refs —
     mirroring datascript-ocaml data_readers.tx_op_of_edn_form).
   - build-export :block-id/:page-id and :view-nodes/:selected-nodes
     row/node ids accept [:block/uuid u] lookup refs (cljs d/entity
     semantics) — small lib fixes alongside this test.
   - cljs `#uuid "x"` EDN literals are written as Uuid values directly.
   - design note: idents are currently represented as `attr` strings /
     `Keyword` values threaded through the lib (with an `Ident` branch on
     `entity_ref`); Tienson suggested a dedicated `ident` type — left as a
     separate migration since it touches datascript-ocaml's value/attr
     representation.
   - cljs (str :kw) -> ":" ^ kw; cljs (name :ns/kw) -> the part after '/'.
   - cljs with-redefs broadcast-to-clients! is a no-op natively (free). *)

open Datascript

(* cljs tests run with $LOGSEQ_STABLE_IDENTS so user.property/user.class
   idents are deterministic *)
let () = Unix.putenv "LOGSEQ_STABLE_IDENTS" "1"

let failures = ref 0

let check (name : string) (ok : bool) =
  if ok then ()
  else begin
    incr failures;
    Printf.eprintf "FAIL: %s\n%!" name
  end

let () = Printexc.record_backtrace true

let run (name : string) (f : unit -> unit) : unit =
  Printf.eprintf "RUN: %s\n%!" name;
  try f ()
  with e ->
    incr failures;
    Printf.eprintf "FAIL: %s raised %s\n%s\n%!" name (Printexc.to_string e)
      (Printexc.get_backtrace ())

(* cljs graph-export-type: :graph unless LOGSEQ_EXPORT_HUMAN=1 *)
let graph_export_type =
  match Sys.getenv_opt "LOGSEQ_EXPORT_HUMAN" with
  | Some "1" -> "graph-human"
  | _ -> "graph"

(* ---------- EDN value helpers ---------- *)

let kw (s : string) : value = Keyword s

let mmap (kvs : (string * value) list) : value =
  Map (List.map (fun (k, v) -> Keyword k, v) kvs)

let uuid_ref (u : string) : value = Vector [ kw "block/uuid"; Uuid u ]
let build_page_ref (m : value) : value = Vector [ kw "build/page"; m ]

let coll_items' (v : value) : value list =
  match v with Vector vs | List vs | Set vs -> vs | _ -> []

(* cljs = : order-insensitive for maps and sets *)
let rec v_eq (a : value) (b : value) : bool =
  match a, b with
  | Map ka, Map kb ->
      List.length ka = List.length kb
      && List.for_all
           (fun (k, v) ->
             match List.find_opt (fun (k', _) -> Util.value_equal k' k) kb with
             | Some (_, v') -> v_eq v v'
             | None -> false)
           ka
  | Set sa, Set sb ->
      List.length sa = List.length sb
      && List.for_all (fun x -> List.exists (fun y -> v_eq x y) sb) sa
      && List.for_all (fun y -> List.exists (fun x -> v_eq x y) sa) sb
  | Vector va, Vector vb
  | List va, List vb
  | Vector va, List vb
  | List va, Vector vb ->
      List.length va = List.length vb && List.for_all2 v_eq va vb
  | _ -> Util.value_equal a b

let v_eq_opt (a : value option) (b : value option) : bool =
  match a, b with
  | Some a, Some b -> v_eq a b
  | None, None -> true
  | _ -> false

let map_get (k : string) (v : value) : value option =
  match v with
  | Map kvs ->
      List.find_map
        (fun (kk, vv) ->
          match kk with Keyword s | String s when s = k -> Some vv | _ -> None)
        kvs
  | _ -> None

let map_get_or_nil (k : string) (v : value) : value =
  Option.value ~default:Nil (map_get k v)

let map_put (k : string) (v : value) (m : value) : value =
  match m with
  | Map kvs ->
      Map
        (List.filter (fun (kk, _) -> not (Util.value_equal kk (Keyword k))) kvs
         @ [ Keyword k, v ])
  | _ -> Map [ Keyword k, v ]

let map_dissoc (k : string) (m : value) : value =
  match m with
  | Map kvs ->
      Map (List.filter (fun (kk, _) -> not (Util.value_equal kk (Keyword k))) kvs)
  | _ -> m

let merge_maps (a : value) (b : value) : value =
  match a, b with
  | Map ka, Map kb ->
      Map
        (List.fold_left
           (fun acc (k, v) ->
             if List.exists (fun (k', _) -> Util.value_equal k' k) acc then
               List.map
                 (fun (k', v') -> if Util.value_equal k' k then (k', v) else (k', v'))
                 acc
             else acc @ [ k, v ])
           ka kb)
  | _, b -> b

type getin = GK of string | GI of int

let rec get_in (v : value) (path : getin list) : value option =
  match path with
  | [] -> Some v
  | GK k :: rest ->
      (match map_get k v with
       | Some v' -> get_in v' rest
       | None -> None)
  | GI i :: rest ->
      (match v with
       | Vector vs | List vs | Set vs ->
           (match List.nth_opt vs i with
            | Some v' -> get_in v' rest
            | None -> None)
       | _ -> None)

let get_in_or_nil (v : value) (path : getin list) : value =
  Option.value ~default:Nil (get_in v path)

(* medley/dissoc-in for keyword-on-map paths possibly descending through
   vector indices *)
let rec dissoc_in (path : getin list) (v : value) : value =
  match path, v with
  | [ GK k ], Map kvs ->
      Map (List.filter (fun (kk, _) -> not (Util.value_equal kk (Keyword k))) kvs)
  | GK k :: rest, Map kvs ->
      Map
        (List.map
           (fun (kk, vv) ->
             if Util.value_equal kk (Keyword k) then (kk, dissoc_in rest vv)
             else (kk, vv))
           kvs)
  | GI i :: rest, Vector vs ->
      Vector (List.mapi (fun j x -> if j = i then dissoc_in rest x else x) vs)
  | _, v -> v

let rec update_in (v : value) (path : getin list) (f : value -> value) : value =
  match path, v with
  | [ GK k ], Map kvs ->
      Map
        (List.map
           (fun (kk, vv) ->
             if Util.value_equal kk (Keyword k) then (kk, f vv) else (kk, vv))
           kvs)
  | GK k :: rest, Map kvs ->
      Map
        (List.map
           (fun (kk, vv) ->
             if Util.value_equal kk (Keyword k) then (kk, update_in vv rest f)
             else (kk, vv))
           kvs)
  | [ GI i ], Vector vs ->
      Vector (List.mapi (fun j x -> if j = i then f x else x) vs)
  | GI i :: rest, Vector vs ->
      Vector (List.mapi (fun j x -> if j = i then update_in x rest f else x) vs)
  | _, v -> v

(* cljs map vals / update-vals *)
let update_vals (f : value -> value) (v : value) : value =
  match v with
  | Map kvs -> Map (List.map (fun (k, x) -> (k, f x)) kvs)
  | _ -> v

(* cljs (name :ns/kw) *)
let kw_name (k : value) : string =
  match k with
  | Keyword s | String s ->
      (match String.rindex_opt s '/' with
       | Some i -> String.sub s (i + 1) (String.length s - i - 1)
       | None -> s)
  | _ -> ""

(* cljs (str :kw) *)
let str_of_kw (k : value) : string =
  match k with Keyword s -> ":" ^ s | _ -> ""

let string_contains (s : string) (sub : string) : bool =
  let n = String.length s and m = String.length sub in
  let rec go i = i + m <= n && (String.sub s i m = sub || go (i + 1)) in
  m = 0 || go 0

let butlast_vec (v : value) : value =
  match v with
  | Vector vs ->
      (match List.rev vs with [] -> Vector [] | _ :: rest -> Vector (List.rev rest))
  | _ -> v

(* cljs walk/postwalk *)
let rec postwalk (f : value -> value) (v : value) : value =
  let v' =
    match v with
    | Map kvs -> Map (List.map (fun (k, x) -> (k, postwalk f x)) kvs)
    | Vector vs -> Vector (List.map (postwalk f) vs)
    | List vs -> List (List.map (postwalk f) vs)
    | Set vs -> Set (List.map (postwalk f) vs)
    | _ -> v
  in
  f v'

(* ---------- db helpers ---------- *)

let db_of (conn : conn) : db = Datascript.db conn

let transact_vals (conn : conn) (items : value list) : tx_report =
  Datascript.transact_conn conn
    (Sqlite_build.tx_ops_of_values (Datascript.db conn) items)

let validate_db (tname : string) (db : db) : unit =
  let errors = Db_validate.validate_local_db db in
  if errors <> [] then
    List.iter
      (fun (ge : Db_validate.grouped_error) ->
        Printf.eprintf "VALERR %s: %d errs ent=%s\n%!" ge.ge_dispatch_key
          (List.length ge.ge_errors)
          (Db_property_build.str_of_value ge.ge_entity);
        List.iter
          (fun (me : Malli.error) ->
            Printf.eprintf "   -> %s: %s\n%!"
              (String.concat "/" (List.map Db_property_build.str_of_value me.e_in))
              me.e_message)
          ge.ge_errors)
      errors;
  check (tname ^ ": Imported graph has no validation errors") (errors = [])

let find_block_by_content (db : db) (content : string) : entity option =
  Db_test_util.find_block_by_content db content

(* db-test/find-block-by-content with a regex arg *)
let find_block_by_content_re (db : db) (pattern : string) : entity option =
  match
    Datascript.q_string
      ~inputs:[ Arg_scalar (Result_value (Regex pattern)) ]
      db
      "[:find [?b ...] :in $ ?pattern :where [?b :block/title ?content] [?b :block/page] [(re-find ?pattern ?content)]]"
  with
  | [ [ Result_entity id ] ] -> Ldb.ent_of_id db id
  | [ [ Result_value (Int id) ] ] -> Ldb.ent_of_id db id
  | _ -> None

let ent_uuid (e : entity) : string =
  match Ldb.value e "block/uuid" with
  | Some (Uuid u) -> u
  | _ -> failwith "entity has no :block/uuid"

let ent_id_opt (e : entity option) : value =
  match e with Some e -> Int e.id | None -> Nil

let entity_int_opt (e : entity option) (a : attr) : int option =
  Option.bind e (fun e -> Ldb.int_value e a)

let ent_at_ident (db : db) (ident : string) : entity option =
  Datascript.entity db (Ident ident)

let ent_uuid_opt (e : entity option) : string option =
  Option.bind e (fun e ->
      match Ldb.value e "block/uuid" with Some (Uuid u) -> Some u | _ -> None)

let all_datom_triples (db : db) : value list =
  List.of_seq (Datascript.datoms db Eavt ())
  |> List.map (fun (d : datom) -> Vector [ Int d.e; Keyword d.a; d.v ])

let has_datom (datoms : value list) (e : value) (a : value) (v : value) : bool =
  List.exists
    (fun d ->
      match coll_items' d with
      | [ e'; a'; v' ] -> v_eq e e' && v_eq a a' && v_eq v v'
      | _ -> false)
    datoms

let has_datom_attr (datoms : value list) (a : value) : bool =
  List.exists
    (fun d ->
      match coll_items' d with
      | [ _; a'; _ ] -> v_eq a a'
      | _ -> false)
    datoms

let avet_count (db : db) (a : attr) (v : value) : int =
  List.length (List.of_seq (Datascript.datoms db Avet ~a ~v ()))

let attr_datom_count (db : db) (a : attr) : int =
  List.length (List.of_seq (Datascript.datoms db Avet ~a ()))

(* ---------- db-test helpers ---------- *)

let build_export (db : db) (options : (string * value) list) : value =
  Sqlite_export.build_export db (mmap options)

(* db-test/create-conn-with-blocks *)
let create_conn_with_blocks (data : value) : conn =
  let conn = Sqlite_export.create_conn () in
  Sqlite_build.create_blocks conn data;
  conn

(* db-test/create-conn-with-import-map *)
let create_conn_with_import_map (export_map : value) : conn =
  let conn = Sqlite_export.create_conn () in
  let files_opt = map_get Sqlite_export.k_graph_files export_map in
  let export_map' = map_dissoc Sqlite_export.k_graph_files export_map in
  (match Sqlite_export.build_import export_map' (db_of conn) None with
   | Ok txs -> ignore (transact_vals conn (Sqlite_export.import_tx_data txs))
   | Error e -> failwith e);
  (match files_opt with
   | Some files -> ignore (transact_vals conn (coll_items' files))
   | None -> ());
  conn

(* db-test/readable-properties *)
let readable_properties (ent : entity) : (attr * value) list =
  let db = ent.db in
  let ent_of (v : value) : entity option =
    match v with Ref id -> Ldb.ent_of_id db id | _ -> None
  in
  List.map
    (fun (k, tv) ->
      let vals =
        match tv with
        | Many_values vs -> vs
        | One_value v -> [ v ]
        | One_entity _ | Many_entities _ -> []
      in
      ( k,
        if k = "block/tags" || k = "logseq.property.class/extends" then
          Vector
            (List.map
               (fun v ->
                 match ent_of v with
                 | Some e -> Option.value ~default:Nil (Ldb.value e "db/ident")
                 | None -> Nil)
               vals)
        else
          match tv with
          | Many_values vs
            when vs <> [] && List.for_all (fun v -> ent_of v <> None) vs ->
              Set
                (List.map
                   (fun v ->
                     match ent_of v with
                     | Some e ->
                         Option.value ~default:Nil
                           (Db_property.property_value_content e)
                     | None -> Nil)
                   vs)
          | One_value v ->
              (match ent_of v with
               | Some e ->
                   (match Ldb.value e "db/ident" with
                    | Some i -> i
                    | None ->
                        Option.value ~default:Nil
                          (Db_property.property_value_content e))
               | None -> v)
          | Many_values vs -> Set vs
          | One_entity _ | Many_entities _ -> Nil ))
    (Db_property.properties_of_entity ent)

let ref_uuid_strs (e : entity) (a : attr) : string list =
  Ldb.ref_ents e a
  |> List.filter_map (fun x ->
         match Ldb.value x "block/uuid" with
         | Some (Uuid u) -> Some u
         | _ -> None)

(* ---------- cljs test helpers ---------- *)

(* has-datom? and has-datom-attr? defined above *)

let export_block_and_import_to_another_block (tname : string)
    (export_conn : conn) (import_conn : conn)
    (export_content : [ `Str of string | `Re of string ])
    (import_content : string) : value =
  let export_block =
    match export_content with
    | `Str s -> find_block_by_content (db_of export_conn) s
    | `Re re -> find_block_by_content_re (db_of export_conn) re
  in
  let import_block = find_block_by_content (db_of import_conn) import_content in
  let block_id =
    match export_block with
    | Some e -> uuid_ref (ent_uuid e)
    | None -> Vector [ kw "block/uuid"; Nil ]
  in
  let exported =
    build_export (db_of export_conn)
      [ "export-type", kw "block"; "block-id", block_id ]
  in
  (match
     Sqlite_export.build_import exported (db_of import_conn) import_block
   with
   | Ok txs ->
       ignore (transact_vals import_conn (txs.init_tx @ txs.block_props_tx))
   | Error _ -> ());
  validate_db tname (db_of import_conn);
  build_export (db_of import_conn)
    [ "export-type", kw "block"; "block-id", ent_id_opt import_block ]

let export_page_and_import_to_another_graph (tname : string)
    (export_conn : conn) (import_conn : conn) (page_title : string) : value =
  let page = Db_test_util.find_page_by_title (db_of export_conn) page_title in
  (match
     Sqlite_export.build_import
       (build_export (db_of export_conn)
          [ "export-type", kw "page"; "page-id", ent_id_opt page ])
       (db_of import_conn) None
   with
   | Ok txs ->
       ignore (transact_vals import_conn (txs.init_tx @ txs.block_props_tx))
   | Error _ -> ());
  validate_db tname (db_of import_conn);
  let page2 = Db_test_util.find_page_by_title (db_of import_conn) page_title in
  build_export (db_of import_conn)
    [ "export-type", kw "page"; "page-id", ent_id_opt page2 ]

let import_second_time_assertions ?(transform = fun bs -> bs @ bs) ?build_journal
    ?(skip_updated_at = false) (tname : string) (conn : conn) (conn2 : conn)
    (page_title : string) (original_data : value) : unit =
  let page = Db_test_util.find_page_by_title (db_of conn2) page_title in
  let imported_page =
    export_page_and_import_to_another_graph tname conn conn2 page_title
  in
  let updated_page = Db_test_util.find_page_by_title (db_of conn2) page_title in
  let expected_first_pab =
    match coll_items' (map_get_or_nil "pages-and-blocks" original_data) with
    | first :: _ ->
        update_in first [ GK "blocks" ]
          (fun bs -> Vector (transform (coll_items' bs)))
    | [] -> failwith "expected-page-and-blocks is empty"
  in
  let filter_fn (pab : value) : bool =
    match build_journal with
    | Some bj -> v_eq (get_in_or_nil pab [ GK "page"; GK "build/journal" ]) bj
    | None ->
        v_eq (get_in_or_nil pab [ GK "page"; GK "block/title" ]) (String page_title)
  in
  let imported_first =
    List.find_opt filter_fn
      (coll_items' (map_get_or_nil "pages-and-blocks" imported_page))
  in
  check
    (tname ^ ": Blocks are appended to existing page")
    (match imported_first with
     | Some v -> v_eq v expected_first_pab
     | None -> false);
  check
    (tname ^ ": Existing page didn't get re-created")
    (entity_int_opt page "block/created-at" = entity_int_opt updated_page "block/created-at");
  if not skip_updated_at then
    check
      (tname ^ ": Existing page didn't get updated")
      (entity_int_opt page "block/updated-at" = entity_int_opt updated_page "block/updated-at")

let export_graph_and_import_to_another_graph (tname : string)
    (export_options : value) (export_conn : conn) (import_conn : conn) : value =
  (match
     Sqlite_export.build_import
       (build_export (db_of export_conn)
          [ "export-type", kw graph_export_type
          ; "graph-options", export_options ])
       (db_of import_conn) None
   with
   | Ok txs -> ignore (transact_vals import_conn (Sqlite_export.import_tx_data txs))
   | Error _ -> ());
  validate_db tname (db_of import_conn);
  build_export (db_of import_conn)
    [ "export-type", kw graph_export_type; "graph-options", export_options ]

let expand_properties (props : value) : value =
  match props with
  | Map kvs ->
      Map
        (List.map
           (fun (k, m) ->
             let m = merge_maps (mmap [ "db/cardinality", kw "db.cardinality/one" ]) m in
             let m =
               match map_get "build/property-classes" m with
               | Some v -> map_put "build/property-classes" (Set (coll_items' v)) m
               | None -> m
             in
             let m =
               match map_get "block/title" m with
               | None -> map_put "block/title" (String (kw_name k)) m
               | Some _ -> m
             in
             (k, m))
           kvs)
  | _ -> props

let expand_classes (classes : value) : value =
  match classes with
  | Map kvs ->
      Map
        (List.map
           (fun (k, m) ->
             let m =
               match map_get "block/title" m with
               | None -> map_put "block/title" (String (kw_name k)) m
               | Some _ -> m
             in
             let m =
               match map_get "build/class-extends" m with
               | Some v -> map_put "build/class-extends" (Set (coll_items' v)) m
               | None -> m
             in
             (k, m))
           kvs)
  | _ -> classes

let sort_pages_and_blocks (v : value) : value =
  Sqlite_export.sort_pages_and_blocks (coll_items' v)

(* common-util/block-with-timestamps *)
let block_with_timestamps_v (m : value) : value =
  let t = Int64.to_int (Date_time_util.time_ms ()) in
  let m = map_put "block/updated-at" (Int t) m in
  match map_get "block/created-at" m with
  | None -> map_put "block/created-at" (Int t) m
  | Some _ -> m

(* ---------- deftests ---------- *)

let test_merge_export_maps () =
  let tname = "merge-export-maps" in
  let expected1 =
    mmap
      [ ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap [ "block/title", String "b1" ]
                      ; mmap [ "block/title", String "b2" ] ] ) ]
            ; mmap [ "page", mmap [ "block/title", String "page2" ] ] ] ) ]
  in
  let m1 =
    mmap
      [ ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; "blocks", Vector [ mmap [ "block/title", String "b1" ] ] ] ] ) ]
  in
  let m2 =
    mmap
      [ ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; "blocks", Vector [ mmap [ "block/title", String "b2" ] ] ]
            ; mmap [ "page", mmap [ "block/title", String "page2" ] ] ] ) ]
  in
  check
    (tname ^ ": In :pages-and-blocks, identical pages and their :blocks are merged")
    (v_eq expected1 (Sqlite_export.merge_export_maps [ m1; m2 ]));
  let expected2 =
    mmap
      [ ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "build/journal", Int 20250220 ]
                ; "blocks", Vector [ mmap [ "block/title", String "b1" ] ] ]
            ; mmap [ "page", mmap [ "build/journal", Int 20250221 ] ] ] ) ]
  in
  let m3 =
    mmap
      [ ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "build/journal", Int 20250220 ]
                ; "blocks", Vector [ mmap [ "block/title", String "b1" ] ] ] ] ) ]
  in
  let m4 =
    mmap
      [ ( "pages-and-blocks",
          Vector
            [ mmap [ "page", mmap [ "build/journal", Int 20250220 ] ]
            ; mmap [ "page", mmap [ "build/journal", Int 20250221 ] ] ] ) ]
  in
  check
    (tname ^ ": In :pages-and-blocks, identical journals and their :blocks are merged")
    (v_eq expected2 (Sqlite_export.merge_export_maps [ m3; m4 ]))

let test_import_block_in_same_graph () =
  let tname = "import-block-in-same-graph" in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ ( "user.property/default-many",
                mmap
                  [ "logseq.property/type", kw "default"
                  ; "db/cardinality", kw "db.cardinality/many" ] ) ] )
      ; ( "classes",
          mmap
            [ ( "user.class/MyClass",
                mmap
                  [ ( "build/class-properties",
                      Vector [ kw "user.property/default-many" ] ) ] ) ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "export"
                          ; ( "build/properties",
                              mmap
                                [ ( "user.property/default-many",
                                    Set [ String "foo"; String "bar"; String "baz" ] ) ] )
                          ; "build/tags", Set [ kw "user.class/MyClass" ] ]
                      ; mmap [ "block/title", String "import" ] ] ) ] ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let imported_block =
    export_block_and_import_to_another_block tname conn conn (`Str "export") "import"
  in
  check
    (tname ^ ": Imported block equals exported block")
    (v_eq
       (get_in_or_nil original_data
          [ GK "pages-and-blocks"; GI 0; GK "blocks"; GI 0 ])
       (map_get_or_nil Sqlite_export.k_block imported_block));
  check
    (tname ^ ": properties imported")
    (v_eq
       (expand_properties (map_get_or_nil "properties" original_data))
       (map_get_or_nil "properties" imported_block));
  check
    (tname ^ ": classes imported")
    (v_eq
       (expand_classes (map_get_or_nil "classes" original_data))
       (map_get_or_nil "classes" imported_block))

let test_import_block_in_different_graph () =
  let tname = "import-block-in-different-graph" in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ ( "user.property/num-many",
                mmap
                  [ "logseq.property/type", kw "number"
                  ; "db/cardinality", kw "db.cardinality/many"
                  ; "block/title", String "Num Many"
                  ; "logseq.property/hide?", Bool true ] )
            ; "user.property/p1", mmap [ "logseq.property/type", kw "default" ] ] )
      ; ( "classes",
          mmap
            [ ( "user.class/MyClass",
                mmap
                  [ ( "build/class-properties",
                      Vector [ kw "user.property/num-many"; kw "user.property/p1" ] ) ] ) ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "export"
                          ; ( "build/properties",
                              mmap
                                [ "user.property/num-many", Set [ Int 3; Int 6; Int 9 ] ] )
                          ; "build/tags", Set [ kw "user.class/MyClass" ] ] ] ) ] ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let conn2 =
    create_conn_with_blocks
      (mmap
         [ ( "pages-and-blocks",
             Vector
               [ mmap
                   [ "page", mmap [ "block/title", String "page2" ]
                   ; ( "blocks",
                       Vector
                         [ mmap [ "block/title", String "import" ]
                         ; mmap [ "block/title", String "import2" ] ] ) ] ] ) ])
  in
  let expected_block =
    get_in_or_nil original_data [ GK "pages-and-blocks"; GI 0; GK "blocks"; GI 0 ]
  in
  let imported_block =
    export_block_and_import_to_another_block tname conn conn2 (`Str "export") "import"
  in
  check
    (tname ^ ": Imported block equals exported block")
    (v_eq expected_block (map_get_or_nil Sqlite_export.k_block imported_block));
  check
    (tname ^ ": properties imported")
    (v_eq
       (expand_properties (map_get_or_nil "properties" original_data))
       (map_get_or_nil "properties" imported_block));
  check
    (tname ^ ": classes imported")
    (v_eq
       (expand_classes (map_get_or_nil "classes" original_data))
       (map_get_or_nil "classes" imported_block));
  (* testing "same import in another block" *)
  let imported_block2 =
    export_block_and_import_to_another_block tname conn conn2 (`Str "export") "import2"
  in
  check
    (tname ^ ": Imported block equals exported block (import2)")
    (v_eq expected_block (map_get_or_nil Sqlite_export.k_block imported_block2));
  check
    (tname ^ ": properties imported (import2)")
    (v_eq
       (expand_properties (map_get_or_nil "properties" original_data))
       (map_get_or_nil "properties" imported_block2));
  check
    (tname ^ ": classes imported (import2)")
    (v_eq
       (expand_classes (map_get_or_nil "classes" original_data))
       (map_get_or_nil "classes" imported_block2))

let test_import_block_with_different_ref_types () =
  let tname = "import-block-with-different-ref-types" in
  let page_uuid = Db_test_util.gen_uuid () in
  let block_uuid = Db_test_util.gen_uuid () in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ "user.property/p1", mmap [ "logseq.property/type", kw "default" ] ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ ( "block/title",
                              String
                                ("page ref to " ^ Page_ref.to_page_ref page_uuid) )
                          ; ( "build/properties",
                              mmap
                                [ ( "user.property/p1",
                                    String
                                      ("block ref to " ^ Page_ref.to_page_ref block_uuid) ) ] ) ] ] ) ]
            ; mmap
                [ ( "page",
                    mmap
                      [ "block/title", String "another page"
                      ; "block/uuid", Uuid page_uuid
                      ; "build/keep-uuid?", Bool true ] )
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "b1"
                          ; "block/uuid", Uuid block_uuid
                          ; "build/keep-uuid?", Bool true ] ] ) ] ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let conn2 =
    create_conn_with_blocks
      (mmap
         [ ( "pages-and-blocks",
             Vector
               [ mmap
                   [ "page", mmap [ "block/title", String "page2" ]
                   ; "blocks", Vector [ mmap [ "block/title", String "import" ] ] ] ] ) ])
  in
  let imported_block =
    export_block_and_import_to_another_block tname conn conn2 (`Re "page ref") "import"
  in
  check
    (tname ^ ": Imported block equals exported block")
    (v_eq
       (get_in_or_nil original_data [ GK "pages-and-blocks"; GI 0; GK "blocks"; GI 0 ])
       (map_get_or_nil Sqlite_export.k_block imported_block));
  check
    (tname ^ ": Imported page equals exported page of page ref")
    (v_eq
       (get_in_or_nil original_data [ GK "pages-and-blocks"; GI 1 ])
       (get_in_or_nil imported_block [ GK "pages-and-blocks"; GI 0 ]))

let test_import_page_with_different_blocks () =
  let tname = "import-page-with-different-blocks" in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ ( "user.property/default",
                mmap [ "logseq.property/type", kw "default"; "block/title", String "Default" ] )
            ; "user.property/num", mmap [ "logseq.property/type", kw "number" ] ] )
      ; ( "classes",
          mmap
            [ "user.class/MyClass", mmap [ "block/title", String "My Class" ] ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "b1"
                          ; ( "build/properties",
                              mmap [ "user.property/default", String "woot" ] )
                          ; ( "build/children",
                              Vector
                                [ mmap
                                    [ "block/title", String "b1a"
                                    ; ( "build/children",
                                        Vector
                                          [ mmap
                                              [ "block/title", String "b1aa"
                                              ; ( "build/properties",
                                                  mmap [ "user.property/num", Int 2 ] ) ]
                                          ; mmap [ "block/title", String "b1ab" ] ] ) ]
                                ; mmap [ "block/title", String "b1b" ] ] ) ]
                      ; mmap
                          [ "block/title", String "b2"
                          ; "build/tags", Set [ kw "user.class/MyClass" ] ]
                      ; mmap
                          [ "block/title", String "some task"
                          ; ( "build/properties",
                              mmap
                                [ ( "logseq.property/status",
                                    kw "logseq.property/status.doing" ) ] )
                          ; "build/tags", Set [ kw "logseq.class/Task" ] ] ] ) ] ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let conn2 = Sqlite_export.create_conn () in
  let imported_page =
    export_page_and_import_to_another_graph tname conn conn2 "page1"
  in
  check
    (tname ^ ": Page's properties are imported")
    (v_eq
       (expand_properties (map_get_or_nil "properties" original_data))
       (map_get_or_nil "properties" imported_page));
  check
    (tname ^ ": Page's classes are imported")
    (v_eq
       (map_get_or_nil "classes" original_data)
       (map_get_or_nil "classes" imported_page));
  check
    (tname ^ ": Page's blocks are imported")
    (v_eq
       (map_get_or_nil "pages-and-blocks" original_data)
       (map_get_or_nil "pages-and-blocks" imported_page));
  import_second_time_assertions tname conn conn2 "page1" original_data

let test_import_page_with_different_ref_types () =
  let tname = "import-page-with-different-ref-types" in
  let block_uuid = Db_test_util.gen_uuid () in
  let internal_block_uuid = Db_test_util.gen_uuid () in
  let class_uuid = Db_test_util.gen_uuid () in
  let page_uuid = Db_test_util.gen_uuid () in
  let pvalue_page_uuid = Db_test_util.gen_uuid () in
  let pvalue_block_uuid = Db_test_util.gen_uuid () in
  let property_uuid = Db_test_util.gen_uuid () in
  let journal_uuid = Db_test_util.gen_uuid () in
  let block_object_uuid = Db_test_util.gen_uuid () in
  let pref s = Page_ref.to_page_ref s in
  let original_data =
    mmap
      [ ( "classes",
          mmap
            [ ( "user.class/C1",
                mmap [ "block/uuid", Uuid class_uuid; "build/keep-uuid?", Bool true ] )
            ; "user.class/NodeClass", mmap [] ] )
      ; ( "properties",
          mmap
            [ ( "user.property/p1",
                mmap
                  [ "logseq.property/type", kw "node"
                  ; "block/uuid", Uuid property_uuid
                  ; "build/keep-uuid?", Bool true
                  ; "build/property-classes", Vector [ kw "user.class/NodeClass" ] ] )
            ; "user.property/p2", mmap [ "logseq.property/type", kw "default" ]
            ; "user.property/p3", mmap [ "logseq.property/type", kw "default" ] ] )
      ; "extract-content-refs?", Bool false
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap [ "block/title", String ("page ref to " ^ pref page_uuid) ]
                      ; mmap
                          [ ( "block/title",
                              String ("not a page ref `" ^ pref "foo" ^ "`") ) ]
                      ; mmap
                          [ "block/title", String ("block ref to " ^ pref block_uuid) ]
                      ; mmap
                          [ "block/title", String "ref in properties"
                          ; ( "build/properties",
                              mmap
                                [ ( "user.property/p2",
                                    String ("pvalue ref to " ^ pref pvalue_page_uuid) ) ] ) ]
                      ; mmap
                          [ "block/title", String "hola"
                          ; "block/uuid", Uuid internal_block_uuid
                          ; "build/keep-uuid?", Bool true ]
                      ; mmap
                          [ ( "block/title",
                              String ("internal block ref to " ^ pref internal_block_uuid) ) ]
                      ; mmap
                          [ "block/title", String ("class ref to " ^ pref class_uuid) ]
                      ; mmap
                          [ ( "block/title",
                              String ("inline class ref to #" ^ pref class_uuid) ) ]
                      ; mmap
                          [ "block/title", String ("property ref to " ^ pref property_uuid) ]
                      ; mmap
                          [ "block/title", String ("journal ref to " ^ pref journal_uuid) ]
                      ; mmap
                          [ ( "block/title",
                              String ("property block value ref to " ^ pref pvalue_block_uuid) ) ]
                      ; mmap
                          [ "block/title", String "block with a pvalue that has a :block/uuid"
                          ; ( "build/properties",
                              mmap
                                [ ( "user.property/p2",
                                    mmap
                                      [ "build/property-value", kw "block"
                                      ; "block/title", String "property value block"
                                      ; ( "build/properties",
                                          mmap [ "user.property/p3", String "woot" ] )
                                      ; "block/uuid", Uuid pvalue_block_uuid
                                      ; "build/keep-uuid?", Bool true ] ) ] ) ] ] ) ]
            ; mmap
                [ "page", mmap [ "block/title", String "page with block ref" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "hi"
                          ; "block/uuid", Uuid block_uuid
                          ; "build/keep-uuid?", Bool true
                          ; ( "build/properties",
                              mmap
                                [ "user.property/p1", uuid_ref block_object_uuid ] ) ] ] ) ]
            ; mmap
                [ ( "page",
                    mmap
                      [ "block/title", String "page ref page"
                      ; "block/uuid", Uuid page_uuid
                      ; "build/keep-uuid?", Bool true ] ) ]
            ; mmap
                [ ( "page",
                    mmap
                      [ "block/title", String "pvalue ref page"
                      ; "block/uuid", Uuid pvalue_page_uuid
                      ; "build/keep-uuid?", Bool true ] ) ]
            ; mmap
                [ ( "page",
                    mmap
                      [ "build/journal", Int 20250207
                      ; "block/uuid", Uuid journal_uuid
                      ; "build/keep-uuid?", Bool true ] ) ]
            ; mmap
                [ "page", mmap [ "block/title", String "Blocks" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "myclass object"
                          ; "build/tags", Vector [ kw "user.class/MyClass" ]
                          ; "block/uuid", Uuid block_object_uuid
                          ; "build/keep-uuid?", Bool true ] ] ) ] ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let conn2 = Sqlite_export.create_conn () in
  let imported_page =
    export_page_and_import_to_another_graph tname conn conn2 "page1"
  in
  check
    (tname ^ ": Page's properties are imported")
    (v_eq
       (dissoc_in [ GK "user.property/p1"; GK "build/property-classes" ]
          (expand_properties (map_get_or_nil "properties" original_data)))
       (map_get_or_nil "properties" imported_page));
  check
    (tname ^ ": Page's classes are imported except for shallow property's class")
    (v_eq
       (map_dissoc "user.class/NodeClass"
          (expand_classes (map_get_or_nil "classes" original_data)))
       (map_get_or_nil "classes" imported_page));
  check
    (tname ^ ": Page's blocks are imported")
    (v_eq
       (sort_pages_and_blocks
          (butlast_vec
             (dissoc_in [ GI 1; GK "blocks"; GI 0; GK "build/properties" ]
                (map_get_or_nil "pages-and-blocks" original_data))))
       (map_get_or_nil "pages-and-blocks" imported_page));
  import_second_time_assertions tname conn conn2 "page1" original_data
    ~transform:(fun bs ->
      List.filter
        (fun b -> map_get "block/title" b <> Some (String "hola"))
        bs
      @ bs)

let test_import_page_with_block_links () =
  let tname = "import-page-with-block-links" in
  let block_uuid = Db_test_util.gen_uuid () in
  let original_data =
    mmap
      [ ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "b1"
                          ; "block/uuid", Uuid block_uuid
                          ; "build/keep-uuid?", Bool true ]
                      ; mmap
                          [ "block/title", String ""
                          ; "block/link", uuid_ref block_uuid ] ] ) ] ] ) ]
  in
  (* build-existing-tx? tests out of order uuids *)
  let conn =
    create_conn_with_blocks (map_put "build-existing-tx?" (Bool true) original_data)
  in
  let conn2 = Sqlite_export.create_conn () in
  let imported_page =
    export_page_and_import_to_another_graph tname conn conn2 "page1"
  in
  check
    (tname ^ ": Page's blocks are imported")
    (v_eq
       (map_get_or_nil "pages-and-blocks" original_data)
       (map_get_or_nil "pages-and-blocks" imported_page));
  import_second_time_assertions tname conn conn2 "page1" original_data
    ~transform:(fun bs ->
      List.filter (fun b -> map_get "block/title" b <> Some (String "b1")) bs @ bs)

let test_import_page_with_different_page_and_classes () =
  let tname = "import-page-with-different-page-and-classes" in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ "user.property/p1", mmap [ "logseq.property/type", kw "default" ]
            ; ( "user.property/p2",
                mmap
                  [ "logseq.property/type", kw "node"
                  ; "build/property-classes", Vector [ kw "user.class/NodeClass2" ] ] )
            ; ( "user.property/p3",
                mmap
                  [ "logseq.property/type", kw "node"
                  ; "build/property-classes", Vector [ kw "user.class/NodeClass" ] ] )
            ; "user.property/node-p1", mmap [ "logseq.property/type", kw "default" ] ] )
      ; ( "classes",
          mmap
            [ ( "user.class/MyClass",
                mmap
                  [ ( "build/class-properties",
                      Vector [ kw "user.property/p1"; kw "user.property/p2" ] ) ] )
            ; ( "user.class/MyClass2",
                mmap [ "build/class-properties", Vector [ kw "user.property/p2" ] ] )
            ; ( "user.class/ChildClass",
                mmap
                  [ "build/class-extends", Vector [ kw "user.class/MyClass" ]
                  ; "build/class-properties", Vector [ kw "user.property/p3" ] ] )
            ; ( "user.class/ChildClass2",
                mmap [ "build/class-extends", Vector [ kw "user.class/MyClass2" ] ] )
            ; ( "user.class/NodeClass",
                mmap
                  [ "build/class-properties", Vector [ kw "user.property/node-p1" ] ] )
            ; "user.class/NodeClass2", mmap [] ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ ( "page",
                    mmap
                      [ "block/title", String "page1"
                      ; "build/properties", mmap [ "user.property/p1", String "woot" ]
                      ; "build/tags", Set [ kw "user.class/ChildClass" ] ] )
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "child object"
                          ; "build/tags", Set [ kw "user.class/ChildClass2" ] ] ] ) ] ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let conn2 = Sqlite_export.create_conn () in
  let imported_page =
    export_page_and_import_to_another_graph tname conn conn2 "page1"
  in
  check
    (tname ^ ": Page's properties are imported except for shallow class' property")
    (v_eq
       (dissoc_in [ GK "user.property/p2"; GK "build/property-classes" ]
          (map_dissoc "user.property/node-p1"
             (expand_properties (map_get_or_nil "properties" original_data))))
       (map_get_or_nil "properties" imported_page));
  check
    (tname ^ ": Page's classes are imported except for shallow property's class")
    (v_eq
       (map_dissoc "user.class/NodeClass2"
          (dissoc_in [ GK "user.class/NodeClass"; GK "build/class-properties" ]
             (expand_classes (map_get_or_nil "classes" original_data))))
       (map_get_or_nil "classes" imported_page));
  check
    (tname ^ ": Page's blocks are imported")
    (v_eq
       (map_get_or_nil "pages-and-blocks" original_data)
       (map_get_or_nil "pages-and-blocks" imported_page));
  import_second_time_assertions ~skip_updated_at:true tname conn conn2 "page1"
    original_data

let test_import_journal_page () =
  let tname = "import-journal-page" in
  let original_data =
    mmap
      [ ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "build/journal", Int 20250210 ]
                ; ( "blocks",
                    Vector
                      [ mmap [ "block/title", String "b1" ]
                      ; mmap [ "block/title", String "b2" ] ] ) ] ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let conn2 = Sqlite_export.create_conn () in
  let journal_title = Date_time_util.int_to_journal_title 20250210 "MMM do, yyyy" in
  let imported_page =
    export_page_and_import_to_another_graph tname conn conn2 journal_title
  in
  check
    (tname ^ ": Page's blocks are imported")
    (v_eq
       (map_get_or_nil "pages-and-blocks" original_data)
       (map_get_or_nil "pages-and-blocks" imported_page));
  import_second_time_assertions ~build_journal:(Int 20250210) tname conn conn2
    journal_title original_data

let test_import_class_page () =
  let tname = "import-class-page" in
  let class_uuid = Db_test_util.gen_uuid () in
  let original_data =
    mmap
      [ ( "classes",
          mmap
            [ "user.class/C0", mmap []
            ; ( "user.class/C1",
                mmap
                  [ "build/class-extends", Vector [ kw "user.class/C0" ]
                  ; "build/class-properties", Vector [ kw "user.property/p1" ]
                  ; "block/uuid", Uuid class_uuid
                  ; "build/keep-uuid?", Bool true ] ) ] )
      ; ( "properties",
          mmap
            [ "user.property/p1", mmap [ "logseq.property/type", kw "default" ] ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/uuid", Uuid class_uuid ]
                ; "blocks", Vector [ mmap [ "block/title", String "class block" ] ] ] ] ) ]
  in
  let conn =
    create_conn_with_blocks (map_put "build-existing-tx?" (Bool true) original_data)
  in
  let conn2 = Sqlite_export.create_conn () in
  let imported_page =
    export_page_and_import_to_another_graph tname conn conn2 "C1"
  in
  check
    (tname ^ ": Class page is imported")
    (v_eq
       (expand_classes (map_get_or_nil "classes" original_data))
       (map_get_or_nil "classes" imported_page));
  check
    (tname ^ ": Class page's properties are imported")
    (v_eq
       (expand_properties (map_get_or_nil "properties" original_data))
       (map_get_or_nil "properties" imported_page));
  check
    (tname ^ ": Page's blocks are imported")
    (v_eq
       (map_get_or_nil "pages-and-blocks" original_data)
       (map_get_or_nil "pages-and-blocks" imported_page))

let test_import_page_with_different_property_types () =
  let tname = "import-page-with-different-property-types" in
  let block_object_uuid = Db_test_util.gen_uuid () in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ "user.property/num", mmap [ "logseq.property/type", kw "number" ]
            ; "user.property/checkbox", mmap [ "logseq.property/type", kw "checkbox" ]
            ; "user.property/date", mmap [ "logseq.property/type", kw "date" ]
            ; ( "user.property/node",
                mmap
                  [ "logseq.property/type", kw "node"
                  ; "db/cardinality", kw "db.cardinality/many"
                  ; "build/property-classes", Vector [ kw "user.class/MyClass" ] ] )
            ; "user.property/p1", mmap [ "logseq.property/type", kw "default" ]
            ; "user.property/map", mmap [ "logseq.property/type", kw "map" ] ] )
      ; ( "classes",
          mmap
            [ ( "user.class/MyClass",
                mmap [ "build/class-properties", Vector [ kw "user.property/p1" ] ] ) ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "num block"
                          ; "build/properties", mmap [ "user.property/num", Int 2 ] ]
                      ; mmap
                          [ "block/title", String "checkbox block"
                          ; ( "build/properties",
                              mmap [ "user.property/checkbox", Bool false ] ) ]
                      ; mmap
                          [ "block/title", String "date block"
                          ; ( "build/properties",
                              mmap
                                [ ( "user.property/date",
                                    build_page_ref
                                      (mmap [ "build/journal", Int 20250203 ]) ) ] ) ]
                      ; mmap
                          [ "block/title", String "node block"
                          ; ( "build/properties",
                              mmap
                                [ ( "user.property/node",
                                    Set
                                      [ build_page_ref
                                          (mmap
                                             [ "block/title", String "page object"
                                             ; "build/tags", Set [ kw "user.class/MyClass" ] ])
                                      ; uuid_ref block_object_uuid
                                      ; kw "logseq.class/Task" ] ) ] ) ]
                      ; mmap
                          [ "block/title", String "map block"
                          ; ( "build/properties",
                              mmap
                                [ ( "user.property/map",
                                    mmap [ "foo", kw "bar"; "num", Int 2 ] ) ] ) ] ] ) ]
            ; mmap
                [ "page", mmap [ "block/title", String "Blocks" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "myclass object"
                          ; "build/tags", Set [ kw "user.class/MyClass" ]
                          ; "block/uuid", Uuid block_object_uuid
                          ; "build/keep-uuid?", Bool true ] ] ) ] ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let conn2 = Sqlite_export.create_conn () in
  let imported_page =
    export_page_and_import_to_another_graph tname conn conn2 "page1"
  in
  check
    (tname ^ ": Page's properties are imported")
    (v_eq
       (map_dissoc "user.property/p1"
          (expand_properties (map_get_or_nil "properties" original_data)))
       (map_get_or_nil "properties" imported_page));
  check
    (tname ^ ": Page's classes are imported")
    (v_eq
       (dissoc_in [ GK "user.class/MyClass"; GK "build/class-properties" ]
          (expand_classes (map_get_or_nil "classes" original_data)))
       (map_get_or_nil "classes" imported_page));
  check
    (tname ^ ": Page's blocks are imported")
    (v_eq
       (sort_pages_and_blocks
          (dissoc_in [ GI 1; GK "blocks"; GI 0; GK "build/tags" ]
             (map_get_or_nil "pages-and-blocks" original_data)))
       (map_get_or_nil "pages-and-blocks" imported_page));
  import_second_time_assertions tname conn conn2 "page1" original_data;
  check
    (tname ^ ": Page property value is only created first time")
    (avet_count (db_of conn2) "block/title" (String "page object") = 1);
  check
    (tname ^ ": Journal property value is only created first time")
    (avet_count (db_of conn2) "block/journal-day" (Int 20250203) = 1)

let test_import_graph_ontology () =
  let tname = "import-graph-ontology" in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ "user.property/num", mmap [ "logseq.property/type", kw "number" ]
            ; "user.property/checkbox", mmap [ "logseq.property/type", kw "checkbox" ]
            ; ( "user.property/url",
                mmap
                  [ "logseq.property/type", kw "url"
                  ; ( "build/properties",
                      mmap [ "logseq.property/description", String "desc for url" ] ) ] )
            ; ( "user.property/node",
                mmap
                  [ "logseq.property/type", kw "node"
                  ; "db/cardinality", kw "db.cardinality/many"
                  ; "build/property-classes", Vector [ kw "user.class/MyClass" ] ] ) ] )
      ; ( "classes",
          mmap
            [ ( "user.class/MyClass",
                mmap
                  [ ( "build/properties",
                      mmap [ "user.property/url", String "https://example.com/MyClass" ] ) ] )
            ; ( "user.class/MyClass2",
                mmap
                  [ "build/class-extends", Vector [ kw "user.class/MyClass" ]
                  ; ( "build/properties",
                      mmap [ "logseq.property/description", String "tests child class" ] ) ] ) ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let conn2 =
    create_conn_with_import_map
      (build_export (db_of conn) [ "export-type", kw "graph-ontology" ])
  in
  validate_db tname (db_of conn2);
  let imported_ontology =
    build_export (db_of conn2) [ "export-type", kw "graph-ontology" ]
  in
  check
    (tname ^ ": properties imported")
    (v_eq
       (expand_properties (map_get_or_nil "properties" original_data))
       (map_get_or_nil "properties" imported_ontology));
  check
    (tname ^ ": classes imported")
    (v_eq
       (expand_classes (map_get_or_nil "classes" original_data))
       (map_get_or_nil "classes" imported_ontology))

let test_import_with_url_property_should_be_idempotent () =
  let tname = "import-with-url-property-should-be-idempotent" in
  let about_uuid = Db_test_util.gen_uuid () in
  let export_edn =
    mmap
      [ ( "properties",
          mmap
            [ ( "user.property/url",
                mmap
                  [ "db/cardinality", kw "db.cardinality/one"
                  ; "logseq.property/type", kw "url"
                  ; "block/title", String "url" ] )
            ; ( "user.property/about",
                mmap
                  [ "db/cardinality", kw "db.cardinality/one"
                  ; "logseq.property/type", kw "node"
                  ; "block/title", String "about"
                  ; "block/uuid", Uuid about_uuid
                  ; "build/keep-uuid?", Bool true
                  ; ( "build/properties",
                      mmap [ "user.property/url", String "https://example.com/about" ] ) ] ) ] ) ]
  in
  let conn =
    create_conn_with_blocks
      (mmap [ "properties", map_get_or_nil "properties" export_edn ])
  in
  (match Sqlite_export.build_import export_edn (db_of conn) None with
   | Ok txs -> ignore (transact_vals conn (Sqlite_export.import_tx_data txs))
   | Error _ -> ());
  validate_db tname (db_of conn);
  let url_title =
    match ent_at_ident (db_of conn) "user.property/about" with
    | Some about ->
        (match Ldb.ref_ent about "user.property/url" with
         | Some e -> Ldb.string_value e "block/title"
         | None -> None)
    | None -> None
  in
  check
    (tname ^ ": URL value materializes as a property-value block")
    (url_title = Some "https://example.com/about")

let test_export_graph_ontology_ignores_legacy_internal_class_properties () =
  let tname = "export-graph-ontology-ignores-legacy-internal-class-properties" in
  let legacy_property = "logseq.property.embedding/hnsw-label-updated-at" in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ "user.property/p1", mmap [ "logseq.property/type", kw "default" ] ] )
      ; ( "classes",
          mmap
            [ ( "user.class/MyClass",
                mmap [ "build/class-properties", Vector [ kw "user.property/p1" ] ] ) ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let my_class_id =
    match ent_at_ident (db_of conn) "user.class/MyClass" with
    | Some e -> e.id
    | None -> failwith "user.class/MyClass missing"
  in
  ignore
    (transact_vals conn
       [ mmap
           [ "db/ident", kw legacy_property
           ; "block/uuid", Uuid (Db_test_util.gen_uuid ())
           ; "block/title", String "HNSW label updated-at"
           ; "block/tags", kw "logseq.class/Property"
           ; "logseq.property/built-in?", Bool true
           ; "logseq.property/type", kw "number" ]
       ; mmap
           [ "db/id", Int my_class_id
           ; "logseq.property.class/properties", Vector [ kw legacy_property ] ] ]);
  let export_edn =
    build_export (db_of conn) [ "export-type", kw "graph-ontology" ]
  in
  check
    (tname ^ ": class-properties keeps only user property")
    (v_eq
       (get_in_or_nil export_edn
          [ GK "classes"; GK "user.class/MyClass"; GK "build/class-properties" ])
       (Vector [ kw "user.property/p1" ]));
  check
    (tname ^ ": legacy property not exported")
    (map_get legacy_property (map_get_or_nil "properties" export_edn) = None)

let test_graph_datom_import_drops_legacy_plugin_property_schema_attrs () =
  let tname = "graph-datom-import-drops-legacy-plugin-property-schema-attrs" in
  let plugin_property = "plugin.property.degrande-colors/mugpet_degrande_colors_controls" in
  let conn =
    create_conn_with_import_map
      (mmap
         [ ( "properties",
             mmap [ plugin_property, mmap [ "logseq.property/type", kw "json" ] ] )
         ; ( "pages-and-blocks",
             Vector
               [ mmap
                   [ "page", mmap [ "block/title", String "page1" ]
                   ; "blocks", Vector [ mmap [ "block/title", String "b1" ] ] ] ] ) ])
  in
  let plugin_property_id =
    match ent_at_ident (db_of conn) plugin_property with
    | Some e -> e.id
    | None -> failwith "plugin property missing"
  in
  ignore
    (transact_vals conn
       [ mmap [ "db/id", Int plugin_property_id; "hide?", Bool true; "public?", Bool false ] ]);
  let export_edn = build_export (db_of conn) [ "export-type", kw "graph" ] in
  let import_conn = Sqlite_export.create_conn () in
  let validation =
    Sqlite_export.validate_import_txs ~edn_label:"Exported EDN"
      (Sqlite_export.build_import export_edn (db_of import_conn) None)
      (db_of import_conn)
  in
  check (tname ^ ": no error") (validation.Sqlite_export.error = None);
  let datoms = coll_items' (map_get_or_nil "datoms" export_edn) in
  check
    (tname ^ ": hide? datom exported")
    (has_datom datoms (Int plugin_property_id) (kw "hide?") (Bool true));
  check
    (tname ^ ": public? datom exported")
    (has_datom datoms (Int plugin_property_id) (kw "public?") (Bool false));
  let tx_data = validation.Sqlite_export.valid_tx_data in
  check
    (tname ^ ": hide? disallowed attr dropped from tx-data")
    (not
       (List.exists
          (fun tx -> v_eq tx (Vector [ kw "db/add"; Int plugin_property_id; kw "hide?"; Bool true ]))
          tx_data));
  check
    (tname ^ ": public? disallowed attr dropped from tx-data")
    (not
       (List.exists
          (fun tx -> v_eq tx (Vector [ kw "db/add"; Int plugin_property_id; kw "public?"; Bool false ]))
          tx_data))

let test_graph_export_keeps_referenced_recycled_closed_value_config () =
  let tname = "graph-export-keeps-referenced-recycled-closed-value-config" in
  let property_id = "plugin.property.degrande-colors/tldraw" in
  let closed_value_uuid = Db_test_util.gen_uuid () in
  let conn =
    create_conn_with_import_map
      (mmap
         [ ( "properties",
             mmap
               [ ( property_id,
                   mmap
                     [ "logseq.property/type", kw "default"
                     ; ( "build/closed-values",
                         Vector [ mmap [ "value", String "tldraw"; "uuid", Uuid closed_value_uuid ] ] ) ] ) ] )
         ; ( "pages-and-blocks",
             Vector
               [ mmap
                   [ "page", mmap [ "block/title", String "page1" ]
                   ; ( "blocks",
                       Vector
                         [ mmap
                             [ "block/title", String "b1"
                             ; ( "build/properties",
                                 mmap [ property_id, uuid_ref closed_value_uuid ] ) ] ] ) ] ] ) ])
  in
  let closed_value_id =
    match Datascript.entity (db_of conn) (Lookup_ref ("block/uuid", Uuid closed_value_uuid)) with
    | Some e -> e.id
    | None -> failwith "closed value missing"
  in
  ignore
    (transact_vals conn
       [ mmap [ "db/id", Int closed_value_id; "logseq.property/deleted-at", Int 1 ] ]);
  let export_edn = build_export (db_of conn) [ "export-type", kw "graph" ] in
  let validation = Sqlite_export.validate_export export_edn in
  check (tname ^ ": no error") (validation.Sqlite_export.error = None);
  let datoms = coll_items' (map_get_or_nil "datoms" export_edn) in
  check
    (tname ^ ": deleted-at datom kept")
    (has_datom datoms (Int closed_value_id) (kw "logseq.property/deleted-at") (Int 1))

let test_graph_export_ignores_scalar_values_when_finding_referenced_closed_values () =
  let tname = "graph-export-ignores-scalar-values-when-finding-referenced-closed-values" in
  let property_id = "user.property/datetime" in
  let conn =
    create_conn_with_import_map
      (mmap
         [ ( "properties",
             mmap [ property_id, mmap [ "logseq.property/type", kw "datetime" ] ] )
         ; ( "pages-and-blocks",
             Vector
               [ mmap
                   [ "page", mmap [ "block/title", String "page1" ]
                   ; ( "blocks",
                       Vector
                         [ mmap
                             [ "block/title", String "b1"
                             ; ( "build/properties",
                                 mmap [ property_id, Int 1779841453610 ] ) ] ] ) ] ] ) ])
  in
  let export_edn = build_export (db_of conn) [ "export-type", kw "graph" ] in
  let validation = Sqlite_export.validate_export export_edn in
  check (tname ^ ": no error") (validation.Sqlite_export.error = None);
  let prop_id =
    match ent_at_ident (db_of conn) property_id with
    | Some e -> e.id
    | None -> failwith "property missing"
  in
  let datoms = coll_items' (map_get_or_nil "datoms" export_edn) in
  check
    (tname ^ ": property type datom exported")
    (has_datom datoms (Int prop_id) (kw "logseq.property/type") (kw "datetime"))

let test_graph_export_uses_db_id_sorted_datoms () =
  let tname = "graph-export-uses-db-id-sorted-datoms" in
  let conn =
    create_conn_with_import_map
      (mmap
         [ ( "properties",
             mmap [ "user.property/p1", mmap [ "logseq.property/type", kw "default" ] ] )
         ; ( "pages-and-blocks",
             Vector
               [ mmap
                   [ "page", mmap [ "block/title", String "page1" ]
                   ; ( "blocks",
                       Vector
                         [ mmap
                             [ "block/title", String "b1"
                             ; ( "build/properties",
                                 mmap [ "user.property/p1", String "ok" ] ) ] ] ) ] ] ) ])
  in
  let export_edn = build_export (db_of conn) [ "export-type", kw "graph" ] in
  let datoms_v = map_get_or_nil "datoms" export_edn in
  let datoms = coll_items' datoms_v in
  check
    (tname ^ ": export-type is :graph")
    (v_eq (map_get_or_nil Sqlite_export.k_export_type export_edn) (kw "graph"));
  check
    (tname ^ ": graph-format is :datoms")
    (v_eq (map_get_or_nil Sqlite_export.k_graph_format export_edn) (kw "datoms"));
  check (tname ^ ": datoms is a vector") (match datoms_v with Vector _ -> true | _ -> false);
  check (tname ^ ": datoms is non-empty") (datoms <> []);
  check
    (tname ^ ": every datom is a 3-elem vector")
    (List.for_all (fun d -> match d with Vector xs -> List.length xs = 3 | _ -> false) datoms);
  check
    (tname ^ ": no :pages-and-blocks")
    (map_get "pages-and-blocks" export_edn = None);
  let eids =
    List.filter_map
      (fun d -> match coll_items' d with Int e :: _ -> Some e | _ -> None)
      datoms
  in
  check
    (tname ^ ": Graph EDN datoms should be sorted by db id")
    (List.stable_sort compare eids = eids);
  let b1_id =
    match find_block_by_content (db_of conn) "b1" with
    | Some e -> e.id
    | None -> failwith "b1 missing"
  in
  check
    (tname ^ ": b1 title datom present")
    (has_datom datoms (Int b1_id) (kw "block/title") (String "b1"))

let test_graph_export_omits_local_metadata_datoms () =
  let tname = "graph-export-omits-local-metadata-datoms" in
  let excluded_kvs =
    [ "logseq.kv/local-graph-uuid"; "logseq.kv/graph-uuid"; "logseq.kv/graph-local-tx"
    ; "logseq.kv/remote-schema-version"; "logseq.kv/graph-rtc-e2ee?"
    ; "logseq.kv/graph-remote?"; "logseq.kv/import-type"; "logseq.kv/imported-at"
    ; "logseq.kv/graph-backup-folder"; "logseq.kv/graph-last-gc-at"
    ; "logseq.kv/graph-git-sha" ]
  in
  let excluded_attrs =
    [ "block/tx-id"; "logseq.property.embedding/hnsw-label"
    ; "logseq.property.embedding/hnsw-label-updated-at"
    ; "logseq.property/created-by-ref"; "logseq.property.user/email"
    ; "logseq.property.user/name"; "logseq.property.user/avatar" ]
  in
  let conn =
    create_conn_with_import_map
      (mmap
         [ ( "pages-and-blocks",
             Vector
               [ mmap
                   [ "page", mmap [ "block/title", String "page1" ]
                   ; "blocks", Vector [ mmap [ "block/title", String "b1" ] ] ] ] ) ])
  in
  let block_id =
    match find_block_by_content (db_of conn) "b1" with
    | Some e -> e.id
    | None -> failwith "b1 missing"
  in
  let user_uuid = Db_test_util.gen_uuid () in
  ignore
    (transact_vals conn
       (List.map
          (fun ident ->
            mmap [ "db/ident", kw ident; "kv/value", String (":" ^ ident) ])
          excluded_kvs
        @ [ mmap
              [ "block/uuid", Uuid user_uuid
              ; "block/title", String "Alice"
              ; "logseq.property.user/email", String "alice@example.com"
              ; "logseq.property.user/name", String "Alice"
              ; "logseq.property.user/avatar", String "avatar.png" ]
          ; mmap
              [ "db/id", Int block_id
              ; "block/tx-id", Int 7
              ; "logseq.property.embedding/hnsw-label", String "label"
              ; "logseq.property.embedding/hnsw-label-updated-at", Int 8
              ; "logseq.property/created-by-ref", uuid_ref user_uuid ] ]));
  let datoms =
    coll_items' (map_get_or_nil "datoms" (build_export (db_of conn) [ "export-type", kw "graph" ]))
  in
  check
    (tname ^ ": block title kept")
    (has_datom datoms (Int block_id) (kw "block/title") (String "b1"));
  List.iter
    (fun ident ->
      let kv_eid =
        match ent_at_ident (db_of conn) ident with
        | Some e -> e.id
        | None -> failwith ("kv entity missing: " ^ ident)
      in
      check
        (tname ^ ": " ^ ident ^ " entity datoms should not be exported")
        (not
           (List.exists
              (fun d -> match coll_items' d with Int e :: _ -> e = kv_eid | _ -> false)
              datoms)))
    excluded_kvs;
  List.iter
    (fun a ->
      check
        (tname ^ ": " ^ a ^ " datoms should not be exported")
        (not (has_datom_attr datoms (kw a))))
    excluded_attrs

let test_graph_datom_export_import_is_idempotent () =
  let tname = "graph-datom-export-import-is-idempotent" in
  let closed_value_uuid = Db_test_util.gen_uuid () in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ ( "user.property/closed",
                mmap
                  [ "logseq.property/type", kw "default"
                  ; ( "build/closed-values",
                      Vector
                        [ mmap [ "value", String "closed"; "uuid", Uuid closed_value_uuid ] ] ) ] ) ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "b1"
                          ; ( "build/properties",
                              mmap [ "user.property/closed", uuid_ref closed_value_uuid ] ) ] ] ) ] ] ) ]
  in
  let conn = create_conn_with_import_map original_data in
  let export_edn = build_export (db_of conn) [ "export-type", kw "graph" ] in
  let valid_result = Sqlite_export.validate_export export_edn in
  (match valid_result.Sqlite_export.error with
   | Some _ ->
       check (tname ^ ": No error when importing export-edn into a new graph") false
   | None ->
       let vdb = Option.get valid_result.Sqlite_export.valid_db in
       validate_db tname vdb;
       let export_edn2 = build_export vdb [ "export-type", kw "graph" ] in
       check
         (tname ^ ": graph-format is :datoms")
         (v_eq (map_get_or_nil Sqlite_export.k_graph_format export_edn) (kw "datoms"));
       check
         (tname ^ ": No diff between original datom export and export after importing into a new graph")
         (Sqlite_export.diff_exports export_edn export_edn2 = None))

let test_graph_datom_import_replaces_seeded_data () =
  let tname = "graph-datom-import-replaces-seeded-data" in
  let source_conn = Datascript.create_conn ~schema:(Db_schema.schema ()) () in
  ignore
    (transact_vals source_conn
       [ mmap [ "db/id", Int 1; "block/uuid", Uuid (Db_test_util.gen_uuid ()) ] ]);
  ignore
    (transact_vals source_conn [ Vector [ kw "db/retractEntity"; Int 1 ] ]);
  ignore
    (Datascript.transact_conn source_conn
       (Sqlite_create_graph.initial_tx_data
          ~db:(Datascript.db source_conn) ~config_content:"{}" ()));
  let export_edn = build_export (db_of source_conn) [ "export-type", kw "graph" ] in
  let valid_result = Sqlite_export.validate_export export_edn in
  check
    (tname ^ ": Datom import should replace seeded graph data before importing graph datoms")
    (valid_result.Sqlite_export.error = None);
  (match valid_result.Sqlite_export.valid_db with
   | Some vdb ->
       let export_edn2 = build_export vdb [ "export-type", kw "graph" ] in
       check
         (tname ^ ": No diff after importing datoms with built-in entities at different db ids")
         (Sqlite_export.diff_exports export_edn export_edn2 = None)
   | None -> ())

let test_graph_datom_import_applies_schema_datoms_before_values () =
  let tname = "graph-datom-import-applies-schema-datoms-before-values" in
  let conn = Sqlite_export.create_conn () in
  let export_edn =
    mmap
      [ Sqlite_export.k_export_type, kw "graph"
      ; Sqlite_export.k_graph_format, kw "datoms"
      ; ( "datoms",
          Vector
            [ Vector [ Int 1; kw "user.property/many"; String "a" ]
            ; Vector [ Int 1; kw "user.property/many"; String "b" ]
            ; Vector [ Int 2; kw "db/ident"; kw "user.property/many" ]
            ; Vector [ Int 2; kw "db/cardinality"; kw "db.cardinality/many" ] ] ) ]
  in
  (match Sqlite_export.build_import export_edn (db_of conn) None with
   | Ok txs -> ignore (transact_vals conn txs.init_tx)
   | Error e -> failwith e);
  let values =
    Set
      (List.of_seq
         (Datascript.datoms (db_of conn) Eavt ~e:1 ~a:"user.property/many" ())
       |> List.map (fun (d : datom) -> d.v))
  in
  check
    (tname ^ ": Datom import should apply dynamic schema datoms before values that use them")
    (v_eq values (Set [ String "a"; String "b" ]))

let test_graph_datom_import_applies_lookup_ref_targets_before_values () =
  let tname = "graph-datom-import-applies-lookup-ref-targets-before-values" in
  let conn = Sqlite_export.create_conn () in
  let target_uuid = Db_test_util.gen_uuid () in
  let export_edn =
    mmap
      [ Sqlite_export.k_export_type, kw "graph"
      ; Sqlite_export.k_graph_format, kw "datoms"
      ; ( "datoms",
          Vector
            [ Vector [ Int 1; kw "block/refs"; uuid_ref target_uuid ]
            ; Vector [ Int 2; kw "block/uuid"; Uuid target_uuid ] ] ) ]
  in
  (match Sqlite_export.build_import export_edn (db_of conn) None with
   | Ok txs -> ignore (transact_vals conn txs.init_tx)
   | Error e -> failwith e);
  check
    (tname ^ ": Datom import should apply lookup-ref targets before values that use them")
    (has_datom (all_datom_triples (db_of conn)) (Int 1) (kw "block/refs") (Int 2))

let test_validate_export_rejects_invalid_graph_datoms () =
  let tname = "validate-export-rejects-invalid-graph-datoms" in
  let validation =
    Sqlite_export.validate_export
      (mmap
         [ Sqlite_export.k_export_type, kw "graph"
         ; Sqlite_export.k_graph_format, kw "datoms"
         ; ( "datoms",
             Vector
               [ Vector [ Int 1; kw "block/title"; String "Orphan Page" ]
               ; Vector [ Int 1; kw "block/name"; String "orphan page" ]
               ; Vector
                   [ Int 1; kw "block/uuid"
                   ; Uuid "33333333-3333-4333-8333-000000000001" ]
               ; Vector [ Int 1; kw "block/tags"; Int 2 ]
               ; Vector [ Int 2; kw "block/title"; String "Page" ]
               ; Vector [ Int 2; kw "block/name"; String "page" ]
               ; Vector [ Int 2; kw "db/ident"; kw "logseq.class/Page" ]
               ; Vector
                   [ Int 2; kw "block/uuid"
                   ; Uuid "33333333-3333-4333-8333-000000000002" ] ] ) ])
  in
  check
    (tname ^ ": Datom import validation should reject invalid graph datoms")
    (match validation.Sqlite_export.error with Some _ -> true | None -> false);
  check
    (tname ^ ": Export validation error should describe exported EDN")
    (match validation.Sqlite_export.error with
     | Some e -> string_contains e "Exported EDN"
     | None -> false);
  check
    (tname ^ ": Invalid export validation should not return a transient DB snapshot")
    (validation.Sqlite_export.valid_db = None)

let test_graph_datom_export_resolves_lookup_ref_values () =
  let tname = "graph-datom-export-resolves-lookup-ref-values" in
  let conn = Datascript.create_conn ~schema:(Db_schema.schema ()) () in
  let target_uuid = Db_test_util.gen_uuid () in
  ignore
    (transact_vals conn
       [ Vector [ kw "db/add"; Int 1; kw "user.property/ref"; uuid_ref target_uuid ]
       ; Vector [ kw "db/add"; Int 2; kw "block/uuid"; Uuid target_uuid ] ]);
  let export_edn = build_export (db_of conn) [ "export-type", kw "graph" ] in
  let datoms = coll_items' (map_get_or_nil "datoms" export_edn) in
  check
    (tname ^ ": Graph datom export should normalize lookup-ref values to entity ids")
    (has_datom datoms (Int 1) (kw "user.property/ref") (Int 2));
  check
    (tname ^ ": Graph datom export should not keep lookup-ref values when the entity exists")
    (not (has_datom datoms (Int 1) (kw "user.property/ref") (uuid_ref target_uuid)))

let test_import_supports_legacy_structured_graph_edn () =
  let tname = "import-supports-legacy-structured-graph-edn" in
  let conn = Sqlite_export.create_conn () in
  let legacy_graph_export =
    mmap
      [ Sqlite_export.k_export_type, kw "graph"
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; "blocks", Vector [ mmap [ "block/title", String "b1" ] ] ] ] )
      ; ( Sqlite_export.k_graph_files,
          Vector
            [ mmap
                [ "file/path", String "logseq/config.edn"
                ; "file/content", String "{:foo :bar}" ] ] )
      ; ( Sqlite_export.k_kv_values,
          Vector
            [ mmap
                [ "db/ident", kw "logseq.kv/test-import"; "kv/value", String "ok" ] ] ) ]
  in
  (match Sqlite_export.build_import legacy_graph_export (db_of conn) None with
   | Ok txs -> ignore (transact_vals conn (Sqlite_export.import_tx_data txs))
   | Error e -> failwith e);
  validate_db tname (db_of conn);
  check
    (tname ^ ": page1 imported")
    (Db_test_util.find_page_by_title (db_of conn) "page1" <> None);
  check
    (tname ^ ": b1 imported")
    (find_block_by_content (db_of conn) "b1" <> None);
  let file_content =
    match
      List.of_seq
        (Datascript.datoms (db_of conn) Avet ~a:"file/path"
           ~v:(String "logseq/config.edn") ())
    with
    | d :: _ ->
        (match Ldb.ent_of_id (db_of conn) d.e with
         | Some e -> Ldb.string_value e "file/content"
         | None -> None)
    | [] -> None
  in
  check (tname ^ ": file content imported") (file_content = Some "{:foo :bar}");
  let kv_value =
    match ent_at_ident (db_of conn) "logseq.kv/test-import" with
    | Some e -> Ldb.string_value e "kv/value"
    | None -> None
  in
  check (tname ^ ": kv value imported") (kv_value = Some "ok")

let test_import_view_blocks () =
  let tname = "import-view-blocks" in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ "user.property/p1", mmap [ "logseq.property/type", kw "default" ]
            ; "user.property/p2", mmap [ "logseq.property/type", kw "default" ] ] )
      ; "classes", mmap [ "user.class/class1", mmap [] ]
      ; ( "pages-and-blocks",
          Vector
            [ mmap [ "page", mmap [ "block/title", String "page1" ] ]
            ; mmap [ "page", mmap [ "build/journal", Int 20250226 ] ]
            ; mmap
                [ "page", mmap [ "block/title", String "page2" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "b1"
                          ; "build/properties", mmap [ "user.property/p2", String "ok" ] ] ] ) ] ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let get_node_ids (db : db) : value list =
    [ ent_at_ident db "user.property/p1"
    ; ent_at_ident db "user.class/class1"
    ; Db_test_util.find_page_by_title db "page1"
    ; Db_test_util.find_journal_by_journal_day db 20250226
    ; find_block_by_content db "b1" ]
    |> List.filter_map Fun.id
    |> List.map (fun e -> uuid_ref (ent_uuid e))
  in
  let conn2 =
    create_conn_with_import_map
      (build_export (db_of conn)
         [ "export-type", kw "view-nodes"
         ; "rows", Vector (get_node_ids (db_of conn)) ])
  in
  validate_db tname (db_of conn2);
  let imported_nodes =
    build_export (db_of conn2)
      [ "export-type", kw "view-nodes"; "rows", Vector (get_node_ids (db_of conn2)) ]
  in
  check
    (tname ^ ": pages-and-blocks")
    (v_eq
       (sort_pages_and_blocks (map_get_or_nil "pages-and-blocks" original_data))
       (map_get_or_nil "pages-and-blocks" imported_nodes));
  check
    (tname ^ ": properties")
    (v_eq
       (expand_properties (map_get_or_nil "properties" original_data))
       (map_get_or_nil "properties" imported_nodes));
  check
    (tname ^ ": classes")
    (v_eq
       (expand_classes (map_get_or_nil "classes" original_data))
       (map_get_or_nil "classes" imported_nodes))

let test_export_grouped_view_nodes_by_uuid () =
  let tname = "export-grouped-view-nodes-by-uuid" in
  let conn =
    create_conn_with_blocks
      (mmap
         [ ( "pages-and-blocks",
             Vector
               [ mmap
                   [ "page", mmap [ "block/title", String "page" ]
                   ; ( "blocks",
                       Vector
                         [ mmap [ "block/title", String "Alpha" ]
                         ; mmap [ "block/title", String "Beta" ] ] ) ] ] ) ])
  in
  let block_uuids =
    List.map
      (fun title ->
        match find_block_by_content (db_of conn) title with
        | Some e -> Uuid (ent_uuid e)
        | None -> failwith (title ^ " missing"))
      [ "Alpha"; "Beta" ]
  in
  let exported =
    build_export (db_of conn)
      [ "export-type", kw "view-nodes"
      ; "rows", Vector [ Vector [ String "group"; Vector block_uuids ] ]
      ; "group-by?", Bool true ]
  in
  let titles =
    coll_items' (map_get_or_nil "pages-and-blocks" exported)
    |> List.concat_map (fun pab -> coll_items' (map_get_or_nil "blocks" pab))
    |> List.filter_map (fun b ->
           match map_get "block/title" b with Some (String s) -> Some s | _ -> None)
    |> List.sort compare
  in
  check (tname ^ ": grouped titles") (titles = [ "Alpha"; "Beta" ])

let test_import_selected_nodes () =
  let tname = "import-selected-nodes" in
  let original_data =
    mmap
      [ ( "properties",
          mmap [ "user.property/p1", mmap [ "logseq.property/type", kw "default" ] ] )
      ; "classes", mmap [ "user.class/class1", mmap [] ]
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "b1"
                          ; "build/properties", mmap [ "user.property/p1", String "ok" ]
                          ; "build/children", Vector [ mmap [ "block/title", String "b2" ] ] ]
                      ; mmap
                          [ "block/title", String "b3"
                          ; "build/tags", Set [ kw "user.class/class1" ]
                          ; "build/children", Vector [ mmap [ "block/title", String "b4" ] ] ] ] ) ]
            ; mmap
                [ "page", mmap [ "block/title", String "page2" ]
                ; "blocks", Vector [ mmap [ "block/title", String "dont export" ] ] ] ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let get_node_ids (db : db) : value list =
    [ find_block_by_content db "b1"
    ; Db_test_util.find_page_by_title db "b3"
    ; Db_test_util.find_page_by_title db "page2" ]
    |> List.filter_map Fun.id
    |> List.map (fun e -> uuid_ref (ent_uuid e))
  in
  let conn2 =
    create_conn_with_import_map
      (build_export (db_of conn)
         [ "export-type", kw "selected-nodes"
         ; "node-ids", Vector (get_node_ids (db_of conn)) ])
  in
  validate_db tname (db_of conn2);
  let imported_nodes =
    build_export (db_of conn2)
      [ "export-type", kw "selected-nodes"
      ; "node-ids", Vector (get_node_ids (db_of conn2)) ]
  in
  let expected_pabs =
    match map_get_or_nil "pages-and-blocks" original_data with
    | Vector pabs ->
        Vector
          (List.map
             (fun pab ->
               if v_eq (get_in_or_nil pab [ GK "page"; GK "block/title" ]) (String "page2")
               then map_dissoc "blocks" pab
               else pab)
             pabs)
    | v -> v
  in
  check
    (tname ^ ": pages-and-blocks")
    (v_eq expected_pabs (map_get_or_nil "pages-and-blocks" imported_nodes));
  check
    (tname ^ ": properties")
    (v_eq
       (expand_properties (map_get_or_nil "properties" original_data))
       (map_get_or_nil "properties" imported_nodes));
  check
    (tname ^ ": classes")
    (v_eq
       (expand_classes (map_get_or_nil "classes" original_data))
       (map_get_or_nil "classes" imported_nodes))

let test_export_selected_nodes_with_missing_node () =
  let tname = "export-selected-nodes-with-missing-node" in
  let conn =
    create_conn_with_blocks
      (mmap
         [ ( "pages-and-blocks",
             Vector
               [ mmap
                   [ "page", mmap [ "block/title", String "page1" ]
                   ; "blocks", Vector [ mmap [ "block/title", String "b1" ] ] ] ] ) ])
  in
  let block =
    match find_block_by_content (db_of conn) "b1" with
    | Some e -> e
    | None -> failwith "b1 missing"
  in
  let result =
    try
      `Export
        (build_export (db_of conn)
           [ "export-type", kw "selected-nodes"
           ; ( "node-ids",
               Vector [ uuid_ref (ent_uuid block); uuid_ref (Db_test_util.gen_uuid ()) ] ) ])
    with e -> `Error (Printexc.to_string e)
  in
  check
    (tname ^ ": no error")
    (match result with `Error _ -> false | `Export _ -> true);
  check
    (tname ^ ": Selected nodes export is present")
    (match result with `Export _ -> true | `Error _ -> false);
  (match result with
   | `Export export ->
       let titles =
         Vector
           (coll_items' (map_get_or_nil "pages-and-blocks" export)
            |> List.concat_map (fun pab -> coll_items' (map_get_or_nil "blocks" pab))
            |> List.map (fun b -> map_get_or_nil "block/title" b))
       in
       check (tname ^ ": exported titles") (v_eq titles (Vector [ String "b1" ]));
       check
         (tname ^ ": export validates")
         ((Sqlite_export.validate_export export).Sqlite_export.error = None)
   | `Error _ -> ())

(* cljs build-original-graph-data *)
let build_original_graph_data ?(exclude_namespaces = false)
    ?(add_built_in_pages = true) () : value =
  let internal_block_uuid = Db_test_util.gen_uuid () in
  let favorited_uuid = Db_test_util.gen_uuid () in
  let block_pvalue_uuid = Db_test_util.gen_uuid () in
  let property_pvalue_uuid = Db_test_util.gen_uuid () in
  let page_pvalue_uuid = Db_test_util.gen_uuid () in
  let page_object_uuid = Db_test_util.gen_uuid () in
  let page_alias_uuid = Db_test_util.gen_uuid () in
  let closed_value_uuid = Db_test_util.gen_uuid () in
  let property_uuid = Db_test_util.gen_uuid () in
  let class_uuid = Db_test_util.gen_uuid () in
  let class_alias_uuid = Db_test_util.gen_uuid () in
  let class2_uuid = Db_test_util.gen_uuid () in
  let journal_uuid = Common_uuid.gen_journal_page_uuid 19650201 in
  let pref s = Page_ref.to_page_ref s in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ ( "user.property/num",
                mmap
                  [ "logseq.property/type", kw "number"
                  ; "block/uuid", Uuid property_uuid
                  ; "build/keep-uuid?", Bool true
                  ; "block/collapsed?", Bool true
                  ; ( "build/properties",
                      if exclude_namespaces then mmap []
                      else
                        mmap
                          [ "user.property/node", Set [ uuid_ref property_pvalue_uuid ]
                          ; "logseq.property/default-value", Int 42 ] ) ] )
            ; ( "user.property/default-closed",
                mmap
                  [ "logseq.property/type", kw "default"
                  ; "db/cardinality", kw "db.cardinality/many"
                  ; ( "build/closed-values",
                      Vector
                        [ mmap [ "value", String "joy"; "uuid", Uuid closed_value_uuid ]
                        ; mmap [ "value", String "sad"; "uuid", Uuid (Db_test_util.gen_uuid ()) ] ] ) ] )
            ; "user.property/checkbox", mmap [ "logseq.property/type", kw "checkbox" ]
            ; "user.property/date", mmap [ "logseq.property/type", kw "date" ]
            ; ( "user.property/url",
                mmap
                  [ "logseq.property/type", kw "url"
                  ; ( "build/properties",
                      mmap [ "logseq.property/description", String "desc for url" ] ) ] )
            ; ( "user.property/node",
                mmap
                  [ "logseq.property/type", kw "node"
                  ; "db/cardinality", kw "db.cardinality/many"
                  ; "build/property-classes", Vector [ kw "user.class/MyClass" ] ] ) ] )
      ; ( "classes",
          mmap
            [ ( "user.class/MyClass",
                let base =
                  mmap
                    [ ( "build/properties",
                        mmap [ "user.property/url", String "https://example.com/MyClass" ] )
                    ; "block/uuid", Uuid class_uuid
                    ; "build/keep-uuid?", Bool true ]
                in
                if exclude_namespaces then base
                else map_put "block/alias" (Set [ uuid_ref class_alias_uuid ]) base )
            ; ( "user.class/MyClassAlias",
                mmap [ "block/uuid", Uuid class_alias_uuid; "build/keep-uuid?", Bool true ] )
            ; ( "user.class/MyClass2",
                mmap
                  [ "build/class-extends", Vector [ kw "user.class/MyClass" ]
                  ; "block/collapsed?", Bool true
                  ; "block/uuid", Uuid class2_uuid
                  ; "build/keep-uuid?", Bool true
                  ; ( "build/properties",
                      mmap [ "logseq.property/description", String "tests child class" ] ) ] ) ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ ( "page",
                    mmap
                      [ "block/title", String "page1"
                      ; "block/uuid", Uuid favorited_uuid
                      ; "build/keep-uuid?", Bool true
                      ; ( "build/properties",
                          mmap
                            [ "user.property/checkbox", Bool false
                            ; "user.property/node", Set [ uuid_ref page_pvalue_uuid ] ] ) ] )
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "b1"
                          ; ( "build/properties",
                              mmap
                                [ "user.property/num", Int 1
                                ; "user.property/default-closed", Set [ uuid_ref closed_value_uuid ]
                                ; "user.property/date", uuid_ref journal_uuid ] ) ]
                      ; mmap
                          [ "block/title", String "b2"
                          ; ( "build/properties",
                              mmap [ "user.property/node", Set [ uuid_ref page_object_uuid ] ] ) ]
                      ; mmap
                          [ "block/title", String "b3"
                          ; ( "build/properties",
                              mmap [ "user.property/node", Set [ uuid_ref page_object_uuid ] ] ) ]
                      ; mmap
                          [ "block/title", String "Example advanced query"
                          ; "build/tags", Set [ kw "logseq.class/Query" ]
                          ; ( "build/properties",
                              mmap
                                [ ( "logseq.property/query",
                                    mmap
                                      [ "build/property-value", kw "block"
                                      ; "block/title", String "{:query (task Todo)}"
                                      ; ( "build/properties",
                                          mmap
                                            [ "logseq.property.code/lang", String "clojure"
                                            ; "logseq.property.node/display-type", kw "code" ] ) ] ) ] ) ]
                      ; mmap
                          [ "block/title", String "block has property value with tags and properties"
                          ; ( "build/properties",
                              mmap
                                [ ( "user.property/url",
                                    mmap
                                      [ "build/property-value", kw "block"
                                      ; "block/title", String "https://example.com"
                                      ; "build/tags", Set [ kw "user.class/MyClass" ] ] ) ] ) ] ] ) ]
            ; mmap
                [ ( "page",
                    mmap
                      [ "block/title", String "page object"
                      ; "block/uuid", Uuid page_object_uuid
                      ; "build/keep-uuid?", Bool true ] )
                ; "blocks", Vector [] ]
            ; mmap
                [ ( "page",
                    mmap
                      [ "block/title", String "page2"
                      ; "build/tags", Set [ kw "user.class/MyClass2" ] ] )
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "hola"
                          ; "block/uuid", Uuid internal_block_uuid
                          ; "build/keep-uuid?", Bool true ]
                      ; mmap
                          [ "block/title", String "myclass object 1"
                          ; "build/tags", Set [ kw "user.class/MyClass" ]
                          ; "block/uuid", Uuid block_pvalue_uuid
                          ; "build/keep-uuid?", Bool true ]
                      ; (let b =
                           mmap
                             [ "block/title", String "myclass object 2"
                             ; "build/tags", Set [ kw "user.class/MyClass" ] ]
                         in
                         if exclude_namespaces then b
                         else
                           merge_maps b
                             (mmap
                                [ "block/uuid", Uuid property_pvalue_uuid
                                ; "build/keep-uuid?", Bool true ]))
                      ; mmap
                          [ "block/title", String "myclass object 3"
                          ; "build/tags", Set [ kw "user.class/MyClass" ]
                          ; "block/uuid", Uuid page_pvalue_uuid
                          ; "build/keep-uuid?", Bool true ]
                      ; mmap
                          [ "block/title", String "ref blocks"
                          ; "block/collapsed?", Bool true
                          ; ( "build/children",
                              Vector
                                [ mmap
                                    [ ( "block/title",
                                        String ("internal block ref to " ^ pref internal_block_uuid) ) ]
                                ; mmap
                                    [ "block/title", String "node block"
                                    ; ( "build/properties",
                                        mmap
                                          [ "user.property/node", Set [ uuid_ref block_pvalue_uuid ] ] ) ]
                                ; mmap
                                    [ ( "block/title",
                                        String ("property ref to " ^ pref property_uuid) ) ]
                                ; mmap
                                    [ ( "block/title",
                                        String ("class ref to " ^ pref class_uuid) ) ] ] ) ] ] ) ]
            ; mmap
                [ ( "page",
                    mmap
                      [ "block/title", String "Alias for 2/28"
                      ; "block/uuid", Uuid page_alias_uuid
                      ; "build/keep-uuid?", Bool true ] )
                ; "blocks", Vector [] ]
            ; mmap
                [ ( "page",
                    mmap
                      [ "build/journal", Int 20250228
                      ; "block/alias", Set [ uuid_ref page_alias_uuid ]
                      ; "build/properties", mmap [ "user.property/num", Int 1 ] ] )
                ; "blocks", Vector [ mmap [ "block/title", String "journal block" ] ] ]
            ; mmap
                [ ( "page",
                    mmap
                      [ "build/journal", Int 19650201
                      ; "block/uuid", Uuid journal_uuid
                      ; "build/keep-uuid?", Bool true ] )
                ; "blocks", Vector [] ]
            ; mmap
                [ "page", mmap [ "block/uuid", Uuid class_uuid ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "class block1"
                          ; "build/children", Vector [ mmap [ "block/title", String "class block2" ] ] ] ] ) ]
            ; mmap
                [ "page", mmap [ "block/uuid", Uuid class2_uuid ]
                ; "blocks", Vector [ mmap [ "block/title", String "class2 block1" ] ] ]
            ; mmap
                [ "page", mmap [ "block/uuid", Uuid property_uuid ]
                ; "blocks", Vector [ mmap [ "block/title", String "property block1" ] ] ] ] )
      ; ( Sqlite_export.k_graph_files,
          Vector
            [ mmap [ "file/path", String "logseq/config.edn"; "file/content", String "{:foo :bar}" ]
            ; mmap
                [ "file/path", String "logseq/custom.css"
                ; "file/content", String ".foo {background-color: blue}" ]
            ; mmap [ "file/path", String "logseq/custom.js"; "file/content", String "// comment" ]
            ; mmap [ "file/path", String "logseq/publish.css"; "file/content", String "" ]
            ; mmap [ "file/path", String "logseq/publish.js"; "file/content", String "" ] ] )
      ; "build-existing-tx?", Bool true ]
  in
  let built_in_pages =
    [ mmap
        [ ( "page",
            mmap
              [ "block/title", String "Library"
              ; "build/properties", mmap [ "logseq.property/built-in?", Bool true ] ] )
        ; "blocks", Vector [] ]
    ; mmap
        [ ( "page",
            mmap
              [ "block/title", String "Quick add"
              ; ( "build/properties",
                  mmap
                    [ "logseq.property/built-in?", Bool true
                    ; "logseq.property/hide?", Bool true ] ) ] )
        ; "blocks", Vector [] ]
    ; mmap
        [ ( "page",
            mmap
              [ "block/title", String "Recycle"
              ; ( "build/properties",
                  mmap
                    [ "logseq.property/built-in?", Bool true
                    ; "logseq.property/hide?", Bool true ] ) ] )
        ; "blocks", Vector [] ]
    ; mmap
        [ ( "page",
            mmap
              [ "block/title", String "Contents"
              ; "build/properties", mmap [ "logseq.property/built-in?", Bool true ] ] )
        ; "blocks", Vector [ mmap [ "block/title", String "right sidebar" ] ] ]
    ; mmap
        [ ( "page",
            mmap
              [ "block/title", String Common_config.favorites_page_name
              ; ( "build/properties",
                  mmap
                    [ "logseq.property/built-in?", Bool true
                    ; "logseq.property/hide?", Bool true ] ) ] )
        ; "blocks", Vector [ mmap (Ldb.build_favorite_tx favorited_uuid) ] ]
    ; mmap
        [ ( "page",
            mmap
              [ "block/title", String Common_config.views_page_name
              ; ( "build/properties",
                  mmap
                    [ "logseq.property/built-in?", Bool true
                    ; "logseq.property/hide?", Bool true ] ) ] )
        ; ( "blocks",
            Vector
              [ mmap
                  [ "block/title", String "All"
                  ; ( "build/properties",
                      mmap
                        [ "logseq.property/view-for", kw "logseq.class/Task"
                        ; "logseq.property.view/feature-type", kw "class-objects" ] ) ]
              ; mmap
                  [ "block/title", String "All"
                  ; ( "build/properties",
                      mmap
                        [ "logseq.property/view-for", kw "user.class/MyClass"
                        ; "logseq.property.view/feature-type", kw "class-objects" ] ) ]
              ; mmap
                  [ "block/title", String "Linked references"
                  ; ( "build/properties",
                      mmap
                        [ "logseq.property.view/type", kw "logseq.property.view/type.list"
                        ; "logseq.property.view/feature-type", kw "linked-references"
                        ; "logseq.property/view-for", uuid_ref journal_uuid ] ) ] ] ) ] ]
  in
  if add_built_in_pages then
    update_in original_data [ GK "pages-and-blocks" ]
      (fun pabs -> Vector (coll_items' pabs @ built_in_pages))
  else original_data

let test_import_graph () =
  let tname = "import-graph" in
  let original_data = build_original_graph_data () in
  let conn = create_conn_with_import_map original_data in
  (* set to an unobtainable version to test this ident *)
  ignore
    (transact_vals conn
       [ mmap
           [ "db/ident", kw "logseq.kv/schema-version"
           ; ( "kv/value",
               mmap [ "major", Int 1; "minor", Int 0 ] ) ] ]);
  let export_map =
    build_export (db_of conn) [ "export-type", kw graph_export_type ]
  in
  let conn2 = Sqlite_export.create_conn () in
  let imported_graph =
    export_graph_and_import_to_another_graph tname (mmap []) conn conn2
  in
  check
    (tname ^ ": No diff between original datom export and export after importing into a new graph")
    (Sqlite_export.diff_exports export_map imported_graph = None);
  check
    (tname ^ ": No duplicate pages for pvalue uuids used more than once")
    (avet_count (db_of conn2) "block/title" (String "page object") = 1);
  (* :graph-human intentionally strips :logseq.kv/schema-version from exports *)
  if graph_export_type = "graph" then
    check
      (tname ^ ": Raw datom import preserves kv values exactly")
      (let v1 =
         match ent_at_ident (db_of conn) "logseq.kv/schema-version" with
         | Some e -> Ldb.value e "kv/value"
         | None -> None
       and v2 =
         match ent_at_ident (db_of conn2) "logseq.kv/schema-version" with
         | Some e -> Ldb.value e "kv/value"
         | None -> None
       in
       v_eq_opt v1 v2)

let test_import_graph_with_timestamps () =
  let tname = "import-graph-with-timestamps" in
  let original_data' = build_original_graph_data () in
  let original_data =
    original_data'
    |> fun v ->
    update_in v [ GK "pages-and-blocks" ]
      (fun pabs ->
        postwalk
          (fun x ->
            match x with
            | Map _
              when map_get "block/title" x <> None || map_get "build/journal" x <> None ->
                block_with_timestamps_v x
            | _ -> x)
          pabs)
    |> fun v -> update_in v [ GK "classes" ] (update_vals block_with_timestamps_v)
    |> fun v -> update_in v [ GK "properties" ] (update_vals block_with_timestamps_v)
    |> fun v ->
    update_in v [ GK Sqlite_export.k_graph_files ]
      (fun files ->
        match files with
        | Vector fs ->
            Vector
              (List.map
                 (fun f ->
                   let now = Instant (Date_time_util.time_ms ()) in
                   merge_maps f
                     (mmap [ "file/created-at", now; "file/last-modified-at", now ]))
                 fs)
        | v -> v)
  in
  let conn = create_conn_with_import_map original_data in
  let export_map =
    build_export (db_of conn)
      [ "export-type", kw graph_export_type
      ; "graph-options", mmap [ "include-timestamps?", Bool true ] ]
  in
  let conn2 = Sqlite_export.create_conn () in
  let imported_graph =
    export_graph_and_import_to_another_graph tname
      (mmap [ "include-timestamps?", Bool true ]) conn conn2
  in
  check
    (tname ^ ": No diff between original datom export and export after importing into a new graph")
    (Sqlite_export.diff_exports export_map imported_graph = None)

let test_import_graph_with_exclude_namespaces () =
  let tname = "import-graph-with-exclude-namespaces" in
  let original_data = build_original_graph_data ~exclude_namespaces:true () in
  let conn = create_conn_with_import_map original_data in
  let export_map =
    build_export (db_of conn)
      [ "export-type", kw graph_export_type
      ; "graph-options", mmap [ "exclude-namespaces", Set [ kw "user" ] ] ]
  in
  (* :graph-human drops the excluded namespace from the export *)
  let conn2 =
    if graph_export_type = "graph-human" then
      create_conn_with_blocks
        (mmap
           [ ( "properties",
               update_vals (map_dissoc "build/properties")
                 (map_get_or_nil "properties" original_data) )
           ; ( "classes",
               update_vals (map_dissoc "build/properties")
                 (map_get_or_nil "classes" original_data) ) ])
    else Sqlite_export.create_conn ()
  in
  let imported_graph =
    export_graph_and_import_to_another_graph tname
      (mmap [ "exclude-namespaces", Set [ kw "user" ] ]) conn conn2
  in
  check
    (tname ^ ": Graph export with :exclude-namespaces roundtrips exactly")
    (Sqlite_export.diff_exports export_map imported_graph = None)

let test_graph_is_idempotent_across_import_and_export () =
  let tname = "graph-is-idempotent-across-import-and-export" in
  let original_data = build_original_graph_data () in
  let conn = create_conn_with_import_map original_data in
  let export_map = build_export (db_of conn) [ "export-type", kw graph_export_type ] in
  let valid_result = Sqlite_export.validate_export export_map in
  (match valid_result.Sqlite_export.error with
   | Some _ ->
       check (tname ^ ": No error when importing export-map into new graph") false
   | None ->
       let vdb = Option.get valid_result.Sqlite_export.valid_db in
       validate_db tname vdb;
       let export_map2 = build_export vdb [ "export-type", kw graph_export_type ] in
       check
         (tname ^ ": No diff between original export and export after importing into a new graph")
         (Sqlite_export.diff_exports export_map export_map2 = None))

let test_graph_with_property_alias_is_idempotent () =
  let tname = "graph-with-property-alias-is-idempotent" in
  let property_alias_uuid = Db_test_util.gen_uuid () in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ ( "user.property/referrerURL",
                mmap
                  [ "logseq.property/type", kw "default"
                  ; "block/alias", Set [ uuid_ref property_alias_uuid ] ] ) ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ ( "page",
                    mmap
                      [ "block/title", String "Referrer"
                      ; "block/uuid", Uuid property_alias_uuid
                      ; "build/keep-uuid?", Bool true ] )
                ; "blocks", Vector [] ] ] ) ]
  in
  let conn = create_conn_with_import_map original_data in
  let export_map = build_export (db_of conn) [ "export-type", kw graph_export_type ] in
  let valid_result = Sqlite_export.validate_export export_map in
  (match valid_result.Sqlite_export.error with
   | Some _ ->
       check (tname ^ ": No error when importing export-map into new graph") false
   | None ->
       let vdb = Option.get valid_result.Sqlite_export.valid_db in
       validate_db tname vdb;
       let export_map2 = build_export vdb [ "export-type", kw graph_export_type ] in
       check
         (tname ^ ": Property's :block/alias is preserved after import")
         (match ent_at_ident (db_of conn) "user.property/referrerURL" with
          | Some e -> Ldb.ref_ents e "block/alias" <> []
          | None -> false);
       check
         (tname ^ ": Property's :block/alias is present after datom import")
         (match ent_at_ident vdb "user.property/referrerURL" with
          | Some e -> Ldb.ref_ents e "block/alias" <> []
          | None -> false);
       check
         (tname ^ ": No diff between original export and export after importing into a new graph")
         (Sqlite_export.diff_exports export_map export_map2 = None))

let test_import_graph_preserves_property_history () =
  let tname = "import-graph-preserves-property-history" in
  let now = Int64.to_int (Date_time_util.time_ms ()) in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ "user.property/num", mmap [ "logseq.property/type", kw "number" ]
            ; ( "user.property/node",
                mmap [ "logseq.property/type", kw "node"; "db/cardinality", kw "db.cardinality/many" ] ) ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "num block"
                          ; "build/properties", mmap [ "user.property/num", Int 44 ] ]
                      ; mmap
                          [ "block/title", String "status block"
                          ; ( "build/properties",
                              mmap [ "logseq.property/status", kw "logseq.property/status.doing" ] ) ]
                      ; mmap [ "block/title", String "node block" ]
                      ; mmap [ "block/title", String "object 1" ]
                      ; mmap [ "block/title", String "object 2" ] ] ) ] ] ) ]
  in
  let conn = create_conn_with_import_map original_data in
  let block_uuid_of title =
    match find_block_by_content (db_of conn) title with
    | Some e -> ent_uuid e
    | None -> failwith (title ^ " missing")
  in
  let num_block_uuid = block_uuid_of "num block" in
  let status_block_uuid = block_uuid_of "status block" in
  let node_block_uuid = block_uuid_of "node block" in
  let object1_uuid = block_uuid_of "object 1" in
  let object2_uuid = block_uuid_of "object 2" in
  let original_property_history =
    [ mmap
        [ "block/uuid", Uuid (Db_test_util.gen_uuid ())
        ; "block/created-at", Int now
        ; "logseq.property.history/block", uuid_ref num_block_uuid
        ; "logseq.property.history/property", kw "user.property/num"
        ; "logseq.property.history/scalar-value", Int 42 ]
    ; mmap
        [ "block/uuid", Uuid (Db_test_util.gen_uuid ())
        ; "block/created-at", Int (now + 1000)
        ; "logseq.property.history/block", uuid_ref num_block_uuid
        ; "logseq.property.history/property", kw "user.property/num"
        ; "logseq.property.history/scalar-value", Int 44 ]
    ; mmap
        [ "block/uuid", Uuid (Db_test_util.gen_uuid ())
        ; "block/created-at", Int now
        ; "logseq.property.history/block", uuid_ref node_block_uuid
        ; "logseq.property.history/property", kw "user.property/node"
        ; "logseq.property.history/ref-value", uuid_ref object1_uuid ]
    ; mmap
        [ "block/uuid", Uuid (Db_test_util.gen_uuid ())
        ; "block/created-at", Int (now + 1000)
        ; "logseq.property.history/block", uuid_ref node_block_uuid
        ; "logseq.property.history/property", kw "user.property/node"
        ; "logseq.property.history/ref-value", uuid_ref object2_uuid ]
    ; mmap
        [ "block/uuid", Uuid (Db_test_util.gen_uuid ())
        ; "block/created-at", Int now
        ; "logseq.property.history/block", uuid_ref status_block_uuid
        ; "logseq.property.history/property", kw "logseq.property/status"
        ; "logseq.property.history/ref-value", kw "logseq.property/status.todo" ]
    ; mmap
        [ "block/uuid", Uuid (Db_test_util.gen_uuid ())
        ; "block/created-at", Int (now + 1000)
        ; "logseq.property.history/block", uuid_ref status_block_uuid
        ; "logseq.property.history/property", kw "logseq.property/status"
        ; "logseq.property.history/ref-value", kw "logseq.property/status.doing" ] ]
  in
  ignore (transact_vals conn original_property_history);
  let export_map = build_export (db_of conn) [ "export-type", kw graph_export_type ] in
  let valid_result = Sqlite_export.validate_export export_map in
  (match valid_result.Sqlite_export.error with
   | Some _ ->
       check (tname ^ ": No error when importing export-map into new graph") false
   | None ->
       let vdb = Option.get valid_result.Sqlite_export.valid_db in
       validate_db tname vdb;
       let export_map2 = build_export vdb [ "export-type", kw graph_export_type ] in
       check
         (tname ^ ": No diff between original export and export after importing into a new graph")
         (Sqlite_export.diff_exports export_map export_map2 = None);
       check
         (tname ^ ": Original property history datoms are imported")
         (attr_datom_count vdb "logseq.property.history/block"
          = List.length original_property_history))

let test_import_graph_preserves_class_properties_order_with_built_in () =
  let tname = "import-graph-preserves-class-properties-order-with-built-in" in
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ "user.property/url", mmap [ "logseq.property/type", kw "default" ]
            ; "user.property/about", mmap [ "logseq.property/type", kw "default" ] ] )
      ; ( "classes",
          mmap
            [ ( "user.class/UrlFirst",
                mmap
                  [ ( "build/class-properties",
                      Vector [ kw "user.property/url"; kw "logseq.property/status" ] ) ] )
            ; ( "user.class/StatusFirst",
                mmap
                  [ ( "build/class-properties",
                      Vector [ kw "logseq.property/status"; kw "user.property/about" ] ) ] ) ] ) ]
  in
  let conn = create_conn_with_import_map original_data in
  (* Simulate a UI-built graph where the user positioned :logseq.property/status
     ahead of the user-defined properties *)
  ignore
    (transact_vals conn
       [ mmap [ "db/ident", kw "logseq.property/status"; "block/order", String "a0" ] ]);
  let export_map = build_export (db_of conn) [ "export-type", kw graph_export_type ] in
  let valid_result = Sqlite_export.validate_export export_map in
  (match valid_result.Sqlite_export.error with
   | Some _ ->
       check (tname ^ ": No error when importing export-map into new graph") false
   | None ->
       let vdb = Option.get valid_result.Sqlite_export.valid_db in
       let export_map2 = build_export vdb [ "export-type", kw graph_export_type ] in
       check
         (tname ^ ": No diff between original export and export after importing into a new graph")
         (Sqlite_export.diff_exports export_map export_map2 = None))

let test_import_graph_preserves_graph_files_order () =
  let tname = "import-graph-preserves-graph-files-order" in
  let conn = create_conn_with_import_map (Map []) in
  List.iter
    (fun file -> ignore (transact_vals conn [ file ]))
    [ mmap [ "file/path", String "logseq/publish.js"; "file/content", String "" ]
    ; mmap [ "file/path", String "logseq/custom.css"; "file/content", String ".foo {}" ]
    ; mmap [ "file/path", String "logseq/publish.css"; "file/content", String "" ]
    ; mmap [ "file/path", String "logseq/custom.js"; "file/content", String "// hi" ]
    ; mmap [ "file/path", String "logseq/config.edn"; "file/content", String "{:foo :bar}" ] ];
  let export_map = build_export (db_of conn) [ "export-type", kw graph_export_type ] in
  let valid_result = Sqlite_export.validate_export export_map in
  (match valid_result.Sqlite_export.error with
   | Some _ ->
       check (tname ^ ": No error when importing export-map into new graph") false
   | None ->
       let vdb = Option.get valid_result.Sqlite_export.valid_db in
       let export_map2 = build_export vdb [ "export-type", kw graph_export_type ] in
       check
         (tname ^ ": No diff between original export and export after importing into a new graph")
         (Sqlite_export.diff_exports export_map export_map2 = None))

let test_import_graph_with_different_property_value_cases () =
  let tname = "import-graph-with-different-property-value-cases" in
  let pvalue_uuid1 = Db_test_util.gen_uuid () in
  let original_data =
    mmap
      [ "classes", mmap [ "user.class/C1", mmap [] ]
      ; ( "properties",
          mmap
            [ "user.property/default", mmap [ "logseq.property/type", kw "default" ]
            ; ( "user.property/default-many",
                mmap [ "logseq.property/type", kw "default"; "db/cardinality", kw "db.cardinality/many" ] ) ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "block with pvalue that has :build/tags"
                          ; ( "build/properties",
                              mmap
                                [ ( "user.property/default",
                                    mmap
                                      [ "build/property-value", kw "block"
                                      ; "block/title", String "tags pvalue"
                                      ; "build/tags", Set [ kw "user.class/C1" ] ] ) ] ) ]
                      ; mmap
                          [ "block/title", String "block with pvalue that has a view"
                          ; ( "build/properties",
                              mmap
                                [ ( "user.property/default",
                                    mmap
                                      [ "build/property-value", kw "block"
                                      ; "block/title", String "view pvalue"
                                      ; "block/uuid", Uuid pvalue_uuid1
                                      ; "build/keep-uuid?", Bool true ] ) ] ) ]
                      ; mmap
                          [ "block/title", String "block with pvalue that has children"
                          ; ( "build/properties",
                              mmap
                                [ ( "user.property/default",
                                    mmap
                                      [ "build/property-value", kw "block"
                                      ; "block/title", String "children pvalue"
                                      ; ( "build/children",
                                          Vector
                                            [ mmap
                                                [ "block/title", String "c1"
                                                ; "build/tags", Set [ kw "user.class/C1" ] ]
                                            ; mmap
                                                [ "block/title", String "c2"
                                                ; ( "build/properties",
                                                    mmap [ "user.property/default", String "c21" ] ) ] ] ) ] ) ] ) ]
                      ; mmap
                          [ "block/title", String "block with pvalue map in a :many property"
                          ; ( "build/properties",
                              mmap
                                [ ( "user.property/default-many",
                                    Set
                                      [ String "yep"
                                      ; mmap
                                          [ "build/property-value", kw "block"
                                          ; "block/title", String ":many pvalue"
                                          ; "build/tags", Set [ kw "user.class/C1" ] ] ] ) ] ) ] ] ) ]
            ; mmap
                [ "page", mmap [ "block/title", String "$$$views2" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "Unlinked references"
                          ; ( "build/properties",
                              mmap
                                [ "logseq.property.view/type", kw "logseq.property.view/type.list"
                                ; "logseq.property.view/group-by-property", kw "block/page"
                                ; "logseq.property.view/feature-type", kw "unlinked-references"
                                ; "logseq.property/view-for", uuid_ref pvalue_uuid1 ] ) ] ] ) ] ] ) ]
  in
  let conn =
    create_conn_with_blocks (map_put "build-existing-tx?" (Bool true) original_data)
  in
  let export_map =
    build_export (db_of conn)
      [ "export-type", kw graph_export_type
      ; "graph-options", mmap [ "exclude-built-in-pages?", Bool true ] ]
  in
  let conn2 = Sqlite_export.create_conn () in
  let imported_graph =
    export_graph_and_import_to_another_graph tname
      (mmap [ "exclude-built-in-pages?", Bool true ]) conn conn2
  in
  check
    (tname ^ ": Property value entities roundtrip through graph datoms")
    (Sqlite_export.diff_exports export_map imported_graph = None)

let test_import_existing_page (tname : string)
    (import_options : (string * value) list) (expected_props : (string * value) list) : unit =
  let original_data =
    mmap
      [ ( "properties",
          mmap
            [ ( "user.property/node",
                mmap [ "logseq.property/type", kw "node"; "db/cardinality", kw "db.cardinality/many" ] ) ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ ( "page",
                    mmap
                      [ "block/title", String "page1"
                      ; ( "build/properties",
                          mmap
                            [ ( "user.property/node",
                                Set
                                  [ build_page_ref
                                      (mmap
                                         [ "block/title", String "existing page"
                                         ; ( "build/properties",
                                             mmap
                                               [ ( "logseq.property/description",
                                                   String "first description" ) ] ) ]) ] ) ] ) ] ) ] ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let page_uuid =
    match Db_test_util.find_page_by_title (db_of conn) "existing page" with
    | Some e -> ent_uuid e
    | None -> failwith "existing page missing"
  in
  validate_db tname (db_of conn);
  (* This is just a temp uuid used to link to the page during import *)
  let temp_uuid = Db_test_util.gen_uuid () in
  let import_data =
    mmap
      [ ( "properties",
          mmap
            [ ( "user.property/node",
                mmap [ "logseq.property/type", kw "node"; "db/cardinality", kw "db.cardinality/many" ] ) ] )
      ; ( "pages-and-blocks",
          Vector
            [ mmap
                [ ( "page",
                    mmap
                      [ "block/title", String "existing page"
                      ; "block/uuid", Uuid temp_uuid
                      ; "build/keep-uuid?", Bool true
                      ; ( "build/properties",
                          mmap
                            [ "logseq.property/description", String "second description"
                            ; "logseq.property/exclude-from-graph-view", Bool true ] ) ] ) ]
            ; mmap
                [ ( "page",
                    mmap
                      [ "block/title", String "page2"
                      ; ( "build/properties",
                          mmap [ "user.property/node", Set [ uuid_ref temp_uuid ] ] ) ] ) ] ] )
      ; Sqlite_export.k_import_options, mmap import_options ]
  in
  (match Sqlite_export.build_import import_data (db_of conn) None with
   | Ok txs -> ignore (transact_vals conn (txs.init_tx @ txs.block_props_tx))
   | Error _ -> ());
  validate_db tname (db_of conn);
  let existing_page = Db_test_util.find_page_by_title (db_of conn) "existing page" in
  let page1 = Db_test_util.find_page_by_title (db_of conn) "page1" in
  let page2 = Db_test_util.find_page_by_title (db_of conn) "page2" in
  check
    (tname ^ ": page uuid preserved")
    (ent_uuid_opt existing_page = Some page_uuid);
  let expected_keys = List.map fst expected_props in
  check
    (tname ^ ": expected page properties")
    (match existing_page with
     | Some e ->
         let actual =
           List.filter (fun (k, _) -> List.mem k expected_keys) (readable_properties e)
         in
         v_eq (mmap expected_props) (mmap actual)
     | None -> false);
  check
    (tname ^ ": page1 node prop uuids")
    (match page1 with
     | Some e -> List.sort compare (ref_uuid_strs e "user.property/node") = [ page_uuid ]
     | None -> false);
  check
    (tname ^ ": page2 node prop uuids — page uuid of 'existing page' is preserved across imports even when its assigned a temporary uuid")
    (match page2 with
     | Some e -> List.sort compare (ref_uuid_strs e "user.property/node") = [ page_uuid ]
     | None -> false)

let test_build_import_can_import_existing_page_with_different_uuid () =
  let tname = "build-import-can-import-existing-page-with-different-uuid" in
  (* By default any properties passed to an existing page are upserted *)
  test_import_existing_page tname []
    [ "logseq.property/description", String "second description"
    ; "logseq.property/exclude-from-graph-view", Bool true ];
  (* With ::existing-pages-keep-properties?, existing properties on existing
     pages are not overwritten by imported data *)
  test_import_existing_page tname
    [ "existing-pages-keep-properties?", Bool true ]
    [ "logseq.property/description", String "first description"
    ; "logseq.property/exclude-from-graph-view", Bool true ]

let test_build_export_omits_empty_build_properties () =
  let tname = "build-export-omits-empty-build-properties" in
  let conn =
    create_conn_with_blocks
      (mmap
         [ ( "properties",
             mmap [ "user.property/p1", mmap [ "logseq.property/type", kw "default" ] ] )
         ; ( "classes",
             mmap
               [ ( "user.class/C1",
                   mmap [ "build/class-properties", Vector [ kw "user.property/p1" ] ] ) ] )
         ; ( "pages-and-blocks",
             Vector
               [ mmap
                   [ "page", mmap [ "block/title", String "page1" ]
                   ; ( "blocks",
                       Vector
                         [ mmap
                             [ "block/title", String "b1"
                             ; "build/tags", Vector [ kw "user.class/C1" ] ] ] ) ] ] ) ])
  in
  let page =
    match Db_test_util.find_page_by_title (db_of conn) "page1" with
    | Some e -> e
    | None -> failwith "page1 missing"
  in
  let export_edn =
    build_export (db_of conn) [ "export-type", kw "page"; "page-id", Int page.id ]
  in
  let empty_build_properties = ref [] in
  ignore
    (postwalk
       (fun e ->
         match e with
         | Map _ ->
             (match map_get "build/properties" e with
              | Some m when coll_items' m = [] && (match m with Map [] -> true | _ -> false) ->
                  empty_build_properties := e :: !empty_build_properties;
                  e
              | _ -> e)
         | _ -> e)
       export_edn);
  check
    (tname ^ ": Export should omit :build/properties when it would otherwise be an empty map")
    (!empty_build_properties = [])

let test_import_graph_with_assets () =
  let tname = "import-graph-with-assets" in
  let asset_uuid = Db_test_util.gen_uuid () in
  let asset2_uuid = Db_test_util.gen_uuid () in
  let original_data =
    mmap
      [ ( "pages-and-blocks",
          Vector
            [ mmap
                [ "page", mmap [ "block/title", String "page1" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "asset block"
                          ; "block/uuid", Uuid asset_uuid
                          ; "build/keep-uuid?", Bool true
                          ; "build/tags", Set [ kw "logseq.class/Asset" ]
                          ; ( "build/properties",
                              mmap
                                [ "logseq.property.asset/type", String "pdf"
                                ; "logseq.property.asset/checksum", String "abc"
                                ; "logseq.property.asset/size", Int 42 ] ) ]
                      ; mmap
                          [ "block/title", String "annotation block"
                          ; "build/tags", Set [ kw "logseq.class/Pdf-annotation" ]
                          ; ( "build/properties",
                              mmap [ "logseq.property/asset", uuid_ref asset_uuid ] ) ] ] ) ]
            ; mmap
                [ "page", mmap [ "block/title", String "page2" ]
                ; ( "blocks",
                    Vector
                      [ mmap
                          [ "block/title", String "asset image block"
                          ; "block/uuid", Uuid asset2_uuid
                          ; "build/keep-uuid?", Bool true
                          ; "build/tags", Set [ kw "logseq.class/Asset" ]
                          ; ( "build/properties",
                              mmap
                                [ "logseq.property.asset/type", String "png"
                                ; "logseq.property.asset/checksum", String "img-checksum"
                                ; "logseq.property.asset/width", Int 100
                                ; "logseq.property.asset/height", Int 200
                                ; "logseq.property.asset/size", Int 300 ] ) ]
                      ; mmap
                          [ "block/title", String "annotation with image"
                          ; "build/tags", Set [ kw "logseq.class/Pdf-annotation" ]
                          ; ( "build/properties",
                              mmap [ "logseq.property.pdf/hl-image", uuid_ref asset2_uuid ] ) ] ] ) ] ] ) ]
  in
  let conn = create_conn_with_blocks original_data in
  let conn2 = Sqlite_export.create_conn () in
  let imported_graph =
    export_graph_and_import_to_another_graph tname
      (mmap [ "exclude-built-in-pages?", Bool true ]) conn conn2
  in
  let export_map =
    build_export (db_of conn)
      [ "export-type", kw graph_export_type
      ; "graph-options", mmap [ "exclude-built-in-pages?", Bool true ] ]
  in
  let annotation_block = find_block_by_content (db_of conn2) "annotation block" in
  let annotation_image = find_block_by_content (db_of conn2) "annotation with image" in
  check
    (tname ^ ": Asset graph datoms roundtrip exactly")
    (Sqlite_export.diff_exports export_map imported_graph = None);
  check
    (tname ^ ": :logseq.property/asset should preserve the asset ref")
    (match annotation_block with
     | Some e ->
         (match Ldb.ref_ent e "logseq.property/asset" with
          | Some a -> ent_uuid a = asset_uuid
          | None -> false)
     | None -> false);
  check
    (tname ^ ": :logseq.property.pdf/hl-image should preserve the asset ref")
    (match annotation_image with
     | Some e ->
         (match Ldb.ref_ent e "logseq.property.pdf/hl-image" with
          | Some a -> ent_uuid a = asset2_uuid
          | None -> false)
     | None -> false)

(* ---------- runner ---------- *)

let () = run "merge-export-maps" test_merge_export_maps
let () = run "import-block-in-same-graph" test_import_block_in_same_graph
let () = run "import-block-in-different-graph" test_import_block_in_different_graph
let () = run "import-block-with-different-ref-types" test_import_block_with_different_ref_types
let () = run "import-page-with-different-blocks" test_import_page_with_different_blocks
let () = run "import-page-with-different-ref-types" test_import_page_with_different_ref_types
let () = run "import-page-with-block-links" test_import_page_with_block_links
let () = run "import-page-with-different-page-and-classes" test_import_page_with_different_page_and_classes
let () = run "import-journal-page" test_import_journal_page
let () = run "import-class-page" test_import_class_page
let () = run "import-page-with-different-property-types" test_import_page_with_different_property_types
let () = run "import-graph-ontology" test_import_graph_ontology
let () = run "import-with-url-property-should-be-idempotent" test_import_with_url_property_should_be_idempotent
let () = run "export-graph-ontology-ignores-legacy-internal-class-properties" test_export_graph_ontology_ignores_legacy_internal_class_properties
let () = run "graph-datom-import-drops-legacy-plugin-property-schema-attrs" test_graph_datom_import_drops_legacy_plugin_property_schema_attrs
let () = run "graph-export-keeps-referenced-recycled-closed-value-config" test_graph_export_keeps_referenced_recycled_closed_value_config
let () = run "graph-export-ignores-scalar-values-when-finding-referenced-closed-values" test_graph_export_ignores_scalar_values_when_finding_referenced_closed_values
let () = run "graph-export-uses-db-id-sorted-datoms" test_graph_export_uses_db_id_sorted_datoms
let () = run "graph-export-omits-local-metadata-datoms" test_graph_export_omits_local_metadata_datoms
let () = run "graph-datom-export-import-is-idempotent" test_graph_datom_export_import_is_idempotent
let () = run "graph-datom-import-replaces-seeded-data" test_graph_datom_import_replaces_seeded_data
let () = run "graph-datom-import-applies-schema-datoms-before-values" test_graph_datom_import_applies_schema_datoms_before_values
let () = run "graph-datom-import-applies-lookup-ref-targets-before-values" test_graph_datom_import_applies_lookup_ref_targets_before_values
let () = run "validate-export-rejects-invalid-graph-datoms" test_validate_export_rejects_invalid_graph_datoms
let () = run "graph-datom-export-resolves-lookup-ref-values" test_graph_datom_export_resolves_lookup_ref_values
let () = run "import-supports-legacy-structured-graph-edn" test_import_supports_legacy_structured_graph_edn
let () = run "import-view-blocks" test_import_view_blocks
let () = run "export-grouped-view-nodes-by-uuid" test_export_grouped_view_nodes_by_uuid
let () = run "import-selected-nodes" test_import_selected_nodes
let () = run "export-selected-nodes-with-missing-node" test_export_selected_nodes_with_missing_node
let () = run "import-graph" test_import_graph
let () = run "import-graph-with-timestamps" test_import_graph_with_timestamps
let () = run "import-graph-with-exclude-namespaces" test_import_graph_with_exclude_namespaces
let () = run "graph-is-idempotent-across-import-and-export" test_graph_is_idempotent_across_import_and_export
let () = run "graph-with-property-alias-is-idempotent" test_graph_with_property_alias_is_idempotent
let () = run "import-graph-preserves-property-history" test_import_graph_preserves_property_history
let () = run "import-graph-preserves-class-properties-order-with-built-in" test_import_graph_preserves_class_properties_order_with_built_in
let () = run "import-graph-preserves-graph-files-order" test_import_graph_preserves_graph_files_order
let () = run "import-graph-with-different-property-value-cases" test_import_graph_with_different_property_value_cases
let () = run "build-import-can-import-existing-page-with-different-uuid" test_build_import_can_import_existing_page_with_different_uuid
let () = run "build-export-omits-empty-build-properties" test_build_export_omits_empty_build_properties
let () = run "import-graph-with-assets" test_import_graph_with_assets

let () =
  if !failures > 0 then begin
    Printf.eprintf "%d test assertion(s) failed\n%!" !failures;
    exit 1
  end
  else Printf.printf "test_export_native: all assertions passed\n%!"
