(* Post-import finishing passes — tx-id stamping, block refs rebuild,
   missing placeholder ref cleanup, journal uuid normalization, and page
   order repair.

   Ported from
   deps/graph-parser/src/logseq/graph_parser/exporter/finalize.cljs *)

open Datascript
module BM = Block_map

let kw (s : string) : value = Keyword s

(* bm -> tx_op with normalized values (gp-exporter bm_tx_op, local copy
   to keep this module free of a dependency on Gp_exporter) *)
let bm_tx_op (db : db) (m : BM.t) : tx_op =
  BM.to_tx_op db
    (List.map (fun (a, v) -> (a, Block_map.normalize_value v)) m)

(* ldb/transact! conn tx {::imported-data? true} *)
let imported_data_tx_meta : tx_meta =
  [ ("logseq.graph-parser.exporter/imported-data?", Bool true) ]

let transact_imported (conn : conn) (tx : tx_op list) : tx_report =
  Db_tx.transact ~tx_meta:imported_data_tx_meta conn tx

let transact_imported_maps (conn : conn) (maps : BM.t list) : tx_report =
  let db = Datascript.db conn in
  transact_imported conn (List.map (bm_tx_op db) maps)

(* ---------- missing block refs ---------- *)

(* cljs (string/replace (block-ref/->block-ref uuid) etc.) on title *)
let remove_block_ref_from_title (title : value option) (block_uuid : string)
    : value option =
  match title with
  | Some (String t) ->
    let t = Common_util.str_replace_all t (Block_ref.to_block_ref block_uuid) "" in
    let t = Common_util.str_replace_all t (Page_ref.to_page_ref block_uuid) "" in
    Some
      (String
         (Unicode.trim
            (Regexp.replace ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> " ")
               (Regexp.compile " {2,}") t)))
  | _ -> None

(* entity-level placeholder ref: has :block/uuid and no :block/title *)
let placeholder_block_ref_ent (e : entity) : bool =
  Ldb.value e "block/uuid" <> None && Ldb.value e "block/title" = None

type phd = { phd_source_id : int; phd_ref_id : int; phd_ref_uuid : string }

(* missing-placeholder-ref-datoms — when candidate uuids given, check
   only their entities; else scan all :aevt attr datoms *)
let missing_placeholder_ref_datoms (db : db) (attr : attr)
    (candidate_ref_uuids : string list) : phd list =
  if candidate_ref_uuids <> [] then
    List.concat_map
      (fun ref_uuid ->
        match Ldb.ent_of_ref db (Lookup_ref ("block/uuid", Uuid ref_uuid)) with
        | Some e when placeholder_block_ref_ent e ->
          List.map
            (fun (d : datom) ->
              { phd_source_id = d.e; phd_ref_id = e.id
              ; phd_ref_uuid = ref_uuid })
            (List.of_seq (datoms db Avet ~a:attr ~v:(Ref e.id) ()))
        | _ -> [])
      candidate_ref_uuids
  else
    List.filter_map
      (fun (d : datom) ->
        match d.v with
        | Ref id ->
          (match Ldb.ent_of_id db id with
           | Some e when placeholder_block_ref_ent e ->
             (match Ldb.value e "block/uuid" with
              | Some (Uuid u) | Some (String u) ->
                Some
                  { phd_source_id = d.e; phd_ref_id = id
                  ; phd_ref_uuid = u }
              | _ -> None)
           | _ -> None)
        | _ -> None)
      (List.of_seq (datoms db Aevt ~a:attr ()))

(* cleanup-missing-block-refs-tx *)
let cleanup_missing_block_refs_tx (db : db)
    (candidate_ref_uuids : string list) : tx_op list =
  let missing_refs =
    missing_placeholder_ref_datoms db "block/refs" candidate_ref_uuids
  and missing_links =
    missing_placeholder_ref_datoms db "block/link" candidate_ref_uuids
  in
  let refs_by_source = Hashtbl.create 63 in
  List.iter
    (fun (d : phd) ->
      Hashtbl.replace refs_by_source d.phd_source_id
        (d :: Option.value ~default:[]
            (Hashtbl.find_opt refs_by_source d.phd_source_id)))
    missing_refs;
  let retract_ref_tx =
    Hashtbl.fold
      (fun source_id refs acc ->
        acc
        @ List.map
            (fun r ->
              Retract
                (Entity_id source_id, "block/refs", Some (Ref r.phd_ref_id)))
            refs)
      refs_by_source []
  in
  let retract_link_tx =
    List.map
      (fun d ->
        Retract
          (Entity_id d.phd_source_id, "block/link", Some (Ref d.phd_ref_id)))
      missing_links
  in
  let update_title_tx =
    Hashtbl.fold
      (fun source_id refs acc ->
        match Ldb.ent_of_id db source_id with
        | Some source ->
          let title = Ldb.value source "block/title" in
          let title' =
            List.fold_left
              (fun t r -> remove_block_ref_from_title t r.phd_ref_uuid)
              title refs
          in
          (match title', title with
           | Some t', Some t when t' <> t ->
             acc @ [ Add (Entity_id source_id, "block/title", t') ]
           | _ -> acc)
        | None -> acc)
      refs_by_source []
  in
  let placeholder_retract_tx =
    List.sort_uniq
      (fun (a : phd) b -> compare a.phd_ref_id b.phd_ref_id)
      (missing_refs @ missing_links)
    |> List.map (fun d ->
           Retract
             (Entity_id d.phd_ref_id, "block/uuid",
              Some (Uuid d.phd_ref_uuid)))
  in
  retract_ref_tx @ retract_link_tx @ update_title_tx
  @ placeholder_retract_tx

(* set-finishing-import-ui *)
let set_finishing_import_ui (set : string list -> value -> unit) : unit =
  set [ "graph/importing-state"; "step" ] (kw "finishing");
  set [ "graph/importing-state"; "label" ] (kw "import/finishing");
  set [ "graph/importing-state"; "current-page" ] Nil;
  set [ "graph/importing-state"; "current-idx" ] Nil

(* finalize-imported-graph! — stamp :block/tx-id and rebuild :block/refs
   once after file import.

   Per-file import txs set ::new-graph?, so CLI listeners and worker
   transact-pipeline skip refs. This pass writes both in one transact.
   File-graph import does not notify renderer clients; ::imported-data?
   skips worker render-delta broadcast. :transact-new-graph-refs? skips
   the worker pipeline so refs are not rebuilt a second time. *)
let finalize_imported_graph (conn : conn) : tx_report option =
  let db = Conn.db conn in
  let entity_ids =
    List.filter_map
      (fun (d : datom) ->
        match Ldb.ent_of_id db d.e with
        | Some e ->
          if Ldb.value e "block/title" <> None
             && Ldb.value e "block/tx-id" = None
          then Some d.e
          else None
        | None -> None)
      (List.of_seq (datoms db Aevt ~a:"block/uuid" ()))
  in
  if entity_ids = [] then None
  else
    let tx_id = db.max_tx + 1 in
    let ops =
      List.concat_map
        (fun id ->
          match Ldb.ent_of_id db id with
          | Some block ->
            let refs =
              match Ldb.value block "logseq.property.reaction/target" with
              | Some _ -> []
              | None -> Outliner_pipeline.db_rebuild_block_refs db block ()
            in
            let old_refs =
              if refs = [] then []
              else
                List.filter_map
                  (fun (d : datom) ->
                    match d.v with Ref r -> Some r | _ -> None)
                  (List.of_seq (datoms db Eavt ~e:id ~a:"block/refs" ()))
            in
            let missing_in a b =
              List.filter (fun x -> not (List.mem x b)) a
            in
            Add (Entity_id id, "block/tx-id", Int64 (Int64.of_int tx_id))
            :: List.map
                 (fun r ->
                   Retract (Entity_id id, "block/refs", Some (Ref r)))
                 (missing_in old_refs refs)
            @ List.map
                (fun r -> Add (Entity_id id, "block/refs", Ref r))
                (missing_in refs old_refs)
          | None -> [])
        entity_ids
    in
    if ops = [] then None
    else
      Some
        (Db_tx.transact
           ~tx_meta:
             (("logseq.graph-parser.exporter/imported-data?", Bool true)
              :: ("logseq.graph-parser.exporter/new-graph?", Bool true)
              :: [ ("transact-new-graph-refs?", Bool true) ])
           conn ops)

(* cleanup-missing-block-refs! *)
let cleanup_missing_block_refs (conn : conn)
    (candidate_ref_uuids : string list) : tx_report option =
  let tx = cleanup_missing_block_refs_tx (Conn.db conn) candidate_ref_uuids in
  if tx = [] then None else Some (transact_imported conn tx)

(* ---------- normalize journal uuids ---------- *)

type journal_normalization =
  { jn_eid : entity_id; jn_old : string; jn_new : string }

(* journal-uuid-normalizations: journal-day datoms whose entity uuid
   differs from the standard generated uuid *)
let journal_uuid_normalizations (db : db) : journal_normalization list =
  List.filter_map
    (fun (d : datom) ->
      match d.v with
      | Int64 day ->
        (match Ldb.ent_of_id db d.e with
         | Some e ->
           (match Ldb.value e "block/uuid" with
            | Some (Uuid old_uuid) | Some (String old_uuid) ->
              let new_uuid = Common_uuid.gen_journal_page_uuid (Datascript.Util.int64_to_int_exn "journal-day" day) in
              if old_uuid = new_uuid then None
              else (
                (match
                   Ldb.ent_of_ref db
                     (Lookup_ref ("block/uuid", Uuid new_uuid))
                 with
                 | Some target when target.id <> e.id ->
                   invalid_arg
                     "Cannot normalize journal uuid because the standard uuid is already used"
                 | _ -> ());
                Some { jn_eid = e.id; jn_old = old_uuid; jn_new = new_uuid })
            | _ -> None)
         | None -> None)
      | _ -> None)
    (List.of_seq (datoms db Avet ~a:"block/journal-day" ()))

(* replace-journal-uuid-refs — postwalk over a value; inside strings,
   [[old]] -> [[new]] and ((old)) -> ((new)) *)
let replace_journal_uuid_refs (replacements : (string * string) list)
    (v : value) : value =
  if replacements = [] then v
  else
    let rec go (v : value) : value =
      match v with
      | String s ->
        String
          (List.fold_left
             (fun acc (old_uuid, new_uuid) ->
               let acc =
                 Common_util.str_replace_all acc
                   (Page_ref.to_page_ref old_uuid)
                   (Page_ref.to_page_ref new_uuid)
               in
               Common_util.str_replace_all acc
                 (Block_ref.to_block_ref old_uuid)
                 (Block_ref.to_block_ref new_uuid))
             s replacements)
      | Vector vs -> Vector (List.map go vs)
      | List vs -> List (List.map go vs)
      | Set vs -> Set (List.map go vs)
      | Map kvs -> Map (List.map (fun (k, x) -> (go k, go x)) kvs)
      | _ -> v
    in
    go v

(* normalize-journal-uuids-tx *)
let normalize_journal_uuids_tx (db : db) : tx_op list =
  let normalizations = journal_uuid_normalizations db in
  let uuid_tx =
    List.concat_map
      (fun n ->
        [ Retract (Entity_id n.jn_eid, "block/uuid", Some (Uuid n.jn_old))
        ; Add (Entity_id n.jn_eid, "block/uuid", Uuid n.jn_new) ])
      normalizations
  in
  let text_tx =
    if normalizations = [] then []
    else
      let replacements =
        List.map (fun n -> (n.jn_old, n.jn_new)) normalizations
      in
      List.filter_map
        (fun (d : datom) ->
          match d.v with
          | String _ | Vector _ | List _ | Set _ | Map _ ->
            let v' = replace_journal_uuid_refs replacements d.v in
            if v' <> d.v then Some (Add (Entity_id d.e, d.a, v')) else None
          | _ -> None)
        (List.of_seq (datoms db Eavt ()))
  in
  uuid_tx @ text_tx

(* normalize-journal-uuids! *)
let normalize_journal_uuids (conn : conn) : tx_report option =
  let tx = normalize_journal_uuids_tx (Conn.db conn) in
  if tx = [] then None else Some (transact_imported conn tx)

(* missing-internal-page-parent-order-tx — imported internal pages under a
   namespace parent that lack a string :block/order *)
let missing_internal_page_parent_order_tx (db : db) : BM.t list =
  let groups : (int, entity list) Hashtbl.t = Hashtbl.create 63 in
  List.iter
    (fun (d : datom) ->
      match Ldb.ent_of_id db d.e with
      | Some child ->
        let key = match d.v with Ref p -> p | _ -> -1 in
        Hashtbl.replace groups key
          (child :: Option.value ~default:[] (Hashtbl.find_opt groups key))
      | None -> ())
    (List.of_seq (datoms db Avet ~a:"block/parent" ()));
  Hashtbl.fold
    (fun _parent children acc ->
      let missing =
        List.filter
          (fun c ->
            Entity_util.internal_page c
            &&
            match Ldb.value c "block/order" with
            | Some (String _) -> false
            | _ -> true)
          children
      in
      if missing = [] then acc
      else
        let max_order =
          match
            List.rev
              (List.sort compare
                 (List.filter_map
                    (fun c ->
                      match Ldb.value c "block/order" with
                      | Some (String s) -> Some s
                      | _ -> None)
                    children))
          with
          | [] -> None
          | h :: _ -> Some h
        in
        let keys = Db_order.gen_n_keys (List.length missing) max_order None in
        acc
        @ List.map2
            (fun (c : entity) order ->
              [ ("db/id", Ref c.id); ("block/order", String order) ])
            missing keys)
    groups []

(* ensure-imported-page-parent-orders! *)
let ensure_imported_page_parent_orders (conn : conn) : tx_report option =
  let tx = missing_internal_page_parent_order_tx (Conn.db conn) in
  if tx = [] then None else Some (transact_imported_maps conn tx)
