(* cljs test file translated 1:1:
   src/test/frontend/worker/db_sync_sim_test.cljs — 21 deftests → group
   "db-sync-sim".

   Determinism notes (cljs -> OCaml mapping):
   - make-rng / rng-uuid are bit-identical to the cljs LCG:
     next = (1664525 * s + 1013904223) mod 2^32, default seed 1337,
     overridable via DB_SYNC_SIM_SEED (cljs js/process.env).
   - cljs :pages/:blocks are hash sets — iteration order is hash-trie order
     that OCaml cannot reproduce; here they are insertion-ordered lists
     (same set semantics: conj dedups, disj removes). The rng draw stream
     is identical, but rand-nth! over a differently-ordered collection can
     pick different elements, so a fixed seed produces a deterministic —
     but not cljs-bit-identical — op stream. Same caveat for d/q result
     ordering in user-classes.
   - cljs (reset! db-conn/conns ...) has no worker-side counterpart; the
     worker reads Worker_state.datascript_conns, which with-test-repos
     already swaps.
   - cljs new-client-ops-db (better-sqlite3 :memory:) -> temp-file sqlite +
     ensure_schema (:memory: collides in the filename-keyed schema_ready
     cache across fixtures).
   - cljs ns references: db-sync/enqueue-local-tx! ->
     Sync_apply.enqueue_local_tx; db-sync/update-local-sync-checksum! ->
     Sync_client.update_local_sync_checksum;
     db-sync/*repo->latest-remote-tx* -> Sync_apply.repo_latest_remote_tx;
     #'sync-apply/{prepare-upload-tx-entries,pending-txs,
     mark-pending-txs-false!,apply-remote-txs!} -> Sync_apply.*;
     worker-page/{create!,delete!} -> Outliner_page.{create_bang,
     delete_conn}; outliner-core/* -> Outliner_core.*_conn;
     undo-redo/* -> Undo_redo.*; ldb/* -> Db_transact.transact / Ldb.*;
     state/get-state -> Worker_state.state_get.

   The cljs (d/listen! ... (enqueue-local-tx! ...)) wiring of
   with-test-repos is reproduced verbatim, including the tx-meta munging
   (:client-id from app state, :local-tx? default true). *)

open Datascript
open Test_shared

let kw (s : string) : Wire.t = Wire.Keyword s

let repo_a = "db-sync-sim-repo-a"
let repo_b = "db-sync-sim-repo-b"
let repo_c = "db-sync-sim-repo-c"
let base_page_title = "Home"
let default_seed = 1337

(* ---------- cljs new-client-ops-db ---------- *)

let new_client_ops_db () : Sqlite.db =
  let path = Filename.temp_file "client-ops-" ".sqlite" in
  let db = Sqlite.open_db ~path in
  Sync_client_op.ensure_schema db;
  db

(* ---------- rng (cljs make-rng / env-seed — bit-identical) ---------- *)

(* cljs js/parseInt is lenient about trailing junk; int_of_string_opt is
   strict — acceptable divergence for an env override knob. *)
let env_seed () : int option =
  match Sys.getenv_opt "DB_SYNC_SIM_SEED" with
  | Some raw -> int_of_string_opt raw
  | None -> None

let make_rng (seed : int) : unit -> float =
  let state = ref seed in
  fun () ->
    let next = (1664525 * !state + 1013904223) mod 4294967296 in
    state := next;
    float_of_int next /. 4294967296.0

let rand_int_bang (rng : unit -> float) (n : int) : int =
  int_of_float (Float.floor (rng () *. float_of_int n))

let rand_nth_bang (rng : unit -> float) (coll : 'a list) : 'a option =
  match coll with
  | [] -> None
  | _ -> Some (List.nth coll (rand_int_bang rng (List.length coll)))

let rng_uuid (rng : unit -> float) : string =
  let payload = Array.init 16 (fun _ -> rand_int_bang rng 256) in
  payload.(6) <- 0x40 lor (payload.(6) land 0x0f);
  payload.(8) <- 0x80 lor (payload.(8) land 0x3f);
  let h i = Printf.sprintf "%02x" payload.(i) in
  String.concat ""
    [ h 0; h 1; h 2; h 3; "-"; h 4; h 5; "-"; h 6; h 7; "-"; h 8; h 9
    ; "-"; h 10; h 11; h 12; h 13; h 14; h 15 ]

(* ---------- history log / repro reporting ---------- *)

(* cljs history entries are maps; we keep (string * Wire.t) assoc lists. *)
type history = (string * Wire.t) list list ref

let record_meta_bang (history : history) (meta : (string * Wire.t) list) =
  history := !history @ [ ("type", kw "meta") :: meta ]

(* cljs (prn :db-sync-sim-repro {...}) — the dump exists for repro; we keep
   it compact (seed + history size + extra) to avoid megabyte logs. *)
let report_history_bang (seed : int) (history : history)
    (extra : (string * Wire.t) list option) : unit =
  Printf.eprintf "[db-sync-sim-repro] seed=%d history=%d%s\n%!" seed
    (List.length !history)
    (match extra with
     | Some kvs ->
         " extra=" ^ Ds_wire.edn_of_transit (Wire.Map (List.map (fun (k, v) -> (kw k, v)) kvs))
     | None -> "")

(* cljs install-invalid-tx-repro! — payload kept as a Wire map so the
   cljs map-equality assertion is a structural compare. *)
type invalid_tx_repro = { repro : Wire.t option ref; restore : unit -> unit }

let install_invalid_tx_repro_bang (seed : int) (history : history) :
    invalid_tx_repro =
  let prev = !Db_tx.transact_invalid_callback in
  let repro = ref None in
  let handler (tx_report : tx_report) (errors : string list) : unit =
    let payload =
      Wire.Map
        [ kw "type", kw "invalid-tx"
        ; ( kw "tx-meta"
          , Ds_wire.transit_of_tx_meta tx_report.tx_meta )
        ; ( kw "tx-data"
          , Wire.List
              (List.map Ds_wire.transit_of_datom tx_report.tx_data) )
        ; ( kw "errors"
          , Wire.List (List.map (fun s -> Wire.String s) errors) ) ]
    in
    repro := Some payload;
    report_history_bang seed history
      (Some
         [ "type", kw "invalid-tx"
         ; "errors", Wire.List (List.map (fun s -> Wire.String s) errors) ])
  in
  Db_tx.transact_invalid_callback := Some handler;
  { repro; restore = (fun () -> Db_tx.transact_invalid_callback := prev) }

(* ---------- dbs / conns ---------- *)

(* cljs db-test/create-conn — full seeded graph. Seeding takes ~25s so the
   seeded db snapshot is built once and every conn clones it (structural
   sharing — transacts never mutate the snapshot). Same pattern as
   test_undo_redo_native. *)
let seeded_db : db option ref = ref None

let create_conn () : conn =
  let db =
    match !seeded_db with
    | Some d -> d
    | None ->
        let c = Sqlite_export.create_conn () in
        let d = db_of c in
        seeded_db := Some d;
        d
  in
  conn_from_db db

(* ---------- sync wiring (cljs fixture binds apply-history-action) ---------- *)

let apply_history_action_adapter repo tx_id_opt undo pairs =
  let tx_meta =
    List.filter_map
      (fun (k, v) ->
        match k with
        | Wire.Keyword s -> Some (s, Ds_wire.value_of_transit v)
        | _ -> None)
      pairs
  in
  (match
     Sync_apply.apply_history_action repo
       (Option.value ~default:"" tx_id_opt)
       undo tx_meta
   with
   | Wire.Map kvs ->
       List.filter_map
         (fun (k, v) ->
           match k with Wire.Keyword s -> Some (s, v) | _ -> None)
         kvs
   | _ -> [])

let gen_undo_ops_adapter repo (r : tx_report) tx_id =
  Undo_redo.gen_undo_ops repo ~tx_data:r.tx_data
    ~tx_meta:
      (List.map (fun (a, v) -> (a, Ds_wire.transit_of_value v)) r.tx_meta)
    ~db_before:r.db_before ~db_after:r.db_after ~tx_id
    ~apply_history:apply_history_action_adapter

(* cljs with-test-repos *)
type repo_conns = { conn : conn; ops_conn : Sqlite.db option }

let with_test_repos (repos : (string * repo_conns) list) (f : unit -> 'a) :
    'a =
  (* cljs crypt.cljs is loaded for sync-apply; wire the Sync_deps hooks *)
  Sync_crypt.init ();
  let prev_datascript =
    List.map (fun (repo, _) -> repo, Worker_state.datascript_conn repo) repos
  in
  let prev_ops = Hashtbl.copy Sync_state.client_ops_conns in
  let prev_apply_history = !Undo_redo.apply_history_action in
  let prev_history_provider = !Undo_redo.history_action_ops_provider in
  let prev_gen_undo_ops = !Sync_deps.gen_undo_ops in
  let prev_clear_history = !Sync_deps.clear_history in
  let listeners = ref [] in
  List.iter
    (fun (repo, { conn; _ }) -> Worker_state.set_datascript_conn repo conn)
    repos;
  Hashtbl.reset Sync_state.client_ops_conns;
  List.iter
    (fun (repo, { ops_conn; _ }) ->
      match ops_conn with
      | Some db -> Hashtbl.replace Sync_state.client_ops_conns repo db
      | None -> ())
    repos;
  List.iter (fun (repo, _) -> Undo_redo.clear_history repo) repos;
  Undo_redo.apply_history_action := Some apply_history_action_adapter;
  Undo_redo.history_action_ops_provider :=
    (fun repo tx_id -> Sync_client_op.history_action_ops_by_tx_id repo tx_id);
  Sync_deps.gen_undo_ops := Some gen_undo_ops_adapter;
  Sync_deps.clear_history := Some Undo_redo.clear_history;
  List.iter
    (fun (repo, { conn; ops_conn }) ->
      match ops_conn with
      | Some _ ->
          let key = Printf.sprintf "db-sync-sim/%s" repo in
          ignore
            (Datascript.listen conn key (fun (r : tx_report) ->
                 let client_id =
                   match Worker_state.state_get "client-id" with
                   | Some w -> Ds_wire.value_of_transit w
                   | None -> Nil
                 in
                 let tx_meta =
                   ("client-id", client_id)
                   :: List.remove_assoc "client-id" r.tx_meta
                 in
                 let tx_meta =
                   match List.assoc_opt "local-tx?" tx_meta with
                   | None -> ("local-tx?", Bool true) :: tx_meta
                   | Some _ -> tx_meta
                 in
                 Sync_apply.enqueue_local_tx repo { r with tx_meta }));
          listeners := (conn, key) :: !listeners
      | None -> ())
    repos;
  Fun.protect
    ~finally:(fun () ->
      List.iter (fun (conn, key) -> Datascript.unlisten conn key) !listeners;
      List.iter
        (fun (_, { ops_conn; _ }) ->
          match ops_conn with
          | Some db -> (try Sqlite.close db with _ -> ())
          | None -> ())
        repos;
      List.iter
        (fun (repo, _) -> Worker_state.drop_datascript_conn repo)
        repos;
      List.iter
        (fun (repo, prev) ->
          match prev with
          | Some conn -> Worker_state.set_datascript_conn repo conn
          | None -> ())
        prev_datascript;
      Hashtbl.reset Sync_state.client_ops_conns;
      Hashtbl.iter
        (Hashtbl.replace Sync_state.client_ops_conns)
        prev_ops;
      List.iter (fun (repo, _) -> Undo_redo.clear_history repo) repos;
      Hashtbl.reset Undo_redo.undo_ops;
      Hashtbl.reset Undo_redo.redo_ops;
      Undo_redo.apply_history_action := prev_apply_history;
      Undo_redo.history_action_ops_provider := prev_history_provider;
      Sync_deps.gen_undo_ops := prev_gen_undo_ops;
      Sync_deps.clear_history := prev_clear_history)
    f

(* cljs make-client *)
let make_client repo : Sync_state.client = Sync_state.new_client repo

(* ---------- small entity/wire helpers ---------- *)

let db_of_conn = db_of

let ent_at_uuid db u = entity_at_uuid db u

let ent_uuid (e : entity) : string option =
  match Ldb.value e "block/uuid" with Some (Uuid u) -> Some u | _ -> None

let ent_uuid_exn (e : entity) : string =
  match ent_uuid e with Some u -> u | None -> ""

let ent_title_value (e : entity) : string option = Ldb.string_value e "block/title"

let is_page = Ldb.is_page

let page_bang_opt (e : entity option) : bool =
  match e with Some e -> is_page e | None -> false

let str_blank s = String.trim s = ""

let wire_nth (w : Wire.t) (i : int) : Wire.t option =
  match w with
  | Wire.Array xs | Wire.List xs ->
      (try Some (List.nth xs i) with _ -> None)
  | _ -> None

let tx_items_of (w : Wire.t) : Wire.t list =
  match w with Wire.Array xs | Wire.List xs -> xs | _ -> []

let wire_map pairs = Wire.Map (List.map (fun (k, v) -> (kw k, v)) pairs)

let edn_value (s : string) : value =
  Edn_util.value_of_edn (Edn_parser.of_edn_string s)

let edn_wire (s : string) : Wire.t = Ds_wire.transit_of_value (edn_value s)

let qstr s = Printf.sprintf "\"%s\"" s

let uuid_lit u = Printf.sprintf "#uuid %s" (qstr u)

(* await a synchronous Db_worker_effect (native impl is synchronous) *)
let await_unit (t : unit Db_worker_effect.t) : unit =
  let result = ref None in
  Db_worker_effect.on_any t
    (fun v -> result := Some (Ok v))
    (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok ()) -> ()
  | Some (Error e) -> raise e
  | None -> failwith "db-sync-sim: effect did not settle"

(* ---------- cljs page/block op helpers ---------- *)

(* cljs worker-page/create! *)
let page_create conn (title : string) ?uuid ?class_ () =
  ignore
    (Outliner_page.create_bang conn title
       ~opts:(fun () ->
         Outliner_page.create (db_of_conn conn) title ?uuid ?class_ ())
       ())

(* cljs ensure-base-page! *)
let ensure_base_page_bang conn (base_uuid : string) : unit =
  match ent_at_uuid (db_of_conn conn) base_uuid with
  | None -> page_create conn base_page_title ~uuid:base_uuid ()
  | Some _ -> ()

(* cljs create-page! *)
let create_page_bang conn (title : string) (uuid : string) : unit =
  page_create conn title ~uuid ()

(* cljs delete-page! *)
let delete_page_bang conn (uuid : string) : unit =
  ignore (Outliner_page.delete_conn conn uuid (Wire.Map []))

(* cljs create-block! *)
let create_block_bang conn (parent : entity) (title : string) (uuid : string)
    : unit =
  ignore
    (Outliner_core.insert_blocks_conn conn
       [ [ ("block/title", String title); ("block/uuid", Uuid uuid) ] ]
       (Block_map.of_entity parent)
       { Outliner_core.default_insert_opts with keep_uuid = true }
       [])

(* cljs update-title! *)
let update_title_bang conn (uuid : string) (new_title : string) : unit =
  ignore
    (Outliner_core.save_block_conn conn
       [ ("block/uuid", Uuid uuid); ("block/title", String new_title) ]
       Outliner_core.default_save_opts [])

(* cljs move-block! — re-resolves both entities by uuid *)
let move_block_bang conn (block_uuid : string) (parent_uuid : string) : unit =
  let db = db_of_conn conn in
  match ent_at_uuid db block_uuid, ent_at_uuid db parent_uuid with
  | Some block, Some parent ->
      Outliner_core.move_blocks_conn conn [ block ] parent
        Outliner_core.default_insert_opts []
  | _ -> ()

(* cljs delete-block! *)
let delete_block_bang conn (uuid : string) : unit =
  match ent_at_uuid (db_of_conn conn) uuid with
  | Some block ->
      ignore
        (Outliner_core.delete_blocks_conn conn
           [ Block_map.of_entity block ] [])
  | None -> ()

(* ---------- cljs normalize-op-block-ids / apply-ops! ---------- *)
(* Verbatim port of the same helpers in test_undo_redo_native.ml (each
   native test executable is self-contained — no shared helper edits). *)

let block_id_to_uuid db (w : Wire.t) : Wire.t =
  match w with
  | Wire.Uuid _ -> w
  | Wire.Array [ Wire.Keyword "block/uuid"; (Wire.Uuid _ as u) ]
  | Wire.List [ Wire.Keyword "block/uuid"; (Wire.Uuid _ as u) ] -> u
  | Wire.Int id ->
      (match Datascript.entity db (Entity_id id) with
       | Some e ->
           (match Ldb.value e "block/uuid" with
            | Some (Uuid u) -> Wire.Uuid u
            | _ -> w)
       | None -> w)
  | _ -> w

let property_id_to_ident db (w : Wire.t) : Wire.t =
  match w with
  | Wire.Keyword _ -> w
  | Wire.Int id ->
      (match Datascript.entity db (Entity_id id) with
       | Some e ->
           (match Ldb.value e "db/ident" with
            | Some (Keyword k) -> Wire.Keyword k
            | _ -> w)
       | None -> w)
  | _ -> w

let coll_ids db (w : Wire.t) : Wire.t =
  match w with
  | Wire.Array xs | Wire.List xs ->
      Wire.Array (List.map (block_id_to_uuid db) xs)
  | _ -> w

let normalize_op_entry db (entry : Wire.t) : Wire.t =
  match Outliner_op.op_of_entry entry with
  | None -> entry
  | Some (op, args) ->
      let id = block_id_to_uuid db in
      let pid = property_id_to_ident db in
      let cids = coll_ids db in
      let args' =
        match op, args with
        | "save-block", [ block; opts ] ->
            let block' =
              match block with
              | Wire.Map kvs ->
                  let db_id = wire_get "db/id" kvs in
                  let uuid_v = wire_get "block/uuid" kvs in
                  (match db_id, uuid_v with
                   | Some (Wire.Uuid u), _ ->
                       let kvs' =
                         List.filter
                           (fun (k, _) -> k <> Wire.Keyword "db/id")
                           kvs
                       in
                       (match uuid_v with
                        | Some _ -> Wire.Map kvs'
                        | None ->
                            Wire.Map
                              (kvs'
                              @ [ (Wire.Keyword "block/uuid", Wire.Uuid u) ]))
                   | Some ((Wire.Int _ | Wire.Int64 _) as idv), None ->
                       Wire.Map
                         (kvs @ [ (Wire.Keyword "block/uuid", id idv) ])
                   | _ -> block)
              | _ -> block
            in
            [ block'; opts ]
        | "insert-blocks", [ a; b; c ] -> [ a; id b; c ]
        | "apply-template", [ a; b; c ] -> [ id a; id b; c ]
        | "delete-blocks", [ a; b ] -> [ cids a; b ]
        | "move-blocks", [ a; b; c ] -> [ cids a; id b; c ]
        | "move-blocks-up-down", [ a; b ] -> [ cids a; b ]
        | "indent-outdent-blocks", [ a; b; c ] -> [ cids a; b; c ]
        | "set-block-property", [ a; b; c ] -> [ id a; pid b; c ]
        | "remove-block-property", [ a; b ] -> [ id a; pid b ]
        | "delete-property-value", [ a; b; c ] -> [ id a; pid b; c ]
        | "create-property-text-block", [ a; b; c; d ] ->
            [ (match a with Wire.Nil -> a | _ -> id a); pid b; c; d ]
        | "batch-set-property", [ a; b; c; d ] -> [ cids a; pid b; c; d ]
        | "batch-remove-property", [ a; b ] -> [ cids a; pid b ]
        | "batch-delete-property-value", [ a; b; c ] -> [ cids a; pid b; c ]
        | "class-add-property", [ a; b ] -> [ id a; pid b ]
        | "class-remove-property", [ a; b ] -> [ id a; pid b ]
        | "upsert-property", [ a; b; c ] ->
            [ (match a with Wire.Nil -> a | _ -> pid a); b; c ]
        | "upsert-closed-value", [ a; b ] -> [ pid a; b ]
        | "delete-closed-value", [ a; b ] -> [ pid a; id b ]
        | "add-existing-values-to-closed-values", [ a; b ] -> [ pid a; b ]
        | _ -> args
      in
      Wire.Array [ Wire.Keyword op; Wire.Array args' ]

let normalize_ops db (ops : Wire.t) : Wire.t =
  match ops with
  | Wire.Array xs | Wire.List xs ->
      Wire.Array (List.map (normalize_op_entry db) xs)
  | _ -> ops

(* cljs apply-ops! *)
let apply_ops_bang conn (ops : Wire.t) (opts : Wire.t) : Wire.t =
  Outliner_op.apply_ops conn (normalize_ops (db_of_conn conn) ops) opts

(* cljs existing-entities / existing-blocks *)
let existing_entities db (uuids : string list) : entity list =
  List.filter_map (fun u -> ent_at_uuid db u) uuids

let existing_blocks db (uuids : string list) : entity list =
  List.filter (fun e -> not (is_page e)) (existing_entities db uuids)

(* ---------- fake sync server ---------- *)

(* cljs datascript destructures only [op e a v] from a raw datom form
   (the trailing tx element is ignored and a string e acts as a tempid
   resolved via :block/uuid unique upsert); drop the trailing element so
   the OCaml tx-op parser takes the same path *)
let strip_datom_tx (item : Wire.t) : Wire.t =
  match item with
  | (Wire.Array (op :: rest) | Wire.List (op :: rest)) -> (
      match op with
      | Wire.Keyword "db/add" | Wire.Keyword "db/retract"
        when List.length rest > 3 -> (
          match item with
          | Wire.Array _ -> Wire.Array (op :: List.take 3 rest)
          | _ -> Wire.List (op :: List.take 3 rest))
      | _ -> item)
  | _ -> item

type server_tx = { srv_t : int; srv_tx : Wire.t list }

type server =
  { mutable srv_counter : int
  ; mutable srv_txs : server_tx list
  ; srv_conn : conn }

let make_server () : server =
  { srv_counter = 0; srv_txs = []; srv_conn = create_conn () }

let server_pull (server : server) (since : int) : Wire.t list list =
  List.filter_map
    (fun stx ->
       if stx.srv_t > since then
         Some (List.map strip_datom_tx stx.srv_tx)
       else None)
    server.srv_txs

(* cljs server-upload! — returns {:accepted? :t} *)
let server_upload_bang (server : server) (t_before : int)
    (tx_entries : Wire.t list) : bool * int =
  let accepted = ref false in
  if server.srv_counter = t_before then begin
    accepted := true;
    List.iter
      (fun tx_entry ->
        let tx_data =
          match Wire.get "tx-data" tx_entry with
          | Some w -> tx_items_of w
          | None -> []
        in
        let tx_data = List.map strip_datom_tx tx_data in
        let report =
          try
            Db_transact.transact server.srv_conn tx_data
              [ ("op", Keyword "apply-client-tx") ]
          with e ->
            let missing_entity_id =
              match e with
              | Dispatcher.Exn_info (_, kvs) ->
                  List.find_map
                    (fun (k, v) ->
                      match k with
                      | Wire.Keyword "entity-id" | Wire.String "entity-id" ->
                          Some v
                      | _ -> None)
                    kvs
              | _ -> None
            in
            let touches mid item =
              wire_nth item 1 = Some mid || wire_nth item 3 = Some mid
            in
            let same_entity_txs =
              match missing_entity_id with
              | Some mid ->
                  List.mapi
                    (fun idx entry ->
                      let entry_tx =
                        match Wire.get "tx-data" entry with
                        | Some w -> tx_items_of w
                        | None -> []
                      in
                      if List.exists (touches mid) entry_tx then
                        Some
                          (Wire.Map
                             [ kw "idx", Wire.Int idx
                             ; ( kw "tx-id"
                               , Option.value (Wire.get "tx-id" entry)
                                   ~default:Wire.Nil )
                             ; ( kw "outliner-op"
                               , Option.value (Wire.get "outliner-op" entry)
                                   ~default:Wire.Nil )
                             ; ( kw "tx-data"
                               , Option.value (Wire.get "tx-data" entry)
                                   ~default:(Wire.Array []) ) ])
                      else None)
                    tx_entries
                  |> List.filter_map Fun.id
              | None -> []
            in
            raise
              (Dispatcher.Exn_info
                 ( "server upload transact failed"
                 , [ kw "type", kw "db-sync-sim/server-upload-transact-failed"
                   ; kw "t-before", Wire.Int t_before
                   ; kw "server-t", Wire.Int server.srv_counter
                   ; ( kw "missing-entity-id"
                     , Option.value missing_entity_id ~default:Wire.Nil )
                   ; kw "matching-entries", Wire.List same_entity_txs
                   ; kw "tx-entry", tx_entry
                   ; kw "tx-data", Wire.List tx_data ] ))
        in
        let normalized =
          (* cljs normalizes the tx-report's datoms, not the input *)
          match report with
          | Some r ->
              Sync_apply.normalize_tx_data r.db_after r.db_before r.tx_data
          | None -> []
        in
        let next_t = server.srv_counter + 1 in
        server.srv_counter <- next_t;
        server.srv_txs <- server.srv_txs @ [ { srv_t = next_t; srv_tx = normalized } ])
      tx_entries
  end;
  (!accepted, server.srv_counter)

(* cljs build-upload-plan *)
let build_upload_plan (conn : conn) (pending : Sync_client_op.local_tx_entry list)
    : Wire.t list * string list =
  let tx_entries, drop_tx_ids, _drop_txs =
    Sync_apply.prepare_upload_tx_entries (Some conn) pending
  in
  (tx_entries, drop_tx_ids)

(* cljs sync-client! *)
type sim_client =
  { repo : string
  ; conn : conn
  ; client : Sync_state.client
  ; online : bool
  ; gen_uuid : (unit -> string) option }

let sync_client_bang ?(upload = server_upload_bang) (server : server)
    (c : sim_client) : bool =
  if not c.online then false
  else
    let progress = ref false in
    let repo = c.repo in
    let local_tx = Option.value (Sync_client_op.get_local_tx repo) ~default:0 in
    let server_t = server.srv_counter in
    (if local_tx < server_t then begin
       let txs = server_pull server local_tx in
       let remote_txs =
         List.map
           (fun tx_data -> Wire.Map [ kw "tx-data", Wire.List tx_data ])
           txs
       in
       await_unit (Sync_apply.apply_remote_txs repo c.client remote_txs);
       Sync_client_op.update_local_tx repo server_t;
       progress := true
     end);
    let pending = Sync_apply.pending_txs repo () in
    let local_tx' = Option.value (Sync_client_op.get_local_tx repo) ~default:0 in
    let server_t' = server.srv_counter in
    (if pending <> [] && local_tx' = server_t' then begin
       let tx_entries, drop_tx_ids = build_upload_plan c.conn pending in
       (if drop_tx_ids <> [] then begin
          ignore (Sync_apply.mark_pending_txs_false repo drop_tx_ids);
          progress := true
        end);
       (if tx_entries <> [] then begin
          let accepted, t = upload server local_tx' tx_entries in
          let tx_ids =
            List.filter_map
              (fun e ->
                match Wire.get "tx-id" e with
                | Some (Wire.String s) -> Some s
                | _ -> None)
              tx_entries
          in
          (if accepted then begin
             ignore (Sync_apply.mark_pending_txs_false repo tx_ids);
             (if tx_ids <> [] then begin
                Sync_client_op.update_local_tx repo t;
                progress := true
              end)
           end)
        end)
     end);
    !progress

(* cljs active-block-uuids *)
module UuidSet = Set.Make (String)

let active_block_uuids (db : db) : UuidSet.t =
  Datascript.datoms db Avet ~a:"block/uuid" ()
  |> List.of_seq
  |> List.filter_map (fun (d : datom) ->
         match Datascript.entity db (Entity_id d.e) with
         | Some ent ->
             if
               (not (Ldb.built_in ent))
               && Ldb.value ent "logseq.property/deleted-at" = None
               && (is_page ent
                   || Ldb.ref_ent ent "block/page" <> None)
             then (
               match d.v with Uuid u -> Some u | _ -> None)
             else None
         | None -> None)
  |> List.fold_left (fun s u -> UuidSet.add u s) UuidSet.empty

let set_diff a b = UuidSet.diff a b
let take n l = List.filteri (fun i _ -> i < n) l

(* forward decl equivalents — block-attr-map/checksum-entity-map are defined
   before sync-loop (cljs declares them). *)

type block_attrs =
  { a_page : bool
  ; a_title : string option
  ; a_order : string option
  ; a_parent : string option
  ; a_page_uuid : string option
  ; a_deleted_at : value option }

module UuidMap = Map.Make (String)

(* cljs block-attr-map *)
let block_attr_map (db : db) : block_attrs UuidMap.t =
  let eids =
    result_eids
      (Datascript.q_string db "[:find [?e ...] :where [?e :block/uuid]]")
  in
  List.fold_left
    (fun m eid ->
      match Datascript.entity db (Entity_id eid) with
      | Some ent ->
          let parent = Ldb.ref_ent ent "block/parent" in
          let page = Ldb.ref_ent ent "block/page" in
          if
            (not (Ldb.built_in ent))
            && Ldb.value ent "logseq.property/deleted-at" = None
            && (is_page ent || page <> None)
          then (
            match ent_uuid ent with
            | Some u ->
                UuidMap.add u
                  { a_page = is_page ent
                  ; a_title = Ldb.string_value ent "block/title"
                  ; a_order = Ldb.string_value ent "block/order"
                  ; a_parent =
                      (match parent with
                       | Some p -> ent_uuid p
                       | None -> None)
                  ; a_page_uuid =
                      (match page with Some p -> ent_uuid p | None -> None)
                  ; a_deleted_at =
                      Ldb.value ent "logseq.property/deleted-at" }
                  m
            | None -> m)
          else m
      | None -> m)
    UuidMap.empty eids

(* cljs checksum-entity-map *)
type checksum_attrs =
  { c_title : string option
  ; c_name : string option
  ; c_parent : string option
  ; c_page : string option }

let checksum_entity_map (db : db) : checksum_attrs UuidMap.t =
  let eids =
    result_eids
      (Datascript.q_string db "[:find [?e ...] :where [?e :block/uuid]]")
  in
  List.fold_left
    (fun m eid ->
      match Datascript.entity db (Entity_id eid) with
      | Some ent ->
          let parent = Ldb.ref_ent ent "block/parent" in
          let page = Ldb.ref_ent ent "block/page" in
          (match ent_uuid ent with
           | Some u ->
               UuidMap.add u
                 { c_title = Ldb.string_value ent "block/title"
                 ; c_name = Ldb.string_value ent "block/name"
                 ; c_parent =
                     (match parent with
                      | Some p -> ent_uuid p
                      | None -> None)
                 ; c_page =
                     (match page with Some p -> ent_uuid p | None -> None) }
                 m
           | None -> m)
      | None -> m)
    UuidMap.empty eids

(* cljs data/diff over uuid-keyed maps — (missing extra) entry lists. *)
let map_diff (base : 'a UuidMap.t) (other : 'a UuidMap.t) :
    (string * 'a) list * (string * 'a) list =
  let missing =
    UuidMap.fold
      (fun k v acc ->
        match UuidMap.find_opt k other with
        | Some v' when v' = v -> acc
        | _ -> (k, v) :: acc)
      base []
  in
  let extra =
    UuidMap.fold
      (fun k v acc ->
        match UuidMap.find_opt k base with
        | Some v' when v' = v -> acc
        | _ -> (k, v) :: acc)
      other []
  in
  (List.rev missing, List.rev extra)

let wire_of_uuid_attrs (pairs : (string * 'a) list) : Wire.t =
  Wire.List
    (List.map (fun (u, _) -> Wire.Uuid u) pairs)

(* cljs sync-loop! *)
let sync_loop_bang (server : server) (clients : sim_client list) : unit =
  let rec loop i =
    if i < 32 then begin
      let progress = ref false in
      List.iter
        (fun c -> if sync_client_bang server c then progress := true)
        clients;
      if !progress then loop (i + 1)
    end
  in
  loop 0;
  let conns =
    List.filter_map (fun c -> if c.online then Some c.conn else None) clients
  in
  (if conns <> [] then begin
     let online_clients = List.filter (fun c -> c.online) clients in
     let client_block_uuids =
       List.map
         (fun c ->
           let uuids = active_block_uuids (db_of_conn c.conn) in
           (c.repo, uuids, UuidSet.cardinal uuids))
         online_clients
     in
     let server_uuids = active_block_uuids (db_of_conn server.srv_conn) in
     let server_checksum =
       Db_sync_checksum.recompute_checksum (db_of_conn server.srv_conn)
     in
     let client_sync_states =
       List.map
         (fun c ->
           Wire.Map
             [ kw "repo", Wire.String c.repo
             ; ( kw "pending-count"
               , Wire.Int (List.length (Sync_apply.pending_txs c.repo ())) )
             ; ( kw "local-tx"
               , (match Sync_client_op.get_local_tx c.repo with
                  | Some t -> Wire.Int t
                  | None -> Wire.Nil) )
             ; kw "server-t", Wire.Int server.srv_counter ])
         online_clients
     in
     let checksum_states =
       List.map
         (fun c ->
           ( c.repo
           , Db_sync_checksum.recompute_checksum (db_of_conn c.conn) ))
         online_clients
     in
     let base_uuids =
       match client_block_uuids with
       | (_, u, _) :: _ -> u
       | [] -> UuidSet.empty
     in
     let block_counts =
       List.map (fun (_, _, n) -> n) client_block_uuids
     in
     let block_uuid_diffs =
       List.map
         (fun (repo, uuids, _) ->
           let missing = UuidSet.diff base_uuids uuids in
           let extra = UuidSet.diff uuids base_uuids in
           Wire.Map
             [ kw "repo", Wire.String repo
             ; kw "missing-count", Wire.Int (UuidSet.cardinal missing)
             ; kw "extra-count", Wire.Int (UuidSet.cardinal extra)
             ; ( kw "missing-sample"
               , Wire.List
                   (List.map
                      (fun u -> Wire.Uuid u)
                      (take 5 (UuidSet.elements missing))) )
             ; ( kw "extra-sample"
               , Wire.List
                   (List.map
                      (fun u -> Wire.Uuid u)
                      (take 5 (UuidSet.elements extra))) ) ])
         client_block_uuids
     in
     (if List.length (List.sort_uniq compare block_counts) <> 1 then begin
        raise
          (Dispatcher.Exn_info
             ( "blocks count not equal after sync"
             , [ ( kw "block-counts"
                 , Wire.List (List.map (fun n -> Wire.Int n) block_counts) )
               ; ( kw "clients"
                 , Wire.List
                     (List.map
                        (fun (repo, _, n) ->
                          Wire.Map
                            [ kw "repo", Wire.String repo
                            ; kw "datoms-count", Wire.Int n ])
                        client_block_uuids) )
               ; ( kw "checksums"
                 , Wire.List
                     (List.map
                        (fun (repo, sum) ->
                          Wire.Map
                            [ kw "repo", Wire.String repo
                            ; kw "checksum", Wire.String sum ])
                        checksum_states) )
               ; kw "sync-states", Wire.List client_sync_states
               ; ( kw "server"
                 , Wire.Map
                     [ kw "datoms-count", Wire.Int (UuidSet.cardinal server_uuids)
                     ; kw "checksum", Wire.String server_checksum
                     ; ( kw "missing-from-a"
                       , Wire.List
                           (List.map
                              (fun u -> Wire.Uuid u)
                              (take 5
                                 (UuidSet.elements
                                    (UuidSet.diff base_uuids server_uuids)))) )
                     ; ( kw "extra-vs-a"
                       , Wire.List
                           (List.map
                              (fun u -> Wire.Uuid u)
                              (take 5
                                 (UuidSet.elements
                                    (UuidSet.diff server_uuids base_uuids)))) ) ] )
               ; kw "block-uuid-diffs", Wire.List block_uuid_diffs ] ))
       end);
     (if
        List.length
          (List.sort_uniq compare
             (server_checksum :: List.map snd checksum_states))
        <> 1
      then
        let client_attrs =
          List.map
            (fun c -> (c.repo, block_attr_map (db_of_conn c.conn)))
            online_clients
        in
        let base_attrs =
          match client_attrs with (_, a) :: _ -> a | [] -> UuidMap.empty
        in
        let server_attrs = block_attr_map (db_of_conn server.srv_conn) in
        let attr_diffs =
          List.map
            (fun (repo, attrs) ->
              let missing, extra = map_diff base_attrs attrs in
              Wire.Map
                [ kw "repo", Wire.String repo
                ; kw "missing-sample", wire_of_uuid_attrs (take 5 missing)
                ; kw "extra-sample", wire_of_uuid_attrs (take 5 extra) ])
            client_attrs
        in
        let server_missing, server_extra = map_diff base_attrs server_attrs in
        let client_checksum_maps =
          List.map
            (fun c -> (c.repo, checksum_entity_map (db_of_conn c.conn)))
            online_clients
        in
        let base_checksum_attrs =
          match client_checksum_maps with
          | (_, a) :: _ -> a
          | [] -> UuidMap.empty
        in
        let server_checksum_attrs =
          checksum_entity_map (db_of_conn server.srv_conn)
        in
        let checksum_attr_diffs =
          List.map
            (fun (repo, attrs) ->
              let missing, extra = map_diff base_checksum_attrs attrs in
              Wire.Map
                [ kw "repo", Wire.String repo
                ; kw "missing-sample", wire_of_uuid_attrs (take 5 missing)
                ; kw "extra-sample", wire_of_uuid_attrs (take 5 extra) ])
            client_checksum_maps
        in
        let server_checksum_missing, server_checksum_extra =
          map_diff base_checksum_attrs server_checksum_attrs
        in
        raise
          (Dispatcher.Exn_info
             ( "checksums not equal after sync"
             , [ ( kw "checksums"
                 , Wire.List
                     (List.map
                        (fun (repo, sum) ->
                          Wire.Map
                            [ kw "repo", Wire.String repo
                            ; kw "checksum", Wire.String sum ])
                        checksum_states) )
               ; kw "sync-states", Wire.List client_sync_states
               ; kw "attr-diffs", Wire.List attr_diffs
               ; kw "checksum-attr-diffs", Wire.List checksum_attr_diffs
               ; ( kw "server"
                 , Wire.Map
                     [ kw "checksum", Wire.String server_checksum
                     ; kw "missing-sample", wire_of_uuid_attrs (take 5 server_missing)
                     ; kw "extra-sample", wire_of_uuid_attrs (take 5 server_extra)
                     ; ( kw "checksum-missing-sample"
                       , wire_of_uuid_attrs (take 5 server_checksum_missing) )
                     ; ( kw "checksum-extra-sample"
                       , wire_of_uuid_attrs (take 5 server_checksum_extra) ) ] )
               ] )))
   end)

(* cljs sync-until-idle! *)
let sync_until_idle_bang (server : server) (clients : sim_client list)
    (max_rounds : int) : int =
  let rec loop i =
    if i < max_rounds then begin
      let progress = ref false in
      List.iter
        (fun c -> if sync_client_bang server c then progress := true)
        clients;
      if !progress then loop (i + 1) else i
    end else i
  in
  loop 0

(* ---------- cljs db-issues ---------- *)

type issue = { issue_type : string; issue_uuid : string }

let db_issues (db : db) : issue list =
  let blocks =
    List.filter_map
      (fun eid -> Datascript.entity db (Entity_id eid))
      (result_eids
         (Datascript.q_string db
            "[:find [?e ...] :where [?e :block/uuid] [?e :block/page]]"))
  in
  let uuid e = ent_uuid e in
  let missing_parents =
    List.filter_map
      (fun e ->
        match Ldb.ref_ent e "block/parent" with
        | None ->
            Some { issue_type = "missing-parent"; issue_uuid = uuid_of e }
        | Some _ -> None)
      blocks
  in
  let missing_pages =
    List.filter_map
      (fun e ->
        match Ldb.ref_ent e "block/page" with
        | None ->
            Some { issue_type = "missing-page"; issue_uuid = uuid_of e }
        | Some _ -> None)
      blocks
  in
  let page_mismatches =
    List.filter_map
      (fun e ->
        let parent = Ldb.ref_ent e "block/parent" in
        let page = Ldb.ref_ent e "block/page" in
        let expected =
          match parent with
          | Some p -> Some (if is_page p then p else (match Ldb.ref_ent p "block/page" with Some x -> x | None -> p))
          | None -> None
        in
        match parent, page, expected with
        | Some _, Some pg, Some exp ->
            if ent_uuid exp <> ent_uuid pg then
              Some { issue_type = "page-mismatch"; issue_uuid = uuid_of e }
            else None
        | _ -> None)
      blocks
  in
  let cycles =
    List.filter_map
      (fun e ->
        let start = uuid e in
        let rec walk current seen steps =
          if steps >= 200 then true
          else
            match Ldb.ref_ent current "block/parent" with
            | None -> false
            | Some next_ent -> (
                match uuid next_ent with
                | Some next_uuid when List.mem next_uuid seen -> true
                | Some next_uuid ->
                    walk next_ent (next_uuid :: seen) (steps + 1)
                | None -> false)
        in
        let is_cycle =
          match start with
          | Some s -> walk e [ s ] 0
          | None -> walk e [] 0
        in
        if is_cycle then
          Some { issue_type = "cycle"; issue_uuid = uuid_of e }
        else None)
      blocks
  in
  missing_parents @ missing_pages @ page_mismatches @ cycles

(* ---------- cljs sim default property / classes ---------- *)

let sim_default_property_title = "Sim Default Property"

let sim_default_property_schema : Wire.t =
  edn_wire
    "{:logseq.property/type :default :db/cardinality :db.cardinality/one}"

let find_property_by_title (db : db) (title : string) : entity option =
  match
    result_eids
      (Datascript.q_string db
         "[:find [?e ...] :in $ ?title :where [?e :block/title ?title] \
          [?e :block/tags :logseq.class/Property]]"
         ~inputs:[ Arg_scalar (Result_value (String title)) ])
  with
  | eid :: _ -> Datascript.entity db (Entity_id eid)
  | [] -> None

let ensure_property_bang conn (title : string) (schema : Wire.t) : entity option =
  match find_property_by_title (db_of_conn conn) title with
  | Some e -> Some e
  | None ->
      ignore
        (apply_ops_bang conn
           (edn_wire
              (Printf.sprintf
                 "[[:upsert-property [nil %s {:property-name %s}]]]"
                 (Ds_wire.edn_of_transit schema) (qstr title)))
           (Wire.Map []));
      find_property_by_title (db_of_conn conn) title

let user_classes (db : db) : entity list =
  List.filter_map
    (fun eid -> Datascript.entity db (Entity_id eid))
    (result_eids
       (Datascript.q_string db
          "[:find [?e ...] :where [?e :block/tags :logseq.class/Tag] \
           [?e :block/uuid]]"))
  |> List.filter (fun e -> not (Ldb.built_in e))

let ensure_class_bang (rng : unit -> float) conn : entity option =
  match rand_nth_bang rng (user_classes (db_of_conn conn)) with
  | Some e -> Some e
  | None ->
      let title = Printf.sprintf "Class-%d" (rand_int_bang rng 1000000) in
      let class_uuid = rng_uuid rng in
      page_create conn title ~uuid:class_uuid ~class_:true ();
      ent_at_uuid (db_of_conn conn) class_uuid

(* ---------- sim state ---------- *)

(* cljs {:pages #{} :blocks #{}} — insertion-ordered lists (see header). *)
type sim_state = { mutable pages : string list; mutable blocks : string list }

let new_state base_uuid : sim_state = { pages = [ base_uuid ]; blocks = [] }

let set_add l u = if List.mem u l then l else l @ [ u ]
let set_remove l u = List.filter (fun x -> x <> u) l

(* ---------- sim ops ---------- *)

(* cljs op-* fns; results are cljs-map-like assoc lists with "op" key. *)
type op_result = (string * Wire.t) list

let op_create_page rng conn state gen_uuid : op_result option =
  let uuid =
    match gen_uuid with Some f -> f () | None -> Uuid_gen.uuid ()
  in
  let title = Printf.sprintf "Page-%d" (rand_int_bang rng 1000000) in
  create_page_bang conn title uuid;
  state.pages <- set_add state.pages uuid;
  Some [ "op", kw "create-page"; "uuid", Wire.Uuid uuid; "title", Wire.String title ]

let op_delete_page rng conn (base_uuid : string option) state : op_result option =
  let db = db_of_conn conn in
  let pages =
    List.filter
      (fun e ->
        match base_uuid with
        | Some bu -> ent_uuid e <> Some bu
        | None -> true)
      (existing_entities db state.pages)
  in
  match rand_nth_bang rng pages with
  | Some page -> (
      match ent_uuid page with
      | Some u ->
          delete_page_bang conn u;
          state.pages <- set_remove state.pages u;
          Some [ "op", kw "delete-page"; "uuid", Wire.Uuid u ]
      | None -> None)
  | None -> None

let op_create_block rng conn state (base_uuid : string option) gen_uuid : op_result option =
  let db = db_of_conn conn in
  let pages =
    existing_entities db state.pages
    @ (match base_uuid with
       | Some bu ->
           List.filter_map
             (fun uuid -> if uuid = bu then ent_at_uuid db uuid else None)
             [ bu ]
       | None -> [])
  in
  let blocks = existing_blocks db state.blocks in
  let parents = pages @ blocks in
  match rand_nth_bang rng parents with
  | Some parent -> (
      match ent_uuid parent with
      | Some parent_uuid when is_page parent || Ldb.ref_ent parent "block/page" <> None -> (
          match ent_at_uuid db parent_uuid with
          | Some parent' ->
              let uuid =
                match gen_uuid with
                | Some f -> f ()
                | None -> Uuid_gen.uuid ()
              in
              create_block_bang conn parent' "" uuid;
              state.blocks <- set_add state.blocks uuid;
              Some
                [ "op", kw "create-block"
                ; "uuid", Wire.Uuid uuid
                ; "parent", Wire.Uuid parent_uuid ]
          | None -> None)
      | _ -> None)
  | None -> None

let ensure_random_block rng conn state (base_uuid : string option) gen_uuid : entity option =
  match rand_nth_bang rng (existing_blocks (db_of_conn conn) state.blocks) with
  | Some e -> Some e
  | None -> (
      match op_create_block rng conn state base_uuid gen_uuid with
      | Some result -> (
          match List.assoc_opt "uuid" result with
          | Some (Wire.Uuid u) -> ent_at_uuid (db_of_conn conn) u
          | _ -> None)
      | None -> None)

let op_update_title rng conn state (_base_uuid : string option) : op_result option =
  let db = db_of_conn conn in
  let ents = existing_entities db state.blocks in
  match rand_nth_bang rng ents with
  | Some ent -> (
      match ent_at_uuid db (ent_uuid_exn ent) with
      | Some block when not (is_page block) ->
          let uuid = ent_uuid_exn block in
          let new_title = Printf.sprintf "title-%d" block.id in
          update_title_bang conn uuid new_title;
          Some
            [ "op", kw "update-title"
            ; "uuid", Wire.Uuid uuid
            ; "title", Wire.String new_title ]
      | _ -> None)
  | None -> None

let op_save_block rng conn state (base_uuid : string option) : op_result option =
  match op_update_title rng conn state base_uuid with
  | Some result ->
      Some (("op", kw "save-block") :: List.remove_assoc "op" result)
  | None -> None

let op_insert_blocks rng conn state (base_uuid : string option) gen_uuid : op_result option =
  match op_create_block rng conn state base_uuid gen_uuid with
  | Some result ->
      Some (("op", kw "insert-blocks") :: List.remove_assoc "op" result)
  | None -> None

let op_move_block rng conn state (base_uuid : string option) : op_result option =
  let db = db_of_conn conn in
  let block = rand_nth_bang rng (existing_blocks db state.blocks) in
  let parents =
    existing_entities db state.pages
    @ existing_blocks db state.blocks
    @ (match base_uuid with
       | Some bu ->
           List.filter_map
             (fun uuid -> if uuid = bu then ent_at_uuid db uuid else None)
             [ bu ]
       | None -> [])
  in
  let parent = rand_nth_bang rng parents in
  match block, parent with
  | Some b, Some p -> (
      match ent_uuid b, ent_uuid p with
      | Some bu, Some pu when bu <> pu ->
          move_block_bang conn bu pu;
          Some
            [ "op", kw "move-block"
            ; "uuid", Wire.Uuid bu
            ; "parent", Wire.Uuid pu ]
      | _ -> None)
  | _ -> None

let op_move_blocks rng conn state (base_uuid : string option) : op_result option =
  match op_move_block rng conn state base_uuid with
  | Some result ->
      Some (("op", kw "move-blocks") :: List.remove_assoc "op" result)
  | None -> None

let op_move_blocks_up_down rng conn state : op_result option =
  let db = db_of_conn conn in
  let block = rand_nth_bang rng (existing_blocks db state.blocks) in
  let up = rand_int_bang rng 2 = 0 in
  match block with
  | Some b -> (
      try
        Outliner_core.move_blocks_up_down_conn conn [ b ] up;
        Some
          [ "op", kw "move-blocks-up-down"
          ; "uuid", Wire.Uuid (ent_uuid_exn b)
          ; "up?", Wire.Bool up ]
      with _ -> None)
  | None -> None

let op_indent_outdent_blocks rng conn state : op_result option =
  let db = db_of_conn conn in
  let blocks = existing_blocks db state.blocks in
  let indent = rand_int_bang rng 2 = 0 in
  let candidates =
    if indent then
      (* Indent requires a left sibling. *)
      List.filter
        (fun b -> Option.is_some (Ldb.get_left_sibling b))
        blocks
    else
      (* Avoid picking top-level page children for outdent. *)
      List.filter
        (fun b ->
          match Ldb.ref_ent b "block/parent" with
          | Some parent ->
              Option.is_some (Ldb.ref_ent parent "block/parent")
          | None -> false)
        blocks
  in
  match rand_nth_bang rng candidates with
  | Some b -> (
      try
        Outliner_core.indent_outdent_blocks_conn conn [ b ] indent [];
        Some
          [ "op", kw "indent-outdent-blocks"
          ; "uuid", Wire.Uuid (ent_uuid_exn b)
          ; "indent?", Wire.Bool indent ]
      with _ -> None)
  | None -> None

let op_delete_block rng conn state : op_result option =
  let db = db_of_conn conn in
  match rand_nth_bang rng (existing_blocks db state.blocks) with
  | Some block -> (
      match ent_uuid block with
      | Some u ->
          if Option.is_some (ent_at_uuid (db_of_conn conn) u) then begin
            delete_block_bang conn u;
            state.blocks <- set_remove state.blocks u;
            Some [ "op", kw "delete-block"; "uuid", Wire.Uuid u ]
          end else None
      | None -> None)
  | None -> None

let op_delete_blocks rng conn state : op_result option =
  match op_delete_block rng conn state with
  | Some result ->
      Some (("op", kw "delete-blocks") :: List.remove_assoc "op" result)
  | None -> None

let op_rename_page rng conn state (base_uuid : string option) : op_result option =
  let db = db_of_conn conn in
  let pages =
    List.filter
      (fun e ->
        match base_uuid with
        | Some bu -> ent_uuid e <> Some bu
        | None -> true)
      (existing_entities db state.pages)
  in
  match rand_nth_bang rng pages with
  | Some page -> (
      match ent_uuid page with
      | Some page_uuid ->
          let new_title =
            Printf.sprintf "Renamed-%d" (rand_int_bang rng 1000000)
          in
          (try
             ignore
               (Outliner_core.save_block_conn conn
                  [ ("block/uuid", Uuid page_uuid)
                  ; ("block/title", String new_title) ]
                  Outliner_core.default_save_opts []);
             Some
               [ "op", kw "rename-page"
               ; "uuid", Wire.Uuid page_uuid
               ; "title", Wire.String new_title ]
           with _ -> None)
      | None -> None)
  | None -> None

let op_toggle_reaction rng conn state : op_result option =
  let db = db_of_conn conn in
  match rand_nth_bang rng (existing_blocks db state.blocks) with
  | Some block -> (
      match ent_uuid block with
      | Some block_uuid ->
          (try
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf
                        "[[:toggle-reaction [%s \"+1\" nil]]]"
                        (uuid_lit block_uuid)))
                  (Wire.Map []));
             Some
               [ "op", kw "toggle-reaction"
               ; "uuid", Wire.Uuid block_uuid
               ; "emoji", Wire.String "+1" ]
           with _ -> None)
      | None -> None)
  | None -> None

let op_transact rng conn state : op_result option =
  let db = db_of_conn conn in
  match rand_nth_bang rng (existing_blocks db state.blocks) with
  | Some block -> (
      match ent_uuid block with
      | Some uuid ->
          let new_title =
            Printf.sprintf "tx-title-%d" (rand_int_bang rng 1000000)
          in
          ignore
            (Db_transact.transact conn
               [ Wire.List
                   [ kw "db/add"
                   ; Wire.List [ kw "block/uuid"; Wire.Uuid uuid ]
                   ; kw "block/title"
                   ; Wire.String new_title ] ]
               []);
          Some
            [ "op", kw "transact"
            ; "uuid", Wire.Uuid uuid
            ; "title", Wire.String new_title ]
      | None -> None)
  | None -> None

let op_upsert_property _rng conn : op_result option =
  let title = sim_default_property_title in
  let schema = sim_default_property_schema in
  let existing = find_property_by_title (db_of_conn conn) title in
  ignore
    (apply_ops_bang conn
       (edn_wire
          (Printf.sprintf "[[:upsert-property [%s %s {:property-name %s}]]]"
             (match existing with
              | Some e ->
                  (match Ldb.ident_of e with
                   | Some ident -> ":" ^ ident
                   | None -> "nil")
              | None -> "nil")
             (Ds_wire.edn_of_transit schema)
             (qstr title)))
       (Wire.Map []));
  match find_property_by_title (db_of_conn conn) title with
  | Some property ->
      Some
        [ "op", kw "upsert-property"
        ; ( "property"
          , (match Ldb.ident_of property with
             | Some ident -> kw ident
             | None -> Wire.Nil) ) ]
  | None -> None

(* cljs pick-settable-property-input *)
let pick_settable_property_input rng conn (property : entity)
    (value_prefix : string) : Wire.t * Wire.t =
  let property =
    match Ldb.ent_of_id (db_of_conn conn) property.id with
    | Some p -> p
    | None -> property
  in
  let closed_values =
    Ldb.ref_ents property "block/_closed-value-property"
  in
  match closed_values with
  | _ :: _ ->
      let v = Option.get (rand_nth_bang rng closed_values) in
      (Wire.Int v.id, Wire.Map [ (kw "entity-id?", Wire.Bool true) ])
  | [] ->
      ( Wire.String
          (Printf.sprintf "%s-%d" value_prefix (rand_int_bang rng 1000000))
      , Wire.Map [] )

let op_set_block_property rng conn state (base_uuid : string option) gen_uuid : op_result option =
  match ensure_random_block rng conn state base_uuid gen_uuid with
  | Some block -> (
      match
        ensure_property_bang conn sim_default_property_title
          sim_default_property_schema
      with
      | Some property ->
          let value, _options =
            pick_settable_property_input rng conn property "prop-value"
          in
          (try
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf
                        "[[:set-block-property [%d %s %s]]]"
                        block.id
                        (match Ldb.ident_of property with
                         | Some i -> ":" ^ i
                         | None -> "nil")
                        (Ds_wire.edn_of_transit value)))
                  (Wire.Map []));
             Some
               [ "op", kw "set-block-property"
               ; "uuid", Wire.Uuid (ent_uuid_exn block)
               ; ( "property"
                 , (match Ldb.ident_of property with
                    | Some i -> kw i
                    | None -> Wire.Nil) )
               ; "value", value ]
           with _ -> None)
      | None -> None)
  | None -> None

let op_remove_block_property rng conn state (base_uuid : string option) gen_uuid : op_result option =
  match ensure_random_block rng conn state base_uuid gen_uuid with
  | Some block -> (
      match
        ensure_property_bang conn sim_default_property_title
          sim_default_property_schema
      with
      | Some property ->
          let value, _options =
            pick_settable_property_input rng conn property "remove-prop"
          in
          (try
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf
                        "[[:set-block-property [%d %s %s]]]"
                        block.id
                        (match Ldb.ident_of property with
                         | Some i -> ":" ^ i
                         | None -> "nil")
                        (Ds_wire.edn_of_transit value)))
                  (Wire.Map []));
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf
                        "[[:remove-block-property [%d %s]]]"
                        block.id
                        (match Ldb.ident_of property with
                         | Some i -> ":" ^ i
                         | None -> "nil")))
                  (Wire.Map []));
             Some
               [ "op", kw "remove-block-property"
               ; "uuid", Wire.Uuid (ent_uuid_exn block)
               ; ( "property"
                 , (match Ldb.ident_of property with
                    | Some i -> kw i
                    | None -> Wire.Nil) ) ]
           with _ -> None)
      | None -> None)
  | None -> None

(* cljs create-property-text-block-with-uuid! *)
let create_property_text_block_with_uuid conn (property_id : int)
    (value : string) (value_uuid : string) : string option =
  ignore
    (apply_ops_bang conn
       (edn_wire
          (Printf.sprintf
             "[[:create-property-text-block [nil %d %s {:new-block-id %s}]]]"
             property_id (qstr value) (uuid_lit value_uuid)))
       (Wire.Map []));
  match ent_at_uuid (db_of_conn conn) value_uuid with
  | Some _ -> Some value_uuid
  | None -> None

let op_create_property_text_block rng conn : op_result option =
  match
    ensure_property_bang conn sim_default_property_title
      sim_default_property_schema
  with
  | Some property ->
      let value =
        Printf.sprintf "value-block-%d" (rand_int_bang rng 1000000)
      in
      (try
         let value_uuid =
           create_property_text_block_with_uuid conn property.id value
             (rng_uuid rng)
         in
         Some
           [ "op", kw "create-property-text-block"
           ; ( "property"
             , (match Ldb.ident_of property with
                | Some i -> kw i
                | None -> Wire.Nil) )
           ; ( "value-uuid"
             , (match value_uuid with
                | Some u -> Wire.Uuid u
                | None -> Wire.Nil) ) ]
       with _ -> None)
  | None -> None

let op_batch_set_property rng conn state (base_uuid : string option) gen_uuid : op_result option =
  match
    ensure_property_bang conn sim_default_property_title
      sim_default_property_schema
  with
  | Some property -> (
      let blocks =
        List.init 2 (fun _ ->
            ensure_random_block rng conn state base_uuid gen_uuid)
        |> List.filter_map Fun.id
      in
      let blocks =
        List.fold_left
          (fun acc b -> if List.exists (fun x -> x.id = b.id) acc then acc else acc @ [ b ])
          [] blocks
      in
      match blocks with
      | [] -> None
      | _ ->
          let block_ids = List.map (fun b -> b.id) blocks in
          let value, options =
            pick_settable_property_input rng conn property "batch-prop"
          in
          (try
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf
                        "[[:batch-set-property [[%s] %s %s %s]]]"
                        (String.concat " "
                           (List.map string_of_int block_ids))
                        (match Ldb.ident_of property with
                         | Some i -> ":" ^ i
                         | None -> "nil")
                        (Ds_wire.edn_of_transit value)
                        (Ds_wire.edn_of_transit options)))
                  (Wire.Map []));
             Some
               [ "op", kw "batch-set-property"
               ; ( "blocks"
                 , Wire.List
                     (List.map
                        (fun b -> Wire.Uuid (ent_uuid_exn b))
                        blocks) )
               ; ( "property"
                 , (match Ldb.ident_of property with
                    | Some i -> kw i
                    | None -> Wire.Nil) ) ]
           with _ -> None))
  | None -> None

let op_batch_remove_property rng conn state (base_uuid : string option) gen_uuid : op_result option =
  match
    ensure_property_bang conn sim_default_property_title
      sim_default_property_schema
  with
  | Some property -> (
      match
        Option.bind base_uuid (fun bu -> ent_at_uuid (db_of_conn conn) bu)
      with
      | Some base_page ->
          let new_block () =
            let uuid =
              match gen_uuid with
              | Some f -> f ()
              | None -> Uuid_gen.uuid ()
            in
            let title =
              Printf.sprintf "batch-remove-%d" (rand_int_bang rng 1000000)
            in
            create_block_bang conn base_page title uuid;
            state.blocks <- set_add state.blocks uuid;
            ent_at_uuid (db_of_conn conn) uuid
          in
          let blocks =
            List.init 2 (fun _ -> new_block ()) |> List.filter_map Fun.id
          in
          (match blocks with
           | [] -> None
           | _ ->
               let block_ids = List.map (fun b -> b.id) blocks in
               let value, options =
                 pick_settable_property_input rng conn property "to-remove"
               in
               (try
                  ignore
                    (apply_ops_bang conn
                       (edn_wire
                          (Printf.sprintf
                             "[[:batch-set-property [[%s] %s %s %s]]]"
                             (String.concat " "
                                (List.map string_of_int block_ids))
                             (match Ldb.ident_of property with
                              | Some i -> ":" ^ i
                              | None -> "nil")
                             (Ds_wire.edn_of_transit value)
                             (Ds_wire.edn_of_transit options)))
                       (Wire.Map []));
                  ignore
                    (apply_ops_bang conn
                       (edn_wire
                          (Printf.sprintf
                             "[[:batch-remove-property [[%s] %s]]]"
                             (String.concat " "
                                (List.map string_of_int block_ids))
                             (match Ldb.ident_of property with
                              | Some i -> ":" ^ i
                              | None -> "nil")))
                       (Wire.Map []));
                  Some
                    [ "op", kw "batch-remove-property"
                    ; ( "blocks"
                      , Wire.List
                          (List.map
                             (fun b -> Wire.Uuid (ent_uuid_exn b))
                             blocks) )
                    ; ( "property"
                      , (match Ldb.ident_of property with
                         | Some i -> kw i
                         | None -> Wire.Nil) ) ]
                with _ -> None))
      | None -> None)
  | None -> None

let op_class_add_property rng conn : op_result option =
  match ensure_class_bang rng conn with
  | Some class_ -> (
      match
        ensure_property_bang conn sim_default_property_title
          sim_default_property_schema
      with
      | Some property ->
          (try
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf "[[:class-add-property [%d %s]]]"
                        class_.id
                        (match Ldb.ident_of property with
                         | Some i -> ":" ^ i
                         | None -> "nil")))
                  (Wire.Map []));
             Some
               [ "op", kw "class-add-property"
               ; "class", Wire.Uuid (ent_uuid_exn class_)
               ; ( "property"
                 , (match Ldb.ident_of property with
                    | Some i -> kw i
                    | None -> Wire.Nil) ) ]
           with _ -> None)
      | None -> None)
  | None -> None

let op_class_remove_property rng conn : op_result option =
  match ensure_class_bang rng conn with
  | Some class_ -> (
      match
        ensure_property_bang conn sim_default_property_title
          sim_default_property_schema
      with
      | Some property ->
          (try
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf "[[:class-add-property [%d %s]]]"
                        class_.id
                        (match Ldb.ident_of property with
                         | Some i -> ":" ^ i
                         | None -> "nil")))
                  (Wire.Map []));
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf "[[:class-remove-property [%d %s]]]"
                        class_.id
                        (match Ldb.ident_of property with
                         | Some i -> ":" ^ i
                         | None -> "nil")))
                  (Wire.Map []));
             Some
               [ "op", kw "class-remove-property"
               ; "class", Wire.Uuid (ent_uuid_exn class_)
               ; ( "property"
                 , (match Ldb.ident_of property with
                    | Some i -> kw i
                    | None -> Wire.Nil) ) ]
           with _ -> None)
      | None -> None)
  | None -> None

let op_upsert_closed_value rng conn : op_result option =
  match
    ensure_property_bang conn sim_default_property_title
      sim_default_property_schema
  with
  | Some property ->
      let value = Printf.sprintf "choice-%d" (rand_int_bang rng 1000000) in
      (try
         ignore
           (apply_ops_bang conn
              (edn_wire
                 (Printf.sprintf
                    "[[:upsert-closed-value [%d {:value %s}]]]"
                    property.id (qstr value)))
              (Wire.Map []));
         Some
           [ "op", kw "upsert-closed-value"
           ; ( "property"
             , (match Ldb.ident_of property with
                | Some i -> kw i
                | None -> Wire.Nil) )
           ; "value", Wire.String value ]
       with _ -> None)
  | None -> None

let op_delete_closed_value rng conn : op_result option =
  match
    ensure_property_bang conn sim_default_property_title
      sim_default_property_schema
  with
  | Some property ->
      let value =
        Printf.sprintf "delete-choice-%d" (rand_int_bang rng 1000000)
      in
      (try
         ignore
           (apply_ops_bang conn
              (edn_wire
                 (Printf.sprintf
                    "[[:upsert-closed-value [%d {:value %s}]]]"
                    property.id (qstr value)))
              (Wire.Map []));
         match
           Ldb.ref_ents property "block/_closed-value-property"
         with
         | value_block :: _ ->
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf
                        "[[:delete-closed-value [%d %d]]]"
                        property.id value_block.id))
                  (Wire.Map []));
             Some
               [ "op", kw "delete-closed-value"
               ; ( "property"
                 , (match Ldb.ident_of property with
                    | Some i -> kw i
                    | None -> Wire.Nil) )
               ; "value-id", Wire.Int value_block.id ]
         | [] -> None
       with _ -> None)
  | None -> None

let op_add_existing_values_to_closed_values rng conn : op_result option =
  match
    ensure_property_bang conn sim_default_property_title
      sim_default_property_schema
  with
  | Some property ->
      (try
         let value_a =
           Printf.sprintf "existing-a-%d" (rand_int_bang rng 1000000)
         in
         let value_b =
           Printf.sprintf "existing-b-%d" (rand_int_bang rng 1000000)
         in
         let uuid_a =
           create_property_text_block_with_uuid conn property.id value_a
             (rng_uuid rng)
         in
         let uuid_b =
           create_property_text_block_with_uuid conn property.id value_b
             (rng_uuid rng)
         in
         let uuids = List.filter_map Fun.id [ uuid_a; uuid_b ] in
         match uuids with
         | [] -> None
         | _ ->
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf
                        "[[:add-existing-values-to-closed-values [%d [%s]]]]"
                        property.id
                        (String.concat " " (List.map uuid_lit uuids))))
                  (Wire.Map []));
             Some
               [ "op", kw "add-existing-values-to-closed-values"
               ; ( "property"
                 , (match Ldb.ident_of property with
                    | Some i -> kw i
                    | None -> Wire.Nil) )
               ; ( "uuids"
                 , Wire.List (List.map (fun u -> Wire.Uuid u) uuids) ) ]
       with _ -> None)
  | None -> None

let op_delete_property_value rng conn state (base_uuid : string option) gen_uuid : op_result option =
  match ensure_class_bang rng conn with
  | Some class_ -> (
      match ensure_random_block rng conn state base_uuid gen_uuid with
      | Some block ->
          (try
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf
                        "[[:set-block-property [%d :block/tags %d]]]"
                        block.id class_.id))
                  (Wire.Map []));
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf
                        "[[:delete-property-value [%d :block/tags %d]]]"
                        block.id class_.id))
                  (Wire.Map []));
             Some
               [ "op", kw "delete-property-value"
               ; "uuid", Wire.Uuid (ent_uuid_exn block)
               ; "class", Wire.Uuid (ent_uuid_exn class_) ]
           with _ -> None)
      | None -> None)
  | None -> None

let op_batch_delete_property_value rng conn state (base_uuid : string option) gen_uuid : op_result option =
  match ensure_class_bang rng conn with
  | Some class_ -> (
      let blocks =
        List.init 2 (fun _ ->
            ensure_random_block rng conn state base_uuid gen_uuid)
        |> List.filter_map Fun.id
      in
      let blocks =
        List.fold_left
          (fun acc b -> if List.exists (fun x -> x.id = b.id) acc then acc else acc @ [ b ])
          [] blocks
      in
      match blocks with
      | [] -> None
      | _ ->
          let block_ids = List.map (fun b -> b.id) blocks in
          (try
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf
                        "[[:batch-set-property [[%s] :block/tags %d {}]]]"
                        (String.concat " "
                           (List.map string_of_int block_ids))
                        class_.id))
                  (Wire.Map []));
             ignore
               (apply_ops_bang conn
                  (edn_wire
                     (Printf.sprintf
                        "[[:batch-delete-property-value [[%s] :block/tags %d]]]"
                        (String.concat " "
                           (List.map string_of_int block_ids))
                        class_.id))
                  (Wire.Map []));
             Some
               [ "op", kw "batch-delete-property-value"
               ; ( "blocks"
                 , Wire.List
                     (List.map
                        (fun b -> Wire.Uuid (ent_uuid_exn b))
                        blocks) )
               ; "class", Wire.Uuid (ent_uuid_exn class_) ]
           with _ -> None))
  | None -> None

(* cljs block-and-descendant-uuids *)
let block_and_descendant_uuids (db : db) (block : entity) : UuidSet.t =
  Ldb.get_block_full_children_ids db block.id
  |> fun ids ->
    List.filter_map
      (fun id ->
        match Datascript.entity db (Entity_id id) with
        | Some e -> ent_uuid e
        | None -> None)
      (block.id :: ids)
  |> List.fold_left (fun s u -> UuidSet.add u s) UuidSet.empty

(* cljs block-tree-preorder *)
let block_tree_preorder (root : entity) : entity list =
  let rec walk (node : entity) : entity list =
    node
    :: List.concat_map walk
         (Ldb.sort_by_order (Ldb.ref_ents node "block/_parent"))
  in
  walk root

(* cljs subvec *)
let sub_list l i j =
  List.filteri (fun idx _ -> idx >= i && idx < j) l

(* cljs random-copied-block-tree *)
let random_copied_block_tree (rng : unit -> float) (source : entity) :
    Wire.t list =
  let nodes = block_tree_preorder source in
  let max_size = max 1 (min 12 (List.length nodes)) in
  let size = 1 + rand_int_bang rng max_size in
  let nodes' = sub_list nodes 0 size in
  let uuid_map = Hashtbl.create 16 in
  List.iter
    (fun node ->
      match ent_uuid node with
      | Some u -> Hashtbl.replace uuid_map u (rng_uuid rng)
      | None -> ())
    nodes';
  List.map
    (fun node ->
      let old_uuid = ent_uuid node in
      let new_uuid =
        match old_uuid with
        | Some u -> (try Hashtbl.find uuid_map u with Not_found -> u)
        | None -> ""
      in
      let parent_uuid =
        match Ldb.ref_ent node "block/parent" with
        | Some p -> ent_uuid p
        | None -> None
      in
      let base_pairs =
        [ ("block/uuid", Wire.Uuid new_uuid)
        ; ("block/title", Wire.String (Option.value (ent_title_value node) ~default:"")) ]
      in
      let pairs =
        match parent_uuid with
        | Some pu when Hashtbl.mem uuid_map pu ->
            base_pairs
            @ [ ( "block/parent"
                , Wire.List
                    [ kw "block/uuid"; Wire.Uuid (Hashtbl.find uuid_map pu) ] ) ]
        | _ -> base_pairs
      in
      Wire.Map (List.map (fun (k, v) -> (kw k, v)) pairs))
    nodes'

(* cljs op-copy-paste-block-tree-into-empty-target! *)
let op_copy_paste_block_tree_into_empty_target rng conn state _base_uuid :
    op_result option =
  let db = db_of_conn conn in
  let sources =
    List.filter
      (fun block ->
        Ldb.sort_by_order (Ldb.ref_ents block "block/_parent") <> [])
      (existing_blocks db state.blocks)
  in
  match rand_nth_bang rng sources with
  | Some source -> (
      let source_uuid = ent_uuid source in
      let source_page_uuid =
        match Ldb.ref_ent source "block/page" with
        | Some p -> ent_uuid p
        | None -> None
      in
      let source_descendants = block_and_descendant_uuids db source in
      let targets =
        existing_blocks db state.blocks
        |> List.filter (fun target ->
               match ent_uuid target with
               | Some u -> not (UuidSet.mem u source_descendants)
               | None -> false)
        |> List.filter (fun target ->
               let page_uuid =
                 match Ldb.ref_ent target "block/page" with
                 | Some p -> ent_uuid p
                 | None -> None
               in
               source_page_uuid = page_uuid
               && str_blank (Option.value (ent_title_value target) ~default:"")
               && Ldb.ref_ents target "block/_parent" = [])
      in
      match rand_nth_bang rng targets with
      | Some target -> (
          let target_uuid = ent_uuid target in
          let copied_tree = random_copied_block_tree rng source in
          match copied_tree with
          | [] -> None
          | _ ->
              ignore
                (apply_ops_bang conn
                   (Wire.Array
                      [ Wire.Array
                          [ kw "insert-blocks"
                          ; Wire.Array
                              [ Wire.List copied_tree
                              ; Wire.Int target.id
                              ; Wire.Map
                                  [ kw "sibling?", Wire.Bool true
                                  ; kw "outliner-op", kw "paste"
                                  ; kw "replace-empty-target?", Wire.Bool true ] ] ] ])
                   (Wire.Map []));
              Some
                [ "op", kw "copy-paste-block-tree-into-empty-target"
                ; ( "uuid"
                  , (match source_uuid with
                     | Some u -> Wire.Uuid u
                     | None -> Wire.Nil) )
                ; ( "target"
                  , (match target_uuid with
                     | Some u -> Wire.Uuid u
                     | None -> Wire.Nil) )
                ; "copied-size", Wire.Int (List.length copied_tree) ])
      | None -> None)
  | None -> None

(* cljs op-cut-paste-block-with-child! *)
let op_cut_paste_block_with_child rng conn state _base_uuid : op_result option =
  let db = db_of_conn conn in
  let sources =
    List.filter
      (fun block ->
        Ldb.sort_by_order (Ldb.ref_ents block "block/_parent") <> [])
      (existing_blocks db state.blocks)
  in
  match rand_nth_bang rng sources with
  | Some source -> (
      let source_uuid = ent_uuid source in
      let source_page_uuid =
        match Ldb.ref_ent source "block/page" with
        | Some p -> ent_uuid p
        | None -> None
      in
      let source_descendants = block_and_descendant_uuids db source in
      let targets =
        existing_blocks db state.blocks
        |> List.filter (fun target ->
               match ent_uuid target with
               | Some u -> not (UuidSet.mem u source_descendants)
               | None -> false)
        |> List.filter (fun target ->
               let page_uuid =
                 match Ldb.ref_ent target "block/page" with
                 | Some p -> ent_uuid p
                 | None -> None
               in
               source_page_uuid = page_uuid
               && str_blank (Option.value (ent_title_value target) ~default:"")
               && Ldb.ref_ents target "block/_parent" = [])
      in
      match rand_nth_bang rng targets with
      | Some target ->
          let target_uuid = ent_uuid target in
          let direct_children =
            Ldb.sort_by_order (Ldb.ref_ents source "block/_parent")
          in
          (match direct_children with
           | [] -> None
           | _ ->
               ignore
                 (apply_ops_bang conn
                    (Wire.Array
                       [ Wire.Array
                           [ kw "move-blocks"
                           ; Wire.Array
                               [ Wire.List [ Wire.Int source.id ]
                               ; Wire.Int target.id
                               ; Wire.Map [ kw "sibling?", Wire.Bool true ] ] ]
                       ; Wire.Array
                           [ kw "delete-blocks"
                           ; Wire.Array
                               [ Wire.List [ Wire.Int target.id ]
                               ; Wire.Map [] ] ] ])
                    (Wire.Map []));
               Some
                 [ "op", kw "cut-paste-block-with-child"
                 ; ( "uuid"
                   , (match source_uuid with
                      | Some u -> Wire.Uuid u
                      | None -> Wire.Nil) )
                 ; ( "target"
                   , (match target_uuid with
                      | Some u -> Wire.Uuid u
                      | None -> Wire.Nil) )
                 ; ( "children"
                   , Wire.List
                       (List.map
                          (fun c ->
                            match ent_uuid c with
                            | Some u -> Wire.Uuid u
                            | None -> Wire.Nil)
                          direct_children) ) ])
      | None -> None)
  | None -> None

let op_undo _rng (repo : string option) : op_result option =
  match repo with
  | Some repo ->
      let result = Undo_redo.undo repo in
      if result <> Undo_redo.empty_stack_result ~undo:true then
        Some [ "op", kw "undo" ]
      else None
  | None -> None

let op_redo _rng (repo : string option) : op_result option =
  match repo with
  | Some repo ->
      let result = Undo_redo.redo repo in
      if result <> Undo_redo.empty_stack_result ~undo:false then
        Some [ "op", kw "redo" ]
      else None
  | None -> None

(* ---------- cljs op-table / weighted pick ---------- *)

type op_entry = { op_name : string; op_weight : int }

(* cljs op-table — same names, same order, same default weights *)
let op_table : op_entry list =
  [ { op_name = "create-page"; op_weight = 6 }
  ; { op_name = "rename-page"; op_weight = 2 }
  ; { op_name = "delete-page"; op_weight = 10 }
  ; { op_name = "save-block"; op_weight = 4 }
  ; { op_name = "upsert-property"; op_weight = 2 }
  ; { op_name = "set-block-property"; op_weight = 3 }
  ; { op_name = "remove-block-property"; op_weight = 2 }
  ; { op_name = "delete-property-value"; op_weight = 1 }
  ; { op_name = "create-property-text-block"; op_weight = 2 }
  ; { op_name = "batch-set-property"; op_weight = 2 }
  ; { op_name = "batch-remove-property"; op_weight = 2 }
  ; { op_name = "batch-delete-property-value"; op_weight = 1 }
  ; { op_name = "class-add-property"; op_weight = 1 }
  ; { op_name = "class-remove-property"; op_weight = 1 }
  ; { op_name = "upsert-closed-value"; op_weight = 1 }
  ; { op_name = "delete-closed-value"; op_weight = 1 }
  ; { op_name = "add-existing-values-to-closed-values"; op_weight = 1 }
  ; { op_name = "insert-blocks"; op_weight = 10 }
  ; { op_name = "delete-blocks"; op_weight = 4 }
  ; { op_name = "move-blocks"; op_weight = 6 }
  ; { op_name = "move-blocks-up-down"; op_weight = 3 }
  ; { op_name = "indent-outdent-blocks"; op_weight = 3 }
  ; { op_name = "toggle-reaction"; op_weight = 2 }
  ; { op_name = "transact"; op_weight = 3 }
  ; { op_name = "undo"; op_weight = 10 }
  ; { op_name = "redo"; op_weight = 10 }
  ; { op_name = "create-block"; op_weight = 10 }
  ; { op_name = "move-block"; op_weight = 6 }
  ; { op_name = "copy-paste-block-tree-into-empty-target"; op_weight = 4 }
  ; { op_name = "cut-paste-block-with-child"; op_weight = 4 }
  ; { op_name = "delete-block"; op_weight = 4 }
  ; { op_name = "update-title"; op_weight = 8 } ]

let required_core_outliner_op_names =
  [ "save-block"
  ; "insert-blocks"
  ; "delete-blocks"
  ; "move-blocks"
  ; "move-blocks-up-down"
  ; "indent-outdent-blocks"
  ; "upsert-property"
  ; "set-block-property"
  ; "remove-block-property"
  ; "delete-property-value"
  ; "create-property-text-block"
  ; "batch-set-property"
  ; "batch-remove-property"
  ; "batch-delete-property-value"
  ; "class-add-property"
  ; "class-remove-property"
  ; "upsert-closed-value"
  ; "delete-closed-value"
  ; "add-existing-values-to-closed-values"
  ; "create-page"
  ; "rename-page"
  ; "delete-page"
  ; "toggle-reaction"
  ; "transact" ]

let local_undo_redo_run_count = 1000
let local_undo_redo_full_cycle_runs = 5

let local_undo_redo_coverage_ops =
  List.sort_uniq compare (required_core_outliner_op_names @ [ "undo"; "redo" ])

let local_undo_redo_op_weights =
  [ ("create-page", 6)
  ; ("rename-page", 2)
  ; ("delete-page", 10)
  ; ("save-block", 4)
  ; ("upsert-property", 2)
  ; ("set-block-property", 3)
  ; ("remove-block-property", 2)
  ; ("delete-property-value", 1)
  ; ("create-property-text-block", 2)
  ; ("batch-set-property", 2)
  ; ("batch-remove-property", 2)
  ; ("batch-delete-property-value", 1)
  ; ("class-add-property", 1)
  ; ("class-remove-property", 1)
  ; ("upsert-closed-value", 1)
  ; ("delete-closed-value", 1)
  ; ("add-existing-values-to-closed-values", 1)
  ; ("insert-blocks", 10)
  ; ("delete-blocks", 4)
  ; ("move-blocks", 6)
  ; ("move-blocks-up-down", 3)
  ; ("indent-outdent-blocks", 10)
  ; ("toggle-reaction", 2)
  ; ("transact", 3)
  ; ("undo", 10)
  ; ("redo", 10) ]

let local_undo_redo_cycle_op_weights =
  [ ("create-block", 14)
  ; ("delete-block", 10)
  ; ("move-block", 8)
  ; ("indent-outdent-blocks", 3)
  ; ("move-blocks-up-down", 3)
  ; ("update-title", 8)
  ; ("undo", 12)
  ; ("redo", 12) ]

(* cljs build-weighted-op-table *)
let build_weighted_op_table (required_ops : string list)
    (op_weights : (string * int) list) (label : string) : op_entry list =
  let registered = List.map (fun e -> e.op_name) op_table in
  let configured = List.map fst op_weights in
  let missing_op_defs =
    List.filter (fun r -> not (List.mem r registered)) required_ops
  in
  let missing_weights =
    List.filter (fun r -> not (List.mem r configured)) required_ops
  in
  let extra_weights =
    List.filter (fun c -> not (List.mem c required_ops)) configured
  in
  let invalid_weights =
    List.filter_map
      (fun (name, weight) -> if weight <= 0 then Some name else None)
      op_weights
    |> List.sort_uniq compare
  in
  (if missing_op_defs <> [] then
     failwith
       (Printf.sprintf
          "missing sim op definitions for weighted %s op table" label));
  (if missing_weights <> [] then
     failwith
       (Printf.sprintf "missing weighted %s op weights" label));
  (if extra_weights <> [] then
     failwith
       (Printf.sprintf "unexpected weighted %s op weights" label));
  (if invalid_weights <> [] then
     failwith
       (Printf.sprintf "invalid weighted %s op weights" label));
  List.filter_map
    (fun item ->
      if List.mem item.op_name required_ops then
        Some
          { item with
            op_weight = List.assoc item.op_name op_weights }
      else None)
    op_table

(* cljs op-count *)
let op_count (history : history) (op : string) : int =
  List.length
    (List.filter
       (fun entry ->
         match List.assoc_opt "op" entry with
         | Some (Wire.Keyword s) -> s = op
         | _ -> false)
       !history)

(* cljs pick-op-opts {:disable-ops :enable-ops} + op-table-override *)
type pick_op_opts =
  { enable_ops : string list option
  ; disable_ops : string list option }

type run_ops_opts =
  { pick_op_opts : pick_op_opts
  ; op_table_override : op_entry list option
  ; context : Wire.t option }

let default_run_ops_opts =
  { pick_op_opts = { enable_ops = None; disable_ops = None }
  ; op_table_override = None
  ; context = None }

(* cljs pick-op *)
let pick_op (rng : unit -> float) (opts : pick_op_opts)
    (table : op_entry list option) : string =
  let selected =
    match table with Some t -> t | None -> op_table
  in
  let filtered =
    match opts.enable_ops with
    | Some ops ->
        List.filter (fun item -> List.mem item.op_name ops) selected
    | None -> selected
  in
  let filtered =
    match opts.disable_ops with
    | Some ops ->
        List.filter (fun item -> not (List.mem item.op_name ops)) filtered
    | None -> filtered
  in
  (match filtered with
   | [] ->
       raise
         (Dispatcher.Exn_info
            ( "No available sim ops after filtering"
            , [ ( kw "enable-ops"
                , (match opts.enable_ops with
                   | Some ops ->
                       Wire.List (List.map kw ops)
                   | None -> Wire.Nil) )
              ; ( kw "disable-ops"
                , (match opts.disable_ops with
                   | Some ops ->
                       Wire.List (List.map kw ops)
                   | None -> Wire.Nil) ) ] ))
   | _ -> ());
  let total =
    List.fold_left (fun acc item -> acc + item.op_weight) 0 filtered
  in
  let target = rand_int_bang rng total in
  let rec loop remaining items =
    match items with
    | [] -> (match filtered with first :: _ -> first.op_name | [] -> "")
    | item :: rest ->
        if remaining < item.op_weight then item.op_name
        else loop (remaining - item.op_weight) rest
  in
  loop target filtered

(* cljs run-ops! ctx {:keys [repo conn base-uuid state gen-uuid]} *)
type run_ctx =
  { repo : string option
  ; conn : conn
  ; base_uuid : string option
  ; state : sim_state
  ; gen_uuid : (unit -> string) option }

let run_ops_bang (rng : unit -> float) (ctx : run_ctx) (steps : int)
    (history : history) (opts : run_ops_opts) : unit =
  for step = 0 to steps - 1 do
    let name =
      pick_op rng opts.pick_op_opts opts.op_table_override
    in
    (* cljs (case name (f rng conn state ...)) — per-op arg shapes *)
    let result =
      match name with
      | "create-page" -> op_create_page rng ctx.conn ctx.state ctx.gen_uuid
      | "rename-page" -> op_rename_page rng ctx.conn ctx.state ctx.base_uuid
      | "delete-page" -> op_delete_page rng ctx.conn ctx.base_uuid ctx.state
      | "save-block" -> op_save_block rng ctx.conn ctx.state ctx.base_uuid
      | "upsert-property" -> op_upsert_property rng ctx.conn
      | "set-block-property" ->
          op_set_block_property rng ctx.conn ctx.state ctx.base_uuid ctx.gen_uuid
      | "remove-block-property" ->
          op_remove_block_property rng ctx.conn ctx.state ctx.base_uuid ctx.gen_uuid
      | "delete-property-value" ->
          op_delete_property_value rng ctx.conn ctx.state ctx.base_uuid ctx.gen_uuid
      | "create-property-text-block" -> op_create_property_text_block rng ctx.conn
      | "batch-set-property" ->
          op_batch_set_property rng ctx.conn ctx.state ctx.base_uuid ctx.gen_uuid
      | "batch-remove-property" ->
          op_batch_remove_property rng ctx.conn ctx.state ctx.base_uuid ctx.gen_uuid
      | "batch-delete-property-value" ->
          op_batch_delete_property_value rng ctx.conn ctx.state ctx.base_uuid ctx.gen_uuid
      | "class-add-property" -> op_class_add_property rng ctx.conn
      | "class-remove-property" -> op_class_remove_property rng ctx.conn
      | "upsert-closed-value" -> op_upsert_closed_value rng ctx.conn
      | "delete-closed-value" -> op_delete_closed_value rng ctx.conn
      | "add-existing-values-to-closed-values" ->
          op_add_existing_values_to_closed_values rng ctx.conn
      | "insert-blocks" ->
          op_insert_blocks rng ctx.conn ctx.state ctx.base_uuid ctx.gen_uuid
      | "delete-blocks" -> op_delete_blocks rng ctx.conn ctx.state
      | "move-blocks" -> op_move_blocks rng ctx.conn ctx.state ctx.base_uuid
      | "move-blocks-up-down" -> op_move_blocks_up_down rng ctx.conn ctx.state
      | "indent-outdent-blocks" -> op_indent_outdent_blocks rng ctx.conn ctx.state
      | "toggle-reaction" -> op_toggle_reaction rng ctx.conn ctx.state
      | "transact" -> op_transact rng ctx.conn ctx.state
      | "undo" -> op_undo rng ctx.repo
      | "redo" -> op_redo rng ctx.repo
      | "create-block" ->
          op_create_block rng ctx.conn ctx.state ctx.base_uuid ctx.gen_uuid
      | "update-title" -> op_update_title rng ctx.conn ctx.state ctx.base_uuid
      | "move-block" -> op_move_block rng ctx.conn ctx.state ctx.base_uuid
      | "copy-paste-block-tree-into-empty-target" ->
          op_copy_paste_block_tree_into_empty_target rng ctx.conn ctx.state ctx.base_uuid
      | "cut-paste-block-with-child" ->
          op_cut_paste_block_with_child rng ctx.conn ctx.state ctx.base_uuid
      | "delete-block" -> op_delete_block rng ctx.conn ctx.state
      | _ -> None
    in
    match result with
    | Some result ->
        let entry =
          ("type", kw "op") :: ("step", Wire.Int step) :: result
        in
        let entry =
          match ctx.repo with
          | Some r -> ("repo", Wire.String r) :: entry
          | None -> entry
        in
        let entry =
          match opts.context with
          | Some c -> ("context", c) :: entry
          | None -> entry
        in
        history := !history @ [ entry ]
    | None -> ()
  done

(* cljs prime-op-context! *)
let rec prime_op_context_bang (rng : unit -> float) (ctx : run_ctx)
    (history : history) (op : string) ?(op_table_override : op_entry list option)
    () : unit =
  let setup_run setup_op ~times =
    for _ = 1 to times do
      run_ops_bang rng ctx 1 history
        { pick_op_opts =
            { enable_ops = Some [ setup_op ]; disable_ops = None }
        ; op_table_override =
            (match op_table_override with
             | Some t -> Some t
             | None -> None)
        ; context =
            Some
              (wire_map
                 [ "phase", kw "prime"
                 ; "target", kw op
                 ; "setup-op", kw setup_op ]) }
    done
  in
  match op with
  | "delete-page" | "rename-page" -> setup_run "create-page" ~times:1
  | "save-block" | "delete-blocks" | "move-blocks" | "toggle-reaction"
  | "transact" ->
      setup_run "insert-blocks" ~times:2
  | "move-blocks-up-down" | "indent-outdent-blocks" ->
      setup_run "insert-blocks" ~times:4
  | "set-block-property" | "remove-block-property" | "delete-property-value"
  | "create-property-text-block" | "batch-set-property"
  | "batch-remove-property" | "batch-delete-property-value" ->
      setup_run "insert-blocks" ~times:2;
      setup_run "upsert-property" ~times:1
  | "class-add-property" | "class-remove-property" ->
      setup_run "insert-blocks" ~times:1;
      setup_run "upsert-property" ~times:1
  | "upsert-closed-value" | "delete-closed-value" ->
      setup_run "upsert-property" ~times:1
  | "add-existing-values-to-closed-values" ->
      setup_run "upsert-property" ~times:1;
      setup_run "create-property-text-block" ~times:2
  | "undo" -> setup_run "insert-blocks" ~times:2
  | "redo" ->
      setup_run "insert-blocks" ~times:2;
      setup_run "undo" ~times:1
  | _ -> ()

(* cljs ensure-op-recorded! *)
let ensure_op_recorded_bang (rng : unit -> float) (ctx : run_ctx)
    (history : history) (op : string) (max_attempts : int)
    ?(op_table_override : op_entry list option) () : bool =
  let rec loop attempt =
    let before = op_count history op in
    prime_op_context_bang rng ctx history op ?op_table_override ();
    run_ops_bang rng ctx 1 history
      { pick_op_opts =
          { enable_ops = Some [ op ]; disable_ops = None }
      ; op_table_override
      ; context =
          Some
            (wire_map
               [ "phase", kw "ensure-op"
               ; "target", kw op
               ; "attempt", Wire.Int attempt ]) };
    let after = op_count history op in
    if after > before then true
    else if attempt < max_attempts then loop (attempt + 1)
    else false
  in
  loop 0

(* ---------- test helpers ---------- *)

let op_runs = 200

(* cljs update-local-checksum-listener *)
let update_local_checksum_listener (repo : string) (conn : conn)
    (listener_key : string) : unit =
  ignore
    (Datascript.listen conn listener_key (fun (r : tx_report) ->
       if (not (Db_tx.flags_of conn).Db_tx.batch_tx) && r.tx_data <> [] then
         Sync_client.update_local_sync_checksum repo r))

(* cljs undo-all! / redo-all! *)
let undo_all (repo : string) (max_steps : int) : int =
  let rec loop count =
    if count >= max_steps then
      raise
        (Dispatcher.Exn_info
           ( "undo-all exceeded max steps"
           , [ kw "repo", Wire.String repo
             ; kw "max-steps", Wire.Int max_steps ] ));
    if Undo_redo.undo repo = Undo_redo.empty_stack_result ~undo:true then
      count
    else loop (count + 1)
  in
  loop 0

let redo_all (repo : string) (max_steps : int) : int =
  let rec loop count =
    if count >= max_steps then
      raise
        (Dispatcher.Exn_info
           ( "redo-all exceeded max steps"
           , [ kw "repo", Wire.String repo
             ; kw "max-steps", Wire.Int max_steps ] ));
    if Undo_redo.redo repo = Undo_redo.empty_stack_result ~undo:false then
      count
    else loop (count + 1)
  in
  loop 0

(* cljs run-random-ops! *)
let run_random_ops_bang (rng : unit -> float) (server : server)
    (clients : sim_client list) (repo_state : (string * sim_state) list)
    (base_uuid : string) (history : history) (opts : run_ops_opts)
    (steps : int) : unit =
  for _ = 1 to steps do
    match rand_nth_bang rng clients with
    | Some client ->
        let state = List.assoc client.repo repo_state in
        run_ops_bang rng
          { repo = Some client.repo
          ; conn = client.conn
          ; base_uuid = Some base_uuid
          ; state
          ; gen_uuid = client.gen_uuid }
          1 history opts;
        sync_loop_bang server clients
    | None -> ()
  done

(* cljs run-local-ops! *)
let run_local_ops_bang (rng : unit -> float) (conn : conn)
    (base_uuid : string) (state : sim_state)
    (gen_uuid : (unit -> string) option) (steps : int) (history : history)
    (opts : run_ops_opts) : unit =
  for _ = 1 to steps do
    run_ops_bang rng
      { repo = None
      ; conn
      ; base_uuid = Some base_uuid
      ; state
      ; gen_uuid }
      1 history opts
  done

(* cljs assert-synced-attrs! [seed history attrs-a attrs-b attrs-c] *)
let assert_synced_attrs_bang (seed : int) (history : history)
    (attrs_a : block_attrs UuidMap.t) (attrs_b : block_attrs UuidMap.t)
    (attrs_c : block_attrs UuidMap.t) : unit =
  let eq = UuidMap.equal (fun a b -> a = b) in
  (if not (eq attrs_a attrs_b) || not (eq attrs_a attrs_c) then
     report_history_bang seed history
       (Some [ "type", kw "attrs-mismatch" ]));
  check "attrs-a = attrs-b" (eq attrs_a attrs_b);
  check "attrs-a = attrs-c" (eq attrs_a attrs_c)

(* cljs assert-no-invalid-tx! *)
let assert_no_invalid_tx_bang (seed : int) (history : history)
    (repro : Wire.t option ref) : unit =
  match !repro with
  | Some payload ->
      report_history_bang seed history
        (Some
           [ "type", kw "invalid-tx"
           ; ( "tx-meta"
             , Option.value (Wire.get "tx-meta" payload) ~default:Wire.Nil )
           ; ( "errors"
             , Option.value (Wire.get "errors" payload) ~default:Wire.Nil ) ]);
      check "no invalid tx payload" false
  | None -> check "no invalid tx payload" true

(* cljs assert-checksum-cache-aligned! [seed _history server repo+conn] *)
let assert_checksum_cache_aligned_bang (seed : int) (server : server)
    (repo_conns : (string * conn) list) : unit =
  let states =
    List.map
      (fun (repo, conn) ->
        ( repo
        , Db_sync_checksum.recompute_checksum (db_of_conn conn)
        , Sync_client_op.get_local_checksum repo ))
      repo_conns
  in
  let full_checksums = List.map (fun (_, f, _) -> f) states in
  let server_checksum =
    Db_sync_checksum.recompute_checksum (db_of_conn server.srv_conn)
  in
  (if
     not
       (List.length (List.sort_uniq compare full_checksums) = 1
        && List.for_all
             (fun (_, f, c) -> c = Some f)
             states
        && (match full_checksums with
            | first :: _ -> first = server_checksum
            | [] -> false))
   then
     Printf.eprintf
       "[db-sync-sim-checksum-cache-mismatch] seed=%d server=%s\n%!"
       seed server_checksum);
  check "full checksums converge"
    (List.length (List.sort_uniq compare full_checksums) = 1);
  List.iter
    (fun (repo, full, cached) ->
      check
        (Printf.sprintf "cached checksum == full checksum (%s)" repo)
        (cached = Some full))
    states;
  (match full_checksums with
   | first :: _ ->
       check "server checksum == client full checksum"
         (first = server_checksum)
   | [] -> ())

(* ---------- tests (cljs deftest order) ---------- *)

(* deftest rng-uuid-deterministic-test *)
let test_rng_uuid_deterministic () =
  let rng_a = make_rng 42
  and rng_b = make_rng 42
  and rng_c = make_rng 43 in
  let seq_a = List.init 3 (fun _ -> rng_uuid rng_a) in
  let seq_b = List.init 3 (fun _ -> rng_uuid rng_b) in
  let seq_c = List.init 3 (fun _ -> rng_uuid rng_c) in
  check "seq-a = seq-b" (seq_a = seq_b);
  check "seq-a <> seq-c" (seq_a <> seq_c)

(* deftest invalid-tx-repro-callback-test *)
let test_invalid_tx_repro_callback () =
  let seed = 7 in
  let history = ref [ [ ("type", kw "op"); ("op", kw "create-page") ] ] in
  let dummy_db = db_of (create_conn ()) in
  let tx_report =
    { db_before = dummy_db
    ; db_after = dummy_db
    ; tx_data =
        [ Datascript.datom ~e:1 ~a:"block/title" ~v:(String "oops") ~tx:1
            ~added:true () ]
    ; tx_meta = [ ("db-sync-sim", Bool true) ]
    ; tempids = [] }
  in
  let errors = [ "missing required key: block/page" ] in
  let { repro; restore } = install_invalid_tx_repro_bang seed history in
  Fun.protect
    ~finally:restore
    (fun () ->
      (match !Db_tx.transact_invalid_callback with
       | Some f -> f tx_report errors
       | None -> failwith "transact-invalid-callback not installed");
      let expected =
        Wire.Map
          [ kw "type", kw "invalid-tx"
          ; kw "tx-meta", Ds_wire.transit_of_tx_meta tx_report.tx_meta
          ; ( kw "tx-data"
            , Wire.List
                (List.map Ds_wire.transit_of_datom tx_report.tx_data) )
          ; ( kw "errors"
            , Wire.List (List.map (fun s -> Wire.String s) errors) ) ]
      in
      check "repro payload" (!repro = Some expected))

(* deftest sync-loop-all-offline-no-error-test *)
let test_sync_loop_all_offline_no_error () =
  let conn = create_conn () in
  let client = make_client repo_a in
  let server = make_server () in
  let clients =
    [ { repo = repo_a; conn; client; online = false; gen_uuid = None } ]
  in
  sync_loop_bang server clients;
  check "sync-loop returned" true

(* deftest two-clients-initial-sync-keeps-shared-base-page-test *)
let test_two_clients_initial_sync_keeps_shared_base_page () =
  let seed =
    match env_seed () with Some s -> s | None -> default_seed
  in
  let rng = make_rng seed in
  let gen_uuid () = rng_uuid rng in
  let base_uuid = gen_uuid () in
  let conn_a = create_conn ()
  and conn_b = create_conn () in
  let ops_a = new_client_ops_db ()
  and ops_b = new_client_ops_db () in
  let client_a = make_client repo_a
  and client_b = make_client repo_b in
  let server = make_server () in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
    ; repo_b, { conn = conn_b; ops_conn = Some ops_b } ]
    (fun () ->
      Hashtbl.reset Sync_apply.repo_latest_remote_tx;
      List.iter
        (fun conn -> ensure_base_page_bang conn base_uuid)
        [ conn_a; conn_b ];
      List.iter
        (fun repo -> Sync_client_op.update_local_tx repo 0)
        [ repo_a; repo_b ];
      let base_a = ent_at_uuid (db_of_conn conn_a) base_uuid in
      let parent_uuid = gen_uuid ()
      and child_uuid = gen_uuid ()
      and target_uuid = gen_uuid () in
      let clients =
        [ { repo = repo_a; conn = conn_a; client = client_a; online = true
          ; gen_uuid = Some gen_uuid }
        ; { repo = repo_b; conn = conn_b; client = client_b; online = true
          ; gen_uuid = Some gen_uuid } ]
      in
      (match base_a with
       | Some base -> create_block_bang conn_a base "seed-parent" parent_uuid
       | None -> ());
      (match ent_at_uuid (db_of_conn conn_a) parent_uuid with
       | Some parent ->
           create_block_bang conn_a parent "seed-child" child_uuid
       | None -> ());
      (match base_a with
       | Some base -> create_block_bang conn_a base "" target_uuid
       | None -> ());
      ignore (sync_until_idle_bang server clients 64);
      match ent_at_uuid (db_of_conn conn_b) base_uuid with
      | Some base_b ->
          check "client-b shares base page uuid" true;
          check "client-b base page is a page" (is_page base_b);
          check "client-b base page not deleted"
            (Ldb.value base_b "logseq.property/deleted-at" = None)
      | None -> check "client-b shares base page uuid" false)

(* deftest recycled-entities-are-excluded-from-sim-comparison-test *)
let test_recycled_entities_are_excluded_from_sim_comparison () =
  let base_uuid = Uuid_gen.uuid ()
  and block_uuid = Uuid_gen.uuid () in
  let conn = create_conn () in
  ensure_base_page_bang conn base_uuid;
  (match ent_at_uuid (db_of_conn conn) base_uuid with
   | Some base_page ->
       create_block_bang conn base_page "to recycle" block_uuid;
       delete_block_bang conn block_uuid;
       check "deleted block not in active uuids"
         (not (UuidSet.mem block_uuid (active_block_uuids (db_of_conn conn))));
       check "deleted block not in block-attr-map"
         (not (UuidMap.mem block_uuid (block_attr_map (db_of_conn conn))))
   | None -> check "base page exists" false)

(* deftest uploaded-pending-txs-are-cleared-in-sim-test *)
let test_uploaded_pending_txs_are_cleared_in_sim () =
  let base_uuid = Uuid_gen.uuid ()
  and block_uuid = Uuid_gen.uuid () in
  let conn = create_conn () in
  let ops_conn = new_client_ops_db () in
  let client = make_client repo_a in
  let server = make_server () in
  with_test_repos
    [ repo_a, { conn; ops_conn = Some ops_conn } ]
    (fun () ->
      Hashtbl.reset Sync_apply.repo_latest_remote_tx;
      Sync_client_op.update_local_tx repo_a 0;
      ensure_base_page_bang conn base_uuid;
      match ent_at_uuid (db_of_conn conn) base_uuid with
      | Some base_page ->
          create_block_bang conn base_page "synced block" block_uuid;
          check "pending txs exist before sync"
            (Sync_apply.pending_txs repo_a () <> []);
          check "sync-client! returns true"
            (sync_client_bang server
               { repo = repo_a; conn; client; online = true
               ; gen_uuid = None });
          check "pending txs empty after sync"
            (Sync_apply.pending_txs repo_a () = []);
          check "server t == local-tx"
            (Some server.srv_counter = Sync_client_op.get_local_tx repo_a);
          check "server has the synced block"
            (ent_at_uuid (db_of_conn server.srv_conn) block_uuid <> None)
      | None -> check "base page exists" false)

(* deftest two-clients-online-offline-sim-test *)
let test_two_clients_online_offline_sim () =
  let seed = Option.value (env_seed ()) ~default:default_seed in
  let rng = make_rng seed in
  let gen_uuid () = rng_uuid rng in
  let base_uuid = gen_uuid () in
  let conn_a = create_conn () in
  let ops_a = new_client_ops_db () in
  let client_a = make_client repo_a in
  let server = make_server () in
  let history = ref [] in
  let state_a = new_state base_uuid in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a } ]
    (fun () ->
      let { repro = _; restore } = install_invalid_tx_repro_bang seed history in
      Fun.protect
        ~finally:restore
        (fun () ->
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          record_meta_bang history
            [ "seed", Wire.Int seed; "base-uuid", Wire.Uuid base_uuid ];
          ensure_base_page_bang conn_a base_uuid;
          Sync_client_op.update_local_tx repo_a 0;
          let clients =
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = Some gen_uuid } ]
          in
          (* Phase A: online *)
          List.iter
            (fun _ ->
              (match clients with
               | client :: _ ->
                   run_ops_bang rng
                     { repo = Some client.repo
                     ; conn = client.conn
                     ; base_uuid = Some base_uuid
                     ; state = state_a
                     ; gen_uuid = client.gen_uuid }
                     1 history
                     { pick_op_opts =
                         { enable_ops = None
                         ; disable_ops = Some [ "undo"; "redo" ] }
                     ; op_table_override = None
                     ; context = Some (wire_map [ "phase", kw "phase-a" ]) }
               | [] -> ());
              sync_loop_bang server clients)
            (List.init 500 Fun.id);
          (* Phase B: offline *)
          let clients_a =
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = false; gen_uuid = None } ]
          in
          List.iter
            (fun _ ->
              run_ops_bang rng
                { repo = Some repo_a; conn = conn_a
                ; base_uuid = Some base_uuid; state = state_a
                ; gen_uuid = Some gen_uuid }
                1 history
                { pick_op_opts =
                    { enable_ops = None
                    ; disable_ops = Some [ "undo"; "redo" ] }
                ; op_table_override = None
                ; context =
                    Some (wire_map [ "phase", kw "phase-b-offline" ]) };
              sync_loop_bang server clients_a)
            (List.init 500 Fun.id);
          (* Phase C: reconnect *)
          sync_loop_bang server clients;
          (* Final sync *)
          sync_loop_bang server clients;
          let issues_a = db_issues (db_of_conn conn_a) in
          (if issues_a <> [] then
             report_history_bang seed history
               (Some
                  [ "type", kw "db-issues"; "repo", Wire.String repo_a ]));
          check "db A issues empty" (issues_a = []);
          let attrs_a = block_attr_map (db_of_conn conn_a) in
          check "db not empty" (UuidMap.cardinal attrs_a > 0)))

(* deftest two-clients-offline-concurrent-undo-redo-merge-sim-test *)
let test_two_clients_offline_concurrent_undo_redo_merge_sim () =
  let seed = Option.value (env_seed ()) ~default:default_seed in
  let rng = make_rng seed in
  let gen_uuid () = rng_uuid rng in
  let base_uuid = gen_uuid () in
  let conn_a = create_conn ()
  and conn_b = create_conn () in
  let ops_a = new_client_ops_db ()
  and ops_b = new_client_ops_db () in
  let client_a = make_client repo_a
  and client_b = make_client repo_b in
  let server = make_server () in
  let history = ref [] in
  let state_a = new_state base_uuid
  and state_b = new_state base_uuid in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
    ; repo_b, { conn = conn_b; ops_conn = Some ops_b } ]
    (fun () ->
      let { repro; restore } = install_invalid_tx_repro_bang seed history in
      let listener_a = "checksum-sync-a"
      and listener_b = "checksum-sync-b" in
      update_local_checksum_listener repo_a conn_a listener_a;
      update_local_checksum_listener repo_b conn_b listener_b;
      Fun.protect
        ~finally:(fun () ->
          Datascript.unlisten conn_a listener_a;
          Datascript.unlisten conn_b listener_b;
          restore ())
        (fun () ->
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          record_meta_bang history
            [ "seed", Wire.Int seed; "base-uuid", Wire.Uuid base_uuid ];
          List.iter
            (fun conn -> ensure_base_page_bang conn base_uuid)
            [ conn_a; conn_b ];
          List.iter
            (fun repo -> Sync_client_op.update_local_tx repo 0)
            [ repo_a; repo_b ];
          Sync_client_op.update_local_checksum repo_a
            (Db_sync_checksum.recompute_checksum (db_of_conn conn_a))
            (db_of_conn conn_a).max_tx;
          Sync_client_op.update_local_checksum repo_b
            (Db_sync_checksum.recompute_checksum (db_of_conn conn_b))
            (db_of_conn conn_b).max_tx;
          (* Seed stable anchors (non-empty titles) that A won't touch. *)
          let anchor_uuids =
            List.init 10 (fun i ->
                let u = gen_uuid () in
                (match ent_at_uuid (db_of_conn conn_a) base_uuid with
                 | Some base_a ->
                     create_block_bang conn_a base_a
                       (Printf.sprintf "anchor-%d" i) u
                 | None -> ());
                u)
          in
          let clients_online =
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = Some gen_uuid }
            ; { repo = repo_b; conn = conn_b; client = client_b
              ; online = true; gen_uuid = Some gen_uuid } ]
          in
          let clients_a_only =
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = Some gen_uuid }
            ; { repo = repo_b; conn = conn_b; client = client_b
              ; online = false; gen_uuid = Some gen_uuid } ]
          in
          sync_loop_bang server clients_online;
          (* A online: heavy add/remove/cut-paste + undo/redo while B offline. *)
          let a_parent = gen_uuid ()
          and a_child = gen_uuid ()
          and a_target = gen_uuid () in
          (match ent_at_uuid (db_of_conn conn_a) base_uuid with
           | Some base_a ->
               create_block_bang conn_a base_a "a-parent" a_parent;
               (match ent_at_uuid (db_of_conn conn_a) a_parent with
                | Some p ->
                    create_block_bang conn_a p "a-child" a_child
                | None -> ());
               create_block_bang conn_a base_a "" a_target
           | None -> ());
          List.iter
            (fun u -> state_a.blocks <- set_add state_a.blocks u)
            [ a_parent; a_child; a_target ];
          (* B local workspace (separate from anchors). *)
          let b_parent = gen_uuid ()
          and b_child = gen_uuid ()
          and b_target = gen_uuid () in
          (match ent_at_uuid (db_of_conn conn_b) base_uuid with
           | Some base_b ->
               create_block_bang conn_b base_b "b-parent" b_parent;
               (match ent_at_uuid (db_of_conn conn_b) b_parent with
                | Some p ->
                    create_block_bang conn_b p "b-child" b_child
                | None -> ());
               create_block_bang conn_b base_b "" b_target
           | None -> ());
          List.iter
            (fun u -> state_b.blocks <- set_add state_b.blocks u)
            [ b_parent; b_child; b_target ];
          List.iter
            (fun _ ->
              run_ops_bang rng
                { repo = Some repo_a; conn = conn_a
                ; base_uuid = Some base_uuid; state = state_a
                ; gen_uuid = Some gen_uuid }
                1 history
                { pick_op_opts =
                    { enable_ops =
                        Some
                          [ "undo"; "redo"; "create-block"; "delete-block"
                          ; "cut-paste-block-with-child" ]
                    ; disable_ops = None }
                ; op_table_override = None
                ; context =
                    Some
                      (wire_map [ "phase", kw "a-online-b-offline" ]) };
              sync_loop_bang server clients_a_only)
            (List.init op_runs Fun.id);
          (* B offline: local edits to anchors + local block ops. *)
          for i = 0 to op_runs - 1 do
            (match rand_nth_bang rng anchor_uuids with
             | Some anchor_uuid -> (
                 match ent_at_uuid (db_of_conn conn_b) anchor_uuid with
                 | Some _ent ->
                     let new_title =
                       Printf.sprintf "b-local-%d" i
                     in
                     update_title_bang conn_b anchor_uuid new_title;
                     history :=
                       !history
                       @ [ [ "type", kw "op"
                           ; "op", kw "update-title"
                           ; "repo", Wire.String repo_b
                           ; "uuid", Wire.Uuid anchor_uuid
                           ; "title", Wire.String new_title
                           ; "step", Wire.Int i
                           ; "anchor-existed?", Wire.Bool true
                           ; ( "context"
                             , wire_map
                                 [ "phase"
                                 , kw "b-offline-local-anchor-edit" ] ) ] ]
                 | None -> ())
             | None -> ());
            run_ops_bang rng
              { repo = Some repo_b; conn = conn_b
              ; base_uuid = Some base_uuid; state = state_b
              ; gen_uuid = Some gen_uuid }
              1 history
              { pick_op_opts =
                  { enable_ops =
                      Some
                        [ "undo"; "redo"; "create-block"; "delete-block"
                        ; "cut-paste-block-with-child" ]
                  ; disable_ops = None }
              ; op_table_override = None
              ; context =
                  Some (wire_map [ "phase", kw "b-offline-local-ops" ]) }
          done;
          (* Reconnect and merge (large backlogs need many rounds). *)
          let rounds =
            sync_until_idle_bang server clients_online 300
          in
          check "sync became idle" (rounds < 300);
          let issues_a = db_issues (db_of_conn conn_a)
          and issues_b = db_issues (db_of_conn conn_b) in
          let attrs_a = block_attr_map (db_of_conn conn_a)
          and attrs_b = block_attr_map (db_of_conn conn_b) in
          check "db A issues empty" (issues_a = []);
          check "db B issues empty" (issues_b = []);
          assert_synced_attrs_bang seed history attrs_a attrs_b attrs_b;
          check "checksum A == cached A"
            (Db_sync_checksum.recompute_checksum (db_of_conn conn_a)
             = Option.value
                 (Sync_client_op.get_local_checksum repo_a)
                 ~default:"");
          check "checksum B == cached B"
            (Db_sync_checksum.recompute_checksum (db_of_conn conn_b)
             = Option.value
                 (Sync_client_op.get_local_checksum repo_b)
                 ~default:"");
          List.iter
            (fun anchor_uuid ->
              let ent_a = ent_at_uuid (db_of_conn conn_a) anchor_uuid
              and ent_b = ent_at_uuid (db_of_conn conn_b) anchor_uuid in
              check "anchor present in A" (ent_a <> None);
              check "anchor present in B" (ent_b <> None);
              check "anchor title non-blank in A"
                (match ent_a with
                 | Some e ->
                     not
                       (str_blank
                          (Option.value (ent_title_value e)
                             ~default:""))
                 | None -> false);
              check "anchor title non-blank in B"
                (match ent_b with
                 | Some e ->
                     not
                       (str_blank
                          (Option.value (ent_title_value e)
                             ~default:""))
                 | None -> false))
            anchor_uuids;
          assert_no_invalid_tx_bang seed history repro))

(* deftest two-clients-rebase-keeps-local-title-after-reverse-tx-test *)
let test_two_clients_rebase_keeps_local_title_after_reverse_tx () =
  let base_uuid = "11111111-1111-1111-1111-111111111111" in
  let block_uuid = "22222222-2222-2222-2222-222222222222" in
  let conn_a = create_conn ()
  and conn_b = create_conn () in
  let ops_a = new_client_ops_db ()
  and ops_b = new_client_ops_db () in
  let client_a = make_client repo_a
  and client_b = make_client repo_b in
  let server = make_server () in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
    ; repo_b, { conn = conn_b; ops_conn = Some ops_b } ]
    (fun () ->
      let listener_a = "checksum-sync-a"
      and listener_b = "checksum-sync-b" in
      let update_local_checksum_bang repo conn =
        update_local_checksum_listener repo conn
          (if repo = repo_a then listener_a else listener_b)
      in
      update_local_checksum_bang repo_a conn_a;
      update_local_checksum_bang repo_b conn_b;
      Fun.protect
        ~finally:(fun () ->
          Datascript.unlisten conn_a listener_a;
          Datascript.unlisten conn_b listener_b)
        (fun () ->
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          Sync_client_op.update_local_tx repo_a 0;
          Sync_client_op.update_local_tx repo_b 0;
          Sync_client_op.update_local_checksum repo_a
            (Db_sync_checksum.recompute_checksum (db_of_conn conn_a))
            (db_of_conn conn_a).max_tx;
          Sync_client_op.update_local_checksum repo_b
            (Db_sync_checksum.recompute_checksum (db_of_conn conn_b))
            (db_of_conn conn_b).max_tx;
          ensure_base_page_bang conn_a base_uuid;
          (match ent_at_uuid (db_of_conn conn_a) base_uuid with
           | Some base ->
               create_block_bang conn_a base "before" block_uuid
           | None -> ());
          sync_loop_bang server
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = None } ];
          sync_loop_bang server
            [ { repo = repo_b; conn = conn_b; client = client_b
              ; online = true; gen_uuid = None } ];
          check "client-b sees title before"
            ((match ent_at_uuid (db_of_conn conn_b) block_uuid with
              | Some e -> ent_title_value e
              | None -> None)
             = Some "before");
          update_title_bang conn_a block_uuid "test";
          check "pending txs after title update"
            (Sync_apply.pending_txs repo_a () <> []);
          (* cljs (d/transact! conn-b [[:db/add [:block/uuid ...] ...]]) *)
          ignore
            (Datascript.transact_conn_string conn_b
               (Printf.sprintf
                  "[[:db/add [:block/uuid %s] :block/updated-at \
                   1710000000000]]"
                  (uuid_lit block_uuid)));
          sync_loop_bang server
            [ { repo = repo_b; conn = conn_b; client = client_b
              ; online = true; gen_uuid = None } ];
          sync_loop_bang server
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = None } ];
          check "client-a keeps local title"
            ((match ent_at_uuid (db_of_conn conn_a) block_uuid with
              | Some e -> ent_title_value e
              | None -> None)
             = Some "test");
          check "checksum A == cached A"
            (Db_sync_checksum.recompute_checksum (db_of_conn conn_a)
             = Option.value
                 (Sync_client_op.get_local_checksum repo_a)
                 ~default:"");
          check "checksum B == cached B"
            (Db_sync_checksum.recompute_checksum (db_of_conn conn_b)
             = Option.value
                 (Sync_client_op.get_local_checksum repo_b)
                 ~default:"")))

(* deftest undo-redo-indent-sequence-does-not-produce-invalid-entity-test *)
let test_undo_redo_indent_sequence_does_not_produce_invalid_entity () =
  let seed = 20260321 in
  let base_uuid = "61111111-1111-1111-1111-111111111111" in
  let block_1_uuid = "62222222-2222-2222-2222-222222222222" in
  let block_2_uuid = "63333333-3333-3333-3333-333333333333" in
  let conn_a =
    Db_test_util.create_conn_with_blocks
      ~pages_and_blocks:
        [ { Db_test_util.page =
              { Db_test_util.default_page with
                pg_title = Some base_page_title
              ; pg_uuid = Some base_uuid }
          ; blocks = [] } ]
      ()
  in
  let ops_a = new_client_ops_db () in
  let history = ref [] in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a } ]
    (fun () ->
      let { repro; restore } = install_invalid_tx_repro_bang seed history in
      Fun.protect
        ~finally:restore
        (fun () ->
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          Sync_client_op.update_local_tx repo_a 0;
          let base_page = ent_at_uuid (db_of_conn conn_a) base_uuid in
          let tx_meta =
            wire_map
              [ "client-id", Wire.String "db-sync-sim-client"
              ; "local-tx?", Wire.Bool true ]
          in
          (match base_page with
           | Some base ->
               ignore
                 (apply_ops_bang conn_a
                    (edn_wire
                       (Printf.sprintf
                          "[[:insert-blocks [[{:block/uuid %s :block/title \
                           \"\"}] %d {:sibling? false :keep-uuid? true}]]]"
                          (uuid_lit block_1_uuid)
                          base.id))
                    tx_meta)
           | None -> ());
          ignore
            (apply_ops_bang conn_a
               (edn_wire
                  (Printf.sprintf
                     "[[:save-block [{:block/uuid %s :block/title \"1\"} \
                      nil]]]"
                     (uuid_lit block_1_uuid)))
               tx_meta);
          (match ent_at_uuid (db_of_conn conn_a) block_1_uuid with
           | Some block_1 ->
               ignore
                 (apply_ops_bang conn_a
                    (edn_wire
                       (Printf.sprintf
                          "[[:insert-blocks [[{:block/uuid %s :block/title \
                           \"\"}] %d {:sibling? true :keep-uuid? true}]]]"
                          (uuid_lit block_2_uuid)
                          block_1.id))
                    tx_meta)
           | None -> ());
          ignore
            (apply_ops_bang conn_a
               (edn_wire
                  (Printf.sprintf
                     "[[:save-block [{:block/uuid %s :block/title \"2\"} \
                      nil]]]"
                     (uuid_lit block_2_uuid)))
               tx_meta);
          (match ent_at_uuid (db_of_conn conn_a) block_2_uuid with
           | Some block_2 ->
               ignore
                 (apply_ops_bang conn_a
                    (edn_wire
                       (Printf.sprintf
                          "[[:indent-outdent-blocks [[%d] true {}]]]"
                          block_2.id))
                    tx_meta)
           | None -> ());
          (* undo until empty stack, then redo until empty stack *)
          let undo_count =
            let rec loop n =
              if
                Undo_redo.undo repo_a
                = Undo_redo.empty_stack_result ~undo:true
              then n
              else loop (n + 1)
            in
            loop 0
          in
          check "undo steps > 0" (undo_count > 0);
          let redo_count =
            let rec loop n =
              if
                Undo_redo.redo repo_a
                = Undo_redo.empty_stack_result ~undo:false
              then n
              else loop (n + 1)
            in
            loop 0
          in
          check "undo steps == redo steps" (undo_count = redo_count);
          (match ent_at_uuid (db_of_conn conn_a) block_2_uuid with
           | Some block_2_after_redo ->
               check "block-2 present after redo-all" true;
               check "block-2 parent is block-1 after redo-all"
                 ((match Ldb.ref_ent block_2_after_redo "block/parent" with
                   | Some p -> ent_uuid p
                   | None -> None)
                  = Some block_1_uuid)
           | None -> check "block-2 present after redo-all" false);
          check "one more undo succeeds"
            (Undo_redo.undo repo_a
             <> Undo_redo.empty_stack_result ~undo:true);
          (match ent_at_uuid (db_of_conn conn_a) block_2_uuid with
           | Some block_2 ->
               check "block-2 page is base after final undo"
                 ((match Ldb.ref_ent block_2 "block/page" with
                   | Some p -> ent_uuid p
                   | None -> None)
                  = Some base_uuid);
               check "block-2 parent is base after final undo"
                 ((match Ldb.ref_ent block_2 "block/parent" with
                   | Some p -> ent_uuid p
                   | None -> None)
                  = Some base_uuid)
           | None -> check "block-2 present after final undo" false);
          check "no invalid tx payload" (!repro = None)))

(* deftest two-clients-undo-skips-conflicted-move-but-keeps-db-valid-test *)
let test_two_clients_undo_skips_conflicted_move_but_keeps_db_valid () =
  let base_uuid = "31111111-1111-1111-1111-111111111111" in
  let parent_a_uuid = "32222222-2222-2222-2222-222222222222" in
  let parent_b_uuid = "33333333-3333-3333-3333-333333333333" in
  let child_uuid = "34444444-4444-4444-4444-444444444444" in
  let conn_a = create_conn ()
  and conn_b = create_conn () in
  let ops_a = new_client_ops_db ()
  and ops_b = new_client_ops_db () in
  let client_a = make_client repo_a
  and client_b = make_client repo_b in
  let server = make_server () in
  let seed = 20260311 in
  let history = ref [] in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
    ; repo_b, { conn = conn_b; ops_conn = Some ops_b } ]
    (fun () ->
      let { repro; restore } = install_invalid_tx_repro_bang seed history in
      Fun.protect
        ~finally:restore
        (fun () ->
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          Sync_client_op.update_local_tx repo_a 0;
          Sync_client_op.update_local_tx repo_b 0;
          ensure_base_page_bang conn_a base_uuid;
          (match ent_at_uuid (db_of_conn conn_a) base_uuid with
           | Some base_a ->
               create_block_bang conn_a base_a "parent-a" parent_a_uuid;
               create_block_bang conn_a base_a "parent-b" parent_b_uuid;
               (match ent_at_uuid (db_of_conn conn_a) parent_a_uuid with
                | Some parent_a ->
                    create_block_bang conn_a parent_a "seed-child"
                      child_uuid
                | None -> ())
           | None -> ());
          let clients_online () =
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = None }
            ; { repo = repo_b; conn = conn_b; client = client_b
              ; online = true; gen_uuid = None } ]
          in
          ignore (sync_until_idle_bang server (clients_online ()) 20);
          update_title_bang conn_a child_uuid "local-title";
          move_block_bang conn_a child_uuid parent_b_uuid;
          ignore (sync_until_idle_bang server (clients_online ()) 50);
          delete_block_bang conn_b parent_a_uuid;
          ignore (sync_until_idle_bang server (clients_online ()) 50);
          check "undo succeeds"
            (Undo_redo.undo repo_a
             <> Undo_redo.empty_stack_result ~undo:true);
          let rounds =
            sync_until_idle_bang server (clients_online ()) 50
          in
          let child_a = ent_at_uuid (db_of_conn conn_a) child_uuid in
          let child_b = ent_at_uuid (db_of_conn conn_b) child_uuid in
          let attrs_a = block_attr_map (db_of_conn conn_a)
          and attrs_b = block_attr_map (db_of_conn conn_b) in
          let issues_a = db_issues (db_of_conn conn_a)
          and issues_b = db_issues (db_of_conn conn_b) in
          check "sync became idle" (rounds < 50);
          check "child-a title is seed-child"
            ((match child_a with
              | Some e -> ent_title_value e
              | None -> None)
             = Some "seed-child");
          check "child-b title is seed-child"
            ((match child_b with
              | Some e -> ent_title_value e
              | None -> None)
             = Some "seed-child");
          check "child-a parent is parent-b"
            ((match child_a with
              | Some e ->
                  (match Ldb.ref_ent e "block/parent" with
                   | Some p -> ent_uuid p
                   | None -> None)
              | None -> None)
             = Some parent_b_uuid);
          check "child-b parent is parent-b"
            ((match child_b with
              | Some e ->
                  (match Ldb.ref_ent e "block/parent" with
                   | Some p -> ent_uuid p
                   | None -> None)
              | None -> None)
             = Some parent_b_uuid);
          check "db A issues empty" (issues_a = []);
          check "db B issues empty" (issues_b = []);
          assert_synced_attrs_bang seed history attrs_a attrs_b attrs_b;
          assert_no_invalid_tx_bang seed history repro))

(* deftest two-clients-syncs-undo-of-new-block-test *)
let test_two_clients_syncs_undo_of_new_block () =
  let base_uuid = "51111111-1111-1111-1111-111111111111" in
  let block_uuid = "52222222-2222-2222-2222-222222222222" in
  let conn_a = create_conn ()
  and conn_b = create_conn () in
  let ops_a = new_client_ops_db ()
  and ops_b = new_client_ops_db () in
  let client_a = make_client repo_a
  and client_b = make_client repo_b in
  let server = make_server () in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
    ; repo_b, { conn = conn_b; ops_conn = Some ops_b } ]
    (fun () ->
      Hashtbl.reset Sync_apply.repo_latest_remote_tx;
      List.iter
        (fun repo -> Sync_client_op.update_local_tx repo 0)
        [ repo_a; repo_b ];
      ensure_base_page_bang conn_a base_uuid;
      let clients_online () =
        [ { repo = repo_a; conn = conn_a; client = client_a
          ; online = true; gen_uuid = None }
        ; { repo = repo_b; conn = conn_b; client = client_b
          ; online = true; gen_uuid = None } ]
      in
      sync_loop_bang server (clients_online ());
      (match ent_at_uuid (db_of_conn conn_a) base_uuid with
       | Some base_a ->
           create_block_bang conn_a base_a "temp" block_uuid
       | None -> ());
      sync_loop_bang server (clients_online ());
      check "block on A" (ent_at_uuid (db_of_conn conn_a) block_uuid <> None);
      check "block on B" (ent_at_uuid (db_of_conn conn_b) block_uuid <> None);
      check "undo succeeds"
        (Undo_redo.undo repo_a
         <> Undo_redo.empty_stack_result ~undo:true);
      let pending = Sync_apply.pending_txs repo_a () in
      let is_retract_block (item : Wire.t) =
        let expected_lookup =
          Wire.Array [ kw "block/uuid"; Wire.Uuid block_uuid ]
        in
        match wire_nth item 0, wire_nth item 1 with
        | Some (Wire.Keyword "db/retractEntity"), Some lookup ->
            lookup = expected_lookup
            || lookup
               = Wire.List [ kw "block/uuid"; Wire.Uuid block_uuid ]
        | _ -> false
      in
      check "pending txs exist" (pending <> []);
      check "pending contains retractEntity for the block"
        (List.exists
           (fun (e : Sync_client_op.local_tx_entry) ->
             List.exists is_retract_block (tx_items_of e.tx))
           pending);
      sync_loop_bang server (clients_online ());
      check "block gone on A" (ent_at_uuid (db_of_conn conn_a) block_uuid = None);
      check "block gone on B" (ent_at_uuid (db_of_conn conn_b) block_uuid = None);
      check "block gone on server"
        (ent_at_uuid (db_of_conn server.srv_conn) block_uuid = None))

(* deftest two-clients-offline-insert-delete-indent-undo-redo-keeps-checksum-cache-aligned-test *)
let test_two_clients_offline_insert_delete_indent_undo_redo_checksum () =
  let seed = Option.value (env_seed ()) ~default:default_seed in
  let rng = make_rng seed in
  let gen_uuid () = rng_uuid rng in
  let base_uuid = gen_uuid () in
  let conn_a = create_conn ()
  and conn_b = create_conn () in
  let ops_a = new_client_ops_db ()
  and ops_b = new_client_ops_db () in
  let client_a = make_client repo_a
  and client_b = make_client repo_b in
  let server = make_server () in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
    ; repo_b, { conn = conn_b; ops_conn = Some ops_b } ]
    (fun () ->
      let listener_a = "checksum-sync-a"
      and listener_b = "checksum-sync-b" in
      update_local_checksum_listener repo_a conn_a listener_a;
      update_local_checksum_listener repo_b conn_b listener_b;
      let run_offline_seq repo conn label_prefix =
        match ent_at_uuid (db_of_conn conn) base_uuid with
        | Some base -> (
            let p1 = gen_uuid ()
            and child = gen_uuid ()
            and temp = gen_uuid () in
            create_block_bang conn base
              (Printf.sprintf "%s-p1" label_prefix) p1;
            (match ent_at_uuid (db_of_conn conn) p1 with
             | Some p1_ent ->
                 create_block_bang conn p1_ent
                   (Printf.sprintf "%s-child" label_prefix) child
             | None -> ());
            (match ent_at_uuid (db_of_conn conn) child with
             | Some child_ent ->
                 Outliner_core.indent_outdent_blocks_conn conn [ child_ent ]
                   false [];
                 Outliner_core.indent_outdent_blocks_conn conn [ child_ent ]
                   true []
             | None -> ());
            create_block_bang conn base
              (Printf.sprintf "%s-temp" label_prefix) temp;
            delete_block_bang conn temp;
            ignore (undo_all repo 256);
            ignore (redo_all repo 256))
        | None -> ()
      in
      Fun.protect
        ~finally:(fun () ->
          Datascript.unlisten conn_a listener_a;
          Datascript.unlisten conn_b listener_b)
        (fun () ->
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          List.iter
            (fun repo -> Sync_client_op.update_local_tx repo 0)
            [ repo_a; repo_b ];
          ensure_base_page_bang conn_a base_uuid;
          sync_loop_bang server
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = None }
            ; { repo = repo_b; conn = conn_b; client = client_b
              ; online = true; gen_uuid = None } ];
          Sync_client_op.update_local_checksum repo_a
            (Db_sync_checksum.recompute_checksum (db_of_conn conn_a))
            (db_of_conn conn_a).max_tx;
          Sync_client_op.update_local_checksum repo_b
            (Db_sync_checksum.recompute_checksum (db_of_conn conn_b))
            (db_of_conn conn_b).max_tx;
          run_offline_seq repo_a conn_a "a";
          run_offline_seq repo_b conn_b "b";
          let rounds =
            sync_until_idle_bang server
              [ { repo = repo_a; conn = conn_a; client = client_a
                ; online = true; gen_uuid = None }
              ; { repo = repo_b; conn = conn_b; client = client_b
                ; online = true; gen_uuid = None } ]
              300
          in
          check "sync became idle" (rounds < 300);
          let checksum_a =
            Db_sync_checksum.recompute_checksum (db_of_conn conn_a)
          and checksum_b =
            Db_sync_checksum.recompute_checksum (db_of_conn conn_b)
          and cached_a = Sync_client_op.get_local_checksum repo_a
          and cached_b = Sync_client_op.get_local_checksum repo_b in
          check "checksum A == checksum B" (checksum_a = checksum_b);
          check "checksum A == cached A" (Some checksum_a = cached_a);
          check "checksum B == cached B" (Some checksum_b = cached_b)))

(* deftest two-clients-empty-child-undo-redo-reconnect-keeps-checksum-cache-aligned-test *)
let test_two_clients_empty_child_undo_redo_reconnect_checksum () =
  let base_uuid = "81111111-1111-1111-1111-111111111111" in
  let root_uuid = "82222222-2222-2222-2222-222222222222" in
  let child_a_uuid = "83333333-3333-3333-3333-333333333333" in
  let child_b_uuid = "84444444-4444-4444-4444-444444444444" in
  let conn_a = create_conn ()
  and conn_b = create_conn () in
  let ops_a = new_client_ops_db ()
  and ops_b = new_client_ops_db () in
  let client_a = make_client repo_a
  and client_b = make_client repo_b in
  let server = make_server () in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
    ; repo_b, { conn = conn_b; ops_conn = Some ops_b } ]
    (fun () ->
      let listener_a = "checksum-sync-a"
      and listener_b = "checksum-sync-b" in
      update_local_checksum_listener repo_a conn_a listener_a;
      update_local_checksum_listener repo_b conn_b listener_b;
      Fun.protect
        ~finally:(fun () ->
          Datascript.unlisten conn_a listener_a;
          Datascript.unlisten conn_b listener_b)
        (fun () ->
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          List.iter
            (fun repo -> Sync_client_op.update_local_tx repo 0)
            [ repo_a; repo_b ];
          (* Both clients start with one shared block. *)
          ensure_base_page_bang conn_a base_uuid;
          (match ent_at_uuid (db_of_conn conn_a) base_uuid with
           | Some base_a ->
               create_block_bang conn_a base_a "1" root_uuid
           | None -> ());
          ignore
            (sync_until_idle_bang server
               [ { repo = repo_a; conn = conn_a; client = client_a
                 ; online = true; gen_uuid = None }
               ; { repo = repo_b; conn = conn_b; client = client_b
                 ; online = true; gen_uuid = None } ]
               128);
          Sync_client_op.update_local_checksum repo_a
            (Db_sync_checksum.recompute_checksum (db_of_conn conn_a))
            (db_of_conn conn_a).max_tx;
          Sync_client_op.update_local_checksum repo_b
            (Db_sync_checksum.recompute_checksum (db_of_conn conn_b))
            (db_of_conn conn_b).max_tx;
          (* A stays online and adds an empty child under block 1. *)
          (match ent_at_uuid (db_of_conn conn_a) root_uuid with
           | Some root_a ->
               create_block_bang conn_a root_a "" child_a_uuid
           | None -> ());
          ignore
            (sync_until_idle_bang server
               [ { repo = repo_a; conn = conn_a; client = client_a
                 ; online = true; gen_uuid = None }
               ; { repo = repo_b; conn = conn_b; client = client_b
                 ; online = false; gen_uuid = None } ]
               128);
          (* B offline adds an empty child under block 1, then undo + redo. *)
          (match ent_at_uuid (db_of_conn conn_b) root_uuid with
           | Some root_b ->
               create_block_bang conn_b root_b "" child_b_uuid
           | None -> ());
          check "B undo succeeds"
            (Undo_redo.undo repo_b
             <> Undo_redo.empty_stack_result ~undo:true);
          check "B redo succeeds"
            (Undo_redo.redo repo_b
             <> Undo_redo.empty_stack_result ~undo:false);
          (* B reconnects. *)
          let rounds =
            sync_until_idle_bang server
              [ { repo = repo_a; conn = conn_a; client = client_a
                ; online = true; gen_uuid = None }
              ; { repo = repo_b; conn = conn_b; client = client_b
                ; online = true; gen_uuid = None } ]
              300
          in
          check "sync became idle" (rounds < 300);
          let checksum_a =
            Db_sync_checksum.recompute_checksum (db_of_conn conn_a)
          and checksum_b =
            Db_sync_checksum.recompute_checksum (db_of_conn conn_b)
          and checksum_server =
            Db_sync_checksum.recompute_checksum
              (db_of_conn server.srv_conn)
          and cached_a = Sync_client_op.get_local_checksum repo_a
          and cached_b = Sync_client_op.get_local_checksum repo_b in
          check "checksum A == checksum B" (checksum_a = checksum_b);
          check "checksum A == checksum server"
            (checksum_a = checksum_server);
          check "checksum A == cached A" (Some checksum_a = cached_a);
          check "checksum B == cached B" (Some checksum_b = cached_b)))

(* deftest all-core-outliner-ops-local-undo-redo-random-sim-test *)
let test_all_core_outliner_ops_local_undo_redo_random_sim () =
  let seed = Option.value (env_seed ()) ~default:default_seed in
  let rng = make_rng seed in
  let gen_uuid () = rng_uuid rng in
  let coverage_ops = local_undo_redo_coverage_ops in
  let coverage_op_table =
    build_weighted_op_table coverage_ops local_undo_redo_op_weights
      "coverage"
  in
  let cycle_ops = List.map fst local_undo_redo_cycle_op_weights in
  let cycle_op_table =
    build_weighted_op_table cycle_ops local_undo_redo_cycle_op_weights
      "cycle"
  in
  let base_uuid = gen_uuid () in
  let conn = create_conn () in
  let ops_conn = new_client_ops_db () in
  let history = ref [] in
  let state = new_state base_uuid in
  let client_context : run_ctx =
    { repo = Some repo_a
    ; conn
    ; base_uuid = Some base_uuid
    ; state
    ; gen_uuid = Some gen_uuid }
  in
  with_test_repos
    [ repo_a, { conn; ops_conn = Some ops_conn } ]
    (fun () ->
      let { repro; restore } = install_invalid_tx_repro_bang seed history in
      Fun.protect
        ~finally:restore
        (fun () ->
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          record_meta_bang history
            [ "seed", Wire.Int seed
            ; "base-uuid", Wire.Uuid base_uuid
            ; "phase", kw "local-undo-redo-stress"
            ; "run-count", Wire.Int local_undo_redo_run_count
            ; "full-cycle-runs", Wire.Int local_undo_redo_full_cycle_runs ];
          ensure_base_page_bang conn base_uuid;
          Sync_client_op.update_local_tx repo_a 0;
          (* Random warmup to provide realistic, non-trivial local history. *)
          run_ops_bang rng client_context 50 history
            { pick_op_opts =
                { enable_ops = Some coverage_ops
                ; disable_ops = Some [ "undo"; "redo" ] }
            ; op_table_override = Some coverage_op_table
            ; context = Some (wire_map [ "phase", kw "warmup" ]) };
          (* Guarantee every required op is exercised at least once. *)
          List.iter
            (fun op ->
              let executed =
                op_count history op > 0
                || ensure_op_recorded_bang rng client_context history op
                     120 ~op_table_override:coverage_op_table ()
              in
              check
                (Printf.sprintf "op executed: %s (seed %d)" op seed)
                executed)
            (List.sort compare coverage_ops);
          (* Keep all-core coverage checks separate from full undo/redo cycles. *)
          let issues = db_issues (db_of_conn conn) in
          check "db issues before cycle stress empty" (issues = []);
          assert_no_invalid_tx_bang seed history repro;
          Undo_redo.clear_history repo_a;
          (* Long weighted random stress run on undo-safe op families. *)
          run_ops_bang rng client_context local_undo_redo_run_count history
            { pick_op_opts =
                { enable_ops = Some cycle_ops; disable_ops = None }
            ; op_table_override = Some cycle_op_table
            ; context = Some (wire_map [ "phase", kw "cycle-stress" ]) };
          (* Ensure at least one concrete undoable change before undo-all. *)
          check "undo stack prepared"
            (ensure_op_recorded_bang rng client_context history
               "create-block" 120 ~op_table_override:cycle_op_table ());
          let max_stack_steps =
            (2 * local_undo_redo_run_count) + 5000
          in
          for cycle_idx = 0 to local_undo_redo_full_cycle_runs - 1 do
            let undo_steps = undo_all repo_a max_stack_steps in
            let issues_after_undo = db_issues (db_of_conn conn) in
            check
              (Printf.sprintf "undo steps > 0 (cycle %d)" cycle_idx)
              (undo_steps > 0);
            check
              (Printf.sprintf "db issues after undo-all (cycle %d)"
                 cycle_idx)
              (issues_after_undo = []);
            assert_no_invalid_tx_bang seed history repro;
            let redo_steps = redo_all repo_a max_stack_steps in
            let issues_after_redo = db_issues (db_of_conn conn) in
            let attrs_after_redo = block_attr_map (db_of_conn conn) in
            check
              (Printf.sprintf "redo steps > 0 (cycle %d)" cycle_idx)
              (redo_steps > 0);
            check
              (Printf.sprintf "db issues after redo-all (cycle %d)"
                 cycle_idx)
              (issues_after_redo = []);
            check
              (Printf.sprintf "db not empty after redo-all (cycle %d)"
                 cycle_idx)
              (UuidMap.cardinal attrs_after_redo > 0);
            assert_no_invalid_tx_bang seed history repro
          done;
          let issues = db_issues (db_of_conn conn) in
          check "db issues empty" (issues = []);
          assert_no_invalid_tx_bang seed history repro))

(* deftest every-core-outliner-op-uploads-with-and-without-rebase-test
   (f6fc6f78ac — cljs (with-redefs [server-upload! ...]) routes each
   upload entry through #'sync-handler/apply-tx-entry! on a forked
   server db and asserts the forked checksum converges with the live
   server. The D1 sync-handler is not ported; the faithful equivalent
   applies the entry's normalized tx-data via tx-ops-of-tx-data onto a
   conn forked from the server db, then runs the real server upload. *)
let test_every_core_outliner_op_uploads_with_and_without_rebase () =
  List.iter
    (fun op ->
       List.iter
         (fun rebase ->
            let tag =
              Printf.sprintf "%s rebase=%b" op rebase
            in
            let rng = make_rng 1337 in
            let gen_uuid () = rng_uuid rng in
            let base_uuid = gen_uuid () in
            let remote_uuid = gen_uuid () in
            let conn = create_conn () in
            let server = make_server () in
            let history = ref [] in
            let state = new_state base_uuid in
            let client =
              { repo = repo_a; conn; client = make_client repo_a
              ; online = true; gen_uuid = Some gen_uuid }
            in
            let client_context : run_ctx =
              { repo = Some repo_a; conn; base_uuid = Some base_uuid
              ; state; gen_uuid = Some gen_uuid }
            in
            with_test_repos
              [ repo_a, { conn; ops_conn = Some (new_client_ops_db ()) } ]
              (fun () ->
                Hashtbl.reset Sync_apply.repo_latest_remote_tx;
                Sync_client_op.update_local_tx repo_a 0;
                ensure_base_page_bang conn base_uuid;
                create_page_bang conn "Remote marker" remote_uuid;
                ignore (sync_client_bang server client);
                check (tag ^ " op recorded")
                  (ensure_op_recorded_bang rng client_context history op
                     120 ());
                (if rebase then
                   ignore
                     (server_upload_bang server server.srv_counter
                        [ Wire.Map
                            [ ( kw "tx-data"
                              , Wire.List
                                  [ Wire.Array
                                      [ kw "db/add"
                                      ; Wire.Array
                                          [ kw "block/uuid"
                                          ; Wire.Uuid remote_uuid ]
                                      ; kw "block/title"
                                      ; Wire.String
                                          "Remote marker edited" ] ] )
                            ] ]));
                let shadow_upload srv t_before entries =
                  let actual_server =
                    conn_from_db (db_of_conn srv.srv_conn)
                  in
                  List.iter
                    (fun entry ->
                       match Wire.get "tx-data" entry with
                       | Some tx_data ->
                           let ops =
                             Db_transact.tx_ops_of_tx_data
                               (Datascript.db actual_server)
                               (Wire.as_seq tx_data)
                           in
                           ignore
                             (Datascript.transact_conn actual_server ops)
                       | None -> ())
                    entries;
                  let result = server_upload_bang srv t_before entries in
                  check (tag ^ " shadow/server checksums converge")
                    (Db_sync_checksum.recompute_checksum
                       (Datascript.db actual_server)
                     = Db_sync_checksum.recompute_checksum
                         (db_of_conn srv.srv_conn));
                  result
                in
                ignore (sync_client_bang ~upload:shadow_upload server client);
                check (tag ^ " pending empty after upload")
                  (Sync_apply.pending_txs repo_a () = []);
                check (tag ^ " client/server checksums converge")
                  (Db_sync_checksum.recompute_checksum (Datascript.db conn)
                   = Db_sync_checksum.recompute_checksum
                       (db_of_conn server.srv_conn))))
         [ false; true ])
    local_undo_redo_coverage_ops

(* deftest two-clients-online-sim-test *)
let test_two_clients_online_sim () =
  let seed = Option.value (env_seed ()) ~default:default_seed in
  let rng = make_rng seed in
  let gen_uuid () = rng_uuid rng in
  let base_uuid = gen_uuid () in
  let conn_a = create_conn ()
  and conn_b = create_conn () in
  let ops_a = new_client_ops_db ()
  and ops_b = new_client_ops_db () in
  let client_a = make_client repo_a
  and client_b = make_client repo_b in
  let server = make_server () in
  let history = ref [] in
  let state_a = new_state base_uuid
  and state_b = new_state base_uuid in
  let repo_state = [ repo_a, state_a; repo_b, state_b ] in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
    ; repo_b, { conn = conn_b; ops_conn = Some ops_b } ]
    (fun () ->
      let { repro = _; restore } = install_invalid_tx_repro_bang seed history in
      Fun.protect
        ~finally:restore
        (fun () ->
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          record_meta_bang history
            [ "seed", Wire.Int seed; "base-uuid", Wire.Uuid base_uuid ];
          List.iter
            (fun conn -> ensure_base_page_bang conn base_uuid)
            [ conn_a; conn_b ];
          List.iter
            (fun repo -> Sync_client_op.update_local_tx repo 0)
            [ repo_a; repo_b ];
          let clients =
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = Some gen_uuid }
            ; { repo = repo_b; conn = conn_b; client = client_b
              ; online = true; gen_uuid = Some gen_uuid } ]
          in
          run_random_ops_bang rng server clients repo_state base_uuid
            history
            { pick_op_opts =
                { enable_ops = None
                ; disable_ops = Some [ "undo"; "redo" ] }
            ; op_table_override = None
            ; context = Some (wire_map [ "phase", kw "phase-a" ]) }
            op_runs;
          sync_loop_bang server clients;
          let issues_a = db_issues (db_of_conn conn_a)
          and issues_b = db_issues (db_of_conn conn_b) in
          (if issues_a <> [] then
             report_history_bang seed history
               (Some
                  [ "type", kw "db-issues"; "repo", Wire.String repo_a ]));
          (if issues_b <> [] then
             report_history_bang seed history
               (Some
                  [ "type", kw "db-issues"; "repo", Wire.String repo_b ]));
          check "db A issues empty" (issues_a = []);
          check "db B issues empty" (issues_b = []);
          let attrs_a = block_attr_map (db_of_conn conn_a)
          and attrs_b = block_attr_map (db_of_conn conn_b) in
          assert_synced_attrs_bang seed history attrs_a attrs_b attrs_b))

(* deftest two-clients-cut-paste-random-sim-test (^:fix-me in cljs — still runs) *)
let test_two_clients_cut_paste_random_sim () =
  let seed = Option.value (env_seed ()) ~default:default_seed in
  let rng = make_rng seed in
  let gen_uuid () = rng_uuid rng in
  let cut_paste_runs = min op_runs 80 in
  let base_uuid = gen_uuid () in
  let conn_a = create_conn ()
  and conn_b = create_conn () in
  let ops_a = new_client_ops_db ()
  and ops_b = new_client_ops_db () in
  let client_a = make_client repo_a
  and client_b = make_client repo_b in
  let server = make_server () in
  let history = ref [] in
  let state_a = new_state base_uuid in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
    ; repo_b, { conn = conn_b; ops_conn = Some ops_b } ]
    (fun () ->
      let { repro; restore } = install_invalid_tx_repro_bang seed history in
      Fun.protect
        ~finally:restore
        (fun () ->
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          record_meta_bang history
            [ "seed", Wire.Int seed; "base-uuid", Wire.Uuid base_uuid ];
          List.iter
            (fun conn -> ensure_base_page_bang conn base_uuid)
            [ conn_a; conn_b ];
          List.iter
            (fun repo -> Sync_client_op.update_local_tx repo 0)
            [ repo_a; repo_b ];
          let clients =
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = Some gen_uuid }
            ; { repo = repo_b; conn = conn_b; client = client_b
              ; online = true; gen_uuid = Some gen_uuid } ]
          in
          let parent_uuid = gen_uuid ()
          and child_uuid = gen_uuid ()
          and target_uuid = gen_uuid () in
          (match ent_at_uuid (db_of_conn conn_a) base_uuid with
           | Some base_a ->
               create_block_bang conn_a base_a "seed-parent" parent_uuid;
               (match ent_at_uuid (db_of_conn conn_a) parent_uuid with
                | Some parent ->
                    create_block_bang conn_a parent "seed-child"
                      child_uuid
                | None -> ());
               create_block_bang conn_a base_a "" target_uuid
           | None -> ());
          List.iter
            (fun u -> state_a.blocks <- set_add state_a.blocks u)
            [ parent_uuid; child_uuid; target_uuid ];
          List.iter
            (fun _ ->
              run_ops_bang rng
                { repo = Some repo_a; conn = conn_a
                ; base_uuid = Some base_uuid; state = state_a
                ; gen_uuid = Some gen_uuid }
                1 history
                { pick_op_opts =
                    { enable_ops =
                        Some
                          [ "cut-paste-block-with-child"; "create-block"
                          ; "move-block" ]
                    ; disable_ops = None }
                ; op_table_override = None
                ; context =
                    Some (wire_map [ "phase", kw "cut-paste-random" ]) };
              sync_loop_bang server clients)
            (List.init cut_paste_runs Fun.id);
          sync_loop_bang server clients;
          let issues_a = db_issues (db_of_conn conn_a)
          and issues_b = db_issues (db_of_conn conn_b) in
          let attrs_a = block_attr_map (db_of_conn conn_a)
          and attrs_b = block_attr_map (db_of_conn conn_b) in
          check "expected cut-paste ops"
            (op_count history "cut-paste-block-with-child" > 0);
          check "db A issues empty" (issues_a = []);
          check "db B issues empty" (issues_b = []);
          assert_synced_attrs_bang seed history attrs_a attrs_b attrs_b;
          assert_no_invalid_tx_bang seed history repro))

(* deftest two-clients-undo-redo-add-remove-cut-paste-random-sim-test *)
let test_two_clients_undo_redo_add_remove_cut_paste_random_sim () =
  let seed = Option.value (env_seed ()) ~default:default_seed in
  let rng = make_rng seed in
  let gen_uuid () = rng_uuid rng in
  let base_uuid = gen_uuid () in
  let conn_a = create_conn ()
  and conn_b = create_conn () in
  let ops_a = new_client_ops_db ()
  and ops_b = new_client_ops_db () in
  let client_a = make_client repo_a
  and client_b = make_client repo_b in
  let server = make_server () in
  let history = ref [] in
  let state_a = new_state base_uuid in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
    ; repo_b, { conn = conn_b; ops_conn = Some ops_b } ]
    (fun () ->
      let { repro; restore } = install_invalid_tx_repro_bang seed history in
      Fun.protect
        ~finally:restore
        (fun () ->
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          record_meta_bang history
            [ "seed", Wire.Int seed; "base-uuid", Wire.Uuid base_uuid ];
          List.iter
            (fun conn -> ensure_base_page_bang conn base_uuid)
            [ conn_a; conn_b ];
          List.iter
            (fun repo -> Sync_client_op.update_local_tx repo 0)
            [ repo_a; repo_b ];
          let clients =
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = Some gen_uuid }
            ; { repo = repo_b; conn = conn_b; client = client_b
              ; online = true; gen_uuid = Some gen_uuid } ]
          in
          let parent_uuid = gen_uuid ()
          and child_uuid = gen_uuid ()
          and target_uuid = gen_uuid () in
          (match ent_at_uuid (db_of_conn conn_a) base_uuid with
           | Some base_a ->
               create_block_bang conn_a base_a "seed-parent" parent_uuid;
               (match ent_at_uuid (db_of_conn conn_a) parent_uuid with
                | Some parent ->
                    create_block_bang conn_a parent "seed-child"
                      child_uuid
                | None -> ());
               create_block_bang conn_a base_a "" target_uuid
           | None -> ());
          List.iter
            (fun u -> state_a.blocks <- set_add state_a.blocks u)
            [ parent_uuid; child_uuid; target_uuid ];
          let sync_or_report phase () =
            try sync_loop_bang server clients
            with e ->
              report_history_bang seed history
                (Some
                   [ "type", kw "sync-loop-error"; "phase", kw phase ]);
              raise e
          in
          sync_or_report "undo-redo-add-remove-cut-paste-initial-sync" ();
          List.iter
            (fun _ ->
              run_ops_bang rng
                { repo = Some repo_a; conn = conn_a
                ; base_uuid = Some base_uuid; state = state_a
                ; gen_uuid = Some gen_uuid }
                1 history
                { pick_op_opts =
                    { enable_ops =
                        Some
                          [ "undo"; "redo"; "create-block"; "delete-block"
                          ; "cut-paste-block-with-child" ]
                    ; disable_ops = None }
                ; op_table_override = None
                ; context =
                    Some
                      (wire_map
                         [ "phase"
                         , kw "undo-redo-add-remove-cut-paste" ]) };
              sync_or_report "undo-redo-add-remove-cut-paste" ())
            (List.init op_runs Fun.id);
          sync_or_report "undo-redo-add-remove-cut-paste-final" ();
          let issues_a = db_issues (db_of_conn conn_a)
          and issues_b = db_issues (db_of_conn conn_b) in
          let attrs_a = block_attr_map (db_of_conn conn_a)
          and attrs_b = block_attr_map (db_of_conn conn_b) in
          check "expected undo/redo ops"
            (op_count history "undo" + op_count history "redo" > 0);
          check "db A issues empty" (issues_a = []);
          check "db B issues empty" (issues_b = []);
          assert_synced_attrs_bang seed history attrs_a attrs_b attrs_b;
          assert_no_invalid_tx_bang seed history repro))

(* cljs refresh-state! helper *)
let refresh_state_bang (state : sim_state) (conn : conn)
    (base_uuid : string) : unit =
  let db = db_of_conn conn in
  let block_uuids =
    UuidSet.fold
      (fun u acc ->
        match ent_at_uuid db u with
        | Some e when is_page e -> acc
        | _ -> u :: acc)
      (active_block_uuids db) []
  in
  state.pages <- [ base_uuid ];
  state.blocks <- block_uuids

(* deftest two-clients-online-add-vs-delete-with-undo-redo-random-sim-test *)
let test_two_clients_online_add_vs_delete_with_undo_redo_random_sim () =
  let seed = Option.value (env_seed ()) ~default:default_seed in
  let rng = make_rng seed in
  let gen_uuid () = rng_uuid rng in
  let scenario_runs = op_runs in
  let base_uuid = gen_uuid () in
  let conn_a = create_conn ()
  and conn_b = create_conn () in
  let ops_a = new_client_ops_db ()
  and ops_b = new_client_ops_db () in
  let client_a = make_client repo_a
  and client_b = make_client repo_b in
  let server = make_server () in
  let history = ref [] in
  let state_a = new_state base_uuid
  and state_b = new_state base_uuid in
  let ops =
    [ "create-block"; "delete-blocks"; "delete-block"
    ; "indent-outdent-blocks"; "undo"; "redo" ]
  in
  let op_weights =
    [ "create-block", 16
    ; "delete-block", 10
    ; "delete-blocks", 10
    ; "indent-outdent-blocks", 10
    ; "undo", 8
    ; "redo", 8 ]
  in
  let a_op_table =
    build_weighted_op_table ops op_weights "a-add-undo-redo"
  in
  let b_op_table =
    build_weighted_op_table ops op_weights "b-delete-undo-redo"
  in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
    ; repo_b, { conn = conn_b; ops_conn = Some ops_b } ]
    (fun () ->
      let { repro; restore } = install_invalid_tx_repro_bang seed history in
      Fun.protect
        ~finally:restore
        (fun () ->
          let clients =
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = Some gen_uuid }
            ; { repo = repo_b; conn = conn_b; client = client_b
              ; online = true; gen_uuid = Some gen_uuid } ]
          in
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          record_meta_bang history
            [ "seed", Wire.Int seed
            ; "base-uuid", Wire.Uuid base_uuid
            ; "phase", kw "two-clients-online-add-vs-delete"
            ; "scenario-runs", Wire.Int scenario_runs ];
          List.iter
            (fun conn -> ensure_base_page_bang conn base_uuid)
            [ conn_a; conn_b ];
          List.iter
            (fun repo -> Sync_client_op.update_local_tx repo 0)
            [ repo_a; repo_b ];
          (* Bootstrap one local block on A so B has a deletion target. *)
          (match ent_at_uuid (db_of_conn conn_a) base_uuid with
           | Some base_a ->
               let seed_uuid = gen_uuid () in
               create_block_bang conn_a base_a "seed" seed_uuid;
               state_a.blocks <- set_add state_a.blocks seed_uuid
           | None -> ());
          sync_loop_bang server clients;
          refresh_state_bang state_a conn_a base_uuid;
          refresh_state_bang state_b conn_b base_uuid;
          for i = 0 to scenario_runs - 1 do
            run_ops_bang rng
              { repo = Some repo_a; conn = conn_a
              ; base_uuid = Some base_uuid; state = state_a
              ; gen_uuid = Some gen_uuid }
              1 history
              { pick_op_opts =
                  { enable_ops = None; disable_ops = None }
              ; op_table_override = Some a_op_table
              ; context =
                  Some
                    (wire_map
                       [ "phase", kw "a-add-undo-redo"
                       ; "iter", Wire.Int i ]) };
            sync_loop_bang server clients;
            refresh_state_bang state_a conn_a base_uuid;
            refresh_state_bang state_b conn_b base_uuid;
            run_ops_bang rng
              { repo = Some repo_b; conn = conn_b
              ; base_uuid = Some base_uuid; state = state_b
              ; gen_uuid = Some gen_uuid }
              1 history
              { pick_op_opts =
                  { enable_ops = None; disable_ops = None }
              ; op_table_override = Some b_op_table
              ; context =
                  Some
                    (wire_map
                       [ "phase", kw "b-delete-undo-redo"
                       ; "iter", Wire.Int i ]) };
            sync_loop_bang server clients;
            refresh_state_bang state_a conn_a base_uuid;
            refresh_state_bang state_b conn_b base_uuid
          done;
          sync_loop_bang server clients;
          let issues_a = db_issues (db_of_conn conn_a)
          and issues_b = db_issues (db_of_conn conn_b) in
          let attrs_a = block_attr_map (db_of_conn conn_a)
          and attrs_b = block_attr_map (db_of_conn conn_b) in
          check "expected create-block ops"
            (op_count history "create-block" > 0);
          check "expected delete ops"
            (op_count history "delete-block"
             + op_count history "delete-blocks"
             > 0);
          check "db A issues empty" (issues_a = []);
          check "db B issues empty" (issues_b = []);
          assert_synced_attrs_bang seed history attrs_a attrs_b attrs_b;
          assert_no_invalid_tx_bang seed history repro))

(* deftest two-clients-a-wins-b-overlap-rebase-3-tries-test *)
let test_two_clients_a_wins_b_overlap_rebase_3_tries () =
  List.iter
    (fun seed ->
      let rng = make_rng seed in
      let gen_uuid () = rng_uuid rng in
      let scenario_runs = 90 in
      let base_uuid = gen_uuid () in
      let conn_a = create_conn ()
      and conn_b = create_conn () in
      let ops_a = new_client_ops_db ()
      and ops_b = new_client_ops_db () in
      let client_a = make_client repo_a
      and client_b = make_client repo_b in
      let server = make_server () in
      let history = ref [] in
      let state_a = new_state base_uuid
      and state_b = new_state base_uuid in
      let a_ops =
        [ "create-block"; "delete-block"; "move-block"
        ; "indent-outdent-blocks"
        ; "copy-paste-block-tree-into-empty-target"; "undo"; "redo" ]
      in
      let a_op_weights =
        [ "create-block", 18
        ; "delete-block", 10
        ; "move-block", 10
        ; "indent-outdent-blocks", 10
        ; "copy-paste-block-tree-into-empty-target", 8
        ; "undo", 8
        ; "redo", 8 ]
      in
      let b_ops = [ "delete-block"; "delete-blocks" ] in
      let b_op_weights = [ "delete-block", 14; "delete-blocks", 14 ] in
      let a_op_table =
        build_weighted_op_table a_ops a_op_weights "a-overlap-rebase"
      in
      let b_op_table =
        build_weighted_op_table b_ops b_op_weights "b-overlap-rebase"
      in
      let overlap_apply_count = ref 0
      and b_rebase_with_pending = ref 0 in
      with_test_repos
        [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
        ; repo_b, { conn = conn_b; ops_conn = Some ops_b } ]
        (fun () ->
          let { repro; restore } =
            install_invalid_tx_repro_bang seed history
          in
          let sync_a_then_overlap_b (iter_idx : int) =
            ignore
              (sync_client_bang server
                 { repo = repo_a; conn = conn_a; client = client_a
                 ; online = true; gen_uuid = Some gen_uuid });
            let local_tx_b =
              Option.value (Sync_client_op.get_local_tx repo_b)
                ~default:0
            in
            let server_t = server.srv_counter in
            (if local_tx_b < server_t then begin
               let pending_before =
                 Sync_apply.pending_txs repo_b () <> []
               in
               let remote_txs =
                 List.map
                   (fun tx_data ->
                     Wire.Map [ kw "tx-data", Wire.List tx_data ])
                   (server_pull server local_tx_b)
               in
               let slices =
                 if List.length remote_txs <= 1 then [ remote_txs ]
                 else
                   let split =
                     1 + rand_int_bang rng (List.length remote_txs - 1)
                   in
                   let left = sub_list remote_txs 0 split in
                   (* Intentional overlap to mimic duplicated pulls. *)
                   let right = sub_list remote_txs (max 0 (split - 1)) (List.length remote_txs) in
                   [ left; right ]
               in
               (if pending_before then incr b_rebase_with_pending);
               List.iter
                 (fun slice ->
                   if slice <> [] then
                     try
                       await_unit
                         (Sync_apply.apply_remote_txs repo_b client_b
                            slice)
                     with e ->
                       report_history_bang seed history
                         (Some
                            [ "type", kw "b-overlap-apply-remote-failed"
                            ; "iter", Wire.Int iter_idx
                            ; "slice-size", Wire.Int (List.length slice)
                            ; "local-tx", Wire.Int local_tx_b
                            ; "server-t", Wire.Int server_t
                            ; "pending-before", Wire.Bool pending_before ]);
                       raise e)
                 slices;
               (if List.length slices > 1 then incr overlap_apply_count);
               Sync_client_op.update_local_tx repo_b server_t
             end);
            refresh_state_bang state_a conn_a base_uuid;
            refresh_state_bang state_b conn_b base_uuid
          in
          Fun.protect
            ~finally:restore
            (fun () ->
              Hashtbl.reset Sync_apply.repo_latest_remote_tx;
              record_meta_bang history
                [ "seed", Wire.Int seed
                ; "base-uuid", Wire.Uuid base_uuid
                ; "phase", kw "a-wins-b-overlap-rebase"
                ; "scenario-runs", Wire.Int scenario_runs ];
              List.iter
                (fun conn -> ensure_base_page_bang conn base_uuid)
                [ conn_a; conn_b ];
              List.iter
                (fun repo -> Sync_client_op.update_local_tx repo 0)
                [ repo_a; repo_b ];
              (match ent_at_uuid (db_of_conn conn_a) base_uuid with
               | Some base_a ->
                   for i = 0 to 9 do
                     let seed_block_uuid = gen_uuid () in
                     create_block_bang conn_a base_a
                       (Printf.sprintf "seed-overlap-%d" i)
                       seed_block_uuid;
                     state_a.blocks <-
                       set_add state_a.blocks seed_block_uuid
                   done
               | None -> ());
              sync_a_then_overlap_b (-1);
              for i = 0 to scenario_runs - 1 do
                run_ops_bang rng
                  { repo = Some repo_a; conn = conn_a
                  ; base_uuid = Some base_uuid; state = state_a
                  ; gen_uuid = Some gen_uuid }
                  1 history
                  { pick_op_opts =
                      { enable_ops = None; disable_ops = None }
                  ; op_table_override = Some a_op_table
                  ; context =
                      Some
                        (wire_map
                           [ "phase", kw "a-overlap-op"
                           ; "iter", Wire.Int i ]) };
                run_ops_bang rng
                  { repo = Some repo_b; conn = conn_b
                  ; base_uuid = Some base_uuid; state = state_b
                  ; gen_uuid = Some gen_uuid }
                  1 history
                  { pick_op_opts =
                      { enable_ops = None; disable_ops = None }
                  ; op_table_override = Some b_op_table
                  ; context =
                      Some
                        (wire_map
                           [ "phase", kw "b-delete-op"
                           ; "iter", Wire.Int i ]) };
                sync_a_then_overlap_b i
              done;
              sync_a_then_overlap_b scenario_runs;
              let issues_a = db_issues (db_of_conn conn_a)
              and issues_b = db_issues (db_of_conn conn_b) in
              let checksum_a =
                Db_sync_checksum.recompute_checksum (db_of_conn conn_a)
              and checksum_server =
                Db_sync_checksum.recompute_checksum
                  (db_of_conn server.srv_conn)
              in
              check "db A issues empty" (issues_a = []);
              check "db B issues empty" (issues_b = []);
              check "winner/server checksum match"
                (checksum_a = checksum_server);
              check "expected rebases with pending deletes"
                (!b_rebase_with_pending > 0);
              check "expected overlapping apply-remote slices"
                (!overlap_apply_count > 0);
              assert_no_invalid_tx_bang seed history repro)))
    [ 301; 302; 303 ]

(* deftest three-clients-single-repo-sim-test *)
let test_three_clients_single_repo_sim () =
  let seed = Option.value (env_seed ()) ~default:default_seed in
  let rng = make_rng seed in
  let gen_uuid () = rng_uuid rng in
  let base_uuid = gen_uuid () in
  let conn_a = create_conn ()
  and conn_b = create_conn ()
  and conn_c = create_conn () in
  let ops_a = new_client_ops_db ()
  and ops_b = new_client_ops_db ()
  and ops_c = new_client_ops_db () in
  let client_a = make_client repo_a
  and client_b = make_client repo_b
  and client_c = make_client repo_c in
  let server = make_server () in
  let history = ref [] in
  let state_a = new_state base_uuid
  and state_b = new_state base_uuid
  and state_c = new_state base_uuid in
  let repo_state =
    [ repo_a, state_a; repo_b, state_b; repo_c, state_c ]
  in
  with_test_repos
    [ repo_a, { conn = conn_a; ops_conn = Some ops_a }
    ; repo_b, { conn = conn_b; ops_conn = Some ops_b }
    ; repo_c, { conn = conn_c; ops_conn = Some ops_c } ]
    (fun () ->
      let listener_a = "checksum-sync-a"
      and listener_b = "checksum-sync-b"
      and listener_c = "checksum-sync-c" in
      update_local_checksum_listener repo_a conn_a listener_a;
      update_local_checksum_listener repo_b conn_b listener_b;
      update_local_checksum_listener repo_c conn_c listener_c;
      let { repro = _; restore } =
        install_invalid_tx_repro_bang seed history
      in
      Fun.protect
        ~finally:(fun () ->
          restore ();
          Datascript.unlisten conn_a listener_a;
          Datascript.unlisten conn_b listener_b;
          Datascript.unlisten conn_c listener_c)
        (fun () ->
          Hashtbl.reset Sync_apply.repo_latest_remote_tx;
          record_meta_bang history
            [ "seed", Wire.Int seed; "base-uuid", Wire.Uuid base_uuid ];
          List.iter
            (fun conn -> ensure_base_page_bang conn base_uuid)
            [ conn_a; conn_b; conn_c ];
          List.iter
            (fun repo -> Sync_client_op.update_local_tx repo 0)
            [ repo_a; repo_b; repo_c ];
          List.iter
            (fun (repo, conn) ->
              Sync_client_op.update_local_checksum repo
                (Db_sync_checksum.recompute_checksum (db_of_conn conn))
                (db_of_conn conn).max_tx)
            [ repo_a, conn_a; repo_b, conn_b; repo_c, conn_c ];
          let clients =
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = Some gen_uuid }
            ; { repo = repo_b; conn = conn_b; client = client_b
              ; online = true; gen_uuid = Some gen_uuid }
            ; { repo = repo_c; conn = conn_c; client = client_c
              ; online = true; gen_uuid = Some gen_uuid } ]
          in
          let run_ops_opts =
            { pick_op_opts =
                { enable_ops = None
                ; disable_ops = Some [ "undo"; "redo" ] }
            ; op_table_override = None
            ; context = None }
          in
          let sync_or_report phase =
            try sync_loop_bang server clients
            with e ->
              report_history_bang seed history
                (Some [ "type", kw "sync-loop-error"; "phase", kw phase ]);
              raise e
          in
          (* Phase A: all online *)
          run_random_ops_bang rng server clients repo_state base_uuid
            history
            { run_ops_opts with
              context = Some (wire_map [ "phase", kw "phase-a" ]) }
            op_runs;
          (* Phase B: C offline, A/B online *)
          let clients_phase_b =
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = true; gen_uuid = Some gen_uuid }
            ; { repo = repo_b; conn = conn_b; client = client_b
              ; online = true; gen_uuid = Some gen_uuid }
            ; { repo = repo_c; conn = conn_c; client = client_c
              ; online = false; gen_uuid = Some gen_uuid } ]
          in
          run_random_ops_bang rng server
            (sub_list clients_phase_b 0 2)
            repo_state base_uuid history
            { run_ops_opts with
              context =
                Some (wire_map [ "phase", kw "phase-b-ab-online" ]) }
            op_runs;
          run_local_ops_bang rng conn_c base_uuid state_c
            (Some gen_uuid) op_runs history
            { run_ops_opts with
              context =
                Some (wire_map [ "phase", kw "phase-b-c-offline" ]) };
          (* Phase C: reconnect C *)
          sync_or_report "phase-c-reconnect";
          (* Phase D: A offline, B/C online *)
          let clients_phase_d =
            [ { repo = repo_a; conn = conn_a; client = client_a
              ; online = false; gen_uuid = Some gen_uuid }
            ; { repo = repo_b; conn = conn_b; client = client_b
              ; online = true; gen_uuid = Some gen_uuid }
            ; { repo = repo_c; conn = conn_c; client = client_c
              ; online = true; gen_uuid = Some gen_uuid } ]
          in
          run_random_ops_bang rng server
            (sub_list clients_phase_d 1 3)
            repo_state base_uuid history
            { run_ops_opts with
              context =
                Some (wire_map [ "phase", kw "phase-d-bc-online" ]) }
            op_runs;
          run_local_ops_bang rng conn_a base_uuid state_a
            (Some gen_uuid) op_runs history
            { run_ops_opts with
              context =
                Some (wire_map [ "phase", kw "phase-d-a-offline" ]) };
          (* Final sync *)
          sync_or_report "final-sync";
          let issues_a = db_issues (db_of_conn conn_a)
          and issues_b = db_issues (db_of_conn conn_b)
          and issues_c = db_issues (db_of_conn conn_c) in
          (if issues_a <> [] then
             report_history_bang seed history
               (Some
                  [ "type", kw "db-issues"; "repo", Wire.String repo_a ]));
          (if issues_b <> [] then
             report_history_bang seed history
               (Some
                  [ "type", kw "db-issues"; "repo", Wire.String repo_b ]));
          (if issues_c <> [] then
             report_history_bang seed history
               (Some
                  [ "type", kw "db-issues"; "repo", Wire.String repo_c ]));
          check "db A issues empty" (issues_a = []);
          check "db B issues empty" (issues_b = []);
          check "db C issues empty" (issues_c = []);
          let attrs_a = block_attr_map (db_of_conn conn_a)
          and attrs_b = block_attr_map (db_of_conn conn_b)
          and attrs_c = block_attr_map (db_of_conn conn_c) in
          assert_synced_attrs_bang seed history attrs_a attrs_b attrs_c;
          assert_checksum_cache_aligned_bang seed server
            [ repo_a, conn_a; repo_b, conn_b; repo_c, conn_c ]))

(* ---------- alcotest registration ---------- *)

let () =
  Alcotest.run "db-worker"
    [ ( "db-sync-sim"
      , [ Alcotest.test_case "rng-uuid-deterministic-test" `Quick
            test_rng_uuid_deterministic
        ; Alcotest.test_case "invalid-tx-repro-callback-test" `Quick
            test_invalid_tx_repro_callback
        ; Alcotest.test_case "sync-loop-all-offline-no-error-test" `Quick
            test_sync_loop_all_offline_no_error
        ; Alcotest.test_case
            "two-clients-initial-sync-keeps-shared-base-page-test" `Quick
            test_two_clients_initial_sync_keeps_shared_base_page
        ; Alcotest.test_case
            "recycled-entities-are-excluded-from-sim-comparison-test"
            `Quick test_recycled_entities_are_excluded_from_sim_comparison
        ; Alcotest.test_case
            "uploaded-pending-txs-are-cleared-in-sim-test" `Quick
            test_uploaded_pending_txs_are_cleared_in_sim
        ; Alcotest.test_case "two-clients-online-offline-sim-test" `Quick
            test_two_clients_online_offline_sim
        ; Alcotest.test_case
            "two-clients-offline-concurrent-undo-redo-merge-sim-test"
            `Quick
            test_two_clients_offline_concurrent_undo_redo_merge_sim
        ; Alcotest.test_case
            "two-clients-rebase-keeps-local-title-after-reverse-tx-test"
            `Quick
            test_two_clients_rebase_keeps_local_title_after_reverse_tx
        ; Alcotest.test_case
            "undo-redo-indent-sequence-does-not-produce-invalid-entity-test"
            `Quick
            test_undo_redo_indent_sequence_does_not_produce_invalid_entity
        ; Alcotest.test_case
            "two-clients-undo-skips-conflicted-move-but-keeps-db-valid-test"
            `Quick
            test_two_clients_undo_skips_conflicted_move_but_keeps_db_valid
        ; Alcotest.test_case "two-clients-syncs-undo-of-new-block-test"
            `Quick test_two_clients_syncs_undo_of_new_block
        ; Alcotest.test_case
            "two-clients-offline-insert-delete-indent-undo-redo-keeps-checksum-cache-aligned-test"
            `Quick
            test_two_clients_offline_insert_delete_indent_undo_redo_checksum
        ; Alcotest.test_case
            "two-clients-empty-child-undo-redo-reconnect-keeps-checksum-cache-aligned-test"
            `Quick
            test_two_clients_empty_child_undo_redo_reconnect_checksum
        ; Alcotest.test_case
            "all-core-outliner-ops-local-undo-redo-random-sim-test"
            `Quick
            test_all_core_outliner_ops_local_undo_redo_random_sim
        ; Alcotest.test_case
            "every-core-outliner-op-uploads-with-and-without-rebase-test"
            `Quick
            test_every_core_outliner_op_uploads_with_and_without_rebase
        ; Alcotest.test_case "two-clients-online-sim-test" `Quick
            test_two_clients_online_sim
        ; Alcotest.test_case "two-clients-cut-paste-random-sim-test"
            `Quick test_two_clients_cut_paste_random_sim
        ; Alcotest.test_case
            "two-clients-undo-redo-add-remove-cut-paste-random-sim-test"
            `Quick
            test_two_clients_undo_redo_add_remove_cut_paste_random_sim
        ; Alcotest.test_case
            "two-clients-online-add-vs-delete-with-undo-redo-random-sim-test"
            `Quick
            test_two_clients_online_add_vs_delete_with_undo_redo_random_sim
        ; Alcotest.test_case
            "two-clients-a-wins-b-overlap-rebase-3-tries-test" `Quick
            test_two_clients_a_wins_b_overlap_rebase_3_tries
        ; Alcotest.test_case "three-clients-single-repo-sim-test" `Quick
            test_three_clients_single_repo_sim ] ) ]
