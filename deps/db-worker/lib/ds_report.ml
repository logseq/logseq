(* logseq.outliner.datascript-report — blocks/pages touched by a
   tx-report, for the worker pipeline's rebuild-block-refs hook. *)

open Datascript

(* get-entity-from-db-after-or-before — entity from db-after when it
   still exists there, else from db-before (deleted entities). *)
let get_entity_from_db_after_or_before (r : tx_report) (db_id : entity_id)
    : entity option =
  match entity r.db_after (Entity_id db_id) with
  | Some e -> Some e
  | None -> entity r.db_before (Entity_id db_id)

let get_blocks_and_pages (r : tx_report) : entity list * entity list =
  let seen_blocks = Hashtbl.create 32 and seen_pages = Hashtbl.create 8 in
  let blocks = ref [] and pages = ref [] in
  let push_blocks e = if not (Hashtbl.mem seen_blocks e.id) then begin
      Hashtbl.add seen_blocks e.id (); blocks := e :: !blocks end in
  let push_pages e = if not (Hashtbl.mem seen_pages e.id) then begin
      Hashtbl.add seen_pages e.id (); pages := e :: !pages end in
  let updated_db_ids =
    let seen = Hashtbl.create 1024 in
    List.fold_left
      (fun acc (d : datom) ->
        if Hashtbl.mem seen d.e then acc
        else begin Hashtbl.add seen d.e (); d.e :: acc end)
      [] r.tx_data
  in
  List.iter
    (fun id ->
      match get_entity_from_db_after_or_before r id with
      | None -> ()
      | Some block_entity ->
          push_blocks block_entity;
          (match Ldb.ref_ent block_entity "block/page" with
           | Some page_ent ->
               (match get_entity_from_db_after_or_before r page_ent.id with
                | Some p -> push_pages p
                | None -> ())
           | None -> ()))
    updated_db_ids;
  (* :from-page / :target-page logged in tx-meta (move ops) *)
  let meta_page_ids =
    List.filter_map
      (fun k ->
        match Db_tx.tx_meta_lookup r.tx_meta k with
        | Some (Ref n) -> Some n
        | Some (Int64 n) -> Datascript.Util.int64_to_int n
        | _ -> None)
      [ "from-page"; "target-page" ]
  in
  List.iter
    (fun id ->
      match get_entity_from_db_after_or_before r id with
      | Some p -> push_pages p
      | None -> ())
    meta_page_ids;
  (List.rev !blocks, List.rev !pages)
