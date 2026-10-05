(* Daemon cold-start regression test: the graph open path (sqlite open →
   kvs storage → lazy restore_conn → schema fix → initial-data check →
   migrate) must stay fast on a realistic graph. Fixture: a 100k-block
   graph generated once into tmp/perf-graph-100k/db.sqlite and reused
   across runs (delete the directory to regenerate). The open must stay
   lazy — storage-backed index seeks, no whole-db materialization — so
   the budget holds as graphs grow. *)

open Datascript

let check (name : string) (ok : bool) =
  Alcotest.(check bool) name true ok

let await (t : 'a Db_worker_effect.t) : 'a =
  let result = ref None in
  Db_worker_effect.on_any t
    (fun v -> result := Some (Ok v))
    (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> failwith "task still pending"

let fixture_dir = "tmp/perf-graph-100k"
let fixture_db_path = Filename.concat fixture_dir "db.sqlite"

let block_count = 100_000
let blocks_per_page = 100
let page_count = block_count / blocks_per_page

let uuid_of_int i = Printf.sprintf "10000000-0000-4000-8000-%012d" i

(* Built via a single conn_from_datoms (one bulk init_db + one store) so
   fixture generation doesn't pay per-tx index stores; the on-disk shape
   matches a compacted graph (root + index nodes, empty tail). *)
let ensure_fixture () =
  if not (Sys.file_exists fixture_db_path) then begin
    await (File_sys.mkdir_p fixture_dir);
    let schema = Db_schema.schema () in
    (* Seed the built-in ontology so the timed open takes the real-graph
       path (initial_data_exists → skips the initial transact). *)
    let conn0 = Datascript.create_conn ~schema () in
    let init_tx =
      Sqlite_create_graph.initial_tx_data ~db:(Datascript.db conn0)
        ~config_content:Templates.config_edn ()
    in
    ignore
      (Datascript.transact_conn conn0 init_tx
         ~tx_meta:[ "skip-store?", Datascript.Bool true ]);
    let base =
      List.of_seq (Datascript.datoms (Datascript.db conn0) Eavt ())
    in
    let now = Date_time_util.time_ms () in
    let seed_tx = 1_000_000 in
    let orders =
      Array.of_list
        (Db_order.gen_n_keys (block_count + page_count) None None)
    in
    let order_i = ref 0 in
    let datoms = ref [] in
    let add e a v =
      datoms := { e; a; v; tx = seed_tx; added = true } :: !datoms
    in
    let next_order () =
      let k = orders.(!order_i) in
      incr order_i;
      k
    in
    for i = 0 to page_count - 1 do
      let page_eid = 10_000 + i in
      add page_eid "block/uuid" (Uuid (uuid_of_int page_eid));
      add page_eid "block/name" (String (Printf.sprintf "perf-page-%d" i));
      add page_eid "block/title" (String (Printf.sprintf "perf page %d" i));
      add page_eid "block/created-at" (Int64 now);
      add page_eid "block/updated-at" (Int64 now);
      let prev = ref page_eid in
      for j = 0 to blocks_per_page - 1 do
        let eid = 100_000 + (i * blocks_per_page) + j in
        add eid "block/uuid" (Uuid (uuid_of_int eid));
        add eid "block/title"
          (String
             (Printf.sprintf "perf block %d-%d [[perf-page-%d]]" i j
                ((i + j) mod page_count)));
        add eid "block/page" (Ref page_eid);
        (* runs of 5 nested under the previous sibling *)
        add eid "block/parent" (Ref !prev);
        add eid "block/order" (String (next_order ()));
        add eid "block/created-at" (Int64 now);
        add eid "block/updated-at" (Int64 now);
        add eid "block/refs" (Ref (10_000 + ((i + j) mod page_count)));
        prev := (if j mod 5 = 4 then page_eid else eid)
      done
    done;
    (* Instant heal marker — real graphs carry it after their first open,
       so the steady-state cold path skips the whole-eavt heal walk. *)
    add 9_000_000 "db/ident" (Keyword "logseq.kv/instant-values-healed");
    add 9_000_000 "kv/value" (Bool true);
    let db = Sqlite.open_db ~path:fixture_db_path in
    Graph_store.create_kvs_table db;
    ignore
      (Datascript.conn_from_datoms ~schema
         ~storage:(Graph_store.storage db) (base @ !datoms));
    Sqlite.close db
  end

let test_cold_start_open_100k () =
  ensure_fixture ();
  let t0 = Unix.gettimeofday () in
  let db = Sqlite.open_db ~path:fixture_db_path in
  let storage = Graph_store.storage db in
  let conn = Common_sqlite.get_storage_conn storage (Db_schema.schema ()) in
  let restore_ms = (Unix.gettimeofday () -. t0) *. 1000. in
  Worker_db_fix.check_and_fix_schema conn;
  Worker_db_fix.heal_instant_values conn;
  let db' = Datascript.db conn in
  let initial_data_exists =
    (match Ldb.ent_of_ref db' (Datascript.Ident "logseq.class/Root") with
     | Some _ -> true
     | None -> false)
    && (match Ldb.ent_of_ref db' (Datascript.Ident "logseq.kv/db-type") with
        | Some e -> Ldb.value e "kv/value" = Some (Datascript.String "db")
        | None -> false)
  in
  ignore (Db_migrate.migrate conn);
  let total_ms = (Unix.gettimeofday () -. t0) *. 1000. in
  Sqlite.close db;
  Printf.printf "cold-open-100k: restore=%.1fms total=%.1fms\n%!" restore_ms
    total_ms;
  check "initial data exists" initial_data_exists;
  check "cold open of 100k-block graph stays under 200ms" (total_ms < 200.)

let cases =
  [ Alcotest.test_case "cold-start-open-100k" `Quick
      test_cold_start_open_100k ]
