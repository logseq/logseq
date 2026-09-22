(* frontend.worker.sync.asset-db-listener — turn asset-checksum datom
   adds into update-asset ops in the client_ops store. *)

open Datascript

let asset_checksum a = a = "logseq.property.asset/checksum"

let datom_to_op (db : db) (d : datom) : Wire.t option =
  match entity db (Entity_id d.e) with
  | Some ent when Ldb.asset ent ->
      (match Ldb.value ent "block/uuid" with
       | Some (Uuid u) | Some (String u) ->
           Some
             (Wire.Array
                [ Wire.Keyword "update-asset"; Wire.Int d.tx
                ; Wire.Map [ (Wire.Keyword "block-uuid", Wire.Uuid u) ] ])
       | _ -> None)
  | _ -> None

let generate_asset_ops repo ~(db_after : db) ~(tx_data : datom list) : unit =
  if Sync_client_op.rtc_db_graph repo then begin
    let related =
      List.filter (fun (d : datom) -> asset_checksum d.a && d.added) tx_data
    in
    let ops = List.filter_map (datom_to_op db_after) related in
    if ops <> [] then Sync_client_op.add_asset_ops repo ops
  end
