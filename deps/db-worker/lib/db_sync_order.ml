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

(* Compute the fix ops against a db without transacting. Keyed by
   block/uuid lookup-refs so the result can be applied to any conn whose
   state matches the db it was computed on — computing against the server
   conn's confirmed state makes every client derive the SAME fix ops for a
   concurrent-insert collision (display conns differ per client because
   they mix pending ops into the sibling sets). *)
let dup_order_fix_ops (db : db) (tx_data : datom list) : tx_op list =
  let updates =
    List.filter
      (fun (d : datom) -> d.a = "block/order" && d.added && block_uuid_of db d.e <> None)
      tx_data
  in
  let groups = Hashtbl.create 17 in
  List.iter
    (fun (d : datom) ->
       let key = parent_eid db d.e, d.v in
       match Hashtbl.find_opt groups key with
       | Some l -> Hashtbl.replace groups key (d :: l)
       | None -> Hashtbl.replace groups key [ d ])
    updates;
  (* Enumerate each affected parent's siblings once, even when a reorder
     changes every sibling to a distinct order. *)
  let sibling_orders = Hashtbl.create 17 in
  let orders_for_parent parent =
    match Hashtbl.find_opt sibling_orders parent with
    | Some cached -> cached
    | None ->
      let by_order = Hashtbl.create 17 in
      let orders_rev =
        Seq.fold_left
          (fun orders (d : datom) ->
             match attr_value_str db d.e "block/order" with
             | None -> orders
             | Some order ->
               let siblings =
                 Option.value (Hashtbl.find_opt by_order order) ~default:[]
               in
               Hashtbl.replace by_order order (d.e :: siblings);
               order :: orders)
          []
          (datoms db Avet ~a:"block/parent" ~v:(Ref parent) ())
      in
      let cached = by_order, List.rev orders_rev in
      Hashtbl.add sibling_orders parent cached;
      cached
  in
  let fixes = ref [] in
  Hashtbl.iter
    (fun (parent, value) _group ->
       match parent, value with
       | Some parent_eid, String order_v ->
         let by_order, orders = orders_for_parent parent_eid in
         let same_order_siblings =
           Option.value (Hashtbl.find_opt by_order order_v) ~default:[]
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
         if List.length same_sorted > 1
         then (
           let end_ = List.find_opt (fun o -> compare o order_v > 0) orders in
           let new_orders =
             Db_order.gen_n_keys (List.length same_sorted) (Some order_v) end_
           in
           List.iter2
             (fun eid order ->
                let uuid = Option.value (block_uuid_of db eid) ~default:"" in
                if uuid <> ""
                then
                  fixes
                  := Add
                       (Lookup_ref ("block/uuid", Uuid uuid), "block/order", String order)
                     :: !fixes)
             same_sorted
             new_orders)
       | _ -> ())
    groups;
  List.rev !fixes

let fix_duplicate_orders (conn : conn) (tx_data : datom list)
    (tx_meta : tx_meta) : unit =
  let fixes = dup_order_fix_ops (Conn.db conn) tx_data in
  if fixes <> [] then begin
    let _report =
      (* cljs (merge tx-meta {:op :fix-duplicate-order}) — overwrites :op *)
      transact_conn conn fixes
        ~tx_meta:
          (List.filter (fun (k, _) -> k <> "op") tx_meta
           @ [ ("op", Keyword "fix-duplicate-order") ])
    in
    ()
  end
