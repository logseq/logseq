(* logseq.db-sync.order — fix-duplicate-orders! *)

open Datascript

let attr_value_str (db : db) (e : int) (a : attr) : string option =
  match find_datom db Eavt ~e ~a () with
  | Some d -> (match d.v with String s -> Some s | Uuid u -> Some u | _ -> None)
  | None -> None

let parent_eid (db : db) (e : int) : int option =
  match find_datom db Eavt ~e ~a:"block/parent" () with
  | Some d -> (match d.v with Ref p -> Some p | _ -> None)
  | None -> None

let block_uuid_of (db : db) (e : int) : string option =
  match find_datom db Eavt ~e ~a:"block/uuid" () with
  | Some d -> (match d.v with Uuid u -> Some u | String s -> Some s | _ -> None)
  | None -> None

let fix_duplicate_orders (conn : conn) (tx_data : datom list)
    (tx_meta : tx_meta) : unit =
  let db = Conn.db conn in
  let updates =
    List.filter
      (fun (d : datom) ->
         d.a = "block/order" && d.added && block_uuid_of db d.e <> None)
      tx_data
  in
  let groups = Hashtbl.create 17 in
  List.iter
    (fun (d : datom) ->
       let key = (parent_eid db d.e, d.v) in
       match Hashtbl.find_opt groups key with
       | Some l -> Hashtbl.replace groups key (d :: l)
       | None -> Hashtbl.replace groups key [ d ])
    updates;
  let fixes = ref [] in
  Hashtbl.iter
    (fun (parent, value) _group ->
       match (parent, value) with
       | Some parent_eid, String order_v ->
           let siblings =
             List.of_seq
               (datoms db Avet ~a:"block/parent" ~v:(Ref parent_eid) ())
           in
           let same_order_siblings =
             siblings
             |> List.filter (fun (d : datom) ->
                    attr_value_str db d.e "block/order" = Some order_v)
             |> List.map (fun (d : datom) -> d.e)
             |> List.sort_uniq compare
           in
           let same_sorted =
             List.sort
               (fun a b ->
                  compare
                    (Option.value (block_uuid_of db a) ~default:"")
                    (Option.value (block_uuid_of db b) ~default:""))
               same_order_siblings
           in
           if List.length same_sorted > 1 then begin
             let orders =
               List.filter_map
                 (fun (d : datom) -> attr_value_str db d.e "block/order")
                 siblings
             in
             let end_ = List.find_opt (fun o -> compare o order_v > 0) orders in
             let new_orders =
               Db_order.gen_n_keys (List.length same_sorted) (Some order_v)
                 end_
             in
             List.iteri
               (fun i eid ->
                  let order = List.nth new_orders i in
                  fixes :=
                    Add (Entity_id eid, "block/order", String order) :: !fixes)
               same_sorted
           end
       | _ -> ())
    groups;
  if !fixes <> [] then
    let _report =
      (* cljs (merge tx-meta {:op :fix-duplicate-order}) — overwrites :op *)
      transact_conn conn (List.rev !fixes)
        ~tx_meta:
          (List.filter (fun (k, _) -> k <> "op") tx_meta
           @ [ ("op", Keyword "fix-duplicate-order") ])
    in
    ()
