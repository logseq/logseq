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
  (* group rm/up pairs by parent_uuid without assoc scans; [touches]
     records every parent touched (newest first) so the output keeps the
     assoc version's last-touch-recency order. *)
  let groups = Hashtbl.create 16 and touches = ref [] in
  let put uuid is_removal pair =
    touches := uuid :: !touches;
    let rm, up =
      match Hashtbl.find_opt groups uuid with
      | Some (rm, up) -> (rm, up)
      | None -> ([], [])
    in
    if is_removal then Hashtbl.replace groups uuid (pair :: rm, up)
    else Hashtbl.replace groups uuid (rm, pair :: up)
  in
  List.iter
    (fun entity_id ->
       let before = membership_at db_before entity_id in
       let after = membership_at db_after entity_id in
       if membership_eq before after then ()
       else begin
         (match before with
          | Some m -> put m.parent_uuid true (m.block_uuid, m.order)
          | None -> ());
         match after with
         | Some m -> put m.parent_uuid false (m.block_uuid, m.order)
         | None -> ()
       end)
    (List.rev (structural_entity_ids tx_report.tx_data));
  let emitted = Hashtbl.create (Hashtbl.length groups) in
  List.filter_map
    (fun uuid ->
       if Hashtbl.mem emitted uuid then None
       else (
         Hashtbl.replace emitted uuid ();
         match Hashtbl.find_opt groups uuid with
         | Some (rm, up) -> Some (uuid, (List.rev rm, List.rev up))
         | None -> None))
    !touches

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

(* ---------- order-list-index propagation ----------

   A child's derived :block.temp/order-list-index depends on its
   left-sibling chain and on its count of same-type ancestors, so
   reordering or reparenting one sibling can renumber neighbours whose
   own datoms did not change.  canonical-blocks only refreshes entities
   that appear in tx-data, so the emitted index is recomputed for the
   children of every parent touched by a membership or order-list-type
   datom (and for the descendants of entities whose type or parent
   changed, where the ancestor count moves) and the uuids whose value
   differs are reported as extra block replacements. *)

type index_marker =
  | Absent
  | Present of Wire.t

(* emitted value, identical to the field entity-forward-map attaches:
   absent when the block has no order-list-type, Nil when the index
   itself is unrepresentable *)
let index_marker_of (b : entity) : index_marker =
  match Plain_value.order_list_type b with
  | None -> Absent
  | Some lt -> (
      Present
        (match Plain_value.order_list_index b lt with
         | Some v -> v
         | None -> Wire.Nil))

(* markers for a whole sorted sibling list in one pass — equivalent to
   index_marker_of per child but the left-chain index and ancestor-type
   counts are memoized, so the list costs O(children) sibling seeks
   instead of O(children x chain-length) *)
let sibling_index_markers (children : entity list)
    : (entity_id, index_marker) Hashtbl.t =
  let idx_of = Hashtbl.create 16 and ancestor_chain = Hashtbl.create 16 in
  let type_of (b : entity) = Plain_value.order_list_type b in
  (* consecutive entities on the parent chain, b included, typed lt.
     Pre-seeding 0 before recursing doubles as an in-progress mark — a
     :block/parent cycle then contributes its chain once instead of
     looping (post-order memo alone never lands on a cycle). *)
  let rec typed_chain (b : entity) (lt : string) : int =
    match Hashtbl.find_opt ancestor_chain (b.id, lt) with
    | Some n -> n
    | None ->
        Hashtbl.replace ancestor_chain (b.id, lt) 0;
        let n =
          match type_of b with
          | Some t when String.equal t lt ->
              1
              +
              (match Ldb.ref_ent b "block/parent" with
               | Some p -> typed_chain p lt
               | None -> 0)
          | _ -> 0
        in
        Hashtbl.replace ancestor_chain (b.id, lt) n;
        n
  in
  let markers = Hashtbl.create (List.length children) in
  List.iter
    (fun (c : entity) ->
       match type_of c with
       | None -> Hashtbl.replace markers c.id Absent
       | Some lt ->
           (* a left sibling is always a lower-order member of the same
              list, hence already visited *)
           let idx =
             match Ldb.get_left_sibling c with
             | Some l -> (
                 match type_of l with
                 | Some t when String.equal t lt -> (
                     match Hashtbl.find_opt idx_of l.id with
                     | Some i -> i + 1
                     | None -> 1)
                 | _ -> 1)
             | None -> 1
           in
           Hashtbl.replace idx_of c.id idx;
           let parents_count = typed_chain c lt - 1 in
           let delta =
             if parents_count < 0 then 0 else parents_count mod 3
           in
           let v =
             match delta with
             | 0 -> Some (Wire.Int idx)
             | 1 -> (
                 match Plain_value.number_to_letters idx with
                 | Some s -> Some (Wire.String (Unicode.lowercase s))
                 | None -> None)
             | _ -> (
                 match Plain_value.number_to_roman idx with
                 | Some s -> Some (Wire.String s)
                 | None -> None)
           in
           Hashtbl.replace markers c.id
             (Present (Option.value v ~default:Wire.Nil)))
    children;
  markers

(* the sibling list the touched entity participates in on `db`; its
   disposition is read on `e_db` because the entity itself may be absent
   from `db` (deleted/moved). Returns (variant-key, children): the key is
   the property-child's id or 0 for the ordinary children list *)
let sibling_list_for_parent (db : db) (e_db : db) (eid : entity_id)
    (pid : entity_id) : entity_id * entity list =
  match entity db (Entity_id pid) with
  | None -> (0, [])
  | Some p -> (
      match entity e_db (Entity_id eid) with
      | Some e
        when Ldb.closed_value e
             || Ldb.ref_ids e "logseq.property/created-from-property" <> []
        ->
          (e.id, Ldb.block_children_or_property_children e p)
      | _ -> (0, Ldb.get_children p))

(* entity ids whose emitted :block.temp/order-list-index differs between
   db_before and db_after *)
let order_list_shifted_eids (r : tx_report) : entity_id list =
  let relevant (a : attr) =
    List.exists (String.equal a) membership_affecting_attrs
    || String.equal a "logseq.property/order-list-type"
  in
  (* an order-list-type ref value's label feeds the effective type: a
     title/name change on it flips its referrers' type, so they are
     treated as touched (and as type-changed for descendants) *)
  let referrers =
    r.tx_data
    |> List.filter_map (fun (d : datom) ->
           if d.a = "block/title" || d.a = "block/name" then Some d.e
           else None)
    |> List.sort_uniq compare
    |> List.concat_map (fun eid ->
           List.concat_map
             (fun db ->
                datoms db Aevt ~a:"logseq.property/order-list-type"
                  ~v:(Ref eid) ()
                |> Seq.fold_left (fun acc (d : datom) -> d.e :: acc) [])
             [ r.db_before; r.db_after ])
    |> List.sort_uniq compare
  in
  let touched =
    r.tx_data
    |> List.filter_map (fun (d : datom) ->
           if relevant d.a then Some d.e else None)
    |> List.append referrers
    |> List.sort_uniq compare
  in
  if touched = [] then []
  else begin
    (* does pid own >=1 order-list-typed child on this db — memoized per
       (side, pid) and bounded by that parent's children; only those
       parents can hold a meaningful marker diff, so untyped parents skip
       the O(children) marker pass entirely. The old whole-attr
       Aevt scan cost O(#order-list-type datoms) per tx. *)
    let typed_tbls = [| Hashtbl.create 16; Hashtbl.create 16 |] in
    let typed_parent (side : int) (db : db) (pid : entity_id) : bool =
      let tbl = typed_tbls.(side) in
      match Hashtbl.find_opt tbl pid with
      | Some b -> b
      | None ->
          let b =
            Seq.exists
              (fun (d : datom) ->
                 Option.is_some
                   (Seq.uncons
                      (datoms db Eavt ~e:d.e
                         ~a:"logseq.property/order-list-type" ())))
              (datoms db Avet ~a:"block/parent" ~v:(Ref pid) ())
          in
          Hashtbl.replace tbl pid b;
          b
    in
    let shifted = Hashtbl.create 16 and marker_tbls = Hashtbl.create 4 in
    let markers (side : int) (eid : entity_id) (pid : entity_id)
        : (entity_id, index_marker) Hashtbl.t =
      let db = if side = 0 then r.db_before else r.db_after in
      let e_db =
        match entity db (Entity_id eid) with
        | Some _ -> db
        | None -> if side = 0 then r.db_after else r.db_before
      in
      let variant, children = sibling_list_for_parent db e_db eid pid in
      let key = (side, pid, variant) in
      match Hashtbl.find_opt marker_tbls key with
      | Some t -> t
      | None ->
          let t = sibling_index_markers children in
          Hashtbl.replace marker_tbls key t;
          t
    in
    let diff (before : (entity_id, index_marker) Hashtbl.t)
        (after : (entity_id, index_marker) Hashtbl.t) : unit =
      Hashtbl.iter
        (fun cid m_before ->
           let m_after =
             Option.value (Hashtbl.find_opt after cid) ~default:Absent
           in
           if m_before <> m_after then Hashtbl.replace shifted cid ())
        before;
      Hashtbl.iter
        (fun cid m_after ->
           if not (Hashtbl.mem before cid) then
             match m_after with
             | Present _ -> Hashtbl.replace shifted cid ()
             | Absent -> ())
        after
    in
    let mark_descendants (eid : entity_id) : unit =
      (* marker diff needs the entity only when the node actually has an
         order-list-type — untyped children stay Absent at probe cost. *)
      let marker_of (db : db) (cid : entity_id) : index_marker =
        match
          Seq.uncons
            (datoms db Eavt ~e:cid ~a:"logseq.property/order-list-type" ())
        with
        | None -> Absent
        | Some _ -> (
            match entity db (Entity_id cid) with
            | Some b -> index_marker_of b
            | None -> Absent)
      in
      let seen = Hashtbl.create 16 in
      let rec walk (cid : entity_id) : unit =
        if not (Hashtbl.mem seen cid) then begin
          Hashtbl.add seen cid ();
          let m_before = marker_of r.db_before cid
          and m_after = marker_of r.db_after cid in
          if m_before <> m_after then Hashtbl.replace shifted cid ();
          Seq.iter
            (fun (d : datom) -> walk d.e)
            (datoms r.db_after Avet ~a:"block/parent" ~v:(Ref cid) ())
        end
      in
      Seq.iter
        (fun (d : datom) -> walk d.e)
        (datoms r.db_after Avet ~a:"block/parent" ~v:(Ref eid) ())
    in
    (* per-eid tx_data scans were O(touched x tx_size) — prebuild the two
       membership tables once. *)
    let referrer_tbl = Hashtbl.create (List.length referrers) in
    List.iter (fun id -> Hashtbl.replace referrer_tbl id ()) referrers;
    let shift_trigger_eids = Hashtbl.create 64 in
    List.iter
      (fun (d : datom) ->
         if d.a = "logseq.property/order-list-type" || d.a = "block/parent" then
           Hashtbl.replace shift_trigger_eids d.e ())
      r.tx_data;
    List.iter
      (fun eid ->
         let pids =
           [ r.db_before; r.db_after ]
           |> List.filter_map (fun db ->
                  match
                    Seq.uncons (datoms db Eavt ~e:eid ~a:"block/parent" ())
                  with
                  | Some ({ v = Ref pid; _ }, _) -> Some pid
                  | _ -> None)
           |> List.sort_uniq compare
         in
         List.iter
           (fun pid ->
              if
                typed_parent 0 r.db_before pid
                || typed_parent 1 r.db_after pid
              then diff (markers 0 eid pid) (markers 1 eid pid))
           pids;
         if
           Hashtbl.mem referrer_tbl eid
           || Hashtbl.mem shift_trigger_eids eid
         then mark_descendants eid)
      touched;
    Hashtbl.fold (fun eid () acc -> eid :: acc) shifted []
  end

(* uuids of blocks whose derived order-list-index moved — extra block
   replacements so the renderer refreshes displaced siblings' numbers *)
let order_list_shifted_uuids (r : tx_report) : string list =
  order_list_shifted_eids r
  |> List.filter_map (fun eid ->
         match entity r.db_after (Entity_id eid) with
         | Some e -> (
             match Ldb.value e "block/uuid" with
             | Some (Uuid u) -> Some u
             | _ -> None)
         | None -> None)

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
