(* frontend.worker.render-delta — incremental render delta (block
   replacements, tombstones, children patches) broadcast to the renderer
   after each transaction. 1:1 port of render_delta.cljs. *)

open Datascript

let kw s = Wire.Keyword s

let membership_affecting_attrs =
  [ "block/closed-value-property"; "block/order"; "block/parent"
  ; "logseq.property/created-from-property"
  ; "logseq.property/deleted-at" ]

let fail message (data : Wire.t) : 'a =
  raise
    (Sync_util.ex_info message
       (match data with
        | Wire.Map kvs -> kvs
        | _ -> []))

let valid_tx_id = function
  | Wire.Int n -> n >= 0
  | Wire.Int64 n -> n >= 0L
  | _ -> false

(* validate-blocks! — blocks is a {uuid block} wire map *)
let validate_blocks (blocks : Wire.t) : unit =
  match blocks with
  | Wire.Map kvs ->
      List.iter
        (fun (k, block) ->
           (match k with
            | Wire.Uuid _ -> ()
            | _ ->
                fail "Invalid block UUID"
                  (Wire.Map [ kw "block-uuid", k ]));
           match block with
           | Wire.Map _ -> (
               (match Wire.get "block/uuid" block with
                | Some w when w = k -> ()
                | _ ->
                    fail "Block UUID does not match its key"
                      (Wire.Map
                         [ kw "block-uuid", k
                         ; ( kw "replacement-uuid"
                           , Option.value
                               (Wire.get "block/uuid" block)
                               ~default:Wire.Nil ) ]));
               match Wire.get "block/tx-id" block with
               | Some v when valid_tx_id v -> ()
               | v ->
                   fail "Invalid block transaction ID"
                     (Wire.Map
                        [ kw "block-uuid", k
                        ; ( kw "block-tx-id"
                          , Option.value v ~default:Wire.Nil ) ]))
           | _ ->
               fail "Invalid block replacement"
                 (Wire.Map [ kw "block-uuid", k; kw "block", block ]))
        kvs
  | _ -> fail "Invalid block replacements" (Wire.Map [ kw "blocks", blocks ])

let validate_deleted_block_uuids (deleted : Wire.t) : unit =
  match deleted with
  | Wire.Set xs | Wire.Array xs | Wire.List xs ->
      List.iter
        (fun u ->
           match u with
           | Wire.Uuid _ -> ()
           | _ ->
               fail "Invalid deleted block UUID"
                 (Wire.Map [ kw "block-uuid", u ]))
        xs
  | _ ->
      fail "Invalid deleted block UUID set"
        (Wire.Map [ kw "deleted-block-uuids", deleted ])

(* structural-entity-ids *)
let structural_entity_ids (tx_data : datom list) : entity_id list =
  tx_data
  |> List.filter_map (fun (d : datom) ->
         if List.mem d.a membership_affecting_attrs then Some d.e
         else None)
  |> Sync_state.distinct_by Fun.id

type membership =
  { block_uuid : string
  ; parent_uuid : string
  ; order : value }

let value_wire (v : value) : Wire.t = Ds_wire.transit_of_value v

(* membership-at — nil when the entity is absent or membership-hidden *)
let membership_at (db : db) (entity_id : entity_id) : membership option =
  match entity db (Entity_id entity_id) with
  | None -> None
  | Some e ->
      if
        Ldb.value e "block/closed-value-property" <> None
        || Ldb.value e "logseq.property/created-from-property" <> None
        || Ldb.value e "logseq.property/deleted-at" <> None
      then None
      else
        (match Ldb.ref_ent e "block/parent" with
         | Some parent -> (
             (* cljs checks (some? order) before validating uuids *)
             match Ldb.value e "block/order" with
             | Some order ->
                 let block_uuid =
                   match Ldb.value e "block/uuid" with
                   | Some (Uuid u) -> u
                   | v ->
                       fail "Invalid child UUID"
                         (Wire.Map
                            [ kw "entity-id", Wire.Int entity_id
                            ; ( kw "block-uuid"
                              , Option.map value_wire v
                                |> Option.value ~default:Wire.Nil ) ])
                 in
                 let parent_uuid =
                   match Ldb.value parent "block/uuid" with
                   | Some (Uuid u) -> u
                   | v ->
                       fail "Invalid parent UUID"
                         (Wire.Map
                            [ kw "entity-id", Wire.Int entity_id
                            ; ( kw "parent-uuid"
                              , Option.map value_wire v
                                |> Option.value ~default:Wire.Nil ) ])
                 in
                 Some { block_uuid; parent_uuid; order }
             | None -> None)
         | None -> None)

let membership_eq (a : membership option) (b : membership option) : bool =
  a = b

(* membership-operations — {parent-uuid {remove [...] upsert [...]}} *)
let membership_operations (tx_report : tx_report)
    : (string * ((string * value) list * (string * value) list)) list =
  let db_before = tx_report.db_before and db_after = tx_report.db_after in
  List.fold_left
    (fun ops entity_id ->
       let before = membership_at db_before entity_id in
       let after = membership_at db_after entity_id in
       if membership_eq before after then ops
       else
         let ops =
           match before with
           | Some m ->
               let cur =
                 match List.assoc_opt m.parent_uuid ops with
                 | Some (rm, up) -> (rm, up)
                 | None -> ([], [])
               in
               let rm, up = cur in
               (m.parent_uuid, (rm @ [ (m.block_uuid, m.order) ], up))
               :: List.remove_assoc m.parent_uuid ops
           | None -> ops
         in
         match after with
         | Some m ->
             let cur =
               match List.assoc_opt m.parent_uuid ops with
               | Some (rm, up) -> (rm, up)
               | None -> ([], [])
             in
             let rm, up = cur in
             (m.parent_uuid, (rm, up @ [ (m.block_uuid, m.order) ]))
             :: List.remove_assoc m.parent_uuid ops
         | None -> ops)
    []
    (List.rev (structural_entity_ids tx_report.tx_data))

(* ordered-operations — cljs sort-by (juxt (str order) (str uuid)) *)
let str_of_value (v : value) : string =
  match value_wire v with
  | Wire.String s -> s
  | Wire.Int n -> string_of_int n
  | Wire.Int64 n -> Int64.to_string n
  | Wire.Float f -> Common_util.js_string_of_float f
  | Wire.Uuid u -> u
  | Wire.Keyword s -> s
  | Wire.Bool b -> string_of_bool b
  | w -> Transit_codec.to_string w

let ordered_operations (ops : (string * value) list) : Wire.t =
  ops
  |> List.stable_sort
       (fun (u1, o1) (u2, o2) ->
          let c = String.compare (str_of_value o1) (str_of_value o2) in
          if c <> 0 then c else String.compare u1 u2)
  |> List.map (fun (u, o) -> Wire.Array [ Wire.Uuid u; value_wire o ])
  |> fun l -> Wire.Array l

let parent_patch base_rev rev (db_after : db) (parent_uuid : string)
    ((rm, up) : (string * value) list * (string * value) list)
    : Wire.t option =
  match entity db_after (Lookup_ref ("block/uuid", Uuid parent_uuid)) with
  | Some _ ->
      Some
        (Wire.Map
           [ kw "base-rev", Wire.Int base_rev
           ; kw "rev", Wire.Int rev
           ; kw "remove", ordered_operations rm
           ; kw "upsert", ordered_operations up ])
  | None -> None

let build_children_patches rev (tx_report : tx_report) : Wire.t =
  let base_rev = tx_report.db_before.max_tx in
  membership_operations tx_report
  |> List.filter_map
       (fun (parent_uuid, ops) ->
          parent_patch base_rev rev tx_report.db_after parent_uuid ops
          |> Option.map (fun p -> (Wire.Uuid parent_uuid, p)))
  |> fun kvs -> Wire.Map kvs

(* build — one renderer delta from block replacements + tx-report *)
let build ~(graph_id : string) ~(rev : int) ~(op_id : Wire.t)
    ~(blocks : Wire.t) ~(deleted_block_uuids : string list)
    ~(affected_keys : Wire.t list) ~(tx_report : tx_report) : Wire.t =
  (* validate-input! *)
  (match rev with
   | _ when rev < 0 ->
       fail "Invalid renderer revision"
         (Wire.Map [ kw "rev", Wire.Int rev ])
   | _ -> ());
  validate_blocks blocks;
  let deleted_wire =
    Wire.Set (List.map (fun u -> Wire.Uuid u) deleted_block_uuids)
  in
  validate_deleted_block_uuids deleted_wire;
  let block_keys =
    match blocks with
    | Wire.Map kvs ->
        List.filter_map
          (fun (k, _) -> match k with Wire.Uuid u -> Some u | _ -> None)
          kvs
    | _ -> []
  in
  (match
     List.find_opt (fun u -> List.mem u deleted_block_uuids) block_keys
   with
   | Some u ->
       fail "Block cannot be replaced and deleted"
         (Wire.Map [ kw "block-uuid", Wire.Uuid u ])
   | None -> ());
  let deleted =
    deleted_block_uuids
    |> Sync_state.distinct_by Fun.id
    |> List.map
         (fun u ->
            let db_id =
              match
                Seq.uncons
                  (Datascript.datoms tx_report.db_before Datascript.Avet
                     ~a:"block/uuid" ~v:(Uuid u) ())
              with
              | Some (d, _) -> Some d.e
              | None -> None
            in
            ( Wire.Uuid u
            , Wire.Map
                (List.filter_map Fun.id
                   [ Some (kw "rev", Wire.Int rev)
                   ; Option.map
                       (fun id -> (kw "db/id", Wire.Int id))
                       db_id ]) ))
    |> fun kvs -> Wire.Map kvs
  in
  Wire.Map
    [ kw "graph-id", Wire.String graph_id
    ; kw "rev", Wire.Int rev
    ; kw "op-id", op_id
    ; kw "blocks", blocks
    ; kw "deleted", deleted
    ; kw "children", build_children_patches rev tx_report
    ; ( kw "affected-keys"
      , Wire.Set affected_keys ) ]
