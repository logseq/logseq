(* OCaml port of deps/db/test/logseq/db/sqlite/gc_test.cljs — the single
   ^:long deftest (cljs runs it in the long suite; tagged `Slow` here).

   - gc-kvs-table-test — build a sqlite-backed datascript db, gc the kvs
     table, assert no missing addrs and no garbage addrs.

   cljs API map:
   - sqlite-cli/open-sqlite-datascript! -> Sqlite_cli.open_sqlite_datascript
   - sqlite-gc/gc-kvs-table-node-version! (walk?=false -> recursive)
     -> Graph_gc.gc_kvs_table ~full_gc:true
   - sqlite-gc/ensure-no-garbage -> Graph_gc.get_unused_addresses = []
   - sqlite-debug/find-missing-addresses-node-version
     -> Sqlite_debug.find_missing_addresses_node_version *)

open Datascript
open Test_shared
open Db_test_util

(* cljs use-fixtures: rm -rf tmp/ before each test *)
let rec rm_rf path =
  if Sys.file_exists path then
    if Sys.is_directory path then begin
      Array.iter (fun f -> rm_rf (Filename.concat path f)) (Sys.readdir path);
      Unix.rmdir path
    end
    else Sys.remove path

(* cljs create-graph-dir: (fs/mkdirSync (join dir db-name) {recursive}) *)
let rec mkdir_p path =
  if Sys.file_exists path then ()
  else begin
    mkdir_p (Filename.dirname path);
    Unix.mkdir path 0o755
  end

let uuid_of_entity_op (op : tx_op) : string option =
  match op with
  | Entity { attrs; _ } ->
      (match List.assoc_opt "block/uuid" attrs with
       | Some (One_value (Uuid u)) -> Some u
       | _ -> None)
  | _ -> None

(* (deftest ^:long gc-kvs-table-test ...) *)
let test_gc_kvs_table () =
  let graphs_dir = Filename.concat (Sys.getcwd ()) "tmp/graphs" in
  rm_rf (Filename.concat (Sys.getcwd ()) "tmp");
  mkdir_p (Filename.concat graphs_dir "test-db");
  let sqlite, conn =
    Sqlite_cli.open_sqlite_datascript ~graphs_dir "test-db"
  in
  let tx_data =
    List.init 500000 (fun i ->
        Entity
          { db_id = None
          ; attrs =
              [ "block/uuid", One_value (Uuid (gen_uuid ()))
              ; "block/title",
                One_value (String (Printf.sprintf "title %d" i)) ] })
  in
  ignore (Datascript.transact_conn conn tx_data);
  (* cljs (take 100000 (shuffle tx-data)) — any 100000 of the inserted
     blocks; a deterministic prefix exercises the same op. *)
  let retracts =
    tx_data
    |> List.filteri (fun i _ -> i < 100000)
    |> List.filter_map uuid_of_entity_op
    |> List.map (fun u -> RetractEntity (Lookup_ref ("block/uuid", Uuid u)))
  in
  ignore (Datascript.transact_conn conn retracts);
  Graph_gc.gc_kvs_table ~full_gc:true sqlite;
  check "gc-kvs-table no missing addresses"
    (Sqlite_debug.find_missing_addresses_node_version sqlite = []);
  check "gc-kvs-table no garbage"
    (Graph_gc.get_unused_addresses sqlite = [])

let () =
  Alcotest.run "db-sqlite"
    [ "gc", [ Alcotest.test_case "gc-kvs-table-test" `Slow test_gc_kvs_table ] ]
