(* logseq.db/transact! + transact-sync — normalize tx-data, expand
   deletions, run the worker pipeline, validate, and commit through the
   datascript conn. Single-threaded worker: the cljs CAS retry loop can
   never actually retry (no concurrent writers), but the shape is kept. *)

open Datascript

(* cljs *transact-pipeline-fn — registered by the worker pipeline port.
   Identity until registered (cljs behaves the same when nil). *)
let transact_pipeline_fn : (tx_report -> tx_report) option ref = ref None

(* cljs db-validate/validate-tx-report — registered when validate.cljs is
   ported. Returns (valid?, errors). *)
let validate_tx_report_fn
    : (tx_report -> bool * string list) option ref =
  ref None

let tx_meta_lookup (tx_meta : tx_meta) (k : attr) : value option =
  match List.find_opt (fun (a, _) -> a = k) tx_meta with
  | Some (_, v) -> Some v
  | None -> None

let tx_meta_flag (tx_meta : tx_meta) (k : attr) : bool =
  match tx_meta_lookup tx_meta k with
  | Some (Bool b) -> b
  | Some Nil | None -> false
  | Some _ -> true

(* per-conn flags — cljs conn is a map (:batch-tx? :skip-store?
   :skip-validate-db?). Ours is opaque; track flags by physical identity. *)
type conn_flags =
  { mutable batch_tx : bool
  ; mutable skip_store : bool
  ; mutable skip_validate : bool
  }

(* Flags are looked up by physical identity (==): a structural Hashtbl on
   conn is unsound because conn's contents mutate as the db changes,
   changing its hash and losing the flags between calls. Few conns exist
   (live + temp), so an assoc list suffices. *)
let conn_flags_list : (conn * conn_flags) list ref = ref []

let flags_of (conn : conn) : conn_flags =
  match List.find_opt (fun (c, _) -> c == conn) !conn_flags_list with
  | Some (_, f) -> f
  | None ->
    let f = { batch_tx = false; skip_store = false; skip_validate = false } in
    conn_flags_list := (conn, f) :: !conn_flags_list;
    f

(* ---- ldb/transact! tx-data normalization ---- *)

let strip_attrs =
  [ "block/children"; "block/meta"; "block/top?"; "block/bottom?"
  ; "block/anchor"; "block/level"; "block/container"; "db/other-tx"
  ; "block/unordered"; "block.temp/load-status" ]

let is_block_temp_attr (a : attr) : bool =
  let n = String.length "block.temp/" in
  String.length a > n && String.sub a 0 n = "block.temp/"

let rec strip_temp_from_value (v : value) : value =
  match v with
  | List vs -> List (strip_temp_list vs)
  | Vector vs -> Vector (strip_temp_list vs)
  | Set vs -> Set (strip_temp_list vs)
  | Map kvs ->
    Map
      (List.filter_map
         (fun (k, x) ->
           match k with
           | Keyword a | String a when is_block_temp_attr a -> None
           | _ -> Some (k, strip_temp_from_value x))
         kvs)
  | _ -> v

and strip_temp_list (vs : value list) : value list =
  List.filter_map
    (fun v -> match v with Nil -> None | _ -> Some (strip_temp_from_value v))
    vs

let rec strip_temp_attrs (attrs : (attr * tx_value) list) : (attr * tx_value) list =
  List.filter_map
    (fun (a, tv) ->
      if is_block_temp_attr a then None
      else
        let tv' =
          match tv with
          | One_value v -> One_value (strip_temp_from_value v)
          | Many_values vs -> Many_values (strip_temp_list vs)
          | One_entity te -> One_entity { te with attrs = strip_temp_attrs te.attrs }
          | Many_entities tes ->
            Many_entities
              (List.map (fun (te : tx_entity) -> { te with attrs = strip_temp_attrs te.attrs }) tes)
        in
        Some (a, tv'))
    attrs

let normalize_tx (txs : tx_op list) : tx_op list =
  List.filter_map
    (fun tx ->
      match tx with
      | Entity te ->
        let te =
          { te with
            attrs =
              te.attrs
              |> List.filter (fun (a, _) -> not (List.mem a strip_attrs))
              |> strip_temp_attrs
          }
        in
        if te.db_id = None && te.attrs = [] then None
        else if
          List.exists
            (fun (a, tv) ->
              a = "db/ident" && tv = One_value (Keyword "block/path-refs"))
            te.attrs
        then None
        else Some (Entity te)
      | Add (r, a, v) ->
        if is_block_temp_attr a then None
        else Some (Add (r, a, strip_temp_from_value v))
      | Retract (r, a, v) ->
        if is_block_temp_attr a then None
        else Some (Retract (r, a, Option.map strip_temp_from_value v))
      | RetractAttr (_, a) ->
        if is_block_temp_attr a then None else Some tx
      | _ -> Some tx)
    txs

(* ---- transact-sync ---- *)

exception Invalid_tx of string

(* cljs d/with — apply tx-ops to a db value without touching storage.
   `transact` would persist each intermediate report's datoms to the db's
   storage_ref immediately (and again on conn commit); stripping the ref
   keeps the report pure. The ref is restored on db_after so the resulting
   db keeps its storage for the commit below and later reads/writes. *)
let with_report ~tx_meta (db : db) (tx_ops : tx_op list) : tx_report =
  let report = transact ~tx_meta { db with storage_ref = None } tx_ops in
  { report with db_after = { report.db_after with storage_ref = db.storage_ref } }

(* cljs compare-and-set! + dc/store-after-transact! + dc/run-callbacks —
   install the pipeline's report as-is so listeners see its tempids
   (including :db/current-tx) and storage persists its tail once.
   Single-threaded worker: the CAS can never fail, matching the shape kept
   in transact_sync below. *)
let commit_tx_report (conn : conn) (report : tx_report) : tx_report =
  Datascript.apply_report conn report

let should_run_pipeline (conn : conn) (db : db) (tx_meta : tx_meta) : bool =
  Ldb.db_based_graph db
  && not
       (tx_meta_flag tx_meta "rtc-download-graph?"
        || tx_meta_flag tx_meta "reset-conn!"
        || tx_meta_flag tx_meta "initial-db?"
        || tx_meta_flag tx_meta "skip-validate-db?"
        || (flags_of conn).skip_validate
        || tx_meta_flag tx_meta "logseq.graph-parser.exporter/new-graph?"
        || tx_meta_flag tx_meta "transact-new-graph-refs?")

let should_validate_pipeline_result (tx_meta : tx_meta) : bool =
  not (tx_meta_flag tx_meta "fix-db?")

let throw_if_page_has_block_parent (db : db) (tx_data : datom list) =
  let bad =
    List.exists
      (fun (d : datom) ->
        d.added && d.a = "block/parent"
        &&
        (match Datascript.entity db (Entity_id d.e) with
         | Some e when Ldb.is_page e ->
           (match Ldb.value e "block/parent" with
            | Some (Ref pid) when pid = (match d.v with Ref r -> r | _ -> -1) ->
              (match Datascript.entity db (Entity_id pid) with
               | Some p -> not (Ldb.is_page p)
               | None -> false)
            | _ -> false)
         | _ -> false))
      tx_data
  in
  if bad then
    invalid_arg
      (Printf.sprintf "Page can't have block as parent (tx-count %d)"
         (List.length tx_data))

let transact_invalid_callback
    : (tx_report -> string list -> unit) option ref =
  ref None

(* cljs catch in transact-sync: log :transact-failed {:tx-meta :tx-count
   :error} unless suppressed by tx-meta flags. *)
let log_transact_failed (tx_meta : tx_meta) (tx_ops : tx_op list) (e : exn) :
    unit =
  let suppressed =
    tx_meta_flag tx_meta "db-sync/suppress-transact-failed-log?"
    || (tx_meta_flag tx_meta
          "db-sync/suppress-stale-rebase-transact-failed-log?"
        &&
        (match e with
         | Dispatcher.Exn_info (_, kvs) ->
             List.assoc_opt (Wire.Keyword "error") kvs
             = Some (Wire.Keyword "entity-id/missing")
         | _ -> false))
  in
  if not suppressed then
    Worker_log.error "transact-failed"
      [ ( "tx-meta"
        , Ds_wire.edn_of_transit (Ds_wire.transit_of_tx_meta tx_meta) )
      ; "tx-count", string_of_int (List.length tx_ops)
      ; "error", Printexc.to_string e ]

let rec transact_sync_ (conn : conn) (tx_ops : tx_op list) (tx_meta : tx_meta)
    : tx_report =
  if tx_ops = [] then
    { db_before = Conn.db conn
    ; db_after = Conn.db conn
    ; tx_data = []
    ; tempids = []
    ; tx_meta
    }
  else begin
    let db = Conn.db conn in
    if should_run_pipeline conn db tx_meta then begin
      let report0 = with_report ~tx_meta db tx_ops in
      let report =
        match !transact_pipeline_fn with
        | Some f -> f report0
        | None -> report0
      in
      throw_if_page_has_block_parent report.db_after report.tx_data;
      let valid, errors =
        if should_validate_pipeline_result tx_meta then
          match !validate_tx_report_fn with
          | Some f -> f report
          | None -> (true, [])
        else (true, [])
      in
      if not valid then begin
        if Conn.db conn == db then begin
          (match !transact_invalid_callback with
           | Some f -> f report errors
           | None -> ());
          raise
            (Invalid_tx
               (Printf.sprintf
                  "DB write failed with invalid data (%d errors)"
                  (List.length errors)))
        end else
          transact_sync_ conn tx_ops tx_meta
      end
      else if report.tx_data <> [] then
        (* cljs compare-and-set! — conn must still hold the db the report
           was computed from; a concurrent commit (e.g. inside the
           pipeline fn) retries from the live db *)
        if Conn.db conn == db then begin
          ignore (commit_tx_report conn report);
          report
        end else
          transact_sync_ conn tx_ops tx_meta
      else report
    end else
      transact_conn ~tx_meta conn tx_ops
  end

let transact_sync (conn : conn) (tx_ops : tx_op list) (tx_meta : tx_meta)
    : tx_report =
  try transact_sync_ conn tx_ops tx_meta
  with e ->
    log_transact_failed tx_meta tx_ops e;
    raise e

(* ldb/transact! — worker path always takes the conn branch *)
let transact ?(tx_meta : tx_meta = []) (conn : conn) (tx_ops : tx_op list)
    : tx_report =
  let tx_ops = normalize_tx tx_ops in
  let outliner_op =
    match tx_meta_lookup tx_meta "outliner-op" with
    | Some (Keyword s) | Some (String s) -> s
    | _ -> ""
  in
  let tx_ops = Delete_blocks.expand_delete_blocks_tx (Conn.db conn) tx_ops ~outliner_op in
  let cleanup = Delete_blocks.update_refs_history (Conn.db conn) tx_ops in
  let tx_ops = tx_ops @ cleanup in
  if tx_ops = [] then
    { db_before = Conn.db conn
    ; db_after = Conn.db conn
    ; tx_data = []
    ; tempids = []
    ; tx_meta
    }
  else
    let flags = flags_of conn in
    let tx_meta =
      (if flags.batch_tx then ("batch-tx-report?", Bool true) :: tx_meta
       else tx_meta)
      |> fun m -> if flags.skip_store then ("skip-store?", Bool true) :: m else m
    in
    transact_sync conn tx_ops tx_meta

(* ldb/batch-transact-with-temp-conn! — batched txs on an isolated in-memory
   conn (reads storage-backed data, never writes), then a single commit. *)
let batch_transact_with_temp_conn ?(tx_meta : tx_meta = []) (conn : conn)
    (f : conn -> unit) : tx_report option =
  (* cljs conn-from-db fork avoids d/store — strip storage so the temp
     conn can read but never write. *)
  let temp = conn_from_db { (Conn.db conn) with storage_ref = None } in
  (* cljs swap! temp-conn assoc :batch-tx? :skip-store? :skip-validate-db? *)
  let fl = flags_of temp in
  fl.batch_tx <- true;
  fl.skip_store <- true;
  fl.skip_validate <- true;
  let collected : datom list list ref = ref [] in
  let key =
    listen temp "temp-conn-batch-tx" (fun (r : tx_report) ->
        collected := !collected @ [ r.tx_data ])
  in
  (try
     f temp;
     let tx_data = List.concat !collected in
     unlisten temp key;
     if tx_data = [] then None
     else
       Some
         (transact ~tx_meta conn
            (List.map (fun d -> Raw_datom d) tx_data))
   with e ->
     unlisten temp key;
     raise e)

(* ldb/batch-transact! — batch on the real conn, deferring store + validate
   until the final commit. Not nestable. *)
exception Batch_tx_nested

let batch_transact ?(tx_meta : tx_meta = []) (conn : conn)
    (f : conn -> unit) : tx_report option =
  let flags = flags_of conn in
  if flags.batch_tx then raise Batch_tx_nested;
  let collected : datom list list ref = ref [] in
  let key =
    listen conn "batch-tx" (fun (r : tx_report) ->
        collected := !collected @ [ r.tx_data ])
  in
  flags.skip_store <- true;
  flags.batch_tx <- true;
  (try
     f conn;
     flags.skip_store <- false;
     flags.batch_tx <- false;
     unlisten conn key;
     let tx_data = List.concat !collected in
     if tx_data = [] then None
     else
       Some
         (transact ~tx_meta conn
            (List.map (fun d -> Raw_datom d) tx_data))
   with e ->
     flags.skip_store <- false;
     flags.batch_tx <- false;
     unlisten conn key;
     raise e)
